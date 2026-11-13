import { describe, expect, it } from 'vitest';
import {
  LEVELS, SKILL_SLUGS, formatRules, formatTaskRules, getFormat,
  type Level, type SkillSlug,
} from '@/data/skills';

/**
 * `TASK_RULES` and `RULES` mirror `exam_task_rules` and `exam_formats`. Nothing in the type
 * system stops the two drifting from the database or from each other, so the invariants that
 * *must* hold are pinned here — a quota that cannot be met, or one that leaves no room for
 * anything else, would show the docent a target she can never hit.
 */
describe('exam task rules', () => {
  const pairs = LEVELS.flatMap(l => SKILL_SLUGS.map(s => [l, s] as [Level, SkillSlug]));

  it('is satisfiable: the minimums fit inside the exam', () => {
    for (const [level, skill] of pairs) {
      const rules = formatTaskRules(level, skill);
      if (rules.length === 0) continue;
      const itemCount = getFormat(level, skill).itemCount;
      expect(itemCount, `${level} ${skill} has task rules but no item count`).not.toBeNull();
      const min = rules.reduce((n, r) => n + (r.perExam?.[0] ?? 0), 0);
      const max = rules.reduce((n, r) => n + (r.perExam?.[1] ?? 0), 0);
      expect(min, `${level} ${skill} minimums exceed the exam`).toBeLessThanOrEqual(itemCount!);
      // And the maximums must reach it, or the exam can never be filled legally.
      expect(max, `${level} ${skill} maximums cannot fill the exam`).toBeGreaterThanOrEqual(itemCount!);
    }
  });

  it('orders every range low-to-high', () => {
    for (const [level, skill] of pairs) {
      for (const r of formatTaskRules(level, skill)) {
        if (r.perExam) expect(r.perExam[0]).toBeLessThanOrEqual(r.perExam[1]);
        if (r.bullets) expect(r.bullets[0]).toBeLessThanOrEqual(r.bullets[1]);
      }
      const rules = formatRules(level, skill);
      for (const range of [rules.questionsPerStimulus, rules.options, rules.audioSeconds]) {
        if (range) expect(range[0]).toBeLessThanOrEqual(range[1]);
      }
    }
  });

  it('uses a category at most once per (level, skill)', () => {
    for (const [level, skill] of pairs) {
      const keys = formatTaskRules(level, skill).map(r => r.category);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  /**
   * Spreken's delen must come to the opgaven DUO sets: A2 is four onderdelen of four, B1 is
   * two delen of eight. Both are 16, by different arithmetic — which is exactly why this is
   * computed per level rather than asserted as a constant.
   */
  it('makes every Spreken exam add up out of its parts', () => {
    for (const level of LEVELS) {
      const { partCount, itemsPerPart } = formatRules(level, 'spreken');
      if (partCount === null || itemsPerPart === null) continue;
      expect(partCount * itemsPerPart, `${level} spreken`).toBe(getFormat(level, 'spreken').itemCount);
    }
  });

  /**
   * B1 Luisteren got its format on 2026-11-13: 39 one-question fragments in 90 minutes, the shape
   * its ten published exams are built to. Pinned so it cannot drift from `exam_formats`.
   */
  it('mirrors exam_formats for B1 Luisteren', () => {
    expect(formatTaskRules('b1', 'luisteren')).toEqual([]);
    expect(getFormat('b1', 'luisteren').itemCount).toBe(39);
    expect(getFormat('b1', 'luisteren').durationMinutes).toBe(90);
    expect(formatRules('b1', 'luisteren').stimulusCount).toBe(39);
  });

  /** All four B1 onderdelen must be present, or the mirror is half-done. */
  it('has every B1 onderdeel filled in', () => {
    for (const skill of ['lezen', 'luisteren', 'schrijven', 'spreken'] as SkillSlug[]) {
      expect(getFormat('b1', skill).itemCount, `b1 ${skill} itemCount`).not.toBeNull();
      expect(getFormat('b1', skill).durationMinutes, `b1 ${skill} duration`).not.toBeNull();
    }
  });
});
