/**
 * Taalexamens spoke — Lezen.
 *
 * **This page and the blog post `lezen-examen-inburgering-a2` cover related ground on purpose,
 * and they are scoped so they do not compete.** The post is the A2 explainer and owns the
 * "lezen examen inburgering A2" query; this guide is the per-onderdeel reference across *both*
 * levels and is where the cluster's internal links point. Both link the other. If a future edit
 * makes either one the general "alles over lezen" page, one of them has to go — one query, one
 * owning page (`docs/MILESTONES.html`, M1's call on `taalniveaus-a1-a2-b1-nederlands`).
 *
 * Item counts are attributed to DUO's oefenexamens, never to "het examen" — `SEO/facts.md` §1.
 * For B1 only the duration is DUO-sourced; the content description lives at staatsexamensnt2.nl
 * and this page links there rather than inventing a shape for it.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_BOOK, I_CLOCK, I_ALERT, docent, note, inlineCta, factTwo } from './kit';

export const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
export const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
export const SRC_NT2 = 'https://www.staatsexamensnt2.nl/';
export const SRC_REGELS = 'https://www.inburgeren.nl/examen-doen/regels-examen.jsp';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'lezen-examen',
  section: 'taalexamens',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'doc',

  title: 'Het examen Lezen (A2 en B1): opzet, tijd en aanpak',
  description:
    'Hoe ziet het examen Lezen eruit op A2 en B1, hoeveel tijd heb je per tekst, en met welke leesstrategie haal je het? Uitleg en oefentips van een NT2-docent.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Lezen',
  eyebrow: 'Taalexamen',

  heroTitle: 'Het examen Lezen',
  heroSubtitle:
    'Teksten lezen en vragen beantwoorden, op de computer. Het lijkt het makkelijkste onderdeel, en het is het onderdeel waar de meeste mensen door de tijd heen schieten.',
  readingMinutes: 7,

  articleHtml: `
<h2 id="hoe-ziet-het-eruit">Hoe ziet het examen eruit?</h2>

<p>Je zit achter een computer. Links staat een tekst, rechts staat een vraag met antwoorden. Je
kiest er &eacute;&eacute;n. Bij dezelfde tekst horen soms meerdere vragen.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th></th><th>A2</th><th>B1</th></tr></thead>
  <tbody>
    <tr><td><strong>Duur</strong></td><td>65 minuten</td><td>110 minuten</td></tr>
    <tr><td><strong>Waar</strong></td><td>Op de computer, op een DUO-examenlocatie</td><td>Staatsexamen NT2, eigen locaties</td></tr>
    <tr><td><strong>In DUO's oefenexamens</strong></td><td>25 vragen</td><td>zie staatsexamensnt2.nl</td></tr>
    <tr><td><strong>Soort teksten</strong></td><td>Kort en praktisch: advertentie, brief, mededeling, instructie</td><td>Langer en samenhangend: nieuwsbericht, folder, artikel</td></tr>
  </tbody>
</table>
</div>

${factTwo('DUO: "Het examen Lezen op niveau A2 doet u op de computer. U moet teksten lezen. U moet ook vragen beantwoorden. Het examen duurt 65 minuten." Het examen Lezen op niveau B1 (staatsexamen Nt2) duurt 110 minuten; informatie over de inhoud daarvan staat op staatsexamensnt2.nl.', [['inburgeren.nl — Taalexamens', SRC_TAALEXAMENS], ['Staatsexamens NT2', SRC_NT2]], CHECKED)}

<p>In de A2-oefenexamens van DUO staan 25 vragen. Dat is geen door DUO gepubliceerde norm voor het
echte examen, maar het is wel het beste getal om je voorbereiding op te baseren: het staat op het
startscherm van de oefenexamens die iedereen kan doen.</p>

${fact('DUO stelt oefenexamens beschikbaar die iedereen zonder inloggen kan maken. Op het startscherm van de A2-oefenexamens Lezen staat: "U moet in dit examen 25 vragen beantwoorden", met een teller van 25 vragen en 65 minuten.', 'inburgeren.nl — Oefenen', SRC_OEFENEN, CHECKED)}

<h2 id="soorten-teksten">Wat voor teksten krijg je?</h2>

<p>Op A2 zijn het teksten uit je eigen dagelijkse leven. Herken je ze, dan lees je ze sneller.</p>

<div class="guide-cards">
  ${card(I_BOOK, 'Mededelingen', 'Een briefje van de woningcorporatie, een bord bij de ingang, een mail van school over een uitje.')}
  ${card(I_BOOK, 'Advertenties', 'Een aanbieding in de folder, een woning te huur, een tweedehands fiets.')}
  ${card(I_BOOK, 'Brieven en mails', 'Van een instantie, een school of een vereniging. Vaak met een datum en een actie erin.')}
  ${card(I_BOOK, 'Instructies en regels', 'Hoe je een apparaat gebruikt, wat je moet doen bij een storing, huisregels.')}
  ${card(I_BOOK, 'Korte informatieve teksten', 'Een stukje uit een buurtkrant of een folder van de gemeente.')}
</div>

<p>Op B1 worden de teksten langer en abstracter. Je moet dan niet alleen vinden wat er staat, maar
ook begrijpen wat de schrijver bedoelt en welke mening hij heeft.</p>

<h2 id="soorten-vragen">Wat voor vragen krijg je?</h2>

<p>Grofweg drie soorten, en ze vragen om verschillend leesgedrag.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Zoekvragen</h3>
    <p>"Hoe laat begint de bijeenkomst?" Het antwoord st&aacute;&aacute;t in de tekst. Je hoeft de tekst niet helemaal te lezen — je zoekt.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Begripsvragen</h3>
    <p>"Waarom stuurt de school deze brief?" Het antwoord staat er niet letterlijk; je moet de hoofdgedachte pakken.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Woordvragen</h3>
    <p>"Wat betekent het woord ‘uiterlijk’ in deze zin?" Kijk naar de zinnen eromheen; de context geeft het antwoord vaak weg.</p>
  </div></div>
</div>

<h2 id="tijd">De tijd is het echte examen</h2>

<p>Reken het even uit voor A2: 65 minuten voor de vragen van een compleet oefenexamen komt neer op
ongeveer <strong>twee&euml;nhalve minuut per vraag</strong> — inclusief het lezen van de tekst.
Dat is genoeg, maar alleen als je niet blijft hangen.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Doen</p>
    <ul>
      <li>${I_CHECK}<span>Lees <strong>eerst de vraag</strong>, daarna pas de tekst. Dan weet je waar je naar zoekt.</span></li>
      <li>${I_CHECK}<span>Sla een vraag over als je vastloopt, en kom terug. Je kunt terug in het examen.</span></li>
      <li>${I_CHECK}<span>Kijk naar de kop, de datum, de afzender en het vetgedrukte. Daar zit de helft van de antwoorden.</span></li>
      <li>${I_CHECK}<span>Vul altijd iets in. Een leeg antwoord is zeker fout.</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Niet doen</p>
    <ul>
      <li>${I_X}<span>Elke tekst woord voor woord lezen</span></li>
      <li>${I_X}<span>Bij een onbekend woord stoppen — lees de zin af, meestal snap je hem dan toch</span></li>
      <li>${I_X}<span>Twijfelen tussen twee antwoorden en er drie minuten aan besteden</span></li>
      <li>${I_X}<span>Je eerste ingeving zonder reden veranderen</span></li>
    </ul>
  </div>
</div>

${docent('"Eerst de vraag, dan de tekst" is de tip die bij mij het meeste verschil maakt. Cursisten lezen een tekst van boven naar beneden, vergeten wat ze gelezen hebben, en lezen hem dan nog een keer. Twee keer lezen kost je het examen. E&eacute;n keer gericht zoeken niet.')}

<h2 id="valkuilen">Drie valkuilen</h2>

<ul>
  <li><strong>Het antwoord dat er bijna staat.</strong> Vaak lijkt &eacute;&eacute;n foute optie sterk op de tekst, maar klopt er &eacute;&eacute;n woord niet — "altijd" tegenover "meestal", "moet" tegenover "mag". Lees de opties net zo precies als de tekst.</li>
  <li><strong>Je eigen kennis.</strong> Het antwoord moet uit <em>deze</em> tekst komen, ook als je zelf iets anders weet.</li>
  <li><strong>Ontkenningen.</strong> "Wat is <em>niet</em> waar?" Onderstreep dat woord in je hoofd; hier gaan veel punten verloren bij mensen die de tekst prima begrepen.</li>
</ul>

${note('Op je examendag: neem een geldig identiteitsbewijs mee en wees op tijd. Kom je te laat, dan kun je worden geweigerd, en dan ben je je examengeld kwijt. De regels staan op de site van DUO.')}

${fact('Voor het inburgeringsexamen gelden vaste regels over onder meer identificatie en te laat komen; DUO publiceert die in de regels voor het examen en in het Examenreglement.', 'inburgeren.nl — Regels voor het examen', SRC_REGELS, CHECKED)}

<h2 id="oefenen">Hoe je oefent</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Lees elke dag iets echts</h3>
    <p>Een folder, de post, een bericht van school, een nieuwsapp in eenvoudig Nederlands. Vijftien minuten per dag doet meer dan drie uur in het weekend.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Oefen met de klok</h3>
    <p>Zet een timer. Niet omdat je snel moet lezen, maar omdat je moet leren voelen wanneer je te lang bij &eacute;&eacute;n vraag blijft.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Lees de uitleg, ook bij goede antwoorden</h3>
    <p>Wat je moet leren is niet het antwoord maar de re&eacute;den. Anders kies je bij de volgende, net iets andere vraag weer mis.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Doe een compleet oefenexamen</h3>
    <p>Minstens drie keer, in &eacute;&eacute;n keer, zonder pauze. Dat traint iets anders dan losse vragen: volhouden.</p>
  </div></div>
</div>

${inlineCta('Oefen Lezen met echte examenvragen', 'Tien vragen, met uitleg na elk antwoord. Zonder account en zonder betalen.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>A2: 65 minuten op de computer; B1: 110 minuten (staatsexamen NT2).</li>
  <li>DUO's A2-oefenexamens hebben 25 vragen.</li>
  <li>Lees eerst de vraag, dan de tekst.</li>
  <li>Sla een vraag over en kom terug; vul altijd iets in.</li>
  <li>Let op ontkenningen en op opties die er "bijna" staan.</li>
</ul>`,

  faq: [
    {
      q: 'Hoe lang duurt het examen Lezen?',
      a: 'Op niveau A2 duurt het 65 minuten en doe je het op de computer. Op niveau B1 is het onderdeel van het staatsexamen NT2 en duurt het 110 minuten. Informatie over de inhoud van het B1-examen staat op staatsexamensnt2.nl.',
    },
    {
      q: 'Hoeveel vragen heeft het examen Lezen A2?',
      a: 'DUO publiceert dat niet als officiële norm. In de openbare oefenexamens Lezen A2 van DUO staan 25 vragen in 65 minuten, en dat is het beste getal om je voorbereiding op te baseren.',
    },
    {
      q: 'Mag ik terug naar een vorige vraag?',
      a: 'Ja. Je kunt binnen het examen vooruit en terug, en je kunt een antwoord nog veranderen zolang de tijd loopt. Gebruik dat: sla een vraag waar je op vastloopt over en kom er aan het eind op terug met de tijd die je overhoudt.',
    },
    {
      q: 'Wat doe ik met woorden die ik niet ken?',
      a: 'Niet stoppen. Lees de zin en de zin erna af; heel vaak wordt de betekenis dan duidelijk uit de context. Het examen test of je de tekst begrijpt, niet of je elk woord kent. Blijf je hangen, sla de vraag dan over en kom later terug.',
    },
    {
      q: 'Mag ik een woordenboek meenemen naar het examen?',
      a: 'Nee. Bij het inburgeringsexamen mag je geen eigen hulpmiddelen gebruiken. Neem wel een geldig identiteitsbewijs mee en zorg dat je op tijd bent; te laat komen kan betekenen dat je niet mee mag doen en je examengeld kwijt bent.',
    },
  ],

  related: ['taalexamens-a2-b1', 'luisteren-examen', 'schrijven-examen'],
  relatedPosts: ['lezen-examen-inburgering-a2', 'inburgeringsexamen-a2-uitleg'],

  ctaTitle: 'Oefen het onderdeel Lezen',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
