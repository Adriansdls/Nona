# Probabilistic Behavioral Engine for Lost-Dog Rescue — Depth-Optimized Draft

## Executive Summary

The probabilistic engine that Nona requires cannot rest on a single phase model, a single breed prior, or a single sighting weight. Where the literature is robust, the answer is precise; where it is thin, the engine must name the uncertainty rather than smooth it. After deep engagement with the available evidence — Hennessy's cortisol arc as the only physiological anchor for phase timing, Huang 2018 as the only peer-reviewed temporal recovery curve for companion animals (cats, transferable in shape only), the Morrill 2022 vs. Normando 2024 tension on whether breed predicts behavior, the Starling et al. greyhound OR=8.34 prey-fixation finding, and the documented Winnie and Princess Borzoi crowd-displacement fatalities — four operational conclusions hold:

1. **The 72-hour Phase 1 boundary is defensible at ±48h with medium confidence**, but it is a property of the gregarious/opportunistic majority and collapses to near-zero for galgos, podencos in prey-drive escape, and any blind-panic case. Phase models without a fourth dimension (escape trigger × temperament) systematically miscalibrate the hard cases that platforms like Nona disproportionately handle. [[interim-report-dog-phase-transition-thresholds]] [[sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo]]

2. **Galgo requires a dual prior, not a single one.** The chase mechanism (where the dog will be) transfers from greyhound research with high confidence in direction but wide CI in magnitude; the approach-avoidance mechanism (how to recover) does not transfer and must be built from galgo-specific evidence. Conflating these into one breed prior produces the worst kind of false confidence. [[interim-report-galgo-vs-greyhound-behavioral-equivalence]] [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]] [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]]

3. **The Bayesian sighting framework must architecturally separate belief update from response action.** This is not an implementation detail — it is the load-bearing safety constraint that distinguishes a rescue platform from a tragedy generator. Crowd response to sightings of fearful dogs has zero documented successes in the corpus and at least two documented fatalities. [[interim-report-bayesian-sighting-update]] [[stay-out-of-the-woods-missing-animal-response-network]] [[dog-befriends-a-fox-while-lost-in-blizzard]]

4. **The never-chase rule has a mechanistic basis (adrenaline-conditioned trigger, olfactory shutdown under cortisol load, predator-mimicry of upright human silhouette) that is convergent across MAR doctrine, named case studies, and HPA-axis physiology**, but the empirical evidence base remains practitioner-derived rather than experimentally validated. [[never-call-a-lost-dog-missing-animal-response-network]] [[dont-call-your-dog-missing-animal-response-network]] [[never-follow-chase-or-pressure-a-lost-dog-lost-dogs-of-america]]

What this draft does that a survey would not: it names the knowledge gaps as explicitly as the findings. The phase boundaries are conditional, not categorical. The breed priors operate on different behavioral systems and need separate encoding. The sighting model has a high-confidence architecture (always update belief, never always update action) wrapped around medium-confidence reliability weights that come from adjacent-domain reasoning. The honest probabilistic engine is one that surfaces these confidence levels to the operator, not one that hides them behind a single number.

---

## 1. Temporal Behavioral Phases — Empirical Data

### Key Empirical Findings

**No dog-specific controlled study exists for behavioral phase thresholds.** This is the single most important finding of this section, and it determines what kind of engine Nona can defensibly build. The IAABC review by Kat Albrecht is unambiguous: "no one had ever studied lost pet behaviors, and there was no data available on the typical distances that lost dogs or lost cats travel" [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]. The phase model is constructed by triangulating four independent evidence streams, none of which alone is sufficient.

**Stream 1 — The Hennessy cortisol arc as physiological anchor.** Michael Hennessy's shelter-stress research, presented at SPARCS 2015 and grounded in multiple peer-reviewed studies, provides the only direct mammalian-stress timeline relevant to lost-dog phase transitions. The published pattern is consistent: cortisol is roughly three times higher on Day 1 in the shelter than in the same dog at home, declines over the following days, and reaches a plateau after about Day 9 [[sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo]]. This is not a lost-dog study — it is a shelter-stress study — but the HPA-axis physiology transfers: a dog isolated from its attachment figure in an unfamiliar environment shows the same three-phase curve regardless of whether the unfamiliar environment is a shelter kennel or a scrubland thicket. The implication is mechanistically strong: a 72-hour Phase 1 boundary is not arbitrary — it sits inside the descending limb of the cortisol curve, where the dog is shifting from acute HPA activation toward sustained survival mode.

**Stream 2 — The Huang 2018 temporal recovery curve and the cat-to-dog transfer question.** Huang et al. 2018 (n=1,210 missing cats) is the only peer-reviewed temporal recovery curve for displaced companion animals: 34% found alive by day 7, approximately 50% by day 30, with the curve nearly flat after day 61 [[source-analysis-huang-2018-missing-cats-search-methods-locations]]. The transfer to dogs is partial: dogs recover faster (Lord 2007b median 2 days vs. cats 6 days) because dogs are more often approached or self-approach humans, and shelter reclaim rates are dramatically higher (26–40% for dogs vs. 2–4% for cats). What transfers is **the shape, not the values**: the steep early decline, the urgency cliff in the first week, and the long-tail flattening after day 30. The cat day-7 inflection likely maps onto the dog day-3 to day-5 inflection — meaning that Huang's structural curve is consistent with the practitioner 3–4 day threshold and the Kremer 5-day shelter cliff, but Huang's absolute timing is too slow for dogs.

**Stream 3 — Lord 2007b and Kremer 2021 quantitative anchors.** Lord 2007b (n=187 lost dogs): median recovery 2 days, range 0.5–21 days. Kremer 2021 (n=30,609 Dallas strays): 91% of dogs reclaimed within the 5-day shelter hold, 70% found within 1 mile of home, 42% within 400 feet [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]] [[lost-pet-statistics-lost-pet-research-and-recovery]]. The 5-day cliff is a policy artifact (shelters end the hold), but its alignment with the practitioner 3–4 day behavioral-shift consensus is unlikely to be coincidence — both reflect the same underlying urgency curve.

**Stream 4 — Practitioner case-series consensus.** Multiple independent practitioner sources (Lost Dogs Illinois 3,000+ recoveries over 13 years; Lost Dogs of America thousands of cases over 13 years; MAR/Kat Albrecht) converge on a 3–4 day threshold at which dogs reliably begin to perceive their own owner as a predator [[lost-dog-syndrome-understanding-your-dogs-survival-behaviors-holiday-barn]] [[survival-mode-buddha-dog-rescue-recovery]]. This is anecdotal, not controlled, but the convergence across geographically and methodologically independent practitioners — combined with the underlying HPA-axis physiology — produces medium-high confidence in the direction of the finding even if the exact threshold is uncertain.

