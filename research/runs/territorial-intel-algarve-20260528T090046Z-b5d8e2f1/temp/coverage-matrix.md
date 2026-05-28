# Coverage Matrix — territorial-intel-algarve

## Query phrase → atomic item mapping

| Query phrase (verbatim) | Mapped atomic item(s) | Scope check | Gap? |
|---|---|---|---|
| "N125, N124, N2, A22 motorway" | Entities: N125, N124, N2, A22 | Full scope — each road named individually | No |
| "National roads … barrier or corridor?" | Sub-Q1: road classification barriers/corridors | OK | No |
| "Municipal roads (estradas municipais)" | Entity: estradas municipais + Sub-Q1 | OK | No |
| "Dirt tracks / estradas de terra" | Entity: estradas de terra + Sub-Q1 | OK | No |
| "Traffic volume data by road segment" | Sub-Q2: traffic volume data | OK | No |
| "animal accidents (crossing corridors)" | Sub-Q3: animal accident rates | OK | No |
| "A22: absolute barrier?" | Sub-Q4: A22 absolute barrier | OK | No |
| "underpasses or culverts" | Sub-Q5: underpasses/culverts | OK | No |
| "OpenStreetMap (assess coverage quality)" | Entity: OpenStreetMap + Sub-Q6 | OK | No |
| "ANSR road accident data" | Entity: ANSR | OK | No |
| "IMTT data" | Entity: IMTT | OK | No |
| "CCDR transport data" | Entity: CCDR Algarve | OK | No |
| "Rio Arade, Rio Gilão, Rio Odelouca, Ribeira de Alvor" | Entities: Rio Arade, Rio Gilão, Rio Odelouca, Ribeira de Alvor | OK — all named | No |
| "Barragem do Arade, Barragem de Bravura" | Entities: both reservoirs | OK | No |
| "Irrigation channels (levadas, canais de rega)" | Sub-Q7: water source types | OK | No |
| "Swimming pools in rural quintas" | Sub-Q7: water source types | OK | No |
| "Seasonal vs permanent water sources" | Sub-Q8: seasonal vs permanent | OK | No |
| "July–September" | Sub-Q8: seasonal drying period | OK | No |
| "SNIRH, DGT cartography, OSM water layer" | Entities: SNIRH, DGT + Sub-Q9 | OK | No |
| "Litoral vs Barrocal vs Serra zones" | Entities: Litoral, Barrocal, Serra de Monchique + Sub-Q10 | OK | No |
| "wildlife drinking points" | Sub-Q11: wildlife drinking points | OK | No |
| "Litoral (coastal): sandy scrub, dunes, urbanizations" | Entity: Litoral + Sub-Q12 | OK | No |
| "Barrocal: limestone hills, cork oak, carob, maquis" | Entity: Barrocal + Sub-Q12 | OK | No |
| "Serra (Monchique): eucalyptus, pine, steep terrain" | Entity: Serra de Monchique + Sub-Q12 | OK | No |
| "Coastal agricultural: orange/lemon groves, poly-tunnels" | Sub-Q12: terrain zones | OK | No |
| "impenetrable vs permeable to a medium/large dog" | Sub-Q13: vegetation permeability | OK | No |
| "largest continuous uninhabited areas" | Sub-Q14: uninhabited areas | OK | No |
| "wildlife corridors (foxes, wild boar)" | Sub-Q15: wildlife corridors | OK | No |
| "Fire risk zones and recent burn areas" | Sub-Q16: fire zones | OK | No |
| "Serra de Monchique peak at 902m" | Entity: Serra de Monchique + Sub-Q17 | OK | No |
| "ICNF land use data, Corine Land Cover, PDM" | Entities: ICNF, Corine Land Cover, PDM plans + Sub-Q18 | OK | No |
| "Livestock farms (horses, cattle, goats, pigs)" | Sub-Q19: agricultural zone types | OK | No |
| "Intensive horticulture zones (Portimão, Albufeira coast)" | Sub-Q19: agricultural zone types | OK | No |
| "Traditional extensive agriculture (inland)" | Sub-Q19: agricultural zone types | OK | No |
| "Hunting grounds (zonas de caça)" | Entity: zonas de caça + Sub-Q20 | OK | No |
| "hunters encounter dogs and may not report correctly" | Sub-Q20: hunting zones implications | OK | No |
| "Tourist density by zone and season" | Sub-Q21: tourist density | OK | No |
| "Animal feeding points" | Sub-Q22: feeding points | OK | No |
| "Urban centers … food sources (bins, restaurants)" | Sub-Q23: dog movement to towns | OK | No |
| "Traffic (most lethal hazard)" | Sub-Q24: hazard types/distribution | OK | No |
| "Poços (abandoned wells)" | Entity: poços + Sub-Q25 | OK | No |
| "Pesticide application zones, wildlife traps" | Sub-Q24: agricultural hazards | OK | No |
| "Wild boar: Serra de Monchique and Caldeirão" | Entity: wild boar + Sub-Q26 | OK | No |
| "Cliffs and coastal drops: Sagres, Aljezur" | Entity: coastal cliffs + Sub-Q27 | OK | No |
| "Extreme heat zones: south-facing slopes, urban heat islands" | Sub-Q28: extreme heat zones | OK | No |
| "GNR, ICNF, or municipal civil protection hazard maps" | Entity: GNR Algarve + Sub-Q29 | OK | No |
| "documented cases of dogs … found in dangerous situations" | Sub-Q30: documented cases | OK | No |
| "Serra do Caldeirão" | Entity: Serra do Caldeirão | OK | No |

**Zero Gap? = YES rows. Coverage complete.**
