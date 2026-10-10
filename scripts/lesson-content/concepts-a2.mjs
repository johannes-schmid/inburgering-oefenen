/**
 * De A2-conceptenbibliotheek. Met de hand vastgelegd, in git.
 *
 * ── WAAROM DIT MET DE HAND IS ────────────────────────────────────────────────
 * Vraag een model dertig keer om "een A2-grammaticaconcept" en je krijgt dertig items die
 * elk apart kloppen en als *verzameling* waardeloos zijn: drie varianten van de voltooide
 * tijd, geen woordorde, en een volgorde die niets opbouwt. Dezelfde reden waarom
 * `scripts/b1-content/plan.mjs` bestaat. De onderwerpen, de groepering, de volgorde en de
 * onderdeelkoppeling liggen hier vast; het model schrijft alleen de uitleg en de opgaven.
 *
 * ── DE BRON, EN WAT WE ERVAN OVERNEMEN ───────────────────────────────────────
 * De onderwerpenlijst en de volgorde komen van **TaalCompleet A2** (KleurRijker, 4e druk
 * 2019, ISBN 978-94-90807-24-5), een van de meest gebruikte NT2-methodes; zijn syllabus staat
 * als cursieve subtitels onder de paragraaftitels.
 *
 * Wat we overnemen: de onderwerpnamen en de didactische ordening. "Voltooide tijd
 * onregelmatige werkwoorden" is een vakterm, geen auteursrechtelijk werk, en de volgorde
 * waarin een A2-lijn de tijden opbouwt is precies de vakkennis waar dit product op moet
 * leunen.
 *
 * Wat we NIET overnemen: geen zin tekst, geen opdracht, geen woordenlijst. Dezelfde regel als
 * voor `resources/exam-references/A2/`: vorm wel, inhoud nooit. Elke `one_liner`, elk
 * `example_html` hieronder is van ons.
 *
 * ── VAN 46 BOEKINGANGEN NAAR 31 CONCEPTEN ────────────────────────────────────
 * De methode heeft 46 grammatica-ingangen, waarvan negen met het voorvoegsel `Herhaling:`.
 * Die worden hier géén tweede concept maar een tweede oefenronde op hetzelfde concept — één
 * concept staat één keer in de database, anders staat het perfectum er twee keer en gaan de
 * twee kopieën uit elkaar lopen. Dat is de `sections`-naast-`task_type`-fout die deze repo al
 * eens heeft gemaakt.
 *
 * ── DE ONDERDEELKOPPELING IS EEN INHOUDELIJKE KEUZE ──────────────────────────
 * `onderdelen` is de "KOMT IN …"-rij op de conceptkaart, en hij bepaalt in welke cursussen het
 * concept opduikt. Hij is per concept afgewogen en niet standaard alle vier:
 *
 *   * Woordorde en de tijden zitten in alle vier — je moet ze herkennen om een tekst te
 *     begrijpen en produceren om een e-mail te schrijven.
 *   * Verbuiging (bijvoeglijk naamwoord met/zonder -e, spelling) is vooral *productief*:
 *     bij Lezen verandert een gemiste -e zelden de betekenis, bij Schrijven wel.
 *   * Verwijzen (`hij`, `ze`, `het`) staat juist wél bij Lezen en Luisteren: wie "hij" is,
 *     is precies wat een examenvraag vraagt.
 *   * Uitspraak en klemtoon zitten bij Luisteren en Spreken, niet bij Lezen.
 *
 * Als een concept in geen enkel onderdeel staat, is het onvindbaar. Dat wordt door
 * `tests-unit/lesson-syllabus.test.ts` afgedwongen.
 */

/** De koppen waaronder de concepten staan. `sort_order` is de leesvolgorde van de cursus. */
export const A2_GROUPS = [
  { slug: 'zinnen-bouwen',      name_nl: 'Zinnen bouwen',        sort_order: 10 },
  { slug: 'werkwoorden-tijd',   name_nl: 'Werkwoorden & tijd',   sort_order: 20 },
  { slug: 'soorten-werkwoorden', name_nl: 'Soorten werkwoorden', sort_order: 30 },
  { slug: 'woorden-verbuigen',  name_nl: 'Woorden verbuigen',    sort_order: 40 },
  { slug: 'verwijzen',          name_nl: 'Verwijzen',            sort_order: 50 },
  { slug: 'spelling-uitspraak', name_nl: 'Spelling & uitspraak', sort_order: 60 },
];

