import { cn } from '@/lib/utils';

/**
 * De **track-merken** — Taal A2, Taal B1, KNM en ONA — in Glas v1.0: **"label + trede"**
 * (docs/design/DESIGN_SYSTEM.md §G4, `renderEm` stijl `c` + KNM/ONA `k1` in docs/design/glas.html).
 *
 * Een vlakke navy tegel (radius 25%, geen verloop, geen glans), het label linksboven in Manrope 800
 * en één regel eronder met precies één oranje deel:
 *
 * - **A2** drie treden, de tweede oranje · **B1** de derde oranje — één tekening op twee hoogtes,
 *   zodat een niveaukiezer "één hoger" zegt vóór het label gelezen is. De treden zijn géén claim
 *   over hoeveel Nederlands een niveau is (`SEO/facts.md` §9).
 * - **KNM** drie grachtenpanden, het middelste oranje.
 * - **ONA** een klein, dun kompas met een oranje naald op een vage lijn.
 *
 * ## Wat dit benoemt, en het verschil met `CategoryMark`
 *
 * Een track-merk benoemt *iets wat je koopt en waarin je examen doet*, op een **omgekeerde navy
 * tegel**. `CategoryMark` benoemt wat er *in* een track zit, op een lichte tegel. Die omkering is
 * dragend: zet nooit een track op een lichte tegel of een onderdeel op een navy tegel om een rij op
 * te ruimen. KNM heeft in beide sets een merk en die zijn niet uitwisselbaar — kies op de vraag die
 * het scherm beantwoordt: "welke module?" (dit) of "welk onderdeel?" (`CategoryMark`).
 *
 * ## Geometrie
 *
 * Getekend op het **72-raster** als SVG en geschaald met `size`; teken nooit opnieuw op een andere
 * maat. **Ondergrens 28px.** `direction="ltr"` staat vast op de SVG: het label is een `<text>` met
 * `text-anchor` start, en in een RTL-document zou dat aan de verkeerde kant ankeren.
 *
 * Deze component is de ene gedeelde laag tussen Glas en de nog niet herbouwde oppervlakken (de
 * spec staat dat toe); de props zijn daarom ongewijzigd gebleven.
 */

export type Track = 'a2' | 'b1' | 'knm' | 'ona';

type Props = {
  track: Track;
  /** Weergavemaat van de vierkante tegel in px. Minimum 28. */
  size?: number;
  /**
   * Grijze tegel met een wit accent, voor een track die is aangekondigd maar nog geen inhoud
   * heeft. Een gedempt merk geeft geen oranje uit.
   */
  muted?: boolean;
  /** Het merk staat op een donker vlak: tegel van 12% wit met een lichte rand in plaats van navy-op-navy. */
  onDark?: boolean;
  className?: string;
};

const ORANJE = '#fe762c';
const WHITE = '#ffffff';

export default function ExamMark({ track, size = 44, muted = false, onDark = false, className }: Props) {
  const s = Math.max(28, size);
  const accent = muted ? WHITE : ORANJE;
  const tile = onDark ? 'rgba(255,255,255,0.12)' : muted ? '#7f8ba4' : '#002b6d';

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={s}
      height={s}
      viewBox="0 0 72 72"
      direction="ltr"
      className={cn('inline-block shrink-0 align-middle', className)}
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <rect width="72" height="72" rx="18" fill={tile} />
      {onDark && <rect x=".75" y=".75" width="70.5" height="70.5" rx="17.25" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" />}
      {LINES[track](accent)}
    </svg>
  );
}

function Label({ text, size, y }: { text: string; size: number; y: number }) {
  return (
    <text
      x="13"
      y={y}
      textAnchor="start"
      fill={WHITE}
      fontSize={size}
      fontWeight={800}
      letterSpacing={-1}
      style={{ fontFamily: 'var(--font-headline), Manrope, sans-serif' }}
    >
      {text}
    </text>
  );
}

/** Drie treden; `lit` is de oranje. Treden ervoor wit, erna gedimd: "dit niveau bereikt". */
function Treden({ lit, accent }: { lit: 1 | 2; accent: string }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <rect
          key={i}
          x={13 + i * 16}
          y={51}
          width={14}
          height={6}
          rx={3}
          fill={i === lit ? accent : i < lit ? WHITE : 'rgba(255,255,255,.25)'}
        />
      ))}
    </>
  );
}

const gable = (x: number, fill: string) => <path key={x} d={`M${x} 59V49.5l6.5-6.5 6.5 6.5V59z`} fill={fill} />;

const LINES: Record<Track, (accent: string) => React.ReactNode> = {
  a2: accent => (
    <>
      <Label text="A2" size={24} y={32} />
      <Treden lit={1} accent={accent} />
    </>
  ),
  b1: accent => (
    <>
      <Label text="B1" size={24} y={32} />
      <Treden lit={2} accent={accent} />
    </>
  ),
  knm: accent => (
    <>
      <Label text="KNM" size={19} y={31} />
      {gable(13, WHITE)}
      {gable(29, accent)}
      {gable(45, WHITE)}
    </>
  ),
  ona: accent => (
    <>
      <Label text="ONA" size={19} y={31} />
      <circle cx="19" cy="53" r="6.2" fill="none" stroke={WHITE} strokeWidth="2.2" />
      <path d="M22.6 49.4l-2.5 4.7-2.2-2.2z" fill={accent} />
      <path d="M15.4 56.6l2.5-4.7 2.2 2.2z" fill="rgba(255,255,255,.7)" />
      <rect x="30" y="51" width="29" height="5" rx="2.5" fill="rgba(255,255,255,.25)" />
    </>
  ),
};
