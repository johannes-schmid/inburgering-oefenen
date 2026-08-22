# Technical Specification — Tijdlijn Builder

**Target stack:** Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · Resend · PostHog · Mollie
**Route:** `/[locale]/inburgering/tools/tijdlijn`
**Date:** 20 August 2026

---

## 1. Architecture principles

1. **The engine is a pure function.** `computeTimeline(input, rules, today) → Timeline`. No I/O, no React, no `Date.now()` inside. Everything testable in milliseconds.
2. **Rules are data, not code.** A versioned, schema-validated JSON document. Changing a fee is a data edit, not a deploy of logic.
3. **Legal facts and heuristics are separated at the type level**, not just visually. A `LegalDate` and an `EstimatedDate` are different types and cannot be assigned to one another. This makes it impossible to render an estimate with a "volgens DUO" badge by accident.
4. **Client-side only for the core path.** No PII crosses the network unless the user asks for an email. This is a privacy commitment *and* it makes the tool fast, cacheable, and fully static.
5. **URL is the state.** Serialisable input → shareable, bookmarkable, back-button-correct, no database.

---

## 2. Module layout

```
src/
  features/tijdlijn/
    engine/
      types.ts             // all domain types
      compute.ts           // computeTimeline — the pure core
      dates.ts             // calendar-safe date helpers
      estimate.ts          // study-hours model (heuristics only)
      cost.ts              // fee + payer projection
      extensions.ts        // eligibility evaluation
      naturalisation.ts    // residence + diploma clocks
      mode.ts              // result-mode selection
      __tests__/           // worked examples from 02-RULES-AND-DATA §11
    rules/
      inburgering-rules.v1.json
      schema.ts            // zod schema + parse-on-import
      staleness.ts         // CI check on checked_on dates
    state/
      encode.ts            // input <-> URL/query encoding
      storage.ts           // localStorage persistence
    ui/
      Landing.tsx
      Wizard/…
      Result/
        VerdictCard.tsx
        Timeline.tsx
        TimelineNode.tsx
        ShadowBar.tsx      // the signature element
        CostPanel.tsx
        ExtensionChecklist.tsx
        NaturalisationLeg.tsx
        WhatIfControls.tsx
        SourceRegister.tsx
      Diagnostic/          // wraps the existing question-bank component
    i18n/
      nl.json  en.json  ar.json
```

---

## 3. Domain types

```ts
// ---------- inputs ----------
export type Law = 'wi2021' | 'wi2013' | 'none' | 'unknown';
export type Status = 'asiel' | 'gezin_overig' | 'eu_niet_plichtig' | 'unknown';
export type Route = 'b1' | 'onderwijs' | 'z' | 'a2_wi2013' | 'naturalisatie_only' | 'unknown';
export type ComponentId =
  | 'lezen' | 'luisteren' | 'spreken' | 'schrijven'
  | 'knm' | 'ona' | 'map' | 'pvt' | 'z_eindgesprek';

export type ComponentProgress =
  | { state: 'not_started' }
  | { state: 'studying'; diagnosticScore?: number }   // 0..10
  | { state: 'registered'; examDate?: PlainDate }
  | { state: 'awaiting_result'; examDate: PlainDate }
  | { state: 'passed'; passedOn?: PlainDate }
  | { state: 'failed'; attempts: number };

export interface TimelineInput {
  law: Law;
  status: Status;
  route: Route;
  anchor:
    | { kind: 'pip'; date: PlainDate; precision: 'day' | 'month' }
    | { kind: 'duo_letter'; date: PlainDate; precision: 'day' | 'month' }
    | { kind: 'gemeente_registration'; date: PlainDate; precision: 'month' }
    | { kind: 'unknown' };
  targetLevel: 'a2' | 'b1' | 'b2' | 'unknown';
  currentLevel: 'a0' | 'a1' | 'a2' | 'b1' | 'unknown';
  progress: Partial<Record<ComponentId, ComponentProgress>>;
  courseHoursPerWeek: number;      // 0 if none
  selfStudyHoursPerWeek: number;
  grantedExtensionMonths: number;  // user-reported
  extensionSignals: ExtensionSignal[];
  wantsNaturalisation: boolean;
  residenceStart?: PlainDate;      // for the naturalisation clock
  locale: 'nl' | 'en' | 'ar';
}

// ---------- outputs ----------
/** A date that follows from law or a DUO-published lead time. Always cite. */
export interface LegalDate {
  readonly _tag: 'legal';
  date: PlainDate;
  ruleId: string;          // -> rules registry
  sourceId: string;        // -> source register (S1..S15)
}

/** A date that follows from our planning model. Always a range. */
export interface EstimatedDate {
  readonly _tag: 'estimate';
  earliest: PlainDate;
  latest: PlainDate;
  basis: 'study_model' | 'diagnostic' | 'default_assumption';
  confidence: 'low' | 'medium' | 'high';
}

export type TimelineDate = LegalDate | EstimatedDate;

export interface ComponentPlan {
  id: ComponentId;
  required: boolean;
  readyBy: EstimatedDate | null;
  registerBy: LegalDate;        // derived from termijnEnd and DUO lead times
  latestExamDate: LegalDate;
  resultWindowWeeks: number;
  slackWeeks: number;           // registerBy - readyBy.latest
  feeCents: number;
  payer: 'self' | 'gemeente' | 'loan_possible' | 'free';
  freeAttemptsRemaining: number | null;
  expectedAttempts: number;
  practiceHref?: string;
}

export type ResultMode =
  | 'pre_clock' | 'on_track' | 'tight' | 'at_risk'
  | 'overdue' | 'exempt' | 'naturalisation_only' | 'estimate_mode';

export interface Timeline {
  mode: ResultMode;
  law: Law;
  termijnStart: LegalDate | null;
  termijnEnd: LegalDate | null;
  bindingComponent: ComponentId | null;
  bufferWeeks: number | null;
  components: ComponentPlan[];
  cost: CostProjection;
  extensions: ExtensionAssessment[];
  naturalisation: NaturalisationPlan | null;
  warnings: Warning[];
  rulesVersion: string;
  computedAt: PlainDate;
}
```

