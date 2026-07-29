'use client';

import { useState, useEffect, useRef } from 'react';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@/lib/analytics';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import ExamQuestionCard from '@/components/proefexamen/ExamQuestionCard';
import { useAudioEnabled } from '@/lib/audio-pref';
import { awardXp, awardCorrectAnswer } from '@/lib/xp';
import { recordExamAttempt } from '@/lib/attempts';
import { PASS_THRESHOLD_PCT } from '@/lib/api-constants';
import { LEREN_CATEGORY_META, DB_SECTION_TO_LEREN, lerenLinkForSectionSlug, lerenLinkForCategory, type LerenLink } from '@/lib/leren-links';

export type QuizQuestion = {
  id: number;
  /** From the stimulus' exam; needed to record which skill an attempt belongs to. */
  skill?: 'lezen' | 'luisteren';
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  /** DUO uses 3 OR 4 options — undefined for a three-option item. */
  optionD?: string;
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  imageUrl?: string | null;
  optionLayout?: 'text' | 'image' | 'image_grid';
  audioQuestion?: string | null;
  audioA?: string | null;
  audioB?: string | null;
  audioC?: string | null;
  audioD?: string | null;
  exam: number | null;
  section_id?: number | null;
  section_slug?: string;
};

export type ExamResult = {
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  completedAt?: string;
};

type Section = { id: number; slug: string; name_nl: string; topic: string };

type Props = {
  questions: QuizQuestion[];
  examNum: number | null;
  topicLabel?: string;
  timerSeconds: number;
  session: Session | null;
  supabase: ReturnType<typeof createClient>;
  plan?: 'free' | 'premium' | 'premium_plus';
  sections?: Section[];
  onReturn: () => void;
  onComplete: (result: ExamResult) => void;
};

