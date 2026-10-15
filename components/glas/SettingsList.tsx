import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Instellingen als één gegroepeerde lijst (§G5, glas.html §06 "Instellingen"): een mistvlak met
 * rijen, gescheiden door een witte binnenlijn — geen 1px-randen. Elke rij: een lucide-icoon in een
 * wit tegeltje, titel + toelichting, en rechts één bediening (`GlasSwitch` of `GlasCheckbox`).
 *
 * Koppel de bediening aan de titel met `aria-labelledby` of geef hem een eigen `aria-label`.
 */
export default function SettingsList({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('g-set', className)}>{children}</div>;
}

export function SettingsRow({
  icon,
  title,
  sub,
  control,
  titleId,
  className,
}: {
  /** Een lucide-icoon (16px). */
  icon?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  control?: ReactNode;
  /** Id op de titel, voor `aria-labelledby` op de bediening. */
  titleId?: string;
  className?: string;
}) {
  return (
    <div className={cn('g-set-row', className)}>
      {icon && <span className="g-set-ico" aria-hidden="true">{icon}</span>}
      <span className="g-set-text">
        <span className="g-set-title" id={titleId}>{title}</span>
        {sub && <span className="g-set-sub">{sub}</span>}
      </span>
      {control && <span className="g-set-ctrl">{control}</span>}
    </div>
  );
}
