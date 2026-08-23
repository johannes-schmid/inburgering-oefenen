/**
 * "Waar wil je meer over weten?" — the four modules of the platform, as the top of `/gidsen`.
 *
 * The owner's mockup of 2026-08-23. `/gidsen` used to open with a list of what is written; it opens
 * with **what the platform covers**, one card per module, because that is the question a visitor
 * arrives with. The list of individual guides still follows, and the fase-route below it is where a
 * reader who does not yet know which module applies to them starts.
 *
 * **Two cards are filled and two are placeholders, and that split is the catalogue, not a style
 * choice.** CLAUDE.md's brand rule: the traject is the promise, the *catalogue* is what is built,
 * and the two are stated separately on every surface. Taal A2 is live and KNM has a hub with its
 * eight thema's; **Taal B1 is `noindex` behind the docent's review gate and ONA is announced only**,
 * so neither may be drawn like a live module and neither links to a page we tell crawlers to ignore.
 * They link to what genuinely exists instead — the A2-versus-B1 explainer, and contact.
 *
 * The startgids banner sits **above** the cards (owner's instruction, overriding the mockup, which
 * has it last and calls it "onderaan" in the copy — that sentence moved with it). A visitor who
 * cannot pick a module should meet the route before the grid, not after scrolling past it.
 *
 * Everything here is a server component: no state, no progress, four links. The eight KNM thema's
 * and the four onderdelen are facts (`SEO/facts.md` §10 and `data/skills.ts`); the chips are read
 * from those, never typed in here.
 */
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { DotField } from '@/components/horizon';
import { SKILLS } from '@/data/skills';

/** The three KNM thema's named on the card, plus how many more there are. Eight in total. */
const KNM_THEMES = ['wonen', 'werk', 'waarden'] as const;
const KNM_TOTAL = 8;

function Chip({ children, tone }: { children: React.ReactNode; tone: 'onDark' | 'muted' }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1.5 text-sm font-semibold"
      style={
        tone === 'onDark'
          ? { background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.92)' }
          : { background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }
      }
    >
      {children}
    </span>
  );
}

/** The pill beside a module's name: what state it is in, in one word. */
function StateChip({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest align-middle"
      style={
        filled
          ? { background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }
          : { background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }
      }
    >
      {label}
    </span>
  );
}

