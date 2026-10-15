'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Onderdelenkaart — een geheel en zijn delen, waarbij de grootte van een tegel het gewicht van dat
 * deel is. Voor "waar bestaat dit uit, en wat weegt het zwaarst?": de acht KNM-thema's naar aantal
 * eindtermen, de onderdelen van je diploma, wie wat regelt bij de overheid.
 *
 * De tegels staan in een flex-rij met `flex-grow` = gewicht; zo blijft de verhouding ook kloppen
 * als een rij afbreekt. Eén tegel kan `huidig` zijn (de gids waarin je staat): navy, de rest wit.
 * Klik een tegel om zijn uitleg eronder te lezen.
 */
export type KaartDeel = { id: string; label: string; gewicht: number; tekst: string; href?: string; linkLabel?: string };

type Props = {
  title: string;
  intro?: string;
  delen: KaartDeel[];
  eenheid: string;
  huidig?: string;
  bron?: UitlegBron | UitlegBron[];
};

export default function Onderdelenkaart({ title, intro, delen, eenheid, huidig, bron }: Props) {
  const [id, setId] = useState(huidig ?? delen[0].id);
  const d = delen.find(x => x.id === id)!;
  const totaal = delen.reduce((a, x) => a + x.gewicht, 0);

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <div className="g-uit-map" role="listbox" aria-label={title}>
        {delen.map(x => (
          <button
            key={x.id}
            type="button"
            role="option"
            aria-selected={x.id === id}
            className="g-uit-map-tile"
            data-current={x.id === huidig ? 'true' : undefined}
            style={{ flexGrow: x.gewicht, flexBasis: `max(120px, ${x.gewicht * 44}px)` }}
            onClick={() => setId(x.id)}
          >
            <b>{x.gewicht}</b>
            <span>{x.label}</span>
          </button>
        ))}
      </div>
      <div className="g-uit-sheet g-uit-map-detail" aria-live="polite">
        <div>
          <h4>{d.label}</h4>
          <p>{d.gewicht} {eenheid} · {Math.round((d.gewicht / totaal) * 100)}% · {d.tekst}</p>
        </div>
        {d.href ? <a className="g-uit-btn" href={d.href}>{d.linkLabel}<ArrowRight className="rtl-flip" aria-hidden /></a> : null}
      </div>
    </UitlegShell>
  );
}
