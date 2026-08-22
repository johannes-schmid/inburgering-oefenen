/**
 * The passport leg: two clocks side by side.
 *
 * People do not care about A2 for its own sake — they care about the residence permit and the
 * passport at the end of it. So the naturalisation leg is not a footnote; for many users it is the
 * reason they opened the tool. It renders as **two walls**: the residence clock (five years, or
 * three as the spouse of a Dutch national) and the diploma clock (the A2 set, including DUO's result
 * queues). Whichever is later is the one that actually decides when they can apply, and saying which
 * is the useful part — "your language clock has slack, start with KNM" is advice; two dates are not.
 *
 * Two traps get surfaced early rather than discovered three years too late:
 *
 * - **A Z-route certificate is not an inburgeringsdiploma.** It closes the obligation and does not
 *   open naturalisation. Someone on the Z-route who wants a passport must sit the full A2 set anyway.
 * - **A BIO dispensation under Wi2021 is not sufficient for naturalisation** either, though an older
 *   Wi2007 dispensation may be.
 *
 * The pending 5→10 year bill is modelled as a dormant rule and flagged, never applied: as at the
 * `checkedOn` date in the rules file it is not in force, and a tool that pre-emptively applies a
 * proposal is wrong today in order to be right later.
 */
import { addWeeks, addYears, isAfter, maxOf, type PlainDate } from './dates';
import { legal, type ComponentPlan, type NaturalisationPlan, type Route, type TimelineInput } from './types';
import type { Rules } from '../rules';

export function planNaturalisation(
  input: TimelineInput,
  components: ComponentPlan[],
  rules: Rules,
): NaturalisationPlan {
  const nat = rules.legal.naturalisation as Record<string, unknown>;
  const residenceYears = (nat.residenceYears as { value: number } | undefined)?.value ?? 5;
  const residenceEligibleFrom = input.residenceStart
    ? legal(addYears(input.residenceStart, residenceYears), 'legal.naturalisation.residenceYears', 'S6')
    : null;

  /* The diploma clock is the *last* component to clear, results included — a diploma needs the whole
   * set. `latestExamDate` is a deadline, not a forecast, so the forecast comes from `readyBy` plus
   * the result window that `planComponent` already worked out. */
  const openLanguage = components.filter(c => c.required && !c.done && c.readyBy);
  let earliest: PlainDate | null = null;
  let latest: PlainDate | null = null;
  for (const c of openLanguage) {
    const r = c.readyBy!;
    const lo = addWeeks(r.earliest, c.registrationWeeks + c.resultWindowWeeks);
    const hi = addWeeks(r.latest, c.registrationWeeks + c.resultWindowWeeks);
    earliest = earliest ? maxOf(earliest, lo) : lo;
    latest = latest ? maxOf(latest, hi) : hi;
  }

  const diplomaReadyBy =
    earliest && latest
      ? ({ _tag: 'estimate', earliest, latest, basis: 'study_model', confidence: 'low' } as const)
      : null;

  const bindingClock: NaturalisationPlan['bindingClock'] =
    residenceEligibleFrom && latest
      ? isAfter(residenceEligibleFrom.date, latest)
        ? 'residence'
        : 'diploma'
      : residenceEligibleFrom
        ? 'residence'
        : latest
          ? 'diploma'
          : 'unknown';

  const fees = rules.legal.fees.naturalisation as Record<string, unknown>;
  const blockers: NaturalisationPlan['blockers'] = [];
  if (isZRoute(input.route)) blockers.push('z_route_certificate');

  const pending = (nat.pending as { status: string }[] | undefined) ?? [];

  return {
    residenceEligibleFrom,
    diplomaReadyBy,
    bindingClock,
    feeCents: typeof fees?.single_standard === 'number' ? (fees.single_standard as number) : 0,
    decisionMonths: [6, 9],
    blockers,
    /* Flagged whenever a proposal exists, regardless of whether it has commenced — the honest line is
     * "this is the law today, and a change is pending", which is also why `residenceYears` above
     * reads the in-force value and never the proposal. */
    pendingLawWarning: pending.some(p => p.status === 'proposed' || p.status === 'intended'),
  };
}

const isZRoute = (r: Route) => r === 'z';
