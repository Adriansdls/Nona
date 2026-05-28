---
title: Untitled
tags:
- lost-dog-behavioral
- dog-movement-algarve
- lost-dog
- survival-mode
- sighthound
created: '2026-05-28T09:28:53.385264Z'
updated: '2026-05-28T09:28:54.460262Z'
status: review
type: note
deprecated: false
summary: Nona's behavioral engine should be implemented as a four-input scoring function
  whose primary output is not a probabi...
---

# Probabilistic Behavioral Engine for Nona — Practitioner Encoding Specification

## Executive Summary

Nona's behavioral engine should be implemented as a four-input scoring function whose primary output is not a probability score but an **action gate**: a hard-coded decision about whether crowd response to a sighting is permitted. The load-bearing finding from this corpus is that the most consequential parameter is binary (broadcast-permitted: yes/no), not continuous, and that getting this parameter wrong has produced documented fatalities — Princess the Borzoi killed on Highway 34 after multi-state crowd-driven displacement [[stay-out-of-the-woods-missing-animal-response-network]], Winnie displaced 7 miles in one hour from a single crowd convergence event [[dog-befriends-a-fox-while-lost-in-blizzard]], the named MAR cases Lucy (10-264) and Lacey (10-267) where calling became an adrenaline-conditioned flight trigger [[never-call-a-lost-dog-missing-animal-response-network]]. The four engine inputs are: (1) elapsed time since loss, mapped to a three-phase temporal model with breed and trigger modifiers; (2) breed prior, weighted heavily for capture strategy selection and very lightly for the continuous probability score; (3) sighting evidence stream, weighted by a reliability coefficient λ ranging 0.20–0.95; and (4) escape trigger classification — opportunistic, blind-panic, prey-drive, or wanderlust — which can collapse the Phase 1 window from 72 hours to under four hours for a prey-driven podenco. Every section below is organized around what an engineer encodes; the empirical evidence is presented as the justification trail for each parameter. The engine should treat all parameter values as priors held with calibrated confidence, not as ground truth — population statistics (Lord 2007, Weiss 2012, Kremer 2021) capture a population dominated by gregarious dogs who self-resolve early, while Nona will disproportionately encounter the hard cases that professional recovery handles, where the population-distance prior must be replaced by a bimodal model with a heavy tail extending past 10 km.

The forward-looking implication is that Nona must be designed with a feedback loop from its own operational case data, because the published literature has no peer-reviewed controlled study comparing breed-specific recovery protocols, no GPS telemetry data for lost galgos or podencos in Mediterranean scrubland, no calibrated sighting-reliability framework for civilian dog identification, and no quantified survival-mode-onset distribution beyond practitioner ranges of "50–99% depending on history" [[survival-mode-buddha-dog-rescue-recovery]]. The Algarve case database that Nona generates will be the primary source for refining every parameter in this document. Build the engine to be parameterizable, log every case outcome against the prior, and refit quarterly.

---

## 1. Temporal Behavioral Phases — Empirical Data

### Key Empirical Findings

The defensible phase model has three boundaries: a soft 72-hour boundary between acute panic and survival-mode entrenchment, a harder five-day operational cliff aligned with shelter hold periods, and a seven-day plateau after which gregarious-pattern recovery becomes rare. Lord 2007 (n=187 Ohio dogs) anchors the early curve with a median recovery time of 2 days and a 0.5–21 day range [[lost-pet-statistics-lost-pet-research-and-recovery]]. Kremer 2021 (n=30,609 Dallas strays) establishes that 91% of shelter return-to-owner outcomes occur within the 5-day mandatory hold [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]]. The cat-species analog from Huang 2018 (n=1,210, peer-reviewed competing-risks survival analysis) shows 34% found alive by day 7, 50% by day 30, plateau beyond day 61 [[source-analysis-huang-2018-missing-cats-search-methods-locations]] — structurally transferable in curve shape (steep early decline, post-day-60 plateau) but not in absolute values, because dogs recover roughly 3x faster than cats in the early window. The practitioner-consensus 3–4 day threshold for owner-perceived-as-predator behavior is convergent across Lost Dogs Illinois (3,000+ cases over 13 years), Holiday Barn, Buddha Dog, and K9s on Call, but is not validated by any controlled study [[interim-report-dog-phase-transition-thresholds]]. The Hennessy cortisol arc — peak HPA axis activation days 1–3, declining days 4–9, adaptation plateau day 9+ — provides physiological grounding for the behavioral threshold even though the data is sheltered-dog, not lost-dog [[interim-report-dog-phase-transition-thresholds]]. There is no peer-reviewed study that empirically calibrates dog-specific behavioral phase transitions; this is the most significant gap in the literature, repeatedly flagged across multiple practitioner sources.

### Calibration Numbers

