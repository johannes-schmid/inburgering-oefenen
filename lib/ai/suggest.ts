/**
 * Whole-item suggestions — "magisch invullen" — grounded in the content that already exists.
 *
 * `author.ts` drafts **one field** of an item the docent is already looking at. This drafts a
 * **whole item from a blank screen**: a fragment with its intro, title and text or script, or a
 * question with its explanation and options. Either from nothing at all, or from one line of
 * scenario ("iets over een afspraak bij de huisarts").
 *
 * ## The same line as `author.ts`, and it is load-bearing
 * This returns an object to *form fields*. It writes nothing, it never touches `review_status`,
 * and `exam_publish_issues()` still gates publishing. *"Echt door een docent gevalideerd"* holds
 * because nothing reaches a candidate the docent has not accepted — not because no model ever
 * saw the text. If a caller of this file ever writes straight to the database, that claim breaks.
 *
 * ## Why it reads the database rather than just prompting harder
 * "Write an A2 reading text" gets an A2-ish text in a model's own register. The docent's existing
 * fragments *are* the register: her sentence length, her subject matter, the way her afleiders
 * are wrong. So every call is few-shot on real rows at the same (level, skill) — see
 * `suggest-examples.ts` — and is told the existing vraagzinnen explicitly, so the suggestion is a
 * *new* item rather than the fourth rewrite of the one about the tandarts.
 *
 * The structure rules come from `data/skills.ts` (`RULES`, mirroring `exam_formats`), so a
 * suggestion arrives already the right shape: 3 or 4 options, a script long enough for the
 * audio-length band. A NULL rule means unverified and is simply not stated — the same
 * convention the validator uses, for the same reason.
 */
import { generateObject } from 'ai';
import { z } from 'zod';
import { assertGatewayConfigured, GRADER_TEXT } from './gateway';
import { registerFor } from './level-register';
import { formatRules, formatRange, isSkillSlug, type Level } from '@/data/skills';
import { VOICES, type VoiceKey } from '@/lib/tts-voices';
import type { SuggestExamples } from './suggest-examples';

export const SUGGEST_MODEL = process.env.AI_AUTHOR_MODEL || GRADER_TEXT;

/** Longer than a single-field draft: a fragment plus its options is a bigger generation. */
export const SUGGEST_TIMEOUT_MS = 60_000;

/**
 * High, deliberately, and higher than `author.ts`'s 0.6.
 *
 * The whole value of this button is that pressing it twice offers two different scenarios. A
 * fragment suggestion that comes back near-identical each time is a blank page with extra steps.
 */
const SUGGEST_TEMPERATURE = 0.9;

export type StimulusKind = 'text' | 'audio' | 'image';

const VOICE_KEYS = Object.keys(VOICES) as VoiceKey[];

const stimulusSchema = z.object({
  intro: z
    .string()
    .describe('Eén regel die de situatie neerzet, zoals "Jasper krijgt een e-mail van zijn collega."'),
  title: z.string().describe('Korte titel. Mag leeg zijn als een titel niets toevoegt.'),
  body_html: z
    .string()
    .describe('Alleen bij een tekstfragment: de tekst als <p>…</p>-alinea\'s. Anders een leeg veld.'),
  script: z
    .string()
    .describe(
      'Alleen bij een audiofragment: één beurt per regel met een sprekerlabel, "A: …". Anders leeg.'
    ),
  voice_cast: z
    .array(
      z.object({
        speaker: z.string().describe('Het sprekerlabel precies zoals het in het script staat, bijv. "A".'),
        voice: z.enum(VOICE_KEYS as [VoiceKey, ...VoiceKey[]]),
      })
    )
    .describe('Alleen bij audio: één stem per spreker, passend bij het geslacht uit het script.'),
  image_alt: z
    .string()
    .describe('Alleen bij een afbeeldingsfragment: beschrijf welke afbeelding de docent moet zoeken.'),
  section_id: z
    .number()
    .nullable()
    .describe('Het id van de best passende tekstsoort uit de gegeven lijst, of null.'),
  rationale: z.string().describe('Eén korte regel voor de docent: wat dit fragment toetst.'),
});

const questionSchema = z.object({
  prompt: z.string().describe('De vraagzin.'),
  explanation: z
    .string()
    .describe('Twee of drie korte zinnen: waarom het juiste antwoord juist is, met "je".'),
  options: z
    .array(
      z.object({
        label: z.enum(['A', 'B', 'C', 'D']),
        body: z.string(),
        is_correct: z.boolean(),
      })
    )
    .describe('Precies één optie is juist; de andere zijn aannemelijke afleiders.'),
  rationale: z.string().describe('Eén korte regel voor de docent: waarom de afleiders fout zijn.'),
});

export type StimulusSuggestion = z.infer<typeof stimulusSchema>;
export type QuestionSuggestion = z.infer<typeof questionSchema>;

export type SuggestRequest = {
  level: Level;
  skill: string;
  /** One line from the docent, or nothing at all. Both are supported on purpose. */
  scenario?: string;
  examples: SuggestExamples;
};

export type StimulusRequest = SuggestRequest & {
  kind: StimulusKind;
  /** The tekstsoorten of this (level, skill), so the suggestion can pick one. */
  sections: { id: number; name_nl: string }[];
};

