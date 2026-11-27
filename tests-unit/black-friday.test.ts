import { describe, expect, it } from 'vitest';
import {
  BLACK_FRIDAY, isSaleActive, isSaleEligible, resolveCheckoutDiscount, saleTimeLeft,
} from '@/lib/sale';
import { discountPctForCode, findDiscountCode } from '@/lib/discount-codes';
import { applyDiscount } from '@/lib/pricing';

const DURING = new Date('2026-11-28T12:00:00Z');
const LAST_SECOND = new Date('2026-11-30T22:59:59Z'); // maandag 23:59:59 in Amsterdam
const AFTER = new Date('2026-11-30T23:00:00Z'); // dinsdag 00:00 in Amsterdam
const BEFORE = new Date('2026-11-26T22:59:59Z');

const future = '2099-01-01T00:00:00Z';
const past = '2020-01-01T00:00:00Z';

describe('de Black Friday-actie', () => {
  it('loopt tot maandagnacht 24:00 Amsterdamse tijd en niet langer', () => {
    expect(isSaleActive(BEFORE)).toBe(false);
    expect(isSaleActive(DURING)).toBe(true);
    expect(isSaleActive(LAST_SECOND)).toBe(true);
    expect(isSaleActive(AFTER)).toBe(false);
  });

  it('telt af naar het einde en staat daarna op nul', () => {
    expect(saleTimeLeft(new Date('2026-11-29T22:00:00Z'))).toEqual({ days: 1, hours: 1, minutes: 0, seconds: 0 });
    expect(saleTimeLeft(AFTER)).toBeNull();
  });

  it('geeft 10% op de moduleprijs, zoals elke andere code', () => {
    expect(BLACK_FRIDAY.pct).toBe(10);
    expect(applyDiscount(995, BLACK_FRIDAY.pct)).toBe(896);
    expect(applyDiscount(2995, BLACK_FRIDAY.pct)).toBe(2696);
  });

  it('is als code alleen geldig tijdens de actie', () => {
    expect(findDiscountCode('blackfriday', DURING)?.pct).toBe(10);
    expect(findDiscountCode('BLACKFRIDAY', AFTER)).toBeNull();
    expect(findDiscountCode('BLACKFRIDAY', BEFORE)).toBeNull();
  });

  it('blijft na de actie op een lopend abonnement staan', () => {
    expect(discountPctForCode('BLACKFRIDAY')).toBe(10);
  });
});

describe('wie de actie krijgt', () => {
  it('een account zonder iets gekocht', () => {
    expect(isSaleEligible({})).toBe(true);
    expect(isSaleEligible(null)).toBe(true);
  });

  it('niet wie een open module heeft', () => {
    expect(isSaleEligible({ modules: ['a2:lezen'] })).toBe(false);
    expect(isSaleEligible({ modules: ['knm'], module_until: { knm: future } })).toBe(false);
  });

  it('niet wie een oud all-access-pakket heeft', () => {
    expect(isSaleEligible({ plan: 'premium' })).toBe(false);
  });

  it('wel wie alleen verlopen modules heeft', () => {
    expect(isSaleEligible({ modules: ['a2:lezen'], module_until: { 'a2:lezen': past } })).toBe(true);
  });
});

describe('de korting bij het afrekenen', () => {
  it('past de actie vanzelf toe zonder code', () => {
    expect(resolveCheckoutDiscount('', {}, DURING)).toEqual({ ok: true, discount: expect.objectContaining({ code: 'BLACKFRIDAY' }) });
  });

  it('geeft na de actie geen korting', () => {
    expect(resolveCheckoutDiscount('', {}, AFTER)).toEqual({ ok: true, discount: null });
  });

  it('geeft een premium-account geen korting, ook niet met de code', () => {
    expect(resolveCheckoutDiscount('', { plan: 'premium' }, DURING)).toEqual({ ok: true, discount: null });
    expect(resolveCheckoutDiscount('BLACKFRIDAY', { modules: ['a2:lezen'] }, DURING)).toEqual({ ok: false });
  });

  it('laat een andere geldige code voorgaan; ze stapelen niet', () => {
    const r = resolveCheckoutDiscount('KNM10', {}, DURING);
    expect(r).toEqual({ ok: true, discount: expect.objectContaining({ code: 'KNM10' }) });
  });

  it('weigert een onbekende code', () => {
    expect(resolveCheckoutDiscount('NEPCODE', {}, DURING)).toEqual({ ok: false });
  });
});
