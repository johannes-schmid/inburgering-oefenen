'use client';

import { memo } from 'react';
import { Info } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import './glas-player.css';
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
 * `examenAudio` geeft die remount zijn tweede helft: 25 seconden leestijd, dan start het fragment
 * vanzelf en je hoort het één keer. Zie de kop van `AudioPlayer` voor waarom dat de eerdere
 * "replay is unlimited" omkeert.
 */
function StimulusPane({
  stimulus,
  examenAudio,
}: {
  stimulus: StimulusItem;
  examenAudio?: { readSeconds: number };
}) {
  const s = stimulus;

  /* Glas §10: de tekst als papier (crème, een halve graad gedraaid), het fragment als glazen
     capsule op Gracht, een plaatje op wit. */
  return (
    <div className="g-xlezen-side">
      {/* De opdracht in een eigen kader (eigenaar, 15-10): als losse grijze regel boven het
          papier werd hij overgeslagen, en hij zegt wat je eerst moet lezen. */}
      {s.intro && (
        <p className="g-xbrief">
          <Info size={17} strokeWidth={2.3} className="g-xbrief-i" aria-hidden />
          <span>{s.intro}</span>
        </p>
      )}

      {s.kind === 'audio' && s.audio_url && (
        <>
          <AudioPlayer src={s.audio_url} label="Fragment" examenAudio={examenAudio} />
          {s.image_url && <StimulusImage src={s.image_url} alt={s.image_alt} />}
        </>
      )}

      {s.kind === 'image' && s.image_url && (
        <StimulusImage src={s.image_url} alt={s.image_alt} />
      )}

      {s.kind === 'text' && s.body_html && (
        <article className="g-xpaper">
          {s.title && <h2>{s.title}</h2>}
          {/* The tag-level rules live in .exam-rich in app/globals.css — see the note there. */}
          <div
            className="exam-rich exam-rich-scroll"
            dangerouslySetInnerHTML={{ __html: s.body_html }}
          />
        </article>
      )}
    </div>
  );
}

function StimulusImage({ src, alt }: { src: string; alt: string | null }) {
  return (
    <figure className="g-xbody" style={{ margin: 0, padding: 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ''}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
      />
    </figure>
  );
}

export default memo(
  StimulusPane,
  (prev, next) =>
    prev.stimulus.id === next.stimulus.id &&
    prev.examenAudio?.readSeconds === next.examenAudio?.readSeconds
);

/**
 * The same pane, without the id-only memo.
 *
 * The admin fragment preview renders an *unsaved* draft, whose id never changes while its text
 * does — through the memo above it would paint once and then never update again, which is the one
 * thing a live preview must not do. The player keeps the memoised export; nothing else should use
 * this one.
 */
export { StimulusPane as StimulusPaneLive };
