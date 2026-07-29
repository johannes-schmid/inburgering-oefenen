import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QuestionForm from '../../_components/QuestionForm';

export const revalidate = 0;

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: question } = await supabase
    .from('questions_flat')
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (!question) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/${locale}/admin/questions`} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Vraag #{id} bewerken</h1>
      </div>
      <p className="text-on-surface-variant text-sm mb-6 ml-8">
        <a href={`/${locale}/oefenvragen/${encodeURIComponent(question.category.toLowerCase().replace(/ /g, '-'))}`} target="_blank" className="hover:underline">
          Bekijk op site →
        </a>
      </p>
      <QuestionForm initial={question} locale={locale} />
    </div>
  );
}