**The escape-trigger collapse of Phase 1.** What the four-stream triangulation describes is the *population mean* phase boundary. The crucial finding from cross-locus analysis is that this mean conceals a bimodal distribution. For gregarious dogs with opportunistic-escape triggers (gate left open, slipped leash on a walk), Phase 1 may stretch to 5–7 days because the dog remains in cooperative mode. For dogs with blind-panic triggers (fireworks, gunfire, vehicle accident) or xenophobic temperaments (rescued galgos, fearful chihuahuas, herding breeds with reactivity history), Phase 1 effective duration collapses to 0–24 hours because survival mode onset is essentially instantaneous [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]] [[survival-mode-buddha-dog-rescue-recovery]]. Treating the 72-hour boundary as universal misses the cases that matter most.

### Calibration Numbers

The defensible phase boundaries, with confidence ranges:

- **Phase 1 (acute panic / direct approach viable):** 0–72 hours from loss, ±48 hours conditional on temperament and escape trigger. For gregarious + opportunistic-escape dogs: 0–7 days. For xenophobic temperament or blind-panic trigger: 0–24 hours (often effectively 0 hours). Confidence: medium for the 72h population mean; high for the bimodal distribution around it.
- **Phase 2 (survival mode active, passive recovery only):** 72 hours – 7 days. Practitioner consensus 3–4 day onset, Kremer 5-day shelter cliff, Lord 2007b median 2 days all triangulate this window. Confidence: medium-high.
- **Phase 3 (entrenched survival mode, sighting-only recovery):** 7+ days. Huang 2018 cat curve flattens around day 30; long-tail recoveries possible to 21+ days for dogs (Lord 2007b upper bound) and indefinitely for feral-adapting individuals. Confidence: high on the structural existence of the plateau; medium on the exact day-7 threshold vs. day-5 or day-10.
- **Cortisol peak window (acute panic):** Days 1–3 post-loss based on Hennessy shelter data; behavioral correlate is maximum movement speed, maximum flight distance, olfactory shutdown during peak arousal episodes. Confidence: medium-high (shelter data transferred to lost-dog context).
- **Mode-shift to nocturnal activity:** 24–72 hours post-loss in most cases. Survival-mode dogs move at night and hunker during daylight; the Silence Factor (cessation of barking) is established once survival mode is solidified [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]]. Confidence: high on the direction; medium on exact timing.
- **Recovery rate by phase (inferred from Lord 2007b + Kremer 2021):** Phase 1 (0–72h): ~60–70% of recoveries occur here for gregarious dogs; far lower for xenophobic. Phase 2 (72h–7d): ~20–25% of recoveries, dominated by trap/lure success. Phase 3 (7d+): ~5–15% of recoveries, dominated by sighting-network operations. These percentages are population-averaged and shift dramatically by temperament.
- **Distance distribution at population level:** 71% within 1 mile (Lord 2007b, dogs), 42% within 400 feet (Kremer 2021, Dallas strays), 95th percentile 1.8 miles (Fi GPS 2025) [[lost-pet-statistics-lost-pet-research-and-recovery]] [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]]. Confidence: high.
- **Distance distribution at hard-case level:** Mixed-breed dogs averaged 14 miles before pickup (Albrecht 1999, n=254 informal); xenophobic / sighthound / panicked: 5–10+ miles; toy breeds <0.75 miles [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]. Confidence: medium (Albrecht sample is informal; the scope-mismatch resolution with Kremer is high-confidence).

### Knowledge Gaps

The depth-optimized reading must be honest about what is *not* known.

- **No controlled longitudinal study of cortisol × behavior × time in lost dogs.** Hennessy's shelter data is the closest physiological anchor, but no published study has measured cortisol at 24h, 48h, 72h, 96h, and 7d post-escape in lost dogs and correlated it with behavioral state transitions. The 72-hour Phase 1 boundary is mechanistically plausible but not directly measured.
- **The Huang 2018 cat-to-dog transfer is structural only.** No equivalent peer-reviewed temporal recovery curve exists for dogs. Lord 2007b provides only two points (median 2 days, range 0.5–21 days) and a small sample (n=187).
- **No quantified breed-specific phase durations.** The qualitative claim that xenophobic breeds enter Phase 2 within 24 hours is convergent across practitioner sources but has no controlled study backing.
- **The Algarve-specific population is unstudied.** All dog-recovery quantitative data comes from US contexts (Ohio, Dallas, Illinois). Portugal-specific population density, terrain, and human intervention rates are likely different. The 5-day shelter cliff (Kremer) is a US shelter-policy artifact; Algarve municipal canil hold periods, geographic dispersion, and rescue-network density may shift the operational urgency curve.
- **The fraction of dogs that never enter survival mode is unknown.** Buddha Dog's "50–99%" range is a probability distribution width, not a point estimate [[survival-mode-buddha-dog-rescue-recovery]]. We do not know whether 50%, 70%, or 90% of lost dogs enter full survival mode after 72 hours.
- **Phase reversibility is not quantified.** Practitioner sources imply that a dog in Phase 2 can be coaxed back toward Phase 1 cooperative behavior via slow feeding-station habituation, but no timeline exists for this reversal.

### Practical Encoding

The engine should encode phase as **conditional on escape trigger and temperament category**, not as a function of time-elapsed alone. Concrete encoding:

```
phase(t, temperament, escape_trigger) = {
  if escape_trigger ∈ {blind_panic, prey_drive_escape}
     OR temperament ∈ {xenophobic, trauma_baseline}:
     # Phase 1 collapsed
     t < 24h:    Phase 1 (passive-only, no calling, camera-station within 4h)
     24h–7d:     Phase 2 (passive-only, feeding-station + scent anchor)
     t > 7d:     Phase 3 (sighting-network operations)

  elif temperament == gregarious AND escape_trigger ∈ {opportunistic}:
     t < 72h:    Phase 1 (active approach by owner viable, neighborhood search OK)
     72h–7d:    Phase 2 (transition, passive lure becomes primary)
     t > 7d:     Phase 3 (sighting-network)

  else:  # mixed/uncertain
     # Apply 72h boundary as population mean with ±48h soft-edge
     t < 24h:   Phase 1 (default conservative — assume passive may be needed)
     24h–72h:   Phase 1/2 transition (temperament re-assessment)
     72h–7d:    Phase 2 (passive lure primary)
     t > 7d:    Phase 3
}
```

Operationally, the engine should:

