import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { fetchOpenTaskChoices } from '@/lib/admin/open-tasks';
import OpgaveForm from '../../_components/OpgaveForm';
import { TASK_TYPE_LABELS, type OpgaveDraft } from '../../_draft';

export const revalidate = 0;

export default async function EditOpgavePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const [{ data }, choices] = await Promise.all([
    supabase
      .from('open_tasks')
      .select(
        'id, exam_id, part_id, skill, sort_order, section_id, task_type, title, prompt_html, ' +
          'bullet_points, email_to, email_cc, email_subject, greeting, closing, min_sentences, ' +
          'form_schema, image_usage, prompt_audio_url, prompt_script, max_record_seconds, ' +
          'model_answer, rubric_id, review_status, ' +
          'open_task_images(id, sort_order, image_url, caption, alt_text, group_label)'
      )
      .eq('id', Number(id))
      .maybeSingle(),
    fetchOpenTaskChoices(),
  ]);

  if (!data) notFound();
  const r = data as unknown as Record<string, unknown>;

  const images = ((r.open_task_images ?? []) as {
    id: number;
    sort_order: number;
    image_url: string;
    caption: string | null;
    alt_text: string | null;
    group_label: string | null;
  }[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(im => ({
      id: im.id,
      image_url: im.image_url,
      caption: im.caption ?? '',
      alt_text: im.alt_text ?? '',
      group_label: im.group_label ?? '',
    }));

  const schema = r.form_schema as { sections?: { title?: string; fields?: unknown[] }[] } | null;

  const initial: OpgaveDraft = {
    id: r.id as number,
    exam_id: r.exam_id as number,
    part_id: (r.part_id as number | null) ?? null,
    skill: r.skill as 'schrijven' | 'spreken',
    sort_order: r.sort_order as number,
    section_id: (r.section_id as number | null) ?? null,
    task_type: r.task_type as OpgaveDraft['task_type'],
    title: (r.title as string | null) ?? '',
    prompt_html: (r.prompt_html as string | null) ?? '',
    bullet_points: Array.isArray(r.bullet_points)
      ? (r.bullet_points as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    email_to: (r.email_to as string | null) ?? '',
    email_cc: (r.email_cc as string | null) ?? '',
    email_subject: (r.email_subject as string | null) ?? '',
    greeting: (r.greeting as string | null) ?? '',
    closing: (r.closing as string | null) ?? '',
    min_sentences: (r.min_sentences as number | null) ?? null,
    form_sections: (schema?.sections ?? []).map(s => ({
      title: s.title ?? '',
      fields: (s.fields ?? []) as OpgaveDraft['form_sections'][number]['fields'],
    })),
    image_usage: r.image_usage as OpgaveDraft['image_usage'],
    prompt_audio_url: (r.prompt_audio_url as string | null) ?? '',
    prompt_script: (r.prompt_script as string | null) ?? '',
    max_record_seconds: (r.max_record_seconds as number) ?? 60,
    model_answer: (r.model_answer as string | null) ?? '',
    rubric_id: (r.rubric_id as number | null) ?? null,
    review_status: r.review_status as 'pending' | 'validated',
    images,
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/admin/opgaven`}
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <ArrowLeft size={15} aria-hidden />
        Opgaven
      </Link>
      <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
        {initial.title || TASK_TYPE_LABELS[initial.task_type]}
      </h1>
      <OpgaveForm
        initial={initial}
        exams={choices.exams}
        parts={choices.parts}
        rubrics={choices.rubrics}
        sections={choices.sections}
        locale={locale}
      />
    </div>
  );
}
