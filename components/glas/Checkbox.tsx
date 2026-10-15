import type { ButtonHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Selectievakje (glas.html §06): 24px, radius 8, navy met wit vinkje wanneer aan. Gecontroleerd.
 * Voor een echt formulierveld dat mee moet posten: zet er een verborgen `<input>` naast.
 */
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'role'> & { checked: boolean };

export default function GlasCheckbox({ checked, className, type = 'button', ...rest }: Props) {
  return (
    <button type={type} role="checkbox" aria-checked={checked} className={cn('g-check', className)} {...rest}>
      <Check strokeWidth={3} aria-hidden="true" />
    </button>
  );
}