| Parameter | Value | Source confidence |
|---|---|---|
| `phase_1_default_duration_h` | 72 | medium |
| `phase_1_xenophobic_duration_h` | 0–24 | medium |
| `phase_1_galgo_duration_h` | 0 (effective) | medium-high |
| `phase_1_prey_drive_podenco_duration_h` | 0–4 | medium |
| `phase_2_default_duration_d` | 3–7 | medium-high |
| `phase_3_threshold_d` | 7 | medium-high |
| `shelter_urgency_cliff_d` | 5 | high (Kremer 2021) |
| `median_recovery_time_d_gregarious` | 2 | high (Lord 2007) |
| `recovery_curve_plateau_d` | 60+ | high (Huang 2018, transfer) |
| `cortisol_acute_peak_h` | 24–72 | high (Hennessy) |
| `survival_mode_onset_probability_xenophobic` | 0.95–0.99 | medium |
| `survival_mode_onset_probability_gregarious` | 0.50 | medium |
| `survival_mode_onset_probability_unknown` | 0.75 | low-medium |
| `nocturnal_activity_shift_threshold_d` | 2 | medium |
| `recovery_alive_pct_d7` | 34 (cat analog) | medium for dog transfer |
| `cortisol_plasma_halflife_min` | 60–90 | high (veterinary phys) |

### Knowledge Gaps

No dog-specific controlled study with longitudinal cortisol and behavioral coding at 24/48/72/96-hour and 7-day post-escape timepoints exists in the published literature. The 72-hour Phase 1 boundary is practitioner-consensus, not measured; the ±48-hour range around it is itself a practitioner estimate. Survival-mode onset distribution within a temperament category is genuinely unmeasured — Buddha Dog's "50–75–90–99%" range is a practitioner heuristic gradient, not an empirical probability distribution [[survival-mode-buddha-dog-rescue-recovery]]. The Algarve context — rural, sparse human population, hot summers forcing daytime hiding — has no published telemetry data; phase boundaries may extend in low-density rural settings because the dog encounters fewer pursuit triggers. Reversibility of Phase 2 (can a settled survival-mode dog be coaxed back toward approach-tolerance via long passive feeding?) is undocumented quantitatively, though MAR case narratives (Winnie, 69 days) suggest gradual partial reversal is possible.

### Practical Encoding

```python
# Nona phase classifier — pseudocode
def classify_phase(case):
    h = case.hours_since_loss
    breed = case.breed_category
    trigger = case.escape_trigger  # opportunistic | blind_panic | prey_drive | wanderlust
    temperament = case.temperament  # gregarious | aloof | xenophobic | unknown

    # Trigger-conditional Phase 1 collapse
    if trigger == "prey_drive" and breed == "podenco":
        phase_1_cap = 4
    elif trigger == "blind_panic" or temperament == "xenophobic":
        phase_1_cap = 24
    elif breed == "galgo":
        phase_1_cap = 0   # galgo starts in Phase 2 behavior
    else:
        phase_1_cap = 72

    if h < phase_1_cap:
        return "phase_1_acute"
    elif h < 24 * 7:
        return "phase_2_survival"
    else:
        return "phase_3_entrenched"

# Survival-mode onset probability (informs whether to escalate action gate)
SURVIVAL_MODE_PRIOR = {
    "xenophobic":   0.97,
    "aloof":        0.80,
    "gregarious":   0.50,
    "trauma_history": 0.95,
    "unknown":      0.75,
}

# Urgency weighting — multiplies search-effort prioritization, not the action gate
URGENCY_BY_PHASE = {
    "phase_1_acute":     1.0,
    "phase_2_survival":  1.4,   # peak urgency before shelter cliff
    "phase_3_entrenched":0.7,   # active search ineffective; rely on sighting protocol
}
```

The phase classifier is a four-input function — elapsed time, breed, escape trigger, temperament — not a pure time function. Every parameter has a "review on case data" hook: after the Algarve database accumulates 50+ cases per breed × trigger combination, refit `phase_1_cap` values from observed outcomes. Phase 3 entrenched is not a failure state; it is a different operational mode where the only valid actions are passive feeding station, trail camera, and trap. Encode the engine to **suppress urgency-driven UI prompts** in Phase 3 and instead surface monitoring tools — anxious owners burning effort on flyering in Phase 3 produce no recovery improvement and may displace the dog from a settled territory if they hand-deliver flyers within the dog's range.

---

## 2. Breed-Specific Behavioral Priors

### Key Empirical Findings

The breed-prior literature contains an apparent contradiction that resolves at the level of analytical scope. Morrill et al. 2022 (Science, n=18,385) found that breed explains only 9% of behavioral variance in individuals and that agonistic threshold (fear/reactivity) is "almost uninformative" by breed at the individual level [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]]. Normando et al. 2024 (n=410, 198 galgos vs. 212 other rescue dogs) found that galgos show significantly higher out-of-context fear of non-cohabiting adult people (p=0.009), with >1 in 5 galgos exhibiting this behavior versus effectively zero in the control group [[prevalence-of-some-behavioural-problems-in-two-groups-of-rescue-dogs-galgos-from]]. Both findings are valid. Breed cannot predict whether an individual galgo will be afraid of a specific rescuer, but breed does shift the group-level distribution sufficiently to justify a different default capture protocol. Morrill operates on individual-prediction variance; Normando operates on group-level base rates. Nona's intake stage has no individual signals yet, so the group-level prior governs.

