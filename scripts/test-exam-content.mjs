/**
 * TEST CONTENT for exam 1 of each skill. Not shippable exam material.
 *
 * ## Read this before you reuse any of it
 * CLAUDE.md: "No AI-generated exam content. Every item is written or reviewed by a certified NT2
 * docent." That rule is the product's wedge, and this file does not satisfy it. Everything here was
 * written to exercise the player, the grader and the admin surfaces — not to be sat by a candidate.
 *
 * `seed-test-exams.mjs` therefore refuses to run against anything but the local stack, marks every
 * exam title so it cannot be mistaken for Marieke's work in admin, and can remove all of it again.
 * When the docent's real content arrives it replaces this wholesale; do not edit these items into
 * shape.
 *
 * Format (item counts, option counts, the four Schrijven shapes, the four Spreken onderdelen and
 * their image rules) follows DUO's published practice exams, which is allowed — counting items and
 * copying a layout is not reproducing content. The DUO material itself is in `resources/` and is
 * copyright.
 */

/** Marker on every seeded exam title, so admin can never present this as authored content. */
export const TEST_MARKER = 'TESTDATA';

/* ────────────────────────────── LEZEN ────────────────────────────── */
/* 10 stimuli, 25 questions. Mirrors DUO's shape: a text is shared by 1..3 questions. */

