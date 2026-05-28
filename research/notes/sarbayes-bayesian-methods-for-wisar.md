---
title: 'SARBayes: Bayesian methods for WiSAR'
id: sarbayes-bayesian-methods-for-wisar
tags:
- lost-dog-behavioral
- sarbayes
- bayesian-search-theory
- wilderness-sar
- probability-maps
created: '2026-05-28T07:31:08.395496Z'
updated: '2026-05-28T07:40:09.996397Z'
source: https://sarbayes.org/
source_domain: sarbayes.org
fetched_at: '2026-05-28T07:31:08.395343Z'
fetch_provider: builtin
status: review
type: note
tier: unknown
content_type: unknown
deprecated: false
summary: 'SARBayes is a research project applying Bayesian/statistical methods to
  wilderness search and rescue (WiSAR) using the International Search & Rescue Incident
  Database (ISRID). Key outputs: (1) Sava et al. (2016) ''Evaluating Lost Person Behavior
  Models'' in Transactions in GIS — evaluates predictive behavior models using ISRID
  data; (2) MapScore framework for evaluating probability maps against historical
  searches — the ISRID Distance Ring model scored 0.78 (95%CI: 0.74-0.82, n=376 cases)
  and a Combined Distance+Watershed model scored 0.81 (95%CI: 0.77-0.84); (3) Lognormal
  distance model fitted to ISRID Euclidean distance distributions by subject category;
  (4) survival probability modeling as function of age, temperature, and other features;
  (5) incident time distribution follows von Mises distribution centered near 5:30pm.
  The project generates probability maps of lost person location that update as search
  proceeds — directly analogous to the Bayesian sighting update problem.'
---

SARBayes: Bayesian methods for WiSAR
Skip to content
Introduction
The SARBayes project uses the International Search & Rescue Incident Database (ISRID) [1] to study and forecast lost person behavior. To augment the predictive power of the project's models, we can supplement sparsely populated fields in ISRID with other sources of data. For instance, given an incident's date and location, we can pull data from online application programming interfaces (APIs) to fill in missing values for weather conditions such as temperature and precipitation.
Continue reading
"Comparing Weather APIs"
Incident times follow a von Mises distribution centered near 5:30pm.
Introduction
One goal of the SARBayes project is to forecast the probability of survival for lost persons. Such models could be useful in deciding to continue searching, and researchers making motion models can use survival predictions when generating probability maps of the lost person's location. We are analyzing data from the
International Search & Rescue Incident Database
(ISRID) to describe the probability of survival as a function of various features, such as age or temperature.
Continue reading
"Fitting Incident Time to a Distribution"
The "Evaluating Lost Person Behavior" paper is now officially available in the online edition of Transactions in GIS.
The "Evaluating Lost Person Behavior" paper is now officially available in the online edition of
Transactions in GIS
.
Sava, E., Twardy, C., Koester, R., & Sonwalkar, M. (2016). Evaluating Lost Person Behavior Models.
Transactions in GIS
,
20
(1), 38–53. http://doi.org/10.1111/tgis.12143
Continue reading
""Evaluating LPB Models" Published"
Predictive GIS mapping and UAV search applied to stop poaching.
Click for
Air Shepherd article in KurzweilAI
.
And when the poachers know you are searching, you enter the realm of Search Game Theory.
The MapScore project described here provides a way to evaluate probability maps using actual historical searches.  On a metric where random maps score 0 and perfect maps score 1, the ISRID Distance Ring model scored 0.78 (95%CI: 0.74-0.82, on 376 cases). The Combined model was slightly better at .81 (95%CI: 0.77-0.84).
Our MapScore paper is now in press at
Transactions in GIS!
From the abstract:
The MapScore project described here provides a way to evaluate probability maps using actual historical searches.  In this work we generated probability maps based on the statistical Euclidean distance tables from ISRID data (Koester, 2008), and compared them to Doke’s (2012) watershed model. Watershed boundaries follow high terrain and may better reflect actual barriers to travel. We also created a third model using the joint distribution using Euclidean and watershed features. On a metric where random maps score 0 and perfect maps score 1, the ISRID Distance Ring model scored 0.78 (95%CI: 0.74-0.82, on 376 cases). The simple Watershed model by itself was clearly inferior at 0.61, but the Combined model was slightly better at .81 (95%CI: 0.77-0.84).
Continue reading
"Forthcoming MapScore Paper!"
Do you happen to have an infrared WiSAR detector for cold weather?
USCG wants a portable infrared WiSAR detector.
This RFI
was posted on 2-OCT:
The Coast Guard Research and Development Center (RDC) is conducting market research to identify technologies that are suitable for conducting IR searches on foot for persons on frozen waterways. The parameters include detection capabilities of one mile, and recognition capabilities at one-half mile, and identification at approximately one-quarter mile by personnel on foot (monopod is possible). The parameters also include the need to function in extremely cold temperatures, be temporarily submersible, and function regardless of weather conditions or the time of day/night for IR detection.
The odds continually updated:
This article on Bayes & search theory
made it to the top of the NYT "most emailed" list last night.
Eric Cawi
A logical extension of the Distance Rings model is to fit a smooth function to the distribution of data found in ISRID. Examining the Euclidean Distance data for different categories, it was found that a lognormal curve roughly captured the shape of the data. The Log-Normal (LN) is a two parameter distribution which assumes that the logarithm of your data follows a normal distribution. The probability density function of the LN curve is given by, where are the mean and standard deviation of the logarithm of distance.
Continue reading
"The Lognormal Distance Model"
Thanks very much to summer intern Jonathan Lee (@
jonathanlee1
) for many MapScore fixes.  Jonathan is a keen Python programmer with extra geek points for running Linux on his Macbook Air and having an ASCII-art avatar.  He learned his way around Django in no time and brought us a slew of features and code refactoring including:
Continue reading
"MapScore Updates Summer 2014"
One of our
SciCast
forecasters
posted
an excellent analysis of how he estimated the (remaining) chance of success for Bluefin-21 finding MH370 by the end of the question.
Forecast trend for Bluefin-21 success, on SciCast.
Jkominek was wondering why the probability kept jumping up, and created a Bayes Net to argue that there was no good estimation reason for it.  (There may be good market reasons -- cashing in to use your points elsewhere.)
Bayes net model created by jkominek to explore the Bluefin question.
The full blog post is here:
http://blog.scicast.org/2014/06/11/scicast-bluefin-21-and-genie/