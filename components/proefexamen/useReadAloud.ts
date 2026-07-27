'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type ReadAloudState = {
  reading: boolean;
  activeSeg: number;   // 0=question, 1=A, 2=B, 3=C, -1=idle
  activeWord: number;
  toggle: () => void;
  stop: () => void;
};

type Segment = { url: string | null | undefined; text: string };

export function useReadAloud(segments: Segment[], enabled: boolean): ReadAloudState {
  const [reading, setReading] = useState(false);
  const [activeSeg, setActiveSeg] = useState(-1);
  const [activeWord, setActiveWord] = useState(-1);

  // One persistent <audio> element, reused across every segment AND every
  // question. Once the browser unlocks it via the first gesture-initiated
  // play, all subsequent programmatic plays (auto-play on question change)
  // are permitted — creating a fresh Audio() per segment is what breaks
  // autoplay on later questions.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Generation token — bumped on every stop/start so any stale async callback
  // (loadedmetadata, ended, play().catch, word timers) bails immediately.
  const genRef = useRef(0);
  // Always read the latest segments from a ref so the playback chain never
  // closes over a stale question.
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const stop = useCallback(() => {
    genRef.current++;
    clearTimers();
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.onloadedmetadata = null;
      a.pause();
    }
    setReading(false);
    setActiveSeg(-1);
    setActiveWord(-1);
  }, []);

  const playSeg = useCallback((idx: number, gen: number) => {
    if (gen !== genRef.current) return;
    const segs = segmentsRef.current;
    if (idx >= segs.length) {
      setReading(false);
      setActiveSeg(-1);
      setActiveWord(-1);
      return;
    }

    const seg = segs[idx];
    setActiveSeg(idx);
    setActiveWord(0);

    const words = seg.text.split(/\s+/).filter(Boolean);
    const scheduleWordTimers = (durationMs: number) => {
      clearTimers();
      const weights = words.map((w) => 240 + w.length * 32);
      const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
      let elapsed = 0;
      words.forEach((_, wi) => {
        const delay = Math.round((elapsed / totalWeight) * durationMs);
        elapsed += weights[wi];
        const t = setTimeout(() => {
          if (gen === genRef.current) setActiveWord(wi);
        }, delay);
        timersRef.current.push(t);
      });
    };

    const next = () => {
      if (gen === genRef.current) playSeg(idx + 1, gen);
    };

    if (!seg.url) {
      const t = setTimeout(next, 400);
      timersRef.current.push(t);
      return;
    }

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }
    audio.onended = next;
    audio.onerror = next;
    audio.onloadedmetadata = () => {
      if (gen !== genRef.current) return;
      const d = audio!.duration;
      scheduleWordTimers(Number.isFinite(d) && d > 0 ? d * 1000 : words.length * 380);
    };
    audio.src = seg.url;
    try {
      audio.currentTime = 0;
    } catch {}
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(next);
  }, []);

  const start = useCallback(() => {
    stop();                      // bump gen + clear any prior playback
    const gen = genRef.current;  // gen after stop's bump
    setReading(true);
    setActiveSeg(0);
    setActiveWord(0);
    playSeg(0, gen);
  }, [stop, playSeg]);

  const toggle = useCallback(() => {
    if (!enabled) return;
    if (reading) stop();
    else start();
  }, [enabled, reading, stop, start]);

  // Auto-play on mount and whenever the question changes; stop the previous
  // question's audio first (cleanup). This single effect drives both
  // exam engines — no per-engine wiring needed.
  const segKey = segments.map((s) => s.url ?? '').join('|');
  useEffect(() => {
    if (enabled && segments.some((s) => s.url)) start();
    else stop();
    return () => stop();
    // segKey is the stable proxy for segments identity; start/stop are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segKey, enabled]);

  return { reading, activeSeg, activeWord, toggle, stop };
}
