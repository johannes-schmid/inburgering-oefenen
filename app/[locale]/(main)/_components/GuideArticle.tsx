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
import { ArrowRight, BadgeCheck, Globe, Info, Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ArticleContent from '@/components/ArticleContent';
import JsonLd from '@/components/JsonLd';
import { absUrl, breadcrumbs, PROVIDER_REF, TEACHER_REF } from '@/lib/schema';
import { SITE_URL, langTag } from '@/lib/site';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import Crumbs from './glas/Crumbs';
import { FEATURES } from '@/lib/features';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { getGuideLocale, hasTranslation, relatedGuides, guideHref, hubHref } from '@/data/guides/helpers';
import { guideSections, guideParts } from '@/lib/guides/sections';
import GuideToc from '@/components/guides/GuideToc';
import { PdfGateProvider, PdfButton } from '@/components/guides/PdfGate';
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

  const crumbs = [
    { label: tB('home'), href: '/' },
    { label: tB(guide.section), href: hub },
    { label: lg.breadcrumb },
  ];
  const dirProps = translated ? {} : { dir: 'ltr' as const, lang: 'nl' };

  const byline = (
    <div className="g-byline">
      <img src="/images/amber-van-der-zalm-264.webp" alt="" width={46} height={46} />
      <span className="min-w-0 flex-1">
        <Link href="/docent" className="g-ilink !no-underline font-headline font-bold text-[14.5px]">Amber van der Zalm</Link>
        <small className="block">
          {t('author_role')} · {lg.dateLabel} · {t('reading_time', { minutes: guide.readingMinutes })} ·{' '}
          <Link href="/redactie" className="g-ilink !font-medium">{t('how_made')}</Link>
        </small>
      </span>
    </div>
  );

  return (
    <PdfGateProvider section={guide.section} slug={guide.slug} locale={locale} title={lg.heroTitle}>
      {jsonLd && <JsonLd data={jsonLd} />}
      {heroSrc && (
        <link rel="preload" as="image" href={heroSrc} fetchPriority="high" />
      )}

      {/* De kop (glas.html §14 "Artikel"): Nevel, het leesveld, onder de pil door. Heeft de gids een
          eigen kopfoto, dan is het de **beeldkop** — de titel op glas over de foto. Zonder foto staat
          de titel direct op het veld. `guide-hero` houdt de kop in de PDF (`@media print`). */}
      <Field as="header" variant="nevel" veil className="guide-hero g-readhead">
        <div className="g-wrap">
          <Crumbs items={crumbs} />
          {heroSrc && guide.heroImage ? (
            <div className="g-ap-hero mt-5">
              <picture className="no-print">
                {guide.heroImage.hasWebp && (
                  <source srcSet={`/images/guides/${guide.heroImage.base}.webp`} type="image/webp" />
                )}
                <img
                  src={`/images/guides/${guide.heroImage.base}.jpg`}
                  alt={lg.heroImageAlt}
                  width={1800}
                  height={760}
                  style={{ objectPosition: guide.heroImage.position ?? 'center 45%' }}
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
              <div className="g-glass g-glass-strong">
                <span className="g-mono">{tB(guide.section)}</span>
                <h1>{lg.heroTitle}</h1>
                <div className="mt-4">{byline}</div>
              </div>
            </div>
          ) : (
            <>
              <h1>{lg.heroTitle}</h1>
              <div className="mt-6">{byline}</div>
            </>
          )}
          {/* Melding vóór de eerste regel tekst (AI-verordening art. 50 lid 4 en 5): de EN/AR-
              gidsen zijn machinevertalingen zonder menselijke controle. Onderaan staat dezelfde
              zin nog in de reviewregel; die kwam pas ná het lezen. */}
          {locale !== 'nl' && (
            <p className="g-notice g-notice-glas m-0 mt-5 max-w-[640px]">
              <Globe aria-hidden="true" />
              <span>{t('mt_notice')}</span>
            </p>
          )}
          <p className="g-lead">{lg.heroSubtitle}</p>
          <div className="no-print flex flex-wrap gap-3 mt-6">
            <PdfButton className={glasButton({ variant: 'navy' })}>
              {t('pdf_button')}
            </PdfButton>
            <Link href="/oefenen" className={glasButton({ variant: 'ghost' })}>
              {t('check_button')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Field>

      {/* De leeskaart: wit, de inhoudsopgave plakt links, één leeskolom van ±68 tekens rechts. */}
      <main className="g-wrap pt-6 pb-16 sm:pb-20">
        <div className="g-prose guide-prose">
          <GuideToc sections={sections} variant="side" />

          <article className="g-prose-body min-w-0">
            <GuideToc sections={sections} variant="fold" />

            {/* An unreviewed guide says so, on the page, in every locale. */}
            {guide.status === 'draft' && (
              <p className="g-notice g-notice-klei m-0 mb-6">
                <Info aria-hidden="true" />
                <span>{t('draft_notice')}</span>
              </p>
            )}
            {/* An untranslated locale reads the Dutch body, forced LTR: inside the Arabic layout
                Dutch text renders with its punctuation on the wrong side. The page is noindex in
                this state. */}
            {!translated && (
              <p className="g-notice m-0 mb-6">
                <Globe aria-hidden="true" />
                <span>
                  {t('not_translated')}{' '}
                  <Link href={guideHref(guide, 'nl')} locale="nl" className="g-ilink">
                    {t('read_in_dutch')}
                  </Link>
                </span>
              </p>
            )}

            <div {...dirProps}>
              {/* De samenvatting van de docent, eerst. Het is het antwoord waarvoor de lezer kwam;
                  alles eronder is de onderbouwing. `sidebarHtml` draagt zijn eigen "In het kort". */}
              {lg.sidebarHtml && (
                <section
                  className="guide-summary article-body g-summary mb-10"
                  dangerouslySetInnerHTML={{ __html: lg.sidebarHtml }}
                />
              )}
              {intro.trim() && <ArticleContent html={intro} />}
            </div>

            {parts.map(part => (
              <section key={part.id} className="guide-section" {...dirProps}>
                <h2 id={part.id} className="guide-section-title">{part.title}</h2>
                <ArticleContent html={part.html} />
              </section>
            ))}

            {/* De FAQ vouwt: `<details>` en geen client-accordeon, zodat de antwoorden in de DOM
                staan voor de `FAQPage`-JSON-LD en geen JavaScript nodig hebben. */}
            {lg.faq.length > 0 && (
              <section className="mt-14">
                <h2 className="g-head g-head-2 mb-4">{t('faq_title')}</h2>
                <div className="g-faq g-faq-mist">
                  {lg.faq.map(f => (
                    <details key={f.q}>
                      <summary>
                        {f.q}
                        <span className="g-faq-pm" aria-hidden="true"><Plus /></span>
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
              <p className="g-notice m-0 mt-10">
                <BadgeCheck aria-hidden="true" />
                <span>{reviewedLine}</span>
              </p>
            )}

            {/* De slot-CTA: Nacht stil — donker zonder gloed, met een witte knop (glas.html §14
                "inline-cta"). Eén donker blok op de pagina. */}
            <Field variant="nacht-stil" className="g-inline-cta no-print !mt-10">
              <span className="flex-1 min-w-[220px]">
                <b>{lg.ctaTitle}</b>
                <small>{lg.ctaDesc}</small>
              </span>
              <span className="flex flex-wrap gap-2.5">
                <Link href={guide.ctaHref} className={glasButton({ variant: 'wit' })}>
                  {lg.ctaLabel}
                  <ArrowRight className="rtl-flip" aria-hidden="true" />
                </Link>
                <PdfButton className={glasButton({ variant: 'glasd' })}>
                  {t('pdf_button')}
                </PdfButton>
              </span>
            </Field>
          </article>
        </div>

        {(siblings.length > 0 || posts.length > 0) && (
          <section className="no-print mt-10 g-grid2">
            {siblings.length > 0 && (
              <div className="bg-wit rounded-g-lg p-6">
                <h2 className="g-mono m-0 mb-4">{t('related_title')}</h2>
                <ul className="list-none p-0 m-0 flex flex-col gap-3">
                  {siblings.map(g => {
                    const sl = getGuideLocale(g, locale);
                    return (
                      <li key={g.slug}>
                        <Link href={guideHref(g, locale)} className="g-tlink !text-[15px]">
                          {sl.heroTitle}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {posts.length > 0 && (
              <div className="bg-wit rounded-g-lg p-6">
                <h2 className="g-mono m-0 mb-4">{t('related_posts_title')}</h2>
                <ul className="list-none p-0 m-0 flex flex-col gap-3">
                  {posts.map(post => (
                    <li key={post!.slug}>
                      <Link
                        href={{ pathname: '/blog/[slug]', params: { slug: getPostSlug(post!, locale) } }}
                        className="g-tlink !text-[15px]"
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
      </main>
    </PdfGateProvider>
  );
}
