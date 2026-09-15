'use client';

import { ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import LocaleFlag from '@/components/site/LocaleFlag';

/**
 * Flags, drawn as SVG rather than typed as emoji (owner's decision, 2026-08-28).
 *
 * This reverses the 2026-08-20 removal, which took the flags out because they were the last emoji
 * in the site chrome and the project forbids emoji anywhere in the UI. That rule is intact: emoji
 * render per-platform, are absent entirely on Windows, and cannot be colour-matched — inline SVG
 * has none of those problems. See `components/site/LocaleFlag.tsx`.
 *
 * A native `<select>` cannot hold an SVG, which is why the desktop control is a dropdown menu and
 * the mobile one is a list of buttons rather than the two selects that used to be here.
 */
export const LOCALES = [
  { code: 'nl', labelShort: 'NL', labelLong: 'Nederlands' },
  { code: 'en', labelShort: 'EN', labelLong: 'English' },
  { code: 'ar', labelShort: 'AR', labelLong: 'العربية' },
] as const;

export const LANGUAGE_TRIGGER_CLASS =
  'hidden menu:flex items-center gap-1.5 text-[0.8125rem] font-medium text-on-surface-variant bg-transparent rounded-lg pl-2 pr-1.5 py-1.5 cursor-pointer hover:text-primary hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30';

/** De inhoud van de taalknop: vlag, korte code, pijltje. Eén bron voor de statische knop én de menutrigger. */
export function LanguageTriggerLabel({ locale }: { locale: string }) {
  return (
    <>
      <LocaleFlag locale={locale} />
      {LOCALES.find((l) => l.code === locale)?.labelShort}
      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
    </>
  );
}

/**
 * De statische taalknop, zoals hij in de HTML staat vóór het menu geladen is.
 *
 * Het echte menu (`LanguageMenu`) hangt aan `@base-ui/react/menu` — 55 KB brotli aan floating-
 * UI-code, die op elke publieke pagina vóór de LCP binnenkwam voor een knop die bijna niemand
 * aanraakt. Daarom laadt `Nav` het menu pas bij hover, focus of klik en staat tot die tijd deze
 * knop op dezelfde plek, met dezelfde klassen. Hij is óók de `loading`-fallback van de dynamic
 * import, zodat er tussen "gewild" en "geladen" niets verspringt.
 */
export function LanguageTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const locale = useLocale();
  const t = useTranslations('nav');
  return (
    <button type="button" aria-label={t('langLabel')} aria-haspopup="menu" aria-expanded={false} className={LANGUAGE_TRIGGER_CLASS} {...props}>
      <LanguageTriggerLabel locale={locale} />
    </button>
  );
}
