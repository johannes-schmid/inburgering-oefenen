/**
 * De item-soorten van een les.
 *
 * Wat hier gepind wordt zijn de regels die *tussen* de kolommen liggen en die geen enkel
 * payload-schema ziet: dat alleen een opgave een trap heeft, dat elke opgave uitlegt waarom
 * het antwoord goed is, en dat de vier "antwoord moet in de aangeboden keuzes zitten"-regels
 * echt sluiten. Elk daarvan is een fout die stil door de pijplijn zou glippen en pas op het
 * scherm van een kandidaat zichtbaar wordt — als een opgave zonder uitleg, of een gat waarvan
 * geen enkele chip het juiste antwoord is.
 */

import { describe, it, expect } from 'vitest';
import {
  ITEM_KINDS, EXERCISE_KINDS, PAYLOAD_SCHEMAS, GAP,
  isExerciseKind, tierBucket, normaliseTyped, matchesTyped,
  validateItem, validateItems,
} from '@/lib/lessons/items';

/** Een geldig item van elke soort, als vertrekpunt voor de tegenvoorbeelden. */
const mcq = {
  kind: 'mcq', sort_order: 1, tier: 0,
  payload: { prompt: 'Wat staat er in de brief?', layout: 'text' },
  explanation: 'In de brief staat het letterlijk.',
  options: [
    { label: 'A', body: 'fout', image_urls: [], is_correct: false, sort_order: 1 },
    { label: 'B', body: 'goed', image_urls: [], is_correct: true, sort_order: 2 },
    { label: 'C', body: 'fout', image_urls: [], is_correct: false, sort_order: 3 },
  ],
};

const uitleg = {
  kind: 'uitleg', sort_order: 0, tier: null,
  payload: { body_html: '<p>Na <strong>omdat</strong> gaat het werkwoord naar achteren.</p>' },
  explanation: null, options: [],
};

const ok = (item: unknown) => validateItem(item, 0);
const messages = (item: unknown) => ok(item).map(i => i.message).join(' | ');

describe('de soorten', () => {
  it('elke soort heeft een payload-schema, en elk schema hoort bij een soort', () => {
    // Anders rendert een item stil als niets, of bestaat er een schema dat nooit wordt
    // gebruikt en dus ook nooit meegroeit.
    expect(Object.keys(PAYLOAD_SCHEMAS).sort()).toEqual([...ITEM_KINDS].sort());
  });

  it('elke opgavesoort is ook een soort', () => {
    for (const k of EXERCISE_KINDS) expect(ITEM_KINDS).toContain(k);
  });

  it('uitleg en materiaal zijn geen opgaven', () => {
    for (const k of ['uitleg', 'voorbeeld', 'leestekst', 'audio', 'video', 'woordenlijst', 'zinnenbank']) {
      expect(isExerciseKind(k)).toBe(false);
    }
  });
});

describe('de trap', () => {
  it('trap 1 telt als productief, niet als receptief', () => {
    // Trap 1 vraagt de kandidaat iets te máken, met steun. Hem bij receptief tellen zou het
    // cijfer dat "je kunt dit zelf" moet betekenen laten stijgen van halve opgaven.
    expect(tierBucket(0)).toBe('receptief');
    expect(tierBucket(1)).toBe('productief');
    expect(tierBucket(2)).toBe('productief');
  });

  it('een opgave zonder trap wordt geweigerd', () => {
    expect(messages({ ...mcq, tier: null })).toMatch(/tier/);
  });

  it('een uitlegblok met een trap wordt geweigerd', () => {
    // Zou meetellen in de beheersing van een concept zonder ooit iets gevraagd te hebben.
    expect(messages({ ...uitleg, tier: 0 })).toMatch(/alleen een opgave heeft een tier/);
  });
});

describe('elke opgave legt uit waarom het antwoord goed is', () => {
  it('geen explanation is een fout', () => {
    expect(messages({ ...mcq, explanation: null })).toMatch(/explanation/);
    expect(messages({ ...mcq, explanation: '   ' })).toMatch(/explanation/);
  });

  it('een uitlegblok hoeft er geen te hebben', () => {
    expect(ok(uitleg)).toEqual([]);
  });
});

describe('mcq spiegelt question_options', () => {
  it('drie of vier opties, niet twee en niet vijf', () => {
    expect(messages({ ...mcq, options: mcq.options.slice(0, 2) })).toMatch(/3 of 4 opties/);
    expect(messages({
      ...mcq,
      options: [...mcq.options, { label: 'D', body: 'x', image_urls: [], is_correct: false, sort_order: 4 }],
    })).toBe('');
  });

  it('precies één juist antwoord', () => {
    const twoRight = mcq.options.map(o => ({ ...o, is_correct: true }));
    expect(messages({ ...mcq, options: twoRight })).toMatch(/precies één juist antwoord/);
    const noneRight = mcq.options.map(o => ({ ...o, is_correct: false }));
    expect(messages({ ...mcq, options: noneRight })).toMatch(/precies één juist antwoord/);
  });

  it('een niet-mcq draagt geen optierijen', () => {
    // Een gap_choice met optierijen zou half in de payload en half in een tabel staan.
    expect(messages({
      kind: 'gap_choice', sort_order: 1, tier: 1,
      payload: { sentence: `Ik ga ${GAP} werken.`, choices: ['om', 'te'], answer: 'om' },
      explanation: 'x', options: mcq.options,
    })).toMatch(/draagt geen optierijen/);
  });
});

