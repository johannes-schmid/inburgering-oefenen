import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Score als ring met **één segment per vraag** (§G5, glas.html §10 "Uitslag"): gevuld (navy) is
 * goed, leeg is fout, en een **oranje streepje op onze oefengrens van 60%**. DUO maakt zijn eigen
 * cesuur niet openbaar; zeg er dus nooit "slaaggrens" bij (`SEO/facts.md` §9).
 *
 * Geef `results` (per vraag `true` = goed, in volgorde) als je die hebt; anders `correct` + `total`,
 * dan vullen de eerste `correct` segmenten. Het midden toont standaard `correct/total` + `caption`;
 * geef `children` om het midden zelf te zetten (bijv. met `AnimatedNumber`).
 * Servercomponent, statisch: het segment-per-vraag-beeld ís de informatie en beweegt niet.
 */
type Props = {
  results?: boolean[];
  correct?: number;
  total?: number;
  /** Positie van het oranje streepje, in procent. Standaard 60 (onze oefengrens). `null` = geen streepje. */
  passPct?: number | null;
  size?: number;
  caption?: ReactNode;
  /** Toegankelijke samenvatting, bijv. "21 van 25 goed". */
  label: string;
  className?: string;
  children?: ReactNode;
};

export default function ScoreRing({
  results,
  correct: correctProp,
  total: totalProp,
  passPct = 60,
  size = 176,
  caption,
  label,
  className,
  children,
}: Props) {
  const total = results ? results.length : Math.max(1, totalProp ?? 1);
  const correct = results ? results.filter(Boolean).length : Math.min(total, correctProp ?? 0);
  const filled = results ?? Array.from({ length: total }, (_, i) => i < correct);

  const s = size;
  const w = s * 0.062;
  const r = s / 2 - w / 2 - 8;
  const c = s / 2;
  const gap = 2.4 + ((w / 2) / r) * (360 / Math.PI);
  const rad = (deg: number) => (deg * Math.PI) / 180;

  const segments = filled.map((ok, i) => {
    const a0 = rad((i / total) * 360 + gap / 2 - 90);
    const a1 = rad(((i + 1) / total) * 360 - gap / 2 - 90);
    const d = `M${(c + r * Math.cos(a0)).toFixed(2)} ${(c + r * Math.sin(a0)).toFixed(2)}A${r} ${r} 0 0 1 ${(c + r * Math.cos(a1)).toFixed(2)} ${(c + r * Math.sin(a1)).toFixed(2)}`;
    return <path key={i} d={d} fill="none" stroke={ok ? '#002b6d' : 'rgba(0,43,109,.12)'} strokeWidth={w} strokeLinecap="round" />;
  });

  let tick: ReactNode = null;
  if (passPct !== null) {
    const pa = rad((passPct / 100) * 360 - 90);
    const ri = r + w / 2 + 1;
    const ro = r + w / 2 + 7;
    tick = (
      <path
        d={`M${(c + ri * Math.cos(pa)).toFixed(2)} ${(c + ri * Math.sin(pa)).toFixed(2)}L${(c + ro * Math.cos(pa)).toFixed(2)} ${(c + ro * Math.sin(pa)).toFixed(2)}`}
        stroke="#fe762c"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    );
  }

  return (
    <span role="img" aria-label={label} className={cn('g-score', className)} style={{ width: s, height: s }}>
      <svg width={s} height={s} aria-hidden="true" style={{ overflow: 'visible' }}>
        {segments}
        {tick}
      </svg>
      <span className="g-score-c" aria-hidden="true">
        {children ?? (
          <>
            <b style={{ fontSize: Math.round(s * 0.273) }}>
              {correct}
              <span>/{total}</span>
            </b>
            {caption && <small>{caption}</small>}
          </>
        )}
      </span>
    </span>
  );
}
