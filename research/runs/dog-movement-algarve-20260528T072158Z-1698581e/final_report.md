---
title: "Spatiotemporal Movement and Physical Environment Modeling"
id: final_report_dog-movement-algarve
type: final-report
vault_tag: dog-movement-algarve
brief: brief_02_movement_physical
run_id: dog-movement-algarve-20260528T072158Z-1698581e
pipeline_tier: light
created: "2026-05-28"
status: evergreen
tags:
  - dog-movement-algarve
  - final-report
  - terrain
  - scent-diffusion
  - heat-stress
  - vehicle-transport
  - water-survival
  - algarve
  - nona
---

# Spatiotemporal Movement and Physical Environment Modeling
## Research Brief 02 — Nona / Red Cão Algarve Lost Dog Rescue OS

## 1. Terrain Corridor Modeling — How Dogs Move Through Landscape

### Physical/Empirical Principles

Lost dogs do not diffuse randomly from their escape point. Movement is shaped by a combination of behavioral temperament, terrain features, and a strong tendency toward the path of least resistance. The foundational framework comes from Kat Albrecht's Missing Animal Response methodology, which classifies lost dogs into three behavioral categories based on their response to strangers [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]]:

- **Gregarious dogs** (wiggly-butt, outgoing): will approach strangers readily; tend to stay near populated areas and roads; high probability of being picked up by a Good Samaritan within hours.
- **Aloof dogs** (wary but not fearful): initially avoid strangers; range farther than gregarious dogs; eventually enticed by food after days or weeks.
- **Xenophobic/fearful dogs**: travel farthest of all three types; actively avoid people including their owners; high car-strike risk; seek isolated cover (woodland edges, cemetery perimeters, golf courses, drainage culverts).

Six factors influence total distance traveled [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]]:

- **Temperament**
- **Circumstances** (panic vs. wanderlust vs. opportunism)
- **Weather**
- **Terrain**
- **Appearance**
- **Population Density**

Albrecht's 1999 informal study of 254 cases found a striking breed-class effect: mixed-breed dogs traveled an average of 14 miles before being recovered, versus only 2 miles for purebred dogs. This 7× difference is interpreted as selective Good Samaritan pickup — strangers are less likely to intervene with an unfamiliar-looking mixed breed [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]. Toy breeds were the least likely to travel beyond 0.75 miles; pointing breeds traveled farther than retrieving breeds.

GPS telemetry studies on free-roaming domestic dogs confirm the corridor principle. A 2024 pilot study of farm dogs in Wales found that dogs spent 60–71% of their time within 25 meters of field boundaries, displaying strong edge-following behavior [[where-did-my-dog-go-a-pilot-study-exploring-the-movement-ecology-of-farm-dogs-pm]].

A multi-country GPS study of 321 free-roaming urban and rural dogs in Indonesia and Guatemala found a consistent preference for buildings and roads over vegetation, open fields, and steep terrain — dogs are synanthropic and move along anthropogenic corridors [[habitat-selection-by-free-roaming-domestic-dogs-in-rabies-endemic-countries-in-r]].

Water courses (riverbeds, irrigation channels) function as movement corridors in dry conditions: drained channels have flat, accessible surfaces and low vegetation. In the dry season, GPS studies of free-roaming dogs in northern Australia show significantly expanded range relative to the wet season, when standing water creates movement barriers [[what-influences-the-home-range-size-of-free-roaming-domestic-dogs-epidemiology-i]].

Survival mode is a discrete behavioral shift. A dog that has been frightened, chased, or repeatedly failed to be caught moves from normal behavior to a state where training, recognition, and affection are overridden by survival instincts [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]]. Priorities become food/water, shelter, and avoidance of perceived threats — including owners. The shift can occur within hours of a traumatic escape and deepens with each unsuccessful capture attempt.

### Algarve-Specific Factors

The Algarve's terrain creates a predictable channel structure:

