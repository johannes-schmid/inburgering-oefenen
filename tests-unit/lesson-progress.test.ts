/**
 * Voortgang en beheersing: de afgeleide getallen van de leerlaag.
 *
 * Wat hier gepind wordt is vooral `masteryPct`. Dat getal staat op de conceptkaart, stuurt
 * "hier kun je het meeste winnen" en bepaalt wanneer een concept "beheerst" heet — en het is
 * het enige cijfer in dit systeem dat de kandidaat over zichzelf leest buiten een examenuitslag
 * om. Een formule die stilletjes verandert verandert dus wat het product over iemand beweert.
 */

import { describe, it, expect } from 'vitest';
import {
  masteryPct, isMastered, masteryState, weakestFirst,
  blockProgress, courseProgressPct, nextLesson, exerciseCount,
  coursePath, lessonPath, conceptPath, conceptsPath, tierChip, isPublished,
  MASTERY_STREAK, MASTERY_THRESHOLD,
  type LessonBlock, type Mastery, type Concept,
} from '@/lib/lessons/lessons';

const mastery = (over: Partial<Mastery> = {}): Mastery => ({
  concept_id: 1, seen: 0, correct: 0, streak: 0,
  seen_receptief: 0, correct_receptief: 0,
  seen_productief: 0, correct_productief: 0,
  mastery_pct: 0, ...over,
});

const lesson = (id: number, order: number, done = false) => ({
  id, slug: `l${id}`, title: `Les ${id}`, minutes: 10, is_free: false, sort_order: order,
  progress: done ? { state: 'done' as const, items_done: 5, items_total: 5 } : null,
});

const block = (letter: string, order: number, lessons: ReturnType<typeof lesson>[]): LessonBlock => ({
  id: order, letter, name_nl: letter, intro: null, sort_order: order, lessons, outcomes: [],
});

describe('masteryPct', () => {
  it('is 0 zonder antwoorden', () => {
    expect(masteryPct(mastery())).toBe(0);
  });

  it('weegt receptief en productief even zwaar zodra er van beide iets is', () => {
    // 100% herkennen en 0% zelf maken is 50%, niet 75% en niet 100%. Het gemiddelde over álle
    // opgaven zou het verschil wegpoetsen, en dat verschil is precies wat de trap meet.
    expect(masteryPct(mastery({
      seen: 12, correct: 8,
      seen_receptief: 8, correct_receptief: 8,
      seen_productief: 4, correct_productief: 0,
    }))).toBe(50);
  });

  it('maximeert receptief-alleen op 50%', () => {
    // Tien meerkeuzevragen goed en nog nooit een zin gebouwd is echt bewijs — van de helft.
    // "100%" zou hier lezen als "hier ben je klaar", en dat is de bewering die niet mag.
    expect(masteryPct(mastery({
      seen: 10, correct: 10, seen_receptief: 10, correct_receptief: 10,
    }))).toBe(50);
  });

  it('laat productief-alleen wel tot 100% komen', () => {
    // Wie het zelf kan maken, kan het ook herkennen. Andersom niet.
    expect(masteryPct(mastery({
      seen: 6, correct: 6, seen_productief: 6, correct_productief: 6,
    }))).toBe(100);
  });

  it('valt terug op het ruwe gemiddelde als de trappen leeg zijn', () => {
    // Kan gebeuren bij oudere rijen of een item zonder tier; liever een bruikbaar getal dan 0.
    expect(masteryPct(mastery({ seen: 4, correct: 2 }))).toBe(50);
  });
});

describe('beheerst', () => {
  it('vraagt zowel het percentage als de reeks', () => {
    // Alleen een percentage kan uit twintig oude antwoorden komen terwijl de laatste vijf fout
    // waren; alleen een reeks kan uit vijf makkelijke vragen komen. Beide, of niet.
    expect(isMastered(mastery({ mastery_pct: MASTERY_THRESHOLD, streak: MASTERY_STREAK, seen: 20 }))).toBe(true);
    expect(isMastered(mastery({ mastery_pct: MASTERY_THRESHOLD, streak: MASTERY_STREAK - 1, seen: 20 }))).toBe(false);
    expect(isMastered(mastery({ mastery_pct: MASTERY_THRESHOLD - 1, streak: MASTERY_STREAK, seen: 20 }))).toBe(false);
  });

  it('noemt niet-begonnen niet "bezig"', () => {
    expect(masteryState(null)).toBe('niet-begonnen');
    expect(masteryState(mastery())).toBe('niet-begonnen');
    expect(masteryState(mastery({ seen: 2, correct: 0, mastery_pct: 0 }))).toBe('bezig');
    expect(masteryState(mastery({ seen: 8, correct: 5, mastery_pct: 65 }))).toBe('bijna');
    expect(masteryState(mastery({ seen: 20, correct: 18, mastery_pct: 90, streak: MASTERY_STREAK })))
      .toBe('beheerst');
  });
});

