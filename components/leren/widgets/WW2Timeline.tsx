'use client';

import { useState, useEffect, useRef } from 'react';
import type { AudioCue } from '@/lib/leren-audio-cues';

// ── data ─────────────────────────────────────────────────────────────────────

type EventId = 'invasion' | 'rotterdam' | 'holocaust' | 'hongerwinter' | 'liberation' | 'dodenherdenking' | 'bevrijdingsdag' | 'volkslied' | 'antisemitisme';

interface TimelineEvent {
  id: EventId;
  date: string;
  icon: string;
  color: string;
  title: string;
  body: string;
  tip?: string;
}

const EVENTS: TimelineEvent[] = [
  {
    id: 'invasion',
    date: '10 mei 1940',
    icon: 'military_tech',
    color: '#7a1c1c',
    title: 'Duitsland valt Nederland binnen',
    body: 'Op 10 mei 1940 begon de Duitse bezetting van Nederland. Adolf Hitler wilde een groot Europees rijk. Zijn leger viel verschillende landen tegelijk aan. De bezetting duurde vijf jaar — tot 5 mei 1945.',
    tip: 'Examentip: De bezetting duurde van 1940 tot 1945 — vijf jaar.',
  },
  {
    id: 'rotterdam',
    date: '14 mei 1940',
    icon: 'emergency',
    color: '#b34000',
    title: 'Bombardement op Rotterdam',
    body: 'Het Duitse leger gooit bommen op Rotterdam. In een kwartier worden 800 mensen gedood en de binnenstad is verwoest. Nederland geeft zich over en stopt met vechten.',
    tip: 'Examentip: Na het bombardement op Rotterdam capituleerde Nederland — het land gaf de strijd op.',
  },
  {
    id: 'holocaust',
    date: '1940–1945',
    icon: 'sentiment_very_dissatisfied',
    color: '#4a3570',
    title: 'De Holocaust',
    body: 'Hitler gaf Joden de schuld van alle problemen. Het leven voor Joden werd steeds moeilijker. Velen vluchtten of gingen onderduiken. Maar veel Joden werden gevangen genomen en naar concentratiekampen gebracht. In totaal werden bijna 6 miljoen Europese Joden vermoord. Een bekend voorbeeld is Anne Frank, die met haar familie onderdook in Amsterdam en later in een kamp overleed.',
    tip: 'Examentip: De Holocaust = de systematische moord op 6 miljoen Joden door Nazi-Duitsland.',
  },
  {
    id: 'hongerwinter',
    date: 'Winter 1944–1945',
    icon: 'dangerous',
    color: '#5c4a1e',
    title: 'De Hongerwinter',
    body: 'In de winter van 1944–1945 was er bijna geen eten meer in West-Nederland. De Duitsers blokkeerden voedseltransporten als straf. Duizenden mensen stierven van honger. Mensen aten tulpenbollen en suikerbietenblad om te overleven.',
    tip: 'Examentip: De Hongerwinter was in 1944–1945, het laatste oorlogsjaar — vlak voor de bevrijding.',
  },
  {
    id: 'liberation',
    date: '5 mei 1945',
    icon: 'flag',
    color: '#1a5c2e',
    title: 'Bevrijding van Nederland',
    body: 'Op 5 mei 1945 werd Nederland bevrijd door de geallieerden: Amerika, Canada en Engeland. Na vijf jaar bezetting was Nederland eindelijk vrij. Overal werd feest gevierd op straat.',
    tip: 'Examentip: 5 mei 1945 = Bevrijding. De geallieerden = Amerika, Canada en Engeland.',
  },
  {
    id: 'dodenherdenking',
    date: '4 mei — elk jaar',
    icon: 'nights_stay',
    color: '#1a3050',
    title: '4 mei — Dodenherdenking',
    body: 'Op 4 mei herdenken we alle slachtoffers van de Tweede Wereldoorlog. De vlag hangt halfstok. Om 20:00 uur zijn we twee minuten lang stil. Iedereen in Nederland stopt wat hij doet — zelfs in het verkeer.',
    tip: 'Examentip: 4 mei = Dodenherdenking (vlag halfstok, 2 minuten stilte om 20:00). 5 mei = Bevrijdingsdag (vlag bovenaan, feest).',
  },
  {
    id: 'bevrijdingsdag',
    date: '5 mei — elk jaar',
    icon: 'celebration',
    color: '#b5460a',
    title: '5 mei — Bevrijdingsdag',
    body: 'Op 5 mei vieren we dat Nederland vrij is. De vlag hangt bovenaan de mast. Er zijn festivals, vrijmarkten en concerten door het hele land. We vieren dat we in vrijheid kunnen leven.',
    tip: 'Examentip: 5 mei = Bevrijdingsdag. Vlag helemaal bovenaan — tegenovergesteld aan 4 mei.',
  },
  {
    id: 'volkslied',
    date: '16e eeuw',
    icon: 'music_note',
    color: '#1a4070',
    title: 'Het Wilhelmus — het volkslied',
    body: 'Het Wilhelmus is het nationale volkslied van Nederland. Het is uit de 16e eeuw en is een van de oudste volksliederen ter wereld. Het wordt gezongen bij officiële gelegenheden: sportevenementen, staatsbezoeken en herdenkingen.',
    tip: 'Examentip: Het Wilhelmus dateert uit de 16e eeuw — het is een van de oudste volksliederen ter wereld.',
  },
  {
    id: 'antisemitisme',
    date: 'Na de oorlog',
    icon: 'gavel',
    color: '#00524a',
    title: 'Wet na de oorlog: antisemitisme verboden',
    body: 'Na de Tweede Wereldoorlog maakte Nederland een nieuwe wet: antisemitisme is strafbaar. Antisemitisme betekent: haat of discriminatie van Joden. Het is verboden om mensen te discrimineren vanwege hun godsdienst of afkomst.',
    tip: 'Examentip: Antisemitisme = discriminatie van Joden. In Nederland is dit strafbaar bij wet.',
  },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function WW2Timeline({ audioUrl, audioCues }: { audioUrl?: string; audioCues?: AudioCue[] }) {
  const [active, setActive] = useState<EventId | null>(null);
  const [revealed, setRevealed] = useState<Set<EventId>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitle, setSubtitle] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Drive widget from audio cues
  useEffect(() => {
    if (!audioRef.current || !audioCues?.length) return;
    const audio = audioRef.current;

    function onTimeUpdate() {
      const t = audio.currentTime;
      setProgress(duration > 0 ? t / duration : 0);

      // Find most recent cue at or before current time
      const active = [...(audioCues ?? [])].reverse().find(c => c.time <= t);
      if (!active) return;
      if (active.subtitle !== undefined) setSubtitle(active.subtitle);
      if (active.ww2event !== undefined) {
        if (active.ww2event) {
          setActive(active.ww2event as EventId);
          setRevealed(prev => new Set(prev).add(active.ww2event as EventId));
        } else {
          setActive(null);
        }
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, [audioCues, duration]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
  }

  function formatTime(s: number) {
    if (!isFinite(s) || s === 0) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }

  function handleSelect(id: EventId) {
    setActive(active === id ? null : id);
    setRevealed((prev) => new Set(prev).add(id));
  }

  const activeEvent = active ? EVENTS.find((e) => e.id === active) : null;
  const progressPct = Math.round((revealed.size / EVENTS.length) * 100);

  return (
    <>
      <style>{`
        @keyframes ww2-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ww2-nudge { 0%,100% { transform: translateX(0); } 40% { transform: translateX(5px); } 70% { transform: translateX(-2px); } }
        .ww2-fadein { animation: ww2-fadein 0.22s ease forwards; }
        .ww2-nudge  { display: inline-block; animation: ww2-nudge 1.1s ease-in-out infinite; }
        .ww2-body   { display: flex; flex-direction: column; }
        .ww2-col-timeline { width: 100%; max-height: 340px; overflow-y: auto; }
        .ww2-col-detail   { width: 100%; border-top: 1px solid var(--color-outline-variant); }
        @media (min-width: 560px) {
          .ww2-body { flex-direction: row; }
          .ww2-col-timeline { width: 46%; max-height: 480px; }
          .ww2-col-detail   { width: 54%; border-top: none; border-left: 1px solid var(--color-outline-variant); }
        }
      `}</style>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => { setPlaying(false); setSubtitle(''); setProgress(0); }}
        />
      )}

      <div className="rounded-3xl overflow-hidden bg-white shadow-sm mb-5">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-primary)' }}>
            Interactieve les
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
            De Tweede Wereldoorlog in Nederland — klik op een gebeurtenis
          </p>

          {/* Progress bar (events seen) */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: 'var(--color-primary)',
                  transition: 'width 0.4s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <span className="text-[10px] font-semibold tabular-nums shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
              {revealed.size}/{EVENTS.length} bekeken
            </span>
          </div>
        </div>

        {/* Audio player — right under header, before body */}
        {audioUrl && (
          <div className="px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--color-outline-variant)', opacity: 1 }}>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
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
                  Druk op afspelen om de les te beluisteren
                </p>
              </div>
              <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                {formatTime(duration)}
              </span>
            </div>
            <div
              ref={progressBarRef}
              onClick={seekTo}
              className="w-full h-1.5 rounded-full cursor-pointer mb-2"
              style={{ background: 'var(--color-outline-variant)' }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, background: '#fe762c', transition: 'width 0.1s linear' }}
              />
            </div>
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

        {/* Body */}
        <div className="ww2-body">

          {/* Timeline column */}
          <div className="ww2-col-timeline py-4 px-3">
            <div className="relative pl-6">
              {/* Vertical line */}
              <div
                className="absolute left-[11px] top-2 bottom-2 w-0.5 rounded-full"
                style={{ background: 'var(--color-outline-variant)' }}
              />

              {EVENTS.map((ev) => {
                const isActive = active === ev.id;
                const isSeen = revealed.has(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleSelect(ev.id)}
                    className="w-full text-left mb-1 last:mb-0 group"
                    aria-pressed={isActive}
                  >
                    <div
                      className="relative flex items-start gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 active:scale-[0.98]"
                      style={{
                        background: isActive
                          ? ev.color
                          : isSeen
                          ? 'var(--color-surface-container-low)'
                          : 'transparent',
                        border: `1.5px solid ${isActive ? ev.color : 'transparent'}`,
                      }}
                    >
                      {/* Node dot */}
                      <div
                        className="absolute -left-[18px] top-3.5 w-3 h-3 rounded-full border-2 border-white shrink-0"
                        style={{
                          background: isActive ? ev.color : isSeen ? '#aaa' : 'var(--color-outline)',
                          transition: 'background 0.2s',
                          zIndex: 1,
                        }}
                      />

                      {/* Icon */}
                      <span
                        className="material-symbols-outlined shrink-0 mt-0.5"
                        style={{
                          fontSize: 16,
                          color: isActive ? 'rgba(255,255,255,0.85)' : ev.color,
                          fontVariationSettings: "'FILL' 1",
                          transition: 'color 0.2s',
                        }}
                      >
                        {ev.icon}
                      </span>

                      {/* Text */}
                      <div className="min-w-0">
                        <p
                          className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5"
                          style={{ color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--color-on-surface-variant)', transition: 'color 0.2s' }}
                        >
                          {ev.date}
                        </p>
                        <p
                          className="text-[12px] font-semibold leading-snug"
                          style={{ color: isActive ? '#fff' : 'var(--color-on-surface)', transition: 'color 0.2s' }}
                        >
                          {ev.title}
                        </p>
                      </div>

                      {/* Chevron */}
                      <span
                        className="material-symbols-outlined shrink-0 ml-auto self-center"
                        style={{
                          fontSize: 14,
                          color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--color-outline)',
                          transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s, color 0.2s',
                        }}
                      >
                        chevron_right
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="ww2-col-detail p-4 flex flex-col gap-3 justify-start">

            {activeEvent ? (
              <div key={activeEvent.id} className="ww2-fadein flex flex-col gap-3">

                {/* Event card */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: activeEvent.color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontVariationSettings: "'FILL' 1" }}
                    >
                      {activeEvent.icon}
                    </span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {activeEvent.date}
                      </p>
                      <p className="text-sm font-bold text-white leading-tight">
                        {activeEvent.title}
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {activeEvent.body}
                  </p>
                </div>

                {/* Exam tip */}
                {activeEvent.tip && (
                  <div className="rounded-xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color: '#f59e0b', fontSize: 15 }}>
                      lightbulb
                    </span>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#78350f' }}>
                      {activeEvent.tip}
                    </p>
                  </div>
                )}

                {/* Navigate between events */}
                <div className="flex gap-2 mt-1">
                  {(() => {
                    const idx = EVENTS.findIndex((e) => e.id === activeEvent.id);
                    const prev = EVENTS[idx - 1];
                    const next = EVENTS[idx + 1];
                    return (
                      <>
                        {prev && (
                          <button
                            type="button"
                            onClick={() => handleSelect(prev.id)}
                            className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95 text-left"
                            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_back</span>
                            <span className="truncate">{prev.title}</span>
                          </button>
                        )}
                        {next && (
                          <button
                            type="button"
                            onClick={() => handleSelect(next.id)}
                            className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95 justify-end text-right"
                            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                          >
                            <span className="truncate">{next.title}</span>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Completion badge */}
                {revealed.size === EVENTS.length && (
                  <div className="rounded-xl p-3 flex gap-2 items-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span className="material-symbols-outlined shrink-0" style={{ color: '#16a34a', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <p className="text-[11px] font-semibold" style={{ color: '#15803d' }}>
                      Je hebt alle gebeurtenissen bekeken. Goed gedaan!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <span className="ww2-nudge text-2xl">👈</span>
                <p className="text-sm text-center leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Klik op een gebeurtenis in de tijdlijn om meer te lezen
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
