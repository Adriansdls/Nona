# Scaffold — territorial-intel-algarve

## User Prompt (VERBATIM — gospel)

[See query.md — source: brief-file from research/brief_05_territorial_intelligence.md]

Full content: Nona / Red Cão Algarve lost dog rescue OS — geographic knowledge base for Algarve terrain, infrastructure, hazards, human activity zones. 5 sub-topics: (1) road network as barriers/attractors, (2) water sources for survival modeling, (3) vegetation/terrain zones, (4) human activity zones, (5) hazard mapping. Output: per sub-topic data sources, data quality, geographic patterns, encoding approach, local knowledge gaps.

## Run Config

- run_id: territorial-intel-algarve-20260528T090046Z-b5d8e2f1
- vault_tag: territorial-intel-algarve
- artifact_dir: research/runs/territorial-intel-algarve-20260528T090046Z-b5d8e2f1
- temp_dir: research/runs/territorial-intel-algarve-20260528T090046Z-b5d8e2f1/temp
- claims_dir: research/runs/territorial-intel-algarve-20260528T090046Z-b5d8e2f1/temp/claims
- query_file_path: research/runs/territorial-intel-algarve-20260528T090046Z-b5d8e2f1/query.md
- final_report_path: research/notes/final_report_territorial-intel-algarve.md
- modality: collect (enumerative coverage — 5 sub-topics with named fields per sub-topic)
- forced_tier: light (user-specified via command args)

## Modality Classification

**collect** — The brief requests per-sub-topic enumeration of: data sources, quality, patterns, encoding approach, local knowledge gaps. This is not argumentative synthesis; it's structured information gathering across 5 discrete geographic domains. Each domain needs named-field coverage, not a defended thesis.

## Tier Rationale

User explicitly forced `light` tier. Query is geographically specific and structured (5 well-defined sub-topics with named output fields). Light tier appropriate: width sweep + single draft pass covers the required collect-mode output without depth investigation overhead.

## Wrapper Requirements

- Save path: research/notes/final_report_territorial-intel-algarve.md
- Citation format: inline references where available
- Terminal sections: none specified
- Output structure: 5 sections (road network, water, vegetation/terrain, human activity, hazards) each with 5 named sub-fields per brief spec

## Tier Rationale (Step 1)

User explicitly forced `light` tier via command args. Independent assessment concurs: query is a structured `collect`-mode survey across 5 well-defined geographic sub-topics, each with 5 named output fields. No contested thesis, no conflicting evidence chains requiring depth investigation. Width sweep + single structured draft covers full scope without depth/critic overhead. `response_format: structured` (not argumentative) — breadth-first coverage with tables/lists is appropriate for a geographic data-source catalog.

## Pipeline Todos

- [ ] Step 1 — hyperresearch-1-decompose
- [ ] Step 2 — hyperresearch-2-width-sweep
- [ ] Step 10 — hyperresearch-10-triple-draft (single draft, light tier)
- [ ] Step 15 — hyperresearch-15-polish (light, no --polish flag → SKIP)
- [ ] Step 16 — hyperresearch-16-readability-audit (light, no --polish flag → SKIP)
