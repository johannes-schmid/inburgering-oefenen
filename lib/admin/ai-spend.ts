import { createAdminClient } from '@/lib/supabase/admin';
import { usdToEur } from '@/lib/ai/costs';
import {
  fetchGatewayCredits,
  fetchGatewayGradingSpend,
  utcDate,
} from '@/lib/ai/gateway-api';
import { fetchAll } from '@/lib/admin/fetch-all';

/**
 * AI spend for the current month, as the admin dashboard states it.
 *
 * Two questions, and they are different: **what has this month cost against the budget**, and
 * **what does one nakijkactie cost** — the second is the one that decides whether the model in
 * `lib/ai/gateway.ts` needs changing.
 *
 * A Spreken check is two provider calls (Scribe + the grading model) sharing one `request_id`, so
 * the average is taken over distinct request ids, never over rows. Averaging rows would report
 * Spreken at half its real cost, on the panel whose whole job is comparing the two.
 *
 * Rows go through `fetchAll` because PostgREST silently caps a plain `select()` at 1,000 — the trap
 * that made `/admin/exams` under-report items, and a spend total that quietly stops growing past
 * a thousand calls is the same failure with money attached.
 *
 * ## Where each figure comes from
 * The **budget** is the Gateway's own credit balance (`GET /v1/credits`) — money, not an intention,
 * and the reason there is no `AI_MONTHLY_BUDGET_EUR` any more. The **control figure** is the
 * Gateway's tagged spend report for this month; it is shown beside our own total so a drift between
 * the two is visible instead of being discovered on an invoice. Neither replaces `ai_usage`, for two
 * reasons that will not go away: Scribe is not on the gateway at all (≈15% of a Spreken check), and
 * the gateway has no notion of a *nakijkactie* — it counts calls, and Spreken is two of them.
 *
 * Both gateway reads degrade to `null` and the panel then simply omits them.
 */

export type SkillSpend = {
  /** `schrijven` | `spreken` */
  skill: string;
  /** Distinct nakijkacties this month. */
  checks: number;
  totalEur: number;
  avgEur: number;
};

export type AiSpend = {
  monthLabel: string;
  /** Month-to-date, from our own ledger — the only source that includes Scribe. */
  spentEur: number;
  calls: number;
  /** Any part of the total that is our arithmetic rather than a billed figure. */
  estimatedEur: number;
  perSkill: SkillSpend[];
  /** Gateway credits: what is actually left to spend. `null` when unreadable. */
  creditsLeftEur: number | null;
  /** Lifetime gateway spend, which is what the balance is a remainder of. */
  creditsUsedEur: number | null;
  /** The gateway's own figure for this month's tagged grading calls. `null` when unreadable. */
  gatewaySpentEur: number | null;
  gatewayCalls: number | null;
};

type Row = {
  kind: string;
  skill: string | null;
  request_id: string;
  cost_usd: number | string;
  cost_estimated: boolean;
};

/** The onderdelen with a rubric-graded, AI-checked answer. KNM and the MCQ skills cost nothing. */
const GRADED_SKILLS = ['schrijven', 'spreken'];

export async function fetchAiSpend(now = new Date()): Promise<AiSpend> {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const supabase = createAdminClient();
  const rows = await fetchAll<Row>((from, to) =>
    supabase
      .from('ai_usage')
      .select('kind, skill, request_id, cost_usd, cost_estimated')
      .gte('created_at', monthStart.toISOString())
      .range(from, to)
  );

  const usd = (r: Row) => Number(r.cost_usd) || 0;
  const spentUsd = rows.reduce((acc, r) => acc + usd(r), 0);
  const estimatedUsd = rows.filter(r => r.cost_estimated).reduce((acc, r) => acc + usd(r), 0);

  const perSkill = GRADED_SKILLS.map(skill => {
    const mine = rows.filter(r => r.skill === skill);
    const requests = new Set(mine.map(r => r.request_id));
    const totalEur = usdToEur(mine.reduce((acc, r) => acc + usd(r), 0));
    const checks = requests.size;
    return { skill, checks, totalEur, avgEur: checks > 0 ? totalEur / checks : 0 };
  });

  const [credits, gateway] = await Promise.all([
    fetchGatewayCredits(),
    fetchGatewayGradingSpend(utcDate(monthStart), utcDate(now)),
  ]);

  const spentEur = usdToEur(spentUsd);

  return {
    monthLabel: new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(monthStart),
    spentEur,
    calls: rows.length,
    estimatedEur: usdToEur(estimatedUsd),
    perSkill,
    creditsLeftEur: credits ? usdToEur(credits.balanceUsd) : null,
    creditsUsedEur: credits ? usdToEur(credits.totalUsedUsd) : null,
    gatewaySpentEur: gateway ? usdToEur(gateway.totalUsd) : null,
    gatewayCalls: gateway ? gateway.requests : null,
  };
}
