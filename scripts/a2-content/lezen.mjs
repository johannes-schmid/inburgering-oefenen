/**
 * Lezen A2 — ten oefenexamens of 25 vragen over tien teksten.
 *
 * ## Shape, from DUO's own player
 * Two panes. Left: a one-sentence scenario naming a person, then the fixed instruction "Lees eerst
 * de vraag. / Lees daarna de tekst.", then the text — which is usually *structured* (a heading with
 * bullets, a numbered tip list, a specificatietabel, an openingstijden block) and runs 70–200 words.
 * Right: one vraag at a time, with **3 or 4** very short, parallel options. Both option counts occur
 * inside a single exam.
 *
 * The question is a 1–2 line scenario stem naming a person, followed by a wh-question — "Jamie
 * heeft volgende week een belangrijk examen. Wat moet hij volgens de tekst het eerste doen?" —
 * because DUO tests whether the candidate can find the answer *for somebody with a purpose*, not
 * whether they can recite the text. Distractors are near-miss facts from the text, "Dat staat niet
 * in de tekst.", and Ja/Nee-plus-reason.
 *
 * All of that is format, taken from `resources/exam-references/A2/Reading/`. DUO's material is
 * copyright and secret; every text and every vraag below is written from scratch.
 *
 * `section` is a `sections.slug` for (a2, lezen): advertentie, brief, formulier-lezen, folder,
 * regels, artikel. It drives the tekstsoort chips in /admin/exams and `exam_structure_summary()`,
 * so the six are spread across each exam rather than clustered.
 */

/** DUO's fixed left-pane instruction, after the scenario line. */
const READ_FIRST = 'Lees eerst de vraag. Lees daarna de tekst.';
const intro = scenario => `${scenario} ${READ_FIRST}`;

/* ───────────────────────────── oefenexamen 1 ───────────────────────────── */

