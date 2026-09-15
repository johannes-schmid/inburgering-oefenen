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
      /* `section-transition` is de haak voor de kritieke CSS in `app/[locale]/layout.tsx`: die
         zet dezelfde twee hoogtes vóórdat `globals.css` binnen is. Zonder die regel neemt dit
         blok tot dat moment zijn intrinsieke hoogte aan (1215px) en klapt het daarna in — 0,616
         CLS op elke pagina. De Tailwind-klassen blijven staan als de bron van waarheid; de
         kritieke regel herhaalt ze alleen eerder. Wijzig je er één, wijzig dan beide —
         `tests-unit/critical-css.test.ts` faalt als ze uit elkaar lopen. */
      className={cn('section-transition relative overflow-hidden bg-surface-container-lowest h-[76px] sm:h-[112px]', className)}
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