- **Cork oak montado and eucalyptus hills**: dense canopy, low ground clearance, impenetrable scrub in summer — dogs avoid these unless cornered. Outer edges and fire roads act as corridors.
- **Agricultural quintas**: fenced perimeters create strong funneling corridors along their edges; internal irrigation channels are movement pathways.
- **N125 national road**: major barrier to east-west movement for all dogs; also a primary corridor for gregarious dogs attracted to traffic activity. Car-strike risk is high for xenophobic dogs blundering across it.
- **Secondary roads and dirt tracks**: primary corridors for all dog types; most movement will follow the road network.
- **Dry riverbeds (summer)**: dry Algarve riverbeds (Ribeira de Quarteira, Ribeira de Odeleite, etc.) become flat sandy corridors with minimal vegetation.
- **Algarve is dry season in summer**: range expansion expected — equivalent to the dry-season pattern documented in GPS studies.
- **Fences redirect rather than stop**: gaps, gates, and corners on quintas and vineyards attract dogs following edges, making them predictable detection points.

### Actionable Parameters

| Dog type | Primary search zone (days 1-2) | Terrain bias |
|---|---|---|
| Gregarious | 0–2 km radius; bias to roads, built areas | Roads, residential edges, quintas |
| Aloof | 2–8 km; wooded edges, farms | Field boundaries, farm edges |
| Xenophobic | 5–30 km; avoid areas with people | Woodland interior, dry riverbeds, cemetery/golf course |
| Blind panic | Up to 30 km same day | Follows road/fence from escape point |

- **Edge-detection probability**: place cameras and flyers at 25m intervals around fencelines, road shoulders, and irrigation channel crossings — these are where boundary-following dogs will appear [[where-did-my-dog-go-a-pilot-study-exploring-the-movement-ecology-of-farm-dogs-pm]].
- **Dry season (July–August) range expansion**: increase xenophobic/aloof radius by 20–30% versus a winter baseline.
- **Barriers**: N125 is a strong directional constraint. Assume directional movement runs parallel to it, not across unless there is a known crossing point (roundabout, pedestrian crossing, service road).

### Search Strategy Implications

1. **Classify dog as Gregarious/Aloof/Xenophobic at intake** — this single decision drives radius, alert type, and field behavior.
2. **First 6 hours**: focus on road shoulders and fencelines within 2 km of escape point regardless of type.
3. **Xenophobic protocols**: do not call or pursue. Deploy cameras + food traps only. No grid searches with teams moving noisily through habitat.
4. **Corridor mapping**: trace the most accessible routes from escape point (roads, riverbeds, irrigation channels, fencelines). These are your prior-probability hotspots.
5. **Barrier mapping**: mark N125, major rivers, and dense scrub as directional constraints to narrow the search sector.

## 2. Scent Diffusion and Wind — Implications for Search and Station Placement

### Physical/Empirical Principles

Scent does not form a cone. It behaves as an irregular, wispy plume governed by buoyancy, temperature differentials, gravity, and air momentum, constantly shifting with micro-wind changes [[what-is-a-scent-cone-really-scentsabilities-nosework]].

Key mechanics:

- Scent particles are slightly heavier than air and gradually fall, but ride upward thermals when the source is warm.
- A high-positioned source (dog standing on a hill) produces a downward-angling plume that a dog must approach from farther away to intersect.
- Wind speed increases plume length while reducing width — high wind = narrow fast-moving cone; calm air = diffuse pooling in low areas.
- Thermal inversion at night: without daytime solar heating, cold dense air pools near the ground with warm air above it. This traps scent near ground level and preserves it for ground-tracking dogs.
- During the day, convective thermals lift scent upward and away — air-scenting dogs must work higher and farther downwind.

SAR dogs work in two modes [[how-sar-dogs-track-human-scent-a-scientific-breakdown]]:
- **Air-scenting**: nose high, works downwind from the search zone — most effective in calm to light wind (3–12 km/h).
- **Ground tracking**: nose low, follows footstep odors on surface — most effective at night and morning when thermal inversion keeps scent near the ground; less effective on hot asphalt.

Scent preservation: warm and humid conditions preserve scent longer; cold and dry accelerate dissipation. At temperatures >30–35°C combined with relative humidity <50%, olfactory specificity in detection dogs decreases measurably, and panting-induced dehydration impairs nasal enzyme activity [[success-in-the-natural-detection-task-is-influenced-by-only-a-few-factors-genera]].

### Algarve-Specific Factors

