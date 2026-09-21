import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { parseSkillParam } from '@/i18n/skill-slugs';
import { fetchExamContent } from '@/lib/exam-content';
import { createClient } from '@/lib/supabase/server';
import { canSeeExplanations, ownsModule, planFromMetadata } from '@/lib/entitlements';
import { GUEST_PREVIEW_QUESTIONS } from '@/lib/features';
import AppShell from '../../../../components/AppShell';
import ExamShell from '@/components/exam/ExamShell';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { localeHref } from '@/i18n/paths';

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
  const { locale, level: rawLevel, skill: rawSkill, number: raw } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, parseSkillParam(rawSkill) ?? '');
  const number = parseInt(raw, 10);
  if (!skill || !Number.isInteger(number) || number < 1 || number > skill.examCount) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const path = `/oefenexamen/${level}/${skill.slug}/${number}`;

  const content = await fetchExamContent(level, skill.slug, number);
  if (!content) notFound();

  /**
   * De conversiegrens, sinds 21-09 een overlay in plaats van een omleiding.
   *
   * Een gast mag de eerste `GUEST_PREVIEW_QUESTIONS` vragen van een **gratis** examen echt
   * maken; `ExamShell` legt daarna `GuestSignupOverlay` over het examen heen. Bij een betaald
   * examen blijft het een omleiding naar `/register`: daar gaat het over de rekening en niet
   * over het account, en vijf vragen weggeven uit een module die verkocht wordt is geen proef
   * maar een lek.
   */
  if (!user) {
    if (!content.exam.is_free) redirect(`/${locale}/register?next=${path}`);
    const guestMenu = await fetchPortalMenu();
    return (
      <AppShell locale={locale} email="" active={skill.slug} activeGroup={level} menu={guestMenu} isGuest>
        <div className="px-5 py-7 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <ExamShell
              content={content}
              canSeeExplanations={false}
              guest={{ limit: GUEST_PREVIEW_QUESTIONS, locale, returnTo: path }}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  const plan = planFromMetadata(user.user_metadata);
  // `ownsModule` — not `canOpenExam(plan, …)`. The product is sold per onderdeel, and the plan-only
  // check meant somebody who had bought the Lezen module was still bounced to /premium from every
  // Lezen exam: the dashboard showed the module as owned (it already used `ownsModule`) and the
  // player disagreed, so a paid customer saw "unlocked" and then got the upsell. `ownsModule` still
  // returns true for the legacy all-access plans, so nothing that used to open has closed.
  if (!content.exam.is_free && !ownsModule(user.user_metadata, level, skill.slug)) {
    redirect(localeHref(locale, `premium?vanaf=oefenexamen-${level}-${skill.slug}-${number}`));
  }

  const menu = await fetchPortalMenu();

  return (
    <AppShell locale={locale} email={user.email ?? ''} active={skill.slug} activeGroup={level} menu={menu}>
      <div className="px-5 py-7 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <ExamShell content={content} canSeeExplanations={canSeeExplanations(plan)} />
        </div>
      </div>
    </AppShell>
  );
}
