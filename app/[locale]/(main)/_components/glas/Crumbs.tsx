import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type CrumbItem = { label: string; href?: string };

/**
 * Het kruimelpad in Glas (glas.html §08 "Kruimelpad"): klein, `ink-2`, op het veld van de kop en
 * niet in een eigen grijze band. Het laatste item is de huidige pagina (`aria-current`).
 * De BreadcrumbList in JSON-LD staat los hiervan op de pagina zelf.
 */
export default function Crumbs({ items, className, label = 'Breadcrumb' }: { items: CrumbItem[]; className?: string; label?: string }) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="g-crumb">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {i > 0 && <ChevronRight aria-hidden="true" className="rtl-flip" />}
              {item.href && !last ? (
                <Link href={item.href as Parameters<typeof Link>[0]['href']}>{item.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn(!last && 'text-ink')}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
