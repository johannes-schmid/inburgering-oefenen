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
 * **Redesigned 2026-08-23 (owner's mockups).** The page is the *module overview* — what the
 * platform covers, one card per module, with the startgids above the grid — followed by a compact
 * index of every reviewed guide and the blog.
 *
 * **The delen-route that briefly sat here is gone, deliberately** (owner's instruction, same day):
 * reading a guide step by step is now what the guide's own page does (`components/guides/
 * GuideReader.tsx`), and a second copy of that route on the index was the same experience twice, one
 * click apart. What this page owes the site is a plain visible link to every published guide and to
 * the three hubs — that is the compact index at the bottom, and `tests/public.spec.js` pins it.
 *
 * Superseded note, kept because the reasoning still applies: It was three stacked grids of
 * equal cards; it is now three part cards carrying the reader's own progress, with the open part's
 * guides opened out into their `<h2>` steps (`components/gidsen/GuideIndexExplorer.tsx`). A grid
 * answers "what have you written"; this page's reader is asking "which of these do I need, and how
 * much is left". Nothing about the index's job changed — every published guide still gets a plain
 * internal link from here, and every hub still gets one from a panel sidebar.
 *
 * The blog is here rather than in the bar: it is informational material of the same kind, and a
 * top-level entry for five posts was crowding a header that had to get quieter.
 */
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import GuideCover from '@/components/horizon/GuideCover';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { GradientHero, Breadcrumb, SectionHeader, CTABanner } from '@/components/site';
import { CategoryMark } from '@/components/horizon';
import ModuleOverview from './_components/ModuleOverview';
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

/**
 * The three sections, in funnel order: orientation, then the exams, then the KNM material. The
 * marks are `CategoryMark`'s — the bridge for the traject, the document for the taalexamens, the
 * colonnade for KNM (see that component's header for why those three and not a lucide glyph).
 */
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
    guides: publishedGuides(s.id).map(g => {
      const lg = getGuideLocale(g, locale);
      return {
        slug: g.slug,
        section: g.section,
        title: lg.heroTitle,
        description: lg.description,
        coverGlyph: g.coverGlyph,
        pillar: g.pillar,
        /* `/knm/<thema>` and `/taalexamens/<slug>` are not `/inburgering/<slug>` — deriving the
           JSON-LD url from the section is the only thing that keeps this list honest once the other
           two sections have guides in them. */
        url: absUrl(locale, `${s.id}/${g.slug}`),
      };
    }),
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

      <GradientHero className="pb-16">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full font-bold text-xs uppercase tracking-widest mb-5 bg-secondary-container text-on-secondary-container">
            {t('eyebrow')}
          </span>
          <h1
            className="font-headline font-bold text-white tracking-tight mb-6 leading-tight"
            style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
          >
            {t('heading')}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {t('lede')}
          </p>
        </div>
      </GradientHero>

      {/* The visible trail. The BreadcrumbList JSON-LD was here before the trail was — a crawler
          was told about a parent the reader could not see. */}
      <Breadcrumb items={[{ label: tB('home'), href: '/' }, { label: t('breadcrumb') }]} />

      {/* What the platform covers, module by module — the page's opening question. */}
      <ModuleOverview locale={locale} />

      {/* Every published guide, once, as a compact index — the page's floor rather than a second
          set of cards. The three card grids that used to sit here restated what the module cards
          above and the route already say (owner's instruction, 2026-08-23: remove the bottom part).
          It cannot be dropped entirely, and the reason is mechanical: only one fase's panel is
          visible at a time, so without this list two thirds of the Inburgering guides would have no
          *visible* link on their own index page — a hidden link is enough for a crawler and no use
          to a reader. `tests/public.spec.js` asserts all four are visible here, which is what caught
          it. Each section also names its hub, where its own orientation lives. */}
      <section className="px-6 py-14 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title={t('all_title')} subtitle={t('all_sub')} />
          <div className="grid gap-6 sm:grid-cols-3">
            {sections.map(section => (
              <div key={section.id}>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  <CategoryMark category={section.mark} size={22} />
                  {t(`sec_${section.id}`)}
                </p>
                <ul className="list-none p-0 m-0 flex flex-col gap-2 mb-3">
                  {section.guides.map(guide => (
                    <li key={guide.slug}>
                      {/* A thumbnail, not a card. This page is the index — twenty-one full covers
                          here would turn it into a gallery and push the blog row below the fold.
                          `compact` drops the street, which at 56px is a smudge anyway; the field
                          colour and the glyph still do the identifying work. */}
                      <Link
                        href={guideHref({ section: guide.section, slug: guide.slug })}
                        className="flex items-center gap-3 text-sm font-semibold no-underline leading-snug"
                        style={{ color: '#002b6d', textDecoration: 'none' }}
                      >
                        <GuideCover
                          slug={guide.slug}
                          field={guide.section}
                          glyph={guide.coverGlyph}
                          pillar={guide.pillar}
                          compact
                          className="w-14 shrink-0"
                        />
                        <span className="min-w-0">{guide.title}</span>
                      </Link>
                    </li>
                  ))}
                  {/* A section with nothing reviewed says so rather than showing an empty column. */}
                  {section.guides.length === 0 && (
                    <li className="text-sm text-on-surface-variant leading-snug">
                      {t(`sec_${section.id}_empty`)}
                    </li>
                  )}
                </ul>
                <Link
                  href={hubHref(section.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
                  style={{ color: '#a24000', textDecoration: 'none' }}
                >
                  {t(`sec_${section.id}_hub`)}
                  <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

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
