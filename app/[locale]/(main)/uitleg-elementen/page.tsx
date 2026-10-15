import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getFormat, type SkillSlug } from '@/data/skills';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import {
  Beslispad, ExamenOpbouw, KloptHet, Onderdelenkaart, Pogingen, Scenarios, Stappen, Termijn, Tijdlijn, Vergelijker,
  type BeslisUitkomst, type BeslisVraag, type OpbouwOnderdeel, type TijdlijnStop,
} from '@/components/glas/uitleg';

/* Uitlegelementen — ter beoordeling, niet geïndexeerd en niet in de sitemap (zoals /home-b was).
 *
 * Tien elementen uit components/glas/uitleg, elk gevuld met échte inhoud uit SEO/facts.md, en per
 * element de plekken in de gidsen, blog en pagina's waar het een alinea, lijst of tabel zou
 * vervangen (uit de inventaris van 15-10-2026). Keuzes van de eigenaar (15-10):
 * alleen de verticale tijdlijn; ladder voor een rechte reeks, stap voor vertakkingen. De pagina is Nederlands: het is een werkpagina voor de eigenaar. */

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Uitlegelementen · ter beoordeling',
  robots: { index: false, follow: false },
};

const W21 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&artikel=11';
const RIJK_PLICHT = 'https://www.rijksoverheid.nl/onderwerpen/immigratie-naar-nederland/vraag-en-antwoord/moet-ik-als-nieuwkomer-inburgeren';
const DIPLOMA = 'https://www.inburgeren.nl/minder-of-geen-examens/diploma-gehaald.jsp';
const BOETE = 'https://www.inburgeren.nl/u-gaat-inburgeren/boete.jsp';
const EXTRA = 'https://www.inburgeren.nl/extra-tijd/';
const NIEUWS16 = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16';
const BETALEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
const REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag.jsp';
const EXAMENS = 'https://www.inburgeren.nl/examen-doen/index.jsp';
const EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';

const TRAJECT: TijdlijnStop[] = [
  { id: 'brief', when: 'Na je inschrijving', title: 'Je krijgt een brief van DUO', body: 'DUO stuurt de brief als je een BSN, een verblijfsvergunning en een inschrijving in de gemeente hebt.' },
  { id: 'intake', when: 'Daarna', title: 'De brede intake', body: 'Een gesprek bij de gemeente en de leerbaarheidstoets. Die toets is geen examen: je kunt er niet voor slagen of zakken.' },
  { id: 'pip', when: 'Binnen 10 weken', title: 'Je krijgt je PIP', body: 'Je persoonlijk plan. Hierin staat je leerroute. De 10 weken tellen vanaf de brief van DUO.' },
  { id: 'start', when: 'De dag na je PIP', title: 'Je termijn begint', body: 'Ook als je PIP later verandert, blijft deze startdatum staan.' },
  { id: 'leren', when: 'Jaar 1 tot 3', title: 'Je leert en doet examens', kind: 'nu', tag: 'Jij bent hier', body: 'Je meldt je per examen aan in Mijn Inburgering. De uitslag krijg je binnen 8 weken. Voor Spreken en Schrijven A2 kan het nu tot 16 weken duren.' },
  { id: 'eind', when: '3 jaar na de start', title: 'Je termijn eindigt', kind: 'grens', body: 'Dan moet je klaar zijn. Lukt dat niet door iets buiten jou om, dan kun je soms extra tijd krijgen.' },
];
const TRAJECT_BRON = [
  { label: 'Wet inburgering 2021, art. 11', href: W21, checked: '19-08-2026' },
  { label: 'inburgeren.nl, uitslag', href: UITSLAG, checked: '19-08-2026' },
];

