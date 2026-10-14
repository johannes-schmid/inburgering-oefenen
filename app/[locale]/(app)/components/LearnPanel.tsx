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
 * geen vaste kolom. In Glas is hij een witte kaart naast de glazen zijbalk ("course" in
 * glas.html §09b): blokken als rijen met een lettertegel, lessen eronder met een rondje.
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
      <a href={`/${locale}${data.backHref}`} className="g-lp-back">
        <ArrowLeft strokeWidth={2.4} className="rtl-flip" aria-hidden />
        <span>{data.backLabel}</span>
      </a>
      <p className="g-lp-title">{data.title}</p>

      <nav className="g-lp-nav">
        {data.sections.map(section => {
          /* De huidige module wint altijd van een dichtgeklapte: de sectie sluiten waar je
             op dit moment in staat verbergt precies waar je bent. Zelfde regel als bij het
             modulemenu in de zijbalk. */
          const isOpen = section.id === currentSection || (open[section.id] ?? false);
          const isCurrent = section.id === currentSection;
          const isDone = typeof section.done === 'number' && typeof section.total === 'number'
            && section.total > 0 && section.done >= section.total;
          const Glyph = section.icon ? ICONS[section.icon] : null;
          return (
            <div key={section.id}>
              {/* Het blok als rij (glas.html §09b "LearnPanel"): letter in een tegeltje, de naam,
                  de telling. Geen letter? Dan het glyph van de module in hetzelfde tegeltje. */}
              <button
                type="button"
                className={`g-blk${isCurrent ? ' g-cur' : ''}${isDone ? ' g-done' : ''}`}
                aria-expanded={isOpen}
                onClick={() => toggle(section.id, !isOpen)}
              >
                <span className="g-blk-L" aria-hidden>
                  {section.letter ?? (Glyph ? <Glyph strokeWidth={2.2} /> : <ChevronRight strokeWidth={2.4} className="rtl-flip" />)}
                </span>
                <span className="g-blk-t">{section.label}</span>
                {typeof section.done === 'number' && typeof section.total === 'number' && (
                  <span className="g-blk-end">{section.done}/{section.total}</span>
                )}
              </button>
              {isOpen && (
                <div className="g-les-list">
                  {section.items.map(item => (
                    <a
                      key={item.href}
                      href={`/${locale}${item.href}`}
                      aria-current={item.current ? 'page' : undefined}
                      className={`g-les${item.done ? ' g-d' : ''}${item.current ? ' g-c' : ''}${item.locked ? ' g-l' : ''}`}
                    >
                      {/* Alleen iets in het rondje als er iets te zeggen is: een leeg rondje naast
                          elke nog niet gedane les leest als een uitgevinkt vakje. */}
                      <span className="g-les-ic" aria-hidden>
                        {item.done
                          ? <Check strokeWidth={3.2} />
                          : item.locked ? <Lock strokeWidth={2.6} /> : null}
                      </span>
                      <span className="g-les-lb">{item.label}</span>
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
