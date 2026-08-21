import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type BreadcrumbItem = { label: string; href?: string };

/**
 * The crumb trail. Two tones, because it sits on two different grounds.
 *
 * `surface` (the default) is the standalone grey band between the nav and the page.
 * `onDark` is for a trail rendered *inside* a dark hero — added 2026-08-21 for the kennisgidsen
 * with a hero photo, where the grey band left a strip of light chrome between the white nav and
 * the photograph and read as a gap rather than as navigation. On this tone the caller supplies the
 * ground (`bg-transparent`, no border); only the text colours change here, so the trail cannot end
 * up dark-on-dark by forgetting one class at the call site.
 */
export default function Breadcrumb({
  items,
  className,
  tone = 'surface',
}: {
  items: BreadcrumbItem[];
  className?: string;
  tone?: 'surface' | 'onDark';
}) {
  const dark = tone === 'onDark';
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(dark ? '' : 'bg-surface-container-low border-b', className)}
      style={dark ? undefined : { borderColor: 'rgba(196,198,210,0.2)' }}
    >
      <div
        className={cn(
          'max-w-7xl mx-auto px-6 py-3 flex items-center flex-wrap gap-2 text-sm',
          dark ? '' : 'text-on-surface-variant',
        )}
        style={dark ? { color: 'rgba(255,255,255,0.6)' } : undefined}
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span
                className={dark ? '' : 'text-outline'}
                style={dark ? { color: 'rgba(255,255,255,0.35)' } : undefined}
              >
                ›
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href as Parameters<typeof Link>[0]['href']}
                className={cn(
                  'no-underline transition-colors',
                  dark ? 'hover:text-white' : 'hover:text-primary',
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={dark ? 'font-medium' : 'text-on-surface font-medium'}
                style={dark ? { color: 'rgba(255,255,255,0.92)' } : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
