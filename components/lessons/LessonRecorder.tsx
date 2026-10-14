'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Pause, Play, RotateCcw } from 'lucide-react';
import { WavRecorder, canRecordWav } from '@/lib/wav-recorder';
import {
  RealtimeTranscriber,
  canUseRealtimeTranscript,
  type TranscriptState,
} from '@/lib/realtime-transcript';

/**
 * De microfoon in een les: opnemen, terughoren, en horen wat er verstaan werd.
 *
 * ── ÉÉN RECORDER, TWEE OPGAVESOORTEN ─────────────────────────────────────────
 * `naspreken` (blok B van Spreken: zeg de zin na) en `opnemen` (blok C en D: geef een
 * gesproken antwoord) gebruiken hem beide. Twee kopieën van dezelfde microfoonlogica is hoe
 * de ene soort wél een niveaumeter krijgt en de andere niet, en hoe er twee bugs ontstaan waar
 * er één was.
 *
 * ── WAT DIT NIET IS ──────────────────────────────────────────────────────────
 * Dit is **niet** `components/exam/SpeakingTask.tsx`. Die component neemt op om in te
 * leveren: hij uploadt een WAV, laat hem beoordelen tegen een rubriek en toont de uitslag met
 * gemarkeerde spans. Hier wordt niets ingeleverd en niets beoordeeld — de opname blijft een
 * blob in het tabblad, de cursist hoort zichzelf terug, en dat is de hele opgave. Ze delen
 * daarom de *bouwstenen* (`WavRecorder`, `RealtimeTranscriber`) en niet de component: de
 * examenspeler meet, de les leert, en dat verschil is precies wat deze laag toevoegt.
 *
 * ── HET TRANSCRIPT IS EEN OBSERVATIE, GEEN CIJFER ────────────────────────────
 * Als de spraakherkenning aanslaat, staat er wat er verstaan is. Dat is voor uitspraak het
 * nuttigste signaal dat bestaat: je ziet zwart-op-wit dat "moeilijk" als iets anders
 * aankwam. Het wordt nooit tegen de doelzin afgezet en het bepaalt nooit of de opgave goed
 * is — een kruis omdat Scribe een accent niet volgde zou het tegendeel doen van wat deze
 * opgave moet doen, en het zou de enige belofte die dit product heeft ondermijnen.
 *
 * Mislukken mag: geen microfoontoegang, geen sleutel, geen netwerk — elk daarvan geeft een
 * regel tekst en laat de rest van de les met rust. De transcriptie is optioneel bovenop de
 * opname, nooit een voorwaarde ervoor.
 */

export type RecorderLabels = {
  record: string;
  stop: string;
  again: string;
  recording: string;
  heard: string;
  heardNote: string;
  noMic: string;
  noRecorder: string;
  seconds: string;
  /** De knop van je eigen opname. Weglaten valt terug op Nederlands. */
  play?: string;
  pause?: string;
};

type Props = {
  /** Bovengrens in seconden. De opname stopt zichzelf; het examen doet dat ook. */
  limit: number;
  labels: RecorderLabels;
  /** Meldt de eerste geslaagde opname, zodat de opgave zich als gedaan kan afronden. */
  onRecorded?: () => void;
  disabled?: boolean;
};

