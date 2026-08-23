import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HorizonBanner } from '@/components/horizon';
import { routing } from '@/i18n/routing';
import { SKILLS } from '@/data/skills';
import { DEFAULT_LEVEL } from '@/data/skills';
import { hasFreePractice, getFreePractice } from '@/data/free-practice';
import { b1TasterSkills } from '@/lib/free-practice-b1';
import { SkillIcon } from '@/components/site';
import { ArrowRight } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { langTag, WEBSITE_ID } from '@/lib/site';
import { absUrl, breadcrumbs, PROVIDER_REF } from '@/lib/schema';

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
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  /* ── Structured data ──────────────────────────────────────────────────────
   * A `CollectionPage` whose `ItemList` is the four onderdelen, in the taxonomy's order. This
   * page is the entry point of the free funnel and carried no structured data at all, while
   * also being absent from the sitemap — the two omissions this milestone closes.
   *
   * Every onderdeel is listed, including the two whose taster does not exist yet: the list
   * describes the exam, and the cards on the page say which are available. What the list must
   * not do is point at a URL that redirects, so the two without a taster link to their
   * oefenexamen overview instead.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absUrl(locale, 'oefenen')}#page`,
        url: absUrl(locale, 'oefenen'),
        name: t('meta_title'),
        description: t('meta_description'),
        inLanguage: langTag(locale),
        isPartOf: { '@id': WEBSITE_ID },
        provider: PROVIDER_REF,
        mainEntity: {
          '@type': 'ItemList',
          '@id': `${absUrl(locale, 'oefenen')}#list`,
          numberOfItems: SKILLS.length,
          itemListElement: SKILLS.map((skill, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: tSkills(`${skill.key}.name`),
            url: hasFreePractice(skill.slug)
              ? absUrl(locale, `oefenen/${skill.slug}`)
              : absUrl(locale, `oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`),
          })),
        },
      },
      breadcrumbs(locale, tB('home'), [{ name: t('breadcrumb'), path: 'oefenen' }]),
    ],
  };

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />
      {/* Header */}
      <section className="relative overflow-hidden px-6 pt-14 pb-16" style={{ background: 'var(--gradient-brand)' }}>
        {/* No sun: the header is centred, so there is no empty flank for the accent to live in
            and it would land on the copy. */}
        <HorizonBanner seed={6} sun={false} />
        <div className="relative max-w-4xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
          >
            {t('pick_eyebrow')}
          </span>
          <h1
            className="font-headline font-extrabold text-white mb-4"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.06, textWrap: 'balance' }}
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
          {/* The A2 block gained a heading when the B1 block was added: an unlabelled grid
              followed by a labelled one reads as the second being an exception to the first. */}
          <h2 className="font-headline font-bold text-on-surface text-xl tracking-tight mb-5">
            {t('a2_heading')}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-5 list-none p-0 m-0">
            {SKILLS.map(skill => {
              const available = hasFreePractice(skill.slug);
              const set = getFreePractice(skill.slug);
              const genres = set ? Array.from(new Set(set.items.map(i => i.subSkill))) : [];

              /**
               * Schrijven and Spreken have no anonymous taster and cannot have one: every answer
               * is graded by a model, which costs money per submission, so it has to be attributable
               * to an account before it runs. They therefore point at oefenexamen 1 — free, but
               * behind a login. The player redirects to /login?next= itself, so signing up lands the
               * candidate straight in the exercise rather than back on this page.
               *
               * The two-free-exercises limit is not enforced here; `lib/grading-limits.ts` counts
               * actual graded submissions. This card only has to state it honestly.
               */
              const accountRequired = !available && skill.scoring === 'open';

              if (accountRequired) {
                return (
                  <li key={skill.slug}>
                    <a
                      href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/${skill.slug}/1`}
                      className="pick-card h-full flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
                      style={{ boxShadow: 'var(--shadow-card-md)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <SkillIcon skill={skill.slug} size="lg" />
                        <span
                          className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                          style={{ background: '#eef4ff', color: '#002b6d' }}
                        >
                          {t('pick_account_badge')}
                        </span>
                      </div>

                      <h2 className="font-headline font-bold text-on-surface text-lg tracking-tight">
                        {tSkills(`${skill.key}.name`)}
                      </h2>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {tSkills(`${skill.key}.tagline`)}
                      </p>

                      <p className="text-xs text-on-surface-variant mt-auto">
                        {t('pick_account_note')}
                      </p>
                      <span className="pick-cta inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#a24000' }}>
                        {t('pick_account_cta')}
                        <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    </a>
                  </li>
                );
              }

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
                        style={{ background: 'rgba(254,118,44,0.14)', color: '#a24000' }}
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

          {/* ── The B1 tasters ───────────────────────────────────────────────────
              A second block rather than a level switcher on the cards above: A2 is the offer
              most visitors came for and it keeps the whole first screen. Only the onderdelen
              with a source exam appear — `b1TasterSkills()` is the same list the route's
              `generateStaticParams` uses, so this can never link a URL that 404s.

              B1 Luisteren is absent and stays absent until DUO's B1 Luisteren format has been
              counted off real material (`data/skills.ts`). */}
          {b1TasterSkills().length > 0 && (
            <div className="mt-12">
              <h2 className="font-headline font-bold text-on-surface text-xl tracking-tight mb-1">
                {t('b1_heading')}
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-5 max-w-2xl">
                {t('b1_sub')}
              </p>
              <ul className="grid sm:grid-cols-2 gap-5 list-none p-0 m-0">
                {b1TasterSkills().map(slug => (
                  <li key={slug}>
                    <a
                      href={`/${locale}/oefenen/b1/${slug}`}
                      className="pick-card h-full flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
                      style={{ boxShadow: 'var(--shadow-card-md)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <SkillIcon skill={slug} size="lg" />
                        <span
                          className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(254,118,44,0.14)', color: '#a24000' }}
                        >
                          {tSkills('free_badge')}
                        </span>
                      </div>

                      <h3 className="font-headline font-bold text-on-surface text-lg tracking-tight">
                        {tSkills(`${slug}.name`)} B1
                      </h3>
                      {/* Its own line, not `skills.<slug>.tagline` — that tagline names A2's
                          genres (advertenties, folders, formulieren) and B1 Lezen is websites,
                          studiemateriaal and brieven van instanties. Reusing it would describe
                          the wrong exam on the card that sells the level. */}
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {t('b1_card_body')}
                      </p>

                      <p className="text-xs text-on-surface-variant mt-auto">
                        {t('pick_questions')} · {t('pick_minutes')}
                      </p>
                      <span className="pick-cta inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#a24000' }}>
                        {t('pick_cta')}
                        <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-center text-sm text-on-surface-variant mt-10 leading-relaxed">
            {t('pick_footer')}{' '}
            <a href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/lezen`} className="inline-flex items-center gap-1 font-semibold" style={{ color: '#a24000' }}>
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
