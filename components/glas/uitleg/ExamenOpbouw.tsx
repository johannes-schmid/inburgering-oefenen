'use client';

import { useState } from 'react';
import FilterChip from '@/components/glas/FilterChip';
import type { Category } from '@/components/horizon/CategoryMark';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Examenopbouw — een examen in één oogopslag: één balk per niveau, de lengte is de tijd, elk
 * blokje is een vraag. Zo zie je zonder te rekenen dat B1 Lezen niet alleen meer vragen heeft,
 * maar ook meer tijd per vraag.
 *
 * De getallen komen uit `data/skills.ts` (de pagina geeft ze door), nooit hier getypt. Een
 * onbekende waarde (`null`) is een gestreept vak met "nog niet bekend" — **NULL is onbekend,
 * nooit nul** (CLAUDE.md §3). De balk tekent zich met een clip-path van links naar rechts bij elke
 * wissel (uitleg: hoe lang het examen is), 520ms; bij "beweging verminderen" staat hij er meteen.
 */
export type OpbouwNiveau = { level: string; label: string; items: number | null; minutes: number | null };
export type OpbouwOnderdeel = { id: Category; label: string; unit: string; niveaus: OpbouwNiveau[] };

type Props = {
  title: string;
  intro?: string;
  onderdelen: OpbouwOnderdeel[];
  bron?: UitlegBron | UitlegBron[];
  locale?: string;
  labels?: { min: string; perItem: string; unknown: string };
};

export default function ExamenOpbouw({ title, intro, onderdelen, bron, locale = 'nl', labels = { min: 'min', perItem: 'min per vraag', unknown: 'Nog niet bekend: hier is geen openbaar oefenmateriaal van.' } }: Props) {
  const [id, setId] = useState(onderdelen[0].id);
  const o = onderdelen.find(x => x.id === id)!;
  const max = Math.max(...onderdelen.flatMap(x => x.niveaus.map(n => n.minutes ?? 0)));
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      {onderdelen.length > 1 ? (
        <div className="g-chips" style={{ marginBottom: 14 }}>
          {onderdelen.map(x => (
            <FilterChip key={x.id} pressed={x.id === id} category={x.id} onClick={() => setId(x.id)}>{x.label}</FilterChip>
          ))}
        </div>
      ) : null}
      <div className="g-uit-sheet">
        <div className="g-uit-op-bars">
          {o.niveaus.map(n => (
            <div key={n.level} className="g-uit-op-row" data-level={n.level}>
              <div className="g-uit-op-lab">
                <b>{n.label}</b>
                <span>
                  {n.items !== null && n.minutes !== null
                    ? `${n.items} ${o.unit} · ${n.minutes} ${labels.min} · ${nf.format(n.minutes / n.items)} ${labels.perItem}`
                    : '–'}
                </span>
              </div>
              <div className="g-uit-op-track">
                {n.items !== null && n.minutes !== null ? (
                  <div
                    key={o.id}
                    className="g-uit-op-bar"
                    role="img"
                    aria-label={`${n.label}: ${n.items} ${o.unit}, ${n.minutes} ${labels.min}`}
                    style={{ ['--w' as string]: `${(n.minutes / max) * 100}%`, ['--n' as string]: n.items }}
                  >
                    {Array.from({ length: n.items }, (_, k) => <i key={k} />)}
                  </div>
                ) : (
                  <div className="g-uit-op-unknown">{labels.unknown}</div>
                )}
              </div>
            </div>
          ))}
          <div className="g-uit-op-scale" aria-hidden>
            <span>0</span><span>{Math.round(max / 2)} {labels.min}</span><span>{max} {labels.min}</span>
          </div>
        </div>
      </div>
    </UitlegShell>
  );
}
