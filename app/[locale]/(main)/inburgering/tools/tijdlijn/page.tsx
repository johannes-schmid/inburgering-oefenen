/**
 * `/inburgering/tools/tijdlijn` — the Tijdlijn Builder.
 *
 * A **static shell that hydrates**. There is no server render of anybody's plan, and that is an
 * architectural commitment rather than a performance choice: the engine is a pure function small
 * enough to ship, so no answer ever crosses the network and the privacy line on the landing page
 * ("geen DigiD, geen BSN, je antwoorden blijven op je eigen telefoon") is structurally true. A
 * server round-trip added here for "personalisation" would make that copy false — see
 * `docs/tijdlijn/04-TECHNICAL-SPEC.md` §14.
 *
 * The page is therefore **indexable**, unlike the placeholder it replaces and unlike DUO's own
 * step-by-step wizard, which is `noindex`. That is the whole SEO play: the informational
 * intent around *inburgering deadline* / *hoelang heb ik om in te burgeren* has no interactive,
 * dated answer anywhere, and this is one.
 *
 * The JSON-LD is a `WebApplication` and references `#organization` and `#website` by `@id` rather
 * than restating them — the homepage owns those nodes. It carries **no `aggregateRating` and no
 * `review`**: the tool has no reviews, and `scripts/check-schema.mjs` fails the build if one appears.
 */
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF } from '@/lib/schema';
import { langTag, WEBSITE_ID } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/site/Breadcrumb';
import TijdlijnApp from '@/components/tijdlijn/TijdlijnApp';
import { RULES } from '@/lib/tijdlijn/rules';

const PATH = 'inburgering/tools/tijdlijn';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tijdlijn' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, PATH),
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, PATH),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function TijdlijnToolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'tijdlijn' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const selfUrl = absUrl(locale, PATH);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${selfUrl}#app`,
        name: t('hero.title'),
        description: t('meta_description'),
        url: selfUrl,
        inLanguage: langTag(locale),
        applicationCategory: 'EducationalApplication',
        /* Runs entirely in the browser, which is worth stating: it is the reason no account and no
         * DigiD are needed, and it is the claim the architecture is built to keep. */
        browserRequirements: 'Requires JavaScript.',
        operatingSystem: 'Any',
        isPartOf: { '@id': WEBSITE_ID },
        publisher: PROVIDER_REF,
        /* Free, and free without an account. `price: '0'` is the honest description of the tool
         * itself; the practice modules it links to are priced on `/premium`, which owns those Offers. */
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        softwareVersion: RULES.version,
      },
      breadcrumbs(
        locale,
        tB('home'),
        [{ name: tB('inburgering'), path: 'inburgering' }, { name: t('breadcrumb'), path: PATH }],
        selfUrl,
      ),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { label: tB('home'), href: '/' },
          { label: tB('inburgering'), href: '/inburgering' },
          { label: t('breadcrumb') },
        ]}
      />
      {/* `<main>` is here rather than inside the client component so the landmark exists in the
          static HTML — a screen reader must not depend on hydration to find the page's content. */}
      <main className="bg-surface px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <TijdlijnApp />
        </div>
      </main>
    </>
  );
}
