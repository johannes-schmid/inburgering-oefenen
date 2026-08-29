'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CategoryMark, LevelMark } from '@/components/horizon';
import type { Category } from '@/components/horizon';
import type { Level, OnderdeelSlug } from '@/data/skills';

/**
 * Picking an examen and then an onderdeel — the `/oefenen` entry point.
 *
 * Implements **flow 1b** of `Gratis Oefenen Opties.dc.html` (Claude Design, imported 2026-08-28):
 * the four examens are a tile row and the chosen tile opens onto its onderdelen. It replaces the
 * three stacked grids ("Niveau A2" / "Ook op niveau B1" / KNM), which listed nine cards at once
 * and asked the visitor to work out from the headings that A2 and B1 are the *same four
 * onderdelen* twice.
 *
 * ## Desktop and mobile are two different flows, deliberately
 *
 * - **Desktop** is one screen: the row plus an open panel underneath, A2 pre-selected. Nothing
 *   is hidden, so the full scope — including ONA on the roadmap — is visible at a glance.
 * - **Mobile is two screens** (owner's instruction): four examens with their marks do not fit
 *   above the fold *and* leave room for four onderdeel rows. Screen 1 is the 2×2 examen grid;
 *   tapping one replaces it with the onderdeel list, which carries a back control, the other
 *   examens as chips, and "stap 2 van 2" so the visitor always knows where they are.
 *
 * Both render from the same `tracks` array and the same `selected` state — a second data path
 * for the phone is how the two drift apart. `selected === null` is the mobile step-1 state; the
 * desktop panel falls back to `a2`, so nothing is ever blank there.
 *
 * ## Everything it renders is passed in
 *
 * No lookups here: the server page resolves which onderdelen actually have a taster, which need
 * an account, and where each one links. A client component that re-derived that would need the
 * exam registry in the browser bundle, and could disagree with the routes' own
 * `generateStaticParams` — which is exactly how a card that 404s gets shipped.
 */

export type ChooserPart = {
  slug: OnderdeelSlug;
  name: string;
  /** One line under the name — what the visitor gets, not what the onderdeel is. */
  note: string;
  href: string;
  /** Rubric-graded: the answer is marked per criterium, so it needs an account first. */
  needsAccount: boolean;
};

export type ChooserTrack = {
  id: 'knm' | Level | 'ona';
  name: string;
  /** The count under the name in the tile — "8 thema's", "4 onderdelen". */
  subtitle: string;
  /** The sentence above the onderdeel list once the track is open. */
  blurb: string;
  parts: ChooserPart[];
};

type Props = { tracks: ChooserTrack[]; locale: string };

