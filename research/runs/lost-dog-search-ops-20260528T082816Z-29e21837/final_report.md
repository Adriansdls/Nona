---
title: "Research Report — Dynamic Search Prioritization + Field Operations"
id: final_report_lost-dog-search-ops
type: final-report
vault_tag: lost-dog-search-ops
run_id: lost-dog-search-ops-20260528T082816Z-29e21837
pipeline_tier: light
created: "2026-05-28"
status: evergreen
tags:
  - lost-dog-search-ops
  - final-report
  - lost
  - search
  - ops
---
# Research Report — Dynamic Search Prioritization + Field Operations
### Nona / Red Cão Algarve — Lost Dog Rescue OS

This report covers five operational sub-systems for the rescue platform: time-indexed field protocol, camera trap placement, sighting triage, owner error prevention, and volunteer coordination. Each section follows the requested structure: evidence-based protocol, timing and sequencing, profile-specific variations, error modes, and encodable if/then rules.

The primary authority throughout is Kat Albrecht's Missing Animal Response (MAR) framework, which applies search-and-rescue methodology to lost pet recovery. MAR is the only organization to have developed a systematic, behavior-grounded protocol. The second foundational layer is two peer-reviewed wildlife camera studies (Evans & Mortelliti 2019; O'Connor et al. 2017) providing empirical camera placement data. Where no published framework exists (sighting scoring, volunteer coordination), this report synthesizes first-principles rules from available data.

---

## 1. Time-Indexed Protocol by Phase and Behavioral Profile

### 1.1 Evidence-Based Protocol

**Behavioral profile taxonomy**

The MAR framework classifies lost dogs into three temperament types that determine the appropriate response regime [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]]:

- **Gregarious (sociable)**: friendly, trusts strangers, wiggly/people-oriented. Treats potential rescuers as helpers, not threats. Active vocal search is appropriate. Most likely found close to home and quickly, often held by a finder. The search is mostly a *people* search — find the human who has the dog.
- **Aloof**: wary of strangers, avoids human contact, but hunger eventually overrides fear. Medium travel distance. Passive luring and patience eventually work. Forced approach accelerates flight.
- **Xenophobic**: fear-based genetics or trauma history. Cowers, refuses all contact — including owner — when in survival mode. People register as predators, not helpers. Highest hit-by-car risk. Standard active search is contraindicated. Passive trapping is the only reliable capture method. This profile is common in rescued podencos, galgos, and traumatized hunting dogs in the Algarve.

**Survival mode timeline**

Dogs enter what MAR calls "survival mode" — a neurological state in which stress depletes serotonin and primal self-preservation overrides training, affection, and memory [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]]:

- **Panic phase (0–24h)**: adrenaline-driven; may cover large distances before exhaustion. Does not process familiar faces or names. Even a well-bonded dog can run from its owner.
- **Survival phase (1–5 days)**: settles into hiding; goes nocturnal; hoards food; avoids all contact; moves only at night.
- **Recovery phase (5+ days)**: hunger begins to override fear; will approach food cautiously; may start accepting passive luring.

The critical operational insight: *before* survival mode fully sets in (typically first 1–2 hours), the dog is more recoverable and eyewitnesses exist. After that window closes, passive setup becomes the dominant strategy.

**Phase-indexed action sequence**

**Phase 1 — 0 to 6 hours** [[what-you-dont-know-about-lost-pets-can-hurt-them]] [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]]:
1. Search own property thoroughly before widening. Injured dogs hide silently — check under decks, in sheds, under dense vegetation.
2. If dog is still in sight: get low or flat on ground, avoid eye contact, speak softly, drop high-value food, wait. Do not step toward the dog.
3. Place smelly wet food (canned dog food with gravy, BBQ chicken, Vienna sausages, hot dogs) at escape point.
4. Place dirty clothing or bedding with owner's scent at escape point (anchor scent station).
5. Set up trail camera monitoring the food station within 2 hours.
6. Post on social media (local Facebook Lost & Found, Nextdoor) with photo and general area — but NOT exact coordinates for shy or hunting breed profiles.
7. File report with local shelters and GNR/animal control immediately — first-hours paper trail matters.
8. Begin door-to-door canvassing within 300 meters — eyewitness memory degrades quickly.

