/**
 * Extra tijd — who might already have it, and who could ask for it.
 *
 * The valuable one is `many_hours_*` under Wi2021: **six extra months, granted automatically, no
 * application, and almost nobody knows it exists.** DUO grants it when seven conditions are all
 * true, and six of the seven are things the wizard already asked about. That is why this is a
 * checklist widget and not a paragraph: "you may already have six extra months — check these seven
 * boxes" is the most useful sentence in the whole tool.
 *
 * Everything here is **informational**. DUO decides, and the verdicts are `likely | possible |
 * unlikely`, never "you have". The engine also never *adds* an assessed extension to the term — only
 * `input.grantedExtensionMonths`, which is the user telling us DUO already granted it — because a
 * plan built on an extension that gets refused is the one failure mode that actually hurts someone.
 */
import { diffDays, type PlainDate } from './dates';
import type { ConditionVerdict, ExtensionAssessment, ExtensionSignal, TimelineInput } from './types';
import type { Rules } from '../rules';

const LANGUAGE = ['lezen', 'luisteren', 'spreken', 'schrijven'] as const;

/** Maps a condition id in the rules file onto what the wizard actually knows. */
function evaluateCondition(
  key: string,
  input: TimelineInput,
  termijnStart: PlainDate | null,
  today: PlainDate,
): ConditionVerdict {
  const passed = (id: string) => input.progress[id as keyof typeof input.progress]?.state === 'passed';
  const passedLanguage = LANGUAGE.filter(id => passed(id)).length;

  switch (key) {
    case 'route_b1_including_afgeschaald':
      return input.route === 'b1' ? 'met' : input.route === 'unknown' ? 'unknown' : 'not_met';

    case 'termijn_started_at_least_30_months_ago':
      /* 30 months, expressed in days against the real start date rather than a month count, so a
       * term that began on the 31st cannot round itself over the threshold. */
      if (!termijnStart) return 'unknown';
      return diffDays(termijnStart, today) >= Math.round(30 * 30.436875) ? 'met' : 'not_met';

    case 'passed_at_least_2_of_4_language_exams_at_pip_level_or_higher':
      /* We know how many they passed, not at which level. Two or more is the checkable half; the
       * level condition stays visible in the copy as the thing DUO will look at. */
      return passedLanguage >= 2 ? 'met' : 'not_met';

    case 'knm_passed':
      return passed('knm') ? 'met' : 'not_met';

    case 'pvt_completed':
      return passed('pvt') ? 'met' : 'not_met';

    case 'map_completed':
      return passed('map') ? 'met' : 'not_met';

    case 'child_born_within_termijn':
      return input.extensionSignals.includes('childbirth') ? 'met' : 'not_met';

    /* Attendance, hours at a keurmerk school, and gender are all things we deliberately do not ask.
     * They stay `unknown` and render as an open box the reader ticks themselves — which is also what
     * makes the checklist double as an input. Guessing them would fabricate an entitlement. */
    default:
      return 'unknown';
  }
}

export function assessExtensions(
  input: TimelineInput,
  termijnStart: PlainDate | null,
  rules: Rules,
  today: PlainDate,
): ExtensionAssessment[] {
  const law = input.law;
  if (law !== 'wi2021' && law !== 'wi2013') return [];

  return rules.legal.extensions
    .filter(rule => {
      if (!rule.laws.includes(law)) return false;
      /* A rule scoped to a status only applies to that status — the asiel and gezin variants of the
       * six-month extension have different hour conditions and must not both be offered. */
      if (rule.status && !rule.status.includes(input.status)) return false;
      /* The free-text grounds (illness, homelessness, a school that failed) have no checkable
       * conditions, so they surface only when the wizard's Q9 signal says they might apply. */
      if (!rule.conditions) return SIGNAL_FOR_RULE[rule.id] !== undefined
        ? input.extensionSignals.includes(SIGNAL_FOR_RULE[rule.id]!)
        : false;
      return true;
    })
    .map(rule => {
      const conditions = (rule.conditions ?? []).map(key => ({
        key,
        verdict: evaluateCondition(key, input, termijnStart, today),
      }));
      const anyFailed = conditions.some(c => c.verdict === 'not_met');
      const allMet = conditions.length > 0 && conditions.every(c => c.verdict === 'met');
      return {
        id: rule.id,
        automatic: rule.automatic,
        grantMonths: rule.grantMonths ?? 0,
        verdict: allMet ? 'likely' : anyFailed ? 'unlikely' : 'possible',
        conditions,
        decisionWeeks: rule.decisionWeeks ?? null,
        sourceId: rule.sourceId,
      } satisfies ExtensionAssessment;
    })
    /* Most useful first: an automatic grant they may already hold, then the ones they could apply
     * for. A list sorted by the rules file's order buries the six-month case under "other reason". */
    .sort((a, b) => {
      const rank = (x: ExtensionAssessment) =>
        (x.verdict === 'likely' ? 0 : x.verdict === 'possible' ? 1 : 2) + (x.automatic ? 0 : 0.5);
      return rank(a) - rank(b);
    });
}

/** Which wizard answer makes an unconditioned ground worth showing at all. */
const SIGNAL_FOR_RULE: Record<string, ExtensionSignal | undefined> = {
  literacy_course: 'literacy_course',
  dutch_education: 'dutch_education',
  illness_self_or_family: 'illness',
  death_of_family_member: 'death_in_family',
  homeless_or_shelter: 'homeless_or_shelter',
  gemeente_or_school_failure: 'gemeente_or_school_failure',
  other_reason: undefined,
};
