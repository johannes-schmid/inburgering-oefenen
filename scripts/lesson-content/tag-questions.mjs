/**
 * Koppel bestaande examenvragen aan concepten: `question_concepts`.
 *
 *   node scripts/lesson-content/tag-questions.mjs a2:lezen --dry-run
 *   node scripts/lesson-content/tag-questions.mjs a2:lezen --exam 3
 *   node scripts/lesson-content/tag-questions.mjs a2:lezen
 *   node scripts/lesson-content/tag-questions.mjs a2:lezen --production
 *
 * ── WAAROM DIT BESTAAT ───────────────────────────────────────────────────────
 * Dit is de as die de conceptenlaag zijn bestaansrecht geeft. Zonder deze tabel weet een
 * kandidaat na een gezakt examen dát het fout ging en niet wát hij moet leren, en dan is de
 * leerlaag alleen een tweede contentsoort naast de examens.
 *
 * Voor KNM bestond die weg al, langs de tekstsoort (`lib/leren-links.ts`:
 * `question.section_id → sections.slug → /leren/{thema}`). Voor de taalonderdelen kán dat niet:
 * de tekstsoort van een leesvraag is "Advertentie", en dat is geen leerbaar concept. Vandaar
 * een expliciete koppeling per vraag.
 *
 * ── ÉÉN CALL PER FRAGMENT, NIET PER VRAAG ────────────────────────────────────
 * Een Lezen-fragment draagt 2–3 vragen over dezelfde tekst; die samen taggen is goedkoper én
 * beter, omdat het model de tekst één keer leest en de vragen tegen elkaar kan afwegen. Bij een
 * standalone vraag (KNM) is de unit de vraag zelf.
 *
 * ── `weight` IS GEEN VERSIERING ──────────────────────────────────────────────
 * 3 = deze vraag stáát of valt met dit concept. 1 = het komt er ook in voor. Het
 * resultaatscherm sorteert erop, zodat de aanbeveling niet verdund wordt door concepten die de
 * fout niet verklaren. Een model dat alles op 3 zet maakt het veld waardeloos, dus de validatie
 * eist spreiding zodra er meer dan één concept aan een vraag hangt.
 *
 * ── WAT HET NIET DOET ────────────────────────────────────────────────────────
 * Het raadt niet. Een vraag die over geen enkel concept uit de bibliotheek gaat — en die zijn
 * er, bij zoekend lezen gaat het vaak alleen om informatie vinden — krijgt **nul** rijen. Een
 * verzonnen koppeling stuurt de kandidaat naar een les die zijn fout niet verklaart, en dat is
 * erger dan geen advies. `source = 'auto'` markeert elke rij; de docent overschrijft in
 * `/admin` en die rijen krijgen `'docent'`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../a2-content/lib.mjs';
import { createAuthor, looksEscaped } from '../b1-content/author.mjs';
import { parseTarget, BUILT, STRATEGY_CONCEPTS } from './plan.mjs';
import { A2_CONCEPTS } from './concepts-a2.mjs';
import { CACHE_DIR } from './author.mjs';

const CONCURRENCY = 4;

function readEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function createRest(production) {
  const env = production ? readEnvFile('.env.local') : readEnvFile('.env.development.local');
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('geen URL of service key gevonden');
  if (production && url.includes('127.0.0.1')) throw new Error('--production wijst naar localhost');
  if (!production && !url.includes('127.0.0.1')) throw new Error('zonder --production moet dit de lokale stack zijn');

  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const base = `${url}/rest/v1`;

  return {
    async get(pathAndQuery) {
      const res = await fetch(`${base}${pathAndQuery}`, { headers });
      if (!res.ok) throw new Error(`GET ${pathAndQuery} -> ${res.status} ${await res.text()}`);
      return res.json();
    },
    async upsert(table, rows, onConflict) {
      const res = await fetch(`${base}/${table}?on_conflict=${onConflict}`, {
        method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`POST ${table} -> ${res.status} ${await res.text()}`);
      return res.json();
    },
  };
}

/* ── de prompt ───────────────────────────────────────────────────────────── */

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['taggings'],
  properties: {
    taggings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question_id', 'concepts'],
        properties: {
          question_id: { type: 'integer' },
          concepts: {
            type: 'array',
            description:
              'Nul tot drie elementen, elk "concept-slug || gewicht". Gewicht is 3 als de vraag ' +
              'staat of valt met dit concept, 2 als het duidelijk meespeelt, 1 als het er ook ' +
              'in voorkomt. LEEG LATEN als geen enkel concept de vraag echt raakt.',
            items: { type: 'string' },
          },
        },
      },
    },
  },
};

