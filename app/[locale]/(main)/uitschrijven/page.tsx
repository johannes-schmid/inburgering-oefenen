'use client';

import { useState, useEffect } from 'react';

type State = 'confirm' | 'done' | 'error';

export default function UitschrijvenPage() {
  const [state, setState] = useState<State>('confirm');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <header className="py-4 px-6 flex items-center justify-center" style={{ background: '#002b6d' }}>
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FF4F00' }}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <span className="font-headline font-extrabold text-white text-lg">Inburgering Oefenen</span>
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#002b6d 0%,#FF4F00 100%)' }} />
            <div className="p-10 text-center">

              {state === 'confirm' && (
                <>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: '#fff3ee' }}>
                    <svg width="32" height="32" fill="none" stroke="#FF4F00" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <h1 className="font-headline font-extrabold text-2xl mb-2" style={{ color: '#002b6d' }}>Uitschrijven voor e-mails</h1>
                  <p className="text-sm mb-1" style={{ color: '#6b7280' }}>Je schrijft je uit voor:</p>
                  <p className="inline-block text-sm font-semibold px-4 py-2 rounded-xl mb-5" style={{ background: '#f3f4f6', color: '#374151' }}>{email || '(onbekend e-mailadres)'}</p>
                  <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6b7280' }}>
                    Je ontvangt dan geen follow-up e-mails meer van Inburgering Oefenen.<br/>
                    <span style={{ color: '#9ca3af' }}>Je account blijft actief.</span>
                  </p>
                  <button
                    onClick={doUnsubscribe}
                    disabled={loading}
                    className="block w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-60 cursor-pointer transition-colors"
                    style={{ background: '#002b6d', fontSize: '15px', fontFamily: 'inherit' }}
                  >
                    {loading ? 'Bezig…' : 'Bevestig uitschrijving'}
                  </button>
                  <a href="/" className="block mt-4 text-sm no-underline transition-colors hover:opacity-70" style={{ color: '#9ca3af' }}>← Annuleren, terug naar de site</a>
                </>
              )}

              {state === 'done' && (
                <>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: '#ecfdf5' }}>
                    <svg width="32" height="32" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h2 className="font-headline font-extrabold text-2xl mb-3" style={{ color: '#002b6d' }}>Je bent uitgeschreven</h2>
                  <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6b7280' }}>Je ontvangt geen follow-up e-mails meer van Inburgering Oefenen. Je kunt deze pagina sluiten.</p>
                  <a href="/" className="inline-flex items-center gap-1.5 font-semibold no-underline" style={{ color: '#FF4F00' }}>
                    Terug naar Inburgering Oefenen
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </a>
                </>
              )}

              {state === 'error' && (
                <>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: '#fef2f2' }}>
                    <svg width="32" height="32" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/></svg>
                  </div>
                  <h2 className="font-headline font-extrabold text-2xl mb-3" style={{ color: '#002b6d' }}>Er is iets misgegaan</h2>
                  <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6b7280' }}>
                    Probeer het opnieuw of neem contact op via{' '}
                    <a href="mailto:contact@inburgeringoefenen.nl" style={{ color: '#FF4F00', fontWeight: 600 }}>contact@inburgeringoefenen.nl</a>
                  </p>
                  <button onClick={() => window.location.reload()} className="text-sm underline cursor-pointer" style={{ color: '#9ca3af', background: 'none', border: 'none' }}>Opnieuw proberen</button>
                </>
              )}
            </div>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: '#9ca3af' }}>© 2026 Inburgering Oefenen · <a href="/" style={{ color: '#9ca3af' }}>inburgeringoefenen.nl</a></p>
        </div>
      </main>
    </div>
  );
}
