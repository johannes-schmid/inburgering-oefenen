'use client';

import { useState } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';
import { useLessonAudio } from './useLessonAudio';
import LessonPlayerBar, { LessonHeader } from './LessonPlayerBar';

type Meter = 'gas' | 'stroom' | 'water';
const METERS: Record<Meter, { label: string; emoji: string; reading: string; detail: string; color: string }> = {
  gas: { label: 'Gasmeter', emoji: '🔥', reading: '04821', detail: 'Meet hoeveel gas (of warmte) jij gebruikt. Je kiest zelf een energieleverancier.', color: '#c2410c' },
  stroom: { label: 'Elektriciteitsmeter', emoji: '⚡', reading: '12903', detail: 'Meet hoeveel stroom jij gebruikt. Ook voor stroom kies je zelf een leverancier.', color: '#ca8a04' },
  water: { label: 'Watermeter', emoji: '💧', reading: '00367', detail: 'Meet hoeveel water jij gebruikt. Het waterbedrijf kun je níet kiezen — elk gebied heeft er één.', color: '#0369a1' },
};

type Tarief = 'vast' | 'variabel';
const TARIEF: Record<Tarief, { label: string; rows: string[] }> = {
  vast: { label: 'Vast tarief', rows: ['De prijs blijft hetzelfde', 'Contract van 1, 2 of 3 jaar', 'Je weet altijd wat je betaalt — geen verrassingen'] },
  variabel: { label: 'Variabel tarief', rows: ['De prijs kan stijgen of dalen', 'Geen vaste looptijd — altijd opzegbaar', 'Goedkoper bij lage energieprijzen'] },
};

const TIPS = [
  { label: 'Verwarming lager', emoji: '🌡️', save: 120 },
  { label: 'Korter douchen', emoji: '🚿', save: 80 },
  { label: 'Ledlampen', emoji: '💡', save: 50 },
  { label: 'Opladers eruit', emoji: '🔌', save: 15 },
  { label: 'Apparaten écht uit', emoji: '📺', save: 40 },
  { label: 'Huis isoleren', emoji: '🏠', save: 200 },
];

export default function Meterkast({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const engine = useLessonAudio(audioUrl, audioCues, '/audio/leren/thema2-energie');
  const [meterClick, setMeterClick] = useState<Meter | null>(null);
  const [tariefClick, setTariefClick] = useState<Tarief | null>(null);
  const [tips, setTips] = useState<boolean[]>(() => TIPS.map(() => false));

  const meter = (meterClick ?? engine.state.meter ?? null) as Meter | null;
  const tarief = (tariefClick ?? engine.state.tarief ?? null) as Tarief | null;
  const total = TIPS.reduce((sum, t, i) => sum + (tips[i] ? t.save : 0), 0);

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
      <LessonHeader title="Gas, elektriciteit en water — open de meterkast" />
      {engine.ready && <LessonPlayerBar engine={engine} hint="Energie regelen, de meters, tarieven en energie besparen" />}
      <audio {...engine.audioProps} />

      <div className="p-5 flex flex-col gap-5">
        {/* Meterkast */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>De drie meters in je huis — klik om te zien wat ze meten</p>
          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(METERS) as Meter[]).map(key => {
              const m = METERS[key];
              const active = meter === key;
              return (
                <button key={key} type="button" onClick={() => setMeterClick(active ? null : key)}
                  className="rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all active:scale-[0.98]"
                  style={{ background: active ? m.color : 'var(--color-surface-container-low)', boxShadow: active ? `0 6px 16px ${m.color}33` : 'none' }}>
                  <span className="text-lg">{m.emoji}</span>
                  <span className="font-mono text-xs tracking-widest px-2 py-0.5 rounded" style={{ background: active ? 'rgba(0,0,0,0.25)' : '#111', color: '#7CFC00' }}>{m.reading}</span>
                  <span className="text-[10px] font-semibold leading-tight text-center" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{m.label}</span>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl px-3 py-2.5 mt-2.5 min-h-[40px] flex items-center" style={{ background: meter ? `${METERS[meter].color}12` : 'var(--color-surface-container-low)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>
              {meter ? METERS[meter].detail : 'Geef je meterstand één keer per jaar door. Heb je een slimme meter? Dan gaat dat automatisch.'}
            </p>
          </div>
        </div>

        {/* Vast vs variabel */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>Vast of variabel tarief?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(TARIEF) as Tarief[]).map(key => {
              const t = TARIEF[key];
              const active = tarief === key;
              return (
                <button key={key} type="button" onClick={() => setTariefClick(active ? null : key)}
                  className="text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
                  style={{ background: active ? 'var(--color-primary)' : 'var(--color-surface-container-low)', boxShadow: active ? '0 6px 18px rgba(0,43,109,0.2)' : 'none' }}>
                  <p className="text-sm font-bold mb-2" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{t.label}</p>
                  <ul className="list-none p-0 m-0 space-y-1">
                    {t.rows.map((r, i) => <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: active ? 'rgba(255,255,255,0.9)' : 'var(--color-on-surface-variant)' }}><span style={{ fontWeight: 700 }}>→</span>{r}</li>)}
                  </ul>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] mt-2 px-1" style={{ color: 'var(--color-on-surface-variant)' }}>
            Eén keer per jaar krijg je een <strong>jaarrekening</strong>: te weinig betaald? Bijbetalen. Te veel betaald? Geld terug.
          </p>
        </div>

        {/* Bespaarchallenge */}
        <div className="rounded-2xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#15803d' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>eco</span>Bespaarchallenge
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: '#15803d' }}>≈ €{total} / jaar</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TIPS.map((t, i) => {
              const on = tips[i];
              return (
                <button key={i} type="button" onClick={() => setTips(prev => prev.map((v, j) => j === i ? !v : v))}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                  style={{ background: on ? '#15803d' : '#fff', color: on ? '#fff' : '#166534', border: '1px solid #bbf7d0' }}>
                  <span>{t.emoji}</span>{t.label}
                  {on && <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] mt-2" style={{ color: '#166534' }}>Tik aan wat jij al doet of wilt doen — goed voor je portemonnee én de natuur.</p>
        </div>
      </div>
    </div>
  );
}
