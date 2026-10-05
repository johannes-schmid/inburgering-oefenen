import { priceForSelection, type ModuleSelection } from '@/lib/pricing';
import { purchasedModules } from '@/lib/entitlements';

/**
 * Terugkerende omzet en opzeggingen, gerekend uit `auth.users.user_metadata`.
 *
 * Er is geen abonnementen-tabel: de Mollie-webhook schrijft `modules`, `/api/cancel-subscription`
 * schrijft `subscription_canceled_at` en `modules_until`. Dat is de enige plek waar staat wat er
 * maandelijks binnenkomt, dus wordt het hier gelezen in plaats van uit `payments` — een som over
 * `payments` is *gefactureerde* omzet en telt de maand van vandaag nog niet mee.
 *
 * **Een legacy `plan`-account telt niet mee in de MRR.** Die kocht Professioneel of Compleet als
 * eenmalige betaling; er loopt geen incasso op. Ze als abonnee tellen zou een bedrag opleveren dat
 * nooit binnenkomt.
 *
 * **Een opgezegd account telt óók niet mee**, ook niet zolang de betaalde periode loopt: de volgende
 * incasso valt niet meer, dus die euro's zijn geen *recurring* revenue. Ze staan apart als
 * `pendingChurnCents` — dat is wat er de komende weken van de MRR af gaat.
 *
 * De prijs per klant is `priceForSelection`, niet modules × €9,95: wie een heel niveau heeft betaalt
 * de bundelprijs, en die tien cent verschil per bundel is precies het soort afwijking dat je pas op
 * het Mollie-overzicht terugvindt.
 */
export type SubscriptionUser = {
  id?: string;
  created_at: string;
  user_metadata?: Record<string, unknown> | null;
};

export type MrrSummary = {
  /** Maandelijks terugkerende omzet in centen: actieve, niet-opgezegde abonnementen. */
  mrrCents: number;
  /** Aantal betalende abonnees achter die MRR. */
  activeSubscribers: number;
  /** Gemiddelde opbrengst per abonnee, in centen. 0 als er niemand is. */
  arpuCents: number;
  /** Opgezegd maar de betaalde periode loopt nog — dit gaat er binnenkort af. */
  pendingChurnCents: number;
  pendingChurnCount: number;
  /** Opgezegd én de toegang is verlopen: echt weg. */
  churnedCount: number;
  /** Opzeggingen in de laatste 30 dagen. */
  churnedLast30: number;
  /**
   * Maandelijkse churn in procenten: opzeggingen van de laatste 30 dagen gedeeld door het
   * aantal abonnees dat er aan het begin van die periode was (actief + die 30 opzeggingen).
   */
  churnRatePct: number;
  /** Verloren MRR van alles wat ooit is opgezegd, tegen de prijs van vandaag. */
  churnedMrrCents: number;
  /** De laatste opzeggingen, nieuwste eerst. */
  recentCancellations: { email: string; modules: string[]; cents: number; canceledAt: string }[];
};

type WithEmail = SubscriptionUser & { email?: string | null };

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

export function summariseSubscriptions(users: WithEmail[], now = Date.now()): MrrSummary {
  let mrrCents = 0;
  let activeSubscribers = 0;
  let pendingChurnCents = 0;
  let pendingChurnCount = 0;
  let churnedCount = 0;
  let churnedLast30 = 0;
  let churnedMrrCents = 0;
  const recent: MrrSummary['recentCancellations'] = [];

  const thirtyDaysAgo = now - 30 * 86400000;

  for (const u of users) {
    const meta = u.user_metadata ?? null;
    const modules = purchasedModules(meta) as ModuleSelection;
    if (modules.length === 0) continue;

    const cents = priceForSelection(modules);
    const canceledAt = str(meta?.subscription_canceled_at);

    if (!canceledAt) {
      mrrCents += cents;
      activeSubscribers++;
      continue;
    }

    churnedMrrCents += cents;
    const until = str(meta?.modules_until);
    const stillRunning = until ? Date.parse(until) >= now : true;
    if (stillRunning) {
      pendingChurnCents += cents;
      pendingChurnCount++;
    } else {
      churnedCount++;
    }
    if (Date.parse(canceledAt) >= thirtyDaysAgo) churnedLast30++;

    recent.push({
      email: u.email ?? '—',
      modules,
      cents,
      canceledAt,
    });
  }

  recent.sort((a, b) => b.canceledAt.localeCompare(a.canceledAt));

  const base = activeSubscribers + churnedLast30;

  return {
    mrrCents,
    activeSubscribers,
    arpuCents: activeSubscribers > 0 ? Math.round(mrrCents / activeSubscribers) : 0,
    pendingChurnCents,
    pendingChurnCount,
    churnedCount,
    churnedLast30,
    churnRatePct: base > 0 ? (churnedLast30 / base) * 100 : 0,
    churnedMrrCents,
    recentCancellations: recent.slice(0, 5),
  };
}

