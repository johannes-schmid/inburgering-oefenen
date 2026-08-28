/**
 * Schrijf een cursus uit `generated/` naar de database.
 *
 *   node scripts/lesson-content/seed.mjs a2:lezen --dry-run     # valideer, raak niets aan
 *   node scripts/lesson-content/seed.mjs a2:lezen               # de lokale stack
 *   node scripts/lesson-content/seed.mjs a2:lezen --production  # het gehoste project
 *
 * ── ALLES WORDT `pending` GESCHREVEN ─────────────────────────────────────────
 * Dit is het verschil met `scripts/a2-content/seed-a2-content.mjs`, dat `validated` schreef
 * omdat `exam_publish_issues()` geen "gepubliceerd maar niet nagekeken"-toestand kent. Dat veld
 * is het enige in dat systeem dat liegt. Hier is de reviewgate echt: `fetchCourse()` laat
 * alleen `validated` lessen in een blok zien, dus een geseede cursus is ONZICHTBAAR tot de
 * docent hem in `/admin/lessen` vrijgeeft. Dat is de bedoeling en niet een tekortkoming —
 * lescontent is de plek waar de belofte "er staat een docent achter" het meest waard is.
 *
 * `--publish` bestaat NIET. Vrijgeven gebeurt per les, door een mens, in de admin.
 *
 * ── DE VOLGORDE IS DRAGEND ───────────────────────────────────────────────────
 * conceptgroepen -> concepten -> chips -> woorden -> blokken -> lessen -> items -> opties ->
 * lesson_concepts. Elke stap heeft de vorige nodig als foreign key, en `lesson_concepts` gaat
 * als laatste omdat de trigger die "één les legt een concept uit" afdwingt zowel de les als het
 * concept moet kunnen opzoeken.
 *
 * ── IDEMPOTENT, MAAR NIET DESTRUCTIEF ────────────────────────────────────────
 * Alles gaat via upsert op de natuurlijke sleutel. Items en opties worden per les eerst
 * verwijderd en dan opnieuw geschreven — dat mag hier, want er hangt geen kandidaatantwoord aan
 * een lesitem (anders dan bij `question_options`, waar een delete
 * `user_question_results.chosen_option_id` op NULL zet en wist wat kandidaten kozen).
 * `user_lesson_progress` verwijst naar de LES, niet naar het item, en blijft dus intact.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../a2-content/lib.mjs';
import { loadItemRules } from './load-items.mjs';
import { normalisePayloads } from './author.mjs';
import { coursePlan, parseTarget, BUILT, WORD_THEMES, STRATEGY_CONCEPTS } from './plan.mjs';
import { A2_GROUPS, A2_CONCEPTS } from './concepts-a2.mjs';

const GEN_DIR = path.join(ROOT, 'scripts', 'lesson-content', 'generated');

/* ── PostgREST ───────────────────────────────────────────────────────────── */

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

function resolveTarget(production) {
  // `.env.local` wijst naar het gehoste project, `.env.development.local` naar de lokale
  // stack. Nooit door elkaar: een seedrun die per ongeluk op productie landt is niet terug te
  // draaien zonder te weten wat er al stond.
  const env = production ? readEnvFile('.env.local') : readEnvFile('.env.development.local');
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(`Geen URL of service key in ${production ? '.env.local' : '.env.development.local'}`);
  }
  if (production && url.includes('127.0.0.1')) {
    throw new Error('--production maar .env.local wijst naar localhost. Gestopt.');
  }
  if (!production && !url.includes('127.0.0.1')) {
    throw new Error('Zonder --production moet de URL de lokale stack zijn. Gestopt.');
  }
  return { url, key };
}