const ALL = ['lezen', 'luisteren', 'schrijven', 'spreken'];
const RECEPTIEF = ['lezen', 'luisteren'];
const PRODUCTIEF = ['schrijven', 'spreken'];

/**
 * ── WAAR EEN REGEL IN THUISHOORT, EN WAAR HIJ ZWAAR WEEGT ────────────────────
 * Twee assen, en ze zeggen iets anders. `onderdelen` bepaalt of de regel in die cursus
 * *voorkomt*; `kern` of je hem daar zélf goed moet doen. Wat niet in `kern` staat maar wel
 * in `onderdelen` komt als `herkennen` in `concept_onderdelen`.
 *
 * ── WAAROM DIT OPNIEUW IS AFGEWOGEN (10-09) ──────────────────────────────────
 * Hierboven stond al dat de koppeling "per concept afgewogen en niet standaard alle vier" is,
 * en tóch stond 27 van de 31 op `ALL`. Daardoor ging `herkennen` twee dingen betekenen:
 * "begrijpen is genoeg" én "hoort hier eigenlijk niet". Lezen droeg zo `lidwoorden`,
 * `wederkerende-werkwoorden` en `vaste-voorzetsels` — regels die aan de betekenis van een
 * tekst niets veranderen. Nu is er een echte derde stand: géén rij betekent dat dit examen de
 * regel niet vraagt, en die regel staat dan ook niet in de cursus.
 *
 * De maatstaf is de examenvorm en niets anders. A2 Lezen en Luisteren zijn meerkeuze: een
 * verkeerde werkwoordsuitgang kost daar niets, maar een gemiste `omdat`, `hoeft niet` of
 * `het goedkoopst` kost de vraag. Bij Schrijven en Spreken bouw jij de zin, dus telt de vorm.
 *
 * Uitkomst: Lezen 20 regels (9 kern), Luisteren 20 (8), Schrijven 30 (21), Spreken 31 (22) —
 * 101 rijen in `concept_onderdelen`, waar het er 118 waren. De tellingen staan vast in
 * `tests-unit/lesson-syllabus.test.ts`, dus een hertagging door de docent is een bewuste
 * testwijziging en geen cijfer dat stil verschuift.
 *
 * ── DE ACHT REGELS VAN OKTOBER 2026 ──────────────────────────────────────────
 * De grammaticasyllabus van de eigenaar (`data/grammar-syllabus.ts`) vroeg om acht regels die
 * er nog niet waren. Hun `onderdelen` is precies de lijst cursussen waarvan een onderwerp naar
 * de les wijst — niet breder: `betrekkelijk-vnw` staat alleen in Lezen, `er-is-er-zijn` alleen
 * in Spreken. `kern` volgt dezelfde maatstaf als hierboven: `lijdende-vorm` is kern bij Lezen
 * omdat "uw pas wordt opgestuurd" de vraag beslist (moet ík iets doen?), `betrekkelijk-vnw`
 * is herkennen omdat de zin ook zonder het die-stuk te begrijpen is.
 *
 * Nu: Lezen 26 regels (14 kern), Luisteren 23 (11), Schrijven 33 (24), Spreken 34 (25) —
 * 116 rijen.
 *
 * `lesson_note` is optioneel en gaat alleen naar de auteursprompt (`author.mjs`, de brief
 * `grammatica`): wat de les wel en niet behandelt. De seeder leest hem niet.
 */

// Waar de regel in voorkomt.
const IN_ALLE      = ALL;
const IN_LEZEN_P   = ['lezen', ...PRODUCTIEF];      // parseren + produceren, niet horen
const IN_LUISTER_P = ['luisteren', ...PRODUCTIEF];   // horen + produceren, niet lezen
const IN_P         = PRODUCTIEF;                     // alleen als jij de zin bouwt
const IN_KLANK     = ['luisteren', 'spreken'];       // van het oor, en alleen van het oor

// Waar je hem zélf goed moet doen.
const KERN_ALLE      = ALL;                          // overal dragend
const KERN_P         = PRODUCTIEF;
const KERN_P_LUISTER = ['luisteren', ...PRODUCTIEF];
const KERN_LEZEN     = ['lezen'];                    // verandert wat de tekst zégt
const KERN_RECEPTIEF = RECEPTIEF;                    // de kleine woordjes: altijd, nooit, soms
const KERN_KLANK     = ['luisteren', 'spreken'];
const GEEN_KERN      = [];                           // herkennen is genoeg

