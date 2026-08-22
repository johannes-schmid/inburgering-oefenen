/**
 * `computeTimeline` — the whole product, as one pure function.
 *
 * No I/O, no React, no `Date.now()`. `today` is injected so every test can pin it and so a shared
 * link recomputes against the reader's own today rather than the author's. The function must never
 * throw for a structurally valid input, including one where every answer is `unknown`: the wizard
 * lets people say "I don't know" to everything, and the reward for that has to be a usable page.
 *
 * ## The insight this file implements
 *
 * The three-year term is not the constraint. The **queue in front of it** is. Registering for a DUO
 * exam takes more than six weeks; a result takes eight, and sixteen for Spreken A2 and Schrijven A2
 * while the current notice stands. So we plan backwards from the term's end:
 *
 *     termijnEnd  −  result window  =  latest exam date
 *     latest exam date  −  registration lead  =  **latest registration date**
 *
 * That last date is the headline of the entire tool, and it lands five to six months before the
 * legal deadline. Someone who books their final exam three months out has already missed it, and
 * nothing else on the Dutch internet tells them so.
 *
 * ## Two deliberate stances
 *
 * **We plan to the result date, not the exam date.** Whether DUO measures compliance by the date you
 * sat the exam or the date the result was issued is an open verification item
 * (`docs/tijdlijn/02-RULES-AND-DATA.md` §12). Until that is closed, planning to the result is the
 * only safe reading — being early costs nothing, being late costs a fine. `latestExamDate` is
 * exposed alongside it as the less-safe secondary marker, so the reader sees both.
 *
 * **An assessed extension never lengthens the term.** Only `grantedExtensionMonths`, which is the
 * user reporting a decision DUO already made, moves `termijnEnd`. A plan built on an extension that
 * is later refused is the one failure mode that actually harms somebody.
 */
import { addDays, addMonths, addWeeks, addYears, diffWeeks, isAfter, isBefore, type PlainDate } from './dates';
import { leadWeeks, RULES, type Rules } from '../rules';
import { effectiveHoursPerWeek, expectedAttempts, readinessFor, studyWeeksFor } from './estimate';
import { freeAttemptsRemaining, payerFor } from './cost';
import { projectCost } from './cost';
import { assessExtensions } from './extensions';
import { planNaturalisation } from './naturalisation';
import { selectMode } from './mode';
import {
  estimate,
  legal,
  type ComponentId,
  type ComponentPlan,
  type FineExposure,
  type Law,
  type Route,
  type Timeline,
  type TimelineInput,
  type Warning,
  type WarningId,
} from './types';

const WI2021_FROM: PlainDate = { y: 2022, m: 1, d: 1 };

/** The four language onderdelen, in the order the site's own practice funnel uses. */
const LANGUAGE: ComponentId[] = ['lezen', 'luisteren', 'spreken', 'schrijven'];

// ────────────────────────────── law and term ──────────────────────────────

/**
 * Which law applies. Explicit answer wins; otherwise derive it from the anchor date.
 *
 * The derivation is the single most useful thing the wizard can do for someone who does not know —
 * and most people do not. Becoming obliged on or after 1 January 2022 means Wi2021.
 */
export function resolveLaw(input: TimelineInput): Law {
  if (input.law !== 'unknown') return input.law;
  if (input.status === 'eu_niet_plichtig') return 'none';
  if (input.anchor.kind === 'unknown') return 'unknown';
  return isBefore(input.anchor.date, WI2021_FROM) ? 'wi2013' : 'wi2021';
}

export function resolveRoute(law: Law, route: Route): { route: Route; assumed: boolean } {
  if (route !== 'unknown') return { route, assumed: false };
  if (law === 'wi2013') return { route: 'a2_wi2013', assumed: true };
  if (law === 'wi2021') return { route: 'b1', assumed: true };
  return { route: 'unknown', assumed: false };
}

export interface Termijn {
  start: PlainDate;
  end: PlainDate;
  /** How much we trust the start date. Drives the range width and the warnings. */
  precision: 'day' | 'month';
}