/* ── MRR-beweging per maand ───────────────────────────────────────────────── */

/**
 * De vijf bewegingen achter de MRR, per maand.
 *
 * Een vlakke MRR-lijn kan €500 nieuw tegen €500 opzegging verbergen; deze reeks laat de motor zien
 * in plaats van alleen de uitkomst. Positief zijn `newCents`, `expansionCents` en
 * `reactivationCents`, negatief zijn `contractionCents` en `churnCents` — de laatste twee worden
 * hier al als negatief getal bewaard, zodat de grafiek ze onder de nullijn kan stapelen zonder
 * ergens een teken om te draaien.
 *
 * ## Waar dit vandaan komt, en wat het níet weet
 * Er is geen abonnementenlogboek. De reconstructie leest twee dingen:
 *
 * - **`payments`** voor de instroom. Let op: alleen `/api/checkout-modules` schrijft een rij, dus de
 *   tabel bevat *eerste* betalingen en bijkopen — géén maandelijkse incasso's. Dat is hier precies
 *   goed: elke rij is een moment waarop de MRR omhoog ging, en een verlenging hoort in een
 *   bewegingsgrafiek juist niet thuis.
 * - **`user_metadata`** voor de uitstroom: `subscription_canceled_at` zegt wanneer er is opgezegd,
 *   `modules_until` wanneer de laatste betaalde periode afloopt. De churn valt in de maand waarin de
 *   incasso wegvalt (`modules_until`), niet in de maand van de opzegging zelf — anders staat het
 *   verlies een maand te vroeg in de grafiek en klopt het niet met de MRR-tegel, die een opzegging
 *   in zijn lopende periode apart telt.
 *
 * Twee eerlijke beperkingen, die op de kaart ook genoemd worden:
 *
 * - **`contractionCents` is vandaag altijd 0.** Opzeggen is alles-of-niets — `/api/cancel-subscription`
 *   zegt elk abonnement van de klant op — dus een gedeeltelijke afbouw bestaat niet. Het blok blijft
 *   in het model staan omdat een per-module-opzegging het wél gaat vullen; een reeks die er dan pas
 *   bijkomt, breekt de grafiek op het moment dat hij interessant wordt.
 * - **`reactivationCents`** is een betaling van iemand die eerder had opgezegd. Metadata bewaart maar
 *   één opzegdatum, dus een klant die twee keer terugkomt telt de eerste keer als nieuw.
 *
 * De MRR-lijn is de **optelsom van de bewegingen**, vooruit gerekend vanaf de allereerste betaling:
 * de MRR van een maand is die van de maand ervoor plus zijn netto beweging, en de tegel toont de
 * laatste waarde van die lijn (`mrrFromMovements`). Tot 05-10 ging het andersom — de lijn werd
 * terúggerekend vanaf een MRR uit `user_metadata.modules` — en dat lekte: modules die ooit zonder
 * betaling zijn toegekend (legacy-accounts, handmatige toekenningen) stonden wél in de metadata
 * maar nooit in `payments`, dus de lijn begon in de oudste maand op een bedrag dat uit niets kwam.
 * Nu kan een euro alleen in de MRR staan als er een betaling of een opzegging achter zit.
 */
export type MrrMonth = {
  /** `YYYY-MM`. */
  month: string;
  /** `sep 26`. */
  label: string;
  newCents: number;
  expansionCents: number;
  reactivationCents: number;
  /** Negatief of 0. */
  contractionCents: number;
  /** Negatief of 0. */
  churnCents: number;
  netCents: number;
  /** MRR aan het eind van de maand. */
  mrrCents: number;
};

export type MovementPayment = {
  user_id: string | null;
  amount_cents: number;
  created_at: string;
};

