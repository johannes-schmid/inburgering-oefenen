/**
 * The tijdlijn domain. Read `docs/tijdlijn/02-RULES-AND-DATA.md` §0 before changing anything here.
 *
 * **The one rule the types exist to enforce:** a date that follows from the law or from a DUO-
 * published waiting time (`LegalDate`) and a date that follows from our own planning model
 * (`EstimatedDate`) are *different types* and cannot be assigned to one another. The UI renders them
 * differently — solid with a "volgens DUO" badge versus dashed with "ongeveer" — and the whole
 * trustworthiness of the tool rests on that never slipping. A shared `date` field would let an
 * estimate be rendered with a DUO badge by accident; the discriminated `_tag` makes it a build error.
 *
 * A second, quieter rule: `unknown` is a first-class value everywhere. Most people genuinely do not
 * know which law applies to them, and a wizard that blocks on that is a government form.
 */
import type { PlainDate } from './dates';

// ────────────────────────────── inputs ──────────────────────────────

export type Law = 'wi2021' | 'wi2013' | 'none' | 'unknown';
export type Status = 'asiel' | 'gezin_overig' | 'eu_niet_plichtig' | 'unknown';
export type Route = 'b1' | 'onderwijs' | 'z' | 'a2_wi2013' | 'naturalisatie_only' | 'unknown';
export type Level = 'a0' | 'a1' | 'a2' | 'b1' | 'b2' | 'unknown';

export type ComponentId =
  | 'lezen'
  | 'luisteren'
  | 'spreken'
  | 'schrijven'
  | 'knm'
  | 'ona'
  | 'map'
  | 'pvt'
  | 'z_eindgesprek';

export const COMPONENT_IDS: ComponentId[] = [
  'lezen',
  'luisteren',
  'spreken',
  'schrijven',
  'knm',
  'ona',
  'map',
  'pvt',
  'z_eindgesprek',
];

/** The four onderdelen this site sells practice for. Everything else has no `practiceHref`. */
export const LANGUAGE_COMPONENTS: ComponentId[] = ['lezen', 'luisteren', 'spreken', 'schrijven'];

export type ComponentState = 'not_started' | 'studying' | 'registered' | 'awaiting_result' | 'passed' | 'failed';

export type ComponentProgress = {
  state: ComponentState;
  /** 0..10 from the inline diagnostic. Drives both the readiness estimate and the retake forecast. */
  diagnosticScore?: number;
  /** Set for `registered` / `awaiting_result`, when the candidate knows their slot. */
  examDate?: PlainDate;
  passedOn?: PlainDate;
  /** Attempts already used. Matters for asielstatushouders' two free attempts. */
  attempts?: number;
};

/**
 * Where the term starts counting.
 *
 * The three kinds are **not interchangeable and not equally good**. Wi2021's term starts the day
 * after the dagtekening of the *first* PIP; the DUO letter carries a different, earlier date; a
 * gemeente-registration date is a guess that precedes both. The engine widens its confidence and
 * emits a warning as the anchor gets weaker, rather than pretending all three are the same fact.
 */
export type Anchor =
  | { kind: 'pip'; date: PlainDate; precision: 'day' | 'month' }
  | { kind: 'duo_letter'; date: PlainDate; precision: 'day' | 'month' }
  | { kind: 'gemeente_registration'; date: PlainDate; precision: 'day' | 'month' }
  | { kind: 'unknown' };

/** Answers to wizard Q9 — the things that may buy someone extra time. Informational only. */
export type ExtensionSignal =
  | 'literacy_course'
  | 'dutch_education'
  | 'illness'
  | 'death_in_family'
  | 'childbirth'
  | 'homeless_or_shelter'
  | 'gemeente_or_school_failure'
  | 'none';

export interface TimelineInput {
  law: Law;
  status: Status;
  route: Route;
  anchor: Anchor;
  targetLevel: 'a2' | 'b1' | 'b2' | 'unknown';
  currentLevel: Level;
  progress: Partial<Record<ComponentId, ComponentProgress>>;
  courseHoursPerWeek: number;
  selfStudyHoursPerWeek: number;
  /** Months the user says DUO already granted. Trusted as reported; not verified. */
  grantedExtensionMonths: number;
  extensionSignals: ExtensionSignal[];
  wantsNaturalisation: boolean;
  residenceStart?: PlainDate;
}

