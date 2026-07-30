'use client';

import { useRef, useState } from 'react';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react';

/**
 * The listening player, modelled on DUO's: back-10 / play-pause / forward-10 plus a
 * seekable bar. Replay is deliberately **unlimited and uncounted** — the official player
 * imposes no limit, so there is no `max_plays` to honour and none should be added.
 */
export default function AudioPlayer({
  src,
  label,
  compact = false,
}: {
  src: string;
  label?: string;
  compact?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  }

  function skip(seconds: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(Math.max(a.currentTime + seconds, 0), a.duration || 0);
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className="rounded-2xl bg-surface-container-lowest"
      style={{
        padding: compact ? '0.75rem 1rem' : '1.125rem 1.25rem',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {label && (
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2.5">
          {label}
        </p>
      )}

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        // Swapping `src` resets through the element's own events rather than an effect, so a
        // new fragment can never inherit the previous one's position or duration.
        onLoadStart={() => { setPlaying(false); setCurrent(0); setDuration(0); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
      />

      <div className="flex items-center gap-3">
        <IconBtn onClick={() => skip(-10)} title="10 seconden terug">
          <RotateCcw size={16} strokeWidth={2.2} aria-hidden />
        </IconBtn>

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pauzeer' : 'Speel af'}
          className="exam-audio-play inline-flex items-center justify-center rounded-full border-0 cursor-pointer flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            background: 'var(--gradient-brand)',
            color: '#fff',
            boxShadow: 'var(--shadow-card-md)',
          }}
        >
          {playing
            ? <Pause size={19} strokeWidth={2.4} aria-hidden />
            : <Play size={19} strokeWidth={2.4} style={{ marginLeft: 2 }} aria-hidden />}
        </button>

        <IconBtn onClick={() => skip(10)} title="10 seconden vooruit">
          <RotateCw size={16} strokeWidth={2.2} aria-hidden />
        </IconBtn>

        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            aria-label="Zoek in de audio"
            onChange={e => {
              const a = audioRef.current;
              if (a) a.currentTime = Number(e.target.value);
              setCurrent(Number(e.target.value));
            }}
            className="exam-audio-range flex-1 min-w-0"
            style={{ '--played': `${pct}%` } as React.CSSProperties}
          />
          <span
            className="text-xs font-semibold text-on-surface-variant whitespace-nowrap"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
      </div>

      <style>{`
        .exam-audio-play {
          transition: transform .18s cubic-bezier(0.22,1,0.36,1), opacity .18s ease;
        }
        .exam-audio-play:hover { transform: scale(1.06); }
        .exam-audio-play:active { transform: scale(0.96); }
        .exam-audio-play:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        .exam-audio-range {
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            #a24000 0%, #fe762c var(--played), #e0e3e5 var(--played), #e0e3e5 100%
          );
          cursor: pointer;
        }
        .exam-audio-range::-webkit-slider-thumb {
          appearance: none;
          width: 15px; height: 15px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid #a24000;
          cursor: pointer;
        }
        .exam-audio-range::-moz-range-thumb {
          width: 15px; height: 15px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid #a24000;
          cursor: pointer;
        }
        .exam-audio-range:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .exam-audio-play { transition: none; }
        }
      `}</style>
    </div>
  );
}

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="exam-audio-skip inline-flex items-center justify-center rounded-full cursor-pointer flex-shrink-0 bg-surface-container text-on-surface-variant"
      style={{ width: 34, height: 34, border: '1.5px solid var(--color-outline-variant)' }}
    >
      {children}
      <style>{`
        .exam-audio-skip { transition: transform .16s ease, background-color .16s ease; }
        .exam-audio-skip:hover { transform: translateY(-1px); }
        .exam-audio-skip:active { transform: translateY(0) scale(0.94); }
        .exam-audio-skip:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .exam-audio-skip { transition: none; } }
      `}</style>
    </button>
  );
}

function fmt(secs: number): string {
  if (!Number.isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
