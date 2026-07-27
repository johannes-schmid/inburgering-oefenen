export type { LerenThema, LerenSection, QuizQuestion } from './types';
import type { LerenThema } from './types';

/**
 * Leren modules are disabled for the A2 launch (see FEATURES.leren in lib/features.ts).
 * Content is authored in the admin (`leren_content` table); this static list is the
 * fallback and stays empty until A2 lesson content exists.
 */
export const THEMAS: LerenThema[] = [];

export function getThema(slug: string): LerenThema | undefined {
  return THEMAS.find(t => t.slug === slug);
}
