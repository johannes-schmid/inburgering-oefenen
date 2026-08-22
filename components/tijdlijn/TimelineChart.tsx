/**
 * The gantt. **One component, on screen from the first question to the printed PDF.**
 *
 * The owner's call (2026-08-20): the chart is not the reward for finishing the wizard, it is the
 * wizard's other half. It renders from the very first screen and redraws on every answer — a row
 * appears when a route requires it, disappears when it does not, bars slide as the study slider
 * moves, a wall arrives the moment a PIP date is given. Somebody who answers two questions and
 * leaves has still seen their deadline; somebody who answers all eight has watched it being built.
 *
 * ## The shape, and why it is that shape
 *
 * - **Rows are chronological, top to bottom** — the order you do the work in, not the order the law
 *   lists the components in. That is what makes it a plan you read downwards rather than a table you
 *   have to sort in your head.
 * - **A bar starts when *studying* starts, not at today.** Studying is staggered
 *   (`examSpacingWeeks`: nobody sits four DUO exams in one week), so the bars form a staircase —
 *   which is the picture the design mockup makes, and it is a real fact about the plan rather than a
 *   decoration.
 * - **Solid = studying, which you control. Hatched = a queue you cannot speed up.** That reading is
 *   the whole product, and it extends past DUO: the five-year residence wait for naturalisation is
 *   drawn as one long hatched bar for exactly the same reason — waiting is waiting.
 * - **Walls are the hard dates**, with no radius and no softness, the only elements on the page like
 *   that. Pins on the axis mark the moments that are points rather than periods: when you arrived,
 *   today, the PIP.
 *
 * ## Two rules it must keep
 *
 * **Legal and estimated never look alike.** Solid pins and exact dates for the first, dashed and
 * "ongeveer" for the second. The engine guarantees the distinction in the types; this is the visual
 * half, and it is why the tool is trustworthy rather than a liability.
 *
 * **The picture is `aria-hidden` and every fact in it exists as text.** A flex row of coloured spans
 * conveys nothing to a screen reader, so the dates ship as a list underneath — which is also what
 * prints when the colours do not.
 */
'use client';

import { useTranslations } from 'next-intl';
import {
  addMonths,
  addWeeks,
  addYears,
  diffDays,
  isAfter,
  isBefore,
  toEpochDay,
  toISO,
  type PlainDate,
} from '@/lib/tijdlijn/engine/dates';
import { chartWindow, deriveMilestones } from '@/lib/tijdlijn/milestones';
import { AT_THE_GEMEENTE } from '@/lib/tijdlijn/agenda';
import { fmtDate, fmtMonth, type UiLocale } from '@/lib/tijdlijn/format';
import type { ComponentPlan, Timeline, TimelineInput } from '@/lib/tijdlijn/engine/types';
import { useComponentLabel } from './Agenda';

type Props = {
  timeline: Timeline;
  input: TimelineInput;
  today: PlainDate;
  locale: UiLocale;
  /** Tighter rows and no legend, for the column beside a wizard question. */
  compact?: boolean;
  /** Grows the bars in once, left to right. The landing hero only — never loops, never pulses. */
  animate?: boolean;
  /**
   * Renders the study-hours slider under the chart and reports changes.
   *
   * The control lives *with the picture* rather than in a settings panel because the point is the
   * causation: drag it, and every date on the chart moves. Put it three panels away and it is a form
   * field; put it here and it explains what study hours do.
   */
  onHoursChange?: (courseHours: number) => void;
};

/** One drawn lane. Components and the residence clock share this shape so sorting can mix them. */
type Lane = {
  key: string;
  label: string;
  /** Where the lane's own work begins — what the rows are sorted by. */
  from: PlainDate;
  /** Solid segment end. Equal to `from` for a lane that is pure waiting. */
  studyEnd: PlainDate;
  /** End of the registration queue; the exam beat sits here. */
  examAt: PlainDate;
  to: PlainDate;
  tone: 'ok' | 'amber' | 'red' | 'muted';
  /** Draws the single beat between the two queues. False for a lane with no exam in it. */
  hasExam: boolean;
  done: boolean;
  /** No dates known yet: an empty dashed lane, which is the most useful thing it can say. */
  empty: boolean;
};

