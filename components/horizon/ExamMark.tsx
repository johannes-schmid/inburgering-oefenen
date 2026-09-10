import { cn } from '@/lib/utils';
import { C } from './tokens';

/**
 * The official **track marks** — Taal A2, Taal B1, KNM and ONA — imported from the Claude Design
 * project *Dutch Icon Studio* (§04b "Exam marks") on 2026-09-02.
 *
 * ## What this names, and how it differs from `CategoryMark`
 *
 * The product sells at two altitudes, and the icon layer has one mark for each:
 *
 * | Altitude | What it names | Component | Tile |
 * |---|---|---|---|
 * | **Track** | the thing you buy and sit an exam in — Taal A2, Taal B1, KNM, ONA | `ExamMark` | **inverted**: navy tile, white ink |
 * | **Onderdeel** | what is inside a track — Lezen, Luisteren, Schrijven, Spreken, and the KNM thema's | `CategoryMark` | light: neutral tile, navy ink |
 *
 * The inversion is the whole point: on a dashboard listing four modules and their onderdelen, the
 * navy tiles are the things with a price and an exam date, and the light tiles are the practice
 * inside them. That contrast is doing the work a heading would otherwise have to do, so **never
 * render a track on a light tile or an onderdeel on a navy one** to tidy up a row.
 *
 * KNM appears in both sets on purpose and they are not interchangeable. As a **track** it is the
 * molen-mens-tulp mark here — one of the four things a candidate buys. As a **category** it is the
 * colonnade in `CategoryMark` — the subject matter, sitting beside Lezen and Wonen. Pick by the
 * question the surface is answering: "which module?" or "which onderdeel?".
 *
 * ## A2 and B1 are one drawing at two heights
 *
 * Both are the same three-step stair with the label above it; only which step is orange changes.
 * Side by side that says *one level higher* before the label is read, which is the single thing a
 * level picker has to communicate. The steps are **not** a claim about how much Dutch a level is —
 * no such number exists and `SEO/facts.md` §9 forbids publishing one.
 *
 * ## Geometry
 *
 * Drawn on the studio's **72×72 grid** and scaled by transform, exactly like `CategoryMark`, so
 * one geometry serves a 32px row icon and a 72px card tile. Pass `size`; never re-draw at another
 * size. Tile radius is a quarter of the tile at every size (studio §06).
 *
 * ## The floor: 32px, and 40px for KNM
 *
 * `a2` and `b1` set their label at 18px on the 72 grid, so below **32px** those two characters
 * fall under ~8px and stop being readable — the mark then says nothing the stair alone can carry.
 * `knm` is three objects in one tile and needs **40px**. Below the floor, do one of two things:
 * use `CategoryMark` (the colonnade for KNM, the compass for ONA), or set the level as plain text,
 * which is what the portal sidebar does at 19px. Do **not** shrink a track mark past it.
 */

export type Track = 'a2' | 'b1' | 'knm' | 'ona';

const GRID = 72;

/**
 * Two literals the studio uses only inside these marks, so they are deliberately **not** in
 * `tokens.C` — that table mirrors `@theme` in `app/globals.css` and everything in it must exist as
 * a CSS variable. These are drawing colours for one component: a mid-blue that still separates
 * from the navy tile (the figure's arms behind its body), and the grey an announced-only track's
 * tile takes.
 */
const ARM = '#4a7ec4';
const MUTED_TILE = '#8b93a3';

type Props = {
  track: Track;
  /** Rendered size of the square tile, in px. The 72-grid drawing is scaled to fit. */
  size?: number;
  /**
   * Greys the whole tile out, for a track that is announced but has no content behind it — today
   * that is ONA and nothing else. Studio §04b draws this state explicitly rather than leaving it
   * to opacity, because a faded navy tile still reads as available at a glance.
   */
  muted?: boolean;
  /**
   * The mark is sitting on a navy surface — a selected card, a hero, the sidebar. The tile lifts
   * to translucent white instead of navy-on-navy; the ink and the accent are unchanged, because
   * they were already the light-on-dark pair. This is studio §06's "Active" state, and it is the
   * *only* sanctioned way to put a track mark on a dark background.
   */
  onDark?: boolean;
  className?: string;
};

