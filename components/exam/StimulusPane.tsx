'use client';

import { memo } from 'react';
import AudioPlayer from './AudioPlayer';
import type { StimulusItem } from '@/lib/exam-content';

/**
 * The left pane: the text, scan or audio fragment a stimulus's 1..N questions all refer to.
 *
 * `memo` on the stimulus id is not cosmetic. Advancing from question 1 to question 2 of the
 * same e-mail must not re-render this subtree, or the <audio> element unmounts and Luisteren
 * playback restarts from zero halfway through a fragment. `ExamShell` therefore keys the
 * pane on `stimulus.id`, never on the question index.
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
            .exam-stimulus-body ul, .exam-stimulus-body ol { padding-left: 1.25rem; margin: 0; }
            .exam-stimulus-body li + li { margin-top: 0.35rem; }
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
