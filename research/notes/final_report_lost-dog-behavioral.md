---
title: Untitled
tags:
- lost-dog-behavioral
- dog-movement-algarve
- lost-dog
- survival-mode
- kat-albrecht
created: '2026-05-28T09:28:53.394138Z'
updated: '2026-05-28T09:28:54.492986Z'
status: review
type: note
deprecated: false
summary: Nona's behavioral engine should be built as a four-axis probabilistic system
  whose inputs are time-elapsed since loss...
---

# Probabilistic Behavioral Engine for Lost-Dog Rescue — Specification

## Executive Summary

Nona's behavioral engine should be built as a four-axis probabilistic system whose inputs are time-elapsed since loss, breed/temperament category, escape-trigger type, and accumulated sighting history. Its outputs are two architecturally decoupled layers: a continuous spatial belief map that updates from every credible sighting, and a discrete action gate that authorizes (or forbids) specific response behaviors based on temperament, phase, and prior-conditioning state. The dominant cause of recovery failure is fear escalation under search pressure — an asymmetric error where misclassifying a fearful dog as gregarious produces fatal crowd-driven displacement, while misclassifying a gregarious dog as fearful forgoes the neighborhood-search channel that produces ~49% of recoveries in the general population (Weiss 2012) and can push the dog past the 72h cooperative window — materially suboptimal, but recoverable, rather than fatal. That asymmetry forces the architecture: belief always updates, action is gated, breed governs the gate at initialization (when no individual signals are available) but should yield aggressively to individual sighting evidence as it arrives — and on the agonistic-threshold dimension specifically, which governs flight behavior, Morrill 2022 shows breed is *least* predictive, so individual evidence should override the breed prior more aggressively on that dimension than on others [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]] [[never-follow-chase-or-pressure-a-lost-dog-lost-dogs-of-america]].

The strongest quantitative anchors are Kremer 2021's Dallas shelter analysis (70% of returned-to-owner strays within 1 mile of home, 42% within 400 feet, n=30,609) [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]]; Lord 2007's median recovery time of 2 days with a 0.5–21 day range across 187 Ohio dogs [[lost-pet-statistics-lost-pet-research-and-recovery]]; Weiss 2012's 93% (86–97% CI) all-cause recovery rate across 1,015 US households [[frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc]]; and Hennessy's three-phase cortisol arc from shelter research (days 1–3 peak, 4–9 declining, 9+ plateau) as the only direct physiological anchor for the practitioner-named phase boundaries [[sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo]]. These describe the population-mean lost dog — and Nona will not encounter that dog at proportional rates. Easy gregarious cases self-resolve before professional rescue is engaged; the platform's actual caseload is dominated by the hard tail (trauma-baseline galgos, prey-driven podencos, blind-panic escapes, repeated failed-approach histories) for which population priors systematically misclassify.

For the Algarve, the engine must hard-code two dual breed priors. The galgo prior is structurally dual: a chase-displacement prior from greyhound prey-fixation research (OR=8.34 for last-known-location fixation when prey stimulus disappears) governing *where* the dog is likely to be, and an approach-avoidance prior from galgo-specific trauma data (significantly elevated stranger-fear, p=0.009, Normando et al. 2024) governing *how* the dog can be recovered [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]] [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]]. The podenco prior is built around triple-sensory active search: McLennan's predatory motor sequence data shows Hunt 69%, Chase 69%, Consume 8% — prey pursuit is intrinsically motivated, food lures are unreliable during active arousal, and expanding-ellipse movement of 5–15 km in 24–48 hours across scrubland defines the search area [[prey-drive-in-podencos]] [[arousal-and-predatory-motor-patterns]].

---

## 1. Temporal Behavioral Phases — Empirical Data

### Key Empirical Findings

No peer-reviewed dog-specific study measures behavioral phase transitions. This is the single most important finding of this section and determines what kind of engine Nona can defensibly build. The IAABC review by Kat Albrecht is unambiguous: "no one had ever studied lost pet behaviors, and there was no data available on the typical distances that lost dogs or lost cats travel" [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]]. The operating phase model — Phase 1 acute panic, Phase 2 survival, Phase 3 entrenched — is a practitioner consensus from Missing Animal Response (MAR), Lost Dogs of America, Lost Dogs Illinois, K9s On Call, and Buddha Dog Rescue, triangulated against four independent evidence streams [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]].

The physiological stream comes from Michael Hennessy's shelter-stress research (SPARCS 2015): cortisol is roughly three times higher on Day 1 than at home, declines through Days 4–9, then plateaus from Day 9 onward [[sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo]]. This is shelter data, not lost-dog data, but the HPA-axis mechanism transfers: a dog isolated from its attachment figure in an unfamiliar environment shows the same descending curve regardless of whether the environment is a kennel or a scrubland thicket. The 72-hour Phase 1 boundary sits inside the descending limb of the cortisol curve — exactly where the dog is shifting from acute HPA activation toward sustained survival mode. The mechanism bridge from acute peak (hours) to chronic survival-mode behavior (days) is neuroplastic, not purely hormonal: plasma cortisol half-life in dogs is roughly 60–90 minutes (acute peaks resolving in 4–6 hours), but fear conditioning via amygdala-hippocampal imprinting occurs within minutes of the stressor and is durable on a days-to-weeks timescale. Chronic HPA-axis activation beyond 24–48 hours produces qualitative neuroplastic changes, not just quantitative hormonal elevation — which is what anchors the 72h Phase 1 ceiling in a real mechanism rather than a curve-shape transfer from shelter data [[sparcs-2015-reducing-stress-of-dogs-in-shelters-with-michael-hennessy-phd-the-mo]].

The cat-curve analog comes from Huang 2018 (n=1,210 missing cats, peer-reviewed competing-risks survival analysis): 34% found alive by day 7, ~50% by day 30, near-plateau after day 61. Transfer to dogs is structural, not numeric — dogs recover roughly 3× faster (shelter reclaim rates 26–40% for dogs vs. 2–4% for cats), so the cat day-7 inflection likely corresponds to a dog day-3 to day-5 inflection. What transfers is the curve shape — steep early decline, urgency cliff in the first week, long-tail flattening.

Direct quantitative anchors for dogs come from Lord 2007 (n=187 Ohio): median recovery 2 days; 71% within 1 mile, 14% within 1–5 miles, 7% beyond 5 miles, 8% returned home unassisted [[lost-pet-statistics-lost-pet-research-and-recovery]]. Kremer 2021 (n=30,609 Dallas) establishes that 91% of dogs reclaimed by owners are reclaimed within the 5-day mandatory hold; this is a policy artifact, but its alignment with the practitioner 3–4 day behavioral threshold is not coincidence [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]]. Kremer 2021 also documents the single largest intervention-level effect in the corpus: microchipped dogs were returned to owner at 71% vs. 39% for unchipped dogs (n=13,794) — a ~32-point gap that dominates any other single recovery-method effect. The operational implication is that chip status branches the urgency-decay function at intake: chipped Algarve dogs have a categorically different recovery curve (high probability of municipal-canil-mediated return inside the 5-day hold) than unchipped ones (where the curve is dominated by direct field recovery). Weiss 2012 (ASPCA-affiliated, n=1,015 US households) provides the all-cause recovery anchor of 93% (86–97% CI), with recovery method breakdown 49% neighborhood search, 20% spontaneous return, 15% ID/chip, 6% shelter [[frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc]]. Lord 2007's recovery-method breakdown is distinct and complementary: calling or visiting animal agencies drove 34.8% of recoveries and neighborhood signs 15.2% — both of which are gregarious-selected channels by construction (the dog had to be picked up and held by an agency, or seen by a stranger reading a sign). Foster 2025's HASS synthesis of Fi GPS-collar data finds that 95% of dogs that wander beyond safe zones travel at most 1.8 miles (~2 km), with average recovery distance just 700 feet [[most-lost-dogs-are-just-around-the-corner-literally-hass]].

