import { describe, expect, it } from 'vitest';
import {
  canOpenExam,
  modulesExpired,
  modulesFromMetadata,
  ownsModule,
  planFromMetadata,
  purchasedModules,
} from '@/lib/entitlements';

const FUTURE = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
const PAST = '2020-01-01';

describe('planFromMetadata', () => {
  it('reads plan', () => {
    expect(planFromMetadata({ plan: 'premium_plus' })).toBe('premium_plus');
  });

  /** `tier` is what KNM wrote; nothing has written it since the fork, but old accounts have it. */
  it('falls back to the legacy tier field', () => {
    expect(planFromMetadata({ tier: 'premium' })).toBe('premium');
  });

  it('honours the older boolean flag', () => {
    expect(planFromMetadata({ premium: true })).toBe('premium');
  });

  it('defaults to free, including for junk', () => {
    expect(planFromMetadata(null)).toBe('free');
    expect(planFromMetadata({})).toBe('free');
    expect(planFromMetadata({ plan: 'enterprise' })).toBe('free');
  });
});

describe('canOpenExam', () => {
  it('lets anyone open a free exam', () => {
    expect(canOpenExam('free', true)).toBe(true);
  });

  it('gates the rest behind a paid plan', () => {
    expect(canOpenExam('free', false)).toBe(false);
    expect(canOpenExam('premium', false)).toBe(true);
  });
});

describe('modulesExpired', () => {
  it('is false for an account that has not cancelled', () => {
    expect(modulesExpired({ modules: ['lezen'] } as never)).toBe(false);
  });

  it('is false while inside the period already paid for', () => {
    expect(modulesExpired({ modules: ['lezen'], modules_until: FUTURE } as never)).toBe(false);
  });

  it('is true once that date has passed', () => {
    expect(modulesExpired({ modules: ['lezen'], modules_until: PAST } as never)).toBe(true);
  });

  /** The webhook clears the field with an explicit null, because GoTrue merges metadata. */
  it('treats a cleared field as not expired', () => {
    expect(modulesExpired({ modules: ['lezen'], modules_until: null } as never)).toBe(false);
  });

  it('ignores an unparseable date rather than revoking access', () => {
    expect(modulesExpired({ modules_until: 'binnenkort' } as never)).toBe(false);
  });
});

describe('modulesFromMetadata', () => {
  it('returns the bought modules', () => {
    expect(modulesFromMetadata({ modules: ['lezen', 'spreken'] } as never)).toEqual(['lezen', 'spreken']);
  });

  it('returns nothing once access has lapsed', () => {
    expect(modulesFromMetadata({ modules: ['lezen'], modules_until: PAST } as never)).toEqual([]);
  });

  it('filters non-strings', () => {
    expect(modulesFromMetadata({ modules: ['lezen', 7, null] } as never)).toEqual(['lezen']);
  });

  it('is [] when there is no list', () => {
    expect(modulesFromMetadata({} as never)).toEqual([]);
  });
});

describe('purchasedModules', () => {
  /** Billing UI has to show what was bought even after access lapses. */
  it('still lists the modules after expiry', () => {
    expect(purchasedModules({ modules: ['lezen'], modules_until: PAST } as never)).toEqual(['lezen']);
  });
});

describe('ownsModule', () => {
  it('grants a bought module', () => {
    expect(ownsModule({ modules: ['schrijven'] } as never, 'schrijven')).toBe(true);
    expect(ownsModule({ modules: ['schrijven'] } as never, 'spreken')).toBe(false);
  });

  /** Accounts that bought Professioneel or Compleet before modules existed keep everything. */
  it('grants everything on a legacy all-access plan', () => {
    expect(ownsModule({ plan: 'premium' } as never, 'spreken')).toBe(true);
  });

  it('revokes a module once the subscription period has ended', () => {
    expect(ownsModule({ modules: ['schrijven'], modules_until: PAST } as never, 'schrijven')).toBe(false);
  });

  it('keeps it until then', () => {
    expect(ownsModule({ modules: ['schrijven'], modules_until: FUTURE } as never, 'schrijven')).toBe(true);
  });
});
