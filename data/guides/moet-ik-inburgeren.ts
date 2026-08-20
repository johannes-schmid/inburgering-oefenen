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
 * The manuscript's §3 (welke wet) is deliberately **not** reproduced here. It is the whole
 * subject of `welke-wet-en-welke-route`, and two pages answering "welke wet geldt voor mij?" is
 * the duplicate this repo keeps warning about. This guide ends by handing the reader over.
 *
 * The picker is `<details>`, not JavaScript: a guide body is a raw HTML string with no React in
 * it, and the fallback — every situation visible as plain text — is the honest one anyway.
 */
import type { Guide } from './types';
import { fact } from './types';
import {
  I_BOOK, I_CAP, I_CHECK, I_MAIL, I_PLANE, I_USER, I_USERS, I_X,
  docent, docentIn, note, inlineCta, factIn,
} from './kit';

const SRC_PLICHT = 'https://www.rijksoverheid.nl/onderwerpen/immigratie-naar-nederland/vraag-en-antwoord/moet-ik-als-nieuwkomer-inburgeren';
const SRC_DIPLOMA = 'https://www.inburgeren.nl/minder-of-geen-examens/diploma-gehaald.jsp';
const SRC_BRIEF = 'https://www.inburgeren.nl/u-gaat-inburgeren/';
const SRC_ONTHEFFING = 'https://www.inburgeren.nl/minder-of-geen-examens/ziekte-of-handicap.jsp';
const CHECKED = '20-08-2026';

const pick = (icon: string, label: string, body: string) =>
  `<details><summary><span class="picker-icon">${icon}</span>${label}</summary><div class="picker-body">${body}</div></details>`;

