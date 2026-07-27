'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23">
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
);

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMs, setLoadingMs] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Show error if redirected back from failed callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setError('Er is iets misgegaan. Probeer het opnieuw.');

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/nl/dashboard');
    });
  }, [supabase.auth]);

  async function loginWith(provider: 'google' | 'azure') {
    setError('');
    if (provider === 'google') setLoadingGoogle(true);
    else setLoadingMs(true);
    track('login_initiated', { provider });
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/nl/dashboard`;
      await supabase.auth.signInWithOAuth({
        provider,
        options: provider === 'google'
          ? { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } }
          : { redirectTo, scopes: 'email' },
      });
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      setLoadingGoogle(false);
      setLoadingMs(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-outline-variant/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="w-1.5 h-6 bg-secondary-container rounded-full" />
            <span className="text-xl font-extrabold tracking-tight text-primary font-headline">Inburgering Oefenen</span>
          </Link>
          <Link href="/premium" className="text-sm font-semibold text-primary hover:underline no-underline">Nog geen account? Bekijk het pakket →</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-outline-variant/50 p-8 animate-[fadeUp_0.5s_cubic-bezier(0.4,0,0.2,1)_both]" style={{ boxShadow: '0 4px 16px rgba(0,43,109,0.06),0 16px 48px rgba(0,43,109,0.08)' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-6 bg-secondary-container rounded-full" />
              <span className="text-lg font-extrabold tracking-tight text-primary font-headline">Inburgering Oefenen</span>
            </div>

            <h1 className="font-headline font-extrabold text-xl text-on-surface mb-1">Welkom terug</h1>
            <p className="text-on-surface-variant text-sm mb-7 leading-relaxed">Log in om verder te gaan met je proefexamens en je voortgang te bekijken.</p>

            {error && (
              <div className="hidden mb-5 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(186,26,26,0.07)', border: '1px solid rgba(186,26,26,0.18)', color: '#ba1a1a', display: 'block' }}>{error}</div>
            )}

            <button
              onClick={() => loginWith('google')}
              disabled={loadingGoogle || loadingMs}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-outline-variant/70 rounded-xl px-5 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:-translate-y-px transition-all active:scale-99 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
            >
              {loadingGoogle ? <span className="w-5 h-5 border-2 border-outline-variant/50 border-t-primary rounded-full animate-spin" /> : <GoogleIcon />}
              <span>Inloggen met Google</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-outline-variant/50" />
              <span className="text-xs text-on-surface-variant">of</span>
              <div className="flex-1 h-px bg-outline-variant/50" />
            </div>

            <button
              onClick={() => loginWith('azure')}
              disabled={loadingGoogle || loadingMs}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-outline-variant/70 rounded-xl px-5 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:-translate-y-px transition-all active:scale-99 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
            >
              {loadingMs ? <span className="w-5 h-5 border-2 border-outline-variant/50 border-t-primary rounded-full animate-spin" /> : <MsIcon />}
              <span>Inloggen met Microsoft</span>
            </button>

            <p className="text-xs text-on-surface-variant text-center mt-5 leading-relaxed">
              Door in te loggen ga je akkoord met onze{' '}
              <Link href="/gebruiksvoorwaarden" className="text-primary hover:underline no-underline">gebruiksvoorwaarden</Link>.
            </p>
          </div>

          <p className="text-center mt-5 text-sm text-on-surface-variant">
            <Link href="/" className="text-primary font-semibold hover:underline no-underline">← Terug naar de website</Link>
          </p>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-on-surface-variant border-t border-outline-variant/30">
        © 2026 Inburgering Oefenen ·{' '}
        <a href="mailto:contact@inburgeringoefenen.nl" className="hover:text-primary no-underline transition-colors">contact@inburgeringoefenen.nl</a>
      </footer>
    </div>
  );
}
