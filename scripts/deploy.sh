#!/usr/bin/env bash
# SalvaCão — Full production deployment
# Run from repo root after: flyctl auth login
# Usage: ./scripts/deploy.sh
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BOLD}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
die()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ── 0. Preflight ────────────────────────────────────────────────────────────
log "Checking prerequisites..."
command -v flyctl >/dev/null || die "flyctl not found. Install: https://fly.io/docs/hands-on/install-flyctl/"
flyctl auth whoami >/dev/null 2>&1 || die "Not logged in to Fly.io. Run: flyctl auth login"
command -v supabase >/dev/null || die "supabase CLI not found."
ok "Prerequisites OK"

# ── 1. Supabase production credentials ──────────────────────────────────────
log "Supabase production setup"
echo ""
echo "You need a Supabase cloud project. If you haven't created one:"
echo "  1. Go to https://supabase.com/dashboard/new/_ and create a project"
echo "  2. Choose region: eu-west-1 (Ireland) or eu-central-1 (Frankfurt)"
echo "  3. Copy: Project URL, anon key, service role key, database password"
echo ""

read -rp "Supabase project URL (e.g. https://xxxxx.supabase.co): " SUPABASE_URL
read -rp "Supabase anon key: " SUPABASE_ANON_KEY
read -rp "Supabase service role key: " SUPABASE_SERVICE_ROLE_KEY
read -rp "Supabase database password: " SUPABASE_DB_PASSWORD
read -rp "Supabase project ref (the xxxxx part of the URL): " SUPABASE_PROJECT_REF

SUPABASE_DB_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

# ── 2. Push DB migrations ───────────────────────────────────────────────────
log "Pushing database migrations to production..."
supabase db push --db-url "${SUPABASE_DB_URL}"
ok "Migrations applied"

# ── 3. Set chip encryption key in production DB ─────────────────────────────
CHIP_KEY=$(openssl rand -base64 32)
log "Setting chip encryption key in production DB..."
supabase db execute --db-url "${SUPABASE_DB_URL}" \
  --sql "ALTER DATABASE postgres SET \"app.chip_encryption_key\" = '${CHIP_KEY}';"
ok "Chip encryption key set"

# ── 4. Generate internal API token ──────────────────────────────────────────
INTERNAL_TOKEN=$(openssl rand -hex 32)

# ── 5. Deploy ML service to Fly.io ──────────────────────────────────────────
log "Deploying ML service to Fly.io..."
cd apps/ml

# Create app if it doesn't exist
flyctl apps list 2>/dev/null | grep -q "salvacao-ml" || flyctl apps create salvacao-ml --machines

# Create persistent volume for model cache (skip if exists)
flyctl volumes list --app salvacao-ml 2>/dev/null | grep -q "salvacao_ml_cache" \
  || flyctl volumes create salvacao_ml_cache --region mad --size 5 --app salvacao-ml

# Set secrets
flyctl secrets set \
  SUPABASE_URL="${SUPABASE_URL}" \
  SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  --app salvacao-ml

flyctl deploy --app salvacao-ml
ML_URL="https://salvacao-ml.fly.dev"
ok "ML service deployed at ${ML_URL}"
cd ../..

# ── 6. Deploy bot to Fly.io ──────────────────────────────────────────────────
log "Deploying Telegram bot to Fly.io..."

read -rp "Telegram bot token (from BotFather): " TELEGRAM_TOKEN
read -rp "Anthropic API key: " ANTHROPIC_KEY
read -rp "OpenAI API key (for Whisper): " OPENAI_KEY

cd apps/bot
flyctl apps list 2>/dev/null | grep -q "salvacao-bot" || flyctl apps create salvacao-bot --machines

flyctl secrets set \
  TELEGRAM_BOT_TOKEN="${TELEGRAM_TOKEN}" \
  ANTHROPIC_API_KEY="${ANTHROPIC_KEY}" \
  OPENAI_API_KEY="${OPENAI_KEY}" \
  SUPABASE_URL="${SUPABASE_URL}" \
  SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  INTERNAL_API_TOKEN="${INTERNAL_TOKEN}" \
  WEB_APP_URL="https://salvacao.vercel.app" \
  --app salvacao-bot

flyctl deploy --app salvacao-bot
ok "Bot deployed"
cd ../..

# ── 7. Print Vercel env vars ─────────────────────────────────────────────────
log "Vercel environment variables"
echo ""
echo "Go to your Vercel project → Settings → Environment Variables and add:"
echo ""
echo "  NEXT_PUBLIC_SUPABASE_URL          = ${SUPABASE_URL}"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY     = ${SUPABASE_ANON_KEY}"
echo "  SUPABASE_SERVICE_ROLE_KEY         = ${SUPABASE_SERVICE_ROLE_KEY}"
echo "  APP_CHIP_ENCRYPTION_KEY           = ${CHIP_KEY}"
echo "  INTERNAL_API_TOKEN                = ${INTERNAL_TOKEN}"
echo "  ML_SERVICE_URL                    = ${ML_URL}"
echo "  NEXT_PUBLIC_APP_URL               = https://salvacao.vercel.app"
echo "  RESEND_API_KEY                    = <your Resend key>"
echo ""
echo "Then trigger a redeploy."
echo ""

# ── 8. Summary ───────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Deployment complete!${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  ML service:   https://salvacao-ml.fly.dev/health"
echo "  Bot:          running (check: flyctl logs --app salvacao-bot)"
echo "  Web:          set Vercel env vars above and redeploy"
echo ""
echo "  ⚠ Save these secrets somewhere safe:"
echo "  APP_CHIP_ENCRYPTION_KEY = ${CHIP_KEY}"
echo "  INTERNAL_API_TOKEN      = ${INTERNAL_TOKEN}"
