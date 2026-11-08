#!/usr/bin/env bash
# Start e2e met Node 24 en de lokale service-key. Alleen tegen de lokale stack.
#   ./e2e/run.sh run tests/sessions.e2e.ts
#   ./e2e/run.sh explore --session switcher '<charter>'
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
E2E_SERVICE_ROLE_JWT="$(supabase status -o env 2>/dev/null | sed -n 's/^SERVICE_ROLE_KEY="\(.*\)"$/\1/p')"
export E2E_SERVICE_ROLE_JWT
[ -n "$E2E_SERVICE_ROLE_JWT" ] || { echo "Lokale Supabase draait niet (supabase start)"; exit 2; }
unset MOLLIE_API_KEY ANTHROPIC_BASE_URL
export E2E_TELEMETRY_DISABLED=1
exec npx e2e "$@"
