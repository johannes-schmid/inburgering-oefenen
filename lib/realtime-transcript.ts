/**
 * Live transcript while the candidate speaks, straight from the browser to ElevenLabs Scribe.
 *
 * ## How it fits the recorder
 * `WavRecorder` already captures 16 kHz mono PCM through an AudioWorklet, which is exactly what
 * Scribe's realtime endpoint wants (`audio_format=pcm_16000`). So this does not open a second
 * microphone — it taps the chunks the recorder is already producing. One mic, two consumers: the WAV
 * that gets stored and graded, and this socket that produces the readback.
 *
 * ## The transcript here is not the graded transcript
 * Grading runs on the submitted WAV via the batch Scribe call in `lib/ai/transcribe.ts`, which also
 * yields the per-word confidence the docent reviews. This stream exists so the candidate can see
 * that they are being heard. The two will sometimes differ, and the UI must not present this one as
 * the record of what was submitted.
 *
 * ## Failure is expected and must be survivable
 * The socket can fail for reasons that have nothing to do with the candidate: a key missing the
 * `speech_to_text` scope, a quota, a flaky network. None of that may stop the recording. Every path
 * here reports through `onError` and leaves the recorder alone.
 *
 * Protocol (verified against the ElevenLabs docs, 2026-07-30):
 *   token   POST /v1/single-use-token/realtime_scribe  → { token }, valid 15 min  (server-side)
 *   socket  wss://api.elevenlabs.io/v1/speech-to-text/realtime?token=…&model_id=scribe_v2_realtime
 *   send    { message_type: 'input_audio_chunk', audio_base_64, sample_rate, commit }
 *   recv    session_started | partial_transcript | committed_transcript | *_with_timestamps | errors
 */

const WS_URL = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime';
const MODEL_ID = 'scribe_v2_realtime';
const SAMPLE_RATE = 16_000;
const LANGUAGE = 'nld';

/** ~8 KB of PCM16, the size the docs recommend — about 0.25 s at 16 kHz. */
const CHUNK_SAMPLES = 4096;

export type TranscriptState = 'idle' | 'connecting' | 'listening' | 'closed' | 'error';

export type RealtimeTranscriptHandlers = {
  /** Committed text so far plus the current partial, ready to render. */
  onText: (full: string, partial: string) => void;
  onState: (state: TranscriptState) => void;
  /** Non-fatal: the recording continues without a readback. */
  onError: (message: string, code?: string) => void;
};

function toBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  // Chunked so a long buffer cannot blow the argument limit of String.fromCharCode.
  let binary = '';
  const STRIDE = 0x8000;
  for (let i = 0; i < bytes.length; i += STRIDE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + STRIDE));
  }
  return btoa(binary);
}

