# Roadmap to 100% — "Owner reports → community alerted immediately, distance-aware"
*2026-05-30. Sequenced backlog to take the founder's vision from ~80%-written/~10%-proven to fully live. Derived from PROXIMITY-GAP.md (verified against live prod). Ordered so each phase is shippable and each unblocks the next. Effort: S = hours, M = days, L = week+.*

Legend: `[ ]` todo · **CONFIG/OPS** = no code · **CODE** = code change · **DATA** = content/recruitment

---

## P0 — Make the code that already exists actually run (the real blocker)
*Nothing here is a new feature. This is why "80% written" delivers 0% today.*

- [ ] **P0.1 — Confirm + flip `SIMULATION_MODE=false`** · CONFIG · S
  Where: fly secret on `salvacao-bot` (+ `apps/bot/.env`). Today `.env=true`; prod is a secret (value unverified).
  Why: in SIM mode `post_to_telegram_channel()` logs "sent" but **sends nothing**. Single most likely reason nothing has ever delivered. `fly secrets set SIMULATION_MODE=false -a salvacao-bot`.

- [ ] **P0.2 — Create 1 real Telegram community group + add bot as admin** · OPS · S
  Why: the broadcast target. Bot must be admin to post. Get numeric `chat_id` (`-100…`).

- [ ] **P0.3 — Insert a real `kb_channels` row** · DATA · S
  Where: `kb_channels` (`channel_type='telegram'`, `url=<chat_id>`, `municipality=Faro`). All 13 rows have empty `url` today.
  Why: `post_to_channel` looks up `url` by channel name — empty = no-op.

- [ ] **P0.4 — Verify the runner processes a case INSERT** · OPS · S
  Where: `fly logs -a salvacao-bot` while creating a test case.
  Why: confirm realtime `on_case_created` → `run_case_agent` actually fires (it has, for one case — re-confirm after redeploy).

- [ ] **P0.5 — Dry run: 1 acute-phase test case end-to-end** · TEST · S
  Create a gregarious, h0–24, Faro case (→ `phase_1_acute`, where prompt says "Posta grupos locais").
  Pass = a real `post_to_channel` event in `case_agent_events` AND a real message visible in the Telegram group.
  Why: this single test validates or breaks the whole community-alert claim. Do it before building anything.

---

## P1 — Group-level "immediate + local" alert (the founder's vision, minus literal distance)
*Achievable in days. Zero new schema. A municipality group IS the proximity filter.*

- [ ] **P1.1 — Move the action-gate check INTO the broadcast code** · CODE · S ⚠️ SAFETY
  Where: `pi_tools.py` `post_to_channel` + `request_volunteer_alert`.
  Today: neither checks the gate; safety lives only in the LLM prompt. A fear-mode galgo broadcast = documented fatal failure (dog displaced 7mi).
  Fix: `if action_gate['broadcast_sighting_location'] != 'public': skip + log`. Makes broadcast safe regardless of agent judgment.

- [ ] **P1.2 — (Optional) Deterministic broadcast on case_created** · CODE · M
  Where: `case_agent.py` / `runner.py on_case_created`.
  Why: today broadcast is an LLM tool call the agent *may* make. For "community ALWAYS alerted in minute 0", call it deterministically for gregarious cases — **after** P1.1 gate check. "Evaluate gate, then post if allowed" — never "always post".

- [ ] **P1.3 — Widen to neighbouring municipalities** · CODE · S
  Where: reuse `MUNICIPALITY_ADJACENCY` (already in `jobs/matching.py`).
  Why: a dog near a border is relevant to adjacent groups. Post to municipality + neighbours.

- [ ] **P1.4 — Load canil/vet emails for pilot municipalities** · DATA · M
  Where: `apps/bot/scripts/load_contacts.py` (exists) + `pilot_contacts.csv`. Prod: only 4/16 canils, 1/14 vets.
  Why: `fireProfessionalAlert` (minute-0, already wired) currently fires into the void. PILOT-PLAYBOOK Part 1.

