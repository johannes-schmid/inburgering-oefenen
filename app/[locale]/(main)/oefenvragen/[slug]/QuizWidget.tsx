'use client';

import { useState } from 'react';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@/lib/analytics';
import { playCorrectChime } from '@/lib/answer-chime';
import WordPass from '@/components/exam/WordPass';
import type { Question } from '@/data/oefenvragen-topics';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import AnswerRow, { AnswerGroup, type AnswerState } from '@/components/glas/AnswerRow';
import ScoreRing from '@/components/glas/ScoreRing';
import { Link } from '@/i18n/navigation';
import { glasButton } from '@/components/glas/Button';

const LETTERS = ['A', 'B', 'C'] as const;
type Letter = (typeof LETTERS)[number];

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
    if (correct) {
      playCorrectChime();
      setScore(s => s + 1);
    }
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
    const msg = finalPct >= 80 ? 'Uitstekend! Je beheerst dit onderwerp goed.' : finalPct >= 60 ? 'Goed gedaan! Oefen nog een keer voor meer zekerheid.' : 'Herhaal dit onderwerp en probeer het nog eens.';

    return (
      <div className="g-quiz">
        <div className="flex flex-col items-center text-center">
          <ScoreRing correct={score} total={total} size={150} label={interpolate(strings.scoreDesc, { score, total })}>
            <b className="g-head g-tnum text-[30px] font-extrabold tracking-[-0.04em]">{finalPct}%</b>
          </ScoreRing>
          <h2 className="g-head g-head-2 mt-5">{strings.scoreTitle}</h2>
          <p className="m-0 mt-2 text-ink-2">
            {strings.scoreDesc.split(/(\{score\}|\{total\})/).map((part, i) =>
              part === '{score}' ? <b key={i} className="text-ink g-tnum">{score}</b>
                : part === '{total}' ? <b key={i} className="text-ink g-tnum">{total}</b>
                : part,
            )}
          </p>
          <p className="m-0 mt-1 text-sm text-ink-2">{msg}</p>
        </div>

        <div className="mt-7 rounded-g-lg bg-klei-tint p-5">
          <p className="m-0 g-head text-[1.0625rem] font-bold text-ink">
            Er wachten nog <span className="text-klei">{topicTotal} vragen</span> over dit onderwerp
          </p>
          <p className="m-0 mt-2 text-sm leading-relaxed text-ink-2">Meld je gratis aan voor het studieportaal en oefen alle gevalideerde KNM-vragen met directe feedback van een gecertificeerde NT2-docent.</p>
          <Link href="/register" className={glasButton({ variant: 'navy', size: 'sm', className: 'mt-4' })}>
            Gratis aanmelden
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center mt-6">
          <button type="button" onClick={restart} className={glasButton({ variant: 'ghost' })}>
            <RotateCcw aria-hidden="true" />
            {strings.retry}
          </button>
          <Link href="/oefenvragen" className={glasButton({ variant: 'ghost' })}>Ander onderwerp</Link>
          <Link href="/dashboard" className={glasButton({ variant: 'oranje' })}>
            {strings.proef}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 rounded-g-lg bg-mist p-5 flex gap-3.5 items-start">
          <img src="/images/amber-van-der-zalm-264.webp" alt="" width={40} height={40} className="size-10 rounded-g-sm object-cover object-top shrink-0" />
          <p className="m-0 text-sm leading-relaxed text-ink-2">
            Deze vragen zijn samengesteld door Amber van der Zalm, gecertificeerde NT2-docent.{' '}
            <Link href="/docent" className="g-ilink inline-flex items-center gap-1">
              Lees meer over de docent
              <ArrowRight className="size-3.5 rtl-flip" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const label = interpolate(strings.question, { n: idx + 1, total });
  const answered = selected !== null;
  const right = answered && selected === q.correct;

  const stateFor = (lbl: Letter): AnswerState => {
    if (!answered) return 'idle';
    if (lbl === q.correct) return 'correct';
    if (lbl === selected) return 'wrong';
    return 'dim';
  };

  return (
    <div className="g-quiz">
      <div className="flex items-center justify-between gap-3">
        <span className="g-mono">{label}</span>
        <span className="g-mono g-tnum">Score: {score} / {total}</span>
      </div>
      {/* Eén segment per vraag: gemaakt = navy. Een rij vakjes, geen balk die in breedte groeit. */}
      <div className="g-quiz-bar" aria-hidden="true">
        {questions.map((_, i) => <i key={i} className={i < idx + (answered ? 1 : 0) ? 'g-on' : undefined} />)}
      </div>

      <p className="g-quiz-q">{q.question}</p>

      <AnswerGroup label={label}>
        {LETTERS.map(lbl => {
          const text = lbl === 'A' ? q.optionA : lbl === 'B' ? q.optionB : q.optionC;
          return (
            <AnswerRow
              key={lbl}
              letter={lbl}
              state={stateFor(lbl)}
              reward={answered && right && lbl === q.correct}
              correctLabel="Juist"
              wrongLabel="Jouw antwoord"
              onSelect={() => selectAnswer(lbl)}
            >
              <WordPass text={text} active={answered && lbl === q.correct} />
            </AnswerRow>
          );
        })}
      </AnswerGroup>

      {answered && (
        <div className={`g-quiz-fb ${right ? 'g-ok' : 'g-nok'}`} role="status">
          {right ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
          <span>
            {right
              ? <><b>Correct.</b> {q.explanation}</>
              : <><b>Niet correct.</b> Het juiste antwoord is <b>{q.correct}</b>. {q.explanation}</>}
          </span>
        </div>
      )}

      {answered && (
        <button type="button" className={glasButton({ variant: 'navy', className: 'mt-5' })} onClick={next}>
          {idx + 1 >= total ? strings.finish : strings.next}
          <ArrowRight className="rtl-flip" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
