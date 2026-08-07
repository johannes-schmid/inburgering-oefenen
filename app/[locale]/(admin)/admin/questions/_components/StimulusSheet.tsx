'use client';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Level } from '@/data/skills';
import type { AuthoringSection, AuthoringStimulus } from '@/lib/admin/authoring';
import { examLabel, isBacklog } from '@/lib/admin/backlog';
import StimulusEditor, {
  blankStimulus, toStimulusDraft,
} from '../../../_components/StimulusEditor';

/**
 * The fragment editor, in the same right-hand drawer the question editor uses.
 *
 * One drawer for both halves of an item: the docent clicks a fragment row or a question row in
 * the same table and the panel that opens is in the same place either way. It used to be an
 * inline card that pushed the table down the page, which made "edit this, then look at its
 * questions" a scrolling exercise.
 */
export default function StimulusSheet({
  open,
  stimulus,
  backlogExamId,
  level,
  skill,
  sections,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** `null` = a new fragment, which lands in the backlog. */
  stimulus: AuthoringStimulus | null;
  backlogExamId: number | undefined;
  level: Level;
  skill: string;
  sections: AuthoringSection[];
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const examId = stimulus ? stimulus.exam_id : backlogExamId;

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <div className="flex flex-col gap-5 p-6">
          <header className="pr-8">
            <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
              {skill}
              {stimulus && (
                <>
                  {' · '}
                  {isBacklog(stimulus.examNumber)
                    ? examLabel(stimulus.examNumber).toLowerCase()
                    : `examen ${stimulus.examNumber}`}
                  {` · #${stimulus.sort_order}`}
                </>
              )}
            </p>
            <h2 className="mt-1 font-headline text-lg leading-snug font-bold text-on-surface">
              {stimulus ? 'Fragment bewerken' : 'Nieuw fragment'}
            </h2>
            {!stimulus && (
              <p className="mt-1 text-xs text-on-surface-variant">
                Nieuwe fragmenten komen in de backlog. Wijs ze daarna toe bij Examens.
              </p>
            )}
          </header>

          {examId == null ? (
            <p className="text-sm text-error">
              Geen backlog voor dit onderdeel gevonden, dus een nieuw fragment kan nergens landen.
            </p>
          ) : (
            <StimulusEditor
              // Remount per fragment, or the previous one's draft state leaks into this form.
              key={stimulus?.id ?? 'new'}
              examId={examId}
              level={level}
              skill={skill}
              sections={sections}
              initial={stimulus ? toStimulusDraft(stimulus) : blankStimulus(skill, nextSortOrder)}
              onClose={onClose}
              onSaved={onSaved}
              embedded
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
