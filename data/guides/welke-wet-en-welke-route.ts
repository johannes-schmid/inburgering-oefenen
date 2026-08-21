/**
 * Spoke 2 of the Inburgering cluster: "Welke wet en welke route?"
 *
 * Owner manuscript "2. Welke wet en welke route?" (20-08-2026), fact-checked against
 * `SEO/facts.md` §10 the same day. Four corrections:
 *
 *  - **The Z-route's 800 + 800 holds for asielstatushouders only** (Besluit art. 3.14).
 *    Gezins- en overige migranten do 800 cursusuren and the eindgesprek, without the 800
 *    participation hours. The manuscript's flat "800 uur + 800 uur" over-states the obligation
 *    for the audience that pays for this site.
 *  - **"Duurt ongeveer 1,5 jaar" for the onderwijsroute is dropped.** No official source states
 *    a duration; `SEO/facts.md` forbids an unsourced number, and a wrong one here reads as a
 *    promise about someone's next eighteen months.
 *  - **The Wet 2013 termijn row says "kijk in je brief"** rather than "3 jaar". The three years
 *    are verified for the Wet 2021 (art. 11); for the 2013 cohorts the end date is per person
 *    and the brief is where it actually stands.
 *  - **MAP is not in the onderwijsroute** (Wet art. 8 lid 3). PVT is, in all three.
 *
 * The termijn bar is three equal segments on purpose — a to-scale timeline would invent a
 * schedule that is nobody's. See the CSS comment in `app/globals.css`.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_MAIL, I_ROUTE, I_CAP, I_HOME, I_CLOCK,
  docent, docentIn, note, inlineCta, factIn, factTwo, figure, figureSplit,
} from './kit';

const SRC_NIEUWE_WET = 'https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering';
const SRC_ROUTES = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
const SRC_AFSCHALEN = 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&amp;artikel=5.5';
const SRC_ZROUTE = 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&amp;artikel=3.14';
const SRC_TERMIJN = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&amp;artikel=11';
const SRC_MAP = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&amp;artikel=8';
const CHECKED = '20-08-2026';

const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'welke-wet-en-welke-route',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-20',
  pillar: false,

  title: 'Welke inburgeringswet en welke route geldt voor jou?',
  description:
    'Wet inburgering 2013 of 2021? Eén datum bepaalt het. Zie het verschil, de drie leerroutes, wanneer je van B1 naar A2 mag en hoeveel tijd je hebt.',

  datePublished: '2026-08-20',
  dateModified: '2026-08-20',
  dateLabel: '20 augustus 2026',
  breadcrumb: 'Welke wet en route',
  eyebrow: 'Wet en leerroute',

  heroTitle: 'Welke wet en welke route?',
  heroSubtitle:
    'Nederland heeft twee inburgeringswetten naast elkaar. Welke voor jou geldt, bepaalt wie je helpt, welke route je volgt en welk taalniveau je moet halen.',
  heroImage: {
    base: 'welke-wet-en-welke-route',
    hasWebp: false,
    alt: 'Een bospad dat zich in twee richtingen splitst',
    position: 'center 50%',
    credit: 'James Wheeler (Pexels)',
  },
  readingMinutes: 5,

  articleHtml: `
<div class="verdict warn">
  <p class="verdict-answer">Eén datum bepaalt alles</p>
  <p>Werd je <strong>vóór 1 januari 2022</strong> inburgeringsplichtig? Dan geldt de Wet
  inburgering 2013. Werd je het <strong>op of na</strong> die dag? Dan de Wet inburgering 2021.
  Die startdatum staat in je brief van DUO.</p>
  <p>Let op: de wet <em>heet</em> 2021, maar ging pas in op <strong>1 januari 2022</strong>. Veel
  websites halen dat door elkaar. Kijk dus naar de datum in je brief, niet naar de naam van de wet.</p>
</div>

<h2 id="twee-wetten">De twee wetten naast elkaar</h2>

${figure(
  'explainer-twee-wetten', 1400, 616,
  'Een tijdlijn met één streep erdoor op 1 januari 2022: wie daarvoor inburgeringsplichtig werd valt onder de oude wet, wie daarna onder de nieuwe.',
  'Eén datum bepaalt onder welke wet je valt. Niet de dag dat je aankwam, en niet de dag dat je begon met een cursus: de dag waarop je inburgeringsplichtig werd. Die staat in je brief van DUO.',
  figureSplit(
    ['Wet inburgering 2013', 'Je werd vóór 1 januari 2022 inburgeringsplichtig.'],
    ['Wet inburgering 2021', 'Je werd op of na 1 januari 2022 inburgeringsplichtig. Dit geldt voor bijna iedereen die nu begint.'],
    'right',
  ),
)}

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Wet inburgering 2021</h3>
      <p class="compare-when">Plichtig op of na 1 januari 2022</p>
    </div>
    <div class="compare-rows">
      ${row('Wie helpt jou', 'De gemeente. Je krijgt een gesprek en een persoonlijk plan: je PIP.')}
      ${row('Taalniveau', 'B1. In de Z-route is het doel A1.')}
      ${row('Wat je doet', 'Je leerroute afmaken, plus KNM, MAP en PVT.')}
      ${row('Hoeveel tijd', '3 jaar, vanaf de dag na de datum van je PIP.')}
      ${row('Waar zie je het', 'Mijn Inburgering en je PIP.')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Wet inburgering 2013</h3>
      <p class="compare-when">Plichtig vóór 1 januari 2022</p>
    </div>
    <div class="compare-rows">
      ${row('Wie helpt jou', 'Je regelt het zelf. Je kiest zelf een cursus, of je leert zelfstandig.')}
      ${row('Taalniveau', 'A2 of hoger.')}
      ${row('Wat je doet', 'Lezen, Luisteren, Schrijven, Spreken en KNM, plus ONA. Werd je plichtig vanaf 1 oktober 2017, dan ook PVT.')}
      ${row('Hoeveel tijd', 'Je einddatum staat in je brief van DUO.')}
      ${row('Waar zie je het', 'Mijn Inburgering.')}
    </div>
  </div>
</div>

${fact('De Wet inburgering 2021 is in werking getreden op 1 januari 2022. Wie daarvóór inburgeringsplichtig werd, blijft onder de Wet inburgering 2013 vallen.', 'Rijksoverheid — Nieuwe Wet inburgering', SRC_NIEUWE_WET, CHECKED)}

<p>De rest van deze pagina gaat over de <strong>Wet inburgering 2021</strong>. Die geldt voor
bijna iedereen die nu begint.</p>

${docent('Brief kwijt? Log in op Mijn Inburgering met je DigiD. Daar zie je in één scherm welke wet, welke route en welke examens voor jou gelden. Ik begin elk intakegesprek met dat scherm — het scheelt een half uur raden.')}

<h2 id="drie-routes">De drie leerroutes</h2>

<p>Onder de Wet 2021 volg je één van drie routes. Je kiest hem niet zelf: de gemeente bepaalt
welke route bij je past, op basis van de brede intake en de leerbaarheidstoets. In je PIP staat
welke het is geworden.</p>

${figure(
  'explainer-drie-routes', 1244, 606,
  'Eén startpunt splitst zich in drie aparte paden, die elk op een andere bestemming uitkomen: een taalniveau, een schooldiploma, of meedoen in de samenleving.',
  'De drie routes zijn geen niveaus van hetzelfde traject, maar drie aparte wegen met drie verschillende eindpunten. Van boven naar beneden: de B1-route, de onderwijsroute en de Z-route. De B1-route is oranje: dat is de standaardroute, waar de meeste inburgeraars in terechtkomen.',
)}

<div class="route-grid">
  <div class="route-card">
    <div class="route-accent"></div>
    <div class="route-top"><h3>B1-route</h3><span class="route-level">B1</span></div>
    <div class="route-rows">
      ${row('Voor wie', 'De meeste inburgeraars. Dit is de standaardroute.')}
      ${row('Wat je doet', 'Nederlands leren tot B1, plus KNM, MAP en PVT.')}
      ${row('Hoe je afsluit', 'Examens bij DUO.')}
      ${row('Makkelijker mogelijk?', 'Ja — afschalen naar A2 kan, onder voorwaarden.')}
    </div>
  </div>
  <div class="route-card r-onderwijs">
    <div class="route-accent"></div>
    <div class="route-top"><h3>Onderwijsroute</h3><span class="route-level">B1 of hoger</span></div>
    <div class="route-rows">
      ${row('Voor wie', 'Je wilt naar het mbo, hbo of de universiteit. Vooral jongeren, maar er is geen leeftijdsgrens.')}
      ${row('Wat je doet', 'Een taalschakeltraject: Nederlands, KNM, PVT en leren studeren.')}
      ${row('Hoe je afsluit', 'Examens bij DUO, en daarna door naar je opleiding.')}
      ${row('Makkelijker mogelijk?', 'Nee.')}
    </div>
  </div>
  <div class="route-card r-z">
    <div class="route-accent"></div>
    <div class="route-top"><h3>Z-route</h3><span class="route-level">A1</span></div>
    <div class="route-rows">
      ${row('Voor wie', 'Leren gaat moeilijk. De B1-route en de onderwijsroute zijn te zwaar.')}
      ${row('Wat je doet', 'Minimaal 800 uur cursus: Nederlands en KNM samen. Ben je asielstatushouder, dan komen daar 800 uur meedoen en activering bij.')}
      ${row('Hoe je afsluit', 'Een eindgesprek bij de gemeente. Geen KNM-examen.')}
      ${row('Makkelijker mogelijk?', 'Niet van toepassing. Haal je toch A2? Dan mag je alsnog examen doen.')}
    </div>
  </div>
</div>

${factTwo('In de Z-route gelden voor asielstatushouders 800 cursusuren (Nederlands en KNM samen) plus 800 uur participatie en een eindgesprek; voor gezinsmigranten en overige migranten gelden de 800 cursusuren en het eindgesprek, zonder de 800 participatie-uren. MAP hoort bij de B1-route en de Z-route, de onderwijsroute is ervan uitgezonderd; PVT is in alle drie de routes verplicht.', [['Besluit inburgering 2021, artikel 3.14', SRC_ZROUTE], ['Wet inburgering 2021, artikel 8', SRC_MAP]], CHECKED)}

<h2 id="afschalen">Afschalen van B1 naar A2</h2>

<p>Lukt B1 echt niet? Dan mag je in de <strong>B1-route</strong> je taalexamens op A2 doen. In de
onderwijsroute kan dat niet.</p>

${figure(
  'explainer-afschalen', 1124, 712,
  'Eén pijl omlaag van B1 naar A2, met een slot erop: de stap gaat maar één kant op en alleen als je aan de voorwaarden voldoet.',
  'Afschalen gaat één kant op. Je kunt van B1 naar A2, maar niet terug naar B1 — en alleen als je aan beide voorwaarden hieronder voldoet.',
)}

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Er zijn twee voorwaarden</p>
    <ul>
      <li>${I_CHECK}<span>Je hebt minstens <strong>600 uur les</strong> gehad bij een school met een keurmerk</span></li>
      <li>${I_CHECK}<span>Je hebt aantoonbaar <strong>je best gedaan</strong> tijdens je inburgering</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Let op</p>
    <ul>
      <li>${I_X}<span>De <strong>gemeente beslist</strong>, niet jij en niet je school</span></li>
      <li>${I_X}<span>Alleen de <strong>vier taalexamens</strong> gaan naar A2. KNM verandert niet</span></li>
      <li>${I_X}<span>Doe je examen op een lager niveau dan in je PIP staat, dan zijn je eerste twee pogingen <strong>niet gratis</strong></span></li>
    </ul>
  </div>
</div>

${fact('Afschalen naar A2 kan alleen in de B1-route, na ten minste 600 uur taalles bij een taalschool met keurmerk en bij aantoonbaar voldoende inspanning. De gemeente controleert dit.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}

${inlineCta('Twijfel je tussen B1 en A2?', 'Doe een gratis A2-oefenexamen en kijk wat je nu al haalt. Tien vragen, met uitleg.', '/oefenen', 'Gratis oefenexamen')}

<h2 id="hoeveel-tijd">Hoeveel tijd heb je?</h2>

<p>Onder de Wet 2021 heb je <strong>3 jaar</strong>. Die termijn begint niet bij je brief en niet
bij je eerste les, maar op de dag ná de datum die op je PIP staat.</p>

<div class="termijn">
  <div class="termijn-ends">
    <div class="termijn-end"><strong>Start</strong>de dag na de datum van je PIP</div>
    <div class="termijn-end"><strong>Einde</strong>alles moet klaar zijn</div>
  </div>
  <div class="termijn-bar">
    <div class="termijn-seg">Jaar 1</div>
    <div class="termijn-seg s2">Jaar 2</div>
    <div class="termijn-seg s3">Jaar 3</div>
    <div class="termijn-seg s-extra">Extra tijd?</div>
  </div>
  <p class="termijn-note">In deze drie jaar moet alles klaar zijn: je leerroute, KNM, MAP en PVT.
  In bepaalde situaties — ziekte, een bevalling, eerst leren lezen en schrijven — kun je extra
  tijd krijgen. Dat kan maar één keer per periode.</p>
</div>

${fact('De inburgeringstermijn is 3 jaar en begint op de dag na de dagtekening van het PIP. Wordt je PIP later herzien, dan verschuift die startdatum niet.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}

<h2 id="en-nu">En nu?</h2>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_ROUTE}</div>
    <h3>Het hele traject in 7 stappen</h3>
    <p>Van de brief van DUO tot je diploma: wat er gebeurt, in welke volgorde, en welke termijnen
    erbij horen.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_CLOCK}</div>
    <h3>Wat kost het?</h3>
    <p>Wie betaalt je cursus, wat kost een examen, en wanneer zijn je eerste twee pogingen gratis.</p>
  </div>
</div>
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Vóór 1 januari 2022 plichtig? Wet 2013. Daarna? Wet 2021.</li>
  <li>Onder de Wet 2021 helpt de gemeente je en staat alles in je PIP.</li>
  <li>Drie routes: B1, onderwijs en Z. De gemeente kiest.</li>
  <li>Afschalen naar A2 kan alleen in de B1-route, na 600 lesuren.</li>
  <li>Je hebt 3 jaar, gerekend vanaf de dag na je PIP.</li>
</ul>`,

  faq: [
    {
      q: 'Val ik onder de Wet inburgering 2013 of 2021?',
      a: 'Dat hangt af van de datum waarop je inburgeringsplichtig werd. Was dat vóór 1 januari 2022, dan geldt de Wet 2013. Was het op of na die dag, dan de Wet 2021. Je startdatum staat in de brief van DUO en in Mijn Inburgering.',
    },
    {
      q: 'Kan ik zelf mijn leerroute kiezen?',
      a: 'Nee. De gemeente bepaalt je leerroute op basis van de brede intake en de leerbaarheidstoets, en legt die vast in je PIP. Ben je het er niet mee eens, dan kun je bezwaar maken; in de brief bij je PIP staat hoe dat gaat.',
    },
    {
      q: 'Mag ik examen doen op A2 in plaats van B1?',
      a: 'Alleen in de B1-route, en alleen als je minstens 600 uur les hebt gehad bij een school met een keurmerk en je aantoonbaar je best hebt gedaan. De gemeente beslist. Alleen de vier taalexamens gaan dan naar A2 — KNM verandert niet.',
    },
    {
      q: 'Doe ik in de Z-route ook examen?',
      a: 'Meestal niet. De Z-route sluit je af met een eindgesprek bij de gemeente, en er is geen KNM-examen. Haal je tijdens de route toch het niveau A2, dan mag je alsnog examen doen bij DUO en een diploma aanvragen.',
    },
    {
      q: 'Wanneer begint mijn inburgeringstermijn van 3 jaar?',
      a: 'Op de dag na de dagtekening van je PIP — dus niet bij de brief van DUO en niet bij je eerste les. Wordt je PIP later herzien, dan schuift die startdatum niet mee.',
    },
  ],

  related: ['moet-ik-inburgeren', 'inburgering-stappenplan', 'wat-kost-inburgeren'],
  relatedPosts: ['taalniveaus-a1-a2-b1-nederlands', 'inburgeringsexamen-a2-uitleg'],

  ctaTitle: 'B1 of A2 — waar sta je nu?',
  ctaDesc: 'Doe een gratis oefenexamen van tien vragen en zie meteen wat je al kunt.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis oefenexamen',

  /* English and Arabic bodies, 20-08-2026. Same terminology rule as the other spokes: official
   * Dutch terms stay Dutch and are glossed once. Here that matters most for "afschalen" — there
   * is no English word a caseworker will recognise, and the reader has to be able to say it. */
  translations: {
    en: {
      title: 'Which integration act and which route applies to you?',
      breadcrumb: 'Which law and route',
      dateLabel: '20 August 2026',
      eyebrow: 'Act and learning route',
      heroTitle: 'Which law and which route?',
      heroSubtitle:
        'The Netherlands runs two integration acts side by side. Which one applies to you decides who helps you, which route you follow and what language level you must reach.',
      description:
        'Integration Act 2013 or 2021? One date decides. See the difference, the three learning routes, when you may drop from B1 to A2, and how long you have.',
      articleHtml: `
<div class="verdict warn">
  <p class="verdict-answer">One date decides everything</p>
  <p>Did your integration duty start <strong>before 1 January 2022</strong>? Then the Wet
  inburgering 2013 applies. Did it start <strong>on or after</strong> that day? Then it is the Wet
  inburgering 2021. That start date is in your letter from DUO.</p>
</div>

${note('The act is called 2021 but only took effect on <strong>1 January 2022</strong>. A lot of websites confuse the two. So go by the date in your letter, not by the name of the act.')}

${docentIn('en', 'Lost the letter? Log in to Mijn Inburgering with your DigiD. One screen shows you which act, which route and which exams apply to you. I start every intake conversation with that screen — it saves half an hour of guessing.')}

<h2 id="twee-wetten">The two acts side by side</h2>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Wet inburgering 2021</h3>
      <p class="compare-when">Duty started on or after 1 January 2022</p>
    </div>
    <div class="compare-rows">
      ${row('Who helps you', 'Your municipality. You get an interview and a personal plan: your PIP.')}
      ${row('Language level', 'B1. In the Z-route the target is A1.')}
      ${row('What you do', 'Complete your learning route, plus KNM, MAP and PVT.')}
      ${row('How long', '3 years, from the day after the date on your PIP.')}
      ${row('Where you see it', 'Mijn Inburgering and your PIP.')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Wet inburgering 2013</h3>
      <p class="compare-when">Duty started before 1 January 2022</p>
    </div>
    <div class="compare-rows">
      ${row('Who helps you', 'You arrange it yourself. You choose a course, or you study independently.')}
      ${row('Language level', 'A2 or higher.')}
      ${row('What you do', 'Reading, Listening, Writing, Speaking and KNM, plus ONA. If your duty started on or after 1 October 2017, PVT as well.')}
      ${row('How long', 'Your end date is in your letter from DUO.')}
      ${row('Where you see it', 'Mijn Inburgering.')}
    </div>
  </div>
</div>

${factIn('en', 'The Wet inburgering 2021 took effect on 1 January 2022. Anyone whose integration duty started before that date remains under the Wet inburgering 2013.', 'Rijksoverheid — Nieuwe Wet inburgering', SRC_NIEUWE_WET, CHECKED)}

<p>The rest of this page is about the <strong>Wet inburgering 2021</strong>. That is the one that
applies to almost everyone starting now.</p>

<h2 id="drie-routes">The three learning routes</h2>

<p>Under the 2021 act you follow one of three routes. You do not pick it yourself: the
municipality decides which route suits you, based on the brede intake (the intake interview) and
the leerbaarheidstoets (the learnability test). Your PIP says which one it became.</p>

<div class="route-grid">
  <div class="route-card">
    <div class="route-accent"></div>
    <div class="route-top"><h3>B1 route</h3><span class="route-level">B1</span></div>
    <div class="route-rows">
      ${row('For whom', 'Most people who integrate. This is the standard route.')}
      ${row('What you do', 'Learn Dutch to B1, plus KNM, MAP and PVT.')}
      ${row('How you finish', 'Exams at DUO.')}
      ${row('Easier possible?', 'Yes — dropping to A2 is possible under conditions.')}
    </div>
  </div>
  <div class="route-card r-onderwijs">
    <div class="route-accent"></div>
    <div class="route-top"><h3>Education route</h3><span class="route-level">B1 or higher</span></div>
    <div class="route-rows">
      ${row('For whom', 'You want to go on to mbo, hbo or university. Mainly young people, but there is no age limit.')}
      ${row('What you do', 'A taalschakeltraject: Dutch, KNM, PVT and learning how to study.')}
      ${row('How you finish', 'Exams at DUO, then on to your programme.')}
      ${row('Easier possible?', 'No.')}
    </div>
  </div>
  <div class="route-card r-z">
    <div class="route-accent"></div>
    <div class="route-top"><h3>Z-route</h3><span class="route-level">A1</span></div>
    <div class="route-rows">
      ${row('For whom', 'Learning is difficult. The B1 route and the education route are too demanding.')}
      ${row('What you do', 'At least 800 hours of tuition: Dutch and KNM together. If you are an asylum status holder, 800 hours of participation and activation are added.')}
      ${row('How you finish', 'A closing interview at the municipality. No KNM exam.')}
      ${row('Easier possible?', 'Not applicable. Reach A2 anyway? Then you may still sit the exams.')}
    </div>
  </div>
</div>

${factIn('en', 'In the Z-route, asylum status holders do 800 course hours (Dutch and KNM together) plus 800 hours of participation and a closing interview. Family migrants and other migrants do the 800 course hours and the closing interview, without the 800 participation hours.', 'Besluit inburgering 2021, artikel 3.14', SRC_ZROUTE, CHECKED)}

${factIn('en', 'MAP belongs to the B1 route and the Z-route. The education route is exempt from it. PVT is compulsory in all three routes.', 'Wet inburgering 2021, artikel 8', SRC_MAP, CHECKED)}

<h2 id="afschalen">Afschalen: dropping from B1 to A2</h2>

<p>Is B1 genuinely out of reach? Then in the <strong>B1 route</strong> you may sit your language
exams at A2. In the education route you cannot.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">There are two conditions</p>
    <ul>
      <li>${I_CHECK}<span>You have had at least <strong>600 hours of tuition</strong> at a school with a quality mark</span></li>
      <li>${I_CHECK}<span>You have <strong>demonstrably made the effort</strong> during your integration</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Watch out</p>
    <ul>
      <li>${I_X}<span>The <strong>municipality decides</strong> — not you and not your school</span></li>
      <li>${I_X}<span>Only the <strong>four language exams</strong> drop to A2. KNM does not change</span></li>
      <li>${I_X}<span>If you sit an exam at a lower level than your PIP states, your first two attempts are <strong>not free</strong></span></li>
    </ul>
  </div>
</div>

${factIn('en', 'Dropping to A2 is possible only in the B1 route, after at least 600 hours of language tuition at a school with a quality mark and where sufficient effort can be demonstrated. The municipality verifies this.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}

${inlineCta('Torn between B1 and A2?', 'Take a free A2 practice exam and see what you already manage. Ten questions, with explanations.', '/oefenen', 'Free practice exam')}

<h2 id="hoeveel-tijd">How much time do you have?</h2>

<p>Under the 2021 act you have <strong>3 years</strong>. That period does not start with your
letter and not with your first lesson, but on the day after the date printed on your PIP.</p>

<div class="termijn">
  <div class="termijn-ends">
    <div class="termijn-end"><strong>Start</strong>the day after the date on your PIP</div>
    <div class="termijn-end"><strong>End</strong>everything must be finished</div>
  </div>
  <div class="termijn-bar">
    <div class="termijn-seg">Year 1</div>
    <div class="termijn-seg s2">Year 2</div>
    <div class="termijn-seg s3">Year 3</div>
    <div class="termijn-seg s-extra">Extra time?</div>
  </div>
  <p class="termijn-note">Everything has to be finished within these three years: your learning
  route, KNM, MAP and PVT. In certain situations — illness, giving birth, having to learn to read
  and write first — you can be granted extra time. That is possible only once per period.</p>
</div>

${factIn('en', 'The integration period is 3 years and starts on the day after the date of the PIP. If your PIP is revised later, that start date does not move.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}

${docentIn('en', 'Put your end date in your calendar straight away, and set a reminder six months before it. Results for Writing and Speaking can take a long time, and that is not the moment to discover you still have one exam left.')}

<h2 id="en-nu">What next?</h2>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_ROUTE}</div>
    <h3>The whole process in 7 steps</h3>
    <p>From the letter from DUO to your diploma: what happens, in what order, and which deadlines
    go with it.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_CLOCK}</div>
    <h3>What does it cost?</h3>
    <p>Who pays for your course, what an exam costs, and when your first two attempts are free.</p>
  </div>
</div>
`,
      sidebarHtml: `
<p><strong>In short</strong></p>
<ul>
  <li>Duty before 1 January 2022? The 2013 act. After? The 2021 act.</li>
  <li>Under the 2021 act your municipality helps you and everything is in your PIP.</li>
  <li>Three routes: B1, education and Z. The municipality chooses.</li>
  <li>Dropping to A2 is only possible in the B1 route, after 600 hours of tuition.</li>
  <li>You have 3 years, counted from the day after your PIP.</li>
</ul>`,
      ctaTitle: 'B1 or A2 — where do you stand?',
      ctaDesc: 'Take a free practice exam of ten questions and see straight away what you can already do.',
      ctaLabel: 'Start a free practice exam',
      faq: [
        {
          q: 'Do I fall under the Integration Act 2013 or 2021?',
          a: 'It depends on the date your integration duty started. Before 1 January 2022 means the 2013 act. On or after that day means the 2021 act. Your start date is in the letter from DUO and in Mijn Inburgering.',
        },
        {
          q: 'Can I choose my own learning route?',
          a: 'No. The municipality decides your route based on the brede intake and the leerbaarheidstoets, and records it in your PIP. If you disagree you can object; the letter accompanying your PIP explains how.',
        },
        {
          q: 'May I sit the exams at A2 instead of B1?',
          a: 'Only in the B1 route, and only if you have had at least 600 hours of tuition at a school with a quality mark and can demonstrate you made the effort. The municipality decides. Only the four language exams drop to A2 — KNM does not change.',
        },
        {
          q: 'Do I sit exams in the Z-route?',
          a: 'Usually not. The Z-route ends with a closing interview at the municipality, and there is no KNM exam. If you do reach A2 during the route, you may still sit the exams at DUO and apply for a diploma.',
        },
        {
          q: 'When does my 3-year integration period start?',
          a: 'On the day after the date of your PIP — so not with the letter from DUO and not with your first lesson. If your PIP is revised later, that start date does not shift with it.',
        },
      ],
    },

    ar: {
      title: 'أي قانون اندماج وأي مسار ينطبق عليك؟',
      breadcrumb: 'أي قانون وأي مسار',
      dateLabel: '٢٠ أغسطس ٢٠٢٦',
      eyebrow: 'القانون والمسار التعليمي',
      heroTitle: 'أي قانون وأي مسار؟',
      heroSubtitle:
        'في هولندا قانونان للاندماج يعملان جنبًا إلى جنب. والقانون الذي ينطبق عليك يحدّد من يساعدك، وأي مسار تسلكه، وأي مستوى لغوي عليك بلوغه.',
      description:
        'قانون الاندماج ٢٠١٣ أم ٢٠٢١؟ تاريخ واحد يحسم الأمر. تعرّف على الفرق بينهما وعلى المسارات الثلاثة، ومتى يمكنك النزول من B1 إلى A2، وكم من الوقت أمامك.',
      articleHtml: `
<div class="verdict warn">
  <p class="verdict-answer">تاريخ واحد يحدّد كل شيء</p>
  <p>هل بدأ التزامك بالاندماج <strong>قبل ١ يناير ٢٠٢٢</strong>؟ إذن ينطبق عليك قانون
  Wet inburgering 2013. وهل بدأ <strong>في ذلك اليوم أو بعده</strong>؟ إذن ينطبق عليك
  Wet inburgering 2021. تاريخ البدء هذا مذكور في رسالتك من DUO.</p>
</div>

${note('اسم القانون ٢٠٢١ لكنه دخل حيّز التنفيذ في <strong>١ يناير ٢٠٢٢</strong>. كثير من المواقع تخلط بين الأمرين. اعتمد إذن على التاريخ في رسالتك، لا على اسم القانون.')}

${docentIn('ar', 'فقدت الرسالة؟ سجّل الدخول إلى Mijn Inburgering باستخدام DigiD. ستجد في شاشة واحدة أي قانون وأي مسار وأي امتحانات تنطبق عليك. أنا أبدأ كل مقابلة تعريفية بهذه الشاشة — فهي توفّر نصف ساعة من التخمين.')}

<h2 id="twee-wetten">القانونان جنبًا إلى جنب</h2>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Wet inburgering 2021</h3>
      <p class="compare-when">بدأ الالتزام في ١ يناير ٢٠٢٢ أو بعده</p>
    </div>
    <div class="compare-rows">
      ${row('من يساعدك', 'البلدية. تُجرى معك مقابلة وتحصل على خطة شخصية: الـPIP.')}
      ${row('المستوى اللغوي', 'B1. وفي مسار Z يكون الهدف A1.')}
      ${row('ما عليك فعله', 'إكمال مسارك التعليمي، بالإضافة إلى KNM وMAP وPVT.')}
      ${row('المدة', '٣ سنوات، تبدأ من اليوم التالي لتاريخ الـPIP.')}
      ${row('أين تراه', 'في Mijn Inburgering وفي الـPIP.')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Wet inburgering 2013</h3>
      <p class="compare-when">بدأ الالتزام قبل ١ يناير ٢٠٢٢</p>
    </div>
    <div class="compare-rows">
      ${row('من يساعدك', 'تدبّر الأمر بنفسك. تختار دورة أو تدرس بشكل مستقل.')}
      ${row('المستوى اللغوي', 'A2 أو أعلى.')}
      ${row('ما عليك فعله', 'القراءة والاستماع والكتابة والمحادثة وKNM، بالإضافة إلى ONA. وإذا بدأ التزامك في ١ أكتوبر ٢٠١٧ أو بعده، فـPVT أيضًا.')}
      ${row('المدة', 'تاريخ انتهاء مدتك مذكور في رسالتك من DUO.')}
      ${row('أين تراه', 'في Mijn Inburgering.')}
    </div>
  </div>
</div>

${factIn('ar', 'دخل قانون Wet inburgering 2021 حيّز التنفيذ في ١ يناير ٢٠٢٢. ومن بدأ التزامه بالاندماج قبل ذلك التاريخ يبقى خاضعًا لقانون Wet inburgering 2013.', 'Rijksoverheid — Nieuwe Wet inburgering', SRC_NIEUWE_WET, CHECKED)}

<p>بقية هذه الصفحة تتناول <strong>Wet inburgering 2021</strong>، وهو القانون الذي ينطبق على
جميع من يبدأون الآن تقريبًا.</p>

<h2 id="drie-routes">المسارات التعليمية الثلاثة</h2>

<p>في ظل قانون ٢٠٢١ تسلك أحد ثلاثة مسارات. ولا تختاره بنفسك: البلدية تحدّد المسار المناسب لك
بناءً على المقابلة الشاملة (brede intake) واختبار القابلية للتعلّم (leerbaarheidstoets).
والـPIP يوضّح أي مسار استقرّ عليه الأمر.</p>

<div class="route-grid">
  <div class="route-card">
    <div class="route-accent"></div>
    <div class="route-top"><h3>مسار B1</h3><span class="route-level">B1</span></div>
    <div class="route-rows">
      ${row('لمن', 'لمعظم المندمجين. وهو المسار القياسي.')}
      ${row('ما تفعله', 'تعلّم الهولندية حتى مستوى B1، بالإضافة إلى KNM وMAP وPVT.')}
      ${row('كيف تنهيه', 'امتحانات لدى DUO.')}
      ${row('هل من خيار أسهل؟', 'نعم — النزول إلى A2 ممكن ضمن شروط.')}
    </div>
  </div>
  <div class="route-card r-onderwijs">
    <div class="route-accent"></div>
    <div class="route-top"><h3>مسار التعليم</h3><span class="route-level">B1 أو أعلى</span></div>
    <div class="route-rows">
      ${row('لمن', 'لمن يريد متابعة الدراسة في mbo أو hbo أو الجامعة. غالبًا الشباب، لكن لا يوجد حدّ للسنّ.')}
      ${row('ما تفعله', 'برنامج taalschakeltraject: الهولندية وKNM وPVT وتعلّم مهارات الدراسة.')}
      ${row('كيف تنهيه', 'امتحانات لدى DUO، ثم الانتقال إلى دراستك.')}
      ${row('هل من خيار أسهل؟', 'لا.')}
    </div>
  </div>
  <div class="route-card r-z">
    <div class="route-accent"></div>
    <div class="route-top"><h3>مسار Z</h3><span class="route-level">A1</span></div>
    <div class="route-rows">
      ${row('لمن', 'لمن يجد التعلّم صعبًا. مسار B1 ومسار التعليم أثقل مما يحتمل.')}
      ${row('ما تفعله', '‏٨٠٠ ساعة دراسية على الأقل: الهولندية وKNM معًا. وإن كنت حاصلًا على حق اللجوء، تُضاف ٨٠٠ ساعة مشاركة وتفعيل.')}
      ${row('كيف تنهيه', 'مقابلة ختامية في البلدية. بلا امتحان KNM.')}
      ${row('هل من خيار أسهل؟', 'لا ينطبق. وإن بلغت مستوى A2 رغم ذلك، فيمكنك أداء الامتحانات.')}
    </div>
  </div>
</div>

${factIn('ar', 'في مسار Z يؤدي الحاصلون على حق اللجوء ٨٠٠ ساعة دراسية (الهولندية وKNM معًا) بالإضافة إلى ٨٠٠ ساعة مشاركة ومقابلة ختامية. أما مهاجرو لَمّ الشمل وسائر المهاجرين فيؤدون ٨٠٠ ساعة دراسية والمقابلة الختامية، دون ساعات المشاركة الـ٨٠٠.', 'Besluit inburgering 2021, artikel 3.14', SRC_ZROUTE, CHECKED)}

${factIn('ar', 'يخصّ MAP مسار B1 ومسار Z. أما مسار التعليم فهو مُستثنى منه. والـPVT إلزامي في المسارات الثلاثة جميعها.', 'Wet inburgering 2021, artikel 8', SRC_MAP, CHECKED)}

<h2 id="afschalen">‏Afschalen: النزول من B1 إلى A2</h2>

<p>هل مستوى B1 بعيد المنال فعلًا؟ عندها يمكنك في <strong>مسار B1</strong> أداء امتحاناتك اللغوية
على مستوى A2. أما في مسار التعليم فلا.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">هناك شرطان</p>
    <ul>
      <li>${I_CHECK}<span>حضرت <strong>٦٠٠ ساعة دراسية</strong> على الأقل في مدرسة حاصلة على علامة جودة</span></li>
      <li>${I_CHECK}<span>بذلت <strong>جهدًا يمكن إثباته</strong> خلال اندماجك</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">انتبه</p>
    <ul>
      <li>${I_X}<span><strong>البلدية هي التي تقرّر</strong> — لا أنت ولا مدرستك</span></li>
      <li>${I_X}<span>الامتحانات <strong>اللغوية الأربعة</strong> وحدها تنزل إلى A2. أما KNM فلا يتغيّر</span></li>
      <li>${I_X}<span>إذا أدّيت امتحانًا بمستوى أدنى مما ورد في الـPIP، فأول محاولتين <strong>ليستا مجانيتين</strong></span></li>
    </ul>
  </div>
</div>

${factIn('ar', 'النزول إلى A2 ممكن في مسار B1 وحده، بعد ٦٠٠ ساعة دراسية على الأقل في مدرسة لغات حاصلة على علامة جودة، ومع إثبات بذل جهد كافٍ. والبلدية هي التي تتحقّق من ذلك.', 'Besluit inburgering 2021, artikel 5.5', SRC_AFSCHALEN, CHECKED)}

${inlineCta('متردّد بين B1 وA2؟', 'قم بامتحان تجريبي مجاني على مستوى A2 وانظر ما الذي تجيده الآن. عشرة أسئلة مع الشرح.', '/oefenen', 'امتحان تجريبي مجاني')}

<h2 id="hoeveel-tijd">كم من الوقت أمامك؟</h2>

<p>في ظل قانون ٢٠٢١ أمامك <strong>٣ سنوات</strong>. ولا تبدأ هذه المدة برسالتك ولا بأول درس لك،
بل في اليوم التالي للتاريخ المطبوع على الـPIP.</p>

<div class="termijn">
  <div class="termijn-ends">
    <div class="termijn-end"><strong>البداية</strong>اليوم التالي لتاريخ الـPIP</div>
    <div class="termijn-end"><strong>النهاية</strong>يجب أن يكون كل شيء جاهزًا</div>
  </div>
  <div class="termijn-bar">
    <div class="termijn-seg">السنة ١</div>
    <div class="termijn-seg s2">السنة ٢</div>
    <div class="termijn-seg s3">السنة ٣</div>
    <div class="termijn-seg s-extra">وقت إضافي؟</div>
  </div>
  <p class="termijn-note">خلال هذه السنوات الثلاث يجب أن يكتمل كل شيء: مسارك التعليمي وKNM وMAP
  وPVT. وفي حالات معيّنة — المرض أو الولادة أو الحاجة إلى تعلّم القراءة والكتابة أولًا — يمكن
  أن تحصل على وقت إضافي. وهذا ممكن مرة واحدة فقط في كل فترة.</p>
</div>

${factIn('ar', 'مدة الاندماج ٣ سنوات وتبدأ في اليوم التالي لتاريخ الـPIP. وإذا جرت مراجعة الـPIP لاحقًا، فإن تاريخ البدء لا يتغيّر.', 'Wet inburgering 2021, artikel 11', SRC_TERMIJN, CHECKED)}

${docentIn('ar', 'دوّن تاريخ انتهاء مدتك في تقويمك فورًا، وضع تذكيرًا قبله بستة أشهر. نتائج الكتابة والمحادثة قد تتأخّر طويلًا، ولا تريد أن تكتشف حينها أنه بقي عليك امتحان واحد.')}

<h2 id="en-nu">وماذا بعد؟</h2>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_ROUTE}</div>
    <h3>المسار كاملًا في ٧ خطوات</h3>
    <p>من رسالة DUO إلى شهادتك: ماذا يحدث، وبأي ترتيب، وما المواعيد النهائية المرتبطة بذلك.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_CLOCK}</div>
    <h3>كم يكلّف الأمر؟</h3>
    <p>من يدفع تكلفة دورتك، وكم يكلّف الامتحان، ومتى تكون أول محاولتين مجانيتين.</p>
  </div>
</div>
`,
      sidebarHtml: `
<p><strong>باختصار</strong></p>
<ul>
  <li>بدأ الالتزام قبل ١ يناير ٢٠٢٢؟ قانون ٢٠١٣. بعده؟ قانون ٢٠٢١.</li>
  <li>في ظل قانون ٢٠٢١ تساعدك البلدية وكل شيء مذكور في الـPIP.</li>
  <li>ثلاثة مسارات: B1 والتعليم وZ. والبلدية هي التي تختار.</li>
  <li>النزول إلى A2 ممكن في مسار B1 وحده، بعد ٦٠٠ ساعة دراسية.</li>
  <li>أمامك ٣ سنوات، تُحتسب من اليوم التالي للـPIP.</li>
</ul>`,
      ctaTitle: '‏B1 أم A2 — أين أنت الآن؟',
      ctaDesc: 'قم بامتحان تجريبي مجاني من عشرة أسئلة وانظر فورًا ما الذي تجيده.',
      ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
      faq: [
        {
          q: 'هل أخضع لقانون الاندماج ٢٠١٣ أم ٢٠٢١؟',
          a: 'يعتمد ذلك على تاريخ بدء التزامك بالاندماج. إذا كان قبل ١ يناير ٢٠٢٢ فينطبق قانون ٢٠١٣، وإذا كان في ذلك اليوم أو بعده فقانون ٢٠٢١. وتاريخ البدء مذكور في رسالة DUO وفي Mijn Inburgering.',
        },
        {
          q: 'هل يمكنني اختيار مساري التعليمي بنفسي؟',
          a: 'لا. البلدية تحدّد مسارك بناءً على المقابلة الشاملة واختبار القابلية للتعلّم، وتدوّنه في الـPIP. وإذا لم توافق يمكنك تقديم اعتراض؛ والرسالة المرفقة بالـPIP توضّح كيفية ذلك.',
        },
        {
          q: 'هل يمكنني أداء الامتحان على مستوى A2 بدل B1؟',
          a: 'في مسار B1 فقط، وبشرط أن تكون قد حضرت ٦٠٠ ساعة دراسية على الأقل في مدرسة حاصلة على علامة جودة وأن تثبت أنك بذلت الجهد. والبلدية هي التي تقرّر. والامتحانات اللغوية الأربعة وحدها تنزل إلى A2 — أما KNM فلا يتغيّر.',
        },
        {
          q: 'هل أؤدي امتحانات في مسار Z؟',
          a: 'غالبًا لا. ينتهي مسار Z بمقابلة ختامية في البلدية، ولا يوجد امتحان KNM. وإن بلغت مستوى A2 خلال المسار، فيمكنك أداء الامتحانات لدى DUO وطلب الشهادة.',
        },
        {
          q: 'متى تبدأ مدة الاندماج البالغة ٣ سنوات؟',
          a: 'في اليوم التالي لتاريخ الـPIP — أي ليس عند رسالة DUO ولا عند أول درس لك. وإذا جرت مراجعة الـPIP لاحقًا، فإن تاريخ البدء لا ينتقل معها.',
        },
      ],
    },
  },
};

export default guide;
