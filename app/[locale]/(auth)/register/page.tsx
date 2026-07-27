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

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMs, setLoadingMs] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/dashboard');
    });
  }, [supabase.auth]);

  async function registerWith(provider: 'google' | 'azure') {
    setError('');
    if (provider === 'google') setLoadingGoogle(true);
    else setLoadingMs(true);
    let abVariant = 'control';
    try { abVariant = localStorage.getItem('io_ab_variant') ?? 'control'; } catch {}
    track('signup_initiated', { provider, ab_variant: abVariant });
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

  const oauthBtnClass =
    'w-full flex items-center justify-center gap-2.5 bg-white border border-outline-variant/70 rounded-xl px-5 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:-translate-y-px transition-all active:scale-99 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg,#002b6d 0%,#001844 55%,#001030 100%)' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(70% 55% at 88% 4%, rgba(254,118,44,0.20), transparent 55%)' }}
      />

      <header className="relative border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="w-1.5 h-6 bg-secondary-container rounded-full" />
            <span className="text-xl font-extrabold tracking-tight text-white font-headline">Inburgering Oefenen</span>
          </Link>
          <Link href="/login" className="text-sm font-semibold text-white/90 hover:text-white transition-colors no-underline">Al een account? Inloggen →</Link>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-14 items-center">
          {/* Headline column */}
          <div>
            <span className="inline-block text-xs font-extrabold uppercase mb-3" style={{ color: '#fe762c', letterSpacing: '0.14em' }}>Word lid — gratis</span>
            <h1 className="font-headline font-extrabold text-white leading-[1.08] mb-3.5" style={{ fontSize: 'clamp(1.9rem,4.5vw,2.6rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
              Slaag voor je KNM-examen met gevalideerde vragen.
            </h1>
            <p className="text-white/68 text-sm sm:text-base leading-relaxed mb-7 max-w-[44ch]">
              Maak je gratis account en krijg meteen een volledig proefexamen, je slaagkans en woordkaarten.
            </p>

            <div className="flex gap-5 sm:gap-7 mb-7">
              {[
                { val: '40', label: 'vragen gratis' },
                { val: '100%', label: 'altijd gratis' },
                { val: '3', label: 'talen' },
              ].map((s, i) => (
                <div key={s.label} className="flex items-stretch gap-5 sm:gap-7">
                  {i > 0 && <span className="w-px bg-white/15" aria-hidden />}
                  <div>
                    <div className="font-headline font-extrabold text-white" style={{ fontSize: 'clamp(1.4rem,3vw,1.7rem)' }}>{s.val}</div>
                    <div className="text-white/55 uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[10px] overflow-hidden border border-white/15 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1d428a,#002b6d)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={36} height={36} className="w-full h-full object-cover object-top" />
              </span>
              <span className="text-white/70" style={{ fontSize: '0.82rem' }}>
                Vragen gevalideerd door{' '}
                <Link href="/docent" className="font-bold text-white no-underline hover:underline">Marieke Schipper</Link>
              </span>
            </div>
          </div>

          {/* Floating form card */}
          <div className="bg-white rounded-[22px] p-7 sm:p-8 flex flex-col" style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.40),0 2px 8px rgba(0,0,0,0.12)' }}>
            <h2 className="font-headline font-extrabold text-on-surface mb-1" style={{ fontSize: '1.3rem', letterSpacing: '-0.015em' }}>Word lid van Inburgering Oefenen</h2>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Vul je gegevens in om direct te beginnen.</p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(186,26,26,0.07)', border: '1px solid rgba(186,26,26,0.18)', color: '#ba1a1a' }}>{error}</div>
            )}

            <button
              onClick={() => registerWith('google')}
              disabled={loadingGoogle || loadingMs}
              className={oauthBtnClass}
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
            >
              {loadingGoogle ? <span className="w-5 h-5 border-2 border-outline-variant/50 border-t-primary rounded-full animate-spin" /> : <GoogleIcon />}
              <span>Registreer gratis met Google</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-outline-variant/50" />
              <span className="text-xs text-on-surface-variant">of</span>
              <div className="flex-1 h-px bg-outline-variant/50" />
            </div>

            <button
              onClick={() => registerWith('azure')}
              disabled={loadingGoogle || loadingMs}
              className={oauthBtnClass}
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
            >
              {loadingMs ? <span className="w-5 h-5 border-2 border-outline-variant/50 border-t-primary rounded-full animate-spin" /> : <MsIcon />}
              <span>Registreer gratis met Microsoft</span>
            </button>

            <p className="text-xs text-on-surface-variant text-center mt-5 leading-relaxed">
              Door te registreren ga je akkoord met onze{' '}
              <Link href="/gebruiksvoorwaarden" className="text-primary hover:underline no-underline">gebruiksvoorwaarden</Link>
              {' '}en ons{' '}
              <Link href="/privacybeleid" className="text-primary hover:underline no-underline">privacybeleid</Link>.
            </p>

            <hr className="my-5 border-outline-variant/40" />
            <p className="text-sm text-on-surface-variant text-center">
              Heb je al een account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline no-underline ml-1">Log in →</Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative text-center py-6 text-xs text-white/55 border-t border-white/10">
        © 2026 Inburgering Oefenen ·{' '}
        <a href="mailto:contact@inburgeringoefenen.nl" className="hover:text-white no-underline transition-colors">contact@inburgeringoefenen.nl</a>
      </footer>
    </div>
  );
}