`PlainDate` is a `{ y, m, d }` value object (or `Temporal.PlainDate` where available) — **never a JS `Date`**. Timezone bugs in a deadline calculator are unacceptable, and `Date` will give you one eventually.

---

## 4. Date arithmetic rules

```ts
// dates.ts — the only place calendar maths is allowed
addYears(d, n)   // 2024-02-29 + 3y -> 2027-02-28 (clamp, never roll over)
addWeeks(d, n)
addMonths(d, n)  // clamp end-of-month
diffWeeks(a, b)  // whole weeks, floor
```

- Everything in `Europe/Amsterdam`, but computed as plain calendar dates — no instants, no UTC conversion.
- `today` is **injected**, never read inside the engine. Tests pin it; the UI passes it once at the root.
- Month-precision inputs produce a range: compute with both the first and last day of the month and return the wider interval. Mark the output `confidence: 'low'`.

---

## 5. Rules file contract

```ts
// schema.ts
export const RulesSchema = z.object({
  version: z.string(),                       // "2026.08.20"
  sources: z.record(SourceSchema),           // S1..S15
  legal: z.object({
    laws: z.record(LawRulesSchema),
    fees: z.record(FeeSchema),
    leadTimes: z.record(LeadTimeSchema),
    extensions: z.array(ExtensionRuleSchema),
    fines: z.record(FineRuleSchema),
    exemptions: z.array(ExemptionRuleSchema),
    naturalisation: NaturalisationRulesSchema,
  }),
  planning: z.object({                       // ours, never badged as DUO
    studyHours: z.record(HourBandSchema),
    diagnosticMultipliers: z.record(z.number()),
    expectedAttempts: z.record(z.number()),
    safetyBufferWeeks: z.number(),
  }),
});
```

Every entry under `legal` requires `sourceId`, `checkedOn` and optionally `effectiveFrom` / `effectiveTo` / `status: 'in_force' | 'proposed' | 'superseded'`.

**CI gate (`staleness.ts`):**
- any `legal` rule with `checkedOn` older than **180 days** → build warning
- any rule tagged `volatile: true` (fines/Raad van State, the 16-week notice) older than **90 days** → build **failure**
- any `status: 'proposed'` rule with `effectiveFrom` in the past → build failure (it either commenced or was withdrawn; a human must decide)

Rules are imported and parsed once at module load. A parse failure fails the build, not the runtime.

---

## 6. The compute pipeline

