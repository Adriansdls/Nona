"""Classifieds scanner orchestrator — full pipeline.

Pipeline per scan:
  1. Load enabled sources from classified_sources
  2. For each source: call source-specific scraper
  3. For each new listing: download first image, stage to Supabase Storage
  4. For each staged image: embed via ML service (POST /embed-only)
  5. For each embedding: search_similar_cases_for_classified RPC against active perdido cases
  6. Composite scoring: visual + location + temporal + attribute signals
  7. For composite >= THRESHOLD_HIGH (0.70): insert suspicious_matches (priority='high'),
     notify owner via Telegram PM + log
  8. For composite 0.60-0.70: insert suspicious_matches (priority='medium'), log only
  9. For composite < 0.60: skip
 10. Update source last_scan_at, last_scan_status

Composite scoring model:
  composite = w_visual * visual + w_location * location + w_temporal * temporal + w_attribute * attribute

  visual:    cosine similarity from ML (0-1)
  location:  1.0 same muni, 0.6 adjacent, 0.2 same Algarve, 0.0 unknown
  temporal:  1.0 if listing within 48h of loss, 0.7 within 7d, 0.4 within 30d, 0.1 >30d
  attribute: breed+color+size match from hints (0-1)

  weights: visual=0.50, location=0.25, temporal=0.15, attribute=0.10

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ML_SERVICE_URL, WEB_APP_URL, INTERNAL_API_TOKEN
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from supabase import Client

from jobs.matching import MUNICIPALITY_ADJACENCY
from jobs.scrapers.base import BaseScraper
from jobs.scrapers.olx import OlxScraper
from jobs.scrapers.custojusto import CustoJustoScraper

log = logging.getLogger(__name__)

THRESHOLD_HIGH = float(os.environ.get("CLASSIFIEDS_MATCH_THRESHOLD_HIGH", "0.70"))
THRESHOLD_MEDIUM = float(os.environ.get("CLASSIFIEDS_MATCH_THRESHOLD_MEDIUM", "0.60"))
STAGING_BUCKET = "case-images-original"
ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL", "")
WEB_APP_URL = os.environ.get("WEB_APP_URL", "https://salvacao.pt")
INTERNAL_API_TOKEN = os.environ.get("INTERNAL_API_TOKEN", "")
RETENTION_DAYS = int(os.environ.get("CLASSIFIEDS_RETENTION_DAYS", "90"))

W_VISUAL = 0.50
W_LOCATION = 0.25
W_TEMPORAL = 0.15
W_ATTRIBUTE = 0.10

ALGARVE_MUNICIPALITIES = {
    "Faro", "Olhão", "Lagos", "Portimão", "Albufeira", "Loulé",
    "Silves", "Lagoa", "Tavira", "São Brás de Alportel",
    "Vila Real de Santo António", "Monchique", "Aljezur",
    "Vila do Bispo", "Castro Marim", "Alcoutim",
}

SCRAPER_MAP: dict[str, type[BaseScraper]] = {
    "olx_pt": OlxScraper,
    "custojusto_pt": CustoJustoScraper,
}


async def run_classifieds_scan(db: Client) -> dict[str, int]:
    """Run a full classifieds scan. Returns stats dict."""
    stats = {
        "listings_scraped": 0,
        "listings_new": 0,
        "images_downloaded": 0,
        "images_embedded": 0,
        "high_matches": 0,
        "medium_matches": 0,
        "low_skipped": 0,
        "errors": 0,
    }

    sources_res = (
        db.table("classified_sources")
        .select("*")
        .eq("scan_enabled", True)
        .execute()
    )
    sources = sources_res.data or []

    if not sources:
        log.info("No enabled classified sources to scan")
        return stats

    for source in sources:
        source_name = source["name"]
        scraper_cls = SCRAPER_MAP.get(source_name)
        if not scraper_cls:
            log.warning("No scraper for source", source=source_name)
            continue

        scraper = scraper_cls(source, db)
        log.info("Starting classifieds scan", source=source_name)

        try:
            listings = await scraper.scrape(since=source.get("last_scan_at"))
        except Exception as exc:
            log.error("Scraper failed", source=source_name, error=str(exc))
            stats["errors"] += 1
            scraper.update_source_status("error")
            continue

        stats["listings_scraped"] += len(listings)
        log.info("Scraped listings", source=source_name, count=len(listings))

        for listing_data in listings:
            try:
                listing_id = _upsert_listing(db, source, listing_data)
                if not listing_id:
                    continue

                stats["listings_new"] += 1

                image_urls = listing_data.get("image_urls") or []
                for idx, img_url in enumerate(image_urls[:2]):
                    try:
                        staged_path = await _download_and_stage(db, img_url, listing_id, idx)
                        if not staged_path:
                            continue

                        stats["images_downloaded"] += 1

                        embedding = await _embed_image(staged_path)
                        if not embedding:
                            continue

                        stats["images_embedded"] += 1

                        _save_image_embedding(
                            db, listing_id, img_url, staged_path, embedding
                        )

                        match_count = await _match_and_alert(
                            db, listing_id, listing_data, embedding
                        )
                        if match_count["high"] > 0:
                            stats["high_matches"] += match_count["high"]
                        if match_count["medium"] > 0:
                            stats["medium_matches"] += match_count["medium"]
                        if match_count["low"] > 0:
                            stats["low_skipped"] += match_count["low"]

                    except Exception as exc:
                        log.error("Failed to process image", url=img_url, error=str(exc))
                        stats["errors"] += 1

            except Exception as exc:
                log.error("Failed to process listing", error=str(exc))
                stats["errors"] += 1

    _cleanup_old_listings(db)

    log.info(
        "Classifieds scan complete",
        scraped=stats["listings_scraped"],
        new=stats["listings_new"],
        images=stats["images_downloaded"],
        embedded=stats["images_embedded"],
        high=stats["high_matches"],
        medium=stats["medium_matches"],
        errors=stats["errors"],
    )

    return stats


def _upsert_listing(db: Client, source: dict, data: dict) -> str | None:
    """Insert a new listing. Returns listing ID or None if duplicate."""
    try:
        existing = (
            db.table("classified_listings")
            .select("id")
            .eq("source_id", source["id"])
            .eq("external_id", data["external_id"])
            .limit(1)
            .execute()
        )
        if existing.data:
            return None

        res = (
            db.table("classified_listings")
            .insert({
                "source_id": source["id"],
                "external_id": data["external_id"],
                "title": data.get("title"),
                "price": data.get("price"),
                "location_raw": data.get("location_raw"),
                "municipality": data.get("municipality"),
                "description": data.get("description"),
                "listing_url": data["listing_url"],
                "image_urls": data.get("image_urls", []),
                "posted_at": data.get("posted_at"),
                "is_dog": data.get("is_dog", True),
                "breed_hint": data.get("breed_hint"),
                "size_hint": data.get("size_hint"),
                "color_hint": data.get("color_hint"),
                "scan_batch_id": data.get("scan_batch_id"),
            })
            .execute()
        )
        return res.data[0]["id"] if res.data else None
    except Exception as exc:
        log.error("Failed to upsert listing", external_id=data.get("external_id"), error=str(exc))
        return None


async def _download_and_stage(
    db: Client, image_url: str, listing_id: str, idx: int
) -> str | None:
    """Download image from URL and stage to Supabase Storage. Returns storage path."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(image_url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            })
            if resp.status_code != 200:
                log.warning("Image download failed", url=image_url, status=resp.status_code)
                return None
            image_bytes = resp.content

    except Exception as exc:
        log.warning("Image download error", url=image_url, error=str(exc))
        return None

    staged_path = f"classifieds/{listing_id[:8]}/{uuid.uuid4().hex[:12]}.jpg"

    try:
        db.storage.from_(STAGING_BUCKET).upload(
            path=staged_path,
            file=image_bytes,
            file_options={"content-type": "image/jpeg"},
        )
    except Exception as exc:
        if "already exists" in str(exc).lower():
            return staged_path
        log.warning("Storage upload failed", path=staged_path, error=str(exc))
        return None

    return staged_path


