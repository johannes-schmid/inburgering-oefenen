'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import LogoMark from '@/components/site/LogoMark';
import LocaleFlag from '@/components/site/LocaleFlag';
import { ArrowRight } from 'lucide-react';
import { glasButton } from '@/components/glas/Button';
import { LOCALES, LanguageTrigger } from '@/components/LanguageTrigger';
import { localeHref } from '@/i18n/paths';
import { contentSlugParam, parseContentSlug } from '@/i18n/content-slugs';
import { parseSkillParam, skillParam } from '@/i18n/skill-slugs';

type LanguageMenuComponent = typeof import('@/components/LanguageMenu').default;

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

/**
 * De parameterwaarden van het huidige pad, omgerekend naar de doeltaal.
 *
 * Twee waarden zijn vertaald — de gids-/blogslug (`slug`, en `thema` op de KNM-route) en de
 * onderdeelnaam (`skill`). Alles wat niet in een van beide tabellen staat, gaat onveranderd
 * mee: `level` is 'a2'/'b1' en `n` is een examennummer.
 */
function translateParams(
  params: ReturnType<typeof useParams>,
  locale: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(params)) {
    if (typeof value !== 'string' || name === 'locale') continue;
    if (name === 'slug' || name === 'thema') {
      const nlSlug = parseContentSlug(value);
      out[name] = nlSlug ? contentSlugParam(nlSlug, locale) : value;
    } else if (name === 'skill') {
      const slug = parseSkillParam(value);
      out[name] = slug ? skillParam(slug, locale) : value;
    } else {
      out[name] = value;
    }
  }
  return out;
}

