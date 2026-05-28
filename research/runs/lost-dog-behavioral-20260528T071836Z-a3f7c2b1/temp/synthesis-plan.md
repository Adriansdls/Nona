---
title: Untitled
tags:
- lost-dog-behavioral
- lost-dog
- sighthound
- terrain
- dog-movement-algarve
created: '2026-05-28T09:28:53.387791Z'
updated: '2026-05-28T09:28:54.461049Z'
status: review
type: note
deprecated: false
summary: Nona's behavioral engine requires a four-axis probabilistic model (time-elapsed
  × temperament/breed × escape-trigger ...
---

# Synthesis plan — lost-dog-behavioral

## Core thesis (2 sentences)
Nona's behavioral engine requires a four-axis probabilistic model (time-elapsed × temperament/breed × escape-trigger × sighting-history) with two architecturally decoupled output layers: a continuous Bayesian spatial-belief map updated by reliability-weighted sightings, and a discrete action gate that authorizes search responses based on temperament × phase × prior-conditioning state. The dominant cause of recovery failure is fear escalation under search pressure — an asymmetric error where false-gregarious classification causes fatal crowd-displacement while false-xenophobic classification only wastes effort — which demands a safety-conservative default architecture where breed governs the action gate at full weight even as it contributes ≤10% to the probability score.

## The 7 strongest argumentative beats

1. **Decoupled belief update + action gate** — from all 3 drafts (converged). `update_posterior()` and `action_gate()` are two separate functions that never merge. A high-confidence sighting ALWAYS updates the spatial prior; a crowd response to that sighting is NEVER authorized for fearful dogs. Resolution of the Lord-2007-vs-MAR paradox.

2. **Galgo dual-prior model** — from Draft B (deepest treatment). Galgo requires TWO breed priors: chase prior (where to search — derived from greyhound OR=8.34 prey-fixation at last-known-location) and approach-avoidance prior (how to capture — galgo-specific: passive, 72h minimum, conspecific lure). These operate on phylogenetically distinct behavioral systems and cannot be collapsed into one.

3. **Phase 1 boundary is breed/trigger-modulated, not universal** — from all 3. The 72h Phase 1 boundary applies only to gregarious-temperament, opportunistic-escape dogs. For galgo (any escape), Phase 1 effective duration ≈ 0h. For podenco prey-drive escape, Phase 1 ≈ 4h. The ±48h "breed modifier" in the phase model is structurally insufficient — breed and escape-trigger can collapse Phase 1 entirely.

4. **Distance distribution is bimodal: all-population vs. hard-case population** — from all 3. Kremer 2021 (70%/<1mi) measures all lost dogs including quick self-resolving cases. Albrecht 1999 (14mi mixed breeds) measures the hard-case population Nona actually serves. The synthesized prior must be bimodal: gregarious = 1-mile as 70th percentile; xenophobic/panic/sighthound = long-tail with no empirical upper bound.

5. **Crowd response to fearful dog sighting is categorically prohibited — confirmed by adversarial search** — from all 3. Princess Borzoi and Winnie cases provide quantified dose-response (7 miles/1 hour from crowd convergence). Adversarial search found zero counterexamples. The prohibition has moved from "doctrine" to "doctrine confirmed by absence of counterexample."

6. **Podenco as triple-sensory active-searcher with prey-drive arousal loop** — from Drafts A and C (most quantitative). McLennan's PMS data (Hunt/Chase 69%, Consume 8%) establishes that podenco prey chase is self-reinforcing and food lures fail mid-chase. Search area is expanding ellipse (5-15 km, 24-48h) in scrubland, driven by scent-primary + visual burst secondary movement.

7. **Breed as ≤10% probability score weight but 100% action gate weight** — from Draft C (most precisely encoded). The asymmetric error argument: breed predicts probability weakly (Morrill 2022: 9%) but governs the action gate strongly (Normando 2024: galgo p=0.009 stranger-fear) because the error asymmetry demands conservatism. Resolution of Morrill vs. Normando tension.

