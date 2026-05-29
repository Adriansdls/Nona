# Launch Audit — every clickable on the web
*Checklist of public surfaces + status. Goal: nothing broken when we launch into FB communities.*

## Public routes
| Route | Status | Notes |
|---|---|---|
| `/[locale]` (home) | ✅ | Hero + intake chat + protocol widget + pillars + reunidos. Voice+image input (this session). |
| `/[locale]/casos` | ⏳ verify live | Public case list. |
| `/[locale]/caso/[slug]` | ✅ | Public case page; now has OG image (WS-B) → rich photo card when shared. |
| `/[locale]/caso/[slug]/poster` | ✅ FIXED | Was 500 (react-pdf v3 + React 19). Upgraded v4 → valid PDF. |
| `/[locale]/caso/[slug]/avistamento` | ✅ | Case-bound sighting form. |
| `/[locale]/caso/[slug]` OG image | ✅ NEW | `opengraph-image.tsx` (next/og) — dog photo + PERDIDO + name. |
| `/[locale]/como-funciona` | ⏳ verify live | Info page. |
| `/[locale]/reportar` | ⏳ verify live | Web form (multipart) → /api/cases. |
| `/[locale]/vi-um-cao` | 🔜 WS-D | NEW finder flow (pin-pam-ya). |
| `/[locale]/meu-caso/[token]` | ✅ | Owner dashboard: triage, guided steps, resolve. + ads card (WS-E), profile connect (WS-F) coming. |
| `/[locale]/parceiro` | 🔜 WS-G | NEW partner panel. |
| `/login` | ✅ | Supabase Auth (admin). |

## Share buttons (CasePageClient)
| Button | Status |
|---|---|
| Facebook / WhatsApp / Telegram | ✅ functional (open share URLs) |
| "Mais" | ⏳ WS-C → wire to navigator.share() |

## Case creation parity (the divergence fix)
| Field | Web form | Chat intake |
|---|---|---|
| reporter_contact_public | ✅ user-settable | ✅ FIXED (agent now asks; was null) |
| behavioral_profile | ❌ null | ✅ populated |
| poster + page + dashboard | ✅ | ✅ |

## Known external-cred gaps (flag, not bugs)
- Meta Page posting needs `FACEBOOK_PAGE_ACCESS_TOKEN`+`FACEBOOK_PAGE_ID` in prod (else auto-post no-ops silently).
- Voice transcription needs `OPENAI_API_KEY` in Vercel (image works without).
- Ads live needs Meta ads creds (WS-E builds with DRY_RUN).

## Post-deploy live checks (do after this batch ships)
- [ ] Each public route returns 200 on prod.
- [ ] OG image PNG 200 + renders dog photo (FB sharing debugger).
- [ ] Poster downloads a valid PDF.
- [ ] Both creation paths → working page + poster + dashboard.
