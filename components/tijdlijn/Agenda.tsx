/**
 * "Wanneer moet je wat doen?" — the plan as instructions rather than as a picture.
 *
 * The chart shows shape and the verdict card shows the one date that matters; this is the part a
 * reader can work from week to week. Every action on one dated list, **merged across components and
 * sorted chronologically**, because the components interleave — you start studying for Lezen while
 * waiting for the KNM result — and nobody reconstructs that interleaving from four separate rows.
 *
 * Three things it is careful about:
 *
 * - **Your actions and DUO's waiting are visually separate.** A list that mixes "register for this"
 *   with "the result arrives" reads as twice the work. The first are marked, indented items with a
 *   filled dot; the second are quiet lines.
 * - **A date that has passed stays on the list**, marked, never scolded. "You should already have
 *   started" is the single most useful thing the backward calculation produces, and hiding it would
 *   make the plan look achievable by deleting the part that is not.
 * - **Estimates keep the word *ongeveer* and a range.** The register-by dates are DUO arithmetic and
 *   read as single dates; the start-studying dates are ours and never pretend otherwise.
 */
'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, CalendarCheck, CircleAlert, FileCheck2, Flag, Landmark, PenLine } from 'lucide-react';
import { toISO, type PlainDate } from '@/lib/tijdlijn/engine/dates';
import { buildAgenda, nextActions, weeksAway, type AgendaItem } from '@/lib/tijdlijn/agenda';
import { fmtDate, fmtMonth, type UiLocale } from '@/lib/tijdlijn/format';
import type { Timeline } from '@/lib/tijdlijn/engine/types';
import { EstimateBadge, Panel, PanelTitle, SourceBadge } from './ui';
import { RULES } from '@/lib/tijdlijn/rules';

const ICON = {
  start: BookOpen,
  register: CalendarCheck,
  exam: PenLine,
  result: FileCheck2,
  gemeente: Landmark,
  deadline: Flag,
} as const;

/** The component's own name plus its level: "Schrijven A2", never a bare "Schrijven". */
export function useComponentLabel() {
  const tc = useTranslations('tijdlijn.result.component');
  return (id: string | null, level: string | null) =>
    id ? `${tc(id)}${level ? ` ${level.toUpperCase()}` : ''}` : '';
}

