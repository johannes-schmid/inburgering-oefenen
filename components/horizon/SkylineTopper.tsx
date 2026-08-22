import { cn } from '@/lib/utils';
import Skyline from './Skyline';
import { DotField } from './primitives';
import { C, HERO_GRADIENT } from './tokens';

/** One tint per module. All four are the existing navy palette — §7.3 forbids new hues, so the
 *  variety in a grid of cards comes from tint plus geometry, never from colour. */
export type TopperTint = 'gradient' | 'reverse' | 'primary' | 'container';

const TINTS: Record<TopperTint, string> = {
  gradient: HERO_GRADIENT,
  reverse: `linear-gradient(135deg, ${C.primaryContainer} 0%, ${C.primary} 100%)`,
  primary: C.primary,
  container: C.primaryContainer,
};

/**
 * The card header of the system (§7.2, module cards): a short skyline band across the top of a
 * card. Five to seven houses — a card topper is the *same street* as the hero, just fewer houses.
 *
 * `locked` is the roadmap / not-yet-shipped state: all colour drops to the neutral ramp. Never
 * grey a card out with `opacity` and never hide it — visible scope is the all-in-one promise
 * (§7.2b).
 *
 * `seed` rotates the ramps so a grid of cards is a grid of *different* streets; pass the card's
 * index times a small number.
 */
export default function SkylineTopper({
  height = 92,
  houses = 5,
  locked = false,
  tint = 'gradient',
  seed = 0,
  band = true,
  children,
  className,
}: {
  height?: number;
  houses?: number;
  locked?: boolean;
  tint?: TopperTint;
  seed?: number;
  /** The 4px horizon band on the street line. Off when the card carries its own band at the foot. */
  band?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ height, background: locked ? '#f2f4f6' : TINTS[tint] }}
    >
      <DotField on={locked ? 'dark' : 'light'} size={16} />
      <Skyline
        count={houses}
        tone={locked ? 'light' : 'hero'}
        height={Math.round(height * 0.62)}
        seed={seed}
      />
      {children}
      {band && (
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0"
          style={{
            height: 4,
            background: locked ? C.outlineVariant : `linear-gradient(90deg, ${C.secondary}, ${C.secondaryContainer})`,
          }}
        />
      )}
    </div>
  );
}
