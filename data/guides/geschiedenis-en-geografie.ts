/**
 * KNM thema 5 — Geschiedenis en geografie.
 *
 * Two eindtermen (Stcrt. 2024, 15802): 5.1 zich verdiepen in de Nederlandse geschiedenis ·
 * 5.2 geografische kennis van Nederland gebruiken.
 *
 * The trap in this thema is that it looks like the one place where dates and names are the
 * content, so it invites exactly the list-learning the KNM exam does not test. The eindterm says
 * *gebruiken* for geography and *zich verdiepen in* for history: what is examined is orientation —
 * where things are, why the water matters, what the big lines are — not a chronology.
 *
 * Every historical claim here is a broad, uncontested one and is anchored to the Canon van
 * Nederland, which is the state-commissioned reference and the only source that can carry a claim
 * about "the" Dutch history without editorialising. Nothing about a living political controversy
 * belongs on this page.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_HOME, I_LANDMARK, I_USERS, I_BOOK, I_ROUTE, docent, note, inlineCta, factTwo } from './kit';

const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
const SRC_CANON = 'https://www.canonvannederland.nl/nl/canon';
const SRC_KONINKLIJK = 'https://www.koninklijkhuis.nl/onderwerpen/koningsdag';
const SRC_WATER = 'https://www.rijksoverheid.nl/onderwerpen/water-en-veiligheid';
const SRC_PROVINCIES = 'https://www.rijksoverheid.nl/onderwerpen/provincies';
const SRC_CBS = 'https://www.cbs.nl/nl-nl/visualisaties/dashboard-bevolking';
const CHECKED = '23-08-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'geschiedenis-en-geografie',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'globe',

  title: 'KNM: Geschiedenis en geografie van Nederland',
  description:
    'De grote lijnen van de Nederlandse geschiedenis en de ligging van provincies, steden en water. Het KNM-thema Geschiedenis en geografie, eenvoudig uitgelegd.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Geschiedenis en geografie',
  eyebrow: 'KNM-thema 5',

  heroTitle: 'Geschiedenis en geografie',
  heroSubtitle:
    'Waar ligt wat, en hoe is Nederland geworden wat het is? Dit thema vraagt geen jaartallenlijst, maar wel dat je de grote lijnen kent en de kaart kunt lezen.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="wat-vraagt-knm">Wat vraagt KNM over dit thema?</h2>

<p>Twee eindtermen. Let goed op hoe ze geformuleerd zijn — dat zegt alles over wat je moet
kunnen.</p>

<div class="compare-rows">
  ${row('5.1', 'Zich verdiepen in de Nederlandse geschiedenis')}
  ${row('5.2', 'Geografische kennis van Nederland <strong>gebruiken</strong>')}
</div>

<p>Bij geschiedenis gaat het om <em>verdiepen</em>: de grote lijnen begrijpen, en snappen waarom
sommige dingen hier zijn zoals ze zijn. Bij geografie gaat het om <em>gebruiken</em>: de kaart
kunnen lezen, weten waar je bent, en snappen waarom een treinreis van Groningen naar Maastricht
anders is dan van Amsterdam naar Utrecht.</p>

${fact('De eindtermen KNM bij thema Geschiedenis en geografie zijn: zich verdiepen in de Nederlandse geschiedenis, en geografische kennis van Nederland gebruiken.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

${docent('Dit is het thema waar cursisten het hardst gaan blokken en het minst aan hebben. Er komt geen vraag "in welk jaar begon de Tachtigjarige Oorlog". Er komt wel een vraag waarin iemand op 5 mei vrij wil zijn, of iemand van Rotterdam naar Zeeland moet. Leer de lijnen, niet de lijstjes.')}

<h2 id="geografie">Het land: water, provincies en steden</h2>

<p>Nederland is klein, dichtbevolkt en voor een groot deel laag. Ongeveer een kwart van het land
ligt onder de zeespiegel, en zonder dijken, duinen en gemalen zou een groot deel onder water
staan. Daarom is water hier geen bijzaak maar overheidsbeleid: er zijn
<strong>waterschappen</strong> die alleen daarover gaan, en waar je apart belasting aan betaalt en
apart voor stemt.</p>

${fact('Nederland ligt voor een groot deel laag en wordt beschermd door dijken, duinen en dammen. Waterschappen zorgen samen met het Rijk voor de bescherming tegen overstromingen en voor het waterbeheer.', 'Rijksoverheid — Water en veiligheid', SRC_WATER, CHECKED)}

<h3>De twaalf provincies</h3>

<p>Nederland heeft twaalf provincies. Elke provincie heeft een hoofdstad, een provinciebestuur en
een eigen karakter. Dit is de lijst, van noord naar zuid.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Provincie</th><th>Hoofdstad</th></tr></thead>
  <tbody>
    <tr><td><strong>Groningen</strong></td><td>Groningen</td></tr>
    <tr><td><strong>Friesland</strong> (Frysl&acirc;n)</td><td>Leeuwarden</td></tr>
    <tr><td><strong>Drenthe</strong></td><td>Assen</td></tr>
    <tr><td><strong>Overijssel</strong></td><td>Zwolle</td></tr>
    <tr><td><strong>Flevoland</strong></td><td>Lelystad</td></tr>
    <tr><td><strong>Gelderland</strong></td><td>Arnhem</td></tr>
    <tr><td><strong>Utrecht</strong></td><td>Utrecht</td></tr>
    <tr><td><strong>Noord-Holland</strong></td><td>Haarlem</td></tr>
    <tr><td><strong>Zuid-Holland</strong></td><td>Den Haag</td></tr>
    <tr><td><strong>Zeeland</strong></td><td>Middelburg</td></tr>
    <tr><td><strong>Noord-Brabant</strong></td><td>'s-Hertogenbosch</td></tr>
    <tr><td><strong>Limburg</strong></td><td>Maastricht</td></tr>
  </tbody>
</table>
</div>

${note('Let op twee dingen die vaak fout gaan. <strong>Amsterdam is de hoofdstad van Nederland, maar de regering en het parlement zitten in Den Haag.</strong> En <strong>Flevoland bestond nog niet honderd jaar geleden</strong>: die provincie is drooggelegde zeebodem.')}

<h3>Waar wonen de meeste mensen?</h3>

<p>In het westen. De vier grote steden — <strong>Amsterdam, Rotterdam, Den Haag en Utrecht</strong>
— liggen dicht bij elkaar in het gebied dat de <strong>Randstad</strong> heet. Daar wonen en werken
verreweg de meeste mensen, en daar zijn ook de meeste banen en de duurste woningen.</p>

<div class="guide-cards">
  ${card(I_HOME, 'Amsterdam', 'De hoofdstad. Grachten, toerisme, veel internationale bedrijven en Schiphol vlakbij.')}
  ${card(I_ROUTE, 'Rotterdam', 'De grootste haven van Europa. Moderne stad, in de oorlog zwaar gebombardeerd en daarna opnieuw gebouwd.')}
  ${card(I_LANDMARK, 'Den Haag', 'Regering, parlement en de koning werken hier. Ook de stad van internationale rechtspraak.')}
  ${card(I_BOOK, 'Utrecht', 'Midden in het land en het knooppunt van het spoor. Vanuit Utrecht kom je overal.')}
</div>

<p>Verder weg van de Randstad — Groningen, Friesland, Drenthe, Zeeland, Limburg — is het rustiger,
zijn woningen goedkoper en zijn de afstanden groter. Dat is voor de meeste inburgeraars praktische
informatie: waar je woont bepaalt hoe ver je moet reizen naar werk, naar school en naar je
examenlocatie.</p>

${factTwo('Nederland telt twaalf provincies met elk een eigen provinciebestuur. Het Centraal Bureau voor de Statistiek publiceert de actuele bevolkingscijfers per provincie en gemeente.', [['Rijksoverheid — Provincies', SRC_PROVINCIES], ['CBS — Dashboard bevolking', SRC_CBS]], CHECKED)}

<h2 id="geschiedenis">De grote lijnen van de geschiedenis</h2>

<p>Je hoeft geen historicus te worden. Maar deze lijnen komen terug in gesprekken, in het nieuws,
op feestdagen en in het examen.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Water en land</h3>
    <p>Nederlanders hebben eeuwenlang land op het water gewonnen met dijken, molens en later gemalen. "God schiep de wereld, maar de Nederlanders schiepen Nederland" is een grap die iets echts zegt: het landschap is gemaakt.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>De Republiek en de Gouden Eeuw</h3>
    <p>In de zeventiende eeuw was Nederland een republiek, rijk geworden door handel over zee. Uit die tijd komen de grachtenpanden, Rembrandt en Vermeer — maar ook de slavenhandel en de kolonies. Beide horen bij dat verhaal, en dat wordt hier tegenwoordig ook zo verteld.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Koninkrijk en grondwet</h3>
    <p>Sinds 1815 is Nederland een koninkrijk. In 1848 kwam de grondwetsherziening van Thorbecke: vanaf toen regeert niet de koning maar het parlement, en is de koning onschendbaar. Dat is nog steeds zo.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>De Tweede Wereldoorlog</h3>
    <p>Van 1940 tot 1945 bezet door nazi-Duitsland. Het overgrote deel van de Joodse bevolking is vermoord. Dit is de reden dat 4 en 5 mei elk jaar zo zwaar wegen, en dat discriminatie hier een gevoelig en zwaar onderwerp is.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">5</span><div class="guide-step-body">
    <h3>Wederopbouw, verzorgingsstaat en migratie</h3>
    <p>Na 1945 werd het land opgebouwd en ontstond de verzorgingsstaat: AOW, ziektekosten, uitkeringen. Er kwamen mensen uit Indonesi&euml;, Suriname en de Antillen, gastarbeiders uit Turkije en Marokko, en later vluchtelingen uit veel landen. Nederland is daardoor het land dat het nu is.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">6</span><div class="guide-step-body">
    <h3>Europa</h3>
    <p>Nederland is een van de oprichters van wat nu de Europese Unie is. Daarom mag je met een Nederlands paspoort vrij reizen en werken in de EU, en betalen we met de euro.</p>
  </div></div>
</div>

${fact('De Canon van Nederland is de door de overheid ingestelde reeks vensters op de Nederlandse geschiedenis en cultuur, bedoeld als gezamenlijk referentiekader en gebruikt in het onderwijs.', 'Canon van Nederland', SRC_CANON, CHECKED)}

<h2 id="feestdagen">Feestdagen en herdenkingen</h2>

<p>Deze data komen in het examen terug, en ze zijn praktisch: op sommige dagen is alles dicht.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Dag</th><th>Wat het is</th></tr></thead>
  <tbody>
    <tr><td><strong>1 januari</strong></td><td>Nieuwjaarsdag</td></tr>
    <tr><td><strong>Pasen</strong></td><td>Christelijk feest, in het voorjaar. Twee dagen vrij.</td></tr>
    <tr><td><strong>27 april</strong></td><td>Koningsdag — de verjaardag van de koning. Vrijmarkt, oranje, feest.</td></tr>
    <tr><td><strong>4 mei</strong></td><td>Dodenherdenking. Om 20:00 uur twee minuten stilte, in het hele land.</td></tr>
    <tr><td><strong>5 mei</strong></td><td>Bevrijdingsdag. Het einde van de bezetting in 1945.</td></tr>
    <tr><td><strong>Hemelvaart en Pinksteren</strong></td><td>Christelijke feestdagen in mei of juni.</td></tr>
    <tr><td><strong>5 december</strong></td><td>Sinterklaas. Geen offici&euml;le vrije dag, wel groot voor kinderen.</td></tr>
    <tr><td><strong>25 en 26 december</strong></td><td>Eerste en tweede kerstdag.</td></tr>
  </tbody>
</table>
</div>

<p>Op 4 mei om acht uur ’s avonds is het twee minuten stil. Ook op straat, ook in de trein, ook in
de supermarkt. Dat wordt van iedereen verwacht, ongeacht geloof of afkomst — het is geen religieus
moment maar een nationaal moment.</p>

${fact('Koningsdag wordt gevierd op 27 april, de verjaardag van Koning Willem-Alexander. Valt die datum op een zondag, dan wordt Koningsdag op 26 april gevierd.', 'Het Koninklijk Huis — Koningsdag', SRC_KONINKLIJK, CHECKED)}

${docent('Als je maar &eacute;&eacute;n datum onthoudt van dit hele thema, laat het 4 mei zijn. Het is het moment waarop je het meest opvalt als je het niet weet, en het is voor Nederlanders het zwaarste moment van het jaar.')}

<h2 id="in-het-examen">Hoe dit in het examen terugkomt</h2>

<p>Als praktische vragen: welke dag is het, waar moet iemand naartoe, waarom is de winkel dicht.
Niet als een geschiedenistoets.</p>

${inlineCta('Oefen dit thema met examenvragen', 'Kaart, provincies, feestdagen en de grote lijnen — met uitleg na elk antwoord.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Twaalf provincies; Amsterdam is hoofdstad, Den Haag is regeringsstad.</li>
  <li>Een groot deel van het land ligt laag; waterschappen beheren het water.</li>
  <li>De meeste mensen wonen in de Randstad.</li>
  <li>Grote lijnen: water, Gouden Eeuw, koninkrijk 1815, grondwet 1848, WOII, verzorgingsstaat, Europa.</li>
  <li>27 april Koningsdag, 4 mei herdenken, 5 mei bevrijding.</li>
</ul>`,

  faq: [
    {
      q: 'Hoeveel provincies heeft Nederland?',
      a: 'Twaalf: Groningen, Friesland, Drenthe, Overijssel, Flevoland, Gelderland, Utrecht, Noord-Holland, Zuid-Holland, Zeeland, Noord-Brabant en Limburg. Elke provincie heeft een hoofdstad en een eigen bestuur, met een commissaris van de Koning aan het hoofd.',
    },
    {
      q: 'Wat is de hoofdstad van Nederland?',
      a: 'Amsterdam. Maar de regering, het parlement en de ministeries zitten in Den Haag, en daar werkt ook de koning. Dat is een uitzondering die veel mensen verrast: de hoofdstad en de regeringsstad zijn hier niet dezelfde stad.',
    },
    {
      q: 'Wat gebeurt er op 4 en 5 mei?',
      a: 'Op 4 mei is de Dodenherdenking: om acht uur ’s avonds zijn er in het hele land twee minuten stilte voor de slachtoffers van de Tweede Wereldoorlog en van oorlogen daarna. Op 5 mei is het Bevrijdingsdag, de dag waarop in 1945 de bezetting eindigde. Dan zijn er festivals.',
    },
    {
      q: 'Waarom zijn er waterschappen in Nederland?',
      a: 'Omdat een groot deel van het land laag ligt en zonder dijken, duinen en gemalen onder water zou komen. Waterschappen zijn besturen die alleen over water gaan: dijken, waterpeil en waterkwaliteit. Je betaalt er apart belasting aan en je stemt er apart voor, los van gemeente en provincie.',
    },
    {
      q: 'Moet ik jaartallen uit mijn hoofd leren voor KNM?',
      a: 'Nee. De eindterm vraagt dat je je verdiept in de Nederlandse geschiedenis, niet dat je een chronologie kunt opzeggen. Het examen stelt praktische vragen over situaties. Ken de grote lijnen en de belangrijkste dagen in het jaar, dan kom je een heel eind.',
    },
  ],

  related: ['staatsinrichting-en-rechtsstaat', 'omgangsvormen-waarden-en-normen', 'wonen'],
  relatedPosts: [],

  ctaTitle: 'Oefen het thema Geschiedenis en geografie',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
