'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';

/**
 * Shared audio-lesson engine for the Thema 2 interactive widgets.
 *
 * Cues are pre-computed (per generate-*-audio.mjs) and stored in the DB, sorted
 * by time. At each timeupdate we walk forward through every cue whose time has
 * passed and accumulate the latest value of each field — so `state` always holds
 * the current highlight for every cue field (sector, stap, meter, …). A field is
 * cleared by emitting an explicit `null` cue, exactly like the Thema 1 widgets.
 */
export type CueState = Omit<AudioCue, 'time' | 'subtitle'>;

/**
 * @param fallbackBase Optional public path stem (e.g. '/audio/leren/thema2-woonwens').
 *   When the DB doesn't supply audioUrl/audioCues, the widget falls back to
 *   `${fallbackBase}.mp3` + `${fallbackBase}-cues.json` — mirroring the Thema 1 widgets.
 */
export function useLessonAudio(audioUrl?: string, audioCues?: AudioCue[], fallbackBase?: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cuesRef = useRef<AudioCue[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitle, setSubtitle] = useState('');
  const [state, setState] = useState<CueState>({});
  const src = audioUrl ?? (fallbackBase ? `${fallbackBase}.mp3` : undefined);

  useEffect(() => {
    if (audioCues && audioCues.length > 0) {
      cuesRef.current = [...audioCues].sort((a, b) => a.time - b.time);
      setReady(true);
    } else if (fallbackBase) {
      fetch(`${fallbackBase}-cues.json`)
        .then(r => r.json())
        .then((d: AudioCue[]) => { cuesRef.current = [...d].sort((a, b) => a.time - b.time); setReady(true); })
        .catch(() => {});
    }
  }, [audioCues, fallbackBase]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const cues = cuesRef.current;

    const next: Record<string, unknown> = {};
    let sub: string | undefined;
    for (const c of cues) {
      if (c.time > t) break;
      for (const k in c) {
        if (k === 'time') continue;
        if (k === 'subtitle') { sub = c.subtitle; continue; }
        next[k] = (c as Record<string, unknown>)[k];
      }
    }
    setState(next as CueState);
    if (sub !== undefined) setSubtitle(sub);
    setProgress(audio.duration ? t / audio.duration : 0);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { audio.play(); setPlaying(true); }
    else { audio.pause(); setPlaying(false); }
  }, []);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }, []);

  const audioProps = {
    ref: audioRef,
    src,
    preload: 'metadata' as const,
    onTimeUpdate: handleTimeUpdate,
    onLoadedMetadata: () => { setDuration(audioRef.current?.duration ?? 0); setReady(true); },
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => { setPlaying(false); setSubtitle(''); setProgress(0); setState({}); },
  };

  return {
    audioRef, progressBarRef, audioProps,
    ready, playing, progress, duration, subtitle, state,
    togglePlay, seekTo,
  };
}
