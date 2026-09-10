/**
 * De leseditor: de leegvorm per soort, en de samenvattingsregel.
 *
 * Twee dingen die alleen buiten de browser te pinnen zijn en die elk één keer echt fout zijn
 * gegaan:
 *
 *   1. **Een nieuw item van elke soort moet met precies één ontbrekend veld te maken zijn.** De
 *      leegvormen bevatten daarom de rijen die het schema minimaal eist (twee chips, twee paren);
 *      zonder die rijen is een nieuw item rood om iets wat de docent nog niet kón invullen. Deze
 *      test loopt alle veertien soorten af, zodat een nieuwe soort niet zonder leegvorm kan
 *      bestaan.
 *   2. **`itemSummary` mag geen enkele payload verkeerd lezen.** De eerste versie koos het veld met
 *      een object-literal, en JavaScript rekent daarin *alle* takken uit: de `woordorde`-tak deed
 *      `payload.answer.join(' ')` en liep daarmee ook op een `gap_type`, waar `answer` een string
 *      is. Dat was een 500 op de hele editor, voor één regel hulptekst.
 */

import { describe, it, expect } from 'vitest';
import { blankItem, validateDraft } from '@/lib/admin/lesson-write';
import { ITEM_KINDS, isExerciseKind } from '@/lib/lessons/items';
import { ITEM_FIELDS, KIND_LABEL, itemSummary } from '@/app/[locale]/(admin)/admin/lessen/[id]/_components/item-fields';

describe('blankItem', () => {
  it('geeft elke soort een leegvorm, een label en een veldenlijst', () => {
    for (const kind of ITEM_KINDS) {
      const draft = blankItem(kind, 1);
      expect(draft.kind, kind).toBe(kind);
      expect(KIND_LABEL[kind], kind).toBeTruthy();
      expect(ITEM_FIELDS[kind], kind).toBeTruthy();
      // Alleen een opgave heeft een trap, en dan altijd één — dezelfde regel als in de database.
      expect(draft.tier === null, kind).toBe(!isExerciseKind(kind));
    }
  });

  it('geeft een meerkeuzeopgave drie opties met één juist antwoord', () => {
    const mcq = blankItem('mcq', 1);
    expect(mcq.options).toHaveLength(3);
    expect(mcq.options.filter(o => o.is_correct)).toHaveLength(1);
  });

  it('geeft een soort zonder opties er ook geen', () => {
    expect(blankItem('gap_type', 1).options).toEqual([]);
    expect(blankItem('uitleg', 1).options).toEqual([]);
  });
});

describe('validateDraft', () => {
  it('keurt een lege nieuwe opgave af, en zegt waarom', () => {
    const problem = validateDraft(blankItem('gap_type', 1), 0);
    expect(problem).toMatch(/^Item 1: /);
  });

  it('keurt een ingevulde opgave goed', () => {
    const draft = blankItem('gap_choice', 1);
    draft.payload = { sentence: 'Hij woont ___ Amsterdam.', choices: ['in', 'op'], answer: 'in' };
    draft.explanation = 'Bij een plaatsnaam hoort "in".';
    expect(validateDraft(draft, 0)).toBeNull();
  });

  it('laat de lege staartrij van een lijst niet als fout doorkomen', () => {
    // De editor houdt onderaan elke lijst een lege rij aan om in te typen. Die mag bij het
    // opslaan geen lege string worden — anders is elk item met een lijst permanent ongeldig.
    const draft = blankItem('matchen', 1);
    draft.payload = {
      instruction: 'Zoek bij elkaar.',
      pairs: [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }, { left: '', right: '' }],
    };
    draft.explanation = 'Elk woord heeft één betekenis.';
    expect(validateDraft(draft, 0)).toBeNull();
  });
});

describe('itemSummary', () => {
  it('leest van elke soort het juiste veld, zonder te struikelen over een andere', () => {
    expect(itemSummary('gap_type', { sentence: 'Hij woont ___ Almere.', answer: 'in' }))
      .toBe('Hij woont ___ Almere.');
    expect(itemSummary('woordorde', { answer: ['ik', 'ben', 'ziek'] })).toBe('ik ben ziek');
    expect(itemSummary('leestekst', { title: 'Brief van de gemeente' })).toBe('Brief van de gemeente');
  });

  it('haalt de tags eruit en kapt af', () => {
    expect(itemSummary('uitleg', { body_html: 'Dit is <em>belangrijk</em>.' })).toBe('Dit is belangrijk.');
    expect(itemSummary('mcq', { prompt: 'a'.repeat(200) })).toHaveLength(109);
  });

  it('geeft een lege string als het veld nog niet bestaat', () => {
    for (const kind of ITEM_KINDS) {
      expect(itemSummary(kind, {}), kind).toBe('');
    }
  });
});