The practitioner case-series stream converges on the 3–4 day cliff. Lost Dogs Illinois, drawing on 3,000+ recoveries over 13 years: "after 3–4 days, if your dog has been separated from you and is in flight/survivor mode, from their perspective they don't have an owner anymore. Anyone who approaches them is a stranger, including you" [[lost-dog-behavior-tips-lost-dogs-illinois]]. Buddha Dog frames survival-mode probability as 50–75–90–99% depending on history and notes that, once entered, "very often EVERY human is viewed as a predator – even the one that has fed, loved, walked, bathed and pampered them for the last 2-4-12 years" [[survival-mode-buddha-dog-rescue-recovery]]. The Phase 2 behavioral signature is convergent: nocturnal activity ("more likely to be moving at night... when they stop moving, they will usually hunker down for the day"), the "Silence Factor" (cessation of barking), and pattern formation around reliable food, water, and shelter that enables eventual trap deployment [[understanding-survival-mode-behavior-in-lost-dogs-k9s-on-call-missing-pet-servic]].

Recovery percentages by phase, in the gregarious-dominated general population, derive from the convergence of these anchors: Lord 2007's 2-day median plus Kremer 2021's 91% reclaim by day 5 plus Weiss 2012's 93% overall recovery imply roughly 60–70% of all-cause recoveries occur in Phase 1 (0–72h), 20–25% in Phase 2 (72h–7d), and 5–15% in Phase 3+ (7d+). The Huang cat-curve transfer shape is consistent (steep early decline, urgency cliff in the first week, long-tail flattening), with dogs running ~3× faster than cats. These bands are population-means for the gregarious-dominated easy-case population; for Nona's actual caseload (hard-case-shifted), recovery is mass-shifted later — proportionally more recoveries fall in P2/P3, and the Phase 1 percentage drops correspondingly. The bands should be treated as ceilings for the gregarious mix and refit per Nona case-mix once 100+ outcomes accumulate.

The four-stream triangulation describes the *population mean* phase boundary. The cross-stream analysis forces a sharper finding: this mean conceals a bimodal distribution. For gregarious dogs with opportunistic escapes (gate left open, slipped leash), Phase 1 *behavior* (cooperative, name-responsive) can persist past the formal 72h phase boundary, but the engine treats 72h as the threshold at which caution escalates regardless — Lord 2007's 2-day median supports the formal boundary even when individual cases extend it. For blind-panic triggers — fireworks, gunfire, vehicle accident — or xenophobic temperaments, Phase 1 effective duration collapses to 0–24 hours [[lost-dog-syndrome-understanding-your-dogs-survival-behaviors-holiday-barn]]. The MAR taxonomy distinguishes three temperaments (Gregarious, Aloof, Xenophobic) and three escape causes (Opportunistic Journey, Wanderlust, Blind Panic); the intersection of xenophobic temperament with blind-panic trigger produces instant Phase 2 entry, near-zero approach probability, long-distance displacement, and elevated vehicle-strike mortality. The 2-day median is the centroid of a bimodal mixture, not a property of any individual dog Nona will model.

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
| RTO rate, chipped vs unchipped (Kremer 2021, n=13,794) | 71% vs 39% | high |
| Median recovery time (Lord 2007) | 2 days (range 0.5–21d) | high |
| All-cause recovery rate (Weiss 2012) | 93% (CI 86–97%) | high |
| Recovery curve plateau (Huang cat analog) | day 60+ | medium (transfer) |
| Cortisol acute peak window (Hennessy) | days 1–3 | high |
| Survival-mode onset probability (gregarious baseline, no history) | 0.50 | medium |
| Survival-mode onset probability (mild-aloof / unknown default) | 0.75 | low-medium |
| Survival-mode onset probability (known fearful history) | 0.90 | medium |
| Survival-mode onset probability (trauma / puppy-mill / abused-rescue) | 0.99 | medium |
| Survival-mode onset probability (xenophobic temperament) | 0.95–0.99 | medium |
| Nocturnal-activity shift threshold | ~day 2 | medium |
| Population within 1 mile of home (Kremer) | 70% | high |
| Population within 400 feet (Kremer) | 42% | high |
| 95th percentile travel distance (Fi GPS) | 1.8 mi (~2 km) | high |
| Hard-case mixed-breed pickup distance (Albrecht 1999) | ~14 miles | medium |
| Rural/low-density distance modifier | 1.5–2.5 mi (vs. 0–0.5 dense urban) | high |
| Recovery-by-phase (gregarious-dominated) | P1 60–70%, P2 20–25%, P3 5–15% | medium |

### Knowledge Gaps

Albrecht 2002 — the named foundational MAR text — was not retrievable in the current vault; findings here are derived from the Kat Albrecht / IAABC 2024 review and the broader MAR practitioner literature (1997–present) that descends from Albrecht's foundational work [[about-kat-albrecht-kat-albrecht]] [[the-science-of-finding-lost-pets-iaabc-foundation-journal]]. No controlled longitudinal study of cortisol × behavior × time exists for lost dogs. Hennessy's data is shelter-confined. Lord 2007's 2-day median is from a single Ohio county and is survivorship-biased — the right tail of dogs that took weeks or never recovered is underrepresented. The Huang 2018 transfer is structural only; no equivalent peer-reviewed temporal recovery curve exists for dogs. The Algarve operational context has no published telemetry data: rural sparse population, hot summers forcing daytime hiding for all temperaments, and Portuguese municipal canil hold periods that differ from the US 5-day cliff may all shift the urgency curve. Reversibility of Phase 2 — whether a settled survival-mode dog can be coaxed back to approach-tolerance via long passive feeding — is undocumented quantitatively, though MAR case narratives (Winnie, 69 days) suggest gradual partial reversal is possible. The fraction of dogs that never enter survival mode is unknown; Buddha Dog's "50–99%" is a range, not a point estimate. Onset time within a temperament category is genuinely variable: "very little correlation with previous behavior/life history" between known temperament and observed onset speed [[survival-mode-buddha-dog-rescue-recovery]].

### Practical Encoding

The phase classifier is a four-input function of `(hours_since_loss, breed_category, escape_trigger, temperament)` — not a pure time function. Trigger-conditional Phase 1 collapse is the load-bearing structural element:

```
phase(t, breed, trigger, temperament) =
    if breed == "galgo":                                    phase_1_cap = 0
    elif trigger == "prey_drive" and breed == "podenco":    phase_1_cap = 4
    elif trigger == "blind_panic" or temperament == "xenophobic":
                                                            phase_1_cap = 24
    else:                                                   phase_1_cap = 72

    if t < phase_1_cap:    return "phase_1_acute"
    elif t < 7d:           return "phase_2_survival"
    else:                  return "phase_3_entrenched"
```

The engine should expose the phase boundary as a confidence range, not a hard cutoff. A dog observed approaching a stranger at hour 48 has demonstrated Phase 1 behavior and the prior should update; a dog with no sightings 72 hours after a blind-panic loss should be treated as Phase 2 by default. Survival-mode onset probability — drawn from the per-temperament table — drives whether the action gate escalates regardless of elapsed time. Urgency weighting on alert prioritization peaks at Phase 2 (×1.4) before the shelter cliff and decays through Phase 3 (×0.7), where the only valid actions are passive feeding station, trail camera, and trap. Phase 3 cases are deprioritized in active-alert UI but never closed — the long tail demands persistent monitoring. The Algarve summer-heat modifier (ambient >30°C) shortens trap-monitoring intervals, prioritizes water-station co-deployment, and forces the engine to recognize that daytime hiding is universal in heat and cannot be used as a survival-mode classifier between June and September.

---

## 2. Breed-Specific Behavioral Priors

### Key Empirical Findings

