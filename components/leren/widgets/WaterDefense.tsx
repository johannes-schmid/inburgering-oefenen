'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';

type ElementId = 'dijk' | 'windmolen' | 'polder' | 'deltawerken' | 'afsluitdijk' | 'ramp1953';

interface ElementInfo {
  label: string;
  icon: string;
  color: string;
  body: string;
  tip?: string;
}

const ELEMENTS: Record<ElementId, ElementInfo> = {
  dijk: {
    label: 'De dijk',
    icon: 'shield',
    color: '#002b6d',
    body: 'Een dijk is een lange wal van aarde of steen die water tegenhoudt. Nederland heeft meer dan 17.000 km aan dijken en duinen. Zonder dijken zou 60% van Nederland onder water staan.',
    tip: 'Examentip: Dijken beschermen Nederland tegen overstromingen van de zee en rivieren.',
  },
  windmolen: {
    label: 'De windmolen',
    icon: 'wind_power',
    color: '#5d3a1a',
    body: 'Vroeger gebruikten Nederlanders windmolens om water uit de polder te pompen. De wind dreef de molen aan, die het water via sluizen omhoog pompte naar de zee of rivier. Zo maakten ze droog land van natte gebieden.',
    tip: 'Examentip: Windmolens worden ook gebruikt om meel te malen en hout te zagen — maar in polders waren ze waterpomp.',
  },
  polder: {
    label: 'De polder',
    icon: 'terrain',
    color: '#558b2f',
    body: 'Een polder is een stuk land dat Nederlanders van water hebben gemaakt. Ze bouwden een dijk om het water, pompten het water eruit en maakten het land droog. Flevoland is de grootste polder ter wereld — het bestaat pas sinds 1968.',
    tip: 'Examentip: "Nederland" betekent letterlijk laag land. Een groot deel ligt lager dan de zeespiegel.',
  },
  deltawerken: {
    label: 'De Deltawerken',
    icon: 'water_lock',
    color: '#1d428a',
    body: 'De Deltawerken zijn een reeks grote dammen en stormvloedkeringen in Zeeland en Zuid-Holland. Ze zijn gebouwd na de Watersnoodramp van 1953 en beschermen tegen overstromingen vanuit de Noordzee.',
    tip: 'Examentip: De Deltawerken zijn gebouwd nà 1953 als reactie op de Watersnoodramp.',
  },
  afsluitdijk: {
    label: 'De Afsluitdijk',
    icon: 'remove_road',
    color: '#a24000',
    body: 'De Afsluitdijk is de grootste dijk van Nederland — 32 km lang, van Noord-Holland naar Friesland. Hij sluit de Waddenzee af van het IJsselmeer (vroeger de Zuiderzee). Gebouwd tussen 1927 en 1932.',
    tip: 'Examentip: De Afsluitdijk scheidt de Waddenzee van het IJsselmeer (vroeger Zuiderzee).',
  },
  ramp1953: {
    label: '1953 — De Watersnoodramp',
    icon: 'warning',
    color: '#ba1a1a',
    body: 'Op 1 februari 1953 brak een zware storm de dijken door in Zeeland en Zuid-Holland. Meer dan 1.800 mensen kwamen om het leven. Bijna 100.000 mensen moesten vluchten. Dit leidde direct tot de bouw van de Deltawerken.',
    tip: 'Examentip: 1953 — Watersnoodramp. Dit is een veelgestelde KNM-vraag.',
  },
};

