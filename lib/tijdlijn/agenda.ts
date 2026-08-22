/**
 * The agenda: **what to do, when, in one dated list.**
 *
 * The chart answers *how long* things take and the verdict card answers *will I make it*. Neither
 * answers the question people actually arrive with — *what am I supposed to be doing right now, and
 * what comes after that?* A gantt is a picture of a plan; this is the plan as instructions.
 *
 * Every entry is one action with one date, sorted chronologically and merged across components, so
 * "start studying for KNM", "register for Lezen A2" and "your PVT must be signed" appear in the order
 * they have to happen rather than grouped by which exam they belong to. That ordering is the whole
 * value: the components interleave, and nobody works out the interleaving from four separate rows.
 *
 * Three rules it inherits:
 *
 * - **`start` and `register` are the two actions the reader takes; `exam` and `result` are things
 *   that then happen to them.** They are marked differently (`actor`) because a to-do list that
 *   mixes "book this" with "wait for this" reads as twice as much work as it is.
 * - **A `register` date is legal, a `start` date is ours.** The subtraction that produces "start
 *   studying by" runs through our study model, so it is an estimate and is labelled as one, even
 *   though the date it counts back from is published by DUO.
 * - **An action whose date has passed is not dropped, it is marked `overdue`.** Hiding it would make
 *   the list look achievable by deleting the part that is not. What the UI must never do is scold.
 */
import { diffWeeks, isBefore, toEpochDay, type PlainDate } from './engine/dates';
import type { ComponentId, Timeline } from './engine/types';

/**
 * The components that are **not DUO exams**: you arrange them with your gemeente.
 *
 * Keyed by identity, not by "has no waiting time". PVT does have a DUO lead time — about three weeks
 * before the signature shows up in Mijn Inburgering — and treating that as an exam queue gave it a
 * study/register/exam/result chain, i.e. four instructions for something that is one appointment.
 * The distinction is what these things *are*, so it is written as what they are.
 */
export const AT_THE_GEMEENTE: ComponentId[] = ['pvt', 'map', 'z_eindgesprek'];

export type AgendaKind = 'start' | 'register' | 'exam' | 'result' | 'gemeente' | 'deadline';

export interface AgendaItem {
  id: string;
  /** The date the list is sorted by. For an estimated window this is its *late* end. */
  date: PlainDate;
  /** A range's early end, when there is one — rendered as "tussen X en Y". */
  from?: PlainDate;
  kind: AgendaKind;
  /** `you` = an action to take. `duo` / `gemeente` = something that happens to you. */
  actor: 'you' | 'duo' | 'gemeente';
  /** Legal dates carry a source and may be badged "volgens DUO"; estimates never may. */
  precision: 'legal' | 'estimate';
  component: ComponentId | null;
  /** Rendered after the component name: "Lezen A2". */
  level: 'a2' | 'b1' | 'b2' | null;
  /** The date has passed. Shown, never hidden — and never scolded about. */
  overdue: boolean;
  sourceId?: string;
}

export function buildAgenda(timeline: Timeline, today: PlainDate): AgendaItem[] {
  const out: AgendaItem[] = [];
  const past = (d: PlainDate) => isBefore(d, today);

  for (const c of timeline.components) {
    if (!c.required || c.done) continue;

    /* One entry, not the four-step chain — see `AT_THE_GEMEENTE`. */
    if (AT_THE_GEMEENTE.includes(c.id)) {
      if (c.registerBy) {
        out.push({
          id: `${c.id}:gemeente`,
          date: c.registerBy.date,
          kind: 'gemeente',
          actor: 'gemeente',
          precision: 'legal',
          component: c.id,
          level: c.level,
          overdue: past(c.registerBy.date),
          sourceId: c.registerBy.sourceId,
        });
      }
      continue;
    }

    if (c.startStudyingBy) {
      out.push({
        id: `${c.id}:start`,
        date: c.startStudyingBy.latest,
        from: c.startStudyingBy.earliest,
        kind: 'start',
        actor: 'you',
        precision: 'estimate',
        component: c.id,
        level: c.level,
        /* "You should already have started" is a real and useful thing to be told — it is the whole
         * reason the backward calculation exists — so a past start date stays in the list. */
        overdue: past(c.startStudyingBy.latest),
      });
    }

    if (c.registerBy) {
      out.push({
        id: `${c.id}:register`,
        date: c.registerBy.date,
        kind: 'register',
        actor: 'you',
        precision: 'legal',
        component: c.id,
        level: c.level,
        overdue: past(c.registerBy.date),
        sourceId: c.registerBy.sourceId,
      });
    }

    if (c.examWindow) {
      out.push({
        id: `${c.id}:exam`,
        date: c.examWindow.latest,
        from: c.examWindow.earliest,
        kind: 'exam',
        actor: 'duo',
        precision: 'estimate',
        component: c.id,
        level: c.level,
        overdue: false,
      });
    }

    if (c.resultWindow) {
      out.push({
        id: `${c.id}:result`,
        date: c.resultWindow.latest,
        from: c.resultWindow.earliest,
        kind: 'result',
        actor: 'duo',
        precision: 'estimate',
        component: c.id,
        level: c.level,
        overdue: false,
      });
    }
  }

  if (timeline.termijnEnd) {
    out.push({
      id: 'deadline',
      date: timeline.termijnEnd.date,
      kind: 'deadline',
      actor: 'duo',
      precision: 'legal',
      component: null,
      level: null,
      overdue: past(timeline.termijnEnd.date),
      sourceId: timeline.termijnEnd.sourceId,
    });
  }

  /* Chronological, then by how much the reader has to do about it: on the same date, an action they
   * take comes before something they wait for. */
  const rank: Record<AgendaItem['actor'], number> = { you: 0, gemeente: 1, duo: 2 };
  return out.sort((a, b) => toEpochDay(a.date) - toEpochDay(b.date) || rank[a.actor] - rank[b.actor]);
}

/**
 * The next few things, for the verdict card.
 *
 * Overdue items come first regardless of date — if you should already have started studying for two
 * exams, that is the answer to "what should I be doing now", and it outranks a registration that is
 * six weeks out.
 */
export function nextActions(agenda: AgendaItem[], limit = 4): AgendaItem[] {
  const mine = agenda.filter(a => a.actor === 'you' || a.actor === 'gemeente');
  const overdue = mine.filter(a => a.overdue);
  const upcoming = mine.filter(a => !a.overdue);
  return [...overdue, ...upcoming].slice(0, limit);
}

/** Weeks from today, floored at zero for display. */
export function weeksAway(item: AgendaItem, today: PlainDate): number {
  return Math.max(0, diffWeeks(today, item.date));
}
