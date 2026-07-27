'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@/lib/analytics';
import type { KnmQuestion } from '@/data/questions';
import ExamQuestionCard from '@/components/proefexamen/ExamQuestionCard';
import { useAudioEnabled } from '@/lib/audio-pref';
import { bandFor } from '@/lib/exam-readiness';
import SlaagkansGauge from '../../(app)/dashboard/components/SlaagkansGauge';

const DEFAULT_QUESTION_COUNT = 10;
const PASS_THRESHOLD_PCT = 0.7;

const CATEGORY_META: Record<string, string> = {
  'Werk en Inkomen': '💼',
  Wonen: '🏠',
  'Gezondheid en Gezondheidszorg': '🏥',
  'Onderwijs en Opvoeding': '🎓',
  Instanties: '🏛️',
  'Staatsinrichting en Rechtsstaat': '⚖️',
  'Geschiedenis en Geografie': '📜',
};

type AnsweredEntry = { q: KnmQuestion; chosen: string; isCorrect: boolean };
type Phase = 'intro' | 'quiz' | 'results';
type Props = { pool: KnmQuestion[]; curated?: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(pool: KnmQuestion[], n: number): KnmQuestion[] {
  const byCat: Record<string, KnmQuestion[]> = {};
  pool.forEach((q) => {
    if (!q.question || !q.optionA || !q.optionB || !q.optionC) return;
    (byCat[q.category] ||= []).push(q);
  });
  const cats = shuffle(Object.keys(byCat));
  cats.forEach((c) => (byCat[c] = shuffle(byCat[c])));

  const picked: KnmQuestion[] = [];
  let progress = true;
  while (picked.length < n && progress) {
    progress = false;
    for (const c of cats) {
      const next = byCat[c].pop();
      if (next) {
        picked.push(next);
        progress = true;
        if (picked.length >= n) break;
      }
    }
  }
  return picked;
}

export default function OefenenEngine({ pool, curated = false }: Props) {
  const t = useTranslations('oefenen');
  // How many questions the visitor will get: the whole curated set, or a
  // default random spread from the full pool when nothing is curated yet.
  const introCount = curated ? pool.length : Math.min(DEFAULT_QUESTION_COUNT, pool.length || DEFAULT_QUESTION_COUNT);

  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<KnmQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answeredLog, setAnsweredLog] = useState<AnsweredEntry[]>([]);

  const [emailValue, setEmailValue] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailInFlight, setEmailInFlight] = useState(false);

  const [audioEnabled] = useAudioEnabled();
  const answeredRef = useRef<AnsweredEntry[]>([]);
  const audioStopRef = useRef<(() => void) | null>(null);

  function startQuiz() {
    const qs = curated ? [...pool] : pickQuestions(pool, DEFAULT_QUESTION_COUNT);
    answeredRef.current = [];
    setQuestions(qs);
    setCurrentIdx(0);
    setSelected(null);
    setAnsweredLog([]);
    setEmailSent(false);
    setPhase('quiz');
    sendGAEvent('event', 'oefenen_started', { count: qs.length });
  }

  function selectAnswer(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const q = questions[currentIdx];
    const isCorrect = opt === q.correct;
    answeredRef.current = [...answeredRef.current, { q, chosen: opt, isCorrect }];
    setAnsweredLog(answeredRef.current);
    sendGAEvent('event', 'oefenen_answered', { correct: isCorrect });
    track('question_answered', { source: 'oefenen', exam_number: null, topic: null, is_correct: isCorrect });
  }

  function nextQuestion() {
    audioStopRef.current?.();
    const next = currentIdx + 1;
    if (next >= questions.length) finishQuiz();
    else {
      setCurrentIdx(next);
      setSelected(null);
    }
  }

  function finishQuiz() {
    setPhase('results');
    const total = questions.length || 1;
    const score = answeredRef.current.filter((e) => e.isCorrect).length;
    const pct = Math.round((score / total) * 100);
    sendGAEvent('event', 'oefenen_finished', { score, total: questions.length, pct });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function submitEmailReport() {
    if (emailInFlight) return;
    const email = emailValue.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true);
      return;
    }
    const score = answeredRef.current.filter((e) => e.isCorrect).length;
    const total = questions.length || 1;
    const pct = Math.round((score / total) * 100);
    setEmailError(false);
    setEmailInFlight(true);
    try {
      await fetch('/api/submit-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          total,
          pct,
          passed: pct >= PASS_THRESHOLD_PCT * 100,
          source: 'oefenen_email_cta',
          email,
        }),
      });
    } catch {}
    setEmailInFlight(false);
    setEmailSent(true);
  }

  /* ── INTRO ── */
  if (phase === 'intro') {
    const cats = Array.from(new Set(pool.map((q) => q.category)));
    return (
      <div className="px-6 sm:px-0">
        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{ border: '1px solid #e6e8ea', boxShadow: '0 10px 40px -12px rgba(0,43,109,0.18), 0 2px 6px rgba(28,43,74,0.05)' }}
        >
          <div className="relative px-6 sm:px-8 pt-7 pb-8" style={{ background: 'linear-gradient(135deg,#001a44 0%,#002b6d 55%,#143d8a 100%)' }}>
            <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 90% at 100% 0%, rgba(254,118,44,0.22), transparent 55%)' }} />
            <div className="relative">
              <div className="uppercase font-extrabold mb-2" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.66rem', letterSpacing: '0.16em' }}>
                {t('eyebrow')}
              </div>
              <h1 className="font-headline font-extrabold text-white" style={{ fontSize: '2rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                {t('heading', { count: introCount })}
              </h1>
              <div className="flex flex-wrap gap-1.5 sm:gap-2.5 mt-5">
                {[
                  { val: String(introCount), label: t('stat_questions') },
                  { val: '★', label: t('stat_free') },
                  { val: '✓', label: t('stat_no_account') },
                ].map(({ val, label }) => (
                  <div key={label} className="flex items-baseline gap-1.5 sm:gap-2 rounded-full pl-2.5 pr-3 py-1.5 sm:pl-3.5 sm:pr-4 sm:py-2" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)' }}>
                    <span className="font-headline font-extrabold text-white" style={{ fontSize: 'clamp(0.85rem, 2.6vw, 1.05rem)' }}>{val}</span>
                    <span className="font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.58rem', letterSpacing: '0.06em' }}>{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1.5 sm:pl-3 sm:pr-4 sm:py-2" style={{ background: 'rgba(254,118,44,0.16)', border: '1px solid rgba(254,118,44,0.32)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffb27a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  <span className="font-semibold" style={{ color: '#ffd1ab', fontSize: '0.68rem' }}>{t('feedback_tag')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6 flex flex-col">
            <p className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-2" style={{ letterSpacing: '0.08em' }}>
              {t('sections_heading')}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {cats.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: '#f2f4f6', border: '1px solid #eaeef0' }}>
                  <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>{CATEGORY_META[cat] || '📘'}</span>
                  <span className="text-xs font-medium" style={{ color: '#434651' }}>{cat}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6 rounded-2xl p-3" style={{ background: '#f8f9fb', border: '1px solid #eef0f2' }}>
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-outline-variant/30 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={44} height={44} className="w-full h-full object-cover object-top" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface">
                  <Link href="/docent" className="no-underline hover:text-primary transition-colors text-on-surface">Marieke Schipper</Link>
                </p>
                <p className="text-xs text-on-surface-variant leading-snug">{t('teacher_title')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={startQuiz}
                className="inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl text-white border-0 cursor-pointer hover:-translate-y-0.5 transition-transform active:scale-95"
                style={{ background: '#002b6d', boxShadow: '0 4px 14px rgba(0,43,109,0.28), inset 0 1px 0 0 rgba(255,255,255,0.12)' }}
              >
                <span>{t('start_btn')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <Link href="/oefenvragen" className="inline-flex items-center gap-2 px-5 py-3.5 bg-surface-container text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-high transition-colors text-sm no-underline">
                {t('practice_topics')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── QUIZ ── */
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[currentIdx];
    const total = questions.length;
    const pctDone = (currentIdx / total) * 100;
    const isLast = currentIdx === total - 1;

    return (
      <div className="pt-4 px-6 sm:px-0">
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="uppercase font-bold" style={{ fontSize: '.72rem', color: '#747782', letterSpacing: '.07em' }}>
              {t('q_progress', { current: currentIdx + 1, total })}
            </span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#a0a3ad' }}>
              {t('q_done', { pct: Math.round(pctDone) })}
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: '.5rem', background: '#e0e3e5' }}>
            <div className="h-full rounded-full" style={{ width: `${pctDone}%`, background: 'linear-gradient(to right,#a24000,#fe762c)', transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>

        <ExamQuestionCard
          question={q}
          questionNumber={currentIdx + 1}
          selected={selected as 'A' | 'B' | 'C' | null}
          onSelect={(lbl) => selectAnswer(lbl)}
          audioEnabled={audioEnabled}
          showFeedback={true}
          stopRef={audioStopRef}
        />

        {selected !== null && (
          <>
            <div className="hidden sm:block mt-4">
              <NextBtn isLast={isLast} label={isLast ? t('finish_btn') : t('next_btn')} onClick={nextQuestion} />
            </div>
            <div className="sm:hidden fixed left-0 right-0 z-[99]" style={{ bottom: 0, background: 'rgba(248,249,251,.97)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderTop: '1px solid rgba(0,0,0,.07)', padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
              <NextBtn isLast={isLast} label={isLast ? t('finish_btn') : t('next_btn')} onClick={nextQuestion} fullWidth />
            </div>
            <div className="sm:hidden h-[76px]" />
          </>
        )}
      </div>
    );
  }

  /* ── RESULTS ── */
  if (phase === 'results') {
    const score = answeredLog.filter((e) => e.isCorrect).length;
    const total = questions.length || 1;
    const pct = Math.round((score / total) * 100);
    const passed = pct >= PASS_THRESHOLD_PCT * 100;
    const band = bandFor(pct);

    return (
      <div id="oefenen-results" className="pt-2 px-6 sm:px-0 flex flex-col gap-3.5">
        {/* Result banner — slaagkans gauge + compact email capture */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#002b6d 0%,#1d428a 100%)', boxShadow: '0 16px 44px rgba(0,43,109,0.18)' }}>
          <div className="p-5 sm:p-6">
            <div className="grid sm:grid-cols-[1.05fr_0.95fr] items-center gap-1">
              <div>
                <div className="uppercase font-extrabold" style={{ fontSize: '.66rem', letterSpacing: '.14em', color: 'rgba(255,255,255,.6)' }}>
                  {t('result_eyebrow')}
                </div>
                <h2 className="font-headline font-extrabold text-white mt-1.5 mb-1" style={{ fontSize: '1.5rem', lineHeight: 1.1, letterSpacing: '-.01em' }}>
                  {passed ? t('verdict_pass_title') : t('verdict_fail_title')}
                </h2>
                <p className="font-semibold mb-2" style={{ color: 'rgba(255,255,255,.85)', fontSize: '.92rem' }}>
                  {t('correct_label', { score, total })}
                </p>
                <p style={{ color: 'rgba(255,255,255,.72)', fontSize: '.86rem', lineHeight: 1.5 }}>
                  {passed ? t('verdict_pass_sub') : t('verdict_fail_sub')}
                </p>
              </div>
              <div>
                <div style={{ maxWidth: 210, margin: '0 auto' }}>
                  <SlaagkansGauge value={pct} examsCount={1} avgScore={pct} band={band} variant="dark" bare />
                </div>
                <p className="text-center" style={{ color: 'rgba(255,255,255,.55)', fontSize: '.7rem', lineHeight: 1.35, marginTop: -2 }}>
                  {t('slaagkans_caption')}
                </p>
              </div>
            </div>

            {/* Compact email capture — inside the score card */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 14, paddingTop: 14 }}>
              {!emailSent ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffd1ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></svg>
                    <span className="font-bold text-white" style={{ fontSize: '.84rem', lineHeight: 1.25 }}>{t('email_cta')}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => { setEmailValue(e.target.value); setEmailError(false); }}
                      placeholder={t('email_placeholder')}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white"
                      style={{ border: `1.5px solid ${emailError ? '#ef4444' : 'transparent'}`, color: '#1a1c23', outline: 'none' }}
                    />
                    <button onClick={submitEmailReport} disabled={emailInFlight} className="px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 disabled:opacity-60 hover:-translate-y-0.5 transition-transform" style={{ background: '#fff', color: '#002b6d', border: 0, cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.18)' }}>
                      {emailInFlight ? '...' : t('email_send')}
                    </button>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,.55)' }}>{t('email_hint')}</p>
                </>
              ) : (
                <p className="text-sm font-semibold" style={{ color: '#7ee2a8' }}>{t('email_sent')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Signup card — CTA first, then supporting benefits */}
        <div className="rounded-2xl flex flex-col gap-4" style={{ background: '#fff', padding: '1.35rem', boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}>
          <div>
            <h2 className="font-headline font-extrabold mb-1" style={{ fontSize: '1.3rem', color: '#002b6d', letterSpacing: '-.01em' }}>{t('signup_heading')}</h2>
            <p style={{ fontSize: '.92rem', color: '#434651', lineHeight: 1.5, margin: 0 }}>{t('signup_desc')}</p>
          </div>

          <div className="flex flex-col gap-2 items-center">
            <Link
              href="/register"
              onClick={() => sendGAEvent('event', 'oefenen_signup_click', { pct })}
              className="w-full inline-flex items-center justify-center gap-2 text-white font-black no-underline hover:-translate-y-0.5 transition-transform active:scale-[.99]"
              style={{ fontSize: 17, padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg,#fe762c 0%,#d94f00 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 22px rgba(254,118,44,0.38)' }}
            >
              {t('signup_cta')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <div style={{ fontSize: 12.5, color: '#747782' }}>{t('signup_note')}</div>
            <div style={{ fontSize: 13, color: '#434651' }}>
              {t('login_prompt')}{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline no-underline">{t('login_link')}</Link>
            </div>
          </div>
        </div>

        {/* Secondary actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setPhase('intro')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors border-0 cursor-pointer">
            {t('retry')}
          </button>
          <Link href="/oefenvragen" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors no-underline">
            {t('topics')}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

function NextBtn({ isLast, label, onClick, fullWidth }: { isLast: boolean; label: string; onClick: () => void; fullWidth?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm border-0 cursor-pointer hover:-translate-y-0.5 transition-transform active:scale-95${fullWidth ? ' w-full justify-center' : ''}`}
      style={isLast
        ? { background: 'linear-gradient(135deg,#fe762c 0%,#d94f00 100%)', color: '#fff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 22px rgba(254,118,44,0.32)' }
        : { background: 'var(--color-secondary-container,#fcecdd)', color: 'var(--color-on-secondary-container,#5f2200)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}
