# Gap Analysis — "Owner reports → community alerted immediately, distance-aware"
*2026-05-30. Traces the founder's target flow end-to-end against the real code and isolates exactly what is built, what is wiring, what is data, and what is a genuinely new system.*

---

## ✅ P0 DONE — community broadcast PROVEN end-to-end (2026-05-30)
A real **🐕 CÃO PERDIDO — TESTELANDIA** post for "RexFinal · Labrador · dourado" landed in a live Telegram group via the **production handler path**, with a rich case-page link card. User confirmed in-app. Proven chain: `cases` INSERT → `CaseHarness` → action gate computed → `execute_pi_tool('post_to_channel')` → `format_broadcast_post` → `post_to_telegram_channel` → **real Telegram delivery** (`SIMULATION_MODE=false`).

**What this confirms:**
- The broadcast primitive AND the production tool handler both deliver real messages. The path that was "wired but never fired" now demonstrably fires.
- `format_broadcast_post` correctly uses `WEB_APP_URL` for the case link (card showed `nona-deploy.vercel.app`) — the earlier `salvacao.pt` concern was a non-issue (it's only the *fallback* default).
- The case page renders an OG link-preview card in Telegram automatically.

**Two real bugs found AND FIXED during P0 (uncommitted, in working tree):**
1. `harness.py:470` `_load_geo_context` crashed (`AttributeError: 'NoneType'`) whenever a case's municipality had no `kb_geography` row — `.maybe_single()` returns `None` on 0 rows. **This crashed the ENTIRE agent before it did anything.** Prod `kb_geography` covers all 16 Algarve municipalities so real cases are safe, but ANY off-list municipality (typo, tourist area, neighbouring region) would kill the agent. Fixed: `return (res.data if res else None) or {}`.
2. `case_agent.py:218` error handler used structlog-style kwargs on a stdlib logger → `TypeError`, masking the real error. Fixed to `%`-format.

**Known safety gap (NOT a P0 fix — confirmed live, file as P1.1):** during the proving run the action gate computed `private_coordinator_only` (default-aloof temperament for a profile-less Labrador) yet `post_to_channel` **still posted** — because the handler does NOT enforce the gate in code (safety lives only in the LLM prompt). For a hard case (galgo/fear-mode → `blocked`) a deterministic/explicit call would broadcast anyway. **Move the gate check into `post_to_channel` before going live** (P1.1).

**Prod state untouched:** all runs were local (`SIMULATION_MODE=false` inline) against prod DB. Prod fly bot still has `SIMULATION_MODE=true` (flip to make prod deliver). Test data cleaned (0 Testelandia cases/channels; back to original 13 cases). Bot `@dogs_trace_bot` (token `8652…`) is both local + prod; prod was crash-looping on Telegram `Conflict` (dup getUpdates) — stopped briefly to read chat_id, then restarted.

To finish going live (P1): flip prod `SIMULATION_MODE=false`, wire REAL community Telegram channels into `kb_channels`, commit the two bug fixes + the trigger script, add the P1.1 gate check.

## ⚠️ Read this first — the real headline (verified in prod 2026-05-30)
The **owner-guidance** half of the pipeline has run once (a survival-phase test case "Bolinha", 2026-05-27: 5 `case_agent_events`, all `send_owner_brief` + one `update_case_assessment`). But the **community-broadcast** half — the exact thing the founder is asking about — has **never executed in prod**:
- **Zero `post_to_channel` events. Zero `request_volunteer_alert` events.** The agent has never once tried to alert a community channel or a volunteer.
- All 4 `case_notifications` went to **`channel='log'` with `telegram_id=None`** — i.e. **nothing was actually delivered to Telegram**, not even the owner briefs. They were written to a log sink.

So the honest status of the founder's vision: the code is written and the *owner-facing* agent loop demonstrably runs, but **the community-alert path has never fired and nothing has ever been delivered over Telegram in prod.** "80% written, ~10% proven."

**Why it hasn't fired — two smoking guns, now confirmed:**
1. **`SIMULATION_MODE=true`** in `apps/bot/.env` (and it's a deployed fly secret). In SIM mode `post_to_telegram_channel()` logs "[SIM] suppressed" and returns `True` **without sending**. So even if a channel were wired, nothing would actually post. **This single flag likely explains the entire "nothing delivered" picture.**
2. **0/13 cases have `reporter_telegram_id`.** The notification code falls back to `channel='log'` when there's no `telegram_id` — which is why all 4 owner briefs went to a log sink instead of a chat. Web-intake cases have no Telegram id by nature; only bot-intake cases would.

Plus: every `kb_channels.url` is empty (no broadcast target), zero volunteers exist, and the one historical run was survival-phase (owner-briefing, never the broadcast branch).

**Fastest way to find the real gap: one honest dry run on prod.** Confirm `SIMULATION_MODE=false`, wire ONE real Telegram group into `kb_channels` (bot as admin, numeric `chat_id`), create ONE realistic *gregarious h0–24* case in that municipality (so the agent enters `phase_1_acute` where broadcast is prioritized), and watch whether a real message lands in the group. That single test is worth more than any further code reading. Everything below is the map; that run is the territory.

## The target flow (founder's words)

1. Owner contacts via Telegram **or** web → case created.
2. Everything automatic happens: poster, QR, emails to canils + authorities, Facebook.
3. The whole community is notified **immediately** via Telegram.
4. Each person is told **"you are X meters / km from the event."**
5. Safe instructions; sightings flow back.

---

## Prod state — VERIFIED 2026-05-30 (live DB query + fly status)
| Check | Prod value | Implication |
|---|---|---|
| `cases` | 13, all `ativo`, all test/sim | Engine never run on a real owner. |
| `sightings` | **0 ever** | The entire sighting/triage/broadcast-response loop is unexercised on real data. |
| `case_agent_events` | **5 rows, one test case ("Bolinha"), survival phase** | Agent ran — but ONLY `send_owner_brief` ×4 + `update_case_assessment` ×1. **No `post_to_channel`, no `request_volunteer_alert` ever.** Community-alert path unproven. |
| `case_notifications` | **4 rows, all `channel='log'`, `telegram_id=None`** | **Nothing was ever delivered over Telegram** — owner briefs went to a log sink, not a chat. |
| `user_profiles` | **1 total; 0 with role=`voluntario`** | `request_volunteer_alert` DMs **nobody**. The volunteer registry is empty. |
| `kb_channels` | 13 rows: 12 facebook_group + 1 telegram — **ALL have empty `url`** | No channel has a usable target *now*. The earlier test posted to a channel (`@…`) that is no longer present. `post_to_channel` has nothing to post to today. |
| `kb_canils` emails | **4/16 have email** | `fireProfessionalAlert` reaches at most 4 canils. Mostly empty — PILOT-PLAYBOOK Part 1 work outstanding. |
| `kb_vets` emails | **1/14 have email** | Vets effectively unreachable by email. |
| fly `salvacao-bot` | deployed, 1 machine `started` (fra), v8 | Runner is up. |
| `SIMULATION_MODE` | **`=true` in `apps/bot/.env`; also a deployed fly secret** | In SIM mode all Telegram sends are **suppressed but logged as success**. Almost certainly why nothing has ever delivered. **Confirm the prod secret's value and set `false` to go live.** |
| cases with `reporter_telegram_id` | **0/13** | Owner-brief notifications fall back to `channel='log'` (no chat to send to) for every case. Only bot-intake cases get a `telegram_id`. |
| `TELEGRAM_BOT_TOKEN` | set as fly secret ✅ | Bot creds exist (verify same bot as local `8652…` before "add bot as admin"). |

**The corrected blocker picture, in order:**
1. **`SIMULATION_MODE=true` → set it `false`** (after confirming the prod secret). Until then every "send" is a suppressed no-op logged as success. This is the #1 fix and costs one secret change.
2. **No usable broadcast target.** All `kb_channels.url` empty → wire one real Telegram group's `chat_id` (`-100…`), bot as admin.
3. **No Telegram delivery target on cases** — 0/13 have `reporter_telegram_id`; community posts go to the *channel*, not the owner, so this matters more for owner-briefs than for the broadcast. For the community alert, the channel `chat_id` (item 2) is what counts.
4. **Community broadcast has never fired** — after 1–3, run a fresh *acute-phase* case and confirm a real `post_to_channel` event + a real message in the group.
5. **canil/vet emails mostly empty** (4/16, 1/14) — `fireProfessionalAlert` mostly fires into the void. PILOT-PLAYBOOK Part 1.
6. **Zero volunteers** — per-person DMs reach no one.
All are data/ops/config/recruitment. None is a missing feature.

## ⚠️ Code vs prod
Statements about **code structure** are verified by reading the repo. Statements about **prod** are verified by the live query + `fly status` above (run 2026-05-30).

## Reality, stage by stage (verified in code)

### Stage 1 — Intake (owner → case) — ✅ BUILT, both channels
- **Web** `POST /api/cases/route.ts`: geocodes the zone → `last_seen_coords_approx` (point), inserts the case, uploads photos, fires ML. Solid.
- **Telegram** `apps/bot` (agent intake, `ConvState`, voice transcription, photo staging) → creates case via `/api/bot/cases`.
- **Gap: none material.** Both intake paths work.

### Stage 2 — Automatic track (system does the work) — ✅ MOSTLY BUILT (data-starved)
On case creation, fire-and-forget, today:
- ✅ Confirmation email to owner (`sendCaseConfirmation`).
- ✅ ML: embedding + public image (`triggerMLProcessing`). *(Latent: Drizzle says vector 1536, ML emits 1024 — secondary, never run on real data.)*
- ✅ **Facebook + Instagram auto-post** (`postCaseToMeta`) when the primary image is ready — **but this posts to Nona's OWN page, not to community groups.**
- ✅ **Professional alert** to canils/vets/authorities (`fireProfessionalAlert`, WP18 Tier-1, minute-0) — wired, but **mostly fires to nobody: only 4/16 canils and 1/14 vets have an email in prod** (verified live). Data gap, not code gap — PILOT-PLAYBOOK Part 1.
- ✅ Poster/QR: `/api/cases/[slug]/poster` exists; QR → case page. Generated on demand (lazy), not a blocker.
- ✅ Visual match search → `visual_matches` + `notifyVisualMatch` (secondary).

**Verdict:** the automatic track is real. Its weakness is **data** (empty canil/vet emails), not missing features.

### Stage 3 — Notify the community immediately via Telegram — ⚠️ WIRED (agent-mediated) but NEVER FIRED in prod
**Correction after reading `pi_tools.py`:** this IS wired — not dead code.
- The PI agent has a tool `post_to_channel` (`pi_tools.py:707`): it looks up the channel's `url`/`chat_id` in `kb_channels`, calls `post_to_telegram_channel()` for Telegram, and generates FB/WhatsApp **share URLs** for the owner to post manually. There is also `request_volunteer_alert` (`pi_tools.py:805`, municipality + `radius_km`). Both are in the `phase_1_acute` tool palette.
- The flow IS connected: case INSERT → `runner.py on_case_created` → `run_case_agent(trigger="case_created")`. The PI system prompt explicitly says, in `PHASE_1_ACUTE`: *"Notifica canils, vets, voluntários. **Posta grupos locais.**"* So on a gregarious case the agent is instructed to broadcast to local groups, gated by the action gate (hard case → blocked).
- **So why isn't it "done"? Operational gaps, not missing code (confirmed in prod):**
  1. **Data/ops + config — and it has never actually fired.** All 13 `kb_channels` have **empty `url`**, so `post_to_channel` has no valid target. The agent runs (5 events from a test case) but has **never once called `post_to_channel` or `request_volunteer_alert`** in prod, and every notification it produced went to `channel='log'`/`telegram_id=None` (no real delivery). Three things gate a real community post: a real `chat_id` in `kb_channels.url`, `SIMULATION_MODE` off, and a case that actually reaches the broadcast branch (acute phase / agent decides to post).
  2. **Non-deterministic:** broadcast is an **LLM tool call**, not a hardcoded guaranteed step. The agent *may* decide to call it. For a "the community is ALWAYS alerted in minute 0" guarantee, that determinism gap matters.
  3. **Telegram-only auto-post:** only Telegram channels are auto-posted; FB/WhatsApp produce share URLs the owner taps manually (by design — no API posting to third-party groups).
- **What's missing is ops + (optionally) determinism, not a new system.** The MUNICIPALITY_ADJACENCY map in `jobs/matching.py` already exists if you want to widen the channel set to neighbouring municipalities.

### Stage 4 — per-person alerts + "you are X km away" — ⚠️ DM CODE WORKS; registry is thin; distance not representable
**Correction after reading `pi_tools.py:805`:** the per-person DM machinery already exists AND the registry table already exists.
- `request_volunteer_alert` queries **`user_profiles` where `role='voluntario'` and `municipality ilike '%X%'`**, then **DMs each volunteer individually** by inserting one `case_notifications` row per `telegram_id`. So "alert N individuals in this municipality, one message each" is fully coded and uses a real table.
- `user_profiles` columns (verified): `role, display_name, organization_name, phone, telegram_id, municipality, locale_preference`. So a volunteer = an account row with `role='voluntario'`, a `telegram_id`, and a `municipality`.
- **But two structural limits remain:**
  1. **The registry is an *account* model, not a lightweight community opt-in.** Volunteers are `user_profiles` rows (same table as admins/clínicas/associações). There is no self-serve "tap to subscribe to alerts in my area" flow that mass-populates `voluntario` rows. Today this list is whatever staff/partners exist — likely near-empty for real civilians.
  2. **No coordinates → "X km away" is not representable.** `user_profiles` has `municipality` (a string), **no point/lat-lng**. `radius_km` is accepted by the tool but **unused** in the query; the code comment marks geo-fenced radius as *"WP6"* (explicitly deferred). `cases.last_seen_coords_approx` gives you ONE side of the distance — the volunteer side does not exist.
- **So the per-person vision splits into two sub-gaps:**
  - **G2a — registry too thin:** the table + DM code work; what's missing is a **self-serve opt-in** (bot `/alertas`) that lets civilians register as `voluntario` with their `telegram_id` + `municipality`. Then `request_volunteer_alert` lights up with no new alert code.
  - **G2b — literal "X km away":** the distance MATH already exists — `pi_tools.py` has `_haversine_km()` + `_parse_latlng()` and `cases.last_seen_coords_approx` is populated by geocoding. The ONLY missing input is per-volunteer location. So G2b = add `home_coords` (point) + `radius_km` to the volunteer record + a filter loop using the existing haversine. This is the WP6 piece and the GDPR-heavy part (storing civilians' home coordinates = consent + breach surface that municipality-level alerts avoid) — but it is *less* code than it looks because the geo primitives are built.

### ⚠️ Safety note discovered while tracing the broadcast path
`post_to_channel` and `request_volunteer_alert` (`pi_tools.py`) do **not** check the action gate in code — they post/DM unconditionally. The "don't broadcast a fear-mode galgo" safety lives **only in the LLM system prompt** (the agent is *told* to read the gate first). `post_to_channel` even stays in the tool palette for all phases. So today the life-safety guarantee is a soft prompt constraint, not a hard code check. **Implication for G1:** if you make the broadcast deterministic, that's actually an opportunity to move the gate check into code (`if action_gate.broadcast_sighting_location != 'public': skip`) — making it *safer* than today, not just more reliable. Conversely, do not add a deterministic broadcast that bypasses the gate.

### Stage 4 — per-person alerts + "you are X km away" — ⚠️ DM CODE WORKS; registry thin; distance not representable
- `request_volunteer_alert` (`pi_tools.py:805`) queries **`user_profiles` where `role='voluntario'` and `municipality ilike '%X%'`**, then DMs each volunteer individually (one `case_notifications` row per `telegram_id`). So "alert N individuals in this municipality" is fully coded against a real table.
- `user_profiles` columns (verified): `role, organization_name, municipality, verified, locale_preference` (+ `telegram_id` used by the tool). A volunteer = an account row with `role='voluntario'` + `telegram_id` + `municipality`.
- **Two structural limits:**
  1. **Registry is an *account* model, not a community opt-in.** There is no self-serve "tap to get alerts in my area" flow — prod has **0 `voluntario` rows**, so this tool alerts nobody today.
  2. **No coordinates → "X km away" is not representable.** `user_profiles` has only a `municipality` string; `radius_km` is accepted but **unused** (code comment defers geo-fence to "WP6"). The distance MATH already exists (`harness.py` `_haversine_km` + `_parse_latlng`) and case coords are geocoded — the only missing input is per-volunteer location.
- **Splits into G2a** (registry too thin — needs an opt-in flow; DM code already works) and **G2b** (literal "X km away" — needs per-volunteer coords + the GDPR-heavy consent layer).

### Stage 5 — Safe instructions + sightings back — ✅ BUILT
- Safe instructions: `harness.py` broadcast-safety gate + `action_gate` — hard case (galgo/podenco/fear-mode) → location broadcast blocked / coordinator-only / "no perseguir". The per-dog-phase safety logic is engineered.
- Sightings back: `/api/finder`, `/api/sightings`, "vi este cão", sighting INSERT → realtime → case agent + cross-case geo, admin review. Full loop built.

---

## THE GAP, precisely (three distinct things — do not conflate them)

| # | Gap | Type | Effort | When |
|---|---|---|---|---|
| **G1** | Community broadcast is agent-mediated (non-deterministic LLM tool call), not a guaranteed minute-0 step. | **Reliability choice.** Code exists. | Hours–days | **Now (pilot)** |
| **G2a** | Per-person volunteer DMs: table (`user_profiles`/`voluntario`) + DM code both exist, but no self-serve opt-in → the `voluntario` list is near-empty, so alerts reach ~nobody. | **Registration flow.** Table + DM code exist. | Days | **Pilot v1.5** |
| **G2b** | Literal "you are X km away": `user_profiles` has no coords, `radius_km` unused, distance query absent (code defers to "WP6"). | **New geo layer + GDPR.** | Weeks + GDPR | **Defer to v2** |
| **G3** | `kb_channels.url` all empty (no chat_ids); bot not admin of any real group; canil/vet emails mostly empty (4/16, 1/14); `SIMULATION_MODE` may suppress sends. Runner IS deployed. | **Data + ops + config.** Non-coding. | Days | **Now (pilot)** |

**The headline:** the founder's vision is ~80% built in code; the *owner-guidance* agent loop has run once on a test case, but the *community-broadcast* path has **never executed in prod** (zero `post_to_channel`/`request_volunteer_alert` events) and **nothing has ever been delivered over Telegram** (all notifications went to a log sink). The prod query shows what blocks it: **`kb_channels.url` all empty, `SIMULATION_MODE` possibly suppressing sends, no real `telegram_id` delivery, canil/vet emails mostly empty (4/16, 1/14), zero volunteers.** None is a missing feature — it's config + wiring real channels + loading contacts + a volunteer opt-in. Per-person alerts are **mostly coded**: registry (`user_profiles`/`voluntario`) + DM machinery (`request_volunteer_alert`) both exist; **G2a** just needs the opt-in flow + rows. Only **G2b** (literal "X km away") is genuinely new — per-volunteer coordinates, distance query, consent, GDPR — and the code already defers it to "WP6".

---

## Minimal path to realize the vision for ONE lost dog

**Achievable in days (group-level "immediate + local" — no new schema; the code already exists):**
0. **Flip `SIMULATION_MODE` to `false` (after confirming the prod secret), wire one real channel, run an ACUTE-phase test case, then watch.** The agent fires on case events but has **never reached the broadcast branch** in prod, and SIM mode would have suppressed any send anyway. To prove the community alert you need: `SIMULATION_MODE=false` + a real `chat_id` in `kb_channels` + a fresh gregarious h0–24 case (→ `phase_1_acute`, where the prompt prioritizes "Posta grupos locais"). Then check for a real `post_to_channel` event AND a message actually appearing in the group. This single test validates or breaks the whole community-alert claim.
1. **G3 data + ops:**
   a. **Wire a real Telegram channel.** Create/choose a community Telegram group for a pilot municipality, add the bot as admin, get its numeric `chat_id` (`-100…`), set it on the `kb_channels.url` (`channel_type='telegram'`). **Every channel row is empty today.**
   b. **Load canil/vet emails** for the pilot municipalities (PILOT-PLAYBOOK Part 1) — prod has only 4/16 + 1/14. `scripts/load_contacts.py` already exists.
2. **G1 reliability (optional but recommended) — with a SAFETY constraint:** today the broadcast is an LLM tool call the agent *may* make. If you want a guaranteed "community alerted in minute 0", make it deterministic on `case_created` for gregarious cases. **Critical:** a deterministic broadcast MUST run *after* the action gate is computed and MUST respect it — a hard case (galgo/podenco/fear-mode) has `SIGHTING_BROADCAST: BLOCKED`, and broadcasting it would reintroduce the exact fatal failure the gate exists to prevent (documented: galgo displaced 7mi by a well-meaning crowd). So "always broadcast" is wrong; "always *evaluate the gate, then* broadcast if allowed" is right. The tool already does the posting work — the discipline is in the ordering.
3. Result: owner reports → poster/QR + FB/IG (Nona page) + canil/vet emails + **community Telegram groups get a safe post with the case link** — in minute 0. That is the vision, at **group** granularity. A municipality group **is** the proximity filter (humans self-select by locality).

**Optional next (G2a — per-person municipality DMs, only if the pilot shows group posts are too noisy/slow):**
- No new table — `user_profiles`/`voluntario` already is the registry and `request_volunteer_alert` already DMs each one.
- Build a self-serve opt-in: bot `/alertas` command → insert a `user_profiles` row with `role='voluntario'`, `telegram_id`, `municipality`, consent recorded. (Captures `telegram_id` naturally, no separate login.)
- Once real civilians are in the list, `request_volunteer_alert` lights up with **zero new alert code**.

**Defer (G2b — literal "X km away", only after G2a proves valuable):**
- Add per-volunteer `home_coords` (point), `radius_km`, `consent_at` (to `user_profiles` or a dedicated `volunteers` table to keep civilian PII separate from staff accounts — prefer the latter for GDPR hygiene).
- On case_created: find volunteers where `distance(home_coords, case.coords) <= radius_km` (PostGIS / earthdistance), DM each with their personal distance + safe instructions + "vi este cão" deep-link.
- Only then can you literally say "estás a 1.2 km". The haversine math (`_haversine_km`) and point parsing (`_parse_latlng`) already exist in `pi_tools.py`, and case coords are already geocoded — so this layer is mostly *data + consent*, not new computation. This is the GDPR-heavy layer the code already labels "WP6".

---

## Recommendation

Ship **G3 (data + ops + config) first — the runner is already up, so the work is: confirm `SIMULATION_MODE` off, wire a real Telegram channel `chat_id` into `kb_channels` (all empty today), load canil/vet emails (4/16, 1/14), register a few volunteers** — then optionally **G1 (deterministic, gate-respecting broadcast)** for the pilot. That delivers "owner reports → community alerted immediately" with zero new schema and zero GDPR liability, because the broadcast code already exists and is wired into the case agent. Treat **G2b** (the literal "X km away") as the v2 build the pilot is meant to justify — a municipality-local Telegram post already achieves *immediate + local* without storing anyone's home coordinates. Validate that the group broadcast produces ≥1 useful sighting on a real case first; let that decide whether per-person distance is worth its cost.

**Bottom line for the founder's question:** you are not missing a product — you're missing *one validated community-alert run*. The owner-guidance agent loop runs; the community-broadcast path is written but has **never fired in prod**, and Telegram delivery has never actually happened (everything went to a log sink). To run your exact vision on one real dog, in order: (0) wire one real Telegram channel `chat_id`, confirm `SIMULATION_MODE` off, and run an acute-phase test case — then check for a real `post_to_channel` event and a real message in the group; (1) keep that channel in `kb_channels` (all empty today); (2) load real canil/vet emails (4/16, 1/14); (3) a few registered volunteers (or rely on the channel post). "Estás a X km" is the only piece needing new code + GDPR — optional until municipality-level alerts prove too coarse. **Do the one dry-run before anything else; it will tell you which of these is real.**
