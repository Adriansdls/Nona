"""
Attribute-based case re-matching.

Runs nightly (via runner._nightly_rematch_loop).
Scores perdido ↔ encontrado pairs by breed, color, size, municipality, date overlap.
Inserts high-scoring pairs into visual_matches for admin review.
Visual ML matches use the same table — both types reviewed in existing admin UI.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from supabase import Client

log = logging.getLogger(__name__)

THRESHOLD = 0.55

# Algarve municipality adjacency — used for scoring and radius expansion
MUNICIPALITY_ADJACENCY: dict[str, set[str]] = {
    "Lagos": {"Aljezur", "Vila do Bispo", "Portimão", "Silves"},
    "Portimão": {"Lagos", "Lagoa", "Silves", "Monchique"},
    "Lagoa": {"Portimão", "Silves", "Albufeira"},
    "Silves": {"Portimão", "Lagoa", "Albufeira", "Loulé", "Monchique"},
    "Albufeira": {"Lagoa", "Silves", "Loulé"},
    "Loulé": {"Albufeira", "Faro", "São Brás de Alportel", "Tavira", "Alcoutim"},
    "Faro": {"Loulé", "Olhão", "São Brás de Alportel"},
    "Olhão": {"Faro", "Tavira", "São Brás de Alportel"},
    "Tavira": {"Olhão", "Castro Marim", "Alcoutim"},
    "Castro Marim": {"Tavira", "Vila Real de Santo António"},
    "Vila Real de Santo António": {"Castro Marim"},
    "Monchique": {"Portimão", "Silves", "Aljezur"},
    "Aljezur": {"Lagos", "Monchique", "Vila do Bispo"},
    "Vila do Bispo": {"Lagos", "Aljezur"},
    "São Brás de Alportel": {"Faro", "Loulé", "Olhão"},
    "Alcoutim": {"Loulé", "Castro Marim", "Tavira"},
}


def _score_pair(perdido: dict, encontrado: dict) -> float:
    score = 0.0

    # Municipality: exact = 0.40, adjacent = 0.20
    pm = (perdido.get("last_seen_municipality") or "").strip()
    em = (encontrado.get("last_seen_municipality") or "").strip()
    if pm and em:
        if pm.lower() == em.lower():
            score += 0.40
        elif em in MUNICIPALITY_ADJACENCY.get(pm, set()):
            score += 0.20

    # Breed: partial match = 0.25
    pb = (perdido.get("breed") or "").lower()
    eb = (encontrado.get("breed") or "").lower()
    if pb and eb and (pb == eb or pb in eb or eb in pb):
        score += 0.25

    # Primary color: match = 0.15
    pc = (perdido.get("primary_color") or "").lower()
    ec = (encontrado.get("primary_color") or "").lower()
    if pc and ec and (pc in ec or ec in pc):
        score += 0.15

    # Size: exact match = 0.10
    ps = (perdido.get("size") or "").lower()
    es = (encontrado.get("size") or "").lower()
    if ps and es and ps == es:
        score += 0.10

    # Date overlap: encontrado created within 30d after perdido last_seen = 0.10
    try:
        p_date = datetime.fromisoformat(perdido.get("last_seen_at") or "")
        e_date = datetime.fromisoformat(encontrado.get("created_at") or "")
        if p_date.tzinfo is None:
            p_date = p_date.replace(tzinfo=timezone.utc)
        if e_date.tzinfo is None:
            e_date = e_date.replace(tzinfo=timezone.utc)
        days_diff = (e_date - p_date).days
        if 0 <= days_diff <= 30:
            score += 0.10
    except (ValueError, TypeError):
        pass

    return min(score, 1.0)


async def run_nightly_rematch(db: Client) -> int:
    """
    Match all active perdido cases against all active encontrado cases.
    Returns count of new matches inserted into visual_matches.
    """
    perdidos = db.table("cases") \
        .select("id,slug,breed,primary_color,size,last_seen_municipality,last_seen_at") \
        .eq("type", "perdido").eq("status", "ativo").execute()

    encontrados = db.table("cases") \
        .select("id,slug,breed,primary_color,size,last_seen_municipality,created_at") \
        .eq("type", "encontrado").eq("status", "ativo").execute()

    if not perdidos.data or not encontrados.data:
        log.info("Nightly rematch: no cases to match")
        return 0

    # Load existing pairs to avoid duplicates
    existing = db.table("visual_matches").select("case_a_id,case_b_id").execute()
    existing_pairs: set[tuple[str, str]] = {
        (r["case_a_id"], r["case_b_id"])
        for r in (existing.data or [])
    }

    inserted = 0
    for p in perdidos.data:
        for e in encontrados.data:
            pair = (p["id"], e["id"])
            if pair in existing_pairs:
                continue
            score = _score_pair(p, e)
            if score >= THRESHOLD:
                db.table("visual_matches").insert({
                    "case_a_id": p["id"],
                    "case_b_id": e["id"],
                    "similarity_score": round(score, 3),
                    "status": "pendente",
                }).execute()
                existing_pairs.add(pair)
                inserted += 1
                log.info(
                    "Attribute match inserted",
                    perdido=p.get("slug"), encontrado=e.get("slug"), score=score,
                )

    log.info("Nightly rematch complete", new_matches=inserted)
    return inserted