```ts
export function computeTimeline(
  input: TimelineInput,
  rules: Rules,
  today: PlainDate,
): Timeline {
  const law          = resolveLaw(input, rules);                // explicit or derived from anchor vs 2022-01-01
  const termijn      = resolveTermijn(input, law, rules);       // start, end (+ user-reported extensions)
  const required     = requiredComponents(law, input.route, input.status, rules);
  const components   = required.map(id => planComponent(id, input, termijn, rules, today));
  const binding      = minBy(components.filter(c => !isDone(c)), c => c.slackWeeks) ?? null;
  const buffer       = binding ? binding.slackWeeks - rules.planning.safetyBufferWeeks : null;
  const mode         = selectMode({ law, termijn, buffer, today, input });
  return {
    mode, law,
    termijnStart: termijn?.start ?? null,
    termijnEnd:   termijn?.end   ?? null,
    bindingComponent: binding?.id ?? null,
    bufferWeeks: buffer,
    components,
    cost:           projectCost(components, input, rules),
    extensions:     assessExtensions(input, termijn, rules, today),
    naturalisation: input.wantsNaturalisation ? planNaturalisation(input, components, rules, today) : null,
    warnings:       collectWarnings(input, law, mode),
    rulesVersion:   rules.version,
    computedAt:     today,
  };
}
```

`planComponent` is where the product insight lives:

```ts
const resultWeeks   = resultLeadWeeks(id, input.targetLevel, rules);   // 8, or 16 for A2 spreken/schrijven
const latestExam    = addWeeks(termijn.end, -resultWeeks);
const registerBy    = addWeeks(latestExam, -rules.legal.leadTimes.registration.weeks);  // 7
const readyBy       = estimateReadiness(id, input, rules, today);      // EstimatedDate | null
const slackWeeks    = readyBy ? diffWeeks(readyBy.latest, registerBy) : Infinity;
```

**Design note:** `latestExam` and `registerBy` are typed `LegalDate` because they are pure arithmetic on published DUO lead times — but their `ruleId` must point at the lead-time rule, and the UI copy must say *"based on DUO's stated waiting times"*, not *"DUO's deadline"*. That distinction lives in the i18n string, keyed by `ruleId`.

---

## 7. State, URL and persistence

**Encoding.** Compact, positional, versioned:

```
?t=1.KpH-2025-05-12.gz.b1.a2.knm~s6,lez~n,lui~n,spr~n,sch~n.6-3.0.nat1
  │ │                │  │  │   │                              │   │ │
  │ │                │  │  │   progress per component         │   │ wants naturalisation
  │ │                │  │  target level                       │   granted extension months
  │ │                │  route                                 course/self-study hours
  │ │                status
  │ anchor kind + date
  schema version
```

- Round-trip tested (`encode(decode(s)) === s`) with fast-check property tests.
- Version prefix means old shared links keep working; unknown versions fall back to the wizard with a friendly note.
- Also mirrored to `localStorage` under `tijdlijn:v1:last` so returning visitors land on their timeline.

**No PII.** Nothing in the URL identifies a person. A date and a route are not identifying, and the URL never touches a server log with a user id attached.

---

## 8. Rendering strategy

| Route | Strategy |
|---|---|
| `/[locale]/inburgering/tools/tijdlijn` (no query) | **Static** — prerendered landing, cached at the edge |
| Same route with `?t=…` | Static shell, client hydrates and computes; result rendered client-side |
| SEO landing variants (`/inburgering/deadline`, `/inburgering/wat-kost-inburgeren`, `/inburgering/termijn-verlopen`) | **Static** pages with real editorial content + a pre-filled CTA into the tool |

Because the engine is pure and small, there is no server rendering of results and therefore no server-side personal data. Ship the rules JSON in the client bundle (target ≤ 40 KB gzipped; it will be far smaller).

---

## 9. Diagnostic integration

Reuse the existing question-bank component rather than forking it.

```ts
interface DiagnosticResult {
  component: ComponentId;
  score: number;          // 0..10
  takenAt: PlainDate;
  questionSetVersion: string;
}
```

- Mounted inline in a `TimelineNode`; on completion it dispatches `progress[component] = { state:'studying', diagnosticScore: score }` and the whole timeline recomputes (cheap — pure function, sub-millisecond).
- The UI animates the delta by diffing the previous and next `ComponentPlan.readyBy`.
- Scores persist in `localStorage` and encode into the URL so a shared timeline carries them.
- **Do not** send diagnostic answers anywhere. Score only, and only into PostHog as an aggregate event.

---

## 10. Analytics

PostHog, client-side, no PII:

```ts
timeline_started            { locale, entry_path }
timeline_step_completed     { step, answer_known: boolean }
timeline_abandoned          { step }
timeline_computed           { mode, law, route, status, buffer_weeks_bucket, rules_version }
timeline_diagnostic_started { component }
timeline_diagnostic_done    { component, score }
timeline_whatif_used        { type: 'hours'|'passed'|'extension'|'retake' }
timeline_saved              { method: 'email'|'pdf'|'ics'|'link' }
timeline_cta_clicked        { target, component }
```

