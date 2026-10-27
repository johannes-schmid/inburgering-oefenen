import { describe, expect, it } from 'vitest';
import { applyDiscount, BUNDLE_PRICE_CENTS, MODULE_PRICE_CENTS } from '@/lib/pricing';
import { findDiscountCode, type DiscountCode } from '@/lib/discount-codes';
import { KNM_MIGRATION_CODE, KNM_MIGRATION_PCT, knmMigrationPriceCents } from '@/lib/knm-migration';

describe('applyDiscount', () => {
  it('rounds to whole cents the way /welkom-knm shows it', () => {
    expect(applyDiscount(MODULE_PRICE_CENTS, 10)).toBe(896);
    expect(applyDiscount(BUNDLE_PRICE_CENTS, 10)).toBe(2696);
    expect(applyDiscount(1990, 10)).toBe(1791);
  });

  it('leaves the price alone at 0% and never goes below zero', () => {
    expect(applyDiscount(995, 0)).toBe(995);
    expect(applyDiscount(995, 100)).toBe(0);
    expect(applyDiscount(995, 150)).toBe(0);
  });

  it('is the same sum the landing page and the e-mail use', () => {
    expect(knmMigrationPriceCents(MODULE_PRICE_CENTS)).toBe(applyDiscount(MODULE_PRICE_CENTS, KNM_MIGRATION_PCT));
    expect(knmMigrationPriceCents(BUNDLE_PRICE_CENTS)).toBe(applyDiscount(BUNDLE_PRICE_CENTS, KNM_MIGRATION_PCT));
  });
});

describe('findDiscountCode', () => {
  it('knows the code from the knmoefenen.nl mailing', () => {
    expect(findDiscountCode(KNM_MIGRATION_CODE)?.pct).toBe(KNM_MIGRATION_PCT);
  });

  it('ignores case and surrounding spaces, as people type it', () => {
    expect(findDiscountCode('  knm10 ')?.code).toBe('KNM10');
  });

  it('returns null for anything it does not know', () => {
    expect(findDiscountCode('NOPE')).toBeNull();
    expect(findDiscountCode('')).toBeNull();
    expect(findDiscountCode(undefined)).toBeNull();
    expect(findDiscountCode(10)).toBeNull();
    expect(findDiscountCode({ code: 'KNM10' })).toBeNull();
  });

  it('refuses a code after its end date', () => {
    const codes: DiscountCode[] = [{ code: 'OUD', pct: 20, validUntil: '2026-01-31T23:59:59Z' }];
    expect(findDiscountCode('OUD', new Date('2026-01-31T12:00:00Z'), codes)?.pct).toBe(20);
    expect(findDiscountCode('OUD', new Date('2026-02-01T00:00:00Z'), codes)).toBeNull();
  });
});
