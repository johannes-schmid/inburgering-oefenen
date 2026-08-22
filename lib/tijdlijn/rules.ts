/**
 * The rules document: every legal fact the tijdlijn engine computes with, as data rather than code.
 *
 * Changing a fee or a waiting time is a **data edit**, not a logic deploy. That is the whole point:
 * DUO indexes the exam fees, publishes temporary notices about result queues, and loses court cases
 * that change who can be fined. Any of those arriving as a code change would mean a rules update is
 * gated on a developer.
 *
 * Two things this module guarantees:
 *
 * 1. **It parses at module load, and a parse failure fails the build** — not the request. A rules
 *    file with a typo'd fee must never reach a browser, because the failure mode is a confidently
 *    wrong number on a page about somebody's legal deadline.
 * 2. **`legal` and `planning` are separate branches and stay separate.** Anything under `legal`
 *    carries `sourceId` + `checkedOn` and may be rendered with a "volgens DUO" badge. Anything under
 *    `planning` is ours, is always a range, and may never be. See `engine/types.ts`.
 *
 * The schema is deliberately **loose where the engine does not read**. A full schema over every
 * nested rule would be a second copy of the document that drifts from the first; `z.looseObject`
 * validates the shape the engine depends on and passes the rest through for the source panel and
 * the staleness check to render.
 */
import { z } from 'zod';
import raw from '@/data/tijdlijn/inburgering-rules.v1.json';

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkedOn must be YYYY-MM-DD');
const Band = z.tuple([z.number(), z.number()]);

const SourceSchema = z.looseObject({
  name: z.string(),
  url: z.string(),
  checkedOn: IsoDate,
  authority: z.enum(['primary', 'secondary_expert', 'secondary']),
  /* `volatile` shortens the re-check interval from 180 to 90 days and makes staleness a build
   * failure rather than a warning — the fines rule and the 16-week notice are both live. */
  volatile: z.boolean().optional(),
  needsPrimaryConfirmation: z.boolean().optional(),
});

const LeadTimeSchema = z.looseObject({
  /* Optional as well as nullable: `changeOrCancel` is expressed as `weeksBefore`, because "up to one
   * week before the exam" is a different shape of fact from "eight weeks after it". Both belong in
   * `leadTimes`; only the ones the engine plans with are guaranteed to have `weeks`. */
  weeks: z.number().nullable().optional(),
  sourceId: z.string().optional(),
  checkedOn: IsoDate.optional(),
  status: z.string().optional(),
  volatile: z.boolean().optional(),
});

const RouteSchema = z.looseObject({
  law: z.enum(['wi2021', 'wi2013']),
  languageLevel: z.string(),
  required: z.array(z.string()),
  optional: z.array(z.string()).optional(),
  sourceId: z.string(),
  checkedOn: IsoDate,
});

const ExtensionRuleSchema = z.looseObject({
  id: z.string(),
  laws: z.array(z.string()),
  status: z.array(z.string()).optional(),
  grantMonths: z.number().optional(),
  automatic: z.boolean(),
  conditions: z.array(z.string()).optional(),
  decisionWeeks: z.number().optional(),
  sourceId: z.string(),
  checkedOn: IsoDate,
});

export const RulesSchema = z.object({
  version: z.string(),
  note: z.string(),
  sources: z.record(z.string(), SourceSchema),
  legal: z.looseObject({
    laws: z.record(
      z.string(),
      z.looseObject({
        termijnYears: z.number(),
        termijnStart: z.looseObject({ rule: z.string(), sourceId: z.string() }),
        duoLetterLeadWeeks: z.number(),
      }),
    ),
    routes: z.record(z.string(), RouteSchema),
    fees: z.record(z.string(), z.looseObject({}).and(z.record(z.string(), z.unknown()))),
    payer: z.record(z.string(), z.looseObject({})),
    leadTimes: z.record(z.string(), LeadTimeSchema),
    extensions: z.array(ExtensionRuleSchema),
    extensionMeta: z.looseObject({ onePerPeriod: z.boolean(), decidedBy: z.string() }),
    fines: z.looseObject({}),
    exemptions: z.array(z.looseObject({ id: z.string(), laws: z.array(z.string()) })),
    naturalisation: z.looseObject({}),
  }),
  planning: z.object({
    disclaimer: z.string(),
    studyHours: z.record(z.string(), Band),
    selfStudyWeighting: z.number(),
    diagnosticMultipliers: z.record(z.string(), z.number()),
    expectedAttempts: z.record(z.string(), z.number()),
    safetyBufferWeeks: z.number(),
    modeThresholds: z.object({ onTrackMinBufferWeeks: z.number(), tightMinBufferWeeks: z.number() }),
    recommendedOrder: z.array(z.string()),
    recommendedOrderRationale: z.string(),
    componentBaseWeeks: z.record(z.string(), Band),
    componentBaseWeeksRationale: z.string(),
    examSpacingWeeks: z.number(),
    examSpacingRationale: z.string(),
    maxPlanningHorizonWeeks: z.number(),
  }),
});

export type Rules = z.infer<typeof RulesSchema>;

/* Parsed once, at import. `parse` and not `safeParse`: there is no sensible degraded mode for a
 * broken rules file, and a thrown error at build time is exactly the outcome we want. */
export const RULES: Rules = RulesSchema.parse(raw);

export const RULES_VERSION = RULES.version;

/** Cents for one attempt at one component under one law, for one status. `null` = not applicable. */
export function feeCents(law: 'wi2021' | 'wi2013', component: string, status: string): number | null {
  const table = RULES.legal.fees[law] as Record<string, unknown> | undefined;
  if (!table) return null;
  const v = table[component];
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') {
    const per = v as Record<string, number>;
    /* Wi2013's PVT: `{ asiel: 0, other: 15000 }`. An unknown status pays the higher figure —
     * over-quoting a fee is recoverable, under-quoting one is a false promise about money. */
    return per[status] ?? per.other ?? null;
  }
  return null;
}

/** A weeks value from `legal.leadTimes`, with the fallback the caller must justify. */
export function leadWeeks(key: string, fallback: number): { weeks: number; known: boolean; sourceId: string } {
  const lt = RULES.legal.leadTimes[key];
  if (!lt || lt.weeks === null || lt.weeks === undefined) {
    return { weeks: fallback, known: false, sourceId: lt?.sourceId ?? 'S7' };
  }
  return { weeks: lt.weeks, known: true, sourceId: lt.sourceId ?? 'S7' };
}