For the galgo specifically, the corpus supports a **dual-prior model**: a chase displacement prior derived from English greyhound research, and an approach-avoidance prior derived from galgo-specific trauma data. Starling et al. 2020 found that greyhounds fixate on the last visible lure location at OR=8.34 (95% CI 1.72–42.38, p=0.009) when the lure disappears — a phylogenetically conserved sighthound prey-fixation mechanism that transfers to live-rabbit chase scenarios in Algarve scrubland [[effects-of-lure-type-on-chase-related-behaviour-in-racing-greyhounds-pmc]]. The approach-avoidance prior does not transfer from English greyhounds: rescued galgos show flight-dominant (not freeze-dominant) responses to human approach because of "almost universal" maltreatment baseline documented across SOS Galgos, Galgos del Sol, and Animal Corner [[sos-galgos-adopt-a-survivor]] [[what-is-a-galgo-galgos-del-sol]] [[galgo-espaol-animal-corner]]. The galgo's documented timeline to allow human approach is "weeks or even months" of patient passive coaxing [[what-is-a-galgo-galgos-del-sol]].

For the podenco, McLennan's predatory motor sequence data shows Hunt 69%, Orient 69%, Chase 69%, Consume 8% — meaning chase is appetitive and self-reinforcing without food reward, which makes food lures unreliable during active prey-drive arousal [[prey-drive-in-podencos]]. The podenco is a triple-sensory hunter (sight + scent + hearing) bred for endurance trotting on Mediterranean scrubland, not galloping sprints; it engages both visual coursing and scent tracking modes, with sniffing in high-arousal states actively raising rather than calming arousal [[about-podenco-dogs-hope-for-podencos]] [[arousal-and-predatory-motor-patterns]]. Movement radius in prey-drive escape is mechanistically inferred at 5–15 km in 24–48 hours; no GPS telemetry study of lost podencos exists [[interim-report-podenco-lost-movement-pattern]]. The broader population statistics — 70% of all lost dogs found within 1 mile of home, 42% within 400 feet (Kremer 2021); mixed-breed dogs averaging 14 miles vs. purebreds 2 miles (Albrecht 1999, n=254, informal) — describe the easy population that resolves before professional recovery is engaged [[frequency-of-lost-dogs-and-cats-in-the-united-states-and-the-methods-used-to-loc]] [[most-lost-dogs-are-just-around-the-corner-literally-hass]].

### Calibration Numbers

| Breed prior parameter | Value | Confidence |
|---|---|---|
| `breed_weight_in_probability_score` | ≤0.10 | high (Morrill) |
| `breed_weight_in_action_gate` | 1.00 (full) | high (Normando, MAR) |
| `galgo_stranger_approach_success_day1` | 0.02 | high (5+ practitioner consensus) |
| `galgo_passive_protocol_min_duration_d` | 72+ | high |
| `galgo_full_recovery_timeline_weeks` | 4–12 | medium |
| `galgo_fence_clearance_min_height_m` | 1.8 (6 ft) | high |
| `galgo_chase_terminus_OR` | 8.34 (CI 1.72–42.38) | medium (transfer from greyhound) |
| `galgo_chase_search_radius_km` | 1–3 around prey-loss point | medium |
| `podenco_consume_pct` | 8 | high (McLennan) |
| `podenco_food_lure_effectiveness_during_chase` | 0.10 | medium |
| `podenco_lost_radius_24h_km` | 5–10 | medium |
| `podenco_lost_radius_48h_km` | 10–15 | medium |
| `podenco_terrain_bias` | scrubland > field > road | high |
| `toy_breed_max_radius_km` | 1.2 (0.75 mi) | medium (Albrecht 1999) |
| `mixed_breed_default_radius_km` | 22.5 (14 mi) hard cases | medium |
| `purebred_default_radius_km` | 3.2 (2 mi) | medium |
| `population_within_1mi_pct` | 70 (gregarious dominated) | high |
| `population_within_400ft_pct` | 42 | high |
| `mixed_breed_4plus_ancestry_pct` | 66 | high (Morrill 2022) |

### Knowledge Gaps

No peer-reviewed controlled trial has compared breed-specific recovery protocols (e.g., galgo-passive vs. galgo-active) against outcomes such as days-to-capture or alive-recovery rate. No GPS telemetry data exists for lost galgos or lost podencos in Mediterranean scrubland — the 5–15 km podenco radius and the 1–3 km galgo chase-terminus radius are mechanistic inferences, not measurements. The galgo OR=8.34 figure has a wide confidence interval (1.72–42.38) and is transferred from English racing greyhounds; magnitude uncertainty is substantial even though directionality (strong last-known-location fixation) is well-supported. Normando 2024's comparison group ("other rescue dogs") is not broken out by sighthound vs. non-sighthound, so the galgo-specific signal versus a general sighthound signal cannot be cleanly separated. The Algarve galgo population may have a different trauma baseline than the Spanish-hunting-kennel population Normando sampled; rescued-as-pet galgos likely have lower stranger-fear priors than hunting-discarded individuals.

### Practical Encoding

