# Flow Audit — Observer & Owner (Web + Telegram)

> Date: 2026-06-01 · Method: 4 parallel Sonnet investigators (web-observer, web-owner, telegram-observer, telegram-owner), each tracing its flow end-to-end through real code. ✅ = independently verified by main thread. Bar: "100% complete, no exceptions."

## ⚠️ Go-live gate — NOT bugs, the founder's decision (do not flip autonomously)

Standing rule (founder, repeated; in memory `project_proximity_gap.md`): *"For now we should not wire to real communities. I want full simulation, everything working before real interactions. Use my private groups."* These two items **are that guard, working as instructed.** Flipping them = the literal act of going live (irreversibly fires pending real-people notifications). The one-line change is ready when the founder says go.

- **GATE-1 — `SIM_REAL_DELIVERY_ALLOWLIST`** (`sim_config.py:46-58`, `telegram.py:1078`): real delivery fires only for allowlisted tids (founder id + private group); empty allowlist → everything virtual. This is the simulation guard, not a bug. Go-live = make non-sim + `is_simulated=False` deliver to all real users.
- **GATE-2 — web proximity opt-in for observers** (absent everywhere): building a public "alert me when a dog is lost near me" surface is new real-community contact — a go-live/product decision, not a fix.

## TL;DR — the launch-blocking few (verified bugs, sim-safe to fix)

1. ✅ **Bot-created cases get `owner_token = NULL`** → owner can never open OwnerPanel; PI agent can't link the dashboard. `apps/web/src/app/api/bot/cases/route.ts:67` insert has no `owner_token`; migration `0014` added **no column default**. (Web `intake/stream` *does* set it — `route.ts:527` — so only the bot path is broken.) **Hits the sandbox too** (founder's own test cases).
2. ✅ **`/start` menu buttons are dead** — `flow_perdido` / `flow_encontrado` / `flow_avistamento` emitted at `telegram.py:132-135`, but no `^flow_` `CallbackQueryHandler` registered (only `resolve:`/`step:`/`sobre:`/`demo:`, lines 1129-1132). The primary onboarding keyboard does nothing.
3. ✅ **`seenAt` hardcoded to `now()`** on the web sighting form (`AvistamentoClient.tsx:64`) — observer can't say *when* they saw the dog; corrupts WP16 time-reliability scoring. (was B5)

---

## BLOCKERS

| # | Flow | Title | Evidence | 100% =  |
|---|------|-------|----------|---------|
| B1 | bot owner/observer | ✅ owner_token NULL on bot cases | `api/bot/cases/route.ts:67`; mig `0014` no default | generate `randomBytes(16).toString('hex')` in insert (mirror `intake/stream:527`) + add column DEFAULT as belt-and-braces |
| B2 | telegram both | ✅ dead `flow_*` /start buttons | `telegram.py:132-135` vs `1129-1132` | register `CallbackQueryHandler(pattern="^flow_")` that `query.answer()`s + seeds the brain conversation |
| B3 | web observer | ✅ `seenAt` = submit time, no picker | `AvistamentoClient.tsx:64` | "Quando viste?" selector → maps to `observedTimeConfidence`/`observedTimeSource` |
| B4 | telegram owner | guided flow never starts for bot-native cases | `telegram.py:149-311` (`_handle_handoff` only on `?start=` deep-link) | after `create_case`, init `guided_flow` + `_send_step(...,0)` |
| B5 | telegram owner | ✅ `record_discovery` NameError crash | `pi_tools.py:1634` call, not imported (lazy import 1621 only has `lookup_canils/lookup_vets`) | add `record_discovery` to the lazy import → `discover_contacts` tool no longer crashes |

