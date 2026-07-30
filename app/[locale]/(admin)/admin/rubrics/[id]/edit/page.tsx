import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { categoryLabel, type RubricCriterion, type RubricSkill } from '@/lib/rubrics';
import RubricForm from '../../_components/RubricForm';
import type { RubricDraft } from '../../_draft';

export const revalidate = 0;

export default async function EditRubricPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('rubrics')
    .select('id, skill, task_type, version, criteria, system_prompt, active')
    .eq('id', Number(id))
    .maybeSingle();

  if (!data) notFound();
  const row = data as {
    id: number;
    skill: RubricSkill;
    task_type: string;
    version: number;
    criteria: unknown;
    system_prompt: string | null;
    active: boolean;
  };

  // Whether a save may mutate this row or has to mint a new version. Counted here rather than
  // guessed from `active`: a deactivated rubric can still have graded hundreds of candidates.
  const { count } = await supabase
    .from('open_criterion_scores')
    .select('id', { count: 'exact', head: true })
    .eq('rubric_id', row.id);

  const initial: RubricDraft = {
    id: row.id,
    skill: row.skill,
    task_type: row.task_type,
    version: row.version,
    criteria: (Array.isArray(row.criteria) ? row.criteria : []) as RubricCriterion[],
    system_prompt: row.system_prompt ?? '',
    active: row.active,
    used_count: count ?? 0,
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/admin/rubrics`}
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <ArrowLeft size={15} aria-hidden />
        Rubrieken
      </Link>
      <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
        {categoryLabel(row.task_type)}{' '}
        <span className="font-normal text-on-surface-variant">v{row.version}</span>
      </h1>
      <RubricForm initial={initial} locale={locale} />
    </div>
  );
}