**Nortada (dominant summer wind)**: May–September, NNW direction, 5–10 knots average in the Algarve, strengthening to 12 knots in the afternoon as the coastal land heats up [[nortada-the-cool-and-refreshing-wind-of-portugals-coast-weather-and-climate-site]] [[navigating-portugal-atlantic-winds-tips-for-yachters-getboat-blog]]. Calmer in the mornings (5–10 knots before noon). The Algarve's flat coastline produces lighter winds than the northern coast (Cascais reaches 15–20 knots with gusts to 30).

**Levante** (east wind episodes): occurs several times per season and pushes temperatures past 40°C inland with no coastal relief. Scent conditions during Levante are the worst possible — high temperature combined with low humidity.

**Algarve summer humidity**: typically 20–40% RH inland in July-August (compared to 60–80% in winter). This falls squarely in the zone where scent dissipation is significantly accelerated.

**Terrain effects**: cork oak valleys trap cool air overnight and concentrate ground-level scent. Ridgelines see immediate dispersal by Nortada. Irrigation channels cut through open terrain and can funnel scent as well as movement.

### Actionable Parameters

| Condition | Scent work quality | Window |
|---|---|---|
| Dawn, calm wind, <25°C | Excellent | 5–9 am summer |
| Morning, Nortada starting | Good | 9–11 am |
| Afternoon, Nortada max, 35°C+ | Poor | Avoid 1–5 pm |
| Night, thermal inversion, <25°C | Very good for tracking | 10 pm–5 am |
| Levante, >40°C | Near zero | Avoid entirely |

- **Scent station placement**: place owner's worn clothing UPWIND of the suspected dog location. Given Nortada direction (NNW), place the station to the north/northwest of the expected dog zone — scent carries southward toward the dog. A station placed south of the dog is useless in this regime.
- **Camera trap placement**: position at fenceline/corridor crossings facing the direction of approach. Given afternoon NNW wind, position cameras facing south on north-facing fence gaps. Set at 30–50 cm height for medium dogs.
- **Humidity correction**: in summer (RH <40%), reduce scent-radius estimates by 30–40% compared to winter baseline.

### Search Strategy Implications

1. **Schedule all SAR dog operations at dawn (5–9 am)**: optimal conditions — calm wind, cool temps, thermal inversion still active, ground scent fresh.
2. **Scent station orientation**: owner-worn clothing placed to the north or northwest of search zone; accessible approach from the south.
3. **Camera timing**: check cameras at 9 am (covers overnight and dawn activity) and at 8 pm (covers dusk activity). Daytime camera captures are low-probability in summer.
4. **Avoid midday SAR in summer**: poor conditions and depleted search dog performance.
5. **In valley terrain**: run searching dogs at night when scent pools in valley bottoms.

## 3. Water Source Gravity — Survival Convergence Behavior

### Physical/Empirical Principles

Water is the critical survival constraint for lost dogs in a hot environment. Daily water requirement is approximately 1 oz (30 ml) per pound of body weight, or ~60 ml/kg per day under normal conditions [[how-long-can-a-dog-go-without-water-denver-vets]]: a 20 kg dog needs ~1.2 liters/day; a 30 kg dog needs ~1.8 liters. In high heat (35°C+), panting sharply increases water loss and requirements may double or triple — a 30 kg dog in extreme summer heat requires an estimated 3.6–5.4 liters/day.

Dehydration timeline [[dog-dehydration-max-survival-time-without-water]]:
- **6 hours in extreme heat**: first dehydration symptoms (tacky gums, slight lethargy)
- **24 hours**: dehydration signs clear regardless of temperature; permanent organ damage risk begins
- **36–48 hours in >35°C**: critical dehydration; the dog's movement is increasingly directed by water need
- **72 hours**: death risk without water even without extreme heat

Fear and stress in survival mode can inhibit drinking even when water is available — a traumatized dog at a water source may not drink if it senses human presence nearby [[dog-dehydration-max-survival-time-without-water]].

Dogs use spatial memory to return to known locations [[observational-spatial-memory-in-wolves-and-dogs-plos-one]]. They reliably recall the first 3–4 previously experienced cache/water/resource locations; beyond that, they switch to scent-based searching.

