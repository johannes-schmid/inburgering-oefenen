/**
 * How long a piece of exam content should be, and how long it currently is.
 *
 * One module, because the number has to be identical in three places: the meter under the field,
 * the instruction in the suggestion prompt, and (for audio) the band the publish validator already
 * checks. A target that lives in the UI but not in the prompt produces suggestions that are always
 * the wrong length, and the docent edits every one of them by hand.
 *
 * ## Where each number comes from — and which are not verified
 * This distinction matters more here than the numbers do, so it is in the type: every target
 * carries a `source`.
 *
 * - **`format`** — read off `exam_formats` via `data/skills.ts`. The audio band (A2 Luisteren
 *   40–50 seconds) was worked out against DUO's own material. This is the only *measured* target.
 * - **`register`** — the average sentence length already stated in `lib/ai/level-register.ts`
 *   ("gemiddeld hooguit 12 woorden" at A2, 18 at B1). Ours, but already the house rule that the
 *   grader and the authoring prompts are written against, so a meter enforcing it adds no new claim.
 * - **`richtlijn`** — a working guideline, owner's decision 2026-08-08. **Not from DUO.** Nobody has
 *   counted the length of a DUO A2 leestekst the way the item counts in `SEO/facts.md` §1 were
 *   counted. These exist because a blank field with no sense of scale is worse than a guideline the
 *   docent can overrule, and every one of them is *advisory*: nothing blocks on it, no publish check
 *   reads it, and the meter says "richtlijn". If any of these is ever verified against DUO material,
 *   move it to `exam_formats` and the validator can start caring about it — that is the same path
 *   `audio_seconds` took. Until then it must never be presented as a standard.
 *
 * So: never quote a `richtlijn` number to a candidate, in marketing copy, or in a blog post. It is
 * scaffolding for the authoring screen, not a fact about the exam.
 */
import { formatRules, isSkillSlug, type Level } from '@/data/skills';

export type TargetSource = 'format' | 'register' | 'richtlijn';

export type LengthTarget = {
  /** What is being counted. `seconds` is an estimate for a script; the rest are exact. */
  unit: 'woorden' | 'tekens' | 'seconden';
  min: number;
  max: number;
  source: TargetSource;
};

/** Which field a meter is sitting under. */
export type LengthField =
  | 'stimulus_text'
  | 'script'
  | 'prompt'
  | 'explanation'
  | 'option'
  | 'task_prompt'
  | 'model_answer';

/**
 * Words per minute the generated audio actually runs at.
 *
 * Measured, not chosen: `eleven_v3` has no pacing control at all — no `speed`, and it ignores
 * `<break time>` outright — and the taster audio came out at roughly this rate (see CLAUDE.md,
 * "Known tradeoff, accepted by the owner 2026-07-28"). So this predicts the length of the mp3 the
 * generator will produce, which is what the docent needs *before* spending a generation.
 *
 * It deliberately does not model DUO's slower delivery. The band being checked is our own file's
 * length, and after generation `lib/mp3-duration.ts` counts the real frames — this estimate is
 * never the authority once a file exists.
 */
export const SPEECH_WPM = 150;

/**
 * The advisory targets, per level. One table, so changing a guideline is one edit.
 *
 * Read the header before touching these: `richtlijn` rows are the owner's working guidelines and
 * not DUO measurements. `script` is absent on purpose — it is derived from the audio band in
 * `lengthTarget()`, which is a real rule rather than a guess.
 */
const TARGETS: Record<Level, Partial<Record<LengthField, LengthTarget>>> = {
  a2: {
    stimulus_text: { unit: 'woorden', min: 60, max: 130, source: 'richtlijn' },
    prompt: { unit: 'woorden', min: 3, max: 14, source: 'richtlijn' },
    explanation: { unit: 'woorden', min: 15, max: 45, source: 'richtlijn' },
    option: { unit: 'woorden', min: 1, max: 8, source: 'richtlijn' },
    task_prompt: { unit: 'woorden', min: 25, max: 70, source: 'richtlijn' },
    model_answer: { unit: 'woorden', min: 40, max: 90, source: 'richtlijn' },
  },
  b1: {
    stimulus_text: { unit: 'woorden', min: 120, max: 240, source: 'richtlijn' },
    prompt: { unit: 'woorden', min: 3, max: 18, source: 'richtlijn' },
    explanation: { unit: 'woorden', min: 20, max: 60, source: 'richtlijn' },
    option: { unit: 'woorden', min: 1, max: 10, source: 'richtlijn' },
    task_prompt: { unit: 'woorden', min: 35, max: 90, source: 'richtlijn' },
    model_answer: { unit: 'woorden', min: 80, max: 160, source: 'richtlijn' },
  },
};

