# Coverage Gaps Report — dog-movement-algarve

Total notes in vault: 31 (tagged dog-movement-algarve)
Target for light tier: 15–25 ✅ (exceeded)

## Coverage by atomic item group

### 1. Terrain corridor modeling (Sub-Q1–7)
**Coverage: WELL-COVERED (10+ sources)**

Sources:
- `lost-dog-behavior-kat-albrecht-missing-animal-response-network` — core Albrecht 3-category framework + 6 distance factors + path-of-least-resistance principle
- `lost-dog-behavior-pet-fbi-pets-found-by-internet` — temperament + distance estimates + 3 approach zones
- `what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal` — Albrecht 1999 n=254 study, breed-distance data, geographic barriers, fearful dog habitat
- `feral-survival-or-flight-mode-what-does-that-mean-lost-dogs-of-america` — survival/flight mode definition
- `understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic` — nocturnal shift, drainage pipes as shelter, water-seeking, scent anchor
- `most-lost-dogs-are-just-around-the-corner-literally-hass` — Fi GPS + HASS shelter data, distance statistics
- `where-did-my-dog-go-a-pilot-study-exploring-the-movement-ecology-of-farm-dogs-pm` — GPS pilot, core range 0.54–0.89 km², field boundary following (60–71% time within 25m)
- `what-influences-the-home-range-size-of-free-roaming-domestic-dogs-epidemiology-i` — n=135, median core HR 0.35 ha, dry season expansion
- `habitat-selection-by-free-roaming-domestic-dogs-in-rabies-endemic-countries-in-r` — roads + buildings most preferred; vegetation + open fields avoided; synanthropic
- `investigation-of-the-temporal-roaming-behaviour-of-free-roaming-domestic-dogs-in` — crepuscular peaks, midday reduced, dry season expanded range

Gaps:
- No data specifically on Algarve terrain types (cork oak, eucalyptus, quintas)
- Breed-specific terrain use (sighthound vs scent hound) not directly addressed — only general size/breed class data

### 2. Scent diffusion + wind (Sub-Q8–16)
**Coverage: ADEQUATE (8 sources)**

Sources:
- `what-is-a-scent-cone-really-scentsabilities-nosework` — scent plume physics, buoyancy, thermal lift, micro-winds
- `how-sar-dogs-track-human-scent-a-scientific-breakdown` — 220-300M receptors, skin flake vs sweat composition, warm/humid preserves vs cold/dry dissipates
- `k9-search-and-rescue-advanced-techniques-to-master-sar-deployment-dogbase-blog` — downwind positioning, spiral patterns, 40% efficiency gain
- `success-in-the-natural-detection-task-is-influenced-by-only-a-few-factors-genera` — >30–35°C + <50% RH = olfactory decline, panting/dehydration impairs nasal enzymes
- `using-cameras-for-lost-pets-missing-animal-response-network` — camera placement operational detail
- `trail-cameras-help-monitor-lost-dog-behavior-part-7-in-a-series-lost-dogs-of-ame` — camera timing, entry/exit direction
- `nortada-the-cool-and-refreshing-wind-of-portugals-coast-weather-and-climate-site` — NNW direction, May–September, thermal mechanism
- `navigating-portugal-atlantic-winds-tips-for-yachters-getboat-blog` — Algarve 5–10 knots avg; Levante east wind; afternoon strengthening

Gaps:
- SAR handbook PDF (sarbc.org) failed to fetch — SAR-specific Mediterranean guidelines not in corpus
- Thermal inversion details thin — no dedicated source on nighttime vs daytime scent trapping parameters
- Scent station placement guidelines (worn clothing positioning) only touched on in general, not specific angles

### 3. Water source gravity (Sub-Q17–22)
**Coverage: THIN (3 sources)**

