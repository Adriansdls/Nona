# SalvaCão — MVP Vision
*Captured 2026-05-26. Living document — update as decisions are made.*

---

## The One Sentence

> "Para perros perdidos, encontrados, vistos, posibles robos o situaciones de bienestar animal."

---

## What This Is (And Isn't)

**Is:** A community tool that turns every dog case into a structured, live, shareable moment — and does all the work a human would have to do manually: generate the poster, post to social networks, alert nearby volunteers, run the visual match search, send the updates. It feels like having a tireless, empathetic community member on call 24h.

**Is not:** A new social network. Not competing with Facebook groups. Not monetised. Not a rescue organisation. A tool *for* the networks that already exist.

---

## The Two Primary Flows (Equal Weight)

The current codebase treats "perdido" as dominant. **Both must be equal:**

| Flow | Trigger | Goal |
|---|---|---|
| **Cão Perdido** | Owner or witness reports a missing dog | Build case, amplify, match with found dogs |
| **Cão Encontrado** | Person found a stray | Build case, amplify, match with missing dogs |
| **Avistamento** | Witness sees a dog from an existing case | Add sighting to existing case |
| **Bem-estar** | Dog seen in distress (not missing/found) | Alert local rescuers |
| **Possível furto** | Owner suspects theft | Private flag on a "perdido" case — never public accusation |

---

## The Intake Experience: Agentic, Not Forms

**Core vision:** the primary intake channel is a conversation, not a form. The experience must feel like talking to a caring community coordinator who happens to be available at 3am, speaks your language, and does everything for you.

### Channel Strategy

**Telegram bot (recommended, start here)**
- Lower barrier to entry than WhatsApp Business API
- WhatsApp requires Meta Business verification (weeks + compliance burden in PT)
- Telegram: `BotFather` → working bot in hours
- Telegram supports: text, voice messages, photos, location sharing, inline keyboards
- The same bot logic can be ported to WhatsApp later once we're live

**Fallback channels (keep all of them)**
- Web form at `/reportar` — stays as is, for users who prefer it or are on desktop
- Future: WhatsApp Business API (v1.x once telegram is proven)
- Future: email intake (send photos + description to a dedicated address)

### The Agent Conversation Flow

```
User: "O meu cão perdeu-se esta tarde em Faro"
Bot:  "Que pena 💙 Vou ajudá-lo agora. Tem alguma foto do Rex?"
User: [sends photo]
Bot:  "Obrigado. Parece um Labrador castanho. Está correto?"
User: "Sim, chama-se Rex"
Bot:  "Rex 🐾 Quando e onde o viu pela última vez exatamente?"
User: [voice message: "foi hoje à tarde perto do Lidl de Faro, talvez umas 17h"]
Bot:  [transcribes + extracts] "Percebido — Lidl Faro, hoje ~17h. 
       Tem microchip? Se sim, sabe os últimos 3 dígitos?"
...
Bot:  "Pronto! A página do Rex está criada ❤️
       🔗 salvacao.pt/caso/rex-labrador-faro-26mai
       📄 Poster para imprimir → [PDF]
       📢 Publicado em 3 grupos do Facebook do Algarve
       🔍 Verificámos a base de dados — nenhum cão similar encontrado ainda
       
       Irá receber atualizações aqui assim que houver novidades."
```

**What the agent does for the user:**
- Transcribes audio (Whisper API or Claude claude-opus-4-7 audio)
- Extracts structured data from natural language
- Identifies breed, color, size from photos
- Only asks follow-up questions for things it couldn't infer
- Creates the case, generates the poster, fires social posting
- Sends confirmation with all links

**Languages:** detects automatically (PT default, switches to EN or ES if user writes in those)

---

## The Case Page

Every case gets a permanent URL: `salvacao.pt/caso/[slug]`

The page must convey **urgency + community action + hope**. Key elements:

- Hero photo (large, high quality — we process and enhance)
- Status indicator: ATIVO / RESOLVIDO (big, clear, colour-coded)
- **Real-time orchestration status panel** — this is critical for the "we are doing everything" feeling:
  ```
  ✓ Caso criado
  ✓ Poster gerado (PDF disponível)
  ✓ Publicado em 4 grupos Facebook do Algarve
  ✓ Verificação visual: 0 coincidências até agora
  ✓ 3 voluntários nas proximidades notificados
  ⏳ Aguardar avistamentos...
  ```
- Dog details (breed, color, distinctive marks)
- Last seen location + map pin
- Sightings timeline (public, approved ones only)
- QR code (for printing / sharing)
- CTA: "Vi este cão" (sighting form, single tap)
- CTA: "Partilhar" (native share + social links)
- Download poster button
- NEVER: reporter full name, email, phone, precise coordinates, chip number

---

## Social Amplification

**Automatic on case creation:**
- Post to linked Facebook pages (partner groups in the Algarve)
- Post to Instagram (via Facebook Graph API)
- Generated content: photo + case details + case URL
- Language matches the page's language setting

