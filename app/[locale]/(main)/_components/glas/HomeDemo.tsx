'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, Lock, Mic, Pause, Play, RotateCcw, Square, X } from 'lucide-react';
import AnswerRow, { AnswerGroup, type AnswerState } from '@/components/glas/AnswerRow';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import { WavRecorder, canRecordWav } from '@/lib/wav-recorder';

/* De proef op de homepage (variant B): zes tabbladen, één per onderdeel, elk met één opgave die
   echt werkt — Luisteren met het echte fragment, Spreken met je eigen microfoon. De opbouw is die
   van de demo op deutschtest üben; de inhoud is van ons. **De opgaven zelf zijn Nederlands in elke
   taal** (zoals in het examen) en staan daarom `dir="ltr" lang="nl"`; alleen de knoppen en uitleg
   eromheen zijn vertaald. */

export type DemoMcq = {
  intro: string;
  stimulusHtml?: string;
  question: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation: string;
};

export type DemoListening = DemoMcq & {
  audioSrc: string;
  /** Regels "A: …" / "B: …" uit het script waarvan de audio is gemaakt. */
  script: string;
  speakers: Record<string, string>;
  /** Per optie wat de tegel groot laat zien (bijv. een tijd) en het kleine label erboven. */
  tiles: Record<string, { big: string; small: string }>;
};

export type DemoSpeaking = {
  speaker: string;
  says: string;
  prompt: string;
  answer: string;
  limit: number;
};

type Format = { items: number; minutes: number };

type Props = {
  luisteren: DemoListening;
  lezen: DemoMcq;
  spreken: DemoSpeaking;
  knm: DemoMcq;
  formats: { luisteren: Format; lezen: Format; spreken: Format };
  knmMinutes: number;
  onaCards: string[];
};

const TABS = [
  { id: 'luisteren', track: 'a2', time: '31:47' },
  { id: 'lezen', track: 'a2', time: '48:12' },
  { id: 'schrijven', track: 'b1', time: '61:40' },
  { id: 'spreken', track: 'a2', time: '33:20' },
  { id: 'knm', track: 'knm', time: '32:05' },
  { id: 'ona', track: 'ona', time: '' },
] as const satisfies readonly { id: Category; track: string; time: string }[];
type TabId = (typeof TABS)[number]['id'];

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function shake(el: Element | null | undefined) {
  if (!el || reduced()) return;
  el.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }],
    { duration: 300, easing: 'ease-out' },
  );
}