/** The average sentence length the level register already commits to. */
export function sentenceTarget(level: Level): number {
  return level === 'b1' ? 18 : 12;
}

/**
 * The target for one field, or null when there is nothing defensible to say.
 *
 * A script's band comes from the format's `audio_seconds`, so on a (level, skill) where nobody has
 * verified that range yet it returns null and the meter shows counts only — the same convention as
 * `exam_publish_issues()`, which skips a NULL rule rather than inventing one.
 */
export function lengthTarget(
  level: Level,
  field: LengthField,
  skill?: string
): LengthTarget | null {
  if (field === 'script') {
    const rules = skill && isSkillSlug(skill) ? formatRules(level, skill) : null;
    if (!rules?.audioSeconds) return null;
    const [min, max] = rules.audioSeconds;
    return { unit: 'seconden', min, max, source: 'format' };
  }
  return TARGETS[level][field] ?? null;
}

/** Plain text out of a `body_html` field, so a word count is not counting `<p>`. */
export function stripHtml(html: string): string {
  return html
    // Block-level tags become a space, or "…einde.</p><p>Begin…" counts as one word.
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Speaker labels out of a dialogue script: "A: " is direction, not speech to be timed. */
export function stripSpeakers(script: string): string {
  return script
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[^:\n]{1,30}?\s*:\s*/, ''))
    .join(' ');
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function countSentences(text: string): number {
  const parts = text
    .split(/[.!?]+(?:\s|$)/)
    .map(s => s.trim())
    .filter(Boolean);
  // A field with words but no end punctuation is still one sentence in progress — reporting 0
  // there makes the average sentence length divide by zero.
  return parts.length || (countWords(text) ? 1 : 0);
}

/** Rounded to whole seconds: a tenth of a second of speech is not a decision the docent makes. */
export function estimateSeconds(script: string): number {
  const words = countWords(stripSpeakers(script));
  return Math.round((words / SPEECH_WPM) * 60);
}

export type LengthReading = {
  chars: number;
  words: number;
  sentences: number;
  /** Average words per sentence, or 0 on an empty field. */
  perSentence: number;
  /** Only meaningful for a script; the estimated spoken length of the generated audio. */
  seconds: number;
  /** The value compared against the target, in the target's own unit. */
  value: number;
  target: LengthTarget | null;
  /** `null` when there is no target to be inside or outside of. */
  status: 'under' | 'ok' | 'over' | null;
};

/**
 * Measure a field against its target.
 *
 * `text` is taken raw; the caller strips HTML or speaker labels first, because only the caller
 * knows which of the two it is holding.
 */
export function measure(
  text: string,
  level: Level,
  field: LengthField,
  skill?: string
): LengthReading {
  const words = countWords(text);
  const sentences = countSentences(text);
  const seconds = field === 'script' ? estimateSeconds(text) : 0;
  const target = lengthTarget(level, field, skill);

  const value =
    target?.unit === 'seconden' ? seconds : target?.unit === 'tekens' ? text.length : words;

  return {
    chars: text.length,
    words,
    sentences,
    perSentence: sentences ? Math.round(words / sentences) : 0,
    seconds,
    value,
    target,
    // An empty field is not "too short" — nothing has been written yet, and colouring it as a
    // problem the moment the drawer opens is noise on every field at once.
    status: !target || value === 0 ? null : value < target.min ? 'under' : value > target.max ? 'over' : 'ok',
  };
}

/** The target as a line of Dutch, for a prompt or a hint. Null when there is no target. */
export function targetSentence(target: LengthTarget | null): string | null {
  if (!target) return null;
  return `${target.min} tot ${target.max} ${target.unit}`;
}
