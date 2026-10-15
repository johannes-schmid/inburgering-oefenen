'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Tijdlijn — een reeks momenten van boven naar beneden, voor "eerst dit, dan dat, en hier houdt
 * het op". Drie soorten punten, dezelfde lezing als de tijdlijntool:
 *
 * - `moment` (navy ring): iets dat gebeurt.
 * - `grens` (navy vierkant, kaart in navy): een harde datum. Geen ronding — een muur.
 * - `nu` (oranje): waar de lezer staat. Hooguit één per tijdlijn; het is de wijzer van de view.
 *
 * `estimate` maakt een punt gestippeld: geschat en wettelijk zien er nooit hetzelfde uit.
 *
 * Beweging: de lijn trekt één keer van boven naar beneden als het element in beeld komt (uitleg:
 * de volgorde wordt zichtbaar), de punten volgen met 60ms tussenruimte. **De inhoud staat standaard
 * zichtbaar**: de animatie wordt pas na het laden "gewapend", en alleen als de tijdlijn dan nog
 * onder de vouw staat. Zo is er zonder JS, in print (de PDF-brochure) en bij "beweging
 * verminderen" nooit een lege tijdlijn. CSS-transities, geen Motion per punt.
 */
export type TijdlijnStop = {
  id: string;
  when: string;
  title: string;
  body?: string;
  kind?: 'moment' | 'grens' | 'nu';
  estimate?: boolean;
  tag?: string;
};

type Props = {
  title: string;
  intro?: string;
  stops: TijdlijnStop[];
  bron?: UitlegBron | UitlegBron[];
  estimateLabel?: string;
};


export default function Tijdlijn({ title, intro, stops, bron, estimateLabel = 'ongeveer' }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (reduce || !el) return;
    if (el.getBoundingClientRect().top > window.innerHeight) setArmed(true);
  }, [reduce]);

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <ol ref={ref} className="g-uit-tl" data-armed={armed ? 'true' : undefined} data-shown={inView ? 'true' : undefined}>
        {stops.map((s, i) => (
          <li
            key={s.id}
            className="g-uit-tl-item"
            data-kind={s.kind ?? 'moment'}
            data-estimate={s.estimate ? 'true' : undefined}
            style={{ ['--i' as string]: i }}
          >
            <span className="g-uit-tl-node" aria-hidden><i /></span>
            <div>
              <span className="g-uit-tl-when">
                {s.when}
                {s.estimate ? <span className="g-uit-tl-tag">{estimateLabel}</span> : null}
                {s.tag ? <span className={s.kind === 'nu' ? 'g-uit-tl-tag is-now' : 'g-uit-tl-tag'}>{s.tag}</span> : null}
              </span>
              <div className="g-uit-tl-card">
                <b>{s.title}</b>
                {s.body ? <p>{s.body}</p> : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </UitlegShell>
  );
}
