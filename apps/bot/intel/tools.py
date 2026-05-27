"""
Intel agent tool definitions + async executors.

Tool call sequence enforced by system prompt:
  classify_breed → get_municipality_profile → query_terrain (×2) → get_weather_context → submit_*
"""
from __future__ import annotations

import json
import math
import os
from typing import Any

import httpx

from .knowledge import classify_breed_with_size, get_municipality_profile as _get_muni_profile
from .models import BreedCategory, BehavioralPhase

_supabase_client: Any = None


def _get_supabase() -> Any:
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client
        _supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _supabase_client

OVERPASS_URLS = [
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

_OVERPASS_HEADERS = {
    "User-Agent": "SalvaCaoSearchBot/1.0 (dog-search coordination; contact@salvacao.pt)",
    "Accept": "application/json",
}

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def compute_behavioral_phase(hours_elapsed: float) -> BehavioralPhase:
    """Deterministic phase from elapsed time — no LLM involved."""
    if hours_elapsed <= 24.0:
        return BehavioralPhase.panic
    if hours_elapsed <= 168.0:  # 7 days
        return BehavioralPhase.survival
    return BehavioralPhase.recovery

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

INTEL_TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "classify_breed",
        "description": (
            "CALL FIRST. Returns behavioral profile and evidence-backed search radius for the breed. "
            "Deterministic lookup — no LLM. Includes temperament (gregarious/aloof/xenophobic) and "
            "behavioral warnings. Use result to determine zone radii and warnings field."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "breed": {"type": "string", "description": "Breed name as provided by owner"},
                "size": {"type": "string", "description": "Dog size: pequeno/médio/grande or small/medium/large"},
            },
            "required": ["breed", "size"],
        },
    },
    {
        "name": "get_municipality_profile",
        "description": (
            "CALL SECOND. Returns known terrain hazards for the Algarve municipality with Bombeiros "
            "rescue citations. Always include these hazards in your output — they are evidence-backed. "
            "Returns terrain type, documented hazards with sources, and field notes."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string", "description": "Algarve municipality name, e.g. 'Lagos', 'Faro'"},
            },
            "required": ["municipality"],
        },
    },
    {
        "name": "query_terrain",
        "description": (
            "Query Overpass API for real terrain features near the coordinates. "
            "Call TWICE: (1) feature_types=['wells','waterways'] and (2) feature_types=['railway','primary_roads']. "
            "Returns counts, names, and approximate distances. "
            "CRITICAL: OSM well data is extremely sparse for rural Algarve private land — "
            "absence of results does NOT mean no wells exist. State this explicitly if 0 wells returned."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "lat": {"type": "number", "description": "Latitude of last-seen point"},
                "lng": {"type": "number", "description": "Longitude of last-seen point"},
                "radius_km": {"type": "number", "description": "Search radius in km (default 3.0)", "default": 3.0},
                "feature_types": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["wells", "waterways", "railway", "primary_roads", "secondary_roads",
                                 "motorway", "forest", "farmland"],
                    },
                    "description": "Terrain features to query",
                },
            },
            "required": ["lat", "lng", "feature_types"],
        },
    },
    {
        "name": "get_weather_context",
        "description": (
            "Get current temperature and conditions at the location. "
            "Critical context: Algarve summer heat causes heatstroke in dogs in 15-30 min; "
            "zero surface water July–August means wells are the only water source, increasing well-fall risk. "
            "Include temperature in brief if > 28°C."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "lat": {"type": "number"},
                "lng": {"type": "number"},
            },
            "required": ["lat", "lng"],
        },
    },
    {
        "name": "lookup_local_resources",
        "description": (
            "Query the live KB for canils and vets in the case municipality. "
            "Call after get_municipality_profile. Results go into action_resources in submit_intel. "
            "If results are empty, call discover_resources to find vets via Google Places."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string", "description": "Algarve municipality name"},
            },
            "required": ["municipality"],
        },
    },
    {
        "name": "discover_resources",
        "description": (
            "When lookup_local_resources returns empty vets: query Google Places API for vet clinics "
            "near the case coordinates. Results are written to KB permanently. "
            "Only call if lookup_local_resources returned empty vets AND lat/lng are available."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string"},
                "resource_type": {"type": "string", "enum": ["vet", "canil"]},
                "lat": {"type": "number"},
                "lng": {"type": "number"},
            },
            "required": ["municipality", "resource_type", "lat", "lng"],
        },
    },
    {
        "name": "submit_intel",
        "description": (
            "TERMINAL. Submit final validated search intelligence. "
            "Only call after classify_breed, get_municipality_profile, query_terrain (×2), get_weather_context. "
            "Every zone and hazard MUST have evidence — no naked claims. "
            "Use confidence=low if terrain data was sparse. "
            "If data is genuinely insufficient, call submit_insufficient_data instead."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "breed_category": {
                    "type": "string",
                    "enum": [c.value for c in BreedCategory],
                    "description": "Breed category from classify_breed result",
                },
                "behavioral_phase": {
                    "type": "string",
                    "enum": [p.value for p in BehavioralPhase],
                    "description": "Time-based phase: panic=0-24h, survival=24h-7d, recovery=7d+. Must match hours_elapsed.",
                },
                "confidence": {
                    "type": "string",
                    "enum": ["high", "medium", "low"],
                    "description": "high: terrain data returned results AND breed classified. medium: breed classified, terrain sparse. low: significant data gaps.",
                },
                "brief": {
                    "type": "string",
                    "maxLength": 300,
                    "description": "2-3 sentences in PT: current situation + single most urgent action",
                },
                "brief_sources": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/EvidenceRef"},
                    "minItems": 1,
                    "description": "Must include breed study citation",
                },
                "zones": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/SearchZone"},
                    "minItems": 1,
                    "maxItems": 3,
                },
                "hazards": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/TerrainHazard"},
                    "description": "Empty list valid if no hazards found. Include municipality known hazards.",
                },
                "movement": {
                    "oneOf": [
                        {
                            "type": "object",
                            "properties": {
                                "sightings_used": {
                                    "type": "integer",
                                    "minimum": 2,
                                    "description": "Number of sightings used. Minimum 2 — enforced.",
                                },
                                "direction": {"type": "string", "description": "Cardinal/relative direction in PT"},
                                "speed_estimate": {"type": ["string", "null"]},
                                "pattern": {"type": "string", "maxLength": 200},
                                "evidence": {
                                    "type": "array",
                                    "items": {"$ref": "#/$defs/EvidenceRef"},
                                    "minItems": 1,
                                },
                            },
                            "required": ["sightings_used", "direction", "pattern", "evidence"],
                        },
                        {"type": "null"},
                    ],
                    "description": "Only include if 2+ sightings exist. null otherwise. sightings_used minimum=2 enforced.",
                },
                "warnings": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Critical behavioral warnings in PT",
                },
            },
            "required": ["breed_category", "behavioral_phase", "confidence", "brief", "brief_sources", "zones", "hazards", "warnings"],
            "$defs": {
                "EvidenceRef": {
                    "type": "object",
                    "properties": {
                        "source": {"type": "string", "description": "Citation: study, tool name, or Bombeiros record"},
                        "url": {"type": ["string", "null"]},
                        "detail": {"type": "string", "description": "One sentence: what this source says"},
                    },
                    "required": ["source", "detail"],
                },
                "SearchZone": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Zone name in PT e.g. 'Zona quente'"},
                        "radius_km": {"type": "number", "exclusiveMinimum": 0},
                        "color": {"type": "string", "enum": ["rose", "amber", "blue"]},
                        "instruction": {"type": "string", "maxLength": 250},
                        "checkpoints": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 1,
                            "maxItems": 5,
                        },
                        "evidence": {
                            "type": "array",
                            "items": {"$ref": "#/$defs/EvidenceRef"},
                            "minItems": 1,
                        },
                    },
                    "required": ["title", "radius_km", "color", "instruction", "checkpoints", "evidence"],
                },
                "TerrainHazard": {
                    "type": "object",
                    "properties": {
                        "label": {"type": "string"},
                        "note": {"type": "string"},
                        "severity": {"type": "string", "enum": ["critical", "high", "medium"]},
                        "evidence": {"$ref": "#/$defs/EvidenceRef"},
                    },
                    "required": ["label", "note", "severity", "evidence"],
                },
            },
        },
    },
    {
        "name": "submit_insufficient_data",
        "description": (
            "TERMINAL. Call when terrain data is genuinely insufficient for reliable recommendations. "
            "Must enumerate what was tried and what was missing. "
            "Partial breed context (radius model) is still valuable — include if breed was classifiable."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {"type": "string", "description": "Why reliable intel cannot be generated"},
                "what_was_tried": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 1,
                    "description": "Tools called and what they returned or failed to return",
                },
                "what_was_missing": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Data needed for reliable intel",
                },
                "partial_context": {
                    "type": ["string", "null"],
                    "description": "Any partial insight still useful e.g. breed radius",
                },
                "breed_category": {
                    "type": ["string", "null"],
                    "enum": [c.value for c in BreedCategory] + [None],  # type: ignore[list-item]
                    "description": "Include if breed was classifiable — radius still actionable",
                },
            },
            "required": ["reason", "what_was_tried", "what_was_missing"],
        },
    },
]


