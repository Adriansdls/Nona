---
title: Untitled
tags:
- lost-dog-behavioral
- dog-movement-algarve
- lost-dog
- locus-bayesian-sighting-update
- survival-mode
created: '2026-05-28T09:28:53.372772Z'
updated: '2026-05-28T09:28:54.456371Z'
status: review
type: note
deprecated: false
summary: Nona's behavioral engine should be built as a four-axis probabilistic system
  whose inputs are time-elapsed since loss...
---

# Probabilistic Behavioral Engine for Lost-Dog Rescue — Synthesized Specification

## Executive Summary

Nona's behavioral engine should be built as a four-axis probabilistic system whose inputs are time-elapsed since loss, breed/temperament category, escape-trigger type, and accumulated sighting history, and whose outputs are two architecturally decoupled layers: a continuous spatial belief map that updates from every credible sighting, and a discrete action gate that authorizes (or forbids) specific response behaviors based on temperament, phase, and prior-conditioning state. The single most consequential finding across the corpus is that the dominant cause of recovery failure is fear escalation under search pressure — an asymmetric error mode where misclassifying a fearful dog as gregarious produces fatal crowd-driven displacement, while misclassifying a gregarious dog as fearful only wastes trap time. That asymmetry forces the architecture: belief always updates; action is gated; breed governs the gate at full weight even though breed explains only ~9% of individual behavioral variance [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]] [[never-follow-chase-or-pressure-a-lost-dog-lost-dogs-of-america]].

The strongest quantitative anchors in the underlying literature are Kremer 2021's Dallas shelter analysis (70% of returned-to-owner strays within 1 mile of home, 42% within 400 feet, n=30,609) [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]]; Lord 2007's median recovery time of 2 days with a 0.5–21 day range across 187 Ohio dogs [[lost-pet-statistics-lost-pet-research-and-recovery]]; Weiss 2012's 93% (86–97% CI) all-cause recovery rate across 1,015 US households [[frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc]]; and Hennessy's three-phase cortisol arc from shelter-dog research (days 1–3 peak, 4–9 declining, 9+ plateau) as the only direct physiological anchor for the practitioner-named phase boundaries [[sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo]]. These describe the population-mean lost dog — and the central reframe of this report is that Nona will not encounter that dog at proportional rates. Easy gregarious cases self-resolve before professional rescue is engaged; the platform's actual caseload is dominated by the hard tail — trauma-baseline galgos, prey-driven podencos, blind-panic escapes, repeated failed-approach histories — for which the population priors systematically misclassify.

For the Algarve specifically, the engine must hard-code two breed-specific dual priors. The galgo prior is structurally dual: a chase-displacement prior derived from greyhound prey-fixation research (OR=8.34 for last-known-location fixation when prey stimulus disappears) governing *where* the dog is likely to be, and an approach-avoidance prior derived from galgo-specific trauma data (Normando 2024, p=0.009 for stranger-fear; ~0.02 stranger-approach success on day 1) governing *how* the dog can be recovered [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]] [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]]. The podenco prior is built around triple-sensory active search: McLennan's predatory motor sequence data shows Hunt 69%, Chase 69%, Consume 8%, meaning prey pursuit is intrinsically motivated and food lures are unreliable during active arousal, with expanding-ellipse movement of 5–15 km in 24–48 hours across scrubland [[prey-drive-in-podencos]] [[arousal-and-predatory-motor-patterns]]. The remainder of this document covers each of the four required topics with the four required outputs — empirical findings, calibration numbers, knowledge gaps, and practical encoding — at the precision required to drive a deployed scoring system.

---

## 1. Temporal Behavioral Phases — Empirical Data

### Key Empirical Findings

**No peer-reviewed dog-specific study measures behavioral phase transitions.** This is the single most important finding of this section, and it determines what kind of engine Nona can defensibly build. The IAABC review by Kat Albrecht is unambiguous: "no one had ever studied lost pet behaviors, and there was no data available on the typical distances that lost dogs or lost cats travel" [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]. The operating phase model — Phase 1 acute panic, Phase 2 survival, Phase 3 entrenched — is a practitioner consensus assembled from thousands of case observations by Missing Animal Response (MAR), Lost Dogs of America, Lost Dogs Illinois, K9s On Call, and Buddha Dog Rescue, triangulated against four independent evidence streams [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]].

The first stream is physiological. Michael Hennessy's shelter-stress research, presented at SPARCS 2015 and grounded in multiple peer-reviewed studies, shows a consistent three-phase cortisol arc: roughly three times higher on Day 1 than at home, declining through Days 4–9, then plateauing from Day 9 onward [[sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo]]. This is shelter-stress data, not lost-dog data, but the HPA-axis mechanism transfers: a dog isolated from its attachment figure in an unfamiliar environment shows the same descending curve regardless of whether the environment is a shelter kennel or a scrubland thicket. The 72-hour Phase 1 boundary sits inside the descending limb of the cortisol curve, exactly where the dog is shifting from acute HPA activation toward sustained survival mode.

The second stream is the cat-curve analog. Huang 2018 (n=1,210 missing cats, peer-reviewed competing-risks survival analysis) is the only published temporal recovery curve for displaced companion animals: 34% found alive by day 7, approximately 50% by day 30, near-plateau after day 61 [[source-analysis-huang-2018-missing-cats-search-methods-locations]]. The transfer to dogs is structural, not numeric: dogs recover roughly 3× faster than cats in the early window (shelter reclaim rates are 26–40% for dogs vs. 2–4% for cats), so the cat day-7 inflection likely corresponds to a dog day-3 to day-5 inflection. What transfers is the curve shape — steep early decline, urgency cliff in the first week, long-tail flattening after day 30.

The third stream is direct quantitative anchors for dogs. Lord 2007 (n=187 Ohio lost dogs) reports median recovery time of 2 days with a 0.5–21 day range; 71% found within 1 mile of home, 14% within 1–5 miles, 7% beyond 5 miles, 8% returned home unassisted [[lost-pet-statistics-lost-pet-research-and-recovery]]. Kremer 2021 (n=30,609 Dallas shelter intakes) establishes that 91% of dogs reclaimed by owners are reclaimed within the 5-day mandatory hold period; this is a policy artifact (the shelter ends the hold), but its alignment with the practitioner 3–4 day behavioral threshold is not coincidence — both reflect the same underlying urgency curve [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]]. Weiss 2012 (n=1,015 US households) provides the all-cause recovery anchor of 93% with a 86–97% confidence interval, recovery method breakdown 49% neighborhood search, 20% spontaneous return, 15% ID tag/chip, 6% shelter [[frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc]]. Foster 2025's HASS synthesis of Fi GPS-collar data finds that 95% of dogs that wander beyond safe zones travel at most 1.8 miles (~2 km) from home, with average recovery distance just 700 feet [[most-lost-dogs-are-just-around-the-corner-literally-hass]].

