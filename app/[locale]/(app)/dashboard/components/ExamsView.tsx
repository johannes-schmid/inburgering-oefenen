'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Session } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExamResult } from './InlineQuiz';
import InlineQuiz from './InlineQuiz';
import TopicOverview from './TopicOverview';
import type { SectionMeta } from './TopicOverview';
import type { KnmQuestion } from '@/data/questions';
import ExamIntro from '@/components/proefexamen/ExamIntro';
import ReadinessHero from './ReadinessHero';
import MariekeFeedback from './MariekeFeedback';
import { calculateSlaagkans, calculateMariekeFeedback } from '@/lib/exam-readiness';
import { fetchTotalXp } from '@/lib/xp';
import { pickMariekeState } from '@/lib/marieke-insights';

type Plan = 'free' | 'premium' | 'premium_plus';
type Progress = Record<string, ExamResult>;
type TopicStat = { total: number; mastered: number; reviewing: number; unseen: number };
type TopicProgress = Record<string, TopicStat>;

const EXAMS = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: `Proefexamen ${i + 1}`, questions: 45, free: i === 0 }));

const TOPICS = [
  { title: 'Werk en Inkomen', icon: '💼' },
  { title: 'Wonen', icon: '🏠' },
  { title: 'Gezondheid en Gezondheidszorg', icon: '🏥' },
  { title: 'Onderwijs en Opvoeding', icon: '🎓' },
  { title: 'Instanties', icon: '🏛️' },
  { title: 'Staatsinrichting en Rechtsstaat', icon: '⚖️' },
  { title: 'Geschiedenis en Geografie', icon: '📜' },
];

