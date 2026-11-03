/**
 * M2's pillar: "Inburgeren: wat is het en hoe werkt het?" (slug `inburgering-stappenplan`).
 *
 * **Nederlandse tekst: herschrijving van 03-11-2026, wacht op de review van de docent.** De
 * pagina stond vijf weken op positie ~57 voor "inburgeren" en "wat is inburgeren" en concurreerde
 * met `moet-ik-inburgeren` om dezelfde query's. De herschrijving maakt dit dé pagina voor
 * "inburgeren" / "wat is inburgeren" / "hoe lang mag je doen over inburgeren" en laat "wie moet
 * inburgeren" aan de spoke; de ja/nee-tabel en vrijstelling/ontheffing zijn daarom verhuisd naar
 * één link. Nieuw zijn twee demonstraties in plaats van beschrijving: een eigen schrijfopdracht in
 * examenvorm met een goed antwoord, en één bericht op A1, A2 en B1. Beide zijn van de redactie en
 * staan in `seo-agent/briefs/2026-11-03-stappenplan-herschrijving.md` ter controle; de docent kan
 * ze vervangen door een voorbeeld uit haar eigen les. `reviewedOn` wordt pas bijgezet als zij de
 * tekst heeft goedgekeurd; tot die tijd gaat deze versie niet samen naar `main`.
 *
 * De oorspronkelijke tekst is het manuscript van de eigenaar van 19-08-2026, regel voor regel
 * gecontroleerd tegen de bronnen in `SEO/facts.md` §10 (KNM heeft 8 thema's, niet 7;
 * "praktijkonderwijs" staat op geen vrijstellingslijst; de PIP-verlenging is geen "12 weken"; de
 * Z-route-uren 800+800 gelden alleen voor asielstatushouders; de 16-weken-uitslag is echt, maar
 * alleen voor Schrijven/Spreken A2 en gedateerd). Nieuwe feiten komen uit §1, §4 en §11 en dragen
 * de datum van dié verificatie. Niets uit `facts.md` §9 staat op de pagina.
 *
 * **De Engelse en Arabische tekst zijn nog de versie van 20-08-2026** en volgen pas als de
 * Nederlandse herschrijving is goedgekeurd; een concept twee keer vertalen is dubbel werk.
 *
 * The visual vocabulary (`.docent-note`, `.guide-steps`, `.guide-cards`, `.compare-2`,
 * `.route-grid`, `.termijn`, `.guide-cta-inline`) is defined in `app/globals.css` under
 * "Kennisgids visual elements". Icons are inline lucide paths, no emoji (project rule).
 */
import type { Guide } from './types';
import { fact } from './types';
import { docentIn, factIn, factTwo, factTwoIn, figure } from './kit';

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
const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
const SRC_ROUTES = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
const SRC_EXTRA_TIJD = 'https://www.inburgeren.nl/extra-tijd/';
const SRC_KOSTEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
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

const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;
/* Een Nederlands voorbeeld in de Arabische tekst: de inhoud blijft LTR, anders staat "1." achter de zin. */
const rowNl = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key" dir="ltr">${key}</p><p class="compare-val" dir="ltr">${val}</p></div>`;

const docent = (text: string) =>
  `<div class="docent-note"><img src="/images/amber-van-der-zalm-264.webp" alt="" width="44" height="44" class="docent-note-avatar" loading="lazy" />` +
  `<div><p class="docent-note-name">Amber van der Zalm · NT2-docent</p><p>${text}</p></div></div>`;

