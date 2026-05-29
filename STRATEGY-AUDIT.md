# Nona — Strategy & Product Audit
*2026-05-29. Audit of problem / audience / value prop / positioning / strategy, then a UI proposal sequenced by leverage. Leads with what is misaligned, not what is fine.*

---

## TL;DR — the verdict

The **differentiation is real and the science moat is genuine.** That is not the problem.

The problem is the two things an audit is supposed to surface:

1. **The value prop is currently undeliverable in production — it's a DATA problem, not a feature problem.**
2. **There are zero real users, so the entire behavioral engine is unvalidated — and distribution (not the product) is the unsolved crux.**

The honest strategic conclusion: **stop building and designing new layers. The next unit of work is 10 real cases end-to-end + filling the contact data.** Everything below supports that.

---

## 0. Disconfirming findings (verified in prod, 2026-05-29)

| Check | Reality | Implication |
|---|---|---|
| `cases` = 13 | **All test/simulation** (`test+*`, `test.sim`, sim personas) | **0 real organic users.** Nothing has been validated by a real owner. |
| `sightings` = 0 | **Never a single real sighting** | WP17 triage loop, WP20 FB monitor, WP21 radius→ads, ML matching — **all unexercised on real data**. Built, never run. |
| `kb_canils`=16 / `kb_vets`=14 with email = **0 / 0** | Seed has names, **no email addresses** | **WP18 Tier-1 alert fires to nobody.** "Canis e veterinários avisados antes de acabares de falar" is vapor in prod today. |
| `kb_channels` = 13 | Seeded, `monitor_enabled` likely all false, no auth profile | WP20 monitoring cannot run; the FB-group amplification is not wired to anything live. |

**Read this plainly:** the moat (action_gate, protocol, triage, alerts) is *built* but the parts that make it a product a real owner benefits from are either un-fed (contacts) or un-run (sightings). The session's instinct — polish features and the landing — is the reinforcing-audit trap. The leverage is elsewhere.

---

## 1. The problem (audit)

**Real and well-understood.** Dogs lost in the Algarve; existing networks (Encontra-me.org ~178k listings, CROAF, Facebook groups, PSP/GNR) are fragmented and overloaded. The community *exists* but lacks operational infrastructure. Owners act on wrong instinct (chase, shout, drive around) in the critical first hours and make recovery less likely. Most dogs are found <72h, often <1 mile from home, **without ML** — *if the owner does the right things early* (Weiss 2012; HASS/Fi 2021).

**The sharp version:** the problem is NOT "there's no place to list a lost dog" (Encontra-me already owns that). The problem is **"nobody tells the panicked owner what to actually do, and nobody does the logistics for them."** That gap is real and unserved. Keep this framing — it is the whole thesis.

**Risk to the thesis:** the problem is most acute in the first 6-24h, which is exactly when the owner is NOT calmly evaluating a new website. If we can't reach them in that window, the science advantage never gets used.

---

## 2. Audience (audit + refinement)

Five segments; they are not equal and the product currently treats them as one.

| Segment | Window | Context | Currently served? |
|---|---|---|---|
| **Owner just lost (PRIMARY)** | h0–72, panic | phone, outdoors, one hand, bad signal | partially — UI is desktop/editorial, not panic/mobile |
| **Owner weeks in** | exhausted | "hung the poster, now what" | the dashboard/case-file is the answer; underbuilt |
| **Finder of a stray** | opportunistic | wants to reunite fast | flow exists, secondary |
| **Witness / sighting** | seconds, goodwill | wants zero friction | OK conceptually |
| **Community / volunteers / FB admins / CROAF / vets** | ongoing | the amplifiers | **not served at all — and they are the distribution** |

**Refinement 1 — the expat wedge.** The Algarve has a large English-speaking expat population. They are *underserved* by Portuguese-language FB groups and Encontra-me, often the most anxious and least networked locally. **EN-first Nona is a real, defensible wedge into the most underserved high-anxiety segment.** Treat EN as first-class, not a translation afterthought.

