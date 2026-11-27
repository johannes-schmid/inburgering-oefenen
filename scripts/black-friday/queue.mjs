/**
 * Zet de Black Friday-mail in de e-mailwachtrij, als `black_friday`, voor elk account dat nooit
 * betaald heeft. `/api/send-campaign-emails` (dagelijks 17:00 UTC) verstuurt hem; na de actie
 * (maandag 30-11 24:00) stuurt die route hem niet meer.
 *
 * Zonder `--write` schrijft het niets en drukt het alleen de telling af.
 *
 *   node scripts/black-friday/queue.mjs                                # droog, lokale stack
 *   node scripts/black-friday/queue.mjs --target=production            # droog, tegen productie
 *   node scripts/black-friday/queue.mjs --target=production --write    # echt
 *   node scripts/black-friday/queue.mjs --test=jij@voorbeeld.nl --write
 *
 * Valt eruit: wie ooit betaald heeft (een `paid`-betaling, een module of een oud pakket in de
 * metadata), wie zich ooit heeft uitgeschreven, de admins, en wie al een `black_friday`-rij heeft
 * (opnieuw draaien is dus veilig).
 *
 * Tempo: `--per-day` (standaard 80) adressen per cronrun, de laatst actieven eerst. Het gratis
 * Resend-plan staat 100 mails per dag toe, gedeeld met de transactionele mail.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CAMPAIGN = 'black_friday';
const UNSUB = 'Uitgeschreven';
const SALE_END = Date.parse('2026-12-01T00:00:00+01:00');
const CRON_HOUR_UTC = 17;

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const WRITE = args.write === true;
const TARGET = args.target === 'production' ? 'production' : 'local';
const PER_DAY = Number(args['per-day'] ?? 80);

function readEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !(m[1] in out)) out[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return out;
}

function client(url, key) {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  return {
    async select(table, cols, filter = '') {
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const res = await fetch(`${url}/rest/v1/${table}?select=${cols}${filter}`, { headers: { ...headers, Range: `${from}-${from + 999}` } });
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
const firstNameOf = u => (u?.user_metadata?.full_name || u?.user_metadata?.name || '').trim().split(/\s+/)[0] || '';

/** Ooit iets gekocht volgens de metadata: een module (ook verlopen) of een oud pakket. */
function everPaidInMetadata(meta = {}) {
  if (Array.isArray(meta.modules) && meta.modules.length > 0) return true;
  if (typeof meta.plan === 'string' && meta.plan !== 'free') return true;
  if (meta.premium === true || (typeof meta.tier === 'string' && meta.tier !== 'free')) return true;
  return Array.isArray(meta.fulfilled_payments) && meta.fulfilled_payments.length > 0;
}

/** De cronruns die nog vóór het einde van de actie vallen, te beginnen bij de eerstvolgende. */
function cronRuns(now = new Date()) {
  const runs = [];
  const d = new Date(now);
  d.setUTCHours(CRON_HOUR_UTC, 0, 0, 0);
  if (d <= now) d.setUTCDate(d.getUTCDate() + 1);
  while (d.getTime() < SALE_END) { runs.push(new Date(d)); d.setUTCDate(d.getUTCDate() + 1); }
  return runs;
}

const env = readEnv(resolve(ROOT, TARGET === 'production' ? '.env.local' : '.env.development.local'));
const db = client(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
console.log(`doel: ${TARGET} (${new URL(env.SUPABASE_URL).host}) · ${WRITE ? 'SCHRIJFT' : 'droog'}`);

// Vlak vóór de cronrun inplannen, zodat hij vandaag meegaat als dat nog kan.
const dueAt = d => new Date(d.getTime() - 60 * 60 * 1000).toISOString();

if (args.test) {
  const row = {
    email: norm(args.test),
    campaign_type: CAMPAIGN,
    scheduled_for: new Date().toISOString(),
    payload: { firstName: args.name || '', locale: args.locale || 'nl', source: 'black_friday_test' },
  };
  console.log(row);
  if (WRITE) { await db.insert('email_campaign_queue', [row]); console.log('testrij geschreven: de volgende cronrun verstuurt hem'); }
  process.exit(0);
}

const [users, payments, queue, admins] = await Promise.all([
  db.users(),
  db.select('payments', 'email,status'),
  db.select('email_campaign_queue', 'email,campaign_type,status,error_message,payload'),
  db.select('admin_users', 'email').catch(() => []),
]);

const paid = new Set(payments.filter(p => p.status === 'paid').map(p => norm(p.email)));
const unsubscribed = new Set(queue.filter(r => (r.error_message ?? '').startsWith(UNSUB)).map(r => norm(r.email)));
const queued = new Set(queue.filter(r => r.campaign_type === CAMPAIGN).map(r => norm(r.email)));
const adminSet = new Set(admins.map(a => norm(a.email)));
const localeByEmail = new Map();
for (const r of queue) if (['nl', 'en', 'ar'].includes(r.payload?.locale)) localeByEmail.set(norm(r.email), r.payload.locale);

const counts = { accounts: users.length, ongeldig: 0, betaald: 0, uitgeschreven: 0, admin: 0, alInWachtrij: 0 };
const contacts = [];
for (const u of users) {
  const email = norm(u.email);
  if (!isEmail(email)) { counts.ongeldig++; continue; }
  if (paid.has(email) || everPaidInMetadata(u.user_metadata)) { counts.betaald++; continue; }
  if (unsubscribed.has(email)) { counts.uitgeschreven++; continue; }
  if (adminSet.has(email)) { counts.admin++; continue; }
  if (queued.has(email)) { counts.alInWachtrij++; continue; }
  contacts.push({
    email,
    firstName: firstNameOf(u),
    locale: localeByEmail.get(email) ?? 'nl',
    lastSeen: u.last_sign_in_at ?? u.created_at ?? '',
  });
}
contacts.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

const runs = cronRuns();
const capacity = runs.length * PER_DAY;
const rows = contacts.slice(0, capacity).map((c, i) => ({
  email: c.email,
  campaign_type: CAMPAIGN,
  scheduled_for: dueAt(runs[Math.floor(i / PER_DAY)]),
  payload: { firstName: c.firstName, locale: c.locale, source: 'black_friday' },
}));

const byLocale = rows.reduce((m, r) => ({ ...m, [r.payload.locale]: (m[r.payload.locale] ?? 0) + 1 }), {});
console.log({ ...counts, inAanmerking: contacts.length, teVersturen: rows.length, perTaal: byLocale });
console.log(`cronruns vóór het einde: ${runs.map(r => r.toISOString().slice(0, 10)).join(', ')} · ${PER_DAY} per run`);
if (contacts.length > capacity) {
  console.log(`LET OP: ${contacts.length - capacity} adressen passen niet meer vóór het einde (minst recent actief). Verhoog --per-day als het Resend-plan dat toelaat.`);
}

if (WRITE && rows.length) {
  await db.insert('email_campaign_queue', rows);
  console.log(`${rows.length} rijen geschreven naar ${TARGET}`);
}
