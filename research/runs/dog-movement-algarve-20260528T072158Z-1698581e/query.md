---
vault_tag: dog-movement-algarve
run_id: dog-movement-algarve-20260528T072158Z-1698581e
created: 2026-05-28T07:21:58Z
source: brief-file
forced_tier: light
---

# Research Brief 02 — Spatiotemporal Movement + Physical Environment Modeling

**For:** Researcher  
**Project:** Nona / Red Cão Algarve — Lost dog rescue operating system  
**Topic:** How dogs physically move through terrain, scent diffusion, wind, water, vehicle transport  
**Priority:** High — directly translates to search zone recommendations

---

## Context

We are building a rescue platform for lost dogs in the Algarve, Portugal. The system computes probability scenarios for where a dog is and what to do. Right now we treat all locations as roughly equivalent. In reality, **the physical environment shapes where a dog can go, where it will go, and how it will be detected**.

The Algarve has specific terrain: coastal plains, eucalyptus hills, cork oak montado, agricultural quintas, the N125 national road (main tourist artery), and many secondary roads. Terrain varies enormously within a 5km radius. Our probability model needs to understand physical movement constraints, not just concentric circles.

This research covers: terrain corridor modeling, scent/wind physics for search strategy, heat/water effects on survival, and vehicle transport probability.

---

## What we need researched

### 1. Terrain corridor modeling — how dogs move through landscape

Dogs do not diffuse randomly. They follow edges, corridors, and attractors.

**Find:**
- What terrain features act as **corridors** (roads, paths, riverbeds, fencelines, trails, field edges)?
- What terrain features act as **barriers** (major roads, rivers, dense urban blocks, cliffs)?
- Do different breed types (sighthound vs scent hound vs toy) use terrain differently?
- How does a dog in panic/flight mode use terrain vs a dog in survival mode?
- Any published models or empirical data on lost dog movement paths through varied terrain
- How do fences and enclosures affect movement (cattle fences, quintas, vineyards)?
- Is there documented evidence that dogs follow water courses (rivers, irrigation channels)?

### 2. Scent diffusion + wind — implications for search and station placement

Scent is the primary modality for both dogs navigating and humans using search dogs to locate. Wind directly controls where scent pools or disperses.

**Find:**
- Basic physics of scent diffusion in outdoor environments (Gaussian plume model or equivalent)
- How wind speed and direction affect the scent cone from a stationary dog
- How terrain (valleys, hills, buildings) disrupts wind patterns and traps/concentrates scent
- Temperature effects: thermal inversion (nighttime trapping of scent at ground level vs daytime lift)
- Humidity effects on scent persistence (relevant for Algarve: summer = very dry, winter = wet)
- Where to place a scent station (owner's worn clothing) to maximize effectiveness given prevailing wind
- Where to place a camera trap for best detection probability given scent/movement corridors
- Any published guidelines from SAR (search and rescue) dog handlers on scent work in Mediterranean terrain
- Specific Algarve/southern Portugal wind patterns by season (Nortada in summer, etc.)

### 3. Water source gravity — survival convergence behavior

In the Algarve's climate, water access becomes critical for a surviving dog within 48–72 hours.

**Find:**
- What is the documented water requirement for a medium/large dog in summer heat (Algarve July–August temperatures regularly exceed 35°C)?
- Within what radius and time frame does a survival-mode dog typically converge on water?
- What water source types attract dogs: rivers, irrigation channels, water troughs, swimming pools, ponds?
- Is there evidence that dogs memorize water locations from prior walks and return to them?
- How should water proximity affect our radius recommendations on day 3+?
- Documented cases of dogs found near water sources after extended survival period

### 4. Vehicle transport inference — the most under-modeled factor

Many dogs reported in location X are actually 40–80km away within hours, because a human picked them up and drove. This completely invalidates concentric-radius search strategies for sociable dogs near roads.

**Find:**
- Any empirical data on what fraction of lost dog cases involve unintended or intentional vehicle transport by a third party?
- What dog characteristics predict pickup likelihood (size, breed appearance, friendly vs frightened behavior)?
- What context characteristics predict pickup likelihood (proximity to busy road, tourist vs local zone, time of day, presence of other people)?
- In the Algarve specifically: data or patterns on foreign tourists/residents picking up dogs they believe are abandoned
- How far do people typically transport a found dog before stopping (taking home, dropping at nearest town, taking to vet)?
- What are the most likely destinations? (Vet clinic, shelter, their own home, dumping further away)
- Is there data on how quickly picked-up dogs end up at vets vs shelters vs private homes?
- How should vehicle transport probability affect our shelter/vet alert radius?

### 5. Heat, temperature and activity cycles

The Algarve in summer is extreme heat. This directly affects when the dog moves.

**Find:**
- At what ambient temperatures do dogs significantly reduce movement?
- Documented behavioral shifts at high temperatures: when does a dog stop moving and seek shade?
- Dawn/dusk activity peak: empirical data on nocturnal vs diurnal movement in stressed dogs in warm climates
- How does heat stress change search strategy (when are sightings most likely? When should cameras be checked?)
- Dehydration timeline: at what point does heat + dehydration affect a dog's ability to move at all?

---

## Output format requested

For each sub-topic:

1. **Physical/empirical principles** — what the science says
2. **Algarve-specific factors** — how local geography and climate modify the general case
3. **Actionable parameters** — specific numbers (distances, time windows, probability adjustments) we can encode
4. **Search strategy implications** — concrete changes to recommended actions based on this knowledge

Key sources to check: SAR (Search and rescue) literature on scent work, wilderness survival behavior in animals, Lost Pet Research & Recovery (Kat Albrecht), any GIS/movement ecology literature on domestic animal ranging, veterinary literature on heat stress in dogs, Algarve terrain/climate data (IPMA, OSM).

---

## What we will do with this

We will encode this into:
- The AI model system prompt (what factors to consider when computing scenarios)
- The territory intelligence layer (map overlays for corridors, water sources, road risk zones)
- Camera/station placement recommendations output to owners
- Dynamic radius adjustments on the case page as time passes
