/** ISO-weeknotatie en de vaste vensters van de lus. Puur, zodat de test ze kan vastpinnen. */

export function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function isoWeekNumber(label) {
  return Number(label.split('-W')[1]);
}

export function isEvenWeek(label) {
  return isoWeekNumber(label) % 2 === 0;
}

export function ymd(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Twee aaneensluitende vensters van `days` dagen, eindigend `lag` dagen vóór `today`
 * (Search Console loopt twee tot drie dagen achter; `all` geeft verse maar onvolledige data).
 */
export function windows(today = new Date(), days = 28, lag = 3) {
  const end = addDays(today, -lag);
  const start = addDays(end, -(days - 1));
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return {
    current: { start: ymd(start), end: ymd(end) },
    previous: { start: ymd(prevStart), end: ymd(prevEnd) },
  };
}
