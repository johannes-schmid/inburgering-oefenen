import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  fetchExamStimuli, fetchPublishIssues, fetchStructureSummary, fetchTaskSummary,
} from '@/lib/admin/stimuli';
import { examLabel, isBacklog } from '@/lib/admin/backlog';
import {
  countRecordedAnswers, fetchAssignTargets, fetchBacklogExamId,
} from '@/lib/admin/backlog-server';
import { formatCount, getFormat, getSkill, levelLabel, type Level } from '@/data/skills';
import { fetchExamSetup } from '@/lib/admin/exam-setup-server';
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
    .select('id, level, skill, number, title, is_free, published, duration_seconds, pass_threshold_pct')
    .eq('id', examId)
    .maybeSingle();

  if (!exam) notFound();
  const row = exam as {
    id: number; level: Level; skill: string; number: number; title: string | null;
    is_free: boolean; published: boolean; duration_seconds: number; pass_threshold_pct: number;
  };
  const skill = getSkill(row.skill);

  const backlogExamId = await fetchBacklogExamId(row.level, row.skill);
  const viewingBacklog = isBacklog(row.number);

  // Schrijven/Spreken are counted per soort opgave, the other two per tekstsoort. Both are
  // fetched rather than branched on, because the branch belongs where the table is rendered.
  const [
    stimuli, issues, tasksRes, targets, backlogStimuli, backlogTasksRes,
    structure, backlogStructure, taskStructure, setup,
  ] =
    await Promise.all([
      fetchExamStimuli(examId),
      fetchPublishIssues(examId),
      supabase
        .from('open_tasks')
        .select('id, sort_order, task_type, title, image_usage, review_status')
        .eq('exam_id', examId)
        .order('sort_order'),
      fetchAssignTargets(row.level, row.skill),
      // The pull-in list. Empty when this *is* the backlog — you cannot take items from yourself.
      backlogExamId && !viewingBacklog ? fetchExamStimuli(backlogExamId) : Promise.resolve([]),
      backlogExamId && !viewingBacklog
        ? supabase
            .from('open_tasks')
            .select('id, sort_order, task_type, title, image_usage, review_status')
            .eq('exam_id', backlogExamId)
            .order('sort_order')
        : Promise.resolve({ data: [] }),
      fetchStructureSummary(examId),
      // What is waiting in the backlog, per tekstsoort — the other half of "wat mis ik nog".
      backlogExamId && !viewingBacklog
        ? fetchStructureSummary(backlogExamId)
        : Promise.resolve([]),
      fetchTaskSummary(examId),
      // The onderdeel's shared setup — edited from here, applies to all ten exams.
      skill ? fetchExamSetup(row.level, skill.slug) : Promise.resolve(null),
    ]);

  // Only for what is in this exam: it is the number the docent needs before moving an item *out*.
  const recordedAnswers = row.published
    ? Object.fromEntries(await countRecordedAnswers(stimuli.map(s => s.id)))
    : {};

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
          {levelLabel(row.level)} {row.skill} — {examLabel(row.number).toLowerCase()}
        </h1>
      </div>
      <p className="text-sm text-on-surface-variant mb-6 ml-8">
        {viewingBacklog
          ? 'Werk hier items uit zonder ze aan een oefenexamen te binden. Wijs ze daarna toe met “Verplaats naar”.'
          : skill
            ? `${formatCount(getFormat(row.level, skill.slug).itemCount)} opgaven · ${Math.round(row.duration_seconds / 60)} minuten · oefengrens ${row.pass_threshold_pct}%`
            : `${Math.round(row.duration_seconds / 60)} minuten`}
      </p>

      <ExamBuilder
        locale={locale}
        exam={row}
        stimuli={stimuli}
        issues={issues}
        targets={targets.filter(t => t.id !== examId)}
        backlogStimuli={backlogStimuli}
        backlogTasks={(backlogTasksRes.data ?? []) as {
          id: number; sort_order: number; task_type: string;
          title: string | null; image_usage: string; review_status: string;
        }[]}
        recordedAnswers={recordedAnswers}
        viewingBacklog={viewingBacklog}
        structure={structure}
        backlogStructure={backlogStructure}
        taskStructure={taskStructure}
        setup={setup}
        tasks={(tasksRes.data ?? []) as {
          id: number; sort_order: number; task_type: string;
          title: string | null; image_usage: string; review_status: string;
        }[]}
      />
    </div>
  );
}
