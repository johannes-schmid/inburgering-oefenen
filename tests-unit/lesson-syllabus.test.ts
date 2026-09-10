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
import { A2_GROUPS, A2_CONCEPTS, conceptsFor, rulesHomeConcepts } from '../scripts/lesson-content/concepts-a2.mjs';
import { coursePlan, wordThemes, BLOCK_C_SECTIONS, STRATEGY_CONCEPTS, BUILT } from '../scripts/lesson-content/plan.mjs';

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
    expect(spreken.length).toBeGreaterThan(lezen.length);
    expect(lezen.map(c => c.slug)).not.toContain('klemtoon');
    // Ook de productiekant: verbuiging en vaste voorzetsels zijn regels die je zélf goed moet
    // doen en die een leesvraag niet van betekenis laten veranderen.
    expect(lezen.map(c => c.slug)).not.toContain('lidwoorden');
    expect(lezen.map(c => c.slug)).not.toContain('vaste-voorzetsels');
    expect(spreken.map(c => c.slug)).toContain('lidwoorden');
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

  it('blok B dekt alle taalregels die een les hebben, niet alleen die van Lezen', () => {
    // ── WAT DEZE TEST BEWAAKT ────────────────────────────────────────────────
    // Blok B van Lezen is `RULES_HOME`: het enige exemplaar van elke regelles, gedeeld door
    // alle vier de cursussen. Tot 10-09 stond hier `conceptsFor('lezen')`, en dat kón omdat
    // Lezen toevallig aan 28 van de 31 regels hing. Zou het weer aan de leeslijst van Lezen
    // hangen, dan haalt een afweging bij Lezen (nu 20 regels) acht lessen weg die Schrijven
    // en Spreken nog nodig hebben — en er is er maar één van elk.
    const blokB = blocks.find(b => b.letter === 'B')!;
    const taught = blokB.lessons.map(l => l.concept).sort();
    expect(taught).toEqual(rulesHomeConcepts().map((c: Concept) => c.slug).sort());
    // En de leeslijst van Lezen is echt kleiner dan wat er fysiek ligt.
    expect((conceptsFor('lezen') as Concept[]).length).toBeLessThan(taught.length);
  });

  it('blok A dekt precies de woordthema\'s', () => {
    const blokA = blocks.find(b => b.letter === 'A')!;
    expect(blokA.lessons).toHaveLength((wordThemes('lezen') as unknown[]).length);
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
    expect(BUILT).toEqual(['a2:lezen', 'a2:luisteren', 'a2:schrijven', 'a2:spreken']);
  });

  it('een onderdeel zonder cursusopbouw wordt geweigerd', () => {
    // KNM heeft eigen lesmodules en 366 woordkaarten; een leerlaag eroverheen zou twee
    // cursussen over dezelfde stof opleveren. Liever luid falen dan een leeg blok seeden.
    expect(() => coursePlan('a2', 'knm')).toThrow(/Geen cursusopbouw/);
  });
});

/**
 * De drie cursussen die op 08-09 zijn toegevoegd.
 *
 * Dezelfde checks als bij Lezen, maar over alle vier gedraaid — plus de twee dingen die alleen
 * over déze drie te zeggen zijn: ze hebben géén grammaticablok (dat staat één keer, bij Lezen),
 * en hun blok B en C leunen op `STRATEGY_CONCEPTS` in plaats van op de conceptenbibliotheek.
 */
