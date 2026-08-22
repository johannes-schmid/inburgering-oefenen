'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import LogoMark from '@/components/site/LogoMark';

/**
 * No flag emoji, for two reasons that happen to agree.
 *
 * The project rule is lucide icons and no emoji anywhere in the UI — emoji render per-platform and
 * cannot be brand-matched — and `tests/public.spec.js` carried a `test.fixme` recording that this
 * select was the one place breaking it. Flags-for-languages is also its own bug: a Union Jack is
 * not "English" for most of the people reading this site, and an Arabic speaker is not Saudi.
 */
const LOCALES = [
  { code: 'nl', labelShort: 'NL', labelLong: 'Nederlands' },
  { code: 'en', labelShort: 'EN', labelLong: 'English' },
  { code: 'ar', labelShort: 'AR', labelLong: 'العربية' },
] as const;

/**
 * The header: **four plain links — Platform · Gidsen · Prijzen · Over ons** (owner's decision,
 * 2026-08-22, over the two mega-panels of the same day, which were over the five content-shaped
 * items of 2026-08-21).
 *
 * **A dropdown is a landing page you refused to build.** The panels held about twenty
 * destinations and duplicated, in a hover state on every page, the work `/platform` and `/gidsen`
 * now do properly — with room for the copy, the benefits and the roadmap that a dropdown row
 * cannot carry. A site with fifteen destinations does not need a mega-menu; it needs four good
 * pages.
 *
 * **The cost is real and is paid on those two pages.** A header dropdown is a site-wide internal
 * link to everything inside it, and four links are not. So `/platform` must list the four
 * onderdelen, the taster, the tools and the money page, and `/gidsen` must list every published
 * guide and the three hubs. If something is added to the platform and appears in neither, it has
 * no route in from the chrome at all — that is the rule those two pages exist to keep.
 *
 * `Nav` deliberately imports no content module: it is a client component, and pulling in the
 * guide registry would ship every `articleHtml` string into the browser bundle.
 */
const LINKS = [
  { href: '/platform', label: 'sec_platform' },
  { href: '/gidsen', label: 'sec_gidsen' },
  { href: '/premium', label: 'prijzen' },
  { href: '/docent', label: 'sec_over' },
] as const;