The corpus's central tension lives here. Morrill et al. 2022 (*Science*, n=18,385 surveyed, n=2,155 genome-sequenced) is the strongest evidence against using breed as a behavioral prior: breed explains 9 ± 3% of behavioral variation in individuals, and "for less heritable, less breed-differentiated traits, like agonistic threshold (factor 5), which measures how easily a dog is provoked by frightening, uncomfortable, or annoying stimuli, breed is almost uninformative" [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]]. Behavioral GWAS loci (genome-wide association study sites linked to behavior) are not unusually differentiated across breeds (PBS z = −0.001, p = 0.224); only 332 of 16.7 million SNPs are exclusive to and fixed within any breed (0.002%); within every breed of ≥25 dogs, 67.2 ± 7.5% of individuals score within 1 standard deviation of the population mean on any behavioral factor. The agonistic threshold — the exact dimension that governs lost-dog flight behavior — is where breed is *least* predictive. Sixty-six percent of mixed-breed dogs carry ancestry (>5%) from four or more breeds; only 17% are two-breed mixes.

Normando et al. 2024 (n=410 rescue dogs, 198 galgos vs. 212 controls) is the strongest counter-evidence: galgos show "out of context fear of non-cohabiting adult people" at significantly higher prevalence than other rescue dogs (p=0.009, >1 in 5 galgos vs. effectively zero in controls) [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]]. Normando 2025 (n=768, C-BARQ — Canine Behavioral Assessment and Research Questionnaire) confirms within-sighthound differentiation: predatory drive differs significantly across sighthound breeds (p<0.001), while sighthounds as a group display "very low level of aggressive behaviour... combined with high predatory drive and a fair level of attachment/affection" [[behavioural-characteristics-of-sighthounds-an-exploratory-investigation-dog-beha]].

The resolution is scope, not contradiction. Morrill measures individual-level predictability — given this individual dog is a galgo, can I predict its agonistic threshold? Answer: no. Normando measures population-level group means — is the galgo population's mean stranger-fear distribution shifted compared to other rescue dog populations? Answer: yes, significantly. Both are right. The operational consequence is decisive: breed cannot predict an individual dog's stranger-fear score, but breed legitimately drives the default capture-strategy protocol before any individual signals arrive. Nona's intake stage has no individual signals; the group-level prior governs the action gate. Once individual signals accumulate, they dominate the probability score — but the action gate persists at the breed-derived default until high-confidence individual evidence overrides it.

**The galgo case requires two priors, not one.** This is the most consequential breed-specific finding in the report. Chase behavior and approach-avoidance behavior are governed by phylogenetically and neurobiologically distinct systems [[arousal-and-predatory-motor-patterns]]:

The chase / predatory motor sequence system is phylogenetically conserved across sighthounds. Sighthounds skip the Search phase entirely and react directly to prey stimuli — "sighthounds don't search, they react." Starling et al. 2020 found that when prey stimulus disappears (lure stops moving and goes silent on a straight track), greyhounds fixate on the last-known location at OR=8.34 (95% CI: 1.72–42.38, p=0.009) [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]]. Chase motivation is appetitive and self-reinforcing — wild canid hunt success rates of 5–13% and greyhound coursing capture rates of ~13% show the behavior is maintained without consumption. This transfers to galgo with high confidence in direction (galgos will fixate at prey-loss terminus) but appropriate humility on magnitude (wide CI, no galgo-specific empirical test).

The approach-avoidance / trauma-fear system does NOT transfer from English greyhound to Spanish galgo. English racing greyhounds show freeze-dominant responses to human approach — the 4F sequence (Fidget/Freeze/Flight/Fight) described in the Greyhounds as Pets NZ guide includes "frozen or stiff posture, pupils dilated, trembling, tense closed mouth, ears back, tail tucked, body hunched, all feet stuck to floor" — recoverable because the dog remains visible and not actively moving [[2-fear-and-anxiety-greyhounds-as-pets]]. Rescued galgos show flight-dominant responses: SOS Galgos and Galgos del Sol document 18+ individual profiles with hide-in-corner / active flight, "almost universal" maltreatment baseline, and recovery timelines of "weeks or sometimes months" before allowing human approach [[sos-galgos-adopt-a-survivor]] [[what-is-a-galgo-galgos-del-sol]]. The galgo's trauma baseline is environmental and developmental (galguero hunting practices, kennel conditions, systematic post-season abandonment) — not genetic — but at the population level it is overwhelmingly present, producing a categorically different behavioral profile from the racing-greyhound rescue population on which the 4F freeze model was built. The two systems must be encoded as independent priors; conflating them into a single "galgo prior" produces structurally miscalibrated estimates.

**Scent hounds actively home; the spatial prior is not pure diffusion.** Benediktová et al. 2020 (*eLife*, n=27 dogs, 622 trials) provides the corpus's strongest empirical GPS telemetry on canine homing: scent hounds return to handler via olfactory tracking on 59.4% of trials and via magnetic-compass scouting on 33.2% — both *active* homing strategies covering hundreds to thousands of meters per trial [[magnetic-alignment-enhances-homing-efficiency-of-hunting-dogs-elife]]. The operational implication: scent-hound movement after separation is not random diffusion from the Initial Planning Point; the spatial prior should encode a non-trivial backward-toward-home tendency. Albrecht 1999 (n=254, informal) further reports that within scent hounds, pointing breeds travel farther than retrieving breeds — relevant for Algarve perdigueiro português and English pointer cases where movement priors should default to the wider end of the 5–10 km range, and for spaniels/retrievers where they should default to the lower end [[what-we-need-to-learn-about-missing-dogs-iaabc-foundation-journal]].

**The podenco case is about predatory motor sequence, not stranger-fear.** McLennan's podenco predatory-motor data is the load-bearing breed-specific finding: Hunt 69%, Orient 69%, Eye 54%, Stalk 23%, Chase 69%, Grab-bite 69%, Possess 31%, Kill-bite 46%, Dissect 23%, Consume 8% [[prey-drive-in-podencos]]. The 8% Consume rate is the operational crux: predatory chase in podencos is appetitive and self-reinforcing without food terminus, which makes food lures unreliable during active arousal — "in high arousal states... dogs in high arousal refuse food — high-prey-drive sniffing RAISES arousal, does not calm" [[arousal-and-predatory-motor-patterns]]. The podenco is an explicit triple-sensory hunter (sight + scent + hearing) bred for endurance trotting (not sprint) across Mediterranean scrubland, with agility including tree climbing and 6-foot fence clearance [[about-podenco-dogs-hope-for-podencos]]. A lost podenco in prey-drive activation is not freezing or hiding; it is actively ranging across scrubland in an expanding multi-sensory search — scrubland-biased over open ground, with mechanistically inferred radius of 5–15 km in 24–48 hours (derived from predatory-motor sequence data [[prey-drive-in-podencos]], endurance physiology [[about-podenco-dogs-hope-for-podencos]], and arousal modeling [[arousal-and-predatory-motor-patterns]]; no GPS telemetry exists for lost podencos). No GPS telemetry exists; this is medium-confidence inference from predatory-motor data plus endurance physiology plus terrain ecology.

