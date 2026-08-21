/**
 * Spoke 3 of the Inburgering cluster: "Wat kost inburgeren?"
 *
 * Owner manuscript "4. Wat kost inburgeren?" (20-08-2026) plus a boete section the manuscript
 * did not have — the owner supplied artwork for it, and the claims on that artwork were verified
 * on 20-08-2026 against inburgeren.nl/u-gaat-inburgeren/boete.jsp, the Raad van State ruling of
 * 09-07-2025 and the rijksoverheid nieuwsbericht of the same day. See `SEO/facts.md` §11.
 *
 * What this page must keep right:
 *
 *  - **`SEO/facts.md` §4's volatility rule.** Exam fees are indexed. Every figure is phrased as
 *    "op dit moment" with a live DUO link beside it, so a price change makes the page out of
 *    date rather than false. Never build a block whose only content is the money figure.
 *  - **Our own price is read from `lib/pricing.ts`, never typed.** A stale euro figure in a
 *    guide body is a false price claim that keeps ranking after `/premium` is corrected — the
 *    same rule M0 applied to the `Offer` schema.
 *  - **The boete section leads with "asielstatushouders krijgen nooit een boete."** It is the
 *    single most useful sentence on the page for the audience that arrives most anxious, and
 *    burying it under the amounts would be a design decision with a cost.
 *  - **No maximum loan amount is stated.** DUO publishes none on the lenen page; §9's discipline
 *    is to write the absence, not to guess.
 */
import type { Guide } from './types';
import { fact } from './types';
import { MODULE_PRICE_CENTS, euro } from '@/lib/pricing';
import {
  I_CHECK, I_X, I_BOOK, I_HEADPHONES, I_PEN, I_MIC, I_LANDMARK, I_CLIPBOARD,
  I_EURO, I_CLOCK, docent, docentIn, note, inlineCta, factIn, factTwo, factTwoIn, figure,
} from './kit';

const SRC_KOSTEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
const SRC_LENEN = 'https://www.inburgeren.nl/inburgeren-betalen/lenen-bij-duo.jsp';
const SRC_BOETE = 'https://www.inburgeren.nl/u-gaat-inburgeren/boete.jsp';
const SRC_RVS = 'https://www.rijksoverheid.nl/actueel/nieuws/2025/07/09/uitspraak-raad-van-state-in-zaak-boetes-en-leningen-inburgering';
const SRC_REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const CHECKED = '20-08-2026';

const price = (icon: string, name: string, sub: string, amount: string) =>
  `<div class="price-row"><span class="price-icon">${icon}</span>` +
  `<span class="price-name">${name}<span>${sub}</span></span>` +
  `<span class="price-amount">${amount}</span></div>`;

const row = (key: string, val: string) =>
  `<div class="compare-row"><p class="compare-key">${key}</p><p class="compare-val">${val}</p></div>`;

const MODULE_PRICE = euro(MODULE_PRICE_CENTS);

