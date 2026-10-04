'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';

type Details = { clientName: string; scope: string };

/**
 * Haalt de details van de autorisatie op en keurt goed of af. Supabase keurt een herhaalde
 * aanvraag van dezelfde client zelf goed: `getAuthorizationDetails` geeft dan meteen een
 * `redirect_url` terug en de kandidaat ziet deze kaart niet meer.
 */
export default function ConsentPanel({ authorizationId, email }: { authorizationId: string; email: string }) {
  const supabase = createClient();
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'approve' | 'deny' | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (cancelled) return;
      if (err || !data) {
        setError('Deze aanvraag kan niet worden verwerkt. Begin de koppeling opnieuw vanuit de app.');
        return;
      }
      if ('redirect_url' in data) {
        window.location.assign(data.redirect_url);
        return;
      }
      setDetails({ clientName: data.client?.name || 'Onbekende app', scope: data.scope ?? '' });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizationId]);

  async function decide(decision: 'approve' | 'deny') {
    setBusy(decision);
    setError('');
    const call = decision === 'approve'
      ? supabase.auth.oauth.approveAuthorization(authorizationId)
      : supabase.auth.oauth.denyAuthorization(authorizationId);
    const { data, error: err } = await call;
    if (err || !data?.redirect_url) {
      setBusy(null);
      setError('Het is niet gelukt om je keuze door te geven. Probeer het opnieuw.');
      return;
    }
    track(decision === 'approve' ? 'oauth_consent_approved' : 'oauth_consent_denied', { client: details?.clientName ?? null });
    window.location.assign(data.redirect_url);
  }

  if (error) {
    return (
      <div role="alert" className="px-4 py-3 rounded-xl text-sm font-medium leading-relaxed" style={{ background: 'rgba(186,26,26,0.07)', color: '#ba1a1a' }}>
        {error}
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center justify-center py-6 text-on-surface-variant" aria-busy>
        <Loader2 size={20} className="animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4 bg-surface-container text-sm leading-relaxed">
        <p className="m-0 font-semibold text-on-surface">{details.clientName}</p>
        <p className="m-0 mt-1 text-on-surface-variant">
          wil namens <span className="font-medium text-on-surface">{email}</span> oefenvragen ophalen, je antwoorden
          nakijken en je voortgang bijhouden.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => decide('deny')}
          disabled={busy !== null}
          className="consent-btn flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-on-surface bg-surface-container-lowest disabled:opacity-60 cursor-pointer whitespace-nowrap"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {busy === 'deny' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <X size={16} aria-hidden />}
          Weigeren
        </button>
        <button
          type="button"
          onClick={() => decide('approve')}
          disabled={busy !== null}
          className="consent-btn flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white bg-primary disabled:opacity-60 cursor-pointer whitespace-nowrap"
        >
          {busy === 'approve' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
          Toegang geven
        </button>
      </div>

      <p className="text-xs text-on-surface-variant text-center leading-relaxed m-0">
        Je kunt de koppeling later in de app weer verwijderen. Betalen en pakketten regel je altijd op Inburgering Oefenen zelf.
      </p>

      <style>{`
        .consent-btn { transition: transform .16s cubic-bezier(0.22,1,0.36,1), opacity .16s ease; }
        .consent-btn:not(:disabled):hover { transform: translateY(-1px); }
        .consent-btn:not(:disabled):active { transform: translateY(0) scale(0.99); }
        .consent-btn:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .consent-btn { transition: none; } }
      `}</style>
    </div>
  );
}
