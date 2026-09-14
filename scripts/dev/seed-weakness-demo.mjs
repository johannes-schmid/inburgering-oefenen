/**
 * Een getagde demoset voor "Je vaardigheden" — alleen op de lokale stack.
 *
 *   node scripts/dev/seed-weakness-demo.mjs johannes@settly.nl
 *   node scripts/dev/seed-weakness-demo.mjs johannes@settly.nl --clean
 *
 * ── WAAROM DIT BESTAAT ───────────────────────────────────────────────────────
 * De kaart leest `user_question_results` × `question_concepts`, en die tweede tabel is overal
 * leeg: de tagger (`scripts/lesson-content/tag-questions.mjs`) is nog nooit gedraaid. Lokaal
 * staan bovendien geen examenitems — de 1.700 echte items staan in productie. Zonder deze seed
 * is de kaart dus niet te zien, ook niet als hij perfect werkt.
 *
 * Het maakt drie dingen aan, allemaal herkenbaar aan de stimulus-titel `ZWAKTEKAART-DEMO`:
 * 36 vragen in a2:lezen 1–3, een koppeling per vraag aan een concept, en een antwoordlog voor
 * de opgegeven gebruiker met een expres ongelijke verdeling — zodat de balken uiteenlopen en
 * niet alles op 100 staat.
 *
 * `--clean` haalt alles weer weg, inclusief de `published`-vlaggen die het zette.
 *
 * **De examens 2 en 3 moeten gepubliceerd zijn, anders is er niets te zien.** RLS verbergt de
 * vragen van een ongepubliceerd examen, en dan komen de antwoorden er wel in maar niet uit — de
 * kaart blijft leeg zonder dat er iets logt. Dat kostte de eerste ronde een half uur.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const email = process.argv[2];
const clean = process.argv.includes('--clean');

if (!email) {
  console.error('Gebruik: node scripts/dev/seed-weakness-demo.mjs <e-mailadres> [--clean]');
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.development.local'), 'utf8').split('\n')
    .map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error('geen lokale URL of service key in .env.development.local');
// Een demoset hoort nooit in productie. Dit is de enige controle die dat afdwingt.
if (!url.includes('127.0.0.1')) throw new Error('dit script draait alleen tegen de lokale stack');

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function rest(pathname, init = {}) {
  const res = await fetch(`${url}/rest/v1/${pathname}`, { ...init, headers: { ...headers, ...init.headers } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const usersRes = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=500`, { headers });
if (!usersRes.ok) throw new Error(`gebruikers ophalen faalde: ${usersRes.status}`);
const { users: list = [] } = await usersRes.json();
const user = list.find(u => u.email === email);
if (!user) throw new Error(`geen gebruiker met ${email} op de lokale stack`);

const exams = await rest('exams?select=id,number&level=eq.a2&skill=eq.lezen&number=in.(1,2,3)&order=number');
const examIds = exams.map(e => e.id);

if (clean) {
  const stimuli = await rest(`stimuli?select=id&title=eq.ZWAKTEKAART-DEMO`);
  const ids = stimuli.map(s => s.id);
  if (ids.length) {
    const qs = await rest(`questions?select=id&stimulus_id=in.(${ids.join(',')})`);
    if (qs.length) {
      await rest(`user_question_results?question_id=in.(${qs.map(q => q.id).join(',')})`, { method: 'DELETE' });
      await rest(`question_concepts?question_id=in.(${qs.map(q => q.id).join(',')})`, { method: 'DELETE' });
      await rest(`questions?id=in.(${qs.map(q => q.id).join(',')})`, { method: 'DELETE' });
    }
    await rest(`stimuli?id=in.(${ids.join(',')})`, { method: 'DELETE' });
  }
  await rest(`exams?id=in.(${examIds.join(',')})&number=in.(2,3)`, {
    method: 'PATCH', body: JSON.stringify({ published: false }),
  });
  console.log('demoset verwijderd, examens 2 en 3 weer op niet-gepubliceerd');
  process.exit(0);
}

/**
 * Per concept een eigen slagingspercentage, zodat de vijf balken echt uiteenlopen. De verdeling
 * is verzonnen maar niet willekeurig: `precies lezen` is bij A2 Lezen de vaardigheid die de
 * meeste vragen kost, dus die staat hier het laagst.
 */