The fourth stream is practitioner case-series consensus. Lost Dogs Illinois, drawing on 3,000+ recoveries over 13 years: "after 3–4 days, if your dog has been separated from you and is in flight/survivor mode, from their perspective they don't have an owner anymore. Anyone who approaches them is a stranger, including you" [[lost-dog-behavior-tips-lost-dogs-illinois]]. Buddha Dog frames survival-mode probability as 50–75–90–99% depending on history and notes that, once entered, "very often EVERY human is viewed as a predator – even the one that has fed, loved, walked, bathed and pampered them for the last 2-4-12 years" [[survival-mode-buddha-dog-rescue-recovery]]. K9s On Call documents the operational phase-2 behavioral signature: nocturnal activity ("more likely to be moving at night... when they stop moving, they will usually hunker down for the day"), the "Silence Factor" (cessation of barking), and pattern formation around reliable food/water/shelter that enables trap deployment [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]]. Buddha Dog adds the food-container paradox: shaking a food container, normally a positive stimulus, becomes a flight trigger in survival mode.

**The escape-trigger collapse of Phase 1.** The four-stream triangulation describes the *population mean*. What the cross-stream analysis forces is that this mean conceals a bimodal distribution. For gregarious dogs with opportunistic escapes (gate left open, slipped leash), Phase 1 may stretch to 5–7 days because the dog remains in cooperative mode and self-approaches humans. For dogs with blind-panic triggers — fireworks, gunfire, vehicle accident — or xenophobic temperaments (rescued galgos, fearful chihuahuas, herding breeds with reactivity history), Phase 1 effective duration collapses to 0–24 hours because survival mode onset is essentially instantaneous [[lost-dog-syndrome-understanding-your-dogs-survival-behaviors-holiday-barn]]. The MAR taxonomy distinguishes three temperaments (Gregarious, Aloof, Xenophobic) and three escape causes (Opportunistic Journey, Wanderlust, Blind Panic); the intersection of xenophobic temperament with blind-panic trigger produces the most extreme behavior — instant Phase 2 entry, near-zero approach probability, long-distance displacement, high vehicle-strike mortality. Treating the 72-hour boundary as universal misses the cases that matter most for a professional rescue platform.

Lost-dog recovery is therefore a race against phase transition, and the recovery-time distribution is the centroid of a bimodal mixture: a gregarious sub-population that resolves quickly (most Lord 2007 and Weiss 2012 cases), and a xenophobic/blind-panic sub-population whose long tail extends through weeks of disciplined passive protocol (the Winnie case ran 69 days before recovery). The 2-day median is not a population property — it is the average of two distinct populations Nona must model separately.

### Calibration Numbers

| Parameter | Value | Confidence |
|---|---|---|
| Phase 1 default duration (gregarious + opportunistic) | 0–72h | medium |
| Phase 1 effective duration (xenophobic temperament) | 0–24h | medium-high |
| Phase 1 effective duration (galgo, any trigger) | ≈0h (start in Phase 2) | medium-high |
| Phase 1 effective duration (podenco prey-drive escape) | 0–4h | medium |
| Phase 2 boundary | 72h – 7d | medium-high |
| Phase 3 threshold | 7d+ | medium-high |
| Shelter urgency cliff (Kremer 2021) | day 5 (91% reclaim) | high |
| Median recovery time (Lord 2007, all dogs) | 2 days | high |
| All-cause recovery rate (Weiss 2012) | 93% (CI 86–97%) | high |
| Recovery curve plateau (Huang cat analog) | day 60+ | medium (transfer) |
| Cortisol acute peak window (Hennessy) | days 1–3 | high |
| Survival-mode onset probability (xenophobic) | 0.95–0.99 | medium |
| Survival-mode onset probability (gregarious) | 0.50 | medium |
| Survival-mode onset probability (unknown default) | 0.75 | low-medium |
| Nocturnal-activity shift threshold | ~day 2 | medium |
| Population within 1 mile of home (Kremer) | 70% | high |
| Population within 400 feet (Kremer) | 42% | high |
| 95th percentile travel distance (Fi GPS) | 1.8 mi (~2 km) | high |
| Hard-case mixed-breed pickup distance (Albrecht 1999) | ~14 miles | medium |
| Rural/low-density distance modifier | 1.5–2.5 mi (vs. 0–0.5 dense urban) | high |
| Recovery-by-phase (gregarious-dominated populations) | Phase 1 60–70%, Phase 2 20–25%, Phase 3 5–15% | medium |

### Knowledge Gaps

No controlled longitudinal study of cortisol × behavior × time exists for lost dogs. Hennessy's data is shelter-confined; translation to displacement stress is mechanistically plausible but unmeasured. Lord 2007's 2-day median is from a single Ohio county and is survivorship-biased — the right tail (dogs that took weeks or never recovered) is underrepresented. The Huang 2018 cat-to-dog transfer is structural only; no equivalent peer-reviewed temporal recovery curve exists for dogs. The qualitative claim that xenophobic breeds enter Phase 2 within 24 hours is convergent across practitioner sources but lacks controlled backing. The Algarve operational context — rural sparse population, hot summers forcing daytime hiding for all temperaments, native podenco and trauma-baseline galgo populations — has no published telemetry data; the 5-day shelter cliff is a US policy artifact and Portuguese municipal canil hold periods, dispersion, and rescue-network density may shift the urgency curve. Reversibility of Phase 2 (whether a settled survival-mode dog can be coaxed back to approach-tolerance via long passive feeding) is undocumented quantitatively, though MAR case narratives (Winnie, 69 days) suggest gradual partial reversal is possible. The fraction of dogs that never enter survival mode is unknown — Buddha Dog's "50–99%" range is a width, not a point estimate. Onset time within a temperament category is genuinely variable: Buddha Dog and Holiday Barn both note "very little correlation with previous behavior/life history" between known temperament and observed onset speed [[survival-mode-buddha-dog-rescue-recovery]].

### Practical Encoding

The phase classifier should be a four-input function of `(hours_since_loss, breed_category, escape_trigger, temperament)`, not a pure time function. Trigger-conditional Phase 1 collapse is the load-bearing structural element:

```
phase(t, breed, trigger, temperament) =
    if breed == "galgo":                              phase_1_cap = 0      # start in Phase 2
    elif trigger == "prey_drive" and breed == "podenco":  phase_1_cap = 4
    elif trigger == "blind_panic" or temperament == "xenophobic":  phase_1_cap = 24
    else:                                              phase_1_cap = 72

    if t < phase_1_cap:    return "phase_1_acute"
    elif t < 7d:           return "phase_2_survival"
    else:                  return "phase_3_entrenched"
```

The engine should expose the phase boundary as a confidence range, not a hard cutoff. A dog observed approaching a stranger at hour 48 has demonstrated Phase 1 behavior, and the prior should update toward continued Phase 1; a dog with no sightings 72 hours after a blind-panic loss should be treated as Phase 2 by default. Survival-mode onset probability — drawn from the per-temperament table above — drives whether the action gate escalates regardless of elapsed time. Urgency weighting on alert prioritization peaks at Phase 2 (multiplier ≈1.4) before the shelter cliff and decays through Phase 3 (multiplier ≈0.7), where the only valid actions are passive feeding station, trail camera, and trap. Phase 3 cases are deprioritized in active-alert UI but never closed — the long tail (Winnie, 69 days; Huang cats indefinitely) demands persistent monitoring. The Algarve summer-heat modifier (ambient >30°C) shortens trap-monitoring intervals, prioritizes water-station co-deployment, and forces the engine to recognize that daytime hiding is universal in heat and cannot be used as a survival-mode classifier between June and September.

---

## 2. Breed-Specific Behavioral Priors

### Key Empirical Findings