# ---------------------------------------------------------------------------
# Executors
# ---------------------------------------------------------------------------

async def execute_intel_tool(name: str, inputs: dict[str, Any]) -> str:
    """Dispatch tool call to async executor. Returns JSON string."""
    try:
        if name == "lookup_local_resources":
            return await _exec_lookup_local_resources(inputs)
        if name == "discover_resources":
            return await _exec_discover_resources(inputs)
        if name == "classify_breed":
            return await _exec_classify_breed(inputs)
        if name == "get_municipality_profile":
            return await _exec_municipality_profile(inputs)
        if name == "query_terrain":
            return await _exec_query_terrain(inputs)
        if name == "get_weather_context":
            return await _exec_weather(inputs)
        return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as exc:
        return json.dumps({"error": str(exc), "tool": name})


async def _exec_classify_breed(inputs: dict[str, Any]) -> str:
    breed = inputs.get("breed", "")
    size = inputs.get("size", "")
    profile = classify_breed_with_size(breed, size)
    return json.dumps({
        "breed_category": profile.category.value,
        "radius_km": profile.radius_km,
        "temperament": profile.temperament,
        "behavior": profile.behavior,
        "source": profile.source,
        "source_url": profile.source_url,
        "note": (
            "Use this radius_km as the basis for your zone radii. "
            "If temperament=xenophobic, add 'NÃO chamar' to warnings."
        ),
    })


