/**
 * De syllabus van de leerlaag: de conceptenbibliotheek en de cursusopbouw.
 *
 * Dit pint de dingen die met de hand zijn vastgelegd en die een latere sessie stilzwijgend kan
 * breken. De meeste checks hier gaan over **onvindbaarheid**: een concept zonder onderdeel, een
 * les die naar een concept wijst dat niet bestaat, twee lessen met dezelfde slug. Geen van die
 * drie faalt bij `tsc`, geen van de drie faalt bij het seeden, en alle drie leveren content op
 * die niemand ooit ziet.
 */

import { describe, it, expect } from 'vitest';
import { A2_GROUPS, A2_CONCEPTS, conceptsFor } from '../scripts/lesson-content/concepts-a2.mjs';
import { coursePlan, WORD_THEMES, BLOCK_C_SECTIONS, STRATEGY_CONCEPTS, BUILT } from '../scripts/lesson-content/plan.mjs';

type Concept = {
  slug: string; name_nl: string; group: string; kind: string;
  onderdelen: string[]; sort_order: number; one_liner: string; example_html?: string;
};

const CONCEPTS = A2_CONCEPTS as Concept[];
const GROUPS = A2_GROUPS as { slug: string; name_nl: string; sort_order: number }[];
const ONDERDELEN = ['lezen', 'luisteren', 'schrijven', 'spreken'];

