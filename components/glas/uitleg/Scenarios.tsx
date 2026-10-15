'use client';

import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Check, Clock, Info, type LucideIcon } from 'lucide-react';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Scenario's — "wat gebeurt er als…". Kies een situatie; links staat wat er dan gebeurt, rechts
 * in Nacht wat jij doet. Voor regels die per situatie anders uitpakken (boete, extra tijd, ziek,
 * afzeggen) en die nu als een lijst van uitzonderingen in de tekst staan.
 *
 * Het paneel wisselt met een korte overvloei (180ms) met 2px vervaging, zodat twee lijsten niet
 * even over elkaar heen staan. Bij "beweging verminderen" alleen de overvloei.
 */
export type ScenarioGevolg = { tone?: 'neutraal' | 'goed' | 'let-op' | 'tijd'; tekst: ReactNode };
export type Scenario = { id: string; label: string; gevolgen: ScenarioGevolg[]; doe: ReactNode };

type Props = {
  title: string;
  intro?: string;
  scenarios: Scenario[];
  bron?: UitlegBron | UitlegBron[];
  labels?: { gebeurt: string; doe: string };
};

const ICONS: Record<NonNullable<ScenarioGevolg['tone']>, LucideIcon> = { neutraal: Info, goed: Check, 'let-op': AlertTriangle, tijd: Clock };

export default function Scenarios({ title, intro, scenarios, bron, labels = { gebeurt: 'Wat er gebeurt', doe: 'Wat jij doet' } }: Props) {
  const [id, setId] = useState(scenarios[0]?.id);
  const reduce = useReducedMotion();
  const base = useId();
  const s = scenarios.find(x => x.id === id) ?? scenarios[0];

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <div className="g-uit-sc-chips" role="tablist" aria-label={title}>
        {scenarios.map(sc => (
          <button
            key={sc.id}
            type="button"
            role="tab"
            aria-selected={sc.id === s.id}
            aria-controls={`${base}-p`}
            className="g-uit-sc-chip"
            onClick={() => setId(sc.id)}
          >
            {sc.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={s.id}
          id={`${base}-p`}
          role="tabpanel"
          className="g-uit-sc-panel"
          initial={{ opacity: 0, filter: reduce ? 'blur(0px)' : 'blur(2px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.18, ease: 'easeOut' } }}
          exit={{ opacity: 0, filter: reduce ? 'blur(0px)' : 'blur(2px)', transition: { duration: 0.12 } }}
        >
          <div className="g-uit-sheet">
            <h4>{labels.gebeurt}</h4>
            <ul className="g-uit-sc-list">
              {s.gevolgen.map((g, k) => {
                const Icon = ICONS[g.tone ?? 'neutraal'];
                return (
                  <li key={k}>
                    <span className="g-uit-sc-ic" data-tone={g.tone} aria-hidden><Icon /></span>
                    <span>{g.tekst}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="g-uit-sc-do">
            <h4>{labels.doe}</h4>
            <p>{s.doe}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </UitlegShell>
  );
}