```python
BREED_PRIOR = {
    "galgo": {
        "default_protocol": "passive_conspecific_trap_from_day_0",
        "stranger_approach_success_day1": 0.02,
        "min_passive_duration_d": 3,
        "expected_recovery_timeline_weeks": (4, 12),
        "search_radius_km": 1.5,           # 1-mile baseline if no prey trigger
        "chase_terminus_search_radius_km": 2.0,  # if prey-triggered
        "chase_terminus_OR": 8.34,
        "fence_clearance_min_m": 1.8,
        "preferred_lure": "calm_familiar_dog",  # conspecific over food
        "secondary_lure": "owner_scent_article_at_station",  # never owner_present
    },
    "podenco": {
        "default_protocol": "passive_scent_anchor_trap",
        "consume_pct": 0.08,
        "food_lure_effectiveness_active_chase": 0.10,
        "food_lure_effectiveness_settled": 0.75,
        "lost_radius_24h_km": 7,           # midpoint of 5–10
        "lost_radius_48h_km": 12,          # midpoint of 10–15
        "terrain_bias": ["scrubland", "rocky", "vegetation_cover"],
        "movement_pattern": "expanding_spiral_with_sprint_episodes",
        "preferred_lure": "high_value_meat_scent_in_settled_phase",
    },
    "sighthound_other": {  # whippet, lurcher, saluki — galgo-adjacent default
        "default_protocol": "passive_conspecific_trap",
        "stranger_approach_success_day1": 0.15,
        "min_passive_duration_d": 1,
    },
    "scent_hound": {  # beagle, pointer, foxhound
        "default_protocol": "active_search_phase_1_then_passive",
        "scent_following_radius_km": 8,
        "trail_camera_priority": "high",  # established scent paths
    },
    "toy_breed": {
        "max_expected_radius_km": 1.2,
        "default_protocol": "intensive_neighborhood_search_first_24h",
        "hide_locations": ["under_porches", "drainage", "vegetation"],
    },
    "guardian": {  # mastiff, GSD, livestock guardian
        "default_protocol": "territorial_perimeter_search",
        "approach_caution_high": True,  # may guard last known location
    },
    "herding": {
        "default_protocol": "passive_with_calming_signals",
        "noise_phobia_likely": True,
    },
    "mixed_unknown": {
        "default_protocol": "temperament_gated",
        "max_expected_radius_km": 22.5,   # Albrecht 1999 hard-case mixed
        "weight_breed_signal": 0.0,        # individual signals dominate
    },
}

def select_protocol(case):
    breed_config = BREED_PRIOR.get(case.breed_category, BREED_PRIOR["mixed_unknown"])
    # Action gate dominated by breed; probability score barely uses breed
    action_gate = compute_action_gate(breed_config, case)
    probability_score = compute_probability(
        breed_weight=0.10,
        owner_signals_weight=0.55,
        sighting_signals_weight=0.35,
        case=case,
    )
    return action_gate, probability_score
```

The critical encoding rule is that **breed governs the action gate at full weight, but governs the continuous probability score at ≤10%**. This is the resolution of the Morrill–Normando dialectic in operational form: individual variance (Morrill's 91% non-breed variance) flows through the probability score where individual signals dominate, while population base rates (Normando's p=0.009 group-level difference) flow through the action gate as a minimum-regret choice. A wrong "treat the galgo as gregarious" decision triggered by a low-quality individual signal can produce crowd convergence and fatal displacement; a wrong "treat the gregarious mutt as xenophobic" decision wastes effort on unnecessary passive protocol. The asymmetric cost justifies the asymmetric weighting.

---

## 3. Bayesian Updating from Sightings

### Key Empirical Findings

The formal Bayesian-update architecture for spatial probability distributions is well-established in the wilderness search and rescue (WiSAR) literature but has never been calibrated specifically for lost-dog sighting reliability. Lin & Goodrich 2010 establishes the first-order Markov framework: a prior probability distribution over spatial cells, parameterized by behavioral profile and terrain features, updated at each timestep into a posterior predictive distribution that incorporates new observations via Bayes' theorem [[a-bayesian-approach-to-modeling-lost-person-behaviors-based-on-terrain-features]]. SARBayes validates this empirically with MapScore values of 0.78–0.81 on the ISRID dataset (n=376) [[sarbayes-bayesian-methods-for-wisar]]. Hashimoto et al. 2022 provides the forward model — a six-strategy probability mass function [Random Walk, Route Travel, Direction Travel, Stay Put, View Enhance, Backtrack] drawn independently per timestep — and explicitly notes the absence of a sighting-update mechanism in agent-based formulations [[source-analysis-hashimoto-2022-agent-based-lost-person-model]]. The Hashimoto strategy taxonomy maps cleanly onto dog behavior with one addition: a seventh "Scent Track" strategy for scent hounds, weighted heavily for beagles and moderately for podencos.

The practitioner sighting-intake schema is canonical across MAR and HARTT: date, time, exact location, direction of travel, observer contact, observer type [[lost-pet-owner-guide-hartt]]. Direction of travel is the most diagnostically valuable single field, because two sightings with directional vectors triangulate movement intent, while location alone gives only an anchor point. The reliability hierarchy is unambiguous in the practitioner literature even though no peer-reviewed framework exists: trail-camera evidence is near-deterministic (`λ≈0.95`), clear daylight eyewitness with description specificity is moderately reliable (`λ≈0.70`), uncertain or brief or nighttime eyewitness drops to `λ≈0.35`, and crowd-degraded sighting (multiple secondhand reports after social-media broadcast) drops to `λ≈0.20` and is functionally unusable as both the original observation and any post-broadcast displacement are conflated [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]] [[interim-report-bayesian-sighting-update]]. The trap-deployment trigger across MAR, Joyful Pets, and HARTT is unanimous: do not set a trap based on eyewitness sightings alone; require trail-camera confirmation of consistent feeding at a specific location across 2+ days before deploying [[when-do-you-set-a-trap-for-a-lost-dog-missing-animal-response-network]].

