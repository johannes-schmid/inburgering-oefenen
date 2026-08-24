/**
 * Inburgering spoke — "Het ONA-examen".
 *
 * **Scoped against `pvt-map-en-ona` on purpose, the same way `lezen-examen` is scoped against the
 * Lezen blog post.** That guide answers "welke van de drie onderdelen is van mij?" and gives ONA
 * one summarising section; this page is for the reader who has already established that ONA is
 * theirs and now has to build the portfolio. Its ground is the eight resultaatkaarten one by one,
 * the timeline the whole thing actually takes, and the eindgesprek-versus-cursus decision. If a
 * future edit makes either page the general "alles over ONA" page, one of them has to go — one
 * query, one owning page.
 *
 * Every ONA fact here is DUO's, from the kennisexamens page and the ONA-toelichting PDF, and every
 * one of them is already carried in `pvt-map-en-ona.ts` — this page states them at more length, it
 * does not add a claim. Three that decide the page:
 *
 *  - **ONA is Wet 2013 only** (`SEO/facts.md` §7, verified by clicking the tabs on DUO's own exam
 *    page). Under Wet 2021 the equivalent is the MAP, at the gemeente, and **nobody does both.**
 *    The page says so in its first paragraph, because the largest group arriving on an ONA query
 *    should be reading about the MAP instead.
 *  - **€40**, §4 — under §4's volatility rule, so it is written as "op dit moment" beside DUO's
 *    own link and never as a bare figure in a table.
 *  - **The waits are the story**: 6 weeks to assess the portfolio, again 6 on a rejection, ~6 to
 *    the eindgesprek, uitslag within 8. That is the fact a candidate can act on, and it is why
 *    this page exists as more than a definition.
 *
 * No pass norm and no "500 punten" (§9); `tests-unit/guides.test.ts` enforces both.
 *
 * **This guide is in fase 3 of `data/guides/phases.ts`** — every published `inburgering` guide must
 * sit in exactly one fase or the hub cannot reach it. See that file's header.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CLIPBOARD, I_USERS, I_CAP, I_CLOCK, I_CHECK, I_X, I_ALERT,
  docent, note, inlineCta, factTwo,
} from './kit';

export const SRC_KENNIS = 'https://www.inburgeren.nl/examen-doen/inhoud-kennisexamens.jsp';
export const SRC_ONA_PDF = 'https://www.inburgeren.nl/images/ona-toelichting.pdf';
export const SRC_EXAMENS = 'https://www.inburgeren.nl/examen-doen/index.jsp';
export const SRC_BETALEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
export const SRC_SCHOLEN = 'https://www.zoekinburgerschool.nl/';
export const CHECKED = '24-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'ona-examen',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-24',
  pillar: false,
  coverGlyph: 'cards',

  title: 'Het ONA-examen: portfolio, eindgesprek en planning',
  description:
    'ONA doe je onder de Wet 2013: acht resultaatkaarten, zes weken nakijken en dan een eindgesprek of 64 uur cursus. Zo bouw je het op zonder tijd te verliezen.',

  datePublished: '2026-08-24',
  dateModified: '2026-08-24',
  dateLabel: '24 augustus 2026',
  breadcrumb: 'Het ONA-examen',
  eyebrow: 'Onderdeel',

  heroTitle: 'Het ONA-examen',
  heroSubtitle:
    'Oriëntatie op de Nederlandse Arbeidsmarkt. Geen toets die je op een ochtend doet, maar een portfolio dat je zelf opbouwt — en waar de meeste mensen te laat aan beginnen.',
  readingMinutes: 9,

  articleHtml: `
<h2 id="is-ona-van-mij">Eerst dit: is ONA wel van jou?</h2>

<p>Veel mensen lezen over ONA terwijl ze het niet hoeven te doen. ONA hoort bij de
<strong>Wet inburgering 2013</strong>, de oude wet. Ben je inburgeringsplichtig geworden vanaf
1 januari 2022, dan val je onder de Wet 2021 en doe je in plaats daarvan de
<strong>MAP</strong> bij je gemeente. Niemand doet allebei.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Je doet ONA als…</p>
    <ul>
      <li>${I_CHECK}<span>Je bent inburgeringsplichtig onder de <strong>Wet 2013</strong>, en dat werd je op of na 1 oktober 2017</span></li>
      <li>${I_CHECK}<span>Je burgert <strong>vrijwillig</strong> in</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Je doet géén ONA als…</p>
    <ul>
      <li>${I_X}<span>Je valt onder de <strong>Wet 2021</strong> — dan doe je de MAP bij je gemeente</span></li>
      <li>${I_X}<span>Je moest vóór 1 januari 2015 beginnen met inburgeren</span></li>
      <li>${I_X}<span>Je hebt een Nederlandstalig diploma van een entreeopleiding (mbo niveau 1)</span></li>
      <li>${I_X}<span>Je kreeg vrijstelling omdat je in Nederland hebt gewerkt</span></li>
    </ul>
  </div>
</div>

${factTwo('Onder de Wet 2013 doen kandidaten die vanaf 1 oktober 2017 inburgeringsplichtig werden de examens Lezen, Luisteren, Schrijven, Spreken, KNM, ONA en het participatieverklaringstraject. Het examen ONA doet u ook als u vrijwillig inburgert. Onder de Wet 2021 bepalen uw PIP en uw leerroute welke onderdelen u doet.', [['inburgeren.nl — Examen doen', SRC_EXAMENS], ['inburgeren.nl — Kennisexamens en ONA', SRC_KENNIS]], CHECKED)}

${note('Weet je niet zeker onder welke wet je valt? Kijk in <strong>Mijn Inburgering</strong>. Daar staat welke onderdelen voor jou gelden. Dat is de enige lijst die klopt — niet die van je buurman en niet die van een forum.')}

<h2 id="hoe-werkt-het">Hoe het examen is opgebouwd</h2>

<p>ONA bestaat uit twee delen, en het tweede begint pas als het eerste is goedgekeurd. Dat is de
belangrijkste zin op deze pagina: je kunt de twee delen <strong>niet tegelijk</strong> doen.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Je maakt het portfolio</h3>
    <p>Acht resultaatkaarten, met bewijsstukken. Je stuurt ze in via Mijn Inburgering en betaalt daarbij het examengeld.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>DUO kijkt het na — ongeveer zes weken</h3>
    <p>Afgekeurd? Je past het aan en stuurt opnieuw in. En dan begint dat nakijken opnieuw.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Je kiest: eindgesprek of cursus</h3>
    <p>Een eindgesprek bij DUO, of 64 uur ONA-cursus bij een erkende school. Eén van de twee, niet allebei.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>De uitslag</h3>
    <p>Binnen acht weken, in Mijn Inburgering.</p>
  </div></div>
</div>

<h2 id="acht-kaarten">De acht resultaatkaarten</h2>

<p>Elke kaart is een opdracht met een resultaat dat je moet laten zien. Bij sommige kaarten hoort een
bewijsstuk: een vacature die je hebt gevonden, een verslag van een gesprek, een sollicitatiebrief die
je echt hebt verstuurd. In de toelichting van DUO staat per kaart precies wat er wordt gevraagd.</p>

<div class="guide-cards">
  ${card(I_CLIPBOARD, '1. Beroepenoriëntatie', 'Welke beroepen bestaan er in Nederland, en welke daarvan passen bij jou?')}
  ${card(I_CLIPBOARD, '2. Realistisch beroepsbeeld', 'Wat houdt dat beroep in de praktijk in? Werktijden, opleiding, wat je echt de hele dag doet.')}
  ${card(I_CLIPBOARD, '3. Je eigenschappen kennen', 'Wat kun je goed, wat vind je leuk, en waar loop je op vast?')}
  ${card(I_CLIPBOARD, '4. Beroepskansen', 'Hoe groot is de kans op werk in dat beroep, in jouw regio?')}
  ${card(I_CLIPBOARD, '5. Beroepscompetenties', 'Wat moet je kunnen voor dat werk — en wat mis je nu nog?')}
  ${card(I_CLIPBOARD, '6. Netwerk opbouwen', 'Wie ken je al, en hoe gebruik je dat om aan werk te komen?')}
  ${card(I_CLIPBOARD, '7. Werk vinden', 'Hoe zoek je vacatures, en hoe schrijf je een sollicitatie?')}
  ${card(I_CLIPBOARD, '8. Werkcultuur', 'Hoe gaat het eraan toe op een Nederlandse werkvloer? Te laat komen, tutoyeren, ziek melden.')}
</div>

${note('<strong>DUO helpt niet bij het invullen</strong> en heeft geen voorbeeldportfolio. Dat is geen onwil: het portfolio moet over jóuw beroep en jouw situatie gaan, en een voorbeeld zou iedereen hetzelfde laten inleveren. Hulp vraag je aan je taalschool of je klantmanager.')}

${docent('Kies bij kaart 1 een beroep dat je echt overweegt, niet het beroep waarvan je denkt dat het goed staat. Alle acht kaarten bouwen op die keuze voort, en bij het eindgesprek merken ze het direct als je over een beroep praat waar je niets van weet. Ik heb mensen het hele portfolio zien overdoen om die reden.')}

<h2 id="deel-twee">Eindgesprek of 64 uur cursus?</h2>

<p>Is je portfolio goedgekeurd, dan kies je hoe je het examen afmaakt. Deze keuze is definitief, dus
lees beide kolommen voordat je hem maakt.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Het eindgesprek</h3>
      <p class="compare-when">Bij DUO</p>
    </div>
    <div class="compare-rows">
      ${row('Wachttijd', 'Ongeveer 6 weken na je aanmelding')}
      ${row('Met wie', '2 mensen van DUO')}
      ${row('Waarover', 'Vragen over jouw eigen resultaatkaarten')}
      ${row('Hoe lang', 'Ongeveer 30 minuten')}
      ${row('Kosten', 'Zit bij het examengeld in')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>64 uur ONA-cursus</h3>
      <p class="compare-when">Bij een erkende school</p>
    </div>
    <div class="compare-rows">
      ${row('Wachttijd', 'Geen — je begint wanneer de school kan')}
      ${row('Waar', `Een school op <a href="${SRC_SCHOLEN}" target="_blank" rel="noopener">zoekinburgerschool.nl</a> die ONA aanbiedt`)}
      ${row('Kosten', 'De school bepaalt de cursusprijs; die komt er apart bij')}
      ${row('Daarna', 'Geen eindgesprek meer nodig')}
      ${row('Doorgeven', 'De school meldt je uren digitaal aan DUO')}
    </div>
  </div>
</div>

${factTwo('Het examen ONA bestaat uit twee delen: opdrachten maken (portfolio) en daarna 64 uur ONA-cursus óf een eindgesprek. Het portfolio bestaat uit 8 resultaatkaarten met bewijzen; het nakijken kan 6 weken duren. Na goedkeuring meldt u zich aan voor het eindgesprek, dat binnen 6 weken na aanmelding plaatsvindt, met 2 mensen van DUO, ongeveer 30 minuten duurt en gaat over uw resultaatkaarten. De uitslag krijgt u binnen 8 weken.', [['inburgeren.nl — Kennisexamens en ONA', SRC_KENNIS], ['DUO — Toelichting ONA (pdf)', SRC_ONA_PDF]], CHECKED)}

${note('Stuur je je portfolio <strong>per post</strong> in omdat inloggen niet lukt? Dan kun je het examen <strong>niet</strong> met de 64-uurscursus afronden en doe je het eindgesprek. Weet dat vóórdat je die route kiest.')}

<div class="verdict warn">
  <p class="verdict-answer">Kies op tijd, niet op smaak</p>
  <p>Heb je nog ruim de tijd in je termijn en wil je liever geen gesprek? Dan is de cursus een
  redelijke keuze. Zit je krap, dan is de cursus van 64 uur meestal <em>langzamer</em>, niet
  sneller: je moet een school vinden die het aanbiedt, en die uren moeten er nog in.</p>
</div>

<h2 id="wat-het-kost">Wat het kost</h2>

<p>Het examen ONA kost op dit moment <strong>&euro;40</strong>. Dat betaal je bij het insturen van
je resultaatkaarten via Mijn Inburgering. Kies je daarna voor de cursus in plaats van het
eindgesprek, dan komen de kosten van die cursus daar apart bovenop — die bepaalt de school.</p>

${fact('Het examen ONA kost € 40. U betaalt per examenonderdeel, via Mijn Inburgering. Deze bedragen kunnen veranderen; kijk de actuele tarieven na bij DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_BETALEN, CHECKED)}

<h2 id="planning">De planning is het echte examen</h2>

<p>Tel de wachttijden bij elkaar op en je ziet waarom dit onderdeel mensen in de problemen brengt,
ook als ze alles goed doen.</p>

<div class="guide-cards">
  ${card(I_CLOCK, 'Portfolio nakijken', 'Ongeveer 6 weken. Bij afkeuring nog eens 6 weken voor je aangepaste versie.')}
  ${card(I_CLOCK, 'Wachten op het eindgesprek', 'Ongeveer 6 weken na je aanmelding.')}
  ${card(I_CLOCK, 'Uitslag', 'Binnen 8 weken na het gesprek.')}
  ${card(I_ALERT, 'Bij elkaar', 'Een half jaar of meer — zonder dat je iets fout hebt gedaan.')}
</div>

<p>Dat is dus niet iets wat je in je laatste maanden nog even doet. Begin met kaart 1 zodra je weet
dat ONA voor jou geldt, en werk eraan terwijl je taalexamens lopen. Die twee zitten elkaar niet in
de weg.</p>

${docent('Ik zie mensen vaker vastlopen op deze planning dan op de taal. Het portfolio is niet moeilijk — het is werk. En werk dat je uitstelt omdat er geen examendatum op staat, is precies het werk dat te laat klaar is.')}

${inlineCta('Reken je eigen datums uit', 'De tijdlijn-maker zet je termijn, je examens en de wachttijden op één tijdlijn. Geen DigiD, geen BSN.', '/inburgering/tools/tijdlijn', 'Maak je tijdlijn')}

<h2 id="niet-gehaald">En als het eindgesprek niet lukt?</h2>

<p>Dan stuur je je portfolio opnieuw in, betaal je het examen opnieuw en doe je een nieuw
eindgesprek. Datzelfde geldt als je het gesprek te laat afzegt. Wil je weten waarom je niet
geslaagd bent, dan kun je dat per e-mail bij DUO opvragen.</p>

<p>Reken die hele keten mee. Samen met de wachttijd op je taalexamens is dit het onderdeel waar
termijnen het snelst knellen.</p>

${inlineCta('Werk intussen aan je taalexamens', 'Terwijl je portfolio wordt nagekeken, kun je gewoon doorgaan met oefenen. Tien vragen gratis, met uitleg.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>ONA hoort bij de <strong>Wet 2013</strong>. Onder 2021 doe je de MAP.</li>
  <li>Deel 1: portfolio van <strong>8 resultaatkaarten</strong>.</li>
  <li>Nakijken duurt ongeveer 6 weken — bij afkeuring nog eens 6.</li>
  <li>Deel 2: eindgesprek van ~30 minuten, of 64 uur cursus.</li>
  <li>Uitslag binnen 8 weken. Kosten op dit moment &euro;40.</li>
  <li>Reken op een half jaar. Begin vroeg.</li>
</ul>`,

  faq: [
    {
      q: 'Moet ik ONA doen of de MAP?',
      a: 'Dat hangt af van je wet. ONA hoort bij de Wet inburgering 2013 en doe je bij DUO, met een portfolio en daarna een eindgesprek of een cursus. De MAP hoort bij de Wet inburgering 2021 en doe je bij je gemeente. Niemand doet ze allebei. In Mijn Inburgering staat wat voor jou geldt.',
    },
    {
      q: 'Uit hoeveel onderdelen bestaat het ONA-portfolio?',
      a: 'Uit acht resultaatkaarten, van beroepenoriëntatie tot werkcultuur, met bewijsstukken erbij. Je stuurt ze samen in via Mijn Inburgering en betaalt daarbij het examengeld. DUO helpt niet bij het invullen en heeft geen voorbeeldportfolio.',
    },
    {
      q: 'Hoe lang duurt het ONA-examen in totaal?',
      a: 'Reken op een half jaar of meer. Het nakijken van je portfolio duurt ongeveer zes weken, bij afkeuring nog eens zes weken voor de aangepaste versie. Daarna wacht je ongeveer zes weken op het eindgesprek, en de uitslag komt binnen acht weken.',
    },
    {
      q: 'Wat is beter: het eindgesprek of de cursus van 64 uur?',
      a: 'Dat hangt van je tijd af. Het eindgesprek duurt ongeveer dertig minuten en zit bij het examengeld in, maar je wacht er ongeveer zes weken op. De cursus kent geen wachttijd bij DUO, maar je moet een school vinden die ONA aanbiedt en die 64 uur kosten tijd en geld.',
    },
    {
      q: 'Wat kost het ONA-examen?',
      a: 'Op dit moment €40, te betalen bij het insturen van je resultaatkaarten via Mijn Inburgering. Kies je voor de cursus van 64 uur in plaats van het eindgesprek, dan komen de kosten van die cursus daar apart bovenop; die bepaalt de school zelf. Tarieven kunnen veranderen.',
    },
    {
      q: 'Wat gebeurt er als mijn portfolio wordt afgekeurd?',
      a: 'Dan pas je de kaarten aan die niet goed waren en stuur je het portfolio opnieuw in. Het nakijken begint dan opnieuw en duurt weer ongeveer zes weken. Daarom is het verstandig om je kaarten eerst door je taalschool of klantmanager te laten bekijken.',
    },
  ],

  related: ['pvt-map-en-ona', 'welke-wet-en-welke-route', 'boete-en-termijn', 'inburgering-stappenplan'],
  relatedPosts: [],

  ctaTitle: 'Werk intussen aan je taalexamens',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
