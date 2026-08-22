/**
 * `/gidsen` — every published guide on the site, in one index.
 *
 * The companion to `/platform`: the header is four plain links now (owner's decision, 2026-08-22),
 * so the page behind "Gidsen" has to carry the links the dropdown carried. It is an **index, not a
 * fourth hub**: `/inburgering`, `/taalexamens` and `/knm` keep their own orientation (the three-fase
 * route, the four onderdelen, the eight thema's) and are linked from here. `GuideHub`'s own comment
 * records why hubs that drift apart is a mistake this repo has already made once — so nothing here
 * restates a hub's content, it only lists what is published and points at it.
 *
 * **Only `status: 'reviewed'` is listed**, through `publishedGuides()`. A draft guide is reachable
 * by URL so it can be reviewed, and appears in no list, no hub, no sitemap and no JSON-LD — that
 * gate is the owner's 2026-08-19 decision expressed as a constraint rather than a comment.
 *
 * The blog is here rather than in the bar: it is informational material of the same kind, and a
 * top-level entry for five posts was crowding a header that had to get quieter.
 */
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { HorizonBanner, CategoryMark } from '@/components/horizon';
import { SectionHeader, CTABanner } from '@/components/site';
import { FEATURES } from '@/lib/features';
import { getSortedPosts, getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { publishedGuides, getGuideLocale, guideHref, hubHref } from '@/data/guides/helpers';
import type { GuideSection } from '@/data/guides/types';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gidsen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, 'gidsen'),
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, 'gidsen'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

/** The three sections, in funnel order: orientation, then the exams, then the KNM material. */
const SECTIONS: { id: GuideSection; mark: 'gidsen' | 'lezen' | 'knm' }[] = [
  { id: 'inburgering', mark: 'gidsen' },
  { id: 'taalexamens', mark: 'lezen' },
  { id: 'knm', mark: 'knm' },
];

/**
 * Posts that already own a section's ground, by Dutch slug.
 *
 * A section with no reviewed guide yet would otherwise be a heading, a sentence and a link — the
 * thin page this index exists to avoid. Taalexamens is not actually empty: the Lezen and Luisteren
 * posts are two of the four per-onderdeel guides M4 plans, so the section lists them rather than
 * pretending nothing is written. Same call `GuideHub` makes with `HUB_POSTS`, and the same reason:
 * one query, one owning page.
 */
const SECTION_POSTS: Record<GuideSection, string[]> = {
  inburgering: [],
  taalexamens: ['lezen-examen-inburgering-a2', 'luisteren-examen-inburgering-a2'],
  knm: [],
};

/** How many blog posts the index shows. The blog's own page holds the rest. */
const POSTS_SHOWN = 4;

