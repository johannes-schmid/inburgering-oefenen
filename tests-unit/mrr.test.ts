import { describe, expect, it } from 'vitest';
import { buildMrrMovements, summariseSubscriptions } from '@/lib/admin/mrr';

const NOW = Date.parse('2026-09-22T12:00:00Z');
const user = (meta: Record<string, unknown> | null, email = 'a@b.nl') => ({
  created_at: '2026-01-01T00:00:00Z',
  email,
  user_metadata: meta,
});

describe('summariseSubscriptions', () => {
  it('telt een heel niveau tegen de bundelprijs, niet vier keer de moduleprijs', () => {
    const s = summariseSubscriptions(
      [user({ modules: ['a2:lezen', 'a2:luisteren', 'a2:schrijven', 'a2:spreken'] })],
      NOW,
    );
    expect(s.mrrCents).toBe(2995);
    expect(s.activeSubscribers).toBe(1);
  });

  it('laat een legacy plan-account buiten de MRR', () => {
    const s = summariseSubscriptions([user({ plan: 'premium' })], NOW);
    expect(s.mrrCents).toBe(0);
    expect(s.activeSubscribers).toBe(0);
  });

  it('haalt een opzegging uit de MRR, ook als de periode nog loopt', () => {
    const s = summariseSubscriptions(
      [user({
        modules: ['a2:lezen'],
        subscription_canceled_at: '2026-09-10T00:00:00Z',
        modules_until: '2026-10-10T00:00:00Z',
      })],
      NOW,
    );
    expect(s.mrrCents).toBe(0);
    expect(s.pendingChurnCents).toBe(995);
    expect(s.pendingChurnCount).toBe(1);
    expect(s.churnedCount).toBe(0);
    expect(s.churnedLast30).toBe(1);
  });

  it('churn is opzeggingen van 30 dagen gedeeld door de abonnees aan het begin', () => {
    const s = summariseSubscriptions(
      [
        user({ modules: ['a2:lezen'] }, '1@b.nl'),
        user({ modules: ['a2:lezen'] }, '2@b.nl'),
        user({ modules: ['a2:lezen'] }, '3@b.nl'),
        user({
          modules: ['knm'],
          subscription_canceled_at: '2026-09-01T00:00:00Z',
          modules_until: '2026-09-15T00:00:00Z',
        }, '4@b.nl'),
      ],
      NOW,
    );
    expect(s.mrrCents).toBe(2985);
    expect(s.arpuCents).toBe(995);
    expect(s.churnedCount).toBe(1);
    expect(s.churnRatePct).toBeCloseTo(25);
  });
});

describe('buildMrrMovements', () => {
  const NOW_M = Date.parse('2026-09-22T12:00:00Z');

  it('leest de eerste betaling als nieuw en een latere als uitbreiding', () => {
    const rows = buildMrrMovements(
      [{ id: 'u1', created_at: '2026-07-01T00:00:00Z', email: 'a@b.nl', user_metadata: { modules: ['a2:lezen', 'knm'] } }],
      [
        { user_id: 'u1', amount_cents: 995, created_at: '2026-07-04T00:00:00Z' },
        { user_id: 'u1', amount_cents: 995, created_at: '2026-08-04T00:00:00Z' },
      ],
      1990,
      6,
      NOW_M,
    );
    const jul = rows.find(r => r.month === '2026-07')!;
    const aug = rows.find(r => r.month === '2026-08')!;
    expect(jul.newCents).toBe(995);
    expect(aug.expansionCents).toBe(995);
    expect(aug.newCents).toBe(0);
  });

  it('boekt de opzegging in de maand waarin de betaalde periode afloopt', () => {
    const rows = buildMrrMovements(
      [{
        id: 'u1', created_at: '2026-05-01T00:00:00Z', email: 'a@b.nl',
        user_metadata: {
          modules: ['a2:lezen'],
          subscription_canceled_at: '2026-08-20T00:00:00Z',
          modules_until: '2026-09-05T00:00:00Z',
        },
      }],
      [{ user_id: 'u1', amount_cents: 995, created_at: '2026-05-04T00:00:00Z' }],
      0,
      6,
      NOW_M,
    );
    expect(rows.find(r => r.month === '2026-08')!.churnCents).toBe(0);
    expect(rows.find(r => r.month === '2026-09')!.churnCents).toBe(-995);
  });

  it('eindigt de lijn op de MRR van vandaag en rekent terug via netto', () => {
    const rows = buildMrrMovements(
      [{ id: 'u1', created_at: '2026-08-01T00:00:00Z', email: 'a@b.nl', user_metadata: { modules: ['a2:lezen'] } }],
      [{ user_id: 'u1', amount_cents: 995, created_at: '2026-09-04T00:00:00Z' }],
      995,
      6,
      NOW_M,
    );
    expect(rows).toHaveLength(6);
    expect(rows[5].mrrCents).toBe(995);
    expect(rows[4].mrrCents).toBe(0);
  });
});
