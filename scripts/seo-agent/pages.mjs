/**
 * De pagina-triage voor /admin/seo: elke sitemap-URL in één bak van het herstelplaybook
 * (healthy · improve · consolidate · remove · watch), met een plan en een week.
 *
 *   node scripts/seo-agent/pages.mjs            → schrijft seo-agent/pages.json
 *
 * Bronnen: de sitemap uit de laatste snapshot (`health.json`) en de pagina-audit van 11-10
 * (`reports/page-audit-*.csv`, de nieuwste). De zoekcijfers per pagina staan hier bewust níet in:
 * die haalt de pagina live uit Search Console, anders veroudert dit bestand elke dag.
 *
 * Tekst in het uitvoerbestand is Engels (besluit eigenaar, 26-10); de regels hieronder zijn de
 * bron, dus een andere indeling is een wijziging hier en een nieuwe run, nooit handwerk in de JSON.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { isoWeek } from './lib/dates.mjs';

const ROOT = 'seo-agent';
const AMBER_PER_WEEK = 2;

const weeks = readdirSync(`${ROOT}/data`).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort();
const health = JSON.parse(readFileSync(`${ROOT}/data/${weeks.at(-1)}/health.json`, 'utf8')).sites.inburgering;
const auditFile = readdirSync(`${ROOT}/reports`).filter(f => /^page-audit-.*\.csv$/.test(f)).sort().at(-1);
const audit = new Map(
  readFileSync(`${ROOT}/reports/${auditFile}`, 'utf8').trim().split('\n').slice(1).map(line => {
    const c = line.split(',');
    return [c[0], { verdict: c[1], reason: c[2], words: +c[3], mt: c[6] === 'true', demand: +c[8] + +c[11] }];
  }),
);

const SECTIONS = [
  { key: 'practice', label: 'Practice exams', note: 'What we sell. Tool intent, the queries AI Overviews can’t answer.' },
  { key: 'guides', label: 'Guides (NL)', note: 'The informational layer. Must be teacher-reviewed to earn trust back.' },
  { key: 'blog', label: 'Blog (NL)', note: 'Topic posts. Several duplicate a guide.' },
  { key: 'knm', label: 'KNM guides (NL)', note: 'Overlaps knmoefenen.nl, which Google prefers for KNM.' },
  { key: 'core', label: 'Core pages', note: 'Home, platform, pricing, teacher, editorial policy.' },
  { key: 'translations', label: 'EN / AR translations', note: 'Machine translations nobody reviewed.' },
];

function section(path) {
  // De tijdlijn is een hulpmiddel, geen vertaald artikel: hij hoort bij wat de site dóét.
  if (/\/(tools|أدوات)\//.test(path)) return 'practice';
  if (/^\/(nl\/(oefenexamen|oefenen)|en\/(practice-exam|practice)|ar\/(امتحان-تجريبي|تدرب))(\/|$)/.test(path)) return 'practice';
  if (/^\/nl\/(inburgering|taalexamens)\//.test(path)) return 'guides';
  if (/^\/nl\/blog\//.test(path)) return 'blog';
  if (/^\/nl\/knm\//.test(path)) return 'knm';
  if (/^\/(en|ar)\/(civic-integration|language-exams|blog|knm|الاندماج|امتحانات-اللغة|المدونة)\//.test(path)) return 'translations';
  return 'core';
}

/** Blogposts die dezelfde zoekintentie bedienen als een gids: samenvoegen en 301 naar de gids. */
const CONSOLIDATE = {
  '/nl/blog/lezen-examen-inburgering-a2': '/nl/taalexamens/lezen-examen',
  '/nl/blog/luisteren-examen-inburgering-a2': '/nl/taalexamens/luisteren-examen',
  '/nl/blog/spreken-examen-inburgering-tips': '/nl/taalexamens/spreken-examen',
  '/nl/blog/inburgeringsexamen-a2-uitleg': '/nl/taalexamens/taalexamens-a2-b1',
};

/** Extra uitleg bij een pagina die meer nodig heeft dan "nakijken en verrijken". */
const NOTES = {
  '/nl/inburgering/inburgering-stappenplan': 'It competes with moet-ik-inburgeren for the same queries. Make this the one page for "inburgeren" and "wat is inburgeren", and leave "wie moet inburgeren" to the other page.',
  '/nl/inburgering/moet-ik-inburgeren': 'Own the "wie moet inburgeren / verplicht" intent; link to the stappenplan for the rest.',
  '/nl/taalexamens/schrijven-examen': 'Add real A2 answers scored against the DUO criteria by Amber. That is what no AI page can copy.',
  '/nl/taalexamens/lezen-examen': 'Receives the blog post on the same topic (301).',
  '/nl/taalexamens/luisteren-examen': 'Receives the blog post on the same topic (301).',
  '/nl/taalexamens/spreken-examen': 'Receives the blog post on the same topic (301).',
};

const PLANNED = [
  {
    id: 'voorbeeldvragen',
    title: 'Voorbeeldvragen inburgeringsexamen',
    section: 'practice',
    demand: 53,
    evidence: '"inburgeringsvragen" had 53 impressions; Google showed /nl/oefenen at position 82, a page that doesn’t answer it.',
    why: 'Tool intent with our own reviewed exam items: something an AI Overview can’t replace and a competitor can’t copy.',
    owner: 'agent',
  },
  {
    id: 'most-missed',
    title: 'Most-missed questions in our practice exams',
    section: 'guides',
    demand: 0,
    evidence: 'No query yet. Built for links, brand searches and AI citations.',
    why: 'Uses our own answer data (anonymised). First-hand data is the strongest non-commodity signal in the recovery playbook.',
    owner: 'agent',
  },
];

