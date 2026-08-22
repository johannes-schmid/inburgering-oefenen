import Skyline from './Skyline';
import { DotField, HorizonBand, SunDisc } from './primitives';

/**
 * The graphic layer of a Dutch Horizon header, as one drop-in: dot field, a responsive skyline,
 * one optional sun disc, and the horizon band on the bottom edge. The parent supplies the
 * background and must be `position: relative; overflow: hidden`; the copy goes after this in the
 * DOM with `position: relative` so it sits above.
 *
 * **The responsive pair of house counts is the whole reason this exists.** §7.1 says to scale a
 * skyline by dropping houses rather than by shrinking every part — but a house also has to stay
 * roughly as wide as it is tall, or it stops reading as a canal house. Fourteen houses look right
 * at 1440px and read as a picket fence at 390px; six look right on a phone and as a bar chart on a
 * desktop. Every header needs both, so no header should have to remember that.
 */
export default function HorizonBanner({
  desktopHouses = 14,
  mobileHouses = 6,
  desktopHeight = 80,
  mobileHeight = 52,
  seed = 0,
  windows = false,
  /** Where the sun sits, or `false` for a centred header that has no empty flank to put it in. */
  sun = { size: 104, right: '8%', top: '16%' } as { size: number; right: string; top: string } | false,
  band = true,
}: {
  desktopHouses?: number;
  mobileHouses?: number;
  desktopHeight?: number;
  mobileHeight?: number;
  seed?: number;
  windows?: boolean;
  sun?: { size: number; right: string; top: string } | false;
  band?: boolean;
}) {
  return (
    <>
      <DotField on="light" />
      <div aria-hidden="true" className="absolute inset-0 sm:hidden">
        <Skyline count={mobileHouses} tone="hero" height={mobileHeight} offset={band ? 8 : 0} seed={seed} />
      </div>
      <div aria-hidden="true" className="absolute inset-0 hidden sm:block">
        <Skyline count={desktopHouses} tone="hero" height={desktopHeight} offset={band ? 8 : 0} seed={seed} windows={windows} />
      </div>
      {sun && (
        /* Hidden below `sm`: at 390px the copy fills the full width, and §7.3 forbids any graphic
           running behind it. A composition with no sun is fine; an overlapped headline is not. */
        <SunDisc size={sun.size} className="absolute hidden sm:block" style={{ right: sun.right, top: sun.top }} />
      )}
      {band && <HorizonBand className="absolute left-0 right-0 bottom-0 z-20" />}
    </>
  );
}
