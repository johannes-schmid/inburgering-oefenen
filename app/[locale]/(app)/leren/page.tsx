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

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="leren"
      activeGroup="knm"
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <header className="mb-7">
            <h1
              className="font-headline font-extrabold text-on-surface"
              style={{ fontSize: 'clamp(1.5rem,3.2vw,1.95rem)', letterSpacing: '-0.03em' }}
            >
              {t('leren_title')}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5" style={{ lineHeight: 1.65, maxWidth: '58ch' }}>
              {t('leren_lede')}
            </p>
          </header>

          <ol className="flex flex-col gap-2.5 list-none p-0 m-0">
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
                  <a href={href} className={`leren-row no-underline${openable ? '' : ' is-locked'}`}>
                    <CategoryMark category="knm" size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="leren-title">{thema.title}</span>
                      <span className="leren-sub">{t('sections_count', { count: thema.sections.length })}</span>
                    </span>
                    <span className="leren-action" aria-hidden="true">
                      {openable ? <ArrowRight size={16} strokeWidth={2.3} /> : <Lock size={16} strokeWidth={2.1} />}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <style>{`
        .leren-row { display:flex; align-items:center; gap:14px; padding:14px 16px; background:#fff; border:1.5px solid var(--color-surface-container-high); border-radius:14px; box-shadow:var(--shadow-card); transition:transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease, border-color .2s ease; }
        .leren-row:hover { transform:translateY(-2px); border-color:#b8cef5; box-shadow:0 8px 22px rgba(0,43,109,0.11); }
        .leren-row:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:2px; }
        .leren-row.is-locked { background:var(--color-surface-container-low); }
        .leren-row.is-locked:hover { border-color:#fdc9a3; box-shadow:0 8px 22px rgba(254,118,44,0.14); }
        .leren-title { display:block; font-family:var(--font-headline); font-size:0.94rem; font-weight:700; color:var(--color-on-surface); letter-spacing:-0.01em; }
        .leren-sub { display:block; font-size:0.76rem; color:var(--color-outline); margin-top:2px; }
        .leren-action { display:flex; align-items:center; justify-content:center; flex-shrink:0; min-width:34px; height:34px; color:var(--color-primary); }
        .leren-row.is-locked .leren-action { color:var(--color-outline); }
        @media (prefers-reduced-motion: reduce) { .leren-row { transition:none; } .leren-row:hover { transform:none; } }
      `}</style>
    </AppShell>
  );
}
