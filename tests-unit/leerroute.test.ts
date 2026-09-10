import { describe, expect, it } from 'vitest';
import { buildLeerroute, LEERROUTE_KINDS } from '@/lib/lessons/leerroute';
import type { Concept, ConceptKind, LessonBlock, LessonSummary, Mastery } from '@/lib/lessons/lessons';

function concept(id: number, kind: ConceptKind): Concept {
  return {
    id, level: 'a2', slug: `c${id}`, name_nl: `Concept ${id}`, kind,
    one_liner: '', example_html: null, group: null, onderdelen: ['lezen'], weight: null,
  };
}

function mastery(conceptId: number, pct: number): Mastery {
  return {
    concept_id: conceptId, seen: 10, correct: 5, streak: 0,
    seen_receptief: 10, correct_receptief: 5, seen_productief: 0, correct_productief: 0,
    mastery_pct: pct,
  };
}

function lesson(slug: string, done: boolean): LessonSummary {
  return {
    id: slug.length, slug, title: slug, minutes: 10, is_free: false, sort_order: 1,
    progress: done ? { state: 'done', items_done: 3, items_total: 3 } : null,
  };
}

function block(lessons: LessonSummary[]): LessonBlock {
  return { id: 1, letter: 'A', name_nl: 'A', intro: null, sort_order: 1, lessons, outcomes: [] };
}

describe('buildLeerroute', () => {
  it('geeft altijd drie stappen, in leervolgorde', () => {
    const out = buildLeerroute({
      concepts: [], mastery: new Map(), teachers: new Map(), blocks: [], examPractice: null,
    });
    expect(out.map(m => m.kind)).toEqual(LEERROUTE_KINDS);
    expect(LEERROUTE_KINDS).toEqual(['woordenschat', 'grammatica', 'strategie']);
  });

  it('geeft null en niet 0 voor een stap zonder concepten', () => {
    // Het verschil dat overal in dit repo geldt: "wij weten er niets van" is geen nulmeting.
    const out = buildLeerroute({
      concepts: [concept(1, 'grammatica')], mastery: new Map(), teachers: new Map(), blocks: [],
      examPractice: null,
    });
    expect(out.find(m => m.kind === 'woordenschat')!.score).toBeNull();
    expect(out.find(m => m.kind === 'woordenschat')!.masteryPct).toBeNull();
    // De stap die wél concepten heeft staat op 0 en niet op null: er is stof, je hebt niets gedaan.
    expect(out.find(m => m.kind === 'grammatica')!.score).toBe(0);
  });

  it('een ongezien concept telt voor 0 in de beheersing van zijn stap', () => {
    const out = buildLeerroute({
      concepts: [concept(1, 'grammatica'), concept(2, 'grammatica')],
      mastery: new Map([[1, mastery(1, 100)]]),
      teachers: new Map(),
      blocks: [],
      examPractice: null,
    });
    // Niet 100: één concept beheerst van twee is de halve stap.
    expect(out.find(m => m.kind === 'grammatica')!.masteryPct).toBe(50);
  });

  it('weegt lessen en beheersing even zwaar', () => {
    const out = buildLeerroute({
      concepts: [concept(1, 'grammatica'), concept(2, 'grammatica')],
      mastery: new Map([[1, mastery(1, 100)], [2, mastery(2, 100)]]),
      teachers: new Map([[1, { slug: 'les-1', title: 'Les 1' }], [2, { slug: 'les-2', title: 'Les 2' }]]),
      blocks: [block([lesson('les-1', true), lesson('les-2', false)])],
      examPractice: null,
    });
    const g = out.find(m => m.kind === 'grammatica')!;
    expect(g.lessonsDone).toBe(1);
    expect(g.lessonsTotal).toBe(2);
    // (0.5 lessen + 1.0 beheersing) / 2
    expect(g.score).toBe(75);
    expect(g.next).toMatchObject({ slug: 'les-2' });
  });

  it('telt de oefenhelft alleen mee bij Examentraining', () => {
    const input = {
      concepts: [concept(1, 'grammatica'), concept(2, 'strategie')],
      mastery: new Map([[1, mastery(1, 100)], [2, mastery(2, 100)]]),
      teachers: new Map(),
      blocks: [],
      examPractice: 0,
    };
    const out = buildLeerroute(input);
    // Grammatica ziet de examens niet: alleen beheersing, dus 100.
    expect(out.find(m => m.kind === 'grammatica')!.score).toBe(100);
    // Examentraining wel: (1.0 beheersing + 0 oefenen) / 2.
    expect(out.find(m => m.kind === 'strategie')!.score).toBe(50);
  });

  it('telt één les die twee concepten van dezelfde stap uitlegt niet dubbel', () => {
    const out = buildLeerroute({
      concepts: [concept(1, 'grammatica'), concept(2, 'grammatica')],
      mastery: new Map(),
      teachers: new Map([[1, { slug: 'les-1', title: 'Les 1' }], [2, { slug: 'les-1', title: 'Les 1' }]]),
      blocks: [block([lesson('les-1', true)])],
      examPractice: null,
    });
    const g = out.find(m => m.kind === 'grammatica')!;
    expect(g.lessonsTotal).toBe(1);
    expect(g.lessonsDone).toBe(1);
  });

  it('negeert een les die de cursus van dit onderdeel niet bevat', () => {
    // `fetchTeachersForCourse` is al op onderdeel gefilterd, maar een concept kan naar een les
    // wijzen die in een andere cursus staat; die mag de noemer hier niet opblazen.
    const out = buildLeerroute({
      concepts: [concept(1, 'grammatica')],
      mastery: new Map(),
      teachers: new Map([[1, { slug: 'les-elders', title: 'Elders' }]]),
      blocks: [block([lesson('les-1', true)])],
      examPractice: null,
    });
    expect(out.find(m => m.kind === 'grammatica')!.lessonsTotal).toBe(0);
  });
});
