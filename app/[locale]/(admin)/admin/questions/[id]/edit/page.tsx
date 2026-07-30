import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { fetchStimulusChoices } from '@/lib/admin/stimuli';
import QuestionForm, {
  type OptionDraft,
  type QuestionDraft,
} from '../../_components/QuestionForm';

export const revalidate = 0;

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Reads `questions` (not the flat compatibility view): the editor writes
  // `question_options` rows, so it must load them as rows too.
  const { data: question } = await supabase
    .from('questions')
    .select(
      'id, stimulus_id, sort_order, prompt, explanation, image_url, option_layout, ' +
      'question_options(id, label, sort_order, body, image_urls, image_alt, is_correct)'
    )
    .eq('id', parseInt(id, 10))
    .maybeSingle();

  if (!question) notFound();

  type Row = {
    id: number;
    stimulus_id: number;
    sort_order: number;
    prompt: string;
    explanation: string;
    image_url: string | null;
    option_layout: QuestionDraft['option_layout'];
    question_options: {
      id: number;
      label: OptionDraft['label'];
      sort_order: number;
      body: string | null;
      image_urls: string[];
      image_alt: string | null;
      is_correct: boolean;
    }[];
  };

  const q = question as unknown as Row;
  const stimuli = await fetchStimulusChoices();

  const initial: QuestionDraft = {
    id: q.id,
    stimulus_id: q.stimulus_id,
    sort_order: q.sort_order,
    prompt: q.prompt,
    explanation: q.explanation,
    image_url: q.image_url ?? '',
    option_layout: q.option_layout,
    options: [...(q.question_options ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(o => ({
        id: o.id,
        label: o.label,
        body: o.body ?? '',
        image_urls: o.image_urls ?? [],
        image_alt: o.image_alt ?? '',
        is_correct: o.is_correct,
      })),
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/admin/questions`}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Terug"
        >
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Vraag #{id} bewerken</h1>
      </div>
      <QuestionForm initial={initial} stimuli={stimuli} locale={locale} />
    </div>
  );
}
