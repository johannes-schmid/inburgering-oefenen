'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import GlasSwitch from '@/components/glas/Switch';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Vergelijker — twee (of drie) dingen naast elkaar, rij voor rij. Twee knoppen maken er een
 * hulpmiddel van in plaats van een tabel:
 *
 * - **"Wat geldt voor jou?"** zet een navy ring om de kolom van de lezer, zodat hij zijn eigen
 *   antwoord per rij kan aflezen zonder de andere kolom te lezen.
 * - **"Alleen verschillen"** vouwt de rijen dicht waarin beide kolommen hetzelfde zeggen.
 *
 * `null` in een cel is "geldt niet" en wordt een grijs streepje — nooit een rood kruis (G3).
 */
export type VergelijkKolom = { id: string; label: string; sub?: string };
export type VergelijkWaarde = string | { t: string; sub?: string } | null;
export type VergelijkRij = { id: string; label: string; waarden: VergelijkWaarde[]; zelfde?: boolean };

type Props = {
  title: string;
  intro?: string;
  kolommen: VergelijkKolom[];
  rijen: VergelijkRij[];
  bron?: UitlegBron | UitlegBron[];
  labels?: { mine: string; diff: string; same: string; none: string };
};

export default function Vergelijker({ title, intro, kolommen, rijen, bron, labels = { mine: 'Wat geldt voor jou?', diff: 'Alleen verschillen', same: 'gelijk', none: 'geldt niet' } }: Props) {
  const [mijn, setMijn] = useState<string | null>(null);
  const [diff, setDiff] = useState(false);
  const reduce = useReducedMotion();
  const lid = useId();
  const n = kolommen.length;
  const zichtbaar = diff ? rijen.filter(r => !r.zelfde) : rijen;

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <div className="g-uit-vg-tools">
        <div className="g-uit-vg-pick" role="radiogroup" aria-label={labels.mine}>
          <span>{labels.mine}</span>
          {kolommen.map(k => (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={mijn === k.id}
              className="g-uit-sc-chip"
              onClick={() => setMijn(m => (m === k.id ? null : k.id))}
            >
              {k.label}
            </button>
          ))}
        </div>
        <label className="g-uit-vg-toggle" id={lid}>
          <GlasSwitch checked={diff} onClick={() => setDiff(d => !d)} aria-labelledby={lid} />
          {labels.diff}
        </label>
      </div>
      <div className="g-uit-vg" style={{ ['--n' as string]: n, ['--vals' as string]: `${n * 1.2}fr` }}>
        <div className="g-uit-vg-row is-head">
          <span aria-hidden />
          <div className="g-uit-vg-vals">
            {kolommen.map(k => (
              <span key={k.id} className="g-uit-vg-v" data-on={mijn === k.id ? 'true' : undefined}>{k.label}{k.sub ? <small>{k.sub}</small> : null}</span>
            ))}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {zichtbaar.map(r => (
            <motion.div
              key={r.id}
              layout={reduce ? false : 'position'}
              className="g-uit-vg-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ layout: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } }}
            >
              <span className="g-uit-vg-k">{r.label}{r.zelfde ? <> <span className="g-uit-vg-same">· {labels.same}</span></> : null}</span>
              <div className="g-uit-vg-vals">
                {r.waarden.map((w, k) => (
                  <span key={k} className="g-uit-vg-v" data-on={mijn === kolommen[k].id ? 'true' : undefined}>
                    {w === null ? <span className="g-uit-vg-dash" role="img" aria-label={labels.none} /> : typeof w === 'string' ? w : <>{w.t}{w.sub ? <small>{w.sub}</small> : null}</>}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UitlegShell>
  );
}
