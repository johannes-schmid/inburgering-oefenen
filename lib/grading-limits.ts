/**
 * What a candidate is allowed to have graded, and how often.
 *
 * Grading is the only part of this product with a per-use cost — a Flash-tier model call, plus an
 * ElevenLabs Scribe call for Spreken. So there are two independent questions, and conflating them
 * is how you end up either billing yourself into a hole or blocking a paying customer:
 *
 *   1. **Entitlement** — has this person used up their free exercises? Counted from
 *      `open_submissions`, the durable record. A paid module has no limit.
 *   2. **Rate** — is this actor going faster than any human would? A sliding window over
 *      `grade_rate_log`, per user *and* per IP. Applies to everyone, including paying users,
 *      because a compromised or scripted paid account is still a bill.
 *
 * Server-only: every function here needs the service key to see other users' rows.
 */
import { createAdminClient } from './supabase/admin';
import { ownsModule } from './entitlements';
import type { Level } from '@/data/skills';

/** Free graded exercises per rubric skill, before the paywall. */
export const FREE_GRADED_PER_SKILL = 10;

/**
 * Sliding-window ceilings. Generous against real use — a candidate working through a 16-task
 * Spreken exam legitimately grades 16 times in an hour — and tight against a loop.
 */
export const RATE_LIMITS = {
  perUserPerHour: 30,
  perUserPerDay: 80,
  /**
   * Looser, because an IP is a building as often as a person: carrier NAT, a school, a library. A
   * false block here turns away a real candidate, so this is a backstop against one machine
   * cycling accounts, not a per-person limit.
   */
  perIpPerHour: 80,
} as const;

type Meta = Parameters<typeof ownsModule>[0];

export type LimitVerdict =
  | { allowed: true }
  | {
      allowed: false;
      /** `paywall` means "pay to continue"; `rate` means "come back later". Different UI. */
      reason: 'paywall' | 'rate';
      code: string;
      message: string;
      /** Only for paywall: how many free exercises this skill allows. */
      freeLimit?: number;
    };

/**
 * Whether this account has paid access to the module the task belongs to.
 *
 * **Never a bare plan check.** Since per-module pricing there is no `plan` on a subscriber's
 * metadata — a customer who bought `a2:schrijven` reads as `plan: 'free'` — so a plan check
 * counted a paying customer's exercises against the free tier and paywalled them after ten.
 * `ownsModule` covers both shapes: the per-module list and the legacy all-access grant.
 */
export function coversSkill(meta: Meta, level: Level, skill: 'schrijven' | 'spreken'): boolean {
  return ownsModule(meta, level, skill);
}

/**
 * The single decision point in front of a paid grading call.
 *
 * Order matters: entitlement before rate. A free user who has used their two exercises should be
 * told to upgrade, not told to wait an hour — the second is both wrong and reads as a bug.
 */
export async function checkGradingAllowed({
  userId,
  ip,
  skill,
  level,
  meta,
}: {
  userId: string;
  ip: string | null;
  skill: 'schrijven' | 'spreken';
  /** The level of the exam the task belongs to — part of the module's identity. */
  level: Level;
  /** `user.user_metadata`, read through `ownsModule`. */
  meta: Meta;
}): Promise<LimitVerdict> {
  const admin = createAdminClient();

  if (!coversSkill(meta, level, skill)) {
    const { data, error } = await admin.rpc('graded_exercise_count', {
      p_user_id: userId,
      p_skill: skill,
    });
    // Fail closed on an error here. Failing open means an unbounded free tier the moment this query
    // breaks, and the whole point of this module is that mistakes cost money.
    if (error) {
      return {
        allowed: false,
        reason: 'rate',
        code: 'limit_check_failed',
        message: 'We konden je tegoed niet controleren. Probeer het over een moment opnieuw.',
      };
    }
    const used = typeof data === 'number' ? data : 0;
    if (used >= FREE_GRADED_PER_SKILL) {
      return {
        allowed: false,
        reason: 'paywall',
        code: 'free_limit_reached',
        freeLimit: FREE_GRADED_PER_SKILL,
        message:
          `Je hebt je ${FREE_GRADED_PER_SKILL} gratis nagekeken opdrachten voor dit onderdeel ` +
          `gebruikt. Ontgrendel dit onderdeel om verder te oefenen.`,
      };
    }
  }

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [userHour, userDay] = await Promise.all([
    admin
      .from('grade_rate_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', hourAgo),
    admin
      .from('grade_rate_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dayAgo),
  ]);

  if ((userHour.count ?? 0) >= RATE_LIMITS.perUserPerHour) {
    return {
      allowed: false,
      reason: 'rate',
      code: 'rate_user_hour',
      message: 'Je hebt veel opdrachten achter elkaar laten nakijken. Probeer het over een uur weer.',
    };
  }
  if ((userDay.count ?? 0) >= RATE_LIMITS.perUserPerDay) {
    return {
      allowed: false,
      reason: 'rate',
      code: 'rate_user_day',
      message: 'Je hebt vandaag veel opdrachten laten nakijken. Probeer het morgen weer.',
    };
  }

  if (ip) {
    const { count } = await admin
      .from('grade_rate_log')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', hourAgo);
    if ((count ?? 0) >= RATE_LIMITS.perIpPerHour) {
      return {
        allowed: false,
        reason: 'rate',
        code: 'rate_ip_hour',
        message: 'Er zijn vanaf dit netwerk veel opdrachten nagekeken. Probeer het later opnieuw.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Record that a grade was attempted. Called even when grading then fails — the provider was still
 * called and may still have billed us, so the window has to count the attempt, not the success.
 */
export async function logGradeAttempt(
  userId: string,
  ip: string | null,
  skill: 'schrijven' | 'spreken'
): Promise<void> {
  try {
    await createAdminClient().from('grade_rate_log').insert({ user_id: userId, ip, skill });
  } catch {
    // Never fail a grade because the ledger insert failed; the durable caps still hold.
  }
}

/**
 * The caller's IP, from the proxy headers Vercel sets.
 *
 * `x-forwarded-for` is a client-controlled list, so only the **first** entry is meaningful and even
 * that is spoofable in principle — Vercel appends the real peer, so the last entry is the trustworthy
 * one. We take the last, which is why this is a backstop rather than an identity.
 */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return request.headers.get('x-real-ip') ?? null;
}
