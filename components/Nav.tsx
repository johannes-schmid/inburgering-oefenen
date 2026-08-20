'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { DEFAULT_LEVEL, SKILLS } from '@/data/skills';
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
 * Dropping them also buys ~24px in the most crowded part of the header, which is what prompted it
 * (owner's request, 2026-08-20). The `fixme` is now a live test.
 */
const LOCALES = [
  { code: 'nl', labelShort: 'NL', labelLong: 'Nederlands' },
  { code: 'en', labelShort: 'EN', labelLong: 'English' },
  { code: 'ar', labelShort: 'AR', labelLong: 'العربية' },
] as const;

/**
 * The content sections of the header, and what sits inside each one.
 *
 * **This implements `docs/MILESTONES.html` §3 ("Doelarchitectuur") and supersedes M1's
 * single-dropdown decision** (owner's call, 2026-08-20). M1 put all content in one "Inburgering"
 * dropdown on the reasoning that a top-level item per section is thin content twice over while KNM
 * and Taalexamens had nothing behind them. That reason has expired: the M2 pillar is live, the
 * Taalexamens hub carries the two per-onderdeel blog posts that already exist, and each section now
 * has tools or free material of its own. The old argument — that comparable sites use one
 * "Examentips"-style dropdown — is still true and simply lost to a stronger one: §3 is the site's
 * own published architecture, and the funnel phases it names are the sections.
 *
 * Each section splits into **Gidsen** (read) and **Tools / Gratis oefenen** (do), because mixing a
 * finished guide and an unbuilt tool in one flat list tells the reader nothing about which is which.
 *
 * Section labels are deliberately the head terms — "Inburgering" (~284k searches/month), "KNM",
 * "Taalexamens". A nav label is site-wide anchor text; "Kennisbank" or "Resources" is a word nobody
 * searches for, and at A2 may not even be understood.
 *
 * **One definition, two renderers.** The desktop panel and the mobile drawer both walk this array.
 * They used to hold their own copy of every label, and in M1 that shipped the Blog link twice on
 * mobile after it was removed once on desktop — caught only by reading a screenshot. With three
 * sections that duplication is not survivable, so there is exactly one list.
 *
 * Guides are listed by their hub, never enumerated here. `Nav` is a client component, and importing
 * the guide registry would ship every `articleHtml` string into the browser bundle.
 */
type NavLink = {
  href: '/inburgering' | '/knm' | '/taalexamens' | '/blog'
    | '/inburgering/tools/tijdlijn' | '/knm/woordenlijst'
    | '/taalexamens/woordenlijst' | '/taalexamens/grammatica';
  label: string;
  /** Hidden when false — used for `FEATURES.blog`. Absent means always shown. */
  flag?: boolean;
  /** Renders a "binnenkort" chip. Set on every `data/planned-surfaces.ts` entry, so the menu
   *  never presents an unbuilt page as a finished one. */
  soon?: boolean;
};

type NavSection = {
  /** Drives `openMenu`; also the `nav.<id>` label key. */
  id: 'inburgering' | 'knm' | 'taalexamens';
  groups: { key: string; items: NavLink[] }[];
};

const CONTENT_SECTIONS: NavSection[] = [
  {
    id: 'inburgering',
    groups: [
      {
        key: 'group_gidsen',
        items: [
          { href: '/inburgering', label: 'inburgering_hub' },
          /* The blog stays in the header. §3's table does not mention it, but it is a live indexed
           * surface and a header link is a site-wide internal link on every page — dropping it for
           * a tidier menu would be a self-inflicted ranking cost. The footer's link uses a
           * different namespace, so it is not a substitute. */
          { href: '/blog', label: 'blog', flag: FEATURES.blog },
        ],
      },
      {
        key: 'group_tools',
        items: [{ href: '/inburgering/tools/tijdlijn', label: 'tool_tijdlijn', soon: true }],
      },
    ],
  },
  {
    id: 'knm',
    groups: [
      { key: 'group_gidsen', items: [{ href: '/knm', label: 'knm_hub' }] },
      {
        key: 'group_gratis',
        items: [{ href: '/knm/woordenlijst', label: 'knm_woorden', soon: true }],
      },
    ],
  },
  {
    id: 'taalexamens',
    groups: [
      { key: 'group_gidsen', items: [{ href: '/taalexamens', label: 'taalexamens_hub' }] },
      {
        key: 'group_gratis',
        items: [
          { href: '/taalexamens/woordenlijst', label: 'taal_woorden', soon: true },
          { href: '/taalexamens/grammatica', label: 'taal_grammatica', soon: true },
        ],
      },
    ],
  },
];

export default function Nav() {
  const t = useTranslations('nav');
  const tSkills = useTranslations('skills');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  /* One `openMenu` rather than a boolean per dropdown: there are four now (three content
   * sections plus Oefenexamens) and hovering one has to close the others. A `useState(false)` per
   * dropdown would let several panels sit open at once. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  function handleLangChange(newLocale: string) {
    /* `usePathname()` returns the *template* for a dynamic route — '/blog/[slug]', not
     * '/blog/mijn-slug'. The comment that used to sit here claimed the opposite and called the
     * cast safe; it was not. `router.replace('/blog/[slug]')` with no `params` resolves to
     * nothing, so switching language did nothing at all on every dynamic page: all five blog
     * posts, both free tasters, every exam overview and the kennisgidsen. Verified in a browser
     * on 2026-08-19 — the select changed and the URL did not.
     *
     * The typed router wants `{ pathname, params }` for a template, and `useParams()` is where the
     * concrete values are. A static pathname takes no params and is passed as-is.
     *
     * Slugs are still deliberately identical across locales (see `data/guides/types.ts`): with a
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
      className="fixed top-0 w-full z-50 border-b border-outline-variant/30"
      style={{ background: '#ffffff', boxShadow: '0 1px 0 rgba(0,43,109,0.08)' }}
      aria-label={t('ariaMain')}
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <LogoMark size={32} className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-sm sm:text-xl font-extrabold tracking-tight text-primary font-headline whitespace-nowrap">
            Inburgering Oefenen
          </span>
        </Link>

        {/* Desktop nav links */}
        {/* `menu:` (1152px, defined in globals.css) not `md:`, and `gap-5` not `gap-7` — measured,
            not guessed. The logo is 234px and the right-hand cluster 362px, so at 1152px the links
            get 508px and the five items need 486px. At `md` (768px) there was ~344px, where "Over
            de docent" was already squeezed from 99px to 46px with four items. Below `menu:` the
            drawer is the full menu — it carries every item including Modules, Docent, login and
            the language select, which is what makes raising the breakpoint safe.
            **Re-measure if you add an item or lengthen the CTA.** */}
          <nav className="hidden menu:flex items-center gap-5 text-sm font-semibold" aria-label={t('ariaDesktop')}>
          {/* The three content sections of §3, each with its Gidsen / Tools headings. */}
          {CONTENT_SECTIONS.map(section => (
            <div
              key={section.id}
              className="relative"
              onMouseEnter={() => setOpenMenu(section.id)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
                aria-expanded={openMenu === section.id}
                aria-haspopup="true"
                onClick={() => setOpenMenu(o => (o === section.id ? null : section.id))}
              >
                {t(section.id)}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {openMenu === section.id && (
                <div className="absolute left-0 top-full pt-3 w-72">
                  <div
                    className="flex flex-col p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40"
                    style={{ boxShadow: '0 12px 32px rgba(0,43,109,0.14)' }}
                  >
                    {section.groups.map((group, i) => (
                      <div key={group.key} className={i > 0 ? 'mt-1 pt-1 border-t border-outline-variant/25' : undefined}>
                        <p className="px-3 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/60">
                          {t(group.key)}
                        </p>
                        {group.items.map(item => (
                          (item.flag ?? true) && (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg no-underline text-on-surface font-semibold hover:bg-surface-container-low transition-colors"
                            >
                              {t(item.label)}
                              {item.soon && (
                                <span
                                  className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: '#fcecdd', color: '#a24000' }}
                                >
                                  {t('badge_soon')}
                                </span>
                              )}
                            </Link>
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Oefenexamens — BOFU. **Modules lives in here, not as a top-level item** (owner's
              decision, 2026-08-20): buying access and practising are the same intent one step
              apart, so the dropdown holds the four onderdelen and then the way to unlock all ten
              exams of each. It also takes the header from six items to five. */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('skills')}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
              aria-expanded={openMenu === 'skills'}
              aria-haspopup="true"
              onClick={() => setOpenMenu(o => (o === 'skills' ? null : 'skills'))}
            >
              {t('oefenexamens')}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {openMenu === 'skills' && (
              <div className="absolute left-0 top-full pt-3 w-64">
                <div
                  className="flex flex-col p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40"
                  style={{ boxShadow: '0 12px 32px rgba(0,43,109,0.14)' }}
                >
                  <p className="px-3 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/60">
                    {t('group_onderdeel')}
                  </p>
                  {SKILLS.map(skill => (
                    <a
                      key={skill.slug}
                      href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline hover:bg-surface-container-low transition-colors"
                    >
                      <SkillIcon skill={skill.slug} size="sm" />
                      <span className="text-on-surface font-semibold">{tSkills(`${skill.key}.name`)}</span>
                    </a>
                  ))}
                  <div className="mt-1 pt-1 border-t border-outline-variant/25">
                    <p className="px-3 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/60">
                      {t('group_toegang')}
                    </p>
                    <Link
                      href="/premium"
                      className="block px-3 py-2 rounded-lg no-underline text-on-surface font-semibold hover:bg-surface-container-low transition-colors"
                    >
                      {t('premium')}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link href="/docent" className="text-on-surface-variant hover:text-primary transition-colors no-underline whitespace-nowrap">
            {t('docent')}
          </Link>
        </nav>

        {/* Right: lang switcher + auth + CTA + hamburger.
            Deliberately light. This cluster was 386px of the bar and most of the crowding: a
            bordered select with a flag, a text link and a long filled button all competing. Now the
            select is borderless (it reads as a control on hover and focus, which is enough for a
            three-item choice) and Inloggen is an outlined button paired with the filled CTA — one
            visual pair instead of three separate weights. */}
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            aria-label={t('langLabel')}
            value={locale}
            onChange={(e) => handleLangChange(e.target.value)}
            className="hidden menu:block text-xs font-semibold text-on-surface-variant bg-transparent border border-transparent rounded-lg pl-2 pr-1 py-1.5 cursor-pointer hover:bg-surface-container-low hover:border-outline-variant/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>{l.labelShort}</option>
            ))}
          </select>

          <Link
            href="/login"
            className="hidden menu:block text-primary font-semibold text-sm px-4 py-2 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors no-underline whitespace-nowrap"
          >
            {t('login')}
          </Link>

          <a
            href={`/${locale}/oefenen`}
            className="inline-flex items-center gap-1.5 bg-secondary-container px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-sm button-inner-glow hover:-translate-y-px transition-transform active:scale-95 no-underline whitespace-nowrap"
            style={{ color: '#ffffff' }}
          >
            <span className="sm:hidden">{t('startMobile')}</span>
            <span className="hidden sm:inline">{t('startDesktop')}</span>
          </a>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="menu:hidden flex flex-col justify-center items-center w-10 h-10 -mr-1 rounded-xl hover:bg-surface-container-low transition-colors"
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
          className="menu:hidden border-t border-outline-variant/30"
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

            {/* The same `CONTENT_SECTIONS` the desktop panel walks. The section name is the
                heading here and the group name a sub-heading, because a drawer has no hover. */}
            {CONTENT_SECTIONS.map(section => (
              <div key={section.id} className="border-b border-outline-variant/20 pb-2 mb-1">
                <p className="text-xs font-bold uppercase tracking-widest text-primary px-3 pt-2 pb-1">
                  {t(section.id)}
                </p>
                {section.groups.map(group => (
                  <div key={group.key}>
                    <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/50 px-3 pt-1.5 pb-0.5">
                      {t(group.key)}
                    </p>
                    {group.items.map(item => (
                      (item.flag ?? true) && (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between gap-2 text-on-surface-variant font-semibold text-base px-3 py-2.5 rounded-xl hover:bg-surface-container-low hover:text-primary transition-colors no-underline"
                        >
                          {t(item.label)}
                          {item.soon && (
                            <span
                              className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: '#fcecdd', color: '#a24000' }}
                            >
                              {t('badge_soon')}
                            </span>
                          )}
                        </Link>
                      )
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* Oefenexamens, mirroring the desktop dropdown: the four onderdelen, then access. */}
            <div className="border-b border-outline-variant/20 pb-2 mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-primary px-3 pt-2 pb-1">
                {t('oefenexamens')}
              </p>
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/50 px-3 pt-1.5 pb-0.5">
                {t('group_onderdeel')}
              </p>
              {SKILLS.map(skill => (
                <a
                  key={skill.slug}
                  href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-on-surface-variant font-semibold text-base px-3 py-2.5 rounded-xl hover:bg-surface-container-low hover:text-primary transition-colors no-underline"
                >
                  <SkillIcon skill={skill.slug} size="sm" />
                  {tSkills(`${skill.key}.name`)}
                </a>
              ))}
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/50 px-3 pt-1.5 pb-0.5">
                {t('group_toegang')}
              </p>
              <Link
                href="/premium"
                onClick={() => setMobileOpen(false)}
                className="block text-on-surface-variant font-semibold text-base px-3 py-2.5 rounded-xl hover:bg-surface-container-low hover:text-primary transition-colors no-underline"
              >
                {t('premium')}
              </Link>
            </div>

            {/* Blog is listed once, under the Inburgering group above — not again here. */}
            <Link
              href="/docent"
              onClick={() => setMobileOpen(false)}
              className="text-on-surface-variant font-semibold text-base px-3 py-2.5 rounded-xl hover:bg-surface-container-low hover:text-primary transition-colors no-underline"
            >
              {t('docent')}
            </Link>

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
