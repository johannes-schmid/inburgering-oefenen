'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, RotateCw, Repeat } from 'lucide-react';
import Field from '@/components/glas/Field';
import { Countdown, Wave, fmt } from './AudioPlayer';
import './glas-player.css';

/**
 * Een A2-luistervraag zoals DUO hem afspeelt: eerst de situatie, dan leestijd, dan het fragment.
 *
 * DUO leest bij élke vraag de situatie voor ("… Lees eerst de vraag. Luister daarna naar de
 * tekst."), laat een klok aflopen terwijl de kandidaat de vraag leest, en start daarna het
 * fragment vanzelf. Wie opnieuw wil luisteren hoort de situatie weer, en meteen daarna het
 * fragment — zonder tweede leestijd. Na het fragment leest de speler de vraag en de antwoorden
 * voor; dat doet `McqQuestion`, en `onFragmentEnd` is het startsein.
 *
 * Eén `<audio>` voor beide opnames: de klik op "Start het examen" (of de geluidstest) heeft hem
 * al vrijgegeven, en een tweede element zou per browser opnieuw om een gebaar kunnen vragen.
 * Weigert de browser het afspelen toch, dan blijft er één startknop staan.
 *
 * Anders dan B1 (`AudioPlayer` met `examenAudio`) blijft hier pauzeren, spoelen en herhalen
 * toegestaan: dat is de A2-regel die de veertig gepubliceerde examens al hadden.
 */
type Stage = 'situation' | 'read' | 'fragment' | 'done';

export default function ListenSequence({
  situationUrl,
  fragmentUrl,
  readSeconds,
  onReplay,
  onFragmentEnd,
}: {
  situationUrl: string | null;
  fragmentUrl: string;
  readSeconds: number;
  onReplay: () => void;
  onFragmentEnd: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stage, setStage] = useState<Stage>(situationUrl ? 'situation' : 'read');
  const [countdown, setCountdown] = useState(readSeconds);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const src = stage === 'situation' ? situationUrl : stage === 'read' ? null : fragmentUrl;

  function play() {
    const a = audioRef.current;
    if (!a) return;
    setBlocked(false);
    void a.play().catch(() => setBlocked(true));
  }

  // Elke nieuwe opname start vanzelf; de leestijd telt af zonder geluid.
  useEffect(() => {
    if (stage !== 'situation' && stage !== 'fragment') return;
    void audioRef.current?.play().then(() => setBlocked(false), () => setBlocked(true));
  }, [stage]);

  useEffect(() => {
    if (stage !== 'read') return;
    let left = readSeconds;
    const id = setInterval(() => {
      left -= 1;
      setCountdown(left);
      if (left <= 0) {
        clearInterval(id);
        setStage('fragment');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [stage, readSeconds]);

  /** Opnieuw: situatie, en daarna meteen het fragment. */
  const replayRef = useRef(false);

  function onEnded() {
    setPlaying(false);
    if (stage === 'situation') {
      setCountdown(readSeconds);
      setStage(replayRef.current ? 'fragment' : 'read');
    }
    else if (stage === 'fragment') {
      setStage('done');
      onFragmentEnd();
    }
  }

  function replay() {
    replayRef.current = true;
    onReplay();
    const a = audioRef.current;
    if (situationUrl) {
      if (stage === 'situation' && a) { a.currentTime = 0; play(); }
      else setStage('situation');
    } else if (stage === 'fragment' && a) {
      a.currentTime = 0;
      play();
    } else setStage('fragment');
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (stage === 'done') { replay(); return; }
    if (a.paused) play();
    else a.pause();
  }

  function skip(seconds: number) {
    const a = audioRef.current;
    if (!a || stage !== 'fragment') return;
    a.currentTime = Math.min(Math.max(a.currentTime + seconds, 0), a.duration || 0);
  }

  const progress = stage === 'fragment' && duration > 0 ? current / duration : stage === 'done' ? 1 : 0;
  const status = blocked
    ? 'Klik op afspelen om te beginnen.'
    : stage === 'situation'
      ? 'U hoort de situatie.'
      : stage === 'read'
        ? `Lees de vraag · het fragment start over ${countdown} sec`
        : stage === 'fragment'
          ? 'Het fragment speelt.'
          : 'Fragment afgelopen. U hoort nu de vraag.';

  return (
    <div>
      <span className="g-mono g-xlabel">Fragment</span>
      <Field variant="gracht" className="g-xlstage">
        <div className="g-xaud">
          <audio
            ref={audioRef}
            src={src ?? undefined}
            preload="auto"
            onLoadStart={() => { setCurrent(0); setDuration(0); }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={onEnded}
            onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
            onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
          />

          {stage === 'read' && !blocked ? (
            <Countdown left={countdown} total={readSeconds} />
          ) : (
            <button
              type="button"
              onClick={toggle}
              aria-label={stage === 'done' ? 'Opnieuw luisteren' : playing ? 'Pauzeer' : 'Speel af'}
              className="g-xap"
            >
              {stage === 'done'
                ? <Repeat aria-hidden />
                : playing ? <Pause aria-hidden /> : <Play aria-hidden style={{ marginInlineStart: 2 }} />}
            </button>
          )}

          <div className="g-xaud-mid">
            <Wave progress={progress} />
            <div className="g-xtm">
              <span aria-live="polite">{status}</span>
              <span>{stage === 'fragment' ? `${fmt(current)} / ${fmt(duration)}` : stage === 'situation' ? fmt(duration - current) : ''}</span>
            </div>
          </div>

          {stage === 'fragment' && (
            <div className="g-xaud-side">
              <button type="button" className="g-xab" onClick={() => skip(-10)} title="10 seconden terug" aria-label="10 seconden terug">
                <RotateCcw aria-hidden />
              </button>
              <button type="button" className="g-xab" onClick={() => skip(10)} title="10 seconden vooruit" aria-label="10 seconden vooruit">
                <RotateCw aria-hidden />
              </button>
            </div>
          )}
        </div>
      </Field>
      <div className="g-xlseq">
        {stage !== 'read' && (
          <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={replay}>
            <Repeat aria-hidden />
            Opnieuw luisteren
          </button>
        )}
      </div>
    </div>
  );
}
