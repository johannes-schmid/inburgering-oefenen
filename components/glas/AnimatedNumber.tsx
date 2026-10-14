'use client';

import NumberFlow, { type Format } from '@number-flow/react';

/**
 * Een getal dat naar zijn plek rolt (G6: NumberFlow voor getallen) — scores, dagen tot je examen,
 * de prijs in de pakketkiezer. Volgt `prefers-reduced-motion` vanzelf (dan springt het).
 *
 * Geef `locales` door (de next-intl-locale), zodat `€29,95` en `٢٩٫٩٥` kloppen. Tabelcijfers staan aan.
 */
type Props = {
  value: number;
  locales?: string;
  format?: Format;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export default function AnimatedNumber({ value, locales, format, prefix, suffix, className }: Props) {
  return (
    <NumberFlow
      value={value}
      locales={locales}
      format={format}
      prefix={prefix}
      suffix={suffix}
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      transformTiming={{ duration: 900, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
      spinTiming={{ duration: 900, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
    />
  );
}
