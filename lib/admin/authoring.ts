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
import { SKILLS, type Level, type SkillSlug } from '@/data/skills';
import type { AdminStimulus } from '@/lib/admin/stimuli';

export type AuthoringSection = { id: number; name_nl: string; topic: string };

/**
 * The fragment as the questions screen lists it — a count, not the questions.
 *
 * It deliberately carries no question detail: the fragment page (`/admin/fragmenten/[id]`) reads
 * its own, because it edits them. This list only has to answer "which fragment has nothing on it
 * yet", and loading every question of every fragment to render a number is a lot of payload for
 * one integer.
 */
export type AuthoringStimulus = Omit<AdminStimulus, 'questions'> & {
  examNumber: number;
  questionCount: number;
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
  'exams!inner(number, level), questions(id)';

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

  type Row = Omit<AdminStimulus, 'questions'> & {
    exams: { number: number; level: Level | null } | { number: number; level: Level | null }[];
    questions: { id: number }[] | null;
  };

  const stimuli = ((stimuliRes.data ?? []) as unknown as Row[])
    .map(r => {
      const e = Array.isArray(r.exams) ? r.exams[0] : r.exams;
      return {
        ...r,
        examNumber: e?.number ?? 0,
        // A non-levelled onderdeel has a null level and belongs under every tab, the same rule
        // `atLevel()` applies to the rows themselves.
        _level: e?.level ?? null,
        questionCount: r.questions?.length ?? 0,
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
