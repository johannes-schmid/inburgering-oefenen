/**
 * Recording an exam sitting.
 *
 * `exam_attempts` is append-only and is the source of truth for progress over time;
 * `exam_results` is a VIEW of the latest attempt per (user, skill, exam) that the
 * dashboard reads. So never write to `exam_results` — a view is not writable, and the
 * KNM code that upserted it was silently failing anyway (it passed
 * `onConflict: 'user_id,exam_number'` against a three-column key → 42P10).
 *
 * `attempt_no` is assigned by a trigger, so callers must not send it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SkillSlug } from '@/data/skills';

export type AttemptInput = {
  userId: string;
  skill: SkillSlug;
  examNumber: number;
  /** Row id in `exams`, when the caller knows it. */
  examId?: number | null;
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  /** Correct/total per sub-skill, for the per-question-type breakdown. */
  catScores?: Record<string, { correct: number; total: number }>;
  /**
   * Frozen onto the row so that later changing `exams.pass_threshold_pct` cannot
   * retroactively turn a pass into a fail.
   */
  passThresholdPct?: number | null;
  startedAt?: string | null;
};

/**
 * Append one attempt and return its id, or null if the insert failed. The id is what
 * links `user_question_results` and `open_submissions` to this sitting.
 */
export async function recordExamAttempt(
  supabase: SupabaseClient,
  input: AttemptInput
): Promise<number | null> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({
      user_id: input.userId,
      exam_id: input.examId ?? null,
      skill: input.skill,
      exam_number: input.examNumber,
      score: input.score,
      total: input.total,
      pct: input.pct,
      passed: input.passed,
      cat_scores: input.catScores ?? {},
      pass_threshold_pct: input.passThresholdPct ?? null,
      started_at: input.startedAt ?? new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[attempts] failed to record attempt', error.message);
    return null;
  }
  return (data as { id: number }).id;
}

/**
 * Open a sitting *before* the first question is answered, so every
 * `user_question_results` / `open_submissions` row can carry its `attempt_id`. Inserting
 * the attempt only at submit-time would leave the per-answer rows orphaned for the whole
 * exam, and an abandoned exam would lose its answers entirely.
 *
 * `completed_at` stays NULL until `completeExamAttempt` — `exam_results` filters on it, so
 * an in-flight or abandoned attempt never shows up as a result.
 */
export async function startExamAttempt(
  supabase: SupabaseClient,
  input: {
    userId: string;
    skill: SkillSlug;
    examNumber: number;
    examId?: number | null;
    /**
     * `practice` = the candidate saw feedback after each answer and could revise; `exam` = feedback
     * was withheld until submit. Stamped here rather than at completion so it describes how the
     * sitting was actually run. Only `exam` attempts are evidence of readiness.
     */
    feedbackMode?: 'practice' | 'exam';
  }
): Promise<number | null> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({
      user_id: input.userId,
      exam_id: input.examId ?? null,
      skill: input.skill,
      exam_number: input.examNumber,
      feedback_mode: input.feedbackMode ?? 'practice',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[attempts] failed to open attempt', error.message);
    return null;
  }
  return (data as { id: number }).id;
}

/**
 * Close a sitting opened by `startExamAttempt` with its score.
 *
 * `score`, `pct` and `passed` are nullable, and that matters for the rubric skills: a Schrijven
 * attempt whose tasks have not all been graded has **no score yet**, which is not the same as a
 * score of 0. Writing 0 (what this used to do) made an awaiting-grade attempt indistinguishable
 * from a failed one on the dashboard and dragged the candidate's average down.
 */
export async function completeExamAttempt(
  supabase: SupabaseClient,
  attemptId: number,
  result: {
    score: number | null;
    total: number;
    pct: number | null;
    passed: boolean | null;
    catScores?: Record<string, { correct: number; total: number }>;
    passThresholdPct?: number | null;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('exam_attempts')
    .update({
      score: result.score,
      total: result.total,
      pct: result.pct,
      passed: result.passed,
      cat_scores: result.catScores ?? {},
      pass_threshold_pct: result.passThresholdPct ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId);

  if (error) {
    console.error('[attempts] failed to complete attempt', error.message);
    return false;
  }
  return true;
}