The operational implication: a dog lost from home will attempt to return to water sources it knows from prior walks before seeking unfamiliar sources.

### Algarve-Specific Factors

The Algarve summer creates extreme water pressure:

- Interior temperatures routinely exceed 35°C; Levante episodes push >40°C.
- Most natural streams and riverbeds are dry from June–October inland.
- Available water sources: **agricultural reservoirs** (common near quintas), **golf course irrigation ponds** (abundant in tourist Algarve — Quinta do Lago, Vale do Lobo, Vilamoura), **livestock water troughs** (quintas and monte farms), **tourist swimming pools** (private and hotel), **coastal Ria Formosa** and drainage channels near the coast.
- A dog lost in the inland Algarve (Monchique, Silves, Loulé) has fewer water options and will travel farther to find them.
- Golf courses deserve specific alert status: they have abundant water, low human density at perimeters, and attract dogs following irrigation channel corridors.

### Actionable Parameters

| Timeline | Water priority | Search action |
|---|---|---|
| Day 1 (first 24h) | Not yet critical | Standard radius search |
| Day 2 (24–48h), >35°C | Becoming critical | Map water sources within 5 km |
| Day 2-3 in extreme heat | Critical | Bias search to water source corridors |
| Day 3+ any temperature | High priority | Camera/trap at water sources |

- **Convergence radius**: no formal empirical study exists for the specific water-seeking convergence radius of lost dogs. Based on dehydration timelines and known movement ecology (dogs travel 2–14 miles per day when lost), a conservative estimate is that by day 3 in summer heat, a surviving dog is likely within 3–8 km of a permanent water source, having reorganized its location around it.
- **Water source priority ranking** (Algarve): irrigation reservoirs > golf course ponds > livestock troughs > swimming pools (high fence barriers) > dry riverbeds with residual pools.

### Search Strategy Implications

1. **Water source map as day 2 tool**: after 48 hours in summer conditions, immediately map all water sources within 10 km of last known position. Prioritize alerts to properties with reservoirs.
2. **Camera trap at water**: a camera placed at a water access point (trough, reservoir edge, irrigation channel gap) is likely the highest-yield placement after day 2.
3. **Golf course alerts**: contact all golf courses within 10 km of last sighting on day 2. Ask grounds staff to check irrigation ponds and perimeter fencing at dawn.
4. **Survival mode dogs near water**: if confirmed at a water source via camera, do NOT send searchers. Set humane trap at water source with food. Dog will return.

## 4. Vehicle Transport Inference — The Most Under-Modeled Factor

### Physical/Empirical Principles

The standard assumption — that a lost dog is near its escape point — systematically fails for a specific class of dog. A gregarious, small-to-medium, friendly-looking dog near a road is likely to be picked up by a stranger within hours. Key statistics [[frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc]] [[lost-pet-statistics-lost-pet-research-and-recovery]]:
- 49% of recovered dogs were found via neighborhood search; only 6% via shelter
- 93% of lost dogs are eventually recovered; median time is 2 days
- 70% found within 1 mile of home; 95% within 1.8 miles
- However, mixed breeds traveled an average of 14 miles before being "picked up" vs. 2 miles for purebreds — this gap is not explained by locomotion capacity; it is best explained by selective finder behavior (purebreds are more recognizable as owned pets, triggering faster intervention)

The real-world mechanism is unforgiving: a Good Samaritan finds a friendly dog, decides it "looks lost," and takes it home or to a vet. The dog is now 10–80 km from its escape point, reported nowhere, and invisible to any radius-based search. There is no formal study on what exact fraction of lost dog cases involve third-party transport before the owner makes contact — this remains a genuine data gap [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]].

### Algarve-Specific Factors

The Algarve amplifies the vehicle transport problem:

