import { createAdminClient } from '@/lib/supabase/admin';
import { fetchExamContent, type ExamContent, type QuestionItem, type StimulusItem, type OpenTaskItem } from '@/lib/exam-content';
import { fetchExamsForSkill } from '@/lib/exams';
import { fetchDbFreePractice } from '@/lib/free-practice-db';
import { fetchA2FreePractice } from '@/lib/free-practice';
import { fetchKnmThemeWeakness, fetchSkillWeakness } from '@/lib/vaardigheden-server';
import { MCP_SPREKEN } from '@/lib/features';
import { getSkillAtLevel, isKnm, isSkillSlug, type Level, type OnderdeelSlug } from '@/data/skills';
import type { FreePracticeItem } from '@/data/free-practice';
import { staticKey } from './static-taster';
import type { McpContext, UserContext } from './context';
import { TASTER_LIMIT, canOpenExam, gateFor, onderdeelLabel, tierFor } from './entitlement';
import type { Exercise, ExerciseOption, McqExercise, ToolOutcome, WritingExercise } from './types';

/**
 * De volgende opgave voor deze kandidaat, uit de bestaande vragenbank — zonder sleutel.
 *
 * Drie paden, één per laag (zie `entitlement.ts`):
 *
 *  - **anoniem**: precies de tien proefvragen van `/oefenen/[skill]`, in dezelfde volgorde, uit
 *    `fetchDbFreePractice` (deterministisch, zie het commentaar daar). Welke al uitgedeeld zijn
 *    staat in `mcp_anonymous_usage`; de k-de aanroep krijgt de k-de vraag en de elfde de poort.
 *  - **gekoppeld**: alleen examen 1 (`exams.is_free`). Vragen die de kandidaat de afgelopen dertig
 *    dagen al goed had worden overgeslagen, zodat "nog een" niet dezelfde vraag teruggeeft.
 *  - **module**: examen 1–10. `mode: 'adaptive'` zet de vragen die aan de zwakste taalregels (of
 *    het zwakste KNM-thema) hangen vooraan — dezelfde telling als het vaardighedenpaneel.
 *
 * Wat de kandidaat terugkrijgt is gestript: `is_correct`, `explanation` en `model_answer` blijven
 * op de server. De uitleg komt pas na het antwoord, via `answers.ts`.
 */
export type ExerciseRequest = {
  level: Level | null;
  onderdeel: OnderdeelSlug;
  mode: 'next' | 'adaptive';
  examNumber: number | null;
};

const RECENT_DAYS = 30;

export async function nextExercise(ctx: McpContext, req: ExerciseRequest): Promise<ToolOutcome<Exercise>> {
  const { level, onderdeel } = req;

  if (onderdeel === 'spreken' && !MCP_SPREKEN) return { ok: false, gate: gateFor('unavailable', level, onderdeel) };
  if (isSkillSlug(onderdeel) && level && getSkillAtLevel(level, onderdeel)?.itemCount === null) {
    // B1 Luisteren: geen inhoud en geen geverifieerd format — zie data/skills.ts.
    return { ok: false, gate: gateFor('unavailable', level, onderdeel) };
  }

  if (ctx.kind === 'anonymous') {
    if (onderdeel === 'schrijven' || onderdeel === 'spreken') return { ok: false, gate: gateFor('login_required', level, onderdeel) };
    return tasterExercise(ctx.subjectHash, level, onderdeel);
  }

  const tier = tierFor(ctx.meta, level, onderdeel);
  const exams = await fetchExamsForSkill(level, onderdeel);
  const allowed = exams.filter(e => e.number > 0 && canOpenExam(tier, e.is_free));
  if (!allowed.length) return { ok: false, gate: gateFor('module_required', level, onderdeel) };

  if (req.examNumber !== null) {
    const wanted = exams.find(e => e.number === req.examNumber);
    if (!wanted) return { ok: false, gate: gateFor('unavailable', level, onderdeel) };
    if (!canOpenExam(tier, wanted.is_free)) return { ok: false, gate: gateFor('module_required', level, onderdeel) };
  }
  const candidates = req.examNumber !== null ? allowed.filter(e => e.number === req.examNumber) : allowed;

  if (onderdeel === 'schrijven') return writingExercise(ctx, level as Level, candidates.map(e => e.number));

  const recentlyCorrect = await recentlyCorrectIds(ctx);
  const adaptive = req.mode === 'adaptive' && tier === 'module';

  // Eén examen tegelijk laden tot er een vraag over is; adaptief heeft het hele bereik nodig om te
  // kunnen sorteren, dus dan alles (hooguit tien examens).
  const numbers = candidates.map(e => e.number);
  const pool: Flat[] = [];
  if (adaptive) {
    const contents = await Promise.all(numbers.map(n => fetchExamContent(level, onderdeel, n)));
    for (const c of contents) if (c) pool.push(...flatten(c));
  } else {
    for (const n of numbers) {
      const c = await fetchExamContent(level, onderdeel, n);
      if (!c) continue;
      const fresh = flatten(c).filter(f => !recentlyCorrect.has(f.question.id));
      if (fresh.length) { pool.push(...fresh); break; }
    }
  }

  let fresh = pool.filter(f => !recentlyCorrect.has(f.question.id));
  if (!fresh.length) fresh = pool; // alles al eens goed: begin opnieuw in plaats van niets te geven
  if (!fresh.length) return { ok: false, gate: gateFor('unavailable', level, onderdeel) };

  const pick = adaptive ? await adaptivePick(ctx, level, onderdeel, fresh) : fresh[0];
  return { ok: true, data: toMcq(pick, level, onderdeel) };
}