Sources:
- `how-long-can-a-dog-go-without-water-denver-vets` — 72h max without water, organ damage at 24h, 1 oz/lb/day requirement
- `dog-dehydration-max-survival-time-without-water` — in extreme heat: as little as 6h; fear/stress inhibits drinking even near water
- `observational-spatial-memory-in-wolves-and-dogs-plos-one` — OSM: spatial memory for first 3–4 locations, then scent-based search; wolves more persistent

⚠️ GAPS:
- **Water convergence radius** — no empirical data on how far/fast survival-mode dogs seek water; this is a genuine literature gap
- **Specific water source types** (irrigation channels, troughs, pools) that attract lost dogs — not covered
- **Documented cases** of dogs found near water after extended survival — anecdotal reports only
- Water proximity effect on radius recommendations (day 3+) — must be derived from dehydration timeline, not directly from literature

### 4. Vehicle transport inference (Sub-Q23–30)
**Coverage: ADEQUATE (4–5 sources)**

Sources:
- `frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc` — Weiss 2012 n=2000 households: 49% found by neighborhood search, 15% ID tag, 6% shelter
- `how-many-pets-are-lost-how-many-find-their-way-home-aspca-survey-has-answers-asp` — 93% dogs recovered; neighborhoodness as primary recovery mechanism
- `lost-pet-statistics-lost-pet-research-and-recovery` — 71% found <1 mile, 14% found 1–5 miles, 7% found >5 miles; median recovery 2 days
- `most-lost-dogs-are-just-around-the-corner-literally-hass` — 60% recovered from shelter <1 mile; 42% <400 feet; finder displacement effect
- `what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal` — mixed breed 14-mile avg vs purebred 2-mile avg (pickup selectivity signal)

⚠️ GAPS:
- **No direct data on third-party transport fraction** — studies show dogs mostly found close, but this may be confounded by good samaritan secondary displacement (dog found at 0.5mi but then transported to vet 20km away)
- **Algarve-specific tourist pickup** — no formal data exists; this will need to be reasoned from general principles
- **Transport destination statistics** (vet vs shelter vs home) — not directly measured in available studies

### 5. Heat, temperature and activity cycles (Sub-Q31–35)
**Coverage: WELL-COVERED (6 sources)**

Sources:
- `frontiers-heat-stress-in-domestic-dogs-morphological-and-environmental-risk-fact` — 2025 review: >70% heat lost via radiation until ambient ~30–35°C; panting negated >80% humidity; surfaces >50°C
- `proposing-the-vetcompass-clinical-grading-tool-for-heat-related-illness-in-dogs` — HRI grading, 856 UK cases, fatality rates by grade
- `pathophysiology-of-heatstroke-in-dogs-revisited-pmc` — >43°C for 40 min = heatstroke; 41°C core = start; 50% mortality
- `incidence-and-risk-factors-for-heat-related-illness-heatstroke-in-uk-dogs-under` — 0.04% incidence, 40% in July, brachycephalic 2.10x OR
- `crepuscular-canines-the-science-behind-your-dogs-dawn-and-dusk-zoomi-pupford` — crepuscular activity confirmed, temperature regulation as driver
- `what-do-lost-dogs-do-at-night` — temperament determines night pattern; shelter-seeking behavior

Gap: No data on specific movement distance/speed reduction vs temperature threshold curve

## Summary

| Topic | Coverage | Action |
|---|---|---|
| Terrain corridors | Well-covered | Proceed |
| Scent/wind | Adequate | Note SAR PDF gap; proceed |
| Water gravity | Thin | Flag as literature gap; derive from dehydration timeline |
| Vehicle transport | Adequate | Flag Algarve-specific gap; derive from general principles |
| Heat/activity | Well-covered | Proceed |

**Decision: Proceed to Step 10 (light tier single draft)**

No wave 2 needed. The water gravity thin coverage is a genuine literature gap, not a search failure — specific water convergence radius data for lost dogs does not appear to exist as empirical research. The draft should flag this explicitly and derive conservative estimates from the dehydration timeline data.
