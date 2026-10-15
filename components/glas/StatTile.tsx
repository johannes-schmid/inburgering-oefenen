import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Stat-tegel (glas.html §09 "Stat-tegels"): een vlak, een lucide-icoon in een tegeltje, het getal
 * groot (Manrope 800, tabelcijfers) en eronder een klein beeld van wat het getal betekent (`viz`: een
 * lijn, tien vakjes, vijf blokken, zeven dagen). **Eén tegel per rij mag `dark`** (op Nacht).
 *
 * Rij: `<div className="g-stats">` (4 → 2 kolommen onder 1080px). Getal laten rollen: geef
 * `<AnimatedNumber>` als `value`. `delta` is een groene pill ("+6") en verdwijnt op mobiel.
 */
type Props = {
  label: ReactNode;
  icon?: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  delta?: ReactNode;
  viz?: ReactNode;
  dark?: boolean;
  className?: string;
};

export default function StatTile({ label, icon, value, unit, delta, viz, dark = false, className }: Props) {
  return (
    <div className={cn('g-stat', dark && 'g-stat-dark', className)}>
      <span className="g-stat-lb">
        {icon && <span className="g-stat-ico" aria-hidden="true">{icon}</span>}
        {label}
      </span>
      <span className="g-stat-v">
        {value}
        {unit && <span className="g-stat-unit">{unit}</span>}
        {delta && <span className="g-stat-delta">{delta}</span>}
      </span>
      {viz && <div className="g-stat-viz">{viz}</div>}
    </div>
  );
}