function systemPrompt(concepts) {
  return `
Je koppelt vragen uit een Nederlands inburgeringsexamen (niveau A2) aan de concepten die een
kandidaat moet kennen om ze goed te kunnen beantwoorden.

Dit is de volledige lijst concepten. Gebruik ALLEEN deze slugs, precies zo geschreven:

${concepts.map(c => `  ${c.slug}  —  ${c.name_nl}: ${c.one_liner}`).join('\n')}

Hoe je kiest:
- Vraag je af: welk concept moet iemand beheersen om deze vraag goed te krijgen? Niet: welke
  woorden komen erin voor.
- Grammaticale concepten koppel je alleen als de grammatica écht bepaalt wat het juiste antwoord
  is. Dat een tekst een voltooide tijd bevat is niet genoeg; het moet uitmaken.
- Strategieconcepten (zoekend lezen, signaalwoorden, afzender-datum-actie, de vraag eerst lezen,
  een woord raden) koppel je als de vraag vooral een manier van werken toetst.
- Maximaal drie concepten per vraag, en gebruik gewicht 3 spaarzaam: hoogstens één per vraag.
- **Laat de lijst leeg als geen enkel concept de vraag echt raakt.** Dat is een geldig en vaak
  juist antwoord. Een verzonnen koppeling stuurt de kandidaat naar een les die zijn fout niet
  verklaart, en dat is erger dan geen advies.
`.trim();
}

/** Elke geldige slug, plus de strategieconcepten van dit onderdeel. */
function conceptList(onderdeel) {
  return [
    ...A2_CONCEPTS.filter(c => c.onderdelen.includes(onderdeel)),
    ...(STRATEGY_CONCEPTS[onderdeel] ?? []),
  ];
}

function validateTaggings(unit, { questionIds, validSlugs }) {
  const problems = [];
  if (!Array.isArray(unit?.taggings)) return ['taggings is geen lijst'];
  if (looksEscaped(unit)) problems.push('er staan dubbel-escaped tekens in de respons (\\u00xx)');

  const seen = new Set();
  for (const t of unit.taggings) {
    if (!questionIds.includes(t.question_id)) {
      problems.push(`vraag ${t.question_id} hoort niet bij dit fragment`);
      continue;
    }
    if (seen.has(t.question_id)) problems.push(`vraag ${t.question_id} staat twee keer`);
    seen.add(t.question_id);

    const parsed = (t.concepts ?? []).map(parseTagging);
    if (parsed.length > 3) problems.push(`vraag ${t.question_id} heeft ${parsed.length} concepten, maximaal 3`);

    for (const p of parsed) {
      if (!p) { problems.push(`vraag ${t.question_id}: een element is niet "slug || gewicht"`); continue; }
      if (!validSlugs.has(p.slug)) {
        problems.push(`vraag ${t.question_id}: "${p.slug}" staat niet in de conceptenlijst`);
      }
      if (![1, 2, 3].includes(p.weight)) {
        problems.push(`vraag ${t.question_id}: gewicht ${p.weight} moet 1, 2 of 3 zijn`);
      }
    }
    if (parsed.filter(p => p?.weight === 3).length > 1) {
      problems.push(`vraag ${t.question_id} heeft meer dan één concept op gewicht 3`);
    }
  }

  const missing = questionIds.filter(id => !seen.has(id));
  if (missing.length) problems.push(`vragen zonder uitspraak: ${missing.join(', ')}`);

  return problems;
}

function parseTagging(raw) {
  const parts = String(raw).split('||').map(s => s.trim());
  if (parts.length !== 2) return null;
  const weight = Number(parts[1]);
  if (!Number.isInteger(weight)) return null;
  return { slug: parts[0], weight };
}

/* ── de run ──────────────────────────────────────────────────────────────── */