- **High tourism density**: millions of tourists per year, particularly June–September. Many are unfamiliar with the Algarve's endemic rural dog culture (hunting podencos, galgos released after hunting season).
- **Rescue community perception**: foreign residents and tourists commonly mistake healthy hunting dogs roaming near roads for abandoned dogs. This is a well-known source of conflict in the local rescue community.
- **Language barrier**: an English, German, or Dutch tourist who picks up a dog may never see Portuguese-language lost dog flyers or social media posts.
- **N125 corridor**: tourists travel east-west along the N125 constantly; a dog found near Loulé could be driven to Lagos (50 km) or Faro (15 km) before the finder decides what to do.
- **Long-distance tourists**: some finders may drive the dog back to their accommodation, which could be in a different municipality entirely.
- **Local shelters**: APPA (Portimão area), ARDA (Algarve), ACRAL, and many municipal canis are distributed across the Algarve. A dog transported by a tourist is unlikely to be at the nearest canil to the escape point.

### Actionable Parameters

| Dog type | Transport risk | Alert radius |
|---|---|---|
| Gregarious + near N125/road | HIGH | All-Algarve vet + shelter alert within 2h |
| Gregarious + rural/interior | MODERATE | All-Algarve alert within 6h |
| Aloof | LOW-MODERATE | 15–30 km alert radius |
| Xenophobic | VERY LOW | 5–15 km alert radius |

- **Transport distance estimate**: local finder (Portuguese) = 5–20 km to nearest vet or canil; tourist/foreign finder = 20–80 km along N125; tourists returning home = potentially 500+ km (dog goes abroad — rare but documented in rescue network).
- **Timing to vet/shelter**: same-day for most finders (within 4–8 hours of pickup). Delay if finder "keeps the dog for the night" before reporting — can be 12–72 hours.

### Search Strategy Implications

1. **Issue Algarve-wide shelter and vet alerts within 2 hours** for Gregarious dogs in any location, regardless of radius estimates.
2. **Multi-language alerts**: English, German, Dutch social media posts for dogs lost near tourist corridors (N125, Vilamoura, Albufeira, Quinta do Lago areas).
3. **Xenophobic dogs**: suppress the transport assumption entirely — these dogs flee people and are unlikely to be picked up. Radius-based search is valid.
4. **Behavioral intake question at intake**: "How does this dog behave with strangers?" — determines whether transport alert is high-priority or low-priority.
5. **Alert all Algarve canis on day 1** regardless of escape location. Do not restrict to a municipal radius.

## 5. Heat, Temperature, and Activity Cycles

### Physical/Empirical Principles

Dogs regulate body temperature primarily through panting and limited sweat gland activity in the paw pads. This cooling system has hard physiological limits [[frontiers-heat-stress-in-domestic-dogs-morphological-and-environmental-risk-fact]]:

- Below ~30–32°C ambient: radiation and convection from the body surface are sufficient.
- Above ~32°C ambient: panting becomes the primary cooling mechanism.
- Above ~35°C ambient with high physical exertion: panting begins to fail for large or brachycephalic dogs.
- Above ~80% relative humidity: evaporative cooling (panting) is negated entirely.

Clinical thresholds [[pathophysiology-of-heatstroke-in-dogs-revisited-pmc]]:
- Core temp >41°C: heat stress diagnosis
- Core temp >43°C sustained 40+ minutes: clinical heatstroke
- Heatstroke mortality ~50% despite intensive treatment

Epidemiological data [[incidence-and-risk-factors-for-heat-related-illness-heatstroke-in-uk-dogs-under]]:
- 40% of all annual HRI events in July alone (in the UK, a mild climate — Algarve risk is higher)
- Highest-risk profile: brachycephalic breeds (OR 2.10×), dogs >50 kg (OR 3.42×), dogs >12 years (OR 1.75×)
- No HRI events recorded in February, October, or December

**Activity rhythm**: dogs are crepuscular, with peak activity at dawn and dusk [[crepuscular-canines-the-science-behind-your-dogs-dawn-and-dusk-zoomi-pupford]]. This is ancestral behavior from wolf hunting patterns, reinforced by temperature regulation needs in hot climates.

Field data from free-roaming dogs confirms this: early morning and late afternoon/evening peaks, with midday movement significantly reduced [[investigation-of-the-temporal-roaming-behaviour-of-free-roaming-domestic-dogs-in]].

In survival mode, a frightened dog at extreme temperatures will seek shade (drainage culverts, under vegetation, in cave-like spaces) and become largely immobile during midday hours.

### Algarve-Specific Factors

