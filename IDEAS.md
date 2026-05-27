# SalvaCão — Ideas Master List

Generated from: platform audit + research synthesis (Lord 2007, Albrecht MAR, HASS/Fi 2021, ASPCA 2012) + product ideation.

---

## FLAT LIST (all ideas)

### Platform gaps (built system, missing features)
1. Shelter/canil notification email on case creation — duty officer gets photo + case URL
2. 48h action-push sequence via Telegram — day 1, 3, 7 messages with phase-specific owner tasks
3. Hyperlocal broadcast to Nextdoor / local WhatsApp groups near last-seen coords
4. Vet clinic notification — photo + description to nearby vets on case open
5. Behavioral phase guidance in intel output — survival phase = trap instructions, not just zone map
6. Chip registration check prompt in bot — "O chip está registado no SICAFE com número atual?"
7. Periodic re-matching job — encontrado ↔ new perdido, run nightly
8. Real geo-fenced volunteer alerts — registered users within Xkm get Telegram push with photo
9. Poster print network — integration with local cafés, community boards, print shops
10. GNR/PSP protocol guidance when suspected_theft=true — bot walks owner through filing report
11. Owner dashboard / magic link — post-creation self-service (update description, add photos, correct info)
12. Case resolution celebration — notify all sighting reporters + volunteers when dog found

### Research-backed actions not in the system
13. Physical shelter visit guidance — not just "call" but "go in person every 48h" (Lord 2007: 2.1× recovery)
14. Scent anchor instructions — worn clothing + bedding left at escape point
15. "Never chase" protocol for fearful/survival-phase dogs — Albrecht MAR
16. Enlarged neon poster standard — 3-inch font, intersection placement, visible at 30mph (Albrecht)
17. Home mailer distribution — physical flyers to addresses within 1-mile radius
18. Feeding station guidance — keeps foraging dog localized vs. ranging further
19. Humane trap deployment guidance + equipment source list
20. Facebook group boost recommendation — $5-10 sponsored post reaches hyperlocal audience
21. Shelter radius expansion at 7d+ — check 60-mile radius, not just local
22. Regional lost-pet network cross-posting (PawBoost, Petdata, Petco Love Lost)
23. SICAFE chip database query — auto-query on case open; alert owner if registration outdated
24. 48h shelter cycling reminder — specific canil names + hours + contact, not generic

### Proactive agent architecture (new direction)
25. Agents assigned as case owners — each case has a dedicated agent that owns it end-to-end
26. Proactive case agent — doesn't wait for owner to ask; acts, reports back, adjusts
27. Detective/PI framing — agent has drive, uses evidence, makes decisions, communicates findings
28. Agent knows which specific canils to call based on case coords and municipality
29. Agent knows where to post based on breed + phase + location (not generic social media push)
30. Agent builds on intel output — uses BehavioralPhase, terrain hazards, and breed radius to prioritize actions
31. Multi-step case plan — agent generates day-by-day action plan on case open, executes it
32. Agent-to-owner proactive communication — agent reaches out to owner, not vice versa
33. Agent with real tools — actual API calls to canils, vets, social platforms (not fake strings)
34. Case progress assessment — agent evaluates what's working, adjusts strategy
35. Agent escalation logic — if no sightings after 48h, agent escalates: widens radius, adds channels
36. Agent tracks what's been done — no duplicate calls to same canil, no repeat posts
37. Multi-agent coordination — intel agent feeds case agent; case agent feeds owner-comms agent
38. Agent learns from sightings — new sighting triggers re-analysis, MovementAnalysis update, plan adjustment
39. Agent priority scoring — if 12 active cases, which ones need action today? Agent decides.
40. Cross-case intelligence — dog seen near X, another perdido case also in X, agent connects them
41. Agent persists across days — not stateless; has memory of what it tried, what worked, what failed
42. Volunteer dispatch agent — identifies nearest registered volunteers to a sighting, sends task
43. "Cold case" agent — cases 7d+ with no sightings get different playbook (adoption check, wider search)
44. Agent-generated daily briefing to owner — "Aqui está o que fizemos hoje e o que fazemos amanhã"

