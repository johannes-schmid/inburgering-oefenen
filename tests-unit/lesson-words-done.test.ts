/**
 * Wanneer een woordenles af is (eigenaar, 15-10): als elk woord van de les op "Ken ik" staat.
 *
 * De woordenles heeft geen opgaven meer, dus `lesson-answer` zet hem nooit op `done`. Deze regel
 * is de enige weg, en blok A van elke cursus telt erop.
 */

import { describe, it, expect } from 'vitest';
import { lessonWordsDone } from '@/lib/lessons/words';

describe('lessonWordsDone', () => {
  it('is af als elk woord gekend is', () => {
    expect(lessonWordsDone(['known', 'known', 'known'])).toBe(true);
  });

  it('is niet af zolang één woord nog niet gekend is', () => {
    expect(lessonWordsDone(['known', 'learning', 'known'])).toBe(false);
    expect(lessonWordsDone(['known', 'seen'])).toBe(false);
    expect(lessonWordsDone(['unseen'])).toBe(false);
  });

  it('een les zonder woorden is nooit af — dat is een gat in de inhoud, geen voortgang', () => {
    expect(lessonWordsDone([])).toBe(false);
  });
});
