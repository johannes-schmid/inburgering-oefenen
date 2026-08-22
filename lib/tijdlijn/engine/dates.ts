/**
 * The only place in the tijdlijn feature where calendar arithmetic is allowed.
 *
 * **`PlainDate` is a value object, never a JS `Date`.** A deadline calculator that is one day off
 * is worse than no calculator, and `new Date('2026-08-20')` is UTC midnight while
 * `new Date(2026, 7, 20)` is local midnight — the two disagree by a day for anyone west of
 * Greenwich and around every DST boundary. There is no timezone in a legal deadline: DUO's term is
 * three calendar years from a calendar date, so calendar dates are what we compute with.
 *
 * `addYears` and `addMonths` **clamp** rather than roll over: 29 February + 3 years is
 * 28 February, not 1 March. Rolling over would silently hand someone an extra day of term.
 *
 * `today` is never read here. The engine takes it as an argument so every test can pin it.
 */

export type PlainDate = { y: number; m: number; d: number };

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  return m === 2 && isLeap(y) ? 29 : DAYS_IN_MONTH[m - 1];
}

export function pd(y: number, m: number, d: number): PlainDate {
  return { y, m, d };
}

export function isValid(x: PlainDate): boolean {
  return (
    Number.isInteger(x.y) &&
    Number.isInteger(x.m) &&
    Number.isInteger(x.d) &&
    x.m >= 1 &&
    x.m <= 12 &&
    x.d >= 1 &&
    x.d <= daysInMonth(x.y, x.m)
  );
}

/** `2026-08-20` → PlainDate. Returns null on anything else, including a real `Date`'s ISO string. */
export function fromISO(s: string): PlainDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const out = pd(Number(m[1]), Number(m[2]), Number(m[3]));
  return isValid(out) ? out : null;
}

export function toISO(x: PlainDate): string {
  return `${String(x.y).padStart(4, '0')}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;
}

/** Days since 1970-01-01, proleptic Gregorian. Pure integer maths — no `Date`, no milliseconds. */
export function toEpochDay(x: PlainDate): number {
  const a = Math.floor((14 - x.m) / 12);
  const y = x.y + 4800 - a;
  const m = x.m + 12 * a - 3;
  const jdn =
    x.d + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  return jdn - 2440588;
}

export function fromEpochDay(n: number): PlainDate {
  const jdn = n + 2440588;
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * dd) / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  return pd(100 * b + dd - 4800 + Math.floor((mm + 2) / 12), ((mm + 2) % 12) + 1, e - Math.floor((153 * mm + 2) / 5) + 1);
}

export function addDays(x: PlainDate, n: number): PlainDate {
  return fromEpochDay(toEpochDay(x) + n);
}

export function addWeeks(x: PlainDate, n: number): PlainDate {
  return addDays(x, n * 7);
}

/** Clamps to the end of the target month: 31 January + 1 month is 28/29 February. */
export function addMonths(x: PlainDate, n: number): PlainDate {
  const total = x.y * 12 + (x.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return pd(y, m, Math.min(x.d, daysInMonth(y, m)));
}

/** Clamps 29 February. Whole years only — pass a fraction and you get a rounded month count. */
export function addYears(x: PlainDate, n: number): PlainDate {
  return Number.isInteger(n) ? addMonths(x, n * 12) : addMonths(x, Math.round(n * 12));
}

/** -1 / 0 / 1. */
export function cmp(a: PlainDate, b: PlainDate): number {
  const ea = toEpochDay(a);
  const eb = toEpochDay(b);
  return ea < eb ? -1 : ea > eb ? 1 : 0;
}

export const isBefore = (a: PlainDate, b: PlainDate) => cmp(a, b) < 0;
export const isAfter = (a: PlainDate, b: PlainDate) => cmp(a, b) > 0;
export const isSame = (a: PlainDate, b: PlainDate) => cmp(a, b) === 0;

export function minOf(a: PlainDate, b: PlainDate): PlainDate {
  return isBefore(a, b) ? a : b;
}
export function maxOf(a: PlainDate, b: PlainDate): PlainDate {
  return isAfter(a, b) ? a : b;
}

export function diffDays(from: PlainDate, to: PlainDate): number {
  return toEpochDay(to) - toEpochDay(from);
}

/**
 * Whole weeks from `from` to `to`, **truncated toward zero**.
 *
 * Truncation matters and is deliberate: a slack of 6 days must read as 0 weeks of room, not 1.
 * `Math.floor` would turn −1 day into −1 week, which overstates how late someone is; truncation
 * keeps the sign honest on both sides of zero.
 */
export function diffWeeks(from: PlainDate, to: PlainDate): number {
  const w = Math.trunc(diffDays(from, to) / 7);
  /* `+ 0` normalises `-0`, which `Math.trunc` produces for any negative fraction. `-0` compares
   * equal to `0` with `===` but not with `Object.is`, so it survives arithmetic and then fails a
   * test or flips a `Math.sign` check months later. */
  return w + 0;
}

export function startOfMonth(x: PlainDate): PlainDate {
  return pd(x.y, x.m, 1);
}
export function endOfMonth(x: PlainDate): PlainDate {
  return pd(x.y, x.m, daysInMonth(x.y, x.m));
}

/** For rendering only. The engine never formats. */
export function formatPlainDate(x: PlainDate, locale: string, opts?: Intl.DateTimeFormatOptions): string {
  /* `Date.UTC` + `timeZone: 'UTC'` is the one safe bridge to `Intl`: the instant is constructed and
   * read back in the same zone, so the calendar date cannot shift. Never hand `Intl` a local Date. */
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    ...opts,
  }).format(new Date(Date.UTC(x.y, x.m - 1, x.d)));
}
