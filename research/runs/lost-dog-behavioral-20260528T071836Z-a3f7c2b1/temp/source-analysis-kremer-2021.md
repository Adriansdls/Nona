# Source Analysis — A New Web-Based Tool for RTO-Focused Animal Shelter Data Analysis

**Original source:** [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]]
**Source type:** paper
**Source word count:** 9,155
**Your judgment:** Primary quantitative anchor for distance priors in Nona's scoring engine — provides the only large-n (n=30,609) peer-reviewed distance distribution for lost dogs, with exact percentage breakdowns at the 400 ft and 1-mile thresholds, plus microchip RTO uplift factors and LOS recovery curves directly encodable as priors.

*Suggested by [[frontiers-a-new-web-based-tool-for-rto-focused-animal-shelter-data-analysis]] — source analyst's digest of the full source body*

## Thesis / Central claim

Lost stray dogs in Dallas (FY2019, n=30,609) overwhelmingly remain close to home: 70% of RTOed strays were found within 1 mile of their owner's address, and 42% within 400 feet (~one city block). Microchip presence is the single largest controllable predictor of RTO success, nearly doubling the RTO rate (71% vs. 39% for comparable healthy adult at-large strays). The paper presents a reproducible Shiny-based web dashboard enabling any shelter to replicate this spatial analysis from their own CSV export.

## Methodology / Basis of claims

**Dataset:** All dogs admitted to Dallas Animal Services (DAS) in fiscal year 2019 (October 1, 2018 – September 30, 2019): n=30,609 total (after removing 50 with missing intake ZIP), of which n=20,763 were strays and n=10,035 were RTOs.

**Distance analysis:** Filtered to RTO strays with distinct intake (found) and outcome (owner) addresses — n=5,228 after excluding 4,778 with identical addresses (field officer data entry artefact) and 80 with erroneous/out-of-state owner addresses. Geodesic distance computed via R's `Imap` package (latitude/longitude pairs from geocoded addresses). Walking-distance via Google Maps API was tested but rejected as more error-prone. Distances plotted as histogram; ZIP-level medians plotted on choropleth maps.

**Microchip RTO analysis:** Chi-square test on a 2×2 contingency table. To control for confounders, restricted to healthy, at-large adult strays (n=13,794). Puppies excluded (lower RTO base rate), "possibly owned" strays excluded (higher base rate regardless of chip). Test repeated seven times, once per high-intake ZIP code (smallest sub-group: n=1,015), to control for geographic/accessibility confounders.

**Length of stay (LOS):** Restricted to healthy adult at-large strays across three outcome groups: Shelter RTO (n=2,400), adoption (n=3,916), transfer (n=1,210). LOS adjusted by subtracting the 5-day mandatory hold period to isolate post-hold behavior.

**Load-bearing assumption:** Distance is measured owner-address to found-address (not roaming path). Dogs with identical addresses (46% of RTOs) are excluded — the 70%/42% figures apply only to the subset with meaningfully distinct addresses. This is a geodesic straight-line distance, not actual travel route.

## Key findings / Claims (with specific numbers where present)

1. **70% within 1 mile.** Of 5,228 RTO strays with distinct intake and outcome addresses, 70% were found no more than 1 mile from their owner's address.

2. **42% within one city block (~400 ft).** Of the same population, 42% were found within 400 feet of home. The paper phrases this as "60% of the 70%" — meaning 60% of the within-1-mile group (42% of all) went under 400 ft.

3. **Geographic variation: north vs. south Dallas.** Dogs found in northern Dallas ZIP codes had median distances of 1.5–2.5 miles; southern ZIP codes (higher density, most stray intake) had median distances of 0–0.5 miles. Outliers (90th percentile) in northern ZIPs still typically stayed within the same ZIP code.

4. **Microchip effect — controlled comparison.** Healthy adult at-large strays with microchip: 71% RTO rate (2,744/3,867). Without microchip: 39% RTO rate (3,213/8,311). Chi-square: χ²=1,101, df=1, p<0.001. Effect held across all high-intake ZIP codes (range: 39–45% no-chip vs. 71–75% chip).

5. **Microchip effect — naïve comparison.** All strays (excluding 2,013 with unknown status): 70% RTO with chip (3,971/5,691) vs. 33% without (4,265/13,032).

