'use client';

import { useState } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';
import { useLessonAudio } from './useLessonAudio';
import LessonPlayerBar, { LessonHeader } from './LessonPlayerBar';

type Cover = 'opstal' | 'inboedel';
const COVER: Record<Cover, { label: string; detail: string; color: string }> = {
  opstal: { label: 'Opstalverzekering', color: '#002b6d', detail: 'Dekt het gebouw zelf — muren, dak, vloer. Verplicht als je een koopwoning hebt. Denk aan storm, brand of lekkage.' },
  inboedel: { label: 'Inboedelverzekering', color: '#a24000', detail: 'Dekt de spullen ín je woning — tv, bank, laptop, meubels. Niet verplicht, maar handig.' },
};

const BELASTINGEN = [
  { key: 'riool', label: 'Rioolbelasting', icon: 'plumbing', detail: 'Voor het riool in jouw straat.' },
  { key: 'parkeer', label: 'Parkeerbelasting', icon: 'local_parking', detail: 'Voor parkeren in de gemeente.' },
  { key: 'afval', label: 'Afvalstoffenheffing', icon: 'delete', detail: 'Voor het ophalen en verwerken van je afval.' },
  { key: 'hond', label: 'Hondenbelasting', icon: 'pets', detail: 'In veel gemeenten, als je een hond hebt.' },
  { key: 'ozb', label: 'OZB (alleen koopwoning)', icon: 'home', detail: 'Onroerende zaakbelasting over je eigen huis. Huurders betalen geen OZB.' },
] as const;

const VERZEKERINGEN = [
  { key: 'opstal', label: 'Opstal', verplicht: true, detail: 'Verplicht bij een koopwoning. Dekt het gebouw.' },
  { key: 'wa', label: 'WA', verplicht: true, detail: 'Verplicht bij auto, motor of scooter. Dekt schade aan andermans voertuig.' },
  { key: 'avp', label: 'AVP', verplicht: false, detail: 'Aansprakelijkheid voor particulieren. Handig: dekt schade die jij of je kind bij iemand maakt.' },
  { key: 'inboedel', label: 'Inboedel', verplicht: false, detail: 'Handig: dekt gestolen of beschadigde spullen in je woning.' },
] as const;

