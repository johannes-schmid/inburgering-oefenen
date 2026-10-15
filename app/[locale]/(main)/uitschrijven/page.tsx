'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Mail, RotateCw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';

type State = 'confirm' | 'done' | 'error';

export default function UitschrijvenPage() {
  const [state, setState] = useState<State>('confirm');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    /* Het adres komt uit de link in de e-mail; pas na hydratie bekend, dus in een effect. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(params.get('email') || '');
  }, []);

  async function doUnsubscribe() {
    if (!email) { setState('error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('server error');
      setState('done');
    } catch {
      setState('error');
    }
  }

  /* Staat in de `(main)`-layout, dus de publieke pil en de footer staan er al omheen: geen eigen
     kop meer (die stond er dubbel). Eén kaart op een veld, drie staten. */
  return (
    <Field as="main" variant="gracht" veil="up" className="g-pagehead pb-20 sm:pb-28 px-4">
      <div className="g-statecard shadow-zweef mt-4" aria-live="polite">
        {state === 'confirm' && (
          <>
            <span className="g-stateicon" aria-hidden="true"><Mail /></span>
            <h1>Uitschrijven voor e-mails</h1>
            <p>Je schrijft je uit voor:</p>
            <span className="g-mailchip">{email || '(onbekend e-mailadres)'}</span>
            <p>
              Je ontvangt dan geen follow-up e-mails meer van Inburgering Oefenen.{' '}
              Je account blijft actief.
            </p>
            <button
              type="button"
              onClick={doUnsubscribe}
              disabled={loading}
              className={glasButton({ variant: 'navy', size: 'lg', className: 'w-full mt-3' })}
            >
              {loading ? 'Bezig…' : 'Bevestig uitschrijving'}
            </button>
            <Link href="/" className="g-textbtn">
              <ArrowLeft className="rtl-flip" aria-hidden="true" />
              Annuleren, terug naar de site
            </Link>
          </>
        )}

        {state === 'done' && (
          <>
            <span className="g-stateicon g-stateicon-goed" aria-hidden="true"><Check /></span>
            <h2>Je bent uitgeschreven</h2>
            <p>Je ontvangt geen follow-up e-mails meer van Inburgering Oefenen. Je kunt deze pagina sluiten.</p>
            <Link href="/" className="g-tlink mt-3">
              Terug naar Inburgering Oefenen
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <span className="g-stateicon g-stateicon-fout" aria-hidden="true"><AlertCircle /></span>
            <h2>Er is iets misgegaan</h2>
            <p>
              Probeer het opnieuw of neem contact op via{' '}
              <a href="mailto:contact@inburgeringoefenen.nl" className="g-ilink">contact@inburgeringoefenen.nl</a>
            </p>
            <button type="button" onClick={() => window.location.reload()} className="g-textbtn mt-2">
              <RotateCw aria-hidden="true" />
              Opnieuw proberen
            </button>
          </>
        )}
      </div>
    </Field>
  );
}
