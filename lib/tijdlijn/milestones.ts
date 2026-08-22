/**
 * The dated points on the chart that are not exams: the milestones.
 *
 * A gantt of five exam bars answers "when do I study?" but not "where am I in the traject?" — and
 * the traject is what the four guides in `data/guides/` actually describe: you arrive, you register
 * with the gemeente, DUO writes to you, the gemeente sets your PIP, *then* the clock starts, and the
 * PVT and MAP sit inside the same three years as the exams. Those are the reference points that make
 * the bars mean something, so they are drawn on the same axis.
 *
 * Derived here rather than in the engine on purpose. `computeTimeline` answers one question — will
 * this person make it, and by when must they act — and every field on `Timeline` serves it. A
 * milestone list is a *presentation* of those same facts for one particular chart; putting it in the
 * engine would grow the contract every time the chart changed.
 *
 * The legal/estimate split still holds, because it holds everywhere: a milestone is `legal` when it
 * follows from a date the reader gave us plus a published rule, and `estimate` when it comes from our
 * planning model. The chart draws them differently, and never lets one pass for the other.
 */
import { addMonths, addWeeks, isAfter, isBefore, type PlainDate } from './engine/dates';
import type { Timeline, TimelineInput } from './engine/types';

export type MilestoneKind = 'legal' | 'estimate';

export interface Milestone {
  id: string;
  date: PlainDate;
  kind: MilestoneKind;
  /** Key under `tijdlijn.chart.milestone`. */
  labelKey: string;
  /** `wall` gets the hard full-height rule; `pin` a marker on the axis; `start` the origin dot. */
  shape: 'start' | 'pin' | 'wall';
  /** Drawn in the risk colour — the deadline in at-risk mode, the fine horizon in overdue. */
  tone?: 'neutral' | 'risk';
  sourceId?: string;
}

export function deriveMilestones(timeline: Timeline, input: TimelineInput, today: PlainDate): Milestone[] {
  const out: Milestone[] = [];
  const push = (m: Milestone) => out.push(m);

  /* When they arrived. Kept even once the term has started, unlike the letter and PIP estimates: it
   * is a date the reader gave us rather than one we guessed, it is the origin of the five-year
   * passport clock, and "this is where your line begins" is what makes the rest of the axis legible. */
  if (input.residenceStart) {
    push({
      id: 'residence_start',
      date: input.residenceStart,
      kind: 'legal',
      labelKey: 'residence_start',
      shape: 'start',
    });
  }

  /* The three gemeente/DUO steps between arriving and the clock starting. They are drawn only when
   * the term has *not* started, because that is the one case where they are still ahead of the
   * reader and therefore actionable; once the PIP exists they are history and would only crowd the
   * chart. The offsets are DUO's own published lead times, not invented ones: up to 8 weeks for the
   * letter once BSN, permit and registration are in place, and 10 weeks for the PIP after that. */
  if (!timeline.termijnStart && input.residenceStart) {
    const letter = addWeeks(input.residenceStart, 8);
    const pip = addWeeks(letter, 10);
    /* Only drawn while they are still **ahead** of the reader. Someone who arrived four years ago and
     * has not told us their PIP date does not need an estimate of a letter that demonstrably already
     * came — that reads as a prediction of the past, and it is the fastest way to lose their trust in
     * every other date on the chart. For them the honest move is to say nothing here and let the
     * anchor question ask for the real date. */
    if (isAfter(letter, today)) {
      push({ id: 'duo_letter', date: letter, kind: 'estimate', labelKey: 'duo_letter', shape: 'pin' });
    }
    if (isAfter(pip, today)) {
      push({ id: 'pip', date: pip, kind: 'estimate', labelKey: 'pip', shape: 'pin' });
    }
  }

  if (timeline.termijnStart) {
    push({
      id: 'termijn_start',
      date: timeline.termijnStart.date,
      kind: 'legal',
      labelKey: 'termijn_start',
      shape: 'start',
      sourceId: timeline.termijnStart.sourceId,
    });
  }

  /* Wi2013's PVT has a deadline of its own — one year from registering with the gemeente — which is
   * inside the term and much earlier than it. Missing it is a €340 fine for something most people do
   * not know is on a separate clock, so it gets its own pin rather than being folded into the term. */
  if (timeline.law === 'wi2013' && timeline.termijnStart) {
    const due = addMonths(timeline.termijnStart.date, 12);
    if (isAfter(due, today)) {
      push({ id: 'pvt_due', date: due, kind: 'legal', labelKey: 'pvt_due', shape: 'pin', sourceId: 'S9' });
    }
  }

  if (timeline.termijnEnd) {
    push({
      id: 'termijn_end',
      date: timeline.termijnEnd.date,
      kind: 'legal',
      labelKey: 'termijn_end',
      shape: 'wall',
      tone: timeline.mode === 'at_risk' || timeline.mode === 'overdue' ? 'risk' : 'neutral',
      sourceId: timeline.termijnEnd.sourceId,
    });
  }

  /* Mode E's second wall. Being late is not the end: DUO grants extra time on a published scale, and
   * drawing that as a further wall beyond the first is the whole difference between a verdict and a
   * recovery plan. */
  if (timeline.fine?.newHorizon) {
    push({
      id: 'fine_horizon',
      date: timeline.fine.newHorizon.date,
      kind: 'legal',
      labelKey: 'fine_horizon',
      shape: 'wall',
      tone: 'risk',
      sourceId: timeline.fine.newHorizon.sourceId,
    });
  }

  if (timeline.naturalisation?.residenceEligibleFrom) {
    push({
      id: 'naturalisation',
      date: timeline.naturalisation.residenceEligibleFrom.date,
      kind: 'legal',
      labelKey: 'naturalisation',
      shape: 'wall',
      sourceId: timeline.naturalisation.residenceEligibleFrom.sourceId,
    });
  }

  return out.sort((a, b) => (isBefore(a.date, b.date) ? -1 : 1));
}

