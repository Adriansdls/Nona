---
title: Untitled
tags:
- lost-dog-behavioral
- dog-movement-algarve
- lost-dog
- camera-trap
- terrain
created: '2026-05-28T09:28:53.266208Z'
updated: '2026-05-28T09:28:54.364082Z'
status: review
type: note
deprecated: false
summary: 'Project: Nona / Red Cão Algarve — Lost dog rescue operating system'
---

# Research Brief 06 — Collective Learning + Case Outcome Database

**For:** Researcher  
**Project:** Nona / Red Cão Algarve — Lost dog rescue operating system  
**Topic:** Building a case outcome database to discover patterns and improve probabilistic models over time  
**Priority:** Medium (long-term value, requires case volume — but data design decisions must be made now)

---

## Context

We are building a rescue platform for lost dogs in the Algarve, Portugal. Every case we handle is a data point. If we track the right variables at intake and at resolution, we accumulate a structured dataset that no one else has: **what actually worked, in this specific region, for specific dog profiles, under specific conditions**.

The problem in lost dog recovery globally is that knowledge is:
- Anecdotal (what one rescuer experienced)
- Self-selected (only memorable/unusual cases get written up)
- Geographically non-specific (US suburban data applied globally)
- Recovery-method uncontrolled (did the dog come back because of the Facebook post, or despite it?)

We are in a unique position: a real platform, real cases, capturing structured data from day 1. In 2–3 years with 200+ cases, we could have the first empirically grounded lost dog recovery dataset for southern Portugal — and potentially the first region-specific probabilistic recovery model anywhere.

This research brief is about: what data exists already globally, what we should capture to build our own, and how to structure it for eventual ML use.

---

## What we need researched

### 1. Existing lost dog outcome datasets — what already exists

Before building our own, we need to know what's out there.

**Find:**
- Are there any published datasets on lost dog outcomes? Academic or otherwise?
- What variables were captured in existing studies (Lord 2007 JAVMA, Weiss 2012, any others)?
- What were the main findings of these studies regarding:
  - How are lost dogs found? (returned home alone, found by owner, brought to shelter, found dead)
  - What fraction are recovered, and at what time intervals?
  - What methods correlate with recovery? (physical shelter visits, social media, posters, search dogs)
  - Do breed, size, sociability, urban/rural correlate with outcome?
- Are there any regional datasets from European countries? (UK RSPCA, German shelters, French SPA, Portuguese LPDA or UIPA?)
- What methodological limitations exist in the published literature (self-selection bias, retrospective reporting, unclear causation)?
- Are there databases from organizations like Missing Pet Partnership, Finding Rover, Petfbi that might share aggregated data?

### 2. What variables we should capture per case — data schema design

We need to decide NOW what to record, because retrospective data collection is unreliable.

**Find:**
- What intake variables are most predictive of recovery outcome in the literature?
  - Dog characteristics: breed, age, sex, castrated, size, weight, physical condition
  - Behavioral profile: sociability, stress baseline, prior escapes, fear triggers
  - Circumstances of loss: how lost (gate open, car accident, fear trigger, etc.), time of day, weather
  - Environment: terrain type, road proximity, urban/rural, distance from home
- What process variables should we track during the case?
  - Actions taken: shelter visits, poster distribution, social posts (which groups, reach), camera deployment, scent station, active searches
  - Sightings: number, location, time, reliability score, behavioral description
  - Owner compliance: did they follow protocol? Which instructions did they follow?
- What outcome variables should we capture at resolution?
  - Found/not found (binary is insufficient — more granular needed)
  - Recovery method: how exactly was the dog found? (walked home, owner spotted, stranger reported, shelter intake, camera detection, search dog)
  - Recovery location: distance from last known, direction, terrain type
  - Time to recovery
  - Dog's condition at recovery (physical + behavioral)
  - What turned out to be the decisive factor (if known)?
  - What was tried that demonstrably failed?
- Schema for "failure cases" — unresolved cases are data too, not just noise

### 3. Causation vs correlation — study design considerations

