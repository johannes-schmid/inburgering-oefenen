'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { DISCOUNT_CODE_STORAGE_KEY } from '@/lib/discount-codes';

/**
 * De code als één knop: klik kopieert. Het icoon wisselt van kopiëren naar een vinkje, de code
 * zelf blijft staan, zodat de knop niet verspringt.
 *
 * De chip onthoudt de code ook in de browser: wie hier op "Gratis beginnen" klikt, heeft geen
 * `?code=` in de link, en de pakkettenkiezer vult hem dan later alsnog in.
 */
export default function CodeChip({ code, copyLabel, copiedLabel }: { code: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    try { localStorage.setItem(DISCOUNT_CODE_STORAGE_KEY, code); } catch {}
  }, [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className="g-wk-chip" data-copied={copied || undefined} aria-label={`${copyLabel}: ${code}`}>
      <span className="g-wk-chip-code" dir="ltr">{code}</span>
      <span className="g-wk-chip-icon" aria-hidden="true">
        <Copy className="g-wk-chip-copy" />
        <Check className="g-wk-chip-done" />
      </span>
      <span className="g-sr" aria-live="polite">{copied ? copiedLabel : ''}</span>
    </button>
  );
}
