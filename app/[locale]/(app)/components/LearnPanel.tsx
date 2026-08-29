'use client';

import { ArrowLeft, Check, Lock } from 'lucide-react';
import type { LearnPanelData } from './nav';

/**
 * De tweede kolom, en **alleen binnen een lesmodule**.
 *
 * Zie de doc-comment bij `LearnPanelData` in `nav.ts` voor waarom hij een uitzondering is en
 * geen vaste kolom. Hij is licht op de navy zijbalk: die draagt het merk, en een tweede donkere
 * kolom liet de twee assen als één blok lezen.
 *
 * Hij rendert wat de pagina hem geeft en leidt niets af — alleen de pagina weet welke les de
 * huidige is, wat af is en wat achter het aanbod zit.
 */
export default function LearnPanel({ locale, data }: { locale: string; data: LearnPanelData }) {
  return (
    <aside id="dash-panel" aria-label={data.title}>
      <a href={`/${locale}${data.backHref}`} className="lp-back">
        <ArrowLeft size={13} strokeWidth={2.4} className="rtl-flip" aria-hidden />
        <span>{data.backLabel}</span>
      </a>
      <p className="lp-title">{data.title}</p>

      <nav className="lp-nav">
        {data.sections.map(section => (
          <div key={section.id} className="lp-sec">
            <p className="lp-sec-head">
              <span>
                {section.letter && <span className="lp-letter">{section.letter}</span>}
                {section.label}
              </span>
              {typeof section.done === 'number' && typeof section.total === 'number' && (
                <span className="lp-n">{section.done}/{section.total}</span>
              )}
            </p>
            {section.items.map(item => (
              <a
                key={item.href}
                href={`/${locale}${item.href}`}
                aria-current={item.current ? 'page' : undefined}
                className={`lp-row${item.current ? ' on' : ''}${item.locked ? ' dim' : ''}`}
              >
                {/* Alleen een tegel als er iets in staat. Een leeg vierkantje naast elke nog
                    niet gedane les leest als een uitgevinkt vakje — een lijst met vijftig
                    lege hokjes, terwijl "nog niet gedaan" gewoon de normale toestand is. */}
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
        ))}
      </nav>
    </aside>
  );
}
