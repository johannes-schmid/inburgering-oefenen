'use client';

import { Check, X } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import WordPass from './WordPass';
import { useReadAloud } from '@/components/proefexamen/useReadAloud';
import { useAudioEnabled } from '@/lib/audio-pref';
import { playCorrectChime } from '@/lib/answer-chime';
import { EqBars, HighlightedText, ReadAloudPill } from './ReadAloud';
import './glas-player.css';
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
  /**
   * A2 Luisteren: lees pas voor als dit waar wordt — na het fragment, zoals DUO. Weglaten is de
   * KNM-stand, waar het voorlezen meteen begint.
   */
  readAloudArmed?: boolean;
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
  readAloudArmed = true,
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
  const { reading, activeSeg, activeWord, toggle } = useReadAloud(segments, audioEnabled && readAloudArmed);
  const hasReadAloud = segments.some(s => s.url) && readAloudArmed;

  /* Glas §10: de vraag staat altijd op wit; de antwoorden zijn rijen (variant A, §G5). */
  return (
    <div className="g-xbody">
      <div className="g-xqhead">
        <span className="g-mono g-tnum">Vraag {questionNumber} van {total}</span>
        {sectionName && <span className="g-xbdg">{sectionName}</span>}
        {hasReadAloud && (
          <span style={{ marginInlineStart: 'auto' }}>
            <ReadAloudPill reading={reading} onToggle={toggle} readLabel="Lees voor" stopLabel="Stop" />
          </span>
        )}
      </div>

      <h2 className="g-xqtitle">
        {hasReadAloud
          ? <HighlightedText text={q.prompt} reading={reading} activeSeg={activeSeg} thisSeg={0} activeWord={activeWord} />
          : q.prompt}
      </h2>

      {/* On Luisteren the question itself is spoken — a second player, independent of the
          stimulus fragment above it. Hidden where read-aloud is on: it is the same recording
          the sequence already plays, and two controls for one clip invite starting both. */}
      {q.prompt_audio_url && !readAloud && (
        <div style={{ marginBottom: 16 }}>
          <AudioPlayer src={q.prompt_audio_url} label="Vraag beluisteren" compact />
        </div>
      )}

      {q.image_url && (
        <figure className="g-xfig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.image_url} alt="" />
        </figure>
      )}

      <div className={isGrid ? 'g-xans-grid' : 'g-answers'} role="radiogroup" aria-label={q.prompt}>
        {q.options.map((o, i) => (
          <OptionButton
            key={o.id}
            option={o}
            layout={q.option_layout}
            answered={answered}
            chosen={o.id === chosenId}
            isCorrect={o.is_correct}
            reveal={answered && showFeedback}
            onSelect={() => {
              /* Practice only: in a real sitting nothing is revealed, so there is nothing to
                 reward yet — the score arrives at the end. */
              if (showFeedback && o.is_correct) playCorrectChime();
              onSelect(o);
            }}
            /* Segment 0 is the prompt, so this option is segment i + 1. */
            beingRead={hasReadAloud && reading && activeSeg === i + 1}
            /* Dropped once the verdict is revealed: a word-mark inside a verdict row overpaints
               it. In an exam nothing is revealed, so the reading keeps marking past a click. */
            highlight={hasReadAloud && !(answered && showFeedback) ? { activeSeg, activeWord, thisSeg: i + 1, reading } : undefined}
          />
        ))}
      </div>

      {answered && showFeedback && (
        <div className={`g-xverdict answer-verdict ${gotItRight ? 'g-xverdict-ok' : 'g-xverdict-nok'}`}>
          {gotItRight ? <Check strokeWidth={3} aria-hidden /> : <X strokeWidth={3} aria-hidden />}
          <span>
            <b>{gotItRight ? 'Goed. ' : `Niet goed — het juiste antwoord is ${correct?.label ?? '—'}. `}</b>
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
   * De `g-ans`-rij van de kit (glas.html §07), maar als eigen knop: een optie kan plaatjes hebben
   * en voorgelezen worden, en dat kent `AnswerRow` niet. Antwoordstand wint altijd van de
   * voorleesstand — een groene "Juist"-rij mag nooit overschilderd worden.
   */
  const state = reveal && isCorrect ? 'ok' : reveal && chosen ? 'nok' : reveal ? 'dim' : null;
  const hasImages = o.image_urls.length > 0;
  const cls = [
    'g-ans',
    layout !== 'text' && 'g-xans-img',
    state === 'ok' && 'g-ans-ok answer-correct',
    state === 'nok' && 'g-ans-nok',
    state === 'dim' && 'g-ans-dim',
    !state && beingRead && !reveal && 'g-xans-reading',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      data-testid="answer-btn"
      disabled={answered}
      onClick={onSelect}
      className={cls}
      style={answered && !state ? { cursor: 'default' } : undefined}
    >
      <span className="g-ans-k" aria-hidden>{o.label}</span>

      {hasImages && (
        <span
          className="g-xans-imgs"
          style={{ gridTemplateColumns: o.image_urls.length > 1 ? 'repeat(3, minmax(0, 1fr))' : '1fr' }}
        >
          {o.image_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={o.image_alt ?? ''} />
          ))}
        </span>
      )}

      {o.body && (
        <span className="g-ans-text">
          {highlight
            ? <HighlightedText text={o.body} reading={highlight.reading} activeSeg={highlight.activeSeg} thisSeg={highlight.thisSeg} activeWord={highlight.activeWord} />
            : <WordPass text={o.body} active={state === 'ok'} />}
        </span>
      )}

      {beingRead && !reveal && <span className="g-xans-eq"><EqBars size={14} /></span>}
      {state === 'ok' && <span className="g-ans-tag"><Check strokeWidth={3} aria-hidden />Juist</span>}
      {state === 'nok' && <span className="g-ans-tag"><X strokeWidth={3} aria-hidden />Jouw antwoord</span>}
    </button>
  );
}
