/**
 * The four worked examples from `docs/tijdlijn/02-RULES-AND-DATA.md` §11, plus the invariants.
 *
 * These are golden tests with a **pinned `today`** (20 August 2026, the date the rules were verified),
 * because a deadline calculator whose tests drift with the wall clock tests nothing.
 *
 * ## One documented disagreement with the source document
 *
 * The doc's Example 1 states `buffer ≈ 63 weeks → MODE B (on track)` for Amira, and that figure is
 * not reproducible from its own algorithm. She is on the **B1**-route from A0 at 6 course + 3
 * self-study hours a week; the doc's own study bands make A0→B1 650–1,100 guided hours, which at 7.5
 * effective hours a week is 87–147 weeks — well past the 67 weeks she has until her last safe
 * registration date. The engine therefore returns **at_risk**, and that is the useful answer: at
 * that pace she genuinely will not reach B1 inside the term, which is exactly the conversation the
 * tool exists to start (intensify, or afschalen to A2 after 600 hours).
 *
 * The doc appears to have computed its buffer from the KNM node alone. What is pinned below is the
 * part both agree on and that is not a matter of modelling — **the dates**: term start, term end,
 * latest exam date and latest registration date. Those are pure arithmetic on published DUO lead
 * times, and they match the doc exactly. See the note at the end of this file.
 */
import { describe, expect, it } from 'vitest';
import { computeTimeline, resolveLaw, resolveTermijn } from '@/lib/tijdlijn/engine/compute';
import { emptyInput } from '@/lib/tijdlijn/engine/input';
import { addWeeks, diffWeeks, pd, toEpochDay, toISO } from '@/lib/tijdlijn/engine/dates';
import { buildAgenda, nextActions } from '@/lib/tijdlijn/agenda';
import { RULES } from '@/lib/tijdlijn/rules';
import type { TimelineInput } from '@/lib/tijdlijn/engine/types';

const TODAY = pd(2026, 8, 20);
const run = (input: TimelineInput, today = TODAY) => computeTimeline(input, RULES, today);

// ────────────────────────────── Example 1 — Amira ──────────────────────────────

const amira = (): TimelineInput => ({
  ...emptyInput(),
  law: 'wi2021',
  status: 'gezin_overig',
  route: 'b1',
  anchor: { kind: 'pip', date: pd(2025, 5, 12), precision: 'day' },
  targetLevel: 'b1',
  currentLevel: 'a0',
  courseHoursPerWeek: 6,
  selfStudyHoursPerWeek: 3,
  progress: { knm: { state: 'studying', diagnosticScore: 6 } },
});

describe('Example 1 — Amira, gezinsmigrant, Wi2021, B1-route', () => {
  const t = run(amira());

  it('starts the term the day after the PIP date, not on it', () => {
    expect(toISO(t.termijnStart!.date)).toBe('2025-05-13');
  });

  it('ends the term three years later', () => {
    expect(toISO(t.termijnEnd!.date)).toBe('2028-05-13');
  });

  it('plans backwards from the result queue, not from the deadline', () => {
    /* Schrijven at B1 has no captured NT2 lead time, so it falls back to 8 weeks *with a warning*.
     * Lezen is the same shape; both must land 8 + 7 = 15 weeks before the deadline. */
    const lezen = t.components.find(c => c.id === 'lezen')!;
    expect(toISO(lezen.latestExamDate!.date)).toBe('2028-03-18');
    expect(toISO(lezen.registerBy!.date)).toBe('2028-01-29');
  });

  it('is honest that reaching B1 from A0 at 7.5 effective hours a week does not fit', () => {
    /* The doc says mode B; its own study bands say otherwise. See the file header. */
    expect(t.mode).toBe('at_risk');
    expect(t.bufferWeeks!).toBeLessThan(0);
  });

  it('warns that the NT2 B1 result lead time was never captured', () => {
    expect(t.warnings.map(w => w.id)).toContain('nt2_result_lead_unknown');
  });

  it('quotes 5 × €50 with retakes, and the loan she may take', () => {
    expect(t.cost.bestCaseCents).toBe(25000);
    /* Only KNM has a diagnostic (6/10 → 1.5 attempts, rounded up to 2). The other four are unknown,
     * which is also 1.5 → 2. So five components at two attempts each. */
    expect(t.cost.expectedCents).toBe(50000);
    expect(t.cost.canBorrowFromDuo).toBe(true);
    expect(t.cost.loanNote).toBe('income_dependent');
  });

  it('charges her for PVT and MAP: nothing', () => {
    const pvt = t.cost.lines.find(l => l.id === 'pvt')!;
    expect(pvt.feeCents).toBe(0);
    expect(pvt.payer).toBe('free');
  });
});