// ---------------------------------------------------------------------------
// Anoniem: de taster
// ---------------------------------------------------------------------------

type Keyed = { item: FreePracticeItem; key: number };

/**
 * De tien proefvragen met een stabiele sleutel: het `questions.id` als ze uit de database komen
 * (`a2-lezen-123` → 123), of de negatieve statische sleutel als de site op de statische A2-set
 * terugvalt (zie `static-taster.ts`). De sleutel is wat in `mcp_anonymous_usage` staat en wat
 * `submit_answer` terugkrijgt, dus hij moet in beide gevallen eenduidig zijn.
 */
async function tasterItems(level: Level | null, onderdeel: OnderdeelSlug): Promise<Keyed[] | null> {
  if (level === 'a2' && isSkillSlug(onderdeel)) {
    const set = await fetchA2FreePractice(onderdeel);
    if (!set) return null;
    if (set.source === 'static') {
      return set.items.map((item, i) => ({ item, key: staticKey(onderdeel, i) ?? -(i + 1) })).filter(k => k.key < 0);
    }
    return set.items.map(item => ({ item, key: dbQuestionId(item) })).filter((k): k is Keyed => k.key !== null);
  }
  const items = await fetchDbFreePractice(level, onderdeel);
  return items?.map(item => ({ item, key: dbQuestionId(item) })).filter((k): k is Keyed => k.key !== null) ?? null;
}

function dbQuestionId(item: FreePracticeItem): number | null {
  const last = Number(item.id.split('-').pop());
  return Number.isInteger(last) && last > 0 ? last : null;
}

async function tasterExercise(subjectHash: string | null, level: Level | null, onderdeel: OnderdeelSlug): Promise<ToolOutcome<Exercise>> {
  const items = await tasterItems(level, onderdeel);
  if (!items?.length) return { ok: false, gate: gateFor('unavailable', level, onderdeel) };

  // Zonder onderwerp valt er niets te tellen; dan altijd de eerste vraag en nooit meer.
  if (!subjectHash) return { ok: true, data: tasterToMcq(items[0].item, items[0].key, level, onderdeel, TASTER_LIMIT - 1) };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('mcp_anonymous_usage')
    .select('served_question_ids')
    .eq('subject_hash', subjectHash)
    .eq('onderdeel', onderdeel)
    .eq('level', level ?? '')
    .maybeSingle();
  const served = new Set<number>(((row as { served_question_ids?: number[] } | null)?.served_question_ids ?? []));

  const next = items.find(x => !served.has(x.key));
  if (!next) return { ok: false, gate: gateFor('taster_exhausted', level, onderdeel) };

  const { data: allowed, error } = await admin.rpc('mcp_anon_serve', {
    p_subject_hash: subjectHash,
    p_onderdeel: onderdeel,
    p_level: level ?? '',
    p_question_id: next.key,
    p_limit: TASTER_LIMIT,
  });
  // Faal dicht: als de teller niet werkt, deel niets uit.
  if (error || allowed !== true) return { ok: false, gate: gateFor('taster_exhausted', level, onderdeel) };

  return { ok: true, data: tasterToMcq(next.item, next.key, level, onderdeel, TASTER_LIMIT - served.size - 1) };
}