const monthKey = (iso: string) => iso.slice(0, 7);

function monthLabel(key: string): string {
  const d = new Date(`${key}-01T00:00:00Z`);
  return `${d.toLocaleString('nl-NL', { month: 'short', timeZone: 'UTC' })} ${String(d.getUTCFullYear()).slice(2)}`;
}

/** De laatste `count` maanden, oudste eerst, als `YYYY-MM`. */
function lastMonths(count: number, now: number): string[] {
  const d = new Date(now);
  return Array.from({ length: count }, (_, i) => {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - (count - 1 - i), 1));
    return m.toISOString().slice(0, 7);
  });
}

export function buildMrrMovements(
  users: WithEmail[],
  payments: MovementPayment[],
  months = 6,
  now = Date.now(),
): MrrMonth[] {
  const keys = lastMonths(months, now);
  const empty = () => ({ newCents: 0, expansionCents: 0, reactivationCents: 0, contractionCents: 0, churnCents: 0 });
  // Alle maanden tot en met nu krijgen een emmer, ook vóór het venster: de lijn telt vanaf de
  // eerste betaling en toont alleen de laatste `months`.
  const buckets: Record<string, ReturnType<typeof empty>> = {};
  const bucket = (k: string) => {
    if (k > keys[keys.length - 1]) return null;
    return (buckets[k] ??= empty());
  };
  for (const k of keys) bucket(k);

  // Wanneer iemand voor het eerst opzegde — nodig om een latere betaling als reactivatie te lezen.
  const canceledAtByUser = new Map<string, number>();
  for (const u of users) {
    const at = str(u.user_metadata?.subscription_canceled_at);
    const id = str(u.id);
    if (at && id) canceledAtByUser.set(id, Date.parse(at));
  }

  // Betalingen per klant, oudste eerst: de eerste is nieuw, de rest bijkoop of reactivatie.
  const byUser = new Map<string, MovementPayment[]>();
  for (const p of payments) {
    if (!p.user_id) continue;
    const list = byUser.get(p.user_id) ?? [];
    list.push(p);
    byUser.set(p.user_id, list);
  }

  for (const [userId, list] of byUser) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const canceled = canceledAtByUser.get(userId);
    list.forEach((p, i) => {
      const b = bucket(monthKey(p.created_at));
      if (!b) return;
      if (i === 0) b.newCents += p.amount_cents;
      else if (canceled !== undefined && Date.parse(p.created_at) > canceled) {
        b.reactivationCents += p.amount_cents;
      } else b.expansionCents += p.amount_cents;
    });
  }

  for (const u of users) {
    const meta = u.user_metadata ?? null;
    const canceledAt = str(meta?.subscription_canceled_at);
    if (!canceledAt) continue;
    const modules = purchasedModules(meta) as ModuleSelection;
    if (modules.length === 0) continue;
    // De incasso valt weg aan het eind van de betaalde periode; ontbreekt die datum, dan is de
    // opzegdatum het beste dat we hebben.
    const b = bucket(monthKey(str(meta?.modules_until) ?? canceledAt));
    if (!b) continue;
    b.churnCents -= priceForSelection(modules);
  }

  // Vooruit optellen vanaf de oudste maand; wat vóór het venster ligt wordt het startpunt.
  let running = 0;
  const rows: MrrMonth[] = [];
  for (const month of Object.keys(buckets).sort()) {
    const b = buckets[month];
    const netCents = b.newCents + b.expansionCents + b.reactivationCents + b.contractionCents + b.churnCents;
    running += netCents;
    if (month >= keys[0]) rows.push({ month, label: monthLabel(month), ...b, netCents, mrrCents: running });
  }

  return rows;
}

/**
 * De tegel leest de MRR van de grafiek — de laatste waarde van de lijn — en niet die uit de
 * metadata. Het aantal abonnees en de gemiddelde opbrengst volgen mee.
 */
export function mrrFromMovements(summary: MrrSummary, rows: MrrMonth[]): MrrSummary {
  const mrrCents = rows.length > 0 ? rows[rows.length - 1].mrrCents : 0;
  return {
    ...summary,
    mrrCents,
    arpuCents: summary.activeSubscribers > 0 ? Math.round(mrrCents / summary.activeSubscribers) : 0,
  };
}