Bucket `buffer_weeks` (`<0`, `0-12`, `12-26`, `26-52`, `>52`) rather than logging the raw value — it's less identifying and more useful.

Wire `timeline_computed{mode}` into an A/B test on the verdict-card CTA: for `tight` and `at_risk` users, does "start practising" or "check if you qualify for extra time" convert better? That's the first experiment to run.

---

## 11. Email, save and upsell

- **Email capture** → Resend, storing `{ email, encoded_state, locale, created_at }` in Supabase. That's the entire record. No name, no status, no dates as columns — the state string is opaque and self-contained.
- **Reminder job:** a scheduled function that decodes stored states and emails at `registerBy − 8 weeks` for the binding component. This is the single most valuable retention mechanic in the product: an email that says *"you should register for your KNM exam this month"* arriving at exactly the right time.
- **Upsell:** the verdict CTA links into the relevant practice product with `?from=tijdlijn&component=knm`, so Mollie conversions attribute back to the tool.
- Consent: explicit checkbox for reminders, separate from the "send me my timeline" action. Unsubscribe in every mail.

---

## 12. Testing

**Unit (vitest), the non-negotiable core:**
- All four worked examples from `02-RULES-AND-DATA §11` as golden tests with pinned `today`.
- Leap-year and end-of-month boundaries for `addYears`/`addMonths`.
- Every extension rule: one qualifying and one near-miss case each.
- Every fine table row for post-fine extra time.
- Mode selection: one test per mode, plus the boundaries (`buffer = 0`, `buffer = 12`, `today = termijnEnd`).
- Free-attempt logic for asylum status holders under Wi2021, including the "below PIP level" exclusion.

**Property tests (fast-check):**
- `computeTimeline` never throws for any structurally valid input, including all-unknown.
- `termijnEnd ≥ termijnStart` always; `registerBy < latestExamDate < termijnEnd` always.
- URL encode/decode round-trips.

**Snapshot:** rendered timeline for each of the eight modes, in NL and AR (RTL).

**E2E (Playwright):** complete the wizard with all-unknown answers and still reach a rendered result; complete a diagnostic and assert the node's date moves; print stylesheet renders one page.

**Rule-drift test:** a scheduled job that fetches the DUO fee and lead-time pages and diffs against `rules.json`, opening an issue on change. It won't catch everything, but it catches the fee indexation and the 16-week notice, which are the two most likely silent breakages.

---

## 13. Build sequence

| Step | Deliverable | Gate |
|---|---|---|
| 1 | `types.ts` + `dates.ts` + tests | leap-year tests green |
| 2 | `inburgering-rules.v1.json` + zod schema + staleness CI | schema parses, no stale rules |
| 3 | `compute.ts` + all four worked examples | golden tests green |
| 4 | `estimate.ts`, `cost.ts`, `extensions.ts` | per-rule tests green |
| 5 | Wizard UI (NL) | all-unknown path reaches a result |
| 6 | Timeline + ShadowBar + VerdictCard | eight mode snapshots |
| 7 | Diagnostic wiring + recompute animation | node moves on completion |
| 8 | What-if, cost panel, extension checklist | — |
| 9 | Encode/decode, localStorage, print CSS, `.ics` | round-trip property tests |
| 10 | Email + reminders + PostHog | events firing in staging |
| 11 | EN + AR, RTL mirror | RTL snapshot review |
| 12 | SEO landing variants | Lighthouse ≥ 95, indexable |

Steps 1–4 are where the product succeeds or fails. Do not start step 5 until the golden tests pass.

---

## 14. Risks specific to implementation

| Risk | Mitigation |
|---|---|
| `Date` timezone bugs shifting a deadline by a day | `PlainDate` value object, no `Date` in the engine, lint rule banning `new Date()` outside `dates.ts` |
| Rules drift silently | staleness CI + scheduled diff job + visible "rules checked on" in the UI |
| RTL retrofit pain | logical CSS properties from commit one; AR in the snapshot suite from step 11, but the layout built for it from step 6 |
| Bundle bloat from the rules file | rules are plain JSON, tree-shaken per locale; measure in CI, budget 40 KB |
| The engine grows a dependency on React state | engine directory has no React import; enforced by an ESLint boundary rule |
| Someone "helpfully" adds a server round-trip for personalisation | documented as an architectural invariant here; the privacy claim on the landing page depends on it |