**Phase 2 — 6 to 24 hours**:
1. Check trail camera (SD swap or cellular — do NOT physically visit if dog is shy).
2. Adjust search radius based on temperament profile (see table in 1.3).
3. Continue canvassing and distribute large fluorescent posters at major intersections [[neon-posters-missing-animal-response-network]].
4. Monitor social media for sighting reports, log all credible leads.
5. Do NOT deploy humane trap yet — dog must confirm consistent feeding first.

**Phase 3 — Days 2 to 4**:
1. If food station shows camera activity: begin building dog's confidence — do not disturb site.
2. STOP large active search parties for shy/xenophobic profiles — group noise scatters the dog.
3. Narrow physical activity to credible sightings only, with 1–2 silent handlers.
4. Continue daily food refresh at station. Maintain scent items.
5. Move station only if zero activity and a confirmed sighting elsewhere exists.

**Phase 4 — Days 5 to 10**:
1. If trail camera confirms 2–3 consistent visits to same station: deploy humane trap.
2. Trap check every 1–3 hours; every 2 hours in extreme heat (Algarve summer) [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]].
3. Overnight option: tie trap open with fresh food first night so dog builds confidence, set trap following morning.
4. Continue passive monitoring — do not increase activity around site.

**Phase 5 — Day 10+**:
1. Maintain station indefinitely — dogs have been recovered weeks and months later.
2. Expand poster distribution to all farms and businesses within 5–10km radius.
3. Continue shelter checks regularly — dogs can be transported far from loss area.
4. Consider professional scent-trailing dog for corridor confirmation.

**Post-capture (any phase)**:
1. Transport trap *closed* to an enclosed indoor space before opening — never release in field.
2. Offer small amounts of easily digestible food only — refeeding syndrome is a genuine risk after extended starvation [[what-you-dont-know-about-lost-pets-can-hurt-them]].
3. Vet check within 24 hours.

### 1.2 Timing and Sequencing

| Window | Critical action | Why |
|---|---|---|
| 0–2h | Place food station + camera | Before survival mode anchors the dog into hiding mode |
| 0–6h | Door-to-door canvassing | Eyewitnesses forget or leave; this window is irreversible |
| Days 2–5 | Suppress active search for shy profiles | This is when most owners scatter their own dog by searching aggressively |
| Days 3–7 | First trap deployment window | Camera-confirmed consistent eating required before trap |
| Post-capture | Small food portions only | Refeeding syndrome risk |

### 1.3 Profile-Specific Variations

| Profile | Active search | Passive setup priority | Expected radius (day 3) | Key window |
|---|---|---|---|---|
| Gregarious | Fully appropriate | Secondary | < 1 mile, often held by finder | Hours 0–12 |
| Aloof | 1–2 silent handlers only | Immediate | 1–5 miles | Days 2–7 |
| Xenophobic | Contraindicated | Immediate priority | 3–15 miles | Days 5–14+ |
| Podenco / Galgo | Contraindicated | Immediate priority | 10–30+ km | Days 5–21+ |

For podencos and galgos specifically: these breeds are designed to quarter large terrain at speed and follow scent trails relentlessly. If spooked by an active search, they can cover 15–30 km before stopping. The protocol is identical to the xenophobic profile, but expect a much wider search radius and longer recovery timeline.

### 1.4 Error Modes

- Assuming sociable home behavior equals sociable lost behavior — most dogs regress to aloof-adjacent responses in survival mode, regardless of baseline temperament.
- Deploying trap before confirming consistent feeding on camera — wastes resources and risks permanently associating the station with a frightening experience.
- "Wait and see" approach — first-hours canvassing opportunity is irreplaceable.
- Physically checking the camera station for a xenophobic dog — one human visit can cause the dog to abandon the site entirely.

### 1.5 Encodable Rules

```
IF phase == "0-6h":
  actions = [search_property, place_scent_station, place_food_station,
             set_trail_camera, post_social_media, file_shelter_report, canvass_neighbors]

IF profile IN ["aloof", "xenophobic", "hunting_breed"]:
  suppress: [active_vocal_search, large_search_party, approach_directly]
  prioritize: [passive_food_station, trail_camera, silent_1-2_handler_only]

IF profile == "hunting_breed":  # podenco / galgo
  search_radius_day3 = "10-30km"
  recovery_timeline = "days_5_to_21_plus"

IF camera_confirms_consistent_eating AND days_elapsed >= 3:
  action = deploy_humane_trap

IF trap_triggered:
  protocol = [transport_closed_to_enclosed_space, small_food_portions_only, vet_within_24h]
```

