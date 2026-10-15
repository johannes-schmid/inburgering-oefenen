'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Clock, Info, Loader2, Mic, RotateCcw, TriangleAlert } from 'lucide-react';
import type { FeedbackHighlight, RubricFeedbackState } from './RubricFeedback';
import AudioPlayer from './AudioPlayer';
import './glas-player.css';
import { WavRecorder, canRecordWav } from '@/lib/wav-recorder';
import {
  RealtimeTranscriber,
  canUseRealtimeTranscript,
  type TranscriptState,
} from '@/lib/realtime-transcript';
import type { OpenTaskItem } from '@/lib/exam-content';

export type SpeakingAnswer = {
  blob: Blob | null;
  seconds: number;
  /** The live readback, kept so the player can show what was heard. Never the graded transcript. */
  liveTranscript?: string;
};

type Props = {
  task: OpenTaskItem;
  answer: SpeakingAnswer;
  onChange: (next: SpeakingAnswer) => void;
  taskNumber: number;
  total: number;
  /**
   * Oefenmodus shows the readback while speaking. In Examenmodus it is withheld: DUO gives no
   * readback, and a candidate reading their own words mid-answer is self-correcting rather than
   * speaking, which is a different skill.
   */
  liveTranscript?: boolean;
  /**
   * The review action lives in this pane rather than under the whole task, so "Nakijken" sits next
   * to the words it is about. Once graded, the same pane marks the spans in place — the candidate
   * reads the criticism against their own sentence instead of a second copy of it further down.
   */
  review?: {
    state: RubricFeedbackState;
    onGrade: () => void;
    /** The graded transcript. Differs from the live readback, so highlights index into this. */
    answerText: string | null;
    highlights: FeedbackHighlight[];
  };
  /**
   * The assessment, rendered **under the question** rather than full-width below everything.
   *
   * The original 1a spec put it across the bottom, which in practice left the question column half
   * empty and pushed the result a screen and a half down. Sitting it beside the recorder puts the
   * score next to the question it answers and roughly halves the page.
   */
  feedback?: ReactNode;
};

const IMAGE_RULE: Record<OpenTaskItem['image_usage'], string | null> = {
  none: null,
  react: 'Kijk naar het plaatje en reageer op de situatie.',
  describe: 'Gebruik steeds het plaatje.',
  choose: 'Kies één plaatje en leg uit waarom.',
  cover_all: 'Vertel iets bij elk plaatje.',
};

/** Bars in the level meter. Fixed count so the layout never reflows while speaking. */
const METER_BARS = 15;

/**
 * One Spreken task, laid out as design option **1a "Split"**: the question prominent on the left,
 * recording and transcription on the right, and the assessment full-width below (rendered by
 * `ExamShell`, so it spans both columns).
 *
 * Below 900px the two panes stack — question, then recorder, then transcript — because at phone
 * width a side-by-side would give the prompt about twenty characters a line, and the prompt is the
 * thing the candidate has to hold in their head while talking.
 *
 * DUO's onderdeel 1 uses video; we deliberately use audio plus a still image instead — a decision
 * recorded in CLAUDE.md, not an omission. `image_usage` is shown because it is a *gradable*
 * requirement: the rubric scores whether all pictures were used.
 *
 * Records **WAV**, not the WebM `MediaRecorder` would give: the grading model reads
 * wav/mp3/aiff/aac/ogg/flac and not Opus, and Spreken is graded from the recording itself. See
 * `lib/wav-recorder.ts` for that decision and what it costs.
 */
