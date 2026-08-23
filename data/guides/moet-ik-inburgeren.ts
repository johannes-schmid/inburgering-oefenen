/**
 * Spoke 1 of the Inburgering cluster: "Moet ik inburgeren?"
 *
 * Owner manuscript "1. Moet ik inburgeren?" (20-08-2026), fact-checked against `SEO/facts.md`
 * §10 the same day. Three corrections the manuscript needed, all of them the pillar had already
 * hit and all of them recorded in §10:
 *
 *  - **"praktijkonderwijs" is dropped.** The manuscript listed it as a diploma-vrijstelling; it
 *    appears on no official DUO list. So does mbo-1/entree, which gives no full vrijstelling.
 *    The published list is exactly vmbo / havo / vwo / mbo 2+ / Dutch-language hbo or wo.
 *  - **"minder dan acht jaar Nederlands onderwijs" is inverted.** Rijksoverheid states the
 *    *exemption* — 8 years or more in the Netherlands while leerplichtig — not a threshold that
 *    creates a plicht for 16- and 17-year-olds. Written as the exemption.
 *  - **Pensioengerechtigde leeftijd was missing** from the manuscript's "hoeft niet" list.
 *
 * **Shortened and re-sequenced on 21-08-2026 (owner instruction).** The page was four screens of
 * reading; it is now five blocks — wat is het, wie moet het, welke wet — and every one of them is
 * a visual. What was cut and why:
 *
 *  - **The six-item `<details>` picker is gone.** Every branch of it restated a line the
 *    yes/no grid directly above already made, so a reader who understood the grid clicked
 *    through six panels to learn nothing, and a reader who did not was handed the same
 *    sentence twice. The grid is the answer; the picker was its own echo.
 *  - **The vrijstelling-versus-ontheffing comparison is gone from the body and lives on in the
 *    FAQ.** It is a second, rarer question, and it was pushing the far more common "which law
 *    applies to me?" below the fold. The €225 figure went with it rather than being restated
 *    without its source.
 *  - **A compact two-law table was added**, which is new ground for this page. It is a
 *    signpost, not a treatment: four rows and no advice. `welke-wet-en-welke-route` still owns
 *    the subject and `related` hands the reader over — two pages answering "welke wet geldt
 *    voor mij?" in full is the duplicate this repo keeps warning about.
 *
 * `reviewedOn` deliberately stays 20-08-2026: the shortening moved and cut her reviewed prose but
 * introduced no new claim she has not seen — the two-law table is the owner's own text and every
 * figure in it is carried by the Rijksoverheid fact box beside it. If a later edit adds a claim,
 * the date moves.
 *
 * There is deliberately **no `<a>` to another guide inside the body.** Guide bodies are raw HTML
 * strings with no locale context, so a hand-written `/inburgering/...` href is right in Dutch and
 * a 404-shaped wrong link in `en`/`ar`. Cross-guide navigation is `related`, which is localised
 * for free.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_BOOK, I_CHECK, I_LANDMARK, I_X,
  docent, docentIn, note, inlineCta, factIn, factTwo, factTwoIn, figure, figureSplit,
} from './kit';

const SRC_PLICHT = 'https://www.rijksoverheid.nl/onderwerpen/immigratie-naar-nederland/vraag-en-antwoord/moet-ik-als-nieuwkomer-inburgeren';
const SRC_DIPLOMA = 'https://www.inburgeren.nl/minder-of-geen-examens/diploma-gehaald.jsp';
const SRC_BRIEF = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
const SRC_NIEUWE_WET = 'https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering';
const CHECKED = '20-08-2026';

const guide: Guide = {
  slug: 'moet-ik-inburgeren',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-20',
  pillar: false,
  coverGlyph: 'fork',

  title: 'Moet ik inburgeren? Check je situatie',
  description:
    'Niet iedereen moet inburgeren. Check in één minuut of de inburgeringsplicht voor jou geldt, wanneer je vrijstelling krijgt en welke wet voor jou geldt.',

  datePublished: '2026-08-20',
  dateModified: '2026-08-21',
  dateLabel: '21 augustus 2026',
  breadcrumb: 'Moet ik inburgeren?',
  eyebrow: 'Inburgeringsplicht',

  heroTitle: 'Moet ik inburgeren?',
  heroSubtitle:
    'Niet iedereen die naar Nederland komt, hoeft in te burgeren. Het hangt af van je nationaliteit en van waarom je hier bent. Check hieronder jouw situatie.',
  heroImage: {
    base: 'moet-ik-inburgeren',
    hasWebp: true,
    alt: 'Iemand haalt een brief uit een envelop op een houten tafel',
    position: 'center 40%',
    credit: 'Angela Roma (Pexels)',
  },
  readingMinutes: 3,

  articleHtml: `
<h2 id="wat-is-inburgeren">Wat is inburgeren?</h2>

<p>Inburgeren betekent dat je leert hoe je kunt meedoen in de Nederlandse samenleving. De overheid
verwacht daarbij vooral twee dingen van je.</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_BOOK}</div>
    <h3>Je leert Nederlands</h3>
    <p>Zodat je kunt werken, naar de dokter kunt gaan en met de school van je kinderen kunt
    praten.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_LANDMARK}</div>
    <h3>Je leert hoe Nederland werkt</h3>
    <p>Hoe je werk zoekt, hoe de zorgverzekering werkt, en welke regels en waarden hier belangrijk
    zijn.</p>
  </div>
</div>

<p>Heb je het inburgeringstraject afgerond, dan krijg je een <strong>inburgeringsdiploma</strong>.
Dat diploma heb je vaak nodig als je later een permanente verblijfsvergunning wilt aanvragen of
Nederlander wilt worden. Inburgeren gaat dus niet over hoe slim je bent. Het gaat erom dat je de
taal leert en dat je jezelf kunt redden in Nederland.</p>

${figure(
  'explainer-wat-is-inburgeren', 1484, 932,
  'Twee onderdelen — de taal en kennis van hoe Nederland werkt — komen samen in één diploma, en dat diploma opent de deur naar een verblijfsvergunning voor onbepaalde tijd of naturalisatie.',
  'Inburgeren bestaat uit twee dingen die samenkomen in één diploma. Met dat diploma kun je een verblijfsvergunning voor onbepaalde tijd aanvragen, of Nederlander worden.',
)}

<h2 id="wie-moet-inburgeren">Wie moet inburgeren?</h2>

<p>Niet iedereen die naar Nederland komt, hoeft in te burgeren. Het hangt vooral af van twee
dingen: je nationaliteit, en waarom je naar Nederland komt.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Meestal wél inburgeren</p>
    <ul>
      <li>${I_CHECK}<span><strong>Asielstatushouder</strong> — je hebt na een asielaanvraag een verblijfsvergunning gekregen</span></li>
      <li>${I_CHECK}<span><strong>Gezinsmigrant</strong> — je komt bij je partner of familie in Nederland wonen</span></li>
      <li>${I_CHECK}<span>Je hebt om een <strong>andere reden</strong> een verblijfsvergunning gekregen en je komt van buiten de EU</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Meestal níét inburgeren</p>
    <ul>
      <li>${I_X}<span>Je komt uit de <strong>EU</strong>, of uit Noorwegen, IJsland, Liechtenstein of Zwitserland</span></li>
      <li>${I_X}<span>Je bent <strong>tijdelijk</strong> in Nederland voor werk of studie</span></li>
      <li>${I_X}<span>Je bent <strong>jonger dan 18</strong> en nog leerplichtig of kwalificatieplichtig</span></li>
      <li>${I_X}<span>Je hebt de <strong>pensioenleeftijd</strong> al bereikt</span></li>
      <li>${I_X}<span>Je woonde <strong>8 jaar of langer</strong> in Nederland toen je leerplichtig was</span></li>
      <li>${I_X}<span>Je hebt een <strong>Nederlands diploma</strong>: vmbo, havo, vwo, mbo niveau 2 of hoger, of hbo of wo in het Nederlands</span></li>
    </ul>
  </div>
</div>

${factTwo(
  "Vrijgesteld zijn onder meer: mensen jonger dan 18, mensen boven de pensioengerechtigde leeftijd, mensen uit de EU/EER en Zwitserland, en wie hier tijdelijk is voor studie of werk. Diploma's die vrijstelling geven: vmbo, havo, vwo, mbo niveau 2 of hoger, en hbo of wo mits in het Nederlands gevolgd.",
  [['Rijksoverheid — Moet ik als nieuwkomer inburgeren?', SRC_PLICHT], ['inburgeren.nl — Diploma gehaald', SRC_DIPLOMA]],
  CHECKED,
)}

<h2 id="hoe-weet-ik-het">Hoe weet ik of het voor mij geldt?</h2>

<p>Je hoeft dit niet zelf uit te zoeken. DUO controleert het voor je, in drie stappen.</p>

${figure(
  'explainer-duo-stuurt-brief', 1484, 552,
  'Je inschrijving bij de gemeente gaat naar DUO, DUO controleert of je inburgeringsplichtig bent, en stuurt je daarover zelf een brief.',
  'Je hoeft niets aan te vragen. Je inschrijving bij de gemeente gaat naar DUO, DUO controleert het, en de brief komt naar jou toe.',
)}

<div class="guide-steps">
  <div class="guide-step">
    <div class="guide-step-num">1</div>
    <div class="guide-step-body">
      <h3>Je schrijft je in bij de gemeente</h3>
      <p>Je krijgt een BSN. Samen met je verblijfsvergunning is dat alles wat DUO nodig heeft.</p>
    </div>
  </div>
  <div class="guide-step">
    <div class="guide-step-num">2</div>
    <div class="guide-step-body">
      <h3>DUO controleert of je inburgeringsplichtig bent</h3>
      <p>Moet je inburgeren, dan krijgt DUO dat automatisch door. Je hoeft niets aan te vragen.</p>
    </div>
  </div>
  <div class="guide-step">
    <div class="guide-step-num">3</div>
    <div class="guide-step-body">
      <h3>Je krijgt een brief</h3>
      <p>Daarin staat vanaf welke datum je inburgeringsplichtig bent en hoeveel tijd je hebt.
      Bewaar die brief: de datum erin bepaalt straks alles. Geen brief gehad? Kijk dan in
      <strong>Mijn Inburgering</strong> met je DigiD.</p>
    </div>
  </div>
</div>

${docent('Wat ik het vaakst zie: mensen die maanden wachten omdat ze denken dat ze zelf iets moeten aanvragen. Dat hoeft niet. DUO stuurt je een brief. Bewaar die brief goed — de datum erin bepaalt straks alles, van je termijn tot welke wet voor jou geldt.')}

${fact('DUO bepaalt of je moet inburgeren en stuurt je daarover een brief zodra je een BSN en een verblijfsvergunning hebt en bent ingeschreven bij de gemeente.', 'inburgeren.nl — U gaat inburgeren', SRC_BRIEF, CHECKED)}

<h2 id="welke-wet">Welke wet geldt voor jou?</h2>

<p>Dit is belangrijk, want er zijn twee wetten die naast elkaar bestaan. Ze hebben andere regels,
andere kosten en andere examens. Kijk dus eerst in je brief van DUO welke wet voor jou geldt.</p>

${figure(
  'explainer-twee-wetten', 1400, 616,
  'Een tijdlijn met één streep erdoor op 1 januari 2022: wie daarvoor inburgeringsplichtig werd valt onder de oude wet, wie daarna onder de nieuwe.',
  'Eén datum bepaalt onder welke wet je valt. Kijk in je brief van DUO vanaf welke dag je inburgeringsplichtig bent, en zoek die dag hier op.',
  figureSplit(
    ['Wet inburgering 2013', 'Je werd vóór 1 januari 2022 inburgeringsplichtig.'],
    ['Wet inburgering 2021', 'Je werd op of na 1 januari 2022 inburgeringsplichtig. Dit geldt voor bijna iedereen die nu begint.'],
    'right',
  ),
)}

<div class="compare-2">
  <div class="compare-card">
    <div class="compare-head">
      <h3>Wet inburgering 2013</h3>
      <p class="compare-when">De oude wet</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">Voor wie</p>
        <p class="compare-val">Je was al inburgeringsplichtig vóór 1 januari 2022.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Wie regelt het</p>
        <p class="compare-val">Je regelt alles zelf.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Taalniveau</p>
        <p class="compare-val">A2</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Extra onderdelen</p>
        <p class="compare-val">ONA, PVT</p>
      </div>
    </div>
  </div>
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Wet inburgering 2021</h3>
      <p class="compare-when">Geldt voor bijna iedereen die nu begint</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">Voor wie</p>
        <p class="compare-val">Je werd inburgeringsplichtig op of ná 1 januari 2022.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Wie regelt het</p>
        <p class="compare-val">De gemeente begeleidt je.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Taalniveau</p>
        <p class="compare-val">Meestal B1</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Extra onderdelen</p>
        <p class="compare-val">KNM, MAP, PVT</p>
      </div>
    </div>
  </div>
</div>

${fact('De Wet inburgering 2021 geldt voor iedereen die op of na 1 januari 2022 inburgeringsplichtig werd; wie daarvoor al inburgeringsplichtig was, valt onder de Wet inburgering 2013.', 'Rijksoverheid — Nieuwe wet inburgering', SRC_NIEUWE_WET, CHECKED)}


<p>Weet je inmiddels dat je moet inburgeren? Dan is de volgende vraag welk taalniveau je nu al
haalt. Dat kun je vandaag uitzoeken, zonder iets te regelen.</p>

${inlineCta('Kijk vast waar je nu staat', 'Tien vragen per onderdeel, met uitleg bij elk antwoord. Geen account nodig.', '/oefenen', 'Gratis oefenexamen')}
`,
  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>Inburgeren is twee dingen: Nederlands leren en leren hoe Nederland werkt.</li>
  <li>DUO bepaalt of je moet inburgeren en stuurt je een brief — je hoeft niets uit te zoeken.</li>
  <li>EU, tijdelijk verblijf, nog leerplichtig of boven de pensioenleeftijd: meestal geen plicht.</li>
  <li>Een Nederlands diploma kan vrijstelling geven.</li>
  <li>De datum in je brief bepaalt of de Wet 2013 of de Wet 2021 voor je geldt.</li>
</ul>`,

  faq: [
    {
      q: 'Hoe weet ik of ik inburgeringsplichtig ben?',
      a: 'Je hoeft dat niet zelf uit te zoeken. DUO controleert het zodra je een verblijfsvergunning hebt en bent ingeschreven bij de gemeente, en stuurt je een brief. Twijfel je of je die brief hebt gemist? Log dan in op Mijn Inburgering met je DigiD.',
    },
    {
      q: 'Moet ik inburgeren als ik uit de EU kom?',
      a: 'Nee. Kom je uit een EU-land, uit Noorwegen, IJsland, Liechtenstein of Zwitserland, dan geldt de inburgeringsplicht niet voor jou. Wil je later Nederlander worden, dan gelden voor naturalisatie wel taal-eisen.',
    },
    {
      q: 'Welke diploma’s geven vrijstelling van inburgering?',
      a: 'Een Nederlands diploma van vmbo, havo, vwo of mbo niveau 2 of hoger, en een hbo- of wo-opleiding die je in het Nederlands hebt gevolgd. Nederlandstalige diploma’s uit België en Suriname tellen ook mee. Je vraagt de vrijstelling zelf aan bij DUO.',
    },
    {
      q: 'Wat is het verschil tussen vrijstelling en ontheffing?',
      a: 'Vrijstelling betekent dat je niet hoeft in te burgeren, bijvoorbeeld omdat je al een Nederlands diploma hebt. Ontheffing betekent dat je door een psychische of lichamelijke belemmering blijvend geen examen kunt doen. Voor een ontheffing onderzoekt een onafhankelijke arts je. Allebei vraag je aan bij DUO.',
    },
    {
      q: 'Moet ik inburgeren als ik 16 of 17 ben?',
      a: 'In de regel niet: de inburgeringsplicht geldt vanaf 18 jaar. Ben je jonger, dan val je onder de leerplicht of de kwalificatieplicht en ga je naar school. In sommige situaties kun je op die leeftijd toch inburgeringsplichtig zijn.',
    },
  ],

  related: ['welke-wet-en-welke-route', 'inburgering-stappenplan', 'wat-kost-inburgeren'],
  relatedPosts: ['taalniveaus-a1-a2-b1-nederlands', 'inburgeringsexamen-a2-uitleg'],

  ctaTitle: 'Weten hoe goed je Nederlands al is?',
  ctaDesc: 'Doe een gratis oefenexamen van tien vragen. Met uitleg bij elk antwoord, zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis oefenexamen',

  /* English and Arabic bodies, 20-08-2026, shortened alongside the Dutch on 21-08-2026.
   *
   * **Official Dutch terms are kept in Dutch**, glossed on first use: inburgering, DUO, PIP, KNM,
   * MAP, PVT, ONA, Mijn Inburgering, vrijstelling, ontheffing. The reader has to recognise these
   * words on a letter from DUO and in a government portal that has no English or Arabic version;
   * translating them away would make the guide easier to read and harder to use. The two acts keep
   * their Dutch names for the same reason. Source labels and URLs stay Dutch too — the page they
   * name is Dutch whichever locale links to it. */
  translations: {
    en: {
      title: 'Do I have to do inburgering? Check your situation',
      breadcrumb: 'Do I have to?',
      dateLabel: '21 August 2026',
      eyebrow: 'Integration duty',
      heroTitle: 'Do I have to do inburgering?',
      heroSubtitle:
        'Not everyone who moves to the Netherlands has to integrate. It depends on your nationality and on why you are here. Check your own situation below.',
      description:
        'Not everyone has to do inburgering. Check in one minute whether the duty applies to you, when you are exempt, and which integration act applies in your case.',
      articleHtml: `
<h2 id="wat-is-inburgeren">What is inburgering?</h2>

<p><em>Inburgering</em> — integration — means learning how to take part in Dutch society. The
government expects two things of you above all.</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_BOOK}</div>
    <h3>You learn Dutch</h3>
    <p>So that you can work, go to the doctor, and talk to your children's school.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_LANDMARK}</div>
    <h3>You learn how the Netherlands works</h3>
    <p>How to look for work, how health insurance works, and which rules and values matter here.</p>
  </div>
</div>

<p>Once you have completed the integration programme you receive an
<strong>inburgeringsdiploma</strong>. You often need that diploma later, if you want to apply for
permanent residence or become a Dutch citizen. So inburgering is not about how clever you are. It
is about learning the language and being able to manage on your own in the Netherlands.</p>

${figure(
  'explainer-wat-is-inburgeren', 1484, 932,
  'Two parts — the language, and knowing how the Netherlands works — come together in one diploma, and that diploma opens the door to permanent residence or naturalisation.',
  'Inburgering consists of two things that come together in one diploma. With that diploma you can apply for permanent residence, or become a Dutch citizen.',
)}

<h2 id="wie-moet-inburgeren">Who has to integrate?</h2>

<p>Not everyone who comes to the Netherlands has to. It mainly depends on two things: your
nationality, and why you came here.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">Usually you do</p>
    <ul>
      <li>${I_CHECK}<span><strong>Asylum status holder</strong> — you were granted a residence permit after an asylum application</span></li>
      <li>${I_CHECK}<span><strong>Family migrant</strong> — you are joining your partner or family in the Netherlands</span></li>
      <li>${I_CHECK}<span>You were granted a residence permit for <strong>another reason</strong> and you come from outside the EU</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">Usually you do not</p>
    <ul>
      <li>${I_X}<span>You are from the <strong>EU</strong>, or from Norway, Iceland, Liechtenstein or Switzerland</span></li>
      <li>${I_X}<span>You are in the Netherlands <strong>temporarily</strong> for work or study</span></li>
      <li>${I_X}<span>You are still of <strong>compulsory school age</strong> or under the qualification requirement</span></li>
      <li>${I_X}<span>You have already reached <strong>state pension age</strong></span></li>
      <li>${I_X}<span>You lived in the Netherlands for <strong>8 years or more</strong> while you were of compulsory school age</span></li>
      <li>${I_X}<span>You hold a <strong>Dutch diploma</strong> that grants exemption: vmbo, havo, vwo, mbo level 2 or higher, or hbo or university taught in Dutch</span></li>
    </ul>
  </div>
</div>

${factTwoIn(
  'en',
  "Exempt groups include: people under 18, people above state pension age, people from the EU/EEA and Switzerland, and anyone here temporarily to study or work. Diplomas that grant exemption: vmbo, havo, vwo, mbo level 2 or higher, and hbo or university degrees provided they were taught in Dutch.",
  [['Rijksoverheid — Moet ik als nieuwkomer inburgeren?', SRC_PLICHT], ['inburgeren.nl — Diploma gehaald', SRC_DIPLOMA]],
  CHECKED,
)}

<h2 id="hoe-weet-ik-het">How do I know whether it applies to me?</h2>

<p>You do not have to work this out yourself. DUO checks it for you, in three steps.</p>

${figure(
  'explainer-duo-stuurt-brief', 1484, 552,
  'Your registration with the municipality goes to DUO, DUO checks whether you are required to integrate, and sends you a letter about it.',
  'You do not have to apply for anything. Your registration with the municipality goes to DUO, DUO checks it, and the letter comes to you.',
)}

<div class="guide-steps">
  <div class="guide-step">
    <div class="guide-step-num">1</div>
    <div class="guide-step-body">
      <h3>You register with your municipality</h3>
      <p>You get a BSN. Together with your residence permit, that is all DUO needs.</p>
    </div>
  </div>
  <div class="guide-step">
    <div class="guide-step-num">2</div>
    <div class="guide-step-body">
      <h3>DUO checks whether you are required to integrate</h3>
      <p>If you are, DUO is informed automatically. You do not have to apply for anything.</p>
    </div>
  </div>
  <div class="guide-step">
    <div class="guide-step-num">3</div>
    <div class="guide-step-body">
      <h3>You get a letter</h3>
      <p>It says from which date you are <em>inburgeringsplichtig</em> — required to integrate —
      and how much time you have. Keep that letter: the date in it decides everything later. No
      letter? Then check <strong>Mijn Inburgering</strong> with your DigiD.</p>
    </div>
  </div>
</div>

${docentIn('en', 'What I see most often: people who wait months because they think they have to apply for something themselves. You do not. DUO sends you a letter. Keep that letter safe — the date in it decides everything later, from your deadline to which act applies to you.')}

${factIn('en', 'DUO decides whether you have to integrate and sends you a letter about it, once you have a BSN and a residence permit and are registered with your municipality.', 'inburgeren.nl — U gaat inburgeren', SRC_BRIEF, CHECKED)}

<h2 id="welke-wet">Which act applies to you?</h2>

<p>This matters, because two acts exist side by side. They have different rules, different costs
and different exams. So check your letter from DUO first to see which one applies to you.</p>

${figure(
  'explainer-twee-wetten', 1400, 616,
  'A timeline with one line through it on 1 January 2022: anyone whose duty started before it falls under the old act, anyone after it under the new one.',
  'One date decides which act applies to you. Check your letter from DUO for the day you became required to integrate, and find that day here.',
  figureSplit(
    ['Wet inburgering 2013', 'You became required to integrate before 1 January 2022.'],
    ['Wet inburgering 2021', 'You became required to integrate on or after 1 January 2022. This applies to almost everyone starting now.'],
    'right',
  ),
)}

<div class="compare-2">
  <div class="compare-card">
    <div class="compare-head">
      <h3>Wet inburgering 2013</h3>
      <p class="compare-when">The old act</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">Who</p>
        <p class="compare-val">You were already required to integrate before 1 January 2022.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Who arranges it</p>
        <p class="compare-val">You arrange everything yourself.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Language level</p>
        <p class="compare-val">A2</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Extra components</p>
        <p class="compare-val">ONA, PVT</p>
      </div>
    </div>
  </div>
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Wet inburgering 2021</h3>
      <p class="compare-when">Applies to almost everyone starting now</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">Who</p>
        <p class="compare-val">You became required to integrate on or after 1 January 2022.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Who arranges it</p>
        <p class="compare-val">Your municipality guides you.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Language level</p>
        <p class="compare-val">Usually B1</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Extra components</p>
        <p class="compare-val">KNM, MAP, PVT</p>
      </div>
    </div>
  </div>
</div>

${factIn('en', 'The Wet inburgering 2021 applies to everyone who became required to integrate on or after 1 January 2022; anyone already required to integrate before that date falls under the Wet inburgering 2013.', 'Rijksoverheid — Nieuwe wet inburgering', SRC_NIEUWE_WET, CHECKED)}

<p>So you now know whether you have to integrate. The next question is which language level you
already reach. You can find that out today, without arranging anything.</p>

${inlineCta('See where you stand right now', 'Ten questions per skill, with an explanation after every answer. No account needed.', '/oefenen', 'Free practice exam')}
`,
      sidebarHtml: `
<p><strong>In short</strong></p>
<ul>
  <li>Inburgering is two things: learning Dutch, and learning how the Netherlands works.</li>
  <li>DUO decides whether you have to integrate and sends you a letter — you do not have to work anything out.</li>
  <li>EU nationals, temporary stays, still at school or over pension age: usually no duty.</li>
  <li>A Dutch diploma can grant exemption.</li>
  <li>The date in your letter decides whether the 2013 or the 2021 act applies to you.</li>
</ul>`,
      ctaTitle: 'Want to know how good your Dutch already is?',
      ctaDesc: 'Take a free practice exam of ten questions, with an explanation after every answer. No account needed.',
      ctaLabel: 'Start a free practice exam',
      faq: [
        {
          q: 'How do I know whether I have to do inburgering?',
          a: 'You do not have to work it out yourself. DUO checks it as soon as you have a residence permit and are registered with your municipality, and sends you a letter. If you think you missed that letter, log in to Mijn Inburgering with your DigiD.',
        },
        {
          q: 'Do I have to integrate if I am from the EU?',
          a: 'No. If you come from an EU country, or from Norway, Iceland, Liechtenstein or Switzerland, the integration duty does not apply to you. If you want to become Dutch later, naturalisation does have language requirements.',
        },
        {
          q: 'Which diplomas grant exemption from inburgering?',
          a: 'A Dutch vmbo, havo, vwo or mbo level 2 or higher diploma, and a hbo or university degree taught in Dutch. Dutch-language diplomas from Belgium and Suriname count as well. You apply for the exemption yourself at DUO.',
        },
        {
          q: 'What is the difference between vrijstelling and ontheffing?',
          a: 'Vrijstelling means you do not have to integrate, for example because you already hold a Dutch diploma. Ontheffing means a psychological or physical impairment permanently prevents you from sitting the exams; for that an independent doctor examines you. You apply to DUO for both.',
        },
        {
          q: 'Do I have to integrate if I am 16 or 17?',
          a: 'As a rule no: the integration duty starts at 18. If you are younger you fall under compulsory education or the qualification requirement, and you go to school. In some situations you can be required to integrate at that age after all.',
        },
      ],
    },

    ar: {
      title: 'هل يجب عليّ الاندماج (inburgering)؟ تحقّق من وضعك',
      breadcrumb: 'هل يجب عليّ؟',
      dateLabel: '٢١ أغسطس ٢٠٢٦',
      eyebrow: 'واجب الاندماج',
      heroTitle: 'هل يجب عليّ الاندماج؟',
      heroSubtitle:
        'ليس كل من يأتي إلى هولندا ملزَمًا بالاندماج. الأمر يعتمد على جنسيتك وعلى سبب وجودك هنا. تحقّق من وضعك أدناه.',
      description:
        'ليس الجميع ملزَمين بالاندماج في هولندا. تحقّق خلال دقيقة مما إذا كان الالتزام ينطبق عليك، ومتى تحصل على إعفاء، وأي قانون اندماج ينطبق على حالتك.',
      articleHtml: `
<h2 id="wat-is-inburgeren">ما هو الاندماج (inburgering)؟</h2>

<p>الاندماج يعني أن تتعلّم كيف تشارك في المجتمع الهولندي. والحكومة تتوقّع منك أمرين بالأساس.</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_BOOK}</div>
    <h3>أن تتعلّم الهولندية</h3>
    <p>حتى تستطيع العمل، والذهاب إلى الطبيب، والتحدّث مع مدرسة أطفالك.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_LANDMARK}</div>
    <h3>أن تتعلّم كيف تعمل هولندا</h3>
    <p>كيف تبحث عن عمل، وكيف يعمل التأمين الصحي، وما القواعد والقيم المهمّة هنا.</p>
  </div>
</div>

<p>وعند إتمام مسار الاندماج تحصل على <strong>شهادة الاندماج</strong> (inburgeringsdiploma). وغالبًا
ما تحتاج هذه الشهادة لاحقًا إذا أردت التقدّم بطلب إقامة دائمة أو الحصول على الجنسية الهولندية.
فالاندماج إذن ليس مقياسًا لذكائك، بل المهم أن تتعلّم اللغة وأن تكون قادرًا على تدبّر أمورك في
هولندا.</p>

${figure(
  'explainer-wat-is-inburgeren', 1484, 932,
  'جزءان — اللغة، ومعرفة كيف تعمل هولندا — يتلاقيان في شهادة واحدة، وهذه الشهادة تفتح الباب إلى إقامة دائمة أو إلى التجنّس.',
  'الاندماج يتكوّن من أمرين يتلاقيان في شهادة واحدة. وبهذه الشهادة يمكنك التقدّم بطلب إقامة دائمة، أو الحصول على الجنسية الهولندية.',
)}

<h2 id="wie-moet-inburgeren">من عليه الاندماج؟</h2>

<p>ليس كل من يأتي إلى هولندا ملزَمًا بالاندماج. ويعتمد الأمر أساسًا على شيئين: جنسيتك، وسبب
قدومك إلى هولندا.</p>

<div class="yesno-grid">
  <div class="yesno-col yes">
    <p class="yesno-title">عادةً عليك الاندماج</p>
    <ul>
      <li>${I_CHECK}<span><strong>حاصل على حق اللجوء</strong> — مُنحت تصريح إقامة بعد طلب لجوء</span></li>
      <li>${I_CHECK}<span><strong>مهاجر لَمّ شمل</strong> — قدمت للعيش مع شريكك أو عائلتك في هولندا</span></li>
      <li>${I_CHECK}<span>حصلت على تصريح إقامة <strong>لسبب آخر</strong> وأنت من خارج الاتحاد الأوروبي</span></li>
    </ul>
  </div>
  <div class="yesno-col no">
    <p class="yesno-title">عادةً لا يجب عليك</p>
    <ul>
      <li>${I_X}<span>أنت من <strong>الاتحاد الأوروبي</strong>، أو من النرويج أو آيسلندا أو ليختنشتاين أو سويسرا</span></li>
      <li>${I_X}<span>وجودك في هولندا <strong>مؤقت</strong> بغرض العمل أو الدراسة</span></li>
      <li>${I_X}<span>ما زلت في سنّ <strong>التعليم الإلزامي</strong> أو تخضع لالتزام الحصول على مؤهل</span></li>
      <li>${I_X}<span>بلغت بالفعل <strong>سنّ التقاعد</strong></span></li>
      <li>${I_X}<span>عشت في هولندا <strong>٨ سنوات أو أكثر</strong> خلال سنّ التعليم الإلزامي</span></li>
      <li>${I_X}<span>لديك <strong>شهادة هولندية</strong> تمنحك إعفاءً: vmbo أو havo أو vwo أو mbo من المستوى ٢ فما فوق، أو hbo أو جامعة بالهولندية</span></li>
    </ul>
  </div>
</div>

${factTwoIn(
  'ar',
  'من بين المُعفَين: من هم دون ١٨ عامًا، ومن تجاوزوا سنّ التقاعد، ومواطنو الاتحاد الأوروبي والمنطقة الاقتصادية الأوروبية وسويسرا، ومن يقيمون مؤقتًا للدراسة أو العمل. والشهادات التي تمنح إعفاءً: vmbo وhavo وvwo وmbo من المستوى ٢ فما فوق، وشهادات hbo والجامعة بشرط أن تكون الدراسة بالهولندية.',
  [['Rijksoverheid — Moet ik als nieuwkomer inburgeren?', SRC_PLICHT], ['inburgeren.nl — Diploma gehaald', SRC_DIPLOMA]],
  CHECKED,
)}

<h2 id="hoe-weet-ik-het">كيف أعرف إن كان هذا ينطبق عليّ؟</h2>

<p>لست مضطرًا لمعرفة ذلك بنفسك. فمؤسسة DUO تتحقّق من الأمر نيابةً عنك، في ثلاث خطوات.</p>

${figure(
  'explainer-duo-stuurt-brief', 1484, 552,
  'تسجيلك لدى البلدية يُرسَل إلى DUO، وDUO تتحقّق مما إذا كنت ملزَمًا بالاندماج، وترسل إليك رسالة بذلك.',
  'لست مضطرًا للتقدّم بأي طلب. تسجيلك لدى البلدية يُرسَل إلى DUO، وDUO تتحقّق منه، والرسالة تأتي إليك.',
)}

<div class="guide-steps">
  <div class="guide-step">
    <div class="guide-step-num">١</div>
    <div class="guide-step-body">
      <h3>تسجّل نفسك لدى البلدية</h3>
      <p>تحصل على رقم BSN. وهو مع تصريح إقامتك كل ما تحتاجه DUO.</p>
    </div>
  </div>
  <div class="guide-step">
    <div class="guide-step-num">٢</div>
    <div class="guide-step-body">
      <h3>‏DUO تتحقّق مما إذا كنت ملزَمًا بالاندماج</h3>
      <p>إذا كان عليك الاندماج، تُبلَّغ DUO بذلك تلقائيًا. ولست مضطرًا للتقدّم بأي طلب.</p>
    </div>
  </div>
  <div class="guide-step">
    <div class="guide-step-num">٣</div>
    <div class="guide-step-body">
      <h3>تستلم رسالة</h3>
      <p>وفيها تاريخ بدء التزامك بالاندماج (inburgeringsplicht) والمدة المتاحة لك. احتفظ بهذه
      الرسالة: فالتاريخ المذكور فيها يحدّد كل شيء لاحقًا. لم تستلم رسالة؟ إذن راجع
      <strong>Mijn Inburgering</strong> باستخدام DigiD.</p>
    </div>
  </div>
</div>

${docentIn('ar', 'أكثر ما أراه: أشخاص ينتظرون شهورًا لأنهم يظنون أن عليهم التقدّم بطلب ما بأنفسهم. ليس عليكم ذلك. DUO ترسل إليكم رسالة. احتفظوا بها جيدًا — فالتاريخ المذكور فيها يحدّد كل شيء لاحقًا، من مدّتكم الزمنية إلى القانون الذي ينطبق عليكم.')}

${factIn('ar', 'تقرّر DUO ما إذا كان عليك الاندماج وترسل إليك رسالة بذلك، بمجرد حصولك على رقم BSN وتصريح إقامة وتسجيلك لدى البلدية.', 'inburgeren.nl — U gaat inburgeren', SRC_BRIEF, CHECKED)}

<h2 id="welke-wet">أي قانون ينطبق عليك؟</h2>

<p>هذا مهم، لأن هناك قانونين قائمين جنبًا إلى جنب. لهما قواعد مختلفة وتكاليف مختلفة وامتحانات
مختلفة. لذلك انظر أولًا في رسالة DUO لمعرفة أي قانون ينطبق عليك.</p>

${figure(
  'explainer-twee-wetten', 1400, 616,
  'خط زمني يقطعه خط واحد عند ١ يناير ٢٠٢٢: من أصبح ملزَمًا بالاندماج قبله يخضع للقانون القديم، ومن أصبح ملزَمًا بعده يخضع للجديد.',
  'تاريخ واحد يحدّد أي قانون ينطبق عليك. انظر في رسالتك من DUO لمعرفة اليوم الذي أصبحت فيه ملزَمًا بالاندماج، وابحث عن ذلك اليوم هنا.',
  figureSplit(
    ['Wet inburgering 2013', 'أصبحت ملزَمًا بالاندماج قبل ١ يناير ٢٠٢٢.'],
    ['Wet inburgering 2021', 'أصبحت ملزَمًا بالاندماج في ١ يناير ٢٠٢٢ أو بعده. وهذا ينطبق على جميع من يبدأون الآن تقريبًا.'],
    'right',
  ),
)}

<div class="compare-2">
  <div class="compare-card">
    <div class="compare-head">
      <h3>Wet inburgering 2013</h3>
      <p class="compare-when">القانون القديم</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">لمن</p>
        <p class="compare-val">كنت ملزَمًا بالاندماج بالفعل قبل ١ يناير ٢٠٢٢.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">من يتولّى الأمر</p>
        <p class="compare-val">تدبّر كل شيء بنفسك.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">المستوى اللغوي</p>
        <p class="compare-val">A2</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">مكوّنات إضافية</p>
        <p class="compare-val">ONA وPVT</p>
      </div>
    </div>
  </div>
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Wet inburgering 2021</h3>
      <p class="compare-when">ينطبق على معظم من يبدأون الآن</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">لمن</p>
        <p class="compare-val">أصبحت ملزَمًا بالاندماج في ١ يناير ٢٠٢٢ أو بعده.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">من يتولّى الأمر</p>
        <p class="compare-val">البلدية ترافقك.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">المستوى اللغوي</p>
        <p class="compare-val">غالبًا B1</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">مكوّنات إضافية</p>
        <p class="compare-val">KNM وMAP وPVT</p>
      </div>
    </div>
  </div>
</div>

${factIn('ar', 'ينطبق قانون Wet inburgering 2021 على كل من أصبح ملزَمًا بالاندماج في ١ يناير ٢٠٢٢ أو بعده؛ ومن كان ملزَمًا قبل ذلك التاريخ يخضع لقانون Wet inburgering 2013.', 'Rijksoverheid — Nieuwe wet inburgering', SRC_NIEUWE_WET, CHECKED)}

<p>هل عرفت الآن أن عليك الاندماج؟ إذن السؤال التالي هو أي مستوى لغوي تبلغه بالفعل. ويمكنك معرفة
ذلك اليوم، دون أن ترتّب أي شيء.</p>

${inlineCta('اعرف أين أنت الآن', 'عشرة أسئلة لكل مهارة، مع شرح بعد كل إجابة. بدون حساب.', '/oefenen', 'امتحان تجريبي مجاني')}
`,
      sidebarHtml: `
<p><strong>باختصار</strong></p>
<ul>
  <li>الاندماج شيئان: تعلّم الهولندية، وتعلّم كيف تعمل هولندا.</li>
  <li>‏DUO تقرّر وترسل لك رسالة — لست مضطرًا لمعرفة أي شيء بنفسك.</li>
  <li>مواطنو الاتحاد الأوروبي، والإقامة المؤقتة، ومن هم في سنّ المدرسة أو فوق سنّ التقاعد: عادةً بلا التزام.</li>
  <li>الشهادة الهولندية قد تمنح إعفاءً.</li>
  <li>التاريخ في رسالتك يحدّد ما إذا كان ينطبق عليك قانون ٢٠١٣ أو قانون ٢٠٢١.</li>
</ul>`,
      ctaTitle: 'هل تريد معرفة مستواك في الهولندية؟',
      ctaDesc: 'قم بامتحان تجريبي مجاني من عشرة أسئلة، مع شرح بعد كل إجابة. بدون حساب.',
      ctaLabel: 'ابدأ امتحانًا تجريبيًا مجانيًا',
      faq: [
        {
          q: 'كيف أعرف أنني ملزَم بالاندماج؟',
          a: 'لست مضطرًا لمعرفة ذلك بنفسك. تتحقّق DUO من الأمر بمجرد حصولك على تصريح إقامة وتسجيلك لدى البلدية، ثم ترسل إليك رسالة. وإذا كنت تظن أنك لم تستلم تلك الرسالة، سجّل الدخول إلى Mijn Inburgering باستخدام DigiD.',
        },
        {
          q: 'هل يجب عليّ الاندماج إذا كنت من الاتحاد الأوروبي؟',
          a: 'لا. إذا كنت من دولة في الاتحاد الأوروبي أو من النرويج أو آيسلندا أو ليختنشتاين أو سويسرا، فإن التزام الاندماج لا ينطبق عليك. أما إذا أردت لاحقًا الحصول على الجنسية الهولندية، فهناك شروط لغوية للتجنّس.',
        },
        {
          q: 'ما الشهادات التي تمنح إعفاءً من الاندماج؟',
          a: 'شهادة هولندية من نوع vmbo أو havo أو vwo أو mbo من المستوى ٢ فما فوق، وشهادة hbo أو جامعية دُرِست بالهولندية. والشهادات الناطقة بالهولندية من بلجيكا وسورينام تُحتسب أيضًا. وتتقدّم بطلب الإعفاء بنفسك إلى DUO.',
        },
        {
          q: 'ما الفرق بين vrijstelling وontheffing؟',
          a: 'الـvrijstelling يعني أنك غير ملزَم بالاندماج، مثلًا لأنك تحمل شهادة هولندية بالفعل. أما الـontheffing فيعني أن إعاقة نفسية أو جسدية تمنعك بشكل دائم من أداء الامتحانات، ويفحصك من أجله طبيب مستقل. وكلاهما تُطلَب من DUO.',
        },
        {
          q: 'هل يجب عليّ الاندماج إذا كان عمري ١٦ أو ١٧ عامًا؟',
          a: 'كقاعدة لا: يبدأ التزام الاندماج من سنّ ١٨. وإذا كنت أصغر فأنت تخضع للتعليم الإلزامي أو لالتزام الحصول على مؤهل، وتذهب إلى المدرسة. وفي بعض الحالات قد تكون ملزَمًا بالاندماج في هذا السنّ مع ذلك.',
        },
      ],
    },
  },
};

export default guide;
