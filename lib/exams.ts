import { createClient } from './supabase/server';
import type { Level, OnderdeelSlug, SkillSlug } from '@/data/skills';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export type ExamRow = {
  id: number;
  /** `null` for KNM, the one onderdeel DUO does not examine per CEFR level. */
  level: Level | null;
  skill: OnderdeelSlug;
  number: number;
  title: string | null;
  is_free: boolean;
  duration_seconds: number;
  published: boolean;
};

const SELECT_COLS = 'id, level, skill, number, title, is_free, duration_seconds, published';

/**
 * Published exams for one skill at one level, ordered 1..10.
 *
 * `level` is required, not defaulted: exam numbers restart per level, so a query filtered on
 * skill alone returns twenty rows where the caller expects ten and silently interleaves A2
 * and B1 in the overview.
 *
 * Returns [] when the `exams` table is missing or empty — the overview page then renders
 * every exam slot in its "coming soon" state rather than failing, which is what we want
 * both before the content is seeded and if the DB is briefly unreachable.
 */
export async function fetchExamsForSkill(level: Level | null, skill: OnderdeelSlug): Promise<ExamRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await levelFilter(
      supabase.from('exams').select(SELECT_COLS),
      level,
    )
      .eq('skill', skill)
      .eq('published', true)
      .order('number');

    if (error || !data) return [];
    return data as ExamRow[];
  } catch {
    return [];
  }
}

/**
 * `.eq('level', null)` matches nothing — the trap a non-levelled onderdeel walks straight
 * into.
 *
 * PostgREST renders `eq.null` as SQL `= NULL`, which is never true, so a KNM query written
 * the obvious way returns zero rows and every KNM surface renders its empty state. Nothing
 * errors and nothing logs. This is the single place that branch lives; any new query that
 * filters `exams`, `exam_attempts` or `sections` by level must go through it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function levelFilter<T extends PostgrestFilterBuilder<any, any, any, any, any>>(
  query: T,
  level: Level | null,
): T {
  return (level === null ? query.is('level', null) : query.eq('level', level)) as T;
}
