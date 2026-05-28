---
title: Untitled
tags:
- lost-dog-behavioral
- dog-movement-algarve
- lost-dog
- survival-mode
- kat-albrecht
created: '2026-05-28T07:18:36Z'
updated: '2026-05-28T09:28:54.274220Z'
source: user-prompt (brief_01_behavioral_engine.md)
status: review
type: note
deprecated: false
summary: 'Project: Nona / Red Cão Algarve — Lost dog rescue operating system'
---

# Research Brief 01 — Probabilistic Behavioral Engine

**For:** Researcher  
**Project:** Nona / Red Cão Algarve — Lost dog rescue operating system  
**Topic:** Probabilistic behavioral classification + temporal scenario evolution  
**Priority:** Core — everything else builds on this

---

## Context

We are building a rescue platform for lost dogs in the Algarve, Portugal. When a dog is reported lost, we ask the owner 3 behavioral questions (sociability, environment, stress indicators) and compute ranked probability scenarios: "68% human interaction/vehicle → these specific actions", "24% nearby hiding → these other actions", etc.

We currently produce a **static snapshot** of scenarios at intake. The fundamental problem is that **a lost dog's behavior changes dramatically over time** — and so should the recommended strategy. A dog on day 1 behaves completely differently than the same dog on day 7. Our scenarios need to evolve dynamically.

We also need **breed-specific behavioral priors** hardcoded into the model. A galgo and a podenco lost in identical circumstances require completely different search strategies.

---

## What we need researched

### 1. Temporal behavioral phases — empirical data

We currently use a rough 3-phase model (0–24h panic, 24h–7d survival, 7d+ recovery). We need this validated and refined with real data.

**Find:**
- What does the literature say about behavioral phase transitions in lost dogs? (Key authors: Kat Albrecht / Missing Animal Response, Lord 2007 JAVMA)
- At what hour/day thresholds does behavior typically shift?
- What are the behavioral signatures of each phase? (movement radius, activity timing, response to stimuli, feeding behavior)
- How does fear/stress level at time of loss affect phase progression?
- What percentage of dogs found alive are found in each phase?

### 2. Breed-specific behavioral priors — lost dog context

Not training or personality in general — specifically **how different breed types behave when lost and stressed**.

**Find:**
- Documented differences in lost dog behavior by breed category: sighthounds (galgo, greyhound), scent hounds (podenco, beagle), toy breeds, herding breeds, guardian breeds, mixed/unknown
- For each category: typical movement radius by day, tendency to approach humans vs hide, tendency to follow roads vs terrain, typical survival behavior
- Specific data on galgo behavior when lost (extremely important for Algarve — large rescued galgo population, high trauma baseline)
- Specific data on podenco behavior when lost (native Algarve breed, hunting instinct, high prey drive)
- Any published studies comparing breed-type outcomes (recovery rate, distance found, method of recovery)

### 3. Bayesian updating from sightings

We receive sightings (location + time + description) as the case progresses. We need to update probability scenarios with each sighting, not just display them.

**Find:**
- How does Missing Animal Response / professional lost dog recovery incorporate new sighting data into search strategy?
- Are there published frameworks for weighing sighting reliability? (eyewitness accuracy for dog identification, distance estimation errors, timing accuracy)
- How should a confirmed sighting at time T update the expected position distribution at time T+12h?
- What makes a sighting reliable vs unreliable? (description specificity, distance, lighting, observer type)

### 4. Fear escalation dynamics

Many dogs that could be recovered go into a "flight response loop" — they see their owner and run. This is one of the most common recovery failures.

**Find:**
- What triggers the shift from "lost and searching for home" to "traumatized evasion mode"?
- What is the scientific basis for the "never chase" rule?
- At what point does active searching become counterproductive?
- What behavioral signals indicate a dog has entered evasion mode vs is approachable?
- Documented cases or studies on recovery failure caused by incorrect owner behavior

---

## Output format requested

For each of the 4 sub-topics above, provide:

1. **Key empirical findings** — what the evidence actually says (with source citations where available)
2. **Calibration numbers** — specific probabilities, distances, time windows we can encode
3. **Knowledge gaps** — where data is anecdotal vs empirically validated
4. **Practical encoding** — how we should represent this in a scoring/weighting system

Key sources to check: Kat Albrecht's Missing Animal Response (MAR) publications, Lord 2007 JAVMA study, Albrecht 2002, any academic literature on lost pet behavior, ASPCA research, Missing Pet Partnership resources.

---

## What we will do with this

The output feeds directly into the system prompt of our AI model (Claude) and into hardcoded priors in our scenario computation logic. We need numbers and rules we can actually encode, not just qualitative descriptions.
