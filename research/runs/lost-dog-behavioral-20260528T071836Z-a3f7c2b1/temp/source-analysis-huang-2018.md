# Source Analysis — Search Methods Used to Locate Missing Cats and Locations Where Missing Cats Are Found

**Original source:** [[search-methods-used-to-locate-missing-cats-and-locations-where-missing-cats-are]]
**Source type:** paper
**Source word count:** 11,342
**Your judgment:** Empirical anchor for temporal recovery curve (probability-found-alive vs. days) and displacement-radius distribution for displaced companion animals; the only peer-reviewed quantitative source in the corpus establishing phase-transition thresholds applicable (with transfer caveats) to missing dog behavioral modeling.

*Suggested by [[search-methods-used-to-locate-missing-cats-and-locations-where-missing-cats-are]] — source analyst's digest of the full source body*

## Thesis / Central claim

Physical searching within the first week is the single most effective intervention for recovering a missing cat alive. Most cats are found very close to their escape point (75% within 500 m), and recovery probability front-loads sharply in the first 7–61 days then plateaus — establishing a clear temporal window beyond which interventions yield diminishing returns. Outdoor access history bifurcates the spatial distribution in a clinically meaningful way.

## Methodology / Basis of claims

Retrospective case series via online questionnaire (SurveyMonkey, June–August 2016). n = 1,210 missing-cat episodes recruited through Missing Pet Partnership social media, word-of-mouth, and website. Self-selected convenience sample with snowball sampling. Respondents globally (USA 59%, Australia 20%, Canada 14%, 12 other countries). Outcomes classified via four-question algorithm (Table 1). Time-to-found-alive modeled with competing risks survival analysis (Fine & Gray subdistribution hazard; Stata 14), treating found-dead as the competing event, with right-censoring for not-found cats. Distance comparisons by outdoor-experience category used Kruskal-Wallis + pairwise Wilcoxon rank-sum. Personality-trait vs. location associations used Kruskal-Wallis. Univariable only — no multivariable model for search-method effects, and no chronological ordering of methods used (a stated limitation).

Load-bearing assumptions: (1) self-selected participants over-represent highly bonded owners who searched harder, potentially inflating found-alive rates; (2) recall bias (median recall lag = 731 days / 2 years; 71% of cases > 6 months old); (3) search-method associations are confounded by timing — owners who advertised or contacted shelters likely did so after physical search failed, which explains the paradoxical negative association between advertising and being found alive.

## Key findings / Claims (with specific numbers where present)

1. **Temporal recovery curve — phase thresholds:**
   - 34% of missing cats found alive by day 7 (95% CI: 31–37%)
   - 50% found alive by day 30 (95% CI: 47–53%)
   - 56% found alive by day 61 (95% CI: 53–59%)
   - 61% found alive by 1 year (95% CI: 57–64%)
   - 64% found alive by 4 years (95% CI: 60–67%)
   - **Interpretation:** The survival curve is steep from 0–30 days, flattens markedly from day 61 onward. Incremental gain from day 61 to 4 years is only 8 percentage points — establishing ~day 60 as the practical ceiling for active recovery probability. Day 7 is the dominant early-phase threshold.

2. **Median time lost for found-alive cats:** 6 days (IQR: 2–21 days). Median time lost for not-found cats: 365 days (IQR: 35–1,096 days, i.e., right-censored).

3. **Displacement radius — headline:**
   - Median distance to find point: 50 m (IQR: 9–500 m), n = 477 cats found alive
   - 75th percentile: 500 m — so 75% of cats found within 500 m of escape point
   - Maximum: 25 km (2 outlier cases > 321 km excluded)

4. **Displacement radius — bifurcated by outdoor access:**
   - Indoor-outdoor cats (allowed outside unsupervised): median 300 m, 75th percentile 1,609 m (1 mile), n = 150
   - Indoor-only cats (strictly never outside): median 39 m, 75th percentile 137 m, n = 164
   - Difference statistically significant: p ≤ 0.001
   - Outdoor-only cats: median 183 m (not significantly different from indoor-only, p = 0.173), n = 15
   - **Practical implication:** Search radius of ~200 m likely sufficient for indoor-only animals; search must extend to ~2 km for outdoor-habituated animals.

5. **Physical search efficacy:**
   - Used in 96% of cases; associated with borderline higher alive-recovery rate (sub-hazard ratio 1.49, 95% CI 0.97–2.29, p = 0.071)
   - Most effective physical sub-methods (highest % of owners nominating as "helped most"): speaking with neighbors + asking them to search (57%), night search with flashlight (53%), methodical property-by-property search (51%), searching immediate yard (50%)
   - Calling cat's name used in 93% of cases; 38% of cats that responded came out meowing but did not approach; 15% came silently; 54% meowed back but stayed hiding — directly relevant to sound-lure protocol design

