/**
 * De cursusopbouw per (niveau, onderdeel). Met de hand vastgelegd, in git.
 *
 * ── DE VIJF BLOKKEN ──────────────────────────────────────────────────────────
 * Elke cursus heeft dezelfde vijf blokken, en dat is de structuur uit de mockup én uit de
 * concurrent die de eigenaar aanleverde (A Vocabulaire · B Grammatica · C Lesson videos ·
 * D Exam practice · E Test yourself):
 *
 *   A Woorden          de woordenschat, receptief en productief gescheiden
 *   B (de mechaniek)   bij Lezen de grammatica; bij de andere drie de vaardigheid zelf
 *   C Examenuitleg     hoe dít onderdeel werkt — per tekstsoort of soort opgave
 *   D Examentraining   gemengd oefenen in examenvorm, korter dan een heel examen
 *   E Toets jezelf     de can-do-lijst en een diagnose die concepten benoemt
 *
 * ── BLOK B IS PER ONDERDEEL IETS ANDERS, EN DAT IS DE HELE KEUZE ─────────────
 * Bij **Lezen** is blok B de grammatica: 28 lessen die `conceptsFor('lezen')` uit
 * `concepts-a2.mjs` leest, zodat het perfectum één keer in de database staat.
 *
 * Bij **Luisteren, Schrijven en Spreken wordt die grammatica niet opnieuw onderwezen**
 * (besluit van de eigenaar, 08-09). De 28 regels staan in blok B van Lezen en worden
 * daarvandaan gelinkt; ze drie keer herschrijven levert dezelfde regel in een ander jasje op,
 * en `concept_onderdelen` koppelt elk concept toch al aan alle onderdelen waar het nodig is —
 * dus de remediatie vanuit een foute examenvraag vindt hem nog steeds.
 *
 * In plaats daarvan traint blok B bij die drie **de vaardigheid die het examen meet**:
 *
 *   Luisteren   klank en tempo — getallen, verkorte spraak, klanken die op elkaar lijken.
 *               Wat een kandidaat laat zakken is bijna nooit woordenschat; het is dat de
 *               spraak te snel gaat en dat de vraag andere woorden gebruikt dan het fragment.
 *   Schrijven   de fouten die je maakt zodra je zelf de zin moet produceren: woordorde,
 *               werkwoordspelling, register volhouden. Geen tweede grammaticacursus — een
 *               *productieve* selectie eruit.
 *   Spreken     uitspraak. Zes lessen, elk met de vierstapscyclus: regel, naspreken, jezelf
 *               terughoren, dictee. Dit is het blok waarvoor `naspreken` bestaat.
 *
 * ── BLOK C EN D: WAT WAAR VANDAAN KOMT ──────────────────────────────────────
 * Blok C en D zijn de examenvoorbereiding, per onderdeel. Bij Lezen en Luisteren kunnen ze de
 * tekstsoorten **uit de database halen** (`sections`), en dan komt de titel uit
 * `sections.name_nl` zodat een docent die "Kort artikel" in "Artikel" verandert één plek
 * bijwerkt. Bij Schrijven en Spreken bestaan die rijen niet — daar is de as
 * `task_categories`, en de lessen dragen hun titel zelf.
 *
 * Twee lessen van Luisteren wijzen naar dezelfde `section` (een omroepbericht en het nieuws
 * zijn beide een `mededeling`), dus ook daar staat de titel in dit bestand. De `section` blijft
 * eraan hangen omdat `lesson_items.section_id` de brug is naar de examenvragen van diezelfde
 * tekstsoort.
 *
 * ── DE WOORDTHEMA'S ──────────────────────────────────────────────────────────
 * De thema's van blok A zijn per onderdeel anders, en dat is het gevolg van de sleutel:
 * `lesson_words` is unique op `(level, onderdeel, dutch)`, dus elke cursus heeft zijn eigen
 * woordenschat en kan hem op zijn eigen examen richten. Bij Luisteren zijn dat de situaties
 * waarin je iets hóórt (een omroep, een keuzemenu) en staan de woorden op `receptief`; bij
 * Schrijven en Spreken zijn het de dingen die je zelf moet kunnen zeggen of schrijven, en
 * staan ze op `productief`.
 *
 * Ze zijn met opzet breder dan de tekstsoorten: een advertentie kan over een fiets of over een
 * huis gaan, en het woord hoort bij het onderwerp, niet bij de vorm.
 */

import { conceptsFor, rulesHomeConcepts } from './concepts-a2.mjs';

/**
 * De thema's van blok A, per onderdeel. `words` is het streefaantal per thema.
 *
 * Lezen staat er als eerste en is onveranderd — die 126 woorden staan al in de database en een
 * gewijzigd thema zou de `woordenlijst`-items van blok A naar een leeg thema laten wijzen.
 */