The corpus's central tension lives here. **Morrill et al. 2022** (*Science*, n=18,385 surveyed, n=2,155 genome-sequenced) is the strongest evidence against using breed as a behavioral prior: breed explains 9 ± 3% of behavioral variation in individuals, and "for less heritable, less breed-differentiated traits, like agonistic threshold (factor 5), which measures how easily a dog is provoked by frightening, uncomfortable, or annoying stimuli, breed is almost uninformative" [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]]. Behavioral GWAS loci are not unusually differentiated across breeds (PBS z = −0.001, p = 0.224); only 332 of 16.7 million SNPs are exclusive to and fixed within any breed (0.002%); within every breed of ≥25 dogs, 67.2 ± 7.5% of individuals score within 1 SD of the population mean on any behavioral factor. The agonistic threshold — the *exact* dimension that governs lost-dog flight behavior — is where breed is *least* predictive. Sixty-six percent of mixed-breed dogs carry meaningful ancestry (>5%) from four or more breeds; only 17% are two-breed mixes. Visual breed identification of mixed-breed dogs therefore cannot reliably predict behavioral profile.

**Normando et al. 2024** (n=410 rescue dogs, 198 galgos vs. 212 controls) is the strongest counter-evidence: galgos show "out of context fear of non-cohabiting adult people" at significantly higher prevalence than other rescue dogs (p=0.009, >1 in 5 galgos vs. effectively zero in controls) [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]]. Normando 2025 (n=768, C-BARQ) confirms within-sighthound behavioral differentiation: predatory drive differs significantly across sighthound breeds (p<0.001), with Saluki/Cirneco highest and Piccolo Levriero Italiano lowest, while sighthounds as a group display "very low level of aggressive behaviour... combined with high predatory drive and a fair level of attachment/affection" [[behavioural-characteristics-of-sighthounds-an-exploratory-investigation-dog-beha]].

**The resolution is scope, not contradiction.** Morrill measures individual-level predictability — given this individual dog is a galgo, can I predict its agonistic threshold? Answer: no, breed explains very little of the variance. Normando measures population-level group means — is the galgo population's mean stranger-fear distribution shifted compared to other rescue dog populations? Answer: yes, significantly. Both are right. The operational consequence is decisive: breed cannot be used to predict an individual dog's stranger-fear score, but breed legitimately drives the **default capture-strategy protocol** before any individual signals arrive. Nona's intake stage has no individual signals; the group-level prior governs the action gate. Once individual signals accumulate (owner-reported stranger response, observed flight-vs-approach in sightings, prior loss history), they dominate the probability score — but the action gate persists at the breed-derived default until high-confidence individual evidence overrides it.

**The galgo case requires two priors, not one.** This is the single most consequential breed-specific finding in the report. Chase behavior and approach-avoidance behavior are governed by phylogenetically and neurobiologically distinct systems [[arousal-and-predatory-motor-patterns]]:

- **Chase / predatory motor sequence.** Sighthounds skip the Search phase of the predatory motor sequence entirely and react directly to prey stimuli — "sighthounds don't search, they react." Starling et al. 2020 found that when prey stimulus disappears (lure stops moving and goes silent on a straight track), greyhounds fixate on the last-known location of the prey at OR=8.34 (95% CI: 1.72–42.38, p=0.009) [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]]. This is phylogenetically conserved sighthound behavior, documented in live-prey coursing as well as mechanical lures. Chase motivation is appetitive and self-reinforcing — wild canid hunt success rates of 5–13% and greyhound coursing capture rates of ~13% demonstrate the behavior is maintained without consumption. The mechanism transfers to galgo with high confidence in direction (galgos will fixate at prey-loss terminus) but appropriate humility on the exact magnitude (the CI is wide; no galgo-specific empirical test exists).

- **Approach-avoidance / trauma-fear system.** This is where greyhound data does NOT transfer. English racing greyhounds show freeze-dominant responses to human approach — the 4F response sequence (Fidget/Freeze/Flight/Fight) described in the Greyhounds as Pets NZ guide includes "frozen or stiff posture, pupils dilated, trembling, tense closed mouth, ears back, tail tucked, body hunched, all feet stuck to floor, leaning backwards" — recoverable because the dog remains visible and not actively moving [[2-fear-and-anxiety-greyhounds-as-pets]]. Rescued galgos show flight-dominant responses: SOS Galgos and Galgos del Sol document 18+ individual intake profiles with hide-in-corner / flight-from-approach behavior, "almost universal" maltreatment baseline, and recovery timelines of "weeks or sometimes months" before allowing human approach [[sos-galgos-adopt-a-survivor]] [[what-is-a-galgo-galgos-del-sol]]. The galgo's trauma baseline is environmental/developmental — galguero hunting practices, kennel conditions, systematic post-season abandonment — not strictly genetic. But at the population level it is overwhelmingly present, producing a categorically different behavioral profile from the racing-greyhound rescue population on which the 4F freeze model was built.

**The podenco case is about predatory motor sequence, not stranger-fear primarily.** McLennan's data on podenco predatory motor sequence is the load-bearing breed-specific finding: Hunt 69%, Orient 69%, Eye 54%, Stalk 23%, Chase 69%, Grab-bite 69%, Possess 31%, Kill-bite 46%, Dissect 23%, Consume 8% [[prey-drive-in-podencos]]. The 8% Consume rate is the operational crux: predatory chase in podencos is appetitive and self-reinforcing without food terminus, which makes food lures unreliable during active arousal — "in high arousal states... dogs in high arousal refuse food — high-prey-drive sniffing RAISES arousal, does not calm" [[arousal-and-predatory-motor-patterns]]. The podenco is an explicit triple-sensory hunter — sight, scent, and hearing — bred for endurance trotting (not greyhound-style sprint) across Mediterranean scrubland, with documented agility including tree climbing and 6-foot fence clearance [[about-podenco-dogs-hope-for-podencos]]. A lost podenco in prey-drive activation is not freezing or hiding; it is actively ranging across scrubland in an expanding multi-sensory search, scrubland-biased over open ground, with mechanistically inferred radius of 5–15 km in 24–48 hours [[interim-report-podenco-lost-movement-pattern]]. No GPS telemetry exists for lost podencos; this is medium-confidence inference from predatory-motor data plus endurance physiology plus terrain ecology.

**The breed-group table beyond galgo and podenco.** The corpus addresses other categories with less depth but consistent patterns. Toy breeds rarely exceed 0.75 miles from origin (Albrecht 1999, n=254 informal); they are most often hidden close to the escape point and are vulnerable to in-situ predation/exposure rather than distant displacement. Scent hounds — beagle as the canonical reference outside Iberia — possess ~220 million olfactory receptors, follow scent trails over distance ("a strong scent trail can override even well-trained recall"), and execute the Search stage of the predatory motor sequence visibly (nose-down, large-area sweep) [[beagle-running-away-chasing-escaping]]. Herding breeds are flagged by Lost Dogs Illinois as elevated-flight-risk and Phase-2-prone, especially when poorly socialized or reactive to noise [[lost-dog-behavior-tips-lost-dogs-illinois]]. Guardian breeds are not isolated in the empirical corpus; the practitioner heuristic from MAR places them with aloof/xenophobic temperaments in displacement and notes territoriality may produce return-attempts when loss occurs near home and permanent displacement when loss occurs in unfamiliar territory. Mixed/unknown breeds: the Albrecht 1999 figure of 14 miles average for mixed-breed pickup is almost certainly a survivorship artifact of which dogs reach the "travel far before pickup" population, not a genetic effect — and Morrill's finding that 66% of mixed-breed dogs carry ancestry from 4+ breeds means no single-breed-derived prior can be safely applied to a mixed dog. Mixed/unknown should default to population-level priors modulated by individual behavioral signals.

