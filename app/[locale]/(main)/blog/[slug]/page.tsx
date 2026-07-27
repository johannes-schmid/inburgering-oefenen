import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import POSTS, { getPostBySlug, getPostLocale, getPostSlug, getAllPostParams } from '@/data/blog-posts';
import ArticleContent from '@/components/ArticleContent';

type Props = { params: Promise<{ locale: string; slug: string }> };

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
  const canonicalSlug = getPostSlug(post, locale);
  return {
    title: post.title,
    description: lp.description,
    alternates: {
      canonical: `https://inburgeringoefenen.nl/${locale}/blog/${canonicalSlug}`,
      languages: {
        nl: `https://inburgeringoefenen.nl/nl/blog/${nlSlug}`,
        en: `https://inburgeringoefenen.nl/en/blog/${enSlug}`,
        ar: `https://inburgeringoefenen.nl/ar/blog/${arSlug}`,
        'x-default': `https://inburgeringoefenen.nl/nl/blog/${nlSlug}`,
      },
    },
    openGraph: {
      type: 'article',
      publishedTime: post.datePublished,
      images: ['https://inburgeringoefenen.nl/images/marieke-schipper.jpg'],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });
  const lp = getPostLocale(post, locale);
  const canonicalSlug = getPostSlug(post, locale);
  const canonicalUrl = `https://inburgeringoefenen.nl/${locale}/blog/${canonicalSlug}`;
  const langCode = locale === 'nl' ? 'nl-NL' : locale === 'ar' ? 'ar' : 'en';

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonicalUrl}#article`,
    headline: lp.heroTitle,
    description: lp.description,
    datePublished: post.datePublished,
    dateModified: post.datePublished,
    url: canonicalUrl,
    inLanguage: langCode,
    image: { '@type': 'ImageObject', url: 'https://inburgeringoefenen.nl/images/marieke-schipper.jpg' },
    author: { '@id': 'https://inburgeringoefenen.nl/#teacher' },
    publisher: { '@id': 'https://inburgeringoefenen.nl/#organization' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* Breadcrumb */}
      <div className="bg-surface-container-low border-b" style={{ borderColor: 'rgba(196,198,210,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">{t('breadcrumb_home')}</Link>
          <span className="text-outline">›</span>
          <Link href="/blog" className="hover:text-primary transition-colors">{t('breadcrumb_blog')}</Link>
          <span className="text-outline">›</span>
          <span className="text-on-surface font-medium">{lp.heroTitle}</span>
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
              {post.heroSubtitle}
            </p>
            <div className="flex items-center gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.2)' }}>
                <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  <Link href="/docent" className="text-white no-underline hover:opacity-80 transition-opacity">Marieke Schipper</Link>
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>NT2-docent · {post.dateLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <main className="bg-surface">
        <div className="article-layout">
          {/* Main content */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-10" style={{ boxShadow: '0 2px 32px rgba(0,43,109,0.06)' }}>
            <ArticleContent html={post.articleHtml} />

            {/* Inline CTA */}
            <div className="mt-10 rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #002b6d 0%, #1d428a 100%)' }}>
              <p className="font-headline font-bold text-white text-xl mb-3">{post.ctaTitle}</p>
              <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{post.ctaDesc}</p>
              <a href={post.ctaHref} className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-sm" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                {post.ctaLabel}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* CTA box */}
            <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #002b6d 0%, #1d428a 100%)' }}>
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-headline font-bold text-white text-lg mb-2">{t('sidebar_cta_title')}</h3>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('sidebar_cta_desc')}</p>
              <a href="/#oefenvragen" className="block bg-secondary-container text-on-secondary-container px-4 py-2.5 rounded-xl font-bold text-sm text-center" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                {t('sidebar_cta_btn')}
              </a>
            </div>

            {/* Custom sidebar content */}
            {post.sidebarHtml && (
              <div dangerouslySetInnerHTML={{ __html: post.sidebarHtml }} />
            )}

            {/* Related posts */}
            <div className="bg-surface-container-lowest rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">{t('related_title')}</h3>
              <div className="flex flex-col gap-4">
                {post.relatedPosts.map((r, i) => (
                  <div key={r.href}>
                    {i > 0 && <div className="h-px bg-surface-container mb-4" />}
                    <a href={r.href} className="block no-underline group" style={{ textDecoration: 'none' }}>
                      <p className="text-sm text-on-surface font-semibold leading-snug mb-1 group-hover:text-primary transition-colors">{r.title}</p>
                      <p className="text-xs text-on-surface-variant">{r.desc}</p>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
