/**
 * Server-side reads for the question backlog. Split from `backlog.ts` so the label helpers there
 * stay importable from client components — see the note in that file.
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Level } from '@/data/skills';
import { BACKLOG_EXAM_NUMBER, examLabel, type AssignTarget } from './backlog';

/**
 * The exams an item of this (level, skill) can be moved into — the backlog plus the ten slots.
 *
 * Includes the exam being viewed; the builder filters that out itself, because "move to where it
 * already is" should not be an option there but *is* the right thing to show when this list is
 * reused elsewhere.
 */
export async function fetchAssignTargets(level: Level | null, skill: string): Promise<AssignTarget[]> {
  const supabase = await createClient();

  let query = supabase
    .from('exams')
    .select('id, number, published')
    .eq('skill', skill)
    .order('number');
  // `.eq('level', null)` matches nothing in PostgREST, so a non-levelled onderdeel (KNM's shape)
  // has to be asked for with `is`. Same trap as `fetchExamsForSkill`.
  query = level === null ? query.is('level', null) : query.eq('level', level);

  const { data } = await query;
  const exams = (data ?? []) as { id: number; number: number; published: boolean }[];
  if (exams.length === 0) return [];

  const ids = exams.map(e => e.id);
  const isOpen = skill === 'schrijven' || skill === 'spreken';
  const { data: items } = await supabase
    .from(isOpen ? 'open_tasks' : 'questions')
    .select('exam_id')
    .in('exam_id', ids);

  const counts = new Map<number, number>();
  for (const row of (items ?? []) as { exam_id: number }[]) {
    counts.set(row.exam_id, (counts.get(row.exam_id) ?? 0) + 1);
  }

  return exams.map(e => ({
    id: e.id,
    number: e.number,
    label: examLabel(e.number),
    published: e.published,
    itemCount: counts.get(e.id) ?? 0,
  }));
}

/** The backlog exam row for one (level, skill), or null if this pair has none yet. */
export async function fetchBacklogExamId(level: Level | null, skill: string): Promise<number | null> {
  const supabase = await createClient();
  let query = supabase
    .from('exams')
    .select('id')
    .eq('skill', skill)
    .eq('number', BACKLOG_EXAM_NUMBER);
  query = level === null ? query.is('level', null) : query.eq('level', level);

  const { data } = await query.maybeSingle();
  return (data as { id: number } | null)?.id ?? null;
}

/**
 * How many recorded candidate answers hang off the items of one stimulus.
 *
 * Moving a stimulus out of a **published** exam is allowed, but the docent is told this number
 * first: `user_question_results` rows point at the questions, so pulling them into another exam
 * changes what an already-recorded score was a score *of*. The rows are not deleted and nothing
 * breaks — but the number is the difference between an informed decision and a surprise.
 *
 * **Reads on the service key, deliberately.** `user_question_results` has exactly one policy —
 * `auth.uid() = user_id` — and no admin SELECT, so the docent's own session sees *zero* rows here.
 * Not an error: an empty result, which is the failure mode where the warning quietly never appears
 * and everyone concludes it works. Same trap as `rubrics`. This is a server-only count of other
 * people's answers, so it does not widen anything the browser can reach.
 */
export async function countRecordedAnswers(stimulusIds: number[]): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  if (stimulusIds.length === 0) return out;

  const supabase = createAdminClient();
  const { data: questions } = await supabase
    .from('questions')
    .select('id, stimulus_id')
    .in('stimulus_id', stimulusIds);

  const rows = (questions ?? []) as { id: number; stimulus_id: number }[];
  if (rows.length === 0) return out;

  const { data: results } = await supabase
    .from('user_question_results')
    .select('question_id')
    .in('question_id', rows.map(q => q.id));

  const perQuestion = new Map<number, number>();
  for (const r of (results ?? []) as { question_id: number }[]) {
    perQuestion.set(r.question_id, (perQuestion.get(r.question_id) ?? 0) + 1);
  }
  for (const q of rows) {
    out.set(q.stimulus_id, (out.get(q.stimulus_id) ?? 0) + (perQuestion.get(q.id) ?? 0));
  }
  return out;
}

/**
 * Recorded candidate answers, per question id.
 *
 * The per-question twin of `countRecordedAnswers` above, and it reads on the service key for the
 * same reason: `user_question_results` has exactly one policy, `auth.uid() = user_id`, so the
 * docent's own session counts zero of other people's answers and the warning that depends on this
 * number would quietly never fire. Server-only — it is a count, never the rows.
 */
export async function countAnswersPerQuestion(questionIds: number[]): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  if (questionIds.length === 0) return out;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('user_question_results')
    .select('question_id')
    .in('question_id', questionIds);

  for (const r of (data ?? []) as { question_id: number }[]) {
    out.set(r.question_id, (out.get(r.question_id) ?? 0) + 1);
  }
  return out;
}
