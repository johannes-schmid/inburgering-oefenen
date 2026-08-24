/**
 * Taalexamens spoke — "Het taalexamen op B1".
 *
 * **Scoped against the pillar on purpose.** `taalexamens-a2-b1` compares the two levels and owns
 * the "A2 of B1" query; this page is for the reader who already knows B1 is theirs and now has to
 * *do* it. Its ground is the part the pillar states in one paragraph: B1 is a **staatsexamen NT2**
 * — a different exam, at different locations, with its own tarief and its own uitslagtermijn —
 * plus what each of the four onderdelen asks at B1, and the two ways out (afschalen, of B2).
 * If a future edit turns either page into the general "alles over B1" page, one of them has to go.
 * One query, one owning page.
 *
 * Four sourcing rules this page is written to, all from `SEO/facts.md`:
 *
 *  - **The four B1 durations are DUO's own** (§1's source page, the A2/B1/B2 taalexamens page):
 *    Lezen 110, Luisteren 90, Schrijven 100, Spreken ongeveer 30 minuten. Nothing about the number
 *    of items at B1 is published anywhere, so **no item count appears on this page at all** — not
 *    even attributed. A2's 25/25/4/16 came off DUO's practice exams; B1 has no such source.
 *  - **No tarief and no uitslagtermijn for B1.** §4's €50 is the inburgeringsexamen fee and
 *    `SEO/facts.md` line 220 records the staatsexamen NT2 fee as *not fetched*; the NT2
 *    uitslagtermijn was never established either (`docs/tijdlijn/02-RULES-AND-DATA.md` §12, where
 *    the engine falls back to 8 weeks **with a warning**). Both are linked, not stated.
 *  - **No pass norm**, §9. `tests-unit/guides.test.ts` enforces it with a regex.
 *  - **Naturalisatie does not require B1 today** — minimaal A2; the raise to B1 is a wetsvoorstel
 *    (§10, IND). That is the single most-repeated wrong claim about B1 on the Dutch internet, so
 *    the page says it explicitly rather than staying silent.
 *
 * Our own B1 material may be named here: B1 Lezen, Schrijven and Spreken went live and indexed on
 * 2026-08-23. **B1 Luisteren is empty and is not mentioned** — see `data/skills.ts`, where its
 * `itemCount` is `null` and that null is what gates its page out of the index.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_BOOK, I_HEADPHONES, I_PEN, I_MIC, I_CHECK, I_X, I_CLOCK, I_LANDMARK, I_ROUTE,
  docent, note, inlineCta, factTwo,
} from './kit';

export const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
export const SRC_ROUTES = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
export const SRC_PLAATSEN = 'https://www.inburgeren.nl/examen-doen/examenplaatsen.jsp';
export const SRC_AANMELDEN = 'https://www.inburgeren.nl/examen-doen/aanmelden-examen.jsp';
export const SRC_NT2 = 'https://www.staatsexamensnt2.nl/';
export const SRC_NT2_GELD = 'https://duo.nl/particulier/staatsexamen-nt2/examengeld.jsp';
export const SRC_BESLUIT55 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&artikel=5.5';
export const SRC_IND = 'https://ind.nl/nl/met-een-verblijfsvergunning-wonen-in-nederland/inburgering-bij-sterkere-verblijfsvergunning-en-naturalisatie';
export const SRC_DIPLOMA = 'https://www.inburgeren.nl/examen-doen/diploma.jsp';
export const CHECKED = '24-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'b1-examen',
  section: 'taalexamens',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-24',
  pillar: false,
  coverGlyph: 'ladder',

  title: 'Het taalexamen op B1: staatsexamen NT2, uitgelegd',
  description:
    'Je zit in de B1-route. Wat is een staatsexamen NT2, hoe lang duren de vier onderdelen op B1, waar doe je ze, en wat kun je doen als B1 te hoog blijkt?',

  datePublished: '2026-08-24',
  dateModified: '2026-08-24',
  dateLabel: '24 augustus 2026',
  breadcrumb: 'Het B1-examen',
  eyebrow: 'Taalexamen',

  heroTitle: 'Het taalexamen op niveau B1',
  heroSubtitle:
    'B1 is niet hetzelfde examen als A2, een maatje groter. Het is een ander examen, bij een andere afdeling, op andere locaties. Hier staat wat dat voor jou betekent.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="wat-is-b1">B1 is een staatsexamen NT2, geen groter A2-examen</h2>

<p>Dit is het eerste wat misgaat. Mensen denken: A2 heb ik gezien, B1 is hetzelfde maar moeilijker.
Dat klopt niet. Het inburgeringsexamen op A2 en het staatsexamen NT2 op B1 zijn <strong>twee
verschillende examens</strong>, van twee verschillende afdelingen van DUO, op verschillende
locaties, met een eigen tarief en een eigen uitslagtermijn.</p>

<div class="compare-2">
  <div class="compare-card">
    <div class="compare-head">
      <h3>Inburgeringsexamen A2</h3>
      <p class="compare-when">Voor de Z-route en de Wet 2013</p>
    </div>
    <div class="compare-rows">
      ${row('Waar', 'Zes examenlocaties: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht, Zwolle')}
      ${row('Aanmelden', 'Mijn Inburgering')}
      ${row('Onderdelen', 'Lezen, Luisteren, Schrijven, Spreken + KNM')}
      ${row('Schrijven', 'Met pen en papier')}
    </div>
  </div>
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Staatsexamen NT2 (B1 en B2)</h3>
      <p class="compare-when">Voor de B1-route en de onderwijsroute</p>
    </div>
    <div class="compare-rows">
      ${row('Waar', 'Eigen DUO-locaties voor het staatsexamen NT2')}
      ${row('Aanmelden', 'Mijn Inburgering, en de informatie staat op staatsexamensnt2.nl')}
      ${row('Onderdelen', 'Dezelfde vier taalonderdelen + KNM')}
      ${row('Duur', 'Langer: 110, 90, 100 en ongeveer 30 minuten')}
    </div>
  </div>
</div>

${factTwo('De kennisexamens en de taalexamens op niveau A2 doet u op zes examenlocaties: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht en Zwolle. De taalexamens op niveau B1 en B2 zijn staatsexamens NT2; die doet u op eigen locaties van DUO. Aanmelden doet u via Mijn Inburgering.', [['inburgeren.nl — Examenplaatsen', SRC_PLAATSEN], ['inburgeren.nl — Aanmelden voor het examen', SRC_AANMELDEN]], CHECKED)}

${note('Let op: Zwolle verhuist per 1 oktober 2026, en er zijn daar geen examens van 18 tot en met 30 september 2026. Dat raakt de A2-locaties. Controleer je locatie altijd in je oproep, niet in een gids.')}

<h2 id="wie-doet-b1">Wie doet de examens op B1?</h2>

<p>Niet iedereen. Je gemeente bepaalt na de brede intake en de leerbaarheidstoets welke leerroute je
volgt, en de route bepaalt je niveau.</p>

<div class="guide-cards">
  ${card(I_ROUTE, 'B1-route', 'De standaardroute onder de Wet 2021. Je doet de taalexamens op niveau B1, binnen drie jaar.')}
  ${card(I_ROUTE, 'Onderwijsroute', 'Vooral voor jongeren die naar het mbo, hbo of de universiteit willen. Je haalt B1 of hoger.')}
  ${card(I_ROUTE, 'Z-route', 'Je leert Nederlands op niveau A1. Je mág examens op A2 doen, maar het hoeft niet. Geen B1 dus.')}
</div>

<p>Burger je in onder de <strong>Wet 2013</strong>, de oude wet? Dan zijn je taalexamens op A2 of
hoger, en is B1 een keuze en geen plicht.</p>

${fact('De gemeente bepaalt op basis van de brede intake welke leerroute u volgt. In de B1-route doet u binnen 3 jaar de taalexamens op niveau B1. De onderwijsroute is vooral voor jongeren die naar het mbo, hbo of de universiteit willen en leidt naar B1 of B2. In de Z-route leert u Nederlands op taalniveau A1 en mag u taalexamens op niveau A2 doen, maar dat hoeft niet.', 'inburgeren.nl — U gaat inburgeren', SRC_ROUTES, CHECKED)}

<h2 id="de-vier-onderdelen">De vier onderdelen op B1</h2>

<p>Dezelfde vier onderdelen als op A2, en alle vier langer. Die extra tijd is geen cadeau: de
teksten zijn langer en je moet meer zelf formuleren.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Onderdeel</th><th>A2</th><th>B1</th></tr></thead>
  <tbody>
    <tr><td><strong>Lezen</strong></td><td>65 minuten</td><td>110 minuten</td></tr>
    <tr><td><strong>Luisteren</strong></td><td>45 minuten</td><td>90 minuten</td></tr>
    <tr><td><strong>Schrijven</strong></td><td>40 minuten, met pen en papier</td><td>100 minuten</td></tr>
    <tr><td><strong>Spreken</strong></td><td>35 minuten</td><td>ongeveer 30 minuten</td></tr>
  </tbody>
</table>
</div>

${fact('DUO over de taalexamens: Lezen A2 duurt 65 minuten en Lezen B1 110 minuten; Luisteren A2 duurt 45 minuten en Luisteren B1 90 minuten; Schrijven A2 maakt u met pen en papier en duurt 40 minuten, Schrijven B1 duurt 100 minuten; Spreken A2 duurt 35 minuten en Spreken B1 ongeveer 30 minuten.', 'inburgeren.nl — Taalexamens A2, B1 en B2', SRC_TAALEXAMENS, CHECKED)}

<p><strong>Hoeveel vragen het er zijn, zeggen we niet.</strong> Voor A2 kun je dat aflezen aan
DUO's eigen oefenexamens; voor B1 publiceert DUO dat nergens. Elke site die je een exact aantal
vragen op B1 belooft, heeft het verzonnen. Wat er wél staat, staat op
<a href="${SRC_NT2}" target="_blank" rel="noopener">staatsexamensnt2.nl</a>.</p>

<div class="guide-cards">
  ${card(I_BOOK, 'Lezen', 'Langere, samenhangende teksten: een nieuwsbericht, een folder, een artikel. Je moet niet alleen vinden wat er staat, maar ook waarom het er staat.')}
  ${card(I_HEADPHONES, 'Luisteren', 'Gesprekken en fragmenten in normaal tempo, met meer sprekers en meer omweg. Je krijgt bijna twee keer zoveel tijd als op A2 — en je hebt die nodig.')}
  ${card(I_PEN, 'Schrijven', 'Op de computer, en langer dan A2. Je schrijft geen invulformulier meer maar samenhangende tekst: een brief, een bericht, een reactie met een reden erbij.')}
  ${card(I_MIC, 'Spreken', 'Je spreekt in, net als op A2 — maar met langere beurten. Een antwoord van vier woorden is op B1 geen antwoord.')}
</div>

${docent('Het verschil tussen A2 en B1 zit niet in het aantal woorden dat je kent. Het zit in <em>verbinden</em>. Op A2 mag je losse zinnen zeggen: "Ik ga niet. Ik ben ziek." Op B1 wordt verwacht dat je er één verhaal van maakt: "Ik kom morgen niet, omdat ik ziek ben — ik hoop dat het volgende week wel lukt." Dat is één zin met drie stukken erin, en dat oefen je niet door woordjes te stampen.')}

<h2 id="kosten-en-uitslag">Wat het kost en wanneer je de uitslag hebt</h2>

<p>Hier houden we het bewust vaag, en dat is geen luiheid. Het staatsexamen NT2 heeft een
<strong>eigen tarief</strong>, dat losstaat van de €50 per onderdeel die DUO voor de
inburgeringsexamens rekent, en het verandert. Hetzelfde geldt voor de uitslagtermijn: DUO noemt
"binnen 8 weken" voor de kennisexamens en de taalexamens op A2, maar dat is niet dezelfde belofte
als voor het staatsexamen NT2.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Kijk dit zelf na, vóór je je aanmeldt</p>
    <ul>
      <li>${I_CHECK}<span>Het actuele examengeld staat op <a href="${SRC_NT2_GELD}" target="_blank" rel="noopener">duo.nl — examengeld staatsexamen NT2</a></span></li>
      <li>${I_CHECK}<span>De organisatie van het examen staat op <a href="${SRC_NT2}" target="_blank" rel="noopener">staatsexamensnt2.nl</a></span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Reken niet met de A2-getallen</p>
    <ul>
      <li>${I_X}<span>&euro;50 per onderdeel hoort bij de inburgeringsexamens, niet bij het staatsexamen NT2</span></li>
      <li>${I_X}<span>&quot;Uitslag binnen 8 weken&quot; is DUO&rsquo;s belofte voor de kennisexamens en de taalexamens op A2</span></li>
      <li>${I_X}<span>Plan je B1 op die getallen, dan plan je op de verkeerde</span></li>
    </ul>
  </div>
</div>

${note('Plan je met een deadline? Reken achteruit vanaf je <strong>uitslag</strong>, niet vanaf je examendatum — en niet vanaf vandaag. De wachtrij vóór het examen is bij de meeste mensen het probleem, niet de deadline zelf.')}

${inlineCta('Zet je eigen data op een rij', 'De tijdlijn-maker rekent je aanmeld- en startdatums uit vanaf jouw termijn. Geen DigiD, geen BSN.', '/inburgering/tools/tijdlijn', 'Maak je tijdlijn')}

<h2 id="te-hoog">En als B1 te hoog blijkt?</h2>

<p>Dat komt voor, en er is een uitweg — maar één, en met voorwaarden. Vanuit de
<strong>B1-route</strong> kun je onder voorwaarden <strong>afschalen naar A2</strong>. Vanuit de
onderwijsroute of de Z-route kan dat niet.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Ten minste 600 uur taalles</h3>
    <p>Bij een taalschool met keurmerk. Zonder die uren is er niets om te beoordelen.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Aantoonbaar genoeg je best gedaan</h3>
    <p>Aanwezigheid, inzet, resultaten. Je school registreert dat; de gemeente controleert het.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>De gemeente beslist</h3>
    <p>Niet DUO en niet je school. Vraag het aan bij je klantmanager, en wacht er niet mee tot je laatste maanden.</p>
  </div></div>
</div>

${factTwo('Afschalen van B1 naar A2 kan alleen vanuit de B1-route. Daarvoor moet u ten minste 600 cursusuren NT2 hebben gevolgd bij een instelling met een keurmerk, en moet u aantoonbaar voldoende inspanning hebben geleverd. De gemeente controleert dat en beslist.', [['Besluit inburgering 2021, artikel 5.5', SRC_BESLUIT55], ['inburgeren.nl — U gaat inburgeren', SRC_ROUTES]], CHECKED)}

${docent('Wacht niet met dit gesprek tot je twee keer gezakt bent. Ik heb liever dat iemand na een jaar zegt "ik denk dat B1 niet gaat lukken" dan dat we het in maand 32 ontdekken. Afschalen kost tijd — die 600 uur moeten er eerst staan, en daarna moet de gemeente er nog naar kijken.')}

<h2 id="naturalisatie">B1 en je paspoort: pas op met wat je leest</h2>

<p>Er wordt veel geschreven alsof je B1 nodig hebt om Nederlander te worden. Dat is
<strong>op dit moment niet zo</strong>. Voor naturalisatie geldt minimaal A2. De verhoging naar B1
is een <em>wetsvoorstel</em>, geen geldend recht.</p>

${fact('Voor een verblijfsvergunning voor onbepaalde tijd en voor naturalisatie hebt u een inburgeringsdiploma nodig op ten minste niveau A2. De verhoging van die eis naar B1 is een wetsvoorstel en geen geldend recht.', 'IND — Inburgering bij een sterkere verblijfsvergunning en naturalisatie', SRC_IND, CHECKED)}

<p>Dat je diploma je niveau vermeldt, klopt wél: op je inburgeringsdiploma staat of je A2, B1 of B2
hebt gehaald, en je downloadt het gratis in Mijn Diploma's.</p>

${fact('U kunt uw diploma downloaden in Mijn Diplomas. Dat is gratis. Op het diploma staat op welk niveau u de examens hebt gehaald: A2, B1 of B2.', 'inburgeren.nl — Diploma', SRC_DIPLOMA, CHECKED)}

<h2 id="oefenen">Oefenen op B1</h2>

<p>Op deze site staan oefenexamens op B1 voor <strong>Lezen, Schrijven en Spreken</strong>,
geschreven en nagekeken volgens dezelfde werkwijze als de A2-examens. Luisteren op B1 staat er nog
niet: daarvoor is geen betrouwbaar referentiemateriaal, en dan verzinnen we liever niets.</p>

<p>Voor Lezen op B1 staat er een <strong>gratis proefexamen</strong> van tien vragen klaar, zonder
account. Na elk antwoord zie je meteen waarom het goed of fout is.</p>

${inlineCta('Probeer B1 Lezen gratis', 'Tien vragen op niveau B1, met uitleg na elk antwoord. Geen account nodig.', '/oefenen', 'Start het gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>B1 is een <strong>staatsexamen NT2</strong>, niet het A2-examen.</li>
  <li>Andere locaties, eigen tarief, eigen uitslagtermijn.</li>
  <li>Duur: 110, 90, 100 en ongeveer 30 minuten.</li>
  <li>Het aantal vragen op B1 publiceert DUO niet.</li>
  <li>Afschalen naar A2: alleen vanuit de B1-route, na 600 uur les.</li>
  <li>Naturalisatie vraagt nu <strong>A2</strong>, niet B1.</li>
</ul>`,

  faq: [
    {
      q: 'Is het B1-examen hetzelfde examen als A2, maar moeilijker?',
      a: 'Nee. Het taalexamen op A2 is het inburgeringsexamen; op B1 en B2 doe je het staatsexamen NT2. Dat is een ander examen, op andere locaties, met een eigen tarief en een eigen uitslagtermijn. De onderdelen heten hetzelfde en duren langer: 110, 90, 100 en ongeveer 30 minuten.',
    },
    {
      q: 'Hoeveel vragen zitten er in het examen Lezen op B1?',
      a: 'Dat publiceert DUO nergens, en wij verzinnen het niet. Voor A2 kun je het aflezen aan DUO’s eigen oefenexamens; voor B1 bestaat zo’n bron niet. Wat er officieel over het staatsexamen NT2 bekend is, staat op staatsexamensnt2.nl.',
    },
    {
      q: 'Wie bepaalt of ik A2 of B1 moet doen?',
      a: 'Je gemeente, na de brede intake en de leerbaarheidstoets. In de B1-route doe je de taalexamens binnen drie jaar op B1, in de onderwijsroute op B1 of hoger, en in de Z-route leer je A1 en mag je A2-examens doen. Wat voor jou geldt, staat in je PIP.',
    },
    {
      q: 'Kan ik van B1 terugvallen naar A2?',
      a: 'Alleen vanuit de B1-route, en onder voorwaarden. Je moet ten minste 600 cursusuren NT2 hebben gevolgd bij een instelling met een keurmerk en aantoonbaar voldoende inspanning hebben geleverd. De gemeente controleert dat en beslist erover, niet DUO en niet je school.',
    },
    {
      q: 'Heb ik B1 nodig om Nederlander te worden?',
      a: 'Op dit moment niet. Voor naturalisatie en voor een verblijfsvergunning voor onbepaalde tijd geldt minimaal A2. De verhoging van die eis naar B1 is een wetsvoorstel en nog geen geldend recht. Op je diploma staat wel welk niveau je hebt gehaald: A2, B1 of B2.',
    },
    {
      q: 'Wat kost het staatsexamen NT2 op B1?',
      a: 'Dat heeft een eigen tarief, los van de €50 per onderdeel die voor de inburgeringsexamens geldt. Omdat dat bedrag verandert, staat het hier niet: kijk het actuele examengeld na op duo.nl bij het staatsexamen NT2, vóór je je aanmeldt.',
    },
  ],

  related: ['taalexamens-a2-b1', 'lezen-examen', 'schrijven-examen', 'spreken-examen'],
  relatedPosts: ['taalniveaus-a1-a2-b1-nederlands'],

  ctaTitle: 'Oefen een examen op B1',
  ctaDesc: 'Gratis proefexamen Lezen op niveau B1, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start het gratis proefexamen',
};

export default guide;
