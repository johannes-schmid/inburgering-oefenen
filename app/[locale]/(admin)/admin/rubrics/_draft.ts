/**
 * The rubric editor's draft shape, in a module with **no `'use client'`**.
 *
 * `emptyDraft()` used to live in `RubricForm.tsx`. That compiles and typechecks fine, but calling
 * it from the server component at `new/page.tsx` throws at request time — "attempted to call
 * emptyDraft() from the server but emptyDraft is on the client". A `'use client'` module's exports
 * are client references, not functions, so only *types* may be imported from one across the
 * boundary. `next build` does not catch this; loading the page does.
 */
import { categoriesForSkill, type RubricCriterion, type RubricSkill } from '@/lib/rubrics';

export type RubricDraft = {
  id?: number;
  skill: RubricSkill;
  task_type: string;
  version: number;
  criteria: RubricCriterion[];
  system_prompt: string;
  active: boolean;
  /** Grades already recorded against this rubric. Non-zero ⇒ saving mints a new version. */
  used_count: number;
};

export function emptyDraft(skill: RubricSkill = 'schrijven', category?: string): RubricDraft {
  return {
    skill,
    task_type: category ?? categoriesForSkill(skill)[0],
    version: 1,
    criteria: [],
    system_prompt: '',
    active: false,
    used_count: 0,
  };
}
