import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Globe } from 'lucide-react';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import Crumbs from '../../_components/glas/Crumbs';
import FaqList from '../../_components/glas/FaqList';
import { Link } from '@/i18n/navigation';
import { getPostBySlug, getPostLocale, getPostSlug, getAllPostParams, hasTranslation } from '@/data/blog-posts';
import ArticleContent from '@/components/ArticleContent';
import BlogUitleg from './BlogUitleg';
import GuideToc from '@/components/guides/GuideToc';
import { guideSections } from '@/lib/guides/sections';
import { SITE_URL, TEACHER_ID, langTag } from '@/lib/site';
import { absUrl, PROVIDER_REF, TEACHER_REF } from '@/lib/schema';

type Props = { params: Promise<{ locale: string; slug: string }> };

/** A related post is stored by its Dutch slug; resolve it to this locale's slug. */
function relatedSlug(nlSlug: string, locale: string): string {
  const target = getPostBySlug(nlSlug);
  return target ? getPostSlug(target, locale) : nlSlug;
}

/** De tekst geknipt op `<!--uitleg:id-->`: tekstblokken met een uitlegelement ertussen. Het element
 *  staat náást `.article-body` en niet erin, zodat de artikelregels (`ul li::before`, `h3`, `p`)
 *  het element niet raken. */
function ArticleWithUitleg({ html, locale }: { html: string; locale: string }) {
  const parts = html.split(/<!--uitleg:([a-z0-9-]+)-->/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <BlogUitleg key={i} id={part} locale={locale} />
          : part.trim() ? <ArticleContent key={i} html={part} className={i > 0 ? 'is-cont' : undefined} /> : null,
      )}
    </>
  );
}

