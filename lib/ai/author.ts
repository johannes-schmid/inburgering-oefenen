/**
 * Drafting assistance for the docent's authoring screens.
 *
 * ## This does not author exam content — it drafts, she decides
 * The product's only real claim is *"Echt door een docent gevalideerd, geen AI"*, so the line that
 * matters is not "no model ever touches the text", it is **nothing reaches a candidate without a
 * human having accepted it**. Everything here therefore:
 *
 *   - returns text to a *form field* rather than writing to the database,
 *   - never touches `review_status` — only the docent's own click moves an item to `validated`,
 *   - is limited to a fixed set of operations on content she is already looking at.
 *
 * `exam_publish_issues()` still gates publishing, so an item nobody validated cannot go live by
 * accident. If that ever stops being true, this file is where the problem started.
 *
 * The register is not a style preference here: an item written above its level tests the wrong
 * thing. Every prompt states the level, and `shorter`/`longer` state it again, because "make it
 * longer" is exactly the instruction that drifts vocabulary upward.
 *
 * The level comes from the caller (the exam being authored), never from a default buried in this
 * file — a B1 stimulus drafted against A2 rules is indistinguishable from a correct one until a
 * candidate sits the exam.
 */
import { generateText } from 'ai';
import { assertGatewayConfigured, GRADER_TEXT } from './gateway';
import { registerFor } from './level-register';
import { DEFAULT_LEVEL, isLevel, type Level } from '@/data/skills';
import {
  SPEECH_WPM, lengthTarget, targetSentence, type LengthField,
} from '@/lib/admin/length-targets';

export const AUTHOR_MODEL = process.env.AI_AUTHOR_MODEL || GRADER_TEXT;
export const AUTHOR_TIMEOUT_MS = 40_000;

export type AuthorAction =
  | 'draft_question'
  | 'draft_explanation'
  | 'draft_options'
  | 'draft_script'
  | 'draft_task'
  | 'draft_model_answer'
  | 'longer'
  | 'shorter'
  | 'simpler';

export const AUTHOR_ACTION_LABELS: Record<AuthorAction, string> = {
  draft_question: 'Vraag voorstellen',
  draft_explanation: 'Uitleg voorstellen',
  draft_options: 'Antwoordopties voorstellen',
  draft_script: 'Script voorstellen',
  draft_task: 'Opdracht voorstellen',
  draft_model_answer: 'Voorbeeldantwoord voorstellen',
  longer: 'Langer',
  shorter: 'Korter',
  simpler: 'Makkelijker',
};

function registerRules(level: Level): string {
  return [
    ...registerFor(level).authoring,
    '- Nederlands van Nederland, geen Vlaamse varianten.',
    '- Geen formeel of ambtelijk jargon, geen spreekwoorden.',
    'Schrijf alleen de gevraagde tekst. Geen inleiding, geen uitleg over wat je doet, geen opmaak',
    'met sterretjes of kopjes, tenzij er expliciet om gevraagd wordt.',
  ].join('\n');
}

function instructions(level: Level): Record<AuthorAction, string> {
  const lvl = registerFor(level).label;
  return {
  draft_question:
    'Schrijf één meerkeuzevraag bij de gegeven tekst of het gegeven fragment. Geef alleen de vraagzin.',
  draft_explanation:
    'Leg in twee of drie korte zinnen uit waarom het juiste antwoord juist is. Spreek de kandidaat ' +
    'aan met "je". Verwijs naar de plek in de tekst waar het antwoord staat.',
  draft_options:
    'Geef drie antwoordopties bij de vraag: één juiste en twee aannemelijke afleiders. Zet ze op ' +
    'drie regels, met "A: ", "B: " en "C: " ervoor. Zet achter de juiste optie niets — de docent ' +
    'kiest zelf welke juist is.',
  draft_script:
    'Schrijf een kort luisterfragment van 6 tot 10 beurten. Gebruik sprekerlabels "A: " en "B: " ' +
    'aan het begin van elke beurt. Maak duidelijk wie wie is via namen of aanspreekvormen, want ' +
    'daar wordt de stem op gekozen.',
  draft_task:
    'Schrijf de opdrachttekst voor de kandidaat: wat moet hij of zij schrijven of zeggen, en welke ' +
    'punten moeten erin staan.',
  draft_model_answer:
    'Schrijf een voorbeeldantwoord dat precies voldoet aan de opdracht — niet beter dan een goede ' +
    `${lvl}-kandidaat zou schrijven.`,
  longer:
    `Maak de tekst langer en concreter, maar houd hem op ${lvl}. Voeg geen moeilijkere woorden ` +
    'toe en maak de zinnen niet langer — voeg inhoud toe, geen complexiteit.',
  shorter: 'Maak de tekst korter zonder informatie weg te laten die nodig is om de vraag te maken.',
  simpler:
    'Vereenvoudig de tekst: kortere zinnen en gewonere woorden. De inhoud blijft precies hetzelfde.',
  };
}

