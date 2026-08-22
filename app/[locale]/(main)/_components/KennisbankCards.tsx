'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * The homepage's kennisbank row — colour cards with filter pills, to the owner's mockup §4a
 * (2026-08-22).
 *
 * **This component never imports the guide registry or the blog module, and that is the reason it
 * takes a prop instead.** `Nav.tsx` has the same rule written on it: a client component that
 * enumerates guides ships every `articleHtml` string into the browser bundle — roughly 90 kB of
 * prose per guide, for four card titles. The page assembles `{ label, title, desc, href }` on the
 * server and hands over exactly that.
 *
 * The pills are `role="tablist"`-free on purpose: they filter a grid in place rather than switching
 * panels, so they are plain buttons with `aria-pressed`. Filtering changes no URL — six near-empty
 * indexable variants of the homepage is not a trade worth making for a client-side filter.
 *
 * The **group set is derived from the cards**, so a pill can never be empty. When the first KNM or
 * Taalexamens guide is written its pill starts working with no change here.
 */

export type KennisbankCard = {
  /** Stable key — a guide slug, a post slug, or a hub path. */
  id: string;
  /** The section this card belongs to: also the eyebrow, and the pill it answers to. */
  group: string;
  title: string;
  desc: string;
  href: string;
};

/* Navy → orange → mid-navy → peach, cycled by index. Two of the four are tints of
   `secondary_container`; none is a hue outside `@theme` (§7.3 forbids a new one). `ink` is the
   text colour the tile needs, and `veil` is the decorative disc — always the tile's own hue
   lightened, so it reads as texture rather than as a second sun. */
const TONES = [
  { bg: 'var(--color-primary)', ink: '#ffffff', dim: 'rgba(255,255,255,0.72)', veil: 'rgba(255,255,255,0.10)' },
  /* Dark ink on the orange tile, not white. The mockup draws it white, and white on `#fe762c` is
     about 2.2:1 — below AA for body text *and* below the 3:1 large-text floor, so the card that
     shouts loudest would be the one nobody can read. `on_secondary_container` on the same orange
     is ~5:1 and is the pairing `@theme` names for exactly this. */
  { bg: 'var(--color-secondary-container)', ink: 'var(--color-on-secondary-container)', dim: 'rgba(95,34,0,0.88)', veil: 'rgba(255,255,255,0.30)' },
  { bg: 'var(--color-primary-container)', ink: '#ffffff', dim: 'rgba(255,255,255,0.75)', veil: 'rgba(255,255,255,0.12)' },
  { bg: 'rgba(254,118,44,0.32)', ink: 'var(--color-primary)', dim: 'var(--color-on-secondary-container)', veil: 'rgba(255,255,255,0.34)' },
];

export default function KennisbankCards({ cards, allLabel }: { cards: KennisbankCard[]; allLabel: string }) {
  const groups = Array.from(new Set(cards.map(c => c.group)));
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? cards.filter(c => c.group === active) : cards;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {[null, ...groups].map(group => {
          const on = active === group;
          return (
            <button
              key={group ?? '__all'}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(group)}
              className="kb-pill rounded-full px-4 py-2 text-sm font-semibold"
              style={on
                ? { background: 'var(--color-primary)', color: '#fff' }
                : { background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface-variant)' }}
            >
              {group ?? allLabel}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {shown.map((card, i) => {
          /* Tone by position in the *filtered* row, not by the card's index in the full list — a
             filtered row that keeps the original colours comes back as three navy cards in a
             sequence, which reads as a rendering fault rather than as a filter. */
          const tone = TONES[i % TONES.length];
          return (
            <a
              key={card.id}
              href={card.href}
              className="kb-card relative overflow-hidden rounded-2xl p-5 pb-16 flex flex-col no-underline min-h-[13.5rem]"
              style={{ background: tone.bg, color: tone.ink }}
            >
              <span aria-hidden="true" className="absolute right-[-2.5rem] bottom-[-3.5rem] w-44 h-44 rounded-full" style={{ background: tone.veil }} />

              <span className="relative z-10 text-[0.625rem] uppercase tracking-widest font-bold mb-2" style={{ color: tone.dim }}>
                {card.group}
              </span>
              <span
                className="relative z-10 font-headline font-extrabold text-[1.125rem] leading-tight mb-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                {card.title}
              </span>
              <span className="relative z-10 text-[0.8125rem] leading-relaxed line-clamp-3" style={{ color: tone.dim }}>
                {card.desc}
              </span>

              <span
                aria-hidden="true"
                className="kb-arrow absolute left-5 bottom-5 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: tone.veil, color: tone.ink }}
              >
                <ArrowRight size={16} className="rtl-flip" />
              </span>
            </a>
          );
        })}
      </div>
    </>
  );
}
