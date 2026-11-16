'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Lock, Pause, Play, X } from 'lucide-react';
import AnswerRow, { AnswerGroup, type AnswerState } from '@/components/glas/AnswerRow';

/* Eén voorbeeldvraag die echt werkt: kies een antwoord en zie meteen goed of fout, met de uitleg.
   Lezen toont de tekst, Luisteren het fragment; het transcript komt pas na een goed antwoord, want
   eerder zou het de vraag weggeven. De opgave zelf is Nederlands in elke taal (`lang="nl"`). */

export type ExampleItem = {
  intro: string;
  stimulusHtml?: string;
  audioSrc?: string;
  script?: string;
  speakers?: Record<string, string>;
  question: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation: string;
};

const WAVE = [8, 14, 22, 12, 28, 18, 34, 16, 24, 30, 12, 20, 36, 22, 14, 26, 32, 18, 10, 24, 30, 16, 22, 34, 20, 12, 28, 18, 26, 14, 20, 30, 16, 10, 22, 14, 8];

export default function ExampleQuestion({ item }: { item: ExampleItem }) {
  const t = useTranslations('voorbeeldvragen');
  const [pick, setPick] = useState<string | null>(null);
  const right = pick === item.correct;
  const stateFor = (k: string): AnswerState => {
    if (!pick) return 'idle';
    if (k === item.correct) return right ? 'correct' : 'idle';
    return k === pick ? 'wrong' : 'dim';
  };

  return (
    <div className="g-hb-split" dir="ltr">
      <div lang="nl">
        <p className="g-hb-intro">{item.intro}</p>
        {item.audioSrc ? (
          <Listening item={item} unlocked={right} />
        ) : (
          <div className="g-hb-paper" dangerouslySetInnerHTML={{ __html: item.stimulusHtml ?? '' }} />
        )}
      </div>
      <div>
        <div className="g-hb-q" lang="nl">
          <p>{item.question}</p>
        </div>
        <div lang="nl">
          <AnswerGroup label={t('answers_aria')}>
            {item.options.map(o => (
              <AnswerRow
                key={o.key}
                letter={o.key}
                state={stateFor(o.key)}
                reward={right && o.key === item.correct}
                correctLabel={t('good')}
                onSelect={() => setPick(o.key)}
              >
                {o.text}
              </AnswerRow>
            ))}
          </AnswerGroup>
        </div>
        {pick && (
          <div className={`g-quiz-fb ${right ? 'g-ok' : 'g-nok'}`} role="status" dir="auto">
            {right ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
            <span>
              {right ? (
                <>
                  <b>{t('explain')}</b>
                  <span dir="ltr" lang="nl" className="block">{item.explanation}</span>
                </>
              ) : (
                t('wrong')
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Listening({ item, unlocked }: { item: ExampleItem; unlocked: boolean }) {
  const t = useTranslations('voorbeeldvragen');
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const lines = useMemo(
    () => (item.script ?? '').split('\n').map(l => l.match(/^([A-Z]):\s*(.*)$/)).filter(Boolean)
      .map(m => ({ who: item.speakers?.[m![1]] ?? m![1], text: m![2] })),
    [item.script, item.speakers],
  );
  const played = Math.round(progress * WAVE.length);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  return (
    <>
      <div className="g-hb-player">
        <div className="g-hb-player-row">
          <button type="button" className="g-hb-play" onClick={toggle} aria-label={playing ? t('pause') : t('play')}>
            {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <span className="g-hb-wave" aria-hidden="true">
            {WAVE.map((h, n) => <i key={n} style={{ height: h }} data-on={n < played || undefined} />)}
          </span>
        </div>
        <span className="g-hb-player-s" dir="auto" lang="">{t('voices')}</span>
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
      {unlocked ? (
        <div className="g-hb-transcript">
          {lines.map((l, n) => <p key={n}><b>{l.who}</b>{l.text}</p>)}
        </div>
      ) : (
        <p className="g-hb-lock" dir="auto"><Lock aria-hidden="true" />{t('lock')}</p>
      )}
    </>
  );
}
