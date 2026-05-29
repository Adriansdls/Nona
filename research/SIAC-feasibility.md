# SIAC Microchip Registry Integration — Feasibility Assessment
**Platform:** Nona (Red Cão Algarve) | **Date:** 2026-05-29 | **Status:** Decision-ready

---

## Verdict

**A direct owner-lookup API from SIAC is not feasible for Nona as a private platform.** No public API exists. The public chip-verification endpoint returns only registration status (yes/no) — owner name, phone, and address are explicitly withheld. Access to owner contact data is restricted by law (DL 82/2019) to credentialed veterinarians, official animal shelters, and law-enforcement bodies. A formal DGAV protocol for third-party access is theoretically possible but has no documented precedent for private apps and would be a multi-year government-relations effort.

---

## What SIAC Is

SIAC (Sistema de Informação de Animais de Companhia, operated at siac.pt / siac.vet) is Portugal's mandatory national registry for dogs, cats, and ferrets, created by Decreto-Lei n.º 82/2019 (27 June 2019). It consolidated four predecessor systems: SICAFE, SIRA, SIRAM, and RACES. The DGAV (Direção-Geral de Alimentação e Veterinária) is the responsible authority; day-to-day management is delegated to SNMV (the national veterinarians' union) under a DGAV protocol.

Every dog in Portugal with a microchip has a SIAC record containing: 15-digit transponder number, species/breed/DOB/sex/color, owner full name, NIF (tax ID), address, phone, and email, plus the veterinarian who performed registration.

---

## What the Public Can Actually Do on siac.pt

| Action | Login required | What is returned |
|---|---|---|
| Chip registration check (siac.vet/verificar-registo) | No | **Yes/No only** — no owner data |
| Report a lost animal | No (or light account) | Creates a public "lost" listing |
| Report a found animal | No | Creates a public "found" listing with finder's contact |
| Validate a DIAC document | No | Document authenticity only |
| Browse lost-animals board | No | Animal description + finder contact (no owner data) |

The FAQ is explicit: "esta verificação, por pesquisa do número do microchip/transponder, indica apenas a existência ou não existência do animal na base de dados, sem a libertação de qualquer tipo de informação reservada."

---

## Who Can Legally Access Owner Contact Data

Under DL 82/2019 and the SIAC Procedures Manual, full owner-contact access is granted only to:

1. **Registered veterinarians** — have SIAC profiles; purchase registration credits from SNMV. They can read a chip and look up the owner in SIAC.
2. **Municipal veterinarians (câmaras municipais)** — request access via SIAC's dedicated form (geral@siac.vet).
3. **Public security forces** — PSP, GNR, Municipal Police, Maritime Police. Request access by email to geral@siac.vet.
4. **Official animal collection centres (CROAs / canis municipais)** — access as part of their public-service mandate.

**Private platforms are not in this list.** DL 82/2019, Art. 8 designates SIAC as a restricted system requiring Citizen Card or Mobile Key authentication. Data transmission to third parties flows only through the Public Administration Interoperability Platform (iAP) under government-defined conditions. No provision creates a commercial or private-sector data-sharing channel.

**RGPD layer:** Owner contact data (name, phone, address, NIF) is personal data under RGPD/GDPR. Exposing it to an unauthenticated or commercially operated third party without explicit owner consent or a statutory legal basis would violate Art. 6 RGPD. SIAC's design (no API, restricted profiles) is a deliberate RGPD control, not a technical oversight.

---

## Alternative and Legacy Registries

| Registry | Status | Lookup feasibility |
|---|---|---|
| **SICAFE** | Merged into SIAC (2019) | Dead — data migrated |
| **SIRA** | Merged into SIAC (2019) | Dead — data migrated |
| **Europetnet** | Active — aggregates 26 EU national registries incl. SIAC | No public API with owner data. Lookups go via member-database operators (i.e., vets). VeriPet project is a seller-verification tool for classified ads, not a lost-dog lookup API. |
| **EU Pet Passport** | Paper document held by owner | Not queryable — no digital registry |
| **GNR animal database** | Internal enforcement use | Not publicly accessible |

Bottom line: no alternative route bypasses the SIAC restriction on owner-contact data.

---

## Realistic Paths for Nona — Ranked by Effort / Value

### 1. Guide-the-finder flow (effort: low — value: high — **recommended**)

The finder does not need an API. The current legal path is:

> Finder finds dog → takes dog to nearest vet clinic or câmara municipal → vet scans chip → vet looks up SIAC → vet or finder calls owner.

Nona can own the connective tissue around this:
- In-app "I found a dog" flow that prompts: "Take the dog to any vet or GNR post — it's free and takes 5 minutes. Here are the 3 closest to you."
- Nona posts the found-dog report to SIAC's public found-animals board (via siac.pt/pt/anunciar-animal-encontrado — no API needed, can be a guided deep-link or a form integration).
- Nona's existing lost-dog alert system means the *owner* has already been notified that Nona has a found report — closing the loop without Nona ever touching private data.

