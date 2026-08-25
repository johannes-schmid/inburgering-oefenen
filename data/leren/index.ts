/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * `leren_content` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
export type { LerenThema, LerenSection, QuizQuestion } from './types';
export { thema as thema1 } from './thema-1';
export { thema as thema2 } from './thema-2';
export { thema as thema3 } from './thema-3';
export { thema as thema4 } from './thema-4';
export { thema as thema5 } from './thema-5';
export { thema as thema6 } from './thema-6';
export { thema as thema7 } from './thema-7';

import { thema as thema1 } from './thema-1';
import { thema as thema2 } from './thema-2';
import { thema as thema3 } from './thema-3';
import { thema as thema4 } from './thema-4';
import { thema as thema5 } from './thema-5';
import { thema as thema6 } from './thema-6';
import { thema as thema7 } from './thema-7';
import type { LerenThema } from './types';

/**
 * The seven official KNM thema's. These are KNM's lesson modules, not the taalonderdelen's —
 * Lezen and Luisteren teach through their oefenexamens and have no `leren` surface.
 */
export const THEMAS: LerenThema[] = [thema1, thema2, thema3, thema4, thema5, thema6, thema7];

export function getThema(slug: string): LerenThema | undefined {
  return THEMAS.find(t => t.slug === slug);
}

/** The quiz behind a thema keys on the KNM question bank's `category` string. */
export function getThemaByQuizCategory(category: string): LerenThema | undefined {
  return THEMAS.find(t => t.quizCategory === category);
}