The synthesized interpretive beat: **breed is a capture-strategy prior, not primarily a probability prior**. A galgo intake should initialize passive-only capture protocols not because galgos are individually predictable but because the asymmetric cost of misclassifying a fearful galgo as gregarious (fatal crowd-displacement) vastly exceeds the cost of misclassifying a gregarious galgo as fearful (a few wasted hours of trap setup).

### Calibration Numbers

| Breed-prior parameter | Value | Confidence |
|---|---|---|
| Breed weight in probability score | ≤10% | high (Morrill) |
| Breed weight in action-gate selection | 100% (until individual signals override) | high (Normando + MAR) |
| Galgo stranger-approach success, day 1 | 0.02 | high (5+ practitioner consensus) |
| Galgo passive-protocol minimum | 72h camera-station before any approach | high |
| Galgo full recovery timeline (trauma cases) | 4–12 weeks | medium |
| Galgo fence-clearance requirement | 1.8 m (6 ft) | high |
| Galgo chase-fixation odds ratio (transfer) | OR=8.34, CI 1.72–42.38 | medium (greyhound transfer) |
| Galgo chase-terminus search radius | 1–3 km around prey-loss point | medium |
| Podenco Consume rate | 8% | high (McLennan) |
| Podenco food-lure effectiveness during active chase | ~10% | medium |
| Podenco food-lure effectiveness (settled, post-pattern) | ~75% | medium |
| Podenco lost-radius 24h (prey-drive escape) | 5–10 km | medium |
| Podenco lost-radius 48h (prey-drive escape) | 10–15 km | medium |
| Podenco terrain bias | scrubland > rocky cover > field > road | high |
| Podenco fence-clearance requirement | 1.8 m (6 ft) | high |
| Sighthound (other: whippet, lurcher, saluki) day-1 approach | ~0.15 | medium |
| Scent hound olfactory receptors (beagle) | ~220 million | high |
| Scent hound scent-following radius | ~8 km along established trail | medium |
| Toy breed maximum radius | <1.2 km (0.75 mi) | medium |
| Mixed-breed hard-case displacement (Albrecht 1999) | ~22.5 km (14 mi) | medium |
| Mixed-breed 4+ ancestry prevalence | 66% | high (Morrill) |

### Per-Category Operational Table

| Category | Movement radius (24–48h) | Approach default | Terrain preference | Capture protocol |
|---|---|---|---|---|
| Galgo | 1–3 km (prey-fixed); 5–10+ km (panic) | Forbidden direct approach | Path of least resistance; cover-seeking | Passive-only, conspecific lure, 72h+ camera-first |
| Podenco | 5–15 km (prey-drive); 2–5 km (default) | Forbidden during arousal | Mato scrubland, rocky cover | Passive scent-anchor + trap (after settle), food only post-pattern |
| Sighthound other (whippet/lurcher/saluki) | 5–10 km if panicked | Caution; passive default | Open + cover mixed | Passive-first, conspecific lure if available |
| Scent hound (beagle/pointer/foxhound) | 5–10+ km along scent trail | Open-cooperative if not panicked | Scent-trail biased | Active Phase 1 along trail; passive thereafter |
| Toy breeds | <1.2 km | Owner-led OK | Hidden close to escape (porches, drainage, dense vegetation) | Intensive neighborhood search first 24h |
| Herding | 1–5 km (variable; noise-phobic flight risk) | Calming-signals protocol | Open ground with cover access | Passive with calming-signal approach |
| Guardian (mastiff, LGD) | Variable; may return to territory | Caution — may guard last-known location | Territorial perimeter | Territorial perimeter search, no chase |
| Mixed/unknown | Population baseline (1.8 km 95%ile) or hard-case (22.5 km) by signal | Temperament-gated | Variable | Temperament-gated default |

### Knowledge Gaps

No peer-reviewed controlled study has compared lost-dog recovery rate, distance, or method across breed types. Albrecht 1999 (n=254) is the only existing breed-type distance data and is an informal practitioner survey. No GPS-telemetry study exists for lost galgos or lost podencos in Mediterranean scrubland; the 5–15 km podenco radius and the 1–3 km galgo chase-terminus radius are mechanistic inferences. The Starling 2020 OR=8.34 transfer from English racing greyhounds to Spanish galgo is a phylogenetic inference subject to the wide 1.72–42.38 confidence interval; the galgo-specific magnitude is unknown. Normando 2024 does not provide a numerical prevalence beyond ">1 in 5"; the precise group-mean shift for galgo stranger-fear is unmeasured, and the comparison group ("other rescue dogs") is not broken out by sighthound-vs-non-sighthound. Normando 2025 does not include galgo español or podenco specifically; within-type chase-intensity differences remain unmeasured. MacLean et al. 2019 (PNAS) — the strongest pro-breed-prior academic position — is paywalled and inaccessible in this corpus, so the upper bound on heritability of stranger-fear within sighthounds is not tightened. The Algarve galgo population may differ in trauma baseline from the Spanish-hunting-kennel population Normando sampled; rescued-as-pet galgos likely have lower stranger-fear priors than hunting-discarded individuals, but the local mix is unknown. No published study tests whether breed-specific capture protocols yield better outcomes than generic passive protocols; a randomized trial at n>500 would directly validate the breed-prior architecture.

### Practical Encoding

The breed prior is implemented as a **two-layer structure** with explicit asymmetric weighting:

**Layer 1 — Action-gate selector (100% breed-governed at initialization).** This is a discrete protocol selector, not a probability score. It determines which capture protocol initializes and which actions are *prohibited* regardless of probability:

```
action_gate(breed_category) = {
  galgo:              passive_only + conspecific_lure + camera_first + no_crowd_response
  podenco:            passive_lure + scent_anchor + wide_radius_camera_grid + no_crowd_response
  sighthound_other:   passive_first + last_known_anchor + no_crowd_response
  toy:                tight_radius_search + neighborhood_canvas + check_hiding_spots
  herding:            assume_xenophobic_default + passive_lure + low-noise_protocol
  guardian:           territorial_consideration + return_path_likely + no_chase
  scent_hound:        active_phase_1_along_scent_trail_then_passive
  mixed/unknown:      temperament_gated + degrade_on_signal
}
```

**Layer 2 — Probabilistic score (breed weight capped ≤10%).** Breed contributes at most 10% to the stranger-fear probability score; owner-reported individual signals (stranger response history, prior loss events, history of fearfulness) and observed sighting behavior dominate. Capping breed weight at this ceiling is the operational expression of Morrill's 9% variance finding.

**Three encoding principles:**

1. **Asymmetric cost of errors gates the action layer.** A false-gregarious classification of a galgo that triggers crowd response can cause fatal displacement (the Princess Borzoi pattern). A false-xenophobic classification of a gregarious mixed-breed causes only unnecessary trap deployment. The action gate defaults conservative — passive when uncertain.

