import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  expectedSnapshotWeek, isLive, markPreliminary, mergeDaily, nextCollectDate, parseBingDate, parseSourceStatus, recoveryRead,
  type BingDay, type DayPoint, type Diagnosis, type GscDay, type LedgerEntry, type Recommendation, type RecoveryRead, type SourceState,
} from './seo-model';
import { fetchLiveBing, fetchLiveGsc, type LiveGsc, type PageRow } from './seo-live';
import { pageScore, pageWeight, rollup, type HistoryRow, type ScoreFactor, type ScoreInput, type Verdict } from './seo-score.mjs';

/**
 * De bron van `/admin/seo`: de bestanden die de SEO-lus in de repo zet.
 *
 * Vrijdagavond commit `.github/workflows/seo-collect.yml` een snapshot op `main`, en die commit
 * deployt. Deze pagina leest dus de schijf van de deploy en heeft geen eigen database of sleutel
 * nodig. `outputFileTracingIncludes` in `next.config.ts` zorgt dat `seo-agent/` in de functie zit.
 */

const ROOT = path.join(process.cwd(), 'seo-agent');
const REPO = 'johannes-schmid/inburgering-oefenen';
export const REPO_URL = `https://github.com/${REPO}`;

type Totals = { clicks: number; impressions: number; ctr: number; position: number };
type GscSite = {
  property?: string;
  error?: string;
  windows?: { current: { start: string; end: string }; previous: { start: string; end: string } };
  current?: { query_page?: { keys: [string, string]; clicks: number; impressions: number; position: number }[] };
  daily?: GscDay[];
  totals?: { current: Totals; previous: Totals };
  non_brand?: { current: Totals; previous: Totals };
};
type BingSite = { GetRankAndTrafficStats?: BingDay[]; error?: string };
type HealthSite = {
  sitemap?: { status: number; url_count: number };
  status_counts?: Record<string, number>;
  problems?: Record<string, string[]>;
  orphans?: string[];
  error?: string;
};

export type SourceRow = { key: string; label: string } & SourceState;
export type Window28 = { clicks: number; impressions: number; prevClicks: number; prevImpressions: number };
export type NearQuery = { query: string; page: string; impressions: number; clicks: number; position: number };
export type LostPage = { page: string; before: number; beforePos: number; after: number; afterPos: number | null };
export type Evidence = {
  baseline: { start: string; end: string; pages: number; position: number | null };
  recent: { start: string; end: string; pages: number; position: number | null };
  lost: LostPage[];
};
/** Een pagina uit de triage met haar live cijfers, haar score en wat eraan te doen is. `now: null` = onbekend. */
export type StructurePage = {
  path: string;
  section: string;
  verdict: Verdict;
  reason: string;
  plan: { action: string; owner: string; week?: string; starts?: string; into?: string } | null;
  /** Vertoningen in aug + sep volgens de audit: de maatstaf voor "voor de val". */
  demand: number;
  now: { impressions: number; clicks: number; position: number | null } | null;
  queries: { query: string; impressions: number; position: number }[];
  issues: string[];
  score: number;
  factors: ScoreFactor[];
  weight: number;
  recs: Pick<Recommendation, 'id' | 'task' | 'owner' | 'priority' | 'steps' | 'why' | 'expect' | 'status'>[];
  competitor: string | null;
};
export type PlannedPage = {
  id: string; title: string; section: string; demand: number; evidence: string; why: string; owner: string; week: string; starts: string;
};
export type SiteStructure = {
  updated: string;
  sections: { key: string; label: string; note: string; score: number | null; insights: string[] }[];
  pages: StructurePage[];
  planned: PlannedPage[];
  site: number | null;
  history: HistoryRow[];
  live: boolean;
};
export type Competitors = {
  updated: string;
  method: string;
  queries: { query: string; top: string[]; ours: number | null }[];
  domains: { domain: string; top5: number; top10: number; official: boolean; pages_in_sitemap: number | null }[];
  pages: { url: string; domain: string; intent: string; ours: boolean; author: string; first_hand: string; practice: string; words: number; templated: string; date: string; languages: string; verdict: string }[];
  summary: string;
  differences: { title: string; them: string; us: string; evidence: 'strong' | 'medium' | 'weak' }[];
  lessons: string[];
  by_section?: Record<string, string[]>;
};
export type LiveState = { state: 'live' | 'snapshot' | 'error'; detail: string; fetchedAt: string | null; bingLive: boolean };

