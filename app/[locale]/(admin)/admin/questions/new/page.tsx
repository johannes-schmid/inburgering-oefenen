import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchStimulusChoices } from '@/lib/admin/stimuli';
import QuestionForm from '../_components/QuestionForm';

export const revalidate = 0;

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const stimuli = await fetchStimulusChoices();

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
        <h1 className="text-2xl font-headline font-bold text-on-surface">Nieuwe vraag</h1>
      </div>
      <QuestionForm locale={locale} stimuli={stimuli} />
    </div>
  );
}
