'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CategoryMark, ChoiceTile, ChoiceTileGroup, FilterChip, type Category } from '@/components/glas';
import '@/components/exam/glas-player.css';
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
  /** `'ona'` is geen `OnderdeelSlug` (zie `data/skills.ts`), maar wel een `CategoryMark`. */
  slug: OnderdeelSlug | 'ona';
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

  /* Glas §06 "Keuzes": de vier examens als keuzetegels met het track-merk (gekozen = wit + navy
     ring + vinkje), daaronder het open paneel met de onderdelen als witte rijen. */
  const tiles = (activeId: ChooserTrack['id'] | undefined) => (
    <ChoiceTileGroup label={t('choose_exam')} className="g-xtracks">
      {tracks.map(track => {
        const soon = track.parts.length === 0;
        return (
          <ChoiceTile
            key={track.id}
            track={track.id}
            checked={!soon && activeId === track.id}
            title={track.name}
            sub={soon ? t('track_soon') : track.subtitle}
            /* An unbuilt track is not a control the visitor failed to use, it is a statement about
               the roadmap — the kit's "off" state (dashed, not clickable). */
            disabled={soon}
            onClick={() => setSelected(track.id)}
          />
        );
      })}
    </ChoiceTileGroup>
  );

  return (
    <>
      {/* ── Desktop: the row and the open panel on one screen ─────────────── */}
      <div className="hidden md:block">
        <span className="g-mono" style={{ display: 'block', marginBottom: 12 }}>{t('choose_exam')}</span>
        {tiles(desktopTrack?.id)}

        {/* Every track's panel is rendered and the closed ones get `hidden`.
            **Not** `selected === track.id && <Panel/>`: with only the open panel in the DOM, the
            B1 and KNM tasters have no internal link from `/oefenen` at all — on the page that is
            the entry point of the whole free funnel, and the one that should be passing authority
            to them. That is the same bug `/inburgering`'s fase-panelen shipped once; `tsc`, the
            build and every screenshot were clean both times, and only a look at the served HTML
            found it. */}
        {openable.map(track => (
          <div key={track.id} hidden={track.id !== desktopTrack?.id} className="g-xpanel-w">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 14px', marginBottom: 16 }}>
              <h2 className="g-head g-head-3">{t('panel_heading', { track: track.name })}</h2>
              <p className="g-xintro-line">{track.blurb}</p>
            </div>
            <ul className="g-xparts">
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
        <span className="g-mono" style={{ display: 'block', marginBottom: 12 }}>{t('choose_exam')}</span>
        {tiles(undefined)}
      </div>

      {/* ── Mobile step 2: which onderdeel ────────────────────────────────── */}
      {mobileTrack && (
        <div className="md:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <button type="button" onClick={() => setSelected(null)} className="g-btn g-btn-ghost g-btn-sm">
              <ArrowLeft className="rtl-flip" aria-hidden />
              {t('choose_exam')}
            </button>
            <span className="g-mono" style={{ marginInlineStart: 'auto' }}>{t('step_two')}</span>
          </div>

          {/* The other examens stay one tap away — the back control is the way *up*, these are
              the way *across*, and without them switching level is two taps and a re-read. */}
          <div className="g-chips" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
            {openable.map(track => (
              <FilterChip
                key={track.id}
                pressed={track.id === mobileTrack.id}
                onClick={() => setSelected(track.id)}
                aria-current={track.id === mobileTrack.id ? 'true' : undefined}
                style={{ flex: 'none' }}
              >
                {track.name}
              </FilterChip>
            ))}
          </div>

          <h2 className="g-head g-head-2" style={{ marginTop: 18 }}>{t('choose_part')}</h2>
          <p className="g-xintro-line" style={{ margin: '6px 0 14px' }}>{mobileTrack.blurb}</p>

          <ul className="g-xparts">
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

/** One onderdeel: the same row on both flows, so the phone and the desktop cannot drift. */
function PartRow({ part, accountLabel }: { part: ChooserPart; accountLabel: string }) {
  return (
    <a href={part.href} className="g-xpart">
      <CategoryMark category={part.slug as Category} size={48} />
      <span className="g-xpart-t">
        <b>{part.name}</b>
        <small>{part.note}</small>
      </span>
      {part.needsAccount ? (
        <span className="g-xbdg" style={{ marginInlineStart: 'auto', flex: 'none' }}>{accountLabel}</span>
      ) : (
        <span className="g-xpart-end"><ArrowRight className="rtl-flip" aria-hidden /></span>
      )}
    </a>
  );
}
