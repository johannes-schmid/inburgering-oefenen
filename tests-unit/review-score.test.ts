import { describe, expect, it } from 'vitest';
import { REVIEW_COOLDOWN_DAYS, canRequestReview, usageBand, usageScore } from '@/lib/admin/review-score';

const none = { examsCompleted: 0, lessonsDone: 0, gradedTasks: 0, cardsKnown: 0, activeDays: 0 };

describe('usageScore', () => {
  it('geeft 0 aan wie betaald heeft maar niets gedaan heeft', () => {
    expect(usageScore(none).score).toBe(0);
  });

  it('geeft 100 aan wie elk plafond haalt, en niet meer daarboven', () => {
    const full = { examsCompleted: 10, lessonsDone: 10, gradedTasks: 10, cardsKnown: 50, activeDays: 10 };
    expect(usageScore(full).score).toBe(100);
    expect(usageScore({ ...full, examsCompleted: 80, activeDays: 200 }).score).toBe(100);
  });

  it('weegt examens het zwaarst en woordkaarten het lichtst', () => {
    expect(usageScore({ ...none, examsCompleted: 5 }).score).toBe(20);
    expect(usageScore({ ...none, activeDays: 5 }).score).toBe(10);
    expect(usageScore({ ...none, lessonsDone: 5 }).score).toBe(10);
    expect(usageScore({ ...none, gradedTasks: 10 }).score).toBe(15);
    expect(usageScore({ ...none, cardsKnown: 50 }).score).toBe(5);
  });

  it('geeft de delen terug die samen de score zijn', () => {
    const { score, parts } = usageScore({ examsCompleted: 3, lessonsDone: 4, gradedTasks: 2, cardsKnown: 20, activeDays: 6 });
    expect(parts.exams + parts.lessons + parts.graded + parts.cards + parts.days).toBe(score);
  });
});

describe('usageBand', () => {
  it('deelt in op 30 en 60', () => {
    expect(usageBand(0)).toBe('laag');
    expect(usageBand(29)).toBe('laag');
    expect(usageBand(30)).toBe('midden');
    expect(usageBand(59)).toBe('midden');
    expect(usageBand(60)).toBe('hoog');
  });
});

describe('canRequestReview', () => {
  const now = Date.parse('2026-11-13T12:00:00Z');
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

  it('mag als er nooit gevraagd is', () => {
    expect(canRequestReview(null, now)).toBe(true);
  });

  it('mag niet binnen de wachttijd, wel erna', () => {
    expect(canRequestReview(daysAgo(1), now)).toBe(false);
    expect(canRequestReview(daysAgo(REVIEW_COOLDOWN_DAYS - 1), now)).toBe(false);
    expect(canRequestReview(daysAgo(REVIEW_COOLDOWN_DAYS), now)).toBe(true);
  });
});
