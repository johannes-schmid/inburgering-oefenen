'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { awardXp, awardCorrectAnswer } from '@/lib/xp';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@/lib/analytics';
import type { KnmQuestion } from '@/data/questions';
import ExamQuestionCard from '@/components/proefexamen/ExamQuestionCard';
import ExamIntro from '@/components/proefexamen/ExamIntro';
import { useAudioEnabled } from '@/lib/audio-pref';

const TOTAL_SECONDS = 2700;
const PASS_THRESHOLD_PCT = 0.7;

type AnsweredEntry = {
  q: KnmQuestion;
  chosen: string;
  isCorrect: boolean;
};

type WrongAnswer = {
  q: KnmQuestion;
  chosen: string;
};

type CatScore = { correct: number; total: number };

type ExamResults = {
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  catScores: Record<string, CatScore>;
  timeTaken: number;
};

type Phase = 'intro' | 'quiz' | 'results';

type Props = {
  examNum: number;
  isDashboardMode: boolean;
  allQuestions: KnmQuestion[];
};

export default function ProefexamenEngine({ examNum, isDashboardMode, allQuestions }: Props) {
  const t = useTranslations('proefexamen');
  const supabase = createClient();

  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<KnmQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [catScores, setCatScores] = useState<Record<string, CatScore>>({});
  const [answeredLog, setAnsweredLog] = useState<AnsweredEntry[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [results, setResults] = useState<ExamResults | null>(null);
  const [emailValue, setEmailValue] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailFormVisible, setEmailFormVisible] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailInFlight, setEmailInFlight] = useState(false);
  const [highlightedWrong, setHighlightedWrong] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [userId, setUserId] = useState<string | null>(null);

  const [audioEnabled] = useAudioEnabled();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(TOTAL_SECONDS);
  const answeredLogRef = useRef<AnsweredEntry[]>([]);
  const catScoresRef = useRef<Record<string, CatScore>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        const plan =
          (session.user.user_metadata?.tier as string) ??
          (localStorage.getItem('io_plan') || 'free');
        setUserPlan(plan);
      } else {
        const stored =
          localStorage.getItem('io_plan') ||
          (localStorage.getItem('io_premium') === 'true' ? 'premium' : 'free');
        setUserPlan(stored);
      }
    });
  }, []);

  function buildQuestions() {
    return allQuestions.filter((q) => q.exam === examNum);
  }

  function initCatScores(qs: KnmQuestion[]): Record<string, CatScore> {
    const acc: Record<string, CatScore> = {};
    qs.forEach((q) => {
      if (!acc[q.category]) acc[q.category] = { correct: 0, total: 0 };
      acc[q.category].total++;
    });
    return acc;
  }

  function startExam() {
    const qs = buildQuestions();
    const cats = initCatScores(qs);
    answeredLogRef.current = [];
    catScoresRef.current = cats;
    setQuestions(qs);
    setCatScores(cats);
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setAnsweredLog([]);
    setWrongAnswers([]);
    setResults(null);
    secondsRef.current = TOTAL_SECONDS;
    setSecondsLeft(TOTAL_SECONDS);
    setPhase('quiz');
    startTimer();
    sendGAEvent('event', 'testexamen_started', { exam_number: examNum });
  }

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      secondsRef.current--;
      setSecondsLeft(secondsRef.current);
      if (secondsRef.current <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        finishExam();
      }
    }, 1000);
  }

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  function selectAnswer(opt: string) {
    if (selected !== null) return;
    setSelected(opt);

    const q = questions[currentIdx];
    const isCorrect = opt === q.correct;

    const newEntry: AnsweredEntry = { q, chosen: opt, isCorrect };
    answeredLogRef.current = [...answeredLogRef.current, newEntry];
    setAnsweredLog(answeredLogRef.current);

    if (isCorrect) {
      setScore((s) => s + 1);
      const cats = { ...catScoresRef.current };
      cats[q.category] = { ...cats[q.category], correct: cats[q.category].correct + 1 };
      catScoresRef.current = cats;
      setCatScores(cats);
    } else {
      setWrongAnswers((prev) =>
        prev.length < 10 ? [...prev, { q, chosen: opt }] : prev
      );
    }

    sendGAEvent('event', 'question_answered', { exam_number: examNum, correct: isCorrect });
    track('question_answered', { source: 'proefexamen', exam_number: examNum, topic: null, is_correct: isCorrect });

    if (userId) {
      supabase
        .from('user_question_results')
        .insert({ user_id: userId, question_id: q.id, exam: examNum, was_correct: isCorrect })
        .then(() => {});
      if (isCorrect) awardCorrectAnswer(supabase, userId, q.id);
    }
  }

  const audioStopRef = useRef<(() => void) | null>(null);

  function nextQuestion() {
    audioStopRef.current?.();
    const next = currentIdx + 1;
    if (next >= questions.length) {
      finishExam();
    } else {
      setCurrentIdx(next);
      setSelected(null);
    }
  }

  function finishExam() {
    stopTimer();
    const total = questions.length;
    const computedScore = answeredLogRef.current.filter((e) => e.isCorrect).length;
    const pct = Math.round((computedScore / total) * 100);
    const passed = computedScore >= Math.ceil(total * PASS_THRESHOLD_PCT);
    const timeTaken = TOTAL_SECONDS - secondsRef.current;

    const res: ExamResults = {
      score: computedScore,
      total,
      pct,
      passed,
      catScores: catScoresRef.current,
      timeTaken,
    };

    setResults(res);
    setPhase('results');
    sendGAEvent('event', 'testexamen_finished', { exam_number: examNum, score: computedScore, total, pct, passed });
    track('exam_finished', { source: 'proefexamen', exam_number: examNum, score: computedScore, total, pct, passed });

    if (isDashboardMode && userId) {
      try {
        const key = `io_progress_${userId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        existing[`exam_${examNum}`] = {
          score: res.score,
          total: res.total,
          pct: res.pct,
          passed: res.passed,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {}

      supabase
        .from('exam_results')
        .upsert(
          {
            user_id: userId,
            exam_number: examNum,
            score: res.score,
            total: res.total,
            pct: res.pct,
            passed: res.passed,
            cat_scores: res.catScores,
          },
          { onConflict: 'user_id,exam_number' }
        )
        .then(() => {});
      awardXp(supabase, userId, 'exam_completed', examNum);
      if (res.passed) awardXp(supabase, userId, 'exam_passed', examNum);
    }

    try {
      localStorage.setItem('io_pending_results', JSON.stringify(res));
    } catch {}
  }

  async function submitEmailReport() {
    if (emailInFlight || !results) return;
    const email = emailValue.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setEmailInFlight(true);
    try {
      await fetch('/api/submit-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...results, email, source: 'proefexamen_email_cta' }),
      });
    } catch {}
    setEmailInFlight(false);
    setEmailSent(true);
    setEmailFormVisible(false);
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  const timerPct = (secondsLeft / TOTAL_SECONDS) * 100;
  const isWarning = secondsLeft <= 300;

  if (phase === 'intro') {
    return (
      <div id="intro" className="px-6 sm:px-0">
        <ExamIntro
          questions={allQuestions.filter((q) => q.exam === examNum)}
          sampleUrl={allQuestions.find((q) => q.exam === examNum && q.audioQuestion)?.audioQuestion}
          onStart={startExam}
          labels={{
            eyebrow: t('badge_num_pre'),
            title: `${t('badge_num_pre')} ${examNum}`,
            statQuestions: t('stat_questions'),
            statMinutes: t('stat_minutes'),
            statPassing: t('stat_passing'),
            feedbackTag: t('feedback_tag'),
            sectionsHeading: t('sections_heading'),
            startBtn: t('start_btn'),
            teacherTitle: t('teacher_title'),
            audio: {
              heading: t('audio_check_heading'),
              desc: t('audio_check_desc'),
              playSample: t('audio_play_sample'),
              audioOn: t('audio_on'),
              audioOff: t('audio_off'),
            },
          }}
          teacherHref={
            <Link href="/docent" className="no-underline hover:text-primary transition-colors text-on-surface">
              Marieke Schipper
            </Link>
          }
          secondaryAction={
            <Link
              href="/oefenvragen"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-surface-container text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-high transition-colors text-sm no-underline"
            >
              {t('practice_topics')}
            </Link>
          }
        />
      </div>
    );
  }

  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[currentIdx];
    const total = questions.length;
    const pctDone = (currentIdx / total) * 100;
    const isLast = currentIdx === total - 1;

    return (
      <div className="qe-quiz-body pt-4 px-6 sm:px-0">
        {/* Fixed timer bar (non-dashboard mode) */}
        {!isDashboardMode && (
          <div
            className="fixed left-0 right-0 z-40"
            style={{
              top: '73px',
              background: 'rgba(248,249,251,0.95)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                Vraag {currentIdx + 1} / {total}
              </span>
              <div className="flex-1 h-[3px] rounded-full self-center" style={{ background: '#e0e3e5' }}>
                <div
                  className="h-[3px] rounded-full transition-[width] duration-1000 ease-linear"
                  style={{
                    width: `${timerPct}%`,
                    background: isWarning ? '#dc2626' : 'linear-gradient(to right,#a24000,#fe762c)',
                  }}
                />
              </div>
              <span
                className="font-headline font-bold text-sm whitespace-nowrap"
                style={{ color: isWarning ? '#dc2626' : '#a24000' }}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>
          </div>
        )}

        {/* Inline timer strip (dashboard mode) */}
        {isDashboardMode && (
          <div style={{ marginBottom: '.75rem' }}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors no-underline"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  flexShrink: 0,
                }}
              >
                ← {t('back_btn')}
              </Link>
              <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: '#e0e3e5' }}>
                <div
                  className="h-[4px] rounded-full transition-[width] duration-1000 ease-linear"
                  style={{
                    width: `${timerPct}%`,
                    background: isWarning ? '#dc2626' : 'linear-gradient(to right,#a24000,#fe762c)',
                  }}
                />
              </div>
              <span
                className="font-headline font-bold text-sm whitespace-nowrap"
                style={{ color: isWarning ? '#dc2626' : '#a24000', minWidth: '3rem', textAlign: 'right' }}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>
          </div>
        )}

        {/* Exam header banner */}
        <div
          className="rounded-2xl mb-5 flex items-center justify-between gap-3"
          style={{
            background: 'linear-gradient(135deg,#002b6d 0%,#1e3a8a 100%)',
            padding: '.875rem 1.25rem',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              className="uppercase font-extrabold"
              style={{ color: 'rgba(255,255,255,.6)', fontSize: '.6rem', letterSpacing: '.12em', marginBottom: '.2rem' }}
            >
              KNM Proefexamen
            </div>
            <div
              className="font-extrabold whitespace-nowrap"
              style={{ color: '#fff', fontSize: '.95rem' }}
            >
              Examen {examNum}&nbsp;
              <span style={{ color: 'rgba(255,255,255,.45)', fontWeight: 500, fontSize: '.78rem' }}>
                {total} vragen · 45 min.
              </span>
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div
              className="uppercase font-bold"
              style={{ color: 'rgba(255,255,255,.55)', fontSize: '.6rem', letterSpacing: '.08em', marginBottom: '.15rem' }}
            >
              Score
            </div>
            <div className="font-extrabold whitespace-nowrap" style={{ color: '#fff', fontSize: '1rem' }}>
              {score}{' '}
              <span style={{ color: 'rgba(255,255,255,.45)', fontWeight: 500, fontSize: '.8rem' }}>
                / {total}
              </span>
            </div>
          </div>
        </div>

        {/* Progress strip */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="flex justify-between items-center mb-1">
            <span
              className="uppercase font-bold"
              style={{ fontSize: '.72rem', color: '#747782', letterSpacing: '.07em' }}
            >
              Vraag {currentIdx + 1} van {total}
            </span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#a0a3ad' }}>
              {Math.round(pctDone)}% voltooid
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: '.5rem', background: '#e0e3e5' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pctDone}%`,
                background: 'linear-gradient(to right,#a24000,#fe762c)',
                transition: 'width .4s cubic-bezier(.4,0,.2,1)',
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <ExamQuestionCard
          question={q}
          questionNumber={currentIdx + 1}
          selected={selected as 'A' | 'B' | 'C' | null}
          onSelect={(lbl) => selectAnswer(lbl)}
          audioEnabled={audioEnabled}
          showFeedback={true}
          stopRef={audioStopRef}
        />

        {/* Next button — inline on desktop, fixed on mobile */}
        {selected !== null && (
          <>
            <div className="hidden sm:block mt-4">
              <NextBtn isLast={isLast} onClick={nextQuestion} />
            </div>
            <div
              className="sm:hidden fixed left-0 right-0 z-[99]"
              style={{
                bottom: 0,
                background: 'rgba(248,249,251,.97)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderTop: '1px solid rgba(0,0,0,.07)',
                padding: '12px 20px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
              }}
            >
              <NextBtn isLast={isLast} onClick={nextQuestion} fullWidth />
            </div>
          </>
        )}

        {/* Spacer for fixed bottom bar on mobile */}
        {selected !== null && <div className="sm:hidden h-[76px]" />}
      </div>
    );
  }

  if (phase === 'results' && results) {
    const { score: finalScore, total, pct, passed, catScores: cats } = results;
    const circ = 251.33;
    const dash = ((pct / 100) * circ).toFixed(1);

    // Dashboard mode: full detailed results with score hero + answer trail + wrong answers + focus panel
    if (isDashboardMode) {
      const heroBg = passed
        ? 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#10b981 100%)'
        : 'linear-gradient(135deg,#7c2d12 0%,#9a3412 50%,#f97316 100%)';
      const heroLabel = passed ? t('pass_label') : t('fail_label');
      const heroSub = passed ? t('pass_sub') : t('fail_sub');
      let wrongIdx = 0;

      return (
        <div id="qe-results" className="pt-4 px-6 sm:px-0 flex flex-col gap-4">
          <div className="rounded-3xl flex items-center justify-between gap-8" style={{ background: heroBg, padding: '2.25rem 2rem' }}>
            <div style={{ minWidth: 0 }}>
              <div className="uppercase font-extrabold mb-2" style={{ color: 'rgba(255,255,255,.7)', fontSize: '.65rem', letterSpacing: '.14em' }}>{heroLabel}</div>
              <div className="font-extrabold mb-2" style={{ color: '#fff', fontSize: '1.65rem', lineHeight: 1.15, letterSpacing: '-.01em' }}>{heroSub}</div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.95rem' }}>
                Score: <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{finalScore} van {total}</strong> {t('score_text')}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <svg width="108" height="108" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="9" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 50 50)" />
                <text x="50" y="46" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="19" fontWeight="800" fontFamily="sans-serif">{pct}%</text>
                <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,.6)" fontSize="9" fontFamily="sans-serif">{t('score_label')}</text>
              </svg>
            </div>
          </div>

          {answeredLog.length > 0 && (
            <div className="rounded-2xl" style={{ background: '#fff', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <p className="uppercase font-extrabold mb-3" style={{ fontSize: '.65rem', letterSpacing: '.1em', color: '#747782', margin: '0 0 .75rem' }}>
                Jouw antwoorden · {answeredLog.length}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {answeredLog.map((entry, i) => {
                  if (entry.isCorrect) {
                    return <div key={i} title="Goed" className="rounded-full flex-shrink-0" style={{ width: 18, height: 18, background: '#10b981' }} />;
                  } else {
                    const wi = wrongIdx++;
                    return <button key={i} title="Fout" onClick={() => setHighlightedWrong(wi)} className="rounded-full flex-shrink-0 border-0 cursor-pointer p-0" style={{ width: 18, height: 18, background: '#f97316', transition: 'transform .1s,box-shadow .1s' }} />;
                  }
                })}
              </div>
              <p className="text-xs mt-2" style={{ color: '#a0a3ad' }}>
                <span className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1" style={{ background: '#10b981' }} />Goed&nbsp;&nbsp;
                <span className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1" style={{ background: '#f97316' }} />Fout
              </p>
            </div>
          )}

          {wrongAnswers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="rounded-2xl" style={{ background: '#fff', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <p className="uppercase font-extrabold mb-3" style={{ fontSize: '.65rem', letterSpacing: '.1em', color: '#747782' }}>Foute antwoorden</p>
                <div className="flex flex-col">
                  {wrongAnswers.map((w, wi) => {
                    const chosenText = w.q[`option${w.chosen}` as 'optionA' | 'optionB' | 'optionC'] || w.chosen;
                    const correctText = w.q[`option${w.q.correct}` as 'optionA' | 'optionB' | 'optionC'] || w.q.correct;
                    const expl = w.q.explanation ? w.q.explanation.slice(0, 150) + (w.q.explanation.length > 150 ? '…' : '') : '';
                    const isHighlighted = highlightedWrong === wi;
                    return (
                      <div key={wi} id={`qe-wrong-item-${wi}`} style={{ padding: '.7rem .6rem', borderLeft: `3px solid ${isHighlighted ? '#f97316' : 'transparent'}`, borderRadius: '.5rem', background: isHighlighted ? '#fff4ee' : 'transparent', transition: 'background .2s,border-color .2s', borderBottom: wi < wrongAnswers.length - 1 ? '1px solid #f0f1f3' : 'none' }}>
                        <p className="font-semibold leading-snug mb-1" style={{ fontSize: '.82rem', color: '#191c1e' }}>
                          {w.q.question.length > 90 ? w.q.question.slice(0, 90) + '…' : w.q.question}
                        </p>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="inline-flex items-center justify-center rounded-full font-extrabold" style={{ width: 14, height: 14, background: 'rgba(239,68,68,.1)', color: '#dc2626', fontSize: '.6rem', flexShrink: 0 }}>✗</span>
                          <span style={{ fontSize: '.78rem', color: '#dc2626' }}>{chosenText}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center rounded-full font-extrabold" style={{ width: 14, height: 14, background: 'rgba(34,197,94,.1)', color: '#16a34a', fontSize: '.6rem', flexShrink: 0 }}>✓</span>
                          <span className="font-semibold" style={{ fontSize: '.78rem', color: '#16a34a' }}>{correctText}</span>
                        </div>
                        {expl && (
                          <details className="mt-1">
                            <summary className="cursor-pointer font-semibold" style={{ fontSize: '.7rem', color: '#a0a3ad', listStyle: 'none' }}>Toon uitleg</summary>
                            <p style={{ fontSize: '.75rem', color: '#747782', marginTop: '.25rem', lineHeight: 1.45 }}>{expl}</p>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl" style={{ background: 'linear-gradient(160deg,#001a44 0%,#002b6d 100%)', padding: '1.5rem 1.25rem', boxShadow: '0 4px 16px rgba(0,27,80,.25)' }}>
                <p className="uppercase font-extrabold mb-1" style={{ fontSize: '.65rem', letterSpacing: '.1em', color: 'rgba(255,255,255,.45)' }}>Focus op</p>
                <p className="font-extrabold mb-1" style={{ color: '#fff', fontSize: '1rem', lineHeight: 1.2 }}>Waar verder oefenen?</p>
                <p className="mb-4" style={{ color: 'rgba(255,255,255,.55)', fontSize: '.78rem', lineHeight: 1.4 }}>Oefen gericht de onderwerpen waar je fouten maakte.</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(cats).sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total).slice(0, 4).map(([cat, cs]) => {
                    const cp = cs.total ? Math.round((cs.correct / cs.total) * 100) : 0;
                    const col = cp >= 70 ? '#16a34a' : cp >= 40 ? '#d97706' : '#dc2626';
                    return (
                      <div key={cat} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)' }}>
                        <span className="font-bold text-white truncate" style={{ fontSize: '.82rem' }}>{cat}</span>
                        <span className="font-semibold whitespace-nowrap" style={{ fontSize: '.82rem', color: col }}>{cs.correct}/{cs.total} ({cp}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl" style={{ background: '#fff', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <p className="uppercase font-extrabold mb-3" style={{ fontSize: '.65rem', letterSpacing: '.1em', color: '#747782' }}>Resultaat per onderwerp</p>
            <div className="flex flex-col gap-2">
              {Object.entries(cats).map(([cat, cs]) => {
                const cp = cs.total ? Math.round((cs.correct / cs.total) * 100) : 0;
                const col = cp >= 70 ? '#16a34a' : cp >= 40 ? '#d97706' : '#dc2626';
                return (
                  <div key={cat} className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: '#f2f4f6' }}>
                    <span style={{ fontSize: '.82rem', color: '#434651' }}>{cat}</span>
                    <span className="font-semibold" style={{ fontSize: '.82rem', color: col }}>{cs.correct}/{cs.total} ({cp}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Link href="/dashboard" className="flex items-center justify-center gap-2 w-full py-3.5 font-bold rounded-xl text-white no-underline text-sm" style={{ background: '#002b6d', boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,.12)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Terug naar examens
          </Link>
        </div>
      );
    }

    // Public mode: gate UI — blurred score, email capture, platform preview, visible topic breakdown
    const lockIcon = (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#747782" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );

    return (
      <div id="qe-results" className="pt-4 px-6 sm:px-0 flex flex-col gap-5">
        <h1 className="font-headline font-extrabold text-2xl text-on-surface">Jouw testresultaten</h1>

        {/* Blurred score circle */}
        <div className="bg-white rounded-2xl p-8 text-center relative border" style={{ borderColor: '#e6e8ea', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ filter: emailSent ? 'none' : 'blur(8px)', userSelect: 'none', pointerEvents: 'none', transition: 'filter .4s' }}>
            <div className="mx-auto mb-4" style={{ width: 120, height: 120, background: `conic-gradient(#fe762c ${pct}%, #e0e3e5 0%)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="bg-white rounded-full flex flex-col items-center justify-center" style={{ width: 90, height: 90 }}>
                <span className="font-headline font-extrabold text-xl" style={{ color: '#a24000' }}>{pct}%</span>
              </div>
            </div>
            <p className="font-bold text-on-surface text-base mb-0.5">{passed ? 'Geslaagd ✓' : 'Nog niet geslaagd'}</p>
            <p className="text-sm text-on-surface-variant">Score: {finalScore} van {total} vragen goed</p>
          </div>
          {!emailSent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              {lockIcon}
              <p className="text-xs text-on-surface-variant font-semibold">Ontvang je rapport om je score te zien</p>
            </div>
          )}
        </div>

        {/* CTAs + email form */}
        <div id="qe-email-section">
          <div className="flex gap-3">
            <button onClick={() => setEmailFormVisible((v) => !v)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer" style={{ background: '#f2f4f6', color: '#1a1c23', border: '1.5px solid #e0e2e8', transition: 'background .15s' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></svg>
              Ontvang rapport
            </button>
            <button onClick={() => { window.location.href = '/register'; }} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white text-sm border-0 cursor-pointer hover:-translate-y-0.5 transition-transform active:scale-95" style={{ background: '#002b6d', boxShadow: '0 3px 0 0 #001a44' }}>
              Meer oefenen
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          {emailFormVisible && !emailSent && (
            <div className="mt-3">
              <div className="flex gap-2">
                <input type="email" value={emailValue} onChange={(e) => { setEmailValue(e.target.value); setEmailError(false); }} placeholder="jouw@email.nl" className="flex-1 px-4 py-2.5 rounded-xl text-sm" style={{ border: `1.5px solid ${emailError ? '#ef4444' : '#e0e2e8'}`, color: '#1a1c23', outline: 'none' }} />
                <button onClick={submitEmailReport} disabled={emailInFlight} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white flex-shrink-0 disabled:opacity-60" style={{ background: '#002b6d', boxShadow: '0 3px 0 0 #001a44', border: 0, cursor: 'pointer' }}>
                  {emailInFlight ? '...' : 'Verstuur'}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-2" style={{ opacity: .55 }}>Gratis · geen account vereist</p>
            </div>
          )}
          {emailSent && <p className="mt-3 text-sm text-on-surface-variant">✓ Rapport onderweg — check je inbox.</p>}
        </div>

        {/* Platform preview */}
        <div className="rounded-2xl border" style={{ borderColor: '#e6e8ea', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#f0f1f3' }}>
            <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#747782' }}>Zo ziet je studieportaal eruit</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1" style={{ background: '#f2f4f6', color: '#747782' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Inloggen vereist
            </span>
          </div>
          <div className="p-4">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#747782' }}>Proefexamens</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Exam 1: completed (this exam) */}
              <div className="rounded-xl p-3 text-center border" style={{ borderColor: '#e0e8f0', background: '#f8faff' }}>
                <p className="text-xs font-bold text-on-surface mb-1">Examen 1</p>
                <p className="text-xs font-extrabold" style={{ color: pct >= 70 ? '#16a34a' : '#a24000' }}>{pct}%</p>
                <p className="text-xs" style={{ color: '#a0a3ad', fontSize: '.65rem' }}>{finalScore}/{total}</p>
              </div>
              {[2, 3, 4, 5].map(n => (
                <div key={n} className="rounded-xl p-3 text-center border" style={{ borderColor: '#e6e8ea', background: '#f9f9fb' }}>
                  <p className="text-xs font-bold text-on-surface mb-1">Examen {n}</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a3ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-0.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <p className="text-xs font-semibold" style={{ color: '#a0a3ad', fontSize: '.65rem' }}>Ontgrendelen</p>
                </div>
              ))}
              <div className="rounded-xl p-3 text-center border" style={{ borderColor: '#e6e8ea', background: '#f9f9fb' }}>
                <p className="text-xs font-bold text-on-surface mb-1">Meer…</p>
                <p className="text-xs" style={{ color: '#a0a3ad', fontSize: '.65rem' }}>10 examens</p>
              </div>
            </div>

            {/* Vocab card blurred */}
            <div className="rounded-xl px-4 py-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#a24000 0%,#fe762c 100%)' }}>
              <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                <p className="text-xs font-extrabold text-white/80 uppercase tracking-wider mb-0.5">Woordenschat Trainer</p>
                <p className="text-sm font-bold text-white">400 woorden · NL / EN / AR</p>
                <p className="text-xs text-white/70">Oefen alle KNM-woordenschat</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <span className="text-sm font-bold text-white">Beschikbaar na inloggen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visible topic breakdown */}
        <div className="rounded-2xl" style={{ background: '#fff', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <p className="uppercase font-extrabold mb-3" style={{ fontSize: '.65rem', letterSpacing: '.1em', color: '#747782' }}>Resultaten per onderwerp</p>
          <div className="flex flex-col gap-2">
            {Object.entries(cats).map(([cat, cs]) => {
              const cp = cs.total ? Math.round((cs.correct / cs.total) * 100) : 0;
              const col = cp >= 70 ? '#16a34a' : cp >= 40 ? '#d97706' : '#dc2626';
              return (
                <div key={cat} className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: '#f2f4f6' }}>
                  <span style={{ fontSize: '.82rem', color: '#434651' }}>{cat}</span>
                  <span className="font-semibold" style={{ fontSize: '.82rem', color: col }}>{cs.correct}/{cs.total} ({cp}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setPhase('intro'); setResults(null); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors border-0 cursor-pointer">
            Opnieuw beginnen
          </button>
          <Link href="/oefenvragen" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors no-underline">
            Oefen per onderwerp
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

function NextBtn({
  isLast,
  onClick,
  fullWidth,
}: {
  isLast: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      id="qe-next-btn"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl text-sm border-0 cursor-pointer hover:-translate-y-0.5 transition-transform active:scale-95${fullWidth ? ' w-full justify-center' : ''}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}
    >
      {isLast ? (
        <>
          Bekijk resultaat
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      ) : (
        <>
          Volgende vraag
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </button>
  );
}