async def _exec_municipality_profile(inputs: dict[str, Any]) -> str:
    muni = inputs.get("municipality", "")
    profile = _get_muni_profile(muni)
    if profile is None:
        return json.dumps({
            "found": False,
            "municipality": muni,
            "note": "Municipality not in knowledge base. EN125 and Linha do Algarve are present in all coastal municipalities.",
        })
    hazards = []
    for h in profile.known_hazards:
        hazards.append({
            "label": h.label,
            "severity": h.severity,
            "note": h.note,
            "evidence": {
                "source": h.evidence.source,
                "url": h.evidence.url,
                "detail": h.evidence.detail,
            },
        })
    return json.dumps({
        "found": True,
        "municipality": profile.municipality,
        "terrain": profile.terrain,
        "notes": profile.notes,
        "known_hazards": hazards,
        "instruction": (
            "Include ALL of these hazards in your submit_intel output. "
            "These are evidence-backed — do not drop them. "
            "Add severity=critical hazards to warnings if appropriate."
        ),
    })


_OVERPASS_QUERIES: dict[str, str] = {
    "wells": 'node["man_made"="water_well"](around:{r},{lat},{lng});',
    "waterways": (
        'way["waterway"~"river|stream|canal|drain"](around:{r},{lat},{lng});\n'
        '  relation["waterway"~"river"](around:{r},{lat},{lng});'
    ),
    "railway": 'way["railway"~"rail|light_rail"](around:{r},{lat},{lng});',
    "primary_roads": 'way["highway"~"primary|trunk|motorway"](around:{r},{lat},{lng});',
    "secondary_roads": 'way["highway"~"secondary|tertiary"](around:{r},{lat},{lng});',
    "motorway": 'way["highway"="motorway"](around:{r},{lat},{lng});',
    "forest": 'way["landuse"~"forest|wood"](around:{r},{lat},{lng});',
    "farmland": 'way["landuse"~"farmland|orchard|vineyard"](around:{r},{lat},{lng});',
}


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


