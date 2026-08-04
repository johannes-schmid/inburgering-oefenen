import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LEVELS, SKILLS, formatCount, getFormat, levelLabel } from '@/data/skills';

export const revalidate = 0;

type ExamRow = {
  id: number;
  level: string;
  skill: string;
  number: number;
  title: string | null;
  is_free: boolean;
  published: boolean;
};

/**
 * The 40 exam slots — 4 skills × 10 — and how full each one is.
 *
 * This replaced a KNM grid that assumed a flat pool of questions carrying an `exam` integer,
 * with hardcoded "40 questions / 7 categories" warnings. Under the stimulus model a question
 * cannot be unassigned (it belongs to a stimulus, which belongs to an exam), so there is no
 * pool to assign from, and the completeness rules live in `exam_publish_issues()` per exam
 * rather than in the component.
 */
export default async function ExamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const [examsRes, questionsRes, tasksRes, stimuliRes] = await Promise.all([
    supabase.from('exams').select('id, level, skill, number, title, is_free, published').order('level').order('skill').order('number'),
    supabase.from('questions').select('exam_id'),
    supabase.from('open_tasks').select('exam_id'),
    supabase.from('stimuli').select('exam_id'),
  ]);

  const exams = (examsRes.data ?? []) as ExamRow[];
  const tally = (rows: { exam_id: number }[] | null) => {
    const acc: Record<number, number> = {};
    for (const r of rows ?? []) acc[r.exam_id] = (acc[r.exam_id] ?? 0) + 1;
    return acc;
  };
  const questionCount = tally(questionsRes.data as { exam_id: number }[] | null);
  const taskCount = tally(tasksRes.data as { exam_id: number }[] | null);
  const stimulusCount = tally(stimuliRes.data as { exam_id: number }[] | null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface">Examens</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Tien oefenexamens per vaardigheid. Klik een examen om de stimuli en opgaven te beheren.
        </p>
      </div>

      <div className="space-y-12">
        {LEVELS.map(level => (
        <div key={level}>
          <h2 className="text-lg font-headline font-extrabold text-on-surface mb-4 pb-2 border-b border-outline-variant">
            Niveau {levelLabel(level)}
          </h2>
          <div className="space-y-9">
        {SKILLS.map(skill => {
          const rows = exams.filter(e => e.level === level && e.skill === skill.slug);
          const open = skill.scoring === 'open';
          // `null` where DUO's format for this level has not been verified — the progress bar
          // and the "complete" check below both fall back to "unknown" rather than to zero,
          // which would mark every empty B1 exam as finished.
          const { itemCount } = getFormat(level, skill.slug);

          return (
            <section key={skill.slug}>
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h3 className="text-base font-headline font-bold text-on-surface capitalize">{skill.slug}</h3>
                <p className="text-xs text-on-surface-variant">
                  {formatCount(itemCount)} {open ? 'opdrachten' : 'vragen'} per examen · {formatCount(getFormat(level, skill.slug).durationMinutes)} min
                </p>
              </div>

              <ul className="grid gap-3 list-none m-0 p-0 sm:grid-cols-2 lg:grid-cols-5">
                {rows.map(exam => {
                  const items = open ? (taskCount[exam.id] ?? 0) : (questionCount[exam.id] ?? 0);
                  const complete = itemCount !== null && items >= itemCount;

                  return (
                    <li key={exam.id}>
                      <Link
                        href={`/${locale}/admin/exams/${exam.id}`}
                        className="block rounded-xl border border-outline-variant p-3.5 no-underline hover:border-primary/50 hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-on-surface">#{exam.number}</span>
                          <span
                            className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              exam.published
                                ? 'bg-success/15 text-success'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {exam.published ? 'live' : 'concept'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant m-0 tabular-nums">
                          {items} / {formatCount(itemCount)} {open ? 'opdrachten' : 'vragen'}
                        </p>
                        {!open && (
                          <p className="text-xs text-on-surface-variant m-0 tabular-nums">
                            {stimulusCount[exam.id] ?? 0} stimuli
                          </p>
                        )}
                        <div className="mt-2 h-1 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className={`h-full rounded-full ${complete ? 'bg-success' : 'bg-secondary'}`}
                            style={{ width: itemCount === null ? '0%' : `${Math.min(100, (items / itemCount) * 100)}%` }}
                          />
                        </div>
                        {exam.is_free && (
                          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-secondary mt-2 mb-0">
                            gratis
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}
