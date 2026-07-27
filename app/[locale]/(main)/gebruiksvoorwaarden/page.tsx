import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: false, follow: true },
    alternates: {
      canonical: `https://inburgeringoefenen.nl/nl/gebruiksvoorwaarden`,
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/gebruiksvoorwaarden',
        en: 'https://inburgeringoefenen.nl/en/gebruiksvoorwaarden',
        ar: 'https://inburgeringoefenen.nl/ar/gebruiksvoorwaarden',
        'x-default': 'https://inburgeringoefenen.nl/nl/gebruiksvoorwaarden',
      },
    },
  };
}

export default async function GebruiksvoorwaardenPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 pb-24">
      <header className="mb-12">
        <div
          className="inline-flex items-center gap-2 mb-4"
          style={{ background: 'rgba(0,43,109,0.06)', borderRadius: '9999px', padding: '4px 12px' }}
        >
          <span className="text-xs font-bold tracking-widest uppercase text-primary">{t('eyebrow')}</span>
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
        <p>Door gebruik te maken van de website <strong>inburgeringoefenen.nl</strong> ga je akkoord met de onderstaande gebruiksvoorwaarden. Lees deze zorgvuldig door voordat je het platform gebruikt.</p>

        <h2>1. Over Inburgering Oefenen</h2>
        <p>Inburgering Oefenen is een online oefenplatform voor de <strong>KNM-toets (Kennis van de Nederlandse Maatschappij)</strong>, onderdeel van het inburgeringsexamen in Nederland. Het platform biedt gratis oefenvragen samengesteld door een gecertificeerde NT2-docent.</p>

        <h2>2. Gebruik van het platform</h2>
        <p>Het platform is bestemd voor persoonlijk en niet-commercieel gebruik. Je mag het platform gebruiken om te oefenen voor het KNM-examen. Het is niet toegestaan om:</p>
        <ul>
          <li>De inhoud van het platform commercieel te exploiteren of te reproduceren zonder schriftelijke toestemming</li>
          <li>Geautomatiseerde systemen (bots, scrapers) te gebruiken om inhoud te kopiëren</li>
          <li>De werking van het platform te verstoren of te misbruiken</li>
          <li>Valse of misleidende informatie in te voeren via het e-mailformulier</li>
        </ul>

        <h2>3. Inhoud en nauwkeurigheid</h2>
        <p>De oefenvragen zijn samengesteld door een gecertificeerde NT2-docent op basis van officieel KNM-examenmateriaal. Wij streven naar nauwkeurigheid, maar kunnen <strong>geen garantie geven</strong> dat de inhoud altijd volledig up-to-date of foutloos is. Het officiële KNM-examen wordt beheerd door <a href="https://www.duo.nl" target="_blank" rel="noopener noreferrer">DUO (Dienst Uitvoering Onderwijs)</a>. Raadpleeg altijd de officiële DUO-richtlijnen voor de meest actuele informatie.</p>

        <h2>4. Intellectueel eigendom</h2>
        <p>Alle inhoud op dit platform — inclusief teksten, vragen, ontwerp en code — is eigendom van Inburgering Oefenen of wordt gebruikt met toestemming. Niets van dit platform mag worden gekopieerd, verspreid of gepubliceerd zonder uitdrukkelijke schriftelijke toestemming, tenzij anders bepaald door de wet.</p>

        <h2>5. Aansprakelijkheid</h2>
        <p>Inburgering Oefenen is niet aansprakelijk voor:</p>
        <ul>
          <li>Onjuiste of onvolledige informatie op het platform</li>
          <li>Het niet slagen voor het officiële KNM-examen na gebruik van dit platform</li>
          <li>Technische storingen of onderbreking van de dienstverlening</li>
          <li>Schade die voortvloeit uit het gebruik of het niet kunnen gebruiken van het platform</li>
        </ul>
        <p>Het platform wordt aangeboden &quot;zoals het is&quot; (<em>as is</em>), zonder enige garantie van ononderbroken beschikbaarheid.</p>

        <h2>6. E-mail en communicatie</h2>
        <p>Door je e-mailadres in te voeren ga je akkoord met het ontvangen van jouw persoonlijke toetsresultaten en optionele gratis oefenmaterialen van Inburgering Oefenen. Je kunt je op elk moment afmelden via de afmeldlink in onze e-mails of door te mailen naar <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>.</p>

        <h2>7. Privacy</h2>
        <p>Het verzamelen en verwerken van persoonsgegevens is beschreven in ons <a href="/privacybeleid">Privacybeleid</a>, dat onderdeel uitmaakt van deze gebruiksvoorwaarden.</p>

        <h2>8. Toepasselijk recht</h2>
        <p>Op deze gebruiksvoorwaarden is <strong>Nederlands recht</strong> van toepassing. Eventuele geschillen worden voorgelegd aan de bevoegde Nederlandse rechter.</p>

        <h2>9. Wijzigingen</h2>
        <p>Wij behouden ons het recht voor deze gebruiksvoorwaarden op elk moment te wijzigen. Gewijzigde voorwaarden worden gepubliceerd op deze pagina met een nieuwe &quot;Laatste update&quot; datum. Voortgezet gebruik van het platform na publicatie van gewijzigde voorwaarden geldt als aanvaarding.</p>

        <h2>10. Contact</h2>
        <p>Voor vragen over deze gebruiksvoorwaarden: <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>.</p>
      </div>
    </main>
  );
}
