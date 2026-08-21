/**
 * M2's pillar: "Inburgering in Nederland: het complete stappenplan".
 *
 * The body is the owner's manuscript of 2026-08-19, fact-checked line by line against the
 * official sources on the same day — see `SEO/facts.md` §10 for every verification, including
 * the corrections the manuscript needed (KNM has 8 thema's, not 7; "praktijkonderwijs" is on no
 * official vrijstellingslijst; the PIP extension is not "12 weken"; the Z-route's 800+800 holds
 * for asielstatushouders only; the 16-weken uitslag is real but scoped to Schrijven/Spreken A2
 * and date-stamped). Nothing from `facts.md` §9 appears.
 *
 * The visual vocabulary (`.docent-note`, `.guide-steps`, `.guide-cards`, `.yesno-grid`,
 * `.guide-cta-inline`) is defined in `app/globals.css` under "Kennisgids visual elements".
 * Icons are inline lucide paths — no emoji (project rule).
 *
 * Two of the manuscript's MARIEKE-BLOKKEN (3 and 4) were authoring questions to the docent, not
 * content; they are omitted and can be added as docent-notes in stap 3 and stap 4 once answered.
 */
import type { Guide } from './types';
import { fact } from './types';
import { docentIn, factIn, factTwo, figure } from './kit';

const SRC_WET = 'https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering';
const SRC_DIPLOMA_VRIJ = 'https://www.inburgeren.nl/minder-of-geen-examens/diploma-gehaald.jsp';
const SRC_PIP = 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&amp;artikel=5.3';
const SRC_TERMIJN = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&amp;artikel=11';
const SRC_AFSCHALEN = 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&amp;artikel=5.5';
const SRC_ZROUTE = 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&amp;artikel=3.14';
const SRC_KNM = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
const SRC_LOCATIES = 'https://www.inburgeren.nl/examen-doen/examenplaatsen.jsp';
const SRC_UITSLAG = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16';
const SRC_LBT_OEFEN = 'https://minerva.optimumassessment.com/spa/assessment-login/#/SXD9';
const CHECKED = '19-08-2026';

/* Inline lucide icons (size comes from the CSS). */
const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const I_TAAL = svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>');
const I_NL = svg('<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>');
const I_CHECK = svg('<path d="M20 6 9 17l-5-5"/>');
const I_X = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
const I_SHIELD = svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>');
const I_HEART = svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>');
const I_CAP = svg('<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>');
const I_PEN = svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>');
const I_WORK = svg('<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>');
const I_ARROW = svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>');

const docent = (text: string) =>
  `<div class="docent-note"><img src="/images/marieke-schipper.jpg" alt="" width="44" height="44" class="docent-note-avatar" loading="lazy" />` +
  `<div><p class="docent-note-name">Marieke Schipper · NT2-docent</p><p>${text}</p></div></div>`;