export type SeoCockpit = {
  latestWeek: string | null;
  generatedAt: string | null;
  expectedWeek: string;
  nextCollect: string;
  sources: SourceRow[];
  live: LiveState;
  daily: DayPoint[];
  diagnosis: Diagnosis | null;
  evidence: Evidence | null;
  structure: SiteStructure | null;
  competitors: Competitors | null;
  recovery: RecoveryRead;
  inburgering: {
    windows: GscSite['windows'] | null;
    totals: GscSite['totals'] | null;
    nonBrand: GscSite['non_brand'] | null;
    gscError: string | null;
    bing: Window28 | null;
    near: NearQuery[];
  };
  knm: { gscError: string | null; bing: Window28 | null };
  health: { urlCount: number | null; ok: number; errors: { url: string; issues: string[] }[]; lengthIssues: number; orphans: number } | null;
  ledger: LedgerEntry[];
  recommendations: Recommendation[];
  amberBudget: number;
  reports: { name: string; href: string }[];
};

async function json<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(ROOT, file), 'utf8')) as T;
  } catch {
    return null;
  }
}

async function list(dir: string): Promise<string[]> {
  try {
    return (await readdir(path.join(ROOT, dir))).sort();
  } catch {
    return [];
  }
}

/** De laatste 28 dagen met Bing-data tegen de 28 ervoor. Bing loopt niet achter zoals Search Console. */
function bingWindow(rows: BingDay[] | undefined): Window28 | null {
  if (!rows?.length) return null;
  const sorted = rows
    .map(r => ({ date: parseBingDate(r.Date), c: r.Clicks, i: r.Impressions }))
    .filter(r => r.date)
    .sort((a, b) => a.date!.localeCompare(b.date!));
  const cur = sorted.slice(-28);
  const prev = sorted.slice(-56, -28);
  const sum = (xs: typeof sorted, k: 'c' | 'i') => xs.reduce((s, x) => s + x[k], 0);
  return { clicks: sum(cur, 'c'), impressions: sum(cur, 'i'), prevClicks: sum(prev, 'c'), prevImpressions: sum(prev, 'i') };
}

const SOURCE_LABELS: Record<string, string> = {
  gsc: 'Search Console',
  bing: 'Bing Webmaster',
  posthog: 'PostHog',
  health: 'Gezondheidscheck',
  competitors: 'Concurrenten',
  geo: 'AI-zoekmachines',
};

const LENGTH_ISSUE = /^(title|description) \d+ tekens$/;

/** Gemiddelde positie gewogen naar vertoningen, zoals Search Console hem zelf over een periode rekent. */
function weightedPosition(rows: PageRow[]): number | null {
  const impr = rows.reduce((s, r) => s + r.impressions, 0);
  return impr ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impr : null;
}

/** Pagina's die in de nulmeting zichtbaar waren en nu weg zijn of meer dan 15 plaatsen zakten. */
function lostPages(baseline: PageRow[], recent: PageRow[]): LostPage[] {
  const now = new Map(recent.map(r => [r.page, r]));
  return [...baseline]
    .sort((a, b) => b.impressions - a.impressions)
    .map(b => {
      const r = now.get(b.page);
      return { page: b.page, before: b.impressions, beforePos: b.position, after: r?.impressions ?? 0, afterPos: r?.position ?? null };
    })
    .filter(p => p.afterPos === null || p.afterPos > p.beforePos + 15)
    .slice(0, 10);
}

