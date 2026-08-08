/**
 * Luisteren A2 — ten oefenexamens of 25 vragen over exactly tien fragmenten.
 *
 * ## Shape, from DUO's own player
 * Left pane: a one-sentence scenario, then "Lees eerst de vraag. / Luister daarna naar de tekst.",
 * then a still photo of the setting and the audio player. Right pane: one vraag at a time. **The
 * question is never in the audio** — the candidate reads it before playing the fragment, which is
 * what the instruction says to do. Fragments have **one or two speakers, never more**: a gesprek,
 * an omroepbericht, a voicemail, an instructie or a short monoloog. Options are bare noun phrases
 * with a period ("Twee maanden.", "In lokaal 15."), and the answer axes are numbers, times, places
 * and reasons.
 *
 * ## Casting is a content decision, and it is forced
 * `voice_cast` maps every speaker tag to a key of `data/tts-voices.json`, and the generator refuses
 * an uncast speaker, an unknown key, or two speakers sharing one voice rather than guessing. The
 * script establishes each speaker's gender through names and address forms ("mevrouw De Wit",
 * "Hoi Peter"), so the cast is not a preference — a mismatch is an immediately audible content bug
 * and it is not recoverable from the mp3 afterwards.
 *
 * ## Length
 * `exam_formats` puts A2 Luisteren audio at **40–50 seconds**, and eleven_v3 runs at roughly 150
 * wpm with no pacing control, so every script here is written to land at **110–125 words**. The
 * runner measures the generated file and reports anything outside the window rather than shipping
 * it quietly. (Worth knowing: DUO's own fragments look closer to 25–40 seconds. That discrepancy is
 * recorded in the plan and is a decision for the owner, not something to fix by writing shorter
 * scripts than the table allows.)
 *
 * `section` is a `sections.slug` for (a2, luisteren): gesprek, mededeling, telefoongesprek,
 * instructie.
 */

const LISTEN_FIRST = 'Lees eerst de vraag. Luister daarna naar de tekst.';
const intro = scenario => `${scenario} ${LISTEN_FIRST}`;

/* ───────────────────────────── oefenexamen 1 ───────────────────────────── */