The single most consequential finding is that **acting on a sighting and updating the belief about a sighting are architecturally separate decisions**. The Bayesian posterior should always update from any sighting above `λ=0.20`. The action taken on that posterior — whether to broadcast, deploy volunteers, or restrict response to a single coordinator — is governed by an independent action gate keyed on temperament and phase. The Winnie case quantifies the consequence of conflating belief and action: a crowd convergence to a single sighting produced 7 miles of displacement in one hour [[dog-befriends-a-fox-while-lost-in-blizzard]]. Princess the Borzoi's multi-state displacement and fatal vehicle strike documents the worst-case outcome of repeatedly broadcasting sightings for a fearful dog [[stay-out-of-the-woods-missing-animal-response-network]]. Adrenaline conditioning — the named cases Lucy (10-264) and Lacey (10-267) — establishes that calling a dog's name becomes a fear-conditioned flight trigger after one or two failed-approach events, generalizing to the owner's voice [[never-call-a-lost-dog-missing-animal-response-network]] [[dont-call-your-dog-missing-animal-response-network]].

### Calibration Numbers

| Sighting parameter | Value | Confidence |
|---|---|---|
| `lambda_trail_camera` | 0.95 | high (practitioner consensus) |
| `lambda_clear_daylight_eyewitness` | 0.70 | medium |
| `lambda_brief_or_night_eyewitness` | 0.35 | medium |
| `lambda_crowd_degraded` | 0.20 | medium |
| `lambda_minimum_for_posterior_update` | 0.20 | medium |
| `lambda_minimum_for_action` | varies by temperament gate | high |
| `markov_diffusion_step_h` | 12 | medium |
| `diffusion_radius_doubling_period_h` | 12 | medium |
| `cell_grid_resolution_m` | 50 (rural Algarve) | medium |
| `eyewitness_position_error_radius_daylight_m` | 50–100 | low-medium (adjacent domain) |
| `eyewitness_position_error_radius_night_m` | 300–500 | low-medium (adjacent domain) |
| `direction_of_travel_required_for_high_lambda` | True | high |
| `sighting_intake_required_fields` | date, time, exact_location, direction, observer_contact | high |
| `trap_deployment_camera_confirmation_d` | 2 consecutive | high |
| `camera_station_deployment_max_h_after_sighting` | 4 (fearful dogs) | high |
| `gregarious_recent_sighting_action_window_min` | 30 | medium |
| `gregarious_max_responders_per_sighting` | 3 | medium |
| `winnie_crowd_displacement_dose_response_km_per_h` | 7 | high (case study) |
| `princess_borzoi_outcome` | fatal vehicle strike | high (case study) |
| `mar_sarbayes_mapscore` | 0.78–0.81 | high |

### Knowledge Gaps

No published study has calibrated dog-specific civilian sighting reliability. The λ values are inferences from adjacent domains — human eyewitness identification research, WiSAR sensor models, and practitioner consensus. The Koopman search detection function (probability of detection as a function of sweep width and lateral range), which links sensor deployment to Bayesian probability-of-detection in formal SAR theory, has not been adapted for lost-dog camera/scent-station deployment. Rural-Algarve-specific civilian observer accuracy (sparse population, agricultural workers as primary observers) has no empirical basis. The exact crowd-displacement dose-response — how many responders trigger displacement, at what distance, with what frequency — is documented only via single-case studies (Winnie's 7 miles per hour from one event; Princess's multi-state from repeated events) without a calibrated function. The reliability premium for trained MAR-protocol volunteers versus untrained civilians is not quantified.

### Practical Encoding

```python
LAMBDA_WEIGHTS = {
    "trail_camera_confirmed":            0.95,
    "clear_daylight_specific_eyewitness":0.70,
    "owner_personal_sighting":           0.75,  # high observer reliability
    "brief_eyewitness":                  0.40,
    "night_eyewitness":                  0.30,
    "secondhand_report":                 0.25,
    "social_media_unverified":           0.20,
    "crowd_degraded":                    0.20,
}

def update_posterior(prior_distribution, sighting):
    """Bayesian update of spatial probability — always runs, regardless of action gate."""
    if sighting.lambda_weight < 0.20:
        return prior_distribution  # below threshold, ignore
    likelihood = build_likelihood_function(
        center=sighting.location,
        sigma_m=position_error_radius(sighting),
        lambda_weight=sighting.lambda_weight,
    )
    posterior = bayes_update(prior_distribution, likelihood)
    return posterior

def action_gate(case, sighting, posterior):
    """Separate decision: what response does this sighting warrant?"""
    # Hard prohibition: fearful dogs never get crowd response
    if case.temperament in ("xenophobic", "trauma_history") or case.phase == "phase_2_survival":
        return Action(
            broadcast="private_coordinator_only",
            responder_count=1,
            response_type="camera_station_within_4h",
            crowd_response_blocked=True,
        )
    # Galgo and prey-driven podenco: hard private gate regardless of sighting quality
    if case.breed in ("galgo", "podenco") and case.escape_trigger != "opportunistic":
        return Action(
            broadcast="private_coordinator_only",
            responder_count=1,
            response_type="conspecific_lure_or_scent_anchor",
            crowd_response_blocked=True,
        )
    # Gregarious + recent sighting + dog already with finder
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
    """Trap is downstream of camera confirmation, not eyewitness sightings."""
    return (
        case.camera_confirmed_visits >= 2
        and case.consecutive_feeding_days >= 2
        and case.landowner_permission_obtained
        and case.responder_assigned
    )
```