## Section structure (required headings)
1. `## 1. Temporal Behavioral Phases — Empirical Data`
2. `## 2. Breed-Specific Behavioral Priors`
3. `## 3. Bayesian Updating from Sightings`
4. `## 4. Fear Escalation Dynamics`

Each section: 4 subsections (Key Empirical Findings / Calibration Numbers / Knowledge Gaps / Practical Encoding)

## Per-section commitments

### Section 1: Temporal Behavioral Phases
- Evidence: Hennessy cortisol arc (days 1-3 peak, 4-9 declining, 9+ plateau) from Draft B; Kremer 91%/5-day shelf from A+C; Lord 2007 2-day median from A+C; Huang 2018 cat curve (34%/day-7, 50%/day-30) as dog proxy
- Argumentative beat: The 3-phase model is valid for gregarious dogs; for galgo/podenco, escape-trigger type collapses Phase 1 to 0-4h
- Cross-locus tension: Phase 1 universality vs. breed/trigger collapse → engage explicitly; name the knowledge gap (no peer-reviewed dog phase study exists)
- Calibration: Phase 1 = 0-72h (±48h); Phase 2 = 72h-7d; Phase 3 = 7d+; breed modifier for galgo: collapse Phase 1 to 0h; for podenco prey-drive: collapse to 4h

### Section 2: Breed-Specific Behavioral Priors
- Evidence: Normando 2024 (galgo stranger-fear p=0.009, n=410); Morrill 2022 (9% variance); Normando 2025 sighthound survey (n=768); McLennan podenco PMS; greyhound chase OR=8.34; Albrecht 1999 breed-distance data
- Argumentative beat: Dual-prior model for galgo (spatial from greyhound data; capture from galgo-specific); podenco as triple-sensory active-searcher with expanding ellipse 5-15km
- Cross-locus tension: Morrill vs. Normando → engage directly; resolution is breed encodes ≤10% probability score + 100% action gate
- Include table: all 6 breed categories × movement radius × approach tendency × terrain × capture method

### Section 3: Bayesian Updating from Sightings
- Evidence: Lin & Goodrich 2010 (Markov posterior update framework); SARBayes MapScore 0.78-0.81; HARTT sighting schema (date/time/location/direction/observer); Winnie/Princess cases; λ weights
- Argumentative beat: Belief update (always-on) and action gate (temperament-conditional) are architecturally separate; sighting quality scale λ=0.95/0.70/0.35/0.20
- Cross-locus tension: crowd response for gregarious vs. fearful → engage; resolution: camera-station only for fearful; limited quiet response for gregarious
- Knowledge gap: No dog-specific sighting reliability framework; λ values are medium-confidence inference

### Section 4: Fear Escalation Dynamics
- Evidence: Three triggers (xenophobic temperament / loud noise / prior capture conditioning); named cases (Lucy 10-264, Lacey 10-267, KoKo, Winnie, Princess); calming signals (Rugaas); 3×2 decision matrix
- Argumentative beat: Fear escalation is a monotonic state machine with 3 trigger types and 3 conditioning events; primary product of Nona is preventing escalation, not finding dogs
- Cross-locus tension: Lord 2007 (active search works) vs. MAR (pressure kills) → resolve via temperament-gating
- Include: 3×2 matrix (temperament × phase → search intensity), sighting broadcast protocol, calming signals approach protocol

## Where drafts disagreed → commit

- **Phase 1 precision:** A uses "72h"; B uses "48-96h range." **Commit to B's framing** — more epistemically honest. Encode as "approximately 72h (48-96h range; breed/trigger modifier may collapse to 0-4h)."
- **Breed score weight:** A and B keep this qualitative; C provides exact "≤10%." **Commit to C's formulation** — supports the precision the query asks for.
- **Galgo approach success rate:** All 3 use "~0.02"; confirmed in interim note committed position.

## Length target
- response_format: structured
- Pass 1 target: ~5000-6000 words (rough integrated from 3 drafts)
- Pass 2 final target: 3500-5000 words (cut redundancy, unify voice)