- Surface the confidence interval on the phase boundary to the operator, not a single point.
- Treat the 72-hour line as the population median, with ±48h confidence range and a structural override for xenophobic/blind-panic cases that collapses Phase 1 to <24h.
- Compute *time since last behavioral observation*, not just time since loss — a dog observed approaching a stranger at hour 48 has demonstrated Phase 1 behavior and the prior should update; a dog with no sightings for 72 hours after a blind-panic loss should be treated as Phase 2 by default.
- Display two phase models in parallel during the 24–96h window: "population-mean phase" (driven by elapsed time) and "individual-signal phase" (driven by observed behavior), and surface any divergence to the operator.

---

## 2. Breed-Specific Behavioral Priors

### Key Empirical Findings

This is the section where the corpus's central tension lives. **Morrill et al. 2022** (Science, n=18,385, genome-sequenced n=2,155) is the strongest evidence in the corpus against using breed as a behavioral prior: breed explains 9 ± 3% of behavioral variation in individuals; "for less heritable, less breed-differentiated traits, like agonistic threshold (factor 5), which measures how easily a dog is provoked by frightening, uncomfortable, or annoying stimuli, breed is almost uninformative" [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]]. The mechanism is genomic: behavioral GWAS loci are not unusually differentiated across breeds (PBS z = −0.001, p = 0.224); only 332 of 16.7 million SNPs are exclusive to and fixed within any breed (0.002%); within any breed of ≥25 dogs, 67.2 ± 7.5% of individuals score within 1 SD of the population mean on any factor. This is the most rigorous behavioral-genetic study ever performed on dogs, and its conclusion is brutal for breed stereotyping at the individual level: agonistic threshold — the *exact* behavioral dimension that governs lost-dog flight behavior — is the one where breed is *least* predictive.

**Normando et al. 2024** (n=410 rescue dogs, 198 galgos vs. 212 other dogs) is the strongest counter-evidence in the corpus: galgos show "out of context fear of non-co-habiting adult people" at >1 in 5 prevalence, statistically significantly higher than the comparison group (p=0.009) [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]]. Normando 2025 (n=768) further establishes that predatory behavior differs significantly across sighthound breeds (p<0.001), with Saluki/Cirneco highest and Piccolo Levriero Italiano lowest [[behavioural-characteristics-of-sighthounds-an-exploratory-investigation-dog-beha]].

**Resolving the tension: scope mismatch, not contradiction.** Morrill measures individual-level predictability — "given this individual dog is a galgo, can I predict its agonistic threshold?" Answer: no, breed explains very little of the variance. Normando measures population-level group means — "is the galgo population's mean stranger-fear distribution shifted compared to other rescue dog populations?" Answer: yes, significantly. These are different questions. Both authors are right [[interim-report-breed-prior-individual-vs-population]]. The operational consequence for Nona: breed cannot be used to predict an individual dog's stranger-fear score, but breed can legitimately be used to set the **default capture-strategy protocol** (the action gate) before individual signals arrive.

**Why the galgo case requires two priors, not one.** This is the single most consequential finding in the breed-prior analysis. The chase behavior of a galgo and the approach-avoidance behavior of a galgo are governed by two phylogenetically and neurobiologically distinct systems [[interim-report-galgo-vs-greyhound-behavioral-equivalence]]:

1. **Chase / predatory motor sequence.** Sighthounds skip the Search phase of the predatory motor sequence entirely and react directly to prey stimuli — "sighthounds don't search, they react" [[arousal-and-predatory-motor-patterns]]. The Starling et al. 2020 greyhound study found that when prey stimulus disappears (lure stops moving and goes silent on a straight track), greyhounds fixate on the last-known location of the prey at OR=8.34 (95% CI: 1.72–42.38, p=0.009) [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]]. This is a phylogenetically conserved sighthound mechanism, documented in live-prey coursing as well as mechanical lures, and not specific to English racing greyhound culture. It transfers to galgo with high confidence in direction (galgos fixate at prey-loss terminus) but with appropriate humility on the exact magnitude (CI is wide, no galgo-specific empirical test exists).

2. **Approach-avoidance / trauma-fear system.** This is where greyhound data does NOT transfer. English racing greyhounds show freeze-dominant responses to human approach ("frozen or stiff posture, pupils dilated, trembling, tense closed mouth, ears back, tail tucked" — the 4F response) [[2-fear-and-anxiety-greyhounds-as-pets]]. Rescued galgos show flight-dominant responses: SOS Galgos documents 18+ intake profiles with "wanted to run away whenever a person approached," "would run straight to the corner whenever anyone approached" [[sos-galgos-adopt-a-survivor]]. Galgos del Sol describes "weeks or sometimes months" before a human can approach [[interim-report-galgo-vs-greyhound-behavioral-equivalence]]. The galgo's trauma baseline is environmental/developmental (galguero hunting practices, kennel conditions, systematic abandonment), not genetic — but at the population level it is overwhelmingly present, and it produces a categorically different behavioral profile from the racing-greyhound rescue population on which the 4F freeze model was built.

**Why the podenco case is about predatory motor sequence, not stranger-fear primarily.** McLennan's data on podenco predatory motor sequence is the load-bearing breed-specific finding: Hunt 69%, Orient 69%, Chase 69%, Consume 8% [[prey-drive-in-podencos]]. The 8% Consume rate is the crux: predatory chase in podencos is appetitive and self-reinforcing, not food-terminable. The dog's motivation to chase does not extinguish on food availability. Combined with the breed's documented endurance trotting (not galloping), agility, and tree-climbing ability, this produces a fundamentally different lost-dog profile from the galgo: a lost podenco in prey-drive activation is not freezing or hiding — it is actively ranging across Mediterranean scrubland in an expanding multi-sensory search [[interim-report-podenco-lost-movement-pattern]] [[about-podenco-dogs-hope-for-podencos]]. The corpus's mechanistic inference of 5–15 km radius in 24–48 hours is medium-confidence (no GPS telemetry exists for lost podencos), but the direction is well-supported.

**The breed-group structure beyond galgo/podenco.** The corpus also addresses other categories, though with less depth:

- **Sighthounds as a group:** Low aggression, high predatory drive (with significant within-group variation, p<0.001), variable owner-attachment [[behavioural-characteristics-of-sighthounds-an-exploratory-investigation-dog-beha]]. Movement radius elevated relative to general population due to chase mechanics and athletic capacity.
- **Scent hounds (beagle, podenco-as-scent-component):** Olfactory primary, follow scent trails over distance; "strong scent trail can override even well-trained recall" [[beagle-running-away-chasing-escaping]]. Movement pattern is wide-area meander with scent-driven directional bias.
- **Toy breeds:** Shortest movement radius (<0.75 miles in Albrecht 1999), most often hidden close to escape point, vulnerable to predation and exposure.
- **Herding breeds:** Reactive to noise, prone to xenophobic temperament when poorly socialized, may circle and return.
- **Guardian breeds (mastiff types, livestock guardians):** Territorial; if displaced from territory may attempt return; high predator-defense response can be misread as aggression by rescuers.
- **Mixed/unknown:** Albrecht 1999 informal data — 14 mile average displacement, but this likely reflects sample bias (cases referred to professional recovery were the hard ones). Default to gregarious unless individual signals indicate otherwise.

