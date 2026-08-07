import { describe, expect, it } from 'vitest';
import { BACKLOG_EXAM_NUMBER, examLabel, isBacklog } from '@/lib/admin/backlog';

/**
 * The backlog is exam number 0. These are cheap, but the point is that the constant has exactly one
 * definition: every listing that must skip it and every label that must not print "Examen 0" goes
 * through these two functions.
 */
describe('the backlog exam number', () => {
  it('is 0, and only 0', () => {
    expect(BACKLOG_EXAM_NUMBER).toBe(0);
    expect(isBacklog(0)).toBe(true);
    for (const n of [1, 2, 5, 10]) expect(isBacklog(n)).toBe(false);
  });

  it('never renders as "Examen 0"', () => {
    // The bug this pins: a 0 in the Examen column reads as a broken row, and the docent cannot see
    // which items are still unassigned.
    expect(examLabel(0)).toBe('Backlog');
    expect(examLabel(3)).toBe('Examen 3');
  });
});