2. **Galgo requires two separate priors:** `galgo_spatial_prior` (governs WHERE — driven by greyhound chase data, OR≈8.34 fixation at prey-loss terminus) and `galgo_capture_prior` (governs HOW — galgo-specific, passive-only, 72h minimum, conspecific-lure preferred). These feed different model outputs and must never be conflated; doing so produces structurally miscalibrated estimates that pretend the same evidence base supports both.

3. **High-λ observations override the breed prior probabilistically; the action gate persists until a high-confidence individual signal changes the temperament classification.** A single low-λ sighting describing a galgo "running up to" a stranger updates the probability score (reducing stranger-fear estimate) but does NOT relax the action gate. Only camera-confirmed approach-and-accept behavior at λ ≥ 0.95 should change the action gate. This is the load-bearing safety architecture.

---

## 3. Bayesian Updating from Sightings

### Key Empirical Findings

The Bayesian update framework for lost dogs sits on three convergent mathematical frameworks from adjacent literature plus two load-bearing case studies. The frameworks (Lin & Goodrich 2010, Hashimoto et al. 2022, SARBayes) come from human Wilderness Search and Rescue (WiSAR); the case studies (Winnie, Princess Borzoi) come from MAR practitioner archives. The synthesis is a high-confidence architectural finding wrapped around medium-confidence calibration parameters.

**The formal architecture.** Lin & Goodrich (2010) propose a Bayesian model that constructs a probability distribution map of likely lost-person location using terrain features, modeled as a first-order Markov transition matrix, "designed to be augmented by search and rescue workers to incorporate additional information" — the formal hook for sighting updates [[a-bayesian-approach-to-modeling-lost-person-behaviors-based-on-terrain-features]]. Hashimoto et al. 2022 (Scientific Reports) extend this to an agent-based model with six reorientation strategies as a probability mass function (Random Walk, Route Travel, Direction Travel, Stay Put, View-Enhancing, Backtrack) drawn i.i.d. each timestep, validated against 65 ISRID hiker incidents with 58.5% of held-out cases exceeding the 95th percentile of untrained distributions [[source-analysis-hashimoto-2022-agent-based-lost-person-model]]. Hashimoto explicitly does not include a sighting-update mechanism — the forward model generates the prior; the sighting-update layer must be built separately. For dogs, the Hashimoto taxonomy maps cleanly with one addition: a seventh "Scent Track" strategy weighted heavily for beagles and moderately for podencos. SARBayes provides empirical validation of probability-map quality via the MapScore framework: ISRID Distance Ring model 0.78 (95% CI 0.74–0.82, n=376 cases); Combined Distance+Watershed model 0.81 (95% CI 0.77–0.84) [[sarbayes-bayesian-methods-for-wisar]]. A well-designed prior based on category × terrain features is materially better than random (which scores 0) and approaches the practical predictability ceiling.

**The action-gate architecture is the load-bearing innovation for dogs.** Where human WiSAR Bayesian models can assume the subject's location is conditionally independent of the observation act — a lost hiker does not flee searchers — this independence assumption fails completely for fearful dogs. A sighting that triggers crowd response causes a displacement event: the dog moves from L_obs at time T to L_obs + Δ at T+Δ, where Δ is behaviorally determined and observed up to 7 miles in 1 hour (Winnie) and 200+ miles across multiple states (Princess Borzoi). The Bayesian model that ignores this produces a posterior more wrong than the prior. The architectural response — and this is the single highest-confidence finding in the entire sighting-update locus — is **strict separation of belief update and response action**. The posterior should always update from every credible sighting (information that improves the model); the response action (mobilizing searchers, broadcasting the sighting location) should be gated by temperament, not driven by the posterior update. Coupling these two modules is the most common engineering mistake (high-quality sighting → high-confidence map update → reflexive crowd response), and it is fatal in the literal Princess-Borzoi sense.

**Crowd-displacement as the documented failure mode.** The Winnie case (69-day recovery; 7-mile displacement in 1 hour from a single crowd-convergence event after a sighting posted on social media) and the Princess Borzoi case (fatal multi-state displacement after repeated crowd events; killed on Highway 34 in Colorado) provide the case-study evidence base [[dog-befriends-a-fox-while-lost-in-blizzard]] [[stay-out-of-the-woods-missing-animal-response-network]]. The MAR doctrine crystallizing from these and thousands of similar cases is unambiguous: when a sighting reaches a large group, the most probable outcome is that one or more individuals attempt visual capture, invalidating the sighting and potentially displacing the dog. The corpus-critic adversarial search for counterexamples — situations where crowd response to sightings of fearful dogs actually succeeded — returned zero. This is one of the highest-confidence findings in the entire corpus, supported by convergence across two formal frameworks, two named fatal case studies, and the absence of disconfirming evidence.

**The MAR sighting-response protocol.** The HARTT intake schema specifies that every sighting record date, exact time, exact location, direction of travel, and observer contact information [[lost-pet-owner-guide-hartt]]. Direction of travel is the highest-value field — it tells where the dog is heading, not just where it was; two or three sightings with directional vectors triangulate a movement corridor, materially more informative than position fix alone. The MAR sighting-response action protocol is equally unambiguous: receive a sighting → send one calm person to place a food station within 50 feet → set up a trail camera → confirm regular visits over 2–3 days → set a humane trap with door tied open overnight initially → spring the trap only when the dog has been seen entering and eating consistently [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]]. At no step is a crowd introduced. Camera confirmation is the trap-deployment gate: across MAR, HARTT, Joyful Pets, and Lost Pet Research & Recovery the consensus is unanimous — do not deploy traps based on eyewitness sightings alone.

**Reliability λ weights — the medium-confidence layer.** The corpus does not provide empirically calibrated reliability weights specifically for dog sightings. The weights derived from adjacent-domain reasoning (human eyewitness research, WiSAR sensor models) and validated against practitioner consensus are: trail camera with image timestamp λ=0.95; clear daylight eyewitness with named observer and complete 4-field intake λ=0.70; uncertain or nighttime or brief eyewitness λ=0.35; crowd-degraded sighting (sighting where crowd convergence likely caused immediate displacement, or sighting reported only after social-media mass-broadcast) λ=0.20 [[interim-report-bayesian-sighting-update]]. These are starting points for refit, not validated parameters.

**Updating the expected-position distribution.** Updating P(location | sightings, t+12h) given a confirmed sighting at time T requires three components: a movement kernel (how far and in what direction the dog typically moves in 12h, conditioned on phase and temperament), a terrain transition matrix (probability of movement across watershed, road, fence, scrub-vs-open boundaries), and the λ-weighted sighting likelihood. For a galgo prey-triggered escape with confirmed sighting at scrubland coordinate X with direction-of-travel noted, the 12h posterior concentrates within a 5–10 km elliptical region oriented along direction-of-travel from X, biased toward scrubland over open ground, with secondary mass at the prey-loss terminus (the OR=8.34 chase-fixation anchor) if a prey-stimulus location is known. For a podenco in active prey-drive, the 12h posterior is a radially expanding scrubland-biased pattern centered on X with high entropy (5–15 km plausible). For any settled survival-mode dog with established feeding pattern, the 12h posterior is a low-entropy distribution clustered within 1 km of the known feeding station, because survival-mode dogs form patterns and develop routines around reliable food/water/shelter [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]].

