import { cn } from '@/lib/utils';
import { C } from './tokens';

/**
 * The official category marks — the icon layer of the Dutch Horizon language, imported from the
 * Claude Design project *Dutch Icon Studio* (§04 "Category marks v3") on 2026-08-22.
 *
 * These are **not** a second icon set competing with lucide. The split is by job:
 *
 * - **A category mark names a thing the product sells** — an onderdeel, the KNM section, the
 *   gidsen. It is brand imagery, drawn from the same primitives as the skyline, and it appears on
 *   marketing surfaces where the category *is* the offer.
 *  - **lucide-react stays every functional affordance** — a chevron, a close button, a nav item.
 *
 * Confusing the two is how a design system ends up with two visual voices. The rule in
 * `docs/design/DESIGN_SYSTEM.md` §7.3 ("no illustrations, mascots or line-art imagery") is not
 * broken here: there is no line art and no drawing tool involved. Every mark is composed from
 * blocks, discs and the one permitted triangle, in CSS, exactly like the houses.
 *
 * ## Geometry
 *
 * All six are drawn on the studio's **72×72 grid** and scaled with a transform, so one geometry
 * serves a 28px shelf tile and a 72px section header without a second set of numbers to keep in
 * step. Do not re-draw a mark at another size — pass `size`.
 *
 * The `cut` colour is the tile showing *through* the ink (the pages of the document, the gaps
 * between the columns). It must equal the tile behind it, which is why the tone switch changes
 * both together and why a mark cannot be dropped onto an arbitrary background.
 */

export type Category =
  | 'lezen' | 'luisteren' | 'schrijven' | 'spreken'
  | 'knm' | 'gidsen'
  /* The three KNM thema marks the studio worked out (§04). They name a *topic* inside KNM, not an
     onderdeel, so they belong here rather than in a set of their own — same grid, same paint. */
  | 'wonen' | 'gezondheid' | 'werk';

const GRID = 72;

type Props = {
  category: Category;
  /** Rendered size of the square tile, in px. The 72-grid drawing is scaled to fit. */
  size?: number;
  /** `light` for light surfaces (neutral tile), `dark` for navy ones (translucent tile). */
  tone?: 'light' | 'dark';
  className?: string;
};

export default function CategoryMark({ category, size = 44, tone = 'light', className }: Props) {
  const onDark = tone === 'dark';
  /* `cut` is the tile colour repeated. On navy a translucent tile has no single hex to repeat, so
     the ink lightens instead and the cutouts take the panel's own navy — the same trick the
     skyline's tint ramp uses. */
  const ink = onDark ? '#ffffff' : C.primary;
  const cut = onDark ? C.primary : C.surfaceContainerHigh;
  const accent = C.secondaryContainer;
  const radius = Math.round(size * 0.25);

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
      <span
        className="absolute left-0 top-0 block"
        style={{ width: GRID, height: GRID, transform: `scale(${size / GRID})`, transformOrigin: '0 0' }}
      >
        {MARKS[category]({ ink, cut, accent })}
      </span>
    </span>
  );
}

type Paint = { ink: string; cut: string; accent: string };

