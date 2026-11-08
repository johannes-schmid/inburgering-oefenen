/**
 * Co-terming: één abonnement per klant, één verlengdatum, en modules die er halverwege bij komen
 * of eraf gaan.
 *
 * Besluit eigenaar (08-11): wat erbij komt gaat meteen open en kost nu alleen het resterende deel
 * van de lopende periode; wat eraf gaat blijft open tot de verlengdatum en valt dan van de
 * incasso. Wisselen is beide in één keer. Zie `docs/decisions/billing-coterm.md`.
 *
 * Puur: geen Mollie, geen Supabase, geen klok. De route geeft `today` mee, zodat dezelfde
 * berekening in de preview en bij het bevestigen hetzelfde bedrag geeft en een test hem kan
 * vastzetten.
 *
 * ## Wat "al betaald" betekent
 * Het verschil wordt berekend tegen alles wat tot de verlengdatum betaald is: wat verlengt
 * (`renewing`) plus wat tot die datum loopt maar niet meer verlengt (`paidThrough`). Een module die
 * iemand eerder deze periode opzegde, telt dus mee voor de bundel — die maand is ervoor betaald —
 * en terugzetten kost niets.
 *
 * ## Waarom `priceForSelection` en geen moduletelling
 * Het verschil tussen drie A2-modules en de bundel is tien cent, niet €9,95. Rekenen met losse
 * modules zou de vierde module halverwege de maand duurder maken dan hij ooit per maand kost.
 */
import { applyDiscount, priceForSelection, type ModuleSelection } from '@/lib/pricing';
import type { ModuleId } from '@/lib/entitlements';

/**
 * Onder dit bedrag wordt er niets geïncasseerd en zijn de dagen gratis (besluit eigenaar).
 *
 * Elke incasso kost een Mollie-transactie en verschijnt als regel op het bankafschrift; een
 * afschrijving van €0,33 kost meer vertrouwen dan hij oplevert.
 */
export const MIN_CHARGE_CENTS = 100;

export type ChangeInput = {
  /** Wat het abonnement nu incasseert. */
  renewing: string[];
  /** Open tot `periodEnd`, al betaald, maar verlengt niet meer. */
  paidThrough: string[];
  add: string[];
  remove: string[];
  /** `nextPaymentDate` van het abonnement, `YYYY-MM-DD`. */
  periodEnd: string;
  /** `YYYY-MM-DD`. */
  today: string;
  /** Kortingspercentage dat op het abonnement zit; 0 zonder code. */
  discountPct: number;
};

export type ChangeQuote = {
  /** Gaat open en was deze periode niet betaald. */
  newlyGranted: ModuleId[];
  /** Was opgezegd maar loopt nog; verlengt weer. Kost niets. */
  restored: ModuleId[];
  /** Blijft open tot `periodEnd` en verlengt niet meer. */
  removed: ModuleId[];
  renewingAfter: ModuleId[];
  /** Het resterende deel vóór de drempel. */
  proratedCents: number;
  /** Wat er nu werkelijk wordt geïncasseerd. */
  chargeNowCents: number;
  /** Er viel iets te rekenen, maar het lag onder `MIN_CHARGE_CENTS`. */
  waived: boolean;
  monthlyBeforeCents: number;
  monthlyAfterCents: number;
  daysLeft: number;
  daysInPeriod: number;
  periodEnd: string;
  /** Er verlengt na de wijziging niets meer: het abonnement wordt opgezegd. */
  cancelsSubscription: boolean;
  changed: boolean;
};

const DAY = 86_400_000;

function utc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** De begindatum van de periode die op `periodEnd` eindigt: één kalendermaand terug, geklemd. */
export function periodStartFor(periodEnd: string): string {
  const [y, m, d] = periodEnd.split('-').map(Number);
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  const lastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

export function quoteChange(input: ChangeInput): ChangeQuote {
  const renewing = uniq(input.renewing);
  const paidThrough = uniq(input.paidThrough).filter(m => !renewing.includes(m));
  const both = new Set(input.add.filter(m => input.remove.includes(m)));

  const add = uniq(input.add).filter(m => !both.has(m) && !renewing.includes(m));
  const removed = uniq(input.remove).filter(m => !both.has(m) && renewing.includes(m));
  const restored = add.filter(m => paidThrough.includes(m));
  const newlyGranted = add.filter(m => !paidThrough.includes(m));

  const renewingAfter = [...renewing.filter(m => !removed.includes(m)), ...add];

  const periodStart = periodStartFor(input.periodEnd);
  const daysInPeriod = Math.max(1, Math.round((utc(input.periodEnd) - utc(periodStart)) / DAY));
  const daysLeft = Math.min(daysInPeriod, Math.max(1, Math.round((utc(input.periodEnd) - utc(input.today)) / DAY)));

  const paid = [...renewing, ...paidThrough] as ModuleSelection;
  const deltaCents = priceForSelection([...paid, ...newlyGranted] as ModuleSelection) - priceForSelection(paid);
  const proratedCents = deltaCents > 0
    ? Math.round((applyDiscount(deltaCents, input.discountPct) * daysLeft) / daysInPeriod)
    : 0;
  const chargeNowCents = proratedCents >= MIN_CHARGE_CENTS ? proratedCents : 0;

  const monthly = (sel: string[]) =>
    sel.length === 0 ? 0 : applyDiscount(priceForSelection(sel as ModuleSelection), input.discountPct);

  return {
    newlyGranted: newlyGranted as ModuleId[],
    restored: restored as ModuleId[],
    removed: removed as ModuleId[],
    renewingAfter: renewingAfter as ModuleId[],
    proratedCents,
    chargeNowCents,
    waived: proratedCents > 0 && chargeNowCents === 0,
    monthlyBeforeCents: monthly(renewing),
    monthlyAfterCents: monthly(renewingAfter),
    daysLeft,
    daysInPeriod,
    periodEnd: input.periodEnd,
    cancelsSubscription: renewingAfter.length === 0,
    changed: add.length > 0 || removed.length > 0,
  };
}
