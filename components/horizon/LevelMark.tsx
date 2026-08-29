import { cn } from '@/lib/utils';
import { C } from './tokens';
import type { Level } from '@/data/skills';

/**
 * The CEFR level mark — A2 and B1 as one gauge, drawn from the Horizon primitives.
 *
 * ## Why this exists beside `CategoryMark`
 *
 * `CategoryMark` names **a thing the product sells**: an onderdeel, KNM, the gidsen. A level is
 * not one of those — it is a *property* of the four taalonderdelen, and the same four onderdelen
 * exist at both. Adding `a2` and `b1` to that union would have put two values in it that answer a
 * different question from the other nine, and the picker needs both on one screen: "Taal A2" is a
 * track, "Lezen" is what is inside it.
 *
 * ## What it draws, and why it is a gauge rather than a ring with a label in it
 *
 * The mockup (`Gratis Oefenen Opties.dc.html`, flow 1a) drew a flat 5px ring with "A2" set inside
 * it. Two levels drawn that way differ **only by the two characters in the middle** — the graphic
 * carries no meaning at all, and at 48px on a phone the ring reads as a border rather than as a
 * mark. Here the arc is the meaning: the same gauge, opened further for B1, closed by an orange
 * cap that is the same length on both. Side by side the two say "one step higher" before the
 * label is read, which is the one thing a level picker has to communicate.
 *
 * A ring, an arc and a disc are the language's own shapes (§7.1) — this is not line art, and the
 * orange is a pointer rather than a second sun (§7.3): it terminates the arc, it is never a disc.
 *
 * ## Geometry
 *
 * Drawn on the same **72×72 grid** as `CategoryMark` and scaled by transform, so one geometry
 * serves a 40px row icon and a 72px card tile. Pass `size`; never re-draw at another size.
 */

const GRID = 72;
const CX = 36;
const R = 25;
const STROKE = 6;

/** The gauge's opening, in degrees: it starts bottom-left and sweeps clockwise, gap at the foot. */
const START = 135;
const SPAN = 270;

/**
 * How far each level opens the gauge, as a fraction of `SPAN`.
 *
 * These are **not** a claim about how much Dutch a level is — no such number exists, and
 * `SEO/facts.md` forbids publishing one. They are the drawing: two positions far enough apart to
 * read as different at 40px, with B1 short of full so the gauge still reads as a gauge.
 */
const FILL: Record<Level, number> = { a2: 0.52, b1: 0.82 };

/** Length of the orange terminating cap, in degrees. Identical on both, on purpose. */
const CAP = 34;

function polar(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CX + R * Math.sin(rad) };
}

/** An SVG arc path from `from` to `to`, clockwise. */
function arc(from: number, to: number) {
  const a = polar(from);
  const b = polar(to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

type Props = {
  level: Level;
  /** Rendered size of the square tile, in px. The 72-grid drawing is scaled to fit. */
  size?: number;
  /** `light` for light surfaces (neutral tile), `dark` for navy ones (translucent tile). */
  tone?: 'light' | 'dark';
  className?: string;
};

export default function LevelMark({ level, size = 44, tone = 'light', className }: Props) {
  const onDark = tone === 'dark';
  const ink = onDark ? '#ffffff' : C.primary;
  /* The unfilled remainder of the gauge. It has to sit on the tile, so on light it is one step of
     the neutral ramp darker than the tile and on navy it is white at low alpha — the same
     treatment the skyline's tint ramp uses rather than a second hue. */
  const track = onDark ? 'rgba(255,255,255,0.22)' : C.outlineVariant;
  const accent = C.secondaryContainer;
  const radius = Math.round(size * 0.25);

  const filled = SPAN * FILL[level];
  const capStart = START + filled;

  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 relative overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: onDark ? 'rgba(255,255,255,0.12)' : C.surfaceContainerHigh,
      }}
    >
      <svg
        viewBox={`0 0 ${GRID} ${GRID}`}
        width={size}
        height={size}
        className="absolute left-0 top-0 block"
        fill="none"
      >
        {/* The remainder first, so the filled arc and its cap paint over its round ends. */}
        <path d={arc(START, START + SPAN)} stroke={track} strokeWidth={STROKE} strokeLinecap="round" />
        <path d={arc(START, capStart)} stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />
        <path d={arc(capStart, capStart + CAP)} stroke={accent} strokeWidth={STROKE} strokeLinecap="round" />
        <text
          x={CX}
          y={CX}
          textAnchor="middle"
          dominantBaseline="central"
          fill={ink}
          style={{
            font: `800 22px var(--font-headline), Manrope, sans-serif`,
            letterSpacing: '-0.03em',
          }}
        >
          {level.toUpperCase()}
        </text>
      </svg>
    </span>
  );
}
