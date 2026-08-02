/**
 * Turning a stimulus `script` into an ElevenLabs text-to-dialogue request.
 *
 * This is the server-side twin of `scripts/generate-free-practice-audio.mjs`, which does the same
 * job for the 20 static taster items. The two are deliberately separate programs — the taster
 * writes committed mp3s and runs ffmpeg loudnorm on the way out; this one writes to Supabase
 * Storage from a serverless function where there is no ffmpeg binary — but the parsing, the casting
 * rules and the model settings are the same, and live here so they cannot drift apart silently.
 *
 * ## Casting is authored, never inferred
 * `stimuli.voice_cast` maps each speaker tag to a key in data/tts-voices.json. It is a content
 * decision: the script establishes gender through names and address forms ("mevrouw De Wit" →
 * female), and a mismatch is an immediately audible content bug rather than a stylistic slip. So
 * this module **throws on an uncast speaker** rather than picking one — exactly as the taster
 * script does. Guessing would produce plausible audio that is quietly wrong.
 */
import { VOICES, type VoiceKey } from './tts-voices';

/** `eleven_v3` via /v1/text-to-dialogue: the whole scene in one generation, so the model times
 *  the turns itself. Matches the taster pipeline. */
export const DIALOGUE_MODEL = 'eleven_v3';
export const DIALOGUE_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-dialogue';
/** Single-speaker scripts (announcements) still go through text-to-dialogue, so one path. */
export const DIALOGUE_SETTINGS = { stability: 0.5, use_speaker_boost: true } as const;

export type DialogueTurn = { speaker: string; text: string };

/**
 * Parse `A: Goedemorgen.` lines into turns.
 *
 * A line without a speaker tag continues the previous turn, so a wrapped paragraph in the admin
 * textarea does not become a speakerless turn. Blank lines are separators, not content.
 */
export function parseScript(script: string): DialogueTurn[] {
  const turns: DialogueTurn[] = [];

  /** Push text onto the current turn, or open an untagged first turn for leading prose. */
  const append = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (turns.length === 0) turns.push({ speaker: 'A', text: t });
    else turns[turns.length - 1].text += ` ${t}`;
  };

  for (const rawLine of script.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    // Tags may appear mid-line, not only at the start: the seeded exam scripts are stored as one
    // paragraph — "A: Goedemorgen. B: Dag." — and splitting on newlines alone read the whole scene
    // as a single speaker, which then generated a two-hander in one voice.
    //
    // Inline tags must start with a capital and contain no spaces. That is what keeps ordinary
    // Dutch prose out: "Hij zei: kom maar" has a lowercase token before the colon, and a
    // multi-word label like "Mevrouw De Wit:" is only honoured at the start of a line, where
    // there is no ambiguity.
    // The line-start label is matched FIRST and may contain spaces ("Mevrouw De Wit:"). Scanning
    // for inline tags before this would take "Wit:" as the speaker and leave "Mevrouw De" as
    // stray prose.
    let rest = line;
    const head = /^([A-Za-z][A-Za-z0-9_ -]{0,15}):\s*/.exec(line);
    if (head) {
      turns.push({ speaker: head[1].trim(), text: '' });
      rest = line.slice(head[0].length);
    }

    const inline = /\s([A-Z][A-Za-z0-9_-]{0,11}):\s/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = inline.exec(rest)) !== null) {
      append(rest.slice(last, m.index));
      turns.push({ speaker: m[1], text: '' });
      last = m.index + m[0].length;
    }
    append(rest.slice(last));
  }

  return turns.filter(t => t.text.trim().length > 0).map(t => ({ ...t, text: t.text.trim() }));
}

/** Distinct speaker tags in script order — what the casting editor has to offer a voice for. */
export function speakersInScript(script: string): string[] {
  return [...new Set(parseScript(script).map(t => t.speaker))];
}

export type CastValidation =
  | { ok: true; cast: Record<string, VoiceKey> }
  | { ok: false; error: string };

/**
 * Check a `voice_cast` against a script before spending an API call.
 *
 * Enforces the three rules from CLAUDE.md that a generator cannot recover from afterwards:
 * every speaker cast, every voice key real, and two speakers never sharing a voice — a dialogue
 * in one voice is indistinguishable from a monologue and destroys the comprehension being tested.
 */
export function validateCast(script: string, cast: unknown): CastValidation {
  const speakers = speakersInScript(script);
  if (speakers.length === 0) return { ok: false, error: 'Het script bevat geen tekst.' };

  const map = (cast ?? {}) as Record<string, unknown>;
  const resolved: Record<string, VoiceKey> = {};

  for (const s of speakers) {
    const key = map[s];
    if (typeof key !== 'string' || !key) {
      return { ok: false, error: `Spreker ${s} heeft nog geen stem. Kies een stem per spreker.` };
    }
    if (!(key in VOICES)) {
      return { ok: false, error: `Onbekende stem "${key}" voor spreker ${s}.` };
    }
    resolved[s] = key as VoiceKey;
  }

  if (speakers.length > 1) {
    const used = new Set(Object.values(resolved));
    if (used.size < speakers.length) {
      return {
        ok: false,
        error: 'Twee sprekers hebben dezelfde stem. Geef elke spreker een eigen stem.',
      };
    }
  }

  return { ok: true, cast: resolved };
}

/** The `inputs` array for /v1/text-to-dialogue: one entry per turn, in order. */
export function buildDialogueInputs(
  script: string,
  cast: Record<string, VoiceKey>
): { text: string; voice_id: string }[] {
  return parseScript(script).map(t => ({
    text: t.text,
    voice_id: VOICES[cast[t.speaker]].id,
  }));
}