export const WORD_THEMES_BY_ONDERDEEL = {
  lezen: [
    { slug: 'wonen',       name: 'Wonen en de buurt',        words: 24 },
    { slug: 'gezondheid',  name: 'Gezondheid en de dokter',  words: 24 },
    { slug: 'werk',        name: 'Werk en solliciteren',     words: 24 },
    { slug: 'gemeente',    name: 'Gemeente, post en geld',   words: 24 },
    { slug: 'winkelen',    name: 'Winkelen en bestellen',    words: 20 },
    { slug: 'school',      name: 'School en kinderen',       words: 20 },
  ],
  /* Luisteren: de situaties waarin je Nederlands hóórt, niet leest. Een omroepbericht en een
     keuzemenu hebben hun eigen vocabulaire ("het perron", "toets 1"), en dat staat in geen
     enkele leestekst. */
  luisteren: [
    { slug: 'omroep-en-reizen',     name: 'Omroep, station en reizen',   words: 24 },
    { slug: 'telefoon-en-afspraak', name: 'Bellen en een afspraak maken', words: 22 },
    { slug: 'werk-en-overleg',      name: 'Op het werk en in overleg',   words: 22 },
    { slug: 'winkel-en-service',    name: 'Winkel, bezorging en klacht', words: 22 },
    { slug: 'gemeente-en-zorg',     name: 'Loket, huisarts en zorg',     words: 22 },
  ],
  /* Schrijven: geen thema's maar registers. Wat een kandidaat mist is niet het woord voor
     "fiets" — het is de aanhef, het slot en de vaste formule van een verzoek. */
  schrijven: [
    { slug: 'aanhef-en-slot',      name: 'Aanhef en slot',              words: 22 },
    { slug: 'vragen-en-verzoeken', name: 'Vragen en verzoeken',         words: 22 },
    { slug: 'afzeggen-uitnodigen', name: 'Afzeggen en uitnodigen',      words: 22 },
    { slug: 'formulierwoorden',    name: 'De woorden op een formulier', words: 22 },
  ],
  /* Spreken: gesorteerd op taalhandeling en niet op onderwerp, want zo staat het ook in de
     examenopdracht ("reageer op deze situatie"). */
  spreken: [
    { slug: 'voorstellen-en-vragen', name: 'Jezelf voorstellen en vragen stellen', words: 22 },
    { slug: 'mening-geven',          name: 'Je mening geven',                      words: 22 },
    { slug: 'afspraak-maken',        name: 'Een afspraak maken',                   words: 22 },
    { slug: 'excuses-en-reageren',   name: 'Sorry zeggen en reageren',             words: 22 },
    { slug: 'weg-en-plaats',         name: 'De weg vragen en wijzen',              words: 22 },
  ],
};

/** De thema's van dit onderdeel. Onbekend onderdeel is een harde fout, geen lege lijst. */
export function wordThemes(onderdeel) {
  const themes = WORD_THEMES_BY_ONDERDEEL[onderdeel];
  if (!themes) throw new Error(`geen woordthema's voor onderdeel "${onderdeel}"`);
  return themes;
}

/**
 * De tekstsoorten van blok C bij Lezen, op `sections.slug`.
 *
 * Alleen de slugs: de titel komt uit de database. Een slug die niet in `sections` bestaat is
 * een harde fout in de seeder — stil overslaan zou een blok C opleveren met een gat dat
 * niemand ziet.
 */
export const BLOCK_C_SECTIONS = {
  lezen: ['advertentie', 'brief', 'formulier-lezen', 'folder', 'regels', 'artikel'],
};

/**
 * De strategie-concepten: examenvakmanschap, per onderdeel exclusief.
 *
 * Dit is het antwoord op "hoe bereid je iemand voor die alleen Lezen doet". Ze staan hier en
 * niet in `concepts-a2.mjs` omdat ze per onderdeel bestaan en niet gedeeld worden — hun
 * `concept_onderdelen` heeft precies één rij, waar een grammaticaconcept er vier heeft.
 *
 * Bij Luisteren, Schrijven en Spreken dragen ze méér dan bij Lezen: daar zijn ze óók de
 * inhoud van blok B, omdat de vaardigheidsmechaniek van die onderdelen geen grammaticaconcept
 * is maar een aanpak. Een klank is geen regel die je kunt fout doen op papier.
 */