// ────────────────────────────── Example 2 — Yonas ──────────────────────────────

const yonas = (): TimelineInput => ({
  ...emptyInput(),
  law: 'wi2021',
  status: 'asiel',
  route: 'b1',
  anchor: { kind: 'pip', date: pd(2024, 6, 2), precision: 'day' },
  targetLevel: 'b1',
  currentLevel: 'a2',
  courseHoursPerWeek: 8,
  selfStudyHoursPerWeek: 4,
  progress: {
    lezen: { state: 'passed' },
    luisteren: { state: 'passed' },
    knm: { state: 'passed' },
    pvt: { state: 'passed' },
    map: { state: 'passed' },
  },
});

describe('Example 2 — Yonas, asielstatushouder, 26 months in', () => {
  const t = run(yonas());

  it('ends the term on 3 June 2027', () => {
    expect(toISO(t.termijnEnd!.date)).toBe('2027-06-03');
  });

  it('finds the automatic six-month extension, and is honest that he is not there yet', () => {
    /* **The source document's Example 2 is wrong on this point and the engine is right.** The doc
     * says all seven conditions are met at 26 months in. One of the seven is that the term started
     * *at least 2.5 years* ago — 30 months — so at 26 months it cannot be met yet, and the tool
     * must not tell him he has time he does not have. What it says instead is more useful: here is
     * the entitlement, here is the one box still open, and it opens by itself in four months. */
    const auto = t.extensions.find(e => e.id === 'many_hours_asiel_wi2021')!;
    expect(auto.automatic).toBe(true);
    expect(auto.grantMonths).toBe(6);
    expect(auto.verdict).toBe('unlikely');
    expect(auto.conditions.filter(c => c.verdict === 'not_met').map(c => c.key)).toEqual([
      'termijn_started_at_least_30_months_ago',
    ]);
    /* Everything else he has actually done is ticked, so the checklist reads as progress. */
    expect(auto.conditions.find(c => c.key === 'knm_passed')!.verdict).toBe('met');
    expect(auto.conditions.find(c => c.key === 'passed_at_least_2_of_4_language_exams_at_pip_level_or_higher')!.verdict).toBe('met');
  });

  it('does tick the 30-month condition four months later', () => {
    const later = run(yonas(), pd(2026, 12, 20));
    const auto = later.extensions.find(e => e.id === 'many_hours_asiel_wi2021')!;
    expect(auto.conditions.find(c => c.key === 'termijn_started_at_least_30_months_ago')!.verdict).toBe('met');
    /* Attendance of every PIP lesson is a condition we deliberately never ask about, so it stays
     * unknown and the reader ticks it. Nothing contradicts the grant → `possible`, never "you have". */
    expect(auto.verdict).toBe('possible');
  });

  it('does not offer him the gezinsmigrant variant of the same extension', () => {
    expect(t.extensions.map(e => e.id)).not.toContain('many_hours_gezin_wi2021');
  });

  it('gives him two free attempts on each exam he has not passed', () => {
    expect(t.components.find(c => c.id === 'spreken')!.freeAttemptsRemaining).toBe(2);
    expect(t.components.find(c => c.id === 'spreken')!.payer).toBe('gemeente');
  });

  it('costs him nothing in the best case, and only the third attempt beyond it', () => {
    expect(t.cost.bestCaseCents).toBe(0);
    expect(t.cost.expectedCents).toBe(0);
  });

  it('never quotes him a fine, and says so', () => {
    expect(t.warnings.map(w => w.id)).toContain('asiel_never_fined');
    expect(t.cost.canBorrowFromDuo).toBe(false);
    expect(t.cost.loanNote).toBe('not_allowed');
  });

  it('does not count a passed exam as work still to do', () => {
    expect(t.components.find(c => c.id === 'lezen')!.done).toBe(true);
    expect(t.components.find(c => c.id === 'lezen')!.readyBy).toBeNull();
    expect(t.bindingComponent).not.toBe('lezen');
  });
});