### Data & integrations
45. SICAFE API integration (chip registry)
46. Local canil database — hours, contact, director name, hold periods for all Algarve shelters
47. Local vet clinic database — within 10km of last-seen, with contact info
48. Nextdoor API / OAuth integration
49. WhatsApp Business API for hyperlocal broadcast
50. Petdata / PawBoost cross-posting API
51. Google Maps Places API for "where to post" intelligence
52. Supabase realtime subscription — agent wakes on new sighting event
53. Scheduled jobs (nightly re-matching, daily case agent run, 48h shelter cycling)

---

## GROUPED BY CATEGORY

### A. Shelter & Physical Network
- 1. Canil notification on case open
- 4. Vet clinic notification
- 13. Physical visit guidance (every 48h)
- 21. Shelter radius expansion at 7d+
- 24. 48h shelter cycling reminder with specific contacts
- 28. Agent knows which specific canils to call
- 46. Local canil database

### B. Owner Guidance & Coaching (phase-aware)
- 2. 48h action-push sequence via Telegram
- 5. Behavioral phase guidance in intel output
- 6. Chip registration check prompt
- 10. GNR/PSP protocol for suspected theft
- 14. Scent anchor instructions
- 15. "Never chase" protocol
- 18. Feeding station guidance
- 19. Humane trap guidance
- 44. Daily briefing from agent to owner

### C. Digital Broadcast & Social
- 3. Hyperlocal Nextdoor / WhatsApp broadcast
- 8. Real geo-fenced volunteer alerts
- 20. Facebook group boost recommendation
- 22. Regional network cross-posting
- 29. Agent knows where to post based on breed + phase + location

### D. Physical Distribution
- 9. Poster print network (cafés, community boards)
- 16. Neon poster standard (Albrecht)
- 17. Home mailer distribution

### E. Platform Intelligence & Matching
- 7. Periodic re-matching (encontrado ↔ perdido, nightly)
- 12. Case resolution celebration broadcast
- 23. SICAFE auto-query on case open
- 30. Agent builds on intel output (BehavioralPhase, terrain, breed radius)
- 38. Agent re-analyses on new sighting (MovementAnalysis update)
- 40. Cross-case intelligence (shared geography)