const guide: Guide = {
  slug: 'moet-ik-inburgeren',
  section: 'inburgering',

  status: 'reviewed',
  reviewedBy: 'Marieke Schipper',
  reviewedOn: '2026-08-20',
  pillar: false,

  title: 'Moet ik inburgeren? Check je situatie',
  description:
    'Niet iedereen moet inburgeren. Check in één minuut of de inburgeringsplicht voor jou geldt, wanneer je vrijstelling krijgt en wat er in de brief van DUO staat.',

  datePublished: '2026-08-20',
  dateModified: '2026-08-20',
  dateLabel: '20 augustus 2026',
  breadcrumb: 'Moet ik inburgeren?',
  eyebrow: 'Inburgeringsplicht',

  heroTitle: 'Moet ik inburgeren?',
  heroSubtitle:
    'Niet iedereen die naar Nederland komt, hoeft in te burgeren. Het hangt af van je nationaliteit en van waarom je hier bent. Check hieronder jouw situatie.',
  readingMinutes: 4,

  articleHtml: `
<div class="verdict ok">
  <p class="verdict-answer">Je hoeft dit niet zelf uit te zoeken</p>
  <p>DUO controleert het voor je. Moet je inburgeren? Dan krijg je een brief. Daarin staat vanaf
  welke datum je inburgeringsplichtig bent en hoeveel tijd je hebt. Geen brief gehad? Dan geldt de
  plicht waarschijnlijk niet voor jou.</p>
</div>

${fact('DUO bepaalt of je moet inburgeren en stuurt je daarover een brief zodra je een BSN en een verblijfsvergunning hebt en bent ingeschreven bij de gemeente.', 'inburgeren.nl — U gaat inburgeren', SRC_BRIEF, CHECKED)}

<h2 id="wie-wel-wie-niet">Wie moet wel, wie niet?</h2>

<p>Het hangt vooral af van twee dingen: je nationaliteit, en waarom je naar Nederland bent
gekomen.</p>

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
      <li>${I_X}<span>Je bent <strong>jonger dan 18</strong></span></li>
      <li>${I_X}<span>Je hebt de <strong>pensioenleeftijd</strong> al bereikt</span></li>
      <li>${I_X}<span>Je woonde <strong>8 jaar of langer</strong> in Nederland toen je leerplichtig was</span></li>
      <li>${I_X}<span>Je hebt een <strong>Nederlands diploma</strong> dat vrijstelling geeft</span></li>
    </ul>
  </div>
</div>

${fact('Vrijgesteld zijn onder meer: mensen jonger dan 18, mensen boven de pensioengerechtigde leeftijd, mensen uit de EU/EER en Zwitserland, mensen die hier tijdelijk zijn voor studie of werk, en wie 8 jaar of langer in Nederland woonde toen hij leerplichtig was.', 'Rijksoverheid — Moet ik als nieuwkomer inburgeren?', SRC_PLICHT, CHECKED)}

<h2 id="jouw-situatie">Zoek jouw situatie op</h2>

<p>Klik op de situatie die het beste bij je past.</p>

<div class="picker">
  ${pick(I_USER, 'Ik heb asiel aangevraagd en een vergunning gekregen', `
    <p>Je bent <strong>asielstatushouder</strong> en moet meestal inburgeren. De gemeente begeleidt
    je: je krijgt een gesprek, een persoonlijk plan en meestal een cursus die de gemeente betaalt.</p>
    <p>Ook de eerste twee pogingen van elk verplicht examen zijn dan gratis.</p>`)}
  ${pick(I_USERS, 'Ik kom bij mijn partner of familie wonen', `
    <p>Je bent <strong>gezinsmigrant</strong> en moet meestal inburgeren. Je betaalt de cursus en de
    examens in de regel zelf. Lenen bij DUO kan onder voorwaarden.</p>`)}
  ${pick(I_PLANE, 'Ik kom uit de EU, Noorwegen, IJsland, Liechtenstein of Zwitserland', `
    <p>Dan hoef je <strong>niet</strong> in te burgeren. Wil je later Nederlander worden? Dan gelden
    voor naturalisatie wel taal-eisen. Vrijwillig een examen doen mag altijd.</p>`)}
  ${pick(I_CAP, 'Ik ben hier tijdelijk voor studie of werk', `
    <p>Verblijf voor een <strong>tijdelijk doel</strong> geeft geen inburgeringsplicht. Verandert je
    verblijfsdoel later — bijvoorbeeld naar verblijf bij een partner — dan kan de plicht alsnog
    ontstaan. DUO laat dat weten met een brief.</p>`)}
  ${pick(I_BOOK, 'Ik ben 16 of 17 jaar', `
    <p>De inburgeringsplicht geldt in de regel vanaf <strong>18 jaar</strong>. Ben je jonger, dan ga
    je naar school: je bent leerplichtig of kwalificatieplichtig. Dat onderwijs telt.</p>`)}
  ${pick(I_CAP, 'Ik heb een Nederlands diploma', `
    <p>Sommige diploma's geven vrijstelling: <strong>vmbo, havo, vwo, mbo niveau 2 of hoger</strong>,
    en een hbo- of wo-opleiding <strong>in het Nederlands</strong>. Nederlandstalige diploma's uit
    België en Suriname tellen ook mee.</p>
    <p>Je vraagt de vrijstelling zelf aan bij DUO en stuurt een kopie van je diploma mee.</p>`)}
</div>

${fact("Diploma's die vrijstelling geven: vmbo, havo, vwo, mbo niveau 2 of hoger, en hbo of wo mits in het Nederlands gevolgd.", 'inburgeren.nl — Diploma gehaald', SRC_DIPLOMA, CHECKED)}

${note('Twijfel je? Kijk in <strong>Mijn Inburgering</strong> met je DigiD. Daar staat of je inburgeringsplichtig bent, vanaf welke datum, en welke examens voor jou gelden.')}

<h2 id="vrijstelling-ontheffing">Vrijstelling of ontheffing?</h2>

<p>Twee woorden die op elkaar lijken en iets anders betekenen. Allebei vraag je aan bij DUO.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Vrijstelling</h3>
      <p class="compare-when">Je hoeft niet in te burgeren</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">Wanneer</p>
        <p class="compare-val">Je hebt een diploma dat meetelt, of je bent al voldoende ingeburgerd.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Wat je doet</p>
        <p class="compare-val">Aanvragen bij DUO, met bewijs. Je krijgt geen examenplicht.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Kosten</p>
        <p class="compare-val">Geen.</p>
      </div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Ontheffing</h3>
      <p class="compare-when">Je kúnt niet inburgeren</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">Wanneer</p>
        <p class="compare-val">Je bent door een psychische of lichamelijke belemmering, of een verstandelijke beperking, blijvend niet in staat om examen te doen.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Wat je doet</p>
        <p class="compare-val">Aanvragen bij DUO. Een onafhankelijke arts onderzoekt je.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Kosten</p>
        <p class="compare-val">€225 vooraf. Krijg je de ontheffing, dan betaalt DUO dat bedrag terug.</p>
      </div>
    </div>
  </div>
</div>

${fact('Een medische ontheffing kost €225 vooraf. Wordt de ontheffing toegekend, dan krijg je dat bedrag terug.', 'inburgeren.nl — Ziekte of handicap', SRC_ONTHEFFING, CHECKED)}

${note('Een medische ontheffing is <strong>niet genoeg om te naturaliseren</strong>. Wil je later Nederlander worden, vraag dan bij de IND na wat in jouw geval nodig is.')}

${docent('Wat ik het vaakst zie: mensen die maanden wachten omdat ze denken dat ze zelf iets moeten aanvragen. Dat hoeft niet. DUO stuurt je een brief. Bewaar die brief goed — de datum erin bepaalt straks alles, van je termijn tot welke wet voor jou geldt.')}

<h2 id="en-nu">En nu?</h2>

<p>Weet je dat je moet inburgeren? Dan zijn dit de twee volgende vragen:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_MAIL}</div>
    <h3>Welke wet geldt voor mij?</h3>
    <p>De datum in je brief bepaalt of je onder de Wet 2013 of de Wet 2021 valt. Dat verandert je
    taalniveau, je examens en wie je helpt.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_CHECK}</div>
    <h3>Wat moet ik doen, en wanneer?</h3>
    <p>Van de brief van DUO tot je diploma zijn het zeven stappen. Het stappenplan zet ze op een
    rij, met de termijnen erbij.</p>
  </div>
</div>

${inlineCta('Kijk vast waar je nu staat', 'Tien vragen per onderdeel, met uitleg bij elk antwoord. Geen account nodig.', '/oefenen', 'Gratis oefenexamen')}
`,

  sidebarHtml: `
<p><strong>In het kort</strong></p>
<ul>
  <li>DUO bepaalt het en stuurt je een brief — je hoeft niets uit te zoeken.</li>
  <li>EU, tijdelijk verblijf, onder de 18 of boven de pensioenleeftijd: meestal geen plicht.</li>
  <li>Een Nederlands diploma kan vrijstelling geven.</li>
  <li>Kun je door ziekte of een beperking blijvend geen examen doen? Vraag ontheffing aan.</li>
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
      a: 'Vrijstelling betekent dat je niet hoeft in te burgeren, bijvoorbeeld omdat je al een Nederlands diploma hebt. Ontheffing betekent dat je door een psychische of lichamelijke belemmering blijvend geen examen kunt doen. Voor een ontheffing onderzoekt een onafhankelijke arts je.',
    },
    {
      q: 'Moet ik inburgeren als ik 16 of 17 ben?',
      a: 'In de regel niet: de inburgeringsplicht geldt vanaf 18 jaar. Ben je jonger, dan val je onder de leerplicht of de kwalificatieplicht en ga je naar school.',
    },
  ],

  related: ['welke-wet-en-welke-route', 'inburgering-stappenplan', 'wat-kost-inburgeren'],
  relatedPosts: ['taalniveaus-a1-a2-b1-nederlands', 'inburgeringsexamen-a2-uitleg'],

  ctaTitle: 'Weten hoe goed je Nederlands al is?',
  ctaDesc: 'Doe een gratis oefenexamen van tien vragen. Met uitleg bij elk antwoord, zonder account.',
  ctaHref: '/oefenen',
  ctaLabel: 'Start een gratis oefenexamen',

  /* English and Arabic bodies, 20-08-2026.
   *
   * **Official Dutch terms are kept in Dutch**, glossed on first use: inburgering, DUO, PIP, KNM,
   * MAP, PVT, Mijn Inburgering, vrijstelling, ontheffing, brede intake, leerbaarheidstoets. The
   * reader has to recognise these words on a letter from DUO and in a government portal that has
   * no English or Arabic version; translating them away would make the guide easier to read and
   * harder to use. Source labels and URLs stay Dutch for the same reason — the page they name is
   * Dutch whichever locale links to it. */
  translations: {
    en: {
      title: 'Do I have to do inburgering? Check your situation',
      breadcrumb: 'Do I have to?',
      dateLabel: '20 August 2026',
      eyebrow: 'Integration duty',
      heroTitle: 'Do I have to do inburgering?',
      heroSubtitle:
        'Not everyone who moves to the Netherlands has to integrate. It depends on your nationality and on why you are here. Check your own situation below.',
      description:
        'Not everyone has to do inburgering. Check in one minute whether the duty applies to you, when you are exempt, and what the letter from DUO actually says.',
      articleHtml: `
<div class="verdict ok">
  <p class="verdict-answer">You do not have to work this out yourself</p>
  <p>DUO checks it for you. If you have to integrate, you get a letter. It says from which date
  you are <em>inburgeringsplichtig</em> — required to integrate — and how much time you have. No
  letter? Then the duty probably does not apply to you.</p>
</div>

${factIn('en', 'DUO decides whether you have to integrate and sends you a letter about it, once you have a BSN and a residence permit and are registered with your municipality.', 'inburgeren.nl — U gaat inburgeren', SRC_BRIEF, CHECKED)}

<h2 id="wie-wel-wie-niet">Who has to, and who does not?</h2>

<p>It mainly depends on two things: your nationality, and why you came to the Netherlands.</p>

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
      <li>${I_X}<span>You are <strong>under 18</strong></span></li>
      <li>${I_X}<span>You have already reached <strong>state pension age</strong></span></li>
      <li>${I_X}<span>You lived in the Netherlands for <strong>8 years or more</strong> while you were of compulsory school age</span></li>
      <li>${I_X}<span>You hold a <strong>Dutch diploma</strong> that grants exemption</span></li>
    </ul>
  </div>
</div>

${factIn('en', 'Exempt groups include: people under 18, people above state pension age, people from the EU/EEA and Switzerland, people here temporarily to study or work, and anyone who lived in the Netherlands for 8 years or more while of compulsory school age.', 'Rijksoverheid — Moet ik als nieuwkomer inburgeren?', SRC_PLICHT, CHECKED)}

<h2 id="jouw-situatie">Find your situation</h2>

<p>Open the one that fits you best.</p>

<div class="picker">
  ${pick(I_USER, 'I applied for asylum and was granted a permit', `
    <p>You are an <strong>asylum status holder</strong> and usually have to integrate. Your
    municipality guides you: you get an interview, a personal plan, and usually a course the
    municipality pays for.</p>
    <p>The first two attempts at each compulsory exam are also free.</p>`)}
  ${pick(I_USERS, 'I am joining my partner or family', `
    <p>You are a <strong>family migrant</strong> and usually have to integrate. As a rule you pay
    for the course and the exams yourself. Borrowing from DUO is possible under conditions.</p>`)}
  ${pick(I_PLANE, 'I am from the EU, Norway, Iceland, Liechtenstein or Switzerland', `
    <p>Then you do <strong>not</strong> have to integrate. If you want to become Dutch later,
    naturalisation does have language requirements. Taking an exam voluntarily is always allowed.</p>`)}
  ${pick(I_CAP, 'I am here temporarily to study or work', `
    <p>Residence for a <strong>temporary purpose</strong> does not create an integration duty. If
    your purpose of stay changes later — to living with a partner, for example — the duty can
    still arise. DUO tells you by letter.</p>`)}
  ${pick(I_BOOK, 'I am 16 or 17', `
    <p>As a rule the duty starts at <strong>18</strong>. If you are younger you go to school: you
    fall under compulsory education or the qualification requirement. That schooling counts.</p>`)}
  ${pick(I_CAP, 'I have a Dutch diploma', `
    <p>Some diplomas grant exemption: <strong>vmbo, havo, vwo, mbo level 2 or higher</strong>, and
    a hbo or university degree <strong>taught in Dutch</strong>. Dutch-language diplomas from
    Belgium and Suriname count too.</p>
    <p>You apply for the exemption yourself at DUO and send a copy of your diploma.</p>`)}
</div>

${factIn('en', 'Diplomas that grant exemption: vmbo, havo, vwo, mbo level 2 or higher, and hbo or university degrees provided they were taught in Dutch.', 'inburgeren.nl — Diploma gehaald', SRC_DIPLOMA, CHECKED)}

${note('Not sure? Log in to <strong>Mijn Inburgering</strong> with your DigiD. It shows whether you are required to integrate, from which date, and which exams apply to you.')}

<h2 id="vrijstelling-ontheffing">Vrijstelling or ontheffing?</h2>

<p>Two Dutch words that look alike and mean different things. You apply to DUO for both.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Vrijstelling — exemption</h3>
      <p class="compare-when">You do not have to integrate</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">When</p>
        <p class="compare-val">You hold a qualifying diploma, or you are already sufficiently integrated.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">What you do</p>
        <p class="compare-val">Apply to DUO with evidence. No exam obligation follows.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Cost</p>
        <p class="compare-val">None.</p>
      </div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Ontheffing — waiver</h3>
      <p class="compare-when">You are unable to integrate</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">When</p>
        <p class="compare-val">A psychological or physical impairment, or an intellectual disability, permanently prevents you from sitting the exams.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">What you do</p>
        <p class="compare-val">Apply to DUO. An independent doctor examines you.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">Cost</p>
        <p class="compare-val">€225 up front. If the waiver is granted, DUO refunds it.</p>
      </div>
    </div>
  </div>
</div>

${factIn('en', 'A medical ontheffing costs €225 up front. If the waiver is granted, that amount is refunded to you.', 'inburgeren.nl — Ziekte of handicap', SRC_ONTHEFFING, CHECKED)}

${note('A medical ontheffing is <strong>not enough for naturalisation</strong>. If you want to become Dutch later, ask the IND what applies in your case.')}

${docentIn('en', 'What I see most often: people who wait months because they think they have to apply for something themselves. You do not. DUO sends you a letter. Keep that letter safe — the date in it decides everything later, from your deadline to which law applies to you.')}

<h2 id="en-nu">What next?</h2>

<p>Know that you have to integrate? Then these are the next two questions:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_MAIL}</div>
    <h3>Which law applies to me?</h3>
    <p>The date in your letter decides whether you fall under the 2013 or the 2021 act. That
    changes your language level, your exams and who helps you.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_CHECK}</div>
    <h3>What do I do, and when?</h3>
    <p>From the letter from DUO to your diploma is seven steps. The step-by-step guide sets them
    out with the deadlines.</p>
  </div>