export type QuestionRequest = SuggestRequest & {
  /** The fragment the question hangs off. A question without one is not answerable. */
  stimulusText: string;
};

/** The shared preamble: register, house rules, and what already exists. */
function preamble(req: SuggestRequest): string[] {
  const lines = [
    ...registerFor(req.level).authoring,
    '- Nederlands van Nederland, geen Vlaamse varianten.',
    '- Geen ambtelijk jargon, geen spreekwoorden, geen woordgrappen.',
    '- Alledaagse Nederlandse namen en plaatsen. Geen bestaande merken of echte personen.',
    '',
    `Onderdeel: ${req.skill}.`,
  ];

  const rules = isSkillSlug(req.skill) ? formatRules(req.level, req.skill) : null;
  if (rules?.options) {
    lines.push(`Een vraag heeft ${formatRange(rules.options)} antwoordopties.`);
  }
  if (rules?.audioSeconds) {
    lines.push(
      `Een fragment duurt voorgelezen ${formatRange(rules.audioSeconds)} seconden — schrijf een ` +
        'script van die lengte.'
    );
  }
  if (rules?.questionsPerStimulus) {
    lines.push(
      `Bij één fragment horen ${formatRange(rules.questionsPerStimulus)} vragen, dus het fragment ` +
        'moet genoeg te vragen overhouden.'
    );
  }

  if (req.examples.items.length) {
    lines.push(
      '',
      'Dit is bestaand materiaal van de docent. Neem de toon, zinslengte en soort onderwerpen ' +
        'hiervan over. Kopieer de inhoud niet.',
      ...req.examples.items.map((ex, i) => `\nVoorbeeld ${i + 1}:\n${ex}`)
    );
  }

  // The anti-duplication list is prompts only: they are short, and a repeated *subject* is fine
  // (ten exams about doctors is realistic) while a repeated *question* is a bug the docent has to
  // notice herself.
  if (req.examples.existingPrompts.length) {
    lines.push(
      '',
      'Deze vragen bestaan al. Verzin iets anders — een ander onderwerp of een andere invalshoek:',
      ...req.examples.existingPrompts.map(p => `- ${p}`)
    );
  }

  lines.push(
    '',
    req.scenario?.trim()
      ? `De docent vraagt specifiek om: ${req.scenario.trim()}`
      : 'De docent heeft geen onderwerp opgegeven. Kies zelf een alledaagse situatie die nog niet ' +
        'in de voorbeelden hierboven voorkomt.'
  );

  return lines;
}

/** Suggest a whole fragment. Fields that do not apply to `kind` come back empty. */
export async function suggestStimulus(req: StimulusRequest): Promise<StimulusSuggestion> {
  assertGatewayConfigured();

  const shape =
    req.kind === 'text'
      ? 'Schrijf een leestekst: vul intro, title en body_html. Laat script, voice_cast en image_alt leeg.'
      : req.kind === 'audio'
        ? 'Schrijf een luisterfragment: vul intro, title, script en voice_cast. Laat body_html en ' +
          'image_alt leeg. Maak via namen en aanspreekvormen duidelijk of een spreker een man of ' +
          'een vrouw is, want daar wordt de stem op gekozen — en cast elke spreker met een stem ' +
          'van het bijbehorende geslacht. Twee sprekers krijgen nooit dezelfde stem.'
        : 'Beschrijf een afbeeldingsfragment: vul intro, title en image_alt met wat er op de ' +
          'afbeelding te zien moet zijn. Laat body_html, script en voice_cast leeg. Wij zoeken de ' +
          'afbeelding er zelf bij.';

  const sections = req.sections.length
    ? [
        '',
        'Kies de best passende tekstsoort en geef het id terug in section_id:',
        ...req.sections.map(s => `- ${s.id}: ${s.name_nl}`),
      ]
    : ['', 'Er zijn geen tekstsoorten om uit te kiezen. Geef null terug in section_id.'];

  const { object } = await generateObject({
    model: SUGGEST_MODEL,
    schema: stimulusSchema,
    temperature: SUGGEST_TEMPERATURE,
    abortSignal: AbortSignal.timeout(SUGGEST_TIMEOUT_MS),
    prompt: [...preamble(req), '', shape, ...sections].join('\n'),
  });

  return object;
}

/** Suggest one MCQ — vraagzin, uitleg and options — for a fragment that already exists. */
export async function suggestQuestion(req: QuestionRequest): Promise<QuestionSuggestion> {
  assertGatewayConfigured();

  const rules = isSkillSlug(req.skill) ? formatRules(req.level, req.skill) : null;
  const count = rules?.options ? rules.options[0] : 3;

  const { object } = await generateObject({
    model: SUGGEST_MODEL,
    schema: questionSchema,
    temperature: SUGGEST_TEMPERATURE,
    abortSignal: AbortSignal.timeout(SUGGEST_TIMEOUT_MS),
    prompt: [
      ...preamble(req),
      '',
      'Schrijf één meerkeuzevraag bij het fragment hieronder.',
      `Geef ${count} opties, gelabeld vanaf "A". Precies één is juist.`,
      'Het antwoord moet uit het fragment te halen zijn — niet uit algemene kennis.',
      'De afleiders komen uit hetzelfde fragment en zijn aannemelijk, niet flauw.',
      '',
      'Het fragment:',
      req.stimulusText,
    ].join('\n'),
  });

  return object;
}