This path is **legal, deployable immediately, and surprisingly effective**: the vet-scan step is the single largest friction point, and Nona can reduce it with geolocation.

### 2. Vet-partner network (effort: medium — value: high)

Partner with 5–10 vet clinics across the Algarve who are already SIAC credentialed. When a found dog comes through Nona, a one-tap "Send to nearest partner vet" creates a warm referral. The vet does the scan+lookup and calls the owner; Nona gets a closed-case signal. This is a relationship play, not a technical one — start with Faro and Loulé clinics.

### 3. GNR / PSP referral integration (effort: low — value: medium)

GNR and PSP already have chip readers and SIAC access. Nona's "found dog" card can display the nearest GNR post with directions and a pre-filled WhatsApp message template. Zero legal complexity.

### 4. DGAV protocol / convénio (effort: very high — value: high if granted)

DL 82/2019 Art. 8 allows DGAV to delegate access to third parties via protocol. In theory, Nona could apply for a formal convénio that would allow authenticated lookup of owner contact data for a verified "found dog" case. In practice:
- No documented case of a private platform receiving this access.
- Would require legal personhood in Portugal, data processing agreement with DGAV, RGPD impact assessment, and likely Ministerio da Agricultura approval.
- Realistic timeline: 2–3 years minimum, uncertain outcome.
- **Not worth pursuing in the current phase.** Revisit if Nona reaches institutional scale (e.g., formal Câmara partnerships across Algarve).

### 5. SIAC "found animal" board polling (effort: medium — value: low)

SIAC's public lost/found board has no RSS or API. Web-scraping it is technically possible but legally grey (terms of service unclear, rate-limiting likely) and the data quality is low (owners do not consistently register losses there). Not worth the fragility.

---

## Recommended Path for Nona

**Short-term (do now):** Build the guided finder flow. When a user reports a found dog in Nona:
1. Show a "Has microchip?" prompt.
2. If yes: display the 3 nearest vet clinics and GNR posts with directions. Add a one-tap option to create a public found-animal listing on SIAC (deep-link to siac.pt/pt/anunciar-animal-encontrado pre-filled with what Nona already knows).
3. If no chip or chip lookup inconclusive: escalate to Nona's standard found-dog alert workflow.

**Medium-term (next 2–3 months):** Sign informal referral agreements with 5 Algarve vet clinics. Frame it as: "We send you found-dog cases; you do the SIAC lookup and close the case; we credit you in the app." No data-sharing contract needed — you're just generating foot traffic for them.

**Do not pursue:** Direct SIAC API access, Europetnet API, or scraping. The legal wall is real and the workarounds are reliable.

---

## Sources

- [SIAC — Sistema de Informação de Animais de Companhia (official site)](https://www.siac.pt/pt)
- [SIAC FAQ (siac.pt)](https://siac.pt/pt/faq)
- [DGAV — Registo no SIAC (official guidance)](https://www.dgav.pt/animais/conteudo/animais-de-companhia/identificacao-registo-e-movimentacao-animal/caes-e-gatos/1-registo-no-sistema-de-informacao-de-animais-de-companhia-siac/)
- [DGAV — Entidades Fiscalizadoras (access by enforcement bodies)](https://www.dgav.pt/animais/conteudo/animais-de-companhia/identificacao-registo-e-movimentacao-animal/caes-e-gatos/4-entidades-fiscalizadoras/)
- [Decreto-Lei n.º 82/2019 full text — pgdlisboa.pt](https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=3093&tabela=leis)
- [ICNF — FAQ sobre o SIAC](https://www.icnf.pt/apoios/caodeprotecaodegado/faqsobreosiac)
- [SIAC — Anunciar animal encontrado](https://www.siac.pt/pt/anunciar-animal-encontrado)
- [Sobre o SIAC — origens da base de dados](https://siac.pt/pt/sobre-o-siac)
- [Veterinária Atual — DGAV e OMV respondem a dúvidas sobre o SIAC](https://www.veterinaria-atual.pt/na-clinica/32602/)
- [Europetnet — Europe's Pet Portal](https://europetnet.org/)
- [dogs-ptmagazine — Como verificar se o cão está no SIAC](https://dogs-ptmagazine.com/2019/10/28/como-posso-verificar-se-o-meu-cao-gato-ja-esta-no-siac/)
- [Animalife — Novas regras de identificação eletrónica](https://animalife.pt/pt/noticia/679/novas-regras-de-identificacao-eletronica-de-animais-de-companhia)
- [PAN — O que muda com o Decreto-Lei de identificação de animais](https://www.pan.com.pt/regras-de-identificacao-dos-animais-de-companhia-o-que-muda-com-este-decreto-lei/)
