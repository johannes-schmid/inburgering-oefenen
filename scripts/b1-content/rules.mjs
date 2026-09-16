/**
 * B1's exam shape as constants, with no dependency on the dataset.
 *
 * Split out of `index.mjs` for one reason: `author.mjs` needs the numbers in order to *write*
 * the content, and `index.mjs` imports the generated dataset in order to *check* it. One module
 * holding both means the authoring engine cannot load until the content it is supposed to
 * produce already exists.
 *
 * These mirror `exam_formats` / `exam_task_rules` at B1 (see
 * `supabase/migrations/20260821090000_b1_exam_structure.sql`) and `RULES` / `TASK_RULES` in
 * `data/skills.ts`. All four change in one commit — the rule CLAUDE.md sets for these mirrors.
 */
export const EXAM_COUNT = 10;
export const SKILLS = ['lezen', 'luisteren', 'schrijven', 'spreken'];

/** Mirrors `exam_formats` for (b1, skill). */
export const FORMAT = {
  lezen: {
    itemCount: 35,
    durationSeconds: 6600,
    stimulusCount: 6,
    questionsPerStimulus: [4, 7],
    options: [3, 4],
    /** Not a database rule — a length band for the authored tekst, so B1 does not read as A2. */
    words: [330, 780],
  },
  /**
   * Luisteren, geteld op de openbare examens Luisteren I van 2023, 2024 en 2025.
   *
   * `itemCount` 39 en `textCount` 6 zijn een besluit van de eigenaar, geen gemiddelde: DUO
   * telde 38, 38 en 39 vragen over vijf tot zeven teksten, waarvan er één of twee **video**
   * zijn. `stimuli.kind` kent geen `'video'` en dat blijft zo, dus onze zesde tekst is audio.
   *
   * `stimulusCount` is 39 en niet 6: één fragment draagt precies één vraag, en dat fragment is
   * de stimulus. Een tekst is een heel interview dat in 5 tot 9 van die fragmenten is geknipt —
   * een groep in de authoring, geen rij in de database.
   *
   * `seconds` en `words` horen bij elkaar: bij ons gemeten tempo van ongeveer 220 wpm hoort
   * 90–240 woorden bij 35–95 seconden. DUO's eigen fragmenten waren 32–98 s (mediaan ~58).
   */
  luisteren: {
    itemCount: 39,
    durationSeconds: 5400,
    stimulusCount: 39,
    questionsPerStimulus: [1, 1],
    options: [3, 3],
    textCount: 6,
    fragmentsPerText: [5, 9],
    words: [90, 240],
    seconds: [35, 95],
  },
  schrijven: { itemCount: 12, durationSeconds: 6000 },
  spreken: { itemCount: 16, durationSeconds: 1800, partCount: 2, itemsPerPart: 8 },
};

/**
 * Mirrors `exam_task_rules` for (b1, schrijven).
 *
 * `perExam` maxima overlap deliberately: DUO draws the four long opdrachten from a wider pool
 * than any one exam uses, so the mix is checked and the order is not. What pins the total to
 * twelve is `FORMAT.schrijven.itemCount`.
 */
export const TASK_RULES = {
  sentence_completion: { min: 8, max: 8 },
  form: { min: 1, max: 1 },
  email: { min: 0, max: 2, bullets: [4, 6] },
  letter: { min: 0, max: 2, bullets: [4, 6] },
  picture_report: { min: 0, max: 1, bullets: [4, 6], images: 3 },
  data_text: { min: 0, max: 1, bullets: [3, 5] },
};

/** The long opdrachten — everything that is not one of the eight sentence completions. */
export const LONG_CATEGORIES = ['form', 'email', 'letter', 'picture_report', 'data_text'];

/** Image count per Spreken category — a hard publish error when it does not match. */
export const SPREKEN_IMAGES = { none: 0, react: 1, describe: 1, choose: 2, cover_all: 3 };

/** Mirrors `exam_task_rules` for (b1, spreken): a per-exam quota per picture rule. */
export const SPREKEN_QUOTA = {
  none: [4, 7],
  react: [2, 4],
  describe: [1, 3],
  choose: [1, 3],
  cover_all: [2, 4],
};

/** `sections.slug` for (b1, lezen). A slug that is not here resolves to NULL and warns. */
export const SECTION_SLUGS = [
  'website',
  'studieboek',
  'folder',
  'artikel',
  'regels',
  'brief',
  'advertentie',
  'formulier-lezen',
];

/**
 * `sections.slug` voor (b1, luisteren) — de tekstsoort-as die DUO bij Luisteren hanteert, en
 * een andere as dan die van Lezen. Bij A2 is het de *vorm* (gesprek, mededeling); bij B1
 * Luisteren is het de *bedoeling* van de spreker, en dat is wat de vragen toetsen.
 */
export const LUISTEREN_SECTION_SLUGS = [
  'informatief',
  'beschouwend',
  'persuasief',
  'instructief',
];
