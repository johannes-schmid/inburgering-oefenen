/**
 * Admin reads for the stimulus-shaped content model.
 *
 * `createClient()` runs on the service key, and every caller here already sits behind the
 * `(admin)` layout's `admin_users` allowlist guard, so these deliberately see draft and
 * unpublished content — that is the whole point of the authoring surface.
 */
import { createClient } from '@/lib/supabase/server';
import type { StimulusChoice } from '@/app/[locale]/(admin)/admin/questions/_components/QuestionForm';

export type AdminStimulus = {
  id: number;
  exam_id: number;
  part_id: number | null;
  skill: 'lezen' | 'luisteren';
  sort_order: number;
  section_id: number | null;
  kind: 'text' | 'audio' | 'image';
  intro: string | null;
  title: string | null;
  body_html: string | null;
  image_url: string | null;
  image_alt: string | null;
  audio_url: string | null;
  audio_seconds: number | null;
  script: string | null;
  voice_cast: Record<string, string> | null;
  review_status: 'pending' | 'validated';
  questions: {
    id: number;
    sort_order: number;
    prompt: string;
    option_layout: 'text' | 'image' | 'image_grid';
    review_status: 'pending' | 'validated';
    question_options: {
      id: number;
      label: 'A' | 'B' | 'C' | 'D';
      sort_order: number;
      body: string | null;
      image_urls: string[];
      image_alt: string | null;
      is_correct: boolean;
    }[];
  }[];
};

/** Every stimulus in the database, labelled for the question editor's picker. */
export async function fetchStimulusChoices(): Promise<StimulusChoice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stimuli')
    .select('id, sort_order, title, kind, exams!inner(skill, number)')
    .order('exam_id')
    .order('sort_order');

  type Row = {
    id: number; sort_order: number; title: string | null; kind: string;
    exams: { skill: string; number: number } | { skill: string; number: number }[];
  };

  return ((data ?? []) as unknown as Row[]).map(r => {
    const e = Array.isArray(r.exams) ? r.exams[0] : r.exams;
    return {
      id: r.id,
      skill: e?.skill ?? '?',
      exam_number: e?.number ?? 0,
      sort_order: r.sort_order,
      title: r.title,
      kind: r.kind,
    };
  });
}

/** One exam's stimuli with their questions and options, for the exam builder. */
export async function fetchExamStimuli(examId: number): Promise<AdminStimulus[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stimuli')
    .select(
      'id, exam_id, part_id, skill, sort_order, section_id, kind, intro, title, body_html, ' +
      'image_url, image_alt, audio_url, audio_seconds, script, voice_cast, review_status, ' +
      'questions(id, sort_order, prompt, option_layout, review_status, ' +
      'question_options(id, label, sort_order, body, image_urls, image_alt, is_correct))'
    )
    .eq('exam_id', examId)
    .order('sort_order');

  return ((data ?? []) as unknown as AdminStimulus[]).map(s => ({
    ...s,
    questions: [...(s.questions ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(q => ({
        ...q,
        question_options: [...(q.question_options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      })),
  }));
}

export type PublishIssue = {
  severity: 'error' | 'warning';
  entity: string;
  entity_id: number | null;
  issue: string;
};

/**
 * The publish gate. `exam_publish_issues()` is a read-only validator in the database rather
 * than a trigger, so a half-authored exam stays savable — the docent should not have to fight
 * the tool to park work in progress.
 */
export async function fetchPublishIssues(examId: number): Promise<PublishIssue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('exam_publish_issues', { p_exam_id: examId });
  if (error) return [];
  return (data ?? []) as PublishIssue[];
}

/** One row per tekstsoort present in an exam, plus a trailing 'Geen tekstsoort' row. */
export type StructureRow = {
  section_id: number | null;
  name_nl: string;
  sort_order: number;
  stimulus_count: number;
  question_count: number;
};

/**
 * The Opbouw panel's data: how this exam's fragments and questions are spread across the
 * text types. Reports only — there is deliberately no per-tekstsoort quota to compare it
 * against, because nobody has verified one for DUO's exams.
 */
export async function fetchStructureSummary(examId: number): Promise<StructureRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('exam_structure_summary', { p_exam_id: examId });
  if (error) return [];
  return (data ?? []) as StructureRow[];
}

export type TaskSummaryRow = {
  category: string;
  label_nl: string;
  sort_order: number;
  task_count: number;
  image_count: number;
  expected_min: number | null;
  expected_max: number | null;
  /** The active rubric that would grade this soort, or null if none is authored yet. */
  rubric_id: number | null;
  rubric_version: number | null;
};

/**
 * The Opbouw panel's data for Schrijven and Spreken: how many opgaven of each soort, against
 * what `exam_task_rules` expects. Unlike the tekstsoort breakdown this one *does* have a quota
 * to compare against — DUO's three A2 Schrijven oefenexamens agree on the mix.
 *
 * A category the exam is missing entirely comes back with `task_count: 0` rather than being
 * absent, which is the whole point: "er zit geen formulier in dit examen" is the most useful
 * thing the panel can say, and a row that is not there cannot say it.
 */
export async function fetchTaskSummary(examId: number): Promise<TaskSummaryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('exam_task_summary', { p_exam_id: examId });
  if (error) return [];
  return (data ?? []) as TaskSummaryRow[];
}
