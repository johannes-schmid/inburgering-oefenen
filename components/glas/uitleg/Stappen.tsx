'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Stappen — een proces één stap tegelijk, met een gesegmenteerde balk erboven (dezelfde als in de
 * examenspeler) en per stap een tijdstempel in navy. Een stap kan een afvinklijst dragen
 * ("wat neem je mee"); die vinkjes zijn alleen voor de lezer en worden nergens bewaard.
 *
 * Voor processen met een vaste volgorde en een klok erbij: de examendag, een aanvraag, de PVT.
 * Een lijst zonder tijd of volgorde is geen `Stappen` — dan is het gewoon een lijst.
 */
export type Stap = { id: string; when: string; whenSub?: string; title: string; body: string; check?: string[] };

type Props = {
  title: string;
  intro?: string;
  stappen: Stap[];
  bron?: UitlegBron | UitlegBron[];
  labels?: { prev: string; next: string; step: string; of: string };
};

export default function Stappen({ title, intro, stappen, bron, labels = { prev: 'Vorige', next: 'Volgende stap', step: 'Stap', of: 'van' } }: Props) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const base = useId();
  const n = stappen.length;
  const s = stappen[i];
  const go = (k: number) => { setDir(k > i ? 1 : -1); setI(Math.max(0, Math.min(n - 1, k))); };
  const x = (d: number) => (reduce ? 'translateX(0px)' : `translateX(${d * 12}px)`);

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <div className="g-uit-sheet">
        <div className="g-uit-st-bar" style={{ ['--n' as string]: n }}>
          {stappen.map((st, k) => (
            <button
              key={st.id}
              type="button"
              className="g-uit-st-seg"
              aria-label={`${labels.step} ${k + 1}: ${st.title}`}
              aria-current={k === i ? 'step' : undefined}
              data-done={k < i ? 'true' : undefined}
              onClick={() => go(k)}
            />
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={s.id}
            className="g-uit-st-card"
            initial={{ opacity: 0, transform: x(dir) }}
            animate={{ opacity: 1, transform: 'translateX(0px)', transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transform: x(-dir), transition: { duration: 0.12 } }}
          >
            <div className="g-uit-st-when"><b>{s.when}</b>{s.whenSub ? <small>{s.whenSub}</small> : null}</div>
            <div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
              {s.check ? (
                <ul className="g-uit-st-check">
                  {s.check.map((c, k) => (
                    <li key={c}>
                      <label htmlFor={`${base}-${s.id}-${k}`}>
                        <input id={`${base}-${s.id}-${k}`} type="checkbox" />
                        <span className="g-uit-st-box" aria-hidden>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </span>
                        <span>{c}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="g-uit-st-nav">
          <button type="button" className="g-uit-btn" onClick={() => go(i - 1)} disabled={i === 0}>
            <ArrowLeft className="rtl-flip" aria-hidden />{labels.prev}
          </button>
          <span className="g-uit-st-count">{labels.step} {i + 1} {labels.of} {n}</span>
          <button type="button" className="g-uit-btn is-navy" onClick={() => go(i + 1)} disabled={i === n - 1}>
            {labels.next}<ArrowRight className="rtl-flip" aria-hidden />
          </button>
        </div>
      </div>
    </UitlegShell>
  );
}
