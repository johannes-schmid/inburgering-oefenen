'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { track } from '@/lib/analytics';
import { optionKeys, optionText, type FreePracticeItem, type OptionKey } from '@/data/free-practice';
import { DEFAULT_LEVEL, type Level, type OnderdeelSlug } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import { Check, Star, UserRoundCheck, Headphones } from 'lucide-react';

const PASS_PCT = 70;

type Answered = { item: FreePracticeItem; chosen: OptionKey; isCorrect: boolean };
type Phase = 'intro' | 'quiz' | 'gate' | 'results';

type Props = {
  skill: OnderdeelSlug;
  skillName: string;
  items: FreePracticeItem[];
  locale: string;
  /**
   * Which level's oefenexamen the result screen sends the candidate to. Defaults to A2,
   * which is where the four unprefixed `/oefenen/[skill]` tasters live — a B1 taster that
   * fell back to A2 would upsell the wrong module at the one point the visitor is convinced.
   *
   * **`null` is KNM and only KNM**, whose exams carry no level and whose URLs carry no level
   * segment either. It has to be spelled, not omitted: `undefined` means "not passed" and
   * falls back to A2, which would send a KNM visitor to `/oefenexamen/a2/knm` — not a route.
   */
  level?: Level | null;
};

export default function FreePracticeEngine({ skill, skillName, items, locale, level = DEFAULT_LEVEL }: Props) {
  const t = useTranslations('oefenen');

  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [log, setLog] = useState<Answered[]>([]);
  const logRef = useRef<Answered[]>([]);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);

  const isListening = skill === 'luisteren';
  /** KNM's URLs carry no level segment — see `level` above. */
  const examsHref = `/${locale}/oefenexamen/${level === null ? '' : `${level}/`}${skill}`;
  const total = items.length;
  const score = log.filter(a => a.isCorrect).length;
  const pct = total ? Math.round((score / total) * 100) : 0;

  function start() {
    logRef.current = [];
    setLog([]);
    setIdx(0);
    setSelected(null);
    setPhase('quiz');
    track('free_practice_started', { skill, count: total });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function choose(option: OptionKey) {
    if (selected) return;
    const item = items[idx];
    const isCorrect = option === item.correct;
    setSelected(option);
    logRef.current = [...logRef.current, { item, chosen: option, isCorrect }];
    setLog(logRef.current);
    track('question_answered', { source: 'free_practice', skill, sub_skill: item.subSkill, is_correct: isCorrect });
  }

  function next() {
    if (idx + 1 >= total) {
      setPhase('gate');
      track('free_practice_finished', { skill, score: logRef.current.filter(a => a.isCorrect).length, total });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIdx(idx + 1);
      setSelected(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function revealResults() {
    setPhase('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setSending(true);
    try {
      await fetch('/api/submit-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value,
          score,
          total,
          pct,
          passed: pct >= PASS_PCT,
          locale,
          skill,
          source: `free_practice_${skill}`,
        }),
      });
    } catch {
      // A failed report send must not block the visitor from seeing their own score.
    }
    setSending(false);
    setEmailCaptured(true);
    track('email_captured', { source: 'free_practice', skill, pct });
    revealResults();
  }

  /* ── INTRO ────────────────────────────────────────────────────────────── */
  if (phase === 'intro') {
    const genres = Array.from(new Set(items.map(i => i.subSkill)));
    return (
      <div className="rounded-3xl overflow-hidden bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-ambient)' }}>
        <div className="relative px-6 sm:px-8 pt-7 pb-8" style={{ background: 'linear-gradient(135deg,#001a44 0%,#002b6d 55%,#143d8a 100%)' }}>
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 90% at 100% 0%, rgba(254,118,44,0.22), transparent 55%)' }} />
          <div className="relative">
            <div className="uppercase font-extrabold mb-2" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.66rem', letterSpacing: '0.16em' }}>
              {t('eyebrow')}
            </div>
            <h1 className="font-headline font-extrabold text-white flex items-center gap-3" style={{ fontSize: '1.9rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              <SkillIcon skill={skill} size="md" onDark />
              {t('heading', { count: total, skill: skillName })}
            </h1>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { node: <span className="font-headline font-extrabold text-white text-base">{total}</span>, label: t('stat_questions') },
                { node: <Star size={15} strokeWidth={2.2} className="text-white" aria-hidden="true" />, label: t('stat_free') },
                { node: <UserRoundCheck size={15} strokeWidth={2.2} className="text-white" aria-hidden="true" />, label: t('stat_no_account') },
              ].map(({ node, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  {node}
                  <span className="font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.58rem', letterSpacing: '0.06em' }}>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 rounded-full px-3 py-2" style={{ background: 'rgba(254,118,44,0.16)' }}>
                <Check size={13} strokeWidth={2.6} style={{ color: '#ffb27a' }} aria-hidden="true" />
                <span className="font-semibold" style={{ color: '#ffd1ab', fontSize: '0.68rem' }}>{t('feedback_tag')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6">
          <p className="text-xs font-extrabold text-on-surface-variant uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
            {t('sections_heading')}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {genres.map(g => (
              <span key={g} className="text-xs font-medium rounded-full px-2.5 py-1" style={{ background: 'var(--color-surface-container-high)', color: '#434651' }}>
                {g}
              </span>
            ))}
          </div>

          {isListening && (
            <div className="flex items-start gap-3 mb-6 rounded-2xl p-3.5" style={{ background: 'rgba(254,118,44,0.10)' }}>
              <Headphones size={18} strokeWidth={2} style={{ color: '#a24000' }} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm leading-relaxed" style={{ color: '#7c2d12' }}>{t('audio_hint')}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6 rounded-2xl p-3" style={{ background: 'var(--color-surface-container-low)' }}>
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-outline-variant/30 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={44} height={44} className="w-full h-full object-cover object-top" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface">Marieke Schipper</p>
              <p className="text-xs text-on-surface-variant leading-snug">{t('teacher_title')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={start}
              className="inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl text-white border-0 cursor-pointer hover:-translate-y-0.5 transition-transform active:scale-95"
              style={{ background: '#002b6d', boxShadow: '0 4px 14px rgba(0,43,109,0.28)' }}
            >
              {t('start_btn')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <a href={`/${locale}/oefenen`} className="inline-flex items-center px-5 py-3.5 bg-surface-container text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-high transition-colors text-sm no-underline">
              {t('switch_skill')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── QUIZ ─────────────────────────────────────────────────────────────── */
  if (phase === 'quiz') {
    const item = items[idx];
    const done = (idx / total) * 100;
    const isLast = idx === total - 1;
    /**
     * A KNM question stands alone: `stimulus_id IS NULL`, so there is no passage and no audio.
     * It is rendered single-column for the same reason `ExamShell` does — a two-pane grid whose
     * left pane is an empty card reads as content that failed to load.
     */
    const hasStimulus = !!item.stimulusHtml || !!item.audioSrc;

    return (
      <div>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="uppercase font-bold" style={{ fontSize: '.72rem', color: '#747782', letterSpacing: '.07em' }}>
              {t('q_progress', { current: idx + 1, total })}
            </span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#a0a3ad' }}>{t('q_done', { pct: Math.round(done) })}</span>
          </div>
          {/* The Dutch Horizon bar (§7.1): the track is the same orange at 14% rather than a grey
              neutral, so the bar reads as one object at any fill instead of as two. */}
          <div className="rounded-full overflow-hidden" style={{ height: '.5rem', background: 'rgba(254,118,44,0.14)' }}>
            <div className="h-full rounded-full" style={{ width: `${done}%`, background: 'linear-gradient(to right,#a24000,#fe762c)', transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>

        {/* Two panes, like the DUO player: stimulus left, question right. One pane where the
            question stands alone. */}
        <div className={hasStimulus ? 'grid lg:grid-cols-2 gap-4 items-start' : 'max-w-2xl'}>
          {hasStimulus && <StimulusPane item={item} isListening={isListening} />}
          <QuestionPane
            item={item}
            selected={selected}
            onChoose={choose}
            explanationLabel={t('explanation_label')}
            correctLabel={t('correct_label_inline')}
            wrongLabel={t('wrong_label_inline')}
          />
        </div>

        {selected && (
          <div className={`mt-5 flex justify-end${hasStimulus ? '' : ' max-w-2xl'}`}>
            <button
              onClick={next}
              className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm border-0 cursor-pointer text-white hover:-translate-y-0.5 transition-transform active:scale-95 w-full sm:w-auto justify-center"
              style={{ background: isLast ? 'linear-gradient(135deg,#fe762c 0%,#d94f00 100%)' : '#002b6d', boxShadow: '0 6px 18px rgba(0,43,109,0.22)' }}
            >
              {isLast ? t('finish_btn') : t('next_btn')}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── EMAIL GATE — the score is deliberately not shown yet ─────────────── */
  if (phase === 'gate') {
    return (
      <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#002b6d 0%,#1d428a 100%)', boxShadow: '0 16px 44px rgba(0,43,109,0.18)' }}>
        <div className="p-6 sm:p-9">
          <div className="uppercase font-extrabold mb-2" style={{ fontSize: '.66rem', letterSpacing: '.14em', color: 'rgba(255,255,255,.6)' }}>
            {t('gate_eyebrow')}
          </div>
          <h2 className="font-headline font-extrabold text-white mb-3" style={{ fontSize: '1.7rem', lineHeight: 1.15, letterSpacing: '-.02em' }}>
            {t('gate_heading')}
          </h2>
          <p className="mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,.8)', fontSize: '.95rem' }}>
            {t('gate_sub')}
          </p>

          <ul className="flex flex-col gap-2.5 mb-7 list-none p-0 m-0">
            {[t('gate_bullet_1'), t('gate_bullet_2'), t('gate_bullet_3')].map(b => (
              <li key={b} className="flex items-start gap-2.5" style={{ color: 'rgba(255,255,255,.9)', fontSize: '.92rem' }}>
                <Check size={16} strokeWidth={2.6} style={{ color: '#7ee2a8' }} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <form onSubmit={submitEmail} noValidate>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <label htmlFor="fp-email" className="sr-only">{t('gate_placeholder')}</label>
              <input
                id="fp-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(false); }}
                placeholder={t('gate_placeholder')}
                aria-invalid={emailError}
                aria-describedby={emailError ? 'fp-email-error' : undefined}
                className="flex-1 px-4 py-3.5 rounded-xl text-base bg-white"
                style={{ border: `1.5px solid ${emailError ? '#ef4444' : 'transparent'}`, color: '#1a1c23', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3.5 rounded-xl font-bold text-base flex-shrink-0 disabled:opacity-60 hover:-translate-y-0.5 transition-transform active:scale-95"
                style={{ background: 'linear-gradient(135deg,#fe762c 0%,#d94f00 100%)', color: '#fff', border: 0, cursor: 'pointer', boxShadow: '0 8px 22px rgba(254,118,44,0.38)' }}
              >
                {sending ? t('gate_sending') : t('gate_submit')}
              </button>
            </div>
            {emailError && (
              <p id="fp-email-error" role="alert" className="text-sm mt-2 font-semibold" style={{ color: '#ffb4ab' }}>
                {t('gate_error')}
              </p>
            )}
          </form>

          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,.55)' }}>{t('gate_privacy')}</p>

          <button
            onClick={revealResults}
            className="mt-5 text-sm underline bg-transparent border-0 cursor-pointer p-0"
            style={{ color: 'rgba(255,255,255,.6)' }}
          >
            {t('gate_skip')}
          </button>
        </div>
      </div>
    );
  }

  /* ── RESULTS ──────────────────────────────────────────────────────────── */
  const passed = pct >= PASS_PCT;
  const wrong = log.filter(a => !a.isCorrect);

  const byGenre = new Map<string, { correct: number; total: number }>();
  log.forEach(a => {
    const row = byGenre.get(a.item.subSkill) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (a.isCorrect) row.correct += 1;
    byGenre.set(a.item.subSkill, row);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Score */}
      <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg,#002b6d 0%,#1d428a 100%)', boxShadow: '0 16px 44px rgba(0,43,109,0.18)' }}>
        <div className="uppercase font-extrabold mb-2" style={{ fontSize: '.66rem', letterSpacing: '.14em', color: 'rgba(255,255,255,.6)' }}>
          {t('result_eyebrow')}
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mb-3">
          <span className="font-headline font-extrabold text-white leading-none" style={{ fontSize: '3.4rem', letterSpacing: '-0.03em' }}>{pct}%</span>
          <span className="font-semibold pb-2" style={{ color: 'rgba(255,255,255,.85)', fontSize: '1rem' }}>
            {t('correct_label', { score, total })}
          </span>
        </div>
        <div className="rounded-full overflow-hidden mb-4" style={{ height: '.6rem', background: 'rgba(255,255,255,0.18)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: passed ? 'linear-gradient(to right,#a24000,#fe762c)' : 'linear-gradient(to right,#a24000,#fe762c)' }} />
        </div>
        <h2 className="font-headline font-extrabold text-white mb-1.5" style={{ fontSize: '1.35rem', letterSpacing: '-.01em' }}>
          {passed ? t('verdict_pass_title') : t('verdict_fail_title')}
        </h2>
        <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.92rem', lineHeight: 1.55 }}>
          {passed ? t('verdict_pass_sub') : t('verdict_fail_sub')}
        </p>
        {emailCaptured && (
          <p className="text-sm font-semibold mt-4" style={{ color: '#7ee2a8' }}>{t('email_sent')}</p>
        )}
      </div>

      {/* Per-genre breakdown */}
      <div className="rounded-2xl p-6 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)' }}>
        <h3 className="font-headline font-bold text-on-surface text-base mb-4">{t('breakdown_heading')}</h3>
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {Array.from(byGenre.entries()).map(([genre, row]) => {
            const rowPct = Math.round((row.correct / row.total) * 100);
            return (
              <li key={genre}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-semibold text-on-surface">{genre}</span>
                  <span className="text-xs text-on-surface-variant tabular-nums">{row.correct}/{row.total}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: '.4rem', background: 'var(--color-surface-container)' }}>
                  <div className="h-full rounded-full" style={{ width: `${rowPct}%`, background: rowPct >= 70 ? '#a24000' : '#fe762c' }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Wrong answers with the teacher's explanation */}
      {wrong.length > 0 && (
        <div className="rounded-2xl p-6 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)' }}>
          <h3 className="font-headline font-bold text-on-surface text-base mb-4">{t('review_heading')}</h3>
          <ul className="flex flex-col gap-5 list-none p-0 m-0">
            {wrong.map(({ item, chosen }) => (
              <li key={item.id} className="pb-5 mb-1 last:pb-0">
                <p className="text-sm font-semibold text-on-surface mb-2 whitespace-pre-line">{item.question}</p>
                <p className="text-sm mb-1" style={{ color: 'var(--color-error)' }}>
                  <span className="font-semibold">{t('review_your_answer')}:</span> {optionText(item, chosen)}
                </p>
                <p className="text-sm mb-2" style={{ color: '#a24000' }}>
                  <span className="font-semibold">{t('review_correct_answer')}:</span> {optionText(item, item.correct)}
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      <div className="rounded-2xl p-6 sm:p-7 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)' }}>
        <h3 className="font-headline font-extrabold mb-1.5" style={{ fontSize: '1.25rem', color: '#002b6d', letterSpacing: '-.01em' }}>
          {t('signup_heading')}
        </h3>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{t('signup_desc')}</p>
        <a
          href={examsHref}
          className="w-full inline-flex items-center justify-center gap-2 text-white font-black no-underline hover:-translate-y-0.5 transition-transform active:scale-[.99]"
          style={{ fontSize: 16, padding: '15px', borderRadius: 14, background: 'linear-gradient(135deg,#fe762c 0%,#d94f00 100%)', boxShadow: '0 8px 22px rgba(254,118,44,0.38)' }}
        >
          {t('signup_cta')}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        <p className="text-xs text-on-surface-variant text-center mt-2.5">{t('signup_note')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={start} className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors border-0 cursor-pointer">
          {t('retry')}
        </button>
        <a href={`/${locale}/oefenen`} className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors no-underline">
          {t('other_skill')}
        </a>
      </div>
    </div>
  );
}

/* ── Stimulus pane: reading passage or audio player ─────────────────────── */
function StimulusPane({ item, isListening }: { item: FreePracticeItem; isListening: boolean }) {
  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)' }}>
      <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed mb-5 pb-5">
        {item.stimulusIntro}
      </p>
      {isListening && item.audioSrc ? (
        <AudioPlayer src={item.audioSrc} />
      ) : (
        <div className="stimulus-body text-sm text-on-surface leading-relaxed" dangerouslySetInnerHTML={{ __html: item.stimulusHtml ?? '' }} />
      )}
      <style>{`
        .stimulus-body h4 { font-family: var(--font-headline); font-weight: 800; font-size: 0.95rem; margin: 0 0 0.6rem; color: #002b6d; }
        .stimulus-body p { margin: 0 0 0.75rem; line-height: 1.7; }
        .stimulus-body p:last-child { margin-bottom: 0; }
        .stimulus-body strong { font-weight: 700; color: #191c1e; }
      `}</style>
    </div>
  );
}

function AudioPlayer({ src }: { src: string }) {
  const t = useTranslations('oefenen');
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  // A new question means a new file: reset transport state.
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    setFailed(false);
  }, [src]);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => setFailed(true));
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  function seek(delta: number) {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  }

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="rounded-xl p-4" style={{ background: '#002b6d' }}>
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onTimeUpdate={e => setProgress(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('audio_unsupported')}</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => seek(-10)}
              aria-label="-10s"
              className="w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 17l-5-5 5-5" /><path d="M18 17l-5-5 5-5" /></svg>
            </button>

            <button
              onClick={toggle}
              aria-label={playing ? t('pause_audio') : t('play_audio')}
              className="w-12 h-12 rounded-full flex items-center justify-center border-0 cursor-pointer flex-shrink-0 hover:scale-105 transition-transform"
              style={{ background: '#fe762c', color: '#fff' }}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3" /></svg>
              )}
            </button>

            <button
              onClick={() => seek(10)}
              aria-label="+10s"
              className="w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 17l5-5-5-5" /><path d="M6 17l5-5-5-5" /></svg>
            </button>

            <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {fmt(progress)} / {fmt(duration)}
            </span>
          </div>

          <div className="rounded-full overflow-hidden mt-3" style={{ height: 4, background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#fe762c' }} />
          </div>
        </>
      )}
    </div>
  );
}

function fmt(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── Question pane: three or four options, with inline feedback ─────────── */
function QuestionPane({
  item, selected, onChoose, explanationLabel, correctLabel, wrongLabel,
}: {
  item: FreePracticeItem;
  selected: OptionKey | null;
  onChoose: (o: OptionKey) => void;
  explanationLabel: string;
  correctLabel: string;
  wrongLabel: string;
}) {
  const options = optionKeys(item).map(key => ({ key, text: optionText(item, key) }));

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)' }}>
      <p className="text-base font-semibold text-on-surface whitespace-pre-line leading-relaxed mb-5">{item.question}</p>

      <div role="radiogroup" className="flex flex-col gap-2.5">
        {options.map(({ key, text }) => {
          const isChosen = selected === key;
          const isRight = item.correct === key;
          const answered = selected !== null;

          let style: React.CSSProperties = { background: '#f8f9fb', border: '1.5px solid #e6e8ea' };
          if (answered && isRight) style = { background: 'rgba(254,118,44,0.10)', boxShadow: 'inset 0 0 0 2px rgba(254,118,44,0.40)' };
          else if (answered && isChosen) style = { background: '#fef2f2', border: '1.5px solid #fca5a5' };
          else if (answered) style = { background: '#f8f9fb', border: '1.5px solid #e6e8ea', opacity: 0.55 };

          return (
            <button
              key={key}
              role="radio"
              aria-checked={isChosen}
              disabled={answered}
              onClick={() => onChoose(key)}
              className="answer-option flex items-center gap-3 p-3.5 rounded-xl text-left w-full cursor-pointer disabled:cursor-default"
              style={style}
            >
              <span
                className="w-7 h-7 min-w-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={answered && isRight
                  ? { background: 'rgba(254,118,44,0.20)', color: '#a24000' }
                  : answered && isChosen
                    ? { background: 'rgba(186,26,26,0.10)', color: '#ba1a1a' }
                    : { background: '#eceef0', color: '#434651' }}
              >
                {key}
              </span>
              <span className="text-sm text-on-surface flex-1">{text}</span>
              {answered && isRight && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color: '#a24000' }}>{correctLabel}</span>
              )}
              {answered && isChosen && !isRight && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--color-error)' }}>{wrongLabel}</span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--color-surface-container-high)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002b6d', letterSpacing: '0.06em' }}>
            {explanationLabel}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,43,109,0.85)' }}>{item.explanation}</p>
        </div>
      )}

      <style>{`
        .answer-option { transition: transform 0.12s ease, border-color 0.15s ease; }
        .answer-option:not(:disabled):hover { transform: translateX(2px); border-color: #002b6d !important; }
        .answer-option:focus-visible { outline: 2px solid #fe762c; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .answer-option { transition: none; } }
      `}</style>
    </div>
  );
}
