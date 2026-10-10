'use client';

import { useState } from 'react';
import { Check, ChevronDown, Lock } from 'lucide-react';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';

export type SideItem = {
  key: string;
  /** "B3", of `null` voor een les uit de extra reeks. */
  code: string | null;
  label: string;
  href: string;
  done: boolean;
  now: boolean;
  locked: boolean;
};

export type SideBlock = {
  letter: string;
  name: string;
  done: number;
  total: number;
  complete: boolean;
  href: string | null;
  /** Het blok waar deze pagina in staat: uitgeklapt, met zijn onderwerpen eronder. */
  open: boolean;
  items: SideItem[];
  extras: { title: string; items: SideItem[] } | null;
};

/**
 * De zijkaart van een grammaticaonderwerp: de cursus in vijf rijen, met het huidige blok open.
 *
 * In de pagina en niet in de chrome (`LearnPanel`): de opzet van de eigenaar zet hem als kaart
 * náást de les, met de cursusvoortgang erbovenop, en op een telefoon moet hij boven de les
 * kunnen staan. `LearnPanel` verdwijnt onder 768px helemaal. Op een telefoon is alleen de
 * voortgangskaart zichtbaar en klappen de blokken achter één knop open — de les is waar je
 * voor kwam, niet de inhoudsopgave.
 *
 * Het huidige onderwerp krijgt de oranje markering en "nu"; een afgerond blok een navy
 * vinkje. Geen derde statuskleur (§8).
 */
export default function GrammarCourseSide({
  category, courseLabel, pct, line, blocks, labels,
}: {
  category: Category;
  courseLabel: string;
  pct: number;
  line: string;
  blocks: SideBlock[];
  labels: { blocksAria: string; nowChip: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="gt-side" aria-label={labels.blocksAria}>
      <div className="gt-course">
        <div className="gt-course-top">
          <CategoryMark category={category} size={34} />
          <b className="gt-course-name">{courseLabel}</b>
          <span className="gt-course-pct">{pct}%</span>
        </div>
        <span className="gt-rail" aria-hidden><i style={{ transform: `scaleX(${pct / 100})` }} /></span>
        <p className="gt-course-line">{line}</p>
        <button
          type="button"
          className="gt-side-toggle"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {labels.blocksAria}
          <ChevronDown size={15} strokeWidth={2.6} aria-hidden />
        </button>
      </div>

      <nav className={`gt-blocks${open ? ' is-open' : ''}`}>
        <ol>
          {blocks.map(b => {
            const head = (
              <>
                <span className={`gt-letter${b.complete ? ' is-done' : ''}`} aria-hidden>
                  {b.complete ? <Check size={13} strokeWidth={3.2} /> : b.letter}
                </span>
                <span className="gt-bname">
                  <span className="sr-only">{b.letter} · </span>
                  {b.name}
                </span>
                <span className="gt-bcount">{b.done}/{b.total}</span>
              </>
            );
            return (
              <li key={b.letter} className={`gt-block${b.open ? ' is-open' : ''}`}>
                {b.href && !b.open
                  ? <a href={b.href} className="gt-brow">{head}</a>
                  : <div className="gt-brow">{head}</div>}
                {b.open && (
                  <ul className="gt-items">
                    {b.items.map(it => <SideRow key={it.key} item={it} nowChip={labels.nowChip} />)}
                    {b.extras && b.extras.items.length > 0 && (
                      <>
                        <li className="gt-extras-head">{b.extras.title}</li>
                        {b.extras.items.map(it => <SideRow key={it.key} item={it} nowChip={labels.nowChip} />)}
                      </>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}

function SideRow({ item, nowChip }: { item: SideItem; nowChip: string }) {
  return (
    <li>
      <a
        href={item.href}
        className={`gt-item${item.now ? ' is-now' : ''}${item.locked ? ' is-locked' : ''}`}
        aria-current={item.now ? 'page' : undefined}
      >
        <span className="gt-imark" aria-hidden>
          {item.done
            ? <Check size={11} strokeWidth={3.2} />
            : item.locked ? <Lock size={10} strokeWidth={2.6} /> : null}
        </span>
        <span className="gt-ilabel">
          {item.code && <span className="gt-icode">{item.code} · </span>}
          {item.label}
        </span>
        {item.now && <span className="gt-now">{nowChip}</span>}
      </a>
    </li>
  );
}
