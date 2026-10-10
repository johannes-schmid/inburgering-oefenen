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
import {
  A2_GROUPS, A2_CONCEPTS, conceptsFor, rulesHomeConcepts, RULES_WITHOUT_LESSON,
} from '../scripts/lesson-content/concepts-a2.mjs';
import {
  coursePlan, wordThemes, BLOCK_C_SECTIONS, STRATEGY_CONCEPTS, BUILT, BUILDABLE, B1_RULES_HOME_ONLY,
  conceptLibrary, strategyConcepts,
} from '../scripts/lesson-content/plan.mjs';
import { B1_GROUPS, B1_CONCEPTS } from '../scripts/lesson-content/concepts-b1.mjs';
import { GRAMMAR_SYLLABUS, parseLessonRef } from '@/data/grammar-syllabus';

type Concept = {
  slug: string; name_nl: string; group: string; kind: string;
  onderdelen: string[]; sort_order: number; one_liner: string; example_html?: string;
};

const CONCEPTS = A2_CONCEPTS as Concept[];
const GROUPS = A2_GROUPS as { slug: string; name_nl: string; sort_order: number }[];
const ONDERDELEN = ['lezen', 'luisteren', 'schrijven', 'spreken'];

describe('de A2-conceptenbibliotheek', () => {
  it('heeft 39 concepten in 6 groepen', () => {
    // Het aantal is een beslissing (eigenaar, 27-08): de 46 boekingangen zijn teruggebracht tot
    // 31 door de negen `Herhaling:`-passages een tweede oefenronde te maken in plaats van een
    // tweede rij. In oktober 2026 kwamen er acht bij uit de grammaticasyllabus van de eigenaar
    // (`data/grammar-syllabus.ts`). Verandert dit getal, dan is dat een inhoudelijke keuze en
    // geen ongelukje.
    expect(CONCEPTS).toHaveLength(39);
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
    // B1 is niet A2 met zwaardere voorbeelden: cross-niveau-besmetting is de stilste fout in
    // dit systeem. Sinds oktober 2026 heeft B1 een eigen bibliotheek (`concepts-b1.mjs`), maar
    // alleen voor het regelhuis: b1:lezen geeft blok B en niets anders, de andere drie
    // B1-onderdelen hebben geen cursusopbouw en blijven luid falen.
    const b1 = coursePlan('b1', 'lezen') as { letter: string }[];
    expect(b1.map(b => b.letter)).toEqual(['B']);
    expect(() => coursePlan('b1', 'luisteren')).toThrow(/eigen conceptenbibliotheek/);
    expect(() => coursePlan('b1', 'schrijven')).toThrow(/eigen conceptenbibliotheek/);
    expect(() => coursePlan('b1', 'spreken')).toThrow(/eigen conceptenbibliotheek/);
  });

  it('BUILT noemt alleen wat echt is uitgewerkt', () => {
    // `BUILT` betekent "hele cursus" en blijft A2; het B1-regelhuis staat apart, zodat
    // `tag-questions.mjs` (dat op `BUILT` leest) geen B1-examenvragen met A2-concepten tagt.
    expect(BUILT).toEqual(['a2:lezen', 'a2:luisteren', 'a2:schrijven', 'a2:spreken']);
    expect(B1_RULES_HOME_ONLY).toEqual(['b1:lezen']);
    expect(BUILDABLE).toEqual([...BUILT, ...B1_RULES_HOME_ONLY]);
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
    lezen: 62, luisteren: 26, schrijven: 24, spreken: 26,
  };

  it('elke cursus heeft de afgesproken omvang', () => {
    // De getallen komen uit docs/decisions/leerlaag-a2-master-plan.html en zijn een
    // inhoudelijke afspraak: 76 nieuwe lessen naast de 53 die er al stonden. Lezen ging in
    // oktober 2026 naar 62: negen regellessen (b29–b37) voor de grammaticasyllabus. Verandert er
    // één, dan is dat een besluit en geen ongelukje.
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
    // Oktober 2026: +6 Lezen, +3 Luisteren, +3 Schrijven, +3 Spreken — precies de cursussen
    // die in `data/grammar-syllabus.ts` naar de nieuwe lessen wijzen.
    expect(inOnderdeel('lezen')).toBe(26);
    expect(inOnderdeel('luisteren')).toBe(23);
    expect(inOnderdeel('schrijven')).toBe(33);
    expect(inOnderdeel('spreken')).toBe(34);
  });

  it('en binnen dat lidmaatschap weegt het gewicht dezelfde kant op', () => {
    expect(kernIn('lezen')).toBe(14);
    expect(kernIn('luisteren')).toBe(11);
    expect(kernIn('schrijven')).toBe(24);
    // Spreken heeft de kern van Schrijven min `verwijswoorden`, plus de klemtoon (van het oor)
    // en `er-is-er-zijn` (alleen Spreken vraagt erom).
    expect(kernIn('spreken')).toBe(25);
  });

  it('116 rijen in concept_onderdelen, en ruim minder dan alles-op-alle-vier', () => {
    // ── DE REGRESSIE DIE DEZE TEST TEGENHOUDT ────────────────────────────────
    // Tot 10-09 stond 27 van de 31 regels op `ALL`, en dus hing élke regel aan élk onderdeel:
    // 118 rijen. Daardoor ging `herkennen` twee dingen betekenen — "begrijpen is genoeg" én
    // "hoort hier eigenlijk niet" — en droeg Lezen regels als `lidwoorden` die aan de
    // betekenis van een tekst niets veranderen. Zakt dit getal terug naar 4 × 31, dan is de
    // afweging weggevallen en staat er weer een bibliotheek in elke cursus. 101 werd 116 met de
    // acht regels van oktober 2026 (15 koppelingen, tegen 32 als ze op alle vier stonden).
    const rijen = GRAMMAR.reduce((n, c) => n + c.onderdelen.length, 0);
    expect(rijen).toBe(116);
    expect(rijen).toBeLessThan(GRAMMAR.length * 4);
  });

  it('geen enkele regel is nergens kern en nergens te herkennen', () => {
    for (const c of GRAMMAR) {
      expect(c.onderdelen.length, `${c.slug} hangt aan geen onderdeel`).toBeGreaterThan(0);
    }
  });

  it('geen onderdeel draagt alle regels, en geen enkel onderdeel is alleen maar kern', () => {
    // Het lidmaatschap beslist wat een cursus bevat, het gewicht alleen de volgorde en het
    // label. Twee dingen moeten daarvoor waar blijven: een cursus mag niet de hele
    // bibliotheek zijn (anders is de afweging weg), en binnen een cursus moet er iets te
    // wegen zijn (anders zegt elk kaartje hetzelfde).
    for (const o of ['lezen', 'luisteren', 'schrijven', 'spreken']) {
      expect(kernIn(o), `${o} kern`).toBeGreaterThan(0);
      expect(kernIn(o), `${o} kern <= lidmaatschap`).toBeLessThanOrEqual(inOnderdeel(o));
    }
    // Sinds oktober 2026 draagt ook Spreken niet meer alles: `betrekkelijk-vnw` en
    // `hoeveelheden` vraagt dat examen niet.
    for (const o of ONDERDELEN) expect(inOnderdeel(o), o).toBeLessThan(GRAMMAR.length);
  });
});

/**
 * Het A2-regelhuis (a2, lezen, B) en de grammaticasyllabus van oktober 2026.
 *
 * Twee dingen die stil fout gaan. Eén: een `a2:lezen:`-verwijzing in `data/grammar-syllabus.ts`
 * zonder les is een onderwerp dat in het portaal naar niets wijst. Twee: de slugs b1–b28
 * dragen voortgang, `review_status`, narratie en lesplaatjes; een nieuw concept middenin de
 * bibliotheek mocht ze vroeger stil hernummeren. Nu komt het nummer uit `RULES_HOME_ORDER`.
 */
describe('het A2-regelhuis', () => {
  type A2Concept = Concept & { kern?: string[] };
  const A2 = A2_CONCEPTS as A2Concept[];
  const blokB = (coursePlan('a2', 'lezen') as {
    letter: string; lessons: { slug: string; concept?: string }[];
  }[]).find(b => b.letter === 'B')!;

  const a2Refs = Object.entries(GRAMMAR_SYLLABUS.a2).flatMap(([onderdeel, topics]) =>
    topics.flatMap(t => t.lessons.map(ref => ({ onderdeel, ref }))));
  const homeRefs = a2Refs.filter(r => r.ref.startsWith('a2:lezen:b'));

  it('elke a2:lezen-verwijzing in de syllabus heeft een les in blok B', () => {
    const slugs = new Set(blokB.lessons.map(l => l.slug));
    expect(homeRefs.length).toBeGreaterThan(0);
    for (const { ref } of homeRefs) {
      expect(slugs.has(parseLessonRef(ref).slug), `${ref} heeft geen les`).toBe(true);
    }
  });

  it('b1–b28 houden hun slug, en b29–b37 staan in de volgorde van de syllabus', () => {
    const LEGACY = [
      'hoofdzin-woordorde', 'inversie', 'voegwoorden-hoofdzin', 'bijzin-omdat-als', 'bijzin-dat-of',
      'om-te', 'vragen-maken', 'tegenwoordige-tijd', 'onregelmatige-tegenwoordige-tijd',
      'perfectum-regelmatig', 'perfectum-onregelmatig', 'hebben-of-zijn', 'verleden-tijd',
      'toekomende-tijd', 'gebiedende-wijs', 'scheidbare-werkwoorden', 'werkwoorden-zonder-ge',
      'modale-werkwoorden', 'wederkerende-werkwoorden', 'vaste-voorzetsels', 'lidwoorden',
      'meervoud', 'vergrotende-trap', 'overtreffende-trap', 'persoonlijk-vnw-onderwerp',
      'persoonlijk-vnw-lijdend', 'voorzetsels-plaats', 'frequentie',
    ];
    const NEW = [
      'verwijswoorden', 'ontkenning', 'hoeveelheden', 'tijdsaanduidingen', 'betrekkelijk-vnw',
      'lijdende-vorm', 'bezittelijk-vnw', 'er-is-er-zijn', 'bijvoeglijk-naamwoord',
    ];
    expect(blokB.lessons.map(l => l.slug)).toEqual(
      [...LEGACY, ...NEW].map((c, i) => `b${i + 1}-${c}`));
    expect(RULES_WITHOUT_LESSON).toEqual(['klemtoon', 'lange-korte-klank']);
  });

  it('de acht nieuwe regels staan precies in de cursussen die naar hun les wijzen', () => {
    // De oudere 31 zijn op 10-09 per examenvorm afgewogen en volgen de syllabus niet één op
    // één; voor de acht van oktober 2026 ís de syllabus de afweging.
    const NEW = ['verwijswoorden', 'ontkenning', 'hoeveelheden', 'tijdsaanduidingen',
      'betrekkelijk-vnw', 'lijdende-vorm', 'bezittelijk-vnw', 'er-is-er-zijn'];
    for (const slug of NEW) {
      const c = A2.find(x => x.slug === slug)!;
      const lesSlug = blokB.lessons.find(l => l.concept === slug)!.slug;
      const fromSyllabus = [...new Set(homeRefs
        .filter(r => parseLessonRef(r.ref).slug === lesSlug)
        .map(r => r.onderdeel))].sort();
      expect([...c.onderdelen].sort(), slug).toEqual(fromSyllabus);
    }
  });
});

/**
 * Het B1-regelhuis (b1, lezen, B): 24 lessen uit `concepts-b1.mjs`, waar de B1-onderwerpen van
 * `data/grammar-syllabus.ts` naar wijzen.
 *
 * De syllabus is TypeScript en de scripts zijn `.mjs`, dus ze kunnen elkaar niet importeren;
 * deze test is de brug. Een verwijzing in de syllabus zonder les is een onderwerp dat in het
 * portaal naar niets wijst — er faalt niets, er staat alleen een lege plek.
 */
describe('het B1-regelhuis', () => {
  type B1Concept = Concept & { kern: string[]; lesson_note?: string };
  const B1 = B1_CONCEPTS as B1Concept[];
  const blocks = coursePlan('b1', 'lezen') as {
    letter: string; lessons: { slug: string; kind: string; concept?: string; is_free?: boolean }[];
  }[];
  const lessons = blocks[0].lessons;

  const b1Refs = Object.entries(GRAMMAR_SYLLABUS.b1).flatMap(([onderdeel, topics]) =>
    topics.flatMap(t => t.lessons.map(ref => ({ onderdeel, ref }))));
  const homeRefs = b1Refs.filter(r => r.ref.startsWith('b1:lezen:'));

  it('elke b1:lezen-verwijzing in de syllabus heeft een les in het B1-plan', () => {
    const slugs = new Set(lessons.map(l => l.slug));
    expect(homeRefs.length).toBeGreaterThan(0);
    for (const { ref } of homeRefs) {
      expect(slugs.has(parseLessonRef(ref).slug), `${ref} heeft geen les`).toBe(true);
    }
  });

  it('is precies blok B met 24 grammaticalessen, b1 … b24, en elke les wordt gebruikt', () => {
    expect(blocks.map(b => b.letter)).toEqual(['B']);
    expect(lessons).toHaveLength(24);
    lessons.forEach((l, i) => {
      expect(l.kind).toBe('grammatica');
      expect(l.slug).toBe(`b${i + 1}-${l.concept}`);
    });
    const referenced = new Set(homeRefs.map(r => parseLessonRef(r.ref).slug));
    for (const l of lessons) expect(referenced.has(l.slug), `${l.slug} wordt nergens gebruikt`).toBe(true);
  });

  it('onderdelen per concept zijn precies de B1-cursussen die naar de les wijzen', () => {
    for (const l of lessons) {
      const c = B1.find(x => x.slug === l.concept)!;
      const fromSyllabus = [...new Set(homeRefs
        .filter(r => parseLessonRef(r.ref).slug === l.slug)
        .map(r => r.onderdeel))].sort();
      expect([...c.onderdelen].sort(), c.slug).toEqual(fromSyllabus);
    }
  });

  it('elk concept heeft een groep, een lesnotitie en kern binnen zijn onderdelen', () => {
    const groups = new Set((B1_GROUPS as { slug: string }[]).map(g => g.slug));
    for (const c of B1) {
      expect(groups.has(c.group), `${c.slug}: groep ${c.group}`).toBe(true);
      expect(c.lesson_note?.trim(), `${c.slug}: lesson_note`).toBeTruthy();
      expect(c.example_html).toMatch(/<mark>/);
      for (const o of c.kern) expect(c.onderdelen, `${c.slug} kern ${o}`).toContain(o);
    }
  });

  it('een B1-run leest nooit de A2-bibliotheek of de A2-strategieën', () => {
    expect(conceptLibrary('b1').concepts).toBe(B1_CONCEPTS);
    expect(conceptLibrary('a2').concepts).toBe(A2_CONCEPTS);
    expect(strategyConcepts('b1', 'lezen')).toEqual([]);
    expect(() => conceptLibrary('b2')).toThrow();
  });

  it('precies één gratis les', () => {
    expect(lessons.filter(l => l.is_free).map(l => l.slug)).toEqual(['b1-er-daar-waar']);
  });
});
