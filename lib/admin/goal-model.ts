import { BUNDLE_PRICE_CENTS, MODULE_PRICE_CENTS } from '@/lib/pricing';
import { KNM_MODULE_ID, normaliseModule, purchasedModules } from '@/lib/entitlements';
import { SKILLS } from '@/data/skills';

/**
 * Het doelmodel voor de Nederlandse markt — `/admin/doelen`.
 *
 * Overgenomen uit de spreadsheet *Income Goal Model* van de eigenaar (okt 2026), met drie
 * afwijkingen die hij zelf vroeg: alleen NL (de DE-rijen vallen weg), taal gesplitst in A2 en B1,
 * en een gemiddelde looptijd van **twee maanden** voor elk product in plaats van 3 / 1,5.
 *
 * **Elk getal in `GOAL_ASSUMPTIONS` is een aanname, geen meting.** Vervang ze door echte cijfers
 * zodra er twee à drie maanden betalingen zijn — de spreadsheet zegt hetzelfde.
 *
 * Omzet is overal **excl. btw en na betaalkosten**, net als in de spreadsheet. De MRR uit
 * `lib/admin/mrr.ts` is incl. btw; `netMonthlyEur` rekent hem om voordat hij naast een doel staat.
 */

export type Track = 'a2' | 'b1' | 'knm';
export type ScenarioKey = 'conservative' | 'base' | 'optimistic';
export type FunnelStepKey = 'visitors' | 'practicing' | 'signups' | 'paid';
export type PeriodKey = 'day' | 'week' | 'month';

export const TRACKS: { key: Track; label: string }[] = [
  { key: 'a2', label: 'Taal A2' },
  { key: 'b1', label: 'Taal B1' },
  { key: 'knm', label: 'KNM' },
];

export const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: 'conservative', label: 'Conservatief' },
  { key: 'base', label: 'Basis' },
  { key: 'optimistic', label: 'Optimistisch' },
];

/** Een maand is hier 30 dagen, zodat dag × 30 en maand altijd hetzelfde doel geven. */
export const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: 'day', label: 'Vandaag', days: 1 },
  { key: 'week', label: '7 dagen', days: 7 },
  { key: 'month', label: '30 dagen', days: 30 },
];

export const GOAL_ASSUMPTIONS = {
  /** Mollie plus overige transactiekosten, als deel van de omzet. */
  feesPct: 0.03,
  vatRate: 0.21,
  /** Gemiddeld aantal betaalde maanden per abonnee (besluit eigenaar, 07-10). */
  lifetimeMonths: 2,
  /** Hoe een taalabonnee koopt: hele niveaubundel, twee modules of één. */
  languageMix: { bundle: 0.45, two: 0.15, one: 0.4 },
  /** Deel van de nieuwe taalabonnees dat A2 kiest. B1 mist Luisteren nog. */
  a2ShareOfLanguage: 0.6,
  /** Nieuwe taalabonnees per maand (A2 + B1 samen), uit de spreadsheet. */
  languageNewPerMonth: { conservative: 40, base: 70, optimistic: 130 },
  knmNewPerMonth: { conservative: 50, base: 75, optimistic: 110 },
  /** Streefconversie per stap, van de vorige stap naar deze. Hieruit volgt het doel per stap. */
  targetStepRates: { practicing: 0.3, signups: 0.35, paid: 0.08 } as Record<Exclude<FunnelStepKey, 'visitors'>, number>,
};

export type Assumptions = typeof GOAL_ASSUMPTIONS;

const exVat = (cents: number, a: Assumptions) => cents / 100 / (1 + a.vatRate);

/** Gemiddelde opbrengst per abonnee per maand, excl. btw, vóór kosten. */
export function arpuEur(track: Track, a: Assumptions = GOAL_ASSUMPTIONS): number {
  const single = exVat(MODULE_PRICE_CENTS, a);
  if (track === 'knm') return single;
  const { bundle, two, one } = a.languageMix;
  return exVat(BUNDLE_PRICE_CENTS, a) * bundle + 2 * single * two + single * one;
}

/** Een bedrag incl. btw (centen) als omzet excl. btw en na kosten. */
export function netMonthlyEur(cents: number, a: Assumptions = GOAL_ASSUMPTIONS): number {
  return exVat(cents, a) * (1 - a.feesPct);
}

