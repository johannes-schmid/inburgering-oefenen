import { cn } from '@/lib/utils';
import {
  C, DARK_TINTS, GABLE_CYCLE, HEIGHT_RAMP, LIGHT_TINTS, SILHOUETTE_TINTS, type Gable,
} from './tokens';

export type SkylineTone = 'hero' | 'light' | 'silhouette';

/**
 * The canal-house skyline — the signature form of the Dutch Horizon language (§7.1).
 *
 * **The rules are enforced here rather than left to the caller**, because every one of them was a
 * way the graphic reads wrong: it always runs the full width (a single centred house reads as a
 * logo, not a street), it is anchored to the bottom edge and clipped by the parent's
 * `overflow: hidden` (so it reads as a street rather than as floating shapes), it carries no text,
 * and the gable type cycles so three identical roofs can never end up side by side.
 *
 * Scale by dropping houses (`count`), never by shrinking every part — 11 on a hero, 5–7 on a
 * banner or card topper, 3–4 in a scene circle.
 *
 * The parent must be `position: relative; overflow: hidden`.
 */
export default function Skyline({
  count = 11,
  tone = 'hero',
  height = 124,
  windows = false,
  offset = 0,
  seed = 0,
  className,
}: {
  count?: number;
  tone?: SkylineTone;
  /** Height of the tallest house, in px. The skyline must stay inside the lower third. */
  height?: number;
  /** Window grids on the two or three tallest houses. Heroes only, per §7.1. */
  windows?: boolean;
  /** Lift the street line above the bottom edge — used to stand the row on a horizon band. */
  offset?: number;
  /**
   * Rotates the gable/height/tint ramps so two skylines on one page are not the same street
   * (§7.5). It is an offset into the tables rather than randomness, so the street is still stable
   * between the server and the browser.
   */
  seed?: number;
  className?: string;
}) {
  const gap = count > 8 ? 7 : count > 5 ? 5 : 4;

  return (
    <div
      aria-hidden="true"
      className={cn('absolute left-0 right-0 flex items-end pointer-events-none', className)}
      style={{ gap: `${gap}px`, bottom: offset }}
    >
      {Array.from({ length: count }, (_, i) => (
        <House key={i} index={i + seed} tone={tone} maxHeight={height} windows={windows} />
      ))}
    </div>
  );
}

function fill(tone: SkylineTone, i: number): string {
  if (tone === 'hero') return `rgba(255,255,255,${DARK_TINTS[i % DARK_TINTS.length]})`;
  if (tone === 'silhouette') return SILHOUETTE_TINTS[i % SILHOUETTE_TINTS.length];
  return LIGHT_TINTS[i % LIGHT_TINTS.length];
}

function House({
  index, tone, maxHeight, windows,
}: { index: number; tone: SkylineTone; maxHeight: number; windows: boolean }) {
  const gable: Gable = GABLE_CYCLE[index % GABLE_CYCLE.length];
  const factor = HEIGHT_RAMP[index % HEIGHT_RAMP.length];
  const total = Math.round(maxHeight * factor);
  const bg = fill(tone, index);

  // Windows only on the tallest houses, and only when the house is big enough to hold a grid.
  const showWindows = windows && factor >= 0.79 && total > 56;
  const roofH = Math.max(8, Math.round(total * 0.22));
  const bodyH = total - roofH;

  return (
    <div className="flex-1 flex flex-col items-center">
      {gable === 'dome' && (
        <div style={{ width: '66%', height: roofH, borderRadius: '999px 999px 0 0', background: bg }} />
      )}
      {gable === 'bell' && (
        <div style={{ width: '100%', height: roofH, borderRadius: `${Math.min(9, roofH / 2)}px ${Math.min(9, roofH / 2)}px 0 0`, background: bg }} />
      )}
      {gable === 'punt' && (
        // The only permitted triangle in the system (§7.5, puntgevel).
        <div style={{ width: '52%', height: roofH, background: bg, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
      )}
      {gable === 'stepped' && (
        <>
          <div style={{ width: '34%', height: Math.round(roofH / 2), background: bg }} />
          <div style={{ width: '68%', height: roofH - Math.round(roofH / 2), background: bg }} />
        </>
      )}
      <div style={{ width: '100%', height: bodyH, background: bg }}>
        {showWindows && (
          <div className="flex flex-wrap justify-center gap-[5px] pt-1.5">
            {Array.from({ length: 6 }, (_, w) => (
              <div key={w} style={{ width: 5, height: 5, borderRadius: 1, background: tone === 'hero' ? 'rgba(255,255,255,0.10)' : C.surfaceContainerHigh }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
