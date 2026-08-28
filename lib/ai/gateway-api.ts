/**
 * Reading spend from the Vercel AI Gateway itself, rather than from our own arithmetic.
 *
 * Two endpoints, both authenticated with the key we already grade on
 * (`AI_GATEWAY_API_KEY`, or the OIDC token on Vercel):
 *
 *  - `GET /v1/credits` → `{ balance, total_used }` in USD. This is the **budget** half of the
 *    admin panel, and it is better than a budget: a budget is an intention, a credit balance is
 *    money. There is deliberately no attempt to read the API-key *budget* — Vercel exposes no
 *    endpoint for it (docs consulted 2026-08-28), and a figure we cannot verify is not one to show.
 *  - `GET /v1/report` → aggregated spend over a date range, grouped and filterable by tag. This is
 *    the **control** figure: what Vercel says the grading calls cost, beside what we recorded.
 *
 * ## Three things that bite
 *
 * 1. **`/v1/report` is account-wide.** Custom Reporting is scoped to the whole team, so an
 *    unfiltered query includes this repo's B1 authoring runs on `anthropic/claude-opus-5` — thirty
 *    exams' worth. Every read here therefore filters on `GRADING_TAG`, which
 *    `lib/ai/grade.ts` stamps on each grading call.
 * 2. **Querying costs money**: $5 per 1,000 report queries, plus $0.075 per 1,000 tag writes. An
 *    uncached read on a dashboard someone leaves open would bill the panel for watching itself, so
 *    both calls are cached for an hour through `fetch`'s own revalidation.
 * 3. **Ingestion is asynchronous** — minutes, per the docs. A grade taken just now is in our ledger
 *    and not yet in the report. That is why `ai_usage` stays the source for the per-check averages
 *    and this is only ever shown as a comparison.
 *
 * Everything degrades to `null`. A 403 (the endpoint needs Pro), an unset key, a network failure:
 * the panel then shows our own figures without the comparison. No admin screen may fail because a
 * third party's reporting API is down.
 */

const BASE = 'https://ai-gateway.vercel.sh/v1';

/** Every gateway call made for rubric grading carries this. `/v1/report` filters on it. */
export const GRADING_TAG = 'feature:nakijken';

/** One hour. Long enough that the panel is effectively free to open; short enough to be current. */
const REVALIDATE_SECONDS = 3600;

function apiKey(): string | null {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || null;
}

export type GatewayCredits = {
  /** Remaining credit balance in USD. */
  balanceUsd: number;
  /** Lifetime spend in USD. */
  totalUsedUsd: number;
};

export async function fetchGatewayCredits(): Promise<GatewayCredits | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const res = await fetch(`${BASE}/credits`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`credits ${res.status}`);
    const json = (await res.json()) as { balance?: string | number; total_used?: string | number };
    const balance = Number(json.balance);
    const used = Number(json.total_used);
    if (!Number.isFinite(balance)) throw new Error('geen balance in het antwoord');
    return { balanceUsd: balance, totalUsedUsd: Number.isFinite(used) ? used : 0 };
  } catch (err) {
    console.warn('[gateway] credits niet leesbaar:', err instanceof Error ? err.message : err);
    return null;
  }
}

export type GatewaySpend = {
  /** Charged price in USD for the tagged calls in the window. */
  totalUsd: number;
  /** How many gateway calls that was — grading calls only, never Scribe. */
  requests: number;
};

/**
 * Spend on grading calls between two UTC dates, inclusive, as `YYYY-MM-DD`.
 *
 * Grouped by tag and filtered to `GRADING_TAG`, so an account that also runs authoring or another
 * project through the same gateway does not inflate the figure.
 */
export async function fetchGatewayGradingSpend(
  startDate: string,
  endDate: string
): Promise<GatewaySpend | null> {
  const key = apiKey();
  if (!key) return null;

  const url =
    `${BASE}/report?start_date=${startDate}&end_date=${endDate}` +
    `&group_by=tag&tags=${encodeURIComponent(GRADING_TAG)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    // 403 is the documented answer on Hobby and Pro-trial. Not an error worth shouting about: the
    // panel simply has no control figure on those plans.
    if (res.status === 403) return null;
    if (!res.ok) throw new Error(`report ${res.status}`);

    const json = (await res.json()) as {
      results?: { tag?: string; total_cost?: number; request_count?: number }[];
    };
    const rows = (json.results ?? []).filter(r => r.tag === GRADING_TAG);
    return {
      totalUsd: rows.reduce((acc, r) => acc + (Number(r.total_cost) || 0), 0),
      requests: rows.reduce((acc, r) => acc + (Number(r.request_count) || 0), 0),
    };
  } catch (err) {
    console.warn('[gateway] spend report niet leesbaar:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** `YYYY-MM-DD` in UTC, which is what both date parameters are documented to take. */
export function utcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