/**
 * Where the clock starts, and when it stops.
 *
 * The three anchors are not equivalent, and the difference is worth days or weeks:
 *
 * - **PIP** (Wi2021): the term starts **the day after** the dagtekening of the *first* PIP. Not the
 *   date the obligation arose, which is earlier and is what most people quote.
 * - **DUO letter** (Wi2013): the date stated in the letter.
 * - **Gemeente registration**: a fallback that *precedes* both, so using it as the start yields a
 *   deadline that is deliberately too early. Pessimistic on purpose, and warned about — the
 *   alternative is optimism about a legal deadline, which is not a trade we make.
 *
 * With month precision we take the **first of the month**, which is again the pessimistic end of the
 * range, and the UI says the date is approximate.
 */
export function resolveTermijn(input: TimelineInput, law: Law, rules: Rules): Termijn | null {
  if (input.anchor.kind === 'unknown') return null;
  if (law !== 'wi2021' && law !== 'wi2013') return null;

  const anchorDate = input.anchor.precision === 'month' ? { ...input.anchor.date, d: 1 } : input.anchor.date;
  const start = input.anchor.kind === 'pip' ? addDays(anchorDate, 1) : anchorDate;

  const years = rules.legal.laws[law]?.termijnYears ?? 3;
  const end = addMonths(addYears(start, years), Math.max(0, Math.round(input.grantedExtensionMonths)));
  return { start, end, precision: input.anchor.precision };
}

// ────────────────────────────── components ──────────────────────────────

export function requiredComponents(law: Law, route: Route, rules: Rules): ComponentId[] {
  const key = route === 'unknown' ? (law === 'wi2013' ? 'a2_wi2013' : 'b1') : route;
  const r = rules.legal.routes[key];
  if (!r) {
    /* Naturalisation-only: no obligation, but the A2 set is what a passport needs. Required in the
     * sense that they cannot get what they came for without it — which is the useful reading. */
    return ['knm', ...LANGUAGE];
  }
  return r.required as ComponentId[];
}

/**
 * How long DUO takes to return a result for this component.
 *
 * The sixteen weeks for Spreken A2 and Schrijven A2 come from a **temporary DUO notice** and are
 * marked volatile in the rules file: they must be re-checked monthly, because they materially change
 * every A2 plan and they will eventually revert to eight.
 *
 * NT2 B1/B2 lead times were never captured (open item 3 in the rules doc). Rather than invent one we
 * fall back to eight weeks **and raise a warning**, so the gap is visible on the page instead of
 * being hidden inside a plausible number.
 */
export function resultLeadWeeks(
  id: ComponentId,
  targetLevel: TimelineInput['targetLevel'],
  rules: Rules,
): { weeks: number; known: boolean; sourceId: string } {
  if (id === 'pvt') return { ...leadWeeks('pvt_registration_visible', 3), sourceId: 'S9' };
  if (id === 'map' || id === 'z_eindgesprek') return { weeks: 0, known: true, sourceId: 'S9' };
  if (id === 'ona') {
    /* ONA is three queues in a row, not one: portfolio review, then the wait for the eindgesprek,
     * then the result. Six plus six plus eight. Modelling it as a single result window is what makes
     * a Wi2013 plan look five months healthier than it is. */
    const a = leadWeeks('ona_portfolio_review', 6);
    const b = leadWeeks('ona_eindgesprek_wait', 6);
    const c = leadWeeks('ona_result', 8);
    return { weeks: a.weeks + b.weeks + c.weeks, known: a.known && b.known && c.known, sourceId: 'S9' };
  }
  if ((id === 'spreken' || id === 'schrijven') && targetLevel === 'a2') {
    const lt = leadWeeks(`result_${id}_a2`, 16);
    return { ...lt, sourceId: lt.sourceId };
  }
  if (LANGUAGE.includes(id) && (targetLevel === 'b1' || targetLevel === 'b2')) {
    const nt2 = rules.legal.leadTimes.result_nt2_b1_b2;
    if (!nt2 || nt2.weeks === null || nt2.weeks === undefined) {
      const fallback = leadWeeks('result_default', 8);
      return { weeks: fallback.weeks, known: false, sourceId: fallback.sourceId };
    }
    return { weeks: nt2.weeks, known: true, sourceId: nt2.sourceId ?? 'S7' };
  }
  return leadWeeks('result_default', 8);
}

