'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { Toggle } from '@/components/ui/toggle';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type Plan = 'free' | 'premium' | 'premium_plus';
type ExamResult = { score: number; total: number; pct: number; passed: boolean; completedAt?: string };
type Progress = Record<string, ExamResult>;
type WkLang = 'en' | 'ar' | 'tr';

const UI_LANGS = [
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const WK_LANGS: { code: WkLang; label: string; flag: string }[] = [
  { code: 'en', label: 'Engels', flag: '🇬🇧' },
  { code: 'ar', label: 'Arabisch', flag: '🇸🇦' },
  { code: 'tr', label: 'Turks', flag: '🇹🇷' },
];

type Props = {
  session: Session;
  plan: Plan;
  progress: Progress;
  onLogout: () => void;
  onStartExams: () => void;
  avatarUrl?: string;
};

export default function ProfileView({ session, plan, progress, onLogout, onStartExams, avatarUrl = '' }: Props) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const email = session.user.email || '';
  const completedExams = Object.keys(progress).filter(k => k.startsWith('exam_'));
  const scores = completedExams.map(k => progress[k].pct);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const bestScore = scores.length ? Math.max(...scores) : 0;

  const currentLocale = pathname.split('/')[1] || 'nl';
  const [wkLang, setWkLang] = useState<WkLang>('en');
  const [detectedLang, setDetectedLang] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('io_wk_lang') as WkLang | null;
    if (saved && ['en', 'ar', 'tr'].includes(saved)) {
      setWkLang(saved);
    } else {
      const bl = (navigator.language || 'en').split('-')[0].toLowerCase();
      const detected = (['ar', 'tr'].includes(bl) ? bl : 'en') as WkLang;
      setWkLang(detected);
      const label = WK_LANGS.find(l => l.code === detected)?.label || 'Engels';
      setDetectedLang(label);
    }
  }, []);

  function switchLocale(locale: string) {
    const newPath = pathname.replace(/^\/[a-z]{2}/, `/${locale}`);
    router.push(newPath);
  }

  function setWkLanguage(lang: WkLang) {
    setWkLang(lang);
    localStorage.setItem('io_wk_lang', lang);
    setDetectedLang('');
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-headline text-2xl font-extrabold text-primary mb-1">{t('profile_title')}</h1>
        <p className="text-on-surface-variant text-sm">{t('profile_desc')}</p>
      </section>

      <section className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,43,109,0.04),0 8px 24px rgba(0,43,109,0.05)' }}>
        <div className="flex items-center gap-3 p-5 pb-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={email} referrerPolicy="no-referrer" />
            <AvatarFallback className="font-extrabold text-lg font-headline" style={{ background: '#002b6d', color: '#fff' }}>{(email[0] || '?').toUpperCase()}</AvatarFallback>
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <p className="font-semibold text-on-surface text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: plan !== 'free' ? '#16a34a' : undefined }}>
              {plan === 'premium_plus' ? t('plan_premium_plus') : plan === 'premium' ? t('plan_premium') : t('plan_free')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-outline-variant/40">
          {[
            { label: t('stat_exams'), value: completedExams.length.toString() },
            { label: t('stat_avg'), value: scores.length ? `${avgScore}%` : '—' },
            { label: t('stat_best'), value: scores.length ? `${bestScore}%` : '—' },
          ].map((stat, i) => (
            <div key={stat.label} className="py-4 px-3 text-center" style={{ borderRight: i < 2 ? '1px solid rgba(0,0,0,0.07)' : undefined }}>
              <p className="font-headline font-extrabold text-2xl text-primary">{stat.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-headline text-base font-bold text-on-surface mb-3">{t('history_title')}</h2>
        {completedExams.length === 0 ? (
          <p className="text-sm text-on-surface-variant bg-white rounded-xl border border-outline-variant/50 px-5 py-4">
            {t('history_empty')}{' '}
            <button onClick={onStartExams} className="text-primary font-semibold" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t('history_empty_cta')}</button>
          </p>
        ) : (
          <div className="space-y-3">
            {completedExams.map((key, i) => {
              const r = progress[key];
              const passed = r.pct >= 60;
              const passColor = passed ? '#1a7a3c' : '#a24000';
              const passBg = passed ? '#EEF7EE' : '#FFF4EE';
              const date = r.completedAt ? new Date(r.completedAt).toLocaleDateString('nl-NL') : '';
              return (
                <div key={key} className="bg-white rounded-xl border border-outline-variant/50 px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">{t('history_exam', { number: i + 1 })}</p>
                    {date && <p className="text-xs text-on-surface-variant mt-0.5">{date}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-headline font-extrabold text-lg text-on-surface">{r.score}/{r.total}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ color: passColor, background: passBg }}>{r.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {plan !== 'premium_plus' && (
        <section className="rounded-2xl p-6 text-center" style={{ background: '#002b6d' }}>
          <span className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {plan === 'premium' ? t('upgrade_badge_premium') : t('upgrade_badge_free')}
          </span>
          <h3 className="font-headline font-bold text-lg text-white mb-2">{plan === 'premium' ? t('upgrade_title_premium') : t('upgrade_title_free')}</h3>
          <p className="text-sm mb-5 max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {plan === 'premium' ? t('upgrade_desc_premium') : t('upgrade_desc_free')}
          </p>
          <a href={plan === 'premium' ? '/activate?upgrade=plus' : '/activate'} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white no-underline" style={{ background: 'linear-gradient(135deg,#fe762c,#e05a00)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12),0 4px 14px rgba(254,118,44,0.35)' }}>
            {plan === 'premium' ? t('btn_upgrade') : t('btn_buy')}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          {plan === 'premium' && <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('upgrade_price_premium')}</p>}
          {plan === 'free' && <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('upgrade_price_free')}</p>}
        </section>
      )}

      {/* Language settings */}
      <section className="bg-white rounded-2xl border border-outline-variant/50 px-6 py-5 space-y-6" style={{ boxShadow: '0 2px 8px rgba(0,43,109,0.04)' }}>
        <div>
          <h2 className="font-headline text-base font-bold text-on-surface mb-0.5">{t('lang_title')}</h2>
          <p className="text-xs text-on-surface-variant">{t('lang_desc')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {UI_LANGS.map(l => (
              <Toggle key={l.code} pressed={currentLocale === l.code} onPressedChange={() => switchLocale(l.code)} variant="outline" className="rounded-full px-4 gap-1.5 data-[state=on]:bg-[#EEF2FF] data-[state=on]:text-[#002b6d] data-[state=on]:border-[#c4d4f0]">
                <span>{l.flag}</span> {l.label}
              </Toggle>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f0f2f4', paddingTop: '20px' }}>
          <h3 className="font-headline text-sm font-bold text-on-surface mb-0.5">{t('wk_lang_title')}</h3>
          <p className="text-xs text-on-surface-variant">{t('wk_lang_desc')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {WK_LANGS.map(l => (
              <Toggle key={l.code} pressed={wkLang === l.code} onPressedChange={() => setWkLanguage(l.code)} variant="outline" className="rounded-full px-4 gap-1.5 data-[state=on]:bg-[#EEF2FF] data-[state=on]:text-[#002b6d] data-[state=on]:border-[#c4d4f0]">
                <span>{l.flag}</span> {l.label}
              </Toggle>
            ))}
          </div>
          {detectedLang && (
            <p className="text-xs text-on-surface-variant mt-2">{t('wk_lang_detected', { lang: detectedLang })}</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-outline-variant/50 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-on-surface">{t('account_title')}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate" style={{ maxWidth: 200 }}>{email}</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#f2f4f6', color: '#434651', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {t('btn_logout')}
        </button>
      </section>

      <div className="h-8" />
    </div>
  );
}
