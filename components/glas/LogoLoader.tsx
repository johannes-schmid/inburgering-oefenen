import { cn } from '@/lib/utils';

/**
 * Het logo als laadstaat, **L2 "opbouw"** (§G4, glas.html §15): de streep groeit van onder naar
 * boven, de zon springt erbij met een kleine veer, het logo vervaagt en begint opnieuw; 1,9s per
 * ronde. Exact de SVG van `components/site/LogoMark.tsx` — geen tweede tekening.
 *
 * - **Pas na 400ms zichtbaar** (`delay`, standaard aan): wat sneller laadt, krijgt geen lader.
 * - **Alleen voor een hele pagina.** Een knop of kaart laadt met een skelet, niet met het logo.
 * - De zin eronder staat stil; alleen het logo beweegt.
 * - **Eigen reduced-motion-regel** in app/glas-components.css: het logo staat dan stil en compleet. Met alleen
 *   "duur 0" bleef de lus op zijn laatste frame staan, en dat is een leeg logo (LEARNINGS v0.6).
 */
type Props = {
  size?: number;
  /** Zichtbare zin onder het logo; ook de toegankelijke naam. */
  label: string;
  /** Toon het label ook zichtbaar (standaard ja). */
  showLabel?: boolean;
  /** Over het hele scherm (route-`loading.tsx`) of in de flow. */
  fullPage?: boolean;
  delay?: boolean;
  className?: string;
};

export default function LogoLoader({ size = 72, label, showLabel = true, fullPage = false, delay = true, className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('g-ll-stage', fullPage && 'g-ll-full', delay && 'g-ll-wait', className)}
    >
      <svg className="g-ll" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="23" fill="#002b6d" />
        <rect className="g-ll-bar" x="26" y="27" width="17" height="46" rx="8.5" fill="#ffffff" />
        <circle className="g-ll-sun" cx="65" cy="50" r="17" fill="#fe762c" />
      </svg>
      {showLabel && <span className="g-ll-label">{label}</span>}
    </div>
  );
}
