import { cn } from '@/lib/utils';

type Shadow = 'sm' | 'md' | 'lg' | 'ambient' | 'none';

/**
 * `ambient` is the design system's own elevation (§4): 32px blur, no offset, 6% of `on_surface` —
 * a soft glow of light rather than the heavy 2010 drop shadow. **Prefer it on anything new.** The
 * sm/md/lg family predates the system and is kept only so the ~40 existing callers do not all have
 * to move in one commit. `none` is for a card that gets its elevation from tonal layering alone,
 * which is what the spec actually prefers: a white card inside a `surface-container` wrapper reads
 * as elevated through contrast, with no shadow at all.
 */
const SHADOW: Record<Shadow, string> = {
  sm: 'var(--shadow-card)',
  md: 'var(--shadow-card-md)',
  lg: 'var(--shadow-card-lg)',
  ambient: 'var(--shadow-ambient)',
  none: 'none',
};

export default function Card({
  children,
  className,
  shadow = 'sm',
  padding = 'p-6',
}: {
  children: React.ReactNode;
  className?: string;
  shadow?: Shadow;
  padding?: string;
}) {
  return (
    <div
      className={cn('bg-surface-container-lowest rounded-2xl', padding, className)}
      style={{ boxShadow: SHADOW[shadow] }}
    >
      {children}
    </div>
  );
}