</div>

${inlineCta('See where you stand right now', 'Ten questions per skill, with an explanation after every answer. No account needed.', '/oefenen', 'Free practice exam')}
`,
      sidebarHtml: `
<p><strong>In short</strong></p>
<ul>
  <li>DUO decides and sends you a letter — you do not have to work anything out.</li>
  <li>EU nationals, temporary stays, under 18 or over pension age: usually no duty.</li>
  <li>A Dutch diploma can grant exemption.</li>
  <li>Permanently unable to sit exams through illness or disability? Apply for an ontheffing.</li>
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
          a: 'Vrijstelling means you do not have to integrate, for example because you already hold a Dutch diploma. Ontheffing means a psychological or physical impairment permanently prevents you from sitting the exams. For an ontheffing an independent doctor examines you.',
        },
        {
          q: 'Do I have to integrate if I am 16 or 17?',
          a: 'As a rule no: the integration duty starts at 18. If you are younger you fall under compulsory education or the qualification requirement, and you go to school.',
        },
      ],
    },

    ar: {
      title: 'هل يجب عليّ الاندماج (inburgering)؟ تحقّق من وضعك',
      breadcrumb: 'هل يجب عليّ؟',
      dateLabel: '٢٠ أغسطس ٢٠٢٦',
      eyebrow: 'واجب الاندماج',
      heroTitle: 'هل يجب عليّ الاندماج؟',
      heroSubtitle:
        'ليس كل من يأتي إلى هولندا ملزَمًا بالاندماج. الأمر يعتمد على جنسيتك وعلى سبب وجودك هنا. تحقّق من وضعك أدناه.',
      description:
        'ليس الجميع ملزَمين بالاندماج في هولندا. تحقّق خلال دقيقة مما إذا كان الالتزام ينطبق عليك، ومتى تحصل على إعفاء، وماذا يعني خطاب DUO الذي وصلك.',
      articleHtml: `
<div class="verdict ok">
  <p class="verdict-answer">لست مضطرًا لمعرفة ذلك بنفسك</p>
  <p>مؤسسة DUO تتحقّق من ذلك نيابةً عنك. إذا كان عليك الاندماج، ستصلك رسالة توضّح تاريخ بدء
  التزامك بالاندماج (inburgeringsplicht) والمدة المتاحة لك. لم تصلك رسالة؟ إذن الالتزام على
  الأرجح لا ينطبق عليك.</p>
</div>

${factIn('ar', 'تقرّر DUO ما إذا كان عليك الاندماج وترسل إليك رسالة بذلك، بمجرد حصولك على رقم BSN وتصريح إقامة وتسجيلك لدى البلدية.', 'inburgeren.nl — U gaat inburgeren', SRC_BRIEF, CHECKED)}

<h2 id="wie-wel-wie-niet">من عليه الاندماج ومن لا؟</h2>

<p>يعتمد الأمر أساسًا على شيئين: جنسيتك، وسبب قدومك إلى هولندا.</p>

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
      <li>${I_X}<span>عمرك <strong>أقل من ١٨ عامًا</strong></span></li>
      <li>${I_X}<span>بلغت بالفعل <strong>سنّ التقاعد</strong></span></li>
      <li>${I_X}<span>عشت في هولندا <strong>٨ سنوات أو أكثر</strong> خلال سنّ التعليم الإلزامي</span></li>
      <li>${I_X}<span>لديك <strong>شهادة هولندية</strong> تمنحك إعفاءً</span></li>
    </ul>
  </div>
</div>

${factIn('ar', 'من بين المُعفَين: من هم دون ١٨ عامًا، ومن تجاوزوا سنّ التقاعد، ومواطنو الاتحاد الأوروبي والمنطقة الاقتصادية الأوروبية وسويسرا، ومن يقيمون مؤقتًا للدراسة أو العمل، ومن عاش في هولندا ٨ سنوات أو أكثر خلال سنّ التعليم الإلزامي.', 'Rijksoverheid — Moet ik als nieuwkomer inburgeren?', SRC_PLICHT, CHECKED)}

<h2 id="jouw-situatie">ابحث عن وضعك</h2>

<p>اضغط على الحالة الأقرب إليك.</p>

<div class="picker">
  ${pick(I_USER, 'تقدّمت بطلب لجوء وحصلت على تصريح إقامة', `
    <p>أنت <strong>حاصل على حق اللجوء</strong> وعليك الاندماج في الغالب. البلدية ترافقك: ستُجرى
    معك مقابلة، وتحصل على خطة شخصية، وغالبًا على دورة تدفع البلدية تكلفتها.</p>
    <p>كما أن أول محاولتين لكل امتحان إلزامي مجانيتان.</p>`)}
  ${pick(I_USERS, 'قدمت للعيش مع شريكي أو عائلتي', `
    <p>أنت <strong>مهاجر لَمّ شمل</strong> وعليك الاندماج في الغالب. وتدفع عادةً تكاليف الدورة
    والامتحانات بنفسك. الاقتراض من DUO ممكن ضمن شروط.</p>`)}
  ${pick(I_PLANE, 'أنا من الاتحاد الأوروبي أو النرويج أو آيسلندا أو ليختنشتاين أو سويسرا', `
    <p>إذن <strong>لا</strong> يجب عليك الاندماج. وإن أردت لاحقًا الحصول على الجنسية الهولندية،
    فهناك شروط لغوية للتجنّس. ويمكنك دائمًا أداء الامتحان طوعًا.</p>`)}
  ${pick(I_CAP, 'وجودي هنا مؤقت للدراسة أو العمل', `
    <p>الإقامة <strong>لغرض مؤقت</strong> لا تُنشئ التزامًا بالاندماج. وإذا تغيّر غرض إقامتك
    لاحقًا — مثلًا إلى الإقامة مع شريك — فقد ينشأ الالتزام عندها. وستُعلمك DUO برسالة.</p>`)}
  ${pick(I_BOOK, 'عمري ١٦ أو ١٧ عامًا', `
    <p>يبدأ الالتزام عادةً من سنّ <strong>١٨</strong>. وإذا كنت أصغر فأنت في المدرسة: تخضع
    للتعليم الإلزامي أو لالتزام الحصول على مؤهل. وهذا التعليم يُحتسب.</p>`)}
  ${pick(I_CAP, 'لديّ شهادة هولندية', `
    <p>بعض الشهادات تمنح إعفاءً: <strong>vmbo وhavo وvwo وmbo من المستوى ٢ فما فوق</strong>،
    وكذلك شهادة hbo أو جامعية <strong>دُرِست بالهولندية</strong>. والشهادات الناطقة بالهولندية من
    بلجيكا وسورينام تُحتسب أيضًا.</p>
    <p>تتقدّم بطلب الإعفاء بنفسك إلى DUO مع نسخة من شهادتك.</p>`)}
</div>

${factIn('ar', 'الشهادات التي تمنح إعفاءً: vmbo وhavo وvwo وmbo من المستوى ٢ فما فوق، وشهادات hbo والجامعة بشرط أن تكون الدراسة بالهولندية.', 'inburgeren.nl — Diploma gehaald', SRC_DIPLOMA, CHECKED)}

${note('غير متأكد؟ سجّل الدخول إلى <strong>Mijn Inburgering</strong> باستخدام DigiD. هناك ترى ما إذا كنت ملزَمًا بالاندماج، ومن أي تاريخ، وأي امتحانات تنطبق عليك.')}

<h2 id="vrijstelling-ontheffing">Vrijstelling أم ontheffing؟</h2>

<p>كلمتان هولنديتان متشابهتان ومعناهما مختلف. وكلتاهما تُطلَب من DUO.</p>

<div class="compare-2">
  <div class="compare-card is-primary">
    <div class="compare-head">
      <h3>Vrijstelling — إعفاء</h3>
      <p class="compare-when">لست ملزَمًا بالاندماج</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">متى</p>
        <p class="compare-val">لديك شهادة مؤهِّلة، أو أنك مندمج بالقدر الكافي بالفعل.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">ماذا تفعل</p>
        <p class="compare-val">تتقدّم بطلب إلى DUO مع إثبات. ولا يترتّب عليك أي التزام بالامتحان.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">التكلفة</p>
        <p class="compare-val">لا شيء.</p>
      </div>
    </div>
  </div>
  <div class="compare-card">
    <div class="compare-head">
      <h3>Ontheffing — إسقاط الالتزام</h3>
      <p class="compare-when">لا تستطيع الاندماج</p>
    </div>
    <div class="compare-rows">
      <div class="compare-row">
        <p class="compare-key">متى</p>
        <p class="compare-val">إعاقة نفسية أو جسدية أو إعاقة ذهنية تمنعك بشكل دائم من أداء الامتحانات.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">ماذا تفعل</p>
        <p class="compare-val">تتقدّم بطلب إلى DUO. ويفحصك طبيب مستقل.</p>
      </div>
      <div class="compare-row">
        <p class="compare-key">التكلفة</p>
        <p class="compare-val">‏€225 مقدَّمًا. وإذا مُنحت الإسقاط، تُعيد DUO لك المبلغ.</p>
      </div>
    </div>
  </div>
</div>

${factIn('ar', 'يكلّف طلب الـontheffing الطبي ‏€225 مقدَّمًا. وإذا مُنح الطلب، يُعاد إليك هذا المبلغ.', 'inburgeren.nl — Ziekte of handicap', SRC_ONTHEFFING, CHECKED)}

${note('الـontheffing الطبي <strong>لا يكفي للتجنّس</strong>. إذا كنت تنوي لاحقًا الحصول على الجنسية الهولندية، فاسأل IND عما ينطبق على حالتك.')}

${docentIn('ar', 'أكثر ما أراه: أشخاص ينتظرون شهورًا لأنهم يظنون أن عليهم التقدّم بطلب ما بأنفسهم. ليس عليكم ذلك. DUO ترسل إليكم رسالة. احتفظوا بها جيدًا — فالتاريخ المذكور فيها يحدّد كل شيء لاحقًا، من مدّتكم الزمنية إلى القانون الذي ينطبق عليكم.')}

<h2 id="en-nu">وماذا بعد؟</h2>

<p>عرفت أن عليك الاندماج؟ إذن هذان هما السؤالان التاليان:</p>

<div class="guide-cards">
  <div class="guide-card">
    <div class="guide-card-icon">${I_MAIL}</div>
    <h3>أي قانون ينطبق عليّ؟</h3>
    <p>التاريخ في رسالتك يحدّد ما إذا كنت تخضع لقانون ٢٠١٣ أو قانون ٢٠٢١. وهذا يغيّر مستواك
    اللغوي وامتحاناتك ومن يساعدك.</p>
  </div>
  <div class="guide-card">
    <div class="guide-card-icon">${I_CHECK}</div>
    <h3>ماذا أفعل ومتى؟</h3>
    <p>من رسالة DUO إلى شهادتك سبع خطوات. الدليل خطوة بخطوة يعرضها مع المواعيد النهائية.</p>
  </div>
</div>

${inlineCta('اعرف أين أنت الآن', 'عشرة أسئلة لكل مهارة، مع شرح بعد كل إجابة. بدون حساب.', '/oefenen', 'امتحان تجريبي مجاني')}
`,
      sidebarHtml: `
<p><strong>باختصار</strong></p>
<ul>
  <li>‏DUO تقرّر وترسل لك رسالة — لست مضطرًا لمعرفة أي شيء بنفسك.</li>
  <li>مواطنو الاتحاد الأوروبي، والإقامة المؤقتة، ومن هم دون ١٨ أو فوق سنّ التقاعد: عادةً بلا التزام.</li>
  <li>الشهادة الهولندية قد تمنح إعفاءً.</li>
  <li>هل يمنعك مرض أو إعاقة بشكل دائم من أداء الامتحان؟ اطلب ontheffing.</li>
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
          a: 'الـvrijstelling يعني أنك غير ملزَم بالاندماج، مثلًا لأنك تحمل شهادة هولندية بالفعل. أما الـontheffing فيعني أن إعاقة نفسية أو جسدية تمنعك بشكل دائم من أداء الامتحانات، ويفحصك من أجله طبيب مستقل.',
        },
        {
          q: 'هل يجب عليّ الاندماج إذا كان عمري ١٦ أو ١٧ عامًا؟',
          a: 'كقاعدة لا: يبدأ التزام الاندماج من سنّ ١٨. وإذا كنت أصغر فأنت تخضع للتعليم الإلزامي أو لالتزام الحصول على مؤهل، وتذهب إلى المدرسة.',
        },
      ],
    },
  },
};

export default guide;
