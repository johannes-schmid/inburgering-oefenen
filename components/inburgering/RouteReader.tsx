'use client';

/**
 * `/inburgering` as one deel to open now — the owner's mockups of 2026-08-23 (desktop and mobile).
 *
 * It replaces the earlier hub — three fase cards over a full step list (`RouteExplorer`, deleted).
 * That list showed the whole route at once, which is a table of contents; this shows **the deel you
 * are up to**, what comes after it, and the three fasen with their progress beside it. Same data,
 * one decision instead of twenty. It is the standard shape for a hub from now on, guides added later included.
 *
 * **A deel is one `<h2>` of a guide**, numbered across the fase's guides in reading order — the same
 * unit `lib/guides/progress.ts` records and `GuideReader` pages through, so a deel read in the guide
 * shows as read here and vice versa. A deel links to its guide at its own anchor, and the guide's
 * reading view opens on that deel: this component navigates, it never renders article text.
 *
 * **Every fase's panel is rendered and the closed ones only carry `hidden`.** Rendering one panel is
 * how the hub once dropped two thirds of its internal links — on the site's main TOFU page, whose
 * whole job is to pass authority to its cluster. Each panel therefore also carries the hash-free
 * link to its guides: a URL with a fragment is the same page to a crawler, so those plain links are
 * what actually name the pages this hub points at.
 *
 * Switching fase changes no URL (`role="tab"`). Three near-identical thin pages in front of the
 * guides they link to is what a route per fase would have cost.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SkylineTopper, DocentSeal } from '@/components/horizon';
import { guideHref } from '@/data/guides/helpers';
import type { PhaseId } from '@/data/guides/phases';
import type { GuideSection } from '@/data/guides/types';
import GuideCover from '@/components/horizon/GuideCover';
import type { CoverGlyph } from '@/components/horizon/coverGlyphs';
import { useReadProgress } from '@/lib/guides/progress';

/** One deel: a guide's `<h2>`, flattened into its fase's reading order by the server. */
export type DeelView = {
  /** The `<h2 id>` — identical across nl/en/ar, which is what makes it a progress key. */
  id: string;
  title: string;
  minutes: number;
  slug: string;
  section: GuideSection;
  guideTitle: string;
  /** The guide's cover mark, so the panel can say *which* guide instead of drawing generic chrome. */
  coverGlyph: CoverGlyph;
  pillar: boolean;
};

export type RoutePhaseView = { id: PhaseId; number: number; delen: DeelView[] };

/** Read across a set of delen — the hero's line and the fase bars share this arithmetic. */
export function countRead(progress: Record<string, string[]>, delen: DeelView[]): number {
  return delen.reduce((n, d) => n + ((progress[d.slug] ?? []).includes(d.id) ? 1 : 0), 0);
}

