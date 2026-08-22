/**
 * The small vocabulary the tijdlijn tool is built from. Deliberately tiny.
 *
 * Existing site components (`SkillCard`, `FeatureCard`, the shadcn primitives) cover marketing
 * surfaces and forms; a wizard needs one thing they do not have — a **large, tappable option card
 * that carries a consequence line**. "Ik ben asielstatushouder" means nothing on its own; "de
 * gemeente betaalt meestal je cursus" is what makes the answer choosable. That pattern is the whole
 * reason this file exists, and everything else here is one-line glue so the wizard and the result
 * screen cannot drift apart.
 *
 * Interaction rules that apply to every control below, from `CLAUDE.md`'s design rules:
 * hover, `focus-visible` and active states on everything clickable; touch targets ≥ 44px; never
 * `transition-all`; no emoji, lucide icons only; and status is never colour alone.
 */
'use client';

import type { ReactNode } from 'react';
import { Check, type LucideIcon } from 'lucide-react';

/** One answer. Big, one-handed, and it says what choosing it means. */
export function OptionCard({
  label,
  note,
  selected,
  onSelect,
  icon: Icon,
  compact = false,
}: {
  label: string;
  note?: string;
  selected: boolean;
  onSelect: () => void;
  icon?: LucideIcon;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'group flex w-full items-start gap-3 rounded-xl border p-4 text-start',
        'transition-[transform,box-shadow,border-color,background-color] duration-200',
        '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-0.5 active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2',
        selected
          ? 'border-primary bg-[var(--tl-tint-1)] shadow-[var(--shadow-card-md)]'
          : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:shadow-[var(--shadow-card)]',
        compact ? 'min-h-11' : 'min-h-16',
      ].join(' ')}
    >
      {/* The tick is the state; the tint only reinforces it. Colour alone would fail WCAG 1.4.1. */}
      <span
        className={[
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />}
          <span className="font-headline text-[15px] font-bold leading-snug tracking-[-0.01em] text-on-surface">
            {label}
          </span>
        </span>
        {note && <span className="mt-1 block text-[13px] leading-relaxed text-on-surface-variant">{note}</span>}
      </span>
    </button>
  );
}

/** A small toggle in a row of them — the month grid, the progress states, the level picker. */
export function Chip({
  label,
  selected,
  onSelect,
  tone = 'neutral',
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  const selectedTone =
    tone === 'good'
      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
      : tone === 'warn'
        ? 'border-[color:var(--risk-amber)] bg-[color:var(--risk-amber-tint)] text-[color:var(--risk-amber)]'
        : 'border-primary bg-primary text-on-primary';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'min-h-11 rounded-lg border px-3 text-[13px] font-semibold',
        'transition-[transform,background-color,border-color,color] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2',
        selected
          ? selectedTone
          : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/40 hover:text-on-surface',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

/** A white card on the page's tinted background. The base surface of every panel. */
export function Panel({
  children,
  className = '',
  as: As = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}) {
  return (
    <As
      className={`tl-page rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </As>
  );
}

export function PanelTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <header className="mb-5">
      <h2 className="font-headline text-xl font-extrabold tracking-[-0.02em] text-on-surface">{children}</h2>
      {sub && <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{sub}</p>}
    </header>
  );
}

/**
 * The two badges that keep the tool honest.
 *
 * `volgens DUO` may only ever sit next to a `LegalDate`; `onze schatting` only next to an
 * `EstimatedDate`. That is enforced at the type level in the engine — see `engine/types.ts` — and
 * this component is the visual half of the same rule. They must never look alike: solid versus
 * dashed, and different words. A reader has to be able to tell law from guess at a glance.
 */
export function SourceBadge({ label, href }: { label: string; href?: string }) {
  const body = (
    <>
      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      {label}
    </>
  );
  const cls =
    'inline-flex items-center gap-1.5 rounded border border-primary/25 bg-[var(--tl-tint-2)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary';
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} transition-colors duration-150 hover:bg-[var(--tl-tint-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container`}
    >
      {body}
    </a>
  ) : (
    <span className={cls}>{body}</span>
  );
}

export function EstimateBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-outline px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">
      {label}
    </span>
  );
}

/** A number the user changes by tapping, not by typing. Steppers beat sliders on a shared phone. */
export function Stepper({
  label,
  value,
  onChange,
  max = 40,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(0, Math.round(n * 2) / 2)));
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-on-surface" htmlFor={`st-${label}`}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <StepButton onClick={() => set(value - step)} label="−" disabled={value <= 0} />
        {/* The paired number input is not optional: sliders and steppers alone are hostile on small
            screens and to motor impairments, and someone who knows "9 hours" should type it. */}
        <input
          id={`st-${label}`}
          type="number"
          inputMode="decimal"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={e => set(Number(e.target.value))}
          className="h-11 w-20 rounded-lg border border-outline-variant bg-surface-container-lowest text-center font-headline text-base font-bold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
        />
        <StepButton onClick={() => set(value + step)} label="+" disabled={value >= max} />
        {suffix && <span className="text-[13px] text-on-surface-variant">{suffix}</span>}
      </div>
    </div>
  );
}

function StepButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label === '+' ? 'meer' : 'minder'}
      className="flex size-11 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-lg font-bold text-primary transition-[background-color,border-color] duration-150 hover:border-primary/40 hover:bg-[var(--tl-tint-1)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container"
    >
      {label}
    </button>
  );
}
