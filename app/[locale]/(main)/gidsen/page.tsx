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
 * volgorde: een navy band met de titel; *Begin hier*, drie uitgelichte gidsen met
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
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import Crumbs from '../_components/glas/Crumbs';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF, ogImageFor } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import GuideIndex from './_components/GuideIndex';
import { FEATURES } from '@/lib/features';
import { SKILLS } from '@/data/skills';
import { getSortedPosts, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { publishedGuides, getGuideBySlug, getGuideLocale, guideHref } from '@/data/guides/helpers';
import type { GuideSection } from '@/data/guides/types';
import { isOnaAvailable } from '@/lib/ona/access';
import { brochureCover } from '@/lib/guides/brochure';

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

export default async function GidsenIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'gidsen' });
  const tG = await getTranslations({ locale, namespace: 'guides' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const onaLive = isOnaAvailable();

  const guides = await Promise.all(SECTIONS.flatMap(s =>
    publishedGuides(s.id).map(async g => {
      const lg = getGuideLocale(g, locale);
      return {
        cover: await brochureCover(g, locale),
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
  ));
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

  const heroImg = (g: (typeof featured)[number]['guide']) =>
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
          style={{ objectPosition: g.heroImage.position ?? 'center 45%' }}
        />
      </picture>
    );

  return (
    <main>
      <JsonLd data={jsonLd} />

      {/* De kop: Nevel, het leesveld (glas.html §14), onder de pil door. Titel en één zin.
          Het kruimelpad staat erin. */}
      <Field as="header" variant="nevel" veil className="g-readhead">
        <div className="g-wrap">
          <Crumbs items={[{ label: tB('home'), href: '/' }, { label: t('breadcrumb') }]} />
          <h1>{t('heading')}</h1>
          <p className="g-lead">{t('lede')}</p>
        </div>
      </Field>

      {/* Begin hier: uitgelicht + stapel (glas.html §14 "Overzicht"). De enige kaarten met een
          foto, en het is de eigen kopfoto van elke gids — geen verzonnen beeld. */}
      {featured.length === 3 && (
        <section className="g-sec" aria-labelledby="gidsen-featured">
          <div className="g-wrap">
            <SectionHeading id="gidsen-featured" title={t('featured_title')} size="h1" className="mb-8" />
            <div className="g-posts">
              <Link href={featured[0].href} className="g-feat">
                {heroImg(featured[0].guide)}
                <div className="g-glass g-glass-strong">
                  <span className="g-mono">
                    {t(`sec_${featured[0].guide.section}`)} · {tG('reading_time', { minutes: featured[0].guide.readingMinutes })} · {t('pdf_tag')}
                  </span>
                  <h3>{featured[0].lg.heroTitle}</h3>
                  <span className="block mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{featured[0].lg.description}</span>
                  <span className="g-tlink mt-4">
                    {tG('read_guide')}
                    <ArrowRight className="rtl-flip" aria-hidden="true" />
                  </span>
                </div>
              </Link>
              <div className="g-post-stack">
                {featured.slice(1).map(f => (
                  <Link key={f.guide.slug} href={f.href} className="g-post">
                    <span className="g-post-th">{heroImg(f.guide)}</span>
                    <div className="g-post-tx">
                      <span className="g-mono">{tG('reading_time', { minutes: f.guide.readingMinutes })} · {t('pdf_tag')}</span>
                      <h3>{f.lg.heroTitle}</h3>
                      <span className="px-1.5 text-sm leading-relaxed text-ink-2 line-clamp-2">{f.lg.description}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Kies een onderwerp: de drie hubs en de twee tracks met één gids. Track-merk voor wat je
          koopt en examen in doet, categoriemerk voor het traject (CLAUDE.md §7). */}
      <section className={featured.length === 3 ? 'g-sec !pt-0' : 'g-sec'} aria-labelledby="gidsen-topics">
        <div className="g-wrap">
          <SectionHeading id="gidsen-topics" title={t('topics_title')} size="h2" className="mb-6" />
          <div className="g-subjects">
            <Link href="/inburgering" className="g-subject">
              <CategoryMark category="gidsen" size={44} />
              <b>{t('topic_traject')}</b>
              <small>{t('count_guides', { count: count('inburgering') })}</small>
            </Link>
            <Link href="/taalexamens" className="g-subject">
              <ExamMark track="a2" size={44} />
              <b>{t('topic_a2')}</b>
              <small>{t('count_onderdelen', { count: SKILLS.length })}</small>
            </Link>
            <Link href={{ pathname: '/taalexamens/[slug]', params: { slug: 'b1-examen' } }} className="g-subject">
              <ExamMark track="b1" size={44} />
              <b>{t('topic_b1')}</b>
              <small>{t('count_guides', { count: 1 })}</small>
            </Link>
            <Link href="/knm" className="g-subject">
              <ExamMark track="knm" size={44} />
              <b>{t('topic_knm')}</b>
              <small>{t('count_themas', { count: KNM_THEMES })}</small>
            </Link>
            <Link href={{ pathname: '/inburgering/[slug]', params: { slug: 'ona-examen' } }} className="g-subject">
              <ExamMark track="ona" size={44} muted={!onaLive} />
              <b>{t('topic_ona')}</b>
              <small>{onaLive ? t('topic_ona_live') : t('topic_soon')}</small>
            </Link>
          </div>
        </div>
      </section>

      <GuideIndex guides={guides.map(({ url: _url, ...g }) => g)} sections={SECTIONS} />

      {posts.length > 0 && (
        <section className="g-sec" aria-labelledby="gidsen-blog">
          <div className="g-wrap">
            <SectionHeading id="gidsen-blog" title={t('sec_blog')} aside={t('sec_blog_sub')} size="h1" className="mb-8" />
            <ul className="g-grid2 list-none p-0 m-0 mb-6">
              {posts.map(post => (
                <li key={post.slug}>
                  <Link href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }} className="g-textcard">
                    <b>{post.heroTitle}</b>
                    <span>{post.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/blog" className="g-tlink">
              {t('sec_blog_hub')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
