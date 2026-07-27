'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { createClient } from '@/lib/supabase/client';

type Plan = 'free' | 'premium' | 'premium_plus';

interface LerenProgress {
  thema_id: number;
  max_section: number;
  completed: boolean;
}

const LEREN_TOPICS = [
  { id: 1, title: 'Geschiedenis en Geografie', desc: 'Van de 12 provincies en het OV tot de Gouden Eeuw, de oorlog en immigratie.', sections: 7, url: '/leren/thema-1-geschiedenis-en-geografie.html', icon: 'map' },
  { id: 2, title: 'Wonen', desc: 'Huurmarkt, koopwoning, buren, huurtoeslag en omgaan in de buurt.', sections: 6, url: '/leren/thema-2-wonen.html', icon: 'home' },
  { id: 3, title: 'Gezondheid en Gezondheidszorg', desc: 'Huisarts, zorgverzekering, ziekenhuis, GGD en geestelijke gezondheidszorg.', sections: 6, url: '/leren/thema-3-gezondheid.html', icon: 'health_and_safety' },
  { id: 4, title: 'Onderwijs', desc: 'Schoolsysteem, leerplicht, kinderopvang, MBO/HBO en inburgering.', sections: 6, url: '/leren/thema-4-onderwijs.html', icon: 'school' },
  { id: 5, title: 'Werk', desc: 'Arbeidsmarkt, arbeidscontract, belastingen, uitkeringen en sociale zekerheid.', sections: 6, url: '/leren/thema-5-werk.html', icon: 'work' },
  { id: 6, title: 'Instanties', desc: 'Overheidsinstanties, gemeentelijke diensten, rechtbank en hulporganisaties.', sections: 6, url: '/leren/thema-6-instanties.html', icon: 'account_balance' },
  { id: 7, title: 'Regering en Wet', desc: 'De Grondwet, democratie, politieke partijen, rechtsstaat en burgerrechten.', sections: 6, url: '/leren/thema-7-regering-en-wet.html', icon: 'gavel' },
];

interface LerenViewProps {
  plan: Plan;
  onOpenThema: (slug: string) => void;
  userId?: string;
  supabase?: ReturnType<typeof createClient>;
  isGuest?: boolean;
}