**The Lord 2007 vs. MAR-doctrine tension resolves through temperament-gating.** Lord 2007's finding that neighborhood search correlated with recovery (49% of Weiss 2012 recoveries) is dominated by gregarious dogs found in the first 24–48 hours. MAR doctrine is built on the hard-case sub-population (xenophobic, trauma-history, evasion-phase) that does not appear in Lord's sample at proportional rates because the sample was drawn from newspaper-ad respondents and shelter contacts — gregarious selection-bias by construction. Both findings are valid for their populations. Nona disproportionately encounters the hard-case population because easy cases resolve before platform engagement. The engine must therefore implement the MAR-doctrine default (passive, action-gated) and unlock active search only when temperament-class, phase, and prior-conditioning state all permit it.

### Calibration Numbers

| Sighting / Bayesian parameter | Value | Confidence |
|---|---|---|
| λ trail camera (timestamped image) | 0.95 | high |
| λ owner-personal sighting (vetted) | 0.75 | medium |
| λ clear daylight eyewitness, 4-field intake, named contact | 0.70 | medium |
| λ brief or uncertain eyewitness | 0.35 | medium |
| λ night eyewitness | 0.30 | low-medium |
| λ secondhand report | 0.25 | medium |
| λ crowd-degraded or mass-broadcast | 0.20 | medium |
| Minimum λ for posterior update | 0.20 | medium |
| Minimum λ for trap deployment | 0.95 (camera-confirmed regular visits) | high |
| Minimum λ for active human response (gregarious) | 0.70 within 30 min | medium |
| Camera-station deployment max time after sighting (fearful) | ≤4 hours | high |
| Trap-deployment camera-confirmation requirement | 2 consecutive days of feeding | high |
| Pre-mapping radius before sightings arrive | 2 miles from IPP | high |
| Direction-of-travel required for high-λ classification | Yes | high |
| Markov diffusion step | 12 hours | medium |
| Cell grid resolution (rural Algarve) | 50 m | medium |
| Eyewitness position-error radius, daylight | 50–100 m | low-medium |
| Eyewitness position-error radius, night | 300–500 m | low-medium |
| 12h posterior radius (galgo prey-triggered) | 5–10 km along direction-of-travel | medium |
| 12h posterior radius (podenco active prey-drive) | 5–15 km radial scrubland-biased | medium |
| 12h posterior radius (settled survival-mode) | <1 km from known feeding station | medium |
| Crowd-displacement quantum (Winnie) | 7 mi in 1 hr | high (case study) |
| Princess Borzoi outcome | fatal vehicle strike after multi-state displacement | high (case study) |
| SARBayes MapScore baseline | 0.78–0.81 | high |

### Knowledge Gaps

No published study has calibrated dog-specific civilian sighting reliability; the λ values are reasoned from adjacent domains, not measured. No published study on civilian-observer dog identification accuracy adapts forensic-psychology eyewitness research to dog contexts. The displacement-vector model after a crowd event has only one quantified anchor (Winnie 7 mi/1 hr) — no distribution of Δ vectors by crowd intensity, terrain, or breed exists. Camera-confirmation latency in rural Algarve terrain is unmeasured; if average time from camera deployment to first confirmed visit exceeds 48 hours, the camera-first gate may need a parallel passive-approach exception. Sighting-quality differences between trained MAR volunteers and civilian observers are not modeled. The Koopman search detection function (Probability of Detection as a function of sweep width and lateral range) has not been adapted for lost-dog camera/scent-station deployment, leaving the formal link between sensor deployment and Bayesian probability-of-detection updating unspecified. Bayesian update under conflicting sightings (two simultaneous sightings 5 km apart) is not formally specified. The reliability premium for trained-MAR vs. untrained civilian observers is unquantified. HARTT's 70–80% within-1-mile heuristic is internally inconsistent across HARTT materials and presented without sample size or methodology.

### Practical Encoding

The sighting layer implements a **three-layer Bayesian architecture** with strict separation between belief and action:

**Layer 1 — Forward prior (Markov diffusion from IPP, category-conditioned).** Initial prior at Day 0 is the population 1-mile circle for gregarious cases; expanded long-tail distribution for hard-case categories (galgo, podenco prey-drive, blind-panic). Transition matrix encodes terrain preferences (scrubland-biased for podenco, road-following for toy breeds, last-known-prey-location anchoring for galgo when prey-triggered).

**Layer 2 — Bayesian belief update (always-on for any λ ≥ 0.20).**

```python
def update_posterior(prior_distribution, sighting):
    """Bayesian update — always runs, regardless of action gate."""
    if sighting.lambda_weight < 0.20:
        return prior_distribution
    likelihood = build_likelihood_function(
        center=sighting.location,
        sigma_m=position_error_radius(sighting),
        lambda_weight=sighting.lambda_weight,
    )
    return bayes_update(prior_distribution, likelihood)
```

Width of likelihood depends on λ: camera (λ=0.95) updates a tight neighborhood; uncertain eyewitness (λ=0.35) updates a broader radius (300–500 m). Direction-of-travel data biases next-timestep diffusion. Below λ=0.20 the sighting is noise and ignored.

**Layer 3 — Action gate (separate from belief layer, temperament-conditional).**

```python
def action_gate(case, sighting):
    """What response does this sighting warrant?"""
    # Hard prohibition: fearful dogs never get crowd response
    if (case.temperament in ("xenophobic", "trauma_history")
        or case.phase == "phase_2_survival"
        or case.breed == "galgo"
        or (case.breed == "podenco" and case.escape_trigger != "opportunistic")):
        return Action(
            broadcast="private_coordinator_only",
            responder_count=1,
            response_type="camera_station_within_4h",
            crowd_response_blocked=True,
        )
    # Gregarious + phase 1 + dog already with finder
    if (case.temperament == "gregarious"
        and case.phase == "phase_1_acute"
        and sighting.minutes_ago < 30
        and sighting.dog_stationary_with_finder):
        return Action(
            broadcast="semi_public_calm_protocol_volunteers",
            responder_count_max=3,
            response_type="single_calm_approach",
            crowd_response_blocked=False,
        )
    # Default: private gate, single responder, camera station
    return Action(
        broadcast="private_coordinator_only",
        responder_count=1,
        response_type="camera_station",
        crowd_response_blocked=True,
    )

def trap_deployment_eligible(case):
    return (
        case.camera_confirmed_visits >= 2
        and case.consecutive_feeding_days >= 2
        and case.landowner_permission_obtained
        and case.responder_assigned
    )
```

**Three encoding principles:**

1. **Belief always updates; action is gated.** The posterior incorporates every λ ≥ 0.20 sighting; action is taken only when temperament-gate permits.
2. **Camera-first is the universal safe response.** Camera-station deployment is the only response that is safe for any temperament, phase, or breed. Trap deployment requires camera-confirmed regular visits — never an eyewitness alone.
3. **Direction-of-travel data is the most valuable single field.** Weight it highly in posterior diffusion; it converts a point sighting into a vector sighting, which has materially higher information content for predicting next location.

Public sighting broadcast is a hard-off for any dog classified as xenophobic, trauma-history, galgo (any trigger), prey-driven podenco, or any dog in Phase 2+. This single gate is the highest-leverage piece of code in the engine because its failure mode is documented fatality.

---

## 4. Fear Escalation Dynamics

### Key Empirical Findings