// ────────────────────────────── Example 3 — Kwame ──────────────────────────────

const kwame = (): TimelineInput => ({
  ...emptyInput(),
  law: 'wi2013',
  status: 'gezin_overig',
  route: 'a2_wi2013',
  anchor: { kind: 'duo_letter', date: pd(2023, 2, 14), precision: 'day' },
  targetLevel: 'a2',
  currentLevel: 'a1',
  courseHoursPerWeek: 4,
  selfStudyHoursPerWeek: 2,
  progress: { lezen: { state: 'passed' } },
});

describe('Example 3 — Kwame, Wi2013, term expired', () => {
  const t = run(kwame());

  it('ended on 14 February 2026', () => {
    expect(toISO(t.termijnEnd!.date)).toBe('2026-02-14');
    expect(t.mode).toBe('overdue');
  });

  it('shows the maximum fine and never a personal figure', () => {
    expect(t.fine!.applies).toBe(true);
    expect(t.fine!.leerrouteMaxCents).toBe(125000);
  });

  it('gives him two years more and a new horizon, because being late is not the end', () => {
    expect(t.fine!.extraTimeMonths).toBe(24);
    expect(toISO(t.fine!.newHorizon!.date)).toBe('2028-02-14');
  });

  it('still requires ONA under Wi2013, and prices it at €40', () => {
    const ona = t.components.find(c => c.id === 'ona')!;
    expect(ona.required).toBe(true);
    expect(ona.feeCents).toBe(4000);
  });

  it('models ONA as three queues, not one — 6 + 6 + 8 weeks', () => {
    expect(t.components.find(c => c.id === 'ona')!.resultWindowWeeks).toBe(20);
  });

  it('charges him €150 for PVT, because he is not an asielstatushouder', () => {
    expect(t.components.find(c => c.id === 'pvt')!.feeCents).toBe(15000);
  });
});

// ────────────────────────────── Example 4 — Marta ──────────────────────────────

const marta = (): TimelineInput => ({
  ...emptyInput(),
  law: 'none',
  status: 'eu_niet_plichtig',
  route: 'naturalisatie_only',
  targetLevel: 'a2',
  currentLevel: 'a0',
  courseHoursPerWeek: 8,
  selfStudyHoursPerWeek: 0,
  wantsNaturalisation: true,
  residenceStart: pd(2023, 9, 1),
});

describe('Example 4 — Marta, EU citizen, passport path', () => {
  const t = run(marta());

  it('has no term and no deadline', () => {
    expect(t.termijnStart).toBeNull();
    expect(t.termijnEnd).toBeNull();
    expect(t.mode).toBe('naturalisation_only');
  });

  it('makes her eligible five years after registering', () => {
    expect(toISO(t.naturalisation!.residenceEligibleFrom!.date)).toBe('2028-09-01');
  });

  it('names the residence clock as the binding one', () => {
    expect(t.naturalisation!.bindingClock).toBe('residence');
  });

  it('quotes the 2026 single standard fee of €1,139', () => {
    expect(t.naturalisation!.feeCents).toBe(113900);
  });

  it('flags the pending 5→10 year bill without applying it', () => {
    expect(t.naturalisation!.pendingLawWarning).toBe(true);
    expect(toISO(t.naturalisation!.residenceEligibleFrom!.date)).toBe('2028-09-01');
  });

  it('still plans the A2 set she needs for the diploma', () => {
    expect(t.components.map(c => c.id).sort()).toEqual(['knm', 'lezen', 'luisteren', 'schrijven', 'spreken']);
  });
});

// ────────────────────────────── law derivation ──────────────────────────────

describe('resolveLaw derives the law from the anchor when the user does not know it', () => {
  it('on or after 1 January 2022 is Wi2021', () => {
    const i = { ...emptyInput(), anchor: { kind: 'pip' as const, date: pd(2022, 1, 1), precision: 'day' as const } };
    expect(resolveLaw(i)).toBe('wi2021');
  });

  it('the day before is Wi2013', () => {
    const i = { ...emptyInput(), anchor: { kind: 'pip' as const, date: pd(2021, 12, 31), precision: 'day' as const } };
    expect(resolveLaw(i)).toBe('wi2013');
  });

  it('stays unknown with no anchor at all', () => {
    expect(resolveLaw(emptyInput())).toBe('unknown');
  });
});