describe('een gat is precies één gat', () => {
  const base = { kind: 'gap_choice', sort_order: 1, tier: 1, explanation: 'x', options: [] };

  it('geen gat wordt geweigerd', () => {
    expect(messages({ ...base, payload: { sentence: 'Ik ga werken.', choices: ['om', 'te'], answer: 'om' } }))
      .toMatch(/precies één gat/);
  });

  it('twee gaten worden geweigerd', () => {
    // Twee gaten met één antwoord is een opgave die niet na te kijken is.
    expect(messages({ ...base, payload: { sentence: `Ik ${GAP} ga ${GAP} werken.`, choices: ['om', 'te'], answer: 'om' } }))
      .toMatch(/precies één gat/);
  });
});

describe('het juiste antwoord moet bereikbaar zijn', () => {
  it('gap_choice: het antwoord staat tussen de chips', () => {
    // Dit is de opgave waar geen enkele keuze goed is — hij ziet er volstrekt normaal uit.
    expect(messages({
      kind: 'gap_choice', sort_order: 1, tier: 1, explanation: 'x', options: [],
      payload: { sentence: `Ik ga ${GAP} werken.`, choices: ['te', 'voor', 'dat'], answer: 'om' },
    })).toMatch(/één van de aangeboden chips/);
  });

  it('woordorde: het antwoord gebruikt dezelfde woorden als de tokens', () => {
    expect(messages({
      kind: 'woordorde', sort_order: 1, tier: 2, explanation: 'x', options: [],
      payload: { tokens: ['ik', 'ben', 'ziek'], answer: ['ik', 'was', 'ziek'] },
    })).toMatch(/dezelfde tokens/);

    expect(messages({
      kind: 'woordorde', sort_order: 1, tier: 2, explanation: 'x', options: [],
      payload: { tokens: ['omdat', 'ik', 'ziek', 'ben'], answer: ['omdat', 'ik', 'ben', 'ziek'] },
    })).toBe('');
  });
});

describe('geen actieve inhoud in lescontent', () => {
  it('een script-tag wordt geweigerd', () => {
    expect(messages({ ...uitleg, payload: { body_html: '<p>x</p><script>alert(1)</script>' } }))
      .toMatch(/script/);
  });
});

describe('de les als geheel', () => {
  it('twee items op dezelfde plek is een fout', () => {
    const issues = validateItems([uitleg, { ...mcq, sort_order: 0 }]);
    expect(issues.map(i => i.message).join(' | ')).toMatch(/dezelfde sort_order/);
  });

  it('een les zonder opgave is geen les', () => {
    // Dit is precies wat deze laag toevoegt aan de gidsen die er al zijn: oefenen staat in
    // dezelfde stroom als de uitleg. Een les met alleen uitleg is een gids.
    const issues = validateItems([uitleg]);
    expect(issues.map(i => i.message).join(' | ')).toMatch(/minstens één opgave/);
  });

  it('uitleg plus opgave is in orde', () => {
    expect(validateItems([uitleg, mcq])).toEqual([]);
  });
});

describe('nakijken van een getypt antwoord', () => {
  it('hoofdletters, accenten, slotpunctuatie en dubbele spaties maken niet uit', () => {
    // Een A2-kandidaat die "Omdat hij ziek is." typt heeft het goed; de opgave gaat niet over
    // hoofdletters, en hem daarop laten struikelen laat een correcte les kapot voelen.
    expect(matchesTyped('Omdat hij ziek is.', 'omdat hij ziek is')).toBe(true);
    expect(matchesTyped('  omdat   hij ziek is  ', 'omdat hij ziek is')).toBe(true);
    expect(normaliseTyped('café')).toBe('cafe');
  });

  it('de kromme apostrof geldt als de rechte', () => {
    expect(matchesTyped('z’n', "z'n")).toBe(true);
  });

  it('een variant in accept is ook goed', () => {
    expect(matchesTyped('zijn', "z'n", ['zijn'])).toBe(true);
  });

  it('leeg is nooit goed', () => {
    // Anders zou een lege invoer met een leeg verwacht antwoord "goed" opleveren.
    expect(matchesTyped('', '')).toBe(false);
    expect(matchesTyped('   ', 'omdat')).toBe(false);
  });

  it('een ander antwoord is fout', () => {
    expect(matchesTyped('want', 'omdat')).toBe(false);
  });
});