const guide: Guide = {
  slug: 'wat-kost-inburgeren',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-20',
  pillar: false,

  title: 'Wat kost inburgeren? Alle kosten op een rij',
  description:
    'Wat betaal je voor je inburgering? De prijs per examenonderdeel, wanneer het gratis is, lenen bij DUO en wat er sinds 2025 met de boetes is veranderd.',

  datePublished: '2026-08-20',
  dateModified: '2026-08-20',
  dateLabel: '20 augustus 2026',
  breadcrumb: 'Wat kost het?',
  eyebrow: 'Kosten',

  heroTitle: 'Wat kost inburgeren?',
  heroSubtitle:
    'Dat hangt af van je situatie. Voor de een betaalt de gemeente bijna alles, de ander betaalt cursus en examens zelf. Hier staat wat je waar aan kwijt bent.',
  heroImage: {
    base: 'wat-kost-inburgeren',
    hasWebp: true,
    alt: 'Eurobiljetten en munten naast een rekenmachine',
    position: 'center 50%',
    credit: 'Jakub Zerdzicki (Pexels)',
  },
  readingMinutes: 5,

  articleHtml: `
<h2 id="is-het-gratis">Is het voor mij gratis?</h2>

<p>Er zijn grofweg twee situaties. Zoek de jouwe op.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Je bent asielstatushouder</h3>
      <p class="compare-when">Onder de Wet inburgering 2021</p>
    </div>
    <div class="compare-rows">
      ${row('Cursus', 'De gemeente betaalt die meestal.')}
      ${row('Examens', 'De eerste 2 pogingen van elk verplicht examen zijn gratis.')}
      ${row('Let op', 'Die 2 gratis pogingen vervallen als je examen doet op een lager niveau dan in je PIP staat.')}
      ${row('Lenen bij DUO', 'Niet nodig, en niet mogelijk.')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Je bent een andere inburgeraar</h3>
      <p class="compare-when">Bijvoorbeeld gezinsmigrant</p>
    </div>
    <div class="compare-rows">
      ${row('Cursus', 'Die betaal je meestal zelf.')}
      ${row('Examens', 'Die betaal je zelf: op dit moment €50 per onderdeel.')}
      ${row('Let op', 'Kom je niet opdagen, dan betaal je het examen opnieuw.')}
      ${row('Lenen bij DUO', 'Kan onder voorwaarden, voor cursus en examens.')}
    </div>
  </div>
</div>

${fact('De eerste 2 pogingen van elk examen zijn gratis voor asielstatushouders — maar niet als je examen doet op een lager niveau dan in je PIP staat. Heb je meer dan 2 pogingen nodig, dan betaal je die zelf en kun je daarvoor niet lenen bij DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="prijs-per-examen">Wat kost een examen?</h2>

<p>De prijs is hetzelfde voor <strong>A2 en B1</strong>. Je betaalt per onderdeel, per poging.</p>

<div class="price-list">
  ${price(I_BOOK, 'Lezen', 'Teksten lezen en vragen beantwoorden', '€50')}
  ${price(I_HEADPHONES, 'Luisteren', 'Gesprekken en fragmenten begrijpen', '€50')}
  ${price(I_PEN, 'Schrijven', 'Korte teksten en formulieren', '€50')}
  ${price(I_MIC, 'Spreken', 'Antwoorden inspreken achter de computer', '€50')}
  ${price(I_LANDMARK, 'KNM', 'Kennis van de Nederlandse Maatschappij', '€50')}
  <div class="price-row is-total">
    <span class="price-icon">${I_EURO}</span>
    <span class="price-name">Alle 5 samen<span>Onder de Wet inburgering 2021</span></span>
    <span class="price-amount">€250</span>
  </div>
</div>

<p>Val je onder de <strong>Wet inburgering 2013</strong>? Dan komt daar ONA bij, op dit moment
€40. Samen €290. Je hoeft trouwens niet altijd alle onderdelen te doen: welke examens jij moet
maken hangt af van je leerroute en van de wet die voor jou geldt. In <strong>Mijn
Inburgering</strong> staat jouw lijst.</p>

${fact('Op het moment van schrijven kost elk examenonderdeel €50 (Lezen, Luisteren, Schrijven, Spreken en KNM), samen €250. ONA kost €40 en geldt alleen onder de Wet 2013. Deze bedragen worden geïndexeerd — controleer de actuele prijs bij DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="afzeggen">Kun je niet komen? Zeg op tijd af</h2>

<p>Verzet je examen of zeg het af in Mijn Inburgering, <strong>uiterlijk 7 dagen van tevoren</strong>.
Doe je dat op tijd, dan krijg je je geld terug — en als het een gratis poging was, blijft die gratis
poging staan. Kom je gewoon niet opdagen, dan betaal je opnieuw.</p>

${figure(
  'explainer-afzeggen-week', 1400, 616,
  'Een tijdlijn naar de examendag, met een streep een week ervoor: tot die streep kun je nog afzeggen, daarna niet meer.',
  'Er zit een streep een week voor je examen. Zeg je af vóór die streep, dan krijg je je geld terug. Daarna niet meer, ook niet als je ziek bent.',
)}

${fact('Je kunt een examen tot 7 dagen van tevoren verzetten of afzeggen. Wie zich later afmeldt of niet komt opdagen, krijgt het examengeld niet terug.', 'DUO — Examenreglement inburgering', SRC_REGLEMENT, CHECKED)}

${docent('Dit zie ik echt elk jaar een paar keer misgaan: iemand wordt ziek, doet niets, en betaalt vijftig euro voor een examen dat hij niet gemaakt heeft. Twee klikken in Mijn Inburgering en dat was niet gebeurd. Zet het meteen goed als je twijfelt — je kunt altijd een nieuwe datum kiezen.')}

<h2 id="lenen">Lenen bij DUO</h2>

<p>Betaal je je inburgering zelf? Dan kun je onder voorwaarden geld lenen bij DUO. Je vraagt de
lening aan via Mijn Inburgering.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Wel te betalen uit de lening</p>
    <ul>
      <li>${I_CHECK}<span>Een cursus Nederlands op A2, B1 of B2</span></li>
      <li>${I_CHECK}<span>Een cursus alfabetisering</span></li>
      <li>${I_CHECK}<span>Examens bij een erkende instelling</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Niet uit de lening</p>
    <ul>
      <li>${I_X}<span>Een laptop, boeken, eten of reiskosten</span></li>
      <li>${I_X}<span>Extra examenpogingen na de eerste twee</span></li>
      <li>${I_X}<span>Een school zonder keurmerk — kijk eerst op zoekinburgerschool.nl</span></li>
    </ul>
  </div>
</div>

<p>Je krijgt het geleende bedrag <strong>niet op je rekening</strong>: DUO betaalt je school of je
examen rechtstreeks. En je betaalt de lening later terug, met rente.</p>

${fact('Asielstatushouders kunnen niet lenen bij DUO, omdat de gemeente hun cursus betaalt. Anderen lenen voor cursus en examens bij een erkende instelling; DUO betaalt de school rechtstreeks.', 'inburgeren.nl — Lenen bij DUO', SRC_LENEN, CHECKED)}

<h2 id="boete">Krijg ik een boete als het niet lukt?</h2>

<p>Hier is sinds 2025 iets belangrijks veranderd.</p>

<div class="verdict ok">
  <p class="verdict-answer">Asielstatushouders krijgen nooit een boete</p>
  <p>De hoogste rechter, de Raad van State, oordeelde op 9 juli 2025 dat DUO asielstatushouders
  geen boete mag geven als ze te lang over hun inburgering doen. DUO mag ook geen lening
  terugvorderen. Je hoeft daar zelf niets voor te doen.</p>
</div>

<p>Ben je <strong>geen</strong> asielstatushouder — bijvoorbeeld omdat je voor je partner of je
gezin naar Nederland kwam? Dan kun je nog wel een boete krijgen als je niet op tijd klaar bent en
je geen recht hebt op extra tijd. Een boete is dan geen eindpunt: DUO geeft je er ook
<strong>extra tijd</strong> bij om je inburgering alsnog af te maken. Dit zijn de
maximumbedragen:</p>

<div class="price-list">
  ${price(I_CLIPBOARD, 'Leerroute niet afgerond', 'Wet inburgering 2021', 'max. €1.000')}
  ${price(I_CLIPBOARD, 'PVT niet afgerond', 'Wet inburgering 2021', '€340')}
  ${price(I_CLIPBOARD, 'MAP niet afgerond', 'Wet inburgering 2021', '€340')}
  ${price(I_CLIPBOARD, 'Geen inburgeringsdiploma', 'Wet inburgering 2013', 'max. €1.250')}
  ${price(I_CLIPBOARD, 'PVT niet afgerond', 'Wet inburgering 2013', '€340')}
</div>

${factTwo('De Raad van State oordeelde op 9 juli 2025 dat het ministerie een asielstatushouder geen boete mag opleggen en zijn lening niet mag laten terugbetalen; DUO had dat in februari 2025 al gepauzeerd. Voor andere inburgeraars gelden onder de Wet 2021 maximaal €1.000 voor de leerroute en €340 voor PVT en voor MAP, en onder de Wet 2013 maximaal €1.250 voor het diploma en €340 voor PVT. Na een boete krijg je extra tijd om alsnog in te burgeren.', [['Rijksoverheid — Uitspraak Raad van State', SRC_RVS], ['inburgeren.nl — Boete', SRC_BOETE]], CHECKED)}

<h2 id="oefenen">Oefenen is goedkoper dan herkansen</h2>

<p>Eén herkansing kost je op dit moment €50. Vier onderdelen twee keer overdoen is €400 — plus
de maanden die het je kost.</p>

${inlineCta(`Eén maand oefenen kost ${MODULE_PRICE}`, 'Minder dan één herkansing bij DUO. Tien volledige oefenexamens per onderdeel, met uitleg.', '/premium', 'Bekijk de modules')}

<p>Wil je eerst kijken of het bij je past? Begin met een gratis oefenexamen. Tien vragen, uitleg
bij elk antwoord, geen account nodig.</p>
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Asielstatushouder: de gemeente betaalt de cursus, en 2 pogingen per examen zijn gratis.</li>
  <li>Andere inburgeraars betalen zelf: op dit moment €50 per onderdeel, €250 voor alle vijf.</li>
  <li>Afzeggen kan tot 7 dagen van tevoren, met geld terug.</li>
  <li>Lenen bij DUO kan, maar niet voor extra pogingen.</li>
  <li>Asielstatushouders krijgen sinds 2025 nooit meer een boete.</li>
</ul>`,

  faq: [
    {
      q: 'Wat kost het inburgeringsexamen?',
      a: 'Op het moment van schrijven €50 per onderdeel — Lezen, Luisteren, Schrijven, Spreken en KNM — dus €250 voor alle vijf. Onder de Wet 2013 komt ONA erbij voor €40. De prijs is gelijk voor A2 en B1 en wordt geïndexeerd, dus controleer hem bij DUO.',
    },
    {
      q: 'Is inburgeren gratis voor asielstatushouders?',
      a: 'Grotendeels. De gemeente betaalt meestal de cursus, en de eerste 2 pogingen van elk verplicht examen zijn gratis. Die gratis pogingen vervallen wel als je examen doet op een lager niveau dan in je PIP staat.',
    },
    {
      q: 'Kan ik geld lenen voor mijn inburgering?',
      a: 'Ja, onder voorwaarden, via Mijn Inburgering. De lening is voor een cursus bij een erkende school en voor examens — niet voor een laptop, boeken of reiskosten, en niet voor extra examenpogingen. Je krijgt het geld niet zelf: DUO betaalt de school. Asielstatushouders kunnen niet lenen, omdat de gemeente hun cursus betaalt.',
    },
    {
      q: 'Krijg ik een boete als ik niet op tijd inburger?',
      a: 'Ben je asielstatushouder, dan niet: de Raad van State bepaalde op 9 juli 2025 dat DUO jou geen boete mag geven en je lening niet mag terugvorderen. Andere inburgeraars kunnen wel een boete krijgen — maximaal €1.000 voor de leerroute onder de Wet 2021, en €340 voor PVT of MAP. Je krijgt er dan ook extra tijd bij.',
    },
    {
      q: 'Krijg ik mijn geld terug als ik niet naar het examen kan?',
      a: 'Ja, als je uiterlijk 7 dagen van tevoren afzegt of je examen verzet in Mijn Inburgering. Was het een gratis poging, dan blijft die staan. Meld je je later af of kom je niet opdagen, dan ben je het examengeld kwijt.',
    },
  ],

  related: ['moet-ik-inburgeren', 'welke-wet-en-welke-route', 'inburgering-stappenplan'],
  relatedPosts: ['inburgeringsexamen-zakken-herkansen', 'inburgeringsexamen-a2-uitleg'],

  ctaTitle: 'Oefen voordat je betaalt',
  ctaDesc: 'Een gratis oefenexamen van tien vragen, met uitleg bij elk antwoord. Geen account nodig.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis oefenexamen',

  /* English and Arabic bodies, 20-08-2026.
   *
   * Two things carry over unchanged into both: the volatility phrasing on every fee ("at the time
   * of writing" / "في وقت كتابة هذا النص") and `MODULE_PRICE`, which is still read from
   * `lib/pricing.ts` rather than retyped per locale. A stale euro figure is a false price claim in
   * any language, and three copies of it is three places to forget. */
  translations: {
    en: {
      title: 'What does inburgering cost? Every fee in one place',
      breadcrumb: 'What does it cost?',
      dateLabel: '20 August 2026',
      eyebrow: 'Costs',
      heroTitle: 'What does inburgering cost?',
      heroSubtitle:
        'It depends on your situation. For some people the municipality pays almost everything; others pay for the course and the exams themselves. Here is what goes where.',
      description:
        'What do you pay for your integration? The price per exam, when it is free, borrowing from DUO, and what changed about the fines back in 2025.',
      articleHtml: `
<h2 id="is-het-gratis">Is it free for me?</h2>

<p>There are broadly two situations. Find yours.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>You are an asylum status holder</h3>
      <p class="compare-when">Under the Wet inburgering 2021</p>
    </div>
    <div class="compare-rows">
      ${row('Course', 'Your municipality usually pays for it.')}
      ${row('Exams', 'The first 2 attempts at each compulsory exam are free.')}
      ${row('Watch out', 'Those 2 free attempts lapse if you sit an exam at a lower level than your PIP states.')}
      ${row('Borrowing from DUO', 'Not needed, and not possible.')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>You are another integrator</h3>
      <p class="compare-when">A family migrant, for example</p>
    </div>
    <div class="compare-rows">
      ${row('Course', 'You usually pay for it yourself.')}
      ${row('Exams', 'You pay yourself: at the time of writing €50 per part.')}
      ${row('Watch out', 'If you do not turn up, you pay for the exam again.')}
      ${row('Borrowing from DUO', 'Possible under conditions, for the course and the exams.')}
    </div>
  </div>
</div>

${factIn('en', 'The first 2 attempts at each exam are free for asylum status holders — but not if you sit an exam at a lower level than your PIP states. If you need more than 2 attempts you pay for them yourself, and you cannot borrow from DUO for those.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="prijs-per-examen">What does an exam cost?</h2>

<p>The price is the same for <strong>A2 and B1</strong>. You pay per part, per attempt.</p>

<div class="price-list">
  ${price(I_BOOK, 'Reading', 'Read texts and answer questions', '€50')}
  ${price(I_HEADPHONES, 'Listening', 'Understand conversations and fragments', '€50')}
  ${price(I_PEN, 'Writing', 'Short texts and forms', '€50')}
  ${price(I_MIC, 'Speaking', 'Record your answers at the computer', '€50')}
  ${price(I_LANDMARK, 'KNM', 'Knowledge of Dutch society', '€50')}
  <div class="price-row is-total">
    <span class="price-icon">${I_EURO}</span>
    <span class="price-name">All 5 together<span>Under the Wet inburgering 2021</span></span>
    <span class="price-amount">€250</span>
  </div>
</div>

<p>Do you fall under the <strong>Wet inburgering 2013</strong>? Then ONA is added, at the time of
writing €40. That makes €290. You do not always have to sit every part, by the way: which exams
you have to take depends on your learning route and on the act that applies to you. <strong>Mijn
Inburgering</strong> holds your own list.</p>

${factIn('en', 'At the time of writing each exam part costs €50 (Reading, Listening, Writing, Speaking and KNM), €250 together. ONA costs €40 and applies only under the 2013 act. These amounts are index-linked — check the current price with DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="afzeggen">Cannot make it? Cancel in time</h2>

<p>Move or cancel your exam in Mijn Inburgering, <strong>at least 7 days in advance</strong>. Do it
in time and you get your money back — and if it was a free attempt, that free attempt stays. Simply
not turning up means paying again.</p>

${figure(
  'explainer-afzeggen-week', 1400, 616,
  'A timeline running to exam day, with a line one week before it: up to that line you can still cancel, after it you cannot.',
  'There is a line one week before your exam. Cancel before that line and you get your money back. After it you do not, not even if you are ill.',
)}

${factIn('en', 'You can move or cancel an exam up to 7 days in advance. Anyone who cancels later or does not turn up does not get the exam fee back.', 'DUO — Examenreglement inburgering', SRC_REGLEMENT, CHECKED)}

${docentIn('en', 'I genuinely see this go wrong a few times a year: somebody falls ill, does nothing, and pays fifty euros for an exam they never sat. Two clicks in Mijn Inburgering and that would not have happened. Sort it out the moment you have doubts — you can always pick a new date.')}

<h2 id="lenen">Borrowing from DUO</h2>

<p>Paying for your integration yourself? Then you can borrow from DUO under conditions. You apply
through Mijn Inburgering.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">The loan does cover</p>
    <ul>
      <li>${I_CHECK}<span>A Dutch course at A2, B1 or B2</span></li>
      <li>${I_CHECK}<span>A literacy course</span></li>
      <li>${I_CHECK}<span>Exams at a recognised institution</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">It does not cover</p>
    <ul>
      <li>${I_X}<span>A laptop, books, food or travel</span></li>
      <li>${I_X}<span>Extra exam attempts after the first two</span></li>
      <li>${I_X}<span>A school without a quality mark — check zoekinburgerschool.nl first</span></li>
    </ul>
  </div>
</div>

<p>The money <strong>does not reach your account</strong>: DUO pays your school or your exam
directly. And you repay the loan later, with interest.</p>

${factIn('en', 'Asylum status holders cannot borrow from DUO, because their municipality pays for their course. Others borrow for a course and exams at a recognised institution; DUO pays the school directly.', 'inburgeren.nl — Lenen bij DUO', SRC_LENEN, CHECKED)}

<h2 id="boete">Will I be fined if I do not manage it?</h2>

<p>Something important changed here in 2025.</p>

<div class="verdict ok">
  <p class="verdict-answer">Asylum status holders are never fined</p>
  <p>The Netherlands' highest administrative court, the Raad van State, ruled on 9 July 2025 that
  DUO may not fine asylum status holders for taking too long over their integration. DUO may not
  reclaim a loan either. You do not have to do anything about it yourself.</p>
</div>

<p>Are you <strong>not</strong> an asylum status holder — because you came to the Netherlands for
your partner or family, for instance? Then you can still be fined if you do not finish in time and
have no right to extra time. A fine is not the end of the road: DUO also gives you <strong>extra
time</strong> to finish your integration. These are the maximum amounts:</p>

<div class="price-list">
  ${price(I_CLIPBOARD, 'Learning route not completed', 'Wet inburgering 2021', 'max. €1,000')}
  ${price(I_CLIPBOARD, 'PVT not completed', 'Wet inburgering 2021', '€340')}
  ${price(I_CLIPBOARD, 'MAP not completed', 'Wet inburgering 2021', '€340')}
  ${price(I_CLIPBOARD, 'No integration diploma', 'Wet inburgering 2013', 'max. €1,250')}
  ${price(I_CLIPBOARD, 'PVT not completed', 'Wet inburgering 2013', '€340')}
</div>

${factTwoIn('en', 'On 9 July 2025 the Raad van State ruled that the ministry may not impose a fine on an asylum status holder, nor require repayment of their loan; DUO had already paused that in February 2025. For other integrators the 2021 act sets a maximum of €1,000 for the learning route and €340 each for PVT and MAP, and the 2013 act a maximum of €1,250 for the diploma and €340 for PVT. After a fine you are given extra time to integrate after all.', [['Rijksoverheid — Uitspraak Raad van State', SRC_RVS], ['inburgeren.nl — Boete', SRC_BOETE]], CHECKED)}

<h2 id="oefenen">Practising is cheaper than resitting</h2>

<p>One resit costs you €50 at the time of writing. Redoing four parts twice is €400 — plus the
months it costs you.</p>

${inlineCta(`One month of practice costs ${MODULE_PRICE}`, 'Less than a single resit at DUO. Ten full practice exams per skill, with explanations.', '/premium', 'See the modules')}

<p>Want to see whether it suits you first? Start with a free practice exam. Ten questions, an
explanation after every answer, no account needed.</p>
`,
      sidebarHtml: `
<p><strong>In short</strong></p>
<ul>
  <li>Asylum status holder: the municipality pays the course, and 2 attempts per exam are free.</li>
  <li>Other integrators pay themselves: at the time of writing €50 per part, €250 for all five.</li>
  <li>Cancelling is possible up to 7 days in advance, with a refund.</li>
  <li>Borrowing from DUO is possible, but not for extra attempts.</li>
  <li>Asylum status holders have never been fined since 2025.</li>
</ul>`,
      ctaTitle: 'Practise before you pay',
      ctaDesc: 'A free practice exam of ten questions, with an explanation after every answer. No account needed.',
      ctaLabel: 'Start a free practice exam',
      faq: [
        {
          q: 'What does the integration exam cost?',
          a: 'At the time of writing €50 per part — Reading, Listening, Writing, Speaking and KNM — so €250 for all five. Under the 2013 act ONA is added at €40. The price is the same for A2 and B1 and is index-linked, so check it with DUO.',
        },
        {
          q: 'Is integration free for asylum status holders?',
          a: 'Largely. The municipality usually pays for the course, and the first 2 attempts at each compulsory exam are free. Those free attempts do lapse if you sit an exam at a lower level than your PIP states.',
        },
        {
          q: 'Can I borrow money for my integration?',
          a: 'Yes, under conditions, through Mijn Inburgering. The loan is for a course at a recognised school and for exams — not for a laptop, books or travel, and not for extra exam attempts. You do not receive the money yourself: DUO pays the school. Asylum status holders cannot borrow, because their municipality pays for their course.',
        },
        {
          q: 'Will I be fined if I do not integrate in time?',
          a: 'If you are an asylum status holder, no: on 9 July 2025 the Raad van State ruled that DUO may not fine you and may not reclaim your loan. Other integrators can be fined — a maximum of €1,000 for the learning route under the 2021 act, and €340 for PVT or MAP. You are then also given extra time.',
        },
        {
          q: 'Do I get my money back if I cannot attend the exam?',
          a: 'Yes, if you cancel or move your exam in Mijn Inburgering at least 7 days in advance. If it was a free attempt, that attempt stays. Cancel later or fail to turn up and you lose the exam fee.',
        },
      ],
    },

    ar: {
      title: 'كم تكلّف عملية الاندماج؟ كل التكاليف في مكان واحد',
      breadcrumb: 'كم يكلّف؟',
      dateLabel: '٢٠ أغسطس ٢٠٢٦',
      eyebrow: 'التكاليف',
      heroTitle: 'كم تكلّف عملية الاندماج؟',
      heroSubtitle:
        'يعتمد ذلك على وضعك. فالبلدية تدفع للبعض كل شيء تقريبًا، بينما يدفع آخرون تكاليف الدورة والامتحانات بأنفسهم. إليك ما تدفعه وأين.',
      description:
        'ماذا تدفع مقابل اندماجك في هولندا؟ سعر كل جزء من الامتحان، ومتى يكون مجانيًا، وكيف تقترض من DUO، وما الذي تغيّر بشأن الغرامات منذ عام ٢٠٢٥ للاجئين.',
      articleHtml: `
<h2 id="is-het-gratis">هل هو مجاني بالنسبة لي؟</h2>

<p>هناك حالتان بشكل عام. ابحث عن حالتك.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>أنت حاصل على حق اللجوء</h3>
      <p class="compare-when">في ظل Wet inburgering 2021</p>
    </div>
    <div class="compare-rows">
      ${row('الدورة', 'البلدية تدفع تكلفتها عادةً.')}
      ${row('الامتحانات', 'أول محاولتين لكل امتحان إلزامي مجانيتان.')}
      ${row('انتبه', 'تسقط هاتان المحاولتان المجانيتان إذا أدّيت امتحانًا بمستوى أدنى مما ورد في الـPIP.')}
      ${row('الاقتراض من DUO', 'غير لازم وغير ممكن.')}
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>أنت مندمج من فئة أخرى</h3>
      <p class="compare-when">مهاجر لَمّ شمل مثلًا</p>
    </div>
    <div class="compare-rows">
      ${row('الدورة', 'تدفع تكلفتها بنفسك عادةً.')}
      ${row('الامتحانات', 'تدفعها بنفسك: ‏€50 لكل جزء في وقت كتابة هذا النص.')}
      ${row('انتبه', 'إذا لم تحضر، تدفع ثمن الامتحان من جديد.')}
      ${row('الاقتراض من DUO', 'ممكن ضمن شروط، للدورة والامتحانات.')}
    </div>
  </div>
</div>

${factIn('ar', 'أول محاولتين لكل امتحان مجانيتان للحاصلين على حق اللجوء — لكن ليس إذا أدّيت الامتحان بمستوى أدنى مما ورد في الـPIP. وإذا احتجت إلى أكثر من محاولتين فستدفع تكلفتهما بنفسك، ولا يمكنك الاقتراض من DUO لأجلهما.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="prijs-per-examen">كم يكلّف الامتحان؟</h2>

<p>السعر نفسه لمستويَي <strong>A2 وB1</strong>. وتدفع لكل جزء ولكل محاولة.</p>

<div class="price-list">
  ${price(I_BOOK, 'القراءة', 'قراءة نصوص والإجابة عن أسئلة', '€50')}
  ${price(I_HEADPHONES, 'الاستماع', 'فهم المحادثات والمقاطع الصوتية', '€50')}
  ${price(I_PEN, 'الكتابة', 'نصوص قصيرة ونماذج', '€50')}
  ${price(I_MIC, 'المحادثة', 'تسجيل إجاباتك أمام الحاسوب', '€50')}
  ${price(I_LANDMARK, 'KNM', 'المعرفة بالمجتمع الهولندي', '€50')}
  <div class="price-row is-total">
    <span class="price-icon">${I_EURO}</span>
    <span class="price-name">الخمسة معًا<span>في ظل Wet inburgering 2021</span></span>
    <span class="price-amount">€250</span>
  </div>
</div>

<p>هل تخضع لقانون <strong>Wet inburgering 2013</strong>؟ عندها يُضاف امتحان ONA، وتكلفته
‏€40 في وقت كتابة هذا النص. أي ‏€290 في المجموع. ولست مضطرًا دائمًا لأداء جميع الأجزاء: فالامتحانات
المطلوبة منك تعتمد على مسارك التعليمي وعلى القانون الذي ينطبق عليك، وقائمتك الخاصة موجودة في
<strong>Mijn Inburgering</strong>.</p>

${factIn('ar', 'في وقت كتابة هذا النص يكلّف كل جزء من الامتحان ‏€50 (القراءة والاستماع والكتابة والمحادثة وKNM)، أي ‏€250 معًا. ويكلّف ONA ‏€40 وينطبق في ظل قانون ٢٠١٣ فقط. وهذه المبالغ مرتبطة بمؤشر الأسعار — تحقّق من السعر الحالي لدى DUO.', 'inburgeren.nl — Inburgeren betalen', SRC_KOSTEN, CHECKED)}

<h2 id="afzeggen">لا تستطيع الحضور؟ ألغِ الموعد في الوقت المناسب</h2>

<p>غيّر موعد امتحانك أو ألغِه عبر Mijn Inburgering، <strong>قبل ٧ أيام على الأقل</strong>. إذا فعلت
ذلك في الوقت المناسب تسترد أموالك — وإن كانت محاولة مجانية، فإنها تبقى لك. أما عدم الحضور ببساطة
فيعني الدفع من جديد.</p>

${figure(
  'explainer-afzeggen-week', 1400, 616,
  'خط زمني يمتد إلى يوم الامتحان، وفيه خط قبله بأسبوع: حتى ذلك الخط يمكنك الإلغاء، وبعده لا يمكنك.',
  'هناك خط قبل امتحانك بأسبوع. إذا ألغيت قبل ذلك الخط تسترد أموالك، وبعده لا تستردها، ولا حتى إذا كنت مريضًا.',
)}

${factIn('ar', 'يمكنك تغيير موعد الامتحان أو إلغاؤه حتى ٧ أيام قبله. ومن يلغي بعد ذلك أو لا يحضر لا يسترد رسوم الامتحان.', 'DUO — Examenreglement inburgering', SRC_REGLEMENT, CHECKED)}

${docentIn('ar', 'أرى هذا يحدث فعلًا بضع مرات كل عام: شخص يمرض فلا يفعل شيئًا، ثم يدفع خمسين يورو مقابل امتحان لم يؤدّه. نقرتان في Mijn Inburgering وكان الأمر سيُحلّ. رتّب الأمر فور شعورك بالشك — يمكنك دائمًا اختيار موعد جديد.')}

<h2 id="lenen">الاقتراض من DUO</h2>

<p>هل تدفع تكاليف اندماجك بنفسك؟ عندها يمكنك الاقتراض من DUO ضمن شروط. وتتقدّم بالطلب عبر
Mijn Inburgering.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">يغطّي القرض</p>
    <ul>
      <li>${I_CHECK}<span>دورة هولندية على مستوى A2 أو B1 أو B2</span></li>
      <li>${I_CHECK}<span>دورة محو الأمية</span></li>
      <li>${I_CHECK}<span>الامتحانات لدى مؤسسة معتمدة</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">لا يغطّي</p>
    <ul>
      <li>${I_X}<span>حاسوبًا محمولًا أو كتبًا أو طعامًا أو مواصلات</span></li>
      <li>${I_X}<span>محاولات امتحان إضافية بعد الأوليين</span></li>
      <li>${I_X}<span>مدرسة بلا علامة جودة — تحقّق أولًا عبر zoekinburgerschool.nl</span></li>
    </ul>
  </div>
</div>

<p>المبلغ <strong>لا يصل إلى حسابك</strong>: فـDUO تدفع لمدرستك أو لامتحانك مباشرةً. وتسدّد القرض
لاحقًا مع فوائد.</p>

${factIn('ar', 'لا يمكن للحاصلين على حق اللجوء الاقتراض من DUO، لأن البلدية تدفع تكلفة دورتهم. أما غيرهم فيقترضون لدورة وامتحانات لدى مؤسسة معتمدة، وتدفع DUO للمدرسة مباشرةً.', 'inburgeren.nl — Lenen bij DUO', SRC_LENEN, CHECKED)}

<h2 id="boete">هل سأُغرَّم إذا لم أنجح؟</h2>

<p>حدث هنا تغيير مهم في عام ٢٠٢٥.</p>

<div class="verdict ok">
  <p class="verdict-answer">الحاصلون على حق اللجوء لا يُغرَّمون أبدًا</p>
  <p>قضت أعلى محكمة إدارية في هولندا، مجلس الدولة (Raad van State)، في ٩ يوليو ٢٠٢٥ بأنه لا يجوز
  لـDUO تغريم الحاصلين على حق اللجوء بسبب تأخّرهم في الاندماج. ولا يجوز لها أيضًا استرداد القرض.
  ولست مضطرًا لفعل أي شيء بنفسك بهذا الشأن.</p>
</div>

<p>وهل أنت <strong>لست</strong> حاصلًا على حق اللجوء — لأنك قدمت إلى هولندا من أجل شريكك أو
عائلتك مثلًا؟ عندها قد تُغرَّم إن لم تُنهِ اندماجك في الوقت المحدّد ولم يكن لك حق في وقت إضافي.
والغرامة ليست نهاية المطاف: فـDUO تمنحك معها <strong>وقتًا إضافيًا</strong> لإكمال اندماجك.
وهذه هي المبالغ القصوى:</p>

<div class="price-list">
  ${price(I_CLIPBOARD, 'عدم إكمال المسار التعليمي', 'Wet inburgering 2021', 'بحد أقصى €1.000')}
  ${price(I_CLIPBOARD, 'عدم إكمال PVT', 'Wet inburgering 2021', '€340')}
  ${price(I_CLIPBOARD, 'عدم إكمال MAP', 'Wet inburgering 2021', '€340')}
  ${price(I_CLIPBOARD, 'عدم الحصول على شهادة الاندماج', 'Wet inburgering 2013', 'بحد أقصى €1.250')}
  ${price(I_CLIPBOARD, 'عدم إكمال PVT', 'Wet inburgering 2013', '€340')}
</div>

${factTwoIn('ar', 'قضى مجلس الدولة في ٩ يوليو ٢٠٢٥ بأنه لا يجوز للوزارة فرض غرامة على حاصل على حق اللجوء ولا مطالبته بسداد قرضه، وكانت DUO قد أوقفت ذلك بالفعل في فبراير ٢٠٢٥. أما سائر المندمجين فيحدّد قانون ٢٠٢١ سقفًا قدره ‏€1.000 للمسار التعليمي و‏€340 لكل من PVT وMAP، ويحدّد قانون ٢٠١٣ سقفًا قدره ‏€1.250 للشهادة و‏€340 لـPVT. وبعد الغرامة يُمنح المعني وقتًا إضافيًا لإتمام اندماجه.', [['Rijksoverheid — Uitspraak Raad van State', SRC_RVS], ['inburgeren.nl — Boete', SRC_BOETE]], CHECKED)}

<h2 id="oefenen">التدريب أرخص من إعادة الامتحان</h2>

<p>إعادة امتحان واحد تكلّفك ‏€50 في وقت كتابة هذا النص. وإعادة أربعة أجزاء مرتين تعني ‏€400 —
إضافةً إلى الأشهر التي تضيع منك.</p>

${inlineCta(`شهر واحد من التدريب يكلّف ${MODULE_PRICE}`, 'أقل من إعادة امتحان واحد لدى DUO. عشرة امتحانات تجريبية كاملة لكل مهارة، مع الشرح.', '/premium', 'اطّلع على الباقات')}

<p>هل تريد أولًا معرفة ما إذا كان هذا يناسبك؟ ابدأ بامتحان تجريبي مجاني. عشرة أسئلة، وشرح بعد كل
إجابة، وبدون حساب.</p>
`,
      sidebarHtml: `
<p><strong>باختصار</strong></p>
<ul>
  <li>حاصل على حق اللجوء: البلدية تدفع الدورة، ومحاولتان لكل امتحان مجانيتان.</li>
  <li>سائر المندمجين يدفعون بأنفسهم: ‏€50 لكل جزء و‏€250 للخمسة في وقت كتابة هذا النص.</li>
  <li>الإلغاء ممكن حتى ٧ أيام قبل الموعد، مع استرداد المبلغ.</li>
  <li>الاقتراض من DUO ممكن، لكن ليس للمحاولات الإضافية.</li>
  <li>الحاصلون على حق اللجوء لم يعودوا يُغرَّمون منذ ٢٠٢٥.</li>
</ul>`,
      ctaTitle: 'تدرّب قبل أن تدفع',
      ctaDesc: 'امتحان تجريبي مجاني من عشرة أسئلة، مع شرح بعد كل إجابة. بدون حساب.',
      ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
      faq: [
        {
          q: 'كم يكلّف امتحان الاندماج؟',
          a: 'في وقت كتابة هذا النص ‏€50 لكل جزء — القراءة والاستماع والكتابة والمحادثة وKNM — أي ‏€250 للخمسة. وفي ظل قانون ٢٠١٣ يُضاف ONA بمبلغ ‏€40. والسعر نفسه لمستويَي A2 وB1 وهو مرتبط بمؤشر الأسعار، لذا تحقّق منه لدى DUO.',
        },
        {
          q: 'هل الاندماج مجاني للحاصلين على حق اللجوء؟',
          a: 'إلى حدّ كبير. فالبلدية تدفع تكلفة الدورة عادةً، وأول محاولتين لكل امتحان إلزامي مجانيتان. لكن هاتين المحاولتين المجانيتين تسقطان إذا أدّيت الامتحان بمستوى أدنى مما ورد في الـPIP.',
        },
        {
          q: 'هل يمكنني اقتراض المال من أجل اندماجي؟',
          a: 'نعم، ضمن شروط، عبر Mijn Inburgering. والقرض مخصّص لدورة لدى مدرسة معتمدة وللامتحانات — لا لحاسوب محمول أو كتب أو مواصلات، ولا للمحاولات الإضافية. ولا تستلم المال بنفسك: DUO تدفع للمدرسة. أما الحاصلون على حق اللجوء فلا يمكنهم الاقتراض، لأن البلدية تدفع تكلفة دورتهم.',
        },
        {
          q: 'هل سأُغرَّم إذا لم أندمج في الوقت المحدّد؟',
          a: 'إن كنت حاصلًا على حق اللجوء فلا: قضى مجلس الدولة في ٩ يوليو ٢٠٢٥ بأنه لا يجوز لـDUO تغريمك ولا استرداد قرضك. أما سائر المندمجين فقد يُغرَّمون — بحد أقصى ‏€1.000 للمسار التعليمي في ظل قانون ٢٠٢١، و‏€340 لـPVT أو MAP. ويُمنحون عندها وقتًا إضافيًا أيضًا.',
        },
        {
          q: 'هل أسترد أموالي إذا لم أستطع حضور الامتحان؟',
          a: 'نعم، إذا ألغيت الامتحان أو غيّرت موعده عبر Mijn Inburgering قبل ٧ أيام على الأقل. وإن كانت محاولة مجانية فإنها تبقى لك. أما الإلغاء بعد ذلك أو عدم الحضور فيعني خسارة رسوم الامتحان.',
        },
      ],
    },
  },
};

export default guide;
