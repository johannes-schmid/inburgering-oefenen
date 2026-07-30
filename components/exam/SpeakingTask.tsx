'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, RotateCcw, Square } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { WavRecorder, canRecordWav } from '@/lib/wav-recorder';
import type { OpenTaskItem } from '@/lib/exam-content';

export type SpeakingAnswer = { blob: Blob | null; seconds: number };

type Props = {
  task: OpenTaskItem;
  answer: SpeakingAnswer;
  onChange: (next: SpeakingAnswer) => void;
  taskNumber: number;
  total: number;
};

const IMAGE_RULE: Record<OpenTaskItem['image_usage'], string | null> = {
  none: null,
  describe: 'Gebruik steeds het plaatje.',
  choose: 'Kies één plaatje en leg uit waarom.',
  cover_all: 'Vertel iets bij elk plaatje.',
};

/**
 * One Spreken task: an audio prompt, 0..N still images, and a recording of at most
 * `max_record_seconds` (DUO's window is 60s).
 *
 * DUO's onderdeel 1 uses video; we deliberately use audio plus a still image instead — a
 * decision recorded in CLAUDE.md, not an omission. `image_usage` is shown to the candidate
 * because it is a *gradable* requirement: the rubric scores whether all pictures were used.
 *
 * Records **WAV**, not the WebM `MediaRecorder` would give: the grading model reads
 * wav/mp3/aiff/aac/ogg/flac and not Opus, and Spreken is graded from the recording itself. See
 * `lib/wav-recorder.ts` for the format decision and what it costs.
 */
export default function SpeakingTask({ task, answer, onChange, taskNumber, total }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<WavRecorder | null>(null);
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
    const recorder = recorderRef.current;
    if (!recorder?.active) return;
    recorderRef.current = null;
    try {
      const { blob, seconds } = await recorder.stop();
      setRecording(false);
      // `seconds` comes from the sample count, so it is the real length of the audio — a tab that
      // slept mid-recording would have skewed a wall-clock ticker.
      onChange({ blob, seconds: Math.min(seconds, limit) });
    } catch {
      setRecording(false);
      setError('De opname kon niet worden opgeslagen. Probeer het opnieuw.');
    }
  }, [limit, onChange]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    recorderRef.current?.cancel();
  }, []);

  async function start() {
    setError(null);
    if (!canRecordWav()) {
      setError('Deze browser kan geen opnames maken. Gebruik een recente Chrome, Firefox of Safari.');
      return;
    }
    const recorder = new WavRecorder();
    try {
      await recorder.start();
    } catch {
      recorder.cancel();
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

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-2xl bg-surface-container-lowest"
        style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-card-md)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">
            Opdracht {taskNumber} van {total}
          </span>
          <span
            className="text-[0.65rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: '#fcecdd', color: '#a24000' }}
          >
            Max. {limit} seconden
          </span>
        </div>

        {task.title && (
          <h2
            className="font-headline font-bold text-on-surface mb-2.5"
            style={{ fontSize: '1.15rem', letterSpacing: '-0.01em', textWrap: 'balance' }}
          >
            {task.title}
          </h2>
        )}

        {task.prompt_html && (
          <div
            className="exam-task-prompt text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: task.prompt_html }}
          />
        )}

        {rule && (
          <p className="text-sm font-semibold text-on-surface mt-3 mb-0">{rule}</p>
        )}

        {task.prompt_audio_url && (
          <div className="mt-4">
            <AudioPlayer src={task.prompt_audio_url} label="Vraag beluisteren" compact />
          </div>
        )}

        {task.images.length > 0 && (
          <div
            className="grid gap-3 mt-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
          >
            {task.images.map(img => (
              <figure key={img.id} className="m-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.alt_text ?? ''}
                  className="rounded-xl"
                  style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
                />
                {img.caption && (
                  <figcaption className="text-xs font-semibold text-on-surface-variant mt-1.5 text-center">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <style>{`
          .exam-task-prompt { font-size: 0.95rem; line-height: 1.7; }
          .exam-task-prompt > * + * { margin-top: 0.75rem; }
          .exam-task-prompt p { margin: 0; }
        `}</style>
      </div>

      {/* ── Recorder ── */}
      <div
        className="rounded-2xl bg-surface-container-lowest flex flex-col gap-3.5"
        style={{ padding: '1.25rem 1.375rem', boxShadow: 'var(--shadow-card-md)' }}
      >
        <div className="flex items-center gap-3.5 flex-wrap">
          {!recording ? (
            <button
              type="button"
              onClick={start}
              className="exam-rec-btn inline-flex items-center gap-2.5 rounded-xl font-bold text-sm border-0 cursor-pointer text-white"
              style={{ padding: '0.75rem 1.25rem', background: '#a24000', boxShadow: 'var(--shadow-card-md)' }}
            >
              {answer.blob
                ? <RotateCcw size={16} strokeWidth={2.4} aria-hidden />
                : <Mic size={16} strokeWidth={2.4} aria-hidden />}
              {answer.blob ? 'Opnieuw opnemen' : 'Start opname'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void stop()}
              className="exam-rec-btn inline-flex items-center gap-2.5 rounded-xl font-bold text-sm border-0 cursor-pointer text-white"
              style={{ padding: '0.75rem 1.25rem', background: '#dc2626', boxShadow: 'var(--shadow-card-md)' }}
            >
              <Square size={14} strokeWidth={3} aria-hidden />
              Stop opname
            </button>
          )}

          {recording && (
            <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#dc2626' }}>
              <span className="exam-rec-dot rounded-full" style={{ width: 9, height: 9, background: '#dc2626' }} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                nog {remaining}s
              </span>
            </span>
          )}
        </div>

        {recording && (
          <div className="rounded-full overflow-hidden" style={{ height: 5, background: 'var(--color-surface-container)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(elapsed / limit) * 100}%`,
                background: 'linear-gradient(to right,#a24000,#fe762c)',
                transition: 'width 1s linear',
              }}
            />
          </div>
        )}

        {error && (
          <p className="text-sm m-0" style={{ color: '#b91c1c' }}>{error}</p>
        )}

        {previewUrl && !recording && (
          <>
            <AudioPlayer src={previewUrl} label="Jouw opname" compact />
            <p className="text-xs text-on-surface-variant m-0">
              Beluister je antwoord. Je kunt opnieuw opnemen zolang de tijd loopt.
            </p>
          </>
        )}

        <style>{`
          .exam-rec-btn { transition: transform .18s cubic-bezier(0.22,1,0.36,1), opacity .18s ease; }
          .exam-rec-btn:hover { transform: translateY(-2px); }
          .exam-rec-btn:active { transform: translateY(0) scale(0.98); }
          .exam-rec-btn:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
          .exam-rec-dot { animation: exam-rec-pulse 1.2s ease-in-out infinite; }
          @keyframes exam-rec-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
          @media (prefers-reduced-motion: reduce) {
            .exam-rec-btn { transition: none; }
            .exam-rec-dot { animation: none; }
          }
        `}</style>
      </div>
    </div>
  );
}
