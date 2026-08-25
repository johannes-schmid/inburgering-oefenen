/**
 * `/platform` — what the site *does*, on one page.
 *
 * It exists because the header stopped being a set of mega-panels (owner's decision, 2026-08-22):
 * four plain links, and the page behind each one does the work the dropdown was doing. That trade
 * is only safe if this page carries the links the panel carried — the four onderdelen, the free
 * taster, the tools and the money page — because a header dropdown is a *site-wide* internal link
 * on every page and this page is not. So the rule for anything added to the platform later: it is
 * listed here, or it has no route in from the chrome at all.
 *
 * **The catalogue and the roadmap are stated separately, in one list.** A2 is live; B1 exists but
 * is `noindex` behind the docent's review gate; ONA is not built. The unbuilt track is
 * rendered as **non-links** with a "binnenkort" chip — the same discipline `TRACKS` uses on the
 * homepage, and the same reason: the site's only claim is that a docent stands behind what is on
 * it, and advertising a level with no reviewed content spends exactly that credibility. A link
 * would also hand a crawler the B1 pages we explicitly tell it to ignore.
 *
 * No prices. `/premium` is the only page with `Offer` nodes and the only place a figure is read
 * from `lib/pricing.ts` — a stale price keeps showing in the SERP after the page is corrected.
 */
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, CalendarClock, MessagesSquare, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { HorizonBanner } from '@/components/horizon';
import { FeatureCard, SectionHeader, SkillCard, CTABanner } from '@/components/site';
import { DEFAULT_LEVEL, formatCount, skillsAtLevel } from '@/data/skills';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'platform' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, 'platform'),
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, 'platform'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

/** The whole traject, in the order a candidate meets it. `live: false` renders the chip. */
const TRACKS = [
  { key: 'a2', live: true, href: '/taalexamens' as const },
  /* B1 is live and linked since 2026-08-23. It could not carry an `href` while it was
     `noindex`: a site-wide-ish link from here would have handed a crawler exactly the pages we
     told it to ignore. That is no longer true, so it links like A2 does. */
  { key: 'b1', live: true, href: '/taalexamens' as const },
  /* KNM went live 2026-08-24 and links to its own overview rather than to `/taalexamens`,
     which is the hub for the four *taalonderdelen* and does not describe it. */
  { key: 'knm', live: true, href: '/oefenexamen/knm' as const },
  { key: 'ona', live: false },
] as const;

const BENEFITS = [
  { key: 'docent', icon: BadgeCheck },
  { key: 'uitleg', icon: MessagesSquare },
  { key: 'rubric', icon: TrendingUp },
  { key: 'plan', icon: CalendarClock },
] as const;

