import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { SKILLS } from '@/data/skills';
import { hasFreePractice, getFreePractice } from '@/data/free-practice';
import { SkillIcon } from '@/components/site';
import { ArrowRight } from 'lucide-react';

type Props = { params: Promise<{ locale: string }> };

const BASE = 'https://inburgeringoefenen.nl';

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'oefenen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${BASE}/${locale}/oefenen`,
      languages: {
        nl: `${BASE}/nl/oefenen`,
        en: `${BASE}/en/oefenen`,
        ar: `${BASE}/ar/oefenen`,
        'x-default': `${BASE}/nl/oefenen`,
      },
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'website',
      url: `${BASE}/${locale}/oefenen`,
      siteName: 'Inburgering Oefenen',
    },
  };
}

/**
 * Entry point of the free funnel: pick which exam component to try.
 * Each active card leads to a 10-question taster at /oefenen/{skill}.
 */
export default async function OefenenPickerPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'oefenen' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  return (
    <main className="bg-surface min-h-screen">
      {/* Header */}
      <section className="px-6 pt-14 pb-12" style={{ background: 'var(--gradient-brand)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
          >
            {t('pick_eyebrow')}
          </span>
          <h1
            className="font-headline font-extrabold text-white tracking-tight mb-4"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', letterSpacing: '-0.03em' }}
          >
            {t('pick_heading')}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('pick_sub')}
          </p>
        </div>
      </section>

      {/* Skill picker */}
      <section className="px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <ul className="grid sm:grid-cols-2 gap-5 list-none p-0 m-0">
            {SKILLS.map(skill => {
              const available = hasFreePractice(skill.slug);
              const set = getFreePractice(skill.slug);
              const genres = set ? Array.from(new Set(set.items.map(i => i.subSkill))) : [];

              if (!available) {
                return (
                  <li key={skill.slug}>
                    <div
                      className="h-full flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-low opacity-70"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <SkillIcon skill={skill.slug} size="lg" />
                        <span className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
                          {t('pick_soon')}
                        </span>
                      </div>
                      <h2 className="font-headline font-bold text-on-surface-variant text-lg tracking-tight">
                        {tSkills(`${skill.key}.name`)}
                      </h2>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{t('pick_soon_note')}</p>
                    </div>
                  </li>
                );
              }

              return (
                <li key={skill.slug}>
                  <a
                    href={`/${locale}/oefenen/${skill.slug}`}
                    className="pick-card h-full flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
                    style={{ boxShadow: 'var(--shadow-card-md)' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <SkillIcon skill={skill.slug} size="lg" />
                      <span
                        className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                        style={{ background: '#f0fdf4', color: '#15803d' }}
                      >
                        {tSkills('free_badge')}
                      </span>
                    </div>

                    <h2 className="font-headline font-bold text-on-surface text-lg tracking-tight">
                      {tSkills(`${skill.key}.name`)}
                    </h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {tSkills(`${skill.key}.tagline`)}
                    </p>

                    <div className="flex flex-wrap gap-1.5 my-1">
                      {genres.map(g => (
                        <span
                          key={g}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-on-surface-variant mt-auto">
                      {t('pick_questions')} · {t('pick_minutes')}
                    </p>
                    <span className="pick-cta inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#a24000' }}>
                      {t('pick_cta')}
                      <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <p className="text-center text-sm text-on-surface-variant mt-10 leading-relaxed">
            {t('pick_footer')}{' '}
            <a href={`/${locale}/oefenexamen/lezen`} className="inline-flex items-center gap-1 font-semibold" style={{ color: '#a24000' }}>
              {t('pick_footer_link')}
              <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>

      <style>{`
        .pick-card {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
        }
        .pick-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,43,109,0.12) !important;
        }
        .pick-card:active { transform: translateY(-1px); }
        .pick-card:hover .pick-cta { text-decoration: underline; }
        @media (prefers-reduced-motion: reduce) { .pick-card { transition: none; } }
      `}</style>
    </main>
  );
}
