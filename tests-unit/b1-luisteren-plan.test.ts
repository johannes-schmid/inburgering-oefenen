/**
 * Het plan van B1 Luisteren, vastgelegd in een test.
 *
 * Niet omdat de rekensom moeilijk is, maar omdat hij stil fout kan gaan. Een regel van
 * `LUISTEREN_SPLITS` die per ongeluk op 38 uitkomt levert een examen dat overal werkt — de
 * seeder schrijft hem weg, de speler speelt hem af — en alleen `exam_publish_issues()` merkt
 * het, ná de audio. Hetzelfde geldt voor de casting: twee sprekers met dezelfde stem komt pas
 * naar buiten als `validateCast()` afgaat tijdens de TTS-run, met het gesprek al geschreven.
 *
 * Dat maakt een hertagging door de docent een bewuste testwijziging in plaats van een getal dat
 * verschuift — dezelfde afspraak als bij `lesson-syllabus.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import voices from '@/data/tts-voices.json';
// @ts-ignore — het plan is een .mjs zonder types, met opzet: het is authoring, geen runtime.
import { LUISTEREN_CAST, LUISTEREN_GENRES, LUISTEREN_SPLITS, LUISTEREN_TOPICS } from '@/scripts/b1-content/plan.mjs';
// @ts-ignore — idem.
import { FORMAT, LUISTEREN_SECTION_SLUGS } from '@/scripts/b1-content/rules.mjs';

const EXAMS = 10;
const splits = LUISTEREN_SPLITS as number[][];
const cast = LUISTEREN_CAST as string[][][];
const topics = LUISTEREN_TOPICS as string[][];
const genres = LUISTEREN_GENRES as { section: string; genre: string }[];
const V = voices as Record<string, { gender: string }>;

describe('B1 Luisteren — de zes gesprekken', () => {
  it('heeft zes slots met een bekende tekstsoort', () => {
    expect(genres).toHaveLength(FORMAT.luisteren.textCount);
    for (const g of genres) expect(LUISTEREN_SECTION_SLUGS).toContain(g.section);
  });

  it('heeft voor elk van de tien examens zes onderwerpen', () => {
    expect(topics).toHaveLength(EXAMS);
    for (const row of topics) expect(row).toHaveLength(6);
  });

  it('geeft geen onderwerp twee keer, ook niet tussen examens', () => {
    const all = topics.flat();
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('B1 Luisteren — de verdeling van de vragen', () => {
  it('telt in elk examen op tot 39', () => {
    expect(splits).toHaveLength(EXAMS);
    for (const row of splits) {
      expect(row).toHaveLength(6);
      expect(row.reduce((a, b) => a + b, 0)).toBe(FORMAT.luisteren.itemCount);
    }
  });

  it('houdt elk gesprek binnen 5 tot 9 fragmenten', () => {
    const [lo, hi] = FORMAT.luisteren.fragmentsPerText;
    for (const row of splits) {
      for (const n of row) {
        expect(n).toBeGreaterThanOrEqual(lo);
        expect(n).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('gebruikt niet tien keer dezelfde verdeling', () => {
    expect(new Set(splits.map(r => r.join(','))).size).toBeGreaterThan(1);
  });
});

/**
 * DUO zet dertien stemmen in per examen en hergebruikt geen spreker tussen de teksten. Wij
 * hebben er acht, dus hergebruik moet — maar niet toevallig. Dit zijn de drie regels die de
 * docblock van `LUISTEREN_CAST` belooft.
 */
describe('B1 Luisteren — de casting', () => {
  it('cast elk gesprek met twee verschillende, bestaande stemmen', () => {
    expect(cast).toHaveLength(EXAMS);
    for (const exam of cast) {
      expect(exam).toHaveLength(6);
      for (const [a, b] of exam) {
        expect(V[a]).toBeDefined();
        expect(V[b]).toBeDefined();
        expect(a).not.toBe(b);
      }
    }
  });

  it('gebruikt binnen één examen zes verschillende paren', () => {
    for (const exam of cast) {
      const pairs = exam.map(p => [...p].sort().join('+'));
      expect(new Set(pairs).size).toBe(6);
    }
  });

  it('zet geen stem in twee gesprekken die op elkaar volgen', () => {
    for (const exam of cast) {
      for (let i = 1; i < exam.length; i++) {
        const shared = exam[i].filter(s => exam[i - 1].includes(s));
        expect(shared).toEqual([]);
      }
    }
  });

  /** De verteller leest elk scenario voor; een personage spelen maakt haar geen verteller meer. */
  it('cast de verteller nooit als personage', () => {
    for (const exam of cast) {
      for (const key of exam.flat()) {
        expect((V[key] as { role?: string }).role).not.toBe('narrator');
      }
    }
  });

  it('gebruikt geen stem vaker dan twee keer per examen', () => {
    for (const exam of cast) {
      const count: Record<string, number> = {};
      for (const s of exam.flat()) count[s] = (count[s] ?? 0) + 1;
      for (const n of Object.values(count)) expect(n).toBeLessThanOrEqual(2);
    }
  });

  /** Een examen waarin elk gesprek man-vrouw is, is te makkelijk uit elkaar te houden. */
  it('heeft per examen één of twee paren van gelijk geslacht', () => {
    for (const exam of cast) {
      const same = exam.filter(([a, b]) => V[a].gender === V[b].gender).length;
      expect(same).toBeGreaterThanOrEqual(1);
      expect(same).toBeLessThanOrEqual(2);
    }
  });
});
