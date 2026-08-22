/**
 * Calendar arithmetic. Boring on purpose, and the most load-bearing file in the feature.
 *
 * A deadline calculator that is one day out is worse than no calculator at all, and the two ways to
 * be one day out are both pinned here: **leap-day clamping** (29 February + 3 years must be 28
 * February, never 1 March, or someone is handed a day of term they do not have) and the epoch-day
 * round trip that every other function is built on.
 */
import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  diffWeeks,
  fromEpochDay,
  fromISO,
  pd,
  toEpochDay,
  toISO,
} from '@/lib/tijdlijn/engine/dates';

describe('epoch-day round trip', () => {
  it('round-trips a decade of dates', () => {
    for (let n = 18000; n < 22000; n += 7) {
      expect(toEpochDay(fromEpochDay(n))).toBe(n);
    }
  });

  it('anchors on the epoch itself', () => {
    expect(toEpochDay(pd(1970, 1, 1))).toBe(0);
    expect(toISO(fromEpochDay(0))).toBe('1970-01-01');
  });
});

describe('addYears / addMonths clamp instead of rolling over', () => {
  it('29 February + 3 years is 28 February', () => {
    expect(toISO(addYears(pd(2024, 2, 29), 3))).toBe('2027-02-28');
  });

  it('29 February + 4 years stays on the 29th', () => {
    expect(toISO(addYears(pd(2024, 2, 29), 4))).toBe('2028-02-29');
  });

  it('31 January + 1 month is the end of February', () => {
    expect(toISO(addMonths(pd(2026, 1, 31), 1))).toBe('2026-02-28');
    expect(toISO(addMonths(pd(2028, 1, 31), 1))).toBe('2028-02-29');
  });

  it('31 May + 1 month is 30 June', () => {
    expect(toISO(addMonths(pd(2026, 5, 31), 1))).toBe('2026-06-30');
  });

  it('crosses a year boundary backwards', () => {
    expect(toISO(addMonths(pd(2026, 1, 15), -2))).toBe('2025-11-15');
  });
});

describe('addDays / addWeeks', () => {
  it('crosses a leap day', () => {
    expect(toISO(addDays(pd(2028, 2, 28), 1))).toBe('2028-02-29');
    expect(toISO(addDays(pd(2027, 2, 28), 1))).toBe('2027-03-01');
  });

  it('subtracts weeks across a year end', () => {
    expect(toISO(addWeeks(pd(2028, 1, 7), -2))).toBe('2027-12-24');
  });
});

describe('diffWeeks truncates toward zero', () => {
  it('six days is no weeks of room, not one', () => {
    expect(diffWeeks(pd(2026, 8, 20), pd(2026, 8, 26))).toBe(0);
  });

  it('one day late is not a week late', () => {
    expect(diffWeeks(pd(2026, 8, 20), pd(2026, 8, 19))).toBe(0);
  });

  it('counts whole weeks in both directions', () => {
    expect(diffWeeks(pd(2026, 8, 20), pd(2026, 9, 17))).toBe(4);
    expect(diffWeeks(pd(2026, 9, 17), pd(2026, 8, 20))).toBe(-4);
  });
});

describe('fromISO refuses anything that is not a plain calendar date', () => {
  it.each(['2026-8-20', '20-08-2026', '2026-08-20T00:00:00Z', '2026-02-30', ''])('rejects %s', s => {
    expect(fromISO(s)).toBeNull();
  });

  it('accepts a real one', () => {
    expect(fromISO('2026-08-20')).toEqual(pd(2026, 8, 20));
  });
});
