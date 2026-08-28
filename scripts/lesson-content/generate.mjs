/**
 * Schrijf de lessen van één cursus naar `generated/`.
 *
 *   node scripts/lesson-content/generate.mjs plan            # wat er geschreven zou worden
 *   node scripts/lesson-content/generate.mjs a2:lezen        # schrijf ze
 *   node scripts/lesson-content/generate.mjs a2:lezen --check    # valideer wat op schijf staat
 *   node scripts/lesson-content/generate.mjs a2:lezen --only b3  # één les of blok
 *   node scripts/lesson-content/generate.mjs a2:lezen --direct    # via de Anthropic-API
 *
 * ── AUTEURSSTAP EN SEEDSTAP ZIJN GESPLITST ───────────────────────────────────
 * Zelfde reden als bij `scripts/b1-content`: schrijven kost modeltokens en seeden kost
 * databaseschrijfacties en straks TTS. Een herhaling van het één mag nooit het ander opnieuw
 * betalen. `generated/` is het gecommitte artefact en de reviewgrens; de seeder leest alleen
 * dat.
 *
 * ── ÉÉN BESTAND PER LES ──────────────────────────────────────────────────────
 * Niet één bestand per cursus. Een les is de eenheid waarin een docent reviewt en waarin een
 * run kan falen, en 53 lessen in één JSON maakt elke diff onleesbaar. De blok- en
 * cursusstructuur staat niet in `generated/` maar in `plan.mjs` — die is met de hand vastgelegd
 * en hoort niet in een gegenereerd bestand.
 *
 * ── DE WOORDEN KOMEN EERST ───────────────────────────────────────────────────
 * Blok A's opgaven moeten over echte woorden gaan, dus de woordenlijst wordt vóór de lessen
 * geschreven en als context meegegeven. Anders verzint elke woordles zijn eigen woorden en
 * heeft `lesson_words` niets te maken met de opgaven die eroverheen gaan.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../a2-content/lib.mjs';
import { loadItemRules } from './load-items.mjs';
import { createLessonAuthor, normalisePayloads } from './author.mjs';
import { coursePlan, parseTarget, BUILT, WORD_THEMES, STRATEGY_CONCEPTS } from './plan.mjs';
import { A2_CONCEPTS } from './concepts-a2.mjs';
import { createWordAuthor } from './words.mjs';

const GEN_DIR = path.join(ROOT, 'scripts', 'lesson-content', 'generated');

/** Hoeveel lessen tegelijk. Boven ~4 loopt de gateway tegen rate limits en wordt het langzamer. */
const CONCURRENCY = 4;

