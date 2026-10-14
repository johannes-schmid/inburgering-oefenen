'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import FilterChip from '@/components/glas/FilterChip';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';

/**
 * De kennisbankrij van de homepage: filterchips en het **glazen raster** van glas.html §14 — een
 * foto met de titel op een glazen bijschrift. Een tegel zonder foto (een hub, zoals KNM) wordt een
 * gidskaart met categoriemerk: gidsen dragen een merk, geen verzonnen beeld.
 *
 * **Dit component importeert nooit het gidsregister of de blogmodule.** Een clientcomponent dat
 * gidsen opsomt, zet elke `articleHtml` in de browserbundel. De pagina stelt
 * `{ group, title, desc, href }` op de server samen en geeft precies dat door.
 *
 * De chips filteren in place (`aria-pressed`, geen tablist) en veranderen geen URL. De groepen
 * worden uit de kaarten afgeleid, dus een chip is nooit leeg.
 */

export type KennisbankCard = {
  /** Stable key — a guide slug, a post slug, or a hub path. */
  id: string;
  /** The section this card belongs to: also the label, and the chip it answers to. */
  group: string;
  title: string;
  desc: string;
  href: string;
  /** Het heldere pad naar de foto van het artikel, als die er is. */
  image?: string;
  imageAlt?: string;
  /** Het merk op een tegel zonder foto. */
  category?: Category;
};

export default function KennisbankCards({ cards, allLabel }: { cards: KennisbankCard[]; allLabel: string }) {
  const groups = Array.from(new Set(cards.map(c => c.group)));
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? cards.filter(c => c.group === active) : cards;

  return (
    <>
      <div className="g-chips mb-5">
        {[null, ...groups].map(group => (
          <FilterChip
            key={group ?? '__all'}
            pressed={active === group}
            onClick={() => setActive(group)}
            className="g-chip-wit"
            count={group ? cards.filter(c => c.group === group).length : cards.length}
          >
            {group ?? allLabel}
          </FilterChip>
        ))}
      </div>

      <div className="g-gcards">
        {shown.map(card =>
          card.image ? (
            <a key={card.id} href={card.href} className="g-gcard">
              {/* `alt=""`: de titel staat er al als tekst, anders leest een schermlezer hem twee keer. */}
              <Image src={card.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw" className="object-cover" />
              <div className="g-glass">
                <span className="g-mono">{card.group}</span>
                <h3>{card.title}</h3>
                <p className="m-0 mt-1.5 text-[0.8125rem] leading-relaxed text-ink-2 line-clamp-2">{card.desc}</p>
              </div>
            </a>
          ) : (
            <a key={card.id} href={card.href} className="g-gids">
              <CategoryMark category={card.category ?? 'gidsen'} size={48} />
              <span className="g-mono">{card.group}</span>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <span className="g-gids-ft" aria-hidden="true">
                <span />
                <ArrowRight className="rtl-flip" />
              </span>
            </a>
          ),
        )}
      </div>
    </>
  );
}
