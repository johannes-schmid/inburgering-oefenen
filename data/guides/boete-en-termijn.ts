/**
 * Inburgering spoke — "Je termijn en de boete".
 *
 * The page most likely to be read by someone who is already frightened, so it is ordered by what
 * calms a reader down fastest rather than by the logic of the law:
 *
 *  1. **"Asielstatushouders krijgen nooit een boete"** comes first. `SEO/facts.md` §11 records it
 *     as the single most useful sentence on DUO's own boete page, and burying it under the amounts
 *     is a design decision with a cost. DUO may also not reclaim their loan.
 *  2. Then the termijn: three years from the day *after* the dagtekening of the first PIP.
 *  3. Then extra tijd, then — last — the amounts, for the people they actually apply to.
 *
 * Two figures deliberately absent, both from §11: **no maximum loan amount** (DUO publishes none)
 * and **no fixed verlengingsduur** (DUO names none on the extra-tijd page; "max. 2 jaar" is
 * unsourceable). The only spread that ships is the 6 maanden–2 jaar that follows *a boete*, and it
 * ships with its condition attached.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_CLOCK, I_ALERT, I_EURO, I_CLIPBOARD, I_USER,
  docent, note, inlineCta, factTwo,
} from './kit';

export const SRC_BOETE = 'https://www.inburgeren.nl/u-gaat-inburgeren/boete.jsp';
export const SRC_RVS = 'https://www.rijksoverheid.nl/actueel/nieuws/2025/07/09/uitspraak-raad-van-state-in-zaak-boetes-en-leningen-inburgering';
export const SRC_EXTRATIJD = 'https://www.inburgeren.nl/extra-tijd/';
export const SRC_WET11 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&artikel=11';
export const SRC_KENNIS = 'https://www.inburgeren.nl/examen-doen/inhoud-kennisexamens.jsp';
export const SRC_NIEUWS = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16';
export const CHECKED = '23-08-2026';

export const price = (icon: string, name: string, sub: string, amount: string) =>
  `<div class="price-row"><span class="price-icon">${icon}</span>` +
  `<span class="price-name">${name}<span>${sub}</span></span>` +
  `<span class="price-amount">${amount}</span></div>`;

const guide: Guide = {
  slug: 'boete-en-termijn',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'clock',

  title: 'Inburgeringstermijn en boete: hoeveel tijd heb je echt?',
  description:
    'Je termijn is drie jaar, maar de wachttijden eten hem op. Hoe de termijn loopt, wanneer je extra tijd krijgt, en wie sinds 2025 geen boete meer kan krijgen.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Termijn en boete',
  eyebrow: 'Termijn',

  heroTitle: 'Je termijn en de boete',
  heroSubtitle:
    'Drie jaar klinkt als veel tijd. Maar tussen aanmelden en uitslag zitten maanden, en die tellen mee. Hier staat hoe je termijn echt werkt — en wat er gebeurt als het niet lukt.',
  readingMinutes: 7,

  articleHtml: `
<h2 id="geen-boete">Eerst het belangrijkste: asielstatushouders krijgen geen boete</h2>

<div class="verdict ok">
  <p class="verdict-answer">Ben je asielstatushouder? Dan kun je geen boete krijgen.</p>
  <p>De Raad van State — de hoogste bestuursrechter van Nederland — bepaalde op 9 juli 2025 dat
  asielstatushouders geen boete mogen krijgen omdat ze te laat inburgeren. DUO mag hun ook de
  lening niet terugvorderen. Je hoeft hiervoor zelf niets te doen.</p>
</div>

<p>DUO had de boetes en terugvorderingen voor deze groep al in februari 2025 gepauzeerd, na een
uitspraak van het Europese Hof van Justitie. De uitspraak van de Raad van State maakte dat
definitief.</p>

${factTwo('De Raad van State oordeelde op 9 juli 2025 dat asielstatushouders geen boete mogen krijgen wegens te laat inburgeren en dat hun lening niet mag worden teruggevorderd; DUO had die boetes en terugvorderingen in februari 2025 al gepauzeerd. Op de eigen pagina van DUO staat: "Asielstatushouders krijgen nooit een boete."', [['Rijksoverheid — Uitspraak Raad van State', SRC_RVS], ['inburgeren.nl — Boete', SRC_BOETE]], CHECKED)}

${docent('Ik merk dat deze angst bij veel cursisten alles overheerst, ook al is hij voor een groot deel van hen niet meer terecht. Weet je niet zeker in welke groep je zit? Kijk in je brief van DUO of vraag het aan je klantmanager bij de gemeente. Dat is &eacute;&eacute;n vraag, en hij kan je maanden stress schelen.')}

<h2 id="termijn">Hoe lang is je termijn?</h2>

<p>Onder de Wet inburgering 2021 heb je <strong>drie jaar</strong>. Maar de startdatum is
preciezer dan mensen denken: de termijn begint op de dag <strong>na de dagtekening van je eerste
PIP</strong> — het persoonlijk plan dat de gemeente met je maakt.</p>

<p>Twee dingen die daaruit volgen:</p>

<ul>
  <li>Niet de dag dat je in Nederland aankwam, en niet de dag dat je je vergunning kreeg. De dag na de datum die op je eerste PIP staat.</li>
  <li>Wordt je PIP later <strong>herzien</strong>, dan begint de termijn niet opnieuw. De startdatum blijft die van het eerste PIP.</li>
</ul>

${fact('De inburgeringstermijn bedraagt drie jaar en vangt aan met ingang van de dag na de dagtekening van het eerste persoonlijk plan inburgering en participatie (PIP). Een herziening van het PIP verschuift die startdatum niet.', 'Wet inburgering 2021, artikel 11', SRC_WET11, CHECKED)}

${note('Burger je in onder de <strong>Wet inburgering 2013</strong>? Dan gelden andere regels en een andere startdatum. Wat voor jou geldt, staat in de brief van DUO en in Mijn Inburgering. Ga niet af op wat een kennis met een ander bouwjaar aan zijn verblijfsvergunning heeft meegemaakt.')}

<h2 id="wachttijden">De valkuil: de wachtrij, niet de deadline</h2>

<p>Dit is waar mensen in de knel komen, en het is bijna nooit omdat ze te lang deden over het
leren. Het is de optelsom van wachttijden.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Aanmelden kost weken</h3>
    <p>Tussen je aanmelding en de eerste vrije examendatum zitten vaak meer dan zes weken.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>De uitslag kost weken</h3>
    <p>Normaal 8 weken voor de taalexamens A2 en de kennisexamens.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Bij Schrijven en Spreken op dit moment langer</h3>
    <p>DUO meldde op 31 juli 2026 dat Spreken A2 en Schrijven A2 tot 16 weken kunnen duren, met automatisch zes maanden verlenging voor wie daardoor in de knel komt.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>En dan begint een herkansing weer bij stap 1</h3>
    <p>Aanmelden, wachten, examen, wachten. Wie op de laatste maanden gokt, heeft geen ruimte meer voor een tweede poging.</p>
  </div></div>
</div>

<p>De praktische conclusie: <strong>reken terug vanaf je einddatum, niet vooruit vanaf vandaag.</strong>
Trek van je einddatum de uitslagtermijn af, en daarvan nog eens ongeveer zeven weken voor het
aanmelden. Wat overblijft is je echte uiterlijke aanmelddatum — en die ligt maanden eerder dan de
datum in je brief.</p>

${fact('DUO meldde op 31 juli 2026 dat het nakijken van de examens Spreken A2 en Schrijven A2 op dat moment maximaal 16 weken duurt. Wie daardoor in de knel komt met de inburgeringstermijn, krijgt automatisch zes maanden verlenging.', 'inburgeren.nl — Nieuwsbericht 31-07-2026', SRC_NIEUWS, CHECKED)}

${inlineCta('Reken je eigen data uit', 'De tijdlijn-maker rekent per onderdeel terug wanneer je je uiterlijk moet aanmelden om binnen je termijn te blijven.', '/oefenen', 'Begin met gratis oefenen')}

<h2 id="extra-tijd">Wanneer krijg je extra tijd?</h2>

<p>Lukt het niet binnen de termijn, dan kun je in bepaalde situaties verlenging aanvragen bij DUO.
Dit zijn situaties die DUO zelf noemt.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Kan reden zijn voor extra tijd</p>
    <ul>
      <li>${I_CHECK}<span>Je moest eerst leren lezen en schrijven (alfabetisering)</span></li>
      <li>${I_CHECK}<span>Je volgt een opleiding</span></li>
      <li>${I_CHECK}<span>Ziekte</span></li>
      <li>${I_CHECK}<span>Een overlijden in de familie</span></li>
      <li>${I_CHECK}<span>Een bevalling</span></li>
      <li>${I_CHECK}<span>Dakloosheid, of verblijf in een instelling</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Belangrijk om te weten</p>
    <ul>
      <li>${I_X}<span>Je kunt in een periode <strong>maar &eacute;&eacute;n keer</strong> extra tijd krijgen — ook als er meerdere situaties tegelijk gelden</span></li>
      <li>${I_X}<span>DUO noemt op die pagina <strong>geen vaste verlengingsduur</strong>. Getallen die je elders leest, zijn niet te onderbouwen.</span></li>
      <li>${I_X}<span>Een aanvraag is geen toekenning. Plan nooit op een verlenging die nog niet is toegekend.</span></li>
    </ul>
  </div>
</div>

${fact('DUO noemt als situaties die extra tijd kunnen geven onder meer: eerst leren lezen en schrijven, een opleiding volgen, ziekte, een overlijden in de familie, een bevalling, dakloosheid en verblijf in een instelling. "U kunt in een periode maar 1 keer extra tijd krijgen", ook als meerdere situaties tegelijk gelden.', 'inburgeren.nl — Extra tijd', SRC_EXTRATIJD, CHECKED)}

${docent('Vraag extra tijd aan z&oacute;dra je weet dat het niet gaat lukken, niet in de laatste maand. En blijf intussen gewoon examens doen. Het ergste scenario is dat je stopt in de verwachting dat de verlenging er komt, en dat hij wordt afgewezen.')}

<h2 id="boete">De boete: bedragen en gevolgen</h2>

<p>Ben je g&eacute;&eacute;n asielstatushouder — je kwam bijvoorbeeld naar Nederland voor je partner
of je gezin — dan kun je wel een boete krijgen als je niet op tijd inburgert en je geen recht hebt
op extra tijd. Dit zijn de maximumbedragen.</p>

<div class="price-list">
  ${price(I_CLIPBOARD, 'Leerroute niet afgerond', 'Wet inburgering 2021', 'max. &euro;1.000')}
  ${price(I_CLIPBOARD, 'PVT niet afgerond', 'Wet inburgering 2021', '&euro;340')}
  ${price(I_CLIPBOARD, 'MAP niet afgerond', 'Wet inburgering 2021', '&euro;340')}
  ${price(I_CLIPBOARD, 'Geen inburgeringsdiploma', 'Wet inburgering 2013', 'max. &euro;1.250')}
  ${price(I_CLIPBOARD, 'PVT niet ondertekend', 'Wet inburgering 2013', '&euro;340')}
</div>

<p>Een boete is niet het einde van je inburgering. Je krijgt er <strong>extra tijd</strong> bij om
het alsnog af te maken. Hoeveel, hangt af van wat je al hebt gehaald of hoeveel lesuren je hebt
gevolgd: dat loopt van zes maanden tot twee jaar.</p>

${fact('Voor overige inburgeraars geldt onder de Wet 2021 een maximale boete van €1.000 voor de leerroute en €340 voor PVT en voor MAP; onder de Wet 2013 maximaal €1.250 voor het inburgeringsdiploma en €340 voor het PVT. Na een boete krijgt de inburgeraar extra tijd om alsnog in te burgeren, afhankelijk van behaalde examens of gevolgde lesuren.', 'inburgeren.nl — Boete', SRC_BOETE, CHECKED)}

<h3>Het PVT heeft zijn eigen termijn</h3>

<p>Let hierop, want het is een aparte klok: onder de <strong>Wet 2013</strong> heb je maar
<strong>&eacute;&eacute;n jaar</strong> om de participatieverklaring te ondertekenen, gerekend vanaf
je inschrijving bij de gemeente. Lukt dat niet en is dat je eigen schuld, dan volgt een boete van
&euro;340 en kun je ook niet meer lenen bij DUO. Onder de <strong>Wet 2021</strong> heb je er drie
jaar voor.</p>

${fact('Onder de Wet inburgering 2021 hebt u drie jaar de tijd om de participatieverklaring te ondertekenen. Onder de Wet inburgering 2013 is dat één jaar vanaf de inschrijving bij de gemeente; wie dat door eigen schuld niet haalt, krijgt een boete van €340 en kan niet meer lenen bij DUO.', 'inburgeren.nl — Kennisexamens en PVT', SRC_KENNIS, CHECKED)}

<h2 id="wat-nu">Wat doe je als je in de knel zit?</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Zoek je einddatum op</h3>
    <p>Die staat in Mijn Inburgering en in je PIP. Werk vanaf dat getal, niet vanaf een gevoel.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Bel je klantmanager bij de gemeente</h3>
    <p>Die kent je dossier, en kan meedenken over je route, je lessen en een eventuele aanvraag.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Vraag extra tijd aan als je daar reden voor hebt</h3>
    <p>Op tijd, met bewijs, en bij DUO. Niet wachten tot de laatste maand.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Meld je intussen aan voor het onderdeel dat het dichtst bij is</h3>
    <p>E&eacute;n gehaald onderdeel telt altijd, ook als de rest niet lukt — en het telt mee bij de beoordeling of je je best hebt gedaan.</p>
  </div></div>
</div>

${note('Krijg je een brief met een boete of een besluit waar je het niet mee eens bent? Er staat een <strong>bezwaartermijn</strong> in, meestal zes weken. Reageer binnen die termijn, ook als je nog niet alles op orde hebt. Gratis hulp bij bezwaar krijg je bij Het Juridisch Loket of bij de sociaal raadslieden van je gemeente.')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Asielstatushouders krijgen sinds 2025 nooit een boete.</li>
  <li>De termijn is 3 jaar, vanaf de dag n&aacute; de datum op je eerste PIP.</li>
  <li>Reken terug: aanmelden en uitslag kosten samen maanden.</li>
  <li>Extra tijd kan, maar in een periode maar &eacute;&eacute;n keer.</li>
  <li>Boete Wet 2021: max. &euro;1.000 leerroute, &euro;340 PVT, &euro;340 MAP.</li>
</ul>`,

  faq: [
    {
      q: 'Hoe lang is de inburgeringstermijn?',
      a: 'Onder de Wet inburgering 2021 is dat drie jaar. De termijn begint op de dag na de dagtekening van je eerste PIP, het persoonlijk plan dat de gemeente met je maakt. Wordt je PIP later herzien, dan verschuift die startdatum niet.',
    },
    {
      q: 'Krijg ik een boete als ik niet op tijd inburger?',
      a: 'Ben je asielstatushouder, dan niet: de Raad van State bepaalde op 9 juli 2025 dat DUO je geen boete mag geven en je lening niet mag terugvorderen. Andere inburgeraars kunnen wel een boete krijgen als ze geen recht op extra tijd hebben — maximaal €1.000 voor de leerroute onder de wet van 2021, en €340 voor PVT of MAP.',
    },
    {
      q: 'Kan ik verlenging van mijn termijn krijgen?',
      a: 'In bepaalde situaties wel, bijvoorbeeld als je eerst moest leren lezen en schrijven, bij ziekte, een bevalling, een overlijden in de familie of dakloosheid. Je vraagt het aan bij DUO. Let op: je kunt in een periode maar één keer extra tijd krijgen, en DUO noemt geen vaste verlengingsduur.',
    },
    {
      q: 'Wanneer moet ik me uiterlijk aanmelden voor mijn laatste examen?',
      a: 'Veel eerder dan je denkt. Trek van je einddatum de uitslagtermijn af — normaal 8 weken, en voor Schrijven A2 en Spreken A2 op dit moment tot 16 weken — en daar nog eens ongeveer zeven weken voor het aanmelden bovenop. Wat overblijft is je echte uiterste aanmelddatum.',
    },
    {
      q: 'Wat gebeurt er na een boete?',
      a: 'De inburgeringsplicht blijft bestaan. Je krijgt met de boete extra tijd om het alsnog af te maken; hoeveel hangt af van welke examens je al hebt gehaald of hoeveel lesuren je hebt gevolgd, en dat loopt van zes maanden tot twee jaar. Ben je het niet eens met het besluit, dan kun je binnen de bezwaartermijn bezwaar maken.',
    },
    {
      q: 'Hoeveel tijd heb ik voor de participatieverklaring?',
      a: 'Onder de Wet inburgering 2021 drie jaar. Onder de Wet inburgering 2013 maar één jaar, gerekend vanaf je inschrijving bij de gemeente. Haal je dat door eigen schuld niet, dan volgt een boete van €340 en kun je niet meer lenen bij DUO.',
    },
  ],

  related: ['inburgering-stappenplan', 'wat-kost-inburgeren', 'vrijstelling-en-ontheffing', 'pvt-map-en-ona'],
  relatedPosts: ['inburgeringsexamen-zakken-herkansen'],

  ctaTitle: 'Verlies geen maanden aan een herkansing',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