---

## 2. Camera Trap Placement — Best Practices and Optimization

### 2.1 Evidence-Based Protocol

**Camera height and angle** [[surveillance-cameras-missing-animal-response-network]]:
- Standard deer-hunting height (60–90 cm / 24–36 inches) is **too high** for small and medium dogs.
- Optimal: 15–20 cm (6–8 inches) for small dogs; 30–50 cm (12–20 inches) for medium dogs.
- Angle: slightly downward — enough to show full body, not so steep it causes overexposure burnout.

**PIR sensor physics** [[camera-trap-placement-guide-how-to-position-your-trail-camera-naturespy]]:
- Camera triggers on movement *and* a change in ambient heat — both required simultaneously.
- Early morning: cool ambient temperatures create larger thermal delta → higher sensitivity, more reliable triggers.
- Wind + sunny conditions + nearby vegetation (within 1m) → false triggers, dead battery; position camera away from branches that move in wind.
- Detection zone is approximately 100° arc — position feeding station within the center 60°.

**Multi-camera evidence** [[assessing-arrays-of-multiple-trail-cameras-to-detect-north-american-mammals-pmc]]:
- Evans & Mortelliti 2019 (PLoS ONE): going from 1 to 2 cameras at a station produces a 22–400% gain in detection probability.
- O'Connor et al. 2017: 2-camera arrays yield ~80% average detection gain.
- Saturation point: 8–9 cameras; no meaningful gain beyond that.
- **Two cameras per feeding station is the evidence-based minimum.**

**Positioning relative to food** [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]]:
- Position the camera far enough back to capture both entry and exit direction.
- Typical: 2–3 meters behind the food — adjust to terrain.
- Entry/exit direction is critical information for deciding trap placement (which side the dog approaches from).

**Bait and scent setup** [[feeding-stations-buddha-dog-rescue-recovery]] [[dont-use-pee-to-attract-a-lost-pet-by-kat-albrecht]]:
- High-value smelly food: hot dogs, Vienna sausages, canned dog food with gravy, BBQ chicken, rotisserie chicken.
- Liquid smoke (hickory or mesquite): spray on the ground around food and trail up nearby tree trunks. Extends scent plume significantly, especially effective in the dry Algarve terrain where airflow carries scent along edges.
- Do NOT use human urine as a scent lure: fear state suppresses olfactory processing in xenophobic dogs, and territorial scent cues use a neurological pathway that is blocked when the dog is in fight-or-flight. Food-based lures activate a different pathway (hunger drive) that remains active under fear [[dont-use-pee-to-attract-a-lost-pet-by-kat-albrecht]].

**Detection timing**:
- Survival-mode dogs go nocturnal — peak activity 10pm–4am and at dawn.
- Set cameras to 24-hour mode with infrared flash for night capture.
- Early morning is best for detection reliability (highest thermal delta).

**Algarve terrain notes** (synthesized):
- Eucalyptus and cork oak canopy: dogs shelter under dense cover in daytime. Place stations at scrubland/open field edges, not inside dense brush.
- Maquis scrubland margins: preferred lying-up zones for shy dogs in the Algarve.
- Waterways and dirt tracks: primary travel corridors for podencos and galgos — deploy camera stations on these first, as hunting breeds follow scent trails along edges.
- Stone wall lines and agricultural track boundaries: secondary corridors.

### 2.2 Timing and Sequencing

- Set up camera and food station within 2 hours of loss (before dog enters hiding phase).
- Check camera via SD swap or cellular upload — never physically visit site for shy/xenophobic profiles.
- Refresh food daily; use cellular camera if daily physical access is not acceptable for the profile.
- Deploy trap only after 2–3 confirmed camera captures of consistent eating.

### 2.3 Profile-Specific Variations

| Profile | Camera check method | Bait priority | Camera count |
|---|---|---|---|
| Gregarious | Direct visit OK | Standard dog food | 1 often sufficient |
| Aloof | SD swap or cellular | High-value: rotisserie chicken, liquid smoke | 2 minimum |
| Xenophobic | SD swap or cellular only | Strongest available scent (BBQ chicken + liquid smoke) | 2 minimum |
| Podenco / Galgo | SD swap or cellular only | BBQ meat, strong scent | 2 cameras + cover travel corridor 100m from station |

### 2.4 Error Modes