export default function InlineQuiz({ questions, examNum, topicLabel, timerSeconds, session, supabase, plan, sections, onReturn, onComplete }: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isGuest = !session;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);
  const [done, setDone] = useState(false);
  const [catScores, setCatScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [answeredLog, setAnsweredLog] = useState<Array<{ q: QuizQuestion; chosen: 'A' | 'B' | 'C'; isCorrect: boolean }>>([]);
  const [highlightedWrong, setHighlightedWrong] = useState<number | null>(null);
  const [audioEnabled] = useAudioEnabled();
  // Guest email gate state
  const [guestEmailValue, setGuestEmailValue] = useState('');
  const [guestEmailError, setGuestEmailError] = useState(false);
  const [guestEmailSent, setGuestEmailSent] = useState(false);
  const [guestEmailInFlight, setGuestEmailInFlight] = useState(false);
  const [guestScoreRevealed, setGuestScoreRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);

  const total = questions.length;
  const timerEnabled = timerSeconds > 0;

  useEffect(() => {
    const init: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      if (!init[q.category]) init[q.category] = { correct: 0, total: 0 };
      init[q.category].total++;
    });
    setCatScores(init);
  }, [questions]);

  useEffect(() => {
    if (!timerEnabled || done) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current!); setDone(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerEnabled, done]);

  async function submitGuestEmail() {
    if (guestEmailInFlight) return;
    const email = guestEmailValue.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setGuestEmailError(true); return; }
    setGuestEmailError(false);
    setGuestEmailInFlight(true);
    const finalScore = scoreRef.current;
    const pct = total > 0 ? Math.round((finalScore / total) * 100) : 0;
    const passed = pct >= PASS_THRESHOLD_PCT;
    const result = { score: finalScore, total, pct, passed, catScores };
    try {
      await fetch('/api/submit-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result, email, source: 'platform_exam_email_cta' }),
      });
      try { localStorage.setItem('io_pending_results', JSON.stringify(result)); } catch {}
    } catch {}
    setGuestEmailInFlight(false);
    setGuestEmailSent(true);
    setGuestScoreRevealed(true);
  }

  function handleAnswer(opt: 'A' | 'B' | 'C') {
    if (answered) return;
    setAnswered(true);
    setSelected(opt);
    const q = questions[idx];
    const isCorrect = opt === q.correct;
    if (isCorrect) {
      scoreRef.current++;
      setScore(s => s + 1);
      setCatScores(prev => ({ ...prev, [q.category]: { ...prev[q.category], correct: (prev[q.category]?.correct || 0) + 1 } }));
    }
    setAnsweredLog(prev => [...prev, { q, chosen: opt, isCorrect }]);
    sendGAEvent('event', 'leren_question_answered', { thema: examNum ?? topicLabel ?? 'unknown', correct: isCorrect });
    track('question_answered', { source: examNum ? 'dashboard_exam' : 'dashboard_topic', exam_number: examNum ?? null, topic: examNum ? null : (topicLabel ?? null), is_correct: isCorrect });
    if (supabase && session) {
      supabase.from('user_question_results').insert({ user_id: session.user.id, question_id: q.id, exam: examNum, was_correct: isCorrect }).then(() => {});
      if (isCorrect) awardCorrectAnswer(supabase, session.user.id, q.id);
    }
  }

  function handleNext() {
    if (idx < total - 1) { setIdx(i => i + 1); setAnswered(false); setSelected(null); }
    else finishExam();
  }

  function finishExam() {
    clearInterval(timerRef.current!);
    setDone(true);
    const pct = total > 0 ? Math.round((scoreRef.current / total) * 100) : 0;
    sendGAEvent('event', 'leren_quiz_finished', { thema: examNum ?? topicLabel ?? 'unknown', score: scoreRef.current, total, pct });
    if (examNum) {
      track('exam_finished', { source: 'dashboard_exam', exam_number: examNum, score: scoreRef.current, total, pct, passed: pct >= PASS_THRESHOLD_PCT });
    }
  }

  useEffect(() => {
    if (done && examNum) {
      const pct = total > 0 ? Math.round((scoreRef.current / total) * 100) : 0;
      const result: ExamResult = { score: scoreRef.current, total, pct, passed: pct >= PASS_THRESHOLD_PCT };
      if (session && examNum) {
        // Append a sitting rather than upserting exam_results, which is a view now. The
        // old upsert named a two-column conflict target against a three-column key, so it
        // had been failing on every finished exam.
        recordExamAttempt(supabase, {
          userId: session.user.id,
          skill: questions[0]?.skill ?? 'lezen',
          examNumber: examNum,
          score: result.score,
          total: result.total,
          pct: result.pct,
          passed: result.passed,
          catScores,
          passThresholdPct: PASS_THRESHOLD_PCT,
        }).then(() => {});
        awardXp(supabase, session.user.id, 'exam_completed', examNum);
        if (result.passed) awardXp(supabase, session.user.id, 'exam_passed', examNum);
      }
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[idx];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  const isWarn = timerEnabled && secondsLeft <= 300;
  const timerPct = timerEnabled ? (secondsLeft / timerSeconds) * 100 : 100;

  if (done) {
    const finalScore = scoreRef.current;
    const pct = total > 0 ? Math.round((finalScore / total) * 100) : 0;
    const passed = pct >= PASS_THRESHOLD_PCT;

    // Guest email gate: show email form before revealing score for exam 1
    if (isGuest && examNum && !guestScoreRevealed) {
      return (
        <div className="py-4 px-6 sm:px-0 flex flex-col gap-4">
          <div className="rounded-2xl p-8 flex flex-col items-center text-center gap-4" style={{ background: 'linear-gradient(135deg,#001d4e 0%,#002b6d 100%)', boxShadow: '0 8px 32px rgba(0,27,78,0.22)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h2 className="font-headline text-xl font-extrabold mb-1" style={{ color: '#fff' }}>{t('guest_email_gate_title')}</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('guest_email_gate_desc')}</p>
            </div>
            <div className="w-full max-w-sm flex flex-col gap-3">
              <input
                type="email"
                value={guestEmailValue}
                onChange={e => { setGuestEmailValue(e.target.value); setGuestEmailError(false); }}
                placeholder={t('guest_email_placeholder')}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: '#fff', border: guestEmailError ? '2px solid #fe762c' : '2px solid transparent', outline: 'none', color: '#191c1e' }}
                onKeyDown={e => { if (e.key === 'Enter') submitGuestEmail(); }}
              />
              {guestEmailError && <p className="text-xs" style={{ color: '#fe762c' }}>{t('guest_email_error')}</p>}
              <button
                onClick={submitGuestEmail}
                disabled={guestEmailInFlight}
                className="w-full py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#fe762c,#d94f00)', border: 'none', cursor: guestEmailInFlight ? 'not-allowed' : 'pointer', opacity: guestEmailInFlight ? 0.7 : 1, boxShadow: '0 4px 16px rgba(254,118,44,0.4)' }}
              >
                {guestEmailInFlight ? t('guest_email_sending') : t('guest_email_submit')}
              </button>
            </div>
          </div>
          <button onClick={onReturn} className="w-full py-3 rounded-xl font-extrabold text-sm" style={{ background: 'transparent', border: '1px solid #e6e8ea', cursor: 'pointer', color: '#747782' }}>
            {t('btn_back_to_dashboard')}
          </button>
        </div>
      );
    }

    const heroBg = passed
      ? 'linear-gradient(135deg,#064e3b 0%,#065f46 60%,#059669 100%)'
      : 'linear-gradient(135deg,#6b2200 0%,#9a3412 60%,#c2550a 100%)';
    const heroLabel = passed ? 'Geslaagd ✓' : 'Gezakt ✗';
    const heroTitle = passed ? 'Gefeliciteerd — je bent geslaagd!' : 'Nog niet geslaagd — blijf oefenen!';
    const circ = 251.33;
    const dash = ((pct / 100) * circ).toFixed(1);
    const wrongAnswers = answeredLog.filter(e => !e.isCorrect);

    const sortedCats = Object.entries(catScores)
      .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total));

    const wrongCats = new Set(wrongAnswers.map(w => w.q.category));

    const sectionSlugById: Record<number, string> = {};
    if (sections) sections.forEach(s => { sectionSlugById[s.id] = s.slug; });

    function bestLinkForCategory(cat: string): LerenLink | null {
      const wrongInCat = wrongAnswers.filter(w => w.q.category === cat);
      const counts: Record<string, number> = {};
      wrongInCat.forEach(w => {
        if (w.q.section_id) {
          const slug = sectionSlugById[w.q.section_id];
          if (slug && DB_SECTION_TO_LEREN[slug]) counts[slug] = (counts[slug] || 0) + 1;
        }
      });
      const bestSlug = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0];
      return lerenLinkForSectionSlug(bestSlug) ?? lerenLinkForCategory(cat);
    }

    // Deduplicate: one thema link per wrong category, up to 6
    const recommendedThemas = Array.from(wrongCats)
      .map(cat => ({ cat, meta: LEREN_CATEGORY_META[cat], link: bestLinkForCategory(cat) }))
      .filter(({ meta, link }) => !!meta && !!link)
      .slice(0, 6);

    const handleLeaveResults = () => {
      if (examNum) {
        const result: ExamResult = { score: finalScore, total, pct, passed };
        onComplete(result);
      }
      onReturn();
    };

    return (
      <div id="qe-results" className="py-4 px-6 sm:px-0 flex flex-col gap-4">
        <button onClick={handleLeaveResults} className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {t('btn_back_to_dashboard')}
        </button>

        {/* Hero */}
        <div className="rounded-2xl flex items-center justify-between gap-6" style={{ background: heroBg, padding: '2rem 2rem' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.6rem', fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '.5rem' }}>{heroLabel}</div>
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: '.5rem' }}>{heroTitle}</div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.9rem' }}>
              Score: <strong style={{ color: '#fff' }}>{finalScore} van {total}</strong> vragen goed
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 50 50)"/>
              <text x="50" y="45" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="Manrope,sans-serif">{pct}%</text>
              <text x="50" y="61" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,.6)" fontSize="9" fontFamily="Manrope,sans-serif" letterSpacing="1">SCORE</text>
            </svg>
          </div>
        </div>

        {/* Answer trail */}
        {answeredLog.length > 0 && (
          <div className="rounded-2xl" style={{ background: '#fff', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <p style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#747782', margin: '0 0 .75rem' }}>
              Jouw antwoorden · {answeredLog.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {answeredLog.map((entry, i) => (
                <div key={i} className="rounded-full flex-shrink-0" style={{ width: 16, height: 16, background: entry.isCorrect ? '#16a34a' : '#f97316' }} />
              ))}
            </div>
            <p style={{ fontSize: '.72rem', color: '#a0a3ad', marginTop: '.5rem' }}>
              <span className="inline-block rounded-full align-middle mr-1" style={{ width: 9, height: 9, background: '#16a34a' }} />Goed&nbsp;&nbsp;
              <span className="inline-block rounded-full align-middle mr-1" style={{ width: 9, height: 9, background: '#f97316' }} />Fout
            </p>
          </div>
        )}

        {/* Two-column: wrong answers left, focus + recommended right */}
        {wrongAnswers.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-4 items-start">

            {/* Wrong answers (2-col grid inside) */}
            <div className="rounded-2xl" style={{ background: '#fff', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <p style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#747782', margin: 0 }}>Foute antwoorden</p>
                <span style={{ fontSize: '.72rem', color: '#a0a3ad' }}>{wrongAnswers.length} om te herzien</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wrongAnswers.map((w, wi) => {
                  const chosenText = w.q[`option${w.chosen}` as 'optionA' | 'optionB' | 'optionC'] || w.chosen;
                  const correctText = w.q[`option${w.q.correct}` as 'optionA' | 'optionB' | 'optionC'] || w.q.correct;
                  return (
                    <div key={wi} style={{ padding: '.875rem 1rem', border: '1px solid #f0f1f3', borderRadius: '.75rem', background: '#fafafa' }}>
                      <p style={{ fontWeight: 600, fontSize: '.8rem', color: '#191c1e', marginBottom: '.5rem', lineHeight: 1.4 }}>
                        {w.q.question.length > 90 ? w.q.question.slice(0, 90) + '…' : w.q.question}
                      </p>
                      <div className="flex items-start gap-1.5 mb-1">
                        <span style={{ color: '#dc2626', fontSize: '.7rem', fontWeight: 800, flexShrink: 0, lineHeight: 1.5 }}>×</span>
                        <span style={{ fontSize: '.75rem', color: '#dc2626', textDecoration: 'line-through', lineHeight: 1.4 }}>{chosenText}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span style={{ color: '#16a34a', fontSize: '.7rem', fontWeight: 800, flexShrink: 0, lineHeight: 1.5 }}>✓</span>
                        <span style={{ fontSize: '.75rem', color: '#16a34a', fontWeight: 600, lineHeight: 1.4 }}>{correctText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-3">

              {/* Focus panel */}
              <div className="rounded-2xl" style={{ background: 'linear-gradient(160deg,#001a44 0%,#002b6d 100%)', padding: '1.5rem 1.25rem', boxShadow: '0 4px 16px rgba(0,27,80,.2)' }}>
                <p style={{ fontSize: '.58rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', margin: '0 0 .2rem' }}>Focus op</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 .2rem', lineHeight: 1.2 }}>Waar verder oefenen?</p>
                <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', margin: '0 0 1rem', lineHeight: 1.4 }}>Per onderwerp — gesorteerd op zwakste score.</p>
                <div className="flex flex-col gap-3">
                  {sortedCats.map(([cat, cs]) => {
                    const cp = cs.total ? Math.round((cs.correct / cs.total) * 100) : 0;
                    const barColor = cp >= 70 ? '#16a34a' : cp >= 40 ? '#d97706' : '#dc2626';
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: '.78rem', color: '#fff', fontWeight: 500, lineHeight: 1.3 }}>{cat}</span>
                          <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.55)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '.5rem' }}>{cs.correct}/{cs.total} · {cp}%</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,.12)', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cp}%`, background: barColor, borderRadius: 9999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Aanbevolen leerstof */}
              {plan === 'premium_plus' && recommendedThemas.length > 0 ? (
                <div className="rounded-2xl" style={{ background: '#fff', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: '1rem' }}>📚</span>
                    <p style={{ fontSize: '.85rem', fontWeight: 800, color: '#191c1e', margin: 0 }}>Aanbevolen leerstof</p>
                  </div>
                  <p style={{ fontSize: '.72rem', color: '#a0a3ad', marginBottom: '.875rem', lineHeight: 1.4 }}>Lees je fouten na bij deze onderwerpen.</p>
                  <div className="flex flex-col">
                    {recommendedThemas.map(({ cat, meta, link }, i) => (
                      <a key={cat} href={`/${locale}/leren/${link!.themaSlug}${link!.sectionId ? `?section=${link!.sectionId}` : ''}`} className="flex items-center gap-3 rounded-lg hover:bg-surface-container-low transition-colors" style={{ padding: '.5rem .5rem', textDecoration: 'none', borderBottom: i < recommendedThemas.length - 1 ? '1px solid #f0f1f3' : 'none' }}>
                        <span style={{ fontSize: '.9rem', flexShrink: 0 }}>{meta.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#191c1e', lineHeight: 1.3 }}>{cat}</div>
                          <div style={{ fontSize: '.68rem', color: '#a0a3ad' }}>{meta.themaLabel}</div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M3 7h8M7 3l4 4-4 4" stroke="#a24000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              ) : plan !== 'premium_plus' ? (
                <div className="rounded-2xl" style={{ background: 'linear-gradient(135deg,#fff8f4 0%,#fff3e8 100%)', border: '1px solid rgba(162,64,0,.12)', padding: '1.25rem' }}>
                  <p style={{ fontSize: '.85rem', fontWeight: 800, color: '#191c1e', marginBottom: '.25rem' }}>📚 Aanbevolen leerstof</p>
                  <p style={{ fontSize: '.72rem', color: '#747782', marginBottom: '.75rem', lineHeight: 1.45 }}>Bekijk leermodules per onderwerp en lees na waar je fouten maakte — beschikbaar in het Compleet Pakket.</p>
                  <a href={`/${locale}/activate?upgrade=plus`} className="inline-flex items-center gap-1.5 font-bold hover:opacity-90 transition-opacity rounded-lg" style={{ fontSize: '.78rem', color: '#a24000', textDecoration: 'none', background: 'rgba(162,64,0,.1)', padding: '.4rem .75rem' }}>
                    Bekijk Compleet Pakket
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                </div>
              ) : null}

            </div>
          </div>
        )}

        {isGuest && (
          <a href={`/${locale}/register`} className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white text-center block no-underline" style={{ background: 'linear-gradient(135deg,#fe762c,#d94f00)', boxShadow: '0 4px 16px rgba(254,118,44,0.4)' }}>
            {t('guest_signup_after_result')} →
          </a>
        )}

        <button onClick={handleLeaveResults} className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white" style={{ background: '#002b6d', boxShadow: '0 2px 8px rgba(0,43,109,0.25)', border: 'none', cursor: 'pointer' }}>
          {t('btn_back_to_dashboard')}
        </button>
      </div>
    );
  }

  const pctDone = (idx / total) * 100;
  const isLast = idx === total - 1;

  return (
    <div ref={topRef} className="py-4 px-1.5 sm:px-0">
      <div className="mb-3">
        {timerEnabled ? (
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => { clearInterval(timerRef.current!); onReturn(); }} className="flex-shrink-0 text-xs font-semibold" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', color: '#434651', whiteSpace: 'nowrap' }}>{t('btn_back')}</button>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#e0e3e5' }}>
              <div style={{ width: `${timerPct}%`, height: '100%', background: isWarn ? '#dc2626' : 'linear-gradient(to right,#a24000,#fe762c)', borderRadius: '9999px', transition: 'width 1s linear' }} />
            </div>
            <span className="flex-shrink-0 text-sm font-bold" style={{ color: isWarn ? '#dc2626' : '#a24000', fontFamily: 'Manrope,sans-serif', minWidth: '3rem', textAlign: 'right' }}>{timeStr}</span>
          </div>
        ) : (
          <button onClick={() => { clearInterval(timerRef.current!); onReturn(); }} className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary mb-3" style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer' }}>{t('btn_back')}</button>
        )}
      </div>

      <div className="rounded-2xl mb-5 flex items-center justify-between gap-3 px-3.5 sm:px-5 py-3.5" style={{ background: 'linear-gradient(135deg,#002b6d 0%,#1e3a8a 100%)' }}>
        <div className="min-w-0">
          <div className="text-white/60 text-[10px] font-extrabold uppercase tracking-widest mb-0.5">{topicLabel ? t('quiz_header_practice') : t('quiz_header_exam')}</div>
          <div className="text-white text-sm font-extrabold whitespace-nowrap">
            {topicLabel ?? `Examen ${examNum}`}
            <span className="text-white/45 font-medium text-xs ml-2">{total} vragen</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-white/55 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t('quiz_score_label')}</div>
          <div className="text-white text-base font-extrabold">{score} <span className="text-white/45 font-medium text-sm">/ {total}</span></div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold text-outline uppercase tracking-widest">{t('quiz_question_of', { current: idx + 1, total })}</span>
          <span className="text-xs font-medium text-outline">{t('quiz_pct_done', { pct: Math.round(pctDone) })}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e0e3e5' }}>
          <div style={{ width: `${pctDone}%`, height: '100%', background: 'linear-gradient(to right,#a24000,#fe762c)', borderRadius: '9999px', transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
        </div>
      </div>

      <ExamQuestionCard
        question={q}
        questionNumber={idx + 1}
        selected={selected}
        onSelect={handleAnswer}
        audioEnabled={audioEnabled}
        showFeedback={true}
      />

      {answered && (
        <>
          {/* Spacer so content isn't hidden behind the fixed button on mobile */}
          <div className="h-20 sm:hidden" />
          <div className="flex justify-end sm:static fixed left-0 right-0 px-4 pb-2 sm:px-0 sm:pb-0 sm:bottom-auto" style={{ zIndex: 50, bottom: 'calc(54px + env(safe-area-inset-bottom) + 12px)' }}>
            <button onClick={handleNext} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 sm:py-3 font-bold text-sm rounded-xl" style={{ background: '#002b6d', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,43,109,0.35)' }}>
              {isLast ? t('btn_view_result') : t('btn_next_question')}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
