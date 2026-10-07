import { describe, expect, it } from 'vitest';
import {
  GOAL_ASSUMPTIONS, activeByTrack, arpuEur, bottleneck, milestones, needsFor, netMonthlyEur, newCustomers,
  nextMilestone, stepRates,
} from '@/lib/admin/goal-model';

describe('goal model', () => {
  it('rekent de opbrengst per abonnee excl. btw uit de echte prijzen', () => {
    expect(arpuEur('knm')).toBeCloseTo(9.95 / 1.21, 4);
    expect(arpuEur('a2')).toBeCloseTo((29.95 * 0.45 + 2 * 9.95 * 0.15 + 9.95 * 0.4) / 1.21, 4);
  });

  it('zet mijlpalen oplopend en schaalt het doel exact op de doelomzet', () => {
    const list = milestones(2);
    expect(list.map(m => m.key)).toEqual(['conservative', 'base', 'optimistic', 'target']);
    expect(list[3].revenueEur).toBeCloseTo(GOAL_ASSUMPTIONS.targetEurPerMonth, 6);
    // Basis: 70 taal (42 A2 + 28 B1) en 75 KNM, twee maanden, 3% kosten.
    const base = list[1];
    expect(base.newPerMonth).toBeCloseTo(145, 6);
    expect(base.revenueEur).toBeCloseTo((70 * arpuEur('a2') + 75 * arpuEur('knm')) * 2 * 0.97, 6);
  });

  it('een langere looptijd verhoogt de omzet maar niet de benodigde instroom voor het doel lineair', () => {
    const two = milestones(2), four = milestones(4);
    expect(four[0].revenueEur).toBeCloseTo(two[0].revenueEur * 2, 6);
    expect(four[3].newPerMonth).toBeCloseTo(two[3].newPerMonth / 2, 6);
  });

  it('kiest de volgende mijlpaal boven de huidige omzet', () => {
    const list = milestones(2);
    expect(nextMilestone(list, 0)?.key).toBe('conservative');
    expect(nextMilestone(list, 1e9)).toBeNull();
  });

  it('netto MRR haalt btw en kosten eraf', () => {
    expect(netMonthlyEur(12100)).toBeCloseTo(97, 6);
  });

  it('onbekend is geen nul: zonder GA4 geen conversie en geen bottleneck op die stappen', () => {
    const rates = stepRates({ visitors: null, practicing: null, signups: 40, paid: 2 });
    expect(rates[0].current).toBeNull();
    expect(rates[0].assumed).toBe(true);
    expect(rates[2].current).toBeCloseTo(0.05);
    expect(bottleneck(rates)?.key).toBe('paid');
  });

  it('de bottleneck is de laagste gemeten ÷ streef', () => {
    const rates = stepRates({ visitors: 1000, practicing: 100, signups: 30, paid: 2 });
    // 10% vs 30% (0,33) · 30% vs 35% (0,86) · 6,7% vs 8% (0,83)
    expect(bottleneck(rates)?.key).toBe('practicing');
  });

  it('nul betalers rekent met de streefwaarde in plaats van oneindig verkeer', () => {
    const rates = stepRates({ visitors: 500, practicing: 150, signups: 50, paid: 0 });
    const need = needsFor(milestones(2), rates)[0].atCurrent;
    expect(Number.isFinite(need.visitors)).toBe(true);
    expect(bottleneck(rates)?.key).toBe('paid');
  });

  it('telt lopende abonnees per spoor en nieuwe klanten bij hun eerste betaling', () => {
    const users = [
      { created_at: '2026-09-01', user_metadata: { modules: ['a2:lezen', 'knm'] } },
      { created_at: '2026-09-01', user_metadata: { modules: ['b1:lezen'], subscription_canceled_at: '2026-09-20' } },
      { created_at: '2026-09-01', user_metadata: {} },
    ];
    expect(activeByTrack(users)).toEqual({ a2: 1, b1: 0, knm: 1, total: 1 });

    const now = Date.parse('2026-10-07T12:00:00Z');
    const { byMonth, last30 } = newCustomers([
      { user_id: 'u1', product: 'modules:a2:lezen,a2:luisteren', created_at: '2026-09-15T10:00:00Z' },
      { user_id: 'u1', product: 'modules:knm', created_at: '2026-10-01T10:00:00Z' },
      { user_id: 'u2', product: 'modules:knm', created_at: '2026-10-02T10:00:00Z' },
    ], 2, now);
    expect(byMonth.map(m => [m.month, m.a2, m.b1, m.knm])).toEqual([['2026-09', 1, 0, 0], ['2026-10', 0, 0, 1]]);
    expect(last30).toBe(2);
  });
});