const PLAN = [
  ['lezen-zoekend-lezen', 3, 3],
  ['lezen-vraag-eerst', 3, 3],
  ['lezen-signaalwoorden', 3, 1],
  ['voegwoorden-hoofdzin', 3, 1],
  ['modale-werkwoorden', 3, 1],
  ['lezen-woord-raden', 3, 2],
  ['bijzin-omdat-als', 3, 2],
  ['hoofdzin-woordorde', 3, 2],
  ['bijzin-dat-of', 3, 1],
  ['om-te', 3, 2],
  ['perfectum-regelmatig', 3, 1],
  ['verleden-tijd', 3, 1],
];

const slugs = PLAN.map(p => p[0]);
const concepts = await rest(`concepts?select=id,slug&level=eq.a2&slug=in.(${slugs.join(',')})`);
const conceptId = new Map(concepts.map(c => [c.slug, c.id]));
for (const s of slugs) if (!conceptId.has(s)) throw new Error(`onbekend concept: ${s}`);

await rest(`exams?id=in.(${examIds.join(',')})`, {
  method: 'PATCH', body: JSON.stringify({ published: true }),
});

/*
 * Idempotent: een tweede run voor een tweede gebruiker hergebruikt dezelfde vragen en zet er
 * alleen een antwoordlog bij. Anders zou elke run twaalf vragen per examen aanmaken en zouden de
 * percentages van de vorige gebruiker meeverschuiven.
 */
let stimuli = await rest(`stimuli?select=id,exam_id&title=eq.ZWAKTEKAART-DEMO&order=id`);
if (stimuli.length === 0) {
  stimuli = await rest('stimuli', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(examIds.map((id, i) => ({
      exam_id: id, skill: 'lezen', sort_order: 900 + i, kind: 'text',
      title: 'ZWAKTEKAART-DEMO', body_html: '<p>Demofragment voor de zwaktekaart.</p>',
      review_status: 'validated',
    }))),
  });
}

let questions = await rest(`questions?select=id&stimulus_id=in.(${stimuli.map(s => s.id).join(',')})&order=id`);
if (questions.length === 0) {
  questions = await rest('questions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(stimuli.flatMap(s => Array.from({ length: 12 }, (_, n) => ({
      stimulus_id: s.id, sort_order: n + 1,
      prompt: `Demovraag ${n + 1}`, explanation: 'Demo.', review_status: 'validated',
    })))),
  });
}

const tags = [];
const results = [];
let cursor = 0;
for (const [slug, total, correct] of PLAN) {
  for (let i = 0; i < total; i++) {
    const q = questions[cursor++];
    tags.push({ question_id: q.id, concept_id: conceptId.get(slug), weight: 3, source: 'auto' });
    results.push({
      user_id: user.id, question_id: q.id, was_correct: i < correct,
      answered_at: new Date(Date.now() - (i + 1) * 864e5).toISOString(),
    });
  }
}

// `merge-duplicates` zodat een tweede run voor dezelfde gebruiker niets dubbel doet; het
// antwoordlog is append-only en wordt eerst geschoond voor precies deze vragen.
await rest('question_concepts', {
  method: 'POST',
  headers: { Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify(tags),
});
await rest(`user_question_results?user_id=eq.${user.id}&question_id=in.(${questions.map(q => q.id).join(',')})`, {
  method: 'DELETE',
});
await rest('user_question_results', { method: 'POST', body: JSON.stringify(results) });

console.log(`klaar: ${questions.length} vragen, ${tags.length} koppelingen, ${results.length} antwoorden voor ${email}`);
console.log('open http://localhost:3001/nl/dashboard/a2/lezen');
