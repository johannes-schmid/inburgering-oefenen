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
import type { Level, SkillSlug } from '@/data/skills';

export type ContentKind = 'question' | 'task';

export type ContentRow = {
  /** Unique across both tables — the raw id collides. */
  uid: string;
  kind: ContentKind;
  id: number;
  /**
   * `null` for a non-levelled onderdeel (KNM's shape) — those exist in the schema, so the
   * list has to be able to hold one rather than crash or hide it.
   */
  level: Level | null;
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
  /**
   * The tekstsoort (`sections.name_nl`) this item is filed under — a gesprek, a mededeling, a
   * telefoongesprek. `null` means none has been chosen, which is a real authoring gap: an
   * uncategorised fragment is invisible in the exam's Opbouw panel and in the candidate's
   * per-tekstsoort score breakdown. For a question it is inherited from its fragment; for an
   * open task it is the task's own `section_id`.
   */
  sectionName: string | null;
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
          // `exams` is joined off the question directly, and `stimuli` is a LEFT join
          // (no `!inner`). It used to reach the exam *through* the stimulus, which
          // silently dropped every standalone question — a question with no stimulus is
          // legal since 20260803000000_open_skill_axis.sql, and this list is the only
          // screen that shows it. `questions.exam_id` is NOT NULL, so the exam is always
          // there whether the stimulus is or not.
          'exams!inner(level, skill, number, published), ' +
          'stimuli(id, sort_order, title, kind, audio_url, sections(name_nl))'
      )
      .order('id'),
    supabase
      .from('open_tasks')
      .select(
        'id, sort_order, skill, task_type, title, prompt_html, image_usage, review_status, updated_at, ' +
          'rubric_id, model_answer, prompt_audio_url, ' +
          'exams!inner(level, number, published), open_task_images(id), sections(name_nl)'
      )
      .order('id'),
  ]);

  type QRaw = {
    id: number; sort_order: number; prompt: string; explanation: string | null;
    option_layout: string; review_status: 'pending' | 'validated'; updated_at: string | null;
    prompt_audio_url: string | null;
    question_options: { id: number; is_correct: boolean }[];
    exams: { level: Level | null; skill: SkillSlug; number: number; published: boolean };
    /** null for a standalone question — see the select above. */
    stimuli: {
      id: number; sort_order: number; title: string | null; kind: string; audio_url: string | null;
      sections: { name_nl: string } | null;
    } | null;
  };

  type TRaw = {
    id: number; sort_order: number; skill: SkillSlug; task_type: string;
    title: string | null; prompt_html: string | null; image_usage: string;
    review_status: 'pending' | 'validated'; updated_at: string | null;
    rubric_id: number | null; model_answer: string | null; prompt_audio_url: string | null;
    exams: { level: Level | null; number: number; published: boolean };
    open_task_images: { id: number }[];
    sections: { name_nl: string } | null;
  };

  const rows: ContentRow[] = [];

  for (const q of (questions.data ?? []) as unknown as QRaw[]) {
    const options = q.question_options ?? [];
    rows.push({
      uid: `question:${q.id}`,
      kind: 'question',
      id: q.id,
      level: q.exams.level,
      skill: q.exams.skill,
      examNumber: q.exams.number,
      examPublished: q.exams.published,
      sortOrder: q.sort_order,
      title: q.prompt,
      typeLabel: `${options.length} opties${q.option_layout === 'text' ? '' : ` · ${q.option_layout}`}`,
      reviewStatus: q.review_status,
      updatedAt: q.updated_at,
      hasAnswerKey: options.some(o => o.is_correct),
      hasExplanation: Boolean(q.explanation?.trim()),
      // Luisteren needs the stimulus fragment; the per-question read-aloud is optional everywhere.
      hasAudio: q.stimuli?.kind === 'audio' ? Boolean(q.stimuli.audio_url) : null,
      hasImages: null,
      hasModelAnswer: null,
      hasRubric: null,
      stimulusId: q.stimuli?.id ?? null,
      stimulusTitle: q.stimuli?.title ?? null,
      stimulusKind: q.stimuli?.kind ?? null,
      sectionName: q.stimuli?.sections?.name_nl ?? null,
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
      level: t.exams.level,
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
      sectionName: t.sections?.name_nl ?? null,
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