type Props = {
  plan: Plan;
  progress: Progress;
  session: Session | null;
  supabase: SupabaseClient;
  activeExam: { num: number; topicLabel?: string } | null;
  onOpenExam: (num: number) => void;
  onOpenTopic: (title: string) => void;
  onReturnFromExam: () => void;
  onExamComplete: (examNum: number, result: ExamResult) => void;
  initialTopic?: string | null;
  autoPracticeMistakes?: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamsView({ plan, progress, session, supabase, activeExam, onOpenExam, onOpenTopic, onReturnFromExam, onExamComplete, initialTopic, autoPracticeMistakes }: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [topicProgress, setTopicProgress] = useState<TopicProgress>({});
  const [allQuestions, setAllQuestions] = useState<KnmQuestion[]>([]);
  const [allSections, setAllSections] = useState<SectionMeta[]>([]);
  const [topicResults, setTopicResults] = useState<Record<number, boolean>>({});
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<KnmQuestion[] | null>(null);
  const [introExam, setIntroExam] = useState<number | null>(null);
  const [deepLinkConsumed, setDeepLinkConsumed] = useState(false);
  const [xp, setXp] = useState<number | null>(null);
  const [lastAnsweredAt, setLastAnsweredAt] = useState<string | null>(null);
  const isPremium = plan !== 'free';
  const isGuest = !session;
  const lockHref = isGuest ? `/${locale}/register` : '/activate';
  const completedExams = Object.keys(progress).filter(k => k.startsWith('exam_'));
  const scores = completedExams.map(k => progress[k].pct);
  const { slaagkans, avgScore, band } = calculateSlaagkans(scores);
  const mariekeFeedback = calculateMariekeFeedback(topicProgress);
  const hasMistakes = Object.values(topicResults).some(ok => !ok);
  const mariekeMessage = pickMariekeState({
    examResults: completedExams.map(k => ({ pct: progress[k].pct, passed: progress[k].passed, completedAt: progress[k].completedAt })),
    topicProgress,
    weakest: mariekeFeedback.weakest,
    slaagkans,
    mistakeCount: Object.values(topicResults).filter(ok => !ok).length,
    openCount: Object.values(topicProgress).reduce((a, s) => a + s.unseen, 0),
    totalQuestions: Object.values(topicProgress).reduce((a, s) => a + s.total, 0),
    answeredCount: Object.keys(topicResults).length,
    lastAnsweredAt,
    nowMs: Date.now(),
  });

  useEffect(() => {
    loadTopicProgress();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (deepLinkConsumed || allQuestions.length === 0) return;
    if (initialTopic) { setActiveTopic(initialTopic); setDeepLinkConsumed(true); }
    else if (autoPracticeMistakes) { practiceAllMistakes(); setDeepLinkConsumed(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic, autoPracticeMistakes, allQuestions, topicResults, deepLinkConsumed]);

  function practiceAllMistakes() {
    const wrongIds = new Set(Object.entries(topicResults).filter(([, ok]) => !ok).map(([id]) => Number(id)));
    if (wrongIds.size === 0 || allQuestions.length === 0) return;
    const subset = allQuestions.filter(q => wrongIds.has(q.id));
    setActiveTopic(null);
    setPracticeQuestions(shuffle(subset));
  }

  async function loadTopicProgress() {
    // Fetch questions (with section_id) and sections in parallel
    const [qRes, secRes] = await Promise.all([
      supabase
        .from('questions_flat')
        .select('id, category, question, option_a, option_b, option_c, correct, explanation, image_url, audio_question, audio_a, audio_b, audio_c, exam, section_id')
        .order('id'),
      supabase
        .from('sections')
        .select('id, slug, name_nl, sort_order, topic')
        .order('sort_order'),
    ]);

    const questions: KnmQuestion[] = (qRes.data ?? []).map(r => ({
      id: r.id, category: r.category, question: r.question,
      optionA: r.option_a, optionB: r.option_b, optionC: r.option_c,
      correct: r.correct as 'A' | 'B' | 'C', explanation: r.explanation,
      imageUrl: r.image_url ?? undefined,
      audioQuestion: r.audio_question ?? undefined,
      audioA: r.audio_a ?? undefined,
      audioB: r.audio_b ?? undefined,
      audioC: r.audio_c ?? undefined,
      exam: r.exam ?? null,
      section_id: r.section_id ?? null,
    }));
    setAllQuestions(questions);
    setAllSections((secRes.data ?? []) as SectionMeta[]);

    // Build total counts per topic
    const totals: Record<string, number> = {};
    questions.forEach(q => { totals[q.category] = (totals[q.category] || 0) + 1; });

    if (!session) { buildFromTotals(totals, {}, {}); return; }

    fetchTotalXp(supabase, session.user.id).then(setXp);

    try {
      const { data, error } = await supabase
        .from('user_question_results')
        .select('question_id, was_correct, answered_at')
        .eq('user_id', session.user.id)
        .order('answered_at', { ascending: true });

      if (error || !data) { buildFromTotals(totals, {}, {}); return; }

      // Per question: last write wins (sorted asc → last iteration = latest)
      const correct: Record<number, boolean> = {};
      data.forEach(r => { correct[r.question_id] = r.was_correct; });
      setTopicResults(correct);
      setLastAnsweredAt(data[data.length - 1]?.answered_at ?? null);

      const qMap: Record<number, string> = {};
      questions.forEach(q => { qMap[q.id] = q.category; });

      const masteredIds = new Set<number>();
      const reviewingIds = new Set<number>();
      Object.entries(correct).forEach(([id, isCorrect]) => {
        const numId = Number(id);
        if (isCorrect) masteredIds.add(numId);
        else reviewingIds.add(numId);
      });

      buildFromTotals(totals, masteredIds, reviewingIds, qMap);
    } catch {
      buildFromTotals(totals, {}, {});
    }
  }

  async function refreshResults() {
    if (!session) return;
    const { data } = await supabase
      .from('user_question_results')
      .select('question_id, was_correct, answered_at')
      .eq('user_id', session.user.id)
      .order('answered_at', { ascending: true });
    if (!data) return;
    const correct: Record<number, boolean> = {};
    data.forEach(r => { correct[r.question_id] = r.was_correct; });
    setTopicResults(correct);
    setLastAnsweredAt(data[data.length - 1]?.answered_at ?? null);

    // Rebuild topicProgress
    const totals: Record<string, number> = {};
    allQuestions.forEach(q => { totals[q.category] = (totals[q.category] || 0) + 1; });
    const qMap: Record<number, string> = {};
    allQuestions.forEach(q => { qMap[q.id] = q.category; });
    const masteredIds = new Set<number>();
    const reviewingIds = new Set<number>();
    Object.entries(correct).forEach(([id, isCorrect]) => {
      const numId = Number(id);
      if (isCorrect) masteredIds.add(numId);
      else reviewingIds.add(numId);
    });
    buildFromTotals(totals, masteredIds, reviewingIds, qMap);
  }

  function buildFromTotals(
    totals: Record<string, number>,
    masteredIds: Set<number> | Record<never, never>,
    reviewingIds: Set<number> | Record<never, never>,
    qMap?: Record<number, string>
  ) {
    const tp: TopicProgress = {};
    Object.keys(totals).forEach(cat => {
      tp[cat] = { total: totals[cat], mastered: 0, reviewing: 0, unseen: totals[cat] };
    });
    if (qMap) {
      (masteredIds as Set<number>).forEach(id => {
        const cat = qMap[id];
        if (cat && tp[cat]) { tp[cat].mastered++; tp[cat].unseen--; }
      });
      (reviewingIds as Set<number>).forEach(id => {
        const cat = qMap[id];
        if (cat && tp[cat]) { tp[cat].reviewing++; tp[cat].unseen--; }
      });
    }
    setTopicProgress(tp);
  }

  const activeQuizQuestions = activeExam && activeExam.num > 0
    ? allQuestions.filter(q => q.exam === activeExam.num)
    : [];

  // Proefexamen intro gate (show before starting quiz)
  if (activeExam && activeExam.num > 0 && activeQuizQuestions.length > 0 && introExam !== activeExam.num) {
    const examQuestions = activeQuizQuestions;
    const sampleAudio = examQuestions.find(q => q.audioQuestion)?.audioQuestion;
    return (
      <div className="py-4 px-1.5 sm:px-0">
        <button
          onClick={onReturnFromExam}
          className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary mb-5"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {t('btn_back_to_dashboard')}
        </button>

        <ExamIntro
          questions={examQuestions}
          sampleUrl={sampleAudio}
          onStart={() => setIntroExam(activeExam.num)}
          labels={{
            eyebrow: 'Oefenexamen',
            title: `Proefexamen ${activeExam.num}`,
            statQuestions: 'Vragen',
            statMinutes: 'Minuten',
            statPassing: 'Slagingsgrens',
            feedbackTag: 'Directe feedback',
            sectionsHeading: 'Vragen per onderwerp',
            startBtn: 'Start proefexamen',
            teacherTitle: 'NT2-docent — opgaven persoonlijk gecontroleerd',
            audio: {
              heading: 'Test je geluid',
              desc: 'Elke vraag kan worden voorgelezen — zet je geluid aan.',
              playSample: 'Speel af',
              audioOn: 'Audio aan',
              audioOff: 'Audio uit',
            },
          }}
        />
      </div>
    );
  }

  // Proefexamen quiz (after intro confirmed)
  if (activeExam && activeExam.num > 0 && activeQuizQuestions.length > 0 && introExam === activeExam.num) {
    return (
      <InlineQuiz
        questions={activeQuizQuestions}
        examNum={activeExam.num}
        timerSeconds={2700}
        session={session}
        supabase={supabase}
        plan={plan}
        sections={allSections}
        onReturn={() => { setIntroExam(null); onReturnFromExam(); }}
        onComplete={result => { setIntroExam(null); onExamComplete(activeExam.num, result); }}
      />
    );
  }

  // Topic practice quiz (launched from TopicOverview), or a cross-topic "review mistakes" session
  if (practiceQuestions) {
    return (
      <InlineQuiz
        questions={practiceQuestions}
        examNum={null}
        topicLabel={activeTopic ?? t('review_mistakes_label')}
        timerSeconds={0}
        session={session}
        supabase={supabase}
        onReturn={async () => { setPracticeQuestions(null); await refreshResults(); }}
        onComplete={() => { setPracticeQuestions(null); refreshResults(); }}
      />
    );
  }

  // Topic overview
  if (activeTopic) {
    const topicQs = allQuestions.filter(q => q.category === activeTopic);
    const topicSections = allSections.filter(s => s.topic === activeTopic);
    return (
      <TopicOverview
        category={activeTopic}
        questions={topicQs}
        sections={topicSections}
        results={topicResults}
        onPractice={subset => setPracticeQuestions(subset)}
        onBack={() => setActiveTopic(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Readiness hero */}
      <style>{`
        .rh-wrap{ display:flex; flex-direction:column; }
        .rh-marieke{ margin-top:16px; }
        .rh-gauge-wrap{ width:100%; max-width:240px; }
        @media (max-width:767px){
          .rh-card{ padding-bottom:36px !important; }
          .rh-marieke{ margin-top:-26px; position:relative; z-index:3; }
        }
        @media (min-width:768px){
          .rh-wrap{ flex-direction:row; align-items:stretch; gap:16px; }
          .rh-card{ flex:0 0 38%; max-width:380px; }
          .rh-marieke{ flex:1; min-width:0; margin-top:0; display:flex; }
          .rh-marieke > *{ flex:1; }
          .rh-gauge-wrap{ max-width:216px; }
        }
      `}</style>
      <div className="rh-wrap">
        <ReadinessHero
          slaagkans={slaagkans}
          band={band}
          examsCount={completedExams.length}
          avgScore={avgScore}
          xp={session ? xp : null}
        />
        <div className="rh-marieke">
          <MariekeFeedback
            message={mariekeMessage}
            topicProgress={topicProgress}
            hasMistakes={hasMistakes}
          />
        </div>
      </div>

      {/* Activate banner */}
      {!isPremium && (
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg,#001d4e 0%,#002b6d 60%,#1a3d7a 100%)', boxShadow: '0 4px 20px rgba(0,27,78,0.2)' }}
        >
          <div style={{ position: 'absolute', top: -20, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(254,118,44,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div className="text-white relative">
            <h2 className="font-headline font-extrabold text-base leading-snug">{isGuest ? t('guest_banner_title') : t('banner_unlock_title')}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{isGuest ? t('guest_banner_desc') : t('banner_unlock_desc')}</p>
          </div>
          <a href={lockHref} className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white no-underline relative" style={{ background: 'linear-gradient(135deg,#fe762c,#d94f00)', boxShadow: '0 4px 16px rgba(254,118,44,0.4)', whiteSpace: 'nowrap' }}>
            {isGuest ? t('guest_create_account') : t('btn_activate')}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      )}

      {/* Exam grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002b6d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {t('exams_title')}
          </h2>
          <span className="text-xs text-on-surface-variant font-medium">{t('exams_count')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXAMS.map(exam => {
            const result = progress['exam_' + exam.id];
            const unlocked = exam.free || isPremium;

            if (!unlocked) {
              return (
                <a key={exam.id} href={lockHref} className="exam-card locked" style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)', border: '1px solid #e6e8ea', display: 'block', textDecoration: 'none', color: 'inherit', transition: 'transform .18s,box-shadow .18s' }}
                  onMouseOver={e => { (e.currentTarget).style.transform = 'translateY(-3px)'; (e.currentTarget).style.boxShadow = '0 4px 20px rgba(254,118,44,0.18),0 10px 32px rgba(0,43,109,0.08)'; }}
                  onMouseOut={e => { (e.currentTarget).style.transform = ''; (e.currentTarget).style.boxShadow = '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)'; }}
                >
                  {/* Dark header */}
                  <div style={{ height: 120, background: 'linear-gradient(135deg,#3b3f4d,#1f2330)', position: 'relative', overflow: 'hidden', borderRadius: '1rem 1rem 0 0' }}>
                    {/* Watermark exam icon */}
                    <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.12, pointerEvents: 'none' }} width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    {/* Centered lock badge */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope,sans-serif' }}>Professioneel Pakket</span>
                      </div>
                    </div>
                  </div>
                  {/* Body */}
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: 15, color: '#191c1e', margin: '0 0 4px', lineHeight: 1.3 }}>{exam.title}</h3>
                    <p style={{ fontSize: 12, color: '#434651', margin: '0 0 14px' }}>{exam.questions} vragen · vergrendeld</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, borderTop: '1px solid #e6e8ea', paddingTop: 12, color: '#fe762c', fontWeight: 700 }}>
                      <span>Klik om te ontgrendelen</span>
                      <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </a>
              );
            }

            const cardBase: React.CSSProperties = { background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)', border: '1px solid #e6e8ea', display: 'block', textDecoration: 'none', color: 'inherit', transition: 'transform .18s,box-shadow .18s', cursor: 'pointer', width: '100%', textAlign: 'left' };
            const cardHoverOn = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(254,118,44,0.18),0 10px 32px rgba(0,43,109,0.08)'; };
            const cardHoverOff = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,43,109,0.06),0 4px 16px rgba(0,43,109,0.06)'; };

            const examWatermark = (
              <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.12, pointerEvents: 'none' }} width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            );

            if (result) {
              const passingPct = 70;
              const passed = result.pct >= passingPct;
              return (
                <div key={exam.id} className="exam-card free" style={cardBase} onClick={() => onOpenExam(exam.id)} onMouseOver={cardHoverOn} onMouseOut={cardHoverOff}>
                  <div style={{ height: 120, background: 'linear-gradient(135deg,#002b6d,#1d428a,#0d4499)', position: 'relative', overflow: 'hidden', borderRadius: '1rem 1rem 0 0' }}>
                    {examWatermark}
                    {/* Score overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: 32, color: '#fff', lineHeight: 1 }}>{result.pct}%</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: passed ? '#4ade80' : '#fca5a5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{passed ? t('exam_passed') : t('exam_failed')}</span>
                    </div>
                    {/* Top-left badge */}
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, fontFamily: 'Manrope,sans-serif' }}>{exam.free ? 'Gratis' : 'Beschikbaar'}</span>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: 15, color: '#191c1e', margin: '0 0 4px' }}>{exam.title}</h3>
                    <div style={{ height: 4, background: '#e6e8ea', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${result.pct}%`, background: passed ? '#16a34a' : 'linear-gradient(90deg,#fe762c,#d94f00)', borderRadius: 99 }} />
                    </div>
                    <p style={{ fontSize: 12, color: '#747782', margin: '0 0 14px' }}>{result.score}/{result.total} goed · {passingPct}% nodig</p>
                    <button onClick={e => { e.stopPropagation(); onOpenExam(exam.id); }} style={{ width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#fe762c,#d94f00)', border: 'none', cursor: 'pointer', boxShadow: '0 3px 12px rgba(254,118,44,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      {t('btn_retry')}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={exam.id} className="exam-card free" style={cardBase} onClick={() => onOpenExam(exam.id)} onMouseOver={cardHoverOn} onMouseOut={cardHoverOff}>
                <div style={{ height: 120, background: 'linear-gradient(135deg,#002b6d,#1d428a,#0d4499)', position: 'relative', overflow: 'hidden', borderRadius: '1rem 1rem 0 0' }}>
                  {examWatermark}
                  {/* Arrow button bottom-right */}
                  <div style={{ position: 'absolute', bottom: 12, right: 12, width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {/* Top-left badge */}
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{ background: exam.free ? '#fe762c' : 'rgba(255,255,255,0.15)', color: exam.free ? '#5f2200' : '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, fontFamily: 'Manrope,sans-serif' }}>{exam.free ? t('exam_free_badge') : t('exam_unlocked_badge')}</span>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: 15, color: '#191c1e', margin: '0 0 4px' }}>{exam.title}</h3>
                  <p style={{ fontSize: 12, color: '#434651', margin: '0 0 14px' }}>{exam.questions} vragen · 45 minuten</p>
                  <button onClick={e => { e.stopPropagation(); onOpenExam(exam.id); }} style={{ width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#fe762c,#d94f00)', border: 'none', cursor: 'pointer', boxShadow: '0 3px 12px rgba(254,118,44,0.35)' }}>
                    {t('btn_start_exam')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Topics grid with progress */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002b6d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            {t('topics_title')}
          </h2>
          <span className="text-xs text-on-surface-variant font-medium">{t('topics_count')}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#1a7a3c' }}/>{t('topic_mastered')}</span>
          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#fe762c' }}/>{t('topic_review')}</span>
          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#e0e3e5' }}/>{t('topic_new')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOPICS.map(topic => {
            const stat = topicProgress[topic.title];
            const pct = stat && stat.total > 0 ? Math.round((stat.mastered / stat.total) * 100) : 0;
            const masteredPct = stat ? (stat.mastered / stat.total) * 100 : 0;
            const reviewingPct = stat ? (stat.reviewing / stat.total) * 100 : 0;

            return (
              <button
                key={topic.title}
                onClick={() => {
                  if (!isPremium) { window.location.href = lockHref; return; }
                  setActiveTopic(topic.title);
                }}
                className="text-left rounded-xl px-4 py-4 flex flex-col gap-2"
                style={{ background: '#fff', border: '1.5px solid #e6e8ea', cursor: 'pointer', transition: 'border-color .15s,box-shadow .15s' }}
                onMouseOver={e => { (e.currentTarget).style.borderColor = '#c4d4f0'; (e.currentTarget).style.boxShadow = '0 2px 8px rgba(0,43,109,0.07)'; }}
                onMouseOut={e => { (e.currentTarget).style.borderColor = '#e6e8ea'; (e.currentTarget).style.boxShadow = ''; }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0">{topic.icon}</span>
                    <span className="text-sm font-semibold text-on-surface truncate">{topic.title}</span>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: pct >= 80 ? '#1a7a3c' : pct >= 40 ? '#a24000' : '#002b6d' }}>{pct}%</span>
                </div>
                {/* Segmented progress bar */}
                <div className="flex rounded-full overflow-hidden h-1.5 w-full" style={{ background: '#e0e3e5' }}>
                  {masteredPct > 0 && <div style={{ width: `${masteredPct}%`, background: '#1a7a3c', height: '100%' }} />}
                  {reviewingPct > 0 && <div style={{ width: `${reviewingPct}%`, background: '#fe762c', height: '100%' }} />}
                </div>
                {stat ? (
                  <p className="text-xs text-on-surface-variant">{t('topic_stats', { mastered: stat.mastered, reviewing: stat.reviewing, unseen: stat.unseen })}</p>
                ) : (
                  <p className="text-xs text-on-surface-variant">{t('topic_not_practiced')}</p>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
