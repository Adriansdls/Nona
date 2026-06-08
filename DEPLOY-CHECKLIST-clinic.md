# SalvaCão — Deploy Checklist (Clinic Integration)
# Generated 2026-06-08

## Step 1: Generate secrets (run once)
```bash
cd /Users/adriandelasierra/Nona
CHIP_KEY=$(openssl rand -base64 32)
INTERNAL_TOKEN=$(openssl rand -hex 32)
echo "CHIP_KEY=$CHIP_KEY"
echo "INTERNAL_TOKEN=$INTERNAL_TOKEN"
```

## Step 2: Push DB migration to production
```bash
# Get your Supabase project ref from dashboard (e.g., abcdefghijklmnop)
SUPABASE_PROJECT_REF=<your-ref>
SUPABASE_DB_PASSWORD=<your-db-password>
SUPABASE_DB_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

supabase db push --db-url "${SUPABASE_DB_URL}"
```

## Step 3: Set production env vars in Vercel
Go to https://vercel.com/dashboard → your project → Settings → Environment Variables

Add these (copy-paste from your existing env, plus the new ones):

| Variable | Value | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Your Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase dashboard → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase dashboard → API |
| `APP_CHIP_ENCRYPTION_KEY` | (from Step 1) | Generated |
| `INTERNAL_API_TOKEN` | (from Step 1) | Generated |
| `ML_SERVICE_URL` | `https://salvacao-ml.fly.dev` | Fly.io app URL |
| `NEXT_PUBLIC_APP_URL` | `https://salvacao.vercel.app` | Your Vercel URL |
| `RESEND_API_KEY` | `re_...` | Resend dashboard |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` | BotFather |
| `ADMIN_EMAIL` | `you@example.com` | Your email |

## Step 4: Set bot secrets (if not already done)
```bash
cd apps/bot
flyctl secrets set \
  INTERNAL_API_TOKEN="${INTERNAL_TOKEN}" \
  WEB_APP_URL="https://salvacao.vercel.app" \
  --app salvacao-bot
```

## Step 5: Trigger Vercel deploy
```bash
# Push to git (which triggers Vercel deploy)
git add .
git commit -m "feat: vet clinic integration (Phase 1)"
git push origin main
```

## Step 6: Create first clinic partner
After deploy:
1. Go to `/admin/clinicas` (login as admin)
2. Add clinic → generates intake link + panel link
3. Share intake link with clinic reception
4. Share panel link with vet via WhatsApp/Signal
5. Vet adds their Telegram ID to `contact_telegram_id`
6. Admin approves the clinic

## Step 7: Test the flow
1. Vet opens `/clinica/[intake_slug]` on mobile
2. Submits photo + chip → should get case link
3. Check `/clinica/painel/[token]` shows full chip + case
4. Check Telegram bot: `/chip 900123456789013` works for registered vet
5. Check TIER 1 alert: create a lost dog case in same municipality → clinic gets email + Telegram PM

## Verify endpoints
```bash
# Test notify-clinic endpoint (dry run)
curl -X POST https://salvacao.vercel.app/api/bot/notify-clinic \
  -H "Content-Type: application/json" \
  -H "x-internal-token: ${INTERNAL_TOKEN}" \
  -d '{"telegramId":YOUR_TELEGRAM_ID,"message":"Test notification 🔬"}'
```

## Files changed in this PR
- `supabase/migrations/0031_clinic_partners.sql` (DB migration)
- `packages/db/src/schema/clinic-partners.ts` (Drizzle schema)
- `packages/db/src/schema/chip-scans.ts` (Drizzle schema)
- `packages/db/src/schema/enums.ts` (SIAC status enum)
- `packages/db/src/schema/index.ts` (exports)
- `apps/web/src/app/api/clinic/intake/route.ts` (clinic intake API)
- `apps/web/src/app/api/clinic/panel/[token]/route.ts` (clinic panel API)
- `apps/web/src/app/api/admin/clinics/route.ts` (admin CRUD + PATCH)
- `apps/web/src/app/api/bot/notify-clinic/route.ts` (Telegram PM endpoint)
- `apps/web/src/app/api/bot/notify-clinic-email/route.ts` (email endpoint)
- `apps/web/src/app/[locale]/clinica/[slug]/page.tsx` + `ClinicaClient.tsx` (intake form)
- `apps/web/src/app/[locale]/clinica/painel/[token]/page.tsx` + `ClinicaPainelClient.tsx` (panel)
- `apps/web/src/app/[locale]/admin/clinicas/page.tsx` + `ClinicasManager.tsx` (admin)
- `apps/web/src/app/[locale]/admin/layout.tsx` (nav link)
- `apps/web/src/lib/notifications/professional-alert.ts` (TIER 1 alerts)
- `apps/bot/channels/telegram.py` (`/chip` command + handlers)

## Post-deploy monitoring
- Check `/admin/clinicas` loads
- Test clinic intake form on mobile
- Verify chip scan appears in panel
- Check Telegram PM delivery to vet
- Monitor `case_notifications` table for clinic alerts