**The other breed categories — empirical thinness, encoded by function.** Scent hounds (with beagle as paradigm) display trail-following behavior — separation from handler triggers nose-down trail pursuit rather than panic flight, with recovery typically along the scent corridor in Phase 1 (Benediktová's 59% olfactory-tracking pattern). Toy breeds display hide-close survival behavior: median displacement under 1.2 km, recovery in dense vegetation, porches, drainage culverts, and crawlspaces near the loss point — intensive neighborhood canvassing in the first 24h is the dominant channel (Albrecht 1999 places toy breeds under 0.75 mile / 1.2 km). Herding breeds carry a noise-phobic flight-risk profile (working-line breeding for environmental sensitivity); thunderstorm and fireworks events produce disproportionate herding-breed loss spikes (practitioner consensus, no peer-reviewed breed-stratified data). Guardian breeds (mastiff, livestock-guardian dog) show territorial perimeter behavior — a lost LGD is more likely to remain near the property edge or attempt to return to territory than to range widely (practitioner consensus from breed-club literature; no peer-reviewed lost-dog data). Mixed-breed and unknown-ancestry dogs are the largest real-world population (Morrill 2022 documents 66% of mixed-breed dogs carry ancestry from four or more breeds at the >5% threshold) and are precisely the population where the breed prior is least informative; for this category, temperament-gating dominates and the action gate runs on owner-reported behavior history rather than ancestry. Outside of galgo, podenco, and toy breeds, breed-category recommendations rest on practitioner consensus and breed-function inference, not lost-dog-specific studies.

**The magnet-dog method is the primary alternative recovery protocol for galgos and arousal-suppressed dogs.** A magnet dog is a calm, friendly, conspecific-attracting familiar dog stationed at the feeding station or trap site to draw in a panicked stray whose food-response is suppressed by arousal. The mechanism is documented: the lost dog's social/play attention bypasses the predator-mimicry triggers that block human approach — "they get tunnel vision and never notice us because they're so focused on making eye contact with the magnet dog" [[snap-into-action-missing-animal-response-network]]. The Winnie 69-day recovery resolved via Phoebe, a named magnet dog; Kody is the canonical MAR magnet-dog example. Deployment trigger: feeding station has been visited without the dog entering a trap, or trauma-baseline breed shows no food-lure response. The magnet-dog channel and the food-lure channel are parallel two-track options — "we never know which bait a dog will respond to (food or other dogs)" — and a galgo case should run both in parallel where a magnet dog is available.

The interpretive takeaway: **breed is a capture-strategy prior, not primarily a probability prior**. A galgo intake should initialize passive-only capture protocols not because galgos are individually predictable but because the asymmetric cost of misclassifying a fearful galgo as gregarious (fatal crowd-displacement) vastly exceeds the cost of misclassifying a gregarious galgo as fearful (a few wasted hours of trap setup and a foregone neighborhood-search channel that, in the gregarious-dominated population, produces ~49% of recoveries — Weiss 2012). The asymmetry is real but is best described as "fatal vs. materially suboptimal," not "fatal vs. costless."

### Calibration Numbers

| Breed-prior parameter | Value | Confidence |
|---|---|---|
| Breed weight in probability score | ≤10% | high (Morrill) |
| Breed weight in action-gate selection | 100% (until individual signals override) | high (Normando + MAR) |
| Galgo stranger-approach default, day 1 | forbidden (passive-only); no numerical day-1 success rate published | low — analyst inference, no empirical source |
| Galgo passive-protocol minimum | 72h camera-station before any approach | high |
| Galgo full recovery timeline (trauma cases) | 4–12 weeks | medium |
| Galgo fence-clearance requirement | 1.8 m (6 ft) | high |
| Galgo chase-fixation odds ratio (transfer) | OR=8.34, CI 1.72–42.38 | medium |
| Galgo chase-terminus search radius | 1–3 km around prey-loss point | medium |
| Podenco Consume rate | 8% | high (McLennan) |
| Podenco Grab-bite rate | 69% | high (McLennan) |
| Podenco Kill-bite rate | 46% | high (McLennan) |
| Podenco Possess rate | 31% | high (McLennan) — caught prey may be guarded, complicating approach |
| Podenco food-lure effectiveness during active chase | ~10% | medium |
| Podenco food-lure effectiveness (settled) | ~75% | medium |
| Podenco lost-radius 24h (prey-drive escape) | 5–10 km | medium |
| Podenco lost-radius 48h (prey-drive escape) | 10–15 km | medium |
| Podenco terrain bias | scrubland > rocky > field > road | high |
| Toy breed maximum radius | <1.2 km (0.75 mi) | medium |
| Mixed-breed hard-case displacement (Albrecht 1999) | ~22.5 km (14 mi) | medium |
| Mixed-breed 4+ ancestry prevalence | 66% | high (Morrill) |

### Per-Category Operational Table

| Category | Movement radius (24–48h) | Approach default | Terrain preference | Capture protocol |
|---|---|---|---|---|
| Galgo | 1–3 km (prey-fixed); 5–10+ km (panic) | Forbidden direct approach | Path of least resistance; cover-seeking | Passive-only, conspecific lure, 72h+ camera-first |
| Podenco | 5–15 km (prey-drive); 2–5 km (default) | Forbidden during arousal | Mato scrubland, rocky cover | Passive scent-anchor + trap (post-settle), food only post-pattern |
| Sighthound other (whippet/lurcher/saluki) | 5–10 km if panicked | Caution; passive default | Open + cover mixed | Passive-first, conspecific lure if available |
| Scent hound — pointing (pointer, perdigueiro, setter) | 5–10+ km along scent trail; range biased to upper end (Albrecht 1999) | Open-cooperative if not panicked | Scent-trail biased | Active Phase 1 along trail; passive thereafter |
| Scent hound — retrieving (retriever, spaniel) | 2–5 km; range biased to lower end (Albrecht 1999) | Open-cooperative if not panicked | Scent-trail biased, closer-to-home recovery | Active Phase 1 along trail; passive thereafter |
| Toy breeds | <1.2 km | Owner-led OK | Hidden close to escape (porches, drainage, dense vegetation) | Intensive neighborhood search first 24h |
| Herding | 1–5 km (noise-phobic flight risk) | Calming-signals protocol | Open ground with cover access | Passive with calming-signal approach |
| Guardian (mastiff, LGD — livestock guardian dog) | Variable; may return to territory | Caution — may guard last-known location | Territorial perimeter | Territorial perimeter search, no chase |
| Mixed/unknown | Population baseline (1.8 km 95%ile) or hard-case (22.5 km) by signal | Temperament-gated | Variable | Temperament-gated default |

### Knowledge Gaps

No peer-reviewed controlled study has compared lost-dog recovery rate, distance, or method across breed types — this is itself a load-bearing finding. PubMed, Semantic Scholar, and major veterinary behavior journals were checked; no controlled breed-stratified lost-dog outcome study exists in the published literature. Albrecht 1999 (n=254, informal) is the only existing breed-type distance dataset and is the closest available data point. Herding and guardian-breed rows in the operational table above are inferred from breed function (noise-phobic flight risk; territorial perimeter behavior) rather than from any lost-dog-specific study; treat them as priors-of-last-resort that should yield to the first individual signals received. No GPS-telemetry study exists for lost galgos or lost podencos in Mediterranean scrubland; the radii above are mechanistic inferences. The podenco 5–15 km radius is derived from McLennan's predatory-motor sequence + endurance physiology + scrubland ecology with *zero* lost-podenco GPS telemetry; the depth-investigation confidence assessment puts this at 70%. If Nona's first ~20 recovered podencos show median displacement under 2 km in 48 hours, the encoded prior must be revised downward — the radius is a parameter to refit from operational data, not a hard prior. The Starling 2020 OR=8.34 transfer from English racing greyhounds to Spanish galgo is a phylogenetic inference with wide confidence interval. Normando 2024 does not provide numerical prevalence beyond ">1 in 5"; its comparison group ("other rescue dogs") is not broken out by sighthound vs. non-sighthound. An earlier draft of this report carried a "0.02 galgo stranger-approach day-1 success rate" with "high practitioner consensus" confidence — that number was a synthesizer inference with no underlying source and has been removed; the operational rule (passive-only default) does not depend on it. Normando 2025 does not include galgo español or podenco specifically. MacLean et al. 2019 (PNAS) — the strongest pro-breed-prior academic position — is paywalled in this corpus, so the upper bound on heritability of stranger-fear within sighthounds is not tightened. The Algarve galgo population may differ in trauma baseline from the Spanish-hunting-kennel population Normando sampled; rescued-as-pet galgos likely have lower stranger-fear priors than hunting-discarded individuals, but the local mix is unknown.

### Practical Encoding

The breed prior is implemented as a two-layer structure with explicit asymmetric weighting.

Layer 1 — Action-gate selector (100% breed-governed at initialization). This is a discrete protocol selector that determines which capture protocol initializes and which actions are prohibited:

```
action_gate(breed_category) = {
  galgo:              passive_only + conspecific_lure + camera_first + no_crowd_response
  podenco:            passive_lure + scent_anchor + wide_radius_camera_grid + no_crowd_response
  sighthound_other:   passive_first + last_known_anchor + no_crowd_response
  toy:                tight_radius_search + neighborhood_canvas + check_hiding_spots
  herding:            assume_xenophobic_default + passive_lure + low_noise_protocol
  guardian:           territorial_consideration + return_path_likely + no_chase
  scent_hound:        active_phase_1_along_scent_trail + passive_thereafter
  mixed/unknown:      temperament_gated + degrade_on_signal
}
```

Layer 2 — Probabilistic score (breed weight capped ≤10%). Breed contributes at most 10% to the stranger-fear probability score; owner-reported individual signals (stranger response history, prior loss events, history of fearfulness) and observed sighting behavior dominate. Capping breed at this ceiling is the operational expression of Morrill's 9% variance finding.

Galgo equipment specification: any temporary holding enclosure, trap pen, transport crate, or post-capture containment used in galgo recovery must have a minimum 1.8m (6 ft) enclosure height. Trap pens with shorter walls are documented escape risks — galgos are noted excellent jumpers, with 5-foot fences treated as the documented minimum and 6-foot as the operational standard.

Galgo intake-type modulation: the galgo action gate above is the maximum-trauma default (appropriate for galgos rescued from hunting/galguero contexts or with unknown history). A galgo identified by owner as "home-raised pet from puppy" or with ≥12 months stable home history and no prior fearful-sighting record should drop one tier to the `sighthound_other` protocol — still passive-first, but with a shorter camera-first window (24h) and conditional approach allowed once signals support it. The full 72h+ passive protocol applies only to galgos with unknown history, recent rescue, or any documented stranger-fear or trauma signal.

Three encoding principles govern the implementation:

1. **Asymmetric cost of errors gates the action layer.** A false-gregarious classification of a galgo that triggers crowd response can cause fatal displacement. A false-xenophobic classification of a gregarious mixed-breed only wastes trap deployment. The action gate defaults conservative when uncertain.
2. **Galgo requires two separate priors.** `galgo_spatial_prior` (WHERE — driven by greyhound chase data, OR≈8.34 fixation at prey-loss terminus) and `galgo_capture_prior` (HOW — galgo-specific, passive-only, 72h minimum, conspecific lure preferred) feed different model outputs and must never be conflated.
3. **High-λ observations override the breed prior probabilistically; the action gate persists.** A single low-λ sighting describing a galgo "running up to" a stranger updates the probability score (reducing stranger-fear estimate) but does NOT relax the action gate. Only camera-confirmed approach-and-accept behavior at λ ≥ 0.95 changes the action gate. This is the load-bearing safety architecture.

---

## 3. Bayesian Updating from Sightings

### Key Empirical Findings

The Bayesian update framework for lost dogs sits on three convergent mathematical frameworks from adjacent literature plus two load-bearing case studies. The frameworks (Lin & Goodrich 2010, Hashimoto et al. 2022, SARBayes) come from human Wilderness Search and Rescue (WiSAR — formal SAR methodology for lost persons in unstructured terrain); the case studies (Winnie, Princess Borzoi) come from MAR practitioner archives. The synthesis is a high-confidence architectural finding wrapped around medium-confidence calibration parameters.

Lin & Goodrich (2010) propose a Bayesian model that constructs a probability distribution map of likely lost-person location using terrain features, modeled as a first-order Markov transition matrix (a stochastic process where the next state depends only on the current state), "designed to be augmented by search and rescue workers to incorporate additional information" [[a-bayesian-approach-to-modeling-lost-person-behaviors-based-on-terrain-features]]. Hashimoto et al. 2022 (*Scientific Reports*) extend this to an agent-based model with six reorientation strategies as a probability mass function (Random Walk, Route Travel, Direction Travel, Stay Put, View-Enhancing, Backtrack) drawn i.i.d. each timestep, validated against 65 ISRID hiker incidents with 58.5% of held-out cases exceeding the 95th percentile of untrained distributions. Hashimoto explicitly does not include a sighting-update mechanism — the forward model generates the prior; the sighting-update layer must be built separately. For dogs, the taxonomy maps cleanly with one addition: a seventh "Scent Track" strategy weighted heavily for beagles and moderately for podencos. SARBayes provides empirical validation of probability-map quality via MapScore: ISRID Distance Ring model 0.78 (95% CI 0.74–0.82, n=376); Combined Distance+Watershed 0.81 (95% CI 0.77–0.84) [[sarbayes-bayesian-methods-for-wisar]]. A well-designed prior based on category × terrain features is materially better than random (which scores 0) and approaches the practical predictability ceiling.

**The action-gate architecture is the load-bearing innovation for dogs.** Human WiSAR Bayesian models can assume the subject's location is conditionally independent of the observation act — a lost hiker does not flee searchers. This independence assumption fails completely for fearful dogs. A sighting that triggers crowd response causes a displacement event: the dog moves from L_obs at time T to L_obs + Δ at T+Δ, where Δ is behaviorally determined and observed up to 7 miles in 1 hour (Winnie) and 200+ miles across multiple states (Princess Borzoi). The Bayesian model that ignores this produces a posterior more wrong than the prior. The architectural response — the single highest-confidence finding in this section — is **strict separation of belief update and response action**. The posterior always updates from every credible sighting; the response action (mobilizing searchers, broadcasting the sighting location) is gated by temperament, not driven by the posterior update. Coupling these two modules is the most common engineering mistake (high-quality sighting → high-confidence map update → reflexive crowd response), and it is fatal in the literal Princess-Borzoi sense.

The Winnie case (69-day recovery; 7-mile displacement in 1 hour from a single crowd-convergence event after a sighting posted on social media) and the Princess Borzoi case (fatal multi-state displacement after *repeated* crowd events — geographic ping-pong from Cheyenne, WY to Colorado, back to Wyoming, then to Colorado again, with the explicit causal claim "she never settled because of human interference"; killed on Highway 34 in Colorado) provide the case-study evidence base [[dog-befriends-a-fox-while-lost-in-blizzard]] [[stay-out-of-the-woods-missing-animal-response-network]]. Princess Borzoi is a documented dose-response pattern — repeated crowd pressure produced a random-walk movement pattern, not a single bad outcome — and is the strongest case-evidence for the hard prohibition on public sighting broadcast for fearful dogs. When a sighting reaches a large group, the most probable outcome is that one or more individuals attempt visual capture, invalidating the sighting and potentially displacing the dog. An adversarial search for counterexamples — situations where crowd response to sightings of *fearful* dogs actually succeeded — returned zero. This is conditional on temperament classification: for the gregarious-dominated general population, community broadcast and neighborhood search are in fact the dominant recovery channel (Weiss 2012 49% neighborhood-search; Lord 2007 34.8% animal-agency contact). The "crowd response is fatal" rule applies once the dog is classified xenophobic, trauma-history, or Phase 2+; misclassification of a gregarious dog as fearful forgoes the dominant general-population channel. The asymmetric-cost architecture holds because the *failure mode* is asymmetric (fatal vs. recoverable-but-slower), not because the cost of the fearful-default is zero.

The HARTT intake schema (Help A Reunited Tag Together — practitioner sighting-intake standard) specifies that every sighting record date, exact time, exact location, direction of travel, and observer contact information [[lost-pet-owner-guide-hartt]]. Direction of travel is the highest-value field — it tells where the dog is heading, not just where it was; two or three sightings with directional vectors triangulate a movement corridor, materially more informative than position alone. The MAR sighting-response action protocol is unambiguous and has four operationally critical sub-protocols [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]] [[snap-into-action-missing-animal-response-network]]: (1) place a familiar scent article (owner's unwashed worn clothing) at the escape point within 4 hours, as the first anchor action; (2) establish a feeding station within ~20 feet of the sighting (some MAR sources use 50 feet, but closer is preferred), using *smelly canned food with gravy* — not dry kibble — as the bait; (3) deploy a trail camera and tie the trap door open with a bungee cord for the first several nights so the dog enters freely and builds positive association; (4) confirm camera evidence of consistent feeding for 2 consecutive days before arming the trap, then monitor the armed trap on 1–3 hour intervals (essential for animal-welfare compliance and volunteer scheduling). Landowner permission must be obtained for any off-property deployment. At no step is a crowd introduced. Camera confirmation is the trap-deployment gate: across MAR, HARTT, Joyful Pets, and Lost Pet Research & Recovery the consensus is unanimous.

Reliability λ weights are the medium-confidence layer. The corpus does not provide empirically calibrated weights specifically for dog sightings; weights derived from adjacent-domain reasoning (human eyewitness research, WiSAR sensor models) and practitioner consensus are: trail camera with image timestamp λ=0.95; clear daylight eyewitness with named observer and complete 4-field intake λ=0.70; uncertain or nighttime or brief eyewitness λ=0.35; crowd-degraded or social-media-mass-broadcast sighting λ=0.20 [[sarbayes-bayesian-methods-for-wisar]] [[a-bayesian-approach-to-modeling-lost-person-behaviors-based-on-terrain-features]]. These are starting points for refit, not validated parameters.

Updating P(location | sightings, t+12h) given a confirmed sighting at time T requires a movement kernel (how far and in what direction the dog typically moves in 12h, conditioned on phase and temperament), a terrain transition matrix, and the λ-weighted sighting likelihood. For a galgo prey-triggered escape with confirmed sighting at scrubland coordinate X with direction-of-travel noted, the 12h posterior concentrates within a 5–10 km elliptical region oriented along direction-of-travel, biased toward scrubland, with secondary mass at the prey-loss terminus (the OR=8.34 chase-fixation anchor). For a podenco in active prey-drive, the 12h posterior is a radially expanding scrubland-biased pattern with high entropy (5–15 km plausible). For any settled survival-mode dog with established feeding pattern, the 12h posterior is a low-entropy distribution clustered within 1 km of the known feeding station.

The Lord 2007 vs. MAR-doctrine tension resolves through temperament-gating. Lord's neighborhood-search recovery dominance (49% of Weiss 2012 recoveries) is dominated by gregarious dogs found in the first 24–48 hours; MAR doctrine is built on the hard-case sub-population that does not appear in Lord's sample at proportional rates (newspaper-ad respondents and shelter contacts are a gregarious-selected sample by construction). Both findings are valid for their populations. Nona disproportionately encounters the hard-case population because easy cases resolve before platform engagement. This case-mix assumption is the highest-stakes architectural assumption in the report and is currently *assumed, not measured*: Red Cão Algarve is positioned as community-facing first-call infrastructure, not a specialist MAR consultancy, so the platform may receive easy gregarious cases at higher rates than the MAR archive does. The engine must implement the MAR-doctrine default (passive, action-gated) and unlock active search only when temperament-class, phase, and prior-conditioning state all permit it — and the first ~100 Nona cases should be logged with intake temperament + outcome to validate the case-mix assumption. If actual case mix is gregarious-dominated rather than hard-case-dominated, the action-gate defaults for gregarious + Phase 1 will need to relax accordingly.

### Calibration Numbers

The λ weights below (camera, eyewitness, secondhand, crowd-degraded) are starting points reasoned from adjacent-domain literature; they MUST be refit once Nona has 50+ cases with sighting-quality × outcome pairs. The two-decimal precision is for engine-encoding convenience, not measured calibration.

| Sighting / Bayesian parameter | Value | Confidence |
|---|---|---|
| λ trail camera (timestamped image) | 0.95 | high |
| λ owner-personal sighting (vetted) | 0.75 | medium |
| λ clear daylight eyewitness, 4-field, named contact | 0.70 | medium |
| λ brief or uncertain eyewitness | 0.35 | medium |
| λ night eyewitness | 0.30 | low-medium |
| λ secondhand report | 0.25 | medium |
| λ crowd-degraded or mass-broadcast | 0.20 | medium |
| Minimum λ for posterior update | 0.20 | medium |
| Minimum λ for trap deployment | 0.95 (camera-confirmed regular visits) | high |
| Minimum λ for active human response (gregarious) | 0.70 within 30 min | medium |
| Camera-station deployment max time after sighting (fearful) | ≤4 hours | high |
| Trap-deployment camera-confirmation requirement | 2 consecutive days of feeding | high |
| Pre-mapping radius before sightings arrive | 2 miles from IPP (Initial Planning Point) | high |
| Markov diffusion step | 12 hours | medium |
| Cell grid resolution (rural Algarve) | 50 m | medium |
| Eyewitness position-error radius, daylight | 50–100 m | low-medium |
| Eyewitness position-error radius, night | 300–500 m | low-medium |
| 12h posterior radius (galgo prey-triggered) | 5–10 km along direction-of-travel | medium |
| 12h posterior radius (podenco active prey-drive) | 5–15 km radial, scrubland-biased | medium |
| 12h posterior radius (settled survival-mode) | <1 km from known feeding station | medium |
| Crowd-displacement quantum (Winnie) | 7 mi in 1 hr | high (case) |
| SARBayes MapScore baseline | 0.78–0.81 | high |
| Scent-hound active homing strategy split (Benediktová 2020) | 59% olfactory tracking + 33% magnetic-compass scouting | medium |

### Knowledge Gaps

No published study calibrates dog-specific civilian sighting reliability; the λ values are reasoned from adjacent domains, not measured. No published study adapts forensic-psychology eyewitness research to dog identification contexts. The displacement-vector model after a crowd event has only one quantified anchor (Winnie 7 mi/1 hr) — no distribution of Δ vectors by crowd intensity, terrain, or breed exists. Camera-confirmation latency in rural Algarve terrain is unmeasured; if average time from camera deployment to first confirmed visit exceeds 48 hours, the camera-first gate may need a parallel passive-approach exception. Sighting-quality differences between trained MAR volunteers and civilian observers are not modeled. The Koopman search detection function (Probability of Detection as a function of sweep width and lateral range — the formal SAR sensor model) has not been adapted for lost-dog camera/scent-station deployment. Bayesian update under conflicting sightings (two simultaneous reports 5 km apart) is not formally specified.

### Practical Encoding

The sighting layer implements a three-layer Bayesian architecture with strict separation between belief and action.

Layer 1 — Forward prior (Markov diffusion from IPP, category-conditioned). Initial prior at Day 0 is the population 1-mile circle for gregarious cases; expanded long-tail distribution for hard-case categories. Transition matrix encodes terrain preferences (scrubland-biased for podenco, road-following for toy breeds, last-known-prey-location anchoring for galgo when prey-triggered). Operationally, the engine should generate a pre-mapped 2-mile aerial overlay of the IPP at intake — with named landmarks, road segments, watershed boundaries, and notable cover (cork trees, olive groves, abandoned structures) — so that vague civilian sightings ("by the cork tree past the third olive grove on the road to Messines") can be converted to grid coordinates in real time. This pre-mapping is what makes low-λ eyewitness sightings tractable for the posterior update [[lost-pet-owner-guide-hartt]].

Layer 2 — Bayesian belief update (always-on for any λ ≥ 0.20):

```python
def update_posterior(prior_distribution, sighting):
    """Always runs, regardless of action gate."""
    if sighting.lambda_weight < 0.20:
        return prior_distribution
    likelihood = build_likelihood_function(
        center=sighting.location,
        sigma_m=position_error_radius(sighting),
        lambda_weight=sighting.lambda_weight,
    )
    return bayes_update(prior_distribution, likelihood)
```

Width of likelihood depends on λ: camera (λ=0.95) updates a tight neighborhood; uncertain eyewitness (λ=0.35) updates a broader 300–500 m radius. Direction-of-travel data biases next-timestep diffusion. Below λ=0.20 the sighting is noise and ignored.

Layer 3 — Action gate (separate from belief layer, temperament-conditional):

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
    # Gregarious + Phase 1 + dog already with finder
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

Three encoding principles govern the architecture:

1. **Belief always updates; action is gated.** The posterior incorporates every λ ≥ 0.20 sighting; action is taken only when temperament-gate permits.
2. **Camera-first is the universal safe response.** Camera-station deployment is the only response safe for any temperament, phase, or breed. Trap deployment requires camera-confirmed regular visits — never an eyewitness alone.
3. **Direction-of-travel is the most valuable single field.** Weight it heavily in posterior diffusion; it converts a point sighting into a vector sighting, materially higher in information content for predicting next location.

Public sighting broadcast is a hard-off for any dog classified as xenophobic, trauma-history, galgo (any trigger), prey-driven podenco, or any dog in Phase 2+. This single gate is the highest-leverage piece of code in the engine because its failure mode is documented fatality.

---

## 4. Fear Escalation Dynamics

### Key Empirical Findings

Lost Dogs of America, drawing on thousands of cases over 13 years, identifies the top three causes of death among lost dogs as vehicle strike, train strike, and drowning, and attributes all three directly to search pressure pushing dogs into traffic, rail corridors, or water hazards: "Lost dogs that are being pressured will stay in 'panic' mode and will make very poor decisions, whereas lost dogs who aren't being pursued or pressured will make very wise decisions and may survive indefinitely" [[never-follow-chase-or-pressure-a-lost-dog-lost-dogs-of-america]]. Search pressure is the leading proximate risk factor for death. Nona's primary product, properly understood, is preventing fear escalation rather than locating dogs that have already entered it.

The MAR framework identifies three primary triggers for blind-panic / evasion-mode onset, each producing immediate survival mode without the gradual phase progression seen in opportunistic-escape cases [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]]:

1. **Xenophobic temperament** (innate or trauma-conditioned). Dogs with baseline fear of strangers enter survival mode immediately upon loss. The galgo population is the paradigm case.
2. **Loud-noise event** (fireworks, thunder, gunfire). A dog escaping during fireworks "will quickly go into survival mode — avoiding all humans, even their owners" [[lost-dog-syndrome-understanding-your-dogs-survival-behaviors-holiday-barn]]. Mechanism: acoustic trauma plus immediate sympathetic activation; the Phase 1 cooperative window collapses to minutes. Algarve summer feast fireworks are a high-risk regional trigger.
3. **Traumatic incident** (vehicle accident, explosion, predator encounter). Direct trauma during or immediately preceding loss bypasses gradual progression and produces immediate flight-locked behavior.

The adrenaline-conditioning mechanism for the never-call / never-chase rule is the most mechanistically detailed finding in this section. When a panicked dog is approached or called by anyone — including the owner during flight — the flood of adrenaline and cortisol coexists with intact associative learning, forming a Pavlovian pairing between the trigger (calling, whistling, clapping, approaching) and the flight response. Once established, the trigger reliably produces the conditioned response, even when the owner later attempts to call. Named MAR cases document the pattern: Lucy (Case 10-264, Boston Terrier), Lacey (Case 10-267, Pomeranian), KoKo — owners called the dog at first sighting, the dog bolted; at second sighting the owner called again, the dog bolted farther; the pattern stabilized as "calling = flight trigger" [[never-call-a-lost-dog-missing-animal-response-network]] [[dont-call-your-dog-missing-animal-response-network]]. The Lucy case resolved in 4 days through neon posters plus strict no-calling protocol; a neighbor's failed-call attempt was the conditioning event. The Lacey case resolved when the owner sat down and sang Elvis songs — a non-conditioned sound signature unique to the owner — rather than calling the dog's name. The mechanism is consistent with mainstream associative-learning theory; convergence across MAR doctrine, named cases, and physiology produces medium-high confidence.

