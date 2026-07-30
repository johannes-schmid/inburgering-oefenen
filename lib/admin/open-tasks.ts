/**
 * The choice lists the Schrijven/Spreken task editor needs.
 *
 * Server-only (it uses the service-key client), so it is imported by the page, never by the form.
 */
import { createClient } from '@/lib/supabase/server';
import { rubricCategory, type RubricCategory } from '@/lib/rubrics';

export type ExamChoice = {
  id: number;
  skill: 'schrijven' | 'spreken';
  number: number;
  title: string | null;
  published: boolean;
  /** Highest `sort_order` in use, so a new task can default to the next free slot. */
  maxSortOrder: number;
};

export type PartChoice = {
  id: number;
  exam_id: number;
  sort_order: number;
  title: string;
};

export type RubricChoice = {
  id: number;
  skill: string;
  task_type: string;
  version: number;
  active: boolean;
};

export type SectionChoice = { id: number; name_nl: string; topic: string };

/** Only the two rubric skills — the MCQ exams have no `open_tasks`. */
export async function fetchOpenTaskChoices(): Promise<{
  exams: ExamChoice[];
  parts: PartChoice[];
  rubrics: RubricChoice[];
  sections: SectionChoice[];
}> {
  const supabase = await createClient();

  const [examsRes, partsRes, rubricsRes, sectionsRes, ordersRes] = await Promise.all([
    supabase
      .from('exams')
      .select('id, skill, number, title, published')
      .in('skill', ['schrijven', 'spreken'])
      .order('skill')
      .order('number'),
    supabase.from('exam_parts').select('id, exam_id, sort_order, title').order('sort_order'),
    supabase
      .from('rubrics')
      .select('id, skill, task_type, version, active')
      .order('skill')
      .order('task_type')
      .order('version', { ascending: false }),
    supabase.from('sections').select('id, name_nl, topic').in('topic', ['schrijven', 'spreken']),
    supabase.from('open_tasks').select('exam_id, sort_order'),
  ]);

  const maxByExam = new Map<number, number>();
  for (const r of (ordersRes.data ?? []) as { exam_id: number; sort_order: number }[]) {
    maxByExam.set(r.exam_id, Math.max(maxByExam.get(r.exam_id) ?? 0, r.sort_order));
  }

  return {
    exams: ((examsRes.data ?? []) as Omit<ExamChoice, 'maxSortOrder'>[]).map(e => ({
      ...e,
      maxSortOrder: maxByExam.get(e.id) ?? 0,
    })),
    parts: (partsRes.data ?? []) as PartChoice[],
    rubrics: (rubricsRes.data ?? []) as RubricChoice[],
    sections: (sectionsRes.data ?? []) as SectionChoice[],
  };
}

/**
 * The active rubric for a task's category, if there is one.
 *
 * The editor pre-selects it so the docent does not have to remember which rubric governs
 * "gebruik alle plaatjes" — and `exam_publish_issues()` blocks publication on a task with no
 * rubric, so an unset one is a trap rather than a choice.
 */
export function suggestRubric(
  rubrics: RubricChoice[],
  skill: 'schrijven' | 'spreken',
  taskType: string,
  imageUsage: string
): number | null {
  const category: RubricCategory = rubricCategory({
    task_type: taskType,
    image_usage: imageUsage as never,
  });
  const hit = rubrics.find(r => r.skill === skill && r.task_type === category && r.active);
  return hit?.id ?? null;
}
