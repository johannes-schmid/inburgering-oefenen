'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { ADMIN_NAV, NAV_LEVELS, adminHref, type AdminNavItem } from '@/lib/admin/nav';
import { isLevel } from '@/data/skills';

/**
 * The admin nav, shared by the desktop sidebar and the mobile drawer.
 *
 * The three content surfaces carry a level sub-menu instead of a niveau dropdown on the page.
 * A2 and B1 are separately authored catalogues, so "which level" is a place you go, not a filter
 * you apply — and a URL like `/admin/questions?niveau=b1` is linkable and survives a reload,
 * which a `useState` filter never did.
 */
export default function AdminNav({ locale, onNavigate }: { locale: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams();
  // Only a level actually in the URL marks a sub-item as current. On a detail route like
  // `/admin/exams/5` there is no `?niveau=`, and defaulting to A2 there highlighted the wrong child
  // while a B1 exam was on screen.
  const rawLevel = search.get('niveau');
  const activeLevel = isLevel(rawLevel) ? rawLevel : null;

  const primary = ADMIN_NAV.filter(i => !i.secondary);
  const secondary = ADMIN_NAV.filter(i => i.secondary);

  const render = (item: AdminNavItem) => (
    <NavEntry
      key={item.path}
      item={item}
      locale={locale}
      pathname={pathname}
      activeLevel={activeLevel}
      onNavigate={onNavigate}
    />
  );

  return (
    <nav className="flex-1 space-y-1 p-4">
      {primary.map(render)}
      <div className="mt-2 space-y-1 border-t border-white/10 pt-3">{secondary.map(render)}</div>
    </nav>
  );
}

function NavEntry({
  item,
  locale,
  pathname,
  activeLevel,
  onNavigate,
}: {
  item: AdminNavItem;
  locale: string;
  pathname: string;
  activeLevel: string | null;
  onNavigate?: () => void;
}) {
  const base = `/${locale}/admin${item.path}`;
  // Dashboard matches only itself; every other section also owns its detail routes
  // (`/exams/12`, `/rubrics/3/edit`), which must keep the section highlighted and open.
  const active = item.path === '' ? pathname === base : pathname.startsWith(base);
  const [open, setOpen] = useState(active);

  if (!item.levelled) {
    return (
      <Link href={base} onClick={onNavigate} className={rowClass(active)}>
        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={`${rowClass(active)} w-full text-left`}
      >
        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        <span
          className="material-symbols-outlined text-[18px] opacity-60 transition-transform duration-150 motion-reduce:transition-none"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden
        >
          expand_more
        </span>
      </button>

      {open && (
        <ul className="mt-0.5 mb-1 ml-[26px] list-none space-y-0.5 border-l border-white/15 p-0 pl-2">
          {NAV_LEVELS.map(({ level, label }) => {
            // Only marked current when this section is the one being viewed — otherwise every
            // expanded section would show an A2 child highlighted.
            const current = active && activeLevel === level;
            return (
              <li key={level}>
                <Link
                  href={adminHref(locale, item.path, level)}
                  onClick={onNavigate}
                  aria-current={current ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
                    current
                      ? 'bg-white/15 text-white'
                      : 'text-white/55 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function rowClass(active: boolean) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`;
}
