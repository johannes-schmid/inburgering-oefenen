'use client';

/**
 * A kennisgids read as **delen** — one section at a time, with an overview in front of it.
 *
 * The owner's mockups of 2026-08-23, and from now on the shape of every guide on the site. Before
 * this a guide was one 10–25 minute scroll with its outline in the sidebar: the outline told you the
 * shape and then handed you the whole wall anyway. These guides are read by people finding out
 * whether a rule applies to them, at A2, often on a phone. What they need is one deel, an obvious
 * next one, and a way back.
 *
 * **The whole article stays in the DOM at one URL, and that is the load-bearing constraint.** Every
 * deel is rendered and the closed ones carry `hidden` — the same rule `RouteReader` and `GuideHub`
 * are written to, after rendering one panel silently dropped two thirds of a hub's internal links.
 * Splitting a guide into `/gids/deel-3` routes would have been the obvious implementation and the
 * wrong one: the pillar earns its position as **one** page, ten thin URLs would compete with it and
 * with each other, and "one query, one owning page" (`SEO/README.md`) is a rule this repo has
 * already applied twice against duplicates of its own making. So paging is a *view*, never a route.
 * A deel is deep-linkable by its `<h2 id>` — the anchors the docent's own headings already carry,
 * identical across nl/en/ar, which is also what makes them progress keys.
 *
 * Three decisions worth keeping:
 *
 * - **"Lees de hele gids in één keer" is a promise, not a fallback.** The article was written and
 *   reviewed as a whole; a reader who wants the whole thing gets it in one click from either view.
 * - **A deel counts as read when the reader leaves it forwards**, never when it opens — the same
 *   rule `GuideSectionNav` set for scrolling. Progress that fills up because someone clicked fast
 *   makes the numbers on `/inburgering` and `/gidsen` meaningless.
 * - **The eyebrow names a fase only when the guide is in one** (`phaseOfGuide`). A KNM or
 *   Taalexamens guide reads "Deel 2 · 4 min" and claims no place in a route it is not part of.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ListTree } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { hubHref } from '@/data/guides/helpers';
import type { GuideSection } from '@/data/guides/types';
import type { GuidePart } from '@/lib/guides/sections';
import { markSectionRead, useReadProgress } from '@/lib/guides/progress';

type Props = {
  slug: string;
  section: GuideSection;
  guideTitle: string;
  /** Everything above the guide's first `<h2>`. On the overview, never inside a deel. */
  intro: string;
  parts: GuidePart[];
  /** "Fase 1 · Oriënteren", already translated by the server. Absent outside the route. */
  phaseLabel?: string;
  /** The draft banner and the untranslated-locale notice. Above everything, in every view. */
  notices?: ReactNode;
  /** The blocks that close the article — FAQ, the reviewed-by line, the CTA. Always visible. */
  trailing: ReactNode;
  /** The sidebar's existing cards (situatie-check, CTA, related), below the delen list. */
  sidebar: ReactNode;
  /** Set when this locale has no translated body: LTR Dutch inside an otherwise RTL page. */
  bodyDir?: 'ltr';
};

/**
 * One block of the reading column. The reader used to be a single white card holding everything —
 * intro, launcher, delen list, FAQ, CTA — which on the pillar was a 3,000px sheet with no seams in
 * it (owner, 2026-08-23). Each region is its own card now, separated by the column's gap: the
 * no-line rule (§2) says a boundary is a surface shift, and this is that shift.
 */
const CARD = 'bg-surface-container-lowest rounded-2xl p-6 sm:p-8 md:p-10';
const CARD_SHADOW = { boxShadow: '0 2px 32px rgba(0,43,109,0.06)' } as const;

/**
 * `read` is one deel, `all` is the article in one piece. **There is deliberately no overview.**
 * It was a launcher page in front of the guide — intro, one card, the delen list — and a reader who
 * clicked a guide had to make a second choice before reading a word (owner, 2026-08-23). The list it
 * held is the sidebar's, which is on every deel anyway.
 */
type View = 'read' | 'all';

