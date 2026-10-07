import { BUNDLE_PRICE_CENTS, MODULE_PRICE_CENTS } from '@/lib/pricing';
import { KNM_MODULE_ID, normaliseModule, purchasedModules } from '@/lib/entitlements';

/**
 * Het doelmodel voor de Nederlandse markt — `/admin/doelen`.
 *
 * Overgenomen uit de spreadsheet *Income Goal Model* van de eigenaar (okt 2026), met drie
 * afwijkingen die hij zelf vroeg: alleen NL (de DE-rijen vallen weg), taal gesplitst in A2 en B1,
 * en een gemiddelde looptijd van **twee maanden** voor elk product in plaats van 3 / 1,5.
 *
 * **Elk getal in `GOAL_ASSUMPTIONS` is een aanname, geen meting.** De pagina zet ze naast de
 * gemeten cijfers en zegt welke welke is. Vervang ze door echte cijfers zodra er twee à drie
 * maanden betalingen zijn — de spreadsheet zegt hetzelfde.
 *
 * Omzet is overal **excl. btw en na betaalkosten**, net als het doel in de spreadsheet. De MRR uit
 * `lib/admin/mrr.ts` is incl. btw; `netMonthlyEur` rekent hem om voordat hij naast een mijlpaal
 * staat.
 */

export type Track = 'a2' | 'b1' | 'knm';
export type ScenarioKey = 'conservative' | 'base' | 'optimistic';
export type FunnelStepKey = 'visitors' | 'practicing' | 'signups' | 'paid';

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

