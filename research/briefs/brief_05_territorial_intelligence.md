---
title: Untitled
tags:
- dog-movement-algarve
- lost-dog-behavioral
- lost-dog
- terrain
- territorial-intel-algarve
created: '2026-05-28T09:28:53.261564Z'
updated: '2026-05-28T09:28:54.361168Z'
status: review
type: note
deprecated: false
summary: 'Project: Nona / Red Cão Algarve — Lost dog rescue operating system'
---

# Research Brief 05 — Territorial Intelligence Layer

**For:** Researcher  
**Project:** Nona / Red Cão Algarve — Lost dog rescue operating system  
**Topic:** Geographic knowledge base for the Algarve — terrain, infrastructure, hazards, human activity zones  
**Priority:** Medium-High — enables specific, location-grounded recommendations vs generic advice

---

## Context

We are building a rescue platform for lost dogs in the Algarve, Portugal. Our system currently gives recommendations that are geographically generic: "search within 2km radius", "alert vets in the area." We need to ground these recommendations in **actual Algarve geography**.

The goal is a **territorial knowledge layer**: a structured database of geographic features that our AI model can reason about to give specific, location-aware recommendations. For example: "Lost near Silves → river corridor leads south toward Portimão, alert Portimão canine unit; eucalyptus forest to the east is a dead end (no water, no food, high heat); N124 is a barrier to the north."

We need to know what data sources exist, what can be derived computationally (OSM, land use data), and what requires local human knowledge.

---

## What we need researched

### 1. Road network — attractors, barriers, and transport vectors

Roads have dual roles: barriers (dogs won't cross busy roads; they die trying) and transport vectors (dogs follow road edges; humans drive dogs along roads).

**Find:**
- Classification of Algarve roads by risk and function for lost dogs:
  - National roads (N125, N124, N2, A22 motorway): barrier or corridor?
  - Municipal roads (estradas municipais): behavior?
  - Dirt tracks / estradas de terra: common animal corridors?
- Traffic volume data by road segment and time of day (IMTT data or equivalent)
- Which intersections or road segments historically see the most animal accidents (often indicates animal crossing corridors)
- A22 motorway: is it an absolute barrier? Do dogs get onto it? What happens?
- Are there known underpasses or culverts that animals use to cross major roads?
- Data sources: OpenStreetMap (assess coverage quality for Algarve rural roads), ANSR road accident data, Algarve CCDR transport data

### 2. Water sources — critical for survival modeling

Within 48–72h in summer heat, a surviving dog converges on water. We need to map accessible water sources.

**Find:**
- What types of water sources exist across the Algarve, and what is their distribution?
  - Rivers: Rio Arade, Rio Gilão, Rio Odelouca, Ribeira de Alvor, and smaller tributaries
  - Reservoirs: Barragem do Arade, Barragem de Bravura, others
  - Irrigation channels (levadas, canais de rega) — particularly in coastal agricultural zones
  - Swimming pools in rural quintas (significant in tourist areas — visible from aerial imagery)
  - Water troughs at agricultural properties
  - Seasonal vs permanent water sources (important: many smaller streams dry in July–September)
- What GIS data sources exist for Algarve hydrography? (SNIRH, DGT cartography, OSM water layer)
- What is the density and distribution of irrigation infrastructure in the Litoral vs Barrocal vs Serra zones?
- Are there known drinking points for wildlife that might also serve dogs?

### 3. Vegetation and terrain zones — cover, concealment, and barriers

**Find:**
- Main vegetation/terrain zones of the Algarve and their implications for a hiding or moving dog:
  - Litoral (coastal): sandy scrub, dunes, urbanizations, tourist resorts
  - Barrocal: limestone hills, cork oak, carob, dense maquis scrubland — excellent hiding terrain
  - Serra (Monchique): eucalyptus, pine, steep terrain, cold in winter, isolated
  - Coastal agricultural: orange/lemon groves, poly-tunnels, greenhouses
- Which vegetation types are impenetrable vs permeable to a medium/large dog?
- Where are the largest continuous uninhabited areas? (A dog surviving for 7+ days needs somewhere quiet)
- Are there known wildlife corridors used by foxes, wild boar, etc. that dogs might also use?
- Fire risk zones and recent burn areas (post-fire terrain: easy movement but no food/water/cover)
- Terrain elevation data relevant to movement modeling (Serra de Monchique peak at 902m — relevant for escape/movement from inland municipalities)
- Data sources: ICNF land use data, Corine Land Cover, Algarve municipal land use plans (PDM), aerial imagery

### 4. Human activity zones — food, contact, hazard

**Find:**
- Map of agricultural zones by type:
  - Livestock farms (horses, cattle, goats, pigs) — dogs may approach for food/scent, may be chased away or caught
  - Intensive horticulture zones (Portimão, Albufeira coast) — many workers, high human contact
  - Traditional extensive agriculture (inland) — low human density, isolated quintas
- Hunting grounds (zonas de caça): where are the registered hunting zones in the Algarve? Relevant because hunters encounter dogs and may not report correctly; also relevant for hunting dog risk (dog may follow a hunting party, may be mistaken for a stray)
- Tourist density by zone and season (summer peak: coastal strip from Lagos to Albufeira and east)
- Animal feeding points: are there known locations where people habitually feed stray animals? (These would attract a survival-mode dog)
- Urban centers and their perimeters: town centers often have more food sources (bins, restaurants) — are dogs known to move toward towns when hungry?

### 5. Hazard mapping

**Find:**
- Main hazard types for lost dogs in the Algarve and their spatial distribution:
  - Traffic (already partially covered above — most lethal hazard)
  - Poços (abandoned wells): how common? Any data on distribution? Major risk for small/medium dogs
  - Industrial/agricultural hazards: pesticide application zones, wildlife traps set by hunters or farmers
  - Wild boar: present in Serra de Monchique and Caldeirão — relevant for dog safety in those areas
  - Cliffs and coastal drops: particularly relevant in western Algarve (Sagres, Aljezur)
  - Extreme heat zones: south-facing slopes, urban heat islands in summer
- Are there any official hazard maps for the Algarve from GNR, ICNF, or municipal civil protection?
- Any documented cases of dogs lost in the Algarve that were found in dangerous situations (wells, trapped)?

---

## Output format requested

For each sub-topic:

1. **Available data sources** — what GIS, open data, or structured datasets exist for the Algarve
2. **Data quality assessment** — completeness, resolution, recency of available sources
3. **Key geographic patterns** — what the data reveals about the Algarve that is non-obvious
4. **Encoding approach** — how to represent this in our system (polygon layers, tagged points, route graphs)
5. **Local knowledge gaps** — what only exists as tacit local knowledge and how to capture it

Key sources to check: OpenStreetMap (Algarve coverage quality), DGT (Direção-Geral do Território) cartography, SNIRH (water resources), ICNF (land use, hunting zones), Algarve municipal PDM plans (available online), ANSR accident data, Copernicus Corine Land Cover, Google Earth / satellite imagery for qualitative review, GNR Algarve for any available hazard data.

---

## What we will do with this

We will use this to:
- Build a structured geographic knowledge base the AI agent can query ("what water sources are within 5km of this location?")
- Generate map overlays on the case page: movement corridors, water sources, hazard zones, high-human-contact areas
- Power specific search recommendations grounded in actual terrain ("search along the Ribeira de Alvor channel, water was 2.3km from last sighting")
- Calibrate our radius recommendations (terrain-adjusted, not flat circles)
- Build the barrier model (where the dog cannot easily cross, so we can exclude those zones)
