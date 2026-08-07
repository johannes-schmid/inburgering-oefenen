/**
 * How long is this mp3, in seconds?
 *
 * Needed because `exam_formats.audio_seconds_min/_max` puts a rule on the length of a
 * Luisteren fragment (40–50 seconds at A2), and the length is not recoverable from a URL:
 * the validator can only check a number somebody wrote down at generation time.
 *
 * Implemented by walking the MPEG frame headers rather than shelling out, because there is
 * no ffmpeg binary in a serverless function — the same constraint that keeps the loudnorm
 * pass out of `/api/generate-stimulus-audio`. Counting frames handles VBR correctly, which
 * a `bytes / bitrate` estimate does not, and ElevenLabs returns VBR-ish output.
 *
 * Returns `null` rather than a guess when the buffer does not look like an mp3 at all. A
 * missing duration is reported as "niet vastgelegd" in admin; a wrong one would silently
 * pass or fail the rule.
 */

// Bitrate (kbps) by index, for MPEG-1 Layer III and MPEG-2/2.5 Layer III.
const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];

// Sample rate (Hz) by index, per MPEG version.
const RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000, 0], // MPEG-1
  2: [22050, 24000, 16000, 0], // MPEG-2
  0: [11025, 12000, 8000, 0],  // MPEG-2.5
};

// Samples per Layer III frame. MPEG-2 and 2.5 use half-size frames.
const SAMPLES_V1 = 1152;
const SAMPLES_V2 = 576;

export function mp3DurationSeconds(input: ArrayBuffer | Uint8Array): number | null {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);

  let i = 0;

  // Skip an ID3v2 tag if present — its body can contain byte pairs that look like a frame sync.
  if (b.length > 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) {
    // Synchsafe 28-bit size, excluding the 10-byte header.
    const size = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
    i = 10 + size;
  }

  let seconds = 0;
  let frames = 0;

  while (i + 4 <= b.length) {
    // Frame sync: eleven set bits.
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) {
      i++;
      continue;
    }

    const versionBits = (b[i + 1] >> 3) & 0x03; // 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5
    const layerBits = (b[i + 1] >> 1) & 0x03;   // 1 = Layer III
    const bitrateIdx = (b[i + 2] >> 4) & 0x0f;
    const rateIdx = (b[i + 2] >> 2) & 0x03;
    const padding = (b[i + 2] >> 1) & 0x01;

    const rates = RATES[versionBits];
    if (layerBits !== 1 || !rates || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) {
      // A false sync inside frame data. Step one byte, not one frame.
      i++;
      continue;
    }

    const isV1 = versionBits === 3;
    const bitrate = (isV1 ? BITRATES_V1_L3 : BITRATES_V2_L3)[bitrateIdx] * 1000;
    const sampleRate = rates[rateIdx];
    const samples = isV1 ? SAMPLES_V1 : SAMPLES_V2;

    const frameLength = Math.floor((samples / 8) * bitrate / sampleRate) + padding;
    if (frameLength <= 0) {
      i++;
      continue;
    }

    seconds += samples / sampleRate;
    frames++;
    i += frameLength;
  }

  if (frames === 0) return null;
  return Math.round(seconds * 100) / 100;
}