The encoding rule that an engineer must internalize: **the posterior update and the action decision are two functions, called sequentially but never merged**. A sighting always updates the spatial model; the action taken on that updated model is filtered through a separate decision tree dominated by temperament and breed. Public broadcast of sighting location coordinates is a hard-off for any dog classified as xenophobic, trauma-history, galgo (any escape trigger), prey-driven podenco, or any dog in Phase 2 survival mode. This single gate is the highest-leverage piece of code in the engine because its failure mode is documented fatality.

---

## 4. Fear Escalation Dynamics

### Key Empirical Findings

The transition from "lost and searching for home" to "traumatized evasion mode" has three documented triggers: innate xenophobic temperament (rapid onset within hours), loud-noise events (fireworks, thunder, gunfire — Algarve fireworks during summer feast days are a high-risk trigger), and traumatic incidents (vehicle accident, explosion) [[lost-dog-behavior-kat-albrecht-missing-animal-response-network]]. The scientific basis for the never-chase rule rests on three converging mechanisms: adrenaline conditioning, olfactory shutdown, and predator-mimicry. Adrenaline conditioning is the mechanism by which calling, whistling, or eye contact during a flight state becomes a fear-conditioned trigger — the named MAR cases Lucy (10-264) and Lacey (10-267) document that calling a dog's name after even one or two failed approach attempts can become a flight trigger that fires for any voice, including the owner's [[never-call-a-lost-dog-missing-animal-response-network]] [[dont-call-your-dog-missing-animal-response-network]]. Olfactory shutdown is documented in MAR doctrine: during peak cortisol surge, the olfactory portion of the dog's brain effectively closes, meaning the owner's personal scent fails to trigger recognition during acute flight — food lures and scent articles are unreliable in this state [[dont-call-your-dog-missing-animal-response-network]]. Predator-mimicry is the third mechanism: direct eye contact, straight-line approach, and upright posture replicate the visual pattern of a stalking predator to a fear-aroused dog [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]].

The point at which active human searching becomes counterproductive is precisely the moment a dog has been pressured even once by a stranger or by repeated approach attempts. The Lost Dogs of America database (thousands of cases, 13 years) documents that the top three causes of death for lost dogs — vehicle strike, train, drowning — are all directly attributable to search pressure, with vehicle strike as the dominant cause [[never-follow-chase-or-pressure-a-lost-dog-lost-dogs-of-america]] [[shy-lost-dog-strategies-lost-dogs-of-america]]. The behavioral signals distinguishing evasion mode from approachable mode are observable at distance: a freeze response (stiff posture, dilated pupils, all four feet planted) precedes active flight in sighthounds, providing a brief window before the dog bolts [[2-fear-and-anxiety-greyhounds-as-pets]]; ears flattening, tail tucking, weight shifting to hindquarters, and a fixed stare at an escape route signal imminent flight; conversely, neutral ear position, relaxed tail carriage, sniffing toward the observer, and body weight forward signal an approachable state [[how-to-catch-a-dog-on-the-loose-whole-dog-journal]]. Survival-mode dogs typically do not bark — the "Silence Factor" is itself a key behavioral signature distinguishing displaced fearful dogs from settled gregarious ones [[interim-report-search-mode-temperament-sighting-protocol]]. Survival-mode dogs shift to crepuscular and nocturnal activity patterns, hunkering down silently during daylight in dense cover, drainage pipes, under porches, or in abandoned structures.

Documented recovery failures from incorrect owner behavior cluster around three behaviors: calling the dog's name (Lucy and Lacey cases), broadcasting sighting locations publicly (Winnie's 7-mile displacement; Princess's multi-state fatal displacement), and direct visual approach during sightings (Princess case; multiple LDOA cases). The Buddha Dog source documents a counterintuitive but consequential mechanism: familiar sights and smells — including the owner's voice or the family car — can drive a survival-mode dog OUT of a territory, because the dog associates "familiar" with "captured/pressured" rather than "safe" [[survival-mode-buddha-dog-rescue-recovery]]. This is the strongest single argument against owner-present searching in Phase 2: owner presence at a known sighting location can produce territory abandonment.

### Calibration Numbers

