#!/usr/bin/env python3
"""
WP20 — Facebook-group sighting monitor.

Polls the community channels marked monitor_enabled in kb_channels, runs each
post photo through the visual-match pipeline, and turns high-confidence matches
into CANDIDATE sightings that flow into the owner triage loop (WP17).

Crucially it captures the REAL post time (observed_time_source='social_post')
with an uncertainty band — closing the "Facebook said 2h ago but it was 10h" bug
(WP16) at the source.

Pipeline per post:
  download image → upload to staging → POST /api/bot/search-similar
  → if top score ≥ MATCH_THRESHOLD, insert a candidate sighting (owner_verdict NULL).

Modes:
  SIMULATION_MODE=1 → read posts from a fixtures JSON (--fixtures), no FB access.
  (real)            → fetch_fb_posts(); requires an authenticated browser profile
                      and ToS acceptance. Left guarded until creds are provisioned.

Usage:
  SIMULATION_MODE=1 python scripts/monitor_fb.py --fixtures fixtures/fb_posts.json
  python scripts/monitor_fb.py            # real mode (needs auth profile)

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEB_APP_URL, INTERNAL_API_TOKEN
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from supabase import create_client, Client  # noqa: E402

MATCH_THRESHOLD = float(os.environ.get("FB_MATCH_THRESHOLD", "0.55"))
STAGING_BUCKET = "case-images-original"
SIMULATION_MODE = os.environ.get("SIMULATION_MODE", "") in ("1", "true", "True")


def _db() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_SERVICE_KEY"],
    )


def _time_uncertainty_hours(confidence: str, source: str) -> float:
    by_conf = {"exact": 0, "approximate": 2, "unknown": 6}.get(confidence, 6)
    by_src = {"social_post": 4, "secondhand": 3, "firsthand": 0}.get(source, 0)
    return by_conf + by_src


def load_monitored_channels(db: Client) -> list[dict]:
    res = (
        db.table("kb_channels")
        .select("id, name, municipality, external_ref, last_polled_at, channel_type")
        .eq("monitor_enabled", True)
        .execute()
    )
    return res.data or []


def fetch_fb_posts(channel: dict, since: str | None) -> list[dict]:
    """
    Real FB fetch. Requires an authenticated browser profile (hyperresearch
    `setup`) or a Graph API token with the right group permissions, plus ToS
    acceptance. Until those creds are provisioned this raises so we never
    silently pretend to monitor.

    Expected post shape:
      { "image_url": str, "posted_at": iso8601, "permalink": str,
        "municipality": str | None, "zone": str | None, "text": str | None }
    """
    raise NotImplementedError(
        "Real Facebook fetch needs an authenticated login profile + ToS acceptance. "
        "Run `hyperresearch setup` to create a profile, wire it here, then remove this guard. "
        "Use SIMULATION_MODE=1 --fixtures <file> to test the pipeline meanwhile."
    )


def load_fixture_posts(path: str) -> list[dict]:
    with open(path) as f:
        data = json.load(f)
    # fixtures: { "<channel_name>": [post, ...] } or a flat [post, ...]
    return data


def posts_for_channel(channel: dict, fixtures, since: str | None) -> list[dict]:
    if SIMULATION_MODE:
        if isinstance(fixtures, dict):
            return fixtures.get(channel["name"], [])
        return fixtures or []
    return fetch_fb_posts(channel, since)


def embed_and_match(web_url: str, token: str, staged_path: str, municipality: str | None) -> list[dict]:
    payload: dict = {"stagedPhotoPath": staged_path, "limit": 5}
    if municipality:
        payload["municipality"] = municipality
    with httpx.Client(timeout=40) as client:
        resp = client.post(
            f"{web_url}/api/bot/search-similar",
            json=payload,
            headers={"x-internal-token": token},
        )
    if resp.status_code != 200:
        print(f"  search-similar failed: {resp.status_code} {resp.text[:120]}")
        return []
    body = resp.json()
    if body.get("fallback"):
        print("  ML unavailable (fallback) — skipping")
        return []
    return body.get("data", [])


def upload_image(db: Client, image_bytes: bytes) -> str:
    path = f"fb-monitor/{uuid.uuid4().hex}.jpg"
    db.storage.from_(STAGING_BUCKET).upload(
        path=path,
        file=image_bytes,
        file_options={"content-type": "image/jpeg", "upsert": "true"},
    )
    return path


def download_image(post: dict) -> bytes | None:
    url = post.get("image_url")
    if not url:
        return None
    # Fixtures may point at a local file path for offline testing.
    if SIMULATION_MODE and os.path.exists(url):
        with open(url, "rb") as f:
            return f.read()
    try:
        with httpx.Client(timeout=30) as client:
            r = client.get(url)
            r.raise_for_status()
            return r.content
    except Exception as exc:
        print(f"  image download failed: {exc}")
        return None


def create_candidate_sighting(db: Client, case_id: str, post: dict, score: float, channel: dict) -> None:
    posted_at = post.get("posted_at") or datetime.now(timezone.utc).isoformat()
    # FB post times are notoriously misleading → unknown confidence, social source.
    confidence = "unknown"
    source = "social_post"
    municipality = post.get("municipality") or channel.get("municipality") or "Algarve"
    zone = post.get("zone") or f"via grupo FB: {channel['name']}"
    permalink = post.get("permalink", "")
    text = (post.get("text") or "")[:300]
    description = (
        f"[Candidato automático · match {round(score * 100)}%] "
        f"Detectado no grupo {channel['name']}. {text} {permalink}".strip()
    )
    db.table("sightings").insert({
        "case_id": case_id,
        "seen_at": posted_at,
        "municipality": municipality,
        "zone_approx": zone,
        "description": description,
        "observed_time_confidence": confidence,
        "observed_time_source": source,
        "time_uncertainty_hours": _time_uncertainty_hours(confidence, source),
        "is_public": False,
        # owner_verdict stays NULL → appears in the owner triage panel (WP17)
    }).execute()
    print(f"  → candidate sighting created for case {case_id[:8]} (match {round(score*100)}%)")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fixtures", help="path to fixtures JSON (SIMULATION_MODE)")
    ap.add_argument("--threshold", type=float, default=MATCH_THRESHOLD)
    args = ap.parse_args()

    web_url = os.environ.get("WEB_APP_URL", "http://localhost:3001")
    token = os.environ.get("INTERNAL_API_TOKEN", "")
    if not token:
        print("INTERNAL_API_TOKEN not set — cannot call search-similar")
        return 1

    db = _db()
    fixtures = None
    if SIMULATION_MODE:
        if not args.fixtures:
            print("SIMULATION_MODE requires --fixtures <file>")
            return 1
        fixtures = load_fixture_posts(args.fixtures)

    channels = load_monitored_channels(db)
    if not channels:
        print("No monitored channels (kb_channels.monitor_enabled = true). Nothing to poll.")
        return 0

    print(f"Polling {len(channels)} channel(s) · threshold {args.threshold} · sim={SIMULATION_MODE}")
    total_candidates = 0

    for ch in channels:
        print(f"• {ch['name']} ({ch.get('municipality','?')})")
        try:
            posts = posts_for_channel(ch, fixtures, ch.get("last_polled_at"))
        except NotImplementedError as exc:
            print(f"  {exc}")
            continue

        for post in posts:
            img = download_image(post)
            if not img:
                continue
            staged = upload_image(db, img)
            matches = embed_and_match(web_url, token, staged, post.get("municipality") or ch.get("municipality"))
            if not matches:
                continue
            top = matches[0]
            score = float(top.get("similarityScore", 0))
            if score >= args.threshold:
                create_candidate_sighting(db, top["caseId"], post, score, ch)
                total_candidates += 1
            else:
                print(f"  top match {round(score*100)}% below threshold — skip")

        db.table("kb_channels").update(
            {"last_polled_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", ch["id"]).execute()

    print(f"Done. {total_candidates} candidate sighting(s) created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