**Transparent ad spend — open question ⚠️**

The user wants users to optionally boost posts with paid Facebook ads, with 100% transparency that money goes to Meta.

Options and trade-offs:
1. **We don't handle money at all (recommended for v1)**
   - When user wants to boost: we generate the ad creative + targeting parameters
   - We give them a one-click "Set up this ad on Facebook" link (Facebook Ads Manager deep link)
   - They pay Meta directly — we never touch the money
   - Zero legal/compliance risk for us
   - Slight more friction for user but fully transparent

2. **We handle payment as passthrough**
   - We collect from user, spend on Meta API
   - Requires: PSP/payment processor, financial compliance in PT, complex Meta Business API setup
   - Not for v1 — regulatory complexity too high

**Recommendation:** Option 1 for v1. We generate the perfect ad creative, they boost it directly. We can show impact stats ("posts boosted by this community have generated X leads on average").

---

## ML Recognition — Honest Roadmap

The user wants "the absolute best in the world." Honest answer:

**There is no single "best" solution — it's a ladder we climb:**

| Step | What | Why |
|---|---|---|
| **Now (v0.2)** | DINOv2-large embeddings + pgvector cosine search | Good baseline, already coded, runs on MPS |
| **v0.3** | + SAM2 segmentation before embedding | Better crop = better embedding quality |
| **v0.3** | + Claude claude-opus-4-7 Vision for description matching | LLM can match "white spot on left ear" across cases |
| **v0.4** | + MegaDescriptor-L (Voxel51 wildlife re-ID) | SOTA for individual animal re-identification |
| **v0.4** | + fine-tune on Portuguese dog dataset | Domain adaptation = real accuracy gain |
| **Future** | Ensemble: geometric features + texture + LLM description | Best possible |

**Practical gap right now:** we have no labeled dataset of Algarve dog cases. Without ground truth, we can't measure accuracy or fine-tune. **The best ML in the world is useless without real cases feeding it.**

