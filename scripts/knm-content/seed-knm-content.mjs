/**
 * Write the KNM onderdeel's content into a project — the local stack, or the hosted one.
 *
 *   node scripts/knm-content/seed-knm-content.mjs --dry-run     # validate, touch nothing
 *   node scripts/knm-content/seed-knm-content.mjs               # local stack
 *   node scripts/knm-content/seed-knm-content.mjs --production  # the hosted project
 *   node scripts/knm-content/seed-knm-content.mjs --only questions,wordcards
 *
 * The input is `generated/*.json`, exported from the **knm-website production** project by
 * `export-from-knm.mjs`. Production is the source of truth: knm-website's `data/*.ts` files
 * are a snapshot that the docent's admin edits have already moved past.
 *
 * ## The media is mirrored, not linked
 *
 * Every picture and every mp3 is downloaded from knm-website's buckets and re-uploaded into
 * this project's. Pointing an exam item at another project's Storage is the same failure the
 * admin upload route exists to prevent — it breaks silently, months later, with nobody having
 * touched it, and knmoefenen.nl is on a path to being retired. The object path is derived from
 * our own row ids (`knm/<question>/a.mp3`), never copied, so a re-run is a HEAD request and the
 * two projects never share a namespace.
 *
 * ## Everything is keyed by source id, so a re-run corrects rather than duplicates
 *
 * `questions.knm_source_id` does not exist and deliberately is not added: the natural key is
 * (exam, sort_order), which the exporter fixes by ordering on the KNM row id. A re-run deletes
 * this onderdeel's rows and rewrites them. That is safe *because* KNM answers are recorded
 * against `user_question_results.question_id` with ON DELETE CASCADE — see the guard below,
 * which refuses to wipe questions that have recorded answers unless `--force` is passed.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, isLocalUrl, createDb, createStorage } from '../a2-content/lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const GEN = resolve(HERE, 'generated');
const read = (f) => JSON.parse(readFileSync(resolve(GEN, f), 'utf8'));

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };

const production = has('--production');
const dryRun = has('--dry-run');
const force = has('--force');
const only = (opt('--only') ?? 'sections,questions,leren,wordcards').split(',').map(s => s.trim());
const doing = (part) => only.includes(part);

const WORDCARD_IMAGE_BUCKET = 'wordcard-images';
const WORDCARD_AUDIO_BUCKET = 'wordcard-audio';
const QUESTION_IMAGE_BUCKET = 'question-images';
const QUESTION_AUDIO_BUCKET = 'question-audio';

/* ── config ──────────────────────────────────────────────────────────────── */

const env = loadEnv({ production });
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY');
if (production && isLocalUrl(supabaseUrl)) throw new Error('--production resolved to a local URL; check .env.local');
if (!production && !isLocalUrl(supabaseUrl)) throw new Error('No --production but the URL is hosted; refusing to write');

const db = createDb({ supabaseUrl, serviceKey });
const storage = createStorage({ supabaseUrl, serviceKey });

const log = (...a) => console.log(...a);

/**
 * Create a public bucket if it is not there yet.
 *
 * `20260824120000_knm_onderdeel.sql` also inserts `wordcard-images` into `storage.buckets`,
 * and that is the declarative record — but a migration writing to the `storage` schema depends
 * on the role `db push` connects as, and a failure there would surface as every woordkaart
 * picture 404ing long after the run reported success. Doing it here too costs one request and
 * makes the seed self-sufficient: the service key can always create a bucket.
 */
async function ensureBucket(id) {
  const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, name: id, public: true }),
  });
  if (res.ok) { log(`bucket ${id}: created`); return; }
  const body = await res.text();
  // Already there is the normal case on a re-run.
  if (res.status === 409 || /already exists|Duplicate/i.test(body)) return;
  throw new Error(`bucket ${id}: ${res.status} ${body.slice(0, 200)}`);
}

/* ── validation, before any network write ─────────────────────────────────── */

const questions = read('questions.json');
const sections = read('sections.json');
const leren = read('leren_content.json');
const wordcards = read('word_cards.json');
const themes = read('themes.json');

const THEME_BY_NAME = new Map(themes.map(t => [t.quizCategory, t.id]));

