'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import type { AudioCue } from '@/lib/leren-audio-cues';

/**
 * Interactive VOC trade-route map for the "Gouden Eeuw" section.
 * Uses the same react-simple-maps library as the NetherlandsMap (section 1),
 * but on a real world map: VOC ships sail east from Amsterdam around Africa to
 * Azië, and west across the Atlantic to Amerika. The routes are drawn as real
 * geographic paths and every trade good is a clickable marker along its route.
 * Mirrors the NetherlandsMap pattern: a synced audio lesson drives the
 * highlights (subtitle → active route → active good) while it plays, and the
 * markers/routes stay clickable for manual exploration.
 */

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const GEO_URL = '/data/world-110m.topojson';
const MS = 'Material Symbols Outlined';
const HOME: [number, number] = [4.9, 52.4]; // Amsterdam

type Region = 'oost' | 'west';

interface Route {
  id: Region;
  label: string;
  region: string;
  blurb: string;
  color: string;
  ring: string;
  waypoints: [number, number][];
  ship: [number, number];
}

const ROUTES: Record<Region, Route> = {
  oost: {
    id: 'oost',
    label: 'Naar het oosten',
    region: 'Azië',
    blurb: 'Veel VOC-schepen voeren om Afrika heen naar Azië en haalden daar specerijen en luxe producten.',
    color: '#002b6d',
    ring: 'rgba(0,43,109,0.18)',
    waypoints: [
      [4.9, 52.4], [-7, 45], [-15, 28], [-17, 12], [-6, -2],
      [12, -24], [18.5, -34.8], [42, -33], [68, -20], [92, -10], [106.8, -6.2],
    ],
    ship: [40, -33],
  },
  west: {
    id: 'west',
    label: 'Naar het westen',
    region: 'Amerika',
    blurb: 'Andere schepen voeren over de Atlantische Oceaan naar Amerika voor producten van de plantages.',
    color: '#fe762c',
    ring: 'rgba(254,118,44,0.22)',
    waypoints: [
      [4.9, 52.4], [-14, 46], [-32, 38], [-50, 26], [-60, 15], [-65, 9],
    ],
    ship: [-42, 33],
  },
};

interface Good {
  id: string;
  label: string;
  icon: string;
  region: Region;
  from: string;
  desc: string;
  coordinates: [number, number];
}

const GOODS: Good[] = [
  { id: 'peper', label: 'Peper', icon: 'grass', region: 'oost', from: 'Azië',
    desc: 'Een dure specerij uit Azië. Peper was in de 17e eeuw heel kostbaar.', coordinates: [105, -4] },
  { id: 'koffie', label: 'Koffie', icon: 'coffee', region: 'oost', from: 'Azië',
    desc: 'Werd uit Azië aangevoerd en in Nederland verhandeld.', coordinates: [86, -14] },
  { id: 'thee', label: 'Thee', icon: 'emoji_food_beverage', region: 'oost', from: 'Azië',
    desc: 'Een populaire drank, met schepen uit Azië gehaald.', coordinates: [60, -27] },
  { id: 'suiker', label: 'Suiker', icon: 'bakery_dining', region: 'west', from: 'Amerika',
    desc: 'Kwam van plantages in Amerika naar Nederland.', coordinates: [-52, 3] },
  { id: 'cacao', label: 'Cacao', icon: 'cookie', region: 'west', from: 'Amerika',
    desc: 'De grondstof voor chocolade, afkomstig uit Amerika.', coordinates: [-67, 13] },
  { id: 'tabak', label: 'Tabak', icon: 'local_fire_department', region: 'west', from: 'Amerika',
    desc: 'Verbouwd in Amerika en daarna verhandeld.', coordinates: [-83, 23] },
];

