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
      /* §7.2: the floating quiz card — the ambient shadow (32px blur, no offset, 6%), not the
         heavier legacy card shadow. It should read as a soft glow of light, not as weight. */
      style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-ambient)' }}
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
          /* No 1px borders and no green (§2, §7.3). "Right" is the clay accent — the same colour
             that means "this is the thing to look at" everywhere else — and "wrong" is the
             `error` token, which is the one red the system has. The Check/X icon carries the
             meaning for anyone who cannot separate the two hues. */
          style={
            gotItRight
              ? { background: 'rgba(254,118,44,0.12)' }
              : { background: 'rgba(186,26,26,0.07)' }
          }
        >
          <span className="flex-shrink-0" style={{ marginTop: 2, color: gotItRight ? '#a24000' : '#ba1a1a' }}>
            {gotItRight ? <Check size={16} strokeWidth={3} aria-hidden /> : <X size={16} strokeWidth={3} aria-hidden />}
          </span>
          <span className="text-on-surface-variant">
            <strong style={{ color: gotItRight ? '#a24000' : '#ba1a1a' }}>
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
  /**
   * §7.2 / §5: an answer option is a `surface-container-low` **fill**, and every state is
   * expressed as an *inset* box-shadow rather than a border — that is the no-line rule applied
   * where it matters most, because a 2px border on a selected option also reflows the text inside
   * it by 2px on every click. The greens are gone: "correct" is the clay accent and "wrong" is the
   * one `error` token the system has, and the Check/X icon is what actually carries the meaning.
   */
  let surface: React.CSSProperties = { background: 'var(--color-surface-container-low)' };
  let badge: React.CSSProperties = { background: 'var(--color-surface-container-high)', color: '#434651' };

  if (chosen && !reveal) {
    surface = { background: 'rgba(0,43,109,0.05)', boxShadow: 'var(--ring-selected)' };
    badge = { background: '#002b6d', color: '#fff' };
  }
  if (reveal && isCorrect) {
    surface = { background: 'rgba(254,118,44,0.12)', boxShadow: 'inset 0 0 0 2px rgba(254,118,44,0.55)' };
    badge = { background: '#fe762c', color: '#5f2200' };
  } else if (reveal && chosen) {
    surface = { background: 'rgba(186,26,26,0.07)', boxShadow: 'inset 0 0 0 2px rgba(186,26,26,0.35)' };
    badge = { background: 'rgba(186,26,26,0.14)', color: '#ba1a1a' };
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
                      background-color .18s ease, box-shadow .18s ease;
        }
        .exam-option:not(:disabled):hover { transform: translateY(-2px); }
        .exam-option:not(:disabled):active { transform: translateY(0) scale(0.99); }
        .exam-option:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .exam-option { transition: none; } }
      `}</style>
    </button>
  );
}