export default function SpeakingTask({
  task,
  answer,
  onChange,
  taskNumber,
  total,
  liveTranscript = true,
  review,
  feedback,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [partial, setPartial] = useState('');
  const [sttState, setSttState] = useState<TranscriptState>('idle');
  const [sttError, setSttError] = useState<string | null>(null);

  const recorderRef = useRef<WavRecorder | null>(null);
  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const limit = task.max_record_seconds;

  // Derived rather than held in state, so there is no render where the URL and the blob
  // disagree. The effect only revokes: leaking one object URL per retake would keep every
  // discarded recording in memory for the rest of the exam.
  const previewUrl = useMemo(
    () => (answer.blob ? URL.createObjectURL(answer.blob) : null),
    [answer.blob]
  );
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
      const { blob, seconds } = await recorder.stop();
      setRecording(false);
      // `seconds` comes from the sample count, so it is the real length of the audio — a tab that
      // slept mid-recording would have skewed a wall-clock ticker.
      onChange({
        blob,
        seconds: Math.min(seconds, limit),
        liveTranscript: transcriberRef.current?.committedText || transcript || undefined,
      });
    } catch {
      setRecording(false);
      setError('De opname kon niet worden opgeslagen. Probeer het opnieuw.');
    }
  }, [limit, onChange, transcript]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    recorderRef.current?.cancel();
    transcriberRef.current?.stop();
  }, []);

  async function start() {
    setError(null);
    setSttError(null);
    setTranscript('');
    setPartial('');
    if (!canRecordWav()) {
      setError('Deze browser kan geen opnames maken. Gebruik een recente Chrome, Firefox of Safari.');
      return;
    }

    // The transcriber is optional and started first, so a failure here is known before the mic
    // opens — but it never blocks recording.
    let transcriber: RealtimeTranscriber | null = null;
    if (liveTranscript && canUseRealtimeTranscript()) {
      transcriber = new RealtimeTranscriber({
        onText: (full, part) => { setTranscript(full); setPartial(part); },
        onState: setSttState,
        onError: msg => setSttError(msg),
      });
      await transcriber.start();
      transcriberRef.current = transcriber;
    } else {
      setSttState('idle');
    }

    const recorder = new WavRecorder();
    try {
      await recorder.start({
        onPcm: frame => {
          transcriberRef.current?.pushPcm(frame);
          // Cheap RMS off the frames we already have, so the meter reflects the audio actually
          // being recorded rather than a second analyser node's view of it.
          let sum = 0;
          for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
          const rms = Math.sqrt(sum / frame.length);
          setLevel(Math.min(1, rms * 4));
        },
      });
    } catch {
      recorder.cancel();
      transcriberRef.current?.stop();
      transcriberRef.current = null;
      setError('Geen toegang tot de microfoon. Sta microfoongebruik toe in je browser.');
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
  const rule = IMAGE_RULE[task.image_usage];
  const hasRecording = Boolean(answer.blob);
  const grading = review?.state === 'grading';
  const graded = review?.state === 'graded';
  // Once graded, the authoritative transcript replaces the live readback: it is what was actually
  // scored, and it is what the highlight offsets index into.
  const gradedText = graded ? review?.answerText?.trim() || '' : '';
  const shownTranscript = gradedText || transcript || answer.liveTranscript || '';
  const ringC = 2 * Math.PI * 20;

  /* Glas §10 "Spreken": rust. Eén grote navy pill "Start opname" die tijdens het opnemen op
     dezelfde plek blijft staan, wit wordt en de tijd in de ring toont. Geen puls, geen oranje vlak;
     alleen het kleine oranje stipje zegt dat er opgenomen wordt. */
  return (
    <div className="g-xspeak">
      {/* ── Left: the question ── */}
      <section className="g-xbody g-xspeak-q">
        <div className="g-xqhead" style={{ justifyContent: 'space-between' }}>
          <span className="g-mono g-tnum">Opdracht {taskNumber} van {total}</span>
          <span className="g-xbdg"><Clock aria-hidden />Max. {limit} sec.</span>
        </div>

        {task.title && <h2 className="g-xtitle">{task.title}</h2>}

        {task.prompt_html && (
          <div
            className="g-xprompt exam-rich exam-rich-scroll"
            dangerouslySetInnerHTML={{ __html: task.prompt_html }}
          />
        )}

        {rule && (
          <p className="g-xnotice">
            <Info strokeWidth={2.4} aria-hidden />
            <span>{rule}</span>
          </p>
        )}

        {task.prompt_audio_url && (
          <div style={{ marginTop: 16 }}>
            <AudioPlayer src={task.prompt_audio_url} label="Vraag beluisteren" compact />
          </div>
        )}

        {task.images.length > 0 && (
          <div className={`g-xpics${task.images.length >= 3 ? ' g-xpics-3' : task.images.length === 2 ? ' g-xpics-2' : ''}`}>
            {task.images.map((img, i) => (
              <figure key={img.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.alt_text ?? ''} />
                {task.images.length > 1 && <span className="g-xpics-n" aria-hidden>{i + 1}</span>}
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* The assessment lives in the question column, so on a phone it must fall *after* the
          recorder — you cannot read a score before you have answered. `order` does that without
          duplicating the node. */}
      {feedback && <div className="g-xspeak-fb">{feedback}</div>}

      {/* ── Right: recording + transcription ── */}
      <section className="g-xbody g-xspeak-rec">
        <div className="g-xrec">
          <span className="g-mono">Opnemen</span>

          <div className="g-xrstep">
            {!recording ? (
              <button type="button" onClick={start} className="g-xrecbig" aria-label={hasRecording ? 'Opnieuw opnemen' : 'Start opname'}>
                <span className="g-xrecbig-mc">
                  {hasRecording ? <RotateCcw aria-hidden /> : <Mic aria-hidden />}
                </span>
                {hasRecording ? 'Opnieuw opnemen' : 'Start opname'}
              </button>
            ) : (
              <button type="button" onClick={() => void stop()} className="g-xrecbig g-xrecbig-live" aria-label="Stop opname">
                <span className="g-xrecbig-mc">
                  <svg className="g-xring" width="44" height="44" viewBox="0 0 44 44" aria-hidden>
                    <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(0,43,109,.12)" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="20" fill="none" stroke="#002b6d" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={ringC} strokeDashoffset={ringC * (1 - Math.min(elapsed / limit, 1))}
                    />
                  </svg>
                  <i />
                </span>
                <span className="g-xrecdot" aria-hidden />
                <span className="g-tnum" aria-live="off">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
                <span className="g-xlv" aria-hidden>
                  {Array.from({ length: METER_BARS }, (_, i) => {
                    // A centred, roughly bell-shaped response so the meter reads as a voice rather
                    // than a bar chart.
                    const distance = Math.abs(i - (METER_BARS - 1) / 2) / ((METER_BARS - 1) / 2);
                    const shape = 1 - distance * 0.75;
                    return <i key={i} style={{ transform: `scaleY(${Math.max(0.12, level * shape).toFixed(3)})` }} />;
                  })}
                </span>
                <span style={{ color: 'var(--ink-2)' }}>Stop</span>
              </button>
            )}
            <small aria-live="polite">
              {recording
                ? `Nog ${remaining} seconden. Druk op stop als je klaar bent.`
                : hasRecording
                  ? `Opname van ${Math.round(answer.seconds)} sec. Luister hem terug, of neem opnieuw op.`
                  : `Je hebt ${limit} seconden. Daarna kun je terugluisteren.`}
            </small>
            {error && (
              <p className="g-xrec-err">
                <TriangleAlert aria-hidden />
                {error}
              </p>
            )}
          </div>

          {previewUrl && !recording && (
            <AudioPlayer src={previewUrl} label="Jouw opname" compact />
          )}

          {/* ── Live transcription ── */}
          {liveTranscript && (
            <div className="g-xtranscript">
              <div className="g-xtranscript-hd">
                <span className="g-mono">Wat we horen</span>
                {sttState === 'connecting' && (
                  <span className="g-xtranscript-live">
                    <Loader2 size={12} className="g-xspin" aria-hidden /> verbinden…
                  </span>
                )}
                {sttState === 'listening' && (
                  <span className="g-xtranscript-live">
                    <span className="g-xrecdot" aria-hidden /> live
                  </span>
                )}
              </div>

              <div className="g-xtranscript-body" aria-live="polite">
                {graded && gradedText && review ? (
                  <MarkedTranscript text={gradedText} highlights={review.highlights} />
                ) : shownTranscript ? (
                  <p className={grading ? 'g-xreading' : undefined}>
                    {grading
                      ? shownTranscript
                          .split(/(\s+)/)
                          .map((w, i) =>
                            /^\s+$/.test(w) ? (
                              w
                            ) : (
                              // Each word lights in turn, so "being read" is legible as a pass over
                              // the sentence rather than an undifferentiated shimmer.
                              <span key={i} style={{ animationDelay: `${i * 55}ms` }}>
                                {w}
                              </span>
                            )
                          )
                      : (
                        <>
                          {transcript.slice(0, transcript.length - partial.length)}
                          {partial && <span className="g-xpartial">{partial}</span>}
                        </>
                      )}
                  </p>
                ) : sttError ? (
                  <p className="g-xtranscript-muted">
                    Live meelezen is nu niet beschikbaar. Je opname wordt gewoon opgenomen en
                    beoordeeld.
                  </p>
                ) : recording ? (
                  <p className="g-xtranscript-muted">Begin met praten…</p>
                ) : (
                  <p className="g-xtranscript-muted">
                    Tijdens het opnemen zie je hier wat er van je antwoord wordt herkend.
                  </p>
                )}
              </div>

              <p className="g-xtranscript-note">
                {graded
                  ? 'Dit is de tekst waarop je beoordeeld bent. Gemarkeerde plekken uit je antwoord tellen mee — beweeg erover of tab ernaartoe voor de uitleg.'
                  : 'Dit is wat de spraakherkenning live oppikt — een hulpmiddel, niet je beoordeling. Je wordt beoordeeld op je opname zelf.'}
              </p>

              {review && (
                <div className="g-xtranscript-act">
                  <button
                    type="button"
                    onClick={review.onGrade}
                    disabled={grading || !hasRecording}
                    className={`g-btn g-btn-sm ${graded ? 'g-btn-ghost' : 'g-btn-navy'}`}
                  >
                    {grading ? (
                      <>
                        <Loader2 className="g-xspin" aria-hidden /> Nakijken…
                      </>
                    ) : (
                      <>
                        {graded ? <RotateCcw aria-hidden /> : <Check strokeWidth={2.8} aria-hidden />}
                        {graded ? 'Opnieuw nakijken' : 'Nakijken'}
                      </>
                    )}
                  </button>
                  {!hasRecording && (
                    <span className="g-xfoot-meta">Neem eerst je antwoord op.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * The graded transcript with its spans marked in place.
 *
 * Offsets come from `matchHighlights` server-side, where every quote was verified to be a literal
 * substring — so nothing here can underline words the candidate did not say.
 */
function MarkedTranscript({
  text,
  highlights,
}: {
  text: string;
  highlights: FeedbackHighlight[];
}) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [i, h] of [...highlights].sort((a, b) => a.start - b.start).entries()) {
    if (h.start > cursor) parts.push(text.slice(cursor, h.start));
    parts.push(
      <mark key={i} className={`g-xmark g-xmark-${h.kind}`} tabIndex={0}>
        {text.slice(h.start, h.end)}
        <span className="g-xmark-note">{h.note}</span>
      </mark>
    );
    cursor = h.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className="g-xmarked">{parts}</p>;
}