export const STRATEGY_CONCEPTS = {
  lezen: [
    {
      slug: 'lezen-zoekend-lezen', name_nl: 'Zoekend lezen',
      one_liner: 'Je hoeft niet elk woord te lezen. Zoek alleen wat de vraag vraagt.',
      example_html: 'Vraag: hoe lang is de lift kapot? → zoek de <mark>dagen</mark>, niet de rest.',
    },
    {
      slug: 'lezen-afzender-datum-actie', name_nl: 'Afzender, datum, actie',
      one_liner: 'Bij een brief vraagt het examen bijna altijd naar deze drie. Zoek ze in vaste volgorde.',
      example_html: 'Van: <mark>de gemeente</mark> · Datum: <mark>3 maart</mark> · U moet: <mark>bellen</mark>',
    },
    {
      slug: 'lezen-vraag-eerst', name_nl: 'Lees eerst de vraag',
      one_liner: 'Weet wat je zoekt voordat je begint. Dan lees je de tekst één keer.',
      example_html: 'Eerst de vraag, dan de tekst — <mark>niet</mark> andersom.',
    },
    {
      slug: 'lezen-signaalwoorden', name_nl: 'Signaalwoorden',
      one_liner: 'maar, behalve, alleen — kleine woorden die het antwoord omdraaien.',
      example_html: 'Open op zaterdag, <mark>behalve</mark> in de vakantie.',
    },
    {
      slug: 'lezen-woord-raden', name_nl: 'Een woord raden uit de zin',
      one_liner: 'Ken je het woord niet? De rest van de zin verklapt vaak wat het betekent.',
      example_html: 'Het is <mark>ondermaats</mark>: niet goed genoeg.',
    },
  ],

  /* ── Luisteren: vijf over klank en tempo (blok B), acht over de vraag (blok C) ───────── */
  luisteren: [
    {
      slug: 'luisteren-getallen-en-tijden', name_nl: 'Getallen, tijden en prijzen',
      one_liner: 'Naar dit detail wordt het vaakst gevraagd. Oefen tot je het in één keer hoort.',
      example_html: 'De trein vertrekt om <mark>zeven over half acht</mark> van spoor 4.',
    },
    {
      slug: 'luisteren-verkorte-spraak', name_nl: 'Als het snel gaat',
      one_liner: "Nederlanders zeggen 'k heb en d'r. Je hoort niet elk woord apart.",
      example_html: '<mark>Kheb</mark> het al gedaan — dat is: ik heb het al gedaan.',
    },
    {
      slug: 'luisteren-klanken-die-lijken', name_nl: 'Klanken die op elkaar lijken',
      one_liner: 'bank of bang, vrouw of vrouwen. Eén klank verschil, een ander antwoord.',
      example_html: 'Ik ga naar de <mark>bank</mark> — niet: ik ben <mark>bang</mark>.',
    },
    {
      slug: 'luisteren-klemtoon-en-nadruk', name_nl: 'Waar de nadruk ligt',
      one_liner: 'Het woord dat harder wordt gezegd, is bijna altijd het antwoord.',
      example_html: 'De les is <mark>niet</mark> op maandag, maar op dinsdag.',
    },
    {
      slug: 'luisteren-signaalwoorden-horen', name_nl: 'Signaalwoorden horen',
      one_liner: 'maar, dus, eerst, daarna — ze zeggen hoe de stukken bij elkaar horen.',
      example_html: 'Ik kom graag, <mark>maar</mark> pas na zes uur.',
    },
    {
      slug: 'luisteren-voorspellen', name_nl: 'Voorspellen wat je gaat horen',
      one_liner: 'Kijk naar de vraag en bedenk het onderwerp. Dan luister je gericht.',
      example_html: 'Vraag over een <mark>afspraak</mark>? Let op een dag en een tijd.',
    },
    {
      slug: 'luisteren-vraag-eerst', name_nl: 'Lees eerst de vraag',
      one_liner: 'Je hoort het fragment één keer. Weet vooraf wat je zoekt.',
      example_html: 'Eerst de vraag en de antwoorden, <mark>dan</mark> de audio.',
    },
    {
      slug: 'luisteren-kernwoorden', name_nl: 'Onthouden zonder pen',
      one_liner: 'In het examen mag je niets opschrijven. Houd twee of drie woorden vast.',
      example_html: 'Onthoud: <mark>dinsdag</mark> · <mark>halftwee</mark> · <mark>kantine</mark>',
    },
    {
      slug: 'luisteren-andere-woorden', name_nl: 'De vraag zegt het anders',
      one_liner: 'Het fragment zegt augustus, de vraag zegt de zomer. Dat is hetzelfde antwoord.',
      example_html: 'Hoor je <mark>augustus</mark>, dan past het antwoord <mark>in de zomer</mark>.',
    },
    {
      slug: 'luisteren-kleine-woordjes', name_nl: 'Kleine woordjes, groot verschil',
      one_liner: 'te groot is niet groot. niet, geen en juist draaien de betekenis om.',
      example_html: 'De trui is <mark>te</mark> groot — dus hij past niet.',
    },
    {
      slug: 'luisteren-gesprek-of-bericht', name_nl: 'Gesprek of bericht?',
      one_liner: 'In een omroep staat het antwoord vooraan, in een gesprek meestal achteraan.',
      example_html: 'Een omroep begint met wat er aan de hand is: <mark>Let op</mark>, …',
    },
    {
      slug: 'luisteren-wie-zegt-wat', name_nl: 'Wie zegt wat?',
      one_liner: 'Bij twee sprekers is de helft van het werk: onthouden wie het zei.',
      example_html: '<mark>Hij</mark> wil later, <mark>zij</mark> kan alleen vroeg.',
    },
    {
      slug: 'luisteren-afleiders', name_nl: 'Een antwoord dat te goed past',
      one_liner: 'Een antwoord met woorden uit het fragment is vaak juist het foute.',
      example_html: 'Je hoort <mark>vakantie</mark>, maar de vraag gaat over het rooster.',
    },
  ],

  /* ── Schrijven: zes bouwstenen (blok B), zes over de opdracht (blok C) ──────────────── */
  schrijven: [
    {
      slug: 'schrijven-zin-af-maken', name_nl: 'De zin zelf af maken',
      one_liner: 'Herkennen is makkelijk, zelf schrijven niet. Het werkwoord staat op plaats twee.',
      example_html: 'Morgen <mark>ga ik</mark> naar de tandarts.',
    },
    {
      slug: 'schrijven-je-of-u', name_nl: 'Je of u — en volhouden',
      one_liner: 'Kies bij wie je schrijft en blijf daarbij. Wisselen kost punten.',
      example_html: 'Beste meneer Jansen, <mark>kunt u</mark> mij laten weten…',
    },
    {
      slug: 'schrijven-spelling-werkwoord', name_nl: 'word of wordt, d of t',
      one_liner: 'De fout die het vaakst wordt gemaakt, en de makkelijkste om te controleren.',
      example_html: 'Ik <mark>word</mark> ziek — hij <mark>wordt</mark> ziek.',
    },
    {
      slug: 'schrijven-hoofdletters-leestekens', name_nl: 'Hoofdletters en punten',
      one_liner: 'Elke zin begint met een hoofdletter en eindigt met een punt. Ook in een briefje.',
      example_html: '<mark>I</mark>k kom morgen langs<mark>.</mark>',
    },
    {
      slug: 'schrijven-verbindingswoorden', name_nl: 'Van losse zinnen één tekst',
      one_liner: 'want, omdat, daarom — ze maken van drie zinnen een tekst die loopt.',
      example_html: 'Ik kan niet komen, <mark>want</mark> ik moet werken.',
    },
    {
      slug: 'schrijven-tijd-kloppend', name_nl: 'De tijd kloppend houden',
      one_liner: 'Ging het over gisteren of over morgen? Blijf in dezelfde tijd.',
      example_html: 'Gisteren <mark>ben ik geweest</mark>, morgen <mark>ga ik</mark> weer.',
    },
    {
      slug: 'schrijven-alle-punten', name_nl: 'Alle punten, niet meer',
      one_liner: 'De opdracht noemt wat erin moet. Alles noemen is de halve score.',
      example_html: 'Drie punten gevraagd? Dan staan er <mark>drie</mark> in je briefje.',
    },
    {
      slug: 'schrijven-email-opbouw', name_nl: 'Een e-mail opbouwen',
      one_liner: 'Aanhef, waarom je schrijft, wat je vraagt, slot. Altijd in die volgorde.',
      example_html: '<mark>Beste mevrouw De Wit,</mark> ik schrijf u over…',
    },
    {
      slug: 'schrijven-formulier-invullen', name_nl: 'Een formulier invullen',
      one_liner: 'Voorletters zijn geen voornaam. En vergeet de datum en je handtekening niet.',
      example_html: 'Voorletters: <mark>A.M.</mark> — Voornaam: Amina',
    },
    {
      slug: 'schrijven-tekst-over-jezelf', name_nl: 'Een tekst over jezelf',
      one_liner: 'Antwoord op elk streepje in de opdracht, met hele zinnen.',
      example_html: 'Ik woon in Zwolle. <mark>Daar</mark> woon ik sinds 2023.',
    },
    {
      slug: 'schrijven-briefje-en-bericht', name_nl: 'Een kort briefje of bericht',
      one_liner: 'Kort mag, onvolledig niet. Ook drie regels hebben een aanhef en een slot.',
      example_html: 'Hoi Karim, <mark>ik ben er om zes uur.</mark> Groetjes, Sara',
    },
    {
      slug: 'schrijven-nakijken', name_nl: 'Je tekst nakijken',
      one_liner: 'Twee minuten aan het eind: staan alle punten erin, en klopt het werkwoord?',
      example_html: 'Lees terug: <mark>alle punten</mark> · <mark>woordorde</mark> · <mark>d of t</mark>',
    },
  ],

  /* ── Spreken: zes over uitspraak (blok B), zeven over de opdracht (blok C) ──────────── */
  spreken: [
    {
      slug: 'spreken-klanken-ui-eu-ij', name_nl: 'ui, eu en ij',
      one_liner: 'Drie klanken die in bijna geen andere taal zo bestaan. Daarom oefen je ze apart.',
      example_html: 'h<mark>ui</mark>s · d<mark>eu</mark>r · t<mark>ij</mark>d',
    },
    {
      slug: 'spreken-lijk-en-ig', name_nl: '-lijk en -ig',
      one_liner: 'Je ziet -lijk, je zegt -luk. Dat geldt voor heel veel woorden.',
      example_html: 'moei<mark>lijk</mark> klinkt als moei-luk',
    },
    {
      slug: 'spreken-ng-en-nk', name_nl: '-ng en -nk',
      one_liner: 'bang of bank. Het verschil zit aan het eind, en het is hoorbaar.',
      example_html: 'ba<mark>ng</mark> · ba<mark>nk</mark>',
    },
    {
      slug: 'spreken-uw-ouw-auw', name_nl: '-uw, -ouw en -auw',
      one_liner: 'nieuw, vrouw, blauw. Drie schrijfwijzen, en je hoort welke het is.',
      example_html: 'nie<mark>uw</mark> · vr<mark>ouw</mark> · bl<mark>auw</mark>',
    },
    {
      slug: 'spreken-tie-en-sch', name_nl: '-tie en sch-',
      one_liner: 'informatie klinkt als -tsie, en school begint met s plus ch.',
      example_html: 'informa<mark>tie</mark> · <mark>sch</mark>ool',
    },
    {
      slug: 'spreken-klemtoon', name_nl: 'Waar leg je de klemtoon?',
      one_liner: 'Op het verkeerde stukje nadruk maakt een goed woord onverstaanbaar.',
      example_html: 'ge<mark>meen</mark>te · for<mark>mu</mark>lier',
    },
    {
      slug: 'spreken-twee-vragen', name_nl: 'Er worden twee dingen gevraagd',
      one_liner: 'Deel 1 stelt twee vragen per filmpje. Antwoord op beide, ook kort.',
      example_html: 'Wat doe je? <mark>En</mark> waarom doe je dat?',
    },
    {
      slug: 'spreken-lang-genoeg', name_nl: 'Genoeg zeggen, niet te veel',
      one_liner: 'Twee of drie zinnen met want of omdat. Eén woord is te weinig.',
      example_html: 'Ik ga liever morgen, <mark>omdat</mark> ik vandaag moet werken.',
    },
    {
      slug: 'spreken-duidelijk', name_nl: 'Duidelijk spreken',
      one_liner: 'Niet te snel, hard genoeg, en beweeg je mond. Een accent mag.',
      example_html: 'Rustig praten helpt meer dan <mark>moeilijke</mark> woorden.',
    },
    {
      slug: 'spreken-vorm-en-tijd', name_nl: 'De juiste vorm, ook als je praat',
      one_liner: 'Onder tijdsdruk verdwijnt de -t het eerst. Let erop terwijl je spreekt.',
      example_html: 'Hij <mark>werkt</mark> bij de gemeente.',
    },
    {
      slug: 'spreken-wat-zeg-je', name_nl: 'Wat kan deze persoon zeggen?',
      one_liner: 'Deel 2 vraagt niet wat jij vindt, maar wat past in die situatie.',
      example_html: 'Iemand komt te laat: <mark>Sorry dat ik laat ben.</mark>',
    },
    {
      slug: 'spreken-plaatje-beschrijven', name_nl: 'Iets beschrijven bij een plaatje',
      one_liner: 'Zeg wat je ziet, en gebruik de plaatjes die de opdracht noemt.',
      example_html: 'Op het plaatje zie ik <mark>een vrouw bij een loket</mark>.',
    },
    {
      slug: 'spreken-niet-verstaan', name_nl: 'Als je het niet verstaat',
      one_liner: 'Even nadenken mag. Je mag ook zeggen dat je het niet begreep.',
      example_html: '<mark>Kunt u dat nog een keer zeggen?</mark>',
    },
  ],
};

