'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, RotateCcw, X } from 'lucide-react';
import UitlegShell from './UitlegShell';

/**
 * Klopt het? — een paar beweringen die mensen vaak geloven, en per bewering twee knoppen. Na je
 * keuze verschijnt het antwoord met de bron eronder. Bedoeld voor de misverstanden die de docent
 * steeds tegenkomt ("de wet van 2021 geldt sinds 2021", "je kunt je examen inzien").
 *
 * Groen = goed gezien, rood = niet goed (G3), altijd met vinkje of kruis. Elke bewering draagt
 * zijn eigen bron, want ze komen uit verschillende documenten. Niets wordt bewaard.
 */
export type Bewering = { id: string; tekst: string; klopt: boolean; uitleg: ReactNode; bron: string };

type Props = {
  title: string;
  intro?: string;
  beweringen: Bewering[];
  labels?: { yes: string; no: string; right: string; wrong: string; score: (n: number, t: number) => string; again: string };
};

const DEF = {
  yes: 'Klopt', no: 'Klopt niet', right: 'Goed gezien', wrong: 'Niet goed',
  score: (n: number, t: number) => `${n} van ${t} goed`, again: 'Opnieuw',
};

export default function KloptHet({ title, intro, beweringen, labels = DEF }: Props) {
  const reduce = useReducedMotion();
  const [keuze, setKeuze] = useState<Record<string, boolean>>({});
  const beantwoord = Object.keys(keuze).length;
  const goed = beweringen.filter(b => keuze[b.id] === b.klopt).length;

  return (
    <UitlegShell title={title} intro={intro}>
      <ol className="g-uit-kh">
        {beweringen.map(b => {
          const gekozen = keuze[b.id];
          const ok = gekozen === b.klopt;
          return (
            <li key={b.id} className="g-uit-kh-item">
              <span className="g-uit-kh-q">{b.tekst}</span>
              {gekozen === undefined ? (
                <div className="g-uit-kh-btns" role="group" aria-label={b.tekst}>
                  <button type="button" onClick={() => setKeuze(k => ({ ...k, [b.id]: true }))}>{labels.yes}</button>
                  <button type="button" onClick={() => setKeuze(k => ({ ...k, [b.id]: false }))}>{labels.no}</button>
                </div>
              ) : null}
              <AnimatePresence initial={false}>
                {gekozen !== undefined ? (
                  <motion.div
                    className="g-uit-kh-res"
                    data-ok={ok ? 'true' : 'false'}
                    role="status"
                    initial={{ opacity: 0, transform: reduce ? 'translateY(0px)' : 'translateY(-4px)' }}
                    animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
                  >
                    <span className="g-uit-pg-ic" aria-hidden>{ok ? <Check /> : <X />}</span>
                    <div>
                      <b>{ok ? labels.right : labels.wrong} · {b.klopt ? labels.yes : labels.no}</b>
                      <p>{b.uitleg}<small>{b.bron}</small></p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      {beantwoord === beweringen.length ? (
        <div className="g-uit-kh-score" role="status">
          <b>{labels.score(goed, beweringen.length)}</b>
          <button type="button" className="g-uit-btn" onClick={() => setKeuze({})}><RotateCcw aria-hidden />{labels.again}</button>
        </div>
      ) : null}
    </UitlegShell>
  );
}