function tasterToMcq(item: FreePracticeItem, key: number, level: Level | null, onderdeel: OnderdeelSlug, remaining: number): McqExercise {
  const options: ExerciseOption[] = [
    { label: 'A', body: item.optionA, imageUrls: [], audioUrl: item.optionAudio?.A ?? null },
    { label: 'B', body: item.optionB, imageUrls: [], audioUrl: item.optionAudio?.B ?? null },
    { label: 'C', body: item.optionC, imageUrls: [], audioUrl: item.optionAudio?.C ?? null },
    ...(item.optionD ? [{ label: 'D' as const, body: item.optionD, imageUrls: [], audioUrl: item.optionAudio?.D ?? null }] : []),
  ];
  return {
    kind: 'mcq',
    questionId: key,
    level,
    onderdeel,
    onderdeelLabel: onderdeelLabel(level, onderdeel),
    examNumber: 1,
    section: item.subSkill || null,
    instruction: item.stimulusIntro || null,
    stimulus: item.stimulusHtml
      ? { kind: 'text', title: null, html: item.stimulusHtml }
      : item.audioSrc
        ? { kind: 'audio', url: item.audioSrc, introAudioUrl: null }
        : null,
    question: item.question,
    questionImageUrl: item.questionImage ?? null,
    questionAudioUrl: item.questionAudioSrc ?? null,
    options,
    tasterRemaining: Math.max(0, remaining),
  };
}

// ---------------------------------------------------------------------------
// Gekoppeld en module: de echte examens
// ---------------------------------------------------------------------------

type Flat = { question: QuestionItem; stimulus: StimulusItem | null; content: ExamContent };

/** Alleen vragen die het widget kan tonen: minstens drie opties met tekst of een plaatje. */
function renderable(q: QuestionItem): boolean {
  const usable = q.options.filter(o => (o.body && o.body.trim()) || (o.image_urls && o.image_urls.length));
  return usable.length >= 3 && usable.length === q.options.length;
}

function flatten(content: ExamContent): Flat[] {
  const out: Flat[] = [];
  for (const q of content.standalone) if (renderable(q)) out.push({ question: q, stimulus: null, content });
  for (const s of content.stimuli) for (const q of s.questions) if (renderable(q)) out.push({ question: q, stimulus: s, content });
  return out;
}

/**
 * Wat we niet nog eens voorleggen: alles wat de afgelopen dertig dagen goed was, plus alles wat
 * vandaag al beantwoord is — ook fout. "Nog een vraag" na een fout antwoord moet een ándere vraag
 * zijn; de foute komt vanzelf terug wanneer de dag om is.
 */
async function recentlyCorrectIds(ctx: UserContext): Promise<Set<number>> {
  const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString();
  const today = new Date(Date.now() - 86_400_000).toISOString();
  const { data } = await ctx.db
    .from('user_question_results')
    .select('question_id, was_correct, answered_at')
    .eq('user_id', ctx.userId)
    .gte('answered_at', since)
    .limit(2000);
  const rows = (data ?? []) as { question_id: number | null; was_correct: boolean; answered_at: string }[];
  return new Set(rows.filter(r => r.was_correct || r.answered_at >= today).map(r => r.question_id).filter((x): x is number => x !== null));
}

/**
 * Zwakste eerst. Voor de taalonderdelen via de conceptstatistiek van het vaardighedenpaneel
 * (`question_concepts`), voor KNM via het thema van de sectie. Zonder meetbare zwakte: de eerste.
 */
