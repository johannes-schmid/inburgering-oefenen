import { describe, expect, it } from 'vitest';
import { MIN_CHARGE_CENTS, periodStartFor, quoteChange } from '@/lib/billing/coterm';
import { BUNDLE_PRICE_CENTS } from '@/lib/pricing';

const A2_LEZEN = 'a2:lezen' as const;
const A2_LUISTEREN = 'a2:luisteren' as const;
const A2_SCHRIJVEN = 'a2:schrijven' as const;
const A2_SPREKEN = 'a2:spreken' as const;

/** Periode 8 november → 8 december: 30 dagen. */
const base = {
  periodEnd: '2026-12-08',
  discountPct: 0,
  paidThrough: [] as string[],
};

describe('periodStartFor', () => {
  it('trekt één kalendermaand af', () => {
    expect(periodStartFor('2026-12-08')).toBe('2026-11-08');
  });

  it('klemt op het einde van een kortere maand', () => {
    expect(periodStartFor('2026-03-31')).toBe('2026-02-28');
  });

  it('gaat over de jaargrens', () => {
    expect(periodStartFor('2027-01-15')).toBe('2026-12-15');
  });
});

describe('quoteChange — toevoegen', () => {
  it('rekent het resterende deel van de periode', () => {
    const q = quoteChange({ ...base, renewing: [A2_LEZEN], add: [A2_SCHRIJVEN], remove: [], today: '2026-11-23' });
    expect(q.daysInPeriod).toBe(30);
    expect(q.daysLeft).toBe(15);
    expect(q.proratedCents).toBe(498); // 995 × 15/30
    expect(q.chargeNowCents).toBe(498);
    expect(q.monthlyBeforeCents).toBe(995);
    expect(q.monthlyAfterCents).toBe(1990);
    expect(q.newlyGranted).toEqual([A2_SCHRIJVEN]);
  });

  it('rekent het verschil met de bundel, niet de losse prijs', () => {
    const q = quoteChange({
      ...base,
      renewing: [A2_LEZEN, A2_LUISTEREN, A2_SCHRIJVEN],
      add: [A2_SPREKEN],
      remove: [],
      today: '2026-11-08',
    });
    expect(q.monthlyAfterCents).toBe(BUNDLE_PRICE_CENTS);
    expect(q.proratedCents).toBe(10); // 2995 − 2985, hele periode
    expect(q.chargeNowCents).toBe(0);
    expect(q.waived).toBe(true);
  });

  it('laat een bedrag onder de drempel vallen', () => {
    const q = quoteChange({ ...base, renewing: [A2_LEZEN], add: [A2_SCHRIJVEN], remove: [], today: '2026-12-06' });
    expect(q.proratedCents).toBeLessThan(MIN_CHARGE_CENTS);
    expect(q.chargeNowCents).toBe(0);
    expect(q.waived).toBe(true);
  });

  it('past de kortingscode toe op nu én op de maand', () => {
    const q = quoteChange({ ...base, discountPct: 10, renewing: [A2_LEZEN], add: [A2_SCHRIJVEN], remove: [], today: '2026-11-08' });
    expect(q.proratedCents).toBe(896);
    expect(q.monthlyAfterCents).toBe(1791);
  });

  it('rekent minstens één dag, ook op de verlengdag zelf', () => {
    const q = quoteChange({ ...base, renewing: [A2_LEZEN], add: [A2_SCHRIJVEN], remove: [], today: '2026-12-08' });
    expect(q.daysLeft).toBe(1);
  });
});

describe('quoteChange — opzeggen', () => {
  it('rekent niets en verlaagt de maand vanaf de verlenging', () => {
    const q = quoteChange({ ...base, renewing: [A2_LEZEN, A2_SCHRIJVEN], add: [], remove: [A2_LEZEN], today: '2026-11-20' });
    expect(q.chargeNowCents).toBe(0);
    expect(q.monthlyAfterCents).toBe(995);
    expect(q.removed).toEqual([A2_LEZEN]);
    expect(q.cancelsSubscription).toBe(false);
  });

  it('zegt het abonnement op als er niets meer verlengt', () => {
    const q = quoteChange({ ...base, renewing: [A2_LEZEN], add: [], remove: [A2_LEZEN], today: '2026-11-20' });
    expect(q.cancelsSubscription).toBe(true);
    expect(q.monthlyAfterCents).toBe(0);
  });
});

describe('quoteChange — wisselen', () => {
  it('KNM eruit, drie A2-modules erin', () => {
    const q = quoteChange({
      periodEnd: '2026-12-01',
      discountPct: 0,
      paidThrough: [],
      renewing: ['knm'],
      add: [A2_LEZEN, A2_SCHRIJVEN, A2_SPREKEN],
      remove: ['knm'],
      today: '2026-11-08',
    });
    expect(q.daysInPeriod).toBe(30);
    expect(q.daysLeft).toBe(23);
    expect(q.proratedCents).toBe(2289); // 2985 × 23/30
    expect(q.monthlyAfterCents).toBe(2985);
    expect(q.removed).toEqual(['knm']);
  });
});

describe('quoteChange — terugzetten', () => {
  it('rekent niets voor een module die al tot de verlenging betaald is', () => {
    const q = quoteChange({
      ...base,
      renewing: [A2_LEZEN],
      paidThrough: [A2_SCHRIJVEN],
      add: [A2_SCHRIJVEN],
      remove: [],
      today: '2026-11-20',
    });
    expect(q.restored).toEqual([A2_SCHRIJVEN]);
    expect(q.newlyGranted).toEqual([]);
    expect(q.chargeNowCents).toBe(0);
    expect(q.waived).toBe(false);
    expect(q.monthlyAfterCents).toBe(1990);
  });

  it('telt een module die tot de verlenging betaald is mee voor de bundel', () => {
    const q = quoteChange({
      ...base,
      renewing: [A2_LEZEN, A2_SCHRIJVEN],
      paidThrough: [A2_LUISTEREN],
      add: [A2_SPREKEN],
      remove: [],
      today: '2026-11-08',
    });
    // Betaald deze periode: L+Lu+S (2985). Met Spreken erbij: bundel (2995). Verschil 10.
    expect(q.proratedCents).toBe(10);
  });
});

describe('quoteChange — ongeldige invoer', () => {
  it('negeert toevoegen van wat al verlengt en opzeggen van wat niet verlengt', () => {
    const q = quoteChange({ ...base, renewing: [A2_LEZEN], add: [A2_LEZEN], remove: [A2_SPREKEN], today: '2026-11-20' });
    expect(q.newlyGranted).toEqual([]);
    expect(q.removed).toEqual([]);
    expect(q.changed).toBe(false);
  });

  it('een module die in één verzoek erbij én eraf gaat, telt als niets', () => {
    const q = quoteChange({ ...base, renewing: [A2_LEZEN], add: [A2_SPREKEN], remove: [A2_SPREKEN], today: '2026-11-20' });
    expect(q.changed).toBe(false);
  });
});
