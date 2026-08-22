/**
 * The planning model: when could this person realistically sit each exam?
 *
 * **Everything in this file is ours, not DUO's.** It returns `EstimatedDate` only — a range, with a
 * confidence — and the UI is required to render it dashed and labelled *ongeveer*. The numbers it
 * reads live under `planning` in the rules document precisely so nobody can mistake them for law.
 *
 * The model is deliberately crude in one respect and careful in another. Crude: hours-to-level is a
 * band taken from the route norms DUO itself uses (Z-route 800 language hours, afschalen at 600,
 * the family-migrant extension threshold at 450), not from a learner model we cannot validate.
 * Careful: self-study is discounted, the output is never a single number, and a missing answer
 * widens the range rather than being silently replaced by an average.
 */
import { addWeeks, type PlainDate } from './dates';
import { estimate, type ComponentId, type EstimatedDate, type Level, type TimelineInput } from './types';
import type { Rules } from '../rules';

/** Guided hours count fully; self-study is halved. Deliberate — guided hours are what DUO counts. */
export function effectiveHoursPerWeek(input: TimelineInput, rules: Rules): number {
  const w = rules.planning.selfStudyWeighting;
  return Math.max(0, input.courseHoursPerWeek) + Math.max(0, input.selfStudyHoursPerWeek) * w;
}

const LADDER: Level[] = ['a0', 'a1', 'a2', 'b1', 'b2'];

/**
 * Hours still needed to climb from `from` to `to`, as a band.
 *
 * Walks the ladder one rung at a time and sums the per-rung bands, so A0→B1 is A0→A1 + A1→A2 +
 * A2→B1 rather than a number nobody has published. Returns `[0, 0]` when they are already there or
 * higher — never a negative band, which would hand someone time they have not earned.
 */
export function hoursToLevel(from: Level, to: Level, rules: Rules): [number, number] {
  const i = LADDER.indexOf(from === 'unknown' ? 'a0' : from);
  const j = LADDER.indexOf(to);
  if (i < 0 || j < 0 || j <= i) return [0, 0];
  let lo = 0;
  let hi = 0;
  for (let k = i; k < j; k++) {
    const key = `${LADDER[k]}_${LADDER[k + 1]}`;
    const band = rules.planning.studyHours[key];
    if (band) {
      lo += band[0];
      hi += band[1];
    }
  }
  return [lo, hi];
}

/** Which multiplier a diagnostic score earns. `undefined` is its own band, not an average. */
export function diagnosticMultiplier(score: number | undefined, rules: Rules): number {
  const m = rules.planning.diagnosticMultipliers;
  if (score === undefined || Number.isNaN(score)) return m.unknown;
  if (score >= 8) return m['8_10'];
  if (score >= 5) return m['5_7'];
  return m['0_4'];
}

export function expectedAttempts(score: number | undefined, rules: Rules): number {
  const a = rules.planning.expectedAttempts;
  if (score === undefined || Number.isNaN(score)) return a.unknown;
  if (score >= 8) return a['8_10'];
  if (score >= 5) return a['5_7'];
  return a['0_4'];
}

const LANGUAGE: ComponentId[] = ['lezen', 'luisteren', 'spreken', 'schrijven'];

/**
 * **How many weeks of studying are left for this component**, as a band — the number every other
 * date on the screen is built from.
 *
 * Split out of `readinessFor` because the same figure answers two different questions, and the tool
 * has to answer both. Forwards: *"when could I sit this?"* — today plus these weeks. Backwards:
 * *"when must I start?"* — the last safe registration date **minus** these weeks. The second is the
 * one people actually act on, and it cannot be derived from a readiness *date* after the fact.
 *
 * `null` means we cannot say: nothing was passed in about hours, or the level gap is unknown. That is
 * a different statement from zero and must not be rendered as "start whenever".
 */
export function studyWeeksFor(
  id: ComponentId,
  input: TimelineInput,
  rules: Rules,
): { lo: number; hi: number } | null {
  const progress = input.progress[id];
  if (progress?.state === 'passed') return null;

  const score = progress?.diagnosticScore;
  const mult = diagnosticMultiplier(score, rules);
  const cap = rules.planning.maxPlanningHorizonWeeks;

  if (LANGUAGE.includes(id)) {
    const target = input.targetLevel === 'unknown' ? 'a2' : input.targetLevel;
    const [loH, hiH] = hoursToLevel(input.currentLevel, target as Level, rules);
    /* Already at the target level: no studying left to plan, only a slot to get — which is the
     * registration lead time the caller adds on top. Zero weeks, not "unknown". */
    if (loH === 0 && hiH === 0) return { lo: 0, hi: 0 };
    const perWeek = effectiveHoursPerWeek(input, rules);
    if (perWeek <= 0) return null;
    /* Nobody sits four DUO exams in one week, so the nth language exam is staggered. Ours, tunable,
     * and the reason a plan produced here can actually be booked. */
    const spacing = rules.planning.examSpacingWeeks * Math.max(0, LANGUAGE.indexOf(id));
    return {
      lo: Math.min(cap, Math.ceil((loH * mult) / perWeek) + spacing),
      hi: Math.min(cap, Math.ceil((hiH * mult) / perWeek) + spacing),
    };
  }

  const band = rules.planning.componentBaseWeeks[id];
  if (!band) return null;
  return { lo: Math.min(cap, Math.ceil(band[0] * mult)), hi: Math.min(cap, Math.ceil(band[1] * mult)) };
}

/**
 * When this component could be sat, as a range from `today`.
 *
 * Two different models, because the components are two different kinds of thing: the four language
 * exams are a level climb (hours to level ÷ effective hours a week), while KNM, PVT, MAP and the
 * Z-route interview have no level to reach and get a base band in weeks. Both go through
 * `studyWeeksFor`; this function only turns weeks into dates.
 *
 * Returns `null` for a component already passed, and for a candidate who reports **no study hours at
 * all** on a language component — with zero hours a week the arithmetic divides by nothing, and a
 * fabricated date is the worst possible answer. The caller turns that into `no_study_hours_given`.
 */
export function readinessFor(
  id: ComponentId,
  input: TimelineInput,
  rules: Rules,
  today: PlainDate,
): EstimatedDate | null {
  const progress = input.progress[id];
  if (progress?.state === 'passed') return null;

  /* A booked exam is not an estimate any more — the candidate knows the date. Use it, and mark it
   * high confidence with a zero-width range: this is the one case where a range would be a lie. */
  if (progress?.examDate && (progress.state === 'registered' || progress.state === 'awaiting_result')) {
    return estimate(progress.examDate, progress.examDate, 'default_assumption', 'high');
  }

  const weeks = studyWeeksFor(id, input, rules);
  if (!weeks) return null;

  const score = progress?.diagnosticScore;
  const basis: EstimatedDate['basis'] = score !== undefined ? 'diagnostic' : 'study_model';
  /* Confidence follows how much the user actually told us, never how precise the output looks. */
  const confidence: EstimatedDate['confidence'] =
    score !== undefined ? 'medium' : LANGUAGE.includes(id) && input.currentLevel === 'unknown' ? 'low' : 'low';

  return estimate(addWeeks(today, weeks.lo), addWeeks(today, weeks.hi), basis, confidence);
}
