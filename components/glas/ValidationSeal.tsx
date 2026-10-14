import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Het docentzegel in Glas (glas.html §07 `.seal`): de bewering dat een NT2-docent de inhoud heeft
 * nagekeken, als één pil. Vervangt `ValidationChip` op herbouwde schermen.
 *
 * **Eén keer per pagina**, dicht bij de inhoud waar hij over gaat (CLAUDE.md §2, §7). De tekst komt
 * van de aanroeper, want hij moet vertaald worden, en hij blijft een feitelijke bewering over wie
 * nakeek — nooit dat er geen AI aan te pas kwam. Op een veld: `glass`; op wit of mist: standaard.
 */
export default function ValidationSeal({
  children, sub, glass = false, className,
}: {
  children: React.ReactNode;
  /** Een tweede regel, zoals "NT2-gecertificeerd docent". */
  sub?: React.ReactNode;
  glass?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('g-seal', glass && 'g-glass', className)}>
      <span className="g-seal-ic" aria-hidden="true"><ShieldCheck size={18} strokeWidth={2.2} /></span>
      <span>
        <b>{children}</b>
        {sub && <small>{sub}</small>}
      </span>
    </span>
  );
}
