import { describe, expect, it } from 'vitest';
import {
  canOpenExam,
  endingModules,
  moduleUntil,
  ownsKnm,
  renewingModules,
  modulesExpired,
  modulesFromMetadata,
  normaliseModule,
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
  /** Normalised on the way out: a stored bare slug predates levels and means A2. */
  it('returns the bought modules as level-scoped ids', () => {
    expect(modulesFromMetadata({ modules: ['lezen', 'spreken'] } as never))
      .toEqual(['a2:lezen', 'a2:spreken']);
    expect(modulesFromMetadata({ modules: ['b1:lezen'] } as never)).toEqual(['b1:lezen']);
  });

  it('returns nothing once access has lapsed', () => {
    expect(modulesFromMetadata({ modules: ['lezen'], modules_until: PAST } as never)).toEqual([]);
  });

  it('filters non-strings', () => {
    expect(modulesFromMetadata({ modules: ['lezen', 7, null] } as never)).toEqual(['a2:lezen']);
  });

  it('is [] when there is no list', () => {
    expect(modulesFromMetadata({} as never)).toEqual([]);
  });
});

describe('purchasedModules', () => {
  /** Billing UI has to show what was bought even after access lapses. */
  it('still lists the modules after expiry', () => {
    expect(purchasedModules({ modules: ['a2:lezen'], modules_until: PAST } as never)).toEqual(['a2:lezen']);
  });
});

describe('ownsModule', () => {
  it('grants a bought module', () => {
    expect(ownsModule({ modules: ['a2:schrijven'] } as never, 'a2', 'schrijven')).toBe(true);
    expect(ownsModule({ modules: ['a2:schrijven'] } as never, 'a2', 'spreken')).toBe(false);
  });

  /**
   * The whole point of putting the level in the module id: buying A2 Schrijven must not hand
   * over B1 Schrijven, which is a separately authored and separately sold product.
   */
  it('does not grant the same skill at another level', () => {
    expect(ownsModule({ modules: ['a2:schrijven'] } as never, 'b1', 'schrijven')).toBe(false);
    expect(ownsModule({ modules: ['b1:schrijven'] } as never, 'a2', 'schrijven')).toBe(false);
  });

  /** Accounts that bought Professioneel or Compleet before modules existed keep everything. */
  it('grants everything on a legacy all-access plan', () => {
    expect(ownsModule({ plan: 'premium' } as never, 'a2', 'spreken')).toBe(true);
  });

  it('revokes a module once the subscription period has ended', () => {
    expect(ownsModule({ modules: ['a2:schrijven'], modules_until: PAST } as never, 'a2', 'schrijven')).toBe(false);
  });

  it('keeps it until then', () => {
    expect(ownsModule({ modules: ['a2:schrijven'], modules_until: FUTURE } as never, 'a2', 'schrijven')).toBe(true);
  });
});

describe('normaliseModule — the legacy bare slug', () => {
  /**
   * Every module sold before levels existed was an A2 module, because there was no other
   * level. Reading a stored `lezen` as anything else would silently revoke a real purchase.
   */
  it('reads a bare skill slug as A2', () => {
    expect(normaliseModule('lezen')).toBe('a2:lezen');
    expect(ownsModule({ modules: ['lezen'] } as never, 'a2', 'lezen')).toBe(true);
  });

  it('does not let a legacy slug leak into B1', () => {
    expect(ownsModule({ modules: ['lezen'] } as never, 'b1', 'lezen')).toBe(false);
  });

  it('passes an explicit id through and rejects nonsense', () => {
    expect(normaliseModule('b1:spreken')).toBe('b1:spreken');
    expect(normaliseModule('c1:lezen')).toBeNull();
    expect(normaliseModule('a2:zwemmen')).toBeNull();
    expect(normaliseModule('')).toBeNull();
  });

  it('drops unparseable entries rather than failing the whole list', () => {
    expect(modulesFromMetadata({ modules: ['lezen', 'c1:lezen', 'b1:spreken'] } as never))
      .toEqual(['a2:lezen', 'b1:spreken']);
  });
});

describe('einddatum per module (co-terming)', () => {
  it('sluit alleen de module waarvan de eigen datum voorbij is', () => {
    const meta = { modules: ['a2:lezen', 'knm'], module_until: { knm: PAST } };
    expect(modulesFromMetadata(meta as never)).toEqual(['a2:lezen']);
    expect(ownsKnm(meta as never)).toBe(false);
    expect(ownsModule(meta as never, 'a2', 'lezen')).toBe(true);
  });

  it('houdt een opgezegde module open tot haar datum', () => {
    const meta = { modules: ['knm'], module_until: { knm: FUTURE } };
    expect(ownsKnm(meta as never)).toBe(true);
    expect(renewingModules(meta as never)).toEqual([]);
    expect(endingModules(meta as never)).toEqual([{ id: 'knm', until: FUTURE }]);
  });

  it('een eigen datum gaat vóór de oude gezamenlijke datum', () => {
    const meta = { modules: ['a2:lezen', 'knm'], modules_until: PAST, module_until: { 'a2:lezen': FUTURE } };
    expect(modulesFromMetadata(meta as never)).toEqual(['a2:lezen']);
  });

  it('de oude gezamenlijke datum geldt voor modules zonder eigen datum', () => {
    const meta = { modules: ['a2:lezen'], modules_until: FUTURE };
    expect(renewingModules(meta as never)).toEqual([]);
    expect(moduleUntil(meta as never, 'a2:lezen')).toBe(FUTURE);
  });

  it('verlengt wat geen datum heeft', () => {
    const meta = { modules: ['a2:lezen', 'a2:schrijven'], module_until: { 'a2:schrijven': FUTURE } };
    expect(renewingModules(meta as never)).toEqual(['a2:lezen']);
  });

  it('is pas verlopen als álle modules voorbij zijn', () => {
    expect(modulesExpired({ modules: ['a2:lezen', 'knm'], module_until: { knm: PAST } } as never)).toBe(false);
    expect(modulesExpired({ modules: ['knm'], module_until: { knm: PAST } } as never)).toBe(true);
  });

  it('leest een bare slug in module_until als A2', () => {
    const meta = { modules: ['lezen'], module_until: { lezen: PAST } };
    expect(modulesFromMetadata(meta as never)).toEqual([]);
  });
});