- July-August: peak hours routinely 35–40°C; Levante episodes push 40–44°C
- Ground surface temperatures: asphalt and tiles exceed 50°C in direct sun — lethal for paw pads, forces dogs off road surfaces and into shade
- Algarve in July = highest-probability month for heat-related illness
- Acclimated podencos and Portuguese hunting breeds tolerate heat better than visiting northern European breeds
- Dawn window (5–7 am): temperature drops to 18–24°C in summer — prime activity window
- Dusk window (7–9 pm): temperature drops to 25–30°C — second activity window

### Actionable Parameters

| Ambient temperature | Dog movement status |
|---|---|
| <28°C | Normal movement possible |
| 28–32°C | Reduced voluntary movement; shade-seeking begins |
| 32–38°C | Significant movement reduction; only crepuscular windows active |
| >38°C | Near-immobile except at dawn/dusk; dog likely stationary under shade |
| >40°C (Levante) | Stationary; conserving hydration |

**Activity windows (Algarve July-August)**:

- **Dawn peak**: 5:30–9:00 am
- **Dusk peak**: 7:30–9:30 pm
- **Dead zone**: 11 am–6 pm

**Dehydration immobility**: after 36–48 hours in summer heat without water, assume the dog is stationary at or near a water source or shade structure. Movement probability approaches zero during midday.

### Search Strategy Implications

1. **Field searches**: morning only (6–10 am) and evening only (7–9 pm) in Algarve July–August. No midday ground operations.
2. **Camera schedule**: review cameras at 9 am (captures overnight and dawn activity) and 8 pm (captures dusk). Mid-day camera reviews are low-value.
3. **Sighting probability**: highest at dawn and dusk; owner stake-outs at likely corridors should be at these windows.
4. **Day 2+ in extreme heat**: assume stationary dog unless sightings say otherwise. Shift from corridor search to shade/water zone sweep.
5. **Search party preparation**: carry water for dog if located, shade immediately. Dog found showing HRI signs (panting inability to walk, pale gums) = veterinary emergency; do not delay transport.
6. **Breed flags**: alert owners of brachycephalic and large (>30 kg) dogs that their dogs are at heightened risk of heatstroke if they continue to move even at dawn.

## Sources

* [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]] [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]] [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]] [[where-did-my-dog-go-a-pilot-study-exploring-the-movement-ecology-of-farm-dogs-pm]] [[habitat-selection-by-free-roaming-domestic-dogs-in-rabies-endemic-countries-in-r]] [[what-influences-the-home-range-size-of-free-roaming-domestic-dogs-epidemiology-i]] [[investigation-of-the-temporal-roaming-behaviour-of-free-roaming-domestic-dogs-in]] [[what-is-a-scent-cone-really-scentsabilities-nosework]] [[how-sar-dogs-track-human-scent-a-scientific-breakdown]] [[k9-search-and-rescue-advanced-techniques-to-master-sar-deployment-dogbase-blog]] [[nortada-the-cool-and-refreshing-wind-of-portugals-coast-weather-and-climate-site]] [[navigating-portugal-atlantic-winds-tips-for-yachters-getboat-blog]] [[success-in-the-natural-detection-task-is-influenced-by-only-a-few-factors-genera]] [[using-cameras-for-lost-pets-missing-animal-response-network]] [[trail-cameras-help-monitor-lost-dog-behavior-part-7-in-a-series-lost-dogs-of-ame]] [[how-long-can-a-dog-go-without-water-denver-vets]] [[dog-dehydration-max-survival-time-without-water]] [[observational-spatial-memory-in-wolves-and-dogs-plos-one]] [[frontiers-heat-stress-in-domestic-dogs-morphological-and-environmental-risk-fact]] [[crepuscular-canines-the-science-behind-your-dogs-dawn-and-dusk-zoomi-pupford]] [[pathophysiology-of-heatstroke-in-dogs-revisited-pmc]] [[incidence-and-risk-factors-for-heat-related-illness-heatstroke-in-uk-dogs-under]] [[proposing-the-vetcompass-clinical-grading-tool-for-heat-related-illness-in-dogs]] [[frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc]] [[most-lost-dogs-are-just-around-the-corner-literally-hass]] [[lost-pet-statistics-lost-pet-research-and-recovery]]*