export default function ExamMark({ track, size = 44, muted = false, onDark = false, className }: Props) {
  const tile = onDark ? 'rgba(255,255,255,0.14)' : muted ? MUTED_TILE : C.primary;
  const ink = C.onPrimary;
  /* Muted spends no orange: the accent is the pointer that says "this is live" (§8, one sun disc
     per composition), and an announced-only track has nothing to point at. */
  const accent = muted ? C.onPrimary : C.secondaryContainer;
  const radius = Math.round(size * 0.25);

  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 relative overflow-hidden', className)}
      style={{ width: size, height: size, borderRadius: radius, background: tile }}
    >
      <span
        className="absolute left-0 top-0 block"
        style={{ width: GRID, height: GRID, transform: `scale(${size / GRID})`, transformOrigin: '0 0' }}
      >
        {MARKS[track]({ ink, accent })}
      </span>
    </span>
  );
}

type Paint = { ink: string; accent: string };

const abs = (style: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', ...style });

/** The stair shared by A2 and B1. `lit` is which of the three steps carries the accent. */
function stair(lit: 0 | 1 | 2, label: string, { ink, accent }: Paint) {
  const steps = [
    { w: 11, h: 14 },
    { w: 9, h: 21 },
    { w: 11, h: 32 },
  ];
  return (
    <>
      <span
        style={abs({
          left: 0, right: 0, bottom: 10,
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4,
        })}
      >
        {steps.map((s, i) => (
          <span
            key={i}
            style={{
              width: s.w,
              height: s.h,
              borderRadius: 2,
              /* The steps above the lit one stay ghosted, so the mark reads as a level reached
                 rather than as a bar chart of three equal things. */
              background: i === lit ? accent : i < lit ? ink : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </span>
      <span
        style={abs({
          left: 0, right: 0, top: 9,
          textAlign: 'center',
          font: '800 18px var(--font-headline), Manrope, sans-serif',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: ink,
        })}
      >
        {label}
      </span>
    </>
  );
}

const MARKS: Record<Track, (p: Paint) => React.ReactNode> = {
  a2: p => stair(1, 'A2', p),
  b1: p => stair(2, 'B1', p),

  /* KNM is the samenleving, so the mark is three of its inhabitants at once: a molen behind, a
     person in front, a tulp beside. It is the busiest mark in the system and it is allowed to be —
     KNM is the one track whose subject is "everything about living here". It is drawn for 40px and
     up; below that use `CategoryMark category="knm"`, the colonnade, which survives 24px. */
  knm: ({ ink, accent }) => (
    <>
      {/* molen: the tower, then the sails crossing over it */}
      <span style={abs({ left: 14, bottom: 20, width: 12, height: 18, background: ink, clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)' })} />
      <span style={abs({ left: 20, top: 32, transform: 'translate(-50%,-50%) rotate(28deg)', width: 22, height: 4, borderRadius: 2, background: ink })} />
      <span style={abs({ left: 20, top: 32, transform: 'translate(-50%,-50%) rotate(-62deg)', width: 22, height: 4, borderRadius: 2, background: ink })} />
      <span style={abs({ left: 20, top: 32, transform: 'translate(-50%,-50%)', width: 6, height: 6, borderRadius: '50%', background: ink })} />
      {/* tulp: the one orange in the composition, because it is the thing that grows */}
      <span style={abs({ left: 30, bottom: 20, width: 12, height: 22, borderRadius: '6px 6px 0 0', background: accent })} />
      <span style={abs({ left: 31, bottom: 41, width: 10, height: 10, borderRadius: '50%', background: accent })} />
      {/* mens: body over two arms, standing on the street line */}
      <span style={abs({ left: 53, bottom: 20, width: 3, height: 14, borderRadius: 2, background: ink })} />
      <span style={abs({ left: 48, bottom: 26, width: 7, height: 4, borderRadius: '999px 0 0 999px', background: ink })} />
      <span style={abs({ left: 44, bottom: 35, width: 8, height: 13, borderRadius: '6px 1px 2px 6px', background: ARM })} />
      <span style={abs({ left: 56, bottom: 35, width: 8, height: 13, borderRadius: '1px 6px 6px 2px', background: ARM })} />
      <span style={abs({ left: 49, bottom: 33, width: 11, height: 18, borderRadius: '6px 6px 2px 2px', background: ink })} />
    </>
  ),

  /* ONA is orientation on the labour market, so the mark is the compass — the needle is the only
     moving part and therefore the only orange. A briefcase would have collided with the Werk
     thema inside KNM. */
  ona: ({ ink, accent }) => (
    <>
      <span style={abs({ left: 14, top: 14, width: 44, height: 44, borderRadius: '50%', boxSizing: 'border-box', border: `6px solid ${ink}` })} />
      <span style={abs({ left: 33, top: 20, width: 6, height: 20, borderRadius: 3, background: accent, transform: 'rotate(38deg)', transformOrigin: '50% 100%' })} />
      <span style={abs({ left: 33, top: 36, width: 6, height: 6, borderRadius: '50%', background: ink })} />
    </>
  ),
};
