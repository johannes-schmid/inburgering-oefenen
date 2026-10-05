/**
 * `/gidsen` — **Bronnen**: every published guide on the site, in one index.
 *
 * The companion to `/platform`: the header is four plain links (owner's decision, 2026-08-22),
 * so the page behind "Bronnen" has to carry the links the dropdown carried. It is an **index, not a
 * fourth hub**: `/inburgering`, `/taalexamens` and `/knm` keep their own orientation (the three-fase
 * route, the four onderdelen, the eight thema's) and are linked from the topic tiles here.
 *
 * **Only `status: 'reviewed'` is listed**, through `publishedGuides()`. A draft guide is reachable
 * by URL so it can be reviewed, and appears in no list, no hub, no sitemap and no JSON-LD — that
 * gate is the owner's 2026-08-19 decision expressed as a constraint rather than a comment.
 *
 * **Herontwerp 05-10-2026 (eigenaar, referentie deel.com/resources).** Vier blokken, in deze
 * volgorde: een navy band met de titel en een zoekveld; *Begin hier*, drie uitgelichte gidsen met
 * foto (`FEATURED`, met de hand gekozen — de startgids en de twee vragen waar een bezoeker mee
 * binnenkomt); *Kies een onderwerp*, één rij tegels naar de drie hubs, de B1-gids en de ONA-gids;
 * en het raster van alle gidsen met het filter. De vier modulekaarten met chips en de CTA-banner
 * die hier stonden zijn weg: het waren vijf blokken die dezelfde vraag beantwoordden. De nav-link
 * heet sindsdien *Bronnen*; de URL `/gidsen` blijft, dus geen redirect.
 *
 * The blog is here rather than in the bar: it is informational material of the same kind, and a
 * top-level entry for five posts was crowding a header that had to get quieter.
 */
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF, ogImageFor } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { Breadcrumb, SectionHeader } from '@/components/site';
import { CategoryMark, ExamMark } from '@/components/horizon';
import GuideIndex, { GuideFilterProvider, GuideSearch } from './_components/GuideIndex';
import { FEATURES } from '@/lib/features';
import { SKILLS } from '@/data/skills';
import { getSortedPosts, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { publishedGuides, getGuideBySlug, getGuideLocale, guideHref } from '@/data/guides/helpers';
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
      images: ogImageFor(locale),
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

/** De drie uitgelichte gidsen, in deze volgorde: de brede kaart eerst. Alle drie moeten een foto hebben. */
const FEATURED: { section: GuideSection; slug: string }[] = [
  { section: 'inburgering', slug: 'inburgering-stappenplan' },
  { section: 'inburgering', slug: 'moet-ik-inburgeren' },
  { section: 'inburgering', slug: 'wat-kost-inburgeren' },
];

/** The eight KNM thema's are a fact from `SEO/facts.md` §10. */
const KNM_THEMES = 8;

/** How many blog posts the index shows. The blog's own page holds the rest. */
const POSTS_SHOWN = 4;

const TILE =
  'topic-tile flex flex-col items-start gap-3 rounded-2xl p-5 no-underline bg-surface-container-lowest hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default async function GidsenIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'gidsen' });
  const tG = await getTranslations({ locale, namespace: 'guides' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const guides = SECTIONS.flatMap(s =>
    publishedGuides(s.id).map(g => {
      const lg = getGuideLocale(g, locale);
      return {
        slug: g.slug,
        section: g.section,
        title: lg.heroTitle,
        description: lg.description,
        minutes: g.readingMinutes,
        href: guideHref(g, locale),
        /* `/knm/<thema>` and `/taalexamens/<slug>` are not `/inburgering/<slug>` — deriving the
           JSON-LD url from the section is the only thing that keeps this list honest. */
        url: absUrl(locale, `${s.id}/${g.slug}`),
      };
    }),
  );
  const count = (section: GuideSection) => guides.filter(g => g.section === section).length;

  /* Een uitgelichte gids die (nog) niet `reviewed` is valt stil weg — dezelfde poort als de lijst. */
  const featured = FEATURED
    .map(f => getGuideBySlug(f.section, f.slug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g && g.status === 'reviewed' && g.heroImage))
    .map(g => ({ guide: g, lg: getGuideLocale(g, locale), href: guideHref(g, locale) }));

  const posts = FEATURES.blog
    ? getSortedPosts()
        .map(p => ({ slug: getPostSlug(p, locale), ...getPostLocale(p, locale) }))
        .slice(0, POSTS_SHOWN)
    : [];

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
          numberOfItems: guides.length,
          itemListElement: guides.map((g, i) => ({
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

  const heroImg = (g: (typeof featured)[number]['guide'], className: string) =>
    g.heroImage && (
      <picture>
        {g.heroImage.hasWebp && <source srcSet={`/images/guides/${g.heroImage.base}.webp`} type="image/webp" />}
        <img
          src={`/images/guides/${g.heroImage.base}.jpg`}
          alt=""
          width={1800}
          height={760}
          loading="lazy"
          decoding="async"
          className={`${className} w-full object-cover`}
          style={{ objectPosition: g.heroImage.position ?? 'center 45%' }}
        />
      </picture>
    );

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />

      <GuideFilterProvider>
        {/* The band: title, one sentence, the search field. The trail sits inside it. */}
        {/* De band loopt tot de bovenrand: de layout reserveert `--nav-h` voor de zwevende pil,
            en die marge wordt hier teruggenomen en als padding gegeven — anders staat er een
            witte strook tussen de pil en het navy. Zelfde truc als `HorizonHero`. */}
        <header className="bg-primary text-white -mt-[var(--nav-h)]" style={{ paddingTop: 'calc(var(--nav-h) + 1rem)' }}>
          <div className="max-w-6xl mx-auto px-6 pb-12 sm:pb-14">
            <Breadcrumb tone="onDark" className="-mx-6 mb-4" items={[{ label: tB('home'), href: '/' }, { label: t('breadcrumb') }]} />
            <h1
              className="font-headline font-extrabold text-white m-0 mb-3"
              style={{ fontSize: 'clamp(2rem,4.2vw,3rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
            >
              {t('heading')}
            </h1>
            <p className="text-lg leading-relaxed m-0 mb-7 max-w-xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {t('lede')}
            </p>
            <GuideSearch />
          </div>
        </header>

        {/* Begin hier: one wide card and two small ones. The only cards on the page with a photo. */}
        {featured.length === 3 && (
          <section className="px-6 pt-12 pb-4">
            <div className="max-w-6xl mx-auto">
              <h2
                className="font-headline font-extrabold m-0 mb-6"
                style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}
              >
                {t('featured_title')}
              </h2>
              <div className="grid gap-5 lg:grid-cols-2">
                <Link
                  href={featured[0].href}
                  className="featured-card grid sm:grid-cols-2 overflow-hidden rounded-2xl no-underline bg-surface-container-lowest hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ boxShadow: 'var(--shadow-ambient)' }}
                >
                  {heroImg(featured[0].guide, 'h-48 sm:h-full')}
                  <span className="flex flex-col gap-2.5 p-7">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {t(`sec_${featured[0].guide.section}`)} · {tG('reading_time', { minutes: featured[0].guide.readingMinutes })} · {t('pdf_tag')}
                    </span>
                    <span className="font-headline font-extrabold text-on-surface leading-tight" style={{ fontSize: '1.35rem', letterSpacing: '-0.02em', color: '#002b6d', textWrap: 'balance' }}>
                      {featured[0].lg.heroTitle}
                    </span>
                    <span className="text-sm text-on-surface-variant leading-relaxed">{featured[0].lg.description}</span>
                    <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#a24000' }}>
                      {tG('read_guide')}
                      <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
                <div className="grid gap-5 sm:grid-cols-2">
                  {featured.slice(1).map(f => (
                    <Link
                      key={f.guide.slug}
                      href={f.href}
                      className="featured-card flex flex-col overflow-hidden rounded-2xl no-underline bg-surface-container-lowest hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ boxShadow: 'var(--shadow-ambient)' }}
                    >
                      {heroImg(f.guide, 'h-36')}
                      <span className="flex flex-col gap-2 p-5 flex-1">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                          {tG('reading_time', { minutes: f.guide.readingMinutes })} · {t('pdf_tag')}
                        </span>
                        <span className="font-headline font-bold text-on-surface leading-snug" style={{ fontSize: '1.05rem', color: '#002b6d' }}>
                          {f.lg.heroTitle}
                        </span>
                        <span className="text-sm text-on-surface-variant leading-relaxed">{f.lg.description}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Kies een onderwerp: the three hubs and the two single-guide tracks, as one row of tiles.
            Track marks on navy, the traject on the light category tile — the icon split in
            CLAUDE.md §7: a tile names a thing you sit an exam in, a category names what is inside. */}
        <section className="px-6 pt-10 pb-4">
          <div className="max-w-6xl mx-auto">
            <h2
              className="font-headline font-extrabold m-0 mb-6"
              style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}
            >
              {t('topics_title')}
            </h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              <Link href="/inburgering" className={TILE} style={{ boxShadow: 'var(--shadow-ambient)' }}>
                <CategoryMark category="gidsen" size={40} />
                <span className="font-headline font-bold text-sm text-on-surface">{t('topic_traject')}</span>
                <span className="text-xs text-on-surface-variant -mt-2">{t('count_guides', { count: count('inburgering') })}</span>
              </Link>
              <Link href="/taalexamens" className={TILE} style={{ boxShadow: 'var(--shadow-ambient)' }}>
                <ExamMark track="a2" size={40} />
                <span className="font-headline font-bold text-sm text-on-surface">{t('topic_a2')}</span>
                <span className="text-xs text-on-surface-variant -mt-2">{t('count_onderdelen', { count: SKILLS.length })}</span>
              </Link>
              <Link href={{ pathname: '/taalexamens/[slug]', params: { slug: 'b1-examen' } }} className={TILE} style={{ boxShadow: 'var(--shadow-ambient)' }}>
                <ExamMark track="b1" size={40} />
                <span className="font-headline font-bold text-sm text-on-surface">{t('topic_b1')}</span>
                <span className="text-xs text-on-surface-variant -mt-2">{t('count_guides', { count: 1 })}</span>
              </Link>
              <Link href="/knm" className={TILE} style={{ boxShadow: 'var(--shadow-ambient)' }}>
                <ExamMark track="knm" size={40} />
                <span className="font-headline font-bold text-sm text-on-surface">{t('topic_knm')}</span>
                <span className="text-xs text-on-surface-variant -mt-2">{t('count_themas', { count: KNM_THEMES })}</span>
              </Link>
              <Link href={{ pathname: '/inburgering/[slug]', params: { slug: 'ona-examen' } }} className={TILE} style={{ boxShadow: 'var(--shadow-ambient)' }}>
                <ExamMark track="ona" size={40} muted />
                <span className="font-headline font-bold text-sm text-on-surface">{t('topic_ona')}</span>
                <span className="text-xs text-on-surface-variant -mt-2">{t('topic_soon')}</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="pt-8">
          <GuideIndex guides={guides.map(({ url: _url, ...g }) => g)} sections={SECTIONS} />
        </div>
      </GuideFilterProvider>

      {posts.length > 0 && (
        <section className="px-6 py-14 sm:py-16">
          <div className="max-w-6xl mx-auto">
            <SectionHeader eyebrow={t('blog_eyebrow')} title={t('sec_blog')} subtitle={t('sec_blog_sub')} />
            <ul className="grid gap-4 sm:grid-cols-2 list-none p-0 m-0 mb-6">
              {posts.map(post => (
                <li key={post.slug}>
                  <Link
                    href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                    className="guide-card-link block h-full rounded-2xl p-5 no-underline bg-surface-container-lowest hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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
    </main>
  );
}