### Calibration Numbers

- **Population-mean breed weight in stranger-fear probability score: ≤10%.** Morrill 2022 establishes 9 ± 3% breed variance explanation for behavior. Encoding breed at >10% weight in individual probability scores is not defensible.
- **Breed weight in action-gate (capture-strategy default) selection: 100% as starting point.** Once individual signals arrive, this should degrade. Until any individual data is available, breed governs which protocol initializes.
- **Galgo approach success rate, day 1, direct approach by stranger: ≈0.02 (2%).** This is a consensus estimate from 5 independent practitioner sources [[sos-galgos-adopt-a-survivor]] [[interim-report-breed-prior-individual-vs-population]]. The implication: direct approach is structurally contraindicated for any galgo in any phase.
- **Galgo chase-fixation: OR=8.34 (95% CI: 1.72–42.38) for last-known-location fixation when prey stimulus disappears.** This is Starling 2020's greyhound finding; transfer to galgo is medium confidence in magnitude, high confidence in direction. The wide CI means the engine should treat this as "strong directional anchor on prey-loss terminus" rather than an exact 8x weight multiplier [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]].
- **Galgo minimum passive-observation period before any active approach attempt: 72 hours of camera-station presence with no human contact**, scoping to 4–12 weeks for worst-case trauma cases [[interim-report-galgo-vs-greyhound-behavioral-equivalence]].
- **Galgo fence-clearing ability: 6 feet.** A 4-foot fence is not a containment barrier [[interim-report-galgo-vs-greyhound-behavioral-equivalence]]. Operationally, this affects the geometry of feeding-station placement and trap selection.
- **Podenco Consume rate: 8%.** Predatory chase intrinsically motivated, food-lure effectiveness during active chase ≈10% [[prey-drive-in-podencos]]. Food stations work post-settle, not mid-chase.
- **Podenco movement radius (prey-drive escape): 5–15 km in 24–48 hours.** Medium confidence (mechanistic inference, no GPS telemetry); scrubland-biased terrain; radial expansion with sprint episodes rather than directional sprint or circular meander [[interim-report-podenco-lost-movement-pattern]].
- **Podenco endurance signature: trotting (not galloping); medium-sized; sustained ranging hours.** Movement pattern is endurance search, not athletic sprint; recovery scoping should assume the dog can sustain movement for many hours before settling.
- **Toy breeds: <0.75 mile movement radius (Albrecht 1999).** Search concentration tight; high vulnerability to in-situ predation/exposure rather than distant displacement.
- **Sighthound predatory drive variance within-group: significant (p<0.001).** The engine should not collapse "sighthound" into one prior; galgo, podenco, lurcher, greyhound, saluki should each have distinct sub-priors when data allows.
- **Mixed-breed displacement (Albrecht 1999, n=254 informal): ~14 miles avg.** Apply only to hard-case population (cases referred for professional recovery), not population-baseline.

### Knowledge Gaps

- **No galgo español-specific empirical chase study exists.** The OR=8.34 transfer from greyhound is a phylogenetic inference. A GPS-tagged galgo study in Spanish or Algarve coursing context would directly test prey-terminus fixation magnitude.
- **No GPS telemetry study of lost podencos in Mediterranean scrubland.** The 5–15 km radius is mechanistically derived from predatory motor sequence data plus endurance physiology, not measured. This is the single highest-value data collection opportunity for Nona's own operations.
- **No within-galgo trauma-baseline stratification.** Normando 2024 establishes the population-level fear shift, but the distinction between hunting-discarded galgos (high trauma) and pet-abandoned galgos (lower trauma) is not quantified.
- **MacLean 2019 (PNAS) is inaccessible** but represents the strongest pro-breed-prior academic position. Reading it would tighten heritability estimates for stranger-fear within sighthound-type breeds [[interim-report-breed-prior-individual-vs-population]].
- **No data on Algarve-specific galgo and podenco populations.** All galgo behavioral data is from Spanish rescue contexts (Normando, SOS Galgos) and podenco data is from working-farm contexts; the lost-dog Mediterranean-rural scenario has no direct empirical base.
- **The Normando 2024 control group ("other rescue dogs") is not broken down by breed type.** Whether other sighthounds or greyhounds were in the comparison group is unclear; the categorical galgo-vs-greyhound distinction would be even cleaner with that disaggregation.
- **No published study tests whether breed-specific capture protocols yield better outcomes than generic passive protocols.** A randomized controlled study at n>500 would directly validate the breed-prior architecture.

### Practical Encoding

The breed prior should be implemented as **a two-layer structure**:

**Layer 1 — Action-gate selector (high weight, breed-governed).** This is where breed legitimately drives engine behavior. It is a discrete selector, not a probability score. The action gate determines which capture protocol initializes and which actions are *prohibited* regardless of probability scores:

```
action_gate(breed_category) = {
  galgo:              passive_only + conspecific_lure + camera_first + no_crowd_response
  podenco:            passive_lure + scent_anchor + wide_radius_camera_grid + no_crowd_response
  sighthound_other:   passive_only + last_known_location_anchor + no_crowd_response
  toy:                tight_radius_search + neighborhood_canvas + check_hiding_spots
  herding:            assume_xenophobic_default + passive_lure + low-noise_protocol
  guardian:           territorial_consideration + return_path_likely + no_chase
  mixed/unknown:      gregarious_default + active_search_OK + degrade_on_signal
}
```

**Layer 2 — Probabilistic score (low weight, individual-signal-dominated).** Breed contributes ≤10% to the stranger-fear probability score; individual signals (owner-reported behavior with strangers, observed flight-vs-approach in sightings, history with previous loss events) dominate.

**Three principles for the encoding:**

1. **Asymmetric cost of errors gates the action layer.** A false-gregarious classification of a galgo that triggers crowd response could cause fatal displacement (Princess Borzoi pattern). A false-xenophobic classification of a gregarious mixed-breed causes unnecessary trap deployment (wasted effort only). The action gate should be conservative — default to passive if uncertain.