/**
 * De 39 concepten (31 uit september, 8 uit de syllabus van oktober 2026).
 *
 * `one_liner` is de regel onder de kaarttitel: kort, in A2-Nederlands, `je` en niet `u`.
 * `example_html` is het voorbeeldzinnetje op de kaart, met `<mark>` om precies het fragment
 * dat het concept toont — niet om de hele zin, want dan wijst de markering nergens naar.
 */
export const A2_CONCEPTS = [
  // ── Zinnen bouwen ─────────────────────────────────────────────────────────
  {
    slug: 'hoofdzin-woordorde', name_nl: 'De hoofdzin', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_LEZEN_P, kern: KERN_P, sort_order: 10,
    one_liner: 'Het werkwoord staat op plaats twee. Dat verandert bijna nooit.',
    example_html: 'Ik <mark>werk</mark> op maandag in de winkel.',
  },
  {
    slug: 'inversie', name_nl: 'Inversie', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_LEZEN_P, kern: KERN_P, sort_order: 20,
    one_liner: 'Begin je met tijd of plaats? Dan wisselen werkwoord en ik van plaats.',
    example_html: 'Morgen <mark>bel ik</mark> de gemeente.',
  },
  {
    slug: 'voegwoorden-hoofdzin', name_nl: 'en, maar, want, dus, of', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_ALLE, sort_order: 30,
    one_liner: 'Twee hele zinnen aan elkaar. De woordorde blijft gewoon staan.',
    example_html: 'Ik ga naar huis, <mark>want</mark> ik ben ziek.',
  },
  {
    slug: 'bijzin-omdat-als', name_nl: 'omdat, als, toen', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_ALLE, sort_order: 40,
    one_liner: 'Na deze woorden gaat het werkwoord naar achteren.',
    example_html: 'Ik blijf thuis <mark>omdat ik ziek ben</mark>.',
  },
  {
    slug: 'bijzin-dat-of', name_nl: 'Hij zegt dat… — Hij vraagt of…', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_ALLE, sort_order: 50,
    one_liner: 'Iemand anders navertellen. Ook hier gaat het werkwoord naar achteren.',
    example_html: 'De dokter zegt <mark>dat ik moet rusten</mark>.',
  },
  {
    slug: 'om-te', name_nl: 'om … te', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_LEZEN_P, kern: KERN_P, sort_order: 60,
    one_liner: 'Waarom doe je iets? Dan gebruik je om … te.',
    example_html: 'Ik ga naar de bibliotheek <mark>om</mark> een boek <mark>te</mark> lenen.',
  },
  {
    slug: 'vragen-maken', name_nl: 'Vragen maken', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_LUISTER_P, kern: KERN_P_LUISTER, sort_order: 70,
    one_liner: 'Met een vraagwoord, of met het werkwoord vooraan.',
    example_html: '<mark>Waar woont</mark> u? — <mark>Woont u</mark> in Utrecht?',
  },
  {
    slug: 'ontkenning', name_nl: 'niet, geen, nooit, niemand, niets', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_ALLE, sort_order: 80,
    one_liner: 'Eén klein woord maakt van ja nee. Geen hoort bij een ding, niet bij de rest.',
    example_html: 'Ik heb <mark>geen</mark> tijd. Ik kom <mark>niet</mark>.',
    lesson_note:
      'Behandel: geen bij een zelfstandig naamwoord zonder de/het (geen auto, geen tijd); niet ' +
      'bij de rest (Ik kom niet. Het is niet duur.). Daarnaast nooit, niemand en niets als ' +
      'woorden die zelf al nee betekenen. En de plaats van niet: aan het eind van een korte zin ' +
      '(Ik werk vandaag niet), maar vóór een bijvoeglijk naamwoord, een voorzetsel of het ' +
      'tweede werkwoord (Ik kan morgen niet komen). Laat in een opgave zien dat de ontkenning ' +
      'de betekenis van de hele zin omdraait — dat is wat een examenvraag toetst.',
  },

  // ── Werkwoorden & tijd ────────────────────────────────────────────────────
  {
    slug: 'tegenwoordige-tijd', name_nl: 'Praten over nu', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 110,
    one_liner: 'ik werk, jij werkt, wij werken. Let op de t bij jij, hij en u.',
    example_html: 'Hij <mark>begrijpt</mark> de brief niet.',
  },
  {
    slug: 'onregelmatige-tegenwoordige-tijd', name_nl: 'zijn, hebben, gaan, kunnen',
    group: 'werkwoorden-tijd', kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_P, sort_order: 120,
    one_liner: 'De vier werkwoorden die je het vaakst nodig hebt en die niet meedoen.',
    example_html: 'Ik <mark>ben</mark> ziek en ik <mark>heb</mark> koorts.',
  },
  {
    slug: 'perfectum-regelmatig', name_nl: 'Ik heb gewerkt', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_P, sort_order: 130,
    one_liner: 'Praten over gisteren: hebben of zijn plus ge-…-d of ge-…-t.',
    example_html: 'Ik <mark>heb</mark> een brief <mark>geschreven</mark>.',
  },
  {
    slug: 'perfectum-onregelmatig', name_nl: 'Ik heb gelezen', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_P, sort_order: 140,
    one_liner: 'Veel deelwoorden eindigen op -en en die moet je leren.',
    example_html: 'Zij <mark>heeft</mark> het formulier <mark>gelezen</mark>.',
  },
  {
    slug: 'hebben-of-zijn', name_nl: 'hebben of zijn?', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 150,
    one_liner: 'zijn bij beweging en verandering, hebben bij bijna al het andere.',
    example_html: 'Ik <mark>ben</mark> naar de gemeente <mark>gegaan</mark>.',
  },
  {
    slug: 'verleden-tijd', name_nl: 'Ik werkte, wij gingen', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: GEEN_KERN, sort_order: 160,
    one_liner: 'De tweede manier om over vroeger te praten. Vaak in verhalen.',
    example_html: 'Vroeger <mark>woonde</mark> ik in Rotterdam.',
  },
  {
    slug: 'toekomende-tijd', name_nl: 'Praten over later', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: GEEN_KERN, sort_order: 170,
    one_liner: 'gaan plus het hele werkwoord — of gewoon de tegenwoordige tijd.',
    example_html: 'Ik <mark>ga</mark> morgen <mark>koken</mark>.',
  },
  {
    slug: 'gebiedende-wijs', name_nl: 'Doe de deur dicht', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_P, sort_order: 180,
    one_liner: 'Een opdracht of instructie: het werkwoord staat vooraan.',
    example_html: '<mark>Vul</mark> hier uw naam in.',
  },
  {
    slug: 'tijdsaanduidingen', name_nl: 'geleden, sinds, straks', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: RECEPTIEF, kern: KERN_RECEPTIEF, sort_order: 190,
    one_liner: 'Wanneer gebeurt het? Al gebeurd, nu bezig of nog niet.',
    example_html: 'Ik woon hier <mark>sinds</mark> 2023. Ik ben <mark>twee jaar geleden</mark> verhuisd.',
    lesson_note:
      'Behandel woorden die zeggen wanneer iets gebeurt: geleden (twee weken geleden = in het ' +
      'verleden), sinds (vanaf toen tot nu), tot (tot vrijdag = daarna niet meer), binnen twee ' +
      'weken (niet later dan), over tien minuten (straks, in de toekomst), straks, zo meteen, ' +
      'vorige week, volgende maand. Zet in de uitleg verleden tegenover toekomst: "twee dagen ' +
      'geleden" tegenover "over twee dagen". Gebruik situaties uit brieven, afspraken en ' +
      'omroepberichten, met een datum of tijd die de cursist moet uitrekenen.',
  },

  // ── Soorten werkwoorden ───────────────────────────────────────────────────
  {
    slug: 'scheidbare-werkwoorden', name_nl: 'Scheidbare werkwoorden',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_P, sort_order: 210,
    one_liner: 'Het woord valt in twee stukken en het stukje gaat naar achteren.',
    example_html: 'Ik <mark>bel</mark> je morgen <mark>op</mark>.',
  },
  {
    slug: 'werkwoorden-zonder-ge', name_nl: 'be-, ge-, her-, ver-, ont-',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: IN_P, kern: GEEN_KERN, sort_order: 220,
    one_liner: 'Deze werkwoorden krijgen géén ge- in de voltooide tijd.',
    example_html: 'Ik heb dat niet zo <mark>bedoeld</mark>.',
  },
  {
    slug: 'modale-werkwoorden', name_nl: 'moeten, mogen, hoeven, kunnen, willen',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_ALLE, sort_order: 230,
    one_liner: 'Verplicht, toegestaan of juist niet nodig. Let op het woordje te.',
    example_html: 'Je <mark>hoeft</mark> niet <mark>te</mark> betalen.',
  },
  {
    slug: 'wederkerende-werkwoorden', name_nl: 'Ik voel me niet goed',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 240,
    one_liner: 'Werkwoorden met me, je, zich erbij.',
    example_html: 'Ik moet <mark>me</mark> ziek melden.',
  },
  {
    slug: 'vaste-voorzetsels', name_nl: 'wachten op, zorgen voor',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 250,
    one_liner: 'Sommige werkwoorden hebben altijd hetzelfde voorzetsel.',
    example_html: 'Ik <mark>wacht op</mark> de uitslag.',
  },
  {
    slug: 'lijdende-vorm', name_nl: 'De brief wordt verstuurd', group: 'soorten-werkwoorden',
    kind: 'grammatica', onderdelen: ['lezen'], kern: KERN_LEZEN, sort_order: 260,
    one_liner: 'wordt of worden plus een voltooid deelwoord: er gebeurt iets, maar wie doet het?',
    example_html: 'Uw nieuwe pas <mark>wordt opgestuurd</mark>.',
    lesson_note:
      'Alleen herkennen en begrijpen, op A2-niveau: wordt/worden + voltooid deelwoord in ' +
      'brieven van de gemeente, de school of de verhuurder (Uw pas wordt opgestuurd. De ' +
      'vuilnis wordt op dinsdag opgehaald.). De vraag die de cursist moet kunnen beantwoorden: ' +
      'wie doet het, en moet ík iets doen? (Uw pas wordt opgestuurd = de gemeente stuurt hem, ' +
      'jij hoeft niets te doen.) Geen verleden tijd van de lijdende vorm (werd, is ... ' +
      'geworden) en geen zinnen met door. Een tier-2-opgave mag een korte actieve zin laten ' +
      'omzetten of laten zeggen wie het doet, maar houd het eenvoudig.',
  },

  // ── Woorden verbuigen ─────────────────────────────────────────────────────
  {
    slug: 'lidwoorden', name_nl: 'de of het', group: 'woorden-verbuigen',
    kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 310,
    one_liner: 'Elk zelfstandig naamwoord heeft een lidwoord. Leer het bij het woord.',
    example_html: '<mark>de</mark> brief — <mark>het</mark> formulier',
  },
  {
    slug: 'meervoud', name_nl: 'Meervoud: -en, -s of -’s', group: 'woorden-verbuigen',
    kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 320,
    one_liner: 'Wanneer -en, wanneer -s, en wanneer een apostrof.',
    example_html: 'één brief — twee <mark>brieven</mark>',
  },
  {
    slug: 'bijvoeglijk-naamwoord', name_nl: 'een grote kast — een groot huis',
    group: 'woorden-verbuigen', kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 330,
    one_liner: 'Wanneer krijgt het woord een -e en wanneer niet?',
    example_html: 'een <mark>mooie</mark> tas — een <mark>mooi</mark> huis',
    lesson_note:
      'De regel: het bijvoeglijk naamwoord vóór het zelfstandig naamwoord krijgt een -e (een ' +
      'mooie dag, de mooie dag, het mooie huis, mooie huizen), behalve bij een het-woord met ' +
      'een, geen of zonder lidwoord (een mooi huis, geen groot probleem). Na het werkwoord ' +
      'nooit een -e (Het huis is mooi). Let op de spelling: groot → grote, wit → witte. Geen ' +
      'iets/niets + -s (dat is B1).',
  },
  {
    slug: 'vergrotende-trap', name_nl: 'groter, kleiner', group: 'woorden-verbuigen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_LEZEN, sort_order: 340,
    one_liner: 'Twee dingen vergelijken: -er plus dan.',
    example_html: 'Deze fiets is <mark>goedkoper dan</mark> die.',
  },
  {
    slug: 'overtreffende-trap', name_nl: 'het grootst, het beste',
    group: 'woorden-verbuigen', kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_LEZEN, sort_order: 350,
    one_liner: 'Eén ding is de nummer één: -st.',
    example_html: 'Dit is de <mark>snelste</mark> route.',
  },

  // ── Verwijzen ─────────────────────────────────────────────────────────────
  {
    slug: 'persoonlijk-vnw-onderwerp', name_nl: 'ik, jij, hij, ze, we', group: 'verwijzen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_LEZEN, sort_order: 410,
    one_liner: 'Wie doet het? Deze woordjes staan voor een naam.',
    example_html: 'Sara is ziek. <mark>Ze</mark> blijft thuis.',
  },
  {
    slug: 'persoonlijk-vnw-lijdend', name_nl: 'mij, jou, hem, haar, het',
    group: 'verwijzen', kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_LEZEN, sort_order: 420,
    one_liner: 'Wie of wat ondergaat het? Dan verandert het woordje van vorm.',
    example_html: 'Tim helpt <mark>mij</mark> met het formulier.',
  },
  {
    slug: 'bezittelijk-vnw', name_nl: 'mijn, jouw, zijn, haar, ons', group: 'verwijzen',
    kind: 'grammatica', onderdelen: IN_P, kern: KERN_P, sort_order: 425,
    one_liner: 'Van wie is het? Ons huis, maar onze auto.',
    example_html: 'Dat is <mark>mijn</mark> fiets en dat is <mark>haar</mark> tas.',
    lesson_note:
      'Behandel mijn, jouw/je, uw, zijn, haar, ons/onze, jullie, hun. Twee punten waar het ' +
      'misgaat: ons bij een het-woord (ons huis) en onze bij een de-woord of meervoud (onze ' +
      'auto, onze kinderen); en zijn (van een man) tegenover haar (van een vrouw). Gebruik ' +
      'situaties waarin de cursist over zichzelf en zijn gezin praat of schrijft.',
  },
  {
    slug: 'verwijswoorden', name_nl: 'hij, daar, deze, dit, die, dat', group: 'verwijzen',
    kind: 'grammatica', onderdelen: ['lezen', 'schrijven'], kern: ['lezen', 'schrijven'], sort_order: 426,
    one_liner: 'Een klein woord wijst terug naar iets wat al gezegd is. Naar wie of wat?',
    example_html: 'De bibliotheek is nieuw. <mark>Daar</mark> kun je gratis lezen.',
    lesson_note:
      'Twee delen. Eén: verwijswoorden die terugwijzen in een tekst — hij, ze, het, die, dat ' +
      'en daar wijzen naar iets uit een vorige zin, en de cursist moet zien naar wát. Twee: ' +
      'aanwijzende voornaamwoorden — deze en die bij een de-woord of meervoud (deze tafel, die ' +
      'stoelen), dit en dat bij een het-woord (dit huis, dat boek); deze/dit is dichtbij, ' +
      'die/dat is verder weg. Laat de koppeling met de en het zien. Zet in de opgaven korte ' +
      'teksten van twee of drie zinnen en vraag waar een woord naar verwijst.',
  },
  {
    slug: 'betrekkelijk-vnw', name_nl: 'de man die…, het huis dat…', group: 'verwijzen',
    kind: 'grammatica', onderdelen: ['lezen'], kern: GEEN_KERN, sort_order: 427,
    one_liner: 'die of dat vertelt iets meer over het woord ervoor.',
    example_html: 'De man <mark>die</mark> naast mij woont, heet Ahmed.',
    lesson_note:
      'Alleen die en dat als betrekkelijk voornaamwoord, op A2-niveau en vooral om te begrijpen: ' +
      'die na een de-woord of meervoud (de man die daar woont, de kinderen die buiten spelen), ' +
      'dat na een het-woord (het huis dat te koop is). Het werkwoord staat achteraan in dat ' +
      'stukje zin. De vraag die de cursist moet kunnen beantwoorden: over wie of wat gaat het ' +
      'stukje met die/dat? Geen wie, wat, waar of waarin — dat is B1.',
  },
  {
    slug: 'voorzetsels-plaats', name_nl: 'in, op, naast, langs', group: 'verwijzen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: GEEN_KERN, sort_order: 430,
    one_liner: 'Waar is het? Deze woordjes wijzen de plek of de route aan.',
    example_html: 'De vergaderzaal is <mark>naast</mark> de kantine.',
  },
  {
    slug: 'er-is-er-zijn', name_nl: 'er is, er zijn', group: 'verwijzen',
    kind: 'grammatica', onderdelen: ['spreken'], kern: ['spreken'], sort_order: 435,
    one_liner: 'Zeggen dat iets er is, en waar: er is een winkel naast het station.',
    example_html: '<mark>Er is</mark> een bakker in mijn straat. <mark>Er zijn</mark> twee scholen.',
    lesson_note:
      'Behandel er is (één ding) en er zijn (meer dingen), samen met een plaats: naast, bij, ' +
      'in, op, tegenover. Bijvoorbeeld: Er is een supermarkt naast het station. Er zijn veel ' +
      'bomen in het park. Ook de vraag: Is er een apotheek in de buurt? Gebruik situaties waarin ' +
      'de cursist zijn buurt, zijn huis of een plaatje beschrijft. De productieve opgaven zijn ' +
      'zinnen die de cursist zelf zou zeggen.',
  },
  {
    slug: 'frequentie', name_nl: 'altijd, vaak, soms, nooit', group: 'verwijzen',
    kind: 'grammatica', onderdelen: IN_ALLE, kern: KERN_RECEPTIEF, sort_order: 440,
    one_liner: 'Hoe vaak gebeurt het? Klein woord, groot verschil in betekenis.',
    example_html: 'De bus rijdt <mark>nooit</mark> op zondag.',
  },
  {
    slug: 'hoeveelheden', name_nl: 'minstens, maximaal, ongeveer', group: 'verwijzen',
    kind: 'grammatica', onderdelen: RECEPTIEF, kern: KERN_RECEPTIEF, sort_order: 450,
    one_liner: 'Hoeveel is het precies? Minstens tien is iets anders dan maximaal tien.',
    example_html: 'Je mag <mark>maximaal</mark> twee tassen meenemen.',
    lesson_note:
      'Behandel woorden die een hoeveelheid preciezer maken: minstens / minimaal (niet minder), ' +
      'maximaal / hoogstens (niet meer), ongeveer (bijna precies), allebei (de twee samen), de ' +
      'helft, meer / minder / evenveel. Zet minstens en maximaal naast elkaar met hetzelfde ' +
      'getal. Gebruik regels, prijzen en openingstijden uit folders en mededelingen, zodat de ' +
      'cursist moet uitrekenen of iets mag of niet.',
  },

  // ── Spelling & uitspraak ──────────────────────────────────────────────────
  {
    slug: 'klemtoon', name_nl: 'Waar ligt de klemtoon?', group: 'spelling-uitspraak',
    kind: 'grammatica', onderdelen: IN_KLANK, kern: KERN_KLANK, sort_order: 510,
    one_liner: 'Welk stukje van het woord zeg je harder? Dat helpt je bij het luisteren.',
    example_html: 'ge<mark>meen</mark>te — for<mark>mu</mark>lier',
  },
  {
    slug: 'lange-korte-klank', name_nl: 'man of maan', group: 'spelling-uitspraak',
    kind: 'grammatica', onderdelen: IN_LUISTER_P, kern: KERN_P_LUISTER, sort_order: 520,
    one_liner: 'Eén klinker of twee? En wat gebeurt er bij meervoud: f wordt v, s wordt z.',
    example_html: 'de brief — de <mark>brieven</mark>',
  },
];

