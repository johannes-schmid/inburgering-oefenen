/**
 * De Tijdlijn-check — the questionnaire.
 *
 * Six questions plus one optional seventh, one per screen. The whole design answers a single risk
 * from the PRD: **the wizard must not feel like a government form**, because that is the exact thing
 * its readers are fleeing. So:
 *
 * - **Every question has "Ik weet het niet", in normal type, never styled as a failure.** Most
 *   people genuinely do not know which law applies to them; a tool that blocks on that is useless to
 *   the majority. `unknown` is a first-class value all the way down to the engine.
 * - **Nothing is typed except two numbers.** Q2 — the one date that every other date derives from —
 *   is a month grid and a row of year chips, not a date input: no keyboard, no locale format
 *   ambiguity across nl/en/ar, and it works one-handed on a shared phone.
 * - **Value arrives before the end.** From Q2 onward a slim strip shows the deadline forming
 *   ("Je deadline: ± mei 2028"). Someone who abandons at Q4 still leaves with the thing they came for.
 * - **Consequences, not labels.** Every option card carries a line about what choosing it means —
 *   "de gemeente betaalt meestal je cursus" — because the label alone is not answerable.
 * - **Q5 is the interactive centre**: a matrix of onderdelen × state chips. It is also the *same*
 *   control the result screen reuses for what-if editing, so learning it once pays twice.
 *
 * The wizard is a pure controlled component: it owns no answer state. `TijdlijnApp` holds the
 * `TimelineInput`, which is what makes the live preview, the URL sync and "antwoorden aanpassen" all
 * work off one source of truth.
 */
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  BookOpen,
  Building2,
  CalendarClock,
  FileText,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Landmark,
  Plane,
  Users,
} from 'lucide-react';
import { computeTimeline } from '@/lib/tijdlijn/engine/compute';
import { effectiveHoursPerWeek } from '@/lib/tijdlijn/engine/estimate';
import { RULES } from '@/lib/tijdlijn/rules';
import { pd, type PlainDate } from '@/lib/tijdlijn/engine/dates';
import { fmtMonth, fmtMonthName } from '@/lib/tijdlijn/format';
import type { UiLocale } from '@/lib/tijdlijn/format';
import type {
  ComponentId,
  ComponentState,
  ExtensionSignal,
  Level,
  TimelineInput,
} from '@/lib/tijdlijn/engine/types';
import { Chip, OptionCard, Panel, Stepper } from './ui';
import TimelineChart from './TimelineChart';

/** Q1's answer shapes the rest of the wizard and the result mode. It is not stored on the input. */
export type Stage = 'abroad' | 'arrived' | 'letter' | 'busy' | 'over' | 'passport';

type Props = {
  input: TimelineInput;
  onChange: (next: TimelineInput) => void;
  stage: Stage | null;
  onStageChange: (s: Stage) => void;
  onFinish: () => void;
  today: PlainDate;
  locale: UiLocale;
};

/*
 * Which questions this person is actually asked.
 *
 * **Step 8 — "since when do you live in the Netherlands?" — comes second for everyone**, and it is
 * the question that makes the chart useful before anything else is known (owner's decision,
 * 2026-08-20). It is the one date almost every reader can answer without looking anything up, and
 * from it the chart can already draw where they are, when DUO will write to them, roughly when their
 * PIP lands, and the passport clock. Asking for a PIP date first and nothing else would leave a
 * blank chart in front of the majority of readers who do not have one yet.
 *
 * Q2 (the PIP/DUO-letter anchor) is then skipped for the two stages where such a paper cannot exist,
 * and Q4's route is skipped for the passport path, which has no route. Steps are computed rather than
 * hard-coded so the progress bar cannot lie about how much is left.
 */
function stepsFor(stage: Stage | null): number[] {
  if (stage === 'abroad' || stage === 'arrived') return [1, 8, 3, 6, 7];
  if (stage === 'passport') return [1, 8, 3, 6, 7];
  return [1, 8, 2, 3, 4, 5, 6, 7];
}

