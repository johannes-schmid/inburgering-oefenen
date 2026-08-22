/**
 * The URL encoding round-trips, and refuses rather than guesses.
 *
 * Two properties matter. `encode(decode(s)) === s` keeps a shared link stable, and a link a
 * klantmanager saved must not silently become a *different* plan after we change the scheme — so an
 * unknown version and a malformed anchor both return `null`, which the page turns into the wizard.
 */
import { describe, expect, it } from 'vitest';
import { decodeInput, encodeInput, STATE_VERSION } from '@/lib/tijdlijn/state/encode';
import { emptyInput } from '@/lib/tijdlijn/engine/input';
import { pd } from '@/lib/tijdlijn/engine/dates';
import type { TimelineInput } from '@/lib/tijdlijn/engine/types';

const full = (): TimelineInput => ({
  law: 'wi2021',
  status: 'asiel',
  route: 'b1',
  anchor: { kind: 'pip', date: pd(2025, 5, 12), precision: 'month' },
  targetLevel: 'b1',
  currentLevel: 'a1',
  progress: {
    knm: { state: 'studying', diagnosticScore: 6 },
    lezen: { state: 'passed' },
    spreken: { state: 'failed', attempts: 2 },
    schrijven: { state: 'registered', examDate: pd(2027, 3, 1) },
  },
  courseHoursPerWeek: 6,
  selfStudyHoursPerWeek: 2.5,
  grantedExtensionMonths: 6,
  extensionSignals: ['childbirth', 'illness'],
  wantsNaturalisation: true,
  residenceStart: pd(2023, 9, 1),
});

describe('round trip', () => {
  it('survives a fully-populated input', () => {
    const s = encodeInput(full());
    expect(decodeInput(s)).toEqual(full());
    expect(encodeInput(decodeInput(s)!)).toBe(s);
  });

  it('survives an input where the user knows nothing', () => {
    const s = encodeInput(emptyInput());
    expect(decodeInput(s)).toEqual(emptyInput());
    expect(encodeInput(decodeInput(s)!)).toBe(s);
  });

  it('is stable across many shapes', () => {
    const variants: TimelineInput[] = [
      { ...emptyInput(), law: 'wi2013', route: 'a2_wi2013', anchor: { kind: 'duo_letter', date: pd(2021, 1, 4), precision: 'day' } },
      { ...emptyInput(), status: 'eu_niet_plichtig', route: 'naturalisatie_only', wantsNaturalisation: true },
      { ...emptyInput(), route: 'z', anchor: { kind: 'gemeente_registration', date: pd(2024, 12, 31), precision: 'month' } },
    ];
    for (const v of variants) {
      const s = encodeInput(v);
      expect(decodeInput(s)).toEqual(v);
      expect(encodeInput(decodeInput(s)!)).toBe(s);
    }
  });
});

describe('refuses rather than guesses', () => {
  it('rejects a future schema version', () => {
    const s = encodeInput(full()).replace(/^1/, '9');
    expect(decodeInput(s)).toBeNull();
  });

  it('rejects a truncated string', () => {
    expect(decodeInput(`${STATE_VERSION}~w21~x`)).toBeNull();
  });

  it('rejects a malformed anchor date, because every other date derives from it', () => {
    const s = encodeInput(full()).replace('2025-05-12', '2025-13-99');
    expect(decodeInput(s)).toBeNull();
  });

  it('rejects nothing at all', () => {
    expect(decodeInput(null)).toBeNull();
    expect(decodeInput('')).toBeNull();
  });

  it('drops one unreadable component rather than the whole plan', () => {
    const s = `${encodeInput(full())},zzz:!!`;
    const back = decodeInput(s);
    expect(back).not.toBeNull();
    expect(back!.progress.lezen?.state).toBe('passed');
  });

  it('clamps hostile numbers instead of trusting them', () => {
    const s = encodeInput({ ...emptyInput(), courseHoursPerWeek: 900, grantedExtensionMonths: 9000 });
    const back = decodeInput(s)!;
    expect(back.courseHoursPerWeek).toBe(60);
    expect(back.grantedExtensionMonths).toBe(60);
  });
});
