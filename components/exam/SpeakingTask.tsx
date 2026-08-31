'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Info, Loader2, Mic, RotateCcw, Square, TriangleAlert } from 'lucide-react';
import type { FeedbackHighlight, RubricFeedbackState } from './RubricFeedback';
import AudioPlayer from './AudioPlayer';
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
const METER_BARS = 28;

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

  return (
    <div className="sp-split">
      {/* ── Left: the question ── */}
      <section className="sp-pane sp-question">
        <header className="sp-pane-head">
          <span className="sp-eyebrow">Opdracht {taskNumber} van {total}</span>
          <span className="sp-limit">Max. {limit} sec.</span>
        </header>

        {task.title && <h2 className="sp-title">{task.title}</h2>}

        {task.prompt_html && (
          <div
            className="sp-prompt exam-rich exam-rich-scroll"
            dangerouslySetInnerHTML={{ __html: task.prompt_html }}
          />
        )}

        {rule && (
          <p className="sp-rule">
            <Info size={14} strokeWidth={2.4} aria-hidden />
            {rule}
          </p>
        )}

        {task.prompt_audio_url && (
          <div className="sp-prompt-audio">
            <AudioPlayer src={task.prompt_audio_url} label="Vraag beluisteren" compact />
          </div>
        )}

        {task.images.length > 0 && (
          <div className={`sp-images sp-images-${Math.min(task.images.length, 3)}`}>
            {task.images.map(img => (
              <figure key={img.id} className="sp-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.alt_text ?? ''} />
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* The assessment lives in the question column, so on a phone it must fall *after* the
          recorder — you cannot read a score before you have answered. `order` does that without
          duplicating the node. */}
      {feedback && <div className="sp-feedback">{feedback}</div>}

      {/* ── Right: recording + transcription ── */}
      <section className="sp-pane sp-record">
        <div className="sp-stage" data-state={recording ? 'recording' : hasRecording ? 'done' : 'idle'}>
          {(recording || hasRecording) && (
          <div className="sp-meter" aria-hidden="true">
            {Array.from({ length: METER_BARS }, (_, i) => {
              // A centred, roughly bell-shaped response so the meter reads as a voice rather than a
              // bar chart. Static at rest instead of animating an idle loop.
              const distance = Math.abs(i - (METER_BARS - 1) / 2) / ((METER_BARS - 1) / 2);
              const shape = 1 - distance * 0.75;
              const height = recording ? Math.max(0.08, level * shape) : 0.08;
              return (
                <span key={i} style={{ transform: `scaleY(${height.toFixed(3)})` }} />
              );
            })}
          </div>
          )}

          <div className="sp-stage-status">
            {recording ? (
              <>
                <span className="sp-dot" aria-hidden />
                <span className="sp-count">nog {remaining}s</span>
              </>
            ) : hasRecording ? (
              <>
                <Check size={15} strokeWidth={2.8} aria-hidden />
                <span>Opname van {Math.round(answer.seconds)} sec.</span>
              </>
            ) : (
              <>
                <Mic size={15} strokeWidth={2.4} aria-hidden />
                <span>Klaar om op te nemen</span>
              </>
            )}
          </div>

          {recording && (
            <div className="sp-progress">
              <div style={{ width: `${(elapsed / limit) * 100}%` }} />
            </div>
          )}

          <div className="sp-actions">
            {!recording ? (
              <button type="button" onClick={start} className="sp-btn sp-btn-rec">
                {hasRecording
                  ? <RotateCcw size={17} strokeWidth={2.4} aria-hidden />
                  : <Mic size={17} strokeWidth={2.4} aria-hidden />}
                {hasRecording ? 'Opnieuw opnemen' : 'Start opname'}
              </button>
            ) : (
              <button type="button" onClick={() => void stop()} className="sp-btn sp-btn-stop">
                <Square size={14} strokeWidth={3} aria-hidden />
                Stop opname
              </button>
            )}
          </div>

          {error && (
            <p className="sp-error">
              <TriangleAlert size={14} aria-hidden />
              {error}
            </p>
          )}
        </div>

        {previewUrl && !recording && (
          <div className="sp-playback">
            <AudioPlayer src={previewUrl} label="Jouw opname" compact />
          </div>
        )}

        {/* ── Live transcription ── */}
        {liveTranscript && (
          <div className="sp-transcript" data-empty={!shownTranscript}>
            <div className="sp-transcript-head">
              <span className="sp-eyebrow">Wat we horen</span>
              {sttState === 'connecting' && (
                <span className="sp-tx-state">
                  <Loader2 size={12} className="sp-spin" aria-hidden /> verbinden…
                </span>
              )}
              {sttState === 'listening' && (
                <span className="sp-tx-state sp-tx-live">
                  <span className="sp-dot" aria-hidden /> live
                </span>
              )}
            </div>

            <div className="sp-transcript-body" aria-live="polite">
              {graded && gradedText && review ? (
                <MarkedTranscript text={gradedText} highlights={review.highlights} />
              ) : shownTranscript ? (
                <p className={grading ? 'sp-reading' : undefined}>
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
                        {partial && <span className="sp-partial">{partial}</span>}
                      </>
                    )}
                </p>
              ) : sttError ? (
                <p className="sp-tx-muted">
                  Live meelezen is nu niet beschikbaar. Je opname wordt gewoon opgenomen en
                  beoordeeld.
                </p>
              ) : recording ? (
                <p className="sp-tx-muted">Begin met praten…</p>
              ) : (
                <p className="sp-tx-muted">
                  Tijdens het opnemen zie je hier wat er van je antwoord wordt herkend.
                </p>
              )}
            </div>

            <p className="sp-transcript-note">
              {graded
                ? 'Dit is de tekst waarop je beoordeeld bent. Streepjes zijn plekken uit je antwoord die meetellen — beweeg erover voor de uitleg.'
                : 'Dit is wat de spraakherkenning live oppikt — een hulpmiddel, niet je beoordeling. Je wordt beoordeeld op je opname zelf.'}
            </p>

            {review && (
              <div className="sp-review-action">
                <button
                  type="button"
                  onClick={review.onGrade}
                  disabled={grading || !hasRecording}
                  className="sp-btn sp-btn-check"
                >
                  {grading ? (
                    <>
                      <Loader2 size={16} className="sp-spin" aria-hidden /> Nakijken…
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={2.8} aria-hidden />
                      {graded ? 'Opnieuw nakijken' : 'Nakijken'}
                    </>
                  )}
                </button>
                {!hasRecording && (
                  <span className="sp-review-hint">Neem eerst je antwoord op.</span>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <style>{CSS}</style>
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
      <mark key={i} className={`sp-mark sp-mark-${h.kind}`} tabIndex={0}>
        {text.slice(h.start, h.end)}
        <span className="sp-mark-note">{h.note}</span>
      </mark>
    );
    cursor = h.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className="sp-marked">{parts}</p>;
}

const CSS = `
  .sp-split {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    align-items: start;
  }
  /* Two panes only when the prompt can still hold a readable measure. Below this the question
     would wrap to ~20 characters a line, and it is the thing the candidate must remember while
     speaking. */
  @media (min-width: 900px) {
    .sp-split { grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 22px; }
    /* Question and assessment stack in column 1; recorder spans both rows in column 2, so the
       assessment fills what used to be dead space under a short question. */
    .sp-question { grid-column: 1; grid-row: 1; }
    .sp-feedback { grid-column: 1; grid-row: 2; }
    .sp-record   { grid-column: 2; grid-row: 1 / span 2; }
  }
  /* Single column: question → recorder → assessment. */
  .sp-question { order: 1; }
  .sp-record { order: 2; }
  .sp-feedback { order: 3; min-width: 0; }

  .sp-pane {
    background: var(--color-surface-container-lowest);
    border-radius: 24px;
    padding: 22px 24px;
    box-shadow: 0 12px 40px rgba(0, 43, 109, 0.12);
    min-width: 0;
  }
  @media (max-width: 520px) { .sp-pane { padding: 18px 16px; border-radius: 20px; } }

  .sp-pane-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; flex-wrap: wrap; margin-bottom: 12px;
  }
  .sp-eyebrow {
    font-size: 0.65rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-on-surface-variant); opacity: 0.72;
  }
  .sp-limit {
    font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 999px;
    background: #fcecdd; color: #a24000; white-space: nowrap;
  }

  .sp-title {
    font-family: var(--font-headline); font-size: 1.3rem; font-weight: 800;
    letter-spacing: -0.02em; color: var(--color-on-surface); margin: 0 0 10px;
    text-wrap: balance; line-height: 1.25;
  }
  /* Tag-level rules live in .exam-rich in app/globals.css — see the note there. */
  .sp-prompt { font-size: 1rem; line-height: 1.7; color: var(--color-on-surface); }

  .sp-rule {
    display: flex; align-items: center; gap: 7px; margin: 14px 0 0;
    padding: 10px 12px; border-radius: 12px;
    background: rgba(254, 118, 44, 0.1);
    border-left: 3px solid var(--color-secondary-container);
    font-size: 0.85rem; font-weight: 700; color: var(--color-on-secondary-container);
  }
  .sp-rule svg { flex-shrink: 0; }

  .sp-prompt-audio { margin-top: 16px; }

  .sp-images { display: grid; gap: 10px; margin-top: 16px; }
  .sp-images-1 { grid-template-columns: 1fr; }
  .sp-images-2 { grid-template-columns: repeat(2, 1fr); }
  .sp-images-3 { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 420px) { .sp-images-3 { grid-template-columns: repeat(2, 1fr); } }
  .sp-figure { margin: 0; }
  .sp-figure img {
    width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block;
    border-radius: 14px; background: var(--color-surface-container);
  }
  .sp-figure figcaption {
    font-size: 0.75rem; font-weight: 700; text-align: center; margin-top: 6px;
    color: var(--color-on-surface-variant);
  }

  /* ── recorder stage ── */
  .sp-record { display: flex; flex-direction: column; gap: 14px; }
  .sp-stage {
    border-radius: 18px; padding: 18px;
    background: var(--color-surface-container-low);
    border: 1.5px solid var(--color-outline-variant);
    display: flex; flex-direction: column; gap: 14px;
  }
  .sp-stage[data-state='recording'] {
    background: #fff5ee; border-color: #fdc9a3;
  }
  .sp-stage[data-state='done'] {
    background: rgba(0, 43, 109, 0.04); border-color: #b8cef5;
  }

  .sp-meter {
    display: flex; align-items: center; justify-content: center; gap: 3px;
    height: 64px;
  }
  .sp-meter span {
    flex: 1; max-width: 7px; height: 100%; border-radius: 999px;
    background: var(--color-outline-variant);
    transform-origin: center;
    transition: transform 90ms linear, background-color 200ms ease;
  }
  .sp-stage[data-state='recording'] .sp-meter span {
    background: linear-gradient(180deg, #fe762c, #a24000);
  }
  .sp-stage[data-state='done'] .sp-meter span {
    background: linear-gradient(180deg, #1d428a, #002b6d); opacity: 0.5;
  }

  .sp-stage-status {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 0.85rem; font-weight: 700; color: var(--color-on-surface-variant);
  }
  .sp-stage[data-state='recording'] .sp-stage-status { color: var(--color-error); }
  .sp-stage[data-state='done'] .sp-stage-status { color: var(--color-primary); }
  .sp-count { font-variant-numeric: tabular-nums; }
  .sp-dot {
    width: 9px; height: 9px; border-radius: 999px; background: currentColor;
    animation: sp-pulse 1.2s ease-in-out infinite;
  }
  @keyframes sp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

  .sp-progress {
    height: 5px; border-radius: 999px; overflow: hidden;
    background: var(--color-surface-container-high);
  }
  .sp-progress > div {
    height: 100%; border-radius: 999px;
    background: linear-gradient(to right, #a24000, #fe762c);
    transition: width 1s linear;
  }

  .sp-actions { display: flex; justify-content: center; }
  .sp-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 9px;
    padding: 0.8rem 1.35rem; border: 0; border-radius: 14px; cursor: pointer;
    font-family: inherit; font-size: 0.9rem; font-weight: 800; color: #fff;
    box-shadow: var(--shadow-card-md);
    transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease;
  }
  .sp-btn:hover { transform: translateY(-2px); }
  .sp-btn:active { transform: translateY(0) scale(0.98); }
  .sp-btn:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
  .sp-btn-rec { background: #a24000; }
  .sp-btn-stop { background: var(--color-error); }

  .sp-error {
    display: flex; align-items: flex-start; gap: 7px; margin: 0;
    font-size: 0.82rem; line-height: 1.55; color: var(--color-error);
  }
  .sp-error svg { flex-shrink: 0; margin-top: 2px; }

  /* ── transcript ── */
  .sp-transcript {
    border-radius: 18px; padding: 16px 18px;
    background: var(--color-surface-container-lowest);
    border: 1.5px dashed var(--color-outline-variant);
    display: flex; flex-direction: column; gap: 10px;
  }
  .sp-transcript[data-empty='false'] { border-style: solid; }
  .sp-transcript-head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .sp-tx-state {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--color-outline);
  }
  .sp-tx-live { color: var(--color-error); }
  .sp-tx-live .sp-dot { width: 7px; height: 7px; }
  .sp-spin { animation: sp-rotate 900ms linear infinite; }
  @keyframes sp-rotate { to { transform: rotate(360deg); } }

  .sp-transcript-body { min-height: 76px; }
  /* A tall empty placeholder costs a phone screen a third of its height for nothing. */
  @media (max-width: 600px) { .sp-transcript-body { min-height: 44px; } }
  .sp-transcript-body p {
    margin: 0; font-size: 0.95rem; line-height: 1.65; color: var(--color-on-surface);
  }
  .sp-partial { color: var(--color-outline); }
  .sp-tx-muted { color: var(--color-outline) !important; font-size: 0.85rem !important; }

  .sp-transcript-note {
    margin: 0; font-size: 0.7rem; line-height: 1.5; color: var(--color-outline);
  }

  .sp-review-action {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding-top: 12px; border-top: 1px solid var(--color-surface-container-high);
  }
  .sp-btn-check {
    background: var(--color-primary); font-size: 0.85rem; padding: 0.7rem 1.15rem;
  }
  .sp-btn-check:disabled { opacity: 0.5; cursor: default; }
  .sp-btn-check:disabled:hover { transform: none; }
  .sp-review-hint { font-size: 0.75rem; color: var(--color-outline); }

  /* Word-by-word pass while the answer is being checked. */
  .sp-reading span { animation: sp-read 1.5s ease-in-out infinite; }
  @keyframes sp-read {
    0%, 100% { color: var(--color-on-surface); }
    50% { color: var(--color-secondary-container); }
  }

  .sp-marked { margin: 0; font-size: 0.95rem; line-height: 1.95; color: var(--color-on-surface); }
  .sp-mark {
    position: relative; background: none; color: inherit; border-radius: 3px; padding: 1px 0;
    cursor: help;
  }
  .sp-mark-improve { box-shadow: inset 0 -0.42em 0 rgba(254,118,44,0.3); }
  .sp-mark-good { box-shadow: inset 0 -0.42em 0 rgba(0,43,109,0.14); }
  .sp-mark-note {
    position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 5;
    width: max-content; max-width: 240px; padding: 8px 10px; border-radius: 10px;
    background: var(--color-on-surface); color: #fff; font-size: 0.75rem; line-height: 1.5;
    opacity: 0; pointer-events: none; transition: opacity 140ms ease;
  }
  .sp-mark:hover .sp-mark-note, .sp-mark:focus-visible .sp-mark-note { opacity: 1; }

  @media (prefers-reduced-motion: reduce) {
    .sp-meter span, .sp-btn, .sp-progress > div { transition: none; }
    .sp-btn:hover { transform: none; }
    .sp-dot, .sp-spin { animation: none; }
    .sp-reading span { animation: none; }
  }
`;
