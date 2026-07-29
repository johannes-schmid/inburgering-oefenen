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
