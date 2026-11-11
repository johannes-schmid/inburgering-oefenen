#!/bin/bash
# Logt de app in de simulator in als een lokale testgebruiker, zonder door Google te gaan.
#
#   ./mobile/scripts/dev-session.sh menu-partial@local.test
#
# Alleen de LOKALE stack (544xx) en alleen een dev-build: de ingang `dev-session` bestaat in
# een release-build niet (zie App.tsx). De sessie komt van een magic link uit de admin-API,
# dezelfde weg als e2e/tests/helpers/accounts.ts.
set -euo pipefail

EMAIL="${1:-menu-partial@local.test}"
API="http://127.0.0.1:54421"
cd "$(dirname "$0")/../.."

SERVICE_JWT=$(supabase status -o env 2>/dev/null | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')
ANON=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.development.local | cut -d= -f2-)

HASH=$(curl -s -X POST "$API/auth/v1/admin/generate_link" \
  -H "apikey: $SERVICE_JWT" -H "Authorization: Bearer $SERVICE_JWT" -H 'Content-Type: application/json' \
  -d "{\"type\":\"magiclink\",\"email\":\"$EMAIL\"}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["hashed_token"])')

FRAGMENT=$(curl -s -X POST "$API/auth/v1/verify" \
  -H "apikey: $ANON" -H 'Content-Type: application/json' \
  -d "{\"type\":\"magiclink\",\"token_hash\":\"$HASH\"}" \
  | python3 -c 'import json,sys; s=json.load(sys.stdin); print("access_token=%s&refresh_token=%s" % (s["access_token"], s["refresh_token"]))')

xcrun simctl openurl booted "inburgeringoefenen://dev-session#$FRAGMENT"
echo "Sessie voor $EMAIL aangereikt aan de simulator."
