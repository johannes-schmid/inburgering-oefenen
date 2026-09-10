'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import {
  ADMIN_NAV_SECTIONS,
  adminHref,
  navLevelsFor,
  type AdminLevel,
  type AdminNavItem,
} from '@/lib/admin/nav';
import { isKnm, isLevel } from '@/data/skills';

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
  /**
   * `undefined` means "no level in the URL", which is different from `null`, which **is** the
   * KNM tab. Collapsing the two would highlight KNM on every detail route that carries no
   * `?niveau=` at all.
   */
  const activeLevel: AdminLevel | undefined =
    isKnm(rawLevel) ? null : isLevel(rawLevel) ? rawLevel : undefined;

  return (
    <nav className="flex-1 p-4">
      {ADMIN_NAV_SECTIONS.map((section, i) => (
        <div key={section.title ?? 'top'} className={i === 0 ? 'space-y-1' : 'mt-5 space-y-1'}>
          {/* Een kop en geen streep: de scheiding komt van de ruimte en het label, niet van een
              lijn — dezelfde regel als op de publieke kant. */}
          {section.title && (
            <p className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.09em] text-white/40">
              {section.title}
            </p>
          )}
          {section.items.map(item => (
            <NavEntry
              key={item.path}
              item={item}
              locale={locale}
              pathname={pathname}
              activeLevel={activeLevel}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
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
  /** `undefined` = no level in the URL; `null` = the KNM tab. */
  activeLevel: AdminLevel | undefined;
  onNavigate?: () => void;
}) {
  const base = `/${locale}/admin${item.path}`;
  const onExtra = (item.extra ?? []).some(e => pathname.startsWith(`/${locale}/admin${e.path}`));
  // Dashboard matcht alleen zichzelf; elke andere sectie bezit ook zijn detailroutes
  // (`/exams/12`, `/rubrics/3/edit`). Een kind met een eigen pad (Woordkaarten) houdt zijn ouder
  // wél open — anders markeert de zijbalk niets op een scherm dat er gewoon in staat.
  const active =
    (item.path === '' ? pathname === base : pathname.startsWith(base)) || onExtra;
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
          {navLevelsFor(item).map(({ level, label, param }) => {
            // Only marked current when this section is the one being viewed — otherwise every
            // expanded section would show an A2 child highlighted.
            const current = active && activeLevel !== undefined && activeLevel === level;
            return (
              <li key={param}>
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

          {(item.extra ?? []).map(extra => {
            const href = `/${locale}/admin${extra.path}`;
            const current = pathname.startsWith(href);
            return (
              <li key={extra.path}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={current ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
                    current
                      ? 'bg-white/15 text-white'
                      : 'text-white/55 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {extra.label}
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
