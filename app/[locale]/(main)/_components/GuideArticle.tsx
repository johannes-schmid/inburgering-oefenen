/**
 * One kennisgids — `/inburgering/[slug]`, `/knm/[thema]` and `/taalexamens/[slug]` all render this.
 *
 * Every URL this file produces comes from `guideHref()` / `hubHref()` in `data/guides/helpers.ts`.
 * It used to decide them inline, three times, as `section === 'inburgering' ? … : '/knm'` — which
 * compiles perfectly against a third section and silently serves it under `/knm/[thema]`.
 *
 * **Herontwerp 05-10-2026 (eigenaar, referentie deel.com/hire-in-germany).** De gids is weer één
 * doorlopend artikel: een hero met de foto als tegel rechts, daaronder een plakkende
 * inhoudsopgave links (`GuideToc`) en één leeskolom van ±68 tekens rechts, met de samenvatting
 * van de docent *bovenaan* in plaats van onderaan. De delen-weergave (`GuideReader`), de
 * fasestrook en de zijbalknavigatie zijn van deze pagina af: een A2-lezer op een telefoon kreeg
 * vier schermen chrome vóór hij tekst zag, en de route staat op `/inburgering` zelf.
 *
 * **De gids is als PDF te downloaden** (`/api/guide-pdf/[section]/[slug]`), in de taal van de
 * pagina, achter een e-mailadres (`PdfGate`, 05-10): de download zet de lezer in dezelfde
 * dag-2/dag-7-reeks als een oefentoets, met gidstekst. Een vertaalde PDF draagt dezelfde `translated_note` als de pagina — de docent las het
 * Nederlands, niet deze vertaling, en dat voorbehoud mag een download niet kwijtraken.
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
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ArticleContent from '@/components/ArticleContent';
import JsonLd from '@/components/JsonLd';
import { absUrl, breadcrumbs, PROVIDER_REF, TEACHER_REF } from '@/lib/schema';
import { SITE_URL, langTag } from '@/lib/site';
import { Breadcrumb } from '@/components/site';
import { FEATURES } from '@/lib/features';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { getGuideLocale, hasTranslation, relatedGuides, guideHref, hubHref } from '@/data/guides/helpers';
import { guideSections, guideParts } from '@/lib/guides/sections';
import GuideToc from '@/components/guides/GuideToc';
import { PdfGateProvider, PdfButton } from '@/components/guides/PdfGate';
import type { Guide } from '@/data/guides/types';

const CTA_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-sm no-underline transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

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
  const sections = guideSections(lg.articleHtml);
  const { intro, parts } = guideParts(lg.articleHtml);

  /* `Article`, deliberately not `BlogPosting`: a kennisgids is a maintained reference page, not a
   * dated post, and the type is the honest one. `author` and `publisher` are references to the
   * nodes the homepage and `/docent` own — never restated here.
   *
   * A draft carries no structured data at all. Rich data on a noindex page contradicts the page's
   * own meta tag, which is exactly the rule that keeps B1 free of a Course node. */
  const selfUrl = absUrl(locale, `${guide.section}/${guide.slug}`);
  const wordCount = lg.articleHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const heroSrc = guide.heroImage
    ? `/images/guides/${guide.heroImage.base}.${guide.heroImage.hasWebp ? 'webp' : 'jpg'}`
    : null;

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
        /* `image` alleen als de gids er écht een heeft — één generiek merkplaatje op elk artikel
           is geen afbeelding ván het artikel, en dat is precies wat het veld beweert. */
        ...(heroSrc ? { image: { '@type': 'ImageObject', url: `${SITE_URL}${heroSrc}` } } : {}),
        author: TEACHER_REF,
        publisher: PROVIDER_REF,
      },
      breadcrumbs(
        locale,
        tB('home'),
        [{ name: tB(guide.section), path: guide.section }, { name: lg.breadcrumb }],
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

  const reviewedLine =
    guide.status === 'reviewed' && guide.reviewedBy && guide.reviewedOn
      ? t('reviewed_by', {
          name: guide.reviewedBy,
          date: new Date(guide.reviewedOn).toLocaleDateString(langTag(locale), {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        }) + (locale !== 'nl' ? ` ${t('translated_note')}` : '')
      : null;

  return (
    <PdfGateProvider section={guide.section} slug={guide.slug} locale={locale} title={lg.heroTitle}>
      {jsonLd && <JsonLd data={jsonLd} />}

      {/* Hero: navy band, copy left, the photo as a tile on the right. The trail sits inside the
          band — a grey breadcrumb bar between the white nav and a navy block reads as a gap. */}
      {heroSrc && (
        <link rel="preload" as="image" href={heroSrc} fetchPriority="high" />
      )}
      <header className="guide-hero bg-primary text-white -mt-[var(--nav-h)]" style={{ paddingTop: 'calc(var(--nav-h) + 1rem)' }}>
        <div className="max-w-7xl mx-auto px-6 pb-12 lg:pb-14">
          <Breadcrumb
            tone="onDark"
            className="-mx-6 mb-6"
            items={[
              { label: tB('home'), href: '/' },
              { label: tB(guide.section), href: hub },
              { label: lg.breadcrumb },
            ]}
          />
          <div className={`grid gap-10 items-center print:block ${heroSrc ? 'lg:grid-cols-[minmax(0,1fr)_420px]' : ''}`}>
            <div className="max-w-2xl">
              <h1
                className="font-headline font-extrabold text-white m-0 mb-4"
                style={{ fontSize: 'clamp(2rem,4.2vw,3rem)', letterSpacing: '-0.02em', lineHeight: 1.1, textWrap: 'balance' }}
              >
                {lg.heroTitle}
              </h1>
              <p className="text-lg leading-relaxed m-0 mb-7 max-w-xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {lg.heroSubtitle}
              </p>
              <div className="no-print flex flex-wrap gap-3 mb-8">
                <PdfButton className={`${CTA_BUTTON} bg-secondary-container text-on-secondary-container border-0 cursor-pointer`}>
                  {t('pdf_button')}
                </PdfButton>
                <Link
                  href="/oefenen"
                  className={`${CTA_BUTTON} text-white`}
                  style={{ background: 'rgba(255,255,255,0.14)' }}
                >
                  {t('check_button')}
                  <ArrowRight size={16} className="rtl-flip" aria-hidden="true" />
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <img
                  src="/images/marieke-schipper.webp"
                  alt=""
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-[10px] object-cover object-top flex-shrink-0"
                />
                <span>
                  <Link href="/docent" className="text-white font-semibold no-underline hover:opacity-80">
                    Marieke Schipper
                  </Link>
                  , {t('author_role')} · {lg.dateLabel} · {t('reading_time', { minutes: guide.readingMinutes })}
                </span>
              </div>
            </div>
            {heroSrc && guide.heroImage && (
              <picture className="no-print block">
                {guide.heroImage.hasWebp && (
                  <source srcSet={`/images/guides/${guide.heroImage.base}.webp`} type="image/webp" />
                )}
                <img
                  src={`/images/guides/${guide.heroImage.base}.jpg`}
                  alt={lg.heroImageAlt}
                  width={1800}
                  height={760}
                  className="w-full h-56 sm:h-64 lg:h-72 object-cover rounded-2xl"
                  style={{ objectPosition: guide.heroImage.position ?? 'center 45%' }}
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
            )}
          </div>
        </div>
      </header>

      <main className="bg-surface">
        {/* Eén brede kolom (eigenaar, 05-10, referentie deel.com "quickstart guide"): elke
            H2-sectie is een rij met de kop links en de tekst rechts, zodat de breedte van het
            scherm wordt gebruikt en de lezer per kop weet waar hij is. De inhoudsopgave zweeft
            links onderin (`GuideToc`) en staat niet meer in een zijbalk. */}
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
          <div className="mb-8 lg:mb-0">
            <GuideToc sections={sections} />
          </div>

          <article className="guide-prose min-w-0">
            {/* An unreviewed guide says so, on the page, in every locale. */}
            {guide.status === 'draft' && (
              <div className="info-box mb-6">
                <p>{t('draft_notice')}</p>
              </div>
            )}
            {/* An untranslated locale reads the Dutch body, forced LTR: inside the Arabic layout
                Dutch text renders with its punctuation on the wrong side. The page is noindex in
                this state. */}
            {!translated && (
              <div className="info-box mb-6">
                <p>
                  {t('not_translated')}{' '}
                  <Link href={guideHref(guide, 'nl')} locale="nl">
                    {t('read_in_dutch')}
                  </Link>
                </p>
              </div>
            )}

            <div className="guide-row" dir={translated ? undefined : 'ltr'} lang={translated ? undefined : 'nl'}>
              <div />
              <div className="guide-col">
                {/* The docent's summary, first. It is the answer the reader came for; everything
                    below it is the reasoning. The `sidebarHtml` carries its own "In het kort" lead. */}
                {lg.sidebarHtml && (
                  <section
                    className="guide-summary article-body rounded-2xl px-7 py-6 mb-10 bg-surface-container-low"
                    dangerouslySetInnerHTML={{ __html: lg.sidebarHtml }}
                  />
                )}
                {intro.trim() && <ArticleContent html={intro} />}
              </div>
            </div>

            {parts.map(part => (
              <section key={part.id} className="guide-row guide-section" dir={translated ? undefined : 'ltr'} lang={translated ? undefined : 'nl'}>
                <h2 id={part.id} className="guide-section-title">{part.title}</h2>
                <div className="guide-col">
                  <ArticleContent html={part.html} />
                </div>
              </section>
            ))}

            <div className="guide-row">
              <div />
              <div className="guide-col">
            {/* The FAQ folds: `<details>` and not a client accordion, so the answers stay in the
                DOM for the `FAQPage` JSON-LD and need no JavaScript. */}
            {lg.faq.length > 0 && (
              <section className="mt-14">
                <h2
                  className="font-headline font-bold text-on-surface mb-4"
                  style={{ fontSize: '1.5rem', letterSpacing: '-0.01em' }}
                >
                  {t('faq_title')}
                </h2>
                <div className="faq-folds">
                  {lg.faq.map(f => (
                    <details key={f.q} className="faq-fold">
                      <summary>
                        <span>{f.q}</span>
                      </summary>
                      <p>{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Only a reviewed guide can make the claim, because only it has the fields. On a
                translated page the claim is narrowed in the same sentence: the docent read the
                Dutch, not this rendering of it. */}
            {reviewedLine && (
              <p className="mt-10 text-sm text-on-surface-variant m-0">{reviewedLine}</p>
            )}

            <div className="no-print mt-10 rounded-2xl p-7 sm:p-8 bg-primary text-white">
              <p className="font-headline font-bold text-xl m-0 mb-2" style={{ letterSpacing: '-0.01em' }}>{lg.ctaTitle}</p>
              <p className="m-0 mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {lg.ctaDesc}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={guide.ctaHref}
                  className={`${CTA_BUTTON} bg-secondary-container text-on-secondary-container`}
                >
                  {lg.ctaLabel}
                  <ArrowRight size={16} className="rtl-flip" aria-hidden="true" />
                </Link>
                <PdfButton className={`${CTA_BUTTON} text-white border-0 cursor-pointer`} style={{ background: 'rgba(255,255,255,0.14)' }}>
                  {t('pdf_button')}
                </PdfButton>
              </div>
            </div>

            {(siblings.length > 0 || posts.length > 0) && (
              <section className="no-print mt-12 grid gap-8 sm:grid-cols-2">
                {siblings.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant m-0 mb-4">
                      {t('related_title')}
                    </h2>
                    <ul className="list-none p-0 m-0 flex flex-col gap-3">
                      {siblings.map(g => {
                        const sl = getGuideLocale(g, locale);
                        return (
                          <li key={g.slug}>
                            <Link
                              href={guideHref(g, locale)}
                              className="block text-sm font-semibold leading-snug no-underline hover:opacity-80"
                              style={{ color: '#002b6d' }}
                            >
                              {sl.heroTitle}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {posts.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant m-0 mb-4">
                      {t('related_posts_title')}
                    </h2>
                    <ul className="list-none p-0 m-0 flex flex-col gap-3">
                      {posts.map(post => (
                        <li key={post!.slug}>
                          <Link
                            href={{ pathname: '/blog/[slug]', params: { slug: getPostSlug(post!, locale) } }}
                            className="block text-sm font-semibold leading-snug no-underline hover:opacity-80"
                            style={{ color: '#002b6d' }}
                          >
                            {getPostLocale(post!, locale).heroTitle}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
              </div>
            </div>
          </article>
        </div>
      </main>
    </PdfGateProvider>
  );
}
