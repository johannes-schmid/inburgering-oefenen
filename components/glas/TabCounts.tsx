'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Tab met tellingen (§G5, glas.html §06 "Tab en filter"): twee (of drie) gelijke keuzes in een
 * mistgoot, met een **witte duim** die naar de gekozen tab schuift en een telling per tab.
 *
 * De duim beweegt via Motion `layoutId` (FLIP → transform, geen width-animatie), 320ms ease-out.
 * **Pijltjestoetsen verplaatsen de keuze zonder animatie** (G6: toetsenbordacties animeren nooit),
 * en bij "beweging verminderen" springt hij direct. Gecontroleerd: `value` + `onChange`.
 * Rol is `tablist`; geef per item `controls` (het id van het paneel) als er panelen bij horen.
 */
export type TabCountsItem = { id: string; label: ReactNode; count?: ReactNode; icon?: ReactNode; controls?: string };

type Props = {
  items: TabCountsItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
};

export default function TabCounts({ items, value, onChange, label, className }: Props) {
  const layoutId = useId();
  const reduce = useReducedMotion();
  const [viaKeyboard, setViaKeyboard] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = items.findIndex(it => it.id === value);
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next = -1;
    if (e.key === fwd) next = (i + 1) % items.length;
    else if (e.key === back) next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setViaKeyboard(true);
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  const instant = reduce || viaKeyboard;

  return (
    <div role="tablist" aria-label={label} className={cn('g-tabs', className)} onKeyDown={onKeyDown}>
      {items.map((it, i) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={it.controls}
            tabIndex={on ? 0 : -1}
            className="g-tabs-btn"
            onPointerDown={() => setViaKeyboard(false)}
            onClick={() => onChange(it.id)}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                className="g-tabs-thumb"
                transition={instant ? { duration: 0 } : { duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              />
            )}
            {it.icon && <span className="flex [&>svg]:size-[15px]" aria-hidden="true">{it.icon}</span>}
            <span>{it.label}</span>
            {it.count !== undefined && <span className="g-tabs-cnt">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
