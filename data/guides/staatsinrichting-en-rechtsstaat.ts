/**
 * KNM thema 7 — Staatsinrichting en rechtsstaat.
 *
 * Two eindtermen (Stcrt. 2024, 15802): 7.1 verdieping in de democratische rechtsstaat ·
 * 7.2 kennen van wettelijke bepalingen.
 *
 * **Nothing about a current government, coalition or party belongs here.** A guide naming who is
 * in office ages within a year and would then be teaching a candidate a wrong answer with our
 * name on it. The page describes the *system*: who makes law, who governs, who judges, and which
 * rights are constitutional. Those do not move.
 *
 * The one date-bearing fact — the frequency of the elections — is stated as a rule, not as a next
 * election date, for the same reason.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_LANDMARK, I_USERS, I_CLIPBOARD, I_HOME, docent, note, inlineCta, factTwo } from './kit';

export const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
export const SRC_GRONDWET = 'https://wetten.overheid.nl/BWBR0001840';
export const SRC_ART1 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0001840&artikel=1';
export const SRC_PARLEMENT = 'https://www.rijksoverheid.nl/onderwerpen/parlement';
export const SRC_VERKIEZINGEN = 'https://www.rijksoverheid.nl/onderwerpen/verkiezingen';
export const SRC_RECHTSPRAAK = 'https://www.rechtspraak.nl/Organisatie-en-contact/Rechtsstaat';
export const SRC_KONING = 'https://www.koninklijkhuis.nl/onderwerpen/staatsrecht';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'staatsinrichting-en-rechtsstaat',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'scales',

  title: 'KNM: Staatsinrichting en rechtsstaat uitgelegd',
  description:
    'Hoe werkt de Nederlandse democratie? Over de regering, het parlement, verkiezingen, de Grondwet en de onafhankelijke rechter. Het KNM-thema Staatsinrichting.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Staatsinrichting',
  eyebrow: 'KNM-thema 7',

  heroTitle: 'Staatsinrichting en rechtsstaat',
  heroSubtitle:
    'Wie maakt de wetten, wie bestuurt het land, en wie controleert dat? Dit thema legt uit hoe de Nederlandse democratie in elkaar zit — en waarom niemand boven de wet staat.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="wat-vraagt-knm">Wat vraagt KNM over dit thema?</h2>

<div class="compare-rows">
  ${row('7.1', 'Verdieping in de democratische rechtsstaat')}
  ${row('7.2', 'Kennen van wettelijke bepalingen')}
</div>

${fact('De eindtermen KNM bij thema Staatsinrichting en rechtsstaat zijn: verdieping in de democratische rechtsstaat, en het kennen van wettelijke bepalingen.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

<h2 id="democratie">Nederland is een democratie</h2>

<p>Dat betekent: het volk kiest. Niet de koning, niet het leger, niet &eacute;&eacute;n partij. Om
de vier jaar zijn er verkiezingen voor de Tweede Kamer, en iedereen van 18 jaar en ouder met de
Nederlandse nationaliteit mag stemmen.</p>

<p>Nederland is ook een <strong>constitutionele monarchie</strong>: er is een koning, maar hij
regeert niet. De koning is staatshoofd en heeft een ceremoni&euml;le rol. De ministers zijn
verantwoordelijk, en zij leggen verantwoording af aan het parlement.</p>

${fact('De Koning is onschendbaar; de ministers zijn verantwoordelijk. De Koning is staatshoofd en maakt samen met de ministers deel uit van de regering, maar het beleid is de verantwoordelijkheid van de bewindslieden.', 'Het Koninklijk Huis — Staatsrecht', SRC_KONING, CHECKED)}

<h3>Wie doet wat?</h3>

<div class="guide-cards">
  ${card(I_LANDMARK, 'De regering', 'De koning en de ministers. Zij besturen het land en bereiden wetten voor. De minister-president is de voorzitter van de ministerraad.')}
  ${card(I_USERS, 'De Tweede Kamer', '150 leden, gekozen door het volk. Zij maken wetten mee, veranderen ze, en controleren de regering. Dit is de belangrijkste politieke arena van het land.')}
  ${card(I_USERS, 'De Eerste Kamer', '75 leden, gekozen door de Provinciale Staten. Zij kijken alleen of een wet goed en uitvoerbaar is: ja of nee, veranderen mag niet.')}
  ${card(I_CLIPBOARD, 'De rechter', 'Onafhankelijk van politiek. De rechter beoordeelt of iemand de wet heeft overtreden en beslecht conflicten tussen mensen, bedrijven en de overheid.')}
</div>

<p>Die scheiding is het hart van dit thema. De wetgever maakt de wet, de regering voert hem uit,
en de rechter oordeelt — en die drie zijn van elkaar gescheiden. Dat heet de
<strong>trias politica</strong>, of scheiding der machten.</p>

${factTwo('Het parlement (Staten-Generaal) bestaat uit de Tweede Kamer met 150 leden en de Eerste Kamer met 75 leden; het parlement maakt samen met de regering wetten en controleert de regering. De rechtspraak is onafhankelijk: rechters oordelen zonder inmenging van politiek of bestuur.', [['Rijksoverheid — Parlement', SRC_PARLEMENT], ['Rechtspraak.nl — De rechtsstaat', SRC_RECHTSPRAAK]], CHECKED)}

<h2 id="verkiezingen">Verkiezingen: waarvoor stem je?</h2>

<p>Er zijn in Nederland meerdere verkiezingen, en ze gaan over verschillende dingen. Dit is precies
het soort onderscheid waar het examen naar vraagt.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Verkiezing</th><th>Waarvoor</th><th>Wie mag stemmen</th></tr></thead>
  <tbody>
    <tr><td><strong>Tweede Kamer</strong></td><td>Het landsbestuur</td><td>Nederlanders vanaf 18 jaar</td></tr>
    <tr><td><strong>Gemeenteraad</strong></td><td>Je eigen gemeente</td><td>Ook niet-Nederlanders, als je lang genoeg legaal in Nederland woont</td></tr>
    <tr><td><strong>Provinciale Staten</strong></td><td>De provincie — &eacute;n indirect de Eerste Kamer</td><td>Nederlanders vanaf 18 jaar</td></tr>
    <tr><td><strong>Waterschap</strong></td><td>Dijken en waterbeheer</td><td>Inwoners van het waterschap</td></tr>
    <tr><td><strong>Europees Parlement</strong></td><td>De Europese Unie</td><td>EU-burgers</td></tr>
  </tbody>
</table>
</div>

<p>Let op de tweede rij: voor de <strong>gemeenteraad</strong> mag je meestal ook stemmen als je
niet de Nederlandse nationaliteit hebt, mits je hier lang genoeg legaal woont. Veel inburgeraars
weten dat niet. Je krijgt vanzelf een stempas thuisgestuurd als je stemrecht hebt.</p>

${fact('Voor de Tweede Kamer geldt actief kiesrecht vanaf 18 jaar voor Nederlanders. Bij gemeenteraadsverkiezingen mogen ook niet-Nederlandse inwoners stemmen, onder voorwaarden over de duur van hun rechtmatig verblijf in Nederland.', 'Rijksoverheid — Verkiezingen', SRC_VERKIEZINGEN, CHECKED)}

${note('Stemmen is in Nederland een <strong>recht, geen plicht</strong>. Niemand mag je dwingen te stemmen, en niemand mag je dwingen op een bepaalde partij te stemmen. Wat je stemt is geheim, ook voor je familie en je werkgever.')}

<h3>Hoe stemmen werkt</h3>
<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Je stempas komt per post</h3>
    <p>Heb je stemrecht, dan krijg je hem automatisch thuis. Bewaar hem goed.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Neem je stempas &eacute;n je identiteitsbewijs mee</h3>
    <p>Zonder allebei kun je niet stemmen. Je ID mag maximaal vijf jaar verlopen zijn.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>In het stemhokje ben je alleen</h3>
    <p>Je maakt &eacute;&eacute;n vakje rood met het rode potlood. Niemand mag met je mee, behalve bij een lichamelijke beperking.</p>
  </div></div>
</div>

<h2 id="rechtsstaat">Rechtsstaat: niemand staat boven de wet</h2>

<p>Democratie is: de meerderheid beslist. Rechtsstaat is: ook de meerderheid moet zich aan de wet
houden, en minderheden worden beschermd. Die twee samen maken een democratische rechtsstaat.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Wat dat concreet betekent</p>
    <ul>
      <li>${I_CHECK}<span>De overheid moet zich ook aan de wet houden, en je kunt de overheid voor de rechter dagen</span></li>
      <li>${I_CHECK}<span>Rechters zijn onafhankelijk en worden niet door politici benoemd of ontslagen op inhoud</span></li>
      <li>${I_CHECK}<span>Je bent onschuldig tot een rechter het tegendeel bewijst</span></li>
      <li>${I_CHECK}<span>Je hebt recht op een advocaat, en op een tolk als je de taal niet spreekt</span></li>
      <li>${I_CHECK}<span>Je kunt bijna altijd in hoger beroep</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Wat niet mag, van niemand</p>
    <ul>
      <li>${I_X}<span>Zelf recht spreken of wraak nemen</span></li>
      <li>${I_X}<span>Iemand straffen zonder rechter</span></li>
      <li>${I_X}<span>Discrimineren, ook niet uit naam van een geloof of een traditie</span></li>
      <li>${I_X}<span>Geweld gebruiken binnen het gezin — dat is strafbaar, ook tegen je partner of je kind</span></li>
    </ul>
  </div>
</div>

<h2 id="grondrechten">De Grondwet en je grondrechten</h2>

<p>De Grondwet is de belangrijkste wet van het land. Alle andere wetten moeten ermee kloppen. De
eerste artikelen gaan over jouw rechten.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Recht</th><th>Wat het betekent</th></tr></thead>
  <tbody>
    <tr><td><strong>Gelijke behandeling</strong></td><td>Iedereen wordt in gelijke gevallen gelijk behandeld; discriminatie is verboden (artikel 1)</td></tr>
    <tr><td><strong>Vrijheid van godsdienst</strong></td><td>Je mag geloven wat je wilt, en dat ook uiten — of niets geloven</td></tr>
    <tr><td><strong>Vrijheid van meningsuiting</strong></td><td>Je mag zeggen en schrijven wat je vindt, ook over de regering. Aanzetten tot haat en discriminatie mag niet.</td></tr>
    <tr><td><strong>Vrijheid van vereniging en vergadering</strong></td><td>Je mag lid worden van een club, een vakbond of een partij, en demonstreren</td></tr>
    <tr><td><strong>Onaantastbaarheid van het lichaam</strong></td><td>Niemand mag jou aanraken of iets met je lichaam doen zonder jouw toestemming</td></tr>
    <tr><td><strong>Recht op onderwijs</strong></td><td>Onderwijs is vrij, en er is leerplicht voor kinderen</td></tr>
  </tbody>
</table>
</div>

<p>Grondrechten botsen soms met elkaar — vrijheid van meningsuiting tegen het discriminatieverbod
bijvoorbeeld. In Nederland beslist dan de <strong>rechter</strong> welk recht in dat geval
zwaarder weegt. Niet de regering, en niet de meerderheid.</p>

${factTwo('De Grondwet is de hoogste nationale wet en bevat de grondrechten, waaronder het verbod op discriminatie in artikel 1. Andere wetgeving moet met de Grondwet in overeenstemming zijn.', [['wetten.overheid.nl — Grondwet', SRC_GRONDWET], ['wetten.overheid.nl — Artikel 1 Grondwet', SRC_ART1]], CHECKED)}

${docent('Dit thema voelt voor cursisten vaak abstract, tot het over hun eigen leven gaat. Vrijheid van meningsuiting is een idee; dat je een klacht mag indienen tegen je gemeente en dat een rechter die gemeente ongelijk kan geven, is heel concreet. Zoek bij elk grondrecht &eacute;&eacute;n voorbeeld uit je eigen leven — dan blijft het hangen.')}

<h2 id="wettelijke-bepalingen">Wettelijke bepalingen die je moet kennen</h2>

<p>Eindterm 7.2 gaat over regels waar je in het dagelijks leven mee te maken krijgt.</p>

<div class="guide-cards">
  ${card(I_HOME, 'Identificatieplicht', 'Vanaf 14 jaar moet je je identiteitsbewijs kunnen laten zien als een agent of controleur erom vraagt.')}
  ${card(I_CLIPBOARD, 'Leerplicht', 'Kinderen van 5 tot 16 jaar moeten naar school, en daarna geldt de kwalificatieplicht tot 18 jaar of tot een startkwalificatie.')}
  ${card(I_USERS, 'Gelijkheid in het gezin', 'Man en vrouw zijn gelijk voor de wet. Huwelijksdwang, kindhuwelijk en polygamie zijn in Nederland verboden.')}
  ${card(I_LANDMARK, 'Huiselijk geweld', 'Geweld tegen je partner of je kind is strafbaar. Voor hulp en advies is er Veilig Thuis, ook anoniem.')}
  ${card(I_CLIPBOARD, 'Verkeersregels', 'Fietsverlichting, geen alcohol op de weg, en geen telefoon in je hand — ook niet op de fiets.')}
</div>

${note('Weet je niet zeker of iets mag? Vraag het aan het Juridisch Loket of aan je gemeente v&oacute;&oacute;rdat je iets doet. Onwetendheid is in Nederland geen excuus, maar hulp vragen is gratis en normaal.')}

<h2 id="in-het-examen">Hoe dit in het examen terugkomt</h2>

<p>Als situaties over rechten: mag iemand dit zeggen, mag een werkgever dit vragen, wie beslist
hier eigenlijk? De veilige lijn is: <strong>iedereen gelijk, de rechter beslist, de overheid staat
ook onder de wet</strong>.</p>

${inlineCta('Oefen dit thema met examenvragen', 'Democratie, grondrechten en de rechter — met uitleg na elk antwoord.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Democratie: het volk kiest, om de vier jaar de Tweede Kamer (150 leden).</li>
  <li>De koning is staatshoofd maar regeert niet; ministers zijn verantwoordelijk.</li>
  <li>Scheiding der machten: wetgever, bestuur en rechter zijn gescheiden.</li>
  <li>Voor de gemeenteraad mag je vaak ook stemmen zonder Nederlands paspoort.</li>
  <li>De Grondwet gaat boven andere wetten; artikel 1 verbiedt discriminatie.</li>
</ul>`,

  faq: [
    {
      q: 'Wie bestuurt Nederland: de koning of de regering?',
      a: 'De regering, en die bestaat uit de koning en de ministers. Maar de koning regeert niet: hij is onschendbaar en heeft vooral een ceremoniële rol. De ministers zijn verantwoordelijk voor het beleid en leggen daarover verantwoording af aan het parlement.',
    },
    {
      q: 'Wat is het verschil tussen de Tweede en de Eerste Kamer?',
      a: 'De Tweede Kamer heeft 150 leden en wordt rechtstreeks door de kiezers gekozen. Die Kamer maakt wetten mee, mag ze veranderen en controleert de regering. De Eerste Kamer heeft 75 leden, wordt gekozen door de Provinciale Staten, en kijkt alleen nog of een wet goed en uitvoerbaar is: ja of nee, zonder te wijzigen.',
    },
    {
      q: 'Mag ik stemmen als ik geen Nederlands paspoort heb?',
      a: 'Voor de gemeenteraad meestal wel, als je lang genoeg rechtmatig in Nederland woont. Voor de Tweede Kamer en de Provinciale Staten heb je de Nederlandse nationaliteit nodig. Heb je stemrecht, dan krijg je vanzelf een stempas thuisgestuurd.',
    },
    {
      q: 'Wat is een rechtsstaat?',
      a: 'Een land waarin iedereen zich aan de wet moet houden, ook de overheid zelf. Rechters zijn onafhankelijk, je bent onschuldig tot het tegendeel bewezen is, je hebt recht op een advocaat en je kunt in hoger beroep. Dat beschermt ook minderheden tegen een meerderheid die iets anders wil.',
    },
    {
      q: 'Wat staat er in artikel 1 van de Grondwet?',
      a: 'Dat iedereen die zich in Nederland bevindt in gelijke gevallen gelijk wordt behandeld, en dat discriminatie niet is toegestaan — niet wegens godsdienst, levensovertuiging, politieke gezindheid, ras, geslacht, handicap of seksuele gerichtheid, en ook niet op welke grond dan ook.',
    },
  ],

  related: ['instanties', 'omgangsvormen-waarden-en-normen', 'geschiedenis-en-geografie'],
  relatedPosts: [],

  ctaTitle: 'Oefen het thema Staatsinrichting',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
