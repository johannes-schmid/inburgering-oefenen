import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

// SEO guardrail: generate static pages for every locale at build time
export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: false, follow: true },
    alternates: {
      canonical: `https://inburgeringoefenen.nl/${locale}/privacybeleid`,
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/privacybeleid',
        en: 'https://inburgeringoefenen.nl/en/privacybeleid',
        ar: 'https://inburgeringoefenen.nl/ar/privacybeleid',
        'x-default': 'https://inburgeringoefenen.nl/nl/privacybeleid',
      },
    },
  };
}

export default async function PrivacybeleidPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });

  return (
    <>
      <main className="max-w-3xl mx-auto px-6 py-16 pb-24">

        <header className="mb-12">
          <div
            className="inline-flex items-center gap-2 mb-4"
            style={{ background: 'rgba(0,43,109,0.06)', borderRadius: '9999px', padding: '4px 12px' }}
          >
            <span className="text-xs font-bold tracking-widest uppercase text-primary">
              {t('eyebrow')}
            </span>
          </div>
          <h1
            className="font-headline font-extrabold text-on-surface mb-3"
            style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', letterSpacing: '-0.02em' }}
          >
            {t('heading')}
          </h1>
          <p className="text-on-surface-variant text-sm">{t('last_updated')}</p>
        </header>

        <div
          className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 prose"
          style={{ boxShadow: '0 2px 24px rgba(0,43,109,0.06)' }}
        >
          {/* Content is Dutch — this page is noindex and the legal text doesn't require translation */}
          <p>
            Inburgering Oefenen (&quot;wij&quot;, &quot;ons&quot;) respecteert jouw privacy en verwerkt persoonsgegevens
            zorgvuldig en veilig. In dit privacybeleid leggen wij uit welke gegevens wij verzamelen, waarom
            wij dat doen en wat jouw rechten zijn. Dit beleid is van toepassing op de website{' '}
            <strong>inburgeringoefenen.nl</strong>.
          </p>

          <h2>1. Wie is verantwoordelijk?</h2>
          <p>De verwerkingsverantwoordelijke is:</p>
          <ul>
            <li><strong>Inburgering Oefenen</strong></li>
            <li>E-mail: <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a></li>
          </ul>

          <h2>2. Welke gegevens verzamelen wij?</h2>
          <p>Wij verzamelen uitsluitend de volgende persoonsgegevens:</p>
          <ul>
            <li><strong>E-mailadres</strong> — ingevoerd via het formulier na het voltooien van de oefentoets</li>
            <li><strong>Toetsresultaat</strong> — je score (anoniem) op de oefenvragen, verzonden samen met je e-mailadres</li>
          </ul>
          <p>Wij verzamelen geen bijzondere persoonsgegevens (zoals nationaliteit, religie of gezondheidsgegevens).</p>

          <h2>3. Waarvoor gebruiken wij jouw gegevens?</h2>
          <p>Wij verwerken jouw e-mailadres uitsluitend voor de volgende doeleinden:</p>
          <ul>
            <li>Het toesturen van jouw persoonlijke toetsresultaten</li>
            <li>Het toesturen van gratis KNM-oefenvragen en studiemateriaal</li>
            <li>Incidentele communicatie over het KNM-oefenplatform</li>
          </ul>

          <h2>4. Rechtsgrond</h2>
          <p>
            De verwerking is gebaseerd op jouw <strong>toestemming</strong> (art. 6 lid 1 sub a AVG), die je
            geeft door je e-mailadres in te vullen en op de knop &quot;Bekijk mijn resultaten&quot; te klikken. Je
            kunt deze toestemming op elk moment intrekken.
          </p>

          <h2>5. Hoe lang bewaren wij jouw gegevens?</h2>
          <p>
            Wij bewaren jouw e-mailadres totdat je je afmeldt of verzoekt om verwijdering, of uiterlijk{' '}
            <strong>2 jaar</strong> na het laatste contact, tenzij een wettelijke bewaarplicht een langere
            bewaartermijn vereist.
          </p>

          <h2>6. Delen met derden</h2>
          <p>
            Wij delen jouw gegevens niet met derden, behalve met <strong>Formspree, Inc.</strong> als
            verwerker van het contactformulier. Formspree verwerkt de gegevens uitsluitend in opdracht van ons
            en conform de AVG. Meer informatie:{' '}
            <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">
              formspree.io/legal/privacy-policy
            </a>
            .
          </p>
          <p>Wij verkopen jouw gegevens nooit aan derden.</p>

          <h2>7. Beveiliging</h2>
          <p>
            Wij nemen passende technische en organisatorische maatregelen om jouw persoonsgegevens te
            beveiligen tegen verlies, diefstal of ongeautoriseerde toegang. De website maakt gebruik van
            HTTPS-versleuteling.
          </p>

          <h2>8. Jouw rechten</h2>
          <p>Op grond van de AVG heb je de volgende rechten:</p>
          <ul>
            <li><strong>Recht op inzage</strong> — je kunt opvragen welke gegevens wij van je hebben</li>
            <li><strong>Recht op correctie</strong> — je kunt onjuiste gegevens laten corrigeren</li>
            <li><strong>Recht op verwijdering</strong> — je kunt vragen om verwijdering van jouw gegevens (&quot;recht op vergetelheid&quot;)</li>
            <li><strong>Recht op beperking</strong> — je kunt de verwerking laten beperken</li>
            <li><strong>Recht op bezwaar</strong> — je kunt bezwaar maken tegen de verwerking</li>
            <li><strong>Recht op overdraagbaarheid</strong> — je kunt jouw gegevens opvragen in een gestructureerd formaat</li>
          </ul>
          <p>
            Om een recht uit te oefenen, stuur een e-mail naar{' '}
            <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>. Wij reageren binnen 30 dagen.
          </p>

          <h2>9. Klacht indienen</h2>
          <p>
            Als je van mening bent dat wij jouw privacyrechten schenden, kun je een klacht indienen bij de{' '}
            <strong>Autoriteit Persoonsgegevens</strong>:{' '}
            <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener">
              autoriteitpersoonsgegevens.nl
            </a>
            .
          </p>

          <h2>10. Cookies</h2>
          <p>
            Deze website gebruikt geen tracking cookies of analytische cookies. Er worden geen gegevens
            opgeslagen in cookies of lokale opslag, behalve technisch noodzakelijke sessiegegevens die
            automatisch worden verwijderd wanneer je de browser sluit.
          </p>

          <h2>11. Wijzigingen</h2>
          <p>
            Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. De datum &quot;Laatste update&quot; bovenaan
            de pagina geeft aan wanneer de meest recente versie gepubliceerd is. Wij raden je aan dit beleid
            periodiek te raadplegen.
          </p>

          <h2>12. Contact</h2>
          <p>
            Voor vragen of verzoeken over dit privacybeleid of de verwerking van jouw gegevens, neem contact
            op via: <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>.
          </p>
        </div>
      </main>

    </>
  );
}
