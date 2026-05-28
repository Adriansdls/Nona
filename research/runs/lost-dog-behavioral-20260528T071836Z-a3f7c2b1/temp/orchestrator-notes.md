---
title: Untitled
tags:
- survival-mode
- galgo-rescue
- locus-bayesian-sighting-update
- prey-drive
- source-analysis
created: '2026-05-28T09:28:53.234504Z'
updated: '2026-05-28T09:28:54.275248Z'
status: review
type: note
deprecated: false
summary: 'DO NOT DELETE ANY ARTIFACTS. User will use all produced artifacts to create
  an Obsidian vault. This means:'
---

# Orchestrator Notes — lost-dog-behavioral

## User instruction (received during step 3)
**DO NOT DELETE ANY ARTIFACTS.** User will use all produced artifacts to create an Obsidian vault. This means:
- Never deprecate/delete vault notes
- Never delete claims files
- Never delete temp files
- Never delete scaffold, coverage matrix, search plan, scored-urls, etc.
- All files in research/notes/, research/runs/, and .hyperresearch/ are permanent

## Step 10 synthesis plan

**Draft A** (7,689 words): Broadest coverage. Core thesis: four-axis probabilistic system (time × breed/temperament × trigger × sighting-history) with decoupled spatial belief map + discrete action gate. Strongest beat: fear escalation as monotonic state machine with 3 trigger conditions.

**Draft B** (7,742 words): Deepest on tensions. Core thesis: separate belief update from action gate architecturally; encode breed as two layered priors (spatial + capture-method); name gaps explicitly. Strongest beat: galgo dual-prior model (chase prior from greyhound OR=8.34 / approach-avoidance from Normando 2024).

**Draft C** (5,130 words): Most practical encoding. Core thesis: action gate and probability score are structurally separate functions; breed governs action gate at full weight. Strongest beat: update_posterior() and action_gate() as two sequential never-merged functions.

**Synthesis direction:**
- Lead with the four-section structure (required headings)
- Section 2 (Breed Priors): pull the dual-prior model from B, quantitative calibration from A, decision tree from C
- Section 1 (Phases): pull Hennessy physiological anchors from B, calibration numbers from A, encoding rules from C
- Section 3 (Bayesian Sightings): pull action-gate architecture from B+C, λ weights from all three
- Section 4 (Fear Escalation): pull three-trigger state machine from A, case studies from B, decision rules from C
- Key unique contributions per draft to preserve in synthesis: A's product reframe ("preventing escalation not finding"), B's dual-prior galgo model, C's pseudocode-style parameter tables

## Step 2 summary (complete)
- 85 notes in vault tagged lost-dog-behavioral
- 80 claims files in temp/claims/
- 10 fetcher batches completed
- 6 source analysts running in background
- Coverage: strong on all SQs; genuine gaps on SQ2 (phase thresholds) and SQ10 (breed outcome studies)

## Step 3 analysis (in progress)
Key contradiction clusters forming:
1. Breed as behavioral predictor: Morrill 2022 vs. Normando 2024 (critical for Nona)
2. Distance traveled: absolute numbers vs. subsample populations
3. Active search vs. passive monitoring: Lord 2007 vs. MAR doctrine
4. Sighting response: respond immediately vs. keep location private to prevent displacement
5. Food lure effectiveness: works at rest, fails in prey drive
6. Survival mode onset: some immediate, some variable/unpredictable

## Emerging thesis for report
The Nona behavioral engine needs a LAYERED prior system:
- Layer 1: Temperament (Gregarious/Aloof/Xenophobic) — strongest single predictor
- Layer 2: Escape trigger (opportunistic/wanderlust/blind panic) — shapes distance distribution
- Layer 3: Breed priors — weak but non-zero signal; use for population-level prior only
- Layer 4: Temporal phase — multiply by time since loss
- Layer 5: Sighting update — Bayesian position update from sightings

The breed-vs-individual tension resolves as: use breed priors as starting point, immediately adjust on temperament observation signals.

## Key numbers for encoding (emerging)
- Distance: 42%/<400ft, 70%/<1mi, 14%/1-5mi, 7%/>5mi (Kremer/Lord)
- Rural modifier: +1.5-2x (northern Dallas 1.5-2.5mi vs southern 0-0.5mi)
- Recovery timeline: median 2 days (range 0.5-21 days)
- Galgo stranger-fear: statistically elevated vs other rescue dogs (p=0.009, Normando 2024)
- Podenco predatory sequence: Hunt/Chase 69%, Consume 8% (McLennan)
- Microchip effect: 71% vs 39% RTO (Kremer 2021)