/**
 * Welke concepten horen bij dit onderdeel?
 *
 * Dit is de *leeslijst* van één onderdeel: welke regels die cursus vraagt. Bewust niet "alle
 * 39" — zie de afweging bij `IN_ALLE` hierboven.
 */
export function conceptsFor(onderdeel) {
  return A2_CONCEPTS.filter(c => c.onderdelen.includes(onderdeel));
}

/**
 * De twee regels waar nog géén les voor geschreven is.
 *
 * Ze staan wél in de bibliotheek als concept en ze zijn kern bij de onderdelen waar ze horen,
 * maar blok B heeft er geen les voor — de conceptgroep `spelling-uitspraak` is überhaupt leeg.
 * Een kernregel zonder les is een gat, en dit is de plek waar dat gat staat opgeschreven in
 * plaats van dat het uit een filter valt. `bijvoeglijk-naamwoord` stond hier tot oktober 2026;
 * hij is nu les b37.
 */
export const RULES_WITHOUT_LESSON = ['klemtoon', 'lange-korte-klank'];

/**
 * De volgorde van blok B van A2 Lezen — en dus de lesslugs `b1-…` tot `b37-…`.
 *
 * ── WAAROM DIT EEN LIJST IS EN GEEN AFGELEIDE VOLGORDE ───────────────────────
 * Tot oktober 2026 was blok B gewoon `A2_CONCEPTS` min de regels zonder les, en kwam het
 * nummer in de slug uit de plaats in die lijst. Dat werkte zolang er niets bij kwam. Maar
 * voortgang, `review_status`, de narratie (`narration/<slug>.txt`) en de lesplaatjes
 * (`data/lesson-visuals.ts`) hangen aan die slugs: een nieuw concept middenin de bibliotheek
 * zou `b23-vergrotende-trap` stil hernummeren tot `b24-…`, en dat is in de database een nieuwe
 * les naast de oude, met de voortgang van de cursist op de verkeerde.
 *
 * Dus: de eerste 28 staan in hun oude volgorde en schuiven nooit, nieuwe regels komen
 * achteraan. De leesvolgorde in de cursus komt uit `data/grammar-syllabus.ts`, niet uit dit
 * nummer.
 */