### F. Proactive Agent Architecture
- 25. Agents assigned as case owners
- 26. Proactive case agent (acts, doesn't wait)
- 27. Detective/PI framing with drive
- 31. Multi-step case plan generated on open
- 32. Agent-to-owner proactive communication
- 33. Agent with real tools (actual API calls)
- 34. Case progress assessment + strategy adjustment
- 35. Agent escalation logic (no sightings 48h → escalate)
- 36. Agent tracks what's been done (no duplicates)
- 37. Multi-agent coordination (intel → case → comms)
- 39. Agent priority scoring across active cases
- 41. Agent memory across days
- 42. Volunteer dispatch agent
- 43. "Cold case" agent (7d+ playbook)

### G. Data & Integrations
- 45. SICAFE API
- 46. Local canil database
- 47. Local vet clinic database
- 48. Nextdoor OAuth
- 49. WhatsApp Business API
- 50. Petdata / PawBoost API
- 51. Google Maps Places API
- 52. Supabase realtime → agent wake on sighting
- 53. Scheduled jobs (nightly match, daily agent run, 48h shelter cycle)

### H. Owner Self-Service
- 11. Owner dashboard / magic link
- 6. Chip registration check
- 10. GNR/PSP filing guidance

---

## RESEARCH EVIDENCE SUMMARY

| Finding | Source | Implication |
|---|---|---|
| Physical shelter visit HR 2.1× vs. calling | Lord 2007 JAVMA | Item 13, 24, 28 |
| Neighborhood signs = 15.2% of recoveries | Lord 2007 JAVMA | Items 9, 16, 17 |
| 70% of dogs found within 1 mile | HASS/Fi 2021 | Tight alert radius, not city-wide |
| 40-60% reach shelter within 48h | ASPCA 2012 | Item 1 is highest-leverage |
| Chipped+registered = 87% shelter reclaim vs 37% no chip | RSPCA QLD PMC4494412 | Items 6, 23, 45 |
| Fearful dogs: pursuit increases distance | Albrecht MAR | Item 15 — "never chase" |
| Suspected theft → 70% lower recovery | Lord 2007 JAVMA | Item 10 — GNR filing |
| Nextdoor highest digital correlation | IAABC 2023 | Item 3, 48, 29 |
| Day 1-7 owner actions = primary outcome determinant | Albrecht MAR | Items 2, 32, 41 |
| Feeding stations keep dogs localized | Practitioner data | Item 18 |
| Humane traps in survival phase | Albrecht MAR | Item 19 |

---

## WORK PACKAGES

> Development roadmap for the 53 ideas above. Each WP is self-contained and builds on the previous.
> Keep this section updated as WPs complete — it survives conversation compaction.

### Architecture: The Harness Layers (PI Agent Design)

Unlike the intel agent's hard gates (MANDATORY_TOOLS, ge=2 Pydantic), the PI agent uses soft guidance:

- **Layer 1: Phase-filtered palette** — panic/survival/recovery each expose different tool subsets
- **Layer 2: Context injection** — every run injects hours elapsed, what's been tried, KB snapshot
- **Layer 3: Write-back hooks** — tool results with new resources auto-write to KB tables
- **Layer 4: System escalation** — harness (not agent) checks thresholds, injects urgency signals

State machine on `cases.agent_state`: `new → planning → active → escalated → cold → resolved`

---

### WP0 — Foundation ✅ complete
**Files:** `supabase/migrations/0011_agent_foundation.sql`, `apps/bot/agent/harness.py`, `apps/bot/agent/kb.py`, `apps/bot/agent/seed_kb.py`
**Deliverables:** `agent_state` column on cases, `case_agent_events` log table, `kb_canils/vets/channels` tables (agent-writable, unique on name+municipality), `CaseHarness` class, Algarve canil seed (16 municipalities)
**Ideas:** #41 (memory), foundation for #25–44, #46, #47

### WP1 — Knowledge Bases + MCP Server
**Files:** `apps/bot/mcp/knowledge_server.py`, KB seed expansion (vets + channels)
**Deliverables:** Real Algarve data in all KB tables (canils + vets + Facebook groups), Python MCP server with `lookup_*` + `record_discovery` tools exposed as MCP resources
**Ideas:** #28, #29, #42, #46, #47

### WP2 — Case PI Agent (Core)
**Files:** `apps/bot/agent/case_agent.py`, Supabase realtime trigger or Fly cron
**Deliverables:** `CaseAgent` class using `CaseHarness`, triggered on case INSERT, generates day-1 action plan, phase-aware tool calls, escalation logic, no-duplicate tracking via `case_agent_events`
**Ideas:** #25, #26, #27, #31, #32, #34, #35, #36, #38, #39, #41, #42, #43, #44

### WP3 — Owner Comms
**Files:** `apps/bot/agent/comms.py`, Next.js owner dashboard
**Deliverables:** Telegram 48h push sequence (day 1/3/7), daily briefing from agent to owner, case resolution celebration broadcast to all sighting reporters, owner magic-link dashboard (update description, add photos)
**Ideas:** #2, #11, #12, #44

### WP4 — Real Tool Integrations
**Files:** `apps/bot/agent/tools/canils.py`, `tools/vets.py`, `tools/volunteers.py`
**Deliverables:** Email to canils on case open (using kb_canils), email to nearby vets, real geo-fenced volunteer Telegram push, GNR/PSP guidance flow (suspected_theft=true), chip registration check prompt
**Ideas:** #1, #4, #6, #8, #10, #13, #14, #15

### WP5 — Digital Broadcast
**Files:** `apps/bot/agent/tools/broadcast.py`
**Deliverables:** Facebook group auto-post (phase-aware, using kb_channels), WhatsApp/Nextdoor broadcast, regional cross-posting (PawBoost, Petdata, Petco Love Lost)
**Ideas:** #3, #20, #22, #29, #48, #49, #50

### WP6 — Intelligence & Matching
**Files:** `apps/bot/jobs/`, Supabase scheduled functions
**Deliverables:** Nightly re-match job (encontrado ↔ perdido), cross-case geographic intelligence, priority scoring across active cases, cold case playbook (7d+), shelter radius expansion at 7d
**Ideas:** #7, #21, #38, #39, #40, #43

### WP7 — Physical Network
**Files:** Agent tools + partner integrations
**Deliverables:** Poster print network (cafés/community boards), neon poster standard (3-inch font, Albrecht spec), home mailer distribution
**Ideas:** #9, #16, #17