function validate() {
  const problems = [];
  const sectionIds = new Set(sections.map(s => s.id));

  for (const s of sections) {
    if (!THEME_BY_NAME.has(s.topic)) problems.push(`section ${s.slug}: unknown thema "${s.topic}"`);
  }
  for (const q of questions) {
    if (!['A', 'B', 'C'].includes(q.correct)) problems.push(`q${q.id}: correct is "${q.correct}"`);
    if (!q.question?.trim()) problems.push(`q${q.id}: empty prompt`);
    if (!q.explanation?.trim()) problems.push(`q${q.id}: empty explanation`);
    for (const k of ['option_a', 'option_b', 'option_c']) {
      if (!q[k]?.trim()) problems.push(`q${q.id}: empty ${k}`);
    }
    if (q.section_id != null && !sectionIds.has(q.section_id)) problems.push(`q${q.id}: unknown section ${q.section_id}`);
    if (q.exam != null && (q.exam < 1 || q.exam > 10)) problems.push(`q${q.id}: exam ${q.exam} out of range`);
  }
  // The format says forty per exam; a short exam would be a warning in admin but here it
  // means the export is incomplete, which is worth failing on before anything is written.
  const perExam = new Map();
  for (const q of questions) if (q.exam != null) perExam.set(q.exam, (perExam.get(q.exam) ?? 0) + 1);
  for (let n = 1; n <= 10; n++) {
    const c = perExam.get(n) ?? 0;
    if (c !== 40) problems.push(`exam ${n}: ${c} questions, expected 40`);
  }
  for (const l of leren) {
    if (!themes.some(t => t.id === l.theme_id)) problems.push(`leren ${l.id}: unknown theme ${l.theme_id}`);
    if (!l.anchor) problems.push(`leren ${l.id}: no anchor`);
  }
  for (const w of wordcards) {
    if (!w.dutch?.trim()) problems.push(`wordcard ${w.id}: no dutch`);
  }
  return problems;
}

const problems = validate();
if (problems.length) {
  console.error(`${problems.length} problemen in de dataset:`);
  for (const p of problems.slice(0, 40)) console.error('  •', p);
  process.exit(1);
}
log(`dataset ok — ${questions.length} vragen, ${sections.length} secties, ${leren.length} lessecties, ${wordcards.length} woordkaarten`);
log(`target: ${supabaseUrl}${dryRun ? '  (DRY RUN)' : ''}`);
if (dryRun) process.exit(0);

/* ── media mirroring ──────────────────────────────────────────────────────── */

let mirrored = 0, reused = 0, missing = 0, retried = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * How many items are mirrored at once.
 *
 * **The hosted project is far less tolerant than the local stack**, and the difference is not
 * marginal: at six workers each firing five uploads in parallel — thirty concurrent — Supabase
 * Storage answered `429 too_many_connections` partway through the questions pass. Locally the
 * same figure is fine, which is exactly why the default has to be the cautious one and the
 * local run can be told to go faster, rather than the other way round.
 *
 * Uploads *within* one item are sequential now too, so this number is the real ceiling on
 * concurrent connections rather than one fifth of it.
 */
const CONCURRENCY = Number(opt('--concurrency') ?? (production ? 3 : 6));

/**
 * Copy one remote object into our bucket at `objectPath` and return *our* URL.
 *
 * Resumable: an object already at that path is reused after a HEAD, so an interrupted run
 * costs a request per file rather than a re-download. A source that 404s returns null and
 * the column is written NULL — a dead URL in the database is worse than a missing one,
 * because the player renders a broken image rather than no image.
 *
 * A 429 or a 5xx is **retried with exponential backoff**, not failed. Rate limiting is the
 * expected response to a few thousand uploads, not an error condition: crashing the whole run
 * on one of them wastes every upload still queued behind it.
 */
async function mirror(sourceUrl, bucket, objectPath, contentType) {
  if (!sourceUrl) return null;
  const already = await storage.existing(bucket, objectPath);
  if (already) { reused++; return already; }

  const res = await fetch(sourceUrl);
  if (!res.ok) { missing++; console.warn(`  ! source ${res.status} ${sourceUrl.slice(0, 90)}`); return null; }
  const buf = Buffer.from(await res.arrayBuffer());
  const type = contentType ?? res.headers.get('content-type') ?? 'application/octet-stream';

  for (let attempt = 0; ; attempt++) {
    try {
      const url = await storage.upload(bucket, objectPath, buf, type);
      mirrored++;
      return url;
    } catch (err) {
      const transient = /\b(429|5\d\d)\b|too_many_connections|SlowDown/i.test(String(err));
      if (!transient || attempt >= 6) throw err;
      retried++;
      // 1s, 2s, 4s … 64s. The cap matters: the tail of a big run is where the limiter bites.
      await sleep(1000 * 2 ** attempt);
    }
  }
}

