'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import LogoMark from '@/components/site/LogoMark';

export default function ActivatePage() {
  const t = useTranslations('activate');
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [activating, setActivating] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpgrade, setIsUpgrade] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upgrade') === 'plus') setIsUpgrade(true);
    async function init() {
      // Playwright test hook
      try {
        const raw = sessionStorage.getItem('__pw_session__');
        if (raw) { const s = JSON.parse(raw); setUserEmail(s.user?.email ?? ''); setLoading(false); return; }
      } catch {}
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login?redirect=' + encodeURIComponent('/activate' + window.location.search);
        return;
      }
      const sessionEmail = session.user.email ?? '';
      setUserEmail(sessionEmail);
      setLoading(false);
      // Fire abandon beacon (skip in Playwright)
      if (sessionEmail) {
        const firstName = session.user.user_metadata?.full_name?.split(' ')[0] || '';
        fetch('/api/track-activate-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sessionEmail, locale, firstName }),
        }).catch(() => {});
      }
    }
    init();
  }, [supabase.auth]);

  async function handleActivate(product: 'premium' | 'premium_plus' | 'upgrade_to_plus') {
    setErrorMsg('');
    setActivating(product);
    let abVariant = 'control';
    try { abVariant = localStorage.getItem('io_ab_variant') ?? 'control'; } catch {}
    track('checkout_initiated', { product, ab_variant: abVariant });
    try {
      let session = null;
      try { const raw = sessionStorage.getItem('__pw_session__'); if (raw) session = JSON.parse(raw); } catch {}
      if (!session) { ({ data: { session } } = await supabase.auth.getSession()); }
      if (!session) { window.location.href = '/login'; return; }

      const resp = await fetch('/api/mollie-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, email: session.user.email, product, locale, ab_variant: abVariant }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.checkoutUrl) throw new Error(data.error || 'Onbekende fout');
      if (data.paymentId) localStorage.setItem('io_pending_payment_id', data.paymentId);
      window.location.href = data.checkoutUrl;
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Er is iets misgegaan. Probeer het opnieuw.');
      setActivating(null);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-surface flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <span className="w-7 h-7 border-3 border-outline-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant/40" style={{ boxShadow: '0 1px 4px rgba(0,43,109,0.06)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 no-underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#434651" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span className="text-sm font-semibold text-on-surface-variant">{t('back')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-lg font-extrabold tracking-tight text-primary font-headline">Inburgering Oefenen</span>
          </div>
          <span className="text-xs text-on-surface-variant hidden sm:block max-w-[180px] truncate">{userEmail}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'rgba(0,43,109,0.07)', color: '#002b6d' }}>{isUpgrade ? t('upgradeChip') : t('choosePlan')}</span>
          <h1 className="font-headline font-extrabold text-2xl md:text-3xl text-primary tracking-tight leading-snug mb-3">{isUpgrade ? t('upgradeHeading') : t('heading')}</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">{isUpgrade ? t('upgradeSubheading') : t('subheading')}</p>
        </div>

        {isUpgrade ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-7 flex flex-col relative" style={{ border: '2px solid #fe762c', boxShadow: '0 6px 24px rgba(254,118,44,0.18),0 1px 4px rgba(0,43,109,0.06)' }}>
              <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#fe762c' }}>{t('planCompleetTitle')}</span>
              <h2 className="font-headline font-extrabold text-xl text-primary mb-1">{t('planCompleetHeading')}</h2>
              <p className="text-xs text-on-surface-variant mb-5">{t('planCompleetDesc')}</p>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="font-headline font-extrabold text-3xl text-primary">€9,95</span>
                <span className="text-xs text-on-surface-variant">{t('upgradePriceNote')}</span>
              </div>
              <div className="flex items-start gap-2 text-sm font-bold mb-6" style={{ color: '#002b6d' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{t('featureCompleet')}</span>
              </div>
              <button
                id="btn-upgrade-to-plus"
                onClick={() => handleActivate('upgrade_to_plus')}
                disabled={!!activating}
                className="w-full py-3.5 rounded-xl font-extrabold text-white disabled:opacity-60 cursor-pointer transition-transform hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg,#fe762c 0%,#e05a00 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12),0 4px 0 #b84500,0 6px 20px rgba(254,118,44,0.35)' }}
              >
                {activating === 'upgrade_to_plus' ? t('loading') : t('btnUpgrade')}
              </button>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Professioneel */}
          <div className="bg-white rounded-2xl p-7 flex flex-col" style={{ border: '1.5px solid #e0e3e5', boxShadow: '0 1px 4px rgba(0,43,109,0.04)' }}>
            <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#747782' }}>{t('planProTitle')}</span>
            <h2 className="font-headline font-extrabold text-xl text-primary mb-1">{t('planProHeading')}</h2>
            <p className="text-xs text-on-surface-variant mb-5">{t('planProDesc')}</p>
            <div className="flex items-baseline gap-2 mb-5">
              <span className="font-headline font-extrabold text-3xl text-primary">€9,95</span>
              <span className="text-xs text-on-surface-variant">{t('priceOnce')}</span>
            </div>
            <div className="flex flex-col mb-6 flex-grow gap-2">
              {([t('feature1'), t('feature2'), t('feature3'), t('feature4')] as string[]).map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{f}</span>
                </div>
              ))}
              <div className="flex items-start gap-2 text-sm" style={{ color: '#a0a3ad', textDecoration: 'line-through' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3ad" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span>{t('featureProLocked')}</span>
              </div>
            </div>
            <button
              onClick={() => handleActivate('premium')}
              disabled={!!activating}
              className="w-full py-3.5 rounded-xl font-extrabold text-primary bg-white border border-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-60 cursor-pointer"
            >
              {activating === 'premium' ? t('loading') : t('btnPro')}
            </button>
          </div>

          {/* Compleet */}
          <div className="bg-white rounded-2xl p-7 flex flex-col relative" style={{ border: '2px solid #fe762c', boxShadow: '0 6px 24px rgba(254,118,44,0.18),0 1px 4px rgba(0,43,109,0.06)' }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#fe762c,#e05a00)' }}>{t('mostChosen')}</span>
            <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#fe762c' }}>{t('planCompleetTitle')}</span>
            <h2 className="font-headline font-extrabold text-xl text-primary mb-1">{t('planCompleetHeading')}</h2>
            <p className="text-xs text-on-surface-variant mb-5">{t('planCompleetDesc')}</p>
            <div className="flex items-baseline gap-2 mb-5">
              <span className="font-headline font-extrabold text-3xl text-primary">€19,95</span>
              <span className="text-xs text-on-surface-variant">{t('priceOnce')}</span>
            </div>
            <div className="flex flex-col mb-6 flex-grow gap-2">
              {([t('feature1'), t('feature2'), t('feature3'), t('feature4')] as string[]).map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{f}</span>
                </div>
              ))}
              <div className="flex items-start gap-2 text-sm font-bold" style={{ color: '#002b6d' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{t('featureCompleet')}</span>
              </div>
            </div>
            <button
              id="btn-premium-plus"
              onClick={() => handleActivate('premium_plus')}
              disabled={!!activating}
              className="w-full py-3.5 rounded-xl font-extrabold text-white disabled:opacity-60 cursor-pointer transition-transform hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg,#fe762c 0%,#e05a00 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12),0 4px 0 #b84500,0 6px 20px rgba(254,118,44,0.35)' }}
            >
              {activating === 'premium_plus' ? t('loading') : t('btnCompleet')}
            </button>
          </div>
        </div>
        )}

        {errorMsg && (
          <div className="max-w-3xl mx-auto mt-6 px-4 py-3 rounded-xl text-sm font-semibold text-error bg-error/5 border border-error/20">{errorMsg}</div>
        )}

        <div className="flex items-center justify-center gap-4 flex-wrap mt-8">
          <svg height="22" viewBox="0 0 60 22" fill="none" aria-label="iDEAL"><rect width="60" height="22" rx="4" fill="#f2f4f6"/><text x="8" y="15" fontFamily="Arial" fontSize="11" fontWeight="700" fill="#CC0066">iDEAL</text></svg>
          <svg height="22" viewBox="0 0 50 22" fill="none" aria-label="Mastercard"><rect width="50" height="22" rx="4" fill="#f2f4f6"/><circle cx="18" cy="11" r="7" fill="#EB001B"/><circle cx="32" cy="11" r="7" fill="#F79E1B"/><path d="M25 6.06a7 7 0 0 1 0 9.88A7 7 0 0 1 25 6.06z" fill="#FF5F00"/></svg>
          <svg height="22" viewBox="0 0 50 22" fill="none" aria-label="Visa"><rect width="50" height="22" rx="4" fill="#f2f4f6"/><text x="8" y="15" fontFamily="Arial" fontSize="13" fontWeight="900" fill="#1A1F71">VISA</text></svg>
        </div>
      </main>
    </div>
  );
}
