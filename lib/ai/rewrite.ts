/**
 * Rewriting content that already exists, to a length the docent names.
 *
 * `suggest.ts` writes a *new* item from a blank screen. This one takes the fragment that is
 * already in the form and makes it longer or shorter — the commonest correction on this dataset,
 * because the machine-authored A2 and B1 texts run consistently short of the band under the field.
 *
 * The same line as `suggest.ts` and `author.ts`, and it is load-bearing: **this returns an object
 * to form fields and writes nothing.** `review_status` is untouched, `exam_publish_issues()` still
 * gates publishing, and the docent reads the rewrite before it is saved. That is what keeps
 * *"echt door een docent gevalideerd"* true.
 *
 * ## Two calls, deliberately separate
 * Lengthening a text can strand its questions: a fact an afleider depended on gets cut, or the
 * new paragraph makes a second option true as well. So `reviseQuestions` exists — but as its own
 * button and its own call, because the docent has to be able to accept a longer text and keep her
 * questions exactly as she wrote them. A rewrite that silently rewrote the answer key would be the
 * one change on this screen she could not see.
 *
 * ## The option count never changes here
 * `reviseQuestions` returns exactly the options each question already has, with the same labels.
 * Adding or removing a `question_options` row cascades `user_question_results.chosen_option_id`
 * to NULL and erases what past candidates picked (see `lib/admin/question-write.ts`), and that is
 * not a decision a length rewrite gets to make.
 */
import { generateObject } from 'ai';
import { z } from 'zod';
import { assertGatewayConfigured, GRADER_TEXT } from './gateway';
import { registerFor } from './level-register';
import { formatRange, formatRules, isSkillSlug, type Level } from '@/data/skills';
import {
  MAX_TARGET_WORDS,
  MIN_TARGET_WORDS,
  SPEECH_WPM,
  sentenceTarget,
} from '@/lib/admin/length-targets';
import { OPTION_LABELS } from '@/lib/admin/question-write';

export const REWRITE_MODEL = process.env.AI_AUTHOR_MODEL || GRADER_TEXT;

/** A full fragment plus every question on it is a bigger generation than one field. */
export const REWRITE_TIMEOUT_MS = 90_000;

/**
 * Low, and deliberately far below `suggest.ts`'s 0.9.
 *
 * A rewrite is not a second idea — it is *this* text at another length. The docent's subject,
 * names and facts have to survive, so the sampling should not go looking for alternatives.
 */
const REWRITE_TEMPERATURE = 0.3;

/** Re-exported so a server caller needs one import, not two. */
export { MIN_TARGET_WORDS, MAX_TARGET_WORDS };

const rewriteSchema = z.object({
  body_html: z
    .string()
    .describe('Alleen bij een tekstfragment: de herschreven tekst als <p>…</p>-alinea\'s. Anders leeg.'),
  script: z
    .string()
    .describe('Alleen bij een audiofragment: het herschreven script, één beurt per regel met hetzelfde sprekerlabel. Anders leeg.'),
  note: z.string().describe('Eén korte regel voor de docent: wat je hebt toegevoegd of weggelaten.'),
});

const revisionSchema = z.object({
  questions: z.array(
    z.object({
      sort_order: z.number().describe('Het nummer van de vraag zoals het is opgegeven.'),
      changed: z.boolean().describe('False als de vraag ongewijzigd goed blijft bij de nieuwe tekst.'),
      prompt: z.string(),
      explanation: z.string(),
      options: z.array(
        z.object({
          label: z.enum(OPTION_LABELS),
          body: z.string(),
          is_correct: z.boolean(),
        })
      ),
      reason: z.string().describe('Eén korte regel: waarom deze vraag wel of niet aangepast is.'),
    })
  ),
});

export type StimulusRewrite = z.infer<typeof rewriteSchema>;
export type QuestionRevision = z.infer<typeof revisionSchema>;

export type RewriteRequest = {
  level: Level;
  skill: string;
  kind: 'text' | 'audio';
  targetWords: number;
  currentWords: number;
  intro: string;
  title: string;
  /** The text as it stands: `body_html` for a leestekst, the script for a luisterfragment. */
  content: string;
  /** One optional line from the docent: "houd de telefoonnummers erin". */
  instruction?: string;
};

export type ReviseRequest = {
  level: Level;
  skill: string;
  /** The fragment as it now reads, after the rewrite. Plain text or script. */
  stimulusText: string;
  questions: {
    sort_order: number;
    prompt: string;
    explanation: string;
    options: { label: string; body: string; is_correct: boolean }[];
  }[];
};

/** The house rules both calls share: register, and the level's sentence length. */
function houseRules(level: Level, skill: string): string[] {
  const lines = [
    ...registerFor(level).authoring,
    `- Gemiddeld hooguit ${sentenceTarget(level)} woorden per zin.`,
    '- Nederlands van Nederland, geen Vlaamse varianten.',
    '- Geen ambtelijk jargon, geen spreekwoorden, geen woordgrappen.',
    '',
    `Onderdeel: ${skill}.`,
  ];
  const rules = isSkillSlug(skill) ? formatRules(level, skill) : null;
  if (rules?.options) lines.push(`Een vraag heeft ${formatRange(rules.options)} antwoordopties.`);
  return lines;
}

