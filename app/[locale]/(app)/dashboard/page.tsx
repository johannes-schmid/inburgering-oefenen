'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import type { Session } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ClipboardList, BookOpen, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { ExamResult } from './components/InlineQuiz';
import ExamsView from './components/ExamsView';
import WoordkaartenView from './components/WoordkaartenView';
import LerenView from './components/LerenView';
import LerenThemaView from './components/LerenThemaView';
import ProfileView from './components/ProfileView';
import PlatformSidebar from '../components/PlatformSidebar';
import LogoMark from '@/components/site/LogoMark';

type Plan = 'free' | 'premium' | 'premium_plus';
type View = 'exams' | 'leren' | 'woordkaarten' | 'profile';
type Progress = Record<string, ExamResult>;

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [view, setView] = useState<View>('exams');
  const [lerenSlug, setLerenSlug] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [activeExam, setActiveExam] = useState<{ num: number; topicLabel?: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [deepLinkTopic, setDeepLinkTopic] = useState<string | null>(null);
  const [deepLinkMistakes, setDeepLinkMistakes] = useState(false);

  useEffect(() => {
    // Playwright test hook: inject session via sessionStorage without Supabase cookie auth
    try {
      const raw = sessionStorage.getItem('__pw_session__');
      if (raw) { const s = JSON.parse(raw) as import('@supabase/supabase-js').Session; setSession(s); initDashboard(s); return; }
    } catch {}
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) { await initGuestDashboard(); return; }
      setSession(s);
      await initDashboard(s);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function initGuestDashboard() {
    setPlan('free');
    // Load any locally-stored progress (e.g. from a previous anonymous visit)
    try {
      const saved = localStorage.getItem('io_guest_progress');
      if (saved) setProgress(JSON.parse(saved));
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const deepView = params.get('view') as View | null;
    if (deepView && ['exams', 'leren', 'woordkaarten', 'profile'].includes(deepView)) setView(deepView);
    readDeepLinkParams(params);
    setLoading(false);
  }

  function readDeepLinkParams(params: URLSearchParams) {
    const openTopic = params.get('openTopic');
    if (openTopic) setDeepLinkTopic(openTopic);
    if (params.get('mistakes') === '1') setDeepLinkMistakes(true);
  }

  async function initDashboard(s: Session) {
    const { data: liveUserData } = await supabase.auth.getUser();
    const user = liveUserData?.user || s.user;
    const meta = user?.user_metadata || s.user.user_metadata;
    setAvatarUrl(meta?.avatar_url || meta?.picture || '');
    if (user.created_at && user.last_sign_in_at) {
      const isNewUser = new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime() < 10_000;
      const alreadyTracked = sessionStorage.getItem('__signup_completed_tracked__');
      if (isNewUser && !alreadyTracked) {
        sessionStorage.setItem('__signup_completed_tracked__', 'true');
        track('signup_completed', { provider: user.app_metadata?.provider });
      }
    }

    let detectedPlan: Plan = 'free';
    const tier = meta?.tier || meta?.plan;
    if (tier === 'premium_plus') detectedPlan = 'premium_plus';
    else if (tier === 'premium' || meta?.premium) detectedPlan = 'premium';
    setPlan(detectedPlan);

    localStorage.setItem('io_plan', detectedPlan === 'free' ? '' : detectedPlan);
    if (detectedPlan !== 'free') localStorage.setItem('io_premium', 'true');
    else localStorage.removeItem('io_premium');

    const prog = await loadProgress(s.user.id);
    setProgress(prog);

    try {
      const pendingStr = localStorage.getItem('io_pending_results');
      const claimBody = pendingStr ? JSON.parse(pendingStr) : {};
      const claimResp = await fetch('/api/claim-submissions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify(claimBody),
      });
      const claimData = await claimResp.json();
      if (claimData.claimed === 1) localStorage.removeItem('io_pending_results');
    } catch {}

    const params = new URLSearchParams(window.location.search);
    const deepView = params.get('view') as View | null;
    if (deepView && ['exams', 'leren', 'woordkaarten', 'profile'].includes(deepView)) setView(deepView);
    readDeepLinkParams(params);

    setLoading(false);
  }

  async function loadProgress(userId: string): Promise<Progress> {
    try {
      const { data, error } = await supabase.from('exam_results').select('exam_number,score,total,pct,passed,cat_scores,completed_at').eq('user_id', userId);
      if (!error && data && data.length > 0) {
        const p: Progress = {};
        data.forEach(row => { p['exam_' + row.exam_number] = { score: row.score, total: row.total, pct: row.pct, passed: row.passed, completedAt: row.completed_at }; });
        try { localStorage.setItem('io_progress_' + userId, JSON.stringify(p)); } catch {}
        return p;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('io_progress_' + (session?.user.id || '')) || '{}'); } catch { return {}; }
  }

  function openExam(num: number) { setActiveExam({ num }); setView('exams'); }
  function openTopic(category: string) {
    if (plan === 'free') {
      window.location.href = session ? '/activate' : `/${locale}/register`;
      return;
    }
    setActiveExam({ num: 0, topicLabel: category });
    setView('exams');
  }

  if (loading) return <LoadingSpinner label={t('loading')} />;

  const email = session?.user.email || '';
  const avatarFallback = email.slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: var(--font-public-sans), 'Public Sans', sans-serif; background: #f8f9fb; color: #191c1e; }
        h1,h2,h3,h4 { font-family: var(--font-manrope), 'Manrope', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #dash-sidebar { width:248px; flex-shrink:0; background:linear-gradient(180deg,#001d4e 0%,#002b6d 45%,#003580 100%); border-right:none; display:flex; flex-direction:column; height:100vh; position:sticky; top:0; box-shadow:4px 0 24px rgba(0,27,78,0.18); }
        #dash-main { flex:1; min-width:0; overflow-y:auto; height:100vh; background:#f0f3f8; }
        .exam-card { background:#fff; border:1.5px solid #e6e8ea; border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px; }
        .exam-card.free { transition:box-shadow .2s ease,border-color .2s ease,transform .2s cubic-bezier(.4,0,.2,1); cursor:pointer; }
        .exam-card.free:hover { box-shadow:0 8px 24px rgba(0,43,109,.12),0 2px 6px rgba(0,43,109,.07); border-color:#b8cef5; transform:translateY(-3px); }
        .exam-card.locked { background:#f8f9fb; cursor:pointer; }
        .exam-card.locked:hover { box-shadow:0 8px 24px rgba(254,118,44,.15),0 2px 6px rgba(254,118,44,.08); border-color:#fdc9a3; transform:translateY(-3px); transition:box-shadow .2s ease,border-color .2s ease,transform .2s cubic-bezier(.4,0,.2,1); }
        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.65); cursor:pointer; transition:background .15s,color .15s; background:none; border:none; width:100%; text-align:left; font-family:inherit; }
        .nav-item:hover { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.9); }
        .nav-item.active { background:rgba(255,255,255,0.15); color:#fff; font-weight:600; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
        #dash-bottom-bar { display:none; position:fixed; bottom:0; left:0; right:0; z-index:100; background:linear-gradient(180deg,#002266 0%,#001d4e 100%); border-top:1px solid rgba(255,255,255,0.08); box-shadow:0 -4px 20px rgba(0,27,78,0.3); padding-bottom:env(safe-area-inset-bottom); }
        .tab-item { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:10px 0 8px; background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.45); font-size:11px; font-weight:700; font-family:inherit; transition:color .15s,opacity .15s; }
        .tab-item.active { color:#fe762c; }
        .tab-item.active svg { stroke:#fe762c; }
        .tab-item svg { width:22px; height:22px; }
        .wk-card-inner { transform-style: preserve-3d; transition: transform 0.5s cubic-bezier(.4,0,.2,1); }
        .wk-card-inner.flipped { transform: rotateY(180deg); }
        @media (max-width:768px) {
          #dash-sidebar { display:none !important; }
          #dash-mobile-header { display:flex !important; }
          #dash-bottom-bar { display:flex !important; }
          #dash-layout { flex-direction:column; }
          #dash-main { height:auto; overflow-y:visible; padding-bottom:72px; }
        }
        @media (min-width:769px) { #dash-bottom-bar { display:none !important; } }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#c4c6d2; border-radius:3px; }
      `}</style>

      {/* Mobile header */}
      <header id="dash-mobile-header" className="sticky top-0 z-50 items-center justify-between px-4 py-3" style={{ display: 'none', background: 'linear-gradient(135deg,#001d4e,#002b6d)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button type="button" onClick={() => setView('exams')} className="flex items-center gap-2" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <LogoMark size={28} surface="dark" />
          <span className="text-lg font-extrabold tracking-tight font-headline" style={{ color: '#fff' }}>Inburgering Oefenen</span>
        </button>
        {session ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={email} referrerPolicy="no-referrer" />
            <AvatarFallback className="text-xs font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{avatarFallback}</AvatarFallback>
          </Avatar>
        ) : (
          <a href={`/${locale}/register`} className="text-xs font-bold px-3 py-1.5 rounded-lg no-underline" style={{ background: '#fe762c', color: '#fff' }}>{t('guest_create_account')}</a>
        )}
      </header>

      <div id="dash-layout" className="flex">
        {/* Sidebar */}
        <PlatformSidebar locale={locale} email={email} avatarUrl={avatarUrl} activeView={view} onViewChange={(v) => { setView(v); if (v !== 'leren') setLerenSlug(null); }} isGuest={!session} />

        {/* Main content */}
        <main id="dash-main" className="flex-1 px-6 py-8 md:px-10">
          <div className="max-w-5xl mx-auto space-y-10">

            {view === 'exams' && (
              <ExamsView
                plan={plan}
                progress={progress}
                session={session}
                supabase={supabase}
                activeExam={activeExam}
                onOpenExam={openExam}
                onOpenTopic={openTopic}
                onReturnFromExam={() => setActiveExam(null)}
                initialTopic={deepLinkTopic}
                autoPracticeMistakes={deepLinkMistakes}
                onExamComplete={(num, result) => {
                  const updated = { ...progress, [`exam_${num}`]: result };
                  setProgress(updated);
                  if (!session) {
                    try { localStorage.setItem('io_guest_progress', JSON.stringify(updated)); } catch {}
                  }
                }}
              />
            )}

            {view === 'leren' && !lerenSlug && <LerenView plan={plan} onOpenThema={(slug) => setLerenSlug(slug)} userId={session?.user.id} supabase={supabase} isGuest={!session} />}
            {view === 'leren' && lerenSlug && <LerenThemaView slug={lerenSlug} locale={locale} onBack={() => setLerenSlug(null)} session={session} supabase={supabase} />}
            {view === 'woordkaarten' && <WoordkaartenView userId={session?.user.id} plan={plan} supabase={supabase} onGoToProfile={() => setView('profile')} />}
            {view === 'profile' && session && <ProfileView session={session} plan={plan} progress={progress} avatarUrl={avatarUrl} onLogout={async () => { await createClient().auth.signOut(); window.location.href = '/'; }} onStartExams={() => setView('exams')} />}
            {view === 'profile' && !session && (
              <div className="max-w-md mx-auto mt-12 rounded-2xl p-8 text-center" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,43,109,0.10)', border: '1px solid #e6e8ea' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg,#001d4e,#002b6d)' }}>
                  <User size={28} style={{ color: '#fff' }} />
                </div>
                <h2 className="font-headline text-xl font-extrabold mb-2" style={{ color: '#191c1e' }}>{t('guest_profile_title')}</h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#747782' }}>{t('guest_profile_desc')}</p>
                <a href={`/${locale}/register`} className="block w-full py-3 rounded-xl font-bold text-sm text-white text-center mb-3 no-underline" style={{ background: 'linear-gradient(135deg,#fe762c,#d94f00)', boxShadow: '0 4px 16px rgba(254,118,44,0.4)' }}>{t('guest_create_account')}</a>
                <a href={`/${locale}/login`} className="block w-full py-3 rounded-xl font-bold text-sm text-center mb-3 no-underline" style={{ background: '#f0f3f8', color: '#002b6d' }}>{t('guest_login')}</a>
                <a href={`/${locale}/premium`} className="text-sm font-semibold no-underline" style={{ color: '#747782' }}>{t('guest_view_packages')} →</a>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav id="dash-bottom-bar" aria-label="Navigatie">
        {([
          { id: 'exams', Icon: ClipboardList },
          { id: 'leren', Icon: BookOpen },
          { id: 'woordkaarten', Icon: null },
          { id: 'profile', Icon: User },
        ] as const).map(({ id, Icon }) => (
          <button key={id} className={`tab-item${view === id ? ' active' : ''}`} onClick={() => { setView(id); if (id !== 'leren') setLerenSlug(null); }} type="button">
            {id === 'woordkaarten'
              ? <span className="material-symbols-outlined" style={{ fontSize: 22, lineHeight: 1, fontVariationSettings: view === id ? "'wght' 600" : "'wght' 300" }}>style</span>
              : Icon && <Icon size={22} strokeWidth={view === id ? 2.5 : 1.8} />}
            <span>{t(`nav_${id}` as Parameters<typeof t>[0])}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
