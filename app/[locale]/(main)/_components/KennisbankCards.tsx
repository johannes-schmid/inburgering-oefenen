'use client';

import { useState } from 'react';
import Image from 'next/image';
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
  /** Het heldere pad naar de foto van het artikel, als die er is. Zonder foto valt de tegel terug
      op de kleurcyclus hieronder — dat is geen tweederangsvorm maar de vorm die de hub-tegels
      (zoals KNM) altijd al hadden. */
  image?: string;
  imageAlt?: string;
};

/* ── De bento ──
   Zes tegelmaten die zich per zes herhalen, op een raster van zes kolommen:

     i%6 = 0  →  3 kolommen × 2 rijen   (de grote, met de foto groot in beeld)
     i%6 = 1  →  3 × 1
     i%6 = 2  →  3 × 1                  (die twee vullen samen de rechterhelft naast de grote)
     i%6 = 3..5 → 2 × 1                 (een rij van drie eronder)

   De reeks sluit dus precies op drie rijen per zes kaarten, en `grid-auto-flow: dense` vult de
   gaten die overblijven als de filterpil de rij inkort. De maat hangt aan de plek in de
   *gefilterde* rij, net als de kleur eronder: een gefilterde rij die de oude maten aanhoudt komt
   terug als losse blokken met gaten ertussen, en dat leest als een renderfout. */
const SPANS = [
  'md:col-span-3 md:row-span-2',
  'md:col-span-3',
  'md:col-span-3',
  'md:col-span-2',
  'md:col-span-2',
  'md:col-span-2',
];

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
  /* `dim` is hier dekkend en donkerder dan de andere tonen: op de oranje container haalde
     rgba(95,34,0,0.88) 3,77:1 en dat is onder de 4,5 die WCAG AA vraagt voor deze tekstgrootte. */
  { bg: 'var(--color-secondary-container)', ink: 'var(--color-on-secondary-container)', dim: '#3d1600', veil: 'rgba(255,255,255,0.30)' },
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

      <div
        className="grid grid-cols-1 md:grid-cols-6 gap-4 md:auto-rows-[13rem]"
        style={{ gridAutoFlow: 'dense' }}
      >
        {shown.map((card, i) => {
          /* Tone by position in the *filtered* row, not by the card's index in the full list — a
             filtered row that keeps the original colours comes back as three navy cards in a
             sequence, which reads as a rendering fault rather than as a filter. */
          const tone = TONES[i % TONES.length];
          const span = SPANS[i % SPANS.length];
          const big = i % SPANS.length === 0;
          return (
            <a
              key={card.id}
              href={card.href}
              className={`kb-card group relative overflow-hidden rounded-2xl flex flex-col justify-end no-underline min-h-[13.5rem] md:min-h-0 ${span}`}
              style={card.image
                ? { background: 'var(--color-primary)', color: '#ffffff' }
                : { background: tone.bg, color: tone.ink }}
            >
              {card.image ? (
                <>
                  {/* `alt=""` en niet de bijschrifttekst: de kop eronder staat er al als tekst, dus
                      een schermlezer zou de kaart twee keer voorlezen. `imageAlt` blijft in het
                      type staan voor de plekken waar de foto wél alleen staat. */}
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="kb-photo object-cover"
                  />
                  {/* De sluier is de leesbaarheid, niet een effect: zonder hem staat witte tekst op
                      een willekeurige foto. Navy naar doorzichtig van onder naar boven, dezelfde
                      richting als de gidshero. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,43,109,0.94) 0%, rgba(0,43,109,0.74) 30%, rgba(0,43,109,0.18) 64%, rgba(0,43,109,0) 100%)' }}
                  />
                </>
              ) : (
                <span aria-hidden="true" className="absolute right-[-2.5rem] bottom-[-3.5rem] w-44 h-44 rounded-full" style={{ background: tone.veil }} />
              )}

              <div className="relative z-10 p-5 pb-16">
                <span
                  className="block text-[0.625rem] uppercase tracking-widest font-bold mb-2"
                  style={{ color: card.image ? 'rgba(255,255,255,0.78)' : tone.dim }}
                >
                  {card.group}
                </span>
                <span
                  className={`block font-headline font-extrabold leading-tight mb-2 ${big ? 'text-[1.375rem]' : 'text-[1.0625rem]'}`}
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {card.title}
                </span>
                {/* Alleen de grote tegel krijgt de samenvatting. Op een tegel van één rij hoog
                    duwt hij de kop uit beeld, en dan staat er drie regels lopende tekst waar een
                    titel had moeten staan. */}
                {big && (
                  <span
                    className="block text-[0.8125rem] leading-relaxed line-clamp-3"
                    style={{ color: card.image ? 'rgba(255,255,255,0.82)' : tone.dim }}
                  >
                    {card.desc}
                  </span>
                )}
              </div>

              <span
                aria-hidden="true"
                className="kb-arrow absolute left-5 bottom-5 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                style={card.image
                  ? { background: 'rgba(255,255,255,0.18)', color: '#ffffff' }
                  : { background: tone.veil, color: tone.ink }}
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
