import { createClient } from '@/lib/supabase/server';
import { levelFromSearch } from '@/lib/admin/nav';
import { DEFAULT_LEVEL } from '@/data/skills';
import RubricsTable, { type RubricRow } from './_components/RubricsTable';

export const revalidate = 0;

/**
 * The rubric library: what the docent's criteria are, per exercise category.
 *
 * `used_count` is the number of grades already recorded against a rubric. It is what decides
 * whether an edit may mutate the row or has to mint a new version — a rubric that has graded
 * somebody cannot be rewritten in place without silently changing the meaning of scores already
 * stored against its `rubric_version`.
 */
export default async function RubricsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ niveau?: string }>;
}) {
  const { locale } = await params;
  /**
   * Rubrics are level-only: the KNM tab is not offered here (`AdminNavItem.knm` is unset for
   * this section) because KNM is `scoring: 'mcq'` and has nothing to grade against a rubric.
   * A hand-typed `?niveau=knm` therefore falls back to A2 rather than rendering an empty
   * library that would read as "the KNM rubrics have gone missing".
   */
  const level = levelFromSearch((await searchParams).niveau) ?? DEFAULT_LEVEL;
  const supabase = await createClient();

  const { data } = await supabase
    .from('rubrics')
    .select('id, level, skill, task_type, version, criteria, system_prompt, active, created_at')
    .order('level')
    .order('skill')
    .order('task_type')
    .order('version', { ascending: false });

  type Raw = Omit<RubricRow, 'criterion_count' | 'used_count' | 'has_prompt'> & {
    criteria: unknown;
    system_prompt: string | null;
  };

  const raw = (data ?? []) as unknown as Raw[];

  // One grouped count rather than a query per rubric.
  const { data: usage } = await supabase
    .from('open_criterion_scores')
    .select('rubric_id')
    .not('rubric_id', 'is', null);

  const used = new Map<number, number>();
  for (const u of (usage ?? []) as { rubric_id: number }[]) {
    used.set(u.rubric_id, (used.get(u.rubric_id) ?? 0) + 1);
  }

  const rows: RubricRow[] = raw.map(r => ({
    id: r.id,
    level: r.level,
    skill: r.skill,
    task_type: r.task_type,
    version: r.version,
    active: r.active,
    created_at: r.created_at,
    criterion_count: Array.isArray(r.criteria) ? r.criteria.length : 0,
    has_prompt: Boolean(r.system_prompt?.trim()),
    used_count: used.get(r.id) ?? 0,
  }));

  return <RubricsTable rows={rows} locale={locale} level={level} />;
}