- Setting camera at deer-hunting height → misses dog entirely.
- Visiting the site physically for a shy dog → dog abandons the station, weeks of progress lost.
- Using a single camera → 22–400% detection gap versus dual setup.
- Omitting liquid smoke → food scent radius too small in open terrain or wind.
- Camera aimed only at trap entrance → can't read entry/exit direction for trap positioning.
- Using urine as scent lure → counterproductive for skittish dogs.

### 2.5 Encodable Rules

```
camera_height = "15-20cm" IF dog_size == "small" ELSE "30-50cm"
camera_count_minimum = 2
camera_check_method = "sd_swap_or_cellular" IF profile IN ["aloof", "xenophobic", "hunting_breed"]
                      ELSE "direct_visit_ok"
bait_required = ["high_value_smelly_food", "liquid_smoke"]
bait_prohibited = ["human_urine"]
detection_window_peak = "22:00-06:00"
best_placement = ["scrubland_edges", "trail_junctions", "waterway_crossings", "stone_wall_lines"]
trap_deployment_trigger = camera_confirmed_consistent_eating AND visits >= 2
```

---

## 3. Sighting Lead Scoring and Triage

### 3.1 Evidence-Based Protocol

**Important caveat**: no published sighting reliability scoring framework exists in the lost dog recovery literature. Kat Albrecht's 2018 IAABC article explicitly names this as a gap in the field [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]. The following scoring system is synthesized from MAR sighting-handling protocols, behavioral movement data, and first principles of observer reliability.

**Reliability factors:**

| Factor | High (3 pts) | Medium (2 pts) | Low (1 pt) | Zero (0 pts) |
|---|---|---|---|---|
| Observer familiarity | Owner or someone who knows the dog | Has seen photo | Stranger, breed match only | Vague description |
| Description specificity | Breed + color + markings + size all match | Breed + color match | "Brown dog" | Cannot identify breed |
| Behavioral match | Matches expected phase behavior (nocturnal, hiding, foraging) | Neutral behavior | Friendly and sociable (inconsistent with survival mode) | — |
| Location plausibility | Within expected radius for day + profile (see table) | Borderline radius | 1.5–2× expected radius | Beyond possible radius |
| Observation conditions | Daylight, stationary, < 30m | Daylight, moving vehicle | Night, > 100m | Dark + far + briefly seen |

**Total score range: 0–15.**

**Location plausibility radius** (synthesized from Lord et al. 2007 data via [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]):

| Profile | Day 1 | Day 3 | Day 7 |
|---|---|---|---|
| Toy / companion breed | < 1 mile | < 2 miles | < 5 miles |
| Mixed breed (companion temperament) | < 3 miles | < 8 miles | < 15 miles |
| Podenco / Galgo (hunting breed) | < 15 km | < 30 km | < 60 km |

**Sighting handling by profile** [[behaviors-to-avoid-ct-dog-gone-recovery]] [[to-reward-or-not-to-rewardthat-is-the-question-missing-animal-response-network]]:
- For shy and xenophobic profiles: ALWAYS keep sighting location private — never post publicly.
- Release location ONLY to trained handlers, not general volunteers, and not to the owner acting alone.
- Any reward language in public posts activates reward-seeking behavior in civilians → crowd convergence → chase → flight or death.
- For gregarious profiles: public sighting posting is appropriate — someone may be holding the dog.

**Conflicting sightings** (same day, different locations):
- Apply reliability scoring to both; default to the higher-scoring sighting.
- If both high-reliability: dog likely doubled back — weight toward the *later* sighting chronologically.
- Deploy camera station at the intersection of both reported corridors if terrain allows.

**Response by score tier**:
- Score ≥ 10: move camera/food station within 100m of sighting location within 6 hours.
- Score 7–9: log and monitor for additional corroborating reports.
- Score < 7: log only; no resource deployment.

### 3.2 Timing and Sequencing

- First confirmed high-score sighting → immediately move camera station toward sighting.
- Multiple high-score sightings in same 500m area over 48h → high confidence the dog is establishing a territory there → trap deployment window.
- Zero sightings after 10 days → expand flyer radius and consider a scent trailing dog to establish movement corridor.

### 3.3 Profile-Specific Variations

- **Gregarious**: alert broad public network — dog may be held by a finder. Sighting location publishing safe.
- **Aloof/Xenophobic**: location is sensitive intelligence. Even well-intentioned civilians with the location will converge and scatter the dog. Restrict to 1–2 trained handlers.
- **Podenco/Galgo**: multiple distant sightings over a wide area are *normal* — the dog is actively moving. Use sightings as corridor direction indicators, not as stationary location data.

