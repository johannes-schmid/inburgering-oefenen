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
          <p>Dat hangt af van hoe je het platform gebruikt.</p>
          <p><strong>Als je zonder account oefent:</strong></p>
          <ul>
            <li><strong>Je e-mailadres</strong>, als je het invult om je resultaat te bekijken. Je kunt deze stap overslaan.</li>
            <li><strong>Je score</strong> op de gratis oefenvragen.</li>
          </ul>
          <p><strong>Als je een account maakt:</strong></p>
          <ul>
            <li><strong>Je naam, e-mailadres en profielfoto</strong> van je Google-account. Inloggen gaat uitsluitend via Google: wij ontvangen geen wachtwoord en bewaren er ook geen.</li>
            <li><strong>Je voortgang:</strong> welke oefenexamens je hebt gemaakt, welk antwoord je per vraag gaf, je scores en je tijden.</li>
            <li><strong>Je antwoorden op open opdrachten:</strong> de teksten die je schrijft bij Schrijven.</li>
            <li><strong>Je spreekopnames.</strong> Bij Spreken neem je je antwoord op. Die opname wordt bewaard in een niet-openbare opslag, samen met de uitgeschreven tekst en de beoordeling.</li>
            <li><strong>Betaalgegevens:</strong> welke modules je hebt, tot wanneer, en de klant- en abonnementsnummers van onze betaaldienst. Je rekeningnummer en je kaartgegevens komen niet bij ons terecht: die verwerkt de betaaldienst zelf.</li>
          </ul>
          <p>
            Wij vragen <strong>geen</strong> bijzondere persoonsgegevens zoals nationaliteit, religie of
            gezondheidsgegevens. Houd er rekening mee dat je bij een open opdracht zelf over je situatie kunt
            schrijven of spreken: schrijf niet meer over jezelf dan je kwijt wil.
          </p>

          <h2>3. Waarvoor gebruiken wij jouw gegevens?</h2>
          <p>Wij gebruiken jouw gegevens voor de volgende doeleinden:</p>
          <ul>
            <li>Het toesturen van jouw persoonlijke toetsresultaten</li>
            <li>Het toesturen van gratis oefenmateriaal en studietips voor het inburgeringsexamen</li>
            <li>Incidentele communicatie over het platform</li>
            <li>Het bijhouden van jouw voortgang, zodat je ziet waar je staat en welk onderdeel aandacht nodig heeft</li>
            <li>Het nakijken van je antwoorden op Schrijven en Spreken aan de hand van de beoordelingscriteria van de docent, en het bewaren van die beoordeling zodat de docent haar kan nakijken en corrigeren</li>
            <li>Het geven van toegang tot de modules die je hebt afgenomen, en het innen van het abonnement</li>
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
          <p>
            Heb je een account, dan bewaren wij je voortgang, je antwoorden, je opnames en je beoordelingen{' '}
            <strong>zolang je account bestaat</strong>. Vraag je om verwijdering van je account, dan
            verwijderen wij ook die gegevens. Voor betaalgegevens geldt de wettelijke administratieplicht van{' '}
            <strong>7 jaar</strong>.
          </p>

          <h2>6. Delen met derden</h2>
          <p>
            Wij schakelen de volgende partijen in als <strong>verwerker</strong>. Zij mogen jouw gegevens
            uitsluitend gebruiken om hun dienst aan ons te leveren.
          </p>
          <ul>
            <li><strong>Supabase</strong> — database, inloggen en opslag van bestanden. Onze gegevens staan in de EU (Frankfurt).</li>
            <li><strong>Vercel</strong> — hosting van de website.</li>
            <li><strong>Google</strong> — inloggen met je Google-account, en Google Analytics voor bezoekcijfers.</li>
            <li><strong>Mollie</strong> — betalingen en abonnementen.</li>
            <li><strong>Resend</strong> — het versturen van onze e-mails.</li>
            <li><strong>ElevenLabs</strong> — het uitschrijven van je spreekantwoord naar tekst, en het maken van het geluid bij de oefenexamens.</li>
            <li>
              <strong>Vercel AI Gateway</strong> — bij Schrijven en Spreken wordt je antwoord (bij Spreken:
              ook de geluidsopname) naar een taalmodel gestuurd, dat de beoordelingscriteria van de docent
              toepast. Je naam en e-mailadres gaan daarbij niet mee.
            </li>
            <li><strong>Microsoft Clarity</strong> — inzicht in hoe de website gebruikt wordt, inclusief opnames van muisbewegingen en kliks.</li>
            <li><strong>Meta</strong> — meten van het resultaat van onze advertenties.</li>
          </ul>
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
          <p>Deze website gebruikt twee soorten cookies en vergelijkbare technieken.</p>
          <ul>
            <li>
              <strong>Noodzakelijk</strong> — om je ingelogd te houden en om je voorkeuren (zoals geluid
              aan of uit) te onthouden. Zonder deze werkt het platform niet.
            </li>
            <li>
              <strong>Analyse en advertenties</strong> — Google Analytics, Microsoft Clarity en de Meta-pixel.
              Deze meten hoe de website gebruikt wordt en hoe onze advertenties presteren.
            </li>
          </ul>
          <p>
            Je kunt cookies altijd weigeren of verwijderen via de instellingen van je browser. Weiger je de
            noodzakelijke cookies, dan kun je niet inloggen.
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
