/**
 * KNM thema 6 — Instanties.
 *
 * Six eindtermen (Stcrt. 2024, 15802) — the most of any thema: 6.1 omgaan met
 * overheidsinformatie · 6.2 gebruikmaken van gemeentediensten · 6.3 omgaan met belastingaangifte
 * en toeslagen · 6.4 omgaan met politiedienstverlening · 6.5 gebruikmaken van juridische hulp ·
 * 6.6 omgaan met verzekeringen.
 *
 * This is the thema the whole exam leans on: almost every situation question in KNM ends in
 * "…en naar wie ga je dan?". So the page is organised as a **who-does-what table first**, and
 * the eindtermen after it. That inverts the usual order deliberately — the lookup is the thing a
 * reader came for, and it is also the thing that answers the most exam questions.
 *
 * No toeslag amounts, no boetebedragen, no belastingschijven: all yearly. Mechanisms only.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_LANDMARK, I_EURO, I_ALERT, I_CLIPBOARD, I_USERS, I_HOME,
  docent, note, inlineCta, factTwo,
} from './kit';

const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
const SRC_DIGID = 'https://www.digid.nl/';
const SRC_TOESLAGEN = 'https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/toeslagen';
const SRC_AANGIFTE = 'https://www.belastingdienst.nl/wps/wcm/connect/nl/aangifte-inkomstenbelasting/aangifte-inkomstenbelasting';
const SRC_POLITIE = 'https://www.politie.nl/informatie/wanneer-bel-ik-112.html';
const SRC_JURIDISCHLOKET = 'https://www.juridischloket.nl/';
const SRC_RECHTSBIJSTAND = 'https://www.rijksoverheid.nl/onderwerpen/rechtsbijstand';
const SRC_GEMEENTE = 'https://www.rijksoverheid.nl/onderwerpen/gemeenten';
const CHECKED = '23-08-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'instanties',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'loket',

  title: 'KNM thema Instanties: wie doet wat in Nederland?',
  description:
    'Gemeente, Belastingdienst, DUO, UWV, politie en het Juridisch Loket. Wie gaat waarover, en waar moet je zijn? Het KNM-thema Instanties overzichtelijk uitgelegd.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Instanties',
  eyebrow: 'KNM-thema 6',

  heroTitle: 'Instanties',
  heroSubtitle:
    'Nederland regelt veel via organisaties met afkortingen. Welke gaat waarover? Dit thema is het adresboek van je nieuwe leven — en het komt in bijna elke examenvraag terug.',
  readingMinutes: 9,

  articleHtml: `
<h2 id="wie-doet-wat">Wie gaat waarover?</h2>

<p>Begin hier. Als je deze tabel kent, kun je de meeste vragen van dit thema beantwoorden — en een
groot deel van de rest van het examen ook.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Waar het over gaat</th><th>Waar je moet zijn</th></tr></thead>
  <tbody>
    <tr><td>Inschrijven, verhuizen, paspoort, rijbewijs, trouwen, geboorte</td><td><strong>De gemeente</strong></td></tr>
    <tr><td>Bijstand, hulp bij het huishouden, schuldhulp, inburgeringstraject</td><td><strong>De gemeente</strong></td></tr>
    <tr><td>Belastingaangifte, zorgtoeslag, huurtoeslag, kinderopvangtoeslag</td><td><strong>De Belastingdienst</strong></td></tr>
    <tr><td>Kinderbijslag en AOW</td><td><strong>De SVB</strong> (Sociale Verzekeringsbank)</td></tr>
    <tr><td>WW-uitkering en arbeidsongeschiktheid</td><td><strong>UWV</strong></td></tr>
    <tr><td>Je inburgeringsexamens, en lenen voor je cursus</td><td><strong>DUO</strong></td></tr>
    <tr><td>Verblijfsvergunning, naturalisatie</td><td><strong>De IND</strong></td></tr>
    <tr><td>Aangifte doen, misdrijf melden, gevonden voorwerpen</td><td><strong>De politie</strong></td></tr>
    <tr><td>Gratis eerste juridisch advies</td><td><strong>Het Juridisch Loket</strong></td></tr>
    <tr><td>Ruzie over huur, servicekosten of onderhoud (sociale huur)</td><td><strong>De Huurcommissie</strong></td></tr>
  </tbody>
</table>
</div>

${docent('Als een examenvraag begint met "Ali krijgt een brief van…", dan is de vraag eigenlijk: wie is dit en wat wil hij. Leer daarom niet de namen, maar de onderwerpen. Wie gaat over geld dat je kr&iacute;jgt, wie over geld dat je bet&aacute;alt, wie over papieren.')}

<h2 id="eindtermen">Wat vraagt KNM over dit thema?</h2>

<p>Zes eindtermen — meer dan bij elk ander thema. Dat zegt hoe belangrijk dit onderdeel is.</p>

<div class="compare-rows">
  ${row('6.1', 'Omgaan met overheidsinformatie')}
  ${row('6.2', 'Gebruikmaken van gemeentediensten')}
  ${row('6.3', 'Omgaan met belastingaangifte en toeslagen')}
  ${row('6.4', 'Omgaan met politiedienstverlening')}
  ${row('6.5', 'Gebruikmaken van juridische hulp')}
  ${row('6.6', 'Omgaan met verzekeringen')}
</div>

${fact('De eindtermen KNM bij thema Instanties zijn: omgaan met overheidsinformatie; gebruikmaken van gemeentediensten; omgaan met belastingaangifte en toeslagen; omgaan met politiedienstverlening; gebruikmaken van juridische hulp; omgaan met verzekeringen.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

<h2 id="overheidsinformatie">Overheidsinformatie en DigiD</h2>

<p>De Nederlandse overheid werkt bijna helemaal digitaal. De sleutel daarvoor is je
<strong>DigiD</strong>: je persoonlijke inlogcode voor de overheid. Daarmee log je in bij de
Belastingdienst, DUO, je gemeente, UWV, de SVB en je zorgverzekeraar.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Zo ga je met DigiD om</p>
    <ul>
      <li>${I_CHECK}<span>Vraag hem aan zodra je een BSN hebt en bij de gemeente staat ingeschreven</span></li>
      <li>${I_CHECK}<span>Installeer de DigiD-app; dat is veiliger en makkelijker dan sms</span></li>
      <li>${I_CHECK}<span>Lukt inloggen niet? Bel de instantie zelf — die helpt je</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Nooit doen</p>
    <ul>
      <li>${I_X}<span>Je DigiD delen, ook niet met familie of een tussenpersoon</span></li>
      <li>${I_X}<span>Inloggen via een link in een e-mail of sms — dat is bijna altijd oplichting</span></li>
      <li>${I_X}<span>Iemand betalen om "je toeslagen te regelen"</span></li>
    </ul>
  </div>
</div>

<p>Krijg je een brief die je niet begrijpt? Gooi hem niet weg en negeer hem niet. Bij de meeste
gemeenten en bij bibliotheken zijn er gratis <strong>informatiepunten digitale overheid</strong>
waar iemand met je meekijkt. Vraag hulp; dat is normaal en het is gratis.</p>

${fact('Met DigiD logt u in bij de Nederlandse overheid en bij organisaties in zorg, onderwijs en pensioen. DigiD is persoonlijk en mag u niet aan iemand anders geven.', 'DigiD — over DigiD', SRC_DIGID, CHECKED)}

${note('Officiële brieven hebben in Nederland vaak een <strong>termijn</strong>: een aantal weken waarbinnen je moet reageren of bezwaar kunt maken. Meestal is dat zes weken. Ben je te laat, dan is het besluit definitief, ook als het fout was. Kijk daarom altijd eerst naar de datum en de termijn in de brief.')}

<h2 id="gemeente">De gemeente</h2>

<p>Je gemeente is de overheid die het dichtst bij je staat, en waar je het meest komt.</p>

<div class="guide-cards">
  ${card(I_HOME, 'Burgerzaken', 'Inschrijven, verhuizen, paspoort of ID-kaart, rijbewijs, uittreksels, trouwen, geboorteaangifte.')}
  ${card(I_EURO, 'Werk en inkomen', 'Bijstandsuitkering, bijzondere bijstand, en hulp bij schulden.')}
  ${card(I_USERS, 'Wmo en jeugd', 'Hulp thuis, hulpmiddelen, dagbesteding, en jeugdhulp voor kinderen.')}
  ${card(I_CLIPBOARD, 'Inburgering', 'De brede intake, je PIP, en de begeleiding tijdens je inburgeringstraject.')}
  ${card(I_LANDMARK, 'Vergunningen en de buurt', 'Verbouwen, een evenement, afval, parkeren, en meldingen over de openbare ruimte.')}
  ${card(I_EURO, 'Gemeentelijke belastingen', 'Afvalstoffenheffing, rioolheffing en ozb — met kwijtschelding bij een laag inkomen.')}
</div>

${fact('Gemeenten voeren veel overheidstaken uit die inwoners direct raken, waaronder burgerzaken, bijstand, maatschappelijke ondersteuning, jeugdhulp en vergunningen.', 'Rijksoverheid — Gemeenten', SRC_GEMEENTE, CHECKED)}

<h2 id="belasting">Belasting en toeslagen</h2>

<p>Twee dingen die vaak door elkaar worden gehaald.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Belastingaangifte</h3>
      <p class="compare-when">Geld dat jij betaalt (of terugkrijgt)</p>
    </div>
    <div class="compare-rows">
      ${row('Wanneer', 'Eén keer per jaar, meestal vóór 1 mei')}
      ${row('Hoe', 'Online met DigiD; veel gegevens zijn al ingevuld')}
      ${row('Waarom doen', 'Vaak krijg je geld terug, ook als je weinig verdient')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Toeslagen</h3>
      <p class="compare-when">Geld dat jij krijgt</p>
    </div>
    <div class="compare-rows">
      ${row('Welke', 'Zorgtoeslag, huurtoeslag, kinderopvangtoeslag, kindgebonden budget')}
      ${row('Hoe', 'Zelf aanvragen bij de Belastingdienst, met DigiD')}
      ${row('Let op', 'Het is een voorschot: verandert je inkomen, geef dat direct door')}
    </div>
  </div>
</div>

<p>Dat laatste is het belangrijkste zinnetje van dit hele thema. Een toeslag is een
<strong>voorschot</strong> op basis van je verwachte inkomen. Ga je meer verdienen, of gaat iemand
bij je wonen, en geef je dat niet door, dan moet je later alles terugbetalen. Dat gebeurt veel, en
het is te voorkomen met &eacute;&eacute;n wijziging in Mijn Toeslagen.</p>

${factTwo('Toeslagen worden als voorschot uitbetaald op basis van uw verwachte situatie; wijzigingen in inkomen of huishouden moet u zelf doorgeven, anders moet u te veel ontvangen toeslag terugbetalen. De aangifte inkomstenbelasting doet u jaarlijks online met DigiD.', [['Belastingdienst — Toeslagen', SRC_TOESLAGEN], ['Belastingdienst — Aangifte inkomstenbelasting', SRC_AANGIFTE]], CHECKED)}

${docent('Ik raad iedereen aan om aangifte te doen, ook als het niet hoeft. Veel mensen met een laag inkomen of een deel van het jaar gewerkt krijgen geld terug. De Belastingdienst zoekt je daarvoor niet op — je moet het zelf doen.')}

<h2 id="politie">De politie</h2>

<p>Eindterm 6.4. Drie nummers, en het verschil is belangrijk.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>112 — spoed</h3>
    <p>Direct gevaar, een misdrijf dat nu gebeurt, of een verdachte situatie. Gratis, dag en nacht. Je krijgt politie, brandweer of ambulance.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>0900-8844 — geen spoed</h3>
    <p>Iets melden, een vraag stellen, een afspraak maken om aangifte te doen.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Politie.nl — online</h3>
    <p>Voor veel zaken, zoals een gestolen fiets of oplichting via internet, kun je online aangifte doen.</p>
  </div></div>
</div>

<p><strong>Aangifte doen mag altijd</strong>, en de politie is verplicht die op te nemen. Ben je
slachtoffer van geweld, diefstal of discriminatie, dan is aangifte doen de manier om er iets mee
te laten gebeuren. De politie gaat niet over je verblijfsvergunning; dat is de IND.</p>

${fact('Bel 112 bij direct gevaar voor leven of gezondheid, bij een misdrijf dat op dat moment plaatsvindt of bij een verdachte situatie. Is er geen spoed, dan belt u 0900-8844.', 'Politie.nl — Wanneer bel ik 112?', SRC_POLITIE, CHECKED)}

<h2 id="juridische-hulp">Juridische hulp</h2>

<p>Eindterm 6.5. Heb je een juridisch probleem — met je verhuurder, je werkgever, een webshop, of
een instantie — dan hoef je dat niet alleen op te lossen, en je hoeft er niet meteen een dure
advocaat bij te halen.</p>

<div class="guide-cards">
  ${card(I_CLIPBOARD, 'Het Juridisch Loket', 'Gratis eerste advies, telefonisch of op locatie. Vaak genoeg om te weten wat je moet doen.')}
  ${card(I_EURO, 'Gesubsidieerde rechtsbijstand', 'Heb je toch een advocaat nodig en een laag inkomen? Dan betaalt de overheid een deel; jij betaalt een eigen bijdrage. Dat heet een toevoeging.')}
  ${card(I_USERS, 'Rechtsbijstandverzekering', 'Sommige mensen hebben die via hun verzekering of via een vakbond. Kijk dat eerst na.')}
  ${card(I_LANDMARK, 'Sociaal raadslieden', 'Bij veel gemeenten: gratis hulp bij brieven, bezwaarschriften en formulieren.')}
</div>

${factTwo('Het Juridisch Loket geeft gratis juridisch advies. Wie een advocaat of mediator nodig heeft en een laag inkomen heeft, kan in aanmerking komen voor gesubsidieerde rechtsbijstand: de overheid betaalt dan een deel van de kosten en de rechtzoekende een eigen bijdrage.', [['Het Juridisch Loket', SRC_JURIDISCHLOKET], ['Rijksoverheid — Rechtsbijstand', SRC_RECHTSBIJSTAND]], CHECKED)}

<h2 id="verzekeringen">Verzekeringen</h2>

<p>Eindterm 6.6. Nederland verzekert veel. Weet wat verplicht is en wat niet.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Verplicht</p>
    <ul>
      <li>${I_CHECK}<span><strong>Zorgverzekering</strong> — voor iedereen die hier woont of werkt</span></li>
      <li>${I_CHECK}<span><strong>WA-verzekering voor je auto, motor of scooter</strong> — zonder mag je niet de weg op</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Niet verplicht, wel verstandig</p>
    <ul>
      <li>${I_X}<span><strong>Aansprakelijkheidsverzekering (AVP)</strong> — voor schade die jij of je kind veroorzaakt</span></li>
      <li>${I_X}<span><strong>Inboedelverzekering</strong> — voor je spullen bij brand of inbraak</span></li>
      <li>${I_X}<span><strong>Reis- en uitvaartverzekering</strong> — een persoonlijke keuze</span></li>
    </ul>
  </div>
</div>

${note('Kijk bij elke verzekering naar het <strong>eigen risico</strong> en naar de <strong>opzegtermijn</strong>. En let op stapeling: soms zit je via je bank of je werkgever al ergens voor verzekerd zonder dat je het weet.')}

<h2 id="in-het-examen">Hoe dit in het examen terugkomt</h2>

<p>Als een situatie met een verkeerd adres erin. Iemand belt de politie voor een burenruzie,
iemand gaat naar de gemeente voor zorgtoeslag, iemand negeert een brief met een termijn. De vraag
is telkens: waar had die persoon moeten zijn, en wanneer?</p>

${inlineCta('Oefen dit thema met examenvragen', 'Brieven, loketten en termijnen — precies zoals in het echte KNM-examen.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Gemeente: papieren, bijstand, Wmo, inburgering.</li>
  <li>Belastingdienst: aangifte &eacute;n toeslagen. Toeslagen zijn een voorschot.</li>
  <li>UWV: WW. SVB: kinderbijslag en AOW. DUO: je examens.</li>
  <li>112 bij spoed, 0900-8844 zonder spoed.</li>
  <li>Het Juridisch Loket geeft gratis advies.</li>
  <li>Let altijd op de termijn in een brief — meestal zes weken.</li>
</ul>`,

  faq: [
    {
      q: 'Wat is DigiD en hoe vraag ik het aan?',
      a: 'DigiD is je persoonlijke inlogcode voor de Nederlandse overheid. Je hebt hem nodig voor de Belastingdienst, DUO, je gemeente, UWV en je zorgverzekeraar. Je vraagt hem aan op digid.nl zodra je een BSN hebt en bij de gemeente staat ingeschreven. Deel je DigiD nooit met iemand anders.',
    },
    {
      q: 'Wat is het verschil tussen de Belastingdienst en Toeslagen?',
      a: 'Het is dezelfde organisatie, maar twee verschillende dingen. Bij de belastingaangifte kijkt de Belastingdienst of je belasting moet betalen of terugkrijgt. Toeslagen zijn bijdragen die je krijgt, zoals zorgtoeslag en huurtoeslag. Toeslagen vraag je zelf aan en zijn een voorschot: verandert je inkomen, geef dat dan meteen door.',
    },
    {
      q: 'Waar meld ik een probleem met mijn huurbaas of werkgever?',
      a: 'Begin bij Het Juridisch Loket: dat geeft gratis eerste advies. Bij een sociale huurwoning kun je met huurprijs, servicekosten of onderhoud ook naar de Huurcommissie. Heb je een advocaat nodig en een laag inkomen, dan kun je gesubsidieerde rechtsbijstand krijgen en betaal je alleen een eigen bijdrage.',
    },
    {
      q: 'Wanneer bel ik 112 en wanneer 0900-8844?',
      a: '112 bel je alleen bij spoed: direct gevaar voor iemands leven, een misdrijf dat op dat moment gebeurt, of een verdachte situatie. Voor alles zonder spoed — een melding, een vraag, of een afspraak om aangifte te doen — bel je 0900-8844. Veel aangiftes kun je ook online doen op politie.nl.',
    },
    {
      q: 'Welke verzekeringen zijn verplicht in Nederland?',
      a: 'Twee. Een zorgverzekering is verplicht voor iedereen die hier woont of werkt. En heb je een auto, motor of scooter, dan is een WA-verzekering verplicht. Andere verzekeringen, zoals aansprakelijkheid en inboedel, zijn niet verplicht maar wel verstandig en meestal goedkoop.',
    },
    {
      q: 'Ik heb een brief van de overheid die ik niet begrijp. Wat nu?',
      a: 'Gooi hem niet weg en wacht niet af. Kijk eerst naar de datum en naar de termijn waarbinnen je kunt reageren; die is vaak zes weken. Vraag daarna hulp bij het informatiepunt digitale overheid in de bibliotheek, bij de sociaal raadslieden van je gemeente of bij Het Juridisch Loket. Die hulp is gratis.',
    },
  ],

  related: ['werk-en-inkomen', 'wonen', 'gezondheid-en-gezondheidszorg', 'staatsinrichting-en-rechtsstaat'],
  relatedPosts: [],

  ctaTitle: 'Oefen het thema Instanties',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