const VRAGEN: BeslisVraag[] = [
  { id: 'q1', vraag: 'Ben je jonger dan 18 jaar?', opties: [{ label: 'Ja', naar: 'nee' }, { label: 'Nee', naar: 'q2' }] },
  { id: 'q2', vraag: 'Heb je de AOW-leeftijd al bereikt?', hint: 'Dat is de leeftijd waarop je pensioen van de overheid krijgt.', opties: [{ label: 'Ja', naar: 'nee' }, { label: 'Nee', naar: 'q3' }] },
  { id: 'q3', vraag: 'Kom je uit een EU-land, Noorwegen, IJsland, Liechtenstein of Zwitserland?', opties: [{ label: 'Ja', naar: 'nee' }, { label: 'Nee', naar: 'q4' }] },
  { id: 'q4', vraag: 'Woon je hier tijdelijk, voor je studie of je werk?', opties: [{ label: 'Ja', naar: 'nee' }, { label: 'Nee', naar: 'q5' }] },
  { id: 'q5', vraag: 'Woonde je 8 jaar of langer in Nederland toen je leerplichtig was?', opties: [{ label: 'Ja', naar: 'nee' }, { label: 'Nee', naar: 'q6' }] },
  { id: 'q6', vraag: 'Heb je een Nederlands diploma: vmbo, havo, vwo, mbo 2 of hoger, of hbo of wo in het Nederlands?', opties: [{ label: 'Ja', naar: 'vrij' }, { label: 'Nee', naar: 'moet' }] },
];
const UITKOMSTEN: BeslisUitkomst[] = [
  { id: 'nee', toon: 'vrij', titel: 'Je hoeft niet in te burgeren', tekst: 'Volgens de Rijksoverheid geldt de plicht niet voor jou. DUO beslist. Moet je toch, dan krijg je een brief.' },
  { id: 'vrij', toon: 'check', titel: 'Je kunt vrijstelling krijgen', tekst: 'Met dit diploma hoef je de examens misschien niet te doen. Op inburgeren.nl staat welke papieren DUO wil zien.', link: { href: DIPLOMA, label: 'Naar inburgeren.nl' } },
  { id: 'moet', toon: 'moet', titel: 'Je moet waarschijnlijk inburgeren', tekst: 'Je krijgt dan een brief van DUO. Daarin staat wat je moet doen en wanneer.', link: { href: '/nl/inburgering/inburgering-stappenplan', label: 'Lees het stappenplan' } },
];
const PLICHT_BRON = [
  { label: 'Rijksoverheid, moet ik inburgeren?', href: RIJK_PLICHT, checked: '19-08-2026' },
  { label: 'inburgeren.nl, diploma gehaald', href: DIPLOMA, checked: '19-08-2026' },
];

const SKILL_UNITS: Record<SkillSlug, [string, string]> = {
  lezen: ['Lezen', 'vragen'], luisteren: ['Luisteren', 'vragen'], schrijven: ['Schrijven', 'opdrachten'], spreken: ['Spreken', 'opdrachten'],
};
const OPBOUW: OpbouwOnderdeel[] = (Object.keys(SKILL_UNITS) as SkillSlug[]).map(slug => ({
  id: slug,
  label: SKILL_UNITS[slug][0],
  unit: SKILL_UNITS[slug][1],
  niveaus: (['a2', 'b1'] as const).map(level => {
    const f = getFormat(level, slug);
    return { level, label: `Taal ${level.toUpperCase()}`, items: f.itemCount, minutes: f.durationMinutes };
  }),
}));

type Plek = { waar: string; nu: string };

function Sectie({ id, n, titel, wat, plekken, keuze, children }: { id: string; n: number; titel: string; wat: string; plekken: Plek[]; keuze?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="g-uitp-sec">
      <div className="g-uitp-side">
        <span className="g-uitp-n">{String(n).padStart(2, '0')}</span>
        <h2>{titel}</h2>
        <p>{wat}</p>
        {keuze ? <p className="g-uitp-keuze">{keuze}</p> : null}
        <h3>Vervangt</h3>
        <ul>
          {plekken.map(p => <li key={p.waar}><b>{p.waar}</b><span>{p.nu}</span></li>)}
        </ul>
      </div>
      <div className="g-uitp-col">{children}</div>
    </section>
  );
}