export default function Nav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLangChange(newLocale: string) {
    /* `usePathname()` returns the *template* for a dynamic route — '/blog/[slug]', not
     * '/blog/mijn-slug'. `router.replace('/blog/[slug]')` with no `params` resolves to nothing, so
     * switching language did nothing at all on every dynamic page until this was fixed on
     * 2026-08-19. The typed router wants `{ pathname, params }` for a template, and `useParams()`
     * is where the concrete values are.
     *
     * Slugs are deliberately identical across locales (see `data/guides/types.ts`): with a
     * per-locale slug, `params` from the current locale would be substituted into another
     * locale's route and 404. */
    const target = pathname.includes('[')
      ? ({ pathname, params } as unknown as Parameters<typeof router.replace>[0])
      : (pathname as Parameters<typeof router.replace>[0]);
    router.replace(target, { locale: newLocale });
    setMobileOpen(false);
  }

  return (
    <header
      /* Light (owner's decision, 2026-08-22, over the navy bar of the same day). The homepage hero
         is light with the page-wide dot grid, and there the navy bar was a stack of two headers;
         on `surface` with a ghost border the bar and the grid are one field. The 1px edge stays,
         and stays 1px, because `--nav-h` includes it and the row is sized
         `calc(var(--nav-h) - 1px)` — removing it puts a stripe of page background under the bar. */
      className="fixed top-0 w-full z-50"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--ghost-border)',
      }}
      aria-label={t('ariaMain')}
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-[calc(var(--nav-h)_-_1px)]">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <LogoMark size={32} surface="light" className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-sm sm:text-xl font-extrabold tracking-tight text-primary font-headline whitespace-nowrap">
            Inburgering Oefenen
          </span>
        </Link>

        {/* `menu:` (1152px, defined in globals.css) not `md:` — measured, not guessed, back when
            the bar carried five items and a 386px right-hand cluster. Four short links need far
            less, so there is slack now; the breakpoint stays because what actually crowds a laptop
            is the logo plus the CTA, and that has not changed.
            **Re-measure before adding a fifth item or lengthening the CTA.** */}
        <nav className="hidden menu:flex items-center gap-7 text-[0.9375rem] font-medium" aria-label={t('ariaDesktop')}>
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-on-surface hover:text-primary transition-colors no-underline whitespace-nowrap"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        {/* Right: language, login, CTA, hamburger. One filled weight only — the CTA. */}
        <div className="flex items-center gap-3 shrink-0">
          <select
            aria-label={t('langLabel')}
            value={locale}
            onChange={(e) => handleLangChange(e.target.value)}
            className="hidden menu:block text-[0.8125rem] font-medium text-on-surface-variant bg-transparent border-0 rounded-lg pl-2 pr-1 py-1.5 cursor-pointer hover:text-primary hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {LOCALES.map((l) => (
              /* The popup is drawn by the OS and does not inherit the bar, so the option text is
                 set back to the page's ink explicitly. */
              <option key={l.code} value={l.code} style={{ color: '#191c1e' }}>{l.labelShort}</option>
            ))}
          </select>

          <Link
            href="/login"
            className="hidden menu:block text-on-surface hover:text-primary font-medium text-[0.9375rem] transition-colors no-underline whitespace-nowrap"
          >
            {t('login')}
          </Link>

          <a
            href={`/${locale}/oefenen`}
            className="inline-flex items-center gap-1.5 bg-secondary-container px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold text-sm button-inner-glow hover:-translate-y-px transition-transform active:scale-95 no-underline whitespace-nowrap"
            style={{ color: '#ffffff' }}
          >
            <span className="sm:hidden">{t('startMobile')}</span>
            <span className="hidden sm:inline">{t('startDesktop')}</span>
          </a>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="menu:hidden flex flex-col justify-center items-center w-10 h-10 -mr-1 rounded-xl hover:bg-surface-container transition-colors"
            aria-label={mobileOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={mobileOpen}
          >
            <span className="w-5 h-[2px] bg-primary rounded-full block" />
            <span className="w-5 h-[2px] bg-primary rounded-full block my-[5px]" />
            <span className="w-5 h-[2px] bg-primary rounded-full block" />
          </button>
        </div>
      </div>

      {/* Mobile — the same four links, with no accordion left to open. The orange CTA sits at the
          bottom where the thumb is. */}
      {mobileOpen && (
        <div
          className="menu:hidden border-t border-outline-variant/25 max-h-[calc(100dvh-4.5rem)] overflow-y-auto"
          style={{ background: '#f8f9fb' }}
          aria-label={t('ariaMobile')}
        >
          <nav className="flex flex-col px-4 py-2">
            {LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-outline-variant/20 px-3 py-3.5 text-base font-semibold text-on-surface no-underline"
              >
                {t(link.label)}
              </Link>
            ))}

            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="border-b border-outline-variant/20 px-3 py-3.5 text-base font-semibold text-primary no-underline"
            >
              {t('login')}
            </Link>

            <a
              href={`/${locale}/oefenen`}
              onClick={() => setMobileOpen(false)}
              className="mt-3 mb-1 block text-center bg-secondary-container px-4 py-3 rounded-full font-bold text-sm button-inner-glow no-underline"
              style={{ color: '#ffffff' }}
            >
              {t('startDesktop')}
            </a>

            <div className="pt-2 pb-3">
              <select
                aria-label={t('langLabel')}
                value={locale}
                onChange={(e) => handleLangChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-sm font-semibold text-on-surface-variant bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>{l.labelLong}</option>
                ))}
              </select>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