describe('resolveTermijn treats the three anchors differently, because they are different dates', () => {
  const base = { ...emptyInput(), law: 'wi2021' as const };

  it('adds a day for a PIP', () => {
    const t = resolveTermijn({ ...base, anchor: { kind: 'pip', date: pd(2025, 5, 12), precision: 'day' } }, 'wi2021', RULES);
    expect(toISO(t!.start)).toBe('2025-05-13');
  });

  it('does not for a DUO letter', () => {
    const t = resolveTermijn(
      { ...base, anchor: { kind: 'duo_letter', date: pd(2025, 5, 12), precision: 'day' } },
      'wi2021',
      RULES,
    );
    expect(toISO(t!.start)).toBe('2025-05-12');
  });

  it('takes the first of the month at month precision — the pessimistic end', () => {
    const t = resolveTermijn(
      { ...base, anchor: { kind: 'duo_letter', date: pd(2025, 5, 20), precision: 'month' } },
      'wi2021',
      RULES,
    );
    expect(toISO(t!.start)).toBe('2025-05-01');
    expect(toISO(t!.end)).toBe('2028-05-01');
  });

  it('adds a granted extension in months', () => {
    const t = resolveTermijn(
      { ...base, anchor: { kind: 'pip', date: pd(2024, 6, 2), precision: 'day' }, grantedExtensionMonths: 6 },
      'wi2021',
      RULES,
    );
    expect(toISO(t!.end)).toBe('2027-12-03');
  });
});

// ────────────────────────────── invariants ──────────────────────────────

describe('invariants that must hold for every input', () => {
  it('never throws when the user answers "I don\'t know" to everything', () => {
    const t = run(emptyInput());
    expect(t.mode).toBe('estimate_mode');
    expect(t.warnings.map(w => w.id)).toContain('anchor_unknown');
    expect(t.warnings.map(w => w.id)).toContain('not_an_official_decision');
  });

  it('orders registerBy < latestExamDate < termijnEnd for every dated component', () => {
    for (const input of [amira(), yonas(), kwame()]) {
      const t = run(input);
      for (const c of t.components) {
        if (!c.registerBy || !c.latestExamDate || !t.termijnEnd) continue;
        if (c.resultWindowWeeks === 0 && c.registrationWeeks === 0) continue; // MAP: no queue at all
        expect(c.registerBy.date <= c.latestExamDate.date).toBe(true);
        expect(c.latestExamDate.date.y * 400 + c.latestExamDate.date.m * 31 + c.latestExamDate.date.d).toBeLessThanOrEqual(
          t.termijnEnd.date.y * 400 + t.termijnEnd.date.m * 31 + t.termijnEnd.date.d,
        );
      }
    }
  });

  it('always stamps the rules version it computed with', () => {
    expect(run(emptyInput()).rulesVersion).toBe(RULES.version);
  });

  it('never assesses an extension into the term — only a granted one moves the deadline', () => {
    const withSignals = { ...yonas(), extensionSignals: ['childbirth' as const] };
    expect(toISO(run(withSignals).termijnEnd!.date)).toBe('2027-06-03');
  });

  it('is a pure function of (input, rules, today)', () => {
    expect(run(amira())).toEqual(run(amira()));
  });
});