export default function Nav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  /* Het taalmenu laadt pas bij hover, focus of klik — zie `LanguageTrigger` voor het waarom.
   * Bewust géén `next/dynamic`: die wisselt de knop bij de eerste hover om voor zijn
   * `loading`-fallback, en de klik die op die hover volgt landt dan op een knop zonder handler.
   * Hier blijft de statische knop mét handlers staan tot de module er is, en een klik in de
   * tussentijd wordt onthouden als `open`. */
  const [LanguageMenu, setLanguageMenu] = useState<LanguageMenuComponent | null>(null);
  const [langWanted, setLangWanted] = useState<'no' | 'warm' | 'open'>('no');
  function wantLanguageMenu(open: boolean) {
    setLangWanted((prev) => (open || prev === 'open' ? 'open' : 'warm'));
    if (!LanguageMenu) import('@/components/LanguageMenu').then((m) => setLanguageMenu(() => m.default));
  }

  function handleLangChange(newLocale: string) {
    /* `usePathname()` returns the *template* for a dynamic route — '/blog/[slug]', not
     * '/blog/mijn-slug'. `router.replace('/blog/[slug]')` with no `params` resolves to nothing, so
     * switching language did nothing at all on every dynamic page until this was fixed on
     * 2026-08-19. The typed router wants `{ pathname, params }` for a template, and `useParams()`
     * is where the concrete values are.
     *
     * Sinds 15-09 verschilt de slug wél per taal, en dat is precies de val die de oude
     * opmerking hier beschreef: `useParams()` geeft de waarden van de táál waar de lezer nu
     * staat, dus `/en/civic-integration/housing` zou onder `/ar` als `housing` worden
     * ingevuld. `translateParams` rekent elke vertaalde parameterwaarde eerst terug naar zijn
     * interne naam en daarna naar de doeltaal. Zonder dat leverde de taalwissel een 308 via
     * `canonicalContentPath` — hij kwam goed uit, maar met een hop, en op een onderdeelnaam
     * (`/nl/oefenen/reading`) kwam hij helemaal niet goed uit. */
    const target = pathname.includes('[')
      ? ({ pathname, params: translateParams(params, newLocale) } as unknown as Parameters<typeof router.replace>[0])
      : (pathname as Parameters<typeof router.replace>[0]);
    router.replace(target, { locale: newLocale });
    setMobileOpen(false);
  }

  /* De actieve link: de bovenste laag van het pad. "Bronnen" staat ook voor de drie gids-hubs en
   * de blog, "Over ons" ook voor de redactie en contact. */
  const section = pathname === '/' ? '' : (pathname.split('/')[1] ?? '');
  const isActive = (href: string) => {
    const top = href.slice(1);
    if (top === 'gidsen') return ['gidsen', 'inburgering', 'knm', 'taalexamens', 'blog', 'oefenvragen'].includes(section);
    if (top === 'docent') return ['docent', 'redactie', 'contact'].includes(section);
    return section === top;
  };
  /* De korte CTA-tekst draagt in de vertaling een pijlteken; in Glas is een pijl altijd lucide. */
  const startShort = t('startMobile').replace(/\s*[→←]\s*$/, '');

  return (
    /* De Glas-pil (glas.html §08 "Navigatie"): een zwevende glazen pil op het veld van de kop van
       elke pagina. Wat hem van de pagina scheidt is het glas zelf — onscherpte, witte rand, de
       zweefschaduw — en nooit een 1px-lijn. **De pil heeft een veld nodig om te zweven**: elke
       herbouwde pagina begint daarom met een `PageField` of de hero, die onder de pil door loopt.

       `--nav-h` (73px) blijft wat de `(main)`-layout reserveert en wat `scroll-margin-top`
       rekent: 10px lucht boven + 60px pil + 3px lucht onder. Verander je de pilhoogte, verander
       dan `--nav-h` mee, anders schuift elke ankerlink.

       De CTA is navy, niet oranje: de kop van elke pagina is een veld, en op de homepage draagt dat
       veld de gloed — één wijzer per view (G1 regel 3). */
    <header className="g-nav" aria-label={t('ariaMain')}>
      <div className="g-navpill g-glass">
        <Link href="/" className="g-nav-logo">
          <LogoMark size={32} surface="light" className="w-7 h-7 sm:w-8 sm:h-8" />
          Inburgering Oefenen
        </Link>

        {/* Vanaf 1152px — gemeten toen de balk vijf items had; wat een laptop vol zet is het logo
            plus de CTA. **Meet opnieuw voor je een vijfde item toevoegt.** */}
        <nav className="g-nav-links" aria-label={t('ariaDesktop')}>
          {LINKS.map(link => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>
              {t(link.label)}
            </Link>
          ))}
        </nav>

        <div className="g-nav-right">
          {LanguageMenu ? (
            <LanguageMenu
              locale={locale}
              label={t('langLabel')}
              onChange={handleLangChange}
              defaultOpen={langWanted === 'open'}
            />
          ) : (
            <LanguageTrigger
              onPointerEnter={() => wantLanguageMenu(false)}
              onFocus={() => wantLanguageMenu(false)}
              onClick={() => wantLanguageMenu(true)}
            />
          )}

          <Link href="/login" className="g-nav-plain">
            {t('login')}
          </Link>

          <a href={localeHref(locale, `oefenen`)} className={glasButton({ variant: 'navy', size: 'sm' })}>
            <span className="sm:hidden">{startShort}</span>
            <span className="hidden sm:inline">{t('startDesktop')}</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="g-nav-burger"
            aria-label={mobileOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={mobileOpen}
            aria-controls="g-nav-sheet"
          >
            <i /><i /><i />
          </button>
        </div>
      </div>

      {/* Mobiel: een tweede glazen kaart onder de pil, dekkend genoeg om op te lezen boven wat er ook
          onder ligt. Dezelfde vier links, inloggen, en de talen als drie knoppen met vlag. */}
      {mobileOpen && (
        <div id="g-nav-sheet" className="g-nav-sheet g-glass" aria-label={t('ariaMobile')}>
          <nav>
            {LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="g-nav-row"
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {t(link.label)}
                <ArrowRight aria-hidden="true" className="rtl-flip" />
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileOpen(false)} className="g-nav-row">
              {t('login')}
              <ArrowRight aria-hidden="true" className="rtl-flip" />
            </Link>

            <div role="group" aria-label={t('langLabel')} className="g-nav-langs" onClick={(e) => e.stopPropagation()}>
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLangChange(l.code)}
                  aria-current={l.code === locale ? 'true' : undefined}
                  className="g-nav-lang"
                >
                  <LocaleFlag locale={l.code} className="w-7 h-[18px]" />
                  {l.labelLong}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
