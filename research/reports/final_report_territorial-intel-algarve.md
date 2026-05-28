---
title: "Territorial Intelligence Layer — Algarve Geographic Knowledge Base"
id: final_report_territorial-intel-algarve
type: final-report
vault_tag: territorial-intel-algarve
brief: from
run_id: territorial-intel-algarve-20260528T090046Z-b5d8e2f1
pipeline_tier: light
created: "2026-05-28"
status: evergreen
tags:
  - territorial-intel-algarve
  - final-report
  - territorial
  - intel
  - algarve
---
# Territorial Intelligence Layer — Algarve Geographic Knowledge Base

**Project:** Nona / Red Cão Algarve rescue OS
**Brief:** Research Brief 05 — Territorial Intelligence Layer
**Scope:** Road network, water sources, terrain zones, human activity, hazards — structured for encoding into the AI recommendation engine

---

## 1. Road Network — Attractors, Barriers, and Transport Vectors

### Available Data Sources

**OpenStreetMap / Geofabrik** [[download-openstreetmap-for-portugal-geofabrik-download-server]]: Full Portugal extract updated daily (393 MB PBF, 785 MB SHP, 812 MB GPKG). No Algarve sub-region exists; must clip with Osmium using the Algarve .poly boundary. ODbL 1.0 license. Contains full road network with classification attributes.

**ANSR (Autoridade Nacional de Segurança Rodoviária)**: Road accident statistics portal at ansr.pt (consulted via gov.pt). Annual reports identify blackspot segments. Animal-specific collision data is not published in a structured GIS format; extractable only from annual narrative reports.

**IMT/IMTT traffic volume data**: Traffic counts by road segment. Not confirmed as downloadable open data — requires direct contact with IMT (Instituto da Mobilidade e dos Transportes).

**OSM road classification wiki** [[portugalrodovias-openstreetmap-wiki]] [[portugalrodoviasnacionais-e-regionais-openstreetmap-wiki]]: Documents the full classification hierarchy (IP/IC/AE/EN/ER/CM) with OSM relation IDs and route descriptions for all 164 national + 158 regional roads.

### Data Quality Assessment

OSM coverage for Algarve is **excellent for major roads** (A22, EN125, EN124, ER network) and **variable for rural tracks** (CM-class and dirt tracks in Serra are often absent or unattributed). The EN124 interior road (Portimão–Alcoutim, traversing Serra do Caldeirão) has **no OSM relation defined** — a structural data gap for the most relevant interior corridor. ANSR blackspot data is published and accessible but requires manual extraction; no machine-readable GIS layer was found.

### Key Geographic Patterns

**A22 (Via do Infante)** [[a22-motorway-portugal-grokipedia]]: The primary east-west barrier. 129.7 km from Lagos to Castro Marim, dual carriageway, 120 km/h, averaging 19,600 vehicles/day (2024). Free since January 2025 (Lei 37/2024) — toll abolition likely increased traffic. As an IP-grade motorway, it is legally closed to pedestrians, cyclists, and animals — a **hard barrier**. No wildlife passages were designed into the original A22 construction. One confirmed crossing point: a road underpass at São Bartolomeu de Messines used by the Via Algarviana trail [[via-algarviana-flora-and-fauna]], indicating that at least one passage exists but its suitability for animal movement is unknown.

**EN125** [[algarve-en125-is-the-most-dangerous-road-in-portugal]]: The most dangerous road in Portugal (2017 ANSR report). Runs the full Algarve coast Vila do Bispo to Vila Real de Santo António. Five blackspot segments of ≥5 injury accidents per 200m per year. The western section was upgraded in July 2017; the eastern section was still severely degraded as of 2018 (potholes, underfunded). Despite the danger, dogs are documented on EN125 — the blackspot data indirectly confirms animal-vehicle encounters. **Dual role**: lethal crossing barrier, but also an attractor because road margins provide movement corridors.

**EN124 (Portimão–Alcoutim, interior)**: Runs through the Serra do Caldeirão. Classified as an Estrada Nacional but with lower traffic volume than EN125. No OSM relation defined. Likely acts as a low-speed corridor rather than a barrier for dogs in the interior.