export function planComponent(args: {
  id: ComponentId;
  input: TimelineInput;
  termijn: Termijn | null;
  rules: Rules;
  today: PlainDate;
  required: boolean;
}): ComponentPlan {
  const { id, input, termijn, rules, today, required } = args;
  const progress = input.progress[id];
  const done = progress?.state === 'passed';

  const result = resultLeadWeeks(id, input.targetLevel, rules);
  const registration =
    id === 'pvt' || id === 'map' || id === 'z_eindgesprek'
      ? { weeks: 0, known: true, sourceId: 'S9' }
      : leadWeeks('registration', 7);

  const latestExamDate = termijn ? legal(addWeeks(termijn.end, -result.weeks), 'legal.leadTimes.result', result.sourceId) : null;
  const registerBy = latestExamDate
    ? legal(addWeeks(latestExamDate.date, -registration.weeks), 'legal.leadTimes.registration', registration.sourceId)
    : null;

  const readyBy = done ? null : readinessFor(id, input, rules, today);
  const studyWeeks = done ? null : studyWeeksFor(id, input, rules);

  /* Forwards from readiness: when the exam falls, and when the result lands. Both are ranges because
   * readiness is one — collapsing them to a point would turn our model into a promise. */
  const examWindow =
    readyBy && !done
      ? estimate(
          addWeeks(readyBy.earliest, registration.weeks),
          addWeeks(readyBy.latest, registration.weeks),
          readyBy.basis,
          readyBy.confidence,
        )
      : null;
  const resultWindow =
    examWindow && !done
      ? estimate(
          addWeeks(examWindow.earliest, result.weeks),
          addWeeks(examWindow.latest, result.weeks),
          examWindow.basis,
          examWindow.confidence,
        )
      : null;

  /* Backwards from the deadline: the last moment to start. `hi` weeks of study gives the *earlier*
   * date, so it is the range's `earliest` — get that inverted and the tool tells people to start
   * later than they safely can, which is the one error it exists to prevent. */
  const startStudyingBy =
    registerBy && studyWeeks && !done
      ? estimate(
          addWeeks(registerBy.date, -studyWeeks.hi),
          addWeeks(registerBy.date, -studyWeeks.lo),
          readyBy?.basis ?? 'study_model',
          readyBy?.confidence ?? 'low',
        )
      : null;

  /* `Infinity` when readiness is unknown, so `argmin` over slack simply ignores this component
   * rather than crowning it the binding one on the strength of a missing answer. */
  const slackWeeks = readyBy && registerBy ? diffWeeks(readyBy.latest, registerBy.date) : Infinity;

  const law = input.law === 'wi2013' ? 'wi2013' : 'wi2021';
  const fee = feeFor(id, law, input.status);
  const free = done ? null : freeAttemptsRemaining(id, input.law, input.status, progress?.attempts ?? 0, rules);

  return {
    id,
    required,
    level: levelFor(id, input),
    done,
    readyBy,
    studyWeeks,
    startStudyingBy,
    examWindow,
    resultWindow,
    registerBy,
    latestExamDate,
    resultWindowWeeks: result.weeks,
    registrationWeeks: registration.weeks,
    slackWeeks,
    feeCents: fee,
    payer: payerFor(id, input.law, input.status, fee),
    freeAttemptsRemaining: free,
    expectedAttempts: done ? 0 : expectedAttempts(progress?.diagnosticScore, rules),
    practiceHref: LANGUAGE.includes(id) ? `/oefenen/${id}?from=tijdlijn` : null,
    /* The red bar in the mockup: the *waiting* alone runs past the wall. Computed from the optimistic
     * end of the range, so a bar only turns red when even the good case does not fit. */
    crossesWall: Boolean(
      termijn && readyBy && isAfter(addWeeks(readyBy.earliest, registration.weeks + result.weeks), termijn.end),
    ),
  };
}

