import { cn } from '@/lib/utils';
import Skyline from './Skyline';
import { DotField } from './primitives';

/**
 * The silhouette handover (§7.2) — a white band carrying the dot field and a bottom-anchored
 * skyline in solid `primary` tints, cut off by the dark section that starts at the street line.
 * The houses read as silhouettes rather than as a wash.
 *
 * **Once per page maximum**, and never hung from the top edge. Everywhere else, the transition
 * between two sections is a tonal step — a background colour shift, per the no-line rule (§2).
 */
export default function SectionTransition({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden bg-surface-container-lowest h-[76px] sm:h-[112px]', className)}
    >
      <DotField on="dark" size={18} />
      {/* Two counts behind one breakpoint, for the same reason as `GradientHero`: a house has to
          stay roughly as wide as it is tall, so eleven houses across 1440px read as squat blocks
          while fourteen across 390px read as a picket fence. */}
      <div className="absolute inset-0 sm:hidden">
        <Skyline count={6} tone="silhouette" height={54} />
      </div>
      <div className="absolute inset-0 hidden sm:block">
        <Skyline count={15} tone="silhouette" height={92} seed={2} />
      </div>
    </div>
  );
}
