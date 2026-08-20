/**
 * One kennisgids — `/inburgering/[slug]`, `/knm/[thema]` and `/taalexamens/[slug]` all render this.
 *
 * Every URL this file produces comes from `guideHref()` / `hubHref()` in `data/guides/helpers.ts`.
 * It used to decide them inline, three times, as `section === 'inburgering' ? … : '/knm'` — which
 * compiles perfectly against a third section and silently serves it under `/knm/[thema]`.
 *
 * Shaped after `blog/[slug]/page.tsx`, which is the only page on the site with real long-form
 * prose and already solves the hard parts: `.article-layout`, the `ArticleContent` body renderer,
 * the untranslated-locale fallback forced to LTR, and the FAQ block that mirrors the `FAQPage`
 * JSON-LD. What differs is deliberate:
 *
 * - **The draft notice.** A `draft` guide renders with a banner saying so. It is reachable so the
 *   docent can review it, and `noindex` plus its absence from the hub and the sitemap are what
 *   keep it unpublished. A draft that looked published would be the whole review gate defeated.
 * - **The reviewed-by line names the reviewer**, not just a date. On a published guide that line
 *   is the E-E-A-T signal and the claim the section rests on, so it is rendered from
 *   `reviewedBy`/`reviewedOn` — the fields the type requires on a reviewed guide — rather than
 *   from `dateModified`, which any edit moves.
 */
import { getTranslations } from 'next-intl/server';
import { PenLine } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ArticleContent from '@/components/ArticleContent';
import JsonLd from '@/components/JsonLd';
import { absUrl, breadcrumbs } from '@/lib/schema';
import { ORG_ID, TEACHER_ID, langTag } from '@/lib/site';
import { Breadcrumb } from '@/components/site';
import { FEATURES } from '@/lib/features';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { getGuideLocale, hasTranslation, relatedGuides, guideHref, hubHref } from '@/data/guides/helpers';
import type { Guide } from '@/data/guides/types';

