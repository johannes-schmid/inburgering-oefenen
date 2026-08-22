import { cn } from '@/lib/utils';
import Skyline from './Skyline';
import { DotField, HorizonBand, SunDisc } from './primitives';
import { C, HERO_GRADIENT } from './tokens';

export type HeroTone = 'gradient' | 'inverted' | 'light';

/**
 * The page header of the whole site — a Dutch Horizon hero (§7.2).
 *
 * The stack is fixed and its order is the whole effect: the gradient (or flat surface), the dot
 * field for depth, one skyline anchored to the bottom edge, **one** sun disc, then the copy on
 * top, then the horizon band on the bottom edge. Two gradients never appear in one composition —
 * which is why the band is the only other gradient here and the sun disc is the only accent.
 *
 * Copy sits in the upper two thirds; the skyline occupies the lower third at most, and is clipped
 * by this element's `overflow: hidden`, so it reads as a street rather than as floating shapes.
 *
 * Pass `title` for the structured header (eyebrow / display title / lede / actions) — that is the
 * form every `(main)` page header should use. Pass `children` instead when a page needs its own
 * layout inside the same graphic frame.
 */
export default function HorizonHero({
  tone = 'gradient',
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  houses = 11,
  skylineHeight,
  windows = true,
  sun = true,
  band = true,
  className,
  containerClass,
}: {
  tone?: HeroTone;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  houses?: number;
  /** Override the street height. Lower it when the header's copy runs deep — the skyline must stay
   *  in the lower third and may never sit behind text (§7.3). */
  skylineHeight?: number;
  windows?: boolean;
  sun?: boolean;
  band?: boolean;
  className?: string;
  containerClass?: string;
}) {
  const dark = tone !== 'light';
  const background = tone === 'gradient' ? HERO_GRADIENT : tone === 'inverted' ? C.primary : '#f2f4f6';

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background }}>
      <DotField on={dark ? 'light' : 'dark'} />
      <Skyline
        count={houses}
        tone={dark ? 'hero' : 'light'}
        windows={dark && windows}
        height={skylineHeight ?? (houses > 8 ? 124 : 84)}
      />
      {sun && (
        <SunDisc
          size={houses > 8 ? 120 : 72}
          className="absolute"
          style={{ right: '7%', top: '18%' }}
        />
      )}

      <div className={cn('relative max-w-7xl mx-auto px-6 py-14 md:py-20', containerClass)}>
        {title !== undefined ? (
          <div className="max-w-3xl flex flex-col gap-4">
            {eyebrow && (
              <span
                className="self-start inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold uppercase"
                style={{
                  letterSpacing: '0.12em',
                  color: dark ? '#fff' : C.secondary,
                  background: dark ? 'rgba(248,249,251,0.16)' : 'rgba(162,64,0,0.10)',
                  backdropFilter: dark ? 'blur(20px)' : undefined,
                  WebkitBackdropFilter: dark ? 'blur(20px)' : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: C.secondaryContainer }} />
                {eyebrow}
              </span>
            )}
            <h1
              className="font-headline font-extrabold m-0"
              style={{
                color: dark ? '#fff' : C.primary,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                lineHeight: 1.04,
                letterSpacing: '-0.02em',
                textWrap: 'balance',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="m-0 text-base md:text-lg max-w-[52ch]"
                style={{ lineHeight: 1.6, color: dark ? 'rgba(255,255,255,0.82)' : C.onSurfaceVariant, textWrap: 'pretty' }}
              >
                {subtitle}
              </p>
            )}
            {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
          </div>
        ) : (
          children
        )}
      </div>

      {band && <HorizonBand className="absolute left-0 right-0 bottom-0" />}
    </div>
  );
}
