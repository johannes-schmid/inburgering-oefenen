'use client';

import { memo } from 'react';
import AudioPlayer from './AudioPlayer';
import type { StimulusItem } from '@/lib/exam-content';

/**
 * The left pane: the text, scan or audio fragment a stimulus's 1..N questions all refer to.
 *
 * `memo` keeps this subtree alive across a re-render of the shell, so the pane does not flash
 * and re-scroll every time the candidate picks an option. Whether it survives *moving between
 * questions* is decided by the `key` `ExamShell` gives it, and the two skills want opposite
 * things:
 *
 *   · **Lezen** is keyed on the stimulus id: the same text stays mounted across its 2–3
 *     questions, holding its scroll position.
 *   · **Luisteren** is keyed on stimulus+question, so the fragment remounts and the audio
 *     starts again from 0:00 for every question — DUO plays the fragment once per question,
 *     and the owner's decision (2026-08-07) is to match it. This deliberately reverses the
 *     earlier behaviour, where playback continued across the questions of one fragment.
 *
 * Replay stays unlimited either way; see `AudioPlayer`.
 */
function StimulusPane({ stimulus }: { stimulus: StimulusItem }) {
  const s = stimulus;

  return (
    <div className="flex flex-col gap-4">
      {s.intro && (
        <p className="text-sm leading-relaxed text-on-surface-variant m-0">{s.intro}</p>
      )}

      {s.kind === 'audio' && s.audio_url && (
        <>
          <AudioPlayer src={s.audio_url} label="Fragment" />
          {s.image_url && <StimulusImage src={s.image_url} alt={s.image_alt} />}
        </>
      )}

      {s.kind === 'image' && s.image_url && (
        <StimulusImage src={s.image_url} alt={s.image_alt} />
      )}

      {s.kind === 'text' && s.body_html && (
        <article
          className="rounded-2xl bg-surface-container-lowest"
          style={{ padding: '1.5rem 1.625rem', boxShadow: 'var(--shadow-card-md)' }}
        >
          {s.title && (
            <h2
              className="font-headline font-bold text-on-surface mb-3"
              style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}
            >
              {s.title}
            </h2>
          )}
          <div
            className="exam-stimulus-body exam-rich exam-rich-scroll text-on-surface"
            dangerouslySetInnerHTML={{ __html: s.body_html }}
          />
          {/* The tag-level rules live in .exam-rich in app/globals.css — see the note there. */}
          <style>{`
            .exam-stimulus-body { font-size: 0.95rem; line-height: 1.7; }
          `}</style>
        </article>
      )}
    </div>
  );
}

function StimulusImage({ src, alt }: { src: string; alt: string | null }) {
  return (
    <figure
      className="m-0 rounded-2xl overflow-hidden bg-surface-container-lowest"
      style={{ boxShadow: 'var(--shadow-card-md)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ''}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </figure>
  );
}

export default memo(StimulusPane, (prev, next) => prev.stimulus.id === next.stimulus.id);

/**
 * The same pane, without the id-only memo.
 *
 * The admin fragment preview renders an *unsaved* draft, whose id never changes while its text
 * does — through the memo above it would paint once and then never update again, which is the one
 * thing a live preview must not do. The player keeps the memoised export; nothing else should use
 * this one.
 */
export { StimulusPane as StimulusPaneLive };
