'use client';

import { useState } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';
import { useLessonAudio } from './useLessonAudio';
import LessonPlayerBar, { LessonHeader } from './LessonPlayerBar';

const CLAUSES = [
  { title: 'Het adres van de woning', detail: 'Welk huis je precies huurt staat bovenaan het contract.' },
  { title: 'Huurprijs per maand + servicekosten', detail: 'Wat je elke maand betaalt. Servicekosten zijn extra — bijv. voor het schoonhouden van de trap of lift. Je betaalt altijd vóór de eerste van de maand.' },
  { title: 'De jaarlijkse huurverhoging', detail: 'De huur gaat elk jaar een beetje omhoog. De vaste datum is 1 juli.' },
  { title: 'De borg (waarborgsom)', detail: 'Eén keer een garantiebedrag dat je vooraf betaalt. Alles in orde bij vertrek? Dan krijg je het terug.' },
  { title: 'Soort woning + begindatum', detail: 'Flat of eengezinswoning, en vanaf welke datum je gaat huren.' },
];

type Borg = 'intrek' | 'ok' | 'schade';
const BORG: Record<Borg, { label: string; emoji: string; result: string; color: string }> = {
  intrek: { label: 'Je trekt in', emoji: '🏠', result: 'Je betaalt vooraf een borg, bijvoorbeeld €800.', color: '#002b6d' },
  ok: { label: 'Vertrek — alles in orde', emoji: '✅', result: 'Je krijgt de volledige borg terug. €800 → €800.', color: '#15803d' },
  schade: { label: 'Vertrek — er is schade', emoji: '💥', result: 'De verhuurder houdt (een deel van) de borg in. €800 → minder.', color: '#b91c1c' },
};

const RECHTEN = ['Verhuurder mag de huur niet zomaar stopzetten', 'De huur mag niet veel omhoog gaan', 'Geen discriminatie door de verhuurder', 'Verhuurder onderhoudt de woning (groot onderhoud)'];
const PLICHTEN = ['De huur op tijd betalen', 'Kleine reparaties zelf doen', 'Geen overlast geven aan de buren', 'Niet onderverhuren zonder toestemming'];

type Hulp = 'huurcommissie' | 'juridischloket';
const HULP: Record<Hulp, { label: string; detail: string }> = {
  huurcommissie: { label: 'Huurcommissie', detail: 'Helpt bij problemen over de huurprijs of de kwaliteit van de woning.' },
  juridischloket: { label: 'Juridisch Loket', detail: 'Geeft gratis juridisch advies bij andere problemen.' },
};

export default function Huurcontract({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const engine = useLessonAudio(audioUrl, audioCues, '/audio/leren/thema2-huurcontract');
  const [clauseClick, setClauseClick] = useState<number | null>(null);
  const [borgClick, setBorgClick] = useState<Borg | null>(null);
  const [hulpClick, setHulpClick] = useState<Hulp | null>(null);

  const clause = (clauseClick ?? (engine.state.clause as number | undefined) ?? null);
  const borg = (borgClick ?? engine.state.borg ?? null) as Borg | null;
  const hulp = (hulpClick ?? engine.state.hulp ?? null) as Hulp | null;

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
      <LessonHeader title="Het huurcontract — klik om te lezen" />
      {engine.ready && <LessonPlayerBar engine={engine} hint="Wat staat erin, je rechten en plichten, en hulp bij problemen" />}
      <audio {...engine.audioProps} />

      <div className="p-5 flex flex-col gap-5">
        {/* Interactive contract */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>Wat staat er in het contract?</p>
          <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
            <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px dashed var(--color-outline-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>article</span>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)' }}>Huurcontract</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {CLAUSES.map((c, i) => {
                const n = i + 1;
                const active = clause === n;
                return (
                  <div key={n}>
                    <button type="button" onClick={() => setClauseClick(active ? -1 : n)}
                      className="w-full text-left flex gap-2.5 items-start rounded-lg px-2 py-1.5 transition-all"
                      style={{ background: active ? 'var(--color-primary)' : 'transparent' }}>
                      <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: active ? '#fff' : 'var(--color-primary)' }}>{n}.</span>
                      <span className="text-sm font-medium" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{c.title}</span>
                    </button>
                    <div className="overflow-hidden transition-all" style={{ maxHeight: active ? 120 : 0, opacity: active ? 1 : 0 }}>
                      <p className="text-xs leading-relaxed px-2 pt-1 pb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>{c.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Borg simulator */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>Borg-simulatie — wat gebeurt er met je borg?</p>
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {(Object.keys(BORG) as Borg[]).map(key => {
              const b = BORG[key];
              const active = borg === key;
              return (
                <button key={key} type="button" onClick={() => setBorgClick(active ? null : key)}
                  className="rounded-2xl py-3 px-2 flex flex-col items-center gap-1 transition-all active:scale-[0.98]"
                  style={{ background: active ? b.color : 'var(--color-surface-container-low)', boxShadow: active ? `0 6px 16px ${b.color}33` : 'none' }}>
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-[11px] font-semibold leading-tight text-center" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{b.label}</span>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl px-3 py-2.5 min-h-[44px] flex items-center" style={{ background: borg ? `${BORG[borg].color}12` : 'var(--color-surface-container-low)' }}>
            <p className="text-xs leading-relaxed" style={{ color: borg ? BORG[borg].color : 'var(--color-on-surface-variant)' }}>
              {borg ? BORG[borg].result : 'Kies een situatie om te zien wat er met de borg gebeurt.'}
            </p>
          </div>
        </div>

        {/* Rechten vs plichten */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: '#15803d' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>Rechten van de huurder
            </p>
            <ul className="list-none p-0 m-0 space-y-1.5">
              {RECHTEN.map((r, i) => <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: '#166534' }}><span className="mt-0.5">✓</span>{r}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: '#b91c1c' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>assignment</span>Plichten van de huurder
            </p>
            <ul className="list-none p-0 m-0 space-y-1.5">
              {PLICHTEN.map((p, i) => <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: '#991b1b' }}><span className="mt-0.5">!</span>{p}</li>)}
            </ul>
          </div>
        </div>

        {/* Probleem met verhuurder */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-on-surface-variant)' }}>Probleem met je verhuurder? Praat eerst — lukt het niet, vraag hulp:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(HULP) as Hulp[]).map(key => {
              const h = HULP[key];
              const active = hulp === key;
              return (
                <button key={key} type="button" onClick={() => setHulpClick(active ? null : key)}
                  className="text-left rounded-2xl p-3.5 transition-all active:scale-[0.99]"
                  style={{ background: active ? 'var(--color-primary)' : 'var(--color-surface-container-low)', boxShadow: active ? '0 6px 16px rgba(0,43,109,0.2)' : 'none' }}>
                  <p className="text-sm font-bold mb-1" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{h.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: active ? 'rgba(255,255,255,0.9)' : 'var(--color-on-surface-variant)' }}>{h.detail}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-3 flex gap-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#2563eb', fontSize: 16 }}>school</span>
          <p className="text-[11px] leading-relaxed" style={{ color: '#1e3a8a' }}>
            <strong>Examentip:</strong> ken het verschil tussen een <strong>recht</strong> (wat jij van de verhuurder mag eisen) en een <strong>plicht</strong> (wat jij zelf moet doen).
          </p>
        </div>
      </div>
    </div>
  );
}
