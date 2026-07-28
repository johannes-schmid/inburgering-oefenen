import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PenLine } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getPostBySlug, getPostLocale, getPostSlug, getAllPostParams, hasTranslation } from '@/data/blog-posts';
import ArticleContent from '@/components/ArticleContent';
import { SITE_URL, ORG_ID, TEACHER_ID, langTag } from '@/lib/site';

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
  const canonicalUrl = `${SITE_URL}/${locale}/blog/${getPostSlug(post, locale)}`;
  const translated = hasTranslation(post, locale);

  return {
    title: lp.heroTitle,
    description: lp.description,
    // A locale with no translated body would otherwise be a thin duplicate of the Dutch post.
    robots: translated ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        nl: `${SITE_URL}/nl/blog/${nlSlug}`,
        en: `${SITE_URL}/en/blog/${enSlug}`,
        ar: `${SITE_URL}/ar/blog/${arSlug}`,
        'x-default': `${SITE_URL}/nl/blog/${nlSlug}`,
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
  const canonicalUrl = `${SITE_URL}/${locale}/blog/${getPostSlug(post, locale)}`;

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
        author: { '@id': TEACHER_ID },
        publisher: { '@id': ORG_ID },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('breadcrumb_home'), item: `${SITE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: t('breadcrumb_blog'), item: `${SITE_URL}/${locale}/blog` },
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

      {/* Breadcrumb */}
      <div className="bg-surface-container-low border-b" style={{ borderColor: 'rgba(196,198,210,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center flex-wrap gap-2 text-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">{t('breadcrumb_home')}</Link>
          <span className="text-outline">›</span>
          <Link href="/blog" className="hover:text-primary transition-colors">{t('breadcrumb_blog')}</Link>
          <span className="text-outline">›</span>
          <span className="text-on-surface font-medium">{post.breadcrumb}</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #002b6d 0%, #1d428a 100%)' }} className="pt-12 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-5" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '9999px', padding: '4px 12px' }}>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.8)' }}>{lp.category}</span>
            </div>
            <h1 className="font-headline font-extrabold text-white mb-5" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {lp.heroTitle}
            </h1>
            <p className="text-lg mb-8 leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {lp.heroSubtitle}
            </p>
            <div className="flex items-center gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.2)' }}>
                <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  <Link href="/docent" className="text-white no-underline hover:opacity-80 transition-opacity">Marieke Schipper</Link>
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  NT2-docent · {post.dateLabel} · {t('reading_time', { minutes: post.readingMinutes })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <main className="bg-surface">
        <div className="article-layout">
          <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-10" style={{ boxShadow: '0 2px 32px rgba(0,43,109,0.06)' }}>
            <img
              src={post.image}
              alt={post.imageAlt}
              width={1200}
              height={630}
              className="w-full rounded-xl mb-8"
              style={{ aspectRatio: '1200 / 630', objectFit: 'cover' }}
            />

            {/* An untranslated locale falls back to the Dutch body. Force LTR around it: in the
                Arabic layout (dir="rtl") Dutch text renders with its punctuation flipped to the
                wrong side, which is unreadable. The page is also noindex in this state. */}
            {translated ? (
              <ArticleContent html={lp.articleHtml} />
            ) : (
              <>
                <div className="info-box mb-6">
                  <p>
                    {t('not_translated')}{' '}
                    <Link href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}>
                      {t('read_in_dutch')}
                    </Link>
                  </p>
                </div>
                <div dir="ltr" lang="nl">
                  <ArticleContent html={lp.articleHtml} />
                </div>
              </>
            )}

            {/* FAQ */}
            {lp.faq.length > 0 && (
              <section className="mt-12">
                <h2 className="font-headline font-bold text-on-surface mb-2" style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}>
                  {t('faq_title')}
                </h2>
                <div className="article-faq article-body">
                  {lp.faq.map(f => (
                    <div key={f.q} className="article-faq-item">
                      <p className="article-faq-q">{f.q}</p>
                      <p>{f.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviewed-by line — the USP, stated plainly and verifiably */}
            <p className="mt-10 pt-6 text-sm text-on-surface-variant" style={{ borderTop: '1px solid rgba(196,198,210,0.3)' }}>
              {t('reviewed_by', { date: post.dateModified })}
            </p>

            {/* Inline CTA */}
            <div className="mt-8 rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #002b6d 0%, #1d428a 100%)' }}>
              <p className="font-headline font-bold text-white text-xl mb-3">{lp.ctaTitle}</p>
              <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{lp.ctaDesc}</p>
              <Link
                href={post.ctaHref}
                className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-sm no-underline hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] transition-opacity"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', textDecoration: 'none' }}
              >
                {lp.ctaLabel}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #002b6d 0%, #1d428a 100%)' }}>
              <div className="flex justify-center mb-3">
                <PenLine className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.85)' }} aria-hidden="true" />
              </div>
              <h2 className="font-headline font-bold text-white text-lg mb-2">{t('sidebar_cta_title')}</h2>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('sidebar_cta_desc')}</p>
              <Link
                href="/oefenen"
                className="block bg-secondary-container text-on-secondary-container px-4 py-2.5 rounded-xl font-bold text-sm text-center no-underline hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] transition-opacity"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', textDecoration: 'none' }}
              >
                {t('sidebar_cta_btn')}
              </Link>
            </div>

            {lp.sidebarHtml && (
              <div dangerouslySetInnerHTML={{ __html: lp.sidebarHtml }} />
            )}

            {/* Related posts */}
            {post.relatedPosts.length > 0 && (
              <div className="bg-surface-container-lowest rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">{t('related_title')}</h2>
                <div className="flex flex-col gap-4">
                  {post.relatedPosts.map((r, i) => (
                    <div key={r.slug}>
                      {i > 0 && <div className="h-px bg-surface-container mb-4" />}
                      <Link
                        href={{ pathname: '/blog/[slug]', params: { slug: relatedSlug(r.slug, locale) } }}
                        className="block no-underline group"
                        style={{ textDecoration: 'none' }}
                      >
                        <p className="text-sm text-on-surface font-semibold leading-snug mb-1 group-hover:text-primary transition-colors">{r.title}</p>
                        <p className="text-xs text-on-surface-variant">{r.desc}</p>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