export default function RouteReader({
  phases,
  initialPhase,
}: {
  phases: RoutePhaseView[];
  /** `?fase=` — a deep link from a guide's strip. Anything unrecognised is already fase 1. */
  initialPhase: PhaseId;
}) {
  const t = useTranslations('inburgering_route');
  const { progress, hydrated } = useReadProgress();
  const [open, setOpen] = useState<PhaseId>(initialPhase);

  const totals = useMemo(
    () =>
      Object.fromEntries(
        phases.map(p => [p.id, { read: countRead(progress, p.delen), total: p.delen.length }]),
      ) as Record<PhaseId, { read: number; total: number }>,
    [phases, progress],
  );

  /* Once progress is known, open the fase the reader has not finished — their place in the route,
     which beats always landing on fase 1. A deep link wins, and so does any fase they click. */
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    if (!hydrated || autoOpened) return;
    setAutoOpened(true);
    if (initialPhase !== phases[0].id) return;
    const unfinished = phases.find(p => totals[p.id].read < totals[p.id].total);
    if (unfinished) setOpen(unfinished.id);
  }, [hydrated, autoOpened, initialPhase, phases, totals]);

  const openPhase = phases.find(p => p.id === open) ?? phases[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
      <div>
        {phases.map(p => {
          const { read, total } = totals[p.id];
          /* The deel to open now: this fase's first unread one, or its last if the fase is
             finished — never `undefined`, because this card is the page's call to action. */
          const unread = p.delen.findIndex(d => !(progress[d.slug] ?? []).includes(d.id));
          const nextIdx = unread < 0 ? p.delen.length - 1 : unread;
          const current = p.delen[nextIdx];
          const guides = [...new Map(p.delen.map(d => [d.slug, d])).values()];
          return (
            <div
              key={p.id}
              role="tabpanel"
              id={`fase-panel-${p.id}`}
              aria-labelledby={`fase-tab-${p.id}`}
              hidden={p.id !== openPhase.id}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: '#a24000' }}>
                {t('phase_eyebrow', { number: p.number, label: t(`phase.${p.id}.label`) })}
                {' · '}
                {t('deel_n', { number: nextIdx + 1 })}
              </p>
              <h2
                className="font-headline font-bold text-center mb-8"
                style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}
              >
                {t(`phase.${p.id}.title`)}
              </h2>

              {/* The one deel to open now: the only card with a graphic panel and the only filled
                  button in the view. On a phone it is the whole screen, which is the point. */}
              <Link
                href={guideHref({ section: current.section, slug: current.slug }, current.id)}
                className="grid sm:grid-cols-[220px_1fr] rounded-2xl overflow-hidden no-underline"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  boxShadow: 'var(--shadow-ambient)',
                  textDecoration: 'none',
                }}
              >
                {/* The guide's own cover, not a generic banner. Same slot, same size — but it now
                    identifies the guide you are about to open, which is the one thing this panel
                    was not saying. `fill` because the slot sets its own box (220×150, not 400:250). */}
                <span className="relative overflow-hidden block min-h-[150px]">
                  <GuideCover
                    slug={current.slug}
                    field={current.section}
                    glyph={current.coverGlyph}
                    pillar={current.pillar}
                    fill
                    className="rounded-none"
                  />
                </span>
                <span className="block p-6">
                  <span className="block font-headline font-bold text-on-surface leading-snug mb-1" style={{ fontSize: '1.3rem' }}>
                    {current.title}
                  </span>
                  <span className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                    {current.guideTitle}
                  </span>
                  <span className="inline-flex flex-wrap items-center gap-3">
                    <span
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white"
                      style={{ background: '#002b6d' }}
                    >
                      {read > 0 ? t('continue_deel') : t('read_deel')}
                      <ArrowRight className="w-4 h-4 rtl-flip" aria-hidden="true" />
                    </span>
                    <span
                      className="inline-block text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1.5"
                      style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}
                    >
                      {t('minutes', { minutes: current.minutes })}
                    </span>
                  </span>
                </span>
              </Link>

              {/* What comes after it — the next two delen only, quiet (owner's mockup,
                  2026-08-23). This used to be every deel of the fase, numbered and ticked: a table
                  of contents under a card whose whole job is to say *this* is the deel you are up
                  to. Twenty rows also drowned the one eyebrow that answers "where am I". A reader
                  who wants the full list has the guide links below, and the fase bars beside. */}
              {p.delen.slice(nextIdx + 1, nextIdx + 3).length > 0 && (
                <ol className="list-none p-0 m-0 flex flex-col">
                  {p.delen.slice(nextIdx + 1, nextIdx + 3).map((d, i) => (
                    <li key={`${d.slug}:${d.id}`}>
                      {/* The dotted tie to the card above: it is the same route continuing, not a
                          second list. Rendered per row so the queue reads top to bottom. */}
                      <span
                        aria-hidden="true"
                        className="block mx-auto"
                        style={{
                          width: 0,
                          height: 18,
                          borderLeft: '2px dotted var(--color-outline-variant)',
                        }}
                      />
                      <Link
                        href={guideHref({ section: d.section, slug: d.slug }, d.id)}
                        className="grid sm:grid-cols-[220px_1fr] rounded-2xl overflow-hidden no-underline step-row"
                        style={{
                          background: 'var(--color-surface-container-lowest)',
                          boxShadow: 'var(--shadow-ambient)',
                          textDecoration: 'none',
                        }}
                      >
                        {/* Same street as the card above, on the neutral ramp — `locked` is the
                            system's not-yet state, and greying it with `opacity` is forbidden
                            (§7.2b). It is the shape that makes these read as cards in the queue
                            rather than as rows of a list. */}
                        <span
                          className="relative overflow-hidden hidden sm:block min-h-[150px]"
                          style={{ background: '#f2f4f6' }}
                          aria-hidden="true"
                        >
                          <span className="absolute inset-x-0 bottom-0 block">
                            <SkylineTopper locked houses={5} height={116} seed={p.number + i + 1} band={false} />
                          </span>
                        </span>
                        <span className="flex items-center gap-4 p-6">
                          <span className="min-w-0">
                            <span className="block font-headline font-bold leading-snug text-on-surface" style={{ fontSize: '1.15rem' }}>
                              {d.title}
                            </span>
                            <span className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-1">
                              {d.guideTitle} · {t('minutes', { minutes: d.minutes })}
                            </span>
                          </span>
                          {i === 0 && (
                            <span
                              className="ms-auto text-[11px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 flex-shrink-0"
                              style={{ background: 'rgba(254,118,44,0.12)', color: '#a24000' }}
                            >
                              {t('next_up')}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}

              {/* The fase's guides as plain, hash-free links — inside the panel, so every guide of
                  every fase has one in the document. See the header on why that matters. */}
              <div
                className="mt-6 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-3"
                style={{ background: 'var(--color-surface-container-low)' }}
              >
                <p className="text-sm text-on-surface-variant m-0">
                  {t('phase_note', { total, read })}
                </p>
                <span className="ms-auto flex flex-wrap gap-x-5 gap-y-2">
                  {guides.map(d => (
                    <Link
                      key={d.slug}
                      href={guideHref({ section: d.section, slug: d.slug })}
                      className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
                      style={{ color: '#a24000', textDecoration: 'none' }}
                    >
                      {t('whole_guide', { title: d.guideTitle })}
                      <ArrowRight className="w-3.5 h-3.5 rtl-flip" aria-hidden="true" />
                    </Link>
                  ))}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {/* The three fasen with their progress: the page's map, and also how you switch fase. */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--color-surface-container-lowest)', boxShadow: 'var(--shadow-ambient)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            {t('in_this_route')}
          </p>
          <div role="tablist" aria-label={t('tablist_label')} className="flex flex-col gap-4">
            {phases.map(p => {
              const { read, total } = totals[p.id];
              const active = p.id === openPhase.id;
              return (
                <button
                  key={p.id}
                  role="tab"
                  id={`fase-tab-${p.id}`}
                  aria-selected={active}
                  aria-controls={`fase-panel-${p.id}`}
                  onClick={() => setOpen(p.id)}
                  className="text-left cursor-pointer bg-transparent border-0 p-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span
                    className="block font-headline font-bold text-sm mb-0.5"
                    style={{ color: active ? '#a24000' : '#002b6d' }}
                  >
                    {t('phase_eyebrow', { number: p.number, label: t(`phase.${p.id}.label`) })}
                  </span>
                  <span className="block text-sm text-on-surface-variant mb-2">
                    {t('deel_count', { read, total })}
                  </span>
                  <span
                    className="block rounded-full overflow-hidden"
                    style={{ height: 6, background: 'var(--color-surface-container)' }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: total ? `${(read / total) * 100}%` : '0%',
                        background: 'var(--color-secondary-container)',
                        transition: 'width 520ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The claim the whole section rests on, once per page — §7.4 allows one trust mark in a
            view, and on this page this is it. */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface-container-low)' }}>
          {/* The seal's rings are box-shadows, so it needs room around it. */}
          <div className="pt-2 ps-2">
            <DocentSeal size={40} />
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed mt-3 m-0">{t('seal_note')}</p>
        </div>
      </div>
    </div>
  );
}