async def _exec_query_terrain(inputs: dict[str, Any]) -> str:
    lat: float = inputs["lat"]
    lng: float = inputs["lng"]
    radius_km: float = float(inputs.get("radius_km", 3.0))
    feature_types: list[str] = inputs.get("feature_types", [])
    radius_m = int(radius_km * 1000)

    body_parts = []
    for ft in feature_types:
        template = _OVERPASS_QUERIES.get(ft)
        if template:
            body_parts.append(template.format(r=radius_m, lat=lat, lng=lng))

    if not body_parts:
        return json.dumps({"error": "No valid feature_types provided"})

    query = "[out:json][timeout:15];\n(\n  " + "\n  ".join(body_parts) + "\n);\nout geom qt;"

    last_err: str = ""
    for url in OVERPASS_URLS:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, data={"data": query}, headers=_OVERPASS_HEADERS)
                resp.raise_for_status()
                data = resp.json()
                elements = data.get("elements", [])

                summary: dict[str, Any] = {"radius_km": radius_km, "features": {}}
                for ft in feature_types:
                    summary["features"][ft] = {"count": 0, "items": []}

                for el in elements:
                    tags = el.get("tags", {})

                    # classify element
                    detected = _classify_element(tags)
                    for ft in feature_types:
                        if detected == ft:
                            item: dict[str, Any] = {}
                            name = tags.get("name") or tags.get("ref")
                            if name:
                                item["name"] = name

                            # approximate distance for nodes
                            if el.get("type") == "node":
                                el_lat = el.get("lat", lat)
                                el_lng = el.get("lon", lng)
                                dist = _haversine_km(lat, lng, el_lat, el_lng)
                                item["dist_km"] = round(dist, 2)

                            summary["features"][ft]["count"] += 1
                            if len(summary["features"][ft]["items"]) < 5:
                                summary["features"][ft]["items"].append(item)

                # Add advisory for empty well results
                if "wells" in feature_types and summary["features"]["wells"]["count"] == 0:
                    summary["well_osm_advisory"] = (
                        "OSM não tem dados de poços mapeados para esta área. "
                        "Isto NÃO significa ausência de poços — "
                        "em zonas rurais do Algarve, a maioria dos poços de rega privados não está cartografada. "
                        "Usar dados do perfil municipal como fonte primária."
                    )

                summary["source"] = f"Overpass API — {url}"
                return json.dumps(summary)

        except Exception as exc:
            last_err = str(exc)
            continue

    return json.dumps({"error": f"Overpass unavailable: {last_err}", "note": "Use municipality profile for hazard data."})


def _classify_element(tags: dict[str, str]) -> str:
    mm = tags.get("man_made", "")
    if mm == "water_well":
        return "wells"
    ww = tags.get("waterway", "")
    if ww in ("river", "stream", "canal", "drain"):
        return "waterways"
    hw = tags.get("highway", "")
    if hw in ("motorway",):
        return "motorway"
    if hw in ("primary", "trunk"):
        return "primary_roads"
    if hw in ("secondary", "tertiary"):
        return "secondary_roads"
    rw = tags.get("railway", "")
    if rw in ("rail", "light_rail"):
        return "railway"
    lu = tags.get("landuse", "")
    if lu in ("forest", "wood"):
        return "forest"
    if lu in ("farmland", "orchard", "vineyard"):
        return "farmland"
    return "unknown"


