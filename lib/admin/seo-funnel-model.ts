/**
 * De funnel van `/admin/seo`, puur: van een bezoek uit Google of een AI-assistent tot een betaling,
 * per landingspagina. De rijen komen uit GA4 (`seo-funnel.ts`); hier staat alleen de rekensom, zodat
 * hij getest is.
 *
 * **Waarom GA4 en niet PostHog of Supabase:** alleen GA4 koppelt een event aan de landingspagina van
 * de sessie. `signup_completed` en `payment_completed` zijn servergebeurtenissen en gaan alleen naar
 * PostHog, dus de stappen hier zijn de clientgebeurtenissen die er wél in GA4 staan: inloggen
 * gestart (Google-knop) en de bevestigingspagina na betalen (met het bedrag als `value`).
 *
 * Gebruikers worden per landingspagina geteld; wie via twee pagina's binnenkwam, telt twee keer. Voor
 * de vergelijking tussen pagina's maakt dat niets uit, voor een exact totaal wel — de pagina zegt het.
 */

export type FunnelStep = 'visits' | 'practice' | 'account' | 'checkout' | 'paid';
export type FunnelCounts = Record<FunnelStep, number> & { revenue: number };
export type PageKind = 'gids' | 'blog' | 'practice' | 'other';

export const STEPS: FunnelStep[] = ['visits', 'practice', 'account', 'checkout', 'paid'];

export const STEP_EVENTS: Record<Exclude<FunnelStep, 'visits'>, string[]> = {
  practice: ['free_practice_started', 'exam_started'],
  account: ['login_initiated'],
  checkout: ['checkout_initiated'],
  paid: ['payment_success_viewed'],
};

export const FUNNEL_EVENTS = Object.values(STEP_EVENTS).flat();

const STEP_OF_EVENT = new Map(
  (Object.entries(STEP_EVENTS) as [Exclude<FunnelStep, 'visits'>, string[]][]).flatMap(([step, evs]) => evs.map(e => [e, step] as const)),
);

export const emptyCounts = (): FunnelCounts => ({ visits: 0, practice: 0, account: 0, checkout: 0, paid: 0, revenue: 0 });

const ENGINES: [RegExp, string][] = [
  [/chatgpt|openai/i, 'ChatGPT'],
  [/perplexity/i, 'Perplexity'],
  [/gemini|bard/i, 'Gemini'],
  [/copilot/i, 'Copilot'],
  [/claude/i, 'Claude'],
];

/** Welke AI-assistent achter een GA4-bron zit. Perplexity komt vaak binnen als "Unassigned". */
export function aiEngine(source: string): string | null {
  return ENGINES.find(([re]) => re.test(source))?.[1] ?? null;
}

export function isSearchSession(channel: string, source: string): boolean {
  return channel === 'Organic Search' || channel === 'AI Assistant' || aiEngine(source) !== null;
}

export function normalisePath(landing: string): string | null {
  if (!landing || !landing.startsWith('/')) return null;
  let p = landing;
  try {
    p = decodeURI(landing);
  } catch {}
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

export function kindOfSection(section: string): PageKind {
  if (section === 'guides' || section === 'knm') return 'gids';
  if (section === 'blog') return 'blog';
  if (section === 'practice') return 'practice';
  return 'other';
}

export type SessionRow = { page: string; channel: string; source: string; sessions: number };
export type EventRow = { page: string; channel: string; source: string; event: string; users: number; value: number };

export type Funnel = {
  byPage: Record<string, FunnelCounts>;
  total: FunnelCounts;
  ai: { engine: string; sessions: number }[];
  aiByPage: Record<string, number>;
};

export function buildFunnel(sessions: SessionRow[], events: EventRow[]): Funnel {
  const byPage: Record<string, FunnelCounts> = {};
  const total = emptyCounts();
  const ai = new Map<string, number>();
  const aiByPage: Record<string, number> = {};
  const at = (page: string) => {
    const p = normalisePath(page);
    return p ? (byPage[p] ??= emptyCounts()) : null;
  };

  for (const r of sessions) {
    if (!isSearchSession(r.channel, r.source)) continue;
    total.visits += r.sessions;
    const c = at(r.page);
    if (c) c.visits += r.sessions;
    const engine = aiEngine(r.source);
    if (engine) {
      ai.set(engine, (ai.get(engine) ?? 0) + r.sessions);
      const p = normalisePath(r.page);
      if (p) aiByPage[p] = (aiByPage[p] ?? 0) + r.sessions;
    }
  }
  for (const r of events) {
    const step = STEP_OF_EVENT.get(r.event);
    if (!step || !isSearchSession(r.channel, r.source)) continue;
    total[step] += r.users;
    const c = at(r.page);
    if (c) c[step] += r.users;
    if (step === 'paid') {
      total.revenue += r.value;
      if (c) c.revenue += r.value;
    }
  }
  total.revenue = Math.round(total.revenue * 100) / 100;
  for (const c of Object.values(byPage)) c.revenue = Math.round(c.revenue * 100) / 100;

  return {
    byPage,
    total,
    ai: [...ai].map(([engine, n]) => ({ engine, sessions: n })).sort((a, b) => b.sessions - a.sessions),
    aiByPage,
  };
}

export function rollupByKind(byPage: Record<string, FunnelCounts>, kindOf: (path: string) => PageKind | null): Record<PageKind, FunnelCounts> {
  const out: Record<PageKind, FunnelCounts> = { gids: emptyCounts(), blog: emptyCounts(), practice: emptyCounts(), other: emptyCounts() };
  for (const [path, c] of Object.entries(byPage)) {
    const k = kindOf(path) ?? 'other';
    for (const key of [...STEPS, 'revenue'] as const) out[k][key] += c[key];
  }
  for (const k of Object.keys(out) as PageKind[]) out[k].revenue = Math.round(out[k].revenue * 100) / 100;
  return out;
}

/** Onder 20 bezoeken is elke conversie toeval. */
const MIN_VISITS = 20;

/** De stap waar naar verhouding de meeste mensen afhaken, of null bij te weinig verkeer. */
export function weakestStep(c: FunnelCounts): Exclude<FunnelStep, 'visits'> | null {
  if (c.visits < MIN_VISITS) return null;
  let worst: Exclude<FunnelStep, 'visits'> | null = null;
  let lowest = Infinity;
  for (let i = 1; i < STEPS.length; i++) {
    const prev = c[STEPS[i - 1]];
    if (!prev) break;
    const rate = c[STEPS[i]] / prev;
    if (rate < lowest) {
      lowest = rate;
      worst = STEPS[i] as Exclude<FunnelStep, 'visits'>;
    }
  }
  return worst;
}

export const rate = (num: number, den: number) => (den ? num / den : null);

export type IndexState = 'indexed' | 'not-indexed' | 'discovered' | 'canonical' | 'unknown';
export type IndexRecord = { verdict: string; coverage: string; lastCrawl?: string | null };

/**
 * "Discovered" is niet hetzelfde als "crawled, not indexed": het eerste is wachten, het tweede een
 * oordeel. Een alternatieve pagina met een juiste canonical staat bewust niet in de index — geen probleem.
 */
export function indexState(r: IndexRecord | undefined): IndexState {
  if (!r) return 'unknown';
  if (r.verdict === 'PASS') return 'indexed';
  if (/^discovered/i.test(r.coverage)) return 'discovered';
  if (/^alternate page with proper canonical/i.test(r.coverage)) return 'canonical';
  return 'not-indexed';
}
