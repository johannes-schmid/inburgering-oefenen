import { describe, expect, it } from 'vitest';
import { applyChange, cancelAll, grantPurchase, grantRenewal, revertGrant } from '@/lib/billing/metadata';
import { modulesFromMetadata, renewingModules } from '@/lib/entitlements';

const FUTURE = new Date(Date.now() + 20 * 86400_000).toISOString().slice(0, 10);
const LATER = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
const PAST = '2020-01-01';

const merged = (meta: object, patch: object) => ({ ...meta, ...patch }) as { modules: string[]; module_until: Record<string, string>; modules_until: unknown };

describe('grantPurchase', () => {
  it('voegt toe zonder iets te verwijderen', () => {
    const meta = { modules: ['a2:lezen'] };
    const next = merged(meta, grantPurchase(meta, ['a2:spreken']));
    expect(modulesFromMetadata(next as never)).toEqual(['a2:lezen', 'a2:spreken']);
  });

  /** De tweede fout van 08-11: opnieuw kopen na opzeggen opende de oude modules zonder incasso. */
  it('houdt de einddatum van wat na opzeggen nog loopt', () => {
    const meta = { modules: ['knm'], modules_until: FUTURE, subscription_canceled_at: '2026-11-01' };
    const next = merged(meta, grantPurchase(meta, ['a2:lezen']));
    expect(renewingModules(next as never)).toEqual(['a2:lezen']);
    expect(modulesFromMetadata(next as never)).toEqual(['knm', 'a2:lezen']);
    expect(next.module_until.knm).toBe(FUTURE);
    expect(next.modules_until).toBeNull();
  });

  it('houdt een verlopen module dicht, met haar datum', () => {
    const meta = { modules: ['knm'], modules_until: PAST };
    const next = merged(meta, grantPurchase(meta, ['a2:lezen']));
    expect(modulesFromMetadata(next as never)).toEqual(['a2:lezen']);
    expect(next.module_until.knm).toBe(PAST);
  });

  it('een opnieuw gekochte module verlengt weer', () => {
    const meta = { modules: ['knm'], module_until: { knm: FUTURE } };
    const next = merged(meta, grantPurchase(meta, ['knm']));
    expect(renewingModules(next as never)).toEqual(['knm']);
  });
});

describe('grantRenewal', () => {
  it('raakt de einddatum van een opgezegde module niet aan', () => {
    const meta = { modules: ['a2:lezen', 'knm'], module_until: { knm: FUTURE } };
    const next = merged(meta, grantRenewal(meta, ['a2:lezen', 'knm']));
    expect(renewingModules(next as never)).toEqual(['a2:lezen']);
  });

  it('heropent een module die opnieuw betaald is nadat haar datum voorbij was', () => {
    const meta = { modules: ['knm'], module_until: { knm: PAST } };
    const next = merged(meta, grantRenewal(meta, ['knm']));
    expect(modulesFromMetadata(next as never)).toEqual(['knm']);
  });
});

describe('applyChange', () => {
  it('zet een einddatum op wat eraf gaat en opent wat erbij komt', () => {
    const meta = { modules: ['knm'] };
    const next = merged(meta, applyChange(meta, { add: ['a2:lezen'], remove: ['knm'], periodEnd: FUTURE }));
    expect(modulesFromMetadata(next as never)).toEqual(['knm', 'a2:lezen']);
    expect(renewingModules(next as never)).toEqual(['a2:lezen']);
  });

  it('terugzetten wist de einddatum', () => {
    const meta = { modules: ['a2:lezen', 'knm'], module_until: { knm: FUTURE } };
    const next = merged(meta, applyChange(meta, { add: ['knm'], remove: [], periodEnd: FUTURE }));
    expect(renewingModules(next as never)).toEqual(['a2:lezen', 'knm']);
  });

  it('verschuift een bestaande einddatum niet bij opnieuw opzeggen', () => {
    const meta = { modules: ['knm'], module_until: { knm: FUTURE } };
    const next = merged(meta, applyChange(meta, { add: [], remove: ['knm'], periodEnd: LATER }));
    expect(next.module_until.knm).toBe(FUTURE);
  });
});

describe('revertGrant', () => {
  it('haalt alleen de genoemde modules weg', () => {
    const meta = { modules: ['knm', 'a2:lezen'], module_until: { knm: FUTURE } };
    const next = merged(meta, revertGrant(meta, ['a2:lezen']));
    expect(next.modules).toEqual(['knm']);
    expect(next.module_until.knm).toBe(FUTURE);
  });
});

describe('cancelAll', () => {
  it('zet de datum op elke module die nog verlengt', () => {
    const meta = { modules: ['knm', 'a2:lezen'], module_until: { knm: FUTURE } };
    const next = merged(meta, cancelAll(meta, LATER));
    expect(renewingModules(next as never)).toEqual([]);
    expect(next.module_until).toEqual({ knm: FUTURE, 'a2:lezen': LATER });
  });

  it('zonder bekende datum blijft alles open', () => {
    const meta = { modules: ['knm'] };
    const next = merged(meta, cancelAll(meta, null));
    expect(modulesFromMetadata(next as never)).toEqual(['knm']);
  });
});
