/**
 * Taalexamens spoke — Spreken.
 *
 * The onderdeel candidates fear most and prepare for least, because it is the only one you cannot
 * practise silently. The page is built around that: the four soorten vragen DUO's own oefenexamen
 * announces on its start screen, and then a preparation section that is entirely about speaking
 * out loud rather than about vocabulary.
 *
 * The four soorten come verbatim from the DUO oefenexamen start screen (`SEO/facts.md` §1): "Het
 * examen heeft vier soorten vragen: vragen met een video, vragen met 1 plaatje, vragen met 2
 * plaatjes, vragen met 3 plaatjes." That sentence is DUO's, so it can be quoted; the 16-vragen
 * counter beside it is attributed to the oefenexamens, never to the real exam.
 *
 * Same 16-week uitslag caveat as Schrijven, and dated for the same reason.
 */
import type { Guide } from './types';
import { fact } from './types';
import { I_CHECK, I_X, I_MIC, I_CLOCK, docent, note, inlineCta, factTwo } from './kit';

export const SRC_TAALEXAMENS = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
export const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
export const SRC_NT2 = 'https://www.staatsexamensnt2.nl/';
export const SRC_NIEUWS = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16';
export const SRC_UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag-examen.jsp';
export const CHECKED = '23-08-2026';

export const card = (icon: string, title: string, body: string) =>
  `<div class="guide-card"><span class="guide-card-icon">${icon}</span><h3>${title}</h3><p>${body}</p></div>`;