Fear escalation in lost dogs is the dominant pathway to recovery failure and death — and Nona's primary product, properly understood, is preventing that escalation rather than locating dogs that have already entered it. Lost Dogs of America, drawing on thousands of cases over 13 years, identifies the top three causes of death among lost dogs as vehicle strike, train strike, and drowning, and attributes all three directly to search pressure pushing dogs into traffic, rail corridors, or water hazards: "Lost dogs that are being pressured will stay in 'panic' mode and will make very poor decisions, whereas lost dogs who aren't being pursued or pressured will make very wise decisions and may survive indefinitely" [[never-follow-chase-or-pressure-a-lost-dog-lost-dogs-of-america]]. Search pressure is the leading proximate risk factor for death.

**The three documented triggers for blind-panic / evasion-mode onset.** The MAR framework identifies three primary triggers, each producing immediate survival mode without the gradual phase progression seen in opportunistic-escape cases [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]]:

1. **Xenophobic temperament** (innate or trauma-conditioned). Dogs with baseline fear of strangers enter survival mode immediately upon loss. The galgo population is the paradigm case — Normando 2024 establishes the population-level shift, and SOS Galgos documents the individual-level mechanism.
2. **Loud-noise event** (fireworks, thunder, gunfire). A dog escaping during a fireworks event "will quickly go into survival mode — avoiding all humans, even their owners" [[lost-dog-syndrome-understanding-your-dogs-survival-behaviors-holiday-barn]]. Mechanism: acoustic trauma plus immediate sympathetic activation; Phase 1 cooperative window collapses to minutes. Algarve summer feast fireworks are a high-risk regional trigger.
3. **Traumatic incident** (vehicle accident, explosion, predator encounter). Direct trauma during or immediately preceding loss bypasses gradual progression and produces immediate flight-locked behavior.

**The adrenaline-conditioning mechanism for the never-call / never-chase rule.** This is the most mechanistically detailed finding in the fear-escalation locus. When a panicked dog is approached or called by anyone — including the owner during flight — the flood of adrenaline and cortisol coexists with intact associative learning, forming a Pavlovian pairing between the trigger (calling, whistling, clapping, approaching) and the flight response. Once established, the trigger reliably produces the conditioned response, even when the owner later attempts to call the dog. Named MAR cases document the pattern explicitly: Lucy (Case 10-264, Boston Terrier), Lacey (Case 10-267, Pomeranian), KoKo — owners called the dog at first sighting, the dog bolted; at second sighting the owner called again, the dog bolted farther; the pattern stabilized as "calling = flight trigger" [[never-call-a-lost-dog-missing-animal-response-network]] [[dont-call-your-dog-missing-animal-response-network]]. The Lucy case resolved in 4 days through neon posters plus strict no-calling protocol; a neighbor's failed-call was the conditioning event. The Lacey case resolved when the owner sat down and sang Elvis songs — a non-conditioned sound signature unique to the owner — rather than calling the dog's name. The mechanism is consistent with mainstream associative-learning theory (classical conditioning of a stimulus-response pair during high-arousal events is among the most robust findings in behavioral neuroscience). It is not RCT-validated for ethical reasons, but convergence across MAR doctrine, named cases, and physiology produces medium-high confidence.

**The olfactory-shutdown mechanism during peak cortisol.** A compatible second mechanism: "the olfactory portion of a dog's brain closes down during the 'fight or flight' process and a panicked dog likely won't recognize their guardian's scent" [[what-you-dont-know-about-lost-pets-can-hurt-them]]. This is biologically plausible — sympathetic activation does redirect cerebral blood flow away from olfactory processing toward visual and motor systems — though the specific "shutdown" claim is not directly supported by canine neuroimaging in this corpus. Treat it as a practitioner summary of a real phenomenon (food lures and scent items fail during peak arousal) with the precise mechanism uncertain.

**The predator-mimicry mechanism.** A frightened dog interprets direct eye contact, straight-line approach, and upright human posture as predator-stalking behavior [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]]. The counter-protocol is peripheral gaze, oblique approach, and crouching. Mechanism consistent with comparative ethology — canid predators do approach prey with straight-line stalking and visual fixation. High confidence on direction; medium on protocol parameters.

**The freeze-vs-flight distinction by breed.** Greyhound rescue literature documents the 4F stress response (Fidget/Freeze/Flight/Fight) and notes that freeze is "characteristic in greyhounds" — recoverable because the dog is visible and not actively moving [[2-fear-and-anxiety-greyhounds-as-pets]]. Galgo rescue literature documents flight-dominant responses to the same internal state. This matters operationally: a freeze response makes the dog catchable in place; a flight response makes the dog unreachable. The transition from cooperative to evasion mode in flight-dominant breeds is a transition from "approachable" to "uncatchable" — the dog does not pause in a freeze state where capture is possible.

**The crowd-displacement death pathway and the familiar-stimulus paradox.** Buddha Dog documents a counterintuitive but consequential pattern: in survival mode, familiar sights and smells — including the owner's voice or family car — can drive the dog OUT of a territory, because the dog associates "familiar" with "captured / pressured" rather than "safe" [[survival-mode-buddha-dog-rescue-recovery]]. This is the strongest single argument against owner-present searching in Phase 2: owner presence at a known sighting location can produce territory abandonment.

**Approachable vs. evasion behavioral signals.** The corpus identifies clear behavioral markers observable at distance [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]] [[lost-dog-behavior-pet-fbi-pets-found-by-internet]]:

- **Approachable signals:** neutral or forward ear position, relaxed/loose tail, sniffing toward observer, body weight forward, head lowered to sniff toward observer, brief eye contact, lip-lick or yawn (calming signals per Rugaas).
- **Evasion signals:** ears flattened back, tail tucked, body weight shifted to hindquarters, fixed stare at escape route, dilated pupils, stiff posture, all four feet planted (the sighthound pre-flight freeze).

**The three-zone approach geometry.** When a dog is sighted in cooperative or marginal-cooperative state, Pet FBI's three-zone framework defines: Awareness Zone (dog detects human, no posture change); Alert Zone (posture change, ready to flee); Action Zone (threshold for bolting) [[lost-dog-behavior-pet-fbi-pets-found-by-internet]]. The approach rule is to remain in the Awareness Zone and let the dog choose to approach, with 45-degree angled positioning rather than direct frontal approach. Distances are case-specific (Awareness may be 50 m for a relaxed shy dog and 200+ m for a survival-mode galgo); the engine encodes the geometric principle, not fixed numbers.

### Calibration Numbers

| Fear-dynamics parameter | Value | Confidence |
|---|---|---|
| Xenophobic evasion onset | 0–6 h | medium-high |
| Blind-panic evasion onset | 0–30 min | high |
| Adrenaline-conditioning threshold | 1–2 failed approaches | medium-high |
| Olfactory shutdown duration during acute peak | ~1–6 h episodic | medium |
| Cortisol acute peak window | days 1–3 | high |
| Top death-cause #1 | vehicle strike | high |
| Top death-cause #2 | train strike | high |
| Top death-cause #3 | drowning | high |
| Probability of flight response in survival-mode | ≥95% | medium |
| Crowd-displacement quantum (Winnie) | 7 mi / 1 hr | high (case study) |
| Princess Borzoi outcome | fatal vehicle strike, multi-state | high (case study) |
| Freeze response precedes flight in sighthounds | 0.85 likelihood | medium |
| Silence Factor indicates survival mode | True | high |
| Nocturnal-activity shift indicates survival mode | True | high |
| Owner-familiar-stimulus negative association in survival mode | plausible | medium |
| Name-conditioning reversibility | unknown — assume permanent | medium |
| Approach-zone geometry | 45° offset, never head-on | high |

