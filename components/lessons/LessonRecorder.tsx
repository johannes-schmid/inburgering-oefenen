'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';
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
          setLevel(Math.min(1, Math.sqrt(sum / frame.length) * 4));
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

  return (
    <div className="rec">
      <div className="rec-row">
        {recording ? (
          <button type="button" className="rec-btn is-live" onClick={() => void stop()}>
            <Square size={13} strokeWidth={3} /> {labels.stop}
          </button>
        ) : (
          <button type="button" className="rec-btn" onClick={() => void start()} disabled={disabled}>
            {blob
              ? <><RotateCcw size={14} strokeWidth={2.5} /> {labels.again}</>
              : <><Mic size={14} strokeWidth={2.5} /> {labels.record}</>}
          </button>
        )}

        {recording && (
          <>
            {/* De niveaumeter komt uit de frames die de recorder tóch al maakt, dus hij toont
                de audio die daadwerkelijk wordt opgenomen en niet de mening van een tweede
                analyser. `transform` en niet `width`: alleen transform en opacity mogen
                animeren. */}
            <span className="rec-meter" aria-hidden="true">
              <i style={{ transform: `scaleX(${Math.max(0.04, level)})` }} />
            </span>
            <span className="rec-time">
              {labels.recording} · {remaining} {labels.seconds}
            </span>
          </>
        )}

        {!recording && previewUrl && (
          <audio className="rec-play" controls preload="metadata" src={previewUrl} />
        )}
      </div>

      {error && <p className="rec-error">{error}</p>}

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
