'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react';

/**
 * The listening player, modelled on DUO's: back-10 / play-pause / forward-10 plus a
 * seekable bar.
 *
 * ## Twee standen, en de strenge is niet de standaard
 * **Vrij afspelen** (de standaard) is wat A2, KNM en de introtracks gebruiken: spelen, pauzeren,
 * spoelen, zo vaak als je wilt.
 *
 * **`examenAudio`** is de stand van het échte DUO-examen, en is er sinds 16-09 op verzoek van de
 * eigenaar: je krijgt eerst `readSeconds` seconden om de vraag te lezen, dan start het fragment
 * vanzelf, en je hoort het **één keer**. Geen spoelen, geen herhalen. Dat is geen striktheid om
 * de striktheid: onbeperkt herhalen maakt van een luistertoets een leestoets van de transcriptie
 * in je hoofd, en dan oefent de kandidaat iets anders dan wat DUO afneemt.
 *
 * Dit keert de eerdere regel om ("replay is deliberately unlimited and uncounted"), die uitging
 * van DUO's *speler* op de oefensite. De instructie van het examen zelf zegt het andere, en die
 * telt zwaarder.
 *
 * Autoplay heeft een gebruikersgebaar nodig, anders blokkeert de browser het. Dat gebaar is het
 * instructiescherm: daar speelt de kandidaat de gesproken uitleg af, en dat deblokkeert het
 * programmatisch afspelen voor de rest van de zitting. Zonder dat scherm zou de eerste vraag
 * stil blijven en als kapot lezen.
 */