export default function LerenView({ plan, onOpenThema, userId, supabase, isGuest = false }: LerenViewProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [progress, setProgress] = useState<Record<number, LerenProgress>>({});

  useEffect(() => {
    if (!document.querySelector('link[href*="Material+Symbols"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!userId || !supabase) return;
    supabase.from('user_leren_progress').select('thema_id,max_section,completed').eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<number, LerenProgress> = {};
        for (const row of data) map[row.thema_id] = row;
        setProgress(map);
      });
  }, [userId, supabase]);

  const completedCount = LEREN_TOPICS.filter(t => progress[t.id]?.completed).length;
  const overallPct = Math.round((completedCount / LEREN_TOPICS.length) * 100);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-headline text-2xl font-extrabold text-primary mb-1">{t('leren_title')}</h1>
        <p className="text-on-surface-variant text-sm">{t('leren_desc')}</p>
      </section>

      {/* Overall progress */}
      <div style={{ background: '#fff', border: '1px solid #e6e8ea', borderRadius: 14, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 1px 4px rgba(0,43,109,0.05)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#002b6d' }}>school</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#191c1e', fontFamily: 'Manrope,sans-serif', marginBottom: 6 }}>Jouw voortgang</div>
          <div style={{ height: 6, background: '#e6e8ea', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? '#16a34a' : '#002b6d', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: '#6e7282', marginTop: 5 }}>{completedCount} van {LEREN_TOPICS.length} thema&apos;s afgerond</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: overallPct === 100 ? '#16a34a' : '#002b6d', fontFamily: 'Manrope,sans-serif', flexShrink: 0 }}>{overallPct}%</div>
      </div>

      <div id="leren-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {LEREN_TOPICS.map(topic => {
          const planLocked = plan !== 'premium_plus' && topic.id !== 1;
          const p = progress[topic.id];
          const isCompleted = !!p?.completed;
          const inProgress = !isCompleted && (p?.max_section ?? 0) > 0;
          const progressPct = isCompleted ? 100 : Math.round(((p?.max_section ?? 0) / topic.sections) * 100);
          const slug = topic.url.replace('/leren/', '');

          const headerActive: React.CSSProperties = { height: 144, background: 'linear-gradient(135deg,#002b6d,#1d428a,#0d4499)', position: 'relative', overflow: 'hidden' };
          const headerLocked: React.CSSProperties = { height: 144, background: 'linear-gradient(135deg,#3b3f4d,#1f2330)', position: 'relative', overflow: 'hidden' };

          let ctaLabel = t('leren_start');
          if (!planLocked) {
            if (isCompleted) ctaLabel = 'Herhalen';
            else if (inProgress) ctaLabel = 'Verder';
          }

          return (
            <a key={topic.id}
              href={planLocked ? (isGuest ? `/${locale}/register` : (plan === 'premium' ? `/${locale}/activate?upgrade=plus` : `/${locale}/activate`)) : `/${locale}${topic.url}`}
              onClick={planLocked ? undefined : (e) => { e.preventDefault(); onOpenThema(slug); }}
              style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)', border: '1px solid #e6e8ea', display: 'block', textDecoration: 'none', transition: 'transform .18s,box-shadow .18s', color: 'inherit' }}
              onMouseOver={e => { (e.currentTarget).style.transform = 'translateY(-3px)'; (e.currentTarget).style.boxShadow = planLocked ? '0 4px 20px rgba(254,118,44,0.18),0 10px 32px rgba(0,43,109,0.08)' : '0 4px 20px rgba(0,43,109,0.12),0 10px 32px rgba(0,43,109,0.08)'; }}
              onMouseOut={e => { (e.currentTarget).style.transform = ''; (e.currentTarget).style.boxShadow = '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)'; }}
            >
              <div style={planLocked ? headerLocked : headerActive}>
                {/* Large background icon */}
                <span className="material-symbols-outlined" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 80, color: 'rgba(255,255,255,0.15)', userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>{topic.icon}</span>

                {/* Theme label (top-left) */}
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <span style={{ background: planLocked ? 'rgba(255,255,255,0.15)' : '#fe762c', color: planLocked ? '#fff' : '#5f2200', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, fontFamily: 'Manrope,sans-serif' }}>{t('leren_theme_label', { id: topic.id })}</span>
                </div>

                {/* Completed badge (top-right) */}
                {isCompleted && !planLocked && (
                  <div style={{ position: 'absolute', top: 16, right: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, fontFamily: 'Manrope,sans-serif' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      Voltooid
                    </span>
                  </div>
                )}

                {planLocked && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope,sans-serif' }}>{t('leren_locked_badge')}</span>
                    </div>
                  </div>
                )}
                {!planLocked && (
                  <div style={{ position: 'absolute', bottom: 16, right: 16, width: 32, height: 32, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>

              <div style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: 15, color: '#191c1e', margin: '0 0 6px', lineHeight: 1.3 }}>{topic.title}</h3>
                <p style={{ fontSize: 12, color: '#434651', lineHeight: 1.55, margin: '0 0 14px' }}>{topic.desc}</p>

                {/* Progress bar (non-locked only) */}
                {!planLocked && (isCompleted || inProgress) && (
                  <div style={{ height: 3, background: '#e6e8ea', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: isCompleted ? '#16a34a' : '#fe762c', borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: planLocked ? '#fe762c' : isCompleted ? '#16a34a' : '#434651', borderTop: '1px solid #e6e8ea', paddingTop: 12, fontWeight: planLocked ? 700 : 400 }}>
                  {planLocked ? (
                    <>
                      <span>{t('leren_locked_text')}</span>
                      <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </>
                  ) : (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6e7282' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        {t('leren_sections', { count: topic.sections })}
                      </span>
                      <span style={{ marginLeft: 'auto', color: isCompleted ? '#16a34a' : '#002b6d', fontWeight: 700, fontFamily: 'Manrope,sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}>
                        {ctaLabel} <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
