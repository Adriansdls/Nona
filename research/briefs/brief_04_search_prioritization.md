---
title: Untitled
tags:
- lost-dog-behavioral
- dog-movement-algarve
- lost-dog
- kat-albrecht
- galgo-behavior
created: '2026-05-28T09:28:53.265160Z'
updated: '2026-05-28T09:28:54.363334Z'
status: review
type: note
deprecated: false
summary: 'Project: Nona / Red Cão Algarve — Lost dog rescue operating system'
---

# Research Brief 04 — Dynamic Search Prioritization + Field Operations

**For:** Researcher  
**Project:** Nona / Red Cão Algarve — Lost dog rescue operating system  
**Topic:** How to translate probability models into actionable, time-indexed field instructions  
**Priority:** High — the operational output of the whole system

---

## Context

We are building a rescue platform for lost dogs in the Algarve, Portugal. Our system computes probability scenarios for what happened to a lost dog. But probability is useless unless it produces **specific, prioritized actions** the owner and volunteers should take **right now**.

The fundamental problem with current lost dog recovery guidance is that it is:
- Generic ("search near where they were lost")
- Static (same advice on day 1 as day 7)
- Ignores the dog's behavioral profile (same advice for a shy traumatized galgo and a sociable labrador)
- Ignores terrain and human geography (same advice for rural isolated and urban coastal)

We want to output a **dynamic field guide** — specific actions ranked by expected value, changing every 24 hours, parameterized by the case's behavioral profile and current phase.

We also want to prevent common **catastrophic errors** owners make that reduce recovery probability (chasing the dog, large search parties, wrong camera placement, posting wrong information publicly).

---

## What we need researched

### 1. Time-indexed protocol — what to do at each phase

**Find:**
- What is the optimal action sequence for the first 6 hours? First 24 hours? Days 2–4? Days 5–10? Day 10+?
- Which actions are time-critical (must be done in first hours), and which become counterproductive over time?
- How does the optimal protocol differ by behavioral profile?
  - Sociable dog: when to search actively, when to wait
  - Shy/traumatized dog: why active searching often fails, what works instead
  - Hunting breed (podenco, galgo): long-range movement, what changes
- Is there any published protocol from Missing Animal Response (MAR) or equivalent organizations?
- What does the "anchor scent" method involve specifically? (placing owner's clothing, food, familiar objects at last-known location)

### 2. Camera trap placement — optimization

Camera traps are one of the highest-ROI tools for non-sociable dogs. Placement is critical and non-obvious.

**Find:**
- What are the documented best practices for camera trap placement in lost dog recovery?
  - Height (pointed downward vs straight)
  - Distance from trail/corridor
  - Coverage angle
  - Near food vs on movement corridor vs at last-known location
- How many cameras are needed for effective coverage of what area?
- What is the optimal bait/scent setup alongside a camera?
- What time periods yield the most detections? (early morning, night — empirical data?)
- How far should cameras be from the last known location on day 1 vs day 7?
- Any specific recommendations for wooded Mediterranean terrain (eucalyptus, cork oak, maquis scrubland)?

### 3. Sighting lead scoring + triage

We receive sightings from the public. Not all are equally reliable. We need to triage them systematically.

**Find:**
- What factors make a sighting reliable vs false positive?
  - Observer's familiarity with the dog (owner vs stranger)
  - Description specificity (matches breed/color/markings vs vague)
  - Distance of observation
  - Time of day (lighting conditions)
  - Behavior described (matches expected behavioral phase)
  - Location plausibility (within expected movement radius for phase + profile)
- Are there documented cases of mass false sightings (multiple confirmed wrong reports following viral posts)?
- How should conflicting sightings be handled? (two sightings in opposite directions on same day)
- Is there a published framework for sighting reliability scoring?
- What is the appropriate response to an unverified sighting? (immediate area visit? camera deployment? wait for confirmation?)

### 4. Owner error prevention — what NOT to do

Many recoveries are failed by the owner's own behavior. This is one of the most important topics.

**Find:**
- Complete documented list of common owner behaviors that reduce recovery probability:
  - Chasing the dog when sighted (why this is catastrophic for fearful dogs)
  - Large search parties (noise, crowd stress)
  - Calling the dog's name loudly (can trigger flight)
  - Posting exact current location on social media (people converge, dog flees)
  - Using drones (noise, perceived aerial predator)
  - Removing scent station too early
  - Using food that is too strong/too weak
  - Feeding the dog when first captured (too much too fast = GI emergency)
- For each error: what is the mechanism of harm? What is the correct alternative?
- Is there a documented case study of recovery failure from drone use or crowd convergence?
- What is the correct protocol when an owner spots their own fearful dog? (drop food, turn away, crouch, etc.)

### 5. Volunteer coordination — search pattern assignment

When we have volunteers available, how do we assign them to maximize coverage without counterproductive effects?

**Find:**
- What search patterns are used in wilderness SAR (Search and Rescue) and how do they adapt to lost dog recovery?
- What is the maximum group size before a search party becomes counterproductive for fearful dogs?
- How should search areas be divided among multiple volunteers without overlap or gaps?
- What instructions should volunteers be given about behavior during search (silent approach, no calling, etc.)?
- Is grid search or corridor search more effective for different terrain types?
- Any specific protocols from organized pet recovery operations or volunteer search groups

---

## Output format requested

For each sub-topic:

1. **Evidence-based protocol** — specific step-by-step guidance backed by literature or documented practice
2. **Timing and sequencing** — when each action applies, in what order, for how long
3. **Profile-specific variations** — how the protocol changes for shy vs sociable, hunting breed vs companion breed
4. **Error modes** — what goes wrong when this is done incorrectly
5. **Encodable rules** — specific if/then rules we can build into our AI agent's decision logic

Key sources to check: Kat Albrecht / Missing Animal Response (MAR) — she is the primary source for operational protocol. Her books: "The Lost Pet Chronicles", "Pet Tracker". Missing Pet Partnership publications. Any wilderness SAR literature adapted for pet recovery. Facebook group anecdotes from organized rescues (observe actual practices). Portuguese GNR or animal protection organizations field protocols.

---

## What we will do with this

We will use this to:
- Build the time-indexed field guide output (what to do RIGHT NOW based on hours elapsed + behavioral profile)
- Program our AI agent's proactive messaging to owners (what the PI agent tells the owner at each phase)
- Build camera placement recommendations as a specific output on the case page
- Build the sighting scoring system to filter/rank incoming sightings
- Build the "do not do this" alert system (flag when owner behavior might be counterproductive)
- Generate the volunteer assignment instructions when people offer to help