**ER267 (Aljezur–Monchique–São Marcos) and ER270 (Boliqueime–Loulé–São Brás–Tavira)**: Key transversal regional roads linking coast to Serra. Lower traffic, two-lane, probable animal crossing zones.

**Dirt tracks (estradas de terra / caminhos florestais)**: Primary animal corridors in Serra and Barrocal. Not systematically mapped in OSM. Represent the "invisible network" most relevant to dog movement modeling.

### Encoding Approach

**Edge-weighted road graph**: Each segment attributed with `barrier_score` (0–3: 0 = permeable dirt track, 3 = A22 absolute barrier), `corridor_score` (0–3: probability of dog following the edge), `traffic_volume_class` (low/medium/high/motorway), and `known_crossing_points` (boolean). IP-grade roads default to `barrier_score=3`; EN roads 1–2 by traffic estimate; CMs and dirt tracks 0–1.

**Point layer for confirmed underpasses**: Currently 1 known point (A22 at São Bartolomeu de Messines). Needs systematic survey of A22 underpasses from engineering drawings.

### Local Knowledge Gaps

- **A22 underpass inventory**: Complete list of underpasses, culverts, and fauna passages along the full A22 corridor is not publicly mapped. Requires inspection of the AAVI concession design documents.
- **Night vs. day traffic patterns**: EN125 and tourist roads have dramatically different volumes outside summer season. IMTT counts are point-in-time.
- **Dirt track network**: CM-class roads and forestry tracks in Serra are incompletely mapped. Local GNR officers and agricultural cooperatives hold the operational knowledge.
- **Animal crossing corridors from mortality data**: ANSR data could be reverse-engineered to identify high-mortality road segments = confirmed crossing corridors. Not yet extracted.

---

## 2. Water Sources — Survival Modeling

### Available Data Sources

**SNIRH (Sistema Nacional de Informação de Recursos Hídricos)** [[snirh-sistema-nacional-de-informao-de-recursos-hdricos]]: Managed by APA (Agência Portuguesa do Ambiente). 1,500+ monitoring stations across Portugal with Algarve-specific hydrometric subnetwork. Data includes: precipitation, river flow, reservoir levels, groundwater piezometry, flood zone GIS (SVARH layer), and water quality. Free reuse with attribution. Portal: snirh.apambiente.pt.

**Águas do Algarve** (aguasdoalgarve.pt/content/disponibilidades-hidricas) [[disponibilidades-hdricas-guas-do-algarve]]: Weekly reservoir levels for the three main Algarve public supply dams. The most operationally useful real-time water data source.

**CNPGB/APA dam registry** (cnpgb.apambiente.pt) [[arade-stio-oficial-da-comisso-nacional-portuguesa-das-grandes-barragens]]: Official technical specs for all large dams — basin area, capacity, NPA/NMC/Nme levels. Confirmed for Barragem do Arade (basin 229 km², useful capacity 26,744,000 m³).

**DGT hydrographic network**: "Rede hidrográfica GeoCodificada" available via SNIG geoportal (sniambgeoportal.apambiente.pt). Full GIS layer of watercourses. OSM water layer is an alternative but misses private irrigation infrastructure.

### Data Quality Assessment

SNIRH is **high quality** for public supply reservoirs and major rivers; **weaker for small seasonal streams** (not all gauged). Private irrigation infrastructure (boreholes, farm reservoirs, irrigation channels) is **largely absent from any public dataset**. OSM water layer coverage for the Algarve is adequate for major rivers and reservoirs but **does not capture** rural irrigation channels (levadas), swimming pools on quintas, or livestock water troughs.

### Key Geographic Patterns

**Summer desiccation (July–September)** [[algarve-wildlife-habitats-wetlands]]: All Algarve rivers except the Guadiana and the lower Arade estuary (below Portimão) are **completely dry** in summer. Road bridges cross empty gravel beds. This is the operationally most important water fact: a dog lost in July in the interior has no river water within walking distance. The survival clock starts immediately.

