/**
 * De vragen van de FAQ-hub (`/veelgestelde-vragen`). Het zijn de vragen die kandidaten op Reddit
 * (r/learndutch, r/Netherlands) stellen over het inburgeringsexamen, met een kort antwoord en een
 * link naar de pagina die dieper gaat.
 *
 * **Elk getal en elke bewering komt uit `SEO/facts.md` of uit een gids met `status: 'reviewed'`.**
 * Wat DUO niet publiceert, staat hier als "dat publiceert DUO niet" — nooit als een geschat getal.
 * `SEO/facts.md` §9 geldt onverkort: "18 van de 25" en "500 punten" worden alleen genoemd om te
 * zeggen dat er geen officiële bron voor is. Het aantal vragen van het echte KNM-examen staat
 * hier niet.
 *
 * Nederlands en Engels. De Arabische route toont de Engelse tekst, van links naar rechts, en is
 * `noindex`; er staat hier bewust geen Arabisch antwoord.
 */

/**
 * De ene schakelaar. `false` = de docent heeft de tekst nog niet nagekeken: de pagina is in elke
 * taal `noindex`, toont een conceptmelding, geeft geen JSON-LD af en staat niet in de sitemap.
 * `app/sitemap.ts` en de pagina lezen allebei deze constante.
 */
export const FAQ_REVIEWED = true;

/** De talen die Google mag indexeren zodra `FAQ_REVIEWED` waar is. Arabisch heeft geen eigen tekst. */
export const FAQ_INDEXED_LOCALES: readonly string[] = ['nl', 'en'];

export type FaqLang = 'nl' | 'en';
type Text = Record<FaqLang, string>;

export type FaqGroupId = 'examen' | 'slagen' | 'uitslag' | 'herkansen' | 'termijn' | 'niveau';

export type FaqMore =
  | { page: '/oefenen' | '/voorbeeldvragen' | '/herexamen' | '/premium'; label: Text }
  | { level: 'a2' | 'b1'; label: Text }
  | { guide: { section: 'inburgering' | 'taalexamens'; slug: string }; label: Text }
  | { post: string; label: Text };

export type FaqEntry = {
  id: string;
  group: FaqGroupId;
  q: Text;
  a: Text;
  source?: { label: string; url: string };
  more?: FaqMore;
};

export const FAQ_GROUPS: { id: FaqGroupId; label: Text }[] = [
  { id: 'examen', label: { nl: 'Het examen', en: 'The exam' } },
  { id: 'slagen', label: { nl: 'Slagen en cijfers', en: 'Passing and scores' } },
  { id: 'uitslag', label: { nl: 'De uitslag', en: 'Results' } },
  { id: 'herkansen', label: { nl: 'Zakken en opnieuw doen', en: 'Failing and retaking' } },
  { id: 'termijn', label: { nl: 'Tijd en termijn', en: 'Time and deadline' } },
  { id: 'niveau', label: { nl: 'A2 of B1, en oefenen', en: 'A2 or B1, and practising' } },
];

