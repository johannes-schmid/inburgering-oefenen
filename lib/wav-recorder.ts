/**
 * Recording a Spreken answer as 16 kHz mono WAV, in the browser, with no dependency.
 *
 * ## Why not MediaRecorder
 * `MediaRecorder` cannot emit WAV — it gives WebM/Opus (or MP4/AAC on Safari). Verified
 * 2026-07-30: the grading model's audio input accepts wav/mp3/aiff/aac/ogg/flac and **not** WebM or
 * Opus. Since the owner's decision is that pronunciation is judged from the recording rather than
 * inferred from a transcript, the format has to be one the model reads.
 *
 * The alternative was transcoding server-side. On Vercel that means shipping a WASM ffmpeg into a
 * function — slow, large, and it would have to run again on every re-grade from the review inbox.
 * Encoding a WAV header in the browser is ~40 lines and moves the cost to nowhere.
 *
 * ## The cost of this choice, stated
 * 16 kHz mono 16-bit is ~32 KB/s, so a 60-second answer is ~1.9 MB and a full 16-task Spreken exam
 * is ~30 MB per candidate, against ~2 MB if it were Opus. At Supabase storage prices that is cents
 * per thousand exams, and in exchange the docent's inbox, the browser `<audio>` element, Scribe and
 * the grading model all read one artifact with no conversion anywhere. If storage ever matters, add
 * Opus encoding for *archival* and keep the WAV only until the answer is graded — do not reach for
 * a transcode in the request path.
 *
 * 16 kHz is not a compromise for speech: it is above the Nyquist rate for everything that carries
 * Dutch phonemes, and it is what speech recognisers downsample to anyway.
 */

export type WavRecording = { blob: Blob; seconds: number };

/** Target rate. Speech recognisers use this; higher rates cost bytes and buy nothing here. */
const TARGET_SAMPLE_RATE = 16_000;

/**
 * The worklet runs on the audio thread and does nothing but hand buffers back — all the work is on
 * the main thread in `stop()`. Injected as a blob URL rather than a file in `public/`, so the
 * recorder is self-contained and cannot break by someone moving an asset.
 */
const WORKLET_SOURCE = `
class PcmCollector extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      // The buffer is reused by the audio thread, so post a copy, not a view.
      this.port.postMessage(new Float32Array(channel));
    }
    return true;
  }
}
registerProcessor('pcm-collector', PcmCollector);
`;

/** Linear resample. Cheap, and for a monotonic downsample of speech it is inaudible. */
function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const length = Math.floor(input.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const right = Math.min(left + 1, input.length - 1);
    const frac = pos - left;
    out[i] = input[left] * (1 - frac) + input[right] * frac;
  }
  return out;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp before scaling: a sample above 1.0 would wrap and turn a loud syllable into a click.
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export class WavRecorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletUrl: string | null = null;
  private chunks: Float32Array[] = [];

  /** True between `start()` resolving and `stop()`/`cancel()`. */
  get active(): boolean {
    return this.ctx != null;
  }

  /**
   * Open the microphone and begin collecting. Must be called from a user gesture — an
   * `AudioContext` created without one starts suspended.
   */
  async start(): Promise<void> {
    this.chunks = [];

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Asking for 16 kHz up front avoids a resample when the browser obliges. Chrome and Firefox
    // do; Safari may hand back 48 kHz, which `stop()` then downsamples.
    this.ctx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });

    this.workletUrl = URL.createObjectURL(
      new Blob([WORKLET_SOURCE], { type: 'application/javascript' })
    );
    await this.ctx.audioWorklet.addModule(this.workletUrl);

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, 'pcm-collector');
    this.node.port.onmessage = e => {
      this.chunks.push(e.data as Float32Array);
    };

    // Connected to the destination because some browsers do not pull audio through a worklet whose
    // output goes nowhere. The worklet returns no output, so nothing is actually played — without
    // this the recording can come back silent.
    this.source.connect(this.node);
    this.node.connect(this.ctx.destination);
  }

  /** Stop, release the microphone, and encode what was collected. */
  async stop(): Promise<WavRecording> {
    if (!this.ctx) throw new Error('Recorder is niet gestart.');

    const sourceRate = this.ctx.sampleRate;
    const collected = this.chunks;
    this.teardown();

    const total = collected.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const c of collected) {
      merged.set(c, offset);
      offset += c.length;
    }

    const samples = resample(merged, sourceRate, TARGET_SAMPLE_RATE);
    return {
      blob: encodeWav(samples, TARGET_SAMPLE_RATE),
      // Derived from the sample count, so it is the true length of the audio rather than a wall
      // clock that a tab going to sleep would have skewed.
      seconds: Math.round((samples.length / TARGET_SAMPLE_RATE) * 10) / 10,
    };
  }

  /** Abandon the recording and release the microphone. Safe to call when not started. */
  cancel(): void {
    this.chunks = [];
    this.teardown();
  }

  private teardown(): void {
    this.node?.port.close();
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    void this.ctx?.close();
    if (this.workletUrl) URL.revokeObjectURL(this.workletUrl);
    this.node = null;
    this.source = null;
    this.stream = null;
    this.ctx = null;
    this.workletUrl = null;
  }
}

/** Whether this browser can record at all, for a message instead of a dead button. */
export function canRecordWav(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof AudioWorkletNode !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}
