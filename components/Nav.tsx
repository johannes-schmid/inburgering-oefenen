'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  BookA, CalendarClock, Compass, Euro, HelpCircle, Landmark, Layers, Mail, Route, Scale,
  SpellCheck, UserRound,
} from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { LEVELS, SKILLS, levelLabel, type Level } from '@/data/skills';
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
 * The header, rebuilt to the owner's menu mockup (2026-08-21) — five items:
 * **Inburgeren · Examens · KNM · Over de docent · Blog**.
 *
 * This supersedes the M2b arrangement (Inburgering / KNM / Taalexamens / Oefenexamens / Docent).
 * Four decisions carry over from the mockup and are the reason the shape is what it is:
 *
 * 1. **The level is a column head, not part of a link's name.** A2 and B1 sit side by side in one
 *    wide Examens panel, so a visitor sees that both exist without clicking a page deep. This is
 *    also why there is no separate "Taalexamens" section any more: the hub and its material moved
 *    into that panel, beneath the two level columns.
 * 2. **There is no separate "Oefenen" item.** Uitleg and oefenexamens live on the same page, so a
 *    second entry would point at the place the first one already goes. The orange CTA and the
 *    "Alle oefenexamens" link in the panel foot carry that intent.
 * 3. **The docent is in the bar.** That a certified NT2 docent writes the items is the product's
 *    only claim, so it is a top-level dropdown with Contact under it — being reachable is part of
 *    the same proof.
 * 4. **One line of explanation per link.** For a reader at A2, "Stappenplan" alone is abstract and
 *    "stap voor stap naar je diploma" is not. Every link therefore has a `sub` key, and adding a
 *    link without one is a type error.
 *
 * **Links point only at pages that exist.** The mockup lists guides that are not written yet
 * (regels van de overheid, wat kost het, KNM-onderwerpen, "waarom wij geen AI"); those are M2/M3
 * spokes and are deliberately absent rather than stubbed — every entry here is either live or a
 * registered `data/planned-surfaces.ts` placeholder wearing the "binnenkort" chip.
 *
 * **One definition, two renderers.** The desktop panels and the mobile accordion both walk these
 * arrays. They used to hold their own copy of every label, and in M1 that shipped the Blog link
 * twice on mobile after it was removed once on desktop — caught only by reading a screenshot.
 *
 * Guides are listed by their hub (plus the one published pillar), never enumerated. `Nav` is a
 * client component, and importing the guide registry would ship every `articleHtml` into the bundle.
 */
type NavHref =
  | '/inburgering' | '/knm' | '/taalexamens' | '/blog' | '/docent' | '/contact'
  | '/premium' | '/oefenen'
  | '/inburgering/tools/tijdlijn' | '/knm/woordenlijst'
  | '/taalexamens/woordenlijst' | '/taalexamens/grammatica'
  | { pathname: '/inburgering/[slug]'; params: { slug: string } };

type NavLink = {
  href: NavHref;
  /** `nav.<label>` for the title and `nav.<label>_sub` for the grey line under it. */
  label: string;
  icon: LucideIcon;
  /** Hidden when false — used for `FEATURES.blog`. Absent means always shown. */
  flag?: boolean;
  /** Renders a "binnenkort" chip. Set on every `data/planned-surfaces.ts` entry, so the menu
   *  never presents an unbuilt page as a finished one. */
  soon?: boolean;
};

type NavSection = {
  /** Drives `openMenu`; also the `nav.sec_<id>` label key. */
  id: 'inburgeren' | 'knm' | 'docent';
  items: NavLink[];
  /** A green aside at the foot of the panel — `nav.note_<id>`. Optional. */
  note?: boolean;
};

const CONTENT_SECTIONS: NavSection[] = [
  {
    id: 'inburgeren',
    items: [
      /* The four published Inburgering guides, in the order a reader needs them: do I have to,
       * under which law, what happens when, what does it cost. The hub follows as the catch-all.
       * This is the one section that names individual guides rather than only its hub — the four
       * of them *are* the orientation phase, and a dropdown that offers only "Alle gidsen" makes
       * the reader take two clicks to find out whether the plicht applies to them at all.
       * Keep it at four: `menu:` (1152px) was measured against five top-level items, and the
       * panel's own height is what limits this list. A fifth guide goes to the hub only. */
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
      { href: '/inburgering/tools/tijdlijn', label: 'tool_tijdlijn', icon: CalendarClock, soon: true },
      /* The blog is deliberately **not** here: the mockup gives it its own top-level item, and
       * listing it in both places is the M1 duplication bug over again. */
    ],
  },
  {
    id: 'knm',
    items: [
      { href: '/knm', label: 'knm_hub', icon: Landmark },
      { href: '/knm/woordenlijst', label: 'knm_woorden', icon: BookA, soon: true },
    ],
    note: true,
  },
  {
    id: 'docent',
    items: [
      { href: '/docent', label: 'docent_over', icon: UserRound },
      { href: '/contact', label: 'docent_contact', icon: Mail },
    ],
    note: true,
  },
];

