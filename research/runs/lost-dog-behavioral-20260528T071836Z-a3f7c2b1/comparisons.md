---
title: Untitled
tags:
- lost-dog-behavioral
- locus-bayesian-sighting-update
- locus-dog-phase-transition-thresholds
- galgo-behavior
- camera-trap
created: '2026-05-28T09:28:53.365207Z'
updated: '2026-05-28T09:28:54.434945Z'
status: review
type: note
deprecated: false
summary: '> Corpus critic update (step 8): Key confidence adjustments after targeted
  fetch wave:'
---

# Cross-locus comparisons

> **Corpus critic update (step 8):** Key confidence adjustments after targeted fetch wave:
> - Phase 1 (72h boundary): **medium → medium-high** — Hennessy cortisol arc (days 1-3 peak, 4-9 declining, 9+ plateau) validates the direction from conference-level summary.
> - Action-gate prohibition for fearful dogs: **medium-high → high** — adversarial search for counterexamples returned zero results.
> - Galgo OR=8.34 spatial prior magnitude: **unchanged medium** — Normando 2025 full text (galgo predatory drive vs. greyhound) not accessible; dual-prior structure confirmed, magnitude uncertain.
> - Podenco 5-15km radius: **unchanged medium (70%)** — farm-dog GPS data (2.72-3.38km working context) doesn't directly bound lost/prey-chase scenario; adds Benediktová 2020 navigation mode (magnetic compass scouting on return).
>

## Tension 1: Phase 1 "direct approach viable" — but for whom?

- **Locus: dog-phase-transition-thresholds** ([[interim-report-dog-phase-transition-thresholds]]) commits: Phase 1 (0–72h) is the window when direct approach by owner is viable. Phase 2 begins at 48–96h with mandatory passive-only protocol. The 72h boundary reflects practitioner consensus across 3,000+ recovery cases.

- **Locus: breed-prior-individual-vs-population** ([[interim-report-breed-prior-individual-vs-population]]) commits: For galgo, stranger_approach_success_rate_day1 = 0.02. Individual signals override breed from the first data point, but breed prior governs until the first observation arrives.

- **The cross-locus dynamic:** The phase-transition model assumes a non-breed-specific baseline. Phase 1's "direct approach viable" claim is true for gregarious and mildly aloof dogs — but for galgos, the approach-avoidance prior is categorically different: the breed prior establishes that even on day 1, direct approach is near-guaranteed to fail (0.02 success rate). A galgo essentially starts in Phase 2 behavior from the moment it goes missing, not after 72h. The phase model and breed model must be multiplicative, not additive.

- **How the draft should engage this:** Section 1 (Temporal Phases) must explicitly note that Phase 1 thresholds are species-and-temperament-population averages, not universals. For galgo (and likely xenophobic/trauma-baseline breeds), Phase 2 protocol applies from day 0, with Phase 1 effective only for gregarious dogs. The phase model is the outer structure; breed prior is a modifier that can collapse Phase 1 to zero.

- **Calibration note:** Phase-thresholds investigator: medium confidence on 72h boundary (practitioner-only), explicitly noting ±48h range. Breed-prior investigator: medium-high confidence (Normando 2024 p=0.009 is empirical). When the more empirically grounded position (breed) conflicts with the heuristic position (phase), the draft should weight toward breed.

---

## Tension 2: Galgo needs two breed priors, not one — chase and approach-avoidance are separate systems

- **Locus: galgo-vs-greyhound-behavioral-equivalence** ([[interim-report-galgo-vs-greyhound-behavioral-equivalence]]) commits: Dual-prior model. Chase prior (OR≈8.34, prey-loss terminus fixation) uses greyhound data and governs WHERE to search. Approach-avoidance prior (passive-only from day 0, conspecific lure, weeks-to-months timeline) is galgo-specific and governs HOW to capture.

- **Locus: breed-prior-individual-vs-population** ([[interim-report-breed-prior-individual-vs-population]]) commits: Breed = capture-strategy prior (≤10% weight in probability score; full weight in capture-method selector). Single capture-method output per breed.

- **The cross-locus dynamic:** The breed-prior locus underspecifies the galgo case. It treats breed as feeding one output (capture method selector), but the galgo actually requires breed to feed TWO separate model outputs: (1) spatial prior — where the dog is likely to be, which the chase/greyhound data governs (the dog fixates on the prey-loss terminus, OR=8.34); and (2) capture method — how to approach and recover, which is galgo-specific (passive only, conspecific lure, 72h minimum). These two priors operate on fundamentally different behavioral systems (predatory motor sequence vs. trauma-fear system) and must be encoded separately. A single "breed → capture method" mapping misses the spatial modulation.

- **How the draft should engage this:** Section 2 (Breed-Specific Priors) for galgo must explicitly state two priors: galgo_spatial_prior (derived from greyhound chase data; high prey-displacement risk in scrubland; 8x tendency to fixate at prey-loss terminus) and galgo_capture_prior (independent; passive-only; 0.02 approach success rate day 1). The report must flag that conflating these into a single breed prior would produce a miscalibrated model.

- **Calibration note:** Galgo-equivalence investigator: high confidence on dual-prior structure; medium confidence on OR=8.34 (wide CI 1.72–42.38). Breed-prior investigator: medium-high. The structural dual-prior recommendation has stronger logical support than either empirical value.

---

## Tension 3: Bayesian action-gate and temperament-conditional search — convergent on fearful dogs, divergent on gregarious

- **Locus: bayesian-sighting-update** ([[interim-report-bayesian-sighting-update]]) commits: The action gate strictly separates belief update (always occurs) from response action (blocked for fearful dogs). For shy/fearful dogs: no crowd response regardless of sighting quality; camera-station deployment within 4h; trap only after camera confirms feeding pattern.