**Permanent water zones**:
- **Lower Arade estuary** (Portimão to the sea): tidal, always contains water [[arade-river-grokipedia]]
- **Main public reservoirs**: Odelouca (88% May 2026), Odeleite (96%), Beliche (92%) — near capacity now, declining to 40–50% by late summer [[disponibilidades-hdricas-guas-do-algarve]]. All are fenced public supply infrastructure; direct access limited.
- **Caldas de Monchique area**: Serra de Monchique has abundant small permanent freshwater streams [[the-algarve-landscapes-and-nature-overview]], making it an exception to the summer desiccation pattern.

**The hidden water layer**: 17 aquifers and an estimated 20,000–25,000 boreholes distributed across the Algarve [[algarve-water-from-the-dams-only-lasts-eight-months-safe-communities-portugal]]. Many agricultural properties have private wells. This is invisible to remote sensing but explains why dogs survive in the interior: they find borehole overflow, livestock troughs, and agricultural irrigation systems.

**Funcho and Arade dams**: Combined irrigation supply for 2,300 ha of citrus, avocado, and golf courses in Silves-Lagoa-Portimão zone [[arade-river-grokipedia]]. Irrigation canal network feeds this area; canals likely contain water during growing season even when rivers are dry.

**Bravura dam (Lagos/Odiáxere)**: Effectively empty 2021–2023. Irrigation canals in the western Algarve were completely dry for three consecutive years [[algarve-water-from-the-dams-only-lasts-eight-months-safe-communities-portugal]]. Do not assume western canal network has water in dry years.

### Encoding Approach

**Polygon layer: permanent water bodies** — reservoirs, estuaries, perennial sections of Arade. Attributes: `summer_accessible` (boolean), `access_type` (open/fenced/agricultural), `approximate_surface_area`.

**Line layer: river corridors** — with `seasonal` flag and estimated dry period (most: July 1 – October 31). Distinguishes dry-bed corridors (navigable but no water) from live streams.

**Point layer: inferred water sources** — high probability zones based on aquifer extent (from SNIRH), known borehole density, agricultural land use. Cannot enumerate individual boreholes; model as probability surface instead.

**Caldas de Monchique zone**: Flag as `permanent_water_zone = true` for the Serra de Monchique area — an operational priority for search teams in summer cases originating in that municipality.

### Local Knowledge Gaps

- **Swimming pools on rural quintas**: Visible in satellite imagery but not in any dataset. High concentration in tourist areas (Almancil, Vilamoura, Monchique). A dog in survival mode will approach pool sounds/smell.
- **Livestock water troughs**: Distribution completely unknown in public data. Goatherd routes in Serra (confirmed in Monchique, Silves, Loulé, Tavira, Alcoutim, Vila do Bispo [[via-algarviana-flora-and-fauna]]) imply trough infrastructure along those routes.
- **Irrigation channel schedules**: Water only flows during irrigation season. The canal network near Silves-Lagoa has water; Bravura-fed western network may be dry in drought years.

---

## 3. Vegetation and Terrain Zones — Cover, Concealment, and Barriers

### Available Data Sources

**DGT COS (Carta de Uso e Ocupação do Solo)**: Portuguese national land cover map. Available via DGT Geospatial Data Center (cdd.dgterritorio.gov.pt) with LiDAR, orthophotos, and DTM layers [[geocatalogo]]. 2010 edition is the primary reference; periodic updates.

**Corine Land Cover (CLC)**: EU-wide land cover at 100m resolution. Available via Copernicus. Adequate for zone-level analysis, too coarse for dog-movement modeling at fine scale.

**ICNF geocatalogo** [[geocatalogo]]: Open GIS platform at geocatalogo.icnf.pt. Key layers for terrain: habitat types within ZEC (Zonas Especiais de Conservação) with Algarve sub-region filter; Carta de Perigosidade de Incêndio Rural 2020–2030 (fire risk, GeoTIFF/WMS per DL 82/2021); Área ardida 1975–2025 (annual burn polygons); PROF ecological corridors. All open-data with ICNF attribution.

**IPMA fire danger system** [[ipma-mainland-rural-fire-danger-2]]: Real-time daily fire danger classification by county. Relevant for terrain access risk during fire season.

### Data Quality Assessment