const TAALEXAMENS = { label: 'inburgeren.nl — Taalexamens A2, B1 en B2', url: 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp' };
const OEFENEN = { label: 'inburgeren.nl — Oefenen', url: 'https://www.inburgeren.nl/examen-doen/oefenen.jsp' };
const REGLEMENT = { label: 'DUO — Examenreglement inburgering', url: 'https://www.inburgeren.nl/images/examenreglement.pdf' };
const UITSLAG = { label: 'inburgeren.nl — Uitslag', url: 'https://www.inburgeren.nl/examen-doen/uitslag.jsp' };
const BETALEN = { label: 'inburgeren.nl — Inburgeren betalen', url: 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp' };
const NIEUWS_16_WEKEN = { label: 'inburgeren.nl — nieuwsbericht 31 juli 2026', url: 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16' };
const NIEUWS_DIPLOMA = { label: 'inburgeren.nl — nieuwsbericht 29 januari 2026', url: 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-235392-16' };
const TERMIJN = { label: 'Wet inburgering 2021, artikel 11', url: 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&artikel=11' };
const CIJFERS = { label: 'DUO — Voortgangscijfers Wet inburgering 2013', url: 'https://duo.nl/data/Totaal%20Nederland.pdf' };
const EXTRA_TIJD = { label: 'inburgeren.nl — Extra tijd', url: 'https://www.inburgeren.nl/extra-tijd/' };
const BOETE = { label: 'inburgeren.nl — Boete', url: 'https://www.inburgeren.nl/u-gaat-inburgeren/boete.jsp' };
const ROUTES = { label: 'inburgeren.nl — U gaat inburgeren', url: 'https://www.inburgeren.nl/u-gaat-inburgeren/' };
const NATURALISEREN = { label: 'inburgeren.nl — Naturaliseren', url: 'https://www.inburgeren.nl/u-gaat-inburgeren/naturaliseren.jsp' };

export const FAQ: FaqEntry[] = [
  // ── Het examen ─────────────────────────────────────────────────────────────
  {
    id: 'welke-examens',
    group: 'examen',
    q: { nl: 'Welke examens zijn er op A2?', en: 'Which exams are there at A2?' },
    a: {
      nl: 'Er zijn vier taalexamens: Lezen, Luisteren, Schrijven en Spreken. Daarnaast is er het examen KNM, over de Nederlandse maatschappij. Welke examens jij moet doen, staat in je brief van DUO of in je PIP.',
      en: 'There are four language exams: Reading, Listening, Writing and Speaking. There is also the KNM exam, about Dutch society. Your letter from DUO or your PIP says which exams you must take.',
    },
    source: TAALEXAMENS,
    more: { guide: { section: 'taalexamens', slug: 'taalexamens-a2-b1' }, label: { nl: 'Lees de gids over de taalexamens', en: 'Read the guide to the language exams' } },
  },
  {
    id: 'hoeveel-vragen',
    group: 'examen',
    q: { nl: 'Hoeveel vragen heeft elk examen en hoe lang duurt het?', en: 'How many questions does each exam have, and how long is it?' },
    a: {
      nl: 'DUO noemt de tijd, maar geen aantal vragen. In de oefenexamens van DUO zitten 25 vragen bij Lezen (65 minuten) en 25 bij Luisteren (45 minuten). Spreken heeft daar 16 vragen (35 minuten) en Schrijven 4 opdrachten (40 minuten).',
      en: 'DUO states the time, but not the number of questions. DUO\'s own practice exams have 25 questions for Reading (65 minutes) and 25 for Listening (45 minutes). Speaking has 16 questions there (35 minutes) and Writing has 4 tasks (40 minutes).',
    },
    source: OEFENEN,
    more: { page: '/voorbeeldvragen', label: { nl: 'Bekijk voorbeeldvragen per onderdeel', en: 'See example questions for each part' } },
  },
  {
    id: 'schrijven-op-papier',
    group: 'examen',
    q: { nl: 'Is Schrijven echt met pen en papier?', en: 'Is Writing really on paper?' },
    a: {
      nl: 'Ja, op A2. Schrijven A2 maak je met pen en papier. Lezen, Luisteren en Spreken doe je op A2 op de computer.',
      en: 'Yes, at A2. You do Writing A2 with pen and paper. You do Reading, Listening and Speaking at A2 on a computer.',
    },
    source: TAALEXAMENS,
    more: { guide: { section: 'taalexamens', slug: 'schrijven-examen' }, label: { nl: 'Lees de gids over Schrijven', en: 'Read the guide to Writing' } },
  },
  {
    id: 'volgorde',
    group: 'examen',
    q: { nl: 'Mag ik de examens in mijn eigen volgorde doen?', en: 'Can I take the exams in any order?' },
    a: {
      nl: 'Ja. Er is geen verplichte volgorde. Je meldt je per examen aan in Mijn Inburgering en je kiest zelf de datum en de plaats.',
      en: 'Yes. There is no required order. You sign up for each exam in Mijn Inburgering and you choose the date and the place yourself.',
    },
    more: { guide: { section: 'taalexamens', slug: 'taalexamens-a2-b1' }, label: { nl: 'Lees welke volgorde slim is', en: 'Read which order is smart' } },
  },
  {
    id: 'examendag',
    group: 'examen',
    q: { nl: 'Wat neem ik mee op de examendag en hoe vroeg moet ik er zijn?', en: 'What do I bring on exam day, and how early must I be there?' },
    a: {
      nl: 'Neem een geldig identiteitsbewijs mee. Zonder mag je geen examen doen. Je moet 30 minuten voor het examen aanwezig zijn. Je telefoon, horloge en tas gaan in een kluisje.',
      en: 'Bring a valid ID. Without it you may not take the exam. You must be there 30 minutes before the exam. Your phone, watch and bag go in a locker.',
    },
    source: REGLEMENT,
  },

  // ── Slagen en cijfers ──────────────────────────────────────────────────────
  {
    id: 'hoeveel-fouten',
    group: 'slagen',
    q: { nl: 'Hoeveel fouten mag ik maken?', en: 'How many mistakes may I make?' },
    a: {
      nl: 'Dat maakt DUO niet bekend. De grens heet de cesuur en de minister stelt die vast. DUO schrijft wel: niet alle antwoorden hoeven goed te zijn om te slagen.',
      en: 'DUO does not publish that. The pass mark is called the cesuur and the Minister sets it. DUO does write that not all answers need to be correct to pass.',
    },
    source: REGLEMENT,
    more: { post: 'hoeveel-fouten-inburgeringsexamen', label: { nl: 'Lees wat er wel vaststaat', en: 'Read what is known for certain' } },
  },
  {
    id: '18-van-25-of-500-punten',
    group: 'slagen',
    q: { nl: 'Moet ik 18 van de 25 goed hebben, of 500 punten halen?', en: 'Do I need 18 out of 25, or 500 points?' },
    a: {
      nl: 'Voor geen van die twee getallen is er een officiële bron. Ze staan op veel websites, maar niet op inburgeren.nl en niet in het examenreglement. Reken er dus niet op.',
      en: 'There is no official source for either number. Many websites state them, but inburgeren.nl and the exam regulations do not. So do not count on them.',
    },
    source: REGLEMENT,
    more: { post: 'hoeveel-fouten-inburgeringsexamen', label: { nl: 'Lees waar die getallen vandaan komen', en: 'Read where those numbers come from' } },
  },
  {
    id: 'cijfer-in-uitslag',
    group: 'slagen',
    q: { nl: 'Wat betekent het cijfer in mijn uitslag?', en: 'What does the grade in my result mean?' },
    a: {
      nl: 'In je uitslag staat "geslaagd" of "niet geslaagd". Voor elk taalexamen en voor KNM krijg je ook een cijfer. Waar de grens tussen geslaagd en niet geslaagd ligt, publiceert DUO niet.',
      en: 'Your result says "geslaagd" (passed) or "niet geslaagd" (not passed). You also get a grade for each language exam and for KNM. DUO does not publish where the line between passing and failing lies.',
    },
    source: REGLEMENT,
  },
  {
    id: 'wie-kijkt-na',
    group: 'slagen',
    q: { nl: 'Wie kijkt Schrijven en Spreken na?', en: 'Who marks Writing and Speaking?' },
    a: {
      nl: 'Schrijven kijken gecertificeerde beoordelaars na. Spreken wordt deels automatisch nagekeken en deels door beoordelaars. Lezen en Luisteren kijkt de computer na.',
      en: 'Certified assessors mark Writing. Speaking is marked partly automatically and partly by assessors. The computer marks Reading and Listening.',
    },
    source: REGLEMENT,
    more: { post: 'hoe-wordt-schrijven-spreken-nagekeken', label: { nl: 'Lees waar een beoordelaar op let', en: 'Read what an assessor looks at' } },
  },
  {
    id: 'examen-inzien',
    group: 'slagen',
    q: { nl: 'Kan ik mijn examen later bekijken?', en: 'Can I see my exam afterwards?' },
    a: {
      nl: 'Nee. In het examenreglement staat dat je een gemaakt examen niet kunt inzien. Je ziet dus niet welke vragen fout waren.',
      en: 'No. The exam regulations say you cannot review an exam you have taken. So you do not see which questions were wrong.',
    },
    source: REGLEMENT,
    more: { page: '/oefenen', label: { nl: 'Oefen met uitleg bij elke vraag', en: 'Practise with an explanation for every question' } },
  },

  // ── De uitslag ─────────────────────────────────────────────────────────────
  {
    id: 'hoe-lang-uitslag',
    group: 'uitslag',
    q: { nl: 'Hoe lang duurt het voor ik mijn uitslag heb?', en: 'How long does the result take?' },
    a: {
      nl: 'Normaal krijg je de uitslag binnen 8 weken per brief. Dat geldt voor de taalexamens A2 en voor de kennisexamens. Je ziet de uitslag ook in Mijn Inburgering.',
      en: 'Normally you get the result by letter within 8 weeks. That applies to the A2 language exams and the knowledge exams. You can also see the result in Mijn Inburgering.',
    },
    source: UITSLAG,
  },
  {
    id: 'uitslag-16-weken',
    group: 'uitslag',
    q: { nl: 'Waarom duurt de uitslag van Spreken en Schrijven A2 nu langer?', en: 'Why do Speaking and Writing A2 take longer now?' },
    a: {
      nl: 'DUO meldde op 31 juli 2026 dat het nakijken van deze twee examens nu maximaal 16 weken duurt. Je krijgt je uitslag dus binnen 16 weken. Kijk bij DUO of dit nog geldt.',
      en: 'On 31 July 2026 DUO said that marking these two exams now takes up to 16 weeks. So you get your result within 16 weeks. Check with DUO whether this still applies.',
    },
    source: NIEUWS_16_WEKEN,
    more: { guide: { section: 'taalexamens', slug: 'uitslag-spreken-schrijven-a2' }, label: { nl: 'Lees wat je doet terwijl je wacht', en: 'Read what to do while you wait' } },
  },
  {
    id: 'termijn-tijdens-wachten',
    group: 'uitslag',
    q: { nl: 'Wat als mijn termijn afloopt terwijl ik op de uitslag wacht?', en: 'What if my deadline ends while I wait for the result?' },
    a: {
      nl: 'Kom je door het lange nakijken van Spreken of Schrijven A2 in de knel? Dan geeft DUO je 6 maanden verlenging. Dat gaat vanzelf, en DUO stuurt je er een brief over.',
      en: 'Does the long marking time for Speaking or Writing A2 put your deadline at risk? Then DUO gives you a 6-month extension. This happens automatically, and DUO sends you a letter about it.',
    },
    source: NIEUWS_16_WEKEN,
    more: { guide: { section: 'taalexamens', slug: 'uitslag-spreken-schrijven-a2' }, label: { nl: 'Lees de gids over de vertraagde uitslag', en: 'Read the guide to the delayed result' } },
  },
  {
    id: 'diploma-aanvragen',
    group: 'uitslag',
    q: { nl: 'Wanneer kan ik mijn diploma aanvragen?', en: 'When can I apply for my diploma?' },
    a: {
      nl: 'Wacht tot je de brief met je laatste uitslag hebt. Daarna vraag je het diploma aan in Mijn Inburgering. Een print van het digitale diploma is niet geldig.',
      en: 'Wait until you have the letter with your last result. Then you apply for the diploma in Mijn Inburgering. A printout of the digital diploma is not valid.',
    },
    source: NIEUWS_DIPLOMA,
  },

  // ── Zakken en opnieuw doen ─────────────────────────────────────────────────
  {
    id: 'alles-opnieuw',
    group: 'herkansen',
    q: { nl: 'Moet ik alles opnieuw doen als ik voor één examen zak?', en: 'Do I redo everything if I fail one exam?' },
    a: {
      nl: 'Elk examen staat los. Je meldt je per examen aan, je betaalt per examen en je krijgt per examen een uitslag. Je meldt je dus opnieuw aan voor het examen dat je niet hebt gehaald.',
      en: 'Each exam stands on its own. You sign up per exam, you pay per exam and you get a result per exam. So you sign up again for the exam you did not pass.',
    },
    source: BETALEN,
    more: { page: '/herexamen', label: { nl: 'Oefen voor je herexamen', en: 'Practise for your retake' } },
  },
  {
    id: 'hoe-vaak-herkansen',
    group: 'herkansen',
    q: { nl: 'Hoe vaak mag ik een examen opnieuw doen?', en: 'How often may I retake an exam?' },
    a: {
      nl: 'DUO noemt geen maximum aantal pogingen. In de praktijk is je inburgeringstermijn de grens.',
      en: 'DUO states no maximum number of attempts. In practice your integration deadline is the limit.',
    },
    source: REGLEMENT,
  },
  {
    id: 'kosten-herexamen',
    group: 'herkansen',
    q: { nl: 'Wat kost het om een examen opnieuw te doen?', en: 'What does a retake cost?' },
    a: {
      nl: 'Een examen kost bij DUO op dit moment €50 per onderdeel. Ben je asielstatushouder? Dan zijn de eerste 2 pogingen van elk examen gratis. Prijzen kunnen wijzigen; kijk bij DUO voor de actuele prijs.',
      en: 'An exam at DUO currently costs €50 per part. Are you an asylum status holder? Then the first 2 attempts at each exam are free. Prices can change; check DUO for the current price.',
    },
    source: BETALEN,
    more: { guide: { section: 'inburgering', slug: 'wat-kost-inburgeren' }, label: { nl: 'Lees wat inburgeren kost', en: 'Read what integration costs' } },
  },
  {
    id: 'afzeggen-geld-terug',
    group: 'herkansen',
    q: { nl: 'Kan ik afzeggen en mijn geld terugkrijgen?', en: 'Can I cancel and get my money back?' },
    a: {
      nl: 'Ja, tot 7 dagen voor het examen. Dan krijg je je geld terug. Zeg je later af, of kom je niet? Dan krijg je geen geld terug.',
      en: 'Yes, up to 7 days before the exam. Then you get your money back. If you cancel later, or do not show up, you get no refund.',
    },
    source: REGLEMENT,
  },

  // ── Tijd en termijn ────────────────────────────────────────────────────────
  {
    id: 'hoe-lang-krijg-ik',
    group: 'termijn',
    q: { nl: 'Hoeveel tijd krijg ik om in te burgeren?', en: 'How long do I get to integrate?' },
    a: {
      nl: 'Onder de Wet inburgering 2021 krijg je 3 jaar. Die tijd begint op de dag na de datum van je PIP.',
      en: 'Under the Civic Integration Act 2021 you get 3 years. That time starts the day after the date of your PIP.',
    },
    source: TERMIJN,
    more: { guide: { section: 'inburgering', slug: 'boete-en-termijn' }, label: { nl: 'Lees de gids over je termijn', en: 'Read the guide to your deadline' } },
  },
  {
    id: 'hoe-lang-echt',
    group: 'termijn',
    q: { nl: 'Hoe lang doen mensen er echt over?', en: 'How long do people really take?' },
    a: {
      nl: 'DUO heeft cijfers over de Wet inburgering 2013, met peildatum 1 januari 2026. Per startjaar (2013 tot en met 2021) deed de middelste inburgeraar er 38 tot 44 maanden over. Verlengingen tellen mee in die tijd. Voor de Wet 2021 is er nog geen zulk cijfer.',
      en: 'DUO has figures for the Civic Integration Act 2013, as of 1 January 2026. Per starting year (2013 to 2021), the median person took 38 to 44 months. Extensions count in that time. There is no such figure yet for the 2021 Act.',
    },
    source: CIJFERS,
    more: { post: 'hoe-lang-duurt-inburgeren', label: { nl: 'Lees de cijfers van DUO', en: 'Read DUO\'s figures' } },
  },
  {
    id: 'extra-tijd',
    group: 'termijn',
    q: { nl: 'Kan ik extra tijd krijgen?', en: 'Can I get extra time?' },
    a: {
      nl: 'Soms. Bijvoorbeeld bij ziekte, een bevalling, een opleiding of als je eerst moet leren lezen en schrijven. DUO noemt geen vaste duur. Je kunt in een periode maar 1 keer extra tijd krijgen.',
      en: 'Sometimes. For example for illness, childbirth, a study programme, or if you first have to learn to read and write. DUO states no fixed length. You can get extra time only once in a period.',
    },
    source: EXTRA_TIJD,
    more: { guide: { section: 'inburgering', slug: 'boete-en-termijn' }, label: { nl: 'Lees wanneer je extra tijd krijgt', en: 'Read when you get extra time' } },
  },
  {
    id: 'te-laat-boete',
    group: 'termijn',
    q: { nl: 'Wat gebeurt er als ik te laat ben?', en: 'What happens if I am too late?' },
    a: {
      nl: 'Dan kun je een boete krijgen. Voor de leerroute onder de Wet 2021 is dat op dit moment maximaal €1.000. Na een boete krijg je extra tijd om alsnog in te burgeren.',
      en: 'Then you can get a fine. For the learning route under the 2021 Act that is currently at most €1,000. After a fine you get extra time to still complete your integration.',
    },
    source: BOETE,
    more: { guide: { section: 'inburgering', slug: 'boete-en-termijn' }, label: { nl: 'Lees de gids over de boete', en: 'Read the guide to the fine' } },
  },
  {
    id: 'boete-asielstatushouder',
    group: 'termijn',
    q: { nl: 'Krijg ik als asielstatushouder een boete?', en: 'Do asylum status holders get a fine?' },
    a: {
      nl: 'Nee. DUO schrijft: asielstatushouders krijgen nooit een boete. Dat volgt uit een uitspraak van de Raad van State van 9 juli 2025.',
      en: 'No. DUO writes that asylum status holders never get a fine. This follows from a Council of State ruling of 9 July 2025.',
    },
    source: BOETE,
  },

  // ── A2 of B1, en oefenen ───────────────────────────────────────────────────
  {
    id: 'a2-of-b1',
    group: 'niveau',
    q: { nl: 'Moet ik A2 of B1 doen?', en: 'Do I need A2 or B1?' },
    a: {
      nl: 'Dat kies je niet zelf. Onder de Wet 2021 kiest je gemeente een leerroute, en in de B1-route doe je de examens op B1. Val je onder de Wet 2013? Dan doe je de taalexamens op A2.',
      en: 'You do not choose that yourself. Under the 2021 Act your municipality chooses a learning route, and in the B1 route you take the exams at B1. Do you fall under the 2013 Act? Then you take the language exams at A2.',
    },
    source: ROUTES,
    more: { guide: { section: 'inburgering', slug: 'welke-wet-en-welke-route' }, label: { nl: 'Lees welke wet en route voor jou geldt', en: 'Read which act and route apply to you' } },
  },
  {
    id: 'niveau-naturalisatie',
    group: 'niveau',
    q: { nl: 'Welk niveau heb ik nodig om Nederlander te worden?', en: 'What level do I need for naturalisation?' },
    a: {
      nl: 'Voor naturalisatie is op dit moment A2 genoeg. Het kabinet wil dat verhogen naar B1, maar dat is een plan zonder datum.',
      en: 'For naturalisation, A2 is currently enough. The government wants to raise it to B1, but that is a plan with no date.',
    },
    source: NATURALISEREN,
    more: { guide: { section: 'inburgering', slug: 'taaleis-naturalisatie' }, label: { nl: 'Lees de gids over de taaleis', en: 'Read the guide to the language requirement' } },
  },
  {
    id: 'zonder-cursus',
    group: 'niveau',
    q: { nl: 'Kan ik me voorbereiden zonder cursus?', en: 'Can I prepare without a course?' },
    a: {
      nl: 'Over de Wet 2013 schrijft DUO dat de meeste mensen een cursus volgen, maar dat zelfstudie ook mogelijk is. Onder de Wet 2021 staat je leerroute in je PIP. Hoeveel uur studie je nodig hebt, staat in geen enkele officiële bron.',
      en: 'About the 2013 Act, DUO writes that most people follow a course, but that self-study is also possible. Under the 2021 Act your learning route is in your PIP. No official source says how many hours of study you need.',
    },
    source: CIJFERS,
    more: { post: 'hoe-lang-duurt-inburgeren', label: { nl: 'Lees wat DUO hierover schrijft', en: 'Read what DUO writes about this' } },
  },
  {
    id: 'hoeveel-oefenexamens',
    group: 'niveau',
    q: { nl: 'Hoeveel oefenexamens heeft DUO, en hoeveel staan er hier?', en: 'How many practice exams does DUO offer, and how many are here?' },
    a: {
      nl: 'DUO heeft op A2 4 oefenexamens voor Lezen en 3 voor Luisteren, Spreken en Schrijven. Hier staan er op A2 10 per onderdeel. Begin met die van DUO: ze zijn gratis.',
      en: 'At A2, DUO offers 4 practice exams for Reading and 3 each for Listening, Speaking and Writing. Here there are 10 per part at A2. Start with DUO\'s: they are free.',
    },
    source: OEFENEN,
    more: { level: 'a2', label: { nl: 'Bekijk de oefenexamens A2', en: 'See the A2 practice exams' } },
  },
  {
    id: 'oefenen-gratis',
    group: 'niveau',
    q: { nl: 'Is oefenen hier gratis?', en: 'Is practising here free?' },
    a: {
      nl: 'Voor een deel. Zonder account maak je 10 vragen per onderdeel. Met een gratis account maak je oefenexamen 1 van elk onderdeel. Daarna kost een onderdeel €9,95 per maand.',
      en: 'Partly. Without an account you can do 10 questions per part. With a free account you can do practice exam 1 of each part. After that, a part costs €9.95 per month.',
    },
    more: { page: '/premium', label: { nl: 'Bekijk de prijzen', en: 'See the prices' } },
  },
];

/** De taal waarin een route de vragen toont: Arabisch heeft geen eigen tekst en valt terug op Engels. */
export function faqLang(locale: string): FaqLang {
  return locale === 'nl' ? 'nl' : 'en';
}