export default async function GuideArticle({
  guide,
  locale,
}: {
  guide: Guide;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'guides' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const lg = getGuideLocale(guide, locale);
  const translated = hasTranslation(guide, locale);
  const siblings = relatedGuides(guide);
  const posts = FEATURES.blog
    ? guide.relatedPosts.map(slug => getPostBySlug(slug)).filter(Boolean)
    : [];

  const hub = hubHref(guide.section);

  /* `Article`, deliberately not `BlogPosting`: a kennisgids is a maintained reference page, not a
   * dated post, and the type is the honest one. `author` and `publisher` are references to the
   * nodes the homepage and `/docent` own — never restated here.
   *
   * A draft carries no structured data at all. Rich data on a noindex page contradicts the page's
   * own meta tag, which is exactly the rule that keeps B1 free of a Course node. */
  const selfUrl = absUrl(locale, `${guide.section}/${guide.slug}`);
  const wordCount = lg.articleHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  const jsonLd = guide.status !== 'reviewed' || !translated ? null : {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${selfUrl}#article`,
        headline: lg.heroTitle,
        description: lg.description,
        datePublished: guide.datePublished,
        dateModified: guide.dateModified,
        url: selfUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': selfUrl },
        inLanguage: langTag(locale),
        wordCount,
        author: { '@id': TEACHER_ID },
        publisher: { '@id': ORG_ID },
      },
      breadcrumbs(
        locale,
        tB('home'),
        [{ name: tB(guide.section), path: guide.section }, { name: guide.breadcrumb }],
        selfUrl,
      ),
      ...(lg.faq.length
        ? [{
            '@type': 'FAQPage',
            '@id': `${selfUrl}#faq`,
            mainEntity: lg.faq.map(f => ({
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
      {jsonLd && <JsonLd data={jsonLd} />}

      <Breadcrumb
        items={[
          { label: tB('home'), href: '/' },
          { label: tB(guide.section), href: hub },
          { label: guide.breadcrumb },
        ]}
      />

      {/* Hero */}
      <div style={{ background: 'var(--gradient-brand)' }} className="pt-12 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 mb-5"
              style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '9999px', padding: '4px 12px' }}
            >
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                {lg.eyebrow}
              </span>
            </div>
            <h1
              className="font-headline font-extrabold text-white mb-5"
              style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              {lg.heroTitle}
            </h1>
            <p className="text-lg mb-8 leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {lg.heroSubtitle}
            </p>
            <div className="flex items-center gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: '2px solid rgba(255,255,255,0.2)' }}
              >
                <img
                  src="/images/marieke-schipper.jpg"
                  alt="Marieke Schipper"
                  width={40}
                  height={40}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  <Link href="/docent" className="text-white no-underline hover:opacity-80 transition-opacity">
                    Marieke Schipper
                  </Link>
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  NT2-docent · {guide.dateLabel} · {t('reading_time', { minutes: guide.readingMinutes })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="bg-surface">
        <div className="article-layout">
          <div
            className="bg-surface-container-lowest rounded-2xl p-8 md:p-10"
            style={{ boxShadow: '0 2px 32px rgba(0,43,109,0.06)' }}
          >
            {/* An unreviewed guide says so, on the page, in every locale. */}
            {guide.status === 'draft' && (
              <div className="info-box mb-6">
                <p>{t('draft_notice')}</p>
              </div>
            )}

            {/* An untranslated locale falls back to the Dutch body, forced LTR: inside the Arabic
                layout (dir="rtl") Dutch text renders with its punctuation on the wrong side. The
                page is noindex in this state. Same handling as a blog post. */}
            {translated ? (
              <ArticleContent html={lg.articleHtml} />
            ) : (
              <>
                <div className="info-box mb-6">
                  <p>
                    {t('not_translated')}{' '}
                    <Link
                      href={guideHref(guide)}
                      locale="nl"
                    >
                      {t('read_in_dutch')}
                    </Link>
                  </p>
                </div>
                <div dir="ltr" lang="nl">
                  <ArticleContent html={lg.articleHtml} />
                </div>
              </>
            )}

            {lg.faq.length > 0 && (
              <section className="mt-12">
                <h2
                  className="font-headline font-bold text-on-surface mb-2"
                  style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}
                >
                  {t('faq_title')}
                </h2>
                <div className="article-faq article-body">
                  {lg.faq.map(f => (
                    <div key={f.q} className="article-faq-item">
                      <p className="article-faq-q">{f.q}</p>
                      <p>{f.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Only a reviewed guide can make the claim, because only it has the fields. */}
            {guide.status === 'reviewed' && guide.reviewedBy && guide.reviewedOn && (
              <p
                className="mt-10 pt-6 text-sm text-on-surface-variant"
                style={{ borderTop: '1px solid rgba(196,198,210,0.3)' }}
              >
                {t('reviewed_by', {
                  name: guide.reviewedBy,
                  date: new Date(guide.reviewedOn).toLocaleDateString(langTag(locale), {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </p>
            )}

            <div className="mt-8 rounded-2xl p-8 text-center" style={{ background: 'var(--gradient-brand)' }}>
              <p className="font-headline font-bold text-white text-xl mb-3">{lg.ctaTitle}</p>
              <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {lg.ctaDesc}
              </p>
              <Link
                href={guide.ctaHref}
                className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-sm no-underline hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] transition-opacity"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', textDecoration: 'none' }}
              >
                {lg.ctaLabel}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M3 7h8M7 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <aside className="sidebar">
            <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--gradient-brand)' }}>
              <div className="flex justify-center mb-3">
                <PenLine className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.85)' }} aria-hidden="true" />
              </div>
              <h2 className="font-headline font-bold text-white text-lg mb-2">{t('sidebar_cta_title')}</h2>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {t('sidebar_cta_desc')}
              </p>
              <Link
                href="/oefenen"
                className="block bg-secondary-container text-on-secondary-container px-4 py-2.5 rounded-xl font-bold text-sm text-center no-underline hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] transition-opacity"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', textDecoration: 'none' }}
              >
                {t('sidebar_cta_btn')}
              </Link>
            </div>

            {lg.sidebarHtml && <div dangerouslySetInnerHTML={{ __html: lg.sidebarHtml }} />}

            {siblings.length > 0 && (
              <div
                className="bg-surface-container-lowest rounded-2xl p-6"
                style={{ boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                  {t('related_title')}
                </h2>
                <div className="flex flex-col gap-4">
                  {siblings.map((g, i) => {
                    const sl = getGuideLocale(g, locale);
                    return (
                      <div key={g.slug}>
                        {i > 0 && <div className="h-px bg-surface-container mb-4" />}
                        <Link
                          href={guideHref(g)}
                          className="block no-underline group"
                          style={{ textDecoration: 'none' }}
                        >
                          <p className="text-sm text-on-surface font-semibold leading-snug mb-1 group-hover:text-primary transition-colors">
                            {sl.heroTitle}
                          </p>
                          <p className="text-xs text-on-surface-variant">{sl.description}</p>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div
                className="bg-surface-container-lowest rounded-2xl p-6"
                style={{ boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                  {t('related_posts_title')}
                </h2>
                <div className="flex flex-col gap-4">
                  {posts.map((post, i) => {
                    const lp = getPostLocale(post!, locale);
                    return (
                      <div key={post!.slug}>
                        {i > 0 && <div className="h-px bg-surface-container mb-4" />}
                        <Link
                          href={{ pathname: '/blog/[slug]', params: { slug: getPostSlug(post!, locale) } }}
                          className="block no-underline group"
                          style={{ textDecoration: 'none' }}
                        >
                          <p className="text-sm text-on-surface font-semibold leading-snug mb-1 group-hover:text-primary transition-colors">
                            {lp.heroTitle}
                          </p>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
