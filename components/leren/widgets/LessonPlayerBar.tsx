'use client';

import type { useLessonAudio } from './useLessonAudio';

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

type Engine = ReturnType<typeof useLessonAudio>;

/**
 * Shared play/progress/subtitle bar for the Thema 2 interactive lessons.
 * Mirrors the Thema 1 widget player styling exactly so the surfaces match.
 */
export default function LessonPlayerBar({ engine, hint }: { engine: Engine; hint: string }) {
  const { ready, playing, progress, duration, subtitle, togglePlay, seekTo, progressBarRef } = engine;

  return (
    <div className="px-4 pt-3 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: playing ? '#fe762c' : 'transparent',
            border: playing ? 'none' : '2px solid #fe762c',
            color: playing ? '#fff' : '#fe762c',
            opacity: ready ? 1 : 0.4,
          }}
          aria-label={playing ? 'Pauzeer' : 'Speel les af'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
            {playing ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: 'var(--color-on-surface)' }}>
            {playing ? 'Speelt...' : 'Luister naar de les'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--color-on-surface-variant)' }}>{hint}</p>
        </div>
        <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
          {formatTime(duration)}
        </span>
      </div>

      <div
        ref={progressBarRef}
        onClick={seekTo}
        className="w-full h-1.5 rounded-full cursor-pointer mb-2"
        style={{ background: 'var(--color-outline-variant)' }}
      >
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${progress * 100}%`, background: '#fe762c' }} />
      </div>

      <div
        className="min-h-[36px] flex items-center px-3 py-2 rounded-xl transition-all"
        style={{ background: subtitle ? 'var(--color-surface-container-low)' : 'transparent' }}
      >
        {subtitle
          ? <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>{subtitle}</p>
          : <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Druk op afspelen om de les te beluisteren</p>}
      </div>
    </div>
  );
}

/** Shared header strip used above every interactive lesson widget. */
export function LessonHeader({ title }: { title: string }) {
  return (
    <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
        Interactieve les
      </p>
      <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>{title}</p>
    </div>
  );
}
