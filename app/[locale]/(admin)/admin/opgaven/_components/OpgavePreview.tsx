'use client';

import { useState } from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import WritingTask, { type WritingAnswer } from '@/components/exam/WritingTask';
import SpeakingTask, { type SpeakingAnswer } from '@/components/exam/SpeakingTask';
import type { OpenTaskItem } from '@/lib/exam-content';
import type { OpgaveDraft } from '../_draft';

/**
 * The right third: the opgave as a candidate sees it, rendered from the **unsaved** draft.
 *
 * The Schrijven/Spreken editor was the one authoring surface with no preview at all — a column of
 * form fields, with `prompt_html` typed as raw HTML into a textarea and no way to see what came
 * out of it. Lezen and Luisteren have had `FragmentPreview` since the fragment page replaced the
 * drawer; this is the same idea for the other half of the product.
 *
 * Like that one it uses the player's own components — `WritingTask` and `SpeakingTask` — never a
 * lookalike. A preview built from a second set of components agrees with the player right up until
 * one of them changes, and then it lies about the only thing it exists to show. It is also why the
 * answer surface is live: the docent can type into the e-mail body, or hit record on a spreken
 * opgave, and see the thing she is asking a candidate to do.
 *
 * ## Two honest limits, stated on screen rather than papered over
 * - **Nothing is recorded.** No attempt, no `open_submissions` row, no grading call — "Nakijken"
 *   is not wired up here, because a grade costs a model call and would land in the review inbox
 *   attributed to nobody.
 * - **The voorbeeldantwoord is never shown**, exactly as in a real sitting. `canSeeModelAnswer`
 *   stays false: it is a scoring key, and the editor already renders it in the field above.
 */
export default function OpgavePreview({
  form,
  position,
  total,
}: {
  form: OpgaveDraft;
  /** Where this opgave sits in its examen, so the preview's "Opgave 2 van 4" matches the player. */
  position: number;
  total: number;
}) {
  const [writing, setWriting] = useState<WritingAnswer>({ text: '', json: null });
  const [speaking, setSpeaking] = useState<SpeakingAnswer>({ blob: null, seconds: 0 });

  const task = toOpenTaskItem(form);
  const isSpeaking = form.skill === 'spreken';
  const dirty = isSpeaking ? speaking.blob !== null : writing.text.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-2.5">
        <p className="m-0 inline-flex items-center gap-1.5 font-headline text-xs font-bold tracking-widest text-on-surface-variant uppercase">
          <Eye size={13} aria-hidden />
          Zo ziet de kandidaat het
        </p>
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setWriting({ text: '', json: null });
              setSpeaking({ blob: null, seconds: 0 });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <RotateCcw size={12} aria-hidden />
            Opnieuw
          </button>
        )}
      </header>

      {/*
        The player's own components, scaled down — never restyled. The one thing overridden is the
        two-column split, and it has to be:

        `.wr-split` and `.sp-split` go two-up at `@media (min-width: 900px)`, which is the
        **viewport**, not this container. In a one-third column at 1440px that fires, so the brief
        and the answer surface each got ~160px and the e-mail's Aan/Onderwerp rows overlapped into
        an unreadable stack. There is no container-query fallback in those components, so the pane
        stacks them itself. Everything else — the type, the chrome, the mail header, the numbered
        bullets — is exactly what a candidate gets.
      */}
      <div className="opgave-preview flex-1 overflow-y-auto py-4">
        <div className="origin-top-left" style={{ zoom: 0.85 }}>
          {isSpeaking ? (
            <SpeakingTask
              task={task}
              answer={speaking}
              onChange={setSpeaking}
              taskNumber={position}
              total={total}
              liveTranscript={false}
            />
          ) : (
            <WritingTask
              task={task}
              answer={writing}
              onChange={setWriting}
              taskNumber={position}
              total={total}
              canSeeModelAnswer={false}
            />
          )}
        </div>
      </div>

      <p className="m-0 border-t border-outline-variant pt-2 text-[0.7rem] leading-snug text-on-surface-variant">
        Voorbeeld. Er wordt niets opgeslagen en er gaat geen beoordeling naar het model.
      </p>

      <style>{`
        .opgave-preview .wr-split,
        .opgave-preview .sp-split { grid-template-columns: 1fr !important; }
        .opgave-preview .wr-brief,
        .opgave-preview .wr-answer,
        .opgave-preview .wr-feedback,
        .opgave-preview .sp-question,
        .opgave-preview .sp-record { grid-column: 1 !important; grid-row: auto !important; }
        /* A long address in a narrow column has nowhere to break, and the dd then runs under the
           dt beside it rather than wrapping. */
        .opgave-preview .wr-mail dd { min-width: 0; overflow-wrap: anywhere; }
      `}</style>
    </div>
  );
}

/* ── Draft → the shape the player reads ───────────────────────────────────────────────────── */

/**
 * Note the two deliberate omissions: `model_answer` and `prompt_script` are not on `OpenTaskItem`
 * at all (see the comment under its definition in `lib/exam-content.ts`), so there is nothing here
 * to accidentally hand to a preview that renders candidate-facing chrome.
 */
function toOpenTaskItem(d: OpgaveDraft): OpenTaskItem {
  return {
    id: d.id ?? -1,
    part_id: d.part_id,
    sort_order: d.sort_order,
    section_id: d.section_id,
    task_type: d.task_type,
    title: d.title.trim() || null,
    prompt_html: d.prompt_html.trim() || '<p>(nog geen opdrachttekst)</p>',
    bullet_points: d.bullet_points.map(b => b.trim()).filter(Boolean),
    email_to: d.task_type === 'email' ? d.email_to.trim() || null : null,
    email_cc: d.task_type === 'email' ? d.email_cc.trim() || null : null,
    email_subject: d.task_type === 'email' ? d.email_subject.trim() || null : null,
    greeting: d.greeting.trim() || null,
    closing: d.closing.trim() || null,
    min_sentences: d.min_sentences && d.min_sentences > 0 ? d.min_sentences : null,
    form_schema: d.task_type === 'form' ? { sections: d.form_sections } : null,
    image_usage: d.skill === 'spreken' ? d.image_usage : 'none',
    prompt_audio_url: d.skill === 'spreken' ? d.prompt_audio_url.trim() || null : null,
    max_record_seconds: d.skill === 'spreken' ? d.max_record_seconds : 60,
    images: d.images.map((im, i) => ({
      // An unsaved image row has no id yet; a stable negative one keeps React keys distinct.
      id: im.id ?? -(i + 1),
      sort_order: i + 1,
      image_url: im.image_url.trim(),
      caption: im.caption.trim() || null,
      alt_text: im.alt_text.trim() || null,
      group_label: im.group_label.trim() || null,
    })),
  };
}