| Fear dynamics parameter | Value | Confidence |
|---|---|---|
| `xenophobic_evasion_onset_h` | 0–6 | medium-high |
| `blind_panic_evasion_onset_min` | 0–30 | high |
| `adrenaline_conditioning_threshold_failed_approaches` | 1–2 | medium-high |
| `olfactory_shutdown_duration_h` | 1–6 (acute peak) | medium |
| `cortisol_acute_peak_window_h` | 24–72 | high |
| `never_chase_rule_basis_mechanisms_count` | 3 (adrenaline + olfactory + predator-mimic) | high |
| `top_death_cause_rank_1` | vehicle_strike | high |
| `top_death_cause_rank_2` | train | high |
| `top_death_cause_rank_3` | drowning | high |
| `winnie_crowd_displacement_km_per_h` | 7 | high |
| `flight_signal_ears_back_weight` | 0.7 | medium |
| `flight_signal_tail_tucked_weight` | 0.7 | medium |
| `flight_signal_weight_on_hindquarters_weight` | 0.8 | medium |
| `flight_signal_fixed_stare_escape_route_weight` | 0.9 | medium |
| `approach_signal_neutral_ears_weight` | 0.6 | medium |
| `approach_signal_relaxed_tail_weight` | 0.6 | medium |
| `approach_signal_sniff_toward_observer_weight` | 0.8 | medium |
| `freeze_response_precedes_flight_sighthound_likelihood` | 0.85 | medium |
| `silence_factor_indicates_survival_mode` | True | high |
| `nocturnal_shift_indicates_survival_mode` | True | high |
| `familiar_scent_negative_association_in_survival_mode` | possible | medium |
| `calling_name_conditioning_irreversibility_d` | unknown — assume permanent | medium |

### Knowledge Gaps