export default function Wizard({ input, onChange, stage, onStageChange, onFinish, today, locale }: Props) {
  const t = useTranslations('tijdlijn.wizard');
  const [index, setIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const steps = stepsFor(stage);
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const set = (patch: Partial<TimelineInput>) => onChange({ ...input, ...patch });

  /* Recomputing the whole timeline on every tap is free — the engine is a pure function over a few
   * dozen dates — so the chart beside the question is never stale and never a second model of the
   * plan. This is the reason the chart can live here at all. */
  const timeline = useMemo(() => computeTimeline(input, RULES, today), [input, today]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0">
      <Progress index={index} total={steps.length} label={t('step', { n: index + 1, total: steps.length })} />

      <Panel className="mt-5 p-5 sm:p-7">
        {step === 1 && <Q1 stage={stage} onStageChange={onStageChange} />}
        {step === 2 && (
          <Q2 input={input} set={set} today={today} locale={locale} helpOpen={helpOpen} setHelpOpen={setHelpOpen} />
        )}
        {step === 3 && <Q3 input={input} set={set} />}
        {step === 4 && <Q4 input={input} set={set} />}
        {step === 5 && <Q5 input={input} set={set} />}
        {step === 6 && <Q6 input={input} set={set} />}
        {step === 7 && <Q7 input={input} set={set} today={today} />}
        {step === 8 && <QResidence input={input} set={set} today={today} locale={locale} />}

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-outline-variant pt-5">
          <button
            type="button"
            onClick={() => (index === 0 ? undefined : setIndex(index - 1))}
            disabled={index === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-on-surface-variant transition-colors duration-150 hover:text-on-surface disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t('back')}
          </button>

          <div className="flex items-center gap-2">
            {/* Skipping is a normal action, not an escape hatch, so it is a plain link at the same
                weight as Back — never smaller, never greyed into invisibility. */}
            {!isLast && (
              <button
                type="button"
                onClick={() => setIndex(index + 1)}
                className="min-h-11 rounded-lg px-3 text-sm text-on-surface-variant underline decoration-outline-variant underline-offset-4 transition-colors duration-150 hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
              >
                {t('skip')}
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onFinish() : setIndex(index + 1))}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-headline text-sm font-bold text-on-primary shadow-[var(--shadow-btn-orange)] transition-[transform,box-shadow] duration-200 [background:var(--gradient-btn-orange)] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-btn-orange-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2"
            >
              {isLast ? t('finish') : t('next')}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Panel>

      </div>

      {/* The chart is the wizard's other half, not its reward. It is `sticky` on desktop so it stays
          in view while the questions scroll, and it sits *below* the question on mobile — where a
          chart above the fold would push the answer buttons off it. */}
      <Panel className="p-5 sm:p-6 lg:sticky lg:top-24">
        <TimelineChart timeline={timeline} input={input} today={today} locale={locale} compact />
        <p className="mt-3 text-[12px] leading-relaxed text-on-surface-variant">{t('preview_hint')}</p>
      </Panel>
    </div>
  );
}

/**
 * Since when do you live in the Netherlands? — asked second, of everybody.
 *
 * Year and month chips, like the anchor question, because this is the same kind of half-remembered
 * date and the same reasons apply: no keyboard, no `dd/mm` ambiguity across three locales, one hand.
 * It feeds three things at once — the chart's origin, the estimated DUO-letter and PIP milestones for
 * anyone whose clock has not started, and the five-year naturalisation clock.
 */
function QResidence({
  input,
  set,
  today,
  locale,
}: {
  input: TimelineInput;
  set: (p: Partial<TimelineInput>) => void;
  today: PlainDate;
  locale: UiLocale;
}) {
  const t = useTranslations('tijdlijn.wizard.q_residence');
  const years = Array.from({ length: 21 }, (_, i) => today.y - 20 + i);
  const chosen = input.residenceStart ?? null;

  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />
      <div className="flex flex-wrap gap-2">
        {years.map(y => (
          <Chip
            key={y}
            label={String(y)}
            selected={chosen?.y === y}
            onSelect={() => set({ residenceStart: pd(y, chosen?.m ?? 1, 1) })}
          />
        ))}
      </div>

      {chosen && (
        <div className="mt-5">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <Chip
                key={m}
                label={monthLabel(m, locale)}
                selected={chosen.m === m}
                onSelect={() => set({ residenceStart: pd(chosen.y, m, 1) })}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-outline-variant pt-4">
        <OptionCard
          compact
          label={t('unknown')}
          selected={!input.residenceStart}
          onSelect={() => set({ residenceStart: undefined })}
        />
      </div>
    </div>
  );
}

/* Three letters is enough in a 12-cell grid and it keeps the row from wrapping on a 390px screen.
 * Arabic month names do not truncate meaningfully, so they are left whole. */
function monthLabel(m: number, locale: UiLocale): string {
  const full = fmtMonthName(m, locale);
  return locale === 'ar' ? full : full.slice(0, 3);
}

/** A rule that fills, not a percentage. A number would invite the reader to do arithmetic. */
function Progress({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high" role="presentation">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-[13px] font-semibold text-on-surface-variant">{label}</p>
    </div>
  );
}

function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-5">
      <h2 className="font-headline text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-on-surface">
        {title}
      </h2>
      {sub && <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{sub}</p>}
    </header>
  );
}