export default function HomeDemo({ luisteren, lezen, spreken, knm, formats, knmMinutes, onaCards }: Props) {
  const t = useTranslations('home_b');
  const [tab, setTab] = useState<TabId>('luisteren');
  const base = useId();
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const i = TABS.findIndex(x => x.id === tab);
  const active = TABS[i];

  const go = (n: number, focus = false) => {
    setTab(TABS[n].id);
    const el = btns.current[n];
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    if (focus) el?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const rtl = document.dir === 'rtl';
    const step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    if (!step) return;
    e.preventDefault();
    go((i + step + TABS.length) % TABS.length, true);
  };

  return (
    <div className="g-hb-app">
      <div className="g-hb-bar">
        <span className="g-hb-dots" aria-hidden="true"><i /><i /><i /></span>
        <b>{t(`demo_${active.track}_title`)}</b>
        <span className="g-hb-bar-sub">{t(`demo_${tab}_sub`)}</span>
        {active.time && (
          <span className="g-hb-timer">
            <span>{t('demo_time_left')}</span>
            <b className="g-tnum">{active.time}</b>
          </span>
        )}
      </div>

      <div role="tablist" aria-label={t('demo_tabs_aria')} className="g-hb-tabs" onKeyDown={onKey}>
        {TABS.map((x, n) => (
          <button
            key={x.id}
            ref={el => { btns.current[n] = el; }}
            type="button"
            role="tab"
            id={`${base}-${x.id}-tab`}
            aria-controls={`${base}-${x.id}`}
            aria-selected={tab === x.id}
            tabIndex={tab === x.id ? 0 : -1}
            onClick={() => go(n)}
            className="g-hb-tab"
          >
            <CategoryMark category={x.id} size={20} tone={tab === x.id ? 'dark' : 'light'} />
            <span>{t(`demo_tab_${x.id}`)}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${base}-${tab}`}
        aria-labelledby={`${base}-${tab}-tab`}
        className="g-hb-panel"
        key={tab}
      >
        {tab === 'luisteren' && <Listening item={luisteren} />}
        {tab === 'lezen' && <Mcq item={lezen} withStimulus />}
        {tab === 'schrijven' && <Writing />}
        {tab === 'spreken' && <Speaking item={spreken} />}
        {tab === 'knm' && <Mcq item={knm} />}
        {tab === 'ona' && <Ona cards={onaCards} />}
        <p className="g-hb-format">
          {tab === 'luisteren' && t('demo_a2_format', formats.luisteren)}
          {tab === 'lezen' && t('demo_a2_format', formats.lezen)}
          {tab === 'schrijven' && t('demo_b1_parts')}
          {tab === 'spreken' && t('demo_sp_format', formats.spreken)}
          {tab === 'knm' && t('demo_knm_format', { minutes: knmMinutes })}
          {tab === 'ona' && t('demo_ona_final')}
        </p>
      </div>

      <div className="g-hb-foot">
        <button type="button" className="g-hb-back" disabled={i === 0} onClick={() => go(i - 1)}>
          {t('demo_back')}
        </button>
        <span className="g-hb-steps" aria-hidden="true">
          {TABS.map((x, n) => <i key={x.id} data-on={n === i || undefined} />)}
        </span>
        <button type="button" className="g-hb-next" disabled={i === TABS.length - 1} onClick={() => go(i + 1)}>
          {t('demo_next')}
          <ArrowRight className="rtl-flip" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Feedback({ right, explanation }: { right: boolean; explanation: string }) {
  const t = useTranslations('home_b');
  return (
    <div className={`g-quiz-fb ${right ? 'g-ok' : 'g-nok'}`} role="status" dir="auto">
      {right ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
      <span>
        {right ? (
          <>
            <b>{t('demo_explain')}</b>
            <span dir="ltr" lang="nl" className="block">{explanation}</span>
          </>
        ) : (
          t('demo_wrong')
        )}
      </span>
    </div>
  );
}

function Mcq({ item, withStimulus }: { item: DemoMcq; withStimulus?: boolean }) {
  const t = useTranslations('home_b');
  const [pick, setPick] = useState<string | null>(null);
  const right = pick === item.correct;
  const stateFor = (k: string): AnswerState => {
    if (!pick) return 'idle';
    if (k === item.correct) return right ? 'correct' : 'idle';
    return k === pick ? 'wrong' : 'dim';
  };

  return (
    <div className={withStimulus ? 'g-hb-split' : 'g-hb-single'} dir="ltr">
      {withStimulus && (
        <div className="g-hb-stim" dir="ltr" lang="nl">
          <p className="g-hb-intro">{item.intro}</p>
          <div className="g-hb-paper" dangerouslySetInnerHTML={{ __html: item.stimulusHtml ?? '' }} />
        </div>
      )}
      <div>
        <div className="g-hb-q" dir="ltr" lang="nl">
          <p>{item.question}</p>
        </div>
        <div dir="ltr" lang="nl">
          <AnswerGroup label={t('demo_answers_aria')}>
            {item.options.map(o => (
              <AnswerRow
                key={o.key}
                letter={o.key}
                state={stateFor(o.key)}
                reward={right && o.key === item.correct}
                correctLabel={t('demo_good')}
                onSelect={() => setPick(o.key)}
              >
                {o.text}
              </AnswerRow>
            ))}
          </AnswerGroup>
        </div>
        {pick && <Feedback right={right} explanation={item.explanation} />}
      </div>
    </div>
  );
}

/* Vaste staafhoogtes (px): een golfvorm die er als spraak uitziet, en bij elke render hetzelfde. */
const WAVE = [8, 14, 22, 12, 28, 18, 34, 16, 24, 30, 12, 20, 36, 22, 14, 26, 32, 18, 10, 24, 30, 16, 22, 34, 20, 12, 28, 18, 26, 14, 20, 30, 16, 10, 22, 14, 8];

function Listening({ item }: { item: DemoListening }) {
  const t = useTranslations('home_b');
  const audio = useRef<HTMLAudioElement>(null);
  const tiles = useRef<Record<string, HTMLButtonElement | null>>({});
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const right = pick === item.correct;
  const lines = useMemo(
    () => item.script.split('\n').map(l => l.match(/^([A-Z]):\s*(.*)$/)).filter(Boolean).map(m => ({ who: item.speakers[m![1]] ?? m![1], text: m![2] })),
    [item.script, item.speakers],
  );

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const choose = (k: string) => {
    setPick(k);
    if (k !== item.correct) shake(tiles.current[k]);
  };

  const played = Math.round(progress * WAVE.length);
  const [intro, ...instruction] = item.intro.split('\n');

  return (
    <div className="g-hb-split" dir="ltr">
      <div lang="nl">
        <p className="g-hb-intro g-hb-intro-mono">{instruction.join(' ')}</p>
        <div className="g-hb-player">
          <div className="g-hb-player-row">
            <button
              type="button"
              className="g-hb-play"
              onClick={toggle}
              aria-label={playing ? t('demo_lu_pause') : t('demo_lu_play')}
            >
              {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </button>
            <span className="g-hb-wave" aria-hidden="true">
              {WAVE.map((h, n) => <i key={n} style={{ height: h }} data-on={n < played || undefined} />)}
            </span>
          </div>
          <b className="g-hb-player-t">{intro}</b>
          <span className="g-hb-player-s" dir="auto" lang="">{t('demo_lu_voices')}</span>
          <audio
            ref={audio}
            src={item.audioSrc}
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); setProgress(1); }}
            onTimeUpdate={e => {
              const a = e.currentTarget;
              if (Number.isFinite(a.duration) && a.duration > 0) setProgress(a.currentTime / a.duration);
            }}
          />
        </div>
        {right ? (
          <div className="g-hb-transcript">
            {lines.map((l, n) => (
              <p key={n}><b>{l.who}</b>{l.text}</p>
            ))}
          </div>
        ) : (
          <p className="g-hb-lock" dir="auto"><Lock aria-hidden="true" />{t('demo_lu_lock')}</p>
        )}
      </div>

      <div>
        <div className="g-hb-q" lang="nl">
          <p>{item.question}</p>
        </div>
        <div role="radiogroup" aria-label={t('demo_answers_aria')} className="g-hb-tiles" lang="nl">
          {item.options.map(o => {
            const state = !pick ? 'idle' : o.key === item.correct ? (right ? 'correct' : 'idle') : o.key === pick ? 'wrong' : 'dim';
            const tile = item.tiles[o.key];
            return (
              <button
                key={o.key}
                ref={el => { tiles.current[o.key] = el; }}
                type="button"
                role="radio"
                aria-checked={pick === o.key}
                aria-label={`${o.key}. ${o.text}`}
                className="g-hb-tile"
                data-state={state}
                onClick={() => choose(o.key)}
              >
                <span className="g-hb-tile-badge" aria-hidden="true">
                  {state === 'correct' ? <Check /> : state === 'wrong' ? <X /> : o.key}
                </span>
                <small>{tile.small}</small>
                <b className="g-tnum">{tile.big}</b>
                <span>{o.text}</span>
              </button>
            );
          })}
        </div>
        {pick && <Feedback right={right} explanation={item.explanation} />}
      </div>
    </div>
  );
}

type RecState = 'idle' | 'live' | 'done' | 'nomic';
const BARS = 28;

function Speaking({ item }: { item: DemoSpeaking }) {
  const t = useTranslations('home_b');
  const [state, setState] = useState<RecState>('idle');
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const rec = useRef<WavRecorder | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => {
    if (tick.current) clearInterval(tick.current);
    rec.current?.cancel();
  }, []);

  const stop = async () => {
    if (tick.current) { clearInterval(tick.current); tick.current = null; }
    const r = rec.current;
    rec.current = null;
    setLevels(Array(BARS).fill(0));
    if (!r?.active) return;
    try {
      const out = await r.stop();
      setBlob(out.blob);
      setState('done');
    } catch {
      setState('nomic');
    }
    setShowAnswer(true);
  };

  const start = async () => {
    setBlob(null);
    if (!canRecordWav()) { setState('nomic'); setShowAnswer(true); return; }
    const r = new WavRecorder();
    try {
      await r.start({
        onPcm: frame => {
          let sum = 0;
          for (let n = 0; n < frame.length; n++) sum += frame[n] * frame[n];
          const lv = Math.min(1, Math.sqrt(sum / frame.length) * 5);
          setLevels(prev => [...prev.slice(1), lv]);
        },
      });
    } catch {
      r.cancel();
      setState('nomic');
      setShowAnswer(true);
      return;
    }
    rec.current = r;
    setElapsed(0);
    setState('live');
    let s = 0;
    tick.current = setInterval(() => {
      s += 1;
      setElapsed(s);
      if (s >= item.limit) void stop();
    }, 1000);
  };

  const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="g-hb-split" dir="ltr">
      <div lang="nl">
        <p className="g-hb-intro g-hb-intro-mono">{t('demo_sp_part')}</p>
        <div className="g-hb-says">
          <span className="g-hb-says-who" aria-hidden="true">{item.speaker.charAt(0)}</span>
          <div>
            <small>{item.speaker}</small>
            <p>{item.says}</p>
          </div>
        </div>
        <p className="g-hb-task">{item.prompt}</p>
      </div>

      <div>
        <div className="g-hb-rec" data-state={state}>
          <div className="g-hb-rec-row">
            {state === 'live' ? (
              <button type="button" className="g-hb-mic is-live" onClick={() => void stop()} aria-label={t('demo_sp_stop')}>
                <Square aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="g-hb-mic" onClick={() => void start()} aria-label={state === 'done' ? t('demo_sp_again') : t('demo_sp_record')}>
                {state === 'done' ? <RotateCcw aria-hidden="true" /> : <Mic aria-hidden="true" />}
              </button>
            )}
            <span className="g-hb-meter" aria-hidden="true">
              {levels.map((v, n) => <i key={n} style={{ transform: `scaleY(${Math.max(0.14, v).toFixed(2)})` }} />)}
            </span>
            <span className="g-hb-rec-t g-tnum">{clock(elapsed)}<span className="g-hb-rec-max"> / {clock(item.limit)}</span></span>
          </div>
          <p className="g-hb-rec-label" aria-live="polite" dir="auto">
            {state === 'idle' && t('demo_sp_record')}
            {state === 'live' && <><span className="g-hb-rec-dot" aria-hidden="true" />{t('demo_sp_live')}</>}
            {state === 'done' && t('demo_sp_done')}
            {state === 'nomic' && t('demo_sp_nomic')}
          </p>
          {url && state === 'done' && <Playback src={url} />}
        </div>

        {showAnswer ? (
          <div className="g-hb-model">
            <small>{t('demo_sp_example')}</small>
            <p lang="nl" dir="ltr">{item.answer}</p>
          </div>
        ) : (
          <button type="button" className="g-hb-textlink" onClick={() => setShowAnswer(true)}>
            {t('demo_sp_show')}
          </button>
        )}
        <p className="g-hb-note">{t('demo_sp_private')}</p>
      </div>
    </div>
  );
}

function Playback({ src }: { src: string }) {
  const t = useTranslations('home_b');
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  return (
    <div className="g-hb-pb">
      <button
        type="button"
        className="g-hb-pb-btn"
        onClick={() => { const a = ref.current; if (!a) return; if (a.paused) void a.play(); else a.pause(); }}
      >
        {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {t('demo_sp_listen')}
      </button>
      <span className="g-hb-pb-bar" aria-hidden="true"><i style={{ transform: `scaleX(${pct})` }} /></span>
      <audio
        ref={ref}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPct(0); }}
        onTimeUpdate={e => {
          const a = e.currentTarget;
          if (Number.isFinite(a.duration) && a.duration > 0) setPct(a.currentTime / a.duration);
        }}
      />
    </div>
  );
}

const LETTER = 'Beste buurman,\n\nGisteren had u een feest. Het was tot 3 uur ’s nachts erg lawaaiig. Ik kon niet slapen.\n\n';

const POINTS = [
  { label: 'Waarom schrijf je?', test: /feest|lawaai|slapen/i },
  { label: 'Wat wil je dat hij doet?', test: /wilt u|kunt u|zou u|wil graag|volgende keer|voortaan|vraag u/i },
  { label: 'Sluit vriendelijk af.', test: /groet|bedankt|dank u|alvast/i },
];

function Writing() {
  const t = useTranslations('home_b');
  const [text, setText] = useState(LETTER);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const id = useId();

  return (
    <div className="g-hb-split g-hb-split-w">
      <div dir="ltr" lang="nl">
        <p className="g-hb-task">
          Je buurman had een feest. Het was tot 3 uur ’s nachts erg lawaaiig. Schrijf een e-mail aan je buurman. Schrijf over alle punten:
        </p>
        <ul className="g-hb-points">
          {POINTS.map(p => {
            const done = p.test.test(text);
            return (
              <li key={p.label} data-done={done || undefined}>
                <span className="g-hb-tick" aria-hidden="true">{done && <Check />}</span>
                {p.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <div className="g-hb-letter-head">
          <label htmlFor={id}>{t('demo_b1_label')}</label>
          <span className="g-tnum">{words} {t('demo_b1_words')}</span>
        </div>
        <textarea
          id={id}
          dir="ltr"
          lang="nl"
          className="g-hb-letter"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          spellCheck={false}
        />
        <p className="g-hb-note">{t('demo_b1_note')}</p>
      </div>
    </div>
  );
}

function Ona({ cards }: { cards: string[] }) {
  const t = useTranslations('home_b');
  const tOna = useTranslations('ona');
  const [done, setDone] = useState<Set<number>>(() => new Set([0, 1, 2]));
  const toggle = (i: number) =>
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="g-hb-single">
      <div className="g-hb-ona-head">
        <b className="g-tnum">{t('demo_ona_progress', { done: done.size, total: cards.length })}</b>
        <span>{t('demo_ona_hint')}</span>
      </div>
      <div className="g-hb-ona-bar" aria-hidden="true">
        {cards.map((_, i) => <i key={i} data-on={done.has(i) || undefined} />)}
      </div>
      <ul className="g-hb-ona" dir="ltr" lang="nl">
        {cards.map((title, i) => (
          <li key={title}>
            <button type="button" aria-pressed={done.has(i)} onClick={() => toggle(i)}>
              <span className="g-hb-tick" aria-hidden="true">{done.has(i) && <Check />}</span>
              <span className="g-tnum g-hb-ona-n">{i + 1}</span>
              {title}
            </button>
          </li>
        ))}
      </ul>
      <p className="g-hb-note">{tOna('draft_notice')}</p>
    </div>
  );
}
