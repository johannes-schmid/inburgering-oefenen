/**
 * The article cover — a Horizon scene for one guide.
 *
 * Headspace gives every article a drawn scene. We cannot: `docs/design/DESIGN_SYSTEM.md` §7.3
 * bans illustrations, mascots and line-art imagery, and all decorative imagery is built from the
 * four primitives. So a cover is a **composed scene out of the vocabulary we already have** —
 * five layers, always in this order, and only the glyph and the street's seed change per article:
 *
 *   1. **Field** — flat `primary`, flat `primary_container`, or the brand gradient. One per
 *      cluster, so a card reads as Inburgering / KNM / Taalexamens before its title is read.
 *   2. **Dot field** — `dotField()` from `tokens.ts`, unchanged.
 *   3. **Glyph** — `coverGlyphs.tsx`, on the 96×96 grid, in the upper-left two thirds.
 *   4. **Street** — the real `Skyline` ramps (`HEIGHT_RAMP`, `GABLE_CYCLE`, `DARK_TINTS`),
 *      eleven houses in the lower third.
 *   5. **Horizon band** — 4px, `secondary → secondary_container`. The one constant.
 *
 * Four decisions worth keeping:
 *
 *  - **The sun belongs to the PILLAR, not to every card.** §7.3's "one sun disc per composition"
 *    reads per-cover, but in a grid the grid is the composition: twenty-two orange discs side by
 *    side is exactly the cheapening that rule exists to prevent. Rationing it to the three pillars
 *    turns the sun into a hierarchy signal — on `/gidsen` the three entry points light up and
 *    nothing else does. `pillar` on the guide drives it; there is no prop to override it.
 *  - **Nothing here uses `Math.random()`, and that is load-bearing.** These are server components:
 *    a random street would render one row on the server and another in the browser — a hydration
 *    mismatch on every page with a guide card. The street's variation comes from a seed *derived
 *    from the slug*, so a guide's cover is the same street wherever it appears and stays the same
 *    when the list around it is reordered. Same reason `tokens.ts` has no randomness.
 *  - **The street is dropped below `sm`.** At card widths under ~220px eleven houses collapse into
 *    a smudge, so `compact` renders field + glyph + band only. It is a real size threshold, not a
 *    breakpoint picked for tidiness — check it before changing the grid.
 *  - **No SVG `<defs>`, no gradient ids.** Every gradient is a CSS background on a plain `div`, and
 *    the SVG carries solid fills only. Ids in `<defs>` are document-global: nine covers on one hub
 *    would each define `#sun` and every one of them would resolve to the first. This shape cannot
 *    collide.
 *
 * Rendered as an image, not as content: the whole thing is `aria-hidden`. Anything a reader needs
 * to know is the card's title beside it.
 */
import { cn } from '@/lib/utils';
import { GLYPHS, type CoverGlyph } from './coverGlyphs';
import {
  C, DARK_TINTS, GABLE_CYCLE, HEIGHT_RAMP, HORIZON_GRADIENT, SUN_GRADIENT, dotField, type Gable,
} from './tokens';

/** Which cluster a cover belongs to. Mirrors `GuideSection`, kept local so `components/` does not
 *  import from `data/guides` — the dependency runs the other way everywhere else. */
export type CoverField = 'inburgering' | 'knm' | 'taalexamens' | 'blog';

