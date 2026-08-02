/**
 * Per-criterion progress for the two rubric-scored onderdelen.
 *
 * Lezen and Luisteren get a percentage, which is a single number a candidate can watch move.
 * Schrijven and Spreken do not work that way: "62%" tells you nothing about *what* to practise,
 * and the whole point of a rubric is that the answer is decomposed. So this returns one series per
 * criterion — grammatica, woordenschat, inhoud — and the page can say which one is holding the
 * candidate back.
 *
 * This is the payoff of `open_criterion_scores` being append-only. Every grading writes a row per
 * criterion with its `attempt_id`, so the history is already there; nothing had to be logged
 * specially for this.
 */
import { createClient } from '@/lib/supabase/server';
import { MAX_CRITERION_SCORE } from '@/lib/rubrics';

export type CriterionPoint = {
  /** YYYY-MM-DD of the sitting. */
  date: string;
  /** Mean score for this criterion that day, 0..3. */
  score: number;
  /** How many graded answers that mean is over — a mean of one answer is not a trend. */
  n: number;
};

export type CriterionSeries = {
  key: string;
  /** The docent's wording from the rubric, falling back to the key. */
  label: string;
  points: CriterionPoint[];
  /** Mean over the most recent sitting, for the headline. */
  latest: number;
  /** Mean over the first sitting, so the page can state the change honestly. */
  first: number;
  /** Total graded answers behind this series. */
  n: number;
};

type Row = {
  criterion_key: string;
  score: number;
  source: string;
  created_at: string;
  submission: { attempt: { completed_at: string | null; feedback_mode: string } | null } | null;
};

/**
 * Build the series for one candidate and one rubric skill.
 *
 * Two filters matter and both are deliberate:
 *
 * - **`source`**: where the docent has entered a score it replaces the model's, exactly as
 *   `effectiveScores()` does for a single submission. Averaging both would count one answer twice
 *   and pull the mean toward whichever grader happened to be present.
 * - **`feedback_mode = 'exam'` is NOT applied here.** A practice sitting still measures the
 *   criterion honestly — the candidate revised after feedback, but the revision is the thing being
 *   graded. That is different from a *readiness* claim, which must exclude coached attempts; this
 *   chart makes no such claim, and dropping practice sittings would leave most candidates with an
 *   empty chart.
 */
export async function fetchCriterionSeries(
  userId: string,
  skill: 'schrijven' | 'spreken'
): Promise<CriterionSeries[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('open_criterion_scores')
    .select(
      `criterion_key, score, source, created_at,
       submission:open_submissions!inner(
         user_id,
         task:open_tasks!inner(skill),
         attempt:exam_attempts(completed_at, feedback_mode)
       )`
    )
    .eq('submission.user_id', userId)
    .eq('submission.task.skill', skill)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  // One score per (criterion, submission-day), docent over model. The key includes the day so two
  // sittings on different days stay separate points rather than collapsing.
  const rows = data as unknown as (Row & { submission: { user_id: string } })[];
  const best = new Map<string, { date: string; key: string; score: number; source: string }>();

  for (const r of rows) {
    const date = (r.submission?.attempt?.completed_at ?? r.created_at).slice(0, 10);
    const id = `${r.criterion_key}|${date}|${r.created_at}`;
    const prev = best.get(id);
    if (!prev || (r.source === 'teacher' && prev.source === 'ai')) {
      best.set(id, { date, key: r.criterion_key, score: r.score, source: r.source });
    }
  }

  const byCriterion = new Map<string, Map<string, number[]>>();
  for (const v of best.values()) {
    if (!byCriterion.has(v.key)) byCriterion.set(v.key, new Map());
    const days = byCriterion.get(v.key)!;
    if (!days.has(v.date)) days.set(v.date, []);
    days.get(v.date)!.push(v.score);
  }

  const series: CriterionSeries[] = [];
  for (const [key, days] of byCriterion) {
    const points = [...days.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, scores]) => ({
        date,
        score: Math.round((scores.reduce((n, s) => n + s, 0) / scores.length) * 100) / 100,
        n: scores.length,
      }));
    if (points.length === 0) continue;
    series.push({
      key,
      label: labelForCriterion(key),
      points,
      latest: points[points.length - 1].score,
      first: points[0].score,
      n: points.reduce((n, p) => n + p.n, 0),
    });
  }

  // Weakest first: the criterion a candidate should work on is the one they should see first.
  return series.sort((a, b) => a.latest - b.latest);
}

/**
 * A readable label from the criterion key — `woordgebruik` → `Woordgebruik`.
 *
 * The docent's own wording lives in `rubrics.criteria`, and this deliberately does **not** read it:
 * `rubrics` has no non-admin SELECT policy, because the criteria carry the 0–3 anchors and those
 * are a scoring key. Querying it from a candidate page would not error — RLS would just return
 * nothing — so the labels would silently fall back to raw keys and nobody would notice why.
 *
 * The keys are already meaningful Dutch words (`inhoud`, `grammatica`, `woordgebruik`) precisely
 * so this is enough.
 */
export function labelForCriterion(key: string): string {
  const words = key.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** 0..3 → 0..100, for a bar width. */
export function scoreToPct(score: number): number {
  return Math.round((score / MAX_CRITERION_SCORE) * 100);
}