/** How far into the past the axis may reach. See `chartWindow`. */
const MAX_MONTHS_BEHIND = 12;

/**
 * The window the chart is drawn in.
 *
 * The end is the furthest thing worth showing — the last wall, or the tail of the slowest bar if
 * that runs past it. The **start is clamped**, and that clamp is the difference between a readable
 * chart and an unreadable one: a reader who arrived in 2022 and is planning 2027 would otherwise get
 * an axis five years wide with every bar crushed into the right-hand third. Their arrival date still
 * appears in the milestone list, where it is information; it just does not get to set the scale.
 *
 * Two exceptions to the clamp, both cases where the past *is* the subject: the term start (so the
 * three years are visible as three years) and a term that has already ended, because mode `overdue`
 * exists to show someone where their deadline was.
 */
export function chartWindow(
  milestones: Milestone[],
  timeline: Timeline,
  today: PlainDate,
): { from: PlainDate; to: PlainDate } {
  const floor = addMonths(today, -MAX_MONTHS_BEHIND);
  let from = today;
  let to = addMonths(today, 6);

  if (timeline.termijnStart && isBefore(timeline.termijnStart.date, from)) from = timeline.termijnStart.date;
  if (timeline.termijnEnd && isBefore(timeline.termijnEnd.date, today)) from = minDate(from, timeline.termijnEnd.date);
  if (isBefore(from, floor) && !(timeline.termijnStart && isBefore(timeline.termijnStart.date, floor))) from = floor;

  for (const m of milestones) {
    if (isAfter(m.date, to)) to = m.date;
  }
  for (const c of timeline.components) {
    if (!c.readyBy) continue;
    const end = addWeeks(c.readyBy.latest, c.registrationWeeks + c.resultWindowWeeks);
    if (isAfter(end, to)) to = end;
  }
  /* A month of air at each end, so the origin dot and the last wall are never flush against an edge
   * where they stop reading as points on a line. */
  return { from: addMonths(from, -1), to: addMonths(to, 1) };
}

const minDate = (a: PlainDate, b: PlainDate) => (isBefore(a, b) ? a : b);
