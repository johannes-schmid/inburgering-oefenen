import Link from 'next/link';
import { Plus, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { categoryLabel, rubricCategory } from '@/lib/rubrics';
import { SKILLS } from '@/data/skills';
import { TASK_TYPE_LABELS, type TaskType } from './_draft';

export const revalidate = 0;

/**
 * Every Schrijven and Spreken opgave, grouped by exam.
 *
 * The point of the grouping is the count: Schrijven needs 4 tasks per exam and Spreken 16, and
 * `exam_publish_issues()` refuses to publish anything short. A flat list hides how far from
 * complete each exam is, which is the only question worth asking on this screen.
 */
export default async function OpgavenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('open_tasks')
    .select(
      'id, exam_id, sort_order, skill, task_type, title, image_usage, review_status, rubric_id, ' +
        'model_answer, prompt_audio_url, exams!inner(number, published), ' +
        'open_task_images(id)'
    )
    .order('sort_order');

  type Raw = {
    id: number;
    exam_id: number;
    sort_order: number;
    skill: 'schrijven' | 'spreken';
    task_type: TaskType;
    title: string | null;
    image_usage: 'none' | 'describe' | 'choose' | 'cover_all';
    review_status: 'pending' | 'validated';
    rubric_id: number | null;
    model_answer: string | null;
    prompt_audio_url: string | null;
    exams: { number: number; published: boolean };
    open_task_images: { id: number }[];
  };
  const rows = (data ?? []) as unknown as Raw[];

  const expected = (skill: string) => SKILLS.find(s => s.slug === skill)?.itemCount ?? 0;

  // One card per exam slot that either has tasks or is exam 1 — the slot everyone starts with.
  const examKeys = [...new Set(rows.map(r => `${r.skill}:${r.exams.number}:${r.exam_id}`))].sort();
  const starters = ['schrijven', 'spreken']
    .map(s => `${s}:1`)
    .filter(k => !examKeys.some(e => e.startsWith(`${k}:`)));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Opgaven
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            De schrijf- en spreekopdrachten. Schrijven heeft 4 opgaven per examen nodig, Spreken 16.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/opgaven/new`}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors"
        >
          <Plus size={16} aria-hidden />
          Nieuwe opgave
        </Link>
      </header>

      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-outline-variant p-6 text-sm text-on-surface-variant leading-relaxed">
          Er zijn nog geen schrijf- of spreekopgaven. Tot die er zijn, kunnen kandidaten die twee
          onderdelen niet oefenen — het examen bestaat wel, maar staat leeg.
        </div>
      )}

      {examKeys.map(key => {
        const [skill, number, examId] = key.split(':');
        const group = rows.filter(r => r.exam_id === Number(examId)).sort((a, b) => a.sort_order - b.sort_order);
        const need = expected(skill);
        const complete = group.length >= need && group.every(r => r.review_status === 'validated' && r.rubric_id);

        return (
          <section key={key} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-outline">
                {skill} — examen {number}
                {group[0]?.exams.published && ' · gepubliceerd'}
              </h2>
              <span
                className={`text-xs font-bold tabular-nums ${
                  complete ? 'text-primary' : 'text-secondary'
                }`}
              >
                {group.length} van {need} opgaven
              </span>
            </div>

            <div className="rounded-xl border border-outline-variant overflow-hidden divide-y divide-outline-variant/60">
              {group.map(r => {
                const issues = [
                  !r.rubric_id && 'geen rubriek',
                  r.review_status !== 'validated' && 'niet gevalideerd',
                  !r.model_answer?.trim() && 'geen voorbeeldantwoord',
                  r.skill === 'spreken' && !r.prompt_audio_url && 'geen audio',
                ].filter(Boolean) as string[];

                return (
                  <Link
                    key={r.id}
                    href={`/${locale}/admin/opgaven/${r.id}/edit`}
                    className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface-container-low transition-colors"
                  >
                    <span className="text-xs font-bold text-outline w-6 tabular-nums">{r.sort_order}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-on-surface truncate">
                        {r.title || TASK_TYPE_LABELS[r.task_type]}
                      </span>
                      <span className="block text-xs text-on-surface-variant">
                        {categoryLabel(rubricCategory({ task_type: r.task_type, image_usage: r.image_usage }))}
                        {r.open_task_images.length > 0 && ` · ${r.open_task_images.length} plaatje(s)`}
                      </span>
                    </span>
                    {issues.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-secondary shrink-0">
                        <TriangleAlert size={13} aria-hidden />
                        {issues.join(', ')}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {starters.length > 0 && (
        <p className="text-sm text-on-surface-variant">
          Nog niets voor{' '}
          {starters.map(s => s.replace(':', ' ')).join(' en ')}.{' '}
          <Link href={`/${locale}/admin/opgaven/new`} className="text-primary font-medium">
            Begin daar
          </Link>
          .
        </p>
      )}
    </div>
  );
}
