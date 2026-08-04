/**
 * Loading one exam in the shape the player needs.
 *
 * The shape is the point: an exam is a list of **stimuli**, and each stimulus owns 1..N
 * questions. DUO shares one text across 2–3 questions, so flattening to a question list
 * (what the KNM engine did) loses the grouping and makes the left pane remount — which
 * restarts Luisteren audio mid-fragment. `ExamShell` walks a flat cursor over
 * `stimulus.questions` while keeping the stimulus element mounted.
 *
 * `createClient()` uses the service key and therefore bypasses RLS, so `published` is
 * checked here explicitly. Anything reading exam content on the server must go through
 * this module rather than querying the tables directly.
 */
import { createClient } from './supabase/server';
import type { Level, SkillSlug } from '@/data/skills';

export type OptionItem = {
  id: number;
  label: 'A' | 'B' | 'C' | 'D';
  sort_order: number;
  body: string | null;
  image_urls: string[];
  image_alt: string | null;
  audio_url: string | null;
  is_correct: boolean;
};

export type QuestionItem = {
  id: number;
  sort_order: number;
  prompt: string;
  prompt_audio_url: string | null;
  image_url: string | null;
  explanation: string;
  option_layout: 'text' | 'image' | 'image_grid';
  options: OptionItem[];
};

export type StimulusItem = {
  id: number;
  part_id: number | null;
  sort_order: number;
  section_id: number | null;
  kind: 'text' | 'audio' | 'image';
  intro: string | null;
  title: string | null;
  body_html: string | null;
  image_url: string | null;
  image_alt: string | null;
  audio_url: string | null;
  questions: QuestionItem[];
};

export type TaskImage = {
  id: number;
  sort_order: number;
  image_url: string;
  caption: string | null;
  alt_text: string | null;
  group_label: string | null;
};

export type OpenTaskItem = {
  id: number;
  part_id: number | null;
  sort_order: number;
  section_id: number | null;
  task_type: 'email' | 'short_text' | 'form' | 'picture_note' | 'speaking';
  title: string | null;
  prompt_html: string | null;
  bullet_points: string[];
  email_to: string | null;
  email_cc: string | null;
  email_subject: string | null;
  greeting: string | null;
  closing: string | null;
  min_sentences: number | null;
  form_schema: FormSchema | null;
  image_usage: 'none' | 'describe' | 'choose' | 'cover_all';
  prompt_audio_url: string | null;
  max_record_seconds: number;
  images: TaskImage[];
};

/**
 * Deliberately absent from `OpenTaskItem` and from `TASK_COLS`: `model_answer`, `prompt_script`
 * and `rubric_id`. `ExamContent` is passed straight into `ExamShell`, a client component, so
 * anything selected here is in the page payload and readable in the network tab. `model_answer`
 * is the docent's exemplar — handing it to the candidate mid-task defeats the exercise. The
 * grader is server-side (`lib/ai/grade.ts`) and loads these itself with the service key.
 */

/** A Schrijven "formulier" task: a list of rows the candidate fills or picks from. */
export type FormSchema = {
  sections?: { title?: string; fields: FormField[] }[];
  fields?: FormField[];
};

export type FormField = {
  key: string;
  label: string;
  type: 'text' | 'date' | 'radio' | 'checkbox';
  options?: string[];
  placeholder?: string;
};

export type ExamPartItem = {
  id: number;
  sort_order: number;
  title: string;
  instruction_html: string | null;
  show_instruction: boolean;
};

export type ExamMeta = {
  id: number;
  level: Level;
  skill: SkillSlug;
  number: number;
  title: string | null;
  is_free: boolean;
  duration_seconds: number;
  pass_threshold_pct: number;
};

export type ExamContent = {
  exam: ExamMeta;
  parts: ExamPartItem[];
  stimuli: StimulusItem[];
  tasks: OpenTaskItem[];
  /** section_id → Dutch sub-skill name, for the per-question-type breakdown. */
  sectionNames: Record<number, string>;
};

const OPTION_COLS = 'id, label, sort_order, body, image_urls, image_alt, audio_url, is_correct';
const QUESTION_COLS =
  `id, sort_order, prompt, prompt_audio_url, image_url, explanation, option_layout, ` +
  `question_options(${OPTION_COLS})`;