// ────────────────────────────── Q1 · where are you ──────────────────────────────

function Q1({ stage, onStageChange }: { stage: Stage | null; onStageChange: (s: Stage) => void }) {
  const t = useTranslations('tijdlijn.wizard.q1');
  const options: { id: Stage; icon: typeof Plane }[] = [
    { id: 'abroad', icon: Plane },
    { id: 'arrived', icon: Home },
    { id: 'letter', icon: FileText },
    { id: 'busy', icon: BookOpen },
    { id: 'over', icon: CalendarClock },
    { id: 'passport', icon: Landmark },
  ];
  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />
      <div className="grid gap-2.5">
        {options.map(o => (
          <OptionCard
            key={o.id}
            icon={o.icon}
            label={t(o.id)}
            note={t(`${o.id}_note`)}
            selected={stage === o.id}
            onSelect={() => onStageChange(o.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────── Q2 · the anchor date ──────────────────────────────

/**
 * The most important question in the tool, and the only one worth this much interface.
 *
 * Every date on the result screen derives from this one, and the three papers people hold carry
 * **three different dates** — the PIP's dagtekening (term starts the day after), the DUO letter's
 * stated date, and the gemeente registration, which precedes both. Asking "when did your term
 * start?" and taking any answer would silently mix them. So the reader first says *which paper is in
 * their hand*, and the copy for each option states what that paper actually means.
 *
 * Month + year only: a month grid and year chips, no keyboard, no `dd/mm` versus `mm/dd`. Almost
 * nobody remembers the day, and the engine handles month precision honestly by widening the range.
 */
function Q2({
  input,
  set,
  today,
  locale,
  helpOpen,
  setHelpOpen,
}: {
  input: TimelineInput;
  set: (p: Partial<TimelineInput>) => void;
  today: PlainDate;
  locale: UiLocale;
  helpOpen: boolean;
  setHelpOpen: (b: boolean) => void;
}) {
  const t = useTranslations('tijdlijn.wizard.q2');
  const tw = useTranslations('tijdlijn.wizard');
  const anchor = input.anchor;
  const kind = anchor.kind === 'unknown' ? null : anchor.kind;
  const chosen = anchor.kind === 'unknown' ? null : anchor.date;

  const setKind = (k: 'pip' | 'duo_letter' | 'gemeente_registration') =>
    set({ anchor: { kind: k, date: chosen ?? pd(today.y - 1, today.m, 1), precision: 'month' } });

  const setYm = (y: number, m: number) =>
    set({ anchor: { kind: kind ?? 'pip', date: pd(y, m, 1), precision: 'month' } });

  /* Ten years back is enough for every live case: Wi2013 obligations began before 2022 and the term
   * plus every extension runs at most five years, so anything older is already resolved. */
  const years = Array.from({ length: 11 }, (_, i) => today.y - 10 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />

      <p className="mb-2.5 text-[13px] font-semibold text-on-surface">{t('which_paper')}</p>
      <div className="grid gap-2.5">
        <OptionCard icon={FileText} label={t('pip')} note={t('pip_note')} selected={kind === 'pip'} onSelect={() => setKind('pip')} />
        <OptionCard
          icon={FileText}
          label={t('letter')}
          note={t('letter_note')}
          selected={kind === 'duo_letter'}
          onSelect={() => setKind('duo_letter')}
        />
        <OptionCard
          icon={Building2}
          label={t('gemeente')}
          note={t('gemeente_note')}
          selected={kind === 'gemeente_registration'}
          onSelect={() => setKind('gemeente_registration')}
        />
      </div>

      {kind && (
        <div className="mt-6 border-t border-outline-variant pt-5">
          <p className="mb-2.5 text-[13px] font-semibold text-on-surface">{t('year')}</p>
          <div className="flex flex-wrap gap-2">
            {years.map(y => (
              <Chip key={y} label={String(y)} selected={chosen?.y === y} onSelect={() => setYm(y, chosen?.m ?? 1)} />
            ))}
          </div>

          <p className="mb-2.5 mt-5 text-[13px] font-semibold text-on-surface">{t('month')}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {months.map(m => (
              <Chip
                key={m}
                label={fmtMonthName(m, locale)}
                selected={chosen?.m === m}
                onSelect={() => setYm(chosen?.y ?? today.y - 1, m)}
              />
            ))}
          </div>

          {chosen && (
            <p className="mt-4 text-sm font-semibold text-primary">{t('chosen', { date: fmtMonth(chosen, locale) })}</p>
          )}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setHelpOpen(!helpOpen)}
          aria-expanded={helpOpen}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors duration-150 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        >
          <Info className="size-4" aria-hidden="true" />
          {tw('help_toggle')}
        </button>
        {helpOpen && (
          <div className="mt-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="font-headline text-sm font-bold text-on-surface">{t('help_title')}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{t('help_body')}</p>
            {/* A schematic of the letter with the field ringed. Deliberately a diagram and not a
                photograph: a photo of a real DUO letter would carry somebody's actual data. */}
            <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-3" aria-hidden="true">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="h-2 w-16 rounded bg-surface-container-high" />
                  <div className="h-2 w-24 rounded bg-surface-container-high" />
                </div>
                <div className="rounded border-2 border-dashed border-secondary-container px-2 py-1">
                  <div className="h-2 w-14 rounded bg-secondary-container/50" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-secondary">dagtekening</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-2 w-full rounded bg-surface-container-high" />
                <div className="h-2 w-5/6 rounded bg-surface-container-high" />
                <div className="h-2 w-2/3 rounded bg-surface-container-high" />
              </div>
            </div>
          </div>
        )}
      </div>

      <DontKnow onSelect={() => set({ anchor: { kind: 'unknown' } })} selected={anchor.kind === 'unknown'} />
    </div>
  );
}

// ────────────────────────────── Q3 · status ──────────────────────────────

function Q3({ input, set }: { input: TimelineInput; set: (p: Partial<TimelineInput>) => void }) {
  const t = useTranslations('tijdlijn.wizard.q3');
  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />
      <div className="grid gap-2.5">
        <OptionCard icon={Home} label={t('asiel')} note={t('asiel_note')} selected={input.status === 'asiel'} onSelect={() => set({ status: 'asiel' })} />
        <OptionCard icon={Users} label={t('gezin')} note={t('gezin_note')} selected={input.status === 'gezin_overig'} onSelect={() => set({ status: 'gezin_overig' })} />
        <OptionCard icon={Plane} label={t('eu')} note={t('eu_note')} selected={input.status === 'eu_niet_plichtig'} onSelect={() => set({ status: 'eu_niet_plichtig' })} />
      </div>
      <DontKnow onSelect={() => set({ status: 'unknown' })} selected={input.status === 'unknown'} />
    </div>
  );
}

// ────────────────────────────── Q4 · route ──────────────────────────────

function Q4({ input, set }: { input: TimelineInput; set: (p: Partial<TimelineInput>) => void }) {
  const t = useTranslations('tijdlijn.wizard.q4');
  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />
      <div className="grid gap-2.5">
        <OptionCard label={t('b1')} note={t('b1_note')} selected={input.route === 'b1'} onSelect={() => set({ route: 'b1', law: 'wi2021', targetLevel: 'b1' })} />
        <OptionCard icon={GraduationCap} label={t('onderwijs')} note={t('onderwijs_note')} selected={input.route === 'onderwijs'} onSelect={() => set({ route: 'onderwijs', law: 'wi2021', targetLevel: 'b1' })} />
        <OptionCard label={t('z')} note={t('z_note')} selected={input.route === 'z'} onSelect={() => set({ route: 'z', law: 'wi2021', targetLevel: 'unknown' })} />
        <OptionCard label={t('wi2013')} note={t('wi2013_note')} selected={input.route === 'a2_wi2013'} onSelect={() => set({ route: 'a2_wi2013', law: 'wi2013', targetLevel: 'a2' })} />
      </div>
      <DontKnow onSelect={() => set({ route: 'unknown' })} selected={input.route === 'unknown'} />
    </div>
  );
}

// ────────────────────────────── Q5 · progress matrix ──────────────────────────────

const MATRIX_STATES: ComponentState[] = ['not_started', 'studying', 'registered', 'passed', 'failed'];

/**
 * The progress matrix — the wizard's most interactive screen, and reused verbatim on the result
 * page as the what-if editor. One control learned once, used twice.
 */
export function ProgressMatrix({
  input,
  set,
  ids,
}: {
  input: TimelineInput;
  set: (p: Partial<TimelineInput>) => void;
  ids: ComponentId[];
}) {
  const t = useTranslations('tijdlijn.wizard.q5');
  const tc = useTranslations('tijdlijn.result.component');

  const setState = (id: ComponentId, state: ComponentState) =>
    set({
      progress: {
        ...input.progress,
        [id]: { ...(input.progress[id] ?? {}), state },
      },
    });

  return (
    <ul className="divide-y divide-outline-variant">
      {ids.map(id => (
        <li key={id} className="flex flex-wrap items-center gap-3 py-3">
          <span className="w-28 shrink-0 font-headline text-sm font-bold text-on-surface">{tc(id)}</span>
          <div className="flex flex-wrap gap-2">
            {MATRIX_STATES.map(s => (
              <Chip
                key={s}
                label={t(`state_${s}`)}
                selected={(input.progress[id]?.state ?? 'not_started') === s}
                onSelect={() => setState(id, s)}
                tone={s === 'passed' ? 'good' : s === 'failed' ? 'warn' : 'neutral'}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Q5({ input, set }: { input: TimelineInput; set: (p: Partial<TimelineInput>) => void }) {
  const t = useTranslations('tijdlijn.wizard.q5');
  /* The matrix lists the components this person's own route requires — showing ONA to someone under
   * Wi2021, or MAP to the Onderwijsroute, would ask them about work they will never do. */
  const ids = useMemo(() => {
    const tl = computeTimeline(input, RULES, pd(2026, 1, 1));
    return tl.components.filter(c => c.required).map(c => c.id);
  }, [input]);

  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />
      <ProgressMatrix input={input} set={set} ids={ids} />
    </div>
  );
}

// ────────────────────────────── Q6 · study hours ──────────────────────────────

const LEVELS: Level[] = ['a0', 'a1', 'a2', 'b1'];

function Q6({ input, set }: { input: TimelineInput; set: (p: Partial<TimelineInput>) => void }) {
  const t = useTranslations('tijdlijn.wizard.q6');
  const eff = effectiveHoursPerWeek(input, RULES);
  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Stepper label={t('course')} value={input.courseHoursPerWeek} onChange={n => set({ courseHoursPerWeek: n })} />
        <Stepper label={t('self')} value={input.selfStudyHoursPerWeek} onChange={n => set({ selfStudyHoursPerWeek: n })} />
      </div>
      <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <p className="font-headline text-sm font-bold text-on-surface">{t('effective', { n: eff })}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">{t('effective_note')}</p>
      </div>

      <p className="mb-2.5 mt-6 text-[13px] font-semibold text-on-surface">{t('level_title')}</p>
      <div className="grid gap-2.5">
        {LEVELS.map(l => (
          <OptionCard
            key={l}
            compact
            label={t(`level_${l}`)}
            selected={input.currentLevel === l}
            onSelect={() => set({ currentLevel: l })}
          />
        ))}
      </div>
      <DontKnow onSelect={() => set({ currentLevel: 'unknown' })} selected={input.currentLevel === 'unknown'} />
    </div>
  );
}

// ────────────────────────────── Q7 · passport and lost time ──────────────────────────────

const SIGNALS: { id: ExtensionSignal; icon: typeof Baby }[] = [
  { id: 'literacy_course', icon: BookOpen },
  { id: 'dutch_education', icon: GraduationCap },
  { id: 'illness', icon: HeartPulse },
  { id: 'death_in_family', icon: HeartPulse },
  { id: 'childbirth', icon: Baby },
  { id: 'homeless_or_shelter', icon: Home },
  { id: 'gemeente_or_school_failure', icon: Building2 },
];

const SIGNAL_KEY: Record<string, string> = {
  literacy_course: 'sig_literacy',
  dutch_education: 'sig_education',
  illness: 'sig_illness',
  death_in_family: 'sig_death',
  childbirth: 'sig_birth',
  homeless_or_shelter: 'sig_homeless',
  gemeente_or_school_failure: 'sig_gemeente',
};

function Q7({ input, set, today }: { input: TimelineInput; set: (p: Partial<TimelineInput>) => void; today: PlainDate }) {
  const t = useTranslations('tijdlijn.wizard.q7');
  const toggle = (s: ExtensionSignal) =>
    set({
      extensionSignals: input.extensionSignals.includes(s)
        ? input.extensionSignals.filter(x => x !== s)
        : [...input.extensionSignals.filter(x => x !== 'none'), s],
    });

  const years = Array.from({ length: 16 }, (_, i) => today.y - 15 + i);

  return (
    <div>
      <Head title={t('title')} sub={t('sub')} />

      <p className="mb-2.5 text-[13px] font-semibold text-on-surface">{t('passport_title')}</p>
      <div className="flex flex-wrap gap-2">
        <Chip label={t('passport_yes')} selected={input.wantsNaturalisation} onSelect={() => set({ wantsNaturalisation: true })} />
        <Chip label={t('passport_no')} selected={!input.wantsNaturalisation} onSelect={() => set({ wantsNaturalisation: false, residenceStart: undefined })} />
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">{t('passport_note')}</p>

      {input.wantsNaturalisation && (
        <div className="mt-5">
          <p className="mb-2.5 text-[13px] font-semibold text-on-surface">{t('residence_title')}</p>
          <div className="flex flex-wrap gap-2">
            {years.map(y => (
              <Chip
                key={y}
                label={String(y)}
                selected={input.residenceStart?.y === y}
                onSelect={() => set({ residenceStart: pd(y, 1, 1) })}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 border-t border-outline-variant pt-5">
        <p className="text-[13px] font-semibold text-on-surface">{t('signals_title')}</p>
        <p className="mb-3 mt-1 text-[13px] leading-relaxed text-on-surface-variant">{t('signals_note')}</p>
        <div className="grid gap-2.5">
          {SIGNALS.map(s => (
            <OptionCard
              key={s.id}
              compact
              icon={s.icon}
              label={t(SIGNAL_KEY[s.id])}
              selected={input.extensionSignals.includes(s.id)}
              onSelect={() => toggle(s.id)}
            />
          ))}
          <OptionCard
            compact
            label={t('sig_none')}
            selected={input.extensionSignals.length === 0 || input.extensionSignals.includes('none')}
            onSelect={() => set({ extensionSignals: [] })}
          />
        </div>
      </div>

      <div className="mt-7 border-t border-outline-variant pt-5">
        <p className="mb-2.5 text-[13px] font-semibold text-on-surface">{t('extension_title')}</p>
        <div className="flex flex-wrap gap-2">
          <Chip label={t('extension_none')} selected={input.grantedExtensionMonths === 0} onSelect={() => set({ grantedExtensionMonths: 0 })} />
          {[6, 12, 18, 24].map(m => (
            <Chip
              key={m}
              label={t('extension_months', { n: m })}
              selected={input.grantedExtensionMonths === m}
              onSelect={() => set({ grantedExtensionMonths: m })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Always present, never styled as a failure. See the file header. */
function DontKnow({ onSelect, selected }: { onSelect: () => void; selected: boolean }) {
  const t = useTranslations('tijdlijn.wizard');
  return (
    <div className="mt-5 border-t border-outline-variant pt-4">
      <OptionCard compact label={t('dont_know')} note={t('dont_know_hint')} selected={selected} onSelect={onSelect} />
    </div>
  );
}
