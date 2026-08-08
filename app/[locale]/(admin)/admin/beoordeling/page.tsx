import { createClient } from '@/lib/supabase/server';
import { rubricCategory, type CriterionScore, type RubricCriterion } from '@/lib/rubrics';
import GradingInbox from './_components/GradingInbox';

export const revalidate = 0;

/** How many submissions the inbox holds at once. The partial index makes this cheap. */
const PAGE_SIZE = 200;

export type InboxRow = {
  id: number;
  created_at: string | null;
  status: 'submitted' | 'ai_graded' | 'teacher_reviewed';
  grade_error: string | null;
  skill: 'schrijven' | 'spreken';
  exam_number: number | null;
  category: string;
  task_id: number;
  task_title: string | null;
  task_prompt: string | null;
  bullet_points: string[];
  email_to: string | null;
  email_subject: string | null;
  greeting: string | null;
  closing: string | null;
  min_sentences: number | null;
  max_record_seconds: number;
  images: {
    sort_order: number;
    image_url: string;
    caption: string | null;
    alt_text: string | null;
    group_label: string | null;
  }[];
  answer_text: string | null;
  answer_json: Record<string, unknown> | null;
  transcript: string | null;
  audio_seconds: number | null;
  has_audio: boolean;
  speech_signals: Record<string, number | null> | null;
  ai_overall: string | null;
  ai_tips: string[];
  teacher_notes: string | null;
  rubric_id: number | null;
  rubric_version: number | null;
  criteria: RubricCriterion[];
  scores: CriterionScore[];
};

/**
 * The docent's review inbox.
 *
 * Everything ungraded, model-graded or failed, newest first; teacher-reviewed submissions drop out
 * because the work on them is done. Loaded in one pass with the rubric that graded each answer, so
 * the drawer can show her criteria beside the model's scores without a round trip per row.
 *
 * The recording itself is *not* loaded or signed here — that happens per submission when the drawer
 * opens (`_actions.ts`), so opening the inbox does not mint 200 signed URLs.
 */
export default async function BeoordelingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('open_submissions')
    .select(
      'id, created_at, status, grade_error, task_id, answer_text, answer_json, audio_url, ' +
        'transcript, audio_seconds, speech_signals, ai_result, teacher_notes, rubric_version, ' +
        'open_tasks!inner(id, skill, task_type, title, prompt_html, bullet_points, email_to, ' +
        'email_subject, greeting, closing, min_sentences, image_usage, max_record_seconds, ' +
        'exams(number), ' +
        'open_task_images(sort_order, image_url, caption, alt_text, group_label)), ' +
        'open_criterion_scores(criterion_key, score, feedback, source, rubric_id)'
    )
    .neq('status', 'teacher_reviewed')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  type Raw = {
    id: number;
    created_at: string | null;
    status: InboxRow['status'];
    grade_error: string | null;
    task_id: number;
    answer_text: string | null;
    answer_json: Record<string, unknown> | null;
    audio_url: string | null;
    transcript: string | null;
    audio_seconds: number | null;
    speech_signals: Record<string, number | null> | null;
    ai_result: { overall?: string; tips?: string[] } | null;
    teacher_notes: string | null;
    rubric_version: number | null;
    open_tasks: {
      id: number;
      skill: 'schrijven' | 'spreken';
      task_type: string;
      title: string | null;
      prompt_html: string | null;
      bullet_points: unknown;
      email_to: string | null;
      email_subject: string | null;
      greeting: string | null;
      closing: string | null;
      min_sentences: number | null;
      image_usage: 'none' | 'react' | 'describe' | 'choose' | 'cover_all';
      max_record_seconds: number;
      exams: { number: number } | null;
      open_task_images: InboxRow['images'];
    };
    open_criterion_scores: (CriterionScore & { rubric_id: number | null })[];
  };

  const raw = (data ?? []) as unknown as Raw[];

  // One rubric fetch for every version actually referenced, rather than per row.
  const rubricIds = [
    ...new Set(
      raw.flatMap(r => r.open_criterion_scores.map(s => s.rubric_id).filter((n): n is number => n != null))
    ),
  ];

  const rubricCriteria = new Map<number, RubricCriterion[]>();
  if (rubricIds.length > 0) {
    const { data: rubrics } = await supabase
      .from('rubrics')
      .select('id, criteria')
      .in('id', rubricIds);
    for (const r of (rubrics ?? []) as { id: number; criteria: unknown }[]) {
      rubricCriteria.set(r.id, (Array.isArray(r.criteria) ? r.criteria : []) as RubricCriterion[]);
    }
  }

  // A submission that has never been graded has no rubric_id on any score row, so fall back to the
  // active rubric for its category — otherwise the docent opens an ungraded answer and sees no
  // criteria to score it against, which is the one thing this screen exists to do.
  const { data: activeRubrics } = await supabase
    .from('rubrics')
    .select('id, skill, task_type, version, criteria')
    .eq('active', true);

  const activeByKey = new Map<string, { id: number; version: number; criteria: RubricCriterion[] }>();
  for (const r of (activeRubrics ?? []) as {
    id: number;
    skill: string;
    task_type: string;
    version: number;
    criteria: unknown;
  }[]) {
    activeByKey.set(`${r.skill}:${r.task_type}`, {
      id: r.id,
      version: r.version,
      criteria: (Array.isArray(r.criteria) ? r.criteria : []) as RubricCriterion[],
    });
  }

  const rows: InboxRow[] = raw.map(r => {
    const t = r.open_tasks;
    const category = rubricCategory({ task_type: t.task_type, image_usage: t.image_usage });
    const scoredRubricId =
      r.open_criterion_scores.find(s => s.rubric_id != null)?.rubric_id ?? null;
    const fallback = activeByKey.get(`${t.skill}:${category}`);

    return {
      id: r.id,
      created_at: r.created_at,
      status: r.status,
      grade_error: r.grade_error,
      skill: t.skill,
      exam_number: t.exams?.number ?? null,
      category,
      task_id: t.id,
      task_title: t.title,
      task_prompt: t.prompt_html,
      bullet_points: Array.isArray(t.bullet_points)
        ? (t.bullet_points as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
      email_to: t.email_to,
      email_subject: t.email_subject,
      greeting: t.greeting,
      closing: t.closing,
      min_sentences: t.min_sentences,
      max_record_seconds: t.max_record_seconds,
      images: [...(t.open_task_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      answer_text: r.answer_text,
      answer_json: r.answer_json,
      transcript: r.transcript,
      audio_seconds: r.audio_seconds,
      has_audio: Boolean(r.audio_url),
      speech_signals: r.speech_signals,
      ai_overall: r.ai_result?.overall ?? null,
      ai_tips: r.ai_result?.tips ?? [],
      teacher_notes: r.teacher_notes,
      rubric_id: scoredRubricId ?? fallback?.id ?? null,
      rubric_version: r.rubric_version ?? fallback?.version ?? null,
      criteria:
        (scoredRubricId != null ? rubricCriteria.get(scoredRubricId) : undefined) ??
        fallback?.criteria ??
        [],
      scores: r.open_criterion_scores.map(s => ({
        criterion_key: s.criterion_key,
        score: s.score,
        feedback: s.feedback,
        source: s.source,
      })),
    };
  });

  return <GradingInbox rows={rows} locale={locale} />;
}
