import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { landingPaths, landingProblems, landingSuggestions, weekStart, type LandingFile, type LandingItem } from '@/lib/admin/seo-landing';

const real = JSON.parse(readFileSync('seo-agent/landing-pages.json', 'utf8')) as LandingFile;

const item = (o: Partial<LandingItem>): LandingItem => ({
  id: 'x', created: '2026-11-13', week: '2026-W47', status: 'suggested', kind: 'upgrade', path: '/nl/x', query: 'q', title: 't',
  variant: 'v', demand: 0, evidence: 'e', competitor: 'c', why: 'w', checks: [true, true, true, true], owner: 'agent', ...o,
});
const file = (items: LandingItem[]): LandingFile => ({ ...real, items });

describe('seo-agent/landing-pages.json', () => {
  it('klopt met de regels', () => {
    expect(landingProblems(real)).toEqual([]);
  });
});

describe('landingProblems', () => {
  it('weigert een tweede nieuwe URL in dezelfde week; upgrades tellen niet', () => {
    const f = file([item({ id: 'a', kind: 'new' }), item({ id: 'b', kind: 'new' }), item({ id: 'c' })]);
    expect(landingProblems(f)).toEqual(['2026-W47: 2 new URLs, the cap is 1']);
  });
  it('telt een afgewezen nieuwe URL niet mee', () => {
    expect(landingProblems(file([item({ id: 'a', kind: 'new' }), item({ id: 'b', kind: 'new', status: 'dismissed' })]))).toEqual([]);
  });
  it('laat niets goedkeuren met een open check', () => {
    expect(landingProblems(file([item({ status: 'approved', checks: [true, true, true, false] })]))).toEqual(['x: approved with a failed check']);
  });
  it('vangt een dubbel id en een verkeerd aantal checks', () => {
    expect(landingProblems(file([item({}), item({ checks: [true] })]))).toEqual(['x: id used twice', 'x: 1 checks, the rules have 4']);
  });
});

describe('landingSuggestions / landingPaths', () => {
  it('toont alleen voorgestelde en goedgekeurde pagina’s, met de checks bij naam', () => {
    const rows = landingSuggestions(file([item({ id: 'a' }), item({ id: 'b', status: 'live' }), item({ id: 'c', status: 'dismissed' })]));
    expect(rows.map(r => r.id)).toEqual(['landing:a']);
    expect(rows[0].landing.checks[3]).toEqual({ label: real.rules.checks[3], ok: true });
    expect(rows[0].starts).toBe('2026-11-16');
  });
  it('markeert elke niet-afgewezen pagina als landingspagina, één keer per pad', () => {
    expect(landingPaths(file([item({ id: 'a' }), item({ id: 'b' }), item({ id: 'c', path: '/nl/y', status: 'dismissed' })]))).toEqual(['/nl/x']);
  });
  it('rekent de maandag van een ISO-week, ook over de jaargrens', () => {
    expect(weekStart('2026-W46')).toBe('2026-11-09');
    expect(weekStart('2027-W01')).toBe('2027-01-04');
  });
});
