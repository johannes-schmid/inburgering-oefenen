import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { mp3DurationSeconds } from '@/lib/mp3-duration';

/**
 * The reference values come from `ffprobe -show_entries format=duration` on the committed
 * taster mp3s. Frame-counting and ffprobe disagree by a few tens of milliseconds because of
 * encoder delay padding, which is why the tolerance is 0.1s and not exact — the rule this
 * feeds (40–50 seconds for an A2 Luisteren fragment) does not care about 30 ms.
 */
describe('mp3DurationSeconds', () => {
  it('matches ffprobe on a real taster fragment', () => {
    const buf = readFileSync('public/audio/free-practice/lu-1.mp3');
    expect(mp3DurationSeconds(buf)).toBeCloseTo(27.32, 1);
  });

  it('reads a second fragment independently', () => {
    const buf = readFileSync('public/audio/free-practice/lu-2.mp3');
    const seconds = mp3DurationSeconds(buf);
    expect(seconds).not.toBeNull();
    expect(seconds!).toBeGreaterThan(10);
    expect(seconds!).toBeLessThan(60);
  });

  it('returns null rather than a guess for something that is not an mp3', () => {
    expect(mp3DurationSeconds(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBeNull();
    expect(mp3DurationSeconds(new Uint8Array(0))).toBeNull();
  });

  it('skips an ID3v2 tag instead of syncing inside it', () => {
    // A 20-byte ID3v2 body of 0xFF bytes would look like frame syncs to a naive parser.
    const tag = new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 20, ...new Array(20).fill(0xff)]);
    expect(mp3DurationSeconds(tag)).toBeNull();
  });
});