6. **Advertising and shelter contact — inverse association:**
   - Advertising: SHR 0.51 (95% CI 0.42–0.61), p < 0.001 (negative)
   - Facility/professional help: SHR 0.53 (95% CI 0.45–0.62), p < 0.001 (negative)
   - **Authors explicitly explain this as confounding by timing:** these methods are deployed after physical search fails, so the cats already had lower survival odds. This is not evidence that advertising is harmful — it is evidence of selection bias in a retrospective study without chronological data.

7. **Where found (alive cats):**
   - Outside: 83%
   - Inside someone else's house: 11%
   - Inside own house: 4%
   - Public building: 2%
   - Shelter/municipal facility: < 2%
   - Of those found outside: 19% waiting at own home/entrance; 20% in a yard; 16% under vegetation; 10% under patio/deck/porch; 4% in storm drain/sewer

8. **Personality trait — location predictor:**
   - Curious cats significantly more likely found inside neighbor's house (17% of score-5 "very curious" cats vs. 6% of score-1 cats), p = 0.005
   - Aloofness, cautiousness, timidity: no significant location association

9. **Shelter reclaim rates (background context):**
   - Cat reclaim rates at shelters: 2–4% (USA/Australia)
   - Dog reclaim rates: 26–40%, up to 90%
   - Cats 13x more likely to be reunited by non-shelter means (Lord et al. 2009)

10. **Microchip:** 46% microchipped; no statistically significant effect on found-alive rate (SHR 1.12, p = 0.331) — attributed to low shelter intake rates and microchip data quality issues (37% of chips have incorrect contact data per Lancaster et al. 2015).

11. **Behavioral state when found:** 10% acted feral/hissed; 50% appeared scared; 30% quiet but alert; 25% friendly/relaxed; 25% vocalizing; 9% sick or injured.

12. **Escape routes:** 74% of cats that were indoors escaped via open door/garage; 64% of outdoor cats escaped unsupervised. 51% of unfamiliar-location escapes occurred just after a house move.

## Load-bearing citations / sources this source depends on

- **Weiss, Slater & Lord (2012)** — "Frequency of lost dogs and cats in the United States and the methods used to locate them." *Animals* 2:301–315. — Establishes 15% of cat owners lose a cat in 5 years; foundational denominator for missing-pet prevalence.
- **Lord et al. (2007)** — "Search and identification methods that owners use to find a lost cat." *J Am Vet Med Assoc* 230:217–220. — Prior study on search methods; only prior empirical comparator identified by authors.
- **Lord et al. (2009)** — "Characterization of animals with microchips entering animal shelters." *J Am Vet Med Assoc* 235:160–167. — Source for 13x non-shelter reunification statistic; also for microchip data quality issues.
- **Lancaster et al. (2015)** — "Problems associated with the microchip data of stray dogs and cats entering RSPCA Queensland shelters." *Animals* 5:332–348. — 37% incorrect microchip data estimate.
- **Albrecht K. (2015)** — "Feline temperaments that influence distances traveled." Unpublished work. — Foundational personality typology used for the 1–5 trait scales. Not peer-reviewed; a direct dependency of the personality analysis.
- **Fine & Gray (1999)** — Competing risks regression method used for all survival analyses.
- **Johnson & Cicirelli (2014)** and **Levy et al. (2014)** — SNR/TNR program effectiveness; motivating policy context.

## Caveats, limitations, contradictions

1. **Self-selection bias (critical):** Recruited via Missing Pet Partnership social media — participants are systematically more bonded to pets (90% strongly attached, vs. 35–45% in general population surveys) and likely searched more intensively. Found-alive rates may be inflated relative to general population outcomes.

2. **Recall bias:** Median recall lag of 731 days; 71% of cases > 6 months old. Misclassification of search methods, timing, and distances is probable.

3. **No chronological search data:** Cannot determine which methods were used first. The confound between advertising/shelter-contact and reduced alive-recovery probability is the most important limitation for policy interpretation — the authors acknowledge this explicitly but cannot correct for it.

4. **Univariable analyses only:** Search method effects are not adjusted for any covariates. Multivariable models are called for in the Discussion but absent.

