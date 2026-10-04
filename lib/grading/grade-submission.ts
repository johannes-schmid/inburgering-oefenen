import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { rubricCategory, type Rubric, type RubricCriterion } from '@/lib/rubrics';
import type { Level } from '@/data/skills';
import { gradeOpenAnswer, type FewShotExample, type GradeTask } from '@/lib/ai/grade';
import { transcribeRecording } from '@/lib/ai/transcribe';
import { providerOf, recordAiUsage } from '@/lib/ai/usage';
import { checkGradingAllowed, coversSkill, logGradeAttempt } from '@/lib/grading-limits';

/**
 * De kern van het nakijken van één open inzending, los van HTTP.
 *
 * Tot 04-10 stond dit in `app/api/grade-open/route.ts`. De ChatGPT-app (`lib/mcp/writing.ts`)
 * kijkt dezelfde inzendingen na en mag dat niet via een HTTP-rondje naar zichzelf doen, dus de
 * logica staat hier en de route is nog alleen de vertaling van en naar JSON. Gedrag is
 * ongewijzigd — de uitgebreide toelichting per stap staat bij de stap zelf.
 *
 * De aanroeper geeft zijn eigen Supabase-client mee (`db`): de cookie-client van de route, of de
 * token-client van de MCP-laag. In beide gevallen draagt die de JWT van de kandidaat, dus RLS is
 * van kracht; de service-sleutel wordt alleen gebruikt waar dat uitdrukkelijk moet (de rubriek,
 * de opname, de cijfers).
 */

const MAX_GRADES_PER_TASK = 3;
const MAX_GRADES_PER_TASK_PAID = 25;
const FEW_SHOT_LIMIT = 4;
const RECORDING_BUCKET = 'speaking-submissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = SupabaseClient<any, any, any>;

type SubmissionRow = {
  id: number;
  user_id: string;
  exam_id: number | null;
  task_id: number;
  attempt_id: number | null;
  answer_text: string | null;
  answer_json: Record<string, unknown> | null;
  audio_url: string | null;
  transcript: string | null;
  audio_seconds: number | null;
  speech_signals: Record<string, unknown> | null;
  ai_result: unknown;
  status: 'submitted' | 'ai_graded' | 'teacher_reviewed';
};

const TASK_SELECT =
  'id, skill, task_type, title, prompt_html, bullet_points, email_to, email_cc, email_subject, ' +
  'greeting, closing, min_sentences, form_schema, image_usage, max_record_seconds, ' +
  'model_answer, rubric_id, ' +
  // The task's level, via its exam. `open_tasks` has no level column of its own — the exam is
  // the single place it is recorded, and grading must not guess it.
  'exams!inner(level), ' +
  'open_task_images(sort_order, caption, alt_text, group_label)';

export type GradeCriterion = {
  criterion_key: string;
  score: number;
  feedback: string | null;
  source: 'ai' | 'teacher';
};

export type GradeResponse = {
  status: 'submitted' | 'ai_graded' | 'teacher_reviewed';
  overall: string | null;
  tips: string[];
  transcript: string | null;
  warning?: string | null;
  answerText: string | null;
  highlights: unknown[];
  criteria: GradeCriterion[];
  rubric: { id: number; version: number; criteria: RubricCriterion[] } | null;
};

export type GradeOutcome =
  | { ok: true; result: GradeResponse }
  | {
      ok: false;
      status: 403 | 404 | 409 | 429 | 402 | 502;
      error: string;
      code?: string;
      reason?: 'paywall' | 'rate';
      freeLimit?: number;
      detail?: string;
    };

export type GradeCaller = {
  id: string;
  email?: string | null;
  user_metadata: Record<string, unknown> | null | undefined;
};

