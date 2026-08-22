/**
 * Which of the eight result states this person is in.
 *
 * The mode drives the verdict card, the wall treatment and the tone of every string — so the
 * ordering of these checks *is* product design, not plumbing. It reads top to bottom:
 *
 * 1. **Not obliged** beats everything. Telling someone they are behind on an obligation they do not
 *    have is the worst answer the tool can give.
 * 2. **Overdue** beats the buffer arithmetic. Once the term has ended, "you have 3 weeks of room" is
 *    not merely wrong, it is incoherent.
 * 3. **No anchor date** means estimate mode, whatever the numbers say. A buffer computed from a
 *    guessed start date must not be presented as a finding.
 * 4. Only then do the buffer thresholds decide between on track, tight and at risk.
 *
 * Tone rule that belongs with the state machine rather than only with the copy: `at_risk` and
 * `overdue` never scold. They state what is true, then lead with options. These people have been
 * made to feel bad by enough institutions already.
 */
import { isAfter, type PlainDate } from './dates';
import type { Law, ResultMode, Route, TimelineInput } from './types';
import type { Rules } from '../rules';

export function selectMode(args: {
  law: Law;
  route: Route;
  input: TimelineInput;
  termijnStart: PlainDate | null;
  termijnEnd: PlainDate | null;
  bufferWeeks: number | null;
  today: PlainDate;
  rules: Rules;
}): ResultMode {
  const { law, route, input, termijnStart, termijnEnd, bufferWeeks, today, rules } = args;

  if (route === 'naturalisatie_only') return 'naturalisation_only';
  if (law === 'none' || input.status === 'eu_niet_plichtig') {
    /* Not obliged, but they asked about a passport: that is a plan, not an empty screen. */
    return input.wantsNaturalisation ? 'naturalisation_only' : 'exempt';
  }

  if (termijnEnd && isAfter(today, termijnEnd)) return 'overdue';

  /* The clock has not started: obliged, but no PIP and no letter yet. Everything ahead is real and
   * datable *relative* to a start that has not happened — so we show what is coming, not a deadline. */
  if (!termijnStart) {
    return input.anchor.kind === 'unknown' ? (law === 'unknown' ? 'estimate_mode' : 'pre_clock') : 'estimate_mode';
  }

  if (input.anchor.kind === 'unknown') return 'estimate_mode';
  /* A month-precision anchor still produces a real plan — it just produces a wider one. Only a
   * *missing* anchor forces estimate mode; downgrading month precision to "we cannot say" would
   * throw away a usable answer for the majority of users, who know the month and not the day. */

  if (bufferWeeks === null) return 'estimate_mode';

  const { onTrackMinBufferWeeks, tightMinBufferWeeks } = rules.planning.modeThresholds;
  if (bufferWeeks >= onTrackMinBufferWeeks) return 'on_track';
  if (bufferWeeks >= tightMinBufferWeeks) return 'tight';
  return 'at_risk';
}