async function adaptivePick(ctx: UserContext, level: Level | null, onderdeel: OnderdeelSlug, pool: Flat[]): Promise<Flat> {
  const admin = createAdminClient();
  const ids = pool.map(f => f.question.id);

  if (isKnm(onderdeel) || level === null) {
    const weakness = await fetchKnmThemeWeakness(ctx.userId);
    const themeScore = new Map<number, number>();
    for (const row of weakness?.rows ?? []) {
      const id = Number(row.key.replace('thema-', ''));
      if (Number.isInteger(id) && row.pct !== null) themeScore.set(id, 100 - row.pct);
    }
    if (!themeScore.size) return pool[0];
    const { data: sections } = await admin.from('sections').select('id, theme_id').eq('topic', 'knm');
    const themeOf = new Map(((sections ?? []) as { id: number; theme_id: number | null }[]).map(s => [s.id, s.theme_id]));
    return [...pool].sort((a, b) => scoreTheme(b) - scoreTheme(a))[0];

    function scoreTheme(f: Flat): number {
      const theme = f.question.section_id !== null ? themeOf.get(f.question.section_id) : null;
      return theme != null ? (themeScore.get(theme) ?? 0) : 0;
    }
  }

  const weakness = await fetchSkillWeakness(ctx.userId, level, onderdeel);
  const stats = weakness?.conceptStats;
  if (!stats?.size) return pool[0];

  const { data: tags } = await admin.from('question_concepts').select('question_id, concept_id').in('question_id', ids);
  const weight = new Map<number, number>();
  for (const t of (tags ?? []) as { question_id: number; concept_id: number }[]) {
    const s = stats.get(t.concept_id);
    if (!s || s.seen === 0) continue;
    weight.set(t.question_id, (weight.get(t.question_id) ?? 0) + (1 - s.correct / s.seen));
  }
  if (!weight.size) return pool[0];
  return [...pool].sort((a, b) => (weight.get(b.question.id) ?? 0) - (weight.get(a.question.id) ?? 0))[0];
}

function toMcq(f: Flat, level: Level | null, onderdeel: OnderdeelSlug): McqExercise {
  const { question: q, stimulus: s, content } = f;
  const sectionId = s?.section_id ?? q.section_id;
  const options: ExerciseOption[] = [...q.options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(o => ({ label: o.label as ExerciseOption['label'], body: o.body, imageUrls: o.image_urls ?? [], audioUrl: o.audio_url }));

  let stimulus: McqExercise['stimulus'] = null;
  if (s?.kind === 'text' && s.body_html) stimulus = { kind: 'text', title: s.title, html: s.body_html };
  else if (s?.kind === 'audio' && s.audio_url) stimulus = { kind: 'audio', url: s.audio_url, introAudioUrl: s.intro_audio_url };
  else if (s?.kind === 'image' && s.image_url) stimulus = { kind: 'image', url: s.image_url, alt: s.image_alt };

  return {
    kind: 'mcq',
    questionId: q.id,
    level,
    onderdeel,
    onderdeelLabel: onderdeelLabel(level, onderdeel),
    examNumber: content.exam.number,
    section: sectionId !== null ? (content.sectionNames[sectionId] ?? null) : null,
    instruction: s?.intro ?? null,
    stimulus,
    question: q.prompt,
    questionImageUrl: q.image_url,
    questionAudioUrl: q.prompt_audio_url,
    options,
  };
}

// ---------------------------------------------------------------------------
// Schrijven
// ---------------------------------------------------------------------------

async function writingExercise(ctx: UserContext, level: Level, numbers: number[]): Promise<ToolOutcome<Exercise>> {
  const { data: done } = await ctx.db
    .from('open_submissions')
    .select('task_id')
    .eq('user_id', ctx.userId)
    .neq('status', 'submitted')
    .limit(2000);
  const graded = new Set(((done ?? []) as { task_id: number }[]).map(r => r.task_id));

  let fallback: { task: OpenTaskItem; number: number } | null = null;
  for (const n of numbers) {
    const content = await fetchExamContent(level, 'schrijven', n);
    if (!content) continue;
    for (const task of content.tasks) {
      if (task.task_type === 'speaking') continue;
      if (!fallback) fallback = { task, number: n };
      if (!graded.has(task.id)) return { ok: true, data: toWriting(task, level, n) };
    }
  }
  if (fallback) return { ok: true, data: toWriting(fallback.task, level, fallback.number) };
  return { ok: false, gate: gateFor('unavailable', level, 'schrijven') };
}

function toWriting(t: OpenTaskItem, level: Level, examNumber: number): WritingExercise {
  return {
    kind: 'writing',
    taskId: t.id,
    level,
    onderdeel: 'schrijven',
    onderdeelLabel: onderdeelLabel(level, 'schrijven'),
    examNumber,
    taskType: t.task_type,
    title: t.title,
    promptHtml: t.prompt_html,
    bulletPoints: t.bullet_points ?? [],
    email: t.task_type === 'email' ? { to: t.email_to, cc: t.email_cc, subject: t.email_subject } : null,
    greeting: t.greeting,
    closing: t.closing,
    minSentences: t.min_sentences,
    images: (t.images ?? []).map(i => ({ url: i.image_url, caption: i.caption, alt: i.alt_text })),
  };
}
