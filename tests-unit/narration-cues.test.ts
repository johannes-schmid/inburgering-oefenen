import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseScript } from '../scripts/lesson-content/narration-script.mjs';
import { LESSON_VISUALS, stepCount } from '../data/lesson-visuals';
import { wordTimes } from '../scripts/lesson-content/narration-script.mjs';

/**
 * De cues van elk narratiescript, tegen wat er op de pagina bestaat.
 *
 * **Waarom dit een test is en niet een check in de generator.** Een cue die naar een element
 * wijst dat niet bestaat licht *niets* op: geen fout, geen log, alleen een opname die op zes van
 * de tien momenten iets aanwijst en op vier momenten niets. Dat is precies de soort stilte
 * waarin een typefout een jaar blijft zitten. De generator kan het niet zien — hij kent de
 * lesitems niet — maar een test kan het wel, want de stappen van een lesplaatje staan in
 * `data/lesson-visuals.ts` en zijn dus te tellen.
 *
 * Wat hier *niet* gecontroleerd wordt: of `card-0`, `card-1`, `demo-0` en `demo-1` bestaan. Die
 * staan in `lesson_items` in de database, en een unittest die een database nodig heeft is geen
 * unittest meer. Elke les in blok B heeft er twee van elk; klopt dat niet meer, dan is dat een
 * contentwijziging die in `/admin/lessen` zichtbaar is.
 */

const DIR = join(process.cwd(), 'scripts/lesson-content/narration');
const scripts = readdirSync(DIR).filter(f => f.endsWith('.txt'));

/** De ids die op elke lespagina bestaan, los van het lesplaatje. */
const ALWAYS = new Set(['rule', 'exercises', 'card-0', 'card-1', 'demo-0', 'demo-1']);

describe('de narratiescripts', () => {
  it('zijn er, en dat is de aanname onder de rest van dit bestand', () => {
    expect(scripts.length).toBeGreaterThan(0);
  });

  for (const file of scripts) {
    const slug = file.replace(/\.txt$/, '');
    const raw = readFileSync(join(DIR, file), 'utf8');
    const { text, cues } = parseScript(raw);

    describe(slug, () => {
      it('levert tekst voor de stem op', () => {
        expect(text.length).toBeGreaterThan(100);
      });

      /* Een script zonder markers is geldig voor de generator en waardeloos op de pagina: dan
         licht er nooit iets op en is de opname een audiobestand naast de tekst. */
      it('heeft cues', () => {
        expect(cues.length).toBeGreaterThan(0);
      });

      it('wijst alleen naar elementen die bestaan', () => {
        const visual = LESSON_VISUALS[slug];
        const steps = visual ? stepCount(visual) : 0;

        for (const cue of cues) {
          if (ALWAYS.has(cue.id)) continue;

          const m = /^vis(?:-(\d+))?$/.exec(cue.id);
          expect(m, `onbekend cue-id "${cue.id}" in ${file}`).not.toBeNull();
          expect(steps, `${slug} heeft een vis-cue maar geen lesplaatje`).toBeGreaterThan(0);

          if (m?.[1]) {
            const n = Number(m[1]);
            expect(n, `vis-${n} in ${file}, maar het plaatje heeft ${steps} stappen`)
              .toBeLessThanOrEqual(steps);
            expect(n).toBeGreaterThan(0);
          }
        }
      });

      /* De extra uitleg is de enige tekst op de pagina die niemand voorleest. Staat er per
         ongeluk een lege noot (`[[rule | ]]`), dan verschijnt er een leeg zandkleurig vakje. */
      it('heeft geen lege noten', () => {
        for (const cue of cues) {
          /* `parseScript` zet de sleutel altijd, met `undefined` als er geen noot staat —
             `'note' in cue` is dus geen bruikbare vraag. */
          if (cue.note !== undefined) expect(cue.note.trim().length).toBeGreaterThan(0);
        }
      });
    });
  }
});

describe('wordTimes', () => {
  it('houdt de interpunctie aan het woord', () => {
    const text = 'Hallo, daar.';
    const times = Array.from({ length: text.length }, (_, i) => i * 0.1);
    expect(wordTimes(text, times).map(w => w.w)).toEqual(['Hallo,', 'daar.']);
  });

  it('telt een lege regel als een nieuwe alinea', () => {
    const text = 'Een.\n\nTwee.';
    const times = Array.from({ length: text.length }, (_, i) => i * 0.1);
    expect(wordTimes(text, times).map(w => w.p)).toEqual([0, 1]);
  });

  /* Een tijd die terugloopt maakt een woord onbereikbaar voor de binaire zoek in de speler:
     die vindt dan het vorige woord en de markering slaat er één over. */
  it('loopt nooit terug in tijd', () => {
    const text = 'een twee drie';
    const words = wordTimes(text, [0, 0, 0, 9, 9, 9, 9, 1, 1, 1, 1, 1, 1]);
    const times = words.map(w => w.t);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  /* De alignment kan korter zijn dan onze string, want de API normaliseert tekst. Dan is de
     laatste bekende tijd het antwoord — geen exception, en geen NaN in de database. */
  it('valt terug op de laatste bekende tijd als de alignment te kort is', () => {
    const words = wordTimes('een twee drie', [0, 0.1, 0.2]);
    expect(words).toHaveLength(3);
    for (const w of words) expect(Number.isFinite(w.t)).toBe(true);
  });
});