function readEnv() {
  // Dezelfde ladder als de andere contentscripts: .env.local voor de gehoste sleutels.
  for (const file of ['.env.local', '.env.development.local']) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

async function main() {
  const [target, ...flags] = process.argv.slice(2);
  const check = flags.includes('--check');
  const direct = flags.includes('--direct');
  const onlyIdx = flags.indexOf('--only');
  const only = onlyIdx >= 0 ? flags[onlyIdx + 1] : null;

  if (!target || target === 'plan') return showPlan();

  const { level, onderdeel } = parseTarget(target);
  if (!BUILT.includes(`${level}:${onderdeel}`)) {
    console.error(`${level}:${onderdeel} is nog niet uitgewerkt. Gebouwd: ${BUILT.join(', ')}`);
    process.exit(1);
  }

  const rules = await loadItemRules();
  const blocks = coursePlan(level, onderdeel);
  const outDir = path.join(GEN_DIR, `${level}-${onderdeel}`);
  fs.mkdirSync(outDir, { recursive: true });

  if (check) return checkOnDisk(outDir, blocks, rules, only);

  readEnv();
  const gatewayKey = direct ? null : process.env.AI_GATEWAY_API_KEY;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!gatewayKey && !apiKey) {
    console.error('Geen AI_GATEWAY_API_KEY en geen ANTHROPIC_API_KEY gevonden.');
    process.exit(1);
  }

  // ── de woorden eerst, want blok A's opgaven gaan erover ──────────────────
  const wordsPath = path.join(outDir, '_words.json');
  let words = fs.existsSync(wordsPath) ? JSON.parse(fs.readFileSync(wordsPath, 'utf8')) : null;

  if (!words) {
    console.log(`\nWoordenlijsten voor ${level}:${onderdeel} — ${WORD_THEMES.length} thema's`);
    const wordAuthor = createWordAuthor({ apiKey, gatewayKey });
    words = {};
    for (const theme of WORD_THEMES) {
      process.stdout.write(`  ${theme.slug.padEnd(12)} `);
      words[theme.slug] = await wordAuthor.writeTheme({ level, onderdeel, theme });
      console.log(`${words[theme.slug].length} woorden`);
    }
    fs.writeFileSync(wordsPath, `${JSON.stringify(words, null, 2)}\n`);
  } else {
    console.log(`Woordenlijsten al aanwezig (${Object.keys(words).length} thema's).`);
  }

  // ── de lessen ────────────────────────────────────────────────────────────
  const author = createLessonAuthor({ apiKey, gatewayKey });
  const jobs = [];
  for (const block of blocks) {
    for (const lesson of block.lessons) {
      if (only && !lesson.slug.startsWith(only) && block.letter !== only) continue;
      jobs.push({ block, lesson });
    }
  }

  console.log(`\n${jobs.length} lessen te schrijven, ${CONCURRENCY} tegelijk.\n`);

  let done = 0;
  let failed = 0;
  const queue = [...jobs];

  async function worker() {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      const { block, lesson } = job;
      const file = path.join(outDir, `${lesson.slug}.json`);

      // Een al geschreven les die nog valideert wordt niet opnieuw betaald. Valideert hij
      // niet meer, dan is een regel veranderd en moet hij opnieuw — een dataset die als
      // geheel alleen per ongeluk valideert is geen dataset.
      if (fs.existsSync(file)) {
        const existing = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (lessonProblems(existing, rules).length === 0) {
          done++;
          console.log(`  ✓ ${lesson.slug.padEnd(34)} (al gedaan)`);
          continue;
        }
        console.log(`  ↻ ${lesson.slug.padEnd(34)} (valideert niet meer, opnieuw)`);
      }

      try {
        const unit = await author.writeLesson({
          level, onderdeel, block, lesson,
          context: contextFor({ lesson, onderdeel, words }),
          validateItems: rules.validateItems,
        });
        fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`);
        done++;
        const n = unit.items.filter(i => rules.isExerciseKind(i.kind)).length;
        console.log(`  ✓ ${lesson.slug.padEnd(34)} ${unit.items.length} items, ${n} opgaven`);
      } catch (e) {
        failed++;
        console.log(`  ✗ ${lesson.slug.padEnd(34)} ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const s = author.stats();
  console.log(`\n${done} geschreven, ${failed} mislukt.`);
  console.log(`${s.calls} calls · ${(s.inTokens / 1000).toFixed(0)}k in · ` +
              `${(s.outTokens / 1000).toFixed(0)}k uit · ~$${s.usd.toFixed(2)}`);
  if (failed) process.exit(1);
}

/**
 * De context die een les nodig heeft om over het juiste te gaan.
 *
 * Per lessoort iets anders, en het is bewust hier gebundeld in plaats van in de prompt: welk
 * concept een les uitlegt is een feit uit `plan.mjs`, niet iets wat het model mag kiezen.
 */
function contextFor({ lesson, onderdeel, words }) {
  switch (lesson.kind) {
    case 'woorden':
      return { words: words[lesson.theme] ?? [] };
    case 'grammatica': {
      const concept = A2_CONCEPTS.find(c => c.slug === lesson.concept);
      if (!concept) throw new Error(`concept "${lesson.concept}" bestaat niet in concepts-a2.mjs`);
      return { concept };
    }
    case 'strategie': {
      const concept = (STRATEGY_CONCEPTS[onderdeel] ?? []).find(c => c.slug === lesson.strategyConcept);
      if (!concept) throw new Error(`strategieconcept "${lesson.strategyConcept}" bestaat niet`);
      return { concept };
    }
    case 'tekstsoort':
    case 'training':
      // De naam van de tekstsoort komt normaal uit `sections.name_nl`. De generator heeft geen
      // database, dus hier de slug, leesbaar gemaakt. De seeder zet de echte titel.
      return { sectionName: lesson.section.replace(/-/g, ' ').replace('lezen', '').trim() };
    case 'toets':
      // De toets gaat over de concepten van dit onderdeel — een selectie, want twaalf opgaven
      // over 28 concepten is geen toets maar een steekproef van één per concept.
      return {
        concepts: A2_CONCEPTS
          .filter(c => c.onderdelen.includes(onderdeel))
          .filter((_, i) => i % 3 === (lesson.slug.startsWith('e1') ? 0 : 1))
          .slice(0, 8),
      };
    default:
      throw new Error(`onbekende lessoort "${lesson.kind}"`);
  }
}

function lessonProblems(unit, rules) {
  if (!unit?.items?.length) return ['leeg'];
  normalisePayloads(unit);
  const items = unit.items.map((it, i) => ({
    kind: it.kind, sort_order: i, tier: it.tier ?? null,
    payload: it.payload ?? {}, explanation: it.explanation ?? null,
    section_slug: null,
    options: (it.options ?? []).map((o, j) => ({
      label: o.label, body: o.body, image_urls: [], is_correct: !!o.is_correct, sort_order: j,
    })),
  }));
  return rules.validateItems(items).map(i =>
    `${i.index >= 0 ? `item ${i.index + 1}` : 'les'} (${i.kind}): ${i.message}`);
}

function checkOnDisk(outDir, blocks, rules, only) {
  let missing = 0;
  let bad = 0;
  let ok = 0;

  for (const block of blocks) {
    for (const lesson of block.lessons) {
      if (only && !lesson.slug.startsWith(only) && block.letter !== only) continue;
      const file = path.join(outDir, `${lesson.slug}.json`);
      if (!fs.existsSync(file)) {
        console.log(`  – ${lesson.slug.padEnd(34)} ontbreekt`);
        missing++;
        continue;
      }
      const problems = lessonProblems(JSON.parse(fs.readFileSync(file, 'utf8')), rules);
      if (problems.length) {
        console.log(`  ✗ ${lesson.slug.padEnd(34)} ${problems.slice(0, 3).join(' · ')}`);
        bad++;
      } else {
        ok++;
      }
    }
  }
  console.log(`\n${ok} in orde, ${bad} ongeldig, ${missing} ontbreken.`);
  if (bad || missing) process.exit(1);
}

function showPlan() {
  for (const target of BUILT) {
    const { level, onderdeel } = parseTarget(target);
    const blocks = coursePlan(level, onderdeel);
    const total = blocks.reduce((n, b) => n + b.lessons.length, 0);
    console.log(`\n${target} — ${total} lessen`);
    for (const b of blocks) {
      console.log(`  ${b.letter}  ${b.name_nl.padEnd(16)} ${String(b.lessons.length).padStart(2)} lessen`);
      for (const l of b.lessons) {
        console.log(`       ${l.slug.padEnd(34)} ${l.kind}`);
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
