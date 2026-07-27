'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { AudioCue } from '@/lib/leren-audio-cues';

const GEO_URL = '/data/nl-provinces.topojson';

const PROVINCE_DATA: Record<string, { capital: string; displayName: string; short: string; centroid: [number, number] }> = {
  'Groningen':    { capital: 'Groningen',          displayName: 'Groningen',    short: 'GR', centroid: [6.75, 53.18] },
  'Fryslân':      { capital: 'Leeuwarden',         displayName: 'Friesland',    short: 'FR', centroid: [5.65, 53.08] },
  'Drenthe':      { capital: 'Assen',              displayName: 'Drenthe',      short: 'DR', centroid: [6.62, 52.83] },
  'Overijssel':   { capital: 'Zwolle',             displayName: 'Overijssel',   short: 'OV', centroid: [6.50, 52.44] },
  'Flevoland':    { capital: 'Lelystad',           displayName: 'Flevoland',    short: 'FL', centroid: [5.42, 52.52] },
  'Gelderland':   { capital: 'Arnhem',             displayName: 'Gelderland',   short: 'GE', centroid: [5.98, 52.05] },
  'Utrecht':      { capital: 'Utrecht',            displayName: 'Utrecht',      short: 'UT', centroid: [5.12, 52.09] },
  'Noord-Holland':{ capital: 'Haarlem',            displayName: 'Noord-Holland',short: 'NH', centroid: [4.87, 52.62] },
  'Zuid-Holland': { capital: 'Den Haag',           displayName: 'Zuid-Holland', short: 'ZH', centroid: [4.52, 51.98] },
  'Zeeland':      { capital: 'Middelburg',         displayName: 'Zeeland',      short: 'ZE', centroid: [3.90, 51.50] },
  'Noord-Brabant':{ capital: '\'s-Hertogenbosch',  displayName: 'Noord-Brabant',short: 'NB', centroid: [5.22, 51.50] },
  'Limburg':      { capital: 'Maastricht',         displayName: 'Limburg',      short: 'LI', centroid: [5.90, 51.40] },
};