export default function TimelineChart({
  timeline,
  input,
  today,
  locale,
  compact = false,
  animate = false,
  onHoursChange,
}: Props) {
  const t = useTranslations('tijdlijn.chart');
  const label = useComponentLabel();

  const milestones = deriveMilestones(timeline, input, today);
  const win = chartWindow(milestones, timeline, today);
  const span = Math.max(1, diffDays(win.from, win.to));
  const x = (d: PlainDate) => Math.min(100, Math.max(0, (diffDays(win.from, d) / span) * 100));

  const lanes = buildLanes(timeline, input, today, label, t('naturalisation_row'));
  const ticks = axisTicks(win.from, win.to);
  const crossers = timeline.components.filter(c => c.crossesWall).length;
  const walls = milestones.filter(m => m.shape === 'wall');
  /* Only pins that actually fall inside the drawn window. `x()` clamps to [0,100], so a date before
   * the window — an arrival four years ago, once the axis has been clamped to keep the plan readable
   * — would be pinned to the left edge and read as though it happened there. The milestone list below
   * still carries it with its real date, which is where an out-of-frame fact belongs. */
  const inWindow = (d: PlainDate) => !isBefore(d, win.from) && !isAfter(d, win.to);
  const pins = milestones.filter(m => m.shape !== 'wall' && inWindow(m.date));

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-headline text-[13px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
          {t('title')}
        </span>
        {timeline.termijnEnd ? (
          <span className="font-headline text-[13px] font-bold text-primary">
            <time dateTime={toISO(timeline.termijnEnd.date)}>{fmtDate(timeline.termijnEnd.date, locale)}</time>
            {' · '}
            {t('deadline')}
          </span>
        ) : (
          <span className="text-[13px] text-on-surface-variant">{t('no_deadline_yet')}</span>
        )}
      </figcaption>

      <div className="relative" style={{ ['--tl-gutter' as string]: compact ? '5rem' : '6rem' }} aria-hidden="true">
        {/* One wall layer over the plot only, so a deadline is never drawn across the labels. */}
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{ insetInlineStart: 'calc(var(--tl-gutter) + 0.75rem)', insetInlineEnd: 0 }}
        >
          {walls.map(m => (
            <div
              key={m.id}
              className={m.kind === 'estimate' ? 'tl-wall tl-wall-dashed' : 'tl-wall'}
              style={{
                insetInlineStart: `${x(m.date)}%`,
                background: m.tone === 'risk' && m.kind === 'legal' ? 'var(--risk-red)' : undefined,
              }}
            />
          ))}
          {crossers > 0 && timeline.termijnEnd && (
            <span
              className="tl-wall-notch"
              style={{ insetInlineStart: `${x(timeline.termijnEnd.date)}%`, top: '50%' }}
            />
          )}
          {/* Today: a fact, but not a deadline — a hairline guide, never a wall. */}
          <div className="absolute inset-y-0 w-px bg-outline-variant" style={{ insetInlineStart: `${x(today)}%` }} />
        </div>

        <ul className="relative space-y-1">
          {lanes.length === 0 && (
            <li className="py-6 text-center text-[13px] text-on-surface-variant">{t('empty')}</li>
          )}
          {lanes.map(lane => (
            <Row key={lane.key} lane={lane} x={x} compact={compact} animate={animate} doneLabel={t('done')} />
          ))}
        </ul>

        {/* The axis, with the moments that are points rather than periods pinned to it. */}
        <div className="relative mt-2" style={{ marginInlineStart: 'calc(var(--tl-gutter) + 0.75rem)' }}>
          <div className="h-px w-full bg-outline-variant" />

          <div className="relative h-3">
            {pins.map(m => (
              <span
                key={m.id}
                className="absolute top-[-3px] -translate-x-1/2"
                style={{ insetInlineStart: `${x(m.date)}%` }}
              >
                <span
                  className={`block size-1.5 rounded-full ${m.kind === 'estimate' ? 'border border-dashed border-outline' : ''}`}
                  style={{ background: m.kind === 'estimate' ? 'transparent' : 'var(--color-primary)' }}
                />
              </span>
            ))}
            {/* Today gets the accent colour, and it is the only thing on the axis that does. */}
            <span className="absolute top-[-3px] -translate-x-1/2" style={{ insetInlineStart: `${x(today)}%` }}>
              <span className="block size-2 rounded-full bg-secondary-container" />
            </span>
          </div>

          <div className="relative h-4">
            {ticks.map(tick => (
              <span
                key={toISO(tick)}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-on-surface-variant"
                style={{ insetInlineStart: `${x(tick)}%` }}
              >
                {tick.m === 1 ? tick.y : fmtMonth(tick, locale).split(' ')[0].slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The dated facts as text: the accessible and printable version of everything above. Two
          columns of "label · date" rather than a paragraph each — the chart is the explanation, this
          is the record. */}
      {milestones.length > 0 && (
        <ul className="mt-3 grid gap-x-6 gap-y-1 border-t border-outline-variant pt-3 text-[12px] sm:grid-cols-2">
          {milestones.map(m => (
            <li key={m.id} className="flex items-baseline gap-2">
              <span
                className={`mt-1 size-2 shrink-0 ${m.shape === 'wall' ? 'rounded-none' : 'rounded-full'} ${
                  m.kind === 'estimate' ? 'border border-dashed border-outline' : ''
                }`}
                style={{
                  background:
                    m.kind === 'estimate' ? undefined : m.tone === 'risk' ? 'var(--risk-red)' : 'var(--color-primary)',
                }}
                aria-hidden="true"
              />
              <span className="font-semibold text-on-surface">{t(`milestone.${m.labelKey}`)}</span>
              <time dateTime={toISO(m.date)} className="text-on-surface-variant">
                {m.kind === 'estimate' ? `${t('about')} ${fmtMonth(m.date, locale)}` : fmtDate(m.date, locale)}
              </time>
            </li>
          ))}
        </ul>
      )}

      {onHoursChange && <HoursSlider input={input} onChange={onHoursChange} />}

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-outline-variant pt-3 text-[12px] text-on-surface-variant">
          <span className="flex items-center gap-2">
            <span className="block h-2.5 w-6 rounded-full bg-primary" aria-hidden="true" />
            {t('legend_study')}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="block h-2.5 w-6 rounded-full"
              style={{ background: 'var(--tl-hatch-navy)' }}
              aria-hidden="true"
            />
            {t('legend_wait')}
          </span>
          <span>{t('compact_hint')}</span>
        </div>
      )}
    </figure>
  );
}

