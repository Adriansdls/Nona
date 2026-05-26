# SalvaCão — Designer Brief
*For the product designer. v1 — 2026-05-26*

---

## The Feeling You're Designing For

When someone's dog disappears at midnight in a small Portuguese town, they panic. They don't know who to call. They open their phone and find SalvaCão.

**The feeling this platform must produce:** *I am not alone. Something is happening. Someone is on it.*

Not "I submitted a form." Not "I will hear back." Something immediate, alive, breathing. The platform should feel like a tireless, deeply caring community member who happens to work 24h, speaks your language, and has already started doing everything before you even finish explaining.

That is the emotional north star. Design toward it.

---

## Who Uses This

**Primary — the distressed owner:** Their dog is gone. They're scared, not thinking clearly. They may be 35 or 75. They may have a new iPhone or a 5-year-old Android with 8% battery. They need help *now* and they need to feel that help is coming.

**Primary (equal weight) — the finder:** Someone found a stray dog. They have a good heart and no idea what to do. They took a photo. They want to find the owner but they're not going to spend 40 minutes on it. This flow must be as easy as sending a WhatsApp.

**Secondary — the volunteer/coordinator:** A person who runs a local Facebook animal rescue group. They check the platform daily. They want a clean overview, not a data dump. They approve sightings, coordinate matches, manage their local network.

**Secondary — the admin:** A trusted person who can manage cases, see private information, and mark cases as resolved. The admin panel doesn't need to be beautiful — it needs to be fast and functional.

---

## What Is This, Precisely

Not a social network. Not a rescue organization. Not another Facebook group.

A **community coordination tool** that does the manual work for you: creates the case page, generates the printable poster, posts to linked social networks, alerts nearby volunteers, runs the visual similarity search against all other cases, and sends you updates as they happen. All of this fires automatically when a case is created — the user just reports; the platform acts.

The primary intake is a **conversational agent** — a Telegram bot (and eventually WhatsApp). Not a form, not a chatbot, but something new: a system that listens, understands, infers, asks only what it can't figure out itself, and then gets to work. The web form at `/reportar` remains as a fallback — desktop users, people who prefer it — but it's not the main entrance.

---

## The Five Situations

Every case is one of these:

| Situation | Who arrives | What they need |
|---|---|---|
| **Cão Perdido** | Owner whose dog disappeared | Speed. Amplification. Updates. |
| **Cão Encontrado** | Person who found a stray | Simplicity. Find the owner. |
| **Avistamento** | Witness who saw a specific dog | Minimum friction — one tap, one photo, done |
| **Bem-estar** | Someone who saw a dog in distress | Connect to local rescue contacts immediately |
| **Possível furto** | Owner suspects theft | Private flag on a perdido case. Never public accusation. |

**The Perdido and Encontrado flows have equal weight.** The current web form treats Perdido as primary. Correct this. A found dog needs the same urgency, the same card design, the same amplification.

---

## The Orchestration Panel — Design This Deliberately

This is the single most important UI element on a case page. The user asked: *"I want people to feel that everything we can do, we are doing."*

When a case is created, the platform runs a sequence of actions. Each action has a status. Show it. Something like:

```
✓ Caso criado
✓ Poster gerado → [Download PDF]
✓ Publicado em 4 grupos Facebook do Algarve
✓ Verificação visual iniciada — 0 coincidências até agora
✓ 3 voluntários nas proximidades notificados
⏳ Aguardando avistamentos...
```

This is not a sidebar widget. It is a core section of the case page. Design it as a first-class element. Make it feel alive, not like a log dump. Each resolved step should feel like a small act of care.

The data is real: these actions actually happen. The design just needs to surface them.

---

## Page Inventory

For each page: who arrives, what they feel when they land, what they do next.

---

### `/` — Landing

**Who:** Anyone. Mostly people who just received a link or are curious about the service.

**Feel:** Warmth + immediacy. "Dogs are being found here." Not a startup landing page. Not a charity campaign. A living community noticeboard.

**What they do next:** "My dog is lost" or "I found a dog" — two paths, immediately visible. Secondary: browse recent cases.

**Show:** A live counter of active cases and cases resolved. A scrollable feed of recent cases (photos, names, municipalities). Nothing else until you scroll.

---

### `/reportar` — Web Report Form

**Who:** Someone who prefers not to use the bot, or is on desktop.

**Feel:** Guided, not overwhelming. One step at a time. Never looks like a government form.

**What they do next:** Upload photo → answer a few questions → submit → arrive at their new case page.

**4 steps:** (1) What happened? (2) Describe the dog + photo (3) Where and when (4) Your contact. Progress clearly visible but not in the way.

---

### `/caso/[slug]` — Public Case Page

