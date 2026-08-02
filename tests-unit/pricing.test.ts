import { describe, expect, it } from 'vitest';
import {
  BUNDLE_LIST_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  BUNDLE_SAVING_CENTS,
  BUNDLE_SAVING_PCT,
  euro,
  listPriceForSelection,
  MODULE_PRICE_CENTS,
  parseSelection,
  priceForSelection,
  savingForSelection,
} from '@/lib/pricing';
import { SKILLS } from '@/data/skills';

const ALL = SKILLS.map(s => s.slug);

describe('euro', () => {
  it('formats with a Dutch decimal comma', () => {
    expect(euro(995)).toBe('€9,95');
    expect(euro(2995)).toBe('€29,95');
    expect(euro(0)).toBe('€0,00');
  });
});

describe('priceForSelection', () => {
  it('charges per module below the full set', () => {
    expect(priceForSelection(['lezen'])).toBe(995);
    expect(priceForSelection(['lezen', 'luisteren'])).toBe(1990);
    expect(priceForSelection(['lezen', 'luisteren', 'schrijven'])).toBe(2985);
  });

  it('charges the bundle price for all four', () => {
    expect(priceForSelection(ALL)).toBe(BUNDLE_PRICE_CENTS);
  });

  /**
   * The tamper cases. `/api/checkout-modules` recomputes from this function precisely so a client
   * cannot post its own total — these assert the input it *can* control is neutralised.
   */
  it('deduplicates repeated slugs', () => {
    expect(priceForSelection(['lezen', 'lezen', 'lezen'] as never)).toBe(995);
  });

  it('ignores slugs that are not modules', () => {
    expect(priceForSelection(['lezen', 'gratis', ''] as never)).toBe(995);
  });

  it('is 0 for an empty selection', () => {
    expect(priceForSelection([])).toBe(0);
  });

  it('cannot reach the bundle price by repeating one module four times', () => {
    expect(priceForSelection(['lezen', 'lezen', 'lezen', 'lezen'] as never)).toBe(995);
  });
});

describe('the bundle discount', () => {
  it('is the difference between four modules and the bundle', () => {
    expect(BUNDLE_LIST_PRICE_CENTS).toBe(MODULE_PRICE_CENTS * 4);
    expect(BUNDLE_SAVING_CENTS).toBe(BUNDLE_LIST_PRICE_CENTS - BUNDLE_PRICE_CENTS);
  });

  /** A stated percentage larger than the discount actually given is a false price claim. */
  it('never overstates the percentage', () => {
    expect(BUNDLE_SAVING_PCT).toBeLessThanOrEqual((BUNDLE_SAVING_CENTS / BUNDLE_LIST_PRICE_CENTS) * 100);
  });

  it('is only applied to the full set', () => {
    expect(savingForSelection(ALL)).toBe(BUNDLE_SAVING_CENTS);
    expect(savingForSelection(['lezen', 'luisteren', 'schrijven'])).toBe(0);
    expect(savingForSelection(['lezen'])).toBe(0);
  });

  it('leaves the list price undiscounted', () => {
    expect(listPriceForSelection(ALL)).toBe(BUNDLE_LIST_PRICE_CENTS);
  });

  /** The three-module nudge on the picker only makes sense while this holds. */
  it('makes the fourth module cost less than a module', () => {
    const three = priceForSelection(['lezen', 'luisteren', 'schrijven']);
    expect(BUNDLE_PRICE_CENTS - three).toBeLessThan(MODULE_PRICE_CENTS);
  });
});

describe('parseSelection', () => {
  it('narrows untrusted input to real slugs', () => {
    expect(parseSelection(['lezen', 'nope', 42, null, 'spreken'])).toEqual(['lezen', 'spreken']);
  });

  it('deduplicates', () => {
    expect(parseSelection(['lezen', 'lezen'])).toEqual(['lezen']);
  });

  it('returns [] for anything that is not an array', () => {
    expect(parseSelection('lezen')).toEqual([]);
    expect(parseSelection(null)).toEqual([]);
    expect(parseSelection({ 0: 'lezen' })).toEqual([]);
  });
});
