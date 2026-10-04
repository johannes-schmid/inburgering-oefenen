import { describe, expect, it } from 'vitest';
import { staticItem, staticKey } from '@/lib/mcp/static-taster';
import { getFreePractice } from '@/data/free-practice';

/**
 * De statische A2-taster krijgt negatieve, vaste sleutels zodat `submit_answer` hem kan nakijken
 * zonder databaserij. De sleutel moet omkeerbaar zijn en nooit met een echt `questions.id` botsen.
 */
describe('static taster keys', () => {
  it('round-trips for every static item', () => {
    for (const skill of ['lezen', 'luisteren'] as const) {
      const items = getFreePractice(skill)?.items ?? [];
      expect(items.length).toBe(10);
      items.forEach((item, i) => {
        const key = staticKey(skill, i)!;
        expect(key).toBeLessThan(0);
        expect(staticItem(key)).toEqual({ skill, item });
      });
    }
  });

  it('a positive id is never a static item', () => {
    expect(staticItem(1)).toBeNull();
    expect(staticItem(0)).toBeNull();
  });

  it('skills without a static set have no key', () => {
    expect(staticKey('schrijven', 0)).toBeNull();
  });

  it('every static item carries a correct option and a docent explanation', () => {
    for (const skill of ['lezen', 'luisteren'] as const) {
      for (const item of getFreePractice(skill)?.items ?? []) {
        expect(['A', 'B', 'C', 'D']).toContain(item.correct);
        expect(item.explanation.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