const guide: Guide = {
  slug: 'spreken-examen',
  section: 'taalexamens',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-23',
  pillar: false,
  coverGlyph: 'mic',

  title: 'Het examen Spreken (A2 en B1): opzet, tijd en aanpak',
  description:
    'Spreken doe je op de computer met een microfoon: filmpjes en plaatjes met vragen. Hoe het examen werkt op A2 en B1, en hoe je hardop oefent zonder partner.',

  datePublished: '2026-08-23',
  dateModified: '2026-08-23',
  dateLabel: '23 augustus 2026',
  breadcrumb: 'Spreken',
  eyebrow: 'Taalexamen',

  heroTitle: 'Het examen Spreken',
  heroSubtitle:
    'Je praat tegen een computer, niet tegen een mens. Dat maakt het vreemd en voor veel mensen spannend — en het is precies de reden dat hardop oefenen zo veel oplevert.',
  readingMinutes: 8,

  articleHtml: `
<h2 id="hoe-ziet-het-eruit">Hoe ziet het examen eruit?</h2>

<p>Je zit achter een computer met een koptelefoon en een microfoon. Je krijgt een filmpje of een
plaatje te zien met een vraag erbij, en je spreekt je antwoord in. Er zit dus
<strong>geen examinator tegenover je</strong>.</p>

<div class="article-table-wrap">
<table>
  <thead><tr><th></th><th>A2</th><th>B1</th></tr></thead>
  <tbody>
    <tr><td><strong>Duur</strong></td><td>35 minuten</td><td>ongeveer 30 minuten</td></tr>
    <tr><td><strong>Hoe</strong></td><td>Op de computer, met microfoon</td><td>Staatsexamen NT2, zie staatsexamensnt2.nl</td></tr>
    <tr><td><strong>In DUO's oefenexamens</strong></td><td>16 vragen</td><td>zie staatsexamensnt2.nl</td></tr>
    <tr><td><strong>Beoordeling</strong></td><td>Deels automatisch, deels door beoordelaars</td><td>Door beoordelaars</td></tr>
  </tbody>
</table>
</div>

${factTwo('DUO: "Het examen Spreken op niveau A2 doet u op de computer. U moet Nederlands spreken en verstaan. U bekijkt filmpjes en u beantwoordt vragen. Het examen duurt 35 minuten." De examens Spreken op niveau B1 en B2 (staatsexamen Nt2) duren ongeveer 30 minuten.', [['inburgeren.nl — Taalexamens', SRC_TAALEXAMENS], ['Staatsexamens NT2', SRC_NT2]], CHECKED)}

<h2 id="soorten-vragen">De vier soorten vragen</h2>

<p>Het startscherm van DUO's eigen oefenexamen Spreken A2 zegt het letterlijk: er zijn vier soorten
vragen. Dat is de handigste indeling om je op voor te bereiden.</p>

<div class="guide-cards">
  ${card(I_MIC, 'Een vraag met een video', 'Iemand spreekt je aan en vraagt je iets. Jij antwoordt zoals je in het echt zou doen — kort, direct, en op de vraag.')}
  ${card(I_MIC, 'Een vraag met 1 plaatje', 'Je ziet &eacute;&eacute;n foto. Meestal moet je vertellen wat je ziet, of wat je in die situatie zou zeggen of doen.')}
  ${card(I_MIC, 'Een vraag met 2 plaatjes', 'Twee opties naast elkaar. Je kiest er &eacute;&eacute;n &eacute;n je legt uit waarom. Het "waarom" is het punt.')}
  ${card(I_MIC, 'Een vraag met 3 plaatjes', 'Drie beelden die samen een verhaaltje vormen. Je vertelt wat er gebeurt, in volgorde.')}
</div>

${fact('Op het startscherm van DUO’s openbare oefenexamens Spreken A2 staat: "Het examen heeft vier soorten vragen: vragen met een video, vragen met 1 plaatje, vragen met 2 plaatjes, vragen met 3 plaatjes. U mag 35 minuten over het examen doen." De teller vermeldt 16 vragen.', 'inburgeren.nl — Oefenen', SRC_OEFENEN, CHECKED)}

${note('Je krijgt per vraag een <strong>beperkte spreektijd</strong> en het opnemen start vanzelf. Je kunt een antwoord niet overdoen. Dat voelt onprettig, maar het betekent ook: doorpraten is beter dan opnieuw beginnen.')}

<h2 id="waarop-beoordeeld">Waar wordt op gelet?</h2>

<p>Spreken wordt deels automatisch en deels door mensen beoordeeld. In grote lijnen gaat het om
vier dingen tegelijk.</p>

<ul>
  <li><strong>Heb je antwoord gegeven op de vraag?</strong> Een prachtig verhaal over iets anders levert niets op.</li>
  <li><strong>Ben je te verstaan?</strong> Uitspraak en tempo. Rustig en duidelijk is beter dan snel.</li>
  <li><strong>Gebruik je genoeg taal?</strong> Twee woorden is te weinig, ook als ze kloppen. Maak zinnen.</li>
  <li><strong>Loopt het een beetje door?</strong> Aarzelen mag; helemaal stilvallen kost je de opname.</li>
</ul>

${docent('Het grootste probleem bij Spreken is niet de taal maar de stilte. Cursisten denken drie seconden na, zeggen dan &eacute;&eacute;n woord, en de opname stopt. Praat door, ook als je twijfelt. Zeg "even denken hoor", zeg het in andere woorden, herhaal de vraag. Alles is beter dan niets zeggen.')}

<h2 id="aanpak">Aanpak per soort vraag</h2>

<div class="guide-steps">
  <div class="guide-step"><span class="guide-step-num">1</span><div class="guide-step-body">
    <h3>Bij een video: reageer als mens</h3>
    <p>Iemand vraagt je iets. Antwoord zoals je aan de balie zou antwoorden: kort, vriendelijk, met een reden erbij. "Ja, dat is goed, want ik ben die dag vrij."</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">2</span><div class="guide-step-body">
    <h3>Bij 1 plaatje: benoem, en breid uit</h3>
    <p>Zeg eerst wat je ziet, dan waar, dan wat er gebeurt. Drie zinnen in plaats van &eacute;&eacute;n. "Ik zie een man in een winkel. Hij staat bij de kassa. Hij betaalt met zijn pinpas."</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">3</span><div class="guide-step-body">
    <h3>Bij 2 plaatjes: kies &eacute;n motiveer</h3>
    <p>Kies snel — welke je kiest maakt niet uit. Alle punten zitten in het "omdat". "Ik kies de fiets, omdat het dichtbij is en omdat het goedkoper is dan de bus."</p>
  </div></div>
  <div class="guide-step"><span class="guide-step-num">4</span><div class="guide-step-body">
    <h3>Bij 3 plaatjes: vertel in volgorde</h3>
    <p>Gebruik volgordewoorden: eerst, daarna, dan, ten slotte. Die maken van losse zinnen een verhaal, en dat is precies wat er gevraagd wordt.</p>
  </div></div>
</div>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Doen</p>
    <ul>
      <li>${I_CHECK}<span>Praat duidelijk en niet te snel, met je mond dicht bij de microfoon</span></li>
      <li>${I_CHECK}<span>Gebruik hele zinnen, ook bij een simpele vraag</span></li>
      <li>${I_CHECK}<span>Geef altijd een reden — "omdat" is het nuttigste woord van dit examen</span></li>
      <li>${I_CHECK}<span>Verbeter jezelf hardop als je iets fout zegt; dat mag en het telt niet tegen je</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Niet doen</p>
    <ul>
      <li>${I_X}<span>Stil blijven om na te denken</span></li>
      <li>${I_X}<span>Fluisteren of wegdraaien van de microfoon</span></li>
      <li>${I_X}<span>Een geleerd verhaaltje opzeggen dat niet bij de vraag past</span></li>
      <li>${I_X}<span>Alleen "ja" of "de fiets" antwoorden</span></li>
    </ul>
  </div>
</div>

<h2 id="zenuwen">Zenuwen en de microfoon</h2>

<p>Bijna iedereen vindt inspreken tegen een computer ongemakkelijk. Dat is normaal, en het is te
trainen — door het vaak te doen, niet door het te vermijden.</p>

<ul>
  <li>Neem jezelf op met je telefoon. De eerste keer is vreemd, de vijfde keer niet meer.</li>
  <li>Luister je opname terug. Je hoort meteen of je te zacht praat of te veel stilvalt.</li>
  <li>Oefen hardop, ook alleen: beschrijf wat je op straat ziet, in hele zinnen.</li>
  <li>Doe minstens &eacute;&eacute;n keer een compleet oefenexamen met koptelefoon en microfoon.</li>
</ul>

${docent('Ik laat cursisten in de les hun eigen opname terugluisteren. Dat is confronterend, en het is het snelste leermoment van het hele traject. Bijna niemand hoort zichzelf zo lang stil zijn als hij in werkelijkheid is.')}

<h2 id="uitslag">Wachttijd: plan dit onderdeel vroeg</h2>

<p>Net als Schrijven wordt Spreken A2 door mensen beoordeeld, en daar geldt op dit moment een
langere wachttijd voor.</p>

${factTwo('DUO meldde op 31 juli 2026 dat het nakijken van de examens Spreken A2 en Schrijven A2 op dat moment maximaal 16 weken duurt, met automatisch zes maanden verlenging voor wie daardoor in de knel komt met de inburgeringstermijn. Voor de overige examens geldt de gebruikelijke termijn van 8 weken.', [['inburgeren.nl — Nieuwsbericht 31-07-2026', SRC_NIEUWS], ['inburgeren.nl — Uitslag examen', SRC_UITSLAG]], CHECKED)}

<p>Dat is een nieuwsbericht en het kan veranderen; controleer het bij DUO voordat je plant. Maar
zolang het geldt: <strong>doe Spreken niet als laatste</strong>. Zak je, dan heb je de wachttijd
van de uitslag &eacute;n van de herkansing nog te gaan.</p>

${inlineCta('Oefen Spreken met beoordeling per criterium', 'Neem je antwoord op zoals in het examen en krijg feedback op inhoud, verstaanbaarheid en taalgebruik.', '/premium', 'Bekijk de modules')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>A2: 35 minuten op de computer met microfoon; B1: ongeveer 30 minuten.</li>
  <li>Vier soorten vragen: video, 1 plaatje, 2 plaatjes, 3 plaatjes.</li>
  <li>DUO's A2-oefenexamens hebben 16 vragen.</li>
  <li>Praat door, gebruik hele zinnen en geef altijd een reden.</li>
  <li>Uitslag Spreken A2 duurt op dit moment tot 16 weken: plan het vroeg.</li>
</ul>`,

  faq: [
    {
      q: 'Praat ik bij het examen Spreken tegen een echte persoon?',
      a: 'Nee. Je zit achter een computer met een koptelefoon en een microfoon. Je ziet filmpjes en plaatjes met vragen, en je spreekt je antwoord in. Er zit geen examinator tegenover je, en je kunt niet om herhaling vragen.',
    },
    {
      q: 'Wat voor vragen krijg ik bij Spreken A2?',
      a: 'Volgens het startscherm van DUO’s eigen oefenexamen zijn er vier soorten: vragen met een video, met één plaatje, met twee plaatjes en met drie plaatjes. Bij twee plaatjes kies je er één en leg je uit waarom; bij drie plaatjes vertel je in volgorde wat er gebeurt.',
    },
    {
      q: 'Wat doe ik als ik het antwoord niet weet?',
      a: 'Blijf praten. Stilte levert nooit punten op, een half antwoord soms wel. Zeg de vraag in je eigen woorden terug, noem wat je wel ziet, of geef een reden waarom je twijfelt. Je mag jezelf ook hardop verbeteren; dat telt niet tegen je.',
    },
    {
      q: 'Hoe kan ik Spreken oefenen als ik geen Nederlandse gesprekspartner heb?',
      a: 'Hardop, alleen, met een opname. Beschrijf wat je ziet in hele zinnen en neem jezelf op met je telefoon. Luister het daarna terug: je hoort meteen of je te zacht praat, te snel gaat of te lang stil bent. Zoek daarnaast een taalmaatje of taalcafé via de bibliotheek of VluchtelingenWerk.',
    },
    {
      q: 'Hoe lang duurt de uitslag van Spreken?',
      a: 'Normaal binnen 8 weken. DUO meldde op 31 juli 2026 dat Spreken A2 en Schrijven A2 op dat moment tot 16 weken duurden, met automatisch zes maanden verlenging voor wie daardoor in de knel komt. Controleer de actuele stand bij DUO en plan dit onderdeel niet als laatste.',
    },
  ],

  related: ['taalexamens-a2-b1', 'schrijven-examen', 'luisteren-examen'],
  relatedPosts: ['inburgeringsexamen-a2-uitleg', 'inburgeringsexamen-zakken-herkansen'],

  ctaTitle: 'Oefen het onderdeel Spreken',
  ctaDesc: 'Spreekopdrachten met feedback per criterium, opgesteld door een NT2-docent.',
  ctaHref: '/premium',
  ctaLabel: 'Bekijk de modules',
};

export default guide;