export default function AudioPlayer({
  src,
  label,
  compact = false,
  examenAudio,
}: {
  src: string;
  label?: string;
  compact?: boolean;
  examenAudio?: { readSeconds: number };
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  // `null` = niet aan het aftellen. In de vrije stand blijft dit altijd null.
  const [countdown, setCountdown] = useState<number | null>(examenAudio?.readSeconds ?? null);
  const [spent, setSpent] = useState(false);
  /** De autostart is door de browser geweigerd; toon één startknop. Zie de `catch` hieronder. */
  const [geblokkeerd, setGeblokkeerd] = useState(false);

  /* Het aftellen, en daarna één keer starten. De timer hangt aan `src`, dus een nieuw fragment
     begint zijn eigen 25 seconden — precies wat het remounten per vraag al regelt. */
  // Let op: de dependency is het gétal, niet het object. Een ouder die `{ readSeconds: 25 }`
  // inline meegeeft maakt elke render een nieuw object, en dan zou het aftellen eindeloos
  // opnieuw beginnen.
  const readSeconds = examenAudio?.readSeconds ?? null;
  useEffect(() => {
    if (readSeconds === null) return;
    setCountdown(readSeconds);
    setSpent(false);
    setGeblokkeerd(false);
    let left = readSeconds;
    const id = setInterval(() => {
      left -= 1;
      setCountdown(left);
      if (left <= 0) {
        clearInterval(id);
        setCountdown(null);
        void audioRef.current?.play().catch(() => {
          // Geblokkeerd door de browser omdat er nog geen gebruikersgebaar was — de kandidaat
          // heeft de gesproken uitleg op het instructiescherm niet afgespeeld. Zonder vangnet
          // staat hij dan voor een fragment dat nooit begint en géén knop om het te starten,
          // want de examenstand heeft geen transport. Eén startknop is dat vangnet.
          setGeblokkeerd(true);
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [readSeconds, src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    // In de examenstand is er niets te hervatten: het fragment is op.
    if (examenAudio && spent) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  }

  function skip(seconds: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(Math.max(a.currentTime + seconds, 0), a.duration || 0);
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  // §7.2b: the audio surface is **always a `primary` card**, so a listening item is recognisable
  // before a word of it is read. Everything on it takes `on_primary`; the transport disc is the one
  // `secondary_container` element, and it carries the pressed-coin inner glow of §5.
  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        padding: compact ? '0.75rem 1rem' : '1.125rem 1.25rem',
        background: 'var(--gradient-brand)',
        boxShadow: 'var(--shadow-ambient)',
      }}
    >
      {label && (
        <p className="text-[0.65rem] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.62)', letterSpacing: '0.12em' }}>
          {label}
        </p>
      )}

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        // Swapping `src` resets through the element's own events rather than an effect, so a
        // new fragment can never inherit the previous one's position or duration.
        onLoadStart={() => { setPlaying(false); setCurrent(0); setDuration(0); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); if (examenAudio) setSpent(true); }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
      />

      {examenAudio ? (
        /* De examenstand heeft geen transport: er valt niets te spoelen en niets te herhalen.
           Wat er wél moet staan is wáár je bent — aftellen, spelen, of afgelopen — want zonder
           dat leest een stil vak als een kapotte speler. */
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold m-0" style={{ color: '#fff' }}>
              {geblokkeerd
                ? 'Klik op start om het fragment te horen.'
                : countdown !== null
                  ? 'Lees de vraag en de antwoorden.'
                  : spent
                    ? 'Fragment afgelopen.'
                    : 'Het fragment speelt.'}
            </p>
            <span
              className="text-sm font-bold whitespace-nowrap"
              style={{ fontVariantNumeric: 'tabular-nums', color: countdown !== null ? 'var(--color-secondary)' : 'rgba(255,255,255,0.75)' }}
            >
              {countdown !== null
                ? `start over ${countdown}s`
                : spent
                  ? fmt(duration)
                  : `${fmt(current)} / ${fmt(duration)}`}
            </span>
          </div>

          {/* Een balk die alleen toont, niet bedient: geen input, geen cursor, geen focus. */}
          <div
            aria-hidden
            style={{
              height: 6,
              borderRadius: 999,
              background: `linear-gradient(to right, #a24000 0%, #fe762c ${countdown !== null ? 0 : pct}%, rgba(255,255,255,0.28) ${countdown !== null ? 0 : pct}%, rgba(255,255,255,0.28) 100%)`,
            }}
          />

          {geblokkeerd && (
            <button
              type="button"
              onClick={() => { setGeblokkeerd(false); void audioRef.current?.play().catch(() => setGeblokkeerd(true)); }}
              className="exam-audio-play inline-flex items-center gap-2 rounded-xl font-bold text-sm border-0 cursor-pointer self-start"
              style={{ padding: '0.55rem 1.1rem', background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}
            >
              <Play size={15} strokeWidth={2.5} aria-hidden />
              Start het fragment
            </button>
          )}

          <p className="text-xs m-0" style={{ color: 'rgba(255,255,255,0.62)' }}>
            Je hoort dit fragment één keer, net als op het echte examen.
          </p>
        </div>
      ) : (
      <div className="flex items-center gap-3">
        <IconBtn onClick={() => skip(-10)} title="10 seconden terug">
          <RotateCcw size={16} strokeWidth={2.2} aria-hidden />
        </IconBtn>

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pauzeer' : 'Speel af'}
          className="exam-audio-play inline-flex items-center justify-center rounded-full border-0 cursor-pointer flex-shrink-0"
          style={{
            width: compact ? 44 : 56,
            height: compact ? 44 : 56,
            background: 'var(--color-secondary-container)',
            color: 'var(--color-on-secondary-container)',
            boxShadow: 'var(--inner-glow), 0 4px 16px rgba(0,0,0,0.20)',
          }}
        >
          {playing
            ? <Pause size={compact ? 19 : 22} strokeWidth={2.4} aria-hidden />
            : <Play size={compact ? 19 : 22} strokeWidth={2.4} style={{ marginLeft: 2 }} aria-hidden />}
        </button>

        <IconBtn onClick={() => skip(10)} title="10 seconden vooruit">
          <RotateCw size={16} strokeWidth={2.2} aria-hidden />
        </IconBtn>

        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            aria-label="Zoek in de audio"
            onChange={e => {
              const a = audioRef.current;
              if (a) a.currentTime = Number(e.target.value);
              setCurrent(Number(e.target.value));
            }}
            className="exam-audio-range flex-1 min-w-0"
            style={{ '--played': `${pct}%` } as React.CSSProperties}
          />
          <span
            className="text-xs font-semibold whitespace-nowrap"
            style={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.75)' }}
          >
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
      </div>
      )}

      <style>{`
        .exam-audio-play {
          transition: transform .18s cubic-bezier(0.22,1,0.36,1), opacity .18s ease;
        }
        .exam-audio-play:hover { transform: scale(1.06); }
        .exam-audio-play:active { transform: scale(0.96); }
        .exam-audio-play:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        .exam-audio-range {
          appearance: none;
          height: 6px;
          border-radius: 999px;
          /* On a navy card the unplayed track is on_primary at 28%, not a light neutral: a
             #e0e3e5 rail on navy reads as a white line drawn across the card. */
          background: linear-gradient(
            to right,
            #a24000 0%, #fe762c var(--played),
            rgba(255,255,255,0.28) var(--played), rgba(255,255,255,0.28) 100%
          );
          cursor: pointer;
        }
        .exam-audio-range::-webkit-slider-thumb {
          appearance: none;
          width: 15px; height: 15px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 2.5px #fe762c;
          cursor: pointer;
        }
        .exam-audio-range::-moz-range-thumb {
          width: 15px; height: 15px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 2.5px #fe762c;
          cursor: pointer;
        }
        .exam-audio-range:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .exam-audio-play { transition: none; }
        }
      `}</style>
    </div>
  );
}

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  // Glass, not an outlined pill: §2's glass rule, and it drops a 1.5px border the no-line rule
  // forbids. The visible disc stays 34px and the hit area is padded out with a transparent
  // outline rather than by growing the disc.
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="exam-audio-skip inline-flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
      style={{
        width: 34, height: 34,
        background: 'rgba(248,249,251,0.16)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: '#fff',
        outline: '5px solid transparent',
        outlineOffset: 0,
      }}
    >
      {children}
      <style>{`
        .exam-audio-skip { transition: transform .16s ease, background-color .16s ease; }
        .exam-audio-skip:hover { transform: translateY(-1px); background: rgba(248,249,251,0.26) !important; }
        .exam-audio-skip:active { transform: translateY(0) scale(0.94); }
        .exam-audio-skip:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .exam-audio-skip { transition: none; } }
      `}</style>
    </button>
  );
}

function fmt(secs: number): string {
  if (!Number.isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
