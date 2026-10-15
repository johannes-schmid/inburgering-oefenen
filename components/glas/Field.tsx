import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Een kleurveld (G2, glas.html §01/§04): het "foto"-materiaal van Glas, een geblurde gradient met
 * korrel. **Eén veld met gloed per view** — `dageraad` en `nacht` dragen de oranje gloed, de rest niet.
 *
 * | variant | gebruik |
 * |---|---|
 * | `dageraad` | met gloed — hero, één per pagina |
 * | `gracht` | koel — platform, onderdeelpagina's, kaartkoppen |
 * | `nevel` | bijna wit — blog, gidsen, achter lange tekst |
 * | `nacht` | donker met gloed — prijsband, vandaag-kaart |
 * | `nacht-stil` | donker zonder oranje — naast een oranje knop |
 * | `licht` | portaalachtergronden, de footer |
 * | `hero` | gloed rechts, tekst links blijft leesbaar (glas.html `.f-hero`) |
 *
 * **Regel 06 gaat boven sfeer:** staat er tekst op een veld, zet `veil` aan (een mistlaag die vanaf
 * de tekstkant vervaagt; `veil="up"` vervaagt van onder) of leg een `GlassCard strong` onder de tekst.
 * De tweede kopregel op een veld is `ink-2`, niet `ink-3` (zet `g-on-field` of gebruik
 * `SectionHeading onField`). `nacht`/`nacht-stil` zetten de tekstkleur op wit.
 */
export type FieldVariant = 'dageraad' | 'gracht' | 'nevel' | 'nacht' | 'nacht-stil' | 'licht' | 'hero';

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant: FieldVariant;
  veil?: boolean | 'side' | 'up';
};

export default function Field({ as: Tag = 'div', variant, veil = false, className, children, ...rest }: Props) {
  const dark = variant === 'nacht' || variant === 'nacht-stil';
  return (
    <Tag className={cn('g-field', `g-f-${variant}`, dark ? 'g-on-dark' : 'g-on-field', className)} {...rest}>
      {veil && !dark && <i aria-hidden="true" className={cn('g-veil', veil === 'up' && 'g-veil-up')} />}
      {children}
    </Tag>
  );
}
