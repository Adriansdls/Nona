# Pilot Playbook — first real contacts + first 10 cases
*Task A. The audit's #1 leverage: the value prop is undeliverable until real canil/vet emails exist, and the engine is unvalidated until real cases run. This is non-coding, highest-leverage pre-release work.*

Pilot municipalities (4, not 16 — keep it tight): **Faro · Loulé · Lagos · Albufeira.**

---

## Part 1 — Fill the contact emails (makes WP18 alert TRUE)

1. Open `apps/bot/data/pilot_contacts.csv`. Rows are pre-filled with the real canil/vet names + phones for the 4 pilot municipalities. Only the `email` column is blank.
2. For each org, find the public contact email (câmara municipal site for canils — usually `geral@cm-<municipio>.pt` or a dedicated `ambiente@`/`veterinario@`; the clinic's own site/Google profile for vets). Paste into `email`.
3. Preview: `cd apps/bot && uv run python scripts/load_contacts.py --dry-run`
4. Apply: `uv run python scripts/load_contacts.py`
   - Idempotent, upserts by (name, municipality), only touches rows with an email, sets `last_verified_at`.
5. After loading, the WP18 Tier-1 alert reaches these orgs and the dashboard honest-status can show real "✓ confirmado" instead of "a montar a rede".

**Tip:** calling first ("Olá, somos a Nona, uma ferramenta gratuita para cães perdidos no Algarve — qual é o melhor email para vos avisarmos quando aparecer um cão perdido na vossa zona?") both gets the email AND warms the relationship for when a real case lands. The phone is already in the CSV.

---

## Part 2 — Recruit the first 10 real cases (validates the engine)

The engine (phase, action_gate, guided steps, triage, ML) has **never run on a real case** (prod: 13 cases all test, 0 sightings ever). Ten real cases is the unit that turns hypotheses into evidence.

**Where to find them (don't wait for organic):**
- One partner Facebook group (the most active Algarve lost-dog group) — ask the admin to let you help on live cases.
- CROAF / local rescue contacts.
- The pilot canils/vets you just emailed — they hear about lost dogs first.

**The offer (warm, complement-not-replace):**
> "Sou da Nona — uma ferramenta gratuita, feita por amantes de cães, que dá ao dono o protocolo certo das primeiras horas (baseado em ciência) e avisa canis/veterinários/grupos por ele. Não substitui o vosso grupo — multiplica o que já fazem. Posso ajudar com este caso, sem custo?"

**Per case, capture (this is the validation data):**
- Did the guided one-step flow land? Did they follow it?
- Which step did they skip / not understand? (cognitive load check)
- Did the Telegram handoff work, or did they stay on web?
- Did the honest automated-track status build or break trust?
- Outcome + time-to-recovery + did a sighting/triage ever fire?

**Success = learning, not 10 reunions.** Even 2-3 cases expose whether one-action-at-a-time actually helps a panicked human — the core unfalsifiable hypothesis from `ACUTE-FLOW-PLAN`.

---

## Why this is the priority (from STRATEGY-AUDIT)
- Value prop "rede avisada" = vapor until Part 1 (0 emails in prod).
- Behavioral engine = unvalidated until Part 2 (0 real cases/sightings ever).
- The acute guided flow + Telegram handoff (the cloud plan being refined) is built **to be validated by these cases** — not in competition with them.
