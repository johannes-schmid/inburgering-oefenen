/**
 * Maakt (of vernieuwt) het ene wachtwoordaccount voor de OpenAI-review van de ChatGPT-app.
 *
 *   node scripts/create-reviewer-account.mjs reviewer@inburgeringoefenen.nl            # lokaal
 *   node scripts/create-reviewer-account.mjs reviewer@inburgeringoefenen.nl --production
 *
 * Leest NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_KEY uit .env.development.local (lokaal) of
 * .env.local (--production). Genereert een willekeurig wachtwoord van 32 tekens en drukt het
 * precies één keer af — het wordt nergens opgeslagen. Het account krijgt `app_metadata.reviewer =
 * true` (de enige sleutel waarop de Auth-hook `hook_reviewer_claims` een wachtwoord-login
 * toelaat), geen admin-rechten en geen modules. Opnieuw draaien zet een nieuw wachtwoord.
 */

import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const args = process.argv.slice(2);
const production = args.includes('--production');
const email = args.find((a) => a.includes('@'));
if (!email) {
  console.error('Gebruik: node scripts/create-reviewer-account.mjs <e-mail> [--production]');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const envFile = resolve(here, production ? '../.env.local' : '../.env.development.local');
for (const line of readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error(`NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_KEY ontbreekt in ${envFile}`);
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
// Rechtstreeks de Auth admin-API: supabase-js trekt realtime-js mee, dat op Node 20 struikelt.
async function authAdmin(path, init = {}) {
  const res = await fetch(`${url}/auth/v1/admin/${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(body)}`);
  return body;
}

const password = randomBytes(24).toString('base64url');
const list = await authAdmin('users?per_page=1000');
const existing = (list.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());

let userId;
if (existing) {
  const data = await authAdmin(`users/${existing.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      password,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, reviewer: true },
    }),
  });
  userId = data.id;
  console.log(`Bestaand account bijgewerkt: ${userId}`);
} else {
  const data = await authAdmin('users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: { reviewer: true },
      user_metadata: { full_name: 'OpenAI Reviewer', plan: 'free' },
    }),
  });
  userId = data.id;
  console.log(`Nieuw account: ${userId}`);
}

console.log(`\nProject:    ${url}`);
console.log(`E-mail:     ${email}`);
console.log(`Wachtwoord: ${password}`);
console.log('\nBewaar het wachtwoord nu; het wordt niet opgeslagen. Opnieuw draaien geeft een nieuw wachtwoord.');