export default async function ModuleOverview({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'gidsen.modules' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  return (
    <section className="px-6 py-14 sm:py-16">
      <div className="max-w-7xl mx-auto">
        {/* The heading and the lede sit side by side, as in the mockup: the question on the left,
            what to do about it on the right. Stacked below `lg`, question first. */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a24000' }}>
              {t('eyebrow')}
            </p>
            <h2
              className="font-headline font-extrabold m-0"
              style={{ color: '#002b6d', fontSize: 'clamp(1.9rem,4vw,2.75rem)', letterSpacing: '-0.02em', lineHeight: 1.08 }}
            >
              {t('heading')}
            </h2>
          </div>
          <p className="text-lg text-on-surface-variant leading-relaxed m-0 lg:pt-8">{t('lede')}</p>
        </div>

        {/* The startgids, moved above the grid — see the header. */}
        <Link
          href={{ pathname: '/inburgering/[slug]', params: { slug: 'inburgering-stappenplan' } }}
          className="relative overflow-hidden block rounded-2xl p-7 sm:p-9 mb-6 no-underline"
          style={{ background: 'var(--gradient-brand)', textDecoration: 'none' }}
        >
          <DotField />
          <span className="relative flex flex-wrap items-center gap-6">
            <span className="min-w-0 flex-1">
              <span
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {t('start_eyebrow')}
              </span>
              <span
                className="block font-headline font-extrabold text-white mb-2"
                style={{ fontSize: 'clamp(1.4rem,2.6vw,2rem)', letterSpacing: '-0.02em' }}
              >
                {t('start_title')}
              </span>
              <span className="block text-base leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {t('start_body')}
              </span>
            </span>
            <span
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-secondary-container text-on-secondary-container flex-shrink-0"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}
            >
              {t('start_cta')}
              <ArrowRight className="w-4 h-4 rtl-flip" aria-hidden="true" />
            </span>
          </span>
        </Link>

        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Taal A2: live. The four onderdelen come from `data/skills.ts`, which is the single
                 source of truth for the taxonomy — never a hand-typed list of four names. ── */}
          <Link
            href="/taalexamens"
            className="relative overflow-hidden block rounded-2xl p-7 no-underline"
            style={{ background: 'var(--gradient-brand)', textDecoration: 'none' }}
          >
            <DotField />
            <span className="relative block">
              <span className="flex flex-wrap items-center gap-3 mb-4">
                <span className="font-headline font-extrabold text-white m-0" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
                  {t('a2_title')}
                </span>
                <StateChip label={t('a2_state')} filled />
              </span>
              <span className="block text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.78)' }}>
                {t('a2_body')}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {SKILLS.map(skill => (
                  <Chip key={skill.slug} tone="onDark">
                    {tSkills(`${skill.key}.name`)}
                  </Chip>
                ))}
              </span>
            </span>
          </Link>

          {/* ── KNM: the hub and its eight thema's exist; the oefenexamens do not, and this card
                 does not mention them. The chip states a fact from `SEO/facts.md` §10. ── */}
          <Link
            href="/knm"
            className="relative overflow-hidden block rounded-2xl p-7 no-underline"
            style={{ background: '#a24000', textDecoration: 'none' }}
          >
            <DotField />
            <span className="relative block">
              <span className="flex flex-wrap items-center gap-3 mb-4">
                <span className="font-headline font-extrabold text-white m-0" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
                  {t('knm_title')}
                </span>
                <span
                  className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                >
                  {t('knm_state', { count: KNM_TOTAL })}
                </span>
              </span>
              <span className="block text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.82)' }}>
                {t('knm_body')}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {KNM_THEMES.map(theme => (
                  <Chip key={theme} tone="onDark">
                    {t(`knm_theme_${theme}`)}
                  </Chip>
                ))}
                <Chip tone="onDark">+{KNM_TOTAL - KNM_THEMES.length}</Chip>
              </span>
            </span>
          </Link>

          {/* ── Taal B1: authored, unreviewed, `noindex`. The card therefore links the A2-versus-B1
                 explainer — a real published page — and never `/oefenexamen/b1/…`, which would hand a
                 crawler exactly the page the robots tag tells it to ignore. ── */}
          <div className="rounded-2xl p-7" style={{ background: 'var(--color-surface-container-low)' }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="font-headline font-extrabold m-0" style={{ color: '#002b6d', fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
                {t('b1_title')}
              </h3>
              <StateChip label={t('b1_state')} filled={false} />
            </div>
            <p className="text-base text-on-surface-variant leading-relaxed mb-6">{t('b1_body')}</p>
            <Link
              href={{ pathname: '/blog/[slug]', params: { slug: 'taalniveaus-a1-a2-b1-nederlands' } }}
              className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
              style={{ color: '#a24000', textDecoration: 'none' }}
            >
              {t('b1_link')}
              <ArrowRight className="w-4 h-4 rtl-flip" aria-hidden="true" />
            </Link>
          </div>

          {/* ── ONA: announced, nothing built. No guide to link, so the honest destination is the
                 contact page — a placeholder that is a dead end is the one thing it must not be. ── */}
          <div className="rounded-2xl p-7" style={{ background: 'var(--color-surface-container-low)' }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="font-headline font-extrabold m-0" style={{ color: '#002b6d', fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
                {t('ona_title')}
              </h3>
              <StateChip label={t('ona_state')} filled={false} />
            </div>
            <p className="text-base text-on-surface-variant leading-relaxed mb-6">{t('ona_body')}</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
              style={{ color: '#a24000', textDecoration: 'none' }}
            >
              {t('ona_link')}
              <ArrowRight className="w-4 h-4 rtl-flip" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
