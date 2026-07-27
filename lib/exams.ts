import { createClient } from './supabase/server';
import type { SkillSlug } from '@/data/skills';

export type ExamRow = {
  id: number;
  skill: SkillSlug;
  number: number;
  title: string | null;
  is_free: boolean;
  duration_seconds: number;
  published: boolean;
};

const SELECT_COLS = 'id, skill, number, title, is_free, duration_seconds, published';

/**
 * Published exams for one skill, ordered 1..10.
 *
 * Returns [] when the `exams` table is missing or empty — the overview page then renders
 * every exam slot in its "coming soon" state rather than failing, which is what we want
 * both before the content is seeded and if the DB is briefly unreachable.
 */
export async function fetchExamsForSkill(skill: SkillSlug): Promise<ExamRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exams')
      .select(SELECT_COLS)
      .eq('skill', skill)
      .eq('published', true)
      .order('number');

    if (error || !data) return [];
    return data as ExamRow[];
  } catch {
    return [];
  }
}