// ────────────────────────────── lanes ──────────────────────────────

/**
 * Turns the timeline into drawable lanes, **sorted chronologically**.
 *
 * The study start is derived as `readyBy.latest − studyWeeks.hi`, which is today plus this
 * component's stagger. Deriving it rather than starting every bar at today is what produces the
 * staircase: a bar begins when the work on it begins.
 */
function buildLanes(
  timeline: Timeline,
  input: TimelineInput,
  today: PlainDate,
  label: (id: string | null, level: string | null) => string,
  passportLabel: string,
): Lane[] {
  const risk =
    timeline.mode === 'at_risk' || timeline.mode === 'overdue'
      ? 'red'
      : timeline.mode === 'tight'
        ? 'amber'
        : 'ok';
  const lanes: Lane[] = timeline.components
    .filter(p => p.required)
    .map(c => laneForComponent(c, today, risk, label));

  /* The passport lane. Five years of residence is the longest wait in the whole product and the one
   * people are most often surprised by, so it is drawn rather than described — as one hatched bar,
   * because it is time you cannot buy your way out of. Only when they asked about it. */
  const nat = timeline.naturalisation;
  if (nat?.residenceEligibleFrom) {
    const from = input.residenceStart ?? today;
    lanes.push({
      key: 'naturalisation',
      label: passportLabel,
      from,
      studyEnd: from,
      examAt: nat.residenceEligibleFrom.date,
      to: nat.residenceEligibleFrom.date,
      tone: 'muted',
      hasExam: false,
      done: false,
      empty: false,
    });
  }

  return lanes.sort((a, b) => toEpochDay(a.from) - toEpochDay(b.from) || toEpochDay(a.to) - toEpochDay(b.to));
}

