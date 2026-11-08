'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackMetaEvent } from '@/components/MetaPixel';
import { track } from '@/lib/analytics';
import LogoMark from '@/components/site/LogoMark';
import { ArrowRight, Check, Clock, X } from 'lucide-react';
import { GlassCard, LogoLoader } from '@/components/glas';

type State = 'loading' | 'success' | 'pending' | 'failed' | 'noid';

export default function BetalingGeluktPage() {
  const [state, setState] = useState<State>('loading');
  const [isChange, setIsChange] = useState(false);
  const router = useRouter();
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
        // Het bedrag komt van /api/payment-status (Mollie), niet uit een vaste tabel: de prijs
        // is per module en de oude 9,95/19,95 klopte sinds de modulebundel niet meer.
        const value = typeof data.amount === 'number' ? data.amount : 0;
        trackMetaEvent('Purchase', { value, currency: 'EUR', content_name: plan });
        let abVariant = 'control';
        try { abVariant = localStorage.getItem('io_ab_variant') ?? 'control'; } catch {}
        track('payment_success_viewed', { plan, value, currency: 'EUR', ab_variant: abVariant });
        setIsChange(data.kind === 'change');
        setState('success');
        // Via de i18n-router, zodat de taal in het pad blijft (`/nl/dashboard`, niet `/dashboard`).
        setTimeout(() => { router.push('/dashboard'); }, 3000);
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

  /* Glas: het veld "Licht" met één sterke glazen kaart erop (§G1 regel 2 en 6). De tekst is
     ongewijzigd; alleen de vorm is nieuw. Eén oranje knop per staat. */
  return (
    <div className="g-portal g-pay">
      <div className="g-portal-bg" aria-hidden />
      <header className="g-pay-head">
        <span className="g-mhead-logo">
          <LogoMark size={30} />
          <span>Inburgering Oefenen</span>
        </span>
      </header>

      <main className="g-pay-main">
        <GlassCard strong className="g-pay-card">
          {state === 'loading' && (
            <>
              <LogoLoader label="Betaling verwerken…" showLabel={false} size={64} delay={false} />
              <div>
                <h1>Betaling verwerken…</h1>
                <p>Een ogenblik geduld, we controleren je betaling.</p>
              </div>
            </>
          )}

          {state === 'success' && (
            <>
              <span className="g-pay-ic g-pay-ok" aria-hidden><Check strokeWidth={2.6} /></span>
              <div>
                <h1>Betaling geslaagd</h1>
                {/* Wat er gekocht is staat in de bevestigingsmail en op Mijn account. Hier geen
                    pakketnaam en geen aantallen: "Professioneel Pakket" bestaat sinds de prijs per
                    onderdeel niet meer. */}
                <p>{isChange
                  ? 'Je wijziging is verwerkt. Wat je erbij nam, staat open.'
                  : 'Je onderdelen staan open. Je ziet ze op je dashboard en op Mijn account.'}</p>
              </div>
              <p className="g-pay-sub">Je wordt automatisch doorgestuurd naar je dashboard…</p>
              <Link href="/dashboard" className="g-btn g-btn-oranje">
                Naar mijn dashboard <ArrowRight strokeWidth={2.4} className="rtl-flip" aria-hidden />
              </Link>
            </>
          )}

          {state === 'pending' && (
            <>
              <span className="g-pay-ic" aria-hidden><Clock strokeWidth={2.4} /></span>
              <div>
                <h1>Betaling wordt verwerkt</h1>
                <p>Je betaling is ontvangen en wordt verwerkt. Dit kan een paar minuten duren.</p>
              </div>
              <p className="g-pay-sub">Ga alvast naar je dashboard — je examens worden ontgrendeld zodra de betaling bevestigd is.</p>
              <Link href="/dashboard" className="g-btn g-btn-oranje">
                Naar mijn dashboard <ArrowRight strokeWidth={2.4} className="rtl-flip" aria-hidden />
              </Link>
            </>
          )}

          {state === 'failed' && (
            <>
              <span className="g-pay-ic g-pay-nok" aria-hidden><X strokeWidth={2.6} /></span>
              <div>
                <h1>Betaling niet geslaagd</h1>
                <p>Je betaling is geannuleerd of mislukt. Er is niets van je rekening afgeschreven. Probeer het opnieuw.</p>
              </div>
              <div className="g-pay-actions">
                <Link href="/dashboard/pakketten" className="g-btn g-btn-oranje">
                  Opnieuw proberen <ArrowRight strokeWidth={2.4} className="rtl-flip" aria-hidden />
                </Link>
                <Link href="/dashboard" className="g-btn g-btn-ghost">Terug naar dashboard</Link>
              </div>
            </>
          )}

          {state === 'noid' && (
            <>
              <div>
                <h1>Geen betaling gevonden</h1>
                <p>We konden je betaling niet terugvinden. Ga naar je dashboard om je status te bekijken.</p>
              </div>
              <Link href="/dashboard" className="g-btn g-btn-oranje">
                Naar mijn dashboard <ArrowRight strokeWidth={2.4} className="rtl-flip" aria-hidden />
              </Link>
            </>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