/**
 * Make the fragment longer or shorter, keeping it the same fragment.
 *
 * The word count is stated as a hard instruction *and* as the direction of travel, because a model
 * given only a number tends to rewrite from scratch at that length. What has to survive is the
 * docent's content: the situation, the names, the dates and the phone numbers her questions are
 * about.
 */
export async function rewriteStimulusLength(req: RewriteRequest): Promise<StimulusRewrite> {
  assertGatewayConfigured();

  const direction =
    req.targetWords > req.currentWords
      ? `De tekst is nu ${req.currentWords} woorden en moet naar ongeveer ${req.targetWords}. Maak hem dus LANGER.`
      : req.targetWords < req.currentWords
        ? `De tekst is nu ${req.currentWords} woorden en moet naar ongeveer ${req.targetWords}. Maak hem dus KORTER.`
        : `Houd de tekst op ongeveer ${req.targetWords} woorden en verbeter alleen de leesbaarheid.`;

  const shape =
    req.kind === 'text'
      ? [
          'Geef de herschreven tekst terug in body_html, als <p>…</p>-alinea\'s. Laat script leeg.',
          'Behoud bestaande opsommingen als <ul><li>…</li></ul> en koppen als <h3>.',
        ]
      : [
          'Geef het herschreven script terug in script. Laat body_html leeg.',
          'Gebruik exact dezelfde sprekerlabels als in het huidige script, in dezelfde vorm ("A: …").',
          'Voeg geen sprekers toe en haal er geen weg — de stemcasting hangt eraan.',
          `Voorgelezen loopt dit ongeveer ${SPEECH_WPM} woorden per minuut, sprekerlabels niet meegerekend.`,
        ];

  const { object } = await generateObject({
    model: REWRITE_MODEL,
    schema: rewriteSchema,
    temperature: REWRITE_TEMPERATURE,
    abortSignal: AbortSignal.timeout(REWRITE_TIMEOUT_MS),
    prompt: [
      ...houseRules(req.level, req.skill),
      '',
      'Je herschrijft een bestaand examenfragment naar een andere lengte. Het blijft hetzelfde',
      'fragment: dezelfde situatie, dezelfde personen, dezelfde namen, data, tijden, bedragen en',
      'telefoonnummers. Verzin geen nieuwe feiten als je moet inkorten, en laat geen bestaand feit',
      'weg dat een vraag erover onmogelijk zou maken.',
      '',
      direction,
      'Langer maken doe je met meer concrete details bij wat er al staat, niet met vulzinnen of',
      'herhaling. Korter maken doe je door bijzaken weg te laten, niet door feiten samen te persen',
      'in langere zinnen.',
      '',
      ...shape,
      req.instruction?.trim() ? `\nExtra instructie van de docent: ${req.instruction.trim()}` : '',
      '',
      req.intro.trim() ? `De inleiding boven het fragment (niet meerekenen, niet wijzigen): ${req.intro.trim()}` : '',
      req.title.trim() ? `De titel (niet meerekenen): ${req.title.trim()}` : '',
      '',
      'Het huidige fragment:',
      req.content,
    ].filter(Boolean).join('\n'),
  });

  return object;
}

/**
 * Check the questions against the rewritten fragment and adjust only what no longer works.
 *
 * `changed: false` is the answer to want and is stated as such in the prompt — a pass that
 * rewrites all three questions because the text got longer is a pass that throws the docent's
 * work away. The caller drops unchanged questions on the floor rather than patching them with an
 * identical value, so an unchanged question keeps its own option ids.
 */
export async function reviseQuestions(req: ReviseRequest): Promise<QuestionRevision> {
  assertGatewayConfigured();

  const { object } = await generateObject({
    model: REWRITE_MODEL,
    schema: revisionSchema,
    temperature: REWRITE_TEMPERATURE,
    abortSignal: AbortSignal.timeout(REWRITE_TIMEOUT_MS),
    prompt: [
      ...houseRules(req.level, req.skill),
      '',
      'Het fragment hieronder is net herschreven. Controleer per vraag of hij nog klopt bij deze',
      'tekst: is het juiste antwoord er nog uit te halen, en zijn de afleiders nog fout?',
      '',
      'Laat een vraag die het nog goed doet ONGEWIJZIGD: zet changed op false en geef de vraag',
      'terug zoals hij is. Pas alleen aan wat door de nieuwe tekst niet meer werkt — bijvoorbeeld',
      'een afleider die nu ook waar is, of een vraag over een detail dat is weggehaald.',
      '',
      `Geef per vraag exact dezelfde labels terug (${OPTION_LABELS.join(', ')} zoals opgegeven) en`,
      'exact evenveel opties als de vraag nu heeft. Precies één optie is juist.',
      'Het antwoord moet uit het fragment te halen zijn, niet uit algemene kennis.',
      '',
      'Het herschreven fragment:',
      req.stimulusText,
      '',
      'De vragen:',
      ...req.questions.map(q =>
        [
          `Vraag ${q.sort_order}: ${q.prompt}`,
          ...q.options.map(o => `  ${o.label}${o.is_correct ? ' (juist)' : ''}: ${o.body}`),
          q.explanation ? `  Uitleg: ${q.explanation}` : '',
        ].filter(Boolean).join('\n')
      ),
    ].join('\n'),
  });

  return object;
}
