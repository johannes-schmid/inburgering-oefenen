/**
 * Twee reparaties aan bestaande examenvragen, zonder ook maar één rij te verwijderen.
 *
 * ## Waarom niet gewoon opnieuw seeden
 * `seed-a2-content.mjs` begint met `delete from stimuli where exam_id = …`, en dat cascadeert naar
 * `questions` en `user_question_results`. Voor een inhoudelijke correctie aan al gepubliceerde
 * examens is dat te veel: de antwoorden van kandidaten zijn append-only en horen een tekstcorrectie
 * te overleven. Dit script werkt daarom op `question_options.body` / `is_correct` van de rijen die
 * er al staan — dezelfde regel als in /admin: opties worden per label verzoend, nooit verwijderd.
 *
 * ## De twee reparaties
 *   spread   a2 luisteren (`--lezen` voor Lezen) — het goede antwoord stond in 248 van de 250
 *            Luisteren-vragen op A, en in 190 van de 250 Lezen-vragen. De nieuwe
 *            volgorde komt uit `spreadAnswers()` in scripts/a2-content/lib.mjs, dus dit script en
 *            een toekomstige re-seed zetten exact dezelfde opties op exact dezelfde labels.
 *   entities alle onderdelen — `&euro;`, `&eacute;` en vrienden staan letterlijk in optie- en
 *            uitlegteksten. Die velden worden als platte tekst gerenderd (React escapet ze), dus de
 *            kandidaat leest "&euro; 340". Alleen niet-HTML-kolommen; `body_html` blijft ongemoeid.
 *
 *   node scripts/fix-exam-options.mjs spread --dry-run             # a2 luisteren, niets schrijven
 *   node scripts/fix-exam-options.mjs spread --production           # a2 luisteren
 *   node scripts/fix-exam-options.mjs spread --lezen --production   # a2 lezen
 *   node scripts/fix-exam-options.mjs entities --production         # alle onderdelen
 */
import { loadEnv, isLocalUrl, createDb } from './a2-content/lib.mjs';
import { LEZEN_EXAMS, LUISTEREN_EXAMS } from './a2-content/index.mjs';

const argv = process.argv.slice(2);
const flag = n => argv.includes(`--${n}`);
const command = argv.find(a => !a.startsWith('--')) ?? '';
const DRY_RUN = flag('dry-run');
const PRODUCTION = flag('production');

if (!['spread', 'entities'].includes(command)) {
  console.error('Usage: node scripts/fix-exam-options.mjs <spread|entities> [--lezen] [--dry-run] [--production]');
  process.exit(1);
}

const env = loadEnv({ production: PRODUCTION });
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY ?? '';
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY missing from the env file.');
  process.exit(1);
}
if (!isLocalUrl(SUPABASE_URL) && !PRODUCTION) {
  console.error('That env file points at a hosted project. Pass --production to mean it.');
  process.exit(1);
}
console.log(`${command} → ${SUPABASE_URL}${DRY_RUN ? '  (dry run)' : ''}`);

const db = createDb({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });

/* ── spread: het goede antwoord van A af ─────────────────────────────────── */

const DATASETS = { lezen: LEZEN_EXAMS, luisteren: LUISTEREN_EXAMS };