const abs = (style: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', ...style });

const MARKS: Record<Category, (p: Paint) => React.ReactNode> = {
  /* A sheet of text with the last line running short and in the accent — the one place the eye
     lands, and the reason this reads as "reading" rather than "a document". */
  lezen: ({ ink, cut, accent }) => (
    <>
      <span style={abs({ left: 18, top: 11, width: 36, height: 50, borderRadius: 3, background: ink })} />
      <span style={abs({ left: 25, top: 22, width: 22, display: 'flex', flexDirection: 'column', gap: 5 })}>
        <span style={{ height: 4, borderRadius: 2, background: cut }} />
        <span style={{ height: 4, borderRadius: 2, background: cut }} />
        <span style={{ height: 4, borderRadius: 2, background: cut }} />
        <span style={{ height: 4, width: '60%', borderRadius: 2, background: accent }} />
      </span>
    </>
  ),

  /* The waveform, tallest bar in the accent. Five bars, not more: at 28px a sixth closes the gaps
     and the whole thing turns into a block. */
  luisteren: ({ ink, accent }) => (
    <span
      style={abs({
        left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        display: 'flex', alignItems: 'center', gap: 5, height: 46,
      })}
    >
      {[12, 26, 46, 30, 16].map((h, i) => (
        <span key={i} style={{ width: 6, height: h, borderRadius: 3, background: i === 2 ? accent : ink }} />
      ))}
    </span>
  ),

  /* The pen at 30°, the grip cut out of its shaft, standing on the line it just wrote — whose
     first run is the accent. Studio §04: the cut band is what stops the shaft reading as a bar. */
  schrijven: ({ ink, cut, accent }) => (
    <>
      <span style={abs({ left: 30, top: 10, width: 12, height: 36, borderRadius: '6px 6px 1px 1px', background: ink, transform: 'rotate(30deg)', transformOrigin: '50% 100%' })}>
        <span style={abs({ left: 0, right: 0, top: 25, height: 3, background: cut })} />
      </span>
      <span style={abs({ left: 14, bottom: 14, width: 44, height: 5, borderRadius: 3, background: ink })} />
      <span style={abs({ left: 14, bottom: 14, width: 15, height: 5, borderRadius: 3, background: accent })} />
    </>
  ),

  /* Two speech volumes overlapping — the answer in the accent, which is what the candidate
     produces. A microphone glyph would have said "recording"; this says "speaking". */
  spreken: ({ ink, accent }) => (
    <>
      <span style={abs({ left: 10, top: 14, width: 40, height: 28, borderRadius: 8, background: ink })} />
      <span style={abs({ left: 14, top: 40, width: 12, height: 10, borderRadius: '0 0 6px 6px', background: ink })} />
      <span style={abs({ right: 10, bottom: 12, width: 30, height: 22, borderRadius: 7, background: accent })} />
    </>
  ),

  /* "Instanties" from the studio — the colonnade, pediment included. KNM is the onderdeel about
     how the Dutch state and society work, and a public building is what every one of its eight
     thema's runs into. The triangle is the one permitted triangle; without it the three columns
     and two rails read as a chart. */
  knm: ({ ink }) => (
    <>
      <span style={abs({ left: 12, top: 11, width: 48, height: 15, background: ink, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' })} />
      <span style={abs({ left: 10, top: 26, width: 52, height: 6, borderRadius: 2, background: ink })} />
      <span style={abs({ left: 16, top: 34, display: 'flex', gap: 10 })}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 8, height: 20, background: ink }} />
        ))}
      </span>
      <span style={abs({ left: 10, bottom: 12, width: 52, height: 6, borderRadius: '0 0 2px 2px', background: ink })} />
    </>
  ),

  /* "Brug" from the studio's Dutch object set. The gidsen are the crossing — the reader arrives
     not knowing the traject and leaves on the other side. A book would have collided with Lezen. */
  gidsen: ({ ink }) => (
    <>
      <span style={abs({ left: 12, top: 18, width: 48, height: 24, borderRadius: '24px 24px 0 0', boxSizing: 'border-box', border: `6px solid ${ink}`, borderBottom: 'none' })} />
      <span style={abs({ left: 8, right: 8, top: 40, height: 6, borderRadius: 3, background: ink })} />
      <span style={abs({ left: 14, bottom: 18, width: 22, height: 5, borderRadius: 3, background: C.primaryContainer })} />
      <span style={abs({ right: 14, bottom: 10, width: 30, height: 5, borderRadius: 3, background: C.primaryContainer })} />
    </>
  ),
  /* "Wonen" — three canal houses, the same three gable forms `Skyline` cycles. The doorway is cut
     out of the middle house in the tile colour, which is what makes the row read as houses at
     32px rather than as a bar chart. */
  wonen: ({ ink, cut }) => (
    <>
      <span style={abs({ left: 10, right: 10, bottom: 10, display: 'flex', alignItems: 'flex-end', gap: 2 })}>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ width: '42%', height: 4, background: ink }} />
          <span style={{ width: '76%', height: 4, background: ink }} />
          <span style={{ width: '100%', height: 28, background: ink }} />
        </span>
        <span style={{ flex: 1.15, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ width: '60%', height: 11, borderRadius: '999px 999px 0 0', background: ink }} />
          <span style={{ width: '100%', height: 36, background: ink }} />
        </span>
        <span style={{ flex: 0.9, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ width: '50%', height: 9, borderRadius: '3px 3px 0 0', background: ink }} />
          <span style={{ width: '100%', height: 24, background: ink }} />
        </span>
      </span>
      <span style={abs({ left: 27, bottom: 10, width: 8, height: 12, borderRadius: '4px 4px 0 0', background: cut })} />
    </>
  ),

  /* "Gezondheid" — the cross cut out of a rounded square, never drawn on top of it. A drawn cross
     needs a stroke, and a stroke is the one thing this vocabulary does not have. */
  gezondheid: ({ ink, cut }) => (
    <>
      <span style={abs({ left: 12, top: 12, width: 48, height: 48, borderRadius: 14, background: ink })} />
      <span style={abs({ left: 22, top: 33, width: 28, height: 6, borderRadius: 3, background: cut })} />
      <span style={abs({ left: 33, top: 22, width: 6, height: 28, borderRadius: 3, background: cut })} />
    </>
  ),

  /* "Werk" — the case, with the accent as the latch. */
  werk: ({ ink, cut, accent }) => (
    <>
      <span style={abs({ left: 26, top: 14, width: 20, height: 12, borderRadius: '6px 6px 0 0', boxSizing: 'border-box', borderTop: `6px solid ${ink}`, borderLeft: `6px solid ${ink}`, borderRight: `6px solid ${ink}` })} />
      <span style={abs({ left: 10, top: 26, width: 52, height: 32, borderRadius: 5, background: ink })} />
      <span style={abs({ left: 10, top: 38, width: 52, height: 5, background: cut })} />
      <span style={abs({ left: 30, top: 34, width: 12, height: 12, borderRadius: 2, background: accent })} />
    </>
  ),
};
