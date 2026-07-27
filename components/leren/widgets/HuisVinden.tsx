'use client';

import { useState, useEffect } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';
import { useLessonAudio } from './useLessonAudio';
import LessonPlayerBar, { LessonHeader } from './LessonPlayerBar';

type Pad = 'huren' | 'kopen';
interface Step { title: string; detail: string }

const STEPS: Record<Pad, Step[]> = {
  huren: [
    { title: 'Inschrijven bij de woningcorporatie', detail: 'Je betaalt inschrijfgeld. Schrijf je zo vroeg mogelijk in — hoe langer ingeschreven, hoe meer kans op een woning.' },
    { title: 'Zoek op de website van de corporatie', detail: 'Je ziet foto’s en informatie. Er zijn regels over inkomen, leeftijd en inschrijftijd.' },
    { title: 'Reageer op een huis', detail: 'Via de website. Let op: veel mensen reageren op hetzelfde huis — er is concurrentie.' },
    { title: 'De woningcorporatie beslist', detail: 'Ze kiezen wie het langst ingeschreven staat én de huur kan betalen.' },
    { title: 'Kijk in het huis → teken het huurcontract', detail: 'Eerst kijken, dan beslissen, dan tekenen. Het huurcontract is de officiële overeenkomst.' },
    { title: 'Geef je nieuwe adres door aan de gemeente', detail: 'Binnen 5 dagen na je verhuizing. Je adres komt in de BRP — de Basisregistratie Personen.' },
  ],
  kopen: [
    { title: 'Hypotheek aanvragen bij de bank', detail: 'Je leent geld van de bank: een hypotheek. Bijna altijd heb je werk nodig — de bank wil zeker weten dat je kunt terugbetalen.' },
    { title: 'Zoek een huis — online of via een makelaar', detail: 'Zelf zoeken op bijvoorbeeld Funda, of een makelaar inschakelen. Een makelaar helpt, maar kost geld.' },
    { title: 'Kijk in het huis → doe een bod', detail: 'Een bod is wat jij wilt betalen. De verkoper kan ja zeggen, nee zeggen of onderhandelen.' },
    { title: 'Naar de notaris → teken het koopcontract', detail: 'De notaris is een officiële jurist en regelt de overdracht. Daarna is het huis officieel van jou.' },
    { title: 'Geef je nieuwe adres door aan de gemeente', detail: 'Net als bij huren: binnen 5 dagen na je verhuizing. Je adres komt in de BRP.' },
  ],
};

const PADS: Record<Pad, { label: string; emoji: string; color: string }> = {
  huren: { label: 'Ik wil huren', emoji: '🔑', color: '#002b6d' },
  kopen: { label: 'Ik wil kopen', emoji: '🏠', color: '#a24000' },
};

const WACHTTIJD = [
  { stad: 'Amsterdam', jaren: '10+ jaar' },
  { stad: 'Utrecht', jaren: '8–10 jaar' },
  { stad: 'Middelgrote stad', jaren: '4–6 jaar' },
  { stad: 'Kleinere gemeente', jaren: '2–3 jaar' },
];

export default function HuisVinden({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const engine = useLessonAudio(audioUrl, audioCues, '/audio/leren/thema2-huis-vinden');
  const [padClick, setPadClick] = useState<Pad | null>(null);
  const [openClick, setOpenClick] = useState<number | null>(null);
  const [stad, setStad] = useState(0);

  const pad = (padClick ?? engine.state.pad ?? 'huren') as Pad;
  const audioStap = (engine.state.stap ?? null) as number | null;
  const color = PADS[pad].color;
  const steps = STEPS[pad];

  // When the audio switches route, drop a manual step click so the audio drives.
  useEffect(() => { setOpenClick(null); }, [engine.state.pad]);

  const open = openClick ?? audioStap;

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
      <LessonHeader title="Een huis vinden — kies je route" />
      {engine.ready && <LessonPlayerBar engine={engine} hint="Stap voor stap een huur- of koopwoning vinden" />}
      <audio {...engine.audioProps} />

      <div className="p-5">
        {/* Route splitter */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(Object.keys(PADS) as Pad[]).map(key => {
            const p = PADS[key];
            const active = pad === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setPadClick(key); setOpenClick(null); }}
                className="rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  background: active ? p.color : 'var(--color-surface-container-low)',
                  border: `1.5px solid ${active ? p.color : 'transparent'}`,
                  boxShadow: active ? `0 6px 18px ${p.color}33` : 'none',
                }}
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="text-sm font-bold" style={{ color: active ? '#fff' : 'var(--color-on-surface)' }}>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step timeline */}
        <ol className="list-none p-0 m-0">
          {steps.map((s, i) => {
            const n = i + 1;
            const passed = audioStap != null && n <= audioStap;
            const isOpen = open === n;
            const isLast = i === steps.length - 1;
            return (
              <li key={n} className="flex gap-3">
                {/* rail */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setOpenClick(isOpen ? -1 : n)}
                    className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: passed || isOpen ? color : 'var(--color-surface-container)',
                      color: passed || isOpen ? '#fff' : 'var(--color-on-surface-variant)',
                      boxShadow: n === audioStap ? `0 0 0 4px ${color}33` : 'none',
                    }}
                  >
                    {n}
                  </button>
                  {!isLast && <div className="w-0.5 flex-1 my-1" style={{ background: passed ? color : 'var(--color-outline-variant)', minHeight: 14 }} />}
                </div>
                {/* content */}
                <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-3'}`}>
                  <button type="button" onClick={() => setOpenClick(isOpen ? -1 : n)} className="text-left w-full">
                    <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: isLast ? color : 'var(--color-on-surface)' }}>
                      {isLast && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>notifications_active</span>}
                      {s.title}
                    </p>
                  </button>
                  <div className="overflow-hidden transition-all" style={{ maxHeight: isOpen ? 160 : 0, opacity: isOpen ? 1 : 0 }}>
                    <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>{s.detail}</p>
                    {/* Wachttijd-simulator under step 1 of huren */}
                    {pad === 'huren' && n === 1 && (
                      <div className="mt-2 rounded-xl p-3" style={{ background: 'var(--color-surface-container-low)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Hoe lang wacht ik?</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {WACHTTIJD.map((w, wi) => (
                            <button key={wi} type="button" onClick={() => setStad(wi)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                              style={{ background: stad === wi ? color : 'var(--color-surface-container)', color: stad === wi ? '#fff' : 'var(--color-on-surface)' }}>
                              {w.stad}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--color-on-surface)' }}>
                          Gemiddelde wachttijd: <strong style={{ color }}>{WACHTTIJD[stad].jaren}</strong> — daarom is vroeg inschrijven zo belangrijk.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rounded-xl p-3 flex gap-2 mt-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#2563eb', fontSize: 16 }}>school</span>
          <p className="text-[11px] leading-relaxed" style={{ color: '#1e3a8a' }}>
            <strong>Examentip:</strong> geef je nieuwe adres altijd <strong>binnen 5 dagen</strong> door aan de gemeente — bij huren én kopen, en ook als je gaat samenwonen. Je adres komt in de <strong>BRP</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