export const RULES_HOME_ORDER = [
  // De oorspronkelijke 28 (september 2026). Niet verplaatsen.
  'hoofdzin-woordorde', 'inversie', 'voegwoorden-hoofdzin', 'bijzin-omdat-als', 'bijzin-dat-of',
  'om-te', 'vragen-maken', 'tegenwoordige-tijd', 'onregelmatige-tegenwoordige-tijd',
  'perfectum-regelmatig', 'perfectum-onregelmatig', 'hebben-of-zijn', 'verleden-tijd',
  'toekomende-tijd', 'gebiedende-wijs', 'scheidbare-werkwoorden', 'werkwoorden-zonder-ge',
  'modale-werkwoorden', 'wederkerende-werkwoorden', 'vaste-voorzetsels', 'lidwoorden',
  'meervoud', 'vergrotende-trap', 'overtreffende-trap', 'persoonlijk-vnw-onderwerp',
  'persoonlijk-vnw-lijdend', 'voorzetsels-plaats', 'frequentie',
  // De syllabus van oktober 2026 (`data/grammar-syllabus.ts`): b29 tot b37.
  'verwijswoorden', 'ontkenning', 'hoeveelheden', 'tijdsaanduidingen', 'betrekkelijk-vnw',
  'lijdende-vorm', 'bezittelijk-vnw', 'er-is-er-zijn', 'bijvoeglijk-naamwoord',
];

