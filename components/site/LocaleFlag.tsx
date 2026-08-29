'use client';

import { useId } from 'react';

/**
 * The three language flags used by the switcher in `components/Nav.tsx`.
 *
 * **Flags, but not emoji** (owner's decision, 2026-08-28, reversing the 2026-08-20 removal). The
 * project rule is that no emoji appear in the UI — they render per-platform and cannot be
 * colour-matched — and flag emoji are also simply absent on Windows. These are flat inline SVG in
 * the flags' own official colours, which is the only way to draw them once and have them look the
 * same everywhere.
 *
 * They live in `components/site/` and deliberately **not** in `components/horizon/`: a national
 * flag is a real-world symbol with fixed colours, not part of the Dutch Horizon graphic language,
 * and it must not inherit that folder's palette.
 *
 * Two things not to change:
 * - **They never mirror.** No `.rtl-flip` — a mirrored Union Jack is a different flag.
 * - **They are `aria-hidden`.** The language's own name beside them carries the meaning.
 */

type Props = { locale: string; className?: string };

const BOX = 'block shrink-0 rounded-[2px] ring-1 ring-black/10';

export default function LocaleFlag({ locale, className }: Props) {
  /* The Union Jack needs a clipPath, and this component renders more than once per page (the
     desktop menu and the mobile drawer), so the id has to be unique per instance. */
  const uid = useId();
  const size = { width: 21, height: 14 };
  const cls = `${BOX} ${className ?? ''}`.trim();

  if (locale === 'nl') {
    return (
      <svg {...size} viewBox="0 0 9 6" className={cls} aria-hidden focusable="false">
        <rect width="9" height="6" fill="#21468B" />
        <rect width="9" height="4" fill="#FFFFFF" />
        <rect width="9" height="2" fill="#AE1C28" />
      </svg>
    );
  }

  if (locale === 'en') {
    const clip = `jack-${uid}`;
    return (
      <svg {...size} viewBox="0 0 60 30" className={cls} aria-hidden focusable="false">
        <clipPath id={clip}>
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${clip})`} stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </svg>
    );
  }

  /* Saudi Arabia, simplified: the shahada is Arabic script and cannot be drawn as geometry at
     21px without rendering it badly, so it is a band of blocks over the sword — the same
     simplification every icon set at this size makes. */
  return (
    <svg {...size} viewBox="0 0 24 16" className={cls} aria-hidden focusable="false">
      <rect width="24" height="16" fill="#006C35" />
      <g fill="#FFFFFF">
        <rect x="5" y="4.6" width="2.6" height="1.6" rx="0.4" />
        <rect x="8.4" y="4.6" width="4.2" height="1.6" rx="0.4" />
        <rect x="13.4" y="4.6" width="1.8" height="1.6" rx="0.4" />
        <rect x="16" y="4.6" width="3" height="1.6" rx="0.4" />
        <rect x="4.6" y="9.4" width="13.4" height="1.2" rx="0.6" />
        <path d="M18 9.1 l2.6 0.9 -2.6 0.9 z" />
      </g>
    </svg>
  );
}
