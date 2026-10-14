import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Glas-knoppen (§G5, glas.html §06): alles is een pill, elke knop heeft hover, focus-visible en een
 * druk naar `scale(.97)`.
 *
 * - `navy` — de primaire actie op licht.
 * - `oranje` — de ene wijzer per view. Nooit twee in beeld, en niet naast een veld met gloed.
 * - `ghost` — secundair op licht of op een veld.
 * - `wit` — primair op donker (Nacht, navy kaart).
 * - `glasd` — secundair op donker.
 *
 * Voor een link: `className={glasButton({ variant: 'navy' })}` op `Link`. Een vooruitwijzende pijl
 * krijgt `.rtl-flip`.
 */
export type GlasButtonVariant = 'navy' | 'oranje' | 'ghost' | 'wit' | 'glasd';
export type GlasButtonSize = 'sm' | 'md' | 'lg';

export function glasButton({
  variant = 'navy',
  size = 'md',
  icon = false,
  className,
}: { variant?: GlasButtonVariant; size?: GlasButtonSize; icon?: boolean; className?: string } = {}) {
  return cn('g-btn', `g-btn-${variant}`, size !== 'md' && `g-btn-${size}`, icon && 'g-btn-icon', className);
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GlasButtonVariant;
  size?: GlasButtonSize;
  /** Vierkante icoonknop; geef dan altijd een `aria-label`. */
  icon?: boolean;
};

export default function GlasButton({ variant, size, icon, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={glasButton({ variant, size, icon, className })} {...rest} />;
}
