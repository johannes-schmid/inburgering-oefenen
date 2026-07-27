'use client';

import { useState, useRef } from 'react';
import { useReadAloud } from './useReadAloud';
import { useAudioEnabled } from '@/lib/audio-pref';
import type { KnmQuestion } from '@/data/questions';

/* ── Framed image with error hiding ── */
function ImageFrame({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const prevSrc = useRef(src);
  if (prevSrc.current !== src) {
    prevSrc.current = src;
    if (failed) setFailed(false);
  }
  if (failed) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        width: '100%',
        height: 230,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #e7e9ee',
        boxShadow: '0 6px 18px rgba(28,43,74,0.10)',
        background: 'linear-gradient(150deg,#3a4a7a,#9aa6c4)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </div>
  );
}

/* ── Equalizer bars (synced to @keyframes eq in globals.css) ── */
function EqBars({ size = 15 }: { size?: number }) {
  const barStyle = (delay: string): React.CSSProperties => ({
    width: 3,
    height: size,
    background: 'currentColor',
    borderRadius: 2,
    transformOrigin: 'bottom',
    animation: `eq .9s ease-in-out infinite ${delay}`,
  });
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3, height: size }}>
      <span style={barStyle('0s')} />
      <span style={barStyle('.15s')} />
      <span style={barStyle('.3s')} />
      <span style={barStyle('.45s')} />
    </span>
  );
}

/* ── Word-by-word highlighted text ── */
function HighlightedText({
  text,
  active,
  activeSeg,
  thisSeg,
  activeWord,
}: {
  text: string;
  active: boolean;
  activeSeg: number;
  thisSeg: number;
  activeWord: number;
}) {
  const words = text.split(/(\s+)/);
  let wi = -1;
  return (
    <>
      {words.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
        wi++;
        const wIdx = wi;
        const isHighlighted = active && activeSeg === thisSeg && activeWord === wIdx;
        return (
          <span
            key={i}
            style={isHighlighted ? {
              display: 'inline-block',
              padding: '2px 5px',
              borderRadius: 7,
              background: '#fbe2c4',
              color: '#9a4d08',
              transform: 'translateY(-1px)',
              transition: 'background .18s ease, color .18s ease, transform .18s ease',
            } : undefined}
          >
            {chunk}
          </span>
        );
      })}
    </>
  );
}

type Props = {
  question: KnmQuestion;
  questionNumber: number;
  selected: 'A' | 'B' | 'C' | null;
  onSelect: (l: 'A' | 'B' | 'C') => void;
  audioEnabled?: boolean; // kept for API compat but the hook is the live source of truth
  showFeedback?: boolean;
  stopRef?: React.MutableRefObject<(() => void) | null>;
};