function createRest({ url, key }) {
  const base = `${url}/rest/v1`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  async function call(method, pathAndQuery, body, prefer) {
    const res = await fetch(`${base}${pathAndQuery}`, {
      method,
      headers: prefer ? { ...headers, Prefer: prefer } : headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${method} ${pathAndQuery} -> ${res.status} ${text.slice(0, 400)}`);
    }
    return text ? JSON.parse(text) : null;
  }

  return {
    select: (table, query = '') => call('GET', `/${table}?${query}`),
    patch: (table, query, body) =>
      call('PATCH', `/${table}?${query}`, body, 'return=representation'),
    /**
     * Upsert op een natuurlijke sleutel, en geeft de rijen terug.
     *
     * `return=representation` is niet optioneel: zonder die Prefer geeft PostgREST 201 met een
     * lege body en weet je niet of er iets is geschreven. Een RLS-geweigerde write geeft 200
     * met NUL RIJEN en ziet er anders identiek uit aan een geslaagde save — die val heeft dit
     * project al twee keer gehad.
     */
    upsert: (table, rows, onConflict) =>
      call('POST', `/${table}?on_conflict=${onConflict}`, rows,
        'resolution=merge-duplicates,return=representation'),
    insert: (table, rows) =>
      call('POST', `/${table}`, rows, 'return=representation'),
    delete: (table, query) => call('DELETE', `/${table}?${query}`),
  };
}

/* ── de run ──────────────────────────────────────────────────────────────── */

async function main() {
  const [target, ...flags] = process.argv.slice(2);
  const dryRun = flags.includes('--dry-run');
  const production = flags.includes('--production');
  /**
   * Seed een cursus waarvan nog niet elke les geschreven is.
   *
   * Zelfde mechanisme als `--partial` in `scripts/b1-content/index.mjs`, en om dezelfde reden:
   * tijdens het bouwen wil je de helft kunnen bekijken, en op productie nooit. **Geweigerd in
   * combinatie met `--production`** — een halve cursus op productie is een blok met een gat dat
   * niemand ziet, en de cursist merkt het pas als hij erop klikt.
   */
  const partial = flags.includes('--partial');
  if (partial && production) {
    console.error('--partial en --production sluiten elkaar uit: een halve cursus gaat niet live.');
    process.exit(1);
  }

  if (!target) {
    console.error('Gebruik: node scripts/lesson-content/seed.mjs a2:lezen [--dry-run] [--production]');
    process.exit(1);
  }

  const { level, onderdeel } = parseTarget(target);
  if (!BUILT.includes(`${level}:${onderdeel}`)) {
    console.error(`${level}:${onderdeel} is nog niet uitgewerkt. Gebouwd: ${BUILT.join(', ')}`);
    process.exit(1);
  }

  const rules = await loadItemRules();
  const blocks = coursePlan(level, onderdeel);
  const dir = path.join(GEN_DIR, `${level}-${onderdeel}`);

  // ── 1. alles van schijf lezen en valideren vóór één netwerkcall ──────────
  const wordsPath = path.join(dir, '_words.json');
  if (!fs.existsSync(wordsPath)) throw new Error(`${wordsPath} ontbreekt — run eerst generate.mjs`);
  const wordsByTheme = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  const units = new Map();
  const problems = [];
  const missing = [];

  for (const block of blocks) {
    for (const lesson of block.lessons) {
      const file = path.join(dir, `${lesson.slug}.json`);
      if (!fs.existsSync(file)) {
        // Ontbrekende lessen zijn een fout, tenzij `--partial`. Dan worden ze overgeslagen én
        // opgesomd: stil overslaan zou een blok opleveren dat compleet lijkt.
        if (partial) { missing.push(lesson.slug); continue; }
        problems.push(`${lesson.slug}: bestand ontbreekt`);
        continue;
      }
      const unit = normalisePayloads(JSON.parse(fs.readFileSync(file, 'utf8')));
      const items = toItemRows(unit, rules);
      for (const issue of rules.validateItems(items)) {
        problems.push(`${lesson.slug} ${issue.index >= 0 ? `item ${issue.index + 1}` : ''}: ${issue.message}`);
      }
      units.set(lesson.slug, { unit, items });
    }
  }

  const totalWords = Object.values(wordsByTheme).reduce((n, w) => n + w.length, 0);
  const totalItems = [...units.values()].reduce((n, u) => n + u.items.length, 0);
  const totalExercises = [...units.values()]
    .reduce((n, u) => n + u.items.filter(i => rules.isExerciseKind(i.kind)).length, 0);

  console.log(`\n${level}:${onderdeel}`);
  console.log(`  ${blocks.length} blokken · ${units.size} lessen · ${totalItems} items ` +
              `(${totalExercises} opgaven) · ${totalWords} woorden`);
  console.log(`  ${A2_GROUPS.length} conceptgroepen · ${A2_CONCEPTS.length} concepten ` +
              `· ${(STRATEGY_CONCEPTS[onderdeel] ?? []).length} strategieconcepten`);

  if (problems.length) {
    console.error(`\n${problems.length} probleem(en) — er wordt niets geschreven:`);
    for (const p of problems.slice(0, 25)) console.error(`  - ${p}`);
    if (problems.length > 25) console.error(`  … en ${problems.length - 25} meer`);
    process.exit(1);
  }
  console.log('  alles valideert.');
  if (missing.length) {
    console.log(`\n  --partial: ${missing.length} les(sen) ontbreken en worden overgeslagen:`);
    for (const m of missing) console.log(`    – ${m}`);
  }

  if (dryRun) {
    console.log('\n--dry-run: niets geschreven.');
    return;
  }

  const rest = createRest(resolveTarget(production));
  console.log(`\nSchrijven naar ${production ? 'PRODUCTIE' : 'de lokale stack'}…\n`);

  // ── 2. conceptgroepen en concepten ───────────────────────────────────────
  const groupRows = await rest.upsert('concept_groups',
    A2_GROUPS.map(g => ({ level, ...g })), 'level,slug');
  const groupId = new Map(groupRows.map(g => [g.slug, g.id]));
  console.log(`  concept_groups      ${groupRows.length}`);

  const strategy = (STRATEGY_CONCEPTS[onderdeel] ?? []).map((c, i) => ({
    level,
    group_id: null,
    slug: c.slug,
    name_nl: c.name_nl,
    kind: 'strategie',
    one_liner: c.one_liner,
    example_html: c.example_html ?? null,
    body_html: null,
    sort_order: 900 + i,
    review_status: 'pending',
  }));

  const conceptRows = await rest.upsert('concepts', [
    ...A2_CONCEPTS.map(c => ({
      level,
      group_id: groupId.get(c.group) ?? null,
      slug: c.slug,
      name_nl: c.name_nl,
      kind: c.kind,
      one_liner: c.one_liner,
      example_html: c.example_html ?? null,
      body_html: null,
      sort_order: c.sort_order,
      review_status: 'pending',
    })),
    ...strategy,
  ], 'level,slug');
  const conceptId = new Map(conceptRows.map(c => [c.slug, c.id]));
  console.log(`  concepts            ${conceptRows.length}`);

  // De chips. Een grammaticaconcept staat hier vaak vier keer, een strategieconcept precies
  // één keer — dat verschil is wat een onderdeel zelfstandig verkoopbaar maakt.
  const chips = [
    ...A2_CONCEPTS.flatMap(c =>
      c.onderdelen.map(o => ({ concept_id: conceptId.get(c.slug), onderdeel: o }))),
    ...strategy.map(c => ({ concept_id: conceptId.get(c.slug), onderdeel })),
  ];
  await rest.upsert('concept_onderdelen', chips, 'concept_id,onderdeel');
  console.log(`  concept_onderdelen  ${chips.length}`);

  // ── 3. woorden ───────────────────────────────────────────────────────────
  //
  // Eén woord staat één keer per onderdeel, ook als twee thema's het beide opvoeren — "de
  // rekening" past bij zowel Gemeente als Winkelen. `lesson_words` is unique op
  // (level, onderdeel, dutch), dus een duplicaat binnen één batch laat PostgREST struikelen met
  // "ON CONFLICT DO UPDATE command cannot affect row a second time".
  //
  // Het eerste thema houdt het woord. Dedupliceren en dóórgaan is beter dan de sleutel
  // verbreden naar (…, theme, dutch): dan zou dezelfde woordkaart in twee lessen staan, twee
  // keer geleerd worden en twee keer meetellen. Wat wordt weggelaten, wordt opgesomd — stil
  // laten vallen is hoe een woordenlijst korter wordt dan zijn thema belooft.
  const wordRows = [];
  const seenWords = new Map();
  const droppedWords = [];
  for (const theme of WORD_THEMES) {
    const list = (wordsByTheme[theme.slug] ?? []).filter(w => {
      const key = String(w.dutch ?? '').trim().toLowerCase();
      if (seenWords.has(key)) {
        droppedWords.push(`${w.dutch} (staat al bij ${seenWords.get(key)})`);
        return false;
      }
      seenWords.set(key, theme.slug);
      return true;
    });
    list.forEach((w, i) => wordRows.push({
      level, onderdeel, theme: theme.slug,
      dutch: w.dutch,
      article: w.article ?? null,
      plural: w.plural ?? null,
      frame: w.frame ?? null,
      meaning_nl: w.meaning_nl,
      example: w.example ?? null,
      usage: w.usage,
      sort_order: (i + 1) * 10,
      review_status: 'pending',
    }));
  }
  const savedWords = await rest.upsert('lesson_words', wordRows, 'level,onderdeel,dutch');
  const wordIdByTheme = new Map();
  for (const w of savedWords) {
    const list = wordIdByTheme.get(w.theme) ?? [];
    list.push(w.id);
    wordIdByTheme.set(w.theme, list);
  }
  console.log(`  lesson_words        ${savedWords.length}` +
    (droppedWords.length ? `  (${droppedWords.length} duplicaat overgeslagen)` : ''));
  for (const d of droppedWords) console.log(`      – ${d}`);

  // ── 4. de tekstsoorten, om blok C en D hun echte titel te geven ──────────
  const sections = await rest.select('sections',
    `select=id,slug,name_nl&topic=eq.${onderdeel}&level=eq.${level}`);
  const sectionBySlug = new Map(sections.map(s => [s.slug, s]));

  // ── 5. blokken ───────────────────────────────────────────────────────────
  const blockRows = await rest.upsert('lesson_blocks', blocks.map(b => ({
    level, onderdeel, letter: b.letter, name_nl: b.name_nl,
    intro: b.intro ?? null, sort_order: b.sort_order,
  })), 'level,onderdeel,letter');
  const blockId = new Map(blockRows.map(b => [b.letter, b.id]));
  console.log(`  lesson_blocks       ${blockRows.length}`);

  // ── 6. lessen, items, opties ─────────────────────────────────────────────
  let itemCount = 0;
  let optionCount = 0;
  const conceptLinks = [];

  for (const block of blocks) {
    for (const lesson of block.lessons) {
      const entry = units.get(lesson.slug);
      if (!entry) continue;   // --partial: deze les is nog niet geschreven
      const { unit, items } = entry;

      // De titel van een tekstsoortles komt uit `sections.name_nl`, niet uit het plan: een
      // docent die "Kort artikel" in "Artikel" verandert hoeft dan één plek bij te werken.
      let title = lesson.title;
      if (!title) {
        const section = sectionBySlug.get(lesson.section);
        if (!section) {
          throw new Error(
            `Les ${lesson.slug} verwijst naar tekstsoort "${lesson.section}", die niet in ` +
            `sections bestaat voor ${level}:${onderdeel}. Stil overslaan zou een blok met een ` +
            'onzichtbaar gat opleveren.');
        }
        title = block.letter === 'D' ? `Training: ${section.name_nl}` : section.name_nl;
      }

      const [saved] = await rest.upsert('lessons', [{
        block_id: blockId.get(block.letter),
        slug: lesson.slug,
        title,
        what_you_learn: unit.what_you_learn ?? null,
        minutes: lesson.minutes ?? null,
        is_free: !!lesson.is_free,
        sort_order: lesson.sort_order,
        // Nooit 'validated'. De docent geeft vrij, in /admin/lessen.
        review_status: 'pending',
      }], 'block_id,slug');

      // Items en opties opnieuw schrijven. Mag hier: aan een lesitem hangt geen
      // kandidaatantwoord, dus een delete wist niets van iemands geschiedenis.
      await rest.delete('lesson_items', `lesson_id=eq.${saved.id}`);

      const sectionId = lesson.section ? sectionBySlug.get(lesson.section)?.id ?? null : null;

      const savedItems = await rest.insert('lesson_items', items.map(it => ({
        lesson_id: saved.id,
        sort_order: it.sort_order,
        kind: it.kind,
        tier: it.tier,
        payload: stripWordIds(it, wordIdByTheme),
        explanation: it.explanation,
        section_id: sectionId,
      })));
      itemCount += savedItems.length;

      const optionRows = [];
      for (const it of items) {
        if (it.kind !== 'mcq' || !it.options.length) continue;
        const row = savedItems.find(s => s.sort_order === it.sort_order);
        for (const o of it.options) {
          optionRows.push({
            item_id: row.id,
            label: o.label,
            body: o.body ?? null,
            image_urls: o.image_urls ?? [],
            // Elke rij eerst false; de juiste wordt hieronder omgezet. Anders trapt de
            // partiële unique index als er per ongeluk twee juiste in één batch zitten.
            is_correct: false,
            sort_order: o.sort_order,
          });
        }
      }
      if (optionRows.length) {
        const savedOptions = await rest.insert('lesson_item_options', optionRows);
        optionCount += savedOptions.length;

        for (const it of items) {
          if (it.kind !== 'mcq') continue;
          const row = savedItems.find(s => s.sort_order === it.sort_order);
          const correct = it.options.find(o => o.is_correct);
          if (!correct) continue;
          // Ná de batch met alles-false, anders trapt de partiële unique index
          // `lesson_item_options_one_correct_idx` als er twee juiste in één insert zitten.
          // `return=representation` maakt zichtbaar dát er een rij is geraakt: een
          // RLS-geweigerde PATCH geeft 200 met nul rijen en ziet er identiek uit aan succes.
          const patched = await rest.patch('lesson_item_options',
            `item_id=eq.${row.id}&label=eq.${correct.label}`, { is_correct: true });
          if (!patched?.length) {
            throw new Error(`kon het juiste antwoord van item ${row.id} niet zetten (0 rijen)`);
          }
        }
      }

      // De conceptkoppeling, verzameld en na alle lessen in één keer geschreven.
      const slug = lesson.concept ?? lesson.strategyConcept;
      if (slug) {
        const id = conceptId.get(slug);
        if (!id) throw new Error(`Les ${lesson.slug} verwijst naar onbekend concept "${slug}"`);
        conceptLinks.push({ lesson_id: saved.id, concept_id: id, role: 'teaches' });
      }
    }
    process.stdout.write(`  blok ${block.letter} klaar\n`);
  }

  console.log(`  lesson_items        ${itemCount}`);
  console.log(`  lesson_item_options ${optionCount}`);

  await rest.upsert('lesson_concepts', conceptLinks, 'lesson_id,concept_id');
  console.log(`  lesson_concepts     ${conceptLinks.length}`);

  console.log(`\nKlaar. Alles staat op review_status = 'pending' en is dus nog onzichtbaar ` +
              `in het portaal.\nGeef lessen vrij in /admin/lessen.`);
}

/**
 * Zet één item om in de rijvorm die de validatie en de database verwachten.
 *
 * `sort_order` komt van de LIJSTVOLGORDE en niet uit het bestand: de volgorde waarin de
 * lessen zijn geschreven ís de volgorde, en hem uit de data lezen zou gaten en duplicaten
 * toelaten die pas als constraintfout opvallen.
 */
function toItemRows(unit, rules) {
  return (unit.items ?? []).map((it, i) => ({
    kind: it.kind,
    sort_order: i,
    tier: it.tier ?? null,
    payload: it.payload ?? {},
    explanation: it.explanation ?? null,
    section_slug: null,
    options: (it.options ?? []).map((o, j) => ({
      label: o.label,
      body: o.body ?? null,
      image_urls: [],
      is_correct: !!o.is_correct,
      sort_order: j,
    })),
  }));
}

/**
 * Vul `word_ids` van een woordenlijst-item met de echte rij-id's.
 *
 * De generator laat dat veld leeg omdat hij de database niet kent. Hier wordt het gevuld, zodat
 * de les naar `lesson_words` verwijst in plaats van zijn eigen kopie van de woorden te dragen —
 * anders landt een correctie aan een woord op de ene plek en niet op de andere.
 */
function stripWordIds(item, wordIdByTheme) {
  if (item.kind !== 'woordenlijst') return item.payload;
  const theme = item.payload?.theme;
  return { ...item.payload, word_ids: wordIdByTheme.get(theme) ?? [] };
}

main().catch(e => { console.error(`\n${e.message}`); process.exit(1); });