6. **Only 30% of strays had microchips.** City-wide microchip rate among stray intakes = 30%. Highest-intake ZIP code (75217) was among the lowest microchip rate areas.

7. **LOS: 91% of Shelter RTOs reclaimed within the 5-day hold period.** Post-hold LOS median = 0 days; 90th percentile = 0 days. Effectively 99% of Shelter RTOs reclaimed within 5 days after hold.

8. **Comparative LOS — non-RTO outcomes.** Adoption: median post-hold LOS = 2 days, 90th percentile = 16 days, 24% stayed ≥7 days. Transfer: median = 1 day, 90th percentile = 17 days, 23% stayed ≥7 days.

9. **LOS uniform across geography.** Shelter RTO LOS varied by <1 day across owner ZIP codes — owners across the city retrieve their pets at the same speed once they know where the dog is.

10. **RTO rate for Dallas strays: 48%.** Of n=20,763 strays, n=10,035 RTOed (48%), substantially above the nationwide 2019 baseline of 39% across 3,226 SAC-reporting organizations.

11. **National RTO baseline (2019, SAC data, n=3,226 orgs).** Government animal services (n=460): 39% RTO rate. Shelter/rescue with govt. contract (n=425): 44%. Private shelter/rescue (n=2,341): 30%. Overall: 39%. These figures include RTOs across all intake types, so they overstate stray-specific RTO rates.

12. **4,778 of ~10,000 RTOs had identical intake/outcome addresses (47%).** These are excluded from the distance analysis — they represent field RTOs where the officer used a standardized address rather than actual found location. This is a data quality artifact, not a behavioral finding.

13. **ZIP code 75217 — highest intake, below-average microchip rate.** Identified as the priority target for microchip intervention programs. 63% of all strays came from seven labeled southern ZIP codes.

14. **Breed/size not analyzed for distance.** The paper restricts breed analysis to pure vs. mixed breed status for microchip comparisons only. No distance-by-breed or distance-by-size breakdown is provided.

## Load-bearing citations / sources this source depends on

- **Lord et al. (2009)** — "Characterization of animals with microchips entering animal shelters," JAVMA 235:160–7. n=3,425 stray dogs from 53 US shelters; median RTO 52% for microchipped vs. 22% overall. Primary US comparator for the microchip finding.
- **Lancaster et al. (2015)** — RSPCA Queensland, n=7,258 adult strays; 80% RTO for chipped vs. 37% without. Australian comparator.
- **Zak et al. (2018)** — Czech Republic 10-year study; 77% RTO for chipped (1,056/1,379) vs. 42% non-chipped (1,295/3,076). Pre/post mandatory microchip decree.
- **Weiss et al. (2012)** — Survey estimating 15% of dogs get lost at least once; ~766,000 dogs never reunited annually. Motivation for RTO improvement.
- **Shelter Animal Counts (SAC), 2019** — National RTO baseline data; n=3,226 reporting organizations. Used for the Table 1 national statistics.
- **Scarlett (2013)** — "Population Statistics" in *Shelter Medicine for Veterinarians and Staff*. Methodological guidance for RTO rate definition; notes that excluding stray puppies is a more conservative definition.
- **R Imap package** — Distance calculation method; geocoding-based geodesic distance. Not an independent dataset but a methodological dependency.

No non-replicated proprietary dataset: the DAS data is owned by Dallas Animal Services (contact: tom.kremer@minerva.kgi.edu for access requests). The distance and microchip findings have been replicated across multiple countries.

## Caveats, limitations, contradictions

1. **Distance is straight-line, not behavioral roaming path.** The 400 ft / 1 mile thresholds are geodesic owner-to-found distances for dogs that were *successfully returned*. They do not describe how far a dog roamed before being found — a dog may have traveled 5 miles but been located 0.4 miles from home.

2. **Selection bias: only RTOed dogs.** The distance distribution captures only the 48% of strays that were RTOed. The 52% that were not RTOed are absent — presumably some were farther from home or had no owner to return to, which would shift the true "lost dog distance" distribution rightward.

3. **47% of RTOs excluded from distance analysis.** The 4,778 dogs with identical intake/outcome addresses are dropped. If field officers systematically use standardized addresses for dogs found very close to home, the 42%/70% figures may be *over-estimates* of true proximity. If they use standardized addresses uniformly regardless of found location, the exclusion is unbiased.