export async function loadSeoCockpit(now = new Date()): Promise<SeoCockpit> {
  const weeks = (await list('data')).filter(d => /^\d{4}-W\d{2}$/.test(d));
  const latestWeek = weeks.at(-1) ?? null;

  const diagnosis = await json<Diagnosis>('diagnosis.json');
  const triage = await json<Triage>('pages.json');
  const [liveGsc, liveBing, index, gsc, bing, health, ledger, recs, config, history, reportFiles, scoreHistory, competitors] = await Promise.all([
    diagnosis ? fetchLiveGsc(diagnosis.baseline, now) : null,
    fetchLiveBing(),
    latestWeek ? json<{ generated_at: string; sources: Record<string, string> }>(`data/${latestWeek}/index.json`) : null,
    latestWeek ? json<{ sites: Record<string, GscSite> }>(`data/${latestWeek}/gsc.json`) : null,
    latestWeek ? json<{ sites: Record<string, BingSite> }>(`data/${latestWeek}/bing.json`) : null,
    latestWeek ? json<{ sites: Record<string, HealthSite> }>(`data/${latestWeek}/health.json`) : null,
    json<{ entries: LedgerEntry[] }>('ledger.json'),
    json<{ items: Recommendation[] }>('recommendations.json'),
    json<{ rules: { amber_minutes_per_week?: number } }>('config.json'),
    list('data/history'),
    list('reports'),
    json<{ rows: HistoryRow[] }>('data/history/health.json'),
    json<Competitors>('competitors-analysis.json'),
  ]);

  // Oud → nieuw: eerst de backfills, dan elke week; de nieuwste snapshot wint per dag.
  const googleRuns: GscDay[][] = [];
  for (const f of history.filter(f => f.startsWith('gsc-daily-'))) {
    const h = await json<{ sites: Record<string, GscDay[]> }>(`data/history/${f}`);
    if (h?.sites.inburgering) googleRuns.push(h.sites.inburgering);
  }
  for (const w of weeks) {
    const g = w === latestWeek ? gsc : await json<{ sites: Record<string, GscSite> }>(`data/${w}/gsc.json`);
    const d = g?.sites.inburgering?.daily;
    if (d) googleRuns.push(d);
  }
  const live = liveGsc && !('error' in liveGsc) ? liveGsc : null;
  if (live) googleRuns.push(live.daily);
  const bingIn = liveBing?.inburgering ?? bing?.sites.inburgering?.GetRankAndTrafficStats ?? [];
  const bingKnm = liveBing?.knm ?? bing?.sites.knm?.GetRankAndTrafficStats;
  const today = now.toISOString().slice(0, 10);
  const daily = markPreliminary(mergeDaily(googleRuns, bingIn), today);

  const gIn = gsc?.sites.inburgering;
  const near: NearQuery[] = (gIn?.current?.query_page ?? [])
    .filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 6)
    .map(r => ({ query: r.keys[0], page: r.keys[1], impressions: r.impressions, clicks: r.clicks, position: r.position }));

  const hIn = health?.sites.inburgering;
  const problems = Object.entries(hIn?.problems ?? {});
  const errors = problems
    .map(([url, issues]) => ({ url, issues: issues.filter(i => !LENGTH_ISSUE.test(i)) }))
    .filter(p => p.issues.length > 0);

  const asTotals = (t: { clicks: number; impressions: number; position: number | null }): Totals => ({
    clicks: t.clicks, impressions: t.impressions, ctr: t.impressions ? t.clicks / t.impressions : 0, position: t.position ?? 0,
  });

  return {
    latestWeek,
    generatedAt: index?.generated_at ?? null,
    expectedWeek: expectedSnapshotWeek(now),
    nextCollect: nextCollectDate(now),
    sources: Object.entries(SOURCE_LABELS).map(([key, label]) => ({ key, label, ...parseSourceStatus(index?.sources[key]) })),
    live: live
      ? { state: 'live', detail: 'Search Console, live', fetchedAt: live.fetchedAt, bingLive: !!liveBing }
      : liveGsc && 'error' in liveGsc
        ? { state: 'error', detail: liveGsc.error, fetchedAt: null, bingLive: !!liveBing }
        : { state: 'snapshot', detail: 'no Search Console key on this server', fetchedAt: null, bingLive: !!liveBing },
    daily,
    diagnosis,
    evidence: live && diagnosis
      ? {
          baseline: { ...diagnosis.baseline, pages: live.pages.baseline.length, position: weightedPosition(live.pages.baseline) },
          recent: { ...live.pages.recentWindow, pages: live.pages.recent.length, position: weightedPosition(live.pages.recent) },
          lost: lostPages(live.pages.baseline, live.pages.recent),
        }
      : null,
    structure: triage
      ? buildStructure(triage, live, gIn, hIn?.problems ?? {}, recs?.items ?? [], competitors, scoreHistory?.rows ?? [])
      : null,
    competitors,
    // Het oordeel rekent zonder de voorlopige dagen: een halve dag van vandaag trekt het weekgemiddelde omlaag.
    recovery: recoveryRead(daily.filter(p => !p.preliminary)),
    inburgering: {
      windows: live ? live.windows : gIn?.windows ?? null,
      totals: live ? { current: asTotals(live.totals.current), previous: asTotals(live.totals.previous) } : gIn?.totals ?? null,
      nonBrand: live ? { current: asTotals(live.nonBrand.current), previous: asTotals(live.nonBrand.previous) } : gIn?.non_brand ?? null,
      gscError: live ? null : gIn?.error ?? (gIn ? null : 'no snapshot'),
      bing: bingWindow(bingIn),
      near,
    },
    knm: {
      gscError: gsc?.sites.knm?.error ?? (gsc?.sites.knm ? null : 'no snapshot'),
      bing: bingWindow(bingKnm),
    },
    health: hIn && !hIn.error
      ? {
          urlCount: hIn.sitemap?.url_count ?? null,
          ok: hIn.status_counts?.['200'] ?? 0,
          errors,
          lengthIssues: problems.length - errors.length,
          orphans: hIn.orphans?.length ?? 0,
        }
      : null,
    ledger: ledger?.entries ?? [],
    recommendations: recs?.items ?? [],
    amberBudget: config?.rules.amber_minutes_per_week ?? 150,
    reports: reportFiles
      .filter(f => f.endsWith('.md'))
      .reverse()
      .map(f => ({ name: f.replace(/\.md$/, ''), href: `${REPO_URL}/blob/main/seo-agent/reports/${f}` })),
  };
}