**Refinement 2 — galgo/podenco specificity.** Hunting-dog abandonment is an Algarve reality and these are exactly the hard, fear-reactive cases where the action_gate (don't chase, don't broadcast) matters most and where generic global tools (Petco Love Lost, PawBoost) give dangerous advice. Lean into it — it's hyperlocal moat.

**Refinement 3 — the amplifiers are the distribution channel, not a "nice to have."** A no-budget tool reaches owners through the people who already run the community: FB-group admins, CROAF, vets. They need their own surface (enroll, get a partner link, push cases). This is missing entirely.

---

## 3. Value proposition (is it TRUE? is it REACHABLE?)

**Stated:** "Maximizamos a probabilidade de o encontrar — com ciência, não com pressa." Plus: define the case, the system executes everything (alerts, posters, community) and tells you what to do / not do.

**Is it TRUE (deliverable)?** Partially, and the gap is data not code:
- ✅ The protocol / action_gate / "what not to do" — **true today**, deliverable with zero dependencies. This is the strongest, most honest claim. (The pre-signup widget already proves it.)
- ❌ "Canis, vets, grupos avisados" — **false today** (0 emails in KB). The pipe exists; the contacts don't.
- ⚠️ "Vigiamos e avisamos" (WP20) — not running (no auth profile, monitor disabled).
- ⚠️ Posters/social posting — depends on Meta creds + partner pages.

**Conclusion:** the value prop should, *for now*, lead almost entirely on the **guidance/protocol** (true, free, instant) and treat the automation claims as roadmap until the contact data and integrations are real. Over-promising "everything is handled" when 0 emails send is the fastest way to lose the trust the whole brand is built on.

**Is it REACHABLE (distribution)?** This is the unsolved crux. The panicked owner lives in Facebook groups and Encontra-me, not on this homepage. Therefore:
- **The website landing is NOT the primary adoption surface.** (We polished it this session; not wasted, but not the lever.)
- Adoption happens **in-channel**: the Telegram/WhatsApp bot, and — critically — **a shared case-page link pasted into a FB group**. The case page is the viral atom.
- The growth loop: owner creates case → shares link in their FB groups → witnesses see a *credible, science-backed, actionable* page (not a plain photo post) → some convert to creating their own cases → amplifiers notice and enroll.

---

## 4. Positioning (audit)

**Correct and should be sharpened: Nona is the operational brain ON TOP of the existing networks, not a competing board.** Encontra-me owns the national listing board (178k); competing there is a losing game. Nona's category is the thing none of them are: *sistema operativo de resgate canino baseado em inferência probabilística e comportamento* — the layer that decides what to do and coordinates it.

**Implication not yet drawn:** do **not** build a big public "browse all lost dogs" board (that competes with Encontra-me and dilutes the message). Instead the public surface should emphasize *"já publicámos no Encontra-me / nos grupos por ti"* — complement, don't compete.

**Competitive map:**
- Encontra-me / FindMyPet / Pet Alert PT — national boards. *Complement, feed them.*
- CROAF, FB groups, PSP/GNR — community + authority. *Amplifiers / partners.*
- Petco Love Lost / PawBoost / Petnow — global ML re-ID. *No Algarve terrain intelligence; our hyperlocal GIS + behavioral protocol is the moat.*

---

## 5. Strategy — refinements that change course

Strategy is mostly sound. Four refinements actually change what to do next:

1. **Shift the next unit of work from "build/design" to "validate + feed."** Target: **10 real cases end-to-end** + **fill canil/vet emails for 3-4 pilot municipalities** (not all 16). Without this, every new feature is unvalidated and the headline value prop stays vapor. *This is the single highest-leverage move and it is not a coding task.*
2. **Re-sequence UI by leverage: case page → bot → dashboard → landing.** The case page is the viral atom and the first thing most real owners see (via a shared link). Landing is last.
3. **Lead the value prop on guidance (true/free/instant); demote automation claims to roadmap** until contacts/integrations are real. Protects trust.
4. **Stand up the amplifier surface** (enroll a FB group / CROAF / vet; partner link). This is the distribution channel and currently doesn't exist.

