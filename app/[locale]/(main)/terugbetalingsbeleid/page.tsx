import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terugbetalingsbeleid | Inburgering Oefenen',
    description: 'Lees ons terugbetalingsbeleid voor aankopen op Inburgering Oefenen.',
    robots: { index: false, follow: true },
    alternates: {
      canonical: 'https://inburgeringoefenen.nl/nl/terugbetalingsbeleid',
    },
  };
}

export default async function TerugbetalingsbeleidPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 pb-24">
      <header className="mb-12">
        <div
          className="inline-flex items-center gap-2 mb-4"
          style={{ background: 'rgba(0,43,109,0.06)', borderRadius: '9999px', padding: '4px 12px' }}
        >
          <span className="text-xs font-bold tracking-widest uppercase text-primary">Juridisch</span>
        </div>
        <h1
          className="font-headline font-extrabold text-on-surface mb-3"
          style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', letterSpacing: '-0.02em' }}
        >
          Terugbetalingsbeleid
        </h1>
        <p className="text-on-surface-variant text-sm">Laatst bijgewerkt: juni 2026</p>
      </header>

      <div
        className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 prose"
        style={{ boxShadow: '0 2px 24px rgba(0,43,109,0.06)' }}
      >
        <p>
          Inburgering Oefenen biedt digitale leerproducten aan: online oefenexamens, woordkaarten en leermodules.
          Omdat toegang tot digitale content direct na aankoop beschikbaar is, hanteren wij het volgende beleid.
        </p>

        <h2>1. Recht op terugbetaling</h2>
        <p>
          Je hebt recht op een volledige terugbetaling binnen <strong>14 dagen</strong> na aankoopdatum,
          mits je <strong>het platform nog niet hebt gebruikt</strong> (d.w.z. geen proefexamen hebt gestart,
          geen leermodules hebt geopend en geen woordkaarten hebt bekeken).
        </p>
        <p>
          Als je het platform na aankoop direct hebt gebruikt, vervalt het herroepingsrecht op grond van
          artikel 6:230p sub e BW (digitale inhoud die al is geleverd met uitdrukkelijke toestemming van
          de consument).
        </p>

        <h2>2. Uitzondering — gedeeltelijk gebruik</h2>
        <p>
          Heb je het platform al gedeeltelijk gebruikt maar loop je tegen een technisch probleem aan?
          Neem dan contact op via <a href="mailto:info@samensterkintaal.nl">info@samensterkintaal.nl</a>.
          Wij beoordelen dergelijke verzoeken per geval en streven altijd naar een eerlijke oplossing.
        </p>

        <h2>3. Hoe een terugbetaling aanvragen</h2>
        <ol>
          <li>Stuur een e-mail naar <a href="mailto:info@samensterkintaal.nl">info@samensterkintaal.nl</a> met als onderwerp <em>"Terugbetalingsverzoek"</em>.</li>
          <li>Vermeld je naam, e-mailadres waarmee je hebt betaald en de aankoopdatum.</li>
          <li>Geef kort aan waarom je een terugbetaling wenst.</li>
        </ol>
        <p>
          Wij verwerken je verzoek binnen <strong>5 werkdagen</strong>. Goedgekeurde terugbetalingen
          worden teruggestort op de originele betaalmethode binnen 7 werkdagen.
        </p>

        <h2>4. Niet-restitueerbare situaties</h2>
        <ul>
          <li>Verzoeken ingediend na 14 dagen na aankoopdatum</li>
          <li>Aankopen waarbij het platform aantoonbaar is gebruikt</li>
          <li>Gevallen van misbruik of schending van de gebruiksvoorwaarden</li>
        </ul>

        <h2>5. Klachten</h2>
        <p>
          Ben je niet tevreden met de afhandeling van je terugbetalingsverzoek? Dan kun je een klacht
          indienen bij het <a href="https://www.sgc.nl" target="_blank" rel="noopener noreferrer">Geschillencommissie (SGC)</a> of
          de <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">Europese ODR-commissie</a>.
        </p>

        <h2>6. Contact</h2>
        <p>
          <strong>Samen Sterk in Taal</strong><br />
          van Naeltwijckstraat 13, 2274 NV Voorburg<br />
          KVK: 77533216 | BTW: NL003205081B10<br />
          E-mail: <a href="mailto:info@samensterkintaal.nl">info@samensterkintaal.nl</a><br />
          Tel.: 06 57587278
        </p>
      </div>
    </main>
  );
}
