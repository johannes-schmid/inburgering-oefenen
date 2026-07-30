import { createClient } from '@/lib/supabase/server';
import QuestionsTable, { type QuestionRow } from './_components/QuestionsTable';

export const revalidate = 0;

/**
 * Reads `questions`, not the `questions_flat` compatibility view.
 *
 * The view still exists for surfaces that only need the old `option_a..d` shape, but this
 * list wants what the new model actually holds: which stimulus a question hangs off, how many
 * options it has, and whether an answer key was ever set — the last of which a flat pivot
 * cannot express, because a missing correct option comes back as NULL exactly like a
 * three-option question's absent D.
 */
export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('questions')
    .select(
      'id, sort_order, prompt, explanation, option_layout, review_status, updated_at, ' +
      'question_options(id, is_correct), ' +
      'stimuli!inner(id, sort_order, title, kind, exams!inner(skill, number))'
    )
    .order('id');

  type Raw = {
    id: number;
    sort_order: number;
    prompt: string;
    explanation: string;
    option_layout: QuestionRow['option_layout'];
    review_status: QuestionRow['review_status'];
    updated_at: string | null;
    question_options: { id: number; is_correct: boolean }[];
    stimuli: {
      id: number; sort_order: number; title: string | null; kind: string;
      exams: { skill: string; number: number };
    };
  };

  const rows: QuestionRow[] = ((data ?? []) as unknown as Raw[]).map(r => ({
    id: r.id,
    sort_order: r.sort_order,
    prompt: r.prompt,
    has_explanation: Boolean(r.explanation?.trim()),
    option_layout: r.option_layout,
    option_count: r.question_options?.length ?? 0,
    has_correct: (r.question_options ?? []).some(o => o.is_correct),
    review_status: r.review_status,
    updated_at: r.updated_at,
    stimulus_id: r.stimuli.id,
    stimulus_title: r.stimuli.title,
    stimulus_kind: r.stimuli.kind,
    stimulus_order: r.stimuli.sort_order,
    skill: r.stimuli.exams.skill,
    exam_number: r.stimuli.exams.number,
  }));

  return <QuestionsTable rows={rows} locale={locale} />;
}
