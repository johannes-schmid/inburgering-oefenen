import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { fetchExamStimuli, fetchPublishIssues } from '@/lib/admin/stimuli';
import { getSkill } from '@/data/skills';
import ExamBuilder from '../_components/ExamBuilder';

export const revalidate = 0;

export default async function ExamBuilderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const examId = parseInt(id, 10);
  if (!Number.isInteger(examId)) notFound();

  const supabase = await createClient();
  const { data: exam } = await supabase
    .from('exams')
    .select('id, skill, number, title, is_free, published, duration_seconds, pass_threshold_pct')
    .eq('id', examId)
    .maybeSingle();

  if (!exam) notFound();
  const row = exam as {
    id: number; skill: string; number: number; title: string | null;
    is_free: boolean; published: boolean; duration_seconds: number; pass_threshold_pct: number;
  };
  const skill = getSkill(row.skill);

  const [stimuli, issues, sectionsRes, tasksRes] = await Promise.all([
    fetchExamStimuli(examId),
    fetchPublishIssues(examId),
    supabase.from('sections').select('id, name_nl').eq('topic', row.skill).order('sort_order'),
    supabase
      .from('open_tasks')
      .select('id, sort_order, task_type, title, image_usage, review_status')
      .eq('exam_id', examId)
      .order('sort_order'),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link
          href={`/${locale}/admin/exams`}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Terug naar examens"
        >
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-2xl font-headline font-bold text-on-surface capitalize">
          {row.skill} — examen {row.number}
        </h1>
      </div>
      <p className="text-sm text-on-surface-variant mb-6 ml-8">
        {skill
          ? `${skill.itemCount} opgaven · ${Math.round(row.duration_seconds / 60)} minuten · oefengrens ${row.pass_threshold_pct}%`
          : `${Math.round(row.duration_seconds / 60)} minuten`}
      </p>

      <ExamBuilder
        locale={locale}
        exam={row}
        stimuli={stimuli}
        issues={issues}
        sections={(sectionsRes.data ?? []) as { id: number; name_nl: string }[]}
        tasks={(tasksRes.data ?? []) as {
          id: number; sort_order: number; task_type: string;
          title: string | null; image_usage: string; review_status: string;
        }[]}
      />
    </div>
  );
}