export type Scenario = {
  key: ScenarioKey;
  label: string;
  /** Stabiele maandomzet (MRR), excl. btw en na kosten, zodra instroom en uitstroom in evenwicht zijn. */
  mrrEur: number;
  newPerMonth: number;
  newByTrack: Record<Track, number>;
};

export function scenarios(a: Assumptions = GOAL_ASSUMPTIONS): Scenario[] {
  return SCENARIOS.map(({ key, label }) => {
    const lang = a.languageNewPerMonth[key];
    const newByTrack = { a2: lang * a.a2ShareOfLanguage, b1: lang * (1 - a.a2ShareOfLanguage), knm: a.knmNewPerMonth[key] };
    const mrrEur = TRACKS.reduce((s, t) => s + newByTrack[t.key] * a.lifetimeMonths * arpuEur(t.key, a), 0) * (1 - a.feesPct);
    return { key, label, mrrEur, newPerMonth: lang + a.knmNewPerMonth[key], newByTrack };
  });
}

export type PeriodGoal = {
  /** Omzet die in deze periode binnen moet komen, nieuw plus verlengingen, excl. btw na kosten. */
  revenueEur: number;
  byTrack: Record<Track, number>;
  funnel: Record<FunnelStepKey, number>;
};

/** Het doel voor `days` dagen: een dertigste van de maand per dag, terug door de funnel gerekend. */
export function periodGoal(s: Scenario, days: number, a: Assumptions = GOAL_ASSUMPTIONS): PeriodGoal {
  const f = days / 30;
  const r = a.targetStepRates;
  const paid = s.newPerMonth * f;
  const signups = paid / r.paid;
  const practicing = signups / r.signups;
  return {
    revenueEur: s.mrrEur * f,
    byTrack: { a2: s.newByTrack.a2 * f, b1: s.newByTrack.b1 * f, knm: s.newByTrack.knm * f },
    funnel: { visitors: practicing / r.practicing, practicing, signups, paid },
  };
}

/* ── De funnel ─────────────────────────────────────────────────────────────── */

/** `null` betekent **onbekend** (GA4 niet gekoppeld of de vraag faalde), nooit nul. */
export type FunnelActuals = Record<FunnelStepKey, number | null>;

export const FUNNEL_STEPS: { key: FunnelStepKey; label: string; source: string }[] = [
  { key: 'visitors', label: 'Bezoekers', source: 'GA4 · gebruikers' },
  { key: 'practicing', label: 'Start oefenen', source: 'GA4 · proefvragen of examen gestart' },
  { key: 'signups', label: 'Account', source: 'Supabase · nieuwe accounts' },
  { key: 'paid', label: 'Betaling', source: 'Supabase · eerste betaling' },
];

/** Gemeten conversie van de vorige stap naar deze; `null` als de vorige stap onbekend of 0 is. */
export function conversion(actuals: FunnelActuals, key: FunnelStepKey): number | null {
  const i = FUNNEL_STEPS.findIndex(s => s.key === key);
  if (i <= 0) return null;
  const prev = actuals[FUNNEL_STEPS[i - 1].key];
  const cur = actuals[key];
  return prev && cur !== null ? Math.min(cur / prev, 1) : null;
}

export type Focus = {
  step: FunnelStepKey;
  /** `traffic`: er komen te weinig bezoekers. `conversion`: deze stap haalt zijn streefconversie niet. */
  kind: 'traffic' | 'conversion';
  /** Gemeten ÷ doel; onder 1 is achter. */
  attainment: number;
};

/**
 * Waar de funnel het meest achterloopt. Verkeer telt als bezoekers ÷ doel, elke andere stap als
 * gemeten conversie ÷ streefconversie — beide zijn "hoeveel van wat nodig is", dus vergelijkbaar.
 * Een onbekende stap telt niet mee: dat is een meetgat, geen bottleneck.
 */
export function focusStep(actuals: FunnelActuals, goal: PeriodGoal, a: Assumptions = GOAL_ASSUMPTIONS): Focus | null {
  const candidates: Focus[] = [];
  if (actuals.visitors !== null) {
    candidates.push({ step: 'visitors', kind: 'traffic', attainment: actuals.visitors / goal.funnel.visitors });
  }
  for (const step of FUNNEL_STEPS.slice(1)) {
    const rate = conversion(actuals, step.key);
    if (rate === null) continue;
    const key = step.key as Exclude<FunnelStepKey, 'visitors'>;
    candidates.push({ step: key, kind: 'conversion', attainment: rate / a.targetStepRates[key] });
  }
  const behind = candidates.filter(c => c.attainment < 1);
  if (behind.length === 0) return null;
  return behind.reduce((worst, c) => (c.attainment < worst.attainment ? c : worst));
}