function floatToPcm16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export class RealtimeTranscriber {
  private ws: WebSocket | null = null;
  private handlers: RealtimeTranscriptHandlers;
  private committed = '';
  private partial = '';
  /** PCM waiting to reach CHUNK_SAMPLES, so we send ~0.25 s frames rather than 128-sample ones. */
  private pending: Float32Array[] = [];
  private pendingLength = 0;
  private state: TranscriptState = 'idle';
  private closedByUs = false;

  constructor(handlers: RealtimeTranscriptHandlers) {
    this.handlers = handlers;
  }

  private setState(next: TranscriptState) {
    this.state = next;
    this.handlers.onState(next);
  }

  get active(): boolean {
    return this.state === 'listening' || this.state === 'connecting';
  }

  /**
   * Fetch a token and open the socket. Resolves `false` when the live transcript is unavailable —
   * the caller should carry on recording regardless.
   */
  async start(): Promise<boolean> {
    this.setState('connecting');
    this.closedByUs = false;

    let token: string;
    try {
      const res = await fetch('/api/stt-token', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.token) {
        this.handlers.onError(json.error ?? 'Live transcriptie is niet beschikbaar.', json.code);
        this.setState('error');
        return false;
      }
      token = json.token;
    } catch {
      this.handlers.onError('Live transcriptie is niet beschikbaar.');
      this.setState('error');
      return false;
    }

    const url =
      `${WS_URL}?token=${encodeURIComponent(token)}` +
      `&model_id=${MODEL_ID}` +
      `&language_code=${LANGUAGE}` +
      `&audio_format=pcm_${SAMPLE_RATE}` +
      // VAD commits a segment when the speaker pauses, which is what turns a growing partial into
      // stable text. With `manual` we would have to guess sentence boundaries ourselves.
      `&commit_strategy=vad` +
      // Silence makes Scribe invent words: a 4.8s probe followed by quiet produced a trailing
      // "Ja." that nobody said. A candidate who finishes early leaves exactly that silence, and a
      // readback showing words they did not say undermines the one thing this pane is for.
      `&filter_background_audio=true`;

    return new Promise<boolean>(resolve => {
      let settled = false;
      const done = (ok: boolean) => {
        if (!settled) {
          settled = true;
          resolve(ok);
        }
      };

      try {
        this.ws = new WebSocket(url);
      } catch {
        this.handlers.onError('Live transcriptie kon niet starten.');
        this.setState('error');
        return done(false);
      }

      this.ws.onopen = () => {
        this.setState('listening');
        done(true);
      };

      this.ws.onmessage = e => this.handleMessage(e.data);

      this.ws.onerror = () => {
        // The close handler decides what this means; a socket error before open is a failed
        // connection, after open it is usually a drop mid-answer.
        if (this.state === 'connecting') {
          this.handlers.onError('Live transcriptie kon geen verbinding maken.');
          this.setState('error');
          done(false);
        }
      };

      this.ws.onclose = () => {
        if (this.closedByUs) {
          this.setState('closed');
        } else if (this.state === 'listening') {
          this.handlers.onError('De verbinding voor live transcriptie is verbroken.');
          this.setState('error');
        }
        done(this.state === 'closed');
      };
    });
  }

  private handleMessage(raw: unknown) {
    if (typeof raw !== 'string') return;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    const type = msg.message_type ?? msg.type;
    const text = typeof msg.text === 'string' ? msg.text : '';

    switch (type) {
      case 'session_started':
        break;
      case 'partial_transcript':
        this.partial = text;
        this.emit();
        break;
      case 'committed_transcript':
      case 'final_transcript':
        // A committed segment replaces the partial it grew out of, so append and clear rather than
        // keeping both — otherwise the tail of every sentence renders twice.
        if (text.trim()) {
          this.committed = this.committed ? `${this.committed} ${text.trim()}` : text.trim();
        }
        this.partial = '';
        this.emit();
        break;
      default:
        if (typeof type === 'string' && type.endsWith('_error')) {
          this.handlers.onError(
            typeof msg.message === 'string' ? msg.message : 'Live transcriptie gaf een fout.',
            type
          );
        }
    }
  }

  private emit() {
    const full = [this.committed, this.partial].filter(Boolean).join(' ');
    this.handlers.onText(full, this.partial);
  }

  /** Feed PCM from the recorder's worklet. Buffered up to CHUNK_SAMPLES before sending. */
  pushPcm(frame: Float32Array) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.pending.push(frame);
    this.pendingLength += frame.length;
    if (this.pendingLength < CHUNK_SAMPLES) return;

    const merged = new Float32Array(this.pendingLength);
    let offset = 0;
    for (const f of this.pending) {
      merged.set(f, offset);
      offset += f.length;
    }
    this.pending = [];
    this.pendingLength = 0;
    this.send(merged, false);
  }

  private send(samples: Float32Array, commit: boolean) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        message_type: 'input_audio_chunk',
        audio_base_64: toBase64(floatToPcm16(samples)),
        sample_rate: SAMPLE_RATE,
        commit,
      })
    );
  }

  /** Flush whatever is buffered, ask for a final commit, then close. */
  stop() {
    this.closedByUs = true;
    if (this.ws?.readyState === WebSocket.OPEN) {
      const tail = this.pendingLength > 0 ? new Float32Array(this.pendingLength) : null;
      if (tail) {
        let offset = 0;
        for (const f of this.pending) {
          tail.set(f, offset);
          offset += f.length;
        }
        this.send(tail, true);
      } else {
        // Nothing buffered, but still commit so a trailing partial is finalised.
        this.ws.send(
          JSON.stringify({
            message_type: 'input_audio_chunk',
            audio_base_64: '',
            sample_rate: SAMPLE_RATE,
            commit: true,
          })
        );
      }
    }
    this.pending = [];
    this.pendingLength = 0;
    // Give the commit a moment to come back before tearing the socket down.
    const ws = this.ws;
    this.ws = null;
    setTimeout(() => ws?.close(), 400);
    this.setState('closed');
  }

  /** The text as it stands, committed segments only. */
  get committedText(): string {
    return this.committed;
  }
}

export function canUseRealtimeTranscript(): boolean {
  return typeof window !== 'undefined' && typeof WebSocket !== 'undefined';
}
