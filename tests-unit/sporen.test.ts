import { describe, expect, it } from 'vitest';
import {
  findModule,
  isSpoor,
  modulePath,
  nextInModule,
  spoorPath,
  tally,
  type Spoor,
  type SpoorModule,
} from '@/lib/lessons/sporen';
import type { LessonSummary } from '@/lib/lessons/lessons';

function les(id: number, state?: 'started' | 'done'): LessonSummary {
  return {
    id,
    slug: `l${id}`,
    title: `Les ${id}`,
    minutes: 10,
    is_free: false,
    sort_order: id * 10,
    progress: state ? { state, items_done: 0, items_total: 0 } : null,
  };
}

function mod(slug: string, lessons: LessonSummary[]): SpoorModule {
  return { slug, name: slug, intro: null, lessons, ...tally(lessons) };
}

describe('tally', () => {
  it('telt alleen afgeronde lessen', () => {
    expect(tally([les(1, 'done'), les(2, 'started'), les(3)]))
      .toEqual({ done: 1, total: 3, pct: 33 });
  });

  it('is 0 en niet NaN op een leeg brok', () => {
    expect(tally([])).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe('nextInModule', () => {
  it('geeft de eerste onafgeronde les', () => {
    expect(nextInModule(mod('m', [les(1, 'done'), les(2), les(3)]))?.id).toBe(2);
  });

  it('valt terug op de eerste les als alles af is — de module blijft herhaalbaar', () => {
    expect(nextInModule(mod('m', [les(1, 'done'), les(2, 'done')]))?.id).toBe(1);
  });

  it('geeft null op een module zonder lessen', () => {
    expect(nextInModule(mod('m', []))).toBeNull();
  });
});

describe('findModule', () => {
  const sporen: Spoor[] = [
    { slug: 'taalregels', modules: [mod('a', [les(1), les(2)]), mod('b', [les(3)])], ...tally([les(1), les(2), les(3)]) },
    { slug: 'examentraining', modules: [mod('c', [les(4)])], ...tally([les(4)]) },
  ];

  it('vindt de module én zijn plaats in het spoor', () => {
    const hit = findModule(sporen, 3);
    expect(hit?.module.slug).toBe('b');
    expect(hit?.spoor.slug).toBe('taalregels');
    expect(hit?.index).toBe(1);
  });

  it('kijkt over sporen heen', () => {
    expect(findModule(sporen, 4)?.spoor.slug).toBe('examentraining');
  });

  /* Blok A (Woorden) zit in geen spoor. Dat is een feit en geen fout: de lespagina valt dan
     terug op de cursus in plaats van een lege modulepagina te bouwen. */
  it('geeft null voor een les buiten elk spoor', () => {
    expect(findModule(sporen, 99)).toBeNull();
  });
});

describe('paden en de spoorgate', () => {
  it('hangt naast leren en niet eronder — anders botst het met /leren/[lesSlug]', () => {
    expect(spoorPath('a2', 'lezen', 'taalregels')).toBe('/dashboard/a2/lezen/spoor/taalregels');
    expect(modulePath('a2', 'lezen', 'examentraining', 'c'))
      .toBe('/dashboard/a2/lezen/spoor/examentraining/c');
  });

  it('laat alleen de twee echte sporen door', () => {
    expect(isSpoor('taalregels')).toBe(true);
    expect(isSpoor('examentraining')).toBe(true);
    // `strategie` is het woord van de database, geen URL.
    expect(isSpoor('strategie')).toBe(false);
    expect(isSpoor('woordenschat')).toBe(false);
  });
});