*(GATE-1 allowlist + GATE-2 web proximity opt-in moved to the go-live section above — founder's decision, not fixed here.)*

## MAJOR

### Web observer
- **PDF poster route 500** — `/api/cases/[slug]/poster` (`@react-pdf/renderer` gap shorthand); "A4·PT" button → 500 with no user error. (`como-funciona/page.tsx:124` self-documents; fix noted, awaiting deploy — verify.)
- **Map silently drops sightings with null `coords_approx`** — `CasePageClient.tsx:842`; most web sightings lack GPS → invisible on map. Fall back to centroid/last-seen pin.
- **Intel zones never real in prod** — `INTEL_SERVICE_URL=localhost:8080`; prod always uses `buildFallbackIntel()` (confidence always `low`, no movement). Infra gap.
- **Intel sightings sent with case coords, not their own** — `intel/route.ts:229` → no geographic variance for movement analysis.
- **Avistamento form: 2 HTTP requests** (fetch caseId then POST) — pass `caseId` as prop from server page.
- **No status feedback after sighting** — thank-you screen shows nothing; surface `reliability_score`/`action_recommendation` from the POST response + link back.
- **`NEXT_PUBLIC_TELEGRAM_BOT` unset** → falls back to literal `salvacao_bot`.
- **Email broken everywhere** — `RESEND_API_KEY=re_placeholder`; all owner/observer emails silently fail (`void` calls).

### Web owner
- **Intake never emails the owner their private link** — `intake/stream/route.ts:578` `create_case` emits `ownerToken` in SSE but calls no email. Close the tab = lose OwnerPanel access. `sendCaseConfirmation` exists (`send.ts:74`) but isn't called here.
- **`reporter_email` defaults to `noreply@nona.pt`** (`intake/stream:523`) → all 3 email types go to a dead address; guard to skip email on default.
- **FB Boost fallback link wrong when `fb_post_id` null** — `OwnerPanel.tsx:209`; eligible panel links to a generic FB help page, copy implies a Nona post exists. Hide until `fb_post_id` set.
- **Emails + sighting Telegram hardcode `/pt/`** — `sightings/[caseId]/route.ts:162`, all `send.ts` default `locale='pt'`; case row stores no locale. EN owners get PT URLs.
- **QRTile is fake** — `QRTile.tsx` renders a fixed pseudo-random pattern (seed=11), encodes nothing, not scannable. (Real QR only in the PDF.) Used next to "Cartaz com QR" on the case page.
- **`/api/cases` POST (legacy) has no owner_token** — `route.ts:76`; reachable by direct POST, would 404 the owner link. Likely dead code; add token or remove route.

### Telegram observer
- **No bot-native sighting reply from an alert** — alert is plain text + raw URL (`pi_tools.py:893`), no `[📸 Vi o cão]` inline button; observer must leave Telegram or send a generic photo with no case binding.
- **Observer's staged photo NOT attached to sighting** — `tools.py:268` POSTs without `photoPath` though `state.staged_photos` holds it; API supports it (`sightings/[caseId]/route.ts:129`). Photo abandoned in staging.
- **Sighting → PI agent only via unreliable realtime** — `runner.py:168` (`ch_sightings`); the code itself documents realtime dying silently. `_new_case_sweep` polls `agent_state='new'` only, not new sightings. Add `_new_sighting_sweep`.
- **`{app_url}` placeholder never substituted** — `prompts.py:71` raw `{app_url}`; `brain.py:68` passes `SYSTEM_PROMPT` with no `.format()`. LLM sees literal `{app_url}`.

### Telegram owner
- **Bot confirmation URL: no `?t=token`, no locale prefix** — `telegram.py:106` `f"{WEB_APP_URL}/caso/{slug}"`; owner lands on public page (no OwnerPanel), and `/caso/...` lacks `/pt`.
- **Sighting Telegram notice has no inline triage buttons** — `sightings/[caseId]/route.ts:179` plain `sendMessage`; triage is web-only. Add `[Sim,é ele|Não sei|Não é]` callback + handler.
- **`agent_state` not set to `resolved` on `/encontrado`** — `bot/cases/[slug]/resolve/route.ts:49`; PI agent keeps running escalation on a resolved case.
- **Resolution confirmation sent twice** — resolve route `sendTelegramMessage` + `handle_resolve_callback` edit both fire.
- **PI agent delivery sim-gated** (= B3) for all non-allowlisted users.
- **Missing env vars (silent failures)**: `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`/`GOOGLE_MAPS_API_KEY`, `SIM_REAL_DELIVERY_ALLOWLIST` — none in `.env.example`; each silently disables a feature (email / contact discovery / real delivery).
- **`monitor_fb.py` `fetch_fb_posts()` raises `NotImplementedError`** unconditionally outside sim — FB monitoring is a missing feature (documented).

## MINOR (high-signal subset)
- i18n: case page (`CasePageClient`), `/casos` list, avistamento form — all hardcoded PT, never call `useTranslations()`; EN/ES users see PT.
- `isOwner` derived from mere `?t=` presence (`CasePageClient.tsx:267`) → owner-mode UI flickers for any bogus `?t=` before fetch resolves; derive from `!!ownerData`.
- Dead footer `<span>`s ("privacidade/como funciona/parceiros") with no `href`; no `/privacidade` route.
- Homepage `activeAgentsCount` is `Math.random()` faked (`HomePageClient.tsx:587`).
- `meus-caes` has no nav/sign-out/sign-in path.
- `_flush_notifications` failed sends never marked → retried forever (no `failed_at`/retry cap).
- Synchronous `httpx.get/post` blocks the asyncio loop (`maps.py:92`, `broadcast.py:48`).
- Opt-in volunteer registered with empty `municipality` (`telegram.py:673`) → no-coords fallback alerts skip them.
- Bot sighting attach omits `reporterContact` + GPS (`tools.py:275`) → under-scored + slow geocode.
- `_sobre_markup` `KeyError` on unknown page key (`telegram.py:544`); `check_rate_limit` imported, never called.
- Web `?connect=1` carried through redirect but never read (auto-link fires anyway → harmless dead weight).
- `/api/owner/[token]/step` orphaned on web (P6 dropped check-off; bot still tracks `guided_flow` directly). Decide: re-add web checkboxes vs. accept Telegram-only tracking.

## Fix execution order
1. **Sim-safe bug fixes — DONE this session** (do not touch the go-live gate): B1 owner_token + DEFAULT, B5 record_discovery crash, agent_state='resolved' on /encontrado, double-resolve dedup, {app_url} .format(), bot confirm URL → `/pt` + `?t=token`. All also improve the founder's sandbox. Verified in sim harness.
2. **Sim-safe, needs behavior definition**: B2 dead `flow_*` buttons, B4 guided-flow-start for bot-native cases. (Sim-safe; implemented if behavior is clear.)
3. **Code fixes still pending** (sim-safe, next): photo/GPS/contact on bot sighting attach, `_new_sighting_sweep`, map null-coords fallback, intake email of owner link, FB-boost null guard, isOwner-from-ownerData, QR real render.
4. **Infra/credentials (founder)**: RESEND key, INTEL_SERVICE_URL, NEXT_PUBLIC_TELEGRAM_BOT, env-var docs.
5. **Go-live decision (founder)**: GATE-1 allowlist flip, GATE-2 web proximity opt-in. ⚠️ irreversible real-people contact.
6. **Product decisions (founder)**: i18n strategy, QR real vs PDF-only, observer follow-up notifications, web proximity UX.