export default function OpstalInboedel({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const engine = useLessonAudio(audioUrl, audioCues, '/audio/leren/thema2-belastingen');
  const [coverClick, setCoverClick] = useState<Cover | null>(null);
  const [belClick, setBelClick] = useState<string | null>(null);
  const [verzClick, setVerzClick] = useState<string | null>(null);

  const cover = (coverClick ?? engine.state.cover ?? null) as Cover | null;
  const belasting = belClick ?? (engine.state.belasting as string | undefined) ?? null;
  const verzekering = verzClick ?? (engine.state.verzekering as string | undefined) ?? null;

  const opstalOn = cover === 'opstal';
  const inboedelOn = cover === 'inboedel';

  const belInfo = BELASTINGEN.find(b => b.key === belasting);
  const verzInfo = VERZEKERINGEN.find(v => v.key === verzekering);

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
      <LessonHeader title="Belastingen & verzekeringen — klik op het huis" />
      {engine.ready && <LessonPlayerBar engine={engine} hint="Gemeentelijke belastingen, opstal vs. inboedel en huurtoeslag" />}
      <audio {...engine.audioProps} />

      <div className="p-5 flex flex-col gap-5">
        {/* Clickable house: opstal vs inboedel */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <svg viewBox="0 0 240 180" className="w-full sm:w-[55%] h-auto" aria-label="Huis: gebouw (opstal) en spullen (inboedel)">
            {/* Building — opstal */}
            <g onClick={() => setCoverClick(opstalOn ? null : 'opstal')} style={{ cursor: 'pointer' }}>
              <polygon points="40,70 120,20 200,70" fill={opstalOn ? '#1d428a' : '#c8d2e0'} style={{ transition: 'fill .25s' }} />
              <rect x="52" y="70" width="136" height="92" rx="3" fill={opstalOn ? '#2d5bb0' : '#dde3ec'} style={{ transition: 'fill .25s' }} />
              {opstalOn && <rect x="36" y="16" width="168" height="150" rx="6" fill="none" stroke="#002b6d" strokeWidth="2.5" className="oi-pulse" />}
            </g>
            {/* Contents — inboedel */}
            <g onClick={() => setCoverClick(inboedelOn ? null : 'inboedel')} style={{ cursor: 'pointer' }}>
              {/* sofa */}
              <rect x="64" y="120" width="44" height="22" rx="4" fill={inboedelOn ? '#dc6a1e' : '#aeb6c2'} style={{ transition: 'fill .25s' }} />
              <rect x="60" y="110" width="10" height="32" rx="3" fill={inboedelOn ? '#c25a16' : '#9aa3b0'} style={{ transition: 'fill .25s' }} />
              {/* tv */}
              <rect x="124" y="104" width="48" height="30" rx="3" fill={inboedelOn ? '#b9521a' : '#8b94a2'} style={{ transition: 'fill .25s' }} />
              <rect x="144" y="134" width="8" height="8" fill={inboedelOn ? '#b9521a' : '#8b94a2'} />
              {/* lamp */}
              <line x1="156" y1="142" x2="156" y2="118" stroke={inboedelOn ? '#c25a16' : '#9aa3b0'} strokeWidth="3" />
              <polygon points="148,118 164,118 160,108 152,108" fill={inboedelOn ? '#f2a24a' : '#aeb6c2'} style={{ transition: 'fill .25s' }} />
              {inboedelOn && <rect x="56" y="100" width="124" height="48" rx="6" fill="none" stroke="#a24000" strokeWidth="2.5" className="oi-pulse" />}
            </g>
            <style>{`@keyframes oi-pulse{0%,100%{opacity:.95}50%{opacity:.4}} .oi-pulse{animation:oi-pulse 1.2s ease-in-out infinite}`}</style>
          </svg>

          <div className="w-full sm:w-[45%] rounded-2xl p-4 flex flex-col justify-center" style={{ minHeight: 96, background: cover ? COVER[cover].color : 'var(--color-surface-container-low)', transition: 'background .25s' }}>
            {cover ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{COVER[cover].label}</p>
                <p className="text-xs leading-relaxed text-white" style={{ opacity: 0.93 }}>{COVER[cover].detail}</p>
              </>
            ) : (
              <p className="text-sm text-center" style={{ color: 'var(--color-on-surface-variant)' }}>👆 Klik op het <strong>gebouw</strong> of op de <strong>spullen</strong></p>
            )}
          </div>
        </div>

        {/* Gemeentelijke belastingen */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>Gemeentelijke belastingen — elk jaar, verschilt per gemeente</p>
          <div className="flex flex-wrap gap-1.5">
            {BELASTINGEN.map(b => {
              const active = belasting === b.key;
              return (
                <button key={b.key} type="button" onClick={() => setBelClick(active ? null : b.key)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                  style={{ background: active ? 'var(--color-primary)' : 'var(--color-surface-container)', color: active ? '#fff' : 'var(--color-on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{b.icon}</span>{b.label}
                </button>
              );
            })}
          </div>
          {belInfo && <p className="text-xs leading-relaxed mt-2 px-1" style={{ color: 'var(--color-on-surface-variant)' }}>{belInfo.detail}</p>}
        </div>

        {/* Verzekeringen */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>Verzekeringen — twee verplicht, twee handig</p>
          <div className="flex flex-wrap gap-1.5">
            {VERZEKERINGEN.map(v => {
              const active = verzekering === v.key;
              return (
                <button key={v.key} type="button" onClick={() => setVerzClick(active ? null : v.key)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                  style={{ background: active ? 'var(--color-primary)' : 'var(--color-surface-container)', color: active ? '#fff' : 'var(--color-on-surface)' }}>
                  {v.label}
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: v.verplicht ? '#fee2e2' : '#e5e7eb', color: v.verplicht ? '#b91c1c' : '#6b7280' }}>
                    {v.verplicht ? 'VERPLICHT' : 'HANDIG'}
                  </span>
                </button>
              );
            })}
          </div>
          {verzInfo && <p className="text-xs leading-relaxed mt-2 px-1" style={{ color: 'var(--color-on-surface-variant)' }}>{verzInfo.detail}</p>}
        </div>

        {/* Huurtoeslag */}
        <div className="rounded-2xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p className="text-sm font-bold mb-1.5 flex items-center gap-1.5" style={{ color: '#15803d' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>savings</span>Huurtoeslag — hulp bij hoge huur
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>
            Kun je de huur moeilijk betalen? Dan heb je misschien recht op huurtoeslag van de overheid. Je inkomen en huur mogen niet te hoog zijn. Aanvragen doe je bij <strong>Dienst Toeslagen</strong> (Belastingdienst). Verandert je inkomen? Geef dat <strong>direct door</strong> — anders moet je geld terugbetalen.
          </p>
        </div>
      </div>
    </div>
  );
}
