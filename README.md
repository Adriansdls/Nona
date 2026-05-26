# SalvaCão (Red Cão Algarve)

Free, open-source platform to help existing dog rescue/lost dog networks in the Algarve, Portugal operate more effectively.

## What it is

A tech layer — not a new social network — that turns each lost, found, or at-risk dog into a structured case with: a poster, shareable post, QR code, public page, sightings log, private map, case dossier, and (in v0.2) AI visual matching.

Goal: amplify what existing human networks already do. Zero monetization.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript strict + Tailwind 4 + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Storage + pgvector) + Drizzle ORM
- **Deploy**: Vercel (web) + Fly.io (ML service, v0.2+)
- **Email**: Resend
- **i18n**: next-intl — PT-PT, EN, ES from day 1
- **Monorepo**: pnpm — `apps/web`, `apps/ml` (v0.2), `packages/db`, `packages/ui`, `packages/i18n`, `packages/types`
- **ML**: FastAPI + Python (v0.2 only)

## Phases

- **Fase 0** (current): Foundation — planning, research, architecture
- **v0.1**: Core flow, no AI — report, poster, public page, sightings, admin review
- **v0.2**: Visual AI matching + map
- **v0.3**: Partner network

## Privacy principles (non-negotiable)

1. Microchip number never fully shown in public pages
2. Reporter PII never in public JSON/HTML
3. Faces + license plates auto-blurred before public storage (v0.2+)
4. Word "robado/ladrão" never in public UI — only "perdido"
5. Visual matches never shown to public without human review
6. Sightings not public until admin approves
7. No automatic notifications to owners without human review

## License

MIT