DGT COS is the most spatially accurate Portuguese land cover dataset but the 2010 edition misses the 2018 Monchique fire and subsequent succession. ICNF burn area data (Área ardida) corrects this for fire-affected zones. CLC is adequate for zone-level reasoning but too coarse to distinguish garrigue from maquis within the Barrocal. ICNF ZEC habitat layers are high-quality for designated protected areas but cover only part of the territory.

### Key Geographic Patterns

**Permeability hierarchy** (confirmed from primary field source) [[algarve-wildlife-habitats-barrocal]] [[guide-to-algarve-wildflowers-wildlife-nature-reserves]]:

| Terrain type | Permeability | Notes |
|---|---|---|
| Garrigue (low Barrocal) | **Open** | Stony ground, low cushion plants, walkable. Coast-adjacent. |
| Fallow farmland | **Medium** | Rapidily colonised by scrub; density varies |
| Coastal pine woodland | **Traversable** | Open understorey; can move freely |
| Eucalyptus plantation | **Traversable** | Uniform canopy, sparse ground cover; resource-poor (no food, no water) |
| Cork oak montado | **Enclosed** | Dense enough for concealment; acorn food source |
| Maquis (upland Barrocal/Serra) | **Near-impenetrable** | Dense spiny Cistus, Arbutus, Lavandula. "So densely packed as to make the habitat virtually impenetrable" (first-nature.com). Critical containment zone. |

**Zone geography** [[geography-of-the-algarve-landscapes-natural-borders-2026]]:

- **Litoral**: Flat coastal strip, sandy, agricultural, high human density. Easy movement. Dune systems and Ria Formosa lagoons provide concealment pockets.
- **Barrocal**: Limestone hills (lower = garrigue, open; upper = maquis, impenetrable). Excellent dog concealment territory. Maquis is the single most important barrier zone in the Barrocal.
- **Serra de Monchique** [[algarve-wildlife-habitats-mountains]]: Syenite geology. Eucalyptus on lower slopes → open heathland at Foia (902m). Permanent freshwater streams. Iberian Lynx reintroduction active. Caldas de Monchique = water attractor.
- **Serra do Caldeirão** [[serra-do-caldeiro-birds-and-nature-algarve-hiking-sightseeing-birding]]: Schist geology, ~150km from Loulé to Spanish border. Eagle Owl, Bonelli's Eagle, Goshawk resident. Wild boar, mongoose, wildcat, fox common. Eastern Algarve's largest wilderness bloc.

**Fire impact**: 2018 Monchique fire created an open movement zone on previously forested slopes — easy traversal but resource-poor (no food, limited cover). Annual ICNF burn data captures this. In August 2023 a new fire front threatened Monchique again. Fire areas remain open for 5-10 years post-fire.

**Largest continuous uninhabited zones**: Serra do Caldeirão (inland from Loulé to Alcoutim) and Serra de Monchique (Foia massif). Both have low road density and sparse population. A dog surviving 7+ days can persist in these zones if it finds the permanent water in Monchique or accesses farm infrastructure in Caldeirão.

### Encoding Approach

**Polygon layer with per-zone attributes**: `permeability_score` (1–5), `food_availability` (acorns/berries/refuse: low/medium/high), `water_availability` (dry/seasonal/permanent), `concealment_score` (1–5), `human_density` (low/medium/high).

**Dynamic fire layer**: Integrate ICNF Área ardida annually. Flag recent burns (< 3 years) as `permeability = open, resources = depleted`.

**Wildlife corridor overlay**: ICNF PROF ecological corridors (when downloaded) provide the canonical corridor network for the PROT Algarve regional plan.

### Local Knowledge Gaps

- **Garrigue/maquis boundary**: COS and CLC do not distinguish these two sub-types within the broader "Mediterranean maquis" category. Identifying which Barrocal areas are impenetrable maquis vs. walkable garrigue requires sub-meter imagery or local field validation.
- **Eucalyptus plantation parcels**: Extent is visible in DGT orthophotos but not attributed separately in COS. These are movement-permeable but food/water-poor — a critical distinction for day 3+ scenarios.
- **Post-fire vegetation status**: ICNF burn polygons exist but vegetation recovery state (still open vs. partially regrown maquis) requires annual field assessment or NDVI time-series analysis.

---

