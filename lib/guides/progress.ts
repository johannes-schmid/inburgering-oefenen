'use client';

/**
 * Which sections of which guide the reader has already read.
 *
 * **localStorage, not a cookie** (owner's decision, 2026-08-22). It is functional state that never
 * leaves the browser, so it needs no consent banner and adds nothing to every request — the same
 * architectural promise the tijdlijn tool makes on its landing page ("geen DigiD, geen BSN"). Do
 * not move this to the server for "personalisation": the value of a reading tick is that it is
 * free, and a round-trip would make it the site's cheapest feature to also be its most expensive.
 *
 * The key is version-prefixed and an unparseable or unknown-shaped value returns **empty** rather
 * than throwing. A reading tick is the least important state on the site; it must never be able to
 * break the page it decorates. Same reason `readGuideProgress` tolerates a missing `localStorage`
 * entirely — Safari's private mode throws on access, not on read.
 *
 * Section ids are stable across locales (see `lib/guides/sections.ts`), so progress recorded in
 * Dutch reads back in Arabic. That is a property of the content, not of this file, and it is what
 * makes a single un-namespaced store correct.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'ib.read.v1';

/** `{ [guideSlug]: sectionId[] }`. Absent slug and empty array mean the same thing. */
export type ReadProgress = Record<string, string[]>;

function parse(raw: string | null): ReadProgress {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const out: ReadProgress = {};
    for (const [slug, ids] of Object.entries(value as Record<string, unknown>)) {
      if (Array.isArray(ids)) out[slug] = ids.filter((id): id is string => typeof id === 'string');
    }
    return out;
  } catch {
    return {};
  }
}

export function readGuideProgress(): ReadProgress {
  if (typeof window === 'undefined') return {};
  try {
    return parse(window.localStorage.getItem(KEY));
  } catch {
    return {};
  }
}

function write(value: ReadProgress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* Quota or a locked-down browser. Losing a reading tick is not worth a thrown render. */
  }
}

/** Broadcast within the tab. `storage` only fires in *other* tabs, so same-tab listeners need this. */
const EVENT = 'ib:read-progress';

export function markSectionRead(slug: string, sectionId: string) {
  if (typeof window === 'undefined') return;
  const current = readGuideProgress();
  const ids = current[slug] ?? [];
  if (ids.includes(sectionId)) return;
  const next = { ...current, [slug]: [...ids, sectionId] };
  write(next);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function resetGuideProgress() {
  if (typeof window === 'undefined') return;
  write({});
  window.dispatchEvent(new CustomEvent(EVENT));
}

/**
 * The progress store as React state.
 *
 * Returns `{}` on the first render and hydrates in an effect, deliberately: reading localStorage
 * during render would make the server and client markup disagree and cost a hydration error on
 * every guide page. So a fresh reader sees "0 gelezen" for one frame, and `hydrated` is exposed so
 * a component can hold back an animation until the real numbers are in rather than counting up
 * from zero.
 */
export function useReadProgress(): { progress: ReadProgress; hydrated: boolean } {
  const [progress, setProgress] = useState<ReadProgress>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setProgress(readGuideProgress());
    sync();
    setHydrated(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return { progress, hydrated };
}

/** How many of `sectionIds` are marked read for `slug`. Never exceeds `sectionIds.length`. */
export function readCount(progress: ReadProgress, slug: string, sectionIds: string[]): number {
  const done = new Set(progress[slug] ?? []);
  return sectionIds.reduce((n, id) => n + (done.has(id) ? 1 : 0), 0);
}

/** Marks a section read and returns a stable callback — for the article's scroll observer. */
export function useMarkRead(slug: string) {
  return useCallback((sectionId: string) => markSectionRead(slug, sectionId), [slug]);
}
