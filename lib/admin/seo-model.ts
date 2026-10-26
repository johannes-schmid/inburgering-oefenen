/**
 * Het rekenwerk achter `/admin/seo` — puur, zodat `tests-unit/seo-cockpit.test.ts` het kan
 * vastpinnen. Het lezen van schijf staat in `lib/admin/seo.ts`.
 *
 * Eén regel loopt overal doorheen, dezelfde als in `seo-agent/README.md`: **een bron die
 * ontbreekt of faalt is onbekend, nooit nul.** Daarom is elk getal hier `number | null`.
 */

export type SourceState = { state: 'ok' | 'skipped' | 'error' | 'missing'; detail: string };

export type DayPoint = {
  date: string;
  google: number | null;
  googleClicks: number | null;
  bing: number | null;
  bingClicks: number | null;
  /** Search Console herziet de laatste dagen nog; die tellen als voorlopig. */
  preliminary?: boolean;
};

export type GscDay = { date: string; clicks: number; impressions: number };
export type BingDay = { Date: string; Clicks: number; Impressions: number };

export type LedgerEntry = {
  id?: string;
  date: string;
  window_end: string;
  verdict: 'worked' | 'didnt' | 'inconclusive' | null;
  site?: string;
  page?: string;
  change?: string;
  hypothesis?: string;
  metric?: string;
  verdict_note?: string;
};

export type Owner = 'eigenaar' | 'amber' | 'agent';

/**
 * Een taak op de to-dolijst van `/admin/seo`. **In het Engels** (besluit eigenaar, 26-10): dit is
 * zijn eigen werklijst, geen kopij voor kandidaten. Elke taak zegt waarom, wat de volgende stap is
 * en wat we daarna verwachten te zien — een aanbeveling zonder verwachting is niet te toetsen.
 */
export type Recommendation = {
  id: string;
  created: string;
  site: 'inburgering' | 'knm';
  owner: Owner;
  kind: 'measurement' | 'cleanup' | 'content' | 'title' | 'technical' | 'decision';
  priority: 'now' | 'next' | 'later';
  task: string;
  why: string;
  steps: string[];
  expect: string;
  minutes?: number;
  pages?: string[];
  source: string;
  status: 'open' | 'planned' | 'in-progress' | 'done' | 'dismissed';
};

export type Diagnosis = {
  updated: string;
  question: string;
  answer: string;
  baseline: { start: string; end: string; label: string };
  checks: { status: 'ruled-out' | 'confirmed' | 'open'; title: string; detail: string }[];
  hypotheses: { title: string; why: string; test: string }[];
  recovery: string;
};

/** `ok (2s)` · `skipped: reden` · `error: reden` — de vorm die `collect.mjs` in index.json zet. */
export function parseSourceStatus(raw: string | undefined): SourceState {
  if (!raw) return { state: 'missing', detail: 'niet in deze snapshot' };
  const m = /^(ok|skipped|error)\b:?\s*(.*)$/.exec(raw);
  if (!m) return { state: 'error', detail: raw };
  const state = m[1] as 'ok' | 'skipped' | 'error';
  return { state, detail: state === 'ok' ? m[2].replace(/^\(|\)$/g, '') : m[2] };
}