export default async function UitlegElementenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="g-uitp">
      <PageField variant="nevel">
        <SectionHeading
          as="h1"
          size="h1"
          title="Uitlegelementen"
          muted="Zien wat er staat, niet alleen lezen."
          onField
        />
        <p className="g-lead" style={{ marginTop: 18, maxWidth: '60ch' }}>
          Tien elementen voor de gidsen, de blog en de leerlaag. Elk element is gevuld met echte inhoud
          uit de gidsen, met de bron eronder. Links staat waar het een alinea, lijst of tabel vervangt.
         
        </p>
        <nav className="g-uitp-toc" aria-label="Elementen">
          {[
            ['tijdlijn', 'Tijdlijn'], ['beslispad', 'Beslispad'], ['ladder', 'Ladder'], ['scenarios', "Scenario's"],
            ['pogingen', 'Pogingen'], ['stappen', 'Stappen'], ['vergelijker', 'Vergelijker'], ['termijn', 'Termijn'],
            ['opbouw', 'Examenopbouw'], ['kaart', 'Onderdelenkaart'], ['klopt', 'Klopt het?'],
          ].map(([h, l]) => <a key={h} href={`#${h}`}>{l}</a>)}
        </nav>
      </PageField>

      <div className="g-wrap g-uitp-list">
        <Sectie
          id="tijdlijn" n={1} titel="Tijdlijn" wat="Momenten van boven naar beneden. Een ring is iets dat gebeurt, het navy vierkant een harde datum, oranje is waar jij staat. De lijn tekent zich één keer als je erlangs scrolt."
          plekken={[
            { waar: 'Stappenplan · stap 3', nu: 'brief, PIP, start termijn als losse feiten' },
            { waar: 'Boete en termijn', nu: 'de start van je termijn, en dat een nieuw PIP hem niet verschuift' },
            { waar: 'ONA-examen', nu: 'portfolio, beoordeling, eindgesprek: ongeveer een half jaar' },
            { waar: 'Geschiedenis en geografie', nu: 'zes tijdperken als stappenlijst' },
            { waar: 'Onderwijs en opvoeding', nu: 'leerplicht van 5 tot 16, kwalificatieplicht tot 18' },
          ]}
        >
          <Tijdlijn title="Van de brief tot het einde van je termijn" intro="Onder de Wet inburgering 2021. Je termijn is drie jaar en begint pas na je PIP." stops={TRAJECT} bron={TRAJECT_BRON} />
        </Sectie>

        <Sectie
          id="beslispad" n={2} titel="Beslispad" keuze="Gekozen: voor vragen die vertakken."
          wat="Een reeks vragen die eindigt op één antwoord. Je antwoorden staan erboven; klik erop om terug te gaan. Een uitkomst is groen (je hoeft niets), navy (het geldt voor je) of klei (vraag het na)."
          plekken={[
            { waar: 'Moet ik inburgeren?', nu: 'wel/niet-raster met zes uitzonderingen' },
            { waar: 'PVT, MAP en ONA', nu: 'tabel: welke onderdelen bij welke wet en route' },
            { waar: 'ONA-examen', nu: 'is ONA voor jou? en eindgesprek of cursus' },
            { waar: 'Welke wet en route · afschalen', nu: 'B1 naar A2: drie keer anders getekend in drie gidsen' },
            { waar: 'Gezondheid · 112 of huisartsenpost', nu: 'een triage geschreven als stappen' },
            { waar: 'Blog · want of omdat', nu: 'een regel met één vraag erin' },
          ]}
        >
          <Beslispad title="Moet ik inburgeren?" intro="Zes vragen. Na elke vraag weet je of je verder moet." start="q1" vragen={VRAGEN} uitkomsten={UITKOMSTEN} bron={PLICHT_BRON} />
        </Sectie>

        <Sectie
          id="ladder" n={3} titel="Ladder" keuze="Gekozen: voor een rechte reeks vragen."
          wat="Alleen voor een rechte reeks, waar elke vraag één uitgang heeft. De lezer ziet vooraf hoe lang het pad is en waar het eindigt. De vragen na een uitgang worden grijs."
          plekken={[
            { waar: 'Moet ik inburgeren?', nu: 'zelfde plek als het beslispad' },
            { waar: 'Vrijstelling en ontheffing', nu: 'blijvend, tijdelijk, of alles geprobeerd' },
            { waar: 'KNM-examen', nu: 'doe ik het KNM-examen?' },
          ]}
        >
          <Beslispad variant="ladder" title="Moet ik inburgeren?" intro="Begin bovenaan. Bij elke ‘ja’ ben je klaar." start="q1" vragen={VRAGEN} uitkomsten={UITKOMSTEN} bron={PLICHT_BRON} />
        </Sectie>

        <Sectie
          id="scenarios" n={4} titel="Scenario's" wat="Kies een situatie. Links wat er dan gebeurt, rechts in Nacht wat jij doet. Voor regels die per situatie anders uitpakken."
          plekken={[
            { waar: 'Boete en termijn', nu: 'bedragen, extra tijd en uitzonderingen achter elkaar' },
            { waar: 'Wat kost inburgeren?', nu: 'asielstatushouder of niet, als twee kolommen' },
            { waar: 'Tijdlijntool · verlenging', nu: 'de automatische 6 maanden zit alleen in de tool' },
            { waar: 'Staatsinrichting', nu: 'mag ik stemmen? als tabel' },
          ]}
        >
          <Scenarios
            title="Wat als je termijn niet lukt?"
            intro="Het hangt af van wie je bent en waarom het niet lukt."
            scenarios={[
              { id: 'asiel', label: 'Termijn voorbij · asielstatushouder', gevolgen: [
                { tone: 'goed', tekst: 'Je krijgt geen boete.' },
                { tone: 'goed', tekst: 'DUO vraagt je lening niet terug.' },
                { tekst: 'Dat volgt uit een uitspraak van de Raad van State van 9 juli 2025.' },
              ], doe: 'Blijf leren en doe je examens. In Mijn Inburgering zie je wat nog openstaat.' },
              { id: 'overig', label: 'Termijn voorbij · andere inburgeraar', gevolgen: [
                { tone: 'let-op', tekst: 'Je kunt een boete krijgen: voor de leerroute op dit moment tot €1.000.' },
                { tone: 'let-op', tekst: 'Voor PVT en MAP is dat elk tot €340.' },
                { tone: 'tijd', tekst: 'Daarna krijg je extra tijd: 6 maanden tot 2 jaar. Hoeveel, hangt af van wat je al gehaald of gevolgd hebt.' },
              ], doe: 'Haal zoveel mogelijk onderdelen voor je einddatum. Elk gehaald examen telt mee.' },
              { id: 'ziek', label: 'Je bent ziek of krijgt een baby', gevolgen: [
                { tone: 'tijd', tekst: 'Je kunt extra tijd krijgen.' },
                { tekst: 'Dat kan ook bij een overlijden in de familie, dakloosheid of een verblijf in een instelling.' },
                { tone: 'let-op', tekst: 'In een periode krijg je maar 1 keer extra tijd. DUO noemt geen vaste duur.' },
              ], doe: 'Vraag extra tijd aan bij DUO zodra het speelt. Bewaar de papieren die het laten zien.' },
              { id: 'uitslag', label: 'De uitslag duurt lang', gevolgen: [
                { tone: 'tijd', tekst: 'Nakijken van Spreken en Schrijven A2 duurt nu maximaal 16 weken.' },
                { tone: 'goed', tekst: 'Kom je daardoor in de knel? Dan krijg je automatisch 6 maanden extra.' },
              ], doe: 'Je hoeft niets aan te vragen. Plan een herkansing wel op tijd.' },
            ]}
            bron={[
              { label: 'inburgeren.nl, boete', href: BOETE, checked: '20-08-2026' },
              { label: 'inburgeren.nl, extra tijd', href: EXTRA, checked: '20-08-2026' },
              { label: 'nieuwsbericht 31-07-2026', href: NIEUWS16 },
            ]}
          />
        </Sectie>

        <Sectie
          id="pogingen" n={5} titel="Pogingen" wat="Speel je pogingen na. Kies wie je bent en wat er per poging gebeurt; het totaal telt mee. Op tijd afzeggen kost niets en telt niet."
          plekken={[
            { waar: 'Wat kost inburgeren?', nu: 'prijslijst plus een alinea over herkansen' },
            { waar: 'Blog · gezakt voor je examen', nu: 'hoeveel pogingen passen er nog?' },
            { waar: 'Oefenexamen-overzicht', nu: '€50 bij DUO tegenover €9,95 oefenen' },
          ]}
        >
          <Pogingen
            title="Wat kost een herkansing?"
            intro="Zeg je 7 dagen of eerder af? Dan krijg je je geld terug, en een gratis poging blijft staan."
            locale={locale}
            profielen={[
              { id: 'asiel', label: 'Asielstatushouder', gratis: 2, prijs: 50, noot: 'De eerste 2 pogingen van elk examen zijn gratis. Een extra poging betaal je zelf, en daarvoor kun je niet lenen.' },
              { id: 'overig', label: 'Andere inburgeraar', gratis: 0, prijs: 50, noot: 'Je betaalt elke poging zelf: op dit moment €50 per examen.' },
            ]}
            maxNote="DUO noemt geen maximum aantal pogingen. In de praktijk is je termijn de grens."
            bron={[
              { label: 'inburgeren.nl, betalen', href: BETALEN, checked: '20-08-2026' },
              { label: 'Examenreglement, art. 11', href: REGLEMENT },
            ]}
          />
        </Sectie>

        <Sectie
          id="stappen" n={6} titel="Stappen" wat="Een proces één stap tegelijk, met een klok erbij en waar nodig een afvinklijst. De vinkjes zijn alleen voor jou en worden niet bewaard."
          plekken={[
            { waar: 'Blog · examen A2 uitgelegd', nu: 'de examendag als lijst' },
            { waar: 'Schrijven-examen', nu: '1 minuut overzicht, schrijven, 5 minuten nakijken' },
            { waar: 'Vrijstelling en ontheffing', nu: 'aanvragen: €225, arts, DUO beslist' },
            { waar: 'Wonen · overlast', nu: 'praten, bemiddeling, verhuurder, politie' },
          ]}
        >
          <Stappen
            title="Je examendag"
            intro="Voorbeeld: het examen Lezen A2."
            stappen={[
              { id: 's1', when: '30 min', whenSub: 'voor de start', title: 'Je bent er op tijd', body: 'Kom 30 minuten voor het examen. Zonder geldig identiteitsbewijs mag je niet meedoen.', check: ['Ik heb een geldig identiteitsbewijs bij me'] },
              { id: 's2', when: 'Kluis', whenSub: 'bij aankomst', title: 'Alles in het kluisje', body: 'Je neemt niets mee naar je plek. Naar de wc mag, maar alleen met begeleiding.', check: ['Telefoon', 'Horloge', 'Tas'] },
              { id: 's3', when: '15 min', whenSub: 'uitleg', title: 'Uitleg voor het examen', body: 'Je krijgt eerst 15 minuten uitleg. Die tijd komt bovenop de examentijd.' },
              { id: 's4', when: '65 min', whenSub: 'Lezen A2', title: 'Het examen', body: 'Je maakt 25 vragen op de computer. Maak geen foto’s en schrijf geen vragen over: dat is fraude.' },
              { id: 's5', when: '8 wk', whenSub: 'uiterlijk', title: 'De uitslag', body: 'Je krijgt de uitslag binnen 8 weken per brief. Een gemaakt examen kun je achteraf niet inzien.' },
            ]}
            bron={[
              { label: 'Examenreglement, art. 7–9, 14 en 16', href: REGLEMENT },
              { label: 'inburgeren.nl, uitslag', href: UITSLAG, checked: '19-08-2026' },
            ]}
          />
        </Sectie>

        <Sectie
          id="vergelijker" n={7} titel="Vergelijker" wat="Twee dingen naast elkaar. Kies welke kolom voor jou geldt, of laat alleen de verschillen zien. Een grijs streepje is ‘geldt niet’, nooit een rood kruis."
          plekken={[
            { waar: 'Welke wet en welke route', nu: 'een tabel plus een tekening van twee wetten' },
            { waar: 'Taalexamens A2 en B1', nu: 'tijden per onderdeel als tabel' },
            { waar: 'Gezondheid · basis of aanvullend', nu: 'twee kaarten naast elkaar' },
            { waar: 'Werk en inkomen · tijdelijk of vast', nu: 'twee kaarten naast elkaar' },
            { waar: 'Instanties · aangifte of toeslag', nu: 'geld dat je betaalt, geld dat je krijgt' },
          ]}
        >
          <Vergelijker
            title="Wet 2013 of Wet 2021: wat is het verschil?"
            intro="Welke wet voor jou geldt, staat in de brief van DUO."
            kolommen={[{ id: 'w13', label: 'Wet 2013', sub: 'plicht vóór 2022' }, { id: 'w21', label: 'Wet 2021', sub: 'geldt sinds 1 januari 2022' }]}
            rijen={[
              { id: 'ex', label: 'Welke examens', waarden: [{ t: 'Lezen, Luisteren, Schrijven, Spreken, KNM, ONA en PVT', sub: 'als je vanaf 1 oktober 2017 moest' }, { t: 'Dat staat in je PIP', sub: 'het hangt af van je leerroute' }] },
              { id: 'niv', label: 'Taalniveau', waarden: ['A2 of hoger', { t: 'B1 in de B1-route', sub: 'Z-route: A1 · onderwijsroute: B1 of hoger' }] },
              { id: 'ona', label: 'ONA', waarden: ['Ja', null] },
              { id: 'map', label: 'MAP', waarden: [null, { t: 'Ja, bij de gemeente', sub: 'niet in de onderwijsroute' }] },
              { id: 'pvt', label: 'PVT', waarden: ['Ja', 'Ja'], zelfde: true },
              { id: 'knm', label: 'KNM-examen', waarden: ['Ja', { t: 'Ja, behalve in de Z-route', sub: 'daar volg je KNM-lessen' }] },
              { id: 'kost', label: 'Examenkosten nu', waarden: [{ t: '€290 totaal', sub: '€50 per onderdeel, ONA €40' }, { t: '€250 totaal', sub: '€50 per onderdeel' }] },
              { id: 'boete', label: 'Hoogste boete', waarden: [{ t: '€1.250', sub: 'voor het diploma' }, { t: '€1.000', sub: 'voor de leerroute' }] },
              { id: 'asiel', label: 'Asielstatushouders', waarden: ['Nooit een boete', 'Nooit een boete'], zelfde: true },
            ]}
            bron={[
              { label: 'inburgeren.nl, examen doen', href: EXAMENS, checked: '19-08-2026' },
              { label: 'inburgeren.nl, boete', href: BOETE, checked: '20-08-2026' },
              { label: 'inburgeren.nl, betalen', href: BETALEN },
            ]}
          />
        </Sectie>

        <Sectie
          id="termijn" n={8} titel="Termijn" wat="Een rekenhulp met één invoer. Vul de datum van je PIP in en zie je start, je einde en de dagen die je nog hebt. Dezelfde rekenregel als de tijdlijntool."
          plekken={[
            { waar: 'Welke wet en welke route', nu: 'de termijnbalk, niet op schaal' },
            { waar: 'Boete en termijn', nu: '‘reken terug vanaf je einddatum’ als tekst' },
            { waar: 'Stappenplan · stap 3', nu: 'de drie jaar als feitblok' },
          ]}
        >
          <Termijn
            title="Hoeveel tijd heb je nog?"
            intro="Onder de Wet inburgering 2021. Je termijn begint de dag na de datum op je PIP."
            locale={locale}
            toolHref={`/${locale}/inburgering/tools/tijdlijn`}
            bron={{ label: 'Wet inburgering 2021, art. 11', href: W21, checked: '19-08-2026' }}
          />
        </Sectie>

        <Sectie
          id="opbouw" n={9} titel="Examenopbouw" wat="Eén balk per niveau. De lengte is de tijd, elk blokje is een vraag. Je ziet zonder rekenen hoeveel tijd je per vraag hebt. Onbekend blijft onbekend: geen nul."
          plekken={[
            { waar: 'Lezen-, Luisteren-, Schrijven- en Spreken-examen', nu: 'vier losse tabellen A2 tegen B1' },
            { waar: 'B1-examen', nu: 'tijden per onderdeel als tabel' },
            { waar: 'Blog · Luisteren', nu: 'Lezen tegen Luisteren: zelfde vragen, minder tijd' },
          ]}
        >
          <ExamenOpbouw
            title="Hoe ziet het examen eruit?"
            intro="Kies een onderdeel."
            onderdelen={OPBOUW}
            locale={locale}
            bron={[
              { label: 'A2: inburgeren.nl, inhoud taalexamens', href: 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp' },
              { label: 'B1: geteld in de openbare oefenexamens van DUO' },
            ]}
          />
        </Sectie>

        <Sectie
          id="kaart" n={10} titel="Onderdelenkaart" wat="Een geheel en zijn delen. De grootte van een tegel is het gewicht. De tegel van de gids waarin je staat is navy. Klik een tegel voor zijn uitleg."
          plekken={[
            { waar: 'Alle acht KNM-gidsen', nu: 'de eindtermen bovenaan als lijst' },
            { waar: 'KNM-examen', nu: 'acht thema’s als kaarten' },
            { waar: 'Instanties', nu: 'wie regelt wat, als tabel' },
            { waar: 'Stappenplan', nu: 'wat je moet halen voor je diploma' },
          ]}
        >
          <Onderdelenkaart
            title="De acht thema’s van KNM"
            intro="Naar het aantal eindtermen. Je staat nu in de gids over Wonen."
            eenheid="eindtermen"
            huidig="wonen"
            delen={[
              { id: 'instanties', label: 'Instanties', gewicht: 6, tekst: 'Wie regelt wat: gemeente, Belastingdienst, UWV en meer.', href: `/${locale}/knm/instanties`, linkLabel: 'Naar de gids' },
              { id: 'gezondheid', label: 'Gezondheid en zorg', gewicht: 5, tekst: 'De huisarts, de zorgverzekering en wat je zelf betaalt.', href: `/${locale}/knm/gezondheid-en-gezondheidszorg`, linkLabel: 'Naar de gids' },
              { id: 'werk', label: 'Werk en inkomen', gewicht: 4, tekst: 'Werk zoeken, je contract en je loonstrook.', href: `/${locale}/knm/werk-en-inkomen`, linkLabel: 'Naar de gids' },
              { id: 'wonen', label: 'Wonen', gewicht: 3, tekst: 'Huren, verhuizen en je buren.', href: `/${locale}/knm/wonen`, linkLabel: 'Naar de gids' },
              { id: 'onderwijs', label: 'Onderwijs en opvoeding', gewicht: 3, tekst: 'School, leerplicht en hulp bij opvoeden.', href: `/${locale}/knm/onderwijs-en-opvoeding`, linkLabel: 'Naar de gids' },
              { id: 'omgang', label: 'Omgangsvormen', gewicht: 2, tekst: 'Omgangsvormen duiden en meedoen in sociale netwerken.', href: `/${locale}/knm/omgangsvormen-waarden-en-normen`, linkLabel: 'Naar de gids' },
              { id: 'geschiedenis', label: 'Geschiedenis en geografie', gewicht: 2, tekst: 'Belangrijke tijden en de kaart van Nederland.', href: `/${locale}/knm/geschiedenis-en-geografie`, linkLabel: 'Naar de gids' },
              { id: 'staat', label: 'Staatsinrichting', gewicht: 2, tekst: 'De regering, de Kamers en de rechter.', href: `/${locale}/knm/staatsinrichting-en-rechtsstaat`, linkLabel: 'Naar de gids' },
            ]}
            bron={{ label: 'Staatscourant 2024, 15802', href: EINDTERMEN }}
          />
        </Sectie>

        <Sectie
          id="klopt" n={11} titel="Klopt het?" wat="Een paar dingen die mensen vaak denken. Kies, en lees het antwoord met de bron. Groen is goed gezien, rood niet."
          plekken={[
            { waar: 'Welke wet en welke route', nu: 'de valkuil ‘2021 maar sinds 2022’ als feitblok' },
            { waar: 'Vrijstelling · 8 jaar onderwijs', nu: 'een docentnotitie: ‘wordt vaak omgekeerd gelezen’' },
            { waar: 'Taalexamens · de slaaggrens', nu: 'wat wel en niet bekend is' },
          ]}
        >
          <KloptHet
            title="Klopt het?"
            intro="Vier dingen die we vaak horen."
            beweringen={[
              { id: 'k1', tekst: 'De Wet inburgering 2021 geldt sinds 2021.', klopt: false, uitleg: 'Ze heet 2021, maar ze geldt sinds 1 januari 2022.', bron: 'Rijksoverheid, nieuwe Wet inburgering' },
              { id: 'k2', tekst: 'Je termijn is 3 jaar, vanaf de dag na de datum op je PIP.', klopt: true, uitleg: 'Ook als je PIP later verandert, blijft die start staan.', bron: 'Wet inburgering 2021, art. 11' },
              { id: 'k3', tekst: 'Na je examen kun je je antwoorden inzien.', klopt: false, uitleg: 'Een gemaakt examen kun je niet inzien.', bron: 'Examenreglement, art. 14 lid 3' },
              { id: 'k4', tekst: 'Asielstatushouders krijgen een boete als ze te laat zijn.', klopt: false, uitleg: 'Asielstatushouders krijgen nooit een boete.', bron: 'inburgeren.nl, boete · Raad van State, 9 juli 2025' },
            ]}
          />
        </Sectie>
      </div>
    </main>
  );
}
