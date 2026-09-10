'use client';

/**
 * The one place a correct answer makes a sound.
 *
 * Every quiz surface — the exam player, the gratis oefenen taster, the lesson quizzes, the
 * oefenvragen widget — calls `playCorrectChime()` on a right answer, so the reward is identical
 * everywhere and the file is fetched once.
 *
 * It follows the site's existing sound switch (`knm-audio-enabled`, the toggle in the exam audio
 * check): sound off means no chime. Read straight from localStorage rather than through
 * `useAudioEnabled` so this stays callable from an event handler.
 */

const SRC = '/audio/ui/correct.mp3';
const PREF_KEY = 'knm-audio-enabled';

let el: HTMLAudioElement | null = null;

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function playCorrectChime() {
  if (typeof window === 'undefined' || !soundEnabled()) return;
  if (!el) {
    el = new Audio(SRC);
    /* The clip is loudness-normalised to −18 LUFS; anything above this reads as a game, and it
       plays over a candidate who may still have a Luisteren fragment in their ears. */
    el.volume = 0.45;
    el.preload = 'auto';
  }
  el.currentTime = 0;
  /* An autoplay block or a rapid second click rejects the promise — never let that surface. */
  void el.play().catch(() => {});
}