## 4. Human Activity Zones — Food, Contact, and Hazard

### Available Data Sources

**ICNF geocatalogo hunting zones (Zonas de Caça)** [[geocatalogo]]: Open GIS data (WMS/WFS/SHP/KML) at geocatalogo.icnf.pt. Attribution: "ICNF, Zonas de Caça, [URL], [date]." The WFS endpoint allows direct programmatic query. Most comprehensive spatial dataset for a human activity zone in this brief.

**ICNF hunting database** (icnf.pt/caca): Tabular data on all active hunting zones — entity, title holder, area, location, associated legal decrees. Accessible but not in open GIS format.

**INE agricultural census / Recenseamento Agrícola**: Published by Statistics Portugal (INE). Municipality-level statistics on farm count, type, livestock head. Not a spatial layer but provides baseline for zone-level density estimates.

**OSM POI layer**: Inconsistently tagged for agricultural features; livestock farms largely absent. Useful for known feeding points (e.g., animal shelters tagged in OSM) but far from comprehensive.

### Data Quality Assessment

Hunting zone data is **the highest-quality available source** for this sub-topic — open, authoritative, spatially precise. Agricultural zone distribution relies on census aggregates (municipality-level), not field-level polygons. Tourist density data is available from Turismo do Algarve and INE tourism statistics, but only at municipality granularity. No public dataset exists for animal feeding points, informal shelters, or livestock water infrastructure.

### Key Geographic Patterns

**Agricultural geography by zone** [[geography-of-the-algarve-landscapes-natural-borders-2026]] [[the-algarve-landscapes-and-nature-overview]]:
- **Litoral (coast)**: Intensive horticulture (greenhouses, poly-tunnels) concentrated around Portimão-Alvor coast and Albufeira-Faro strip. High worker density year-round. Many human contact opportunities.
- **Barrocal**: Traditional rainfed orchards — citrus, almond, carob, fig, olive. Low to medium worker density. Widely dispersed quintas with livestock.
- **Serra**: Extensive grazing. Active goatherd activity confirmed at six Algarve municipalities: Alcoutim, Tavira, Loulé, Silves, Monchique, Vila do Bispo [[via-algarviana-flora-and-fauna]]. Freely grazing cattle visible in Monchique hills. Human presence is low-density but not absent.

**Tourist density**: Coastal strip Lagos–Albufeira–Faro–Tavira is overwhelmingly the highest-contact zone from May to September. This coastal zone also has the most urban refuse (bins, restaurant waste) and is thus the highest food-availability zone for a survival-mode dog. Dogs documented moving toward coastal towns during summer are likely following food-smell gradients.

**Hunting zones and dog risk**: Hunting seasons in registered zonas de caça (and the adjacent non-zoned areas where hunting may occur) bring armed humans into Serra territory. A lost dog in the Serra in autumn/winter hunting season risks being mistaken for a stray by hunters, especially if it resembles a Podenco (native hunting dog). Hunters are also a potential contact opportunity if the dog approaches for food — or a non-reporting hazard if they assume it belongs to another hunter.

**Wild boar hunting pressure** [[wild-boar-overpopulation-in-portugal-the-portugal-news]]: With 300,000–400,000 boar nationally and proposals for year-round open hunting seasons, human presence in Serra for boar control is increasing. This increases the chance of contact with a lost dog but also increases the density of vehicle traffic on forestry tracks.

### Encoding Approach

**Polygon layer: ICNF hunting zones** — download via geocatalogo WFS. Attributes: zone type, area, active season. Overlay with terrain zones for combined risk assessment.

**Heat-map: tourist density** — municipality × month, sourced from INE tourism bed-night statistics. Approximation only; no sub-municipality resolution available.

**Point layer: confirmed goatherd zones** — six municipalities from Via Algarviana field data. Used to generate "low-density human presence" corridor overlays in Serra.

**Zone attribute: food_availability** — synthesized from land use (urban/periurban = high; intensive agricultural = medium-high; extensive/Serra = low) and refuse bin density (urban centers).

### Local Knowledge Gaps