/**
 * Which length guideline applies to each action, so a per-field draft comes back the same length
 * the meter under that field is asking for.
 *
 * `longer` / `shorter` / `simpler` are deliberately absent: those transform whatever the docent
 * already has, and quoting a band at them turns "make this a bit shorter" into "rewrite it to 45
 * words", which is not what she pressed. The band is stated for the *drafting* actions only.
 */
const ACTION_LENGTH: Partial<Record<AuthorAction, { field: LengthField; what: string }>> = {
  draft_question: { field: 'prompt', what: 'Lengte van de vraagzin' },
  draft_explanation: { field: 'explanation', what: 'Lengte van de uitleg' },
  draft_options: { field: 'option', what: 'Lengte per antwoordoptie' },
  draft_task: { field: 'task_prompt', what: 'Lengte van de opdracht' },
  draft_model_answer: { field: 'model_answer', what: 'Lengte van het voorbeeldantwoord' },
  draft_script: { field: 'script', what: 'Lengte van het script' },
};

export type AuthorRequest = {
  action: AuthorAction;
  /** The text being transformed, for longer/shorter/simpler. */
  text?: string;
  /** Surrounding content — the stimulus, the prompt, the task — so a draft fits its item. */
  context?: string;
  skill?: string;
  /** The exam's CEFR level. Defaults to A2 only so an older caller keeps its old behaviour. */
  level?: string;
};

/**
 * Run one drafting action and return plain text.
 *
 * Throws on a model failure; the caller surfaces it. There is no retry: the docent is sitting in
 * front of the screen and a second identical attempt is her call, not ours.
 */
export async function draftContent(req: AuthorRequest): Promise<string> {
  assertGatewayConfigured();

  const level: Level = isLevel(req.level) ? req.level : DEFAULT_LEVEL;
  const instruction = instructions(level)[req.action];
  if (!instruction) throw new Error(`Onbekende actie: ${req.action}`);

  const needsText: AuthorAction[] = ['longer', 'shorter', 'simpler'];
  if (needsText.includes(req.action) && !req.text?.trim()) {
    throw new Error('Er is nog geen tekst om aan te passen.');
  }

  // Same source as the meter under the field — see `lib/admin/length-targets.ts`. A script's band
  // is in seconds, so it is restated as words: the model cannot time speech but it can count.
  const lengthSpec = ACTION_LENGTH[req.action];
  const band = lengthSpec ? lengthTarget(level, lengthSpec.field, req.skill) : null;
  const lengthLine =
    band && lengthSpec
      ? band.unit === 'seconden'
        ? `${lengthSpec.what}: ${band.min} tot ${band.max} seconden voorgelezen, ongeveer ` +
          `${Math.round((band.min / 60) * SPEECH_WPM)} tot ${Math.round((band.max / 60) * SPEECH_WPM)} ` +
          'woorden, sprekerlabels niet meegerekend.'
        : `${lengthSpec.what}: ${targetSentence(band)}.`
      : '';

  const parts = [
    registerRules(level),
    '',
    instruction,
    lengthLine,
    req.skill ? `\nOnderdeel: ${req.skill}.` : '',
    req.context?.trim() ? `\nContext:\n${req.context.trim()}` : '',
    req.text?.trim() ? `\nDe tekst:\n${req.text.trim()}` : '',
  ].filter(Boolean);

  const { text } = await generateText({
    model: AUTHOR_MODEL,
    prompt: parts.join('\n'),
    // Higher than the grader's 0.2: a grade must be stable between two identical answers, a draft
    // should not come back word-for-word identical when the docent asks again.
    temperature: 0.6,
    abortSignal: AbortSignal.timeout(AUTHOR_TIMEOUT_MS),
  });

  return text.trim();
}
