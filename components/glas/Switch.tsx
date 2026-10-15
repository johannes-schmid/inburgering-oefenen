import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Schakelaar (glas.html §06): 50×30, navy wanneer aan, de knop schuift met de veer (260ms).
 * Gecontroleerd: geef `checked` en een `onClick` die hem omzet. Altijd een toegankelijke naam via
 * `aria-label` of `aria-labelledby`.
 */
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'role'> & { checked: boolean };

export default function GlasSwitch({ checked, className, type = 'button', ...rest }: Props) {
  return <button type={type} role="switch" aria-checked={checked} className={cn('g-switch', className)} {...rest} />;
}
