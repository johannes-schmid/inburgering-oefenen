import { describe, expect, it } from 'vitest';
import {
  SPEECH_WPM,
  countSentences,
  countWords,
  estimateSeconds,
  lengthTarget,
  measure,
  sentenceTarget,
  stripHtml,
  stripSpeakers,
  targetSentence,
} from '@/lib/admin/length-targets';
import { LEVELS, formatRules } from '@/data/skills';

/**
 * The meter is advisory, which is exactly why its arithmetic has to be right: a docent who sees
 * "± 12 sec" on a fragment that renders at 45 will stop trusting the number, and then the one
 * target here that *is* measured (the audio band off DUO's material) stops working too.
 */
describe('counting', () => {
  it('does not glue words together across block tags', () => {
    // The bug this pins: a naive tag-strip turns "…afval.</p><p>De gemeente…" into "afval.De",
    // which is one word instead of two and shortens every multi-paragraph text.
    expect(countWords(stripHtml('<p>Nieuwe regels voor afval.</p><p>De gemeente haalt op.</p>'))).toBe(8);
    // The naive version, for contrast: "afval.De" collapses two words into one.
    expect(countWords('<p>Nieuwe regels voor afval.</p><p>De gemeente haalt op.</p>'.replace(/<[^>]*>/g, ''))).toBe(7);
  });

  it('reads entities and self-closing breaks as whitespace', () => {
    expect(stripHtml('<p>een<br/>twee&nbsp;drie</p>')).toBe('een twee drie');
  });

  it('counts an unfinished sentence as one, not zero', () => {
    // `perSentence` divides by this. Zero would make the average sentence length infinite on
    // every field the docent is still halfway through typing.
    expect(countSentences('Waar haalt u de oranje zakken')).toBe(1);
    expect(countSentences('')).toBe(0);
  });

  it('counts sentences across all three terminators', () => {
    expect(countSentences('Eén. Twee! Drie? Vier.')).toBe(4);
  });

  it('times speech without the speaker labels', () => {
    // "A: " is direction for the generator, never spoken — timing it inflates every dialogue.
    expect(stripSpeakers('A: Goedemorgen.\nB: Dag.')).toBe('Goedemorgen. Dag.');
    expect(countWords(stripSpeakers('Mevrouw De Wit: Goedemorgen.'))).toBe(1);
  });

  it('estimates seconds at the measured generation rate', () => {
    const script = Array.from({ length: SPEECH_WPM }, () => 'woord').join(' ');
    expect(estimateSeconds(script)).toBe(60);
  });
});

describe('targets', () => {
  it('takes the script band from the format, not from a guideline', () => {
    // A2 Luisteren is the one worked-out pair (40–50s off DUO's material), so this must be
    // `format`; anything else means the meter is quoting an invented number as a measured one.
    const target = lengthTarget('a2', 'script', 'luisteren');
    expect(target).toEqual({ unit: 'seconden', min: 40, max: 50, source: 'format' });
    expect(target).toEqual(
      expect.objectContaining({ min: formatRules('a2', 'luisteren').audioSeconds![0] })
    );
  });

  it('has no script target where the audio band is unverified', () => {
    // NULL means unverified and the check is skipped — same convention as `exam_publish_issues()`.
    expect(lengthTarget('a2', 'script', 'lezen')).toBeNull();
    expect(lengthTarget('b1', 'script', 'luisteren')).toBeNull();
  });

  it('labels every non-audio target as an own guideline', () => {
    for (const level of LEVELS) {
      for (const field of ['stimulus_text', 'prompt', 'explanation', 'option'] as const) {
        expect(lengthTarget(level, field)?.source).toBe('richtlijn');
      }
    }
  });

  it('is satisfiable at every level: min below max, and B1 never below A2', () => {
    for (const field of ['stimulus_text', 'explanation', 'model_answer', 'task_prompt'] as const) {
      const a2 = lengthTarget('a2', field)!;
      const b1 = lengthTarget('b1', field)!;
      expect(a2.min).toBeLessThan(a2.max);
      expect(b1.min).toBeLessThan(b1.max);
      // B1 is the higher level; a shorter target there would be the level plumbing wired backwards.
      expect(b1.max).toBeGreaterThanOrEqual(a2.max);
    }
  });

  it('keeps the sentence rule the level register already states', () => {
    expect(sentenceTarget('a2')).toBe(12);
    expect(sentenceTarget('b1')).toBe(18);
  });
});

describe('measure', () => {
  it('reports no status on an empty field', () => {
    // Otherwise every field is flagged "too short" the moment the drawer opens.
    const r = measure('', 'a2', 'stimulus_text');
    expect(r.status).toBeNull();
    expect(r.words).toBe(0);
  });

  it('compares a script in seconds and prose in words', () => {
    const script = Array.from({ length: 110 }, () => 'woord').join(' ');
    const scriptReading = measure(script, 'a2', 'script', 'luisteren');
    expect(scriptReading.value).toBe(scriptReading.seconds);
    expect(scriptReading.status).toBe('ok');

    const prose = measure(Array.from({ length: 90 }, () => 'woord').join(' '), 'a2', 'stimulus_text');
    expect(prose.value).toBe(90);
    expect(prose.status).toBe('ok');
  });

  it('flags under and over against the band', () => {
    expect(measure('kort verhaal hier', 'a2', 'stimulus_text').status).toBe('under');
    const long = Array.from({ length: 400 }, () => 'woord').join(' ');
    expect(measure(long, 'a2', 'stimulus_text').status).toBe('over');
  });

  it('says nothing at all where there is no target', () => {
    const r = measure('A: Hallo.', 'a2', 'script', 'lezen');
    expect(r.target).toBeNull();
    expect(r.status).toBeNull();
    expect(targetSentence(r.target)).toBeNull();
  });
});