The number of failed approach attempts required to establish full adrenaline conditioning is not quantified; practitioner sources suggest "even one" is risky, but no controlled study exists. The exact duration of olfactory shutdown post-acute-stress is inferred from veterinary cortisol pharmacokinetics, not measured directly in displaced dogs. The reversibility of fear-conditioning over long passive periods (e.g., 4+ weeks of feeding station presence without pressure) is suggested by case studies (Winnie's 69-day recovery via familiar dog after months of failed direct approaches) but is not quantified — does conditioning fully reset, partially reset, or never reset? The "familiar scent drives away" finding from Buddha Dog is practitioner-level observation, not empirical measurement. Whether breed-genetics or environmental conditioning is the primary driver of the freeze-vs-flight response in sighthounds is unresolved — racing greyhounds tend to freeze; trauma-history galgos tend to flee.

### Practical Encoding

```python
# Fear-state classifier from sighting body-language fields
FLIGHT_SIGNALS = {
    "ears_flat_back": 0.7,
    "tail_tucked": 0.7,
    "weight_on_hindquarters": 0.8,
    "fixed_stare_at_escape_route": 0.9,
    "trembling": 0.5,
    "dilated_pupils": 0.6,
    "frozen_stiff_posture": 0.6,  # precursor to flight in sighthounds
}
APPROACH_SIGNALS = {
    "ears_neutral_or_forward": 0.6,
    "tail_relaxed_or_loose_wag": 0.6,
    "sniffing_toward_observer": 0.8,
    "weight_forward": 0.7,
    "head_lowered_curious": 0.6,
    "lip_lick_or_yawn_calming": 0.4,
}

def classify_fear_state(body_language_report):
    flight_score = sum(FLIGHT_SIGNALS[s] for s in body_language_report.observed
                       if s in FLIGHT_SIGNALS)
    approach_score = sum(APPROACH_SIGNALS[s] for s in body_language_report.observed
                          if s in APPROACH_SIGNALS)
    net = flight_score - approach_score
    if net > 0.5:
        return "evasion"
    elif net < -0.5:
        return "approachable"
    else:
        return "ambiguous_default_to_evasion"  # asymmetric cost → conservative

# Owner-behavior risk warnings — surfaced to UI on intake
OWNER_BEHAVIOR_PROHIBITIONS = [
    {
        "behavior": "calling_dogs_name",
        "rule": "never_during_phase_1_or_2",
        "rationale": "adrenaline_conditioning — Lucy/Lacey cases",
        "exception": "only_if_dog_visibly_approaching_with_relaxed_body_language",
    },
    {
        "behavior": "direct_visual_approach",
        "rule": "never_for_xenophobic_galgo_or_phase_2_plus",
        "rationale": "predator_mimicry",
        "alternative": "oblique_45_degree_approach_no_eye_contact",
    },
    {
        "behavior": "running_toward_dog",
        "rule": "absolute_prohibition",
        "rationale": "biological_chase_response_overrides_recognition",
        "exception_none": True,
    },
    {
        "behavior": "broadcasting_sighting_location_on_social_media",
        "rule": "prohibited_for_xenophobic_galgo_podenco_phase_2_plus",
        "rationale": "Winnie_7mi_displacement; Princess_fatal",
        "alternative": "share_only_with_assigned_responder",
    },
    {
        "behavior": "owner_present_at_known_sighting_location",
        "rule": "discouraged_in_phase_2_for_fearful_dogs",
        "rationale": "familiar_stimulus_can_anchor_negative_territory_association",
        "alternative": "owner_scent_article_at_feeding_station_without_owner_present",
    },
    {
        "behavior": "group_search_party",
        "rule": "prohibited_for_xenophobic_or_phase_2_plus",
        "rationale": "top_3_death_causes_all_pressure_attributable",
        "alternative": "single_calm_individual_with_calming_signal_protocol",
    },
]

def emit_owner_warnings(case):
    warnings = []
    for rule in OWNER_BEHAVIOR_PROHIBITIONS:
        if applies_to_case(rule, case):
            warnings.append(rule)
    return warnings

# Approach protocol when owner is the responder and dog appears in approach state
APPROACH_PROTOCOL = {
    "body_position": "low_and_slow_sit_or_lie_flat",
    "eye_contact": "peripheral_only_never_direct",
    "approach_angle_degrees": 45,
    "vocalization": "lip_smacking_or_silent_never_dog_name",
    "food_delivery": "drop_at_distance_no_reaching",
    "patience_window_min": 45,  # Albrecht: 45min–1h+ for advance
    "abort_signals": ["dog_freezes_then_lowers_weight", "fixed_stare_at_escape"],
}
```

The owner-behavior warning surface is one of the most important UI deliverables in Nona because the published failure modes are owner-induced. The system should issue **structured, evidence-cited warnings at intake** that the owner must acknowledge: "Do not call your dog's name. Calling can become a conditioned flight trigger — documented in MAR cases Lucy and Lacey [[never-call-a-lost-dog-missing-animal-response-network]]. The mechanism is adrenaline conditioning, and once established, the trigger fires for your voice as well." Each prohibition should ship with a specific alternative action, because telling an anxious owner "don't search" without giving them a productive alternative produces non-compliance. The alternatives — set up a feeding station, distribute neon flyers without revealing sighting coordinates, file a coordinator-only sighting report — give the owner an outlet that does not compound the recovery problem. Approach protocol when approach is permitted (gregarious dog, Phase 1, visible relaxed body language) should be encoded as a step-by-step UI guide: get low, look sideways, drop food, wait 45 minutes minimum, abort on freeze.

---

## Forward Implications and Engineering Roadmap

Every parameter in this document carries a confidence rating, and the engineering implication is that Nona must be designed with **parameterized priors that the system itself refits from its operational data**. The published literature provides directional and structural confidence — the temperament-gated action framework, the dual-prior model for galgo, the never-chase doctrine — but the magnitudes of most parameters (Phase 1 cap durations, breed-specific search radii, λ values for civilian sighting reliability, fear-conditioning irreversibility windows) are inferred from adjacent domains or practitioner consensus rather than measured. The Algarve case database that Nona generates over the next 12–24 months will be the highest-value source for refining these parameters, because no peer-reviewed dataset of lost-galgo or lost-podenco GPS telemetry in Mediterranean scrubland exists in the literature. Build the engine such that every case outcome — days to capture, distance from loss point at capture, sighting reliability vs. confirmed location, breed-specific protocol vs. outcome — is logged in a structured form that supports quarterly parameter refits. The minimum viable refit cohort is 50 cases per breed × trigger combination; the engine should display lower-confidence warnings on prior values until that cohort accumulates.

The second forward implication is that Nona's data collection at intake must be designed around the **temperament classification problem**, not around general dog demographics. Owner-reported behavioral history with strangers is the single most diagnostically valuable input the engine receives, and it should be elicited via specific scenario questions (How does your dog react when a stranger comes to the door? When you take your dog to a vet, what happens when the vet approaches? Has your dog ever bolted from fireworks?) rather than via vague temperament labels. The C-BARQ instrument — Penn Vet's standardized canine behavioral assessment with a stranger-directed-fear subscale — provides the validated architecture for this elicitation and should be referenced when designing the intake flow [[interim-report-breed-prior-individual-vs-population]]. Combined with the escape-trigger classification (opportunistic gate, blind-panic noise event, prey-drive chase, wanderlust escape), the intake produces a four-dimensional case vector (temperament × breed × trigger × time-elapsed) that drives every downstream protocol decision. The third forward implication is that the engine should explicitly model **its own confidence in the case vector and update it as evidence accumulates**: the breed prior dominates until the first owner signal arrives, owner signals dominate until the first eyewitness sighting arrives, and trail-camera evidence dominates everything else. The action gate, however, remains breed-anchored throughout because the asymmetric cost of crowd-displacement-fatality justifies a conservative override even when probabilistic evidence suggests otherwise.

The final forward note is that the Algarve operational context — sparse human population, hot summers, rural mato scrubland with dense cover, the high prevalence of trauma-baseline galgos in the rescue ecosystem, the native podenco population with active hunting roles — likely shifts the population calibration meaningfully away from the Dallas (Kremer 2021) and Ohio (Lord 2007) urban-suburban baselines that dominate the published literature. Distance priors will likely extend further (sparse human encounters mean fewer pickup events). Phase transitions may extend longer (fewer pursuit triggers mean later survival-mode onset for gregarious dogs). Heat stress will force daytime hiding for ALL temperaments, confounding the "daytime hiding = survival mode" classifier. Nona's first 100 cases should be treated as calibration data, with explicit logging of weather conditions, terrain type, and human density at loss point, so that the Algarve-conditional priors can be refit against the populations and contexts that Nona actually serves.
