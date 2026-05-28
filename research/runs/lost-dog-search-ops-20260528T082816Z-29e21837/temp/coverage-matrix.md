# Coverage Matrix — query phrase → atomic item mapping

| Query phrase (verbatim) | Mapped atomic item(s) | Scope check | Gap? |
|---|---|---|---|
| "optimal action sequence for the first 6 hours" | Sub-Q1: 0–6h phase protocol | OK — full scope | No |
| "First 24 hours" | Sub-Q2: 6–24h phase protocol | OK | No |
| "Days 2–4" | Sub-Q3: days 2–4 protocol | OK | No |
| "Days 5–10" | Sub-Q4: days 5–10 protocol | OK | No |
| "Day 10+" | Sub-Q5: day 10+ protocol | OK | No |
| "time-critical" actions | Sub-Q6: time-critical vs counterproductive classification | OK | No |
| "Sociable dog" | Entity: sociable dog profile + Sub-Q7 | OK | No |
| "Shy/traumatized dog" | Entity: shy/traumatized profile + Sub-Q8 | OK | No |
| "Hunting breed (podenco, galgo)" | Entity: hunting breed profile + Sub-Q9; specific breeds listed | OK — galgo and podenco both named | No |
| "Missing Animal Response (MAR)" | Entity: MAR + Sub-Q10 | OK | No |
| "Kat Albrecht" | Entity: Kat Albrecht + Sub-Q10 | OK | No |
| "anchor scent method" | Sub-Q11: anchor scent method specifics | OK | No |
| "camera trap placement" | Sub-Q12: placement best practices (height, angle, distance) | OK | No |
| "Near food vs on movement corridor vs at last-known location" | Sub-Q13: camera placement strategy | OK | No |
| "How many cameras" | Sub-Q14: camera count / coverage area | OK | No |
| "optimal bait/scent setup" | Sub-Q15: bait/scent with camera | OK | No |
| "What time periods yield the most detections" | Sub-Q16: detection time periods | OK | No |
| "How far should cameras be from last known location on day 1 vs day 7" | Sub-Q17: camera distance by phase | OK | No |
| "wooded Mediterranean terrain (eucalyptus, cork oak, maquis scrubland)" | Scope condition: Algarve terrain + Sub-Q18 | OK | No |
| "What factors make a sighting reliable vs false positive" | Sub-Q19: sighting reliability factors | OK — includes all sub-factors (observer familiarity, specificity, distance, time of day, behavior, location plausibility) | No |
| "mass false sightings" | Sub-Q20: mass false sightings from viral posts | OK | No |
| "conflicting sightings" | Sub-Q21: conflicting sightings handling | OK | No |
| "published framework for sighting reliability scoring" | Sub-Q22: scoring framework | OK | No |
| "appropriate response to an unverified sighting" | Sub-Q23: response protocol | OK | No |
| "Chasing the dog when sighted" | Sub-Q24/25: owner error + mechanism + alternative | OK | No |
| "Large search parties" | Sub-Q26: large search party error | OK | No |
| "Calling the dog's name loudly" | Sub-Q27: calling error | OK | No |
| "Posting exact current location on social media" | Sub-Q28: social media posting error | OK | No |
| "Using drones" | Sub-Q29: drone use error | OK | No |
| "Removing scent station too early" | Sub-Q30: premature scent station removal | OK | No |
| "Using food that is too strong/too weak" | Sub-Q31: food strength error | OK | No |
| "Feeding the dog when first captured" | Sub-Q32: refeeding syndrome / GI emergency | OK | No |
| "documented case study of recovery failure from drone use or crowd convergence" | Sub-Q33: case studies | OK | No |
| "correct protocol when an owner spots their own fearful dog" | Sub-Q34: owner spot protocol | OK | No |
| "wilderness SAR" search patterns | Sub-Q35: SAR patterns adapted for lost dog | OK | No |
| "maximum group size before counterproductive" | Sub-Q36: max volunteer group size | OK | No |
| "divide search areas among multiple volunteers" | Sub-Q37: area division | OK | No |
| "instructions should volunteers be given" | Sub-Q38: volunteer behavior instructions | OK | No |
| "grid search or corridor search" | Sub-Q39: grid vs corridor for terrain | OK | No |
| "organized pet recovery operations or volunteer search groups" | Sub-Q40: organized group protocols | OK | No |
| "The Lost Pet Chronicles" | Entity: book reference | OK | No |
| "Pet Tracker" | Entity: book reference | OK | No |
| "Missing Pet Partnership" | Entity: organization publications | OK | No |
| "Portuguese GNR or animal protection organizations" | Scope: Portuguese context sources | OK — listed as source priority | No |
| "encodable rules" / "if/then rules" | Required format field 5: encodable rules per sub-topic | OK | No |
