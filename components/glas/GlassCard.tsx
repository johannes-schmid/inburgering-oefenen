import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Het glasmateriaal (G2, glas.html §04): 72% wit, blur 24 + verzadiging 1.5, een witte bovenrand van
 * 1px en een getinte zweefschaduw. Terugval zonder backdrop-filter: 92% wit.
 *
 * **Glas heeft altijd iets nodig om op te liggen** — een `Field` of een foto. Op mist of wit is het
 * een grijze kaart; gebruik daar een witte kaart (`bg-wit rounded-g-lg`). **Nooit glas op glas.**
 *
 * - `tone="dark"` — donker glas (8% wit) op Nacht of op een foto.
 * - `strong` — 86% wit, regel 06: tekst op het drukke deel van een veld.
 */
type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  tone?: 'light' | 'dark';
  strong?: boolean;
};

export default function GlassCard({ as: Tag = 'div', tone = 'light', strong = false, className, ...rest }: Props) {
  return (
    <Tag
      className={cn(tone === 'dark' ? 'g-glass-d' : 'g-glass', strong && tone !== 'dark' && 'g-glass-strong', className)}
      {...rest}
    />
  );
}