- **Informal animal feeding points**: Locations where people regularly feed stray cats/dogs (known to local animal welfare organizations, not in any public dataset). These are high-gravity points for survival-mode dogs.
- **Livestock farm locations at parcel level**: Census provides municipality counts; individual farm locations are not in any open dataset. Requires engagement with local Câmaras or agricultural cooperatives (CAPs).
- **Tourist accommodation types**: Dispersed rural tourism (alojamento rural, quintas) in the Barrocal and Serra is poorly mapped in OSM. These properties often have food waste and may be approached by hungry dogs.

---

## 5. Hazard Mapping

### Available Data Sources

**IPMA fire danger system** [[ipma-mainland-rural-fire-danger-2]]: Real-time daily rural fire danger by county with legal restriction levels. API-accessible. Relevant for search team access restrictions during high-risk days.

**ICNF geocatalogo fire layers** [[geocatalogo]]: Carta de Perigosidade de Incêndio Rural 2020–2030 (GeoTIFF/WMS, per DL 82/2021 — official legal cartography); Área ardida 1975–2025 (annual burn polygons). Both open-data, high quality.

**ANSR road safety data**: Identifies 5 EN125 blackspot segments [[algarve-en125-is-the-most-dangerous-road-in-portugal]]. Accessed via ansr.pt annual reports. Animal collision breakdowns require manual extraction.

**SNIRH SVARH**: Flood zone GIS layer for Algarve river corridors. Relevant for dog movement risk during autumn/spring flooding events.

**No public source found for poços (abandoned wells)**: No GIS layer, no municipal dataset, no national registry identified. This is the most significant data gap in this brief.

### Data Quality Assessment

Fire hazard data is **the best-quality hazard dataset** in the Algarve — official legal cartography, annually updated, accessible. Road danger data (ANSR) is available but requires manual extraction for animal-specific events. Coastal cliff hazard is qualitative and geomorphologically stable (Vicentine Coast escarpments, Cape St. Vincent). Wild boar distribution is nationally documented but not spatially granular at sub-municipality level within the Algarve. Poços, trap, and pesticide hazards have **no public data layer**.

### Key Geographic Patterns

**Traffic hazard** [[a22-motorway-portugal-grokipedia]] [[algarve-en125-is-the-most-dangerous-road-in-portugal]]: Two primary zones. A22 = hard east-west barrier (no crossing without a passage point), confirmed lethal for any animal attempting crossing. EN125 = highest accident density in Portugal, particularly the eastern section (VRSA to Faro) which has road condition issues. The A22 divides the Algarve into a northern (Serra/Barrocal) and southern (Litoral/coast) zone — a dog lost south of the A22 is unlikely to cross northward; one lost north is unlikely to cross south.

**Wild boar hazard** [[wild-boar-overpopulation-in-portugal-the-portugal-news]] [[via-algarviana-flora-and-fauna]]: Confirmed throughout Serra de Monchique and Serra do Caldeirão. National population estimated 300,000–400,000 with declared overpopulation (CESAM/ForestWISE, 2023). Boar direct attack on dogs is documented, especially when a hunting dog corners a boar or when dogs enter boar territory near sows with young. Relevant for cases in Serra municipalities.

**Coastal cliff hazard** [[vicentine-coast-natural-park]] [[algarve-wildlife-habitats-coastal]]: The Vicentine Coast Natural Park covers 130 km of coastline from Porto Covo (Alentejo) to Burgau (Algarve). Cliffs are described as "imposing limestone escarpments." Most dangerous after heavy rain. The Sagres Peninsula and Cape St. Vincent represent the maximum cliff exposure zone. Cases originating in Vila do Bispo or Aljezur must include cliff edge assessment.

**Fire risk zones** [[ipma-mainland-rural-fire-danger-2]] [[geocatalogo]]: Serra de Monchique is the highest fire-risk zone in the Barlavento Algarvio — the 2018 major fire burned a large portion of the municipality; Monchique returned to the high-risk list the following year. A August 2023 fire front again threatened the area. 28 Algarve parishes are classified as high fire risk. Post-burn terrain is open and traversable but resource-depleted (no food, minimal cover, degraded water sources).

