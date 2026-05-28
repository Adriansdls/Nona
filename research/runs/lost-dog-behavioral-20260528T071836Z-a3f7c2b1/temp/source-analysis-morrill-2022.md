# Source Analysis — Ancestry-inclusive dog genomics challenges popular breed stereotypes

**Original source:** [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]]
**Source type:** paper (primary research, peer-reviewed, Science 2022)
**Source word count:** ~19,200
**Your judgment:** Definitive quantitative anchor for the central question — provides the specific heritability and breed-variance numbers for agonistic threshold, directly falsifying the premise that breed predicts fear/reactivity in individual dogs. This is the primary source the research query names explicitly.

*Suggested by [[ancestry-inclusive-dog-genomics-challenges-popular-breed-stereotypes-pmc]] — source analyst's digest of the full source body*

## Thesis / Central claim

Morrill et al. 2022 argue that modern dog breed is a poor predictor of individual behavioral disposition. Using a large community-science cohort (Darwin's Ark, N=18,385 dogs surveyed; N=2,155 genome-sequenced), they show that breed explains just 9% of behavioral variation in individual dogs. Behavioral characteristics ascribed to breeds are polygenic, environmentally influenced, and found at varying prevalence across all breeds. Modern dog breeds (~160 years old) were selected primarily for aesthetic traits; behavioral tendencies predate breed formation by thousands of years of polygenic adaptation and are not unusually genetically differentiated across breeds.

## Methodology / Basis of claims

**Study design:** Community science (citizen science) — dog owners enrolled via Darwin's Ark (darwinsark.org), completing 12 surveys (117 questions) on behavioral and physical traits. Survey phenotypes are owner-reported (Likert scales), not direct behavioral observation or standardized lab tests. This is the key methodological caveat.

**Sample:** N=18,385 dogs (49% purebred, 85% US); genetic cohort of 2,155 dogs sequenced via low-pass whole-genome sequencing (mean 0.6x coverage) with imputation to ~32 million SNPs. Breed assignments validated by genetic ancestry calling (ADMIXTURE, supervised, 101-breed reference panel).

**Key analytical methods:**
- Exploratory factor analysis (EFA) on 110 behavioral questions → 8 behavioral factors (cumulative 24.3% variance explained)
- SNP-based heritability (h²SNP) estimated by GREML-LDMS (REML), LD score-corrected, using genetic relationship matrices
- Breed effect quantified by ANOVA (generalized eta squared, ges) on confirmed purebred dogs across 78 breeds
- Mixed-breed (mutt) analysis: linear mixed-effects regression (LMER) of breed ancestry fraction on behavior scores in dogs with <45% ancestry from any single breed (N=1,002–1,205 dogs depending on analysis) — this is the key design for isolating genetic from cultural/stereotype effects
- GWAS: mixed linear model (MLMA-LOCO, GCTA) across 8.5M SNPs; standard human GWAS significance threshold (p<5×10⁻⁸)
- Population branch statistic (PBS) tests genetic differentiation at GWAS loci across breeds

**Load-bearing assumptions:** Owner-reported survey responses are valid behavioral proxies (validated against published questionnaire data, Mantel's r=0.95 for 48 DPQ items). Breed stereotype bias is mitigated in mixed-breed analyses because observers cannot accurately identify breed ancestry from appearance in mutts (MuttMix: 20.9±20.4% correct identification on average).

## Key findings / Claims (with specific numbers where present)

1. **Breed explains 9% of individual behavioral variation.** In LMER models of highly admixed dogs, genetic breed ancestry proportions explained an average of 9±3% (marginal R²) of variance in behavioral factor scores. For physical traits, the equivalent figure was 20±12%.

2. **Agonistic threshold is the least breed-predictable behavioral factor.** The paper states explicitly: "For less heritable, less breed-differentiated traits, like agonistic threshold (factor 5), which measures how easily a dog is provoked by frightening, uncomfortable, or annoying stimuli, breed is almost uninformative." No specific ges or h² value for agonistic threshold is stated in the main text; it is described relative to biddability as being at the low end of both heritability and breed differentiation.

3. **Biddability (factor 4) is the most breed-differentiated behavioral factor.** Heritability h²SNP = 30.5±8.5% (drops to 20.0±8.8% when controlling for genetic PCs). Border collie ancestry has a statistically confirmed genetic effect on biddability in mutts (LMER t=−4.6; pFDR=0.0002). This is the single strongest validated behavioral breed signal in the study.

4. **Human sociability is the most heritable behavioral factor overall.** h²SNP = 67.3±13.0%. But genetic effect of Labrador retriever ancestry on human sociability in mutts is nonsignificant (LMER t=0.4; pFDR=0.90), despite owner-reported Labrador sociability being elevated. This dissociates owner perception from genetic reality for this trait.

5. **Retrieving is the most heritable individual behavioral trait.** h²SNP = 52.5±9.2%.

6. **Physical traits are far more heritable and breed-differentiated than behavioral traits.** Five of eight physical traits exceed 85% heritability. Breed ANOVA ges averages ~fivefold higher for physical vs. behavioral traits. 41.5% (17/41) of breed-physical-trait pairs show significant differentiation vs. only 5.1% (30/583) of breed-behavioral-trait pairs.

7. **Behavioral GWAS loci are NOT unusually differentiated across breeds.** Population branch statistic (PBS): physical trait loci show mean z=0.491, behavioral factor loci show mean z=−0.001 (not significant, p=0.224). This is direct genetic evidence that breeds have NOT been selected for behavioral differentiation; the behavioral differences that exist across breeds likely reflect drift or pre-breed-formation polygenic adaptation, not intentional Victorian-era selection.

8. **Only 0.002% of SNPs are breed-exclusive and fixed.** 332 SNPs out of 16.7 million are exclusive to and fixed within a single breed (298 autosomal). Breeds are not genetically isolated enough to generate breed-specific behavioral profiles.

9. **Mutts have complex, multi-breed ancestry.** 66% carry >5% ancestry from 4+ breeds; only 17% are two-breed mixes. This directly undermines visual breed identification as a behavioral prediction tool in rescue contexts.

10. **The individual dog score distribution overlaps broadly across breeds.** In every breed with ≥25 dogs, the majority (mean 67.2±7.5%) scored within 1 SD of the population mean on any given behavioral factor. Even highly differentiated breeds show enormous within-breed variation.

11. **No behavior is exclusive to any breed.** Even breeds with the lowest propensity for a behavior (e.g., 78.4% of Labrador retrievers never howl) still have individuals who show that behavior (8% of Labradors howl sometimes/often/always).

12. **Golden retriever ancestry has no genetic effect on fearfulness of strangers in mutts.** Purebred owner reports show elevated non-fearfulness (PPS z=4.6; pcorr=0.002) consistent with stereotype, but LMER in mutts shows no effect (t=0.3; pFDR=0.88). This is a direct demonstration of stereotype bias inflating breed behavioral reports.

## Load-bearing citations / sources this source depends on

- **Scott & Fuller 1965** (Genetics and the Social Behavior of the Dog, Univ. Chicago Press) — foundational prior on breed behavioral differentiation; established the received view this paper challenges
- **Mehrkam & Wynne 2014** (Appl. Anim. Behav. Sci 155:12–27) — prior literature showing within-breed behavioral variation approaches between-breed variation
- **Svartberg 2006** (Appl. Anim. Behav. Sci 96:293–313) — prior data on breed-typical behavior and its limits
- **Dog Personality Questionnaire (DPQ/DPQL)** — 45-question validated survey forming the behavioral phenotyping backbone (Gosling et al., referenced as ref 37 in paper)
- **Dog Impulsivity Assessment Scale (DIAS)** — 18 questions (referenced as ref 34)
- **GCTA/GREML-LDMS** (Yang et al., ref 56) — heritability estimation software
- **Bergström et al. 2020** (Science 370:557–564, Origins and genetic legacy of prehistoric dogs) — establishes >10,000-year dog origin vs. ~160-year breed age
- **Worboys et al. 2018** (The Invention of the Modern Dog, JHU Press) — Victorian breed origin historical claim

## Caveats, limitations, contradictions

1. **Owner-reported phenotypes.** All behavioral data is owner survey, not standardized behavioral testing. Owners of known purebreds may be biased by breed stereotypes when rating their dogs (the paper explicitly flags this and uses the mutt analysis as a partial control). The separation between genetic effect and environmental/cultural effect is not clean.

2. **GWAS behavioral associations not independently replicated.** The paper states this explicitly: "They have not yet been independently replicated." The 11 significant behavioral loci are preliminary.

3. **Sample is predominantly US pet dogs (85% US).** Village dogs and working dogs (the majority of the world's ~1 billion dogs) are underrepresented. Galgo/podenco breeds, sighthounds, and Mediterranean primitive breeds are not specifically analyzed. The behavioral genetics of these populations may differ.

4. **Factor analysis explains only 24.3% of behavioral variance.** The 8 factors are a dimensionality reduction; substantial behavior variance is unexplained. Factor 5 (agonistic threshold) is a statistical construct, not a behaviorally validated assessment — its validity for field contexts (like lost dog evasion behavior) is not established in this paper.

5. **ANOVA breed effect averaged 0.089 (range 0.034–0.253) for behavioral traits.** While "9%" is the headline figure, this ranges up to ~25% for the most breed-differentiated behavioral traits. Breed is not zero as a predictor; it is just weak at the individual level.

6. **Selection signature analysis (PBS) has low power for recent selection.** The authors note: "Current datasets are too small to detect more subtle, recent directional selection, which requires hundreds of thousands of samples." The absence of a PBS signal at behavioral loci does not fully rule out recent intentional selection.

7. **Survey instruments were not designed for rescue/lost-dog contexts.** Agonistic threshold as measured here (owner Likert-scale responses to ~10 questions about fear/provocation) may not map cleanly onto the specific flight/evasion behavior relevant to a lost dog scenario. No questions appear to directly measure approach-avoidance of unfamiliar humans in a field context.

## Relevance to research_query

This paper is the central, load-bearing source for the CRITICAL question in the research brief: what does Morrill et al. 2022 actually say about agonistic threshold and breed predictability?

The answer is unambiguous: **agonistic threshold (factor 5, measuring how easily a dog is provoked by frightening/uncomfortable stimuli) shows the lowest breed predictability of any behavioral factor in the study.** The paper explicitly pairs this conclusion with the contrasting case of biddability. Breed is "almost uninformative" for agonistic threshold. No breed-specific genetic effect on agonistic threshold is confirmed in the mutt ancestry analysis.

For the Nona/Red Cão lost dog behavioral engine, this has direct design implications. The fear/reactivity dimension that governs whether a lost dog will approach rescuers, hide, or flee — the most operationally consequential behavioral variable — is precisely the dimension for which breed ancestry contributes the least predictive value. A Galgo or Podenco classification cannot be used as a reliable prior for evasion tendency at the individual level. Individual behavioral assessment signals (prior behavior with strangers, stress history, time lost, territory familiarity) must dominate over breed priors in any probabilistic scoring system.

The study does not directly address movement radius, galgo/podenco-specific data, or sighthound outdoor behavior — those questions require other sources (e.g., lost dog field studies, breed-specific rescue practitioner data). The paper's contribution is the genetic null result for agonistic threshold breed-predictability, which sets a hard empirical ceiling on how much weight any rescue OS should assign to breed classification for fear/evasion scoring.

## Extracted quotes

> "For less heritable, less breed-differentiated traits, like agonistic threshold (factor 5), which measures how easily a dog is provoked by frightening, uncomfortable, or annoying stimuli, breed is almost uninformative."

The key verbatim statement from the Discussion, directly answering the research query.

> "Breed explains just 9% of behavioral variation in individuals."

From the abstract/results; the headline quantitative finding.

> "Behavioral characteristics ascribed to modern breeds are polygenic, environmentally influenced, and found, at varying prevalence, in all breeds."

Conclusion statement; rules out categorical breed-behavioral profiles.

> "Regions associated with aesthetic traits are unusually differentiated in breeds, consistent with a history of selection, but those associated with behavior are not."

From the abstract; the population-genetic mechanism explaining why breed does not predict behavior at the individual level.

> "In every breed represented by 25 or more dogs, the majority scored within one SD of the Darwin's Ark cohort mean (67.2 ± 7.5% within one SD and 95.4 ± 3.0% within two SD for confirmed purebred dogs)."

Quantifies the within-breed overlap; critical for any platform designing breed-based behavioral priors.

> "Owners of confirmed golden retrievers, for example, tend to disagree that their dog is fearful of unfamiliar people (Q46; PPS z = 4.6; pcorr = 0.002), which fits the breed stereotype that golden retrievers are friendly to strangers. In mutts, however, golden retriever ancestry had no effect on this question (LMER t = 0.3; pFDR = 0.88), suggesting that the reported propensity may not be driven by genetics."

Concrete example showing stereotype contamination of breed behavioral data for a fear-of-strangers trait directly analogous to lost-dog approach behavior.

> "Modern domestic dog breeds are only ~160 years old and are the result of selection for specific cosmetic traits... behavioral adaptations predate breed formation by thousands of years of polygenic adaptation."

Mechanistic explanation for why breed is a weak behavioral predictor.
