// Builds a day-by-day mastery time series from the per-question answer log,
// for the "your progress" chart. Headline metric = cumulative mastery %
// (share of the whole question bank currently answered-correct-most-recently):
// it climbs toward 100% as questions are mastered, and honestly dips when a
// previously-correct question is later missed.
//
// `answers` MUST be ordered by answered_at ASCending.

import type { AnswerRow } from './learning-queues';

export type ProgressionPoint = {
  date: string; // YYYY-MM-DD
  masteryPct: number; // cumulative mastered / totalQuestions
  answers: number; // cumulative answers given up to end of this day
  rollingAccuracy: number | null; // accuracy over the last N answers
};

export function buildProgressionSeries(
  answers: AnswerRow[],
  totalQuestions: number,
  opts: { rollingWindow?: number } = {}
): ProgressionPoint[] {
  const rollingWindow = opts.rollingWindow ?? 20;
  const total = Math.max(1, totalQuestions);

  const latest = new Map<number, boolean>();
  const window: boolean[] = [];
  let mastered = 0;
  let answered = 0;

  const byDay = new Map<string, { mastered: number; answered: number; rolling: number | null }>();

  for (const a of answers) {
    const prev = latest.get(a.question_id);
    if (a.was_correct && prev !== true) mastered += 1;
    else if (!a.was_correct && prev === true) mastered -= 1;
    latest.set(a.question_id, a.was_correct);

    answered += 1;
    window.push(a.was_correct);
    if (window.length > rollingWindow) window.shift();
    const rolling = Math.round((window.filter(Boolean).length / window.length) * 100);

    const day = a.answered_at.slice(0, 10);
    byDay.set(day, { mastered, answered, rolling });
  }

  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({
      date,
      masteryPct: Math.round((v.mastered / total) * 100),
      answers: v.answered,
      rollingAccuracy: v.rolling,
    }));
}
