import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HorizonBanner, ValidationChip } from '@/components/horizon';
import { routing } from '@/i18n/routing';
import { KNM, KNM_SLUG, SKILLS, type Level } from '@/data/skills';
import { DEFAULT_LEVEL } from '@/data/skills';
import { hasFreePractice } from '@/data/free-practice';
import { b1TasterSkills } from '@/lib/free-practice-b1';
import { hasDbFreePractice } from '@/lib/free-practice-db';
import FreePracticeChooser, { type ChooserPart, type ChooserTrack } from './_components/FreePracticeChooser';
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

  /**
   * The four examens and what is inside each — resolved here, on the server, and handed to the
   * client component whole. See `FreePracticeChooser` for why nothing is derived over there.
   *
   * A taalonderdeel lands in one of three states and each is a fact about the data, never a
   * hand-maintained list:
   *
   *  - **a free taster** — `hasFreePractice` (A2's four indexed URLs, which keep a static
   *    fallback) or `b1TasterSkills()` (B1, whose route 404s without a published source exam);
   *  - **free with an account** — Schrijven and Spreken, at both levels. Every answer is marked
   *    per criterium by a model, which costs money per submission, so it has to hang off an
   *    account; oefenexamen 1 is `is_free` at both levels, so what the card promises is real;
   *  - **absent** — B1 Luisteren, which has no content and no counted format (`data/skills.ts`).
   *    Omitted rather than shown as "binnenkort": a card would advertise a level of an onderdeel
   *    nobody has authored a single item at.
   *
   * ONA carries no parts at all, which is what makes its tile the roadmap statement instead of a
   * control — one condition, not a second flag to keep in step.
   */
  const b1Tasters = b1TasterSkills();

  const partsAt = (level: Level): ChooserPart[] =>
    SKILLS.flatMap<ChooserPart>(skill => {
      const taster = level === DEFAULT_LEVEL ? hasFreePractice(skill.slug) : b1Tasters.includes(skill.slug);
      const name = tSkills(`${skill.key}.name`);
      if (taster) {
        return [{
          slug: skill.slug,
          name,
          note: t('row_free'),
          href: level === DEFAULT_LEVEL ? `/${locale}/oefenen/${skill.slug}` : `/${locale}/oefenen/b1/${skill.slug}`,
          needsAccount: false,
        }];
      }
      if (skill.scoring === 'open') {
        return [{
          slug: skill.slug,
          name,
          note: t('row_account'),
          href: `/${locale}/oefenexamen/${level}/${skill.slug}/1`,
          needsAccount: true,
        }];
      }
      return [];
    });

  const tracks: ChooserTrack[] = [
    {
      id: 'knm',
      name: tSkills('knm.name'),
      // A fact about the exam DUO sets, not about our bank: DUO names eight thema's. Our
      // question bank covers seven of them (`KNM_THEMES`), which is a different sentence and is
      // not the one a tile should make.
      subtitle: t('track_themes', { count: 8 }),
      blurb: t('knm_sub'),
      parts: hasDbFreePractice(null, KNM_SLUG)
        ? [{ slug: KNM_SLUG, name: tSkills('knm.name'), note: t('row_free'), href: `/${locale}/oefenen/knm`, needsAccount: false }]
        : [],
    },
    {
      id: 'a2',
      name: t('track_a2'),
      subtitle: t('track_parts', { count: SKILLS.length }),
      blurb: t('track_blurb_open'),
      parts: partsAt('a2'),
    },
    {
      id: 'b1',
      name: t('track_b1'),
      subtitle: t('track_parts', { count: partsAt('b1').length }),
      blurb: t('track_blurb_open'),
      parts: partsAt('b1'),
    },
    { id: 'ona', name: t('track_ona'), subtitle: '', blurb: '', parts: [] },
  ];

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

      {/* The picker itself. Two flows out of one data set — see FreePracticeChooser. */}
      <section className="px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <FreePracticeChooser tracks={tracks} locale={locale} />

          <div className="mt-8 flex justify-center">
            <ValidationChip>{t('docent_note')}</ValidationChip>
          </div>

          <p className="text-center text-sm text-on-surface-variant mt-8 leading-relaxed">
            {t('pick_footer')}{' '}
            <a href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/lezen`} className="inline-flex items-center gap-1 font-semibold" style={{ color: '#a24000' }}>
              {t('pick_footer_link')}
              <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>

      <style>{`
        .track-tile, .part-row {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .part-row:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,43,109,0.10) !important; }
        .track-tile:hover { transform: translateY(-2px); }
        .track-tile:active, .part-row:active { transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .track-tile, .part-row { transition: none; }
          .track-tile:hover, .part-row:hover { transform: none; }
        }
      `}</style>
    </main>
  );
}