A compatible second mechanism is sensory-motivational suppression during peak cortisol. The operational rule is well-supported: food lures and owner scent articles fail during peak arousal, so the first 4–6 hours after a blind-panic loss are not the time to deploy scent-based lures — wait for cortisol to drop, then deploy. Two candidate mechanisms support this rule: (a) olfactory shutdown ("the olfactory portion of a dog's brain closes down during the 'fight or flight' process") per MAR practitioner literature [[what-you-dont-know-about-lost-pets-can-hurt-them]], biologically plausible via sympathetic-mediated redirection of cerebral blood flow but not directly supported by canine neuroimaging in this corpus; and (b) sympathetic-mediated reduction in appetitive motivation, in which food and familiar scent are simply non-salient under high arousal regardless of whether olfactory processing remains intact. The operational rule (no scent/food lures at peak arousal; even owner scent items will fail) survives regardless of which mechanism is correct, and applies to xenophobic Phase 1 dogs as much as to prey-driven podencos.

A third mechanism is predator-mimicry. A frightened dog interprets direct eye contact, straight-line approach, and upright human posture as predator-stalking behavior [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]]. The counter-protocol is peripheral gaze, oblique approach, and crouching. Mechanism consistent with comparative ethology — canid predators do approach prey with straight-line stalking and visual fixation.