### 3.4 Error Modes

- Publishing confirmed sighting publicly → crowd convergence → dog flees → may never return to the area.
- Acting on all sightings equally → wasted camera deployments, noise disturbance near dog.
- Treating impossible-distance sightings as valid → misdirects entire search effort.
- No sighting log → misses movement patterns that reveal the dog's travel corridor.

### 3.5 Encodable Rules

```
sighting_score = (
  observer_familiarity_score    +  # 0-3
  description_match_score       +  # 0-3
  behavioral_match_score        +  # 0-3
  location_plausibility_score   +  # 0-3
  observation_conditions_score     # 0-3
)  # max = 15

IF sighting_score >= 10: action = "move_camera_station_to_sighting_zone_within_6h"
IF 7 <= sighting_score < 10: action = "log_and_monitor"
IF sighting_score < 7: action = "log_only"

IF profile IN ["aloof", "xenophobic", "hunting_breed"]:
  sighting_location = PRIVATE  # never publish
  notify_recipients = [trained_handlers_only]
ELSE:  # gregarious
  sighting_location = PUBLIC_OK
  notify_recipients = [full_network]

IF poster_or_post CONTAINS "reward":
  alert = "Reward language risk: remove or lock down. Use PLEASE CALL only."
```

---

## 4. Owner Error Prevention — What Not to Do

### 4.1 Evidence-Based Protocol

**Error 1: Chasing the dog** [[lure-lost-or-stray-dogs-do-not-chase-after-them-missing-animal-response-network]]

*Mechanism*: Any forward movement toward the dog is perceived as predator pursuit — including one step. The dog cannot register "this is my owner" when in survival mode. Each chase event permanently elevates the dog's baseline fear response, making future approaches progressively harder. Chasing is the single largest cause of death in lost dogs — dogs chased by well-meaning rescuers regularly flee into traffic.

*Correct alternative*: Get LOW or completely flat on the ground. Avoid eye contact. Speak softly or stay silent. Drop high-value food in the dog's direction. Wait — do not move toward the dog. Let the dog decide whether to approach.

---

**Error 2: Calling the dog's name loudly** [[lure-lost-or-stray-dogs-do-not-chase-after-them-missing-animal-response-network]]

*Mechanism*: If the dog has been approached multiple times while in flight mode, the sound of its name becomes a conditioned "chase trigger" — calling the dog causes automatic flight, even from its own owner. The calling + chase cycle compounds: each failed approach increases fear reactivity.

*Correct alternative*: Silent approach, or use an unfamiliar sound associated with food (bag rustling, can opener). Never yell in the dog's general direction.

---

**Error 3: Large search parties and motor vehicles** [[behaviors-to-avoid-ct-dog-gone-recovery]]

*Mechanism*: Multiple humans moving in formation, plus motor noise from vehicles, ATVs, or quads, is indistinguishable from a predator pack to a survival-mode dog. The dog can hear motor sounds at 200+ meters and will flee before searchers arrive. The larger the party, the larger the scatter radius — a well-organized 20-person search party can push a shy dog 5+ km from the loss area.

*Correct alternative*: For aloof/xenophobic profiles, maximum 1–2 silent handlers who know the calming approach protocol. Distribute search effort by assigning people to camera monitoring and poster distribution, not physical movement near the dog.

---

**Error 4: Posting exact sighting location on social media** [[behaviors-to-avoid-ct-dog-gone-recovery]] [[to-reward-or-not-to-rewardthat-is-the-question-missing-animal-response-network]]

*Mechanism*: Public posting of a confirmed sighting draws well-meaning civilians to the location who then chase the dog. MAR has documented multiple deaths where a dog in a stable area was scattered by crowd convergence following a social media post. Reward language amplifies this: neuroscience research cited by Kat Albrecht shows that reward-driven motivation activates the nucleus accumbens (impulsive action) rather than the altruistic brain region — reward-seekers *run* toward a sighting rather than approaching calmly.

*Correct alternative*: Post general area only. Share coordinates only with trained handlers privately. Remove reward language; replace with "Please call — do not approach."

---

**Error 5: Using drones** [[drones-and-lost-pet-recovery-how-effective-are-they-missing-animal-response-netw]]

