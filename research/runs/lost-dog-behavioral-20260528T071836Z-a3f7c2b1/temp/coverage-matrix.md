# Coverage Matrix — query phrase → atomic item mapping

| Query phrase (verbatim) | Mapped atomic item(s) | Scope check | Gap? |
|---|---|---|---|
| "behavioral phase transitions in lost dogs" | SQ1, SQ2, SQ3 | Full scope — all three sub-questions cover phases | No |
| "Kat Albrecht / Missing Animal Response" | Entity: MAR | Full — in entities with required fields | No |
| "Lord 2007 JAVMA" | Entity: Lord 2007 JAVMA study | Full — primary source with required fields | No |
| "0–24h panic, 24h–7d survival, 7d+ recovery" | SQ2, SQ3 | Full — thresholds and signatures captured | No |
| "hour/day thresholds does behavior typically shift" | SQ2 | Full | No |
| "behavioral signatures of each phase" | SQ3 | Full — movement radius, activity timing, stimuli response, feeding behavior all named | No |
| "fear/stress level at time of loss" | SQ4 | Full — phase progression modulation captured | No |
| "percentage of dogs found alive…in each phase" | SQ5 | Full | No |
| "breed category: sighthounds (galgo, greyhound)" | SQ6, SQ7, Entity: Sighthounds | Full | No |
| "scent hounds (podenco, beagle)" | SQ6, SQ7, Entity: Scent hounds | Full | No |
| "toy breeds" | SQ6, SQ7, Entity: Toy breeds | Full | No |
| "herding breeds" | SQ6, SQ7, Entity: Herding breeds | Full | No |
| "guardian breeds" | SQ6, SQ7, Entity: Guardian breeds | Full | No |
| "mixed/unknown" | SQ6, SQ7, Entity: Mixed/unknown breeds | Full | No |
| "movement radius by day" | SQ7, required_fields in all breed entities | Full | No |
| "tendency to approach humans vs hide" | SQ7 | Full | No |
| "tendency to follow roads vs terrain" | SQ7 | Full | No |
| "typical survival behavior" | SQ7 | Full | No |
| "galgo behavior when lost" | SQ8, Entity: Galgo | Full — trauma baseline, evasion behavior explicitly in required_fields | No |
| "podenco behavior when lost" | SQ9, Entity: Podenco | Full — prey drive impact explicitly in required_fields | No |
| "Albrecht 2002" | Entity: Albrecht 2002 | Full — primary source entity | No |
| "published studies comparing breed-type outcomes" | SQ10 | Full — recovery rate, distance found, method of recovery named | No |
| "Missing Animal Response / professional lost dog recovery incorporate new sighting data" | SQ11, Entity: MAR | Full | No |
| "frameworks for weighing sighting reliability" | SQ12 | Full — eyewitness accuracy, distance estimation, timing accuracy named | No |
| "confirmed sighting at time T update…position distribution at time T+12h" | SQ13 | Full — temporal position update mechanics captured | No |
| "sighting reliable vs unreliable" | SQ14 | Full — description specificity, distance, lighting, observer type named | No |
| "flight response loop" | SQ15, SQ18, SQ19 | Full — evasion mode triggers, behavioral signals, failure cases all captured | No |
| "traumatized evasion mode" | SQ15, SQ18 | Full | No |
| "never chase rule" | SQ16 | Full — scientific basis specifically requested | No |
| "active searching become counterproductive" | SQ17 | Full | No |
| "behavioral signals indicate…evasion mode vs approachable" | SQ18 | Full | No |
| "recovery failure caused by incorrect owner behavior" | SQ19 | Full | No |
| "key empirical findings" | required_formats: subsection naming | Full | No |
| "calibration numbers" | required_formats: quantitative encoding requirement | Full | No |
| "knowledge gaps" | required_formats: empirical vs anecdotal distinction | Full | No |
| "practical encoding" | required_formats: scoring/weighting system representation | Full | No |
| "ASPCA research" | Entity: ASPCA | Full | No |
| "Missing Pet Partnership resources" | Entity: Missing Pet Partnership | Full | No |
| "Algarve, Portugal" | scope_conditions: operational context | Full | No |
| "system prompt of our AI model" | scope_conditions: encodable output requirement | Full | No |
| "hardcoded priors in scenario computation" | scope_conditions: discrete parameter requirement | Full | No |