export default function FreePracticeChooser({ tracks }: Props) {
  const t = useTranslations('oefenen');
  const [selected, setSelected] = useState<ChooserTrack['id'] | null>(null);

  const openable = tracks.filter(tr => tr.parts.length > 0);
  const desktopTrack = tracks.find(tr => tr.id === (selected ?? 'a2')) ?? openable[0];
  const mobileTrack = selected === null ? null : tracks.find(tr => tr.id === selected) ?? null;

  return (
    <>
      {/* ── Desktop: the row and the open panel on one screen ─────────────── */}
      <div className="hidden md:block">
        <p className="text-xs font-extrabold text-on-surface-variant uppercase mb-3" style={{ letterSpacing: '0.14em' }}>
          {t('choose_exam')}
        </p>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 list-none p-0 m-0">
          {tracks.map(track => (
            <li key={track.id}>
              <TrackTile
                track={track}
                active={desktopTrack?.id === track.id}
                onSelect={() => setSelected(track.id)}
                soonLabel={t('track_soon')}
              />
            </li>
          ))}
        </ul>

        {/* Every track's panel is rendered and the closed ones get `hidden`.
            **Not** `selected === track.id && <Panel/>`: with only the open panel in the DOM, the
            B1 and KNM tasters have no internal link from `/oefenen` at all — on the page that is
            the entry point of the whole free funnel, and the one that should be passing authority
            to them. That is the same bug `/inburgering`'s fase-panelen shipped once; `tsc`, the
            build and every screenshot were clean both times, and only a look at the served HTML
            found it. */}
        {openable.map(track => (
          <div
            key={track.id}
            hidden={track.id !== desktopTrack?.id}
            className="mt-5 rounded-3xl p-6 lg:p-7 bg-surface-container-low"
          >
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 mb-5">
              <h2 className="font-headline font-extrabold text-on-surface text-xl tracking-tight m-0">
                {t('panel_heading', { track: track.name })}
              </h2>
              <p className="text-sm text-on-surface-variant m-0">{track.blurb}</p>
            </div>
            <ul className="grid lg:grid-cols-2 gap-3.5 list-none p-0 m-0">
              {track.parts.map(part => (
                <li key={part.slug}>
                  <PartRow part={part} accountLabel={t('row_account_badge')} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Mobile step 1: which examen ───────────────────────────────────── */}
      <div className={mobileTrack ? 'hidden' : 'md:hidden'}>
        <p className="text-xs font-extrabold text-on-surface-variant uppercase mb-3" style={{ letterSpacing: '0.14em' }}>
          {t('choose_exam')}
        </p>
        <ul className="grid grid-cols-2 gap-3 list-none p-0 m-0">
          {tracks.map(track => (
            <li key={track.id}>
              <TrackTile
                track={track}
                stacked
                active={false}
                onSelect={() => setSelected(track.id)}
                soonLabel={t('track_soon')}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* ── Mobile step 2: which onderdeel ────────────────────────────────── */}
      {mobileTrack && (
        <div className="md:hidden">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-sm font-semibold text-primary border-0 cursor-pointer"
            >
              <ArrowLeft size={15} strokeWidth={2.2} className="rtl-flip" aria-hidden="true" />
              {t('choose_exam')}
            </button>
            <span className="text-xs text-on-surface-variant ms-auto">{t('step_two')}</span>
          </div>

          {/* The other examens stay one tap away — the back control is the way *up*, these are
              the way *across*, and without them switching level is two taps and a re-read. */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {openable.map(track => {
              const on = track.id === mobileTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelected(track.id)}
                  aria-current={on ? 'true' : undefined}
                  className={`flex-none px-4 py-2 rounded-full text-sm font-semibold border-0 cursor-pointer ${
                    on ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {track.name}
                </button>
              );
            })}
          </div>

          <h2 className="font-headline font-extrabold text-on-surface text-2xl tracking-tight mt-4 mb-2">
            {t('choose_part')}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{mobileTrack.blurb}</p>

          <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
            {mobileTrack.parts.map(part => (
              <li key={part.slug}>
                <PartRow part={part} accountLabel={t('row_account_badge')} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** The examen tile. `stacked` is the phone's 2×2 shape: mark above the label rather than beside. */
function TrackTile({
  track, active, stacked = false, onSelect, soonLabel,
}: {
  track: ChooserTrack;
  active: boolean;
  stacked?: boolean;
  onSelect: () => void;
  soonLabel: string;
}) {
  const soon = track.parts.length === 0;
  const onDark = active ? 'dark' : 'light';

  const body = (
    <>
      <TrackMark id={track.id} size={stacked ? 48 : 52} tone={onDark} muted={soon} />
      <span className={`flex flex-col gap-0.5 ${stacked ? '' : 'min-w-0'}`}>
        <span
          className="font-headline font-extrabold text-lg tracking-tight"
          style={{ color: active ? '#fff' : soon ? 'var(--color-on-surface-variant)' : 'var(--color-on-surface)' }}
        >
          {track.name}
        </span>
        {soon ? (
          <span className="self-start text-[0.62rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant whitespace-nowrap">
            {soonLabel}
          </span>
        ) : (
          <span className="text-[0.8rem]" style={{ color: active ? 'rgba(255,255,255,0.72)' : 'var(--color-on-surface-variant)' }}>
            {track.subtitle}
          </span>
        )}
      </span>
    </>
  );

  const shape = `w-full text-start rounded-2xl p-4 flex ${
    stacked ? 'flex-col items-start gap-3' : 'items-center gap-3.5'
  }`;

  /* An unbuilt track is a `<div>`, not a disabled button: it is not a control the visitor failed
     to use, it is a statement about the roadmap. Same call the homepage's tile row makes. */
  if (soon) {
    return <div className={`${shape} bg-surface-container-low`}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`track-tile ${shape} border-0 cursor-pointer ${active ? 'bg-primary' : 'bg-surface-container-low'}`}
    >
      {body}
    </button>
  );
}

function TrackMark({
  id, size, tone, muted,
}: { id: ChooserTrack['id']; size: number; tone: 'light' | 'dark'; muted: boolean }) {
  if (id === 'a2' || id === 'b1') return <LevelMark level={id} size={size} tone={tone} />;
  if (id === 'knm') return <CategoryMark category="knm" size={size} tone={tone} />;
  /* ONA has no mark and deliberately gets none. A hollow ring on the neutral ramp is the
     vocabulary this site already uses for "not built" (the homepage's `SoonBlock`); drawing a
     seventh category mark would give an unbuilt onderdeel the same standing as the five real
     ones, which is the one thing the tile must not say. */
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center shrink-0 rounded-[25%] bg-surface-container-high"
      style={{ width: size, height: size, opacity: muted ? 1 : 0.6 }}
    >
      <span
        className="rounded-full"
        style={{ width: size * 0.5, height: size * 0.5, boxShadow: `inset 0 0 0 ${Math.max(3, size * 0.07)}px var(--color-outline-variant)` }}
      />
    </span>
  );
}

/** One onderdeel: the same row on both flows, so the phone and the desktop cannot drift. */
function PartRow({ part, accountLabel }: { part: ChooserPart; accountLabel: string }) {
  return (
    <a
      href={part.href}
      className="part-row h-full flex items-center gap-3.5 p-4 rounded-2xl bg-surface-container-lowest no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
      style={{ boxShadow: 'var(--shadow-ambient)', minHeight: 72 }}
    >
      <CategoryMark category={part.slug as Category} size={48} />
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="font-headline font-extrabold text-on-surface text-[1.05rem] tracking-tight">{part.name}</span>
        <span className="text-[0.8rem] text-on-surface-variant leading-snug">{part.note}</span>
      </span>
      {part.needsAccount ? (
        <span
          className="ms-auto flex-none text-[0.62rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ background: '#eef4ff', color: '#002b6d' }}
        >
          {accountLabel}
        </span>
      ) : (
        <ArrowRight size={18} strokeWidth={2.4} className="ms-auto flex-none rtl-flip" style={{ color: '#a24000' }} aria-hidden="true" />
      )}
    </a>
  );
}
