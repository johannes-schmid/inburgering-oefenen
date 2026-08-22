/**
 * Draft rubrics for B1, minted when a category has none.
 *
 * ## Why these exist at all
 * `open_tasks.rubric_id IS NULL` is a blocking publish error, and at B1 *no* rubric existed for
 * any category — so without this the whole level would refuse to publish. The seeder mints a
 * draft rather than failing the onderdeel, and says so loudly on every run.
 *
 * ## They are drafts, and the word matters
 * `system_prompt` carries `DRAFT_MARKER`, which is the only place a grader or the docent can
 * learn that these anchors were not written by her. **Rewrite them in `/admin/rubrics` before a
 * grade counts.** A draft rubric that quietly became the live grading standard is the failure
 * this product cannot afford: the mark it returns looks entirely legitimate.
 *
 * ## Why B1's anchors are not A2's with the numbers moved
 * A rubric's anchors define what a score of 2 *means*, and "voldoende grammatica" is a
 * different bar at B1 than at A2 — which is why `rubrics` is keyed by level and why
 * `fetchFewShot` and `resolveRubric` are both level-scoped (CLAUDE.md, "lib/ai/level-register.ts
 * is the only place a level's register is described"). Grading a B1 candidate against A2
 * expectations returns a confident, plausible, wrong mark and raises no error anywhere.
 *
 * So the anchors below describe B1 behaviour: samenhang across paragraphs rather than
 * sentence-level correctness, register held consistently, verbanden made explicit, and — for
 * Schrijven — the *doel* of the text actually achieved, which is what DUO's B1 opdrachten state
 * in so many words ("Het doel van de tekst is …").
 *
 * The duplication with `lib/rubric-templates.ts` is deliberate and annoying, for the reason the
 * A2 seeder records: this is a `.mjs` script and cannot import a `.ts` module without a build
 * step.
 */

export const DRAFT_MARKER =
  'Conceptrubriek voor B1, aangemaakt door scripts/seed-b1-content.mjs. Niet door de docent ' +
  'geschreven — herschrijf de criteria in /admin/rubrics voordat een cijfer meetelt. De ' +
  'ankers beschrijven B1-gedrag en zijn niet van A2 overgenomen.';

/** Shared by every Schrijven category at B1. */
const WRITING_BASE = [
  ['doel', 'Doel en effect', [
    'De tekst bereikt het doel niet; de lezer weet niet wat er van hem gevraagd wordt.',
    'Het doel is te raden, maar de tekst maakt het niet duidelijk.',
    'Het doel is duidelijk, al moet de lezer op een enkel punt zelf aanvullen.',
    'De tekst bereikt het doel: de lezer weet wat er bedoeld wordt en wat er verwacht wordt.',
  ]],
  ['inhoud', 'Inhoud en volledigheid', [
    'De meeste inhoudspunten ontbreken of gaan niet over de opdracht.',
    'Enkele inhoudspunten zijn behandeld, maar te kort om te overtuigen.',
    'Bijna alle inhoudspunten zijn behandeld en toegelicht.',
    'Alle inhoudspunten zijn behandeld en waar gevraagd onderbouwd met redenen of voorbeelden.',
  ]],
  ['samenhang', 'Opbouw en samenhang', [
    'Losse zinnen zonder opbouw; de lezer moet de lijn zelf maken.',
    'Enige ordening, maar verbanden ontbreken en alinea\'s lopen door elkaar.',
    'Een duidelijke opbouw met verbindingswoorden; een enkele sprong.',
    'Heldere opbouw in alinea\'s, met verbanden die de lezer meenemen (omdat, daarom, hoewel).',
  ]],
  ['woordgebruik', 'Woordgebruik en register', [
    'Te weinig woorden om de boodschap over te brengen.',
    'Beperkte woordenschat; het register wisselt (u en je door elkaar).',
    'Voldoende woorden voor het onderwerp; het register is grotendeels consistent.',
    'Passende woorden voor het onderwerp, en een register dat bij de lezer past en dat vasthoudt.',
  ]],
  ['grammatica', 'Grammatica en spelling', [
    'Zo veel fouten dat de tekst niet te volgen is.',
    'Veel fouten in eenvoudige zinnen; de lezer moet vaak teruglezen.',
    'Eenvoudige zinnen zijn correct; in langere zinnen zitten fouten die het begrip niet hinderen.',
    'Ook samengestelde zinnen zijn overwegend correct; fouten zijn incidenteel.',
  ]],
];

