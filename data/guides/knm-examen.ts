/**
 * The KNM cluster's pillar: "Het KNM-examen".
 *
 * KNM is the fifth onderdeel of the inburgeringsexamen and the section this guide's cluster
 * covers. The eight thema-gidsen are its spokes; this page is the one that explains the exam
 * itself, and it is the only KNM page that may carry `pillar: true`.
 *
 * What this page must keep right:
 *
 *  - **The eight thema's come from the herziene eindtermen** (Regeling inburgering 2021,
 *    Stcrt. 2024, 15802), not from a course book. Competitors state seven; `SEO/facts.md` §10
 *    records that as a hard correction.
 *  - **No item count.** DUO's own KNM page states the duration (45 minutes) and nothing else.
 *    The "40 vragen" figure circulating everywhere is not on any DUO page, so it does not ship —
 *    the same rule that keeps the 18-van-25 pass norm off the site (`SEO/facts.md` §9).
 *  - **No pass norm and no punten.** Article 10 lid 5 of the Examenreglement makes the cesuur a
 *    ministerial decision that DUO does not publish. Saying so is the wedge.
 *  - **KNM is in every leerroute, but not always as an exam.** In the Z-route it is cursusuren.
 *    Writing "je doet altijd KNM-examen" would be wrong for the group least able to check it.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_LANDMARK, I_HOME, I_USERS, I_EURO, I_CLOCK, I_BOOK, I_CLIPBOARD, I_ROUTE,
  I_USER, I_CAP, docent, note, inlineCta, factTwo,
} from './kit';

const SRC_KENNIS = 'https://www.inburgeren.nl/examen-doen/inhoud-kennisexamens.jsp';
const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
const SRC_KOSTEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
const SRC_UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag-examen.jsp';
const SRC_PLAATSEN = 'https://www.inburgeren.nl/examen-doen/examenplaatsen.jsp';
const SRC_ROUTES = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
const SRC_REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const CHECKED = '23-08-2026';

const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'knm-examen',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: true,
  coverGlyph: 'colonnade',

  title: 'Het KNM-examen: alles over Kennis Nederlandse Maatschappij',
  description:
    'Wat is het KNM-examen, welke acht themas komen erin voor en hoe bereid je je voor? Uitleg over de inhoud, de duur, de kosten en de uitslag van KNM.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Het KNM-examen',
  eyebrow: 'KNM',

  heroTitle: 'Het KNM-examen',
  heroSubtitle:
    'KNM staat voor Kennis van de Nederlandse Maatschappij. Het is geen taalexamen: het gaat over hoe Nederland werkt. Hier lees je wat erin zit en hoe je je voorbereidt.',
  readingMinutes: 7,

  articleHtml: `
<h2 id="wat-is-knm">Wat is het KNM-examen?</h2>

<p>KNM is een van de examens van je inburgering. Het gaat niet over grammatica of spelling. Het
gaat over <strong>hoe Nederland werkt</strong>: naar welke dokter je gaat, wat je doet als je
huur te hoog is, wie de wetten maakt, hoe school werkt voor je kinderen.</p>

<p>Je doet het examen op de computer. Je krijgt vragen bij korte filmpjes, foto's en teksten. Bij
elke vraag kies je een antwoord. Het examen duurt <strong>45 minuten</strong>.</p>

${fact('DUO over KNM: "Het examen KNM doet u op de computer. U krijgt verschillende thema’s. Bijvoorbeeld ‘wonen’ of ‘werk en inkomen’. Bij elk thema moet u vragen beantwoorden. Het examen duurt 45 minuten."', 'inburgeren.nl — Kennisexamens', SRC_KENNIS, CHECKED)}

${note('Je ziet online veel sites die schrijven dat het KNM-examen uit een vast aantal vragen bestaat. DUO zet dat aantal nergens op zijn eigen site. Wij noemen het daarom niet. Wat DUO w&eacute;l zegt, staat hierboven: 45 minuten, vragen bij verschillende thema’s.')}

<h2 id="acht-themas">De acht thema's van KNM</h2>

<p>De onderwerpen van KNM liggen vast in de wet. Sinds de herziene eindtermen zijn het er
<strong>acht</strong>. Elk thema heeft zijn eigen kennisgids op deze site.</p>

<div class="guide-cards">
  ${card(I_EURO, 'Werk en inkomen', 'Werk zoeken, een arbeidscontract, je loonstrook, discriminatie op de werkvloer, en een eigen bedrijf beginnen.')}
  ${card(I_USERS, 'Omgangsvormen, waarden en normen', 'Hoe mensen in Nederland met elkaar omgaan: afspraken, directheid, gelijkheid, en hoe je contact maakt.')}
  ${card(I_HOME, 'Wonen', 'Een woning vinden, huren of kopen, gas water en licht regelen, afval scheiden en burenoverlast.')}
  ${card(I_USER, 'Gezondheid en gezondheidszorg', 'De huisarts als eerste stap, doorverwijzing naar het ziekenhuis, spoed, de zorgverzekering en welzijnswerk.')}
  ${card(I_BOOK, 'Geschiedenis en geografie', 'De grote lijnen van de Nederlandse geschiedenis, en waar de provincies, steden en het water liggen.')}
  ${card(I_LANDMARK, 'Instanties', 'Gemeente, Belastingdienst, toeslagen, politie, juridische hulp en verzekeringen: wie doet wat?')}
  ${card(I_CLIPBOARD, 'Staatsinrichting en rechtsstaat', 'De democratie, de verkiezingen, de grondrechten en de regels waar iedereen zich aan houdt.')}
  ${card(I_CAP, 'Onderwijs en opvoeding', 'Het schoolsysteem, leerplicht, contact met de school, en wat schoolkosten en tegemoetkomingen zijn.')}
</div>

${fact('De eindtermen KNM kennen acht thema’s: Werk en inkomen; Omgangsvormen, waarden en normen; Wonen; Gezondheid en gezondheidszorg; Geschiedenis en geografie; Instanties; Staatsinrichting en rechtsstaat; Onderwijs en opvoeding.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

${docent('Veel cursisten denken dat KNM een geheugentest is met jaartallen en namen. Dat is het niet. De vragen gaan bijna altijd over een situatie: iemand heeft pijn in zijn buik, iemand krijgt een brief van de gemeente. De vraag is dan wat je doet. Als je dat oefent met echte situaties, gaat het veel sneller dan met een lijstje uit je hoofd leren.')}

<h2 id="moet-ik-knm">Moet ik KNM doen?</h2>

<p>KNM hoort bij <strong>alle leerroutes</strong> van de Wet inburgering 2021. Maar niet iedereen
doet er examen in.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Je doet KNM-examen</p>
    <ul>
      <li>${I_CHECK}<span>Zit je in de <strong>B1-route</strong>? Dan doe je het KNM-examen.</span></li>
      <li>${I_CHECK}<span>Zit je in de <strong>onderwijsroute</strong>? Dan doe je het KNM-examen.</span></li>
      <li>${I_CHECK}<span>Burger je in onder de <strong>Wet inburgering 2013</strong>? Dan hoort KNM ook bij je examens.</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Je volgt KNM als lessen</p>
    <ul>
      <li>${I_X}<span>Zit je in de <strong>Z-route</strong>? Dan zit KNM in je cursusuren, en doe je er geen apart examen in.</span></li>
      <li>${I_X}<span>Heb je een <strong>vrijstelling</strong> of een <strong>ontheffing</strong> gekregen van DUO? Dan kan KNM vervallen.</span></li>
    </ul>
  </div>
</div>

<p>Weet je het niet zeker? In <strong>Mijn Inburgering</strong> staat precies welke examens voor
jou gelden. Dat is de enige lijst die klopt voor jouw situatie.</p>

<h2 id="aanmelden-kosten">Aanmelden, kosten en waar je het doet</h2>

<p>Je meldt je aan via Mijn Inburgering, met DigiD. Daar kies je een datum en een plaats.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Aanmelden</h3>
    <p>Log in op Mijn Inburgering en kies het examen KNM. Doe dit ruim op tijd: er zit vaak weken tussen aanmelden en de eerste vrije datum.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Betalen</h3>
    <p>Je betaalt per examen. Op dit moment is dat &euro;50 per onderdeel. Betaal je met een lening bij DUO, dan kies je dat hier.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Naar de examenlocatie</h3>
    <p>Kennisexamens doe je op een van de zes DUO-examenlocaties: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht of Zwolle.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Uitslag</h3>
    <p>De uitslag van de kennisexamens krijg je binnen 8 weken. Je ziet hem in Mijn Inburgering.</p>
  </div></div>
</div>

${factTwo('DUO neemt de kennisexamens en de taalexamens A2 af op zes locaties: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht en Zwolle. De uitslag van deze examens komt binnen 8 weken.', [['inburgeren.nl — Examenplaatsen', SRC_PLAATSEN], ['inburgeren.nl — Uitslag examen', SRC_UITSLAG]], CHECKED)}

${note('Kun je niet komen? Verzet of annuleer je examen <strong>uiterlijk 7 dagen</strong> van tevoren via Mijn Inburgering. Dan krijg je je geld terug. Meld je je later af, of kom je niet opdagen, dan ben je het examengeld kwijt.')}

<h2 id="cesuur">Wanneer ben je geslaagd?</h2>

<p>Hier moeten we eerlijk zijn: <strong>DUO publiceert de zak-slaaggrens van KNM niet</strong>.
In het Examenreglement staat dat de grens een <em>cesuur</em> is die door de Minister wordt
vastgesteld. Er staat geen percentage bij en geen aantal goede antwoorden.</p>

<p>Je leest online vaak wel zulke getallen. Die komen niet van DUO. Wij zetten ze daarom niet op
deze site. Wat je w&eacute;l kunt doen, is zorgen dat je de acht thema's beheerst — dan is de
precieze grens ook niet meer je probleem.</p>

${fact('Het Examenreglement inburgering bepaalt dat de grens tussen zakken en slagen een cesuur is die door de Minister wordt vastgesteld. Een concreet aantal goede antwoorden of een percentage publiceert DUO niet.', 'DUO — Examenreglement inburgering, artikel 10', SRC_REGLEMENT, CHECKED)}

<h2 id="voorbereiden">Hoe bereid je je voor?</h2>

<p>Drie dingen werken, in deze volgorde.</p>

<div class="guide-cards">
  ${card(I_BOOK, 'Lees per thema, niet door elkaar', 'Neem &eacute;&eacute;n thema per keer. Acht thema’s in acht sessies is beter dan alles tegelijk. Elke kennisgids op deze site is er &eacute;&eacute;n.')}
  ${card(I_CLIPBOARD, 'Oefen met vragen, niet met lijstjes', 'KNM vraagt naar situaties. Een lijst woorden uit je hoofd leren helpt minder dan tien oefenvragen maken en de uitleg lezen.')}
  ${card(I_ROUTE, 'Kijk om je heen', 'Je woont in het onderwerp. De brief van de gemeente op je deurmat, de afvalkalender, de school van je kind: dat is letterlijk examenstof.')}
</div>

${docent('Wat ik het vaakst zie misgaan: mensen leren het goede antwoord, maar niet waarom het goed is. Dan komt er in het examen een net iets andere situatie voorbij en klopt het antwoord ineens niet meer. Lees bij elke oefenvraag de uitleg, ook als je hem goed had.')}

${inlineCta('Oefen KNM per thema', 'Onze kennisgidsen volgen precies de acht offici&euml;le thema’s, in eenvoudig Nederlands, nagekeken door een NT2-docent.', '/oefenen', 'Begin met gratis oefenen')}

<h2 id="zakken">En als je zakt?</h2>

<p>Dan doe je het examen opnieuw. Je hoeft alleen het onderdeel over te doen dat je niet hebt
gehaald — je andere behaalde examens blijven staan. Je meldt je gewoon opnieuw aan en betaalt
opnieuw het examengeld, tenzij je nog een gratis poging hebt.</p>

<p>Er staat geen maximum op het aantal keer dat je een examen mag doen. Let wel op je
<strong>inburgeringstermijn</strong>: die loopt door, en het duurt weken voordat je een nieuwe
datum hebt en weer weken voordat de uitslag er is. Reken daarom terug vanaf je einddatum.</p>

${fact('Voor het inburgeringsexamen betaal je per onderdeel. Op dit moment is dat €50 per examen. Prijzen zijn geïndexeerd — controleer het actuele bedrag bij DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="knm-en-de-rest">Waar past KNM in je inburgering?</h2>

<p>KNM is &eacute;&eacute;n van je verplichtingen, niet de hele inburgering. Daarnaast heb je de
taalexamens, en — afhankelijk van je route en je wet — het PVT, de MAP of ONA.</p>

${fact('KNM hoort bij alle leerroutes van de Wet inburgering 2021. In de B1-route en de onderwijsroute doe je er examen in; in de Z-route volg je KNM als cursusuren.', 'inburgeren.nl — U gaat inburgeren', SRC_ROUTES, CHECKED)}

<p>Wil je het hele plaatje zien, met jouw datums erbij? Gebruik dan de tijdlijn-maker: die rekent
uit wanneer je je uiterlijk moet aanmelden voor elk examen.</p>
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>KNM gaat over hoe Nederland werkt, niet over taal.</li>
  <li>Op de computer, 45 minuten.</li>
  <li>Acht offici&euml;le thema's, vastgelegd in de wet.</li>
  <li>Op dit moment &euro;50, zes examenlocaties, uitslag binnen 8 weken.</li>
  <li>De zak-slaaggrens publiceert DUO niet.</li>
</ul>`,

  faq: [
    {
      q: 'Hoeveel vragen heeft het KNM-examen?',
      a: 'DUO noemt op zijn eigen pagina’s geen aantal vragen voor KNM. Wat DUO wel zegt: je doet het op de computer, je krijgt vragen bij verschillende thema’s, en het examen duurt 45 minuten. Aantallen die je elders leest, kunnen wij niet bij DUO terugvinden, dus noemen wij ze niet.',
    },
    {
      q: 'Hoeveel vragen moet ik goed hebben voor KNM?',
      a: 'Dat publiceert DUO niet. In het Examenreglement staat dat de grens tussen zakken en slagen een cesuur is die de Minister vaststelt. Er is geen officieel percentage en geen officieel aantal goede antwoorden dat je kunt aanhouden.',
    },
    {
      q: 'Hoeveel thema’s heeft KNM: 7 of 8?',
      a: 'Acht. In de herziene eindtermen bij de Regeling inburgering 2021 staan acht thema’s: Werk en inkomen; Omgangsvormen, waarden en normen; Wonen; Gezondheid en gezondheidszorg; Geschiedenis en geografie; Instanties; Staatsinrichting en rechtsstaat; Onderwijs en opvoeding. Oudere lesmethodes noemen er soms zeven.',
    },
    {
      q: 'Is het KNM-examen in het Nederlands?',
      a: 'Ja. Het examen is helemaal in het Nederlands, ook al is het geen taalexamen. Daarom loont het om de woorden per thema te leren: als je "huisarts", "verwijzing" of "gemeenteraad" niet kent, kun je de vraag niet beantwoorden, ook als je het antwoord weet.',
    },
    {
      q: 'Moet ik KNM doen in de Z-route?',
      a: 'In de Z-route zit KNM in je cursusuren, niet als apart examen. Je leert de stof dus wel, maar je legt er geen examen over af. In de B1-route en de onderwijsroute doe je het KNM-examen wel. In Mijn Inburgering zie je wat er voor jou geldt.',
    },
    {
      q: 'Wat kost het KNM-examen?',
      a: 'Op dit moment €50, net als de andere onderdelen. Die prijs is geïndexeerd en kan veranderen, dus controleer hem bij DUO voordat je je aanmeldt. Betaal je met een lening bij DUO, dan kies je dat bij het aanmelden.',
    },
  ],

  related: [
    'instanties',
    'gezondheid-en-gezondheidszorg',
    'staatsinrichting-en-rechtsstaat',
    'werk-en-inkomen',
  ],
  relatedPosts: ['inburgeringsexamen-a2-uitleg', 'inburgeringsexamen-zakken-herkansen'],

  ctaTitle: 'Oefen KNM met echte examenvragen',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