### Knowledge Gaps

No controlled experimental test of the never-chase rule exists, and an ethical RCT is unlikely. The evidence base is convergent practitioner case-series plus mechanistic plausibility. The exact threshold for "active searching becomes counterproductive" is unquantified — Lord 2007's neighborhood-search recovery dominance is for gregarious-dominated populations and does not stratify by temperament. The probability distribution of survival-mode onset timing is poorly characterized — Buddha Dog's "50–99% chance of behavioral regression" is a range, not a defined distribution. Olfactory shutdown is mechanistically asserted but not directly measured in lost dogs. The recoverability gradient within evasion mode is unknown: some Phase 2 dogs can be slowly habituated to a feeding station; others remain unrecoverable, and the predictive factors are not characterized. Conditioning extinction timelines are unknown — once "calling = flight" is established, can it be extinguished, and over what timescale? The interaction between trauma baseline (galgo) and acute-arousal conditioning is mechanistically plausible but unmeasured. The dose-response curve for crowd-size vs. displacement-distance has only single-point anchors. Algarve-summer heat interaction with fear escalation is unmeasured — dehydration likely lowers tolerance for additional stress, but no data quantifies this.

### Practical Encoding

Fear escalation is modeled as a **monotonic state machine** with three trigger types and three conditioning events. The default initial state for any dog is *unconditioned*. The state advances irreversibly:

- *Unconditioned* → *adrenaline-primed* when any of the three blind-panic triggers (xenophobic baseline, loud-noise event, traumatic incident) is reported at intake.
- *Adrenaline-primed* → *name-conditioned* when any prior failed approach attempt is logged where the dog's name was called during the dog's flight. Treated as functionally irreversible by the engine, with explicit recognition that practitioner anecdote supports partial reversibility via non-conditioned signal substitution (the Lacey/Elvis pattern).
- *Name-conditioned* → *crowd-conditioned* when any crowd-convergence event is logged at any sighting. This is the worst state — recovery requires camera-station-only protocol regardless of operator identity.

**Decision matrix (temperament × phase → search intensity and broadcast permission):**

| Temperament \ Phase | Phase 1 (0–72h) | Phase 2 (72h–7d) | Phase 3 (7d+) |
|---|---|---|---|
| Gregarious | Owner direct approach + neighborhood search OK; sighting broadcast permitted | Passive lure primary; camera station; coordinator-only broadcast | Camera/trap only; coordinator-only |
| Aloof | Calming-signals approach; single calm responder | Camera station + passive lure; coordinator-only | Camera/trap only; coordinator-only |
| Xenophobic / trauma-baseline | Camera station within 4h; no calling; coordinator-only | Camera + trap; no human approach; coordinator-only | Camera/trap; conspecific lure if available; coordinator-only |

**Hard prohibitions (action-gate level).** Across all dogs, the engine forbids: calling the dog's name by strangers; crowd response to any sighting of an xenophobic/trauma-baseline/sighthound/post-Phase-1 dog; direct frontal approach to xenophobic or any Phase 2+ dog; eye contact at close range with any evasion-mode dog; whistling or clapping at any dog with prior failed-approach events. Running toward a dog is absolutely prohibited under all conditions — the biological chase response overrides any recognition the dog might otherwise have. Broadcasting sighting coordinates on social media is prohibited for galgo, prey-driven podenco, xenophobic, trauma-history, or any Phase 2+ dog.

**Required positive actions.** Angled 45-degree approach in all marginal-cooperative cases; crouch or sit posture in all approach attempts; peripheral gaze; food dropped passively without offer; silent observation in all survival-mode cases; camera station first in all Phase 2+ sightings.

**Behavioral-signal triage at sighting.** The engine requires the operator (or AI assistant) to classify dog posture from the sighting description before any approach is authorized. With asymmetric cost as the gating principle, ambiguous signals default to evasion:

```python
def classify_fear_state(observed_signals):
    flight = sum(weight[s] for s in observed if s in FLIGHT_SIGNALS)
    approach = sum(weight[s] for s in observed if s in APPROACH_SIGNALS)
    if flight - approach > 0.5:    return "evasion"
    elif approach - flight > 0.5:  return "approachable"
    else:                          return "ambiguous_default_to_evasion"
```

**The owner-warning surface is one of the most important UI deliverables.** The system issues structured, evidence-cited warnings at intake that the owner must acknowledge: "Do not call your dog's name. Calling can become a conditioned flight trigger — documented in MAR cases Lucy and Lacey. The mechanism is adrenaline conditioning, and once established, the trigger fires for your voice as well." Each prohibition ships with a specific alternative action, because telling an anxious owner "don't search" without giving them a productive alternative produces non-compliance. Approved alternatives: set up a feeding station; distribute neon flyers without revealing sighting coordinates; file a coordinator-only sighting report; if approach is permitted (gregarious + Phase 1 + visible relaxed body language), execute the step-by-step protocol — get low, look sideways, drop food, wait 45 minutes minimum, abort on freeze.

### Forward Implications

Three forward-looking implications shape Nona's design beyond the immediate calibration. First, the engine's priors should themselves age: a dog's stranger-fear probability score should drift toward higher values over phase progression (cortisol-driven entrenchment), with rate of drift conditioned on escape trigger and temperament. This is a Bayesian belief decay where each elapsed day without a high-λ cooperative-behavior observation increases the conditional probability of evasion mode. Second, Nona's own operational data is the highest-value research opportunity in the entire problem space — the published literature contains no controlled lost-dog phase-transition timing, no breed-stratified phase durations, no calibrated dog sighting reliability, and no Algarve-specific population data. A platform that structures intake fields, sighting records with operator-classified behavioral signals, and recovery outcomes will become, within 2–3 years, the world's largest validated dataset on lost-dog behavior. Build the engine to be parameterizable; log every case outcome against the prior; refit quarterly once 50+ cases per breed × trigger combination accumulate. Third, the Algarve operational context likely shifts the population calibration meaningfully away from the Dallas (Kremer) and Ohio (Lord) urban-suburban baselines that dominate the published literature: distance priors will likely extend further (sparse human encounters mean fewer pickup events); phase transitions may extend longer for gregarious dogs (fewer pursuit triggers); heat stress will force daytime hiding for all temperaments, confounding the "daytime hiding = survival mode" classifier. Nona's first 100 cases should be treated as calibration data, with explicit logging of weather conditions, terrain type, and human density at loss point.

The platform's primary product is not "finding lost dogs" but **preventing the fear escalation that turns recoverable dogs into permanently lost dogs**. Every design decision — intake question phrasing, sighting-form fields, push-notification copy, owner coaching scripts, volunteer routing rules — should be evaluated against whether it reduces or increases the probability of crowd convergence, name-calling during flight, or unauthorized owner pursuit. An effective Algarve deployment will route well-meaning bystander energy *away* from the search area and *into* the disciplined passive protocol (food stations, cameras, traps, magnet dogs, conspecific lures) that the evidence base supports. The galgo and podenco populations of the Algarve, with their elevated trauma baselines and prey-drive ranging respectively, stand to benefit disproportionately because they are precisely the populations for which the conventional active-search default is most lethal.