export default function GuideReader({
  slug,
  section,
  guideTitle,
  intro,
  parts,
  phaseLabel,
  notices,
  trailing,
  sidebar,
  bodyDir,
}: Props) {
  const t = useTranslations('guides.reader');
  const tR = useTranslations('inburgering_route');
  const { progress } = useReadProgress();
  const done = useMemo(() => new Set(progress[slug] ?? []), [progress, slug]);

  const [view, setView] = useState<View>('read');
  const [index, setIndex] = useState(0);

  /* A deep link opens its deel. Read in an effect: `location` does not exist on the server, and
     reading it during render costs a hydration mismatch on every guide page. `hashchange` is
     handled too — the sidebar of another surface may link a second anchor on the same page. */
  useEffect(() => {
    const fromHash = () => {
      const hash = decodeURIComponent(window.location.hash.replace('#', ''));
      if (!hash) return;
      const i = parts.findIndex(p => p.id === hash);
      if (i >= 0) { setIndex(i); setView('read'); }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [parts]);

  /* The reader opens on deel 1, deliberately, and not on the first *unread* deel. A guide is one
     page with a fixed order and a reader arriving from search or from the hub has said which deel
     they want (the hash) or nothing at all — silently starting them in the middle of an argument
     they have not read is worse than a paragraph they can skip. The sidebar shows what is read. */

  const cardRef = useRef<HTMLDivElement>(null);

  const open = useCallback((i: number) => {
    setIndex(i);
    setView('read');
    /* The bar and the title are above the fold of the *previous* deel, so a click that only swaps
       the body would leave the reader mid-page in text they did not choose. Scroll to the top of
       the reader itself, not of the page: sending the reader back past the hero on every deel
       makes them re-scroll through the header to carry on reading. The nav height is subtracted
       because the header is fixed and the reading bar sticks directly under it. */
    const el = cardRef.current;
    if (!el) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const navH = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
    ) || 0;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  /* Forwards marks the deel behind you read — see the header. */
  const goNext = useCallback(() => {
    markSectionRead(slug, parts[index].id);
    if (index + 1 < parts.length) open(index + 1);
  }, [slug, parts, index, open]);

  return (
    <>
      {/* The white card is rendered here rather than by the page, because `.article-layout` is a
          two-column grid and its two children are this card and the aside — both of which need the
          reader's state. */}
      <div ref={cardRef} className="flex flex-col gap-6 min-w-0">
      {notices}

      {/* ── The reading bar. Only in a deel: on the overview the hero above already says which
             guide this is, and a second title bar would be the third heading on one screen. ── */}
      {view === 'read' && (
        <div
          className="sticky z-30 overflow-hidden rounded-2xl"
          style={{ top: 'var(--nav-h)', background: 'var(--color-surface-container-lowest)', ...CARD_SHADOW }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
            <Link
              href={hubHref(section)}
              className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
              style={{ color: '#002b6d', textDecoration: 'none' }}
            >
              <ChevronLeft className="w-4 h-4 rtl-flip" aria-hidden="true" />
              {t('all_guides')}
            </Link>
            <p className="text-sm text-on-surface-variant m-0 min-w-0 truncate hidden sm:block">
              {phaseLabel ? `${guideTitle} · ${phaseLabel}` : guideTitle}
            </p>
            <div className="ms-auto flex items-center gap-3">
              {/* One pill per deel: the shape of the guide at a glance, and it never needs a number
                  read to say "nearly there". Decorative — the count beside it is the statement. */}
              <span className="hidden sm:flex items-center gap-1" aria-hidden="true">
                {parts.map((p, i) => (
                  <span
                    key={p.id}
                    className="rounded-full"
                    style={{
                      width: i === index ? 18 : 7,
                      height: 7,
                      background: i === index
                        ? 'var(--color-secondary-container)'
                        : done.has(p.id) ? '#002b6d' : 'var(--color-outline-variant)',
                    }}
                  />
                ))}
              </span>
              <p className="text-sm font-bold text-on-surface m-0 whitespace-nowrap">
                {t('part_of', { number: index + 1, total: parts.length })}
              </p>
            </div>
          </div>
          <div style={{ height: 3, background: 'var(--color-surface-container)' }}>
            <div
              style={{
                height: 3,
                width: `${((index + 1) / parts.length) * 100}%`,
                background: 'var(--color-secondary-container)',
                transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </div>
        </div>
      )}

      {/* ── One deel. Every one is rendered; the closed ones are `hidden` — see the header. ── */}
      {parts.map((p, i) => (
        <div key={p.id} hidden={!(view === 'read' && i === index)} className={CARD} style={CARD_SHADOW}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a24000' }}>
            {[phaseLabel, t('part_n', { number: i + 1 }), tR('minutes', { minutes: p.minutes })]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {/* The guide's opening paragraphs — everything above its first `<h2>`. They belong to
              deel 1 now that there is no overview to carry them; dropping them would delete the
              text that says what the guide is. */}
          {i === 0 && intro.trim() && (
            <div
              className="article-body mb-8"
              dir={bodyDir}
              lang={bodyDir === 'ltr' ? 'nl' : undefined}
              dangerouslySetInnerHTML={{ __html: intro }}
            />
          )}
          {/* The deel's title is this view's own heading, which is why `guideParts` leaves the `<h2>`
              out of the body. The `id` stays on it so a deep link still resolves — and so
              `tests/public.spec.js`'s "every outline href points at a heading that exists" holds. */}
          <h2
            id={p.id}
            className="font-headline font-bold mb-6"
            style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.2rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            {p.title}
          </h2>
          <div
            className="article-body"
            dir={bodyDir}
            lang={bodyDir === 'ltr' ? 'nl' : undefined}
            dangerouslySetInnerHTML={{ __html: p.html }}
          />

          {/* What comes next, named. A bare "volgende" arrow asks the reader to trust the guide's
              ordering; the title is what makes carrying on a decision. */}
          {i + 1 < parts.length ? (
            <button
              type="button"
              onClick={goNext}
              className="w-full text-left mt-10 rounded-2xl p-6 cursor-pointer border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.995] transition-transform"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.66)' }}>
                {t('next_up')} · {t('part_n', { number: i + 2 })}
              </span>
              <span className="flex flex-wrap items-center gap-3">
                <span className="font-headline font-bold text-white" style={{ fontSize: '1.15rem' }}>
                  {parts[i + 1].title}
                </span>
                <span
                  className="ms-auto inline-flex items-center gap-1.5 text-sm font-bold"
                  style={{ color: 'var(--color-secondary-container)' }}
                >
                  {t('read_on')}
                  <ArrowRight className="w-4 h-4 rtl-flip" aria-hidden="true" />
                </span>
              </span>
            </button>
          ) : (
            /* The last deel ends on the way out, not on a dead end — and it has to *go* somewhere.
               With no overview left to return to it marked the deel read and did nothing visible,
               which reads as a broken button. It is a link to the hub now: that is where the rest of
               the route is, and marking read on the way is what fills the bar the reader lands on. */
            <Link
              href={hubHref(section)}
              onClick={() => markSectionRead(slug, parts[i].id)}
              className="mt-10 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: '#002b6d', textDecoration: 'none' }}
            >
              <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
              {t('finish')}
              <ArrowRight className="w-4 h-4 rtl-flip" aria-hidden="true" />
            </Link>
          )}

          <div
            className="mt-10 pt-6 flex flex-wrap gap-6 justify-between"
            style={{ borderTop: '1px solid var(--color-outline-variant)' }}
          >
            {i > 0 ? (
              <button
                type="button"
                onClick={() => open(i - 1)}
                className="text-left cursor-pointer bg-transparent border-0 p-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  <ArrowLeft className="w-3.5 h-3.5 rtl-flip" aria-hidden="true" />
                  {t('previous')}
                </span>
                <span className="font-headline font-bold text-sm" style={{ color: '#002b6d' }}>
                  {parts[i - 1].title}
                </span>
              </button>
            ) : (
              <span />
            )}
            {i + 1 < parts.length && (
              <button
                type="button"
                onClick={goNext}
                className="text-right ms-auto cursor-pointer bg-transparent border-0 p-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  {t('next')}
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" aria-hidden="true" />
                </span>
                <span className="font-headline font-bold text-sm" style={{ color: '#002b6d' }}>
                  {parts[i + 1].title}
                </span>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* ── The whole thing, for whoever wants it that way ── */}
      <div hidden={view !== 'all'} className={CARD} style={CARD_SHADOW}>
        <button
          type="button"
          onClick={() => setView('read')}
          className="inline-flex items-center gap-1.5 mb-6 text-sm font-bold cursor-pointer bg-transparent border-0 p-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: '#002b6d' }}
        >
          <ChevronLeft className="w-4 h-4 rtl-flip" aria-hidden="true" />
          {t('back_to_parts')}
        </button>
        {/* The headings here carry no `id`: the delen above own the anchors, and two elements with
            the same id would make every deep link's target the luck of document order. */}
        <div className="article-body" dir={bodyDir} lang={bodyDir === 'ltr' ? 'nl' : undefined}>
          <div dangerouslySetInnerHTML={{ __html: intro }} />
          {parts.map(p => (
            <div key={p.id}>
              <h2>{p.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: p.html }} />
            </div>
          ))}
        </div>
      </div>

      {trailing}
      </div>

      {/* The sidebar is rendered from here because the delen list and the reading view share one
          piece of state. `.sidebar` is the layout's own class, so `.article-layout` keeps its two
          columns and its sticky behaviour. */}
      <aside className="sidebar">
        <nav
          className="rounded-2xl p-6"
          aria-label={tR('nav_label')}
          style={{ background: 'var(--color-surface-container-lowest)', boxShadow: 'var(--shadow-ambient)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            {t('parts_in_guide')}
          </p>
          {phaseLabel && (
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a24000' }}>
              {phaseLabel}
            </p>
          )}
          <ol className="list-none p-0 m-0 flex flex-col gap-1 mt-2">
            {parts.map((p, i) => {
              const isRead = done.has(p.id);
              const isCurrent = view === 'read' && i === index;
              return (
                <li key={p.id}>
                  {/* A real `<a href="#id">`, not a button: it is the guide's own outline, it must
                      work before hydration and be followable by a crawler, and the `hashchange`
                      listener above is what turns it into "open that deel". */}
                  <a
                    href={`#${p.id}`}
                    onClick={() => open(i)}
                    aria-current={isCurrent ? 'true' : undefined}
                    className="w-full text-left flex items-center gap-2.5 rounded-xl px-2.5 py-2 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      textDecoration: 'none',
                      background: isCurrent ? 'var(--color-surface-container-low)' : 'transparent',
                      boxShadow: isCurrent ? 'var(--ring-selected)' : undefined,
                    }}
                  >
                    <span
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        width: 18,
                        height: 18,
                        background: isRead ? '#002b6d' : isCurrent ? 'var(--color-secondary-container)' : 'transparent',
                        border: isRead || isCurrent ? 'none' : '1.5px solid var(--color-outline-variant)',
                      }}
                      aria-hidden="true"
                    >
                      {isRead && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    <span
                      className="text-sm leading-snug"
                      style={{
                        color: isCurrent ? '#002b6d' : 'var(--color-on-surface-variant)',
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      {p.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={() => setView('all')}
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold cursor-pointer bg-transparent border-0 p-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: '#a24000' }}
          >
            <ListTree className="w-4 h-4" aria-hidden="true" />
            {t('read_whole')}
          </button>
          {/* The hub, so a reader who is in the wrong guide can leave without the back button. */}
          <Link
            href={hubHref(section)}
            className="flex items-center gap-1.5 mt-3 text-sm font-semibold no-underline"
            style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}
          >
            <ChevronLeft className="w-4 h-4 rtl-flip" aria-hidden="true" />
            {t('all_guides')}
          </Link>
        </nav>

        {sidebar}
      </aside>
    </>
  );
}
