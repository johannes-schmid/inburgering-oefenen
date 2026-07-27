'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackMetaEvent } from '@/components/MetaPixel';
import { track } from '@/lib/analytics';

type State = 'loading' | 'success' | 'pending' | 'failed' | 'noid';

export default function BetalingGeluktPage() {
  const [state, setState] = useState<State>('loading');
  const supabase = createClient();

  async function checkPaymentStatus(paymentId: string, attempt: number) {
    try {
      const resp = await fetch('/api/payment-status?id=' + encodeURIComponent(paymentId));
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      if (data.status === 'paid') {
        localStorage.setItem('io_premium', 'true');
        const plan = data.plan === 'premium_plus' ? 'premium_plus' : 'premium';
        localStorage.setItem('io_plan', plan);
        trackMetaEvent('Purchase', {
          value: plan === 'premium_plus' ? 19.95 : 9.95,
          currency: 'EUR',
          content_name: plan === 'premium_plus' ? 'Compleet Pakket' : 'Professioneel Pakket',
        });
        let abVariant = 'control';
        try { abVariant = localStorage.getItem('io_ab_variant') ?? 'control'; } catch {}
        track('payment_success_viewed', { plan, value: plan === 'premium_plus' ? 19.95 : 9.95, currency: 'EUR', ab_variant: abVariant });
        setState('success');
        setTimeout(() => { window.location.href = '/dashboard'; }, 3000);
        return;
      }
      if (data.status === 'failed') {
        track('payment_failed_viewed');
        setState('failed');
        return;
      }
      if (attempt < 10) {
        setTimeout(() => checkPaymentStatus(paymentId, attempt + 1), 3000);
      } else {
        setState('pending');
      }
    } catch {
      if (attempt < 10) setTimeout(() => checkPaymentStatus(paymentId, attempt + 1), 3000);
      else setState('pending');
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const paymentId = params.get('id') || localStorage.getItem('io_pending_payment_id');
      if (!paymentId) { setState('noid'); return; }
      localStorage.removeItem('io_pending_payment_id');
      checkPaymentStatus(paymentId, 0);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant/40" style={{ boxShadow: '0 1px 4px rgba(0,43,109,0.06)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-secondary-container rounded-full" />
            <span className="text-lg font-extrabold tracking-tight text-primary font-headline">Inburgering Oefenen</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center gap-6">
        {state === 'loading' && (
          <>
            <span className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin" />
            <div>
              <h1 className="font-headline font-extrabold text-2xl text-primary mb-2">Betaling verwerken…</h1>
              <p className="text-on-surface-variant text-sm">Een ogenblik geduld, we controleren je betaling.</p>
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.1)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-2xl text-primary mb-2">Betaling geslaagd!</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">Je Professioneel Pakket is actief. Je hebt nu toegang tot alle 10 proefexamens, directe feedback en je persoonlijk dashboard.</p>
            </div>
            <div className="w-full bg-white rounded-2xl border border-outline-variant/50 p-6" style={{ boxShadow: '0 4px 16px rgba(0,43,109,0.06)' }}>
              <p className="text-sm text-on-surface-variant mb-4">Je wordt automatisch doorgestuurd naar je dashboard…</p>
              <a href="/dashboard" className="inline-block px-8 py-3.5 rounded-xl font-extrabold text-white no-underline" style={{ background: 'linear-gradient(135deg,#fe762c 0%,#e05a00 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12),0 4px 0 #b84500,0 6px 20px rgba(254,118,44,0.35)' }}>Naar mijn dashboard →</a>
            </div>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,43,109,0.07)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#002b6d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-2xl text-primary mb-2">Betaling wordt verwerkt</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">Je betaling is ontvangen en wordt verwerkt. Dit kan een paar minuten duren.</p>
            </div>
            <div className="w-full bg-white rounded-2xl border border-outline-variant/50 p-6" style={{ boxShadow: '0 4px 16px rgba(0,43,109,0.06)' }}>
              <p className="text-sm text-on-surface-variant mb-4">Ga alvast naar je dashboard — je examens worden ontgrendeld zodra de betaling bevestigd is.</p>
              <a href="/dashboard" className="inline-block px-8 py-3.5 rounded-xl font-extrabold text-white no-underline" style={{ background: 'linear-gradient(135deg,#fe762c 0%,#e05a00 100%)' }}>Naar mijn dashboard →</a>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-2xl text-primary mb-2">Betaling niet geslaagd</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">Je betaling is geannuleerd of mislukt. Er is niets van je rekening afgeschreven. Probeer het opnieuw.</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Link href="/activate" className="flex items-center justify-center px-8 py-3.5 rounded-xl font-extrabold text-white no-underline" style={{ background: 'linear-gradient(135deg,#fe762c 0%,#e05a00 100%)' }}>Opnieuw proberen →</Link>
              <a href="/dashboard" className="flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-on-surface-variant bg-transparent border border-outline-variant hover:bg-surface-container-low transition-colors no-underline">Terug naar dashboard</a>
            </div>
          </>
        )}

        {state === 'noid' && (
          <>
            <div>
              <h1 className="font-headline font-extrabold text-2xl text-primary mb-2">Geen betaling gevonden</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">We konden je betaling niet terugvinden. Ga naar je dashboard om je status te bekijken.</p>
            </div>
            <a href="/dashboard" className="inline-block px-8 py-3.5 rounded-xl font-extrabold text-white no-underline" style={{ background: 'linear-gradient(135deg,#fe762c 0%,#e05a00 100%)' }}>Naar mijn dashboard →</a>
          </>
        )}
      </main>
    </div>
  );
}