_WMO_CODES: dict[int, str] = {
    0: "céu limpo", 1: "maioritariamente limpo", 2: "parcialmente nublado", 3: "nublado",
    45: "nevoeiro", 48: "nevoeiro com geada", 51: "chuvisco ligeiro", 53: "chuvisco moderado",
    55: "chuvisco intenso", 61: "chuva ligeira", 63: "chuva moderada", 65: "chuva intensa",
    71: "neve ligeira", 73: "neve moderada", 75: "neve intensa",
    80: "aguaceiros ligeiros", 81: "aguaceiros moderados", 82: "aguaceiros intensos",
    95: "trovoada", 99: "trovoada com granizo",
}


async def _exec_weather(inputs: dict[str, Any]) -> str:
    lat: float = inputs["lat"]
    lng: float = inputs["lng"]
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
        "timezone": "Europe/Lisbon",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            cur = data.get("current", {})
            temp = cur.get("temperature_2m")
            humidity = cur.get("relative_humidity_2m")
            wmo = cur.get("weather_code", 0)
            wind = cur.get("wind_speed_10m")
            condition = _WMO_CODES.get(int(wmo), f"código {wmo}")

            result: dict[str, Any] = {
                "temperature_c": temp,
                "humidity_pct": humidity,
                "condition": condition,
                "wind_kmh": wind,
                "source": "Open-Meteo (open-meteo.com)",
            }

            if temp is not None:
                if temp > 35:
                    result["heat_advisory"] = (
                        f"CRÍTICO: {temp}°C. Risco de golpe de calor em 10-15 min. "
                        "Água é urgente — cão vai buscar água activamente."
                    )
                elif temp > 28:
                    result["heat_advisory"] = (
                        f"ALERTA: {temp}°C. Cão em busca activa de sombra e água. "
                        "Verificar bebedouros, fontes, piscinas e poços prioritariamente."
                    )

            return json.dumps(result)

    except Exception as exc:
        return json.dumps({
            "error": str(exc),
            "note": "Weather unavailable — proceed without temperature context.",
        })


async def _exec_lookup_local_resources(inputs: dict[str, Any]) -> str:
    municipality = str(inputs.get("municipality", ""))
    try:
        db = _get_supabase()
        canils = db.table("kb_canils").select("name,phone,hours").ilike(
            "municipality", f"%{municipality}%"
        ).limit(3).execute()
        vets = db.table("kb_vets").select("name,phone,address").ilike(
            "municipality", f"%{municipality}%"
        ).limit(3).execute()
        return json.dumps({
            "municipality": municipality,
            "canils": canils.data or [],
            "vets": vets.data or [],
            "note": "If vets list is empty, call discover_resources with lat/lng to query Google Places.",
        })
    except Exception as exc:
        return json.dumps({"error": str(exc), "municipality": municipality, "canils": [], "vets": []})


async def _exec_discover_resources(inputs: dict[str, Any]) -> str:
    municipality = str(inputs.get("municipality", ""))
    resource_type = str(inputs.get("resource_type", "vet"))
    lat = inputs.get("lat")
    lng = inputs.get("lng")

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return json.dumps({
            "error": "GOOGLE_MAPS_API_KEY not configured",
            "results": [],
            "note": "Set GOOGLE_MAPS_API_KEY in Fly.io secrets to enable dynamic discovery.",
        })

    keyword_map = {"vet": "veterinário clínica", "canil": "canil abrigo animais"}
    keyword = keyword_map.get(resource_type, "veterinário")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{lat},{lng}",
                    "radius": 15000,
                    "keyword": keyword,
                    "language": "pt-PT",
                    "key": api_key,
                },
            )
            data = resp.json()

        table = "kb_vets" if resource_type == "vet" else "kb_canils"
        db = _get_supabase()
        results = []
        for place in data.get("results", [])[:5]:
            entry: dict[str, Any] = {
                "name": place.get("name"),
                "address": place.get("vicinity"),
                "municipality": municipality,
                "lat": place["geometry"]["location"]["lat"],
                "lng": place["geometry"]["location"]["lng"],
                "source": "google_places",
            }
            results.append(entry)
            db.table(table).upsert(entry, on_conflict="name,municipality").execute()

        return json.dumps({"results": results, "count": len(results), "written_to_kb": True})

    except Exception as exc:
        return json.dumps({"error": str(exc), "results": []})