/** Run `jobs` with a small amount of concurrency — Storage is the bottleneck, not us. */
async function pool(items, worker, size = CONCURRENCY) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await worker(items[idx], idx);
    }
  }));
  return out;
}

const extOf = (url, fallback) => {
  const m = /\.([a-z0-9]{2,4})(?:\?|$)/i.exec(url ?? '');
  return m ? m[1].toLowerCase() : fallback;
};
const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp3: 'audio/mpeg' };

/* ── sections ─────────────────────────────────────────────────────────────── */

/** KNM source section id → our section id. Needed by the questions pass. */
const sectionMap = new Map();

async function seedSections() {
  const existing = await db.selectRows('sections', `topic=eq.knm&select=id,slug`);
  const bySlug = new Map(existing.map(r => [r.slug, r.id]));

  for (const s of sections) {
    const row = {
      topic: 'knm',
      level: null,
      slug: s.slug,
      name_nl: s.name_nl,
      rationale: s.rationale,
      sort_order: s.sort_order,
      theme_id: THEME_BY_NAME.get(s.topic),
    };
    const known = bySlug.get(s.slug);
    if (known) {
      await db.patch('sections', `id=eq.${known}`, row);
      sectionMap.set(s.id, known);
    } else {
      sectionMap.set(s.id, await db.insertOne('sections', row));
    }
  }
  log(`sections: ${sectionMap.size}`);
}

/* ── questions ────────────────────────────────────────────────────────────── */

/**
 * Write the 419 questions and their options, **idempotently**.
 *
 * The first version deleted every KNM question and re-inserted the set. That is the obvious
 * shape and it is wrong here, because the mirrored media is keyed on *our* row ids: a run that
 * died partway (the hosted Storage rate limit did exactly this, after 58 of 419) would come
 * back, hand every question a new id, and orphan every object already uploaded — turning a
 * resumable job into one that gets more expensive each time it fails.
 *
 * So the natural key is honoured instead: **(exam_id, sort_order)**, which the dataset fixes by
 * ordering on the source row id. A question already at that slot is updated in place and keeps
 * its id, so its media stays valid and the HEAD-skip in `mirror` does its job. Only genuinely
 * new slots are inserted.
 */