export const GOAL_ASSUMPTIONS = {
  /** Omzet per maand excl. btw — €6k netto per maand als zzp'er plus ~€1k kosten. */
  targetEurPerMonth: 12_500,
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
  /**
   * Streefconversie per stap — waar de funnel naartoe moet. Hiermee wordt de bottleneck bepaald:
   * de stap die het verst onder zijn streefwaarde zit.
   */
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

/** Een maandbedrag incl. btw (centen) als omzet excl. btw en na kosten. */
export function netMonthlyEur(cents: number, a: Assumptions = GOAL_ASSUMPTIONS): number {
  return exVat(cents, a) * (1 - a.feesPct);
}

export type TrackPlan = { track: Track; newPerMonth: number; active: number; revenueEur: number };

export type Milestone = {
  key: ScenarioKey | 'target';
  label: string;
  /** Stabiele maandomzet, excl. btw en na kosten, zodra instroom en uitstroom in evenwicht zijn. */
  revenueEur: number;
  newPerMonth: number;
  active: number;
  tracks: TrackPlan[];
};

function plan(newByTrack: Record<Track, number>, lifetime: number, a: Assumptions): TrackPlan[] {
  return TRACKS.map(({ key }) => {
    const newPerMonth = newByTrack[key];
    const active = newPerMonth * lifetime;
    return { track: key, newPerMonth, active, revenueEur: active * arpuEur(key, a) * (1 - a.feesPct) };
  });
}

function scenarioNew(key: ScenarioKey, a: Assumptions): Record<Track, number> {
  const lang = a.languageNewPerMonth[key];
  return {
    a2: lang * a.a2ShareOfLanguage,
    b1: lang * (1 - a.a2ShareOfLanguage),
    knm: a.knmNewPerMonth[key],
  };
}

function milestone(key: Milestone['key'], label: string, tracks: TrackPlan[]): Milestone {
  return {
    key,
    label,
    tracks,
    revenueEur: tracks.reduce((s, t) => s + t.revenueEur, 0),
    newPerMonth: tracks.reduce((s, t) => s + t.newPerMonth, 0),
    active: tracks.reduce((s, t) => s + t.active, 0),
  };
}

/**
 * De drie scenario's plus het doel, oplopend in omzet.
 *
 * Het doel heeft geen eigen instroom in de spreadsheet; hier is het het basisscenario, opgeschaald
 * tot de omzet het doel raakt. Zo houdt het dezelfde verhouding A2 : B1 : KNM.
 */
export function milestones(lifetime = GOAL_ASSUMPTIONS.lifetimeMonths, a: Assumptions = GOAL_ASSUMPTIONS): Milestone[] {
  const list = SCENARIOS.map(s => milestone(s.key, s.label, plan(scenarioNew(s.key, a), lifetime, a)));
  const base = list.find(m => m.key === 'base')!;
  const factor = base.revenueEur > 0 ? a.targetEurPerMonth / base.revenueEur : 0;
  const scaled = Object.fromEntries(base.tracks.map(t => [t.track, t.newPerMonth * factor])) as Record<Track, number>;
  list.push(milestone('target', 'Doel', plan(scaled, lifetime, a)));
  return list.sort((x, y) => x.revenueEur - y.revenueEur);
}

/** De eerste mijlpaal boven de huidige omzet; `null` als alles gehaald is. */
export function nextMilestone(list: Milestone[], currentEur: number): Milestone | null {
  return list.find(m => m.revenueEur > currentEur) ?? null;
}

/* ── De funnel ─────────────────────────────────────────────────────────────── */

/**
 * Wat er in een venster van 30 dagen gemeten is. `null` betekent **onbekend** (GA4 niet
 * geconfigureerd of de vraag faalde), nooit nul.
 */
export type FunnelActuals = Record<FunnelStepKey, number | null>;

export const FUNNEL_STEPS: { key: FunnelStepKey; label: string; source: string }[] = [
  { key: 'visitors', label: 'Bezoekers', source: 'GA4 · gebruikers' },
  { key: 'practicing', label: 'Begint te oefenen', source: 'GA4 · proefvragen of examen gestart' },
  { key: 'signups', label: 'Maakt account', source: 'Supabase · nieuwe accounts' },
  { key: 'paid', label: 'Betaalt', source: 'Supabase · eerste betaling' },
];

export type StepRate = {
  key: Exclude<FunnelStepKey, 'visitors'>;
  /** Gemeten conversie van de vorige stap naar deze; `null` als een van beide onbekend of 0 is. */
  current: number | null;
  target: number;
  /** De conversie waarmee gerekend wordt: gemeten als die er is, anders de streefwaarde. */
  used: number;
  assumed: boolean;
  /** Gemeten ÷ streef. Onder 1 = achter op streef. */
  attainment: number | null;
};

export function stepRates(actuals: FunnelActuals, a: Assumptions = GOAL_ASSUMPTIONS): StepRate[] {
  return FUNNEL_STEPS.slice(1).map((step, i) => {
    const key = step.key as StepRate['key'];
    const prev = actuals[FUNNEL_STEPS[i].key];
    const cur = actuals[key];
    const target = a.targetStepRates[key];
    const current = prev && cur !== null ? Math.min(cur / prev, 1) : null;
    const usable = current !== null && current > 0;
    return {
      key,
      current,
      target,
      used: usable ? current : target,
      assumed: !usable,
      attainment: current === null ? null : current / target,
    };
  });
}

/** Hoeveel er per maand in elke stap moet zitten om `paidPerMonth` betalers te halen. */
export function requiredFunnel(paidPerMonth: number, rates: { key: StepRate['key']; rate: number }[]): Record<FunnelStepKey, number> {
  const r = Object.fromEntries(rates.map(x => [x.key, x.rate])) as Record<StepRate['key'], number>;
  const paid = paidPerMonth;
  const signups = paid / r.paid;
  const practicing = signups / r.signups;
  const visitors = practicing / r.practicing;
  return { visitors, practicing, signups, paid };
}

/**
 * De stap waar de funnel vastzit: de laagste gemeten-÷-streef. Een stap zonder meting telt niet
 * mee — "onbekend" is geen bottleneck, het is een meetgat, en dat zegt de pagina apart.
 */
export function bottleneck(rates: StepRate[]): StepRate | null {
  const measured = rates.filter(r => r.attainment !== null && r.attainment < 1);
  if (measured.length === 0) return null;
  return measured.reduce((worst, r) => (r.attainment! < worst.attainment! ? r : worst));
}

export type MilestoneNeed = {
  milestone: Milestone;
  /** Bij de huidige conversie per stap (streefwaarde waar niets gemeten is). */
  atCurrent: Record<FunnelStepKey, number>;
  /** Als elke stap zijn streefwaarde haalt. */
  atTarget: Record<FunnelStepKey, number>;
};

export function needsFor(list: Milestone[], rates: StepRate[]): MilestoneNeed[] {
  return list.map(m => ({
    milestone: m,
    atCurrent: requiredFunnel(m.newPerMonth, rates.map(r => ({ key: r.key, rate: r.used }))),
    atTarget: requiredFunnel(m.newPerMonth, rates.map(r => ({ key: r.key, rate: Math.max(r.used, r.target) }))),
  }));
}

/* ── Gemeten: abonnees en nieuwe klanten per spoor ─────────────────────────── */

export type GoalUser = { id?: string; created_at: string; user_metadata?: Record<string, unknown> | null };
export type GoalPayment = { user_id: string | null; product: string | null; created_at: string };

function tracksOf(modules: string[]): Set<Track> {
  const out = new Set<Track>();
  for (const raw of modules) {
    const id = normaliseModule(raw);
    if (!id) continue;
    out.add(id === KNM_MODULE_ID ? 'knm' : (id.split(':')[0] as Track));
  }
  return out;
}

/**
 * Lopende abonnees per spoor — dezelfde definitie als de MRR in `lib/admin/mrr.ts`: modules gekocht
 * en niet opgezegd. Wie A2 en KNM heeft telt bij allebei; `total` telt mensen.
 */
export function activeByTrack(users: GoalUser[]): Record<Track, number> & { total: number } {
  const out = { a2: 0, b1: 0, knm: 0, total: 0 };
  for (const u of users) {
    const meta = u.user_metadata ?? null;
    if (typeof meta?.subscription_canceled_at === 'string') continue;
    const tracks = tracksOf(purchasedModules(meta));
    if (tracks.size === 0) continue;
    out.total++;
    for (const t of tracks) out[t]++;
  }
  return out;
}

export type MonthNew = { month: string; label: string } & Record<Track, number>;

/**
 * Nieuwe betalende klanten per maand en per spoor: de **eerste** betaling van iemand. Het spoor
 * komt uit `payments.product` (`modules:a2:lezen,knm`), zoals `/api/checkout-modules` hem schrijft.
 * Een eenmalige legacy-betaling zonder modules telt als klant maar bij geen spoor.
 */
export function newCustomers(payments: GoalPayment[], months = 6, now = Date.now()) {
  const first = new Map<string, GoalPayment>();
  for (const p of payments) {
    if (!p.user_id) continue;
    const seen = first.get(p.user_id);
    if (!seen || p.created_at < seen.created_at) first.set(p.user_id, p);
  }

  const d = new Date(now);
  const keys = Array.from({ length: months }, (_, i) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - (months - 1 - i), 1)).toISOString().slice(0, 7));
  const byMonth = new Map<string, MonthNew>(keys.map(k => [k, {
    month: k,
    label: new Date(`${k}-01T00:00:00Z`).toLocaleString('nl-NL', { month: 'short', timeZone: 'UTC' }),
    a2: 0, b1: 0, knm: 0,
  }]));

  const since30 = now - 30 * 86400000;
  let last30 = 0;
  for (const p of first.values()) {
    if (Date.parse(p.created_at) >= since30) last30++;
    const row = byMonth.get(p.created_at.slice(0, 7));
    if (!row) continue;
    const modules = p.product?.startsWith('modules:') ? p.product.slice(8).split(',') : [];
    for (const t of tracksOf(modules)) row[t]++;
  }
  return { byMonth: [...byMonth.values()], last30 };
}
