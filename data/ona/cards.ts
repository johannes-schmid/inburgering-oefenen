/**
 * De acht resultaatkaarten van ONA: uitleg, vragen en bewijzen.
 *
 * **Dit is inhoud van de docent, en hij staat op `concept` tot Amber hem heeft nagekeken.** De
 * module gaat pas live (`isOnaLive()` in `lib/ona/access.ts`) als álle acht kaarten op
 * `reviewed` staan — dezelfde regel als bij de gidsen: niets publiceert zonder haar review.
 *
 * ## Waar het vandaan komt
 * De volgorde en het onderwerp van de vragen volgen de officiële kaarten van DUO
 * (inburgeren.nl/images/resultaatkaart-<n>-….pdf, geraadpleegd 13-10-2026) en de toelichting
 * (inburgeren.nl/images/ona-toelichting.pdf). Die zijn "eigendom van ministerie van SZW": de
 * vragen hier zijn **in eigen woorden**, en de kandidaat zet zijn antwoorden zelf over op het
 * officiële formulier. We kopiëren het formulier niet en bieden het niet als download aan.
 *
 * ## Wat hier bewust níet staat
 * Geen voorbeeldantwoorden. DUO vraagt in het eindgesprek *waarom* je iets schreef; een
 * voorbeeld dat je kunt overnemen is daar precies de verkeerde hulp, en een ingevuld portfolio
 * dat als het jouwe kan worden ingeleverd is fraude. De `hint` helpt denken, nooit formuleren.
 *
 * ## Bewijzen
 * Alleen kaart 4 (twee vacatures) en kaart 7 (twee sollicitatieformulieren, een brief, een cv)
 * hebben bewijzen die DUO altijd eist. Het bewijs bij kaart 1 hangt af van je situatie, dus
 * `required: false`. DUO controleert "alle verplichte bewijzen" — `required` is precies die lijst.
 */

export type OnaPrompt = {
  /** Stabiele sleutel in `ona_card_entries.answers`. Nooit hernoemen zodra er antwoorden zijn. */
  id: string;
  label: string;
  hint?: string;
};

export type OnaEvidence = {
  id: string;
  label: string;
  /** Hoort bij de drie dingen die DUO controleert. */
  required: boolean;
};

export type OnaCard = {
  number: number;
  slug: string;
  /** DUO's eigen naam voor de kaart — die staat ook op het formulier. */
  title: string;
  /** Eén zin: wat laat je met deze kaart zien. */
  goal: string;
  /** De uitleg van de docent, in alinea's. A2-niveau, je-vorm. */
  uitleg: string[];
  prompts: OnaPrompt[];
  evidence: OnaEvidence[];
  duoPdfUrl: string;
  /** `reviewed` alleen na Amber's review. */
  status: 'concept' | 'reviewed';
};

const PDF = (slug: string) => `https://www.inburgeren.nl/images/${slug}.pdf`;

export const ONA_TOELICHTING_URL = 'https://www.inburgeren.nl/images/ona-toelichting.pdf';
export const ONA_INFO_URL = 'https://www.inburgeren.nl/examen-doen/inhoud-kennisexamens.jsp';
export const ONA_VRIJSTELLING_URL =
  'https://www.inburgeren.nl/minder-of-geen-examens/vrijstelling-orientatie-op-de-nederlandse-arbeidsmarkt.jsp';

