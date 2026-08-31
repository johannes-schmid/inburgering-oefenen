'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { track } from '@/lib/analytics';
import { optionKeys, optionText, readAloudSegments, type FreePracticeItem, type OptionKey } from '@/data/free-practice';
import { DEFAULT_LEVEL, type Level, type OnderdeelSlug } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import { useReadAloud } from '@/components/proefexamen/useReadAloud';
import { useAudioEnabled } from '@/lib/audio-pref';
import {
  AudioPrefRow,
  EqBars,
  HighlightedText,
  ReadAloudPill,
  readingBadgeStyle,
  readingOptionStyle,
} from '@/components/exam/ReadAloud';
import { ArrowRight, Check, Headphones, Mail, Star, UserRoundCheck } from 'lucide-react';
import { DEV_FLOW_PARAM, devToolsEnabled, tasterFlow } from '@/lib/dev-tools';
import { projectSlaagkans } from '@/lib/practice-result';

const PASS_PCT = 70;

type Answered = { item: FreePracticeItem; chosen: OptionKey; isCorrect: boolean };
type Phase = 'intro' | 'quiz' | 'results';

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
  /**
   * Whether the score itself is on screen.
   *
   * The result renders behind a blur until the visitor hands over an e-mail address or takes
   * the skip link. Withholding it outright with no way out is coercive and mostly yields junk
   * addresses — the skip link is deliberate and is pinned by `tests/free-practice.spec.js`.
   */
  const [revealed, setRevealed] = useState(false);

  const isListening = skill === 'luisteren';
  /**
   * Whether this taster can read itself aloud.
   *
   * Derived from the audio actually present on the items, not from the onderdeel — one
   * condition instead of a flag that could disagree with the content. In practice that means
   * KNM and only KNM: `question_options.audio_url` is populated for its whole bank and for
   * nothing else, and on Luisteren a spoken answer would talk over the fragment being tested.
   */
  const canReadAloud = items.some(i => readAloudSegments(i).length > 0);
  /** The first question clip — the sample that unlocks autoplay for the whole sitting. */
  const sampleUrl = items.find(i => i.questionAudioSrc)?.questionAudioSrc ?? null;
  /** KNM's URLs carry no level segment — see `level` above. */
  const examsHref = `/${locale}/oefenexamen/${level === null ? '' : `${level}/`}${skill}`;
  const total = items.length;
  const score = log.filter(a => a.isCorrect).length;
  const pct = total ? Math.round((score / total) * 100) : 0;

  /**
   * Local-only: jump into the gate or the result screen with a plausible answer log.
   *
   * The score is what separates these screens, so the log is built to hit it rather than
   * faked at the phase level — the results screen re-derives everything from `log`.
   * `devToolsEnabled()` is false in any production build and the param is then ignored.
   */
  useEffect(() => {
    if (!devToolsEnabled()) return;
    const flow = tasterFlow(new URLSearchParams(window.location.search).get(DEV_FLOW_PARAM));
    if (!flow) return;
    const wantPct = flow === 'results_fail' ? 30 : 90;
    const seeded: Answered[] = items.map((item, i) => {
      const correct = (i * 100) / Math.max(items.length, 1) < wantPct;
      const wrong = optionKeys(item).find(k => k !== item.correct) ?? item.correct;
      return { item, chosen: correct ? item.correct : wrong, isCorrect: correct };
    });
    logRef.current = seeded;
    setLog(seeded);
    setIdx(items.length - 1);
    // The "e-mail verstuurd" confirmation lives on the result screen, not on the gate.
    if (flow === 'email_sent') setEmailCaptured(true);
    if (flow !== 'gate') setRevealed(true);
    setPhase('results');
  }, [items]);

  function start() {
    logRef.current = [];
    setLog([]);
    setIdx(0);
    setSelected(null);
    setRevealed(false);
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
      setPhase('results');
      track('free_practice_finished', { skill, score: logRef.current.filter(a => a.isCorrect).length, total });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIdx(idx + 1);
      setSelected(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function revealResults() {
    setRevealed(true);
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

          {/* The onboarding question: should every vraag be read aloud by itself? Asked once,
              answered in `localStorage`, and the sample button is what unlocks the browser's
              autoplay so the first question is not silent. */}
          {canReadAloud && (
            <div className="mb-6">
              <AudioPrefRow
                sampleUrl={sampleUrl}
                labels={{
                  heading: t('readaloud_heading'),
                  onDesc: t('readaloud_on_desc'),
                  offDesc: t('readaloud_off_desc'),
                  playSample: t('readaloud_sample'),
                  stopSample: t('readaloud_sample_stop'),
                  turnOn: t('readaloud_turn_on'),
                  turnOff: t('readaloud_turn_off'),
                }}
              />
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
        {/* A standalone question (KNM) fills the page's own column rather than sitting in a
            672px box inside it. `max-w-2xl` without `mx-auto` pinned the card to the left of the
            `max-w-5xl` page and left the progress bar running on past it to the right — which
            read as a layout fault rather than as a measure (owner's instruction, 2026-08-29). */}
        <div className={hasStimulus ? 'grid lg:grid-cols-2 gap-4 items-start' : undefined}>
          {hasStimulus && <StimulusPane item={item} isListening={isListening} />}
          {/* The question travels with the reader. A DUO Lezen text is far taller than one
              viewport, so a static question pane scrolls out of sight and the candidate has to
              scroll back up to answer what they have just read. On lg the pane sticks below the
              fixed header (`--nav-h`) and scrolls internally if it is itself taller than the
              viewport — and the Volgende-knop lives *inside* it, so the way forward is on screen
              the moment an answer is chosen rather than at the foot of the passage. */}
          <div
            className={hasStimulus ? 'lg:sticky lg:overflow-y-auto flex flex-col gap-4' : 'flex flex-col gap-4'}
            style={hasStimulus ? { top: 'calc(var(--nav-h) + 1rem)', maxHeight: 'calc(100vh - var(--nav-h) - 2rem)' } : undefined}
          >
            <QuestionPane
              item={item}
              selected={selected}
              onChoose={choose}
              explanationLabel={t('explanation_label')}
              correctLabel={t('correct_label_inline')}
              wrongLabel={t('wrong_label_inline')}
              readLabel={t('readaloud_read')}
              stopLabel={t('readaloud_stop')}
            />
            {selected && (
              <div className={`flex justify-end${hasStimulus ? ' lg:sticky lg:bottom-0' : ''}`}>
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
        </div>
      </div>
    );
  }

  /* ── RESULTS ──────────────────────────────────────────────────────────
     One card, on KNM's shape: the score with the slaagkans gauge beside it, the e-mail
     capture underneath, and a single way on to the platform. It replaced a separate gate
     screen followed by a five-block page of breakdowns — the per-question explanation has
     already been given inline during the sitting, so repeating it here only pushed the one
     action the page exists for below three folds. */
  const passed = pct >= PASS_PCT;
  const potentialPct = projectSlaagkans(pct);

  const byGenre = new Map<string, { correct: number; total: number }>();
  log.forEach(a => {
    const row = byGenre.get(a.item.subSkill) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (a.isCorrect) row.correct += 1;
    byGenre.set(a.item.subSkill, row);
  });
  const weak = Array.from(byGenre.entries())
    .filter(([, r]) => r.correct < r.total)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .map(([genre]) => genre)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <section
        className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#001d4e 0%,#002b6d 58%,#143d8a 100%)', boxShadow: '0 16px 44px rgba(0,43,109,0.18)' }}
      >
        <div className="relative px-6 py-7 sm:px-8">
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(110% 80% at 100% 0%, rgba(254,118,44,0.2), transparent 58%)' }} />
          <style>{`
            .fp-grid { display:grid; gap:18px; grid-template-areas:"head" "gauge" "email"; }
            .fp-head { grid-area:head; }
            .fp-gauge { grid-area:gauge; }
            .fp-email { grid-area:email; }
            /* The blur is the gate. pointer-events and inert keep the withheld number out of
               reach of a cursor, a caret and a screen reader alike — a visually blurred score
               that a screen reader still reads out is not withheld at all. */
            .fp-locked { filter:blur(9px); opacity:.72; user-select:none; pointer-events:none; }
            @media (min-width:768px) {
              .fp-grid { grid-template-columns:1.12fr 0.88fr; column-gap:28px; row-gap:16px;
                         grid-template-areas:"head gauge" "email gauge"; align-items:center; }
            }
            @media (prefers-reduced-motion: reduce) { .fp-locked { filter:blur(9px); } }
          `}</style>

          <div className="relative fp-grid">
            <div className={`fp-head${revealed ? '' : ' fp-locked'}`} inert={!revealed} aria-hidden={!revealed}>
              <p className="uppercase font-extrabold" style={{ fontSize: '.66rem', letterSpacing: '.14em', color: 'rgba(255,255,255,.55)', margin: 0 }}>
                {t('result_score_eyebrow', { score, total })}
              </p>
              <h2 className="font-headline font-extrabold text-white" style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', lineHeight: 1.1, letterSpacing: '-.02em', margin: '8px 0 10px' }}>
                {t('potential_headline')} <span style={{ color: '#fe762c' }}>{potentialPct}%</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,.72)', fontSize: '.94rem', lineHeight: 1.55, margin: 0 }}>
                {weak.length > 0 ? t('weak_intro', { topics: weak.join(', ') }) : t('weak_none')}
              </p>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.82rem', margin: '10px 0 0' }}>
                {passed ? t('verdict_pass_title') : t('verdict_fail_title')}
              </p>
            </div>

            <div className={`fp-gauge${revealed ? '' : ' fp-locked'}`} inert={!revealed} aria-hidden={!revealed}>
              <SlaagkansGauge now={pct} potential={potentialPct} nowLabel={t('gauge_now')} legend={[t('legend_now', { pct }), t('legend_potential', { pct: potentialPct })]} />
            </div>

            <div className="fp-email">
              <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 16 }}>
                {emailCaptured ? (
                  <p className="font-semibold flex items-center gap-1.5" style={{ color: '#ffd1ab', fontSize: '.88rem', margin: 0 }}>
                    <Check size={15} strokeWidth={2.6} aria-hidden="true" />
                    {t('email_sent')}
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <Mail size={15} strokeWidth={2} style={{ color: '#ffd1ab', flexShrink: 0 }} aria-hidden="true" />
                      <span className="font-bold text-white" style={{ fontSize: '.86rem', lineHeight: 1.3 }}>
                        {revealed ? t('email_cta_after') : t('email_cta_locked')}
                      </span>
                    </div>
                    <form onSubmit={submitEmail} noValidate>
                      <div className="flex flex-col gap-2 sm:flex-row">
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
                          className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white"
                          style={{ border: `1.5px solid ${emailError ? '#ef4444' : 'transparent'}`, color: '#1a1c23', outline: 'none', minWidth: 0 }}
                        />
                        <button
                          type="submit"
                          disabled={sending}
                          className="px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 disabled:opacity-60 hover:-translate-y-0.5 transition-transform active:scale-95"
                          style={{ background: '#fff', color: '#002b6d', border: 0, cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,.18)' }}
                        >
                          {sending ? t('gate_sending') : revealed ? t('email_send') : t('gate_submit')}
                        </button>
                      </div>
                      {emailError && (
                        <p id="fp-email-error" role="alert" className="text-sm mt-2 font-semibold" style={{ color: '#ffb4ab' }}>
                          {t('gate_error')}
                        </p>
                      )}
                    </form>
                    <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', margin: '7px 0 0' }}>{t('gate_privacy')}</p>
                    {/* The way out. Withholding a result the visitor already earned with no
                        escape is coercive and mostly buys junk addresses. */}
                    {!revealed && (
                      <button
                        type="button"
                        onClick={revealResults}
                        className="mt-3 text-sm underline bg-transparent border-0 cursor-pointer p-0"
                        style={{ color: 'rgba(255,255,255,.6)' }}
                      >
                        {t('gate_skip')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── On to the platform ──────────────────────────────────────────────
          Held back until the score is on screen: it is the exit, and offering it beside a
          blurred result asks the visitor to leave before they have seen what they came for. */}
      {revealed && (
        <section className="rounded-2xl p-6 sm:p-7 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-ambient)' }}>
          <a
            href={`/${locale}/dashboard`}
            onClick={() => track('free_practice_platform_click', { skill, pct })}
            className="w-full inline-flex items-center justify-center gap-2 text-white font-black no-underline hover:-translate-y-0.5 transition-transform active:scale-[.99]"
            style={{ fontSize: 17, padding: '17px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#fe762c 0%,#d94f00 100%)', boxShadow: '0 8px 22px rgba(254,118,44,.38)' }}
          >
            {t('platform_cta')}
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          </a>

          <p className="text-center text-xs text-on-surface-variant" style={{ margin: '12px 0 0' }}>
            {t('platform_note')} {' · '}
            {t('login_prompt')}{' '}
            <a href={`/${locale}/login`} className="font-semibold no-underline hover:underline text-primary">{t('login_link')}</a>
          </p>

          <p className="text-center" style={{ margin: '10px 0 0' }}>
            <button
              type="button"
              onClick={start}
              className="font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0 text-xs text-outline"
            >
              {t('retry')}
            </button>
          </p>
        </section>
      )}
    </div>
  );
}

/* ── The slaagkans gauge ─────────────────────────────────────────────────
   Two arcs on one half-circle: the orange one is today's score, the pale one what practising
   can reach. One gauge rather than two numbers, because the gap between the arcs *is* the
   pitch. The projection itself is `projectSlaagkans` — see the note on that function. */
function SlaagkansGauge({ now, potential, nowLabel, legend }: { now: number; potential: number; nowLabel: string; legend: [string, string] | string[] }) {
  const R = 78, STROKE = 16, CX = 100, CY = 100;
  const polar = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  };
  const arc = (fromPct: number, toPct: number) => {
    const s = polar(180 + fromPct * 1.8);
    const e = polar(180 + toPct * 1.8);
    const large = (toPct - fromPct) * 1.8 > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };
  const top = Math.max(now, potential);

  return (
    <div style={{ width: '100%', maxWidth: 240, margin: '0 auto' }}>
      <svg viewBox="0 4 200 112" style={{ display: 'block', width: '100%', height: 'auto' }} role="img" aria-label={legend.join(', ')}>
        <path d={arc(0, 100)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={STROKE} strokeLinecap="round" />
        {top > 0 && <path d={arc(0, top)} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={STROKE} strokeLinecap="round" />}
        {now > 0 && <path d={arc(0, now)} fill="none" stroke="#fe762c" strokeWidth={STROKE} strokeLinecap="round" />}
        <text x={CX} y={CY - 8} textAnchor="middle" fontFamily="var(--font-headline)" fontSize={34} fontWeight={800} fill="#fff">{now}%</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontFamily="var(--font-body)" fontSize={10} fontWeight={700} letterSpacing="2" fill="rgba(255,255,255,0.55)">{nowLabel.toUpperCase()}</text>
      </svg>
      <div className="flex items-center justify-center gap-4 flex-wrap" style={{ marginTop: 2 }}>
        {[{ color: '#fe762c', label: legend[0] }, { color: 'rgba(255,255,255,0.42)', label: legend[1] }].map(({ color, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: 'rgba(255,255,255,.62)', fontWeight: 600 }}>
            <span style={{ width: 14, height: 4, borderRadius: 99, background: color, display: 'block' }} />
            {label}
          </span>
        ))}
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
        <div className="stimulus-body exam-rich exam-rich-scroll text-sm text-on-surface leading-relaxed" dangerouslySetInnerHTML={{ __html: item.stimulusHtml ?? '' }} />
      )}
      {/* Tag-level rules live in .exam-rich in app/globals.css — see the note there. */}
      <style>{`
        .stimulus-body { line-height: 1.7; }
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
  item, selected, onChoose, explanationLabel, correctLabel, wrongLabel, readLabel, stopLabel,
}: {
  item: FreePracticeItem;
  selected: OptionKey | null;
  onChoose: (o: OptionKey) => void;
  explanationLabel: string;
  correctLabel: string;
  wrongLabel: string;
  readLabel: string;
  stopLabel: string;
}) {
  const options = optionKeys(item).map(key => ({ key, text: optionText(item, key) }));

  /**
   * Read-aloud: the vraag, then every answer, in one sequence with the spoken word marked.
   *
   * `segments` is index-aligned with `[question, ...options]`, so `activeSeg === 0` is the
   * question and `activeSeg === i + 1` is option *i* — which is what lets an option glow while
   * it is being read. It rebuilds on every question and `useReadAloud` keys its autoplay on the
   * segment urls, so advancing stops the previous clip and starts the new one with no wiring
   * here. An item with no such audio yields an empty array and the hook stays idle.
   */
  const segments = readAloudSegments(item);
  const [audioEnabled] = useAudioEnabled();
  const { reading, activeSeg, activeWord, toggle } = useReadAloud(segments, audioEnabled);
  const hasReadAloud = segments.some(s => s.url);

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)' }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-base font-semibold text-on-surface whitespace-pre-line leading-relaxed m-0 flex-1">
          {hasReadAloud
            ? <HighlightedText text={item.question} reading={reading} activeSeg={activeSeg} thisSeg={0} activeWord={activeWord} />
            : item.question}
        </p>
        {hasReadAloud && (
          <div className="flex-shrink-0">
            <ReadAloudPill reading={reading} onToggle={toggle} readLabel={readLabel} stopLabel={stopLabel} />
          </div>
        )}
      </div>

      {/* Media belonging to the question rather than to a stimulus — KNM's whole bank carries
          both, and the question is often *about* the picture. Same order as `McqQuestion` in the
          paid player: the spoken question, then the image, then the options.

          The transport is hidden once read-aloud is available: it plays the same clip the
          sequence already plays, and two controls for one recording invite the candidate to
          start both at once. */}
      {item.questionAudioSrc && !hasReadAloud && (
        <div className="mb-4">
          <AudioPlayer src={item.questionAudioSrc} />
        </div>
      )}
      {item.questionImage && (
        /* Capped and centred rather than filling the card. Once the standalone question went
           full-width the photo grew to ~1450px and pushed all three answers below the fold —
           on a question that is frequently *about* the picture, so both have to be in one view.
           The cap is a measure, not the card's width. */
        <figure
          className="m-0 mb-4 mx-auto rounded-xl overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)', maxWidth: 560 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.questionImage}
            alt=""
            style={{ width: '100%', maxHeight: '38vh', objectFit: 'contain', display: 'block' }}
          />
        </figure>
      )}

      <div role="radiogroup" className="flex flex-col gap-2.5">
        {options.map(({ key, text }, i) => {
          const isChosen = selected === key;
          const isRight = item.correct === key;
          const answered = selected !== null;
          /* Segment 0 is the question, so option *i* is segment i + 1. Answer state wins over
             reading state — a revealed verdict must not be overpainted by the highlight. */
          const isBeingRead = hasReadAloud && reading && activeSeg === i + 1;

          let style: React.CSSProperties = { background: '#f8f9fb', border: '1.5px solid #e6e8ea' };
          if (answered && isRight) style = { background: 'var(--color-correct-container)', boxShadow: 'inset 0 0 0 2px rgba(14,122,75,0.45)' };
          else if (answered && isChosen) style = { background: '#fef2f2', border: '1.5px solid #fca5a5' };
          else if (answered) style = { background: '#f8f9fb', border: '1.5px solid #e6e8ea', opacity: 0.55 };
          else if (isBeingRead) style = { ...readingOptionStyle(), border: '1.5px solid transparent' };

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
                  ? { background: 'var(--color-correct)', color: '#fff' }
                  : answered && isChosen
                    ? { background: 'rgba(186,26,26,0.10)', color: '#ba1a1a' }
                    : !answered && isBeingRead
                      ? readingBadgeStyle()
                      : { background: '#eceef0', color: '#434651' }}
              >
                {key}
              </span>
              <span className="text-sm text-on-surface flex-1">
                {/* Not once answered: the sequence reads on past the click, and a clay word-mark
                    sitting inside a green "Goed" row overpaints the verdict — the one thing the
                    highlight must never do. The question above keeps its marking. */}
                {hasReadAloud && !answered
                  ? <HighlightedText text={text} reading={reading} activeSeg={activeSeg} thisSeg={i + 1} activeWord={activeWord} />
                  : text}
              </span>
              {isBeingRead && !answered && (
                <span className="flex-shrink-0" style={{ color: '#d94f00' }}><EqBars size={14} /></span>
              )}
              {answered && isRight && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--color-on-correct-container)' }}>{correctLabel}</span>
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