Recommendation: Ship DINOv2 now (it's already good), collect real data, then upgrade when we have 500+ real cases to evaluate against.

---

## The Map

More than navigation. Possible uses:
- **Heat map** of sightings in the last 7/30 days
- **Last known location** pin with search radius circle
- **Cluster view:** nearby missing + found — are any of these the same dog?
- **Volunteer proximity:** "You are 1.2km from where Rex was last seen"
- **Route visualization:** if multiple sightings, show where the dog has been moving

For v1: last known location + sightings pins. No real-time.
For v2: heatmap, clustering, volunteer proximity.

---

## User Identity — Open Question ⚠️

*The user explicitly asked: "I am not sure if the person reporting should have a profile... or if everything can be open and transparent. Let's think about this."*

**The tension:** 
- More friction = fewer reports (bad)
- No account = no way to notify owner of updates (very bad)
- Fake reports = real harm (someone claims a found dog is theirs)

**Recommendation — magic link, no password:**

1. Reporter enters email (or phone for Telegram users — we already have it)
2. We create a silent account and send a magic link
3. They access "my cases" via that link — no password ever
4. For Telegram bot users: their Telegram ID *is* their identity — no extra step
5. Public can report sightings totally anonymously (no account needed)
6. Claiming a found dog requires verified contact (magic link + callback)

This is the lowest friction path that still allows meaningful notifications.

---

## Things the User Didn't Mention — Adding Them

### SIAC Chip Registry Lookup
Portugal has the SIAC national chip registry. When a found dog has a chip, **a lookup can instantly identify the owner**. This is the highest-value feature for found dog cases. Needs investigation: is SIAC API available publicly? If not, can partner vets do the lookup and report back?

### Vet/Clinic Integration
Vets scan chips daily. A simple "submit a chip scan result" API that clinics can call (or a simple WhatsApp/Telegram command) could generate found-dog cases automatically. This turns every chip scan into a potential reunion.

### Anti-Abuse
Agentic bot = trivial to flood with fake cases. We need:
- Rate limiting per Telegram ID / IP
- Phone number verification for new cases (Telegram gives us the user's Telegram ID, but not verified phone)
- Human review queue for first-time reporters
- Simple spam detection in LLM prompt

### Reunion Confirmation
How does a case actually close? Proposed flow:
1. Reporter marks case resolved (via bot command or web)
2. Optional: photo proof uploaded
3. System publishes happy ending (with permission)
4. Stats updated: resolved_cases counter goes up

### The "We're Doing Everything" Panel (UX)
The user said: *"I want people to feel that everything we can do, we are doing."*
This is a specific designable feature: a real-time orchestration status on the case page showing every action taken. The designer needs to know this exists.

### Volunteer Network Alerts
When a case is created in municipality X, volunteers in X get a push notification (Telegram) with photo + location. This doesn't require a separate app — just the bot in reverse.

---

## What "Agentic" Means Here (For the Designer)

Not a chatbot. Not a form. Something new:
- The system proactively acts (posts, notifies, matches) without being asked
- It explains what it's doing in plain language
- It asks follow-ups only when it needs to
- It surfaces its work: "here's what I've done, here's what's happening"
- Every interaction feels like the platform is *on your side*

The interaction should feel less like "using software" and more like "telling a helpful person what happened."

---

## Open Questions (Need Decisions)

| # | Question | Recommendation | Status |
|---|---|---|---|
| 1 | Telegram or WhatsApp as primary bot channel? | Telegram first (lower barrier), WhatsApp later | **Decide** |
| 2 | User profiles or fully anonymous? | Magic link / email — no password | **Decide** |
| 3 | Facebook ad spend: we handle payment or user pays Meta directly? | User pays Meta directly — we generate creative | **Decide** |
| 4 | SIAC chip registry: can we integrate? | Needs research — potentially transformative | **Research** |
| 5 | Launch strategy: invite-only pilot with 2-3 Algarve groups first? | Yes — better to control quality | **Decide** |

---

## What's Already Built

- ✅ Full database schema (6 migrations applied, running locally)
- ✅ All API routes (cases CRUD, sightings, admin, posters, visual matches)
- ✅ Web forms (reportar, avistamento) — stays as fallback
- ✅ Case public page with sightings timeline
- ✅ Admin panel (review queue, case management, user management)
- ✅ PDF poster generation
- ✅ Email notifications (Mailpit locally, Resend for prod)
- ✅ ML pipeline (YOLO + DINOv2, Apple Silicon MPS)
- ✅ Privacy architecture (RLS + field stripping)
- ✅ PT/EN/ES i18n

## What's Missing for True MVP

- ❌ Telegram bot (the primary intake)
- ❌ Claude agent (the conversational brain)
- ❌ Audio transcription (Whisper/Claude)
- ❌ Social media posting (Facebook Graph API)
- ❌ Orchestration status panel on case page
- ❌ Volunteer notification system (outbound bot messages)
- ❌ Map (last seen + sightings)
- ❌ Mobile-optimized design (current is functional, not delightful)
- ❌ SIAC chip lookup (needs research)
- ❌ Deploy to production (Vercel + Fly.io)

---

## Lived-Search Insights (2026-05-28)

The founder spent 2026-05-28 physically searching for a neighbour's lost dog *while* building the app — dogfooding the real problem. The search validated the entire research-driven behavioral track (WP8→WP13) and exposed six concrete gaps. These drive the WP15→WP21 build.

**Product thesis (root onboarding message):** *"maximizar la probabilidad de encontrarle, no encontrarle."* The app promises the best science-based **process**, not an outcome. Emotional honesty over false hope.

### The six gaps

1. **Non-blocking, guidance-first intake (WP15).** A person in panic needs *"tell me how to search NOW"* before they can describe the full case. The action plan must be deliverable before a case record exists. Two entry doors: "tell me the case" and "tell me what to do now."

2. **Timestamp integrity (WP16).** Founder was misled by a Facebook post showing "2h ago" when the real observation was ~10h earlier. The whole behavioral engine runs on *hours since last seen* — a wrong time poisons phase → action_gate → radius → ad placement in a chain. Capture **real observation time**, not post time; surface uncertainty honestly; never show a false relative time.

3. **Closed-loop sighting triage (WP17).** A monitored feed surfaces a 65%-match photo → owner gets three buttons **clearly yes / clearly no / don't know** → Bayesian update → recompute search radius AND ad targeting. The pieces exist (ML, λ weights) but the closed owner-facing loop and posterior recompute are dead placeholders.

4. **Instant minute-0 network alert (WP18).** *"Don't worry about comms — everyone is already alerted before you finish talking."* Split into two tiers: **silent professional network** (canis, vets, shelters, coordinators) fires always at minute-0; **public/crowd broadcast** stays gated by action_gate (a fear-reactive dog must not be mass-broadcast — the exact error WP9 prevents).

5. **Geolocated specific guidance (WP19).** "Geolocate → look around → patterns of *this* spot," not "galgos do X." Pull WP13 GIS out of deferred: real water-point coordinates + terrain corridors, surfaced as "300m NE there's a creek where it would shelter." Camera + food passive-search recommendation (WP12) surfaced as an explicit action item, possibly with a purchase link.

6. **FB group registry + monitoring (WP20) and real Meta Ads (WP21).** Curate Algarve FB groups (incremental + auto-enroll); monitor feeds for immediate sighting detection (capturing the *real* post time — closes gap #2 at source). Real Meta Ads Manager integration with geo-fence driven by the posterior search radius.

### Meta-insight

Living the search while building is the highest-value product input the project has had. Founder is an experienced PM but reports this is *categorically different* — the intuitive mistakes (drive around shouting) vs. the science-based behavior (passive walking, think like the dog, find water) only become obvious when you live it.
