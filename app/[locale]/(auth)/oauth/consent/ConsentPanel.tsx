'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import { glasButton } from '@/components/glas';

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
      <div role="alert" className="auth-g-alert">
        {error}
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center justify-center py-6 text-ink-2" aria-busy>
        <Loader2 size={20} className="animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="auth-g-who">
        <p className="m-0 font-headline font-bold text-navy">{details.clientName}</p>
        <p className="m-0 mt-1 text-ink-2">
          wil namens <span className="font-semibold text-ink">{email}</span> oefenvragen ophalen, je antwoorden
          nakijken en je voortgang bijhouden.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => decide('deny')}
          disabled={busy !== null}
          className={glasButton({ variant: 'ghost', className: 'w-full px-3' })}
        >
          {busy === 'deny' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <X size={16} aria-hidden />}
          Weigeren
        </button>
        <button
          type="button"
          onClick={() => decide('approve')}
          disabled={busy !== null}
          className={glasButton({ variant: 'navy', className: 'w-full px-3' })}
        >
          {busy === 'approve' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
          Toegang geven
        </button>
      </div>

      <p className="auth-g-note">
        Je kunt de koppeling later in de app weer verwijderen. Betalen en pakketten regel je altijd op Inburgering Oefenen zelf.
      </p>

    </div>
  );
}