/** The material under the two level columns in the Examens panel. */
const EXAM_MATERIAL: NavLink[] = [
  { href: '/taalexamens', label: 'taalexamens_hub', icon: Layers },
  { href: '/taalexamens/woordenlijst', label: 'taal_woorden', icon: BookA, soon: true },
  { href: '/taalexamens/grammatica', label: 'taal_grammatica', icon: SpellCheck, soon: true },
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
  /* One `openMenu` rather than a boolean per dropdown: there are four, and hovering one has to
   * close the others. A `useState(false)` per dropdown would let several panels sit open. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  /* The mobile drawer is an accordion, one row open at a time — the mockup's shape, and what keeps
   * five sections with a line of explanation each inside one screen. */
  const [mobileSection, setMobileSection] = useState<string | null>('examens');

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

  /** One dropdown row: tinted icon tile, title, one grey line. Shared by all four panels. */
  function DropLink({ item, onNavigate }: { item: NavLink; onNavigate?: () => void }) {
    const Icon = item.icon;
    return (
      <Link
        href={item.href as never}
        onClick={onNavigate}
        className="flex items-start gap-3 px-3 py-2.5 rounded-lg no-underline hover:bg-surface-container-low transition-colors"
      >
        {/* The tint is an inline hex, not `bg-primary/[0.07]`: with the `@theme` tokens the
            opacity modifier resolved to solid primary and the icon disappeared into it. */}
        <span
          className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg"
          style={{ background: '#eef3fa', color: '#002b6d' }}
        >
          <Icon size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-on-surface leading-snug">{t(item.label)}</span>
            {item.soon && <SoonChip label={t('badge_soon')} />}
          </span>
          <span className="block text-xs text-on-surface-variant/80 leading-snug mt-0.5">
            {t(`${item.label}_sub`)}
          </span>
        </span>
      </Link>
    );
  }

  /** A level column in the Examens panel: pill + head, then the four onderdelen at that level. */
  function LevelColumn({ level, onNavigate }: { level: Level; onNavigate?: () => void }) {
    return (
      <div>
        <p className="flex items-center gap-2 px-3 pt-2 pb-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
          <span
            className="px-1.5 py-0.5 rounded text-[0.6rem] tracking-wider"
            style={{
              background: level === 'a2' ? '#002b6d' : '#2e7d5b',
              color: '#ffffff',
            }}
          >
            {levelLabel(level)}
          </span>
          {t(`head_${level}`)}
        </p>
        {SKILLS.map(skill => (
          <a
            key={skill.slug}
            href={`/${locale}/oefenexamen/${level}/${skill.slug}`}
            onClick={onNavigate}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg no-underline hover:bg-surface-container-low transition-colors"
          >
            <SkillIcon skill={skill.slug} size="sm" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-on-surface leading-snug">
                {tSkills(`${skill.key}.name`)} {levelLabel(level)}
              </span>
              <span className="block text-xs text-on-surface-variant/80 leading-snug mt-0.5">
                {t(`exsub_${level}_${skill.slug}`)}
              </span>
            </span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <header
      className="fixed top-0 w-full z-50 border-b border-outline-variant/30"
      style={{ background: '#ffffff', boxShadow: '0 1px 0 rgba(0,43,109,0.08)' }}
      aria-label={t('ariaMain')}
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-[calc(var(--nav-h)_-_1px)]">
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
            get 508px; the five items here ("Inburgeren · Examens · KNM · Over de docent · Blog")
            need ~470px. At `md` (768px) there was ~344px, where "Over de docent" was squeezed from
            99px to 46px. Below `menu:` the drawer is the full menu — it carries every item
            including Modules, login and the language select, which is what makes this safe.
            **Re-measure if you add an item or lengthen the CTA.** */}
        <nav className="hidden menu:flex items-center gap-5 text-sm font-semibold" aria-label={t('ariaDesktop')}>
          {/* Inburgeren — the TOFU section, first because it is where the funnel starts. */}
          {CONTENT_SECTIONS.filter(s => s.id === 'inburgeren').map(section => (
            <SingleColumnMenu key={section.id} section={section} />
          ))}

          {/* Examens — the wide panel: A2 and B1 as columns, then the material, then the foot. */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('examens')}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
              aria-expanded={openMenu === 'examens'}
              aria-haspopup="true"
              onClick={() => setOpenMenu(o => (o === 'examens' ? null : 'examens'))}
            >
              {t('sec_examens')}
              <Caret open={openMenu === 'examens'} />
            </button>

            {openMenu === 'examens' && (
              <div className="absolute left-0 top-full pt-3 w-[42rem]">
                <div
                  className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40"
                  style={{ boxShadow: '0 12px 32px rgba(0,43,109,0.14)' }}
                >
                  <div className="grid grid-cols-2 gap-x-4">
                    {LEVELS.map(level => (
                      <LevelColumn key={level} level={level} />
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-outline-variant/25">
                    <p className="px-3 pt-1 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/60">
                      {t('group_materiaal')}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4">
                      {EXAM_MATERIAL.map(item => (
                        <DropLink key={item.label} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* The foot carries the two intents a level column cannot: start somewhere, or
                      unlock everything. **Modules is reachable from the header only through here**,
                      so if this link goes the money page loses its nav entry. */}
                  <div className="mt-2 pt-3 px-3 border-t border-outline-variant/25 flex items-center justify-between gap-4">
                    <a
                      href={`/${locale}/oefenen`}
                      className="text-sm font-bold no-underline"
                      style={{ color: '#a24000' }}
                    >
                      {t('all_exams')} →
                    </a>
                    <Link
                      href="/premium"
                      className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors no-underline"
                    >
                      {t('premium')}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KNM and Over de docent — single-column panels. */}
          {CONTENT_SECTIONS.filter(s => s.id !== 'inburgeren').map(section => (
            <SingleColumnMenu key={section.id} section={section} />
          ))}

          {FEATURES.blog && (
            <Link href="/blog" className="text-on-surface-variant hover:text-primary transition-colors no-underline whitespace-nowrap">
              {t('blog')}
            </Link>
          )}
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

      {/* Mobile menu — the mockup's accordion. Every section is a row that opens in place, the
          level is a sub-heading rather than an extra layer of clicks, and the orange CTA sits at
          the bottom where the thumb is. */}
      {mobileOpen && (
        <div
          className="menu:hidden border-t border-outline-variant/30 max-h-[calc(100dvh-4.5rem)] overflow-y-auto"
          style={{ background: '#f8f9fb' }}
          aria-label={t('ariaMobile')}
        >
          <nav className="flex flex-col px-4 py-2">
            <MobileRow id="inburgeren" label={t('sec_inburgeren')}>
              {CONTENT_SECTIONS[0].items.map(item => (
                <DropLink key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </MobileRow>

            <MobileRow id="examens" label={t('sec_examens')}>
              {LEVELS.map(level => (
                <LevelColumn key={level} level={level} onNavigate={() => setMobileOpen(false)} />
              ))}
              <p className="px-3 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/60">
                {t('group_materiaal')}
              </p>
              {EXAM_MATERIAL.map(item => (
                <DropLink key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
              <a
                href={`/${locale}/oefenen`}
                onClick={() => setMobileOpen(false)}
                className="block px-3 pt-3 pb-1 text-sm font-bold no-underline"
                style={{ color: '#a24000' }}
              >
                {t('all_exams')} →
              </a>
              <Link
                href="/premium"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-on-surface-variant no-underline"
              >
                {t('premium')}
              </Link>
            </MobileRow>

            {CONTENT_SECTIONS.filter(s => s.id !== 'inburgeren').map(section => (
              <MobileRow key={section.id} id={section.id} label={t(`sec_${section.id}`)}>
                {section.items.map(item => (
                  <DropLink key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
                ))}
              </MobileRow>
            ))}

            {FEATURES.blog && (
              <Link
                href="/blog"
                onClick={() => setMobileOpen(false)}
                className="border-b border-outline-variant/20 px-3 py-3.5 text-base font-semibold text-on-surface no-underline"
              >
                {t('blog')}
              </Link>
            )}

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
              className="mt-3 mb-1 block text-center bg-secondary-container px-4 py-3 rounded-xl font-bold text-sm button-inner-glow no-underline"
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

  /** A single-column dropdown: Inburgeren, KNM, Over de docent. */
  function SingleColumnMenu({ section }: { section: NavSection }) {
    const open = openMenu === section.id;
    return (
      <div
        className="relative"
        onMouseEnter={() => setOpenMenu(section.id)}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <button
          type="button"
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpenMenu(o => (o === section.id ? null : section.id))}
        >
          {t(`sec_${section.id}`)}
          <Caret open={open} />
        </button>

        {open && (
          <div className="absolute left-0 top-full pt-3 w-80">
            <div
              className="flex flex-col p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40"
              style={{ boxShadow: '0 12px 32px rgba(0,43,109,0.14)' }}
            >
              {section.items.map(item => (
                (item.flag ?? true) && <DropLink key={item.label} item={item} />
              ))}
              {section.note && (
                <p
                  className="mx-1 mt-1 mb-0.5 px-3 py-2 rounded-lg text-xs font-medium leading-snug"
                  style={{ background: '#f2f8f5', color: '#2e7d5b' }}
                >
                  {t(`note_${section.id}`)}
                </p>
              )}
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
        {open && <div className="pb-2">{children}</div>}
      </div>
    );
  }
}