const EXAM_1 = [
  {
    title: 'Briefje van de buren',
    section: 'brief',
    intro: intro('Daan vindt een briefje van zijn buren in de bus.'),
    body_html:
      '<p>Hoi Daan,</p>' +
      '<p>Wij gaan zaterdag verhuizen. De verhuiswagen staat dan voor de deur, van 8 uur tot ' +
      'ongeveer 2 uur. Kun je die dag je auto ergens anders parkeren? Dan kunnen wij de wagen ' +
      'goed neerzetten.</p>' +
      '<p>Zondag geven wij een klein afscheidsfeestje in de tuin, vanaf 3 uur. Je bent van harte ' +
      'welkom. Je hoeft niets mee te nemen.</p>' +
      '<p>Bedankt alvast!</p><p>Sander en Lotte, nummer 14</p>',
    questions: [
      {
        prompt: 'Wat willen Sander en Lotte dat Daan zaterdag doet?',
        options: ['zijn auto ergens anders zetten', 'helpen met verhuizen', 'de hele dag thuisblijven'],
        correct: 0,
        explanation: 'In het briefje staat: "Kun je die dag je auto ergens anders parkeren?"',
      },
      {
        prompt: 'Hoe lang staat de verhuiswagen er ongeveer?',
        options: ['twee uur', 'zes uur', 'de hele dag en nacht'],
        correct: 1,
        explanation: 'Van 8 uur tot ongeveer 2 uur is zes uur.',
      },
      {
        prompt: 'Daan wil naar het feestje komen. Wat moet hij meenemen?',
        options: ['iets te eten', 'iets te drinken', 'niets', 'een cadeau'],
        correct: 2,
        explanation: 'Er staat: "Je hoeft niets mee te nemen."',
      },
    ],
  },
  {
    title: 'Fietsenwinkel De Trapper',
    section: 'advertentie',
    intro: intro('Miriam zoekt een tweedehands fiets. Ze ziet deze advertentie.'),
    body_html:
      '<h3>Fietsenwinkel De Trapper — opruiming</h3>' +
      '<p>Alle tweedehands fietsen deze maand met korting!</p>' +
      '<ul>' +
      '<li>Damesfiets, 3 versnellingen — <strong>€ 95</strong> (was € 130)</li>' +
      '<li>Herenfiets, 7 versnellingen — <strong>€ 140</strong></li>' +
      '<li>Kinderfiets, 20 inch — <strong>€ 45</strong></li>' +
      '</ul>' +
      '<p>Bij elke fiets krijgt u gratis een slot. Wij repareren uw fiets ook: kleine reparaties ' +
      'klaar terwijl u wacht.</p>' +
      '<p>Open: dinsdag tot en met zaterdag, 9.00–17.30 uur. Maandag gesloten.</p>',
    questions: [
      {
        prompt: 'Miriam wil een damesfiets kopen. Hoeveel betaalt zij nu?',
        options: ['€ 45', '€ 95', '€ 130'],
        correct: 1,
        explanation: 'De damesfiets kost nu € 95; € 130 was de oude prijs.',
      },
      {
        prompt: 'Wat krijgt Miriam gratis bij de fiets?',
        options: ['een slot', 'een pomp', 'een reparatie'],
        correct: 0,
        explanation: '"Bij elke fiets krijgt u gratis een slot."',
      },
      {
        prompt: 'Miriam kan alleen op maandag. Kan zij dan naar de winkel?',
        options: [
          'Ja, de winkel is elke dag open.',
          'Nee, op maandag is de winkel dicht.',
          'Ja, maar alleen in de ochtend.',
        ],
        correct: 1,
        explanation: 'Er staat: "Maandag gesloten."',
      },
    ],
  },
  {
    title: 'Brief van de tandarts',
    section: 'brief',
    intro: intro('Sabrina krijgt een brief van de tandartspraktijk.'),
    body_html:
      '<p>Geachte mevrouw Yilmaz,</p>' +
      '<p>U heeft een afspraak voor controle op <strong>dinsdag 14 mei om 9.20 uur</strong>.</p>' +
      '<p>Wilt u uw verzekeringspas meenemen? Zonder pas kunnen wij u niet helpen.</p>' +
      '<p>Kunt u niet komen? Bel dan minimaal 24 uur van tevoren. Belt u later af, dan brengen ' +
      'wij € 25 in rekening.</p>' +
      '<p>Met vriendelijke groet,<br>Tandartspraktijk Molenwijk</p>',
    questions: [
      {
        prompt: 'Wat moet Sabrina meenemen naar de afspraak?',
        options: ['haar verzekeringspas', 'haar paspoort', 'geld'],
        correct: 0,
        explanation: '"Wilt u uw verzekeringspas meenemen?"',
      },
      {
        prompt: 'Sabrina kan niet komen. Wanneer moet zij uiterlijk bellen?',
        options: ['een uur van tevoren', 'een dag van tevoren', 'een week van tevoren'],
        correct: 1,
        explanation: 'Minimaal 24 uur van tevoren is een dag van tevoren.',
      },
    ],
  },
  {
    title: 'Mededeling in het wooncomplex',
    section: 'regels',
    intro: intro('In de hal van het gebouw hangt een mededeling.'),
    body_html:
      '<h3>Onderhoud aan de lift</h3>' +
      '<p>Van maandag 3 juni tot en met woensdag 5 juni werkt de lift niet. Wij vervangen de ' +
      'motor.</p>' +
      '<p>Wat betekent dit voor u?</p>' +
      '<ul>' +
      '<li>Gebruik in deze dagen de trap.</li>' +
      '<li>Woont u op de vierde verdieping of hoger en kunt u geen trap lopen? Bel dan de ' +
      'huismeester op 010 – 456 78 90. Hij helpt u met boodschappen.</li>' +
      '<li>Zet geen spullen in het trappenhuis. Dat is gevaarlijk bij brand.</li>' +
      '</ul>' +
      '<p>Vanaf donderdag werkt de lift weer normaal.</p>',
    questions: [
      {
        prompt: 'Hoeveel dagen werkt de lift niet?',
        options: ['twee dagen', 'drie dagen', 'een week'],
        correct: 1,
        explanation: 'Van maandag tot en met woensdag zijn drie dagen.',
      },
      {
        prompt: 'Mevrouw Groen woont op de vijfde verdieping en kan geen trap lopen. Wat moet zij doen?',
        options: ['de huismeester bellen', 'bij de buren wachten', 'zelf boodschappen doen'],
        correct: 0,
        explanation: 'Er staat dat zij dan de huismeester moet bellen; hij helpt met boodschappen.',
      },
    ],
  },
  {
    title: 'E-mail van school',
    section: 'brief',
    intro: intro('Youssef krijgt een e-mail van de school van zijn dochter.'),
    body_html:
      '<p>Beste ouders,</p>' +
      '<p>Op vrijdag 21 juni gaan de kinderen van groep 5 op schoolreisje naar het ' +
      'natuurmuseum.</p>' +
      '<p>De kinderen zijn om 8.30 uur op school. Wij zijn om 16.00 uur weer terug.</p>' +
      '<p>Geef uw kind mee: brood, drinken en een regenjas. Geen geld, want alles is betaald. ' +
      'Snoep is niet toegestaan.</p>' +
      '<p>Wij zoeken nog twee ouders die mee kunnen. Kunt u mee? Stuur dan vóór 10 juni een ' +
      'e-mail naar juf Karin.</p>',
    questions: [
      {
        prompt: 'Wat moet Youssef zijn dochter meegeven?',
        options: ['brood, drinken en een regenjas', 'geld voor het museum', 'snoep en drinken'],
        correct: 0,
        explanation: 'Dat staat er letterlijk; geld en snoep mogen juist niet mee.',
      },
      {
        prompt: 'Youssef wil meegaan met het schoolreisje. Wat moet hij doen?',
        options: [
          'op 21 juni om 8.30 uur op school zijn',
          'vóór 10 juni een e-mail naar juf Karin sturen',
          'juf Karin bellen op de dag zelf',
        ],
        correct: 1,
        explanation: '"Kunt u mee? Stuur dan vóór 10 juni een e-mail naar juf Karin."',
      },
      {
        prompt: 'Hoe laat zijn de kinderen weer terug op school?',
        options: ['om 8.30 uur', 'om 15.00 uur', 'om 16.00 uur', 'om 17.30 uur'],
        correct: 2,
        explanation: '"Wij zijn om 16.00 uur weer terug."',
      },
    ],
  },
  {
    title: 'Folder van de bibliotheek',
    section: 'folder',
    intro: intro('Lin krijgt een folder van de bibliotheek in de bus.'),
    body_html:
      '<h3>Nieuw: het Taalcafé</h3>' +
      '<p>Wilt u meer Nederlands spreken? Kom naar het Taalcafé in de bibliotheek.</p>' +
      '<ul>' +
      '<li>Elke woensdag van 10.00 tot 11.30 uur</li>' +
      '<li>Gratis, ook als u geen lid bent</li>' +
      '<li>U hoeft zich niet aan te melden</li>' +
      '<li>Koffie en thee staan klaar</li>' +
      '</ul>' +
      '<p>U praat in kleine groepjes met vrijwilligers over alledaagse onderwerpen: werk, ' +
      'boodschappen, gezondheid. Iedereen mag meedoen, ook beginners.</p>',
    questions: [
      {
        prompt: 'Lin is geen lid van de bibliotheek. Kan zij naar het Taalcafé?',
        options: [
          'Ja, het is voor iedereen gratis.',
          'Nee, alleen leden mogen komen.',
          'Ja, maar zij moet dan betalen.',
        ],
        correct: 0,
        explanation: '"Gratis, ook als u geen lid bent."',
      },
      {
        prompt: 'Wat moet Lin doen voordat zij komt?',
        options: ['zich aanmelden', 'koffie meenemen', 'niets'],
        correct: 2,
        explanation: 'Er staat: "U hoeft zich niet aan te melden."',
      },
      {
        prompt: 'Waar praten de mensen in het Taalcafé over?',
        options: ['gewone onderwerpen uit het dagelijks leven', 'het nieuws uit de krant', 'grammatica'],
        correct: 0,
        explanation: 'Er staat: over werk, boodschappen en gezondheid — alledaagse onderwerpen.',
      },
    ],
  },
  {
    title: 'Bericht van de huisarts',
    section: 'brief',
    intro: intro('Meneer El Amrani krijgt een bericht van zijn huisarts.'),
    body_html:
      '<p>Geachte heer El Amrani,</p>' +
      '<p>De uitslag van uw bloedonderzoek is binnen. Alles ziet er goed uit. U hoeft niet ' +
      'terug te komen voor een gesprek.</p>' +
      '<p>Wel adviseren wij u om minder zout te eten en elke dag een half uur te bewegen.</p>' +
      '<p>Over zes maanden krijgt u vanzelf een oproep voor nieuw onderzoek. U hoeft daar niets ' +
      'voor te doen.</p>',
    questions: [
      {
        prompt: 'Wat is de uitslag van het onderzoek?',
        options: ['goed', 'niet goed', 'nog niet bekend'],
        correct: 0,
        explanation: '"Alles ziet er goed uit."',
      },
      {
        prompt: 'Wat moet meneer El Amrani doen voor het volgende onderzoek?',
        options: ['zelf een afspraak maken', 'niets, hij krijgt een oproep', 'over zes maanden bellen'],
        correct: 1,
        explanation: '"Over zes maanden krijgt u vanzelf een oproep. U hoeft daar niets voor te doen."',
      },
    ],
  },
  {
    title: 'Regels van het zwembad',
    section: 'regels',
    intro: intro('Bij de ingang van het zwembad hangen de regels.'),
    body_html:
      '<h3>Huisregels zwembad De Golf</h3>' +
      '<ol>' +
      '<li>Douche altijd voordat u het water in gaat.</li>' +
      '<li>Kinderen onder de 8 jaar zwemmen alleen met een volwassene.</li>' +
      '<li>Eten en drinken mag alleen in het restaurant.</li>' +
      '<li>Rennen langs het bad is verboden. De vloer is glad.</li>' +
      '<li>Gebruik een kluisje voor uw spullen. Het zwembad is niet aansprakelijk voor ' +
      'diefstal.</li>' +
      '</ol>' +
      '<p>Luistert u niet naar de badmeester? Dan moet u het zwembad verlaten.</p>',
    questions: [
      {
        prompt: 'Fatima wil met haar zoon van 6 jaar zwemmen. Wat is de regel?',
        options: [
          'Hij mag alleen zwemmen als zij meegaat het water in.',
          'Hij mag alleen zwemmen met een diploma.',
          'Hij mag niet zwemmen.',
        ],
        correct: 0,
        explanation: 'Kinderen onder de 8 zwemmen alleen samen met een volwassene.',
      },
      {
        prompt: 'Waarom mag je niet rennen bij het bad?',
        options: ['de vloer is glad', 'het is te druk', 'het stoort andere mensen'],
        correct: 0,
        explanation: 'Er staat: "Rennen langs het bad is verboden. De vloer is glad."',
      },
      {
        prompt: 'Waar mag u iets eten?',
        options: ['bij het bad', 'in de kleedkamer', 'in het restaurant'],
        correct: 2,
        explanation: '"Eten en drinken mag alleen in het restaurant."',
      },
    ],
  },
  {
    title: 'Aanmeldformulier sportclub',
    section: 'formulier-lezen',
    intro: intro('Karim wil lid worden van een sportclub en leest het formulier.'),
    body_html:
      '<h3>Inschrijfformulier Sportclub Sprint</h3>' +
      '<p>Vul dit formulier volledig in en lever het in bij de balie.</p>' +
      '<ul>' +
      '<li><strong>Contributie:</strong> € 22 per maand. Jeugd tot 18 jaar betaalt € 14.</li>' +
      '<li><strong>Inschrijfgeld:</strong> eenmalig € 15.</li>' +
      '<li><strong>Betaling:</strong> alleen per automatische incasso. Vul daarom uw ' +
      'rekeningnummer in.</li>' +
      '<li><strong>Opzeggen:</strong> per e-mail, minimaal één maand van tevoren.</li>' +
      '</ul>' +
      '<p>Let op: u kunt de eerste twee weken gratis meetrainen. U schrijft zich pas daarna in.</p>',
    questions: [
      {
        prompt: 'Karims dochter is 15 jaar. Hoeveel contributie betaalt zij per maand?',
        options: ['€ 14', '€ 15', '€ 22'],
        correct: 0,
        explanation: 'Jeugd tot 18 jaar betaalt € 14 per maand.',
      },
      {
        prompt: 'Hoe moet Karim de contributie betalen?',
        options: ['contant aan de balie', 'met automatische incasso', 'per maand overmaken'],
        correct: 1,
        explanation: '"Betaling: alleen per automatische incasso."',
      },
    ],
  },
  {
    title: 'Tips om beter te slapen',
    section: 'artikel',
    intro: intro('In een folder van de huisarts staan tips over slapen.'),
    body_html:
      '<h3>Beter slapen? Probeer dit</h3>' +
      '<ol>' +
      '<li>Ga elke dag rond dezelfde tijd naar bed, ook in het weekend.</li>' +
      '<li>Drink na het avondeten geen koffie meer.</li>' +
      '<li>Leg uw telefoon een uur voor het slapen weg.</li>' +
      '<li>Zorg dat uw slaapkamer koel en donker is.</li>' +
      '</ol>' +
      '<p>Slaapt u na vier weken nog steeds slecht? Maak dan een afspraak met uw huisarts. Neem ' +
      'een lijstje mee waarop u een week lang opschrijft hoe laat u slaapt.</p>',
    questions: [
      {
        prompt: 'Anke slaapt al twee maanden slecht. Wat moet zij volgens de tekst doen?',
        options: [
          'nog vier weken wachten',
          'een afspraak maken bij de huisarts',
          'later naar bed gaan',
        ],
        correct: 1,
        explanation: 'Na vier weken slecht slapen adviseert de tekst een afspraak met de huisarts.',
      },
      {
        prompt: 'Wat moet Anke meenemen naar de huisarts?',
        options: ['haar telefoon', 'een lijstje van een week', 'medicijnen'],
        correct: 1,
        explanation: '"Neem een lijstje mee waarop u een week lang opschrijft hoe laat u slaapt."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 2 ───────────────────────────── */

const EXAM_2 = [
  {
    title: 'Advertentie: bijbaan gezocht',
    section: 'advertentie',
    intro: intro('Layla zoekt werk voor naast haar studie en ziet deze advertentie.'),
    body_html:
      '<h3>Bakkerij Van Loon zoekt een verkoopmedewerker</h3>' +
      '<p>Wij zoeken iemand voor de zaterdag, van 7.00 tot 13.00 uur.</p>' +
      '<ul>' +
      '<li>Je helpt klanten en vult het brood aan.</li>' +
      '<li>Je bent minimaal 16 jaar.</li>' +
      '<li>Ervaring is niet nodig; wij leren het je.</li>' +
      '<li>Loon: € 11,50 per uur.</li>' +
      '</ul>' +
      '<p>Interesse? Loop binnen met je cv of mail naar werken@bakkerijvanloon.nl. Bellen kan ook, ' +
      'maar niet tussen 8 en 10 uur; dan is het te druk.</p>',
    questions: [
      {
        prompt: 'Layla heeft nog nooit in een winkel gewerkt. Kan zij solliciteren?',
        options: ['Ja, ervaring is niet nodig.', 'Nee, ervaring is verplicht.', 'Alleen als zij 18 is.'],
        correct: 0,
        explanation: '"Ervaring is niet nodig; wij leren het je."',
      },
      {
        prompt: 'Hoeveel uur werkt zij op zaterdag?',
        options: ['vier uur', 'zes uur', 'acht uur'],
        correct: 1,
        explanation: 'Van 7.00 tot 13.00 uur is zes uur.',
      },
      {
        prompt: 'Layla wil bellen. Wanneer kan dat niet?',
        options: ['tussen 8 en 10 uur', 'op zaterdag', 'na 13 uur'],
        correct: 0,
        explanation: '"Bellen kan ook, maar niet tussen 8 en 10 uur."',
      },
    ],
  },
  {
    title: 'Brief van de gemeente',
    section: 'brief',
    intro: intro('Meneer Diallo krijgt een brief van de gemeente.'),
    body_html:
      '<p>Geachte heer Diallo,</p>' +
      '<p>Uw paspoort verloopt op 12 augustus. U kunt vanaf nu een nieuw paspoort aanvragen.</p>' +
      '<p>Maak eerst een afspraak via onze website of bel 14 010. U kunt niet zonder afspraak ' +
      'langskomen.</p>' +
      '<p>Neem mee: uw oude paspoort en één recente pasfoto. Een paspoort kost € 83,85 en u ' +
      'betaalt bij de aanvraag, met uw pas.</p>' +
      '<p>Na vijf werkdagen kunt u het paspoort ophalen.</p>',
    questions: [
      {
        prompt: 'Wat moet meneer Diallo als eerste doen?',
        options: ['een afspraak maken', 'naar het stadhuis gaan', 'een pasfoto laten maken'],
        correct: 0,
        explanation: '"Maak eerst een afspraak" — zonder afspraak kan hij niet langskomen.',
      },
      {
        prompt: 'Wanneer betaalt hij voor het paspoort?',
        options: ['bij de aanvraag', 'bij het ophalen', 'achteraf per rekening'],
        correct: 0,
        explanation: '"U betaalt bij de aanvraag, met uw pas."',
      },
    ],
  },
  {
    title: 'Folder van het buurthuis',
    section: 'folder',
    intro: intro('In het buurthuis ligt een folder over activiteiten.'),
    body_html:
      '<h3>Activiteiten in buurthuis De Brug</h3>' +
      '<ul>' +
      '<li><strong>Maandag 19.00 uur</strong> — Samen koken. € 5 per keer, inclusief eten.</li>' +
      '<li><strong>Woensdag 14.00 uur</strong> — Computerhulp. Gratis. Neem uw eigen laptop mee.</li>' +
      '<li><strong>Donderdag 10.00 uur</strong> — Wandelgroep. Gratis. Vertrek vanaf de ' +
      'voordeur.</li>' +
      '<li><strong>Zaterdag 13.00 uur</strong> — Kinderclub, 6 t/m 12 jaar. € 2 per kind.</li>' +
      '</ul>' +
      '<p>Aanmelden hoeft niet, behalve voor Samen koken: geef u uiterlijk zondag op bij de balie.</p>',
    questions: [
      {
        prompt: 'Bilal wil mee met Samen koken. Wat moet hij doen?',
        options: [
          'zich uiterlijk zondag opgeven',
          'op maandag gewoon komen',
          'de dag zelf bellen',
        ],
        correct: 0,
        explanation: 'Alleen voor Samen koken moet je je opgeven, uiterlijk zondag.',
      },
      {
        prompt: 'Welke activiteit is gratis?',
        options: ['Samen koken', 'de kinderclub', 'de wandelgroep'],
        correct: 2,
        explanation: 'De wandelgroep en de computerhulp zijn gratis; de andere twee kosten geld.',
      },
      {
        prompt: 'Wat moet u meenemen naar de computerhulp?',
        options: ['€ 5', 'uw eigen laptop', 'niets'],
        correct: 1,
        explanation: '"Gratis. Neem uw eigen laptop mee."',
      },
    ],
  },
  {
    title: 'Regels voor ziekmelden',
    section: 'regels',
    intro: intro('Felicity werkt bij een schoonmaakbedrijf. Dit zijn de regels voor ziekmelden.'),
    body_html:
      '<h3>Ziek? Zo meldt u zich af</h3>' +
      '<p><em>Hoe meld ik mij ziek?</em><br>Bel vóór 7.00 uur naar de planning: 088 – 200 30 40. ' +
      'Een appje of een e-mail telt niet.</p>' +
      '<p><em>Wie bel ik als de planning niet opneemt?</em><br>Spreek de voicemail in met uw naam ' +
      'en uw adres van die dag.</p>' +
      '<p><em>Hoe lang blijf ik afgemeld?</em><br>U belt elke dag opnieuw, tot u weer beter bent.</p>' +
      '<p><em>Wanneer moet ik naar de bedrijfsarts?</em><br>Bent u langer dan een week ziek, dan ' +
      'nodigt de bedrijfsarts u uit. U krijgt daarover een brief.</p>',
    questions: [
      {
        prompt: 'Felicity is ziek. Hoe moet zij zich melden?',
        options: [
          'door vóór 7.00 uur te bellen',
          'door een appje te sturen',
          'door een e-mail te sturen',
        ],
        correct: 0,
        explanation: 'Bellen vóór 7.00 uur; een appje of e-mail telt niet.',
      },
      {
        prompt: 'Felicity is drie dagen ziek. Hoe vaak belt zij?',
        options: ['één keer', 'elke dag', 'alleen de eerste en de laatste dag'],
        correct: 1,
        explanation: '"U belt elke dag opnieuw, tot u weer beter bent."',
      },
    ],
  },
  {
    title: 'E-mail over de bestelling',
    section: 'brief',
    intro: intro('Hanna heeft een kast besteld en krijgt een e-mail.'),
    body_html:
      '<p>Beste Hanna Meijer,</p>' +
      '<p>Bedankt voor uw bestelling (nummer 88214). Wij bezorgen uw kast op ' +
      '<strong>donderdag 6 juni tussen 13.00 en 17.00 uur</strong>.</p>' +
      '<p>Zorgt u ervoor dat er iemand thuis is? Wij zetten de kast in de kamer die u aanwijst, ' +
      'maar wij monteren hem niet.</p>' +
      '<p>Komt de datum niet uit? Verzet de bezorging tot uiterlijk twee dagen van tevoren via de ' +
      'link in deze e-mail.</p>',
    questions: [
      {
        prompt: 'Wat doen de bezorgers wel?',
        options: [
          'de kast in de kamer zetten',
          'de kast in elkaar zetten',
          'de oude kast meenemen',
        ],
        correct: 0,
        explanation: 'Zij zetten hem in de kamer, maar monteren hem niet.',
      },
      {
        prompt: 'Hanna kan op 6 juni niet. Tot wanneer kan zij de bezorging verzetten?',
        options: ['tot 4 juni', 'tot 5 juni', 'tot 6 juni’s ochtends'],
        correct: 0,
        explanation: 'Uiterlijk twee dagen van tevoren, dus tot 4 juni.',
      },
      {
        prompt: 'Wanneer wordt de kast bezorgd?',
        options: ['in de ochtend', 'in de middag', 'in de avond', 'dat staat niet in de tekst'],
        correct: 1,
        explanation: 'Tussen 13.00 en 17.00 uur is in de middag.',
      },
    ],
  },
  {
    title: 'Openingstijden van het zwembad',
    section: 'formulier-lezen',
    intro: intro('Sami kijkt naar de openingstijden van het zwembad.'),
    body_html:
      '<h3>Zwembad De Golf — openingstijden</h3>' +
      '<ul>' +
      '<li>Maandag t/m vrijdag: 7.00–9.00 uur (banenzwemmen) en 15.00–20.00 uur</li>' +
      '<li>Zaterdag: 9.00–17.00 uur</li>' +
      '<li>Zondag: 10.00–15.00 uur</li>' +
      '</ul>' +
      '<p>Woensdagmiddag van 14.00 tot 16.00 uur is het bad alleen voor zwemles. Er is dan geen ' +
      'vrij zwemmen.</p>' +
      '<p>Tarieven: volwassenen € 6,20, kinderen tot 12 jaar € 4,10. Een kaart voor tien keer ' +
      'kost € 52.</p>',
    questions: [
      {
        prompt: 'Sami wil op woensdag om 15.00 uur vrij zwemmen. Kan dat?',
        options: [
          'Nee, dan is er alleen zwemles.',
          'Ja, het bad is dan open voor iedereen.',
          'Ja, maar alleen voor kinderen.',
        ],
        correct: 0,
        explanation: 'Woensdag van 14.00 tot 16.00 uur is het bad alleen voor zwemles.',
      },
      {
        prompt: 'Sami gaat met zijn zoon van 10 jaar. Wat betalen zij samen?',
        options: ['€ 8,20', '€ 10,30', '€ 12,40'],
        correct: 1,
        explanation: '€ 6,20 voor Sami en € 4,10 voor zijn zoon is samen € 10,30.',
      },
    ],
  },
  {
    title: 'Advertentie: kamer te huur',
    section: 'advertentie',
    intro: intro('Tomasz zoekt een kamer en leest deze advertentie.'),
    body_html:
      '<h3>Kamer te huur — Bloemstraat</h3>' +
      '<p>Nette kamer van 16 m² op de tweede verdieping. Keuken en badkamer deelt u met twee ' +
      'andere bewoners.</p>' +
      '<ul>' +
      '<li>Huur: € 520 per maand, inclusief gas, water en licht</li>' +
      '<li>Internet: € 15 per maand extra</li>' +
      '<li>Beschikbaar vanaf 1 september</li>' +
      '<li>Niet roken, geen huisdieren</li>' +
      '</ul>' +
      '<p>Alleen reacties per e-mail. Vermeld uw leeftijd en uw werk. Bezichtigen kan op ' +
      'woensdagavond.</p>',
    questions: [
      {
        prompt: 'Wat zit bij de huur van € 520 inbegrepen?',
        options: ['gas, water en licht', 'internet', 'het gebruik van de keuken alleen'],
        correct: 0,
        explanation: 'Internet kost € 15 extra; gas, water en licht zitten erbij.',
      },
      {
        prompt: 'Tomasz heeft een kat. Kan hij hier wonen?',
        options: ['Ja, huisdieren mogen.', 'Nee, huisdieren mogen niet.', 'Alleen met toestemming.'],
        correct: 1,
        explanation: 'Er staat: "geen huisdieren".',
      },
      {
        prompt: 'Hoe moet Tomasz reageren?',
        options: ['per e-mail', 'per telefoon', 'door langs te gaan'],
        correct: 0,
        explanation: '"Alleen reacties per e-mail."',
      },
    ],
  },
  {
    title: 'Bericht over de container',
    section: 'regels',
    intro: intro('Bij de containers hangt een bericht van de gemeente.'),
    body_html:
      '<h3>Nieuwe regels voor grofvuil</h3>' +
      '<p>Vanaf 1 juli mag u grofvuil niet meer zomaar naast de container zetten. Wie dat toch ' +
      'doet, krijgt een boete van € 150.</p>' +
      '<p>Wat kunt u wel doen?</p>' +
      '<ul>' +
      '<li>Maak een afspraak via de website. Wij halen uw grofvuil gratis op.</li>' +
      '<li>Of breng het zelf naar de milieustraat aan de Havenweg. Open: dinsdag tot en met ' +
      'zaterdag, 9.00–16.00 uur.</li>' +
      '</ul>' +
      '<p>Klein afval, zoals een kapotte stoel, past soms in de container. Kijk eerst of het ' +
      'past voordat u belt.</p>',
    questions: [
      {
        prompt: 'Wat gebeurt er als u grofvuil naast de container zet?',
        options: ['U krijgt een boete van € 150.', 'De gemeente haalt het op.', 'Er gebeurt niets.'],
        correct: 0,
        explanation: 'Vanaf 1 juli staat daar een boete van € 150 op.',
      },
      {
        prompt: 'Hoeveel kost het ophalen door de gemeente?',
        options: ['niets', '€ 15', '€ 150'],
        correct: 0,
        explanation: '"Wij halen uw grofvuil gratis op."',
      },
    ],
  },
  {
    title: 'Wat te doen bij hitte',
    section: 'artikel',
    intro: intro('In de wijkkrant staat een stuk over warm weer.'),
    body_html:
      '<h3>Het wordt heet: let op elkaar</h3>' +
      '<p>Deze week wordt het meer dan 30 graden. Vooral oudere mensen en jonge kinderen hebben ' +
      'daar last van.</p>' +
      '<ol>' +
      '<li>Drink genoeg water, ook als u geen dorst heeft.</li>' +
      '<li>Doe overdag de gordijnen dicht en zet ’s nachts een raam open.</li>' +
      '<li>Ga tussen 12 en 16 uur niet in de zon sporten of werken.</li>' +
      '<li>Bel of bezoek uw oudere buren even. Vraag of alles goed gaat.</li>' +
      '</ol>' +
      '<p>Voelt iemand zich niet goed en helpt rust en water niet? Bel dan de huisarts.</p>',
    questions: [
      {
        prompt: 'Wat moet u volgens de tekst overdag met de gordijnen doen?',
        options: ['dichtdoen', 'opendoen', 'wassen'],
        correct: 0,
        explanation: '"Doe overdag de gordijnen dicht en zet ’s nachts een raam open."',
      },
      {
        prompt: 'Marja wil gaan hardlopen. Wanneer kan zij dat volgens de tekst beter niet doen?',
        options: ['tussen 12 en 16 uur', 'in de ochtend', 'in de avond'],
        correct: 0,
        explanation: 'Tussen 12 en 16 uur niet in de zon sporten.',
      },
      {
        prompt: 'Wanneer moet u de huisarts bellen?',
        options: [
          'als rust en water niet helpen',
          'als het meer dan 30 graden wordt',
          'als u dorst heeft',
        ],
        correct: 0,
        explanation: '"Voelt iemand zich niet goed en helpt rust en water niet? Bel dan de huisarts."',
      },
    ],
  },
  {
    title: 'Brief van de school',
    section: 'brief',
    intro: intro('De moeder van Amir krijgt een brief over de tienminutengesprekken.'),
    body_html:
      '<p>Beste ouders/verzorgers,</p>' +
      '<p>In de week van 17 juni zijn de tienminutengesprekken. U praat dan met de leerkracht ' +
      'over uw kind.</p>' +
      '<p>U kunt zelf een tijd kiezen via het ouderportaal. Dat kan tot en met vrijdag 7 juni. ' +
      'Kiest u niets, dan krijgt u van ons een tijd toegewezen.</p>' +
      '<p>Lukt het niet om in te loggen? Kom dan even langs bij de administratie; wij helpen u ' +
      'graag.</p>' +
      '<p>De gesprekken zijn in het lokaal van uw kind.</p>',
    questions: [
      {
        prompt: 'Wat gebeurt er als de moeder van Amir geen tijd kiest?',
        options: [
          'Zij krijgt een tijd toegewezen.',
          'Er is dan geen gesprek.',
          'Zij moet bellen.',
        ],
        correct: 0,
        explanation: '"Kiest u niets, dan krijgt u van ons een tijd toegewezen."',
      },
      {
        prompt: 'Zij kan niet inloggen. Wat moet zij doen?',
        options: [
          'langsgaan bij de administratie',
          'de leerkracht mailen',
          'wachten tot 17 juni',
        ],
        correct: 0,
        explanation: '"Kom dan even langs bij de administratie."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 3 ───────────────────────────── */

const EXAM_3 = [
  {
    title: 'Folder over de bibliotheekpas',
    section: 'folder',
    intro: intro('Elif wil lid worden van de bibliotheek en leest de folder.'),
    body_html:
      '<h3>Word lid van de bibliotheek</h3>' +
      '<ul>' +
      '<li>Jeugd tot 18 jaar: <strong>gratis</strong></li>' +
      '<li>Volwassenen: <strong>€ 48 per jaar</strong></li>' +
      '<li>Volwassenen met een stadspas: <strong>€ 24 per jaar</strong></li>' +
      '</ul>' +
      '<p>U mag maximaal tien boeken tegelijk lenen, drie weken lang. Verlengen kan twee keer, ' +
      'behalve bij nieuwe boeken.</p>' +
      '<p>Te laat terug? Dan betaalt u € 0,20 per boek per dag.</p>' +
      '<p>Neem bij inschrijving een identiteitsbewijs mee.</p>',
    questions: [
      {
        prompt: 'Elif is 34 jaar en heeft een stadspas. Wat betaalt zij per jaar?',
        options: ['niets', '€ 24', '€ 48'],
        correct: 1,
        explanation: 'Volwassenen met een stadspas betalen € 24 per jaar.',
      },
      {
        prompt: 'Hoe lang mag Elif een boek houden?',
        options: ['een week', 'twee weken', 'drie weken'],
        correct: 2,
        explanation: 'U mag boeken drie weken lenen.',
      },
      {
        prompt: 'Wat moet Elif meenemen als zij zich inschrijft?',
        options: ['een identiteitsbewijs', 'een pasfoto', 'contant geld'],
        correct: 0,
        explanation: '"Neem bij inschrijving een identiteitsbewijs mee."',
      },
    ],
  },
  {
    title: 'Brief van de verzekering',
    section: 'brief',
    intro: intro('Mevrouw Kowalski krijgt een brief van haar zorgverzekering.'),
    body_html:
      '<p>Geachte mevrouw Kowalski,</p>' +
      '<p>Vanaf 1 januari verandert uw premie. U gaat € 142 per maand betalen in plaats van ' +
      '€ 136.</p>' +
      '<p>Uw eigen risico blijft € 385 per jaar. Dat betekent: de eerste € 385 aan zorgkosten ' +
      'betaalt u zelf. Bezoek aan de huisarts telt hier niet mee.</p>' +
      '<p>Wilt u overstappen naar een andere verzekering? Dat kan tot en met 31 december.</p>',
    questions: [
      {
        prompt: 'Hoeveel gaat mevrouw Kowalski meer betalen per maand?',
        options: ['€ 6', '€ 136', '€ 142'],
        correct: 0,
        explanation: 'Van € 136 naar € 142 is € 6 meer.',
      },
      {
        prompt: 'Zij gaat naar de huisarts. Moet zij dat zelf betalen?',
        options: [
          'Nee, de huisarts telt niet mee voor het eigen risico.',
          'Ja, tot € 385.',
          'Ja, altijd.',
        ],
        correct: 0,
        explanation: '"Bezoek aan de huisarts telt hier niet mee."',
      },
    ],
  },
  {
    title: 'Advertentie: tweedehands meubels',
    section: 'advertentie',
    intro: intro('Rachid zoekt meubels voor zijn nieuwe woning.'),
    body_html:
      '<h3>Kringloopwinkel Tweede Kans</h3>' +
      '<p>Deze maand: <strong>alle banken en kasten 25% korting</strong>.</p>' +
      '<ul>' +
      '<li>Bank, grijs, 3 personen — van € 120 voor € 90</li>' +
      '<li>Eettafel met vier stoelen — € 75</li>' +
      '<li>Boekenkast, wit — van € 40 voor € 30</li>' +
      '</ul>' +
      '<p>Wij bezorgen binnen de stad voor € 20. Buiten de stad kunnen wij helaas niet ' +
      'bezorgen.</p>' +
      '<p>Open: woensdag tot en met zaterdag van 10.00 tot 17.00 uur.</p>',
    questions: [
      {
        prompt: 'Rachid koopt de bank. Wat betaalt hij nu?',
        options: ['€ 75', '€ 90', '€ 120'],
        correct: 1,
        explanation: 'De bank is van € 120 naar € 90 gegaan.',
      },
      {
        prompt: 'Rachid woont buiten de stad. Kan de winkel bezorgen?',
        options: ['Ja, voor € 20.', 'Nee, dat kan niet.', 'Ja, gratis.'],
        correct: 1,
        explanation: '"Buiten de stad kunnen wij helaas niet bezorgen."',
      },
      {
        prompt: 'Op welke dag is de winkel dicht?',
        options: ['woensdag', 'maandag', 'zaterdag'],
        correct: 1,
        explanation: 'De winkel is open van woensdag tot en met zaterdag; maandag dus niet.',
      },
    ],
  },
  {
    title: 'Regels in de wasserette',
    section: 'regels',
    intro: intro('In de wasserette hangen de regels aan de muur.'),
    body_html:
      '<h3>Wasserette Schoon — regels</h3>' +
      '<ol>' +
      '<li>Betaal eerst bij de automaat. U krijgt dan een muntje.</li>' +
      '<li>Doe niet meer dan 7 kilo in één machine.</li>' +
      '<li>Haal uw was direct uit de machine als die klaar is. Anderen wachten.</li>' +
      '<li>Verf en olie mogen niet in de machines.</li>' +
      '</ol>' +
      '<p>De laatste wasbeurt start om 20.30 uur. Om 21.30 uur sluiten wij.</p>' +
      '<p>Iets kapot? Bel 06 – 12 34 56 78. Wij komen dezelfde dag langs.</p>',
    questions: [
      {
        prompt: 'Wat moet u als eerste doen?',
        options: ['betalen bij de automaat', 'de was in de machine doen', 'een muntje lenen'],
        correct: 0,
        explanation: '"Betaal eerst bij de automaat."',
      },
      {
        prompt: 'Hoe laat kan Nour uiterlijk een wasbeurt starten?',
        options: ['om 20.30 uur', 'om 21.00 uur', 'om 21.30 uur'],
        correct: 0,
        explanation: '"De laatste wasbeurt start om 20.30 uur."',
      },
      {
        prompt: 'Er is een machine kapot. Wat gebeurt er als u belt?',
        options: [
          'Er komt dezelfde dag iemand langs.',
          'U krijgt uw geld terug.',
          'De wasserette gaat dicht.',
        ],
        correct: 0,
        explanation: '"Wij komen dezelfde dag langs."',
      },
    ],
  },
  {
    title: 'E-mail van de sportclub',
    section: 'brief',
    intro: intro('Joana krijgt een e-mail van haar sportclub.'),
    body_html:
      '<p>Beste leden,</p>' +
      '<p>In de zomervakantie, van 15 juli tot en met 18 augustus, zijn er geen groepslessen. ' +
      'De zaal blijft wel open voor vrij sporten.</p>' +
      '<p>In september starten wij met twee nieuwe lessen: yoga op dinsdagavond en zwemles voor ' +
      'volwassenen op zaterdagochtend.</p>' +
      '<p>Wilt u meedoen? Zet uw naam op de lijst bij de balie. Vol is vol; er kunnen twaalf ' +
      'mensen per les mee.</p>',
    questions: [
      {
        prompt: 'Wat kan Joana in de zomervakantie doen bij de club?',
        options: ['vrij sporten', 'groepslessen volgen', 'niets, de club is dicht'],
        correct: 0,
        explanation: 'De groepslessen vervallen, maar de zaal blijft open voor vrij sporten.',
      },
      {
        prompt: 'Hoe meldt Joana zich aan voor yoga?',
        options: [
          'door haar naam op de lijst bij de balie te zetten',
          'door te mailen',
          'door in september te komen',
        ],
        correct: 0,
        explanation: '"Zet uw naam op de lijst bij de balie."',
      },
    ],
  },
  {
    title: 'Formulier: aanvraag stadspas',
    section: 'formulier-lezen',
    intro: intro('Meneer Osei leest het formulier voor de stadspas.'),
    body_html:
      '<h3>Aanvraag stadspas</h3>' +
      '<p>Met de stadspas krijgt u korting op sport, cultuur en het openbaar vervoer.</p>' +
      '<p><strong>Wie kan de pas aanvragen?</strong> Inwoners van deze gemeente met een inkomen ' +
      'tot € 1.500 netto per maand.</p>' +
      '<p><strong>Wat stuurt u mee?</strong></p>' +
      '<ul>' +
      '<li>een kopie van uw identiteitsbewijs</li>' +
      '<li>een loonstrook of uitkeringsspecificatie van vorige maand</li>' +
      '</ul>' +
      '<p>U hoort binnen drie weken of u de pas krijgt. De pas is één jaar geldig.</p>',
    questions: [
      {
        prompt: 'Meneer Osei verdient € 1.700 netto per maand. Kan hij de pas aanvragen?',
        options: [
          'Nee, zijn inkomen is te hoog.',
          'Ja, iedereen kan de pas aanvragen.',
          'Ja, maar dan betaalt hij ervoor.',
        ],
        correct: 0,
        explanation: 'De pas is voor inkomens tot € 1.500 netto per maand.',
      },
      {
        prompt: 'Wat moet hij meesturen?',
        options: [
          'een kopie van zijn identiteitsbewijs en een loonstrook',
          'een pasfoto en zijn paspoort',
          'alleen een loonstrook',
        ],
        correct: 0,
        explanation: 'Beide documenten staan in de lijst.',
      },
      {
        prompt: 'Hoe lang is de pas geldig?',
        options: ['drie weken', 'een half jaar', 'een jaar'],
        correct: 2,
        explanation: '"De pas is één jaar geldig."',
      },
    ],
  },
  {
    title: 'Bericht van de huisartsenpost',
    section: 'regels',
    intro: intro('Op de website van de huisartsenpost staat wanneer u mag bellen.'),
    body_html:
      '<h3>Wanneer belt u de huisartsenpost?</h3>' +
      '<p>De huisartsenpost is er voor klachten die niet kunnen wachten tot de volgende werkdag. ' +
      'Wij zijn open van 17.00 tot 8.00 uur en in het weekend.</p>' +
      '<p><em>Bel direct 112</em> bij een ongeluk, bij pijn op de borst of als iemand niet meer ' +
      'reageert.</p>' +
      '<p><em>Bel uw eigen huisarts</em> voor herhaalrecepten, uitslagen en gewone afspraken. ' +
      'Dat kan alleen overdag.</p>' +
      '<p>Kom nooit zonder bellen langs. Wij werken alleen op afspraak.</p>',
    questions: [
      {
        prompt: 'Karin heeft ’s avonds hoge koorts en veel pijn. Wat moet zij doen?',
        options: [
          'de huisartsenpost bellen',
          'de volgende dag haar eigen huisarts bellen',
          'zonder afspraak langsgaan',
        ],
        correct: 0,
        explanation: 'De post is er voor klachten die niet tot de volgende werkdag kunnen wachten.',
      },
      {
        prompt: 'Waarvoor belt u uw eigen huisarts?',
        options: ['voor een herhaalrecept', 'bij een ongeluk', 'bij pijn op de borst'],
        correct: 0,
        explanation: 'Herhaalrecepten, uitslagen en gewone afspraken gaan via de eigen huisarts.',
      },
    ],
  },
  {
    title: 'Advertentie: taalcursus',
    section: 'advertentie',
    intro: intro('Grace ziet een advertentie voor een taalcursus.'),
    body_html:
      '<h3>Nederlands leren bij ROC Centrum</h3>' +
      '<p>Nieuwe groepen starten in september en in februari.</p>' +
      '<ul>' +
      '<li>Twee dagdelen per week, 20 weken</li>' +
      '<li>Overdag of ’s avonds — u kiest zelf</li>' +
      '<li>Kleine groepen: maximaal 14 cursisten</li>' +
      '<li>Kosten: € 395, boeken inbegrepen</li>' +
      '</ul>' +
      '<p>Voor de cursus doet u eerst een korte test. Zo bepalen wij uw niveau. De test is ' +
      'gratis en duurt ongeveer een uur.</p>' +
      '<p>Aanmelden via de website of bel 010 – 555 12 34.</p>',
    questions: [
      {
        prompt: 'Wat moet Grace doen voordat de cursus begint?',
        options: ['een test doen', 'de boeken kopen', 'een gesprek voeren met de docent'],
        correct: 0,
        explanation: '"Voor de cursus doet u eerst een korte test."',
      },
      {
        prompt: 'Wat kost de test?',
        options: ['niets', '€ 395', 'dat staat niet in de tekst'],
        correct: 0,
        explanation: '"De test is gratis en duurt ongeveer een uur."',
      },
      {
        prompt: 'Hoeveel weken duurt de cursus?',
        options: ['veertien weken', 'twintig weken', 'een half jaar', 'twee weken'],
        correct: 1,
        explanation: '"Twee dagdelen per week, 20 weken."',
      },
    ],
  },
  {
    title: 'Tips voor een sollicitatiegesprek',
    section: 'artikel',
    intro: intro('In een folder van het werkplein staan tips over solliciteren.'),
    body_html:
      '<h3>Uw eerste sollicitatiegesprek</h3>' +
      '<ol>' +
      '<li>Kom op tijd. Wees liever tien minuten te vroeg dan één minuut te laat.</li>' +
      '<li>Zoek van tevoren op wat het bedrijf doet. Werkgevers vinden dat belangrijk.</li>' +
      '<li>Bedenk twee vragen die u zelf wilt stellen.</li>' +
      '<li>Praat rustig. U hoeft geen perfect Nederlands te spreken.</li>' +
      '</ol>' +
      '<p>Hoort u een week later niets? Bel dan gerust even. Dat mag en het laat zien dat u ' +
      'geïnteresseerd bent.</p>',
    questions: [
      {
        prompt: 'Hoe laat moet u er volgens de tekst zijn?',
        options: ['tien minuten te vroeg', 'precies op tijd', 'een uur van tevoren'],
        correct: 0,
        explanation: '"Wees liever tien minuten te vroeg dan één minuut te laat."',
      },
      {
        prompt: 'Sonia hoort na een week niets. Wat kan zij doen?',
        options: ['bellen', 'nog een week wachten', 'opnieuw solliciteren'],
        correct: 0,
        explanation: '"Hoort u een week later niets? Bel dan gerust even."',
      },
    ],
  },
  {
    title: 'Brief over de nieuwe container',
    section: 'brief',
    intro: intro('Alle bewoners van de straat krijgen deze brief.'),
    body_html:
      '<p>Beste bewoner,</p>' +
      '<p>In september krijgt u een nieuwe container voor plastic en blik. De container is ' +
      'oranje.</p>' +
      '<p>Wij zetten hem tussen 2 en 6 september bij u voor de deur. U hoeft daar niets voor te ' +
      'doen en het kost u niets.</p>' +
      '<p>De oranje container wordt om de twee weken geleegd, op vrijdag. Zet hem de avond ervoor ' +
      'buiten.</p>' +
      '<p>Heeft u geen plek voor een extra container? Bel dan 14 010; wij zoeken samen een ' +
      'oplossing.</p>',
    questions: [
      {
        prompt: 'Wat moet de bewoner doen om de container te krijgen?',
        options: ['niets', 'bellen', 'betalen'],
        correct: 0,
        explanation: '"U hoeft daar niets voor te doen en het kost u niets."',
      },
      {
        prompt: 'Wanneer wordt de oranje container geleegd?',
        options: ['elke vrijdag', 'om de twee weken op vrijdag', 'elke maand'],
        correct: 1,
        explanation: '"De oranje container wordt om de twee weken geleegd, op vrijdag."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 4 ───────────────────────────── */

const EXAM_4 = [
  {
    title: 'Brief van de werkgever',
    section: 'brief',
    intro: intro('Sabrina krijgt een brief van haar werk over het personeelsuitje.'),
    body_html:
      '<p>Beste collega’s,</p>' +
      '<p>Op vrijdag 12 september gaan wij met het hele team naar het strand van Hoek van ' +
      'Holland.</p>' +
      '<p>Wij vertrekken om 9.00 uur met de bus vanaf het kantoor. Rond 18.00 uur zijn wij weer ' +
      'terug.</p>' +
      '<p>Neem mee: zwemkleding, een handdoek en zonnebrand. Eten en drinken zijn voor onze ' +
      'rekening.</p>' +
      '<p>Kun je niet mee? Geef dat vóór 1 september door aan Miranda.</p>',
    questions: [
      {
        prompt: 'Wat moet Sabrina meenemen naar het personeelsuitje?',
        options: ['zwemkleding', 'eten en drinken', 'geld voor de bus'],
        correct: 0,
        explanation: 'Eten en drinken betaalt het bedrijf; zwemkleding neemt zij zelf mee.',
      },
      {
        prompt: 'Sabrina kan niet mee. Wat moet zij doen?',
        options: [
          'het vóór 1 september aan Miranda doorgeven',
          'op 12 september bellen',
          'niets',
        ],
        correct: 0,
        explanation: '"Geef dat vóór 1 september door aan Miranda."',
      },
      {
        prompt: 'Hoe laat vertrekt de bus?',
        options: ['om 9.00 uur', 'om 12.00 uur', 'om 18.00 uur'],
        correct: 0,
        explanation: '"Wij vertrekken om 9.00 uur met de bus vanaf het kantoor."',
      },
    ],
  },
  {
    title: 'Advertentie: stofzuiger',
    section: 'advertentie',
    intro: intro('Meneer Chen zoekt een stofzuiger voor zijn laminaatvloer.'),
    body_html:
      '<h3>Stofzuiger Vento 2000</h3>' +
      '<table>' +
      '<tr><td>Prijs</td><td>€ 129</td></tr>' +
      '<tr><td>Geschikt voor</td><td>tapijt, laminaat en tegels</td></tr>' +
      '<tr><td>Gewicht</td><td>4,5 kilo</td></tr>' +
      '<tr><td>Snoer</td><td>7 meter</td></tr>' +
      '<tr><td>Garantie</td><td>2 jaar</td></tr>' +
      '</table>' +
      '<p>Op voorraad in onze winkels in Rotterdam en Den Haag. Online bestellen kan ook; ' +
      'bezorging binnen drie werkdagen, gratis boven € 50.</p>',
    questions: [
      {
        prompt: 'Meneer Chen heeft laminaat. Is deze stofzuiger geschikt?',
        options: [
          'Ja, deze stofzuiger is geschikt voor laminaat.',
          'Nee, alleen voor tapijt.',
          'Dat staat niet in de tekst.',
        ],
        correct: 0,
        explanation: 'Bij "Geschikt voor" staat tapijt, laminaat en tegels.',
      },
      {
        prompt: 'Hij bestelt online. Wat betaalt hij voor de bezorging?',
        options: ['niets', '€ 3,95', '€ 50'],
        correct: 0,
        explanation: 'Bezorging is gratis boven € 50; de stofzuiger kost € 129.',
      },
      {
        prompt: 'Hoe lang is de garantie?',
        options: ['een jaar', 'twee jaar', 'drie jaar'],
        correct: 1,
        explanation: 'In de tabel staat: garantie 2 jaar.',
      },
    ],
  },
  {
    title: 'Folder: gezond eten',
    section: 'folder',
    intro: intro('Bij de huisarts ligt een folder over gezond eten.'),
    body_html:
      '<h3>Elke dag genoeg groente en fruit</h3>' +
      '<p>Volwassenen hebben elke dag <strong>250 gram groente</strong> en <strong>2 stuks ' +
      'fruit</strong> nodig.</p>' +
      '<p>Handige tips:</p>' +
      '<ul>' +
      '<li>Neem een stuk fruit mee naar uw werk.</li>' +
      '<li>Diepvriesgroente is net zo gezond als verse groente.</li>' +
      '<li>Drink liever water dan frisdrank.</li>' +
      '</ul>' +
      '<p>Wilt u persoonlijk advies? Vraag uw huisarts om een verwijzing naar de diëtist. Vier ' +
      'gesprekken per jaar worden vergoed.</p>',
    questions: [
      {
        prompt: 'Hoeveel fruit heeft een volwassene per dag nodig?',
        options: ['één stuk', 'twee stuks', '250 gram'],
        correct: 1,
        explanation: '250 gram geldt voor groente; van fruit zijn het twee stuks.',
      },
      {
        prompt: 'Wat zegt de tekst over diepvriesgroente?',
        options: [
          'Die is net zo gezond als verse groente.',
          'Die is minder gezond.',
          'Die is alleen voor de winter.',
        ],
        correct: 0,
        explanation: 'Dat staat er letterlijk.',
      },
      {
        prompt: 'Hoeveel gesprekken met de diëtist worden per jaar vergoed?',
        options: ['twee', 'vier', 'zes'],
        correct: 1,
        explanation: '"Vier gesprekken per jaar worden vergoed."',
      },
    ],
  },
  {
    title: 'Regels op het station',
    section: 'regels',
    intro: intro('Op het station hangt een bord met regels.'),
    body_html:
      '<h3>Op dit station</h3>' +
      '<ul>' +
      '<li>Roken mag alleen bij de gele palen op het perron.</li>' +
      '<li>Fietsen zet u in de stalling, niet tegen het gebouw.</li>' +
      '<li>Honden zijn welkom, maar wel aangelijnd.</li>' +
      '<li>Blijf achter de witte streep tot de trein stilstaat.</li>' +
      '</ul>' +
      '<p>Laat u iets liggen in de trein? Meld dat online bij Gevonden Voorwerpen. Aan de balie ' +
      'kunnen wij u daar niet mee helpen.</p>',
    questions: [
      {
        prompt: 'Waar mag u roken?',
        options: ['bij de gele palen', 'overal op het perron', 'nergens'],
        correct: 0,
        explanation: '"Roken mag alleen bij de gele palen op het perron."',
      },
      {
        prompt: 'Tim is zijn tas in de trein vergeten. Wat moet hij doen?',
        options: [
          'het online melden',
          'naar de balie gaan',
          'de volgende dag terugkomen',
        ],
        correct: 0,
        explanation: 'Aan de balie helpen ze daar niet mee; het gaat online.',
      },
    ],
  },
  {
    title: 'E-mail over de cursus',
    section: 'brief',
    intro: intro('Nour krijgt een e-mail van de taalschool.'),
    body_html:
      '<p>Beste Nour,</p>' +
      '<p>Je bent geplaatst in groep A2-3. De lessen zijn op maandag en woensdag van 19.00 tot ' +
      '21.00 uur, in lokaal 12.</p>' +
      '<p>De eerste les is op maandag 9 september. Kom die dag een kwartier eerder; dan krijg je ' +
      'je boeken en je pasje.</p>' +
      '<p>Kun je een les niet komen? Stuur dan een bericht naar je docent. Bij meer dan vier ' +
      'keer afwezig kun je niet meedoen aan het examen.</p>',
    questions: [
      {
        prompt: 'Hoe laat moet Nour op 9 september komen?',
        options: ['om 18.45 uur', 'om 19.00 uur', 'om 21.00 uur'],
        correct: 0,
        explanation: 'Een kwartier eerder dan 19.00 uur is 18.45 uur.',
      },
      {
        prompt: 'Wat gebeurt er als Nour vijf keer afwezig is?',
        options: [
          'Zij mag niet meedoen aan het examen.',
          'Zij moet de cursus opnieuw betalen.',
          'Er gebeurt niets.',
        ],
        correct: 0,
        explanation: '"Bij meer dan vier keer afwezig kun je niet meedoen aan het examen."',
      },
      {
        prompt: 'In welk lokaal is de les?',
        options: ['lokaal 1', 'lokaal 3', 'lokaal 12'],
        correct: 2,
        explanation: 'De lessen zijn in lokaal 12.',
      },
    ],
  },
  {
    title: 'Formulier: aanmelden schoolzwemmen',
    section: 'formulier-lezen',
    intro: intro('De ouders van Lina lezen het formulier voor schoolzwemmen.'),
    body_html:
      '<h3>Aanmelden schoolzwemmen groep 4</h3>' +
      '<p>Het schoolzwemmen is op donderdagochtend, van januari tot en met juni.</p>' +
      '<p><strong>Kosten:</strong> € 45 voor het hele jaar. Betalen kan in twee delen.</p>' +
      '<p><strong>Wat neemt uw kind mee?</strong> Zwemkleding, een handdoek en een plastic tas.</p>' +
      '<p><strong>Heeft uw kind al een zwemdiploma?</strong> Kruis dat hieronder aan. Kinderen ' +
      'met diploma A zwemmen in een andere groep.</p>' +
      '<p>Lever dit formulier vóór 15 december in bij de leerkracht.</p>',
    questions: [
      {
        prompt: 'Wanneer moet het formulier binnen zijn?',
        options: ['vóór 15 december', 'in januari', 'vóór juni'],
        correct: 0,
        explanation: '"Lever dit formulier vóór 15 december in bij de leerkracht."',
      },
      {
        prompt: 'Lina heeft diploma A. Wat betekent dat?',
        options: [
          'Zij zwemt in een andere groep.',
          'Zij hoeft niet mee te doen.',
          'Zij betaalt minder.',
        ],
        correct: 0,
        explanation: '"Kinderen met diploma A zwemmen in een andere groep."',
      },
    ],
  },
  {
    title: 'Advertentie: fietsenstalling',
    section: 'advertentie',
    intro: intro('Bij het station staat informatie over de fietsenstalling.'),
    body_html:
      '<h3>Bewaakte fietsenstalling Centraal</h3>' +
      '<ul>' +
      '<li>Eerste 24 uur: gratis</li>' +
      '<li>Daarna: € 1,35 per dag</li>' +
      '<li>Abonnement per jaar: € 60</li>' +
      '</ul>' +
      '<p>Open van 5.30 tot 1.00 uur. Buiten deze tijden kunt u uw fiets niet ophalen.</p>' +
      '<p>Staat uw fiets er langer dan vier weken? Dan halen wij hem weg. U kunt hem dan ophalen ' +
      'bij het fietsdepot aan de Industrieweg.</p>',
    questions: [
      {
        prompt: 'Kim zet haar fiets ’s ochtends neer en haalt hem ’s avonds op. Wat betaalt zij?',
        options: ['niets', '€ 1,35', '€ 60'],
        correct: 0,
        explanation: 'De eerste 24 uur zijn gratis.',
      },
      {
        prompt: 'Kim komt om 2.00 uur ’s nachts terug. Kan zij haar fiets ophalen?',
        options: ['Nee, de stalling is dan dicht.', 'Ja, de stalling is altijd open.', 'Ja, tegen betaling.'],
        correct: 0,
        explanation: 'De stalling is open van 5.30 tot 1.00 uur.',
      },
      {
        prompt: 'Wat gebeurt er met een fiets die er vijf weken staat?',
        options: [
          'Die wordt weggehaald naar het fietsdepot.',
          'Die blijft staan.',
          'Daar komt een boete voor.',
        ],
        correct: 0,
        explanation: 'Na vier weken halen zij de fiets weg naar het depot.',
      },
    ],
  },
  {
    title: 'Bericht over de verbouwing',
    section: 'regels',
    intro: intro('In de hal van het appartementengebouw hangt een bericht.'),
    body_html:
      '<h3>Verbouwing van de gang</h3>' +
      '<p>Van maandag 8 tot en met vrijdag 19 april vernieuwen wij de vloer in de gangen.</p>' +
      '<p>Wat vragen wij van u?</p>' +
      '<ul>' +
      '<li>Zet niets in de gang: geen fietsen, geen planten, geen schoenen.</li>' +
      '<li>Werk je thuis? Er wordt gewerkt tussen 8.00 en 16.00 uur en dat geeft geluid.</li>' +
      '<li>De lift blijft gewoon werken.</li>' +
      '</ul>' +
      '<p>Vragen? Spreek de huismeester aan of mail naar beheer@flatdehorizon.nl.</p>',
    questions: [
      {
        prompt: 'Hoe lang duurt de verbouwing?',
        options: ['een week', 'twee weken', 'een maand'],
        correct: 1,
        explanation: 'Van 8 tot en met 19 april is twee werkweken.',
      },
      {
        prompt: 'Werkt de lift tijdens de verbouwing?',
        options: ['Ja, gewoon.', 'Nee, die staat stil.', 'Alleen ’s avonds.'],
        correct: 0,
        explanation: '"De lift blijft gewoon werken."',
      },
    ],
  },
  {
    title: 'Waarom bewegen goed is',
    section: 'artikel',
    intro: intro('In een tijdschrift staat een kort artikel over bewegen.'),
    body_html:
      '<h3>Een half uur per dag is genoeg</h3>' +
      '<p>Veel mensen denken dat je hard moet sporten om gezond te blijven. Dat is niet zo. ' +
      'Een half uur wandelen of fietsen per dag is al genoeg.</p>' +
      '<p>Bewegen helpt tegen stress, u slaapt er beter door en het is goed voor uw hart.</p>' +
      '<p>Het hoeft niet in één keer: drie keer tien minuten telt ook. Neem bijvoorbeeld de trap ' +
      'in plaats van de lift, of stap een halte eerder uit de bus.</p>',
    questions: [
      {
        prompt: 'Hoeveel moet u volgens de tekst per dag bewegen?',
        options: ['tien minuten', 'een half uur', 'een uur'],
        correct: 1,
        explanation: '"Een half uur wandelen of fietsen per dag is al genoeg."',
      },
      {
        prompt: 'Moet dat in één keer?',
        options: [
          'Nee, drie keer tien minuten telt ook.',
          'Ja, anders helpt het niet.',
          'Dat staat niet in de tekst.',
        ],
        correct: 0,
        explanation: '"Het hoeft niet in één keer: drie keer tien minuten telt ook."',
      },
    ],
  },
  {
    title: 'Brief van de bibliotheek',
    section: 'brief',
    intro: intro('Ahmed krijgt een brief van de bibliotheek.'),
    body_html:
      '<p>Geachte heer Rahimi,</p>' +
      '<p>U heeft twee boeken die al drie weken te laat zijn. Wilt u ze zo snel mogelijk ' +
      'terugbrengen?</p>' +
      '<p>De kosten zijn nu € 8,40. Zolang u niet betaalt, kunt u geen nieuwe boeken lenen.</p>' +
      '<p>Bent u een boek kwijt? Meld dat aan de balie. U betaalt dan de prijs van het boek, ' +
      'maar niet de kosten voor te laat.</p>',
    questions: [
      {
        prompt: 'Wat kan Ahmed nu niet doen?',
        options: ['nieuwe boeken lenen', 'de bibliotheek bezoeken', 'boeken terugbrengen'],
        correct: 0,
        explanation: '"Zolang u niet betaalt, kunt u geen nieuwe boeken lenen."',
      },
      {
        prompt: 'Ahmed is één boek kwijt. Wat betaalt hij dan?',
        options: [
          'de prijs van het boek, zonder de kosten voor te laat',
          'alleen de kosten voor te laat',
          'niets',
        ],
        correct: 0,
        explanation: 'Bij verlies betaalt u de prijs van het boek, maar niet de te-laat-kosten.',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 5 ───────────────────────────── */

const EXAM_5 = [
  {
    title: 'Folder van de gemeente over energie',
    section: 'folder',
    intro: intro('Mevrouw Silva krijgt een folder over besparen op energie.'),
    body_html:
      '<h3>Bespaar op uw energierekening</h3>' +
      '<p>De gemeente helpt bewoners met een laag inkomen.</p>' +
      '<ul>' +
      '<li><strong>Gratis energiebox</strong> met ledlampen, tochtstrips en een douchetimer.</li>' +
      '<li><strong>Gratis huisbezoek</strong> van een energiecoach. Hij kijkt waar u kunt ' +
      'besparen.</li>' +
      '<li><strong>Subsidie</strong> tot € 1.500 voor isolatie van uw woning. Alleen voor ' +
      'eigenaren.</li>' +
      '</ul>' +
      '<p>Aanvragen doet u via de website. U heeft daarvoor uw DigiD nodig. Lukt dat niet? Kom ' +
      'dan langs bij het loket op dinsdag- en donderdagochtend.</p>',
    questions: [
      {
        prompt: 'Mevrouw Silva huurt haar woning. Kan zij de subsidie voor isolatie krijgen?',
        options: ['Nee, die is alleen voor eigenaren.', 'Ja, iedereen kan die krijgen.', 'Ja, tot € 1.500.'],
        correct: 0,
        explanation: 'Bij de subsidie staat: "Alleen voor eigenaren."',
      },
      {
        prompt: 'Wat zit er in de energiebox?',
        options: [
          'ledlampen, tochtstrips en een douchetimer',
          'een nieuwe cv-ketel',
          'isolatiemateriaal',
        ],
        correct: 0,
        explanation: 'Dat staat in de eerste bullet.',
      },
      {
        prompt: 'Zij heeft geen DigiD. Wat kan zij doen?',
        options: [
          'langsgaan bij het loket',
          'een brief sturen',
          'wachten tot volgend jaar',
        ],
        correct: 0,
        explanation: '"Lukt dat niet? Kom dan langs bij het loket."',
      },
    ],
  },
  {
    title: 'Brief van de school over de gymles',
    section: 'brief',
    intro: intro('De ouders van Mo krijgen een brief over de gymles.'),
    body_html:
      '<p>Beste ouders,</p>' +
      '<p>Vanaf maandag 6 mei is de gymzaal in ons gebouw gesloten voor onderhoud. De kinderen ' +
      'gymmen dan in sporthal De Ring, tien minuten lopen van school.</p>' +
      '<p>De kinderen lopen samen met de leerkracht heen en terug. U hoeft niets te doen.</p>' +
      '<p>Wilt u uw kind stevige schoenen aandoen op gymdagen? Dat is dinsdag en vrijdag.</p>' +
      '<p>Vanaf 17 juni is onze eigen zaal weer open.</p>',
    questions: [
      {
        prompt: 'Waar gymmen de kinderen vanaf 6 mei?',
        options: ['in sporthal De Ring', 'in de eigen gymzaal', 'buiten op het plein'],
        correct: 0,
        explanation: 'De eigen zaal is dicht; ze gaan naar sporthal De Ring.',
      },
      {
        prompt: 'Hoe komen de kinderen bij de sporthal?',
        options: ['lopend met de leerkracht', 'met de bus', 'de ouders brengen ze'],
        correct: 0,
        explanation: '"De kinderen lopen samen met de leerkracht heen en terug."',
      },
    ],
  },
  {
    title: 'Advertentie: schoonmaakhulp gezocht',
    section: 'advertentie',
    intro: intro('Amira zoekt werk en ziet deze advertentie in de supermarkt.'),
    body_html:
      '<h3>Wie helpt ons in huis?</h3>' +
      '<p>Wij zijn een gezin met twee kinderen en zoeken iemand die drie uur per week ' +
      'schoonmaakt.</p>' +
      '<ul>' +
      '<li>Dag en tijd in overleg, overdag</li>' +
      '<li>€ 16 per uur, contant</li>' +
      '<li>Wij wonen in de wijk Noord, dicht bij bushalte Parkweg</li>' +
      '</ul>' +
      '<p>Wij zoeken iemand die zelfstandig werkt en die al ervaring heeft. Referenties graag.</p>' +
      '<p>Bel of app naar 06 – 24 68 13 57. Liever geen e-mail.</p>',
    questions: [
      {
        prompt: 'Hoeveel verdient Amira per week?',
        options: ['€ 16', '€ 48', '€ 160'],
        correct: 1,
        explanation: 'Drie uur per week × € 16 per uur is € 48.',
      },
      {
        prompt: 'Wat vraagt het gezin?',
        options: ['iemand met ervaring', 'iemand die ’s avonds kan', 'iemand met een auto'],
        correct: 0,
        explanation: '"Wij zoeken iemand die zelfstandig werkt en die al ervaring heeft."',
      },
      {
        prompt: 'Hoe moet Amira reageren?',
        options: ['bellen of appen', 'mailen', 'langsgaan'],
        correct: 0,
        explanation: '"Bel of app… Liever geen e-mail."',
      },
    ],
  },
  {
    title: 'Regels van de speeltuin',
    section: 'regels',
    intro: intro('Bij de ingang van de speeltuin hangen de regels.'),
    body_html:
      '<h3>Speeltuin Het Zonnetje</h3>' +
      '<ul>' +
      '<li>Kinderen tot 10 jaar komen met een volwassene.</li>' +
      '<li>Honden mogen niet in de speeltuin.</li>' +
      '<li>Fietsen zet u buiten het hek.</li>' +
      '<li>Ruim uw eigen afval op; er staan bakken bij de ingang.</li>' +
      '</ul>' +
      '<p>De speeltuin is open van zonsopgang tot zonsondergang. In de winter sluiten wij dus ' +
      'eerder dan in de zomer.</p>' +
      '<p>Iets kapot gezien? Meld het via de app van de gemeente.</p>',
    questions: [
      {
        prompt: 'Mag Ivan met zijn hond de speeltuin in?',
        options: ['Nee, honden mogen er niet in.', 'Ja, als de hond aangelijnd is.', 'Alleen in de winter.'],
        correct: 0,
        explanation: '"Honden mogen niet in de speeltuin."',
      },
      {
        prompt: 'Hoe laat gaat de speeltuin dicht?',
        options: [
          'bij zonsondergang',
          'elke dag om 18.00 uur',
          'dat wisselt per week',
        ],
        correct: 0,
        explanation: '"Open van zonsopgang tot zonsondergang."',
      },
      {
        prompt: 'De schommel is kapot. Wat doet u?',
        options: ['het melden via de app van de gemeente', 'de speeltuin bellen', 'niets'],
        correct: 0,
        explanation: '"Meld het via de app van de gemeente."',
      },
    ],
  },
  {
    title: 'E-mail van de webshop',
    section: 'brief',
    intro: intro('Emine heeft schoenen besteld en krijgt een e-mail.'),
    body_html:
      '<p>Beste Emine,</p>' +
      '<p>Uw bestelling is onderweg. U kunt het pakket volgen met de code in deze e-mail.</p>' +
      '<p>Bent u niet thuis? De bezorger probeert het één keer opnieuw. Daarna ligt het pakket ' +
      'zeven dagen klaar bij een afhaalpunt in de buurt.</p>' +
      '<p>Past het niet? U mag binnen 30 dagen ruilen of terugsturen. De retour is gratis; ' +
      'gebruik het label in de doos.</p>',
    questions: [
      {
        prompt: 'Emine is niet thuis. Wat gebeurt er?',
        options: [
          'De bezorger komt één keer opnieuw.',
          'Het pakket gaat direct terug naar de winkel.',
          'Zij moet zelf bellen.',
        ],
        correct: 0,
        explanation: '"De bezorger probeert het één keer opnieuw."',
      },
      {
        prompt: 'Wat kost het terugsturen?',
        options: ['niets', '€ 6,95', 'dat staat niet in de tekst'],
        correct: 0,
        explanation: '"De retour is gratis; gebruik het label in de doos."',
      },
    ],
  },
  {
    title: 'Formulier: aanvraag bijzondere bijstand',
    section: 'formulier-lezen',
    intro: intro('Meneer Haddad leest een formulier van de gemeente.'),
    body_html:
      '<h3>Aanvraag bijzondere bijstand</h3>' +
      '<p>Bijzondere bijstand is er voor kosten die u niet kunt betalen en die noodzakelijk ' +
      'zijn, bijvoorbeeld een bril of een kapotte wasmachine.</p>' +
      '<p><strong>Let op:</strong> vraag de bijstand aan <em>voordat</em> u de kosten maakt. ' +
      'Achteraf aanvragen kan meestal niet.</p>' +
      '<p>Stuur mee: een offerte of prijsopgave, en de laatste drie bankafschriften.</p>' +
      '<p>Wij nemen binnen acht weken een besluit. Bij spoed kunt u dat op het formulier ' +
      'aangeven.</p>',
    questions: [
      {
        prompt: 'Wanneer moet meneer Haddad de bijstand aanvragen?',
        options: [
          'voordat hij de kosten maakt',
          'nadat hij betaald heeft',
          'binnen acht weken na de aankoop',
        ],
        correct: 0,
        explanation: '"Vraag de bijstand aan voordat u de kosten maakt."',
      },
      {
        prompt: 'Wat moet hij meesturen?',
        options: [
          'een prijsopgave en drie bankafschriften',
          'alleen een kopie van zijn paspoort',
          'een brief van zijn werkgever',
        ],
        correct: 0,
        explanation: 'Dat staat onder "Stuur mee".',
      },
      {
        prompt: 'Hoe lang duurt het besluit?',
        options: ['drie weken', 'acht weken', 'een half jaar'],
        correct: 1,
        explanation: '"Wij nemen binnen acht weken een besluit."',
      },
    ],
  },
  {
    title: 'Advertentie: markt in het park',
    section: 'advertentie',
    intro: intro('In de wijk hangen posters voor een markt.'),
    body_html:
      '<h3>Rommelmarkt in het Westerpark</h3>' +
      '<p>Zaterdag 21 juni van 10.00 tot 16.00 uur.</p>' +
      '<ul>' +
      '<li>Toegang gratis</li>' +
      '<li>Zelf spullen verkopen? Een kraam kost € 12. Reserveer vóór 14 juni.</li>' +
      '<li>Er is een springkussen voor kinderen en er zijn foodtrucks.</li>' +
      '</ul>' +
      '<p>Bij slecht weer gaat de markt niet door. Kijk op de dag zelf op onze website of ' +
      'Facebookpagina.</p>',
    questions: [
      {
        prompt: 'Wat kost het om naar de markt te gaan?',
        options: ['niets', '€ 12', 'dat hangt af van het weer'],
        correct: 0,
        explanation: '"Toegang gratis." De € 12 is voor een eigen kraam.',
      },
      {
        prompt: 'Aïcha wil een kraam. Wanneer moet zij reserveren?',
        options: ['vóór 14 juni', 'vóór 21 juni', 'op de dag zelf'],
        correct: 0,
        explanation: '"Reserveer vóór 14 juni."',
      },
    ],
  },
  {
    title: 'Bericht van de apotheek',
    section: 'regels',
    intro: intro('Bij de apotheek hangt informatie over herhaalrecepten.'),
    body_html:
      '<h3>Herhaalrecepten</h3>' +
      '<p><em>Hoe vraag ik een herhaalrecept aan?</em><br>Via onze website, via de app, of door ' +
      'de lege doosjes in de brievenbus bij de deur te doen.</p>' +
      '<p><em>Hoe lang duurt het?</em><br>Twee werkdagen. Vraag uw medicijnen dus op tijd aan.</p>' +
      '<p><em>Kan ik ze laten bezorgen?</em><br>Ja, voor € 3,50. Bezorgen doen wij op dinsdag en ' +
      'donderdag.</p>' +
      '<p><em>Wat als ik met spoed medicijnen nodig heb?</em><br>Bel ons. Wij overleggen dan met ' +
      'uw huisarts.</p>',
    questions: [
      {
        prompt: 'Hoe lang duurt een herhaalrecept?',
        options: ['één dag', 'twee werkdagen', 'een week'],
        correct: 1,
        explanation: '"Twee werkdagen. Vraag uw medicijnen dus op tijd aan."',
      },
      {
        prompt: 'Op welke dagen bezorgt de apotheek?',
        options: ['maandag en woensdag', 'dinsdag en donderdag', 'elke dag'],
        correct: 1,
        explanation: '"Bezorgen doen wij op dinsdag en donderdag."',
      },
      {
        prompt: 'Wat doet u bij spoed?',
        options: ['de apotheek bellen', 'de doosjes in de bus doen', 'de app gebruiken'],
        correct: 0,
        explanation: '"Bel ons. Wij overleggen dan met uw huisarts."',
      },
    ],
  },
  {
    title: 'Werken en leren tegelijk',
    section: 'artikel',
    intro: intro('In een folder van het werkplein staat een artikel over leren naast je werk.'),
    body_html:
      '<h3>Een diploma halen naast uw baan</h3>' +
      '<p>Steeds meer mensen halen een diploma terwijl ze werken. Dat kan bij een mbo-opleiding ' +
      'in deeltijd: u werkt vier dagen en gaat één dag per week naar school.</p>' +
      '<p>Uw werkgever betaalt soms mee. Vraag ernaar bij uw leidinggevende.</p>' +
      '<p>Voor de meeste opleidingen heeft u taalniveau B1 nodig. Heeft u A2? Volg dan eerst een ' +
      'taalcursus. Het werkplein kan u daarbij helpen.</p>',
    questions: [
      {
        prompt: 'Hoeveel dagen per week gaat u bij een deeltijdopleiding naar school?',
        options: ['één dag', 'twee dagen', 'vier dagen'],
        correct: 0,
        explanation: '"U werkt vier dagen en gaat één dag per week naar school."',
      },
      {
        prompt: 'Jamal heeft taalniveau A2. Wat moet hij volgens de tekst het eerst doen?',
        options: [
          'eerst een taalcursus volgen',
          'meteen met de opleiding beginnen',
          'zijn werkgever om geld vragen',
        ],
        correct: 0,
        explanation: 'Voor de meeste opleidingen is B1 nodig; met A2 volgt u eerst een taalcursus.',
      },
    ],
  },
  {
    title: 'Brief over de huurverhoging',
    section: 'brief',
    intro: intro('Meneer Bakker krijgt een brief van de woningcorporatie.'),
    body_html:
      '<p>Geachte heer Bakker,</p>' +
      '<p>Per 1 juli gaat uw huur omhoog van € 645 naar € 668 per maand.</p>' +
      '<p>Betaalt u met automatische incasso? Dan hoeft u niets te doen; wij passen het bedrag ' +
      'zelf aan.</p>' +
      '<p>Maakt u de huur zelf over? Wijzig dan het bedrag vóór 1 juli.</p>' +
      '<p>Bent u het niet eens met de verhoging? U kunt tot 1 juli bezwaar maken met het ' +
      'formulier op onze website.</p>',
    questions: [
      {
        prompt: 'Meneer Bakker betaalt met automatische incasso. Wat moet hij doen?',
        options: ['niets', 'het bedrag zelf wijzigen', 'bezwaar maken'],
        correct: 0,
        explanation: '"Dan hoeft u niets te doen; wij passen het bedrag zelf aan."',
      },
      {
        prompt: 'Hoeveel gaat de huur omhoog?',
        options: ['€ 23', '€ 645', '€ 668'],
        correct: 0,
        explanation: 'Van € 645 naar € 668 is € 23 meer.',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 6 ───────────────────────────── */

const EXAM_6 = [
  {
    title: 'Brief van het ziekenhuis',
    section: 'brief',
    intro: intro('Mevrouw Nowak krijgt een brief van het ziekenhuis.'),
    body_html:
      '<p>Geachte mevrouw Nowak,</p>' +
      '<p>U heeft een afspraak op de poli Interne Geneeskunde op <strong>dinsdag 4 juni om ' +
      '11.10 uur</strong>. Meldt u zich tien minuten van tevoren bij de aanmeldzuil in hal A.</p>' +
      '<p>Neem mee: uw identiteitsbewijs, uw verzekeringspas en een lijst van uw medicijnen.</p>' +
      '<p>U mag iemand meenemen naar het gesprek. Dat helpt vaak om alles goed te onthouden.</p>' +
      '<p>Kunt u niet komen? Bel dan minimaal 48 uur van tevoren naar 010 – 703 20 00.</p>',
    questions: [
      {
        prompt: 'Hoe laat moet mevrouw Nowak zich melden?',
        options: ['om 11.00 uur', 'om 11.10 uur', 'om 11.20 uur'],
        correct: 0,
        explanation: 'Tien minuten voor 11.10 uur is 11.00 uur.',
      },
      {
        prompt: 'Wat moet zij meenemen?',
        options: [
          'een lijst van haar medicijnen',
          'een verwijsbrief van de tandarts',
          'contant geld',
        ],
        correct: 0,
        explanation: 'Identiteitsbewijs, verzekeringspas en een medicijnenlijst.',
      },
      {
        prompt: 'Zij kan niet komen. Wanneer moet zij uiterlijk bellen?',
        options: ['48 uur van tevoren', '24 uur van tevoren', 'op de dag zelf'],
        correct: 0,
        explanation: '"Bel dan minimaal 48 uur van tevoren."',
      },
    ],
  },
  {
    title: 'Advertentie: bankstel te koop',
    section: 'advertentie',
    intro: intro('Sonia zoekt een tweedehands bank op een website.'),
    body_html:
      '<h3>Bankstel, 2 jaar oud</h3>' +
      '<p>Wegens verhuizing te koop: een grijze bank voor drie personen.</p>' +
      '<ul>' +
      '<li>Afmetingen: 210 × 90 cm</li>' +
      '<li>Prijs: € 180, niet onderhandelbaar</li>' +
      '<li>Kleine vlek op de rechterleuning, verder in goede staat</li>' +
      '<li>Ophalen in Delft, wij bezorgen niet</li>' +
      '</ul>' +
      '<p>Bezichtigen kan doordeweeks na 18.00 uur en in het weekend de hele dag. Stuur een ' +
      'bericht via de site.</p>',
    questions: [
      {
        prompt: 'Sonia wil € 150 betalen. Kan dat?',
        options: [
          'Nee, over de prijs valt niet te praten.',
          'Ja, de prijs is onderhandelbaar.',
          'Alleen bij ophalen.',
        ],
        correct: 0,
        explanation: '"€ 180, niet onderhandelbaar."',
      },
      {
        prompt: 'Hoe komt de bank bij Sonia thuis?',
        options: ['Zij haalt hem zelf op.', 'De verkoper bezorgt hem.', 'Met een bezorgdienst.'],
        correct: 0,
        explanation: '"Ophalen in Delft, wij bezorgen niet."',
      },
      {
        prompt: 'Sonia kan alleen op woensdag om 15.00 uur. Kan zij dan komen kijken?',
        options: [
          'Nee, doordeweeks kan het pas na 18.00 uur.',
          'Ja, doordeweeks kan altijd.',
          'Ja, maar alleen na een bericht.',
        ],
        correct: 0,
        explanation: 'Doordeweeks bezichtigen kan pas na 18.00 uur.',
      },
    ],
  },
  {
    title: 'Folder over de tandarts voor kinderen',
    section: 'folder',
    intro: intro('Bij de tandarts ligt een folder over kinderen en gebitsverzorging.'),
    body_html:
      '<h3>Naar de tandarts met uw kind</h3>' +
      '<ul>' +
      '<li>Kinderen tot 18 jaar zijn <strong>gratis</strong> verzekerd voor de tandarts.</li>' +
      '<li>Kom twee keer per jaar voor controle.</li>' +
      '<li>Poets twee keer per dag, ’s ochtends en voor het slapen.</li>' +
      '<li>Help uw kind met poetsen tot ongeveer tien jaar.</li>' +
      '</ul>' +
      '<p>Is uw kind bang? Zeg dat gerust bij het maken van de afspraak. Wij nemen dan extra ' +
      'tijd en laten eerst alles rustig zien.</p>',
    questions: [
      {
        prompt: 'Wat kost de tandarts voor een kind van 8 jaar?',
        options: ['niets', 'de helft', 'dat staat niet in de tekst'],
        correct: 0,
        explanation: 'Kinderen tot 18 jaar zijn gratis verzekerd.',
      },
      {
        prompt: 'Tot welke leeftijd helpt u uw kind met poetsen?',
        options: ['tot ongeveer zes jaar', 'tot ongeveer tien jaar', 'tot achttien jaar'],
        correct: 1,
        explanation: '"Help uw kind met poetsen tot ongeveer tien jaar."',
      },
    ],
  },
  {
    title: 'Regels voor de gezamenlijke tuin',
    section: 'regels',
    intro: intro('De bewoners van een hofje krijgen de regels voor de tuin.'),
    body_html:
      '<h3>Onze gezamenlijke tuin</h3>' +
      '<ol>' +
      '<li>Iedereen maait om de beurt het gras. Het schema hangt in de berging.</li>' +
      '<li>Barbecueën mag tot 22.00 uur, en niet onder de bomen.</li>' +
      '<li>Kinderen mogen overal spelen, behalve in de moestuin.</li>' +
      '<li>Laat geen speelgoed of stoelen buiten staan in de winter.</li>' +
      '</ol>' +
      '<p>Twee keer per jaar is er een tuindag: in april en in oktober. Dan werken wij samen ' +
      'een ochtend in de tuin. Kunt u niet? Laat het weten aan de tuincommissie.</p>',
    questions: [
      {
        prompt: 'Tot hoe laat mag u barbecueën?',
        options: ['tot 20.00 uur', 'tot 22.00 uur', 'tot middernacht'],
        correct: 1,
        explanation: '"Barbecueën mag tot 22.00 uur."',
      },
      {
        prompt: 'Waar mogen de kinderen niet spelen?',
        options: ['in de moestuin', 'onder de bomen', 'op het gras'],
        correct: 0,
        explanation: '"Kinderen mogen overal spelen, behalve in de moestuin."',
      },
      {
        prompt: 'Hoe vaak per jaar is er een tuindag?',
        options: ['één keer', 'twee keer', 'vier keer'],
        correct: 1,
        explanation: 'In april en in oktober, dus twee keer.',
      },
    ],
  },
  {
    title: 'E-mail van de buurtvereniging',
    section: 'brief',
    intro: intro('Ravi krijgt een e-mail van de buurtvereniging.'),
    body_html:
      '<p>Beste buurtbewoners,</p>' +
      '<p>Op zaterdag 28 september organiseren wij weer de Buurtdag op het Julianaplein, van ' +
      '12.00 tot 17.00 uur.</p>' +
      '<p>Wij zoeken nog vrijwilligers voor het opbouwen (vanaf 10.00 uur) en voor het opruimen ' +
      '(vanaf 17.00 uur).</p>' +
      '<p>Ook zoeken wij mensen die iets willen koken uit hun eigen land. Wij vergoeden de ' +
      'boodschappen tot € 25 per gerecht; bewaar uw bonnetjes.</p>' +
      '<p>Meld u aan via buurtdag@julianaplein.nl.</p>',
    questions: [
      {
        prompt: 'Ravi wil helpen met opbouwen. Hoe laat moet hij er zijn?',
        options: ['om 10.00 uur', 'om 12.00 uur', 'om 17.00 uur'],
        correct: 0,
        explanation: 'Het opbouwen begint om 10.00 uur.',
      },
      {
        prompt: 'Ravi kookt een gerecht. Wat moet hij bewaren?',
        options: ['zijn bonnetjes', 'het recept', 'de e-mail'],
        correct: 0,
        explanation: '"Wij vergoeden de boodschappen tot € 25 per gerecht; bewaar uw bonnetjes."',
      },
    ],
  },
  {
    title: 'Formulier: aanvraag DigiD',
    section: 'formulier-lezen',
    intro: intro('Meneer Sow leest hoe hij een DigiD aanvraagt.'),
    body_html:
      '<h3>DigiD aanvragen</h3>' +
      '<p>Met DigiD logt u in bij de overheid, uw zorgverzekering en uw pensioenfonds.</p>' +
      '<p><strong>Wat heeft u nodig?</strong></p>' +
      '<ul>' +
      '<li>uw burgerservicenummer (BSN)</li>' +
      '<li>een Nederlands adres waar u staat ingeschreven</li>' +
      '<li>een mobiele telefoon</li>' +
      '</ul>' +
      '<p>Na de aanvraag krijgt u binnen vijf werkdagen een brief met een activeringscode. Die ' +
      'code is drie weken geldig.</p>' +
      '<p>DigiD aanvragen is gratis. Geef uw wachtwoord nooit aan iemand anders, ook niet aan ' +
      'de gemeente.</p>',
    questions: [
      {
        prompt: 'Wat heeft meneer Sow nodig voor de aanvraag?',
        options: [
          'zijn BSN, een adres en een mobiele telefoon',
          'zijn paspoort en een pasfoto',
          'een bankrekening',
        ],
        correct: 0,
        explanation: 'Die drie staan in de lijst.',
      },
      {
        prompt: 'Hoe lang is de activeringscode geldig?',
        options: ['vijf werkdagen', 'drie weken', 'een jaar'],
        correct: 1,
        explanation: '"Die code is drie weken geldig."',
      },
      {
        prompt: 'Aan wie mag hij zijn wachtwoord geven?',
        options: ['aan niemand', 'alleen aan de gemeente', 'aan zijn familie'],
        correct: 0,
        explanation: '"Geef uw wachtwoord nooit aan iemand anders, ook niet aan de gemeente."',
      },
    ],
  },
  {
    title: 'Advertentie: zwemlessen voor volwassenen',
    section: 'advertentie',
    intro: intro('Fatou kan niet zwemmen en ziet deze advertentie.'),
    body_html:
      '<h3>Leren zwemmen? Ook op latere leeftijd</h3>' +
      '<p>Speciale lessen voor volwassenen die nooit hebben leren zwemmen.</p>' +
      '<ul>' +
      '<li>Kleine groepen van maximaal zes personen</li>' +
      '<li>Vrouwenlessen op maandagavond, gemengde lessen op woensdagavond</li>' +
      '<li>Twintig lessen voor € 240, in twee keer te betalen</li>' +
      '<li>Rustig tempo; u hoeft niet met uw hoofd onder water</li>' +
      '</ul>' +
      '<p>Eerste les gratis en vrijblijvend. Meld u aan bij de balie van het zwembad.</p>',
    questions: [
      {
        prompt: 'Fatou wil alleen met vrouwen zwemmen. Wanneer kan zij komen?',
        options: ['op maandagavond', 'op woensdagavond', 'dat kan niet'],
        correct: 0,
        explanation: '"Vrouwenlessen op maandagavond."',
      },
      {
        prompt: 'Wat kost de eerste les?',
        options: ['niets', '€ 12', '€ 240'],
        correct: 0,
        explanation: '"Eerste les gratis en vrijblijvend."',
      },
    ],
  },
  {
    title: 'Bericht over de weekmarkt',
    section: 'regels',
    intro: intro('Op het plein hangt een bericht over de markt.'),
    body_html:
      '<h3>Markt verhuist tijdelijk</h3>' +
      '<p>Door werkzaamheden aan het Marktplein staat de weekmarkt van 1 mei tot 15 juli op het ' +
      'Stationsplein.</p>' +
      '<p>De markt is er op dezelfde dagen als altijd: woensdag en zaterdag, van 8.00 tot 16.00 ' +
      'uur.</p>' +
      '<p>Let op: op het Stationsplein is minder ruimte. Er zijn daarom minder kramen dan u ' +
      'gewend bent.</p>' +
      '<p>Parkeren kan in de garage onder het station. De eerste twee uur zijn op marktdagen ' +
      'gratis.</p>',
    questions: [
      {
        prompt: 'Waar staat de markt in juni?',
        options: ['op het Stationsplein', 'op het Marktplein', 'in de parkeergarage'],
        correct: 0,
        explanation: 'Van 1 mei tot 15 juli staat de markt op het Stationsplein.',
      },
      {
        prompt: 'Wat is er anders op het Stationsplein?',
        options: ['Er zijn minder kramen.', 'De markt is er langer open.', 'De markt is er elke dag.'],
        correct: 0,
        explanation: '"Er zijn daarom minder kramen dan u gewend bent."',
      },
      {
        prompt: 'Hoeveel kost het eerste uur parkeren op zaterdag?',
        options: ['niets', '€ 2', '€ 4'],
        correct: 0,
        explanation: 'Op marktdagen zijn de eerste twee uur gratis.',
      },
    ],
  },
  {
    title: 'Hoe werkt de eerste hulp?',
    section: 'artikel',
    intro: intro('In een folder staat uitleg over de eerste hulp in het ziekenhuis.'),
    body_html:
      '<h3>Wachten op de spoedeisende hulp</h3>' +
      '<p>Op de spoedeisende hulp komt niet iedereen op volgorde van binnenkomst aan de beurt. ' +
      'Een verpleegkundige kijkt eerst hoe ernstig uw klacht is.</p>' +
      '<p>Wie er het ergst aan toe is, wordt het eerst geholpen. Daarom kan iemand die later ' +
      'binnenkomt eerder aan de beurt zijn dan u.</p>' +
      '<p>De wachttijd kan daardoor oplopen tot enkele uren. Neem iets te drinken mee en ' +
      'eventueel een boek.</p>' +
      '<p>Twijfelt u of u naar de spoedeisende hulp moet? Bel eerst uw huisarts of de ' +
      'huisartsenpost.</p>',
    questions: [
      {
        prompt: 'Wie wordt op de spoedeisende hulp het eerst geholpen?',
        options: [
          'wie er het ergst aan toe is',
          'wie het eerst binnenkomt',
          'wie een afspraak heeft',
        ],
        correct: 0,
        explanation: '"Wie er het ergst aan toe is, wordt het eerst geholpen."',
      },
      {
        prompt: 'Wat moet u doen als u twijfelt?',
        options: [
          'eerst uw huisarts of de huisartsenpost bellen',
          'meteen naar het ziekenhuis gaan',
          '112 bellen',
        ],
        correct: 0,
        explanation: 'Dat staat in de laatste alinea.',
      },
    ],
  },
  {
    title: 'Brief van de bank',
    section: 'brief',
    intro: intro('Mevrouw Aydin krijgt een brief van haar bank.'),
    body_html:
      '<p>Geachte mevrouw Aydin,</p>' +
      '<p>Uw bankpas verloopt eind volgende maand. Wij sturen u automatisch een nieuwe pas.</p>' +
      '<p>De nieuwe pas komt in een aparte envelop, zonder logo van de bank. De pincode blijft ' +
      'hetzelfde.</p>' +
      '<p>Knip uw oude pas doormidden zodra de nieuwe werkt.</p>' +
      '<p>Wij vragen u nooit per e-mail of telefoon om uw pincode. Krijgt u zo’n verzoek? Ga er ' +
      'niet op in en bel ons.</p>',
    questions: [
      {
        prompt: 'Wat moet mevrouw Aydin doen om een nieuwe pas te krijgen?',
        options: ['niets', 'een formulier invullen', 'naar de bank gaan'],
        correct: 0,
        explanation: '"Wij sturen u automatisch een nieuwe pas."',
      },
      {
        prompt: 'Iemand belt en vraagt om haar pincode. Wat moet zij doen?',
        options: [
          'niet ingaan op het verzoek en de bank bellen',
          'de pincode geven',
          'een nieuwe pas aanvragen',
        ],
        correct: 0,
        explanation: 'De bank vraagt nooit om een pincode; zij moet er niet op ingaan en bellen.',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 7 ───────────────────────────── */

const EXAM_7 = [
  {
    title: 'Advertentie: cursus fietsen',
    section: 'advertentie',
    intro: intro('Zainab kan niet fietsen en ziet een advertentie in de bibliotheek.'),
    body_html:
      '<h3>Leer fietsen in tien lessen</h3>' +
      '<p>Voor volwassenen die nooit hebben leren fietsen. Wij hebben fietsen in alle maten.</p>' +
      '<ul>' +
      '<li>Tien lessen van anderhalf uur</li>' +
      '<li>Op woensdagochtend of zaterdagochtend</li>' +
      '<li>€ 50 voor de hele cursus, fiets en helm inbegrepen</li>' +
      '<li>Alleen voor vrouwen</li>' +
      '</ul>' +
      '<p>Wij oefenen de eerste lessen op een rustig plein, daarna op straat. Aan het eind fietst ' +
      'u zelfstandig naar de markt.</p>' +
      '<p>Aanmelden: loop binnen bij het buurthuis, of bel 010 – 288 44 12.</p>',
    questions: [
      {
        prompt: 'Wat zit er bij de prijs van € 50 in?',
        options: ['een fiets en een helm', 'alleen de lessen', 'een fiets om te houden'],
        correct: 0,
        explanation: '"€ 50 voor de hele cursus, fiets en helm inbegrepen."',
      },
      {
        prompt: 'Waar oefenen de cursisten in het begin?',
        options: ['op een rustig plein', 'op straat', 'op de markt'],
        correct: 0,
        explanation: '"Wij oefenen de eerste lessen op een rustig plein."',
      },
      {
        prompt: 'De broer van Zainab wil ook meedoen. Kan dat?',
        options: ['Nee, de cursus is alleen voor vrouwen.', 'Ja, iedereen mag meedoen.', 'Alleen op zaterdag.'],
        correct: 0,
        explanation: 'Er staat: "Alleen voor vrouwen."',
      },
    ],
  },
  {
    title: 'Brief over het kindgebonden budget',
    section: 'brief',
    intro: intro('De familie Traoré krijgt een brief van de Belastingdienst.'),
    body_html:
      '<p>Geachte heer en mevrouw Traoré,</p>' +
      '<p>U ontvangt kindgebonden budget. Vanaf januari verandert het bedrag naar € 148 per ' +
      'maand.</p>' +
      '<p>Het bedrag hangt af van uw inkomen en het aantal kinderen. Verandert er iets in uw ' +
      'situatie — u gaat meer verdienen, u krijgt een kind of u gaat samenwonen — geef dat dan ' +
      'binnen vier weken aan ons door.</p>' +
      '<p>Doet u dat niet, dan kunt u geld moeten terugbetalen.</p>' +
      '<p>Wijzigingen geeft u door via Mijn Toeslagen of via de telefoon: 0800 – 0543.</p>',
    questions: [
      {
        prompt: 'Meneer Traoré gaat meer verdienen. Wat moet hij doen?',
        options: [
          'dat binnen vier weken doorgeven',
          'wachten tot januari',
          'niets, dat weet de Belastingdienst zelf',
        ],
        correct: 0,
        explanation: 'Wijzigingen moeten binnen vier weken worden doorgegeven.',
      },
      {
        prompt: 'Wat kan er gebeuren als hij dat niet doet?',
        options: ['Hij moet geld terugbetalen.', 'Hij krijgt een boete.', 'Er gebeurt niets.'],
        correct: 0,
        explanation: '"Doet u dat niet, dan kunt u geld moeten terugbetalen."',
      },
    ],
  },
  {
    title: 'Folder van het consultatiebureau',
    section: 'folder',
    intro: intro('Ouders van een baby krijgen een folder van het consultatiebureau.'),
    body_html:
      '<h3>Het consultatiebureau: wat doen wij?</h3>' +
      '<p>Wij volgen de groei en de ontwikkeling van uw kind tot het vier jaar is.</p>' +
      '<ul>' +
      '<li>Wij meten en wegen uw kind.</li>' +
      '<li>Wij geven de vaccinaties uit het Rijksvaccinatieprogramma.</li>' +
      '<li>U kunt al uw vragen stellen over slapen, eten en huilen.</li>' +
      '</ul>' +
      '<p>Alle afspraken zijn gratis. U krijgt vanzelf een uitnodiging.</p>' +
      '<p>Twijfelt u tussendoor ergens over? Bel gerust het telefonisch spreekuur, elke werkdag ' +
      'van 8.30 tot 10.00 uur.</p>',
    questions: [
      {
        prompt: 'Tot welke leeftijd komt een kind bij het consultatiebureau?',
        options: ['tot twee jaar', 'tot vier jaar', 'tot twaalf jaar'],
        correct: 1,
        explanation: '"Wij volgen de groei en de ontwikkeling van uw kind tot het vier jaar is."',
      },
      {
        prompt: 'Wat kosten de afspraken?',
        options: ['niets', '€ 15 per keer', 'dat hangt af van uw verzekering'],
        correct: 0,
        explanation: '"Alle afspraken zijn gratis."',
      },
      {
        prompt: 'Wanneer kunt u bellen met een vraag tussendoor?',
        options: [
          'op werkdagen tussen 8.30 en 10.00 uur',
          'de hele dag',
          'alleen na een afspraak',
        ],
        correct: 0,
        explanation: 'Het telefonisch spreekuur is elke werkdag van 8.30 tot 10.00 uur.',
      },
    ],
  },
  {
    title: 'Regels in de bibliotheek',
    section: 'regels',
    intro: intro('In de bibliotheek hangen regels voor de studieruimte.'),
    body_html:
      '<h3>Studieruimte — huisregels</h3>' +
      '<ul>' +
      '<li>In de studieruimte is het stil. Bellen doet u op de gang.</li>' +
      '<li>Eten mag niet. Water in een fles met dop mag wel.</li>' +
      '<li>Laat uw spullen niet onbewaakt achter.</li>' +
      '<li>Bent u langer dan een half uur weg? Dan mag iemand anders uw plek gebruiken.</li>' +
      '</ul>' +
      '<p>Reserveren kan via de website, maximaal vier uur per dag. Bent u een kwartier na de ' +
      'starttijd nog niet aanwezig, dan vervalt uw reservering.</p>',
    questions: [
      {
        prompt: 'Bo wil zijn broodje opeten in de studieruimte. Mag dat?',
        options: ['Nee, eten mag niet.', 'Ja, als hij stil is.', 'Alleen met water erbij.'],
        correct: 0,
        explanation: '"Eten mag niet. Water in een fles met dop mag wel."',
      },
      {
        prompt: 'Bo heeft een plek gereserveerd voor 10.00 uur en komt om 10.20 uur. Wat gebeurt er?',
        options: [
          'Zijn reservering is vervallen.',
          'Zijn plek staat nog vrij.',
          'Hij mag een half uur later beginnen.',
        ],
        correct: 0,
        explanation: 'Na een kwartier te laat vervalt de reservering.',
      },
      {
        prompt: 'Hoeveel uur per dag kan Bo reserveren?',
        options: ['twee uur', 'vier uur', 'de hele dag'],
        correct: 1,
        explanation: '"Reserveren kan via de website, maximaal vier uur per dag."',
      },
    ],
  },
  {
    title: 'E-mail van de kinderopvang',
    section: 'brief',
    intro: intro('De vader van Noor krijgt een e-mail van de kinderopvang.'),
    body_html:
      '<p>Beste ouders,</p>' +
      '<p>Op vrijdag 30 augustus is onze locatie gesloten. Wij hebben dan een studiedag voor het ' +
      'hele team.</p>' +
      '<p>U hoeft voor deze dag niet te betalen; wij verrekenen het met de factuur van ' +
      'september.</p>' +
      '<p>Heeft u die dag toch opvang nodig? Er is plek op onze andere locatie aan de ' +
      'Lindelaan. Geef dat uiterlijk 16 augustus door.</p>' +
      '<p>Met vriendelijke groet, team Kinderopvang De Vlinder</p>',
    questions: [
      {
        prompt: 'Waarom is de opvang op 30 augustus dicht?',
        options: ['vanwege een studiedag', 'vanwege een verbouwing', 'vanwege een feestdag'],
        correct: 0,
        explanation: '"Wij hebben dan een studiedag voor het hele team."',
      },
      {
        prompt: 'De vader van Noor heeft die dag wel opvang nodig. Wat moet hij doen?',
        options: [
          'dat uiterlijk 16 augustus doorgeven',
          'op 30 augustus naar de Lindelaan gaan',
          'extra betalen',
        ],
        correct: 0,
        explanation: '"Geef dat uiterlijk 16 augustus door."',
      },
    ],
  },
  {
    title: 'Formulier: bezwaar tegen een boete',
    section: 'formulier-lezen',
    intro: intro('Meneer Aksoy heeft een parkeerboete gekregen en leest het formulier.'),
    body_html:
      '<h3>Bezwaar maken tegen een verkeersboete</h3>' +
      '<p>Bent u het niet eens met de boete? Dan kunt u bezwaar maken.</p>' +
      '<ul>' +
      '<li>Dat moet binnen <strong>zes weken</strong> na de datum op de boete.</li>' +
      '<li>Vermeld altijd het beschikkingsnummer, linksboven op de brief.</li>' +
      '<li>Leg kort uit waarom u het er niet mee eens bent. Stuur bewijs mee, bijvoorbeeld een ' +
      'foto of een parkeerbon.</li>' +
      '</ul>' +
      '<p>Bezwaar maken is gratis. U hoeft de boete niet te betalen zolang wij uw bezwaar ' +
      'behandelen.</p>',
    questions: [
      {
        prompt: 'Binnen hoeveel tijd moet meneer Aksoy bezwaar maken?',
        options: ['binnen twee weken', 'binnen zes weken', 'binnen drie maanden'],
        correct: 1,
        explanation: '"Dat moet binnen zes weken na de datum op de boete."',
      },
      {
        prompt: 'Moet hij de boete betalen terwijl het bezwaar loopt?',
        options: [
          'Nee, dat hoeft niet.',
          'Ja, en hij krijgt het later terug.',
          'Ja, anders wordt de boete hoger.',
        ],
        correct: 0,
        explanation: '"U hoeft de boete niet te betalen zolang wij uw bezwaar behandelen."',
      },
      {
        prompt: 'Wat moet hij altijd vermelden?',
        options: ['het beschikkingsnummer', 'zijn rijbewijsnummer', 'zijn bankrekening'],
        correct: 0,
        explanation: '"Vermeld altijd het beschikkingsnummer, linksboven op de brief."',
      },
    ],
  },
  {
    title: 'Advertentie: klusbedrijf',
    section: 'advertentie',
    intro: intro('Mevrouw Jansen zoekt iemand die haar badkamer opknapt.'),
    body_html:
      '<h3>Klusbedrijf Snel & Netjes</h3>' +
      '<p>Voor grote en kleine klussen in en om het huis.</p>' +
      '<ul>' +
      '<li>Schilderwerk, tegels, kleine reparaties</li>' +
      '<li>Gratis offerte, altijd vooraf een vaste prijs</li>' +
      '<li>Wij werken op werkdagen tussen 8.00 en 17.00 uur</li>' +
      '<li>Betalen achteraf per rekening, binnen veertien dagen</li>' +
      '</ul>' +
      '<p>Wij doen geen werk aan gas, water en elektra. Daarvoor verwijzen wij u naar een ' +
      'erkende installateur.</p>',
    questions: [
      {
        prompt: 'Mevrouw Jansen wil ook een nieuw stopcontact. Kan dit bedrijf dat doen?',
        options: [
          'Nee, zij doen geen elektra.',
          'Ja, dat hoort bij kleine reparaties.',
          'Alleen met een offerte.',
        ],
        correct: 0,
        explanation: '"Wij doen geen werk aan gas, water en elektra."',
      },
      {
        prompt: 'Wanneer betaalt zij?',
        options: ['achteraf, binnen veertien dagen', 'vooraf', 'op de dag zelf, contant'],
        correct: 0,
        explanation: '"Betalen achteraf per rekening, binnen veertien dagen."',
      },
    ],
  },
  {
    title: 'Bericht over de bushalte',
    section: 'regels',
    intro: intro('Bij de bushalte hangt een bericht van het vervoerbedrijf.'),
    body_html:
      '<h3>Halte tijdelijk verplaatst</h3>' +
      '<p>Van 3 tot en met 28 juni rijdt bus 32 een andere route in verband met werk aan de ' +
      'Dorpsstraat.</p>' +
      '<p>Deze halte wordt niet bediend. De dichtstbijzijnde halte is Kerkplein, ongeveer 300 ' +
      'meter verderop.</p>' +
      '<p>De bus rijdt in deze periode ongeveer vijf minuten later dan in de dienstregeling ' +
      'staat. Houd daar rekening mee.</p>' +
      '<p>Reist u met een rolstoel of rollator? Bel 0900 – 9292 voor hulp bij het plannen van uw ' +
      'reis.</p>',
    questions: [
      {
        prompt: 'Waar moet u in juni op de bus wachten?',
        options: ['bij halte Kerkplein', 'bij deze halte', 'in de Dorpsstraat'],
        correct: 0,
        explanation: 'Deze halte vervalt; de dichtstbijzijnde is Kerkplein.',
      },
      {
        prompt: 'Wat moet u weten over de tijden?',
        options: [
          'De bus rijdt ongeveer vijf minuten later.',
          'De bus rijdt vijf minuten eerder.',
          'De tijden blijven gelijk.',
        ],
        correct: 0,
        explanation: '"De bus rijdt in deze periode ongeveer vijf minuten later."',
      },
      {
        prompt: 'Hoe lang duren de werkzaamheden?',
        options: ['ongeveer een week', 'bijna vier weken', 'twee maanden'],
        correct: 1,
        explanation: 'Van 3 tot en met 28 juni is bijna vier weken.',
      },
    ],
  },
  {
    title: 'Geld besparen op boodschappen',
    section: 'artikel',
    intro: intro('In de wijkkrant staat een artikel met tips over boodschappen.'),
    body_html:
      '<h3>Vijf manieren om te besparen</h3>' +
      '<ol>' +
      '<li>Maak een lijstje en houd u eraan. Wie zonder lijstje winkelt, koopt gemiddeld meer.</li>' +
      '<li>Ga niet met een lege maag naar de winkel.</li>' +
      '<li>Kijk naar het huismerk. Dat is vaak van dezelfde fabriek als het dure merk.</li>' +
      '<li>Let op de prijs per kilo, niet op de prijs per verpakking.</li>' +
      '<li>Kook één keer per week met wat er nog in de koelkast ligt.</li>' +
      '</ol>' +
      '<p>Komt u er echt niet uit? De gemeente heeft een gratis budgetcoach. Vraag ernaar bij het ' +
      'wijkteam.</p>',
    questions: [
      {
        prompt: 'Waar moet u volgens de tekst op letten in de winkel?',
        options: ['op de prijs per kilo', 'op de prijs per verpakking', 'op de reclame'],
        correct: 0,
        explanation: '"Let op de prijs per kilo, niet op de prijs per verpakking."',
      },
      {
        prompt: 'Wat kan iemand doen die er niet uitkomt?',
        options: [
          'bij het wijkteam om een budgetcoach vragen',
          'een lening afsluiten',
          'minder eten kopen',
        ],
        correct: 0,
        explanation: '"De gemeente heeft een gratis budgetcoach. Vraag ernaar bij het wijkteam."',
      },
    ],
  },
  {
    title: 'Brief van de sportvereniging',
    section: 'brief',
    intro: intro('Emre krijgt een brief van zijn voetbalclub.'),
    body_html:
      '<p>Beste Emre,</p>' +
      '<p>Het nieuwe seizoen begint op 24 augustus. Je bent ingedeeld bij team JO15-2.</p>' +
      '<p>Trainen doen jullie op dinsdag en donderdag van 18.30 tot 20.00 uur. De wedstrijden ' +
      'zijn op zaterdagochtend.</p>' +
      '<p>Je hebt nieuwe scheenbeschermers nodig; die zijn verplicht. Het clubshirt krijg je van ' +
      'ons.</p>' +
      '<p>Kun je een keer niet? Laat het uiterlijk de dag ervoor weten aan je trainer.</p>',
    questions: [
      {
        prompt: 'Wat moet Emre zelf kopen?',
        options: ['scheenbeschermers', 'het clubshirt', 'voetbalschoenen'],
        correct: 0,
        explanation: 'Het shirt krijgt hij van de club; de scheenbeschermers zijn verplicht en van hemzelf.',
      },
      {
        prompt: 'Wanneer zijn de wedstrijden?',
        options: ['op dinsdag', 'op donderdag', 'op zaterdagochtend'],
        correct: 2,
        explanation: '"De wedstrijden zijn op zaterdagochtend."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 8 ───────────────────────────── */

const EXAM_8 = [
  {
    title: 'Brief over de inburgering',
    section: 'brief',
    intro: intro('Mevrouw Okonkwo krijgt een brief van DUO.'),
    body_html:
      '<p>Geachte mevrouw Okonkwo,</p>' +
      '<p>U heeft zich aangemeld voor het examen Lezen op 18 september om 13.30 uur in ' +
      'Rotterdam.</p>' +
      '<p>Kom een half uur van tevoren. Neem uw identiteitsbewijs mee; zonder geldig ' +
      'identiteitsbewijs kunt u geen examen doen.</p>' +
      '<p>Telefoons en tassen laat u in een kluisje achter. U krijgt papier van ons.</p>' +
      '<p>De uitslag krijgt u binnen acht weken in uw account op de website.</p>',
    questions: [
      {
        prompt: 'Hoe laat moet mevrouw Okonkwo aanwezig zijn?',
        options: ['om 13.00 uur', 'om 13.30 uur', 'om 14.00 uur'],
        correct: 0,
        explanation: 'Een half uur voor 13.30 uur is 13.00 uur.',
      },
      {
        prompt: 'Wat gebeurt er zonder geldig identiteitsbewijs?',
        options: [
          'Zij kan geen examen doen.',
          'Zij moet extra betalen.',
          'Zij krijgt de uitslag later.',
        ],
        correct: 0,
        explanation: '"Zonder geldig identiteitsbewijs kunt u geen examen doen."',
      },
      {
        prompt: 'Waar krijgt zij de uitslag?',
        options: ['per post', 'in haar account op de website', 'per telefoon'],
        correct: 1,
        explanation: '"De uitslag krijgt u binnen acht weken in uw account op de website."',
      },
    ],
  },
  {
    title: 'Advertentie: opruiming kledingwinkel',
    section: 'advertentie',
    intro: intro('Sara ziet een poster in de etalage van een kledingwinkel.'),
    body_html:
      '<h3>Grote opruiming — laatste week</h3>' +
      '<ul>' +
      '<li>Jassen en truien: <strong>50% korting</strong></li>' +
      '<li>Broeken en rokken: <strong>30% korting</strong></li>' +
      '<li>Schoenen: twee paar voor de prijs van één</li>' +
      '</ul>' +
      '<p>Let op: opruimingsartikelen kunnen niet geruild of teruggebracht worden. Past het ' +
      'niet, dan kunt u het in de winkel wel omruilen voor een andere maat, zolang de voorraad ' +
      'strekt.</p>' +
      '<p>De opruiming loopt tot en met zondag.</p>',
    questions: [
      {
        prompt: 'Een jas kost normaal € 80. Wat kost hij nu?',
        options: ['€ 24', '€ 40', '€ 56'],
        correct: 1,
        explanation: '50% korting op € 80 is € 40.',
      },
      {
        prompt: 'De broek die Sara koopt is te groot. Wat kan zij doen?',
        options: [
          'hem omruilen voor een andere maat',
          'haar geld terugvragen',
          'niets',
        ],
        correct: 0,
        explanation: 'Ruilen of terugbrengen kan niet, omruilen voor een andere maat wel.',
      },
    ],
  },
  {
    title: 'Folder over vrijwilligerswerk',
    section: 'folder',
    intro: intro('In het buurthuis ligt een folder over vrijwilligerswerk.'),
    body_html:
      '<h3>Word vrijwilliger</h3>' +
      '<p>Vrijwilligerswerk is werk waar u niet voor betaald wordt. Het is een goede manier om ' +
      'mensen te ontmoeten en uw Nederlands te oefenen.</p>' +
      '<p>Wij zoeken op dit moment:</p>' +
      '<ul>' +
      '<li>iemand die op woensdag helpt met de maaltijd voor ouderen</li>' +
      '<li>twee mensen voor de fietsenwerkplaats op zaterdag</li>' +
      '<li>een taalmaatje: één uur per week met iemand Nederlands praten</li>' +
      '</ul>' +
      '<p>Wij vergoeden uw reiskosten. Voor sommige plekken vragen wij een VOG; die regelen en ' +
      'betalen wij voor u.</p>',
    questions: [
      {
        prompt: 'Wat krijgt u voor vrijwilligerswerk?',
        options: [
          'geen salaris, wel uw reiskosten vergoed',
          'een salaris per uur',
          'niets',
        ],
        correct: 0,
        explanation: 'Het is onbetaald werk, maar de reiskosten worden vergoed.',
      },
      {
        prompt: 'Hoeveel tijd kost een taalmaatje?',
        options: ['een uur per week', 'een dag per week', 'een uur per maand'],
        correct: 0,
        explanation: '"een taalmaatje: één uur per week met iemand Nederlands praten".',
      },
      {
        prompt: 'Wie betaalt de VOG?',
        options: ['de organisatie', 'de vrijwilliger', 'de gemeente'],
        correct: 0,
        explanation: '"die regelen en betalen wij voor u."',
      },
    ],
  },
  {
    title: 'Regels voor de fietsenstalling van de school',
    section: 'regels',
    intro: intro('Bij de fietsenstalling van de school hangen regels.'),
    body_html:
      '<h3>Fietsenstalling</h3>' +
      '<ul>' +
      '<li>Zet uw fiets altijd op slot, ook al staat hij maar even.</li>' +
      '<li>Fietsen die buiten de rekken staan, worden verwijderd.</li>' +
      '<li>Brommers en scooters horen bij de aparte plek achter het gebouw.</li>' +
      '<li>De school is niet aansprakelijk voor schade of diefstal.</li>' +
      '</ul>' +
      '<p>Is uw fiets gestolen? Doe aangifte bij de politie en meld het bij de conciërge. Wij ' +
      'kunnen dan de camerabeelden bekijken.</p>',
    questions: [
      {
        prompt: 'Wat gebeurt er met een fiets buiten de rekken?',
        options: ['Die wordt verwijderd.', 'Die krijgt een boete.', 'Er gebeurt niets.'],
        correct: 0,
        explanation: '"Fietsen die buiten de rekken staan, worden verwijderd."',
      },
      {
        prompt: 'De fiets van Lars is gestolen. Wat moet hij doen?',
        options: [
          'aangifte doen en het bij de conciërge melden',
          'alleen de conciërge inlichten',
          'de school aansprakelijk stellen',
        ],
        correct: 0,
        explanation: 'Beide stappen staan in de laatste alinea.',
      },
    ],
  },
  {
    title: 'E-mail over de tuinclub',
    section: 'brief',
    intro: intro('Mevrouw Visser krijgt een e-mail van de volkstuinvereniging.'),
    body_html:
      '<p>Beste leden,</p>' +
      '<p>Er is een tuin vrijgekomen aan het einde van pad 3, nummer 47. De tuin is 120 m² en er ' +
      'staat een klein schuurtje op.</p>' +
      '<p>Leden die op de wachtlijst staan, krijgen voorrang. Staat u niet op de lijst en heeft u ' +
      'toch interesse? Stuur dan vóór 20 mei een mail.</p>' +
      '<p>De huur is € 95 per jaar, plus € 30 voor water.</p>' +
      '<p>Let op: de tuin is een jaar niet onderhouden. De nieuwe huurder moet hem eerst ' +
      'opknappen.</p>',
    questions: [
      {
        prompt: 'Wie krijgt voorrang op de tuin?',
        options: [
          'leden die op de wachtlijst staan',
          'wie het eerst mailt',
          'wie het meeste betaalt',
        ],
        correct: 0,
        explanation: '"Leden die op de wachtlijst staan, krijgen voorrang."',
      },
      {
        prompt: 'Wat kost de tuin in totaal per jaar?',
        options: ['€ 95', '€ 125', '€ 30'],
        correct: 1,
        explanation: '€ 95 huur plus € 30 voor water is € 125.',
      },
      {
        prompt: 'Wat moet de nieuwe huurder eerst doen?',
        options: ['de tuin opknappen', 'een schuurtje bouwen', 'een jaar wachten'],
        correct: 0,
        explanation: '"De nieuwe huurder moet hem eerst opknappen."',
      },
    ],
  },
  {
    title: 'Formulier: inschrijven bij de huisarts',
    section: 'formulier-lezen',
    intro: intro('Meneer Ivanov is verhuisd en schrijft zich in bij een nieuwe huisarts.'),
    body_html:
      '<h3>Inschrijfformulier huisartsenpraktijk</h3>' +
      '<p>Wij nemen alleen patiënten aan die binnen ons gebied wonen. Kijk op de kaart op onze ' +
      'website of uw postcode erbij hoort.</p>' +
      '<p><strong>Wat heeft u nodig?</strong> Uw BSN, uw verzekeringsgegevens en de naam en ' +
      'plaats van uw vorige huisarts.</p>' +
      '<p>Wij vragen uw dossier zelf op bij uw vorige huisarts. Dat duurt ongeveer twee weken.</p>' +
      '<p>Na inschrijving nodigen wij u uit voor een kennismakingsgesprek van tien minuten.</p>',
    questions: [
      {
        prompt: 'Wat bepaalt of meneer Ivanov zich kan inschrijven?',
        options: [
          'of hij binnen het gebied van de praktijk woont',
          'of hij verzekerd is',
          'of hij al een dossier heeft',
        ],
        correct: 0,
        explanation: '"Wij nemen alleen patiënten aan die binnen ons gebied wonen."',
      },
      {
        prompt: 'Wie vraagt zijn dossier op bij de vorige huisarts?',
        options: ['de nieuwe praktijk', 'hijzelf', 'de verzekering'],
        correct: 0,
        explanation: '"Wij vragen uw dossier zelf op bij uw vorige huisarts."',
      },
    ],
  },
  {
    title: 'Advertentie: bijles voor kinderen',
    section: 'advertentie',
    intro: intro('De moeder van Yusuf ziet een advertentie op het schoolplein.'),
    body_html:
      '<h3>Bijles rekenen en taal</h3>' +
      '<p>Voor kinderen uit groep 4 tot en met 8.</p>' +
      '<ul>' +
      '<li>Kleine groepjes van maximaal vier kinderen</li>' +
      '<li>Woensdagmiddag 14.00–15.00 uur in het buurthuis</li>' +
      '<li>€ 7,50 per keer, of € 60 voor tien lessen</li>' +
      '<li>De begeleiders zijn studenten van de pabo</li>' +
      '</ul>' +
      '<p>Heeft u een stadspas? Dan is de bijles gratis. Laat de pas zien bij de eerste les.</p>' +
      '<p>Aanmelden kan bij de balie van het buurthuis of via bijles@buurthuisnoord.nl.</p>',
    questions: [
      {
        prompt: 'Yusuf zit in groep 3. Kan hij meedoen?',
        options: [
          'Nee, de bijles is vanaf groep 4.',
          'Ja, alle kinderen mogen komen.',
          'Alleen met een stadspas.',
        ],
        correct: 0,
        explanation: 'De bijles is voor groep 4 tot en met 8.',
      },
      {
        prompt: 'Wat is voordeliger: tien losse lessen of een kaart van tien?',
        options: [
          'de kaart van tien lessen',
          'tien losse lessen',
          'dat is precies hetzelfde',
        ],
        correct: 0,
        explanation: 'Tien losse lessen kosten € 75; de kaart kost € 60.',
      },
      {
        prompt: 'Wat moet u bij de eerste les laten zien als u een stadspas heeft?',
        options: ['de stadspas', 'een bewijs van school', 'niets'],
        correct: 0,
        explanation: '"Laat de pas zien bij de eerste les."',
      },
    ],
  },
  {
    title: 'Bericht van de woningcorporatie',
    section: 'regels',
    intro: intro('In het trappenhuis hangt een bericht over geluid.'),
    body_html:
      '<h3>Samen wonen, samen rekening houden</h3>' +
      '<p>Wij krijgen de laatste tijd veel klachten over geluid. Daarom nog even de afspraken:</p>' +
      '<ul>' +
      '<li>Tussen 22.00 en 7.00 uur is het stil in het gebouw.</li>' +
      '<li>Boren en klussen mag doordeweeks tot 20.00 uur en op zaterdag tot 18.00 uur. Op ' +
      'zondag niet.</li>' +
      '<li>Geeft u een feest? Laat het uw directe buren van tevoren weten.</li>' +
      '</ul>' +
      '<p>Heeft u last van een buur? Ga eerst zelf even langs. Lukt dat niet, dan kunt u de ' +
      'buurtbemiddeling inschakelen. Dat is gratis.</p>',
    questions: [
      {
        prompt: 'Mag Kwame op zondagmiddag boren?',
        options: ['Nee, op zondag mag dat niet.', 'Ja, tot 18.00 uur.', 'Ja, tot 20.00 uur.'],
        correct: 0,
        explanation: '"Op zondag niet."',
      },
      {
        prompt: 'Wat moet u het eerst doen als u last heeft van een buur?',
        options: [
          'zelf even bij die buur langsgaan',
          'de buurtbemiddeling bellen',
          'de corporatie schrijven',
        ],
        correct: 0,
        explanation: '"Ga eerst zelf even langs."',
      },
    ],
  },
  {
    title: 'Waarom lezen met je kind belangrijk is',
    section: 'artikel',
    intro: intro('In een folder van de bibliotheek staat een stuk over voorlezen.'),
    body_html:
      '<h3>Vijftien minuten per dag</h3>' +
      '<p>Kinderen aan wie elke dag wordt voorgelezen, leren sneller praten en kennen meer ' +
      'woorden. Vijftien minuten per dag is al genoeg.</p>' +
      '<p>Het maakt niet uit in welke taal u voorleest. Leest u in uw eigen taal voor, dan helpt ' +
      'dat uw kind ook met het Nederlands op school.</p>' +
      '<p>Praat na afloop even over het verhaal. Vraag wat uw kind ervan vond of wat er zou ' +
      'gebeuren als het anders liep.</p>' +
      '<p>Bij de bibliotheek kunt u gratis prentenboeken lenen; kinderen zijn gratis lid.</p>',
    questions: [
      {
        prompt: 'Hoeveel voorlezen per dag is volgens de tekst genoeg?',
        options: ['vijf minuten', 'vijftien minuten', 'een uur'],
        correct: 1,
        explanation: '"Vijftien minuten per dag is al genoeg."',
      },
      {
        prompt: 'In welke taal moet u voorlezen?',
        options: [
          'Dat maakt niet uit.',
          'Alleen in het Nederlands.',
          'Alleen in uw eigen taal.',
        ],
        correct: 0,
        explanation: '"Het maakt niet uit in welke taal u voorleest."',
      },
      {
        prompt: 'Wat kost het lidmaatschap voor een kind?',
        options: ['niets', '€ 15 per jaar', 'dat staat niet in de tekst'],
        correct: 0,
        explanation: '"kinderen zijn gratis lid."',
      },
    ],
  },
  {
    title: 'Brief over de warmtemeter',
    section: 'brief',
    intro: intro('De bewoners van een flat krijgen een brief over de warmtemeters.'),
    body_html:
      '<p>Beste bewoner,</p>' +
      '<p>In week 12 komt een monteur bij u langs om de warmtemeters op de radiatoren te ' +
      'vervangen. Dit duurt ongeveer een half uur.</p>' +
      '<p>U krijgt volgende week een kaart met de dag en het tijdvak. Kunt u dan niet? Bel het ' +
      'nummer op de kaart voor een andere afspraak.</p>' +
      '<p>De monteur heeft toegang nodig tot alle kamers met een radiator. Zorg dat de radiatoren ' +
      'vrij staan.</p>' +
      '<p>Er zijn voor u geen kosten aan verbonden.</p>',
    questions: [
      {
        prompt: 'Wat moet de bewoner doen voordat de monteur komt?',
        options: [
          'zorgen dat de radiatoren vrij staan',
          'de radiatoren uitzetten',
          'zelf de meters afhalen',
        ],
        correct: 0,
        explanation: '"Zorg dat de radiatoren vrij staan."',
      },
      {
        prompt: 'Wat kost het vervangen van de meters?',
        options: ['niets', '€ 30', 'dat hangt af van het aantal radiatoren'],
        correct: 0,
        explanation: '"Er zijn voor u geen kosten aan verbonden."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 9 ───────────────────────────── */

const EXAM_9 = [
  {
    title: 'Advertentie: auto te koop',
    section: 'advertentie',
    intro: intro('Bilal zoekt een goedkope auto en ziet deze advertentie.'),
    body_html:
      '<h3>Opel Corsa, bouwjaar 2014</h3>' +
      '<table>' +
      '<tr><td>Kilometerstand</td><td>142.000 km</td></tr>' +
      '<tr><td>Brandstof</td><td>benzine</td></tr>' +
      '<tr><td>APK geldig tot</td><td>maart volgend jaar</td></tr>' +
      '<tr><td>Vraagprijs</td><td>€ 3.250</td></tr>' +
      '</table>' +
      '<p>De auto rijdt goed. Er zit een kras op de achterbumper en de airco werkt niet. Verder ' +
      'is alles in orde.</p>' +
      '<p>Proefrit mogelijk; neem uw rijbewijs mee. Te bezichtigen in Zoetermeer, na telefonische ' +
      'afspraak.</p>',
    questions: [
      {
        prompt: 'Wat is er niet in orde aan de auto?',
        options: ['de airco', 'de motor', 'de APK'],
        correct: 0,
        explanation: '"Er zit een kras op de achterbumper en de airco werkt niet."',
      },
      {
        prompt: 'Bilal wil een proefrit maken. Wat moet hij meenemen?',
        options: ['zijn rijbewijs', 'contant geld', 'een verzekeringsbewijs'],
        correct: 0,
        explanation: '"Proefrit mogelijk; neem uw rijbewijs mee."',
      },
      {
        prompt: 'Hoe maakt Bilal een afspraak?',
        options: ['telefonisch', 'per e-mail', 'door langs te gaan'],
        correct: 0,
        explanation: '"Te bezichtigen in Zoetermeer, na telefonische afspraak."',
      },
    ],
  },
  {
    title: 'Brief van de gemeente over de verhuizing',
    section: 'brief',
    intro: intro('Mevrouw Bergman is verhuisd en krijgt een brief.'),
    body_html:
      '<p>Geachte mevrouw Bergman,</p>' +
      '<p>Wij hebben uw verhuizing verwerkt. U staat sinds 1 april ingeschreven op uw nieuwe ' +
      'adres.</p>' +
      '<p>Denkt u er zelf aan om uw nieuwe adres door te geven aan uw zorgverzekering, uw bank, ' +
      'uw werkgever en uw energieleverancier? Dat doen wij niet voor u.</p>' +
      '<p>Uw huisarts en apotheek moeten dat ook weten.</p>' +
      '<p>Wilt u een uittreksel van uw inschrijving? Dat vraagt u aan via de website; het kost ' +
      '€ 12,50.</p>',
    questions: [
      {
        prompt: 'Wie geeft het nieuwe adres door aan de bank?',
        options: ['mevrouw Bergman zelf', 'de gemeente', 'de zorgverzekering'],
        correct: 0,
        explanation: '"Dat doen wij niet voor u."',
      },
      {
        prompt: 'Wat kost een uittreksel?',
        options: ['niets', '€ 12,50', 'dat staat niet in de tekst'],
        correct: 1,
        explanation: '"het kost € 12,50."',
      },
    ],
  },
  {
    title: 'Folder: hulp bij het invullen van formulieren',
    section: 'folder',
    intro: intro('In de bibliotheek ligt een folder over het Informatiepunt.'),
    body_html:
      '<h3>Informatiepunt Digitale Overheid</h3>' +
      '<p>Vindt u het lastig om zaken met de overheid online te regelen? Wij helpen u ' +
      'gratis.</p>' +
      '<ul>' +
      '<li>Hulp bij DigiD, toeslagen en formulieren</li>' +
      '<li>Elke dinsdag en donderdag van 10.00 tot 13.00 uur</li>' +
      '<li>Zonder afspraak; loop gewoon binnen</li>' +
      '<li>Neem uw post en uw DigiD-gegevens mee</li>' +
      '</ul>' +
      '<p>Onze medewerkers zijn geen ambtenaren en nemen geen besluiten. Zij helpen u met de ' +
      'computer en met het begrijpen van de brief.</p>',
    questions: [
      {
        prompt: 'Moet u een afspraak maken?',
        options: ['Nee, u kunt binnenlopen.', 'Ja, altijd.', 'Alleen op donderdag.'],
        correct: 0,
        explanation: '"Zonder afspraak; loop gewoon binnen."',
      },
      {
        prompt: 'Wat doen de medewerkers niet?',
        options: [
          'besluiten nemen over uw aanvraag',
          'helpen met de computer',
          'uw brief uitleggen',
        ],
        correct: 0,
        explanation: '"Onze medewerkers zijn geen ambtenaren en nemen geen besluiten."',
      },
      {
        prompt: 'Wat moet u meenemen?',
        options: ['uw post en uw DigiD-gegevens', 'uw paspoort', 'geld'],
        correct: 0,
        explanation: '"Neem uw post en uw DigiD-gegevens mee."',
      },
    ],
  },
  {
    title: 'Regels voor het gebruik van de wasmachine',
    section: 'regels',
    intro: intro('In een studentenhuis hangen afspraken over de wasmachine.'),
    body_html:
      '<h3>Afspraken wasmachine</h3>' +
      '<ol>' +
      '<li>Schrijf uw naam en tijd op het bord in de bijkeuken.</li>' +
      '<li>Maximaal twee wasjes per week per bewoner.</li>' +
      '<li>Haal uw was binnen een uur na afloop uit de machine.</li>' +
      '<li>Draai niet tussen 23.00 en 7.00 uur; de buren horen het.</li>' +
      '</ol>' +
      '<p>De machine is van het huis. Gaat hij kapot door verkeerd gebruik, dan betaalt degene ' +
      'die hem gebruikte de reparatie. Bij normale slijtage betalen wij samen.</p>',
    questions: [
      {
        prompt: 'Hoeveel wasjes mag een bewoner per week draaien?',
        options: ['één', 'twee', 'zoveel als hij wil'],
        correct: 1,
        explanation: '"Maximaal twee wasjes per week per bewoner."',
      },
      {
        prompt: 'De machine gaat kapot door normale slijtage. Wie betaalt?',
        options: ['de bewoners samen', 'wie hem het laatst gebruikte', 'de verhuurder'],
        correct: 0,
        explanation: '"Bij normale slijtage betalen wij samen."',
      },
      {
        prompt: 'Wat moet u doen voordat u de machine gebruikt?',
        options: [
          'uw naam en tijd op het bord schrijven',
          'de vorige bewoner vragen',
          'betalen',
        ],
        correct: 0,
        explanation: '"Schrijf uw naam en tijd op het bord in de bijkeuken."',
      },
    ],
  },
  {
    title: 'E-mail over de schoolfotograaf',
    section: 'brief',
    intro: intro('De ouders van Femke krijgen een e-mail over de schoolfoto’s.'),
    body_html:
      '<p>Beste ouders,</p>' +
      '<p>Op maandag 14 oktober komt de schoolfotograaf. Er wordt een portretfoto en een ' +
      'klassenfoto gemaakt.</p>' +
      '<p>Heeft u meerdere kinderen op onze school? Dan kan er ook een broer-en-zusfoto worden ' +
      'gemaakt. Geef dat vóór 7 oktober door via het formulier.</p>' +
      '<p>U krijgt na twee weken een code waarmee u de foto’s online kunt bekijken. Kopen is niet ' +
      'verplicht.</p>' +
      '<p>Wilt u niet dat uw kind gefotografeerd wordt? Laat het de leerkracht weten.</p>',
    questions: [
      {
        prompt: 'Femke heeft een broertje op school. Wat moeten de ouders doen voor een foto samen?',
        options: [
          'dat vóór 7 oktober doorgeven',
          'op 14 oktober meekomen',
          'niets, dat gebeurt vanzelf',
        ],
        correct: 0,
        explanation: '"Geef dat vóór 7 oktober door via het formulier."',
      },
      {
        prompt: 'Moeten de ouders de foto’s kopen?',
        options: ['Nee, dat is niet verplicht.', 'Ja, dat hoort bij de schoolkosten.', 'Alleen de klassenfoto.'],
        correct: 0,
        explanation: '"Kopen is niet verplicht."',
      },
    ],
  },
  {
    title: 'Formulier: aanvraag zorgtoeslag',
    section: 'formulier-lezen',
    intro: intro('Meneer Sultani leest de uitleg bij het formulier voor zorgtoeslag.'),
    body_html:
      '<h3>Zorgtoeslag aanvragen</h3>' +
      '<p>Zorgtoeslag is een bijdrage in de kosten van uw zorgverzekering.</p>' +
      '<p><strong>Wanneer heeft u er recht op?</strong> Als u 18 jaar of ouder bent, een ' +
      'Nederlandse zorgverzekering heeft en uw inkomen niet te hoog is.</p>' +
      '<p><strong>Hoe vraagt u aan?</strong> Online met uw DigiD, via Mijn Toeslagen.</p>' +
      '<p>U kunt zorgtoeslag met terugwerkende kracht aanvragen tot 1 september van het volgende ' +
      'jaar. Vraag dus op tijd aan, ook als u twijfelt.</p>',
    questions: [
      {
        prompt: 'Vanaf welke leeftijd kunt u zorgtoeslag krijgen?',
        options: ['vanaf 16 jaar', 'vanaf 18 jaar', 'vanaf 21 jaar'],
        correct: 1,
        explanation: '"Als u 18 jaar of ouder bent."',
      },
      {
        prompt: 'Wat heeft meneer Sultani nodig om aan te vragen?',
        options: ['zijn DigiD', 'een formulier op papier', 'een afspraak'],
        correct: 0,
        explanation: '"Online met uw DigiD, via Mijn Toeslagen."',
      },
      {
        prompt: 'Wat adviseert de tekst?',
        options: [
          'op tijd aanvragen, ook bij twijfel',
          'wachten tot september',
          'eerst uw verzekering bellen',
        ],
        correct: 0,
        explanation: '"Vraag dus op tijd aan, ook als u twijfelt."',
      },
    ],
  },
  {
    title: 'Advertentie: hulp in de horeca',
    section: 'advertentie',
    intro: intro('Dimitri zoekt werk in de horeca en ziet deze advertentie.'),
    body_html:
      '<h3>Restaurant De Pont zoekt afwashulp</h3>' +
      '<ul>' +
      '<li>Donderdag tot en met zondag, avonddiensten van 17.00 tot 23.00 uur</li>' +
      '<li>Twee of drie avonden per week, in overleg</li>' +
      '<li>€ 13,20 per uur, plus een maaltijd per dienst</li>' +
      '<li>Nederlands spreken is handig, maar niet noodzakelijk</li>' +
      '</ul>' +
      '<p>Wij werken met een vast team en zoeken iemand voor langere tijd. Studenten die alleen ' +
      'de zomer kunnen werken, zoeken wij nu niet.</p>' +
      '<p>Stuur een kort bericht met uw telefoonnummer naar werk@restaurantdepont.nl.</p>',
    questions: [
      {
        prompt: 'Dimitri spreekt nog niet veel Nederlands. Kan hij solliciteren?',
        options: [
          'Ja, Nederlands is handig maar niet noodzakelijk.',
          'Nee, Nederlands is verplicht.',
          'Alleen in de zomer.',
        ],
        correct: 0,
        explanation: '"Nederlands spreken is handig, maar niet noodzakelijk."',
      },
      {
        prompt: 'Hoe lang duurt een dienst?',
        options: ['vier uur', 'zes uur', 'acht uur'],
        correct: 1,
        explanation: 'Van 17.00 tot 23.00 uur is zes uur.',
      },
      {
        prompt: 'Wie zoekt het restaurant nu niet?',
        options: [
          'iemand die alleen de zomer kan werken',
          'iemand zonder ervaring',
          'iemand die maar twee avonden kan',
        ],
        correct: 0,
        explanation: '"Studenten die alleen de zomer kunnen werken, zoeken wij nu niet."',
      },
    ],
  },
  {
    title: 'Bericht over het zwembadwater',
    section: 'regels',
    intro: intro('Bij het zwembad hangt een bericht over een storing.'),
    body_html:
      '<h3>Buitenbad tijdelijk dicht</h3>' +
      '<p>Door een storing in de waterinstallatie is het buitenbad tot nader bericht gesloten. ' +
      'Het binnenbad is gewoon open.</p>' +
      '<p>Heeft u een kaart voor tien keer gekocht? Die blijft geldig en u kunt hem gebruiken ' +
      'voor het binnenbad.</p>' +
      '<p>Heeft u een dagkaart voor vandaag gekocht en wilt u toch niet zwemmen? Vraag bij de ' +
      'kassa om uw geld terug. Dat kan alleen vandaag nog.</p>' +
      '<p>Kijk op onze website voor het laatste nieuws.</p>',
    questions: [
      {
        prompt: 'Wat is er open?',
        options: ['het binnenbad', 'het buitenbad', 'allebei'],
        correct: 0,
        explanation: '"Het binnenbad is gewoon open."',
      },
      {
        prompt: 'Ana heeft vandaag een dagkaart gekocht en wil haar geld terug. Wanneer kan dat?',
        options: ['alleen vandaag', 'binnen een week', 'dat kan niet'],
        correct: 0,
        explanation: '"Dat kan alleen vandaag nog."',
      },
    ],
  },
  {
    title: 'Slapen en werken in ploegendienst',
    section: 'artikel',
    intro: intro('In een personeelsblad staat een artikel over nachtdiensten.'),
    body_html:
      '<h3>Beter slapen na een nachtdienst</h3>' +
      '<p>Wie ’s nachts werkt, slaapt overdag vaak slechter. Het lichaam is namelijk gewend om ' +
      'overdag wakker te zijn.</p>' +
      '<p>Wat helpt:</p>' +
      '<ul>' +
      '<li>Draag een zonnebril op weg naar huis. Licht maakt u wakker.</li>' +
      '<li>Maak de slaapkamer helemaal donker.</li>' +
      '<li>Eet een lichte maaltijd voordat u gaat slapen, geen zware.</li>' +
      '<li>Spreek met huisgenoten af dat zij u niet wekken.</li>' +
      '</ul>' +
      '<p>Blijft u moe, ook op vrije dagen? Bespreek dat met de bedrijfsarts.</p>',
    questions: [
      {
        prompt: 'Waarom raadt de tekst een zonnebril aan?',
        options: [
          'Licht maakt je wakker.',
          'Het is beter voor de ogen.',
          'Het is veiliger in het verkeer.',
        ],
        correct: 0,
        explanation: '"Draag een zonnebril op weg naar huis. Licht maakt u wakker."',
      },
      {
        prompt: 'Wat moet u eten voor het slapen?',
        options: ['een lichte maaltijd', 'een zware maaltijd', 'niets'],
        correct: 0,
        explanation: '"Eet een lichte maaltijd voordat u gaat slapen, geen zware."',
      },
    ],
  },
  {
    title: 'Brief over de zomervakantie',
    section: 'brief',
    intro: intro('De ouders van Tarik krijgen een brief over de vakantie.'),
    body_html:
      '<p>Beste ouders,</p>' +
      '<p>De zomervakantie is van maandag 14 juli tot en met vrijdag 22 augustus.</p>' +
      '<p>Op vrijdag 11 juli zijn de kinderen om 12.00 uur vrij. Er is die middag geen ' +
      'opvang.</p>' +
      '<p>Het nieuwe schooljaar begint op maandag 25 augustus. Uw kind hoort in de laatste week ' +
      'van de vakantie per e-mail in welke klas het komt.</p>' +
      '<p>Gaat u eerder op vakantie? Verlof buiten de schoolvakantie mag alleen in bijzondere ' +
      'gevallen. Vraag het aan bij de directeur.</p>',
    questions: [
      {
        prompt: 'Hoe laat zijn de kinderen op 11 juli vrij?',
        options: ['om 12.00 uur', 'om 14.00 uur', 'de gewone tijd'],
        correct: 0,
        explanation: '"Op vrijdag 11 juli zijn de kinderen om 12.00 uur vrij."',
      },
      {
        prompt: 'Wanneer horen de ouders in welke klas Tarik komt?',
        options: [
          'in de laatste week van de vakantie',
          'op de eerste schooldag',
          'vóór de vakantie',
        ],
        correct: 0,
        explanation: 'Dat komt per e-mail in de laatste week van de vakantie.',
      },
    ],
  },
];

/* ──────────────────────────── oefenexamen 10 ───────────────────────────── */

const EXAM_10 = [
  {
    title: 'Brief van de werkgever over het contract',
    section: 'brief',
    intro: intro('Meneer Nkemelu krijgt een brief van zijn werkgever.'),
    body_html:
      '<p>Geachte heer Nkemelu,</p>' +
      '<p>Uw contract loopt af op 31 oktober. Wij zijn tevreden over uw werk en bieden u een ' +
      'nieuw contract aan voor één jaar.</p>' +
      '<p>Uw uren blijven hetzelfde: 32 uur per week. Uw uurloon gaat van € 14,10 naar ' +
      '€ 14,75.</p>' +
      '<p>Wilt u het contract accepteren? Kom dan vóór 15 oktober langs bij de afdeling ' +
      'Personeelszaken om te tekenen.</p>' +
      '<p>Heeft u vragen? Maak gerust een afspraak met mevrouw Bos.</p>',
    questions: [
      {
        prompt: 'Wat verandert er in het nieuwe contract?',
        options: ['het uurloon', 'het aantal uren', 'de functie'],
        correct: 0,
        explanation: 'De uren blijven 32; het uurloon gaat omhoog.',
      },
      {
        prompt: 'Wat moet meneer Nkemelu doen om te accepteren?',
        options: [
          'vóór 15 oktober langsgaan om te tekenen',
          'een e-mail sturen',
          'niets, het gaat automatisch',
        ],
        correct: 0,
        explanation: 'Hij moet vóór 15 oktober bij Personeelszaken tekenen.',
      },
      {
        prompt: 'Hoe lang duurt het nieuwe contract?',
        options: ['een half jaar', 'een jaar', 'voor onbepaalde tijd'],
        correct: 1,
        explanation: '"wij bieden u een nieuw contract aan voor één jaar."',
      },
    ],
  },
  {
    title: 'Advertentie: fietsenmaker',
    section: 'advertentie',
    intro: intro('Lucia zoekt een fietsenmaker in de buurt.'),
    body_html:
      '<h3>Fietsservice Wielrijk</h3>' +
      '<ul>' +
      '<li>Band plakken: € 12,50 — klaar terwijl u wacht</li>' +
      '<li>Grote beurt: € 55, inclusief remmen en ketting</li>' +
      '<li>Nieuwe verlichting: vanaf € 20</li>' +
      '</ul>' +
      '<p>Wij halen uw fiets gratis op binnen de stad. Bel vóór 10.00 uur en u heeft hem dezelfde ' +
      'dag terug.</p>' +
      '<p>Open: maandag tot en met vrijdag 8.30–18.00 uur, zaterdag 9.00–13.00 uur.</p>' +
      '<p>Wij verkopen ook tweedehands fietsen, met drie maanden garantie.</p>',
    questions: [
      {
        prompt: 'Lucia belt om 9.30 uur om haar fiets te laten ophalen. Wanneer heeft zij hem terug?',
        options: ['dezelfde dag', 'de volgende dag', 'binnen een week'],
        correct: 0,
        explanation: '"Bel vóór 10.00 uur en u heeft hem dezelfde dag terug."',
      },
      {
        prompt: 'Wat kost het ophalen van de fiets?',
        options: ['niets', '€ 12,50', '€ 20'],
        correct: 0,
        explanation: '"Wij halen uw fiets gratis op binnen de stad."',
      },
    ],
  },
  {
    title: 'Folder over de tandartsverzekering',
    section: 'folder',
    intro: intro('Bij de verzekering ligt een folder over de aanvullende verzekering.'),
    body_html:
      '<h3>Aanvullend verzekeren voor de tandarts</h3>' +
      '<p>De basisverzekering vergoedt de tandarts niet voor volwassenen. Met een aanvullende ' +
      'verzekering krijgt u een deel terug.</p>' +
      '<ul>' +
      '<li><strong>Tand Basis</strong> — € 9 per maand, vergoedt 75% tot € 250 per jaar</li>' +
      '<li><strong>Tand Plus</strong> — € 19 per maand, vergoedt 75% tot € 500 per jaar</li>' +
      '</ul>' +
      '<p>Wisselen kan één keer per jaar, per 1 januari. U kunt niet halverwege het jaar ' +
      'overstappen naar een hogere dekking.</p>' +
      '<p>Kinderen tot 18 jaar zijn al vergoed vanuit de basisverzekering.</p>',
    questions: [
      {
        prompt: 'Vergoedt de basisverzekering de tandarts voor volwassenen?',
        options: ['Nee.', 'Ja, helemaal.', 'Ja, voor 75%.'],
        correct: 0,
        explanation: '"De basisverzekering vergoedt de tandarts niet voor volwassenen."',
      },
      {
        prompt: 'Wanneer kan Ivan overstappen naar Tand Plus?',
        options: ['per 1 januari', 'elk moment', 'na een half jaar'],
        correct: 0,
        explanation: '"Wisselen kan één keer per jaar, per 1 januari."',
      },
    ],
  },
  {
    title: 'Regels voor de gemeenschappelijke ruimte',
    section: 'regels',
    intro: intro('In een woongebouw hangen regels voor de gezamenlijke ruimte.'),
    body_html:
      '<h3>De ontmoetingsruimte</h3>' +
      '<ul>' +
      '<li>De ruimte is voor alle bewoners, dagelijks van 9.00 tot 22.00 uur.</li>' +
      '<li>Wilt u de ruimte alleen gebruiken, bijvoorbeeld voor een verjaardag? Reserveer dan bij ' +
      'de beheerder, minimaal twee weken van tevoren.</li>' +
      '<li>Na gebruik ruimt u zelf op en veegt u de vloer.</li>' +
      '<li>Er wordt niet gerookt, ook niet bij een open raam.</li>' +
      '</ul>' +
      '<p>De sleutel haalt u op bij de beheerder en brengt u dezelfde dag terug. Bij verlies ' +
      'betaalt u € 25 voor een nieuwe.</p>',
    questions: [
      {
        prompt: 'Rosa wil de ruimte voor een feest. Hoe ver van tevoren reserveert zij?',
        options: ['minimaal twee weken', 'minimaal twee dagen', 'op de dag zelf'],
        correct: 0,
        explanation: '"Reserveer dan bij de beheerder, minimaal twee weken van tevoren."',
      },
      {
        prompt: 'Wat gebeurt er als Rosa de sleutel kwijtraakt?',
        options: ['Zij betaalt € 25.', 'Zij mag de ruimte niet meer gebruiken.', 'Er gebeurt niets.'],
        correct: 0,
        explanation: '"Bij verlies betaalt u € 25 voor een nieuwe."',
      },
      {
        prompt: 'Mag er bij een open raam gerookt worden?',
        options: ['Nee, roken mag nergens.', 'Ja, bij een open raam wel.', 'Alleen na 22.00 uur.'],
        correct: 0,
        explanation: '"Er wordt niet gerookt, ook niet bij een open raam."',
      },
    ],
  },
  {
    title: 'E-mail van de taalschool over het examen',
    section: 'brief',
    intro: intro('Amina krijgt een e-mail van haar taalschool.'),
    body_html:
      '<p>Beste Amina,</p>' +
      '<p>Je hebt je opgegeven voor de oefentoets Lezen op zaterdag 5 juli om 10.00 uur.</p>' +
      '<p>De toets duurt 65 minuten. Je krijgt daarna direct je score, maar de bespreking is pas ' +
      'de week erna in de les.</p>' +
      '<p>Neem een identiteitsbewijs mee. Een woordenboek mag niet.</p>' +
      '<p>Kun je niet? Meld je uiterlijk woensdag af, anders brengen wij € 15 in rekening.</p>',
    questions: [
      {
        prompt: 'Hoe lang duurt de oefentoets?',
        options: ['45 minuten', '65 minuten', '90 minuten'],
        correct: 1,
        explanation: '"De toets duurt 65 minuten."',
      },
      {
        prompt: 'Wanneer wordt de toets besproken?',
        options: [
          'de week erna in de les',
          'direct na de toets',
          'dat staat niet in de tekst',
        ],
        correct: 0,
        explanation: 'De score is direct, de bespreking is de week erna.',
      },
      {
        prompt: 'Amina kan op vrijdag niet meer afmelden. Wat gebeurt er?',
        options: ['Zij betaalt € 15.', 'Er gebeurt niets.', 'Zij mag niet meer meedoen.'],
        correct: 0,
        explanation: 'Afmelden moet uiterlijk woensdag; daarna kost het € 15.',
      },
    ],
  },
  {
    title: 'Formulier: aanmelden voor een cursus EHBO',
    section: 'formulier-lezen',
    intro: intro('Ruben wil een EHBO-cursus doen en leest het aanmeldformulier.'),
    body_html:
      '<h3>Cursus Eerste Hulp</h3>' +
      '<p>In zes avonden leert u wat te doen bij een ongeluk thuis, op straat of op het werk.</p>' +
      '<ul>' +
      '<li>Zes dinsdagavonden, 19.00–21.30 uur</li>' +
      '<li>€ 165, inclusief boek en examen</li>' +
      '<li>Minimaal 8, maximaal 16 deelnemers</li>' +
      '</ul>' +
      '<p>Veel zorgverzekeringen vergoeden de cursus geheel of gedeeltelijk. Vraag dit vooraf na ' +
      'bij uw verzekering; wij kunnen dat niet voor u doen.</p>' +
      '<p>U krijgt het diploma als u minstens vijf van de zes avonden aanwezig was.</p>',
    questions: [
      {
        prompt: 'Ruben mist één avond. Krijgt hij het diploma?',
        options: [
          'Ja, hij was vijf van de zes avonden aanwezig.',
          'Nee, hij moet alle avonden aanwezig zijn.',
          'Alleen als hij het examen haalt.',
        ],
        correct: 0,
        explanation: 'Het diploma vereist minstens vijf van de zes avonden.',
      },
      {
        prompt: 'Wie vraagt de vergoeding na bij de verzekering?',
        options: ['Ruben zelf', 'de cursusorganisatie', 'de gemeente'],
        correct: 0,
        explanation: '"Vraag dit vooraf na bij uw verzekering; wij kunnen dat niet voor u doen."',
      },
    ],
  },
  {
    title: 'Advertentie: oppas gezocht',
    section: 'advertentie',
    intro: intro('Elena zoekt een bijbaan en ziet deze advertentie op het prikbord.'),
    body_html:
      '<h3>Oppas gezocht voor twee kinderen</h3>' +
      '<p>Wij zoeken iemand die twee middagen per week op onze kinderen (4 en 7 jaar) past.</p>' +
      '<ul>' +
      '<li>Maandag en donderdag, 15.00–18.30 uur</li>' +
      '<li>Ophalen van school en daarna thuis spelen</li>' +
      '<li>€ 12 per uur</li>' +
      '<li>Fiets nodig; de school is tien minuten fietsen</li>' +
      '</ul>' +
      '<p>Wij koken zelf; u hoeft niet te koken. Wel graag even samen opruimen voordat wij ' +
      'thuiskomen.</p>' +
      '<p>Reageren kan via het nummer op de strook hieronder.</p>',
    questions: [
      {
        prompt: 'Wat hoeft Elena niet te doen?',
        options: ['koken', 'de kinderen van school halen', 'opruimen'],
        correct: 0,
        explanation: '"Wij koken zelf; u hoeft niet te koken."',
      },
      {
        prompt: 'Hoeveel uur werkt zij per week?',
        options: ['drieënhalf uur', 'zeven uur', 'tien uur'],
        correct: 1,
        explanation: 'Twee middagen van 3,5 uur is samen 7 uur.',
      },
      {
        prompt: 'Wat heeft Elena nodig voor deze baan?',
        options: ['een fiets', 'een auto', 'een diploma'],
        correct: 0,
        explanation: '"Fiets nodig; de school is tien minuten fietsen."',
      },
    ],
  },
  {
    title: 'Bericht over de glasbak',
    section: 'regels',
    intro: intro('Bij de glasbak hangt een bericht van de gemeente.'),
    body_html:
      '<h3>Wat mag er in de glasbak?</h3>' +
      '<p><strong>Wel:</strong> flessen en potten van glas. De dop mag erop blijven zitten; die ' +
      'halen wij er in de fabriek af.</p>' +
      '<p><strong>Niet:</strong> drinkglazen, spiegels, ruiten en porselein. Dat glas smelt bij ' +
      'een andere temperatuur en bederft de hele partij.</p>' +
      '<p>Gooi geen glas in de bak tussen 22.00 en 7.00 uur; dat geeft veel geluid voor de ' +
      'buren.</p>' +
      '<p>Is de bak vol? Meld dat via de app; zet uw glas niet ernaast.</p>',
    questions: [
      {
        prompt: 'Mag een kapot drinkglas in de glasbak?',
        options: ['Nee.', 'Ja.', 'Alleen zonder dop.'],
        correct: 0,
        explanation: 'Drinkglazen staan bij "Niet".',
      },
      {
        prompt: 'Wat moet u doen met de dop op een fles?',
        options: [
          'Die mag erop blijven zitten.',
          'Die moet eraf.',
          'Die hoort bij het plastic.',
        ],
        correct: 0,
        explanation: '"De dop mag erop blijven zitten."',
      },
      {
        prompt: 'De bak is vol. Wat doet u?',
        options: [
          'het melden via de app',
          'het glas ernaast zetten',
          'naar een andere wijk gaan',
        ],
        correct: 0,
        explanation: '"Meld dat via de app; zet uw glas niet ernaast."',
      },
    ],
  },
  {
    title: 'Wat kost een huisdier?',
    section: 'artikel',
    intro: intro('In een tijdschrift staat een artikel over de kosten van een huisdier.'),
    body_html:
      '<h3>Denk vooraf aan de kosten</h3>' +
      '<p>Een hond of kat aanschaffen is één ding; hem houden kost jaren geld.</p>' +
      '<p>Reken voor een kat op ongeveer € 500 per jaar aan eten, zand en de dierenarts. Voor een ' +
      'hond is dat al gauw het dubbele.</p>' +
      '<p>De grootste onverwachte kosten zijn medisch. Een operatie kan honderden euro’s kosten. ' +
      'Een dierenverzekering kan helpen, maar niet alles wordt vergoed.</p>' +
      '<p>Twijfelt u? Bij het asiel kunt u eerst een tijdje als vrijwilliger honden uitlaten.</p>',
    questions: [
      {
        prompt: 'Hoeveel kost een hond ongeveer per jaar?',
        options: ['€ 500', '€ 1.000', '€ 250'],
        correct: 1,
        explanation: 'Voor een kat ongeveer € 500; voor een hond het dubbele.',
      },
      {
        prompt: 'Wat kan iemand doen die twijfelt?',
        options: [
          'vrijwilliger worden bij het asiel',
          'eerst een verzekering afsluiten',
          'een goedkoper dier kiezen',
        ],
        correct: 0,
        explanation: '"Bij het asiel kunt u eerst een tijdje als vrijwilliger honden uitlaten."',
      },
    ],
  },
  {
    title: 'Brief over de gemeentelijke belasting',
    section: 'brief',
    intro: intro('Mevrouw Tran krijgt een brief over de gemeentebelasting.'),
    body_html:
      '<p>Geachte mevrouw Tran,</p>' +
      '<p>U ontvangt de aanslag gemeentebelastingen voor dit jaar: € 384 in totaal.</p>' +
      '<p>U kunt in één keer betalen vóór 30 juni, of in tien maandelijkse termijnen via ' +
      'automatische incasso.</p>' +
      '<p>Heeft u een laag inkomen? Dan komt u misschien in aanmerking voor kwijtschelding. Dat ' +
      'betekent dat u niet hoeft te betalen. Vraag het aan binnen zes weken na de datum van deze ' +
      'brief.</p>' +
      '<p>Vragen? Bel 14 010 of kom langs bij het belastingloket.</p>',
    questions: [
      {
        prompt: 'Wat betekent kwijtschelding?',
        options: [
          'dat zij niet hoeft te betalen',
          'dat zij later mag betalen',
          'dat zij de helft betaalt',
        ],
        correct: 0,
        explanation: '"Dat betekent dat u niet hoeft te betalen."',
      },
      {
        prompt: 'Binnen hoeveel tijd moet zij kwijtschelding aanvragen?',
        options: ['binnen zes weken', 'vóór 30 juni', 'binnen tien maanden'],
        correct: 0,
        explanation: '"Vraag het aan binnen zes weken na de datum van deze brief."',
      },
    ],
  },
];

export const LEZEN_EXAMS = [
  EXAM_1, EXAM_2, EXAM_3, EXAM_4, EXAM_5,
  EXAM_6, EXAM_7, EXAM_8, EXAM_9, EXAM_10,
];
