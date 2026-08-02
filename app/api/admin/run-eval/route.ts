import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { gradeOpenAnswer, type FewShotExample, type GradeTask } from '@/lib/ai/grade';
import { MAX_CRITERION_SCORE, type Rubric } from '@/lib/rubrics';

/**
 * Re-grade the held-out examples with the current rubric and few-shot set, and report how far the
 * model lands from the docent.
 *
 * The passive metrics on /admin/beoordeling/evals measure agreement on submissions the docent
 * happened to review — useful, but they only move when she reviews something, and they mix rubric
 * versions. This is the **active** pass: same inputs every time, so a rubric edit or a new few-shot
 * example can be judged by whether this number improves.
 *
 * ## The train/test split is the whole point
 * `grading_examples.use_as_fewshot = true` teaches the grader; `false` measures it. This route
 * grades **only the `false` rows**, and `fetchFewShot` in /api/grade-open only ever reads the
 * `true` rows. Promoting a held-back example to few-shot inflates the next run without the model
 * having improved — which is why the response reports the split sizes, so a jump in the score next
 * to a jump in `trainSize` is legible rather than mysterious.
 *
 * ## Cost
 * One model call per held-out example, admin-only, capped, and it writes nothing to
 * `open_criterion_scores` — an eval grade is not a candidate's grade and must never appear in
 * anyone's progress.
 */

const MAX_EXAMPLES = 40;
const FEW_SHOT_LIMIT = 6;

type ExampleRow = {
  id: number;
  skill: 'schrijven' | 'spreken';
  task_type: string;
  task_id: number | null;
  answer_text: string | null;
  transcript: string | null;
  teacher_result: unknown;
  notes: string | null;
};

/** `{ criteria: [{ key, score }] }` in whatever shape the inbox stored. */
function teacherScores(result: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const criteria = (result as { criteria?: unknown })?.criteria;
  if (Array.isArray(criteria)) {
    for (const c of criteria) {
      const key = (c as { criterion_key?: string; key?: string })?.criterion_key ?? (c as { key?: string })?.key;
      const score = (c as { score?: unknown })?.score;
      if (typeof key === 'string' && typeof score === 'number') out.set(key, score);
    }
  }
  return out;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: { skill?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const skill = body.skill === 'spreken' ? 'spreken' : body.skill === 'schrijven' ? 'schrijven' : null;
  if (!skill) return NextResponse.json({ error: 'Kies schrijven of spreken.' }, { status: 400 });

  const db = createAdminClient();

  const { data: heldOut, error: heldErr } = await db
    .from('grading_examples')
    .select('id, skill, task_type, task_id, answer_text, transcript, teacher_result, notes')
    .eq('skill', skill)
    .eq('use_as_fewshot', false)
    .order('created_at', { ascending: true })
    .limit(MAX_EXAMPLES);

  if (heldErr) return NextResponse.json({ error: heldErr.message }, { status: 500 });

  const testSet = (heldOut ?? []) as ExampleRow[];
  if (testSet.length === 0) {
    return NextResponse.json({
      error:
        'Geen testset. Markeer een paar beoordeelde voorbeelden als "niet als voorbeeld gebruiken" — ' +
        'die zijn de meetlat.',
      code: 'no_test_set',
    }, { status: 400 });
  }

  const { count: trainSize } = await db
    .from('grading_examples')
    .select('id', { count: 'exact', head: true })
    .eq('skill', skill)
    .eq('use_as_fewshot', true);

  const perCriterion = new Map<string, { n: number; absSum: number; biasSum: number; exact: number; within1: number }>();
  let compared = 0;
  const failures: { id: number; error: string }[] = [];

  for (const ex of testSet) {
    const expected = teacherScores(ex.teacher_result);
    if (expected.size === 0) {
      failures.push({ id: ex.id, error: 'Geen docentscores in dit voorbeeld.' });
      continue;
    }

    const { data: rubricRow } = await db
      .from('rubrics')
      .select('*')
      .eq('skill', skill)
      .eq('task_type', ex.task_type)
      .eq('active', true)
      .maybeSingle();
    if (!rubricRow) {
      failures.push({ id: ex.id, error: `Geen actieve rubriek voor ${ex.task_type}.` });
      continue;
    }

    const { data: taskRow } = ex.task_id
      ? await db
          .from('open_tasks')
          .select('*, images:open_task_images(sort_order, caption, alt_text, group_label)')
          .eq('id', ex.task_id)
          .maybeSingle()
      : { data: null };
    if (!taskRow) {
      failures.push({ id: ex.id, error: 'De opgave bij dit voorbeeld bestaat niet meer.' });
      continue;
    }

    const { data: shots } = await db
      .from('grading_examples')
      .select('answer_text, transcript, teacher_result, notes')
      .eq('skill', skill)
      .eq('task_type', ex.task_type)
      .eq('use_as_fewshot', true)
      .order('created_at', { ascending: false })
      .limit(FEW_SHOT_LIMIT);

    try {
      const result = await gradeOpenAnswer({
        rubric: rubricRow as unknown as Rubric,
        task: taskRow as unknown as GradeTask,
        answer: {
          answer_text: ex.answer_text,
          answer_json: null,
          transcript: ex.transcript,
          audio_seconds: null,
          speech_signals: null,
          // The stored example keeps text only, so Spreken is evaluated from its transcript here
          // even though live grading also hears the recording. Reported below so the number is
          // not mistaken for a measurement of the audio-native path.
          audio: null,
        },
        examples: (shots ?? []) as unknown as FewShotExample[],
      });

      for (const c of result.criteria) {
        const want = expected.get(c.key);
        if (typeof want !== 'number') continue;
        const diff = c.score - want;
        const agg = perCriterion.get(c.key) ?? { n: 0, absSum: 0, biasSum: 0, exact: 0, within1: 0 };
        agg.n += 1;
        agg.absSum += Math.abs(diff);
        agg.biasSum += diff;
        if (diff === 0) agg.exact += 1;
        if (Math.abs(diff) <= 1) agg.within1 += 1;
        perCriterion.set(c.key, agg);
        compared += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[run-eval]', ex.id, message);
      failures.push({ id: ex.id, error: message });
    }
  }

  const criteria = [...perCriterion.entries()]
    .map(([key, a]) => ({
      key,
      n: a.n,
      exactPct: Math.round((100 * a.exact) / a.n),
      within1Pct: Math.round((100 * a.within1) / a.n),
      // Signed, not absolute: "0.6 milder dan jij op grammatica" is actionable in a way that
      // "71% overeenkomst" is not. Positive = the model scores higher than the docent.
      bias: Math.round((a.biasSum / a.n) * 100) / 100,
      meanAbsError: Math.round((a.absSum / a.n) * 100) / 100,
    }))
    // Worst first — the criterion to fix is the one furthest off.
    .sort((a, b) => b.meanAbsError - a.meanAbsError);

  return NextResponse.json({
    skill,
    testSize: testSet.length,
    trainSize: trainSize ?? 0,
    compared,
    maxScore: MAX_CRITERION_SCORE,
    criteria,
    failures,
    audioEvaluated: false,
  });
}
