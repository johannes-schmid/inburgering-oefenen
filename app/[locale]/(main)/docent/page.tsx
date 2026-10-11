import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, ArrowUpRight, PenLine } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { Breadcrumb, GradientHero, SectionHeader } from '@/components/site';
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

const PRESS = 'transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2';

export default async function DocentPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'docent' });

  return (
    <>
      <JsonLd data={buildJsonLd(locale)} />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: t('breadcrumb') }]} />

      <GradientHero className="pb-20">
        <div className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-10 md:gap-16 items-center">
          <div className="max-w-2xl">
            <h1
              className="font-headline font-extrabold text-white m-0"
              style={{ fontSize: 'clamp(2.1rem, 4.6vw, 3.4rem)', letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}
            >
              Amber van der Zalm
            </h1>
            <p className="font-headline font-bold m-0 mt-2" style={{ color: '#fe762c', fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', letterSpacing: '-0.01em' }}>
              {t('role')}
            </p>
            <p className="text-white/75 text-[1.0625rem] leading-[1.7] m-0 mt-5 max-w-[60ch]" style={{ textWrap: 'pretty' }}>
              {t('lede')}
            </p>
            <div className="flex gap-3 flex-wrap mt-8">
              <Link
                href="/oefenen"
                className={`inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-sm no-underline hover:brightness-105 ${PRESS}`}
              >
                {t('cta_practice')}
                <ArrowRight className="size-4 rtl-flip" aria-hidden />
              </Link>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer me"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white no-underline bg-white/10 hover:bg-white/[0.16] ${PRESS}`}
              >
                {t('cta_linkedin')}
                <ArrowUpRight className="size-4 rtl-flip" aria-hidden />
              </a>
            </div>
          </div>

          <figure className="m-0 justify-self-center md:justify-self-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PORTRAIT}
              alt={t('photo_alt')}
              width={480}
              height={600}
              className="block w-[220px] sm:w-[260px] md:w-[280px] h-auto rounded-[22px] object-cover"
              style={{ boxShadow: '0 28px 60px -24px rgba(0,8,27,0.55)' }}
            />
          </figure>
        </div>
      </GradientHero>

      {/* De feiten — een controleerbaar overzicht in plaats van grote cijfertegels. Elke regel staat
          ook op haar LinkedIn of de site van Samen Sterk in Taal, en de twee links eronder sturen
          de lezer er direct heen. */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader align="left" title={t('facts_title')} subtitle={t('facts_sub')} />
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 m-0">
            {FACTS.map(key => (
              <div key={key} className="rounded-2xl px-5 py-4 bg-surface-container-low">
                <dt className="text-xs font-semibold text-on-surface-variant">{t(`fact_${key}_label`)}</dt>
                <dd className="m-0 mt-1 font-headline font-bold text-primary text-[1rem] leading-snug">{t(`fact_${key}`)}</dd>
              </div>
            ))}
          </dl>
          <p className="flex flex-wrap gap-x-6 gap-y-2 m-0 mt-6 text-sm">
            {[
              { href: LINKEDIN_URL, label: 'LinkedIn' },
              { href: COMPANY_URL, label: 'Samen Sterk in Taal' },
            ].map(l => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer me"
                className="inline-flex items-center gap-1 font-semibold no-underline rounded-sm hover:opacity-75 active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: '#a24000' }}
              >
                {l.label}
                <ArrowUpRight className="size-3.5 rtl-flip" aria-hidden />
              </a>
            ))}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 md:gap-16 items-start">
          <div>
            <SectionHeader align="left" title={t('career_title')} />
            <ol className="list-none m-0 p-0 flex flex-col">
              {CAREER.map((item, i) => (
                <li key={item.year} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 relative pb-8 last:pb-0">
                  {i < CAREER.length - 1 && (
                    <span aria-hidden className="absolute top-3 bottom-0 w-0.5 rounded-full start-[4.75rem]" style={{ background: 'rgba(0,43,109,0.14)' }} />
                  )}
                  <time dateTime={item.year} className="text-sm font-bold text-secondary tabular-nums pt-0.5">{item.year}</time>
                  <div className="relative ps-5">
                    <span aria-hidden className="absolute start-0 top-[0.45rem] size-2.5 rounded-full bg-primary" />
                    <h3 className="m-0 font-headline font-bold text-on-surface text-[1rem]">{t(`career_${item.key}_title`)}</h3>
                    <p className="m-0 mt-1 text-sm text-on-surface-variant leading-relaxed">{t(`career_${item.key}_desc`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Wie wat maakt. Dit is de eerlijke versie van de claim "door een docent gemaakt": waar
              een model meedoet en wat niet is nagekeken, staat er gewoon bij. */}
          <div>
            <SectionHeader align="left" title={t('role_title')} subtitle={t('role_sub')} />
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              {[1, 2, 3].map(n => (
                <li key={n} className="rounded-2xl px-5 py-4 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-ambient)' }}>
                  <h3 className="m-0 font-headline font-bold text-primary text-[1rem]">{t(`role_${n}_title`)}</h3>
                  <p className="m-0 mt-1 text-sm text-on-surface-variant leading-relaxed">{t(`role_${n}_desc`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Les bij Amber. Haar eigen lespraktijk en dit platform concurreren niet: wie hier merkt dat
          Schrijven of Spreken persoonlijke hulp nodig heeft, is precies haar cursist. */}
      <section className="py-16 sm:py-20 bg-surface px-6">
        <div
          className="max-w-6xl mx-auto rounded-2xl p-6 sm:p-10 grid sm:grid-cols-[minmax(0,1fr)_auto] gap-6 items-center"
          style={{ background: 'rgba(254,118,44,0.22)' }}
        >
          <div className="max-w-2xl">
            <h2 className="m-0 font-headline font-extrabold text-primary" style={{ fontSize: 'clamp(1.35rem, 2.6vw, 1.75rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
              {t('lessons_title')}
            </h2>
            <p className="m-0 mt-2 text-[0.9375rem] leading-relaxed text-on-secondary-container" style={{ textWrap: 'pretty' }}>
              {t('lessons_body')}
            </p>
          </div>
          <a
            href={COMPANY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm no-underline hover:brightness-110 ${PRESS}`}
          >
            {t('lessons_cta')}
            <ArrowUpRight className="size-4 rtl-flip" aria-hidden />
          </a>
        </div>
      </section>

      <div style={{ background: 'var(--gradient-brand)' }} className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <PenLine size={44} strokeWidth={1.6} className="mx-auto mb-5 text-white" aria-hidden="true" />
          <h2 className="font-headline font-extrabold text-white mb-4" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            {t('cta_title')}
          </h2>
          <p className="text-white/70 max-w-md mx-auto mb-8 leading-relaxed">
            {t('cta_body')}
          </p>
          <Link
            href="/oefenen"
            className={`inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold no-underline hover:brightness-105 ${PRESS}`}
          >
            {t('cta_button')}
            <ArrowRight className="size-4 rtl-flip" aria-hidden />
          </Link>
        </div>
      </div>
    </>
  );
}
