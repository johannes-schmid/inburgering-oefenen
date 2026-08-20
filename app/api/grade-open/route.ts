import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rubricCategory, type Rubric, type RubricCriterion } from '@/lib/rubrics';
import type { Level } from '@/data/skills';
import { gradeOpenAnswer, type FewShotExample, type GradeTask } from '@/lib/ai/grade';
import { transcribeRecording } from '@/lib/ai/transcribe';
import { planFromMetadata } from '@/lib/entitlements';
import { checkGradingAllowed, clientIp, logGradeAttempt } from '@/lib/grading-limits';

/**
 * Grade one open submission against the docent's rubric.
 *
 * Called per answer, right after the candidate presses "Nakijken" — the owner chose per-answer
 * feedback over an end-of-exam batch, so the submission row exists before this runs and the
 * candidate keeps their answer even if grading fails.
 *
 * ## Why this is a server route and not a client call
 * `rubrics` has **no non-admin SELECT policy** at all (see the baseline migration), so the
 * criteria are unreachable from the browser by design — the anchors describe exactly what earns a
 * 3, which is a scoring key. `open_tasks.model_answer` is likewise never sent to the browser.
 *
 * ## Ownership is checked by hand, and RLS is *also* in force
 * `lib/supabase/server.ts` builds its cookie client with the service key, but `@supabase/ssr` sends
 * the signed-in user's JWT as `Authorization`, and that overrides the key's role — so on an
 * authenticated request PostgREST runs as `authenticated` and RLS applies. (The service key only
 * takes effect when there is no session, which is why `fetchExamContent` can read unpublished rows
 * on a public page.)
 *
 * Both layers are deliberate. RLS means a non-owner gets 404 before the explicit check runs; the
 * explicit `user_id` comparison is what still holds when the caller *is* an admin, whose SELECT
 * policy lets them read every submission. Do not remove either on the assumption the other covers
 * it — and note the consequence for storage: an admin cannot read the recording through this
 * client, because that bucket's policy is owner-only. See the download below.
 *
 * ## Abuse guard
 * Every call spends money on two providers. Three grades per (attempt, task) is enough to cover a
 * genuine retry and a revision after feedback; past that it is a loop. Admins can pass `force` to
 * re-grade from the review inbox.
 */

const MAX_GRADES_PER_TASK = 3;
const FEW_SHOT_LIMIT = 4;
const RECORDING_BUCKET = 'speaking-submissions';

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