export default async function GidsenIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'gidsen' });
  const tG = await getTranslations({ locale, namespace: 'guides' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const sections = SECTIONS.map(s => ({
    ...s,
    guides: publishedGuides(s.id).map(g => ({
      slug: g.slug,
      href: guideHref(g),
      /* `/knm/<thema>` and `/taalexamens/<slug>` are not `/inburgering/<slug>` — deriving the
         JSON-LD url from the section is the only thing that keeps this list honest once the other
         two sections have guides in them. */
      url: absUrl(locale, `${s.id}/${g.slug}`),
      ...getGuideLocale(g, locale),
    })),
  }));

  /* Per-section posts first, so the blog row below can skip what is already on the page — the
     same article twice in one index reads as padding. */
  const sectionPosts = new Map(
    SECTIONS.map(s => [
      s.id,
      FEATURES.blog
        ? SECTION_POSTS[s.id]
            .map(getPostBySlug)
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .map(p => ({ slug: getPostSlug(p, locale), ...getPostLocale(p, locale) }))
        : [],
    ]),
  );
  const shown = new Set([...sectionPosts.values()].flat().map(p => p.slug));

  const posts = FEATURES.blog
    ? getSortedPosts()
        .map(p => ({ slug: getPostSlug(p, locale), ...getPostLocale(p, locale) }))
        .filter(p => !shown.has(p.slug))
        .slice(0, POSTS_SHOWN)
    : [];

  const all = sections.flatMap(s => s.guides);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absUrl(locale, 'gidsen')}#page`,
        url: absUrl(locale, 'gidsen'),
        name: t('meta_title'),
        description: t('meta_description'),
        inLanguage: langTag(locale),
        isPartOf: { '@id': WEBSITE_ID },
        provider: PROVIDER_REF,
        mainEntity: {
          '@type': 'ItemList',
          '@id': `${absUrl(locale, 'gidsen')}#list`,
          numberOfItems: all.length,
          /* Published guides only — the same set the page renders. A list that named a draft
             would advertise a URL whose own meta tag says `noindex`. */
          itemListElement: all.map((g, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: g.title,
            url: g.url,
          })),
        },
      },
      breadcrumbs(locale, tB('home'), [{ name: t('breadcrumb'), path: 'gidsen' }]),
    ],
  };

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />

      <section className="relative overflow-hidden px-6 pt-14 pb-16" style={{ background: 'var(--gradient-brand)' }}>
        <HorizonBanner seed={9} sun={false} />
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
        </div>
      </section>

      {sections.map((section, idx) => (
        <section
          key={section.id}
          className={`px-6 py-14 sm:py-16 ${idx % 2 === 1 ? 'bg-surface-container-low' : ''}`}
        >
          <div className="max-w-5xl mx-auto">
            <SectionHeader
              eyebrow={tG(`${section.id}.eyebrow`)}
              title={t(`sec_${section.id}`)}
              subtitle={t(`sec_${section.id}_sub`)}
            />

            <ul className="grid gap-4 sm:grid-cols-2 list-none p-0 m-0 mb-6">
              {section.guides.map(guide => (
                  <li key={guide.slug}>
                    <Link
                      href={guide.href}
                      className="flex gap-4 h-full rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
                      style={{ boxShadow: 'var(--shadow-ambient)' }}
                    >
                      <CategoryMark category={section.mark} size={36} />
                      <span className="min-w-0">
                        <span className="block font-headline font-bold text-base text-on-surface leading-snug">
                          {guide.title}
                        </span>
                        <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">
                          {guide.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}

              {/* A section with no reviewed guide yet still has to point somewhere real. */}
              {(sectionPosts.get(section.id) ?? []).map(post => (
                <li key={post.slug}>
                  <Link
                    href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                    className="flex gap-4 h-full rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
                    style={{ boxShadow: 'var(--shadow-ambient)' }}
                  >
                    <CategoryMark category={section.mark} size={36} />
                    <span className="min-w-0">
                      <span className="block font-headline font-bold text-base text-on-surface leading-snug">
                        {post.heroTitle}
                      </span>
                      <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">
                        {post.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}

              {section.guides.length === 0 && (sectionPosts.get(section.id) ?? []).length === 0 && (
                <li className="sm:col-span-2">
                  <Link
                    href={hubHref(section.id)}
                    className="flex gap-4 rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
                    style={{ boxShadow: 'var(--shadow-ambient)' }}
                  >
                    <CategoryMark category={section.mark} size={36} />
                    <span className="min-w-0">
                      <span className="block font-headline font-bold text-base text-on-surface leading-snug">
                        {t(`sec_${section.id}_hub`)}
                      </span>
                      <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">
                        {t(`sec_${section.id}_empty`)}
                      </span>
                    </span>
                  </Link>
                </li>
              )}
            </ul>

            {/* The hub link is not a nicety: it is where a section's own orientation lives (the
                three-fase route, the four onderdelen, the eight thema's), which this index
                deliberately does not restate. Suppressed when the section had nothing to list and
                the empty-state card above *is* that link — the same destination twice reads as a
                rendering bug, not as emphasis. */}
            {!(section.guides.length === 0 && (sectionPosts.get(section.id) ?? []).length === 0) && (
            <Link
              href={hubHref(section.id)}
              className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
              style={{ color: '#a24000' }}
            >
              {t(`sec_${section.id}_hub`)}
              <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
            </Link>
            )}
          </div>
        </section>
      ))}

      {posts.length > 0 && (
        <section className="px-6 py-14 sm:py-16 bg-surface-container-low">
          <div className="max-w-5xl mx-auto">
            <SectionHeader eyebrow={t('blog_eyebrow')} title={t('sec_blog')} subtitle={t('sec_blog_sub')} />
            <ul className="grid gap-4 sm:grid-cols-2 list-none p-0 m-0 mb-6">
              {posts.map(post => (
                <li key={post.slug}>
                  <Link
                    href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                    className="block h-full rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
                    style={{ boxShadow: 'var(--shadow-ambient)' }}
                  >
                    <span className="block font-headline font-bold text-base text-on-surface leading-snug">
                      {post.heroTitle}
                    </span>
                    <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">
                      {post.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
              style={{ color: '#a24000' }}
            >
              {t('sec_blog_hub')}
              <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      <section className="px-6 pb-16 pt-14 sm:pt-16">
        <div className="max-w-5xl mx-auto">
          <CTABanner
            eyebrow={t('cta_eyebrow')}
            title={t('cta_title')}
            description={t('cta_desc')}
            button={{ label: t('cta_label'), href: '/oefenen' }}
          />
        </div>
      </section>
    </main>
  );
}
