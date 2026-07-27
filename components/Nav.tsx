'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { getAbVariant } from '@/lib/ab-variant';

const LOCALES = [
  { code: 'nl', labelShort: '🇳🇱 NL', labelLong: '🇳🇱 Nederlands' },
  { code: 'en', labelShort: '🇬🇧 EN', labelLong: '🇬🇧 English' },
  { code: 'ar', labelShort: '🇸🇦 AR', labelLong: '🇸🇦 العربية' },
] as const;

export default function Nav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ctaHref, setCtaHref] = useState('/proefexamen');

  useEffect(() => {
    const v = getAbVariant();
    setCtaHref(v === 'platform-cta' ? '/dashboard' : '/proefexamen');
  }, []);

  function handleLangChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
    setMobileOpen(false);
  }

  return (
    <header
      className="fixed top-0 w-full z-50 border-b border-outline-variant/30"
      style={{ background: '#ffffff', boxShadow: '0 1px 0 rgba(0,43,109,0.08)' }}
      aria-label={t('ariaMain')}
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <span className="w-1.5 h-6 bg-secondary-container rounded-full shrink-0" />
          <span className="text-xl font-extrabold tracking-tight text-primary font-headline whitespace-nowrap">
            KNM Oefenen
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold" aria-label={t('ariaDesktop')}>
          <Link href="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors no-underline">
            {t('proefexamen')}
          </Link>
          <Link href="/premium" className="text-on-surface-variant hover:text-primary transition-colors no-underline">
            {t('premium')}
          </Link>
          <Link href="/docent" className="text-on-surface-variant hover:text-primary transition-colors no-underline">
            {t('docent')}
          </Link>
          <Link href="/blog" className="text-on-surface-variant hover:text-primary transition-colors no-underline">
            {t('blog')}
          </Link>
        </nav>

        {/* Right: lang switcher + auth + CTA + hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label={t('langLabel')}
            value={locale}
            onChange={(e) => handleLangChange(e.target.value)}
            className="hidden md:block text-xs font-semibold text-on-surface-variant bg-transparent border border-outline-variant rounded-lg px-2 py-1.5 cursor-pointer hover:bg-surface-container-low transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>{l.labelShort}</option>
            ))}
          </select>

          {/* Auth links — stubbed; wired in M5 */}
          <Link
            href="/login"
            className="hidden sm:block text-primary font-semibold text-sm px-4 py-2 hover:bg-surface-container-low rounded-xl transition-colors no-underline whitespace-nowrap"
          >
            {t('login')}
          </Link>

          <a
            href={ctaHref}
            className="inline-flex items-center gap-1.5 bg-secondary-container px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-sm button-inner-glow hover:-translate-y-px transition-transform active:scale-95 no-underline whitespace-nowrap"
            style={{ color: '#ffffff' }}
          >
            <span className="sm:hidden">{t('startMobile')}</span>
            <span className="hidden sm:inline">{t('startDesktop')}</span>
          </a>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 -mr-1 rounded-xl hover:bg-surface-container-low transition-colors"
            aria-label={mobileOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={mobileOpen}
          >
            <span className="w-5 h-[2px] bg-primary rounded-full block" />
            <span className="w-5 h-[2px] bg-primary rounded-full block my-[5px]" />
            <span className="w-5 h-[2px] bg-primary rounded-full block" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-outline-variant/30"
          style={{ background: '#f8f9fb' }}
          aria-label={t('ariaMobile')}
        >
          <nav className="flex flex-col px-6 py-3 gap-1">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-primary font-bold text-base px-3 py-3 rounded-xl hover:bg-surface-container-low transition-colors no-underline border-b border-outline-variant/20 mb-1"
            >
              {t('login')}
            </Link>
            {(
              [
                { href: '/dashboard', label: t('proefexamen') },
                { href: '/premium',   label: t('premium')     },
                { href: '/docent',    label: t('docent')      },
                { href: '/blog',      label: t('blog')        },
              ] as { href: '/dashboard' | '/premium' | '/docent' | '/blog'; label: string }[]
            ).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="text-on-surface-variant font-semibold text-base px-3 py-2.5 rounded-xl hover:bg-surface-container-low hover:text-primary transition-colors no-underline"
              >
                {label}
              </Link>
            ))}

            <div className="pt-2 mt-1 border-t border-outline-variant/20">
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
