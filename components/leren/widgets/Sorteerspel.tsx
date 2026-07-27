'use client';

import { useState } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';
import { useLessonAudio } from './useLessonAudio';
import LessonPlayerBar, { LessonHeader } from './LessonPlayerBar';

type Bak = 'gft' | 'papier' | 'glas' | 'textiel' | 'plastic' | 'rest' | 'chemisch';
const BAKKEN: Record<Bak, { label: string; emoji: string; bg: string; ring: string; text: string }> = {
  gft: { label: 'GFT', emoji: '🥦', bg: '#dcfce7', ring: '#16a34a', text: '#166534' },
  papier: { label: 'Papier', emoji: '📄', bg: '#dbeafe', ring: '#2563eb', text: '#1e40af' },
  glas: { label: 'Glas', emoji: '🍶', bg: '#fef9c3', ring: '#ca8a04', text: '#854d0e' },
  textiel: { label: 'Textiel', emoji: '👕', bg: '#fce7f3', ring: '#db2777', text: '#9d174d' },
  plastic: { label: 'Plastic', emoji: '🧴', bg: '#ffedd5', ring: '#ea580c', text: '#9a3412' },
  rest: { label: 'Restafval', emoji: '🗑️', bg: '#f1f5f9', ring: '#64748b', text: '#334155' },
  chemisch: { label: 'Chemisch', emoji: '⚠️', bg: '#fee2e2', ring: '#dc2626', text: '#991b1b' },
};

const ITEMS: { emoji: string; label: string; bak: Bak }[] = [
  { emoji: '🥦', label: 'Broccolistronk', bak: 'gft' },
  { emoji: '📰', label: 'Krant', bak: 'papier' },
  { emoji: '🍷', label: 'Lege wijnfles', bak: 'glas' },
  { emoji: '👕', label: 'Oud T-shirt', bak: 'textiel' },
  { emoji: '🧴', label: 'Shampoofles', bak: 'plastic' },
  { emoji: '🍬', label: 'Kauwgom', bak: 'rest' },
  { emoji: '🔋', label: 'Batterij', bak: 'chemisch' },
  { emoji: '📦', label: 'Kartonnen doos', bak: 'papier' },
  { emoji: '🥛', label: 'Yoghurtbeker', bak: 'plastic' },
  { emoji: '🍌', label: 'Bananenschil', bak: 'gft' },
];

export default function Sorteerspel({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const engine = useLessonAudio(audioUrl, audioCues, '/audio/leren/thema2-afval');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | { ok: boolean; correct: Bak }>(null);
  const [done, setDone] = useState(false);

  const audioBak = (engine.state.bak ?? null) as Bak | null;
  const item = ITEMS[idx];

  function pick(bak: Bak) {
    if (feedback) return;
    const ok = bak === item.bak;
    setFeedback({ ok, correct: item.bak });
    if (ok) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 >= ITEMS.length) { setDone(true); }
      else { setIdx(idx + 1); setFeedback(null); }
    }, 1100);
  }

  function restart() { setIdx(0); setScore(0); setFeedback(null); setDone(false); }

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
      <LessonHeader title="Afval scheiden — sorteer in de juiste bak" />
      {engine.ready && <LessonPlayerBar engine={engine} hint="De zes soorten afval, chemisch afval en statiegeld" />}
      <audio {...engine.audioProps} />

      <div className="p-5 flex flex-col gap-5">
        {/* Game prompt */}
        <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--color-surface-container-low)' }}>
          {done ? (
            <>
              <p className="text-3xl mb-1">{score >= 8 ? '🎉' : '👍'}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{score} / {ITEMS.length} goed</p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>{score >= 8 ? 'Top — je weet hoe je afval scheidt!' : 'Goed bezig. Probeer het nog eens.'}</p>
              <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white active:scale-95" style={{ background: 'var(--color-primary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>Opnieuw
              </button>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>Waar hoort dit? · {idx + 1}/{ITEMS.length} · score {score}</p>
              <div className="text-4xl mb-1" style={{ transition: 'transform .2s', transform: feedback ? 'scale(0.9)' : 'scale(1)' }}>{item.emoji}</div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>{item.label}</p>
              {feedback && (
                <p className="text-xs font-semibold mt-1" style={{ color: feedback.ok ? '#15803d' : '#b91c1c' }}>
                  {feedback.ok ? '✓ Goed!' : `✗ Dit hoort bij ${BAKKEN[feedback.correct].label}`}
                </p>
              )}
            </>
          )}
        </div>

        {/* Bins */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {(Object.keys(BAKKEN) as Bak[]).map(key => {
            const b = BAKKEN[key];
            const audioOn = audioBak === key;
            const isAnswerCorrect = feedback && feedback.correct === key;
            const ring = audioOn || isAnswerCorrect;
            return (
              <button key={key} type="button" onClick={() => pick(key)} disabled={!!feedback || done}
                className="rounded-2xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95"
                style={{ background: b.bg, border: `2px solid ${ring ? b.ring : 'transparent'}`, boxShadow: ring ? `0 0 0 3px ${b.ring}33` : 'none', opacity: done ? 0.5 : 1 }}>
                <span className="text-xl">{b.emoji}</span>
                <span className="text-[11px] font-bold" style={{ color: b.text }}>{b.label}</span>
              </button>
            );
          })}
        </div>

        {/* Speciaal afval + statiegeld */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
            <p className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#dc2626' }}>warning</span>Chemisch & groot afval
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>Verf, batterijen en medicijnen breng je naar het <strong>afvalpunt</strong> — nooit in een gewone bak. Te groot (bank, kast)? De gemeente haalt het op.</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: '#92400e' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>recycling</span>Statiegeld
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>Bij een blikje of plastic fles betaal je <strong>statiegeld</strong>. Lever je het lege blikje of de fles in bij de automaat? Dan krijg je dat geld terug.</p>
          </div>
        </div>

        <div className="rounded-xl p-3 flex gap-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#2563eb', fontSize: 16 }}>school</span>
          <p className="text-[11px] leading-relaxed" style={{ color: '#1e3a8a' }}>
            <strong>Examentip:</strong> de gemeente betaalt de afvalinzameling met de <strong>afvalstoffenheffing</strong> — een gemeentelijke belasting die iedereen betaalt.
          </p>
        </div>
      </div>
    </div>
  );
}
