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
import { moduleId } from '@/lib/entitlements';

/** All four modules of one level — the only selection the bundle price applies to. */
const ALL = SKILLS.map(s => moduleId('a2', s.slug));
const ALL_B1 = SKILLS.map(s => moduleId('b1', s.slug));

describe('euro', () => {
  it('formats with a Dutch decimal comma', () => {
    expect(euro(995)).toBe('€9,95');
    expect(euro(2995)).toBe('€29,95');
    expect(euro(0)).toBe('€0,00');
  });
});

describe('priceForSelection', () => {
  it('charges per module below the full set', () => {
    expect(priceForSelection(['a2:lezen'])).toBe(995);
    expect(priceForSelection(['a2:lezen', 'a2:luisteren'])).toBe(1990);
    expect(priceForSelection(['a2:lezen', 'a2:luisteren', 'a2:schrijven'])).toBe(2985);
  });

  it('charges the bundle price for all four', () => {
    expect(priceForSelection(ALL)).toBe(BUNDLE_PRICE_CENTS);
  });

  /**
   * The bundle is per level, and this is the case that made it so.
   *
   * Under the old `selection.length === 4 → bundle` rule a basket of two A2 and two B1
   * modules got the four-module discount while completing neither level — the discount is
   * for taking a whole level, so a mixed four pays full price.
   */
  it('does not discount four modules spread across two levels', () => {
    const mixed = ['a2:lezen', 'a2:luisteren', 'b1:lezen', 'b1:luisteren'] as never;
    expect(priceForSelection(mixed)).toBe(4 * MODULE_PRICE_CENTS);
    expect(savingForSelection(mixed)).toBe(0);
  });

  it('applies the bundle once per completed level', () => {
    expect(priceForSelection([...ALL, ...ALL_B1])).toBe(2 * BUNDLE_PRICE_CENTS);
  });

  it('discounts the complete level and charges per module for the rest', () => {
    expect(priceForSelection([...ALL, 'b1:lezen'] as never))
      .toBe(BUNDLE_PRICE_CENTS + MODULE_PRICE_CENTS);
  });

  it('prices a B1-only full set as its own bundle', () => {
    expect(priceForSelection(ALL_B1)).toBe(BUNDLE_PRICE_CENTS);
  });

  /**
   * The tamper cases. `/api/checkout-modules` recomputes from this function precisely so a client
   * cannot post its own total — these assert the input it *can* control is neutralised.
   */
  it('deduplicates repeated slugs', () => {
    expect(priceForSelection(['a2:lezen', 'a2:lezen', 'a2:lezen'] as never)).toBe(995);
  });

  it('ignores slugs that are not modules', () => {
    expect(priceForSelection(['a2:lezen', 'gratis', ''] as never)).toBe(995);
  });

  it('is 0 for an empty selection', () => {
    expect(priceForSelection([])).toBe(0);
  });

  it('cannot reach the bundle price by repeating one module four times', () => {
    expect(priceForSelection(['a2:lezen', 'a2:lezen', 'a2:lezen', 'a2:lezen'] as never)).toBe(995);
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
    expect(savingForSelection(['a2:lezen', 'a2:luisteren', 'a2:schrijven'])).toBe(0);
    expect(savingForSelection(['a2:lezen'])).toBe(0);
  });

  it('leaves the list price undiscounted', () => {
    expect(listPriceForSelection(ALL)).toBe(BUNDLE_LIST_PRICE_CENTS);
  });

  /** The three-module nudge on the picker only makes sense while this holds. */
  it('makes the fourth module cost less than a module', () => {
    const three = priceForSelection(['a2:lezen', 'a2:luisteren', 'a2:schrijven']);
    expect(BUNDLE_PRICE_CENTS - three).toBeLessThan(MODULE_PRICE_CENTS);
  });
});

describe('parseSelection', () => {
  it('narrows untrusted input to real module ids', () => {
    expect(parseSelection(['a2:lezen', 'nope', 42, null, 'a2:spreken'])).toEqual(['a2:lezen', 'a2:spreken']);
  });

  /**
   * A bare slug is what every client posted before levels existed, and what a stale cached
   * bundle still posts. It must buy the A2 module it meant, not price to zero.
   */
  it('reads a bare skill slug as A2', () => {
    expect(parseSelection(['lezen', 'spreken'])).toEqual(['a2:lezen', 'a2:spreken']);
  });

  it('does not double-count a bare slug and its explicit id', () => {
    expect(parseSelection(['lezen', 'a2:lezen'])).toEqual(['a2:lezen']);
    expect(priceForSelection(parseSelection(['lezen', 'a2:lezen']))).toBe(MODULE_PRICE_CENTS);
  });

  it('deduplicates', () => {
    expect(parseSelection(['a2:lezen', 'a2:lezen'])).toEqual(['a2:lezen']);
  });

  it('returns [] for anything that is not an array', () => {
    expect(parseSelection('a2:lezen')).toEqual([]);
    expect(parseSelection(null)).toEqual([]);
    expect(parseSelection({ 0: 'a2:lezen' })).toEqual([]);
  });
});