/**
 * Which level this component is examined at.
 *
 * Only the four language onderdelen have one. Wi2013 is always A2; under Wi2021 it follows the
 * route's target, and `unknown` resolves to A2 rather than to nothing — A2 is both the fallback the
 * rest of the engine plans with and the level this site actually teaches, so a label that silently
 * dropped the level would be less honest than one that names the assumption the plan already made.
 */
function levelFor(id: ComponentId, input: TimelineInput): ComponentPlan['level'] {
  if (!LANGUAGE.includes(id)) return null;
  if (input.law === 'wi2013' || input.route === 'a2_wi2013') return 'a2';
  if (input.targetLevel === 'unknown') return 'a2';
  return input.targetLevel;
}

function feeFor(id: ComponentId, law: 'wi2021' | 'wi2013', status: TimelineInput['status']): number {
  const table = RULES.legal.fees[law] as Record<string, unknown>;
  const v = table?.[id];
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') {
    const per = v as Record<string, number>;
    return per[status === 'asiel' ? 'asiel' : 'other'] ?? per.other ?? 0;
  }
  return 0;
}

// ────────────────────────────── fines ──────────────────────────────

/**
 * Mode E's substance: what a missed term actually means.
 *
 * Two things this must get right, and both are the opposite of the internet's default answer:
 *
 * 1. **Asielstatushouders are never fined.** Following a Raad van State ruling DUO may not fine
 *    status holders under either law for exceeding the term, nor reclaim integration loan money.
 *    That is the first sentence such a reader sees, before anything else.
 * 2. **Being late is not the end.** DUO grants extra time *after* a fine, on a published scale —
 *    two years with nothing passed, six months with three or four. So mode E draws a second wall
 *    beyond the first, and the copy is a recovery plan rather than a verdict.
 *
 * We show the statutory **maximum** and never a personal figure: the real amount depends on
 * registered course hours and attempt counts that only DUO holds.
 */
export function assessFine(input: TimelineInput, law: Law, termijnEnd: PlainDate | null, rules: Rules): FineExposure | null {
  if (law !== 'wi2021' && law !== 'wi2013') return null;
  const fines = rules.legal.fines as Record<string, Record<string, unknown>>;
  const table = fines[law];
  if (!table) return null;

  if (input.status === 'asiel') {
    return {
      applies: false,
      leerrouteMaxCents: null,
      pvtMaxCents: null,
      mapMaxCents: null,
      extraTimeMonths: null,
      newHorizon: null,
      sourceId: 'S5',
    };
  }

  const passedLanguage = LANGUAGE.filter(id => input.progress[id]?.state === 'passed').length;
  let extraMonths: number | null = null;

  if (law === 'wi2021') {
    const extra = table.extraTimeAfterFine as Record<string, unknown>;
    const byExams = extra?.b1_or_onderwijs_by_exams_passed as Record<string, number> | undefined;
    if (input.route === 'z') {
      /* The Z-route scale is by course hours, which the wizard does not ask for — so it stays null
       * and the UI asks, rather than quoting the wrong row of a published table. */
      extraMonths = null;
    } else if (byExams) {
      extraMonths = byExams[String(Math.min(4, passedLanguage))] ?? null;
    }
  } else {
    extraMonths = (table.extraTimeAfterFineMonths as number | undefined) ?? null;
  }

  return {
    applies: true,
    leerrouteMaxCents:
      (table.leerrouteMaxCents as number | undefined) ?? (table.diplomaMaxCents as number | undefined) ?? null,
    pvtMaxCents: (table.pvtCents as number | undefined) ?? null,
    mapMaxCents: (table.mapCents as number | undefined) ?? null,
    extraTimeMonths: extraMonths,
    newHorizon:
      termijnEnd && extraMonths !== null
        ? legal(addMonths(termijnEnd, extraMonths), 'legal.fines.extraTimeAfterFine', 'S5')
        : null,
    sourceId: 'S5',
  };
}

// ────────────────────────────── warnings ──────────────────────────────

