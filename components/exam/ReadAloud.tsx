'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { useAudioEnabled } from '@/lib/audio-pref';
import GlasSwitch from '@/components/glas/Switch';
import './glas-player.css';

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

/* Glas: de kleuren staan in components/exam/glas-player.css (`.g-xhlw`, `.g-xread`,
   `.g-xans-reading`) — één plek voor speler en proef. */

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
          <span key={i} className={isMarked ? 'ra-mark g-xhlw' : undefined}>
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

  /* Glas §06 "Instellingen": een mistvlak met een wit tegeltje, de woorden en de schakelaar.
     `onDark` blijft bestaan voor een donkere ondergrond; Glas zet deze rij altijd op wit of mist. */
  return (
    <div className={`g-xpref${enabled ? ' g-xpref-on' : ''}`} style={onDark ? { background: 'rgba(255,255,255,0.1)' } : undefined}>
      <span aria-hidden className="g-xpref-ic">
        {enabled ? <Volume2 strokeWidth={2.2} /> : <VolumeX strokeWidth={2.2} />}
      </span>

      <div className="g-xpref-t">
        <b style={onDark ? { color: '#fff' } : undefined}>{labels.heading}</b>
        <small style={onDark ? { color: 'rgba(255,255,255,0.7)' } : undefined}>{enabled ? labels.onDesc : labels.offDesc}</small>
      </div>

      <span className="g-xpref-act">
        {enabled && sampleUrl && (
          <button type="button" onClick={playSample} className="g-xread" aria-pressed={playing}>
            <span className="g-xread-ic" aria-hidden>
              {playing ? <EqBars size={11} /> : <Play strokeWidth={3} />}
            </span>
            <span>{playing ? labels.stopSample : labels.playSample}</span>
          </button>
        )}
        <GlasSwitch
          checked={enabled}
          aria-label={enabled ? labels.turnOff : labels.turnOn}
          onClick={() => {
            setEnabled(!enabled);
            audioRef.current?.pause();
            setPlaying(false);
          }}
        />
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
    <button type="button" onClick={onToggle} aria-pressed={reading} className="g-xread">
      <span className="g-xread-ic" aria-hidden>
        {reading ? <EqBars size={12} /> : <Volume2 strokeWidth={2.4} />}
      </span>
      <span>{reading ? stopLabel : readLabel}</span>
    </button>
  );
}