const EXAM_1 = [
  {
    title: 'Bij de huisarts',
    section: 'telefoongesprek',
    intro: intro('Youssef belt de huisartsenpraktijk voor een afspraak.'),
    image: { slot: 'lu-1-1', query: 'medical receptionist phone desk clinic' },
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Huisartsenpraktijk Molenwijk, goedemorgen. Waarmee kan ik u helpen?'],
      ['B', 'Goedemorgen, u spreekt met Youssef Bakkali. Ik wil graag een afspraak maken bij de dokter.'],
      ['A', 'Dat kan. Ik heb vrijdag nog een plekje om tien over half elf in de ochtend.'],
      ['B', 'Vrijdagochtend werk ik helaas. Kan het ook later op die dag?'],
      ['A', 'Even kijken hoor. Om kwart voor vier is er ook nog plek bij dokter Timmermans.'],
      ['B', 'Dat is goed, dan kom ik om kwart voor vier. Moet ik nog iets meenemen?'],
      ['A', 'Alleen uw verzekeringspas. En komt u alstublieft vijf minuten eerder.'],
      ['B', 'Prima, dank u wel. Tot vrijdag.'],
    ],
    questions: [
      {
        prompt: 'Waarom belt Youssef?',
        options: ['Om een afspraak te maken.', 'Om een afspraak af te zeggen.', 'Om medicijnen te vragen.'],
        correct: 0,
        explanation: 'Hij zegt: "Ik wil graag een afspraak maken bij de dokter."',
      },
      {
        prompt: 'Hoe laat komt Youssef?',
        options: ['Om 10.30 uur.', 'Om 15.45 uur.', 'Om 16.15 uur.'],
        correct: 1,
        explanation: 'Kwart voor vier is 15.45 uur.',
      },
      {
        prompt: 'Wat moet Youssef meenemen?',
        options: ['Zijn verzekeringspas.', 'Zijn paspoort.', 'Een lijstje met vragen.'],
        correct: 0,
        explanation: 'De assistente zegt: "Alleen uw verzekeringspas."',
      },
    ],
  },
  {
    title: 'Omroepbericht in de supermarkt',
    section: 'mededeling',
    intro: intro('Ines doet boodschappen. Zij hoort een bericht door de luidspreker.'),
    image: { slot: 'lu-1-2', query: 'supermarket aisle shopping trolley' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Dames en heren, goedemiddag en welkom in onze winkel. Wij hebben vandaag een aanbieding ' +
          'bij de groente en het fruit: alle aardbeien kosten deze middag twee euro per doosje in ' +
          'plaats van drie euro vijftig. De aanbieding geldt tot vijf uur. Verder willen wij u ' +
          'vragen om uw winkelwagen na het boodschappen doen terug te zetten bij de ingang. Wij ' +
          'zoeken ook nog een klein meisje van ongeveer vier jaar met een rode jas. Zij wacht bij ' +
          'de informatiebalie op haar vader of moeder. Wij sluiten vandaag om acht uur. Dank u ' +
          'wel en nog een fijne dag.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat kost een doosje aardbeien vanmiddag?',
        options: ['Twee euro.', 'Drie euro vijftig.', 'Vijf euro.'],
        correct: 0,
        explanation: 'De aanbieding is twee euro in plaats van drie euro vijftig.',
      },
      {
        prompt: 'Wat wacht er bij de informatiebalie?',
        options: ['Een kind.', 'Een winkelwagen.', 'Een pakket.'],
        correct: 0,
        explanation: 'Een meisje van ongeveer vier jaar wacht daar op haar ouders.',
      },
      {
        prompt: 'Hoe laat gaat de winkel dicht?',
        options: ['Om vijf uur.', 'Om acht uur.', 'Om negen uur.'],
        correct: 1,
        explanation: '"Wij sluiten vandaag om acht uur." Vijf uur is het einde van de aanbieding.',
      },
    ],
  },
  {
    title: 'Op straat',
    section: 'gesprek',
    intro: intro('Steven komt Jari tegen op straat. Ze praten even met elkaar.'),
    image: { slot: 'lu-1-3', query: 'two men talking street city' },
    voice_cast: { A: 'man_young', B: 'man_older' },
    lines: [
      ['A', 'Hé Jari! Wat leuk om je te zien. Hoe gaat het met je?'],
      ['B', 'Goed hoor, Steven. Ik ben net verhuisd, weet je dat al?'],
      ['A', 'Nee! Waar woon je nu dan?'],
      ['B', 'Aan de Kerkstraat, boven de bakker. Het is kleiner, maar ik ben nu wel dichter bij mijn werk.'],
      ['A', 'Handig. Fiets je nu naar je werk?'],
      ['B', 'Ja, tien minuten maar. Vroeger zat ik elke dag drie kwartier in de trein.'],
      ['A', 'Wat een verschil. Kom je zaterdag nog naar de verjaardag van Anne?'],
      ['B', 'Ik wil wel, maar ik moet die dag werken tot vier uur. Ik kom in de avond.'],
    ],
    questions: [
      {
        prompt: 'Waar woont Jari nu?',
        options: ['Boven een bakker.', 'Naast het station.', 'Bij zijn werk in het gebouw.'],
        correct: 0,
        explanation: 'Hij zegt: "Aan de Kerkstraat, boven de bakker."',
      },
      {
        prompt: 'Hoe lang doet Jari nu over de reis naar zijn werk?',
        options: ['Tien minuten.', 'Drie kwartier.', 'Een uur.'],
        correct: 0,
        explanation: 'Tien minuten met de fiets; drie kwartier was vroeger met de trein.',
      },
      {
        prompt: 'Waarom komt Jari zaterdag pas later?',
        options: ['Hij moet werken.', 'Hij is ziek.', 'Hij heeft geen vervoer.'],
        correct: 0,
        explanation: '"Ik moet die dag werken tot vier uur."',
      },
    ],
  },
  {
    title: 'Bericht van de school',
    section: 'mededeling',
    intro: intro('De vader van Sofie luistert een bericht af op zijn telefoon.'),
    image: { slot: 'lu-1-4', query: 'primary school building entrance' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Goedemiddag, u spreekt met Karin de Vries van basisschool De Regenboog. Ik bel over het ' +
          'schoolreisje van groep vijf van volgende week vrijdag. Wij vertrekken om half negen ' +
          'vanaf het schoolplein, dus wilt u zorgen dat Sofie er om kwart over acht is? Wij zijn ' +
          'rond vier uur weer terug. Geeft u haar alstublieft brood en drinken mee en ook een ' +
          'regenjas, want het kan die dag nat worden. Geld is niet nodig; alles is al betaald. ' +
          'Heeft u nog vragen, belt u dan gerust terug. Fijne dag verder.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoe laat moet Sofie op school zijn?',
        options: ['Om 8.15 uur.', 'Om 8.30 uur.', 'Om 16.00 uur.'],
        correct: 0,
        explanation: 'Kwart over acht; om half negen vertrekt de bus.',
      },
      {
        prompt: 'Wat hoeft Sofie niet mee te nemen?',
        options: ['Geld.', 'Brood.', 'Een regenjas.'],
        correct: 0,
        explanation: '"Geld is niet nodig; alles is al betaald."',
      },
    ],
  },
  {
    title: 'Bij de balie van de sportschool',
    section: 'gesprek',
    intro: intro('Meryem wil lid worden van een sportschool.'),
    image: { slot: 'lu-1-5', query: 'gym reception desk fitness' },
    voice_cast: { A: 'man_young', B: 'woman_young' },
    lines: [
      ['A', 'Goedemiddag, kan ik u helpen?'],
      ['B', 'Ja, ik zou graag lid willen worden. Wat kost dat hier?'],
      ['A', 'Wij hebben twee soorten. Voor dertig euro per maand kunt u onbeperkt sporten.'],
      ['B', 'En als ik maar twee keer per week kom?'],
      ['A', 'Dan is het tweeëntwintig euro per maand. Daarbij zitten wel de groepslessen inbegrepen.'],
      ['B', 'Dat lijkt me genoeg. Kan ik vandaag meteen beginnen?'],
      ['A', 'Zeker. Neemt u dan uw bankpas mee naar de balie, en een handdoek voor in de zaal.'],
      ['B', 'Mijn bankpas heb ik bij me. Ik haal thuis even een handdoek en dan kom ik terug.'],
    ],
    questions: [
      {
        prompt: 'Hoeveel betaalt Meryem per maand?',
        options: ['Tweeëntwintig euro.', 'Dertig euro.', 'Vijftig euro.'],
        correct: 0,
        explanation: 'Zij komt twee keer per week; dat abonnement kost tweeëntwintig euro.',
      },
      {
        prompt: 'Wat gaat Meryem eerst thuis halen?',
        options: ['Een handdoek.', 'Haar bankpas.', 'Sportschoenen.'],
        correct: 0,
        explanation: 'Haar bankpas heeft zij al bij zich; de handdoek nog niet.',
      },
    ],
  },
  {
    title: 'Instructie op het werk',
    section: 'instructie',
    intro: intro('Op haar eerste werkdag krijgt Ana uitleg van haar leidinggevende.'),
    image: { slot: 'lu-1-6', query: 'warehouse worker instructions clipboard' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Welkom bij ons, Ana. Ik leg even uit hoe de dag hier gaat. Je begint om zeven uur ' +
          'en dan trek je eerst je werkkleding en je veiligheidsschoenen aan; dat is verplicht in ' +
          'de hal. Om half tien is er een kwartier pauze en om half een lunchen we samen, een half ' +
          'uur. Als je ziek bent, bel je vóór half zeven naar dit nummer, niet naar mij ' +
          'persoonlijk. Je pauzes en je uren schrijf je aan het eind van de dag op de lijst bij de ' +
          'deur. Heb je iets nodig, kom dan gewoon even langs.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet Ana aantrekken in de hal?',
        options: ['Werkkleding en veiligheidsschoenen.', 'Alleen een jas.', 'Haar eigen kleren.'],
        correct: 0,
        explanation: 'Dat is verplicht in de hal.',
      },
      {
        prompt: 'Wat moet Ana doen als zij ziek is?',
        options: [
          'Vóór half zeven naar het nummer bellen.',
          'Haar leidinggevende persoonlijk bellen.',
          'Een e-mail sturen.',
        ],
        correct: 0,
        explanation: 'Hij zegt uitdrukkelijk: bellen naar dat nummer, niet naar hem persoonlijk.',
      },
      {
        prompt: 'Waar schrijft Ana haar uren op?',
        options: ['Op de lijst bij de deur.', 'In een app.', 'Op de computer in het kantoor.'],
        correct: 0,
        explanation: '"Je pauzes en je uren schrijf je op de lijst bij de deur."',
      },
    ],
  },
  {
    title: 'In de trein',
    section: 'mededeling',
    intro: intro('Julio zit in de trein en hoort een mededeling van de conducteur.'),
    image: { slot: 'lu-1-7', query: 'train interior passengers seats' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Dames en heren, goedemiddag. Wij naderen over enkele minuten station Amersfoort ' +
          'Centraal. Reizigers naar Zwolle en Groningen moeten hier overstappen op spoor vijf; ' +
          'die trein vertrekt over twaalf minuten. Let op: de trein naar Utrecht van spoor drie ' +
          'rijdt vandaag niet, in verband met werkzaamheden aan het spoor. Er rijden in plaats ' +
          'daarvan bussen vanaf de voorkant van het station, naast de fietsenstalling. Houdt u ' +
          'daarbij rekening met ongeveer een half uur extra reistijd. Deze trein rijdt verder ' +
          'naar Apeldoorn en Deventer. Wilt u bij het uitstappen goed op uw bagage letten en ' +
          'niets in de trein laten liggen? Wij wensen u een goede reis en een prettige dag.',
      ],
    ],
    questions: [
      {
        prompt: 'Julio moet naar Zwolle. Wat moet hij doen?',
        options: [
          'Overstappen op spoor vijf.',
          'In deze trein blijven zitten.',
          'De bus nemen bij de voorkant.',
        ],
        correct: 0,
        explanation: 'Reizigers naar Zwolle stappen over op spoor vijf.',
      },
      {
        prompt: 'Waarom rijdt de trein naar Utrecht niet?',
        options: ['Door werkzaamheden.', 'Door een ongeluk.', 'Door het weer.'],
        correct: 0,
        explanation: '"In verband met werkzaamheden aan het spoor."',
      },
    ],
  },
  {
    title: 'Voicemail van de garage',
    section: 'telefoongesprek',
    intro: intro('Meneer De Boer luistert een bericht van de garage af.'),
    image: { slot: 'lu-1-8', query: 'car garage mechanic workshop' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemiddag meneer De Boer, u spreekt met Sandra van Garage Van Dijk. Ik bel over uw ' +
          'auto. Wij hebben hem nagekeken en de remmen moeten inderdaad vervangen worden. Dat ' +
          'kost ongeveer driehonderd twintig euro, inclusief het werk. De band die u noemde is ' +
          'gelukkig nog goed, dus daar hoeft niets aan te gebeuren. Wij hebben de onderdelen ' +
          'morgenochtend binnen, dus als u akkoord gaat, is de auto morgen aan het eind van de ' +
          'middag klaar. Belt u ons even terug om het door te geven? Ons nummer is ' +
          'nul tien, drie vier vijf, zeventien twintig. Dank u wel.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet er aan de auto gebeuren?',
        options: ['De remmen vervangen.', 'Een band vervangen.', 'Alleen een controle.'],
        correct: 0,
        explanation: 'De remmen moeten vervangen worden; de band is nog goed.',
      },
      {
        prompt: 'Wanneer is de auto klaar?',
        options: [
          'Morgen aan het eind van de middag.',
          'Vandaag aan het eind van de dag.',
          'Overmorgen in de ochtend.',
        ],
        correct: 0,
        explanation: 'Als hij akkoord gaat, is de auto morgen laat in de middag klaar.',
      },
      {
        prompt: 'Wat moet meneer De Boer doen?',
        options: ['Terugbellen.', 'Langskomen.', 'Een e-mail sturen.'],
        correct: 0,
        explanation: '"Belt u ons even terug om het door te geven?"',
      },
    ],
  },
  {
    title: 'Bij de kapper',
    section: 'gesprek',
    intro: intro('Nadia zit bij de kapper. Ze praat met de kapster.'),
    image: { slot: 'lu-1-9', query: 'hairdresser salon client chair' },
    voice_cast: { A: 'woman_older', B: 'woman_young' },
    lines: [
      ['A', 'Zo, wat gaan we vandaag doen?'],
      ['B', 'Ik wil het graag een stuk korter. Tot ongeveer hier, op mijn schouders.'],
      ['A', 'Dat kan. Wilt u het ook een andere kleur?'],
      ['B', 'Nee, verven liever niet. Alleen knippen en wassen.'],
      ['A', 'Prima. Dat duurt ongeveer drie kwartier en het kost negenentwintig euro.'],
      ['B', 'Dat is goed. Kan ik met de pas betalen?'],
      ['A', 'Ja hoor, contant of met de pas, allebei prima. Loopt u maar mee naar de wasbak.'],
      ['B', 'Fijn. En kan ik voor over acht weken meteen een nieuwe afspraak maken?'],
    ],
    questions: [
      {
        prompt: 'Wat wil Nadia laten doen?',
        options: ['Alleen knippen en wassen.', 'Knippen en verven.', 'Alleen verven.'],
        correct: 0,
        explanation: 'Zij zegt: "Verven liever niet. Alleen knippen en wassen."',
      },
      {
        prompt: 'Hoeveel kost het?',
        options: ['Negenentwintig euro.', 'Negenendertig euro.', 'Twintig euro.'],
        correct: 0,
        explanation: 'De kapster noemt negenentwintig euro.',
      },
    ],
  },
  {
    title: 'Uitleg over het afval',
    section: 'instructie',
    intro: intro('Een medewerker van de gemeente legt uit hoe het afval werkt.'),
    image: { slot: 'lu-1-10', query: 'waste containers recycling street netherlands' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Ik leg u even uit hoe wij hier het afval ophalen. Het gewone huisvuil gaat in de grijze ' +
          'container en die wordt elke woensdag geleegd. Zet u hem alstublieft de avond ervoor ' +
          'buiten. Groente, fruit en tuinafval doet u in de groene bak; die halen wij eens in de ' +
          'twee weken op, op maandag. Papier en karton brengt u zelf naar de blauwe container op ' +
          'het plein bij de school. Voor glas staat daar ook een bak. Oude spullen zoals een bank ' +
          'of een koelkast halen wij gratis op, maar dan moet u eerst een afspraak maken via de ' +
          'website.',
      ],
    ],
    questions: [
      {
        prompt: 'Wanneer wordt de grijze container geleegd?',
        options: ['Elke woensdag.', 'Elke maandag.', 'Eens in de twee weken.'],
        correct: 0,
        explanation: 'Het gewone huisvuil gaat elke woensdag mee.',
      },
      {
        prompt: 'Waar moet papier naartoe?',
        options: [
          'Naar de blauwe container op het plein.',
          'In de groene bak.',
          'In de grijze container.',
        ],
        correct: 0,
        explanation: 'Papier en karton brengt u zelf naar de blauwe container bij de school.',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 2 ───────────────────────────── */

const EXAM_2 = [
  {
    title: 'Bij de balie van de gemeente',
    section: 'gesprek',
    intro: intro('Meneer Diallo staat bij de balie van de gemeente.'),
    image: { slot: 'lu-2-1', query: 'municipality service desk citizen counter' },
    voice_cast: { A: 'woman_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemiddag, waarmee kan ik u helpen?'],
      ['B', 'Goedemiddag. Ik wil graag een nieuw paspoort aanvragen. Mijn oude is bijna verlopen.'],
      ['A', 'Heeft u een afspraak gemaakt? Wij werken hier alleen op afspraak.'],
      ['B', 'Nee, dat wist ik niet. Kan ik er nu meteen een maken?'],
      ['A', 'Zeker. Ik heb volgende week dinsdag om half elf nog een plek vrij.'],
      ['B', 'Dat is prima. Wat moet ik dan meenemen?'],
      ['A', 'Uw oude paspoort en één recente pasfoto. En denk aan uw bankpas, want u betaalt meteen.'],
      ['B', 'Duidelijk. En hoe lang duurt het voordat het klaar is?'],
      ['A', 'Na vijf werkdagen kunt u het ophalen. Dat kan zonder afspraak.'],
    ],
    questions: [
      {
        prompt: 'Waarom kan meneer Diallo vandaag niet geholpen worden?',
        options: ['Hij heeft geen afspraak.', 'Zijn paspoort is al verlopen.', 'De balie is gesloten.'],
        correct: 0,
        explanation: 'De medewerker zegt: "Wij werken hier alleen op afspraak."',
      },
      {
        prompt: 'Wat moet hij meenemen naar de afspraak?',
        options: [
          'Zijn oude paspoort, een pasfoto en zijn bankpas.',
          'Alleen een pasfoto.',
          'Zijn rijbewijs en contant geld.',
        ],
        correct: 0,
        explanation: 'Die drie dingen worden genoemd.',
      },
      {
        prompt: 'Hoe kan hij het paspoort ophalen?',
        options: ['Zonder afspraak.', 'Met een nieuwe afspraak.', 'Het wordt thuisgestuurd.'],
        correct: 0,
        explanation: '"Na vijf werkdagen kunt u het ophalen. Dat kan zonder afspraak."',
      },
    ],
  },
  {
    title: 'Omroepbericht op het station',
    section: 'mededeling',
    intro: intro('Elena staat op het perron en hoort een omroepbericht.'),
    image: { slot: 'lu-2-2', query: 'train station platform sign departure' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Beste reizigers, uw aandacht alstublieft voor de volgende mededeling. De intercity naar ' +
          'Amsterdam Centraal van tien over half drie heeft ongeveer twintig minuten vertraging. ' +
          'Dit komt door een defecte trein even verderop bij Gouda. Wij verwachten de trein rond ' +
          'drie uur op spoor zeven, en niet op spoor vier zoals aangegeven op de borden. Reizigers ' +
          'die haast hebben, adviseren wij om de stoptrein van spoor twee te nemen; die vertrekt ' +
          'over vier minuten en is ongeveer een kwartier later in Amsterdam. Onze excuses voor het ' +
          'ongemak en een prettige reis nog.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoeveel vertraging heeft de intercity?',
        options: ['Ongeveer twintig minuten.', 'Ongeveer een kwartier.', 'Ongeveer vier minuten.'],
        correct: 0,
        explanation: 'De omroeper noemt ongeveer twintig minuten.',
      },
      {
        prompt: 'Van welk spoor vertrekt de intercity nu?',
        options: ['Van spoor zeven.', 'Van spoor vier.', 'Van spoor twee.'],
        correct: 0,
        explanation: 'Spoor zeven, en niet spoor vier zoals op de borden staat.',
      },
      {
        prompt: 'Wat kunnen reizigers met haast doen?',
        options: [
          'De stoptrein van spoor twee nemen.',
          'Op spoor vier wachten.',
          'Een taxi nemen.',
        ],
        correct: 0,
        explanation: 'Dat advies wordt letterlijk gegeven.',
      },
    ],
  },
  {
    title: 'Telefoontje van de school',
    section: 'telefoongesprek',
    intro: intro('De moeder van Amir wordt gebeld door de school.'),
    image: { slot: 'lu-2-3', query: 'school office phone teacher desk' },
    voice_cast: { A: 'woman_older', B: 'woman_young' },
    lines: [
      ['A', 'Goedemiddag, u spreekt met Karin de Groot van basisschool De Wilgen.'],
      ['B', 'Goedemiddag, met de moeder van Amir.'],
      ['A', 'Ik bel omdat Amir op het schoolplein is gevallen. Hij heeft een dikke knie.'],
      ['B', 'O nee. Is het ernstig?'],
      ['A', 'Nee, gelukkig niet. Hij kan lopen, maar hij vindt het wel vervelend. Wij hebben er ijs op gedaan.'],
      ['B', 'Fijn dat u belt. Moet ik hem komen halen?'],
      ['A', 'Dat hoeft niet per se. Als u wilt, mag hij gewoon tot half drie blijven.'],
      ['B', 'Dan laat ik hem blijven. Ik haal hem straks zelf op in plaats van met de bus.'],
      ['A', 'Prima, dat spreken we zo af. Fijne middag nog.'],
    ],
    questions: [
      {
        prompt: 'Waarom belt de school?',
        options: [
          'Amir is gevallen en heeft een dikke knie.',
          'Amir is ziek geworden.',
          'Amir heeft ruzie gehad.',
        ],
        correct: 0,
        explanation: 'Dat zegt de juf meteen aan het begin.',
      },
      {
        prompt: 'Wat besluit de moeder van Amir?',
        options: [
          'Hij blijft tot half drie op school.',
          'Zij haalt hem meteen op.',
          'Zij brengt hem naar de dokter.',
        ],
        correct: 0,
        explanation: 'Zij laat hem blijven en haalt hem straks zelf op.',
      },
    ],
  },
  {
    title: 'Instructie bij de kringloopwinkel',
    section: 'instructie',
    intro: intro('Op haar eerste dag als vrijwilliger krijgt Zeynep uitleg.'),
    image: { slot: 'lu-2-4', query: 'thrift shop volunteer sorting clothes' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Fijn dat je er bent, Zeynep. Ik leg even uit hoe het hier werkt. Mensen brengen spullen ' +
          'binnen bij de achterdeur, en jij kijkt eerst of alles heel en schoon is. Kapotte spullen ' +
          'nemen wij niet aan, hoe vervelend dat soms ook is. Wat wij wel aannemen, gaat naar de ' +
          'sorteertafel: kleding links, servies en boeken rechts. Prijzen schrijf je niet zelf op; ' +
          'dat doet Marloes aan het eind van de dag. Tussen twaalf en half een hebben we samen ' +
          'pauze in de kantine. Als je iets niet weet, vraag het gerust; niemand vindt dat gek.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet Zeynep als eerste doen met binnengebrachte spullen?',
        options: [
          'Kijken of alles heel en schoon is.',
          'De prijs erop schrijven.',
          'Ze meteen in de winkel zetten.',
        ],
        correct: 0,
        explanation: '"Jij kijkt eerst of alles heel en schoon is."',
      },
      {
        prompt: 'Wie bepaalt de prijzen?',
        options: ['Marloes.', 'Zeynep zelf.', 'De klant.'],
        correct: 0,
        explanation: '"Prijzen schrijf je niet zelf op; dat doet Marloes."',
      },
      {
        prompt: 'Hoe laat is de pauze?',
        options: ['Tussen 12.00 en 12.30 uur.', 'Om 13.00 uur.', 'Aan het eind van de dag.'],
        correct: 0,
        explanation: 'Tussen twaalf en half een.',
      },
    ],
  },
  {
    title: 'In de kledingwinkel',
    section: 'gesprek',
    intro: intro('Rosa wil een broek ruilen in een kledingwinkel.'),
    image: { slot: 'lu-2-5', query: 'clothing store counter customer service' },
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Goedemiddag, kan ik u helpen?'],
      ['B', 'Ja, ik heb vorige week deze broek gekocht, maar hij is te klein.'],
      ['A', 'Geen probleem. Heeft u de bon nog bij u?'],
      ['B', 'Ja, hier is hij. Ik zou hem graag ruilen voor een maat groter.'],
      ['A', 'Even kijken… in deze kleur hebben we maat 42 helaas niet meer.'],
      ['B', 'En in het zwart?'],
      ['A', 'Zwart hebben we wel. Wilt u die passen? Het pashokje is achterin, rechts.'],
      ['B', 'Doe maar. En als hij niet past, krijg ik dan mijn geld terug?'],
      ['A', 'Dat kan, binnen dertig dagen en met de bon. Dan is er niets aan de hand.'],
    ],
    questions: [
      {
        prompt: 'Waarom wil Rosa de broek ruilen?',
        options: ['Hij is te klein.', 'Hij is kapot.', 'De kleur bevalt niet.'],
        correct: 0,
        explanation: 'Zij zegt: "hij is te klein."',
      },
      {
        prompt: 'Welke kleur gaat Rosa passen?',
        options: ['Zwart.', 'Dezelfde kleur als eerst.', 'Blauw.'],
        correct: 0,
        explanation: 'De maat is er niet in die kleur, wel in het zwart.',
      },
    ],
  },
  {
    title: 'Bericht van de apotheek',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Kaya luistert een bericht van de apotheek af.'),
    image: { slot: 'lu-2-6', query: 'pharmacy counter medicine shelves' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemiddag mevrouw Kaya, u spreekt met apotheek Het Kruispunt. Ik bel over uw ' +
          'herhaalrecept. Twee van de drie medicijnen liggen voor u klaar en die kunt u vandaag nog ' +
          'ophalen. Het derde medicijn is helaas tijdelijk niet leverbaar bij de fabrikant. Wij ' +
          'hebben daarover overlegd met uw huisarts en zij stelt een ander middel voor dat precies ' +
          'hetzelfde werkt. Als u het daarmee eens bent, hoeft u niets te doen; wij leggen het er ' +
          'dan bij. Wilt u het liever eerst met de huisarts bespreken, belt u ons dan even terug. ' +
          'Wij zijn open tot half zes. Dank u wel.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat is er aan de hand met het derde medicijn?',
        options: [
          'Het is tijdelijk niet leverbaar.',
          'Het is te duur geworden.',
          'De huisarts heeft het gestopt.',
        ],
        correct: 0,
        explanation: '"Het derde medicijn is helaas tijdelijk niet leverbaar bij de fabrikant."',
      },
      {
        prompt: 'Wat moet mevrouw Kaya doen als zij akkoord gaat met het andere middel?',
        options: ['Niets.', 'De apotheek terugbellen.', 'De huisarts bellen.'],
        correct: 0,
        explanation: '"Als u het daarmee eens bent, hoeft u niets te doen."',
      },
    ],
  },
  {
    title: 'Mededeling in het buurthuis',
    section: 'mededeling',
    intro: intro('In het buurthuis hoort Samir een mededeling.'),
    image: { slot: 'lu-2-7', query: 'community centre hall people' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Goedemiddag allemaal, mag ik heel even uw aandacht? Ik wil twee dingen melden. Ten eerste ' +
          'gaat de computerles van vanmiddag niet door, omdat de docent ziek is geworden. De les ' +
          'wordt ingehaald op vrijdag om dezelfde tijd, dus twee uur ’s middags. Ten tweede: vanaf ' +
          'volgende maand is het buurthuis ook op zondagmiddag open, van één tot vijf uur. Er is ' +
          'dan koffie en er staan spelletjes klaar. Wij zoeken nog wel vrijwilligers om die ' +
          'middagen te draaien. Heeft u interesse, laat het dan even weten bij de balie. Dank u ' +
          'wel en een fijne middag.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom gaat de computerles niet door?',
        options: ['De docent is ziek.', 'Er zijn te weinig mensen.', 'De computers zijn kapot.'],
        correct: 0,
        explanation: '"omdat de docent ziek is geworden."',
      },
      {
        prompt: 'Wanneer wordt de les ingehaald?',
        options: ['Vrijdag om 14.00 uur.', 'Zondag om 13.00 uur.', 'Volgende maand.'],
        correct: 0,
        explanation: 'Vrijdag, dezelfde tijd: twee uur ’s middags.',
      },
      {
        prompt: 'Waarvoor zoekt het buurthuis mensen?',
        options: [
          'Om de zondagmiddagen te draaien.',
          'Om computerles te geven.',
          'Om koffie te kopen.',
        ],
        correct: 0,
        explanation: '"Wij zoeken nog wel vrijwilligers om die middagen te draaien."',
      },
    ],
  },
  {
    title: 'Bij de fietsenmaker',
    section: 'gesprek',
    intro: intro('Bram brengt zijn fiets naar de fietsenmaker.'),
    image: { slot: 'lu-2-8', query: 'bicycle repair shop workshop' },
    voice_cast: { A: 'man_older', B: 'man_young' },
    lines: [
      ['A', 'Goedemorgen, wat is er met de fiets aan de hand?'],
      ['B', 'De remmen doen het niet goed en er zit een piep in het achterwiel.'],
      ['A', 'Even kijken. Ja, de remblokken zijn helemaal op. Die moeten vervangen worden.'],
      ['B', 'En dat piepen?'],
      ['A', 'Dat is de ketting; die is droog. Dat is zo gebeurd, daar reken ik niets voor.'],
      ['B', 'Fijn. Wat kost het dan bij elkaar?'],
      ['A', 'De remblokken en het werk samen: vierentwintig euro vijftig.'],
      ['B', 'Dat is goed. Kan ik hem vanmiddag ophalen?'],
      ['A', 'Kom maar na vier uur, dan staat hij klaar.'],
    ],
    questions: [
      {
        prompt: 'Wat moet er aan de fiets vervangen worden?',
        options: ['De remblokken.', 'De ketting.', 'Het achterwiel.'],
        correct: 0,
        explanation: '"De remblokken zijn helemaal op."',
      },
      {
        prompt: 'Wat kost het in totaal?',
        options: ['€ 24,50.', '€ 14,50.', '€ 44,50.'],
        correct: 0,
        explanation: 'Vierentwintig euro vijftig.',
      },
    ],
  },
  {
    title: 'Uitleg over de bibliotheekpas',
    section: 'instructie',
    intro: intro('Een medewerker legt uit hoe de bibliotheekpas werkt.'),
    image: { slot: 'lu-2-9', query: 'library counter books borrowing' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Ik leg u even uit hoe uw pas werkt. U mag tien boeken tegelijk lenen, en die houdt u drie ' +
          'weken. Verlengen kan twee keer via onze website of via de app, behalve bij nieuwe ' +
          'boeken; die zijn vaak gereserveerd door iemand anders. Inleveren kan in de bak bij de ' +
          'ingang, ook als wij gesloten zijn. Brengt u een boek te laat terug, dan kost dat twintig ' +
          'cent per boek per dag. U krijgt trouwens altijd een herinnering per e-mail, drie dagen ' +
          'voordat de termijn afloopt. Vergeet dus niet uw e-mailadres door te geven.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoeveel boeken mag u tegelijk lenen?',
        options: ['Tien.', 'Drie.', 'Twintig.'],
        correct: 0,
        explanation: '"U mag tien boeken tegelijk lenen."',
      },
      {
        prompt: 'Welke boeken kunt u niet verlengen?',
        options: ['Nieuwe boeken.', 'Boeken voor kinderen.', 'Boeken die u online leende.'],
        correct: 0,
        explanation: 'Verlengen kan twee keer, behalve bij nieuwe boeken.',
      },
    ],
  },
  {
    title: 'Bericht van de sportclub',
    section: 'mededeling',
    intro: intro('Op de website van de sportclub staat een gesproken bericht.'),
    image: { slot: 'lu-2-10', query: 'sports hall gym indoor court' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Beste leden, een korte mededeling over de komende weken. Vanwege de verbouwing van de ' +
          'kleedkamers is de grote zaal van maandag negen tot en met zondag vijftien juni gesloten. ' +
          'De trainingen van de jeugd gaan wel door, maar dan in de gymzaal van de school aan de ' +
          'Lindelaan, op dezelfde tijden. Voor de volwassenen vervallen de trainingen die week; ' +
          'daar krijgt u geen geld voor terug, maar wij organiseren in juli een extra ' +
          'trainingsweek. Kleedkamers zijn er in die week niet, dus kom alstublieft in ' +
          'sportkleding. Vragen kunt u stellen via het contactformulier op onze site.',
      ],
    ],
    questions: [
      {
        prompt: 'Waar trainen de jeugdleden die week?',
        options: [
          'In de gymzaal van de school aan de Lindelaan.',
          'In de grote zaal.',
          'Zij trainen niet.',
        ],
        correct: 0,
        explanation: 'De jeugdtrainingen verhuizen naar de gymzaal van de school.',
      },
      {
        prompt: 'Wat krijgen volwassen leden in plaats van de trainingen?',
        options: [
          'Een extra trainingsweek in juli.',
          'Hun geld terug.',
          'Een gratis maand.',
        ],
        correct: 0,
        explanation: 'Geen geld terug, wel een extra trainingsweek in juli.',
      },
      {
        prompt: 'Waarom moeten leden in sportkleding komen?',
        options: [
          'Er zijn geen kleedkamers.',
          'De zaal is koud.',
          'Er is geen tijd om om te kleden.',
        ],
        correct: 0,
        explanation: '"Kleedkamers zijn er in die week niet, dus kom alstublieft in sportkleding."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 3 ───────────────────────────── */

const EXAM_3 = [
  {
    title: 'Bij de kinderopvang',
    section: 'gesprek',
    intro: intro('Meneer Chen brengt zijn dochter naar de kinderopvang.'),
    image: { slot: 'lu-3-1', query: 'daycare nursery children playing' },
    voice_cast: { A: 'woman_young', B: 'man_young' },
    lines: [
      ['A', 'Goedemorgen! Dag Lin, kom maar binnen.'],
      ['B', 'Goedemorgen. Ik wilde iets doorgeven: Lin heeft vannacht slecht geslapen.'],
      ['A', 'O, wat vervelend. Is ze ziek geweest?'],
      ['B', 'Nee, geen koorts. Ze had denk ik een nare droom. Ze is nu wel wat huilerig.'],
      ['A', 'Dan houden we haar goed in de gaten. Zullen we haar vanmiddag wat langer laten slapen?'],
      ['B', 'Graag. Als het echt niet gaat, mag u mij altijd bellen op mijn werk.'],
      ['A', 'Dat doen we. Staat uw nummer nog goed in ons systeem?'],
      ['B', 'Ik heb een nieuw nummer sinds vorige week. Ik geef het straks even door bij de balie.'],
    ],
    questions: [
      {
        prompt: 'Wat vertelt meneer Chen over zijn dochter?',
        options: ['Zij heeft slecht geslapen.', 'Zij heeft koorts.', 'Zij wil niet eten.'],
        correct: 0,
        explanation: 'Hij zegt: "Lin heeft vannacht slecht geslapen."',
      },
      {
        prompt: 'Wat spreken zij af voor de middag?',
        options: [
          'Lin mag wat langer slapen.',
          'Lin wordt eerder opgehaald.',
          'Lin gaat naar de dokter.',
        ],
        correct: 0,
        explanation: '"Zullen we haar vanmiddag wat langer laten slapen?"',
      },
      {
        prompt: 'Wat moet meneer Chen nog doen?',
        options: [
          'Zijn nieuwe telefoonnummer doorgeven.',
          'Een formulier invullen.',
          'De opvang betalen.',
        ],
        correct: 0,
        explanation: 'Hij heeft sinds vorige week een nieuw nummer en geeft dat door bij de balie.',
      },
    ],
  },
  {
    title: 'Omroepbericht in het winkelcentrum',
    section: 'mededeling',
    intro: intro('Fatima hoort een bericht in het winkelcentrum.'),
    image: { slot: 'lu-3-2', query: 'shopping mall interior shops' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Dames en heren, mag ik uw aandacht voor de volgende mededeling. In verband met de ' +
          'jaarlijkse schoonmaak sluit ons winkelcentrum vanavond een uur eerder dan normaal, dus ' +
          'om acht uur in plaats van negen uur. De supermarkt op de begane grond blijft wel tot ' +
          'tien uur open; die heeft een eigen ingang aan de kant van het parkeerterrein. Wij vragen ' +
          'u om uw auto vóór half negen uit de garage te halen, want daarna gaan de slagbomen ' +
          'dicht. Morgen zijn wij weer gewoon open vanaf negen uur. Onze excuses voor het ongemak.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoe laat sluit het winkelcentrum vanavond?',
        options: ['Om acht uur.', 'Om negen uur.', 'Om tien uur.'],
        correct: 0,
        explanation: 'Een uur eerder dan normaal, dus om acht uur.',
      },
      {
        prompt: 'Welke winkel blijft langer open?',
        options: ['De supermarkt.', 'De apotheek.', 'De bakker.'],
        correct: 0,
        explanation: 'De supermarkt blijft tot tien uur open.',
      },
      {
        prompt: 'Hoe laat moet de auto uit de garage zijn?',
        options: ['Vóór half negen.', 'Vóór acht uur.', 'Vóór tien uur.'],
        correct: 0,
        explanation: '"Wij vragen u om uw auto vóór half negen uit de garage te halen."',
      },
    ],
  },
  {
    title: 'Telefoongesprek met de verzekering',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Novak belt haar zorgverzekering.'),
    image: { slot: 'lu-3-3', query: 'woman on phone at home documents' },
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Goedemiddag, u spreekt met de klantenservice. Waarmee kan ik u helpen?'],
      ['B', 'Ik heb een rekening van de fysiotherapeut gekregen en ik snap hem niet.'],
      ['A', 'Ik kijk even mee. Kunt u mij uw polisnummer geven?'],
      ['B', 'Zeker, dat is drie zeven twee, vier negen.'],
      ['A', 'Dank u. Ik zie het al: u heeft twaalf behandelingen gehad, en uw pakket vergoedt er negen.'],
      ['B', 'Dus die laatste drie betaal ik zelf?'],
      ['A', 'Dat klopt, ja. Dat is samen honderdvijf euro.'],
      ['B', 'Kan ik dat in termijnen betalen? Dat is nu wat veel in één keer.'],
      ['A', 'Dat kan zeker. Ik zet het voor u in drie maandelijkse termijnen. U krijgt een bevestiging per e-mail.'],
    ],
    questions: [
      {
        prompt: 'Hoeveel behandelingen vergoedt haar pakket?',
        options: ['Negen.', 'Twaalf.', 'Drie.'],
        correct: 0,
        explanation: 'Zij had twaalf behandelingen en het pakket vergoedt er negen.',
      },
      {
        prompt: 'Wat regelt de medewerker voor haar?',
        options: [
          'Betalen in drie termijnen.',
          'Een hogere vergoeding.',
          'Een nieuwe polis.',
        ],
        correct: 0,
        explanation: '"Ik zet het voor u in drie maandelijkse termijnen."',
      },
    ],
  },
  {
    title: 'Instructie in de fabriek',
    section: 'instructie',
    intro: intro('Nieuwe medewerkers krijgen uitleg over veiligheid.'),
    image: { slot: 'lu-3-4', query: 'factory workers safety helmets' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Voordat jullie de hal in gaan, nog even dit over de veiligheid. Een helm en een ' +
          'veiligheidsbril zijn verplicht, ook als je maar even iets komt halen. De gele lijnen op ' +
          'de vloer geven aan waar je mag lopen; blijf daarbinnen, want de heftrucks rijden ' +
          'daarbuiten. Hoor je een lang signaal, dan is dat brandalarm; loop dan rustig naar buiten ' +
          'via de dichtstbijzijnde deur en verzamel op het parkeerterrein bij de vlaggenmast. Ga ' +
          'nooit terug naar binnen om spullen te halen. Zie je iets wat onveilig is, meld het dan ' +
          'meteen bij je teamleider. Dat is nooit vervelend, dat is juist goed.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat is verplicht in de hal?',
        options: [
          'Een helm en een veiligheidsbril.',
          'Alleen veiligheidsschoenen.',
          'Een bedrijfsjas.',
        ],
        correct: 0,
        explanation: 'Beide zijn verplicht, ook bij kort verblijf.',
      },
      {
        prompt: 'Waar moet iedereen bij brandalarm verzamelen?',
        options: [
          'Op het parkeerterrein bij de vlaggenmast.',
          'Bij de kantine.',
          'Bij de hoofdingang.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk gezegd.',
      },
      {
        prompt: 'Wat mag u bij een alarm nooit doen?',
        options: [
          'Teruggaan naar binnen om spullen te halen.',
          'Rustig naar buiten lopen.',
          'De teamleider waarschuwen.',
        ],
        correct: 0,
        explanation: '"Ga nooit terug naar binnen om spullen te halen."',
      },
    ],
  },
  {
    title: 'Op de markt',
    section: 'gesprek',
    intro: intro('Joseph koopt groente op de markt.'),
    image: { slot: 'lu-3-5', query: 'market stall vegetables vendor' },
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Zegt u het maar!'],
      ['B', 'Ik wil graag een kilo tomaten en een krop sla.'],
      ['A', 'Alstublieft. De tomaten zijn vandaag in de aanbieding, twee kilo voor drie euro.'],
      ['B', 'O, doe dan maar twee kilo. En hoeveel kost de sla?'],
      ['A', 'Die is een euro tien. Samen is dat vier euro tien.'],
      ['B', 'Kan ik met de pas betalen?'],
      ['A', 'Onder de vijf euro liever niet, als het kan. Heeft u het contant?'],
      ['B', 'Ik kijk even… ja, ik heb precies vier euro tien. Alstublieft.'],
      ['A', 'Dank u wel. Tot ziens en een fijne dag!'],
    ],
    questions: [
      {
        prompt: 'Hoeveel tomaten koopt Joseph uiteindelijk?',
        options: ['Twee kilo.', 'Een kilo.', 'Een halve kilo.'],
        correct: 0,
        explanation: 'Door de aanbieding neemt hij twee kilo.',
      },
      {
        prompt: 'Hoe betaalt Joseph?',
        options: ['Contant.', 'Met de pas.', 'Met de telefoon.'],
        correct: 0,
        explanation: 'Onder vijf euro liever geen pas; hij heeft het precies contant.',
      },
    ],
  },
  {
    title: 'Voicemail van de tandarts',
    section: 'telefoongesprek',
    intro: intro('Meneer Osei luistert een bericht van de tandarts af.'),
    image: { slot: 'lu-3-6', query: 'dental clinic chair equipment' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemiddag meneer Osei, u spreekt met de assistente van tandartspraktijk De Molen. Ik ' +
          'bel over uw afspraak van aanstaande donderdag om kwart over negen. De tandarts is die ' +
          'ochtend helaas verhinderd, dus wij moeten uw afspraak verzetten. Ik heb twee ' +
          'mogelijkheden voor u: vrijdag diezelfde week om tien voor half twaalf, of anders dinsdag ' +
          'de week erna om vier uur ’s middags. Wilt u mij even laten weten welke van de twee u het ' +
          'beste uitkomt? U kunt ons bereiken tussen acht uur en half vijf. Als wij niets van u ' +
          'horen, zetten wij u voorlopig op de vrijdag. Alvast bedankt.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom belt de assistente?',
        options: [
          'De afspraak moet verzet worden.',
          'De rekening is niet betaald.',
          'Er is een controle nodig.',
        ],
        correct: 0,
        explanation: 'De tandarts is verhinderd op donderdagochtend.',
      },
      {
        prompt: 'Wat gebeurt er als meneer Osei niet reageert?',
        options: [
          'Hij wordt voorlopig op de vrijdag gezet.',
          'De afspraak vervalt helemaal.',
          'Hij krijgt een rekening.',
        ],
        correct: 0,
        explanation: '"Als wij niets van u horen, zetten wij u voorlopig op de vrijdag."',
      },
    ],
  },
  {
    title: 'Mededeling in de bus',
    section: 'mededeling',
    intro: intro('In de bus hoort Nadia een mededeling van de chauffeur.'),
    image: { slot: 'lu-3-7', query: 'city bus interior passengers' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Beste reizigers, goedemiddag. Wegens een evenement in het centrum rijdt deze bus vandaag ' +
          'een aangepaste route. Wij rijden niet via de Grote Markt en de halte Stadhuis wordt niet ' +
          'bediend. In plaats daarvan stoppen wij bij de halte Museumplein, dat is ongeveer vijf ' +
          'minuten lopen van het stadhuis. Reizigers die naar het ziekenhuis moeten, kunnen bij ' +
          'halte Museumplein overstappen op lijn veertien. Wij verwachten ongeveer tien minuten ' +
          'later aan te komen op het eindpunt. Vergeet u niet in en uit te checken. Dank u wel voor ' +
          'uw begrip.',
      ],
    ],
    questions: [
      {
        prompt: 'Welke halte wordt vandaag niet bediend?',
        options: ['Halte Stadhuis.', 'Halte Museumplein.', 'Het eindpunt.'],
        correct: 0,
        explanation: '"de halte Stadhuis wordt niet bediend."',
      },
      {
        prompt: 'Wat moeten reizigers naar het ziekenhuis doen?',
        options: [
          'Bij Museumplein overstappen op lijn veertien.',
          'Uitstappen bij de Grote Markt.',
          'In de bus blijven zitten.',
        ],
        correct: 0,
        explanation: 'Dat advies wordt letterlijk gegeven.',
      },
      {
        prompt: 'Hoeveel later komt de bus aan?',
        options: ['Ongeveer tien minuten.', 'Ongeveer vijf minuten.', 'Ongeveer een half uur.'],
        correct: 0,
        explanation: '"Wij verwachten ongeveer tien minuten later aan te komen."',
      },
    ],
  },
  {
    title: 'Bij de woningcorporatie',
    section: 'gesprek',
    intro: intro('Mevrouw Adebayo praat met een medewerker van de woningcorporatie.'),
    image: { slot: 'lu-3-8', query: 'housing office desk meeting' },
    voice_cast: { A: 'man_older', B: 'woman_young' },
    lines: [
      ['A', 'Goedemiddag, gaat u zitten. Waar kan ik u mee helpen?'],
      ['B', 'Er zit al twee weken schimmel in mijn badkamer en het wordt steeds erger.'],
      ['A', 'Dat moeten we snel oplossen. Heeft u het al eerder gemeld?'],
      ['B', 'Ja, twee keer via de website, maar ik heb nooit antwoord gekregen.'],
      ['A', 'Dat spijt me. Ik maak nu direct een melding met spoed aan.'],
      ['B', 'Wanneer komt er dan iemand?'],
      ['A', 'Binnen vijf werkdagen. U krijgt morgen een sms met de dag en het tijdvak.'],
      ['B', 'Ik werk overdag. Kan het ook na vijven?'],
      ['A', 'Dat kan ik niet beloven, maar ik zet het erbij als wens. Bel anders het nummer in de sms.'],
    ],
    questions: [
      {
        prompt: 'Wat is het probleem in de woning?',
        options: ['Schimmel in de badkamer.', 'Een lekkende kraan.', 'De verwarming doet het niet.'],
        correct: 0,
        explanation: 'Zij zegt: "Er zit al twee weken schimmel in mijn badkamer."',
      },
      {
        prompt: 'Hoe krijgt zij te horen wanneer iemand komt?',
        options: ['Per sms.', 'Per brief.', 'Via de website.'],
        correct: 0,
        explanation: '"U krijgt morgen een sms met de dag en het tijdvak."',
      },
    ],
  },
  {
    title: 'Uitleg over het parkeren',
    section: 'instructie',
    intro: intro('Een medewerker legt uit hoe het parkeren in de wijk werkt.'),
    image: { slot: 'lu-3-9', query: 'parking meter street city' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Ik leg u even uit hoe het parkeren hier geregeld is. In onze wijk moet u betalen van ' +
          'negen uur ’s ochtends tot acht uur ’s avonds, van maandag tot en met zaterdag. Op zondag ' +
          'is parkeren gratis. Met een bewonersvergunning betaalt u niet, maar die geldt alleen in ' +
          'uw eigen gebied; dat staat op de vergunning. Krijgt u bezoek, dan kunt u een bezoekerspas ' +
          'aanvragen; daarmee betaalt uw bezoek een lager tarief. U regelt dat via de app of via ' +
          'de website van de gemeente. Vergeet niet uw kenteken in te voeren, want de controle gaat ' +
          'tegenwoordig met een scanauto.',
      ],
    ],
    questions: [
      {
        prompt: 'Op welke dag hoeft u niet te betalen?',
        options: ['Op zondag.', 'Op zaterdag.', 'Op maandag.'],
        correct: 0,
        explanation: '"Op zondag is parkeren gratis."',
      },
      {
        prompt: 'Wat moet u niet vergeten?',
        options: [
          'Uw kenteken invoeren.',
          'De vergunning achter het raam leggen.',
          'Contant te betalen.',
        ],
        correct: 0,
        explanation: 'De controle gaat met een scanauto, dus het kenteken moet ingevoerd zijn.',
      },
    ],
  },
  {
    title: 'Bericht van het consultatiebureau',
    section: 'mededeling',
    intro: intro('Ouders horen een bericht in de wachtkamer van het consultatiebureau.'),
    image: { slot: 'lu-3-10', query: 'clinic waiting room parents children' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemorgen allemaal. Een korte mededeling voor iedereen die vanochtend wacht. Door ' +
          'ziekte van een collega lopen wij ongeveer een half uur uit op het schema. Dat spijt ons ' +
          'zeer. Heeft u haast, dan kunt u bij de balie een nieuwe afspraak maken voor volgende ' +
          'week; er is dan ruimte op dinsdag en op vrijdag. Voor de kinderen staat er koffie en ' +
          'ranja klaar in de hoek, en er ligt speelgoed in de blauwe kist. Wilt u het speelgoed na ' +
          'gebruik terugleggen? Dank u wel voor uw geduld en voor uw begrip.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom moeten de ouders langer wachten?',
        options: ['Een collega is ziek.', 'Er zijn te veel afspraken.', 'De computer is stuk.'],
        correct: 0,
        explanation: '"Door ziekte van een collega lopen wij ongeveer een half uur uit."',
      },
      {
        prompt: 'Op welke dagen is er volgende week ruimte?',
        options: ['Dinsdag en vrijdag.', 'Maandag en woensdag.', 'Alleen vrijdag.'],
        correct: 0,
        explanation: '"er is dan ruimte op dinsdag en op vrijdag."',
      },
      {
        prompt: 'Wat wordt er gevraagd over het speelgoed?',
        options: [
          'Het na gebruik terugleggen.',
          'Het niet te gebruiken.',
          'Het mee naar huis te nemen.',
        ],
        correct: 0,
        explanation: '"Wilt u het speelgoed na gebruik terugleggen?"',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 4 ───────────────────────────── */

const EXAM_4 = [
  {
    title: 'Sollicitatiegesprek',
    section: 'gesprek',
    intro: intro('Grace heeft een gesprek voor een baan in een hotel.'),
    image: { slot: 'lu-4-1', query: 'job interview office two people' },
    voice_cast: { A: 'man_older', B: 'woman_young' },
    lines: [
      ['A', 'Fijn dat u er bent. Vertelt u eens: wat voor werk doet u nu?'],
      ['B', 'Ik werk nu drie dagen per week in de schoonmaak, in een kantoorgebouw.'],
      ['A', 'En waarom wilt u bij ons in het hotel komen werken?'],
      ['B', 'Ik werk graag met mensen. In het kantoor zie ik ’s ochtends bijna niemand.'],
      ['A', 'Dat begrijp ik. Wij zoeken iemand voor de ochtenden, van zeven tot twaalf.'],
      ['B', 'Dat past goed. Mijn zoon gaat om half negen naar school, maar mijn buurvrouw brengt hem.'],
      ['A', 'Prima. Wij werken ook in het weekend. Is dat een probleem?'],
      ['B', 'Eén weekenddag per week kan ik zeker. Twee wordt lastig.'],
      ['A', 'Dat is bespreekbaar. U hoort volgende week van ons.'],
    ],
    questions: [
      {
        prompt: 'Waarom wil Grace in het hotel werken?',
        options: [
          'Zij werkt graag met mensen.',
          'Het betaalt beter.',
          'Het is dichter bij huis.',
        ],
        correct: 0,
        explanation: '"Ik werk graag met mensen."',
      },
      {
        prompt: 'Hoe laat begint het werk in het hotel?',
        options: ['Om zeven uur.', 'Om half negen.', 'Om twaalf uur.'],
        correct: 0,
        explanation: 'De ochtenddienst is van zeven tot twaalf.',
      },
      {
        prompt: 'Wat zegt Grace over het weekend?',
        options: [
          'Eén dag per week kan zeker.',
          'Zij kan nooit in het weekend.',
          'Zij kan elk weekend twee dagen.',
        ],
        correct: 0,
        explanation: '"Eén weekenddag per week kan ik zeker. Twee wordt lastig."',
      },
    ],
  },
  {
    title: 'Mededeling in het zwembad',
    section: 'mededeling',
    intro: intro('In het zwembad hoort Karim een mededeling.'),
    image: { slot: 'lu-4-2', query: 'indoor swimming pool lifeguard' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Beste bezoekers, mag ik even uw aandacht? Over een kwartier, dus om kwart voor drie, ' +
          'beginnen wij met de zwemlessen in het grote bad. Wij vragen iedereen die vrij zwemt om ' +
          'dan naar het kleine bad te gaan; daar kunt u gewoon blijven zwemmen tot vijf uur. De ' +
          'glijbaan is de hele middag open, ook tijdens de lessen. Verder willen wij u vragen om ' +
          'uw waardevolle spullen in een kluisje te doen; wij zijn niet aansprakelijk voor ' +
          'diefstal. Kluisjes werken op een muntje van vijftig cent, die u aan het eind ' +
          'terugkrijgt. Dank u wel.',
      ],
    ],
    questions: [
      {
        prompt: 'Waar moeten mensen die vrij zwemmen straks naartoe?',
        options: ['Naar het kleine bad.', 'Naar de glijbaan.', 'Naar buiten.'],
        correct: 0,
        explanation: '"Wij vragen iedereen die vrij zwemt om dan naar het kleine bad te gaan."',
      },
      {
        prompt: 'Is de glijbaan open tijdens de lessen?',
        options: ['Ja, de hele middag.', 'Nee, die is dan dicht.', 'Alleen voor kinderen.'],
        correct: 0,
        explanation: '"De glijbaan is de hele middag open, ook tijdens de lessen."',
      },
      {
        prompt: 'Wat gebeurt er met het muntje voor het kluisje?',
        options: ['Dat krijgt u terug.', 'Dat is de prijs van het kluisje.', 'Dat kost een euro.'],
        correct: 0,
        explanation: '"een muntje van vijftig cent, die u aan het eind terugkrijgt."',
      },
    ],
  },
  {
    title: 'Telefoongesprek met de energieleverancier',
    section: 'telefoongesprek',
    intro: intro('Meneer Petrov belt over zijn energierekening.'),
    image: { slot: 'lu-4-3', query: 'man phone call bills kitchen table' },
    voice_cast: { A: 'woman_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemorgen, klantenservice, waarmee kan ik u helpen?'],
      ['B', 'Ik heb een jaarrekening gekregen van bijna achthonderd euro. Dat kan niet kloppen.'],
      ['A', 'Ik kijk even mee. Heeft u de meterstanden dit jaar doorgegeven?'],
      ['B', 'Nee, dat wist ik niet. Moet dat elk jaar?'],
      ['A', 'Ja, één keer per jaar. Anders schatten wij het verbruik, en die schatting was te hoog.'],
      ['B', 'Kan ik ze nu nog doorgeven?'],
      ['A', 'Dat kan. Als u ze mij nu geeft, maak ik meteen een nieuwe berekening.'],
      ['B', 'Ik loop even naar de meterkast. Een momentje alstublieft.'],
    ],
    questions: [
      {
        prompt: 'Waarom is de rekening zo hoog?',
        options: [
          'Het verbruik is te hoog geschat.',
          'De prijzen zijn gestegen.',
          'Hij heeft een jaar niet betaald.',
        ],
        correct: 0,
        explanation: 'Zonder doorgegeven meterstanden schat de leverancier, en die schatting was te hoog.',
      },
      {
        prompt: 'Hoe vaak moet hij de meterstanden doorgeven?',
        options: ['Eén keer per jaar.', 'Elke maand.', 'Nooit.'],
        correct: 0,
        explanation: '"Ja, één keer per jaar."',
      },
    ],
  },
  {
    title: 'Uitleg over de vaatwasser',
    section: 'instructie',
    intro: intro('Op haar nieuwe werk krijgt Amira uitleg in de keuken.'),
    image: { slot: 'lu-4-4', query: 'commercial kitchen dishwasher restaurant' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Even over de vaatwasser, want die werkt anders dan thuis. Spoel de borden eerst af onder ' +
          'de kraan; grote resten moeten eraf, anders raakt het filter verstopt. Zet de borden ' +
          'rechtop in het rek en leg glazen altijd in het bovenste rek, nooit onderin. Het programma ' +
          'duurt maar twee minuten, dus je kunt snel door. Aan het eind van de dag haal je het ' +
          'filter eruit en maak je het schoon onder de kraan; dat staat ook op de kaart aan de muur. ' +
          'Zet de machine daarna uit met de rode knop, niet met de stekker. Lukt iets niet, roep ' +
          'dan even Marco.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet Amira eerst doen met de borden?',
        options: [
          'Ze afspoelen onder de kraan.',
          'Ze in het bovenste rek zetten.',
          'Ze laten weken.',
        ],
        correct: 0,
        explanation: '"Spoel de borden eerst af onder de kraan."',
      },
      {
        prompt: 'Waar horen glazen?',
        options: ['In het bovenste rek.', 'In het onderste rek.', 'Naast de machine.'],
        correct: 0,
        explanation: '"leg glazen altijd in het bovenste rek, nooit onderin."',
      },
      {
        prompt: 'Hoe zet zij de machine aan het eind uit?',
        options: ['Met de rode knop.', 'Met de stekker.', 'Dat doet Marco.'],
        correct: 0,
        explanation: '"Zet de machine daarna uit met de rode knop, niet met de stekker."',
      },
    ],
  },
  {
    title: 'Bij de balie van de sporthal',
    section: 'gesprek',
    intro: intro('Tomasz wil een zaal huren voor zijn voetbalgroep.'),
    image: { slot: 'lu-4-5', query: 'sports hall reception desk' },
    voice_cast: { A: 'woman_young', B: 'man_young' },
    lines: [
      ['A', 'Goedemiddag, zegt u het maar.'],
      ['B', 'Wij zijn met een groepje van twaalf en wij willen elke week zaalvoetballen.'],
      ['A', 'Wat leuk. Op welke avond zou dat moeten zijn?'],
      ['B', 'Het liefst dinsdag, ergens na acht uur.'],
      ['A', 'Dinsdag na acht is helaas al bezet tot juni. Woensdag heb ik nog wel plek om half negen.'],
      ['B', 'Woensdag kan ook. Wat kost een uur?'],
      ['A', 'Zesenveertig euro per uur, inclusief kleedkamers. Betalen doet u per maand.'],
      ['B', 'Prima. Wat moet ik doen om het vast te leggen?'],
      ['A', 'Ik heb de naam van de groep nodig en een e-mailadres. De rest stuur ik u toe.'],
    ],
    questions: [
      {
        prompt: 'Op welke avond kan de groep terecht?',
        options: ['Op woensdag.', 'Op dinsdag.', 'Op donderdag.'],
        correct: 0,
        explanation: 'Dinsdag is bezet; woensdag om half negen is nog vrij.',
      },
      {
        prompt: 'Wat kost een uur?',
        options: ['€ 46.', '€ 26.', '€ 66.'],
        correct: 0,
        explanation: 'Zesenveertig euro per uur.',
      },
    ],
  },
  {
    title: 'Bericht van de bibliotheek',
    section: 'mededeling',
    intro: intro('In de bibliotheek klinkt een mededeling.'),
    image: { slot: 'lu-4-6', query: 'library reading area shelves' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Beste bezoekers, goedemiddag. Wij sluiten vandaag om vijf uur in plaats van om acht uur, ' +
          'omdat wij vanavond een schrijversavond organiseren in de grote zaal. Die avond begint om ' +
          'half acht en is gratis toegankelijk, maar u moet zich wel van tevoren aanmelden bij de ' +
          'balie of via onze website; er zijn nog ongeveer twintig plaatsen vrij. Wilt u vandaag nog ' +
          'boeken lenen, doe dat dan vóór kwart voor vijf, want de automaten gaan dan uit. ' +
          'Inleveren kan wel altijd, in de bak naast de hoofdingang. Dank u wel en tot vanavond.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoe laat sluit de bibliotheek vandaag?',
        options: ['Om vijf uur.', 'Om acht uur.', 'Om half acht.'],
        correct: 0,
        explanation: 'Vandaag om vijf uur in plaats van acht uur.',
      },
      {
        prompt: 'Wat moet u doen om naar de schrijversavond te komen?',
        options: [
          'U van tevoren aanmelden.',
          'Een kaartje kopen.',
          'Niets, u loopt gewoon binnen.',
        ],
        correct: 0,
        explanation: 'Gratis, maar aanmelden is verplicht.',
      },
      {
        prompt: 'Tot hoe laat kunt u vandaag boeken lenen?',
        options: ['Tot kwart voor vijf.', 'Tot vijf uur.', 'Tot half acht.'],
        correct: 0,
        explanation: '"doe dat dan vóór kwart voor vijf, want de automaten gaan dan uit."',
      },
    ],
  },
  {
    title: 'Voicemail van een vriendin',
    section: 'telefoongesprek',
    intro: intro('Lucia luistert een bericht van haar vriendin af.'),
    image: { slot: 'lu-4-7', query: 'woman checking phone voicemail' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Hoi Lucia, met Marjan. Ik bel even over zaterdag. Wij hadden afgesproken om om twaalf uur ' +
          'in het park af te spreken, maar het gaat de hele dag regenen, zeggen ze. Ik dacht: ' +
          'zullen we in plaats daarvan naar dat nieuwe café bij het station gaan? Ze hebben daar ' +
          'goede koffie en het is binnen droog. Ik kan trouwens pas om half een, want ik moet ' +
          '’s ochtends nog even naar mijn moeder. Laat je me even weten of dat lukt? Bellen of ' +
          'appen mag allebei. En als je liever toch het park wilt, ook prima hoor, dan neem ik ' +
          'gewoon een paraplu mee. Tot zaterdag!',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom belt Marjan?',
        options: [
          'Zij wil de afspraak veranderen vanwege de regen.',
          'Zij kan zaterdag niet.',
          'Zij is haar telefoon kwijt.',
        ],
        correct: 0,
        explanation: 'Zij stelt het café voor omdat het gaat regenen.',
      },
      {
        prompt: 'Hoe laat kan Marjan op zijn vroegst?',
        options: ['Om half een.', 'Om twaalf uur.', 'Om één uur.'],
        correct: 0,
        explanation: '"Ik kan trouwens pas om half een."',
      },
    ],
  },
  {
    title: 'Bij de opticien',
    section: 'gesprek',
    intro: intro('Mevrouw Bakker haalt haar nieuwe bril op.'),
    image: { slot: 'lu-4-8', query: 'optician shop glasses display' },
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Goedemiddag mevrouw Bakker, uw bril is klaar. Wilt u hem even passen?'],
      ['B', 'Graag. O, hij zit wel wat strak achter mijn oren.'],
      ['A', 'Dat kan ik zo bijstellen. Ziet u verder goed door de glazen?'],
      ['B', 'Ver weg gaat prima, maar lezen is nog een beetje wennen.'],
      ['A', 'Dat is normaal bij een nieuwe sterkte. Geef het een week of twee.'],
      ['B', 'En als het dan nog niet went?'],
      ['A', 'Dan komt u gewoon terug. Binnen drie maanden passen wij de glazen gratis aan.'],
      ['B', 'Fijn. Krijg ik ook een doosje en een doekje mee?'],
      ['A', 'Zeker, die zitten erbij. Ik stel de bril even bij, dat duurt twee minuten.'],
    ],
    questions: [
      {
        prompt: 'Wat is er mis met de bril?',
        options: [
          'Hij zit strak achter de oren.',
          'De glazen zijn kapot.',
          'De kleur klopt niet.',
        ],
        correct: 0,
        explanation: 'Zij zegt: "hij zit wel wat strak achter mijn oren."',
      },
      {
        prompt: 'Wat gebeurt er als het lezen na twee weken nog niet went?',
        options: [
          'Zij komt terug en de glazen worden gratis aangepast.',
          'Zij krijgt haar geld terug.',
          'Zij moet een nieuwe bril kopen.',
        ],
        correct: 0,
        explanation: '"Binnen drie maanden passen wij de glazen gratis aan."',
      },
    ],
  },
  {
    title: 'Instructie voor de nieuwe wasmachine',
    section: 'instructie',
    intro: intro('Een monteur legt uit hoe de nieuwe wasmachine werkt.'),
    image: { slot: 'lu-4-9', query: 'washing machine laundry room home' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Ik leg u kort uit hoe de machine werkt, dan kunt u zo beginnen. Het bakje voor het ' +
          'wasmiddel zit linksboven; het rechtervakje is voor de wasverzachter, dus doe daar geen ' +
          'poeder in. Voor gewone was op dertig graden draait u de knop naar het tweede standje; ' +
          'dat duurt ongeveer een uur en tien minuten. Doe de trommel nooit helemaal vol, want dan ' +
          'wordt de was niet schoon; een hand ruimte bovenin is genoeg. Laat na het wassen het ' +
          'deurtje op een kier staan, anders gaat de machine ruiken. En maak het filter onderin ' +
          'ongeveer één keer per maand schoon.',
      ],
    ],
    questions: [
      {
        prompt: 'Waar hoort de wasverzachter?',
        options: ['In het rechtervakje.', 'In het linkervakje.', 'In de trommel.'],
        correct: 0,
        explanation: '"het rechtervakje is voor de wasverzachter."',
      },
      {
        prompt: 'Hoe vaak moet het filter schoongemaakt worden?',
        options: ['Ongeveer één keer per maand.', 'Elke week.', 'Eén keer per jaar.'],
        correct: 0,
        explanation: '"maak het filter onderin ongeveer één keer per maand schoon."',
      },
    ],
  },
  {
    title: 'Mededeling op het werk',
    section: 'mededeling',
    intro: intro('Op het werk hoort Ana een mededeling van de leidinggevende.'),
    image: { slot: 'lu-4-10', query: 'team meeting workplace staff' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Goedemorgen allemaal, even iets belangrijks voor deze week. Vanaf woensdag werken wij met ' +
          'een nieuw systeem om de uren te registreren. Jullie krijgen vanmiddag allemaal een ' +
          'e-mail met een link en een tijdelijk wachtwoord; dat wachtwoord moeten jullie meteen ' +
          'veranderen. Vanaf woensdag schrijven jullie dus niets meer op de papieren lijst bij de ' +
          'deur. Lukt het inloggen niet, kom dan even naar mij toe; ik zit de hele week op kantoor. ' +
          'Woensdagochtend om acht uur geef ik nog een korte uitleg in de kantine, ongeveer twintig ' +
          'minuten. Iedereen die kan, is welkom.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat verandert er vanaf woensdag?',
        options: [
          'De uren worden in een nieuw systeem geregistreerd.',
          'De werktijden veranderen.',
          'Er komt een nieuwe leidinggevende.',
        ],
        correct: 0,
        explanation: 'Dat is de kern van de mededeling.',
      },
      {
        prompt: 'Wat moeten de medewerkers met het tijdelijke wachtwoord doen?',
        options: [
          'Het meteen veranderen.',
          'Het opschrijven bij de deur.',
          'Het aan de leidinggevende geven.',
        ],
        correct: 0,
        explanation: '"dat wachtwoord moeten jullie meteen veranderen."',
      },
      {
        prompt: 'Hoe laat is de uitleg in de kantine?',
        options: ['Woensdag om acht uur.', 'Woensdag om twaalf uur.', 'Vanmiddag.'],
        correct: 0,
        explanation: '"Woensdagochtend om acht uur geef ik nog een korte uitleg in de kantine."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 5 ───────────────────────────── */

const EXAM_5 = [
  {
    title: 'Bij de bank',
    section: 'gesprek',
    intro: intro('Mevrouw Ivanova opent een rekening bij de bank.'),
    image: { slot: 'lu-5-1', query: 'bank advisor customer desk' },
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Goedemiddag, gaat u zitten. U wilt een rekening openen, begreep ik?'],
      ['B', 'Klopt. Ik begin volgende maand met werken en ik heb er een nodig.'],
      ['A', 'Dat regelen we. Heeft u uw paspoort en uw BSN bij u?'],
      ['B', 'Ja, allebei. Alstublieft.'],
      ['A', 'Dank u. De rekening kost twee euro vijfentwintig per maand, inclusief een bankpas.'],
      ['B', 'En internetbankieren, kost dat extra?'],
      ['A', 'Nee, dat zit erbij. Ook de app is gratis.'],
      ['B', 'Fijn. Wanneer krijg ik mijn pas?'],
      ['A', 'Binnen vijf werkdagen per post, en de pincode komt in een aparte envelop.'],
    ],
    questions: [
      {
        prompt: 'Wat kost de rekening per maand?',
        options: ['€ 2,25.', '€ 5,00.', 'Niets.'],
        correct: 0,
        explanation: 'Twee euro vijfentwintig per maand, inclusief een bankpas.',
      },
      {
        prompt: 'Wat kost internetbankieren extra?',
        options: ['Niets, dat zit erbij.', 'Twee euro.', 'Dat kan zij niet krijgen.'],
        correct: 0,
        explanation: '"Nee, dat zit erbij. Ook de app is gratis."',
      },
      {
        prompt: 'Hoe krijgt zij haar pincode?',
        options: [
          'In een aparte envelop per post.',
          'Samen met de pas.',
          'Per e-mail.',
        ],
        correct: 0,
        explanation: '"de pincode komt in een aparte envelop."',
      },
    ],
  },
  {
    title: 'Omroepbericht op school',
    section: 'mededeling',
    intro: intro('Op school hoort Yusuf een bericht door de intercom.'),
    image: { slot: 'lu-5-2', query: 'school hallway lockers students' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemiddag allemaal, een mededeling voor alle leerlingen. De les van het zesde uur, ' +
          'wiskunde bij meneer Van Dam, komt vandaag te vervallen; hij is naar huis gegaan omdat hij ' +
          'zich niet lekker voelt. Dat betekent dat de meeste klassen om kwart over twee vrij zijn ' +
          'in plaats van om kwart over drie. Leerlingen van klas 3B blijven wel: jullie hebben in ' +
          'dat uur een toets Engels in lokaal 24, en die gaat gewoon door. Wie met de bus gaat, kan ' +
          'die van twintig over twee halen. Vergeet niet je spullen uit je kluisje te halen. Fijne ' +
          'middag verder.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom vervalt de wiskundeles?',
        options: [
          'De docent voelt zich niet lekker.',
          'Er is een toets.',
          'Het lokaal is bezet.',
        ],
        correct: 0,
        explanation: '"hij is naar huis gegaan omdat hij zich niet lekker voelt."',
      },
      {
        prompt: 'Wat gebeurt er met klas 3B?',
        options: [
          'Zij maken een toets Engels.',
          'Zij zijn ook vrij.',
          'Zij krijgen een andere les.',
        ],
        correct: 0,
        explanation: '"jullie hebben in dat uur een toets Engels in lokaal 24."',
      },
      {
        prompt: 'Hoe laat zijn de meeste klassen vrij?',
        options: ['Om kwart over twee.', 'Om kwart over drie.', 'Om twintig over twee.'],
        correct: 0,
        explanation: 'Kwart over twee in plaats van kwart over drie.',
      },
    ],
  },
  {
    title: 'Telefoontje van de garage',
    section: 'telefoongesprek',
    intro: intro('Meneer Yildiz wordt gebeld door de garage.'),
    image: { slot: 'lu-5-3', query: 'auto repair garage mechanic car' },
    voice_cast: { A: 'woman_older', B: 'man_older' },
    lines: [
      ['A', 'Goedemiddag meneer Yildiz, u spreekt met garage Van Leeuwen.'],
      ['B', 'Goedemiddag. Is mijn auto al klaar?'],
      ['A', 'Bijna. Wij hebben hem nagekeken en er is meer werk dan gedacht.'],
      ['B', 'O. Wat is er dan aan de hand?'],
      ['A', 'Behalve de olie moeten ook twee banden vervangen worden; het profiel is te ver op.'],
      ['B', 'Wat kost dat er dan extra bij?'],
      ['A', 'Honderdveertig euro voor de twee banden, inclusief monteren.'],
      ['B', 'Doe maar. Ik wil geen risico met de kinderen in de auto.'],
      ['A', 'Verstandig. Dan is hij morgen aan het eind van de ochtend klaar.'],
    ],
    questions: [
      {
        prompt: 'Wat moet er extra gebeuren aan de auto?',
        options: [
          'Twee banden vervangen.',
          'De remmen vervangen.',
          'Alleen de olie verversen.',
        ],
        correct: 0,
        explanation: 'Behalve de olie moeten ook twee banden vervangen worden.',
      },
      {
        prompt: 'Wanneer is de auto klaar?',
        options: [
          'Morgen aan het eind van de ochtend.',
          'Vandaag aan het eind van de middag.',
          'Over twee dagen.',
        ],
        correct: 0,
        explanation: 'Dat zegt de medewerker aan het eind.',
      },
    ],
  },
  {
    title: 'Uitleg bij de zelfscankassa',
    section: 'instructie',
    intro: intro('Een medewerker legt uit hoe de zelfscankassa werkt.'),
    image: { slot: 'lu-5-4', query: 'self checkout supermarket scanner' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Ik laat u even zien hoe dit werkt, het is echt heel eenvoudig. U pakt bij de ingang een ' +
          'scanner uit het rek en u houdt uw klantenkaart voor het schermpje; dan is de scanner van ' +
          'u. Elk product scant u voordat u het in uw tas doet; hoort u geen piep, dan is het niet ' +
          'gelukt. Groente en fruit weegt u zelf bij de weegschaal en u plakt het bonnetje op het ' +
          'zakje. Aan het eind scant u de streepjescode bij de kassa en dan betaalt u. Soms vragen ' +
          'wij om een controle; dat gebeurt willekeurig en duurt maar even.',
      ],
    ],
    questions: [
      {
        prompt: 'Wanneer moet u een product scannen?',
        options: [
          'Voordat u het in uw tas doet.',
          'Nadat u het in uw tas heeft gedaan.',
          'Aan het eind, bij de kassa.',
        ],
        correct: 0,
        explanation: '"Elk product scant u voordat u het in uw tas doet."',
      },
      {
        prompt: 'Wat doet u met groente en fruit?',
        options: [
          'Zelf wegen en het bonnetje erop plakken.',
          'Bij de kassa laten wegen.',
          'Gewoon scannen.',
        ],
        correct: 0,
        explanation: '"Groente en fruit weegt u zelf bij de weegschaal."',
      },
      {
        prompt: 'Wanneer krijgt u een controle?',
        options: ['Dat gebeurt willekeurig.', 'Altijd.', 'Alleen bij grote boodschappen.'],
        correct: 0,
        explanation: '"dat gebeurt willekeurig en duurt maar even."',
      },
    ],
  },
  {
    title: 'Op het schoolplein',
    section: 'gesprek',
    intro: intro('Twee ouders praten met elkaar op het schoolplein.'),
    image: { slot: 'lu-5-5', query: 'parents chatting school playground' },
    voice_cast: { A: 'woman_young', B: 'woman_older' },
    lines: [
      ['A', 'Hoi Trees, ga jij volgende week ook mee met het schoolreisje?'],
      ['B', 'Ik zou wel willen, maar ik moet die dag werken. Jij wel?'],
      ['A', 'Ja, ik heb me opgegeven. Ze zochten nog twee ouders.'],
      ['B', 'Waar gaan ze eigenlijk naartoe?'],
      ['A', 'Naar het natuurmuseum, en daarna nog een uurtje naar de speeltuin ernaast.'],
      ['B', 'Leuk. Moet je dan de hele dag mee?'],
      ['A', 'Van half negen tot een uur of vier, ja. Ze rijden met de bus.'],
      ['B', 'Zeg, kun jij mijn Sanne dan ook een beetje in de gaten houden?'],
      ['A', 'Natuurlijk. Ik zit toch in een groepje met vijf kinderen.'],
    ],
    questions: [
      {
        prompt: 'Waarom gaat Trees niet mee?',
        options: ['Zij moet werken.', 'Zij is ziek.', 'Zij heeft geen zin.'],
        correct: 0,
        explanation: '"Ik zou wel willen, maar ik moet die dag werken."',
      },
      {
        prompt: 'Waar gaan de kinderen naartoe?',
        options: [
          'Naar het natuurmuseum en de speeltuin.',
          'Naar het strand.',
          'Naar de dierentuin.',
        ],
        correct: 0,
        explanation: 'Het museum en daarna een uurtje de speeltuin ernaast.',
      },
    ],
  },
  {
    title: 'Bericht van de gemeente',
    section: 'mededeling',
    intro: intro('Op de website van de gemeente staat een gesproken bericht.'),
    image: { slot: 'lu-5-6', query: 'town hall building exterior' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Beste inwoners, een mededeling over onze dienstverlening in de komende weken. Vanwege een ' +
          'verhuizing is het stadskantoor van maandag zes tot en met vrijdag tien mei gesloten. ' +
          'Afspraken die in die week gepland stonden, worden automatisch verzet; u krijgt daarover ' +
          'persoonlijk bericht per e-mail of per brief. U hoeft dus zelf niets te doen. Voor ' +
          'spoedgevallen, bijvoorbeeld een aangifte van geboorte of overlijden, blijven wij ' +
          'telefonisch bereikbaar via veertien nul tien, elke werkdag tussen negen en twaalf uur. ' +
          'Vanaf maandag dertien mei zijn wij weer gewoon open op onze nieuwe locatie.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom is het stadskantoor gesloten?',
        options: ['Vanwege een verhuizing.', 'Vanwege een verbouwing.', 'Vanwege vakantie.'],
        correct: 0,
        explanation: '"Vanwege een verhuizing is het stadskantoor gesloten."',
      },
      {
        prompt: 'Wat moet u doen als u een afspraak had in die week?',
        options: [
          'Niets, de afspraak wordt automatisch verzet.',
          'Zelf een nieuwe afspraak maken.',
          'Naar de nieuwe locatie gaan.',
        ],
        correct: 0,
        explanation: '"U hoeft dus zelf niets te doen."',
      },
      {
        prompt: 'Wanneer is de gemeente telefonisch bereikbaar?',
        options: [
          'Op werkdagen tussen negen en twaalf uur.',
          'De hele dag.',
          'Alleen in noodgevallen ’s avonds.',
        ],
        correct: 0,
        explanation: 'Elke werkdag tussen negen en twaalf uur.',
      },
    ],
  },
  {
    title: 'Bij de dokter',
    section: 'gesprek',
    intro: intro('Meneer Kowalski is bij de huisarts.'),
    image: { slot: 'lu-5-7', query: 'doctor patient consultation office' },
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Goedemorgen, gaat u zitten. Vertelt u eens waar u last van heeft.'],
      ['B', 'Ik heb al drie weken pijn in mijn rug, vooral ’s ochtends.'],
      ['A', 'Doet u zwaar werk?'],
      ['B', 'Ja, ik til de hele dag dozen in een magazijn.'],
      ['A', 'Dat verklaart veel. Wordt de pijn minder als u beweegt?'],
      ['B', 'Ja, na een uurtje lopen gaat het beter.'],
      ['A', 'Dat is een goed teken. Ik denk niet dat er iets ernstigs is.'],
      ['B', 'Moet ik dan rust nemen?'],
      ['A', 'Juist niet. Blijf bewegen, maar til voorzichtig. Ik verwijs u naar de fysiotherapeut.'],
    ],
    questions: [
      {
        prompt: 'Hoe lang heeft meneer Kowalski al pijn?',
        options: ['Drie weken.', 'Drie dagen.', 'Drie maanden.'],
        correct: 0,
        explanation: '"Ik heb al drie weken pijn in mijn rug."',
      },
      {
        prompt: 'Wat adviseert de dokter?',
        options: [
          'Blijven bewegen en voorzichtig tillen.',
          'Rust nemen in bed.',
          'Stoppen met werken.',
        ],
        correct: 0,
        explanation: '"Juist niet. Blijf bewegen, maar til voorzichtig."',
      },
    ],
  },
  {
    title: 'Voicemail van de woningcorporatie',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Osei luistert een bericht af.'),
    image: { slot: 'lu-5-8', query: 'apartment building entrance netherlands' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemiddag mevrouw Osei, u spreekt met Sanne van woningcorporatie Thuis. Ik bel over uw ' +
          'melding van de lekkage in de badkamer. Onze loodgieter kan aanstaande donderdag ' +
          'langskomen, tussen acht uur en twaalf uur ’s ochtends. Wij kunnen helaas geen preciezer ' +
          'tijdstip geven, omdat hij meerdere adressen op een ochtend doet. Zorgt u dat er iemand ' +
          'van achttien jaar of ouder thuis is? Anders kan hij niet naar binnen en moeten wij een ' +
          'nieuwe afspraak maken. Lukt donderdag niet, belt u ons dan even terug op ons algemene ' +
          'nummer. Dank u wel en een fijne dag.',
      ],
    ],
    questions: [
      {
        prompt: 'Wanneer komt de loodgieter?',
        options: [
          'Donderdagochtend tussen acht en twaalf uur.',
          'Donderdagmiddag.',
          'Woensdagochtend.',
        ],
        correct: 0,
        explanation: 'Tussen acht en twaalf uur ’s ochtends op donderdag.',
      },
      {
        prompt: 'Wie moet er thuis zijn?',
        options: [
          'Iemand van achttien jaar of ouder.',
          'Mevrouw Osei zelf.',
          'Niemand, hij heeft een sleutel.',
        ],
        correct: 0,
        explanation: '"Zorgt u dat er iemand van achttien jaar of ouder thuis is?"',
      },
    ],
  },
  {
    title: 'Instructie op de sportschool',
    section: 'instructie',
    intro: intro('Een trainer legt de regels van de sportschool uit.'),
    image: { slot: 'lu-5-9', query: 'gym trainer equipment fitness' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Welkom, ik loop even de belangrijkste dingen met je door. Neem altijd een handdoek mee en ' +
          'leg die op het apparaat waar je op zit; dat is hier verplicht. Na gebruik maak je het ' +
          'apparaat schoon met de doekjes uit de gele bak. Zet de gewichten na afloop terug in het ' +
          'rek, want anders struikelt iemand erover. Drinken mag alleen uit een fles met een dop, ' +
          'geen glas. Tussen zes en acht ’s avonds is het hier het drukst; kom je liever rustig, ' +
          'dan raad ik de ochtend aan. En als je twijfelt over een oefening, vraag het gewoon; ' +
          'daar staan wij voor.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat is verplicht op de sportschool?',
        options: [
          'Een handdoek op het apparaat leggen.',
          'Sportschoenen met witte zolen.',
          'Een eigen slot meenemen.',
        ],
        correct: 0,
        explanation: '"leg die op het apparaat waar je op zit; dat is hier verplicht."',
      },
      {
        prompt: 'Wanneer is het het drukst?',
        options: [
          'Tussen zes en acht ’s avonds.',
          'In de ochtend.',
          'In het weekend.',
        ],
        correct: 0,
        explanation: '"Tussen zes en acht ’s avonds is het hier het drukst."',
      },
    ],
  },
  {
    title: 'Mededeling in de trein',
    section: 'mededeling',
    intro: intro('In de trein hoort Sara een mededeling.'),
    image: { slot: 'lu-5-10', query: 'train carriage seats travelers' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Dames en heren, goedemiddag, en welkom in deze intercity naar Maastricht. Wij stoppen ' +
          'onderweg in Utrecht Centraal, Den Bosch, Eindhoven, Weert, Roermond en Sittard. Let op: ' +
          'deze trein rijdt vandaag met zes rijtuigen in plaats van de gebruikelijke tien, waardoor ' +
          'het drukker kan zijn dan normaal. Wij vragen u daarom vriendelijk om uw tas of jas niet ' +
          'op de stoel naast u te leggen, zodat iedereen kan zitten. Het toilet in rijtuig drie is ' +
          'buiten gebruik; u kunt gebruikmaken van het toilet in rijtuig vijf. Wij wensen u een ' +
          'prettige reis.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom is het drukker dan normaal?',
        options: [
          'De trein heeft minder rijtuigen.',
          'Er is een evenement.',
          'Er zijn werkzaamheden.',
        ],
        correct: 0,
        explanation: 'Zes rijtuigen in plaats van de gebruikelijke tien.',
      },
      {
        prompt: 'Wat vraagt de conducteur aan de reizigers?',
        options: [
          'Geen tassen op de stoel naast zich te leggen.',
          'Door te lopen naar rijtuig vijf.',
          'Hun kaartje klaar te houden.',
        ],
        correct: 0,
        explanation: '"om uw tas of jas niet op de stoel naast u te leggen."',
      },
      {
        prompt: 'Welk toilet kunt u gebruiken?',
        options: ['Dat in rijtuig vijf.', 'Dat in rijtuig drie.', 'Er is geen toilet.'],
        correct: 0,
        explanation: 'Rijtuig drie is buiten gebruik; rijtuig vijf werkt wel.',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 6 ───────────────────────────── */

const EXAM_6 = [
  {
    title: 'Bij de kapper',
    section: 'gesprek',
    intro: intro('Meneer Traoré zit bij de kapper.'),
    image: { slot: 'lu-6-1', query: 'barber shop client haircut' },
    voice_cast: { A: 'man_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemiddag, gaat u zitten. Wat gaan we doen vandaag?'],
      ['B', 'Gewoon kort, zoals altijd. Maar de baard mag blijven zoals hij is.'],
      ['A', 'Prima. Aan de zijkanten helemaal kort, of iets langer laten?'],
      ['B', 'Iets langer graag, want de laatste keer was het echt te kort.'],
      ['A', 'Dat noteer ik in het systeem, dan weten we het volgende keer meteen.'],
      ['B', 'Handig. Wat kost het knippen nu eigenlijk?'],
      ['A', 'Voor heren is het negentien vijftig. Met de baard erbij vijfentwintig.'],
      ['B', 'Alleen knippen dan. Kan ik meteen een afspraak maken voor over zes weken?'],
      ['A', 'Zeker. Zelfde dag en tijd? Dan zet ik u er nu in.'],
    ],
    questions: [
      {
        prompt: 'Wat wil meneer Traoré anders dan de vorige keer?',
        options: [
          'De zijkanten iets langer.',
          'De baard eraf.',
          'Een andere kleur.',
        ],
        correct: 0,
        explanation: '"Iets langer graag, want de laatste keer was het echt te kort."',
      },
      {
        prompt: 'Wat betaalt hij vandaag?',
        options: ['€ 19,50.', '€ 25.', '€ 6.'],
        correct: 0,
        explanation: 'Hij kiest alleen knippen; dat is negentien vijftig.',
      },
      {
        prompt: 'Wat spreken zij nog af?',
        options: [
          'Een nieuwe afspraak over zes weken.',
          'Dat hij terugbelt.',
          'Dat hij volgende keer betaalt.',
        ],
        correct: 0,
        explanation: 'Hij maakt meteen een afspraak voor over zes weken.',
      },
    ],
  },
  {
    title: 'Mededeling in de supermarkt',
    section: 'mededeling',
    intro: intro('In de supermarkt hoort Elif een bericht.'),
    image: { slot: 'lu-6-2', query: 'supermarket checkout queue' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Beste klanten, mag ik heel even uw aandacht? Wij openen op dit moment twee extra kassa’s ' +
          'aan de rechterkant van de winkel, dus als u in de rij staat, kunt u daar sneller terecht. ' +
          'Verder hebben wij bij de bakkerij vandaag een proeverij van ons nieuwe volkorenbrood; ' +
          'loopt u gerust even langs. En tot slot: er staat een auto met een blauwe kleur, kenteken ' +
          'eindigend op negen vier, met de lichten aan op ons parkeerterrein. Wilt u dat even ' +
          'controleren als dat uw auto is? Dank u wel voor uw aandacht en nog een prettige dag.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat gebeurt er met de kassa’s?',
        options: [
          'Er gaan twee extra kassa’s open.',
          'De kassa’s gaan sluiten.',
          'De kassa’s zijn kapot.',
        ],
        correct: 0,
        explanation: '"Wij openen op dit moment twee extra kassa’s."',
      },
      {
        prompt: 'Wat is er bij de bakkerij?',
        options: [
          'Een proeverij van volkorenbrood.',
          'Een aanbieding op taart.',
          'Een nieuwe kassa.',
        ],
        correct: 0,
        explanation: '"vandaag een proeverij van ons nieuwe volkorenbrood."',
      },
      {
        prompt: 'Wat is er met de blauwe auto?',
        options: ['De lichten staan aan.', 'Hij staat verkeerd geparkeerd.', 'Hij is beschadigd.'],
        correct: 0,
        explanation: '"met de lichten aan op ons parkeerterrein."',
      },
    ],
  },
  {
    title: 'Telefoongesprek over een cursus',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Sultani belt een taalschool.'),
    image: { slot: 'lu-6-3', query: 'woman phone call notebook' },
    voice_cast: { A: 'woman_young', B: 'woman_older' },
    lines: [
      ['A', 'Taalschool Horizon, goedemorgen.'],
      ['B', 'Goedemorgen. Ik wil graag informatie over de cursus Nederlands.'],
      ['A', 'Natuurlijk. Heeft u al eerder Nederlands geleerd?'],
      ['B', 'Ja, ik heb ongeveer een jaar les gehad, maar dat is drie jaar geleden.'],
      ['A', 'Dan doen we eerst een korte test, zodat u in de juiste groep komt.'],
      ['B', 'Wat kost die test?'],
      ['A', 'Die is gratis en duurt ongeveer een uur. U kunt volgende week donderdag om tien uur.'],
      ['B', 'Donderdagochtend werk ik. Is er ook een avond mogelijk?'],
      ['A', 'Dinsdag om zeven uur ’s avonds kan ook. Zal ik u daarvoor inplannen?'],
    ],
    questions: [
      {
        prompt: 'Wat moet mevrouw Sultani eerst doen?',
        options: [
          'Een korte test doen.',
          'Zich meteen inschrijven.',
          'De boeken kopen.',
        ],
        correct: 0,
        explanation: '"Dan doen we eerst een korte test, zodat u in de juiste groep komt."',
      },
      {
        prompt: 'Wanneer kan zij de test doen?',
        options: [
          'Dinsdagavond om zeven uur.',
          'Donderdagochtend om tien uur.',
          'Volgende maand.',
        ],
        correct: 0,
        explanation: 'Donderdagochtend werkt zij; dinsdagavond kan wel.',
      },
    ],
  },
  {
    title: 'Instructie bij het afvalstation',
    section: 'instructie',
    intro: intro('Bij de milieustraat legt een medewerker uit hoe het werkt.'),
    image: { slot: 'lu-6-4', query: 'recycling centre containers waste' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Goedemiddag, ik leg u even uit hoe het hier gaat. U rijdt eerst langs de slagboom en daar ' +
          'laat u uw pas of uw identiteitsbewijs zien; wij controleren dan of u in deze gemeente ' +
          'woont. Daarna rijdt u het terrein op en volgt u de nummers op de borden: hout bij bak ' +
          'twee, tuinafval bij bak vier, en elektrische apparaten helemaal achterin bij bak negen. ' +
          'Verf, olie en batterijen brengt u naar het kleine gebouwtje links; die mogen nooit in de ' +
          'gewone bakken. Blijf alstublieft bij uw auto en laat kinderen niet uitstappen. Twijfelt u ' +
          'waar iets hoort? Vraag het aan een van onze medewerkers in het oranje.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet u bij de slagboom laten zien?',
        options: [
          'Uw pas of identiteitsbewijs.',
          'Een bonnetje.',
          'Niets.',
        ],
        correct: 0,
        explanation: 'Zo wordt gecontroleerd of u in de gemeente woont.',
      },
      {
        prompt: 'Waar moet verf naartoe?',
        options: [
          'Naar het kleine gebouwtje links.',
          'Naar bak twee.',
          'Naar bak negen.',
        ],
        correct: 0,
        explanation: '"Verf, olie en batterijen brengt u naar het kleine gebouwtje links."',
      },
      {
        prompt: 'Wat wordt gevraagd over kinderen?',
        options: [
          'Zij mogen niet uitstappen.',
          'Zij mogen helpen.',
          'Zij moeten thuisblijven.',
        ],
        correct: 0,
        explanation: '"laat kinderen niet uitstappen."',
      },
    ],
  },
  {
    title: 'Bij de balie van het ziekenhuis',
    section: 'gesprek',
    intro: intro('Meneer Nowak meldt zich bij de balie van het ziekenhuis.'),
    image: { slot: 'lu-6-5', query: 'hospital reception desk information' },
    voice_cast: { A: 'woman_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemorgen, kan ik u helpen?'],
      ['B', 'Ik heb om half elf een afspraak, maar ik weet niet waar ik moet zijn.'],
      ['A', 'Bij welke afdeling is uw afspraak?'],
      ['B', 'Bij de cardioloog, geloof ik. Dat staat op deze brief.'],
      ['A', 'Ja, dat klopt. U moet naar route veertig, dat is op de eerste verdieping.'],
      ['B', 'Hoe kom ik daar?'],
      ['A', 'Volgt u de blauwe lijn op de vloer tot de lift, en dan één verdieping omhoog.'],
      ['B', 'Dank u wel. Moet ik me daar nog een keer melden?'],
      ['A', 'Ja, bij de zuil bij de ingang van de afdeling. U scant daar de streepjescode op de brief.'],
    ],
    questions: [
      {
        prompt: 'Waar moet meneer Nowak naartoe?',
        options: [
          'Naar route veertig op de eerste verdieping.',
          'Naar de begane grond.',
          'Naar de spoedeisende hulp.',
        ],
        correct: 0,
        explanation: '"U moet naar route veertig, dat is op de eerste verdieping."',
      },
      {
        prompt: 'Wat moet hij op de afdeling doen?',
        options: [
          'De streepjescode bij de zuil scannen.',
          'Zich bij een medewerker melden.',
          'Direct in de wachtkamer gaan zitten.',
        ],
        correct: 0,
        explanation: '"U scant daar de streepjescode op de brief."',
      },
    ],
  },
  {
    title: 'Bericht van de sportvereniging',
    section: 'mededeling',
    intro: intro('Op de club klinkt een mededeling door de luidspreker.'),
    image: { slot: 'lu-6-6', query: 'football club canteen field' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Beste leden en ouders, een korte mededeling. De wedstrijden van vanmiddag gaan gewoon ' +
          'door, maar het veld achter de kantine is afgekeurd; het staat daar te veel onder water. ' +
          'Alle wedstrijden worden daarom gespeeld op het kunstgrasveld aan de andere kant van het ' +
          'complex. Dat betekent dat de tijden een half uur opschuiven: de eerste wedstrijd begint ' +
          'om half twee in plaats van om één uur. Wij vragen de ouders om zoveel mogelijk samen te ' +
          'rijden, want er zijn maar weinig parkeerplaatsen aan die kant. De kantine is de hele ' +
          'middag open. Dank u wel.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom wordt er op een ander veld gespeeld?',
        options: [
          'Het veld achter de kantine staat onder water.',
          'Het veld wordt verbouwd.',
          'Er is een ander toernooi.',
        ],
        correct: 0,
        explanation: '"het staat daar te veel onder water."',
      },
      {
        prompt: 'Hoe laat begint de eerste wedstrijd?',
        options: ['Om half twee.', 'Om één uur.', 'Om twee uur.'],
        correct: 0,
        explanation: 'De tijden schuiven een half uur op; half twee in plaats van één uur.',
      },
      {
        prompt: 'Wat wordt aan de ouders gevraagd?',
        options: [
          'Zoveel mogelijk samen te rijden.',
          'Thuis te blijven.',
          'Eerder te komen.',
        ],
        correct: 0,
        explanation: 'Er zijn weinig parkeerplaatsen aan die kant.',
      },
    ],
  },
  {
    title: 'Voicemail van de school',
    section: 'telefoongesprek',
    intro: intro('De vader van Lena luistert een bericht van school af.'),
    image: { slot: 'lu-6-7', query: 'primary school classroom desks' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemiddag, u spreekt met juf Esther van basisschool De Vlieger. Ik bel over Lena. Zij ' +
          'heeft vanmiddag tijdens de gymles haar pols verdraaid. Het is niet ernstig, ze kan haar ' +
          'hand gewoon bewegen, maar het is wel wat dik en het doet pijn. Wij hebben er een koud ' +
          'kompres op gelegd en ze zit nu rustig in de klas. Wij denken niet dat u naar de dokter ' +
          'hoeft, maar houdt u het vanavond even in de gaten? Wordt het dikker of kan ze haar hand ' +
          'niet meer bewegen, bel dan de huisartsenpost. U kunt mij tot vier uur terugbellen op het ' +
          'nummer van school.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat is er met Lena gebeurd?',
        options: [
          'Zij heeft haar pols verdraaid.',
          'Zij is gevallen op het plein.',
          'Zij is ziek geworden.',
        ],
        correct: 0,
        explanation: '"Zij heeft vanmiddag tijdens de gymles haar pols verdraaid."',
      },
      {
        prompt: 'Wanneer moet de vader de huisartsenpost bellen?',
        options: [
          'Als de pols dikker wordt of zij haar hand niet kan bewegen.',
          'Meteen vanavond.',
          'Morgenochtend.',
        ],
        correct: 0,
        explanation: 'Dat zijn precies de twee genoemde signalen.',
      },
    ],
  },
  {
    title: 'In het buurthuis',
    section: 'gesprek',
    intro: intro('Marta wil meedoen aan een activiteit in het buurthuis.'),
    image: { slot: 'lu-6-8', query: 'community centre reception people' },
    voice_cast: { A: 'man_young', B: 'woman_young' },
    lines: [
      ['A', 'Hoi, kan ik je ergens mee helpen?'],
      ['B', 'Ja, ik zag op het bord iets over samen koken. Hoe werkt dat?'],
      ['A', 'Elke maandagavond om zes uur. Je kookt mee en daarna eet je met de groep.'],
      ['B', 'Moet ik kunnen koken?'],
      ['A', 'Helemaal niet. Sommige mensen snijden alleen groente, en dat is prima.'],
      ['B', 'Wat kost het?'],
      ['A', 'Vijf euro per keer, inclusief het eten. Met een stadspas betaal je twee vijftig.'],
      ['B', 'Die heb ik. Moet ik me nog aanmelden?'],
      ['A', 'Ja, uiterlijk zondag, want we doen de boodschappen op maandagochtend.'],
    ],
    questions: [
      {
        prompt: 'Wat betaalt Marta per keer?',
        options: ['€ 2,50.', '€ 5.', 'Niets.'],
        correct: 0,
        explanation: 'Zij heeft een stadspas; dan is het twee euro vijftig.',
      },
      {
        prompt: 'Wanneer moet zij zich uiterlijk aanmelden?',
        options: ['Op zondag.', 'Op maandagochtend.', 'Op maandag om zes uur.'],
        correct: 0,
        explanation: '"Ja, uiterlijk zondag, want we doen de boodschappen op maandagochtend."',
      },
    ],
  },
  {
    title: 'Uitleg over de bezorgdienst',
    section: 'instructie',
    intro: intro('Op zijn eerste werkdag krijgt Bilal uitleg over het bezorgen.'),
    image: { slot: 'lu-6-9', query: 'delivery driver parcels van' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Even de belangrijkste dingen voordat je de weg op gaat. Scan elk pakket voordat je het ' +
          'afgeeft, anders klopt de administratie niet en krijg jij de vragen. Is er niemand thuis, ' +
          'probeer dan eerst de buren; alleen als die het aannemen, scan je het als bezorgd bij de ' +
          'buren. Zet nooit zomaar een pakket achter de deur of in de tuin, ook niet als de klant ' +
          'daarom vraagt. Bij pakketten met een leeftijdscontrole vraag je altijd om een ' +
          'identiteitsbewijs, zonder uitzondering. En rijd rustig; wij worden niet betaald op ' +
          'snelheid, maar op wat er heel aankomt.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet Bilal doen voordat hij een pakket afgeeft?',
        options: ['Het scannen.', 'De klant bellen.', 'Een foto maken.'],
        correct: 0,
        explanation: '"Scan elk pakket voordat je het afgeeft."',
      },
      {
        prompt: 'Wat mag hij nooit doen?',
        options: [
          'Een pakket achter de deur zetten.',
          'Bij de buren afgeven.',
          'Om een identiteitsbewijs vragen.',
        ],
        correct: 0,
        explanation: '"Zet nooit zomaar een pakket achter de deur of in de tuin."',
      },
      {
        prompt: 'Wat doet hij bij een pakket met leeftijdscontrole?',
        options: [
          'Altijd om een identiteitsbewijs vragen.',
          'Het bij de buren afgeven.',
          'Het meenemen terug.',
        ],
        correct: 0,
        explanation: '"vraag je altijd om een identiteitsbewijs, zonder uitzondering."',
      },
    ],
  },
  {
    title: 'Mededeling in de wachtkamer',
    section: 'mededeling',
    intro: intro('In de wachtkamer van de huisarts klinkt een mededeling.'),
    image: { slot: 'lu-6-10', query: 'doctor waiting room chairs' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemorgen, een mededeling voor iedereen die vanochtend wacht. Dokter Willemsen is ' +
          'vanochtend naar een spoedgeval geweest en daardoor lopen wij ongeveer veertig minuten ' +
          'uit. Dat spijt ons zeer. Heeft u haast, dan kunt u bij de assistente aangeven dat u ' +
          'liever een nieuwe afspraak maakt; dat kan vandaag nog aan het eind van de middag of ' +
          'morgenochtend vroeg. Wilt u alleen een recept ophalen, dan hoeft u niet te wachten; loopt ' +
          'u dan even door naar het loket rechts. Er staat water klaar op het tafeltje bij het raam. ' +
          'Dank u wel voor uw geduld.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoeveel loopt het spreekuur uit?',
        options: ['Ongeveer veertig minuten.', 'Ongeveer een kwartier.', 'Ongeveer twee uur.'],
        correct: 0,
        explanation: '"daardoor lopen wij ongeveer veertig minuten uit."',
      },
      {
        prompt: 'Wat kan iemand doen die alleen een recept ophaalt?',
        options: [
          'Doorlopen naar het loket rechts.',
          'Toch wachten.',
          'Morgen terugkomen.',
        ],
        correct: 0,
        explanation: '"loopt u dan even door naar het loket rechts."',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 7 ───────────────────────────── */

const EXAM_7 = [
  {
    title: 'Bij het uitzendbureau',
    section: 'gesprek',
    intro: intro('Meneer Adeyemi schrijft zich in bij een uitzendbureau.'),
    image: { slot: 'lu-7-1', query: 'employment agency interview desk' },
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Goedemiddag, gaat u zitten. U wilt zich inschrijven, klopt dat?'],
      ['B', 'Ja, ik zoek werk. Het liefst in een magazijn of in de bouw.'],
      ['A', 'Heeft u ervaring in een van die twee?'],
      ['B', 'In een magazijn heb ik twee jaar gewerkt, in mijn eigen land.'],
      ['A', 'Prima. Heeft u een heftruckcertificaat?'],
      ['B', 'Nee, dat niet. Maar ik wil dat wel graag halen.'],
      ['A', 'Dat kan via ons; wij betalen de cursus als u drie maanden bij ons werkt.'],
      ['B', 'Dat lijkt me goed. Wanneer kan ik beginnen?'],
      ['A', 'Als uw papieren in orde zijn, waarschijnlijk al volgende week maandag.'],
    ],
    questions: [
      {
        prompt: 'Wat voor werk zoekt meneer Adeyemi?',
        options: [
          'Werk in een magazijn of in de bouw.',
          'Werk in de horeca.',
          'Werk als chauffeur.',
        ],
        correct: 0,
        explanation: '"Het liefst in een magazijn of in de bouw."',
      },
      {
        prompt: 'Onder welke voorwaarde betaalt het bureau de heftruckcursus?',
        options: [
          'Als hij drie maanden bij hen werkt.',
          'Als hij al ervaring heeft.',
          'Als hij zelf de helft betaalt.',
        ],
        correct: 0,
        explanation: '"wij betalen de cursus als u drie maanden bij ons werkt."',
      },
      {
        prompt: 'Wanneer kan hij waarschijnlijk beginnen?',
        options: ['Volgende week maandag.', 'Vandaag nog.', 'Over drie maanden.'],
        correct: 0,
        explanation: 'Als de papieren in orde zijn, waarschijnlijk volgende week maandag.',
      },
    ],
  },
  {
    title: 'Omroepbericht in het park',
    section: 'mededeling',
    intro: intro('Tijdens een festival in het park klinkt een mededeling.'),
    image: { slot: 'lu-7-2', query: 'outdoor festival park crowd' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Beste bezoekers, een mededeling van de organisatie. Wij hebben hier bij de ' +
          'informatietent een jongetje van ongeveer vier jaar met een geel T-shirt en blonde ' +
          'krullen. Hij heet Timo en hij is zijn ouders kwijtgeraakt. Wilt u, als u hem zoekt, ' +
          'naar de informatietent naast de grote ingang komen? Verder willen wij u erop wijzen dat ' +
          'het vanaf drie uur gaat regenen. In de grote tent bij het podium is genoeg plek om te ' +
          'schuilen. Het programma gaat gewoon door. De laatste band begint om zes uur en om acht ' +
          'uur sluiten wij het terrein. Dank u wel.',
      ],
    ],
    questions: [
      {
        prompt: 'Waar moeten de ouders van Timo naartoe?',
        options: [
          'Naar de informatietent naast de grote ingang.',
          'Naar het podium.',
          'Naar de uitgang.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk gezegd.',
      },
      {
        prompt: 'Wat gebeurt er vanaf drie uur?',
        options: ['Het gaat regenen.', 'Het festival stopt.', 'De laatste band begint.'],
        correct: 0,
        explanation: '"het vanaf drie uur gaat regenen."',
      },
      {
        prompt: 'Hoe laat sluit het terrein?',
        options: ['Om acht uur.', 'Om zes uur.', 'Om drie uur.'],
        correct: 0,
        explanation: '"om acht uur sluiten wij het terrein."',
      },
    ],
  },
  {
    title: 'Telefoongesprek met de gemeente',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Petrova belt de gemeente over haar afvalcontainer.'),
    image: { slot: 'lu-7-3', query: 'waste container street collection' },
    voice_cast: { A: 'man_older', B: 'woman_young' },
    lines: [
      ['A', 'Gemeente, goedemiddag. Waarmee kan ik u helpen?'],
      ['B', 'Mijn groene container is vanochtend niet geleegd, terwijl hij wel buiten stond.'],
      ['A', 'Vervelend. Wat is uw adres?'],
      ['B', 'Kastanjelaan 22.'],
      ['A', 'Momentje, ik zoek het even op… ik zie dat de wagen in uw straat vanochtend een storing heeft gehad.'],
      ['B', 'Vervelend. Komt hij dan later vandaag nog langs, of pas volgende week?'],
      ['A', 'Nee hoor, morgen al, tussen zeven en twaalf uur. Zet u de container vanavond weer buiten?'],
      ['B', 'Dat doe ik. En als hij morgen ook niet komt?'],
      ['A', 'Belt u dan opnieuw, dan sturen wij een aparte wagen. Dat is dan gratis, uiteraard.'],
    ],
    questions: [
      {
        prompt: 'Waarom is de container niet geleegd?',
        options: [
          'De wagen heeft een storing gehad.',
          'De container stond verkeerd.',
          'Het was een feestdag.',
        ],
        correct: 0,
        explanation: '"ik zie dat de wagen in uw straat een storing heeft gehad."',
      },
      {
        prompt: 'Wat moet mevrouw Petrova doen?',
        options: [
          'De container vanavond weer buiten zetten.',
          'De container binnen zetten.',
          'Zelf naar de milieustraat gaan.',
        ],
        correct: 0,
        explanation: '"Zet u de container vanavond weer buiten?"',
      },
    ],
  },
  {
    title: 'Instructie voor het examen',
    section: 'instructie',
    intro: intro('Voor een examen krijgen de kandidaten uitleg.'),
    image: { slot: 'lu-7-4', query: 'exam room desks candidates' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Goedemorgen allemaal en welkom. Voordat wij beginnen, nog even een paar afspraken. Leg uw ' +
          'telefoon uit, helemaal uit dus, en doe hem in de bak bij de deur; ook een horloge met een ' +
          'scherm mag niet mee naar uw plek. Op uw tafel ligt papier en een pen; die krijgt u van ' +
          'ons, en u neemt niets mee naar buiten. Het examen duurt vijfenzestig minuten en u ziet ' +
          'de tijd op het scherm. Wilt u naar het toilet, steek dan uw hand op en wacht tot iemand ' +
          'bij u komt. Bent u eerder klaar, dan mag u weggaan, maar niet in het laatste kwartier.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet er in de bak bij de deur?',
        options: [
          'De telefoon en een horloge met een scherm.',
          'Papier en pen.',
          'De jas.',
        ],
        correct: 0,
        explanation: 'Beide worden genoemd.',
      },
      {
        prompt: 'Wat doet u als u naar het toilet wilt?',
        options: [
          'Uw hand opsteken en wachten.',
          'Gewoon opstaan en gaan.',
          'Wachten tot de pauze.',
        ],
        correct: 0,
        explanation: '"steek dan uw hand op en wacht tot iemand bij u komt."',
      },
      {
        prompt: 'Wanneer mag u niet weggaan als u klaar bent?',
        options: [
          'In het laatste kwartier.',
          'In het eerste halfuur.',
          'U mag nooit eerder weg.',
        ],
        correct: 0,
        explanation: '"Bent u eerder klaar, dan mag u weggaan, maar niet in het laatste kwartier."',
      },
    ],
  },
  {
    title: 'Bij de dierenarts',
    section: 'gesprek',
    intro: intro('Mevrouw De Wit is bij de dierenarts met haar kat.'),
    image: { slot: 'lu-7-5', query: 'veterinarian examining cat clinic' },
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Goedemiddag. Vertelt u eens, wat is er met de kat aan de hand?'],
      ['B', 'Ze eet al drie dagen bijna niets en ze slaapt de hele dag.'],
      ['A', 'Drinkt ze wel?'],
      ['B', 'Ja, water drinkt ze normaal.'],
      ['A', 'Dat is in ieder geval goed nieuws. Ik ga haar even onderzoeken.'],
      ['B', 'Is het ernstig, denkt u?'],
      ['A', 'Haar tanden zien er niet goed uit; dat kan de reden zijn dat ze niet eet.'],
      ['B', 'Wat kunnen we daaraan doen?'],
      ['A', 'Ik wil haar volgende week onder narcose bekijken. Dan kan ik meteen behandelen.'],
    ],
    questions: [
      {
        prompt: 'Wat is het probleem met de kat?',
        options: [
          'Zij eet bijna niets en slaapt veel.',
          'Zij drinkt niet.',
          'Zij loopt mank.',
        ],
        correct: 0,
        explanation: '"Ze eet al drie dagen bijna niets en ze slaapt de hele dag."',
      },
      {
        prompt: 'Wat denkt de dierenarts dat de oorzaak is?',
        options: ['Haar tanden.', 'Haar maag.', 'Haar leeftijd.'],
        correct: 0,
        explanation: '"Haar tanden zien er niet goed uit."',
      },
    ],
  },
  {
    title: 'Bericht van de verhuurder',
    section: 'telefoongesprek',
    intro: intro('Ahmed luistert een bericht van zijn verhuurder af.'),
    image: { slot: 'lu-7-6', query: 'apartment interior living room keys' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Goedemiddag Ahmed, met Ton van Dijk, je verhuurder. Ik bel over de jaarlijkse controle van ' +
          'de cv-ketel. De monteur komt aanstaande dinsdag langs, ergens tussen negen uur en één ' +
          'uur; preciezer kan ik het helaas niet krijgen. Het duurt ongeveer een half uur. Kun jij ' +
          'ervoor zorgen dat iemand thuis is, en dat de ruimte rond de ketel vrij is? Er stonden ' +
          'vorig jaar nogal wat spullen voor. Lukt dinsdag echt niet, laat het mij dan vóór maandag ' +
          'weten, dan verzet ik het naar de week erna. Anders hoor ik niets van je en gaat het ' +
          'gewoon door. Bedankt alvast.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarvoor komt de monteur?',
        options: [
          'Voor de jaarlijkse controle van de cv-ketel.',
          'Voor een reparatie aan de kraan.',
          'Voor de meterstanden.',
        ],
        correct: 0,
        explanation: 'Dat zegt de verhuurder meteen.',
      },
      {
        prompt: 'Wat moet Ahmed doen als dinsdag niet lukt?',
        options: [
          'Het vóór maandag laten weten.',
          'De monteur zelf bellen.',
          'Niets doen.',
        ],
        correct: 0,
        explanation: '"laat het mij dan vóór maandag weten."',
      },
    ],
  },
  {
    title: 'Mededeling in de bibliotheek',
    section: 'mededeling',
    intro: intro('In de bibliotheek klinkt een bericht over de computers.'),
    image: { slot: 'lu-7-7', query: 'library computers workstations' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Beste bezoekers, een mededeling over onze computers. Vanaf volgende week werken alle ' +
          'computers in de bibliotheek met een nieuw systeem. U logt dan in met uw pasnummer en uw ' +
          'geboortedatum, in plaats van met het oude wachtwoord. Wie dat lastig vindt, kan hulp ' +
          'krijgen: op dinsdag- en donderdagmiddag zit er tussen twee en vier uur iemand klaar bij ' +
          'de computerhoek. U hoeft daarvoor geen afspraak te maken. Printen blijft hetzelfde ' +
          'werken en kost nog steeds tien cent per bladzijde in zwart-wit. Heeft u nu al vragen, ' +
          'loopt u dan even langs de balie.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarmee logt u vanaf volgende week in?',
        options: [
          'Met uw pasnummer en geboortedatum.',
          'Met het oude wachtwoord.',
          'Met uw e-mailadres.',
        ],
        correct: 0,
        explanation: 'Dat vervangt het oude wachtwoord.',
      },
      {
        prompt: 'Wanneer is er hulp bij de computerhoek?',
        options: [
          'Dinsdag- en donderdagmiddag tussen twee en vier uur.',
          'Elke dag de hele dag.',
          'Alleen op afspraak.',
        ],
        correct: 0,
        explanation: 'Dat zijn de genoemde tijden, en een afspraak is niet nodig.',
      },
      {
        prompt: 'Wat verandert er aan het printen?',
        options: ['Niets.', 'Het wordt duurder.', 'Het kan niet meer.'],
        correct: 0,
        explanation: '"Printen blijft hetzelfde werken en kost nog steeds tien cent per bladzijde."',
      },
    ],
  },
  {
    title: 'Bij de receptie van het hotel',
    section: 'gesprek',
    intro: intro('Meneer Silva checkt in bij een hotel.'),
    image: { slot: 'lu-7-8', query: 'hotel reception check in desk' },
    voice_cast: { A: 'woman_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemiddag, welkom. Heeft u gereserveerd?'],
      ['B', 'Ja, op de naam Silva, voor twee nachten.'],
      ['A', 'Dat klopt, kamer 214 op de tweede verdieping. Mag ik uw identiteitsbewijs even zien?'],
      ['B', 'Alstublieft. Is het ontbijt inbegrepen?'],
      ['A', 'Bij uw boeking niet, maar u kunt het erbij nemen voor twaalf euro vijftig per persoon.'],
      ['B', 'Doe maar voor allebei de ochtenden. Hoe laat is het ontbijt?'],
      ['A', 'Van half zeven tot half elf, in de zaal achter de lift.'],
      ['B', 'En kan ik hier ergens parkeren?'],
      ['A', 'Achter het hotel, dat is vijftien euro per nacht. Ik geef u een kaart mee voor de slagboom.'],
    ],
    questions: [
      {
        prompt: 'Wat kost het ontbijt?',
        options: [
          '€ 12,50 per persoon.',
          'Niets, het is inbegrepen.',
          '€ 15 per persoon.',
        ],
        correct: 0,
        explanation: 'Het zat niet bij de boeking en kost twaalf vijftig per persoon.',
      },
      {
        prompt: 'Hoe laat kan meneer Silva ontbijten?',
        options: [
          'Tussen half zeven en half elf.',
          'Tussen zeven en tien uur.',
          'Alleen om acht uur.',
        ],
        correct: 0,
        explanation: '"Van half zeven tot half elf."',
      },
    ],
  },
  {
    title: 'Uitleg over de brandalarmoefening',
    section: 'instructie',
    intro: intro('Op kantoor legt een collega de ontruimingsoefening uit.'),
    image: { slot: 'lu-7-9', query: 'office emergency exit sign corridor' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Even iets over de oefening van morgen. Om ongeveer elf uur gaat het alarm af; jullie weten ' +
          'dus dat het een oefening is, maar wij doen het alsof het echt is. Sluit je computer niet ' +
          'af en pak geen jassen of tassen; laat alles gewoon liggen. Loop rustig naar het ' +
          'dichtstbijzijnde trappenhuis, dus niet naar de lift, en ga naar buiten via de ' +
          'hoofdingang of via de achterdeur bij de kantine. Buiten verzamelen wij op het grasveld ' +
          'aan de overkant van de straat. Daar staan collega’s met gele hesjes die jullie namen ' +
          'afvinken. Wacht daar tot je hoort dat je terug naar binnen mag.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat mogen de medewerkers niet meenemen?',
        options: ['Jassen en tassen.', 'Hun telefoon.', 'Hun badge.'],
        correct: 0,
        explanation: '"pak geen jassen of tassen; laat alles gewoon liggen."',
      },
      {
        prompt: 'Waar verzamelt iedereen?',
        options: [
          'Op het grasveld aan de overkant van de straat.',
          'Bij de hoofdingang.',
          'In de kantine.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk gezegd.',
      },
      {
        prompt: 'Hoe herken je de collega’s die de namen afvinken?',
        options: [
          'Zij dragen gele hesjes.',
          'Zij hebben een megafoon.',
          'Zij staan bij de lift.',
        ],
        correct: 0,
        explanation: '"Daar staan collega’s met gele hesjes."',
      },
    ],
  },
  {
    title: 'Mededeling over de weekmarkt',
    section: 'mededeling',
    intro: intro('Op de markt hoort Anna een mededeling.'),
    image: { slot: 'lu-7-10', query: 'street market stalls shoppers' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Beste bezoekers van de markt, goedemorgen. Vanwege de harde wind van vandaag sluiten wij ' +
          'de markt vanmiddag eerder, om twee uur in plaats van vier uur. De kramen worden dan ' +
          'afgebroken en dat gaat wat sneller dan normaal, dus let u alstublieft goed op als u langs ' +
          'de kramen loopt. Wij vragen u ook om niet onder de zeilen te blijven staan bij een harde ' +
          'windvlaag. Volgende week zijn wij weer op de gewone tijden aanwezig, van acht uur ’s ' +
          'ochtends tot vier uur ’s middags. Bedankt voor uw begrip en tot volgende week.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom sluit de markt eerder?',
        options: ['Vanwege de harde wind.', 'Vanwege de regen.', 'Vanwege een feestdag.'],
        correct: 0,
        explanation: '"Vanwege de harde wind van vandaag sluiten wij de markt vanmiddag eerder."',
      },
      {
        prompt: 'Hoe laat sluit de markt vandaag?',
        options: ['Om twee uur.', 'Om vier uur.', 'Om acht uur.'],
        correct: 0,
        explanation: 'Om twee uur in plaats van vier uur.',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 8 ───────────────────────────── */

const EXAM_8 = [
  {
    title: 'Bij de opticien',
    section: 'gesprek',
    intro: intro('Mevrouw Yilmaz laat haar ogen meten bij de opticien.'),
    image: { slot: 'lu-8-1', query: 'optician eye test glasses shop' },
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Goedemiddag, u kwam voor een oogmeting?'],
      ['B', 'Ja, ik zie de laatste tijd wazig als ik lees.'],
      ['A', 'Wanneer heeft u voor het laatst uw ogen laten meten?'],
      ['B', 'Dat is al zeker vier jaar geleden.'],
      ['A', 'Dan wordt het tijd. De meting duurt ongeveer twintig minuten en is gratis.'],
      ['B', 'Fijn. En als ik een nieuwe bril nodig heb?'],
      ['A', 'Dan kunt u meteen monturen passen. Wij hebben ook aanbiedingen deze maand.'],
      ['B', 'Hoe lang duurt het voordat de bril klaar is?'],
      ['A', 'Meestal een week. Bij een sterke afwijking soms tien werkdagen.'],
    ],
    questions: [
      {
        prompt: 'Waarom komt mevrouw Yilmaz?',
        options: [
          'Zij ziet wazig als zij leest.',
          'Haar bril is kapot.',
          'Zij wil een zonnebril.',
        ],
        correct: 0,
        explanation: '"ik zie de laatste tijd wazig als ik lees."',
      },
      {
        prompt: 'Wat kost de oogmeting?',
        options: ['Niets.', '€ 20.', 'Dat hangt van de sterkte af.'],
        correct: 0,
        explanation: '"De meting duurt ongeveer twintig minuten en is gratis."',
      },
      {
        prompt: 'Hoe lang duurt het meestal voordat een bril klaar is?',
        options: ['Ongeveer een week.', 'Twintig minuten.', 'Vier jaar.'],
        correct: 0,
        explanation: '"Meestal een week."',
      },
    ],
  },
  {
    title: 'Mededeling op het vliegveld',
    section: 'mededeling',
    intro: intro('Op het vliegveld hoort Nour een omroepbericht.'),
    image: { slot: 'lu-8-2', query: 'airport terminal departure gate' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Dames en heren, uw aandacht alstublieft. De vlucht naar Istanbul van drie uur ' +
          'vijfentwintig vertrekt vandaag vanaf gate B twaalf, en niet vanaf gate B vier zoals op ' +
          'de schermen staat aangegeven. Het instappen begint over ongeveer twintig minuten. Wij ' +
          'vragen passagiers met kleine kinderen en passagiers die hulp nodig hebben om zich als ' +
          'eerste te melden bij de balie. Neemt u alstublieft uw instapkaart en uw paspoort alvast ' +
          'in de hand. Wij verwachten dat wij op tijd kunnen vertrekken. Dank u wel voor uw ' +
          'aandacht en een goede reis gewenst.',
      ],
    ],
    questions: [
      {
        prompt: 'Vanaf welke gate vertrekt de vlucht?',
        options: ['Gate B12.', 'Gate B4.', 'Dat is nog niet bekend.'],
        correct: 0,
        explanation: 'B twaalf, en niet B vier zoals op de schermen staat.',
      },
      {
        prompt: 'Wie mag zich als eerste melden?',
        options: [
          'Passagiers met kleine kinderen en passagiers die hulp nodig hebben.',
          'Passagiers met alleen handbagage.',
          'Iedereen tegelijk.',
        ],
        correct: 0,
        explanation: 'Die twee groepen worden genoemd.',
      },
      {
        prompt: 'Wanneer begint het instappen?',
        options: ['Over ongeveer twintig minuten.', 'Meteen.', 'Om drie uur vijfentwintig.'],
        correct: 0,
        explanation: '"Het instappen begint over ongeveer twintig minuten."',
      },
    ],
  },
  {
    title: 'Telefoongesprek met het ziekenhuis',
    section: 'telefoongesprek',
    intro: intro('Meneer Bakker wordt gebeld door het ziekenhuis.'),
    image: { slot: 'lu-8-3', query: 'hospital corridor nurse phone' },
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Goedemiddag, u spreekt met de poli Orthopedie van het Sint Anna ziekenhuis.'],
      ['B', 'Goedemiddag.'],
      ['A', 'Ik bel over uw operatie van volgende maand. Er is een plek eerder vrijgekomen.'],
      ['B', 'O, wanneer dan?'],
      ['A', 'Aanstaande donderdag, over drie dagen dus. Zou dat u schikken?'],
      ['B', 'Dat is wel heel snel. Ik moet dan wel vrij vragen op mijn werk.'],
      ['A', 'Dat begrijp ik. U mag er even over nadenken en mij vóór morgen twaalf uur bellen.'],
      ['B', 'Doe ik. Moet ik nog iets voorbereiden als ik ja zeg?'],
      ['A', 'U mag vanaf middernacht niet meer eten. Drinken mag tot twee uur van tevoren.'],
    ],
    questions: [
      {
        prompt: 'Waarom belt het ziekenhuis?',
        options: [
          'Er is een plek eerder vrijgekomen voor de operatie.',
          'De operatie gaat niet door.',
          'Er is een rekening niet betaald.',
        ],
        correct: 0,
        explanation: '"Er is een plek eerder vrijgekomen."',
      },
      {
        prompt: 'Wanneer moet hij laten weten of hij komt?',
        options: [
          'Vóór morgen twaalf uur.',
          'Vandaag nog.',
          'Op donderdag zelf.',
        ],
        correct: 0,
        explanation: '"mij vóór morgen twaalf uur bellen."',
      },
    ],
  },
  {
    title: 'Instructie bij het schoonmaakwerk',
    section: 'instructie',
    intro: intro('Op haar eerste werkdag krijgt Maria uitleg over het schoonmaken.'),
    image: { slot: 'lu-8-4', query: 'cleaning cart office corridor' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Ik loop het even met je door, dan weet je hoe wij het hier doen. Je begint altijd op de ' +
          'bovenste verdieping en werkt naar beneden; dan loop je niet door je eigen schoongemaakte ' +
          'gangen. De blauwe doeken zijn voor de bureaus en de gele doeken uitsluitend voor het ' +
          'toilet, dus die twee houd je strikt apart. Prullenbakken leeg je elke dag, ook als er ' +
          'bijna niets in zit. Ramen doen wij één keer per maand; dat staat op het schema aan de ' +
          'binnenkant van de kastdeur. Zie je iets kapot, schrijf het dan op het lijstje in de ' +
          'kast; dan geef ik het door.',
      ],
    ],
    questions: [
      {
        prompt: 'Waar begint Maria met schoonmaken?',
        options: [
          'Op de bovenste verdieping.',
          'Op de begane grond.',
          'Bij de toiletten.',
        ],
        correct: 0,
        explanation: '"Je begint altijd op de bovenste verdieping en werkt naar beneden."',
      },
      {
        prompt: 'Waarvoor zijn de gele doeken?',
        options: ['Uitsluitend voor het toilet.', 'Voor de bureaus.', 'Voor de ramen.'],
        correct: 0,
        explanation: '"de gele doeken uitsluitend voor het toilet."',
      },
      {
        prompt: 'Wat doet zij als zij iets kapot ziet?',
        options: [
          'Het op het lijstje in de kast schrijven.',
          'Het zelf maken.',
          'Meteen bellen.',
        ],
        correct: 0,
        explanation: '"schrijf het dan op het lijstje in de kast; dan geef ik het door."',
      },
    ],
  },
  {
    title: 'Bij de balie van de sportschool',
    section: 'gesprek',
    intro: intro('Hassan wil zijn abonnement opzeggen.'),
    image: { slot: 'lu-8-5', query: 'gym front desk membership' },
    voice_cast: { A: 'woman_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemiddag, waarmee kan ik u helpen?'],
      ['B', 'Ik wil mijn abonnement opzeggen. Ik ga verhuizen naar Groningen.'],
      ['A', 'Wat vervelend dat u weggaat. Wanneer verhuist u precies?'],
      ['B', 'Over zes weken, begin volgende maand.'],
      ['A', 'Dan is dat geen probleem. Wij hanteren een opzegtermijn van één maand.'],
      ['B', 'Moet ik daar een formulier voor invullen?'],
      ['A', 'Ja, een klein formulier met uw naam en uw lidnummer. Ik print het nu even voor u uit.'],
      ['B', 'Dank u. En krijg ik nog geld terug van de contributie van deze maand?'],
      ['A', 'Nee, de lopende maand betaalt u helemaal. Daarna stopt de incasso vanzelf.'],
    ],
    questions: [
      {
        prompt: 'Waarom zegt Hassan zijn abonnement op?',
        options: ['Hij gaat verhuizen.', 'Het is te duur.', 'Hij is geblesseerd.'],
        correct: 0,
        explanation: '"Ik ga verhuizen naar Groningen."',
      },
      {
        prompt: 'Hoe lang is de opzegtermijn?',
        options: ['Eén maand.', 'Zes weken.', 'Drie maanden.'],
        correct: 0,
        explanation: '"Wij hanteren een opzegtermijn van één maand."',
      },
    ],
  },
  {
    title: 'Voicemail van de kinderopvang',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Traoré luistert een bericht van de opvang af.'),
    image: { slot: 'lu-8-6', query: 'daycare playroom toys children' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Goedemiddag mevrouw Traoré, u spreekt met Femke van kinderopvang De Zonnebloem. Ik bel ' +
          'over Amadou. Hij heeft vanmiddag koorts gekregen, achtendertig komma acht, en hij is erg ' +
          'stil en hangerig. Volgens onze regels mogen kinderen met koorts hier niet blijven, dus ' +
          'wij vragen u om hem op te halen. Als het u zelf niet lukt, mag ook iemand anders komen, ' +
          'maar geeft u die persoon dan even telefonisch aan ons door. Wij geven hem nu wat te ' +
          'drinken en hij ligt op de bank in de rustige hoek. Belt u ons even terug om te laten ' +
          'weten hoe laat u er ongeveer bent? Dank u wel.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat is er met Amadou?',
        options: ['Hij heeft koorts.', 'Hij is gevallen.', 'Hij wil niet eten.'],
        correct: 0,
        explanation: '"Hij heeft vanmiddag koorts gekregen, achtendertig komma acht."',
      },
      {
        prompt: 'Wat moet mevrouw Traoré doen als iemand anders hem ophaalt?',
        options: [
          'Dat telefonisch doorgeven aan de opvang.',
          'Een briefje meegeven.',
          'Niets, dat mag altijd.',
        ],
        correct: 0,
        explanation: '"geeft u die persoon dan even telefonisch aan ons door."',
      },
    ],
  },
  {
    title: 'Mededeling in het station',
    section: 'mededeling',
    intro: intro('Op het station hoort Kwame een mededeling over de roltrap.'),
    image: { slot: 'lu-8-7', query: 'train station escalator hall' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Beste reizigers, wij informeren u over een storing in ons station. De roltrap naar spoor ' +
          'vier en vijf is buiten gebruik wegens een technisch defect; onze monteurs zijn ter ' +
          'plaatse en verwachten het vanmiddag te verhelpen. Reizigers met veel bagage, met een ' +
          'kinderwagen of met een rolstoel kunnen gebruikmaken van de lift naast de kiosk; die ' +
          'werkt gewoon. Wij adviseren u om iets meer tijd te nemen voor het overstappen, zeker in ' +
          'de spits. Onze medewerkers in het blauw staan bij de trap om u zo nodig te helpen. Onze ' +
          'excuses voor het ongemak.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat is er kapot?',
        options: [
          'De roltrap naar spoor vier en vijf.',
          'De lift naast de kiosk.',
          'De kaartautomaat.',
        ],
        correct: 0,
        explanation: 'De roltrap is buiten gebruik; de lift werkt gewoon.',
      },
      {
        prompt: 'Wat wordt reizigers geadviseerd?',
        options: [
          'Meer tijd te nemen voor het overstappen.',
          'Een andere route te nemen.',
          'Hun kaartje om te ruilen.',
        ],
        correct: 0,
        explanation: '"Wij adviseren u om iets meer tijd te nemen voor het overstappen."',
      },
      {
        prompt: 'Waar staan de medewerkers?',
        options: ['Bij de trap.', 'Bij de kiosk.', 'Op het perron.'],
        correct: 0,
        explanation: '"Onze medewerkers in het blauw staan bij de trap."',
      },
    ],
  },
  {
    title: 'Bij het loket van de gemeente',
    section: 'gesprek',
    intro: intro('Mevrouw Silva komt haar rijbewijs ophalen.'),
    image: { slot: 'lu-8-8', query: 'government counter documents service' },
    voice_cast: { A: 'man_young', B: 'woman_young' },
    lines: [
      ['A', 'Goedemiddag, wat kan ik voor u doen?'],
      ['B', 'Ik kom mijn nieuwe rijbewijs ophalen. Ik heb hier de brief.'],
      ['A', 'Dank u. Heeft u uw oude rijbewijs bij u? Dat moeten wij innemen.'],
      ['B', 'Ja, hier is het. Krijg ik het niet terug?'],
      ['A', 'Nee, wij knippen er een hoekje uit. U mag het dan wel bewaren als aandenken.'],
      ['B', 'Prima. Klopt het dat dit rijbewijs weer tien jaar geldig is?'],
      ['A', 'Ja, tot uw vijfenzeventigste. Daarna is het vijf jaar per keer.'],
      ['B', 'Goed om te weten. Moet ik nog iets betalen?'],
      ['A', 'Nee, u heeft bij de aanvraag al betaald. U bent klaar.'],
    ],
    questions: [
      {
        prompt: 'Wat gebeurt er met het oude rijbewijs?',
        options: [
          'Er wordt een hoekje uitgeknipt en zij mag het houden.',
          'Het wordt weggegooid.',
          'Zij houdt het gewoon.',
        ],
        correct: 0,
        explanation: '"wij knippen er een hoekje uit. U mag het dan wel bewaren."',
      },
      {
        prompt: 'Moet mevrouw Silva nog betalen?',
        options: [
          'Nee, zij heeft bij de aanvraag betaald.',
          'Ja, aan het loket.',
          'Ja, per rekening.',
        ],
        correct: 0,
        explanation: '"u heeft bij de aanvraag al betaald."',
      },
    ],
  },
  {
    title: 'Uitleg over de app van de gemeente',
    section: 'instructie',
    intro: intro('Een medewerker legt uit hoe de app van de gemeente werkt.'),
    image: { slot: 'lu-8-9', query: 'smartphone app hands city street' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Ik laat u even zien hoe onze app werkt; hij is echt handig. U downloadt hem gratis in de ' +
          'appstore en u zoekt op de naam van de gemeente. Inloggen hoeft niet als u alleen een ' +
          'melding wilt doen over de openbare ruimte, bijvoorbeeld een kapotte lamp of een volle ' +
          'container. U maakt een foto, de app pakt automatisch de locatie erbij, en u drukt op ' +
          'versturen. U krijgt dan een meldingsnummer waarmee u kunt volgen wat wij ermee doen. ' +
          'Wilt u iets aanvragen, bijvoorbeeld een uittreksel, dan moet u wel inloggen met DigiD. ' +
          'Werkt iets niet, kom dan gerust langs bij dit loket.',
      ],
    ],
    questions: [
      {
        prompt: 'Wanneer hoeft u niet in te loggen?',
        options: [
          'Als u een melding doet over de openbare ruimte.',
          'Als u een uittreksel aanvraagt.',
          'Nooit, inloggen is altijd nodig.',
        ],
        correct: 0,
        explanation: 'Voor een melding hoeft dat niet; voor een aanvraag wel.',
      },
      {
        prompt: 'Wat krijgt u na het versturen van een melding?',
        options: [
          'Een meldingsnummer.',
          'Een telefoontje.',
          'Een brief.',
        ],
        correct: 0,
        explanation: '"U krijgt dan een meldingsnummer waarmee u kunt volgen wat wij ermee doen."',
      },
    ],
  },
  {
    title: 'Mededeling in de sporthal',
    section: 'mededeling',
    intro: intro('In de sporthal klinkt een mededeling.'),
    image: { slot: 'lu-8-10', query: 'sports hall indoor court spectators' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Beste bezoekers en sporters, een mededeling van de organisatie. Het toernooi loopt op dit ' +
          'moment ongeveer een half uur achter op het schema, doordat er in de tweede ronde een ' +
          'blessure was. Alle wedstrijden schuiven daardoor op. De finale die om vier uur gepland ' +
          'stond, begint nu naar verwachting om half vijf. Teams die al klaar zijn, vragen wij ' +
          'vriendelijk om de kleedkamers vrij te maken voor de teams die nog moeten spelen. De ' +
          'kantine blijft een half uur langer open dan gepland, dus tot zes uur. Bedankt voor jullie ' +
          'geduld en veel succes aan alle teams.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom loopt het toernooi achter?',
        options: [
          'Er was een blessure in de tweede ronde.',
          'Een team kwam te laat.',
          'De zaal was niet klaar.',
        ],
        correct: 0,
        explanation: '"doordat er in de tweede ronde een blessure was."',
      },
      {
        prompt: 'Hoe laat begint de finale nu?',
        options: ['Om half vijf.', 'Om vier uur.', 'Om zes uur.'],
        correct: 0,
        explanation: 'De finale schuift van vier uur naar half vijf.',
      },
      {
        prompt: 'Wat wordt gevraagd aan teams die klaar zijn?',
        options: [
          'De kleedkamers vrij te maken.',
          'Naar huis te gaan.',
          'In de kantine te wachten.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk gevraagd.',
      },
    ],
  },
];

