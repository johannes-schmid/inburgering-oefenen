/**
 * The small vocabulary the tijdlijn tool is built from. Deliberately tiny.
 *
 * The site's Glas kit covers marketing surfaces and forms; a wizard needs one thing they do not have — a **large, tappable option card
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
import { Check, Minus, Plus, type LucideIcon } from 'lucide-react';

/*
 * Glas (glas.html §12 "Tijdlijn-maker"): een antwoord is een `g-opcard` — wit op mist, gekozen =
 * navy inset-ring, nooit een rand. De klassen staan in app/glas-public.css; de tijdlijn-eigen
 * aanvullingen (`g-tl-*`) in app/glas-public-tijdlijn.css.
 */

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
      className={`g-opcard g-tl-opcard !items-start text-start ${compact ? 'min-h-11 !py-3' : 'min-h-16'}`}
    >
      {/* The ring is the state; the dot inside the radio repeats it. Colour alone would fail WCAG 1.4.1. */}
      <span className="g-opcard-rd mt-0.5" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="size-4 shrink-0 text-navy" aria-hidden="true" />}
          <span className="font-headline text-[15px] font-bold leading-snug tracking-[-0.01em] text-ink">
            {label}
          </span>
        </span>
        {note && <span className="mt-1 block text-[13px] font-normal leading-relaxed text-ink-2">{note}</span>}
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
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-tone={tone}
      className="g-tl-chip"
    >
      {/* Status is never colour alone: "gehaald" carries a check, "niet gehaald" a dash. */}
      {selected && tone === 'good' && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
      {selected && tone === 'warn' && <Minus className="size-3.5" strokeWidth={3} aria-hidden="true" />}
      {label}
    </button>
  );
}

/** A white card on the mist page. The base surface of every panel. */
export function Panel({
  children,
  className = '',
  as: As = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}) {
  return <As className={`tl-page g-tl-panel ${className}`}>{children}</As>;
}

export function PanelTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <header className="mb-5">
      <h2 className="g-head g-head-3 !text-navy">{children}</h2>
      {sub && <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{sub}</p>}
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
      <span className="size-1.5 rounded-full bg-navy" aria-hidden="true" />
      {label}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="g-tl-src g-tl-src-link">
      {body}
    </a>
  ) : (
    <span className="g-tl-src">{body}</span>
  );
}

export function EstimateBadge({ label }: { label: string }) {
  return <span className="g-tl-est">{label}</span>;
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
      <label className="mb-2 block text-[13px] font-semibold text-ink" htmlFor={`st-${label}`}>
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
          className="g-tl-input w-20 text-center font-headline text-base font-bold g-tnum"
        />
        <StepButton onClick={() => set(value + step)} label="+" disabled={value >= max} />
        {suffix && <span className="text-[13px] text-ink-2">{suffix}</span>}
      </div>
    </div>
  );
}

function StepButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  const Icon = label === '+' ? Plus : Minus;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label === '+' ? 'meer' : 'minder'}
      className="g-tl-step"
    >
      <Icon className="size-4" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