export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'platform' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const skills = skillsAtLevel(DEFAULT_LEVEL);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absUrl(locale, 'platform')}#page`,
        url: absUrl(locale, 'platform'),
        name: t('meta_title'),
        description: t('meta_description'),
        inLanguage: langTag(locale),
        isPartOf: { '@id': WEBSITE_ID },
        provider: PROVIDER_REF,
        mainEntity: {
          '@type': 'ItemList',
          '@id': `${absUrl(locale, 'platform')}#list`,
          numberOfItems: skills.length,
          /* The four onderdelen only. The three unbuilt tracks are announced on the page and are
             deliberately absent here: an `ItemList` entry is a claim that the thing exists at a
             URL, and each of those would need a URL to point at. */
          itemListElement: skills.map((skill, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: tSkills(`${skill.key}.name`),
            url: absUrl(locale, `oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`),
          })),
        },
      },
      breadcrumbs(locale, tB('home'), [{ name: t('breadcrumb'), path: 'platform' }]),
    ],
  };

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />

      <section className="relative overflow-hidden px-6 pt-14 pb-16" style={{ background: 'var(--gradient-brand)' }}>
        {/* No sun disc: the header is centred, so there is no empty flank for the accent and it
            would land on the headline (§7.3). */}
        <HorizonBanner seed={3} sun={false} />
        <div className="relative max-w-4xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
          >
            {t('eyebrow')}
          </span>
          <h1
            className="font-headline font-extrabold text-white mb-4"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.06, textWrap: 'balance' }}
          >
            {t('heading')}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto m-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('lede')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <a
              href={`/${locale}/oefenen`}
              className="inline-flex items-center gap-2 bg-secondary-container px-6 py-3 rounded-full font-bold text-sm button-inner-glow no-underline"
              style={{ color: '#ffffff' }}
            >
              {t('cta_primary')}
              <ArrowRight size={16} className="rtl-flip" aria-hidden="true" />
            </a>
            <Link
              href="/premium"
              className="inline-flex items-center px-6 py-3 rounded-full font-bold text-sm no-underline"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#ffffff' }}
            >
              {t('cta_secondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* The four onderdelen — the same module card the homepage and the overviews use. */}
      <section className="px-6 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow={t('skills_eyebrow')} title={t('skills_heading')} subtitle={t('skills_sub')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {skills.map((skill, i) => (
              <SkillCard
                key={skill.slug}
                skill={skill}
                index={i}
                href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`}
                name={tSkills(`${skill.key}.name`)}
                tagline={tSkills(`${skill.key}.tagline`)}
                examsLabel={t('label_exams', { count: skill.examCount })}
                itemsLabel={t('label_items', { count: formatCount(skill.itemCount) })}
                durationLabel={t('label_duration', { count: formatCount(skill.durationMinutes) })}
                freeNote={t('label_free')}
                cta={t('label_cta')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* The catalogue and the roadmap. */}
      <section className="px-6 py-14 sm:py-16 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow={t('tracks_eyebrow')} title={t('tracks_heading')} subtitle={t('tracks_sub')} />
          <ul className="grid gap-4 sm:grid-cols-2 list-none p-0 m-0">
            {TRACKS.map(track => {
              const body = (
                <>
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className={`font-headline font-bold text-base ${'href' in track ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {t(`track_${track.key}`)}
                    </span>
                    {!track.live && (
                      <span
                        className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fcecdd', color: '#a24000' }}
                      >
                        {t('badge_soon')}
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">
                    {t(`track_${track.key}_sub`)}
                  </span>
                </>
              );
              /* An announced-but-unbuilt track is an `<li>`, not a greyed link: there is nowhere
                 to go, and a disabled anchor still takes focus and still promises a destination. */
              return (
                <li key={track.key}>
                  {'href' in track ? (
                    <Link
                      href={track.href}
                      className="block rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
                      style={{ boxShadow: 'var(--shadow-ambient)' }}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="rounded-2xl p-5 bg-surface-container">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Why practise here — the USP, stated as what the product does rather than as a slogan. */}
      <section className="px-6 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow={t('why_eyebrow')} title={t('why_heading')} subtitle={t('why_sub')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(b => (
              <FeatureCard
                key={b.key}
                icon={b.icon}
                title={t(`why_${b.key}`)}
                description={t(`why_${b.key}_sub`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* The tools. `/inburgering/tools/tijdlijn` is live; the two woordenlijsten are registered
          placeholders, so they are named and not linked. */}
      <section className="px-6 py-14 sm:py-16 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow={t('tools_eyebrow')} title={t('tools_heading')} subtitle={t('tools_sub')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/inburgering/tools/tijdlijn"
              className="block rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: 'var(--shadow-ambient)' }}
            >
              <span className="font-headline font-bold text-base text-on-surface">{t('tool_tijdlijn')}</span>
              <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">{t('tool_tijdlijn_sub')}</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold mt-3" style={{ color: '#a24000' }}>
                {t('tool_open')}
                <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
              </span>
            </Link>
            {(['woorden', 'grammatica'] as const).map(key => (
              <div key={key} className="rounded-2xl p-5 bg-surface-container">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline font-bold text-base text-on-surface-variant">{t(`tool_${key}`)}</span>
                  <span
                    className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                    style={{ background: '#fcecdd', color: '#a24000' }}
                  >
                    {t('badge_soon')}
                  </span>
                </span>
                <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">{t(`tool_${key}_sub`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <CTABanner
            eyebrow={t('cta_eyebrow')}
            title={t('cta_title')}
            description={t('cta_desc')}
            button={{ label: t('cta_primary'), href: '/oefenen' }}
          />
        </div>
      </section>
    </main>
  );
}
