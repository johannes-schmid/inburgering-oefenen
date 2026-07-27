'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import type { AudioCue } from '@/lib/leren-audio-cues';

const GEO_URL = '/data/world-110m.topojson';

const NAVY = '#002b6d';
const ORANGE = '#fe762c';

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ──────────────────────────────────────────────────────────────
   COLONIES — the former Dutch colonies
   ────────────────────────────────────────────────────────────── */
type Colony = {
  id: string;
  label: string;
  modern: string;
  coordinates: [number, number];
  icon: string;
  color: string;
  blurb: string;
  status: string;
};

const COLONIES: Colony[] = [
  {
    id: 'indie',
    label: 'Nederlands-Indië',
    modern: 'nu: Indonesië',
    coordinates: [110, -5],
    icon: 'forest',
    color: '#0e9f6e',
    blurb: 'De grootste kolonie. Nederland verdiende hier veel geld met specerijen, koffie en suiker.',
    status: 'In 1945 onafhankelijk als Indonesië.',
  },
  {
    id: 'suriname',
    label: 'Suriname',
    modern: 'nu: zelfstandig land',
    coordinates: [-55.5, 4.2],
    icon: 'agriculture',
    color: ORANGE,
    blurb: 'Op de plantages werkten tot slaaf gemaakte mensen onder dwang aan suiker en koffie.',
    status: 'In 1975 een onafhankelijk land.',
  },
  {
    id: 'antillen',
    label: 'Nederlandse Antillen',
    modern: 'Caribische eilanden',
    coordinates: [-69, 12.2],
    icon: 'sailing',
    color: '#7c3aed',
    blurb: 'Zes eilanden in de Caraïben. Belangrijke doorvoerhaven in de handel.',
    status: 'Sinds 1954 geen kolonie meer. Drie eilanden zijn zelfstandig, drie zijn bijzondere gemeenten van Nederland.',
  },
];

/* ──────────────────────────────────────────────────────────────
   TRIANGLE TRADE — the three legs of de driehoekshandel
   ────────────────────────────────────────────────────────────── */
const NODE = {
  nederland: { id: 'nederland', label: 'Nederland', coordinates: [4.9, 52.4] as [number, number], color: NAVY,   icon: 'sailing' },
  afrika:    { id: 'afrika',    label: 'Afrika',    coordinates: [-2, 7] as [number, number],     color: '#b45309', icon: 'groups' },
  amerika:   { id: 'amerika',   label: 'Amerika',   coordinates: [-58, 8] as [number, number],    color: ORANGE,  icon: 'agriculture' },
};

type Leg = {
  id: string;
  from: [number, number];
  to: [number, number];
  bend: number;
  color: string;
  icon: string;
  title: string;
  cargo: string;
  detail: string;
};

const LEGS: Leg[] = [
  {
    id: 'leg1',
    from: NODE.nederland.coordinates,
    to: NODE.afrika.coordinates,
    bend: 0.18,
    color: NAVY,
    icon: 'inventory_2',
    title: '1. Nederland → Afrika',
    cargo: 'Goederen',
    detail: 'Schepen voeren met handelswaar (textiel, wapens, alcohol) naar de kust van West-Afrika.',
  },
  {
    id: 'leg2',
    from: NODE.afrika.coordinates,
    to: NODE.amerika.coordinates,
    bend: 0.16,
    color: '#b45309',
    icon: 'groups',
    title: '2. Afrika → Amerika',
    cargo: 'Tot slaaf gemaakte mensen',
    detail: 'Nederlanders kochten mensen in Afrika en brachten ze onder vreselijke omstandigheden naar de plantages in Amerika.',
  },
  {
    id: 'leg3',
    from: NODE.amerika.coordinates,
    to: NODE.nederland.coordinates,
    bend: 0.18,
    color: ORANGE,
    icon: 'coffee',
    title: '3. Amerika → Nederland',
    cargo: 'Suiker, koffie, tabak, katoen',
    detail: 'De producten van de plantages gingen terug naar Nederland en werden daar met veel winst verkocht.',
  },
];

