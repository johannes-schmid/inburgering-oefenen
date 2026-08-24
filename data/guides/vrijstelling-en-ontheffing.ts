/**
 * Inburgering spoke — "Vrijstelling of ontheffing".
 *
 * The three corrections `SEO/facts.md` §11 records against the supplied manuscripts all live in
 * this subject, and this page is where they are most likely to creep back in:
 *
 *  1. **"praktijkonderwijs" is on no official vrijstellingslijst** and neither is mbo-1/entree
 *     for a *full* vrijstelling. Do not add either, however many competitor pages list them.
 *  2. **Eight years or more of Dutch schooling during the leerplicht is the vrijstelling**, not
 *     fewer. The manuscript had it inverted, which is the direction that costs a reader a fine.
 *  3. **De pensioengerechtigde leeftijd hoort in de lijst.** It was missing.
 *
 * And the distinction the whole page hangs on: **vrijstelling is niet hetzelfde als ontheffing**.
 * A vrijstelling means you already meet the requirement; an ontheffing means you cannot meet it.
 * They have different grounds, a different procedure and — for BIO — a different consequence for
 * naturalisatie.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_CAP, I_CLOCK, I_USER, I_EURO, I_ALERT, I_CLIPBOARD,
  docent, note, inlineCta, factTwo,
} from './kit';

export const SRC_MINDER = 'https://www.inburgeren.nl/minder-of-geen-examens/index.jsp';
export const SRC_DIPLOMA = 'https://www.inburgeren.nl/minder-of-geen-examens/diploma-gehaald.jsp';
export const SRC_ZIEKTE = 'https://www.inburgeren.nl/minder-of-geen-examens/ziekte-of-handicap.jsp';
export const SRC_GEWERKT = 'https://www.inburgeren.nl/minder-of-geen-examens/in-nederland-gewerkt.jsp';
export const SRC_RIJKS = 'https://www.rijksoverheid.nl/onderwerpen/immigratie-naar-nederland/vraag-en-antwoord/moet-ik-als-nieuwkomer-inburgeren';
export const SRC_WET4 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&artikel=4';
export const SRC_WET5 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&artikel=5';
export const SRC_IND = 'https://ind.nl/nl/met-een-verblijfsvergunning-wonen-in-nederland/inburgering-bij-sterkere-verblijfsvergunning-en-naturalisatie';
export const CHECKED = '23-08-2026';

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'vrijstelling-en-ontheffing',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'stamp',

  title: 'Vrijstelling of ontheffing van de inburgering aanvragen',
  description:
    'Wanneer hoef je niet in te burgeren? Het verschil tussen vrijstelling en ontheffing, welke diplomas vrijstelling geven en hoe je het aanvraagt bij DUO.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Vrijstelling',
  eyebrow: 'Vrijstelling',

  heroTitle: 'Vrijstelling of ontheffing',
  heroSubtitle:
    'Soms hoef je niet in te burgeren, of niet alle examens te doen. Maar dat gebeurt niet vanzelf: je moet het aanvragen, en de regels zijn strikter dan veel sites suggereren.',
  readingMinutes: 7,

  articleHtml: `
<h2 id="verschil">Vrijstelling of ontheffing: niet hetzelfde</h2>

<p>Twee woorden die vaak door elkaar worden gebruikt, maar die iets heel anders betekenen.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Vrijstelling</h3>
      <p class="compare-when">Je vold&oacute;et al</p>
    </div>
    <div class="compare-rows">
      ${row('Waarom', 'Je hebt al een diploma, of je bent al voldoende ingeburgerd')}
      ${row('Bewijs', 'Een papier: een diploma, een certificaat, een werkverleden')}
      ${row('Gevolg', 'Je hoeft (bepaalde) examens niet te doen')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Ontheffing</h3>
      <p class="compare-when">Je k&uacute;nt niet voldoen</p>
    </div>
    <div class="compare-rows">
      ${row('Waarom', 'Een blijvende ziekte of beperking, of bijzondere omstandigheden')}
      ${row('Bewijs', 'Een medisch onderzoek of een dossier van je situatie')}
      ${row('Gevolg', 'De inburgeringsplicht vervalt, maar met gevolgen — zie verderop')}
    </div>
  </div>
</div>

${factTwo('De Wet inburgering 2021 kent vrijstelling (artikel 4), onder meer voor wie al een diploma heeft of anderszins voldoende is ingeburgerd, en ontheffing (artikel 5) voor wie door een psychische of lichamelijke belemmering of een verstandelijke beperking blijvend niet in staat is in te burgeren, of door bijzondere individuele omstandigheden.', [['Wet inburgering 2021, artikel 4', SRC_WET4], ['Wet inburgering 2021, artikel 5', SRC_WET5]], CHECKED)}

${note('<strong>DUO beslist, niet jij en niet je taalschool.</strong> Ook als je zeker weet dat je onder een regel valt: je moet het aanvragen en je moet wachten op de brief. Stop pas met leren als die brief er is.')}

<h2 id="geen-plicht">Wie is sowieso niet inburgeringsplichtig?</h2>

<p>Voor sommige groepen begint de plicht helemaal niet. Dat is geen vrijstelling die je aanvraagt;
je valt gewoon buiten de wet.</p>

<div class="yesno-grid">
  <div class="yesno-col no">
    <p class="yesno-title">Je hoeft niet in te burgeren</p>
    <ul>
      <li>${I_X}<span>Je bent jonger dan 18 jaar</span></li>
      <li>${I_X}<span>Je bent ouder dan de pensioengerechtigde leeftijd (AOW-leeftijd)</span></li>
      <li>${I_X}<span>Je hebt de nationaliteit van een EU- of EER-land, of van Zwitserland</span></li>
      <li>${I_X}<span>Je bent hier tijdelijk, voor studie of werk</span></li>
      <li>${I_X}<span>Je woonde 8 jaar of langer in Nederland toen je leerplichtig was</span></li>
      <li>${I_X}<span>Je hebt bepaalde Nederlandse diploma's — zie hieronder</span></li>
    </ul>
  </div>
  <div class="yesno-col yes">
    <p class="yesno-title">Let op</p>
    <ul>
      <li>${I_CHECK}<span>Bereik je de AOW-leeftijd tijdens je traject? Dan stopt de plicht daar, maar je kunt dan ook niet meer lenen bij DUO.</span></li>
      <li>${I_CHECK}<span>Wil je later naturaliseren? Dan kan de gemeente of de IND alsnog een inburgeringsdiploma vragen. Vrijwillig inburgeren mag.</span></li>
      <li>${I_CHECK}<span>Turkse nationaliteit is sinds 1 januari 2022 niet meer uitgezonderd.</span></li>
    </ul>
  </div>
</div>

${factTwo('Niet inburgeringsplichtig zijn onder meer: personen jonger dan 18 jaar, personen ouder dan de pensioengerechtigde leeftijd, burgers van de EU, de EER (Noorwegen, IJsland, Liechtenstein) en Zwitserland, wie tijdelijk in Nederland is voor studie of werk, en wie 8 jaar of langer in Nederland woonde tijdens de leerplichtige leeftijd. Wie recht heeft op AOW hoeft niet meer in te burgeren en kan ook niet meer lenen.', [['Rijksoverheid — Moet ik als nieuwkomer inburgeren?', SRC_RIJKS], ['inburgeren.nl — Minder of geen examens doen', SRC_MINDER]], CHECKED)}

${docent('Die achtjarenregel wordt vaak omgekeerd begrepen, en dat is gevaarlijk. Het is: <strong>acht jaar of m&eacute;&eacute;r</strong> Nederlands onderwijs tijdens je leerplicht geeft vrijstelling. M&iacute;nder dan acht jaar geeft die vrijstelling juist niet. Wie het verkeerd om onthoudt, stopt met leren en krijgt later een probleem.')}

<h2 id="diploma">Welke diploma's geven vrijstelling?</h2>

<p>Dit is de meest voorkomende vrijstelling, en tegelijk het punt waarop de meeste onjuiste
informatie op internet staat. Dit is de offici&euml;le lijst van DUO.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Geeft vrijstelling</p>
    <ul>
      <li>${I_CHECK}<span>Een Nederlands vmbo-, havo- of vwo-diploma</span></li>
      <li>${I_CHECK}<span>Een mbo-diploma op <strong>niveau 2 of hoger</strong></span></li>
      <li>${I_CHECK}<span>Een hbo- of universitair diploma, <strong>mits in het Nederlands</strong></span></li>
      <li>${I_CHECK}<span>Een Nederlandstalig diploma uit Belgi&euml; of Suriname</span></li>
      <li>${I_CHECK}<span>Een staatsexamen NT2 op niveau B1 of B2</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Geeft g&eacute;&eacute;n volledige vrijstelling</p>
    <ul>
      <li>${I_X}<span><strong>Praktijkonderwijs</strong> — dit staat op geen enkele offici&euml;le lijst, hoe vaak je het online ook leest</span></li>
      <li>${I_X}<span><strong>mbo niveau 1 (entreeopleiding)</strong> — dit ontslaat je wel van het ONA-examen, maar geeft geen volledige vrijstelling</span></li>
      <li>${I_X}<span>Een buitenlands diploma dat niet in het Nederlands is behaald</span></li>
      <li>${I_X}<span>Een cursuscertificaat van een taalschool zonder erkend NT2-examen</span></li>
    </ul>
  </div>
</div>

${fact('DUO noemt als diploma’s die vrijstelling kunnen geven: vmbo, havo, vwo, mbo niveau 2 of hoger, en hbo of wo mits in het Nederlands behaald, plus Nederlandstalige diploma’s uit België en Suriname.', 'inburgeren.nl — Diploma gehaald', SRC_DIPLOMA, CHECKED)}

<h3>Gedeeltelijke vrijstelling</h3>

<p>Soms hoef je niet alle examens te doen. Twee veelvoorkomende situaties:</p>

<ul>
  <li><strong>Een NT2-certificaat of -diploma</strong> kan recht geven op vrijstelling voor bepaalde taalonderdelen. Welke, hangt af van welke onderdelen je hebt gehaald.</li>
  <li><strong>Gewerkt in Nederland.</strong> Onder de Wet 2013 kan werk in Nederland recht geven op vrijstelling van het ONA-examen. En wie tien jaar in Nederland woont en daarvan minstens vijf jaar heeft gewerkt, kan volledig vrijgesteld worden.</li>
</ul>

${fact('Wie tien jaar in Nederland woont en daarvan ten minste vijf jaar heeft gewerkt, hoeft mogelijk helemaal geen examens te doen. Ook werk in Nederland in het afgelopen jaar kan tot een gedeeltelijke vrijstelling leiden.', 'inburgeren.nl — In Nederland gewerkt', SRC_GEWERKT, CHECKED)}

<h2 id="ontheffing">Ontheffing bij ziekte of beperking</h2>

<p>Kun je door een psychische of lichamelijke belemmering of een verstandelijke beperking
<strong>blijvend</strong> niet inburgeren, dan kun je ontheffing aanvragen bij DUO. Het woord
<em>blijvend</em> is belangrijk: een tijdelijke situatie geeft geen ontheffing, maar mogelijk wel
extra tijd.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Je vraagt het aan bij DUO</h3>
    <p>Via Mijn Inburgering of met een formulier. Je betaalt vooraf een bedrag van €225 voor het onderzoek.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Een onafhankelijke arts onderzoekt je</h3>
    <p>Die kijkt of je blijvend niet in staat bent de examens te halen. Neem al je medische informatie mee.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>DUO beslist</h3>
    <p>Krijg je de ontheffing, dan krijg je de €225 terug. Wordt hij afgewezen, dan ben je dat bedrag kwijt — en loopt je termijn gewoon door.</p>
  </div></div>
</div>

${fact('Wie door een psychische of lichamelijke belemmering of een verstandelijke beperking blijvend niet in staat is het inburgeringsexamen te halen, kan bij DUO ontheffing aanvragen. Het medisch onderzoek kost vooraf €225; bij toekenning krijgt u dat bedrag terug.', 'inburgeren.nl — Ziekte of handicap', SRC_ZIEKTE, CHECKED)}

${note('Denk je dat je situatie <strong>tijdelijk</strong> is — een operatie, een zwangerschap, een sterfgeval, dakloosheid? Vraag dan geen ontheffing aan maar <strong>extra tijd</strong>. Dat is een andere procedure, hij kost niets, en hij past beter bij wat je nodig hebt.')}

<h2 id="bio">Ontheffing bijzondere individuele omstandigheden (BIO)</h2>

<p>Er bestaat ook een ontheffing voor mensen die het echt geprobeerd hebben en het aantoonbaar niet
kunnen halen, zonder dat er een medische reden is. Dat heet <strong>ontheffing BIO</strong>. Je moet
dan laten zien dat je je maximaal hebt ingespannen: cursusuren, examenpogingen, aanwezigheid.</p>

<p>Er zit &eacute;&eacute;n belangrijk nadeel aan, en dat wordt zelden verteld: <strong>met een
ontheffing BIO kun je niet naturaliseren.</strong> Voor het Nederlanderschap heb je het
inburgeringsdiploma nodig. Wie Nederlander wil worden, kan dus beter doorgaan met examens doen —
desnoods vrijwillig, na afloop van de plicht.</p>

${fact('Voor naturalisatie en voor een verblijfsvergunning voor onbepaalde tijd is inburgering een vereiste; de IND beschrijft welke bewijzen daarvoor gelden. Een ontheffing van de inburgeringsplicht is niet zonder meer voldoende om te naturaliseren.', 'IND — Inburgering bij een sterkere verblijfsvergunning en naturalisatie', SRC_IND, CHECKED)}

${docent('Dit is het gesprek dat ik het lastigst vind. Iemand is opgelucht dat de plicht van tafel is, en hoort pas jaren later dat het paspoort daarmee ook van tafel is. Als naturalisatie je doel is, bespreek dat dan v&oacute;&oacute;rdat je een BIO-ontheffing aanvraagt.')}

<h2 id="hoe-aanvragen">Hoe vraag je het aan?</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Kijk eerst in Mijn Inburgering</h3>
    <p>Daar staat welke examens voor jou gelden. Soms is een vrijstelling al automatisch verwerkt.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Verzamel je bewijs</h3>
    <p>Diploma's, cijferlijsten, een werkgeversverklaring, of medische stukken. Kopie&euml;n van gewaarmerkte documenten.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Dien de aanvraag in bij DUO</h3>
    <p>Via Mijn Inburgering of per post met het juiste formulier.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Ga door met leren tot de brief er is</h3>
    <p>Je termijn loopt tijdens de behandeling gewoon door. Stoppen op basis van een verwachting is het duurste wat je kunt doen.</p>
  </div></div>
</div>

${inlineCta('Nog geen vrijstelling? Begin dan alvast', 'Een gratis proefexamen van tien vragen laat meteen zien waar je staat. Zonder account.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Vrijstelling = je voldoet al. Ontheffing = je kunt niet voldoen.</li>
  <li>DUO beslist; ga door met leren tot de brief er is.</li>
  <li>Vmbo, havo, vwo, mbo-2 of hoger, of Nederlandstalig hbo/wo geven vrijstelling.</li>
  <li>Praktijkonderwijs en mbo-1 geven g&eacute;&eacute;n volledige vrijstelling.</li>
  <li>Medische ontheffing kost vooraf &euro;225, terug bij toekenning.</li>
  <li>Met een ontheffing BIO kun je niet naturaliseren.</li>
</ul>`,

  faq: [
    {
      q: 'Wat is het verschil tussen vrijstelling en ontheffing?',
      a: 'Bij een vrijstelling voldoe je al aan de eis, bijvoorbeeld omdat je een Nederlands diploma hebt of lang hier hebt gewerkt. Bij een ontheffing kún je niet voldoen, bijvoorbeeld door een blijvende ziekte of beperking. Ze hebben een andere grond, een andere procedure en andere gevolgen.',
    },
    {
      q: 'Welke diploma’s geven vrijstelling van inburgering?',
      a: 'Een Nederlands vmbo-, havo- of vwo-diploma, een mbo-diploma op niveau 2 of hoger, en een hbo- of universitair diploma dat in het Nederlands is behaald. Ook Nederlandstalige diploma’s uit België en Suriname tellen mee. Praktijkonderwijs en mbo niveau 1 geven geen volledige vrijstelling, ook al lees je dat online vaak.',
    },
    {
      q: 'Hoef ik niet in te burgeren als ik de AOW-leeftijd bereik?',
      a: 'Klopt. Wie recht heeft op AOW hoeft niet meer in te burgeren; je moet inburgeren tot je AOW-leeftijd en daarna niet meer. Let op: je kunt dan ook niet meer lenen bij DUO. Wil je later naturaliseren, dan kan de gemeente of de IND alsnog een inburgeringsdiploma vragen — vrijwillig inburgeren mag.',
    },
    {
      q: 'Wat kost het aanvragen van een medische ontheffing?',
      a: 'Je betaalt vooraf €225 voor het onafhankelijke medische onderzoek. Krijg je de ontheffing toegekend, dan krijg je dat bedrag terug. Wordt de aanvraag afgewezen, dan ben je het kwijt en loopt je inburgeringstermijn intussen gewoon door.',
    },
    {
      q: 'Kan ik naturaliseren met een ontheffing?',
      a: 'Met een ontheffing wegens bijzondere individuele omstandigheden (BIO) niet: voor naturalisatie is een inburgeringsdiploma vereist. Is Nederlander worden je doel, bespreek dat dan voordat je zo’n ontheffing aanvraagt — vrijwillig doorgaan met de examens is dan vaak de betere weg.',
    },
    {
      q: 'Mag ik stoppen met mijn cursus als ik vrijstelling heb aangevraagd?',
      a: 'Nee, niet voordat DUO heeft beslist. Je inburgeringstermijn loopt tijdens de behandeling gewoon door. Wordt je aanvraag afgewezen, dan heb je maanden verloren die je niet meer inhaalt. Ga door met leren tot de brief van DUO er is.',
    },
  ],

  related: ['moet-ik-inburgeren', 'welke-wet-en-welke-route', 'boete-en-termijn'],
  relatedPosts: ['taalniveaus-a1-a2-b1-nederlands'],

  ctaTitle: 'Begin alvast met oefenen',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