**Who:** Anyone who received a link to share; volunteers; people scrolling cases.

**Feel:** Urgency for an active case. Warmth and resolution for a resolved case.

**What they do next:** Share the case. Report a sighting. Download the poster. Nothing else — no registration required.

**Required elements:**
- Large hero photo (full-width or near, high impact)
- Dog's name + status (ATIVO / RESOLVIDO — large, unmissable, color-coded: orange for active, green for resolved)
- Dog details: breed, color, distinctive marks, approximate age
- Last seen: municipality + zone + date/time
- **Orchestration panel** (described above)
- Sightings timeline (approved sightings only, in reverse chronological order, zone only — no exact address)
- QR code (for sharing and posters)
- Download poster button
- "Vi este cão" — one-tap sighting report
- "Partilhar" — native share + social links

**Never on this page:** Reporter's full name, email, phone number, exact GPS coordinates, chip number (only last 3 digits if shown), suspected theft flag, admin notes.

---

### `/caso/[slug]/avistamento` — Report a Sighting

**Who:** Someone who just saw the dog from a case they found on social media.

**Feel:** Quick. Don't make them create an account. They have 30 seconds of good intention — don't waste it.

**What they do next:** Where, when, what they saw. One photo if they have it. Submit. They're done.

**After submit:** "Obrigado — a sua informação foi recebida e está a ser verificada. Receberá uma resposta em breve."

---

### `/casos` — Case List

**Who:** Volunteers scanning for cases in their area. Curious users. Local rescue coordinators.

**Feel:** Informative, scannable. A grid of dog cards — photo, name, type, municipality, days since reported.

**Filters:** Type (perdido/encontrado), Municipality, Status (ativo/resolvido). Nothing more complex for v1.

---

### `/admin/*` — Admin Panel

**Who:** Verified staff, volunteers, clinic admins.

**Feel:** Functional. Fast. This is a working tool, not a showcase. Can be clean and minimal but doesn't need the same warmth as the public-facing pages.