describe('weakestFirst', () => {
  const concepts = [
    { id: 1, slug: 'a', name_nl: 'A' },
    { id: 2, slug: 'b', name_nl: 'B' },
    { id: 3, slug: 'c', name_nl: 'C' },
    { id: 4, slug: 'd', name_nl: 'D' },
  ] as unknown as Concept[];

  it('laat nooit-begonnen concepten weg', () => {
    // "Je hebt hier nog niets gedaan" is geen zwak punt maar de hele cursus. De rail moet één
    // ding aanraden, en dat is iets waar je aan bent begonnen en nog niet beheerst.
    const m = new Map<number, Mastery>([
      [1, mastery({ concept_id: 1, seen: 0 })],
      [2, mastery({ concept_id: 2, seen: 6, correct: 2, mastery_pct: 30 })],
    ]);
    const out = weakestFirst(concepts, m);
    expect(out.map(x => x.concept.id)).toEqual([2]);
  });

  it('laat beheerste concepten weg en sorteert oplopend op beheersing', () => {
    const m = new Map<number, Mastery>([
      [1, mastery({ concept_id: 1, seen: 9, correct: 3, mastery_pct: 40 })],
      [2, mastery({ concept_id: 2, seen: 9, correct: 1, mastery_pct: 15 })],
      [3, mastery({ concept_id: 3, seen: 20, correct: 19, mastery_pct: 95, streak: MASTERY_STREAK })],
    ]);
    const out = weakestFirst(concepts, m);
    expect(out.map(x => x.concept.id)).toEqual([2, 1]);
  });

  it('respecteert de limiet', () => {
    const m = new Map<number, Mastery>(
      [1, 2, 3, 4].map(id => [id, mastery({ concept_id: id, seen: 5, correct: 1, mastery_pct: 20 })]));
    expect(weakestFirst(concepts, m, 2)).toHaveLength(2);
  });
});

describe('cursusvoortgang', () => {
  const blocks = [
    block('A', 10, [lesson(1, 10, true), lesson(2, 20, true)]),
    block('B', 20, [lesson(3, 10, true), lesson(4, 20), lesson(5, 30)]),
    block('C', 30, []),
  ];

  it('telt per blok', () => {
    expect(blockProgress(blocks[0])).toEqual({ done: 2, total: 2 });
    expect(blockProgress(blocks[1])).toEqual({ done: 1, total: 3 });
    expect(blockProgress(blocks[2])).toEqual({ done: 0, total: 0 });
  });

  it('rekent het percentage over lessen, niet over blokken', () => {
    // Drie van vijf lessen, niet "één van drie blokken": een blok met vier korte lessen mag
    // niet even zwaar wegen als een blok met één lange.
    expect(courseProgressPct(blocks)).toBe(60);
  });

  it('is 0 en niet NaN voor een lege cursus', () => {
    expect(courseProgressPct([])).toBe(0);
    expect(courseProgressPct([block('A', 10, [])])).toBe(0);
  });

  it('wijst de eerste onafgeronde les aan, in cursusvolgorde', () => {
    const next = nextLesson(blocks);
    expect(next?.lesson.id).toBe(4);
    expect(next?.block.letter).toBe('B');
  });

  it('geeft null als alles af is', () => {
    // De aanroeper zegt dan iets anders dan "ga verder": een knop die naar de laatste les
    // terugwijst leest als een fout.
    const allDone = [block('A', 10, [lesson(1, 10, true)])];
    expect(nextLesson(allDone)).toBeNull();
  });

  it('negeert de opgegeven blokvolgorde niet', () => {
    const shuffled = [blocks[1], blocks[0]];
    expect(nextLesson(shuffled)?.lesson.id).toBe(4);
  });
});

describe('exerciseCount', () => {
  it('telt alleen opgaven, geen uitleg', () => {
    // Anders staat een les op "50% gedaan" zodra je hem opent.
    expect(exerciseCount([
      { kind: 'uitleg' }, { kind: 'voorbeeld' }, { kind: 'leestekst' },
      { kind: 'mcq' }, { kind: 'gap_type' },
    ])).toBe(2);
  });
});

describe('paden', () => {
  it('zijn locale-loos en consistent', () => {
    // Eén plek waar deze strings worden gemaakt. Vier losse ternaries over het niveau is
    // precies de vorm die `guideHref()` heeft moeten repareren: elke variant type-checkte en
    // routeerde naar de verkeerde pagina.
    expect(coursePath('a2', 'lezen')).toBe('/dashboard/a2/lezen/leren');
    expect(lessonPath('a2', 'lezen', 'b4-omdat')).toBe('/dashboard/a2/lezen/leren/b4-omdat');
    expect(conceptsPath('b1')).toBe('/dashboard/b1/concepten');
    expect(conceptPath('b1', 'passief')).toBe('/dashboard/b1/concepten/passief');
  });
});

describe('de reviewgate', () => {
  it('publiceert alleen validated', () => {
    expect(isPublished('validated')).toBe(true);
    expect(isPublished('pending')).toBe(false);
  });
});

describe('tierChip', () => {
  it('geeft een leesbaar label per trap, en niets voor uitleg', () => {
    expect(tierChip(0)).toBe('herkennen');
    expect(tierChip(1)).toBe('invullen');
    expect(tierChip(2)).toBe('zelf maken');
    expect(tierChip(null)).toBeNull();
  });
});
