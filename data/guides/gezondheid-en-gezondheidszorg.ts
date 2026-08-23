/**
 * KNM thema 4 — Gezondheid en gezondheidszorg.
 *
 * Five eindtermen (Stcrt. 2024, 15802): 4.1 zorg zonder doorverwijzing · 4.2 zorg met
 * doorverwijzing · 4.3 handelen bij medische spoed · 4.4 de financiële en administratieve kant ·
 * 4.5 welzijnsfaciliteiten. The body is those five, in that order — the eindtermen are also the
 * order in which a patient actually meets the system.
 *
 * **The eigen risico amount is deliberately absent.** It is set per calendar year and a figure
 * baked into a guide body would be false every January without anyone touching the file. Same for
 * the zorgtoeslag amounts. The mechanism is explained; the number lives on the linked page.
 *
 * **112 vs the huisartsenpost is the single most load-bearing distinction on this page** and the
 * one a candidate is most likely to need before they ever sit the exam. It gets its own block.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_USER, I_ALERT, I_EURO, I_USERS, I_CLOCK, docent, note, inlineCta, factTwo } from './kit';

const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
const SRC_ZORGVERZ = 'https://www.rijksoverheid.nl/onderwerpen/zorgverzekering';
const SRC_EIGENRISICO = 'https://www.rijksoverheid.nl/onderwerpen/zorgverzekering/vraag-en-antwoord/eigen-risico-zorgverzekering';
const SRC_ZORGTOESLAG = 'https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/zorgtoeslag';
const SRC_HUISARTS = 'https://www.thuisarts.nl/';
const SRC_112 = 'https://www.politie.nl/informatie/wanneer-bel-ik-112.html';
const SRC_WMO = 'https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis/wmo-2015';
const CHECKED = '23-08-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'gezondheid-en-gezondheidszorg',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'cross',

  title: 'KNM: Gezondheid en gezondheidszorg in Nederland',
  description:
    'De huisarts als eerste stap, doorverwijzing naar het ziekenhuis, 112 bij spoed, je zorgverzekering en eigen risico. Het KNM-thema Gezondheidszorg uitgelegd.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Gezondheidszorg',
  eyebrow: 'KNM-thema 4',

  heroTitle: 'Gezondheid en gezondheidszorg',
  heroSubtitle:
    'De Nederlandse zorg werkt anders dan in veel andere landen: bijna alles begint bij de huisarts. Hier lees je hoe het in elkaar zit, en wat je doet bij spoed.',
  readingMinutes: 9,

  articleHtml: `
<h2 id="wat-vraagt-knm">Wat vraagt KNM over dit thema?</h2>

<p>Dit is het thema met de meeste eindtermen: vijf. Ze volgen de weg van een pati&euml;nt.</p>

<div class="compare-rows">
  ${row('4.1', 'Gebruikmaken van zorg zonder doorverwijzing')}
  ${row('4.2', 'Gebruikmaken van zorg met doorverwijzing')}
  ${row('4.3', 'Handelen in geval van medische spoed')}
  ${row('4.4', 'De financi&euml;le en administratieve kant correct afhandelen')}
  ${row('4.5', 'Gebruikmaken van welzijnsfaciliteiten')}
</div>

${fact('De eindtermen KNM bij thema Gezondheid en gezondheidszorg zijn: gebruikmaken van zorg zonder doorverwijzing; gebruikmaken van zorg met doorverwijzing; handelen in geval van medische spoed; de financiële en administratieve kant correct afhandelen; gebruikmaken van welzijnsfaciliteiten.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

<h2 id="huisarts">Alles begint bij de huisarts</h2>

<p>Dit is de belangrijkste regel van de Nederlandse zorg. De huisarts is de
<strong>poortwachter</strong>: hij of zij behandelt zelf wat kan, en verwijst je door als het
nodig is. Je gaat niet zelf naar een specialist in het ziekenhuis.</p>

<p>Schrijf je daarom <strong>meteen</strong> in bij een huisarts in je buurt, ook als je niet ziek
bent. Wacht daar niet mee tot je hem nodig hebt: veel praktijken zitten vol.</p>

<h3>Zorg waar je zelf naartoe mag</h3>
<p>Dit is eindterm 4.1: voor deze zorg heb je geen verwijzing nodig.</p>

<div class="guide-cards">
  ${card(I_USER, 'De huisarts', 'Je eerste aanspreekpunt voor alles: klachten, medicijnen, twijfel, psychische problemen. Je maakt telefonisch of online een afspraak.')}
  ${card(I_USER, 'De tandarts', 'Je kiest er zelf een. Let op: tandarts zit meestal niet in de basisverzekering voor volwassenen.')}
  ${card(I_USER, 'De apotheek', 'Hier haal je medicijnen op recept. Je schrijft je bij &eacute;&eacute;n apotheek in, zodat die je hele medicijnlijst kent.')}
  ${card(I_USER, 'De verloskundige', 'Ben je zwanger? Dan ga je rechtstreeks naar een verloskundige, niet eerst naar de huisarts.')}
  ${card(I_USER, 'De fysiotherapeut', 'Mag je meestal zelf bezoeken, maar controleer of jouw verzekering het vergoedt.')}
  ${card(I_USER, 'Het consultatiebureau', 'Voor baby’s en jonge kinderen: groei, vaccinaties en advies. Gratis, en je krijgt zelf een uitnodiging.')}
</div>

<h3>Zorg waarvoor je een verwijzing nodig hebt</h3>
<p>Dit is eindterm 4.2. Denk aan een specialist in het ziekenhuis — een cardioloog, een
dermatoloog, een chirurg — en aan veel psychologische zorg. De huisarts schrijft dan een
<strong>verwijsbrief</strong>. Zonder die brief vergoedt je verzekering het meestal niet.</p>

${fact('De huisarts is in Nederland het eerste aanspreekpunt bij gezondheidsklachten en verwijst zo nodig door naar een specialist. Thuisarts.nl is de publieksinformatie van de Nederlandse huisartsen.', 'Thuisarts.nl — informatie van huisartsen', SRC_HUISARTS, CHECKED)}

${docent('Cursisten vragen me vaak: "Waarom geeft mijn huisarts geen antibiotica?" In veel landen krijg je die snel. Hier alleen als het echt nodig is. Dat is geen onwil en geen bezuiniging — het is beleid, omdat bacteri&euml;n anders ongevoelig worden. Vraag gerust om uitleg, daar is de huisarts voor.')}

<h2 id="spoed">Spoed: 112, huisartsenpost of gewoon wachten?</h2>

<p>Eindterm 4.3, en de vraag die het examen het vaakst stelt. Onthoud deze drie situaties.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Levensgevaar: bel 112</h3>
    <p>Iemand ademt niet, is bewusteloos, heeft een ongeluk gehad, hevige bloeding, of tekenen van een beroerte of hartaanval. 112 is gratis, dag en nacht, en je krijgt de ambulance, brandweer of politie.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Kan niet wachten, maar geen levensgevaar: de huisartsenpost</h3>
    <p>’s Avonds, ’s nachts en in het weekend neemt de huisartsenpost (HAP) het over van je eigen huisarts. Je belt <strong>eerst</strong>; je komt niet zomaar langs.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Overdag en het kan wachten: je eigen huisarts</h3>
    <p>Bel de praktijk. Bij twijfel over de ernst: bellen mag altijd, ook om het te vr&aacute;gen. Daar is de assistente voor.</p>
  </div></div>
</div>

${note('Ga bij spoed <strong>niet</strong> zelf naar de Spoedeisende Hulp van het ziekenhuis zonder te bellen. In Nederland loopt bijna alle spoedzorg via 112 of via de huisartsenpost, en zonder verwijzing kun je worden weggestuurd — of een hoge rekening krijgen.')}

${fact('Bel 112 als er direct gevaar is voor leven of gezondheid, bij een misdrijf dat op dat moment gebeurt of bij een verdachte situatie. Voor situaties zonder spoed is het nummer 0900-8844.', 'Politie.nl — Wanneer bel ik 112?', SRC_112, CHECKED)}

<h2 id="verzekering">Je zorgverzekering</h2>

<p>Eindterm 4.4. In Nederland is een zorgverzekering <strong>verplicht</strong> voor iedereen die
hier woont of werkt. Je regelt hem zelf, binnen vier maanden nadat je verzekeringsplichtig wordt.
Doe je dat niet, dan volgt een boete en wordt je uiteindelijk gedwongen verzekerd.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Basisverzekering</h3>
      <p class="compare-when">Verplicht, inhoud bepaald door de overheid</p>
    </div>
    <div class="compare-rows">
      ${row('Wat erin zit', 'Huisarts, ziekenhuis, medicijnen, verloskundige, spoedzorg')}
      ${row('Prijs', 'Verschilt per verzekeraar, de inhoud niet')}
      ${row('Weigeren', 'Een verzekeraar mag je hiervoor nooit weigeren')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Aanvullende verzekering</h3>
      <p class="compare-when">Vrijwillig</p>
    </div>
    <div class="compare-rows">
      ${row('Wat erin zit', 'Bijvoorbeeld tandarts, fysiotherapie, bril, alternatieve zorg')}
      ${row('Prijs', 'Je kiest zelf een pakket')}
      ${row('Weigeren', 'Hiervoor mag een verzekeraar je w&eacute;l weigeren')}
    </div>
  </div>
</div>

<h3>Eigen risico</h3>
<p>Voor de meeste zorg uit de basisverzekering geldt een <strong>eigen risico</strong>: het eerste
deel van de kosten in een kalenderjaar betaal je zelf. Het bedrag wordt elk jaar door de overheid
vastgesteld, dus kijk het na.</p>

<p>Twee dingen vallen er <strong>buiten</strong>, en dat is precies wat het examen graag vraagt:</p>
<ul>
  <li>De <strong>huisarts</strong> valt niet onder het eigen risico. Een bezoek kost je dus niets extra.</li>
  <li>Zorg voor <strong>kinderen tot 18 jaar</strong> valt er ook buiten. Kinderen zijn bovendien gratis meeverzekerd bij hun ouders.</li>
</ul>

${factTwo('Iedereen die in Nederland woont of werkt is verplicht een basisverzekering af te sluiten; de inhoud daarvan bepaalt de overheid en is bij elke verzekeraar gelijk. Voor zorg uit de basisverzekering geldt een verplicht eigen risico, met uitzondering van onder meer de huisarts; kinderen tot 18 jaar betalen geen eigen risico en zijn gratis meeverzekerd.', [['Rijksoverheid — Zorgverzekering', SRC_ZORGVERZ], ['Rijksoverheid — Eigen risico', SRC_EIGENRISICO]], CHECKED)}

<p>Heb je een laag inkomen, dan kun je <strong>zorgtoeslag</strong> aanvragen bij de
Belastingdienst. Dat is een maandelijkse bijdrage in je premie. Je moet hem zelf aanvragen, en zelf
doorgeven als je inkomen verandert.</p>

${fact('Zorgtoeslag is een bijdrage van de Belastingdienst in de kosten van de zorgverzekering, voor wie een inkomen onder een bepaalde grens heeft. U vraagt de toeslag zelf aan en geeft zelf wijzigingen door.', 'Belastingdienst — Zorgtoeslag', SRC_ZORGTOESLAG, CHECKED)}

${docent('Vergeet niet je toeslag stop te zetten als je meer gaat verdienen. Ik heb cursisten gehad die na twee jaar duizenden euro’s moesten terugbetalen. Dat is een van de vervelendste dingen die je jezelf kunt aandoen, en het is met &eacute;&eacute;n telefoontje te voorkomen.')}

<h2 id="welzijn">Welzijn: hulp die geen dokter is</h2>

<p>Eindterm 4.5 gaat over voorzieningen die niet medisch zijn, maar wel over je gezondheid gaan.
Deze lopen bijna allemaal via je <strong>gemeente</strong>, onder de Wmo.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Waar de gemeente voor is</p>
    <ul>
      <li>${I_CHECK}<span>Hulp bij het huishouden als dat zelf niet meer lukt</span></li>
      <li>${I_CHECK}<span>Hulpmiddelen: een traplift, een rolstoel, een aanpassing in huis</span></li>
      <li>${I_CHECK}<span>Dagbesteding en begeleiding</span></li>
      <li>${I_CHECK}<span>Ondersteuning voor mantelzorgers</span></li>
      <li>${I_CHECK}<span>Maatschappelijk werk: hulp bij schulden, papieren en problemen thuis</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Waar de gemeente niet voor is</p>
    <ul>
      <li>${I_X}<span>Medische behandeling — dat is de huisarts of het ziekenhuis</span></li>
      <li>${I_X}<span>Medicijnen — dat is de apotheek, via de verzekering</span></li>
      <li>${I_X}<span>Langdurige zware zorg in een instelling — dat gaat via de Wlz</span></li>
    </ul>
  </div>
</div>

<p>Je meldt je bij het <strong>Wmo-loket</strong> of het sociaal wijkteam van je gemeente. Daarna
volgt een gesprek — het "keukentafelgesprek" — waarin gekeken wordt wat je nodig hebt.</p>

${fact('Op grond van de Wet maatschappelijke ondersteuning (Wmo 2015) zijn gemeenten verantwoordelijk voor ondersteuning van mensen die niet op eigen kracht zelfredzaam zijn, zoals huishoudelijke hulp, begeleiding, dagbesteding en woningaanpassingen.', 'Rijksoverheid — Wmo 2015', SRC_WMO, CHECKED)}

<h2 id="in-het-examen">Hoe dit in het examen terugkomt</h2>

<p>Bijna altijd als een klacht met een vraag: iemand heeft koorts, iemand valt van een ladder,
iemand krijgt een rekening. De vraag is dan wie je belt en in welke volgorde.</p>

<p>Als je maar &eacute;&eacute;n ding onthoudt van dit thema: <strong>huisarts eerst, 112 alleen bij
levensgevaar</strong>. Daarmee heb je de meeste vragen al.</p>

${inlineCta('Oefen dit thema met examenvragen', 'Echte situaties: huisarts, spoed, verzekering en gemeente. Met uitleg na elk antwoord.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>De huisarts is de poortwachter: schrijf je meteen in.</li>
  <li>Specialist alleen met een verwijsbrief.</li>
  <li>112 bij levensgevaar; anders eerst bellen met huisarts of huisartsenpost.</li>
  <li>Zorgverzekering is verplicht; het eigen risico geldt niet voor de huisarts en niet voor kinderen.</li>
  <li>Welzijn en hulp thuis lopen via het Wmo-loket van de gemeente.</li>
</ul>`,

  faq: [
    {
      q: 'Kan ik in Nederland zelf naar een specialist?',
      a: 'Nee, meestal niet. Je gaat eerst naar je huisarts. Die behandelt wat hij zelf kan en geeft je een verwijsbrief als een specialist nodig is. Zonder verwijzing vergoedt je zorgverzekering het ziekenhuisbezoek in de regel niet. Tandarts, verloskundige en consultatiebureau zijn uitzonderingen: daar mag je zelf naartoe.',
    },
    {
      q: 'Wanneer bel ik 112 en wanneer de huisartsenpost?',
      a: 'Bel 112 alleen als er direct gevaar is voor iemands leven: bewusteloosheid, een ernstig ongeluk, een hevige bloeding, tekenen van een hartaanval of beroerte. Is het wel dringend maar geen levensgevaar, en is je eigen huisarts gesloten, dan bel je de huisartsenpost. Overdag bel je gewoon je eigen praktijk.',
    },
    {
      q: 'Wat is het eigen risico?',
      a: 'Het eerste deel van je zorgkosten in een kalenderjaar dat je zelf betaalt, voordat de basisverzekering vergoedt. Het bedrag stelt de overheid elk jaar vast. Belangrijk: de huisarts valt er niet onder, en kinderen tot 18 jaar betalen geen eigen risico.',
    },
    {
      q: 'Is een zorgverzekering verplicht in Nederland?',
      a: 'Ja, voor iedereen die hier woont of werkt. Je sluit zelf een basisverzekering af, en dat moet binnen vier maanden nadat je verzekeringsplichtig wordt. Doe je het niet, dan krijg je een boete en word je uiteindelijk gedwongen verzekerd. Kinderen tot 18 jaar zijn gratis meeverzekerd bij hun ouders.',
    },
    {
      q: 'Waar vraag ik hulp bij het huishouden of een hulpmiddel aan?',
      a: 'Bij je gemeente, via het Wmo-loket of het sociaal wijkteam. Na je melding volgt een gesprek waarin wordt gekeken wat je nodig hebt en wat je zelf of met hulp van je omgeving kunt. De gemeente gaat over huishoudelijke hulp, begeleiding, dagbesteding en aanpassingen in huis — niet over medische behandeling.',
    },
  ],

  related: ['instanties', 'wonen', 'onderwijs-en-opvoeding'],
  relatedPosts: [],

  ctaTitle: 'Oefen het thema Gezondheidszorg',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
