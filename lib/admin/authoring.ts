/**
 * What `/admin/questions` needs in order to be the authoring surface.
 *
 * Items are written here and only assigned in `/admin/exams` (owner's decision, 2026-08-07), so
 * this screen needs three things the read-only content list never did: the fragments themselves,
 * the tekstsoort options to file them under, and somewhere for a *new* fragment to land — which
 * is the backlog, exam number 0 of the (level, skill).
 */
import { createClient } from '@/lib/supabase/server';
import { BACKLOG_EXAM_NUMBER } from '@/lib/admin/backlog';
import { countAnswersPerQuestion } from '@/lib/admin/backlog-server';
import { SKILLS, type Level, type SkillSlug } from '@/data/skills';
import type { AdminStimulus } from '@/lib/admin/stimuli';

export type AuthoringSection = { id: number; name_nl: string; topic: string };

/**
 * One question as the fragment drawer lists it: enough to say whether it is finished and what
 * removing it would cost, and nothing more. The wording, the options and the explanation are the
 * item drawer's business.
 */
export type AuthoringQuestion = {
  id: number;
  sort_order: number;
  prompt: string;
  review_status: 'pending' | 'validated';
  optionCount: number;
  hasCorrect: boolean;
  /** Recorded candidate answers, counted on the service key — see `countAnswersPerQuestion`. */
  answerCount: number;
};

/** The fragment as the questions screen lists it, with its questions summarised. */
export type AuthoringStimulus = Omit<AdminStimulus, 'questions'> & {
  examNumber: number;
  questionCount: number;
  questionList: AuthoringQuestion[];
};

export type AuthoringContext = {
  /** `skill` → the exam id of its backlog, where a new fragment lands. */
  backlogExamIds: Partial<Record<SkillSlug, number>>;
  sections: AuthoringSection[];
  stimuli: AuthoringStimulus[];
};

const STIMULUS_COLS =
  'id, exam_id, part_id, skill, sort_order, section_id, kind, intro, title, body_html, ' +
  'image_url, image_alt, audio_url, audio_seconds, script, voice_cast, review_status, ' +
  'exams!inner(number, level), ' +
  'questions(id, sort_order, prompt, review_status, question_options(id, is_correct))';

export async function fetchAuthoringContext(level: Level): Promise<AuthoringContext> {
  const supabase = await createClient();

  const [examsRes, sectionsRes, stimuliRes] = await Promise.all([
    supabase.from('exams').select('id, skill, number').eq('level', level),
    // Level-filtered: `sections` is keyed (level, slug), and an unfiltered read would offer the
    // other level's tekstsoorten in the picker.
    supabase.from('sections').select('id, name_nl, topic').eq('level', level).order('sort_order'),
    supabase.from('stimuli').select(STIMULUS_COLS).order('exam_id').order('sort_order'),
  ]);

  const backlogExamIds: Partial<Record<SkillSlug, number>> = {};
  for (const e of (examsRes.data ?? []) as { id: number; skill: string; number: number }[]) {
    if (e.number !== BACKLOG_EXAM_NUMBER) continue;
    const slug = SKILLS.find(s => s.slug === e.skill)?.slug;
    if (slug) backlogExamIds[slug] = e.id;
  }

  type QuestionRow = {
    id: number;
    sort_order: number;
    prompt: string | null;
    review_status: 'pending' | 'validated';
    question_options: { id: number; is_correct: boolean }[] | null;
  };
  type Row = Omit<AdminStimulus, 'questions'> & {
    exams: { number: number; level: Level | null } | { number: number; level: Level | null }[];
    questions: QuestionRow[] | null;
  };

  const rows = (stimuliRes.data ?? []) as unknown as Row[];

  // One extra round trip, on the service key, for the whole screen — the alternative is counting
  // per fragment when a drawer opens, which is a query per click for a number the docent only
  // needs at the moment she considers deleting something.
  const answers = await countAnswersPerQuestion(
    rows.flatMap(r => (r.questions ?? []).map(q => q.id))
  );

  const stimuli = rows
    .map(r => {
      const e = Array.isArray(r.exams) ? r.exams[0] : r.exams;
      return {
        ...r,
        examNumber: e?.number ?? 0,
        // A non-levelled onderdeel has a null level and belongs under every tab, the same rule
        // `atLevel()` applies to the rows themselves.
        _level: e?.level ?? null,
        questionCount: r.questions?.length ?? 0,
        questionList: [...(r.questions ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(q => ({
            id: q.id,
            sort_order: q.sort_order,
            prompt: q.prompt ?? '',
            review_status: q.review_status,
            optionCount: q.question_options?.length ?? 0,
            hasCorrect: (q.question_options ?? []).some(o => o.is_correct),
            answerCount: answers.get(q.id) ?? 0,
          })),
      };
    })
    .filter(s => s._level === null || s._level === level)
    .map(({ _level, ...s }) => { void _level; return s as AuthoringStimulus; });

  return {
    backlogExamIds,
    sections: (sectionsRes.data ?? []) as AuthoringSection[],
    stimuli,
  };
}