*Mechanism*: Drone noise triggers flight response in xenophobic and hunting breeds. In the Algarve context specifically, thermal drones face a compounding problem: summer ambient temperatures reduce thermal delta to near zero (the dog's body heat no longer stands out against warm ground), and dense eucalyptus/cork oak canopy blocks thermal imaging entirely. The result is a tool that is both counterproductive (scares the dog) and ineffective (can't see through canopy or summer heat) in the most common Algarve search scenarios.

*Correct alternative*: If drone is ever used, pre-conditions must all be met: pre-dawn, cool weather (< 15°C ambient), open terrain, dog profile is gregarious or aloof (not xenophobic). Drone is a sighting-only tool — a separate trained ground team must be standing by for capture. Never use in summer without confirming thermal delta is sufficient.

---

**Error 6: Removing the scent station too early** [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]]

*Mechanism*: Dogs in survival mode often require 3–10 days of building courage before approaching a feeding station, even one they can smell from a distance. Removing the station when nothing appears to happen eliminates the only anchor pulling the dog back toward recovery. Many owners dismantle stations after 3–4 days of "nothing" — right before the dog was about to start visiting.

*Correct alternative*: Maintain the station for a minimum of 14–21 days with daily food refresh. Any appearance on camera, even once, at day 9 is significant progress.

---

**Error 7: Reward language on posters** [[to-reward-or-not-to-rewardthat-is-the-question-missing-animal-response-network]]

*Mechanism*: "REWARD" activates reward-seeking circuitry in potential sighters, driving impulsive approach behavior. This produces crowds descending on sighting locations, multiple simultaneous chase attempts, and documented deaths. Several specific cases are documented in MAR records where a reward poster led directly to a fatal chase.

*Correct alternative*: Use "PLEASE CALL" language. "Found — PLEASE CALL" achieves higher altruism-based response. Rely on community care, not financial incentive.

---

**Error 8: Overfeeding on first capture** [[what-you-dont-know-about-lost-pets-can-hurt-them]]

*Mechanism*: A dog that has been starved for several days is at risk of refeeding syndrome — rapid reintroduction of food causes dangerous electrolyte shifts (particularly phosphate, potassium, and magnesium), which can cause heart arrhythmia, neurological symptoms, and death.

*Correct alternative*: Small amounts of easily digestible food at intervals. Mandatory vet check within 24 hours for any dog missing more than 5 days.

### 4.2 Timing and Sequencing

- Errors 1–3 (chase, call, large party) are catastrophic throughout the first 14 days; most dangerous during days 0–7 when survival mode is at peak intensity.
- Error 4 (social media location) is catastrophic whenever a confirmed sighting exists — timing-independent.
- Error 5 (drone) is worst in summer and for xenophobic profiles — contraindicated in the majority of Algarve summer searches.
- Error 8 (refeeding) applies only post-capture, but must be pre-briefed to owner before the dog is recovered.

### 4.3 Profile-Specific Variations

Errors 1–7 are primarily catastrophic for **aloof and xenophobic profiles**. For gregarious dogs:
- Error 3 (large group): sociable dogs often respond positively to multiple searchers, any of whom may call or receive the dog.
- Error 4 (social media location): publishing sighting is an appropriate action for gregarious dogs — someone may be holding the dog and needs to see the post.
- Error 5 (drone): gregarious dogs are less reactive to drone noise, though thermal efficacy constraints still apply.

For **podencos and galgos**: Error 5 (drone) is the highest-risk error — hunting breeds have extremely sensitive hearing and acute aerial threat awareness. A drone passing overhead registers as a bird of prey and causes immediate maximum-speed flight.

### 4.4 Error Modes in Error Prevention

- Owner told "don't chase" but yells name from 200 meters — voice calling at distance is the same trigger.
- Volunteers briefed individually but not coordinated — collective forward movement from multiple directions = pack-chase pressure.
- Drone used at pre-dawn (correct time) in dense eucalyptus forest (wrong terrain) — thermal blocked regardless of time.
- Station maintained but physically checked for scent confirmation → same problem as physical camera visit for shy profiles.

### 4.5 Encodable Rules