async function spread() {
  const onderdeel = argv.includes('--lezen') ? 'lezen' : 'luisteren';
  let moved = 0;
  let skipped = 0;

  for (const [ei, stimuli] of DATASETS[onderdeel].entries()) {
    const number = ei + 1;
    const exams = await db.selectRows(
      'exams',
      `select=id&skill=eq.${onderdeel}&level=eq.a2&number=eq.${number}&limit=1`
    );
    const examId = exams[0]?.id;
    if (!examId) {
      console.log(`  ${onderdeel} ${number}: geen examenrij`);
      continue;
    }

    const rows = await db.selectRows(
      'stimuli',
      `select=id,sort_order,questions(id,sort_order,prompt,question_options(id,label,body,is_correct))` +
        `&exam_id=eq.${examId}&order=sort_order`
    );

    for (const [si, s] of stimuli.entries()) {
      const dbStimulus = rows.find(r => r.sort_order === si + 1);
      if (!dbStimulus) {
        console.log(`  ${onderdeel} ${number}: geen stimulus met sort_order ${si + 1} — overgeslagen`);
        skipped += s.questions.length;
        continue;
      }

      for (const [qi, q] of s.questions.entries()) {
        const at = `${onderdeel} ${number} · fragment ${si + 1} · vraag ${qi + 1}`;
        const dbQuestion = dbStimulus.questions.find(r => r.sort_order === qi + 1);
        if (!dbQuestion) { console.log(`  ${at}: geen vraagrij`); continue; }

        const options = [...dbQuestion.question_options].sort((a, b) => a.label.localeCompare(b.label));
        // De verzameling teksten moet identiek zijn; alleen de volgorde mag verschillen. Zo niet,
        // dan is de vraag in /admin herschreven en is de dataset niet meer de waarheid — dan blijft
        // hij staan, want het script mag het werk van de docent niet terugdraaien.
        const same =
          options.length === q.options.length &&
          [...options.map(o => o.body)].sort().join('|') === [...q.options].sort().join('|');
        if (!same) { console.log(`  ${at}: opties wijken af — overgeslagen`); skipped++; continue; }

        const already = options.every((o, k) => o.body === q.options[k]) &&
          options[q.correct]?.is_correct === true;
        if (already) continue;

        if (!DRY_RUN) {
          // Eerst alles op false: `question_options_one_correct_idx` staat geen twee ware rijen toe,
          // ook niet halverwege de update.
          await db.patch('question_options', `question_id=eq.${dbQuestion.id}`, { is_correct: false });
          for (const [k, o] of options.entries()) {
            await db.patch('question_options', `id=eq.${o.id}`, { body: q.options[k], sort_order: k + 1 });
          }
          await db.patch('question_options', `id=eq.${options[q.correct].id}`, { is_correct: true });
        }
        moved++;
      }
    }
    console.log(`  ${onderdeel} ${number}: klaar`);
  }
  console.log(`\n${moved} vragen herordend, ${skipped} overgeslagen${DRY_RUN ? ' (niets geschreven)' : ''}.`);
}

/* ── entities: &euro; in platte tekst ────────────────────────────────────── */

const ENTITIES = {
  '&euro;': '€', '&eacute;': 'é', '&euml;': 'ë', '&oacute;': 'ó',
  '&ndash;': '–', '&mdash;': '—', '&nbsp;': ' ',
  '&lsquo;': '‘', '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”',
  '&bdquo;': '„', '&quot;': '"', '&#39;': "'", '&amp;': '&',
};
// `&amp;` gaat als laatste, anders wordt `&amp;euro;` eerst een echte euro.
const decode = s =>
  Object.entries(ENTITIES).reduce((acc, [ent, ch]) => acc.split(ent).join(ch), s ?? '');

/** Elke kolom hier wordt als platte tekst gerenderd — nooit een `*_html`-kolom. */
const TEXT_COLUMNS = {
  question_options: ['body'],
  questions: ['prompt', 'explanation'],
  stimuli: ['title', 'intro'],
};

async function entities() {
  let fixed = 0;
  for (const [table, columns] of Object.entries(TEXT_COLUMNS)) {
    for (const column of columns) {
      // `%26` is de `&` in de querystring; PostgREST krijgt dus `like.*&*`. Grof filter, de echte
      // beslissing valt hieronder op de tekst zelf.
      const rows = await db.selectRows(table, `select=id,${column}&${column}=like.*%26*`);
      for (const row of rows) {
        if (!row[column]) continue;
        const next = decode(row[column]);
        if (next === row[column]) continue;
        console.log(`  ${table}.${column} #${row.id}: ${row[column].slice(0, 70)}`);
        if (!DRY_RUN) await db.patch(table, `id=eq.${row.id}`, { [column]: next });
        fixed++;
      }
    }
  }
  console.log(`\n${fixed} velden opgeschoond${DRY_RUN ? ' (niets geschreven)' : ''}.`);
}

await (command === 'spread' ? spread() : entities());
