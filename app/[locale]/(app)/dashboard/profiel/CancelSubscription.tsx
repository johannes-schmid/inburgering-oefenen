'use client';

import { useState } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';

/**
 * Cancel button with a single confirm step.
 *
 * Deliberately no retention flow — no discount offer, no "weet je het zeker?" chain, no reason
 * survey. Dutch law requires cancelling to be as easy as subscribing, and subscribing here is two
 * clicks. One confirmation guards against a misclick; anything beyond that is friction with a
 * legal problem attached.
 */
export default function CancelSubscription({ accessHint }: { accessHint: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/cancel-subscription', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Opzeggen is niet gelukt.');
      setDone(
        json.accessUntil
          ? `Je abonnement is opgezegd. Je houdt toegang tot ${formatDate(json.accessUntil)}.`
          : 'Je abonnement is opgezegd. Er wordt niets meer afgeschreven.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opzeggen is niet gelukt.');
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (done) {
    return <p className="g-cancel-q" role="status">{done}</p>;
  }

  return (
    <div className="g-cancel">
      {!confirming ? (
        <button type="button" className="g-btn g-btn-fout g-btn-sm" onClick={() => setConfirming(true)}>
          Abonnement opzeggen
        </button>
      ) : (
        <div className="g-cancel g-notice g-notice-fout">
          <div className="g-cancel">
            <p className="g-cancel-q">
              Weet je het zeker?
              {accessHint && ` Je houdt toegang tot ${accessHint}.`}
            </p>
            <div className="g-cancel-actions">
              <button type="button" className="g-btn g-btn-navy g-btn-sm" onClick={cancel} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="g-spin" aria-hidden /> Bezig…
                  </>
                ) : (
                  'Ja, opzeggen'
                )}
              </button>
              <button
                type="button"
                className="g-btn g-btn-ghost g-btn-sm"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Nee, behouden
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="g-mp-error" role="alert">
          <TriangleAlert aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}


/** `2026-08-31` → `31 augustus 2026`. Mollie returns plain dates, so no timezone shifting. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
  ];
  return `${d} ${months[m - 1]} ${y}`;
}
