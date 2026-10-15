'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

export type PlatformNavItem = { id: string; label: string };

/**
 * De zijbalk van `/platform`: ankers naar de secties, en het anker van de sectie die je leest is
 * gekozen (wit + navy inset-ring, G5). Eén IntersectionObserver, geen scrolllistener. Zonder
 * JavaScript zijn het gewone ankers.
 */
export default function PlatformNav({ items, label }: { items: PlatformNavItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      entries => {
        const hit = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="g-pf2-nav">
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined}>
              {item.label}
              <ChevronRight aria-hidden="true" className="rtl-flip" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
