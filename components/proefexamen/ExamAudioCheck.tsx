'use client';

import { useState, useRef } from 'react';
import { useAudioEnabled } from '@/lib/audio-pref';

function EqBars({ size = 14 }: { size?: number }) {
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

export type AudioCheckLabels = {
  heading: string;
  desc: string;
  playSample: string;
  audioOn: string;
  audioOff: string;
};

const DEFAULT_LABELS: AudioCheckLabels = {
  heading: 'Test je geluid',
  desc: 'Elke vraag kan worden voorgelezen — zet je geluid aan.',
  playSample: 'Speel af',
  audioOn: 'Audio aan',
  audioOff: 'Audio uit',
};

type Props = {
  sampleUrl?: string | null;
  labels?: AudioCheckLabels;
};

export default function ExamAudioCheck({ sampleUrl, labels = DEFAULT_LABELS }: Props) {
  const [audioEnabled, setAudioEnabled] = useAudioEnabled();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function playSample() {
    if (!sampleUrl) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const audio = new Audio(sampleUrl);
    audioRef.current = audio;
    audio.play();
    setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
  }

  return (
    <div
      className="rounded-2xl mb-5 overflow-hidden"
      style={{
        background: audioEnabled
          ? 'linear-gradient(135deg,#0d1f4a 0%,#102659 100%)'
          : 'linear-gradient(135deg,#1c1f26 0%,#23262f 100%)',
        border: audioEnabled ? '1px solid rgba(254,118,44,0.2)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: audioEnabled ? '0 4px 20px rgba(0,27,80,0.22)' : '0 4px 16px rgba(0,0,0,0.18)',
        transition: 'background .35s ease, border-color .35s ease, box-shadow .35s ease',
      }}
    >
      {/* Top accent line */}
      <div style={{
        height: 3,
        background: audioEnabled
          ? 'linear-gradient(to right,#a24000,#fe762c)'
          : 'rgba(255,255,255,0.1)',
        transition: 'background .35s ease',
      }} />

      <div className="px-4 pt-3.5 pb-4">
        {/* Status row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Animated icon */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 36,
                height: 36,
                background: audioEnabled ? 'rgba(254,118,44,0.18)' : 'rgba(255,255,255,0.07)',
                border: audioEnabled ? '1px solid rgba(254,118,44,0.3)' : '1px solid rgba(255,255,255,0.1)',
                transition: 'background .35s ease, border-color .35s ease',
              }}
            >
              {playing ? (
                <span style={{ color: '#fe762c' }}><EqBars size={14} /></span>
              ) : audioEnabled ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fe762c" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H3v6h3l5 4z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H3v6h3l5 4z" />
                  <line x1="23" y1="9" x2="17" y2="15" stroke="rgba(255,255,255,0.35)" />
                  <line x1="17" y1="9" x2="23" y2="15" stroke="rgba(255,255,255,0.35)" />
                </svg>
              )}
            </div>

            <div>
              {/* Live status badge */}
              {audioEnabled ? (
                <div className="flex items-center gap-1.5 mb-0.5">
                  {/* Pulsing dot */}
                  <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
                    <span style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: '#fe762c', opacity: 0.5,
                      animation: 'ping 1.4s cubic-bezier(0,0,.2,1) infinite',
                    }} />
                    <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7, borderRadius: '50%', background: '#fe762c' }} />
                  </span>
                  <span className="font-extrabold uppercase" style={{ color: '#fe762c', fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                    {labels.audioOn}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span style={{ display: 'inline-flex', width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                  <span className="font-extrabold uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                    {labels.audioOff}
                  </span>
                </div>
              )}
              <p className="font-bold text-sm leading-tight" style={{ color: audioEnabled ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                {labels.heading}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={audioEnabled}
            onClick={() => setAudioEnabled(!audioEnabled)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              width: 50,
              height: 28,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              padding: 3,
              flexShrink: 0,
              background: audioEnabled
                ? 'linear-gradient(180deg,#f0851f,#e8740c)'
                : 'rgba(255,255,255,0.12)',
              boxShadow: audioEnabled ? '0 0 0 3px rgba(232,116,12,0.22)' : 'none',
              transition: 'background .25s ease, box-shadow .25s ease',
            }}
          >
            <span style={{
              display: 'block',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transform: audioEnabled ? 'translateX(22px)' : 'translateX(0)',
              transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
            }} />
          </button>
        </div>

        {/* Description + play button */}
        <div
          className="rounded-xl flex items-center justify-between gap-3 px-3 py-2.5"
          style={{
            background: audioEnabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'background .35s ease',
          }}
        >
          <p className="text-xs leading-snug" style={{ color: audioEnabled ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
            {audioEnabled
              ? 'Elke vraag wordt automatisch voorgelezen zodra je begint.'
              : labels.desc}
          </p>
          {sampleUrl && (
            <button
              type="button"
              onClick={playSample}
              className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-full font-bold"
              style={{
                padding: '5px 11px',
                fontSize: '0.72rem',
                border: 'none',
                cursor: 'pointer',
                background: playing
                  ? 'linear-gradient(180deg,#f0851f,#e8740c)'
                  : 'rgba(255,255,255,0.12)',
                color: playing ? '#fff' : 'rgba(255,255,255,0.7)',
                boxShadow: playing ? '0 3px 10px rgba(232,116,12,0.4)' : 'none',
                transition: 'background .2s ease, color .2s ease, box-shadow .2s ease',
              }}
            >
              {playing ? (
                <><span style={{ color: 'inherit' }}><EqBars size={11} /></span><span>Stop</span></>
              ) : (
                <><svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor"><polygon points="0 0 9 5 0 10"/></svg><span>{labels.playSample}</span></>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%,100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
