/**
 * Inburgering spoke — "PVT, MAP en ONA".
 *
 * The three onderdelen that are not exams in the ordinary sense, and that candidates most often
 * confuse. Three facts decide the whole page and all three are in `SEO/facts.md` §10:
 *
 *  - **MAP is Wet 2021, ONA is Wet 2013.** They are not two names for the same thing; which one
 *    you do follows from which law you fall under. Nobody does both.
 *  - **MAP zit niet in de onderwijsroute** (Wet art. 8 lid 3); PVT zit in élke route.
 *  - **PVT is ten minste 12 uren** (Besluit art. 3.1), and its deadline differs by law — 3 jaar
 *    onder 2021, 1 jaar onder 2013, met een boete van €340 bij eigen schuld.
 *
 * The ONA detail comes verbatim from DUO's kennisexamens page: 8 resultaatkaarten forming a
 * portfolio, 6 weeks to assess it, then either a 64-hour cursus or an eindgesprek of ~30 minutes
 * with 2 DUO staff within 6 weeks of registering, uitslag within 8 weeks, €40.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_CLIPBOARD, I_USERS, I_EURO, I_CLOCK, I_CAP, I_LANDMARK,
  docent, note, inlineCta, factTwo,
} from './kit';

export const SRC_KENNIS = 'https://www.inburgeren.nl/examen-doen/inhoud-kennisexamens.jsp';
export const SRC_ONA_PDF = 'https://www.inburgeren.nl/images/ona-toelichting.pdf';
export const SRC_WET8 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&artikel=8';
export const SRC_BESLUIT31 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&artikel=3.1';
export const SRC_ROUTES = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'pvt-map-en-ona',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'sign',

  title: 'PVT, MAP en ONA: de onderdelen die geen examen zijn',
  description:
    'De participatieverklaring, de Module Arbeidsmarkt en Participatie en het ONA-examen. Wie welk onderdeel moet doen, hoe het werkt en welke termijnen erbij horen.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'PVT, MAP en ONA',
  eyebrow: 'Onderdelen',

  heroTitle: 'PVT, MAP en ONA',
  heroSubtitle:
    'Naast de taalexamens en KNM zijn er onderdelen die geen toets zijn maar een traject. Welke je moet doen, hangt af van je wet en je leerroute. Hier staat welke van jou is.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="welke-is-van-mij">Welke van de drie is van jou?</h2>

<p>Begin hier. Doe je alle drie? Nee — niemand doet MAP &eacute;n ONA. Het hangt af van onder welke
wet je inburgert.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Onderdeel</th><th>Wet 2021</th><th>Wet 2013</th></tr></thead>
  <tbody>
    <tr><td><strong>PVT</strong> — participatieverklaringstraject</td><td>Ja, in elke leerroute</td><td>Ja, als je inburgeringsplichtig werd op of na 1 oktober 2017</td></tr>
    <tr><td><strong>MAP</strong> — Module Arbeidsmarkt en Participatie</td><td>Ja, in de B1-route en de Z-route. <strong>Niet</strong> in de onderwijsroute.</td><td>Nee</td></tr>
    <tr><td><strong>ONA</strong> — Ori&euml;ntatie op de Nederlandse Arbeidsmarkt</td><td>Nee</td><td>Ja, en ook als je vrijwillig inburgert</td></tr>
  </tbody>
</table>
</div>

${factTwo('Het participatieverklaringstraject geldt voor wie op of na 1 oktober 2017 inburgeringsplichtig is geworden en bij de gemeente staat ingeschreven. De Module Arbeidsmarkt en Participatie is onderdeel van de B1-route en de Z-route, maar is uitgezonderd voor de onderwijsroute. Het examen ONA doet u alleen als u moet inburgeren onder de Wet 2013 of als u vrijwillig inburgert.', [['inburgeren.nl — Kennisexamens', SRC_KENNIS], ['Wet inburgering 2021, artikel 8', SRC_WET8]], CHECKED)}

${note('Weet je niet welke wet voor jou geldt? Kijk in <strong>Mijn Inburgering</strong>. Daar staat precies welke onderdelen je moet doen. Dat is de enige lijst die klopt voor jouw situatie — niet die van je buurman, en niet die van een forum.')}

<h2 id="pvt">PVT: de participatieverklaring</h2>

<p>Het PVT doe je bij je <strong>gemeente</strong>, niet bij DUO. Je leert wat belangrijk is in
Nederland, en daarna zet je je handtekening onder een verklaring.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Je krijgt een brief van de gemeente</h3>
    <p>Daarin staat wat het traject inhoudt en wanneer je wordt verwacht. Geen brief gekregen? Neem contact op met de gemeente waar je staat ingeschreven.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Je volgt het traject: ten minste 12 uur</h3>
    <p>Meestal in een paar bijeenkomsten. Je leert over de kernwaarden: vrijheid, gelijkwaardigheid, solidariteit en participatie.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Je ondertekent de verklaring</h3>
    <p>Je verklaart dat je actief wilt meedoen in de Nederlandse samenleving en respect hebt voor wat hier belangrijk is.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>De gemeente geeft het door aan DUO</h3>
    <p>Na ongeveer drie weken zie je in Mijn Inburgering dat het is verwerkt. Controleer dat.</p>
  </div></div>
</div>

<p>Wat leer je er? De gemeente vat het in de brief zo samen: iedereen in Nederland is gelijk,
iedereen mag zelf kiezen wat hij gelooft, en iedereen mag zeggen wat hij vindt — maar discrimineren
mag niet.</p>

${factTwo('Het participatieverklaringstraject duurt ten minste 12 uren en is een inleiding op de kernwaarden van de Nederlandse samenleving, afgesloten met de ondertekening van de participatieverklaring. De gemeente geeft de ondertekening door aan DUO; na ongeveer drie weken staat dat in Mijn Inburgering.', [['Besluit inburgering 2021, artikel 3.1', SRC_BESLUIT31], ['inburgeren.nl — Kennisexamens en PVT', SRC_KENNIS]], CHECKED)}

<div class="verdict warn">
  <p class="verdict-answer">Let op de termijn — die verschilt per wet</p>
  <p>Onder de <strong>Wet 2021</strong> heb je drie jaar om te tekenen. Onder de
  <strong>Wet 2013</strong> heb je maar <strong>&eacute;&eacute;n jaar</strong>, gerekend vanaf je
  inschrijving bij de gemeente. Lukt dat niet en is dat je eigen schuld, dan krijg je een boete
  van &euro;340 en kun je ook niet meer lenen bij DUO. Ben je te laat buiten je schuld, of heb je
  meer tijd nodig? Neem dan contact op met je gemeente.</p>
</div>

<h2 id="map">MAP: Module Arbeidsmarkt en Participatie</h2>

<p>De MAP hoort bij de <strong>Wet 2021</strong> en gaat over werken en werk zoeken. Je doet hem
bij je gemeente, en tijdens de brede intake hoor je hoe dat er in jouw gemeente uitziet. Je moet
klaar zijn v&oacute;&oacute;r het einde van je inburgeringstermijn.</p>

<p>De MAP bestaat uit twee delen.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Arbeidsmarkt</h3>
      <p class="compare-when">Werk zoeken en solliciteren</p>
    </div>
    <div class="compare-rows">
      ${row('Je leert', 'Welke banen er zijn in Nederland')}
      ${row('En', 'Welke banen bij jou passen')}
      ${row('En', 'Hoe je moet solliciteren')}
      ${row('Hoe', 'Door opdrachten te maken')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Participatie</h3>
      <p class="compare-when">Meedoen in de samenleving</p>
    </div>
    <div class="compare-rows">
      ${row('Je leert', 'Hoe je meedoet in de Nederlandse samenleving')}
      ${row('En', 'Hoe je een goede indruk maakt bij een bedrijf')}
      ${row('Hoe', 'Met praktijkopdrachten')}
      ${row('Bijvoorbeeld', 'Vrijwilligerswerk, een stage of betaald werk')}
    </div>
  </div>
</div>

${fact('De MAP gaat over werken en werk zoeken in Nederland en bestaat uit twee delen: arbeidsmarkt en participatie. In het onderdeel arbeidsmarkt leert u welke banen er zijn, welke banen geschikt voor u zijn en hoe u moet solliciteren, door opdrachten te maken. In het onderdeel participatie doet u praktijkopdrachten, bijvoorbeeld vrijwilligerswerk, stage of betaald werk. U moet klaar zijn voor het einde van uw inburgeringstermijn.', 'inburgeren.nl — Kennisexamens en MAP', SRC_KENNIS, CHECKED)}

${docent('De MAP wordt door cursisten vaak gezien als een verplicht nummer. Zonde. Het participatiedeel is precies het vrijwilligerswerk of de stage waarvan ik iedereen zeg dat het de snelste manier is om je Nederlands vooruit te helpen. Je krijgt hier de tijd en de begeleiding voor die je anders zelf had moeten organiseren.')}

<h2 id="ona">ONA: Ori&euml;ntatie op de Nederlandse Arbeidsmarkt</h2>

<p>ONA is het onderdeel van de <strong>oude wet</strong>, de Wet inburgering 2013. Het is de
voorloper van de MAP en werkt heel anders: het is een portfolio dat je zelf maakt, plus een tweede
deel naar keuze. Hieronder staat hoe het werkt; wil je de acht resultaatkaarten stuk voor stuk en
de planning erbij, lees dan de gids
<a href="/inburgering/ona-examen">Het ONA-examen: portfolio, eindgesprek en planning</a>.</p>

<h3>Wie hoeft geen ONA te doen?</h3>
<ul>
  <li>Je moest beginnen met inburgeren v&oacute;&oacute;r 1 januari 2015.</li>
  <li>Je bent inburgeringsplichtig onder de Wet inburgering 2021.</li>
  <li>Je hebt een Nederlandstalig diploma van een entreeopleiding (mbo niveau 1).</li>
  <li>Je hebt vrijstelling gekregen omdat je in Nederland hebt gewerkt.</li>
</ul>

<h3>Deel 1: het portfolio</h3>

<p>Je maakt opdrachten op <strong>acht resultaatkaarten</strong>. Samen met de bewijsstukken die je
soms moet meesturen, vormen die je portfolio. In de toelichting van DUO staat precies hoe je de
kaarten invult. Let op: <strong>DUO helpt je niet bij het invullen</strong> en heeft ook geen
voorbeeldportfolio.</p>

<div class="guide-cards">
  ${card(I_CLIPBOARD, 'Beroepenori&euml;ntatie', 'Welke beroepen zijn er, en welke passen bij jou?')}
  ${card(I_CLIPBOARD, 'Realistisch beroepsbeeld', 'Wat houdt dat beroep in de praktijk in?')}
  ${card(I_CLIPBOARD, 'Je eigenschappen kennen', 'Wat kun je goed, en wat vind je leuk?')}
  ${card(I_CLIPBOARD, 'Beroepskansen', 'Hoe groot is de kans op werk in dat beroep?')}
  ${card(I_CLIPBOARD, 'Beroepscompetenties', 'Wat moet je kunnen voor dat werk, en wat mist er nog?')}
  ${card(I_CLIPBOARD, 'Netwerk opbouwen', 'Wie ken je, en hoe gebruik je dat om werk te vinden?')}
  ${card(I_CLIPBOARD, 'Werk vinden', 'Hoe zoek je vacatures en hoe solliciteer je?')}
  ${card(I_CLIPBOARD, 'Werkcultuur', 'Hoe gaat het eraan toe op een Nederlandse werkvloer?')}
</div>

<p>Je stuurt de kaarten in via Mijn Inburgering, en je betaalt daarbij het examengeld:
<strong>&euro;40</strong>. Het nakijken duurt ongeveer <strong>zes weken</strong>. Wordt je
portfolio afgekeurd, dan pas je het aan en stuur je het opnieuw in — en dan duurt het nakijken
weer zes weken.</p>

<h3>Deel 2: eindgesprek of cursus</h3>

<p>Is je portfolio goedgekeurd, dan kies je hoe je het examen afmaakt.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Het eindgesprek</h3>
      <p class="compare-when">Bij DUO</p>
    </div>
    <div class="compare-rows">
      ${row('Wachttijd', 'Ongeveer 6 weken na je aanmelding')}
      ${row('Met wie', '2 mensen van DUO')}
      ${row('Waarover', 'Vragen over jouw resultaatkaarten')}
      ${row('Hoe lang', 'Ongeveer 30 minuten')}
      ${row('Uitslag', 'In Mijn Inburgering')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>64 uur ONA-cursus</h3>
      <p class="compare-when">Bij een erkende school</p>
    </div>
    <div class="compare-rows">
      ${row('Wachttijd', 'Geen — je begint wanneer de school kan')}
      ${row('Waar', 'Een school op zoekinburgerschool.nl die ONA aanbiedt')}
      ${row('Kosten', 'De school bepaalt de cursusprijs')}
      ${row('Daarna', 'Geen eindgesprek nodig')}
      ${row('Doorgeven', 'De school meldt je uren digitaal aan DUO')}
    </div>
  </div>
</div>

${factTwo('Het examen ONA bestaat uit twee delen: opdrachten maken (portfolio) en daarna 64 uur ONA-cursus óf een eindgesprek. Het portfolio bestaat uit 8 resultaatkaarten met bewijzen; het nakijken kan 6 weken duren. Na goedkeuring meldt u zich aan voor het eindgesprek, dat binnen 6 weken na aanmelding plaatsvindt, met 2 mensen van DUO, ongeveer 30 minuten duurt en gaat over uw resultaatkaarten. De uitslag krijgt u binnen 8 weken. Het examen ONA kost € 40.', [['inburgeren.nl — Kennisexamens en ONA', SRC_KENNIS], ['DUO — Toelichting ONA (pdf)', SRC_ONA_PDF]], CHECKED)}

${note('Verstuur je je portfolio <strong>per post</strong> omdat inloggen niet lukt? Dan kun je het examen <strong>niet</strong> afronden met de 64-uurscursus; je doet dan het eindgesprek. Goed om te weten voordat je die keuze maakt.')}

${docent('Begin op tijd met je portfolio. Zes weken nakijken, en bij afkeuring nog eens zes weken, en dan zes weken wachten op het eindgesprek — dat is een half jaar voordat je iets fout hebt gedaan. Ik zie mensen hier vaker op stuklopen dan op de taal.')}

<h2 id="zak">En als het eindgesprek niet lukt?</h2>

<p>Dan moet je je portfolio opnieuw insturen, het examen opnieuw betalen en een nieuw eindgesprek
doen. Datzelfde geldt als je het gesprek te laat afzegt. Wil je weten waarom je niet geslaagd bent,
dan kun je dat per e-mail bij DUO opvragen.</p>

<p>Reken die hele keten mee in je planning. Samen met de wachttijd op je taalexamens is dit het
onderdeel waar termijnen het snelst in de knel komen.</p>

${inlineCta('Werk intussen aan je taalexamens', 'Terwijl je portfolio wordt nagekeken, kun je gewoon doorgaan met oefenen. Tien vragen gratis, met uitleg.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>PVT doe je bij de gemeente, in elke route, ten minste 12 uur.</li>
  <li>MAP hoort bij de Wet 2021 — niet in de onderwijsroute.</li>
  <li>ONA hoort bij de Wet 2013, en kost &euro;40.</li>
  <li>ONA-portfolio: 8 resultaatkaarten, 6 weken nakijken.</li>
  <li>Daarna: eindgesprek van ~30 minuten, of 64 uur cursus.</li>
  <li>PVT-termijn: 3 jaar onder 2021, 1 jaar onder 2013.</li>
</ul>`,

  faq: [
    {
      q: 'Wat is het verschil tussen MAP en ONA?',
      a: 'Ze gaan allebei over werk, maar ze horen bij verschillende wetten. De MAP hoort bij de Wet inburgering 2021 en doe je bij je gemeente, met opdrachten en praktijkopdrachten. ONA hoort bij de Wet inburgering 2013 en doe je bij DUO, met een portfolio van acht resultaatkaarten en daarna een eindgesprek of een cursus. Niemand doet ze allebei.',
    },
    {
      q: 'Moet ik de MAP doen in de onderwijsroute?',
      a: 'Nee. De MAP geldt voor de B1-route en de Z-route; de onderwijsroute is ervan uitgezonderd. Het PVT moet je in de onderwijsroute wél doen — dat geldt in elke leerroute. In Mijn Inburgering en in je PIP staat wat er voor jou geldt.',
    },
    {
      q: 'Wat kost het ONA-examen?',
      a: '€40. Dat betaal je bij het insturen van je resultaatkaarten via Mijn Inburgering, met iDEAL of Wero, of vanuit je lening bij DUO. Kies je daarna voor de 64-uurscursus in plaats van het eindgesprek, dan komen de kosten van die cursus daar apart bovenop; de school bepaalt die prijs.',
    },
    {
      q: 'Hoe lang duurt het ONA-examen in totaal?',
      a: 'Reken op maanden. Het nakijken van je portfolio duurt ongeveer zes weken, en bij afkeuring nog eens zes weken voor de aangepaste versie. Daarna is de wachttijd voor het eindgesprek ongeveer zes weken, en de uitslag komt binnen acht weken. Begin er dus vroeg mee.',
    },
    {
      q: 'Hoe lang duurt het participatieverklaringstraject?',
      a: 'Het traject duurt ten minste twaalf uur, meestal verdeeld over een paar bijeenkomsten bij je gemeente. Daarna onderteken je de verklaring. De gemeente geeft dat door aan DUO; na ongeveer drie weken zie je in Mijn Inburgering dat het is verwerkt.',
    },
    {
      q: 'Wat gebeurt er als ik de participatieverklaring niet op tijd teken?',
      a: 'Onder de Wet 2013 heb je één jaar vanaf je inschrijving bij de gemeente. Haal je dat door eigen schuld niet, dan krijg je een boete van €340 en kun je niet meer lenen bij DUO. Ben je buiten je schuld te laat of heb je meer tijd nodig, neem dan contact op met je gemeente — dan krijg je mogelijk extra tijd.',
    },
  ],

  related: ['ona-examen', 'inburgering-stappenplan', 'welke-wet-en-welke-route', 'boete-en-termijn'],
  relatedPosts: [],

  ctaTitle: 'Werk intussen aan je taalexamens',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
