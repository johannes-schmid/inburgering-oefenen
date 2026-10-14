import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * De betaalmerken onder een betaalknop (glas.html §08/§12 `.pay`): slot, iDEAL, SEPA en één regel
 * tekst. **Staat direct onder elke knop die naar de checkout gaat** (CLAUDE.md §9). Mollie biedt
 * iDEAL eerst en SEPA daarna; zet hier geen merk bij dat de checkout niet aanbiedt.
 * Op donker (`g-on-dark` op een ouder) worden de merken wit-op-glas.
 */
export default function PayBadges({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('g-pay', className)}>
      <Lock aria-hidden="true" />
      <span>iDEAL</span>
      <span>SEPA</span>
      {label}
    </div>
  );
}
