/**
 * De Black Friday/Cyber Monday-actie van 2026: 10% op het hele abonnement.
 *
 * Alleen de feiten, zonder imports, zodat zowel `lib/discount-codes.ts` als `lib/sale.ts` ze kunnen
 * lezen zonder elkaar te importeren. De regels (wie, wanneer) staan in `lib/sale.ts`.
 *
 * De tijden zijn Amsterdamse tijd: de actie loopt tot en met maandag 30 november, dus tot
 * dinsdag 1 december 00:00 (CET, UTC+1).
 */
export const BLACK_FRIDAY = {
  code: 'BLACKFRIDAY',
  pct: 10,
  startsAt: '2026-11-27T00:00:00+01:00',
  endsAt: '2026-12-01T00:00:00+01:00',
} as const;
