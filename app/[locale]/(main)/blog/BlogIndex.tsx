'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import FilterChip from '@/components/glas/FilterChip';

/**
 * Het blogoverzicht in Glas (glas.html §14 "Overzicht"): filterchips, één uitgelichte post met de
 * titel op glas, een stapel van twee ernaast en daaronder het glazen raster.
 *
 * **Krijgt platte kaartdata, nooit de blogmodule**: een clientcomponent dat `data/blog-posts.ts`
 * importeert, zet elke `articleHtml` in de browserbundel. De pagina stelt de kaarten op de server
 * samen. De chips filteren in place (`aria-pressed`) en veranderen geen URL; met een filter aan valt
 * de uitgelichte compositie weg en staat alles in het raster.
 */
export type BlogCard = {
  key: string;
  /** De slug van deze taal — de route vertaalt alleen het statische deel. */
  slug: string;
  title: string;
  desc: string;
  category: string;
  image: string;
  dateLabel: string;
  readingLabel: string;
};

export default function BlogIndex({ cards, allLabel, authorName }: { cards: BlogCard[]; allLabel: string; authorName: string }) {
  const groups = Array.from(new Set(cards.map(c => c.category)));
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? cards.filter(c => c.category === active) : cards;
  const [feat, ...rest] = shown;
  const composed = !active && cards.length >= 3;
  const stack = composed ? rest.slice(0, 2) : [];
  const grid = composed ? rest.slice(2) : shown;

  const href = (c: BlogCard) => ({ pathname: '/blog/[slug]' as const, params: { slug: c.slug } });

  return (
    <>
      <div className="g-chips mb-5">
        {[null, ...groups].map(group => (
          <FilterChip
            key={group ?? '__all'}
            pressed={active === group}
            onClick={() => setActive(group)}
            className="g-chip-wit"
            count={group ? cards.filter(c => c.category === group).length : cards.length}
          >
            {group ?? allLabel}
          </FilterChip>
        ))}
      </div>

      {composed && feat && (
        <div className="g-posts mb-3.5">
          <Link href={href(feat)} className="g-feat">
            <Image src={feat.image} alt="" fill priority sizes="(max-width: 860px) 100vw, 60vw" className="object-cover" />
            <div className="g-glass g-glass-strong">
              <span className="g-mono">{feat.category} · {feat.dateLabel}</span>
              <h2>{feat.title}</h2>
              <p className="m-0 mt-2 text-[0.9375rem] leading-relaxed text-ink-2 line-clamp-2">{feat.desc}</p>
              <div className="g-byline mt-4">
                <img src="/images/amber-van-der-zalm-264.webp" alt="" width={34} height={34} className="!size-[34px] !rounded-[10px]" />
                <span>
                  <b className="!text-[13.5px]">{authorName}</b>
                  <small>{feat.readingLabel}</small>
                </span>
              </div>
            </div>
          </Link>
          <div className="g-post-stack">
            {stack.map(c => (
              <Link key={c.key} href={href(c)} className="g-post">
                <div className="g-post-th">
                  <Image src={c.image} alt="" fill sizes="140px" className="object-cover" />
                </div>
                <div className="g-post-tx">
                  <span className="g-mono">{c.category}</span>
                  <h3>{c.title}</h3>
                  <span className="g-blog-meta">{c.dateLabel} · {c.readingLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {grid.length > 0 && (
        <div className="g-gcards">
          {grid.map(c => (
            <Link key={c.key} href={href(c)} className="g-gcard">
              <Image src={c.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw" className="object-cover" />
              <div className="g-glass">
                <span className="g-mono">{c.category}</span>
                <h3>{c.title}</h3>
                <div className="g-gcard-ft">
                  <span>{c.dateLabel}</span>
                  <span>{c.readingLabel}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
