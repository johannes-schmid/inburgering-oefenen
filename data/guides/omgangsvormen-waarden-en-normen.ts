/**
 * KNM thema 2 — Omgangsvormen, waarden en normen.
 *
 * Two eindtermen (Stcrt. 2024, 15802): 2.1 duiden van verschillende omgangsvormen in Nederland ·
 * 2.2 deelnemen aan sociale netwerken.
 *
 * This is the thema with the highest risk of writing nonsense, because almost nothing in it is a
 * rule with a source — "Nederlanders zijn direct" is a stereotype, not a fact. So the guide is
 * built the way the eindterm itself is worded: it teaches *duiden*, reading a situation, and every
 * hard claim it makes is a legal one (gelijkheid, Artikel 1 Grondwet, the vier kernwaarden of the
 * participatieverklaring) that can be sourced. Social habits are described as habits, explicitly
 * as "vaak" and "meestal", never as rules — a guide that tells a reader Dutch people *are*
 * something is teaching them to fail a question about a Dutch person who is not.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_USERS, I_CLIPBOARD, I_HOME, docent, note, inlineCta, factTwo } from './kit';

export const SRC_EINDTERMEN = 'https://zoek.officielebekendmakingen.nl/stcrt-2024-15802.html';
export const SRC_GRONDWET = 'https://wetten.overheid.nl/jci1.3:c:BWBR0001840&artikel=1';
export const SRC_PVT = 'https://www.inburgeren.nl/examen-doen/inhoud-kennisexamens.jsp';
export const SRC_DISCRIMINATIE = 'https://www.rijksoverheid.nl/onderwerpen/discriminatie';
export const SRC_VRIJWILLIG = 'https://www.rijksoverheid.nl/onderwerpen/vrijwilligerswerk';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'omgangsvormen-waarden-en-normen',
  section: 'knm',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'twopeople',

  title: 'KNM: Omgangsvormen, waarden en normen in Nederland',
  description:
    'Hoe gaan mensen in Nederland met elkaar om? Over afspraken maken, directheid, gelijkheid en contact leggen. Het KNM-thema Omgangsvormen, waarden en normen.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Omgangsvormen',
  eyebrow: 'KNM-thema 2',

  heroTitle: 'Omgangsvormen, waarden en normen',
  heroSubtitle:
    'Dit thema gaat over hoe mensen hier met elkaar omgaan: wat gewoon is, wat mag, en wat de wet erover zegt. En over hoe je zelf contact maakt.',
  readingMinutes: 7,

  articleHtml: `
<h2 id="wat-vraagt-knm">Wat vraagt KNM over dit thema?</h2>

<p>Dit thema heeft twee eindtermen: je kunt <strong>omgangsvormen duiden</strong> — dus begrijpen
wat er gebeurt in een situatie — en je kunt <strong>deelnemen aan sociale netwerken</strong>.</p>

<p>Let op het woord <em>duiden</em>. Het examen vraagt niet of je je aanpast. Het vraagt of je een
situatie kunt lezen: waarom reageert die buurvrouw zo, wat wordt hier van mij verwacht?</p>

${fact('De eindtermen KNM bij thema Omgangsvormen, waarden en normen zijn: duiden van verschillende omgangsvormen in Nederland, en deelnemen aan sociale netwerken.', 'Staatscourant 2024, 15802 — Regeling inburgering 2021', SRC_EINDTERMEN, CHECKED)}

<h2 id="waarden">Waarden: wat vastligt in de wet</h2>

<p>Er is een verschil tussen <strong>waarden</strong> en <strong>gewoontes</strong>. Waarden liggen
vast in de wet en gelden voor iedereen. Gewoontes verschillen per persoon, per stad en per
familie.</p>

<p>Het allereerste artikel van de Grondwet zegt dat iedereen in Nederland in gelijke gevallen
gelijk behandeld wordt, en dat discriminatie niet is toegestaan — niet vanwege godsdienst,
levensovertuiging, politieke gezindheid, ras, geslacht, handicap of seksuele gerichtheid, en ook
niet op welke grond dan ook.</p>

${fact('Artikel 1 van de Grondwet: "Allen die zich in Nederland bevinden, worden in gelijke gevallen gelijk behandeld. Discriminatie wegens godsdienst, levensovertuiging, politieke gezindheid, ras, geslacht, handicap, seksuele gerichtheid of op welke grond dan ook, is niet toegestaan."', 'wetten.overheid.nl — Grondwet artikel 1', SRC_GRONDWET, CHECKED)}

<p>Bij je inburgering onderteken je het <strong>participatieverklaringstraject</strong> (PVT). Dat
is precies dit onderwerp, maar dan als handtekening. Het gaat over vier kernwaarden:</p>

<div class="guide-cards">
  ${card(I_USERS, 'Vrijheid', 'Iedereen mag zeggen wat hij vindt en geloven wat hij wil. Ook als een ander het daar niet mee eens is.')}
  ${card(I_USERS, 'Gelijkwaardigheid', 'Mannen en vrouwen zijn gelijk. Mensen met verschillende afkomst, geloof of geaardheid zijn gelijk.')}
  ${card(I_USERS, 'Solidariteit', 'We zorgen samen voor mensen die het moeilijk hebben, via belasting, verzekeringen en hulp.')}
  ${card(I_USERS, 'Participatie', 'Meedoen wordt verwacht: werken, leren, vrijwilligerswerk, of op een andere manier bijdragen.')}
</div>

<p>Vrijheid heeft één grens, en die grens is de vrijheid van een ander. Je mag zeggen wat je
vindt — maar discrimineren, bedreigen of aanzetten tot haat mag niet.</p>

${factTwo('In het participatieverklaringstraject leert u wat belangrijk is in Nederland: "Iedereen in Nederland is gelijk. Iedereen mag zelf kiezen wat hij gelooft. Iedereen mag zeggen wat hij vindt. Maar discrimineren mag niet." Daarna ondertekent u de participatieverklaring.', [['inburgeren.nl — Kennisexamens en PVT', SRC_PVT], ['Rijksoverheid — Discriminatie', SRC_DISCRIMINATIE]], CHECKED)}

<h2 id="gewoontes">Gewoontes: wat je vaak ziet</h2>

<p>Nu de gewoontes. Dit zijn <strong>geen regels</strong>, en niet iedere Nederlander doet het zo.
Maar je komt ze vaak tegen, en het examen gebruikt ze in situaties.</p>

<h3>Afspraken en tijd</h3>
<ul>
  <li>Op tijd komen is belangrijk. Kom je later dan afgesproken, stuur dan een bericht.</li>
  <li>Langsgaan zonder afspraak is niet gebruikelijk, ook niet bij vrienden. Bel of app even.</li>
  <li>Een agenda is normaal. "Zullen we over twee weken afspreken?" is geen afwijzing.</li>
</ul>

<h3>Praten met elkaar</h3>
<ul>
  <li>Mensen zeggen vaak vrij direct wat ze vinden. Dat is meestal niet onbeleefd bedoeld.</li>
  <li>"Nee" zeggen mag, en wordt niet als beledigend gezien.</li>
  <li>Je spreekt volwassenen die je niet kent aan met <em>u</em>. Vaak zegt iemand daarna zelf: "zeg maar je".</li>
  <li>Bij een eerste ontmoeting geef je meestal een hand. Wil je dat niet, dan mag je dat zeggen — een vriendelijke groet is ook goed.</li>
</ul>

<h3>Thuis en op bezoek</h3>
<ul>
  <li>Je wordt op een tijd uitgenodigd, en er is dan meestal wel of juist geen eten. Vraag het gerust.</li>
  <li>Bij een verjaardag feliciteer je ook de familie van de jarige.</li>
  <li>Mensen betalen vaak ieder voor zichzelf in een caf&eacute; of restaurant. Dat heet "gaan we splitten?".</li>
</ul>

${docent('Ik zeg het elk jaar tegen een nieuwe groep: directheid is hier geen boosheid. Als je collega zegt "dat verslag klopt niet", dan zegt hij iets over het verslag, niet over jou. Dat is voor veel cursisten het grootste verschil, groter dan de taal.')}

${note('Andersom geldt hetzelfde: jouw gewoontes zijn niet fout. Je hoeft je eigen manieren niet weg te doen om in te burgeren. Het examen vraagt of je de Nederlandse gewoontes h&eacute;rkent — niet of je ze overneemt.')}

<h2 id="netwerken">Deelnemen aan sociale netwerken</h2>

<p>De tweede eindterm is praktisch: hoe kom je in contact met mensen? Voor werk, voor de taal en
voor jezelf is dit het belangrijkste dat je kunt doen.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Dit werkt</p>
    <ul>
      <li>${I_CHECK}<span>Vrijwilligerswerk — je oefent taal en je ontmoet mensen buiten je eigen kring</span></li>
      <li>${I_CHECK}<span>Een taalmaatje of taalcaf&eacute; via de bibliotheek of VluchtelingenWerk</span></li>
      <li>${I_CHECK}<span>Een sportclub of vereniging in de buurt</span></li>
      <li>${I_CHECK}<span>De school van je kinderen: ouderavonden, meehelpen bij een uitje</span></li>
      <li>${I_CHECK}<span>Je buren gedag zeggen, en jezelf voorstellen als je nieuw bent</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Dit vertraagt je</p>
    <ul>
      <li>${I_X}<span>Alleen contact met mensen uit je eigen land — begrijpelijk, maar je hoort dan weinig Nederlands</span></li>
      <li>${I_X}<span>Wachten tot iemand jou uitnodigt. Hier neem je zelf het initiatief.</span></li>
      <li>${I_X}<span>Denken dat je pas mag meedoen als je goed Nederlands spreekt</span></li>
    </ul>
  </div>
</div>

${fact('Vrijwilligerswerk is onbetaald werk voor een organisatie of vereniging. De Rijksoverheid noemt het een manier om mee te doen in de samenleving; gemeenten en vrijwilligerscentrales bemiddelen erin.', 'Rijksoverheid — Vrijwilligerswerk', SRC_VRIJWILLIG, CHECKED)}

${docent('Vrijwilligerswerk is de beste taalles die er bestaat, en hij is gratis. Twee dagdelen per week in een buurthuis of een kringloopwinkel doet meer voor je spreekvaardigheid dan een extra cursusboek. En het staat op je cv.')}

<h2 id="in-het-examen">Hoe dit in het examen terugkomt</h2>

<p>Bijna altijd als een situatie met een vraag erachter. Een collega zegt iets, een buurvrouw
klopt aan, je krijgt een uitnodiging. De vraag is dan: wat betekent dit, of wat doe je?</p>

<p>Twee vuistregels helpen bij dit thema:</p>

<div class="guide-cards">
  ${card(I_CLIPBOARD, 'Praat er eerst zelf over', 'Bij een probleem met een buur, een collega of een school is het eerste goede antwoord bijna altijd: ga het gesprek aan. Pas daarna komt een instantie in beeld.')}
  ${card(I_HOME, 'Niemand hoeft zich te schikken', 'Antwoorden waarin iemand ongelijk behandeld wordt vanwege geslacht, geloof of afkomst zijn in dit examen nooit goed. Dat is Artikel 1.')}
</div>

${inlineCta('Oefen dit thema met examenvragen', 'Situaties zoals in het echte KNM-examen, met uitleg na elk antwoord.', '/oefenen', 'Start een gratis proefexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Waarden liggen vast in de wet; gewoontes verschillen per persoon.</li>
  <li>Artikel 1 Grondwet: gelijke behandeling, geen discriminatie.</li>
  <li>Vier kernwaarden van het PVT: vrijheid, gelijkwaardigheid, solidariteit, participatie.</li>
  <li>Afspraken maken, op tijd komen en direct praten zijn hier normaal.</li>
  <li>Vrijwilligerswerk is de snelste weg naar contact en taal.</li>
</ul>`,

  faq: [
    {
      q: 'Wat is het verschil tussen een waarde en een norm?',
      a: 'Een waarde is wat mensen belangrijk vinden, bijvoorbeeld gelijkheid of vrijheid. Een norm is de regel die daaruit volgt, bijvoorbeeld dat je iemand niet mag discrimineren. Waarden zoals gelijkheid staan in de Grondwet; veel normen zijn gewoontes en staan nergens opgeschreven.',
    },
    {
      q: 'Moet ik een hand geven als ik dat niet wil?',
      a: 'Nee, dat is niet verplicht. Een hand geven is een gewoonte, geen wet. Je kunt vriendelijk groeten en uitleggen dat je geen hand geeft. Bedenk wel dat sommige werkgevers of scholen er wél waarde aan hechten; het gesprek erover is dan belangrijker dan de handdruk zelf.',
    },
    {
      q: 'Waarom zijn Nederlanders zo direct?',
      a: 'Directheid wordt hier gezien als eerlijk en duidelijk, niet als onbeleefd. Iemand die kritiek geeft op je werk, zegt daarmee meestal niets over jou als persoon. Let wel op: niet iedere Nederlander is direct, en het examen vraagt of je de situatie kunt lezen, niet of je zelf zo wordt.',
    },
    {
      q: 'Hoe maak ik contact met Nederlanders?',
      a: 'Neem zelf het initiatief en zoek plekken waar je regelmatig dezelfde mensen ziet: vrijwilligerswerk, een sportclub, een taalcafé in de bibliotheek of de school van je kinderen. Je hoeft niet te wachten tot je Nederlands goed is; de meeste mensen vinden het juist prettig als je het probeert.',
    },
    {
      q: 'Wat is de participatieverklaring?',
      a: 'Een verklaring die je ondertekent bij je gemeente, als onderdeel van je inburgering. Je verklaart dat je actief wilt meedoen in de Nederlandse samenleving en dat je respect hebt voor wat hier belangrijk is: vrijheid, gelijkwaardigheid, solidariteit en participatie. De gemeente geeft aan DUO door dat je hebt getekend.',
    },
  ],

  related: ['staatsinrichting-en-rechtsstaat', 'instanties', 'wonen'],
  relatedPosts: [],

  ctaTitle: 'Oefen het thema Omgangsvormen',
  ctaDesc: 'Gratis proefexamen van tien vragen, met uitleg na elk antwoord. Zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis proefexamen',
};

export default guide;