const out = [];
for (const url of Object.keys(health.pages)) {
  const path = decodeURI(url.replace(/^https?:\/\/[^/]+/, '')) || '/';
  const sec = section(path);
  const a = audit.get(path);
  let verdict, reason, plan = null;

  if (sec === 'practice' || sec === 'core') {
    verdict = 'healthy';
    reason = sec === 'practice' ? 'A practice page: what the site sells. Keep it, link to it from every guide.' : 'A core page of the site.';
  } else if (sec === 'translations') {
    if (a?.mt) {
      verdict = 'remove';
      reason = a.demand > 0
        ? `Machine translation nobody reviewed. It had ${a.demand} impressions, partly on Dutch queries the Dutch original should get.`
        : 'Machine translation nobody reviewed, with no search demand.';
      plan = { action: 'Noindex and drop from the sitemap. The page stays reachable; it returns to the index once a fluent reviewer checks it.', owner: 'agent', when: 'remove' };
    } else {
      verdict = 'watch';
      reason = 'Not in the last audit.';
    }
  } else if (sec === 'knm') {
    verdict = 'remove';
    reason = 'Never shown in Google. knmoefenen.nl covers KNM and Google prefers it.';
    plan = { action: 'Noindex here until the merge, after your yes. The page stays live for users.', owner: 'eigenaar', when: 'decision' };
  } else if (CONSOLIDATE[path]) {
    verdict = 'consolidate';
    reason = `Same search intent as ${CONSOLIDATE[path]}. Two pages split the signal; one strong page wins.`;
    plan = { action: `Move the best parts into ${CONSOLIDATE[path]} and 301 this URL to it.`, owner: 'agent', when: 'consolidate', into: CONSOLIDATE[path] };
  } else if (a?.verdict === 'improve') {
    verdict = 'improve';
    reason = `Had real demand (${a.demand} impressions in Aug and Sep). Worth saving.`;
    plan = { action: NOTES[path] ?? 'Amber reviews it, adds an example from her own teaching and signs it. Then request indexing.', owner: 'amber', when: 'amber', demand: a.demand };
  } else if (a?.verdict === 'review') {
    verdict = 'watch';
    reason = 'Never shown in Google, not even before the drop.';
    plan = { action: 'No work now. After the recovery, decide whether it has a reason to exist.', owner: 'agent', when: 'later' };
  } else {
    verdict = 'healthy';
    reason = a ? 'Reviewed in the audit; nothing wrong found.' : 'Not in the last audit.';
    if (NOTES[path]) plan = { action: NOTES[path], owner: 'agent', when: 'consolidate' };
  }
  // De vraag uit de audit (aug + sep): de maat van de tegel als er geen live cijfers zijn.
  out.push({ path, section: sec, verdict, reason, plan, demand: a?.demand ?? 0 });
}

/* ── Wanneer: de weekplanning ─────────────────────────────────────────────── */

const addWeeks = (d, n) => new Date(d.getTime() + n * 7 * 86_400_000);
const now = new Date();
const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
const week = n => ({ week: isoWeek(addWeeks(monday, n)), starts: addWeeks(monday, n).toISOString().slice(0, 10) });

// Opschonen eerst en snel (deze week), samenvoegen volgende week, en de beslissing over KNM ook.
for (const p of out) {
  if (!p.plan) continue;
  if (p.plan.when === 'remove') Object.assign(p.plan, week(0));
  else if (p.plan.when === 'consolidate' || p.plan.when === 'decision') Object.assign(p.plan, week(1));
}

// Amber: twee per week op volgorde van vraag; de nieuwe pagina's krijgen een vaste plek in die rij,
// pas na de schoonmaak (week 4 en 6), want nieuwe pagina's tijdens herstel zijn het patroon dat
// Google afstrafte.
const PLANNED_AT = [4, 6];
const planned = PLANNED.map((p, n) => ({ ...p, ...week(PLANNED_AT[n]) }));
const capacity = Array.from({ length: 26 }, (_, w) => AMBER_PER_WEEK - PLANNED_AT.filter(x => x === w).length);
const amberQueue = out.filter(p => p.plan?.when === 'amber').sort((a, b) => b.plan.demand - a.plan.demand);
let w = 0;
for (const p of amberQueue) {
  while (capacity[w] === 0) w++;
  capacity[w]--;
  Object.assign(p.plan, week(w));
}

const counts = Object.fromEntries(['healthy', 'improve', 'consolidate', 'remove', 'watch'].map(v => [v, out.filter(p => p.verdict === v).length]));

writeFileSync(`${ROOT}/pages.json`, JSON.stringify({
  $comment: 'Gegenereerd door scripts/seo-agent/pages.mjs uit de sitemap en de pagina-audit. Niet met de hand bewerken: pas de regels in het script aan en draai het opnieuw. De zoekcijfers per pagina komen live uit Search Console op /admin/seo.',
  updated: now.toISOString().slice(0, 10),
  sources: { sitemap: `${ROOT}/data/${weeks.at(-1)}/health.json`, audit: `${ROOT}/reports/${auditFile}` },
  amber_per_week: AMBER_PER_WEEK,
  sections: SECTIONS,
  counts,
  pages: out,
  planned,
}, null, 2) + '\n');

console.log(`pages.json: ${out.length} pages`, counts, `· ${planned.length} planned`);
