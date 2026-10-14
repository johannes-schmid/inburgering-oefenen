'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Lock, Pause, Play, RotateCcw, RotateCw, Volume2 } from 'lucide-react';
import Field from '@/components/glas/Field';
import './glas-player.css';

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
  const progress = countdown !== null ? 0 : pct / 100;

  /* Glas §10: de glazen capsule op een Gracht-veld. De golf is het beeld; een onzichtbare
     range erbovenop is de bediening, zodat toetsenbord en schermlezer hem gewoon kunnen gebruiken. */
  const capsule = (
    <div className={`g-xaud${compact ? ' g-xaud-sm' : ''}${examenAudio ? ' g-xaud-strict' : ''}`}>
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
        <>
          {geblokkeerd ? (
            <button
              type="button"
              onClick={() => { setGeblokkeerd(false); void audioRef.current?.play().catch(() => setGeblokkeerd(true)); }}
              className="g-xap"
              aria-label="Start het fragment"
            >
              <Play aria-hidden style={{ marginInlineStart: 2 }} />
            </button>
          ) : countdown !== null ? (
            <Countdown left={countdown} total={examenAudio.readSeconds} />
          ) : (
            <span className="g-xcd" aria-hidden>
              {spent ? <Check size={22} strokeWidth={2.6} /> : <Volume2 size={22} strokeWidth={2.2} />}
            </span>
          )}
          <div className="g-xaud-mid">
            <Wave progress={progress} />
            <div className="g-xtm">
              <span aria-live="polite">
                {geblokkeerd
                  ? 'Klik op start om het fragment te horen.'
                  : countdown !== null
                    ? `Lees de vraag · start over ${countdown} sec`
                    : spent
                      ? 'Fragment afgelopen.'
                      : 'Het fragment speelt.'}
              </span>
              <span>{countdown !== null || spent ? fmt(duration) : `${fmt(current)} / ${fmt(duration)}`}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pauzeer' : 'Speel af'}
            className="g-xap"
          >
            {playing ? <Pause aria-hidden /> : <Play aria-hidden style={{ marginInlineStart: 2 }} />}
          </button>
          <div className="g-xaud-mid">
            <div className="g-xwv-wrap">
              <Wave progress={progress} />
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
                className="g-xwv-range"
              />
            </div>
            <div className="g-xtm">
              <span>{fmt(current)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
          <div className="g-xaud-side">
            <button type="button" className="g-xab" onClick={() => skip(-10)} title="10 seconden terug" aria-label="10 seconden terug">
              <RotateCcw aria-hidden />
            </button>
            <button type="button" className="g-xab" onClick={() => skip(10)} title="10 seconden vooruit" aria-label="10 seconden vooruit">
              <RotateCw aria-hidden />
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      {label && <span className="g-mono g-xlabel">{label}</span>}
      <Field variant="gracht" className={`g-xlstage${compact ? ' g-xlstage-sm' : ''}`}>
        {capsule}
      </Field>
      {examenAudio && (
        <p className="g-xlockline">
          <span className="g-xbdg"><Lock aria-hidden />1 keer</span>
          Je hoort dit fragment één keer, net als op het echte examen. Terugspoelen kan niet.
        </p>
      )}
    </div>
  );
}

/** De golfvorm van glas.html §10: vaste vorm, de afgespeelde balkjes navy, een oranje afspeelkop. */
const WAVE_BARS = 56;
const WAVE_HEIGHTS = Array.from({ length: WAVE_BARS }, (_, i) =>
  5 + Math.round(Math.abs(Math.sin(i * 0.5) * Math.cos(i * 0.23)) * 26 + (i % 4) * 1.5)
);

function Wave({ progress }: { progress: number }) {
  return (
    <div className="g-xwv" aria-hidden>
      {WAVE_HEIGHTS.map((h, i) => (
        <b key={i} className={progress > 0 && i / WAVE_BARS < progress ? 'on' : undefined} style={{ height: h }} />
      ))}
      {progress > 0 && progress < 1 && <span className="g-xwv-ph" style={{ insetInlineStart: `${progress * 100}%` }} />}
    </div>
  );
}

/** De leestijd als ring die leegloopt; het getal in het midden is wat de kandidaat leest. */
function Countdown({ left, total }: { left: number; total: number }) {
  const c = 2 * Math.PI * 25;
  const frac = total > 0 ? Math.max(0, left) / total : 0;
  return (
    <span className="g-xcd" role="timer" aria-label={`Start over ${left} seconden`}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(0,43,109,.12)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r="25" fill="none" stroke="#002b6d" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
        />
      </svg>
      {left}
    </span>
  );
}

function fmt(secs: number): string {
  if (!Number.isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