5. **Cat-to-dog transfer caveats (not stated in paper, analyst's note):** Cats are obligate territorial animals with hide-and-freeze displacement behavior; dogs have much larger ranging behavior, stronger pack/human bonding cues, and different stress responses. Temporal phase thresholds and displacement radii likely do not transfer directly. Dogs have higher shelter reclaim rates (26–40% vs. 2–4%), suggesting different behavioral trajectories. The personality-type / location finding may have partial analog in dog temperament research but is not validated.

6. **Global sample, not jurisdiction-specific:** Shelter holding periods, microchip infrastructure, and search culture vary enormously. Portugal/Algarve context (relevant to Nona/Red Cão) may differ from USA/Australia norms.

7. **Small dead-cat sample:** Only 17 cats found dead — distance and timing analyses for this group are underpowered.

8. **Outdoor-only cat sample:** n = 15, too small for robust conclusions.

## Relevance to research_query

This source is the **primary quantitative anchor** for temporal recovery decay in the research query's scope. The research brief explicitly names Huang et al. 2018 as "the closest empirical analog to what we need for dogs."

For the probabilistic behavioral engine (Nona/Red Cão), the source contributes:

- **Temporal phase curve:** The day-7 / day-30 / day-61 / day-365 thresholds are directly usable as prior probability inputs for a Bayesian recovery model, subject to dog-specific calibration. The shape of the curve (steep early, plateau post-day-60) is the main transferable structural finding.
- **Displacement radius by outdoor-access type:** The indoor-only vs. outdoor-access bifurcation maps cleanly onto dog history (indoor pet vs. working/outdoor dog), providing a prior for search-radius priors.
- **Search method ranking:** Physical search > advertising > shelter contact as effectiveness ordering is likely to transfer directionally (dogs also respond to physical presence and scent), but the specific percentages should not be used raw.
- **Behavioral state at finding:** 50% scared, 30% quiet/alert, 10% feral — relevant to designing approach protocols and trap deployment criteria in a dog rescue OS.
- **Personality-type → location predictor:** Curious cats found in neighbors' homes maps to curious/social dogs being more likely to approach strangers and be picked up; shy/fearful dogs more likely to be found hiding. This is transferable as a model feature.

What does NOT transfer: the 2–4% shelter reclaim rate (dogs reclaim at 26–40%+), the specific meter distances without dog-species adjustment, and the meow-based lure protocols.

## Extracted quotes

> "Of missing cats, approximately one-third (34%; 95% CI 31% to 37%) were found alive by day 7, 50% (95% CI 47% to 53%) by day 30, and 56% (95% CI 53% to 59%) by day 61. There was little increase in probability of being found alive after day 61."

The key temporal phase thresholds. The plateau language after day 61 is the most operationally important phrase.

> "The median distance was 50 m (25th and 75th percentiles 9 and 500 m, respectively) with the maximum distance being 25 km."

Baseline displacement distribution for found-alive animals. The 75th percentile (500 m) is the headline spatial bound.

> "Those cats that were indoor-outdoor and allowed outside unsupervised had longer distances compared with indoor cats that were never allowed outside (p ≤ 0.001). The median distance for indoor-outdoor cats was 300 m (25th and 75th percentiles 14 and 1609 m (i.e., 1 mile), respectively; n = 150 cats) and indoor-only cats was 39 m (25th and 75th percentiles 9 and 137 m, respectively; n = 164 cats)."

The bifurcated spatial distribution by outdoor-access history — the most directly transferable quantitative finding to dog search-radius modeling.

> "A physical search within the first week of a cat going missing could be a useful strategy."

Authors' bottom-line practical recommendation — note the cautious language ("could be useful") versus the strength of the day-7 threshold finding.

> "Of the 585 cats that were found and at least one behavior when found was reported, only a minority (10%) of cats hissed or acted in a manner of a feral cat. Most cats appeared scared (50%), quiet but alert (30%), and/or friendly/relaxed (25%). A quarter of cats were vocalizing or meowing when found, and 9% were sick or injured when found."

Behavioral state distribution at time of recovery — relevant to designing approach protocols for the rescue OS.

> "Cats were less likely to be found alive if any type of advertising were used, or if the owner contacted a facility or sought professional help at any stage... As these strategies are unlikely to reduce the probability of missing cats being found alive, these observed associations were probably due to selective implementation of these strategies more commonly when lost cats had not been found for some time."

Authors' self-correction on the advertising paradox — critical context for not misreading Table 5.

> "A larger radius of search may be required to find cats that are indoor-outdoor or outdoor-only under no supervision (distance traveled 1600 m for up to 75% of cats) compared with strictly indoor cats (distance traveled 137 m for up to 75% of cats)."

Direct recommendation linking outdoor-access history to search-radius calibration.