const guide: Guide = {
  slug: 'inburgering-stappenplan',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Amber van der Zalm',
  reviewedOn: '2026-08-19',
  pillar: true,
  coverGlyph: 'steps',

  title: 'Inburgeren: wat is het en hoe werkt het? Stappenplan',
  description:
    'Wat is inburgeren, hoe lang mag je erover doen en welke stappen doorloop je? Het hele traject uitgelegd, met een voorbeeldopdracht uit het examen en tijdlijn.',

  datePublished: '2026-08-19',
  dateModified: '2026-08-19',
  dateLabel: '19 augustus 2026',
  breadcrumb: 'Stappenplan',
  eyebrow: 'Stappenplan',

  heroTitle: 'Inburgeren: wat is het en hoe werkt het?',
  heroSubtitle:
    'Nederlands leren, laten zien dat je Nederland kent, en dat binnen 3 jaar. Zo ziet inburgeren eruit, van de brief van DUO tot je diploma. Met een echte voorbeeldopdracht.',
  heroImage: {
    base: 'inburgering-stappenplan',
    hasWebp: false,
    alt: 'Een Amsterdamse gracht met woonboten en grachtenpanden',
    position: 'center 55%',
    credit: 'Wagner Rech (Pexels)',
  },
  readingMinutes: 10,

  articleHtml: `
<p><strong>Inburgeren</strong> betekent dat je Nederlands leert en laat zien dat je weet hoe
Nederland werkt. Je doet daarvoor examens bij DUO. Haal je alles, dan krijg je een
inburgeringsdiploma.</p>

<p>Het traject begint met een brief van DUO en eindigt met dat diploma. Je hebt er 3 jaar voor.
Op deze pagina zie je wat inburgeren precies is, hoe het examen eruitziet en welke stappen je
doorloopt.</p>

<div class="article-toc">
  <p class="article-toc-title">Op deze pagina</p>
  <ol>
    <li><a href="#wat-is-inburgeren">Wat is inburgeren?</a></li>
    <li><a href="#voorbeeldopdracht">Zo ziet het examen eruit: één opdracht</a></li>
    <li><a href="#welk-niveau">Welk niveau moet je halen? A1, A2 en B1 naast elkaar</a></li>
    <li><a href="#hoe-lang">Hoe lang mag je doen over inburgeren?</a></li>
    <li><a href="#stappenplan">Het stappenplan in 7 stappen</a></li>
    <li><a href="#kosten">Wat kost inburgeren?</a></li>
  </ol>
</div>

<h2 id="wat-is-inburgeren">Wat is inburgeren?</h2>

<p>De overheid verwacht twee dingen van je:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_TAAL}</div>
    <h3>Je leert Nederlands</h3>
    <p>Genoeg om te werken, naar de dokter te gaan en met de school van je kinderen te praten.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_NL}</div>
    <h3>Je leert hoe Nederland werkt</h3>
    <p>Hoe je werk zoekt, hoe de zorgverzekering werkt en welke regels en waarden hier belangrijk zijn.</p>
  </div>
</div>

<p>Je laat dat zien met examens: 4 taalexamens (Lezen, Luisteren, Schrijven en Spreken) en het
examen KNM, Kennis van de Nederlandse Maatschappij. Daarnaast volg je een paar korte
onderdelen bij de gemeente. Die staan in stap 5.</p>

<p>Inburgeren is geen test van hoe slim je bent. Het is een vaste vorm, en die vorm kun je leren.
Wie zakt, zakt meestal niet door slecht Nederlands, maar omdat niemand de vorm heeft laten
zien. Daarom laten we hem hieronder zien.</p>

<p>Of jíj moet inburgeren, hangt af van je nationaliteit en je verblijfsvergunning. Dat lees je
op <a href="/nl/inburgering/moet-ik-inburgeren">Moet ik inburgeren?</a>. Deze pagina gaat over
wat er daarna komt.</p>

<h2 id="voorbeeldopdracht">Zo ziet het examen eruit: één opdracht</h2>

<p>Dit is een schrijfopdracht zoals je die in het examen Schrijven A2 krijgt. Eerst de opdracht,
daarna een antwoord dat goed is. De opdracht is van ons, in de vorm van het examen. De echte
examenvragen zijn geheim.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>De opdracht</h3><p class="compare-when">Schrijven A2, opdracht in de vorm van een e-mail</p></div>
    <div class="compare-rows">
      ${row('Situatie', 'Je dochter Sara is ziek. Ze kan morgen niet naar school. Schrijf een e-mail aan haar juf, mevrouw De Boer.')}
      ${row('Schrijf in je e-mail', '1. dat Sara ziek is<br>2. wat ze heeft<br>3. wanneer ze weer naar school komt')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>Een goed antwoord</h3><p class="compare-when">Alle 3 de punten staan erin, in korte zinnen</p></div>
    <div class="compare-rows">
      ${row('E-mail', 'Beste mevrouw De Boer,<br><br><strong>Sara is ziek.</strong> <strong>Ze heeft koorts en keelpijn.</strong> Daarom kan ze morgen niet naar school. <strong>Ik denk dat ze donderdag weer komt.</strong><br><br>Met vriendelijke groet,<br>Fatima Yilmaz')}
      ${row('Waarom dit goed is', 'Punt 1, 2 en 3 staan er allemaal in (dikgedrukt). De zinnen zijn kort. Er is een aanhef en een groet. Meer hoeft niet.')}
    </div>
  </div>
</div>

<p>Let op wat hier níét staat: geen lange zinnen, geen moeilijke woorden. Bij elke opdracht
staat wat je moet schrijven. Schrijf je alle punten op, in zinnen die te begrijpen zijn, dan
doe je wat er gevraagd wordt.</p>

${fact('Het examen Schrijven A2 maak je met pen en papier. Je krijgt 4 schrijfopdrachten in 40 minuten, bijvoorbeeld een korte brief of een formulier. Schrijven wordt nagekeken door beoordelaars, niet door de computer.', 'inburgeren.nl — Taalexamens A2, B1 en B2 · Examenreglement, artikel 10', SRC_TAALEXAMENS, '28-07-2026')}

<p>Lezen en Luisteren zijn meerkeuzevragen op de computer. Bij Spreken spreek je antwoorden in.
Elk onderdeel heeft zo zijn eigen vorm. Wil je ze alle vier zien? Lees
<a href="/nl/taalexamens/taalexamens-a2-b1">De taalexamens A2 en B1 uitgelegd</a>.</p>

<div class="guide-cta-inline">
  <p><strong>Probeer het zelf</strong>Doe 10 vragen Lezen of Luisteren, met uitleg bij elk antwoord. Je hebt geen account nodig.</p>
  <a class="guide-cta-btn" href="/nl/oefenen">Start gratis ${I_ARROW}</a>
</div>

<h2 id="welk-niveau">Welk niveau moet je halen? A1, A2 en B1 naast elkaar</h2>

<p>Je hoort steeds A1, A2 en B1. Dat zijn taalniveaus. Hoe verschillen ze? Hier is één bericht,
3 keer geschreven. Iemand zegt een afspraak bij de huisarts af.</p>

<div class="route-grid">
  <div class="route-card r-z">
    <div class="route-accent"></div>
    <div class="route-top"><h3>Zo klinkt A1</h3><span class="route-level">A1</span></div>
    <div class="route-rows">
      ${row('Het bericht', 'Hallo. Ik ben ziek. Ik kom niet. Morgen nieuwe afspraak?')}
      ${row('Wat je ziet', 'Losse, korte zinnen. Het is te begrijpen, maar meer niet.')}
      ${row('Wie dit niveau haalt', 'De Z-route. Je sluit af met een gesprek bij de gemeente.')}
    </div>
  </div>
  <div class="route-card">
    <div class="route-accent"></div>
    <div class="route-top"><h3>Zo klinkt A2</h3><span class="route-level">A2</span></div>
    <div class="route-rows">
      ${row('Het bericht', 'Goedemorgen. Ik heb vandaag om 10 uur een afspraak. Ik ben ziek en kan niet komen. Kan ik een nieuwe afspraak maken?')}
      ${row('Wat je ziet', 'Hele zinnen. Je zegt wat er is en wat je wilt. Simpel, maar compleet.')}
      ${row('Wie dit niveau haalt', 'Wie onder de Wet 2013 valt, of in de B1-route mag afschalen.')}
    </div>
  </div>
  <div class="route-card r-onderwijs">
    <div class="route-accent"></div>
    <div class="route-top"><h3>Zo klinkt B1</h3><span class="route-level">B1</span></div>
    <div class="route-rows">
      ${row('Het bericht', 'Goedemorgen. Ik heb vanochtend om 10.00 uur een afspraak bij dokter De Vries, maar ik heb sinds gisteren koorts. Daarom kan ik helaas niet komen. Kan ik de afspraak verzetten naar volgende week, het liefst in de ochtend?')}
      ${row('Wat je ziet', 'Je legt uit waarom, en je zegt wat je het liefst wilt. Met woorden als "daarom" en "helaas".')}
      ${row('Wie dit niveau haalt', 'De B1-route, de standaardroute onder de Wet 2021.')}
    </div>
  </div>
</div>

<p>Alle 3 de berichten doen hetzelfde: de afspraak is afgezegd. Het verschil zit in hoe veel je
kunt uitleggen. Dat is ook wat het examen meet.</p>

${fact('Onder de Wet inburgering 2021 zijn er 3 leerroutes. De B1-route: je doet binnen 3 jaar de taalexamens op niveau B1. De onderwijsroute: vooral voor jongeren, naar mbo, hbo of universiteit, op B1 of B2. De Z-route: je leert Nederlands op niveau A1 en sluit af met een gesprek bij de gemeente. De gemeente kiest de route, op basis van de brede intake.', 'inburgeren.nl — U gaat inburgeren', SRC_ROUTES, CHECKED)}

<p>Welke route jij krijgt, staat in je PIP (stap 3). Wil je het verschil tussen de niveaus
preciezer weten? Lees <a href="/nl/blog/taalniveaus-a1-a2-b1-nederlands">het verschil tussen A1,
A2 en B1</a>.</p>

<h2 id="hoe-lang">Hoe lang mag je doen over inburgeren?</h2>

<p><strong>3 jaar.</strong> De klok start op de dag na de datum op je PIP, het plan dat de
gemeente voor je maakt. Niet op de dag dat je in Nederland aankomt, en niet op de dag van de
brief van DUO.</p>

<div class="termijn">
  <div class="termijn-ends">
    <div class="termijn-end"><strong>Start</strong>de dag na de datum van je PIP</div>
    <div class="termijn-end"><strong>Einde</strong>alle examens en onderdelen klaar</div>
  </div>
  <div class="termijn-bar">
    <div class="termijn-seg">Jaar 1</div>
    <div class="termijn-seg s2">Jaar 2</div>
    <div class="termijn-seg s3">Jaar 3</div>
    <div class="termijn-seg s-extra">Extra tijd?</div>
  </div>
  <p class="termijn-note">In die 3 jaar moet alles klaar zijn: de taalexamens, KNM, PVT en MAP. Je
  hoeft de examens niet tegelijk te doen. De meeste mensen spreiden ze over een paar maanden.</p>
</div>

${fact('Je hebt 3 jaar om aan je inburgeringsplicht te voldoen. De termijn start op de dag na de dagtekening van je PIP. Wordt je PIP later aangepast, dan verschuift de start niet.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}

<p><strong>Lukt het niet binnen 3 jaar?</strong> In bepaalde situaties krijg je extra tijd:
als je eerst moet leren lezen en schrijven, bij een opleiding, bij ziekte, bij een overlijden in
je familie, bij een bevalling, als je dakloos bent of in een instelling verblijft. Hoeveel extra
tijd, noemt DUO niet. Je kunt het maar 1 keer per periode krijgen.</p>

${fact('DUO noemt op de pagina over extra tijd geen vaste verlenging. Wel: "U kunt in een periode maar 1 keer extra tijd krijgen", ook als meerdere situaties tegelijk gelden.', 'inburgeren.nl — Extra tijd', SRC_EXTRA_TIJD, '20-08-2026')}

<p>Hoe lang je er écht over doet, verschilt. Sommige mensen zijn binnen een jaar klaar. Anderen
hebben de volle 3 jaar nodig. Wat er gebeurt als je te laat bent, lees je in
<a href="/nl/inburgering/boete-en-termijn">Boete en termijn</a>.</p>

<h2 id="stappenplan">Het stappenplan in 7 stappen</h2>

<p>Dit is de volgorde onder de Wet inburgering 2021. Die geldt voor bijna iedereen die nu begint.</p>

${fact('De Wet inburgering 2021 heet 2021, maar geldt vanaf 1 januari 2022. Moest je eerder beginnen, dan val je onder de oude wet van 2013. Die heeft andere regels: je regelt alles zelf en het taalniveau is A2.', 'rijksoverheid.nl — Nieuwe Wet inburgering', SRC_WET, CHECKED)}

${figure(
  'explainer-intake-naar-pip', 1400, 891,
  'Drie dingen, een gesprek, een toets en je persoonlijke situatie, komen samen in één document: je PIP.',
  'De eerste stappen draaien om één ding: de gemeente verzamelt drie soorten informatie en maakt daar één plan van. Dat plan is je PIP, en daarin staat welke route en welke examens voor jou gelden.',
)}

<div class="guide-steps">

<div class="guide-step">
  <div class="guide-step-num">1</div>
  <div class="guide-step-body">
    <h3>Je krijgt een brief van DUO</h3>
    <p>Je schrijft je in bij de gemeente. DUO controleert dan of je moet inburgeren. Zo ja, dan
    krijg je een brief. Daarin staat dat je inburgeringsplichtig bent en wat je nu moet doen.</p>
    <p><strong>Bewaar deze brief goed.</strong> Je hebt hem later nodig.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">2</div>
  <div class="guide-step-body">
    <h3>De brede intake bij de gemeente</h3>
    <p>Je gemeente nodigt je uit voor een gesprek en een korte toets. Het is een kennismaking,
    geen examen. Het gaat over je opleiding, je werk, je gezondheid en je gezin.</p>
    <p>Je maakt ook de <strong>leerbaarheidstoets</strong>. Die meet hoe makkelijk jij een nieuwe
    taal leert. Zo kiest de gemeente welke leerroute bij je past.</p>
    <p><strong>Tip:</strong> neem iemand mee die goed Nederlands of jouw taal spreekt. Je mag ook
    om een tolk vragen.</p>
    ${docent(`Wees niet bang voor de leerbaarheidstoets. Het is geen examen waarvoor je kunt slagen of zakken. De toets kijkt alleen hoe makkelijk je een nieuwe taal leert, en je maakt hem op de computer. Voorbereiden is niet nodig. Wil je alvast wennen aan het systeem? Dat kan in <a href="${SRC_LBT_OEFEN}" target="_blank" rel="noopener">de officiële oefenomgeving van DUO</a>.`)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">3</div>
  <div class="guide-step-body">
    <h3>Je PIP wordt vastgesteld</h3>
    <p>Na de brede intake maakt de gemeente je <strong>PIP</strong>: het persoonlijk plan
    inburgering en participatie. Daarin staat je leerroute, welke hulp je krijgt en hoe
    intensief je traject is.</p>
    ${fact('De gemeente moet je PIP uiterlijk 10 weken na de brief van DUO vaststellen. Stond je toen nog niet ingeschreven bij de gemeente? Dan tellen de 10 weken vanaf je inschrijving.', 'Besluit inburgering 2021, artikel 5.3', SRC_PIP, CHECKED)}
    <p><strong>De datum op je PIP is belangrijk.</strong> De dag erna start je termijn van 3 jaar.
    Ben je het niet eens met je PIP? Dan kun je bezwaar maken. Hoe, staat in de brief erbij.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">4</div>
  <div class="guide-step-body">
    <h3>Je krijgt een leerroute</h3>
    <p>B1-route, onderwijsroute of Z-route. Je zag ze hierboven, naast de 3 niveaus. De
    gemeente kiest, op basis van de brede intake en de leerbaarheidstoets.</p>
    <p>Lukt B1 in de B1-route echt niet? Dan mag je onder voorwaarden examens op A2 doen.</p>
    ${fact('Overstappen van B1 naar A2 kan alleen in de B1-route. Je moet dan minstens 600 uur taalles hebben gevolgd bij een school met een keurmerk, en laten zien dat je je best hebt gedaan.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}
    <p>Alles over de 3 routes en de 2 wetten staat in
    <a href="/nl/inburgering/welke-wet-en-welke-route">Welke wet en welke route geldt voor mij?</a>.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">5</div>
  <div class="guide-step-body">
    <h3>Je volgt lessen en doet mee</h3>
    <p>Nu begint het echte werk: de taallessen. Daarnaast horen deze 3 onderdelen bij je
    inburgering:</p>
    <div class="guide-cards">
      <div class="guide-card">
        <div class="guide-card-icon">${I_CAP}</div>
        <h3>KNM</h3>
        <p><strong>Kennis van de Nederlandse Maatschappij.</strong> Hoe Nederland werkt, van werk en inkomen tot wonen en zorg. KNM hoort bij álle leerroutes.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_PEN}</div>
        <h3>PVT</h3>
        <p><strong>Participatieverklaringstraject.</strong> Een korte cursus over vrijheid, gelijkwaardigheid, solidariteit en participatie. Je sluit af met je handtekening onder de participatieverklaring.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_WORK}</div>
        <h3>MAP</h3>
        <p><strong>Module Arbeidsmarkt en Participatie.</strong> Hoe je werk zoekt in Nederland: solliciteren, je cv, de arbeidsmarkt. MAP hoort bij de B1-route en de Z-route.</p>
      </div>
    </div>
    ${fact("KNM gaat over 8 thema's: werk en inkomen · omgangsvormen, waarden en normen · wonen · gezondheid en gezondheidszorg · geschiedenis en geografie · instanties · staatsinrichting en rechtsstaat · onderwijs en opvoeding.", 'Regeling inburgering 2021 — eindtermen KNM (Stcrt. 2024, 15802)', SRC_KNM, CHECKED)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">6</div>
  <div class="guide-step-body">
    <h3>Je doet examen</h3>
    <p>Volg je de B1-route of de onderwijsroute? Dan doe je 5 examens bij DUO:</p>
    <div class="article-table-wrap">
    <table>
      <thead><tr><th>Examen</th><th>Wat je doet</th></tr></thead>
      <tbody>
        <tr><td><strong>Lezen</strong></td><td>Teksten lezen en meerkeuzevragen beantwoorden</td></tr>
        <tr><td><strong>Luisteren</strong></td><td>Filmpjes en geluidsfragmenten begrijpen</td></tr>
        <tr><td><strong>Schrijven</strong></td><td>Korte teksten schrijven, zoals de e-mail hierboven</td></tr>
        <tr><td><strong>Spreken</strong></td><td>Antwoorden inspreken achter de computer</td></tr>
        <tr><td><strong>KNM</strong></td><td>Vragen over de Nederlandse maatschappij</td></tr>
      </tbody>
    </table>
    </div>
    <p>Je meldt je aan via <strong>Mijn Inburgering</strong>, de website van DUO. Je kiest zelf
    wanneer je welk examen doet.</p>
    ${fact('De kennisexamens en de taalexamens op A2 doe je op een van de zes examenlocaties: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht of Zwolle. Examens op B1 of B2 zijn het staatsexamen NT2, met eigen locaties.', 'inburgeren.nl — Examenplaatsen', SRC_LOCATIES, CHECKED)}
    ${docent('In mijn lessen zie ik dat de meeste cursisten Lezen en Luisteren het makkelijkst vinden. Schrijven en Spreken vinden ze vaak moeilijker. Begin daarom met Lezen of Luisteren, en verdeel je tijd goed. Plan liever niet meerdere examens op één dag — zo houd je genoeg energie over.')}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">7</div>
  <div class="guide-step-body">
    <h3>Je diploma, en wat daarna komt</h3>
    <p>Ben je voor alle onderdelen geslaagd? Dan krijg je je <strong>inburgeringsdiploma</strong>.
    Je downloadt het in Mijn Diploma's van DUO. Met dat diploma kun je later een
    verblijfsvergunning voor onbepaalde tijd aanvragen, of Nederlander worden.</p>
    ${fact('De uitslag van een kennisexamen of een A2-taalexamen komt normaal binnen 8 weken. Voor Schrijven A2 en Spreken A2 doet DUO er nu langer over: maximaal 16 weken (bericht van 31 juli 2026). Kom je daardoor in tijdnood met je termijn? Dan krijg je automatisch 6 maanden extra tijd.', 'inburgeren.nl — nieuwsbericht 31-07-2026', SRC_UITSLAG, CHECKED)}
    <p><strong>Gezakt voor een onderdeel?</strong> Je doet alleen dát onderdeel opnieuw. Wat je
    al hebt gehaald, blijft staan. Lees
    <a href="/nl/blog/inburgeringsexamen-zakken-herkansen">Gezakt voor het inburgeringsexamen? Dit gebeurt er nu</a>.</p>
  </div>
</div>

</div>

${figure(
  'explainer-wat-moet-je-halen', 1400, 590,
  'Zes losse onderdelen komen samen in één diploma met een zegel.',
  'Je diploma is geen groot examen, maar een verzameling losse onderdelen. Wat je gehaald hebt, blijft staan. Zak je voor één onderdeel, dan doe je alleen dát onderdeel opnieuw.',
)}

<h2 id="kosten">Wat kost inburgeren?</h2>

<p>Elk examen kost geld. Op dit moment is dat €50 per onderdeel bij DUO. Voor de 5 examens
samen dus €250, als je alles in één keer haalt. Lessen komen daar nog bij.</p>

${fact('Op het moment van schrijven kost elk examenonderdeel (Lezen, Luisteren, Schrijven, Spreken, KNM) €50. Onder de Wet inburgering 2021 is dat €250 in totaal. Check de actuele prijs bij DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, '28-07-2026')}

<p>Wie betaalt, en of je kunt lenen, hangt af van je situatie. Dat staat in
<a href="/nl/inburgering/wat-kost-inburgeren">Wat kost inburgeren?</a>.</p>

<h2 id="begin-met-oefenen">Begin met oefenen</h2>

<p>Je weet nu wat inburgeren is en hoe een opdracht eruitziet. De rest is oefenen, in de vorm
van het examen. Op deze site doe je dat met oefenexamens die door een NT2-docent zijn gemaakt
en nagekeken.</p>

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
      q: 'Wat is inburgeren?',
      a: 'Inburgeren betekent dat je Nederlands leert en laat zien dat je weet hoe Nederland werkt. Je doet daarvoor taalexamens en het examen KNM bij DUO, en je volgt een paar onderdelen bij de gemeente. Haal je alles, dan krijg je een inburgeringsdiploma.',
    },
    {
      q: 'Hoe lang mag je doen over inburgeren?',
      a: '3 jaar. De termijn begint op de dag na de datum op je PIP. In bepaalde situaties, zoals ziekte of een bevalling, kun je extra tijd krijgen. Dat kan 1 keer per periode. Hoe lang je er echt over doet, verschilt: sommige mensen zijn binnen een jaar klaar.',
    },
    {
      q: 'Welk taalniveau moet ik halen?',
      a: 'Onder de Wet inburgering 2021 is dat meestal B1. Lukt B1 niet, dan mag je in de B1-route onder voorwaarden examens op A2 doen. In de Z-route is het doel A1. Viel je onder de oude wet uit 2013, dan is A2 het niveau.',
    },
    {
      q: 'Wat is het verschil tussen inburgeren en naturalisatie?',
      a: 'Inburgeren is de plicht om Nederlands te leren en Nederland te leren kennen. Naturalisatie is de aanvraag om Nederlander te worden. Je inburgeringsdiploma heb je nodig als je wilt naturaliseren, maar het is niet hetzelfde.',
    },
    {
      q: 'Moet ik het KNM-examen doen?',
      a: "KNM hoort bij alle leerroutes onder de Wet inburgering 2021. In de B1-route en de onderwijsroute doe je het KNM-examen; in de Z-route volg je er lessen over. De vragen gaan over 8 thema's, van werk en inkomen tot staatsinrichting.",
    },
    {
      q: 'Wat kost inburgeren?',
      a: 'Op dit moment kost elk examen bij DUO €50. Voor de 5 examens samen is dat €250, als je alles in één keer haalt. Lessen komen daar nog bij. Asielstatushouders betalen hun cursus niet zelf; anderen kunnen vaak lenen bij DUO. Check de actuele bedragen bij DUO.',
    },
    {
      q: 'Waar kan ik gratis oefenen voor het inburgeringsexamen?',
      a: 'DUO heeft een aantal oefenexamens op inburgeren.nl. Wil je meer oefenen, dan kun je op deze site gratis oefenexamens doen voor Lezen, Luisteren, Schrijven en Spreken, met uitleg bij elke vraag.',
    },
  ],

  related: ['moet-ik-inburgeren', 'welke-wet-en-welke-route', 'wat-kost-inburgeren', 'boete-en-termijn'],
  relatedPosts: [
    'taalniveaus-a1-a2-b1-nederlands',
    'inburgeringsexamen-zakken-herkansen',
  ],

  ctaTitle: 'Kijk waar je nu staat',
  ctaDesc: 'Tien vragen per onderdeel, met uitleg bij elk antwoord. Geen account nodig.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis oefenexamen',

  /* English and Arabic bodies.
   *
   * 20-08-2026: added when the three spokes were translated. 03-11-2026: rewritten to mirror the
   * new Dutch structure (`tests-unit/guide-translations.test.ts` requires the same <h2 id>
   * sequence in every locale). Both are machine translations of a draft that still awaits the
   * docent's review, and the page says so at the top (`guides.mt_notice`); when she changes the
   * Dutch, change these in the same commit.
   *
   * Three things to keep right in here:
   *
   *  - **Internal links carry the locale.** The Dutch body hardcodes `/nl/oefenen` and
   *    `/nl/blog/…`; each translation points at its own locale, or an English reader is dropped
   *    into a Dutch page mid-sentence.
   *  - **Official Dutch terms stay Dutch**, glossed on first use: inburgering, DUO, PIP, KNM,
   *    MAP, PVT, brede intake, leerbaarheidstoets, Mijn Inburgering. The reader has to match them
   *    against a letter and a portal that exist in Dutch only.
   *  - **`fact()` and `docent()` are the Dutch-chrome helpers**; the translations use `factIn()`
   *    and `docentIn()` so "Bron"/"geraadpleegd" and the docent's role line are not the only
   *    Dutch words left on an English page.
   *  - **The two demonstrations stay in Dutch.** The sample e-mail and the A1/A2/B1 messages are
   *    the thing being shown: translating them would show English, not the level. Each gets a
   *    one-line gloss in the reader's language instead.
   */
  translations: {
    en: {
      title: 'Inburgering: what it is and how it works. Step by step',
      breadcrumb: 'Step-by-step guide',
      dateLabel: '19 August 2026',
      eyebrow: 'Step-by-step guide',
      heroTitle: 'Inburgering: what it is and how it works',
      heroSubtitle:
        'Learn Dutch, show you know the Netherlands, and do it within 3 years. This is what integration looks like, from the letter from DUO to your diploma. With a real sample task.',
      description:
        'What is inburgering, how long do you get and which steps do you go through? The Dutch integration process explained, with a sample exam task and a timeline.',
      articleHtml: `
<p><strong>Inburgering</strong>, civic integration, means that you learn Dutch and show that you
know how the Netherlands works. You do that with exams at DUO. Pass everything and you receive an
inburgeringsdiploma.</p>

<p>The process starts with a letter from DUO and ends with that diploma. You have 3 years. This
page shows what integration is, what the exam looks like and which steps you go through.</p>

<div class="article-toc">
  <p class="article-toc-title">On this page</p>
  <ol>
    <li><a href="#wat-is-inburgeren">What is inburgering?</a></li>
    <li><a href="#voorbeeldopdracht">What the exam looks like: one task</a></li>
    <li><a href="#welk-niveau">Which level do you need? A1, A2 and B1 side by side</a></li>
    <li><a href="#hoe-lang">How long do you get?</a></li>
    <li><a href="#stappenplan">The process in 7 steps</a></li>
    <li><a href="#kosten">What does it cost?</a></li>
  </ol>
</div>

<h2 id="wat-is-inburgeren">What is inburgering?</h2>

<p>The government expects two things of you:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_TAAL}</div>
    <h3>You learn Dutch</h3>
    <p>Enough to work, go to the doctor and talk to your children's school.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_NL}</div>
    <h3>You learn how the Netherlands works</h3>
    <p>How you look for work, how health insurance works, and which rules and values matter here.</p>
  </div>