2. **Galgo requires two separate priors:** `galgo_spatial_prior` (governs WHERE the dog is — driven by greyhound chase data, OR≈8.34 fixation at prey-loss terminus) and `galgo_capture_prior` (governs HOW to recover — galgo-specific, passive-only, 72h minimum, conspecific-lure preferred). These feed different model outputs. Conflating them produces structurally miscalibrated estimates.

3. **High-λ observations override the breed prior probabilistically; the action gate persists until a high-confidence individual signal changes the temperament classification.** Specifically: a single low-λ sighting describing a galgo "running up to" a stranger should update the probability score (reducing the stranger-fear estimate) but should NOT relax the action gate (no crowd response). Only a camera-confirmed approach-and-accept behavior at λ ≥ 0.95 should change the action gate. This is the safety architecture.

---

## 3. Bayesian Updating from Sightings

### Key Empirical Findings

The Bayesian update framework for lost dogs sits on a foundation of three convergent mathematical frameworks plus two load-bearing case studies. The frameworks (Lin & Goodrich 2010, Hashimoto et al. 2022, SARBayes) come from human Wilderness Search and Rescue (WiSAR) literature; the case studies (Winnie, Princess Borzoi) come from lost-dog practitioner literature. The synthesis produces a high-confidence architectural finding wrapped around medium-confidence calibration parameters.

**The formal architecture (Lin & Goodrich 2010, Hashimoto 2022).** Lin and Goodrich propose a Bayesian model that constructs a probability distribution map of likely lost-person location using terrain features, modeled as a first-order Markov transition matrix. The map is "designed to be augmented by search and rescue workers to incorporate additional information" — this is the formal hook for sighting updates [[a-bayesian-approach-to-modeling-lost-person-behaviors-based-on-terrain-features]]. Hashimoto et al. 2022 (Scientific Reports) extend this to an agent-based model with six reorientation strategies as a probability mass function (PMF) drawn i.i.d. at each timestep, validated against 65 ISRID hiker incidents with 58.5% of held-out cases exceeding the 95th percentile of untrained distributions [[source-analysis-hashimoto-2022-agent-based-lost-person-model]]. Critically, Hashimoto explicitly does not include a sighting-update mechanism: "the paper provides the forward spatial probability model but contains no sighting-update mechanism." The forward model generates the prior; the sighting update layer must be built separately, on top of the prior.

**SARBayes MapScore validation.** The SARBayes project's MapScore framework provides empirical validation of probability-map quality: ISRID Distance Ring model scored 0.78 (95% CI: 0.74–0.82, n=376 cases); a Combined Distance+Watershed model scored 0.81 (95% CI: 0.77–0.84) [[sarbayes-bayesian-methods-for-wisar]]. This establishes that a well-designed prior based on category × terrain features is materially better than random (which scores 0) and approaches the ceiling of practical predictability (perfect would score 1).

**The action-gate architecture as the load-bearing innovation for dogs.** Where human WiSAR Bayesian models can assume that the subject's location is conditionally independent of the observation act — a lost hiker does not flee searchers — this independence assumption fails completely for fearful dogs [[interim-report-bayesian-sighting-update]]. A sighting that triggers crowd response causes a displacement event: the dog moves from L_obs at time T to L_obs + Δ at T+Δ, where Δ is behaviorally determined and observed up to 7 miles in 1 hour (Winnie) and 200+ miles across multiple states (Princess Borzoi). The Bayesian model that ignores this produces a posterior that is more wrong than the prior was. The architectural response — and this is the single highest-confidence finding in the entire sighting-update locus — is to **strictly separate the belief update layer from the response action layer**. The posterior should always update from every credible sighting (this is information that improves the model). The response action (mobilizing searchers, broadcasting the sighting location) should be gated by temperament, not driven by the posterior update.

**Crowd-displacement as the documented failure mode.** The Winnie case (69-day recovery, with a 7-mile displacement in 1 hour from a single crowd-convergence event after a sighting was posted on social media) and the Princess Borzoi case (fatal multi-state displacement after repeated crowd events) provide the case-study evidence base [[dog-befriends-a-fox-while-lost-in-blizzard]] [[stay-out-of-the-woods-missing-animal-response-network]]. The MAR doctrine that crystallizes from these and thousands of other cases is unambiguous: "Three biggest mistakes that would-be rescuers make when trying to capture a loose dog — calling, eye contact, direct approach — are also the behaviors triggered by a crowd-sighting response" [[interim-report-bayesian-sighting-update]]. When a sighting reaches a large group, the most probable outcome is that one or more individuals attempt visual capture, which immediately invalidates the sighting and potentially displaces the dog.

**Reliability λ weights — the medium-confidence layer.** The corpus does not provide empirically calibrated reliability weights for dog-specific sighting types. The weights derived from adjacent-domain reasoning (eyewitness reliability literature, WiSAR observation models) and validated against practitioner consensus are: camera-confirmed sighting λ=0.95; clear daylight eyewitness with named observer and 4-field intake (date, time, exact location, direction) λ=0.70; uncertain or nighttime or brief eyewitness λ=0.35; crowd-degraded sighting (sighting where crowd convergence likely caused immediate displacement) λ=0.20 [[interim-report-bayesian-sighting-update]] [[source-analysis-lost-pet-owner-guide-hartt]]. These numbers are starting points, not validated parameters.

**Sighting intake schema (HARTT canonical).** The four-field sighting record — date, time, exact location, direction of travel — plus observer contact information is the HARTT operational standard, stated identically in two independent versions of their guide [[source-analysis-lost-pet-owner-guide-hartt]] [[lost-pet-owner-guide-hartt]]. Pre-mapping the 2-mile radius before sightings arrive converts vague descriptions into grid coordinates. Direction of travel is the most valuable single field: it tells you where the dog is heading, not just where it was.

**Camera confirmation as the trap-deployment gate.** Across MAR, HARTT, Joyful Pets, and Lost Pet Research & Recovery, the consensus is that traps should only be deployed once a trail camera has confirmed regular feeding-station visits — not on the basis of a single eyewitness sighting [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]] [[interim-report-bayesian-sighting-update]]. This is the operational expression of the reliability hierarchy: λ=0.95 (camera) is the threshold for trap action; lower λ sightings inform model updates and camera placement guidance but do not trigger trap deployment.

### Calibration Numbers

