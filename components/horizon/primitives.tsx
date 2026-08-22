import { cn } from '@/lib/utils';
import { C, HORIZON_GRADIENT, SUN_GRADIENT, dotField } from './tokens';

/**
 * The three remaining primitives plus the two derived forms, per §7.1 of the design system.
 * All of them are pure CSS — there is no image, no SVG and no illustrator in this language.
 */

/** The single point of attention. **One per composition** — the orange is a pointer, never a texture. */
export function SunDisc({ size = 120, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-full pointer-events-none', className)}
      style={{ width: size, height: size, background: SUN_GRADIENT, ...style }}
    />
  );
}

/**
 * The horizon band — progress, footers, surface edges. 8px, `secondary → secondary_container`.
 * With `progress` it becomes the Dutch Horizon progress bar: the fill is the gradient and the
 * remainder is the same orange at 14%, so the track needs no line to be legible.
 */
export function HorizonBand({
  progress, height = 8, rounded = false, className,
}: { progress?: number; height?: number; rounded?: boolean; className?: string }) {
  if (progress === undefined) {
    return <div aria-hidden="true" className={className} style={{ height, background: HORIZON_GRADIENT }} />;
  }
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        height,
        borderRadius: rounded ? 999 : 0,
        background: `linear-gradient(90deg, ${C.secondary} 0%, ${C.secondaryContainer} ${pct}%, rgba(254,118,44,0.14) ${pct}%, rgba(254,118,44,0.14) 100%)`,
      }}
    />
  );
}

/** Texture for empty areas, hero depth and skeletons. Never a foreground element. */
export function DotField({ on = 'light', size = 22, className }: { on?: 'light' | 'dark'; size?: number; className?: string }) {
  return <div aria-hidden="true" className={cn('absolute inset-0 pointer-events-none', className)} style={dotField(on, size)} />;
}

/**
 * The lens ring — circular progress and level medals. Built from layered `box-shadow` rings, so it
 * honours the no-line rule (§2): there is no border anywhere in it.
 */
export function LensRing({
  size = 58, ring = 10, halo = C.surfaceContainerHigh, tone = C.primary, children, className,
}: {
  size?: number; ring?: number; halo?: string; tone?: string;
  children?: React.ReactNode; className?: string;
}) {
  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0', className)}
      style={{
        width: size, height: size, background: '#f2f4f6',
        boxShadow: `0 0 0 ${ring}px ${tone}, 0 0 0 ${ring + 8}px ${halo}`,
      }}
    >
      {children}
    </div>
  );
}

/** Glass chip — 16% surface + 20px blur, for controls floating over a `primary` surface (§7.2b). */
export function GlassChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-white', className)}
      style={{ background: 'rgba(248,249,251,0.16)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {children}
    </span>
  );
}