/** Shared by every Spreken category at B1. */
const SPEAKING_BASE = [
  ['inhoud', 'Inhoud', [
    'Geen antwoord, of een antwoord dat niet over de opdracht gaat.',
    'Antwoordt met een paar woorden; te weinig informatie voor de opdracht.',
    'Antwoordt op de opdracht; een reden of uitwerking meer zou het afmaken.',
    'Antwoordt volledig op de opdracht, met de gevraagde redenen of uitleg.',
  ]],
  ['samenhang', 'Samenhang', [
    'Losse woorden, geen samenhang.',
    'Losse zinnen naast elkaar, zonder verband.',
    'De zinnen hangen samen; de overgangen zijn soms abrupt.',
    'Een samenhangend antwoord met verbindingswoorden en een duidelijke lijn.',
  ]],
  ['woordgebruik', 'Woordgebruik en register', [
    'Te weinig woorden om de boodschap over te brengen.',
    'Zeer beperkte woordenschat; verkeerde woordkeuze hindert het begrip.',
    'Voldoende woorden voor het onderwerp; soms een onhandige keuze.',
    'Passende woorden, en een register dat past bij de persoon die wordt aangesproken.',
  ]],
  ['grammatica', 'Grammatica', [
    'Losse woorden, geen zinnen.',
    'Veel fouten in eenvoudige zinnen; de luisteraar moet raden.',
    'Eenvoudige zinnen zijn correct; langere zinnen bevatten fouten.',
    'Ook langere zinnen zijn overwegend correct; fouten zijn incidenteel.',
  ]],
  ['verstaanbaarheid', 'Verstaanbaarheid en uitspraak', [
    'Grotendeels onverstaanbaar.',
    'Losse woorden zijn te herkennen; de luisteraar moet veel moeite doen.',
    'Goed te volgen met een duidelijk accent; enkele woorden zijn onduidelijk.',
    'Duidelijk te begrijpen; een accent hindert het begrip niet.',
  ]],
  ['vloeiendheid', 'Vloeiendheid', [
    'Bijna geen aaneengesloten spraak.',
    'Zeer aarzelend; lange stiltes en veel herstarts.',
    'Aarzelt bij het formuleren, maar komt er zelf uit.',
    'Spreekt vlot genoeg om zonder inspanning gevolgd te kunnen worden.',
  ]],
];

/**
 * The one criterion that is specific to a category — what makes *this* opgave this opgave.
 *
 * Without it every category would grade identically and the whole point of keying rubrics by
 * category would be lost: a `cover_all` answer that ignores two of the three plaatjes has to be
 * markable as such, and "inhoud" alone cannot say that.
 */
