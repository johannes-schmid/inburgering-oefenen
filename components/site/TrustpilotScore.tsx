import { cn } from '@/lib/utils';

/**
 * De Trustpilot-score van **knmoefenen.nl**, niet van deze site.
 *
 * Twee dingen staan hier vast en mogen niet "opgeschoond" worden:
 *
 * - **Het cijfer komt uit `SEO/facts.md` §12** (4,4 uit 5 uit 10 beoordelingen, geraadpleegd
 *   21-09-2026) en de component neemt het als prop aan, zodat er nooit een tweede getal in de
 *   codebase ontstaat. Er staat **geen woordlabel** bij ("Uitstekend"/"Geweldig"): de twee
 *   Trustpilot-domeinen gaven verschillende labels bij hetzelfde cijfer.
 * - **De herkomst hoort erbij en de bronlink is de verificatie zelf.** De beoordelingen gaan over
 *   een ander domein; wie ze zonder die zin toont, presenteert geleende geloofwaardigheid als
 *   eigen. Om dezelfde reden staat hier géén `AggregateRating` in de structured data.
 *
 * Het merkteken is nagetekend in Trustpilot's eigen groen (#00B67A) en de sterren zijn hun
 * vorm — toegestaan zolang het een échte score toont met een link naar het profiel. Zodra het
 * officiële SVG-bestand er is, vervangt dat deze tekening.
 */
const TP_GREEN = '#00b67a';

function Star({ fill }: { fill: number }) {
  return (
    <span className="relative block w-6 h-6 sm:w-7 sm:h-7 rounded-[3px] overflow-hidden" style={{ background: 'rgba(0,8,27,0.12)' }}>
      <span className="absolute inset-0" style={{ background: TP_GREEN, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }} />
      <svg viewBox="0 0 24 24" className="relative w-full h-full" aria-hidden="true">
        <path
          d="M12 4.2l2.1 4.8 5.2.4-3.9 3.4 1.2 5.1L12 15.2 7.4 17.9l1.2-5.1L4.7 9.4l5.2-.4z"
          fill="#fff"
        />
      </svg>
    </span>
  );
}

export default function TrustpilotScore({
  score,
  outOf = 5,
  className,
}: {
  score: number;
  outOf?: number;
  className?: string;
}) {
  const stars = Array.from({ length: outOf }, (_, i) => Math.min(1, Math.max(0, score - i)));
  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {stars.map((fill, i) => (
          <Star key={i} fill={fill} />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
          <path
            d="M12 3l2.3 5.3 5.7.4-4.3 3.8 1.3 5.6L12 15.1 7 18.1l1.3-5.6L4 8.7l5.7-.4z"
            fill={TP_GREEN}
          />
        </svg>
        <span className="font-headline font-bold text-primary text-[0.9375rem] tracking-tight">Trustpilot</span>
      </div>
    </div>
  );
}
