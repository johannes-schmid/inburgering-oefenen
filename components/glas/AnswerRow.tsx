'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Antwoordoptie, variant A "rij" (§G5, glas.html §07): de hele rij is de knop, de letter staat in
 * een cirkel. Gekozen = navy ring + navy letter. Nagekeken = groene rij met "Juist", rode rij met
 * "Jouw antwoord", de rest gedimd.
 *
 * | state | rendert | betekent |
 * |---|---|---|
 * | `idle` / `selected` | `<button role="radio">` | kiezen |
 * | `correct` | `<div>` | het juiste antwoord (groen + vinkje + `correctLabel`) |
 * | `wrong` | `<div>` | jouw foute keuze (rood + kruis + `wrongLabel`) |
 * | `dim` | `<div>` | de overige opties na het nakijken |
 *
 * **Beweging (G6, glas.html §15):** zet `reward` op de rij die van `selected` naar `correct` gaat —
 * dan speelt één keer het kleine beloningsmoment (rij veert van .98, letter veert op, vinkje tekent
 * zich, lichtstreep, zeven vonkjes; ~700ms totaal, kleiner dan "Gehaald"). `wrong` krijgt een korte
 * schud van 4px/300ms. Bij "beweging verminderen" staat alles meteen op zijn eindstand; het
 * nakijken zelf wacht nooit op de animatie. Zet ze in `AnswerGroup` (`role="radiogroup"`).
 */
export type AnswerState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

type Props = {
  letter: string;
  state: AnswerState;
  children: ReactNode;
  onSelect?: () => void;
  /** Speel het beloningsmoment af wanneer deze rij `correct` wordt. */
  reward?: boolean;
  correctLabel?: ReactNode;
  wrongLabel?: ReactNode;
  disabled?: boolean;
  className?: string;
};

const EO = 'cubic-bezier(0.23, 1, 0.32, 1)';
const SPARKS = 7;

export default function AnswerRow({
  letter,
  state,
  children,
  onSelect,
  reward = false,
  correctLabel,
  wrongLabel,
  disabled,
  className,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const prev = useRef<AnswerState>(state);

  useEffect(() => {
    const from = prev.current;
    prev.current = state;
    const row = rowRef.current;
    if (!row || from === state) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (state === 'wrong') {
      row.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-4px)' },
          { transform: 'translateX(4px)' },
          { transform: 'translateX(-2px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 300, easing: 'ease-out' },
      );
      return;
    }
    if (state !== 'correct' || !reward) return;

    row.animate([{ transform: 'scale(.98)' }, { transform: 'scale(1)' }], { duration: 220, easing: EO });
    row.querySelector('.g-ans-k')?.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.4 }, { transform: 'scale(1)' }],
      { duration: 380, delay: 60, easing: EO },
    );
    row.querySelector('.g-ans-check path')?.animate(
      [{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }],
      { duration: 260, delay: 80, easing: EO, fill: 'backwards' },
    );
    row.querySelector('.g-ans-shine > i')?.animate(
      [
        { transform: 'translateX(-120%)', opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: 'translateX(320%)', opacity: 0 },
      ],
      { duration: 650, delay: 120, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    );
    row.querySelectorAll<HTMLElement>('.g-spark').forEach((z, i) => {
      const a = -Math.PI / 2 + (i - 3) * 0.55;
      const d = 16 + (i % 3) * 5;
      const rot = i % 3 === 0 ? ' rotate(45deg)' : '';
      z.animate(
        [
          { transform: `translate(0,0) scale(.3)${rot}`, opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: `translate(${(Math.cos(a) * d).toFixed(1)}px,${(Math.sin(a) * d).toFixed(1)}px) scale(1)${rot}`, opacity: 0 },
        ],
        { duration: 560, delay: 240 + i * 12, easing: EO },
      );
    });
  }, [state, reward]);

  const graded = state === 'correct' || state === 'wrong' || state === 'dim';

  if (!graded) {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={state === 'selected'}
        disabled={disabled}
        onClick={onSelect}
        className={cn('g-ans', className)}
      >
        <span className="g-ans-k" aria-hidden="true">{letter}</span>
        <span className="g-ans-text">{children}</span>
      </button>
    );
  }

  return (
    <div
      ref={rowRef}
      className={cn('g-ans', state === 'correct' && 'g-ans-ok', state === 'wrong' && 'g-ans-nok', state === 'dim' && 'g-ans-dim', className)}
    >
      {state === 'correct' && reward && (
        <span className="g-ans-shine" aria-hidden="true"><i /></span>
      )}
      <span className="g-ans-k" aria-hidden="true">{letter}</span>
      <span className="g-ans-text">{children}</span>
      {state === 'correct' && (
        <span className="g-ans-tag">
          {reward && Array.from({ length: SPARKS }, (_, i) => <span key={i} className="g-spark" aria-hidden="true" />)}
          <svg className="g-ans-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" strokeDasharray="24" />
          </svg>
          {correctLabel}
        </span>
      )}
      {state === 'wrong' && (
        <span className="g-ans-tag">
          <X strokeWidth={3} aria-hidden="true" />
          {wrongLabel}
        </span>
      )}
    </div>
  );
}

export function AnswerGroup({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('g-answers', className)}>
      {children}
    </div>
  );
}
