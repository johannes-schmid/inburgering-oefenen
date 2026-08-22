'use client';

/**
 * `/inburgering` as a route in three fasen, with the step list of the open fase beneath it.
 *
 * This replaces the grid of four equal guide cards. A grid answers "what have you written"; an
 * orienting reader is asking "where do I start and what comes next", and ~80% of this section's
 * search volume is that reader (`docs/MILESTONES.html` §3). So: three cards in order, one of them
 * open, and the open one's steps listed as a timeline with the reader's own progress on it.
 *
 * **Switching fase changes no URL and loads nothing.** All three step lists are rendered from props
 * computed on the server, and the card row is a `tablist`. Making each fase a route would have made
 * comparing them a page load each, and — the deciding reason — it would have put three
 * near-identical thin pages on indexable URLs in front of the guides they link to, competing with
 * their own content. The `?fase=` param is read once for a deep link and then not written back.
 *
 * **The steps are the guides' own `<h2>` sections, never a hand-written outline** (see
 * `lib/guides/sections.ts`). A step therefore always links to real text at a real anchor, and a
 * docent renaming a heading renames the step in the same edit.
 *
 * Progress is `lib/guides/progress.ts` — localStorage, hydrated in an effect. Before it hydrates
 * every counter reads 0, which is why the bars animate their width rather than being drawn at it:
 * a fresh reader sees them grow from empty, a returning reader sees them settle in one frame, and
 * neither sees a number jump.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { PhaseId } from '@/data/guides/phases';
import { useReadProgress, readCount } from '@/lib/guides/progress';
import PhaseIcon from './PhaseIcon';
import SituationCheck from './SituationCheck';

export type StepView = { id: string; title: string; minutes: number };
export type GuideView = { slug: string; title: string; sections: StepView[] };
export type PhaseView = { id: PhaseId; number: number; guides: GuideView[] };

export default function RouteExplorer({
  phases,
  initialPhase,
}: {
  phases: PhaseView[];
  initialPhase: PhaseId;
}) {
  const t = useTranslations('inburgering_route');
  const { progress, hydrated } = useReadProgress();
  const [open, setOpen] = useState<PhaseId>(initialPhase);

  /* Per fase: how many of its steps are read, and how many there are. A fase's steps are the
     concatenation of its guides' sections, so the counter is summed per guide — `readCount` is
     keyed by guide slug because that is what the store is keyed by. */
  const totals = useMemo(
    () =>
      Object.fromEntries(
        phases.map(p => [
          p.id,
          {
            read: p.guides.reduce(
              (n, g) => n + readCount(progress, g.slug, g.sections.map(s => s.id)),
              0,
            ),
            total: p.guides.reduce((n, g) => n + g.sections.length, 0),
          },
        ]),
      ) as Record<PhaseId, { read: number; total: number }>,
    [phases, progress],
  );

  /* Once progress is known, open the first fase that is not finished — the reader's place in the
     route, which is more useful than always landing on fase 1. A deep link (`?fase=`) wins, and so
     does any card the reader has since clicked, hence the one-shot ref-free guard on `hydrated`. */
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    if (!hydrated || autoOpened) return;
    setAutoOpened(true);
    if (initialPhase !== 'orienteren') return;
    const unfinished = phases.find(p => totals[p.id].read < totals[p.id].total);
    if (unfinished) setOpen(unfinished.id);
  }, [hydrated, autoOpened, initialPhase, phases, totals]);

  const openPhase = phases.find(p => p.id === open) ?? phases[0];

  /* The one step marked "current" per fase — the fase's first unread step, not each guide's.
     A fase can hold more than one guide, and a per-list `findIndex` gave fase 1 two orange "current"
     rows, one per guide. Two current steps is worse than none: the marker's whole job is to say
     where to resume, and there is one place to resume. */
  const currentOf = useMemo(() => {
    const map = new Map<PhaseId, { slug: string; id: string } | null>();
    for (const p of phases) {
      let found: { slug: string; id: string } | null = null;
      for (const g of p.guides) {
        const done = new Set(progress[g.slug] ?? []);
        const next = g.sections.find(s => !done.has(s.id));
        if (next) { found = { slug: g.slug, id: next.id }; break; }
      }
      map.set(p.id, found);
    }
    return map;
  }, [phases, progress]);

  return (
    <>
      {/* ── The three fasen ── */}
      <div
        role="tablist"
        aria-label={t('tablist_label')}
        className="grid gap-4 md:grid-cols-3 mb-10"
      >
        {phases.map((p, i) => {
          const active = p.id === openPhase.id;
          const { read, total } = totals[p.id];
          const complete = total > 0 && read === total;
          return (
            <div key={p.id} className="relative flex items-stretch">
              <button
                role="tab"
                id={`fase-tab-${p.id}`}
                aria-selected={active}
                aria-controls={`fase-panel-${p.id}`}
                onClick={() => setOpen(p.id)}
                className="flex-1 text-left rounded-2xl p-6 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 phase-card"
                style={{
                  background: active ? 'var(--gradient-brand)' : 'var(--color-surface-container-lowest)',
                  /* The inactive card carries a hairline instead of only a shadow: three white
                     cards on a near-white surface otherwise read as one panel. */
                  border: active ? '1px solid transparent' : '1px solid var(--color-outline-variant)',
                  boxShadow: active
                    ? '0 8px 32px rgba(0,43,109,0.22)'
                    : '0 2px 12px rgba(0,43,109,0.05)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex items-center justify-center rounded-full font-headline font-bold text-xs flex-shrink-0"
                    style={{
                      width: 26,
                      height: 26,
                      background: active ? 'rgba(255,255,255,0.16)' : 'rgba(0,43,109,0.07)',
                      color: active ? '#fff' : '#002b6d',
                    }}
                    aria-hidden="true"
                  >
                    {p.number}
                  </span>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: active ? 'rgba(255,255,255,0.72)' : '#a24000' }}
                  >
                    {t(`phase.${p.id}.label`)}
                  </span>
                  <PhaseIcon
                    phase={p.id}
                    className="ms-auto"
                    /* The drawing inherits the card's colour — see PhaseIcon's header. */
                  />
                </div>

                <h3
                  className="font-headline font-bold leading-snug mb-2"
                  style={{ color: active ? '#fff' : 'var(--color-on-surface)', fontSize: '1.0625rem' }}
                >
                  {t(`phase.${p.id}.title`)}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-5"
                  style={{ color: active ? 'rgba(255,255,255,0.66)' : 'var(--color-on-surface-variant)' }}
                >
                  {t(`phase.${p.id}.body`)}
                </p>

                {/* Progress. Orange fill on both card states, because it is the one element whose
                    meaning must not change with the card's colour. */}
                <div
                  className="rounded-full overflow-hidden mb-2"
                  style={{
                    height: 4,
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,43,109,0.09)',
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: total ? `${(read / total) * 100}%` : '0%',
                      background: 'var(--color-secondary-container)',
                      transition: 'width 520ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </div>
                <p
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: active ? 'rgba(255,255,255,0.6)' : 'var(--color-on-surface-variant)' }}
                >
                  {complete && (
                    <Check
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--color-secondary-container)' }}
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  )}
                  {t('read_of', { read, total })}
                </p>
              </button>

              {/* The connector between cards. Decorative, and only on the three-across layout —
                  stacked, the cards already read top-to-bottom. */}
              {i < phases.length - 1 && (
                <span
                  className="hidden md:flex items-center justify-center absolute top-1/2 -end-4 w-4"
                  style={{ transform: 'translateY(-50%)' }}
                  aria-hidden="true"
                >
                  <ArrowRight
                    className="w-4 h-4 rtl-flip"
                    style={{ color: 'var(--color-outline-variant)' }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── The fasen's steps, and the hulpmiddel ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        {/* **Every** panel is rendered and the closed ones carry `hidden`, rather than only the
            open one being in the tree. That is not a React nicety: with one panel rendered, the hub
            linked the guides of fase 1 and no others, so fase 2's and fase 3's guides had no
            internal link from their own hub — on the site's main TOFU page, whose whole job is to
            pass authority down to its cluster. Two e2e assertions caught it. `hidden` keeps the
            closed panels out of the accessibility tree and out of the layout while leaving their
            links in the document. */}
        <div>
          {phases.map(p => {
            const t2 = totals[p.id];
            const cur = currentOf.get(p.id) ?? null;
            return (
              <div
                key={p.id}
                role="tabpanel"
                id={`fase-panel-${p.id}`}
                aria-labelledby={`fase-tab-${p.id}`}
                hidden={p.id !== openPhase.id}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a24000' }}>
                    {t('phase_eyebrow', { number: p.number, label: t(`phase.${p.id}.label`) })}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {t('steps_read_of', { read: t2.read, total: t2.total })}
                  </p>
                </div>
                <h2
                  className="font-headline font-bold text-on-surface mb-6"
                  style={{ fontSize: '1.6rem', letterSpacing: '-0.01em' }}
                >
                  {t(`phase.${p.id}.title`)}
                </h2>

                {p.guides.map((g, gi) => (
                  <StepList
                    key={g.slug}
                    guide={g}
                    progress={progress[g.slug] ?? []}
                    currentId={cur?.slug === g.slug ? cur.id : null}
                    /* The guide's own name is a heading only when the fase holds more than one —
                       with a single guide it restates the fase title directly above it, and for
                       fase 2 it is the same string. The "hele gids" link below every list is what
                       guarantees each guide a plain, hash-free internal link either way. */
                    showTitle={p.guides.length > 1}
                    className={gi > 0 ? 'mt-8' : ''}
                  />
                ))}
              </div>
            );
          })}
        </div>

        <SituationCheck />
      </div>
    </>
  );
}

/**
 * One guide's sections as a timeline.
 *
 * The marker column carries three states and they must stay visually distinct — the same rule the
 * portal's exam slots follow. A read step is a filled navy check, the **current** step (the first
 * unread one) is a filled orange number, and a later step is an outlined grey number. One "locked"
 * look for the last two would remove the only thing the list is for: showing where to resume.
 */
function StepList({
  guide,
  progress,
  currentId,
  showTitle,
  className = '',
}: {
  guide: GuideView;
  progress: string[];
  /** The fase's single current step, if it falls in this guide. Decided by the caller — see there. */
  currentId: string | null;
  showTitle: boolean;
  className?: string;
}) {
  const t = useTranslations('inburgering_route');
  const done = new Set(progress);

  return (
    <div className={className}>
      {showTitle && (
        <Link
          href={{ pathname: '/inburgering/[slug]', params: { slug: guide.slug } }}
          className="inline-flex items-center gap-1.5 mb-3 font-headline font-bold text-sm no-underline hover:opacity-80 transition-opacity"
          style={{ color: '#002b6d', textDecoration: 'none' }}
        >
          {guide.title}
          <ArrowRight className="w-3.5 h-3.5 rtl-flip" aria-hidden="true" />
        </Link>
      )}

      <ol className="list-none p-0 m-0 flex flex-col">
        {guide.sections.map((s, i) => {
          const read = done.has(s.id);
          const current = s.id === currentId;
          const last = i === guide.sections.length - 1;
          return (
            <li key={s.id} className="flex gap-4">
              {/* Marker + the rail to the next step. The rail is dashed below the current step and
                  solid above it, so "how far have I got" is legible without reading a single row. */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 34 }}>
                <span
                  className="flex items-center justify-center rounded-full font-headline font-bold text-xs"
                  style={{
                    width: 34,
                    height: 34,
                    background: read ? '#002b6d' : current ? 'var(--color-secondary-container)' : 'var(--color-surface-container)',
                    color: read || current ? '#fff' : 'var(--color-on-surface-variant)',
                    border: read || current ? 'none' : '1.5px solid var(--color-outline-variant)',
                  }}
                  aria-hidden="true"
                >
                  {read ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                {!last && (
                  <span
                    className="flex-1 my-1"
                    style={{
                      width: 0,
                      borderLeft: read ? '2px solid #002b6d' : '2px dashed var(--color-outline-variant)',
                      minHeight: 18,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>

              <Link
                href={{ pathname: '/inburgering/[slug]', params: { slug: guide.slug }, hash: s.id }}
                className="flex-1 mb-3 rounded-2xl px-5 py-4 no-underline group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 step-row"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: `1.5px solid ${current ? 'var(--color-secondary-container)' : 'var(--color-outline-variant)'}`,
                  textDecoration: 'none',
                }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-headline font-bold text-on-surface leading-snug">
                    {s.title}
                  </span>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                    style={{
                      background: current ? 'rgba(254,118,44,0.12)' : 'var(--color-surface-container)',
                      color: current ? '#a24000' : 'var(--color-on-surface-variant)',
                    }}
                  >
                    {t('minutes', { minutes: s.minutes })}
                  </span>
                  <span
                    className="ms-auto inline-flex items-center gap-1 text-sm font-semibold"
                    style={{ color: read ? 'var(--color-on-surface-variant)' : '#002b6d' }}
                  >
                    {read ? t('read_again') : t('read_step')}
                    <ArrowRight className="w-3.5 h-3.5 step-row-arrow" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* The guide itself, without an anchor. Two jobs, and both matter:
          the reader who would rather read the whole thing top to bottom than pick a step, and the
          crawler — this is every guide's one plain internal link from its hub, which is what a
          pillar-cluster hub exists to give. Never remove it in favour of the step anchors: a URL
          with a fragment is the same page to a crawler, but the *hub's* job is to name the page. */}
      <Link
        href={{ pathname: '/inburgering/[slug]', params: { slug: guide.slug } }}
        className="inline-flex items-center gap-1.5 mt-1 mb-1 text-sm font-semibold no-underline hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg transition-opacity"
        style={{ color: '#002b6d', textDecoration: 'none' }}
      >
        {t('whole_guide', { title: guide.title })}
        <ArrowRight className="w-3.5 h-3.5 rtl-flip" aria-hidden="true" />
      </Link>
    </div>
  );
}