export async function generateStaticParams() {
  return getAllPostParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const lp = getPostLocale(post, locale);
  const nlSlug = post.slug;
  const enSlug = getPostSlug(post, 'en');
  const arSlug = getPostSlug(post, 'ar');
  const canonicalUrl = absUrl(locale, `blog/${getPostSlug(post, locale)}`);
  const translated = hasTranslation(post, locale);

  return {
    title: lp.heroTitle,
    description: lp.description,
    // A locale with no translated body would otherwise be a thin duplicate of the Dutch post.
    robots: translated ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        nl: absUrl('nl', `blog/${nlSlug}`),
        en: absUrl('en', `blog/${enSlug}`),
        ar: absUrl('ar', `blog/${arSlug}`),
        'x-default': absUrl('nl', `blog/${nlSlug}`),
      },
    },
    openGraph: {
      type: 'article',
      title: lp.heroTitle,
      description: lp.description,
      url: canonicalUrl,
      siteName: 'Inburgering Oefenen',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      images: [`${SITE_URL}${post.image}`],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Required for static rendering: without it next-intl treats `getTranslations` as a dynamic
  // API and the page is server-rendered per request — bad for an SEO page.
  //
  // It has NO effect yet. `app/[locale]/layout.tsx` has no `generateStaticParams` and calls
  // `getMessages()` without `setRequestLocale`, so that layout is dynamic — and a dynamic parent
  // forces every child dynamic no matter what the page does. The build confirms it: these routes
  // are ƒ, not ●. Fixing it means adding `generateStaticParams` + `setRequestLocale` to the
  // locale layout, which changes rendering for the whole site and is deliberately out of scope
  // here. This call is kept so the blog is correct the moment that lands.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const lp = getPostLocale(post, locale);
  const translated = hasTranslation(post, locale);
  const canonicalUrl = absUrl(locale, `blog/${getPostSlug(post, locale)}`);
  const sections = guideSections(lp.articleHtml);

  // Rough word count off the rendered body — BlogPosting.wordCount wants prose, not markup.
  const wordCount = lp.articleHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        headline: lp.heroTitle,
        description: lp.description,
        datePublished: post.datePublished,
        dateModified: post.dateModified,
        url: canonicalUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        inLanguage: langTag(locale),
        wordCount,
        image: {
          '@type': 'ImageObject',
          url: `${SITE_URL}${post.image}`,
        },
        // Both anchors are defined in the homepage @graph — reference, don't redefine.
        author: TEACHER_REF,
        publisher: PROVIDER_REF,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('breadcrumb_home'), item: `${SITE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: t('breadcrumb_blog'), item: absUrl(locale, 'blog') },
          { '@type': 'ListItem', position: 3, name: lp.heroTitle },
        ],
      },
      ...(lp.faq.length
        ? [{
            '@type': 'FAQPage',
            '@id': `${canonicalUrl}#faq`,
            mainEntity: lp.faq.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* De kop is die van een kennisgids (GuideArticle.tsx, glas.html §14 "Artikel"): Nevel onder
          de pil door, titel, lead en auteur links op het veld, de foto van het artikel rechts als
          losse tegel. Blog en gids hebben zo één leesvorm. */}
      <Field as="header" variant="nevel" veil className="g-readhead">
        <div className="g-wrap">
          <Crumbs
            items={[
              { label: t('breadcrumb_home'), href: '/' },
              { label: t('breadcrumb_blog'), href: '/blog' },
              { label: lp.breadcrumb },
            ]}
          />
          <div className="g-gh g-gh-photo">
            <div className="g-gh-text">
              <h1>{lp.heroTitle}</h1>
              <p className="g-lead">{lp.heroSubtitle}</p>
              <div className="mt-7">
                <div className="g-byline g-gh-byline">
                  <img src="/images/amber-van-der-zalm-264.webp" alt="" width={46} height={46} />
                  <span className="min-w-0">
                    <Link href="/docent" className="g-ilink !no-underline font-headline font-bold text-[14.5px]">Amber van der Zalm</Link>
                    <small className="block">NT2-docent · {lp.dateLabel}</small>
                  </span>
                  <span className="g-byline-sep" aria-hidden="true" />
                  <span className="g-mono">{t('reading_time', { minutes: post.readingMinutes })}</span>
                </div>
              </div>
              {/* Melding vóór de eerste regel tekst (AI-verordening art. 50 lid 4 en 5): een
                  machinevertaling zonder menselijke controle valt niet onder de uitzondering voor
                  nagekeken tekst. Staat bovenaan, nooit onderaan weggestopt. */}
              {translated && locale !== 'nl' && (
                <p className="g-notice g-notice-glas m-0 mt-6 max-w-[640px]" role="note">
                  <Globe aria-hidden="true" />
                  <span>{t('mt_notice')}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-7">
                <Link href="/oefenen" className={glasButton({ variant: 'navy' })}>
                  {t('sidebar_cta_btn')}
                  <ArrowRight className="rtl-flip" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="g-gh-media">
              <picture>
                <img src={post.image} alt={lp.imageAlt} width={1200} height={630} fetchPriority="high" decoding="async" />
              </picture>
            </div>
          </div>
        </div>
      </Field>

      {/* De leeskaart van de gids: inhoudsopgave links (plakt), één leeskolom rechts, geen zijbalk. */}
      <main className="g-wrap pt-6 pb-16 sm:pb-20">
        <div className="g-prose guide-prose g-blog-prose">
          <GuideToc sections={sections} variant="side" label={t('toc_title')} />

          <article className="g-prose-body min-w-0">
            <GuideToc sections={sections} variant="fold" label={t('toc_title')} />

            {/* Een onvertaalde taal valt terug op de Nederlandse tekst, geforceerd LTR: in de
                Arabische layout staat de interpunctie van Nederlandse tekst anders aan de verkeerde
                kant. De pagina is in deze stand ook noindex. */}
            {!translated && (
              <p className="g-notice m-0 mb-6" role="note">
                <Globe aria-hidden="true" />
                <span>
                  {t('not_translated')}{' '}
                  {/* `locale="nl"`: zonder die prop blijft de link in de huidige taal. */}
                  <Link href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }} locale="nl" className="g-ilink">
                    {t('read_in_dutch')}
                  </Link>
                </span>
              </p>
            )}

            <div {...(translated ? {} : { dir: 'ltr' as const, lang: 'nl' })}>
              {/* De feitenkaart van het artikel, bovenaan zoals de samenvatting van een gids. */}
              {lp.sidebarHtml && (
                <section className="g-summary g-blog-summary mb-10" dangerouslySetInnerHTML={{ __html: lp.sidebarHtml }} />
              )}
              <ArticleWithUitleg html={lp.articleHtml} locale={translated ? locale : 'nl'} />
            </div>

            {/* FAQ als `<details>`: dezelfde tekst als de FAQPage hierboven. */}
            {lp.faq.length > 0 && (
              <section className="mt-14" aria-labelledby="blog-faq-heading">
                <h2 id="blog-faq-heading" className="g-head g-head-2 mb-4">{t('faq_title')}</h2>
                <FaqList className="bg-mist" items={lp.faq.map(f => ({ question: f.q, answer: f.a }))} />
              </section>
            )}

            {/* De nagekeken-door-regel — de USP, gewoon en controleerbaar opgeschreven. */}
            <p className="g-notice m-0 mt-10" role="note">
              <BadgeCheck aria-hidden="true" />
              <span>{t('reviewed_by', { date: post.dateModified })}</span>
            </p>

            {/* De slot-CTA: Nacht stil met een witte knop. Eén donker blok op de pagina. */}
            <Field variant="nacht-stil" className="g-inline-cta !mt-10">
              <span className="flex-1 min-w-[220px]">
                <b>{lp.ctaTitle}</b>
                <small>{lp.ctaDesc}</small>
              </span>
              <Link href={post.ctaHref} className={glasButton({ variant: 'wit' })}>
                {lp.ctaLabel}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
            </Field>
          </article>
        </div>

        {lp.relatedPosts.length > 0 && (
          <nav className="mt-10 bg-wit rounded-g-lg p-6" aria-labelledby="blog-related-heading">
            <h2 id="blog-related-heading" className="g-mono m-0 mb-4">{t('related_title')}</h2>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {lp.relatedPosts.map(r => (
                <li key={r.slug}>
                  <Link
                    href={{ pathname: '/blog/[slug]', params: { slug: relatedSlug(r.slug, locale) } }}
                    className="g-tlink !text-[15px]"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
    </>
  );
}
