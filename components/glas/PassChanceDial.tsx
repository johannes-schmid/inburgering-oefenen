import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Slaagkans (§G5, glas.html §09 "Slaagkanslabel"): een **halve wijzer** met vijf niveaus —
 * `0` nog onbekend (gestippelde boog, geen naald) · `1` nog niet · `2` bijna · `3` goed · `4` sterk —
 * en één woord erbij. Drie vormen:
 *
 * - `PassChanceDial` — alleen de wijzer (36px standaard).
 * - `PassChanceLabel` — de pill: wijzer + woord + korte regel; `size="sm"` voor lijsten en kaarten,
 *   `tone` `light` | `glass` (op een veld) | `dark` (op Nacht).
 * - `PassChanceCard` — groot, voor de kop van de onderdeelpagina: 64px-wijzer, monolabel, woord,
 *   één regel en een **schaal van vier** (`scaleLabels`, bijv. Nog niet · Bijna · Goed · Sterk).
 *
 * Het blijft oefenfeedback: de banden komen uit de regels die er nu zijn, niet uit een AI-oordeel
 * (CLAUDE.md §2 — houd de "wat nu?"-sturing regelgebaseerd). Alle woorden komen van de aanroeper.
 */
export type PassChanceLevel = 0 | 1 | 2 | 3 | 4;

export function PassChanceDial({ level, size = 36, dark = false }: { level: PassChanceLevel; size?: number; dark?: boolean }) {
  const cx = 18;
  const cy = 20;
  const r = 13;
  const track = dark ? 'rgba(255,255,255,.22)' : 'rgba(0,43,109,.14)';
  const fg = dark ? '#fff' : '#002b6d';
  const pt = (f: number, rr: number) => {
    const a = Math.PI * (1 - f);
    return [cx + Math.cos(a) * rr, cy - Math.sin(a) * rr] as const;
  };
  const f = (level / 4) * 0.92 + 0.04;
  const [ex, ey] = pt(f, r);
  const [nx, ny] = pt(f, 8);
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 36 26" aria-hidden="true" direction="ltr">
      <path d="M5 20a13 13 0 0 1 26 0" fill="none" stroke={track} strokeWidth="4" strokeLinecap="round" strokeDasharray={level ? undefined : '2 4'} />
      {level ? (
        <>
          <path d={`M5 20A13 13 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`} fill="none" stroke={fg} strokeWidth="4" strokeLinecap="round" />
          <path d={`M${cx} ${cy}L${nx.toFixed(2)} ${ny.toFixed(2)}`} stroke={fg} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="3" fill="#fe762c" />
        </>
      ) : (
        <circle cx={cx} cy={cy} r="2.4" fill={dark ? 'rgba(255,255,255,.5)' : '#6f80a8'} />
      )}
    </svg>
  );
}

export function PassChanceLabel({
  level,
  word,
  sub,
  size = 'md',
  tone = 'light',
  className,
}: {
  level: PassChanceLevel;
  word: ReactNode;
  sub?: ReactNode;
  size?: 'md' | 'sm';
  tone?: 'light' | 'glass' | 'dark';
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <span className={cn('g-kans', size === 'sm' && 'g-kans-sm', tone === 'glass' && 'g-kans-glas', dark && 'g-kans-d', className)}>
      <span className="g-kans-dl">
        <PassChanceDial level={level} size={size === 'sm' ? 26 : 36} dark={dark} />
      </span>
      {size === 'sm' ? (
        <b>{word}</b>
      ) : (
        <span>
          <b>{word}</b>
          {sub && <small>{sub}</small>}
        </span>
      )}
    </span>
  );
}

export function PassChanceCard({
  level,
  label,
  word,
  line,
  scaleLabels,
  className,
}: {
  level: PassChanceLevel;
  /** Het monolabel boven het woord ("Slaagkans"). */
  label: ReactNode;
  word: ReactNode;
  line?: ReactNode;
  /** Vier labels onder de schaal, van laag naar hoog. */
  scaleLabels: [ReactNode, ReactNode, ReactNode, ReactNode];
  className?: string;
}) {
  return (
    <div className={cn('g-kans-lg', className)}>
      <span className="g-kans-lg-dlw">
        <PassChanceDial level={level} size={64} />
      </span>
      <div className="min-w-0">
        <span className="g-mono">{label}</span>
        <b>{word}</b>
        {line && <small>{line}</small>}
        <div className="g-kscale" aria-hidden="true">
          {[1, 2, 3, 4].map(i => <i key={i} className={i <= level ? 'g-on' : undefined} />)}
        </div>
        <div className="g-kscale-l" aria-hidden="true">
          {scaleLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}