async function seedQuestions() {
  const exams = await db.selectRows('exams', `skill=eq.knm&select=id,number&order=number`);
  if (exams.length !== 11) throw new Error(`expected 11 KNM exam rows (0..10), found ${exams.length} — run the migration first`);
  const examId = new Map(exams.map(e => [e.number, e.id]));
  const examIds = exams.map(e => e.id).join(',');

  // Ordered by source id so (exam, sort_order) is stable across runs — this is the key the
  // whole resume depends on.
  const ordered = [...questions].sort((a, b) => a.id - b.id);
  const perExam = new Map();
  const wanted = ordered.map(q => {
    const number = q.exam ?? 0;
    const sort = (perExam.get(number) ?? 0) + 1;
    perExam.set(number, sort);
    return {
      src: q,
      row: {
        exam_id: examId.get(number),
        stimulus_id: null,
        section_id: q.section_id == null ? null : sectionMap.get(q.section_id) ?? null,
        sort_order: sort,
        prompt: q.question,
        explanation: q.explanation,
        option_layout: 'text',
        review_status: q.review_status === 'validated' ? 'validated' : 'pending',
        reviewed_at: q.reviewed_at,
      },
    };
  });

  const existing = await db.selectRows('questions', `exam_id=in.(${examIds})&select=id,exam_id,sort_order`);
  const bySlot = new Map(existing.map(r => [`${r.exam_id}:${r.sort_order}`, r.id]));

  // Recorded answers are only at risk where a slot has to be *removed*, which happens if the
  // dataset shrinks. Updating in place cannot lose one, so the guard is scoped to that case
  // rather than firing on every re-run.
  const wantedSlots = new Set(wanted.map(w => `${w.row.exam_id}:${w.row.sort_order}`));
  const orphans = existing.filter(r => !wantedSlots.has(`${r.exam_id}:${r.sort_order}`)).map(r => r.id);
  if (orphans.length) {
    const answered = await db.selectRows(
      'user_question_results',
      `question_id=in.(${orphans.join(',')})&select=id&limit=1`,
    );
    if (answered.length && !force) {
      throw new Error(
        `${orphans.length} KNM questions are no longer in the dataset and at least one has ` +
        `recorded answers. Removing them deletes those answers (ON DELETE CASCADE). ` +
        `Pass --force if that is intended.`,
      );
    }
    await db.remove('questions', `id=in.(${orphans.join(',')})`);
    log(`questions: removed ${orphans.length} slot(s) no longer in the dataset`);
  }

  const items = [];
  const toInsert = [];
  for (const w of wanted) {
    const id = bySlot.get(`${w.row.exam_id}:${w.row.sort_order}`);
    if (id) items.push({ id, src: w.src, row: w.row });
    else toInsert.push(w);
  }

  for (let i = 0; i < toInsert.length; i += 100) {
    const chunk = toInsert.slice(i, i + 100);
    const out = await db.insert('questions', chunk.map(r => r.row));
    // PostgREST returns representation in insert order.
    out.forEach((r, j) => items.push({ id: r.id, src: chunk[j].src, row: chunk[j].row }));
  }
  log(`questions: ${items.length} total (${toInsert.length} new, ${items.length - toInsert.length} reused)`);

  log(`questions: text, options and media (concurrency ${CONCURRENCY}) …`);
  let done = 0;
  await pool(items, async ({ id, src, row }) => {
    // Uploads are sequential within one item: five in parallel × the pool size is what tripped
    // the hosted rate limit, and the pool size alone should be the ceiling.
    const imgExt = extOf(src.image_url, 'jpg');
    const image = await mirror(src.image_url, QUESTION_IMAGE_BUCKET, `knm/${id}.${imgExt}`, TYPES[imgExt]);
    const aq = await mirror(src.audio_question, QUESTION_AUDIO_BUCKET, `knm/${id}/question.mp3`, 'audio/mpeg');
    const a = await mirror(src.audio_a, QUESTION_AUDIO_BUCKET, `knm/${id}/a.mp3`, 'audio/mpeg');
    const b = await mirror(src.audio_b, QUESTION_AUDIO_BUCKET, `knm/${id}/b.mp3`, 'audio/mpeg');
    const c = await mirror(src.audio_c, QUESTION_AUDIO_BUCKET, `knm/${id}/c.mp3`, 'audio/mpeg');

    // One PATCH carrying the text as well as the media, so a reused row also picks up any
    // correction made in the source since the last run.
    await db.patch('questions', `id=eq.${id}`, { ...row, image_url: image, prompt_audio_url: aq });

    // Options are upserted on (question_id, label) — the table's own unique key — so a partial
    // previous run leaves no duplicates and no gaps. Written `is_correct: false` first and the
    // right one flipped after, or the unique partial index `question_options_one_correct_idx`
    // trips mid-write.
    const opts = [
      { label: 'A', sort_order: 1, body: src.option_a, audio_url: a },
      { label: 'B', sort_order: 2, body: src.option_b, audio_url: b },
      { label: 'C', sort_order: 3, body: src.option_c, audio_url: c },
    ].map(o => ({ ...o, question_id: id, is_correct: false }));
    await db.rest('question_options?on_conflict=question_id,label', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(opts),
    });
    await db.patch('question_options', `question_id=eq.${id}&label=eq.${src.correct}`, { is_correct: true });

    if (++done % 50 === 0) log(`  … ${done}/${items.length}`);
  });

  log(`questions: media ${mirrored} gekopieerd, ${reused} hergebruikt, ${missing} ontbrak, ${retried} keer opnieuw geprobeerd`);
}

/* ── leren ────────────────────────────────────────────────────────────────── */

async function seedLeren() {
  const rows = [];
  for (const l of leren) {
    const audio = await mirror(l.audio_url, 'leren-audio', `knm/${l.theme_id}/${l.anchor}.mp3`, 'audio/mpeg');
    rows.push({
      theme_id: l.theme_id,
      skill: 'knm',
      anchor: l.anchor,
      slug: `knm-${l.theme_id}-${l.anchor}`,
      title: l.heading,
      icon: l.icon,
      heading: l.heading,
      subtitle: l.subtitle,
      body_html: l.body_html,
      audio_url: audio,
      audio_script: l.audio_script,
      audio_cues: l.audio_cues,
      sort_order: l.sort_order,
    });
  }
  for (let i = 0; i < rows.length; i += 20) {
    await db.rest('leren_content?on_conflict=theme_id,anchor', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows.slice(i, i + 20)),
    });
  }
  log(`leren: ${rows.length} secties`);
}

