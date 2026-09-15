'use client';

import { useState } from 'react';
import {
  ArrowLeft, Blocks, BookOpen, Check, ChevronRight, ClipboardCheck, Clock, Info, Link2, Lock,
  type LucideIcon, Puzzle, Shapes, SpellCheck, Sparkles, Target, Volume2,
} from 'lucide-react';
import type { LearnPanelData, SectionIcon } from './nav';

/**
 * De glyphs van de sectiekoppen. Zie `SectionIcon` in `nav.ts` voor waarom dit lucide is en
 * geen categoriemerk, en waarom de sleutel en de component hier uit elkaar staan.
 */
const ICONS: Record<SectionIcon, LucideIcon> = {
  zinnen: Puzzle,
  tijd: Clock,
  soorten: Shapes,
  verbuigen: SpellCheck,
  verwijzen: Link2,
  klank: Volume2,
  bouwstenen: Blocks,
  uitleg: Info,
  training: Target,
  toets: ClipboardCheck,
  woorden: BookOpen,
  regel: Sparkles,
};

/**
 * De tweede kolom, en **alleen binnen een lesmodule**.
 *
 * Zie de doc-comment bij `LearnPanelData` in `nav.ts` voor waarom hij een uitzondering is en
 * geen vaste kolom. Hij is licht op de navy zijbalk: die draagt het merk, en een tweede donkere
 * kolom liet de twee assen als één blok lezen.
 *
 * **Elke sectie klapt uit, en alleen de huidige staat open.** Een spoor van dertig lessen
 * achter elkaar is één scrollende lijst en geen navigatie meer, en meer dan één open sectie
 * laat de module waar je in zit verdrinken. Zie de `open`-state hieronder voor waarom hier
 * niets meer wordt onthouden.
 *
 * Elke kop draagt een glyph — zes kapitaalkoppen onder elkaar zijn niet te scannen. Het is
 * lucide en geen categoriemerk; zie `SectionIcon` in `nav.ts`.
 */
export default function LearnPanel({ locale, data }: { locale: string; data: LearnPanelData }) {
  const currentSection = data.sections.find(s => s.items.some(i => i.current))?.id ?? data.sections[0]?.id;

  /**
   * **Alleen de huidige module staat open** (eigenaar, 15-09), en die staat er niet in — hij
   * komt uit `currentSection` hieronder.
   *
   * Dit was `localStorage`, en dat was fout zodra het paneel het héle spoor droeg: een sectie
   * die je ooit had opengeklapt bleef dat in élke cursus, dus je kwam binnen met drie of vier
   * modules open en de module waar je in zat verdronk ertussen. Persistentie is hier ook niet
   * nodig — klik je een les in een andere module aan, dan *is* dat de volgende pagina de
   * huidige module, en staat hij open omdat hij de huidige is en niet omdat het onthouden is.
   */
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(id: string, next: boolean) {
    setOpen(prev => ({ ...prev, [id]: next }));
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
          /* De huidige module wint altijd van een dichtgeklapte: de sectie sluiten waar je
             op dit moment in staat verbergt precies waar je bent. Zelfde regel als bij het
             modulemenu in de zijbalk. */
          const isOpen = section.id === currentSection || (open[section.id] ?? false);
          const Glyph = section.icon ? ICONS[section.icon] : null;
          return (
            <div key={section.id} className={`lp-sec${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="lp-sec-head"
                aria-expanded={isOpen}
                onClick={() => toggle(section.id, !isOpen)}
              >
                <ChevronRight size={13} strokeWidth={2.6} className="lp-chev rtl-flip" aria-hidden />
                {Glyph && (
                  <span className="lp-ic" aria-hidden>
                    <Glyph size={13} strokeWidth={2.2} />
                  </span>
                )}
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
