/**
 * Testaccounts op de LOKALE Supabase-stack.
 *
 * Nieuwe accounts kunnen niet: de signup-hook laat alleen Google toe. Daarom gebruiken de personas
 * bestaande lokale testgebruikers en zet `resetAccount()` hun abonnementsvelden terug. Inloggen gaat
 * via een magic link van de admin-API (geen wachtwoord: de auth-hook weigert wachtwoordlogins) en
 * de sessie wordt als cookie in de browser gezet, zoals `@supabase/ssr` hem leest.
 *
 * Vereist `E2E_SERVICE_ROLE_JWT` (de JWT-service-key uit `supabase status -o env`, niet de
 * `sb_secret_`-sleutel: de admin-API wil een Bearer-JWT). `run.sh` zet hem.
 */
import { readFileSync } from 'node:fs';

const API = 'http://127.0.0.1:54421';

export const PERSONAS = {
  switcher: 'pw-pakketten@example.com',
  state: 'route-check@example.test',
  firstbuy: 'wd-embed-local@example.test',
  edge: 'glas-player-test@example.com',
  bundle: 'knm-korting-test@example.com',
} as const;
export type Persona = keyof typeof PERSONAS;

function anonKey(): string {
  const file = readFileSync(new URL('../../../.env.development.local', import.meta.url), 'utf8');
  const line = file.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='));
  return line!.slice('NEXT_PUBLIC_SUPABASE_ANON_KEY='.length).trim();
}

function admin(): Record<string, string> {
  const jwt = process.env.E2E_SERVICE_ROLE_JWT;
  if (!jwt) throw new Error('E2E_SERVICE_ROLE_JWT ontbreekt — start via e2e/run.sh');
  return { apikey: jwt, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
}

async function findUser(email: string): Promise<{ id: string; user_metadata: Record<string, unknown> }> {
  for (let page = 1; page < 50; page++) {
    const res = await fetch(`${API}/auth/v1/admin/users?per_page=200&page=${page}`, { headers: admin() });
    const { users = [] } = (await res.json()) as { users?: { id: string; email: string; user_metadata: Record<string, unknown> }[] };
    const hit = users.find(u => u.email === email);
    if (hit) return hit;
    if (users.length < 200) break;
  }
  throw new Error(`lokale testgebruiker ${email} bestaat niet`);
}

/** Zet de persona terug op "geen abonnement". GoTrue merget metadata, dus elk veld expliciet. */
export async function resetAccount(persona: Persona): Promise<string> {
  const user = await findUser(PERSONAS[persona]);
  await fetch(`${API}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: admin(),
    body: JSON.stringify({
      user_metadata: {
        full_name: `E2E ${persona}`,
        modules: [],
        module_until: null,
        modules_until: null,
        subscription_canceled_at: null,
        mollie_customer_id: null,
        fulfilled_payments: null,
        plan: null,
        tier: null,
        premium: null,
      },
    }),
  });
  return user.id;
}

export async function accountMeta(persona: Persona): Promise<Record<string, unknown>> {
  return (await findUser(PERSONAS[persona])).user_metadata;
}

/** De sessie als cookie(s), in stukken van 3180 tekens zoals `@supabase/ssr` ze schrijft. */
export async function sessionCookies(persona: Persona, baseUrl: string) {
  const email = PERSONAS[persona];
  const link = (await (await fetch(`${API}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: admin(),
    body: JSON.stringify({ type: 'magiclink', email }),
  })).json()) as { hashed_token?: string; properties?: { hashed_token?: string } };
  const session = await (await fetch(`${API}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: anonKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash: link.hashed_token ?? link.properties?.hashed_token }),
  })).json();
  if (!(session as { access_token?: string }).access_token) throw new Error(`geen sessie voor ${email}`);

  const value = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;
  const name = 'sb-127-auth-token';
  const CHUNK = 3180;
  const parts = value.length <= CHUNK
    ? [{ name, value }]
    : Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) => ({
        name: `${name}.${i}`,
        value: value.slice(i * CHUNK, (i + 1) * CHUNK),
      }));
  return parts.map(p => ({ ...p, url: baseUrl }));
}
