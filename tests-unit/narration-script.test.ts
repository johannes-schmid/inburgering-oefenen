import { describe, expect, it } from 'vitest';
import { parseScript, timeCues } from '../scripts/lesson-content/narration-script.mjs';

describe('parseScript', () => {
  it('haalt commentaar en markers uit de tekst die de stem krijgt', () => {
    const { text } = parseScript('# een noot\n[[rule]]\nHallo.\n');
    expect(text).toBe('Hallo.');
  });

  /* Dit is de hele reden dat markers werken: het offset moet in de *schone* tekst staan, want
     dat is wat ElevenLabs ziet. Meten in het ruwe bestand zou elke cue te laat zetten, en de
     fout groeit met elke marker ervóór. */
  it('meet het offset in de schone tekst, niet in het bestand', () => {
    const { text, cues } = parseScript('Een. [[rule]]Twee.');
    expect(text).toBe('Een. Twee.');
    expect(cues[0].offset).toBe(5);
    expect(text.slice(cues[0].offset)).toBe('Twee.');
  });

  it('leest de extra uitleg achter de pijp', () => {
    const { cues } = parseScript('[[card-0 | Let op dit stukje. ]]Tekst.');
    expect(cues[0]).toMatchObject({ id: 'card-0', note: 'Let op dit stukje.' });
  });

  it('laat note weg als er niets achter de pijp staat', () => {
    expect(parseScript('[[exercises]]Tekst.').cues[0].note).toBeUndefined();
  });

  it('houdt de alinea-indeling heel waar een marker op zijn eigen regel stond', () => {
    const { text, cues } = parseScript('Een.\n\n[[rule]]\nTwee.');
    // Geen drie newlines achter elkaar: die zou de stem als een extra pauze voorlezen.
    expect(text).not.toMatch(/\n{3}/);
    expect(text.slice(cues[0].offset).trimStart()).toBe('Twee.');
  });

  it('vindt meerdere cues met hetzelfde id — de regel wordt drie keer besproken', () => {
    const { cues } = parseScript('[[rule]]A. [[card-0]]B. [[rule]]C.');
    expect(cues.map((c: { id: string }) => c.id)).toEqual(['rule', 'card-0', 'rule']);
  });
});

describe('timeCues', () => {
  const starts = Array.from({ length: 20 }, (_, i) => i * 0.5);

  it('leest de tijd van het teken op het offset', () => {
    expect(timeCues([{ id: 'rule', offset: 4 }], starts)).toEqual([{ id: 'rule', at: 2 }]);
  });

  /* De API normaliseert tekst en kan tekens toevoegen of weglaten, dus een offset kan buiten de
     array vallen. Eén cue een seconde te vroeg is beter dan een exception die de hele opname
     weggooit — de audio is dan al gegenereerd en betaald. */
  it('valt terug op de laatste bekende tijd bij een offset buiten de alignment', () => {
    expect(timeCues([{ id: 'x', offset: 999 }], starts)[0].at).toBe(9.5);
  });

  it('geeft nulseconden als er geen alignment is, in plaats van te knallen', () => {
    expect(timeCues([{ id: 'x', offset: 3 }], undefined)).toEqual([{ id: 'x', at: 0 }]);
  });

  it('sorteert op tijd — de speler loopt ze op tijd af', () => {
    const out = timeCues([{ id: 'b', offset: 10 }, { id: 'a', offset: 2 }], starts);
    expect(out.map((c: { id: string }) => c.id)).toEqual(['a', 'b']);
  });
});
