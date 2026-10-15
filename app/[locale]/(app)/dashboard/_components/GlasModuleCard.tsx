import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Eén module als kaart op het dashboard (glas.html §09 "Dashboard", `.mod`): het merk met een
 * badge, de naam, **één regel waar je bent**, een balk als er voortgang is, en **één knop**.
 *
 * Alleen de kaart waar je het laatst was krijgt de oranje knop (`accent`); de rest is `ghost`.
 * Twee oranje knoppen naast elkaar en het oranje wijst nergens meer heen (§G1 regel 3).
 *
 * De hele kaart is de link; de knop is een vorm in de kaart, geen tweede doel. Zonder `href`
 * (ONA zolang de docent nog niet heeft nagekeken) is het een stille kaart zonder knop.
 */
export default function GlasModuleCard({
  mark, badge, title, line, pct, foot, cta, href, accent = false, off = false,
}: {
  mark: ReactNode;
  badge?: ReactNode;
  title: string;
  line: string;
  /** 0–100, of null: geen balk. Een balk op 0% naast een prijs leest als verloren voortgang. */
  pct: number | null;
  foot: string;
  cta: string | null;
  href: string | null;
  accent?: boolean;
  /** Niet in je pakket, of nog niet open: de halfwitte kaart. */
  off?: boolean;
}) {
  const body = (
    <>
      <div className="g-mod-tp">
        <span aria-hidden>{mark}</span>
        {badge}
      </div>
      <div>
        <h2>{title}</h2>
        <p>{line}</p>
      </div>
      {pct !== null && (
        <span className="g-prog" aria-hidden><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></span>
      )}
      <div className="g-mod-ft">
        <span>{foot}</span>
        {cta && (
          <span className={`g-btn g-btn-sm ${accent ? 'g-btn-oranje' : 'g-btn-ghost'}`} aria-hidden>
            {cta}
            {accent && <ArrowRight strokeWidth={2.4} className="rtl-flip" />}
          </span>
        )}
      </div>
    </>
  );
  const cls = `g-mod${off ? ' g-off' : ''}`;
  return href
    ? <a href={href} className={cls}>{body}</a>
    : <div className={cls}>{body}</div>;
}
