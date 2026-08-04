import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchExamContent } from '@/lib/exam-content';
import { createClient } from '@/lib/supabase/server';
import { canOpenExam, canSeeExplanations, planFromMetadata } from '@/lib/entitlements';
import AppShell from '../../../../components/AppShell';
import ExamShell from '@/components/exam/ExamShell';

type Props = {
  params: Promise<{ locale: string; level: string; skill: string; number: string }>;
};

/**
 * The exam player lives in the **study portal**, not on the public site.
 *
 * `(main)/oefenexamen/[skill]` stays public — it is the funnel and SEO surface listing the
 * ten slots. Sitting an exam requires an account, exactly as on KNM: free means exam 1 at no
 * cost, not exam 1 without signing up. The anonymous surface is the 10-question taster at
 * `/oefenen/[skill]`, which is deliberately static and needs no login.
 */
export const metadata: Metadata = {
  title: 'Oefenexamen | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

export default async function ExamPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug, number: raw } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  const number = parseInt(raw, 10);
  if (!skill || !Number.isInteger(number) || number < 1 || number > skill.examCount) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/oefenexamen/${level}/${skill.slug}/${number}`);

  const content = await fetchExamContent(level, skill.slug, number);
  if (!content) notFound();

  const plan = planFromMetadata(user.user_metadata);
  if (!canOpenExam(plan, content.exam.is_free)) {
    redirect(`/${locale}/premium?vanaf=oefenexamen-${level}-${skill.slug}-${number}`);
  }

  return (
    <AppShell locale={locale} email={user.email ?? ''} active={skill.slug}>
      <div className="px-5 py-7 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <ExamShell content={content} canSeeExplanations={canSeeExplanations(plan)} />
        </div>
      </div>
    </AppShell>
  );
}