/**
 * De regels die als les in blok B van Lezen staan — het fysieke huis van álle taalregels.
 *
 * ── WAAROM DIT NIET `conceptsFor('lezen')` IS ────────────────────────────────
 * Tot 10-09 was dat wél zo, en dat werkte alleen door een toevalligheid: Lezen hing aan 28 van
 * de 31 regels, precies de 28 die een les hebben. Toen Lezen op 20 regels werd afgewogen zou
 * blok B dus acht lessen kwijtraken — lessen die Schrijven en Spreken nog nodig hebben, want
 * er is er maar één van elk. Eén cursus smaller maken mag de gedeelde voorraad niet slopen.
 *
 * Lidmaatschap is een keuze bij het *lezen* (`fetchRuleModules` per onderdeel), niet bij het
 * schrijven. Hier staat wat er ligt; daar staat wie het krijgt. De volgorde is
 * `RULES_HOME_ORDER`, en een grammaticaregel die daar niet in staat en ook niet in
 * `RULES_WITHOUT_LESSON` is een fout — luid, want anders valt hij stil uit blok B.
 */
export function rulesHomeConcepts() {
  const bySlug = new Map(A2_CONCEPTS.map(c => [c.slug, c]));
  for (const c of A2_CONCEPTS) {
    if (c.kind !== 'grammatica' || RULES_WITHOUT_LESSON.includes(c.slug)) continue;
    if (!RULES_HOME_ORDER.includes(c.slug)) {
      throw new Error(`regel "${c.slug}" staat niet in RULES_HOME_ORDER en niet in RULES_WITHOUT_LESSON`);
    }
  }
  return RULES_HOME_ORDER.map(slug => {
    const c = bySlug.get(slug);
    if (!c) throw new Error(`RULES_HOME_ORDER noemt "${slug}", maar dat concept bestaat niet`);
    return c;
  });
}
