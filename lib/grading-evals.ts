/**
 * Measuring how far the model is from the docent.
 *
 * The whole rubric-grading design rests on an assumption — that a model applying the docent's
 * anchors lands close to where she would. This file is what stops that being an assumption. It
 * pairs the two rows that `open_criterion_scores` deliberately keeps side by side
 * (`source='ai'` and `source='teacher'` for the same `submission_id` and `criterion_key`) and
 * reports, per criterion:
 *
 *  - **exact agreement** — how often the two picked the same anchor;
 *  - **within ±1** — how often they are adjacent, which on a 0–3 scale is a near-miss not a
 *    disagreement;
 *  - **mean signed bias** — the number that is actually actionable. `+0.6` on `grammatica` means
 *    the model is systematically *more generous* than the docent on that criterion by roughly
 *    two-thirds of a band, which is fixable by rewriting that criterion's anchors or adding a
 *    few-shot example. An accuracy percentage alone hides direction, and direction is the fix.
 *
 * Pure functions over rows — no database access, so the page fetches and this decides.
 */
import { MAX_CRITERION_SCORE } from './rubrics';

export type ScoreRow = {
  submission_id: number;
  criterion_key: string;
  score: number;
  feedback: string | null;
  source: 'ai' | 'teacher';
  rubric_id: number | null;
  rubric_version: number | null;
};

export type Pair = {
  submission_id: number;
  criterion_key: string;
  rubric_id: number | null;
  rubric_version: number | null;
  ai: number;
  teacher: number;
  /** ai − teacher. Positive = the model was more generous than the docent. */
  delta: number;
  ai_feedback: string | null;
  teacher_feedback: string | null;
};

export type CriterionAgreement = {
  criterion_key: string;
  n: number;
  exact_pct: number;
  within_one_pct: number;
  /** Mean of (ai − teacher). Positive = model too mild, negative = model too harsh. */
  mean_bias: number;
  /** Mean of |ai − teacher|, for a plain "how far off on average". */
  mean_abs_error: number;
};

export type EvalSummary = {
  pairs: Pair[];
  total: number;
  exact_pct: number;
  within_one_pct: number;
  mean_bias: number;
  perCriterion: CriterionAgreement[];
  /** Largest disagreements first — the queue of things worth turning into few-shot examples. */
  worst: Pair[];
};

/**
 * Match AI and teacher scores into comparable pairs.
 *
 * A submission the docent has not reviewed contributes nothing, and neither does one only she
 * scored: the point is the comparison, so half a pair is not evidence in either direction.
 */
export function buildPairs(rows: ScoreRow[]): Pair[] {
  const byKey = new Map<string, { ai?: ScoreRow; teacher?: ScoreRow }>();
  for (const r of rows) {
    const k = `${r.submission_id}:${r.criterion_key}`;
    const entry = byKey.get(k) ?? {};
    entry[r.source] = r;
    byKey.set(k, entry);
  }

  const pairs: Pair[] = [];
  for (const { ai, teacher } of byKey.values()) {
    if (!ai || !teacher) continue;
    pairs.push({
      submission_id: ai.submission_id,
      criterion_key: ai.criterion_key,
      rubric_id: teacher.rubric_id ?? ai.rubric_id,
      rubric_version: teacher.rubric_version ?? ai.rubric_version,
      ai: ai.score,
      teacher: teacher.score,
      delta: ai.score - teacher.score,
      ai_feedback: ai.feedback,
      teacher_feedback: teacher.feedback,
    });
  }
  return pairs;
}

const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((100 * n) / total));
const mean = (xs: number[]) =>
  xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;

export function summariseAgreement(rows: ScoreRow[]): EvalSummary {
  const pairs = buildPairs(rows);
  const total = pairs.length;

  const keys = [...new Set(pairs.map(p => p.criterion_key))];
  const perCriterion: CriterionAgreement[] = keys
    .map(criterion_key => {
      const subset = pairs.filter(p => p.criterion_key === criterion_key);
      return {
        criterion_key,
        n: subset.length,
        exact_pct: pct(subset.filter(p => p.delta === 0).length, subset.length),
        within_one_pct: pct(subset.filter(p => Math.abs(p.delta) <= 1).length, subset.length),
        mean_bias: mean(subset.map(p => p.delta)),
        mean_abs_error: mean(subset.map(p => Math.abs(p.delta))),
      };
    })
    // Worst agreement first: the criterion most in need of better anchors is the headline.
    .sort((a, b) => b.mean_abs_error - a.mean_abs_error);

  return {
    pairs,
    total,
    exact_pct: pct(pairs.filter(p => p.delta === 0).length, total),
    within_one_pct: pct(pairs.filter(p => Math.abs(p.delta) <= 1).length, total),
    mean_bias: mean(pairs.map(p => p.delta)),
    perCriterion,
    worst: [...pairs]
      .filter(p => Math.abs(p.delta) >= 2)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 25),
  };
}

/**
 * How much confidence the sample supports. Deliberately blunt: with a handful of pairs an
 * agreement percentage is noise, and presenting it without this caveat invites acting on it.
 *
 * The thresholds are judgement, not statistics — they are a prompt to collect more, not a test.
 */
export function confidenceNote(total: number): { level: 'none' | 'low' | 'fair' | 'good'; text: string } {
  if (total === 0) {
    return {
      level: 'none',
      text: 'Nog geen vergelijkingen. Kijk inzendingen na in Beoordelen; elk criterium dat je zelf scoort levert één vergelijking op.',
    };
  }
  if (total < 30) {
    return {
      level: 'low',
      text: `${total} vergelijkingen is te weinig om op te varen. Behandel deze cijfers als een eerste indruk.`,
    };
  }
  if (total < 100) {
    return {
      level: 'fair',
      text: `${total} vergelijkingen geeft een richting aan, maar een verschil per criterium van minder dan een halve punt kan toeval zijn.`,
    };
  }
  return { level: 'good', text: `${total} vergelijkingen — genoeg om per criterium op te sturen.` };
}

/** Plain-language reading of a bias number, so it is not left to interpretation. */
export function biasLabel(bias: number): string {
  if (Math.abs(bias) < 0.15) return 'gelijk aan jouw beoordeling';
  const direction = bias > 0 ? 'milder' : 'strenger';
  const size = Math.abs(bias) >= 0.75 ? 'duidelijk' : 'iets';
  return `${size} ${direction} dan jij (${bias > 0 ? '+' : ''}${bias} van ${MAX_CRITERION_SCORE})`;
}