/**
 * Eén strategieconcept opzoeken, met een luide fout als hij niet bestaat.
 *
 * De blokdefinities hieronder noemen concepten op slug; een typefout daarin zou anders een les
 * opleveren over niets, en dat valt pas op als iemand hem opent.
 */
function strategyOf(onderdeel, slug) {
  const found = (STRATEGY_CONCEPTS[onderdeel] ?? []).find(c => c.slug === slug);
  if (!found) throw new Error(`strategieconcept "${slug}" bestaat niet voor ${onderdeel}`);
  return found;
}

/**
 * De blokken van één cursus, als data.
 *
 * `lessons` is een lijst beschrijvingen die de generator één voor één afwerkt. Elke les is
 * één modelcall — de unit is klein genoeg om te kunnen falen en opnieuw te doen, en groot
 * genoeg om samenhangend te zijn. Splitsen op iets groters convergeert niet: elke opgavesoort
 * heeft zijn eigen vormregel en een retry die de ene repareert breekt de andere.
 */
export function coursePlan(level, onderdeel) {
  if (level !== 'a2') {
    throw new Error(`Alleen A2 is uitgewerkt; ${level} vraagt zijn eigen conceptenbibliotheek — ` +
      'B1 is niet A2 met zwaardere voorbeelden.');
  }

  const builder = COURSES[onderdeel];
  if (!builder) {
    throw new Error(`Geen cursusopbouw voor onderdeel "${onderdeel}". ` +
      `Uitgewerkt: ${Object.keys(COURSES).join(', ')}`);
  }
  return withOrder(builder());
}

