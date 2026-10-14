import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import PageField from '@/components/glas/PageField';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import Crumbs from '../_components/glas/Crumbs';
import JsonLd from '@/components/JsonLd';
import { SITE_URL, TEACHER_ID } from '@/lib/site';
import { PROVIDER_REF, TEACHER_SAME_AS } from '@/lib/schema';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Canonical and hreflang, per locale, from one map.
 *
 * The canonical used to be hardcoded to the `/nl` URL for all three locales, which tells Google the
 * English and Arabic pages are duplicates of the Dutch one — so neither can ever rank, and the
 * hreflang block right below it said the opposite. The pathnames are localised (i18n/routing.ts),
 * so the right URL cannot be built by interpolating the locale; it has to come from this map.
 */
const ALTERNATES = {
  nl: 'https://inburgeringoefenen.nl/nl/docent',
  en: 'https://inburgeringoefenen.nl/en/teacher',
  ar: 'https://inburgeringoefenen.nl/ar/%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%D8%A9',
  'x-default': 'https://inburgeringoefenen.nl/nl/docent',
} as const;

const PORTRAIT = '/images/amber-van-der-zalm.webp';
const [LINKEDIN_URL, COMPANY_URL] = TEACHER_SAME_AS;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'docent' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl,
      languages: ALTERNATES,
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'profile',
      url: ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl,
      locale: locale === 'nl' ? 'nl_NL' : locale === 'ar' ? 'ar_AR' : 'en_GB',
      images: [{ url: `${SITE_URL}${PORTRAIT}` }],
    },
  };
}

/**
 * **Deze pagina is de `Person`-node van de docent.** De rest van de site verwijst ernaar met
 * `TEACHER_REF`; hier staat de onderbouwing.
 *
 * Tot 11-10 stond hier "Marieke Schipper": een schuilnaam, een foto van iemand anders, een
 * "NT2-bevoegdheid erkend door DUO" (DUO erkent geen NT2-bevoegdheden) en een loopbaan die niet
 * klopte. Alles hieronder komt uit het LinkedIn-profiel en de bedrijfssite in `TEACHER_SAME_AS`,
 * en `sameAs` wijst daarnaar, zodat Google het zelf kan nagaan. Het NT2-certificaat krijgt een
 * eigen `hasCredential` zodra de naam en het jaar bekend zijn — niet eerder.
 */
