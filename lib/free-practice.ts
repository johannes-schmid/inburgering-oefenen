import { getFreePractice } from '@/data/free-practice';
import type { FreePracticeItem } from '@/data/free-practice';
import { fetchDbFreePractice } from '@/lib/free-practice-db';
import type { SkillSlug } from '@/data/skills';

/**
 * The A2 taster's items: the database first, the static set as a fallback.
 *
 * `data/free-practice.ts` used to be the only source. It is now the fallback, so that the
 * docent's corrections in `/admin` reach the top of the funnel — the twenty static items could
 * only ever be changed by a deploy, and they were the one content surface she could not touch.
 *
 * **The fallback is not decoration.** These four URLs are indexed and ranking, so an
 * unpublished A2 exam 1, or an exam whose first ten items are not all renderable text MCQs,
 * must not 404 the entry point of the whole funnel. `source` is returned so a caller can tell
 * which it got; nothing renders differently, but it is what makes the fallback observable.
 */
export type TasterItems = {
  items: FreePracticeItem[];
  source: 'db' | 'static';
};

export async function fetchA2FreePractice(skill: SkillSlug): Promise<TasterItems | null> {
  const fromDb = await fetchDbFreePractice('a2', skill);
  if (fromDb) return { items: fromDb, source: 'db' };

  const set = getFreePractice(skill);
  return set ? { items: set.items, source: 'static' } : null;
}