</div>

<p>You show it with exams: 4 language exams (Reading, Listening, Writing and Speaking) and the
KNM exam, Knowledge of Dutch Society. Alongside those you follow a few short modules at the
municipality. They are in step 5.</p>

<p>Integration is not a test of how clever you are. It is a fixed format, and a format can be
learned. Most people who fail do not fail because their Dutch is poor, but because nobody
showed them the format. So we show it below.</p>

<p>Whether <em>you</em> have to integrate depends on your nationality and your residence permit.
Read <a href="/en/civic-integration/do-i-have-to-integrate">Do I have to do inburgering?</a> for that.
This page is about what comes next.</p>

<h2 id="voorbeeldopdracht">What the exam looks like: one task</h2>

<p>This is a writing task like the ones in the Writing A2 exam. First the task, then a good
answer. The task is ours, in the format of the exam. The real exam questions are
secret. Both stay in Dutch, because the Dutch is the point; the gloss is underneath.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>The task</h3><p class="compare-when">Writing A2, an e-mail task</p></div>
    <div class="compare-rows">
      ${row('Situatie', 'Je dochter Sara is ziek. Ze kan morgen niet naar school. Schrijf een e-mail aan haar juf, mevrouw De Boer.')}
      ${row('Schrijf in je e-mail', '1. dat Sara ziek is<br>2. wat ze heeft<br>3. wanneer ze weer naar school komt')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>A good answer</h3><p class="compare-when">All 3 points are there, in short sentences</p></div>
    <div class="compare-rows">
      ${row('E-mail', 'Beste mevrouw De Boer,<br><br><strong>Sara is ziek.</strong> <strong>Ze heeft koorts en keelpijn.</strong> Daarom kan ze morgen niet naar school. <strong>Ik denk dat ze donderdag weer komt.</strong><br><br>Met vriendelijke groet,<br>Fatima Yilmaz')}
      ${row('Why this is good', 'Points 1, 2 and 3 are all there (in bold). The sentences are short. There is a greeting and a sign-off. Nothing more is needed.')}
    </div>
  </div>
</div>

<p><em>Gloss:</em> your daughter Sara is ill and cannot go to school tomorrow. Write an e-mail to
her teacher, Mrs De Boer, saying that Sara is ill, what she has, and when she will be back. The
answer: "Dear Mrs De Boer, Sara is ill. She has a fever and a sore throat. So she cannot come to
school tomorrow. I think she will be back on Thursday. Kind regards, Fatima Yilmaz."</p>

<p>Notice what is <em>not</em> there: no long sentences, no difficult words. Every task tells
you what to write. Write all the points, in sentences that can be understood, and you have done
what was asked.</p>

${factIn('en', 'The Writing A2 exam is done with pen and paper. You get 4 writing tasks in 40 minutes, for example a short letter or a form. Writing is marked by assessors, not by the computer.', 'inburgeren.nl — Taalexamens A2, B1 en B2 · Examenreglement, artikel 10', SRC_TAALEXAMENS, '28-07-2026')}

<p>Reading and Listening are multiple-choice questions on the computer. In Speaking you record
your answers. Each part has its own format. Want to see all four? Read
<a href="/en/language-exams/language-exams-a2-b1">The language exams A2 and B1 explained</a>.</p>

<div class="guide-cta-inline">
  <p><strong>Try it yourself</strong>Do 10 Reading or Listening questions, with an explanation after every answer. No account needed.</p>
  <a class="guide-cta-btn" href="/en/practice">Start for free ${I_ARROW}</a>
</div>

<h2 id="welk-niveau">Which level do you need? A1, A2 and B1 side by side</h2>

<p>You keep hearing A1, A2 and B1. Those are language levels. How do they differ? Here is one
message, written 3 times. Someone cancels an appointment with the family doctor.</p>

<div class="route-grid">
  <div class="route-card r-z">
    <div class="route-accent"></div>
    <div class="route-top"><h3>This is A1</h3><span class="route-level">A1</span></div>
    <div class="route-rows">
      ${row('The message', 'Hallo. Ik ben ziek. Ik kom niet. Morgen nieuwe afspraak?')}
      ${row('What you see', 'Loose, short sentences. "Hello. I am ill. I am not coming. Tomorrow new appointment?" Understandable, but no more than that.')}
      ${row('Who reaches this level', 'The Z-route. You finish with an interview at the municipality.')}
    </div>
  </div>
  <div class="route-card">
    <div class="route-accent"></div>
    <div class="route-top"><h3>This is A2</h3><span class="route-level">A2</span></div>
    <div class="route-rows">
      ${row('The message', 'Goedemorgen. Ik heb vandaag om 10 uur een afspraak. Ik ben ziek en kan niet komen. Kan ik een nieuwe afspraak maken?')}
      ${row('What you see', 'Full sentences. You say what is wrong and what you want: "I have an appointment at 10 today. I am ill and cannot come. Can I make a new appointment?" Simple, but complete.')}
      ${row('Who reaches this level', 'People under the 2013 act, or who may drop to A2 in the B1 route.')}
    </div>
  </div>
  <div class="route-card r-onderwijs">
    <div class="route-accent"></div>
    <div class="route-top"><h3>This is B1</h3><span class="route-level">B1</span></div>
    <div class="route-rows">
      ${row('The message', 'Goedemorgen. Ik heb vanochtend om 10.00 uur een afspraak bij dokter De Vries, maar ik heb sinds gisteren koorts. Daarom kan ik helaas niet komen. Kan ik de afspraak verzetten naar volgende week, het liefst in de ochtend?')}
      ${row('What you see', 'You explain why, and you say what you would prefer: "I have had a fever since yesterday, so unfortunately I cannot come. Could I move the appointment to next week, preferably in the morning?" With words like "daarom" (so) and "helaas" (unfortunately).')}
      ${row('Who reaches this level', 'The B1 route, the standard route under the 2021 act.')}
    </div>
  </div>
</div>

<p>All 3 messages do the same thing: the appointment is cancelled. The difference is how much you
can explain. That is also what the exam measures.</p>

${factIn('en', 'Under the Wet inburgering 2021 there are 3 learning routes. The B1 route: you sit the language exams at level B1 within 3 years. The education route: mainly for young people, towards mbo, hbo or university, at B1 or B2. The Z-route: you learn Dutch at level A1 and finish with an interview at the municipality. The municipality chooses the route, based on the brede intake.', 'inburgeren.nl — U gaat inburgeren', SRC_ROUTES, CHECKED)}

<p>Which route you get is in your PIP (step 3). Want the difference between the levels in more
detail? Read <a href="/en/blog/dutch-language-levels-a1-a2-b1">the difference between A1, A2 and B1</a>.</p>

<h2 id="hoe-lang">How long do you get?</h2>

<p><strong>3 years.</strong> The clock starts on the day after the date on your PIP, the plan the
municipality draws up for you. Not on the day you arrive in the Netherlands, and not on the day
of the letter from DUO.</p>

<div class="termijn">
  <div class="termijn-ends">
    <div class="termijn-end"><strong>Start</strong>the day after the date on your PIP</div>
    <div class="termijn-end"><strong>End</strong>all exams and modules finished</div>
  </div>
  <div class="termijn-bar">
    <div class="termijn-seg">Year 1</div>
    <div class="termijn-seg s2">Year 2</div>
    <div class="termijn-seg s3">Year 3</div>
    <div class="termijn-seg s-extra">Extra time?</div>
  </div>
  <p class="termijn-note">Everything has to be finished within those 3 years: the language exams,
  KNM, PVT and MAP. You do not have to sit the exams at once. Most people spread them over a few
  months.</p>
</div>

${factIn('en', 'You have 3 years to meet your integration duty. The period starts on the day after the date of your PIP. If your PIP is revised later, the start does not move.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}

<p><strong>Cannot manage it within 3 years?</strong> In certain situations you get extra time: if
you first have to learn to read and write, during a study programme, illness, a death in the
family, giving birth, homelessness or a stay in an institution. How much extra time, DUO does
not say. You can get it only once per period.</p>

${factIn('en', 'DUO names no fixed extension on its page about extra time. It does say: "U kunt in een periode maar 1 keer extra tijd krijgen" (you can get extra time only once per period), even if several situations apply at once.', 'inburgeren.nl — Extra tijd', SRC_EXTRA_TIJD, '20-08-2026')}

<p>How long it <em>actually</em> takes differs. Some people finish within a year. Others need the
full 3 years. What happens if you are late is in
<a href="/en/civic-integration/fines-and-deadlines">Fine and deadline</a>.</p>

<h2 id="stappenplan">The process in 7 steps</h2>

<p>This is the order under the Wet inburgering 2021. It applies to almost everyone starting now.</p>

${factIn('en', 'The Wet inburgering 2021 is called 2021 but applies from 1 January 2022. If you had to start before that, you fall under the older act of 2013. That one has different rules: you arrange everything yourself and the language level is A2.', 'rijksoverheid.nl — Nieuwe Wet inburgering', SRC_WET, CHECKED)}

${figure(
  'explainer-intake-naar-pip', 1400, 891,
  'Three things, an interview, a test and your personal situation, come together in one document: your PIP.',
  'The first steps all turn on one thing: the municipality gathers three kinds of information and turns them into a single plan. That plan is your PIP, and it states which route and which exams apply to you.',
)}

<div class="guide-steps">

<div class="guide-step">
  <div class="guide-step-num">1</div>
  <div class="guide-step-body">
    <h3>You get a letter from DUO</h3>
    <p>You register with your municipality. DUO then checks whether you have to integrate. If so,
    you get a letter. It states that you are required to integrate and what to do now.</p>
    <p><strong>Keep this letter safe.</strong> You will need it later.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">2</div>
  <div class="guide-step-body">
    <h3>The brede intake at the municipality</h3>
    <p>Your municipality invites you for an interview and a short test. It is an introduction, not
    an exam. It covers your education, your work, your health and your family.</p>
    <p>You also take the <strong>leerbaarheidstoets</strong>, the learnability test. It measures
    how easily you learn a new language. That is how the municipality chooses a route for you.</p>
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
    integration and participation plan. It states your route, what support you get and how
    intensive your programme is.</p>
    ${factIn('en', 'The municipality must set your PIP no later than 10 weeks after the letter from DUO. Were you not yet registered with the municipality at that point? Then the 10 weeks run from your registration.', 'Besluit inburgering 2021, artikel 5.3', SRC_PIP, CHECKED)}
    <p><strong>The date on your PIP matters.</strong> Your 3-year period starts the day after.
    Disagree with your PIP? Then you can object. The letter with it explains how.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">4</div>
  <div class="guide-step-body">
    <h3>You are given a learning route</h3>
    <p>B1 route, education route or Z-route. You saw them above, next to the 3 levels. The
    municipality chooses, based on the brede intake and the leerbaarheidstoets.</p>
    <p>Is B1 genuinely out of reach in the B1 route? Then under conditions you may sit exams at A2.</p>
    ${factIn('en', 'Switching from B1 to A2 is only possible in the B1 route. You must have had at least 600 hours of language tuition at a school with a quality mark, and be able to show that you made the effort.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}
    <p>Everything about the 3 routes and the 2 acts is in
    <a href="/en/civic-integration/which-law-and-which-route">Which act and which route applies to me?</a>.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">5</div>
  <div class="guide-step-body">
    <h3>You take lessons and take part</h3>
    <p>Now the real work begins: the language lessons. Alongside them, these 3 modules belong to
    your integration:</p>
    <div class="guide-cards">
      <div class="guide-card">
        <div class="guide-card-icon">${I_CAP}</div>
        <h3>KNM</h3>
        <p><strong>Knowledge of Dutch Society.</strong> How the Netherlands works, from work and income to housing and healthcare. KNM is part of every route.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_PEN}</div>
        <h3>PVT</h3>
        <p><strong>Participation declaration programme.</strong> A short course on freedom, equality, solidarity and participation. You finish by signing the participation declaration.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_WORK}</div>
        <h3>MAP</h3>
        <p><strong>Labour Market and Participation Module.</strong> How you look for work in the Netherlands: applications, your CV, the labour market. MAP belongs to the B1 route and the Z-route.</p>
      </div>
    </div>
    ${factIn('en', "KNM covers 8 themes: work and income · manners, values and norms · housing · health and healthcare · history and geography · public bodies · the constitution and the rule of law · education and raising children.", 'Regeling inburgering 2021 — eindtermen KNM (Stcrt. 2024, 15802)', SRC_KNM, CHECKED)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">6</div>
  <div class="guide-step-body">
    <h3>You sit the exams</h3>
    <p>Following the B1 route or the education route? Then you sit 5 exams at DUO:</p>
    <div class="article-table-wrap">
    <table>
      <thead><tr><th>Exam</th><th>What you do</th></tr></thead>
      <tbody>
        <tr><td><strong>Reading</strong></td><td>Read texts and answer multiple-choice questions</td></tr>
        <tr><td><strong>Listening</strong></td><td>Understand video and audio fragments</td></tr>
        <tr><td><strong>Writing</strong></td><td>Write short texts, like the e-mail above</td></tr>
        <tr><td><strong>Speaking</strong></td><td>Record your answers at the computer</td></tr>
        <tr><td><strong>KNM</strong></td><td>Questions about Dutch society</td></tr>
      </tbody>
    </table>
    </div>
    <p>You register through <strong>Mijn Inburgering</strong>, DUO's website. You choose when you
    sit which exam.</p>
    ${factIn('en', 'You sit the knowledge exams and the A2 language exams at one of six exam locations: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht or Zwolle. Exams at B1 or B2 are the staatsexamen NT2, which has its own locations.', 'inburgeren.nl — Examenplaatsen', SRC_LOCATIES, CHECKED)}
    ${docentIn('en', 'In my lessons I see that most students find Reading and Listening easiest. Writing and Speaking they often find harder. So start with Reading or Listening, and divide your time well. Try not to plan several exams on one day — that way you keep enough energy.')}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">7</div>
  <div class="guide-step-body">
    <h3>Your diploma, and what comes after</h3>
    <p>Passed everything? Then you receive your <strong>inburgeringsdiploma</strong>. You download
    it from Mijn Diploma's at DUO. With that diploma you can later apply for permanent residence,
    or become a Dutch citizen.</p>
    ${factIn('en', 'The result of a knowledge exam or an A2 language exam normally arrives within 8 weeks. For Writing A2 and Speaking A2 DUO is currently taking longer: up to 16 weeks (notice of 31 July 2026). If that puts your deadline at risk, you automatically get 6 months extra.', 'inburgeren.nl — nieuwsbericht 31-07-2026', SRC_UITSLAG, CHECKED)}
    <p><strong>Failed a part?</strong> You only resit that part. What you have already passed
    stays. Read
    <a href="/en/blog/failing-and-retaking-the-integration-exam">Failed the integration exam? Here is what happens now</a>.</p>
  </div>
</div>

</div>

${figure(
  'explainer-wat-moet-je-halen', 1400, 590,
  'Six separate parts come together into one diploma with a seal.',
  'Your diploma is not one big exam but a collection of separate parts. What you have passed stays passed. Fail one part and you only resit that part.',
)}

<h2 id="kosten">What does it cost?</h2>

<p>Every exam costs money. At the moment that is €50 per part at DUO. For the 5 exams together
that is €250, if you pass everything first time. Lessons come on top.</p>

${factIn('en', 'At the time of writing each exam part (Reading, Listening, Writing, Speaking, KNM) costs €50. Under the Wet inburgering 2021 that is €250 in total. Check the current fee at DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, '28-07-2026')}

<p>Who pays, and whether you can borrow, depends on your situation. That is in
<a href="/en/civic-integration/what-does-integration-cost">What does integration cost?</a>.</p>

<h2 id="begin-met-oefenen">Start practising</h2>

<p>You now know what integration is and what a task looks like. The rest is practice, in the
format of the exam. On this site you do that with practice exams written and checked by an NT2
teacher.</p>

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
          q: 'What is inburgering?',
          a: 'Inburgering means that you learn Dutch and show that you know how the Netherlands works. You sit language exams and the KNM exam at DUO, and you follow a few modules at the municipality. Pass everything and you receive an inburgeringsdiploma.',
        },
        {
          q: 'How long do you get for integration?',
          a: '3 years. The period starts on the day after the date on your PIP. In certain situations, such as illness or giving birth, you can get extra time. That is possible once per period. How long it actually takes differs: some people finish within a year.',
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
          q: 'What does integration cost?',
          a: 'At the moment each exam at DUO costs €50. For the 5 exams together that is €250, if you pass everything first time. Lessons come on top. Asylum status holders do not pay for their course themselves; others can often borrow from DUO. Check the current amounts at DUO.',
        },
        {
          q: 'Where can I practise for the integration exam for free?',
          a: 'DUO has a number of practice exams on inburgeren.nl. If you want to practise more, this site offers free practice exams for Reading, Listening, Writing and Speaking, with an explanation for every question.',
        },
      ],
    },
    ar: {
      title: 'الاندماج (inburgering): ما هو وكيف يعمل؟ خطوة بخطوة',
      breadcrumb: 'خطوة بخطوة',
      dateLabel: '١٩ أغسطس ٢٠٢٦',
      eyebrow: 'خطوة بخطوة',
      heroTitle: 'الاندماج (inburgering): ما هو وكيف يعمل؟',
      heroSubtitle:
        'تتعلّم الهولندية، وتُثبت أنك تعرف هولندا، وذلك خلال ٣ سنوات. هكذا يبدو الاندماج، من رسالة DUO إلى شهادتك. مع مهمة امتحان حقيقية كمثال.',
      description:
        'ما هو الاندماج (inburgering) في هولندا، كم من الوقت لديك، وما الخطوات التي تمرّ بها؟ شرح كامل لمسار الاندماج خطوة بخطوة، مع مثال لمهمة من الامتحان وجدول زمني.',
      articleHtml: `
<p><strong>الاندماج (inburgering)</strong> يعني أن تتعلّم الهولندية وأن تُثبت أنك تعرف كيف تعمل
هولندا. تفعل ذلك عبر امتحانات لدى DUO. وإذا اجتزت كل شيء، تحصل على شهادة الاندماج
(inburgeringsdiploma).</p>

<p>يبدأ المسار برسالة من DUO وينتهي بتلك الشهادة. أمامك ٣ سنوات. في هذه الصفحة ترى ما هو
الاندماج بالضبط، وكيف يبدو الامتحان، وما الخطوات التي تمرّ بها.</p>

<div class="article-toc">
  <p class="article-toc-title">في هذه الصفحة</p>
  <ol>
    <li><a href="#wat-is-inburgeren">ما هو الاندماج؟</a></li>
    <li><a href="#voorbeeldopdracht">هكذا يبدو الامتحان: مهمة واحدة</a></li>
    <li><a href="#welk-niveau">أي مستوى عليك بلوغه؟ A1 وA2 وB1 جنبًا إلى جنب</a></li>
    <li><a href="#hoe-lang">كم من الوقت لديك؟</a></li>
    <li><a href="#stappenplan">المسار في ٧ خطوات</a></li>
    <li><a href="#kosten">كم يكلّف الاندماج؟</a></li>
  </ol>
</div>

<h2 id="wat-is-inburgeren">ما هو الاندماج؟</h2>

<p>تتوقّع الحكومة منك أمرين:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_TAAL}</div>
    <h3>أن تتعلّم الهولندية</h3>
    <p>بما يكفي للعمل والذهاب إلى الطبيب والتحدّث مع مدرسة أطفالك.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_NL}</div>
    <h3>أن تتعلّم كيف تعمل هولندا</h3>
    <p>كيف تبحث عن عمل، وكيف يعمل التأمين الصحي، وأي قواعد وقيم مهمة هنا.</p>
  </div>
</div>

<p>تُثبت ذلك بامتحانات: ٤ امتحانات لغوية (القراءة والاستماع والكتابة والمحادثة) وامتحان KNM،
معرفة المجتمع الهولندي. وإلى جانبها تتابع بضع وحدات قصيرة لدى البلدية. تجدها في الخطوة ٥.</p>

<p>الاندماج ليس اختبارًا لمدى ذكائك. إنه شكل ثابت، والشكل يمكن تعلّمه. معظم من يرسبون لا
يرسبون بسبب ضعف لغتهم الهولندية، بل لأن أحدًا لم يُرِهم الشكل. لذلك نعرضه أدناه.</p>

<p>أما هل <em>أنت</em> ملزَم بالاندماج، فذلك يعتمد على جنسيتك وتصريح إقامتك. اقرأ ذلك في
<a href="/ar/الاندماج/هل-يجب-علي-الاندماج">هل يجب عليّ الاندماج؟</a>. هذه الصفحة تتناول ما
يأتي بعد ذلك.</p>

<h2 id="voorbeeldopdracht">هكذا يبدو الامتحان: مهمة واحدة</h2>

<p>هذه مهمة كتابة كتلك التي تحصل عليها في امتحان الكتابة A2. المهمة في البطاقة الأولى، وإجابة
جيدة في الثانية. المهمة من إعدادنا، بصيغة الامتحان. أسئلة الامتحان الحقيقية سرّية. تبقى
المهمة والإجابة بالهولندية، لأن الهولندية هي المقصود؛ والترجمة تحتها.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head"><h3>المهمة</h3><p class="compare-when">الكتابة A2، مهمة بصيغة بريد إلكتروني</p></div>
    <div class="compare-rows">
      ${rowNl('Situatie', 'Je dochter Sara is ziek. Ze kan morgen niet naar school. Schrijf een e-mail aan haar juf, mevrouw De Boer.')}
      ${rowNl('Schrijf in je e-mail', '1. dat Sara ziek is<br>2. wat ze heeft<br>3. wanneer ze weer naar school komt')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head"><h3>إجابة جيدة</h3><p class="compare-when">النقاط الثلاث كلها موجودة، في جمل قصيرة</p></div>
    <div class="compare-rows">
      ${rowNl('E-mail', 'Beste mevrouw De Boer,<br><br><strong>Sara is ziek.</strong> <strong>Ze heeft koorts en keelpijn.</strong> Daarom kan ze morgen niet naar school. <strong>Ik denk dat ze donderdag weer komt.</strong><br><br>Met vriendelijke groet,<br>Fatima Yilmaz')}
      ${row('لماذا هذه الإجابة جيدة', 'النقاط ١ و٢ و٣ كلها موجودة (بالخط العريض). الجمل قصيرة. هناك تحية في البداية وتحية في الختام. ولا حاجة إلى أكثر من ذلك.')}
    </div>
  </div>
</div>

<p><em>الترجمة:</em> ابنتك سارة مريضة ولا تستطيع الذهاب إلى المدرسة غدًا. اكتب بريدًا إلكترونيًا
إلى معلّمتها، السيدة De Boer، تذكر فيه أن سارة مريضة، وما الذي تعاني منه، ومتى ستعود. الإجابة:
"عزيزتي السيدة De Boer، سارة مريضة. لديها حمّى والتهاب في الحلق. لذلك لا تستطيع الذهاب إلى
المدرسة غدًا. أظن أنها ستعود يوم الخميس. مع أطيب التحيات، Fatima Yilmaz."</p>

<p>لاحظ ما <em>ليس</em> موجودًا: لا جمل طويلة، ولا كلمات صعبة. في كل مهمة يُذكر ما عليك كتابته.
اكتب كل النقاط، في جمل مفهومة، وبذلك تكون قد فعلت المطلوب.</p>

${factIn('ar', 'امتحان الكتابة A2 يُجرى بالقلم والورقة. تحصل على ٤ مهام كتابة في ٤٠ دقيقة، مثل رسالة قصيرة أو استمارة. وتُصحَّح الكتابة من قِبل مقيّمين، لا من الحاسوب.', 'inburgeren.nl — Taalexamens A2, B1 en B2 · Examenreglement, artikel 10', SRC_TAALEXAMENS, '28-07-2026')}

<p>القراءة والاستماع أسئلة اختيار من متعدد على الحاسوب. وفي المحادثة تسجّل إجاباتك. لكل جزء
شكله الخاص. تريد رؤية الأجزاء الأربعة؟ اقرأ
<a href="/ar/المدونة/شرح-امتحان-الاندماج-a2">امتحان الاندماج A2: شرح الأجزاء اللغوية الأربعة</a>.</p>

<div class="guide-cta-inline">
  <p><strong>جرّب بنفسك</strong>أجب عن ١٠ أسئلة قراءة أو استماع، مع شرح بعد كل إجابة. بدون حساب.</p>
  <a class="guide-cta-btn" href="/ar/تدرب">ابدأ مجانًا ${I_ARROW}</a>
</div>

<h2 id="welk-niveau">أي مستوى عليك بلوغه؟ A1 وA2 وB1 جنبًا إلى جنب</h2>

<p>تسمع دائمًا A1 وA2 وB1. هذه مستويات لغوية. كيف تختلف؟ إليك رسالة واحدة، مكتوبة ٣ مرات.
شخص يلغي موعدًا عند طبيب الأسرة.</p>

<div class="route-grid">
  <div class="route-card r-z">
    <div class="route-accent"></div>
    <div class="route-top"><h3>هكذا يبدو A1</h3><span class="route-level">A1</span></div>
    <div class="route-rows">
      ${rowNl('الرسالة', 'Hallo. Ik ben ziek. Ik kom niet. Morgen nieuwe afspraak?')}
      ${row('ما تراه', 'جمل قصيرة ومتفرّقة: "مرحبًا. أنا مريض. لن آتي. غدًا موعد جديد؟" مفهومة، لكن لا أكثر.')}
      ${row('من يبلغ هذا المستوى', 'مسار Z. تُنهيه بمقابلة لدى البلدية.')}
    </div>
  </div>
  <div class="route-card">
    <div class="route-accent"></div>
    <div class="route-top"><h3>هكذا يبدو A2</h3><span class="route-level">A2</span></div>
    <div class="route-rows">
      ${rowNl('الرسالة', 'Goedemorgen. Ik heb vandaag om 10 uur een afspraak. Ik ben ziek en kan niet komen. Kan ik een nieuwe afspraak maken?')}
      ${row('ما تراه', 'جمل كاملة. تقول ما المشكلة وما الذي تريده: "لديّ موعد اليوم الساعة ١٠. أنا مريض ولا أستطيع المجيء. هل يمكنني حجز موعد جديد؟" بسيطة، لكنها كاملة.')}
      ${row('من يبلغ هذا المستوى', 'من يخضع لقانون ٢٠١٣، أو من يُسمح له بالنزول إلى A2 في مسار B1.')}
    </div>
  </div>
  <div class="route-card r-onderwijs">
    <div class="route-accent"></div>
    <div class="route-top"><h3>هكذا يبدو B1</h3><span class="route-level">B1</span></div>
    <div class="route-rows">
      ${rowNl('الرسالة', 'Goedemorgen. Ik heb vanochtend om 10.00 uur een afspraak bij dokter De Vries, maar ik heb sinds gisteren koorts. Daarom kan ik helaas niet komen. Kan ik de afspraak verzetten naar volgende week, het liefst in de ochtend?')}
      ${row('ما تراه', 'تشرح السبب، وتقول ما تفضّله: "لديّ حمّى منذ الأمس، لذلك لا أستطيع المجيء للأسف. هل يمكن تأجيل الموعد إلى الأسبوع القادم، ويُفضَّل في الصباح؟" بكلمات مثل "daarom" (لذلك) و"helaas" (للأسف).')}
      ${row('من يبلغ هذا المستوى', 'مسار B1، المسار الأساسي في ظل قانون ٢٠٢١.')}
    </div>
  </div>
</div>

<p>الرسائل الثلاث تفعل الشيء نفسه: الموعد أُلغي. الفرق هو في مقدار ما تستطيع شرحه. وهذا أيضًا
ما يقيسه الامتحان.</p>

${factIn('ar', 'في ظل قانون Wet inburgering 2021 هناك ٣ مسارات تعليمية. مسار B1: تؤدّي الامتحانات اللغوية على مستوى B1 خلال ٣ سنوات. مسار التعليم: للشباب غالبًا، نحو mbo أو hbo أو الجامعة، على مستوى B1 أو B2. مسار Z: تتعلّم الهولندية على مستوى A1 وتُنهيه بمقابلة لدى البلدية. البلدية تختار المسار بناءً على المقابلة الشاملة (brede intake).', 'inburgeren.nl — U gaat inburgeren', SRC_ROUTES, CHECKED)}

<p>المسار الذي تحصل عليه مذكور في الـPIP (الخطوة ٣). تريد معرفة الفرق بين المستويات بدقة أكبر؟
اقرأ <a href="/ar/المدونة/مستويات-اللغة-الهولندية-a1-a2-b1">الفرق بين A1 وA2 وB1</a>.</p>

<h2 id="hoe-lang">كم من الوقت لديك؟</h2>

<p><strong>٣ سنوات.</strong> يبدأ العدّ في اليوم التالي للتاريخ المكتوب على الـPIP، الخطة التي تضعها
البلدية لك. لا في يوم وصولك إلى هولندا، ولا في يوم رسالة DUO.</p>

<div class="termijn">
  <div class="termijn-ends">
    <div class="termijn-end"><strong>البداية</strong>اليوم التالي لتاريخ الـPIP</div>
    <div class="termijn-end"><strong>النهاية</strong>كل الامتحانات والوحدات منجزة</div>
  </div>
  <div class="termijn-bar">
    <div class="termijn-seg">السنة ١</div>
    <div class="termijn-seg s2">السنة ٢</div>
    <div class="termijn-seg s3">السنة ٣</div>
    <div class="termijn-seg s-extra">وقت إضافي؟</div>
  </div>
  <p class="termijn-note">خلال هذه السنوات الثلاث يجب أن يكون كل شيء جاهزًا: الامتحانات اللغوية
  وKNM وPVT وMAP. لا يلزمك أداء الامتحانات دفعة واحدة. معظم الناس يوزّعونها على بضعة أشهر.</p>
</div>

${factIn('ar', 'أمامك ٣ سنوات للوفاء بالتزام الاندماج. تبدأ المدة في اليوم التالي لتاريخ الـPIP. وإذا عُدّل الـPIP لاحقًا، فلا تتغيّر البداية.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}

<p><strong>لا تستطيع الإنجاز خلال ٣ سنوات؟</strong> في حالات معيّنة تحصل على وقت إضافي: إذا كان
عليك أولًا تعلّم القراءة والكتابة، أو أثناء دراسة، أو في حالة مرض، أو وفاة في العائلة، أو ولادة،
أو تشرّد، أو إقامة في مؤسسة. أما مقدار الوقت الإضافي، فلا تحدّده DUO. ويمكنك الحصول عليه مرة
واحدة فقط في كل فترة.</p>

${factIn('ar', 'لا تذكر DUO في صفحتها عن الوقت الإضافي مدة تمديد ثابتة. لكنها تقول: "U kunt in een periode maar 1 keer extra tijd krijgen" (يمكنك الحصول على وقت إضافي مرة واحدة فقط في كل فترة)، حتى لو انطبقت عدة حالات في آن واحد.', 'inburgeren.nl — Extra tijd', SRC_EXTRA_TIJD, '20-08-2026')}

<p>أما المدة <em>الفعلية</em> فتختلف. بعض الناس ينتهون خلال سنة. وآخرون يحتاجون السنوات الثلاث
كاملة. وما يحدث إذا تأخرت تجده في
<a href="/ar/الاندماج/الغرامة-والمهلة">الغرامة والمهلة</a>.</p>

<h2 id="stappenplan">المسار في ٧ خطوات</h2>

<p>هذا هو الترتيب في ظل قانون Wet inburgering 2021. وهو ينطبق على كل من يبدأ الآن تقريبًا.</p>

${factIn('ar', 'اسم قانون Wet inburgering 2021 يحمل سنة ٢٠٢١، لكنه يسري اعتبارًا من ١ يناير ٢٠٢٢. وإذا كان عليك البدء قبل ذلك، فأنت تخضع للقانون الأقدم لعام ٢٠١٣. ولذلك القانون قواعد مختلفة: تنظّم كل شيء بنفسك والمستوى اللغوي هو A2.', 'rijksoverheid.nl — Nieuwe Wet inburgering', SRC_WET, CHECKED)}

${figure(
  'explainer-intake-naar-pip', 1400, 891,
  'ثلاثة أمور، مقابلة واختبار ووضعك الشخصي، تتلاقى في وثيقة واحدة: الـPIP الخاص بك.',
  'الخطوات الأولى تدور حول شيء واحد: تجمع البلدية ثلاثة أنواع من المعلومات وتحوّلها إلى خطة واحدة. تلك الخطة هي الـPIP، وفيها يُذكر أي مسار وأي امتحانات تنطبق عليك.',
)}

<div class="guide-steps">

<div class="guide-step">
  <div class="guide-step-num">1</div>
  <div class="guide-step-body">
    <h3>تستلم رسالة من DUO</h3>
    <p>تسجّل نفسك لدى البلدية. ثم تتحقّق DUO مما إذا كان عليك الاندماج. إن كان كذلك، تستلم
    رسالة. فيها أنك ملزَم بالاندماج وما عليك فعله الآن.</p>
    <p><strong>احتفظ بهذه الرسالة جيدًا.</strong> ستحتاج إليها لاحقًا.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">2</div>
  <div class="guide-step-body">
    <h3>المقابلة الشاملة (brede intake) لدى البلدية</h3>
    <p>تدعوك بلديتك إلى مقابلة واختبار قصير. إنه تعارف، لا امتحان. يتناول تعليمك وعملك وصحتك
    وعائلتك.</p>
    <p>وتؤدّي أيضًا <strong>اختبار القابلية للتعلّم (leerbaarheidstoets)</strong>. يقيس مدى سهولة
    تعلّمك لغة جديدة. وهكذا تختار البلدية المسار المناسب لك.</p>
    <p><strong>نصيحة:</strong> خذ معك شخصًا يتقن الهولندية أو لغتك. ويمكنك أيضًا طلب مترجم.</p>
    ${docentIn('ar', `لا تخف من اختبار القابلية للتعلّم. ليس امتحانًا تنجح فيه أو ترسب. ينظر فقط في مدى سهولة تعلّمك لغة جديدة، وتؤدّيه على الحاسوب. ولا حاجة للتحضير. تريد التعوّد على النظام مسبقًا؟ يمكنك ذلك في <a href="${SRC_LBT_OEFEN}" target="_blank" rel="noopener">بيئة التدريب الرسمية لـDUO</a>.`)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">3</div>
  <div class="guide-step-body">
    <h3>يُحدَّد الـPIP الخاص بك</h3>
    <p>بعد المقابلة الشاملة تضع البلدية <strong>الـPIP</strong> الخاص بك: الخطة الشخصية للاندماج
    والمشاركة. فيها مسارك، والدعم الذي تحصل عليه، ومدى كثافة برنامجك.</p>
    ${factIn('ar', 'يجب على البلدية تحديد الـPIP في موعد أقصاه ١٠ أسابيع بعد رسالة DUO. ألم تكن مسجّلًا لدى البلدية حينها؟ عندها تُحسب الأسابيع العشرة من تاريخ تسجيلك.', 'Besluit inburgering 2021, artikel 5.3', SRC_PIP, CHECKED)}
    <p><strong>التاريخ على الـPIP مهم.</strong> في اليوم التالي تبدأ مهلتك من ٣ سنوات. لا توافق على
    الـPIP؟ يمكنك الاعتراض. والرسالة المرفقة توضّح كيف.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">4</div>
  <div class="guide-step-body">
    <h3>تحصل على مسار تعليمي</h3>
    <p>مسار B1 أو مسار التعليم أو مسار Z. رأيتها أعلاه، إلى جانب المستويات الثلاثة. البلدية
    تختار، بناءً على المقابلة الشاملة واختبار القابلية للتعلّم.</p>
    <p>هل B1 بعيد المنال فعلًا في مسار B1؟ عندها يمكنك، ضمن شروط، أداء الامتحانات على مستوى A2.</p>
    ${factIn('ar', 'الانتقال من B1 إلى A2 ممكن في مسار B1 فقط. يجب أن تكون قد حضرت ٦٠٠ ساعة دروس لغة على الأقل في مدرسة تحمل علامة جودة، وأن تُثبت أنك بذلت جهدًا كافيًا.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}
    <p>كل شيء عن المسارات الثلاثة والقانونين تجده في
    <a href="/ar/الاندماج/أي-قانون-وأي-مسار">أي قانون وأي مسار ينطبق عليّ؟</a>.</p>
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">5</div>
  <div class="guide-step-body">
    <h3>تحضر الدروس وتشارك</h3>
    <p>الآن يبدأ العمل الحقيقي: دروس اللغة. وإلى جانبها تنتمي هذه الوحدات الثلاث إلى اندماجك:</p>
    <div class="guide-cards">
      <div class="guide-card">
        <div class="guide-card-icon">${I_CAP}</div>
        <h3>KNM</h3>
        <p><strong>معرفة المجتمع الهولندي.</strong> كيف تعمل هولندا، من العمل والدخل إلى السكن والرعاية الصحية. KNM جزء من كل المسارات.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_PEN}</div>
        <h3>PVT</h3>
        <p><strong>برنامج إعلان المشاركة.</strong> دورة قصيرة عن الحرية والمساواة والتضامن والمشاركة. تُنهيها بتوقيعك على إعلان المشاركة.</p>
      </div>
      <div class="guide-card">
        <div class="guide-card-icon">${I_WORK}</div>
        <h3>MAP</h3>
        <p><strong>وحدة سوق العمل والمشاركة.</strong> كيف تبحث عن عمل في هولندا: التقديم على الوظائف، وسيرتك الذاتية، وسوق العمل. MAP جزء من مسار B1 ومسار Z.</p>
      </div>
    </div>
    ${factIn('ar', 'يتناول KNM ثمانية محاور: العمل والدخل · آداب التعامل والقيم والأعراف · السكن · الصحة والرعاية الصحية · التاريخ والجغرافيا · المؤسسات · نظام الدولة وسيادة القانون · التعليم والتربية.', 'Regeling inburgering 2021 — eindtermen KNM (Stcrt. 2024, 15802)', SRC_KNM, CHECKED)}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">6</div>
  <div class="guide-step-body">
    <h3>تؤدّي الامتحانات</h3>
    <p>هل تتبع مسار B1 أو مسار التعليم؟ عندها تؤدّي ٥ امتحانات لدى DUO:</p>
    <div class="article-table-wrap">
    <table>
      <thead><tr><th>الامتحان</th><th>ما تفعله</th></tr></thead>
      <tbody>
        <tr><td><strong>القراءة</strong></td><td>تقرأ نصوصًا وتجيب عن أسئلة اختيار من متعدد</td></tr>
        <tr><td><strong>الاستماع</strong></td><td>تفهم مقاطع فيديو وصوت</td></tr>
        <tr><td><strong>الكتابة</strong></td><td>تكتب نصوصًا قصيرة، مثل البريد الإلكتروني أعلاه</td></tr>
        <tr><td><strong>المحادثة</strong></td><td>تسجّل إجاباتك على الحاسوب</td></tr>
        <tr><td><strong>KNM</strong></td><td>أسئلة عن المجتمع الهولندي</td></tr>
      </tbody>
    </table>
    </div>
    <p>تسجّل عبر <strong>Mijn Inburgering</strong>، موقع DUO. وأنت تختار متى تؤدّي أي امتحان.</p>
    ${factIn('ar', 'تؤدّي امتحانات المعرفة والامتحانات اللغوية على مستوى A2 في واحد من ستة مراكز امتحان: أمستردام أو آيندهوفن أو رايسفايك أو روتردام أو أوترخت أو زفوله. أما الامتحانات على مستوى B1 أو B2 فهي امتحان الدولة NT2، وله مراكزه الخاصة.', 'inburgeren.nl — Examenplaatsen', SRC_LOCATIES, CHECKED)}
    ${docentIn('ar', 'ألاحظ في دروسي أن معظم الدارسين يجدون القراءة والاستماع أسهل، بينما تكون الكتابة والمحادثة أصعب عليهم غالبًا. لذا ابدأ بالقراءة أو الاستماع، ووزّع وقتك جيدًا. ويُفضَّل ألا تخطّط لعدة امتحانات في يوم واحد — هكذا تحتفظ بطاقة كافية.')}
  </div>
</div>

<div class="guide-step">
  <div class="guide-step-num">7</div>
  <div class="guide-step-body">
    <h3>شهادتك، وما بعدها</h3>
    <p>هل نجحت في كل الأجزاء؟ عندها تحصل على <strong>شهادة الاندماج</strong>. تنزّلها من Mijn
    Diploma's لدى DUO. وبهذه الشهادة يمكنك لاحقًا طلب تصريح إقامة دائمة، أو الحصول على الجنسية
    الهولندية.</p>
    ${factIn('ar', 'تصل نتيجة امتحان المعرفة أو الامتحان اللغوي على مستوى A2 عادةً خلال ٨ أسابيع. أما الكتابة A2 والمحادثة A2 فتستغرق DUO حاليًا وقتًا أطول: حتى ١٦ أسبوعًا (إشعار ٣١ يوليو ٢٠٢٦). وإذا عرّض ذلك مهلتك للخطر، فتحصل تلقائيًا على ٦ أشهر إضافية.', 'inburgeren.nl — nieuwsbericht 31-07-2026', SRC_UITSLAG, CHECKED)}
    <p><strong>رسبت في جزء؟</strong> تعيد ذلك الجزء وحده. وما اجتزته يبقى. اقرأ
    <a href="/ar/المدونة/الرسوب-وإعادة-امتحان-الاندماج">رسبت في امتحان الاندماج؟ هذا ما يحدث الآن</a>.</p>
  </div>
</div>

</div>

${figure(
  'explainer-wat-moet-je-halen', 1400, 590,
  'ستة أجزاء منفصلة تتلاقى في شهادة واحدة بختم.',
  'شهادتك ليست امتحانًا واحدًا كبيرًا، بل مجموعة من أجزاء منفصلة. وما اجتزته يبقى مُجتازًا. وإذا رسبت في جزء واحد فإنك تعيد ذلك الجزء وحده.',
)}

<h2 id="kosten">كم يكلّف الاندماج؟</h2>

<p>كل امتحان يكلّف مالًا. حاليًا ٥٠ يورو لكل جزء لدى DUO. وللامتحانات الخمسة معًا ٢٥٠ يورو، إذا
اجتزت كل شيء من المرة الأولى. وتُضاف إلى ذلك تكلفة الدروس.</p>

${factIn('ar', 'وقت كتابة هذه الصفحة يكلّف كل جزء من الامتحان (القراءة والاستماع والكتابة والمحادثة وKNM) ٥٠ يورو. في ظل قانون Wet inburgering 2021 يكون المجموع ٢٥٠ يورو. تحقّق من الرسوم الحالية لدى DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, '28-07-2026')}

<p>من يدفع، وهل يمكنك الاقتراض، يعتمد على وضعك. تجد ذلك في
<a href="/ar/الاندماج/تكلفة-الاندماج">كم يكلّف الاندماج؟</a>.</p>

<h2 id="begin-met-oefenen">ابدأ التدريب</h2>

<p>تعرف الآن ما هو الاندماج وكيف تبدو المهمة. والباقي هو التدريب، بصيغة الامتحان. على هذا
الموقع تتدرّب بامتحانات تجريبية من إعداد ومراجعة مُدرِّسة NT2.</p>

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
          q: 'ما هو الاندماج (inburgering)؟',
          a: 'الاندماج يعني أن تتعلّم الهولندية وأن تُثبت أنك تعرف كيف تعمل هولندا. تؤدّي لذلك امتحانات لغوية وامتحان KNM لدى DUO، وتتابع بضع وحدات لدى البلدية. وإذا اجتزت كل شيء، تحصل على شهادة الاندماج.',
        },
        {
          q: 'كم من الوقت لديك للاندماج؟',
          a: '٣ سنوات. تبدأ المدة في اليوم التالي لتاريخ الـPIP. وفي حالات معيّنة، مثل المرض أو الولادة، يمكنك الحصول على وقت إضافي، مرة واحدة في كل فترة. أما المدة الفعلية فتختلف: بعض الناس ينتهون خلال سنة.',
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
          q: 'كم يكلّف الاندماج؟',
          a: 'حاليًا يكلّف كل امتحان لدى DUO ٥٠ يورو. وللامتحانات الخمسة معًا ٢٥٠ يورو، إذا اجتزت كل شيء من المرة الأولى. وتُضاف تكلفة الدروس. حاملو صفة اللجوء لا يدفعون دورتهم بأنفسهم؛ وغيرهم يمكنهم غالبًا الاقتراض من DUO. تحقّق من المبالغ الحالية لدى DUO.',
        },
        {
          q: 'أين يمكنني التدرّب مجانًا لامتحان الاندماج؟',
          a: 'لدى DUO عدد من الامتحانات التجريبية على inburgeren.nl. وإن أردت التدرّب أكثر، فهذا الموقع يوفّر امتحانات تجريبية مجانية للقراءة والاستماع والكتابة والمحادثة، مع شرح لكل سؤال.',
        },
      ],
    },
  },
};

export default guide;
