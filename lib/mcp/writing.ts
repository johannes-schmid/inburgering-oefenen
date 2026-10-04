import { createAdminClient } from '@/lib/supabase/admin';
import { gradeSubmission } from '@/lib/grading/grade-submission';
import { MAX_CRITERION_SCORE } from '@/lib/rubrics';
import type { Level } from '@/data/skills';
import type { UserContext } from './context';
import { canOpenExam, gateFor, tierFor } from './entitlement';
import type { ToolOutcome, WritingVerdict } from './types';

/**
 * Een Schrijven-antwoord inleveren en laten nakijken — met dezelfde kern als de speler.
 *
 * De inzending wordt met de client van de kandidaat geschreven (RLS: eigen rijen), zonder
 * `attempt_id` net als een losse opdracht buiten een zitting. Daarna `gradeSubmission()`: dezelfde
 * rubriek, dezelfde plafonds (`FREE_GRADED_PER_SKILL`, het plafond per opdracht, de uurlimiet) en
 * dezelfde idempotentie als op de site. Een betaalmuur of limiet wordt een poort, geen fout.
 *
 * Wat teruggaat is bewust kleiner dan het antwoord van de route: de criteria met score en feedback,
 * het totaaloordeel en de tips. De rubriekankers blijven op de server.
 */
type TaskRow = {
  id: number;
  exam_id: number;
  skill: 'schrijven' | 'spreken';
  exams: { level: Level; number: number; published: boolean; is_free: boolean };
};

export async function submitWriting(ctx: UserContext, taskId: number, text: string, ip: string | null): Promise<ToolOutcome<WritingVerdict>> {
  const { data } = await createAdminClient()
    .from('open_tasks')
    .select('id, exam_id, skill, exams!inner(level, number, published, is_free)')
    .eq('id', taskId)
    .maybeSingle();
  const task = data as unknown as TaskRow | null;
  if (!task || !task.exams.published || task.skill !== 'schrijven') return { ok: false, gate: gateFor('unavailable', null, 'schrijven') };

  const { level } = task.exams;
  if (!canOpenExam(tierFor(ctx.meta, level, 'schrijven'), task.exams.is_free)) {
    return { ok: false, gate: gateFor('module_required', level, 'schrijven') };
  }

  const { data: inserted, error } = await ctx.db
    .from('open_submissions')
    .insert({
      user_id: ctx.userId,
      exam_id: task.exam_id,
      task_id: task.id,
      attempt_id: null,
      answer_text: text.trim(),
      answer_json: null,
      status: 'submitted',
    })
    .select('id')
    .single();
  if (error || !inserted) return { ok: false, gate: gateFor('unavailable', level, 'schrijven') };

  const outcome = await gradeSubmission({
    db: ctx.db,
    submissionId: (inserted as { id: number }).id,
    user: { id: ctx.userId, email: ctx.email, user_metadata: ctx.meta },
    ip,
  });

  if (!outcome.ok) {
    if (outcome.status === 402 || outcome.status === 429) return { ok: false, gate: gateFor('grading_limit', level, 'schrijven') };
    return { ok: false, gate: gateFor('unavailable', level, 'schrijven') };
  }

  const r = outcome.result;
  const names = new Map((r.rubric?.criteria ?? []).map(c => [c.key, c.criterion]));
  return {
    ok: true,
    data: {
      taskId: task.id,
      status: r.status === 'teacher_reviewed' ? 'teacher_reviewed' : 'ai_graded',
      overall: r.overall,
      tips: r.tips,
      criteria: r.criteria.map(c => ({
        key: names.get(c.criterion_key) ?? c.criterion_key,
        score: c.score,
        maxScore: MAX_CRITERION_SCORE,
        feedback: c.feedback,
      })),
    },
  };
}