describe('de A2-conceptenbibliotheek', () => {
  it('heeft 31 concepten in 6 groepen', () => {
    // Het aantal is een beslissing (eigenaar, 27-08): de 46 boekingangen zijn teruggebracht tot
    // 31 door de negen `Herhaling:`-passages een tweede oefenronde te maken in plaats van een
    // tweede rij. Verandert dit getal, dan is dat een inhoudelijke keuze en geen ongelukje.
    expect(CONCEPTS).toHaveLength(31);
    expect(GROUPS).toHaveLength(6);
  });

  it('elke slug is uniek', () => {
    // Een duplicaat is een unique-fout op (level, slug) halverwege een seedrun.
    const slugs = CONCEPTS.map(c => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('elk concept staat in een bestaande groep', () => {
    const known = new Set(GROUPS.map(g => g.slug));
    for (const c of CONCEPTS) {
      expect(known, `${c.slug} verwijst naar groep "${c.group}"`).toContain(c.group);
    }
  });

  it('elk concept staat in minstens één onderdeel', () => {
    // Anders is het onvindbaar: het komt in geen enkel blok B terecht en op de
    // conceptenpagina heeft het geen chips. Er faalt niets — het is er alleen niet.
    for (const c of CONCEPTS) {
      expect(c.onderdelen.length, `${c.slug} hoort bij geen enkel onderdeel`).toBeGreaterThan(0);
    }
  });

  it('elk onderdeel in de chips bestaat', () => {
    for (const c of CONCEPTS) {
      for (const o of c.onderdelen) {
        expect(ONDERDELEN, `${c.slug} noemt onderdeel "${o}"`).toContain(o);
      }
    }
  });

  it('elk concept heeft een one-liner en een voorbeeld met een markering', () => {
    for (const c of CONCEPTS) {
      expect(c.one_liner.trim().length, `${c.slug} heeft geen one_liner`).toBeGreaterThan(0);
      // `<mark>` is wat de kaart aanwijsbaar maakt. Een voorbeeld zonder markering is een zin
      // zonder pointer, en de kaart verliest waar hij voor bestaat.
      expect(c.example_html, `${c.slug} heeft geen voorbeeld`).toBeTruthy();
      expect(c.example_html, `${c.slug}: voorbeeld zonder <mark>`).toContain('<mark>');
    }
  });

  it('geen enkel concept is per ongeluk alleen productief én alleen receptief', () => {
    // Een concept dat in geen receptief en geen productief onderdeel staat is onbereikbaar via
    // beide sporen; deze check vangt een tikfout in de onderdeellijst.
    for (const c of CONCEPTS) {
      const heeftIets = c.onderdelen.some(o => ONDERDELEN.includes(o));
      expect(heeftIets, `${c.slug} staat in geen enkel echt onderdeel`).toBe(true);
    }
  });

  it('conceptsFor filtert echt', () => {
    // Spelling is bewust NIET bij Lezen: een gemiste -e verandert bij lezen zelden de
    // betekenis, bij schrijven wel. Als dit gelijk wordt aan "alle 31", is het filter stuk.
    const lezen = conceptsFor('lezen') as Concept[];
    const spreken = conceptsFor('spreken') as Concept[];
    expect(lezen.length).toBeLessThan(CONCEPTS.length);
    expect(lezen.length).toBeGreaterThan(20);
    expect(spreken.length).toBeGreaterThan(lezen.length);
    expect(lezen.map(c => c.slug)).not.toContain('klemtoon');
  });
});

describe('de cursusopbouw', () => {
  const blocks = coursePlan('a2', 'lezen') as {
    letter: string; name_nl: string; sort_order: number;
    lessons: {
      slug: string; kind: string; is_free?: boolean;
      concept?: string; strategyConcept?: string; section?: string;
    }[];
  }[];

  it('heeft de vijf blokken A tot E, op volgorde', () => {
    expect(blocks.map(b => b.letter)).toEqual(['A', 'B', 'C', 'D', 'E']);
    const orders = blocks.map(b => b.sort_order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it('elke lesslug is uniek binnen de cursus', () => {
    // Slugs zijn unique op (block_id, slug), dus een duplicaat binnen één blok laat de seedrun
    // struikelen — en een duplicaat over blokken heen maakt de URL dubbelzinnig.
    const slugs = blocks.flatMap(b => b.lessons.map(l => l.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('elke grammaticales verwijst naar een bestaand concept', () => {
    const known = new Set(CONCEPTS.map(c => c.slug));
    for (const les of blocks.flatMap(b => b.lessons)) {
      if (les.kind !== 'grammatica') continue;
      expect(known, `${les.slug} verwijst naar "${les.concept}"`).toContain(les.concept);
    }
  });

  it('elke strategieles verwijst naar een bestaand strategieconcept', () => {
    const known = new Set((STRATEGY_CONCEPTS.lezen ?? []).map((c: { slug: string }) => c.slug));
    for (const les of blocks.flatMap(b => b.lessons)) {
      if (les.kind !== 'strategie') continue;
      expect(known, `${les.slug} verwijst naar "${les.strategyConcept}"`).toContain(les.strategyConcept);
    }
  });

  it('blok B dekt precies de concepten van dit onderdeel', () => {
    // Geen concept overgeslagen en geen concept dubbel: blok B ís de bibliotheek van dit
    // onderdeel, en een gat erin is stof die nergens wordt uitgelegd.
    const blokB = blocks.find(b => b.letter === 'B')!;
    const taught = blokB.lessons.map(l => l.concept).sort();
    const expected = (conceptsFor('lezen') as Concept[]).map(c => c.slug).sort();
    expect(taught).toEqual(expected);
  });

  it('blok A dekt precies de woordthema\'s', () => {
    const blokA = blocks.find(b => b.letter === 'A')!;
    expect(blokA.lessons).toHaveLength(WORD_THEMES.length);
  });

  it('elke tekstsoortles verwijst naar een sectie uit BLOCK_C_SECTIONS', () => {
    const known = new Set(BLOCK_C_SECTIONS.lezen as string[]);
    for (const les of blocks.flatMap(b => b.lessons)) {
      if (les.kind !== 'tekstsoort' && les.kind !== 'training') continue;
      expect(known, `${les.slug} verwijst naar sectie "${les.section}"`).toContain(les.section);
    }
  });

  it('per blok is precies één les gratis, en nooit meer', () => {
    // De etalage. Meer weggeven is een prijsbeslissing en geen implementatiedetail; dit pint
    // dat een refactor het niet per ongeluk verruimt.
    for (const b of blocks) {
      const free = b.lessons.filter(l => l.is_free === true).length;
      expect(free, `blok ${b.letter} heeft ${free} gratis lessen`).toBeLessThanOrEqual(1);
    }
  });

  it('een niveau zonder eigen bibliotheek wordt geweigerd', () => {
    // B1 is niet A2 met zwaardere voorbeelden: `lib/ai/level-register.ts` is de enige plek waar
    // een niveauregister staat, en cross-niveau-besmetting is de stilste fout in dit systeem.
    // Liever luid falen dan stil A2-stof onder een B1-vlag seeden.
    expect(() => coursePlan('b1', 'lezen')).toThrow(/eigen conceptenbibliotheek/);
  });

  it('BUILT noemt alleen wat echt is uitgewerkt', () => {
    expect(BUILT).toEqual(['a2:lezen']);
  });
});
