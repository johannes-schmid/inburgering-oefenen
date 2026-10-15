import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';

/**
 * Filterchip (§G5, glas.html §06 "Tab en filter"): het categoriemerk van het onderdeel zit in de
 * chip. Gekozen = witte vulling met een navy ring, géén volle navy pill — navy blijft voor de ene
 * knop die iets doet. Zonder `category` wordt het de platte chip ("Alles 40").
 *
 * `aria-pressed` draagt de staat; zet de chips in een `<div className="g-chips">` of eigen flex-rij.
 */
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed: boolean;
  category?: Category;
  count?: ReactNode;
};

export default function FilterChip({ pressed, category, count, className, children, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn('g-chip', !category && 'g-chip-plain', className)}
      {...rest}
    >
      {category && <CategoryMark category={category} size={28} />}
      {children}
      {count !== undefined && <em className="g-chip-cnt">{count}</em>}
    </button>
  );
}
