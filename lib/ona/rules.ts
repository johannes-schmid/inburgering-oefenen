import { ONA_CARDS, type OnaCard } from '@/data/ona/cards';

/**
 * De regels van het ONA-portfolio, puur en zonder database — zodat ze te testen zijn.
 *
 * DUO controleert een portfolio op precies drie dingen (ona-toelichting.pdf, p. 1):
 *   1. alle vragen op alle kaarten zijn ingevuld;
 *   2. alle kaarten gaan over hetzelfde beroep;
 *   3. alle verplichte bewijzen zitten erbij.
 * Punt 2 is hier per constructie waar: het portfolio heeft één beroep en elke kaart hangt eraan.
 * Wat de check daarbij nog kan vinden — een antwoord dat over iets anders lijkt te gaan — staat in
 * de vlaggen van type `beroep`, en die tellen als "nog nakijken", niet als fout.
 */

export type OnaFlagType = 'doorvragen' | 'beroep' | 'onvolledig';

export type OnaFlag = {
  promptId: string;
  type: OnaFlagType;
  question: string;
};

export type OnaEntry = {
  cardNo: number;
  answers: Record<string, string>;
  evidence: Record<string, boolean>;
  status: 'concept' | 'klaar';
  aiFlags: OnaFlag[] | null;
  aiCheckedAt: string | null;
  updatedAt: string | null;
};

export type OnaCardStatus = 'leeg' | 'concept' | 'klaar';

export type OnaCardProgress = {
  answered: number;
  total: number;
  requiredEvidence: number;
  requiredEvidenceDone: number;
  /** Alle vragen beantwoord en alle verplichte bewijzen aangevinkt. */
  complete: boolean;
  status: OnaCardStatus;
  flags: number;
};

export const ONA_ANSWER_MAX = 2000;

export function isAnswered(text: string | undefined | null): boolean {
  return typeof text === 'string' && text.trim().length >= 2;
}

export function cardProgress(card: OnaCard, entry: OnaEntry | undefined): OnaCardProgress {
  const answered = card.prompts.filter(p => isAnswered(entry?.answers[p.id])).length;
  const required = card.evidence.filter(e => e.required);
  const requiredEvidenceDone = required.filter(e => entry?.evidence[e.id] === true).length;
  const complete = answered === card.prompts.length && requiredEvidenceDone === required.length;
  const hasAnything = answered > 0 || Object.values(entry?.evidence ?? {}).some(Boolean);
  const status: OnaCardStatus = !entry || !hasAnything
    ? 'leeg'
    : entry.status === 'klaar' && complete
      ? 'klaar'
      : 'concept';
  return {
    answered,
    total: card.prompts.length,
    requiredEvidence: required.length,
    requiredEvidenceDone,
    complete,
    status,
    flags: entry?.aiFlags?.length ?? 0,
  };
}

export type DuoCheck = {
  /** Kaarten waar nog een vraag open staat. */
  cardsOpen: number[];
  allAnswered: boolean;
  /** Antwoorden die de check als "gaat dit over je beroep?" heeft gemarkeerd. */
  beroepFlags: number;
  /** Verplichte bewijzen die nog niet zijn aangevinkt. */
  evidenceMissing: { cardNo: number; label: string }[];
  evidenceComplete: boolean;
  ready: boolean;
};

export function duoCheck(entries: OnaEntry[], cards: OnaCard[] = ONA_CARDS): DuoCheck {
  const byNo = new Map(entries.map(e => [e.cardNo, e]));
  const cardsOpen: number[] = [];
  const evidenceMissing: DuoCheck['evidenceMissing'] = [];
  let beroepFlags = 0;
  for (const card of cards) {
    const entry = byNo.get(card.number);
    if (card.prompts.some(p => !isAnswered(entry?.answers[p.id]))) cardsOpen.push(card.number);
    for (const ev of card.evidence) {
      if (ev.required && entry?.evidence[ev.id] !== true) {
        evidenceMissing.push({ cardNo: card.number, label: ev.label });
      }
    }
    beroepFlags += (entry?.aiFlags ?? []).filter(f => f.type === 'beroep').length;
  }
  const allAnswered = cardsOpen.length === 0;
  const evidenceComplete = evidenceMissing.length === 0;
  return {
    cardsOpen,
    allAnswered,
    beroepFlags,
    evidenceMissing,
    evidenceComplete,
    ready: allAnswered && evidenceComplete && beroepFlags === 0,
  };
}

/** De eerste kaart die nog niet klaar is — waar "verder" naartoe wijst. */
export function nextCardNo(entries: OnaEntry[], cards: OnaCard[] = ONA_CARDS): number | null {
  const byNo = new Map(entries.map(e => [e.cardNo, e]));
  const next = cards.find(c => cardProgress(c, byNo.get(c.number)).status !== 'klaar');
  return next?.number ?? null;
}

/**
 * Antwoorden van de client terugbrengen tot wat er mag staan: alleen bekende prompt-ids, alleen
 * tekst, afgekapt op `ONA_ANSWER_MAX`. Een client die extra sleutels post, schrijft ze niet weg.
 */
export function sanitiseAnswers(card: OnaCard, raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const p of card.prompts) {
    const v = (raw as Record<string, unknown>)[p.id];
    if (typeof v === 'string') out[p.id] = v.slice(0, ONA_ANSWER_MAX);
  }
  return out;
}

export function sanitiseEvidence(card: OnaCard, raw: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const e of card.evidence) {
    if ((raw as Record<string, unknown>)[e.id] === true) out[e.id] = true;
  }
  return out;
}

/**
 * Een vlag van het model laten staan of niet.
 *
 * Het schema laat het model alleen een vraag aan de kandidaat teruggeven. Deze filter is de
 * tweede muur: een "vraag" die geen vraag is, of zo lang dat er een herschreven antwoord in kan
 * zitten, gaat weg. Ook een vlag op een prompt die niet bestaat of die leeg is, want lege
 * prompts zijn een regel en geen modeloordeel.
 */
export function keepFlag(card: OnaCard, answers: Record<string, string>, flag: OnaFlag): boolean {
  const q = flag.question?.trim() ?? '';
  if (!card.prompts.some(p => p.id === flag.promptId)) return false;
  if (!isAnswered(answers[flag.promptId])) return false;
  if (!['doorvragen', 'beroep', 'onvolledig'].includes(flag.type)) return false;
  if (q.length < 8 || q.length > 220) return false;
  if (!q.endsWith('?')) return false;
  return true;
}
