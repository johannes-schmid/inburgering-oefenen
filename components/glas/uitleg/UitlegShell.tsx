'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * De schil van elk uitlegelement: een mistpaneel met titel, één regel uitleg en de bron eronder.
 *
 * Een uitlegelement staat in de witte leeskolom van een gids of les, dus het paneel is mist en wat
 * je aanraakt is wit (tonale lagen, geen lijnen). **Elk getal in een element komt uit
 * `SEO/facts.md`, en de bron staat er dan onder** — dezelfde regel als de fact-box in een gids.
 */
export type UitlegBron = { label: string; href?: string; checked?: string };

/** De bronregel in de taal van de pagina; een element dat in een Engelse of Arabische tekst staat
 *  zet dit eromheen. Zonder provider blijft het Nederlands. */
export const UitlegBronTaal = createContext<{ bronLabel: string; checkedLabel: string } | null>(null);

type Props = {
  title: string;
  intro?: ReactNode;
  bron?: UitlegBron | UitlegBron[];
  bronLabel?: string;
  checkedLabel?: string;
  className?: string;
  children: ReactNode;
};

export default function UitlegShell({ title, intro, bron, bronLabel, checkedLabel, className, children }: Props) {
  const taal = useContext(UitlegBronTaal);
  bronLabel ??= taal?.bronLabel ?? 'Bron';
  checkedLabel ??= taal?.checkedLabel ?? 'geraadpleegd';
  const bronnen = bron ? (Array.isArray(bron) ? bron : [bron]) : [];
  return (
    <figure className={cn('g-uit', className)}>
      <header className="g-uit-head">
        <h3 className="g-uit-title">{title}</h3>
        {intro ? <p className="g-uit-intro">{intro}</p> : null}
      </header>
      {children}
      {bronnen.length > 0 ? (
        <figcaption className="g-uit-bron">
          {bronLabel}:{' '}
          {bronnen.map((b, i) => (
            <span key={b.label}>
              {i > 0 ? ' · ' : null}
              {b.href ? <a href={b.href} target="_blank" rel="noopener">{b.label}</a> : b.label}
              {b.checked ? `, ${checkedLabel} ${b.checked}` : null}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}
