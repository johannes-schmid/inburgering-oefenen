/**
 * Transcribing a Spreken recording, and turning it into signals the docent can trust.
 *
 * Uses ElevenLabs Scribe (`POST /v1/speech-to-text`, `scribe_v2`), which returns per-word
 * `logprob` alongside timings. That confidence number is the reason transcription is a separate
 * call rather than something the grading model does as a side effect:
 *
 *  - the transcript is shown to both candidate and docent, so it has to exist as data;
 *  - `logprob` yields an **objective** intelligibility measure. A model's opinion that somebody
 *    was "hard to understand" is unverifiable; "31% of words came back below the confidence
 *    threshold" is arithmetic the docent can check against the audio. That distinction is what
 *    lets the pronunciation criterion survive review.
 *
 * The signals land in `open_submissions.speech_signals`, deliberately outside `ai_result`.
 *
 * Env var is `ELEVEN_LAPS_API_KEY` — misspelled, but it is the repo-wide name (see
 * `api/generate-question-audio`, `generate-wordcard-audio`, `admin/generate-lesson-audio`).
 * Renaming it here alone would break nothing loudly and everything quietly.
 */

const SCRIBE_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const SCRIBE_MODEL = 'scribe_v2';
const LANGUAGE = 'nld';

/**
 * Below this log-probability a word counts as "the recogniser struggled". Chosen as a starting
 * point, not a measurement: logprob ≈ -0.7 is roughly a 50% token probability. Tune it against
 * the docent's own verstaanbaarheid scores in /admin/beoordeling/evals once there is real data —
 * it is the one number here that should be calibrated rather than argued.
 */
const LOW_CONFIDENCE_LOGPROB = -0.7;

/** A gap this long between words reads as hesitation rather than a sentence boundary. */
const SILENCE_THRESHOLD_SECS = 1.5;

export type ScribeWord = {
  text: string;
  start: number | null;
  end: number | null;
  type: 'word' | 'spacing' | 'audio_event' | string;
  logprob: number;
};

export type SpeechSignals = {
  word_count: number;
  mean_logprob: number | null;
  low_confidence_word_rate: number | null;
  words_per_minute: number | null;
  longest_silence_secs: number | null;
};

export type TranscriptionResult = {
  text: string;
  language_code: string | null;
  language_probability: number | null;
  audio_duration_secs: number | null;
  signals: SpeechSignals;
};

/**
 * Everything measurable about how the answer was spoken. Pure arithmetic over Scribe's output —
 * no model judgement — so it is safe to show beside the docent's own scoring.
 */
export function deriveSpeechSignals(
  words: ScribeWord[],
  durationSecs: number | null
): SpeechSignals {
  const spoken = words.filter(w => w.type === 'word');
  const count = spoken.length;

  if (count === 0) {
    return {
      word_count: 0,
      mean_logprob: null,
      low_confidence_word_rate: null,
      words_per_minute: null,
      longest_silence_secs: null,
    };
  }

  const logprobs = spoken.map(w => w.logprob).filter(n => Number.isFinite(n));
  const meanLogprob = logprobs.length
    ? logprobs.reduce((a, b) => a + b, 0) / logprobs.length
    : null;
  const lowCount = logprobs.filter(n => n < LOW_CONFIDENCE_LOGPROB).length;

  let longestSilence: number | null = null;
  for (let i = 1; i < spoken.length; i++) {
    const prevEnd = spoken[i - 1].end;
    const start = spoken[i].start;
    if (prevEnd == null || start == null) continue;
    const gap = start - prevEnd;
    if (gap >= SILENCE_THRESHOLD_SECS && (longestSilence == null || gap > longestSilence)) {
      longestSilence = gap;
    }
  }

  return {
    word_count: count,
    mean_logprob: meanLogprob == null ? null : round(meanLogprob, 3),
    low_confidence_word_rate: logprobs.length ? round(lowCount / logprobs.length, 3) : null,
    words_per_minute:
      durationSecs && durationSecs > 0 ? Math.round((count / durationSecs) * 60) : null,
    longest_silence_secs: longestSilence == null ? null : round(longestSilence, 2),
  };
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

/**
 * Transcribe one recording. `audio` is the raw file bytes as stored in the
 * `speaking-submissions` bucket; `filename` only sets the multipart part name.
 */
export async function transcribeRecording(
  audio: ArrayBuffer | Uint8Array,
  filename = 'answer.wav',
  contentType = 'audio/wav'
): Promise<TranscriptionResult> {
  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) throw new Error('ELEVEN_LAPS_API_KEY is not set — cannot transcribe.');

  const form = new FormData();
  form.append('file', new Blob([audio as BlobPart], { type: contentType }), filename);
  form.append('model_id', SCRIBE_MODEL);
  // Pinning Dutch rather than letting Scribe detect it: an A2 candidate's accented Dutch is
  // exactly the input auto-detection gets wrong, and a misdetected language silently wrecks both
  // the transcript and every confidence number derived from it.
  form.append('language_code', LANGUAGE);

  const res = await fetch(SCRIBE_URL, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Scribe ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    text?: string;
    language_code?: string | null;
    language_probability?: number | null;
    audio_duration_secs?: number | null;
    words?: ScribeWord[];
  };

  const words = json.words ?? [];
  const duration = json.audio_duration_secs ?? null;

  return {
    text: (json.text ?? '').trim(),
    language_code: json.language_code ?? null,
    language_probability: json.language_probability ?? null,
    audio_duration_secs: duration,
    signals: deriveSpeechSignals(words, duration),
  };
}

/**
 * A short, plain-Dutch reading of the signals, handed to the grading model alongside the audio so
 * the pronunciation criterion has something measured to lean on. Phrased as observations, never as
 * a suggested score — the anchors decide the score.
 */
export function describeSignals(s: SpeechSignals, maxSeconds: number, seconds: number | null): string {
  const bits: string[] = [];
  bits.push(`${s.word_count} woorden gesproken`);
  if (seconds != null) bits.push(`opname ${Math.round(seconds)} van maximaal ${maxSeconds} seconden`);
  if (s.words_per_minute != null) bits.push(`${s.words_per_minute} woorden per minuut`);
  if (s.low_confidence_word_rate != null) {
    bits.push(
      `${Math.round(s.low_confidence_word_rate * 100)}% van de woorden werd door de ` +
        `spraakherkenning onzeker herkend`
    );
  }
  if (s.longest_silence_secs != null) {
    bits.push(`langste stilte ${s.longest_silence_secs} seconden`);
  }
  return bits.join('; ') + '.';
}
