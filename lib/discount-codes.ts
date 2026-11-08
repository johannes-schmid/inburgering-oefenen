import { KNM_MIGRATION_CODE, KNM_MIGRATION_PCT } from './knm-migration';

/**
 * De kortingscodes die de checkout accepteert.
 *
 * Een lijst in de code en geen tabel: er is er nu één, en elke code staat al in een mail of op een
 * pagina, dus geheim is hij niet. De kiezer importeert deze lijst om de korting vóór het afrekenen
 * te tonen; `/api/checkout-modules` controleert hem opnieuw en rekent zelf. Komen er codes bij die
 * de eigenaar zelf wil beheren, dan wordt dit een tabel met een adminscherm (zoals op knm-website).
 *
 * De korting geldt voor het hele abonnement: `fulfilModulePayment()` maakt de maandelijkse
 * incasso aan met het bedrag van de eerste betaling.
 */
export type DiscountCode = {
  code: string;
  pct: number;
  /** ISO-tijdstip; daarna is de code ongeldig. `null` = geen einddatum. */
  validUntil: string | null;
};

export const DISCOUNT_CODES: DiscountCode[] = [
  { code: KNM_MIGRATION_CODE, pct: KNM_MIGRATION_PCT, validUntil: null },
];

/** Hoofdletterongevoelig en zonder spaties eromheen, zoals mensen een code overtikken. */
export function findDiscountCode(
  input: unknown,
  now: Date = new Date(),
  codes: DiscountCode[] = DISCOUNT_CODES,
): DiscountCode | null {
  if (typeof input !== 'string') return null;
  const wanted = input.trim().toUpperCase();
  if (!wanted) return null;
  const hit = codes.find(c => c.code === wanted);
  if (!hit) return null;
  if (hit.validUntil && now > new Date(hit.validUntil)) return null;
  return hit;
}

/** Waar de kiezer een code onthoudt die iemand eerder zag, bijvoorbeeld op `/welkom-knm`. */
export const DISCOUNT_CODE_STORAGE_KEY = 'io_discount_code';

/**
 * Het percentage van een code die al op een abonnement staat — ook als de code inmiddels niet
 * meer te gebruiken is.
 *
 * Wie met een code afsloot, houdt de korting zolang het abonnement loopt (het maandbedrag nam het
 * bedrag van de eerste betaling over). Als co-terming het maandbedrag herberekent, mag een
 * verlopen `validUntil` die korting niet stil laten verdwijnen.
 */
export function discountPctForCode(code: unknown, codes: DiscountCode[] = DISCOUNT_CODES): number {
  if (typeof code !== 'string') return 0;
  return codes.find(c => c.code === code.trim().toUpperCase())?.pct ?? 0;
}