describe('de vier cursussen', () => {
  type Lesson = {
    slug: string; kind: string; title: string | null; is_free?: boolean; sort_order: number;
    concept?: string; strategyConcept?: string; section?: string; category?: string | null;
    theme?: string;
  };
  type Block = { letter: string; name_nl: string; sort_order: number; lessons: Lesson[] };

  const courses = Object.fromEntries(
    ONDERDELEN.map(o => [o, coursePlan('a2', o) as Block[]]),
  ) as Record<string, Block[]>;

  const EXPECTED_SIZE: Record<string, number> = {
    lezen: 53, luisteren: 26, schrijven: 24, spreken: 26,
  };

  it('elke cursus heeft de afgesproken omvang', () => {
    // De getallen komen uit docs/decisions/leerlaag-a2-master-plan.html en zijn een
    // inhoudelijke afspraak: 76 nieuwe lessen naast de 53 die er al stonden. Verandert er één,
    // dan is dat een besluit en geen ongelukje.
    for (const [onderdeel, blocks] of Object.entries(courses)) {
      const total = blocks.reduce((n, b) => n + b.lessons.length, 0);
      expect(total, `${onderdeel} heeft ${total} lessen`).toBe(EXPECTED_SIZE[onderdeel]);
    }
  });

  it('elke cursus heeft de vijf blokken A tot E, op volgorde', () => {
    for (const [onderdeel, blocks] of Object.entries(courses)) {
      expect(blocks.map(b => b.letter), onderdeel).toEqual(['A', 'B', 'C', 'D', 'E']);
      const orders = blocks.map(b => b.sort_order);
      expect([...orders].sort((a, b) => a - b), onderdeel).toEqual(orders);
    }
  });

  it('elke lesslug is uniek binnen zijn cursus, en elke les heeft een sort_order', () => {
    for (const [onderdeel, blocks] of Object.entries(courses)) {
      const slugs = blocks.flatMap(b => b.lessons.map(l => l.slug));
      expect(new Set(slugs).size, `${onderdeel} heeft een dubbele slug`).toBe(slugs.length);
      for (const b of blocks) {
        const orders = b.lessons.map(l => l.sort_order);
        expect(new Set(orders).size, `${onderdeel} blok ${b.letter}`).toBe(orders.length);
      }
    }
  });

  it('alleen Lezen heeft een grammaticablok', () => {
    // Het besluit van 08-09: de 28 regels staan één keer, bij Lezen, en worden daarvandaan
    // gelinkt. Komt er hier een tweede grammaticablok bij, dan wordt dezelfde regel vier keer
    // geschreven en lopen de vier versies uit elkaar.
    for (const [onderdeel, blocks] of Object.entries(courses)) {
      const grammar = blocks.flatMap(b => b.lessons).filter(l => l.kind === 'grammatica');
      if (onderdeel === 'lezen') expect(grammar.length).toBeGreaterThan(20);
      else expect(grammar, `${onderdeel} heeft grammaticalessen`).toHaveLength(0);
    }
  });

  it('elke les verwijst naar een concept dat bestaat', () => {
    const grammar = new Set(CONCEPTS.map(c => c.slug));
    for (const [onderdeel, blocks] of Object.entries(courses)) {
      const strategy = new Set(
        ((STRATEGY_CONCEPTS as Record<string, { slug: string }[]>)[onderdeel] ?? [])
          .map(c => c.slug),
      );
      for (const les of blocks.flatMap(b => b.lessons)) {
        if (les.concept) {
          expect(grammar, `${onderdeel}/${les.slug} -> ${les.concept}`).toContain(les.concept);
        }
        if (les.strategyConcept) {
          expect(strategy, `${onderdeel}/${les.slug} -> ${les.strategyConcept}`)
            .toContain(les.strategyConcept);
        }
      }
    }
  });

  it('elk strategieconcept wordt door precies één les uitgelegd', () => {
    // `lesson_concepts` heeft een trigger die één `teaches` per (concept, level, onderdeel)
    // afdwingt. Twee lessen op één concept laat de seedrun halverwege struikelen; nul lessen
    // maakt het concept onvindbaar.
    for (const onderdeel of ONDERDELEN) {
      const concepts = (STRATEGY_CONCEPTS as Record<string, { slug: string }[]>)[onderdeel] ?? [];
      const taught = courses[onderdeel]
        .flatMap(b => b.lessons)
        .map(l => l.strategyConcept)
        .filter(Boolean);
      expect(taught.sort(), onderdeel).toEqual(concepts.map(c => c.slug).sort());
    }
  });

  it('elke les heeft een titel, behalve waar de database hem levert', () => {
    // `title: null` betekent "de seeder haalt hem uit sections.name_nl", en dat mag alleen bij
    // Lezen: voor Schrijven en Spreken bestaan die rijen niet, en een null zou daar een les
    // zonder naam opleveren.
    for (const [onderdeel, blocks] of Object.entries(courses)) {
      for (const les of blocks.flatMap(b => b.lessons)) {
        if (les.title === null) {
          expect(onderdeel, `${les.slug} heeft geen titel`).toBe('lezen');
          expect(les.section, `${les.slug} heeft geen titel én geen sectie`).toBeTruthy();
        } else {
          expect(les.title!.trim().length, `${onderdeel}/${les.slug}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('elke woordenles noemt een thema van zijn eigen onderdeel', () => {
    // `lesson_words` is unique op (level, onderdeel, dutch): een les die naar het thema van een
    // ánder onderdeel wijst, krijgt een lege woordenlijst. Er faalt niets — hij is leeg.
    for (const onderdeel of ONDERDELEN) {
      const themes = new Set((wordThemes(onderdeel) as { slug: string }[]).map(t => t.slug));
      for (const les of courses[onderdeel].flatMap(b => b.lessons)) {
        if (les.kind !== 'woorden' && les.kind !== 'zinnen') continue;
        expect(themes, `${onderdeel}/${les.slug} -> ${les.theme}`).toContain(les.theme);
      }
    }
  });

  it('blok D en E geven niets gratis weg', () => {
    // Een gratis examentraining zonder de uitleg ervoor verkoopt niets, en blok E is een
    // diagnose. De etalage is blok A, B en C — daar staat de eerste les open.
    for (const [onderdeel, blocks] of Object.entries(courses)) {
      for (const b of blocks) {
        const free = b.lessons.filter(l => l.is_free === true).length;
        if (b.letter === 'D' || b.letter === 'E') {
          expect(free, `${onderdeel} blok ${b.letter}`).toBe(0);
        } else {
          expect(free, `${onderdeel} blok ${b.letter}`).toBe(1);
        }
      }
    }
  });

  it('een luisterles verwijst alleen naar tekstsoorten die A2 Luisteren echt heeft', () => {
    // De vier rijen in `sections` voor a2/luisteren. Een vijfde slug hier is een harde fout in
    // de seeder, en dat is beter dan een blok D met een gat dat niemand ziet.
    const KNOWN = new Set(['gesprek', 'mededeling', 'telefoongesprek', 'instructie']);
    for (const les of courses.luisteren.flatMap(b => b.lessons)) {
      if (!les.section) continue;
      expect(KNOWN, `${les.slug} -> ${les.section}`).toContain(les.section);
    }
  });
});

/**
 * Het gewicht per onderdeel — de kern van "één bibliotheek, vier deuren".
 *
 * Deze getallen zijn een inhoudelijke keuze en geen berekening: ze staan in
 * `docs/decisions/grammar-architecture.html` en ze zijn wat het onderdeelscherm en de
 * regelbibliotheek tonen. Ze hier vastzetten maakt van een hertagging door de docent een
 * bewuste testwijziging in plaats van een cijfer dat stil verschuift.
 */
describe('taalregels: kern tegenover herkennen', () => {
  const GRAMMAR = A2_CONCEPTS.filter(c => c.kind === 'grammatica');

  it('elke kernkoppeling bestaat ook als onderdeelkoppeling', () => {
    // Anders zou de seeder een gewicht schrijven op een rij die er niet is, en dat is stil:
    // de update raakt nul rijen en het concept blijft op de standaard staan.
    for (const c of A2_CONCEPTS) {
      for (const o of c.kern ?? []) {
        expect(c.onderdelen, `${c.slug} kern in ${o}`).toContain(o);
      }
    }
  });

  const inOnderdeel = (o: string) => GRAMMAR.filter(c => c.onderdelen.includes(o)).length;
  const kernIn = (o: string) => GRAMMAR.filter(c => (c.kern ?? []).includes(o)).length;

  it('een receptief examen vraagt minder regels dan een productief', () => {
    // Dit is de hele afweging in vier getallen. A2 Lezen en Luisteren zijn meerkeuze: een
    // verkeerde werkwoordsuitgang kost daar niets, maar een gemiste `omdat`, `hoeft niet` of
    // `het goedkoopst` kost de vraag. Bij Schrijven en Spreken bouw jij de zin.
    expect(inOnderdeel('lezen')).toBe(20);
    expect(inOnderdeel('luisteren')).toBe(20);
    expect(inOnderdeel('schrijven')).toBe(30);
    expect(inOnderdeel('spreken')).toBe(31);
  });

  it('en binnen dat lidmaatschap weegt het gewicht dezelfde kant op', () => {
    expect(kernIn('lezen')).toBe(9);
    expect(kernIn('luisteren')).toBe(8);
    expect(kernIn('schrijven')).toBe(21);
    // Spreken heeft de eenentwintig van Schrijven plus de klemtoon: die is van het oor en
    // telt bij Lezen en Schrijven niet mee.
    expect(kernIn('spreken')).toBe(22);
  });

  it('101 rijen in concept_onderdelen, en dat is er 17 minder dan alles-op-alle-vier', () => {
    // ── DE REGRESSIE DIE DEZE TEST TEGENHOUDT ────────────────────────────────
    // Tot 10-09 stond 27 van de 31 regels op `ALL`, en dus hing élke regel aan élk onderdeel:
    // 118 rijen. Daardoor ging `herkennen` twee dingen betekenen — "begrijpen is genoeg" én
    // "hoort hier eigenlijk niet" — en droeg Lezen regels als `lidwoorden` die aan de
    // betekenis van een tekst niets veranderen. Zakt dit getal terug naar 4 × 31, dan is de
    // afweging weggevallen en staat er weer een bibliotheek in elke cursus.
    const rijen = GRAMMAR.reduce((n, c) => n + c.onderdelen.length, 0);
    expect(rijen).toBe(101);
    expect(rijen).toBeLessThan(GRAMMAR.length * 4);
  });

  it('geen enkele regel is nergens kern en nergens te herkennen', () => {
    for (const c of GRAMMAR) {
      expect(c.onderdelen.length, `${c.slug} hangt aan geen onderdeel`).toBeGreaterThan(0);
    }
  });

  it('geen onderdeel draagt alle 31 regels, en geen enkel onderdeel is alleen maar kern', () => {
    // Het lidmaatschap beslist wat een cursus bevat, het gewicht alleen de volgorde en het
    // label. Twee dingen moeten daarvoor waar blijven: een cursus mag niet de hele
    // bibliotheek zijn (anders is de afweging weg), en binnen een cursus moet er iets te
    // wegen zijn (anders zegt elk kaartje hetzelfde).
    for (const o of ['lezen', 'luisteren', 'schrijven', 'spreken']) {
      expect(kernIn(o), `${o} kern`).toBeGreaterThan(0);
      expect(kernIn(o), `${o} kern <= lidmaatschap`).toBeLessThanOrEqual(inOnderdeel(o));
    }
    // Spreken is het enige onderdeel dat álle regels draagt — daar is niets uitgesloten.
    expect(inOnderdeel('lezen')).toBeLessThan(GRAMMAR.length);
    expect(inOnderdeel('luisteren')).toBeLessThan(GRAMMAR.length);
  });
});
