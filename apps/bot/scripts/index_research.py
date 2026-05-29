#!/usr/bin/env python3
"""
WS4 — index the research vault into research_chunks for RAG.

Chunks every research/notes/*.md, embeds via OpenAI text-embedding-3-small (1536-dim,
same vector size as case_images), upserts to research_chunks. Re-runnable (upsert on
note_id+chunk_index). The consult_research tool then retrieves + cites these for the
PI agent on hard/cold cases.

Usage:
  OPENAI_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
    python scripts/index_research.py            # all notes
  python scripts/index_research.py --limit 20   # first N (testing)
  python scripts/index_research.py --note <id>  # single note

Strips YAML frontmatter; chunks ~1200 chars on paragraph boundaries.
"""
from __future__ import annotations

import argparse
import os
import pathlib
import re
import sys

from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

load_dotenv()

NOTES_DIR = pathlib.Path(__file__).parent.parent.parent.parent / "research" / "notes"
EMBED_MODEL = "text-embedding-3-small"  # 1536-dim
CHUNK_CHARS = 1200
BATCH = 64


# Domain relevance gate. The vault has academic papers citation-chained during the dog
# research that are OFF-TOPIC (fragile-X genetics, nanocomposites, spacetime) yet carry
# the same 'lost-dog-behavioral' tag — so tags don't discriminate. A distinct-term count
# also fails: academic prose shares generic words (breed/owner/search/behavior). We count
# OCCURRENCES of SPECIFIC terms in two buckets — a note is relevant if it's genuinely
# about dogs (ANIMAL) OR about the Algarve terrain where dogs go (PLACE). Junk papers
# clear neither. Indexing them would let consult_research cite irrelevant science.
_ANIMAL_TERMS = (
    "dog", "cão", "cães", "perro", "canine", "galgo", "podenco", "sighthound",
    "hound", "stray", "shelter", "canil", "kennel", "puppy", "scent dog",
    "sighting", "avistamento", "microchip", "leash", "trap", "feeding station",
)
_PLACE_TERMS = (
    "algarve", "faro", "loulé", "silves", "tavira", "lagos", "albufeira", "olhão",
    "monchique", "ribeira", "barrocal", "serra", "guadiana", "arade", "sapal",
    "garrigue", "terrain", "water source", "borehole",
)
MIN_OCCURRENCES = 5


def _count(text: str, terms: tuple[str, ...]) -> int:
    return sum(text.count(t) for t in terms)


def is_relevant(text: str) -> tuple[bool, int]:
    low = text.lower()
    animal = _count(low, _ANIMAL_TERMS)
    place = _count(low, _PLACE_TERMS)
    return (animal >= MIN_OCCURRENCES or place >= MIN_OCCURRENCES), max(animal, place)


def strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:]
    return text


def chunk_text(text: str, size: int = CHUNK_CHARS) -> list[str]:
    text = strip_frontmatter(text).strip()
    paras = re.split(r"\n\s*\n", text)
    chunks: list[str] = []
    cur = ""
    for p in paras:
        p = p.strip()
        if not p:
            continue
        if len(cur) + len(p) + 2 <= size:
            cur = f"{cur}\n\n{p}" if cur else p
        else:
            if cur:
                chunks.append(cur)
            # a single oversized paragraph → hard-split
            while len(p) > size:
                chunks.append(p[:size])
                p = p[size:]
            cur = p
    if cur:
        chunks.append(cur)
    return [c for c in chunks if len(c) > 40]  # drop trivia


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--note", help="single note id (filename stem)")
    ap.add_argument("--all", action="store_true", help="bypass the domain-relevance gate")
    args = ap.parse_args()

    if not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY required")
        return 1

    client = OpenAI()
    db = create_client(
        os.environ["SUPABASE_URL"],
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_SERVICE_KEY"],
    )

    files = sorted(NOTES_DIR.glob("*.md"))
    if args.note:
        files = [f for f in files if f.stem == args.note]
    if args.limit:
        files = files[: args.limit]
    if not files:
        print("no notes found")
        return 1

    total_chunks = 0
    skipped = 0
    for f in files:
        note_id = f.stem
        raw = f.read_text(encoding="utf-8")
        relevant, hits = is_relevant(raw)
        if not relevant and not args.all:
            skipped += 1
            continue
        chunks = chunk_text(raw)
        if not chunks:
            continue
        # embed in batches
        rows = []
        for i in range(0, len(chunks), BATCH):
            batch = chunks[i:i + BATCH]
            resp = client.embeddings.create(model=EMBED_MODEL, input=batch)
            for j, emb in enumerate(resp.data):
                rows.append({
                    "note_id": note_id,
                    "chunk_index": i + j,
                    "chunk_text": batch[j],
                    "embedding": emb.embedding,
                })
        db.table("research_chunks").upsert(rows, on_conflict="note_id,chunk_index").execute()
        total_chunks += len(rows)
        print(f"  {note_id}: {len(rows)} chunks")

    print(f"✓ indexed {len(files) - skipped} note(s), {total_chunks} chunks · skipped {skipped} off-domain")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
