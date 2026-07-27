'use client';

import { useState } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';
import { useLessonAudio } from './useLessonAudio';
import LessonPlayerBar, { LessonHeader } from './LessonPlayerBar';

type Sector = 'sociaal' | 'vrij';
type Relatie = 'huwelijk' | 'partnerschap';

const SECTORS: Record<Sector, { label: string; color: string; icon: string; rows: string[]; tip: string }> = {
  sociaal: {
    label: 'Sociale huursector', color: '#2563a8', icon: 'verified_user',
    rows: ['Voor mensen met een laag of gemiddeld inkomen', 'Er is een maximale huurprijs', 'De huur mag niet veel omhoog gaan — dat geeft rust'],
    tip: 'Sociale huur = beschermd. Een maximumprijs en kleine huurverhoging.',
  },
  vrij: {
    label: 'Vrije huursector', color: '#a24000', icon: 'trending_up',
    rows: ['Voor mensen met een hoog inkomen', 'De huur is hoog', 'De huur kan elk jaar veel stijgen — geen maximum'],
    tip: 'Vrije sector = duurder en minder bescherming. De verhuurder bepaalt zelf de prijs.',
  },
};

const RELATIES: Record<Relatie, { label: string; icon: string; jawoord: string; rechter: string }> = {
  huwelijk: {
    label: 'Het huwelijk', icon: 'favorite',
    jawoord: 'Je geeft elkaar het ja-woord bij de trouwambtenaar. Pas dan is het officieel.',
    rechter: 'Wil je scheiden? Je gaat áltijd naar de rechter.',
  },
  partnerschap: {
    label: 'Geregistreerd partnerschap', icon: 'handshake',
    jawoord: 'Geen ja-woord nodig — dat is niet verplicht.',
    rechter: 'Beëindigen kan zónder rechter, als je geen kinderen onder de 18 hebt.',
  },
};

export default function WoonChoice({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const engine = useLessonAudio(audioUrl, audioCues, '/audio/leren/thema2-woonwens');
  const [sectorClick, setSectorClick] = useState<Sector | null>(null);
  const [relatieClick, setRelatieClick] = useState<Relatie | null>(null);

  const sector = (sectorClick ?? engine.state.sector ?? null) as Sector | null;
  const relatie = (relatieClick ?? engine.state.relatie ?? null) as Relatie | null;

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
      <LessonHeader title="Huren of kopen — sociaal of vrij?" />
      {engine.ready && <LessonPlayerBar engine={engine} hint="De huursectoren, trouwen en geregistreerd partnerschap" />}
      <audio {...engine.audioProps} />

      <div className="p-5 flex flex-col gap-5">
        {/* Sociale vs vrije huursector */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>
            Twee soorten huur — klik om te vergelijken
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(SECTORS) as Sector[]).map(key => {
              const s = SECTORS[key];
              const active = sector === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSectorClick(active ? null : key)}
                  className="text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
                  style={{
                    background: active ? s.color : 'var(--color-surface-container-low)',
                    border: `1.5px solid ${active ? s.color : 'transparent'}`,
                    boxShadow: active ? `0 6px 20px ${s.color}33` : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: active ? '#fff' : s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    <p className="text-sm font-bold" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{s.label}</p>
                  </div>
                  <ul className="space-y-1.5 list-none p-0 m-0">
                    {s.rows.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: active ? 'rgba(255,255,255,0.92)' : 'var(--color-on-surface-variant)' }}>
                        <span style={{ color: active ? 'rgba(255,255,255,0.7)' : s.color, fontWeight: 700 }}>→</span>{r}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          {sector && (
            <div className="mt-2.5 rounded-xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>lightbulb</span>
              <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>{SECTORS[sector].tip}</p>
            </div>
          )}
        </div>

        {/* Huwelijk vs partnerschap */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>
            Een relatie vastleggen — twee opties
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(RELATIES) as Relatie[]).map(key => {
              const r = RELATIES[key];
              const active = relatie === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRelatieClick(active ? null : key)}
                  className="text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
                  style={{
                    background: active ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                    border: `1.5px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
                    boxShadow: active ? '0 6px 20px rgba(0,43,109,0.22)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: active ? '#fff' : 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>{r.icon}</span>
                    <p className="text-sm font-bold" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{r.label}</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: active ? 'rgba(255,255,255,0.6)' : 'var(--color-on-surface-variant)' }}>Ja-woord</p>
                      <p className="text-xs leading-relaxed" style={{ color: active ? 'rgba(255,255,255,0.92)' : 'var(--color-on-surface-variant)' }}>{r.jawoord}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: active ? 'rgba(255,255,255,0.6)' : 'var(--color-on-surface-variant)' }}>Bij scheiding</p>
                      <p className="text-xs leading-relaxed" style={{ color: active ? 'rgba(255,255,255,0.92)' : 'var(--color-on-surface-variant)' }}>{r.rechter}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam tip */}
        <div className="rounded-xl p-3 flex gap-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#2563eb', fontSize: 16 }}>school</span>
          <p className="text-[11px] leading-relaxed" style={{ color: '#1e3a8a' }}>
            <strong>Examentip:</strong> onthoud twee verschillen — <strong>ja-woord</strong> (wel bij huwelijk, niet bij partnerschap) en de <strong>rechter</strong> bij scheiding (altijd bij huwelijk, alleen bij kinderen onder 18 bij partnerschap).
          </p>
        </div>
      </div>
    </div>
  );
}