```
IF profile IN ["aloof", "xenophobic", "hunting_breed"]:
  IF action == "approach_directly":
    alert = "STOP: Crouch or lay flat. Drop food. Do not move toward dog."
  IF action == "calling_name" OR action == "yelling":
    alert = "STOP: Silence only. Flight trigger risk."
  IF search_group_size > 2:
    alert = "STOP: Max 2 handlers for this profile. Assign others to posters/cameras."
  IF action == "publish_sighting_location_publicly":
    alert = "DANGER: Crowd convergence risk for fearful dog. Private channel only."

IF drone_requested:
  IF temperature > 20C OR season == "summer":
    alert = "Drone thermal ineffective in Algarve summer. Do not deploy."
  IF terrain == "eucalyptus" OR terrain == "cork_oak" OR terrain == "dense_canopy":
    alert = "Drone thermal blocked by canopy. Do not deploy."
  IF profile IN ["xenophobic", "hunting_breed"]:
    alert = "Drone contraindicated: engine noise causes maximum-speed flight."

IF poster_text CONTAINS "reward":
  alert = "Remove reward language. Replace with PLEASE CALL. Reward = crowd chase risk."

IF days_missing > 5 AND dog_just_captured:
  alert = "Refeeding risk: small portions only. Vet within 24h mandatory."
```

---

## 5. Volunteer Coordination and Search Pattern Assignment

### 5.1 Evidence-Based Protocol

**Group size rules by profile**

MAR applies wilderness SAR probability theory to lost pet searches [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]. In wilderness SAR, large teams are assets. In lost dog search for fearful animals, large teams are liabilities — they function as a predator pack. The group size rule is:

- **Gregarious dogs**: standard group sizes appropriate; sociability makes multiple searchers an asset.
- **Aloof dogs**: maximum 2–3 people, moving silently and separately.
- **Xenophobic / hunting breed**: maximum 1–2 trained handlers. Any group beyond this creates the same scatter pressure as a direct chase. Volunteers are redirected to parallel tasks (posters, canvassing, camera monitoring) rather than physical presence in the search zone.

**Volunteer behavior rules for fearful dog profiles:**
- No calling the dog's name at any time in the search zone.
- No running, even if the dog is spotted.
- No vehicles within 500m of a confirmed location for a xenophobic dog.
- Volunteers must maintain 200m separation from each other to prevent collective predator-pack pressure.
- If dog is sighted: everyone stops moving. Single trained handler responds. Everyone else holds position.

**Search pattern selection**

- **Grid search**: appropriate for open, flat terrain (agricultural fields, estuaries) and gregarious dog profiles. Systematic area clearance. In Algarve terrain, use in flat agricultural zones near the coast.
- **Corridor/trail search**: more appropriate for fearful dogs and hunting breeds. Follows natural animal movement routes: waterway edges, stone wall lines, dirt track margins, scrubland-field boundaries. Fearful dogs travel along edges — not through open space — so corridor searching both finds the dog and disturbs it less.
- **For podencos and galgos specifically**: prioritize known hunting corridors and agricultural tracks. These breeds follow established scent trails at speed. In the Algarve, focus on the paths between the last known location and the nearest water source (ribeiras, irrigation channels).

**Scent tracking dogs** [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]] [[how-accurate-are-search-dogs-part-1-area-detection-dogs-lost-pet-research-and-re]]:
- Helton 2009 meta-review: experienced search dogs detect target scent 91.61% of the time with a 3.42% false-positive rate.
- Experienced handler teams (>18 months working together): 96% trail accuracy. Novice teams: 53.3%.
- Handler *area selection* is the bottleneck — a dog deployed to the wrong area produces nothing. A probability-based spatial model of where the dog is likely to be directly multiplies search dog ROI.
- Deploy search dog only to high-probability corridors confirmed by sighting data or camera evidence.

**Primary volunteer task assignment by phase:**

| Phase | Task priority |
|---|---|
| Day 0–1 | Door-to-door canvassing (witness memory expires) |
| Day 1–3 | Large neon poster distribution at intersections |
| Day 1–3 | Repeated shelter checks (in-person) |
| Day 3–14 | Camera station monitoring (SD card swap) |
| Day 7+ | Expanded flyer distribution to farms/businesses |
| Any | Social media monitoring and sighting logging |

### 5.2 Timing and Sequencing

- Days 0–1: canvassing is the highest-ROI volunteer task. Witnesses exist only briefly.
- Days 1–3: poster distribution and shelter checks.
- Days 3+: camera station monitoring is the primary task (especially critical for shy profiles where station cannot be physically disturbed).
- Physical search parties: activate only when a credible sighting exists with a specific 500m zone.
- Scent dog: deploy after movement corridor established, not before.