- [ ] **P1.5 — Recruit 3–5 real pilot channels** · OPS/DATA · M
  Faro · Loulé · Lagos · Albufeira. Real Telegram groups (or admins of existing FB groups who'll let the bot post).
  Why: distribution is the unsolved crux, not the product.

- [ ] **P1.6 — Run 10 real cases** · DATA · L
  Why: engine never touched a real dog (0 real cases, 0 sightings ever). This is the validation unit. Success = learning, not 10 reunions.

**End state of P1:** owner reports → poster/QR + FB/IG (Nona page) + canil/vet emails + **real community Telegram groups get a safe, gated post with the case link** — minute 0. That is the vision at *group* granularity.

---

## P2 — Per-person alerts (volunteer DMs by municipality)
*Only if the pilot shows group posts are too noisy/slow. DM code already works; registry is just empty.*

- [ ] **P2.1 — Self-serve volunteer opt-in** · CODE · M
  Where: bot `/alertas` command → insert `user_profiles` row (`role='voluntario'`, `telegram_id`, `municipality`, consent timestamp).
  Why: `request_volunteer_alert` already DMs each `voluntario` in a municipality — it just has 0 rows. This populates it. **No new alert code.**

- [ ] **P2.2 — Consent + GDPR copy at opt-in** · CODE/LEGAL · S
  Why: storing personal contact + alert subscription needs explicit consent (PT/LGPD). "Prometo não perseguir, reporto responsavelmente."

- [ ] **P2.3 — Response buttons (Vi / Atento / Ocupado)** · CODE · M
  Where: inline keyboard in the volunteer DM → store response.
  Why: enables the "% estou atento" engagement metric + filters who actually looks.

**End state of P2:** registered civilians in a municipality get a personal DM per case, can respond, and "vi este cão" deep-links back into the sighting flow.

---

## P3 — Literal "you are X km away" (the only genuinely-new system)
*Defer until P2 proves valuable. GDPR-heavy. But the math already exists.*

- [ ] **P3.1 — Add per-volunteer location** · CODE/DB · M
  Where: new `volunteers` table (keep civilian PII separate from staff `user_profiles`): `telegram_id, home_coords (point), radius_km, consent_at, active`.
  Why: `cases.last_seen_coords_approx` gives one side of the distance; this is the missing side.

- [ ] **P3.2 — Distance-filtered alert** · CODE · S
  Where: `request_volunteer_alert` — filter `_haversine_km(home, case) <= radius_km`. Haversine + point-parse **already exist** in `pi_tools.py`.
  Why: replaces the municipality-string filter with true radius. Enables "estás a 1.2 km".

- [ ] **P3.3 — Personal-distance message** · CODE · S
  Why: inject computed distance into each DM. The literal founder ask.

- [ ] **P3.4 — GDPR review of stored coordinates** · LEGAL · M
  Why: home coordinates = sensitive. Consent, retention, deletion, breach surface. The reason this is last.

---

## Cross-cutting / hygiene (do alongside, not blocking)

- [ ] **X.1 — Sync Drizzle schema ↔ prod** · CODE · S
  `cases.ts` missing `owner_token`, `fb_post_id`, `reporter_telegram_id`, `behavioral_profile`, `agent_state`, etc. that exist in prod. Drift, not bug — but fix before anyone trusts the Drizzle files.

- [ ] **X.2 — Embedding dim mismatch** · CODE · S
  Drizzle `case-images.ts` says `vector(1536)`; ML emits 1024; prod migration history has both 0009→0010. Verify the live column dim; align. Latent (ML never run on real data), low priority.

- [ ] **X.3 — Basic tests on the alert path** · CODE · M
  No tests on broadcast/finder/gate. Add: gate blocks hard-case broadcast; `post_to_channel` no-ops on empty url; finder match/no-match.

---

## The one-line answer
**To 100%: P0 (make it run) → P1 (group alert + 10 real cases) is the whole founder vision except literal distance. P2 adds per-person DMs. P3 adds "X km away".** P0+P1 are days and zero new schema. P3 is the only real new build. Do P0.5 (the dry run) before touching anything else.
