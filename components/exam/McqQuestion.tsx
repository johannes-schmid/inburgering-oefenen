'use client';

import { Check, X } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import type { OptionItem, QuestionItem } from '@/lib/exam-content';

type Props = {
  question: QuestionItem;
  questionNumber: number;
  total: number;
  /** id of the chosen option, or null while unanswered. */
  chosenId: number | null;
  onSelect: (option: OptionItem) => void;
  /** Reveal correct/incorrect and the explanation immediately (practice mode). */
  showFeedback: boolean;
  sectionName?: string;
};

/**
 * One multiple-choice question: 3 or 4 options, laid out as text rows, single images, or a
 * grid of thumbnails per option (`option_layout`). `label` and `is_correct` come off the
 * option row, so nothing here assumes A/B/C or that the answer is a letter.
 */
export default function McqQuestion({
  question: q,
  questionNumber,
  total,
  chosenId,
  onSelect,
  showFeedback,
  sectionName,
}: Props) {
  const answered = chosenId !== null;
  const correct = q.options.find(o => o.is_correct) ?? null;
  const gotItRight = answered && correct?.id === chosenId;
  const isGrid = q.option_layout !== 'text';

  return (
    <div
      className="rounded-2xl bg-surface-container-lowest"
      style={{ padding: '1.25rem 1.375rem', boxShadow: 'var(--shadow-card-md)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">
          Vraag {questionNumber} van {total}
        </span>
        {sectionName && (
          <span
            className="text-[0.65rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: '#fcecdd', color: '#a24000' }}
          >
            {sectionName}
          </span>
        )}
      </div>

      <h2
        className="font-headline font-bold text-on-surface mb-4"
        style={{ fontSize: '1.15rem', lineHeight: 1.35, letterSpacing: '-0.01em', textWrap: 'balance' }}
      >
        {q.prompt}
      </h2>

      {/* On Luisteren the question itself is spoken — a second player, independent of the
          stimulus fragment above it. */}
      {q.prompt_audio_url && (
        <div className="mb-4">
          <AudioPlayer src={q.prompt_audio_url} label="Vraag beluisteren" compact />
        </div>
      )}

      {q.image_url && (
        <figure className="m-0 mb-4 rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.image_url} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </figure>
      )}

      <div
        className={isGrid ? 'grid gap-3' : 'flex flex-col gap-2.5'}
        style={isGrid ? { gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' } : undefined}
        role="radiogroup"
        aria-label={q.prompt}
      >
        {q.options.map(o => (
          <OptionButton
            key={o.id}
            option={o}
            layout={q.option_layout}
            answered={answered}
            chosen={o.id === chosenId}
            isCorrect={o.is_correct}
            reveal={answered && showFeedback}
            onSelect={() => onSelect(o)}
          />
        ))}
      </div>

      {answered && showFeedback && (
        <div
          className="mt-3.5 flex gap-2.5 px-4 py-3 rounded-xl text-sm leading-relaxed"
          style={
            gotItRight
              ? { background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.22)' }
              : { background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }
          }
        >
          <span className="flex-shrink-0" style={{ marginTop: 2, color: gotItRight ? '#16a34a' : '#dc2626' }}>
            {gotItRight ? <Check size={16} strokeWidth={3} aria-hidden /> : <X size={16} strokeWidth={3} aria-hidden />}
          </span>
          <span className="text-on-surface-variant">
            <strong style={{ color: gotItRight ? '#15803d' : '#b91c1c' }}>
              {gotItRight ? 'Goed. ' : `Niet goed — het juiste antwoord is ${correct?.label ?? '—'}. `}
            </strong>
            {q.explanation}
          </span>
        </div>
      )}
    </div>
  );
}

function OptionButton({
  option: o,
  layout,
  answered,
  chosen,
  isCorrect,
  reveal,
  onSelect,
}: {
  option: OptionItem;
  layout: 'text' | 'image' | 'image_grid';
  answered: boolean;
  chosen: boolean;
  isCorrect: boolean;
  reveal: boolean;
  onSelect: () => void;
}) {
  let surface: React.CSSProperties = {
    background: 'var(--color-surface-container)',
    border: '2px solid transparent',
  };
  let badge: React.CSSProperties = { background: '#e3e6ea', color: '#434651' };

  if (chosen && !reveal) {
    surface = { background: '#fff6ec', border: '2px solid #fe762c' };
    badge = { background: '#a24000', color: '#fff' };
  }
  if (reveal && isCorrect) {
    surface = { background: 'rgba(22,163,74,0.08)', border: '2px solid rgba(22,163,74,0.45)' };
    badge = { background: 'rgba(22,163,74,0.16)', color: '#15803d' };
  } else if (reveal && chosen) {
    surface = { background: 'rgba(220,38,38,0.06)', border: '2px solid rgba(220,38,38,0.38)' };
    badge = { background: 'rgba(220,38,38,0.14)', color: '#b91c1c' };
  }

  const hasImages = o.image_urls.length > 0;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      data-testid="answer-btn"
      disabled={answered}
      onClick={onSelect}
      className={`exam-option w-full rounded-xl text-left ${
        layout === 'text' ? 'flex items-start gap-3.5 px-4 py-3.5' : 'flex flex-col gap-2.5 p-3'
      }`}
      style={{ ...surface, cursor: answered ? 'default' : 'pointer', font: 'inherit' }}
    >
      <span
        className="inline-flex items-center justify-center rounded-lg flex-shrink-0 text-xs font-bold"
        style={{ width: 27, height: 27, ...badge }}
      >
        {o.label}
      </span>

      {hasImages && (
        <span
          className={o.image_urls.length > 1 ? 'grid gap-1.5 w-full' : 'block w-full'}
          style={o.image_urls.length > 1 ? { gridTemplateColumns: 'repeat(3, 1fr)' } : undefined}
        >
          {o.image_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={o.image_alt ?? ''}
              className="rounded-lg"
              style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
            />
          ))}
        </span>
      )}

      {o.body && (
        <span
          className={`text-sm leading-relaxed text-on-surface ${layout === 'text' ? 'flex-1' : ''}`}
        >
          {o.body}
        </span>
      )}

      <style>{`
        .exam-option {
          transition: transform .18s cubic-bezier(0.22,1,0.36,1),
                      background-color .18s ease, border-color .18s ease;
        }
        .exam-option:not(:disabled):hover { transform: translateY(-2px); }
        .exam-option:not(:disabled):active { transform: translateY(0) scale(0.99); }
        .exam-option:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .exam-option { transition: none; } }
      `}</style>
    </button>
  );
}
