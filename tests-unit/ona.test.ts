import { describe, expect, it } from 'vitest';
import { MODULE_PRICE_CENTS, MODULES, parseSelection, priceForSelection } from '@/lib/pricing';
import { modulesFromMetadata, normaliseModule, ownsKnm, ownsOna } from '@/lib/entitlements';
import { ONA_CARDS, ONA_FREE_CARD, getOnaCard } from '@/data/ona/cards';
import { ONA_GESPREK_BANK, ONA_GESPREK_STATUS } from '@/data/ona/eindgesprek';
import { canOpenOnaCard, canStartOnaPractice, isOnaAvailable, isOnaReviewed } from '@/lib/ona/access';
import {
  cardProgress, duoCheck, keepFlag, nextCardNo, sanitiseAnswers, sanitiseEvidence, type OnaEntry,
} from '@/lib/ona/rules';

/** Metadata zoals Supabase hem geeft: los getypeerd, dus hier ook. */
const m = (o: Record<string, unknown>) => o as Parameters<typeof ownsOna>[0];

function entry(cardNo: number, answers: Record<string, string>, evidence: Record<string, boolean> = {}, status: 'concept' | 'klaar' = 'concept'): OnaEntry {
  return { cardNo, answers, evidence, status, aiFlags: null, aiCheckedAt: null, updatedAt: null };
}

function fullEntry(cardNo: number, status: 'concept' | 'klaar' = 'klaar'): OnaEntry {
  const card = getOnaCard(cardNo)!;
  return entry(
    cardNo,
    Object.fromEntries(card.prompts.map(p => [p.id, 'Een eigen antwoord.'])),
    Object.fromEntries(card.evidence.map(e => [e.id, true])),
    status,
  );
}

describe('ONA als module', () => {
  it('staat in de catalogus, zonder niveau, voor de gewone moduleprijs', () => {
    const ona = MODULES.find(m => m.slug === 'ona');
    expect(ona).toMatchObject({ level: null, priceCents: MODULE_PRICE_CENTS, examCount: 0 });
  });

  it('wordt apart opgeteld, buiten de bundels', () => {
    expect(priceForSelection(['ona'])).toBe(MODULE_PRICE_CENTS);
    expect(priceForSelection(['ona', 'knm'])).toBe(2 * MODULE_PRICE_CENTS);
  });

  it('een geposte kale "ona" blijft ONA en wordt geen a2-module', () => {
    expect(parseSelection(['ona'])).toEqual(['ona']);
    expect(normaliseModule('ona')).toBe('ona');
  });

  it('ownsOna leest de modulelijst, en de legacy all-access geeft hem níet', () => {
    expect(ownsOna(m({ modules: ['ona'] }))).toBe(true);
    expect(ownsOna(m({ modules: ['knm'] }))).toBe(false);
    expect(ownsOna(m({ plan: 'premium_plus' }))).toBe(false);
    expect(ownsKnm(m({ modules: ['ona'] }))).toBe(false);
    expect(modulesFromMetadata(m({ modules: ['ona', 'lezen'] }))).toEqual(['ona', 'a2:lezen']);
  });

  it('verloopt net als de andere modules', () => {
    expect(ownsOna(m({ modules: ['ona'], modules_until: '2020-01-01T00:00:00Z' }))).toBe(false);
  });
});