- **Prior at IPP (Initial Planning Point), Day 0, population-baseline:** 70–71% within 1 mile (Lord 2007b, Kremer 2021); 42% within 400 feet; 14% in 1–5 miles; 7% beyond 5 miles. High confidence.
- **Prior at IPP, hard-case population (Nona-realistic):** Bimodal — small mode within 0.5 mile (in-situ hiding) plus long tail to 10+ km for sighthound/panic/prey-drive cases. The single-mode 1-mile prior is misleading for the actual Nona caseload.
- **Diffusion rate (radius doubling per 12 hours beyond last confirmed sighting):** Practitioner heuristic, low confidence. Toy breeds: cap at 0.75 mile. Mixed/large: 2–14 miles per 24–48h depending on temperament and trigger.
- **Reliability λ weights (medium confidence, adjacent-domain inference):**
  - Trail camera with image timestamp: λ = 0.95
  - Clear daylight eyewitness, 4-field intake, named contact: λ = 0.70
  - Uncertain or nighttime or brief eyewitness: λ = 0.35
  - Crowd-degraded or social-media-mass-broadcast sighting: λ = 0.20
- **Minimum λ threshold for posterior update: 0.20.** Below this, the sighting is noise; above this, the posterior incorporates the observation weighted by λ.
- **Minimum λ threshold for trap deployment: 0.95 (camera-confirmed regular visits).** This is the action-gate threshold for committing physical capture equipment.
- **Minimum λ threshold for any active human response: depends on temperament.** For gregarious + opportunistic-escape dogs: λ ≥ 0.70 within last 30 minutes is sufficient for calm single-responder approach. For all other dogs: no active human response at any λ until camera confirmation has been established.
- **Camera-station deployment time-target after a credible sighting: ≤4 hours.** Faster is better; the dog's pattern may stabilize within 24–48h if the location has resources [[interim-report-bayesian-sighting-update]].
- **Pre-mapping radius before sightings arrive: 2 miles from IPP.** HARTT operational standard; aerial-view review of escape routes, terrain barriers, food/water sources, dense hiding spots.
- **Direction-of-travel anchor weight in posterior: high.** Two or three sightings with direction-of-travel can triangulate a movement corridor; a single sighting without direction is much weaker.
- **Crowd-displacement magnitude (Δ) when an active crowd convergence occurs at a sighting location, fearful dog:** Documented 7 miles in 1 hour (Winnie); fatal multi-state displacement across days (Princess Borzoi). Operationally, the engine should treat a crowd event as invalidating the sighting's positional value and degrading the posterior to a flight-vector distribution.

### Knowledge Gaps

- **No empirically calibrated dog-specific eyewitness reliability framework exists.** The corpus-critic step confirmed this gap. The λ weights are reasoned, not measured.
- **No published study on civilian-observer dog identification accuracy.** Eyewitness research from forensic psychology applies in principle (lighting, duration, observer training, stress all matter) but has not been adapted for dog sighting contexts.
- **The displacement-vector model after a crowd event has no quantitative parametrization.** We know it happens (Winnie 7mi/1hr); we don't know the distribution of Δ vectors by intensity, terrain, or breed.
- **Camera-confirmation time in rural Algarve terrain is unmeasured.** If the average time from camera-station deployment to first confirmed visit is >48 hours, the camera-first gate may be operationally infeasible for fresh sightings and require a parallel passive-approach exception.
- **Sighting-quality differences between trained MAR volunteers and civilian observers** have not been modeled. A trained volunteer who knows not to approach carries a different effective λ than a civilian — but no quantification exists.
- **The Koopman search detection function** (Probability of Detection as a function of sweep width and lateral range) has not been adapted for lost-dog terrain categories. This is the formal link between sensor deployment (cameras, scent stations) and Bayesian probability-of-detection updating.
- **Bayesian update under conflicting sightings** (e.g., two simultaneous sightings 5 km apart) is not formally specified in the corpus.

### Practical Encoding

The engine should implement a **three-layer Bayesian sighting architecture**:

**Layer 1 — Forward prior (Markov diffusion from IPP, category-conditioned).**

```
prior(L, t | category) = MarkovDiffuse(IPP, t, transition_matrix[category, terrain])
where category ∈ {temperament × breed × escape_trigger × phase}
```

The transition matrix encodes terrain preferences (scrubland-biased for podenco, road-following for toy breeds, last-known-prey-location anchoring for galgo when prey-triggered). Initial prior is the population 1-mile circle for gregarious cases; expanded long-tail distribution for hard-case categories.

**Layer 2 — Bayesian belief update (always-on for any λ ≥ 0.20).**

```
posterior(L | sighting) ∝ likelihood(sighting | L) × prior(L)
likelihood(sighting | L) = λ × δ(L - L_obs) + (1-λ) × uniform(L | terrain_constraint)
```

Width of likelihood depends on λ: camera (λ=0.95) updates a tight neighborhood around L_obs; uncertain eyewitness (λ=0.35) updates a broader radius (300–500m). Direction-of-travel data biases the next-timestep diffusion.

**Layer 3 — Action gate (separate from belief layer, temperament-conditional).**

```
action_on_sighting(temperament, λ, t_since_sighting) = {
  if temperament ∈ {xenophobic, trauma_baseline, sighthound, fearful}:
     # Action gate is closed for all crowd response
     for any λ:
        action = deploy_camera_station(L_obs, within=4h)
        forbid: broadcast_to_crowd, active_pursuit, calling, direct_approach
        if λ ≥ 0.95 (camera_confirmed_regular_visits):
            action += deploy_trap(L_obs)

  elif temperament == gregarious AND escape_trigger == opportunistic:
     if λ ≥ 0.70 AND t_since_sighting < 30min:
        action = calm_single_responder_approach(L_obs)
     elif λ ≥ 0.95:
        action = deploy_trap(L_obs)
     else:
        action = deploy_camera_station(L_obs)
}
```

**Three encoding principles:**

1. **Belief always updates; action is gated.** The posterior incorporates every λ ≥ 0.20 sighting. Action is taken only when temperament-gate permits.
2. **The camera-first gate is the operational expression of the action-gate principle.** Camera-station deployment is the only universally safe response to any sighting. Trap deployment requires camera-confirmed regular visits.
3. **Direction-of-travel data is the most valuable single field.** The engine should weight direction-of-travel highly in posterior diffusion — it converts a point sighting into a vector sighting, which has materially higher information content for predicting next location.

---

## 4. Fear Escalation Dynamics

### Key Empirical Findings

The mechanisms by which a recoverable lost dog becomes an unrecoverable evasion-mode dog are convergent across MAR doctrine, named case studies, and adjacent neurobiology — but the empirical evidence base remains practitioner-derived, not experimentally controlled. This is a section where the depth-optimized stance must be honest: the never-chase rule is mechanistically well-motivated and case-study-validated, but it has never been tested in a randomized controlled trial because such a trial would be unethical.

**Three documented triggers for blind-panic / evasion mode onset.** Kat Albrecht's MAR framework identifies three primary triggers, each producing immediate survival mode without the gradual phase transition seen in opportunistic-escape cases [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]]:

