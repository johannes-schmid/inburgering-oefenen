/**
 * "Check jouw situatie" — three questions, one verdict.
 *
 * The hulpmiddel beside the fasen on `/inburgering`. It exists because the orienting reader's
 * actual question is not "what is inburgering" but *"does this apply to me"*, and answering that
 * from prose means reading two lists of six bullets and deciding which one you are in. Three taps
 * does the same work, and — this is the point — it then sends the reader **into** the guide at the
 * section that covers their answer, rather than replacing it.
 *
 * **Every rule below is a restatement of `data/guides/moet-ik-inburgeren.ts` §wie-moet-inburgeren,
 * which the docent reviewed, sourced to Rijksoverheid and inburgeren.nl (`SEO/facts.md` §10).**
 * Nothing here is a new claim, and nothing may become one: if a rule cannot be pointed at a line
 * in that guide, it does not belong in this file. That is also why the copy hedges — "geldt
 * waarschijnlijk", "meestal niet" — in every locale. DUO decides and sends a letter; a tool that
 * said "je hoeft niet in te burgeren" would be making a legal determination it cannot make, and
 * being wrong in the direction that costs someone a boete.
 *
 * Pure, and deliberately kept out of the component: the verdict table is the part worth pinning in
 * a test (`tests-unit/guide-situation.test.ts`), and the component is the part that will be
 * redesigned.
 */
import type { PhaseId } from '@/data/guides/phases';

export type Nationality = 'eu' | 'non_eu' | 'unknown';
export type StayReason = 'work_study' | 'family' | 'asylum' | 'unknown';
export type AgeBand = 'under_18' | 'working_age' | 'pension' | 'unknown';

export type SituationAnswers = {
  nationality?: Nationality;
  reason?: StayReason;
  age?: AgeBand;
};

/**
 * Three states, and `unclear` is a real answer rather than a failure.
 *
 * "Ik weet het niet" is offered on every question (the same first-class `unknown` the tijdlijn tool
 * treats as a value, not a gap), so a reader who knows none of the three must still get a useful
 * page. `unclear` is what makes that possible: it names what is missing and points at the section
 * that resolves it.
 */
export type Verdict = 'likely' | 'unlikely' | 'unclear';

export type SituationResult = {
  verdict: Verdict;
  /**
   * Which rule fired. The i18n key of both the headline and the explanation
   * (`inburgering_route.check.result.<reason>.*`), so adding a rule means adding copy in all three
   * locales rather than falling back to a generic sentence.
   */
  reason:
    | 'eu_citizen'
    | 'under_18'
    | 'pension_age'
    | 'temporary_stay'
    | 'permit_holder'
    | 'need_more';
  /** Where "Bekijk je eerste stap" goes: the guide slug plus the `<h2 id>` to land on. */
  next: { slug: string; sectionId: string; phase: PhaseId };
};

const READ_WIE = { slug: 'moet-ik-inburgeren', sectionId: 'wie-moet-inburgeren', phase: 'orienteren' as PhaseId };
const READ_HOE = { slug: 'moet-ik-inburgeren', sectionId: 'hoe-weet-ik-het', phase: 'orienteren' as PhaseId };
const READ_WET = { slug: 'moet-ik-inburgeren', sectionId: 'welke-wet', phase: 'orienteren' as PhaseId };

/**
 * The verdict table. **Order is load-bearing** — the exemptions are checked before the obligation.
 *
 * Nationality and age are decided first because they exempt regardless of why someone is here: an
 * EU citizen with a family permit is still not inburgeringsplichtig, and neither is a 16-year-old
 * under the leerplicht. Testing the reason first would have produced `likely` for both. Only once
 * those are ruled out does the reason for the stay decide, which is exactly the order the guide's
 * two columns are written in.
 */
export function evaluateSituation(a: SituationAnswers): SituationResult {
  if (a.nationality === 'eu') {
    return { verdict: 'unlikely', reason: 'eu_citizen', next: READ_WIE };
  }
  if (a.age === 'under_18') {
    return { verdict: 'unlikely', reason: 'under_18', next: READ_WIE };
  }
  if (a.age === 'pension') {
    return { verdict: 'unlikely', reason: 'pension_age', next: READ_WIE };
  }
  if (a.nationality === 'non_eu' && a.reason === 'work_study') {
    return { verdict: 'unlikely', reason: 'temporary_stay', next: READ_WIE };
  }
  if (
    a.nationality === 'non_eu' &&
    (a.reason === 'family' || a.reason === 'asylum') &&
    a.age === 'working_age'
  ) {
    /* The one `likely`. It still routes to "welke wet geldt voor jou" rather than to a deadline:
       which act applies depends on the date on the DUO letter, which the tool never asks for. */
    return { verdict: 'likely', reason: 'permit_holder', next: READ_WET };
  }
  return { verdict: 'unclear', reason: 'need_more', next: READ_HOE };
}

/** Whether all three questions have an answer — `unknown` counts, a missing value does not. */
export function isComplete(a: SituationAnswers): boolean {
  return Boolean(a.nationality && a.reason && a.age);
}
