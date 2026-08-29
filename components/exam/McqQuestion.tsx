'use client';

import { Check, X } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { useReadAloud } from '@/components/proefexamen/useReadAloud';
import { useAudioEnabled } from '@/lib/audio-pref';
import {
  EqBars,
  HighlightedText,
  ReadAloudPill,
  readingBadgeStyle,
  readingOptionStyle,
} from './ReadAloud';
import { OPTION_RATE } from '@/data/free-practice';
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
  /**
   * Read the question and every answer aloud, in sequence, with the spoken word marked.
   *
   * Opt-in per caller and **KNM-only in practice**: it needs `question_options.audio_url`,
   * which is populated for KNM's bank and for nothing else, and auto-reading a Luisteren
   * question would speak over the fragment the item is testing. `ExamShell` therefore passes
   * it on the standalone branch only. Off by default, so Lezen/Luisteren/B1 are untouched.
   */
  readAloud?: boolean;
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
  readAloud = false,
}: Props) {
  const answered = chosenId !== null;
  const correct = q.options.find(o => o.is_correct) ?? null;
  const gotItRight = answered && correct?.id === chosenId;
  const isGrid = q.option_layout !== 'text';

  /**
   * The read-aloud sequence, index-aligned with `[prompt, ...options]` — so `activeSeg === 0` is
   * the question and `activeSeg === i + 1` is option *i*, which is what lets the option being
   * spoken glow. `useReadAloud` keys its autoplay on the segment urls, so advancing to the next
   * question stops the previous clip and starts the new one with nothing wired here.
   *
   * The hook is called unconditionally (rules of hooks) and handed an empty array when the
   * caller has not opted in, which leaves it idle.
   */
  const segments = readAloud
    ? [
        { url: q.prompt_audio_url, text: q.prompt },
        ...q.options.map(o => ({ url: o.audio_url, text: o.body ?? '', rate: OPTION_RATE })),
      ]
    : [];
  const [audioEnabled] = useAudioEnabled();
  const { reading, activeSeg, activeWord, toggle } = useReadAloud(segments, audioEnabled);
  const hasReadAloud = segments.some(s => s.url);

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

      <div className="flex items-start justify-between gap-3 mb-4">
        <h2
          className="font-headline font-bold text-on-surface m-0 flex-1"
          style={{ fontSize: '1.15rem', lineHeight: 1.35, letterSpacing: '-0.01em', textWrap: 'balance' }}
        >
          {hasReadAloud
            ? <HighlightedText text={q.prompt} reading={reading} activeSeg={activeSeg} thisSeg={0} activeWord={activeWord} />
            : q.prompt}
        </h2>
        {hasReadAloud && (
          <div className="flex-shrink-0">
            <ReadAloudPill reading={reading} onToggle={toggle} readLabel="Lees voor" stopLabel="Stop" />
          </div>
        )}
      </div>

      {/* On Luisteren the question itself is spoken — a second player, independent of the
          stimulus fragment above it. Hidden where read-aloud is on: it is the same recording
          the sequence already plays, and two controls for one clip invite starting both. */}
      {q.prompt_audio_url && !hasReadAloud && (
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
        {q.options.map((o, i) => (
          <OptionButton
            key={o.id}
            option={o}
            layout={q.option_layout}
            answered={answered}
            chosen={o.id === chosenId}
            isCorrect={o.is_correct}
            reveal={answered && showFeedback}
            onSelect={() => onSelect(o)}
            /* Segment 0 is the prompt, so this option is segment i + 1. */
            beingRead={hasReadAloud && reading && activeSeg === i + 1}
            /* Dropped once answered: the sequence reads on past the click, and a clay word-mark
               inside a revealed verdict row overpaints it. */
            highlight={hasReadAloud && !answered ? { activeSeg, activeWord, thisSeg: i + 1, reading } : undefined}
          />
        ))}
      </div>

      {answered && showFeedback && (
        <div
          className="mt-3.5 flex gap-2.5 px-4 py-3 rounded-xl text-sm leading-relaxed"
          /* No 1px borders (§2). "Right" is the `correct` green token and "wrong" is the `error`
             token; the Check/X icon carries the meaning for anyone who cannot separate the two
             hues. Owner's decision 2026-08-29 — the clay accent read as a highlight, not a
             verdict. */
          style={
            gotItRight
              ? { background: 'var(--color-correct-container)' }
              : { background: 'rgba(186,26,26,0.07)' }
          }
        >
          <span className="flex-shrink-0" style={{ marginTop: 2, color: gotItRight ? 'var(--color-correct)' : '#ba1a1a' }}>
            {gotItRight ? <Check size={16} strokeWidth={3} aria-hidden /> : <X size={16} strokeWidth={3} aria-hidden />}
          </span>
          <span className="text-on-surface-variant">
            <strong style={{ color: gotItRight ? 'var(--color-on-correct-container)' : '#ba1a1a' }}>
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
  beingRead = false,
  highlight,
}: {
  option: OptionItem;
  layout: 'text' | 'image' | 'image_grid';
  answered: boolean;
  chosen: boolean;
  isCorrect: boolean;
  reveal: boolean;
  onSelect: () => void;
  /** This option is the one currently being read aloud. */
  beingRead?: boolean;
  /** Present only when read-aloud is on: which word of which segment is being spoken. */
  highlight?: { activeSeg: number; activeWord: number; thisSeg: number; reading: boolean };
}) {
  /**
   * §7.2 / §5: an answer option is a `surface-container-low` **fill**, and every state is
   * expressed as an *inset* box-shadow rather than a border — that is the no-line rule applied
   * where it matters most, because a 2px border on a selected option also reflows the text inside
   * it by 2px on every click. "Correct" is the `correct` green token and "wrong" is the one
   * `error` token the system has; the Check/X icon is what actually carries the meaning.
   */
  let surface: React.CSSProperties = { background: 'var(--color-surface-container-low)' };
  let badge: React.CSSProperties = { background: 'var(--color-surface-container-high)', color: '#434651' };

  if (chosen && !reveal) {
    surface = { background: 'rgba(0,43,109,0.05)', boxShadow: 'var(--ring-selected)' };
    badge = { background: '#002b6d', color: '#fff' };
  }
  /* Read-aloud state is applied before the reveal branches below, so **answer state wins**:
     a revealed correct/wrong option keeps its verdict colour even while it is spoken. A
     highlight overpainting a verdict is the one thing this must never do. */
  if (beingRead && !answered) {
    surface = readingOptionStyle();
    badge = readingBadgeStyle();
  }
  if (reveal && isCorrect) {
    surface = { background: 'var(--color-correct-container)', boxShadow: 'inset 0 0 0 2px rgba(14,122,75,0.45)' };
    badge = { background: 'var(--color-correct)', color: '#fff' };
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
          {highlight
            ? <HighlightedText text={o.body} reading={highlight.reading} activeSeg={highlight.activeSeg} thisSeg={highlight.thisSeg} activeWord={highlight.activeWord} />
            : o.body}
        </span>
      )}

      {beingRead && !answered && (
        <span className="flex-shrink-0" style={{ color: '#d94f00' }}><EqBars size={14} /></span>
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
