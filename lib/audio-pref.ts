'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY = 'knm-audio-enabled';
const EVENT = 'knm-audio-pref-change';

export function useAudioEnabled(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored !== null) setEnabled(stored !== 'false');

    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setEnabled(e.newValue !== 'false');
    }
    function onCustom(e: Event) {
      setEnabled((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT, onCustom);
    };
  }, []);

  const toggle = useCallback((v: boolean) => {
    localStorage.setItem(KEY, String(v));
    setEnabled(v);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
  }, []);

  return [enabled, toggle];
}