/** Bing geeft `/Date(1792281600000)/`, soms met een tijdzone erachter; de dag is UTC. */
export function parseBingDate(raw: string): string | null {
  const m = /\/Date\((\d+)/.exec(raw);
  return m ? new Date(Number(m[1])).toISOString().slice(0, 10) : null;
}

/**
 * Eén dagreeks uit alle snapshots. `googleRuns` staat van oud naar nieuw: Search Console
 * herziet zijn laatste dagen nog, dus de nieuwste snapshot wint voor een dag die in twee staat.
 */
export function mergeDaily(googleRuns: GscDay[][], bing: BingDay[]): DayPoint[] {
  const days = new Map<string, DayPoint>();
  const at = (date: string) => {
    let p = days.get(date);
    if (!p) days.set(date, (p = { date, google: null, googleClicks: null, bing: null, bingClicks: null }));
    return p;
  };
  for (const run of googleRuns) {
    for (const r of run) {
      const p = at(r.date);
      p.google = r.impressions;
      p.googleClicks = r.clicks;
    }
  }
  for (const r of bing) {
    const date = parseBingDate(r.Date);
    if (!date) continue;
    const p = at(date);
    p.bing = r.Impressions;
    p.bingClicks = r.Clicks;
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
}

/** Hoogste gemiddelde over `span` opeenvolgende dagen met data, met de dag waarop dat venster eindigt. */
function peak(values: { date: string; v: number }[], span: number): { value: number; date: string } | null {
  let best: { value: number; date: string } | null = null;
  for (let i = span - 1; i < values.length; i++) {
    const m = mean(values.slice(i - span + 1, i + 1).map(x => x.v))!;
    if (!best || m > best.value) best = { value: m, date: values[i].date };
  }
  return best;
}

export type RecoveryRead = {
  tone: 'alarm' | 'let-op' | 'rustig' | 'onbekend';
  /** Waar het verlies zit: alleen bij Google, bij beide, of (zonder val of zonder Bing) niet te zeggen. */
  cause: 'google' | 'beide' | null;
  googleNow: number | null;
  googlePeak: number | null;
  googlePeakDate: string | null;
  googleRatio: number | null;
  bingRatio: number | null;
  /** Laatste zeven dagen tegen de zeven ervoor, als fractie (+0,4 = 40% meer). */
  googleTrend: number | null;
};

const PEAK_SPAN = 14;
const NOW_SPAN = 7;

/**
 * Staan we nog op het niveau van onze beste periode? Een venster van 28 dagen middelt een val
 * weg (zie stap 3a van `/seo-weekly`), dus dit vergelijkt de laatste week met de beste twee weken.
 * Bing ernaast zegt of het aan Google ligt of aan de site: valt Bing niet mee, dan is het Google.
 */
export function recoveryRead(points: DayPoint[]): RecoveryRead {
  const g = points.filter(p => p.google !== null).map(p => ({ date: p.date, v: p.google! }));
  const b = points.filter(p => p.bing !== null).map(p => ({ date: p.date, v: p.bing! }));
  const empty: RecoveryRead = {
    tone: 'onbekend', cause: null, googleNow: null, googlePeak: null, googlePeakDate: null,
    googleRatio: null, bingRatio: null, googleTrend: null,
  };
  if (g.length < 28) return empty;

  const gPeak = peak(g, PEAK_SPAN)!;
  const gNow = mean(g.slice(-NOW_SPAN).map(x => x.v))!;
  const gPrev = mean(g.slice(-2 * NOW_SPAN, -NOW_SPAN).map(x => x.v));
  const googleRatio = gPeak.value > 0 ? gNow / gPeak.value : null;

  let bingRatio: number | null = null;
  if (b.length >= 28) {
    const bPeak = peak(b, PEAK_SPAN)!;
    const bNow = mean(b.slice(-NOW_SPAN).map(x => x.v))!;
    bingRatio = bPeak.value > 0 ? bNow / bPeak.value : null;
  }

  const tone = googleRatio === null ? 'onbekend' : googleRatio < 0.5 ? 'alarm' : googleRatio < 0.8 ? 'let-op' : 'rustig';
  const cause = tone === 'alarm' || tone === 'let-op'
    ? bingRatio === null ? null : bingRatio >= 0.8 ? 'google' : 'beide'
    : null;

  return {
    tone, cause,
    googleNow: gNow, googlePeak: gPeak.value, googlePeakDate: gPeak.date,
    googleRatio, bingRatio,
    googleTrend: gPrev && gPrev > 0 ? gNow / gPrev - 1 : null,
  };
}

const DAY = 86_400_000;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

export type LedgerStatus = {
  kind: 'loopt' | 'oordeel-nodig' | 'worked' | 'didnt' | 'inconclusive';
  daysLeft: number;
  progress: number;
};

/** Een experiment loopt tot `window_end`; daarna wacht het op het oordeel van de zaterdagrun. */
export function ledgerStatus(entry: Pick<LedgerEntry, 'date' | 'window_end' | 'verdict'>, today: string): LedgerStatus {
  const total = Math.max(daysBetween(entry.date, entry.window_end), 1);
  const elapsed = Math.min(Math.max(daysBetween(entry.date, today), 0), total);
  const daysLeft = Math.max(daysBetween(today, entry.window_end), 0);
  const kind = entry.verdict ?? (daysLeft === 0 ? 'oordeel-nodig' : 'loopt');
  return { kind, daysLeft, progress: elapsed / total };
}

export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * De week waarvan er nu een snapshot hoort te zijn. De verzamelaar draait vrijdag 21:00 UTC, dus
 * vanaf zaterdag is dat de week van gisteren; op vrijdag zelf nog die van de vrijdag ervoor.
 */
export function expectedSnapshotWeek(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() - 1);
  return isoWeek(d);
}

/** De vrijdag van de volgende meting, als datum. */
export function nextCollectDate(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const late = now.getUTCDay() === 5 && now.getUTCHours() >= 21;
  if (late) d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const PRIORITY_RANK: Record<Recommendation['priority'], number> = { now: 0, next: 1, later: 2 };
const LIVE: Recommendation['status'][] = ['open', 'planned', 'in-progress'];

/** Op prioriteit; binnen een prioriteit blijft de volgorde van het bestand staan (dat is de volgorde van doen). */
export function byPriority(a: Recommendation, b: Recommendation): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

export function isLive(r: Recommendation): boolean {
  return LIVE.includes(r.status);
}

/**
 * Wat Amber deze week nakijkt. De lus mag nooit meer klaarzetten dan zij in haar uren haalt, dus
 * het budget bepaalt het tempo en niet de agent. Op volgorde van prioriteit; wat niet past schuift door,
 * ook als een kleiner item verderop er nog in zou passen — de volgorde is de prioriteit.
 */
export function planAmberWeek(items: Recommendation[], budgetMinutes: number) {
  const queue = items.filter(r => r.owner === 'amber' && isLive(r)).sort(byPriority);
  const thisWeek: Recommendation[] = [];
  const later: Recommendation[] = [];
  let minutes = 0;
  for (const r of queue) {
    const m = r.minutes ?? 0;
    if (later.length === 0 && minutes + m <= budgetMinutes) {
      thisWeek.push(r);
      minutes += m;
    } else {
      later.push(r);
    }
  }
  return { thisWeek, later, minutes, budget: budgetMinutes };
}

/** Datums vanaf `today - days + 1` tot en met `today` zijn voorlopig. */
export function markPreliminary(points: DayPoint[], today: string, days = 3): DayPoint[] {
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const cut = from.toISOString().slice(0, 10);
  return points.map(p => ({ ...p, preliminary: p.date >= cut }));
}
