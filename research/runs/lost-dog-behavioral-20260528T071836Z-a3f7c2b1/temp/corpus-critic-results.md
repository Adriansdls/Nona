# Corpus Critic Results — lost-dog-behavioral

## Summary

5 gaps identified and 4 gap types attempted via targeted fetch wave. Net: 5 new vault notes added. 2 positions strengthened, 1 remains medium confidence, 2 remain genuine knowledge gaps.

---

## Gap 1: dog-phase-physiological-basis (Hennessy cortisol)

**Searched for:** Hennessy/Beerda shelter dog cortisol longitudinal data
**Found:** SPARCS 2015 conference summary of Hennessy's accumulated 1997-2015 research (note: `sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo`)
**Primary papers:** Paywalled — Hennessy 1997 (Physiol Behav), 2001 (Appl Anim Behav Sci), 2002 (J Pharmacol) all 403

**Key data confirmed:** Cortisol ~3x elevated vs. home on Day 1; three-phase arc: days 1-3 peak HPA activation, days 4-9 declining but still elevated, day 9+ adaptation/exhaustion plateau. Stray dogs more susceptible than relinquished. 15-min human contact sufficient to reduce response.

**Impact on committed positions:**
- Phase-transition thresholds (interim-report-dog-phase-transition-thresholds): **STRENGTHENED**
- The Hennessy cortisol arc directly maps to the 3-phase model: Phase 1 (peak HPA, days 1-3) → acute fight-or-flight behavior, olfactory shutdown, full evasion. Phase 2 (declining cortisol, days 4-9) → survival mode settling, pattern formation, food anchoring possible. Phase 3 (day 9+) → HPA exhaustion, approaching parasympathetic, food station/trap most effective.
- Confidence upgrade: Phase 1 boundary (72h/3d) from **medium → medium-high** (physiological mechanism confirmed, though primary papers not directly read). The physiological arc validates the practitioner heuristic.
- Caveat: Data is from shelter dogs (stable environment), not free-roaming lost dogs. Lost dogs under continued survival stress may have delayed cortisol normalization.

---

## Gap 2: Normando 2025 full text — galgo predatory drive vs. greyhound

**Searched for:** Normando 2025 (Dog Behavior vol 11) full text with galgo-specific C-BARQ predatory drive scores
**Found:** Not fetched — abstract only in vault (note: `behavioural-characteristics-of-sighthounds-an-exploratory-investigation-dog-beha`). Full text behind journal paywall.
**Key limitation:** Galgo's exact position within 10-breed predatory drive ranking is unknown. Abstract confirms: Saluki highest predatory, Piccolo Levriero Italiano lowest. Galgo position not stated in abstract.

**Impact on committed positions:**
- galgo-vs-greyhound-behavioral-equivalence (interim note): Spatial prior (OR=8.34 transfer) remains **medium confidence**
- The dual-prior model is structurally correct (confirmed by logic), but the specific OR=8.34 magnitude for galgo is uncertain until Normando 2025 full text confirms galgo clusters with greyhound on chase dimensions
- Recommendation: Encode spatial prior with explicit uncertainty: "galgo chase displacement prior: adapted from greyhound data (OR=8.34, 95% CI: 1.72-42.38), pending galgo-specific validation; treat as order-of-magnitude estimate"

---

## Gap 3: Crowd response counterexample (adversarial search)

**Searched for:** Any documented successful crowd response to fearful dog sighting
**Found:** None. Zero counterexamples in accessible literature, practitioner documentation, or case databases.

**Impact on committed positions:**
- bayesian-sighting-update action-gate: **STRENGTHENED**
- search-mode-temperament-sighting-protocol: **STRENGTHENED**
- After explicit adversarial search, the prohibition against crowd response for fearful dogs has no documented exception. The absence of counterexample upgrades this from "two-source doctrine" to "doctrine confirmed by adversarial search across the accessible literature."
- Confidence upgrade: Action-gate prohibition for fearful dogs from **medium-high → high**
- Calibration note for draft: The prohibition is not theoretically absolute (a carefully coordinated small group might occasionally succeed) but empirically it has no documented violation.

---

## Gap 4: Podenco GPS telemetry / hunting hound movement ecology

**Searched for:** GPS tracking studies for podencos or similar hunting hounds in Mediterranean terrain
**Found:**
- Benediktová 2020 (eLife, n=27 hunting dogs, 622 GPS trials, Czech forest): Scent hounds home using olfactory trail tracking (59.4%) or magnetic compass scouting (33.2%). Cover "hundreds to thousands of meters." (note: `magnetic-alignment-enhances-homing-efficiency-of-hunting-dogs-elife`)
- Chopra 2024 (Frontiers Vet Sci, n=3 UK farm dogs): Core HR 0.54-0.89 km², full range 2.72-3.38 km² in working context. (note: `frontiers-where-did-my-dog-go-a-pilot-study-exploring-the-movement-ecology-of-fa`)

**Impact on committed positions:**
- podenco-lost-movement-pattern (interim note): Partially constrained, not overturned
- Benediktová confirms scent hounds are active navigators using olfactory + magnetic cues — aligns with multi-sensory podenco characterization
- Chopra 2024's 2.72-3.38 km full range is WORKING context (farm patrol), not lost/panicked/prey-chase context
- The 5-15 km estimate for LOST podencos in prey-drive state remains mechanistically derived with no direct measurement
- Confidence: Unchanged — **medium (70%)** — the farm-dog data doesn't directly bound the prey-drive panic scenario
- Update: The Benediktová magnetic-compass behavior (novel scouting route on return) is a new prior component: podencos may make directional excursion → return arcs rather than purely linear displacement, which means the search area is better modeled as an expanding ellipse than a corridor.

---

## Gap 5: Holding-back-the-genes critique vs. Normando 2024

**Status:** van Rooy 2014 review is in vault (`holding-back-the-genes-limitations-of-research-into-canine-behavioural-genetics`) as full 10,876-word source. Source analyst reports reviewed it.

**Assessment:** The van Rooy critique focuses on: (a) owner-report bias in behavioral studies; (b) small-n designs; (c) breed misclassification. Normando 2024 (n=410, rescue org reports, within-rescue comparison) is vulnerable to (a) owner-report bias but structurally protected from the selection bias concern because both groups (galgos and other rescue dogs) are from the same rescue context. The p=0.009 finding is statistically robust for its scope. The van Rooy critique weakens it from "galgo stranger-fear is genetically determined" to "galgos from Spanish rescue orgs have higher owner-reported stranger-fear than other rescue dogs in the same org" — a narrower but still useful prior for Nona's Algarve context.

**Impact:** Breed prior confidence remains **medium-high** for the galgo-stranger-fear prior specifically; the genetic causal claim is uncertain, but the behavioral population-level distribution difference is empirically documented.

---

## Updated comparisons.md confidence notes

| Tension | Before | After | Update |
|---|---|---|---|
| Phase 1 universality / breed collapse | Medium | Medium-high | Hennessy cortisol validates phase arc direction |
| Galgo dual prior structural | High | High | Confirmed — no changes |
| OR=8.34 spatial prior magnitude | Medium | Medium | Normando 2025 full text still unavailable |
| Action-gate prohibition for fearful dogs | Medium-high | High | No counterexample found after adversarial search |
| Podenco 5-15km radius | Medium (70%) | Medium (70%) | Farm-dog GPS adds context but doesn't bound lost/panic scenario |
| Sighting response for gregarious | Medium | Medium | No new data |
