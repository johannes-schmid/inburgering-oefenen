/**
 * Wat de lescomponenten uit de leslaag nodig hebben, op één plek.
 *
 * Alleen doorgeefluik en één typeverbreding — geen tweede definitie van iets. `items.ts` en
 * `lessons.ts` zijn client-veilig (types, schema's en pure functies, geen `lib/supabase/*`),
 * dus dit bestand bestaat niet om een grens te bewaken maar om de imports in de componenten
 * kort te houden en om `LessonItemView` één keer te definiëren.
 */

export {
  GAP,
  isExerciseKind,
  matchesTyped,
  normaliseTyped,
  tierBucket,
  TIER_LABEL,
} from '@/lib/lessons/items';

export type { ItemKind, Tier, LessonItem as LessonItemRow } from '@/lib/lessons/items';

export { tierChip as tierChipOf } from '@/lib/lessons/lessons';

import type { LessonItem as Row } from '@/lib/lessons/items';

/** Eén woord uit `lesson_words`, zoals de woordenlijst-renderer het toont. */
export type LessonWord = {
  id: number;
  dutch: string;
  article: string | null;
  plural: string | null;
  frame: string | null;
  meaning_nl: string;
  example: string | null;
  usage: 'receptief' | 'productief';
};

/**
 * Hang de woorden aan het `woordenlijst`-item.
 *
 * De payload van dat item draagt alleen `word_ids` — de woorden zelf staan in `lesson_words`,
 * zodat een correctie aan een woord op één plek landt in plaats van in elke les die het
 * gebruikt. De pagina laadt ze en zet ze hier op het item, zodat de renderer geen tweede
 * databron nodig heeft.
 *
 * Een *distributieve* conditional over de union, dus alleen de `woordenlijst`-tak krijgt het
 * veld: op alle veertien takken zetten zou betekenen dat een mcq-renderer `item.words` mag
 * lezen en altijd `undefined` krijgt.
 */
type WithWords<T> = T extends { kind: 'woordenlijst' } ? T & { words?: LessonWord[] } : T;

export type LessonItem = WithWords<Row>;