1. **Xenophobic temperament (innate or trauma-conditioned).** Dogs with baseline fear of strangers enter survival mode immediately upon loss. The galgo population is the paradigm case — Normando 2024 establishes the population-level shift, and SOS Galgos documents the individual-level mechanism (hide-in-corner, active flight from all human approach) [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]] [[sos-galgos-adopt-a-survivor]].

2. **Loud-noise event (fireworks, thunder, gunfire).** The corpus is convergent: a dog that escapes during a fireworks event "will quickly go into survival mode — avoiding all humans, even their owners" [[lost-dog-syndrome-understanding-your-dogs-survival-behaviors-holiday-barn]]. The mechanism is acoustic-trauma plus immediate sympathetic activation; the Phase 1 cooperative window collapses to minutes.

3. **Traumatic incident (vehicle accident, explosion, predator encounter).** Direct trauma during or immediately preceding loss bypasses the gradual phase progression and produces immediate flight-locked behavior.

**The adrenaline-conditioning mechanism for the never-chase / never-call rule.** This is the most mechanistically detailed finding in the fear-escalation locus, and it is convergent across multiple MAR documents and named cases [[never-call-a-lost-dog-missing-animal-response-network]] [[dont-call-your-dog-missing-animal-response-network]]. The mechanism:

- When a panicked dog is approached or called by a stranger (or a familiar person while the dog is in flight state), the dog experiences a flood of adrenaline and cortisol.
- The associative-learning capacity of the dog remains intact during the flood; it forms a Pavlovian conditioning between the trigger (a person calling, whistling, clapping, or approaching) and the flight response.
- Once this conditioning is established, the trigger reliably produces the conditioned response — including when the owner themselves later attempts to call the dog.
- Named MAR cases document this pattern explicitly: Lucy (Case 10-264), Lacey (Case 10-267), KoKo — owners called the dog at first sighting, the dog bolted; at second sighting, the owner called again, the dog bolted farther; the pattern stabilized as "calling = flight trigger" [[dont-call-your-dog-missing-animal-response-network]].

The strength of this mechanism is that it is consistent with mainstream associative-learning theory (classical conditioning of a stimulus-response pair during high-arousal events is one of the most robust findings in behavioral neuroscience), and the case studies document it operationally. The weakness is that no controlled experiment isolates the conditioning effect from sample bias (dogs that flee on being called may be selected for higher trait reactivity).

**The olfactory-shutdown mechanism during peak cortisol.** A separate but compatible mechanism for the failure of food lures and owner-scent recognition during acute flight: "the olfactory portion of a dog's brain closes down during the 'fight or flight' process and a panicked dog likely won't recognize their guardian's scent" [[what-you-dont-know-about-lost-pets-can-hurt-them]]. This is plausible — sympathetic activation does redirect cerebral blood flow away from olfactory processing toward visual and motor systems — but the specific claim of olfactory "shutdown" is not directly supported by canine neuroimaging data in the corpus. It is best treated as a practitioner-summary of a real phenomenon (food lures and scent items fail during peak arousal) with the precise neurobiological mechanism uncertain.

**The predator-mimicry mechanism.** A frightened dog interprets direct eye contact, straight-line approach, and upright human posture as predator-stalking behavior [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]]. The counter-protocol is peripheral gaze, oblique approach, and crouching. This mechanism is consistent with comparative ethology — canid predators do approach prey with straight-line approach and visual fixation — and the counter-protocol is validated across MAR practice. Confidence: high on direction; medium on the specific protocol parameters.

**The crowd-pressure death pathway.** Lost Dogs of America, drawing on thousands of cases over 13 years, identifies the top three causes of death among lost dogs as vehicle strike, train strike, and drowning — and attributes all three directly to search pressure pushing dogs into traffic, rail corridors, or water hazards [[never-follow-chase-or-pressure-a-lost-dog-lost-dogs-of-america]]. Specifically: "Lost dogs that are being pressured will stay in 'panic' mode and will make very poor decisions, whereas lost dogs who aren't being pursued or pressured will make very wise decisions and may survive indefinitely." This is the operational explanation for the action-gate architecture in Section 3 — crowd response to sightings is the proximate cause of the deaths.

**The freeze-vs-flight distinction by breed.** Greyhound rescue literature documents the 4F stress response (Fidget/Freeze/Flight/Fight) and notes that the freeze response is "characteristic in greyhounds" [[2-fear-and-anxiety-greyhounds-as-pets]]. The galgo rescue literature documents flight-dominant responses [[sos-galgos-adopt-a-survivor]]. This distinction matters operationally: a freeze response makes a dog visible and potentially catchable in place; a flight response makes the dog invisible and uncatchable. The transition from cooperative to evasion mode in flight-dominant breeds is a transition from "approachable" to "unapproachable" — the dog does not pause in a freeze state where it could be caught.

**Approachable vs. evasion behavioral signals.** The corpus identifies clear behavioral markers [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]] [[lost-dog-behavior-pet-fbi-pets-found-by-internet]]:

- **Approachable signals:** neutral ear position, relaxed tail, sniffing toward observer, body weight forward, head lowered to sniff toward observer.
- **Evasion signals:** ears flattened back, tail tucked, body weight shifted to hindquarters, fixed stare at escape route, pupils dilated, stiff posture, all four feet planted (the freeze pre-flight in sighthounds).

**The three-zone approach model.** When a dog is sighted in cooperative or marginal-cooperative state, the corpus describes a three-zone approach geometry: Awareness Zone (dog detects human, no posture change); Alert Zone (posture change, ready to flee); Action Zone (threshold for bolting) [[lost-dog-behavior-pet-fbi-pets-found-by-internet]]. The rule is to remain in the Awareness Zone and let the dog choose to approach, with 45-degree angled positioning rather than direct frontal approach.

### Calibration Numbers

