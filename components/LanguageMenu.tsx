'use client';

import { Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LocaleFlag from '@/components/site/LocaleFlag';
import { LANGUAGE_TRIGGER_CLASS, LOCALES, LanguageTriggerLabel } from './LanguageTrigger';

type Props = {
  locale: string;
  label: string;
  onChange: (locale: string) => void;
  /** Waar als de bezoeker al geklikt had voordat het menu geladen was: dan gaat het meteen open. */
  defaultOpen?: boolean;
};

/**
 * Het taalmenu van de header. Wordt door `Nav` dynamisch geladen — zie `LanguageTrigger` voor
 * het waarom. Alles wat hier staat, stond tot 15-09 inline in `Nav.tsx`.
 */
export default function LanguageMenu({ locale, label, onChange, defaultOpen = false }: Props) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger aria-label={label} className={LANGUAGE_TRIGGER_CLASS}>
        <LanguageTriggerLabel locale={locale} />
      </DropdownMenuTrigger>
      {/* `w-auto` overrides the primitive's default of matching the trigger's width — the
          trigger is two characters wide and the language names are not. */}
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => onChange(l.code)}
            className="gap-2.5 px-2 py-1.5 cursor-pointer"
          >
            <LocaleFlag locale={l.code} />
            <span className="flex-1">{l.labelLong}</span>
            {l.code === locale && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
