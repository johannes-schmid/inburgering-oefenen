import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm } from '@/lib/entitlements';
import { FEATURES } from '@/lib/features';
import { THEMAS } from '@/data/leren';
import CategoryMark from '@/components/horizon/CategoryMark';
import AppShell from '../components/AppShell';
import { fetchPortalMenu } from '@/lib/portal-menu';
import '@/app/glas-leerlaag.css';
import CourseRoute from '@/components/lessons/CourseRoute';
import { knmRoute } from '@/lib/lessons/track-routes';

/**
 * The index of KNM's seven lesson modules.
 *
 * `/leren/[slug]` shipped with the fork and had no index — the KNM portal reached it from a
 * `useState` view inside one client page, which is the SPA this portal was rebuilt away from.
 *
 * **The whole surface is behind `FEATURES.leren`**, which was off because there was no lesson
 * content. It is on now that KNM's seven thema's are seeded. Flipping it off again turns this
 * page into a 404 rather than an empty list, which is the honest failure: a lesson index with
 * no lessons is worse than no lesson index.
 */
type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'KNM lesmodules | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

export default async function LerenIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!FEATURES.leren) notFound();

  const t = await getTranslations('knm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/leren`);

  const meta = user.user_metadata ?? {};
  const owns = ownsKnm(meta);

  const menu = await fetchPortalMenu();

  const route = await knmRoute({ locale, userId: user.id, owns, open: 'leren' });

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="leren"
      activeGroup="knm"
      menu={menu}
      course={
        <CourseRoute
          courseLabel="KNM"
          done={route.done}
          total={route.total}
          blocks={route.blocks}
          backHref={`/${locale}/dashboard/knm`}
          nextHref={`/${locale}/dashboard/knm`}
        />
      }
    >
      <div className="g-leer gl-shell">
        <div className="gl-course gl-narrow">
          <header className="gl-course-title">
            <CategoryMark category="knm" size={64} />
            <div>
              <h1 className="g-head gl-title">{t('leren_title')}</h1>
              <p className="gl-learn">{t('leren_lede')}</p>
            </div>
          </header>

          <ol className="gl-themes">
            {THEMAS.map((thema, i) => {
              /**
               * Thema 1 is open to everyone with an account — the same shape as exam 1 being
               * free. It is the sample that makes the module worth paying for, and the KNM
               * platform gated it the same way.
               */
              const free = i === 0;
              const openable = free || owns;
              const href = openable
                ? `/${locale}/leren/${thema.slug}`
                : `/${locale}/dashboard/pakketten?onderdeel=knm&vanaf=leren-${thema.slug}`;

              return (
                <li key={thema.slug}>
                  <a href={href} className={`gl-next gl-theme${openable ? '' : ' is-locked'}`}>
                    <span className="gl-L">{i + 1}</span>
                    <span className="gl-next-copy">
                      <b>{thema.title}</b>
                      <span className="gl-theme-sub">{t('sections_count', { count: thema.sections.length })}</span>
                    </span>
                    <span className="gl-next-go" aria-hidden>
                      {openable ? <ArrowRight size={17} strokeWidth={2.4} className="rtl-flip" /> : <Lock size={15} strokeWidth={2.3} />}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