const EXTRA = {
  sentence_completion: ['aansluiting', 'Aansluiting op de gegeven tekst', [
    'De aanvulling sluit niet aan; de zin loopt niet door.',
    'De zin loopt grammaticaal door, maar past inhoudelijk niet bij het bericht.',
    'De aanvulling past, maar voegt weinig informatie toe.',
    'De aanvulling maakt de zin correct af, past bij de rest van het bericht en voegt de nodige informatie toe.',
  ]],
  email: ['conventies', 'E-mailconventies', [
    'Geen aanhef, geen afsluiting, geen leesbare indeling.',
    'Aanhef of afsluiting ontbreekt, of past niet bij de ontvanger.',
    'Aanhef en afsluiting zijn aanwezig en passend; de indeling kan beter.',
    'Aanhef, afsluiting en indeling passen bij de ontvanger en bij het doel van de e-mail.',
  ]],
  letter: ['conventies', 'Briefconventies', [
    'Geen enkele briefconventie gevolgd.',
    'Aanhef of afsluiting ontbreekt, of de toon past niet bij een brief.',
    'De brief heeft een aanhef, een afsluiting en alinea\'s; de toon wisselt soms.',
    'De brief volgt de conventies en houdt een formele toon vast die bij de ontvanger past.',
  ]],
  form: ['volledigheid', 'Volledigheid van de antwoorden', [
    'De meeste vragen zijn niet of met één woord beantwoord.',
    'De vragen zijn kort beantwoord; de gevraagde uitleg ontbreekt.',
    'Bijna alle vragen zijn beantwoord én toegelicht.',
    'Elke vraag is beantwoord en waar gevraagd toegelicht met een reden.',
  ]],
  picture_report: ['plaatjes', 'Gebruik van de plaatjes', [
    'De plaatjes zijn niet gebruikt.',
    'Eén plaatje is gebruikt; de rest van het verslag staat er los van.',
    'Alle plaatjes komen terug, maar het verslag is zonder de plaatjes niet goed te volgen.',
    'Alle plaatjes zijn gebruikt en het verslag is ook zonder de plaatjes te begrijpen.',
  ]],
  data_text: ['cijfers', 'Gebruik van de tabel of grafiek', [
    'De cijfers zijn niet gebruikt.',
    'Er wordt naar de cijfers verwezen, maar ze worden verkeerd gelezen.',
    'De cijfers worden correct gebruikt, maar niet uitgelegd of gewogen.',
    'De cijfers worden correct gebruikt, in woorden uitgelegd en gebruikt om het advies te onderbouwen.',
  ]],
  speaking_react: ['reactie', 'Reactie op de situatie', [
    'Reageert niet op wat er gezegd wordt.',
    'Reageert, maar de reactie past niet bij de situatie.',
    'Reageert passend, maar erg kort of algemeen.',
    'Reageert passend en volledig op wat er gezegd wordt, en past de toon aan de spreker aan.',
  ]],
  speaking_describe: ['plaatje', 'Gebruik van het plaatje', [
    'Het plaatje wordt niet gebruikt.',
    'Noemt iets van het plaatje, maar gebruikt het niet in het antwoord.',
    'Gebruikt het plaatje, maar laat bruikbare informatie liggen.',
    'Gebruikt het plaatje volledig en bouwt het antwoord erop.',
  ]],
  speaking_choose: ['keuze', 'Keuze en onderbouwing', [
    'Maakt geen keuze.',
    'Maakt een keuze zonder reden.',
    'Maakt een keuze met één reden.',
    'Maakt een duidelijke keuze en onderbouwt die met minstens twee redenen die bij de plaatjes passen.',
  ]],
  speaking_cover_all: ['plaatjes', 'Gebruik van alle plaatjes', [
    'Geen van de plaatjes wordt gebruikt.',
    'Eén plaatje wordt gebruikt, de andere niet.',
    'De meeste plaatjes komen aan de orde, één blijft liggen.',
    'Alle plaatjes komen aan de orde, in een logische volgorde en met verband ertussen.',
  ]],
  speaking_none: ['onderbouwing', 'Onderbouwing van de mening', [
    'Geeft geen mening.',
    'Geeft een mening zonder reden.',
    'Geeft een mening met één reden.',
    'Geeft een duidelijke mening en onderbouwt die met meer dan één reden.',
  ]],
};

/** The criteria for one (skill, category) at B1: the shared base plus the category's own. */
export function draftCriteria(skill, category) {
  const base = skill === 'schrijven' ? WRITING_BASE : SPEAKING_BASE;
  const extra = EXTRA[category];
  const rows = extra ? [...base, extra] : base;
  return rows.map(([key, criterion, anchors]) => ({
    key,
    criterion,
    anchors: { 0: anchors[0], 1: anchors[1], 2: anchors[2], 3: anchors[3] },
  }));
}