If we want to eventually say "method X causes better recovery," we need to think about study design now.

**Find:**
- What are the main confounders in lost dog recovery research? (cases where owners try more things are also cases with more motivated owners — selection bias)
- How have the best studies tried to control for this?
- Is randomized assignment feasible in any part of our protocol? (e.g., could we randomize shelter visit reminders and measure impact?)
- What is the minimum case volume needed to detect meaningful effects? (rough power calculation for detecting, say, a 15% difference in recovery rates between two protocol variants)
- Are there any A/B testing frameworks used in other animal welfare research?
- How should we handle the "no outcome" cases — dogs that were not found, where we lost contact with the owner?

### 4. Breed-specific outcome patterns — what we should track to discover

The hypothesis is that different breeds have dramatically different outcome distributions. We want to be able to eventually say "galgos in the Algarve are found X% of the time, typically within Y km, via method Z."

**Find:**
- What breed categorization scheme is most useful for this analysis? (pure breed vs mixed, by functional group, by size class?)
- Are there existing breed-specific recovery statistics anywhere in the literature?
- Are there specific Iberian breeds (galgo, podenco, podenco ibicenco, perdigueiro) for which any behavioral or recovery data exists?
- What outcome differences by breed are most important to capture? (recovery rate, time to recovery, distance found, method of recovery)

### 5. Regional pattern discovery — what patterns are unique to the Algarve

The Algarve has features that may produce patterns not seen elsewhere.

**Find:**
- Any existing data on stray dog populations in the Algarve or Alentejo (baseline understanding of the "found but not reported" population)
- INE or municipal data on dog registration rates in Algarve municipalities (how many dogs are registered vs unregistered? High unregistered rate = higher baseline stray confusion)
- Any Portuguese veterinary association data on chip scanning rates or found dog processing
- Any Portuguese GNR or SEPNA (environmental police) data on animal-related calls in the Algarve
- Tourism seasonality data from Turismo do Algarve: tourist volume by month, by municipality — to understand seasonal variation in our human behavior model
- Are there known seasonal patterns in dog loss? (summer peak due to fireworks, hunting season, tourist abandonment?)

### 6. ML readiness — how to structure data for future modeling

**Find:**
- What ML approaches are appropriate for this type of problem? (survival analysis for time-to-recovery, classification for recovery method, regression for distance)
- What feature engineering approaches work well with small datasets (100–500 cases)?
- Are there examples of similar ML problems in veterinary or wildlife management literature we can learn from? (animal movement prediction, wildlife recapture modeling)
- What is the minimum dataset size before ML adds value over simple statistical analysis?
- Should we use transfer learning from global datasets to compensate for small local dataset? How?
- Are there any open source tools or frameworks specifically for lost pet analytics?

---

## Output format requested

For each sub-topic:

1. **Existing knowledge** — what's already published or available
2. **Gaps** — what doesn't exist that we could uniquely build
3. **Design recommendations** — specific decisions we should make now (what fields to capture, how to structure data)
4. **Minimum viable dataset** — what volume and quality of data we need before each type of analysis becomes possible
5. **Long-term opportunity** — what becomes possible at scale (500 cases, 2000 cases)

Key sources to check: Lord 2007 JAVMA (the most-cited lost pet study), Weiss et al. 2012 (shelter intake study), Patronek & Rowan general pet demographics research, Missing Pet Partnership publications, any Portuguese LPDA/UIPA/Animais de Portugal data, INE dog registration statistics, Google Scholar search "lost dog recovery outcome" + "stray dog behavior" + "pet reclaim rate".

---

## What we will do with this

We will use this to:
- Finalize the data schema for case capture (what fields to add to our database from day 1)
- Build the outcome recording flow (what we ask owners when a case is resolved)
- Design the "case knowledge base" that the AI agent can query for pattern matching ("similar case: galgo, Silves, rural, found on day 6 via camera trap 1.8km south")
- Eventually: train or fine-tune probability models on our own regional data instead of relying purely on behavioral heuristics
- Potentially: publish the first structured lost dog recovery dataset for southern Europe — genuine scientific contribution