const STIMULUS_COLS =
  `id, part_id, sort_order, section_id, kind, intro, title, body_html, image_url, ` +
  `image_alt, audio_url, questions(${QUESTION_COLS})`;
const TASK_COLS =
  `id, part_id, sort_order, section_id, task_type, title, prompt_html, bullet_points, ` +
  `email_to, email_cc, email_subject, greeting, closing, min_sentences, form_schema, ` +
  `image_usage, prompt_audio_url, max_record_seconds, ` +
  `open_task_images(id, sort_order, image_url, caption, alt_text, group_label)`;

const byOrder = <T extends { sort_order: number }>(rows: T[]) =>
  [...rows].sort((a, b) => a.sort_order - b.sort_order);

/**
 * One exam with everything the player renders, or null when the exam does not exist or is
 * not published. Sorting happens here rather than in PostgREST — `order` inside a nested
 * select applies per parent and is easy to get silently wrong.
 */
export async function fetchExamContent(
  level: Level,
  skill: SkillSlug,
  number: number
): Promise<ExamContent | null> {
  const supabase = await createClient();

  // `maybeSingle()` throws when the filter matches more than one row. Before `level` existed
  // on this query that is exactly what a second level would have caused — (skill, number) is
  // no longer unique on its own.
  const { data: exam, error } = await supabase
    .from('exams')
    .select(
      'id, level, skill, number, title, is_free, duration_seconds, pass_threshold_pct, published',
    )
    .eq('level', level)
    .eq('skill', skill)
    .eq('number', number)
    .maybeSingle();

  if (error || !exam || !(exam as { published: boolean }).published) return null;
  const meta = exam as ExamMeta & { published: boolean };

  const [partsRes, stimuliRes, tasksRes, sectionsRes] = await Promise.all([
    supabase
      .from('exam_parts')
      .select('id, sort_order, title, instruction_html, show_instruction')
      .eq('exam_id', meta.id),
    supabase.from('stimuli').select(STIMULUS_COLS).eq('exam_id', meta.id),
    supabase.from('open_tasks').select(TASK_COLS).eq('exam_id', meta.id),
    // Filtered by level too: the sub-skill names are per (level, skill) since sections
    // became keyed (level, slug), and an unfiltered read would map a section_id to the
    // other level's label in the score breakdown.
    supabase.from('sections').select('id, name_nl').eq('level', level).eq('topic', skill),
  ]);

  type RawStimulus = Omit<StimulusItem, 'questions'> & {
    questions: (Omit<QuestionItem, 'options'> & { question_options: OptionItem[] })[];
  };
  type RawTask = Omit<OpenTaskItem, 'images'> & { open_task_images: TaskImage[] };

  const stimuli: StimulusItem[] = byOrder(
    ((stimuliRes.data ?? []) as unknown as RawStimulus[]).map(s => ({
      ...s,
      questions: byOrder(
        s.questions.map(q => ({ ...q, options: byOrder(q.question_options ?? []) }))
      ),
    }))
  );

  const tasks: OpenTaskItem[] = byOrder(
    ((tasksRes.data ?? []) as unknown as RawTask[]).map(t => ({
      ...t,
      bullet_points: Array.isArray(t.bullet_points) ? t.bullet_points : [],
      images: byOrder(t.open_task_images ?? []),
    }))
  );

  const sectionNames: Record<number, string> = {};
  for (const s of (sectionsRes.data ?? []) as { id: number; name_nl: string }[]) {
    sectionNames[s.id] = s.name_nl;
  }

  return {
    exam: {
      id: meta.id,
      level: meta.level,
      skill: meta.skill,
      number: meta.number,
      title: meta.title,
      is_free: meta.is_free,
      duration_seconds: meta.duration_seconds,
      pass_threshold_pct: meta.pass_threshold_pct,
    },
    parts: byOrder((partsRes.data ?? []) as ExamPartItem[]),
    stimuli,
    tasks,
    sectionNames,
  };
}

/** Total scorable items — MCQ questions for Lezen/Luisteren, tasks for the open skills. */
export function countItems(content: ExamContent): number {
  const mcq = content.stimuli.reduce((n, s) => n + s.questions.length, 0);
  return mcq > 0 ? mcq : content.tasks.length;
}