**Predator hazard in Serra** [[serra-do-caldeiro-birds-and-nature-algarve-hiking-sightseeing-birding]]: Eagle Owl (resident, confirmed Caldeirão), Bonelli's Eagle (resident), Mongoose, Wildcat, and Fox are all common throughout the Serra zones. Iberian Lynx reintroduction is active. These represent real predation risk for small-to-medium dogs in the Serra, particularly at night when dogs are stationary.

**Poços (abandoned wells)**: No public GIS data found. Limestone karst geology throughout the Barrocal makes abandoned wells common — the Barrocal's geological character (karstic limestone sinkholes and collapse features) makes this hazard broadly distributed throughout the zone. Distribution must be treated as a latent hazard across the entire Barrocal polygon until local intelligence is gathered.

### Encoding Approach

**Fire hazard**: Integrate ICNF Carta de Perigosidade as a static layer; overlay IPMA daily fire danger via API call during active cases. Fire season (June–October) triggers elevated warning for Serra cases.

**Road barrier/hazard**: EN125 blackspot points from ANSR annual reports; A22 as hard linear barrier in the road graph layer.

**Cliff hazard**: Vicentine Coast NP boundary as cliff-risk polygon. Attribute: `cliff_risk_zone = true` for Vila do Bispo and Aljezur coastal cases.

**Boar zone**: Use Serra de Monchique and Serra do Caldeirão terrain polygons as proxies for boar presence. Annotate with `boar_risk = high` and `hunting_season_active` (dynamic, from ICNF calendar).

**Poços**: Flag the entire Barrocal polygon with `unknown_well_density = high`. Add an incident-capture field in case intake to record confirmed well sightings. Build toward a crowdsourced point layer from rescue reports.

### Local Knowledge Gaps

- **Poços distribution**: The single most critical unresolved data gap. Requires either: (a) engagement with municipal civil protection (Proteção Civil) departments who may have informal registers, (b) aerial survey pattern-matching for circular structures in LIDAR/orthophotos, (c) crowdsourcing from local farming community via NGO partners.
- **Pesticide application zones**: No public schedule or spatial data. Relevant for dogs drinking from contaminated water sources in intensive agricultural areas (Portimão–Albufeira coast, citrus zones around Silves).
- **Hunter trap (armadilha) locations**: Illegal traps are placed in known game corridors but not reported or mapped. GNR Algarve's nature protection unit (SEPNA) holds incident data but it is not publicly available.
- **Documented dog-specific incidents**: No aggregated dataset of dogs found in wells, trapped, or injured by boar/predators in the Algarve exists in any public repository. A retrospective review of RSPCA/animal welfare records (SAGA, SOS Animal Algarve) would provide the most targeted hazard calibration for this system.

---

## Summary: Data Source Matrix

| Source | Access | Coverage | Priority layers for Nona |
|---|---|---|---|
| **ICNF geocatalogo** (geocatalogo.icnf.pt) | Open, WFS/SHP/KML | Hunting zones, burn areas, fire risk, ZEC habitats, ecological corridors | Hunting zones, fire risk, burn areas |
| **SNIRH** (snirh.apambiente.pt) | Open with attribution | Hydrometric network, groundwater, flood zones, reservoir data | SVARH flood zones, Algarve hydrometric stations |
| **DGT CDD** (cdd.dgterritorio.gov.pt) | Open | LiDAR, DTM, orthophotos, COS land cover | COS land use, LiDAR-derived terrain |
| **Águas do Algarve** (aguasdoalgarve.pt) | Public | Weekly dam levels (3 main dams) | Real-time dam levels for active cases |
| **OSM / Geofabrik** (geofabrik.de) | Open (ODbL) | Road network, POIs, water features | Road network (clip to Algarve), water layer |
| **IPMA** (ipma.pt) | Public API | Fire danger, weather by county | Daily fire danger by county |
| **ANSR** (ansr.pt) | Public (manual) | Accident blackspots, road safety stats | EN125 blackspot segments |
| **Corine Land Cover** (copernicus.eu) | Open | Landcover at 100m | Zone classification (coarse) |
| **Poços / wells** | **NOT AVAILABLE** | No public data | Requires crowdsourcing |
| **Agricultural parcels** | Not open | INE census (municipality level only) | Background density estimates only |
