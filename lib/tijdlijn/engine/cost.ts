/**
 * What this will cost, and who pays.
 *
 * Two columns, always: **best case** (one attempt each) and **expected** (with the retakes the
 * diagnostic predicts). Showing only the best case is the optimistic lie every course brochure
 * tells; showing only the expected figure is scaremongering. Both, side by side, is the honest shape.
 *
 * The rule that is most often got wrong on the Dutch internet, and that we therefore state plainly:
 * **an asielstatushouder under Wi2021 gets two free attempts per exam and cannot borrow from DUO at
 * all.** The €10,000 loan ceiling belongs to Wi2013, and repeating it as universal is the single
 * most common error in this subject area. Getting it right is a credibility asset.
 */
import { feeCents, type Rules } from '../rules';
import { expectedAttempts } from './estimate';
import type { ComponentId, ComponentPlan, CostLine, CostProjection, Law, Payer, Status, TimelineInput } from './types';

export function payerKey(law: Law, status: Status): string | null {
  if (law !== 'wi2021' && law !== 'wi2013') return null;
  return `${law}_${status === 'asiel' ? 'asiel' : 'other'}`;
}

export function payerFor(id: ComponentId, law: Law, status: Status, fee: number): Payer {
  if (fee === 0) return 'free';
  if (law === 'wi2021' && status === 'asiel') return 'gemeente';
  return 'loan_possible';
}

/**
 * Free attempts left on one component.
 *
 * `null` means "no free-attempt scheme applies", which the UI must not render as "0 free" — those
 * are different statements. The two free attempts are also conditional on sitting the exam **at or
 * above the level in the PIP**; someone who drops to A2 when their PIP says B1 pays. We cannot know
 * the PIP level from the wizard, so the condition is surfaced as copy next to the figure rather
 * than silently assumed either way.
 */
export function freeAttemptsRemaining(
  id: ComponentId,
  law: Law,
  status: Status,
  attemptsUsed: number,
  rules: Rules,
): number | null {
  const key = payerKey(law, status);
  if (!key) return null;
  const p = rules.legal.payer[key] as Record<string, unknown> | undefined;
  const perExam = typeof p?.freeAttemptsPerExam === 'number' ? (p.freeAttemptsPerExam as number) : null;
  if (perExam === null) return null;
  if (id === 'pvt' || id === 'map' || id === 'z_eindgesprek') return null;
  return Math.max(0, perExam - Math.max(0, attemptsUsed));
}

export function projectCost(
  components: ComponentPlan[],
  input: TimelineInput,
  rules: Rules,
  naturalisationFeeCents: number | null,
): CostProjection {
  const law = input.law === 'wi2013' ? 'wi2013' : 'wi2021';
  const status = input.status;
  const lines: CostLine[] = components
    .filter(c => c.required)
    .map(c => {
      const fee = feeCents(law, c.id, status === 'asiel' ? 'asiel' : 'other') ?? 0;
      const free = c.freeAttemptsRemaining ?? 0;
      const attempts = c.done ? 0 : expectedAttempts(input.progress[c.id]?.diagnosticScore, rules);
      /* Round attempts **up** when they cost money and the plan is already paid for once. Understating
       * a bill is a promise; overstating it is a margin the candidate discovers they did not need. */
      const paidExpected = Math.max(0, Math.ceil(attempts) - free);
      const paidBest = c.done ? 0 : Math.max(0, 1 - free);
      return {
        id: c.id,
        feeCents: fee,
        payer: c.payer,
        freeAttempts: free,
        expectedAttempts: attempts,
        bestCaseCents: fee * paidBest,
        expectedCents: fee * paidExpected,
      };
    });

  const key = payerKey(input.law, status);
  const payer = key ? (rules.legal.payer[key] as Record<string, unknown>) : undefined;
  const canBorrow = payer?.canBorrowFromDuo === true;
  const loanNote: CostProjection['loanNote'] = !key
    ? 'unknown'
    : payer?.canBorrowFromDuo === false
      ? 'not_allowed'
      : typeof payer?.loanMaxCents === 'number'
        ? 'max_10000'
        : 'income_dependent';

  return {
    lines,
    bestCaseCents: lines.reduce((s, l) => s + l.bestCaseCents, 0),
    expectedCents: lines.reduce((s, l) => s + l.expectedCents, 0),
    canBorrowFromDuo: canBorrow,
    loanNote,
    /* Kinderopvangtoeslag covers the compulsory components for anyone with a DUO letter whose
     * children are in childcare. Real money, and almost nobody knows — so it gets a line whenever
     * the person is under an obligation at all, rather than only when they mention children. */
    childcareAllowanceRelevant: input.law === 'wi2021' || input.law === 'wi2013',
    naturalisationFeeCents,
  };
}
