/**
 * De gids als A4-brochure — de bron van `/api/guide-pdf/[section]/[slug]`.
 *
 * Tot 15-10 printte de PDF-route de gidspagina zelf. Dat gaf een PDF die eruitzag als een
 * afgedrukte webpagina: geen omslag, de kop van de site op pagina 1. De eigenaar wilde een
 * brochure (glas.html "Gids als PDF-brochure"): een omslag, daarna wit met dezelfde blokken.
 *
 * **Nieuw is alleen de opmaak, niet de inhoud.** Deze pagina rendert dezelfde `articleHtml`,
 * `sidebarHtml` en `faq` als `GuideArticle`, met dezelfde `.article-body`-regels — de tekst die de
 * docent heeft gelezen staat nog steeds op één plek. Wat erbij komt is de omslag
 * (`BrochureCover`, dezelfde als op de kaart in `/gidsen`), de lopende voetregel via `@page` en
 * een slotpagina met een QR-code naar de CTA van de gids.
 *
 * Niet in de sitemap, `noindex`, en achter hetzelfde bewijs als de PDF (`?t=`): de brochure is de
 * ruil voor een e-mailadres, dus de printversie mag geen gratis omweg zijn.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import QRCode from 'qrcode';
import BrochureCover from '@/components/guides/BrochureCover';
import { brochureCover } from '@/lib/guides/brochure';
import { getGuideBySlug, getGuideLocale, hasTranslation } from '@/data/guides/helpers';
import { guideParts, guideSections } from '@/lib/guides/sections';
import { pdfTokenValid } from '@/lib/guides/pdf-token';
import { localeHref } from '@/i18n/paths';
import { SITE_URL, langTag } from '@/lib/site';
import type { GuideSection } from '@/data/guides/types';
import './brochure.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const SECTIONS: GuideSection[] = ['inburgering', 'taalexamens', 'knm'];

type Props = {
  params: Promise<{ locale: string; section: string; slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

/** Een CSS-string voor `content:` in de voetregel. `<` gaat als escape, zodat `</style>` nooit kan. */
function cssString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/</g, '\\3C ').replace(/\s+/g, ' ')}"`;
}

export default async function GuideBrochurePage({ params, searchParams }: Props) {
  const { locale, section, slug } = await params;
  const { t: token } = await searchParams;
  setRequestLocale(locale);

  if (!SECTIONS.includes(section as GuideSection)) notFound();
  const guide = getGuideBySlug(section as GuideSection, slug);
  if (!guide || guide.status !== 'reviewed') notFound();
  if (!pdfTokenValid(token ?? null, section, guide.slug, locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'guides' });
  const lg = getGuideLocale(guide, locale);
  const translated = hasTranslation(guide, locale);
  const cover = await brochureCover(guide, locale);
  const toc = guideSections(lg.articleHtml);
  const { intro, parts } = guideParts(lg.articleHtml);
  const dirProps = translated ? {} : { dir: 'ltr' as const, lang: 'nl' };

  const ctaPath = localeHref(locale, guide.ctaHref);
  const ctaUrl = `${SITE_URL}${ctaPath}`;
  const qr = await QRCode.toString(ctaUrl, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#002b6dff', light: '#ffffff00' },
  });

  const reviewedLine =
    guide.reviewedBy && guide.reviewedOn
      ? t('reviewed_by', {
          name: guide.reviewedBy,
          date: new Date(guide.reviewedOn).toLocaleDateString(langTag(locale), {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        }) + (locale !== 'nl' ? ` ${t('translated_note')}` : '')
      : null;

  /* De lopende voetregel: titel links, paginanummer rechts, niet op de omslag (glas.html). */
  /* Arabisch heeft geen hoofdletters en verbonden letters: daar geen mono en geen spatiëring. */
  const box = locale === 'ar'
    ? 'font-family: sans-serif; font-size: 8pt; color: #4c5874;'
    : 'font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; color: #4c5874;';
  const pageCss =
    `@page { size: A4; margin: 17mm 17mm 19mm; ` +
    `@bottom-left { content: ${cssString(lg.heroTitle)}; ${box} } @bottom-right { content: counter(page); ${box} } } ` +
    `@page :first { margin: 0; @bottom-left { content: none; } @bottom-right { content: none; } }`;

  return (
    <div className="bro-doc">
      <style>{pageCss}</style>

      <BrochureCover cover={cover} size="a4" />

      <div className="bro guide-prose">
        {locale !== 'nl' && <p className="bro-notice">{t('mt_notice')}</p>}

        <div className="bro-open">
          {toc.length > 1 && (
            <nav className="bro-toc" aria-label={t('toc_title')}>
              <b>{t('toc_title')}</b>
              <ol>
                {toc.map(s => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ol>
            </nav>
          )}
          {lg.sidebarHtml && (
            <section
              {...dirProps}
              className="bro-summary guide-summary article-body"
              dangerouslySetInnerHTML={{ __html: lg.sidebarHtml }}
            />
          )}
        </div>

        <div {...dirProps}>
          {intro.trim() && <div className="article-body" dangerouslySetInnerHTML={{ __html: intro }} />}
          {parts.map(part => (
            <section key={part.id} className="guide-section">
              <h2 className="guide-section-title">{part.title}</h2>
              <div className="article-body" dangerouslySetInnerHTML={{ __html: part.html }} />
            </section>
          ))}
        </div>

        {lg.faq.length > 0 && (
          <section className="bro-faq">
            <h2 className="guide-section-title">{t('faq_title')}</h2>
            <dl>
              {lg.faq.map(f => (
                <div key={f.q}>
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="bro-end">
          <div className="bro-cta">
            <span className="bro-qr" dangerouslySetInnerHTML={{ __html: qr }} />
            <span>
              <b>{lg.ctaTitle}</b>
              <span className="bro-cta-desc">{lg.ctaDesc}</span>
              <small>
                {t('brochure_qr_hint')}{' '}
                <span dir="ltr">{ctaUrl.replace(/^https?:\/\//, '')}</span>
              </small>
            </span>
          </div>
          {reviewedLine && <p className="bro-reviewed">{reviewedLine}</p>}
        </section>
      </div>
    </div>
  );
}