/** Sample points along a quadratic Bézier in lon/lat space so geoPath draws a smooth arc. */
function arcPoints(from: [number, number], to: [number, number], bend: number): [number, number][] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const ctrl: [number, number] = [mid[0] - dy * bend, mid[1] + dx * bend];
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0],
      u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1],
    ]);
  }
  return pts;
}

/** Position along the same quadratic Bézier at parameter t (0..1) — used for the travelling marker. */
function bezierPoint(from: [number, number], to: [number, number], bend: number, t: number): [number, number] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const ctrl: [number, number] = [mid[0] - dy * bend, mid[1] + dx * bend];
  const u = 1 - t;
  return [
    u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0],
    u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1],
  ];
}

type Mode = 'kolonien' | 'handel';

export default function ColoniesMap({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const [mode, setMode] = useState<Mode>('kolonien');
  const [activeColony, setActiveColony] = useState<string | null>(null);
  const [activeLeg, setActiveLeg] = useState<string | null>(null);
  const [travelT, setTravelT] = useState(0);
  // The generator emits .mp3 (ElevenLabs) or .wav (macOS say); try mp3, fall back to wav.
  const [audioExt, setAudioExt] = useState<'mp3' | 'wav'>('mp3');

  // Animate a marker travelling along the active trade-route leg
  useEffect(() => {
    if (mode !== 'handel' || !activeLeg) { setTravelT(0); return; }
    let raf = 0;
    let start: number | undefined;
    const DURATION = 2600; // ms for one full traversal
    const tick = (ts: number) => {
      if (start === undefined) start = ts;
      setTravelT((((ts - start) % DURATION) / DURATION));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, activeLeg]);

  // Audio lesson state (mirrors NetherlandsMap)
  const audioRef = useRef<HTMLAudioElement>(null);
  const cuesRef = useRef<AudioCue[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitle, setSubtitle] = useState('');

  // Prefer DB-sourced cues (via props); fall back to the static file for local dev
  useEffect(() => {
    if (audioCues && audioCues.length > 0) {
      cuesRef.current = audioCues;
      setAudioReady(true);
    } else {
      fetch('/audio/leren/thema1-kolonien-cues.json')
        .then((r) => r.json())
        .then((data: AudioCue[]) => { cuesRef.current = data; setAudioReady(true); })
        .catch(() => {});
    }
  }, [audioCues]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const cues = cuesRef.current;

    let latestSubtitle: string | undefined;
    let latestMode: Mode | null | undefined;
    let latestColony: string | null | undefined;
    let latestLeg: string | null | undefined;

    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (latestSubtitle === undefined && cues[i].subtitle !== undefined) latestSubtitle = cues[i].subtitle;
      if (latestMode === undefined && cues[i].mode !== undefined) latestMode = cues[i].mode;
      if (latestColony === undefined && cues[i].colony !== undefined) latestColony = cues[i].colony;
      if (latestLeg === undefined && cues[i].leg !== undefined) latestLeg = cues[i].leg;
      if (latestSubtitle !== undefined && latestMode !== undefined && latestColony !== undefined && latestLeg !== undefined) break;
    }

    if (latestSubtitle !== undefined) setSubtitle(latestSubtitle);
    if (latestMode !== undefined && latestMode !== null) setMode(latestMode);
    if (latestColony !== undefined) setActiveColony(latestColony);
    if (latestLeg !== undefined) setActiveLeg(latestLeg);
    setProgress(audio.duration ? t / audio.duration : 0);
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }

  const projection =
    mode === 'kolonien'
      ? { center: [28, 8] as [number, number], scale: 125 }
      : { center: [-25, 32] as [number, number], scale: 200 };

  const selectedColony = COLONIES.find((c) => c.id === activeColony) ?? null;
  const selectedLeg = LEGS.find((l) => l.id === activeLeg) ?? null;

  function switchMode(next: Mode) {
    setMode(next);
    setActiveColony(null);
    setActiveLeg(null);
  }

  return (
    <>
      <style>{`
        @keyframes dashFlow { to { stroke-dashoffset: -28; } }
        .trade-arc { animation: dashFlow 1.1s linear infinite; }
        @keyframes pinPop {
          0%   { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .pin-pop { animation: pinPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes ringPulse {
          0%   { r: 11; opacity: 0.55; }
          100% { r: 26; opacity: 0; }
        }
        .ring-pulse { animation: ringPulse 1.4s ease-out infinite; }
        @keyframes pinThrob {
          0%, 100% { r: 14; }
          50%      { r: 17.5; }
        }
        .pin-throb { animation: pinThrob 1.1s ease-in-out infinite; }
        @keyframes labelPop {
          0%   { opacity: 0; transform: translateY(3px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .subtitle-in { animation: labelPop 0.4s ease-out both; }
        @keyframes travelGlow {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 0.35; }
        }
        .travel-glow { animation: travelGlow 0.9s ease-in-out infinite; }
      `}</style>

      <audio
        ref={audioRef}
        src={audioUrl ?? `/audio/leren/thema1-kolonien.${audioExt}`}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onError={() => { if (!audioUrl && audioExt === 'mp3') setAudioExt('wav'); }}
        onEnded={() => { setPlaying(false); setSubtitle(''); setProgress(0); }}
      />

      <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
            Interactieve kaart
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
            De koloniën en de driehoekshandel
          </p>
        </div>

        {/* Audio player */}
        {audioReady && (
          <div className="px-4 pt-3 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={togglePlay}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: playing ? ORANGE : 'transparent',
                  border: playing ? 'none' : `2px solid ${ORANGE}`,
                  color: playing ? '#fff' : ORANGE,
                }}
                aria-label={playing ? 'Pauzeer' : 'Speel les af'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                  {playing ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: 'var(--color-on-surface)' }}>
                  {playing ? 'Speelt...' : 'Luister naar de les'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                  De koloniën, de driehoekshandel en Keti Koti
                </p>
              </div>
              <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                {formatTime(duration)}
              </span>
            </div>

            {/* Progress bar */}
            <div
              ref={progressBarRef}
              onClick={seekTo}
              className="w-full h-1.5 rounded-full cursor-pointer mb-2"
              style={{ background: 'var(--color-outline-variant)' }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-100"
                style={{ width: `${progress * 100}%`, background: ORANGE }}
              />
            </div>

            {/* Subtitle */}
            <div
              className="min-h-[36px] flex items-center px-3 py-2 rounded-xl transition-all"
              style={{ background: subtitle ? 'var(--color-surface-container-low)' : 'transparent' }}
            >
              {subtitle ? (
                <p key={subtitle} className="text-xs leading-relaxed subtitle-in" style={{ color: 'var(--color-on-surface)' }}>{subtitle}</p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Druk op afspelen om de les te beluisteren
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mode tabs */}
        <div className="px-4 pt-3 pb-3 flex gap-2 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          {([
            { id: 'kolonien', label: 'De koloniën', icon: 'public' },
            { id: 'handel', label: 'De driehoekshandel', icon: 'sailing' },
          ] as { id: Mode; label: string; icon: string }[]).map((t) => {
            const on = mode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchMode(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all"
                style={{
                  background: on ? NAVY : 'var(--color-surface-container-low)',
                  color: on ? '#fff' : 'var(--color-on-surface-variant)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row">
          {/* Map */}
          <div className="sm:w-[58%] px-1 py-2 flex items-center justify-center" style={{ background: '#eef1f6' }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={projection}
              width={800}
              height={460}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: '#d7dbe3', stroke: '#eef1f6', strokeWidth: 0.5, outline: 'none' },
                        hover:   { fill: '#d7dbe3', stroke: '#eef1f6', strokeWidth: 0.5, outline: 'none' },
                        pressed: { fill: '#d7dbe3', stroke: '#eef1f6', strokeWidth: 0.5, outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* ── KOLONIËN MODE ── */}
              {mode === 'kolonien' && (
                <>
                  {/* Nederland home marker */}
                  <Marker coordinates={NODE.nederland.coordinates}>
                    <g className="pin-pop">
                      <circle r={9} fill={NAVY} stroke="#fff" strokeWidth={2.5}
                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))' }} />
                      <text textAnchor="middle" dy={-15} style={labelStyle(NAVY)}>Nederland</text>
                    </g>
                  </Marker>

                  {COLONIES.map((c) => {
                    const on = activeColony === c.id;
                    return (
                      <Marker key={c.id} coordinates={c.coordinates}>
                        <g
                          className="pin-pop"
                          onClick={() => setActiveColony(on ? null : c.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {on && <circle r={11} fill={c.color} opacity={0.4} className="ring-pulse" style={{ pointerEvents: 'none' }} />}
                          {on && <circle r={11} fill="none" stroke={c.color} strokeWidth={2} opacity={0.5} className="ring-pulse" style={{ pointerEvents: 'none', animationDelay: '0.5s' }} />}
                          <circle r={on ? 15 : 13} fill={c.color} stroke="#fff" strokeWidth={on ? 3 : 2}
                            className={on ? 'pin-throb' : undefined}
                            style={{ filter: `drop-shadow(0 2px 5px ${c.color}88)`, transition: 'stroke-width 0.2s' }} />
                          <text textAnchor="middle" dominantBaseline="central"
                            style={{ fontFamily: 'Material Symbols Outlined', fontSize: 15, fill: '#fff', pointerEvents: 'none', userSelect: 'none' }}>
                            {c.icon}
                          </text>
                        </g>
                      </Marker>
                    );
                  })}
                </>
              )}

              {/* ── DRIEHOEKSHANDEL MODE ── */}
              {mode === 'handel' && (
                <>
                  {LEGS.map((leg) => {
                    const on = activeLeg === leg.id;
                    return (
                      <Line
                        key={leg.id}
                        coordinates={arcPoints(leg.from, leg.to, leg.bend)}
                        stroke={leg.color}
                        strokeWidth={on ? 4 : 2.5}
                        strokeLinecap="round"
                        strokeDasharray="2 6"
                        fill="none"
                        className="trade-arc"
                        style={{
                          opacity: on || !activeLeg ? 1 : 0.3,
                          filter: on ? `drop-shadow(0 0 4px ${leg.color})` : 'none',
                          transition: 'opacity 0.2s, stroke-width 0.2s, filter 0.2s',
                        }}
                      />
                    );
                  })}

                  {Object.values(NODE).map((n) => (
                    <Marker key={n.id} coordinates={n.coordinates}>
                      <g className="pin-pop">
                        <circle r={14} fill={n.color} stroke="#fff" strokeWidth={2.5}
                          style={{ filter: `drop-shadow(0 2px 5px ${n.color}88)` }} />
                        <text textAnchor="middle" dominantBaseline="central"
                          style={{ fontFamily: 'Material Symbols Outlined', fontSize: 15, fill: '#fff', pointerEvents: 'none', userSelect: 'none' }}>
                          {n.icon}
                        </text>
                        <text textAnchor="middle" dy={-20} style={labelStyle(n.color)}>{n.label}</text>
                      </g>
                    </Marker>
                  ))}

                  {/* Travelling cargo marker — flows along the active leg as it is narrated */}
                  {selectedLeg && [
                    { lag: 0.14, r: 2.5, op: 0.22 },
                    { lag: 0.07, r: 3.5, op: 0.45 },
                    { lag: 0,    r: 6,   op: 1, head: true },
                  ].map((d, i) => {
                    const t = Math.max(0, travelT - d.lag);
                    const pos = bezierPoint(selectedLeg.from, selectedLeg.to, selectedLeg.bend, t);
                    return (
                      <Marker key={`trav-${i}`} coordinates={pos}>
                        {d.head && (
                          <circle r={10} fill={selectedLeg.color} opacity={0.25} className="travel-glow" style={{ pointerEvents: 'none' }} />
                        )}
                        <circle
                          r={d.r}
                          fill={selectedLeg.color}
                          stroke={d.head ? '#fff' : 'none'}
                          strokeWidth={d.head ? 2 : 0}
                          opacity={d.op}
                          style={{ filter: d.head ? `drop-shadow(0 0 5px ${selectedLeg.color})` : 'none', pointerEvents: 'none' }}
                        />
                        {d.head && (
                          <text textAnchor="middle" dominantBaseline="central"
                            style={{ fontFamily: 'Material Symbols Outlined', fontSize: 8, fill: '#fff', pointerEvents: 'none', userSelect: 'none' }}>
                            {selectedLeg.icon}
                          </text>
                        )}
                      </Marker>
                    );
                  })}
                </>
              )}
            </ComposableMap>
          </div>

          {/* Info panel */}
          <div className="sm:w-[42%] p-4 flex flex-col gap-3 justify-center">
            {mode === 'kolonien' ? (
              <>
                {/* Detail or hint */}
                <div className="rounded-2xl p-4 flex flex-col justify-center"
                  style={{ background: selectedColony ? selectedColony.color : 'var(--color-surface-container-low)', transition: 'background 0.25s ease', minHeight: 96 }}>
                  {selectedColony ? (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Kolonie · {selectedColony.modern}
                      </p>
                      <p className="font-extrabold text-base text-white leading-tight">{selectedColony.label}</p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>{selectedColony.blurb}</p>
                      <p className="text-[11px] mt-2 font-semibold text-white">{selectedColony.status}</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-on-surface-variant)' }}>touch_app</span>
                      <p className="text-sm leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>Tik op een kolonie op de kaart</p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {COLONIES.map((c) => {
                    const on = activeColony === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveColony(on ? null : c.id)}
                        className="w-full flex items-center gap-3 rounded-xl p-2.5 transition-all duration-300 text-left"
                        style={{ background: on ? c.color : 'var(--color-surface-container-low)', boxShadow: on ? `0 0 0 2px ${c.color}40` : 'none' }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: on ? 'rgba(255,255,255,0.25)' : c.color }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>{c.icon}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: on ? '#fff' : 'var(--color-on-surface)' }}>{c.label}</p>
                          <p className="text-[11px]" style={{ color: on ? 'rgba(255,255,255,0.8)' : 'var(--color-on-surface-variant)' }}>{c.modern}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Leg detail or hint */}
                <div className="rounded-2xl p-4 flex flex-col justify-center"
                  style={{ background: selectedLeg ? selectedLeg.color : 'var(--color-surface-container-low)', transition: 'background 0.25s ease', minHeight: 96 }}>
                  {selectedLeg ? (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {selectedLeg.cargo}
                      </p>
                      <p className="font-extrabold text-base text-white leading-tight">{selectedLeg.title}</p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>{selectedLeg.detail}</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-on-surface-variant)' }}>touch_app</span>
                      <p className="text-sm leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>Tik op een route om uitleg te zien</p>
                    </div>
                  )}
                </div>

                {/* Legend — the 3 legs */}
                <div className="space-y-2">
                  {LEGS.map((leg) => {
                    const on = activeLeg === leg.id;
                    return (
                      <button
                        key={leg.id}
                        onClick={() => setActiveLeg(on ? null : leg.id)}
                        className="w-full flex items-center gap-3 rounded-xl p-2.5 transition-all duration-300 text-left"
                        style={{ background: on ? leg.color : 'var(--color-surface-container-low)', boxShadow: on ? `0 0 0 2px ${leg.color}40` : 'none' }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: on ? 'rgba(255,255,255,0.25)' : leg.color }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>{leg.icon}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: on ? '#fff' : 'var(--color-on-surface)' }}>{leg.title}</p>
                          <p className="text-[11px]" style={{ color: on ? 'rgba(255,255,255,0.8)' : 'var(--color-on-surface-variant)' }}>{leg.cargo}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* KNM exam tip */}
            <div className="rounded-xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>lightbulb</span>
              <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>
                <strong>Examentip:</strong> in <strong>1863</strong> werd de slavernij afgeschaft — elk jaar herdacht op <strong>1 juli (Keti Koti)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function labelStyle(color: string): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 800,
    fill: color,
    paintOrder: 'stroke',
    stroke: '#fff',
    strokeWidth: 3,
    strokeLinejoin: 'round',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: 'var(--font-body, sans-serif)',
  };
}
