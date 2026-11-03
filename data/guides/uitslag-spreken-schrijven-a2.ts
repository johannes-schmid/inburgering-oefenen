/**
 * Taalexamens spoke — "Wachten op je uitslag Spreken of Schrijven A2".
 *
 * Waarom deze pagina bestaat: sinds de zomer van 2026 is het wachten op de uitslag van Spreken A2
 * en Schrijven A2 de grootste bron van stress op Reddit (r/learndutch, r/InburgeringExam): er
 * lopen meerdere "result tracker"-draden met honderden reacties, mensen dienen klachten in en
 * zeggen naturalisatieafspraken af. Het belangrijkste feit — de automatische verlenging van zes
 * maanden — kent daar bijna niemand. Het stond bij ons alleen diep in `boete-en-termijn`.
 *
 * Vier dingen die hier bewust NIET staan, omdat er geen officiële bron voor is (onderzoek
 * 03-11-2026, zie `seo-agent/briefs/2026-11-03-drie-nieuwe-gidsen.md`):
 *  - **Dat je je voor hetzelfde A2-onderdeel opnieuw mag aanmelden terwijl je wacht, en dat "de
 *    hoogste uitslag telt".** Alleen Reddit zegt dat. De pagina zegt eerlijk dat DUO er niets
 *    over schrijft. (Bij het staatsexamen NT2 mag het uitdrukkelijk níet — dat staat er wél, als
 *    contrast voor B1-lezers.)
 *  - **Wachttijden uit de trackers.** Getallen van Reddit zijn geen bron (`SEO/README.md`).
 *  - **Een dwangsom.** DUO's "te laat"-pagina gaat over aanvragen; een uitslag is geen aanvraag.
 *  - **Bezwaar tegen een cijfer.** DUO biedt geen procedure aan en het examen is niet in te zien.
 *
 * Niet verwarren met de maatregel van 18-05-2026 (te weinig examenplaatsen): dat is maatwerk, alleen
 * met een brief. De verlenging hier is automatisch.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_CLOCK, I_MAIL, I_EURO, note, inlineCta, factTwo } from './kit';

const SRC_NIEUWS = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16';
const SRC_NIEUWS_MEI = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-240376-16';
const SRC_UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag.jsp';
const SRC_REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const SRC_BETALEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
const SRC_DIPLOMA = 'https://www.inburgeren.nl/examen-doen/diploma.jsp';
const SRC_DIPLOMA_NIEUWS = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-235392-16';
const SRC_IND = 'https://ind.nl/nl/nederlanderschap/inburgering-voor-naturalisatie';
const SRC_KLACHT = 'https://www.inburgeren.nl/niet-tevreden/klacht.jsp';
const SRC_NT2_AANMELDEN = 'https://duo.nl/particulier/staatsexamen-nt2/aanmelden.jsp';
const CHECKED = '03-11-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'uitslag-spreken-schrijven-a2',
  section: 'taalexamens',

  status: 'draft',
  pillar: false,
  coverGlyph: 'envelope',

  title: 'Uitslag Spreken of Schrijven A2: wachten tot 16 weken',
  description:
    'De uitslag van Spreken A2 en Schrijven A2 duurt nu tot 16 weken. Wat dat betekent voor je termijn, je naturalisatie en een herkansing, en wat je zelf kunt doen.',

  datePublished: '2026-11-03',
  dateModified: '2026-11-03',
  dateLabel: '3 november 2026',
  breadcrumb: 'Uitslag Spreken en Schrijven',
  eyebrow: 'Uitslag',

  heroTitle: 'Wachten op je uitslag Spreken of Schrijven A2',
  heroSubtitle:
    'Je hebt het examen gedaan, en nu wacht je. Al weken. Hier staat hoe lang het officieel mag duren, wat het betekent voor je termijn en je naturalisatie, en wat je intussen kunt doen.',
  readingMinutes: 7,

  articleHtml: `
<p>De <strong>uitslag van Spreken A2 en Schrijven A2</strong> duurt op dit moment
<strong>maximaal 16 weken</strong>. Normaal is dat 8 weken. DUO heeft zoveel examens na te kijken
dat het die 8 weken nu niet haalt. Wacht je langer dan 8 weken? Dan is er dus niets mis met jouw
examen. En is je inburgeringstermijn bijna voorbij? Dan krijg je automatisch 6 maanden extra.</p>

${fact('"DUO doet nu maximaal 16 weken over het nakijken van de examens. Uw uitslag krijgt u dus binnen deze 16 weken." Dit geldt voor de examens Spreken A2 en Schrijven A2. "Iemand die op dezelfde dag als u examen doet, kan de uitslag eerder of later krijgen."', 'inburgeren.nl — Nieuwsbericht 31-07-2026', SRC_NIEUWS, CHECKED)}

<h2 id="waarom">Waarom duurt het zo lang?</h2>

<p>Lezen, Luisteren en KNM kijkt een computer na. Schrijven en Spreken niet: daar luisteren en
lezen mensen mee. Schrijven wordt nagekeken door beoordelaars. Bij Spreken gebeurt het deels
automatisch en deels door beoordelaars. Er is dus geen examinator die op de dag zelf kan zeggen of
je geslaagd bent.</p>

${fact('Schrijfvaardigheid wordt beoordeeld door gecertificeerde beoordelaars. Spreekvaardigheid wordt gedeeltelijk geautomatiseerd en gedeeltelijk door gecertificeerde beoordelaars beoordeeld.', 'DUO — Examenreglement, artikel 10', SRC_REGLEMENT, CHECKED)}

<p>Twee dingen die je moet weten:</p>

<ul>
  <li><span><strong>Iemand die op dezelfde dag examen deed, kan eerder of later zijn uitslag krijgen.</strong> Dat zegt DUO zelf. Het zegt niets over jouw cijfer.</span></li>
  <li><span><strong>Op sommige pagina's van DUO staat nog "binnen 8 weken".</strong> Dat is de normale termijn. Het nieuwsbericht van 31 juli 2026 over de 16 weken is nieuwer en geldt nu.</span></li>
</ul>

${fact('Op de vaste pagina over de uitslag staat de normale termijn: "Dan krijgt u de uitslag binnen 8 weken per brief." Ook het Examenreglement noemt 8 weken.', 'inburgeren.nl — Uitslag', SRC_UITSLAG, CHECKED)}

<h2 id="termijn">Je termijn: je krijgt automatisch 6 maanden extra</h2>

<div class="verdict ok">
  <p class="verdict-answer">Wacht je op je uitslag en is je termijn bijna voorbij? Dan krijg je 6 maanden verlenging. Je hoeft er niets voor te doen.</p>
  <p>DUO geeft de verlenging vanzelf. Je krijgt een brief als je verlenging krijgt.</p>
</div>

${fact('"Bent u dicht bij het einde van uw inburgeringstermijn? En wacht u nog op de uitslag van uw examen Spreken of Schrijven A2? Dan geeft DUO u 6 maanden verlenging. U hoeft hiervoor niets te doen. De verlenging gaat vanzelf. DUO stuurt u een brief als u verlenging krijgt."', 'inburgeren.nl — Nieuwsbericht 31-07-2026', SRC_NIEUWS, CHECKED)}

${note('Haal dit niet door elkaar met een <strong>andere regeling</strong>. In mei 2026 meldde DUO dat er te weinig examenplaatsen waren. Daarvoor geeft DUO soms extra tijd, maar alleen per persoon en alleen met een brief: "Hebt u geen brief gekregen? Dan krijgt u geen extra tijd." De 6 maanden voor een late uitslag gaan wél vanzelf.')}

${fact('Bij te weinig examenplaatsen (bericht van 18 mei 2026) geeft DUO extra tijd als maatwerk, per brief: "Hebt u geen brief gekregen? Dan krijgt u geen extra tijd."', 'inburgeren.nl — Nieuwsbericht 18-05-2026', SRC_NIEUWS_MEI, CHECKED)}

<h2 id="herkansing">Moet je alvast een nieuw examen plannen?</h2>

<p>Dit is de vraag die je op fora het vaakst leest. Je denkt dat het examen niet goed ging, en je
wilt niet nog eens 16 weken verliezen als je zakt. Dus plan je alvast een tweede examen.</p>

<p><strong>Het eerlijke antwoord: DUO schrijft hier niets over.</strong> Niet op de pagina over
aanmelden, en niet in het Examenreglement. Je leest op internet dat het mag en dat "de hoogste
uitslag telt". Daar hebben wij geen officiële bron voor gevonden. Twijfel je? Vraag het DUO
schriftelijk, dan heb je het antwoord zwart op wit.</p>

${note('Doe je <strong>B1 (staatsexamen NT2)</strong>? Dan mag het uitdrukkelijk niet. DUO schrijft: "U kunt zich niet aanmelden voor een onderdeel waarvoor u al ingeschreven staat of nog een uitslag moet krijgen."')}

${fact('Voor het staatsexamen NT2 geldt: "U kunt zich niet aanmelden voor een onderdeel waarvoor u al ingeschreven staat of nog een uitslag moet krijgen."', 'DUO — Aanmelden staatsexamen NT2', SRC_NT2_AANMELDEN, CHECKED)}

<p>Overweeg je het toch bij A2? Reken dan met deze feiten:</p>

<div class="guide-cards">
  ${card(I_EURO, 'Het kost € 50', 'Een examen Spreken of Schrijven kost € 50. Kwam je niet naar je examen, dan betaal je opnieuw.')}
  ${card(I_CLOCK, 'Annuleren tot 7 dagen ervoor', 'Annuleer je uiterlijk 7 dagen voor de examendatum, dan krijg je je geld terug. Daarna niet meer.')}
  ${card(I_MAIL, 'Je uitslag komt per brief', 'Komt je eerste uitslag binnen en ben je geslaagd? Annuleer het tweede examen dan op tijd.')}
</div>

${factTwo('Een examen Spreken of Schrijven A2 kost € 50. "Als de kandidaat het examen uiterlijk tot 7 dagen voor de examendatum annuleert, dan heeft hij recht op restitutie (terugbetaling) van het examengeld." Een aanmelding verwijderen kan tot één dag voor het examen, maar dan krijg je het geld niet meer terug.', [['inburgeren.nl — Inburgeren betalen', SRC_BETALEN], ['DUO — Examenreglement', SRC_REGLEMENT]], CHECKED)}

<h2 id="naturalisatie">Je naturalisatie of je afspraak bij de gemeente</h2>

<p>Voor naturalisatie heb je je inburgeringsdiploma nodig, op minimaal niveau A2. Dat diploma
vraag je pas aan als al je uitslagen binnen zijn. De volgorde is altijd:</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Je krijgt de brief met je laatste uitslag</h3>
    <p>De uitslag staat ook in Mijn Inburgering. Wacht tot je de brief hebt.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Je vraagt je diploma aan in Mijn Inburgering</h3>
    <p>Je krijgt een digitaal diploma. Het papieren diploma komt binnen 8 weken per post.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Je gebruikt het digitale diploma voor je aanvraag</h3>
    <p>De IND en de gemeente accepteren het digitale diploma. Een print ervan is niet geldig.</p>
  </div></div>
</div>

${factTwo('"Een voorwaarde is dat u voldoet aan het inburgeringsvereiste. Dit betekent dat u de inburgeringsexamens van DUO moet hebben gehaald op minimaal taalniveau A2." DUO: "Wacht tot u die brief hebt gekregen. Daarna kunt u uw diploma aanvragen in Mijn Inburgering." De IND en gemeenten accepteren het digitale inburgeringsdiploma, bijvoorbeeld als u wilt naturaliseren.', [['IND — Inburgering voor naturalisatie', SRC_IND], ['inburgeren.nl — Nieuwsbericht 29-01-2026', SRC_DIPLOMA_NIEUWS]], CHECKED)}

${fact('"Dit digitale diploma heeft dezelfde waarde als een gewaarmerkte kopie." "Gebruik het digitale diploma alleen digitaal. Een print is niet geldig." "U krijgt het papieren diploma binnen 8 weken thuisgestuurd."', 'inburgeren.nl — Diploma', SRC_DIPLOMA, CHECKED)}

<p><strong>Heb je al een afspraak bij de gemeente voor je naturalisatie?</strong> Bel de gemeente
ruim van tevoren als je uitslag er nog niet is. Elke gemeente gaat daar anders mee om. Ga er niet
van uit dat het goed komt.</p>

<h2 id="klacht">Kun je iets doen tegen het wachten?</h2>

<p>Sneller maken kun je het niet. Wat je wel kunt doen:</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Dit kan</p>
    <ul>
      <li>${I_CHECK}<span><strong>Een klacht indienen bij DUO</strong> met het klachtenformulier. Je krijgt binnen 6 weken antwoord. Dat versnelt je uitslag niet, maar je klacht wordt wel vastgelegd.</span></li>
      <li>${I_CHECK}<span><strong>Je einddatum controleren</strong> in Mijn Inburgering. Staat die dichtbij, dan geldt de verlenging van 6 maanden.</span></li>
      <li>${I_CHECK}<span><strong>De andere onderdelen doen.</strong> Lezen, Luisteren en KNM kun je intussen gewoon plannen.</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Reken hier niet op</p>
    <ul>
      <li>${I_X}<span><strong>Een dwangsom.</strong> DUO noemt die regeling alleen bij aanvragen. Een examenuitslag is geen aanvraag.</span></li>
      <li>${I_X}<span><strong>Je examen inzien.</strong> Dat kan niet. Het staat zo in het Examenreglement.</span></li>
      <li>${I_X}<span><strong>Bezwaar tegen je cijfer.</strong> DUO biedt daar geen procedure voor aan.</span></li>
    </ul>
  </div>
</div>

${factTwo('Een klacht dien je in met het klachtenformulier: "U krijgt dan binnen 6 weken antwoord van DUO." Het Examenreglement, artikel 14 lid 3: "Het afgelegde en beoordeelde examen kan niet worden ingezien door de kandidaat."', [['inburgeren.nl — Klacht', SRC_KLACHT], ['DUO — Examenreglement', SRC_REGLEMENT]], CHECKED)}

<h2 id="intussen">Wat je intussen het beste doet</h2>

<p>Wachten voelt als stilstaan. Maar je kunt deze weken gebruiken:</p>

<ul>
  <li><span><strong>Plan de onderdelen die je nog niet hebt gedaan.</strong> Elke uitslag die binnen is, is er één minder om op te wachten.</span></li>
  <li><span><strong>Blijf oefenen met spreken of schrijven.</strong> Zak je, dan wil je niet opnieuw beginnen. Elke dag een korte oefening houdt je niveau vast.</span></li>
  <li><span><strong>Zet je einddatum in je agenda.</strong> En de datum waarop de 16 weken voorbij zijn. Dan weet je wanneer je DUO moet bellen.</span></li>
</ul>

${inlineCta('Blijf intussen oefenen', 'Doe een gratis oefenset van tien vragen per onderdeel, met uitleg bij elk antwoord. Zonder account.', '/oefenen', 'Begin met gratis oefenen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Spreken en Schrijven A2: nu maximaal 16 weken.</li>
  <li>Normaal is het 8 weken.</li>
  <li>Termijn bijna voorbij? Automatisch 6 maanden extra.</li>
  <li>Diploma pas na de brief met je laatste uitslag.</li>
  <li>Een print van je digitale diploma is niet geldig.</li>
</ul>`,

  faq: [
    {
      q: 'Hoe lang duurt de uitslag van Spreken A2?',
      a: 'Op dit moment maximaal 16 weken. DUO meldde op 31 juli 2026 dat het meer tijd nodig heeft om Spreken A2 en Schrijven A2 na te kijken. Normaal is de termijn 8 weken. Iemand die op dezelfde dag examen deed, kan zijn uitslag eerder of later krijgen dan jij.',
    },
    {
      q: 'Hoe lang duurt de uitslag van Schrijven A2?',
      a: 'Ook maximaal 16 weken op dit moment, net als bij Spreken A2. Schrijven wordt door mensen nagekeken, niet door een computer. Daarom duurt het langer dan bij Lezen, Luisteren en KNM.',
    },
    {
      q: 'Wat als mijn inburgeringstermijn verloopt terwijl ik wacht?',
      a: 'Dan krijg je 6 maanden verlenging. Dat geldt als je dicht bij het einde van je termijn bent en nog wacht op de uitslag van Spreken of Schrijven A2. Je hoeft er niets voor te doen. DUO stuurt je een brief als je de verlenging krijgt.',
    },
    {
      q: 'Mag ik me opnieuw aanmelden terwijl ik nog op mijn uitslag wacht?',
      a: 'Voor A2 schrijft DUO daar niets over, en wij hebben er geen officiële regel voor gevonden. Vraag het DUO schriftelijk als je twijfelt. Voor het staatsexamen NT2 (B1) mag het uitdrukkelijk niet. Plan je toch een tweede examen, onthoud dan dat je tot 7 dagen voor de examendatum kunt annuleren met je geld terug.',
    },
    {
      q: 'Kan ik naturaliseren zonder mijn diploma?',
      a: 'Nee. Voor naturalisatie moet je de inburgeringsexamens hebben gehaald op minimaal A2. Je vraagt het diploma aan in Mijn Inburgering, nadat je de brief met je laatste uitslag hebt gekregen. De IND en de gemeente accepteren het digitale diploma. Een print ervan is niet geldig.',
    },
    {
      q: 'Kan ik een klacht indienen over de wachttijd?',
      a: 'Ja, met het klachtenformulier van DUO. Je krijgt binnen 6 weken antwoord. Je uitslag komt daardoor niet sneller, maar je klacht wordt wel vastgelegd. Een dwangsom, zoals bij een te late aanvraag, noemt DUO niet voor een examenuitslag.',
    },
  ],

  related: ['spreken-examen', 'schrijven-examen', 'taalexamens-a2-b1'],
  relatedPosts: ['inburgeringsexamen-zakken-herkansen'],

  ctaTitle: 'Gebruik de wachttijd',
  ctaDesc: 'Oefen Lezen, Luisteren en KNM terwijl je wacht, of houd je spreken en schrijven op niveau.',
  ctaHref: '/oefenen',
  ctaLabel: 'Begin met gratis oefenen',
};

export default guide;
