/**
 * The result screen. Everything about it follows from one decision:
 *
 * **The headline is not the deadline.** It is *"meld je uiterlijk aan op 3 december 2027"* — the last
 * date you can still register and have the result land in time. That date is the product. The legal
 * deadline is shown, calmly, underneath as the thing it is derived from.
 *
 * Layout order, and why: verdict → timeline → cost → extra time → passport → what-if → save →
 * sources. A reader in mode `at_risk` needs the options before the arithmetic, so the verdict card
 * carries the next action; a reader in `on_track` needs the order of work, which the timeline gives.
 * The structure is **identical in every mode** — only the verdict card and the wall change — so
 * somebody who moves from tight to on track recognises their own plan rather than meeting a new page.
 *
 * Tone rule, from the design brief and worth repeating where the strings live: `at_risk` and
 * `overdue` never use an exclamation mark, a warning triangle, or the word *fout*. State what is
 * true, then what to do. These readers have been made to feel bad by enough institutions.
 */
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDot,
  Info,
  Minus,
  Printer,
  RefreshCw,
  Link2,
  Mail,
} from 'lucide-react';
import { diffWeeks, toISO, type PlainDate } from '@/lib/tijdlijn/engine/dates';
import { RULES } from '@/lib/tijdlijn/rules';
import { fmtDate, fmtMoney, fmtMonth, type UiLocale } from '@/lib/tijdlijn/format';
import type {
  ComponentPlan,
  ResultMode,
  Timeline,
  TimelineInput,
} from '@/lib/tijdlijn/engine/types';
import TimelineChart from './TimelineChart';
import Agenda, { NextActions, useComponentLabel } from './Agenda';
import { AT_THE_GEMEENTE } from '@/lib/tijdlijn/agenda';

/** The three tones the whole screen agrees on. One mapping — see `riskFor` below. */
type Risk = 'ok' | 'amber' | 'red';
import { ProgressMatrix } from './Wizard';
import { Chip, EstimateBadge, Panel, PanelTitle, SourceBadge, Stepper } from './ui';

type Props = {
  timeline: Timeline;
  input: TimelineInput;
  onChange: (next: TimelineInput) => void;
  onEditAnswers: () => void;
  onReset: () => void;
  today: PlainDate;
  locale: UiLocale;
  shareUrl: string;
  encodedState: string;
};

/** Mode → risk tone. One mapping, so the bars, the wall and the verdict card cannot disagree. */
function riskFor(mode: ResultMode): Risk {
  if (mode === 'at_risk' || mode === 'overdue') return 'red';
  if (mode === 'tight') return 'amber';
  return 'ok';
}

