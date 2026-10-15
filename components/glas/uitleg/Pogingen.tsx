'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Minus, RotateCcw, X } from 'lucide-react';
import AnimatedNumber from '@/components/glas/AnimatedNumber';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Pogingen — speel je examenpogingen na en zie wat het kost. Kies wie je bent, en bepaal per
 * poging wat er gebeurt: gehaald, gezakt, of op tijd afgezegd. Het totaal telt mee.
 *
 * De regels zijn data (`profielen`), geen code: hoeveel pogingen gratis zijn en wat een poging
 * kost, per groep. **Op tijd afzeggen telt niet als poging en kost niets** (Examenreglement
 * art. 11 lid 11). Er is geen maximum; na zes pogingen zegt het element dat je termijn de grens
 * is, zoals `SEO/facts.md` §5 het voorschrijft — nooit "onbeperkt".
 */
export type PogingProfiel = { id: string; label: string; gratis: number; prijs: number; noot: string };
type Uitslag = 'gehaald' | 'gezakt' | 'afgezegd';

type Props = {
  title: string;
  intro?: string;
  profielen: PogingProfiel[];
  bron?: UitlegBron | UitlegBron[];
  locale?: string;
  max?: number;
  maxNote: string;
  labels?: {
    attempt: string; gehaald: string; gezakt: string; afgezegd: string; free: string;
    paid: string; used: string; again: string; next: string; counts: string;
  };
};

const DEF = {
  attempt: 'Poging', gehaald: 'Gehaald', gezakt: 'Gezakt', afgezegd: 'Afgezegd', free: 'gratis',
  paid: 'Je betaalt', used: 'Pogingen', again: 'Opnieuw', next: 'Wat gebeurt er?', counts: 'telt niet',
};
const ICON = { gehaald: Check, gezakt: X, afgezegd: Minus } as const;

export default function Pogingen({ title, intro, profielen, bron, locale = 'nl', max = 6, maxNote, labels = DEF }: Props) {
  const reduce = useReducedMotion();
  const [pid, setPid] = useState(profielen[0].id);
  const [reeks, setReeks] = useState<Uitslag[]>([]);
  const prof = profielen.find(p => p.id === pid)!;

  let telt = 0;
  const regels = reeks.map(u => {
    if (u === 'afgezegd') return { u, kost: 0, n: null as number | null };
    telt += 1;
    return { u, kost: telt <= prof.gratis ? 0 : prof.prijs, n: telt };
  });
  const totaal = regels.reduce((a, r) => a + r.kost, 0);
  const klaar = reeks.at(-1) === 'gehaald';
  const vol = reeks.length >= max;
  const euro = (c: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(c);

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <div className="g-uit-pg-profiles" role="radiogroup" aria-label={title}>
        {profielen.map(p => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === pid}
            className="g-uit-sc-chip"
            onClick={() => { setPid(p.id); setReeks([]); }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <ol className="g-uit-pg-rail">
        <AnimatePresence initial={false}>
          {regels.map((r, k) => {
            const Icon = ICON[r.u];
            return (
              <motion.li
                key={k}
                className="g-uit-pg-tok"
                data-uit={r.u}
                initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.94)' }}
                animate={{ opacity: 1, transform: 'scale(1)', transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <div className="g-uit-pg-tok-top">
                  <small>{r.n ? `${labels.attempt} ${r.n}` : labels.counts}</small>
                  <span className="g-uit-pg-ic" aria-hidden><Icon /></span>
                </div>
                <b>{labels[r.u]}</b>
                <span className={r.kost === 0 ? 'g-uit-pg-cost is-free' : 'g-uit-pg-cost'}>
                  {euro(r.kost)}{r.kost === 0 && r.u !== 'afgezegd' ? <small>{labels.free}</small> : null}
                </span>
              </motion.li>
            );
          })}
          {!klaar && !vol ? (
            <motion.li key="next" layout="position" className="g-uit-pg-tok g-uit-pg-next">
              <div className="g-uit-pg-tok-top"><small>{labels.attempt} {telt + 1}</small></div>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{labels.next}</span>
              <div className="g-uit-pg-choices">
                {(['gehaald', 'gezakt', 'afgezegd'] as Uitslag[]).map(u => {
                  const Icon = ICON[u];
                  return (
                    <button key={u} type="button" className="g-uit-pg-choice" onClick={() => setReeks(prev => [...prev, u])}>
                      <Icon aria-hidden />{labels[u]}
                    </button>
                  );
                })}
              </div>
            </motion.li>
          ) : null}
        </AnimatePresence>
      </ol>
      <div className="g-uit-pg-sum" aria-live="polite">
        <div className="g-uit-pg-stat"><small>{labels.paid}</small><b><AnimatedNumber value={totaal} locales={locale} format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} /></b></div>
        <div className="g-uit-pg-stat"><small>{labels.used}</small><b><AnimatedNumber value={telt} locales={locale} /></b></div>
        <p className="g-uit-pg-note">{vol && !klaar ? maxNote : prof.noot}</p>
        <button type="button" className="g-uit-btn" onClick={() => setReeks([])} disabled={reeks.length === 0}>
          <RotateCcw aria-hidden />{labels.again}
        </button>
      </div>
    </UitlegShell>
  );
}