async def _embed_image(staged_path: str) -> list[float] | None:
    """Call ML service to embed a staged image. Returns 1536-dim vector or None."""
    if not ML_SERVICE_URL:
        log.warning("ML_SERVICE_URL not set — skipping embedding")
        return None

    payload = {"stagedPhotoPath": staged_path}
    headers = {}
    if INTERNAL_API_TOKEN:
        headers["x-internal-token"] = INTERNAL_API_TOKEN

    try:
        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.post(
                f"{WEB_APP_URL}/api/bot/search-similar",
                json=payload,
                headers=headers,
            )
        if resp.status_code != 200:
            log.warning("ML embed failed", path=staged_path, status=resp.status_code)
            return None

        body = resp.json()
        embedding = body.get("embedding")
        if embedding and len(embedding) == 1536:
            return embedding
        log.warning("Invalid embedding from ML service", path=staged_path)
        return None
    except Exception as exc:
        log.error("ML embed error", path=staged_path, error=str(exc))
        return None


def _save_image_embedding(
    db: Client,
    listing_id: str,
    image_url: str,
    storage_path: str,
    embedding: list[float],
) -> None:
    """Save classified image + embedding to database."""
    try:
        db.table("classified_images").insert({
            "listing_id": listing_id,
            "image_url": image_url,
            "storage_path": storage_path,
            "embedding": embedding,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception as exc:
        log.error("Failed to save embedding", listing_id=listing_id, error=str(exc))


def _score_location(listing_municipality: str | None, case_municipality: str | None) -> float:
    if not listing_municipality or not case_municipality:
        return 0.0
    lm = listing_municipality.strip()
    cm = case_municipality.strip()
    if lm.lower() == cm.lower():
        return 1.0
    if cm in MUNICIPALITY_ADJACENCY.get(lm, set()) or lm in MUNICIPALITY_ADJACENCY.get(cm, set()):
        return 0.6
    if lm in ALGARVE_MUNICIPALITIES and cm in ALGARVE_MUNICIPALITIES:
        return 0.2
    return 0.0


def _score_temporal(listing_posted_at: str | None, case_last_seen_at: str | None) -> float:
    if not listing_posted_at or not case_last_seen_at:
        return 0.3
    try:
        posted = datetime.fromisoformat(listing_posted_at)
        lost = datetime.fromisoformat(case_last_seen_at)
        if posted.tzinfo is None:
            posted = posted.replace(tzinfo=timezone.utc)
        if lost.tzinfo is None:
            lost = lost.replace(tzinfo=timezone.utc)
        days_after = (posted - lost).days
    except (ValueError, TypeError):
        return 0.3

    if days_after < 0:
        return 0.0
    if days_after <= 2:
        return 1.0
    if days_after <= 7:
        return 0.7
    if days_after <= 30:
        return 0.4
    return 0.1


def _score_attribute(listing_data: dict, case_data: dict) -> float:
    score = 0.0
    count = 0

    breed_hint = (listing_data.get("breed_hint") or "").lower()
    case_breed = (case_data.get("breed") or "").lower()
    if breed_hint and case_breed:
        count += 1
        if breed_hint == case_breed or breed_hint in case_breed or case_breed in breed_hint:
            score += 1.0
        elif breed_hint in ("vira-lata", "vira lata", "mestiço", "mestico"):
            score += 0.3

    color_hint = (listing_data.get("color_hint") or "").lower()
    case_color = (case_data.get("primary_color") or "").lower()
    if color_hint and case_color:
        count += 1
        if color_hint in case_color or case_color in color_hint:
            score += 1.0
        elif color_hint == "malhado" and case_color:
            score += 0.5

    size_hint = (listing_data.get("size_hint") or "").lower()
    case_size = (case_data.get("size") or "").lower()
    if size_hint and case_size:
        count += 1
        if size_hint == case_size:
            score += 1.0

    if count == 0:
        return 0.5
    return score / count


def compute_composite_score(
    visual_score: float,
    listing_data: dict,
    case_data: dict,
) -> float:
    location_score = _score_location(
        listing_data.get("municipality"),
        case_data.get("last_seen_municipality"),
    )
    temporal_score = _score_temporal(
        listing_data.get("posted_at"),
        case_data.get("last_seen_at"),
    )
    attribute_score = _score_attribute(listing_data, case_data)

    composite = (
        W_VISUAL * visual_score
        + W_LOCATION * location_score
        + W_TEMPORAL * temporal_score
        + W_ATTRIBUTE * attribute_score
    )
    return round(min(composite, 1.0), 4)


async def _match_and_alert(
    db: Client,
    listing_id: str,
    listing_data: dict,
    embedding: list[float],
) -> dict[str, int]:
    """Match classified image against active perdido cases. Composite scoring."""
    result = {"high": 0, "medium": 0, "low": 0}

    try:
        rpc_res = db.rpc(
            "search_similar_cases_for_classified",
            {
                "query_embedding": embedding,
                "municipality": listing_data.get("municipality"),
                "limit_count": 10,
            },
        ).execute()
    except Exception as exc:
        log.error("RPC search_similar_cases_for_classified failed", error=str(exc))
        return result

    matches = rpc_res.data or []

    if not matches:
        return result

    case_ids = [m["case_id"] for m in matches if m.get("case_id")]
    if not case_ids:
        return result

    cases_res = (
        db.table("cases")
        .select("id, dog_name, breed, primary_color, size, last_seen_municipality, last_seen_at, slug, reporter_telegram_id")
        .in_("id", case_ids)
        .eq("status", "ativo")
        .execute()
    )
    cases_by_id = {c["id"]: c for c in (cases_res.data or [])}

    for match in matches:
        case_id = match.get("case_id")
        visual_score = float(match.get("score", 0))
        if not case_id:
            continue

        case_data = cases_by_id.get(case_id)
        if not case_data:
            continue

        composite = compute_composite_score(visual_score, listing_data, case_data)

        if composite >= THRESHOLD_HIGH:
            priority = "high"
            result["high"] += 1
        elif composite >= THRESHOLD_MEDIUM:
            priority = "medium"
            result["medium"] += 1
        else:
            result["low"] += 1
            continue

        existing = (
            db.table("suspicious_matches")
            .select("id")
            .eq("classified_listing_id", listing_id)
            .eq("case_id", case_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            continue

        db.table("suspicious_matches").insert({
            "classified_listing_id": listing_id,
            "case_id": case_id,
            "similarity_score": composite,
            "priority": priority,
        }).execute()

        log.info(
            "Suspicious match",
            case_id=case_id[:8],
            composite=f"{composite:.2f}",
            visual=f"{visual_score:.2f}",
            listing_municipality=listing_data.get("municipality"),
            case_municipality=case_data.get("last_seen_municipality"),
            listing_posted=listing_data.get("posted_at"),
            case_lost=case_data.get("last_seen_at"),
            priority=priority,
        )

        if priority == "high":
            await _alert_owner(db, case_id, case_data, listing_data, composite, visual_score)

    return result


async def _alert_owner(
    db: Client, case_id: str, case_data: dict, listing_data: dict,
    composite_score: float, visual_score: float,
) -> None:
    """Send Telegram PM to case owner + log notification for high-confidence matches."""
    dog_name = case_data.get("dog_name") or "o seu cão"
    slug = case_data.get("slug", "")

    message = (
        f"⚠️ Alerta automático: encontrámos um anúncio de venda que pode ser {dog_name}.\n"
        f"Semelhança visual: {round(visual_score * 100)}% "
        f"(composta: {round(composite_score * 100)}%).\n"
        f"Anúncio: {listing_data.get('listing_url', '(link indisponível)')}\n"
        f"⚠️ NÃO contacte o vendedor directamente — fale connosco primeiro.\n"
        f"Ver caso: {WEB_APP_URL}/pt/caso/{slug}"
    )

    telegram_id = case_data.get("reporter_telegram_id")
    if telegram_id:
        try:
            db.table("case_notifications").insert({
                "case_id": case_id,
                "channel": "telegram",
                "telegram_id": int(telegram_id),
                "message": message,
            }).execute()
        except Exception as exc:
            log.error("Failed to queue owner notification", case_id=case_id, error=str(exc))

    log.info(
        "Suspicious match alert queued",
        case_id=case_id,
        listing=listing_data.get("listing_url"),
        composite=f"{composite_score:.2f}",
    )


def _cleanup_old_listings(db: Client) -> None:
    """Delete classified listings and images older than RETENTION_DAYS."""
    from datetime import timedelta

    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()

    try:
        old = (
            db.table("classified_listings")
            .select("id")
            .lt("scraped_at", cutoff)
            .execute()
        )
        if old.data:
            ids = [row["id"] for row in old.data]
            db.table("classified_images").delete().in_("listing_id", ids).execute()
            db.table("classified_listings").delete().in_("id", ids).execute()
            log.info("Cleaned up old listings", count=len(ids))
    except Exception as exc:
        log.error("Cleanup failed", error=str(exc))