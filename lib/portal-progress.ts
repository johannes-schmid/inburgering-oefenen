import { createClient } from './supabase/server';
import { SKILLS, type SkillSlug } from '@/data/skills';

/**
 * Per-skill progress for the study portal.
 *
 * Read from `exam_attempts`, not the `exam_results` view: the portal wants "how many of the
 * ten have I sat" and "what is my best score", and `exam_results` only exposes the *latest*
 * attempt per exam. A retake that went worse would silently lower the number on the card.
 *
 * The KNM dashboard keyed progress as `exam_${number}` with no skill dimension. With four
 * skills that is a collision, not a shortcut — Lezen 1, Luisteren 1, Schrijven 1 and Spreken 1
 * all wrote to `exam_1` and overwrote each other. Everything here is keyed by (skill, number).
 */

export type ExamProgress = {
  /** Attempts finished for this exam number. 0 means never sat. */
  attempts: number;
  /** Best percentage across attempts, or null when nothing is scored yet. */
  bestPct: number | null;
  /** True when any attempt passed. */
  passed: boolean;
};

export type SkillProgress = {
  skill: SkillSlug;
  /** exam number (1..examCount) → progress. Absent means never sat. */
  exams: Record<number, ExamProgress>;
  /** Distinct exam numbers with at least one completed attempt. */
  examsDone: number;
  /** Average of the best score per sat exam, or null when nothing is scored. */
  averagePct: number | null;
  /** Lowest-numbered exam not yet sat — what the "continue" CTA points at. */
  nextExamNumber: number;
};

export type PortalProgress = Record<SkillSlug, SkillProgress>;

function emptySkill(skill: SkillSlug): SkillProgress {
  return { skill, exams: {}, examsDone: 0, averagePct: null, nextExamNumber: 1 };
}

export function emptyPortalProgress(): PortalProgress {
  return Object.fromEntries(SKILLS.map(s => [s.slug, emptySkill(s.slug)])) as PortalProgress;
}

/**
 * Returns a fully-populated record for all four skills even on failure, so the portal renders
 * its zero state rather than throwing when the table is empty or briefly unreachable.
 */
export async function fetchPortalProgress(userId: string): Promise<PortalProgress> {
  const out = emptyPortalProgress();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('skill, exam_number, pct, passed, completed_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (error || !data) return out;

    for (const row of data) {
      const bucket = out[row.skill as SkillSlug];
      if (!bucket) continue;

      const prev = bucket.exams[row.exam_number];
      const pct = typeof row.pct === 'number' ? row.pct : null;
      bucket.exams[row.exam_number] = {
        attempts: (prev?.attempts ?? 0) + 1,
        bestPct: prev?.bestPct == null ? pct : pct == null ? prev.bestPct : Math.max(prev.bestPct, pct),
        passed: (prev?.passed ?? false) || row.passed === true,
      };
    }

    for (const s of SKILLS) {
      const bucket = out[s.slug];
      const numbers = Object.keys(bucket.exams).map(Number);
      bucket.examsDone = numbers.length;

      // Schrijven and Spreken are rubric-graded, so a sat exam can legitimately have no
      // percentage yet. Averaging over the scored ones keeps the card honest instead of
      // reading 0% while the docent's review is outstanding.
      const scored = numbers.map(n => bucket.exams[n].bestPct).filter((p): p is number => p != null);
      bucket.averagePct = scored.length
        ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
        : null;

      let next = 1;
      while (next <= s.examCount && bucket.exams[next]) next += 1;
      bucket.nextExamNumber = next > s.examCount ? s.examCount : next;
    }

    return out;
  } catch {
    return out;
  }
}

/** Which of the ten slots per skill actually have published content. */
export async function fetchPublishedExamNumbers(): Promise<Record<SkillSlug, Set<number>>> {
  const out = Object.fromEntries(SKILLS.map(s => [s.slug, new Set<number>()])) as Record<
    SkillSlug,
    Set<number>
  >;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exams')
      .select('skill, number')
      .eq('published', true);
    if (error || !data) return out;
    for (const row of data) out[row.skill as SkillSlug]?.add(row.number);
    return out;
  } catch {
    return out;
  }
}
