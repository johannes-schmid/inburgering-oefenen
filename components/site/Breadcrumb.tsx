import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type BreadcrumbItem = { label: string; href?: string };

export default function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('bg-surface-container-low border-b', className)}
      style={{ borderColor: 'rgba(196,198,210,0.2)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center flex-wrap gap-2 text-sm text-on-surface-variant">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-outline">›</span>}
            {item.href ? (
              <Link href={item.href as Parameters<typeof Link>[0]['href']} className="hover:text-primary transition-colors no-underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-on-surface font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
