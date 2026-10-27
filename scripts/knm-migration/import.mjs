/**
 * Zet de lijst van knmoefenen.nl in de e-mailwachtrij van dit platform, als `knm_migration`.
 *
 * Leest de **productie** van knm-website (alleen lezen) en schrijft naar de wachtrij van het
 * doel: standaard de lokale stack, met `--target=production` het gehoste project. Zonder
 * `--write` schrijft het niets en drukt het alleen de telling en het schema af.
 *
 *   node scripts/knm-migration/import.mjs                                  # droog, lokaal doel
 *   node scripts/knm-migration/import.mjs --target=production              # droog, tegen productie
 *   node scripts/knm-migration/import.mjs --target=production --write      # echt
 *   node scripts/knm-migration/import.mjs --test=jij@voorbeeld.nl --segment=paid --write
 *
 * Het tempo zit in `scheduled_for`, niet in de cron: PER_DAY adressen per dag, de actiefste eerst.
 * Het gratis Resend-plan staat 100 mails per dag toe, gedeeld met de transactionele mail — vandaar
 * 80. Wie al een account heeft op dit platform, zich ergens heeft uitgeschreven, of op knmoefenen.nl
 * een mislukte verzending had, valt eruit. Opnieuw draaien is veilig: wie al een `knm_migration`-rij
 * heeft, wordt overgeslagen.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const KNM_ENV = resolve(ROOT, '../knm-website/.env.local');
const PER_DAY = 80;
const SEND_HOUR_UTC = 8; // de cron draait om 09:00 UTC
const UNSUB = 'Uitgeschreven';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const WRITE = args.write === true;
const TARGET = args.target === 'production' ? 'production' : 'local';

function readEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    if (!(m[1] in out)) out[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return out;
}

function client(url, key) {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  return {
    async select(table, cols, filter = '') {
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const res = await fetch(`${url}/rest/v1/${table}?select=${cols}${filter}`, {
          headers: { ...headers, Range: `${from}-${from + 999}` },
        });
        if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
        const page = await res.json();
        rows.push(...page);
        if (page.length < 1000) break;
      }
      return rows;
    },
    async users() {
      const out = [];
      for (let page = 1; ; page++) {
        const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers });
        if (!res.ok) throw new Error(`auth users: ${res.status} ${await res.text()}`);
        const { users = [] } = await res.json();
        out.push(...users);
        if (users.length < 1000) break;
      }
      return out;
    },
    async insert(table, rows) {
      for (let i = 0; i < rows.length; i += 500) {
        const res = await fetch(`${url}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(rows.slice(i, i + 500)),
        });
        if (!res.ok) throw new Error(`insert ${table}: ${res.status} ${await res.text()}`);
      }
    },
  };
}

const norm = e => (e ?? '').toLowerCase().trim();
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const firstNameOf = u => {
  const full = u?.user_metadata?.full_name || u?.user_metadata?.name || '';
  return full.trim().split(/\s+/)[0] || '';
};

const knmEnv = readEnv(KNM_ENV);
if (!knmEnv.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://')) throw new Error('knm-website .env.local heeft geen gehoste URL');
const knm = client(knmEnv.NEXT_PUBLIC_SUPABASE_URL, knmEnv.SUPABASE_SERVICE_KEY);

const targetEnv = readEnv(resolve(ROOT, TARGET === 'production' ? '.env.local' : '.env.development.local'));
const target = client(targetEnv.SUPABASE_URL, targetEnv.SUPABASE_SERVICE_KEY);
console.log(`doel: ${TARGET} (${new URL(targetEnv.SUPABASE_URL).host}) · ${WRITE ? 'SCHRIJFT' : 'droog'}`);

function scheduleFor(index, start) {
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + Math.floor(index / PER_DAY));
  d.setUTCHours(SEND_HOUR_UTC, 0, 0, 0);
  return d.toISOString();
}

if (args.test) {
  const email = norm(args.test);
  const row = {
    email,
    campaign_type: 'knm_migration',
    scheduled_for: new Date().toISOString(),
    payload: { firstName: args.name || '', segment: args.segment === 'paid' ? 'paid' : 'free', locale: args.locale || 'nl', source: 'knm_list' },
  };
  console.log(row);
  if (WRITE) { await target.insert('email_campaign_queue', [row]); console.log('testrij geschreven — de volgende cronrun verstuurt hem'); }
  process.exit(0);
}

const [users, submissions, queue, payments, targetUsers, targetQueue] = await Promise.all([
  knm.users(),
  knm.select('exam_submissions', 'email'),
  knm.select('email_campaign_queue', 'email,status,error_message,payload'),
  knm.select('payments', 'email,status'),
  target.users(),
  target.select('email_campaign_queue', 'email,campaign_type,status,error_message'),
]);

const userByEmail = new Map(users.map(u => [norm(u.email), u]));
const paid = new Set(payments.filter(p => p.status === 'paid').map(p => norm(p.email)));
const localeByEmail = new Map();
for (const r of queue) if (r.payload?.locale) localeByEmail.set(norm(r.email), r.payload.locale);

const excluded = {
  unsubscribed: new Set([
    ...queue.filter(r => (r.error_message ?? '').startsWith(UNSUB)).map(r => norm(r.email)),
    ...targetQueue.filter(r => (r.error_message ?? '').startsWith(UNSUB)).map(r => norm(r.email)),
  ]),
  failedSend: new Set(queue.filter(r => r.status === 'failed' && !(r.error_message ?? '').startsWith(UNSUB)).map(r => norm(r.email))),
  hasAccountHere: new Set(targetUsers.map(u => norm(u.email))),
  alreadyQueued: new Set(targetQueue.filter(r => r.campaign_type === 'knm_migration').map(r => norm(r.email))),
};

const all = new Set([...users.map(u => u.email), ...submissions.map(s => s.email), ...queue.map(r => r.email)].map(norm));
const counts = { bron: all.size, ongeldig: 0, ...Object.fromEntries(Object.keys(excluded).map(k => [k, 0])) };

const contacts = [];
for (const email of all) {
  if (!isEmail(email)) { counts.ongeldig++; continue; }
  const reason = Object.keys(excluded).find(k => excluded[k].has(email));
  if (reason) { counts[reason]++; continue; }
  const u = userByEmail.get(email);
  const locale = ['nl', 'en', 'ar'].includes(localeByEmail.get(email)) ? localeByEmail.get(email) : 'nl';
  contacts.push({
    email,
    firstName: firstNameOf(u),
    segment: paid.has(email) ? 'paid' : 'free',
    locale,
    lastSeen: u?.last_sign_in_at ?? u?.created_at ?? '',
  });
}

// De actiefste eerst: zo bouwt het nieuwe domein reputatie op bij lezers die de mail openen.
contacts.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

const start = args.start ? new Date(`${args.start}T00:00:00Z`) : new Date(Date.now() + 864e5);
const rows = contacts.map((c, i) => ({
  email: c.email,
  campaign_type: 'knm_migration',
  scheduled_for: scheduleFor(i, start),
  payload: { firstName: c.firstName, segment: c.segment, locale: c.locale, source: 'knm_list' },
}));

const bySegment = rows.reduce((m, r) => ({ ...m, [r.payload.segment]: (m[r.payload.segment] ?? 0) + 1 }), {});
const byLocale = rows.reduce((m, r) => ({ ...m, [r.payload.locale]: (m[r.payload.locale] ?? 0) + 1 }), {});
console.log({ ...counts, teVersturen: rows.length, perSegment: bySegment, perTaal: byLocale });
if (rows.length) {
  console.log(`eerste dag: ${rows[0].scheduled_for.slice(0, 10)} · laatste dag: ${rows.at(-1).scheduled_for.slice(0, 10)} · ${Math.ceil(rows.length / PER_DAY)} dagen à ${PER_DAY}`);
}

if (WRITE && rows.length) {
  await target.insert('email_campaign_queue', rows);
  console.log(`${rows.length} rijen geschreven naar ${TARGET}`);
}
