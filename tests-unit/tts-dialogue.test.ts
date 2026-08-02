import { describe, expect, it } from 'vitest';
import { buildDialogueInputs, parseScript, speakersInScript, validateCast } from '@/lib/tts-dialogue';
import { VOICES } from '@/lib/tts-voices';

describe('parseScript', () => {
  it('splits one turn per line', () => {
    const turns = parseScript('A: Goedemorgen.\nB: Dag meneer.');
    expect(turns).toEqual([
      { speaker: 'A', text: 'Goedemorgen.' },
      { speaker: 'B', text: 'Dag meneer.' },
    ]);
  });

  /**
   * The regression that shipped: every seeded exam script is stored as ONE paragraph with the
   * tags inline. Splitting on newlines alone read a two-hander as a single speaker, which the
   * casting editor then reported as "1 spreker" and would have generated in one voice.
   */
  it('splits inline speaker tags in a single paragraph', () => {
    const turns = parseScript('A: Goedemorgen. B: Dag, ik kom voor mijn paspoort. A: Momentje.');
    expect(turns.map(t => t.speaker)).toEqual(['A', 'B', 'A']);
    expect(turns[1].text).toBe('Dag, ik kom voor mijn paspoort.');
  });

  it('does not mistake a colon in prose for a speaker tag', () => {
    const turns = parseScript('A: Hij zei: kom maar langs.');
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe('Hij zei: kom maar langs.');
  });

  it('continues a wrapped line onto the previous turn', () => {
    const turns = parseScript('A: Dit is een lange zin\ndie doorloopt op de volgende regel.');
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe('Dit is een lange zin die doorloopt op de volgende regel.');
  });

  it('allows a multi-word label at the start of a line', () => {
    expect(speakersInScript('Mevrouw De Wit: Goedemiddag.')).toEqual(['Mevrouw De Wit']);
  });

  it('treats untagged leading prose as a single speaker', () => {
    expect(speakersInScript('Let op. De trein naar Utrecht vertrekt van spoor 5.')).toEqual(['A']);
  });

  it('ignores blank lines', () => {
    expect(parseScript('A: Een.\n\n\nB: Twee.')).toHaveLength(2);
  });
});

describe('validateCast', () => {
  it('refuses an uncast speaker rather than choosing a voice', () => {
    const r = validateCast('A: Hoi.\nB: Hoi.', { A: 'man_young' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Spreker B');
  });

  it('refuses an unknown voice key', () => {
    const r = validateCast('A: Hoi.', { A: 'robot' });
    expect(r.ok).toBe(false);
  });

  /** A dialogue in one voice is indistinguishable from a monologue. */
  it('refuses two speakers sharing a voice', () => {
    const r = validateCast('A: Hoi.\nB: Hoi.', { A: 'man_young', B: 'man_young' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('dezelfde stem');
  });

  it('allows a single speaker with one voice', () => {
    expect(validateCast('A: Omroep.', { A: 'woman_older' }).ok).toBe(true);
  });

  it('refuses an empty script', () => {
    expect(validateCast('   ', {}).ok).toBe(false);
  });

  it('accepts a fully cast dialogue', () => {
    const r = validateCast('A: Hoi.\nB: Hoi.', { A: 'man_young', B: 'woman_older' });
    expect(r.ok).toBe(true);
  });
});

describe('buildDialogueInputs', () => {
  it('maps every turn to its speaker voice id, in order', () => {
    const inputs = buildDialogueInputs('A: Een. B: Twee. A: Drie.', {
      A: 'man_young',
      B: 'woman_older',
    });
    expect(inputs.map(i => i.voice_id)).toEqual([
      VOICES.man_young.id,
      VOICES.woman_older.id,
      VOICES.man_young.id,
    ]);
    expect(inputs.map(i => i.text)).toEqual(['Een.', 'Twee.', 'Drie.']);
  });
});
