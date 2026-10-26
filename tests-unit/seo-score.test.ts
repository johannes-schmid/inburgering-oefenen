import { describe, expect, it } from 'vitest';
import { pageScore, rollup, upsertHistory, type ScoreInput } from '@/lib/admin/seo-score.mjs';

const page = (over: Partial<ScoreInput> = {}): ScoreInput => ({
  path: '/nl/x', section: 'guides', verdict: 'healthy', demand: 0, now: null, issues: [], ...over,
});

describe('paginascore', () => {
  it('een gezonde pagina zonder vraag en zonder fouten krijgt een 10', () => {
    expect(pageScore(page()).score).toBe(10);
  });

  it('het oordeel van de triage telt zwaarst: verwijderen < samenvoegen < herschrijven < gezond', () => {
    const s = (verdict: ScoreInput['verdict']) => pageScore(page({ verdict })).score;
    expect(s('remove')).toBeLessThan(s('consolidate'));
    expect(s('consolidate')).toBeLessThan(s('improve'));
    expect(s('improve')).toBeLessThan(s('watch'));
    expect(s('watch')).toBeLessThan(s('healthy'));
  });

  it('zonder live cijfers telt zichtbaarheid niet: onbekend is geen nul', () => {
    const r = pageScore(page({ demand: 600, now: null }));
    expect(r.score).toBe(10);
    expect(r.factors.some(f => f.key === 'visibility')).toBe(false);
  });

  it('een pagina die Google niet meer toont verliest punten, met de verhouding in de uitleg', () => {
    const r = pageScore(page({ demand: 610, now: { impressions: 14, position: 70 } }));
    const vis = r.factors.find(f => f.key === 'visibility')!;
    expect(vis.delta).toBeLessThan(0);
    expect(vis.label).toMatch(/5%/);
    expect(r.score).toBeLessThanOrEqual(6);
  });

  it('zichtbaarheid en positie samen kosten nooit meer dan vier punten', () => {
    const r = pageScore(page({ demand: 6100, now: { impressions: 0, position: null } }));
    const search = r.factors.filter(f => f.key === 'visibility' || f.key === 'position').reduce((s, f) => s + f.delta, 0);
    expect(search).toBeGreaterThanOrEqual(-4);
  });

  it('een pagina zonder vraag wordt niet gestraft omdat Google hem niet toont', () => {
    expect(pageScore(page({ demand: 0, now: { impressions: 0, position: null } })).score).toBe(10);
  });

  it('een te lange titel kost één punt, een kapotte pagina drie', () => {
    expect(pageScore(page({ issues: ['title 68 tekens'] })).score).toBe(9);
    expect(pageScore(page({ issues: ['status 404'] })).score).toBe(7);
  });

  it('de score blijft tussen 1 en 10', () => {
    const r = pageScore(page({ verdict: 'remove', demand: 6100, now: { impressions: 0, position: null }, issues: ['status 500', 'title 90 tekens'] }));
    expect(r.score).toBe(1);
  });
});

describe('site- en sectiescore', () => {
  it('weegt naar zoekvraag, zodat een grote pagina meer telt dan een lege', () => {
    const big = page({ path: '/a', demand: 6100, now: { impressions: 2800, position: 5 } });
    const empty = page({ path: '/b', verdict: 'remove', demand: 0 });
    const r = rollup([big, empty]);
    expect(r.site).toBeGreaterThan(80);
    expect(r.site).toBeLessThanOrEqual(100);
  });

  it('geeft per sectie een score op 10 met één decimaal', () => {
    const r = rollup([page({ section: 'blog' }), page({ section: 'blog', verdict: 'improve' })]);
    expect(r.sections.blog).toBe(8.5);
  });
});

describe('geschiedenis', () => {
  it('vervangt de rij van dezelfde week en houdt de rest op volgorde', () => {
    const rows = [{ week: '2026-W43', date: '2026-10-23', site: 50, sections: {} }];
    const next = upsertHistory(upsertHistory(rows, { week: '2026-W41', date: '2026-10-09', site: 55, sections: {} }), {
      week: '2026-W43', date: '2026-10-24', site: 48, sections: {},
    });
    expect(next.map(r => `${r.week}:${r.site}`)).toEqual(['2026-W41:55', '2026-W43:48']);
  });
});
