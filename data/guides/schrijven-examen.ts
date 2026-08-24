/**
 * Taalexamens spoke — Schrijven.
 *
 * The only onderdeel DUO takes **op papier** at A2, and the page leads with that: candidates
 * prepare on a keyboard and then meet a pen. It is also the onderdeel with the longest uitslag
 * at the moment (DUO nieuwsbericht 31-07-2026: Schrijven A2 and Spreken A2 up to 16 weeks,
 * with an automatic six-month verlenging). That figure is dated in the text on purpose — it is a
 * nieuwsbericht, it will go stale, and `SEO/facts.md` §10 says to re-check it on every touch.
 *
 * The four opgave shapes are described as they appear in DUO's own oefenexamen, never as an
 * official blueprint: DUO publishes that the exam has 4 opdrachten and that you write "bijvoorbeeld
 * een korte brief" or fill in a form. Everything beyond that is our reading of the practice
 * material, and is worded as such.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_PEN, I_CLOCK, docent, note, inlineCta, factTwo } from './kit';

export const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
export const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
export const SRC_NT2 = 'https://www.staatsexamensnt2.nl/';
export const SRC_UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag-examen.jsp';
export const SRC_NIEUWS = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'schrijven-examen',
  section: 'taalexamens',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'pen',

  title: 'Het examen Schrijven (A2 en B1): opzet, tijd en aanpak',
  description:
    'Schrijven op A2 doe je met pen en papier: vier opdrachten in 40 minuten. Hoe het examen eruitziet, hoe het beoordeeld wordt en hoe je er gericht voor oefent.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Schrijven',
  eyebrow: 'Taalexamen',

  heroTitle: 'Het examen Schrijven',
  heroSubtitle:
    'Vier opdrachten, veertig minuten, en op A2 met pen en papier. Dit is het onderdeel waar planning meer oplevert dan taalkennis — en waar de uitslag het langst duurt.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="hoe-ziet-het-eruit">Hoe ziet het examen eruit?</h2>

<p>Het eerste wat je moet weten: op niveau A2 schrijf je <strong>met pen en papier</strong>. Niet
op een computer. Dat is het enige onderdeel waarvoor dat geldt.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th></th><th>A2</th><th>B1</th></tr></thead>
  <tbody>
    <tr><td><strong>Duur</strong></td><td>40 minuten</td><td>100 minuten</td></tr>
    <tr><td><strong>Hoe</strong></td><td>Met pen en papier</td><td>Staatsexamen NT2, zie staatsexamensnt2.nl</td></tr>
    <tr><td><strong>Aantal opdrachten</strong></td><td>4 schrijfopdrachten</td><td>zie staatsexamensnt2.nl</td></tr>
    <tr><td><strong>Wat je schrijft</strong></td><td>Bijvoorbeeld een korte brief, of je vult een formulier in</td><td>Langere, samenhangende teksten</td></tr>
    <tr><td><strong>Beoordeling</strong></td><td>Door mensen, niet door de computer</td><td>Door mensen</td></tr>
  </tbody>
</table>
</div>

${factTwo('DUO: "Het examen Schrijven op niveau A2 maakt u met pen en papier. U krijgt 4 schrijfopdrachten. U schrijft bijvoorbeeld een korte brief. Of u vult een formulier in. Het examen duurt 40 minuten." Het examen Schrijven op niveau B1 (staatsexamen Nt2) duurt 100 minuten.', [['inburgeren.nl — Taalexamens', SRC_TAALEXAMENS], ['Staatsexamens NT2', SRC_NT2]], CHECKED)}

${note('Veertig minuten voor vier opdrachten is <strong>tien minuten per opdracht</strong>. Dat is de belangrijkste rekensom van dit examen. Wie de eerste opdracht mooi maakt en dan geen tijd meer heeft, levert twee lege vellen in — en een lege opdracht levert nooit punten op.')}

<h2 id="soorten-opdrachten">Wat voor opdrachten krijg je?</h2>

<p>DUO zegt zelf: een korte brief, of een formulier invullen. In de openbare oefenexamens zie je
grofweg deze vier vormen terug.</p>

<div class="guide-cards">
  ${card(I_PEN, 'Een formulier invullen', 'Naam, adres, geboortedatum, en een paar korte antwoorden. Lijkt makkelijk, maar hier gaan punten verloren door velden over te slaan.')}
  ${card(I_PEN, 'Een korte mededeling of briefje', 'Een berichtje aan de buren, de school of een collega. Kort, maar met een duidelijke boodschap.')}
  ${card(I_PEN, 'Een e-mail of brief', 'Met aanhef en afsluiting. Bijvoorbeeld een afspraak verzetten of iets vragen aan een instantie.')}
  ${card(I_PEN, 'Een korte tekst over jezelf of een situatie', 'Een paar samenhangende zinnen: wat er gebeurde, wat je vindt, wat je wilt.')}
</div>

<p>Bij elke opdracht staat in de instructie <strong>welke punten je moet noemen</strong>. Dat is
geen suggestie. Dat is de checklist waarop je beoordeeld wordt.</p>

${fact('DUO stelt oefenexamens beschikbaar die iedereen kan maken. Het oefenexamen Schrijven A2 is een pdf en bevat 4 opdrachten: "U moet in deze toets 4 vragen beantwoorden."', 'inburgeren.nl — Oefenen', SRC_OEFENEN, CHECKED)}

<h2 id="beoordeling">Hoe wordt het beoordeeld?</h2>

<p>Door mensen, niet door een computer. Dat betekent twee dingen. Ten eerste: het hoeft niet
perfect te zijn — een beoordelaar leest of je boodschap overkomt. Ten tweede: het duurt langer
voordat je je uitslag hebt.</p>

<p>Waar in grote lijnen naar gekeken wordt:</p>

<ul>
  <li><strong>Heb je de opdracht uitgevoerd?</strong> Staan alle gevraagde punten erin? Dit weegt het zwaarst, en het is het makkelijkst te controleren.</li>
  <li><strong>Is het begrijpelijk?</strong> Snapt de lezer wat je bedoelt, ook met een paar fouten erin?</li>
  <li><strong>Past de vorm bij de situatie?</strong> Een brief aan de gemeente is anders dan een briefje aan je buurvrouw.</li>
  <li><strong>Woorden en zinnen.</strong> Genoeg variatie, en zinnen die lopen.</li>
</ul>

${docent('Als ik &eacute;&eacute;n ding mocht veranderen aan hoe mensen zich voorbereiden: schrijf de gevraagde punten eerst over als kladlijstje, en streep ze af terwijl je schrijft. Ik zie prachtige brieven die zakken omdat er drie punten gevraagd werden en er twee in staan. Dat is geen taalprobleem.')}

<h2 id="uitslag">Let op de wachttijd</h2>

<p>De uitslag van de taalexamens komt normaal binnen 8 weken. Maar voor
<strong>Schrijven A2 en Spreken A2</strong> geldt op dit moment een langere termijn.</p>

${factTwo('DUO meldde op 31 juli 2026 dat het nakijken van de examens Spreken A2 en Schrijven A2 op dat moment maximaal 16 weken duurt. Inburgeraars die daardoor in de knel komen met hun inburgeringstermijn, krijgen automatisch zes maanden verlenging. Voor de overige examens geldt de gebruikelijke termijn van 8 weken.', [['inburgeren.nl — Nieuwsbericht 31-07-2026', SRC_NIEUWS], ['inburgeren.nl — Uitslag examen', SRC_UITSLAG]], CHECKED)}

<p>Dit is een bericht van DUO en het kan veranderen — controleer de actuele stand vlak voordat je
plant. Maar zolang het geldt, is de conclusie duidelijk: <strong>doe Schrijven vroeg</strong>. Als
je het aan het einde van je termijn plant en je zakt, heb je geen tijd meer voor een herkansing.</p>

<h2 id="aanpak">Aanpak tijdens het examen</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Kijk eerst naar alle vier de opdrachten</h3>
    <p>Eén minuut. Zo weet je wat er komt en verdeel je je tijd bewust in plaats van per ongeluk.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Onderstreep wat er gevraagd wordt</h3>
    <p>De punten die in de opdracht staan, zijn de punten waarop je beoordeeld wordt. Zet er streepjes bij.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Schrijf, en houd het simpel</h3>
    <p>Korte zinnen die kloppen zijn beter dan lange zinnen die vastlopen. Je hoeft niet mooi te schrijven, je moet duidelijk zijn.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Bewaar vijf minuten voor het einde</h3>
    <p>Loop alle vier de opdrachten na: staan alle gevraagde punten erin, is het leesbaar, heb je niets overgeslagen?</p>
  </div></div>
</div>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Doen</p>
    <ul>
      <li>${I_CHECK}<span>Schrijf <strong>leesbaar</strong>. Wat de beoordelaar niet kan lezen, telt niet mee.</span></li>
      <li>${I_CHECK}<span>Gebruik aanhef en afsluiting bij een brief of mail: "Beste …" en "Met vriendelijke groet".</span></li>
      <li>${I_CHECK}<span>Streep netjes door als je iets fout schrijft; gum niet eindeloos.</span></li>
      <li>${I_CHECK}<span>Lever alle vier de opdrachten in, ook als er &eacute;&eacute;n half af is.</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Niet doen</p>
    <ul>
      <li>${I_X}<span>Eén opdracht perfect maken en de rest laten liggen</span></li>
      <li>${I_X}<span>Moeilijke woorden gebruiken die je niet zeker kent</span></li>
      <li>${I_X}<span>Een velletje uit je hoofd geleerde tekst opschrijven dat niet bij de opdracht past</span></li>
      <li>${I_X}<span>Vergeten je gegevens boven aan het formulier in te vullen</span></li>
    </ul>
  </div>
</div>

<h2 id="oefenen">Hoe je oefent</h2>

<p>Schrijven is het onderdeel waar oefenen het meest direct effect heeft, omdat je fouten
z&iacute;chtbaar zijn en je ze dus kunt aanpakken.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Schrijf met de hand</h3>
    <p>Op A2 is dat het echte examen. Als je alleen typt, merk je pas op de examendag hoe traag en hoe onleesbaar je met een pen bent.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Leer een paar vaste bouwstenen</h3>
    <p>Aanhef, afsluiting, "ik schrijf u omdat…", "kunt u mij laten weten…". Die hoef je dan niet meer te bedenken en houd je tijd over voor de inhoud.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Zet een timer op tien minuten</h3>
    <p>Per opdracht. Zo leer je wat er in tien minuten past, en dat is de vaardigheid die dit examen echt test.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Laat iemand meelezen</h3>
    <p>Bij Schrijven kun je jezelf slecht beoordelen. Vraag je docent, je taalmaatje of gebruik oefenmateriaal waar je feedback per criterium op krijgt.</p>
  </div></div>
</div>

${docent('Bouwstenen zijn geen valsspelen. Nederlanders gebruiken zelf ook steeds dezelfde openingszinnen. Als je vijf standaardzinnen kent voor een aanvraag, een klacht en een afspraak, dan gaat je hoofd tijdens het examen over w&aacute;t je schrijft in plaats van over h&oacute;e je begint.')}

${inlineCta('Oefen Schrijven met beoordeling per criterium', 'Onze schrijfopdrachten worden nagekeken tegen een beoordelingsmodel dat door een NT2-docent is opgesteld.', '/premium', 'Bekijk de modules')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>A2: 4 opdrachten in 40 minuten, met pen en papier.</li>
  <li>B1: 100 minuten, staatsexamen NT2.</li>
  <li>Tien minuten per opdracht — verdeel je tijd bewust.</li>
  <li>Alle gevraagde punten noemen weegt het zwaarst.</li>
  <li>Uitslag Schrijven A2 duurt op dit moment tot 16 weken: plan het vroeg.</li>
</ul>`,

  faq: [
    {
      q: 'Is het examen Schrijven op papier of op de computer?',
      a: 'Op niveau A2 met pen en papier. Dat is het enige taalonderdeel waarvoor dat geldt; lezen, luisteren en spreken doe je op de computer. Oefen daarom een paar keer met de hand, want leesbaar en snel schrijven met een pen is een aparte vaardigheid.',
    },
    {
      q: 'Hoeveel opdrachten krijg ik bij Schrijven A2?',
      a: 'Vier, in 40 minuten. Dat komt neer op ongeveer tien minuten per opdracht. Je schrijft bijvoorbeeld een korte brief of je vult een formulier in. Bij elke opdracht staat welke punten je moet noemen; die punten zijn waar je op beoordeeld wordt.',
    },
    {
      q: 'Hoe lang duurt de uitslag van Schrijven?',
      a: 'Normaal binnen 8 weken. DUO meldde op 31 juli 2026 dat Spreken A2 en Schrijven A2 op dat moment tot 16 weken duren, met automatisch zes maanden verlenging voor wie daardoor in de knel komt. Controleer de actuele stand bij DUO, en plan dit onderdeel in elk geval vroeg.',
    },
    {
      q: 'Wat als ik veel spelfouten maak?',
      a: 'Een paar fouten zijn niet meteen fataal. Er wordt gekeken of je de opdracht hebt uitgevoerd, of je boodschap begrijpelijk is en of de vorm bij de situatie past. Duidelijk en compleet schrijven met korte zinnen levert meer op dan mooie zinnen met gaten in de inhoud.',
    },
    {
      q: 'Mag ik een klad maken?',
      a: 'Je krijgt papier en je hebt 40 minuten voor vier opdrachten, dus een volledig klad kost te veel tijd. Maak wel een kort lijstje van de gevraagde punten voordat je begint, en streep die af terwijl je schrijft. Dat is de goedkoopste manier om punten binnen te halen.',
    },
  ],

  related: ['taalexamens-a2-b1', 'spreken-examen', 'lezen-examen'],
  relatedPosts: ['inburgeringsexamen-a2-uitleg', 'inburgeringsexamen-zakken-herkansen'],

  ctaTitle: 'Oefen het onderdeel Schrijven',
  ctaDesc: 'Schrijfopdrachten met feedback per criterium, opgesteld door een NT2-docent.',
  ctaHref: '/premium',
  ctaLabel: 'Bekijk de modules',
};

export default guide;
