import { getFormat } from '@/data/skills';
import { getFreePractice, optionKeys, optionText } from '@/data/free-practice';
import type { DemoListening, DemoMcq, DemoSpeaking } from './HomeDemo';

/* De opgaven van de werkende proef (`HomeDemo`), gedeeld door de homepage en de landingspagina's.
   Het zijn bestaande, door de docent nagekeken opgaven — geen tweede versie ervan — zodat een
   landingspagina niets toont wat niet al gecontroleerd is. */

/** Spreken A2, oefenexamen 1, onderdeel 1, opgave 1 — letterlijk uit `scripts/a2-content/spreken.mjs`. */
export const SPREKEN_ITEM: DemoSpeaking = {
  speaker: 'Buurvrouw',
  says: 'Hoi! Wij zijn nieuw in deze straat. Waar woont u en hoe lang woont u hier al?',
  prompt: 'Uw nieuwe buurvrouw stelt zich voor. Geef antwoord op haar vraag.',
  answer: 'Ik woon op nummer 24. Ik woon hier nu ongeveer drie jaar.',
  limit: 60,
};

/** Wat de tegels van proefvraag lu-1 groot laten zien: de drie antwoorden zijn een dag en een tijd. */
const LU1_TILES: DemoListening['tiles'] = {
  A: { small: 'woensdag', big: '10:30' },
  B: { small: 'vrijdag', big: '9:00' },
  C: { small: 'vrijdag', big: '10:30' },
};

/** Proefvraag lz-2 (Lezen A2). */
export function lezenDemo(): DemoMcq {
  const lz = getFreePractice('lezen')!.items.find(i => i.id === 'lz-2')!;
  return {
    intro: lz.stimulusIntro.split('\n')[0],
    stimulusHtml: lz.stimulusHtml,
    question: lz.question,
    options: optionKeys(lz).map(k => ({ key: k, text: optionText(lz, k) })),
    correct: lz.correct,
    explanation: lz.explanation,
  };
}

/** Proefvraag lu-1 (Luisteren A2), met het echte fragment uit de gratis proef. */
export function luisterenDemo(): DemoListening {
  const lu = getFreePractice('luisteren')!.items.find(i => i.id === 'lu-1')!;
  return {
    intro: lu.stimulusIntro,
    question: lu.question,
    options: optionKeys(lu).map(k => ({ key: k, text: optionText(lu, k) })),
    correct: lu.correct,
    explanation: lu.explanation,
    audioSrc: lu.audioSrc!,
    script: lu.stimulusScript!,
    speakers: { A: 'Tandartspraktijk', B: 'Sara' },
    tiles: LU1_TILES,
  };
}

export function demoFormats() {
  const fmt = (skill: 'lezen' | 'luisteren' | 'spreken') => {
    const f = getFormat('a2', skill);
    return { items: f.itemCount ?? 0, minutes: f.durationMinutes ?? 0 };
  };
  return { luisteren: fmt('luisteren'), lezen: fmt('lezen'), spreken: fmt('spreken') };
}