export default function ExamQuestionCard({
  question: q,
  questionNumber,
  selected,
  onSelect,
  showFeedback = true,
  stopRef,
}: Props) {
  const segments = [
    { url: q.audioQuestion, text: q.question },
    { url: q.audioA, text: q.optionA },
    { url: q.audioB, text: q.optionB },
    { url: q.audioC, text: q.optionC },
  ];

  const [audioEnabled, setAudioEnabled] = useAudioEnabled();
  const { reading, activeSeg, activeWord, toggle, stop } = useReadAloud(segments, audioEnabled);
  if (stopRef) stopRef.current = stop;

  const hasAudio = audioEnabled && !!(q.audioQuestion || q.audioA || q.audioB || q.audioC);

  const opts: ['A' | 'B' | 'C', string, number][] = [
    ['A', q.optionA, 1],
    ['B', q.optionB, 2],
    ['C', q.optionC, 3],
  ];

  const getOptStyle = (opt: 'A' | 'B' | 'C', seg: number): React.CSSProperties => {
    const isReading = reading && activeSeg === seg;
    if (selected !== null) {
      if (opt === q.correct) return { background: 'rgba(34,197,94,.08)', border: '2px solid rgba(34,197,94,.4)' };
      if (opt === selected) return { background: 'rgba(239,68,68,.07)', border: '2px solid rgba(239,68,68,.35)' };
    }
    if (isReading) return {
      background: '#fff6ec',
      border: '2px solid #e8740c',
      boxShadow: '0 8px 24px rgba(232,116,12,0.18)',
      transform: 'translateX(4px)',
    };
    return { background: '#f2f4f6', border: '2px solid transparent' };
  };

  const getLabelStyle = (opt: 'A' | 'B' | 'C', seg: number): React.CSSProperties => {
    const isReading = reading && activeSeg === seg;
    if (selected !== null) {
      if (opt === q.correct) return { background: 'rgba(34,197,94,.15)', color: '#16a34a' };
      if (opt === selected) return { background: 'rgba(239,68,68,.15)', color: '#dc2626' };
    }
    if (isReading) return { background: '#e8740c', color: '#fff' };
    return { background: '#eceef0', color: '#434651' };
  };

  return (
    <div
      className="bg-white rounded-2xl p-3 sm:p-6 mb-4"
      style={{ border: '1.5px solid #e6e8ea', boxShadow: '0 1px 4px rgba(0,43,109,0.04)' }}
    >
      {/* Header: question number + [lees voor] + category */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap" style={{ rowGap: 8 }}>
        <span
          className="text-xs font-extrabold uppercase tracking-wider"
          style={{ color: '#747782', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.06em' }}
        >
          Vraag {questionNumber}
        </span>
        <div className="flex items-center gap-2 flex-wrap justify-end" style={{ rowGap: 8 }}>
          {/* Audio on/off toggle — always visible during exam */}
          <button
            type="button"
            onClick={() => { setAudioEnabled(!audioEnabled); if (audioEnabled) stop(); }}
            title={audioEnabled ? 'Audio uitzetten' : 'Audio aanzetten'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: audioEnabled ? '1.5px solid #f0c79e' : '1.5px solid #e0e3e5',
              background: audioEnabled ? '#fff6ec' : '#f2f4f6',
              color: audioEnabled ? '#c75d0a' : '#a0a3ad',
              cursor: 'pointer',
              transition: 'background .2s ease, border-color .2s ease, color .2s ease',
              flexShrink: 0,
            }}
          >
            {audioEnabled ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H3v6h3l5 4z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {hasAudio && (
            <button
              type="button"
              onClick={toggle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                border: reading ? 'none' : '1.5px solid #f0c79e',
                background: reading ? 'linear-gradient(180deg,#f0851f,#e8740c)' : '#fff',
                color: reading ? '#fff' : '#c75d0a',
                boxShadow: reading ? '0 8px 20px rgba(232,116,12,0.3)' : 'none',
                transition: 'all .2s ease',
              }}
            >
              {reading ? (
                <>
                  <EqBars size={14} />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H3v6h3l5 4z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                  </svg>
                  <span>Lees voor</span>
                </>
              )}
            </button>
          )}
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: '#fcecdd', color: '#c75d0a', whiteSpace: 'nowrap' }}
          >
            {q.category}
          </span>
        </div>
      </div>

      {/* Framed image (no caption) */}
      {q.imageUrl && (
        <ImageFrame src={q.imageUrl} />
      )}

      {/* Question text with word highlight */}
      <h2
        className="font-headline font-bold text-xl leading-snug mb-5"
        style={{ color: '#191c1e' }}
      >
        <HighlightedText
          text={q.question}
          active={reading}
          activeSeg={activeSeg}
          thisSeg={0}
          activeWord={activeWord}
        />
      </h2>

      {/* Answer options */}
      <div className="flex flex-col gap-3">
        {opts.map(([opt, text, seg]) => {
          const isReading = reading && activeSeg === seg;
          return (
            <button
              key={opt}
              data-testid="answer-btn"
              disabled={selected !== null}
              onClick={() => onSelect(opt)}
              className="flex items-center gap-3.5 w-full rounded-xl px-4 py-4 text-left"
              style={{
                ...getOptStyle(opt, seg),
                cursor: selected !== null ? 'default' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease',
              }}
            >
              <span
                className="flex items-center justify-center rounded-lg flex-shrink-0 text-xs font-bold"
                style={{
                  width: 28,
                  height: 28,
                  marginTop: 1,
                  ...getLabelStyle(opt, seg),
                  transition: 'background .2s ease, color .2s ease',
                }}
              >
                {opt}
              </span>
              <span className="flex-1 text-sm leading-relaxed" style={{ color: '#2c3850' }}>
                <HighlightedText
                  text={text}
                  active={reading}
                  activeSeg={activeSeg}
                  thisSeg={seg}
                  activeWord={activeWord}
                />
              </span>
              {isReading && (
                <span style={{ color: '#e8740c', flexShrink: 0 }}>
                  <EqBars size={18} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inline feedback */}
      {showFeedback && selected !== null && (
        <div
          className="mt-3 px-4 py-3 rounded-xl text-sm leading-snug"
          style={
            selected === q.correct
              ? { background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)', color: '#434651' }
              : { background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: '#434651' }
          }
        >
          {selected === q.correct ? (
            <><strong style={{ color: '#16a34a' }}>✓ Correct!</strong> {q.explanation}</>
          ) : (
            <><strong style={{ color: '#dc2626' }}>✗ Niet correct.</strong> Het juiste antwoord is <strong>{q.correct}</strong>. {q.explanation}</>
          )}
        </div>
      )}
    </div>
  );
}
