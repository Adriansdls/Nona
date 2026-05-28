# Scaffold — lost-dog-search-ops

## User Prompt (VERBATIM — gospel)

[See query.md — research/runs/lost-dog-search-ops-20260528T082816Z-29e21837/query.md]

Full text of Research Brief 04: Dynamic Search Prioritization + Field Operations for Nona / Red Cão Algarve lost dog rescue OS.

## Run Config

- run_id: lost-dog-search-ops-20260528T082816Z-29e21837
- vault_tag: lost-dog-search-ops
- artifact_dir: research/runs/lost-dog-search-ops-20260528T082816Z-29e21837
- temp_dir: research/runs/lost-dog-search-ops-20260528T082816Z-29e21837/temp
- claims_dir: research/runs/lost-dog-search-ops-20260528T082816Z-29e21837/temp/claims
- query_file_path: research/runs/lost-dog-search-ops-20260528T082816Z-29e21837/query.md
- final_report_path: research/notes/final_report_lost-dog-search-ops.md
- modality: collect (see below)
- forced_tier: light (user passed "light" flag)

## Modality Classification

**collect** — The brief requests 5 structured sub-topics, each with enumerated fields (protocol steps, timing, profile variants, error modes, encodable rules). This is a structured evidence-collection task with named fields per topic, not a defended thesis. Drafts should produce per-sub-topic sections with consistent field headers.

## Tier Rationale

Forced `light` by user flag. Query is operationally bounded (5 sub-topics with clear scope). No need for depth investigations, critics, or patcher. Steps: 1 → 2 → 10 → (15 + 16 skipped, --polish not requested).

## Wrapper Requirements

- No specific save path override (use default final_report_path)
- No citation format override
- Output format: per sub-topic with 5 fields (protocol, timing, profile variants, error modes, encodable rules)
- Source priority: Kat Albrecht / MAR materials, Missing Pet Partnership, wilderness SAR literature adapted for pet recovery

## Tier Rationale (post-step-1)

User explicitly passed `light` flag. Query is operationally bounded: 5 clearly-scoped sub-topics, each with named fields, no contested thesis requiring adversarial depth. Modality is `collect` (enumerative coverage per topic). Pipeline: steps 1 → 2 → 10 only. Steps 15–16 (polish/readability) skipped — no `--polish` flag requested. Response format: `structured` (per-sub-topic sections with 5 named fields, scannability over argumentative density).
