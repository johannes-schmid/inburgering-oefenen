/**
 * KNM thema 8 — Onderwijs en opvoeding.
 *
 * Three eindtermen (Stcrt. 2024, 15802): 8.1 gebruikmaken van het Nederlands onderwijssysteem ·
 * 8.2 verantwoordelijkheid voor minderjarige kinderen · 8.3 omgaan met schoolkosten en
 * tegemoetkomingen.
 *
 * Two things this page must not do. It must not state a **bedrag** for kinderbijslag, kindgebonden
 * budget, kinderopvangtoeslag or the ouderbijdrage — every one is set per year and per situation.
 * And it must not present the **ouderbijdrage as compulsory**: it is explicitly voluntary, a school
 * may not exclude a child over it, and that is the single fact on this page most likely to save a
 * reader money.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_CAP, I_USERS, I_EURO, I_HOME, I_CLIPBOARD, docent, note, inlineCta, factTwo } from './kit';

export const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
export const SRC_LEERPLICHT = 'https://www.rijksoverheid.nl/onderwerpen/leerplicht';
export const SRC_ONDERWIJS = 'https://www.rijksoverheid.nl/onderwerpen/schoolsysteem-nederland';
export const SRC_OUDERBIJDRAGE = 'https://www.rijksoverheid.nl/onderwerpen/financiering-onderwijs/vraag-en-antwoord/ouderbijdrage-school';
export const SRC_KINDERBIJSLAG = 'https://www.svb.nl/nl/kinderbijslag';
export const SRC_KINDEROPVANG = 'https://www.belastingdienst.nl/wps/wcm/connect/nl/kinderopvangtoeslag/kinderopvangtoeslag';
export const SRC_VEILIGTHUIS = 'https://veiligthuis.nl/';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'onderwijs-en-opvoeding',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'books',

  title: 'KNM: Onderwijs en opvoeding — school en kinderen in NL',
  description:
    'Het Nederlandse schoolsysteem, leerplicht, contact met de leerkracht, schoolkosten en de rechten van kinderen. Het KNM-thema Onderwijs en opvoeding uitgelegd.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Onderwijs en opvoeding',
  eyebrow: 'KNM-thema 8',

  heroTitle: 'Onderwijs en opvoeding',
  heroSubtitle:
    'Hoe werkt school in Nederland, wat wordt er van ouders verwacht, en wat mag en moet er in de opvoeding? Dit thema gaat over je kinderen — en over jouw rol daarin.',
  readingMinutes: 9,

  articleHtml: `
<h2 id="wat-vraagt-knm">Wat vraagt KNM over dit thema?</h2>

<div class="compare-rows">
  ${row('8.1', 'Gebruikmaken van het Nederlands onderwijssysteem')}
  ${row('8.2', 'Verantwoordelijkheid voor minderjarige kinderen')}
  ${row('8.3', 'Omgaan met schoolkosten en tegemoetkomingen')}
</div>

${fact('De eindtermen KNM bij thema Onderwijs en opvoeding zijn: gebruikmaken van het Nederlands onderwijssysteem; verantwoordelijkheid voor minderjarige kinderen; omgaan met schoolkosten en tegemoetkomingen.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

<h2 id="leerplicht">Leerplicht: naar school moet</h2>

<p>Kinderen in Nederland moeten naar school vanaf de dag dat ze <strong>5 jaar</strong> worden.
In de praktijk gaan de meeste kinderen al vanaf hun vierde, omdat dat mag en omdat het goed is voor
hun taal. De leerplicht duurt tot 16 jaar. Daarna geldt de
<strong>kwalificatieplicht</strong>: tot je 18e moet je naar school, tenzij je eerder een
startkwalificatie haalt — een diploma havo, vwo of mbo niveau 2.</p>

<p>Spijbelen is niet vrijblijvend. De school meldt het bij de <strong>leerplichtambtenaar</strong>
van de gemeente, en die kan ouders aanspreken en zelfs beboeten. Vakantie buiten de schoolvakanties
mag alleen in uitzonderlijke gevallen en met toestemming van de directeur.</p>

${fact('Kinderen zijn in Nederland leerplichtig vanaf de eerste schooldag van de maand na hun vijfde verjaardag tot het einde van het schooljaar waarin zij 16 worden. Daarna geldt de kwalificatieplicht tot 18 jaar of tot het behalen van een startkwalificatie.', 'Rijksoverheid — Leerplicht', SRC_LEERPLICHT, CHECKED)}

${note('Ben je net in Nederland en spreekt je kind nog geen Nederlands? Dan gaat het meestal eerst naar een <strong>nieuwkomersklas</strong> of taalschool, vaak ongeveer een jaar. Daarna stroomt het door naar een gewone school. Meld je kind aan bij de gemeente of bij een school in de buurt; die weet waar dat is.')}

<h2 id="schoolsysteem">Het schoolsysteem in stappen</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Kinderopvang en peuterspeelzaal (0–4 jaar)</h3>
    <p>Niet verplicht. Werk je of studeer je, dan kun je kinderopvangtoeslag krijgen. Veel gemeenten bieden ook voorschoolse educatie (VVE) voor kinderen met een taalachterstand — vaak gratis of goedkoop.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Basisschool (4–12 jaar)</h3>
    <p>Acht groepen. Je kiest zelf een school; er zijn openbare scholen en scholen met een religieuze of pedagogische richting. Openbaar onderwijs is voor iedereen toegankelijk.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Het schooladvies (groep 8)</h3>
    <p>Aan het eind van de basisschool geeft de leerkracht een advies voor het voortgezet onderwijs. Daarna volgt de doorstroomtoets. Valt die hoger uit dan het advies, dan moet de school het advies heroverwegen.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Voortgezet onderwijs (12–18 jaar)</h3>
    <p>Drie hoofdrichtingen: <strong>vmbo</strong> (4 jaar, praktisch, naar het mbo), <strong>havo</strong> (5 jaar, naar het hbo) en <strong>vwo</strong> (6 jaar, naar de universiteit).</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">5</span><div class="guide-step-body">
    <h3>Vervolgonderwijs</h3>
    <p><strong>mbo</strong> (beroepsopleiding, niveau 1 tot 4), <strong>hbo</strong> (hogeschool) en <strong>wo</strong> (universiteit). Studenten kunnen lenen en soms een beurs krijgen bij DUO.</p>
  </div></div>
</div>

<p>Belangrijk voor ouders: het Nederlandse systeem is <strong>doorstroombaar</strong>. Een vmbo'er
kan via het mbo naar het hbo, en een havist kan naar het vwo. Een advies in groep 8 is geen
eindpunt. Dat is een van de meest geruststellende dingen die je een bezorgde ouder kunt vertellen —
en het is waar.</p>

${fact('Het Nederlandse onderwijs kent basisonderwijs, voortgezet onderwijs (vmbo, havo, vwo) en vervolgonderwijs (mbo, hbo, wo). Leerlingen kunnen na een diploma doorstromen naar een hoger niveau.', 'Rijksoverheid — Schoolsysteem in Nederland', SRC_ONDERWIJS, CHECKED)}

<h2 id="ouders">Wat wordt er van ouders verwacht?</h2>

<p>Meer dan in veel andere landen. School en ouders zijn hier partners, en de school verwacht dat
je meedoet.</p>

<div class="guide-cards">
  ${card(I_USERS, 'Kom naar de oudergesprekken', 'Twee of drie keer per jaar bespreek je hoe het gaat. Kom, ook als het goed gaat, en ook als je Nederlands nog niet sterk is. Vraag om een tolk of neem iemand mee.')}
  ${card(I_CLIPBOARD, 'Lees de berichten van school', 'Scholen communiceren via een app of e-mail: over uitjes, gymkleding, ziekte, vakanties. Zet meldingen aan.')}
  ${card(I_HOME, 'Meld je kind ziek', 'Voor schooltijd, telefonisch of via de app. Niet melden telt als spijbelen.')}
  ${card(I_CAP, 'Help thuis mee', 'Voorlezen, praten over de dag, en zorgen voor rust en slaap. Dat weegt zwaarder dan huiswerk overhoren in een taal die je zelf leert.')}
</div>

${docent('Veel ouders die ik lesgeef durven niet naar een oudergesprek omdat ze bang zijn dat ze het niet begrijpen. Zeg dat gewoon tegen de leerkracht. Scholen zijn dat gewend en zoeken een oplossing. Wegblijven wordt uitgelegd als desinteresse, en dat is precies het tegenovergestelde van wat je bedoelt.')}

<h2 id="opvoeding">Opvoeding: rechten van kinderen</h2>

<p>Eindterm 8.2. In Nederland heeft een kind eigen rechten, ook tegenover zijn ouders. Dat is voor
veel nieuwkomers wennen, en het examen vraagt er nadrukkelijk naar.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Verwacht van ouders</p>
    <ul>
      <li>${I_CHECK}<span>Zorgen voor eten, kleding, onderdak, veiligheid en school</span></li>
      <li>${I_CHECK}<span>Naar de dokter en het consultatiebureau gaan als dat nodig is</span></li>
      <li>${I_CHECK}<span>Grenzen stellen en uitleggen waarom</span></li>
      <li>${I_CHECK}<span>Je kind laten meepraten over dingen die hem aangaan, naar leeftijd</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Verboden</p>
    <ul>
      <li>${I_X}<span>Slaan of ander lichamelijk geweld — ook als opvoedmiddel</span></li>
      <li>${I_X}<span>Verwaarlozing: een kind zonder zorg of toezicht laten</span></li>
      <li>${I_X}<span>Kindhuwelijk en huwelijksdwang</span></li>
      <li>${I_X}<span>Meisjesbesnijdenis — strafbaar, ook als het in het buitenland gebeurt</span></li>
      <li>${I_X}<span>Je kind thuishouden van school</span></li>
    </ul>
  </div>
</div>

<p>Maak je je zorgen over een kind — je eigen kind of dat van een ander — dan is er
<strong>Veilig Thuis</strong>. Dat is het landelijke advies- en meldpunt voor huiselijk geweld en
kindermishandeling. Je kunt er anoniem bellen, ook alleen om advies te vragen.</p>

${fact('Veilig Thuis is het landelijke advies- en meldpunt voor huiselijk geweld en kindermishandeling. Iedereen kan er terecht voor advies of om zorgen te melden, ook anoniem; het telefoonnummer is 0800-2000 en is gratis.', 'Veilig Thuis', SRC_VEILIGTHUIS, CHECKED)}

${note('Krijg je bezoek van <strong>jeugdzorg</strong> of het wijkteam? Dat betekent niet automatisch dat je kind wordt weggehaald. In verreweg de meeste gevallen gaat het om hulp thuis. Werk mee en stel vragen; je mag altijd iemand meenemen naar zo’n gesprek.')}

<h2 id="schoolkosten">Schoolkosten en tegemoetkomingen</h2>

<p>Eindterm 8.3, en waarschijnlijk het nuttigste stuk van deze gids.</p>

<p>Openbaar en bijzonder onderwijs zijn in Nederland <strong>gratis</strong>. Scholen vragen wel een
<strong>ouderbijdrage</strong> voor extra's: een schoolreisje, een kerstviering, een excursie. Die
bijdrage is <strong>vrijwillig</strong>. Een school mag een kind niet uitsluiten van activiteiten
als de ouders niet betalen. Kun je het niet betalen, zeg dat dan tegen de school — dat mag, en er
zijn vaak fondsen voor.</p>

${fact('De ouderbijdrage aan school is vrijwillig. Scholen mogen leerlingen niet uitsluiten van activiteiten of het onderwijsprogramma als ouders de bijdrage niet betalen.', 'Rijksoverheid — Ouderbijdrage school', SRC_OUDERBIJDRAGE, CHECKED)}

<h3>Waar je financieel op kunt rekenen</h3>

<div class="guide-cards">
  ${card(I_EURO, 'Kinderbijslag', 'Van de SVB, voor iedereen met kinderen tot 18 jaar. Je vraagt hem meestal &eacute;&eacute;n keer aan; daarna loopt hij door.')}
  ${card(I_EURO, 'Kindgebonden budget', 'Van de Belastingdienst, als aanvulling bij een lager inkomen. Vaak krijg je die automatisch als je al kinderbijslag hebt.')}
  ${card(I_EURO, 'Kinderopvangtoeslag', 'Van de Belastingdienst, als je werkt of studeert en je kind naar geregistreerde opvang gaat.')}
  ${card(I_EURO, 'Gemeentelijke regelingen', 'Veel gemeenten hebben een stadspas, een schoolspullenpas of vergoeden een fiets, laptop of sportclub bij een laag inkomen. Vraag ernaar bij je gemeente.')}
</div>

${factTwo('Kinderbijslag wordt uitgekeerd door de Sociale Verzekeringsbank voor kinderen tot 18 jaar. Kinderopvangtoeslag is een bijdrage van de Belastingdienst in de kosten van geregistreerde kinderopvang voor werkende of studerende ouders.', [['SVB — Kinderbijslag', SRC_KINDERBIJSLAG], ['Belastingdienst — Kinderopvangtoeslag', SRC_KINDEROPVANG]], CHECKED)}

${docent('De gemeentelijke regelingen zijn het best bewaarde geheim van dit thema. Bijna elke gemeente heeft geld voor sport, muziekles of een laptop voor kinderen uit gezinnen met een laag inkomen. Je moet het alleen zelf aanvragen, en niemand vertelt het je uit zichzelf. Vraag het bij het loket.')}

<h2 id="in-het-examen">Hoe dit in het examen terugkomt</h2>

<p>Als situaties rond school en kinderen: een kind is ziek, een ouder wil op vakantie buiten de
vakantie, een school vraagt geld, een kind krijgt een advies dat de ouders te laag vinden. De lijn
is bijna altijd: <strong>praat met de school, en school is verplicht en gratis</strong>.</p>

${inlineCta('Oefen dit thema met examenvragen', 'School, leerplicht en opvoeding — met uitleg na elk antwoord.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Leerplicht van 5 tot 16 jaar, daarna kwalificatieplicht tot 18.</li>
  <li>Basisschool 4–12, dan vmbo, havo of vwo; doorstromen kan altijd nog.</li>
  <li>Ouders komen naar oudergesprekken en melden hun kind ziek.</li>
  <li>Slaan is verboden; Veilig Thuis is er voor advies, ook anoniem.</li>
  <li>School is gratis; de ouderbijdrage is vrijwillig.</li>
</ul>`,

  faq: [
    {
      q: 'Vanaf welke leeftijd moet mijn kind naar school?',
      a: 'Leerplichtig is je kind vanaf de eerste schooldag van de maand na zijn vijfde verjaardag. De meeste kinderen beginnen al op hun vierde, omdat dat mag en goed is voor hun Nederlands. De leerplicht loopt tot 16 jaar, daarna geldt de kwalificatieplicht tot 18 jaar of tot een startkwalificatie.',
    },
    {
      q: 'Moet ik de ouderbijdrage van school betalen?',
      a: 'Nee, die is vrijwillig. Een school mag je kind niet uitsluiten van een schoolreisje of een andere activiteit omdat je niet betaalt. Kun je het niet missen, meld dat dan bij de school of vraag naar een regeling van je gemeente; die hebben vaak een fonds voor schoolkosten.',
    },
    {
      q: 'Wat is het verschil tussen vmbo, havo en vwo?',
      a: 'Vmbo duurt vier jaar en is praktisch gericht; daarna ga je meestal naar het mbo. Havo duurt vijf jaar en leidt op naar het hbo. Vwo duurt zes jaar en leidt op naar de universiteit. Een advies is geen eindstation: via mbo en hbo kun je alsnog verder doorstromen.',
    },
    {
      q: 'Mag ik mijn kind straffen?',
      a: 'Grenzen stellen mag en wordt van je verwacht. Lichamelijke straf niet: slaan is in Nederland verboden, ook door ouders en ook als opvoedmiddel. Twijfel je over hoe je iets aanpakt, dan kun je gratis advies vragen bij het Centrum voor Jeugd en Gezin van je gemeente of bij Veilig Thuis.',
    },
    {
      q: 'Welke financiële hulp is er voor ouders?',
      a: 'Kinderbijslag van de SVB voor kinderen tot 18 jaar, kindgebonden budget van de Belastingdienst bij een lager inkomen, en kinderopvangtoeslag als je werkt of studeert. Daarnaast heeft bijna elke gemeente eigen regelingen voor sport, muziekles, een fiets of een laptop. Die moet je zelf aanvragen.',
    },
    {
      q: 'Mijn kind spreekt nog geen Nederlands. Naar welke school kan het?',
      a: 'Meestal eerst naar een nieuwkomersklas of taalschool, waar het ongeveer een jaar intensief Nederlands leert. Daarna gaat het naar een gewone school. Vraag bij je gemeente of bij een basisschool in de buurt waar zo’n voorziening zit; zij weten dat.',
    },
  ],

  related: ['gezondheid-en-gezondheidszorg', 'instanties', 'werk-en-inkomen'],
  relatedPosts: [],

  ctaTitle: 'Oefen het thema Onderwijs en opvoeding',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