// ── scene geometry ────────────────────────────────────────────────────────────
const VB_X = 0, VB_Y = 6, VB_W = 380, VB_H = 234; // viewBox
const SEA_Y  = 118;   // calm sea waterline
const LAND_Y = 162;   // polder surface (below sea level — intentional)
const BOT    = 250;   // bottom of canvas
const DIKE_L = 148;   // dike left base x
const DIKE_R = 212;   // dike right base x
const DIKE_TOP_L = 162; const DIKE_TOP_R = 196; // dike peak x range
const DIKE_TOP_Y = 44; // dike peak y
const POLDER_X = DIKE_R; // polder starts here
const POLDER_W = 380 - POLDER_X;
const SURGE_MAX = 68; // max px the waterline rises

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// Windmill blade animation key — changes speed when active
function WindmillBlades({ active }: { active: boolean }) {
  return (
    <g style={{
      animation: `wd-spin ${active ? '1.2s' : '8s'} linear infinite`,
      transformBox: 'fill-box',
      transformOrigin: 'center',
      transition: 'none',
    }}>
      {/* 4 blades at 0°, 90°, 180°, 270° */}
      <rect x={298.5} y={68} width={3} height={56} fill={active ? '#c49a6c' : '#2c2016'} rx={1.5} />
      <rect x={272}   y={96} width={56} height={3} fill={active ? '#c49a6c' : '#2c2016'} rx={1.5} />
      {/* diagonal blades */}
      <line x1={281} y1={77}  x2={319} y2={121} stroke={active ? '#c49a6c' : '#2c2016'} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={319} y1={77}  x2={281} y2={121} stroke={active ? '#c49a6c' : '#2c2016'} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function House({ x, flooded, floodY }: { x: number; flooded: boolean; floodY: number }) {
  const submergeY = flooded ? Math.min(floodY, LAND_Y + 23) : LAND_Y + 23; // how high water reaches on house
  return (
    <g>
      {/* roof — always visible */}
      <polygon points={`${x - 18},${LAND_Y} ${x},${LAND_Y - 22} ${x + 18},${LAND_Y}`} fill={flooded ? '#8a3520' : '#c0432a'} />
      {/* walls */}
      <rect x={x - 14} y={LAND_Y} width={28} height={26} fill={flooded ? '#c8b89a' : '#f1e9da'} />
      {/* door */}
      <rect x={x - 4}  y={LAND_Y + 12} width={8} height={14} fill="#8a5a2b" rx={1} />
      {/* window */}
      <rect x={x - 11} y={LAND_Y + 4}  width={8} height={7}  fill={flooded ? '#6a9ab8' : '#9cc3e0'} rx={1} />
      {/* flood overlay on house — dark blue tint as water rises */}
      {flooded && (
        <rect x={x - 14} y={submergeY - 26} width={28} height={BOT - submergeY + 26}
              fill="rgba(10,50,120,0.55)" />
      )}
    </g>
  );
}

// Glowing outline ring drawn around an active element's bounding box
function ActiveRing({ x, y, w, h, color, pulse }: { x: number; y: number; w: number; h: number; color: string; pulse: boolean }) {
  return (
    <rect
      x={x - 4} y={y - 4} width={w + 8} height={h + 8}
      rx={6} ry={6}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      opacity={0.9}
      style={{ pointerEvents: 'none' }}
      className={pulse ? 'wd-ring-pulse' : undefined}
    />
  );
}

// Floating label pill (for ZEESPIEGEL, DIJK, POLDER)
function LabelPill({ x, y, text, sub, bg, textColor = '#fff' }: {
  x: number; y: number; text: string; sub?: string; bg: string; textColor?: string;
}) {
  const w = sub ? 90 : text.length * 6.5 + 16;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={x - w / 2} y={y - 11} width={w} height={sub ? 22 : 14} rx={4} fill={bg} opacity={0.92} />
      <text x={x} y={sub ? y - 2 : y + 1} textAnchor="middle" fill={textColor}
            style={{ fontSize: sub ? 7.5 : 8, fontWeight: 700, letterSpacing: '0.06em',
                     fontFamily: 'var(--font-body,sans-serif)' }}>
        {text}
      </text>
      {sub && (
        <text x={x} y={y + 9} textAnchor="middle" fill={textColor}
              style={{ fontSize: 6, opacity: 0.8, fontFamily: 'var(--font-body,sans-serif)' }}>
          {sub}
        </text>
      )}
    </g>
  );
}

// ── water pump particle animation (dots flow from polder to dike) ─────────────
function PumpParticles({ active }: { active: boolean }) {
  if (!active) return null;
  // 5 particles staggered across the pipe
  return (
    <g>
      {/* visible pipe */}
      <line x1={213} y1={LAND_Y - 2} x2={285} y2={LAND_Y - 2}
            stroke="#2a7fbf" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      {/* arrow head at dike end */}
      <polygon points={`213,${LAND_Y - 6} 213,${LAND_Y + 2} 205,${LAND_Y - 2}`}
               fill="#2a7fbf" opacity={0.7} />
      {[0, 1, 2, 3, 4].map(i => (
        <circle key={i} cx={0} cy={LAND_Y - 2} r={3.5} fill="#5bb8f5" opacity={0.9}
                style={{
                  animation: `wd-pump 1.4s linear ${i * 0.28}s infinite`,
                }} />
      ))}
    </g>
  );
}

export default function WaterDefense({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const [active, setActive]           = useState<ElementId | null>(null);
  const [audioActive, setAudioActive] = useState<ElementId | null>(null);
  const [surge, setSurge]             = useState(0);
  const [hasClicked, setHasClicked]   = useState(false);
  const [hintIdx, setHintIdx]         = useState(0);

  const audioRef       = useRef<HTMLAudioElement>(null);
  const cuesRef        = useRef<AudioCue[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [subtitle, setSubtitle]     = useState('');

  // Load cues
  useEffect(() => {
    if (audioCues && audioCues.length > 0) {
      cuesRef.current = audioCues; setAudioReady(true);
    } else {
      fetch('/audio/leren/thema1-water-cues.json')
        .then(r => r.json())
        .then((d: AudioCue[]) => { cuesRef.current = d; setAudioReady(true); })
        .catch(() => {});
    }
  }, [audioCues]);

  // When audio hits the 1953 ramp cue → drive surge up to trigger flood animation
  useEffect(() => {
    if (audioActive === 'ramp1953') setSurge(92);
    else if (audioActive !== null && surge > 50) setSurge(0); // reset after flood section
  }, [audioActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hint cycle
  const HINTS: ElementId[] = ['dijk', 'windmolen', 'polder'];
  const hintEl = hasClicked ? null : HINTS[hintIdx];
  useEffect(() => {
    if (hasClicked) return;
    const t = setInterval(() => setHintIdx(i => (i + 1) % HINTS.length), 1600);
    return () => clearInterval(t);
  }, [hasClicked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Audio → cue sync
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const cues = cuesRef.current;
    let latestSubtitle: string | undefined;
    let latestElement: ElementId | null | undefined;
    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (latestSubtitle === undefined && cues[i].subtitle !== undefined) latestSubtitle = cues[i].subtitle;
      if (latestElement === undefined && cues[i].element !== undefined)
        latestElement = cues[i].element as ElementId | null;
      if (latestSubtitle !== undefined && latestElement !== undefined) break;
    }
    if (latestSubtitle !== undefined) setSubtitle(latestSubtitle);
    if (latestElement !== undefined) setAudioActive(latestElement);
    setProgress(audio.duration ? t / audio.duration : 0);
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { setHasClicked(true); audio.play(); setPlaying(true); }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audio.duration;
  }

  function handleClick(id: ElementId) {
    setHasClicked(true);
    // Clicking ramp1953 → surge the water to show the flood
    if (id === 'ramp1953' && active !== 'ramp1953') setSurge(92);
    if (active === 'ramp1953' && id !== 'ramp1953')  setSurge(0);
    setActive(active === id ? null : id);
  }

  // ── derived scene state ───────────────────────────────────────────────────
  const waterY      = SEA_Y - (surge / 100) * SURGE_MAX;
  const displayActive = active ?? audioActive;
  const info        = displayActive ? ELEMENTS[displayActive] : null;
  const threatLevel = surge < 38 ? 'calm' : surge < 68 ? 'warn' : 'storm';
  const flooded     = surge >= 72; // water is above polder surface → flood
  // flood water Y on the polder side — same as waterY (water pours in at dike level)
  const floodPolderY = waterY;
  const windActive  = displayActive === 'windmolen';

  // Which element's ring to show, and its color
  const ringEl   = displayActive;
  const ringColor = ringEl ? ELEMENTS[ringEl].color : '#fff';
  const isAudioDriven = audioActive !== null && active === null;

  return (
    <>
      <style>{`
        @keyframes wd-wave  { from{transform:translateX(0)}    to{transform:translateX(-40px)} }
        @keyframes wd-spin  { from{transform:rotate(0deg)}     to{transform:rotate(360deg)} }
        @keyframes wd-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes wd-nudge { 0%,100%{transform:translateX(0)} 40%{transform:translateX(4px)} 70%{transform:translateX(-2px)} }
        @keyframes wd-flood { 0%{transform:scaleX(0)} 100%{transform:scaleX(1)} }
        @keyframes wd-pump  { 0%{transform:translateX(285px)} 100%{transform:translateX(213px)} }
        @keyframes wd-ring-pulse { 0%,100%{opacity:0.9;stroke-width:2.5} 50%{opacity:0.5;stroke-width:1.5} }
        @keyframes wd-wave2 { from{transform:translateX(0)} to{transform:translateX(38px)} }

        .wd-wave    { animation: wd-wave  3.2s linear infinite; }
        .wd-wave2   { animation: wd-wave2 2.8s linear infinite; }
        .wd-hint    { animation: wd-pulse 1.4s ease-in-out infinite; }
        .wd-nudge   { display:inline-block; animation: wd-nudge 1s ease-in-out infinite; }
        .wd-ring-pulse { animation: wd-ring-pulse 1.1s ease-in-out infinite; }
      `}</style>

      <audio
        ref={audioRef}
        src={audioUrl ?? '/audio/leren/thema1-water.mp3'}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setSubtitle(''); setProgress(0); setAudioActive(null); }}
      />

      <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
            Interactieve les
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
            Nederland en het water — klik op de elementen
          </p>
        </div>

        {/* Audio player */}
        {audioReady && (
          <div className="px-4 pt-3 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={togglePlay}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: playing ? '#fe762c' : 'transparent',
                         border: playing ? 'none' : '2px solid #fe762c',
                         color: playing ? '#fff' : '#fe762c' }}
                aria-label={playing ? 'Pauzeer' : 'Speel les af'}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                  {playing ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: 'var(--color-on-surface)' }}>
                  {playing ? 'Speelt...' : 'Luister naar de les'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Dijken, polders, de Deltawerken en de Afsluitdijk
                </p>
              </div>
              <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                {formatTime(duration)}
              </span>
            </div>
            <div ref={progressBarRef} onClick={seekTo}
                 className="w-full h-1.5 rounded-full cursor-pointer mb-2"
                 style={{ background: 'var(--color-outline-variant)' }}>
              <div className="h-full rounded-full transition-[width] duration-100"
                   style={{ width: `${progress * 100}%`, background: '#fe762c' }} />
            </div>
            <div className="min-h-[36px] flex items-center px-3 py-2 rounded-xl transition-all"
                 style={{ background: subtitle ? 'var(--color-surface-container-low)' : 'transparent' }}>
              {subtitle
                ? <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>{subtitle}</p>
                : <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Druk op afspelen om de les te beluisteren</p>
              }
            </div>
          </div>
        )}

        {/* Scene + info panel */}
        <div className="flex flex-col sm:flex-row">

          {/* SVG */}
          <div className="sm:w-[60%] flex items-stretch">
            <svg
              viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
              className="w-full h-auto block"
              style={{ minHeight: 0 }}
              aria-label="Doorsnede van Nederland met zee, dijk, polder en windmolen"
            >
              <defs>
                <linearGradient id="wd-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={threatLevel === 'storm' ? '#5a7a9a' : '#c8e8ff'} />
                  <stop offset="100%" stopColor={threatLevel === 'storm' ? '#9ab4cc' : '#e8f5ff'} />
                </linearGradient>
                <linearGradient id="wd-sea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={threatLevel === 'storm' ? '#144060' : '#1e6fa8'} />
                  <stop offset="100%" stopColor="#0a2e52" />
                </linearGradient>
                <linearGradient id="wd-flood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1060a8" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="#0a2e52" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="wd-earth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9c6b3f" />
                  <stop offset="100%" stopColor="#6e4626" />
                </linearGradient>
                <linearGradient id="wd-dike-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={displayActive === 'dijk' ? '#4a70c0' : '#8a5c30'} />
                  <stop offset="100%" stopColor={displayActive === 'dijk' ? '#1d428a' : '#6e4020'} />
                </linearGradient>
                <clipPath id="wd-polder-clip">
                  <rect x={POLDER_X} y={0} width={POLDER_W} height={BOT} />
                </clipPath>
              </defs>

              {/* ── Sky ── */}
              <rect x={0} y={0} width={380} height={BOT} fill="url(#wd-sky)"
                    style={{ transition: 'fill 0.9s ease' }} />

              {/* Calm clouds */}
              {threatLevel === 'calm' && (
                <g opacity="0.65">
                  <ellipse cx={55}  cy={42} rx={26} ry={11} fill="#fff" />
                  <ellipse cx={75}  cy={35} rx={19} ry={9}  fill="#fff" />
                  <ellipse cx={295} cy={50} rx={21} ry={9}  fill="#fff" />
                  <ellipse cx={312} cy={43} rx={15} ry={7}  fill="#fff" />
                </g>
              )}
              {/* Storm clouds */}
              {threatLevel !== 'calm' && (
                <g opacity={threatLevel === 'storm' ? 0.75 : 0.5}>
                  <ellipse cx={55}  cy={38} rx={36} ry={17} fill="#5a6e80" />
                  <ellipse cx={88}  cy={27} rx={28} ry={14} fill="#4a5e70" />
                  <ellipse cx={130} cy={34} rx={22} ry={11} fill="#5a6e80" />
                  <ellipse cx={288} cy={44} rx={30} ry={15} fill="#5a6e80" />
                  <ellipse cx={318} cy={34} rx={24} ry={12} fill="#4a5e70" />
                </g>
              )}

              {/* ── Polder ground ── */}
              <g
                onClick={() => handleClick('polder')}
                style={{ cursor: 'pointer' }}
              >
                <rect x={POLDER_X} y={LAND_Y} width={POLDER_W} height={BOT - LAND_Y} fill="url(#wd-earth)" />
                {/* grass */}
                <rect x={POLDER_X} y={LAND_Y} width={POLDER_W} height={9}
                      fill={displayActive === 'polder' ? '#8bc34a' : hintEl === 'polder' ? '#a5d64c' : '#6ab030'}
                      className={hintEl === 'polder' ? 'wd-hint' : undefined}
                      style={{ transition: 'fill 0.3s ease' }} />
                {displayActive === 'polder' && (
                  <ActiveRing x={POLDER_X} y={LAND_Y} w={POLDER_W} h={BOT - LAND_Y}
                              color="#6ab030" pulse={isAudioDriven} />
                )}
              </g>

              {/* ── Sea ── */}
              <g>
                <rect x={0} y={waterY} width={DIKE_L + 8} height={BOT - waterY}
                      fill="url(#wd-sea)"
                      style={{ transition: 'y 0.6s cubic-bezier(.4,0,.2,1), height 0.6s cubic-bezier(.4,0,.2,1)' }} />
                {/* primary wave */}
                <g className="wd-wave" style={{ transform: `translateY(${waterY}px)` }}>
                  <path d="M-40 4 Q-30 -3 -20 4 T0 4 T20 4 T40 4 T60 4 T80 4 T100 4 T120 4 T140 4 T160 4 T180 4 L180 14 L-40 14 Z"
                        fill="#fff" opacity="0.2" />
                </g>
                {/* secondary wave (opposite direction) */}
                <g className="wd-wave2" style={{ transform: `translateY(${waterY + 5}px)` }}>
                  <path d="M-38 3 Q-28 -2 -18 3 T2 3 T22 3 T42 3 T62 3 T82 3 T102 3 T122 3 T142 3 T162 3 L162 10 L-38 10 Z"
                        fill="#fff" opacity="0.12" />
                </g>
              </g>

              {/* ── Flood water over polder ── */}
              {flooded && (
                <g clipPath="url(#wd-polder-clip)">
                  {/* main flood body */}
                  <rect
                    x={POLDER_X} y={floodPolderY}
                    width={POLDER_W} height={BOT - floodPolderY}
                    fill="url(#wd-flood)"
                    style={{
                      transformOrigin: `${POLDER_X}px center`,
                      animation: 'wd-flood 1.4s cubic-bezier(.2,0,.4,1) both',
                    }}
                  />
                  {/* flood surface wave */}
                  <g className="wd-wave" style={{ transform: `translateY(${floodPolderY}px)` }}>
                    <path d="M200 4 Q214 -3 228 4 T256 4 T284 4 T312 4 T340 4 T368 4 T396 4 L396 12 L200 12 Z"
                          fill="#fff" opacity="0.18" />
                  </g>
                </g>
              )}

              {/* ── Zeespiegel reference line ── */}
              <line x1={0} y1={SEA_Y} x2={380} y2={SEA_Y}
                    stroke="#002b6d" strokeWidth={1.2} strokeDasharray="6 5" opacity={0.4} />
              <LabelPill x={56} y={SEA_Y - 9} text="ZEESPIEGEL" bg="#002b6d" />

              {/* ── Dike ── */}
              <g onClick={() => handleClick('dijk')} style={{ cursor: 'pointer' }}>
                <polygon
                  points={`${DIKE_L},${BOT} ${DIKE_R},${BOT} ${DIKE_TOP_R},${DIKE_TOP_Y} ${DIKE_TOP_L},${DIKE_TOP_Y}`}
                  fill="url(#wd-dike-fill)"
                  style={{ transition: 'fill 0.3s ease' }}
                />
                {/* green cap */}
                <polygon
                  points={`${DIKE_TOP_L},${DIKE_TOP_Y} ${DIKE_TOP_R},${DIKE_TOP_Y} ${DIKE_TOP_R - 4},${DIKE_TOP_Y - 10} ${DIKE_TOP_L + 4},${DIKE_TOP_Y - 10}`}
                  fill={displayActive === 'dijk' ? '#56c156' : '#5a9e30'}
                  style={{ transition: 'fill 0.3s ease' }}
                />
                {displayActive === 'dijk' && (
                  <ActiveRing x={DIKE_L} y={DIKE_TOP_Y - 12} w={DIKE_R - DIKE_L} h={BOT - DIKE_TOP_Y + 12}
                              color="#4a8aff" pulse={isAudioDriven} />
                )}
                {/* DIJK label — floating above peak */}
                <LabelPill
                  x={(DIKE_TOP_L + DIKE_TOP_R) / 2}
                  y={DIKE_TOP_Y - 22}
                  text="DIJK"
                  bg={displayActive === 'dijk' ? '#1d428a' : 'rgba(0,20,70,0.78)'}
                />
              </g>

              {/* ── Houses (behind windmill) ── */}
              <House x={238} flooded={flooded} floodY={floodPolderY} />
              <House x={348} flooded={flooded} floodY={floodPolderY} />

              {/* ── Pump pipe + particles (windmolen active) ── */}
              <PumpParticles active={windActive} />

              {/* ── Windmill ── */}
              <g onClick={() => handleClick('windmolen')} style={{ cursor: 'pointer' }}>
                {/* wider invisible hit area */}
                <rect x={278} y={60} width={44} height={LAND_Y - 60} fill="transparent" />
                {/* tower */}
                <polygon
                  points={`290,${LAND_Y} 310,${LAND_Y} 307,106 293,106`}
                  fill={windActive ? '#7a5535' : hintEl === 'windmolen' ? '#7a5535' : '#4a3020'}
                  className={hintEl === 'windmolen' ? 'wd-hint' : undefined}
                  style={{ transition: 'fill 0.3s ease' }}
                />
                {/* cap */}
                <polygon points="293,106 307,106 304,94 296,94"
                         fill={windActive ? '#5a3518' : '#32200e'}
                         style={{ transition: 'fill 0.3s ease' }} />
                {/* hub */}
                <circle cx={300} cy={99} r={4} fill={windActive ? '#ffe0b2' : '#1c1008'} />
                {/* blades */}
                <WindmillBlades active={windActive} />
                {windActive && (
                  <ActiveRing x={276} y={60} w={48} h={LAND_Y - 60}
                              color="#c49a6c" pulse={isAudioDriven} />
                )}
              </g>

              {/* ── Deltawerken badge ── */}
              <g onClick={() => handleClick('deltawerken')} style={{ cursor: 'pointer' }}>
                <rect x={6} y={BOT - 40} width={92} height={32} rx={7}
                      fill={displayActive === 'deltawerken' ? '#1d428a' : 'rgba(0,35,100,0.78)'}
                      style={{ transition: 'fill 0.25s ease' }} />
                {displayActive === 'deltawerken' && (
                  <rect x={4} y={BOT - 42} width={96} height={36} rx={8}
                        fill="none" stroke="#5588ff" strokeWidth={2} className="wd-ring-pulse" style={{ pointerEvents: 'none' }} />
                )}
                <text x={52} y={BOT - 27} textAnchor="middle" fill="#fff"
                      style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'var(--font-body,sans-serif)', pointerEvents: 'none' }}>
                  DELTAWERKEN
                </text>
                <text x={52} y={BOT - 16} textAnchor="middle" fill="rgba(255,255,255,0.8)"
                      style={{ fontSize: 6.5, fontFamily: 'var(--font-body,sans-serif)', pointerEvents: 'none' }}>
                  Zeeland · na 1953
                </text>
              </g>

              {/* ── Afsluitdijk badge ── */}
              <g onClick={() => handleClick('afsluitdijk')} style={{ cursor: 'pointer' }}>
                <rect x={6} y={BOT - 80} width={92} height={32} rx={7}
                      fill={displayActive === 'afsluitdijk' ? '#a24000' : 'rgba(130,50,0,0.78)'}
                      style={{ transition: 'fill 0.25s ease' }} />
                {displayActive === 'afsluitdijk' && (
                  <rect x={4} y={BOT - 82} width={96} height={36} rx={8}
                        fill="none" stroke="#ff8040" strokeWidth={2} className="wd-ring-pulse" style={{ pointerEvents: 'none' }} />
                )}
                <text x={52} y={BOT - 67} textAnchor="middle" fill="#fff"
                      style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'var(--font-body,sans-serif)', pointerEvents: 'none' }}>
                  AFSLUITDIJK
                </text>
                <text x={52} y={BOT - 56} textAnchor="middle" fill="rgba(255,255,255,0.8)"
                      style={{ fontSize: 6.5, fontFamily: 'var(--font-body,sans-serif)', pointerEvents: 'none' }}>
                  N-Holland → Friesland
                </text>
              </g>

              {/* ── Polder "ONDER ZEESPIEGEL" label ── */}
              {!flooded && (
                <LabelPill x={290} y={LAND_Y + 20} text="POLDER" sub="ONDER ZEESPIEGEL"
                           bg="rgba(0,0,0,0.35)" />
              )}
              {flooded && (
                <LabelPill x={290} y={floodPolderY + 16} text="OVERSTROOMD" bg="rgba(186,26,26,0.85)" />
              )}

              {/* ── 1953 marker (floats on sea waterline) ── */}
              <g onClick={() => handleClick('ramp1953')} style={{ cursor: 'pointer' }}>
                <circle cx={100} cy={waterY - 14} r={18}
                        fill={displayActive === 'ramp1953' ? '#ba1a1a' : 'rgba(180,20,20,0.88)'}
                        style={{ transition: 'fill 0.3s, cy 0.6s cubic-bezier(.4,0,.2,1)' }}
                        className={displayActive === 'ramp1953' && isAudioDriven ? 'wd-ring-pulse' : undefined} />
                {displayActive === 'ramp1953' && (
                  <circle cx={100} cy={waterY - 14} r={21}
                          fill="none" stroke="#ff6060" strokeWidth={2} className="wd-ring-pulse"
                          style={{ pointerEvents: 'none', transition: 'cy 0.6s' }} />
                )}
                <text x={100} y={waterY - 18} textAnchor="middle" fill="#fff"
                      style={{ fontSize: 11, pointerEvents: 'none', transition: 'y 0.6s' }}>⚠</text>
                <text x={100} y={waterY - 7}  textAnchor="middle" fill="#fff"
                      style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: '0.04em',
                               fontFamily: 'var(--font-body,sans-serif)', pointerEvents: 'none', transition: 'y 0.6s' }}>
                  1953
                </text>
              </g>

            </svg>
          </div>

          {/* Info panel */}
          <div className="sm:w-[40%] p-5 flex flex-col gap-3 justify-center">

            <div
              className="rounded-2xl p-4 flex flex-col justify-center"
              style={{
                background: info ? info.color : 'var(--color-surface-container-low)',
                transition: 'background 0.3s ease',
                minHeight: 96,
              }}
            >
              {info ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined"
                          style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', fontVariationSettings: "'FILL' 1" }}>
                      {info.icon}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {info.label}
                    </p>
                  </div>
                  <p className="text-xs text-white leading-relaxed" style={{ opacity: 0.93 }}>{info.body}</p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="wd-nudge text-lg">👆</span>
                  <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Klik op een element
                  </p>
                </div>
              )}
            </div>

            {/* Element chips */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(ELEMENTS) as [ElementId, ElementInfo][]).map(([id, el]) => (
                <button key={id} type="button" onClick={() => handleClick(id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                  style={{
                    background: displayActive === id ? el.color : 'var(--color-surface-container)',
                    color:      displayActive === id ? '#fff'   : 'var(--color-on-surface)',
                    border:     `1.5px solid ${displayActive === id ? el.color : 'transparent'}`,
                    boxShadow:  displayActive === id ? `0 0 0 3px ${el.color}30` : 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>
                    {el.icon}
                  </span>
                  {el.label.replace(/^De /, '').replace(/^1953 — /, '')}
                </button>
              ))}
            </div>

            {/* Exam tip */}
            {info?.tip && (
              <div className="rounded-xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>
                  lightbulb
                </span>
                <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>{info.tip}</p>
              </div>
            )}

            {/* Waterstand slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Waterstand
                </span>
                <span className="text-[11px] font-bold tabular-nums transition-colors"
                      style={{ color: threatLevel === 'storm' ? '#ba1a1a' : threatLevel === 'warn' ? '#fe762c' : 'var(--color-primary)' }}>
                  {threatLevel === 'storm' ? 'Stormvloed!' : threatLevel === 'warn' ? 'Hoog water' : 'Normaal'}
                </span>
              </div>
              <input type="range" min={0} max={100} value={surge}
                     onChange={e => { setSurge(Number(e.target.value)); setHasClicked(true); }}
                     className="w-full h-1.5 cursor-pointer" style={{ accentColor: '#fe762c' }} />
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                {flooded ? '⚠ Het land staat onder water zonder de dijken' : 'Schuif omhoog om stormvloed te simuleren'}
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