**Scope cut:** "two audiences, two registers" doubles UI work for a no-budget tool. **Nail the panicked-owner surface first; defer the warm community surface** (beyond a basic enroll page).

**What NOT to change:** the science moat, the action_gate, the "what not to do" differentiator, the no-money/MIT model, the Algarve hyperlocal focus, EN/PT bilingual. These are right.

---

## 6. UI proposal (sequenced by leverage)

Build on the existing Nona design system (ink/paper, Instrument Serif + Inter Tight + JetBrains Mono). **Two principles throughout:** (a) **mobile-first, panic-first** — the real context is a phone, outdoors, one hand; (b) **dual register** — editorial calm for the emotional surface, operational console (mono, timestamps, status) for the proof-of-work surface. That contrast *is* the concept ("calm outside, serious machine inside").

### Priority 1 — The Case Page (the viral atom)
This is what gets pasted into FB groups and printed. It must out-credit a plain photo post in 3 seconds on a phone.
- **Above the fold on mobile:** big dog photo, name, status, last-seen + time (honest, WP16), and ONE primary action: **"Vi este cão"** (one tap, anonymous, no account).
- **Live operations log (console register):** the "we're doing everything" panel as a timestamped feed — `✓ caso criado · ✓ protocolo activo · ✓ rede avisada · ⏳ a vigiar`. Mono type, calm authority. (Reuses AgentFeed/assessment.)
- **The map that tightens** (WP17): last-seen + posterior radius + water points (WP19). Visual proof of probabilistic reasoning.
- **Share + poster:** native share, QR, A4 poster — designed to be the thing dropped into a group.
- Nona present as the case officer ("Nona está a vigiar este caso").

### Priority 2 — Bot intake (the in-channel entry)
Most real owners arrive via Telegram/WhatsApp, not the web. Make the bot conversation carry the same authority + guidance-first flow (already largely built — WP15). Ensure the bot emits a shareable case link immediately.

### Priority 3 — Owner dashboard `meu-caso` (the live case file)
For the exhausted "weeks in" owner. Reframe as an **operations dossier**: timestamped entries, evidence, current phase, next actions, the triage panel (WP17). Console register. Gives the felt sense of continuous work.

### Priority 4 — Landing (last)
Already rebuilt this session (hero, live protocol widget, "o que não fazer", pillars). Good enough. The one change the audit forces: **lead on guidance, soften the automation promises** to match what actually delivers today, and add a small **"para grupos / parceiros"** entry (amplifier enroll).