4. **Urban US context.** Dallas is a large US city with specific density patterns (high stray density in dense southern neighborhoods). The 0–0.5 mile median for southern ZIPs vs. 1.5–2.5 miles for northern ZIPs likely reflects housing density. Portuguese Algarve context has different density and topology — direct quantitative transfer requires calibration.

5. **No temporal dimension.** The paper reports where dogs were found, not when. There is no time-since-escape breakdown — the distance priors cannot be conditioned on hours or days elapsed without additional sources.

6. **No breed/size breakdown for distance.** The study explicitly restricts breed analysis to pure vs. mixed for the microchip section. No distance-by-breed, distance-by-size, or distance-by-age data is provided.

7. **Microchip registration quality unknown.** The comparison is "chip present vs. no chip," not "chip with correct data vs. incorrect data vs. no chip." The paper acknowledges this as a limitation — actual causation likely includes registration accuracy, which this study cannot test.

8. **Single shelter, single fiscal year.** DAS FY2019. The paper acknowledges DAS's RTO rate (48%) is anomalously high relative to the national 39% baseline, suggesting DAS may not be fully representative.

9. **Stray hold period policy affects LOS.** DAS's 5-day hold for adult dogs with ID, 3-day for no ID, 1-day for 4–6 months, none for puppies. The 91% within-hold-period finding is specific to this policy — a shelter with a 3-day hold would show a different within-hold reclaim rate.

## Relevance to research_query

This is the primary quantitative anchor for the research brief's distance prior requirements. The 70%-within-1-mile and 42%-within-400-ft figures are directly encodable as CDF breakpoints for Nona's distance scoring engine. The geographic variation finding (northern/lower-density areas: 1.5–2.5 miles median vs. southern/higher-density: 0–0.5 miles) maps onto an adjustable density prior — Algarve rural zones should use the northern Dallas profile as a rough analogue, not the southern. The microchip RTO uplift (71% vs. 39%, a 1.82× multiplier) is a clean Bayesian prior for microchip status as a covariate. The LOS data (91% within-hold, median 0 post-hold) establishes that urgency is highest in the first 5 days and decays sharply thereafter — directly useful for Nona's alert prioritization decay function. What this source does NOT provide: temporal distance curves (how far a dog is found as a function of time since escape), breed/size distance modifiers, or behavioral phase transitions. Those require separate sources.

## Extracted quotes

> "70% of RTOed strays traveled at most 1 mile away from home and 42% up to block away, and that at-large, adult strays that had a microchip had a 71% RTO rate compared with 39% without one."

Abstract statement of the two headline numbers — the only place both appear together in one sentence.

> "Of the other 5,228, 70% of dogs are not found beyond 1 mile away from their owner address. Figure 4 zooms into the 70% of dogs that walk under 1 mile. Of these 70, 60, or 42% of all dogs, go <400 ft away from their owner address (an estimate of an average city block)."

Results section. Clarifies that 42% = 60% of the 70% — the nested percentage structure that must be preserved when encoding priors.

> "Dogs found in the northern part of the city tend to travel farther away from home (1.5–2.5 miles) than those in the southern ZIP codes (around 0–0.5)."

Figure 5 caption / results narrative. The geographic stratification finding for density-adjusted distance priors.

> "71% RTO rate for strays with a microchip compared with 39% for non-microchip (Table 3; χ²= 1, 101, df= 1, p< 0.001). The increase in the non-microchip rate was likely due to the exclusion of puppies and 'possibly owned' strays."

Results section, microchip question. The controlled comparison with the statistical test values.

> "91% of dogs were reclaimed during the 5-day hold stray period; hence, the median and 90th percentile values of 0 were post-hold LOS."

Results section, LOS. The within-hold reclaim rate and the post-hold LOS collapse.

> "Across the entire city, 30% of strays were found with microchips."

Results section. City-wide microchip prevalence — important for base-rate correction of the microchip prior in Nona's intake form.

> "DAS's data were remarkably rich and complete, which enabled all sections of this analysis, but this may not be present for all shelters."

Discussion / limitations. Author's own caveat on generalizability — relevant when considering whether Portuguese shelter data would support a similar analysis.