export async function POST(request: Request) {
  let body: { submissionId?: number; force?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const submissionId = Number(body.submissionId);
  if (!Number.isFinite(submissionId)) {
    return NextResponse.json({ error: 'submissionId ontbreekt.' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  const { data: subRaw, error: subErr } = await supabase
    .from('open_submissions')
    .select(
      'id, user_id, exam_id, task_id, attempt_id, answer_text, answer_json, audio_url, ' +
        'transcript, audio_seconds, speech_signals, ai_result, status'
    )
    .eq('id', submissionId)
    .maybeSingle();

  if (subErr || !subRaw) {
    return NextResponse.json({ error: 'Inzending niet gevonden.' }, { status: 404 });
  }
  const submission = subRaw as unknown as SubmissionRow;

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email ?? '')
    .maybeSingle();
  const isAdmin = Boolean(adminRow);

  if (submission.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Geen toegang tot deze inzending.' }, { status: 403 });
  }

  const force = Boolean(body.force) && isAdmin;

  // Already graded: hand back what is stored rather than paying to produce it twice.
  if (submission.status !== 'submitted' && !force) {
    return NextResponse.json(await storedResult(supabase, submission));
  }

  const { data: taskRaw, error: taskErr } = await supabase
    .from('open_tasks')
    .select(TASK_SELECT)
    .eq('id', submission.task_id)
    .maybeSingle();

  if (taskErr || !taskRaw) {
    return NextResponse.json({ error: 'Opdracht niet gevonden.' }, { status: 404 });
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

    if ((count ?? 0) >= MAX_GRADES_PER_TASK) {
      return NextResponse.json(
        {
          error: `Je kunt deze opdracht maximaal ${MAX_GRADES_PER_TASK} keer laten nakijken.`,
          code: 'grade_limit',
        },
        { status: 429 }
      );
    }
  }

  // ── Spend controls ──────────────────────────────────────────────────────────────────────────
  // After we know the skill, before any provider is touched. Admins re-grading from the review inbox
  // are exempt: that is the docent doing her job, not a candidate consuming a free tier.
  if (!isAdmin) {
    const ip = clientIp(request);
    const verdict = await checkGradingAllowed({
      userId: user.id,
      ip,
      skill: raw.skill,
      plan: planFromMetadata(user.user_metadata),
    });

    if (!verdict.allowed) {
      return NextResponse.json(
        {
          error: verdict.message,
          code: verdict.code,
          reason: verdict.reason,
          freeLimit: verdict.freeLimit,
        },
        // 402 for "pay to continue" so the client can tell a paywall from a cooldown without
        // string-matching the message.
        { status: verdict.reason === 'paywall' ? 402 : 429 }
      );
    }

    // Logged before the call, not after: the providers bill for the attempt, so the window must
    // count attempts. Logging on success would let a loop of failures run free.
    await logGradeAttempt(user.id, ip, raw.skill);
  }

  const rubric = await resolveRubric(raw.exams.level, raw.skill, raw.rubric_id, task);
  if (!rubric) {
    const message = `Er is nog geen actieve rubriek voor "${rubricCategory(task)}".`;
    await supabase.from('open_submissions').update({ grade_error: message }).eq('id', submission.id);
    return NextResponse.json({ error: message, code: 'no_rubric' }, { status: 409 });
  }

  try {
    // ---- Spreken: transcribe first, and persist that before grading. A transcript is worth
    // keeping even if the grader then fails; re-running should not re-pay for Scribe.
    let transcript = submission.transcript;
    let signals = submission.speech_signals as never;
    let audioSeconds = submission.audio_seconds;
    let audio: Uint8Array | null = null;
    let transcriptionNote: string | null = null;

    if (submission.audio_url) {
      // Read the object with the service key, not the caller's session.
      //
      // `speaking-submissions` is private and its only SELECT policy is `owner = auth.uid()`, and
      // `supabase` here carries the caller's JWT — which overrides the service-key role, so RLS
      // applies. That works for a candidate grading their own answer and fails for **an admin
      // re-grading someone else's**, which is the whole point of the force path. Authorisation was
      // already decided above; fetching the bytes is an internal step.
      const { data: file, error: dlErr } = await createAdminClient()
        .storage.from(RECORDING_BUCKET)
        .download(submission.audio_url);
      if (dlErr || !file) throw new Error(`Opname niet leesbaar: ${dlErr?.message ?? 'onbekend'}`);

      audio = new Uint8Array(await file.arrayBuffer());

      if (transcript == null || force) {
        // Transcription failure is NOT fatal. The grading model hears the recording itself, so
        // losing Scribe costs the stored transcript and the measured intelligibility signals — not
        // the candidate's feedback. Failing the whole grade here meant one missing API-key scope
        // took Spreken down entirely.
        //
        // It is recorded rather than swallowed: `grade_error` keeps the reason so the docent's inbox
        // shows that this answer was graded without its objective signals, which is exactly the
        // context she needs when reviewing the verstaanbaarheid score.
        try {
          const result = await transcribeRecording(audio, `${submission.task_id}.wav`);
          transcript = result.text;
          signals = result.signals as never;
          audioSeconds = audioSeconds ?? (Math.round(result.audio_duration_secs ?? 0) || null);

          await supabase
            .from('open_submissions')
            .update({
              transcript,
              speech_signals: signals,
              audio_seconds: audioSeconds,
            })
            .eq('id', submission.id);
        } catch (err) {
          transcriptionNote = `Transcriptie mislukt: ${
            err instanceof Error ? err.message : 'onbekend'
          }`;
          console.warn('[grade-open] transcription failed, grading from audio only', transcriptionNote);
        }
      }
    }

    const examples = await fetchFewShot(supabase, rubric.level, raw.skill, task);

    const result = await gradeOpenAnswer({
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

    await supabase
      .from('open_submissions')
      .update({
        ai_result: result,
        rubric_version: rubric.version,
        status: submission.status === 'teacher_reviewed' ? 'teacher_reviewed' : 'ai_graded',
        // Cleared on success, except for a transcription note — the grade stands, but the docent
        // should know it was produced without a transcript or measured signals.
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

    // Service key, deliberately. `open_criterion_scores` has a SELECT policy for the owner and a
    // FOR ALL policy for admins, and nothing else — a candidate must never be able to write their
    // own marks from the browser. Since `lib/supabase/server` runs as `authenticated` whenever a
    // session cookie is present, this upsert was RLS-denied for every non-admin user and surfaced
    // as "Voorbeoordeling mislukt" on production. Ownership was already checked above.
    const { error: scoreErr } = await createAdminClient()
      .from('open_criterion_scores')
      .upsert(rows, { onConflict: 'submission_id,criterion_key,source' });

    if (scoreErr) throw new Error(`Cijfers opslaan mislukt: ${scoreErr.message}`);

    return NextResponse.json({
      status: 'ai_graded',
      overall: result.overall,
      tips: result.tips,
      transcript,
      warning: transcriptionNote,
      // The highlights carry start/end offsets, so the text they index into must travel with them —
      // for Spreken that is the transcript, which the client did not have until now.
      answerText: submission.answer_text ?? transcript ?? null,
      highlights: result.highlights,
      criteria: rows.map(r => ({
        criterion_key: r.criterion_key,
        score: r.score,
        feedback: r.feedback,
        source: r.source,
      })),
      rubric: { id: rubric.id, version: rubric.version, criteria: rubric.criteria },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nakijken mislukt.';
    // Recorded on the row so a stuck answer is visible in /admin/beoordeling rather than looking
    // like an answer nobody has got round to.
    await supabase
      .from('open_submissions')
      .update({ grade_error: message.slice(0, 1000) })
      .eq('id', submission.id);
    console.error('[grade-open]', submissionId, message);
    return NextResponse.json({ error: 'Nakijken is niet gelukt.', detail: message }, { status: 502 });
  }
}

type Db = Awaited<ReturnType<typeof createClient>>;

/**
 * The task's own rubric if it names one, else the live rubric for its category.
 *
 * Reads with the service key, not the caller's session. `rubrics` has exactly one policy —
 * `Admins manage rubrics USING (is_admin())` — and no non-admin SELECT policy, on purpose: the
 * criteria and anchors are a scoring key. With the caller's JWT the lookup returns zero rows for
 * every candidate, so grading 409'd with `no_rubric` even when an active rubric existed.
 * Authorisation is settled before this point and the rubric never leaves the server — it goes into
 * the grading prompt, not the response.
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
    // An explicitly linked rubric from the wrong level is a mis-authored task, not a fallback
    // case. Refusing here beats grading against the other level's anchors and returning a mark
    // that looks fine; `exam_publish_issues()` flags the same mismatch before publish.
    if (data) {
      const r = normaliseRubric(data);
      if (r.level !== level) return null;
      return r;
    }
  }

  // `rubrics_one_active_idx` is UNIQUE (level, skill, task_type) WHERE active, so this is one
  // row per level. Without the level filter it would match both and `maybeSingle()` would throw.
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
 * Few-shot examples: only the ones the docent promoted, and only from this level.
 *
 * `use_as_fewshot = false` is the **test set** for /admin/beoordeling/evals. Feeding those in here
 * would train on the evaluation data and make every agreement number meaningless.
 *
 * The `level` filter matters just as much and fails more quietly. An A2 exemplar carries the
 * docent's marks for an A2 answer; shown while grading B1 it teaches the model that A2 work
 * earns those scores at B1. Nothing errors — the grades simply come back inflated, and the
 * eval that would catch it is scored against the same contaminated prompt.
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
async function storedResult(supabase: Db, submission: SubmissionRow) {
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
    // Service key, same reason as `resolveRubric`: the caller's JWT cannot see `rubrics`, and a
    // repeat call must return the same criteria the fresh grade did.
    const { data } = await createAdminClient()
      .from('rubrics')
      .select('id, skill, task_type, version, criteria, system_prompt, active')
      .eq('id', rubricId)
      .maybeSingle();
    if (data) rubric = normaliseRubric(data);
  }

  const ai = submission.ai_result as {
    overall?: string;
    tips?: string[];
    highlights?: unknown[];
  } | null;

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
