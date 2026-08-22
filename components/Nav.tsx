'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, BookA, CalendarClock, Compass, Euro, GraduationCap, HelpCircle, Landmark,
  Layers, Mail, Newspaper, Route, Scale, SpellCheck, UserRound,
} from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import SkillIcon from '@/components/site/SkillIcon';
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
 * The header, restructured 2026-08-22 to **four items: Platform · Gidsen · Prijzen · Over ons**,
 * over the five content-shaped ones (Inburgeren / Examens / KNM / Over de docent / Blog).
 *
 * **The split is doen versus weten, not TOFU versus MOFU.** Nina's deck (`Strategisch
 * Contentadvies`, §Nieuwe Menu-items) proposes four entries named after funnel stages —
 * Inburgering, KNM Kennisgidsen, Taalexamens A2/B1, Oefenexamens. That is a correct *content*
 * plan and a poor *menu*: a visitor does not know which stage they are in, and three of the four
 * labels are the same kind of thing (gidsen), so the one that sells sits fourth. The advice is
 * therefore implemented one level down — those four groups are the columns inside the two panels,
 * where they organise the material, rather than the bar, where they would organise nothing.
 *
 * What the bar says instead is the positioning: **everything for the whole traject is here**
 * (Platform), **and here is what you need to know** (Gidsen). That is the owner's instruction of
 * 2026-08-22, taking the Headspace header as the reference — three or four quiet items, one wide
 * panel per item with named columns, one promo card at the right of the panel.
 *
 * Four decisions worth keeping:
 *
 * 1. **The Platform panel states the catalogue and the roadmap in the same list.** A2 is live, B1
 *    is behind the docent's review gate, KNM and ONA are not built. Those three are rendered as
 *    **non-links with a "binnenkort" chip** — the same `TRACKS` discipline the homepage uses. A
 *    link would either 404 or, worse for B1, hand a crawler a page we tell it to ignore.
 * 2. **Prijzen is top-level again.** In the M2b arrangement the money page's only header entry was
 *    one level deep, inside a dropdown foot. Headspace puts "Our Plans" in the bar; so do we.
 * 3. **Blog moved into Gidsen.** It is informational material, it is one of the four columns of
 *    that panel, and a top-level entry for five posts crowds the bar it was costing.
 * 4. **One line of explanation per link** (`sub` key), because for a reader at A2 "Stappenplan"
 *    alone is abstract and "stap voor stap naar je diploma" is not.
 *
 * **Links point only at pages that exist** — every entry is live or a registered
 * `data/planned-surfaces.ts` placeholder wearing the chip. Guides are named individually only in
 * the Inburgering column (the four published ones); `Nav` is a client component, so the guide
 * registry is never imported — that would ship every `articleHtml` into the browser bundle.
 *
 * **One definition, two renderers.** The desktop panels and the mobile accordion walk the same
 * arrays. They used to hold their own copy of every label, and in M1 that shipped the Blog link
 * twice on mobile after it was removed once on desktop — caught only by reading a screenshot.
 */
type NavHref =
  | '/inburgering' | '/knm' | '/taalexamens' | '/blog' | '/docent' | '/contact'
  | '/premium' | '/oefenen'
  | '/inburgering/tools/tijdlijn' | '/knm/woordenlijst'
  | '/taalexamens/woordenlijst' | '/taalexamens/grammatica'
  | { pathname: '/inburgering/[slug]'; params: { slug: string } };

type NavItem = {
  /** Absent means the row is **not a link** — an announced surface, rendered flat with the chip. */
  href?: NavHref;
  /** A raw path, for the routes `next-intl`'s typed Link cannot express (`/oefenexamen/...`). */
  raw?: (locale: string) => string;
  /** `nav.<label>` for the title, `nav.<label>_sub` for the grey line under it. */
  label: string;
  icon?: LucideIcon;
  /** A skill slug renders the onderdeel's own icon instead of a lucide glyph. */
  skill?: (typeof SKILLS)[number]['slug'];
  /** Renders a "binnenkort" chip. Set on every unbuilt or review-gated surface. */
  soon?: boolean;
  /** Hidden when false — used for `FEATURES.blog`. */
  flag?: boolean;
};

type NavColumn = {
  /** `nav.<head>` — the column head, the "What we offer" line in the reference. */
  head: string;
  items: NavItem[];
};

type NavMenu = {
  id: 'platform' | 'gidsen';
  columns: NavColumn[];
  /** The card at the right of the panel. Absent on the narrow ones. */
  promo?: { label: string; href: NavHref };
};

/** The four onderdelen, at A2 — the level that is live. */
const SKILL_ITEMS: NavItem[] = SKILLS.map(s => ({
  label: `exam_${s.slug}`,
  skill: s.slug,
  raw: (locale: string) => `/${locale}/oefenexamen/a2/${s.slug}`,
}));

const MENUS: NavMenu[] = [
  {
    id: 'platform',
    columns: [
      {
        head: 'col_oefenen',
        items: [
          ...SKILL_ITEMS,
          { href: '/oefenen', label: 'free_taster', icon: GraduationCap },
        ],
      },
      {
        /* The catalogue and the roadmap in one list. `live: false` here is the absence of `href`
         * plus `soon` — see the class comment; keep it in step with `TRACKS` on the homepage. */
        head: 'col_traject',
        items: [
          { href: '/taalexamens', label: 'track_a2', icon: Layers },
          { label: 'track_b1', icon: Layers, soon: true },
          { label: 'track_knm_exams', icon: Landmark, soon: true },
          { label: 'track_ona', icon: Compass, soon: true },
        ],
      },
      {
        head: 'col_plannen',
        items: [
          { href: '/inburgering/tools/tijdlijn', label: 'tool_tijdlijn', icon: CalendarClock },
          { href: '/taalexamens/woordenlijst', label: 'taal_woorden', icon: BookA, soon: true },
          { href: '/taalexamens/grammatica', label: 'taal_grammatica', icon: SpellCheck, soon: true },
          { href: '/premium', label: 'premium', icon: Euro },
        ],
      },
    ],
    promo: { label: 'promo_platform', href: '/oefenen' },
  },
  {
    id: 'gidsen',
    columns: [
      {
        head: 'col_inburgering',
        items: [
          {
            href: { pathname: '/inburgering/[slug]', params: { slug: 'moet-ik-inburgeren' } },
            label: 'guide_moet',
            icon: HelpCircle,
          },
          {
            href: { pathname: '/inburgering/[slug]', params: { slug: 'welke-wet-en-welke-route' } },
            label: 'guide_wet',
            icon: Scale,
          },
          {
            href: { pathname: '/inburgering/[slug]', params: { slug: 'inburgering-stappenplan' } },
            label: 'guide_stappenplan',
            icon: Route,
          },
          {
            href: { pathname: '/inburgering/[slug]', params: { slug: 'wat-kost-inburgeren' } },
            label: 'guide_kosten',
            icon: Euro,
          },
          { href: '/inburgering', label: 'inburgering_hub', icon: Compass },
        ],
      },
      {
        head: 'col_perexamen',
        items: [
          { href: '/taalexamens', label: 'taalexamens_hub', icon: Layers },
          { href: '/knm', label: 'knm_hub', icon: Landmark },
          { href: '/knm/woordenlijst', label: 'knm_woorden', icon: BookA, soon: true },
        ],
      },
      {
        head: 'col_meer',
        items: [
          { href: '/blog', label: 'blog', icon: Newspaper, flag: FEATURES.blog },
          { href: '/docent', label: 'docent_over', icon: UserRound },
          { href: '/contact', label: 'docent_contact', icon: Mail },
        ],
      },
    ],
    promo: { label: 'promo_gidsen', href: '/inburgering/tools/tijdlijn' },
  },
];

function SoonChip({ label }: { label: string }) {
  return (
    <span
      className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
      style={{ background: '#fcecdd', color: '#a24000' }}
    >
      {label}
    </span>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="transition-transform shrink-0 opacity-60"
      style={{ transform: open ? 'rotate(180deg)' : undefined }}
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Nav() {
  const t = useTranslations('nav');
  const tSkills = useTranslations('skills');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  /* One `openMenu` rather than a boolean per dropdown: hovering one has to close the others, and a
   * `useState(false)` per panel would let several sit open. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  /* Every row starts closed. An open first row makes the drawer open two screens tall, and its
     "click to open" affordance then reads as "click to close" on the one row a thumb lands on. */
  const [mobileSection, setMobileSection] = useState<string | null>(null);

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

  /** One row: tinted icon tile, title, one grey line. An item with no `href` is not a link. */
  function Row({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
    const Icon = item.icon;
    const title = item.skill ? tSkills(`${item.skill}.name`) : t(item.label);

    const inner = (
      <>
        {item.skill ? (
          <SkillIcon skill={item.skill} size="sm" />
        ) : (
          /* The tint is an inline hex, not `bg-primary/[0.07]`: with the `@theme` tokens the
             opacity modifier resolved to solid primary and the icon disappeared into it. */
          <span
            className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg"
            style={{
              background: item.soon && !item.href ? '#eef0f3' : '#eef3fa',
              color: item.soon && !item.href ? '#6b7280' : '#002b6d',
            }}
          >
            {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold leading-snug ${item.href ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              {title}
            </span>
            {item.soon && <SoonChip label={t('badge_soon')} />}
          </span>
          <span className="block text-xs text-on-surface-variant/80 leading-snug mt-0.5">
            {t(`${item.label}_sub`)}
          </span>
        </span>
      </>
    );

    const cls = 'flex items-start gap-3 px-3 py-2.5 rounded-lg no-underline transition-colors';

    /* An announced-but-unbuilt surface is a `div`, not a disabled link: there is nowhere to go, and
       a greyed anchor still takes focus and still promises a destination. */
    if (!item.href && !item.raw) return <div className={`${cls} cursor-default`}>{inner}</div>;
    if (item.raw) {
      return (
        <a href={item.raw(locale)} onClick={onNavigate} className={`${cls} hover:bg-surface-container-low`}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={item.href as never} onClick={onNavigate} className={`${cls} hover:bg-surface-container-low`}>
        {inner}
      </Link>
    );
  }

  function ColumnHead({ head }: { head: string }) {
    return (
      <p className="px-3 pt-1 pb-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-on-surface-variant/60">
        {t(head)}
      </p>
    );
  }

  /** The card at the right of a wide panel — the Headspace reference's blue tile. */
  function Promo({ label, href }: { label: string; href: NavHref; }) {
    return (
      <Link
        href={href as never}
        className="hidden lg:flex flex-col justify-between w-56 shrink-0 rounded-xl p-4 no-underline transition-transform hover:-translate-y-0.5"
        style={{ background: 'var(--gradient-brand, #002b6d)', color: '#ffffff' }}
      >
        <span>
          <span className="block text-sm font-bold leading-snug">{t(label)}</span>
          <span className="block text-xs mt-1.5 leading-snug" style={{ color: 'rgba(255,255,255,0.78)' }}>
            {t(`${label}_sub`)}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold mt-4">
          {t(`${label}_cta`)}
          <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
        </span>
      </Link>
    );
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
      {/* `relative` here and not on the trigger: a wide panel is positioned against **this row**,
          so it spans the container and can never hang off the right edge of the viewport. Centring
          it on the trigger did exactly that — opened from "Gidsen", the promo card was cut in half
          at 1440px. Only the narrow panels anchor to their own trigger. */}
      <div className="relative flex justify-between items-center max-w-7xl mx-auto px-6 h-[calc(var(--nav-h)_-_1px)]">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <LogoMark size={32} surface="light" className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-sm sm:text-xl font-extrabold tracking-tight text-primary font-headline whitespace-nowrap">
            Inburgering Oefenen
          </span>
        </Link>

        {/* `menu:` (1152px, defined in globals.css) not `md:` — measured, not guessed. The logo is
            234px and the right-hand cluster ~300px; four items ("Platform · Gidsen · Prijzen ·
            Over ons") need far less than the five that were here before, which is the slack that
            paid for `gap-7` and full-strength ink. The top-level items carry **no caret** (owner's
            request from the Headspace reference): four chevrons read as four competing controls.
            Below `menu:` the drawer is the full menu. **Re-measure if you add an item.** */}
        <nav className="hidden menu:flex items-center gap-7 text-[0.9375rem] font-medium" aria-label={t('ariaDesktop')}>
          <MegaMenu menu={MENUS[0]} />
          <MegaMenu menu={MENUS[1]} />
          <Link href="/premium" className="text-on-surface hover:text-primary transition-colors no-underline whitespace-nowrap">
            {t('prijzen')}
          </Link>
          {/* Plain links, not panels: two items each, and a dropdown holding two rows is a click
              charged for nothing. The docent stays in the bar because that a certified NT2 docent
              writes the items is the product's only claim. */}
          <Link href="/docent" className="text-on-surface hover:text-primary transition-colors no-underline whitespace-nowrap">
            {t('sec_over')}
          </Link>
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

      {/* Mobile — the same two panels as an accordion, one row open at a time, with the columns
          flattened into their heads. The orange CTA sits at the bottom where the thumb is. */}
      {mobileOpen && (
        <div
          className="menu:hidden border-t border-outline-variant/25 max-h-[calc(100dvh-4.5rem)] overflow-y-auto"
          style={{ background: '#f8f9fb' }}
          aria-label={t('ariaMobile')}
        >
          <nav className="flex flex-col px-4 py-2">
            {MENUS.map(menu => (
              <MobileRow key={menu.id} id={menu.id} label={t(`sec_${menu.id}`)}>
                {menu.columns.map(col => (
                  <div key={col.head}>
                    {menu.columns.length > 1 && <ColumnHead head={col.head} />}
                    {col.items
                      .filter(item => item.flag ?? true)
                      .map(item => (
                        <Row key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
                      ))}
                  </div>
                ))}
              </MobileRow>
            ))}

            <Link
              href="/premium"
              onClick={() => setMobileOpen(false)}
              className="border-b border-outline-variant/20 px-3 py-3.5 text-base font-semibold text-on-surface no-underline"
            >
              {t('prijzen')}
            </Link>

            <Link
              href="/docent"
              onClick={() => setMobileOpen(false)}
              className="border-b border-outline-variant/20 px-3 py-3.5 text-base font-semibold text-on-surface no-underline"
            >
              {t('sec_over')}
            </Link>

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

  /** A dropdown panel: one column per group, plus the optional promo card. */
  function MegaMenu({ menu }: { menu: NavMenu }) {
    const open = openMenu === menu.id;
    const wide = menu.columns.length > 1;
    return (
      <div
        className={wide ? undefined : 'relative'}
        onMouseEnter={() => setOpenMenu(menu.id)}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <button
          type="button"
          className="text-on-surface hover:text-primary transition-colors whitespace-nowrap"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpenMenu(o => (o === menu.id ? null : menu.id))}
        >
          {t(`sec_${menu.id}`)}
        </button>

        {open && (
          /* `data-menu` is the panel's handle for `tests/public.spec.js`: the counts there have to
             be scoped to one panel, or the bar's own Prijzen/Over ons links are indistinguishable
             from a duplicate inside it. */
          <div data-menu={menu.id} className={`absolute top-full pt-3 ${wide ? 'left-6 right-6' : 'left-0 w-80'}`}>
            <div
              className="flex gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/40"
              style={{ boxShadow: '0 16px 40px rgba(0,43,109,0.14)' }}
            >
              <div className={wide ? 'grid flex-1 gap-x-2' : 'flex flex-col flex-1'} style={wide ? { gridTemplateColumns: `repeat(${menu.columns.length}, minmax(0, 1fr))` } : undefined}>
                {menu.columns.map(col => (
                  <div key={col.head}>
                    {wide && <ColumnHead head={col.head} />}
                    {col.items
                      .filter(item => item.flag ?? true)
                      .map(item => (
                        <Row key={item.label} item={item} />
                      ))}
                  </div>
                ))}
              </div>
              {menu.promo && <Promo label={menu.promo.label} href={menu.promo.href} />}
            </div>
          </div>
        )}
      </div>
    );
  }

  /** One accordion row in the drawer. */
  function MobileRow({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
    const open = mobileSection === id;
    return (
      <div className="border-b border-outline-variant/20">
        <button
          type="button"
          onClick={() => setMobileSection(o => (o === id ? null : id))}
          aria-expanded={open}
          className={`w-full flex items-center justify-between px-3 py-3.5 text-base font-semibold transition-colors ${open ? 'text-primary' : 'text-on-surface'}`}
        >
          {label}
          <Caret open={open} />
        </button>
        {open && <div data-menu={id} className="pb-2">{children}</div>}
      </div>
    );
  }
}