The freeze-vs-flight distinction by breed matters operationally. Greyhound rescue literature documents the 4F stress response (Fidget/Freeze/Flight/Fight) and notes freeze is "characteristic in greyhounds" — recoverable because the dog is visible and not actively moving [[2-fear-and-anxiety-greyhounds-as-pets]]. Galgo rescue literature documents flight-dominant responses to the same internal state. A freeze response makes the dog catchable in place; a flight response makes the dog unreachable. The transition from cooperative to evasion mode in flight-dominant breeds is a transition from "approachable" to "uncatchable" — the dog does not pause in a freeze state where capture is possible.

Buddha Dog documents a counterintuitive familiar-stimulus paradox: in survival mode, familiar sights and smells — including the owner's voice or family car — can drive the dog OUT of a territory, because the dog associates "familiar" with "captured / pressured" rather than "safe" [[survival-mode-buddha-dog-rescue-recovery]]. This is the strongest single argument against owner-present searching in Phase 2.

The corpus identifies clear behavioral markers observable at distance [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]] [[lost-dog-behavior-pet-fbi-pets-found-by-internet]]:

- **Approachable signals:** neutral or forward ear position, relaxed/loose tail, sniffing toward observer, body weight forward, head lowered, brief eye contact, lip-lick or yawn (calming signals per Turid Rugaas).
- **Evasion signals:** ears flattened back, tail tucked, body weight shifted to hindquarters, fixed stare at escape route, dilated pupils, stiff posture, all four feet planted (the sighthound pre-flight freeze).

Pet FBI's three-zone framework defines approach geometry: Awareness Zone (dog detects human, no posture change); Alert Zone (posture change, ready to flee); Action Zone (threshold for bolting) [[lost-dog-behavior-pet-fbi-pets-found-by-internet]]. The approach rule is to remain in the Awareness Zone and let the dog choose to approach, with 45-degree angled positioning rather than direct frontal approach. Distances are case-specific (Awareness may be 50 m for a relaxed shy dog and 200+ m for a survival-mode galgo); the engine encodes the geometric principle, not fixed numbers.

### Calibration Numbers

| Fear-dynamics parameter | Value | Confidence |
|---|---|---|
| Xenophobic evasion onset | 0–6 h | medium-high |
| Blind-panic evasion onset | 0–30 min | high |
| Adrenaline-conditioning threshold | 1–2 failed approaches | medium-high |
| Olfactory shutdown duration during acute peak | ~1–6 h episodic | medium |
| Top death-cause rank 1 | vehicle strike | high |
| Top death-cause rank 2 | train strike | high |
| Top death-cause rank 3 | drowning | high |
| Probability of flight response in survival-mode | ≥95% | medium |
| Freeze response precedes flight in sighthounds | ~0.85 likelihood | medium |
| Silence Factor indicates survival mode | True | high |
| Nocturnal-activity shift indicates survival mode | True | high |
| Familiar-stimulus negative association in survival mode | plausible | medium |
| Name-conditioning | assume permanent for the *name*; non-name unique owner signals (singing, unique whistle pattern, visual signature change) may bypass conditioning per Lacey/Murphy cases | medium |
| Approach-zone geometry | 45° offset, never head-on | high |

