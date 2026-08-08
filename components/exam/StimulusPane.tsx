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
            className="exam-stimulus-body text-on-surface"
            dangerouslySetInnerHTML={{ __html: s.body_html }}
          />
          <style>{`
            .exam-stimulus-body { font-size: 0.95rem; line-height: 1.7; }
            .exam-stimulus-body > * + * { margin-top: 0.85rem; }
            .exam-stimulus-body p { margin: 0; }
            .exam-stimulus-body strong { font-weight: 700; }
            /* list-style restated because Tailwind's preflight strips markers from every
               ul/ol — without it an opsomming in a fragment rendered as unindented plain lines. */
            .exam-stimulus-body ul { padding-left: 1.35rem; margin: 0; list-style: disc; }
            .exam-stimulus-body ol { padding-left: 1.35rem; margin: 0; list-style: decimal; }
            .exam-stimulus-body li + li { margin-top: 0.35rem; }
            /* The fragment editor wraps list items in a <p> (ProseMirror's list schema does), so
               the item's own spacing has to come from the <li>, not from the paragraph inside it. */
            .exam-stimulus-body li > p { margin: 0; }
            .exam-stimulus-body a { color: var(--color-primary); }
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