describe('mode boundaries', () => {
  /* One candidate, already at their target level, walked week by week toward their own wall. What is
   * asserted is not a mode per date — that depends on the study model and would pin the heuristics
   * into the golden suite — but the two things that must be true of any threshold set: the verdict
   * only ever gets worse as the deadline approaches, and every state is reachable. A non-monotone
   * sequence would mean someone's plan improved by doing nothing, which is the bug this catches. */
  const walker = (): TimelineInput => ({
    ...emptyInput(),
    law: 'wi2021',
    status: 'gezin_overig',
    route: 'b1',
    anchor: { kind: 'duo_letter', date: pd(2026, 8, 20), precision: 'day' },
    targetLevel: 'a2',
    currentLevel: 'a2',
    courseHoursPerWeek: 4,
  });

  const RANK: Record<string, number> = { on_track: 0, tight: 1, at_risk: 2, overdue: 3 };

  it('never improves as today moves toward the deadline, and reaches every state', () => {
    const seen: string[] = [];
    let today = pd(2026, 8, 20);
    for (let i = 0; i < 200; i++) {
      seen.push(run(walker(), today).mode);
      today = addWeeks(today, 1);
    }
    for (let i = 1; i < seen.length; i++) {
      expect(RANK[seen[i]]).toBeGreaterThanOrEqual(RANK[seen[i - 1]]);
    }
    expect(new Set(seen)).toEqual(new Set(['on_track', 'tight', 'at_risk', 'overdue']));
  });

  it('is overdue the day after the term ends, never on it', () => {
    expect(run(walker(), pd(2029, 8, 20)).mode).not.toBe('overdue');
    expect(run(walker(), pd(2029, 8, 21)).mode).toBe('overdue');
  });
});

// ────────────────────────────── the actionable dates ──────────────────────────────

/**
 * "When do I start studying, when is the exam, when is the result" — the three dates a candidate
 * acts on, and the ones the first version of this feature left implicit inside the picture.
 *
 * The backward one is the one worth guarding: `startStudyingBy` counts back from a **legal**
 * registration deadline using **our** study model, so it is an estimate, and its range must run the
 * right way round. More study weeks means starting *earlier*, so the pessimistic figure produces the
 * range's `earliest`. Inverted, the tool would tell people to start later than they safely can —
 * precisely the error it exists to prevent.
 */
