'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import { safeNext } from '@/lib/auth-redirect';

/**
 * The one place that talks to Supabase Auth.
 *
 * **Google is the only method**, by decision — for users and for admins alike. The fork
 * inherited a Microsoft (`azure`) button from KNM that was never configured on this
 * project's Supabase instance: it rendered fine and failed on click, which is worse than not
 * offering it. E-mail + wachtwoord is deliberately not offered either, which is why there is
 * no password-reset flow to maintain.
 *
 * `next` is threaded through the OAuth `redirectTo` so a visitor sent here from a locked exam
 * lands back on that exam rather than generically on the dashboard. It is validated as a
 * same-site path first: an attacker-supplied absolute URL in `?next=` would otherwise turn
 * the login page into an open redirect.
 */

export type AuthMode = 'login' | 'register' | 'admin';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const LABEL: Record<AuthMode, string> = {
  login: 'Inloggen met Google',
  register: 'Aanmelden met Google',
  admin: 'Inloggen met Google',
};

export default function AuthPanel({
  mode,
  locale,
  next,
  initialError = '',
}: {
  mode: AuthMode;
  locale: string;
  next?: string | null;
  initialError?: string;
}) {
  const supabase = createClient();
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  const fallback = mode === 'admin' ? `/${locale}/admin` : `/${locale}/dashboard`;
  const target = safeNext(next, fallback);

  async function withGoogle() {
    setError('');
    setBusy(true);
    track('login_initiated', { provider: 'google' });
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (err) {
      setBusy(false);
      setError('Inloggen met Google lukt nu niet. Probeer het over een moment opnieuw.');
    }
    // On success the browser navigates to Google, so `busy` is intentionally left set.
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl text-sm font-medium leading-relaxed"
          style={{ background: 'rgba(186,26,26,0.07)', border: '1px solid rgba(186,26,26,0.2)', color: '#ba1a1a' }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={withGoogle}
        disabled={busy}
        className="auth-btn w-full flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-semibold text-on-surface disabled:opacity-60 cursor-pointer bg-surface-container-lowest"
        style={{ border: '1.5px solid var(--color-outline-variant)', boxShadow: 'var(--shadow-card)' }}
      >
        {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <GoogleIcon />}
        <span>{busy ? 'Bezig…' : LABEL[mode]}</span>
      </button>

      <p className="text-xs text-on-surface-variant text-center leading-relaxed m-0">
        Inloggen gaat via je Google-account. Andere manieren van inloggen komen later.
      </p>

      <style>{`
        .auth-btn { transition: transform .16s cubic-bezier(0.22,1,0.36,1), opacity .16s ease; }
        .auth-btn:not(:disabled):hover { transform: translateY(-1px); }
        .auth-btn:not(:disabled):active { transform: translateY(0) scale(0.99); }
        .auth-btn:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .auth-btn { transition: none; } }
      `}</style>
    </div>
  );
}
