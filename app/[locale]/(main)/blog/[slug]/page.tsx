import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Globe } from 'lucide-react';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import CategoryMark from '@/components/horizon/CategoryMark';
import Crumbs from '../../_components/glas/Crumbs';
import FaqList from '../../_components/glas/FaqList';
import { Link } from '@/i18n/navigation';
import { getPostBySlug, getPostLocale, getPostSlug, getAllPostParams, hasTranslation } from '@/data/blog-posts';
import ArticleContent from '@/components/ArticleContent';
import { SITE_URL, TEACHER_ID, langTag } from '@/lib/site';
import { absUrl, PROVIDER_REF, TEACHER_REF } from '@/lib/schema';

type Props = { params: Promise<{ locale: string; slug: string }> };

/** A related post is stored by its Dutch slug; resolve it to this locale's slug. */
function relatedSlug(nlSlug: string, locale: string): string {
  const target = getPostBySlug(nlSlug);
  return target ? getPostSlug(target, locale) : nlSlug;
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

      {/* ── De beeldkop (glas.html §14 "Artikelpagina") ──
          De foto van het artikel is de kop; titel, ondertitel en auteur staan op glas van 86% wit
          (regel 06: tekst nooit op het drukke deel van een beeld). Het veld Nevel loopt onder de
          zwevende pil door, zodat die iets heeft om op te zweven. */}
      <Field as="header" variant="nevel" className="-mt-[var(--nav-h)] pt-[calc(var(--nav-h)+28px)] pb-2">
        <div className="g-wrap">
          <Crumbs
            items={[
              { label: t('breadcrumb_home'), href: '/' },
              { label: t('breadcrumb_blog'), href: '/blog' },
              { label: lp.breadcrumb },
            ]}
            className="mb-5"
          />
          <div className="g-ap-hero g-blog-hero">
            <img src={post.image} alt={lp.imageAlt} width={1200} height={630} />
            <div className="g-glass g-glass-strong">
              <span className="g-mono">{lp.category}</span>
              <h1>{lp.heroTitle}</h1>
              <p className="m-0 mt-3 text-[1.0625rem] leading-relaxed text-ink-2 max-w-[56ch]">{lp.heroSubtitle}</p>
              <div className="g-byline mt-5">
                <img src="/images/amber-van-der-zalm-264.webp" alt="Amber van der Zalm" width={46} height={46} />
                <span>
                  <b>
                    <Link href="/docent" className="g-blog-author">Amber van der Zalm</Link>
                  </b>
                  <small>NT2-docent · {lp.dateLabel}</small>
                </span>
                <span className="g-byline-sep" aria-hidden="true" />
                <span className="g-mono">{t('reading_time', { minutes: post.readingMinutes })}</span>
              </div>
            </div>
          </div>
        </div>
      </Field>

      <main className="g-sec !pt-6">
        <div className="g-wrap">
          {/* Melding vóór de eerste regel tekst (AI-verordening art. 50 lid 4 en 5): een
              machinevertaling zonder menselijke controle valt niet onder de uitzondering voor
              nagekeken tekst. Staat bovenaan, nooit onderaan weggestopt. */}
          {translated && locale !== 'nl' && (
            <div className="g-notice g-notice-glas mb-6 max-w-[760px]" role="note">
              <Globe aria-hidden="true" />
              <span>{t('mt_notice')}</span>
            </div>
          )}

          <div className="g-blog-grid">
            <article className="g-blog-body">
              {/* Een onvertaalde taal valt terug op de Nederlandse tekst. Forceer LTR eromheen: in
                  de Arabische layout (dir="rtl") staat de interpunctie van Nederlandse tekst anders
                  aan de verkeerde kant. De pagina is in deze stand ook noindex. */}
              {translated ? (
                <ArticleContent html={lp.articleHtml} />
              ) : (
                <>
                  <div className="g-notice mb-6" role="note">
                    <Globe aria-hidden="true" />
                    <span>
                      {t('not_translated')}{' '}
                      {/* `locale="nl"`: zonder die prop blijft de link in de huidige taal en wijst
                          "lees in het Nederlands" naar de pagina waar de lezer al staat. `post.slug`
                          is de Nederlandse slug, precies wat de Nederlandse route wil. */}
                      <Link href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }} locale="nl" className="g-ilink">
                        {t('read_in_dutch')}
                      </Link>
                    </span>
                  </div>
                  <div dir="ltr" lang="nl">
                    <ArticleContent html={lp.articleHtml} />
                  </div>
                </>
              )}

              {/* FAQ als `<details>`: een blok van acht open antwoorden duwt de CTA en de
                  gerelateerde artikelen ver onder de vouw. Dezelfde tekst als de FAQPage hierboven. */}
              {lp.faq.length > 0 && (
                <section className="mt-12" aria-labelledby="blog-faq-heading">
                  <h2 id="blog-faq-heading" className="g-head g-head-2 mb-4">{t('faq_title')}</h2>
                  <FaqList className="bg-mist" items={lp.faq.map(f => ({ question: f.q, answer: f.a }))} />
                </section>
              )}

              {/* De nagekeken-door-regel — de USP, gewoon en controleerbaar opgeschreven. */}
              <div className="g-notice mt-10" role="note">
                <BadgeCheck aria-hidden="true" />
                <span>{t('reviewed_by', { date: post.dateModified })}</span>
              </div>

              {/* Inline CTA op Nacht stil met een witte knop: geen oranje naast een donker vlak. */}
              <Field variant="nacht-stil" className="g-inline-cta">
                <span className="flex-1 min-w-[200px]">
                  <b>{lp.ctaTitle}</b>
                  <small>{lp.ctaDesc}</small>
                </span>
                <Link href={post.ctaHref} className={glasButton({ variant: 'wit' })}>
                  {lp.ctaLabel}
                  <ArrowRight className="rtl-flip" aria-hidden="true" />
                </Link>
              </Field>
            </article>

            <aside className="g-blog-side">
              <div className="g-blog-card">
                <CategoryMark category="examen" size={44} />
                <h2 className="g-head g-head-3 mt-4">{t('sidebar_cta_title')}</h2>
                <p className="m-0 mt-2 text-sm leading-relaxed text-ink-2">{t('sidebar_cta_desc')}</p>
                <Link href="/oefenen" className={glasButton({ variant: 'navy', size: 'sm', className: 'mt-4 w-full' })}>
                  {t('sidebar_cta_btn')}
                </Link>
              </div>

              {lp.sidebarHtml && (
                <div className="g-blog-sidehtml" dangerouslySetInnerHTML={{ __html: lp.sidebarHtml }} />
              )}

              {lp.relatedPosts.length > 0 && (
                <nav className="g-blog-card" aria-labelledby="blog-related-heading">
                  <h2 id="blog-related-heading" className="g-mono mb-2">{t('related_title')}</h2>
                  <ul className="g-blog-related">
                    {lp.relatedPosts.map(r => (
                      <li key={r.slug}>
                        <Link href={{ pathname: '/blog/[slug]', params: { slug: relatedSlug(r.slug, locale) } }}>
                          <b>{r.title}</b>
                          <small>{r.desc}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