/* ── woordkaarten ─────────────────────────────────────────────────────────── */

/**
 * Write the 366 woordkaarten, idempotently — same reasoning as `seedQuestions`.
 *
 * The slot key is **(theme_id, sort_order)**, which is unique across the set where
 * (theme_id, dutch) is not: two cards in one thema share a Dutch headword. Keying on the word
 * would silently merge them into 365 cards.
 */
async function seedWordcards() {
  await ensureBucket(WORDCARD_IMAGE_BUCKET);

  const existing = await db.selectRows('word_cards', 'skill=eq.knm&select=id,theme_id,sort_order');
  const bySlot = new Map(existing.map(r => [`${r.theme_id}:${r.sort_order}`, r.id]));

  const wanted = wordcards.map(w => ({
    src: w,
    row: {
      theme_id: w.theme_id,
      theme_name: w.theme_name,
      skill: 'knm',
      dutch: w.dutch,
      article: w.article,
      plural: w.plural,
      dutch_description: w.dutch_description,
      dutch_example: w.dutch_example,
      translation_en: w.translation_en,
      description_en: w.description_en,
      translation_ar: w.translation_ar,
      description_ar: w.description_ar,
      translation_tr: w.translation_tr,
      description_tr: w.description_tr,
      sort_order: w.sort_order,
    },
  }));

  const wantedSlots = new Set(wanted.map(w => `${w.row.theme_id}:${w.row.sort_order}`));
  const orphans = existing.filter(r => !wantedSlots.has(`${r.theme_id}:${r.sort_order}`)).map(r => r.id);
  if (orphans.length) {
    await db.remove('word_cards', `id=in.(${orphans.join(',')})`);
    log(`woordkaarten: removed ${orphans.length} slot(s) no longer in the dataset`);
  }

  const items = [];
  const toInsert = [];
  for (const w of wanted) {
    const id = bySlot.get(`${w.row.theme_id}:${w.row.sort_order}`);
    if (id) items.push({ id, src: w.src, row: w.row });
    else toInsert.push(w);
  }

  for (let i = 0; i < toInsert.length; i += 100) {
    const chunk = toInsert.slice(i, i + 100);
    const out = await db.insert('word_cards', chunk.map(r => r.row));
    out.forEach((r, j) => items.push({ id: r.id, src: chunk[j].src, row: chunk[j].row }));
  }
  log(`woordkaarten: ${items.length} total (${toInsert.length} new, ${items.length - toInsert.length} reused), media …`);

  let done = 0;
  await pool(items, async ({ id, src, row }) => {
    const imgExt = extOf(src.image_url, 'webp');
    const image = await mirror(src.image_url, WORDCARD_IMAGE_BUCKET, `knm/${id}.${imgExt}`, TYPES[imgExt]);
    const word = await mirror(src.audio_dutch_word, WORDCARD_AUDIO_BUCKET, `knm/${id}/word.mp3`, 'audio/mpeg');
    const sentence = await mirror(src.audio_dutch_sentence, WORDCARD_AUDIO_BUCKET, `knm/${id}/sentence.mp3`, 'audio/mpeg');
    await db.patch('word_cards', `id=eq.${id}`, {
      ...row, image_url: image, audio_dutch_word: word, audio_dutch_sentence: sentence,
    });
    if (++done % 50 === 0) log(`  … ${done}/${items.length}`);
  });
  log(`woordkaarten: media ${mirrored} gekopieerd, ${reused} hergebruikt, ${missing} ontbrak`);
}

/* ── run ──────────────────────────────────────────────────────────────────── */

if (doing('sections')) await seedSections();
if (doing('questions')) { if (!sectionMap.size) await seedSections(); await seedQuestions(); }
if (doing('leren')) await seedLeren();
if (doing('wordcards')) await seedWordcards();

log(`\nklaar — media: ${mirrored} gekopieerd, ${reused} hergebruikt, ${missing} ontbrak, ${retried} retries`);