function laneForComponent(
  c: ComponentPlan,
  today: PlainDate,
  risk: 'ok' | 'amber' | 'red',
  label: (id: string | null, level: string | null) => string,
): Lane {
  const name = label(c.id, c.level);
  const flat = (tone: Lane['tone'], empty: boolean, done: boolean): Lane => ({
    key: c.id,
    label: name,
    from: today,
    studyEnd: today,
    examAt: today,
    to: today,
    tone,
    hasExam: false,
    done,
    empty,
  });

  if (c.done) return flat('muted', false, true);

  /* A gemeente component is one appointment, not a study-and-queue chain: a short solid bar ending at
   * the date it must be arranged by. Giving PVT an "exam" and a "result" invented a DUO process it is
   * not part of — the same mistake the agenda made before `AT_THE_GEMEENTE` existed. */
  if (AT_THE_GEMEENTE.includes(c.id)) {
    const to = c.registerBy?.date ?? c.readyBy?.latest ?? today;
    return {
      key: c.id,
      label: name,
      from: c.readyBy?.earliest ?? today,
      studyEnd: to,
      examAt: to,
      to,
      /* A gemeente appointment carries **its own** risk and never inherits the plan's. PVT and MAP
       * have no queue and months of room; tinting them amber because four language exams are in
       * trouble tells the reader to worry about the two things that are fine. Only a date that has
       * actually passed colours these. */
      tone: isBefore(to, today) ? 'amber' : 'ok',
      hasExam: false,
      done: false,
      empty: !c.readyBy && !c.registerBy,
    };
  }

  if (!c.readyBy || !c.studyWeeks) return flat('ok', true, false);

  const studyStart = addWeeks(c.readyBy.latest, -c.studyWeeks.hi);
  const examAt = addWeeks(c.readyBy.latest, c.registrationWeeks);
  const to = addWeeks(examAt, c.resultWindowWeeks);

  return {
    key: c.id,
    label: name,
    /* Never before today: a study start in the past is a real finding, but on the chart it would draw
     * the bar off the left edge. The agenda says "dit had al gemoeten" in words, where it belongs. */
    from: isBefore(studyStart, today) ? today : studyStart,
    studyEnd: c.readyBy.latest,
    examAt,
    to,
    tone: c.crossesWall ? 'red' : c.slackWeeks < 0 ? 'amber' : risk === 'amber' ? 'amber' : 'ok',
    hasExam: c.resultWindowWeeks > 0,
    done: false,
    empty: false,
  };
}

function Row({
  lane,
  x,
  compact,
  animate,
  doneLabel,
}: {
  lane: Lane;
  x: (d: PlainDate) => number;
  compact: boolean;
  animate: boolean;
  doneLabel: string;
}) {
  const start = x(lane.from);
  const studyEnd = Math.max(start, x(lane.studyEnd));
  const examAt = Math.max(studyEnd, x(lane.examAt));
  const end = Math.max(examAt, x(lane.to));
  const width = Math.max(1.5, end - start);

  const riskClass = lane.tone === 'red' ? 'tl-risk-red' : lane.tone === 'amber' ? 'tl-risk-amber' : '';
  const muted = lane.tone === 'muted';

  return (
    <li className="grid items-center gap-x-3" style={{ gridTemplateColumns: 'var(--tl-gutter) minmax(0,1fr)' }}>
      <span
        className="truncate text-end font-headline text-[11.5px] font-extrabold leading-tight"
        style={{
          color:
            lane.done || muted
              ? 'var(--color-outline)'
              : lane.tone === 'red'
                ? 'var(--risk-red)'
                : 'var(--color-primary)',
        }}
        title={lane.label}
      >
        {lane.label}
      </span>

      <span className={`relative block ${compact ? 'h-3.5' : 'h-4'}`}>
        {lane.empty && (
          <span
            className="absolute top-1/2 block h-1.5 w-[16%] -translate-y-1/2 rounded-full border border-dashed border-outline"
            style={{ insetInlineStart: `${start}%` }}
          />
        )}

        {lane.done && (
          <span
            className="absolute top-1/2 block h-1.5 w-[8%] -translate-y-1/2 rounded-full bg-outline-variant"
            style={{ insetInlineStart: `${Math.max(0, start - 8)}%` }}
            title={doneLabel}
          />
        )}

        {/* The passport wait: all queue, no studying. One hatched bar, muted, so it never competes
            with the exams for attention — it is context, not a task. */}
        {muted && !lane.done && (
          <span
            className="absolute top-1/2 block h-2 -translate-y-1/2 rounded-full"
            style={{
              insetInlineStart: `${start}%`,
              width: `${width}%`,
              background: 'var(--tl-hatch-navy)',
              opacity: 0.75,
            }}
          />
        )}

        {!lane.empty && !lane.done && !muted && (
          <span
            className={`tl-bar ${riskClass} ${animate ? 'tl-grow-in' : ''} absolute top-1/2 -translate-y-1/2 tl-animate-width`}
            style={{ insetInlineStart: `${start}%`, width: `${width}%` }}
          >
            <span
              className="block size-2 shrink-0 rounded-full"
              style={{
                background:
                  lane.tone === 'red'
                    ? 'var(--risk-red)'
                    : lane.tone === 'amber'
                      ? 'var(--risk-amber)'
                      : 'var(--color-primary)',
              }}
            />
            <span className="tl-seg-study" style={{ flexBasis: `${pctOf(studyEnd - start, width)}%`, flexGrow: 0 }} />
            <span className="tl-seg-wait-reg" style={{ flexBasis: `${pctOf(examAt - studyEnd, width)}%`, flexGrow: 0 }} />
            {lane.hasExam && <span className="tl-exam-marker" />}
            <span className="tl-seg-wait-result" style={{ flexBasis: `${pctOf(end - examAt, width)}%`, flexGrow: 0 }} />
          </span>
        )}
      </span>
    </li>
  );
}

