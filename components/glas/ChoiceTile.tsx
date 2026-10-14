import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExamMark, { type Track } from '@/components/horizon/ExamMark';

/**
 * Keuzetegel (§G5, glas.html §06 "Keuzes"): één keuze uit een paar, met het track-merk zodat de
 * keuze herkenbaar is voordat je leest. Gekozen = witte vulling + navy inset-ring + navy vinkje.
 *
 * Presentational: de staat hoort bij de ouder. Zet de tegels in `ChoiceTileGroup` (een
 * `role="radiogroup"` met het 2-koloms raster, 1 kolom onder 560px). `disabled` is de "off"-staat
 * van glas.html (stippelrand, niet klikbaar).
 */
type TileProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> & {
  checked: boolean;
  title: ReactNode;
  sub?: ReactNode;
  /** Een track: toont `ExamMark` op 48px. */
  track?: Track;
  /** Of een eigen merk (bijv. `CategoryMark`) als het geen track is. */
  mark?: ReactNode;
};

export default function ChoiceTile({ checked, title, sub, track, mark, className, type = 'button', ...rest }: TileProps) {
  return (
    <button type={type} role="radio" aria-checked={checked} className={cn('g-tile', className)} {...rest}>
      {track ? <ExamMark track={track} size={48} /> : mark}
      <span className="min-w-0 pe-7">
        <span className="g-tile-title">{title}</span>
        {sub && <span className="g-tile-sub">{sub}</span>}
      </span>
      <span className="g-tile-tick" aria-hidden="true">
        <Check size={14} strokeWidth={3} />
      </span>
    </button>
  );
}

export function ChoiceTileGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('g-tiles', className)}>
      {children}
    </div>
  );
}
