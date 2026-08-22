/**
 * The blank answer sheet.
 *
 * Every field starts at the value that means *"the user has not told us"*, never at a plausible
 * default. That distinction is the whole reason this file exists: a `route: 'b1'` default would make
 * an assumption invisible, while `'unknown'` makes `resolveRoute` mark it assumed and the page say
 * so. The wizard fills fields in as it goes and the result is renderable at any point.
 *
 * `courseHoursPerWeek: 0` is the one field where "not told us" and a real answer look alike — so
 * zero effective hours raises `no_study_hours_given` rather than producing a date.
 */
import type { TimelineInput } from './types';

export function emptyInput(): TimelineInput {
  return {
    law: 'unknown',
    status: 'unknown',
    route: 'unknown',
    anchor: { kind: 'unknown' },
    targetLevel: 'unknown',
    currentLevel: 'unknown',
    progress: {},
    courseHoursPerWeek: 0,
    selfStudyHoursPerWeek: 0,
    grantedExtensionMonths: 0,
    extensionSignals: [],
    wantsNaturalisation: false,
  };
}