function collectWarnings(args: {
  input: TimelineInput;
  law: Law;
  route: Route;
  routeAssumed: boolean;
  termijn: Termijn | null;
  components: ComponentPlan[];
  rules: Rules;
}): Warning[] {
  const { input, law, route, routeAssumed, termijn, components, rules } = args;
  const out: Warning[] = [];
  const add = (id: WarningId, severity: Warning['severity'] = 'info', sourceId?: string) =>
    out.push({ id, severity, sourceId });

  /* Always, once, never dismissible. The tool is a hulpmiddel; DUO decides. */
  add('not_an_official_decision', 'info');

  if (input.anchor.kind === 'unknown') add('anchor_unknown', 'attention');
  else if (input.anchor.precision === 'month') add('anchor_month_precision', 'info');
  if (input.anchor.kind === 'gemeente_registration') add('anchor_is_gemeente_registration', 'attention');
  if (law === 'unknown') add('law_unknown', 'attention');
  if (routeAssumed && route === 'b1') add('route_assumed_b1', 'info');

  const nt2 = rules.legal.leadTimes.result_nt2_b1_b2;
  if ((input.targetLevel === 'b1' || input.targetLevel === 'b2') && (!nt2 || nt2.weeks === null)) {
    add('nt2_result_lead_unknown', 'attention');
  }
  if (input.targetLevel === 'a2' && components.some(c => c.id === 'spreken' || c.id === 'schrijven')) {
    add('volatile_16_week_notice', 'info', 'S15');
  }
  if (input.wantsNaturalisation && route === 'z') add('z_route_not_enough_for_passport', 'attention', 'S6');
  if (input.status === 'asiel' && termijn) add('asiel_never_fined', 'info', 'S5');
  if (effectiveHoursPerWeek(input, rules) <= 0) add('no_study_hours_given', 'attention');

  return out;
}

// ────────────────────────────── the entry point ──────────────────────────────

export function computeTimeline(input: TimelineInput, rules: Rules, today: PlainDate): Timeline {
  const law = resolveLaw(input);
  const { route, assumed: routeAssumed } = resolveRoute(law, input.route);
  const termijn = resolveTermijn(input, law, rules);
  const required = requiredComponents(law, route, rules);

  const optional = (rules.legal.routes[route]?.optional ?? []) as ComponentId[];
  const ids: ComponentId[] = [...required, ...optional.filter(id => !required.includes(id))];

  const components = ids.map(id =>
    planComponent({ id, input, termijn, rules, today, required: required.includes(id) }),
  );

  const open = components.filter(c => c.required && !c.done && Number.isFinite(c.slackWeeks));
  const binding = open.length ? open.reduce((a, b) => (b.slackWeeks < a.slackWeeks ? b : a)) : null;
  const bufferWeeks = binding ? binding.slackWeeks - rules.planning.safetyBufferWeeks : null;

  const mode = selectMode({
    law,
    route,
    input,
    termijnStart: termijn?.start ?? null,
    termijnEnd: termijn?.end ?? null,
    bufferWeeks,
    today,
    rules,
  });

  const naturalisation =
    input.wantsNaturalisation || route === 'naturalisatie_only'
      ? planNaturalisation(input, components, rules)
      : null;

  return {
    mode,
    law,
    route,
    termijnStart: termijn ? legal(termijn.start, 'legal.laws.termijnStart', 'S11') : null,
    termijnEnd: termijn ? legal(termijn.end, 'legal.laws.termijnYears', 'S1') : null,
    bindingComponent: binding?.id ?? null,
    bufferWeeks,
    components,
    /* Advice, not law: KNM first because it is the fastest win and the thing we teach best, and
     * Spreken/Schrijven early *despite* being sat last, because their result queues are the longest. */
    recommendedOrder: (rules.planning.recommendedOrder as ComponentId[]).filter(id => ids.includes(id)),
    cost: projectCost(components, input, rules, naturalisation?.feeCents ?? null),
    extensions: assessExtensions(input, termijn?.start ?? null, rules, today),
    fine: mode === 'overdue' || mode === 'at_risk' ? assessFine(input, law, termijn?.end ?? null, rules) : null,
    naturalisation,
    warnings: collectWarnings({ input, law, route, routeAssumed, termijn, components, rules }),
    rulesVersion: rules.version,
    computedAt: today,
  };
}
