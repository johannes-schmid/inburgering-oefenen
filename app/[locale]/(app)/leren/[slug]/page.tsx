'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';
import { createClient } from '@/lib/supabase/client';
import { awardXp, awardCorrectAnswer } from '@/lib/xp';
import PlatformSidebar from '../../components/PlatformSidebar';
import SectionContent from '@/components/leren/SectionContent';
import { getThema } from '@/data/leren';
import type { LerenThema, LerenSection } from '@/data/leren';
import type { KnmQuestion } from '@/data/questions';
import type { AudioCue } from '@/lib/leren-audio-cues';

type View = 'overview' | 'section' | 'quiz';

interface QuizState {
  questions: KnmQuestion[];
  current: number;
  score: number;
  answered: boolean;
  selectedOption: string | null;
  done: boolean;
}

export default function LerenPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = use(params);
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');
  const cleanSlug = slug.replace('.html', '');
  const thema = getThema(cleanSlug);

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  // Sections with audio data overlaid from DB
  const [sections, setSections] = useState<LerenSection[]>(thema?.sections ?? []);

  // Fetch audio data from DB and merge into static sections
  const fetchAudioData = useCallback(async () => {
    if (!thema) return;
    const { data } = await supabase
      .from('leren_content')
      .select('anchor, audio_url, audio_cues')
      .eq('theme_id', thema.id)
      .not('audio_url', 'is', null);
    if (!data?.length) return;
    const audioMap = new Map(data.map(r => [r.anchor, { audioUrl: r.audio_url, audioCues: r.audio_cues as AudioCue[] }]));
    setSections(thema.sections.map(s => {
      const a = audioMap.get(s.id);
      return a ? { ...s, ...a } : s;
    }));
  }, [thema]); // eslint-disable-line react-hooks/exhaustive-deps

  const [view, setView] = useState<View>('overview');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [], current: 0, score: 0, answered: false, selectedOption: null, done: false,
  });

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('__pw_session__');
      if (raw) {
        const s = JSON.parse(raw);
        const tier = s?.user?.user_metadata?.tier ?? s?.user?.user_metadata?.plan ?? (s?.user?.user_metadata?.premium ? 'premium' : 'free');
        if (thema && thema.id !== 1 && tier !== 'premium_plus') {
          window.location.href = `/${locale}/activate?upgrade=plus`;
          return;
        }
        setLoading(false);
        fetchAudioData();
        return;
      }
    } catch {}

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) { window.location.href = `/${locale}/login`; return; }
      const { data: liveUser } = await supabase.auth.getUser();
      const meta = liveUser?.user?.user_metadata ?? s.user.user_metadata;
      const tier = meta?.tier ?? meta?.plan ?? (meta?.premium ? 'premium' : 'free');
      if (thema && thema.id !== 1 && tier !== 'premium_plus') {
        window.location.href = `/${locale}/activate?upgrade=plus`;
        return;
      }
      setEmail(s.user.email ?? '');
      setUserId(s.user.id);
      setLoading(false);
      fetchAudioData();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sectionParam || loading || !thema) return;
    const idx = thema.sections.findIndex((s: { id: string }) => s.id === sectionParam);
    if (idx !== -1) goToSection(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function startQuiz() {
    if (!thema) return;
    const { data } = await supabase
      .from('questions_flat')
      .select('id, category, question, option_a, option_b, option_c, correct, explanation, image_url, exam')
      .eq('category', thema.quizCategory);
    const pool: KnmQuestion[] = (data ?? []).map(r => ({
      id: r.id, category: r.category, question: r.question,
      optionA: r.option_a, optionB: r.option_b, optionC: r.option_c,
      correct: r.correct as 'A' | 'B' | 'C', explanation: r.explanation,
      imageUrl: r.image_url ?? undefined, exam: r.exam ?? null,
    }));
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    setQuizState({ questions: shuffled, current: 0, score: 0, answered: false, selectedOption: null, done: false });
    setView('quiz');
    window.scrollTo(0, 0);
    sendGAEvent('event', 'leren_quiz_started', { thema: cleanSlug });
  }

  function answerQuestion(option: string) {
    if (quizState.answered) return;
    const q = quizState.questions[quizState.current];
    const isRight = option === q.correct;
    setQuizState(prev => ({
      ...prev,
      answered: true,
      selectedOption: option,
      score: isRight ? prev.score + 1 : prev.score,
    }));
    sendGAEvent('event', 'leren_question_answered', { thema: cleanSlug, correct: isRight });
    if (userId) {
      supabase.from('user_question_results').insert({ user_id: userId, question_id: q.id, was_correct: isRight }).then(() => {});
      if (isRight) awardCorrectAnswer(supabase, userId, q.id);
    }
  }

  function nextQuestion() {
    const next = quizState.current + 1;
    if (next >= quizState.questions.length) {
      setQuizState(prev => ({ ...prev, done: true }));
      const total = quizState.questions.length;
      sendGAEvent('event', 'leren_quiz_finished', { thema: cleanSlug, score: quizState.score, total, pct: total > 0 ? Math.round((quizState.score / total) * 100) : 0 });
      if (userId && thema) {
        supabase.from('user_leren_progress').upsert({
          user_id: userId, thema_id: thema.id, max_section: thema.sections.length, completed: true, completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,thema_id' }).then(() => {});
        awardXp(supabase, userId, 'leren_complete', thema.id);
      }
    } else {
      setQuizState(prev => ({ ...prev, current: next, answered: false, selectedOption: null }));
    }
  }

  function goToSection(idx: number) {
    document.querySelectorAll<HTMLAudioElement>('audio').forEach(a => { a.pause(); });
    setSectionIdx(idx);
    setView('section');
    window.scrollTo(0, 0);
    sendGAEvent('event', 'leren_section_opened', { thema: cleanSlug, section_index: idx, section_title: sections[idx]?.title ?? '' });
    if (userId && thema) {
      supabase.from('user_leren_progress').upsert({
        user_id: userId, thema_id: thema.id, max_section: idx + 1,
      }, { onConflict: 'user_id,thema_id' }).then(() => {});
    }
  }

  function goToOverview() {
    setView('overview');
    window.scrollTo(0, 0);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 5, height: 36, borderRadius: 99, background: 'linear-gradient(180deg,#fe762c,#d94f00)' }} />
            <span style={{ fontWeight: 800, fontSize: 26, color: '#002b6d', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Arial Black, sans-serif' }}>Inburgering Oefenen</span>
          </div>
          <div style={{ width: 160, height: 3, borderRadius: 99, background: '#e0e3e5', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#002b6d,#fe762c)', animation: 'knm-sweep 1.4s ease-in-out infinite' }} />
          </div>
        </div>
        <style>{`@keyframes knm-sweep { 0%{transform:translateX(-100%) scaleX(0.3)} 50%{transform:translateX(0%) scaleX(1)} 100%{transform:translateX(100%) scaleX(0.3)} }`}</style>
      </div>
    );
  }

  if (!thema) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fb' }}>
        <p style={{ color: '#434651' }}>Thema niet gevonden.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: var(--font-public-sans), 'Public Sans', sans-serif; background: #f8f9fb; color: #191c1e; }
        h1,h2,h3,h4 { font-family: var(--font-manrope), 'Manrope', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; vertical-align: middle; font-family: 'Material Symbols Outlined'; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #dash-sidebar { width:248px; flex-shrink:0; background:linear-gradient(180deg,#001d4e 0%,#002b6d 45%,#003580 100%); border-right:none; display:flex; flex-direction:column; height:100vh; position:sticky; top:0; box-shadow:4px 0 24px rgba(0,27,78,0.18); }
        #dash-main { flex:1; min-width:0; overflow-y:auto; height:100vh; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.65); cursor:pointer; transition:background .15s,color .15s; background:none; border:none; width:100%; text-align:left; font-family:inherit; text-decoration:none; }
        .nav-item:hover { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.9); }
        .nav-item.active { background:rgba(255,255,255,0.15); color:#fff; font-weight:600; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
        .leren-section-content img { max-width: 100%; border-radius: 12px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c4c6d2; border-radius: 3px; }
        #section-nav-bar { position:fixed; bottom:0; left:248px; right:0; z-index:50; background:#f8f9fb; border-top:1px solid #e6e8ea; padding:12px 24px; }
        #section-nav-bar .inner { max-width:860px; margin:0 auto; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; }
        #section-nav-bar .inner .nav-next { justify-self:end; }
        #section-nav-bar .btn-label-long { display:inline; }
        #section-nav-bar .btn-label-short { display:none; }
        @media (max-width:768px) {
          #dash-sidebar { display:none !important; }
          #dash-main { height:auto; overflow-y:visible; }
          #section-nav-bar { left:0; bottom:64px; padding:8px 12px; }
          #section-nav-bar .btn-label-long { display:none; }
          #section-nav-bar .btn-label-short { display:inline; }
        }
      `}</style>

      <div id="dash-layout" className="flex">
        <PlatformSidebar locale={locale} email={email} activeView="leren" />

        <main id="dash-main" className="flex-1 px-6 py-8 md:px-10">
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            {view === 'overview' && <OverviewView thema={thema} sections={sections} onGoToSection={goToSection} onStartQuiz={startQuiz} />}
            {view === 'section' && (
              <SectionView
                thema={thema}
                sections={sections}
                sectionIdx={sectionIdx}
                onBack={goToOverview}
                onGoToSection={goToSection}
                onStartQuiz={startQuiz}
              />
            )}
            {view === 'quiz' && (
              <QuizView
                thema={thema}
                quizState={quizState}
                onAnswer={answerQuestion}
                onNext={nextQuestion}
                onRetry={startQuiz}
                onGoToSection={goToSection}
                onBack={goToOverview}
                locale={locale}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function OverviewView({ thema, sections, onGoToSection, onStartQuiz }: {
  thema: LerenThema;
  sections: LerenSection[];
  onGoToSection: (idx: number) => void;
  onStartQuiz: () => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#002b6d,#1d428a)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.06em', marginBottom: 14 }}>
          THEMA {thema.id} VAN 7
        </span>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#002b6d', lineHeight: 1.2, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          {thema.title}
        </h1>
        <p style={{ fontSize: 15, color: '#434651', lineHeight: 1.7, maxWidth: 580, margin: '0 0 20px' }}>
          {thema.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6e7282', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#9fa3b0' }}>menu_book</span>
            {thema.sections.length} onderwerpen
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d0d3de', display: 'inline-block' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6e7282', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#9fa3b0' }}>quiz</span>
            Kennischeck aan het einde
          </span>
        </div>
        <button
          onClick={() => onGoToSection(0)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#002b6d', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, padding: '13px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 3px 14px rgba(0,43,109,0.28)', transition: 'transform 0.15s,box-shadow 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,43,109,0.36)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,43,109,0.28)'; }}
        >
          Begin met lezen
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#9fa3b0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Of spring direct naar een onderwerp</p>

        {sections.map((section, idx) => (
          <SectionCard key={section.id} section={section} onClick={() => onGoToSection(idx)} />
        ))}

        <button
          onClick={onStartQuiz}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', background: 'linear-gradient(135deg,#fff8f4,#fff)', border: '1.5px solid #f4d5c0', borderRadius: 14, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s,box-shadow 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#e8a882'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(162,64,0,0.08)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = '#f4d5c0'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ width: 36, height: 36, borderRadius: 10, background: '#fff0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#a24000' }}>quiz</span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#a24000', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>Kennischeck</div>
            <div style={{ fontSize: 13, color: '#6e7282' }}>Test jezelf met vragen over dit thema</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fa3b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

function SectionCard({ section, onClick }: { section: LerenSection; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: '#fff', border: '1px solid #e6e8ea', borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s,box-shadow 0.15s' }}
      onMouseOver={e => { e.currentTarget.style.borderColor = '#c4d4f0'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,43,109,0.08)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = '#e6e8ea'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#002b6d' }}>{section.icon}</span>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#002b6d', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>{section.title}</div>
        <div style={{ fontSize: 13, color: '#6e7282' }}>{section.subtitle}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fa3b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
  );
}

function SectionView({ thema, sections, sectionIdx, onBack, onGoToSection, onStartQuiz }: {
  thema: LerenThema;
  sections: LerenSection[];
  sectionIdx: number;
  onBack: () => void;
  onGoToSection: (idx: number) => void;
  onStartQuiz: () => void;
}) {
  const [current, setCurrent] = useState(sectionIdx);
  const total = sections.length;
  const touchStartX = useRef<number | null>(null);

  // Stop any playing audio whenever the visible section changes
  useEffect(() => {
    document.querySelectorAll<HTMLAudioElement>('audio').forEach(a => { a.pause(); });
  }, [current]);

  // Sync when parent changes sectionIdx (e.g. overview click)
  useEffect(() => { setCurrent(sectionIdx); }, [sectionIdx]);

  const section = sections[current];

  function prev() {
    if (current > 0) setCurrent(c => c - 1);
    else onBack();
  }

  function next() {
    if (current < total - 1) setCurrent(c => c + 1);
    else onStartQuiz();
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next(); else prev();
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 96px)', paddingBottom: 72 }}>
      {/* Mini header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#fff', border: '1px solid #e6e8ea', borderRadius: 12 }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}
          onMouseOver={e => { e.currentTarget.style.background = '#eceef0'; e.currentTarget.style.color = '#002b6d'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#434651'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Overzicht
        </button>
        <span style={{ color: '#d0d3de' }}>|</span>
        <span style={{ background: 'linear-gradient(135deg,#002b6d,#1d428a)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.04em', flexShrink: 0 }}>
          THEMA {thema.id}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#002b6d', flexShrink: 0 }}>{section.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#002b6d', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{section.title}</span>
        </span>
      </div>

      {/* Section content — height adapts to current section */}
      <div key={section.id} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <SectionContent section={section} />
      </div>

      {/* Navigation — fixed to viewport bottom, above mobile tab bar */}
      <div id="section-nav-bar">
        <div className="inner">
          <button
            onClick={prev}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
            onMouseOver={e => (e.currentTarget.style.background = '#eceef0')}
            onMouseOut={e => (e.currentTarget.style.background = '#f2f4f6')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span className="btn-label-long">{current > 0 ? sections[current - 1].title : 'Overzicht'}</span>
            <span className="btn-label-short">Vorige</span>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {sections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{ width: i === current ? 8 : 6, height: i === current ? 8 : 6, borderRadius: '50%', background: i <= current ? '#002b6d' : '#c4c6d2', transition: 'all 0.2s', flexShrink: 0, border: 'none', padding: 0, cursor: 'pointer' }}
                />
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#434651', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Sectie {current + 1} van {total}
            </span>
          </div>

          <button
            onClick={next}
            className="nav-next"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#fff', background: '#002b6d', border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', transition: 'transform 0.15s,box-shadow 0.15s', boxShadow: '0 2px 8px rgba(0,43,109,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,43,109,0.35)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,43,109,0.25)'; }}
          >
            <span className="btn-label-long">{current < total - 1 ? sections[current + 1].title : 'Kennischeck'}</span>
            <span className="btn-label-short">{current < total - 1 ? 'Volgende' : 'Kennischeck'}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizView({ thema, quizState, onAnswer, onNext, onRetry, onGoToSection, onBack, locale }: {
  thema: LerenThema;
  quizState: QuizState;
  onAnswer: (option: string) => void;
  onNext: () => void;
  onRetry: () => void;
  onGoToSection: (idx: number) => void;
  onBack: () => void;
  locale: string;
}) {
  const { questions, current, score, answered, selectedOption, done } = quizState;

  if (questions.length === 0) {
    return (
      <div style={{ background: '#002b6d', borderRadius: 24, padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>Geen vragen beschikbaar voor dit thema.</p>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>
          Terug naar overzicht
        </button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 60;
    return (
      <div style={{ background: '#002b6d', borderRadius: 24, padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(48px,10vw,64px)', fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: 'Manrope, sans-serif' }}>
          {score}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6em' }}>/{questions.length}</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{passed ? 'Goed gedaan! 🎉' : 'Bijna goed! Lees de theorie nog eens.'}</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>{pct}% correct</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
          <button
            onClick={onRetry}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '10px 20px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Opnieuw proberen
          </button>
          <a
            href={`/${locale}/dashboard`}
            style={{ background: '#fe762c', color: '#fff', padding: '10px 20px', borderRadius: 16, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}
          >
            Doe een proefexamen →
          </a>
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>📚 Herhaal de theorie</p>
          {thema.sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onGoToSection(i)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', textAlign: 'left' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              {s.title} <span style={{ opacity: 0.6, fontSize: 12 }}>→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const q = questions[current];
  const total = questions.length;
  const options: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#434651', background: '#f2f4f6', border: 'none', padding: '5px 10px', borderRadius: 7, cursor: 'pointer' }}
          onMouseOver={e => { e.currentTarget.style.background = '#eceef0'; e.currentTarget.style.color = '#002b6d'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#434651'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Overzicht
        </button>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#dc4400', background: 'rgba(220,68,0,0.08)', border: '1px solid rgba(220,68,0,0.2)', padding: '5px 10px', borderRadius: 7, cursor: 'pointer' }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,68,0,0.14)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(220,68,0,0.08)'; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          Stop kennischeck
        </button>
      </div>
    <div style={{ background: '#002b6d', borderRadius: 24, overflow: 'hidden' }}>
      <div style={{ padding: '32px 32px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)' }}>
            Vraag {current + 1} van {total}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < current + 1 ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'background 0.2s' }} />
            ))}
          </div>
        </div>

        <p style={{ color: '#fff', fontSize: 'clamp(15px,3vw,18px)', fontWeight: 600, marginBottom: 20, lineHeight: 1.45 }}>
          {q.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map(opt => {
            const label = q[`option${opt}` as 'optionA' | 'optionB' | 'optionC'];
            let bg = 'rgba(255,255,255,0.1)';
            let border = '1px solid rgba(255,255,255,0.2)';
            if (answered) {
              if (opt === q.correct) { bg = 'rgba(34,197,94,0.3)'; border = '2px solid rgb(74,222,128)'; }
              else if (opt === selectedOption) { bg = 'rgba(239,68,68,0.25)'; border = '1px solid rgb(248,113,113)'; }
              else { bg = 'rgba(255,255,255,0.05)'; border = '1px solid rgba(255,255,255,0.1)'; }
            }
            return (
              <button
                key={opt}
                disabled={answered}
                onClick={() => onAnswer(opt)}
                style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 16, background: bg, border, transition: 'all 0.15s', fontSize: 14, fontWeight: 500, color: answered && opt !== q.correct && opt !== selectedOption ? 'rgba(255,255,255,0.5)' : '#fff', cursor: answered ? 'default' : 'pointer' }}
              >
                <span style={{ fontWeight: 700, marginRight: 8, opacity: 0.7 }}>{opt}.</span>
                {label}
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>
              {selectedOption === q.correct ? '✅ Goed!' : '❌ Niet helemaal...'}
            </p>
            {q.explanation && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 12 }}>{q.explanation}</p>
            )}
            <button
              onClick={onNext}
              style={{ background: '#fff', color: '#002b6d', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              {current + 1 < total ? 'Volgende vraag →' : 'Zie resultaat →'}
            </button>
          </div>
        )}
      </div>
    </div>

    <div id="section-nav-bar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#fff', background: '#002b6d', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', transition: 'transform 0.15s,box-shadow 0.15s', boxShadow: '0 2px 8px rgba(0,43,109,0.25)' }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,43,109,0.35)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,43,109,0.25)'; }}
        >
          Klaar
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </button>
      </div>
    </div>
    </div>
  );
}
