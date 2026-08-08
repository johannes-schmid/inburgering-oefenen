import { createClient } from '@/lib/supabase/server';
import type { Level, SkillSlug } from '@/data/skills';
import type { ExamDefaults, ExamSetup, FormatRow, SectionRow, TaskRuleRow } from './exam-setup';

/**
 * Everything the setup sheet edits, for one onderdeel. Server half of `exam-setup.ts`.
 *
 * `task_categories` is the outer side of the task-rule join on purpose: a category with no rule
 * row yet must still be offered, or a soort opgave could never be given rules for the first time.
 */
export async function fetchExamSetup(level: Level, skill: SkillSlug): Promise<ExamSetup> {
  const supabase = await createClient();

  const [formatRes, sectionRes, categoryRes, ruleRes, usageRes, examRes] = await Promise.all([
    supabase
      .from('exam_formats')
      .select(
        'level, skill, item_count, duration_seconds, part_count, items_per_part, stimulus_count, ' +
        'questions_per_stimulus_min, questions_per_stimulus_max, options_min, options_max, ' +
        'audio_seconds_min, audio_seconds_max, verified_note'
      )
      .eq('level', level)
      .eq('skill', skill)
      .maybeSingle(),
    supabase
      .from('sections')
      .select('id, level, topic, slug, name_nl, sort_order')
      .eq('level', level)
      .eq('topic', skill)
      .order('sort_order'),
    supabase
      .from('task_categories')
      .select('skill, category, label_nl, sort_order')
      .eq('skill', skill)
      .order('sort_order'),
    supabase
      .from('exam_task_rules')
      .select(
        'level, skill, category, min_per_exam, max_per_exam, image_count, min_sentences, ' +
        'bullets_min, bullets_max, record_seconds'
      )
      .eq('level', level)
      .eq('skill', skill),
    // How many fragments each tekstsoort holds, across every exam of this onderdeel — the
    // number that turns "verwijderen" from a guess into a decision.
    supabase.from('stimuli').select('section_id').eq('skill', skill),
    // The two settings the player actually reads. They live per exam, so they are summarised
    // here and only reported as a number when the ten oefenexamens agree — see `ExamDefaults`.
    // The backlog is excluded: exam 0 is a holding area and its duration means nothing.
    supabase
      .from('exams')
      .select('duration_seconds, pass_threshold_pct, number')
      .eq('level', level)
      .eq('skill', skill)
      .gt('number', 0),
  ]);

  const examRows = (examRes.data ?? []) as
    { duration_seconds: number; pass_threshold_pct: number; number: number }[];
  const agreed = <T,>(vals: T[]): T | null =>
    vals.length > 0 && vals.every(v => v === vals[0]) ? vals[0] : null;
  const durationSeconds = agreed(examRows.map(e => e.duration_seconds));
  const defaults: ExamDefaults = {
    durationMinutes: durationSeconds === null ? null : Math.round(durationSeconds / 60),
    passThresholdPct: agreed(examRows.map(e => e.pass_threshold_pct)),
    examCount: examRows.length,
  };

  const usage = new Map<number, number>();
  for (const s of (usageRes.data ?? []) as { section_id: number | null }[]) {
    if (s.section_id !== null) usage.set(s.section_id, (usage.get(s.section_id) ?? 0) + 1);
  }

  const rules = new Map(
    // `exam_task_rules` and `task_categories` post-date the generated Supabase types, so the
    // client infers an error shape for them. Regenerate the types and these casts can go.
    ((ruleRes.data ?? []) as unknown as Omit<TaskRuleRow, 'label_nl' | 'sort_order'>[])
      .map(r => [r.category, r])
  );

  return {
    format: (formatRes.data ?? null) as FormatRow | null,
    sections: ((sectionRes.data ?? []) as Omit<SectionRow, 'in_use'>[]).map(s => ({
      ...s,
      in_use: usage.get(s.id) ?? 0,
    })),
    taskRules: ((categoryRes.data ?? []) as unknown as {
      skill: string; category: string; label_nl: string; sort_order: number;
    }[]).map(c => {
      const r = rules.get(c.category);
      return {
        level,
        skill: c.skill,
        category: c.category,
        label_nl: c.label_nl,
        sort_order: c.sort_order,
        min_per_exam: r?.min_per_exam ?? null,
        max_per_exam: r?.max_per_exam ?? null,
        image_count: r?.image_count ?? null,
        min_sentences: r?.min_sentences ?? null,
        bullets_min: r?.bullets_min ?? null,
        bullets_max: r?.bullets_max ?? null,
        record_seconds: r?.record_seconds ?? null,
      };
    }),
    defaults,
  };
}