### Mobile / panic specifics (cross-cutting, highest UX debt)
- Panic path: in mobile lost-mode, **"Estou no terreno — diz-me o que fazer já"** becomes the giant primary button, thumb-reachable, one decision at a time.
- All grids (2×2 don'ts, 7-col reunidos) must reflow to 1 column on phone.
- Bilingual PT/EN toggle prominent (expat wedge).

---

## 7. Recommended next actions (in order)

1. **Fill canil + vet emails for 3-4 pilot municipalities** (e.g. Loulé, Faro, Lagos, Albufeira). Makes WP18 real. Non-coding, highest leverage.
2. **Get 10 real cases** through the bot end-to-end (recruit via one partner FB group / CROAF). Validates the engine; produces the first real sightings.
3. **Case-page mobile redesign** (Priority 1 above) — the viral atom.
4. **Amplifier enroll surface** — one page + a partner link mechanism.
5. Only then: revisit ML accuracy (needs the real cases to evaluate against), WP21 ads (needs budget/creds), WP20 monitoring (needs auth profile).

**The uncomfortable headline:** the best next move is not in this repo. It's contacts in a spreadsheet and ten real owners.

---

## 8. Does the value prop answer the USER? (pre-release product pass)

Set aside the data/distribution reality. Pure product-strategy question: does the value prop truly answer the problem **and the user**?

**Answers the PROBLEM — yes, structurally.** The action_gate + protocol + automation attack the documented failure modes (wrong instinct, no coordination, fragmented networks). Well-aimed.

**Answers the USER — only halfway.** It is built for the *rational* user; the real user at h0 is in *limbic panic, not cortical*. Five tensions it does not resolve:

1. **Assumes a user who can read a protocol — they can't.** Acute stress ≠ information processing. Acute phase must deliver **ONE action now**, not a protocol. Near-zero cognitive load.
2. **"We do everything for you" collides with the desperate need for AGENCY.** The owner has a biological need to *act*; the correct message is often "stay still, do less." "We handle it" can leave them passive/helpless when they need to feel active. Fix: **channel the act-impulse into the correct physical tasks** (build the station, place the camera, walk the water points) — science-correct work that satisfies agency.
3. **Trust at zero-relationship, peak-stakes.** Authority-by-citation ("1,015 cases") is abstract against the social proof of their neighbours' FB group. Trust bridge = **complement, not replace** ("we make your group's effort 10× more effective") + immediately visible competence.
4. **Process-honesty vs the need for HOPE.** "Maximize probability, not find him" is honest but can read cold/evasive in panic. Authoritative tone risks starving the hope the user needs. Science carries the method; **warmth must carry the hope** — check the hero gives enough.
5. **The differentiator ("what not to do") is what's TRUE, not what the user WANTS to hear at h0.** It fights the user's instinct — it's a credibility/retention asset, not the acquisition hook. The acquisition hook is **relief** ("we do the overwhelming logistics"), not friction ("stop doing that"). Order-for-the-user ≠ order-by-scientific-importance.

**Two-sided market gap:** the prop is almost entirely owner-facing. Reunions often close via a *finder* or *witness*, whose problem ("I found a dog — whose is it?": chip/SIAC, visual match) the prop barely answers.

**One-line reframe (thesis refinement):** the job-to-be-done at h0 is **not "find the dog"** — it's *make a person in the worst moment of their week feel not alone and not powerless, while quietly steering them off the fatal mistakes.* The first job is **emotional stabilization that enables correct action**; the science is the method, the first contact is human.

**Verdict:** don't change *what* it does (science is right). Change the **emotional choreography** of acute-phase delivery: panic-first → one action + hope + relief → channel agency into safe tasks → trust-via-complement. That is what's missing for it to answer the *user*, not just the *problem*. (Note: this softens the earlier "confidence over empathy, empathy only in community" call — in the acute hero, hope/warmth must lead; authority follows.)

### 8.1 Decision — guided steps, NOT a protocol dump
The protocol is the **engine (backend)**. The **delivery** for a panicked user is the agent leading **one concrete action at a time**, paced to the human, confirmable: "do this" → user marks done → "now this." This resolves cracks #1 (cognitive load) and #2 (agency) simultaneously, and mirrors how every high-stakes-under-stress domain works (AED/CPR voice prompts, aviation checklists, 112 dispatch). A wall-of-text protocol is exactly what a limbic brain cannot process. **Do-everything-for-them and let-them-act are not in conflict** if split correctly: the system runs the logistics it can automate (contact shelters/vets, generate posters, post) *in parallel* while it hands the owner the physical tasks only a human on-site can do (scent item, feeding station, camera), one at a time, calibrated to the case.

### 8.2 Operational dashboard (owner) — "what's being done" + "your next action"
Not overwhelming. Progressive disclosure. Two columns of truth: **(a) what the system has done for you** (shelters contacted, poster ready, posted to N groups — the relief/"not alone") and **(b) your single next action** (with done/skip). Console register (timestamps, status). This is where agency + relief + trust live together.

### 8.3 Phase-2 growth idea (PARK — do not build now)
Convert recovered-dog owners into **trained rational interveners** ("alumnos de intervenção"): a graduate path where owners who got their dog back are coached into the science, then help recover others' dogs. This is simultaneously: a **growth flywheel** (graduates evangelize + bring cases), the **human field network** for hard cases (the physical-intervention layer the software can't do), and the **only ethical monetization** (optional paid training/certification — never charging a panicked owner). Phase 2. Park it; it informs but does not gate the release.