/* ── Gemeten: per periode ─────────────────────────────────────────────────── */

export type GoalUser = { id?: string; created_at: string; user_metadata?: Record<string, unknown> | null };
export type GoalPayment = { user_id: string | null; product: string | null; amount_cents: number; created_at: string };

const TZ = 'Europe/Amsterdam';

/** Middernacht in Amsterdam, `days - 1` dagen terug — dezelfde grens als GA4 (property in Europe/Amsterdam). */
export function periodStart(days: number, now = Date.now()): Date {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(now)).split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d - (days - 1));
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(new Date(utcMidnight)).find(p => p.type === 'timeZoneName')?.value ?? 'GMT';
  const match = offset.match(/([+-])(\d{2}):(\d{2})/);
  const minutes = match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  return new Date(utcMidnight - minutes * 60000);
}

function modulesOf(product: string | null): string[] {
  return product?.startsWith('modules:') ? product.slice(8).split(',') : [];
}

function tracksOf(modules: string[]): Set<Track> {
  const out = new Set<Track>();
  for (const raw of modules) {
    const id = normaliseModule(raw);
    if (!id) continue;
    out.add(id === KNM_MODULE_ID ? 'knm' : (id.split(':')[0] as Track));
  }
  return out;
}

/** De producten in één betaling: een heel niveau is de bundel, anders elke module apart. */
export function productLabels(product: string | null): string[] {
  const ids = modulesOf(product).map(normaliseModule).filter((x): x is NonNullable<typeof x> => x !== null);
  const out: string[] = [];
  if (ids.includes(KNM_MODULE_ID)) out.push('KNM');
  for (const level of ['a2', 'b1']) {
    const skills = ids.filter(id => id.startsWith(`${level}:`)).map(id => id.split(':')[1]);
    if (skills.length === 0) continue;
    const name = `Taal ${level.toUpperCase()}`;
    if (SKILLS.every(s => skills.includes(s.slug))) { out.push(`${name} · bundel`); continue; }
    for (const s of skills) out.push(`${name} · ${s[0].toUpperCase()}${s.slice(1)}`);
  }
  return out;
}

export type PeriodActuals = {
  revenueEur: number;
  /** Nieuwe betalende klanten: iemands eerste betaling valt in de periode. */
  sales: number;
  byTrack: Record<Track, number>;
  signups: number;
  /** Verkochte producten in de periode, nieuw en verlengd, meest verkocht eerst. */
  products: { label: string; count: number }[];
};

export function periodActuals(users: GoalUser[], payments: GoalPayment[], start: Date): PeriodActuals {
  const since = start.getTime();
  const first = new Map<string, GoalPayment>();
  for (const p of payments) {
    if (!p.user_id) continue;
    const seen = first.get(p.user_id);
    if (!seen || p.created_at < seen.created_at) first.set(p.user_id, p);
  }

  const byTrack: Record<Track, number> = { a2: 0, b1: 0, knm: 0 };
  let sales = 0;
  for (const p of first.values()) {
    if (Date.parse(p.created_at) < since) continue;
    sales++;
    for (const t of tracksOf(modulesOf(p.product))) byTrack[t]++;
  }

  let cents = 0;
  const counts = new Map<string, number>();
  for (const p of payments) {
    if (Date.parse(p.created_at) < since) continue;
    cents += p.amount_cents;
    for (const label of productLabels(p.product)) counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return {
    revenueEur: netMonthlyEur(cents),
    sales,
    byTrack,
    signups: users.filter(u => Date.parse(u.created_at) >= since).length,
    products: [...counts].map(([label, count]) => ({ label, count })).sort((x, y) => y.count - x.count),
  };
}

/** Lopende abonnees: modules gekocht en niet opgezegd — dezelfde definitie als de MRR. */
export function activeSubscribers(users: GoalUser[]): number {
  return users.filter(u => {
    const meta = u.user_metadata ?? null;
    return typeof meta?.subscription_canceled_at !== 'string' && purchasedModules(meta).length > 0;
  }).length;
}
