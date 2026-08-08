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

  /** A2 Spreken: four onderdelen of four, which must come to the 16 opgaven DUO sets. */
  it('makes A2 Spreken add up to 16', () => {
    const { partCount, itemsPerPart } = formatRules('a2', 'spreken');
    expect(partCount! * itemsPerPart!).toBe(getFormat('a2', 'spreken').itemCount);
  });

  /** B1 is deliberately unverified — an empty list, never a copy of A2's. */
  it('leaves B1 unverified', () => {
    for (const skill of SKILL_SLUGS) {
      expect(formatTaskRules('b1', skill)).toEqual([]);
    }
  });
});
