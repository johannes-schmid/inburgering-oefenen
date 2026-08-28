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
 * De 31 concepten.
 *
 * `one_liner` is de regel onder de kaarttitel: kort, in A2-Nederlands, `je` en niet `u`.
 * `example_html` is het voorbeeldzinnetje op de kaart, met `<mark>` om precies het fragment
 * dat het concept toont — niet om de hele zin, want dan wijst de markering nergens naar.
 */
export const A2_CONCEPTS = [
  // ── Zinnen bouwen ─────────────────────────────────────────────────────────
  {
    slug: 'hoofdzin-woordorde', name_nl: 'De hoofdzin', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 10,
    one_liner: 'Het werkwoord staat op plaats twee. Dat verandert bijna nooit.',
    example_html: 'Ik <mark>werk</mark> op maandag in de winkel.',
  },
  {
    slug: 'inversie', name_nl: 'Inversie', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 20,
    one_liner: 'Begin je met tijd of plaats? Dan wisselen werkwoord en ik van plaats.',
    example_html: 'Morgen <mark>bel ik</mark> de gemeente.',
  },
  {
    slug: 'voegwoorden-hoofdzin', name_nl: 'en, maar, want, dus, of', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 30,
    one_liner: 'Twee hele zinnen aan elkaar. De woordorde blijft gewoon staan.',
    example_html: 'Ik ga naar huis, <mark>want</mark> ik ben ziek.',
  },
  {
    slug: 'bijzin-omdat-als', name_nl: 'omdat, als, toen', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 40,
    one_liner: 'Na deze woorden gaat het werkwoord naar achteren.',
    example_html: 'Ik blijf thuis <mark>omdat ik ziek ben</mark>.',
  },
  {
    slug: 'bijzin-dat-of', name_nl: 'Hij zegt dat… — Hij vraagt of…', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 50,
    one_liner: 'Iemand anders navertellen. Ook hier gaat het werkwoord naar achteren.',
    example_html: 'De dokter zegt <mark>dat ik moet rusten</mark>.',
  },
  {
    slug: 'om-te', name_nl: 'om … te', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 60,
    one_liner: 'Waarom doe je iets? Dan gebruik je om … te.',
    example_html: 'Ik ga naar de bibliotheek <mark>om</mark> een boek <mark>te</mark> lenen.',
  },
  {
    slug: 'vragen-maken', name_nl: 'Vragen maken', group: 'zinnen-bouwen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 70,
    one_liner: 'Met een vraagwoord, of met het werkwoord vooraan.',
    example_html: '<mark>Waar woont</mark> u? — <mark>Woont u</mark> in Utrecht?',
  },

  // ── Werkwoorden & tijd ────────────────────────────────────────────────────
  {
    slug: 'tegenwoordige-tijd', name_nl: 'Praten over nu', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: ALL, sort_order: 110,
    one_liner: 'ik werk, jij werkt, wij werken. Let op de t bij jij, hij en u.',
    example_html: 'Hij <mark>begrijpt</mark> de brief niet.',
  },
  {
    slug: 'onregelmatige-tegenwoordige-tijd', name_nl: 'zijn, hebben, gaan, kunnen',
    group: 'werkwoorden-tijd', kind: 'grammatica', onderdelen: ALL, sort_order: 120,
    one_liner: 'De vier werkwoorden die je het vaakst nodig hebt en die niet meedoen.',
    example_html: 'Ik <mark>ben</mark> ziek en ik <mark>heb</mark> koorts.',
  },
  {
    slug: 'perfectum-regelmatig', name_nl: 'Ik heb gewerkt', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: ALL, sort_order: 130,
    one_liner: 'Praten over gisteren: hebben of zijn plus ge-…-d of ge-…-t.',
    example_html: 'Ik <mark>heb</mark> een brief <mark>geschreven</mark>.',
  },
  {
    slug: 'perfectum-onregelmatig', name_nl: 'Ik heb gelezen', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: ALL, sort_order: 140,
    one_liner: 'Veel deelwoorden eindigen op -en en die moet je leren.',
    example_html: 'Zij <mark>heeft</mark> het formulier <mark>gelezen</mark>.',
  },
  {
    slug: 'hebben-of-zijn', name_nl: 'hebben of zijn?', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: ALL, sort_order: 150,
    one_liner: 'zijn bij beweging en verandering, hebben bij bijna al het andere.',
    example_html: 'Ik <mark>ben</mark> naar de gemeente <mark>gegaan</mark>.',
  },
  {
    slug: 'verleden-tijd', name_nl: 'Ik werkte, wij gingen', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: ALL, sort_order: 160,
    one_liner: 'De tweede manier om over vroeger te praten. Vaak in verhalen.',
    example_html: 'Vroeger <mark>woonde</mark> ik in Rotterdam.',
  },
  {
    slug: 'toekomende-tijd', name_nl: 'Praten over later', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: ALL, sort_order: 170,
    one_liner: 'gaan plus het hele werkwoord — of gewoon de tegenwoordige tijd.',
    example_html: 'Ik <mark>ga</mark> morgen <mark>koken</mark>.',
  },
  {
    slug: 'gebiedende-wijs', name_nl: 'Doe de deur dicht', group: 'werkwoorden-tijd',
    kind: 'grammatica', onderdelen: ALL, sort_order: 180,
    one_liner: 'Een opdracht of instructie: het werkwoord staat vooraan.',
    example_html: '<mark>Vul</mark> hier uw naam in.',
  },

  // ── Soorten werkwoorden ───────────────────────────────────────────────────
  {
    slug: 'scheidbare-werkwoorden', name_nl: 'Scheidbare werkwoorden',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: ALL, sort_order: 210,
    one_liner: 'Het woord valt in twee stukken en het stukje gaat naar achteren.',
    example_html: 'Ik <mark>bel</mark> je morgen <mark>op</mark>.',
  },
  {
    slug: 'werkwoorden-zonder-ge', name_nl: 'be-, ge-, her-, ver-, ont-',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: ALL, sort_order: 220,
    one_liner: 'Deze werkwoorden krijgen géén ge- in de voltooide tijd.',
    example_html: 'Ik heb dat niet zo <mark>bedoeld</mark>.',
  },
  {
    slug: 'modale-werkwoorden', name_nl: 'moeten, mogen, hoeven, kunnen, willen',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: ALL, sort_order: 230,
    one_liner: 'Verplicht, toegestaan of juist niet nodig. Let op het woordje te.',
    example_html: 'Je <mark>hoeft</mark> niet <mark>te</mark> betalen.',
  },
  {
    slug: 'wederkerende-werkwoorden', name_nl: 'Ik voel me niet goed',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: ALL, sort_order: 240,
    one_liner: 'Werkwoorden met me, je, zich erbij.',
    example_html: 'Ik moet <mark>me</mark> ziek melden.',
  },
  {
    slug: 'vaste-voorzetsels', name_nl: 'wachten op, zorgen voor',
    group: 'soorten-werkwoorden', kind: 'grammatica', onderdelen: ALL, sort_order: 250,
    one_liner: 'Sommige werkwoorden hebben altijd hetzelfde voorzetsel.',
    example_html: 'Ik <mark>wacht op</mark> de uitslag.',
  },

  // ── Woorden verbuigen ─────────────────────────────────────────────────────
  {
    slug: 'lidwoorden', name_nl: 'de of het', group: 'woorden-verbuigen',
    kind: 'grammatica', onderdelen: ['lezen', ...PRODUCTIEF], sort_order: 310,
    one_liner: 'Elk zelfstandig naamwoord heeft een lidwoord. Leer het bij het woord.',
    example_html: '<mark>de</mark> brief — <mark>het</mark> formulier',
  },
  {
    slug: 'meervoud', name_nl: 'Meervoud: -en, -s of -’s', group: 'woorden-verbuigen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 320,
    one_liner: 'Wanneer -en, wanneer -s, en wanneer een apostrof.',
    example_html: 'één brief — twee <mark>brieven</mark>',
  },
  {
    slug: 'bijvoeglijk-naamwoord', name_nl: 'een grote kast — een groot huis',
    group: 'woorden-verbuigen', kind: 'grammatica', onderdelen: PRODUCTIEF, sort_order: 330,
    one_liner: 'Wanneer krijgt het woord een -e en wanneer niet?',
    example_html: 'een <mark>mooie</mark> tas — een <mark>mooi</mark> huis',
  },
  {
    slug: 'vergrotende-trap', name_nl: 'groter, kleiner', group: 'woorden-verbuigen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 340,
    one_liner: 'Twee dingen vergelijken: -er plus dan.',
    example_html: 'Deze fiets is <mark>goedkoper dan</mark> die.',
  },
  {
    slug: 'overtreffende-trap', name_nl: 'het grootst, het beste',
    group: 'woorden-verbuigen', kind: 'grammatica', onderdelen: ALL, sort_order: 350,
    one_liner: 'Eén ding is de nummer één: -st.',
    example_html: 'Dit is de <mark>snelste</mark> route.',
  },

  // ── Verwijzen ─────────────────────────────────────────────────────────────
  {
    slug: 'persoonlijk-vnw-onderwerp', name_nl: 'ik, jij, hij, ze, we', group: 'verwijzen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 410,
    one_liner: 'Wie doet het? Deze woordjes staan voor een naam.',
    example_html: 'Sara is ziek. <mark>Ze</mark> blijft thuis.',
  },
  {
    slug: 'persoonlijk-vnw-lijdend', name_nl: 'mij, jou, hem, haar, het',
    group: 'verwijzen', kind: 'grammatica', onderdelen: ALL, sort_order: 420,
    one_liner: 'Wie of wat ondergaat het? Dan verandert het woordje van vorm.',
    example_html: 'Tim helpt <mark>mij</mark> met het formulier.',
  },
  {
    slug: 'voorzetsels-plaats', name_nl: 'in, op, naast, langs', group: 'verwijzen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 430,
    one_liner: 'Waar is het? Deze woordjes wijzen de plek of de route aan.',
    example_html: 'De vergaderzaal is <mark>naast</mark> de kantine.',
  },
  {
    slug: 'frequentie', name_nl: 'altijd, vaak, soms, nooit', group: 'verwijzen',
    kind: 'grammatica', onderdelen: ALL, sort_order: 440,
    one_liner: 'Hoe vaak gebeurt het? Klein woord, groot verschil in betekenis.',
    example_html: 'De bus rijdt <mark>nooit</mark> op zondag.',
  },

  // ── Spelling & uitspraak ──────────────────────────────────────────────────
  {
    slug: 'klemtoon', name_nl: 'Waar ligt de klemtoon?', group: 'spelling-uitspraak',
    kind: 'grammatica', onderdelen: ['luisteren', 'spreken'], sort_order: 510,
    one_liner: 'Welk stukje van het woord zeg je harder? Dat helpt je bij het luisteren.',
    example_html: 'ge<mark>meen</mark>te — for<mark>mu</mark>lier',
  },
  {
    slug: 'lange-korte-klank', name_nl: 'man of maan', group: 'spelling-uitspraak',
    kind: 'grammatica', onderdelen: ['luisteren', ...PRODUCTIEF], sort_order: 520,
    one_liner: 'Eén klinker of twee? En wat gebeurt er bij meervoud: f wordt v, s wordt z.',
    example_html: 'de brief — de <mark>brieven</mark>',
  },
];

/**
 * Welke concepten horen bij dit onderdeel?
 *
 * Dit is wat de cursus van één onderdeel in blok B zet, en het is bewust niet "alle 31".
 */
export function conceptsFor(onderdeel) {
  return A2_CONCEPTS.filter(c => c.onderdelen.includes(onderdeel));
}