/**
 * Zet `sort_order` op elk blok en elke les, en de gratis-vlag op de eerste les van een blok.
 *
 * Eén plek, zodat een cursus die een les erbij krijgt niet ook nog een reeks handgeschreven
 * getallen hoeft te verschuiven. `is_free` mag een blok expliciet uitzetten (`free: false`) —
 * blok D en E hebben geen etalagefunctie: een gratis examentraining zonder de uitleg ervoor
 * verkoopt niets.
 */
function withOrder(blocks) {
  return blocks.map((block, bi) => ({
    ...block,
    sort_order: (bi + 1) * 10,
    lessons: block.lessons.map((lesson, li) => ({
      ...lesson,
      sort_order: (li + 1) * 10,
      is_free: block.free === false ? false : li === 0,
    })),
  }));
}

/** Blok E is bij elke cursus twee lessen: eerst de bouwstenen, dan de examenvorm. */
function toetsBlock(first, second) {
  return {
    letter: 'E', name_nl: 'Toets jezelf', free: false,
    intro: 'Waar sta je? Deze toets zegt niet welk cijfer je haalt, maar welke concepten je nog moet oefenen.',
    lessons: [first, second],
  };
}

/* ── de vier cursussen ──────────────────────────────────────────────────── */

const COURSES = {
  /**
   * A2 Lezen — 53 lessen, en de enige cursus met een grammaticablok.
   *
   * Onveranderd: deze lessen staan geschreven in `generated/a2-lezen/` en gevalideerd in de
   * database. Een gewijzigde slug of volgorde hier is een nieuwe les die naast de oude komt te
   * staan, niet een aanpassing van de bestaande.
   */
  lezen: () => {
    /* Álle taalregels met een les, en niet alleen die van Lezen: dit blok is `RULES_HOME`,
       het enige exemplaar van elke regelles. Zie `rulesHomeConcepts()`. */
    const grammar = rulesHomeConcepts();
    const sections = BLOCK_C_SECTIONS.lezen;
    const strategy = STRATEGY_CONCEPTS.lezen;

    return [
      {
        letter: 'A', name_nl: 'Woorden',
        intro: 'De woorden die je in dit onderdeel het vaakst tegenkomt. Eerst herkennen, dan zelf gebruiken.',
        lessons: wordThemes('lezen').map((t, i) => ({
          kind: 'woorden', slug: `a${i + 1}-${t.slug}`, title: t.name,
          theme: t.slug, targetWords: t.words, minutes: 8,
        })),
      },
      {
        letter: 'B', name_nl: 'Grammatica',
        intro: 'De grammatica die je nodig hebt voor het examen. Elke les legt één ding uit en laat je het meteen oefenen.',
        lessons: grammar.map((c, i) => ({
          kind: 'grammatica', slug: `b${i + 1}-${c.slug}`, title: c.name_nl,
          concept: c.slug, minutes: 10,
        })),
      },
      {
        letter: 'C', name_nl: 'Examenuitleg',
        intro: 'Wat voor teksten je krijgt, wat er gevraagd wordt, en hoe je het aanpakt.',
        lessons: [
          ...strategy.map((s, i) => ({
            kind: 'strategie', slug: `c${i + 1}-${s.slug.replace('lezen-', '')}`,
            title: s.name_nl, strategyConcept: s.slug, minutes: 9,
          })),
          ...sections.map((s, i) => ({
            kind: 'tekstsoort', slug: `c${strategy.length + i + 1}-${s}`,
            // De titel komt uit `sections.name_nl`; de seeder vult hem in.
            title: null, section: s, minutes: 9,
          })),
        ],
      },
      {
        letter: 'D', name_nl: 'Examentraining', free: false,
        intro: 'Oefenen in examenvorm, maar korter. Alles door elkaar, zoals op de dag zelf.',
        lessons: sections.map((s, i) => ({
          kind: 'training', slug: `d${i + 1}-${s}`, title: null, section: s, minutes: 12,
        })),
      },
      toetsBlock(
        { kind: 'toets', slug: 'e1-woorden-en-grammatica', title: 'Woorden en grammatica', minutes: 15 },
        { kind: 'toets', slug: 'e2-teksten-en-vragen', title: 'Teksten en vragen', minutes: 15 },
      ),
    ];
  },

  /**
   * A2 Luisteren — 26 lessen.
   *
   * Blok B is klank en tempo in plaats van grammatica, en blok D heeft zes lessen op vier
   * `sections`: een omroepbericht en het nieuws zijn beide een `mededeling`, maar ze klinken
   * niet hetzelfde en de vraag erbij is anders. De `section` blijft eraan hangen omdat
   * `lesson_items.section_id` de brug is naar de examenvragen van diezelfde tekstsoort.
   */
  luisteren: () => {
    const B = [
      'luisteren-getallen-en-tijden',
      'luisteren-verkorte-spraak',
      'luisteren-klanken-die-lijken',
      'luisteren-klemtoon-en-nadruk',
      'luisteren-signaalwoorden-horen',
    ];
    const C = [
      'luisteren-voorspellen',
      'luisteren-vraag-eerst',
      'luisteren-kernwoorden',
      'luisteren-andere-woorden',
      'luisteren-kleine-woordjes',
      'luisteren-gesprek-of-bericht',
      'luisteren-wie-zegt-wat',
      'luisteren-afleiders',
    ];
    const D = [
      { slug: 'd1-omroepbericht',       title: 'Training: Omroepbericht',        section: 'mededeling' },
      { slug: 'd2-telefoongesprek',     title: 'Training: Telefoongesprek',      section: 'telefoongesprek' },
      { slug: 'd3-gesprek-op-het-werk', title: 'Training: Gesprek op het werk',  section: 'gesprek' },
      { slug: 'd4-winkel-en-service',   title: 'Training: In de winkel',         section: 'gesprek' },
      { slug: 'd5-loket-en-instructie', title: 'Training: Loket en instructie',  section: 'instructie' },
      { slug: 'd6-nieuws-en-weer',      title: 'Training: Nieuws en weer',       section: 'mededeling' },
    ];

    return [
      {
        letter: 'A', name_nl: 'Woorden',
        intro: 'De woorden die je in gesproken Nederlands hoort. Je hoeft ze niet te kunnen zeggen — herkennen is genoeg.',
        lessons: wordThemes('luisteren').map((t, i) => ({
          kind: 'woorden', slug: `a${i + 1}-${t.slug}`, title: t.name,
          theme: t.slug, targetWords: t.words, minutes: 8,
        })),
      },
      {
        letter: 'B', name_nl: 'Klank en tempo',
        intro: 'Waarom je een woord dat je kent soms niet hoort. Getallen, snel spreken en klanken die op elkaar lijken.',
        lessons: B.map((slug, i) => {
          const c = strategyOf('luisteren', slug);
          return {
            kind: 'klank', slug: `b${i + 1}-${slug.replace('luisteren-', '')}`,
            title: c.name_nl, strategyConcept: slug, minutes: 9,
          };
        }),
      },
      {
        letter: 'C', name_nl: 'Examenuitleg',
        intro: 'Hoe je een luistervraag aanpakt: wat je vóór het fragment doet, en waar de valkuilen zitten.',
        lessons: C.map((slug, i) => {
          const c = strategyOf('luisteren', slug);
          return {
            kind: 'luisterstrategie', slug: `c${i + 1}-${slug.replace('luisteren-', '')}`,
            title: c.name_nl, strategyConcept: slug, minutes: 9,
          };
        }),
      },
      {
        letter: 'D', name_nl: 'Examentraining', free: false,
        intro: 'Fragmenten op examentempo, met twee of drie vragen erbij. Eén keer luisteren, zoals op de dag zelf.',
        lessons: D.map(l => ({ kind: 'luistertraining', minutes: 12, ...l })),
      },
      toetsBlock(
        { kind: 'luistertoets', slug: 'e1-woorden-en-klanken', title: 'Woorden en klanken', minutes: 15 },
        { kind: 'luistertraining', slug: 'e2-fragmenten-en-vragen', title: 'Fragmenten en vragen', minutes: 15, section: 'gesprek' },
      ),
    ];
  },

  /**
   * A2 Schrijven — 24 lessen.
   *
   * Blok D is één op één afgebeeld op `task_categories` voor Schrijven, plus een les op de
   * klok: veertig minuten voor vier opdrachten is de helft van wat dit examen moeilijk maakt,
   * en dat kun je alleen oefenen door het te doen.
   */
  schrijven: () => {
    const B = [
      'schrijven-zin-af-maken',
      'schrijven-je-of-u',
      'schrijven-spelling-werkwoord',
      'schrijven-hoofdletters-leestekens',
      'schrijven-verbindingswoorden',
      'schrijven-tijd-kloppend',
    ];
    const C = [
      'schrijven-alle-punten',
      'schrijven-email-opbouw',
      'schrijven-formulier-invullen',
      'schrijven-tekst-over-jezelf',
      'schrijven-briefje-en-bericht',
      'schrijven-nakijken',
    ];
    const D = [
      { slug: 'd1-email-informeel', title: 'Training: E-mail aan iemand die je kent', category: 'email' },
      { slug: 'd2-email-formeel',   title: 'Training: E-mail aan een instantie',      category: 'email' },
      { slug: 'd3-formulier',       title: 'Training: Formulier invullen',            category: 'form' },
      { slug: 'd4-korte-tekst',     title: 'Training: Korte tekst',                   category: 'short_text' },
      { slug: 'd5-plaatje-briefje', title: 'Training: Briefje bij plaatjes',          category: 'picture_note' },
      { slug: 'd6-op-de-klok',      title: 'Training: Vier opdrachten in 40 minuten', category: null },
    ];

    return [
      {
        letter: 'A', name_nl: 'Woorden en vaste zinnen',
        intro: 'De zinnen die je in elke opdracht opnieuw nodig hebt: hoe je begint, hoe je iets vraagt, hoe je afsluit.',
        lessons: wordThemes('schrijven').map((t, i) => ({
          kind: 'zinnen', slug: `a${i + 1}-${t.slug}`, title: t.name,
          theme: t.slug, targetWords: t.words, minutes: 8,
        })),
      },
      {
        letter: 'B', name_nl: 'Bouwstenen',
        intro: 'De fouten die je maakt zodra je zelf de zin moet schrijven. Geen grammaticacursus — een selectie die punten kost.',
        lessons: B.map((slug, i) => {
          const c = strategyOf('schrijven', slug);
          return {
            kind: 'bouwsteen', slug: `b${i + 1}-${slug.replace('schrijven-', '')}`,
            title: c.name_nl, strategyConcept: slug, minutes: 10,
          };
        }),
      },
      {
        letter: 'C', name_nl: 'Examenuitleg',
        intro: 'Wat er in het examen gevraagd wordt, per soort opdracht, en hoe je je tekst nakijkt.',
        lessons: C.map((slug, i) => {
          const c = strategyOf('schrijven', slug);
          return {
            kind: 'schrijfstrategie', slug: `c${i + 1}-${slug.replace('schrijven-', '')}`,
            title: c.name_nl, strategyConcept: slug, minutes: 9,
          };
        }),
      },
      {
        letter: 'D', name_nl: 'Examentraining', free: false,
        intro: 'De vier soorten opdracht die het examen geeft, en één les waarin de klok meedoet.',
        lessons: D.map(l => ({ kind: 'schrijftraining', minutes: 12, ...l })),
      },
      toetsBlock(
        { kind: 'toets', slug: 'e1-zinnen-en-spelling', title: 'Zinnen en spelling', minutes: 15 },
        { kind: 'schrijftraining', slug: 'e2-vier-opdrachten', title: 'Vier opdrachten', minutes: 15, category: null },
      ),
    ];
  },

  /**
   * A2 Spreken — 26 lessen.
   *
   * Blok B is uitspraak en is de reden dat `naspreken` bestaat. Blok C en D gebruiken
   * `opnemen`: een gesproken antwoord dat de cursist zelf terughoort en met een
   * voorbeeldantwoord vergelijkt. Geen rubriek, geen cijfer — zie de migratie
   * `20260908120000_lesson_speaking_items.sql`.
   */
  spreken: () => {
    const B = [
      'spreken-klanken-ui-eu-ij',
      'spreken-lijk-en-ig',
      'spreken-ng-en-nk',
      'spreken-uw-ouw-auw',
      'spreken-tie-en-sch',
      'spreken-klemtoon',
    ];
    const C = [
      'spreken-twee-vragen',
      'spreken-lang-genoeg',
      'spreken-duidelijk',
      'spreken-vorm-en-tijd',
      'spreken-wat-zeg-je',
      'spreken-plaatje-beschrijven',
      'spreken-niet-verstaan',
    ];
    const D = [
      { slug: 'd1-reageren',       title: 'Training: Reageren op een situatie', category: 'speaking_react' },
      { slug: 'd2-beschrijven',    title: 'Training: Gebruik het plaatje',      category: 'speaking_describe' },
      { slug: 'd3-kiezen',         title: 'Training: Kies een van de plaatjes', category: 'speaking_choose' },
      { slug: 'd4-alles-benoemen', title: 'Training: Gebruik alle plaatjes',    category: 'speaking_cover_all' },
      { slug: 'd5-in-60-seconden', title: 'Training: Zestig seconden per opdracht', category: null },
      { slug: 'd6-twee-delen',     title: 'Training: Deel 1 en deel 2',         category: null },
    ];

    return [
      {
        letter: 'A', name_nl: 'Woorden en zinnen',
        intro: 'Wat je zegt om iets te vragen, je mening te geven of sorry te zeggen. Gesorteerd op wat je wilt doen.',
        lessons: wordThemes('spreken').map((t, i) => ({
          kind: 'zinnen', slug: `a${i + 1}-${t.slug}`, title: t.name,
          theme: t.slug, targetWords: t.words, minutes: 8,
        })),
      },
      {
        letter: 'B', name_nl: 'Uitspraak',
        intro: 'De Nederlandse klanken die het moeilijkst zijn. Je hoort ze, je zegt ze na, en je hoort jezelf terug.',
        lessons: B.map((slug, i) => {
          const c = strategyOf('spreken', slug);
          return {
            kind: 'uitspraak', slug: `b${i + 1}-${slug.replace('spreken-', '')}`,
            title: c.name_nl, strategyConcept: slug, minutes: 9,
          };
        }),
      },
      {
        letter: 'C', name_nl: 'Examenuitleg',
        intro: 'Wat het examen van je antwoord vraagt: beide vragen beantwoorden, genoeg zeggen, en verstaanbaar blijven.',
        lessons: C.map((slug, i) => {
          const c = strategyOf('spreken', slug);
          return {
            kind: 'spreekstrategie', slug: `c${i + 1}-${slug.replace('spreken-', '')}`,
            title: c.name_nl, strategyConcept: slug, minutes: 9,
          };
        }),
      },
      {
        letter: 'D', name_nl: 'Examentraining', free: false,
        intro: 'De vier soorten spreekopdracht, en twee lessen waarin het tempo van het examen meedoet.',
        lessons: D.map(l => ({ kind: 'spreektraining', minutes: 12, ...l })),
      },
      toetsBlock(
        { kind: 'spreektoets', slug: 'e1-zinnen-en-uitspraak', title: 'Zinnen en uitspraak', minutes: 15 },
        { kind: 'spreektraining', slug: 'e2-zestien-opdrachten', title: 'Zestien opdrachten', minutes: 15, category: null },
      ),
    ];
  },
};

/**
 * Alles wat is uitgewerkt.
 *
 * A2 Lezen was M-L1; de andere drie zijn erbij gekomen op 08-09 volgens
 * `docs/decisions/leerlaag-a2-master-plan.html`. B1 komt niet: dat niveau heeft zijn eigen
 * conceptenbibliotheek nodig, en B1 Luisteren heeft nog geen inhoud en geen vastgesteld format.
 */
export const BUILT = ['a2:lezen', 'a2:luisteren', 'a2:schrijven', 'a2:spreken'];

export function parseTarget(arg) {
  const [level, onderdeel] = String(arg).split(':');
  if (!level || !onderdeel) {
    throw new Error(`Doel moet "niveau:onderdeel" zijn, bijvoorbeeld a2:lezen — kreeg "${arg}"`);
  }
  return { level, onderdeel };
}
