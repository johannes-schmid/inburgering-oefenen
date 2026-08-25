import { BookOpen, Headphones, Landmark, PenLine, Mic, type LucideIcon } from 'lucide-react';
import type { OnderdeelSlug } from '@/data/skills';

/**
 * One lucide icon per exam component, so Lezen/Luisteren/Schrijven/Spreken read the same
 * everywhere they appear (nav, cards, page headers). Replaces the emoji we started with —
 * emoji render differently per platform and cannot be colour-matched to the brand.
 */
export const SKILL_ICONS: Record<OnderdeelSlug, LucideIcon> = {
  lezen: BookOpen,
  luisteren: Headphones,
  schrijven: PenLine,
  spreken: Mic,
  // KNM's affordance is a lucide glyph like the other four, *not* `CategoryMark`. This
  // component is the control layer — nav rows, picker rows, admin tables — and a category
  // mark there would be brand imagery standing in for a button. `Landmark` for the same
  // reason the mark is a colonnade: KNM is the onderdeel about how the Dutch state works.
  knm: Landmark,
};

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { box: number; icon: number; radius: number }> = {
  sm: { box: 32, icon: 16, radius: 9 },
  md: { box: 44, icon: 20, radius: 12 },
  lg: { box: 52, icon: 24, radius: 14 },
};

type Props = {
  skill: OnderdeelSlug;
  size?: Size;
  /** `tile` draws the brand-tinted rounded square; `bare` renders the glyph only. */
  variant?: 'tile' | 'bare';
  /** Use on dark surfaces (page headers, nav on navy). */
  onDark?: boolean;
  className?: string;
};

export default function SkillIcon({ skill, size = 'md', variant = 'tile', onDark = false, className }: Props) {
  const Icon = SKILL_ICONS[skill];
  const { box, icon, radius } = SIZES[size];

  if (variant === 'bare') {
    return (
      <Icon
        size={icon}
        strokeWidth={1.9}
        aria-hidden="true"
        className={className}
        style={{ color: onDark ? 'rgba(255,255,255,0.92)' : 'var(--color-primary)' }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center flex-shrink-0 ${className ?? ''}`}
      style={{
        width: box,
        height: box,
        borderRadius: radius,
        background: onDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,43,109,0.06)',
        color: onDark ? '#ffffff' : 'var(--color-primary)',
      }}
    >
      <Icon size={icon} strokeWidth={1.9} />
    </span>
  );
}
