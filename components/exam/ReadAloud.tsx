'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { useAudioEnabled } from '@/lib/audio-pref';

/**
 * The read-aloud presentation layer, shared by the KNM taster and the paid KNM player.
 *
 * The *playback* engine is `components/proefexamen/useReadAloud.ts` — one persistent `<audio>`
 * element, a generation token, and word timings estimated from character weight and scaled to
 * the measured duration. That hook came across from knmoefenen.nl unchanged and is index-generic
 * (`activeSeg` is only an array position), so a four-option B1 item needs no change to it.
 *
 * Its CSS is in `app/globals.css` under "Read-aloud kit", **not** in a `<style>` block here:
 * every one of those blocks would sit inside a button or inside the question text, and a
 * `<style>` element contributes its source to the element's `textContent` and so to its
 * accessible name — a screen reader read a media query aloud as part of an answer.
 *
 * What lives here is everything the KNM site expressed as inline pre-Horizon hex literals:
 * the word highlight, the equaliser, the on/off switch and the "Lees voor" pill. They are one
 * module because two copies of a highlight colour is how the taster and the player drift apart —
 * the same reason `guideHref()` exists. Every colour is a token or the documented brand hex; the
 * greens KNM used for "correct" are not here at all (that state belongs to the option renderer).
 *
 * Read-aloud is **KNM-only, by construction rather than by a flag**: it needs per-option audio,
 * and `question_options.audio_url` is populated for KNM and nothing else. Auto-reading a
 * Luisteren question aloud would speak over the fragment being tested, so the callers gate on
 * the onderdeel as well.
 */

/** Brand orange at the two weights the read-aloud state uses. §7.3: no new hue for a status. */
const ACCENT = '#a24000';
const ACCENT_SOFT = 'rgba(254,118,44,0.10)';
const ACCENT_RING = 'rgba(254,118,44,0.55)';
/** The spoken-word highlight. Clay container, clay-dark ink — readable at 14px on white. */
const MARK_BG = '#fcecdd';
const MARK_FG = '#a24000';

/* ── The word being spoken ─────────────────────────────────────────────────── */

/**
 * One segment's text with the currently-spoken word marked.
 *
 * Splits on a **capturing** `/(\s+)/` so the whitespace survives as its own chunks and the text
 * reflows identically whether or not anything is highlighted; only non-whitespace chunks advance
 * the word index, which is what keeps it aligned with the hook's `split(/\s+/).filter(Boolean)`.
 * Get that wrong and the highlight drifts one word further behind on every space.
 */
export function HighlightedText({
  text,
  activeSeg,
  thisSeg,
  activeWord,
  reading,
}: {
  text: string;
  activeSeg: number;
  thisSeg: number;
  activeWord: number;
  reading: boolean;
}) {
  const on = reading && activeSeg === thisSeg;
  const chunks = text.split(/(\s+)/);
  let wi = -1;

  return (
    <>
      {chunks.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
        wi++;
        const isMarked = on && activeWord === wi;
        return (
          <span
            key={i}
            className={isMarked ? 'ra-mark' : undefined}
            style={
              isMarked
                ? { background: MARK_BG, color: MARK_FG }
                : undefined
            }
          >
            {chunk}
          </span>
        );
      })}
    </>
  );
}

/* ── The equaliser ─────────────────────────────────────────────────────────── */

/** Four bars on the `eq` keyframe already in `globals.css`. Says "this is the one speaking". */
export function EqBars({ size = 15 }: { size?: number }) {
  const bar = (delay: string): React.CSSProperties => ({
    width: 3,
    height: size,
    background: 'currentColor',
    borderRadius: 2,
    transformOrigin: 'bottom',
    animation: `eq .9s ease-in-out infinite ${delay}`,
  });
  return (
    <span
      aria-hidden
      className="ra-eq"
      style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3, height: size }}
    >
      <span style={bar('0s')} />
      <span style={bar('.15s')} />
      <span style={bar('.3s')} />
      <span style={bar('.45s')} />
    </span>
  );
}

/* ── The onboarding row ────────────────────────────────────────────────────── */

export type AudioPrefLabels = {
  /** Heading, e.g. "Vragen voorlezen" */
  heading: string;
  /** Shown when autoplay is on — states that it happens by itself. */
  onDesc: string;
  /** Shown when it is off — states that it can be turned on. */
  offDesc: string;
  playSample: string;
  stopSample: string;
  turnOn: string;
  turnOff: string;
};

/**
 * The start-screen question: should every vraag be read aloud automatically?
 *
 * It is a real `role="switch"` and it writes `lib/audio-pref.ts`, which is `localStorage` —
 * so the answer survives the ten questions, the next oefenexamen and the next visit, and no
 * candidate is asked it twice. The default is **on**: this onderdeel is taken by people whose
 * Dutch reading is the thing being built, and the audio exists for exactly them.
 *
 * The sample button matters more than it looks. Browsers block programmatic playback until a
 * gesture has unlocked it, and `useReadAloud` reuses one `<audio>` element for the whole
 * sitting — so a candidate who presses "beluister" here has unlocked autoplay for every
 * question that follows. Without it the first question is silent and looks broken.
 *
 * `onDark` is the taster's navy intro header; the default is a light card (the player's intro).
 */