async function main() {
  const [target, ...flags] = process.argv.slice(2);
  const dryRun = flags.includes('--dry-run');
  const production = flags.includes('--production');
  const examIdx = flags.indexOf('--exam');
  const onlyExam = examIdx >= 0 ? Number(flags[examIdx + 1]) : null;

  if (!target) {
    console.error('Gebruik: node scripts/lesson-content/tag-questions.mjs a2:lezen [--exam N] [--dry-run] [--production]');
    process.exit(1);
  }
  const { level, onderdeel } = parseTarget(target);
  if (!BUILT.includes(`${level}:${onderdeel}`)) {
    console.error(`${level}:${onderdeel} is nog niet uitgewerkt. Gebouwd: ${BUILT.join(', ')}`);
    process.exit(1);
  }

  const rest = createRest(production);
  const concepts = conceptList(onderdeel);
  const validSlugs = new Set(concepts.map(c => c.slug));

  // De concept-id's uit de database: het model werkt met slugs, de tabel met id's.
  const rows = await rest.get(`/concepts?select=id,slug&level=eq.${level}`);
  const conceptId = new Map(rows.map(r => [r.slug, r.id]));
  const unknown = [...validSlugs].filter(s => !conceptId.has(s));
  if (unknown.length) {
    console.error(`Deze concepten staan niet in de database — run eerst seed.mjs:\n  ${unknown.join('\n  ')}`);
    process.exit(1);
  }

  // De vragen, per fragment. `exams_real` slaat de backlog (nummer 0) over.
  const examFilter = onlyExam ? `&number=eq.${onlyExam}` : '';
  const exams = await rest.get(
    `/exams?select=id,number&level=eq.${level}&skill=eq.${onderdeel}&number=gt.0${examFilter}&order=number`);

  const units = [];
  for (const exam of exams) {
    const stimuli = await rest.get(
      `/stimuli?select=id,kind,intro,title,body_html,script&exam_id=eq.${exam.id}&order=sort_order`);
    const questions = await rest.get(
      `/questions?select=id,stimulus_id,prompt,explanation,sort_order&exam_id=eq.${exam.id}&order=sort_order`);

    const byStimulus = new Map();
    for (const q of questions) {
      const key = q.stimulus_id ?? `solo-${q.id}`;
      const list = byStimulus.get(key) ?? [];
      list.push(q);
      byStimulus.set(key, list);
    }
    for (const [key, qs] of byStimulus) {
      const stimulus = stimuli.find(s => s.id === key) ?? null;
      units.push({ exam, stimulus, questions: qs, key: `tag-${level}-${onderdeel}-${exam.number}-${key}` });
    }
  }

  console.log(`\n${level}:${onderdeel} — ${exams.length} examens, ${units.length} fragmenten, ` +
              `${units.reduce((n, u) => n + u.questions.length, 0)} vragen`);
  console.log(`${concepts.length} concepten beschikbaar`);

  if (dryRun) {
    console.log('\n--dry-run: geen enkele call, niets geschreven.');
    return;
  }

  const env = readEnvFile('.env.local');
  const author = createAuthor({
    apiKey: env.ANTHROPIC_API_KEY,
    gatewayKey: env.AI_GATEWAY_API_KEY,
    cacheDir: CACHE_DIR,
  });
  const system = systemPrompt(concepts);

  const queue = [...units];
  const taggingRows = [];
  let done = 0;
  let failed = 0;
  let empty = 0;

  async function worker() {
    for (;;) {
      const unit = queue.shift();
      if (!unit) return;
      const questionIds = unit.questions.map(q => q.id);

      const text = unit.stimulus
        ? [unit.stimulus.title, unit.stimulus.intro, unit.stimulus.body_html, unit.stimulus.script].filter(Boolean).join('\n\n')
        : '(deze vraag staat op zichzelf en heeft geen tekst)';

      const prompt = [
        `EXAMEN ${unit.exam.number}`,
        '',
        'DE TEKST:',
        text.slice(0, 4000),
        '',
        'DE VRAGEN:',
        ...unit.questions.map(q =>
          `- id ${q.id}: ${q.prompt}\n  (toelichting bij het juiste antwoord: ${q.explanation ?? '—'})`),
        '',
        'Geef voor ELKE vraag een uitspraak, ook als de lijst concepten leeg blijft.',
      ].join('\n');

      try {
        const result = await author.askValidated({
          key: unit.key, system, prompt, schema: SCHEMA, maxTokens: 4000,
          validate: u => validateTaggings(u, { questionIds, validSlugs }),
        });

        for (const t of result.taggings) {
          const parsed = (t.concepts ?? []).map(parseTagging).filter(Boolean);
          if (!parsed.length) { empty++; continue; }
          for (const p of parsed) {
            taggingRows.push({
              question_id: t.question_id,
              concept_id: conceptId.get(p.slug),
              weight: p.weight,
              source: 'auto',
            });
          }
        }
        done++;
        if (done % 10 === 0) console.log(`  ${done}/${units.length} fragmenten`);
      } catch (e) {
        failed++;
        console.log(`  ✗ examen ${unit.exam.number} fragment ${unit.stimulus?.id ?? '(solo)'}: ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (taggingRows.length) {
    // In batches, want PostgREST kapt een enkele insert niet af maar een request van tienduizend
    // rijen is een timeout waar niemand iets aan kan zien.
    for (let i = 0; i < taggingRows.length; i += 500) {
      await rest.upsert('question_concepts', taggingRows.slice(i, i + 500), 'question_id,concept_id');
    }
  }

  const s = author.stats();
  console.log(`\n${done} fragmenten getagd, ${failed} mislukt.`);
  console.log(`${taggingRows.length} koppelingen geschreven; ${empty} vragen bewust ongetagd.`);
  console.log(`${s.calls} calls · ~$${s.usd.toFixed(2)}`);
  if (failed) process.exit(1);
}

main().catch(e => { console.error(`\n${e.message}`); process.exit(1); });
