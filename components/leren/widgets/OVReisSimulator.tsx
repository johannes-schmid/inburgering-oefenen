'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';

type SimState  = 'idle' | 'inchecken' | 'reizen' | 'uitchecken';
type VehicleId = 'trein' | 'bus' | 'tram' | 'metro';
type PaymentId = 'chipkaart' | 'bankpas' | 'telefoon';

const VEHICLES: { id: VehicleId; label: string; icon: string; vervoerder: string; instap: number; rit: number }[] = [
  { id: 'trein', label: 'Trein',  icon: 'train',          vervoerder: 'NS',        instap: 98,  rit: 234 },
  { id: 'bus',   label: 'Bus',    icon: 'directions_bus',  vervoerder: 'Regionaal', instap: 99,  rit: 178 },
  { id: 'tram',  label: 'Tram',   icon: 'tram',            vervoerder: 'Regionaal', instap: 108, rit: 156 },
  { id: 'metro', label: 'Metro',  icon: 'subway',          vervoerder: 'Regionaal', instap: 108, rit: 156 },
];

const PAYMENTS: { id: PaymentId; label: string; icon: string }[] = [
  { id: 'chipkaart', label: 'OV-chipkaart', icon: 'credit_card' },
  { id: 'bankpas',   label: 'Bankpas',      icon: 'contactless' },
  { id: 'telefoon',  label: 'Telefoon',     icon: 'smartphone'  },
];

// Script used as TTS source in the admin generate-lesson-audio pipeline.
// "negen-twee-negen-twee" = correct Dutch pronunciation for the 9292 app.
// Anchor phrases drive extractOVCues() in lib/leren-audio-cues.ts.
export const OV_LESSON_SCRIPT = `In Nederland reizen veel mensen met het openbaar vervoer. Je kunt reizen met de trein, met de bus, met de tram of met de metro. De trein wordt gereden door de NS, de Nederlandse Spoorwegen. Voor de bus, tram en metro zijn er regionale vervoerders.
Om te reizen heb je een vervoersbewijs nodig. De meeste mensen betalen met een OV-chipkaart. Je kunt ook betalen met een bankpas of je telefoon via OVpay.
Voordat je vertrekt, moet je inchecken. Houd je kaart bij de lezer bij het poortje. Je hoort één piep. Dat betekent dat je bent ingecheckt en het instaptarief wordt van je saldo afgeschreven.
Nu is je reis bezig. Je zit in het voertuig en reist naar je bestemming.
Als je aankomt, moet je uitchecken. Houd je kaart opnieuw bij de lezer. Je hoort twee piepen. De ritprijs wordt berekend en van je saldo afgeschreven.
Let op: gebruik altijd dezelfde pas voor inchecken én uitchecken. Vergeet je uit te checken? Dan betaal je het maximumtarief.
Plan je reis via de negen-twee-negen-twee app of de NS-app. Vul je vertrekpunt en bestemming in, en je ziet de snelste route, het perron en waar je moet overstappen.`;

function centsToEuro(c: number) {
  return `€${(c / 100).toFixed(2).replace('.', ',')}`;
}

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function playBeep(count: number) {
  try {
    const ctx = new AudioContext();
    for (let i = 0; i < count; i++) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 1050;
      const t = ctx.currentTime + i * 0.28;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      osc.start(t);
      osc.stop(t + 0.2);
    }
    setTimeout(() => ctx.close(), count * 300 + 400);
  } catch { /* Web Audio unavailable */ }
}

const FACTS = [
  'Betaal met OV-chipkaart, bankpas of telefoon (OVpay)',
  'Gebruik dezelfde pas voor inchecken én uitchecken',
  'Vergeet je uit te checken? Dan betaal je het maximumtarief',
  'Plan je reis via de negen-twee-negen-twee app of de NS-app',
  'Trein = NS · Bus, tram en metro = regionale vervoerder',
];

