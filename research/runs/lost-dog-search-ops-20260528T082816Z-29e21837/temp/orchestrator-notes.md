# Orchestrator notes — lost-dog-search-ops

## Step 2 in progress

3 fetcher batches running:
- Batch 1: behavioral profiles, survival mode, time phases
- Batch 2: camera traps, anchor scent, surveillance
- Batch 3: owner errors, drones, sighting triage, volunteer coordination

## Emerging patterns from search results

### Behavioral model
MAR/Kat Albrecht framework classifies lost dogs by 3 temperament tiers:
1. **Sociable** — wiggly, friendly, trusts strangers. Typically recovered close to home, quickly.
2. **Aloof** — wary of strangers, will avoid contact. Will eventually approach if hungry enough. Can travel far.
3. **Xenophobic** — trauma/genetics, cowers, people assume abuse. Will NOT accept ID even with tags. Highest flight risk, hit-by-car risk. Correlates directly with podenco/galgo/traumatized rescue dogs in Algarve context.

### Survival mode timeline
- Enters survival mode: instant to weeks (varies by temperament)
- Phase 1 (0-24h): adrenaline panic, may run long distance
- Phase 2 (1-5 days): hides, nocturnal, hoards food
- Phase 3 (5+ days): more cautious but may start approaching people
- Key insight: before survival mode kicks in = higher recovery probability

### Camera traps
- MAR has a dedicated page: using-cameras-for-lost-pets — likely has specific placement guidance
- Height: lower than wildlife standards (24-36" too high for small dogs), approximately 12-18"
- Best practice: set behind food source so you can see entry/exit direction
- Night/early morning = best detection (cool temp = better thermal contrast)
- Feeding station = ALWAYS pair with camera

### Owner errors
- Chasing = #1 cause of death (dogs flee into traffic)
- Calling name = becomes "trigger" for flight if dog has been approached repeatedly
- Drone = noise causes flight response, especially for fearful/xenophobic dogs
- Social media exact location = crowd convergence, dog flees
- Large search party = noise, stress, triggers flight

### Sighting triage (no published framework found yet)
The search for published framework returned no specific scoring system for sightings. This is a genuine gap - will need to be synthesized from general principles. Key factors: observer familiarity, description specificity, location plausibility (radius × day), behavioral match to expected phase.

### Volunteer coordination
No specific protocol source found yet for group size limits. General SAR: compact formation for search dogs. Lost dog context: silent approach mandatory for fearful dogs. Maximum group size likely 2-3 for fearful dog scenarios.

## Emerging thesis for step 10 draft
The report should structure around the behavioral profile as the primary axis: for each sub-topic, the shy/xenophobic dog gets a completely different (often opposite) protocol from the sociable dog. This is the core insight that distinguishes Kat Albrecht's MAR methodology from generic "find your lost dog" advice.

The five sections should each open with: "for sociable dogs..." / "for shy/fearful dogs..." / "for hunting breeds..." variation.

## Batch 1 completed — key findings

**Core behavioral notes confirmed in vault:**
- `lost-dog-behavior-kat-albrecht-missing-animal-response-network` — 6316w, PRIMARY authority
- `when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network` — 5053w, trap timing
- `understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic` — survival mode
- `lost-dog-behavior-pet-fbi-pets-found-by-internet` — 3-zone approach + distance thresholds

**Time-indexed protocol from batch 1:**
- 0-6h: immediate — local search, scent station + high-scent food, social media, shelters, trail camera
- 6-24h: confirm camera sightings, adjust radius by temperament, sighting network
- Days 2-4: narrow to credible sightings, STOP large active search (scatter risk), monitor food pattern
- Days 5+: confirmed feeding → deploy trap, monitor every 1-3h, overnight = tie trap open
- Post-trap: transport entire trap to enclosed space before opening

**3 owner errors confirmed:**
1. Never call (especially post multiple approach attempts = permanent flight trigger)
2. Never chase (hit-by-car = #1 death cause)
3. Never large search party for survival-mode dogs (scatter risk)

## Batch 3 completed — key findings

**New notes:** drones MAR interview (5,464w), drone Illinois checklist, shy dog approach protocol, reward vs altruism neuroscience, MAR neon poster/5+5+55 rule

**Critical if/then rules confirmed:**
- Drone: IF summer + sunny Algarve + skittish dog → contraindicated (thermal collapse + noise flight risk)
- Reward language: IF poster says "reward" → lock location, restrict to trained handlers
- Skittish capture sequence: no call → side approach → body-smaller → drop food → loop leash → trap ONLY after trail camera confirms eating

**Search radius data (Lord 2007, 1999 MAR data):**
- Toy breeds: < 0.75 miles
- Mixed breed avg: 14 miles (high uncertainty for Algarve rural context)
- Podenco/galgo not specifically studied — synthesize from pointing breed characteristics

**Unfetched primaries to chase:**
- Huang et al. 2018 Animals 8(5) — foundational spatial study on lost cats (ResearchGate accessible)
- Lord et al. 2007 JAVMA 230(2):211-216 — 71% recovery rate, lost dog search methods

## Expected gaps after fetch
- Specific podenco/galgo movement data: none found yet, will need to synthesize from breed characteristics
- Sighting reliability scoring framework: no published framework exists — will need to synthesize
- Volunteer group size maximum: not empirically established, will cite qualitative guidance
- Mediterranean terrain specifics: minimal data, general principles will apply