// ────────────────────────────── dated outputs ──────────────────────────────

/** A date that follows from the law or from a DUO-published lead time. Always carries its source. */
export interface LegalDate {
  readonly _tag: 'legal';
  date: PlainDate;
  /** Path into the rules document, e.g. `legal.leadTimes.registration`. Keys the i18n explanation. */
  ruleId: string;
  /** `S1`..`S15` in the source register. */
  sourceId: string;
}

/** A date that follows from our planning model. **Always a range** — never collapse it to a point. */
export interface EstimatedDate {
  readonly _tag: 'estimate';
  earliest: PlainDate;
  latest: PlainDate;
  basis: 'study_model' | 'diagnostic' | 'default_assumption';
  confidence: 'low' | 'medium' | 'high';
}

export type TimelineDate = LegalDate | EstimatedDate;

export const isLegal = (d: TimelineDate): d is LegalDate => d._tag === 'legal';
export const isEstimate = (d: TimelineDate): d is EstimatedDate => d._tag === 'estimate';

export function legal(date: PlainDate, ruleId: string, sourceId: string): LegalDate {
  return { _tag: 'legal', date, ruleId, sourceId };
}

export function estimate(
  earliest: PlainDate,
  latest: PlainDate,
  basis: EstimatedDate['basis'],
  confidence: EstimatedDate['confidence'],
): EstimatedDate {
  return { _tag: 'estimate', earliest, latest, basis, confidence };
}

// ────────────────────────────── component plan ──────────────────────────────

export type Payer = 'self' | 'gemeente' | 'loan_possible' | 'free';

export interface ComponentPlan {
  id: ComponentId;
  required: boolean;
  /**
   * The CEFR level this exam is sat at, or `null` for the components that have none (KNM, ONA, PVT,
   * MAP, the Z-route interview).
   *
   * Rendered in the label — *"Schrijven A2"*, not *"Schrijven"* — because it is the first thing a
   * candidate needs to know about an exam and because the same onderdeel at A2 and at B1 is a
   * different exam, with a different result queue (16 weeks versus 8 while the DUO notice stands).
   * Leaving it off made the plan ambiguous exactly where afschalen from B1 to A2 is the decision on
   * the table.
   */
  level: 'a2' | 'b1' | 'b2' | null;
  /** True once the candidate has passed it — kept in the list so the timeline shows the win. */
  done: boolean;
  /** When our model thinks they could sit it. `null` when done, or when nothing is known. */
  readyBy: EstimatedDate | null;
  /** Weeks of studying still to do, as a band. The figure every other date here is built from. */
  studyWeeks: { lo: number; hi: number } | null;
  /**
   * **The last moment to start studying** and still make the registration deadline: `registerBy`
   * minus the study weeks. This is the date people act on, and it is the one nothing else on the
   * Dutch internet computes.
   *
   * An `EstimatedDate` and never a `LegalDate`, even though it is derived from one: the subtraction
   * uses our study model, so the result is ours. A date in the past means they are already behind on
   * this component — which the UI says plainly rather than hiding.
   */
  startStudyingBy: EstimatedDate | null;
  /** When the exam itself would fall: ready, plus DUO's registration queue. */
  examWindow: EstimatedDate | null;
  /** When the result would land: the exam, plus DUO's marking queue. What the deadline is measured against. */
  resultWindow: EstimatedDate | null;
  /** Last date you can still register and have the result land before the term ends. */
  registerBy: LegalDate | null;
  latestExamDate: LegalDate | null;
  /** Weeks DUO needs to return the result. 8 normally, 16 for Spreken/Schrijven A2, 20 for ONA. */
  resultWindowWeeks: number;
  registrationWeeks: number;
  /** `registerBy − readyBy.latest`, in whole weeks. `Infinity` when readiness is unknown. */
  slackWeeks: number;
  feeCents: number;
  payer: Payer;
  freeAttemptsRemaining: number | null;
  expectedAttempts: number;
  /** Deep link into the free practice funnel. Only the four language onderdelen have one. */
  practiceHref: string | null;
  /** True when the estimate says the waiting alone runs past the deadline. Drives the red bar. */
  crossesWall: boolean;
}