const guide: Guide = {
  slug: 'inburgering-stappenplan',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-19',
  pillar: true,

  title: 'Inburgering in Nederland: het complete stappenplan',
  description:
    'Van de brief van DUO tot je diploma: het hele inburgeringstraject in 7 stappen. Wie moet inburgeren, welke wet geldt en welke examens je doet — met bronnen.',

  datePublished: '2026-08-19',
  dateModified: '2026-08-19',
  dateLabel: '19 augustus 2026',
  breadcrumb: 'Stappenplan',
  eyebrow: 'Stappenplan',

  heroTitle: 'Inburgering in Nederland: het complete stappenplan',
  heroSubtitle:
    'Wat moet je precies doen, en waar begint het? Het hele traject in 7 stappen, van de eerste brief van DUO tot je diploma. In simpel Nederlands.',
  heroImage: {
    base: 'inburgering-stappenplan',
    hasWebp: false,
    alt: 'Een Amsterdamse gracht met woonboten en grachtenpanden',
    position: 'center 55%',
    credit: 'Wagner Rech (Pexels)',
  },
  readingMinutes: 9,

  articleHtml: `
<p>Ben je nieuw in Nederland? Dan krijg je waarschijnlijk te maken met inburgering. Je leert dan
Nederlands. En je laat zien dat je weet hoe Nederland werkt.</p>

<p>Inburgering roept veel vragen op. Wat moet je precies doen? Wie bepaalt wat? En waar begint
het?</p>

<p>Op deze pagina leggen we het hele traject uit in 7 stappen. Van de eerste brief van DUO tot je
diploma. In simpel Nederlands, zonder moeilijke woorden.</p>

${docent('Inburgeren kan best ingewikkeld zijn door alle informatie en regels. Daarom heb ik alles voor je op een rij gezet in één duidelijk stappenplan, met een tijdlijn en de belangrijkste regels erbij.')}

<div class="article-toc">
  <p class="article-toc-title">Op deze pagina</p>
  <ol>
    <li><a href="#wat-is-inburgering">Wat is inburgering?</a></li>
    <li><a href="#moet-ik-inburgeren">Moet ik inburgeren?</a></li>
    <li><a href="#welke-wet">Welke wet geldt voor jou?</a></li>
    <li><a href="#stappenplan">Het stappenplan in 7 stappen</a></li>
  </ol>
</div>

<h2 id="wat-is-inburgering">Wat is inburgering?</h2>

<p>Inburgering betekent dat je leert hoe je kunt meedoen in de Nederlandse samenleving. De
overheid verwacht daarbij vooral twee dingen van je:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_TAAL}</div>
    <h3>Je leert Nederlands</h3>
    <p>Zodat je bijvoorbeeld kunt werken, naar de dokter kunt gaan en met de school van je kinderen kunt praten.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_NL}</div>
    <h3>Je leert hoe Nederland werkt</h3>
    <p>Bijvoorbeeld hoe je werk zoekt, hoe de zorgverzekering werkt en welke regels en waarden belangrijk zijn.</p>
  </div>
</div>

<p>Heb je het inburgeringstraject afgerond? Dan krijg je een <strong>inburgeringsdiploma</strong>.
Dit diploma heb je vaak nodig als je later een permanente verblijfsvergunning wilt aanvragen of
Nederlander wilt worden.</p>

<p>Inburgering gaat dus niet over hoe slim je bent. Het gaat erom dat je de taal leert en jezelf
kunt redden in Nederland.</p>

<h2 id="moet-ik-inburgeren">Moet ik inburgeren?</h2>

<p>Niet iedereen die naar Nederland komt, hoeft in te burgeren. Of jij inburgeringsplichtig bent,
hangt vooral af van je nationaliteit en van waarom je naar Nederland komt.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Je moet meestal wél inburgeren als je</p>
    <ul>
      <li>${I_CHECK}<span><strong>asielstatushouder</strong> bent: je hebt na een asielaanvraag een verblijfsvergunning gekregen</span></li>
      <li>${I_CHECK}<span><strong>gezinsmigrant</strong> bent: je komt bij je partner of familie in Nederland wonen</span></li>
      <li>${I_CHECK}<span>om een <strong>andere reden</strong> een verblijfsvergunning hebt gekregen en van buiten de EU komt</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Je hoeft meestal níét in te burgeren als je</p>
    <ul>
      <li>${I_X}<span>uit een land van de <strong>Europese Unie</strong> komt, of uit Noorwegen, IJsland, Liechtenstein of Zwitserland</span></li>
      <li>${I_X}<span><strong>tijdelijk</strong> in Nederland bent voor werk of studie</span></li>
      <li>${I_X}<span>jonger dan 18 bent, of nog naar school moet vanwege de leerplicht of kwalificatieplicht</span></li>
      <li>${I_X}<span>de <strong>pensioenleeftijd</strong> al hebt bereikt</span></li>
      <li>${I_X}<span>8 jaar of langer in Nederland woonde toen je leerplichtig was</span></li>
      <li>${I_X}<span>bepaalde <strong>Nederlandse diploma's</strong> hebt</span></li>
    </ul>
  </div>
</div>

${fact("Heb je een Nederlands diploma van vmbo, havo, vwo of mbo niveau 2 of hoger? Of een hbo- of wo-opleiding in het Nederlands? Dan hoef je meestal niet in te burgeren.", 'inburgeren.nl — Diploma gehaald', SRC_DIPLOMA_VRIJ, CHECKED)}

<p><strong>Weet je het niet zeker?</strong> Je hoeft dit niet zelf uit te zoeken. Als je moet
inburgeren, krijgt DUO dit door. DUO stuurt je dan een brief waarin staat dat je moet inburgeren.
Dat is stap 1.</p>

<h3>Vrijstelling en ontheffing</h3>

<p>De woorden <strong>vrijstelling</strong> en <strong>ontheffing</strong> zorgen vaak voor
verwarring. Ze betekenen niet hetzelfde.</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_SHIELD}</div>
    <h3>Vrijstelling</h3>
    <p>Je bent al voldoende ingeburgerd. Bijvoorbeeld omdat je een Nederlands diploma hebt, of Nederlandstalig onderwijs hebt gevolgd.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_HEART}</div>
    <h3>Ontheffing</h3>
    <p>Je kunt het vereiste niveau echt niet halen, bijvoorbeeld door een ziekte of beperking. En dat blijft zo.</p>
  </div>
</div>

<p>Een vrijstelling of ontheffing vraag je zelf aan bij DUO. Je gemeente kan je hierbij
adviseren.</p>

<h2 id="welke-wet">Welke wet geldt voor jou?</h2>

<p>Dit is belangrijk, want er zijn twee wetten die naast elkaar bestaan. Ze hebben andere regels
en andere examens.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>Wet inburgering 2013</th><th>Wet inburgering 2021</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Voor wie</strong></td><td>Je werd inburgeringsplichtig vóór 1 januari 2022</td><td>Je werd inburgeringsplichtig op of na 1 januari 2022</td></tr>
    <tr><td><strong>Wie regelt het</strong></td><td>Je regelt alles zelf</td><td>De gemeente begeleidt je</td></tr>
    <tr><td><strong>Taalniveau</strong></td><td>A2</td><td>Meestal B1</td></tr>
    <tr><td><strong>Naast de taal</strong></td><td>KNM, ONA en PVT</td><td>KNM, MAP en PVT</td></tr>
  </tbody>
</table>
</div>

${fact('De Wet inburgering 2021 heet 2021, maar geldt pas vanaf 1 januari 2022. Moest je eerder beginnen, dan val je onder de oude wet van 2013.', 'rijksoverheid.nl — Nieuwe Wet inburgering', SRC_WET, CHECKED)}

<p>Kijk dus eerst in je brief van DUO welke wet voor jou geldt. De rest van deze pagina gaat over
de <strong>Wet inburgering 2021</strong>, want die geldt voor bijna iedereen die nu begint.</p>

<h2 id="stappenplan">Het stappenplan in 7 stappen</h2>

${figure(
  'explainer-intake-naar-pip', 1400, 891,
  'Drie dingen — een gesprek, een toets en je persoonlijke situatie — komen samen in één document: je PIP.',
  'De eerste stappen draaien om één ding: de gemeente verzamelt drie soorten informatie en maakt daar één plan van. Dat plan is je PIP, en daarin staat welke route en welke examens voor jou gelden.',
)}

<div class="guide-steps">

<div class="guide-step">
  <div class="guide-step-num">1</div>
  <div class="guide-step-body">
    <h3>Je krijgt een brief van DUO</h3>
    <p>Je schrijft je in bij de gemeente, in de BRP (de basisregistratie personen). DUO
    controleert dan of je moet inburgeren.</p>
    <p>Moet je inburgeren? Dan krijg je een brief. Daarin staat dat je inburgeringsplichtig bent
    en wat je nu moet doen.</p>
    <p><strong>Bewaar deze brief goed.</strong> Je hebt hem later nodig.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">2</div>
  <div class="guide-step-body">
    <h3>De brede intake bij de gemeente</h3>
    <p>Je gemeente nodigt je uit voor de <strong>brede intake</strong>: een gesprek en een korte
    toets. Het is een kennismaking, geen examen.</p>
    <p>De gemeente wil weten wie je bent en wat je nodig hebt. Er wordt gesproken over:</p>
    <ul>
      <li>welke opleiding je hebt gedaan</li>
      <li>wat voor werk je hebt gedaan</li>
      <li>hoe het met je gezondheid gaat</li>
      <li>je persoonlijke situatie, bijvoorbeeld je kinderen</li>
    </ul>
    <p>Je maakt ook de <strong>leerbaarheidstoets</strong>. Die meet hoe makkelijk jij een nieuwe
    taal leert. Zo kan de gemeente kiezen welke leerroute bij je past.</p>
    <p><strong>Tip:</strong> neem iemand mee die goed Nederlands of jouw taal spreekt. Je mag ook
    om een tolk vragen.</p>
    ${docent(`Wees niet bang voor de leerbaarheidstoets. Het is geen examen waarvoor je kunt slagen of zakken. De toets kijkt alleen hoe makkelijk je een nieuwe taal leert, en je maakt hem op de computer. Voorbereiden is niet nodig. Wil je alvast wennen aan het systeem? Dat kan in <a href="${SRC_LBT_OEFEN}" target="_blank" rel="noopener">de officiële oefenomgeving van DUO</a>.`)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">3</div>
  <div class="guide-step-body">
    <h3>Je PIP wordt vastgesteld</h3>
    <p>Na de brede intake maakt de gemeente jouw <strong>PIP</strong>: het persoonlijk plan
    inburgering en participatie.</p>
    <p>In je PIP staat welke leerroute je gaat volgen, welke hulp de gemeente je geeft en hoe
    intensief je traject is.</p>
    ${fact('De gemeente moet je PIP uiterlijk 10 weken na de brief van DUO vaststellen. Stond je toen nog niet ingeschreven bij de gemeente? Dan tellen de 10 weken vanaf je inschrijving. Moet de gemeente eerst informatie bij anderen opvragen, dan mag het iets langer duren.', 'Besluit inburgering 2021, artikel 5.3', SRC_PIP, CHECKED)}
    <p><strong>De datum van je PIP is belangrijk.</strong> Je inburgeringstermijn begint op de dag
    na de dagtekening — de datum die op het document staat.</p>
    ${fact('Je hebt 3 jaar om aan je inburgeringsplicht te voldoen. De termijn start op de dag na de dagtekening van je PIP.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}
    <p>Ben je het niet eens met je PIP? Dan kun je bezwaar maken. In de brief bij je PIP staat hoe
    dat werkt.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">4</div>
  <div class="guide-step-body">
    <h3>Je krijgt een leerroute</h3>
    <p>Er zijn drie leerroutes. De gemeente bepaalt welke bij jou past, op basis van de brede
    intake en de leerbaarheidstoets.</p>
    <div class="theme-section">
      <p class="theme-title">B1-route — voor de meeste mensen</p>
      <p>Dit is de standaardroute. Je doet examens op taalniveau B1 en sluit af met een diploma.
      Lukt B1 echt niet? Dan mag je onder voorwaarden overstappen naar examens op A2.</p>
    </div>
    <div class="theme-section">
      <p class="theme-title">Onderwijsroute — vooral voor jongeren</p>
      <p>Deze route bereidt je voor op een opleiding. Je haalt taalniveau B1 of B2 en stroomt door
      naar mbo, hbo of universiteit.</p>
    </div>
    <div class="theme-section">
      <p class="theme-title">Z-route — als B1 of A2 te moeilijk is</p>
      <p>Het doel is taalniveau A1. Je sluit af met een eindgesprek bij de gemeente, niet met een
      centraal examen. Haal je toch A2? Dan mag je alsnog examen doen.</p>
    </div>
    ${factTwo('Overstappen van B1 naar A2 kan alleen in de B1-route. Je moet dan minstens 600 uur taalles hebben gevolgd bij een school met een keurmerk, en laten zien dat je je best hebt gedaan. Ben je asielstatushouder? Dan bestaat de Z-route uit 800 uur les (taal en KNM), 800 uur meedoen en activering, en een eindgesprek. Ben je gezinsmigrant? Dan zijn het 800 uur les en een eindgesprek.', [['Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN], ['Besluit inburgering 2021, artikel 3.14', SRC_ZROUTE]], CHECKED)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">5</div>
  <div class="guide-step-body">
    <h3>Je volgt lessen en doet mee</h3>
    <p>Nu begint het echte werk: de taallessen. Daarnaast horen deze onderdelen bij je
    inburgering:</p>
    <div class="guide-cards">
      <div class="guide-card">
        <div class="guide-card-icon">${I_CAP}</div>
        <h3>KNM</h3>
        <p><strong>Kennis van de Nederlandse Maatschappij.</strong> Je leert hoe Nederland werkt, van werk en inkomen tot wonen en zorg. KNM hoort bij álle leerroutes.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_PEN}</div>
        <h3>PVT</h3>
        <p><strong>Participatieverklaringstraject.</strong> Een korte cursus over de Nederlandse kernwaarden: vrijheid, gelijkwaardigheid, solidariteit en participatie. Je sluit af door de participatieverklaring te ondertekenen.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_WORK}</div>
        <h3>MAP</h3>
        <p><strong>Module Arbeidsmarkt en Participatie.</strong> Je leert hoe je werk zoekt in Nederland: solliciteren, je cv en hoe de arbeidsmarkt werkt. MAP hoort bij de B1-route en de Z-route.</p>
      </div>
    </div>
    ${fact("KNM gaat over 8 thema's: werk en inkomen · omgangsvormen, waarden en normen · wonen · gezondheid en gezondheidszorg · geschiedenis en geografie · instanties · staatsinrichting en rechtsstaat · onderwijs en opvoeding.", 'Regeling inburgering 2021 — eindtermen KNM (Stcrt. 2024, 15802)', SRC_KNM, CHECKED)}
    <div class="guide-cta-inline">
      <p><strong>Test gratis waar je nu staat</strong>Wil je weten hoe goed je Nederlands al is? Doe een gratis oefenexamen. Je hebt geen account nodig.</p>
      <a class="guide-cta-btn" href="/nl/oefenen">Start gratis ${I_ARROW}</a>
    </div>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">6</div>
  <div class="guide-step-body">
    <h3>Je doet examen</h3>
    <p>Volg je de B1-route of de onderwijsroute? Dan doe je vijf examens bij DUO:</p>
    <div class="article-table-wrap">
    <table>
      <thead><tr><th>Examen</th><th>Wat je doet</th></tr></thead>
      <tbody>
        <tr><td><strong>Lezen</strong></td><td>Teksten lezen en vragen beantwoorden</td></tr>
        <tr><td><strong>Luisteren</strong></td><td>Filmpjes en geluidsfragmenten begrijpen</td></tr>
        <tr><td><strong>Schrijven</strong></td><td>Korte teksten schrijven</td></tr>
        <tr><td><strong>Spreken</strong></td><td>Antwoorden inspreken achter de computer</td></tr>
        <tr><td><strong>KNM</strong></td><td>Vragen over de Nederlandse maatschappij</td></tr>
      </tbody>
    </table>
    </div>
    <p>Je doet de taalexamens op B1-niveau. Lukt dat niet, dan mag je in de B1-route onder
    voorwaarden examens op A2 doen (zie stap 4).</p>
    <p>Je meldt je aan via <strong>Mijn Inburgering</strong>, de website van DUO. Je hoeft niet
    alle examens tegelijk te doen. De meeste mensen spreiden ze over meerdere maanden.</p>
    ${fact('De kennisexamens en de taalexamens op A2 doe je op een van de zes examenlocaties: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht of Zwolle. Examens op B1 of B2 zijn het staatsexamen NT2, met eigen locaties.', 'inburgeren.nl — Examenplaatsen', SRC_LOCATIES, CHECKED)}
    ${docent('In mijn lessen zie ik dat de meeste cursisten Lezen en Luisteren het makkelijkst vinden. Schrijven en Spreken vinden ze vaak moeilijker. Begin daarom met Lezen of Luisteren, en verdeel je tijd goed. Plan liever niet meerdere examens op één dag — zo houd je genoeg energie over.')}
    <p>Wil je precies weten hoe elk taalonderdeel eruitziet? Lees:
    <a href="/nl/blog/inburgeringsexamen-a2-uitleg">Inburgeringsexamen A2: de 4 taalonderdelen uitgelegd</a>.
    Twijfel je over het niveau? Lees:
    <a href="/nl/blog/taalniveaus-a1-a2-b1-nederlands">het verschil tussen A1, A2 en B1</a>.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">7</div>
  <div class="guide-step-body">
    <h3>Je diploma, en wat daarna komt</h3>
    <p>Ben je voor alle onderdelen geslaagd? Dan krijg je je <strong>inburgeringsdiploma</strong>.
    Je kunt het downloaden in Mijn Diploma's van DUO.</p>
    <p>Met dat diploma kun je later een verblijfsvergunning voor onbepaalde tijd aanvragen, of
    naturalisatie: Nederlander worden.</p>
    ${fact('De uitslag van een kennisexamen of een A2-taalexamen komt normaal binnen 8 weken. Voor Schrijven A2 en Spreken A2 doet DUO er nu langer over: maximaal 16 weken (bericht van 31 juli 2026). Kom je daardoor in tijdnood met je termijn? Dan krijg je automatisch 6 maanden extra tijd.', 'inburgeren.nl — nieuwsbericht 31-07-2026', SRC_UITSLAG, CHECKED)}
    <p><strong>Gezakt voor een onderdeel?</strong> Dat is niet het einde. Je doet alleen dát
    onderdeel opnieuw; wat je al hebt gehaald, blijft staan. Lees hier wat je dan moet regelen:
    <a href="/nl/blog/inburgeringsexamen-zakken-herkansen">Gezakt voor het inburgeringsexamen? Dit gebeurt er nu</a>.</p>
  </div>
</div>

</div>

${figure(
  'explainer-wat-moet-je-halen', 1400, 590,
  'Zes losse onderdelen komen samen in één diploma met een zegel.',
  'Je diploma is geen groot examen, maar een verzameling losse onderdelen. Wat je gehaald hebt, blijft staan — zak je voor één onderdeel, dan doe je alleen dát onderdeel opnieuw.',
)}

<h2 id="begin-met-oefenen">Begin vandaag met oefenen</h2>

<p>Het inburgeringsexamen is goed te doen als je weet wat je kunt verwachten. Veel mensen zakken
niet omdat hun Nederlands te slecht is, maar omdat ze het examenformat niet kennen.</p>

<p>Op deze site oefen je met examens in het echte DUO-formaat, gemaakt door een gecertificeerde
NT2-docent. Geen vragen uit een computer, maar uit de lespraktijk.</p>

${docent('Ik heb deze oefenexamens gemaakt omdat er nog weinig plekken zijn waar je persoonlijke feedback krijgt. Juist bij Spreken en Schrijven is feedback belangrijk. Op deze site krijg je direct feedback op wat je schrijft en zegt, op basis van mijn beoordelingsmodel — en ik kijk de beoordelingen na. Dat maakt deze oefenexamens anders.')}

<div class="info-box">
  <p>De regels rond inburgering veranderen regelmatig. Kijk voor de officiële en actuele
  informatie altijd op <a href="https://www.inburgeren.nl" target="_blank" rel="noopener">inburgeren.nl</a>
  en <a href="https://www.rijksoverheid.nl" target="_blank" rel="noopener">rijksoverheid.nl</a>.
  Deze pagina is bedoeld als uitleg, niet als juridisch advies.</p>
</div>
`,

  sidebarHtml: '',

  faq: [
    {
      q: 'Hoe lang duurt inburgering?',
      a: 'Je hebt 3 jaar de tijd. De termijn begint op de dag na de dagtekening van je PIP. Hoe lang je er echt over doet, verschilt per persoon: sommige mensen zijn binnen een jaar klaar, anderen hebben de volle 3 jaar nodig.',
    },
    {
      q: 'Welk taalniveau moet ik halen?',
      a: 'Onder de Wet inburgering 2021 is dat meestal B1. Lukt B1 niet, dan mag je in de B1-route onder voorwaarden examens op A2 doen. In de Z-route is het doel A1. Viel je onder de oude wet uit 2013, dan is A2 het niveau.',
    },
    {
      q: 'Wat is het verschil tussen inburgering en naturalisatie?',
      a: 'Inburgering is de plicht om Nederlands te leren en Nederland te leren kennen. Naturalisatie is de aanvraag om Nederlander te worden. Je inburgeringsdiploma heb je nodig als je wilt naturaliseren, maar het is niet hetzelfde.',
    },
    {
      q: 'Moet ik het KNM-examen doen?',
      a: "KNM hoort bij alle leerroutes onder de Wet inburgering 2021. In de B1-route en de onderwijsroute doe je het KNM-examen; in de Z-route volg je er lessen over. De vragen gaan over 8 thema's, van werk en inkomen tot staatsinrichting.",
    },
    {
      q: 'Kan ik zelf mijn leerroute kiezen?',
      a: 'Niet helemaal. De gemeente bepaalt je leerroute op basis van de brede intake en de leerbaarheidstoets. Ben je het er niet mee eens? Dan kun je bezwaar maken tegen je PIP. In de brief bij je PIP staat hoe dat werkt.',
    },
    {
      q: 'Waar kan ik gratis oefenen voor het inburgeringsexamen?',
      a: 'DUO heeft een aantal oefenexamens op inburgeren.nl. Wil je meer oefenen, dan kun je op deze site gratis oefenexamens doen voor Lezen, Luisteren, Schrijven en Spreken — met uitleg bij elke vraag.',
    },
  ],

  related: ['moet-ik-inburgeren', 'welke-wet-en-welke-route', 'wat-kost-inburgeren'],
  relatedPosts: [
    'inburgeringsexamen-a2-uitleg',
    'taalniveaus-a1-a2-b1-nederlands',
    'inburgeringsexamen-zakken-herkansen',
  ],

  ctaTitle: 'Kijk waar je nu staat',
  ctaDesc: 'Tien vragen per onderdeel, met uitleg bij elk antwoord. Geen account nodig.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis oefenexamen',

  /* English and Arabic bodies, 20-08-2026, added when the three spokes were translated.
   *
   * Three things to keep right in here:
   *
   *  - **Internal links carry the locale.** The Dutch body hardcodes `/nl/oefenen` and
   *    `/nl/blog/…`; each translation points at its own locale, or an English reader is dropped
   *    into a Dutch page mid-sentence.
   *  - **Official Dutch terms stay Dutch**, glossed on first use — inburgering, DUO, PIP, KNM,
   *    MAP, PVT, brede intake, leerbaarheidstoets, Mijn Inburgering. The reader has to match them
   *    against a letter and a portal that exist in Dutch only.
   *  - **`fact()` and `docent()` are the Dutch-chrome helpers**; the translations use `factIn()`
   *    and `docentIn()` so "Bron"/"geraadpleegd" and the docent's role line are not the only
   *    Dutch words left on an English page.
   */
  translations: {
    en: {
      title: 'Integration in the Netherlands: the complete step-by-step guide',
      breadcrumb: 'Step-by-step guide',
      dateLabel: '19 August 2026',
      eyebrow: 'Step-by-step guide',
      heroTitle: 'Integration in the Netherlands: the complete step-by-step guide',
      heroSubtitle:
        'What exactly do you have to do, and where does it start? The whole process in 7 steps, from the first letter from DUO to your diploma. In plain language.',
      description:
        'From the letter from DUO to your diploma: the integration process in 7 steps. Who must integrate, which law applies and which exams you sit — with sources.',
      articleHtml: `
<p>New to the Netherlands? Then you will probably have to deal with <em>inburgering</em> —
integration. You learn Dutch, and you show that you know how the Netherlands works.</p>

<p>Integration raises a lot of questions. What exactly do you have to do? Who decides what? And
where does it start?</p>

<p>This page explains the whole process in 7 steps. From the first letter from DUO to your
diploma, in plain language.</p>

${docentIn('en', 'Integration can feel complicated, with all that information and all those rules. So I have set it all out for you in one clear step-by-step guide, with a timeline and the most important rules alongside it.')}

<div class="article-toc">
  <p class="article-toc-title">On this page</p>
  <ol>
    <li><a href="#wat-is-inburgering">What is inburgering?</a></li>
    <li><a href="#moet-ik-inburgeren">Do I have to integrate?</a></li>
    <li><a href="#welke-wet">Which law applies to you?</a></li>
    <li><a href="#stappenplan">The process in 7 steps</a></li>
  </ol>
</div>

<h2 id="wat-is-inburgering">What is inburgering?</h2>

<p>Integration means learning how to take part in Dutch society. The government mainly expects
two things of you:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_TAAL}</div>
    <h3>You learn Dutch</h3>
    <p>So that you can work, go to the doctor and talk to your children's school, for example.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_NL}</div>
    <h3>You learn how the Netherlands works</h3>
    <p>How you look for work, how health insurance works, and which rules and values matter here.</p>
  </div>
</div>

<p>Once you have completed the process you receive an <strong>inburgeringsdiploma</strong>. You
often need this diploma later if you want to apply for permanent residence or become a Dutch
citizen.</p>

<p>So integration is not about how clever you are. It is about learning the language and being
able to manage on your own in the Netherlands.</p>

<h2 id="moet-ik-inburgeren">Do I have to integrate?</h2>

<p>Not everyone who comes to the Netherlands has to integrate. Whether you are required to
depends mainly on your nationality and on why you came here.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Usually you do have to integrate if you</p>
    <ul>
      <li>${I_CHECK}<span>are an <strong>asylum status holder</strong>: you were granted a residence permit after an asylum application</span></li>
      <li>${I_CHECK}<span>are a <strong>family migrant</strong>: you are joining your partner or family in the Netherlands</span></li>
      <li>${I_CHECK}<span>were granted a residence permit for <strong>another reason</strong> and come from outside the EU</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Usually you do not have to if you</p>
    <ul>
      <li>${I_X}<span>come from an <strong>EU</strong> country, or from Norway, Iceland, Liechtenstein or Switzerland</span></li>
      <li>${I_X}<span>are in the Netherlands <strong>temporarily</strong> for work or study</span></li>
      <li>${I_X}<span>are under 18, or still have to attend school under the compulsory education or qualification rules</span></li>
      <li>${I_X}<span>have already reached <strong>state pension age</strong></span></li>
      <li>${I_X}<span>lived in the Netherlands for 8 years or more while you were of compulsory school age</span></li>
      <li>${I_X}<span>hold certain <strong>Dutch diplomas</strong></span></li>
    </ul>
  </div>
</div>

${factIn('en', 'Do you hold a Dutch vmbo, havo, vwo or mbo level 2 or higher diploma? Or a hbo or university degree taught in Dutch? Then you usually do not have to integrate.', 'inburgeren.nl — Diploma gehaald', SRC_DIPLOMA_VRIJ, CHECKED)}

<p><strong>Not sure?</strong> You do not have to work this out yourself. If you have to integrate,
DUO is notified. DUO then sends you a letter saying so. That is step 1.</p>

<h3>Vrijstelling and ontheffing</h3>

<p>The words <strong>vrijstelling</strong> (exemption) and <strong>ontheffing</strong> (waiver)
often cause confusion. They do not mean the same thing.</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_SHIELD}</div>
    <h3>Vrijstelling</h3>
    <p>You are already sufficiently integrated. For instance because you hold a Dutch diploma, or followed Dutch-language education.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_HEART}</div>
    <h3>Ontheffing</h3>
    <p>You genuinely cannot reach the required level, for example because of an illness or disability. And that will not change.</p>
  </div>
</div>

<p>You apply for a vrijstelling or ontheffing yourself at DUO. Your municipality can advise you.</p>

<h2 id="welke-wet">Which law applies to you?</h2>

<p>This matters, because two acts exist side by side. They have different rules and different
exams.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>Wet inburgering 2013</th><th>Wet inburgering 2021</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>For whom</strong></td><td>Your duty started before 1 January 2022</td><td>Your duty started on or after 1 January 2022</td></tr>
    <tr><td><strong>Who arranges it</strong></td><td>You arrange everything yourself</td><td>The municipality guides you</td></tr>
    <tr><td><strong>Language level</strong></td><td>A2</td><td>Usually B1</td></tr>
    <tr><td><strong>Besides the language</strong></td><td>KNM, ONA and PVT</td><td>KNM, MAP and PVT</td></tr>
  </tbody>
</table>
</div>

${factIn('en', 'The Wet inburgering 2021 is called 2021 but only applies from 1 January 2022. If you had to start before that, you fall under the older act of 2013.', 'rijksoverheid.nl — Nieuwe Wet inburgering', SRC_WET, CHECKED)}

<p>So check your letter from DUO first to see which act applies to you. The rest of this page is
about the <strong>Wet inburgering 2021</strong>, because that is the one that applies to almost
everyone starting now.</p>

<h2 id="stappenplan">The process in 7 steps</h2>

<div class="guide-steps">

<div class="guide-step">
  <div class="guide-step-num">1</div>
  <div class="guide-step-body">
    <h3>You get a letter from DUO</h3>
    <p>You register with your municipality, in the BRP (the personal records database). DUO then
    checks whether you have to integrate.</p>
    <p>Do you? Then you get a letter. It states that you are required to integrate and what you
    have to do now.</p>
    <p><strong>Keep this letter safe.</strong> You will need it later.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">2</div>
  <div class="guide-step-body">
    <h3>The brede intake at the municipality</h3>
    <p>Your municipality invites you for the <strong>brede intake</strong>: an interview and a
    short test. It is an introduction, not an exam.</p>
    <p>The municipality wants to know who you are and what you need. You will talk about:</p>
    <ul>
      <li>what education you have had</li>
      <li>what work you have done</li>
      <li>how your health is</li>
      <li>your personal situation, your children for instance</li>
    </ul>
    <p>You also take the <strong>leerbaarheidstoets</strong>, the learnability test. It measures
    how easily you learn a new language, so the municipality can choose a learning route that
    suits you.</p>
    <p><strong>Tip:</strong> bring someone who speaks good Dutch or your own language. You may
    also ask for an interpreter.</p>
    ${docentIn('en', `Do not be afraid of the leerbaarheidstoets. It is not an exam you can pass or fail. It only looks at how easily you learn a new language, and you take it on a computer. There is no need to prepare. Would you like to get used to the system in advance? You can, in <a href="${SRC_LBT_OEFEN}" target="_blank" rel="noopener">DUO's official practice environment</a>.`)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">3</div>
  <div class="guide-step-body">
    <h3>Your PIP is set</h3>
    <p>After the brede intake the municipality draws up your <strong>PIP</strong>: your personal
    integration and participation plan.</p>
    <p>Your PIP states which learning route you will follow, what support the municipality gives
    you and how intensive your programme is.</p>
    ${factIn('en', 'The municipality must set your PIP no later than 10 weeks after the letter from DUO. Were you not yet registered with the municipality at that point? Then the 10 weeks run from your registration. If the municipality first has to request information from others, it may take a little longer.', 'Besluit inburgering 2021, artikel 5.3', SRC_PIP, CHECKED)}
    <p><strong>The date of your PIP matters.</strong> Your integration period starts on the day
    after the dagtekening — the date printed on the document.</p>
    ${factIn('en', 'You have 3 years to meet your integration duty. The period starts on the day after the date of your PIP.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}
    <p>Do you disagree with your PIP? Then you can lodge an objection. The letter accompanying
    your PIP explains how.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">4</div>
  <div class="guide-step-body">
    <h3>You are given a learning route</h3>
    <p>There are three learning routes. The municipality decides which one suits you, based on the
    brede intake and the leerbaarheidstoets.</p>
    <div class="theme-section">
      <p class="theme-title">B1 route — for most people</p>
      <p>This is the standard route. You sit exams at language level B1 and finish with a diploma.
      Is B1 genuinely out of reach? Then under conditions you may switch to exams at A2.</p>
    </div>
    <div class="theme-section">
      <p class="theme-title">Education route — mainly for young people</p>
      <p>This route prepares you for further study. You reach language level B1 or B2 and move on
      to mbo, hbo or university.</p>
    </div>
    <div class="theme-section">
      <p class="theme-title">Z-route — if B1 or A2 is too difficult</p>
      <p>The target is language level A1. You finish with a closing interview at the municipality
      rather than a central exam. Reach A2 anyway? Then you may still sit the exams.</p>
    </div>
    ${factIn('en', 'Switching from B1 to A2 is only possible in the B1 route. You must have had at least 600 hours of language tuition at a school with a quality mark, and be able to show that you made the effort.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}
    ${factIn('en', 'Are you an asylum status holder? Then the Z-route consists of 800 hours of tuition (language and KNM), 800 hours of participation and activation, and a closing interview. Are you a family migrant? Then it is 800 hours of tuition and a closing interview.', 'Besluit inburgering 2021, artikel 3.14', SRC_ZROUTE, CHECKED)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">5</div>
  <div class="guide-step-body">
    <h3>You take lessons and take part</h3>
    <p>Now the real work begins: the language lessons. Alongside them, these parts belong to your
    integration:</p>
    <div class="guide-cards">
      <div class="guide-card">
        <div class="guide-card-icon">${I_CAP}</div>
        <h3>KNM</h3>
        <p><strong>Knowledge of Dutch Society.</strong> You learn how the Netherlands works, from work and income to housing and healthcare. KNM is part of every learning route.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_PEN}</div>
        <h3>PVT</h3>
        <p><strong>Participation declaration programme.</strong> A short course on Dutch core values: freedom, equality, solidarity and participation. You finish it by signing the participation declaration.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_WORK}</div>
        <h3>MAP</h3>
        <p><strong>Labour Market and Participation Module.</strong> You learn how to look for work in the Netherlands: applications, your CV, and how the labour market works. MAP belongs to the B1 route and the Z-route.</p>
      </div>
    </div>
    ${factIn('en', "KNM covers 8 themes: work and income · manners, values and norms · housing · health and healthcare · history and geography · public bodies · the constitution and the rule of law · education and raising children.", 'Regeling inburgering 2021 — eindtermen KNM (Stcrt. 2024, 15802)', SRC_KNM, CHECKED)}
    <div class="guide-cta-inline">
      <p><strong>Test where you stand, for free</strong>Want to know how good your Dutch already is? Take a free practice exam. No account needed.</p>
      <a class="guide-cta-btn" href="/en/oefenen">Start for free ${I_ARROW}</a>
    </div>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">6</div>
  <div class="guide-step-body">
    <h3>You sit the exams</h3>
    <p>Following the B1 route or the education route? Then you sit five exams at DUO:</p>
    <div class="article-table-wrap">
    <table>
      <thead><tr><th>Exam</th><th>What you do</th></tr></thead>
      <tbody>
        <tr><td><strong>Reading</strong></td><td>Read texts and answer questions</td></tr>
        <tr><td><strong>Listening</strong></td><td>Understand video and audio fragments</td></tr>
        <tr><td><strong>Writing</strong></td><td>Write short texts</td></tr>
        <tr><td><strong>Speaking</strong></td><td>Record your answers at the computer</td></tr>
        <tr><td><strong>KNM</strong></td><td>Questions about Dutch society</td></tr>
      </tbody>
    </table>
    </div>
    <p>You sit the language exams at B1 level. If that does not work out, in the B1 route you may
    sit exams at A2 under conditions (see step 4).</p>
    <p>You register through <strong>Mijn Inburgering</strong>, DUO's website. You do not have to
    sit all the exams at once. Most people spread them over several months.</p>
    ${factIn('en', 'You sit the knowledge exams and the A2 language exams at one of six exam locations: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht or Zwolle. Exams at B1 or B2 are the staatsexamen NT2, which has its own locations.', 'inburgeren.nl — Examenplaatsen', SRC_LOCATIES, CHECKED)}
    ${docentIn('en', 'In my lessons I see that most students find Reading and Listening easiest. Writing and Speaking they often find harder. So start with Reading or Listening, and divide your time well. Try not to plan several exams on one day — that way you keep enough energy.')}
    <p>Want to know exactly what each language part looks like? Read:
    <a href="/en/blog/inburgeringsexamen-a2-uitleg">Inburgeringsexamen A2: the 4 language parts explained</a>.
    Unsure about the level? Read:
    <a href="/en/blog/taalniveaus-a1-a2-b1-nederlands">the difference between A1, A2 and B1</a>.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">7</div>
  <div class="guide-step-body">
    <h3>Your diploma, and what comes after</h3>
    <p>Passed everything? Then you receive your <strong>inburgeringsdiploma</strong>. You can
    download it from Mijn Diploma's at DUO.</p>
    <p>With that diploma you can later apply for permanent residence, or for naturalisation:
    becoming a Dutch citizen.</p>
    ${factIn('en', 'The result of a knowledge exam or an A2 language exam normally arrives within 8 weeks. For Writing A2 and Speaking A2 DUO is currently taking longer: up to 16 weeks (notice of 31 July 2026). If that puts your deadline at risk, you automatically get 6 months extra.', 'inburgeren.nl — nieuwsbericht 31-07-2026', SRC_UITSLAG, CHECKED)}
    <p><strong>Failed a part?</strong> That is not the end. You only resit that part; what you have
    already passed stays. Read what to arrange here:
    <a href="/en/blog/inburgeringsexamen-zakken-herkansen">Failed the integration exam? Here is what happens now</a>.</p>
  </div>
</div>

</div>

<h2 id="begin-met-oefenen">Start practising today</h2>

<p>The integration exam is very manageable once you know what to expect. Many people fail not
because their Dutch is too weak, but because they do not know the exam format.</p>

<p>On this site you practise with exams in the real DUO format, written by a certified NT2
teacher. Not questions from a computer, but from the classroom.</p>

${docentIn('en', 'I made these practice exams because there are still few places where you get personal feedback. With Speaking and Writing in particular, feedback matters. On this site you get immediate feedback on what you write and say, based on my marking model — and I review the assessments myself. That is what makes these practice exams different.')}

<div class="info-box">
  <p>The rules around integration change regularly. For official and current information, always
  check <a href="https://www.inburgeren.nl" target="_blank" rel="noopener">inburgeren.nl</a> and
  <a href="https://www.rijksoverheid.nl" target="_blank" rel="noopener">rijksoverheid.nl</a>.
  This page is intended as an explanation, not as legal advice.</p>
</div>
`,
      sidebarHtml: '',
      ctaTitle: 'See where you stand',
      ctaDesc: 'Ten questions per skill, with an explanation after every answer. No account needed.',
      ctaLabel: 'Start a free practice exam',
      faq: [
        {
          q: 'How long does integration take?',
          a: 'You have 3 years. The period starts on the day after the date of your PIP. How long it actually takes differs per person: some people finish within a year, others need the full 3 years.',
        },
        {
          q: 'What language level do I have to reach?',
          a: 'Under the Wet inburgering 2021 it is usually B1. If B1 does not work out, in the B1 route you may sit exams at A2 under conditions. In the Z-route the target is A1. If you fell under the older 2013 act, the level is A2.',
        },
        {
          q: 'What is the difference between integration and naturalisation?',
          a: 'Integration is the duty to learn Dutch and get to know the Netherlands. Naturalisation is the application to become a Dutch citizen. You need your integration diploma if you want to naturalise, but they are not the same thing.',
        },
        {
          q: 'Do I have to sit the KNM exam?',
          a: 'KNM is part of every learning route under the Wet inburgering 2021. In the B1 route and the education route you sit the KNM exam; in the Z-route you take lessons on it. The questions cover 8 themes, from work and income to the constitution.',
        },
        {
          q: 'Can I choose my own learning route?',
          a: 'Not entirely. The municipality decides your learning route based on the brede intake and the leerbaarheidstoets. Do you disagree? Then you can object to your PIP. The letter accompanying your PIP explains how.',
        },
        {
          q: 'Where can I practise for the integration exam for free?',
          a: 'DUO has a number of practice exams on inburgeren.nl. If you want to practise more, this site offers free practice exams for Reading, Listening, Writing and Speaking — with an explanation for every question.',
        },
      ],
    },

    ar: {
      title: 'الاندماج في هولندا: الدليل الكامل خطوة بخطوة',
      breadcrumb: 'دليل خطوة بخطوة',
      dateLabel: '١٩ أغسطس ٢٠٢٦',
      eyebrow: 'دليل خطوة بخطوة',
      heroTitle: 'الاندماج في هولندا: الدليل الكامل خطوة بخطوة',
      heroSubtitle:
        'ما الذي عليك فعله بالضبط، ومن أين يبدأ الأمر؟ المسار كاملًا في ٧ خطوات، من أول رسالة من DUO حتى شهادتك. بلغة بسيطة.',
      description:
        'من رسالة DUO إلى شهادتك: مسار الاندماج في هولندا كاملًا في ٧ خطوات. من عليه الاندماج، وأي قانون ينطبق عليه، وأي امتحانات ستؤدّيها — مع ذكر المصادر.',
      articleHtml: `
<p>هل أنت جديد في هولندا؟ إذن ستتعامل على الأرجح مع الاندماج (inburgering). ستتعلّم الهولندية،
وستُظهر أنك تعرف كيف تسير الأمور في هولندا.</p>

<p>يثير الاندماج أسئلة كثيرة. ما الذي عليك فعله بالضبط؟ ومن يقرّر ماذا؟ ومن أين يبدأ الأمر؟</p>

<p>تشرح هذه الصفحة المسار كاملًا في ٧ خطوات. من أول رسالة من DUO حتى شهادتك، بلغة بسيطة وبدون
مصطلحات صعبة.</p>

${docentIn('ar', 'قد يبدو الاندماج معقّدًا بسبب كثرة المعلومات والقواعد. لذلك جمعت لك كل شيء في دليل واحد واضح خطوة بخطوة، مع جدول زمني وأهم القواعد.')}

<div class="article-toc">
  <p class="article-toc-title">في هذه الصفحة</p>
  <ol>
    <li><a href="#wat-is-inburgering">ما هو الاندماج؟</a></li>
    <li><a href="#moet-ik-inburgeren">هل يجب عليّ الاندماج؟</a></li>
    <li><a href="#welke-wet">أي قانون ينطبق عليك؟</a></li>
    <li><a href="#stappenplan">المسار في ٧ خطوات</a></li>
  </ol>
</div>

<h2 id="wat-is-inburgering">ما هو الاندماج؟</h2>

<p>الاندماج يعني أن تتعلّم كيف تشارك في المجتمع الهولندي. والحكومة تتوقّع منك أمرين أساسًا:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_TAAL}</div>
    <h3>أن تتعلّم الهولندية</h3>
    <p>لتتمكّن مثلًا من العمل، وزيارة الطبيب، والتحدّث مع مدرسة أطفالك.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_NL}</div>
    <h3>أن تتعرّف على طريقة عمل هولندا</h3>
    <p>كيف تبحث عن عمل، وكيف يعمل التأمين الصحي، وما القواعد والقيم المهمة هنا.</p>
  </div>
</div>

<p>وعندما تُنهي مسار الاندماج تحصل على <strong>شهادة الاندماج</strong>
(inburgeringsdiploma). وغالبًا ما تحتاج إلى هذه الشهادة لاحقًا إذا أردت طلب إقامة دائمة أو
الحصول على الجنسية الهولندية.</p>

<p>فالاندماج إذن لا يتعلّق بمدى ذكائك، بل بأن تتعلّم اللغة وتستطيع تدبّر أمورك بنفسك في
هولندا.</p>

<h2 id="moet-ik-inburgeren">هل يجب عليّ الاندماج؟</h2>

<p>ليس كل من يأتي إلى هولندا ملزَمًا بالاندماج. وما إذا كنت ملزَمًا يعتمد أساسًا على جنسيتك
وعلى سبب قدومك إلى هنا.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">عادةً عليك الاندماج إذا كنت</p>
    <ul>
      <li>${I_CHECK}<span><strong>حاصلًا على حق اللجوء</strong>: مُنحت تصريح إقامة بعد طلب لجوء</span></li>
      <li>${I_CHECK}<span><strong>مهاجر لَمّ شمل</strong>: قدمت للعيش مع شريكك أو عائلتك في هولندا</span></li>
      <li>${I_CHECK}<span>حصلت على تصريح إقامة <strong>لسبب آخر</strong> وأنت من خارج الاتحاد الأوروبي</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">عادةً لا يجب عليك إذا كنت</p>
    <ul>
      <li>${I_X}<span>من دولة في <strong>الاتحاد الأوروبي</strong>، أو من النرويج أو آيسلندا أو ليختنشتاين أو سويسرا</span></li>
      <li>${I_X}<span>في هولندا <strong>بشكل مؤقت</strong> للعمل أو الدراسة</span></li>
      <li>${I_X}<span>دون ١٨ عامًا، أو ما زلت ملزَمًا بالذهاب إلى المدرسة بموجب التعليم الإلزامي أو التزام المؤهل</span></li>
      <li>${I_X}<span>بلغت بالفعل <strong>سنّ التقاعد</strong></span></li>
      <li>${I_X}<span>عشت في هولندا ٨ سنوات أو أكثر خلال سنّ التعليم الإلزامي</span></li>
      <li>${I_X}<span>تحمل <strong>شهادات هولندية</strong> معيّنة</span></li>
    </ul>
  </div>
</div>

${factIn('ar', 'هل تحمل شهادة هولندية من نوع vmbo أو havo أو vwo أو mbo من المستوى ٢ فما فوق؟ أو شهادة hbo أو جامعية دُرِست بالهولندية؟ عندها لا يجب عليك الاندماج في الغالب.', 'inburgeren.nl — Diploma gehaald', SRC_DIPLOMA_VRIJ, CHECKED)}

<p><strong>غير متأكد؟</strong> لست مضطرًا لمعرفة ذلك بنفسك. فإذا كان عليك الاندماج، تصل المعلومة
إلى DUO، وترسل إليك رسالة تفيد بأنك ملزَم بالاندماج. وتلك هي الخطوة الأولى.</p>

<h3>‏Vrijstelling وontheffing</h3>

<p>كلمتا <strong>vrijstelling</strong> (إعفاء) و<strong>ontheffing</strong> (إسقاط الالتزام)
كثيرًا ما تسبّبان الالتباس. وهما لا تعنيان الشيء نفسه.</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_SHIELD}</div>
    <h3>Vrijstelling</h3>
    <p>أنت مندمج بالقدر الكافي بالفعل. مثلًا لأنك تحمل شهادة هولندية أو تلقّيت تعليمًا باللغة الهولندية.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_HEART}</div>
    <h3>Ontheffing</h3>
    <p>لا تستطيع فعلًا بلوغ المستوى المطلوب، بسبب مرض أو إعاقة مثلًا. وهذا الوضع دائم.</p>
  </div>
</div>

<p>تتقدّم بطلب الـvrijstelling أو الـontheffing بنفسك إلى DUO. ويمكن لبلديتك أن تقدّم لك
المشورة في ذلك.</p>

<h2 id="welke-wet">أي قانون ينطبق عليك؟</h2>

<p>هذا مهم، لأن هناك قانونين قائمين جنبًا إلى جنب. ولكلٍّ منهما قواعد مختلفة وامتحانات مختلفة.</p>

<div class="article-table-wrap">
<table>
  <thead>
    <tr><th></th><th>Wet inburgering 2013</th><th>Wet inburgering 2021</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>لمن</strong></td><td>بدأ التزامك قبل ١ يناير ٢٠٢٢</td><td>بدأ التزامك في ١ يناير ٢٠٢٢ أو بعده</td></tr>
    <tr><td><strong>من يدبّر الأمر</strong></td><td>تدبّر كل شيء بنفسك</td><td>البلدية ترافقك</td></tr>
    <tr><td><strong>المستوى اللغوي</strong></td><td>A2</td><td>‏B1 عادةً</td></tr>
    <tr><td><strong>إلى جانب اللغة</strong></td><td>KNM وONA وPVT</td><td>KNM وMAP وPVT</td></tr>
  </tbody>
</table>
</div>

${factIn('ar', 'اسم قانون Wet inburgering 2021 يحمل سنة ٢٠٢١، لكنه لا يسري إلا اعتبارًا من ١ يناير ٢٠٢٢. وإذا كان عليك البدء قبل ذلك، فأنت تخضع للقانون الأقدم لعام ٢٠١٣.', 'rijksoverheid.nl — Nieuwe Wet inburgering', SRC_WET, CHECKED)}

<p>لذا تحقّق أولًا من رسالتك من DUO لمعرفة أي قانون ينطبق عليك. وبقية هذه الصفحة تتناول
<strong>Wet inburgering 2021</strong>، لأنه ينطبق على جميع من يبدأون الآن تقريبًا.</p>

<h2 id="stappenplan">المسار في ٧ خطوات</h2>

<div class="guide-steps">

<div class="guide-step">
  <div class="guide-step-num">١</div>
  <div class="guide-step-body">
    <h3>تصلك رسالة من DUO</h3>
    <p>تسجّل نفسك لدى البلدية في سجل السكان (BRP). عندها تتحقّق DUO مما إذا كان عليك الاندماج.</p>
    <p>هل عليك ذلك؟ إذن تصلك رسالة تفيد بأنك ملزَم بالاندماج وتوضّح ما عليك فعله الآن.</p>
    <p><strong>احتفظ بهذه الرسالة جيدًا.</strong> ستحتاج إليها لاحقًا.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">٢</div>
  <div class="guide-step-body">
    <h3>المقابلة الشاملة في البلدية</h3>
    <p>تدعوك بلديتك إلى <strong>المقابلة الشاملة</strong> (brede intake): حديث واختبار قصير.
    وهي تعارف، وليست امتحانًا.</p>
    <p>تريد البلدية أن تعرف من أنت وما الذي تحتاجه. وسيدور الحديث حول:</p>
    <ul>
      <li>التعليم الذي تلقّيته</li>
      <li>العمل الذي مارسته</li>
      <li>حالتك الصحية</li>
      <li>وضعك الشخصي، مثل أطفالك</li>
    </ul>
    <p>وستؤدّي أيضًا <strong>اختبار القابلية للتعلّم</strong> (leerbaarheidstoets). وهو يقيس
    مدى سهولة تعلّمك للغة جديدة، لتتمكّن البلدية من اختيار المسار التعليمي المناسب لك.</p>
    <p><strong>نصيحة:</strong> اصطحب معك شخصًا يجيد الهولندية أو لغتك. ويمكنك أيضًا طلب مترجم.</p>
    ${docentIn('ar', `لا تخف من اختبار القابلية للتعلّم. فهو ليس امتحانًا تنجح فيه أو ترسب. إنه ينظر فقط في مدى سهولة تعلّمك للغة جديدة، وتؤدّيه على الحاسوب. ولا حاجة إلى التحضير. هل تريد أن تعتاد على النظام مسبقًا؟ يمكنك ذلك في <a href="${SRC_LBT_OEFEN}" target="_blank" rel="noopener">بيئة التدريب الرسمية التابعة لـDUO</a>.`)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">٣</div>
  <div class="guide-step-body">
    <h3>يُعتمد الـPIP الخاص بك</h3>
    <p>بعد المقابلة الشاملة تُعدّ البلدية الـ<strong>PIP</strong> الخاص بك: الخطة الشخصية
    للاندماج والمشاركة.</p>
    <p>يوضّح الـPIP المسار التعليمي الذي ستتبعه، والدعم الذي تقدّمه لك البلدية، ومدى كثافة
    برنامجك.</p>
    ${factIn('ar', 'على البلدية اعتماد الـPIP في موعد أقصاه ١٠ أسابيع من رسالة DUO. ولم تكن مسجَّلًا لدى البلدية حينها؟ عندها تُحتسب الأسابيع العشرة من تاريخ تسجيلك. وإذا احتاجت البلدية إلى طلب معلومات من جهات أخرى أولًا، فقد يستغرق الأمر وقتًا أطول قليلًا.', 'Besluit inburgering 2021, artikel 5.3', SRC_PIP, CHECKED)}
    <p><strong>تاريخ الـPIP مهم.</strong> فمدة اندماجك تبدأ في اليوم التالي للتاريخ المدوّن على
    الوثيقة.</p>
    ${factIn('ar', 'أمامك ٣ سنوات للوفاء بالتزام الاندماج. وتبدأ المدة في اليوم التالي لتاريخ الـPIP.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}
    <p>هل لا توافق على الـPIP؟ يمكنك تقديم اعتراض. والرسالة المرفقة بالـPIP توضّح كيفية ذلك.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">٤</div>
  <div class="guide-step-body">
    <h3>تحصل على مسار تعليمي</h3>
    <p>هناك ثلاثة مسارات تعليمية. والبلدية تحدّد المسار المناسب لك بناءً على المقابلة الشاملة
    واختبار القابلية للتعلّم.</p>
    <div class="theme-section">
      <p class="theme-title">مسار B1 — لمعظم الناس</p>
      <p>هذا هو المسار القياسي. تؤدّي الامتحانات على مستوى B1 وتُنهيه بشهادة. وهل مستوى B1 بعيد
      المنال فعلًا؟ عندها يمكنك ضمن شروط الانتقال إلى امتحانات على مستوى A2.</p>
    </div>
    <div class="theme-section">
      <p class="theme-title">مسار التعليم — للشباب غالبًا</p>
      <p>يُعدّك هذا المسار لمتابعة الدراسة. تبلغ المستوى B1 أو B2 ثم تنتقل إلى mbo أو hbo أو
      الجامعة.</p>
    </div>
    <div class="theme-section">
      <p class="theme-title">مسار Z — إذا كان B1 أو A2 صعبًا جدًا</p>
      <p>الهدف هو المستوى A1. وتُنهيه بمقابلة ختامية في البلدية، لا بامتحان مركزي. وإن بلغت A2
      رغم ذلك، فيمكنك أداء الامتحانات.</p>
    </div>
    ${factIn('ar', 'الانتقال من B1 إلى A2 ممكن في مسار B1 وحده. وعليك عندها أن تكون قد حضرت ٦٠٠ ساعة دراسية على الأقل في مدرسة حاصلة على علامة جودة، وأن تُظهر أنك بذلت جهدك.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}
    ${factIn('ar', 'هل أنت حاصل على حق اللجوء؟ عندها يتكوّن مسار Z من ٨٠٠ ساعة دراسية (اللغة وKNM)، و٨٠٠ ساعة مشاركة وتفعيل، ومقابلة ختامية. وهل أنت مهاجر لَمّ شمل؟ عندها هي ٨٠٠ ساعة دراسية ومقابلة ختامية.', 'Besluit inburgering 2021, artikel 3.14', SRC_ZROUTE, CHECKED)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">٥</div>
  <div class="guide-step-body">
    <h3>تحضر الدروس وتشارك</h3>
    <p>الآن يبدأ العمل الحقيقي: دروس اللغة. وإلى جانبها تندرج هذه الأجزاء ضمن اندماجك:</p>
    <div class="guide-cards">
      <div class="guide-card">
        <div class="guide-card-icon">${I_CAP}</div>
        <h3>KNM</h3>
        <p><strong>المعرفة بالمجتمع الهولندي.</strong> تتعلّم كيف تسير الأمور في هولندا، من العمل والدخل إلى السكن والرعاية الصحية. وKNM جزء من كل المسارات التعليمية.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_PEN}</div>
        <h3>PVT</h3>
        <p><strong>برنامج إعلان المشاركة.</strong> دورة قصيرة عن القيم الهولندية الأساسية: الحرية والمساواة والتضامن والمشاركة. وتُنهيها بالتوقيع على إعلان المشاركة.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_WORK}</div>
        <h3>MAP</h3>
        <p><strong>وحدة سوق العمل والمشاركة.</strong> تتعلّم كيف تبحث عن عمل في هولندا: التقديم على الوظائف، وسيرتك الذاتية، وكيف يعمل سوق العمل. وMAP يخصّ مسار B1 ومسار Z.</p>
      </div>
    </div>
    ${factIn('ar', 'يتناول KNM ثمانية محاور: العمل والدخل · آداب التعامل والقيم والأعراف · السكن · الصحة والرعاية الصحية · التاريخ والجغرافيا · المؤسسات · نظام الدولة وسيادة القانون · التعليم والتربية.', 'Regeling inburgering 2021 — eindtermen KNM (Stcrt. 2024, 15802)', SRC_KNM, CHECKED)}
    <div class="guide-cta-inline">
      <p><strong>اختبر مستواك مجانًا</strong>هل تريد معرفة مستواك في الهولندية؟ قم بامتحان تجريبي مجاني. بدون حساب.</p>
      <a class="guide-cta-btn" href="/ar/oefenen">ابدأ مجانًا ${I_ARROW}</a>
    </div>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">٦</div>
  <div class="guide-step-body">
    <h3>تؤدّي الامتحانات</h3>
    <p>هل تتبع مسار B1 أو مسار التعليم؟ عندها تؤدّي خمسة امتحانات لدى DUO:</p>
    <div class="article-table-wrap">
    <table>
      <thead><tr><th>الامتحان</th><th>ما تفعله</th></tr></thead>
      <tbody>
        <tr><td><strong>القراءة</strong></td><td>قراءة نصوص والإجابة عن أسئلة</td></tr>
        <tr><td><strong>الاستماع</strong></td><td>فهم مقاطع مصوّرة وصوتية</td></tr>
        <tr><td><strong>الكتابة</strong></td><td>كتابة نصوص قصيرة</td></tr>
        <tr><td><strong>المحادثة</strong></td><td>تسجيل إجاباتك أمام الحاسوب</td></tr>
        <tr><td><strong>KNM</strong></td><td>أسئلة عن المجتمع الهولندي</td></tr>
      </tbody>
    </table>
    </div>
    <p>تؤدّي الامتحانات اللغوية على مستوى B1. وإن لم ينجح ذلك، فيمكنك في مسار B1 أداء امتحانات
    على مستوى A2 ضمن شروط (انظر الخطوة ٤).</p>
    <p>تسجّل عبر <strong>Mijn Inburgering</strong>، موقع DUO. ولست مضطرًا لأداء جميع الامتحانات
    دفعةً واحدة. ومعظم الناس يوزّعونها على عدة أشهر.</p>
    ${factIn('ar', 'تؤدّي امتحانات المعرفة والامتحانات اللغوية على مستوى A2 في واحد من ستة مراكز امتحان: أمستردام أو آيندهوفن أو رايسفايك أو روتردام أو أوتريخت أو زفوله. أما امتحانات B1 أو B2 فهي staatsexamen NT2 ولها مراكزها الخاصة.', 'inburgeren.nl — Examenplaatsen', SRC_LOCATIES, CHECKED)}
    ${docentIn('ar', 'ألاحظ في دروسي أن معظم الدارسين يجدون القراءة والاستماع أسهل، بينما تكون الكتابة والمحادثة أصعب عليهم غالبًا. لذا ابدأ بالقراءة أو الاستماع، ووزّع وقتك جيدًا. ويُفضَّل ألا تحدّد أكثر من امتحان في يوم واحد — هكذا تحافظ على طاقتك.')}
    <p>هل تريد معرفة شكل كل جزء لغوي بالضبط؟ اقرأ:
    <a href="/ar/blog/inburgeringsexamen-a2-uitleg">امتحان الاندماج A2: شرح الأجزاء اللغوية الأربعة</a>.
    وهل أنت متردّد بشأن المستوى؟ اقرأ:
    <a href="/ar/blog/taalniveaus-a1-a2-b1-nederlands">الفرق بين A1 وA2 وB1</a>.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">٧</div>
  <div class="guide-step-body">
    <h3>شهادتك، وما يأتي بعدها</h3>
    <p>هل نجحت في جميع الأجزاء؟ عندها تحصل على <strong>شهادة الاندماج</strong>. ويمكنك تنزيلها
    من Mijn Diploma's لدى DUO.</p>
    <p>وبهذه الشهادة يمكنك لاحقًا طلب إقامة دائمة، أو التجنّس: أي الحصول على الجنسية الهولندية.</p>
    ${factIn('ar', 'تصل نتيجة امتحان المعرفة أو الامتحان اللغوي على مستوى A2 عادةً خلال ٨ أسابيع. أما الكتابة A2 والمحادثة A2 فتستغرق DUO حاليًا وقتًا أطول: حتى ١٦ أسبوعًا (إشعار بتاريخ ٣١ يوليو ٢٠٢٦). وإذا عرّضك ذلك لضيق الوقت في مدتك، تحصل تلقائيًا على ٦ أشهر إضافية.', 'inburgeren.nl — nieuwsbericht 31-07-2026', SRC_UITSLAG, CHECKED)}
    <p><strong>رسبت في جزء؟</strong> ليست هذه النهاية. تعيد ذلك الجزء وحده؛ وما اجتزته يبقى
    محفوظًا. اقرأ هنا ما عليك ترتيبه:
    <a href="/ar/blog/inburgeringsexamen-zakken-herkansen">رسبت في امتحان الاندماج؟ إليك ما يحدث الآن</a>.</p>
  </div>
</div>

</div>

<h2 id="begin-met-oefenen">ابدأ التدريب اليوم</h2>

<p>امتحان الاندماج في المتناول تمامًا إذا عرفت ما الذي ينتظرك. وكثيرون يرسبون لا لأن لغتهم
الهولندية ضعيفة، بل لأنهم لا يعرفون شكل الامتحان.</p>

<p>على هذا الموقع تتدرّب على امتحانات بصيغة DUO الحقيقية، من إعداد مُدرِّسة NT2 معتمدة. ليست
أسئلة من حاسوب، بل من واقع التدريس.</p>

${docentIn('ar', 'أعددت هذه الامتحانات التجريبية لأن الأماكن التي تحصل فيها على ملاحظات شخصية ما زالت قليلة. والملاحظات مهمة خصوصًا في المحادثة والكتابة. على هذا الموقع تحصل على ملاحظات فورية على ما تكتبه وتقوله، استنادًا إلى نموذج التقييم الذي وضعته — وأنا أراجع التقييمات بنفسي. وهذا ما يجعل هذه الامتحانات مختلفة.')}

<div class="info-box">
  <p>تتغيّر قواعد الاندماج بانتظام. وللاطّلاع على المعلومات الرسمية والمحدَّثة، راجع دائمًا
  <a href="https://www.inburgeren.nl" target="_blank" rel="noopener">inburgeren.nl</a> و
  <a href="https://www.rijksoverheid.nl" target="_blank" rel="noopener">rijksoverheid.nl</a>.
  هذه الصفحة للشرح فقط وليست استشارة قانونية.</p>
</div>
`,
      sidebarHtml: '',
      ctaTitle: 'اعرف أين أنت الآن',
      ctaDesc: 'عشرة أسئلة لكل مهارة، مع شرح بعد كل إجابة. بدون حساب.',
      ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
      faq: [
        {
          q: 'كم تستغرق عملية الاندماج؟',
          a: 'أمامك ٣ سنوات. وتبدأ المدة في اليوم التالي لتاريخ الـPIP. أما المدة الفعلية فتختلف من شخص لآخر: بعضهم ينتهي خلال سنة، وآخرون يحتاجون السنوات الثلاث كاملة.',
        },
        {
          q: 'ما المستوى اللغوي الذي عليّ بلوغه؟',
          a: 'في ظل قانون Wet inburgering 2021 هو B1 عادةً. وإن لم ينجح B1، فيمكنك في مسار B1 أداء امتحانات على مستوى A2 ضمن شروط. وفي مسار Z يكون الهدف A1. وإن كنت تخضع للقانون الأقدم لعام ٢٠١٣، فالمستوى هو A2.',
        },
        {
          q: 'ما الفرق بين الاندماج والتجنّس؟',
          a: 'الاندماج هو الالتزام بتعلّم الهولندية والتعرّف على هولندا. أما التجنّس فهو طلب الحصول على الجنسية الهولندية. وتحتاج إلى شهادة الاندماج إن أردت التجنّس، لكنهما ليسا الشيء نفسه.',
        },
        {
          q: 'هل يجب عليّ أداء امتحان KNM؟',
          a: 'يندرج KNM ضمن جميع المسارات التعليمية في ظل قانون ٢٠٢١. ففي مسار B1 ومسار التعليم تؤدّي امتحان KNM؛ وفي مسار Z تحضر دروسًا عنه. والأسئلة تتناول ثمانية محاور، من العمل والدخل إلى نظام الدولة.',
        },
        {
          q: 'هل يمكنني اختيار مساري التعليمي بنفسي؟',
          a: 'ليس تمامًا. البلدية تحدّد مسارك التعليمي بناءً على المقابلة الشاملة واختبار القابلية للتعلّم. ولا توافق؟ عندها يمكنك تقديم اعتراض على الـPIP. والرسالة المرفقة به توضّح كيفية ذلك.',
        },
        {
          q: 'أين يمكنني التدرّب مجانًا لامتحان الاندماج؟',
          a: 'لدى DUO عدد من الامتحانات التجريبية على inburgeren.nl. وإن أردت التدرّب أكثر، فهذا الموقع يوفّر امتحانات تجريبية مجانية للقراءة والاستماع والكتابة والمحادثة — مع شرح لكل سؤال.',
        },
      ],
    },
  },
};

export default guide;