export default function TradeRoutesMap({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const [activeGood, setActiveGood] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<Region | null>(null);
  const [activeHome, setActiveHome] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);

  // Audio lesson
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
      fetch('/audio/leren/thema1-gouden-eeuw-cues.json')
        .then((r) => r.json())
        .then((data: AudioCue[]) => { cuesRef.current = data; setAudioReady(true); })
        .catch(() => {});
    }
  }, [audioCues]);

  // Idle hint: cycle a pulse through the goods until the user interacts.
  useEffect(() => {
    if (hasClicked) return;
    const timer = setInterval(() => setHintIdx((i) => (i + 1) % GOODS.length), 1100);
    return () => clearInterval(timer);
  }, [hasClicked]);

  // Audio-driven highlights: walk cues backward to the latest value per field.
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const cues = cuesRef.current;

    let latestSubtitle: string | undefined;
    let latestRoute: Region | null | undefined;
    let latestGood: string | null | undefined;
    let latestHome: boolean | null | undefined;
    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (latestSubtitle === undefined && cues[i].subtitle !== undefined) latestSubtitle = cues[i].subtitle;
      if (latestRoute === undefined && cues[i].route !== undefined) latestRoute = cues[i].route as Region | null;
      if (latestGood === undefined && cues[i].good !== undefined) latestGood = cues[i].good as string | null;
      if (latestHome === undefined && cues[i].home !== undefined) latestHome = cues[i].home;
      if (latestSubtitle !== undefined && latestRoute !== undefined && latestGood !== undefined && latestHome !== undefined) break;
    }
    if (latestSubtitle !== undefined) setSubtitle(latestSubtitle);
    if (latestRoute !== undefined) setActiveRoute(latestRoute);
    if (latestGood !== undefined) setActiveGood(latestGood);
    if (latestHome !== undefined) setActiveHome(!!latestHome);
    setProgress(audio.duration ? t / audio.duration : 0);
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setHasClicked(true);
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

  const hintGoodId = hasClicked ? null : GOODS[hintIdx].id;
  const good = activeGood ? GOODS.find((g) => g.id === activeGood) ?? null : null;
  const litRoute: Region | null = good ? good.region : activeRoute;
  const litRouteData = litRoute ? ROUTES[litRoute] : null;

  function selectGood(id: string) {
    setHasClicked(true);
    setActiveHome(false);
    setActiveGood((cur) => (cur === id ? null : id));
    setActiveRoute(null);
  }

  function selectRoute(id: Region) {
    setHasClicked(true);
    setActiveHome(false);
    setActiveRoute((cur) => (cur === id ? null : id));
    setActiveGood(null);
  }

  return (
    <>
      <style>{`
        @keyframes trPinPulse { 0% { r: 13; opacity: 0.55; } 100% { r: 28; opacity: 0; } }
        .tr-pin-pulse { animation: trPinPulse 1.4s ease-out infinite; }
        @keyframes trHomePulse { 0% { r: 10; opacity: 0.6; } 100% { r: 30; opacity: 0; } }
        .tr-home-pulse { animation: trHomePulse 1.5s ease-out infinite; }
        @keyframes trShip { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .tr-ship { animation: trShip 2.2s ease-in-out infinite; }
        @keyframes trNudge { 0%,100% { transform: translateX(0); } 45% { transform: translateX(4px); } 75% { transform: translateX(-2px); } }
      `}</style>

      <audio
        ref={audioRef}
        src={audioUrl ?? '/audio/leren/thema1-gouden-eeuw.mp3'}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setActiveRoute(null); setActiveGood(null); setActiveHome(false); setSubtitle(''); setProgress(0); }}
      />

      <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
            Interactieve kaart
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
            De handelsroutes van de VOC
          </p>
        </div>

        {/* Audio player */}
        {audioReady && (
          <div className="px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={togglePlay}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: playing ? '#fe762c' : 'transparent',
                  border: playing ? 'none' : '2px solid #fe762c',
                  color: playing ? '#fff' : '#fe762c',
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
                  De VOC, de handelsroutes en de producten
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
                style={{ width: `${progress * 100}%`, background: '#fe762c' }}
              />
            </div>

            {/* Subtitle */}
            <div
              className="min-h-[36px] flex items-center px-3 py-2 rounded-xl transition-all"
              style={{ background: subtitle ? 'var(--color-surface-container-low)' : 'transparent' }}
            >
              {subtitle ? (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>{subtitle}</p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Druk op afspelen om de les te beluisteren
                </p>
              )}
            </div>
          </div>
        )}

        {/* Route toggle pills */}
        <div className="px-4 pt-3 pb-3 flex gap-2" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
          {(['oost', 'west'] as Region[]).map((id) => {
            const r = ROUTES[id];
            const on = litRoute === id;
            return (
              <button
                key={id}
                onClick={() => selectRoute(id)}
                className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200"
                style={{
                  background: on ? r.color : 'var(--color-surface-container-low)',
                  boxShadow: on ? `0 4px 14px ${r.ring}` : 'none',
                }}
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18, color: on ? '#fff' : r.color }}>
                  sailing
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-xs font-bold" style={{ color: on ? '#fff' : 'var(--color-on-surface)' }}>
                    {r.label}
                  </span>
                  <span className="block text-[10px]" style={{ color: on ? 'rgba(255,255,255,0.8)' : 'var(--color-on-surface-variant)' }}>
                    {r.region}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row">
          {/* Map */}
          <div className="sm:w-[60%] px-1 py-2 flex items-center justify-center" style={{ background: 'linear-gradient(180deg,#eef4fb 0%,#e3edf7 100%)' }}>
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 165, center: [26, 12] }}
              width={800}
              height={415}
              style={{ width: '100%', maxWidth: 540, height: 'auto', display: 'block' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: '#d7dee6', stroke: '#fff', strokeWidth: 0.4, outline: 'none' },
                        hover: { fill: '#d7dee6', stroke: '#fff', strokeWidth: 0.4, outline: 'none' },
                        pressed: { fill: '#d7dee6', stroke: '#fff', strokeWidth: 0.4, outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Routes */}
              {(['oost', 'west'] as Region[]).map((id) => {
                const r = ROUTES[id];
                const on = litRoute === id;
                return (
                  <Line
                    key={id}
                    id={`tr-route-${id}`}
                    coordinates={r.waypoints}
                    stroke={on ? r.color : '#9fb0c2'}
                    strokeWidth={on ? 2.5 : 1.5}
                    strokeLinecap="round"
                    strokeDasharray="1 7"
                    style={{ opacity: litRoute && !on ? 0.35 : 1, transition: 'opacity 0.25s' }}
                  />
                );
              })}

              {/* Static ship at the midpoint of each idle (non-active) route */}
              {(['oost', 'west'] as Region[]).map((id) => {
                const r = ROUTES[id];
                if (litRoute === id) return null; // active route shows the sailing boat instead
                return (
                  <Marker key={id + '-ship'} coordinates={r.ship}>
                    <g className="tr-ship" style={{ opacity: litRoute ? 0.3 : 1, transition: 'opacity 0.25s' }}>
                      <circle r={10} fill="#fff" stroke="#9fb0c2" strokeWidth={2} />
                      <text textAnchor="middle" dominantBaseline="central" style={{ fontFamily: MS, fontSize: 12, fill: '#9fb0c2' }}>
                        sailing
                      </text>
                    </g>
                  </Marker>
                );
              })}

              {/* Boat that sails the active route, out and back, while it's discussed */}
              {litRoute && (
                <g key={`boat-${litRoute}`} style={{ pointerEvents: 'none' }}>
                  <circle r={11} fill={ROUTES[litRoute].color} stroke="#fff" strokeWidth={2.5}
                    style={{ filter: `drop-shadow(0 1px 5px ${ROUTES[litRoute].ring})` }} />
                  <text textAnchor="middle" dominantBaseline="central" style={{ fontFamily: MS, fontSize: 13, fill: '#fff' }}>
                    sailing
                  </text>
                  <animateMotion
                    dur={litRoute === 'oost' ? '8s' : '6s'}
                    repeatCount="indefinite"
                    keyPoints="0;1;0"
                    keyTimes="0;0.5;1"
                    calcMode="linear"
                  >
                    <mpath xlinkHref={`#tr-route-${litRoute}`} />
                  </animateMotion>
                </g>
              )}

              {/* Goods (clickable) */}
              {GOODS.map((g) => {
                const isActive = activeGood === g.id;
                const isHint = hintGoodId === g.id;
                const r = ROUTES[g.region];
                const dim = litRoute && litRoute !== g.region;
                return (
                  <Marker key={g.id} coordinates={g.coordinates} onClick={() => selectGood(g.id)}>
                    <g style={{ cursor: 'pointer', opacity: dim ? 0.4 : 1, transition: 'opacity 0.25s' }}>
                      {(isActive || isHint) && (
                        <circle r={13} fill={r.ring} className="tr-pin-pulse" style={{ pointerEvents: 'none' }} />
                      )}
                      <circle
                        r={13}
                        fill={isActive ? r.color : '#fff'}
                        stroke={r.color}
                        strokeWidth={isActive ? 0 : 2}
                        style={{ transition: 'fill 0.2s', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.18))' }}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontFamily: MS, fontSize: 14, fill: isActive ? '#fff' : r.color, pointerEvents: 'none' }}
                      >
                        {g.icon}
                      </text>
                      <text
                        y={24}
                        textAnchor="middle"
                        style={{
                          fontSize: 11, fontWeight: 800, fill: isActive ? r.color : '#475569',
                          pointerEvents: 'none', paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3,
                          fontFamily: 'var(--font-body, sans-serif)',
                        }}
                      >
                        {g.label}
                      </text>
                    </g>
                  </Marker>
                );
              })}

              {/* Amsterdam home node — pulses when the lesson reaches the home port */}
              <Marker coordinates={HOME}>
                {activeHome && (
                  <circle r={10} fill="rgba(0,43,109,0.3)" className="tr-home-pulse" style={{ pointerEvents: 'none' }} />
                )}
                <circle
                  r={activeHome ? 11 : 8}
                  fill="#002b6d"
                  stroke="#fff"
                  strokeWidth={2.5}
                  style={{
                    filter: activeHome ? 'drop-shadow(0 0 7px rgba(0,43,109,0.7))' : 'drop-shadow(0 1px 4px rgba(0,0,0,0.35))',
                    transition: 'r 0.25s ease, filter 0.25s ease',
                  }}
                />
                <text textAnchor="middle" dominantBaseline="central" style={{ fontFamily: MS, fontSize: activeHome ? 13 : 10, fill: '#fff', pointerEvents: 'none', transition: 'font-size 0.25s ease' }}>
                  account_balance
                </text>
                <text
                  y={activeHome ? -18 : -15}
                  textAnchor="middle"
                  style={{
                    fontSize: activeHome ? 12 : 11, fontWeight: 800, fill: '#002b6d', pointerEvents: 'none',
                    paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, fontFamily: 'var(--font-body, sans-serif)',
                    transition: 'font-size 0.25s ease',
                  }}
                >
                  Amsterdam
                </text>
              </Marker>
            </ComposableMap>
          </div>

          {/* Info panel */}
          <div className="sm:w-[40%] p-4 flex flex-col gap-3 justify-center">
            {/* Detail card */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-center"
              style={{
                background: good ? ROUTES[good.region].color : litRouteData ? litRouteData.color : activeHome ? '#002b6d' : 'var(--color-surface-container-low)',
                transition: 'background 0.2s ease',
                minHeight: 96,
              }}
            >
              {good ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Handelsproduct · uit {good.from}
                  </p>
                  <p className="font-extrabold text-base text-white leading-tight mb-1">{good.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{good.desc}</p>
                </>
              ) : litRouteData ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Route · {litRouteData.region}
                  </p>
                  <p className="font-extrabold text-base text-white leading-tight mb-1">{litRouteData.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{litRouteData.blurb}</p>
                </>
              ) : activeHome ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Thuishaven
                  </p>
                  <p className="font-extrabold text-base text-white leading-tight mb-1">Amsterdam</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Alle producten kwamen aan in Amsterdam. De stad werd er heel rijk van — maar de handel had ook een donkere kant.
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg" style={{ display: 'inline-block', animation: 'trNudge 1s ease-in-out infinite' }}>👆</span>
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Tik op een product of route
                  </p>
                </div>
              )}
            </div>

            {/* Goods quick-pick chips */}
            <div className="flex flex-wrap gap-1.5">
              {GOODS.map((g) => {
                const isActive = activeGood === g.id;
                const r = ROUTES[g.region];
                return (
                  <button
                    key={g.id}
                    onClick={() => selectGood(g.id)}
                    className="flex items-center gap-1 rounded-full pl-1.5 pr-2.5 py-1 transition-all duration-200"
                    style={{
                      background: isActive ? r.color : 'var(--color-surface-container-low)',
                      boxShadow: isActive ? `0 0 0 2px ${r.ring}` : 'none',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: isActive ? '#fff' : r.color }}>
                      {g.icon}
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: isActive ? '#fff' : 'var(--color-on-surface)' }}>
                      {g.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* KNM exam tip */}
            <div className="rounded-xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>lightbulb</span>
              <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>
                <strong>Examentip:</strong> De <strong>VOC</strong> stuurde schepen naar het <strong>oosten (Azië)</strong> en naar het <strong>westen (Amerika)</strong>. Amsterdam werd zo heel rijk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
