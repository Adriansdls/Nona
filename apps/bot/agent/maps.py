"""
Static search-map rendering for alerts and the observer demo.

Google Static Maps (reuses GOOGLE_PLACES_API_KEY — requires the "Maps Static API"
to be enabled on that Google Cloud project). Draws:
  • the last-seen point (and any sighting points) as markers,
  • the search radius as a translucent circle (approximated by a polyline, since
    Static Maps has no native circle primitive).

Fail-safe: if the key is absent or the request fails, fetch_search_map_png returns
None and callers fall back to text — a map is never allowed to break an alert.

Honesty: at minute-0 we only have the coarse search radius + last-seen point. The
refined probability zone (WP17 posterior) only exists AFTER a sighting; render that
tighter circle only when it is actually computed.
"""
from __future__ import annotations

import logging
import math
import os

import httpx

log = logging.getLogger(__name__)

_STATIC = "https://maps.googleapis.com/maps/api/staticmap"


def _circle_points(lat: float, lng: float, radius_km: float, n: int = 36) -> list[tuple[float, float]]:
    """N points approximating a circle of radius_km around (lat,lng)."""
    pts: list[tuple[float, float]] = []
    dlat_per_km = 1.0 / 110.574
    dlng_per_km = 1.0 / (111.320 * max(0.01, math.cos(math.radians(lat))))
    for i in range(n + 1):  # +1 to close the ring
        theta = 2 * math.pi * i / n
        pts.append((
            lat + radius_km * dlat_per_km * math.cos(theta),
            lng + radius_km * dlng_per_km * math.sin(theta),
        ))
    return pts


def build_search_map_url(
    center: tuple[float, float],
    radius_km: float,
    markers: list[tuple[float, float, str, str]] | None = None,
    size: str = "640x420",
) -> str | None:
    """
    Build a Google Static Maps URL. center=(lat,lng). markers=[(lat,lng,label,color)].
    Returns None if no API key is configured.
    """
    key = (os.environ.get("GOOGLE_MAPS_API_KEY")
           or os.environ.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
           or os.environ.get("GOOGLE_PLACES_API_KEY") or "")
    if not key:
        return None

    lat, lng = center
    params: list[str] = [f"size={size}", "scale=2", "maptype=roadmap"]

    # Search-radius circle as a translucent filled polyline.
    ring = _circle_points(lat, lng, max(0.2, radius_km))
    path = "|".join(f"{p[0]:.5f},{p[1]:.5f}" for p in ring)
    params.append("path=" + _enc("color:0xE8531188|fillcolor:0xE8531133|weight:2|" + path))

    # Markers (last-seen + sightings). Static Maps auto-fits bounds to path+markers.
    for (mlat, mlng, label, color) in (markers or []):
        lbl = (label or "")[:1].upper()
        params.append("markers=" + _enc(f"color:{color}|label:{lbl}|{mlat:.5f},{mlng:.5f}"))

    return f"{_STATIC}?{'&'.join(params)}&key={key}"


def _enc(v: str) -> str:
    import urllib.parse
    return urllib.parse.quote(v, safe="")


def fetch_search_map_png(
    center: tuple[float, float],
    radius_km: float,
    markers: list[tuple[float, float, str, str]] | None = None,
) -> bytes | None:
    """Fetch the rendered map as PNG bytes (so the API key never transits to Telegram).
    Returns None on any failure — callers must fall back to text."""
    url = build_search_map_url(center, radius_km, markers)
    if not url:
        return None
    try:
        resp = httpx.get(url, timeout=10.0)
        if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image"):
            return resp.content
        log.warning("Static map render failed: status=%s type=%s body=%s",
                    resp.status_code, resp.headers.get("content-type"), resp.text[:200])
    except Exception as exc:
        log.warning("Static map fetch error: %s", exc)
    return None