/* ───────────────────────────── oefenexamen 9 ───────────────────────────── */

const EXAM_9 = [
  {
    title: 'Bij de balie van de school',
    section: 'gesprek',
    intro: intro('Meneer Rahimi meldt zijn dochter aan bij een nieuwe school.'),
    image: { slot: 'lu-9-1', query: 'school office parent registration' },
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Goedemorgen, waarmee kan ik u helpen?'],
      ['B', 'Wij zijn net verhuisd en ik wil mijn dochter hier aanmelden. Zij is negen.'],
      ['A', 'Dan komt zij in groep zes. Heeft u haar gegevens van de vorige school bij u?'],
      ['B', 'Ik heb haar rapport, maar het dossier heb ik niet.'],
      ['A', 'Dat is geen probleem, dat vragen wij zelf op bij de oude school.'],
      ['B', 'Wanneer kan zij beginnen?'],
      ['A', 'Wij plannen eerst een kennismaking met de juf, en daarna een proefdag.'],
      ['B', 'Hoe lang duurt dat allemaal?'],
      ['A', 'Meestal is alles binnen twee weken rond. Zij begint dan na de kennismaking.'],
    ],
    questions: [
      {
        prompt: 'In welke groep komt de dochter?',
        options: ['In groep zes.', 'In groep vijf.', 'In groep negen.'],
        correct: 0,
        explanation: 'Zij is negen jaar; dat is groep zes.',
      },
      {
        prompt: 'Wie vraagt het dossier op bij de oude school?',
        options: ['De nieuwe school.', 'Meneer Rahimi zelf.', 'De gemeente.'],
        correct: 0,
        explanation: '"dat vragen wij zelf op bij de oude school."',
      },
      {
        prompt: 'Wat gebeurt er voordat zij echt begint?',
        options: [
          'Een kennismaking en een proefdag.',
          'Een toets.',
          'Een gesprek met de directeur.',
        ],
        correct: 0,
        explanation: '"Wij plannen eerst een kennismaking met de juf, en daarna een proefdag."',
      },
    ],
  },
  {
    title: 'Bericht in de parkeergarage',
    section: 'mededeling',
    intro: intro('In de parkeergarage hoort Ana een mededeling.'),
    image: { slot: 'lu-9-2', query: 'underground parking garage cars' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Beste bezoekers van onze parkeergarage, een korte mededeling. De uitrit op niveau min ' +
          'één is momenteel gesloten omdat er onderhoud plaatsvindt aan de slagboom. U kunt de ' +
          'garage verlaten via de uitrit op niveau min twee; volgt u daarvoor de groene borden. ' +
          'Verder willen wij u eraan herinneren dat u eerst bij de betaalautomaat afrekent voordat ' +
          'u naar uw auto loopt; de automaten staan bij beide liften. Betalen kan met de pas en ' +
          'contant. De garage sluit vannacht om één uur en gaat morgenochtend om zes uur weer open. ' +
          'Dank u wel voor uw begrip.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom is de uitrit op niveau min één dicht?',
        options: [
          'Er is onderhoud aan de slagboom.',
          'De garage is vol.',
          'Er is een ongeluk gebeurd.',
        ],
        correct: 0,
        explanation: '"omdat er onderhoud plaatsvindt aan de slagboom."',
      },
      {
        prompt: 'Wat moet u doen voordat u naar uw auto loopt?',
        options: [
          'Afrekenen bij de betaalautomaat.',
          'Uw kaartje laten scannen bij de uitrit.',
          'De groene borden volgen.',
        ],
        correct: 0,
        explanation: '"u eerst bij de betaalautomaat afrekent voordat u naar uw auto loopt."',
      },
      {
        prompt: 'Hoe laat gaat de garage morgen open?',
        options: ['Om zes uur.', 'Om één uur.', 'Om zeven uur.'],
        correct: 0,
        explanation: '"gaat morgenochtend om zes uur weer open."',
      },
    ],
  },
  {
    title: 'Telefoongesprek met de fysiotherapeut',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Kaya belt de fysiotherapeut.'),
    image: { slot: 'lu-9-3', query: 'physiotherapy practice treatment room' },
    voice_cast: { A: 'man_young', B: 'woman_older' },
    lines: [
      ['A', 'Praktijk voor fysiotherapie, goedemorgen.'],
      ['B', 'Goedemorgen. Ik heb een verwijzing van de huisarts voor mijn schouder.'],
      ['A', 'Dan maken wij een eerste afspraak. Die duurt drie kwartier.'],
      ['B', 'Wanneer kan dat ongeveer?'],
      ['A', 'Volgende week woensdag om half tien in de ochtend, of anders vrijdag om twee uur ’s middags.'],
      ['B', 'Vrijdag graag, want woensdag pas ik op mijn kleinkinderen. Moet ik nog iets meenemen?'],
      ['A', 'De verwijsbrief van de huisarts, uw verzekeringspas en makkelijke kleding waarin u goed kunt bewegen.'],
      ['B', 'Weet u ook of mijn verzekering het vergoedt?'],
      ['A', 'Dat verschilt per polis. Wij kijken het bij de eerste afspraak samen met u na.'],
    ],
    questions: [
      {
        prompt: 'Hoe lang duurt de eerste afspraak?',
        options: ['Drie kwartier.', 'Een half uur.', 'Een uur.'],
        correct: 0,
        explanation: '"Die duurt drie kwartier."',
      },
      {
        prompt: 'Wanneer komt mevrouw Kaya?',
        options: [
          'Vrijdag om twee uur.',
          'Woensdag om half tien.',
          'Volgende maand.',
        ],
        correct: 0,
        explanation: 'Zij kiest vrijdag om twee uur.',
      },
    ],
  },
  {
    title: 'Uitleg over het werken met de kassa',
    section: 'instructie',
    intro: intro('In een winkel krijgt Sofia uitleg over de kassa.'),
    image: { slot: 'lu-9-4', query: 'shop cashier register counter' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Ik leg je even uit hoe de kassa werkt, dan kun je zo zelf beginnen. Je logt in met je ' +
          'eigen nummer, nooit met dat van een ander, want alles wat er gebeurt staat op jouw naam. ' +
          'Scan de artikelen één voor één en let op de bonuskaart; vraag er altijd naar, ook als de ' +
          'klant nog niets zegt. Contant geld leg je op het bakje bovenop de la totdat je het ' +
          'wisselgeld hebt teruggegeven; zo voorkom je discussie. Wil een klant iets ruilen, roep ' +
          'dan een collega; dat doe je in het begin nog niet zelf. En blijft er iets hangen, druk ' +
          'dan op de rode knop en ik kom eraan.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarmee logt Sofia in?',
        options: [
          'Met haar eigen nummer.',
          'Met het nummer van een collega.',
          'Met haar telefoon.',
        ],
        correct: 0,
        explanation: '"Je logt in met je eigen nummer, nooit met dat van een ander."',
      },
      {
        prompt: 'Wat doet zij met contant geld?',
        options: [
          'Op het bakje leggen tot het wisselgeld terug is.',
          'Meteen in de la doen.',
          'Aan een collega geven.',
        ],
        correct: 0,
        explanation: 'Zo voorkomt zij discussie over wat de klant gaf.',
      },
      {
        prompt: 'Wat doet zij als een klant iets wil ruilen?',
        options: [
          'Een collega roepen.',
          'Het zelf regelen.',
          'De klant wegsturen.',
        ],
        correct: 0,
        explanation: '"roep dan een collega; dat doe je in het begin nog niet zelf."',
      },
    ],
  },
  {
    title: 'Bij de buren',
    section: 'gesprek',
    intro: intro('Meneer Novak praat met zijn buurvrouw over een pakket.'),
    image: { slot: 'lu-9-5', query: 'neighbours talking doorway parcel' },
    voice_cast: { A: 'woman_older', B: 'man_older' },
    lines: [
      ['A', 'Hallo meneer Novak, ik heb gisteren een pakket voor u aangenomen.'],
      ['B', 'O, wat fijn. Ik verwachtte al iets.'],
      ['A', 'Het staat binnen in de gang. Ik pak het even.'],
      ['B', 'Dank u wel. Was het zwaar?'],
      ['A', 'Nogal, ja. De bezorger zei dat het boeken waren.'],
      ['B', 'Klopt, boeken voor mijn cursus. Ik heb u er helemaal niet voor betaald.'],
      ['A', 'Dat hoeft ook niet, hoor. Ik neem graag iets aan als u er niet bent.'],
      ['B', 'Dat is aardig. Ik doe hetzelfde voor u als u een keer weg bent.'],
    ],
    questions: [
      {
        prompt: 'Waarom praten zij met elkaar?',
        options: [
          'De buurvrouw heeft een pakket aangenomen.',
          'Er is overlast geweest.',
          'Zij organiseren een feest.',
        ],
        correct: 0,
        explanation: '"ik heb gisteren een pakket voor u aangenomen."',
      },
      {
        prompt: 'Wat zit er in het pakket?',
        options: ['Boeken.', 'Kleding.', 'Gereedschap.'],
        correct: 0,
        explanation: '"boeken voor mijn cursus."',
      },
    ],
  },
  {
    title: 'Voicemail van de bank',
    section: 'telefoongesprek',
    intro: intro('Meneer Osei luistert een bericht van de bank af.'),
    image: { slot: 'lu-9-6', query: 'bank building office exterior' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Goedemiddag meneer Osei, u spreekt met de fraudedesk van uw bank. Wij hebben vanochtend ' +
          'een betaling van driehonderd euro gezien vanaf uw rekening naar een winkel in het ' +
          'buitenland. Omdat dat afwijkt van uw gewone patroon, hebben wij die betaling voorlopig ' +
          'tegengehouden en uw pas tijdelijk geblokkeerd. Was u dit zelf? Belt u ons dan even ' +
          'terug op het nummer achterop uw bankpas, dan zetten wij alles meteen weer open. Was u ' +
          'dit niet, dan hoeft u niets te doen; wij sturen u dan automatisch een nieuwe pas. Wij ' +
          'vragen u nooit om uw pincode, ook niet in dit gesprek.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom belt de bank?',
        options: [
          'Er was een ongewone betaling naar het buitenland.',
          'Zijn rekening staat rood.',
          'Zijn pas is verlopen.',
        ],
        correct: 0,
        explanation: 'De betaling week af van zijn gewone patroon.',
      },
      {
        prompt: 'Wat moet hij doen als hij de betaling zelf deed?',
        options: [
          'De bank terugbellen op het nummer achterop zijn pas.',
          'Niets doen.',
          'Naar het kantoor gaan.',
        ],
        correct: 0,
        explanation: '"Belt u ons dan even terug op het nummer achterop uw bankpas."',
      },
    ],
  },
  {
    title: 'Mededeling in het theater',
    section: 'mededeling',
    intro: intro('In het theater klinkt een mededeling voor de voorstelling.'),
    image: { slot: 'lu-9-7', query: 'theatre auditorium seats stage' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Dames en heren, welkom in ons theater. De voorstelling begint over vijf minuten. Wij ' +
          'vragen u vriendelijk om uw telefoon nu helemaal uit te zetten, dus niet alleen op stil; ' +
          'het licht van een scherm stoort de spelers en de mensen om u heen. Fotograferen en ' +
          'filmen zijn tijdens de voorstelling niet toegestaan. De pauze is na ongeveer een uur en ' +
          'duurt twintig minuten; u kunt dan iets drinken in de foyer. Komt u tijdens de ' +
          'voorstelling te laat terug, dan kunt u helaas pas bij een geschikt moment weer naar ' +
          'binnen. Wij wensen u een fijne avond.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat moet u met uw telefoon doen?',
        options: ['Helemaal uitzetten.', 'Op stil zetten.', 'Inleveren.'],
        correct: 0,
        explanation: '"uw telefoon nu helemaal uit te zetten, dus niet alleen op stil."',
      },
      {
        prompt: 'Hoe lang duurt de pauze?',
        options: ['Twintig minuten.', 'Vijf minuten.', 'Een uur.'],
        correct: 0,
        explanation: '"duurt twintig minuten."',
      },
      {
        prompt: 'Wat gebeurt er als u na de pauze te laat bent?',
        options: [
          'U kunt pas bij een geschikt moment naar binnen.',
          'U mag niet meer naar binnen.',
          'U krijgt uw geld terug.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk gezegd.',
      },
    ],
  },
  {
    title: 'Bij de kringloopwinkel',
    section: 'gesprek',
    intro: intro('Fatima wil een kast kopen in de kringloopwinkel.'),
    image: { slot: 'lu-9-8', query: 'second hand furniture shop wardrobe' },
    voice_cast: { A: 'man_older', B: 'woman_young' },
    lines: [
      ['A', 'Goedemiddag, kan ik u helpen?'],
      ['B', 'Ja, ik ben geïnteresseerd in die witte kast daar. Wat kost hij?'],
      ['A', 'Die staat voor vijfenveertig euro. Hij is stevig, alleen de deur klemt een beetje.'],
      ['B', 'Dat kan ik zelf wel bijstellen. Kunt u hem bezorgen?'],
      ['A', 'Binnen de stad wel, voor twintig euro. Wij bezorgen op dinsdag en donderdag.'],
      ['B', 'Donderdag zou fijn zijn. Kunnen jullie hem ook naar boven brengen?'],
      ['A', 'Tot de tweede verdieping doen we dat. Woont u hoger?'],
      ['B', 'Nee, ik woon op één. Dan is het goed.'],
      ['A', 'Prima, dan noteer ik uw adres en uw telefoonnummer.'],
    ],
    questions: [
      {
        prompt: 'Wat is er aan de hand met de kast?',
        options: ['De deur klemt een beetje.', 'Er zit een kras op.', 'Er ontbreekt een plank.'],
        correct: 0,
        explanation: '"alleen de deur klemt een beetje."',
      },
      {
        prompt: 'Wat kost het bezorgen?',
        options: ['€ 20.', '€ 45.', 'Niets.'],
        correct: 0,
        explanation: '"Binnen de stad wel, voor twintig euro."',
      },
    ],
  },
  {
    title: 'Instructie voor het ophalen van medicijnen',
    section: 'instructie',
    intro: intro('Bij de apotheek legt een medewerker de nieuwe automaat uit.'),
    image: { slot: 'lu-9-9', query: 'pharmacy pickup machine locker' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Wij hebben sinds kort een afhaalautomaat, en ik leg u even uit hoe die werkt. Als uw ' +
          'medicijnen klaarliggen, krijgt u van ons een sms met een code van zes cijfers. Die code ' +
          'toetst u in op het schermpje van de automaat, hier links naast de deur. Daarna gaat er ' +
          'een luikje open en pakt u uw zakje eruit. De automaat werkt dag en nacht, dus ook als ' +
          'wij gesloten zijn; dat is vooral handig in het weekend. Let op: medicijnen die koud ' +
          'bewaard moeten worden, gaan niet in de automaat; die haalt u gewoon bij de balie op ' +
          'tijdens openingstijden.',
      ],
    ],
    questions: [
      {
        prompt: 'Hoe krijgt u de code?',
        options: ['Per sms.', 'Per e-mail.', 'Bij de balie.'],
        correct: 0,
        explanation: '"krijgt u van ons een sms met een code van zes cijfers."',
      },
      {
        prompt: 'Wanneer werkt de automaat?',
        options: [
          'Dag en nacht.',
          'Alleen tijdens openingstijden.',
          'Alleen in het weekend.',
        ],
        correct: 0,
        explanation: '"De automaat werkt dag en nacht, dus ook als wij gesloten zijn."',
      },
      {
        prompt: 'Welke medicijnen gaan niet in de automaat?',
        options: [
          'Medicijnen die koud bewaard moeten worden.',
          'Medicijnen voor kinderen.',
          'Medicijnen zonder recept.',
        ],
        correct: 0,
        explanation: 'Die haalt u bij de balie op.',
      },
    ],
  },
  {
    title: 'Bericht van het buurthuis',
    section: 'mededeling',
    intro: intro('In het buurthuis klinkt een mededeling over de zomer.'),
    image: { slot: 'lu-9-10', query: 'community centre garden summer' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Beste bezoekers, even een mededeling over de zomerperiode. Van vijftien juli tot en met ' +
          'vijftien augustus draaien wij een zomerprogramma. Dat betekent dat de vaste cursussen ' +
          'stoppen, maar dat er elke dinsdag en donderdag activiteiten zijn: wandelen, samen ' +
          'koken en een keer per week een uitstapje. Aanmelden voor de uitstapjes is verplicht, ' +
          'want er kunnen maar twintig mensen mee met de bus. De lijst hangt bij de balie. Het ' +
          'buurthuis is in die periode alleen ’s ochtends open, van negen tot één. Vanaf zestien ' +
          'augustus zijn wij weer op de gewone tijden open. Fijne zomer alvast.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat gebeurt er met de vaste cursussen?',
        options: ['Die stoppen in die periode.', 'Die gaan gewoon door.', 'Die zijn alleen ’s middags.'],
        correct: 0,
        explanation: '"de vaste cursussen stoppen."',
      },
      {
        prompt: 'Waarom is aanmelden voor de uitstapjes verplicht?',
        options: [
          'Er kunnen maar twintig mensen mee met de bus.',
          'Het kost geld.',
          'Er zijn te weinig begeleiders.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk genoemd.',
      },
    ],
  },
];