export function AudioPrefRow({
  sampleUrl,
  labels,
  onDark = false,
}: {
  sampleUrl?: string | null;
  labels: AudioPrefLabels;
  onDark?: boolean;
}) {
  const [enabled, setEnabled] = useAudioEnabled();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  function playSample() {
    if (!sampleUrl) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.src = sampleUrl;
    a.onended = () => setPlaying(false);
    a.onerror = () => setPlaying(false);
    const p = a.play();
    setPlaying(true);
    if (p && typeof p.catch === 'function') p.catch(() => setPlaying(false));
  }

  const ink = onDark ? '#fff' : 'var(--color-on-surface)';
  const sub = onDark ? 'rgba(255,255,255,0.62)' : 'var(--color-on-surface-variant)';

  return (
    <div
      /* Stacked below `sm`: at 390px the icon, the sample button and the switch left the
         description about 90px of measure and it wrapped to five lines. The controls get their
         own row there instead — a phone is where this onderdeel is actually taken. */
      className="flex flex-wrap items-center gap-x-3 gap-y-3 rounded-2xl p-3.5"
      style={{
        background: onDark
          ? enabled ? 'rgba(254,118,44,0.16)' : 'rgba(255,255,255,0.08)'
          : enabled ? ACCENT_SOFT : 'var(--color-surface-container-low)',
      }}
    >
      <span
        aria-hidden
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: 38,
          height: 38,
          background: onDark ? 'rgba(255,255,255,0.12)' : 'var(--color-surface-container-high)',
          color: enabled ? (onDark ? '#ffb27a' : ACCENT) : sub,
        }}
      >
        {enabled ? <Volume2 size={18} strokeWidth={2.2} /> : <VolumeX size={18} strokeWidth={2.2} />}
      </span>

      <div className="min-w-0" style={{ flex: '1 1 12rem' }}>
        <p className="text-sm font-bold m-0" style={{ color: ink }}>{labels.heading}</p>
        <p className="text-xs leading-snug m-0" style={{ color: sub }}>
          {enabled ? labels.onDesc : labels.offDesc}
        </p>
      </div>

      <span className="flex items-center gap-2 ms-auto flex-shrink-0">
      {enabled && sampleUrl && (
        <button
          type="button"
          onClick={playSample}
          className="ra-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold flex-shrink-0 cursor-pointer border-0"
          style={{
            background: onDark ? 'rgba(255,255,255,0.14)' : 'var(--color-surface-container-high)',
            color: onDark ? '#fff' : ACCENT,
          }}
        >
          {playing ? <EqBars size={11} /> : <Play size={11} strokeWidth={3} aria-hidden />}
          <span>{playing ? labels.stopSample : labels.playSample}</span>
        </button>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? labels.turnOff : labels.turnOn}
        onClick={() => {
          setEnabled(!enabled);
          audioRef.current?.pause();
          setPlaying(false);
        }}
        className="ra-switch flex-shrink-0 cursor-pointer border-0"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: 48,
          height: 27,
          borderRadius: 999,
          padding: 3,
          background: enabled
            ? 'linear-gradient(180deg,#fe762c,#d94f00)'
            : onDark ? 'rgba(255,255,255,0.16)' : 'var(--color-surface-container-high)',
        }}
      >
        <span
          aria-hidden
          className="ra-knob block rounded-full"
          style={{
            width: 21,
            height: 21,
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
            transform: enabled ? 'translateX(21px)' : 'translateX(0)',
          }}
        />
      </button>
      </span>
    </div>
  );
}

/* ── The in-question control ───────────────────────────────────────────────── */

/** "Lees voor" / "Stop" — the manual re-read, for when the automatic pass went too fast. */
export function ReadAloudPill({
  reading,
  onToggle,
  readLabel,
  stopLabel,
}: {
  reading: boolean;
  onToggle: () => void;
  readLabel: string;
  stopLabel: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={reading}
        className="ra-btn inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold cursor-pointer border-0"
        style={
          reading
            ? { background: 'linear-gradient(180deg,#fe762c,#d94f00)', color: '#fff' }
            : { background: ACCENT_SOFT, color: ACCENT }
        }
      >
        {reading ? <EqBars size={13} /> : <Volume2 size={14} strokeWidth={2.4} aria-hidden />}
        <span>{reading ? stopLabel : readLabel}</span>
      </button>
    </>
  );
}

/**
 * The surface of an option that is currently being spoken.
 *
 * Returned as a style object rather than a class because the option renderers already compose
 * their state inline, and because **answer state must win over reading state** — a revealed
 * correct/wrong option keeps its verdict colour even while it is read out. The callers apply
 * this only when nothing is answered yet.
 */
export function readingOptionStyle(): React.CSSProperties {
  return {
    background: ACCENT_SOFT,
    boxShadow: `inset 0 0 0 2px ${ACCENT_RING}`,
  };
}

export function readingBadgeStyle(): React.CSSProperties {
  return { background: '#d94f00', color: '#fff' };
}
