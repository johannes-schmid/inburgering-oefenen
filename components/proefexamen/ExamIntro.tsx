'use client';

import { useState, useRef, type ReactNode } from 'react';
import type { KnmQuestion } from '@/data/questions';
import { useAudioEnabled } from '@/lib/audio-pref';
import { type AudioCheckLabels } from './ExamAudioCheck';

const CATEGORY_META: Record<string, { emoji: string; short: string }> = {
  'Werk en Inkomen': { emoji: '💼', short: 'Werk en Inkomen' },
  Wonen: { emoji: '🏠', short: 'Wonen' },
  'Gezondheid en Gezondheidszorg': { emoji: '🏥', short: 'Gezondheid' },
  'Onderwijs en Opvoeding': { emoji: '🎓', short: 'Onderwijs en Opvoeding' },
  Instanties: { emoji: '🏛️', short: 'Instanties' },
  'Staatsinrichting en Rechtsstaat': { emoji: '⚖️', short: 'Staatsinrichting' },
  'Geschiedenis en Geografie': { emoji: '📜', short: 'Geschiedenis en Geografie' },
};

function EqBars({ size = 11 }: { size?: number }) {
  const bar = (delay: string): React.CSSProperties => ({
    width: 2.5,
    height: size,
    background: 'currentColor',
    borderRadius: 2,
    transformOrigin: 'bottom',
    animation: `eq .9s ease-in-out infinite ${delay}`,
  });
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: size }}>
      <span style={bar('0s')} /><span style={bar('.15s')} /><span style={bar('.3s')} /><span style={bar('.45s')} />
    </span>
  );
}

export type ExamIntroLabels = {
  eyebrow: string;
  title: string;
  statQuestions: string;
  statMinutes: string;
  statPassing: string;
  feedbackTag: string;
  sectionsHeading: string;
  startBtn: string;
  teacherTitle: string;
  audio: AudioCheckLabels;
};

type Props = {
  questions: KnmQuestion[];
  sampleUrl?: string | null;
  onStart: () => void;
  labels: ExamIntroLabels;
  teacherHref?: ReactNode;
  secondaryAction?: ReactNode;
};