export default function Result({
  timeline,
  input,
  onChange,
  onEditAnswers,
  onReset,
  today,
  locale,
  shareUrl,
  encodedState,
}: Props) {
  const t = useTranslations('tijdlijn.result');
  const risk = riskFor(timeline.mode);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {/* The mockup's top card: the verdict on the left, the gantt on the right, one surface. They
          belong together — the headline date is *read off* the chart, and splitting them into two
          panels made the reader scroll between a claim and its evidence. */}
      <Verdict timeline={timeline} input={input} onChange={onChange} today={today} locale={locale} risk={risk} />

      <Agenda timeline={timeline} today={today} locale={locale} />

      <TimelineList timeline={timeline} today={today} locale={locale} />

      <CostPanel timeline={timeline} locale={locale} />

      {timeline.fine && <FinePanel timeline={timeline} locale={locale} />}

      {timeline.extensions.length > 0 && <ExtensionPanel timeline={timeline} />}

      {timeline.naturalisation && <NaturalisationPanel timeline={timeline} locale={locale} />}

      <WhatIf timeline={timeline} input={input} onChange={onChange} />

      <SavePanel shareUrl={shareUrl} encodedState={encodedState} locale={locale} />

      <Warnings timeline={timeline} />

      <Sources />

      <div className="tl-no-print flex flex-wrap gap-3 pb-8">
        <button
          type="button"
          onClick={onEditAnswers}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface transition-colors duration-150 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        >
          {t('edit_answers')}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm text-on-surface-variant underline decoration-outline-variant underline-offset-4 transition-colors duration-150 hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {t('start_over')}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────── verdict ──────────────────────────────

/**
 * The verdict card. The single date is the largest type on the page — larger than the page title —
 * and there are deliberately **no stat tiles** around it. Everything else is body size.
 */
function Verdict({
  timeline,
  input,
  onChange,
  today,
  locale,
  risk,
}: {
  timeline: Timeline;
  input: TimelineInput;
  onChange: (next: TimelineInput) => void;
  today: PlainDate;
  locale: UiLocale;
  risk: Risk;
}) {
  const t = useTranslations('tijdlijn.result');
  const tc = useTranslations('tijdlijn.result.component');
  const label = useComponentLabel();
  const binding = timeline.components.find(c => c.id === timeline.bindingComponent) ?? null;
  const registerBy = binding?.registerBy?.date ?? null;
  const weeks = registerBy ? diffWeeks(today, registerBy) : null;

  const accent =
    risk === 'red' ? 'var(--risk-red)' : risk === 'amber' ? 'var(--risk-amber)' : 'var(--color-primary)';
  const tint =
    risk === 'red' ? 'var(--risk-red-tint)' : risk === 'amber' ? 'var(--risk-amber-tint)' : 'rgba(0,43,109,0.05)';

  const verdictKey: Record<ResultMode, string> = {
    on_track: 'verdict_on_track',
    tight: 'verdict_tight',
    at_risk: 'verdict_at_risk',
    overdue: 'verdict_overdue',
    pre_clock: 'verdict_pre_clock',
    exempt: 'verdict_exempt',
    naturalisation_only: 'verdict_naturalisation',
    estimate_mode: 'verdict_estimate',
  };
  const badgeKey: Record<ResultMode, string> = {
    on_track: 'badge_on_track',
    tight: 'badge_tight',
    at_risk: 'badge_at_risk',
    overdue: 'badge_overdue',
    pre_clock: 'badge_pre_clock',
    exempt: 'badge_exempt',
    naturalisation_only: 'badge_naturalisation',
    estimate_mode: 'badge_estimate',
  };

  /* KNM first when it is still open: fastest win, and the component this site teaches best. The
   * recommendation is ours and is labelled as advice, never as an order DUO imposes. */
  const nextUp = timeline.recommendedOrder.find(id => {
    const c = timeline.components.find(x => x.id === id);
    return c && c.required && !c.done && c.practiceHref;
  });
  const nextPlan = timeline.components.find(c => c.id === nextUp);

  return (
    <Panel className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-headline text-[13px] font-bold"
            style={{ background: tint, color: accent }}
          >
            <span className="size-2.5 rounded-sm" style={{ background: accent }} aria-hidden="true" />
            {t(badgeKey[timeline.mode])}
          </span>

          <h1 className="mt-5 font-headline text-lg font-extrabold leading-snug tracking-[-0.02em] text-on-surface">
            {t(verdictKey[timeline.mode])}
          </h1>

          {registerBy ? (
            <>
              <p className="mt-5 text-sm text-on-surface-variant">{t('headline_register_by')}</p>
              <p
                className="mt-1 font-headline text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[52px]"
                style={{ color: accent }}
              >
                <time dateTime={toISO(registerBy)}>{fmtDate(registerBy, locale)}</time>
              </p>
              <p className="mt-1 font-headline text-lg font-bold" style={{ color: accent }}>
                {weeks !== null && weeks >= 0
                  ? t('headline_weeks', { n: weeks })
                  : t('headline_weeks_past', { n: Math.abs(weeks ?? 0) })}
              </p>
              {binding && (
                <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
                  {t('for_component', { component: label(binding.id, binding.level) })}{' '}
                  {timeline.termijnEnd && t('because', { date: fmtDate(timeline.termijnEnd.date, locale) })}
                </p>
              )}
            </>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">
              {timeline.mode === 'estimate_mode' ? t('verdict_estimate_sub') : null}
            </p>
          )}

          {timeline.mode === 'at_risk' && (
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t('verdict_at_risk_sub')}</p>
          )}

          {/* "What do I do now" belongs beside the verdict, not three panels down. */}
          <NextActions timeline={timeline} today={today} locale={locale} />
        </div>

        {/* The chart, then the two dates it is drawn from, then the next action — and only one. */}
        <div className="border-t border-outline-variant bg-surface-container-low p-6 sm:p-8 md:border-s md:border-t-0">
          <div className="mb-6">
            <TimelineChart
              timeline={timeline}
              input={input}
              today={today}
              locale={locale}
              onHoursChange={h => onChange({ ...input, courseHoursPerWeek: h })}
            />
          </div>

          {timeline.termijnStart && timeline.termijnEnd && (
            <dl className="mb-6 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-on-surface-variant">{t('termijn_start_label')}</dt>
                <dd className="flex items-center gap-2 font-semibold text-on-surface">
                  <time dateTime={toISO(timeline.termijnStart.date)}>{fmtDate(timeline.termijnStart.date, locale)}</time>
                  <SourceBadge label={t('duo_badge')} href={RULES.sources[timeline.termijnStart.sourceId]?.url} />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-on-surface-variant">{t('deadline_label')}</dt>
                <dd className="flex items-center gap-2 font-semibold text-on-surface">
                  <time dateTime={toISO(timeline.termijnEnd.date)}>{fmtDate(timeline.termijnEnd.date, locale)}</time>
                  <SourceBadge label={t('duo_badge')} href={RULES.sources[timeline.termijnEnd.sourceId]?.url} />
                </dd>
              </div>
            </dl>
          )}

          {nextPlan && (
            <div className="tl-no-print rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="font-headline text-sm font-bold text-on-surface">{t('next_step_title')}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
                {t('next_step_body', { component: tc(nextPlan.id) })}
              </p>
              <Link
                href={{ pathname: '/oefenen/[skill]', params: { skill: nextPlan.id } }}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-headline text-sm font-bold text-on-primary shadow-[var(--shadow-btn-orange)] transition-[transform,box-shadow] duration-200 [background:var(--gradient-btn-orange)] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-btn-orange-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2"
              >
                {t('next_step_cta')}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ────────────────────────────── the timeline ──────────────────────────────

function TimelineList({
  timeline,
  today,
  locale,
}: {
  timeline: Timeline;
  today: PlainDate;
  locale: UiLocale;
}) {
  const t = useTranslations('tijdlijn.result');
  const te = useTranslations('tijdlijn.example');

  /* Chronological by the date the reader acts on, so the list reads as a plan rather than as a
   * database order. Components with no estimate sink to the bottom instead of claiming a slot. */
  const ordered = [...timeline.components].sort((a, b) => {
    const ka = a.readyBy ? a.readyBy.latest.y * 400 + a.readyBy.latest.m * 31 + a.readyBy.latest.d : Infinity;
    const kb = b.readyBy ? b.readyBy.latest.y * 400 + b.readyBy.latest.m * 31 + b.readyBy.latest.d : Infinity;
    return ka - kb;
  });

  return (
    <Panel className="p-6 sm:p-8">
      <PanelTitle sub={t('timeline_sub')}>{t('timeline_title')}</PanelTitle>

      {/* The bars are decorative; this ordered list is the accessible timeline. */}
      <ol className="space-y-3">
        {ordered.map(plan => (
          <li key={plan.id}>
            <Node plan={plan} today={today} locale={locale} />
          </li>
        ))}
      </ol>

      {timeline.termijnEnd && (
        <div className="mt-5 border-t-[3px] border-primary pt-3">
          <p className="font-headline text-sm font-extrabold uppercase tracking-[0.08em] text-primary">
            <time dateTime={toISO(timeline.termijnEnd.date)}>{fmtDate(timeline.termijnEnd.date, locale)}</time>
            {' · '}
            {te('deadline')}
          </p>
        </div>
      )}
    </Panel>
  );
}

/**
 * One module, as a detail row: the dates, the money, the way in to practice.
 *
 * It carries **no bar of its own.** The gantt in the verdict card already draws every module against
 * one shared axis; a second, per-row drawing at a different scale would be two pictures of the same
 * facts that disagree the moment one of them is changed. Same mistake as `sections` versus
 * `task_type` elsewhere in this repo. The list below the chart answers "what exactly is this
 * component, and what does it cost me?" — the chart answers "when".
 */
function Node({
  plan,
  today,
  locale,
}: {
  plan: ComponentPlan;
  today: PlainDate;
  locale: UiLocale;
}) {
  const t = useTranslations('tijdlijn.result');
  const ts = useTranslations('tijdlijn.result.component_sub');
  const ta = useTranslations('tijdlijn.agenda');
  const label = useComponentLabel();

  const weeks = plan.readyBy ? diffWeeks(today, plan.readyBy.latest) : null;
  const atGemeente = AT_THE_GEMEENTE.includes(plan.id);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-headline text-[15px] font-extrabold tracking-[-0.01em] text-on-surface">
          {label(plan.id, plan.level)}
          {plan.done && (
            <span className="ms-2 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              <BadgeCheck className="size-3" aria-hidden="true" />
              {t('node_done')}
            </span>
          )}
        </h3>
        {!plan.done && !atGemeente && weeks !== null && (
          <span className="inline-flex items-center gap-2 text-[13px] text-on-surface-variant">
            {t('node_weeks_from_now', { n: Math.max(0, weeks) })}
            <EstimateBadge label={t('estimate_badge')} />
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[13px] text-on-surface-variant">{ts(plan.id)}</p>


      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
        {/* The three dates the plan is actually made of, in the order they happen: when to start, when
            the exam falls, when the result lands. `registerBy` sits between them and is the hard one.
            **None of them applies to a gemeente component** — PVT and MAP have no studying, no exam
            and no result, and showing them a study date and an "examen" was inventing a DUO process
            they are not part of. Same rule as `AT_THE_GEMEENTE` in the agenda, imported rather than
            re-derived from "has no waiting time", which is what got PVT wrong the first time. */}
        {atGemeente && plan.registerBy && !plan.done && (
          <div className="flex items-center gap-1.5">
            <dt className="text-on-surface-variant">{t('node_register_by')}:</dt>
            <dd className="flex items-center gap-1.5 font-semibold text-on-surface">
              <time dateTime={toISO(plan.registerBy.date)}>{fmtDate(plan.registerBy.date, locale)}</time>
              <SourceBadge label={t('duo_badge')} href={RULES.sources[plan.registerBy.sourceId]?.url} />
            </dd>
          </div>
        )}
        {!atGemeente && plan.startStudyingBy && !plan.done && (
          <div className="flex items-center gap-1.5">
            <dt className="text-on-surface-variant">{t('node_start_studying')}:</dt>
            <dd className="flex items-center gap-1.5 font-semibold text-on-surface">
              <time dateTime={toISO(plan.startStudyingBy.latest)}>
                {t('about')} {fmtMonth(plan.startStudyingBy.latest, locale)}
              </time>
              <EstimateBadge label={t('estimate_badge')} />
            </dd>
          </div>
        )}
        {!atGemeente && plan.registerBy && !plan.done && (
          <div className="flex items-center gap-1.5">
            <dt className="text-on-surface-variant">{t('node_register_by')}:</dt>
            <dd className="flex items-center gap-1.5 font-semibold text-on-surface">
              <time dateTime={toISO(plan.registerBy.date)}>{fmtDate(plan.registerBy.date, locale)}</time>
              <SourceBadge label={t('duo_badge')} href={RULES.sources[plan.registerBy.sourceId]?.url} />
            </dd>
          </div>
        )}
        {!atGemeente && plan.examWindow && !plan.done && (
          <div className="flex items-center gap-1.5">
            <dt className="text-on-surface-variant">{t('node_exam_window')}:</dt>
            <dd className="font-semibold text-on-surface">
              <time dateTime={toISO(plan.examWindow.latest)}>
                {t('about')} {fmtMonth(plan.examWindow.latest, locale)}
              </time>
            </dd>
          </div>
        )}
        {!atGemeente && plan.resultWindow && !plan.done && (
          <div className="flex items-center gap-1.5">
            <dt className="text-on-surface-variant">{t('node_result_window')}:</dt>
            <dd className="font-semibold text-on-surface">
              <time dateTime={toISO(plan.resultWindow.latest)}>
                {t('about')} {fmtMonth(plan.resultWindow.latest, locale)}
              </time>
              <span className="ms-1.5 text-on-surface-variant">(+{plan.resultWindowWeeks} w)</span>
            </dd>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <dt className="text-on-surface-variant">{t('cost_payer')}:</dt>
          <dd className="font-semibold text-on-surface">
            {plan.feeCents === 0 ? t('payer_free') : `${fmtMoney(plan.feeCents, locale)} · ${t(`payer_${payerKeyOf(plan)}`)}`}
          </dd>
        </div>
      </dl>

      {!atGemeente && plan.studyWeeks && !plan.done && (
        <p className="mt-2 text-[13px] text-on-surface-variant">
          {ta('start_hint', { lo: plan.studyWeeks.lo, hi: plan.studyWeeks.hi })}
        </p>
      )}

      {!atGemeente && plan.startStudyingBy && !plan.done && plan.slackWeeks < 0 && (
        <p className="mt-1 text-[13px] font-semibold text-[color:var(--risk-red)]">{ta('start_now')}</p>
      )}

      {atGemeente && (
        <p className="mt-2 text-[13px] text-on-surface-variant">
          {t('node_at_gemeente')} · {t('node_no_queue')}
        </p>
      )}

      {plan.practiceHref && !plan.done && (
        <Link
          href={{ pathname: '/oefenen/[skill]', params: { skill: plan.id } }}
          className="tl-no-print mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 px-3 text-[13px] font-bold text-primary transition-colors duration-150 hover:bg-[var(--tl-tint-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        >
          {t('node_practice')}
          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const payerKeyOf = (p: ComponentPlan) =>
  p.payer === 'gemeente' ? 'gemeente' : p.payer === 'loan_possible' ? 'loan' : p.payer === 'free' ? 'free' : 'self';

// ────────────────────────────── cost ──────────────────────────────

function CostPanel({ timeline, locale }: { timeline: Timeline; locale: UiLocale }) {
  const t = useTranslations('tijdlijn.result');
  const tc = useTranslations('tijdlijn.result.component');
  const { cost } = timeline;

  return (
    <Panel className="p-6 sm:p-8">
      <PanelTitle sub={t('cost_sub')}>{t('cost_title')}</PanelTitle>
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-start">
              <th scope="col" className="px-2 pb-2 text-start font-semibold text-on-surface-variant">{t('cost_component')}</th>
              <th scope="col" className="px-2 pb-2 text-end font-semibold text-on-surface-variant">{t('cost_best')}</th>
              <th scope="col" className="px-2 pb-2 text-end font-semibold text-on-surface-variant">{t('cost_expected')}</th>
              <th scope="col" className="px-2 pb-2 text-start font-semibold text-on-surface-variant">{t('cost_payer')}</th>
            </tr>
          </thead>
          <tbody>
            {cost.lines.map(l => (
              <tr key={l.id} className="border-b border-outline-variant/60">
                <td className="px-2 py-2.5 font-semibold text-on-surface">{tc(l.id)}</td>
                <td className="px-2 py-2.5 text-end tabular-nums text-on-surface">{fmtMoney(l.bestCaseCents, locale)}</td>
                <td className="px-2 py-2.5 text-end tabular-nums text-on-surface">{fmtMoney(l.expectedCents, locale)}</td>
                <td className="px-2 py-2.5 text-on-surface-variant">
                  {t(`payer_${l.payer === 'loan_possible' ? 'loan' : l.payer === 'gemeente' ? 'gemeente' : l.payer === 'free' ? 'free' : 'self'}`)}
                  {l.freeAttempts > 0 && (
                    <span className="ms-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      {t('cost_free_attempts', { n: l.freeAttempts })}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="px-2 pt-3 text-start font-headline font-extrabold text-on-surface">{t('cost_total')}</th>
              <td className="px-2 pt-3 text-end font-headline font-extrabold tabular-nums text-on-surface">
                {fmtMoney(cost.bestCaseCents, locale)}
              </td>
              <td className="px-2 pt-3 text-end font-headline font-extrabold tabular-nums text-on-surface">
                {fmtMoney(cost.expectedCents, locale)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <ul className="mt-5 space-y-2 text-[13px] leading-relaxed text-on-surface-variant">
        {cost.lines.some(l => l.freeAttempts > 0) && <li>{t('cost_free_attempts_note')}</li>}
        <li>
          {cost.loanNote === 'not_allowed'
            ? t('cost_loan_none')
            : cost.loanNote === 'max_10000'
              ? t('cost_loan_max')
              : cost.loanNote === 'income_dependent'
                ? t('cost_loan_income')
                : null}
        </li>
        {cost.childcareAllowanceRelevant && <li>{t('cost_childcare')}</li>}
        {cost.naturalisationFeeCents !== null && (
          <li>{t('cost_naturalisation', { amount: fmtMoney(cost.naturalisationFeeCents, locale) })}</li>
        )}
      </ul>
    </Panel>
  );
}

// ────────────────────────────── fine ──────────────────────────────

function FinePanel({ timeline, locale }: { timeline: Timeline; locale: UiLocale }) {
  const t = useTranslations('tijdlijn.result');
  const f = timeline.fine!;
  return (
    <Panel className="p-6 sm:p-8">
      <PanelTitle>{t('fine_title')}</PanelTitle>
      {/* The first sentence an asielstatushouder reads, before anything else on this panel. */}
      {!f.applies ? (
        <p className="text-sm leading-relaxed text-on-surface-variant">{t('fine_none_asiel')}</p>
      ) : (
        <div className="space-y-3 text-sm leading-relaxed text-on-surface-variant">
          {f.leerrouteMaxCents !== null && <p>{t('fine_max', { amount: fmtMoney(f.leerrouteMaxCents, locale) })}</p>}
          {f.pvtMaxCents !== null && <p>{t('fine_pvt', { amount: fmtMoney(f.pvtMaxCents, locale) })}</p>}
          {f.mapMaxCents !== null && <p>{t('fine_map', { amount: fmtMoney(f.mapMaxCents, locale) })}</p>}
          {f.extraTimeMonths !== null && f.newHorizon && (
            <p className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface">
              {t('fine_extra_time', { n: f.extraTimeMonths, date: fmtDate(f.newHorizon.date, locale) })}
            </p>
          )}
          <p>{t('fine_letter')}</p>
        </div>
      )}
    </Panel>
  );
}

// ────────────────────────────── extensions ──────────────────────────────

/**
 * The extension checker, as a checklist rather than a form.
 *
 * The six-month automatic extension under Wi2021 is a real, checkable, largely unknown entitlement,
 * and "you may already have six extra months — check these seven boxes" is the most useful sentence
 * in the tool. Boxes the wizard can answer are ticked from the answers; the rest stay open for the
 * reader to tick themselves, which is what makes the checklist double as an input.
 */
function ExtensionPanel({ timeline }: { timeline: Timeline }) {
  const t = useTranslations('tijdlijn.result');
  const CONDITION_KEY: Record<string, string> = {
    route_b1_including_afgeschaald: 'cond_route_b1',
    termijn_started_at_least_30_months_ago: 'cond_30_months',
    passed_at_least_2_of_4_language_exams_at_pip_level_or_higher: 'cond_2_of_4',
    knm_passed: 'cond_knm',
    all_knm_course_hours_attended: 'cond_knm_hours',
    all_pip_language_lessons_attended: 'cond_lessons',
    pvt_completed: 'cond_pvt',
    map_completed: 'cond_map',
    at_least_450_language_course_hours_plus_knm_hours_at_bow_school: 'cond_450_hours',
    at_least_300_course_hours_at_bow_school_or_vso_pro_isk_within_2_years: 'cond_300_hours',
    at_least_one_full_ona_attempt: 'cond_ona',
    all_other_unpassed_exams_attempted_at_least_twice: 'cond_attempts_twice',
    online_hours_excluded: 'cond_online_excluded',
    applicant_is_woman: 'cond_woman',
    child_born_within_termijn: 'cond_child_born',
  };
  const NAME_KEY: Record<string, string> = {
    childbirth: 'ext_childbirth',
    many_hours_asiel_wi2021: 'ext_many_hours',
    many_hours_gezin_wi2021: 'ext_many_hours',
    many_hours_wi2013: 'ext_many_hours',
    literacy_course: 'ext_literacy',
    dutch_education: 'ext_education',
    illness_self_or_family: 'ext_illness',
    death_of_family_member: 'ext_death',
    homeless_or_shelter: 'ext_homeless',
    gemeente_or_school_failure: 'ext_gemeente',
    other_reason: 'ext_other',
  };

  return (
    <Panel className="p-6 sm:p-8">
      <PanelTitle>{t('extension_title')}</PanelTitle>
      <ul className="space-y-4">
        {timeline.extensions.map(e => {
          const open = e.conditions.filter(c => c.verdict !== 'met').length;
          return (
            <li key={e.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-headline text-[15px] font-extrabold text-on-surface">{t(NAME_KEY[e.id] ?? 'ext_other')}</h3>
                {e.grantMonths > 0 && (
                  <span className="rounded bg-[var(--tl-tint-2)] px-2 py-1 text-[12px] font-bold text-primary">
                    {t('extension_months', { n: e.grantMonths })}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-on-surface-variant">
                {e.automatic ? t('extension_automatic') : t('extension_apply', { n: e.decisionWeeks ?? 8 })}
              </p>

              {e.conditions.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {e.conditions.map(c => (
                    <li key={c.key} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                      <span
                        className={[
                          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2',
                          c.verdict === 'met'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : c.verdict === 'not_met'
                              ? 'border-outline'
                              : 'border-dashed border-outline',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {c.verdict === 'met' && <Check className="size-2.5" strokeWidth={3} />}
                        {c.verdict === 'unknown' && <Minus className="size-2.5 text-outline" strokeWidth={3} />}
                      </span>
                      <span className={c.verdict === 'met' ? 'text-on-surface' : 'text-on-surface-variant'}>
                        {t(CONDITION_KEY[c.key] ?? 'extension_condition_unknown')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-[13px] font-semibold text-on-surface">
                {open === 0 ? t('extension_all') : t('extension_todo', { n: open })}
              </p>
              <a
                href={RULES.sources[e.sourceId]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tl-no-print mt-2 inline-flex min-h-11 items-center gap-2 text-[13px] font-bold text-primary underline decoration-primary/30 underline-offset-4 transition-colors duration-150 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
              >
                {t('extension_check_duo')}
                <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// ────────────────────────────── naturalisation ──────────────────────────────

function NaturalisationPanel({ timeline, locale }: { timeline: Timeline; locale: UiLocale }) {
  const t = useTranslations('tijdlijn.result');
  const n = timeline.naturalisation!;
  return (
    <Panel className="p-6 sm:p-8">
      <PanelTitle>{t('naturalisation_title')}</PanelTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <p className="font-headline text-sm font-bold text-on-surface">{t('naturalisation_residence')}</p>
          {n.residenceEligibleFrom && (
            <p className="mt-2 font-headline text-xl font-extrabold tracking-[-0.02em] text-primary">
              <time dateTime={toISO(n.residenceEligibleFrom.date)}>{fmtDate(n.residenceEligibleFrom.date, locale)}</time>
            </p>
          )}
          <p className="mt-2 text-[13px] text-on-surface-variant">
            {n.residenceEligibleFrom && t('naturalisation_residence_from', { date: fmtDate(n.residenceEligibleFrom.date, locale) })}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <p className="font-headline text-sm font-bold text-on-surface">{t('naturalisation_diploma')}</p>
          {n.diplomaReadyBy && (
            <p className="mt-2 font-headline text-xl font-extrabold tracking-[-0.02em] text-on-surface">
              {t('about')} {fmtMonth(n.diplomaReadyBy.latest, locale)}
            </p>
          )}
          <p className="mt-2">
            <EstimateBadge label={t('estimate_badge')} />
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm leading-relaxed text-on-surface-variant">
        <p className="font-semibold text-on-surface">
          {n.bindingClock === 'residence' ? t('naturalisation_binding_residence') : t('naturalisation_binding_diploma')}
        </p>
        <p>{t('naturalisation_fee', { amount: fmtMoney(n.feeCents, locale) })}</p>
        <p>{t('naturalisation_decision')}</p>
        {n.blockers.includes('z_route_certificate') && (
          <p className="rounded-xl border border-[color:var(--risk-amber)]/40 bg-[color:var(--risk-amber-tint)] p-4 text-on-surface">
            {t('naturalisation_z_route')}
          </p>
        )}
        {n.pendingLawWarning && <p>{t('naturalisation_pending')}</p>}
      </div>
    </Panel>
  );
}

// ────────────────────────────── what-if ──────────────────────────────

/**
 * What-if editing, without redoing the wizard.
 *
 * The retake toggle is the important one: adding one failed exam inserts a whole new registration
 * and result queue — 15 to 23 weeks — and watching the buffer collapse teaches the queue problem
 * better than any amount of copy. It is shown as a *comparison*, never written into the plan, because
 * a plan that assumes you fail is not a plan.
 */
function WhatIf({
  timeline,
  input,
  onChange,
}: {
  timeline: Timeline;
  input: TimelineInput;
  onChange: (next: TimelineInput) => void;
}) {
  const t = useTranslations('tijdlijn.result');
  const tw = useTranslations('tijdlijn.wizard.q6');
  const ids = timeline.components.filter(c => c.required).map(c => c.id);
  const binding = timeline.components.find(c => c.id === timeline.bindingComponent);
  const retakeWeeks = binding ? binding.registrationWeeks + binding.resultWindowWeeks : 0;

  return (
    <Panel className="tl-no-print p-6 sm:p-8">
      <PanelTitle sub={t('whatif_sub')}>{t('whatif_title')}</PanelTitle>

      <div className="grid gap-5 sm:grid-cols-2">
        <Stepper label={tw('course')} value={input.courseHoursPerWeek} onChange={n => onChange({ ...input, courseHoursPerWeek: n })} />
        <Stepper label={tw('self')} value={input.selfStudyHoursPerWeek} onChange={n => onChange({ ...input, selfStudyHoursPerWeek: n })} />
      </div>

      <div className="mt-6 border-t border-outline-variant pt-5">
        <ProgressMatrix input={input} set={p => onChange({ ...input, ...p })} ids={ids} />
      </div>

      <div className="mt-6 border-t border-outline-variant pt-5">
        <p className="font-headline text-sm font-bold text-on-surface">{t('whatif_retake')}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-on-surface-variant">
          {t('whatif_retake_note', { n: retakeWeeks })}
        </p>
      </div>

      <div className="mt-6 border-t border-outline-variant pt-5">
        <p className="mb-2.5 text-[13px] font-semibold text-on-surface">{t('whatif_extension')}</p>
        <div className="flex flex-wrap gap-2">
          {[0, 6, 12, 18, 24].map(m => (
            <Chip
              key={m}
              label={m === 0 ? '—' : `+${m}`}
              selected={input.grantedExtensionMonths === m}
              onSelect={() => onChange({ ...input, grantedExtensionMonths: m })}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ────────────────────────────── save ──────────────────────────────

/**
 * Take it with you.
 *
 * **The result is never gated.** Only the e-mail copy asks for an address, and the timeline itself
 * stays free and indexable — gating it would kill the SEO play the whole tool exists for. The
 * reminder consent is a *separate* checkbox from sending the copy, because "send me this" and "mail
 * me in eight months" are two different permissions.
 */
function SavePanel({
  shareUrl,
  encodedState,
  locale,
}: {
  shareUrl: string;
  encodedState: string;
  locale: UiLocale;
}) {
  const t = useTranslations('tijdlijn.result');
  const [email, setEmail] = useState('');
  const [reminders, setReminders] = useState(true);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const send = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/tijdlijn-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, state: encodedState, locale, reminders }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Panel className="tl-no-print p-6 sm:p-8">
      <PanelTitle sub={t('save_sub')}>{t('save_title')}</PanelTitle>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface transition-colors duration-150 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        >
          <Printer className="size-4" aria-hidden="true" />
          {t('save_pdf')}
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(shareUrl).then(() => setCopied(true));
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface transition-colors duration-150 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        >
          <Link2 className="size-4" aria-hidden="true" />
          {copied ? t('save_link_copied') : t('save_link')}
        </button>
      </div>

      <form
        className="mt-6 border-t border-outline-variant pt-5"
        onSubmit={e => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="tl-email" className="mb-2 block text-[13px] font-semibold text-on-surface">
          {t('save_email_label')}
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="tl-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-headline text-sm font-bold text-on-primary shadow-[var(--shadow-btn-orange)] transition-[transform,box-shadow] duration-200 [background:var(--gradient-btn-orange)] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2"
          >
            <Mail className="size-4" aria-hidden="true" />
            {status === 'sending' ? t('save_email_sending') : t('save_email_cta')}
          </button>
        </div>

        <label className="mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-on-surface-variant">
          <input
            type="checkbox"
            checked={reminders}
            onChange={e => setReminders(e.target.checked)}
            className="mt-0.5 size-4 rounded border-outline-variant text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
          />
          {t('save_email_consent')}
        </label>

        <p className="mt-3 text-[13px] text-on-surface-variant">{t('save_email_privacy')}</p>
        {status === 'done' && <p className="mt-3 text-[13px] font-semibold text-emerald-700">{t('save_email_done')}</p>}
        {status === 'error' && (
          <p className="mt-3 text-[13px] font-semibold text-[color:var(--risk-red)]">{t('save_email_error')}</p>
        )}
      </form>
    </Panel>
  );
}

// ────────────────────────────── warnings and sources ──────────────────────────────

function Warnings({ timeline }: { timeline: Timeline }) {
  const t = useTranslations('tijdlijn.result');
  return (
    <Panel className="bg-surface-container-low p-6 sm:p-8">
      <PanelTitle>{t('warning_title')}</PanelTitle>
      <ul className="space-y-3">
        {timeline.warnings.map(w => (
          <li key={w.id} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-on-surface-variant">
            {w.severity === 'attention' ? (
              <CircleDot className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
            )}
            <span>{t(`w_${w.id}`)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/**
 * The source register, rendered on the tool itself.
 *
 * "Every date traced to a DUO source, with the date we checked it" is the same claim the site makes
 * about its exam content — a real teacher, not AI slop — applied to legal facts. It only means
 * anything if the register is visible, so it ships on the page rather than in a doc.
 */
function Sources() {
  const t = useTranslations('tijdlijn.result');
  const th = useTranslations('tijdlijn.hero');
  const [open, setOpen] = useState(false);
  const entries = useMemo(() => Object.entries(RULES.sources), []);

  return (
    <Panel className="p-6 sm:p-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
      >
        <span>
          <span className="block font-headline text-xl font-extrabold tracking-[-0.02em] text-on-surface">
            {t('sources_title')}
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-on-surface-variant">{t('sources_sub')}</span>
        </span>
        <span className="shrink-0 text-sm font-bold text-primary">{open ? '−' : '+'}</span>
      </button>

      <p className="mt-4 text-[13px] font-semibold text-on-surface-variant">
        {th('rules_checked', { date: RULES.version })}
      </p>

      {open && (
        <>
          <ul className="mt-5 space-y-3">
            {entries.map(([id, s]) => (
              <li key={id} className="text-[13px] leading-relaxed">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors duration-150 hover:decoration-primary"
                >
                  {s.name}
                </a>
                <span className="text-on-surface-variant">
                  {' · '}
                  {t('sources_checked', { date: s.checkedOn })}
                  {s.needsPrimaryConfirmation ? ` · ${t('sources_needs_confirmation')}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-outline-variant pt-5">
            <p className="font-headline text-sm font-bold text-on-surface">{t('sources_planning_title')}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-on-surface-variant">{t('sources_planning_body')}</p>
          </div>
        </>
      )}
    </Panel>
  );
}