describe('start-studying, exam and result windows', () => {
  const anyaFixture = (): TimelineInput => ({
    ...emptyInput(),
    law: 'wi2021',
    status: 'gezin_overig',
    route: 'b1',
    anchor: { kind: 'pip', date: pd(2025, 5, 12), precision: 'day' },
    targetLevel: 'a2',
    currentLevel: 'a2',
    courseHoursPerWeek: 6,
    selfStudyHoursPerWeek: 2,
    progress: { knm: { state: 'studying', diagnosticScore: 9 } },
  });

  const t = run(anyaFixture());
  const knm = t.components.find(c => c.id === 'knm')!;
  const lezen = t.components.find(c => c.id === 'lezen')!;

  it('labels each language exam with the level it is sat at', () => {
    expect(lezen.level).toBe('a2');
    expect(t.components.find(c => c.id === 'knm')!.level).toBeNull();
    expect(t.components.find(c => c.id === 'pvt')!.level).toBeNull();
  });

  it('reports Wi2013 language exams as A2 regardless of the target level field', () => {
    const w13 = run({ ...kwame(), targetLevel: 'unknown' });
    expect(w13.components.find(c => c.id === 'lezen')!.level).toBe('a2');
  });

  it('turns a 9/10 diagnostic into a short study band', () => {
    /* KNM base 15–23 weeks × 0.25 for a score of 9 → 4–6. */
    expect(knm.studyWeeks).toEqual({ lo: 4, hi: 6 });
  });

  it('puts the exam a registration queue after readiness, and the result a marking queue after that', () => {
    expect(diffWeeks(knm.readyBy!.latest, knm.examWindow!.latest)).toBe(knm.registrationWeeks);
    expect(diffWeeks(knm.examWindow!.latest, knm.resultWindow!.latest)).toBe(knm.resultWindowWeeks);
    expect(knm.registrationWeeks).toBe(7);
    expect(knm.resultWindowWeeks).toBe(8);
  });

  it('counts start-studying back from the registration deadline, not forward from today', () => {
    expect(diffWeeks(knm.startStudyingBy!.latest, knm.registerBy!.date)).toBe(knm.studyWeeks!.lo);
    expect(diffWeeks(knm.startStudyingBy!.earliest, knm.registerBy!.date)).toBe(knm.studyWeeks!.hi);
  });

  it('orders that range so more study weeks means an earlier start', () => {
    for (const c of t.components) {
      if (!c.startStudyingBy) continue;
      expect(diffWeeks(c.startStudyingBy.earliest, c.startStudyingBy.latest)).toBeGreaterThanOrEqual(0);
    }
  });

  it('gives Spreken A2 a sixteen-week result queue and Lezen A2 eight', () => {
    expect(t.components.find(c => c.id === 'spreken')!.resultWindowWeeks).toBe(16);
    expect(lezen.resultWindowWeeks).toBe(8);
  });

  it('says nothing about a component with no study hours rather than inventing a start date', () => {
    const noHours = run({ ...anyaFixture(), courseHoursPerWeek: 0, selfStudyHoursPerWeek: 0, currentLevel: 'a0' });
    const l = noHours.components.find(c => c.id === 'lezen')!;
    expect(l.studyWeeks).toBeNull();
    expect(l.startStudyingBy).toBeNull();
    expect(l.examWindow).toBeNull();
    expect(noHours.warnings.map(w => w.id)).toContain('no_study_hours_given');
  });

  it('drops every date for a component already passed', () => {
    const done = run({ ...anyaFixture(), progress: { lezen: { state: 'passed' } } });
    const l = done.components.find(c => c.id === 'lezen')!;
    expect(l.done).toBe(true);
    expect([l.readyBy, l.startStudyingBy, l.examWindow, l.resultWindow, l.studyWeeks]).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe('the agenda', () => {
  const t = run(amira());
  const agenda = buildAgenda(t, TODAY);

  it('is sorted chronologically', () => {
    for (let i = 1; i < agenda.length; i++) {
      expect(toEpochDay(agenda[i].date)).toBeGreaterThanOrEqual(toEpochDay(agenda[i - 1].date));
    }
  });

  it('merges the components rather than grouping by them', () => {
    /* The point of the list: entries from different components interleave. If every item for one
     * component were contiguous, the reader would be back to reading four separate plans. */
    const ids = agenda.filter(a => a.component).map(a => a.component);
    const distinct = new Set(ids);
    expect(distinct.size).toBeGreaterThan(1);
    const firstRun = ids.findIndex(id => id !== ids[0]);
    expect(firstRun).toBeGreaterThan(0);
    expect(ids.slice(firstRun).some(id => id === ids[0])).toBe(true);
  });

  it('gives PVT and MAP one gemeente entry, not a four-step exam chain', () => {
    const pvt = agenda.filter(a => a.component === 'pvt');
    expect(pvt).toHaveLength(1);
    expect(pvt[0].kind).toBe('gemeente');
    expect(pvt[0].actor).toBe('gemeente');
  });

  it('marks a start date that has passed rather than dropping it', () => {
    /* Amira cannot reach B1 in time, so at least one start date is already behind her. Removing it
     * would make the plan look achievable by deleting the part that is not. */
    const late = agenda.filter(a => a.kind === 'start' && a.overdue);
    expect(late.length).toBeGreaterThan(0);
  });

  it('keeps registration dates legal and start dates estimated', () => {
    for (const a of agenda) {
      if (a.kind === 'register' || a.kind === 'deadline') expect(a.precision).toBe('legal');
      if (a.kind === 'start' || a.kind === 'exam' || a.kind === 'result') expect(a.precision).toBe('estimate');
    }
  });

  it('leads with what is overdue when asked for the next few actions', () => {
    const next = nextActions(agenda);
    expect(next.length).toBeGreaterThan(0);
    expect(next.every(a => a.actor === 'you' || a.actor === 'gemeente')).toBe(true);
    const firstNotOverdue = next.findIndex(a => !a.overdue);
    if (firstNotOverdue > -1) {
      expect(next.slice(firstNotOverdue).every(a => !a.overdue)).toBe(true);
    }
  });

  it('carries the deadline, and lets a result queue overrun it rather than clipping the list', () => {
    /* The deadline is not necessarily last, and that is the finding rather than a bug: Amira's result
     * windows land *after* it, which is exactly what "in dit tempo red je het niet" means. Anything
     * past the deadline must therefore be something she waits for, never something she does. */
    const deadlineAt = agenda.findIndex(a => a.kind === 'deadline');
    expect(deadlineAt).toBeGreaterThan(-1);
    for (const a of agenda.slice(deadlineAt + 1)) {
      expect(a.actor).toBe('duo');
    }
  });
});