### Knowledge Gaps

No controlled experimental test of the never-chase rule exists, and an ethical RCT is unlikely — the rule rests on [practitioner consensus + named case series], not [empirically validated]. The exact threshold for "active searching becomes counterproductive" is unquantified — Lord 2007's neighborhood-search recovery dominance is gregarious-dominated and not stratified by temperament [peer-reviewed but adjacent population]. The probability distribution of survival-mode onset timing is poorly characterized [practitioner consensus only]. Olfactory shutdown is mechanistically asserted but not directly measured [practitioner consensus, no canine neuroimaging confirmation]. The recoverability gradient within evasion mode is unknown; predictive factors for habituation success are not characterized [anecdotal case series only — Winnie 69d, Lacey/Elvis]. Conditioning extinction timelines are unknown — once "calling = flight" is established, can it be extinguished, and over what timescale? [no data]. The interaction between trauma baseline (galgo) and acute-arousal conditioning is mechanistically plausible but unmeasured [theoretical inference]. The dose-response curve for crowd-size vs. displacement-distance has only single-point anchors [anecdotal case series only — Winnie 7mi/1hr, Princess Borzoi multi-state]. Algarve-summer heat interaction with fear escalation is unmeasured — dehydration likely lowers tolerance for additional stress, but no data quantifies this.

### Practical Encoding

Fear escalation is modeled as a monotonic state machine with three trigger types and three conditioning events. The default initial state is *unconditioned*. The state advances irreversibly:

- *Unconditioned* → *adrenaline-primed* when any of the three blind-panic triggers (xenophobic baseline, loud-noise event, traumatic incident) is reported at intake.
- *Adrenaline-primed* → *name-conditioned* when any prior failed approach attempt is logged where the dog's name was called during flight. Treated as functionally irreversible by the engine, with explicit recognition that practitioner anecdote supports partial reversibility via non-conditioned signal substitution (the Lacey/Elvis pattern).
- *Name-conditioned* → *crowd-conditioned* when any crowd-convergence event is logged at any sighting. Recovery requires camera-station-only protocol regardless of operator identity.

**Decision matrix (temperament × phase → search intensity and broadcast permission):**

| Temperament \ Phase | Phase 1 (0–72h) | Phase 2 (72h–7d) | Phase 3 (7d+) |
|---|---|---|---|
| Gregarious | Owner direct approach OK; neighborhood search OK; semi-public calm-protocol broadcast permitted only if sighting <30 min old AND dog stationary with finder — otherwise coordinator-only | Passive lure primary; camera station; coordinator-only | Camera/trap only; coordinator-only |
| Aloof | Calming-signals approach; single calm responder | Camera + passive lure; coordinator-only | Camera/trap only; coordinator-only |
| Xenophobic / trauma | Camera station within 4h; no calling; coordinator-only | Camera + trap; no human approach; coordinator-only | Camera/trap; conspecific lure if available |

Hard prohibitions at the action-gate level apply across all dogs. The engine forbids: calling the dog's name by strangers; crowd response to any sighting of an xenophobic/trauma-baseline/sighthound/post-Phase-1 dog; direct frontal approach to xenophobic or any Phase 2+ dog; eye contact at close range with any evasion-mode dog; whistling or clapping at any dog with prior failed-approach events. Running toward a dog is absolutely prohibited — the biological chase response overrides any recognition. Broadcasting sighting coordinates on social media is prohibited for galgo, prey-driven podenco, xenophobic, trauma-history, or any Phase 2+ dog.

Required positive actions — the MAR calming-signal sequence as a six-step explicit protocol [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]] [[how-to-get-a-skittish-dog-to-come-to-you-petco-love-lost]] [[dont-call-your-dog-missing-animal-response-network]]:

1. Get low — sit, kneel, or lie flat on the ground.
2. Avoid direct eye contact; gaze peripheral, head turned sideways.
3. Face sideways, not predator-straight-on (45-degree angled body posture).
4. Make soft lip-smacking sounds with crinkly food packaging — auditory lure, not silence.
5. Drop food on the ground without reaching toward the dog; let the dog choose to approach.
6. SING (or use a unique non-conditioned sound signature — humming, whistling a unique pattern, talking softly in a melody) IF the dog has already been called by failed-capture attempts; this bypasses any "call = flight" conditioning. The Lacey case resolved when the owner sang Elvis songs rather than calling the dog's name. The Murphy military-owner case resolved when the owner removed his hat to allow visual recognition — visual signature substitution under the same logic.

Camera station first in all Phase 2+ sightings; silent observation in all survival-mode cases.

The engine requires the operator (or AI assistant) to classify dog posture from each sighting description before any approach is authorized. With asymmetric cost as the gating principle, ambiguous signals default to evasion:

```python
def classify_fear_state(observed_signals):
    flight = sum(weight[s] for s in observed if s in FLIGHT_SIGNALS)
    approach = sum(weight[s] for s in observed if s in APPROACH_SIGNALS)
    if flight - approach > 0.5:    return "evasion"
    elif approach - flight > 0.5:  return "approachable"
    else:                          return "ambiguous_default_to_evasion"
```

The owner-warning surface is one of the most important UI deliverables. The system issues structured, evidence-cited warnings at intake that the owner must acknowledge: "Do not call your dog's name. Calling can become a conditioned flight trigger — documented in MAR cases Lucy and Lacey. The mechanism is adrenaline conditioning, and once established, the trigger fires for your voice as well." Each prohibition ships with a specific alternative action, because telling an anxious owner "don't search" without giving them a productive alternative produces non-compliance. Approved alternatives: for Phase 1 opportunistic-escape gregarious cases, the highest-yield owner action is to remain *at the escape point* with an unwashed worn item of clothing, water, and food — passive scent-anchor — rather than driving the neighborhood; this converts owner anxiety into productive presence at the location where the dog is most likely to return. This protocol *reverses* for Phase 2+ or xenophobic cases, where owner presence at sighting locations becomes counterproductive (the Buddha Dog familiar-stimulus paradox). Additional alternatives across all cases: set up a feeding station; distribute neon flyers without revealing sighting coordinates; file a coordinator-only sighting report; if approach is permitted (gregarious + Phase 1 + visible relaxed body language), execute the step-by-step protocol — get low, look sideways, drop food, wait 45 minutes minimum, abort on freeze.

### Forward Implications

Nona's own operational data is the highest-value research opportunity in the entire problem space. The published literature contains no controlled lost-dog phase-transition timing, no breed-stratified phase durations, no calibrated dog sighting reliability, and no Algarve-specific population data. A platform that structures intake fields, sighting records with operator-classified behavioral signals, and recovery outcomes will become, within 2–3 years, the world's largest validated dataset on lost-dog behavior. Build the engine to be parameterizable; log every case outcome against the prior; refit quarterly once 50+ cases per breed × trigger combination accumulate. Two specific UI surfaces follow directly from the asymmetric-cost architecture: (a) the intake question sequence should surface escape-trigger type and prior-failed-approach history *before* breed, since these dominate the action-gate selection more than breed alone; (b) volunteer routing should treat calm-protocol-certified volunteers as a distinct role from broadcast-volunteers, with the calm-protocol role mandatory for any galgo, podenco, or Phase 2+ case dispatch. An effective Algarve deployment routes well-meaning bystander energy away from the search area and into the disciplined passive protocol (food stations, cameras, traps, magnet dogs, conspecific lures) the evidence base supports — the galgo and podenco populations of the Algarve stand to benefit disproportionately because they are precisely the populations for which the conventional active-search default is most lethal.