export const LEZEN = [
  {
    kind: 'text',
    title: 'Briefje van de buren',
    section: 'Correspondentie',
    body_html: `<p>Hoi,</p><p>Wij gaan zaterdag verhuizen. De verhuiswagen staat dan voor de deur,
      van 8 uur tot ongeveer 2 uur. Kun je die dag je auto ergens anders parkeren? Dan kunnen wij
      de wagen goed neerzetten.</p><p>Bedankt alvast!</p><p>Sander en Lotte, nummer 14</p>`,
    questions: [
      {
        prompt: 'Wat willen Sander en Lotte?',
        options: [
          'Dat de buurman zijn auto ergens anders zet.',
          'Dat de buurman helpt met verhuizen.',
          'Dat de buurman zaterdag thuis blijft.',
        ],
        correct: 0,
        explanation: 'In de brief staat: "Kun je die dag je auto ergens anders parkeren?"',
      },
      {
        prompt: 'Hoe lang staat de verhuiswagen er ongeveer?',
        options: ['Twee uur.', 'Zes uur.', 'De hele dag en nacht.'],
        correct: 1,
        explanation: 'Van 8 uur tot ongeveer 2 uur is zes uur.',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Advertentie fietsenwinkel',
    section: 'Advertenties',
    body_html: `<p><strong>Fietsen Van Dijk — opruiming</strong></p><p>Alle tweedehands fietsen
      met 20% korting. Deze week ook gratis controle van je remmen. Wij zijn open van maandag tot
      zaterdag, van 9.00 tot 17.30 uur. Op zondag zijn wij gesloten.</p>`,
    questions: [
      {
        prompt: 'Wat krijgt u deze week gratis?',
        options: ['Een nieuwe fiets.', 'Een controle van de remmen.', 'Een fietsslot.'],
        correct: 1,
        explanation: '"Deze week ook gratis controle van je remmen."',
      },
      {
        prompt: 'Wanneer is de winkel dicht?',
        options: ['Op maandag.', 'Op zaterdag.', 'Op zondag.'],
        correct: 2,
        explanation: '"Op zondag zijn wij gesloten."',
      },
      {
        prompt: 'Hoeveel korting krijgt u op een tweedehands fiets?',
        options: ['10%', '20%', '30%'],
        correct: 1,
        explanation: '"Alle tweedehands fietsen met 20% korting."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'E-mail van de school',
    section: 'Correspondentie',
    body_html: `<p>Geachte ouders,</p><p>Op woensdag 12 maart gaan de kinderen van groep 5 naar
      het museum. Wij vertrekken om 9.00 uur met de bus en zijn om 15.00 uur weer terug op school.
      Uw kind neemt zelf eten en drinken mee. Een jas is verstandig, want we lopen ook buiten.</p>
      <p>Met vriendelijke groet,<br>Meester Bram</p>`,
    questions: [
      {
        prompt: 'Wat moet het kind zelf meenemen?',
        options: ['Geld voor de bus.', 'Eten en drinken.', 'Een boek.'],
        correct: 1,
        explanation: '"Uw kind neemt zelf eten en drinken mee."',
      },
      {
        prompt: 'Hoe gaan de kinderen naar het museum?',
        options: ['Met de bus.', 'Met de trein.', 'Op de fiets.'],
        correct: 0,
        explanation: '"Wij vertrekken om 9.00 uur met de bus."',
      },
      {
        prompt: 'Waarom is een jas verstandig?',
        options: [
          'Omdat het museum koud is.',
          'Omdat de kinderen ook buiten lopen.',
          'Omdat het altijd regent in maart.',
        ],
        correct: 1,
        explanation: '"Een jas is verstandig, want we lopen ook buiten."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Mededeling in de flat',
    section: 'Mededelingen',
    body_html: `<p><strong>Let op: lift buiten gebruik</strong></p><p>Van maandag 3 juni tot en met
      woensdag 5 juni werken monteurs aan de lift. U kunt in die dagen alleen de trap gebruiken.
      Woont u op de vijfde of zesde verdieping en kunt u geen trap lopen? Bel dan de beheerder:
      020 555 12 34.</p>`,
    questions: [
      {
        prompt: 'Hoeveel dagen werkt de lift niet?',
        options: ['Twee dagen.', 'Drie dagen.', 'Vijf dagen.'],
        correct: 1,
        explanation: 'Van maandag 3 juni tot en met woensdag 5 juni zijn drie dagen.',
      },
      {
        prompt: 'Wie moet de beheerder bellen?',
        options: [
          'Iedereen die in de flat woont.',
          'Bewoners hoog in de flat die geen trap kunnen lopen.',
          'Alleen de monteurs.',
        ],
        correct: 1,
        explanation:
          '"Woont u op de vijfde of zesde verdieping en kunt u geen trap lopen? Bel dan de beheerder."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Brief van de tandarts',
    section: 'Correspondentie',
    body_html: `<p>Beste mevrouw El Amrani,</p><p>U hebt een afspraak op dinsdag 8 april om 14.15
      uur. Kunt u niet komen? Bel ons dan minstens 24 uur van tevoren. Anders moeten wij de
      afspraak in rekening brengen.</p><p>Tandartspraktijk De Wit</p>`,
    questions: [
      {
        prompt: 'Wat moet mevrouw El Amrani doen als zij niet kan komen?',
        options: [
          'Minstens 24 uur van tevoren bellen.',
          'Een nieuwe brief schrijven.',
          'Op een andere dag langskomen.',
        ],
        correct: 0,
        explanation: '"Bel ons dan minstens 24 uur van tevoren."',
      },
      {
        prompt: 'Wat gebeurt er als zij te laat afzegt?',
        options: [
          'Zij mag niet meer komen.',
          'Zij moet de afspraak betalen.',
          'Zij krijgt een nieuwe afspraak.',
        ],
        correct: 1,
        explanation: '"Anders moeten wij de afspraak in rekening brengen."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Folder van de bibliotheek',
    section: 'Informatieve teksten',
    body_html: `<p><strong>Taalcafé in de bibliotheek</strong></p><p>Wilt u Nederlands spreken met
      andere mensen? Kom naar het taalcafé. Elke donderdag van 10.00 tot 11.30 uur. U hoeft zich
      niet aan te melden en het is gratis. Er is altijd een vrijwilliger die met u praat. Koffie en
      thee staan klaar.</p>`,
    questions: [
      {
        prompt: 'Wat kost het taalcafé?',
        options: ['Niets.', 'Twee euro.', 'Dat staat niet in de tekst.'],
        correct: 0,
        explanation: '"U hoeft zich niet aan te melden en het is gratis."',
      },
      {
        prompt: 'Moet u zich aanmelden?',
        options: ['Ja, per e-mail.', 'Ja, aan de balie.', 'Nee, dat is niet nodig.'],
        correct: 2,
        explanation: '"U hoeft zich niet aan te melden."',
      },
      {
        prompt: 'Wat is het doel van het taalcafé?',
        options: [
          'Nederlands spreken met andere mensen.',
          'Boeken lenen zonder pas.',
          'Een cursus met een examen volgen.',
        ],
        correct: 0,
        explanation: '"Wilt u Nederlands spreken met andere mensen? Kom naar het taalcafé."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Bericht van de werkgever',
    section: 'Correspondentie',
    body_html: `<p>Beste medewerkers,</p><p>Vanaf 1 mei beginnen wij een half uur later: om 8.30
      uur in plaats van 8.00 uur. Wij stoppen dan ook een half uur later, om 17.00 uur. De pauze
      blijft van 12.30 tot 13.00 uur.</p><p>Heeft u hier een probleem mee? Kom dan deze week langs
      bij Fatima op kantoor.</p>`,
    questions: [
      {
        prompt: 'Hoe laat begint het werk vanaf 1 mei?',
        options: ['Om 8.00 uur.', 'Om 8.30 uur.', 'Om 9.00 uur.'],
        correct: 1,
        explanation: '"Vanaf 1 mei beginnen wij een half uur later: om 8.30 uur."',
      },
      {
        prompt: 'Wat verandert er niet?',
        options: ['De begintijd.', 'De eindtijd.', 'De pauze.'],
        correct: 2,
        explanation: '"De pauze blijft van 12.30 tot 13.00 uur."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Instructie waspoeder',
    section: 'Instructies',
    body_html: `<p><strong>Gebruik</strong></p><p>Doe één maatbeker poeder in de machine. Bij erg
      vuile was: twee maatbekers. Was witte kleren op 60 graden. Was gekleurde kleren op 40 graden.
      Niet gebruiken voor wol.</p>`,
    questions: [
      {
        prompt: 'Hoeveel poeder gebruikt u bij erg vuile was?',
        options: ['Eén maatbeker.', 'Twee maatbekers.', 'Drie maatbekers.'],
        correct: 1,
        explanation: '"Bij erg vuile was: twee maatbekers."',
      },
      {
        prompt: 'Waarvoor mag u dit poeder niet gebruiken?',
        options: ['Voor witte kleren.', 'Voor gekleurde kleren.', 'Voor wol.'],
        correct: 2,
        explanation: '"Niet gebruiken voor wol."',
      },
      {
        prompt: 'Op welke temperatuur wast u gekleurde kleren?',
        options: ['Op 30 graden.', 'Op 40 graden.', 'Op 60 graden.'],
        correct: 1,
        explanation: '"Was gekleurde kleren op 40 graden."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Bord bij het zwembad',
    section: 'Mededelingen',
    body_html: `<p><strong>Regels zwembad</strong></p><p>Kinderen onder de 8 jaar alleen met een
      volwassene. Eerst douchen, dan het water in. Niet duiken in het kleine bad. Eten en drinken
      alleen in het restaurant.</p>`,
    questions: [
      {
        prompt: 'Wat moet u doen voordat u het water in gaat?',
        options: ['Douchen.', 'Uw kaartje laten zien.', 'Uw kind afmelden.'],
        correct: 0,
        explanation: '"Eerst douchen, dan het water in."',
      },
      {
        prompt: 'Waar mag u eten?',
        options: ['Bij het kleine bad.', 'In het restaurant.', 'In de kleedkamer.'],
        correct: 1,
        explanation: '"Eten en drinken alleen in het restaurant."',
      },
    ],
  },
  {
    kind: 'text',
    title: 'Bericht van de gemeente',
    section: 'Informatieve teksten',
    body_html: `<p><strong>Grof afval</strong></p><p>Heeft u een oude bank of kast? Die mag niet bij
      het gewone afval. U kunt grof afval zelf naar de milieustraat brengen aan de Ringweg 3. Dat is
      gratis. Wilt u dat de gemeente het ophaalt? Dat kost 25 euro. Maak dan een afspraak via de
      website.</p>`,
    questions: [
      {
        prompt: 'Wat kost het als u het grof afval zelf wegbrengt?',
        options: ['Niets.', '25 euro.', '50 euro.'],
        correct: 0,
        explanation: '"U kunt grof afval zelf naar de milieustraat brengen... Dat is gratis."',
      },
      {
        prompt: 'Wat moet u doen als de gemeente het afval moet ophalen?',
        options: [
          'Een afspraak maken via de website.',
          'Het afval bij het gewone afval zetten.',
          'Naar de Ringweg 3 gaan.',
        ],
        correct: 0,
        explanation: '"Maak dan een afspraak via de website."',
      },
      {
        prompt: 'Waar is de milieustraat?',
        options: ['Aan de Ringweg 3.', 'Bij het gemeentehuis.', 'Dat staat er niet.'],
        correct: 0,
        explanation: '"...naar de milieustraat brengen aan de Ringweg 3."',
      },
    ],
  },
];

/* ──────────────────────────── LUISTEREN ──────────────────────────── */
/* 10 audio stimuli, 25 questions. `script` is what gets sent to ElevenLabs; `voice_cast` records
   the casting so a regeneration does not silently recast — gender must match the names. */

export const LUISTEREN = [
  {
    title: 'Bij de huisarts',
    section: 'Gesprekken',
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Huisartsenpraktijk Molenwijk, goedemorgen.'],
      ['B', 'Goedemorgen, u spreekt met Youssef Bakkali. Ik wil graag een afspraak maken.'],
      ['A', 'Kan het vrijdag om tien over half elf?'],
      ['B', 'Vrijdag werk ik. Kan het ook later op de dag?'],
      ['A', 'Om kwart voor vier is er nog plek.'],
      ['B', 'Dat is goed, dank u wel.'],
    ],
    questions: [
      {
        prompt: 'Waarom belt Youssef?',
        options: ['Om een afspraak te maken.', 'Om een afspraak af te zeggen.', 'Om medicijnen te vragen.'],
        correct: 0,
        explanation: 'Hij zegt: "Ik wil graag een afspraak maken."',
      },
      {
        prompt: 'Hoe laat komt Youssef?',
        options: ['Om 10.30 uur.', 'Om 15.45 uur.', 'Om 16.15 uur.'],
        correct: 1,
        explanation: '"Om kwart voor vier is er nog plek." Dat is 15.45 uur.',
      },
      {
        prompt: 'Waarom kan hij niet in de ochtend?',
        options: ['Hij moet werken.', 'Hij is ziek.', 'Hij heeft geen vervoer.'],
        correct: 0,
        explanation: '"Vrijdag werk ik."',
      },
    ],
  },
  {
    title: 'Omroep op het station',
    section: 'Mededelingen',
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Beste reizigers. De trein naar Utrecht van 14.20 uur vertrekt vandaag niet van spoor 5, maar van spoor 8. De trein heeft ongeveer tien minuten vertraging. Onze excuses.',
      ],
    ],
    questions: [
      {
        prompt: 'Van welk spoor vertrekt de trein?',
        options: ['Van spoor 5.', 'Van spoor 8.', 'Van spoor 10.'],
        correct: 1,
        explanation: '"...vertrekt vandaag niet van spoor 5, maar van spoor 8."',
      },
      {
        prompt: 'Hoeveel vertraging heeft de trein?',
        options: ['Ongeveer tien minuten.', 'Ongeveer twintig minuten.', 'Geen vertraging.'],
        correct: 0,
        explanation: '"De trein heeft ongeveer tien minuten vertraging."',
      },
    ],
  },
  {
    title: 'In de supermarkt',
    section: 'Gesprekken',
    voice_cast: { A: 'man_older', B: 'woman_young' },
    lines: [
      ['A', 'Pardon, weet u waar de rijst staat?'],
      ['B', 'Ja, in gangpad vier, naast de pasta.'],
      ['A', 'Dank u. En hebben jullie ook bruine rijst?'],
      ['B', 'Die is helaas uitverkocht. Morgen komt er nieuwe.'],
    ],
    questions: [
      {
        prompt: 'Waar staat de rijst?',
        options: ['In gangpad twee.', 'In gangpad vier.', 'Bij de kassa.'],
        correct: 1,
        explanation: '"Ja, in gangpad vier, naast de pasta."',
      },
      {
        prompt: 'Wat is er niet meer?',
        options: ['Witte rijst.', 'Bruine rijst.', 'Pasta.'],
        correct: 1,
        explanation: '"Die is helaas uitverkocht" — over de bruine rijst.',
      },
      {
        prompt: 'Wanneer komt er nieuwe voorraad?',
        options: ['Vandaag.', 'Morgen.', 'Volgende week.'],
        correct: 1,
        explanation: '"Morgen komt er nieuwe."',
      },
    ],
  },
  {
    title: 'Voicemail van een vriendin',
    section: 'Gesprekken',
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Hoi Sara, met Lin. Ik sta morgen bij de ingang van het park, bij de grote poort. Neem je zwemkleding mee, want het wordt warm. Tot morgen om twee uur!',
      ],
    ],
    questions: [
      {
        prompt: 'Waar spreken Lin en Sara af?',
        options: ['Bij het zwembad.', 'Bij de ingang van het park.', 'Bij Lin thuis.'],
        correct: 1,
        explanation: '"Ik sta morgen bij de ingang van het park, bij de grote poort."',
      },
      {
        prompt: 'Wat moet Sara meenemen?',
        options: ['Zwemkleding.', 'Eten.', 'Een paraplu.'],
        correct: 0,
        explanation: '"Neem je zwemkleding mee, want het wordt warm."',
      },
      {
        prompt: 'Hoe laat spreken ze af?',
        options: ['Om twaalf uur.', 'Om twee uur.', 'Om vier uur.'],
        correct: 1,
        explanation: '"Tot morgen om twee uur!"',
      },
    ],
  },
  {
    title: 'Op het gemeentehuis',
    section: 'Gesprekken',
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Goedemiddag, ik kom mijn nieuwe paspoort ophalen.'],
      ['B', 'Heeft u uw oude paspoort meegenomen?'],
      ['A', 'Nee, dat ligt thuis. Is dat een probleem?'],
      ['B', 'Ja, dat heb ik echt nodig. U moet het helaas even halen.'],
    ],
    questions: [
      {
        prompt: 'Wat komt de man doen?',
        options: [
          'Een nieuw paspoort aanvragen.',
          'Zijn nieuwe paspoort ophalen.',
          'Zijn oude paspoort inleveren.',
        ],
        correct: 1,
        explanation: '"Ik kom mijn nieuwe paspoort ophalen."',
      },
      {
        prompt: 'Wat is het probleem?',
        options: [
          'Hij heeft zijn oude paspoort niet bij zich.',
          'Het paspoort is nog niet klaar.',
          'Hij is te laat.',
        ],
        correct: 0,
        explanation: '"Nee, dat ligt thuis."',
      },
      {
        prompt: 'Wat moet de man nu doen?',
        options: [
          'Zijn oude paspoort thuis ophalen.',
          'Een nieuwe foto laten maken.',
          'Morgen terugkomen.',
        ],
        correct: 0,
        explanation: '"U moet het helaas even halen."',
      },
    ],
  },
  {
    title: 'Weerbericht',
    section: 'Mededelingen',
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Het weer voor morgen. In de ochtend is het droog en koud, ongeveer vier graden. In de middag komt er regen uit het westen. Het waait dan hard. Neem dus een jas mee.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoe is het weer in de ochtend?',
        options: ['Droog en koud.', 'Nat en warm.', 'Zonnig en warm.'],
        correct: 0,
        explanation: '"In de ochtend is het droog en koud."',
      },
      {
        prompt: 'Wanneer gaat het regenen?',
        options: ['In de ochtend.', 'In de middag.', 'In de nacht.'],
        correct: 1,
        explanation: '"In de middag komt er regen uit het westen."',
      },
    ],
  },
  {
    title: 'Bij de kinderopvang',
    section: 'Gesprekken',
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Meneer De Vries? Uw dochter heeft vandaag goed gegeten, maar ze was wel moe.'],
      ['B', 'Ze heeft vannacht slecht geslapen.'],
      ['A', 'Dat verklaart het. Ze heeft twee uur geslapen vanmiddag.'],
      ['B', 'Fijn, dank u.'],
    ],
    questions: [
      {
        prompt: 'Hoe was de dochter vandaag?',
        options: ['Moe.', 'Ziek.', 'Boos.'],
        correct: 0,
        explanation: '"...maar ze was wel moe."',
      },
      {
        prompt: 'Waarom was zij zo?',
        options: [
          'Ze heeft niet gegeten.',
          'Ze heeft slecht geslapen.',
          'Ze heeft te veel gespeeld.',
        ],
        correct: 1,
        explanation: '"Ze heeft vannacht slecht geslapen."',
      },
    ],
  },
  {
    title: 'Telefoon van de verhuurder',
    section: 'Gesprekken',
    voice_cast: { A: 'man_older', B: 'woman_young' },
    lines: [
      ['A', 'Goedemorgen, u spreekt met meneer Jansen van Wonen Plus. Ik bel over uw kraan.'],
      ['B', 'O fijn, die lekt al een week.'],
      ['A', 'De loodgieter komt donderdagochtend tussen negen en elf. Bent u thuis?'],
      ['B', 'Donderdag werk ik tot twaalf uur. Kan het vrijdag?'],
      ['A', 'Vrijdag om negen uur kan ook.'],
    ],
    questions: [
      {
        prompt: 'Waarover belt meneer Jansen?',
        options: ['Over de huur.', 'Over een kraan die lekt.', 'Over de buren.'],
        correct: 1,
        explanation: '"Ik bel over uw kraan." — "die lekt al een week."',
      },
      {
        prompt: 'Wanneer komt de loodgieter uiteindelijk?',
        options: ['Donderdagochtend.', 'Vrijdagochtend.', 'Volgende week.'],
        correct: 1,
        explanation: '"Vrijdag om negen uur kan ook."',
      },
      {
        prompt: 'Waarom kan donderdag niet?',
        options: ['Zij moet werken.', 'Zij is op vakantie.', 'De loodgieter kan niet.'],
        correct: 0,
        explanation: '"Donderdag werk ik tot twaalf uur."',
      },
    ],
  },
  {
    title: 'Mededeling in de bus',
    section: 'Mededelingen',
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Beste passagiers, door werkzaamheden rijdt deze bus niet langs de Kerkstraat. Wilt u naar de Kerkstraat? Stap dan uit bij het ziekenhuis en loop vijf minuten.',
      ],
    ],
    questions: [
      {
        prompt: 'Waar rijdt de bus niet langs?',
        options: ['Langs het ziekenhuis.', 'Langs de Kerkstraat.', 'Langs het station.'],
        correct: 1,
        explanation: '"...rijdt deze bus niet langs de Kerkstraat."',
      },
      {
        prompt: 'Wat moet u doen om bij de Kerkstraat te komen?',
        options: [
          'Uitstappen bij het ziekenhuis en lopen.',
          'In de bus blijven zitten.',
          'Een andere bus nemen.',
        ],
        correct: 0,
        explanation: '"Stap dan uit bij het ziekenhuis en loop vijf minuten."',
      },
    ],
  },
  {
    title: 'Op de taalcursus',
    section: 'Gesprekken',
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Volgende week is er geen les op maandag. De school is dan dicht.'],
      ['B', 'Halen we die les in?'],
      ['A', 'Ja, op woensdag, van zes tot acht uur \'s avonds.'],
      ['B', 'Dat is prima voor mij.'],
    ],
    questions: [
      {
        prompt: 'Waarom is er geen les op maandag?',
        options: ['De school is dicht.', 'De docent is ziek.', 'Er zijn te weinig cursisten.'],
        correct: 0,
        explanation: '"De school is dan dicht."',
      },
      {
        prompt: 'Wanneer is de extra les?',
        options: [
          'Woensdagavond van zes tot acht.',
          'Woensdagochtend van zes tot acht.',
          'Er komt geen extra les.',
        ],
        correct: 0,
        explanation: '"Ja, op woensdag, van zes tot acht uur \'s avonds."',
      },
    ],
  },
];

/* ──────────────────────────── SCHRIJVEN ──────────────────────────── */
/* The four shapes DUO uses. `image_usage` stays 'none' — a CHECK forbids it on Schrijven. */

export const SCHRIJVEN = [
  {
    task_type: 'email',
    title: 'E-mail naar de taalschool',
    prompt_html:
      '<p>U wilt met een taalcursus beginnen. Schrijf een e-mail naar de taalschool.</p>',
    bullet_points: [
      'Vertel waarom u de cursus wilt doen',
      'Vertel op welke dagen u kunt',
      'Vraag wat de cursus kost',
    ],
    email_to: 'info@taalschoolcentrum.nl',
    email_subject: 'Vraag over de cursus Nederlands',
    greeting: 'Geachte heer/mevrouw,',
    closing: 'Met vriendelijke groet,',
    model_answer:
      'Geachte heer/mevrouw, Ik wil graag beginnen met een cursus Nederlands. Ik werk in een ' +
      'restaurant en ik wil beter met de gasten kunnen praten. Ik kan op maandagavond en op ' +
      'woensdagavond komen. In het weekend werk ik. Kunt u mij vertellen wat de cursus kost? ' +
      'En kan ik in september beginnen? Met vriendelijke groet, Amina Haddad',
  },
  {
    task_type: 'short_text',
    title: 'Een berichtje voor je buurvrouw',
    prompt_html:
      '<p>U gaat een week op vakantie. Uw buurvrouw geeft de planten water. Schrijf een berichtje ' +
      'voor haar. Schrijf minimaal drie zinnen.</p>',
    bullet_points: [
      'Vertel wanneer u weg bent',
      'Vertel wat zij moet doen',
      'Bedank haar',
    ],
    min_sentences: 3,
    model_answer:
      'Lieve Anja, Ik ben van zaterdag tot volgende zondag op vakantie. Wil je twee keer per week ' +
      'de planten water geven? De sleutel ligt bij mijn zus. Heel erg bedankt voor je hulp! Groetjes, Karim',
  },
  {
    task_type: 'form',
    title: 'Aanmelden voor de sportclub',
    prompt_html: '<p>U wilt lid worden van een sportclub. Vul het formulier in.</p>',
    bullet_points: [],
    form_schema: {
      sections: [
        {
          title: 'Persoonsgegevens',
          fields: [
            { key: 'achternaam', label: 'Achternaam', type: 'text' },
            { key: 'voornaam', label: 'Voornaam', type: 'text' },
            { key: 'geboortedatum', label: 'Geboortedatum', type: 'text', placeholder: 'dd-mm-jjjj' },
            { key: 'adres', label: 'Straat en huisnummer', type: 'text' },
            { key: 'postcode', label: 'Postcode en woonplaats', type: 'text' },
            { key: 'telefoon', label: 'Telefoonnummer', type: 'text' },
          ],
        },
        {
          title: 'Uw sport',
          fields: [
            {
              key: 'sport',
              label: 'Welke sport wilt u doen?',
              type: 'radio',
              options: ['Zwemmen', 'Voetbal', 'Tennis'],
            },
            {
              key: 'dag',
              label: 'Op welke dag kunt u?',
              type: 'radio',
              options: ['Maandag', 'Woensdag', 'Zaterdag'],
            },
          ],
        },
      ],
    },
    model_answer:
      'Alle velden zijn ingevuld met kloppende gegevens; bij beide keuzevragen is één optie gekozen.',
  },
  {
    task_type: 'picture_note',
    title: 'Bericht over de fiets',
    prompt_html:
      '<p>Kijk naar de plaatjes. Uw fiets was heel, en nu is hij stuk. Schrijf een bericht aan de ' +
      'fietsenmaker. Schrijf minimaal drie zinnen.</p>',
    bullet_points: ['Vertel wat er gebeurd is', 'Vraag of hij de fiets kan maken', 'Vraag wat het kost'],
    min_sentences: 3,
    images: [
      { caption: 'heel', group_label: 'voor', seed: 'bike-ok' },
      { caption: 'stuk', group_label: 'na', seed: 'bike-broken' },
    ],
    model_answer:
      'Goedemiddag, Gisteren is mijn fiets omgevallen. Het voorwiel is nu krom en de rem doet niet ' +
      'meer. Kunt u mijn fiets maken? En hoeveel gaat dat ongeveer kosten? Met vriendelijke groet, Nadia',
  },
];

/* ───────────────────────────── SPREKEN ───────────────────────────── */
/* Four onderdelen of four tasks. Onderdeel 1 uses audio + a still image instead of DUO's video —
   an owner decision recorded in CLAUDE.md, not an omission. */

export const SPREKEN_PARTS = [
  {
    title: 'Onderdeel 1: vragen bij een gesprek',
    instruction_html:
      '<p>U hoort een korte vraag. Geef antwoord in hele zinnen. U heeft 60 seconden per vraag.</p>',
    image_usage: 'none',
    tasks: [
      { prompt: 'Vertel eens: waar woont u en hoe lang woont u daar al?', images: 0 },
      { prompt: 'Wat doet u het liefst op een vrije dag? Vertel waarom.', images: 0 },
      { prompt: 'Hoe gaat u meestal naar uw werk of naar school? Vertel er iets over.', images: 0 },
      { prompt: 'Wat vindt u van het weer in Nederland? Leg uit waarom.', images: 0 },
    ],
  },
  {
    title: 'Onderdeel 2: vragen met 1 plaatje',
    instruction_html: '<p>U ziet één plaatje. Gebruik steeds het plaatje in uw antwoord.</p>',
    image_usage: 'describe',
    tasks: [
      { prompt: 'Wat ziet u op het plaatje? Vertel wat de mensen doen.', images: 1, seed: 'markt' },
      { prompt: 'Wat gebeurt er op dit plaatje? Vertel wat u ziet.', images: 1, seed: 'wachtkamer' },
      { prompt: 'Beschrijf dit plaatje. Waar zijn deze mensen?', images: 1, seed: 'keuken' },
      { prompt: 'Vertel wat u op dit plaatje ziet en wat er misgaat.', images: 1, seed: 'regen' },
    ],
  },
  {
    title: 'Onderdeel 3: kies één plaatje',
    instruction_html:
      '<p>U ziet twee plaatjes. U kiest steeds één plaatje en legt uit waarom u dat kiest.</p>',
    image_usage: 'choose',
    tasks: [
      { prompt: 'Waar gaat u liever naartoe in de vakantie? Kies één plaatje en leg uit waarom.', images: 2, seed: 'vakantie' },
      { prompt: 'Welk huis zou u kiezen om in te wonen? Leg uit waarom.', images: 2, seed: 'huis' },
      { prompt: 'Welke sport zou u willen doen? Kies één plaatje en vertel waarom.', images: 2, seed: 'sport' },
      { prompt: 'Welk cadeau geeft u aan een vriend? Kies er één en leg uit waarom.', images: 2, seed: 'cadeau' },
    ],
  },
  {
    title: 'Onderdeel 4: gebruik alle plaatjes',
    instruction_html:
      '<p>U ziet drie plaatjes. Vertel een verhaal en gebruik alle plaatjes.</p>',
    image_usage: 'cover_all',
    tasks: [
      { prompt: 'Vertel wat er gebeurt. Gebruik alle drie de plaatjes.', images: 3, seed: 'ochtend' },
      { prompt: 'Vertel het verhaal van deze dag. Gebruik alle plaatjes.', images: 3, seed: 'verjaardag' },
      { prompt: 'Vertel wat deze persoon doet. Gebruik alle plaatjes.', images: 3, seed: 'boodschappen' },
      { prompt: 'Vertel wat er misgaat en hoe het eindigt. Gebruik alle plaatjes.', images: 3, seed: 'verhuizen' },
    ],
  },
];
