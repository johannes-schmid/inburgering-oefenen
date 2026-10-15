'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { track } from '@/lib/analytics';
import { optionKeys, optionText, readAloudSegments, type FreePracticeItem, type OptionKey } from '@/data/free-practice';
import { DEFAULT_LEVEL, formatOf, type Level, type OnderdeelSlug } from '@/data/skills';
import { AnimatedNumber, AnswerGroup, AnswerRow, CategoryMark, Field, PageField, ScoreRing, glasButton, type AnswerState } from '@/components/glas';
import { useReadAloud } from '@/components/proefexamen/useReadAloud';
import { useAudioEnabled } from '@/lib/audio-pref';
import { playCorrectChime } from '@/lib/answer-chime';
import WordPass from '@/components/exam/WordPass';
import { AudioPrefRow, EqBars, HighlightedText, ReadAloudPill } from '@/components/exam/ReadAloud';
import { ArrowRight, Check, Clock, Headphones, Mail, Pause, Play, RotateCcw, RotateCw, Star, UserRoundCheck, X } from 'lucide-react';
import '@/components/exam/glas-player.css';
import { DEV_FLOW_PARAM, devToolsEnabled, tasterFlow } from '@/lib/dev-tools';
import { projectSlaagkans } from '@/lib/practice-result';
import { localeHref } from '@/i18n/paths';

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
  /** 2 waar de pagina zelf een h1 in de kop heeft (`/oefenen/[skill]`); de andere proeven hebben die nog niet. */
  headingLevel?: 1 | 2;
  /** De inhoud van de paginakop (kruimelpad, h1, lead); de proef zet hem zelf in een `PageField`. */
  pageHeader?: ReactNode;
  aside?: ReactNode;
  after?: ReactNode;
};

/** `d` = /oefenen/[skill]: startknop in de paginakop. `nacht` = de proeven zonder eigen kop. */
type IntroVariant = 'nacht' | 'd';