function buildJsonLd(locale: string) {
  const url = ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profilepage`,
        url,
        name: 'Amber van der Zalm — NT2-docent',
        inLanguage: locale === 'nl' ? 'nl-NL' : locale === 'ar' ? 'ar' : 'en',
        mainEntity: { '@id': TEACHER_ID },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: 'Amber van der Zalm' },
          ],
        },
      },
      {
        '@type': 'Person',
        '@id': TEACHER_ID,
        name: 'Amber van der Zalm',
        jobTitle: 'NT2-docent',
        description:
          'NT2-gecertificeerd docent en bevoegd leerkracht basisonderwijs. Ruim tien jaar in het onderwijs; sinds 2024 geeft ze met haar bedrijf Samen Sterk in Taal online NT2-les aan inburgeraars en kandidaten voor het staatsexamen.',
        image: `${SITE_URL}${PORTRAIT}`,
        sameAs: TEACHER_SAME_AS,
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'Hogeschool Leiden' },
        hasCredential: [{
          '@type': 'EducationalOccupationalCredential',
          name: 'Bevoegdheid leraar basisonderwijs (pabo)',
          credentialCategory: 'degree',
          recognizedBy: { '@type': 'CollegeOrUniversity', name: 'Hogeschool Leiden' },
        }],
        knowsAbout: [
          'inburgeringsexamen',
          'KNM — Kennis van de Nederlandse Maatschappij',
          'NT2 — Nederlands als tweede taal',
          'NT2 staatsexamen',
        ],
        worksFor: [
          PROVIDER_REF,
          { '@type': 'Organization', name: 'Samen Sterk in Taal', url: COMPANY_URL },
        ],
        url,
      },
    ],
  };
}

const FACTS = ['education', 'qualification', 'experience', 'students', 'company', 'location'] as const;
const CAREER = [
  { year: '2016', key: 1 },
  { year: '2023', key: 2 },
  { year: '2024', key: 3 },
] as const;

export default async function DocentPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'docent' });

  return (
    <>
      <JsonLd data={buildJsonLd(locale)} />

      {/* De kop: wie ze is, in haar eigen feiten. Het portret is de enige "trust mark" op deze
          pagina — er staat bewust geen ValidationChip of DocentSeal naast: de pagina ís het bewijs. */}
      <PageField variant="gracht" className="g-pagehead">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: t('breadcrumb') }]} />
        <div className="g-docent-head">
          <div>
            <SectionHeading as="h1" size="h1" title="Amber van der Zalm" onField />
            <p className="g-docent-role">{t('role')}</p>
            <p className="g-lead mt-5">{t('lede')}</p>
            <div className="g-ctas">
              <Link href="/oefenen" className={glasButton({ variant: 'oranje', size: 'lg' })}>
                {t('cta_practice')}
                <ArrowRight className="rtl-flip" aria-hidden />
              </Link>
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer me" className={glasButton({ variant: 'ghost', size: 'lg' })}>
                {t('cta_linkedin')}
                <ArrowUpRight className="rtl-flip" aria-hidden />
              </a>
            </div>
          </div>
          <figure className="g-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PORTRAIT} alt={t('photo_alt')} width={480} height={600} />
          </figure>
        </div>
      </PageField>

      {/* De feiten — een controleerbaar overzicht. Elke regel staat ook op haar LinkedIn of de site
          van Samen Sterk in Taal, en de twee links eronder sturen de lezer er direct heen. */}
      <section className="g-sec" aria-labelledby="docent-facts">
        <div className="g-wrap">
          <SectionHeading id="docent-facts" title={t('facts_title')} aside={t('facts_sub')} className="mb-8" />
          <dl className="g-factlist">
            {FACTS.map(key => (
              <div key={key}>
                <dt>{t(`fact_${key}_label`)}</dt>
                <dd>{t(`fact_${key}`)}</dd>
              </div>
            ))}
          </dl>
          <div className="g-extlinks">
            {[
              { href: LINKEDIN_URL, label: 'LinkedIn' },
              { href: COMPANY_URL, label: 'Samen Sterk in Taal' },
            ].map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer me" className={glasButton({ variant: 'ghost', size: 'sm' })}>
                {l.label}
                <ArrowUpRight className="rtl-flip" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="g-sec g-sec-tier">
        <div className="g-wrap g-split">
          <div>
            <SectionHeading title={t('career_title')} size="h2" className="mb-6" />
            <ol className="g-gsteps">
              {CAREER.map((item, i) => (
                <li key={item.year} className="g-gstep">
                  <span className="g-gstep-n g-tnum" aria-hidden>{i + 1}</span>
                  <div>
                    <b>
                      <time dateTime={item.year} className="g-mono !text-klei me-2">{item.year}</time>
                      {t(`career_${item.key}_title`)}
                    </b>
                    <p>{t(`career_${item.key}_desc`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Wie wat maakt. De eerlijke versie van "door een docent gemaakt": waar een model meedoet
              en wat niet is nagekeken, staat er gewoon bij. */}
          <div>
            <SectionHeading title={t('role_title')} size="h2" />
            <p className="g-body mt-2 mb-6">{t('role_sub')}</p>
            <ul className="g-cardlist">
              {[1, 2, 3].map(n => (
                <li key={n}>
                  <h3>{t(`role_${n}_title`)}</h3>
                  <p>{t(`role_${n}_desc`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Les bij Amber. Haar lespraktijk en dit platform concurreren niet: wie hier merkt dat
          Schrijven of Spreken persoonlijke hulp nodig heeft, is precies haar cursist. */}
      <section className="g-sec">
        <div className="g-wrap">
          <div className="g-callout">
            <div>
              <h2>{t('lessons_title')}</h2>
              <p>{t('lessons_body')}</p>
            </div>
            <a href={COMPANY_URL} target="_blank" rel="noopener noreferrer" className={glasButton({ variant: 'navy' })}>
              {t('lessons_cta')}
              <ArrowUpRight className="rtl-flip" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      <div className="g-closing">
        <Field as="section" variant="nevel" aria-labelledby="docent-cta" className="g-block g-cta-band">
          <h2 id="docent-cta">{t('cta_title')}</h2>
          <p>{t('cta_body')}</p>
          <Link href="/oefenen" className={glasButton({ variant: 'navy', size: 'lg', className: 'mt-2' })}>
            {t('cta_button')}
            <ArrowRight className="rtl-flip" aria-hidden />
          </Link>
        </Field>
      </div>
    </>
  );
}
