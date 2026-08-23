/**
 * The Taalexamens cluster's pillar: "De taalexamens A2 en B1".
 *
 * The section's only pillar. Its four spokes are the per-onderdeel guides.
 *
 * Three sourcing rules this page carries for the whole cluster, all from `SEO/facts.md`:
 *
 *  - **Item counts are attributed to DUO's own oefenexamens, never to "het examen".** DUO
 *    publishes no item count on any informational page; the 25/25/4/16 figures were read off the
 *    start screens of the public practice exams (§1, "How the item counts were established").
 *    "Het examen bestaat officieel uit 25 vragen" is exactly the sentence that may not be written.
 *  - **The durations are DUO's own, for both levels.** A2 from the taalexamens page, B1 likewise —
 *    Lezen 110, Luisteren 90, Schrijven 100, Spreken ongeveer 30 minuten.
 *  - **No pass norm.** §9's do-not-publish list, and `tests-unit/guides.test.ts` enforces it with
 *    a regex. The cesuur is a ministerial decision DUO does not publish, and saying so is the
 *    wedge that separates this site from every competitor that states 18-van-25.
 *
 * B1 is described here as an exam a reader may have to take — that is a fact about DUO, not a
 * claim about our catalogue. Our own B1 practice material is behind the docent's review gate and
 * this page does not advertise it.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_BOOK, I_HEADPHONES, I_PEN, I_MIC, I_CLOCK, I_EURO, I_ROUTE, I_LANDMARK,
  docent, note, inlineCta, factTwo,
} from './kit';

const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const SRC_REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const SRC_UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag-examen.jsp';
const SRC_KOSTEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
const SRC_ROUTES = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
const SRC_PLAATSEN = 'https://www.inburgeren.nl/examen-doen/examenplaatsen.jsp';
const CHECKED = '23-08-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'taalexamens-a2-b1',
  section: 'taalexamens',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: true,
  coverGlyph: 'quad',

  title: 'Taalexamens A2 en B1: lezen, luisteren, schrijven, spreken',
  description:
    'Vier taalonderdelen, twee niveaus. Wat je doet bij lezen, luisteren, schrijven en spreken, hoe lang elk examen duurt en wat het verschil is tussen A2 en B1.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'De taalexamens',
  eyebrow: 'Taalexamens',

  heroTitle: 'De taalexamens A2 en B1',
  heroSubtitle:
    'Vier onderdelen: lezen, luisteren, schrijven en spreken. Ze zijn alle vier anders van vorm, en je bereidt je er ook anders op voor. Hier staat hoe ze werken.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="vier-onderdelen">Vier onderdelen, vier aparte examens</h2>

<p>Je taalexamen is niet &eacute;&eacute;n examen. Het zijn er vier, en je doet ze op vier
verschillende momenten. Je kunt er dus ook &eacute;&eacute;n tegelijk halen — en als je er
&eacute;&eacute;n niet haalt, hoef je alleen dat onderdeel over te doen.</p>

<div class="guide-cards">
  ${card(I_BOOK, 'Lezen', 'Je leest korte teksten en beantwoordt vragen erover. Op de computer. Op A2 duurt het 65 minuten, op B1 110 minuten.')}
  ${card(I_HEADPHONES, 'Luisteren', 'Je kijkt naar filmpjes en luistert naar gesprekken, en beantwoordt vragen. Op de computer. A2 duurt 45 minuten, B1 90 minuten.')}
  ${card(I_PEN, 'Schrijven', 'Je schrijft korte teksten en vult formulieren in. Op A2 doe je dit <strong>met pen en papier</strong> in 40 minuten; op B1 duurt het 100 minuten.')}
  ${card(I_MIC, 'Spreken', 'Je spreekt in via een microfoon; je krijgt filmpjes en plaatjes te zien. A2 duurt 35 minuten, B1 ongeveer 30 minuten.')}
</div>

${fact('DUO over de taalexamens: Lezen A2 duurt 65 minuten en Lezen B1 110 minuten; Luisteren A2 duurt 45 minuten en Luisteren B1 90 minuten; Schrijven A2 maakt u met pen en papier en duurt 40 minuten, Schrijven B1 duurt 100 minuten; Spreken A2 duurt 35 minuten en Spreken B1 ongeveer 30 minuten.', 'inburgeren.nl — Taalexamens A2, B1 en B2', SRC_TAALEXAMENS, CHECKED)}

${note('Schrijven op A2 is het enige onderdeel <strong>op papier</strong>. Dat verrast veel mensen die op een toetsenbord hebben geoefend. Schrijf tijdens je voorbereiding minstens een paar keer met de hand — leesbaar schrijven onder tijdsdruk is een vaardigheid op zich.')}

<h2 id="hoeveel-vragen">Hoeveel vragen zitten erin?</h2>

<p>Hier moeten we voorzichtig zijn, en dat is precies waarom deze site bestaat. <strong>DUO
publiceert nergens hoeveel vragen een examen heeft.</strong> Wat w&eacute;l openbaar is, zijn DUO's
eigen oefenexamens: die kun je zonder inloggen doen, en op het startscherm staat het aantal.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th>Onderdeel (A2)</th><th>In DUO's oefenexamens</th><th>Duur</th></tr></thead>
  <tbody>
    <tr><td><strong>Lezen</strong></td><td>25 vragen</td><td>65 minuten</td></tr>
    <tr><td><strong>Luisteren</strong></td><td>25 vragen</td><td>45 minuten</td></tr>
    <tr><td><strong>Schrijven</strong></td><td>4 opdrachten</td><td>40 minuten</td></tr>
    <tr><td><strong>Spreken</strong></td><td>16 vragen</td><td>35 minuten</td></tr>
  </tbody>
</table>
</div>

<p>Zeg dus niet tegen jezelf: "het examen heeft 25 vragen". Zeg: "de oefenexamens van DUO hebben
er 25". Dat is wat je kunt controleren, en het is genoeg om je voorbereiding op af te stemmen.</p>

${fact('DUO stelt oefenexamens beschikbaar die iedereen zonder inloggen kan maken. Op de startschermen van de A2-oefenexamens staat het aantal vragen: 25 bij Lezen, 25 bij Luisteren en 16 bij Spreken; het oefenexamen Schrijven bevat 4 opdrachten.', 'inburgeren.nl — Oefenen', SRC_OEFENEN, CHECKED)}

<h2 id="a2-of-b1">A2 of B1: welk niveau moet ik doen?</h2>

<p>Dat bepaal je niet zelf. Onder de Wet inburgering 2021 kiest je <strong>gemeente</strong> na de
brede intake en de leerbaarheidstoets een leerroute, en die route bepaalt je niveau.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>B1-route</h3>
    <p>Je doet de taalexamens op niveau B1. Dat is de standaardroute onder de wet van 2021.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Onderwijsroute</h3>
    <p>Vooral voor jongeren die naar het mbo, hbo of de universiteit willen. Je haalt B1 of B2.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Z-route</h3>
    <p>Je leert Nederlands op niveau A1. Je m&aacute;g taalexamens op A2 doen, maar het hoeft niet. Je sluit de route af met een gesprek bij de gemeente.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Wet inburgering 2013</h3>
    <p>Burger je nog in onder de oude wet? Dan doe je de taalexamens op niveau A2.</p>
  </div></div>
</div>

<p>Zit je in de B1-route en blijkt B1 echt te hoog? Dan kun je onder voorwaarden
<strong>afschalen naar A2</strong>. Dat kan alleen vanuit de B1-route, en alleen als je ten minste
600 uur taalles hebt gevolgd bij een school met keurmerk &eacute;n aantoonbaar genoeg je best hebt
gedaan. De gemeente controleert dat.</p>

${factTwo('De gemeente bepaalt op basis van de brede intake welke leerroute u volgt. In de B1-route doet u de taalexamens op niveau B1; in de Z-route leert u Nederlands op niveau A1 en mag u examens op A2 doen, maar dat hoeft niet. Afschalen van B1 naar A2 kan alleen vanuit de B1-route en vereist ten minste 600 uur cursus bij een instelling met keurmerk.', [['inburgeren.nl — U gaat inburgeren', SRC_ROUTES], ['Besluit inburgering 2021, artikel 5.5', 'https://wetten.overheid.nl/jci1.3:c:BWBR0045555&artikel=5.5']], CHECKED)}

<h3>Wat is het verschil tussen A2 en B1 in de praktijk?</h3>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>A2</h3>
      <p class="compare-when">Basisgebruiker</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Teksten</p><p class="compare-val">Kort en concreet: een briefje, een advertentie, een mail van school</p></div>
      <div class="compare-row"><p class="compare-key">Onderwerpen</p><p class="compare-val">Je directe leven: wonen, werk, boodschappen, gezondheid</p></div>
      <div class="compare-row"><p class="compare-key">Schrijven</p><p class="compare-val">Losse zinnen, een formulier, een kort berichtje</p></div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>B1</h3>
      <p class="compare-when">Onafhankelijk gebruiker</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row"><p class="compare-key">Teksten</p><p class="compare-val">Langer en samenhangend: een nieuwsbericht, een folder, een handleiding</p></div>
      <div class="compare-row"><p class="compare-key">Onderwerpen</p><p class="compare-val">Ook buiten je eigen leven: werk, opleiding, actualiteit</p></div>
      <div class="compare-row"><p class="compare-key">Schrijven</p><p class="compare-val">Een samenhangende tekst met een eigen mening en een opbouw</p></div>
    </div>
  </div>
</div>

${docent('Het verschil tussen A2 en B1 is niet vooral meer woorden. Het is dat je op B1 een mening moet kunnen geven en die kunnen uitleggen. Op A2 zeg je "ik vind het niet goed"; op B1 zeg je waarom, met een voorbeeld, in twee of drie zinnen achter elkaar. Daar oefen je te weinig op als je alleen woordjes leert.')}

<h2 id="wanneer-geslaagd">Wanneer ben je geslaagd?</h2>

<p>Dat publiceert DUO niet. In het Examenreglement staat dat de grens tussen zakken en slagen een
<strong>cesuur</strong> is die door de Minister wordt vastgesteld. Er staat geen percentage bij en
geen aantal goede antwoorden.</p>

<p>Sites die wel zo'n getal noemen, kunnen het niet onderbouwen. Wij noemen het daarom niet. Wat je
w&eacute;l kunt doen: oefen tot je je in elk onderdeel comfortabel voelt binnen de tijd, in plaats
van te mikken op een grens die niemand kent.</p>

${fact('Het Examenreglement inburgering bepaalt dat de grens tussen zakken en slagen wordt gevormd door een cesuur, vastgesteld door de Minister. Een concreet percentage of aantal goede antwoorden publiceert DUO niet.', 'DUO — Examenreglement inburgering, artikel 10', SRC_REGLEMENT, CHECKED)}

<h2 id="aanmelden">Aanmelden, kosten en uitslag</h2>

<p>Je meldt je per onderdeel aan via <strong>Mijn Inburgering</strong>, met DigiD. Je kiest zelf de
datum en de plaats. Kennisexamens en de taalexamens A2 doe je op een van de zes DUO-locaties:
Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht of Zwolle. B1 en B2 zijn staatsexamens NT2 en
hebben hun eigen locaties.</p>

<p>Op dit moment kost elk onderdeel &euro;50. Die prijs is ge&iuml;ndexeerd — kijk hem na voordat je
je aanmeldt.</p>

<p>De uitslag van de A2-taalexamens komt normaal binnen <strong>8 weken</strong>. Let op de actuele
uitzondering hieronder.</p>

${note('DUO meldde op 31 juli 2026 dat het nakijken van <strong>Spreken A2 en Schrijven A2</strong> op dit moment maximaal <strong>16 weken</strong> duurt. Wie daardoor in de knel komt met zijn inburgeringstermijn, krijgt automatisch 6 maanden verlenging. Dit geldt alleen voor die twee onderdelen; controleer de actuele stand bij DUO.')}

${factTwo('De uitslag van de taalexamens A2 en de kennisexamens komt binnen 8 weken. De examens worden afgenomen op zes locaties: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht en Zwolle.', [['inburgeren.nl — Uitslag examen', SRC_UITSLAG], ['inburgeren.nl — Examenplaatsen', SRC_PLAATSEN]], CHECKED)}

${fact('Voor het inburgeringsexamen betaalt u per onderdeel; op dit moment is dat €50 per examen. De bedragen zijn geïndexeerd en kunnen wijzigen.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="volgorde">In welke volgorde doe je ze?</h2>

<p>Er is geen verplichte volgorde. Maar er is wel een verstandige, en die gaat over
<strong>wachttijden</strong>, niet over moeilijkheid.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Slim</p>
    <ul>
      <li>${I_CHECK}<span>Begin met Lezen en Luisteren: die worden automatisch nagekeken en je hebt de uitslag het snelst</span></li>
      <li>${I_CHECK}<span>Plan Schrijven en Spreken ruim v&oacute;&oacute;r het einde van je termijn — die worden door mensen beoordeeld en duren langer</span></li>
      <li>${I_CHECK}<span>Meld je aan zodra je er klaar voor b&iacute;jna bent; er zit weken tussen aanmelden en de eerste vrije datum</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Riskant</p>
    <ul>
      <li>${I_X}<span>Alle vier tegelijk plannen in de laatste maanden van je termijn</span></li>
      <li>${I_X}<span>Wachten met aanmelden tot je je "helemaal klaar" voelt</span></li>
      <li>${I_X}<span>Rekenen op een herkansing zonder de wachttijd voor de uitslag mee te tellen</span></li>
    </ul>
  </div>
</div>

${inlineCta('Bereken je eigen einddata', 'De tijdlijn-maker rekent per onderdeel uit wanneer je je uiterlijk moet aanmelden om binnen je termijn te blijven.', '/oefenen', 'Begin met gratis oefenen')}

<h2 id="oefenen">Hoe je je voorbereidt</h2>

<p>Per onderdeel anders. Daarvoor heeft elk onderdeel op deze site zijn eigen gids: wat je precies
krijgt voorgelegd, waar de tijd in gaat zitten, en waar de meeste mensen op struikelen.</p>

${docent('Het grootste verschil tussen slagen en zakken is bij mijn cursisten zelden het niveau. Het is de tijd. Ze kennen de woorden wel, maar ze hebben nooit onder een klok geoefend. Doe minstens drie keer een compleet oefenexamen met een timer erbij v&oacute;&oacute;r je het echte doet.')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Vier aparte examens: lezen, luisteren, schrijven, spreken.</li>
  <li>A2: 65, 45, 40 en 35 minuten. B1: 110, 90, 100 en ongeveer 30 minuten.</li>
  <li>Schrijven A2 is met pen en papier.</li>
  <li>Je gemeente bepaalt via de leerroute of je A2 of B1 doet.</li>
  <li>De zak-slaaggrens publiceert DUO niet.</li>
</ul>`,

  faq: [
    {
      q: 'Hoeveel vragen heeft het inburgeringsexamen A2?',
      a: 'DUO publiceert dat niet op zijn informatiepagina’s. Wel zijn de eigen oefenexamens van DUO openbaar, en daarop staat het aantal: 25 vragen bij Lezen, 25 bij Luisteren, 16 bij Spreken en 4 opdrachten bij Schrijven. Reken daarop, maar noem het geen officiële norm.',
    },
    {
      q: 'Hoeveel vragen moet ik goed hebben om te slagen?',
      a: 'Dat maakt DUO niet bekend. In het Examenreglement staat dat de grens een cesuur is die de Minister vaststelt; er is geen gepubliceerd percentage en geen aantal goede antwoorden. Getallen die je elders leest, komen niet van DUO.',
    },
    {
      q: 'Moet ik A2 of B1 doen?',
      a: 'Dat hangt af van je leerroute, en die kiest je gemeente na de brede intake en de leerbaarheidstoets. In de B1-route doe je de examens op B1, in de onderwijsroute B1 of B2, en in de Z-route leer je A1 en mag je A2-examens doen. Burger je in onder de wet van 2013, dan is het A2.',
    },
    {
      q: 'Kan ik van B1 terug naar A2?',
      a: 'Alleen vanuit de B1-route, en onder voorwaarden. Je moet ten minste 600 uur taalles hebben gevolgd bij een taalschool met keurmerk, en je moet aantoonbaar genoeg je best hebben gedaan. De gemeente controleert dat en beslist.',
    },
    {
      q: 'Hoe lang duurt het voordat ik mijn uitslag heb?',
      a: 'Normaal binnen 8 weken voor de taalexamens A2 en de kennisexamens. DUO meldde op 31 juli 2026 dat Spreken A2 en Schrijven A2 op dit moment tot 16 weken kunnen duren, met automatisch zes maanden verlenging voor wie daardoor in de knel komt. Controleer de actuele stand bij DUO.',
    },
    {
      q: 'Kan ik één onderdeel apart doen?',
      a: 'Ja. De vier taalonderdelen zijn aparte examens met een eigen aanmelding, een eigen datum en een eigen uitslag. Haal je er één niet, dan doe je alleen dat onderdeel over; wat je al hebt gehaald, blijft staan.',
    },
  ],

  related: ['lezen-examen', 'luisteren-examen', 'schrijven-examen', 'spreken-examen'],
  relatedPosts: ['inburgeringsexamen-a2-uitleg', 'taalniveaus-a1-a2-b1-nederlands'],

  ctaTitle: 'Oefen een compleet examenonderdeel',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
