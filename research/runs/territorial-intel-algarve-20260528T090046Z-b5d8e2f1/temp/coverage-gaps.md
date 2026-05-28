---
title: Untitled
tags:
- water-sources
- road-network
- water-data-sources
- algarve
- coastal
created: '2026-05-28T09:28:53.249342Z'
updated: '2026-05-28T09:28:54.352167Z'
status: review
type: note
deprecated: false
summary: 'Wave 1 result: 27 active notes. Coverage by sub-topic:'
---

# Coverage Gaps — territorial-intel-algarve

Wave 1 result: 27 active notes. Coverage by sub-topic:

| Sub-topic | Coverage | Sources | Gaps |
|---|---|---|---|
| 1. Road network | Well-covered | a22-motorway, en125-most-dangerous, osm-roads, osm-national-regional | Animal accident specific data; A22 underpasses unconfirmed |
| 2. Water sources | Well-covered | arade-river, arade-dam, odelouca-hotspots, disponibilidades, snirh, wetlands, dams-crisis, portuguese-water-hub | Ribeira de Alvor / Rio Gilão / Rio Odelouca individual notes thin |
| 3. Vegetation/terrain | Well-covered | barrocal, mountains, coastal, via-algarviana, landscapes-overview, wildlife-guide, serra-caldeiro, geoparque | ICNF land use GIS layer not directly fetched (portal junk) |
| 4. Human activity | Thin | via-algarviana (goatherds), wild-boar (hunting pressure), geocatalogo (zonas de caça WFS endpoint) | No agricultural zone spatial distribution maps; no tourist density data; no animal feeding points data |
| 5. Hazard mapping | Adequate | coastal (cliffs), vicentine-coast, ipma-fire, geocatalogo (burn areas), wild-boar | Poços/abandoned wells: ZERO specific Algarve distribution data; pesticide/trap data: none |

## Items still uncovered after Wave 1

1. **Poços (abandoned wells) distribution** — zero specific sources. General statement (risk exists, Algarve limestone karst has them) but no map data or frequency estimate.
2. **Agricultural zone distribution maps** — know that Barrocal = orchards, coastal = horticulture, inland = extensive, but no georeferenced distribution data.
3. **Tourist density statistics** — INE/Algarve tourism stats not fetched.
4. **ICNF zonas de caça GIS data** — portal returned junk but geocatalogo.md notes WFS endpoint exists.

## Wave 2 decision

Light tier: thin is acceptable per procedure. Proceed to step 10.
- Note all gaps explicitly in the draft (local knowledge gaps section).
- Flag poços as "no public GIS data found; requires field intelligence."
- Reference geocatalogo WFS endpoint for hunting zones (exists but untested).

## Notes not indexed in vault DB with tag

Many notes written to research/notes/ but vault DB search returns only 8 tagged results.
Workaround: draft step reads notes directly via note show by ID.
All 27 note IDs confirmed in research/notes/ directory.