export const ONA_CARDS: OnaCard[] = [
  {
    number: 1,
    slug: 'beroepenorientatie',
    title: 'Beroepenoriëntatie',
    goal: 'Je kiest een beroep dat bij je past, en je weet wat je nodig hebt om het te doen.',
    uitleg: [
      'Je begint met drie beroepen die je in Nederland zou willen doen. Daaruit kies je er één. Dat is je gewenste beroep. Alle acht kaarten gaan over dat ene beroep.',
      'Kies een beroep met betaald werk. Vrijwilligerswerk mag niet. Een sector, zoals "de zorg", is ook geen beroep. "Doktersassistent" wel.',
      'Heb je een diploma uit je eigen land? Je kunt het gratis laten waarderen bij IDW. Dan weet je wat het waard is in Nederland.',
    ],
    prompts: [
      { id: 'drie-beroepen', label: 'Welke drie beroepen zou je in Nederland willen doen?', hint: 'Schrijf de naam van het beroep. Weet je de naam niet? Beschrijf het werk.' },
      { id: 'branches', label: 'Kun je dit beroep in veel branches doen, of maar in één? Welke?', hint: 'Een schoonmaker werkt overal. Een verpleegkundige alleen in de zorg.' },
      { id: 'diploma-ervaring', label: 'Heb je een diploma, een diplomawaardering of werkervaring voor dit beroep? Wat kun je laten zien?', hint: 'Heb je niets van dit alles? Schrijf dat dan ook op. Dat mag.' },
    ],
    evidence: [
      { id: 'diploma', label: 'Kopie van je diploma, diplomawaardering of ION (als je die hebt)', required: false },
    ],
    duoPdfUrl: PDF('resultaatkaart-1-beroepenorientatie'),
    status: 'concept',
  },
  {
    number: 2,
    slug: 'realistisch-beroepsbeeld',
    title: 'Realistisch beroepsbeeld',
    goal: 'Je weet hoe dit beroep in Nederland echt is, en of het bij je past.',
    uitleg: [
      'Een beroep kan in Nederland anders zijn dan in je eigen land. Op deze kaart laat je zien dat je weet hoe het hier gaat.',
      'Zoek het op. Lees vacatures, kijk op werk.nl of vraag het aan iemand die dit werk doet. Schrijf daarna op wat past bij jou en wat niet.',
    ],
    prompts: [
      { id: 'taken', label: 'Welke taken doe je in dit beroep?', hint: 'Noem de belangrijkste taken. Wat doe je op een gewone werkdag?' },
      { id: 'werkomstandigheden', label: 'Hoe is het werk? Denk aan werktijden, team of alleen, binnen of buiten, kleding. Welke dingen passen bij jou, en welke niet?' },
      { id: 'eisen', label: 'Welke speciale eisen zijn er? Bijvoorbeeld een rijbewijs of sterk zijn. Heb je dat al, of moet je er nog aan werken?' },
      { id: 'omstandigheden', label: 'Past het werk bij je thuissituatie, je gezondheid en waar je woont? Kun je iets veranderen als het niet past?' },
    ],
    evidence: [],
    duoPdfUrl: PDF('resultaatkaart-2-realistisch-beroepsbeeld'),
    status: 'concept',
  },
  {
    number: 3,
    slug: 'je-eigenschappen-kennen',
    title: 'Je eigenschappen kennen',
    goal: 'Je weet welke eigenschappen belangrijk zijn op het werk, en welke je zelf hebt.',
    uitleg: [
      'Een eigenschap gaat over hoe je bent. Bijvoorbeeld vriendelijk of precies. Een competentie kun je leren. Bijvoorbeeld goed samenwerken.',
      'Eerst noem je drie dingen die voor iedereen belangrijk zijn op het werk in Nederland. Daarna vier dingen die belangrijk zijn voor jouw beroep. Geef bij die vier een voorbeeld uit het werk.',
    ],
    prompts: [
      { id: 'algemeen', label: 'Noem drie eigenschappen die voor iedereen belangrijk zijn op het werk in Nederland. Heb je ze zelf?', hint: 'Bijvoorbeeld: op tijd komen. Zeg eerlijk of je het hebt.' },
      { id: 'beroep', label: 'Noem vier eigenschappen die belangrijk zijn voor jouw beroep. Waarom zijn ze belangrijk? Geef een voorbeeld. Heb je ze zelf?' },
    ],
    evidence: [],
    duoPdfUrl: PDF('resultaatkaart-3-je-eigenschappen-kennen'),
    status: 'concept',
  },
  {
    number: 4,
    slug: 'beroepskansen',
    title: 'Beroepskansen',
    goal: 'Je weet waar je werk vindt in dit beroep, en of er genoeg werk is.',
    uitleg: [
      'Je zoekt vacatures voor betaald werk in je gewenste beroep. Je telt hoeveel je er vindt. Zo zie je of de kans op werk groot of klein is.',
      'Twee vacatures bewaar je. Die gaan als bewijs mee in je portfolio. Kijk hier alleen naar het werk zelf, nog niet naar je eigen diploma.',
    ],
    prompts: [
      { id: 'plekken', label: 'Op welke drie plekken vind je vacatures voor dit beroep?', hint: 'Een website, een uitzendbureau, een bedrijf zelf, iemand die je kent.' },
      { id: 'aantal-kans', label: 'Hoeveel vacatures vond je? Is de kans op werk groot, redelijk of klein?' },
      { id: 'twee-vacatures', label: 'Beschrijf twee vacatures: datum, beroep, bedrijf en plaats. Passen ze bij jou? Waarom wel of niet?' },
      { id: 'verder', label: 'Hoe ga je nu verder? Ga je door met dit beroep, of doe je eerst iets anders? Waarom?' },
    ],
    evidence: [
      { id: 'vacatures', label: 'Twee vacatures voor betaald werk in je gewenste beroep', required: true },
    ],
    duoPdfUrl: PDF('resultaatkaart-4-beroepskansen'),
    status: 'concept',
  },
  {
    number: 5,
    slug: 'beroepscompetenties',
    title: 'Beroepscompetenties',
    goal: 'Je weet welke opleiding of cursus je nodig hebt, en hoe je die gaat doen.',
    uitleg: [
      'Zoek een opleiding of cursus die bij het beroep past. En bij jouw leven: overdag of in de avond, op school of thuis. Een taalcursus telt hier niet als opleiding.',
      'Heb je al een diploma voor dit beroep? Zoek dan een cursus om nog beter te worden. Schrijf ook op wat het kost, en hoe goed je Nederlands moet zijn.',
    ],
    prompts: [
      { id: 'soort', label: 'Wat voor opleiding of cursus past bij jou? Kort of lang, overdag of in de avond, op school of thuis?' },
      { id: 'opleiding', label: 'Welke opleiding of cursus kies je? Schrijf de naam, de school, hoe lang hij duurt en wanneer de lessen zijn.' },
      { id: 'toelating', label: 'Heb je een diploma nodig om te beginnen? Welk? Heb je dat?' },
      { id: 'geld', label: 'Wat kost het? Hoe betaal je het? En hoe betaal je de huur en het eten als je de opleiding doet?' },
      { id: 'taal', label: 'Welk taalniveau heb je nodig? Heb je dat al? Wat moet je in het Nederlands kunnen in dit beroep, en kun je dat?' },
      { id: 'taalplan', label: 'Moet je nog aan je Nederlands werken voor dit beroep? Hoe, waar en wanneer?' },
    ],
    evidence: [],
    duoPdfUrl: PDF('resultaatkaart-5-beroepscompetenties'),
    status: 'concept',
  },
  {
    number: 6,
    slug: 'netwerk-opbouwen',
    title: 'Netwerk opbouwen',
    goal: 'Je weet wie je kan helpen aan werk, en hoe je meer mensen leert kennen.',
    uitleg: [
      'Je netwerk zijn alle mensen die je kent. Familie, buren, collega\'s, andere ouders op school. Sommige van hen kunnen je helpen aan werk of een stage.',
      'Schrijf de namen op van minstens twee mensen die je kunnen helpen. Schrijf over echte mensen. In het eindgesprek vraagt DUO wat je van hen hebt geleerd.',
    ],
    prompts: [
      { id: 'wie', label: 'Wie zitten er in je netwerk?', hint: 'Familie, vrienden, buren, collega\'s, mensen van de sportclub of de moskee of kerk.' },
      { id: 'helpers', label: 'Wie in je netwerk kan je helpen aan werk of een stage in je beroep? Schrijf minstens twee namen, en hoe ze je kunnen helpen.' },
      { id: 'groter', label: 'Hoe ga je meer mensen leren kennen die je kunnen helpen? En wanneer begin je?' },
    ],
    evidence: [],
    duoPdfUrl: PDF('resultaatkaart-6-netwerk-opbouwen'),
    status: 'concept',
  },
  {
    number: 7,
    slug: 'werk-vinden',
    title: 'Werk vinden',
    goal: 'Je weet hoe je solliciteert in Nederland, en je hebt een brief en een cv.',
    uitleg: [
      'Dit is de grootste kaart. Je laat zien hoe je werk zoekt, en je maakt vier bewijzen: twee ingevulde sollicitatieformulieren, één sollicitatiebrief en één cv.',
      'De brief schrijf je zoals dat in Nederland hoort: datum en plaats, een aanhef met de achternaam, "u" tegen de lezer, wat je wilt en waarom, een groet en je adres.',
      'Het cv heeft je naam, adres, woonplaats, geboortejaar, je opleidingen en je werkervaring. DUO kijkt naar deze vier bewijzen. Zijn ze niet goed? Dan krijg je je portfolio terug.',
    ],
    prompts: [
      { id: 'manieren', label: 'Op welke manieren kun je werk vinden in je beroep?', hint: 'Vacatures, een open sollicitatie, via iemand die je kent, een uitzendbureau.' },
      { id: 'werkervaring-belang', label: 'Is een stage, werkervaringsplaats of vrijwilligerswerk belangrijk voor jou? Waarom wel of niet?' },
      { id: 'werkervaring-nu', label: 'Heb je nu werk, een stage of vrijwilligerswerk? Waar? Zo niet: ga je het zoeken, en hoe?' },
      { id: 'redenen', label: 'Noem drie redenen waarom werkgevers een sollicitatiebrief of formulier vragen.' },
      { id: 'hulp', label: 'Waar vind je hulp bij het schrijven van een sollicitatiebrief?' },
      { id: 'gesprek', label: 'Waar ben je goed in tijdens een sollicitatiegesprek? Wat wil je beter doen, en hoe ga je dat oefenen?' },
    ],
    evidence: [
      { id: 'formulieren', label: 'Twee sollicitatieformulieren, ingevuld met je eigen gegevens', required: true },
      { id: 'brief', label: 'Eén sollicitatiebrief (een echte brief, geen e-mail)', required: true },
      { id: 'cv', label: 'Eén cv', required: true },
    ],
    duoPdfUrl: PDF('resultaatkaart-7-werk-vinden'),
    status: 'concept',
  },
  {
    number: 8,
    slug: 'werkcultuur',
    title: 'Werkcultuur',
    goal: 'Je weet hoe werken in Nederland anders is dan in je land van herkomst.',
    uitleg: [
      'Werken gaat niet overal op dezelfde manier. Denk aan op tijd komen, hoe je met je baas praat, pauzes, of hoe je zegt dat je ziek bent.',
      'Noem drie verschillen die horen bij jouw beroep. Schrijf bij elk verschil hoe het in je eigen land gaat, en hoe in Nederland.',
    ],
    prompts: [
      { id: 'verschil-1', label: 'Verschil 1: hoe gaat het in je land van herkomst, en hoe in Nederland?' },
      { id: 'verschil-2', label: 'Verschil 2: hoe gaat het in je land van herkomst, en hoe in Nederland?' },
      { id: 'verschil-3', label: 'Verschil 3: hoe gaat het in je land van herkomst, en hoe in Nederland?' },
    ],
    evidence: [],
    duoPdfUrl: PDF('resultaatkaart-8-werkcultuur'),
    status: 'concept',
  },
];

export const ONA_CARD_COUNT = ONA_CARDS.length;

export function getOnaCard(n: number): OnaCard | undefined {
  return ONA_CARDS.find(c => c.number === n);
}

/** De kaart die zonder module open staat — net als "examen 1 gratis" bij de andere modules. */
export const ONA_FREE_CARD = 1;