/* ──────────────────────────── oefenexamen 10 ───────────────────────────── */

const EXAM_10 = [
  {
    title: 'Bij de woningcorporatie',
    section: 'gesprek',
    intro: intro('Mevrouw Mensah bespreekt haar woningaanvraag.'),
    image: { slot: 'lu-10-1', query: 'housing association office consultation' },
    voice_cast: { A: 'man_older', B: 'woman_young' },
    lines: [
      ['A', 'Goedemiddag, gaat u zitten. U had een vraag over uw inschrijving?'],
      ['B', 'Ja, ik sta nu vier jaar ingeschreven en ik krijg nooit een woning.'],
      ['A', 'Dat is vervelend. Op wat voor woningen reageert u meestal?'],
      ['B', 'Vooral op driekamerwoningen in het centrum.'],
      ['A', 'Daar is de wachttijd het langst, gemiddeld acht jaar.'],
      ['B', 'Acht jaar? Dat wist ik niet.'],
      ['A', 'In de wijk Noord gaat het veel sneller, ongeveer drie jaar. Heeft u daar al gekeken?'],
      ['B', 'Nee, eigenlijk niet. Is het daar prettig wonen?'],
      ['A', 'Zeker. Er is veel groen en er zijn twee scholen. Ik geef u een folder mee.'],
    ],
    questions: [
      {
        prompt: 'Waarom krijgt mevrouw Mensah geen woning?',
        options: [
          'Zij reageert op woningen met een lange wachttijd.',
          'Zij staat te kort ingeschreven.',
          'Haar inkomen is te hoog.',
        ],
        correct: 0,
        explanation: 'In het centrum is de wachttijd gemiddeld acht jaar.',
      },
      {
        prompt: 'Hoe lang is de wachttijd in de wijk Noord?',
        options: ['Ongeveer drie jaar.', 'Ongeveer acht jaar.', 'Ongeveer vier jaar.'],
        correct: 0,
        explanation: '"In de wijk Noord gaat het veel sneller, ongeveer drie jaar."',
      },
      {
        prompt: 'Wat krijgt zij mee?',
        options: ['Een folder.', 'Een sleutel.', 'Een formulier.'],
        correct: 0,
        explanation: '"Ik geef u een folder mee."',
      },
    ],
  },
  {
    title: 'Mededeling in het zwembad',
    section: 'mededeling',
    intro: intro('In het zwembad klinkt een mededeling.'),
    image: { slot: 'lu-10-2', query: 'swimming pool hall water lanes' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Beste bezoekers, mag ik uw aandacht voor de volgende mededeling? Wij sluiten het diepe ' +
          'bad vandaag om vier uur, een uur eerder dan normaal, omdat wij het water moeten ' +
          'behandelen. Het ondiepe bad en het peuterbad blijven wel gewoon open tot zes uur. ' +
          'Verder is er vanaf volgende week een nieuwe les: aquagym voor ouderen, op ' +
          'woensdagochtend van tien tot elf. U kunt zich daarvoor opgeven bij de kassa; er is plek ' +
          'voor vijftien deelnemers en de eerste les is gratis. En tot slot: vergeet u niet uw ' +
          'kluissleutel bij het verlaten van het gebouw in te leveren.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom sluit het diepe bad eerder?',
        options: [
          'Het water moet behandeld worden.',
          'Er is een wedstrijd.',
          'Er zijn te weinig badmeesters.',
        ],
        correct: 0,
        explanation: '"omdat wij het water moeten behandelen."',
      },
      {
        prompt: 'Wanneer is de nieuwe aquagymles?',
        options: [
          'Woensdagochtend van tien tot elf.',
          'Woensdagmiddag van vier tot vijf.',
          'Elke ochtend.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk gezegd.',
      },
      {
        prompt: 'Wat kost de eerste les?',
        options: ['Niets.', 'Vijftien euro.', 'Dat wordt niet gezegd.'],
        correct: 0,
        explanation: '"de eerste les is gratis."',
      },
    ],
  },
  {
    title: 'Telefoongesprek met de werkgever',
    section: 'telefoongesprek',
    intro: intro('Ibrahim belt zijn leidinggevende.'),
    image: { slot: 'lu-10-3', query: 'man calling phone outdoors work' },
    voice_cast: { A: 'woman_older', B: 'man_young' },
    lines: [
      ['A', 'Met Karin.'],
      ['B', 'Hoi Karin, met Ibrahim. Ik bel omdat ik vanochtend later ben.'],
      ['A', 'O, wat is er aan de hand?'],
      ['B', 'Er rijden geen treinen door een storing. Ik sta nu op het station te wachten.'],
      ['A', 'Vervelend. Weet je al hoe laat je er kunt zijn?'],
      ['B', 'Er rijden bussen, maar die doen er een uur langer over. Ik denk rond half elf.'],
      ['A', 'Dat is prima. Zal ik je afspraak van tien uur verzetten naar morgen?'],
      ['B', 'Graag. En wil je Marloes zeggen dat ik haar vanmiddag terugbel?'],
      ['A', 'Doe ik. Rustig aan, we redden het hier wel.'],
    ],
    questions: [
      {
        prompt: 'Waarom is Ibrahim later?',
        options: [
          'Er rijden geen treinen door een storing.',
          'Hij heeft zich verslapen.',
          'Hij is naar de dokter geweest.',
        ],
        correct: 0,
        explanation: '"Er rijden geen treinen door een storing."',
      },
      {
        prompt: 'Hoe laat denkt hij op het werk te zijn?',
        options: ['Rond half elf.', 'Rond tien uur.', 'Pas vanmiddag.'],
        correct: 0,
        explanation: '"Ik denk rond half elf."',
      },
      {
        prompt: 'Wat vraagt hij aan Karin?',
        options: [
          'Marloes te zeggen dat hij vanmiddag terugbelt.',
          'Zijn werk over te nemen.',
          'Hem op te halen.',
        ],
        correct: 0,
        explanation: 'Dat vraagt hij aan het eind.',
      },
    ],
  },
  {
    title: 'Uitleg over het inburgeringsexamen',
    section: 'instructie',
    intro: intro('Een begeleider legt uit hoe het inburgeringsexamen werkt.'),
    image: { slot: 'lu-10-4', query: 'adult education advisor meeting' },
    voice_cast: { A: 'woman_young' },
    lines: [
      [
        'A',
        'Ik leg u even uit hoe het examen is opgebouwd, dan weet u wat u kunt verwachten. Het ' +
          'bestaat uit verschillende onderdelen, en die doet u niet allemaal op dezelfde dag; u ' +
          'plant ze zelf in, in de volgorde die u wilt. Voor elk onderdeel meldt u zich apart aan ' +
          'via uw account, en u betaalt per onderdeel. Zakt u voor een onderdeel, dan hoeft u ' +
          'alleen dat onderdeel opnieuw te doen, niet alles. De uitslag krijgt u meestal binnen ' +
          'acht weken in uw account. Wacht niet te lang met aanmelden, want in drukke periodes ' +
          'kunnen de plekken vol zitten.',
      ],
    ],
    questions: [
      {
        prompt: 'Doet u alle onderdelen op één dag?',
        options: [
          'Nee, u plant ze zelf apart in.',
          'Ja, alles op één dag.',
          'Dat bepaalt DUO.',
        ],
        correct: 0,
        explanation: '"die doet u niet allemaal op dezelfde dag; u plant ze zelf in."',
      },
      {
        prompt: 'Wat gebeurt er als u voor één onderdeel zakt?',
        options: [
          'U doet alleen dat onderdeel opnieuw.',
          'U doet alles opnieuw.',
          'U moet een jaar wachten.',
        ],
        correct: 0,
        explanation: '"dan hoeft u alleen dat onderdeel opnieuw te doen, niet alles."',
      },
    ],
  },
  {
    title: 'In de bouwmarkt',
    section: 'gesprek',
    intro: intro('Meneer Kowalski vraagt hulp in de bouwmarkt.'),
    image: { slot: 'lu-10-5', query: 'hardware store aisle paint' },
    voice_cast: { A: 'man_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemiddag, zoekt u iets bepaalds?'],
      ['B', 'Ja, ik wil mijn slaapkamer schilderen, maar ik weet niet hoeveel verf ik nodig heb.'],
      ['A', 'Hoe groot is de kamer ongeveer?'],
      ['B', 'Ongeveer vier bij drie meter, en de muren zijn twee meter vijftig hoog.'],
      ['A', 'Dan heeft u ongeveer tien liter nodig voor twee lagen.'],
      ['B', 'En wat kost dat?'],
      ['A', 'Deze emmer van vijf liter is drieënveertig euro, dus twee emmers is zesentachtig.'],
      ['B', 'Heeft u ook goedkopere verf?'],
      ['A', 'Ja, maar daarvan heeft u vaak drie lagen nodig. Dan bent u uiteindelijk duurder uit.'],
    ],
    questions: [
      {
        prompt: 'Hoeveel verf heeft meneer Kowalski nodig?',
        options: ['Ongeveer tien liter.', 'Ongeveer vijf liter.', 'Ongeveer twintig liter.'],
        correct: 0,
        explanation: '"Dan heeft u ongeveer tien liter nodig voor twee lagen."',
      },
      {
        prompt: 'Waarom raadt de medewerker de goedkope verf af?',
        options: [
          'Daarvan zijn vaak drie lagen nodig.',
          'Die is niet op voorraad.',
          'Die is niet geschikt voor slaapkamers.',
        ],
        correct: 0,
        explanation: '"daarvan heeft u vaak drie lagen nodig. Dan bent u uiteindelijk duurder uit."',
      },
    ],
  },
  {
    title: 'Voicemail van de tandarts',
    section: 'telefoongesprek',
    intro: intro('Mevrouw Adebayo luistert een bericht af.'),
    image: { slot: 'lu-10-6', query: 'dentist reception waiting area' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Goedemiddag mevrouw Adebayo, u spreekt met tandartspraktijk Het Anker. Ik bel over de ' +
          'behandeling die wij vorige week hebben besproken. De kosten daarvan zijn hoger dan wij ' +
          'toen dachten, namelijk ongeveer vierhonderdtwintig euro in plaats van tweehonderd. Dat ' +
          'komt doordat er ook een kroon nodig is. Wij willen dat eerst met u overleggen voordat ' +
          'wij verdergaan, want dat is een flink verschil. Wilt u ons even terugbellen? Dan leggen ' +
          'wij precies uit wat er nodig is en welke mogelijkheden er zijn. Uw afspraak van volgende ' +
          'week donderdag laten wij voorlopig staan. Dank u wel.',
      ],
    ],
    questions: [
      {
        prompt: 'Waarom belt de praktijk?',
        options: [
          'De behandeling wordt duurder dan gedacht.',
          'De afspraak vervalt.',
          'De tandarts is ziek.',
        ],
        correct: 0,
        explanation: 'Ongeveer vierhonderdtwintig euro in plaats van tweehonderd.',
      },
      {
        prompt: 'Wat gebeurt er met de afspraak van donderdag?',
        options: [
          'Die blijft voorlopig staan.',
          'Die is geannuleerd.',
          'Die wordt verzet naar vrijdag.',
        ],
        correct: 0,
        explanation: '"Uw afspraak van volgende week donderdag laten wij voorlopig staan."',
      },
    ],
  },
  {
    title: 'Mededeling op de camping',
    section: 'mededeling',
    intro: intro('Op de camping klinkt een mededeling van de receptie.'),
    image: { slot: 'lu-10-7', query: 'campsite tents caravans field' },
    voice_cast: { A: 'man_older' },
    lines: [
      [
        'A',
        'Goedemorgen allemaal, een mededeling van de receptie. Vanavond wordt er onweer verwacht, ' +
          'met harde windstoten tussen acht en elf uur. Wij vragen u daarom om uw voortent goed ' +
          'vast te zetten en losse spullen zoals stoelen, tafels en parasols op te ruimen. De ' +
          'zwemplas sluit vanmiddag om vijf uur en het animatieprogramma van vanavond gaat niet ' +
          'door. In het restaurant is wel gewoon plek en wij zetten daar een film op voor de ' +
          'kinderen. Bij problemen kunt u ons dag en nacht bereiken via het nummer op uw ' +
          'campingkaart. Blijf bij onweer alstublieft binnen.',
      ],
    ],
    questions: [
      {
        prompt: 'Wat wordt er vanavond verwacht?',
        options: ['Onweer met harde wind.', 'Sneeuw.', 'Mist.'],
        correct: 0,
        explanation: '"Vanavond wordt er onweer verwacht, met harde windstoten."',
      },
      {
        prompt: 'Wat gaat er niet door?',
        options: [
          'Het animatieprogramma.',
          'Het eten in het restaurant.',
          'De film voor de kinderen.',
        ],
        correct: 0,
        explanation: '"het animatieprogramma van vanavond gaat niet door."',
      },
      {
        prompt: 'Hoe laat sluit de zwemplas?',
        options: ['Om vijf uur.', 'Om acht uur.', 'Om elf uur.'],
        correct: 0,
        explanation: '"De zwemplas sluit vanmiddag om vijf uur."',
      },
    ],
  },
  {
    title: 'Bij het inloopspreekuur',
    section: 'gesprek',
    intro: intro('Meneer Sow komt bij het inloopspreekuur van het wijkteam.'),
    image: { slot: 'lu-10-8', query: 'social services meeting advisor client' },
    voice_cast: { A: 'woman_young', B: 'man_older' },
    lines: [
      ['A', 'Goedemiddag, komt u binnen. Waar kan ik u mee helpen?'],
      ['B', 'Ik heb een brief van de Belastingdienst gekregen en ik begrijp hem niet.'],
      ['A', 'Mag ik hem even zien? … Ah, dit gaat over uw huurtoeslag.'],
      ['B', 'Is er iets mis?'],
      ['A', 'Zij vragen uw inkomen van vorig jaar. Als u dat niet doorgeeft, stopt de toeslag.'],
      ['B', 'Hoe geef ik dat door?'],
      ['A', 'Online met uw DigiD. Heeft u die bij u? Dan doen wij het nu meteen samen.'],
      ['B', 'Ik heb hem thuis liggen. Ik kan hem vanmiddag halen.'],
      ['A', 'Prima. Wij zijn er tot vier uur; komt u gerust terug.'],
    ],
    questions: [
      {
        prompt: 'Waar gaat de brief over?',
        options: ['Zijn huurtoeslag.', 'Een boete.', 'Zijn zorgverzekering.'],
        correct: 0,
        explanation: '"dit gaat over uw huurtoeslag."',
      },
      {
        prompt: 'Wat gebeurt er als hij niets doorgeeft?',
        options: ['De toeslag stopt.', 'Hij krijgt een boete.', 'Er gebeurt niets.'],
        correct: 0,
        explanation: '"Als u dat niet doorgeeft, stopt de toeslag."',
      },
    ],
  },
  {
    title: 'Instructie bij de bibliotheekautomaat',
    section: 'instructie',
    intro: intro('Een medewerker legt uit hoe de leenautomaat werkt.'),
    image: { slot: 'lu-10-9', query: 'library self service machine books' },
    voice_cast: { A: 'man_young' },
    lines: [
      [
        'A',
        'Ik laat u even zien hoe u zelf boeken leent, dat is zo gebeurd. U legt uw pas op het ' +
          'ronde vlak rechtsonder op de automaat; het scherm springt dan vanzelf aan. Daarna legt ' +
          'u de boeken op de plaat ervoor, en dat mag gewoon in één stapel, tot vijf tegelijk. Op ' +
          'het scherm verschijnen de titels; controleert u even of alles erbij staat. Druk daarna ' +
          'op "klaar" en u kunt kiezen: een bonnetje printen of het per e-mail ontvangen. Ik raad ' +
          'de e-mail aan, want daar staat ook in wanneer u de boeken terug moet brengen. Werkt de ' +
          'automaat niet, kom dan gerust even naar de balie.',
      ],
    ],
    questions: [
      {
        prompt: 'Waar legt u uw pas?',
        options: [
          'Op het ronde vlak rechtsonder.',
          'Op de plaat voor de boeken.',
          'In de gleuf naast het scherm.',
        ],
        correct: 0,
        explanation: '"U legt uw pas op het ronde vlak rechtsonder op de automaat."',
      },
      {
        prompt: 'Hoeveel boeken kunt u tegelijk op de plaat leggen?',
        options: ['Vijf.', 'Eén.', 'Tien.'],
        correct: 0,
        explanation: '"tot vijf tegelijk."',
      },
      {
        prompt: 'Waarom raadt hij de e-mail aan?',
        options: [
          'Daar staat in wanneer de boeken terug moeten.',
          'Dat is goedkoper.',
          'Het bonnetje raakt vaak zoek.',
        ],
        correct: 0,
        explanation: '"want daar staat ook in wanneer u de boeken terug moet brengen."',
      },
    ],
  },
  {
    title: 'Bericht van de school over de staking',
    section: 'mededeling',
    intro: intro('Ouders horen een bericht van de school.'),
    image: { slot: 'lu-10-10', query: 'empty school classroom chairs' },
    voice_cast: { A: 'woman_older' },
    lines: [
      [
        'A',
        'Beste ouders, een belangrijk bericht over aanstaande dinsdag. Een groot deel van ons ' +
          'team doet die dag mee aan een landelijke staking. Daardoor kunnen wij op dinsdag geen ' +
          'les geven aan de groepen drie tot en met acht; die kinderen zijn dus vrij. De groepen ' +
          'een en twee gaan wel gewoon naar school, want die leerkrachten staken niet. Kunt u geen ' +
          'opvang regelen en is dat echt een probleem? Neemt u dan vóór maandag twaalf uur contact ' +
          'op met de directeur; wij zoeken dan samen een oplossing. Woensdag zijn wij weer volledig ' +
          'open. Dank u wel voor uw begrip.',
      ],
    ],
    questions: [
      {
        prompt: 'Welke groepen zijn dinsdag vrij?',
        options: [
          'De groepen drie tot en met acht.',
          'Alle groepen.',
          'De groepen een en twee.',
        ],
        correct: 0,
        explanation: 'Groepen een en twee gaan wel gewoon naar school.',
      },
      {
        prompt: 'Wat moet u doen als u geen opvang kunt regelen?',
        options: [
          'Vóór maandag twaalf uur contact opnemen met de directeur.',
          'Uw kind toch naar school brengen.',
          'Niets, er is altijd opvang.',
        ],
        correct: 0,
        explanation: 'Dat wordt letterlijk gevraagd.',
      },
    ],
  },
];

export const LUISTEREN_EXAMS = [
  EXAM_1, EXAM_2, EXAM_3, EXAM_4, EXAM_5,
  EXAM_6, EXAM_7, EXAM_8, EXAM_9, EXAM_10,
];