- **Probability of flight response (vs. fight or freeze) in survival-mode dogs: ≥95%** [[survival-mode-buddha-dog-rescue-recovery]]. Operationally, assume flight as the default response to any stimulus when a dog is in survival mode.
- **Top three causes of death among lost dogs (Lost Dogs of America 13-year case database): vehicle strike, train strike, drowning.** All attributed to search-pressure-induced flight. Operationally, this means search pressure is the leading risk factor for death.
- **Adrenaline conditioning establishes after 1–3 trigger events** (Lucy, Lacey case patterns): one calling event may not condition; two reliably do; three stabilizes the pattern across all callers. The engine should treat any prior calling event by a stranger as having degraded the future effectiveness of calling by the owner.
- **Olfactory-shutdown duration during acute arousal:** Practitioner claim, no quantified timeline. Likely correlated with cortisol peak window (Days 1–3 from Hennessy data) with episodic acute spikes throughout Phase 2.
- **Approach-zone distances are case-specific, not generalizable.** Awareness Zone may be 50 meters for a relaxed shy dog and 200+ meters for a survival-mode galgo; the engine should not encode fixed numbers but should encode the geometric principle (angled, gradual, dog-chooses-distance).
- **Crowd-displacement quantum (per crowd convergence event, fearful dog):** Up to 7 miles in 1 hour documented (Winnie); fatal vehicle-strike outcomes documented (Princess Borzoi).
- **Recovery failure probability when first-response stranger calls/approaches a flight-mode dog:** Effectively certain (the dog flees), and conditioning consequences persist. The engine should treat "first-stranger-calls" as a structural failure mode equivalent to the trap-set-too-early failure in trapping protocol.
- **Phase-reversal feasibility from Phase 2 to Phase 1:** Possible via slow feeding-station habituation, but no timeline quantified. Practitioner sources imply weeks of patient passive presence.

### Knowledge Gaps

- **No controlled experimental test of the never-chase rule** exists, and an ethical RCT is unlikely ever to be conducted. The evidence base is convergent practitioner case-series plus mechanistic plausibility, not RCT-validated.
- **The exact threshold for "active searching becomes counterproductive"** is unquantified. The Lord 2007b finding that neighborhood search correlated with recovery is for gregarious-dominated populations and does not stratify by temperament. The point at which active search flips from helpful to harmful within a single case is not formally specified.
- **The probability distribution of survival-mode onset timing** is poorly characterized. Buddha Dog's "50–99% chance of behavioral regression" describes a probability range, not a probability distribution with a defined mean and variance.
- **Olfactory-shutdown is mechanistically asserted but not directly measured in lost dogs.** A controlled study of olfactory response thresholds during acute stress in dogs would directly test the claim.
- **The recoverability gradient within evasion mode** is unknown. Some Phase 2 dogs can be slowly habituated to a feeding station; others remain unrecoverable. The factors that predict habituation success are not formally characterized.
- **Conditioning extinction timelines are unknown.** Once "calling = flight" conditioning is established, can it be extinguished, and over what timescale? The corpus is silent on this.
- **The interaction between trauma baseline (galgo) and acute-arousal conditioning** is mechanistically plausible but not measured. Does a galgo's trauma baseline produce faster or stronger Pavlovian conditioning of new flight triggers? This matters for the question of whether the action gate should be strictly closed for galgos at any phase.

### Practical Encoding

The fear-escalation dynamics should be encoded as:

**1. Hard prohibitions (action-gate level, conditioned on temperament classification).**

```
forbid:
  - calling_dog_name_by_strangers ∈ all_temperaments
  - crowd_response_to_sighting ∈ {xenophobic, trauma_baseline, fearful, sighthound, any_dog_post_phase_1}
  - direct_frontal_approach ∈ {xenophobic, trauma_baseline, all_phase_2_or_later}
  - eye_contact_at_close_range ∈ {xenophobic, all_evasion_mode}
  - whistling_clapping ∈ {fearful, any_post_first_failed_approach}
```

**2. Soft warnings (advisory, conditioned on phase × λ).**

```
warn_if:
  - elapsed_time > 72h AND attempt = active_search
  - elapsed_time > 24h AND escape_trigger ∈ {fireworks, vehicle_accident}
  - prior_failed_approach_events ≥ 1 AND attempt = call_by_owner
  - phase = phase_2 AND attempt = neighborhood_canvass
```

**3. Required practitioner actions (positive recommendations).**

```
recommend:
  - angled_45deg_approach ∈ all_marginal_cooperative_cases
  - crouch_or_sit_posture ∈ all_approach_attempts
  - peripheral_gaze ∈ all_approach_attempts
  - food_dropped_passively_no_offer ∈ {marginal_cooperative, phase_2_early}
  - silent_observation ∈ {survival_mode, phase_2, phase_3}
  - camera_station_first ∈ all_phase_2_plus_sightings
```

**4. Behavioral-signal triage at sighting.**

The engine should explicitly model the approachable/evasion signal taxonomy and require the operator (or AI assistant) to classify the dog's posture from the sighting description before any approach is authorized:

```
approachable_signals = [neutral_ears, relaxed_tail, sniffing_toward_observer, weight_forward, lowered_head]
evasion_signals = [ears_back, tail_tucked, weight_back, fixed_stare_on_escape, dilated_pupils, stiff_posture, frozen_feet]

if count(evasion_signals_observed) ≥ 1:
   gate_action = camera_station_only (regardless of breed/phase)
elif count(approachable_signals_observed) ≥ 2 AND breed_gate == open:
   gate_action = calm_single_responder_approach
else:
   gate_action = camera_station_first + continued_observation
```

**5. The forward-looking encoding question — adaptive priors.**

A material implication of the cortisol-conditioning mechanism is that **the engine's priors should themselves age**. A dog's stranger-fear probability score should drift toward higher values over phase progression (cortisol-driven entrenchment of survival mode), with the rate of drift conditioned on escape trigger and temperament. Forward implementation should treat this as a Bayesian belief decay where each elapsed day without a high-λ approach-success observation increases the conditional probability that the dog has entered evasion mode. This is the operational expression of the finding that survival mode is not a binary state but a probability that increases with elapsed time and decreases with high-confidence cooperative-behavior observations.

The forward research implication is that Nona's own operational data — every recovery case, every failed approach, every sighting timeline — is itself the highest-value data collection opportunity. The published literature contains no controlled lost-dog phase-transition timing, no breed-stratified phase durations, no calibrated sighting reliability, and no Algarve-specific population data. A platform that collects structured intake data, sighting records with operator-classified behavioral signals, and recovery outcomes will, within 2–3 years of operation, be the world's largest validated dataset on lost-dog behavior. The probabilistic engine's most consequential long-term encoding is the one that makes that dataset learnable: structured fields at intake, structured fields at every sighting, structured outcome classification at recovery, and the architectural separation between belief layer (which the engine learns from) and action layer (which the engine's safety constraints govern).

The honest probabilistic engine for lost-dog rescue is one that surfaces these confidence levels to the operator. The phase boundary is conditional. The breed prior is two-layered. The Bayesian sighting framework is architecturally split. The never-chase rule is mechanistically grounded but empirically practitioner-derived. Every one of these statements is more useful to the rescue coordinator than a false-confident single number — and every one of them maps onto an operational gate, action, or warning that the engine can implement today, while leaving the right hooks for the data Nona will collect over time to refine the calibration.
