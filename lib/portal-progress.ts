import { createClient } from './supabase/server';
import { LEVELS, SKILLS, getFormat, type Level, type SkillSlug } from '@/data/skills';

/**
 * Per-skill progress for the study portal.
 *
 * Read from `exam_attempts`, not the `exam_results` view: the portal wants "how many of the
 * ten have I sat" and "what is my best score", and `exam_results` only exposes the *latest*
 * attempt per exam. A retake that went worse would silently lower the number on the card.
 *
 * The KNM dashboard keyed progress as `exam_${number}` with no skill dimension. With four
 * skills that is a collision, not a shortcut — Lezen 1, Luisteren 1, Schrijven 1 and Spreken 1
 * all wrote to `exam_1` and overwrote each other. Everything here is keyed by
 * (level, skill, number): adding B1 reintroduced exactly the same collision one dimension up,
 * because exam numbers restart at 1 for each level.
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

/** One level's four skills. */
export type PortalProgress = Record<SkillSlug, SkillProgress>;

/** Every level's progress. One query serves both, so the dashboard can show them together. */
export type LevelledPortalProgress = Record<Level, PortalProgress>;

function emptySkill(skill: SkillSlug): SkillProgress {
  return { skill, exams: {}, examsDone: 0, averagePct: null, nextExamNumber: 1 };
}

export function emptyPortalProgress(): PortalProgress {
  return Object.fromEntries(SKILLS.map(s => [s.slug, emptySkill(s.slug)])) as PortalProgress;
}

export function emptyLevelledProgress(): LevelledPortalProgress {
  return Object.fromEntries(
    LEVELS.map(l => [l, emptyPortalProgress()]),
  ) as LevelledPortalProgress;
}

/**
 * Returns a fully-populated record for every level and skill even on failure, so the portal
 * renders its zero state rather than throwing when the table is empty or briefly unreachable.
 *
 * Both levels come back from one round trip rather than one query per level — the row count is
 * tiny (one per sitting) and the dashboard overview wants to show A2 and B1 side by side.
 */
export async function fetchPortalProgress(userId: string): Promise<LevelledPortalProgress> {
  const out = emptyLevelledProgress();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('level, skill, exam_number, pct, passed, completed_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (error || !data) return out;

    for (const row of data) {
      // Rows written before the level column existed default to 'a2' in the database, so
      // this only guards against a value outside the domain.
      const level = out[row.level as Level];
      if (!level) continue;
      const bucket = level[row.skill as SkillSlug];
      if (!bucket) continue;

      const prev = bucket.exams[row.exam_number];
      const pct = typeof row.pct === 'number' ? row.pct : null;
      bucket.exams[row.exam_number] = {
        attempts: (prev?.attempts ?? 0) + 1,
        bestPct: prev?.bestPct == null ? pct : pct == null ? prev.bestPct : Math.max(prev.bestPct, pct),
        passed: (prev?.passed ?? false) || row.passed === true,
      };
    }

    for (const level of LEVELS) {
      for (const s of SKILLS) {
        const bucket = out[level][s.slug];
        const numbers = Object.keys(bucket.exams).map(Number);
        bucket.examsDone = numbers.length;

        // Schrijven and Spreken are rubric-graded, so a sat exam can legitimately have no
        // percentage yet. Averaging over the scored ones keeps the card honest instead of
        // reading 0% while the docent's review is outstanding.
        const scored = numbers
          .map(n => bucket.exams[n].bestPct)
          .filter((p): p is number => p != null);
        bucket.averagePct = scored.length
          ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
          : null;

        const { examCount } = getFormat(level, s.slug);
        let next = 1;
        while (next <= examCount && bucket.exams[next]) next += 1;
        bucket.nextExamNumber = next > examCount ? examCount : next;
      }
    }

    return out;
  } catch {
    return out;
  }
}

/** Which of the ten slots per (level, skill) actually have published content. */
export type PublishedExamNumbers = Record<Level, Record<SkillSlug, Set<number>>>;

export async function fetchPublishedExamNumbers(): Promise<PublishedExamNumbers> {
  const out = Object.fromEntries(
    LEVELS.map(l => [l, Object.fromEntries(SKILLS.map(s => [s.slug, new Set<number>()]))]),
  ) as PublishedExamNumbers;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exams')
      .select('level, skill, number')
      .eq('published', true);
    if (error || !data) return out;
    for (const row of data) out[row.level as Level]?.[row.skill as SkillSlug]?.add(row.number);
    return out;
  } catch {
    return out;
  }
}