export default function OVReisSimulator({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const SALDO_START = 2500;

  const [simState, setSimState]     = useState<SimState>('idle');
  const [vehicle, setVehicle]       = useState<VehicleId>('trein');
  const [payment, setPayment]       = useState<PaymentId>('chipkaart');
  const [saldo, setSaldo]           = useState(SALDO_START);
  const [beepA, setBeepA]           = useState(false);
  const [beepB, setBeepB]           = useState(false);
  const [factIdx, setFactIdx]       = useState(0);
  const [trainPct, setTrainPct]     = useState(0); // 0–100, driven by audio time or manual
  const [highlightVehicle, setHighlightVehicle] = useState<VehicleId | null>(null);
  const [highlightPayment, setHighlightPayment] = useState<PaymentId | null>(null);

  // Audio player state
  const audioRef       = useRef<HTMLAudioElement>(null);
  const cuesRef        = useRef<AudioCue[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const simStateRef    = useRef<SimState>('idle');
  const beepedRef      = useRef<Set<string>>(new Set()); // dedup beeps in audio mode
  const playingRef     = useRef(false);

  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitle, setSubtitle] = useState('');

  useEffect(() => { if (audioCues?.length) cuesRef.current = audioCues; }, [audioCues]);
  useEffect(() => { simStateRef.current = simState; }, [simState]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const currentVehicle = VEHICLES.find(v => v.id === vehicle)!;
  const currentVehicleRef = useRef(currentVehicle);
  useEffect(() => { currentVehicleRef.current = currentVehicle; }, [currentVehicle]);

  // Extract step timestamps from cues for train position calculation
  const reizenTime    = audioCues?.find(c => c.step === 'reizen')?.time    ?? null;
  const uitcheckenTime = audioCues?.find(c => c.step === 'uitchecken')?.time ?? null;

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t    = audio.currentTime;
    const cues = cuesRef.current;
    const cur  = simStateRef.current;
    const cv   = currentVehicleRef.current;

    // ── Train position: interpolate between reizen and uitchecken timestamps ──
    if (reizenTime !== null && uitcheckenTime !== null) {
      if (t >= uitcheckenTime) {
        setTrainPct(100);
      } else if (t >= reizenTime) {
        const pct = (t - reizenTime) / (uitcheckenTime - reizenTime) * 100;
        setTrainPct(Math.min(100, pct));
      } else {
        setTrainPct(0);
      }
    }

    // ── Subtitle: most recent subtitle cue at or before t ──
    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (cues[i].subtitle !== undefined) { setSubtitle(cues[i].subtitle!); break; }
    }

    // ── Vehicle: most recent vehicle cue at or before t (re-highlights on every mention) ──
    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (cues[i].vehicle !== undefined && cues[i].vehicle !== null) {
        const v = cues[i].vehicle as VehicleId;
        setHighlightVehicle(v);
        setVehicle(v);
        break;
      }
    }

    // ── Payment: most recent payment cue at or before t ──
    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (cues[i].payment !== undefined && cues[i].payment !== null) {
        setHighlightPayment(cues[i].payment as PaymentId);
        setPayment(cues[i].payment as PaymentId);
        break;
      }
    }

    // ── Step transitions (deduped so beep fires exactly once per step) ──
    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (cues[i].step === undefined) continue;
      const step = cues[i].step!;

      if (step === 'inchecken' && cur === 'idle' && !beepedRef.current.has('inchecken')) {
        beepedRef.current.add('inchecken');
        setSaldo(s => s - cv.instap);
        setBeepA(true); setTimeout(() => setBeepA(false), 900);
        playBeep(1);
        setSimState('inchecken');
      } else if (step === 'reizen' && cur === 'inchecken' && !beepedRef.current.has('reizen')) {
        beepedRef.current.add('reizen');
        setSimState('reizen');
      } else if (step === 'uitchecken' && cur === 'reizen' && !beepedRef.current.has('uitchecken')) {
        beepedRef.current.add('uitchecken');
        setSaldo(s => s - (cv.rit - cv.instap));
        setBeepB(true); setTimeout(() => setBeepB(false), 900);
        playBeep(2);
        setSimState('uitchecken');
      }
      break;
    }

    setProgress(audio.duration ? t / audio.duration : 0);
  }, [reizenTime, uitcheckenTime]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar   = progressBarRef.current;
    if (!audio || !bar) return;
    const rect  = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    // Seeking backward: clear beeped state so steps can re-fire
    if (ratio * audio.duration < audio.currentTime) beepedRef.current.clear();
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }

  useEffect(() => {
    const t = setInterval(() => setFactIdx(i => (i + 1) % FACTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Manual mode: auto-advance inchecken → reizen (only when audio is NOT driving)
  useEffect(() => {
    if (simState !== 'inchecken' || playingRef.current) return;
    const timer = setTimeout(() => {
      setSimState('reizen');
      // animate train to station B over 4s for manual mode
      setTrainPct(100);
    }, 600);
    return () => clearTimeout(timer);
  }, [simState]);

  function triggerCheckin() {
    if (simState !== 'idle') return;
    setSaldo(s => s - currentVehicle.instap);
    setBeepA(true); setTimeout(() => setBeepA(false), 900);
    playBeep(1);
    setSimState('inchecken');
  }

  function triggerCheckout() {
    if (simState !== 'reizen') return;
    setSaldo(s => s - (currentVehicle.rit - currentVehicle.instap));
    setBeepB(true); setTimeout(() => setBeepB(false), 900);
    playBeep(2);
    setSimState('uitchecken');
    setTrainPct(100);
  }

  function reset() {
    setSimState('idle');
    setSaldo(SALDO_START);
    setTrainPct(0);
    setProgress(0);
    setSubtitle('');
    setPlaying(false);
    setHighlightVehicle(null);
    setHighlightPayment(null);
    beepedRef.current.clear();
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }

  const checkedIn  = simState !== 'idle';
  const isReizen   = simState === 'reizen';
  const checkedOut = simState === 'uitchecken';

  // Train CSS transition: smooth during audio (0.3s to follow timeupdate), slow manual animation (4s)
  const trainTransition = playing
    ? 'left 0.3s linear'
    : 'left 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // left position: 60px at 0%, calc(100% - 68px) at 100%
  const trainLeft = trainPct === 0 ? '60px' : trainPct === 100
    ? 'calc(100% - 68px)'
    : `calc(60px + (100% - 128px) * ${trainPct / 100})`;

  return (
    <>
      <style>{`
        @keyframes nudge {
          0%, 100% { transform: translateX(0); }
          40%       { transform: translateX(4px); }
          70%       { transform: translateX(-2px); }
        }
        @keyframes beepRing {
          0%   { transform: scale(1);   opacity: 0.85; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes factSlide {
          0%   { opacity: 0; transform: translateY(6px); }
          12%  { opacity: 1; transform: translateY(0); }
          88%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes vehiclePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
      `}</style>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => { setPlaying(false); setSubtitle(''); setProgress(1); }}
        />
      )}

      <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
            Interactieve les
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
            Oefen met inchecken en uitchecken
          </p>
        </div>

        {/* Audio player */}
        <div className="px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--color-outline-variant)', opacity: audioUrl ? 1 : 0.55 }}>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={togglePlay}
              disabled={!audioUrl}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: playing ? '#fe762c' : 'transparent',
                border: playing ? 'none' : '2px solid #fe762c',
                color: playing ? '#fff' : '#fe762c',
                cursor: audioUrl ? 'pointer' : 'default',
              }}
              aria-label={playing ? 'Pauzeer' : 'Speel les af'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                {playing ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: 'var(--color-on-surface)' }}>
                {playing ? 'Speelt...' : audioUrl ? 'Luister naar de les' : 'Audio les'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                {audioUrl ? 'Animatie speelt automatisch mee' : 'Druk op afspelen om te beginnen'}
              </p>
            </div>
            <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
              {formatTime(duration)}
            </span>
          </div>
          <div
            ref={progressBarRef}
            onClick={audioUrl ? seekTo : undefined}
            className="w-full h-1.5 rounded-full mb-2"
            style={{ background: 'var(--color-outline-variant)', cursor: audioUrl ? 'pointer' : 'default' }}
          >
            <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: '#fe762c', transition: 'width 0.1s linear' }} />
          </div>
          <div
            className="min-h-[36px] flex items-center px-3 py-2 rounded-xl"
            style={{ background: subtitle ? 'var(--color-surface-container-low)' : 'transparent' }}
          >
            {subtitle
              ? <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>{subtitle}</p>
              : <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {audioUrl ? 'Druk op afspelen om de les te beluisteren' : 'Of gebruik de knoppen hieronder om zelf te oefenen'}
                </p>
            }
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* ── Vehicle selector ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>
              Kies je vervoermiddel
            </p>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLES.map(v => {
                const isSelected    = vehicle === v.id;
                const isHighlighted = highlightVehicle === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => { if (simState === 'idle') { setVehicle(v.id); setSaldo(SALDO_START); } }}
                    disabled={simState !== 'idle'}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
                    style={{
                      background: isSelected ? '#002b6d' : 'var(--color-surface-container-low)',
                      border: isHighlighted ? '2px solid #fe762c' : '2px solid transparent',
                      cursor: simState === 'idle' ? 'pointer' : 'default',
                      animation: isHighlighted ? 'vehiclePop 0.4s ease-out' : 'none',
                      transition: 'background 0.25s, border-color 0.15s',
                    }}
                    aria-label={v.label}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 22,
                        color: isSelected ? '#fff' : 'var(--color-on-surface-variant)',
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      {v.icon}
                    </span>
                    <span className="text-[10px] font-bold leading-none" style={{ color: isSelected ? '#fff' : 'var(--color-on-surface-variant)' }}>
                      {v.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                Vervoerder: <strong style={{ color: 'var(--color-on-surface)' }}>{currentVehicle.vervoerder}</strong>
              </span>
              <span className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                Instaptarief: <strong style={{ color: 'var(--color-on-surface)' }}>{centsToEuro(currentVehicle.instap)}</strong>
              </span>
            </div>
          </div>

          {/* ── Payment method selector ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>
              Betaalmethode
            </p>
            <div className="flex gap-2">
              {PAYMENTS.map(p => {
                const isSelected    = payment === p.id;
                const isHighlighted = highlightPayment === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold"
                    style={{
                      background: isSelected ? '#fe762c' : 'var(--color-surface-container-low)',
                      color: isSelected ? '#fff' : 'var(--color-on-surface-variant)',
                      border: isHighlighted ? '2px solid #002b6d' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.25s, color 0.25s, border-color 0.15s',
                      animation: isHighlighted ? 'vehiclePop 0.4s ease-out' : 'none',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>
                      {p.icon}
                    </span>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Saldo + step badges ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#002b6d' }}>
                <span className="material-symbols-outlined text-white" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                  {PAYMENTS.find(p => p.id === payment)?.icon ?? 'credit_card'}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>Saldo</p>
                <p className="text-base font-extrabold tabular-nums" style={{ color: saldo < 300 ? '#dc2626' : 'var(--color-on-surface)', transition: 'color 0.3s' }}>
                  {centsToEuro(saldo)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {(['inchecken', 'reizen', 'uitchecken'] as SimState[]).map((s, i) => {
                const done = (simState === 'inchecken' && i === 0) || (simState === 'reizen' && i <= 1) || simState === 'uitchecken';
                const labels = ['Ingecheckt', 'Reizen', 'Uitgecheckt'];
                return (
                  <div key={s} className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: done ? '#002b6d' : 'var(--color-surface-container)', color: done ? '#fff' : 'var(--color-on-surface-variant)', transition: 'background 0.3s, color 0.3s' }} title={labels[i]}>
                    {done
                      ? <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>check</span>
                      : <span style={{ fontSize: 11 }}>{i + 1}</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Journey visualisation ── */}
          <div className="relative rounded-2xl overflow-hidden flex items-stretch" style={{ background: 'var(--color-surface-container-low)', minHeight: 130 }}>
            {/* Track base */}
            <div className="absolute" style={{ top: '50%', left: 72, right: 72, height: 3, background: 'var(--color-outline-variant)', transform: 'translateY(-50%)', borderRadius: 2 }} />
            {/* Track fill — mirrors train position */}
            <div className="absolute" style={{
              top: '50%',
              left: 72,
              width: `calc((100% - 144px) * ${trainPct / 100})`,
              height: 3,
              background: checkedIn ? '#002b6d' : 'var(--color-outline-variant)',
              transform: 'translateY(-50%)',
              borderRadius: 2,
              transition: playing ? 'width 0.3s linear, background 0.4s' : 'width 4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.4s',
            }} />

            {/* Vehicle icon — position driven by trainPct */}
            <div className="absolute" style={{
              top: '50%',
              left: trainLeft,
              transform: 'translateY(-50%)',
              transition: trainTransition,
              zIndex: 2,
            }}>
              <div className="flex items-center justify-center rounded-xl" style={{
                width: 40, height: 40,
                background: checkedIn ? '#002b6d' : 'var(--color-surface-container-high)',
                transition: 'background 0.4s',
                boxShadow: checkedIn ? '0 2px 12px rgba(0,43,109,0.35)' : 'none',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: checkedIn ? '#fff' : 'var(--color-on-surface-variant)', fontVariationSettings: "'FILL' 1", transition: 'color 0.3s' }}>
                  {currentVehicle.icon}
                </span>
              </div>
            </div>

            {/* Station A */}
            <div className="flex flex-col items-center justify-center gap-1 shrink-0" style={{ width: 72 }}>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>Station A</p>
              <button
                onClick={triggerCheckin}
                disabled={simState !== 'idle'}
                className="relative flex flex-col items-center justify-center rounded-xl gap-0.5"
                style={{
                  width: 44, height: 52,
                  background: checkedIn ? '#16a34a' : '#fe762c',
                  opacity: simState !== 'idle' ? 0.5 : 1,
                  cursor: simState === 'idle' ? 'pointer' : 'default',
                  transition: 'background 0.4s, opacity 0.3s',
                  border: 'none',
                  boxShadow: simState === 'idle' ? '0 2px 10px rgba(254,118,44,0.45)' : 'none',
                }}
                aria-label="Inchecken"
              >
                {beepA && <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', animation: 'beepRing 0.8s ease-out forwards' }} />}
                <span className="material-symbols-outlined text-white" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                  {checkedIn ? 'check_circle' : 'contactless'}
                </span>
                <span className="text-[8px] font-bold text-white/90 leading-none">{checkedIn ? '✓ 1 piep' : 'inchecken'}</span>
              </button>
              <div className="rounded-full" style={{ width: 4, height: checkedIn ? 6 : 22, background: checkedIn ? '#16a34a' : '#002b6d', transition: 'height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s' }} />
            </div>

            {/* Centre status */}
            <div className="flex-1 flex items-end justify-center pb-3">
              {simState === 'idle' && (
                <div className="flex items-center gap-1.5">
                  <span style={{ display: 'inline-block', animation: 'nudge 1s ease-in-out infinite', fontSize: 14 }}>👆</span>
                  <p className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Tik je kaart op de lezer</p>
                </div>
              )}
              {simState === 'reizen' && <p className="text-[11px] font-semibold" style={{ color: '#002b6d' }}>Je reist... vergeet niet uit te checken!</p>}
              {simState === 'uitchecken' && <p className="text-[11px] font-semibold" style={{ color: '#16a34a' }}>Goed gedaan! Ritprijs: {centsToEuro(currentVehicle.rit)}</p>}
            </div>

            {/* Station B */}
            <div className="flex flex-col items-center justify-center gap-1 shrink-0" style={{ width: 72 }}>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>Station B</p>
              <button
                onClick={triggerCheckout}
                disabled={simState !== 'reizen'}
                className="relative flex flex-col items-center justify-center rounded-xl gap-0.5"
                style={{
                  width: 44, height: 52,
                  background: checkedOut ? '#16a34a' : isReizen ? '#fe762c' : 'var(--color-surface-container-high)',
                  opacity: isReizen ? 1 : checkedOut ? 0.6 : 0.35,
                  cursor: isReizen ? 'pointer' : 'default',
                  transition: 'background 0.4s, opacity 0.3s',
                  border: 'none',
                  boxShadow: isReizen ? '0 2px 10px rgba(254,118,44,0.45)' : 'none',
                }}
                aria-label="Uitchecken"
              >
                {beepB && <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', animation: 'beepRing 0.8s ease-out forwards' }} />}
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1", color: simState === 'idle' ? 'var(--color-on-surface-variant)' : '#fff' }}>
                  {checkedOut ? 'check_circle' : 'contactless'}
                </span>
                <span className="text-[8px] font-bold leading-none" style={{ color: simState === 'idle' ? 'var(--color-on-surface-variant)' : 'rgba(255,255,255,0.9)' }}>
                  {checkedOut ? '✓ 2 piepen' : 'uitchecken'}
                </span>
              </button>
              <div className="rounded-full" style={{ width: 4, height: checkedOut ? 6 : 22, background: checkedOut ? '#16a34a' : '#002b6d', transition: 'height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s' }} />
            </div>
          </div>

          {/* Reset */}
          {simState === 'uitchecken' && (
            <button onClick={reset} className="w-full py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>refresh</span>
              Opnieuw oefenen
            </button>
          )}

          {/* Cycling fact */}
          <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ background: 'var(--color-surface-container-low)', minHeight: 44 }}>
            <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 15, color: '#fe762c' }}>info</span>
            <p key={factIdx} className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-variant)', animation: 'factSlide 3.5s ease-in-out forwards' }}>
              {FACTS[factIdx]}
            </p>
          </div>

          {/* Exam tip */}
          <div className="rounded-xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>lightbulb</span>
            <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>
              <strong>Examentip:</strong> Als je vergeet uit te checken, betaal je het <strong>maximumtarief</strong>. Gebruik altijd <strong>dezelfde pas</strong> voor in- én uitchecken.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
