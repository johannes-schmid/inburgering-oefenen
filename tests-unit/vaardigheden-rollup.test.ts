/**
 * De rekenkern van de zwaktekaart.
 *
 * Elk geval hier is er één waar een fout een *verkeerd cijfer* geeft in plaats van een leeg
 * scherm — en een verkeerd cijfer op deze kaart stuurt een kandidaat naar de verkeerde les.
 */

import { describe, it, expect } from 'vitest';
import { rollupVaardigheden, latestPerQuestion, MIN_ANSWERS, type TaggedAnswer } from '../lib/vaardigheden';

const V = [
  { slug: 'vinden', name_nl: 'Informatie vinden', one_liner: 'Waar staat het antwoord?', concepts: ['a', 'b'] },
  { slug: 'precies', name_nl: 'Precies lezen', one_liner: 'De kleine woorden.', concepts: ['c'] },
];

const NAMES = new Map([['a', 'Zoekend lezen'], ['b', 'Vraag eerst'], ['c', 'Signaalwoorden']]);
const LESSONS = new Map([['a', { href: '/nl/dashboard/a2/lezen/leren/zoekend', title: 'Zoekend lezen' }]]);

function answer(id: number, ok: boolean, slugs: string[], at = '2026-09-01T10:00:00Z'): TaggedAnswer {
  return { questionId: id, wasCorrect: ok, answeredAt: at, conceptSlugs: slugs };
}

/** n antwoorden op unieke vragen, waarvan de eerste `wrong` fout. */
function batch(n: number, wrong: number, slugs: string[], offset = 0): TaggedAnswer[] {
  return Array.from({ length: n }, (_, i) => answer(offset + i + 1, i >= wrong, slugs));
}

describe('latestPerQuestion', () => {
  it('houdt de laatste poging per vraag', () => {
    // Append-only log: drie keer dezelfde vraag, de derde keer goed. Alle drie meetellen zou een
    // kandidaat straffen voor het feit dát hij geoefend heeft.
    const out = latestPerQuestion([
      answer(1, false, ['a'], '2026-09-01T10:00:00Z'),
      answer(1, false, ['a'], '2026-09-02T10:00:00Z'),
      answer(1, true, ['a'], '2026-09-03T10:00:00Z'),
    ]);
    expect(out.size).toBe(1);
    expect(out.get(1)!.wasCorrect).toBe(true);
  });
});

describe('rollupVaardigheden', () => {
  it('rekent het percentage over de unieke vragen van die vaardigheid', () => {
    const rows = rollupVaardigheden(V, batch(10, 3, ['a']), NAMES, LESSONS, 2);
    const vinden = rows.find(r => r.key === 'vinden')!;
    expect(vinden.n).toBe(10);
    expect(vinden.pct).toBe(70);
    expect(vinden.detail).toBe('7 van 10 goed · over 2 examens');
  });

  it('telt een vraag binnen één vaardigheid hoogstens één keer', () => {
    // Twee tags uit dezelfde vaardigheid mogen die balk niet dubbel laten wegen.
    const rows = rollupVaardigheden(V, batch(8, 4, ['a', 'b']), NAMES, LESSONS, 1);
    expect(rows.find(r => r.key === 'vinden')!.n).toBe(8);
  });

  it('laat een vraag wél in twee vaardigheden meetellen', () => {
    // Een vraag die twee vaardigheden raakt is voor allebei echt bewijs.
    const rows = rollupVaardigheden(V, batch(6, 2, ['a', 'c']), NAMES, LESSONS, 1);
    expect(rows.find(r => r.key === 'vinden')!.n).toBe(6);
    expect(rows.find(r => r.key === 'precies')!.n).toBe(6);
  });

  it('negeert een ongetagde vraag volledig', () => {
    // Niet als fout en niet als goed — een ongekoppeld examen hoort niets te beweren.
    const rows = rollupVaardigheden(V, [...batch(6, 0, ['a']), ...batch(20, 20, [], 100)], NAMES, LESSONS, 1);
    const vinden = rows.find(r => r.key === 'vinden')!;
    expect(vinden.n).toBe(6);
    expect(vinden.pct).toBe(100);
  });

  it('toont geen balk onder de drempel', () => {
    const rows = rollupVaardigheden(V, batch(MIN_ANSWERS - 1, 3, ['a']), NAMES, LESSONS, 1);
    const vinden = rows.find(r => r.key === 'vinden')!;
    expect(vinden.pct).toBeNull();
    expect(vinden.detail).toBe('Nog te weinig gegevens');
    // Geen advies op basis van ruis: drie toevallige missers zijn geen leerdoel.
    expect(vinden.concepts).toEqual([]);
  });

  it('zet de zwakste bovenaan en rijen zonder oordeel onderaan', () => {
    const rows = rollupVaardigheden(
      V,
      [...batch(10, 1, ['a']), ...batch(10, 8, ['c'], 100)],
      NAMES, LESSONS, 3,
    );
    expect(rows.map(r => r.key)).toEqual(['precies', 'vinden']);

    const onlyWeak = rollupVaardigheden(V, batch(10, 9, ['c']), NAMES, LESSONS, 1);
    expect(onlyWeak[0].key).toBe('precies');
    expect(onlyWeak[1].pct).toBeNull();
  });

  it('noemt de concepten achter de fouten, met hun les', () => {
    const rows = rollupVaardigheden(
      V,
      [...batch(4, 4, ['a']), ...batch(4, 1, ['b'], 100)],
      NAMES, LESSONS, 1,
    );
    const vinden = rows.find(r => r.key === 'vinden')!;
    expect(vinden.concepts.map(c => [c.name, c.misses])).toEqual([
      ['Zoekend lezen', 4],
      ['Vraag eerst', 1],
    ]);
    expect(vinden.concepts[0].href).toBe('/nl/dashboard/a2/lezen/leren/zoekend');
    // Een concept zonder les krijgt geen verzonnen bestemming.
    expect(vinden.concepts[1].href).toBeNull();
  });

  it('noemt hoogstens twee concepten', () => {
    const many = { slug: 'x', name_nl: 'X', one_liner: 'x'.repeat(12), concepts: ['a', 'b', 'c'] };
    const rows = rollupVaardigheden([many], batch(9, 9, ['a', 'b', 'c']), NAMES, LESSONS, 1);
    expect(rows[0].concepts).toHaveLength(2);
  });

  it('laat het examen-achtervoegsel weg als er geen examens bekend zijn', () => {
    const rows = rollupVaardigheden(V, batch(6, 0, ['a']), NAMES, LESSONS, 0);
    expect(rows.find(r => r.key === 'vinden')!.detail).toBe('6 van 6 goed');
  });
});
