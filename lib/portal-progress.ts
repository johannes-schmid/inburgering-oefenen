import { createClient } from './supabase/server';
import { KNM, KNM_SLUG, LEVELS, SKILLS, getFormat, type Level, type SkillSlug } from '@/data/skills';

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

/**
 * Both levels plus KNM, which sits beside them rather than inside one.
 *
 * `knm` is a single `SkillProgress`, not a `PortalProgress`: KNM is one onderdeel, and a
 * record keyed by skill would be three empty buckets and a real one. Its attempts are stored
 * with `exam_attempts.level IS NULL`, which is what keeps them out of the A2 and B1 numbers.
 */
export type AllPortalProgress = LevelledPortalProgress & { knm: SkillProgress };

function emptySkill(skill: SkillSlug): SkillProgress {
  return { skill, exams: {}, examsDone: 0, averagePct: null, nextExamNumber: 1 };
}

export function emptyPortalProgress(): PortalProgress {
  return Object.fromEntries(SKILLS.map(s => [s.slug, emptySkill(s.slug)])) as PortalProgress;
}

export function emptyLevelledProgress(): AllPortalProgress {
  return {
    ...(Object.fromEntries(LEVELS.map(l => [l, emptyPortalProgress()])) as LevelledPortalProgress),
    // Cast because `SkillProgress.skill` is a `SkillSlug` and KNM is not one. Widening that
    // field to `OnderdeelSlug` would ripple through every per-level consumer to describe a
    // case none of them can reach; the one cast is contained here.
    knm: { ...emptySkill('lezen'), skill: KNM_SLUG as unknown as SkillSlug },
  };
}

/**
 * Returns a fully-populated record for every level and skill even on failure, so the portal
 * renders its zero state rather than throwing when the table is empty or briefly unreachable.
 *
 * Both levels come back from one round trip rather than one query per level — the row count is
 * tiny (one per sitting) and the dashboard overview wants to show A2 and B1 side by side.
 */
export async function fetchPortalProgress(userId: string): Promise<AllPortalProgress> {
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
      // A KNM sitting carries no level — `exam_attempts.level IS NULL` — so it is matched on
      // the skill first. Falling through to the level lookup would drop every KNM attempt
      // silently, which reads as "you have never sat one".
      let bucket: SkillProgress | undefined;
      if (row.skill === KNM_SLUG) {
        bucket = out.knm;
      } else {
        // Rows written before the level column existed default to 'a2' in the database, so
        // this only guards against a value outside the domain.
        const level = out[row.level as Level];
        if (!level) continue;
        bucket = level[row.skill as SkillSlug];
      }
      if (!bucket) continue;

      const prev = bucket.exams[row.exam_number];
      const pct = typeof row.pct === 'number' ? row.pct : null;
      bucket.exams[row.exam_number] = {
        attempts: (prev?.attempts ?? 0) + 1,
        bestPct: prev?.bestPct == null ? pct : pct == null ? prev.bestPct : Math.max(prev.bestPct, pct),
        passed: (prev?.passed ?? false) || row.passed === true,
      };
    }

    const buckets: { bucket: SkillProgress; examCount: number }[] = [
      ...LEVELS.flatMap(level =>
        SKILLS.map(s => ({ bucket: out[level][s.slug], examCount: getFormat(level, s.slug).examCount })),
      ),
      { bucket: out.knm, examCount: KNM.examCount },
    ];

    {
      for (const { bucket, examCount } of buckets) {
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
export type PublishedExamNumbers = Record<Level, Record<SkillSlug, Set<number>>> & {
  /** KNM's published slots. A flat set: KNM has no level to key on. */
  knm: Set<number>;
};

export async function fetchPublishedExamNumbers(): Promise<PublishedExamNumbers> {
  const out = {
    ...(Object.fromEntries(
      LEVELS.map(l => [l, Object.fromEntries(SKILLS.map(s => [s.slug, new Set<number>()]))]),
    ) as Record<Level, Record<SkillSlug, Set<number>>>),
    knm: new Set<number>(),
  };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exams')
      .select('level, skill, number')
      // The backlog (number 0) can never be published, but filtering here too means a future
      // relaxation of that constraint cannot put an eleventh slot on the dashboard.
      .gt('number', 0)
      .eq('published', true);
    if (error || !data) return out;
    for (const row of data) {
      if (row.skill === KNM_SLUG) out.knm.add(row.number);
      else out[row.level as Level]?.[row.skill as SkillSlug]?.add(row.number);
    }
    return out;
  } catch {
    return out;
  }
}
