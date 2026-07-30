/**
 * The Schrijven/Spreken task draft, in a module with **no `'use client'`**.
 *
 * Same reason as `admin/rubrics/_draft.ts`: a server component calls `emptyDraft()`, and a value
 * exported from a `'use client'` module is a client reference, not a function. That fails at request
 * time only — `tsc` and `next build` both pass. See LEARNINGS 2026-07-30.
 */
import type { FormField } from '@/lib/exam-content';

export type TaskType = 'email' | 'short_text' | 'form' | 'picture_note' | 'speaking';
export type ImageUsage = 'none' | 'describe' | 'choose' | 'cover_all';

export type TaskImageDraft = {
  id?: number;
  image_url: string;
  /** Content the candidate is meant to use ("gestolen", "kapot") — not alt text. */
  caption: string;
  alt_text: string;
  /** picture_note: "voor" / "na". */
  group_label: string;
};

export type OpgaveDraft = {
  id?: number;
  exam_id: number | null;
  part_id: number | null;
  skill: 'schrijven' | 'spreken';
  sort_order: number;
  section_id: number | null;
  task_type: TaskType;
  title: string;
  prompt_html: string;
  bullet_points: string[];
  email_to: string;
  email_cc: string;
  email_subject: string;
  greeting: string;
  closing: string;
  min_sentences: number | null;
  form_sections: { title: string; fields: FormField[] }[];
  image_usage: ImageUsage;
  prompt_audio_url: string;
  prompt_script: string;
  max_record_seconds: number;
  model_answer: string;
  rubric_id: number | null;
  review_status: 'pending' | 'validated';
  images: TaskImageDraft[];
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  email: 'E-mail',
  short_text: 'Korte tekst',
  form: 'Formulier',
  picture_note: 'Bericht bij plaatjes',
  speaking: 'Spreekopdracht',
};

export const IMAGE_USAGE_LABELS: Record<ImageUsage, string> = {
  none: 'Geen plaatjes',
  describe: 'Gebruik steeds het plaatje (1 plaatje)',
  choose: 'Kies steeds één plaatje (2 plaatjes)',
  cover_all: 'Gebruik alle plaatjes (3 plaatjes)',
};

/** How many images `exam_publish_issues()` requires for each Spreken image rule. */
export const REQUIRED_IMAGES: Record<ImageUsage, number> = {
  none: 0,
  describe: 1,
  choose: 2,
  cover_all: 3,
};

export function emptyDraft(skill: 'schrijven' | 'spreken' = 'schrijven'): OpgaveDraft {
  return {
    exam_id: null,
    part_id: null,
    skill,
    sort_order: 1,
    section_id: null,
    // A CHECK constraint ties these together: spreken ⇒ 'speaking', schrijven ⇒ anything else.
    task_type: skill === 'spreken' ? 'speaking' : 'email',
    title: '',
    prompt_html: '',
    bullet_points: [],
    email_to: '',
    email_cc: '',
    email_subject: '',
    greeting: '',
    closing: '',
    min_sentences: null,
    form_sections: [],
    image_usage: 'none',
    prompt_audio_url: '',
    prompt_script: '',
    max_record_seconds: 60,
    model_answer: '',
    rubric_id: null,
    review_status: 'pending',
    images: [],
  };
}
