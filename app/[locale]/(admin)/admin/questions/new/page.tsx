import Link from 'next/link';
import QuestionForm from '../_components/QuestionForm';

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/admin/questions`} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Nieuwe vraag</h1>
      </div>
      <QuestionForm locale={locale} />
    </div>
  );
}
