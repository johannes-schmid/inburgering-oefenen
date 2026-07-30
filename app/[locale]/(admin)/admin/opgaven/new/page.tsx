import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchOpenTaskChoices } from '@/lib/admin/open-tasks';
import OpgaveForm from '../_components/OpgaveForm';
import { emptyDraft } from '../_draft';

export const revalidate = 0;

export default async function NewOpgavePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ skill?: string }>;
}) {
  const { locale } = await params;
  const { skill } = await searchParams;
  const choices = await fetchOpenTaskChoices();

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
        Nieuwe opgave
      </h1>
      <OpgaveForm
        initial={emptyDraft(skill === 'spreken' ? 'spreken' : 'schrijven')}
        exams={choices.exams}
        parts={choices.parts}
        rubrics={choices.rubrics}
        sections={choices.sections}
        locale={locale}
      />
    </div>
  );
}
