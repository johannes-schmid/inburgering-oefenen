/**
 * The per-(level, skill) question backlog.
 *
 * Exam **number 0** is not an oefenexamen: it is a holding area for items that have been authored
 * but not yet assigned to one of the ten slots. See
 * `supabase/migrations/20260804000000_question_backlog.sql` for why it is an exam row rather than a
 * nullable `exam_id` — in short, a question resolves both its skill and its level through `exams`,
 * so an item with no exam has neither, and every trigger, view and RLS policy would have to learn
 * about NULL.
 *
 * **This module is the only place the number 0 means anything.** Anything that lists or counts the
 * ten real exams must exclude it; anything that resolves an exam by id can treat it as an exam,
 * because that is what it is.
 *
 * Deliberately free of imports: `ContentTable` and `ExamBuilder` are client components and need
 * `examLabel`, so anything server-only here would drag `next/headers` into the browser bundle. The
 * queries live in `backlog-server.ts`.
 */
export const BACKLOG_EXAM_NUMBER = 0;

export function isBacklog(examNumber: number): boolean {
  return examNumber === BACKLOG_EXAM_NUMBER;
}

/** How an exam number reads in admin. Used by the builder, the content table and the pickers. */
export function examLabel(examNumber: number): string {
  return isBacklog(examNumber) ? 'Backlog' : `Examen ${examNumber}`;
}

export type AssignTarget = {
  id: number;
  number: number;
  label: string;
  published: boolean;
  /** How many items are already in it, so a slot that is full does not look empty. */
  itemCount: number;
};
