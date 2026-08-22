/**
 * Rendering helpers. The engine never formats; this is the only place that knows about locales.
 *
 * Three rules from the design brief, enforced here rather than trusted to each component:
 *
 * 1. **Dates are always written out** — `3 december 2027`, never `03-12-27`. A numeric date is
 *    ambiguous across the three locales this tool ships in, and it is exactly the register of the
 *    government letter people came here to escape.
 * 2. **Estimates are always a range** and always carry the word *ongeveer*. A range collapsed to a
 *    point is our model impersonating a fact.
 * 3. **Never string-concatenate a date.** `Intl` handles Arabic month names and RTL digit shaping;
 *    a template literal does not.
 */
import { formatPlainDate, type PlainDate } from './engine/dates';
import type { EstimatedDate, LegalDate, TimelineDate } from './engine/types';

export type UiLocale = 'nl' | 'en' | 'ar';

const INTL_LOCALE: Record<UiLocale, string> = { nl: 'nl-NL', en: 'en-GB', ar: 'ar' };

export function fmtDate(d: PlainDate, locale: UiLocale): string {
  return formatPlainDate(d, INTL_LOCALE[locale]);
}

/** Month + year only — what a month-precision anchor may honestly be shown as. */
export function fmtMonth(d: PlainDate, locale: UiLocale): string {
  return formatPlainDate(d, INTL_LOCALE[locale], { day: undefined, month: 'long', year: 'numeric' });
}

/** Just the month name, for the month grid in the wizard. */
export function fmtMonthName(month: number, locale: UiLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2020, month - 1, 1)),
  );
}

export function fmtMoney(cents: number, locale: UiLocale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: 'currency',
    currency: 'EUR',
    /* Whole euros when the amount is whole: "€ 250" reads as a price, "€ 250,00" reads as an invoice. */
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** The single date a `LegalDate` resolves to, plus the range an `EstimatedDate` resolves to. */
export function fmtTimelineDate(d: TimelineDate, locale: UiLocale, aboutWord: string): string {
  if (d._tag === 'legal') return fmtDate(d.date, locale);
  const from = fmtMonth(d.earliest, locale);
  const to = fmtMonth(d.latest, locale);
  /* Collapse a range that lands in one month rather than printing "mei 2028 – mei 2028". */
  return from === to ? `${aboutWord} ${from}` : `${aboutWord} ${from} – ${to}`;
}

export const isLegalDate = (d: TimelineDate | null): d is LegalDate => d?._tag === 'legal';
export const isEstimateDate = (d: TimelineDate | null): d is EstimatedDate => d?._tag === 'estimate';

/**
 * Where a bar sits on the timeline, as percentages of the window `[today, wall]`.
 *
 * Returns `null` when there is nothing to draw — no wall, or nothing known about readiness. Drawing
 * a bar from assumptions would make the emptiest plan look like the fullest one.
 */
export function barGeometry(args: {
  today: PlainDate;
  wall: PlainDate;
  readyEarliest: PlainDate;
  readyLatest: PlainDate;
  registrationWeeks: number;
  resultWeeks: number;
  diffDays: (a: PlainDate, b: PlainDate) => number;
  addWeeks: (a: PlainDate, n: number) => PlainDate;
}): { studyPct: number; waitRegPct: number; waitResultPct: number; overflowPct: number } | null {
  const { today, wall, readyLatest, registrationWeeks, resultWeeks, diffDays, addWeeks } = args;
  /* The window is widened to whichever is later, the wall or the end of this bar, so a bar that
   * overruns the deadline is *visible* as overrunning rather than being clipped at 100%. */
  const examAt = addWeeks(readyLatest, registrationWeeks);
  const resultAt = addWeeks(examAt, resultWeeks);
  const span = Math.max(1, diffDays(today, wall));
  const pct = (d: PlainDate) => (diffDays(today, d) / span) * 100;

  const study = Math.max(0, pct(readyLatest));
  const exam = Math.max(study, pct(examAt));
  const result = Math.max(exam, pct(resultAt));
  return {
    studyPct: study,
    waitRegPct: exam - study,
    waitResultPct: result - exam,
    overflowPct: Math.max(0, result - 100),
  };
}