const pctOf = (part: number, whole: number) => (whole <= 0 ? 0 : Math.max(0, (part / whole) * 100));

// ────────────────────────────── the slider ──────────────────────────────

/**
 * Study hours, next to the picture they change.
 *
 * A range input **paired with a number**, because a slider alone is hostile on a small screen and to
 * motor impairments, and somebody who knows "nine hours" should be able to say nine. Both write the
 * same field, and every date on the chart above moves as they do — which is the fastest available
 * explanation of why study hours matter at all.
 */
function HoursSlider({ input, onChange }: { input: TimelineInput; onChange: (n: number) => void }) {
  const t = useTranslations('tijdlijn.chart');
  const value = input.courseHoursPerWeek;

  return (
    <div className="tl-no-print mt-4 border-t border-outline-variant pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor="tl-hours" className="text-[13px] font-semibold text-on-surface">
          {t('hours_label')}
        </label>
        <span className="font-headline text-sm font-extrabold tabular-nums text-primary">
          {value > 0 ? value : t('hours_none')}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <input
          id="tl-hours"
          type="range"
          min={0}
          max={24}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-11 min-w-0 flex-1 accent-[color:var(--color-primary)]"
        />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={40}
          value={value}
          onChange={e => onChange(Math.max(0, Math.min(40, Number(e.target.value))))}
          aria-label={t('hours_label')}
          className="h-11 w-16 rounded-lg border border-outline-variant bg-surface-container-lowest text-center font-headline text-sm font-bold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        />
      </div>
      <p className="mt-1.5 text-[12px] text-on-surface-variant">{t('hours_hint')}</p>
    </div>
  );
}

// ────────────────────────────── axis ──────────────────────────────

/**
 * Ticks: years when the window is long, quarters when it is short.
 *
 * A three-year term with monthly ticks is 36 unreadable labels; a six-month pre-clock window with
 * only years is one. The threshold is the span, not a preference.
 */
function axisTicks(from: PlainDate, to: PlainDate): PlainDate[] {
  const months = (to.y - from.y) * 12 + (to.m - from.m);
  const out: PlainDate[] = [];
  if (months > 30) {
    let d: PlainDate = { y: from.y + 1, m: 1, d: 1 };
    while (isBefore(d, to)) {
      if (isAfter(d, from)) out.push(d);
      d = addYears(d, 1);
    }
    return out;
  }
  let d: PlainDate = { y: from.y, m: from.m, d: 1 };
  while (isBefore(d, to)) {
    if (isAfter(d, from)) out.push(d);
    d = addMonths(d, months > 12 ? 3 : 2);
  }
  return out;
}
