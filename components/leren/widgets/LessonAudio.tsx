'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LessonAudio({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cuesRef = useRef<AudioCue[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    if (audioCues && audioCues.length > 0) {
      cuesRef.current = audioCues;
      setReady(true);
    }
  }, [audioCues]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const cues = cuesRef.current;
    let latestSubtitle: string | undefined;
    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (latestSubtitle === undefined && cues[i].subtitle !== undefined) {
        latestSubtitle = cues[i].subtitle;
        break;
      }
    }
    if (latestSubtitle !== undefined) setSubtitle(latestSubtitle);
    setProgress(audio.duration ? t / audio.duration : 0);
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }

  // No audio yet → render nothing rather than a "coming soon" placeholder.
  if (!audioUrl) return null;

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setReady(true); }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onEnded={() => { setPlaying(false); setSubtitle(''); setProgress(0); }}
      />

      <div className="px-5 pt-4 pb-2 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
          Audio les
        </p>
        <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
          Luister naar de uitleg
        </p>
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={togglePlay}
            disabled={!ready}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
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
            <p className="text-[10px]" style={{ color: 'var(--color-on-surface-variant)' }}>
              Druk op afspelen om te beginnen
            </p>
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
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{ width: `${progress * 100}%`, background: '#fe762c' }}
          />
        </div>

        <div
          className="min-h-[36px] flex items-center px-3 py-2 rounded-xl transition-all"
          style={{ background: subtitle ? 'var(--color-surface-container-low)' : 'transparent' }}
        >
          {subtitle ? (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>{subtitle}</p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
              Druk op afspelen om de les te beluisteren
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