const FIELD: Record<CoverField, { bg: string; ink: string; on: 'light' | 'dark'; street: string }> = {
  inburgering: { bg: C.primary, ink: C.onPrimary, on: 'light', street: '255,255,255' },
  knm: {
    bg: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`,
    ink: C.onPrimary, on: 'light', street: '255,255,255',
  },
  taalexamens: { bg: C.primaryContainer, ink: C.onPrimary, on: 'light', street: '255,255,255' },
  /* The blog inverts: a light field with navy ink, so a post never reads as a gids on a mixed
     page. Same five layers, same ramps — this is the proof the system is not navy-only. */
  blog: { bg: C.surfaceContainerHigh, ink: C.primary, on: 'dark', street: '0,43,109' },
};

/**
 * A stable seed from the slug, so a cover's street is a property of the guide rather than of its
 * position in whatever list is rendering it. Four positions in the ramp is enough variety to stop
 * a grid looking stamped, and few enough that the row still reads as one skyline.
 */
function seedFor(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return [0, 3, 5, 7][h % 4];
}

/**
 * How much to lift `DARK_TINTS` for a cover.
 *
 * The ramp is 6–15% `on_primary`, tuned for a hero that runs the full width of a 1440px page. A
 * cover is a tenth of that area, and at 370px the same alphas render as a grey smear rather than
 * as a street — the first screenshot of the KNM hub showed exactly that. This is the one place a
 * `tokens.ts` ramp is scaled rather than used raw, and it is a *size* correction, not a new
 * palette: the ceiling keeps the tallest house under 26%, well inside §7.1's tonal range.
 */
const STREET_LIFT = 1.8;
const STREET_CEIL = 0.26;

/** The eleven-house street as one SVG path set. Geometry is `Skyline`'s, in a 400×60 box. */
function street(seed: number, ink: string) {
  const N = 11, W = 400, GAP = 7, MAX = 58, GROUND = 60;
  const w = (W - GAP * (N - 1)) / N;

  return Array.from({ length: N }, (_, k) => {
    const i = k + seed;
    const x = k * (w + GAP);
    const total = Math.round(MAX * HEIGHT_RAMP[i % HEIGHT_RAMP.length]);
    const roof = Math.max(8, Math.round(total * 0.22));
    const top = GROUND - total;
    const body = top + roof;
    const alpha = Math.min(STREET_CEIL, DARK_TINTS[i % DARK_TINTS.length] * STREET_LIFT);
    const fill = `rgba(${ink},${alpha.toFixed(3)})`;
    const gable: Gable = GABLE_CYCLE[i % GABLE_CYCLE.length];

    let roofPath = '';
    if (gable === 'bell') {
      const r = Math.min(9, roof / 2);
      roofPath = `M${x} ${body} V${top + r} a${r} ${r} 0 0 1 ${r} -${r} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} V${body} Z`;
    } else if (gable === 'dome') {
      const dw = w * 0.66, dx = x + (w - dw) / 2;
      roofPath = `M${dx} ${body} A${dw / 2} ${roof} 0 0 1 ${dx + dw} ${body} Z`;
    } else if (gable === 'punt') {
      roofPath = `M${x} ${body} L${x + w / 2} ${top} L${x + w} ${body} Z`;
    } else {
      const s = roof / 3, sw = w / 6;
      roofPath = `M${x} ${body} V${body - s} h${sw} V${body - 2 * s} h${sw} V${top} h${w - 4 * sw} V${body - 2 * s} h${sw} V${body - s} h${sw} V${body} Z`;
    }

    return (
      <g key={k}>
        <rect x={x} y={body} width={w} height={GROUND - body} fill={fill} />
        <path d={roofPath} fill={fill} />
      </g>
    );
  });
}

export default function GuideCover({
  slug,
  field,
  glyph,
  pillar = false,
  compact = false,
  fill = false,
  className,
}: {
  /** Drives the street's seed. Any stable string; the guide's slug in practice. */
  slug: string;
  field: CoverField;
  glyph: CoverGlyph;
  /** The sun disc. One per cluster — see the header. */
  pillar?: boolean;
  /** Drop the street. For cards narrower than ~220px, where eleven houses stop reading. */
  compact?: boolean;
  /**
   * Stretch to the parent instead of holding 400:250. For a slot that already sets its own box —
   * the route reader's 220×150 panel. The scene is positioned in percentages throughout, so it
   * re-composes at the new ratio rather than cropping; a cropped cover would slide the glyph
   * under the card's edge.
   */
  fill?: boolean;
  className?: string;
}) {
  const f = FIELD[field];

  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-lg', fill && 'absolute inset-0 h-full w-full', className)}
      style={{ background: f.bg, aspectRatio: fill ? undefined : '400 / 250' }}
    >
      <div className="absolute inset-0" style={dotField(f.on)} />

      {pillar && (
        <div
          className="absolute rounded-full"
          style={{ left: '75%', top: '17.6%', width: '15%', aspectRatio: '1', background: SUN_GRADIENT }}
        />
      )}

      <svg
        viewBox="0 0 96 96"
        className="absolute"
        style={{ left: '9%', top: '19%', width: '32%' }}
      >
        {GLYPHS[glyph](f.ink, f.bg.startsWith('linear') ? C.primary : f.bg)}
      </svg>

      {!compact && (
        <svg viewBox="0 0 400 60" className="absolute inset-x-0 w-full" style={{ bottom: '1.6%' }}>
          {street(seedFor(slug), f.street)}
        </svg>
      )}

      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: HORIZON_GRADIENT }} />
    </div>
  );
}
