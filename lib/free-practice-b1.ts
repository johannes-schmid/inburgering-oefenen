import { dbTasterSkills, fetchDbFreePractice, hasDbFreePractice, TASTER_COUNT } from '@/lib/free-practice-db';
import type { FreePracticeItem } from '@/data/free-practice';
import type { SkillSlug } from '@/data/skills';

/**
 * The free B1 taster — a thin wrapper over `lib/free-practice-db.ts`.
 *
 * This module used to hold the whole derivation. A2 now reads the database too, so the mapping
 * moved to one level-agnostic place and this file survives only as the B1 name its three
 * callers already import. Everything worth knowing — what it must never leak, why B1 404s
 * where A2 falls back, why Luisteren/Schrijven/Spreken have no B1 taster — is documented
 * there.
 */

/** @deprecated Prefer `TASTER_COUNT` from `lib/free-practice-db`. */
export const B1_TASTER_COUNT = TASTER_COUNT;

export function hasB1FreePractice(skill: SkillSlug): boolean {
  return hasDbFreePractice('b1', skill);
}

export function b1TasterSkills(): SkillSlug[] {
  return dbTasterSkills('b1');
}

export function fetchB1FreePractice(skill: SkillSlug): Promise<FreePracticeItem[] | null> {
  return fetchDbFreePractice('b1', skill);
}
