import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Field, { type FieldVariant } from './Field';

/**
 * De paginakop van een Glas-oppervlak: een `Field` over de volle breedte met de inhoud in de
 * 1240px-wrap (16px gutter op mobiel). Hij vervangt `HorizonHero` / `GradientHero` / `HorizonBanner`
 * op een herbouwd scherm — die drie horen bij The Civic Authority en mengen niet met Glas.
 *
 * Standaard `gracht` met sluier, omdat er altijd tekst op staat (regel 06). `dageraad` alleen voor de
 * ene hero met gloed per pagina. `as="header"` voor de bovenste kop van een pagina.
 */
type Props = {
  variant?: FieldVariant;
  veil?: boolean | 'side' | 'up';
  as?: 'header' | 'section' | 'div';
  className?: string;
  /** Klassen op de binnenste wrap (max-breedte + gutter). */
  innerClassName?: string;
  children: ReactNode;
};

export default function PageField({
  variant = 'gracht',
  veil = true,
  as = 'header',
  className,
  innerClassName,
  children,
}: Props) {
  return (
    <Field as={as} variant={variant} veil={veil} className={cn('g-pagefield', className)}>
      <div className={cn('g-wrap', innerClassName)}>{children}</div>
    </Field>
  );
}