export default function FreePracticeEngine({ skill, skillName, items, locale, level = DEFAULT_LEVEL, headingLevel = 1, pageHeader, aside, after }: Props) {
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  const introVariant: IntroVariant = pageHeader ? 'd' : 'nacht';
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
   * Staat meteen aan, zoals op KNM Oefenen (besluit eigenaar, 21-09): de bezoeker ziet zijn
   * uitslag en de kaart naar het platform direct, en het e-mailadres is een aanbod ("liever je
   * rapport ook per e-mail?") in plaats van een poort. Een uitslag achterhouden die iemand net
   * zelf verdiend heeft levert vooral wegwerpadressen op.
   *
   * De poort zelf is niet gesloopt: `?flow=gate` (alleen lokaal, `devToolsEnabled()`) zet hem
   * terug op `false` en toont de geblurde variant.
   */
  const [revealed, setRevealed] = useState(true);

  /* Focusmodus (15-10): na "Begin" staan de vragen in een eigen laag over de hele pagina — geen
     nav, geen footer, geen paginakop. De pagina blijft eronder staan, dus wie stopt komt terug
     waar hij was. */
  const focus = phase !== 'intro';
  const [closing, setClosing] = useState(false);
  const focusRef = useRef<HTMLDivElement | null>(null);

  /* De klok loopt in het tempo van het echte examen: de DUO-tijd per vraag maal het aantal vragen
     hier, afgerond op hele minuten. Hij stopt niets af — hij is terugkoppeling — en staat stil
     zolang de uitleg van de docent open staat, want die is er in het examen niet. */
  const fmtSpec = formatOf(level, skill);
  const budgetSec = fmtSpec?.itemCount && fmtSpec.durationMinutes
    ? Math.max(1, Math.round((items.length * fmtSpec.durationMinutes) / fmtSpec.itemCount)) * 60
    : null;
  const clockRef = useRef({ acc: 0, since: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [usedSec, setUsedSec] = useState<number | null>(null);
  const clockRunning = phase === 'quiz' && selected === null && !closing;

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
  const examsHref = localeHref(locale, `oefenexamen/${level === null ? '' : `${level}/`}${skill}`);
  /**
   * De uitgang naar het portaal, op het onderdeel dat net geoefend is.
   *
   * Niet `/dashboard`: wie tien vragen Luisteren A2 heeft gemaakt en op de catalogus van alle
   * modules landt, moet zijn eigen onderdeel terugzoeken op het moment dat hij er juist mee
   * bezig was. KNM heeft zijn eigen scherm zonder niveausegment — dezelfde splitsing als
   * `examsHref` hierboven, en om dezelfde reden.
   *
   * **Met de hand samengesteld, niet via `localeHref`.** Het portaal heeft geen vertaalde
   * onderdeelslug — zie de noot bij `canonicalSkillPath` in `i18n/paths.ts` — dus zou dat
   * pad er in het Engels als `/en/dashboard/a2/reading` uitkomen, en die route bestaat niet.
   */
  const platformHref = level === null
    ? `/${locale}/dashboard/knm`
    : `/${locale}/dashboard/${level}/${skill}`;
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
    setRevealed(flow !== 'gate');
    setPhase('results');
  }, [items]);

  useEffect(() => {
    if (!clockRunning) return;
    const c = clockRef.current;
    c.since = performance.now();
    const id = setInterval(() => setElapsed(Math.floor((c.acc + performance.now() - c.since) / 1000)), 250);
    return () => {
      clearInterval(id);
      c.acc += performance.now() - c.since;
    };
  }, [clockRunning]);

  /* De pagina eronder scrolt niet mee en is niet bereikbaar met Tab: de laag is het hele scherm. */
  useEffect(() => {
    if (!focus) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const layer = focusRef.current;
    const silenced = Array.from(document.body.children).filter(el => el !== layer && !el.hasAttribute('inert'));
    silenced.forEach(el => el.setAttribute('inert', ''));
    layer?.focus({ preventScroll: true });
    return () => {
      root.style.overflow = prevOverflow;
      silenced.forEach(el => el.removeAttribute('inert'));
    };
  }, [focus]);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (closing) setClosing(false);
      else requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function scrollFocusTop() {
    requestAnimationFrame(() => focusRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function exitFocus() {
    setClosing(false);
    setPhase('intro');
  }

  /* Tijdens de vragen vraagt het kruisje (en Escape) het altijd eerst; na de uitslag valt er
     niets meer te verliezen. */
  function requestClose() {
    if (phase === 'quiz') setClosing(true);
    else exitFocus();
  }

  function start() {
    clockRef.current = { acc: 0, since: 0 };
    setElapsed(0);
    setUsedSec(null);
    logRef.current = [];
    setLog([]);
    setIdx(0);
    setSelected(null);
    setRevealed(true);
    setPhase('quiz');
    track('free_practice_started', { skill, count: total });
    scrollFocusTop();
  }

  function choose(option: OptionKey) {
    if (selected) return;
    const item = items[idx];
    const isCorrect = option === item.correct;
    if (isCorrect) playCorrectChime();
    setSelected(option);
    logRef.current = [...logRef.current, { item, chosen: option, isCorrect }];
    setLog(logRef.current);
    track('question_answered', { source: 'free_practice', skill, sub_skill: item.subSkill, is_correct: isCorrect });
  }

  function next() {
    if (idx + 1 >= total) {
      setUsedSec(Math.round(clockRef.current.acc / 1000));
      setPhase('results');
      track('free_practice_finished', { skill, score: logRef.current.filter(a => a.isCorrect).length, total });
      scrollFocusTop();
    } else {
      setIdx(idx + 1);
      setSelected(null);
      scrollFocusTop();
    }
  }

  function revealResults() {
    setRevealed(true);
    scrollFocusTop();
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

  /* ── INTRO ──────────────────────────────────────────────────────────────
     Glas §10/§12: een Nacht-kop met het onderdeelmerk en de titel, de belofte als chips, en op wit
     wat de set dekt, de docent en één navy startknop. Geen kicker boven de kop (G-regel). */
  const startBtn = (
    <button type="button" onClick={start} className={glasButton({ variant: 'navy', size: 'lg' })}>
      {t('start_btn')}
      <ArrowRight className="rtl-flip" aria-hidden />
    </button>
  );
  const switchHref = localeHref(locale, 'oefenen');

  const render = (p: Phase) => {
    if (p === 'intro') {
      const genres = Array.from(new Set(items.map(i => i.subSkill)));
      const title = (
        <Heading>
          <CategoryMark category={skill} size={44} tone="dark" />
          {t('heading', { count: total, skill: skillName })}
        </Heading>
      );
      const chips = (
        <div className="g-xchips">
          <span className="g-xbdg g-xbdg-glasd g-tnum">{total} {t('stat_questions').toLowerCase()}</span>
          <span className="g-xbdg g-xbdg-glasd"><Star aria-hidden />{t('stat_free')}</span>
          <span className="g-xbdg g-xbdg-glasd"><UserRoundCheck aria-hidden />{t('stat_no_account')}</span>
          <span className="g-xbdg g-xbdg-glasd"><Check strokeWidth={2.6} aria-hidden />{t('feedback_tag')}</span>
        </div>
      );
      const genreBlock = (
        <div className="g-xgenre-blk">
          <span className="g-mono">{t('sections_heading')}</span>
          <div className="g-xgenres">
            {genres.map(g => <span key={g} className="g-xbdg">{g}</span>)}
          </div>
        </div>
      );
      /* The onboarding question: should every vraag be read aloud by itself? Asked once,
         answered in `localStorage`, and the sample button is what unlocks the browser's
         autoplay so the first question is not silent. */
      const audioBlock = (
        <>
          {isListening && (
            <p className="g-xnotice" style={{ margin: 0 }}>
              <Headphones aria-hidden />
              <span>{t('audio_hint')}</span>
            </p>
          )}
          {canReadAloud && (
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
          )}
        </>
      );
      const teacher = (
        <div className="g-xteacher">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/amber-van-der-zalm-264.webp" alt="Amber van der Zalm" width={44} height={44} />
          <span>
            <b>Amber van der Zalm</b>
            <small>{t('teacher_title')}</small>
          </span>
        </div>
      );

      /* Op /oefenen/[skill] staat de startknop in de paginakop (zie onderaan); deze kaart vertelt
         wat je oefent. De andere proeven (KNM, B1) hebben geen eigen kop en houden de Nacht-kaart. */
      if (introVariant === 'd') {
        return (
          <article className="g-xintro g-xintro-d" style={{ maxWidth: 'none' }}>
            <div className="g-xd-main">
              <Heading>{t('intro_d_heading')}</Heading>
              <p>{t('intro_d_body', { count: total })}</p>
              {genreBlock}
            </div>
            <div className="g-xd-side">
              {teacher}
              {audioBlock}
            </div>
          </article>
        );
      }

      return (
        <article className="g-xintro" style={{ maxWidth: 'none' }}>
          <Field variant="nacht" className="g-xprobe-hd">
            {title}
            {chips}
          </Field>

          <div className="g-xintro-bd">
            {genreBlock}
            {audioBlock}
            {teacher}
            <div className="g-xrow-act">
              {startBtn}
              <a href={switchHref} className={glasButton({ variant: 'ghost', size: 'lg' })}>
                {t('switch_skill')}
              </a>
            </div>
          </div>
        </article>
      );
    }

    const closeBtn = (
      <button type="button" onClick={requestClose} className="g-xbar-x" aria-label={t('focus_close')}>
        <X aria-hidden />
      </button>
    );

    /* ── QUIZ ─────────────────────────────────────────────────────────────── */
    if (p === 'quiz') {
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
        <div className="g-xshell">
          <Field variant={skill === 'lezen' ? 'nevel' : 'gracht'} className="g-xshell-bg" aria-hidden />
          {/* De glazen balk van de speler: stoppen, één segment per vraag, en de klok in examentempo. */}
          <div className="g-xbar g-glass">
            {closeBtn}
            <span className="g-xbar-mark"><CategoryMark category={skill} size={28} /></span>
            <div
              className="g-xsegs"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={log.length}
              aria-label={t('q_done', { pct: Math.round(done) })}
            >
              {items.map((it, i) => (
                <span key={i} className="g-xseg" style={i === idx ? { background: 'rgba(0,43,109,.18)' } : undefined}>
                  <b style={{ transform: `scaleX(${i < log.length ? 1 : 0})` }} />
                </span>
              ))}
            </div>
            <span className="g-xbar-step">
              <span className="g-xstep-long">{t('q_progress', { current: idx + 1, total })}</span>
              <span className="g-xstep-short" aria-hidden>{idx + 1}/{total}</span>
            </span>
            {budgetSec !== null && (
              <PaceTimer budget={budgetSec} elapsed={elapsed} paused={selected !== null} />
            )}
          </div>

          {/* Two panes, like the DUO player: stimulus left, question right. One pane where the
              question stands alone. */}
          {/* De opgaven zijn altijd Nederlands: ook op /ar staan ze links-naar-rechts. */}
          <div dir="ltr" lang="nl" className={hasStimulus ? 'g-xlezen' : undefined} style={hasStimulus ? undefined : { maxWidth: 760, width: '100%', marginInline: 'auto' }}>
            {hasStimulus && <StimulusPane item={item} isListening={isListening} />}
            {/* The question travels with the reader. A DUO Lezen text is far taller than one
                viewport, so a static question pane scrolls out of sight and the candidate has to
                scroll back up to answer what they have just read. On lg the pane sticks below the
                fixed header (`--nav-h`) and scrolls internally if it is itself taller than the
                viewport — and the Volgende-knop lives *inside* it, so the way forward is on screen
                the moment an answer is chosen rather than at the foot of the passage. */}
            <div
              className={hasStimulus ? 'lg:sticky lg:overflow-y-auto flex flex-col gap-3' : 'flex flex-col gap-3'}
              style={hasStimulus ? { top: 76, maxHeight: 'calc(100dvh - 88px)' } : undefined}
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
                <div className={`g-xfoot g-glass${hasStimulus ? ' lg:sticky lg:bottom-0' : ''}`} style={hasStimulus ? undefined : { position: 'static' }}>
                  <span className="g-xfoot-sp" />
                  <button
                    type="button"
                    onClick={next}
                    className={glasButton({ variant: isLast ? 'oranje' : 'navy', size: 'sm' })}
                  >
                    {isLast ? t('finish_btn') : t('next_btn')}
                    <ArrowRight className="rtl-flip" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    /* ── RESULTS ──────────────────────────────────────────────────────────
       One card, glas.html §12 "Gratis proef": the score ring and the potential, the e-mail offer
       underneath, and a single way on to the platform. The per-question explanation has already
       been given inline during the sitting, so it is not repeated here.

       The gate (`revealed === false`, local `?flow=gate`) blurs everything that carries the score
       and lays the e-mail card over it in glass — **with the skip link**, always. */
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

    const emailForm = (
      <form onSubmit={submitEmail} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="g-xfp-row">
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
            className="g-xinput"
          />
          <button type="submit" disabled={sending} className={glasButton({ variant: 'navy' })}>
            {sending ? t('gate_sending') : revealed ? t('email_send') : t('gate_submit')}
          </button>
        </div>
        {emailError && (
          <p id="fp-email-error" role="alert" className="g-xfp-err">
            {t('gate_error')}
          </p>
        )}
        <p className="g-xfp-small">{t('gate_privacy')}</p>
      </form>
    );

    return (
      <div className="g-xshell" style={{ gap: 14 }}>
        <Field variant="licht" className="g-xshell-bg" aria-hidden />
        <div className="g-xbar g-glass">
          {closeBtn}
          <span className="g-xbar-mark"><CategoryMark category={skill} size={28} /></span>
          <div className="g-xsegs" aria-hidden>
            {items.map((_, i) => <span key={i} className="g-xseg"><b style={{ transform: 'scaleX(1)' }} /></span>)}
          </div>
          <span className="g-xbar-step">{total}/{total}</span>
        </div>
        <section className="g-xfp" style={{ minHeight: revealed ? undefined : 380 }}>
          <div className={revealed ? undefined : 'g-xfp-locked'} inert={!revealed} aria-hidden={!revealed}>
            <div className="g-xfp-top">
              <ScoreRing
                results={log.map(a => a.isCorrect)}
                passPct={PASS_PCT}
                size={150}
                label={t('result_score_eyebrow', { score, total })}
              >
                <b style={{ fontSize: 40 }}><AnimatedNumber value={score} locales={locale} /><span>/{total}</span></b>
                <small>{t('gauge_now')} {pct}%</small>
              </ScoreRing>
              <div style={{ minWidth: 0 }}>
                <span className="g-mono">{t('result_score_eyebrow', { score, total })}</span>
                <h2>
                  {t('potential_headline')} <em>{potentialPct}%</em>
                </h2>
                <p>{weak.length > 0 ? t('weak_intro', { topics: weak.join(', ') }) : t('weak_none')}</p>
                <p style={{ fontWeight: 600, color: passed ? 'var(--goed-ink)' : 'var(--ink)' }}>
                  {passed ? t('verdict_pass_title') : t('verdict_fail_title')}
                </p>
                {/* Nu en mogelijk op één balk: het verschil tússen de twee is het aanbod. */}
                <div className="g-xbar2" style={{ marginTop: 12, position: 'relative', height: 10 }} role="img" aria-label={`${t('legend_now', { pct })}, ${t('legend_potential', { pct: potentialPct })}`}>
                  <i style={{ position: 'absolute', inset: 0, background: 'var(--waas)', transform: `scaleX(${potentialPct / 100})` }} />
                  <i style={{ position: 'absolute', inset: 0, background: 'var(--navy)', transform: `scaleX(${pct / 100})` }} />
                </div>
                <div className="g-xfp-legend" aria-hidden>
                  <span><i style={{ background: 'var(--navy)' }} />{t('legend_now', { pct })}</span>
                  <span><i style={{ background: 'var(--waas)' }} />{t('legend_potential', { pct: potentialPct })}</span>
                </div>
                {budgetSec !== null && usedSec !== null && (
                  <p className={`g-xfp-time${usedSec > budgetSec ? ' is-over' : ''}`}>
                    <Clock aria-hidden />
                    <span>
                      {t(usedSec > budgetSec ? 'time_result_over' : 'time_result_in', {
                        used: fmt(usedSec),
                        budget: fmt(budgetSec),
                        count: total,
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {revealed ? (
            <div className="g-xfp-mail">
              {emailCaptured ? (
                <p className="g-xfp-sent">
                  <Check strokeWidth={2.6} aria-hidden />
                  {t('email_sent')}
                </p>
              ) : (
                <>
                  <b><Mail aria-hidden />{t('email_cta_after')}</b>
                  {emailForm}
                </>
              )}
            </div>
          ) : (
            <div className="g-xfp-gate g-xfp-gate-over g-glass g-glass-strong">
              <b>{t('email_cta_locked')}</b>
              {emailForm}
              {/* The way out. Withholding a result the visitor already earned with no
                  escape is coercive and mostly buys junk addresses. */}
              <button type="button" onClick={revealResults} className="g-xskip">
                {t('gate_skip')}
              </button>
            </div>
          )}
        </section>

        {/* ── On to the platform ──────────────────────────────────────────────
            Held back until the score is on screen: it is the exit, and offering it beside a
            blurred result asks the visitor to leave before they have seen what they came for. */}
        {revealed && (
          <section className="g-xfp g-xfp-next">
            <a
              href={platformHref}
              onClick={() => track('free_practice_platform_click', { skill, level, pct })}
              className={glasButton({ variant: 'oranje', size: 'lg' })}
            >
              {t('platform_cta')}
              <ArrowRight className="rtl-flip" aria-hidden />
            </a>

            <p className="g-xfp-note">
              {t('platform_note')} {' · '}
              {t('login_prompt')}{' '}
              <a href={`/${locale}/login`} className="g-tlink" style={{ fontSize: 13 }}>{t('login_link')}</a>
            </p>

            <p className="g-xfp-note">
              <button type="button" onClick={start} className="g-xskip" style={{ alignSelf: 'center' }}>
                {t('retry')}
              </button>
            </p>
          </section>
        )}
      </div>
    );
  };

  const intro = render('intro');
  const layer = focus && typeof document !== 'undefined' && createPortal(
    <div
      ref={focusRef}
      className="g-xfocus"
      role="dialog"
      aria-modal="true"
      aria-label={t('heading', { count: total, skill: skillName })}
      tabIndex={-1}
    >
      <div className="g-xfocus-in">{render(phase)}</div>
      {closing && (
        <div className="g-xdialog-stage" role="alertdialog" aria-modal="true" aria-labelledby="fp-close-title" onClick={() => setClosing(false)}>
          <div className="g-xdialog" onClick={e => e.stopPropagation()}>
            <h2 id="fp-close-title">{t('focus_close_title')}</h2>
            <p>{t('focus_close_body')}</p>
            <div className="g-xdialog-act">
              <button type="button" className={glasButton({ variant: 'navy', size: 'sm' })} onClick={() => setClosing(false)} autoFocus>
                {t('focus_stay')}
              </button>
              <button type="button" className={glasButton({ variant: 'ghost', size: 'sm' })} onClick={exitFocus}>
                {t('focus_leave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );

  if (!pageHeader) return <>{intro}{layer}</>;

  /* Op /oefenen/[skill] tekent de proef ook de paginakop, zodat variant d de startknop ín de kop
     kan zetten — onder de lead, als eerste handeling van de pagina. De feiten en de volgende stap
     van de pagina komen als `aside`/`after` mee. */
  return (
    <>
      <PageField variant="gracht" className="g-under-nav">
        {pageHeader}
        {introVariant === 'd' && (
          <div className="g-xd-cta">
            <div className="g-xd-row">
              {startBtn}
              <a href={switchHref} className="g-tlink">{t('switch_skill')}</a>
            </div>
            <ul className="g-xd-perks">
              <li><Check strokeWidth={2.6} aria-hidden />{t('stat_free')}</li>
              <li><Check strokeWidth={2.6} aria-hidden />{t('stat_no_account')}</li>
              <li><Check strokeWidth={2.6} aria-hidden />{t('feedback_tag')}</li>
            </ul>
          </div>
        )}
      </PageField>
      <div className="g-wrap g-fpx-body">
        <div className="g-fpx-grid">
          <div id="fp-engine" className="g-fpx-engine">{intro}</div>
          {aside}
        </div>
        {after}
      </div>
      {layer}
    </>
  );
}

/* ── Stimulus pane: reading passage as paper, or the listening capsule ───── */
function StimulusPane({ item, isListening }: { item: FreePracticeItem; isListening: boolean }) {
  return (
    <div className={isListening ? 'g-xlezen-side g-xsit-card' : 'g-xlezen-side'}>
      {item.stimulusIntro && <Situation text={item.stimulusIntro} />}
      {isListening && item.audioSrc ? (
        <AudioPlayer src={item.audioSrc} />
      ) : (
        /* Tag-level rules live in .exam-rich in app/globals.css — see the note there. */
        <article className="g-xpaper">
          <div className="exam-rich exam-rich-scroll" dangerouslySetInnerHTML={{ __html: item.stimulusHtml ?? '' }} />
        </article>
      )}
    </div>
  );
}

/**
 * De situatie boven de tekst of het fragment: de eerste regel zegt wáár je bent en is de kop; de
 * regels daarna zijn de werkvolgorde ("Lees eerst de vraag…") en staan genummerd, want het is een
 * volgorde. Eén regel zonder volgorde blijft gewoon een kop.
 */
function Situation({ text }: { text: string }) {
  const [scene, ...steps] = text.split('\n').map(l => l.trim()).filter(Boolean);
  return (
    <div className="g-xsit">
      <p className="g-xsit-scene">{scene}</p>
      {steps.length > 0 && (
        <ol className="g-xsit-steps">
          {steps.map((step, i) => <li key={i}><span aria-hidden>{i + 1}</span>{step}</li>)}
        </ol>
      )}
    </div>
  );
}

/** De glazen capsule van de speler (glas.html §10), met de teksten van de proef (i18n). */
const WAVE_BARS = 56;
const WAVE_HEIGHTS = Array.from({ length: WAVE_BARS }, (_, i) =>
  5 + Math.round(Math.abs(Math.sin(i * 0.5) * Math.cos(i * 0.23)) * 26 + (i % 4) * 1.5)
);

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

  const frac = duration ? progress / duration : 0;

  return (
    <Field variant="gracht" className="g-xlstage">
      <div className="g-xaud g-xaud-inline">
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
          <p className="g-xaud-msg">{t('audio_unsupported')}</p>
        ) : (
          <>
            <button type="button" onClick={toggle} aria-label={playing ? t('pause_audio') : t('play_audio')} className="g-xap">
              {playing ? <Pause aria-hidden /> : <Play aria-hidden style={{ marginInlineStart: 2 }} />}
            </button>
            {/* Tijden links en rechts van de golf, niet eronder: dan staan knop, golf en
                spoelknoppen op één middellijn. */}
            <div className="g-xaud-mid">
              <span className="g-xtm-t">{fmt(progress)}</span>
              <div className="g-xwv" aria-hidden>
                {WAVE_HEIGHTS.map((h, i) => (
                  <b key={i} className={frac > 0 && i / WAVE_BARS < frac ? 'on' : undefined} style={{ height: h }} />
                ))}
                {frac > 0 && frac < 1 && <span className="g-xwv-ph" style={{ insetInlineStart: `${frac * 100}%` }} />}
              </div>
              <span className="g-xtm-t">{fmt(duration)}</span>
            </div>
            <div className="g-xaud-side">
              <button type="button" onClick={() => seek(-10)} aria-label="-10s" className="g-xab"><RotateCcw aria-hidden /></button>
              <button type="button" onClick={() => seek(10)} aria-label="+10s" className="g-xab"><RotateCw aria-hidden /></button>
            </div>
          </>
        )}
      </div>
    </Field>
  );
}

/**
 * De klok in examentempo: een ring die leegloopt en de resterende tijd. Over de tijd heen telt hij
 * door met een plus en kleurt hij oranje — geen rood, want te langzaam is hier geen fout.
 */
function PaceTimer({ budget, elapsed, paused }: { budget: number; elapsed: number; paused: boolean }) {
  const t = useTranslations('oefenen');
  const left = budget - elapsed;
  const over = left < 0;
  const abs = Math.abs(left);
  const min = Math.floor(abs / 60);
  const sec = abs % 60;
  const R = 8;
  const C = 2 * Math.PI * R;
  const frac = over ? 0 : left / budget;
  return (
    <span
      className={`g-xpace${over ? ' is-over' : ''}${paused ? ' is-paused' : ''}`}
      role="timer"
      aria-label={t(over ? 'timer_over_aria' : 'timer_aria', { min, sec })}
      title={paused ? t('timer_paused') : t('timer_label')}
    >
      <svg viewBox="0 0 20 20" aria-hidden>
        <circle cx="10" cy="10" r={R} className="g-xpace-trk" />
        <circle
          cx="10"
          cy="10"
          r={R}
          className="g-xpace-val"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 10 10)"
        />
      </svg>
      <span className="g-xpace-lbl">{t('timer_label')}</span>
      <b dir="ltr">{over ? '+' : ''}{min}:{String(sec).padStart(2, '0')}</b>
    </span>
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
  const answered = selected !== null;
  const right = answered && selected === item.correct;

  return (
    <div className="g-xbody">
      {hasReadAloud && (
        <div className="g-xqhead" style={{ justifyContent: 'flex-end' }}>
          <ReadAloudPill reading={reading} onToggle={toggle} readLabel={readLabel} stopLabel={stopLabel} />
        </div>
      )}
      <p className="g-xqtitle" style={{ whiteSpace: 'pre-line', marginTop: hasReadAloud ? 10 : 0 }}>
        {hasReadAloud
          ? <HighlightedText text={item.question} reading={reading} activeSeg={activeSeg} thisSeg={0} activeWord={activeWord} />
          : item.question}
      </p>

      {/* Media belonging to the question rather than to a stimulus — KNM's whole bank carries
          both, and the question is often *about* the picture. Same order as `McqQuestion` in the
          paid player: the spoken question, then the image, then the options.

          The transport is hidden once read-aloud is available: it plays the same clip the
          sequence already plays, and two controls for one recording invite the candidate to
          start both at once. */}
      {item.questionAudioSrc && !hasReadAloud && (
        <div style={{ marginBottom: 16 }}>
          <AudioPlayer src={item.questionAudioSrc} />
        </div>
      )}
      {item.questionImage && (
        /* Capped and centred rather than filling the card: on a question that is frequently
           *about* the picture, the photo and all three answers have to fit one view. */
        <figure className="g-xfig" style={{ maxWidth: 560, marginInline: 'auto' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.questionImage} alt="" style={{ maxHeight: '38vh', objectFit: 'contain' }} />
        </figure>
      )}

      <AnswerGroup label={item.question}>
        {options.map(({ key, text }, i) => {
          const isChosen = selected === key;
          const isRight = item.correct === key;
          /* Segment 0 is the question, so option *i* is segment i + 1. Answer state wins over
             reading state — a revealed verdict must not be overpainted by the highlight. */
          const isBeingRead = hasReadAloud && reading && activeSeg === i + 1;
          const state: AnswerState = !answered ? 'idle' : isRight ? 'correct' : isChosen ? 'wrong' : 'dim';
          return (
            <AnswerRow
              key={key}
              letter={key}
              state={state}
              onSelect={() => onChoose(key)}
              /* The small sparkle only when *you* got it right — not on the correct row that is
                 revealed after a wrong pick. */
              reward={isChosen && isRight}
              correctLabel={correctLabel}
              wrongLabel={wrongLabel}
              className={`${!answered && isBeingRead ? 'g-xans-reading' : ''}${answered && isRight ? ' answer-correct' : ''}`}
            >
              {/* Not once answered: the sequence reads on past the click, and a word-mark sitting
                  inside a green "Goed" row overpaints the verdict — the one thing the highlight
                  must never do. The question above keeps its marking. */}
              {hasReadAloud && !answered
                ? <HighlightedText text={text} reading={reading} activeSeg={activeSeg} thisSeg={i + 1} activeWord={activeWord} />
                : <WordPass text={text} active={answered && isRight} />}
              {isBeingRead && !answered && <span className="g-xans-eq" style={{ marginInlineStart: 8 }}><EqBars size={14} /></span>}
            </AnswerRow>
          );
        })}
      </AnswerGroup>

      {selected && (
        <div className={`g-xverdict answer-verdict ${right ? 'g-xverdict-ok' : 'g-xverdict-nok'}`}>
          {right ? <Check strokeWidth={3} aria-hidden /> : <X strokeWidth={3} aria-hidden />}
          <span>
            <b style={{ display: 'block' }}>{explanationLabel}</b>
            {item.explanation}
          </span>
        </div>
      )}
    </div>
  );
}
