'use client';

import { useState } from 'react';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@/lib/analytics';
import type { Question } from '@/data/oefenvragen-topics';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type QuizStrings = {
  question: string;
  next: string;
  finish: string;
  scoreTitle: string;
  scoreDesc: string;
  retry: string;
  proef: string;
};

type Props = {
  questions: Question[];
  topicTotal: number;
  strings: QuizStrings;
  slug: string;
};

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export default function QuizWidget({ questions, topicTotal, strings, slug }: Props) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const q = questions[idx];

  function selectAnswer(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === q.correct;
    if (correct) setScore(s => s + 1);
    sendGAEvent('event', 'topic_quiz_answered', { topic: slug, correct });
    track('question_answered', { source: 'topic', exam_number: null, topic: slug, is_correct: correct });
  }

  function next() {
    if (idx + 1 >= total) {
      setDone(true);
      sendGAEvent('event', 'topic_quiz_finished', { topic: slug, score, total, pct: total > 0 ? Math.round((score / total) * 100) : 0 });
    } else {
      setIdx(i => i + 1);
      setSelected(null);
    }
  }

  function restart() {
    setIdx(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  }

  if (done) {
    const finalPct = Math.round((score / total) * 100);
    const color = finalPct >= 80 ? '#4CAF7A' : finalPct >= 60 ? '#E8A03A' : '#E85A3A';
    const msg = finalPct >= 80 ? 'Uitstekend! Je beheerst dit onderwerp goed.' : finalPct >= 60 ? 'Goed gedaan! Oefen nog een keer voor meer zekerheid.' : 'Herhaal dit onderwerp en probeer het nog eens.';

    return (
      <div className="results-card">
        <div className="score-ring" style={{ '--pct': finalPct + '%' } as React.CSSProperties}>
          <div className="score-inner">
            <span className="font-headline font-bold" style={{ fontSize: '1.2rem', color }}>{finalPct}%</span>
          </div>
        </div>
        <p className="font-headline font-bold text-on-surface mb-2" style={{ fontSize: '1.6rem' }}>{strings.scoreTitle}</p>
        <p className="text-on-surface-variant text-base mb-1"
          dangerouslySetInnerHTML={{
            __html: interpolate(strings.scoreDesc, { score, total })
              .replace(String(score), `<strong class="text-on-surface font-bold" style="font-size:1.4rem">${score}</strong>`)
              .replace(String(total), `<strong class="text-on-surface font-bold" style="font-size:1.4rem">${total}</strong>`),
          }}
        />
        <p className="text-on-surface-variant text-sm mt-2 mb-6">{msg}</p>

        <div className="mb-6 rounded-2xl p-5 text-left" style={{ background: 'linear-gradient(135deg,rgba(254,118,44,0.09),rgba(162,64,0,0.04))', border: '1.5px solid rgba(254,118,44,0.28)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#a24000' }}>Meer oefenen?</p>
          <p className="font-headline font-bold text-on-surface mb-2" style={{ fontSize: '1.05rem' }}>
            Er wachten nog <span style={{ color: '#a24000' }}>{topicTotal} vragen</span> over dit onderwerp
          </p>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">Meld je gratis aan voor het studieportaal en oefen alle gevalideerde KNM-vragen met directe feedback van een gecertificeerde NT2-docent.</p>
          <a href="/register" className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'text-sm px-5 py-3')}>
            Gratis aanmelden
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-7">
          <button onClick={restart} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors">
            {strings.retry}
          </button>
          <a href="/oefenvragen" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors">
            Ander onderwerp
          </a>
          <a href="/dashboard" className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'text-sm px-5 py-2.5')}>
            {strings.proef}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Gecertificeerde docent</p>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Deze vragen zijn samengesteld door Marieke Schipper, gecertificeerde NT2-docent.{' '}
            <a href="/docent" className="text-secondary underline hover:opacity-80">Lees meer over de docent →</a>
          </p>
        </div>
      </div>
    );
  }

  const progress = (idx / total) * 100;

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {interpolate(strings.question, { n: idx + 1, total })}
        </span>
        <span className="text-xs text-on-surface-variant">Score: {score} / {total}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: progress + '%' }} />
      </div>

      <div className="question-card">
        <p className="q-label">{interpolate(strings.question, { n: idx + 1, total })}</p>
        <p className="q-text">{q.question}</p>

        <div className="options">
          {(['A', 'B', 'C'] as const).map((lbl) => {
            const text = lbl === 'A' ? q.optionA : lbl === 'B' ? q.optionB : q.optionC;
            let cls = 'opt-btn';
            if (selected !== null) {
              if (lbl === q.correct) cls += ' correct';
              else if (lbl === selected) cls += ' incorrect';
            }
            return (
              <button key={lbl} className={cls} disabled={selected !== null} onClick={() => selectAnswer(lbl)}>
                <span className="opt-label">{lbl}</span>
                <span className="opt-text">{text}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className={`feedback ${selected === q.correct ? 'correct' : 'incorrect'}`} style={{ display: 'block' }}>
            {selected === q.correct
              ? <><strong>✓ Correct!</strong> {q.explanation}</>
              : <><strong>✗ Niet correct.</strong> Het juiste antwoord is <strong>{q.correct}</strong>. {q.explanation}</>
            }
          </div>
        )}

        {selected !== null && (
          <div className="next-btn-wrap" style={{ display: 'block' }}>
            <button
              className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}
              onClick={next}
            >
              {idx + 1 >= total ? strings.finish : strings.next}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
