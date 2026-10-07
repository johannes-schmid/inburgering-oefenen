import { describe, expect, it } from 'vitest';
import {
  GOAL_ASSUMPTIONS, arpuEur, focusStep, netMonthlyEur, periodActuals, periodGoal, periodStart, productLabels, scenarios,
} from '@/lib/admin/goal-model';

describe('goal model', () => {
  it('rekent de opbrengst per abonnee excl. btw uit de echte prijzen', () => {
    expect(arpuEur('knm')).toBeCloseTo(9.95 / 1.21, 4);
    expect(arpuEur('a2')).toBeCloseTo((29.95 * 0.45 + 2 * 9.95 * 0.15 + 9.95 * 0.4) / 1.21, 4);
  });

  it('drie scenario’s, oplopend, met MRR = instroom × looptijd × opbrengst na kosten', () => {
    const list = scenarios();
    expect(list.map(s => s.key)).toEqual(['conservative', 'base', 'optimistic']);
    const c = list[0];
    expect(c.newPerMonth).toBe(90);
    expect(c.mrrEur).toBeCloseTo((40 * arpuEur('a2') + 50 * arpuEur('knm')) * 2 * 0.97, 6);
    expect(list[1].mrrEur).toBeGreaterThan(c.mrrEur);
  });

  it('het doel per dag is een dertigste van de maand, terug door de funnel', () => {
    const c = scenarios()[0];
    const day = periodGoal(c, 1), month = periodGoal(c, 30);
    expect(day.funnel.paid).toBeCloseTo(3, 6);
    expect(day.revenueEur * 30).toBeCloseTo(month.revenueEur, 6);
    const r = GOAL_ASSUMPTIONS.targetStepRates;
    expect(day.funnel.visitors).toBeCloseTo(3 / r.paid / r.signups / r.practicing, 6);
    expect(day.byTrack.a2 + day.byTrack.b1 + day.byTrack.knm).toBeCloseTo(3, 6);
  });

  it('netto haalt btw en kosten eraf', () => {
    expect(netMonthlyEur(12100)).toBeCloseTo(97, 6);
  });

  it('focus: te weinig verkeer wint als de conversies op streef zitten', () => {
    const goal = periodGoal(scenarios()[0], 1);
    const f = focusStep({ visitors: 100, practicing: 30, signups: 11, paid: 1 }, goal);
    expect(f).toMatchObject({ step: 'visitors', kind: 'traffic' });
  });

  it('focus: een lekkende stap wint als het verkeer op schema is', () => {
    const goal = periodGoal(scenarios()[0], 1);
    const f = focusStep({ visitors: 400, practicing: 120, signups: 40, paid: 0 }, goal);
    expect(f).toMatchObject({ step: 'paid', kind: 'conversion', attainment: 0 });
  });

  it('onbekend is geen nul: zonder GA4 alleen de gemeten stappen', () => {
    const goal = periodGoal(scenarios()[0], 30);
    expect(focusStep({ visitors: null, practicing: null, signups: 0, paid: 0 }, goal)).toBeNull();
    expect(focusStep({ visitors: null, practicing: null, signups: 40, paid: 1 }, goal)?.step).toBe('paid');
  });

  it('een periode begint om middernacht in Amsterdam', () => {
    const now = Date.parse('2026-10-07T12:00:00Z');
    expect(periodStart(1, now).toISOString()).toBe('2026-10-06T22:00:00.000Z');
    expect(periodStart(7, now).toISOString()).toBe('2026-09-30T22:00:00.000Z');
    expect(periodStart(1, Date.parse('2026-12-01T12:00:00Z')).toISOString()).toBe('2026-11-30T23:00:00.000Z');
  });

  it('een heel niveau is de bundel, anders elke module apart', () => {
    expect(productLabels('modules:a2:lezen,a2:luisteren,a2:schrijven,a2:spreken,knm')).toEqual(['KNM', 'Taal A2 · bundel']);
    expect(productLabels('modules:b1:lezen')).toEqual(['Taal B1 · Lezen']);
    expect(productLabels('legacy')).toEqual([]);
  });

  it('telt nieuwe klanten bij hun eerste betaling en omzet over alle betalingen in de periode', () => {
    const start = new Date('2026-10-01T00:00:00Z');
    const a = periodActuals(
      [{ created_at: '2026-10-02T10:00:00Z' }, { created_at: '2026-09-02T10:00:00Z' }],
      [
        { user_id: 'u1', product: 'modules:a2:lezen', amount_cents: 995, created_at: '2026-09-15T10:00:00Z' },
        { user_id: 'u1', product: 'modules:a2:lezen', amount_cents: 995, created_at: '2026-10-15T10:00:00Z' },
        { user_id: 'u2', product: 'modules:knm', amount_cents: 995, created_at: '2026-10-02T10:00:00+00:00' },
      ],
      start,
    );
    expect(a.sales).toBe(1);
    expect(a.byTrack).toEqual({ a2: 0, b1: 0, knm: 1 });
    expect(a.signups).toBe(1);
    expect(a.revenueEur).toBeCloseTo(netMonthlyEur(1990), 6);
    expect(a.products).toEqual([{ label: 'Taal A2 · Lezen', count: 1 }, { label: 'KNM', count: 1 }]);
  });
});

describe('ga4-sleutel', () => {
  it('een onleesbare GA4_SA_JSON wordt een fout op de pagina, geen crash', async () => {
    const before = process.env.GA4_SA_JSON;
    process.env.GA4_SA_JSON = `'{"type": "service_account", kapot`;
    const { fetchGa4 } = await import('@/lib/admin/ga4');
    const res = await fetchGa4();
    expect('error' in res && res.error).toMatch(/geen geldige JSON/);
    if (before === undefined) delete process.env.GA4_SA_JSON; else process.env.GA4_SA_JSON = before;
  });
});
