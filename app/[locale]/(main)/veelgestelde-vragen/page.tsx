import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, FileClock, Globe } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { contentSlugParam } from '@/i18n/content-slugs';
import { Link } from '@/i18n/navigation';
import { FAQ, FAQ_GROUPS, FAQ_INDEXED_LOCALES, FAQ_REVIEWED, faqLang, type FaqMore } from '@/data/faq';
import { guideHref } from '@/data/guides/helpers';
import JsonLd from '@/components/JsonLd';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import { absUrl, alternatesFor, breadcrumbs, ogImageFor } from '@/lib/schema';
import Crumbs from '../_components/glas/Crumbs';
import FaqBrowser, { type BrowserGroup, type BrowserItem } from './FaqBrowser';

/* FAQ-hub: de vragen die kandidaten op Reddit stellen over het inburgeringsexamen, kort beantwoord
 * met de bron erbij en een link naar de pagina die dieper gaat. De vragen staan in `data/faq.ts`.
 *
 * **`noindex` tot Amber de antwoorden heeft nagekeken** (CLAUDE.md §2: niets publiceert zonder haar).
 * `FAQ_REVIEWED` in `data/faq.ts` is de ene schakelaar: robots, de conceptmelding, de JSON-LD en de
 * sitemap lezen hem allemaal. Arabisch heeft geen eigen tekst, toont de Engelse en blijft `noindex`. */
const PATH = 'veelgestelde-vragen';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq_page' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: FAQ_REVIEWED && FAQ_INDEXED_LOCALES.includes(locale), follow: true },
    alternates: alternatesFor(locale, PATH, FAQ_INDEXED_LOCALES),
    openGraph: {
      images: ogImageFor(locale),
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'website',
      url: absUrl(locale, PATH),
      siteName: 'Inburgering Oefenen',
    },
  };
}

function moreHref(more: FaqMore, locale: string): NonNullable<BrowserItem['more']>['href'] {
  if ('page' in more) return more.page;
  if ('level' in more) return { pathname: '/oefenexamen/[level]', params: { level: more.level } };
  if ('guide' in more) return guideHref(more.guide, locale);
  return { pathname: '/blog/[slug]', params: { slug: contentSlugParam(more.post, locale) } };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'faq_page' });
  const lang = faqLang(locale);
  const translated = lang === locale;
  const tContent = translated ? t : await getTranslations({ locale: lang, namespace: 'faq_page' });
  const indexable = FAQ_REVIEWED && FAQ_INDEXED_LOCALES.includes(locale);

  const groups: BrowserGroup[] = FAQ_GROUPS.map(g => ({
    id: g.id,
    label: g.label[lang],
    items: FAQ.filter(f => f.group === g.id).map(f => ({
      id: f.id,
      q: f.q[lang],
      a: f.a[lang],
      source: f.source,
      more: f.more && { href: moreHref(f.more, locale), label: f.more.label[lang] },
    })),
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${absUrl(locale, PATH)}#faq`,
        mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q[lang], acceptedAnswer: { '@type': 'Answer', text: f.a[lang] } })),
      },
      breadcrumbs(locale, 'Home', [{ name: t('breadcrumb') }]),
    ],
  };

  return (
    <>
      {/* Geen structured data op een concept of in een taal zonder eigen tekst. */}
      {indexable && <JsonLd data={jsonLd} />}
      <noscript><style>{'.g-faq-filter{display:none}'}</style></noscript>
      <div className="g-home g-hb g-rx">
        <Field as="section" variant="hero" veil className="g-rx-hero g-faq-hero" aria-labelledby="faq-h1">
          <div className="g-wrap">
            <Crumbs items={[{ label: 'Home', href: '/' }, { label: t('breadcrumb') }]} />
            <div className="g-rx-head">
              <h1 id="faq-h1" className="g-rx-h1">{t('h1')}</h1>
              <p className="g-hb-lead">{t('lead')}</p>
              {!FAQ_REVIEWED && (
                <p className="g-notice g-notice-glas m-0" role="note">
                  <FileClock aria-hidden="true" />
                  <span>{t('draft_notice')}</span>
                </p>
              )}
              {!translated && (
                <p className="g-notice g-notice-glas m-0" role="note">
                  <Globe aria-hidden="true" />
                  <span>{t('not_translated')}</span>
                </p>
              )}
            </div>
          </div>
        </Field>

        <div className="g-wrap g-faq-hub">
          <FaqBrowser groups={groups} sourceLabel={tContent('source')} contentLang={translated ? undefined : lang} />
        </div>

        {/* ── AFSLUITER ── het enige gekleurde blok onder de kop: één knop naar de gratis proef. */}
        <section aria-labelledby="faq-cta" className="g-wrap g-hb-cta-wrap">
          <Field variant="gracht" className="g-hb-cta">
            <h2 id="faq-cta">{t('cta_h2')}</h2>
            <p>{t('cta_text')}</p>
            <Link href="/oefenen" className={glasButton({ variant: 'oranje', size: 'lg' })}>
              {t('cta_button')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </Link>
          </Field>
        </section>
      </div>
    </>
  );
}
