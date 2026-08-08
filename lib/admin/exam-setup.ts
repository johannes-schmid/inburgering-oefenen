import type { Level } from '@/data/skills';

/**
 * The setup of an onderdeel: what every exam of one (level, skill) has to look like.
 *
 * **These rows are shared by all ten oefenexamens of the onderdeel.** They are reached from a
 * single exam's builder because that is where the docent notices something is wrong, but
 * editing one changes the shape every exam is measured against. `ExamSetupSheet` says so in
 * as many words; if you add another entry point, say it there too.
 *
 * Types and pure helpers only — the queries live in `exam-setup-server.ts`, the same split as
 * `backlog.ts` / `backlog-server.ts`. `ExamSetupSheet` is a client component and imports
 * `slugify` from here; a single module would drag `lib/supabase/server` into the browser
 * bundle and fail the build.
 *
 * Three tables, three axes:
 *   · `exam_formats`     — the numeric rules (item count, fragments, options, audio, onderdelen)
 *   · `sections`         — the tekstsoorten of Lezen/Luisteren, per level
 *   · `exam_task_rules`  — the per-soort rules of Schrijven/Spreken, per level
 *
 * Every rule column is nullable and NULL means "not verified against DUO", which makes the
 * validator skip that check rather than block on a guess. The editor writes NULL back when a
 * field is cleared, so unverifying something is as easy as verifying it.
 */

export type FormatRow = {
  level: Level;
  skill: string;
  item_count: number | null;
  duration_seconds: number | null;
  part_count: number | null;
  items_per_part: number | null;
  stimulus_count: number | null;
  questions_per_stimulus_min: number | null;
  questions_per_stimulus_max: number | null;
  options_min: number | null;
  options_max: number | null;
  audio_seconds_min: number | null;
  audio_seconds_max: number | null;
  verified_note: string | null;
};

export type SectionRow = {
  id: number;
  level: Level | null;
  topic: string;
  slug: string;
  name_nl: string;
  sort_order: number;
  /** Fragments currently filed under it — what a delete would orphan. */
  in_use: number;
};

export type TaskRuleRow = {
  level: Level | null;
  skill: string;
  category: string;
  label_nl: string;
  sort_order: number;
  min_per_exam: number | null;
  max_per_exam: number | null;
  image_count: number | null;
  min_sentences: number | null;
  bullets_min: number | null;
  bullets_max: number | null;
  record_seconds: number | null;
};

/**
 * The two settings that live on `exams` rather than on `exam_formats`, summarised over the ten
 * oefenexamens of the onderdeel.
 *
 * They are per-exam columns — the player reads them off the exam row — but nobody wants them to
 * differ between oefenexamen 3 and 4, so the sheet edits them for all ten at once. A value is
 * `null` here when the ten do **not** agree, which is the only case worth seeing: the field then
 * shows "verschilt" and only overwrites the ten if the docent types something.
 */
export type ExamDefaults = {
  durationMinutes: number | null;
  passThresholdPct: number | null;
  /** How many real exams (number > 0) the save would touch. */
  examCount: number;
};

export type ExamSetup = {
  format: FormatRow | null;
  sections: SectionRow[];
  taskRules: TaskRuleRow[];
  defaults: ExamDefaults;
};

/**
 * `'Bordje of mededeling'` → `'bordje-of-mededeling'`.
 *
 * `sections.slug` is `UNIQUE NULLS NOT DISTINCT (level, slug)` and is what the B1 clone in
 * `20260802000000_b1_level.sql` matched on, so it has to stay stable and URL-shaped even
 * though nothing routes on it today.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
