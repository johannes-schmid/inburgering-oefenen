import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isoWeek, isEvenWeek, windows } from '../scripts/seo-agent/lib/dates.mjs';

const config = JSON.parse(readFileSync('seo-agent/config.json', 'utf8'));
const ledger = JSON.parse(readFileSync('seo-agent/ledger.json', 'utf8'));

describe('ISO-weken en vensters', () => {
  it('geeft de ISO-week met jaarwissel correct', () => {
    expect(isoWeek(new Date('2026-10-05T12:00:00Z'))).toBe('2026-W41');
    expect(isoWeek(new Date('2027-01-01T12:00:00Z'))).toBe('2026-W53');
    expect(isoWeek(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01');
  });
  it('kent even weken (GEO-cadans)', () => {
    expect(isEvenWeek('2026-W40')).toBe(true);
    expect(isEvenWeek('2026-W41')).toBe(false);
  });
  it('maakt twee aaneensluitende vensters van 28 dagen met drie dagen vertraging', () => {
    const w = windows(new Date('2026-10-09T23:00:00Z'), 28, 3);
    expect(w.current).toEqual({ start: '2026-09-09', end: '2026-10-06' });
    expect(w.previous).toEqual({ start: '2026-08-12', end: '2026-09-08' });
  });
});

describe('seo-agent/config.json', () => {
  it('kent beide sites en zegt welke in deze repo zit', () => {
    expect(Object.keys(config.sites)).toEqual(['inburgering', 'knm']);
    expect(config.sites.inburgering.in_this_repo).toBe(true);
    expect(config.sites.knm.in_this_repo).toBe(false);
  });
  it('houdt de limieten klein: cooldown ≥ 28 dagen, hooguit 3 PR per week', () => {
    expect(config.rules.cooldown_days).toBeGreaterThanOrEqual(28);
    expect(config.rules.weekly_pr_cap).toBeLessThanOrEqual(3);
  });
  it('beschermt de feiten, de prijs en de vertalingen', () => {
    expect(config.protected_paths).toContain('SEO/facts.md');
    expect(config.protected_paths).toContain('lib/pricing.ts');
    expect(config.protected_paths).toContain('data/guides/translations/**');
  });
  it('houdt de GEO-promptset klein en vooral Nederlands', () => {
    const prompts = config.geo.prompts as { lang: string }[];
    expect(prompts.length).toBeLessThanOrEqual(20);
    expect(prompts.filter(p => p.lang === 'nl').length).toBeGreaterThan(prompts.length / 2);
  });
});

describe('seo-agent/ledger.json', () => {
  const REQUIRED = ['id', 'date', 'site', 'page', 'change', 'hypothesis', 'metric', 'window_end', 'verdict'];
  it('elke rij heeft alle velden en een geldig oordeel', () => {
    for (const e of ledger.entries) {
      for (const k of REQUIRED) expect(e, e.id).toHaveProperty(k);
      expect(['worked', 'didnt', 'inconclusive', null]).toContain(e.verdict);
      expect(Object.keys(config.sites)).toContain(e.site);
      expect(e.window_end >= e.date).toBe(true);
    }
  });
  it('id\'s zijn uniek', () => {
    const ids = ledger.entries.map((e: { id: string }) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
