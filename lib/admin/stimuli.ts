/**
 * Admin reads for the stimulus-shaped content model.
 *
 * `createClient()` runs on the service key, and every caller here already sits behind the
 * `(admin)` layout's `admin_users` allowlist guard, so these deliberately see draft and
 * unpublished content — that is the whole point of the authoring surface.
 */
import { createClient } from '@/lib/supabase/server';
import { levelFilter } from '@/lib/exams';
import { BACKLOG_EXAM_NUMBER } from '@/lib/admin/backlog';
import { countAnswersPerQuestion } from '@/lib/admin/backlog-server';
import type { Level } from '@/data/skills';
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
    // `level` rides along because the question editor's suggestion has to be written at the level
    // of the fragment it hangs off. Reading it off the picked stimulus rather than off the page is
    // the same rule as everywhere else: a page-level default silently authors B1 at A2 register.
    // It is nullable — a non-levelled onderdeel (see `skills.is_levelled`) has no level at all.
    .select('id, sort_order, title, kind, exams!inner(skill, number, level)')
    .order('exam_id')
    .order('sort_order');

  type ExamRef = { skill: string; number: number; level: string | null };
  type Row = {
    id: number; sort_order: number; title: string | null; kind: string;
    exams: ExamRef | ExamRef[];
  };

  return ((data ?? []) as unknown as Row[]).map(r => {
    const e = Array.isArray(r.exams) ? r.exams[0] : r.exams;
    return {
      id: r.id,
      skill: e?.skill ?? '?',
      level: e?.level ?? null,
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

/* ── The fragment page ────────────────────────────────────────────────────────────────────── */

export type FragmentQuestion = {
  id: number;
  sort_order: number;
  prompt: string;
  explanation: string;
  image_url: string | null;
  prompt_audio_url: string | null;
  option_layout: 'text' | 'image' | 'image_grid';
  review_status: 'pending' | 'validated';
  options: {
    id: number;
    label: 'A' | 'B' | 'C' | 'D';
    sort_order: number;
    body: string | null;
    image_urls: string[];
    image_alt: string | null;
    is_correct: boolean;
  }[];
  /** Recorded candidate answers. Server-only count — see `countAnswersPerQuestion`. */
  answerCount: number;
};

export type FragmentContext = {
  stimulus: Omit<AdminStimulus, 'questions'> | null;
  questions: FragmentQuestion[];
  exam: { id: number; number: number; level: Level | null; skill: string };
  /** Every tekstsoort of this (level, skill), in `sort_order` — the colour key list, see below. */
  sections: { id: number; slug: string; name_nl: string }[];
};

const FRAGMENT_COLS =
  'id, exam_id, part_id, skill, sort_order, section_id, kind, intro, title, body_html, ' +
  'image_url, image_alt, audio_url, audio_seconds, script, voice_cast, review_status, ' +
  'questions(id, sort_order, prompt, explanation, image_url, prompt_audio_url, option_layout, ' +
  'review_status, question_options(id, label, sort_order, body, image_urls, image_alt, is_correct))';

/**
 * Everything the fragment page edits, in one read: the fragment, its questions with their
 * options, the exam it sits in, and the tekstsoorten it can be filed under.
 *
 * The page holds all of this as **one draft** and saves it in one action, so it has to arrive as
 * one object — a preview that renders unsaved questions cannot be assembled from a fragment here
 * and a question list fetched somewhere else.
 *
 * `sections` is the full list for the (level, skill) in `sort_order`, not just the one this
 * fragment uses, because `categoryColors()` assigns colours **per list**: passing the same ordered
 * list the exam builder passes is what makes "gesprek" the same colour on both screens.
 */
export async function fetchFragment(stimulusId: number): Promise<FragmentContext | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('stimuli')
    .select(`${FRAGMENT_COLS}, exams!inner(id, number, level, skill)`)
    .eq('id', stimulusId)
    .maybeSingle();
  if (!data) return null;

  type Row = Omit<AdminStimulus, 'questions'> & {
    exams: { id: number; number: number; level: Level | null; skill: string };
    questions: (Omit<FragmentQuestion, 'options' | 'answerCount'> & {
      question_options: FragmentQuestion['options'];
    })[] | null;
  };
  const row = data as unknown as Row;
  const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams;

  const raw = [...(row.questions ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const answers = await countAnswersPerQuestion(raw.map(q => q.id));

  const { stimulus, questions } = {
    stimulus: row,
    questions: raw.map(q => ({
      ...q,
      options: [...(q.question_options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      answerCount: answers.get(q.id) ?? 0,
    })),
  };

  return {
    stimulus: stimulus as FragmentContext['stimulus'],
    questions,
    exam,
    sections: await fetchSections(exam.level, exam.skill),
  };
}

/** The context a *new* fragment needs: which backlog it lands in, and the tekstsoort options. */
export async function fetchNewFragmentContext(
  /** `null` is the KNM catalogue — see `AdminLevel` in lib/admin/nav.ts. */
  level: Level | null,
  skill: string
): Promise<FragmentContext | null> {
  const supabase = await createClient();
  const { data } = await levelFilter(
    supabase.from('exams').select('id, number, level, skill'),
    level,
  )
    .eq('skill', skill)
    .eq('number', BACKLOG_EXAM_NUMBER)
    .maybeSingle();
  if (!data) return null;

  const exam = data as { id: number; number: number; level: Level | null; skill: string };
  return {
    stimulus: null,
    questions: [],
    exam,
    sections: await fetchSections(level, skill),
  };
}

async function fetchSections(level: Level | null, skill: string) {
  const supabase = await createClient();
  let query = supabase
    .from('sections')
    .select('id, slug, name_nl')
    .eq('topic', skill)
    .order('sort_order');
  // A non-levelled onderdeel has NULL sections; `.eq` never matches NULL.
  query = level === null ? query.is('level', null) : query.eq('level', level);
  const { data } = await query;
  return (data ?? []) as { id: number; slug: string; name_nl: string }[];
}