const SITE_ORIGIN = 'https://inburgeringoefenen.nl';

type Triage = Omit<SiteStructure, 'pages' | 'sections' | 'site' | 'history' | 'live'> & {
  sections: { key: string; label: string; note: string }[];
  pages: Pick<StructurePage, 'path' | 'section' | 'verdict' | 'reason' | 'plan' | 'demand'>[];
};

/**
 * De triage uit `pages.json` met per pagina de cijfers van de laatste 28 dagen (live, anders de
 * snapshot van vrijdag), de bevindingen van de gezondheidscheck, de score en de taken die haar
 * noemen. De som staat in `seo-score.mjs`, dezelfde die de wekelijkse rij schrijft.
 */
function buildStructure(
  triage: Triage,
  live: LiveGsc | null,
  snapshot: GscSite | undefined,
  problems: Record<string, string[]>,
  recommendations: Recommendation[],
  competitors: Competitors | null,
  history: HistoryRow[],
): SiteStructure {
  const key = (url: string) => decodeURI(url.replace(SITE_ORIGIN, '')) || '/';
  const snapRows = (snapshot as { current?: { page?: { keys: [string]; clicks: number; impressions: number; position: number }[] } } | undefined)?.current?.page;
  const rows: PageRow[] | null = live
    ? live.pages.current
    : snapRows ? snapRows.map(r => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })) : null;
  const now = new Map(rows?.map(r => [key(r.page), r]) ?? []);
  const issues = new Map(Object.entries(problems).map(([url, list]) => [key(url), list]));
  const queries = new Map<string, StructurePage['queries']>();
  for (const r of live?.queryPage ?? []) {
    const k = key(r.page);
    queries.set(k, [...(queries.get(k) ?? []), { query: r.query, impressions: r.impressions, position: r.position }]);
  }
  const openRecs = recommendations.filter(isLive);
  const ours = new Map((competitors?.pages ?? []).filter(p => p.ours).map(p => [key(p.url), p.verdict]));

  const inputs: ScoreInput[] = triage.pages.map(p => {
    const r = now.get(p.path);
    return {
      path: p.path, section: p.section, verdict: p.verdict, demand: p.demand,
      now: rows ? { impressions: r?.impressions ?? 0, position: r ? r.position : null } : null,
      issues: issues.get(p.path) ?? [],
    };
  });
  const totals = rollup(inputs);

  const pages: StructurePage[] = triage.pages.map((p, i) => {
    const input = inputs[i];
    const { score, factors } = pageScore(input);
    const r = now.get(p.path);
    return {
      ...p,
      now: rows ? { impressions: r?.impressions ?? 0, clicks: r?.clicks ?? 0, position: r ? r.position : null } : null,
      queries: (queries.get(p.path) ?? []).sort((a, b) => b.impressions - a.impressions).slice(0, 5),
      issues: input.issues,
      score,
      factors,
      weight: pageWeight(input),
      recs: openRecs
        .filter(x => x.pages?.includes(p.path))
        .map(({ id, task, owner, priority, steps, why, expect, status }) => ({ id, task, owner, priority, steps, why, expect, status })),
      competitor: ours.get(p.path) ?? null,
    };
  });

  return {
    updated: triage.updated,
    planned: triage.planned,
    sections: triage.sections.map(s => ({ ...s, score: totals.sections[s.key] ?? null, insights: competitors?.by_section?.[s.key] ?? [] })),
    pages,
    site: totals.site,
    history,
    live: !!live,
  };
}

export type SeoPull = { number: number; title: string; url: string; branch: string; createdAt: string; draft: boolean };

/**
 * De open PR's van de lus, rechtstreeks van GitHub (de repo is publiek, dus zonder sleutel; met
 * `GITHUB_TOKEN` krijgt de pagina een ruimer limiet). `null` is onbekend, `[]` is er geen.
 */
export async function fetchSeoPulls(): Promise<SeoPull[] | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/pulls?state=open&per_page=50`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { number: number; title: string; html_url: string; head: { ref: string }; created_at: string; draft: boolean }[];
    return rows
      .filter(r => /seo/i.test(r.head.ref) || /^seo\b/i.test(r.title))
      .map(r => ({ number: r.number, title: r.title, url: r.html_url, branch: r.head.ref, createdAt: r.created_at, draft: r.draft }));
  } catch {
    return null;
  }
}
