'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, RotateCcw } from 'lucide-react';
import { StimulusPaneLive } from '@/components/exam/StimulusPane';
import McqQuestion from '@/components/exam/McqQuestion';
import type { OptionItem, QuestionItem, StimulusItem } from '@/lib/exam-content';
import type { QuestionDraft } from '@/lib/admin/question-write';
import type { StimulusDraft } from '../../../_components/StimulusEditor';

/**
 * The right third: the fragment as a candidate sees it, rendered from the **unsaved** draft.
 *
 * It uses the player's own components — `StimulusPaneLive` and `McqQuestion` — rather than a
 * lookalike. A preview built from a second set of components is a preview of the preview: it
 * agrees with the player right up until one of them changes, and then it lies about the only
 * thing it exists to show. That is also why it answers questions for real, with feedback: "kan ik
 * dit item zelf maken?" is a question about the finished item, not about the form.
 *
 * ## Two honest limits, stated on screen rather than papered over
 * - **Feedback is always shown**, as in Oefenmodus. A full sitting withholds it until submit
 *   (`exam_attempts.feedback_mode`), but a preview that hides whether the answer key is right is
 *   useless to the person writing the answer key.
 * - **Nothing is recorded.** No attempt, no `user_question_results` row. The docent clicking
 *   through her own item must not appear in anyone's statistics.
 *
 * Negative ids are used throughout for unsaved rows: `McqQuestion` keys options by id, and two
 * fresh options both carrying `undefined` would collide.
 */
export default function FragmentPreview({
  stimulus,
  questions,
  sectionName,
  index,
  onIndexChange,
}: {
  stimulus: StimulusDraft;
  questions: QuestionDraft[];
  sectionName: string | null;
  /** Which question is shown. Lifted, so the editor's eye button can jump the preview to a
   *  question **without** remounting this component and throwing away the answers given so far. */
  index: number;
  onIndexChange: (next: number) => void;
}) {
  const [chosen, setChosen] = useState<Record<number, number | null>>({});

  const total = questions.length;
  // Clamp rather than reset: deleting question 3 of 3 should land on the new last one, not throw
  // the docent back to the top of a fragment she is halfway through checking.
  const current = total === 0 ? null : questions[Math.min(index, total - 1)];
  useEffect(() => {
    if (index > 0 && index > total - 1) onIndexChange(Math.max(0, total - 1));
  }, [index, total, onIndexChange]);

  const item = current ? toQuestionItem(current, index) : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-2.5">
        <p className="m-0 inline-flex items-center gap-1.5 font-headline text-xs font-bold tracking-widest text-on-surface-variant uppercase">
          <Eye size={13} aria-hidden />
          Zo ziet de kandidaat het
        </p>
        {Object.keys(chosen).length > 0 && (
          <button
            type="button"
            onClick={() => setChosen({})}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <RotateCcw size={12} aria-hidden />
            Opnieuw
          </button>
        )}
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        <StimulusPaneLive stimulus={toStimulusItem(stimulus)} />

        {item ? (
          <McqQuestion
            question={item}
            questionNumber={Math.min(index, total - 1) + 1}
            total={total}
            chosenId={chosen[item.id] ?? null}
            onSelect={(o: OptionItem) => setChosen(prev => ({ ...prev, [item.id]: o.id }))}
            // Always on: see the note at the top. The docent is checking the answer key, which is
            // exactly what a real sitting hides.
            showFeedback
            sectionName={sectionName ?? undefined}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-outline-variant p-5 text-center text-sm text-on-surface-variant">
            Nog geen vragen. Voeg er links een toe en hij verschijnt hier.
          </p>
        )}
      </div>

      {total > 1 && (
        <nav className="flex items-center justify-between gap-2 border-t border-outline-variant pt-2.5">
          <PageButton
            direction="prev"
            disabled={index === 0}
            onClick={() => onIndexChange(Math.max(0, index - 1))}
          />
          <span className="text-xs tabular-nums text-on-surface-variant">
            {Math.min(index, total - 1) + 1} / {total}
          </span>
          <PageButton
            direction="next"
            disabled={index >= total - 1}
            onClick={() => onIndexChange(Math.min(total - 1, index + 1))}
          />
        </nav>
      )}

      <p className="m-0 pt-2 text-[0.7rem] leading-snug text-on-surface-variant">
        Voorbeeld met directe feedback, zoals in de oefenmodus. Er wordt niets opgeslagen.
      </p>
    </div>
  );
}

function PageButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Vorige vraag' : 'Volgende vraag'}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-35"
    >
      <Icon size={14} aria-hidden />
    </button>
  );
}

/* ── Draft → the shapes the player reads ──────────────────────────────────────────────────── */

function toStimulusItem(d: StimulusDraft): StimulusItem {
  return {
    id: d.id ?? -1,
    part_id: null,
    sort_order: d.sort_order,
    section_id: d.section_id,
    kind: d.kind,
    intro: d.intro.trim() || null,
    title: d.title.trim() || null,
    body_html: d.body_html || null,
    image_url: d.image_url.trim() || null,
    image_alt: d.image_alt.trim() || null,
    audio_url: d.audio_url.trim() || null,
    questions: [],
  };
}

function toQuestionItem(q: QuestionDraft, index: number): QuestionItem {
  return {
    // A saved question keeps its id so the chosen answer survives editing the one before it; an
    // unsaved one gets a stable negative id derived from its position.
    id: q.id ?? -(index + 1),
    sort_order: q.sort_order,
    prompt: q.prompt.trim() || '(nog geen vraagtekst)',
    prompt_audio_url: null,
    image_url: q.image_url.trim() || null,
    explanation: q.explanation.trim() || '(nog geen uitleg)',
    option_layout: q.option_layout,
    options: q.options.map((o, i) => ({
      id: o.id ?? -((index + 1) * 10 + i + 1),
      label: o.label,
      sort_order: i + 1,
      body: o.body.trim() || null,
      image_urls: o.image_urls,
      image_alt: o.image_alt.trim() || null,
      audio_url: null,
      is_correct: o.is_correct,
    })),
  };
}
