# Plan — Acute-Phase Emotional Choreography (Nona)
*2026-05-29. Implements the STRATEGY-AUDIT §8 refinements: deliver the science as agent-led, one-action-at-a-time guidance for a panicked human, with a calm operational dashboard, hope-first warmth, and trust-by-complement. Mobile-first. Grounded in research.*

---

## Why (the problem this fixes)

The value prop answers the *problem* but only half-answers the *user*. The user at h0 is in **limbic panic, not cortical** — acute stress narrows working memory and impairs the prefrontal/executive function needed to read a protocol or weigh probabilities (Arnsten 2009). Yet the current delivery is a **protocol dump** (ProtocolCard / FieldGuideCard = walls of do/don't). That is exactly what a panicked brain cannot process.

Every high-stakes-under-stress domain solved this the same way: **read-and-do cognitive aids, one step at a time, confirmed.**
- Surgical-crisis checklists cut missed critical steps ~6× in simulated OR crises (Arriaga et al., NEJM 2013).
- Emergency medical dispatch reads **one pre-arrival instruction at a time** in a calm voice to a panicked caller (dispatcher-assisted CPR is the gold model).
- AED units **speak one action, wait, confirm.**
- Lost-pet best practice already does a degraded version: HARTT hands owners a **print-and-check-off checklist** ("check off each item once completed"). Our agentic version is the natural digital evolution.

Two more research-grounded design forces:
- **Agency reduces distress.** Perceived control and behavioral activation counter the paralysis/helplessness of crisis. The owner has a biological need to *act* — and the science often says "don't chase, stay still." Resolve by **channeling the act-impulse into the correct physical tasks** (scent item, feeding station, camera), framed as active work, not "sit and wait."
- **First 24-48h are decisive; ~70% of lost dogs stay within ~1 mile** (HARTT; Weiss 2012). Urgency + locality justify front-loading the right local actions.

---

## The model: two tracks, one orchestrator

A case runs **two parallel tracks** from minute 0:

```
                 ┌─────────────────────────────────────────────┐
   CASE OPENED → │  AUTOMATED TRACK (system does — "not alone") │  shelters/vets alerted,
                 │  fire-and-forget, shown as a calm done-feed   │  poster generated, posts,
                 └─────────────────────────────────────────────┘  monitoring armed
                 ┌─────────────────────────────────────────────┐
                 │  GUIDED TRACK (owner does — "not powerless")  │  ONE physical action
                 │  agent emits the single next action, paced    │  at a time, calibrated
                 └─────────────────────────────────────────────┘  to breed/trigger/terrain
```

The **operational dashboard** shows both truths side by side: *what we've done for you* (relief) + *your single next action* (agency). That dual display is the emotional contract — "not alone, not powerless" — made literal.

This does NOT change the science (the protocol/action_gate engine stays). It changes the **delivery choreography**.

---

## Workstreams

### WS-A — Guided Step *renderer* (NOT a new backend engine for v1)
**Descoped per review: do not build a stateful, persisted, agent-advanced step engine + SSE + migration at zero users — that's the over-build the audit warns against.** The content already exists (`send_field_guide` BUCKET_GUIDES + `computePhaseAndGate` + action_gate, all built this session). v1 = a **client-side renderer** that takes that existing content and presents it one action at a time, with done/skip in component state. No new engine, no new SSE, no migration.
- A pure function reshapes the existing field-guide list → an ordered single-action queue, keyed by phase/trigger. Hard cases (galgo/podenco/panic) → short passive sequence (station→camera→**wait**); opportunistic → active sequence.
- Done/skip lives in component state. If we want it to survive a reload, write it into the **existing** `behavioral_profile` JSONB via the `meu-caso` dashboard already built — not a new system.
- "Do-less" steps reframed as active tasks: not "don't search" but **"Coloca esta peça com o teu cheiro no ponto exacto — é a tua tarefa agora."**
- Persisted step-state + a `case_steps` table earn their keep ONLY once there are real users + analytics need (and it becomes the seed for the phase-2 graduate path). Defer.

### WS-B — Acute Flow UI (mobile-first, the hero experience)
The panicked owner's first surface. One action card at a time.
- **One card, full attention:** the single next action, a one-line *why*, and two buttons — **Feito** / **Agora não**. Marking done reveals the next. No scrolling wall.
- **Nona's voice:** calm, clinical-but-warm, present tense. "Respira. A primeira coisa: …" Hope carried by warmth, method by the step.
- **Progress + hope:** a quiet progress indicator ("3 de 6 ações da primeira hora") and a hope anchor ("a maioria dos cães está a menos de 1 km, escondida — vamos trazê-lo"). Honest, not a promise.
- **The automated track as a calm sidebar/drawer** — but **honest real-time status, never fake checkmarks** (see WS-C #1): "a contactar canis… ✓ 2 confirmaram", not "✓ avisados" when 0 emails exist.
- Reuses/evolves `FieldGuideCard` → `GuidedStepCard`. Big thumb targets, single column, works one-handed outdoors.

#### WS-B critical sub-design: **the WAIT is the experience for hard cases**
For a galgo/panic case the correct sequence is *short* — station → camera → **then do nothing** — and the owner is left at 2am, desperate to act, told to stop. That **inter-step / passive state is the dominant emotional reality** for exactly the hardest cases that need us most, and a step-queue alone leaves it hollow. Design it explicitly:
- **Reframe the wait as the active correct intervention:** "A câmara está a trabalhar por ti agora. A tua tarefa é descansar para a busca ao amanhecer — vais precisar de energia." The wait is not absence of action; it IS the action.
- **A calm next-check anchor:** "Próxima verificação da estação: 22:00 (pico de atividade 22h-06h)." Gives the agency-need a future handhold instead of a void.
- **Nona present in the gap:** a quiet "Nona está a vigiar · há 3 min" heartbeat so the owner isn't alone in the silence.
- This is where "maravilloso" lives. Without it the flow is great for opportunistic cases and empty for the fearful ones.

### WS-C — Operational Dashboard (`meu-caso` evolution)
Not overwhelming. Progressive disclosure. The "weeks-in" owner's home.
- **Two columns of truth:** (a) *Feito por ti pela Nona* — done-feed = relief; (b) *A tua próxima ação* — single task with done/skip = agency.
- **#1 — HONEST STATUS, GATED ON ACTUAL DELIVERY (blocking correctness rule).** Prod truth today: `kb_canils`/`kb_vets` have **0 emails**, Meta creds unset, FB monitor unarmed → `fireProfessionalAlert` reaches nobody. A done-feed showing "✓ canis avisados · ✓ posted to N groups" would be **fabrication at the exact moment we're earning trust** — it violates this plan's own trust-by-complement principle and the brand thesis. Rule: **every status reflects what actually happened.** "A contactar 3 canis na zona… ✓ 2 confirmaram recepção" — present-continuous until real, ✓ only on confirmed send. Honest real-time status builds *more* trust than fake ticks, and it makes "fill the canil/vet emails" a **visible, motivating dependency** (the audit's #1 priority surfaces here, not hidden). If nothing real fired, say so plainly ("ainda a montar a tua rede local").
- Console register (mono, timestamps, status dots). Reuses AgentFeed + assessment + the WP17 triage panel.
- Nona as case officer ("Nona está a vigiar este caso · há 4 min").
- Collapsible detail; default view = one glance, one action.

### WS-D — Emotional choreography in copy (acute surfaces)
Implements the audit's softening of "confidence over empathy" **for the acute moment only**.
- Hero/first-contact: **hope + relief lead, authority follows.** (Landing's authoritative hero stays for browsers; the *in-flow* acute voice leads with warmth.)
- **Trust-by-complement everywhere:** "Não substituímos o teu grupo de Facebook — multiplicamos o que ele faz" + "Já publicámos por ti." Bridges the zero-relationship trust gap against known community channels.
- **Acquisition hook = relief** ("nós tratamos da logística"); **what-not-to-do = retention/credibility** (surfaces inside the flow as the agent steers, not as a cold upfront list).

### WS-E — Finder / witness side (close the two-sided gap — scope, then build minimal)
brief_03 reframes the finder as a **reporting-probability problem**: the dog is often safe in someone's quinta while the owner posts on Facebook the finder never sees. The owner-only value prop leaves reunions on the table.
- Minimal finder flow: one-tap "Encontrei um cão" → photo → **immediate chip/SIAC prompt** (highest-value: a chip closes the case instantly) → visual match against active cases (ML already built) → "is this dog?" The finder's JTBD is *"whose is it, fast"*, not "tell me what to do."
- This is also why the AUTOMATED track (canil/vet/amplifier alerts) matters: it reaches the offline finder the owner's FB post can't.

### Phase-2 (PARKED — do not build now)
Recovered owners → **trained rational interveners** ("alumnos de intervenção"): graduate path = growth flywheel + human field-network for hard cases + only ethical monetization (optional paid training, never charging a panicked owner). Informs design (the dashboard's "what Nona taught me" could seed it) but does not gate release.

---

## Sequencing by leverage
Per audit: the case page is the viral atom; the acute flow is the user's true first experience. Order:
1. **WS-A Guided Step Engine** (unblocks everything).
2. **WS-B Acute Flow UI** (the wonderful thing — the panic experience).
3. **WS-C Operational Dashboard** (retention + relief/agency home).
4. **WS-D copy choreography** (threads through A-C).
5. **WS-E finder minimal** (two-sided completeness).
Landing already done; only WS-D copy touch-ups there.

## Research grounding (citations)
- Arnsten 2009 — acute stress impairs prefrontal/executive function → minimize choices, one step.
- Arriaga et al. NEJM 2013 — crisis checklists cut missed steps ~6× → read-and-do cognitive aid.
- Emergency medical dispatch (dispatcher-assisted CPR) — one calm pre-arrival instruction at a time → the interaction model.
- Behavioral activation / perceived control (Jacobson; locus-of-control literature) → channel agency into safe tasks.
- HARTT lost-pet owner guide — print-and-check-off checklist → our digital evolution; "shy dog protocol", "don't have many people calling the name".
- Weiss 2012 (n=1015) / HARTT — first 24-48h critical, ~70% within ~1 mile → front-load correct local actions.
- brief_03 (vault) — finder = reporting-probability problem → WS-E + automated alert track.

## Verification (when built)
- A panicked-user walkthrough on a phone: open case → see ONE action → mark done → next appears; automated track shows alerts as a calm feed; never a wall of text.
- Galgo+panic → passive sequence (station/camera, never chase); labrador+door → active sequence. Steps respect action_gate.
- Dashboard shows both truths; triage panel (WP17) lives there.
- Finder flow: chip prompt fires first; visual match surfaces candidates.
- Copy: acute surfaces lead with hope/relief; "complement not replace" present.

## Dependency: A (contact-data) comes first
The honest dashboard (#1) and the automated track only become *true* when the canil/vet emails exist. So the queued **task A — contact-data scaffold for 3-4 pilot municipalities — is a prerequisite, not a parallel nicety.** Sequence A before WS-C ships, or WS-C honestly shows "ainda a montar a rede".

## This plan is built TO BE validated (not competing with "get 10 cases")
Core hypothesis — *one-action-at-a-time helps a panicked human* — is **unfalsifiable without real users**. This plan and the audit's "get 10 real cases" priority are the same effort: build the acute flow minimal + client-side, ship to the first 10 owners, learn. No persisted engine until those cases justify it.

## Open decisions to confirm before building
1. ~~JSONB vs table for steps~~ → resolved: **no new persistence in v1.** Client-side render over existing field-guide content; reload-persistence (if needed) via existing `behavioral_profile`.
2. Does the acute flow live inside the existing chat canvas, or a dedicated `/caso/[slug]/agora` step view linked from the bot/case page? Rec: dedicated step view (chat is for intake; guided flow is post-intake action).
3. WS-E finder depth for v1: chip-prompt + visual-match only, or full finder case? Rec: minimal (chip + match) now.