**Sub-pages:**
- Dashboard: case counts, today's activity, pending review queue
- Cases: full list with filters + access to private reporter data
- Sightings: review queue (approve shows it on public page, reject doesn't)
- Visual matches: side-by-side photo comparison, confirm or discard
- Users: role management, verification, invite

---

## The Dog Card

Every case has a card in the list view and as a share preview. Design this as a reusable, shareable artifact:

- Photo (square crop, best quality available)
- Dog name (or "Sem nome" gracefully)
- Case type badge: PERDIDO / ENCONTRADO (different colors — never the same)
- Municipality
- Time elapsed ("há 2 dias" / "há 3 horas")
- Status indicator (subtle for active, prominent for resolved)

The card must look good when shared on Facebook, WhatsApp, iMessage. Design the OG image (1200×630) as deliberately as the card.

---

## The Poster

Every case auto-generates a printable A4 PDF poster. The poster is downloaded and printed by volunteers — it goes on shop windows, vet clinic noticeboards, park entrances.

Required elements: large photo, dog name, PROCURA-SE / LOST DOG / SE BUSCA (by locale), breed + color + distinctive marks, last seen location + date, QR code to case page, public contact *only if reporter explicitly provided one*.

**Never on poster:** reporter email, reporter phone (unless explicitly provided as public contact), chip number, suspected theft.

---

## The Agentic Experience — Bot UI Principles

The Telegram bot is the primary intake. You don't design its bubbles (Telegram controls that), but the conversation flow and the case-creation confirmation message do have design implications:

**The confirmation message** (sent by the bot after case creation) is a designed artifact:

```
✅ Pronto! A página do Rex está criada.

🔗 salvacao.pt/caso/rex-labrador-faro-26mai
📄 Poster para imprimir → [link]
📢 A publicar em grupos Facebook do Algarve agora
🔍 A verificar a base de dados — sem coincidências por enquanto

Envie-me mensagem quando tiver novidades.
```

This message needs to feel like a handover, not a receipt. "Here's what I did. Here's what's happening. I'm watching."

---

## Reference Points — Feel, Not Form

Not asking you to copy these. Asking you to feel what they get right:

- **Superhuman** — every interaction feels considered, nothing wasted, the UI trusts the user
- **Linear** — information density done right: a lot of data, never overwhelming
- **Duolingo** — warmth through micro-interactions, encourages without patronizing
- **Nextdoor (at its best)** — genuine community feel, not corporate
- **Paper forms at a Portuguese Junta de Freguesia** — this is what we're replacing. Our users know this. Honor the warmth of that, discard the friction.

One hard constraint: **this must work for a 70-year-old in Tavira on a slow Android and a bad 4G connection.** Every choice that would make it feel more "modern-startup" at the cost of legibility for that person is the wrong choice.

---

## Privacy Constraints — The Design Must Enforce These

These are not just legal requirements — they are community trust requirements:

1. **No reporter contact details publicly visible** unless the reporter explicitly set a "public contact." The CTA is "Report a sighting" — never "Contact the owner directly."
2. **No exact addresses or GPS points** on public case pages or sighting timelines. Zone descriptions only (e.g., "Zona histórica de Faro").
3. **No chip numbers** beyond the last 3 digits, and only in admin views.
4. **No mention of theft/suspicion** anywhere public. If a case has a suspected_theft flag, it shows publicly as a normal perdido case.
5. **Face blur** — photos containing humans have faces blurred before being shown publicly. Design around this: the blur will always be there, so the hero photo might have blurred faces.

---

## Typography & Language Notes

- Platform is trilingual: PT / EN / ES. Strings auto-detect from user browser/bot input.
- Portuguese spelling: European (Portugal), not Brazilian. "Encontrado" not "Achado."
- Tone: warm, direct, plain. "Cão" not "animal de estimação." "Viu o cão?" not "Avistou o animal?"
- Dates: European format (DD/MM/YYYY). Times: 24h.
- Dog breeds: use common names (Labrador, Pastor Alemão, Caniche), not scientific. For mixed breeds: "Cruzado de [breed]" or "Indeterminado."

---

## What Is Out of Scope for This Design Pass

- The Telegram bot interface (Telegram controls the chat UI)
- Email template design (functional HTML emails, not designed)
- Admin panel polish (functional before beautiful)
- The map component (placeholder for v1, real map in v2)
- Social media post templates (auto-generated from case data)
- Payment/ad boost flow (deferred — user pays Meta directly when the time comes)

---

## Deliverables Requested

1. **Case page** — the core public-facing page, desktop + mobile. This is the one that gets shared on Facebook. It must work at both sizes.
2. **Dog card** — for list view and OG share image
3. **Report flow** — 4-step web form, mobile-first (most users will be on mobile)
4. **Landing page** — first impression for someone who just received a link
5. **Sighting report form** — single-page, one purpose
6. **The orchestration panel** — standalone component design

If you do all six, you've covered the full user journey for the two primary flows. Everything else can follow from these foundations.

---

*SalvaCão — Para cães perdidos, encontrados, vistos, possíveis roubos ou situações de bem-estar animal.*

---

## Technical Addendum — For the LLM Implementing This

Read these files before writing any code. They contain everything you need.

### Read first — data shapes

- `packages/types/src/cases.ts` — `CasePublic` is what every public page renders. `CaseAdmin` extends it with private fields you must never use in public components.
- `packages/types/src/sightings.ts` — sighting data shape
- `packages/types/src/index.ts` — `ALGARVE_MUNICIPALITIES`, locale types

### Read second — existing patterns

- `apps/web/src/app/[locale]/caso/[slug]/page.tsx` — the main public case page. Understand its data fetching and component structure before redesigning it.
- `apps/web/src/app/[locale]/page.tsx` — landing page
- `apps/web/src/app/[locale]/layout.tsx` — locale layout wrapper
- `packages/i18n/messages/pt.json` — all existing translation keys. Add new ones here (and in `en.json`, `es.json`) rather than hardcoding strings.

### Read third — styling constraints

- `apps/web/src/app/globals.css` — all CSS custom properties (`--primary`, `--background`, `--foreground`, `--muted`, etc.). Change tokens here, not inline.
- `apps/web/tailwind.config.ts` — Tailwind config

### Component inventory

shadcn/ui components already installed in `apps/web/src/components/ui/`:
`button input textarea select badge card dialog toast skeleton label separator tabs progress`

Use these. Run `npx shadcn@latest add <name>` from `apps/web/` if you need another one.

### Where to write

```
apps/web/src/app/[locale]/
  page.tsx                           # landing — rewrite
  casos/page.tsx                     # case list — rewrite
  caso/[slug]/page.tsx               # case page — rewrite
  caso/[slug]/avistamento/page.tsx   # sighting form — rewrite
  reportar/page.tsx                  # report wizard — rewrite
```

Co-locate page-specific components next to the page file. Shared components go in `apps/web/src/components/`.

### Do not touch

- `apps/web/src/app/api/` — all API routes
- `apps/web/src/lib/` — Supabase clients, email, privacy, poster generation
- `packages/types/src/` — TypeScript types (read, don't edit)
- `packages/db/`, `supabase/migrations/`, `apps/ml/`, `apps/bot/`

### The one privacy constraint

`reporterContactPublic` is the **only** reporter field in `CasePublic`. `reporterName`, `reporterEmail`, `reporterPhone` do not exist in the public type — never add UI elements that imply direct contact with the reporter.
