import { describe, expect, it } from 'vitest';
import {
  SPEAKING_CATEGORIES,
  categoryLabel,
  effectiveScores,
  examPctFromTaskPcts,
  isPassing,
  isTeacherReviewed,
  pctFromCriteria,
  pointsFromCriteria,
  rubricCategory,
  scoreBand,
} from '@/lib/rubrics';

const CRITERIA = [
  { key: 'inhoud', criterion: 'Inhoud', description: '', anchors: ['', '', '', ''] },
  { key: 'grammatica', criterion: 'Grammatica', description: '', anchors: ['', '', '', ''] },
  { key: 'woordenschat', criterion: 'Woordenschat', description: '', anchors: ['', '', '', ''] },
] as Parameters<typeof pctFromCriteria>[1];

describe('rubricCategory', () => {
  it('keys Schrijven on task_type', () => {
    expect(rubricCategory({ task_type: 'email' })).toBe('email');
    expect(rubricCategory({ task_type: 'form' })).toBe('form');
  });

  /** Spreken has one task_type but four onderdelen with different image rules. */
  it('keys Spreken on image_usage', () => {
    expect(rubricCategory({ task_type: 'speaking', image_usage: 'describe' })).toBe('speaking_describe');
    expect(rubricCategory({ task_type: 'speaking', image_usage: 'cover_all' })).toBe('speaking_cover_all');
  });

  /**
   * DUO's onderdeel 1. It carries one plaatje like `describe` does, so nothing but the
   * image_usage separates the two — and they grade against different criteria.
   */
  it('keys DUO onderdeel 1 as speaking_react', () => {
    expect(rubricCategory({ task_type: 'speaking', image_usage: 'react' })).toBe('speaking_react');
    expect(SPEAKING_CATEGORIES).toContain('speaking_react');
    expect(categoryLabel('speaking_react')).not.toBe('speaking_react');
  });

  it('falls back to speaking_none when no image usage is set', () => {
    expect(rubricCategory({ task_type: 'speaking', image_usage: null })).toBe('speaking_none');
    expect(rubricCategory({ task_type: 'speaking' })).toBe('speaking_none');
  });
});

describe('pctFromCriteria', () => {
  it('scores three of three as 100%', () => {
    const scores = CRITERIA.map(c => ({ criterion_key: c.key, score: 3 }));
    expect(pctFromCriteria(scores, CRITERIA)).toBe(100);
  });

  /**
   * The rule that keeps a grading bug from becoming a failed exam: an unscored criterion leaves
   * the denominator, it does not score zero.
   */
  it('drops a missing criterion from the denominator rather than scoring it 0', () => {
    const partial = [
      { criterion_key: 'inhoud', score: 3 },
      { criterion_key: 'grammatica', score: 3 },
    ];
    expect(pctFromCriteria(partial, CRITERIA)).toBe(100);
    // Scoring the third as 0 would have given 67% — a pass turned into a near-fail.
  });

  it('ignores scores for criteria the rubric does not define', () => {
    const stray = [
      { criterion_key: 'inhoud', score: 3 },
      { criterion_key: 'uitspraak', score: 0 },
    ];
    expect(pctFromCriteria(stray, CRITERIA)).toBe(100);
  });

  it('returns null when nothing was scored', () => {
    expect(pctFromCriteria([], CRITERIA)).toBeNull();
  });

  it('rounds to a whole percentage', () => {
    const scores = [
      { criterion_key: 'inhoud', score: 2 },
      { criterion_key: 'grammatica', score: 2 },
      { criterion_key: 'woordenschat', score: 1 },
    ];
    // 5 of 9 → 55.55… → 56
    expect(pctFromCriteria(scores, CRITERIA)).toBe(56);
  });
});

describe('pointsFromCriteria', () => {
  it('reports earned out of max for the scored criteria only', () => {
    const scores = [
      { criterion_key: 'inhoud', score: 2 },
      { criterion_key: 'grammatica', score: 3 },
    ];
    expect(pointsFromCriteria(scores, CRITERIA)).toEqual({ earned: 5, max: 6 });
  });

  it('returns null when nothing was scored', () => {
    expect(pointsFromCriteria([], CRITERIA)).toBeNull();
  });
});

describe('examPctFromTaskPcts', () => {
  it('averages the per-task percentages equally', () => {
    expect(examPctFromTaskPcts([100, 50, 50, 100])).toBe(75);
  });

  /** A percentage that will still move is worse than no percentage. */
  it('returns null while any task is ungraded', () => {
    expect(examPctFromTaskPcts([100, null, 80])).toBeNull();
  });

  it('returns null for no tasks', () => {
    expect(examPctFromTaskPcts([])).toBeNull();
  });
});

describe('isPassing', () => {
  it('passes exactly at the threshold', () => {
    expect(isPassing(60, 60)).toBe(true);
    expect(isPassing(59, 60)).toBe(false);
  });

  it('is null while ungraded, not false', () => {
    expect(isPassing(null, 60)).toBeNull();
  });
});

describe('scoreBand', () => {
  it('bands relative to the exam threshold', () => {
    expect(scoreBand(90, 60)).toBe('goed');
    expect(scoreBand(60, 60)).toBe('voldoende');
    expect(scoreBand(50, 60)).toBe('bijna');
    expect(scoreBand(30, 60)).toBe('onvoldoende');
  });

  it('moves the bands when the threshold moves', () => {
    expect(scoreBand(60, 70)).toBe('bijna');
    expect(scoreBand(70, 70)).toBe('voldoende');
  });
});

describe('effectiveScores', () => {
  const ai = { criterion_key: 'inhoud', score: 2, source: 'ai' as const };
  const teacher = { criterion_key: 'inhoud', score: 3, source: 'teacher' as const };

  it("shows the docent's score where she entered one", () => {
    expect(effectiveScores([ai, teacher] as never)[0]).toMatchObject({ score: 3, source: 'teacher' });
  });

  it('is order-independent', () => {
    expect(effectiveScores([teacher, ai] as never)[0]).toMatchObject({ score: 3, source: 'teacher' });
  });

  it('keeps the AI score where there is no docent score', () => {
    expect(effectiveScores([ai] as never)[0]).toMatchObject({ score: 2, source: 'ai' });
  });

  it('returns one row per criterion', () => {
    const scores = [ai, teacher, { criterion_key: 'grammatica', score: 1, source: 'ai' as const }];
    expect(effectiveScores(scores as never)).toHaveLength(2);
  });
});

describe('isTeacherReviewed', () => {
  it('is true as soon as one criterion carries a docent score', () => {
    expect(isTeacherReviewed([{ criterion_key: 'a', score: 1, source: 'teacher' }] as never)).toBe(true);
    expect(isTeacherReviewed([{ criterion_key: 'a', score: 1, source: 'ai' }] as never)).toBe(false);
  });
});