// ────────────────────────────── other panels ──────────────────────────────

export interface CostLine {
  id: ComponentId;
  feeCents: number;
  payer: Payer;
  freeAttempts: number;
  expectedAttempts: number;
  bestCaseCents: number;
  expectedCents: number;
}

export interface CostProjection {
  lines: CostLine[];
  bestCaseCents: number;
  expectedCents: number;
  canBorrowFromDuo: boolean;
  loanNote: 'income_dependent' | 'max_10000' | 'not_allowed' | 'unknown';
  childcareAllowanceRelevant: boolean;
  naturalisationFeeCents: number | null;
}

export type ConditionVerdict = 'met' | 'not_met' | 'unknown';

export interface ExtensionAssessment {
  id: string;
  /** DUO grants it without an application. The "you may already have 6 extra months" case. */
  automatic: boolean;
  grantMonths: number;
  /** `likely` = every condition met. `possible` = nothing contradicts it. `unlikely` = one fails. */
  verdict: 'likely' | 'possible' | 'unlikely';
  conditions: { key: string; verdict: ConditionVerdict }[];
  decisionWeeks: number | null;
  sourceId: string;
}

export interface NaturalisationPlan {
  /** 5 years' residence, or 3 for the spouse of a Dutch national. Today's law, not the pending bill. */
  residenceEligibleFrom: LegalDate | null;
  /** When the A2 set could realistically be complete, including DUO's result queues. */
  diplomaReadyBy: EstimatedDate | null;
  /** The later of the two clocks — the one that actually decides when they can apply. */
  bindingClock: 'residence' | 'diploma' | 'unknown';
  feeCents: number;
  decisionMonths: [number, number];
  /** Z-route certificate and a BIO dispensation are both insufficient. Surfaced early, on purpose. */
  blockers: ('z_route_certificate' | 'bio_dispensation')[];
  pendingLawWarning: boolean;
}

export type WarningId =
  | 'anchor_unknown'
  | 'anchor_month_precision'
  | 'anchor_is_gemeente_registration'
  | 'law_unknown'
  | 'route_assumed_b1'
  | 'nt2_result_lead_unknown'
  | 'volatile_16_week_notice'
  | 'z_route_not_enough_for_passport'
  | 'bio_not_enough_for_passport'
  | 'asiel_never_fined'
  | 'no_study_hours_given'
  | 'not_an_official_decision';

export interface Warning {
  id: WarningId;
  severity: 'info' | 'attention';
  /** Set when the warning restates a legal fact rather than a limitation of our own model. */
  sourceId?: string;
}

export type ResultMode =
  | 'pre_clock'
  | 'on_track'
  | 'tight'
  | 'at_risk'
  | 'overdue'
  | 'exempt'
  | 'naturalisation_only'
  | 'estimate_mode';

export interface FineExposure {
  /** Asielstatushouders are never fined — a Raad van State ruling, and the first thing mode E says. */
  applies: boolean;
  leerrouteMaxCents: number | null;
  pvtMaxCents: number | null;
  mapMaxCents: number | null;
  /** Extra time DUO grants *after* a fine. The core of mode E: being late is not the end. */
  extraTimeMonths: number | null;
  newHorizon: LegalDate | null;
  sourceId: string;
}

export interface Timeline {
  mode: ResultMode;
  law: Law;
  route: Route;
  termijnStart: LegalDate | null;
  termijnEnd: LegalDate | null;
  /** The component with the least room. The headline date on the result screen is *its* registerBy. */
  bindingComponent: ComponentId | null;
  /** Slack on the binding component minus our safety buffer. Negative means they will not make it. */
  bufferWeeks: number | null;
  components: ComponentPlan[];
  /** The order we advise, not the order DUO requires. KNM first: fastest win, and we teach it best. */
  recommendedOrder: ComponentId[];
  cost: CostProjection;
  extensions: ExtensionAssessment[];
  fine: FineExposure | null;
  naturalisation: NaturalisationPlan | null;
  warnings: Warning[];
  rulesVersion: string;
  computedAt: PlainDate;
}
