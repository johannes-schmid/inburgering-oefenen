// Gamification helpers. XP is an effort metric that only increases; it is kept
// separate from the slaagkans readiness estimate. Awards are fire-and-forget:
// insert errors (including unique-violations on one-time bonuses) are swallowed
// so a failed award never breaks a quiz flow. Logged-in users only.

import type { SupabaseClient } from '@supabase/supabase-js';

export const XP_POINTS = {
  correct_answer: 5,
  first_mastery: 10,
  wordcard_known: 15,
  exam_completed: 50,
  exam_passed: 100,
  leren_complete: 100,
} as const;

export type XpSource = keyof typeof XP_POINTS;

// Cumulative XP thresholds → level (index + 1). Six levels.
export const XP_LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000];

export type XpLevel = { level: number; floor: number; next: number | null; intoLevel: number; span: number | null };

export function levelForXp(totalXp: number): XpLevel {
  let level = 1;
  for (let i = 0; i < XP_LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= XP_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const floor = XP_LEVEL_THRESHOLDS[level - 1];
  const next = level < XP_LEVEL_THRESHOLDS.length ? XP_LEVEL_THRESHOLDS[level] : null;
  return { level, floor, next, intoLevel: totalXp - floor, span: next != null ? next - floor : null };
}

export async function awardXp(
  supabase: SupabaseClient,
  userId: string | undefined | null,
  source: XpSource,
  refId?: number | null,
  points?: number
): Promise<void> {
  if (!userId) return;
  try {
    await supabase.from('user_xp_events').insert({
      user_id: userId,
      source,
      ref_id: refId ?? null,
      points: points ?? XP_POINTS[source],
    });
  } catch {
    // ignore — award is best-effort
  }
}

// A correct answer earns the repeatable +5, plus a one-time +10 first-mastery
// bonus (deduped by the DB unique index). Inserted as SEPARATE statements so a
// duplicate first_mastery cannot roll back the correct_answer row.
export function awardCorrectAnswer(supabase: SupabaseClient, userId: string | undefined | null, questionId: number): void {
  if (!userId) return;
  void awardXp(supabase, userId, 'correct_answer', questionId);
  void awardXp(supabase, userId, 'first_mastery', questionId);
}

export async function fetchTotalXp(supabase: SupabaseClient, userId: string | undefined | null): Promise<number> {
  if (!userId) return 0;
  try {
    const { data } = await supabase.from('user_xp_totals').select('total_xp').eq('user_id', userId).maybeSingle();
    return (data?.total_xp as number) ?? 0;
  } catch {
    return 0;
  }
}
