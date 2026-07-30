/**
 * Model selection, in one place.
 *
 * Calls go through **Vercel AI Gateway** using plain `'provider/model'` strings, which the AI SDK
 * resolves when `AI_GATEWAY_API_KEY` is set. On Vercel, production gets OIDC automatically; the
 * key is still set there so cron jobs and CLI runs behave the same as local dev.
 *
 * Two models, deliberately:
 *
 * - `GRADER_TEXT` grades Schrijven. Text in, structured object out.
 * - `GRADER_AUDIO` grades Spreken and **must accept an audio file part**, because the owner's
 *   decision was that pronunciation is judged from the recording rather than inferred from a
 *   transcript.
 *
 * ## Do not trust the gateway's capability tags for the audio model
 * The `audio-input` tag is known to be missing from the models response (vercel/ai#9417), so a
 * tag-based check will both false-negative and give false confidence. The only reliable test is a
 * real call with a real WAV — `npm run check:audio-model` (scripts/check-audio-model.mjs) does
 * exactly that and is the gate before trusting Spreken grading.
 *
 * Gemini's audio input accepts wav/mp3/aiff/aac/ogg/flac and **not** WebM or Opus, which is why
 * `SpeakingTask` records WAV. Audio costs ~32 tokens/second, so a 60-second answer is ~1,920
 * input tokens on top of the rubric.
 */

/** Schrijven: rubric + task + answer, all text. */
export const GRADER_TEXT = process.env.AI_GRADER_TEXT_MODEL || 'google/gemini-2.5-flash';

/** Spreken: the same, plus the recording as an audio file part. */
export const GRADER_AUDIO = process.env.AI_GRADER_AUDIO_MODEL || 'google/gemini-2.5-flash';

/** Deterministic-ish grading: the same answer should not swing a band between two sittings. */
export const GRADER_TEMPERATURE = 0.2;

/**
 * A grade is user-visible latency, so it fails fast rather than hanging the player. The candidate
 * keeps their submission either way — `open_submissions` is written before the model is called.
 */
export const GRADER_TIMEOUT_MS = 45_000;

export function assertGatewayConfigured(): void {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error(
      'AI_GATEWAY_API_KEY is not set. Rubric grading cannot run — see CLAUDE.md, Phase 5.'
    );
  }
}
