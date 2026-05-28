# Coverage Matrix — query phrase → atomic item mapping

| Query phrase (verbatim) | Mapped atomic item(s) | Scope check | Gap? |
|---|---|---|---|
| "terrain corridor modeling" | Sub-Q1–7: corridors, barriers, breed diffs, panic vs survival, models, fences, water courses | Full scope covered | No |
| "coastal plains, eucalyptus hills, cork oak montado, agricultural quintas" | Entity: terrain_categories (corridors, barriers) | OK — all 4 Algarve terrain types listed | No |
| "N125 national road" | Entity: N125 as barrier/transport vector | OK | No |
| "corridors (roads, paths, riverbeds, fencelines, trails, field edges)" | Sub-Q1 | Full enumeration mapped | No |
| "barriers (major roads, rivers, dense urban blocks, cliffs)" | Sub-Q2 | Full enumeration mapped | No |
| "sighthound vs scent hound vs toy" | Sub-Q3 + 3 breed entities | All three types mapped | No |
| "panic/flight mode vs survival mode" | Sub-Q4 | Explicitly mapped | No |
| "fences and enclosures (cattle fences, quintas, vineyards)" | Sub-Q6 | Full enumeration mapped | No |
| "water courses (rivers, irrigation channels)" | Sub-Q7 | Mapped | No |
| "Gaussian plume model" | Sub-Q8 scent diffusion physics | OK | No |
| "wind speed and direction" | Sub-Q9 | OK | No |
| "terrain disrupts wind patterns (valleys, hills, buildings)" | Sub-Q10 | OK | No |
| "thermal inversion (nighttime trapping of scent at ground level vs daytime lift)" | Sub-Q11 | Explicitly mapped | No |
| "Humidity effects on scent persistence" | Sub-Q12 | Mapped with Algarve seasonality qualifier | No |
| "scent station (owner's worn clothing)" | Sub-Q13 | Mapped | No |
| "camera trap" | Sub-Q14 | Mapped | No |
| "SAR (search and rescue) dog handlers" | Sub-Q15 + entity | OK | No |
| "Nortada in summer" | Sub-Q16 + entity | Explicitly named and mapped | No |
| "35°C" | Sub-Q17 (water req context), Sub-Q31+ (heat) | Heat threshold context mapped in both sections | No |
| "48–72 hours" | Sub-Q18 water convergence window | OK — time frame is a key search parameter | No |
| "rivers, irrigation channels, water troughs, swimming pools, ponds" | Sub-Q19 | Full enumeration mapped | No |
| "prior walks" / "memorize water locations" | Sub-Q20 | Explicitly mapped | No |
| "day 3+" | Sub-Q21 | Time-indexed radius adjustment mapped | No |
| "40–80km away within hours" | Sub-Q23/27 transport distance | OK — specific range noted | No |
| "sociable dogs near roads" | Sub-Q24 (dog characteristics) + Sub-Q25 (road proximity) | Both mapped | No |
| "Algarve specifically: foreign tourists/residents" | Sub-Q26 | Explicitly mapped as Algarve-specific entity | No |
| "nearest town, taking to vet" | Sub-Q28 destinations | OK | No |
| "shelter/vet alert radius" | Sub-Q30 | Explicitly a search strategy output | No |
| "dawn/dusk activity peak" | Sub-Q33 | Explicitly mapped | No |
| "dehydration timeline" | Sub-Q35 | Explicitly mapped | No |
| "Kat Albrecht / Lost Pet Research & Recovery" | Entity: source | Named as required source in scope | No |
| "IPMA, OSM" | Entity: IPMA source | Both referenced | No |
| "GIS/movement ecology literature on domestic animal ranging" | Sub-Q5 (published models) | OK — domestic animal movement ecology explicitly in scope | No |
| "veterinary literature on heat stress in dogs" | Sub-Q31-35 | Heat section maps these | No |
| "AI model system prompt" | Scope condition: output encodable as system prompt parameters | Captured in scope_conditions | No |
| "territory intelligence layer (map overlays)" | Scope condition: encodable parameters | Captured | No |
| "dynamic radius adjustments on the case page as time passes" | Sub-Q21, Q30 — time-indexed radius parameters | Covered | No |
