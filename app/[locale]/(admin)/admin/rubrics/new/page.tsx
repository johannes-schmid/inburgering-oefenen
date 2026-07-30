import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { categoriesForSkill, type RubricSkill } from '@/lib/rubrics';
import RubricForm from '../_components/RubricForm';
import { emptyDraft } from '../_draft';

export const revalidate = 0;

export default async function NewRubricPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ skill?: string; category?: string }>;
}) {
  const { locale } = await params;
  const { skill: rawSkill, category: rawCategory } = await searchParams;

  const skill: RubricSkill = rawSkill === 'spreken' ? 'spreken' : 'schrijven';
  // The category comes off a link in the list, so validate it rather than trusting the query.
  const category = categoriesForSkill(skill).includes(rawCategory as never)
    ? rawCategory
    : undefined;

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/admin/rubrics`}
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <ArrowLeft size={15} aria-hidden />
        Rubrieken
      </Link>
      <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
        Nieuwe rubriek
      </h1>
      <RubricForm initial={emptyDraft(skill, category)} locale={locale} />
    </div>
  );
}
