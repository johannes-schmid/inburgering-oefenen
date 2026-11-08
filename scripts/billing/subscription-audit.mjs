/**
 * Welke abonnementen incasseren iets anders dan wat de klant heeft? — alleen lezen.
 *
 * Vóór co-terming (08-11) nam het abonnement het bedrag van de láátste betaling over. Wie een
 * tweede module bijkocht, bleef daardoor €9,95 betalen voor twee modules; wie er twee bijkocht,
 * betaalde voor twee van de drie. Dit script legt per klant naast elkaar:
 *
 *   wat Mollie incasseert  ↔  wat volgens `renewingModules()` + `priceForSelection()` hoort
 *
 * Het verandert niets — geen Mollie-update, geen metadata. Een bedrag op een lopend abonnement
 * corrigeren is een stap naar de klant toe en is aan de eigenaar. De eerstvolgende wijziging via
 * `/api/change-modules` zet het bedrag vanzelf goed.
 *
 *   node --experimental-websocket scripts/billing/subscription-audit.mjs                # lokaal
 *   node --experimental-websocket scripts/billing/subscription-audit.mjs --production   # .env.local
 *
 * (`--experimental-websocket`: supabase-js wil een WebSocket en Node 20 heeft er standaard geen.)
 */
import { createClient } from '@supabase/supabase-js';
import { createMollieClient } from '@mollie/api-client';
import { createJiti } from 'jiti';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envFile = process.argv.includes('--production') ? '.env.local' : '.env.development.local';
for (const file of [envFile]) {
  try {
    for (const line of readFileSync(resolve(root, file), 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {}
}

const jiti = createJiti(import.meta.url, { alias: { '@': root } });
const { renewingModules } = await jiti.import('@/lib/entitlements');
const { monthlyAmountCents } = await jiti.import('@/lib/billing/amount');
const { euro } = await jiti.import('@/lib/pricing');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);
const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
const LIVE = ['active', 'pending', 'suspended'];

console.log(`Bron: ${envFile} → ${process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL}\n`);

const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < 1000) break;
}

const rows = [];
for (const u of users) {
  const meta = u.user_metadata ?? {};
  if (typeof meta.mollie_customer_id !== 'string') continue;
  const subs = (await mollie.customerSubscriptions.page({ customerId: meta.mollie_customer_id, limit: 50 }))
    .filter(s => LIVE.includes(s.status));
  const renewing = renewingModules(meta);
  if (subs.length === 0 && renewing.length === 0) continue;

  const charged = subs.reduce((n, s) => n + Math.round(parseFloat(s.amount.value) * 100), 0);
  const code = subs[0]?.metadata?.discountCode ?? null;
  const expected = monthlyAmountCents(renewing, code);
  if (charged === expected && subs.length <= 1) continue;

  rows.push({
    email: u.email,
    modules: renewing.join(', ') || '—',
    mollie: euro(charged),
    hoort: euro(expected),
    verschil: euro(expected - charged),
    abonnementen: subs.length,
    volgende: subs[0]?.nextPaymentDate ?? '—',
  });
}

if (rows.length === 0) {
  console.log('Geen afwijkingen: elk lopend abonnement incasseert wat de klant heeft.');
} else {
  console.table(rows);
  console.log(`${rows.length} klant(en) met een afwijkend bedrag of meer dan één abonnement.`);
}
