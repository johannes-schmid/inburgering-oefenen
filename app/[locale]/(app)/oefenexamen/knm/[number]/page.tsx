import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { KNM } from '@/data/skills';
import { fetchExamContent } from '@/lib/exam-content';
import { createClient } from '@/lib/supabase/server';
import { canSeeExplanations, ownsKnm, planFromMetadata } from '@/lib/entitlements';
import AppShell from '../../../components/AppShell';
import ExamShell from '@/components/exam/ExamShell';
import { fetchPortalMenu } from '@/lib/portal-menu';

/**
 * The KNM player. A static sibling of `[level]/[skill]/[number]`, for the same reason the
 * public overview is one: KNM has no level, so `/oefenexamen/knm/3` must mean exam 3 of KNM
 * and not skill "3" of level "knm". A static segment shadows its dynamic sibling.
 *
 * Everything downstream of `fetchExamContent(null, 'knm', n)` is shared — `ExamShell` renders
 * KNM's standalone questions single-column off `content.standalone`, and its attempts are
 * recorded with `level: null`.
 */
type Props = { params: Promise<{ locale: string; number: string }> };

export const metadata: Metadata = {
  title: 'KNM oefenexamen | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

export default async function KnmExamPage({ params }: Props) {
  const { locale, number: raw } = await params;
  const number = parseInt(raw, 10);
  if (!Number.isInteger(number) || number < 1 || number > KNM.examCount) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // The conversion wall: an anonymous visitor may browse the portal, but sitting an
  // oefenexamen — the free one included — needs an account.
  if (!user) redirect(`/${locale}/register?next=/oefenexamen/knm/${number}`);

  const content = await fetchExamContent(null, 'knm', number);
  if (!content) notFound();

  const plan = planFromMetadata(user.user_metadata);
  // `ownsKnm`, not `ownsModule(…, 'a2', …)`: KNM is sold as its own level-less module, so an
  // A2 customer does not have it and a KNM customer is not an A2 one.
  if (!content.exam.is_free && !ownsKnm(user.user_metadata)) {
    redirect(`/${locale}/premium?vanaf=oefenexamen-knm-${number}`);
  }

  const menu = await fetchPortalMenu();

  return (
    <AppShell locale={locale} email={user.email ?? ''} active="knm" activeGroup="knm" menu={menu}>
      <div className="px-5 py-7 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <ExamShell content={content} canSeeExplanations={canSeeExplanations(plan)} />
        </div>
      </div>
    </AppShell>
  );
}
