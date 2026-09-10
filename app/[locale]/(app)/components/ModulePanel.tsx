'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Lock } from 'lucide-react';
import type { ModulePanelData } from './nav';

/**
 * De tweede kolom binnen een module van een spoor.
 *
 * Zie `ModulePanelData` in `nav.ts` voor waarom hij er is. Hij deelt de lichte `#dash-panel`
 * met `LearnPanel` — één tweede kolom in de chrome, en dus één plek waar de breedte en de
 * achtergrond geregeld zijn — maar de inhoud is een andere as: één module, zijn lessen, en de
 * switcher naar de andere modules van hetzelfde spoor.
 *
 * Er klapt hier niets uit: zeven lessen zijn geen navigatieprobleem. Het enige dat open kan is
 * de moduleswitcher, en die sluit bij Escape en bij een klik ernaast — een menu dat blijft
 * hangen bedekt de lijst eronder.
 */
export default function ModulePanel({ locale, data }: { locale: string; data: ModulePanelData }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <aside id="dash-panel" aria-label={data.name}>
      <a href={`/${locale}${data.backHref}`} className="lp-back">
        <ArrowLeft size={13} strokeWidth={2.4} className="rtl-flip" aria-hidden />
        <span>{data.backLabel}</span>
      </a>

      <div className="mp-switch" ref={box}>
        <button
          type="button"
          className="mp-switch-btn"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen(v => !v)}
        >
          <span className="mp-switch-body">
            <span className="mp-kick">{data.kicker}</span>
            <span className="mp-name">{data.name}</span>
          </span>
          <ChevronDown size={15} strokeWidth={2.4} className="mp-chev" aria-hidden />
        </button>
        {open && (
          <div className="mp-menu" role="menu">
            {data.siblings.map(m => (
              <a
                key={m.href}
                href={`/${locale}${m.href}`}
                role="menuitem"
                aria-current={m.current ? 'true' : undefined}
                className={`mp-menu-row${m.current ? ' on' : ''}`}
              >
                <span className="mp-menu-lb">{m.label}</span>
                <span className="mp-menu-bar" aria-hidden><i style={{ width: `${m.pct}%` }} /></span>
                <span className="mp-menu-pct">{m.pct}%</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mp-prog">
        <span className="mp-bar" aria-hidden><i style={{ width: `${data.pct}%` }} /></span>
        <span className="mp-count">{data.done}/{data.total}</span>
        <span className="mp-pct">{data.pct}%</span>
      </div>

      <nav className="mp-list">
        {data.lessons.map((les, i) => (
          <a
            key={les.href}
            href={`/${locale}${les.href}`}
            aria-current={les.current ? 'page' : undefined}
            className={`mp-row${les.current ? ' on' : ''}${les.done ? ' is-done' : ''}${les.locked ? ' dim' : ''}`}
          >
            <span className="mp-n" aria-hidden>
              {les.done
                ? <Check size={11} strokeWidth={3.2} />
                : les.locked
                  ? <Lock size={10} strokeWidth={2.6} />
                  : i + 1}
            </span>
            <span className="lp-lb">{les.label}</span>
          </a>
        ))}
      </nav>

      {data.next && (
        <a href={`/${locale}${data.next.href}`} className="mp-next">
          <span className="min-w-0">
            <span className="mp-next-kick">{data.next.kicker}</span>
            <span className="mp-next-title">{data.next.label}</span>
          </span>
          <ArrowRight size={14} strokeWidth={2.5} className="mp-next-go rtl-flip" aria-hidden />
        </a>
      )}
    </aside>
  );
}
