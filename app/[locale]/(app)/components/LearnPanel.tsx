'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Lock } from 'lucide-react';
import type { LearnPanelData } from './nav';

const KEY = 'portal-learn-panel-open';

/**
 * De tweede kolom, en **alleen binnen een lesmodule**.
 *
 * Zie de doc-comment bij `LearnPanelData` in `nav.ts` voor waarom hij een uitzondering is en
 * geen vaste kolom. Hij is licht op de navy zijbalk: die draagt het merk, en een tweede donkere
 * kolom liet de twee assen als één blok lezen.
 *
 * **Elke sectie klapt uit.** Een cursus van vijftig lessen achter elkaar is één scrollende
 * lijst en geen navigatie meer. De sectie waar de huidige les in zit staat altijd open — een
 * opgeslagen "dicht" mag nooit verbergen waar je bent, dezelfde regel als bij het KNM-submenu.
 * De rest komt uit `localStorage`, want elke portaalpagina is een servercomponent en de chrome
 * hermount dus bij iedere navigatie.
 */
export default function LearnPanel({ locale, data }: { locale: string; data: LearnPanelData }) {
  const currentSection = data.sections.find(s => s.items.some(i => i.current))?.id ?? data.sections[0]?.id;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setOpen(JSON.parse(raw) as Record<string, boolean>);
    } catch { /* een navigatiepaneel mag de pagina die het versiert nooit kunnen breken */ }
  }, []);

  function toggle(id: string, next: boolean) {
    setOpen(prev => {
      const value = { ...prev, [id]: next };
      try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* zie boven */ }
      return value;
    });
  }

  return (
    <aside id="dash-panel" aria-label={data.title}>
      <a href={`/${locale}${data.backHref}`} className="lp-back">
        <ArrowLeft size={13} strokeWidth={2.4} className="rtl-flip" aria-hidden />
        <span>{data.backLabel}</span>
      </a>
      <p className="lp-title">{data.title}</p>

      <nav className="lp-nav">
        {data.sections.map(section => {
          const isOpen = section.id === currentSection || (open[section.id] ?? false);
          return (
            <div key={section.id} className={`lp-sec${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="lp-sec-head"
                aria-expanded={isOpen}
                onClick={() => toggle(section.id, !isOpen)}
              >
                <ChevronRight size={13} strokeWidth={2.6} className="lp-chev rtl-flip" aria-hidden />
                <span className="lp-sec-lb">
                  {section.letter && <span className="lp-letter">{section.letter}</span>}
                  {section.label}
                </span>
                {typeof section.done === 'number' && typeof section.total === 'number' && (
                  <span className="lp-n">{section.done}/{section.total}</span>
                )}
              </button>
              {isOpen && (
                <div className="lp-items">
                  {section.items.map(item => (
                    <a
                      key={item.href}
                      href={`/${locale}${item.href}`}
                      aria-current={item.current ? 'page' : undefined}
                      className={`lp-row${item.current ? ' on' : ''}${item.locked ? ' dim' : ''}`}
                    >
                      {/* Alleen een tegel als er iets in staat. Een leeg vierkantje naast elke
                          nog niet gedane les leest als een uitgevinkt vakje — terwijl "nog niet
                          gedaan" gewoon de normale toestand is. */}
                      {item.done || item.locked
                        ? (
                          <span className="lp-mark" aria-hidden>
                            {item.done
                              ? <Check size={11} strokeWidth={3.2} />
                              : <Lock size={10} strokeWidth={2.6} />}
                          </span>
                        )
                        : <span className="lp-gap" aria-hidden />}
                      <span className="lp-lb">{item.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