### 5.3 Profile-Specific Variations

| Profile | Max search party | Search mode | Search pattern | Terrain priority (Algarve) |
|---|---|---|---|---|
| Gregarious | Unlimited | Active, vocal permitted | Grid in open; corridor in woods | Any |
| Aloof | 2–3 max | Silent | Corridor, travel routes | Scrubland edges, paths |
| Xenophobic | 1–2 trained handlers | Silent only | No active pattern; camera monitoring | N/A (passive only) |
| Podenco / Galgo | 1–2 trained handlers | Silent only | Waterway + track corridors | Ribeiras, irrigation channels, dirt tracks |

### 5.4 Error Modes

- Assigning multiple volunteers to converge on the same sighting location for a xenophobic dog → collective approach equals flight trigger.
- Using active grid search for a confirmed xenophobic dog → drives the dog out of the established search zone.
- Deploying a scent dog before a movement corridor is established → handler has no high-probability area to focus, ROI collapses.
- Volunteer vehicles in the search zone for fearful profiles → motor noise at 200–500m causes flight before any visual contact.
- Volunteer "helpfulness" in verbally alerting others when dog is spotted → shouting the location causes the dog to bolt.

### 5.5 Encodable Rules

```
IF profile == "gregarious":
  max_group_size = unlimited
  vocal_search_permitted = True
  search_pattern = ["grid", "corridor"]

IF profile IN ["aloof", "xenophobic", "hunting_breed"]:
  max_group_size = 2
  vocal_search_permitted = False
  vehicle_in_search_zone = False
  active_grid_search = False
  search_pattern = "corridor_only"  # waterways, paths, stone wall lines

IF profile == "hunting_breed":  # podenco / galgo
  search_pattern = "waterway_and_track_corridors"
  search_radius = "10-30km"

IF search_dog_requested:
  precondition = "movement_corridor_established_from_sightings_or_camera_data"
  handler_experience = "18_months_minimum"
  deployment_zone = "high_probability_zone_only"

volunteer_separation = "200m_minimum_for_fearful_profiles"

task_priority = {
  "day_0_to_1": "door_to_door_canvassing",
  "day_1_to_3": "poster_distribution + shelter_checks",
  "day_3_plus": "camera_monitoring_sd_swap",
  "any_phase": "sighting_logging_and_social_media_monitoring"
}

IF dog_sighted_by_volunteer:
  rule = "EVERYONE STOPS. Single handler responds. No verbal alerts."
```

---

## Sources

All claims are drawn from vault notes. Key sources:

- [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]] — Kat Albrecht / MAR primary behavioral taxonomy and protocol
- [[what-you-dont-know-about-lost-pets-can-hurt-them]] — Albrecht / Maddie's Fund 2021 comprehensive guide
- [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]] — MAR trap timing and feeding station protocol
- [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]] — Survival mode phases
- [[surveillance-cameras-missing-animal-response-network]] — MAR camera setup guide
- [[assessing-arrays-of-multiple-trail-cameras-to-detect-north-american-mammals-pmc]] — Evans & Mortelliti 2019, PLoS ONE
- [[camera-trap-placement-guide-how-to-position-your-trail-camera-naturespy]] — PIR sensor and placement mechanics
- [[dont-use-pee-to-attract-a-lost-pet-by-kat-albrecht]] — Albrecht 2024, scent lure analysis
- [[feeding-stations-buddha-dog-rescue-recovery]] — Feeding station setup, liquid smoke
- [[lure-lost-or-stray-dogs-do-not-chase-after-them-missing-animal-response-network]] — MAR chase behavior and approach protocol
- [[behaviors-to-avoid-ct-dog-gone-recovery]] — CT Dog Gone Recovery error list
- [[drones-and-lost-pet-recovery-how-effective-are-they-missing-animal-response-netw]] — MAR / Ted Bachman drone analysis
- [[to-reward-or-not-to-rewardthat-is-the-question-missing-animal-response-network]] — Albrecht, reward language neuroscience
- [[neon-posters-missing-animal-response-network]] — 5+5+55 Rule, inattentional blindness
- [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]] — Albrecht 2018, IAABC; Lord 2007 recovery data
- [[how-accurate-are-search-dogs-part-1-area-detection-dogs-lost-pet-research-and-re]] — Helton 2009, search dog accuracy
- [[how-to-approach-shy-dogs-best-friends-animal-society]] — Best Friends Animal Society approach protocol