export default function LessonRecorder({ limit, labels, onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  /** De laatste vijftien niveaus, voor de staafjes in de knop. Een ref en geen state: `level`
      rendert al per frame. */
  const levels = useRef<number[]>(Array(15).fill(0));
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [sttState, setSttState] = useState<TranscriptState>('idle');

  const recorderRef = useRef<WavRecorder | null>(null);
  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  // Afgeleid en niet in state: anders bestaat er één render waarin de URL en de blob het
  // oneens zijn. Het effect ruimt alleen op — één object-URL per herkansing laten liggen
  // houdt elke weggegooide opname in het geheugen zolang de les open staat.
  const previewUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const stop = useCallback(async () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    transcriberRef.current?.stop();
    const recorder = recorderRef.current;
    if (!recorder?.active) return;
    recorderRef.current = null;
    setLevel(0);
    try {
      const { blob: out } = await recorder.stop();
      setRecording(false);
      setBlob(out);
      onRecorded?.();
    } catch {
      setRecording(false);
      setError(labels.noRecorder);
    }
  }, [labels.noRecorder, onRecorded]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    recorderRef.current?.cancel();
    transcriberRef.current?.stop();
  }, []);

  async function start() {
    setError(null);
    setTranscript('');
    setBlob(null);
    if (!canRecordWav()) {
      setError(labels.noRecorder);
      return;
    }

    // De transcriptie eerst, en optioneel: faalt hij, dan weet je dat vóór de microfoon
    // opengaat, en de opname gaat gewoon door.
    if (canUseRealtimeTranscript()) {
      const transcriber = new RealtimeTranscriber({
        onText: (full, partial) => setTranscript(`${full}${partial}`),
        onState: setSttState,
        onError: () => setSttState('error'),
      });
      try {
        await transcriber.start();
        transcriberRef.current = transcriber;
      } catch {
        transcriber.stop();
        transcriberRef.current = null;
        setSttState('error');
      }
    }

    const recorder = new WavRecorder();
    try {
      await recorder.start({
        onPcm: frame => {
          transcriberRef.current?.pushPcm(frame);
          let sum = 0;
          for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
          const lv = Math.min(1, Math.sqrt(sum / frame.length) * 4);
          levels.current = [...levels.current.slice(1), lv];
          setLevel(lv);
        },
      });
    } catch {
      recorder.cancel();
      transcriberRef.current?.stop();
      transcriberRef.current = null;
      setError(labels.noMic);
      return;
    }

    recorderRef.current = recorder;
    setRecording(true);
    setElapsed(0);
    elapsedRef.current = 0;
    tickRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= limit) void stop();
    }, 1000);
  }

  const remaining = Math.max(limit - elapsed, 0);
  /* De ring in de knop loopt vol over de toegestane tijd. 2πr bij r=20. */
  const C = 125.66;
  const filled = Math.min(1, elapsed / Math.max(1, limit)) * C;

  /**
   * Glas §10/§11 "rustig, met één duidelijke knop": één grote navy pil "Start opname". Tijdens
   * het opnemen blijft hij op dezelfde plek staan, wordt wit, en toont de tijd in de ring en het
   * niveau in de staafjes. Geen puls en geen oranje vlak; alleen het kleine oranje stipje zegt
   * dat er opgenomen wordt. Daarna: zelf terugluisteren en eventueel opnieuw. Er wordt niets
   * nagekeken en niets verstuurd — zie de kop van dit bestand.
   */
  return (
    <div className="rec">
      {!previewUrl || recording
        ? (
          <div className="rec-stage">
            {recording ? (
              <button type="button" className="rec-big is-live" onClick={() => void stop()} aria-label={labels.stop}>
                <span className="rec-big-mc" aria-hidden>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(0,43,109,.12)" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="20" fill="none" stroke="#002b6d" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${filled.toFixed(1)} ${C}`}
                    />
                  </svg>
                  <i />
                </span>
                <span className="rec-dot" aria-hidden />
                <span className="rec-big-time g-tnum">{remaining} {labels.seconds}</span>
                <span className="rec-big-lv" aria-hidden>
                  {levels.current.map((v, i) => <i key={i} style={{ transform: `scaleY(${Math.max(0.12, v).toFixed(2)})` }} />)}
                </span>
                <span className="rec-big-stop">{labels.stop}</span>
              </button>
            ) : (
              <button type="button" className="rec-big" onClick={() => void start()} disabled={disabled}>
                <span className="rec-big-mc" aria-hidden><Mic size={20} strokeWidth={2.4} /></span>
                {labels.record}
              </button>
            )}
            {recording && <span className="sr-only" aria-live="polite">{labels.recording}</span>}
          </div>
        )
        : (
          <div className="rec-stage">
            <RecPlayback src={previewUrl} play={labels.play ?? 'Opname afspelen'} pause={labels.pause ?? 'Pauzeren'} />
            <button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={() => void start()} disabled={disabled}>
              <RotateCcw size={14} strokeWidth={2.5} aria-hidden /> {labels.again}
            </button>
          </div>
        )}

      {error && <p className="rec-error" role="alert">{error}</p>}

      {(transcript || (recording && sttState === 'listening')) && (
        <div className="rec-heard">
          <span className="mini-label">{labels.heard}</span>
          <p aria-live="polite">{transcript || '…'}</p>
          <p className="rec-heard-note">{labels.heardNote}</p>
        </div>
      )}

    </div>
  );
}

/**
 * Je eigen opname terughoren: één ronde knop en een balk die volloopt. De blob blijft in het
 * tabblad (`URL.createObjectURL`); dit is een gewoon `<audio>`-element zonder eigen chrome.
 */
function RecPlayback({ src, play, pause }: { src: string; play: string; pause: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const [dur, setDur] = useState(0);
  return (
    <div className="rec-play-row">
      <button
        type="button"
        className="rec-pb"
        aria-label={playing ? pause : play}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) void a.play(); else a.pause();
        }}
      >
        {playing ? <Pause size={18} strokeWidth={2.4} aria-hidden /> : <Play size={18} strokeWidth={2.4} aria-hidden />}
      </button>
      <span className="rec-play-bar" aria-hidden><i style={{ transform: `scaleX(${pct})` }} /></span>
      <span className="rec-play-t g-mono g-tnum">{dur > 0 ? `${Math.floor(Math.round(dur) / 60)}:${String(Math.round(dur) % 60).padStart(2, '0')}` : ''}</span>
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPct(0); }}
        onTimeUpdate={e => {
          const a = e.currentTarget;
          if (Number.isFinite(a.duration) && a.duration > 0) setPct(a.currentTime / a.duration);
        }}
        onLoadedMetadata={e => { if (Number.isFinite(e.currentTarget.duration)) setDur(e.currentTarget.duration); }}
      />
    </div>
  );
}