const CITY_PINS = [
  {
    id: 'amsterdam',
    label: 'Amsterdam',
    sublabel: 'Officiële hoofdstad',
    icon: 'castle',
    coordinates: [4.9041, 52.3676] as [number, number],
    color: '#fe762c',
    ringColor: 'rgba(254,118,44,0.25)',
  },
  {
    id: 'den-haag',
    label: 'Den Haag',
    sublabel: 'Zetel van de regering',
    icon: 'account_balance',
    coordinates: [4.3007, 52.0705] as [number, number],
    color: '#002b6d',
    ringColor: 'rgba(0,43,109,0.2)',
  },
];

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function NetherlandsMap({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState('');
  const [hintIdx, setHintIdx] = useState(0);
  const [hasClicked, setHasClicked] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const cuesRef = useRef<AudioCue[]>([]);
  const [audioReady, setAudioReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Prefer DB-sourced cues (via props); fall back to static file for local dev
  useEffect(() => {
    if (audioCues && audioCues.length > 0) {
      cuesRef.current = audioCues;
      setAudioReady(true);
    } else {
      fetch('/audio/leren/thema1-kaart-cues.json')
        .then((r) => r.json())
        .then((data: AudioCue[]) => { cuesRef.current = data; setAudioReady(true); })
        .catch(() => {});
    }
  }, [audioCues]);

  useEffect(() => {
    if (hasClicked) return;
    const provinces = ['Noord-Holland', 'Gelderland', 'Fryslân', 'Groningen', 'Noord-Brabant'];
    const timer = setInterval(() => setHintIdx((i) => (i + 1) % provinces.length), 1400);
    return () => clearInterval(timer);
  }, [hasClicked]);

  const hintProvince = hasClicked
    ? null
    : ['Noord-Holland', 'Gelderland', 'Fryslân', 'Groningen', 'Noord-Brabant'][hintIdx];

  function handleProvinceClick(name: string) {
    setHasClicked(true);
    setActive(active === name ? null : name);
  }

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const cues = cuesRef.current;

    // Walk backwards to find the last cue at or before t for each field
    let latestSubtitle: string | undefined;
    let latestProvince: string | null | undefined;
    let latestCity: string | null | undefined;

    for (let i = cues.length - 1; i >= 0; i--) {
      if (cues[i].time > t) continue;
      if (latestSubtitle === undefined && cues[i].subtitle !== undefined) latestSubtitle = cues[i].subtitle;
      if (latestProvince === undefined && cues[i].province !== undefined) latestProvince = cues[i].province;
      if (latestCity === undefined && cues[i].city !== undefined) latestCity = cues[i].city;
      if (latestSubtitle !== undefined && latestProvince !== undefined && latestCity !== undefined) break;
    }

    if (latestSubtitle !== undefined) setSubtitle(latestSubtitle);
    if (latestProvince !== undefined) setActive(latestProvince);
    if (latestCity !== undefined) setActiveCity(latestCity);
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

  const activeData = active ? PROVINCE_DATA[active] : null;

  return (
    <>
      <style>{`
        @keyframes mapPinPulse {
          0%   { r: 9;  opacity: 0.7; }
          100% { r: 22; opacity: 0; }
        }
        .map-pin-pulse { animation: mapPinPulse 1.6s ease-out infinite; }
        @keyframes cityPinActive {
          0%   { r: 10; opacity: 0.6; }
          100% { r: 26; opacity: 0; }
        }
        .city-pin-active { animation: cityPinActive 1.2s ease-out infinite; }
        @keyframes nudge {
          0%, 100% { transform: translateX(0); }
          40%       { transform: translateX(4px); }
          70%       { transform: translateX(-2px); }
        }
      `}</style>

      <audio
        ref={audioRef}
        src={audioUrl ?? '/audio/leren/thema1-kaart.mp3'}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setActive(null); setActiveCity(null); setSubtitle(''); setProgress(0); }}
      />

      <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
            Interactieve kaart
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
            De 12 provincies van Nederland
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
                  De 12 provincies en de twee belangrijkste steden
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
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>
                  {subtitle}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Druk op afspelen om de les te beluisteren
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row">
          {/* Map */}
          <div className="sm:w-[55%] px-1 py-2 flex items-center justify-center">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [5.25, 52.2], scale: 9000 }}
              viewBox="60 10 680 780"
              style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const name = (geo.properties as { statnaam: string }).statnaam;
                    const isActive = active === name;
                    const isHint = name === hintProvince;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleProvinceClick(name)}
                        style={{
                          default: {
                            fill: isActive ? '#002b6d' : isHint ? '#c4c6d2' : '#e6e8ea',
                            stroke: '#ffffff',
                            strokeWidth: 1.2,
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'fill 0.25s ease',
                          },
                          hover: {
                            fill: isActive ? '#1d428a' : '#b0b3c0',
                            stroke: '#ffffff',
                            strokeWidth: 1.2,
                            outline: 'none',
                            cursor: 'pointer',
                          },
                          pressed: {
                            fill: '#002b6d',
                            stroke: '#ffffff',
                            strokeWidth: 1.2,
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Province abbreviation labels */}
              {Object.entries(PROVINCE_DATA).map(([key, prov]) => (
                <Marker key={key + '-label'} coordinates={prov.centroid}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontSize: 7,
                      fontWeight: 700,
                      fill: active === key ? '#ffffff' : '#747782',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      transition: 'fill 0.2s ease',
                      fontFamily: 'var(--font-body, sans-serif)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {prov.short}
                  </text>
                </Marker>
              ))}

              {/* City pins */}
              {CITY_PINS.map((pin) => {
                const isActiveCity = activeCity === pin.id;
                return (
                  <Marker key={pin.id} coordinates={pin.coordinates}>
                    {/* Pre-click idle pulse on Amsterdam */}
                    {pin.id === 'amsterdam' && !hasClicked && (
                      <circle r={9} fill={pin.ringColor} className="map-pin-pulse" style={{ pointerEvents: 'none' }} />
                    )}
                    {/* Audio-driven city pulse */}
                    {isActiveCity && (
                      <circle r={10} fill={pin.color} opacity={0.3} className="city-pin-active" style={{ pointerEvents: 'none' }} />
                    )}
                    <circle
                      r={6}
                      fill={isActiveCity ? pin.color : pin.color}
                      stroke={isActiveCity ? '#ffffff' : 'white'}
                      strokeWidth={isActiveCity ? 3 : 2}
                      style={{
                        filter: isActiveCity
                          ? `drop-shadow(0 0 6px ${pin.color})`
                          : 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))',
                        pointerEvents: 'none',
                        transition: 'stroke-width 0.2s, filter 0.2s',
                      }}
                    />
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>

          {/* Info panel */}
          <div className="sm:w-[45%] p-4 flex flex-col gap-3 justify-center">
            {/* Province detail or click-hint */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-center"
              style={{
                background: activeData ? '#002b6d' : 'var(--color-surface-container-low)',
                transition: 'background 0.2s ease',
                minHeight: 76,
              }}
            >
              {activeData ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Provincie
                  </p>
                  <p className="font-extrabold text-base text-white leading-tight">
                    {activeData.displayName}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Hoofdstad: <span className="font-semibold text-white">{activeData.capital}</span>
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg" style={{ display: 'inline-block', animation: 'nudge 1s ease-in-out infinite' }}>
                    👆
                  </span>
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Tik op een provincie
                  </p>
                </div>
              )}
            </div>

            {/* City legend cards — highlight when active */}
            <div className="space-y-2">
              {CITY_PINS.map((pin) => {
                const isActiveCity = activeCity === pin.id;
                return (
                  <div
                    key={pin.id}
                    className="flex items-center gap-3 rounded-xl p-3 transition-all duration-300"
                    style={{
                      background: isActiveCity ? pin.color : 'var(--color-surface-container-low)',
                      boxShadow: isActiveCity ? `0 0 0 2px ${pin.color}40` : 'none',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: isActiveCity ? 'rgba(255,255,255,0.25)' : pin.color }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: isActiveCity ? '#fff' : '#fff' }}>
                        {pin.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: isActiveCity ? '#fff' : 'var(--color-on-surface)' }}>
                        {pin.label}
                      </p>
                      <p className="text-[11px]" style={{ color: isActiveCity ? 'rgba(255,255,255,0.8)' : 'var(--color-on-surface-variant)' }}>
                        {pin.sublabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* KNM exam tip */}
            <div className="rounded-xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>
                lightbulb
              </span>
              <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>
                <strong>Examentip:</strong> Amsterdam is de officiële hoofdstad, maar de{' '}
                <strong>regering zit in Den Haag</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
