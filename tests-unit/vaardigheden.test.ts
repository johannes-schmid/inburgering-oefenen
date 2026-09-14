/**
 * De vaardighedenlaag: vier tot vijf koppen boven de concepten van Lezen en Luisteren.
 *
 * Dit pint de enige twee dingen die hier stil fout gaan, en allebei zijn ze onzichtbaar:
 * een concept dat in géén vaardigheid valt verdwijnt uit de zwaktekaart zonder dat er iets
 * logt, en een concept in twéé vaardigheden telt zijn fouten dubbel en laat twee balken
 * zakken. `tsc` vindt geen van beide — het zijn strings.
 *
 * Het is dezelfde discipline als `lesson-syllabus.test.ts`: de verdeling is inhoudelijk, dus
 * een hertagging door de docent hoort een bewuste testwijziging te zijn en geen cijfer dat
 * verschuift.
 */

import { describe, it, expect } from 'vitest';
import { VAARDIGHEDEN, vaardighedenFor, vaardigheidByConcept } from '../data/vaardigheden';
import { A2_CONCEPTS, conceptsFor } from '../scripts/lesson-content/concepts-a2.mjs';
import { STRATEGY_CONCEPTS } from '../scripts/lesson-content/plan.mjs';

type Concept = { slug: string; onderdelen: string[] };
const ONDERDELEN = ['lezen', 'luisteren'] as const;

/** Elk concept dat dít onderdeel vraagt: zijn taalregels plus zijn examentips. */
function conceptsOf(onderdeel: 'lezen' | 'luisteren'): string[] {
  const rules = (conceptsFor(onderdeel) as Concept[]).map(c => c.slug);
  const strategy = (STRATEGY_CONCEPTS[onderdeel] ?? []).map((c: { slug: string }) => c.slug);
  return [...rules, ...strategy];
}

describe('de vaardigheden van Lezen en Luisteren', () => {
  it('bestaan alleen voor de twee meerkeuze-taalonderdelen', () => {
    // Schrijven en Spreken hebben hun rubriekcriteria, KNM heeft zijn thema's. Een lege lijst
    // hier zou lezen als "nog in te vullen" — zie de kop van `data/vaardigheden.ts`.
    expect(Object.keys(VAARDIGHEDEN).sort()).toEqual(['lezen', 'luisteren']);
  });

  it('zijn er vier tot vijf per onderdeel', () => {
    // De bovengrens is het hele punt van deze laag: 25 en 33 concepten zijn geen kaart.
    for (const o of ONDERDELEN) {
      const v = vaardighedenFor(o);
      expect(v.length, o).toBeGreaterThanOrEqual(4);
      expect(v.length, o).toBeLessThanOrEqual(5);
    }
  });

  it('hebben unieke slugs en gevulde teksten', () => {
    for (const o of ONDERDELEN) {
      const v = vaardighedenFor(o);
      expect(new Set(v.map(x => x.slug)).size, o).toBe(v.length);
      for (const x of v) {
        expect(x.name_nl.length, x.slug).toBeGreaterThan(2);
        expect(x.one_liner.length, x.slug).toBeGreaterThan(10);
        expect(x.concepts.length, x.slug).toBeGreaterThan(0);
      }
    }
  });

  it('noemen alleen concepten die bestaan', () => {
    const known = new Set([
      ...(A2_CONCEPTS as Concept[]).map(c => c.slug),
      ...Object.values(STRATEGY_CONCEPTS).flat().map((c: { slug: string }) => c.slug),
    ]);
    for (const o of ONDERDELEN) {
      for (const v of vaardighedenFor(o)) {
        for (const slug of v.concepts) expect(known.has(slug), `${o}/${v.slug}: ${slug}`).toBe(true);
      }
    }
  });

  it('noemen alleen concepten die dít onderdeel ook echt vraagt', () => {
    // `concept_onderdelen` is de drietrapsas van 10-09. Een regel die aan Luisteren hangt maar
    // niet aan Lezen hoort niet in de Lezen-kaart: hij wordt daar nooit beantwoord, dus zijn
    // balk zou voor eeuwig op "te weinig gegevens" staan.
    for (const o of ONDERDELEN) {
      const mine = new Set(conceptsOf(o));
      for (const v of vaardighedenFor(o)) {
        for (const slug of v.concepts) expect(mine.has(slug), `${o}/${v.slug}: ${slug}`).toBe(true);
      }
    }
  });

  it('dekken elk concept van het onderdeel precies één keer', () => {
    for (const o of ONDERDELEN) {
      const all = vaardighedenFor(o).flatMap(v => v.concepts);

      // Geen dubbeling: anders telt één fout antwoord in twee balken.
      expect(new Set(all).size, `${o} heeft een dubbel concept`).toBe(all.length);

      // Geen wees: anders valt een concept stil uit de kaart.
      const missing = conceptsOf(o).filter(s => !all.includes(s));
      expect(missing, `${o} mist concepten`).toEqual([]);
    }
  });

  it('leveren een omkeerbare map van concept naar vaardigheid', () => {
    for (const o of ONDERDELEN) {
      const map = vaardigheidByConcept(o);
      expect(map.size).toBe(conceptsOf(o).length);
      for (const v of vaardighedenFor(o)) {
        for (const slug of v.concepts) expect(map.get(slug)?.slug).toBe(v.slug);
      }
    }
  });
});