- **Locus: search-mode-temperament-sighting-protocol** ([[interim-report-search-mode-temperament-sighting-protocol]]) commits: Gregarious+exploratory dogs = active search is recovery-positive; sighting can be "semi-public" (identified calm-protocol volunteers, not open social media). For xenophobic/aloof/evasion-phase: strict private (coordinator only).

- **The cross-locus dynamic:** The two loci independently converged on the same conclusion for fearful dogs — no crowd response, ever. This convergence from independent mechanisms (Bayesian update architecture vs. temperament-gated search doctrine) is itself a high-confidence finding. Where they diverge: for gregarious+exploratory dogs, Locus 5 allows limited public response, while Locus 4's action-gate framework doesn't explicitly condition on temperament (it blocks crowd for "fearful" dogs, implying gregarious = crowd-ok). The divergence is partial — both would likely agree that even for gregarious dogs, a calm, coordinated individual response is better than open social-media broadcasting. The gap is between "limited volunteers with calming protocol" (Locus 5) and "camera station first" (Locus 4).

- **How the draft should engage this:** Section 3 (Bayesian Updating) should foreground the convergent finding: three independent case studies (Winnie, Princess Borzoi) plus two independent analytical frameworks reach identical conclusions — crowd response to sighting is the most dangerous single action for fearful dogs. Then address the gregarious exception: the report should specify that even gregarious dogs benefit from a quiet coordinated response rather than open broadcasting, but the action-gate is softer. The convergence is load-bearing; the divergence is an implementation detail.

- **Calibration note:** Both investigators rated their positions as medium-high confidence on the structural point; medium confidence on specific implementation parameters. The convergence upgrades overall confidence.

---

## Tension 4: Podenco's 5–15 km movement radius collapses the Phase 1 window for prey-drive escape

- **Locus: podenco-lost-movement-pattern** ([[interim-report-podenco-lost-movement-pattern]]) commits: A prey-drive-escape podenco covers 5–15 km in 24–48h via expanding ellipse (scrubland-biased). Passive recovery only: feeding station + scent anchor + trap within 48h.

- **Locus: dog-phase-transition-thresholds** ([[interim-report-dog-phase-transition-thresholds]]) commits: Phase 1 (0–72h) is when direct approach is viable. Breed/temperament modifiers: ±48h on Phase 1 boundary.

- **The cross-locus dynamic:** For a prey-drive-escape podenco, Phase 1 ("direct approach viable") doesn't meaningfully exist in the way the phase model describes. A podenco in active prey-drive state is moving 5–15 km in the first 48h — the dog is not "findable and approachable" during this window because (a) it's covering too much terrain and (b) its arousal state suppresses food-lure effectiveness and human-approach tolerance. The ±48h breed modifier from Locus 3 is far too small to describe a collapse from "72h Phase 1" to "effective Phase 1 = 0h" for prey-drive escape cases. These cases require a third escape-trigger classification alongside temperament: prey-drive escape produces a fundamentally different temporal profile from trauma-freeze or opportunistic wandering.

- **How the draft should engage this:** Section 1 (Temporal Phases) and Section 2 (Breed Priors) must jointly address the escape-trigger variable as a first-class modifier of phase duration. The 3-phase model needs a fourth input alongside time-elapsed: escape trigger type (opportunistic/wanderlust/blind-panic/prey-drive-escape). Podenco prey-drive escape = Phase 1 effective duration ≈ 0–4h; Phase 2 mandatory from hour 4 onwards. This is not a "modifier" but a distinct temporal profile.

- **Calibration note:** Podenco investigator: medium confidence (no GPS telemetry data for podencos in Mediterranean scrubland). Phase-threshold investigator: medium confidence on 72h boundary. Neither position has strong empirical grounding for breed-specific phase durations — flagging this as a genuine knowledge gap in the report is essential.

---

## Tension 5: Individual-signal override timing conflicts with operational feasibility

- **Locus: breed-prior-individual-vs-population** ([[interim-report-breed-prior-individual-vs-population]]) commits: Individual signals override breed from the first data point. The breed prior is a starting-point prior, immediately updatable.

- **Locus: bayesian-sighting-update** ([[interim-report-bayesian-sighting-update]]) commits: Sighting reliability weights range from λ=0.95 (trail camera) to λ=0.20 (crowd-degraded eyewitness). Most early sightings are low-λ eyewitness sightings.

- **The cross-locus dynamic:** "Individual signals override breed" presupposes that the signals are reliable enough to override. In the first hours of a search, the available signals are almost exclusively low-quality: owner self-report (behavioral questions at intake), and early eyewitness sightings (λ=0.35–0.70). Trail camera observations (λ=0.95) are only available after days of trapping setup. The breed prior may need to be retained at higher weight for longer than "first data point" — specifically for cases where early signals are low-λ — because a wrong override of the galgo breed prior (treating the dog as gregarious based on a misidentified sighting) could trigger a crowd response that causes fatal displacement. The action-gate is the safety mechanism: even if individual signals incorrectly suggest gregarious, the breed-level galgo flag should maintain the passive-only action gate.

- **How the draft should engage this:** The practical encoding section for both Sections 2 and 3 must specify: breed prior governs the ACTION GATE even when individual signals may suggest otherwise, until a high-λ observation (camera-confirmed) arrives. The probability score can update from low-λ signals; the action gate should not. This is a safety constraint derived from the asymmetric cost of errors (false gregarious classification → crowd → displacement → potential fatality vs. false xenophobic classification → unnecessary trap setup → wasted effort only).

- **Calibration note:** Breed-prior investigator explicitly flagged that a high-λ galgo-in-active-approach observation would change the position. Sighting-update investigator: medium confidence on λ values specifically. The action-gate safety constraint has high confidence across both loci.
