/**
 * KNM thema 1 — Werk en inkomen.
 *
 * The four eindtermen of this thema (Stcrt. 2024, 15802) are the four `<h2>`s of the body:
 * 1.1 snel en efficiënt werk zoeken · 1.2 actief deel uitmaken van een arbeidsorganisatie ·
 * 1.3 omgaan met (verborgen) discriminatie · 1.4 voorbereidingen treffen om een eigen bedrijf
 * te starten. Keeping the structure identical to the eindtermen is what makes this a reference
 * page rather than an article about work.
 *
 * **No euro amounts.** Minimumloon, belastingschijven and toeslagbedragen all change at least
 * yearly and would rot silently inside a guide body. The mechanisms are described and every
 * amount is left to the linked government page, which is the `SEO/facts.md` §4 discipline
 * applied to figures we would otherwise have to re-verify every January.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_CHECK, I_X, I_EURO, I_USERS, I_CLIPBOARD, I_USER, I_ALERT, I_LANDMARK,
  docent, note, inlineCta, factTwo,
} from './kit';

export const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
export const SRC_WERKNEMER = 'https://www.rijksoverheid.nl/onderwerpen/arbeidsovereenkomst-en-cao';
export const SRC_MINIMUMLOON = 'https://www.rijksoverheid.nl/onderwerpen/minimumloon';
export const SRC_DISCRIMINATIE = 'https://www.rijksoverheid.nl/onderwerpen/discriminatie';
export const SRC_MENSENRECHTEN = 'https://www.mensenrechten.nl/';
export const SRC_KVK = 'https://www.kvk.nl/starten/';
export const SRC_UWV = 'https://www.uwv.nl/particulieren/werkloos/';
export const CHECKED = '23-08-2026';

export const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const guide: Guide = {
  slug: 'werk-en-inkomen',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'briefcase',

  title: 'KNM thema Werk en inkomen: werk zoeken en werken in NL',
  description:
    'Werk zoeken, je contract en loonstrook begrijpen, omgaan met discriminatie op het werk en een eigen bedrijf starten. Het KNM-thema Werk en inkomen uitgelegd.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Werk en inkomen',
  eyebrow: 'KNM-thema 1',

  heroTitle: 'Werk en inkomen',
  heroSubtitle:
    'Hoe vind je werk in Nederland, wat staat er in een contract, en wat doe je als je oneerlijk behandeld wordt? Dit thema gaat over werken en over het geld dat je ermee verdient.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="wat-vraagt-knm">Wat vraagt KNM over dit thema?</h2>

<p>In de offici&euml;le eindtermen heeft dit thema vier onderdelen. Ze staan hieronder in dezelfde
volgorde als in de wet, en de rest van deze gids volgt die volgorde ook.</p>

<div class="compare-rows">
  ${row('1.1', 'Snel en effici&euml;nt (nieuw) werk zoeken')}
  ${row('1.2', 'Actief deel uitmaken van een arbeidsorganisatie')}
  ${row('1.3', 'Omgaan met (verborgen) discriminatie op arbeidsmarkt en werkvloer')}
  ${row('1.4', 'Voorbereidingen treffen om een eigen bedrijf te starten')}
</div>

${fact('De eindtermen KNM bij thema Werk en inkomen zijn: snel en efficiënt (nieuw) werk zoeken; actief deel uitmaken van een arbeidsorganisatie; omgaan met (verborgen) discriminatie op arbeidsmarkt en werkvloer; voorbereidingen treffen om een eigen bedrijf te starten.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

<h2 id="werk-zoeken">Werk zoeken in Nederland</h2>

<p>In Nederland zoek je meestal zelf werk. Er is geen instantie die je een baan geeft. Je zoekt
op vacaturesites, via uitzendbureaus, via de gemeente, en — heel belangrijk — via mensen die je
kent.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Je cv</h3>
    <p>Eén of twee pagina's. Je opleiding, je werkervaring met jaartallen, je talen en je vaardigheden. In Nederland zet je meestal <strong>geen foto, geen leeftijd en geen burgerlijke staat</strong> op je cv. Dat is niet onbeleefd, dat is normaal.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Je sollicitatiebrief</h3>
    <p>Kort, en steeds anders per vacature. Je schrijft waarom jij bij die functie past, niet je hele levensverhaal.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Het gesprek</h3>
    <p>Je komt op tijd — in Nederland betekent dat vijf minuten van tevoren. Je geeft een hand, je kijkt mensen aan, en je mag zelf ook vragen stellen. Dat wordt gewaardeerd.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Je netwerk</h3>
    <p>Veel banen worden gevonden via mensen. Vertel op je taalles, bij de sportclub of bij vrijwilligerswerk dat je werk zoekt. Dat is geen bedelen, dat is hoe het hier werkt.</p>
  </div></div>
</div>

${docent('Mijn cursisten schrikken vaak van het "verkopen" van jezelf in een sollicitatiebrief. In veel landen is dat opscheppen. Hier is het gewoon informatie geven. Schrijf op wat je kunt, in gewone zinnen. Dat is genoeg.')}

<p>Ben je je baan kwijtgeraakt? Dan meld je je bij <strong>UWV</strong>. Dat is de instantie die
gaat over werkloosheidsuitkeringen (WW) en over arbeidsongeschiktheid. Heb je geen recht op WW en
ook geen ander inkomen, dan kun je bij je <strong>gemeente</strong> bijstand aanvragen.</p>

<h2 id="op-het-werk">Werken: contract, loonstrook en je rechten</h2>

<p>Als je werk hebt, krijg je een <strong>arbeidsovereenkomst</strong>. Dat is een contract, meestal
op papier. Teken nooit iets dat je niet begrijpt — vraag om uitleg of om een dag bedenktijd.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Tijdelijk contract</h3>
      <p class="compare-when">Bepaalde tijd</p>
    </div>
    <div class="compare-rows">
      ${row('Duur', 'Er staat een einddatum in')}
      ${row('Stopt', 'Vanzelf op die datum')}
      ${row('Let op', 'Na een aantal tijdelijke contracten heb je recht op een vast contract')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Vast contract</h3>
      <p class="compare-when">Onbepaalde tijd</p>
    </div>
    <div class="compare-rows">
      ${row('Duur', 'Geen einddatum')}
      ${row('Stopt', 'Alleen met jouw akkoord, via UWV of via de rechter')}
      ${row('Let op', 'Je werkgever mag je niet zomaar ontslaan')}
    </div>
  </div>
</div>

<p>Elke maand krijg je een <strong>loonstrook</strong> (ook wel salarisstrook). Daarop staan drie
dingen die je moet kunnen lezen:</p>

<ul>
  <li><strong>Brutoloon</strong> — je loon v&oacute;&oacute;r de aftrek.</li>
  <li><strong>Inhoudingen</strong> — loonbelasting en premies. Die gaan naar de Belastingdienst en betalen mee aan zorg, AOW en uitkeringen.</li>
  <li><strong>Nettoloon</strong> — wat er op je rekening komt. Dit is altijd lager dan het brutoloon, en dat hoort zo.</li>
</ul>

<p>Iedereen van 21 jaar en ouder heeft recht op ten minste het <strong>wettelijk minimumloon</strong>.
Jongere werknemers hebben een minimumjeugdloon. De bedragen veranderen twee keer per jaar; kijk
ze na op de site van de Rijksoverheid.</p>

<p>Verder heb je recht op <strong>vakantiedagen</strong> en op <strong>vakantiegeld</strong>
(meestal in mei). In veel sectoren geldt een <strong>cao</strong>: afspraken tussen werkgevers en
vakbonden die boven je eigen contract gaan. Werk je in zo'n sector, dan gelden die afspraken ook
voor jou, ook als ze niet in je contract staan.</p>

${factTwo('Iedereen van 21 jaar en ouder die in Nederland werkt, heeft recht op ten minste het wettelijk minimumloon; voor jongere werknemers geldt het minimumjeugdloon. Afspraken in een cao gelden voor alle werknemers in die sector.', [['Rijksoverheid — Minimumloon', SRC_MINIMUMLOON], ['Rijksoverheid — Arbeidsovereenkomst en cao', SRC_WERKNEMER]], CHECKED)}

${note('Word je ziek? Dan meld je je ziek bij je werkgever, volgens de regels die je van hem hebt gekregen. Je werkgever betaalt je loon voor een groot deel door. Werk je via een uitzendbureau, dan meld je je daar ziek — niet bij het bedrijf waar je staat.')}

<h2 id="discriminatie">Discriminatie op het werk</h2>

<p>Dit is een eigen eindterm, en niet voor niets. In Nederland is discriminatie
<strong>verboden</strong>. Een werkgever mag je niet afwijzen of anders behandelen vanwege je
afkomst, je huidskleur, je geloof, je geslacht, je leeftijd, een beperking of omdat je zwanger
bent.</p>

<div class="yesno-grid">
  <div class="yesno-col no">
    <p class="yesno-title">Dit mag niet</p>
    <ul>
      <li>${I_X}<span>"Wij zoeken iemand zonder accent" in een vacature</span></li>
      <li>${I_X}<span>Minder loon voor hetzelfde werk vanwege je afkomst of geslacht</span></li>
      <li>${I_X}<span>Grappen of opmerkingen over je geloof of je huidskleur</span></li>
      <li>${I_X}<span>Niet aangenomen worden omdat je een hoofddoek draagt</span></li>
    </ul>
  </div>
  <div class="yesno-col yes">
    <p class="yesno-title">Dit kun je doen</p>
    <ul>
      <li>${I_CHECK}<span>Schrijf op wat er gebeurde, wanneer, en wie erbij was</span></li>
      <li>${I_CHECK}<span>Praat met je leidinggevende of de vertrouwenspersoon van het bedrijf</span></li>
      <li>${I_CHECK}<span>Meld het bij een antidiscriminatiebureau — dat is gratis</span></li>
      <li>${I_CHECK}<span>Leg de zaak voor aan het College voor de Rechten van de Mens</span></li>
    </ul>
  </div>
</div>

<p><strong>Verborgen</strong> discriminatie is lastiger: je wordt niet uitgenodigd, en je hoort
nooit waarom. Daarom noemen de eindtermen het apart. Je hoeft het niet te bewijzen om er hulp bij
te vragen. Elke gemeente is verplicht een antidiscriminatievoorziening te hebben waar je gratis
terechtkunt.</p>

${factTwo('Discriminatie is in Nederland verboden. Iedere gemeente moet inwoners toegang geven tot een antidiscriminatievoorziening; daarnaast kan iedereen een oordeel vragen aan het College voor de Rechten van de Mens.', [['Rijksoverheid — Discriminatie', SRC_DISCRIMINATIE], ['College voor de Rechten van de Mens', SRC_MENSENRECHTEN]], CHECKED)}

${docent('Dit onderwerp komt in het examen bijna altijd terug als een situatie: iemand hoort een opmerking op de werkvloer, wat doet hij? Het goede antwoord is zelden "niets doen" en zelden "meteen ontslag nemen". Het is bijna altijd: benoemen, en hulp zoeken bij iemand die daarvoor is.')}

<h2 id="eigen-bedrijf">Een eigen bedrijf starten</h2>

<p>Wil je voor jezelf beginnen? Dat mag, en veel inburgeraars doen het. De hoofdlijn is kort.</p>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Mag ik werken?</h3>
    <p>Kijk eerst op je verblijfsvergunning wat er op de achterkant staat over arbeid. Niet elke vergunning geeft dezelfde rechten voor ondernemen.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Inschrijven bij de KVK</h3>
    <p>Je schrijft je bedrijf in bij de Kamer van Koophandel. Je krijgt een KVK-nummer en de Belastingdienst geeft je een btw-nummer.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Administratie en btw</h3>
    <p>Je bewaart je facturen, je doet meestal per kwartaal btw-aangifte, en je doet één keer per jaar aangifte inkomstenbelasting.</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Zelf verzekeren</h3>
    <p>Als ondernemer krijg je geen loon doorbetaald bij ziekte en bouw je geen werknemerspensioen op. Dat regel je zelf, of je accepteert het risico bewust.</p>
  </div></div>
</div>

${fact('Wie in Nederland een bedrijf start, schrijft dat in bij de Kamer van Koophandel; de Belastingdienst verstrekt daarna een btw-nummer. De KVK beschrijft de stappen van inschrijving tot administratie.', 'KVK — Een bedrijf starten', SRC_KVK, CHECKED)}

${note('Let op met "schijnzelfstandigheid": als je in de praktijk gewoon werknemer bent maar je moet jezelf als zzp’er inschrijven, dan mis je bescherming waar je recht op hebt. Vraag dat na bij een vakbond of bij het Juridisch Loket voordat je tekent.')}

<h2 id="oefenen">Wat je hiervan moet onthouden</h2>

<p>Het examen vraagt geen bedragen. Het vraagt of je weet <em>waar je moet zijn</em>: UWV voor WW,
de gemeente voor bijstand, de Belastingdienst voor belasting en toeslagen, de KVK voor je bedrijf,
en een antidiscriminatiebureau als je oneerlijk behandeld wordt.</p>

${inlineCta('Oefen dit thema met examenvragen', 'Situaties zoals in het echte KNM-examen, met uitleg na elk antwoord.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Je zoekt zelf werk: cv, brief, gesprek, netwerk.</li>
  <li>Lees je contract en je loonstrook: bruto, inhoudingen, netto.</li>
  <li>Minimumloon vanaf 21 jaar; een cao gaat boven je contract.</li>
  <li>Discriminatie is verboden — meld het, gratis, bij een antidiscriminatiebureau.</li>
  <li>Eigen bedrijf: inschrijven bij de KVK, btw-aangifte, zelf verzekeren.</li>
</ul>`,

  faq: [
    {
      q: 'Wat is het verschil tussen brutoloon en nettoloon?',
      a: 'Brutoloon is je loon voordat er iets af gaat. Daar gaan loonbelasting en premies vanaf. Wat overblijft is je nettoloon, en dat is het bedrag dat op je bankrekening komt. Beide bedragen staan elke maand op je loonstrook.',
    },
    {
      q: 'Wat moet ik doen als ik gediscrimineerd word op mijn werk?',
      a: 'Schrijf eerst op wat er precies gebeurde, wanneer en wie erbij was. Bespreek het daarna met je leidinggevende of met de vertrouwenspersoon van het bedrijf. Helpt dat niet, dan kun je het gratis melden bij het antidiscriminatiebureau van je gemeente of een oordeel vragen aan het College voor de Rechten van de Mens.',
    },
    {
      q: 'Waar meld ik me als ik werkloos word?',
      a: 'Bij UWV. Die beoordeelt of je recht hebt op een WW-uitkering. Heb je daar geen recht op en heb je ook geen ander inkomen, dan vraag je bijstand aan bij je eigen gemeente. Meld je snel, want de datum van je melding telt mee.',
    },
    {
      q: 'Mag ik in Nederland een eigen bedrijf beginnen als inburgeraar?',
      a: 'Meestal wel, maar het hangt af van je verblijfsvergunning. Kijk eerst wat er op de achterkant van je vergunning staat over arbeid. Mag het, dan schrijf je je bedrijf in bij de Kamer van Koophandel en krijg je van de Belastingdienst een btw-nummer.',
    },
    {
      q: 'Wat is een cao?',
      a: 'Een collectieve arbeidsovereenkomst: afspraken tussen werkgevers en vakbonden over loon, werktijden en vakantie in een hele sector. Werk je in een sector met een cao, dan gelden die afspraken ook voor jou, ook als ze niet letterlijk in je eigen contract staan.',
    },
  ],

  related: ['instanties', 'onderwijs-en-opvoeding', 'staatsinrichting-en-rechtsstaat'],
  relatedPosts: ['inburgeringsexamen-a2-uitleg'],

  ctaTitle: 'Oefen het thema Werk en inkomen',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