describe('de acht kaarten', () => {
  it('zijn er acht, genummerd 1..8, met unieke prompt-ids per kaart', () => {
    expect(ONA_CARDS.map(c => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const c of ONA_CARDS) {
      const ids = c.prompts.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(c.prompts.length).toBeGreaterThan(0);
    }
  });

  it('alleen kaart 4 en 7 hebben bewijzen die DUO altijd eist', () => {
    const withRequired = ONA_CARDS.filter(c => c.evidence.some(e => e.required)).map(c => c.number);
    expect(withRequired).toEqual([4, 7]);
    expect(getOnaCard(7)!.evidence.filter(e => e.required)).toHaveLength(3);
  });

  it('elke kaart heeft vragen in de bank van het eindgesprek', () => {
    for (const c of ONA_CARDS) expect(ONA_GESPREK_BANK[c.number]?.length).toBeGreaterThan(0);
  });
});

describe('voortgang en de DUO-check', () => {
  it('een kaart is pas klaar als alles beantwoord is én hij op klaar is gezet', () => {
    const card = getOnaCard(4)!;
    expect(cardProgress(card, undefined).status).toBe('leeg');
    expect(cardProgress(card, fullEntry(4, 'concept')).status).toBe('concept');
    expect(cardProgress(card, fullEntry(4, 'klaar')).status).toBe('klaar');
    const noEvidence = { ...fullEntry(4, 'klaar'), evidence: {} };
    expect(cardProgress(card, noEvidence)).toMatchObject({ complete: false, status: 'concept' });
  });

  it('DUO-check: lege kaarten en missende verplichte bewijzen', () => {
    const empty = duoCheck([]);
    expect(empty.allAnswered).toBe(false);
    expect(empty.cardsOpen).toHaveLength(8);
    expect(empty.evidenceMissing.map(m => m.cardNo)).toEqual([4, 7, 7, 7]);

    const all = duoCheck(ONA_CARDS.map(c => fullEntry(c.number)));
    expect(all).toMatchObject({ allAnswered: true, evidenceComplete: true, ready: true });
  });

  it('een open "past dit bij je beroep?"-vlag houdt het portfolio tegen', () => {
    const entries = ONA_CARDS.map(c => fullEntry(c.number));
    entries[5] = { ...entries[5], aiFlags: [{ promptId: 'helpers', type: 'beroep', question: 'Werkt deze persoon in de zorg?' }] };
    expect(duoCheck(entries)).toMatchObject({ beroepFlags: 1, ready: false });
  });

  it('"verder" wijst naar de eerste kaart die niet klaar is', () => {
    expect(nextCardNo([])).toBe(1);
    expect(nextCardNo([fullEntry(1), fullEntry(2)])).toBe(3);
    expect(nextCardNo(ONA_CARDS.map(c => fullEntry(c.number)))).toBeNull();
  });
});

describe('wat de server aanneemt', () => {
  const card = getOnaCard(6)!;

  it('alleen bekende prompts en bewijzen, en afgekapt', () => {
    const a = sanitiseAnswers(card, { wie: 'x'.repeat(5000), onbekend: 'weg', helpers: 3 });
    expect(Object.keys(a)).toEqual(['wie']);
    expect(a.wie).toHaveLength(2000);
    expect(sanitiseEvidence(getOnaCard(7)!, { cv: true, brief: 'ja', nep: true })).toEqual({ cv: true });
  });

  it('een vlag is een korte vraag over een beantwoorde prompt, en niets anders', () => {
    const answers = { wie: 'Mijn buurvrouw.', helpers: '' };
    const ok = { promptId: 'wie', type: 'doorvragen' as const, question: 'Wat heb je van haar geleerd?' };
    expect(keepFlag(card, answers, ok)).toBe(true);
    // Geen vraag: zou een herschreven antwoord kunnen zijn.
    expect(keepFlag(card, answers, { ...ok, question: 'Mijn buurvrouw werkt bij de huisarts en helpt mij.' })).toBe(false);
    // Te lang.
    expect(keepFlag(card, answers, { ...ok, question: `${'woord '.repeat(60)}?` })).toBe(false);
    // Lege prompt: dat is een regel, geen modeloordeel.
    expect(keepFlag(card, answers, { ...ok, promptId: 'helpers' })).toBe(false);
    // Onbekende prompt.
    expect(keepFlag(card, answers, { ...ok, promptId: 'nep' })).toBe(false);
  });
});

describe('de gratis laag', () => {
  it('kaart 1 en één oefengesprek zonder module', () => {
    expect(ONA_FREE_CARD).toBe(1);
    expect(canOpenOnaCard({}, 1)).toBe(true);
    expect(canOpenOnaCard({}, 2)).toBe(false);
    expect(canOpenOnaCard(m({ modules: ['ona'] }), 8)).toBe(true);
    expect(canStartOnaPractice({}, 0)).toBe(true);
    expect(canStartOnaPractice({}, 1)).toBe(false);
    expect(canStartOnaPractice(m({ modules: ['ona'] }), 12)).toBe(true);
  });
});

describe('vrijgegeven door de eigenaar, de review blijft een eigen feit', () => {
  it('ONA staat ook buiten `next dev` open (besluit eigenaar, 14-10-2026)', () => {
    expect(process.env.NODE_ENV).not.toBe('development');
    expect(isOnaAvailable()).toBe(true);
  });

  it('de vrijgave zet de review niet op waar: dat doen alleen de kaarten zelf', () => {
    const allReviewed = ONA_CARDS.every(c => c.status === 'reviewed') && ONA_GESPREK_STATUS === 'reviewed';
    expect(isOnaReviewed()).toBe(allReviewed);
  });
});