export async function gradeSubmission(opts: {
  db: Db;
  submissionId: number;
  user: GradeCaller;
  ip: string | null;
  force?: boolean;
}): Promise<GradeOutcome> {
  const { db: supabase, submissionId, user, ip } = opts;

  const { data: subRaw, error: subErr } = await supabase
    .from('open_submissions')
    .select(
      'id, user_id, exam_id, task_id, attempt_id, answer_text, answer_json, audio_url, ' +
        'transcript, audio_seconds, speech_signals, ai_result, status'
    )
    .eq('id', submissionId)
    .maybeSingle();

  if (subErr || !subRaw) {
    return { ok: false, status: 404, error: 'Inzending niet gevonden.' };
  }
  const submission = subRaw as unknown as SubmissionRow;

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email ?? '')
    .maybeSingle();
  const isAdmin = Boolean(adminRow);

  if (submission.user_id !== user.id && !isAdmin) {
    return { ok: false, status: 403, error: 'Geen toegang tot deze inzending.' };
  }

  const force = Boolean(opts.force) && isAdmin;

  // Already graded: hand back what is stored rather than paying to produce it twice.
  if (submission.status !== 'submitted' && !force) {
    return { ok: true, result: await storedResult(supabase, submission) };
  }

  const { data: taskRaw, error: taskErr } = await supabase
    .from('open_tasks')
    .select(TASK_SELECT)
    .eq('id', submission.task_id)
    .maybeSingle();

  if (taskErr || !taskRaw) {
    return { ok: false, status: 404, error: 'Opdracht niet gevonden.' };
  }

  type RawTask = Omit<GradeTask, 'images'> & {
    skill: 'schrijven' | 'spreken';
    exams: { level: Level };
    rubric_id: number | null;
    open_task_images: GradeTask['images'];
  };
  const raw = taskRaw as unknown as RawTask;
  const task: GradeTask = { ...raw, images: raw.open_task_images ?? [] };

  // Rate limit on completed grades for this task, not on submission rows: a candidate who saves a
  // draft three times without grading is not abusing anything.
  //
  // Scoped to the attempt when there is one, and to (user, task) when there is not. `attempt_id` is
  // nullable — `startExamAttempt` can fail, and the anonymous-taster path never sets it — and an
  // `.eq('attempt_id', null)` would have matched nothing, so the cap silently did not exist for
  // exactly the submissions least likely to be well-formed.
  const paidModule = coversSkill(user.user_metadata, raw.exams.level, raw.skill);
  const perTaskCap = paidModule ? MAX_GRADES_PER_TASK_PAID : MAX_GRADES_PER_TASK;

  if (!force) {
    let query = supabase
      .from('open_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('task_id', submission.task_id)
      .neq('status', 'submitted');

    query =
      submission.attempt_id != null
        ? query.eq('attempt_id', submission.attempt_id)
        : query.eq('user_id', submission.user_id).is('attempt_id', null);

    const { count } = await query;

    if ((count ?? 0) >= perTaskCap) {
      return {
        ok: false,
        status: 429,
        error: `Je kunt deze opdracht maximaal ${perTaskCap} keer laten nakijken.`,
        code: 'grade_limit',
      };
    }
  }

  // ── Spend controls ──────────────────────────────────────────────────────────────────────────
  // After we know the skill, before any provider is touched. Admins re-grading from the review inbox
  // are exempt: that is the docent doing her job, not a candidate consuming a free tier.
  if (!isAdmin) {
    const verdict = await checkGradingAllowed({
      userId: user.id,
      ip: ip ?? 'unknown',
      skill: raw.skill,
      level: raw.exams.level,
      meta: user.user_metadata,
    });

    if (!verdict.allowed) {
      return {
        ok: false,
        // 402 for "pay to continue" so the client can tell a paywall from a cooldown without
        // string-matching the message.
        status: verdict.reason === 'paywall' ? 402 : 429,
        error: verdict.message,
        code: verdict.code,
        reason: verdict.reason,
        freeLimit: verdict.freeLimit,
      };
    }

    // Logged before the call, not after: the providers bill for the attempt, so the window must
    // count attempts. Logging on success would let a loop of failures run free.
    await logGradeAttempt(user.id, ip ?? 'unknown', raw.skill);
  }

  const rubric = await resolveRubric(raw.exams.level, raw.skill, raw.rubric_id, task);
  if (!rubric) {
    const message = `Er is nog geen actieve rubriek voor "${rubricCategory(task)}".`;
    await supabase.from('open_submissions').update({ grade_error: message }).eq('id', submission.id);
    return { ok: false, status: 409, error: message, code: 'no_rubric' };
  }

  // One id per nakijkactie, shared by every provider call it makes. A Spreken check is Scribe plus
  // the grading model, and the cost the owner cares about is the pair — see `lib/ai/usage.ts`.
  const requestId = `grade-${submission.id}-${Date.now()}`;

  try {
    // ---- Spreken: transcribe first, and persist that before grading. A transcript is worth
    // keeping even if the grader then fails; re-running should not re-pay for Scribe.
    let transcript = submission.transcript;
    let signals = submission.speech_signals as never;
    let audioSeconds = submission.audio_seconds;
    let audio: Uint8Array | null = null;
    let transcriptionNote: string | null = null;

    if (submission.audio_url) {
      // Read the object with the service key, not the caller's session: the bucket's only SELECT
      // policy is owner-only, and the admin's force path grades someone else's recording.
      const { data: file, error: dlErr } = await createAdminClient()
        .storage.from(RECORDING_BUCKET)
        .download(submission.audio_url);
      if (dlErr || !file) throw new Error(`Opname niet leesbaar: ${dlErr?.message ?? 'onbekend'}`);

      audio = new Uint8Array(await file.arrayBuffer());

      if (transcript == null || force) {
        // Transcription failure is NOT fatal: the grading model hears the recording itself. It is
        // recorded in `grade_error` so the docent's inbox shows the grade lacked its signals.
        try {
          const result = await transcribeRecording(audio, `${submission.task_id}.wav`);
          await recordAiUsage({
            kind: 'transcribe',
            provider: 'elevenlabs',
            model: 'scribe_v2',
            requestId,
            skill: raw.skill,
            level: raw.exams.level,
            submissionId: submission.id,
            audioSeconds: result.audio_duration_secs ?? audioSeconds ?? null,
          });
          transcript = result.text;
          signals = result.signals as never;
          audioSeconds = audioSeconds ?? (Math.round(result.audio_duration_secs ?? 0) || null);

          await supabase
            .from('open_submissions')
            .update({ transcript, speech_signals: signals, audio_seconds: audioSeconds })
            .eq('id', submission.id);
        } catch (err) {
          transcriptionNote = `Transcriptie mislukt: ${err instanceof Error ? err.message : 'onbekend'}`;
          console.warn('[grade-open] transcription failed, grading from audio only', transcriptionNote);
        }
      }
    }

    const examples = await fetchFewShot(supabase, rubric.level, raw.skill, task);

    const { usage, ...result } = await gradeOpenAnswer({
      rubric,
      task,
      answer: {
        answer_text: submission.answer_text,
        answer_json: submission.answer_json,
        transcript,
        audio_seconds: audioSeconds,
        speech_signals: signals,
        audio,
      },
      examples,
    });

    await recordAiUsage({
      kind: audio ? 'grade_audio' : 'grade_text',
      provider: providerOf(usage.model),
      model: usage.model,
      requestId,
      skill: raw.skill,
      level: raw.exams.level,
      submissionId: submission.id,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      audioSeconds: audio ? audioSeconds : null,
      billedUsd: usage.billedUsd,
      generationId: usage.generationId,
    });

    await supabase
      .from('open_submissions')
      .update({
        ai_result: result,
        rubric_version: rubric.version,
        status: submission.status === 'teacher_reviewed' ? 'teacher_reviewed' : 'ai_graded',
        grade_error: transcriptionNote,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    // One row per criterion. `UNIQUE (submission_id, criterion_key, source)` makes a re-grade an
    // update in place, and leaves any teacher row for the same criterion untouched beside it.
    const rows = result.criteria.map(c => ({
      submission_id: submission.id,
      rubric_id: rubric.id,
      rubric_version: rubric.version,
      criterion_key: c.key,
      score: c.score,
      feedback: c.feedback,
      source: 'ai' as const,
    }));

    // Service key, deliberately: `open_criterion_scores` has no INSERT policy for the owner — a
    // candidate must never be able to write their own marks. Ownership was checked above.
    const { error: scoreErr } = await createAdminClient()
      .from('open_criterion_scores')
      .upsert(rows, { onConflict: 'submission_id,criterion_key,source' });

    if (scoreErr) throw new Error(`Cijfers opslaan mislukt: ${scoreErr.message}`);

    return {
      ok: true,
      result: {
        status: 'ai_graded',
        overall: result.overall,
        tips: result.tips,
        transcript,
        warning: transcriptionNote,
        // The highlights carry offsets into the answer text, so the text travels with them — for
        // Spreken that is the transcript, which the client did not have until now.
        answerText: submission.answer_text ?? transcript ?? null,
        highlights: result.highlights,
        criteria: rows.map(r => ({
          criterion_key: r.criterion_key,
          score: r.score,
          feedback: r.feedback,
          source: r.source,
        })),
        rubric: { id: rubric.id, version: rubric.version, criteria: rubric.criteria },
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nakijken mislukt.';
    // Recorded on the row so a stuck answer is visible in /admin/beoordeling.
    await supabase
      .from('open_submissions')
      .update({ grade_error: message.slice(0, 1000) })
      .eq('id', submission.id);
    console.error('[grade-open]', submissionId, message);
    return { ok: false, status: 502, error: 'Nakijken is niet gelukt.', detail: message };
  }
}

/**
 * The task's own rubric if it names one, else the live rubric for its category.
 *
 * Reads with the service key: `rubrics` has no non-admin SELECT policy, on purpose — the criteria
 * and anchors are a scoring key. The rubric goes into the grading prompt, not to the candidate.
 */
async function resolveRubric(
  level: Level,
  skill: 'schrijven' | 'spreken',
  rubricId: number | null,
  task: GradeTask
): Promise<Rubric | null> {
  const supabase = createAdminClient();
  const cols = 'id, level, skill, task_type, version, criteria, system_prompt, active';

  if (rubricId != null) {
    const { data } = await supabase.from('rubrics').select(cols).eq('id', rubricId).maybeSingle();
    // An explicitly linked rubric from the wrong level is a mis-authored task, not a fallback case.
    if (data) {
      const r = normaliseRubric(data);
      if (r.level !== level) return null;
      return r;
    }
  }

  // `rubrics_one_active_idx` is UNIQUE (level, skill, task_type) WHERE active, so this is one row.
  const { data } = await supabase
    .from('rubrics')
    .select(cols)
    .eq('level', level)
    .eq('skill', skill)
    .eq('task_type', rubricCategory(task))
    .eq('active', true)
    .maybeSingle();

  return data ? normaliseRubric(data) : null;
}

function normaliseRubric(row: unknown): Rubric {
  const r = row as Rubric & { criteria: unknown };
  return {
    ...r,
    criteria: (Array.isArray(r.criteria) ? r.criteria : []) as RubricCriterion[],
  };
}

/**
 * Few-shot examples: only the ones the docent promoted, and only from this level. The others are
 * the evaluation set; an exemplar from the other level teaches the wrong anchors silently.
 */
async function fetchFewShot(
  supabase: Db,
  level: Level,
  skill: 'schrijven' | 'spreken',
  task: GradeTask
): Promise<FewShotExample[]> {
  const { data } = await supabase
    .from('grading_examples')
    .select('answer_text, transcript, teacher_result, notes')
    .eq('level', level)
    .eq('skill', skill)
    .eq('task_type', rubricCategory(task))
    .eq('use_as_fewshot', true)
    .order('created_at', { ascending: false })
    .limit(FEW_SHOT_LIMIT);

  return (data ?? []) as unknown as FewShotExample[];
}

/** The stored grade, for an idempotent repeat call. */
async function storedResult(supabase: Db, submission: SubmissionRow): Promise<GradeResponse> {
  const { data: scores } = await supabase
    .from('open_criterion_scores')
    .select('criterion_key, score, feedback, source, rubric_id')
    .eq('submission_id', submission.id);

  const rows = (scores ?? []) as {
    criterion_key: string;
    score: number;
    feedback: string | null;
    source: 'ai' | 'teacher';
    rubric_id: number | null;
  }[];

  const rubricId = rows.find(r => r.rubric_id != null)?.rubric_id ?? null;
  let rubric: Rubric | null = null;
  if (rubricId != null) {
    const { data } = await createAdminClient()
      .from('rubrics')
      .select('id, skill, task_type, version, criteria, system_prompt, active')
      .eq('id', rubricId)
      .maybeSingle();
    if (data) rubric = normaliseRubric(data);
  }

  const ai = submission.ai_result as { overall?: string; tips?: string[]; highlights?: unknown[] } | null;

  return {
    status: submission.status,
    overall: ai?.overall ?? null,
    tips: ai?.tips ?? [],
    transcript: submission.transcript,
    answerText: submission.answer_text ?? submission.transcript ?? null,
    highlights: Array.isArray(ai?.highlights) ? ai.highlights : [],
    criteria: rows.map(r => ({
      criterion_key: r.criterion_key,
      score: r.score,
      feedback: r.feedback,
      source: r.source,
    })),
    rubric: rubric ? { id: rubric.id, version: rubric.version, criteria: rubric.criteria } : null,
  };
}
