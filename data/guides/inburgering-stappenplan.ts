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
    ${fact('Overstappen van B1 naar A2 kan alleen in de B1-route. Je moet dan minstens 600 uur taalles hebben gevolgd bij een school met een keurmerk, en laten zien dat je je best hebt gedaan.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}
    ${fact('Ben je asielstatushouder? Dan bestaat de Z-route uit 800 uur les (taal en KNM), 800 uur meedoen en activering, en een eindgesprek. Ben je gezinsmigrant? Dan zijn het 800 uur les en een eindgesprek.', 'Besluit inburgering 2021, artikel 3.14', SRC_ZROUTE, CHECKED)}
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

  related: [],
  relatedPosts: [
    'inburgeringsexamen-a2-uitleg',
    'taalniveaus-a1-a2-b1-nederlands',
    'inburgeringsexamen-zakken-herkansen',
  ],

  ctaTitle: 'Kijk waar je nu staat',
  ctaDesc: 'Tien vragen per onderdeel, met uitleg bij elk antwoord. Geen account nodig.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis oefenexamen',
};

export default guide;