export default function Agenda({
  timeline,
  today,
  locale,
}: {
  timeline: Timeline;
  today: PlainDate;
  locale: UiLocale;
}) {
  const t = useTranslations('tijdlijn.agenda');
  const label = useComponentLabel();
  const agenda = buildAgenda(timeline, today);

  if (agenda.length === 0) {
    return (
      <Panel className="p-6 sm:p-8">
        <PanelTitle sub={t('sub')}>{t('title')}</PanelTitle>
        <p className="text-sm leading-relaxed text-on-surface-variant">{t('no_dates')}</p>
      </Panel>
    );
  }

  /* Grouped by year, because a plan that spans three of them is unreadable as one flat run and the
   * year is the unit people hold in their head ("so all of that is next year"). */
  const byYear = new Map<number, AgendaItem[]>();
  for (const item of agenda) {
    const list = byYear.get(item.date.y) ?? [];
    list.push(item);
    byYear.set(item.date.y, list);
  }

  return (
    <Panel className="p-6 sm:p-8">
      <PanelTitle sub={t('sub')}>{t('title')}</PanelTitle>

      {[...byYear.entries()].map(([year, items]) => (
        <section key={year} className="mt-6 first:mt-0">
          <h3 className="mb-3 font-headline text-sm font-extrabold tabular-nums tracking-[0.04em] text-on-surface-variant">
            {year}
          </h3>
          <ol className="space-y-1">
            {items.map(item => (
              <li key={item.id}>
                <Line item={item} today={today} locale={locale} label={label} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </Panel>
  );
}

function Line({
  item,
  today,
  locale,
  label,
}: {
  item: AgendaItem;
  today: PlainDate;
  locale: UiLocale;
  label: (id: string | null, level: string | null) => string;
}) {
  const t = useTranslations('tijdlijn.agenda');
  const tr = useTranslations('tijdlijn.result');
  const Icon = item.overdue ? CircleAlert : ICON[item.kind];
  const mine = item.actor === 'you' || item.actor === 'gemeente';
  const weeks = weeksAway(item, today);

  /* A range renders as "tussen maart en mei 2028" — months, not days. Day precision on a date our
   * own model produced would be false confidence. */
  const when =
    item.from && toISO(item.from) !== toISO(item.date)
      ? t('between', { from: fmtMonth(item.from, locale), to: fmtMonth(item.date, locale) })
      : item.precision === 'estimate'
        ? `${tr('about')} ${fmtMonth(item.date, locale)}`
        : fmtDate(item.date, locale);

  return (
    <div
      className={[
        'flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg px-3 py-2.5',
        mine ? 'bg-[var(--tl-tint-1)]' : '',
        item.overdue ? 'bg-[color:var(--risk-red-tint)]' : '',
      ].join(' ')}
    >
      <Icon
        className="mt-1 size-4 shrink-0"
        style={{
          color: item.overdue
            ? 'var(--risk-red)'
            : item.kind === 'deadline'
              ? 'var(--color-primary)'
              : mine
                ? 'var(--color-primary)'
                : 'var(--color-outline)',
        }}
        aria-hidden="true"
      />

      <span
        className={`min-w-0 flex-1 text-sm leading-relaxed ${mine ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}
      >
        {item.kind === 'deadline'
          ? t('kind.deadline')
          : t(`kind.${item.kind}`, { component: label(item.component, item.level) })}
      </span>

      <time
        dateTime={toISO(item.date)}
        className={`whitespace-nowrap text-[13px] tabular-nums ${item.overdue ? 'font-bold text-[color:var(--risk-red)]' : 'text-on-surface'}`}
      >
        {when}
      </time>

      {item.precision === 'legal' && item.sourceId ? (
        <SourceBadge label={tr('duo_badge')} href={RULES.sources[item.sourceId]?.url} />
      ) : (
        <EstimateBadge label={tr('estimate_badge')} />
      )}

      <span className="w-full text-[12px] text-on-surface-variant">
        {item.overdue ? t('overdue') : weeks === 0 ? t('this_week') : t('in_weeks', { n: weeks })}
        {/* The deadline gets no actor line. "dit gebeurt dan" is right for a result landing and wrong
            for the end of a legal term — nobody performs that, it simply arrives. */}
        {item.kind !== 'deadline' && (
          <>
            {' · '}
            {t(item.actor)}
          </>
        )}
      </span>
    </div>
  );
}

/**
 * The next handful of actions, for the verdict card.
 *
 * Deliberately not the whole agenda: the answer to "what do I do now" is three lines, and a reader
 * in mode `at_risk` who is shown thirty dated rows scrolls past all of them.
 */
export function NextActions({
  timeline,
  today,
  locale,
}: {
  timeline: Timeline;
  today: PlainDate;
  locale: UiLocale;
}) {
  const t = useTranslations('tijdlijn.agenda');
  const label = useComponentLabel();
  const items = nextActions(buildAgenda(timeline, today));
  if (items.length === 0) return null;

  return (
    <div className="mt-6 border-t border-outline-variant pt-5">
      <p className="mb-3 font-headline text-sm font-bold text-on-surface">{t('next_title')}</p>
      <ol className="space-y-2">
        {items.map(item => {
          const Icon = item.overdue ? CircleAlert : ICON[item.kind];
          return (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
              <Icon
                className="mt-1 size-3.5 shrink-0"
                style={{ color: item.overdue ? 'var(--risk-red)' : 'var(--color-primary)' }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 font-semibold text-on-surface">
                {item.kind === 'deadline'
                  ? t('kind.deadline')
                  : t(`kind.${item.kind}`, { component: label(item.component, item.level) })}
              </span>
              <time
                dateTime={toISO(item.date)}
                className={`whitespace-nowrap tabular-nums ${item.overdue ? 'font-bold text-[color:var(--risk-red)]' : 'text-on-surface-variant'}`}
              >
                {item.overdue
                  ? t('overdue')
                  : item.precision === 'estimate'
                    ? `${fmtMonth(item.date, locale)}`
                    : fmtDate(item.date, locale)}
              </time>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
