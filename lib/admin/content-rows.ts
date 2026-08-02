/**
 * One list for all exam content, across all four onderdelen.
 *
 * `/admin/questions` and `/admin/opgaven` were two screens because the tables are two shapes:
 * Lezen and Luisteren are `questions` hanging off a stimulus, Schrijven and Spreken are
 * `open_tasks` with a rubric. That is a database fact, not a docent-facing one — she thinks in
 * "the items of exam 3", and having to remember which menu holds which skill is a tax with no
 * upside. So both are flattened to one `ContentRow` here and the skill becomes a tab.
 *
 * The `kind` discriminator is kept on every row rather than inferred from the skill, because the
 * editor has to know which table to write back to and inferring it would break the moment a skill's
 * scoring changes.
 */
import { createClient } from '@/lib/supabase/server';
import type { SkillSlug } from '@/data/skills';

export type ContentKind = 'question' | 'task';

export type ContentRow = {
  /** Unique across both tables — the raw id collides. */
  uid: string;
  kind: ContentKind;
  id: number;
  skill: SkillSlug;
  examNumber: number;
  examPublished: boolean;
  sortOrder: number;
  /** Prompt for a question, title/prompt for a task. Truncated for the list, not for the editor. */
  title: string;
  /** `mcq · 3 opties` / `email` / `spreken · beschrijf` — the shape at a glance. */
  typeLabel: string;
  reviewStatus: 'pending' | 'validated';
  updatedAt: string | null;

  /* Completeness flags — what the list is actually for. */
  hasAnswerKey: boolean | null;
  hasExplanation: boolean | null;
  hasAudio: boolean | null;
  hasImages: boolean | null;
  hasModelAnswer: boolean | null;
  hasRubric: boolean | null;

  /** Only for questions: the stimulus the item hangs off. */
  stimulusId: number | null;
  stimulusTitle: string | null;
  stimulusKind: string | null;
};

const TASK_TYPE_LABEL: Record<string, string> = {
  email: 'e-mail',
  short_text: 'korte tekst',
  form: 'formulier',
  picture_note: 'bericht bij plaatjes',
  speaking: 'spreken',
};

const IMAGE_USAGE_LABEL: Record<string, string> = {
  none: 'geen plaatje',
  describe: 'beschrijf',
  choose: 'kies er één',
  cover_all: 'alle plaatjes',
};

export async function fetchContentRows(): Promise<ContentRow[]> {
  const supabase = await createClient();

  // Two round trips rather than one view: the shapes share almost no columns, and a UNION view
  // would have to null-pad both sides and be maintained alongside every column either table gains.
  const [questions, tasks] = await Promise.all([
    supabase
      .from('questions')
      .select(
        'id, sort_order, prompt, explanation, option_layout, review_status, updated_at, prompt_audio_url, ' +
          'question_options(id, is_correct), ' +
          'stimuli!inner(id, sort_order, title, kind, audio_url, exams!inner(skill, number, published))'
      )
      .order('id'),
    supabase
      .from('open_tasks')
      .select(
        'id, sort_order, skill, task_type, title, prompt_html, image_usage, review_status, updated_at, ' +
          'rubric_id, model_answer, prompt_audio_url, ' +
          'exams!inner(number, published), open_task_images(id)'
      )
      .order('id'),
  ]);

  type QRaw = {
    id: number; sort_order: number; prompt: string; explanation: string | null;
    option_layout: string; review_status: 'pending' | 'validated'; updated_at: string | null;
    prompt_audio_url: string | null;
    question_options: { id: number; is_correct: boolean }[];
    stimuli: {
      id: number; sort_order: number; title: string | null; kind: string; audio_url: string | null;
      exams: { skill: SkillSlug; number: number; published: boolean };
    };
  };

  type TRaw = {
    id: number; sort_order: number; skill: SkillSlug; task_type: string;
    title: string | null; prompt_html: string | null; image_usage: string;
    review_status: 'pending' | 'validated'; updated_at: string | null;
    rubric_id: number | null; model_answer: string | null; prompt_audio_url: string | null;
    exams: { number: number; published: boolean };
    open_task_images: { id: number }[];
  };

  const rows: ContentRow[] = [];

  for (const q of (questions.data ?? []) as unknown as QRaw[]) {
    const options = q.question_options ?? [];
    rows.push({
      uid: `question:${q.id}`,
      kind: 'question',
      id: q.id,
      skill: q.stimuli.exams.skill,
      examNumber: q.stimuli.exams.number,
      examPublished: q.stimuli.exams.published,
      sortOrder: q.sort_order,
      title: q.prompt,
      typeLabel: `${options.length} opties${q.option_layout === 'text' ? '' : ` · ${q.option_layout}`}`,
      reviewStatus: q.review_status,
      updatedAt: q.updated_at,
      hasAnswerKey: options.some(o => o.is_correct),
      hasExplanation: Boolean(q.explanation?.trim()),
      // Luisteren needs the stimulus fragment; the per-question read-aloud is optional everywhere.
      hasAudio: q.stimuli.kind === 'audio' ? Boolean(q.stimuli.audio_url) : null,
      hasImages: null,
      hasModelAnswer: null,
      hasRubric: null,
      stimulusId: q.stimuli.id,
      stimulusTitle: q.stimuli.title,
      stimulusKind: q.stimuli.kind,
    });
  }

  for (const t of (tasks.data ?? []) as unknown as TRaw[]) {
    const label =
      t.skill === 'spreken'
        ? `spreken · ${IMAGE_USAGE_LABEL[t.image_usage] ?? t.image_usage}`
        : TASK_TYPE_LABEL[t.task_type] ?? t.task_type;
    rows.push({
      uid: `task:${t.id}`,
      kind: 'task',
      id: t.id,
      skill: t.skill,
      examNumber: t.exams.number,
      examPublished: t.exams.published,
      sortOrder: t.sort_order,
      title: t.title?.trim() || stripHtml(t.prompt_html) || `Opgave ${t.sort_order}`,
      typeLabel: label,
      reviewStatus: t.review_status,
      updatedAt: t.updated_at,
      hasAnswerKey: null,
      hasExplanation: null,
      hasAudio: t.skill === 'spreken' ? Boolean(t.prompt_audio_url) : null,
      hasImages: t.image_usage === 'none' ? null : (t.open_task_images?.length ?? 0) > 0,
      hasModelAnswer: Boolean(t.model_answer?.trim()),
      hasRubric: t.rubric_id != null,
      stimulusId: null,
      stimulusTitle: null,
      stimulusKind: null,
    });
  }

  return rows.sort(
    (a, b) => a.skill.localeCompare(b.skill) || a.examNumber - b.examNumber || a.sortOrder - b.sortOrder
  );
}

function stripHtml(html: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