export default function ExamIntro({ questions, sampleUrl, onStart, labels, teacherHref, secondaryAction }: Props) {
  const total = questions.length;
  const [audioEnabled, setAudioEnabled] = useAudioEnabled();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function playSample() {
    if (!sampleUrl) return;
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    const a = new Audio(sampleUrl);
    audioRef.current = a;
    a.play();
    setPlaying(true);
    a.onended = () => setPlaying(false);
    a.onerror = () => setPlaying(false);
  }

  // Per-section breakdown for THIS exam
  const counts: Record<string, number> = {};
  questions.forEach((q) => { counts[q.category] = (counts[q.category] || 0) + 1; });
  const breakdown = Object.entries(counts).sort(([, a], [, b]) => b - a);

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden"
      style={{ border: '1px solid #e6e8ea', boxShadow: '0 10px 40px -12px rgba(0,43,109,0.18), 0 2px 6px rgba(28,43,74,0.05)' }}
    >
      {/* Gradient header band */}
      <div
        className="relative px-6 sm:px-8 pt-7 pb-8"
        style={{ background: 'linear-gradient(135deg,#001a44 0%,#002b6d 55%,#143d8a 100%)' }}
      >
        <div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(120% 90% at 100% 0%, rgba(254,118,44,0.22), transparent 55%)' }} />

        <div className="relative">
          <div className="uppercase font-extrabold mb-2"
            style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.66rem', letterSpacing: '0.16em' }}>
            {labels.eyebrow}
          </div>
          <h2 className="font-headline font-extrabold text-white"
            style={{ fontSize: '2rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            {labels.title}
          </h2>

          {/* Stat pills + audio button */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2.5 mt-5">
            {[
              { val: String(total), label: labels.statQuestions },
              { val: "45'", label: labels.statMinutes },
              { val: '70%', label: labels.statPassing },
            ].map(({ val, label }) => (
              <div key={label}
                className="flex items-baseline gap-1.5 sm:gap-2 rounded-full pl-2.5 pr-3 py-1.5 sm:pl-3.5 sm:pr-4 sm:py-2"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)' }}>
                <span className="font-headline font-extrabold text-white" style={{ fontSize: 'clamp(0.85rem, 2.6vw, 1.05rem)' }}>{val}</span>
                <span className="font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.58rem', letterSpacing: '0.06em' }}>{label}</span>
              </div>
            ))}

            <div className="flex items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1.5 sm:pl-3 sm:pr-4 sm:py-2"
              style={{ background: 'rgba(254,118,44,0.16)', border: '1px solid rgba(254,118,44,0.32)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffb27a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span className="font-semibold" style={{ color: '#ffd1ab', fontSize: '0.68rem' }}>{labels.feedbackTag}</span>
            </div>

            {/* Audio pill — toggle + test sample */}
            <div
              className="flex items-center gap-1 rounded-full py-1.5 pl-2 pr-1.5"
              style={{
                background: audioEnabled ? 'rgba(254,118,44,0.18)' : 'rgba(255,255,255,0.08)',
                border: audioEnabled ? '1px solid rgba(254,118,44,0.4)' : '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(4px)',
                transition: 'background .25s ease, border-color .25s ease',
              }}
            >
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => { setAudioEnabled(!audioEnabled); if (playing) { audioRef.current?.pause(); setPlaying(false); } }}
                title={audioEnabled ? labels.audio.audioOn : labels.audio.audioOff}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: audioEnabled ? 'linear-gradient(180deg,#f0851f,#e8740c)' : 'rgba(255,255,255,0.12)',
                  color: audioEnabled ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: audioEnabled ? '0 2px 8px rgba(232,116,12,0.45)' : 'none',
                  transition: 'background .25s ease, color .25s ease, box-shadow .25s ease',
                  flexShrink: 0,
                }}
              >
                {audioEnabled ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H3v6h3l5 4z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                )}
              </button>

              {/* Status label */}
              <span className="font-bold px-1" style={{
                fontSize: '0.68rem',
                color: audioEnabled ? '#ffd1ab' : 'rgba(255,255,255,0.35)',
                letterSpacing: '0.04em',
                transition: 'color .25s ease',
              }}>
                {audioEnabled ? labels.audio.audioOn : labels.audio.audioOff}
              </span>

              {/* Play sample button — only when audio is on and sample exists */}
              {audioEnabled && sampleUrl && (
                <button
                  type="button"
                  onClick={playSample}
                  title={labels.audio.playSample}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: playing ? 'rgba(254,118,44,0.35)' : 'rgba(255,255,255,0.12)',
                    color: playing ? '#fe762c' : 'rgba(255,255,255,0.55)',
                    transition: 'background .2s ease, color .2s ease',
                    flexShrink: 0,
                  }}
                >
                  {playing
                    ? <EqBars size={9} />
                    : <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor"><polygon points="0 0 8 4.5 0 9"/></svg>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 flex flex-col">
        {/* Per-section breakdown — compact chips */}
        {breakdown.length > 0 && (
          <div className="mb-6 order-2 sm:order-none">
            <p className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-2" style={{ letterSpacing: '0.08em' }}>
              {labels.sectionsHeading}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {breakdown.map(([cat, count]) => {
                const meta = CATEGORY_META[cat] || { emoji: '📘', short: cat };
                return (
                  <span key={cat} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: '#f2f4f6', border: '1px solid #eaeef0' }}>
                    <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>{meta.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: '#434651' }}>{meta.short}</span>
                    <span className="text-xs font-bold rounded-full px-1.5 py-0.5"
                      style={{ background: '#fcecdd', color: '#a24000', fontSize: '0.65rem' }}>{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Teacher row */}
        <div className="flex items-center gap-3 mb-6 rounded-2xl p-3 order-3 sm:order-none"
          style={{ background: '#f8f9fb', border: '1px solid #eef0f2' }}>
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-outline-variant/30 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={44} height={44}
              className="w-full h-full object-cover object-top" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface">{teacherHref || 'Marieke Schipper'}</p>
            <p className="text-xs text-on-surface-variant leading-snug">{labels.teacherTitle}</p>
          </div>
        </div>

        {/* Actions — shown first on mobile, right after settings, so the CTA is visible without scrolling */}
        <div className="flex flex-wrap gap-3 items-center order-1 sm:order-none mb-6 sm:mb-0">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl text-white border-0 cursor-pointer hover:-translate-y-0.5 transition-transform active:scale-95"
            style={{ background: '#002b6d', boxShadow: '0 4px 14px rgba(0,43,109,0.28), inset 0 1px 0 0 rgba(255,255,255,0.12)' }}
          >
            <span>{labels.startBtn}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {secondaryAction}
        </div>
      </div>
    </div>
  );
}
