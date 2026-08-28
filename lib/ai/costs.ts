/**
 * What an AI check costs, in one place.
 *
 * Every figure a docent or the owner sees about AI spend is derived here. Two rules follow from the
 * same discipline `SEO/facts.md` sets for published numbers:
 *
 * - **A rate is a provider's published price, not a guess.** Change one only against the provider's
 *   pricing page, and change `RATES_CHECKED_ON` in the same edit. A rate invented here silently
 *   becomes the number a pricing decision is made on.
 * - **The gateway's own figure always wins.** Vercel AI Gateway returns the billed cost in
 *   `providerMetadata.gateway.cost`; these rates are the fallback for when it does not, and a row
 *   priced from them is stored `cost_estimated = true`.
 *
 * The panel reads euros because everything else this business states is in euros, and the providers
 * bill in dollars — so exactly one conversion exists, `USD_EUR`, and it is an assumption, not a
 * live rate. It is deliberately not fetched: a spend panel that changes its history when the FX
 * market moves cannot be reconciled against an invoice.
 */

/** When the rates below were last read off the providers' pricing pages. */
export const RATES_CHECKED_ON = '2026-08-28';

/** USD → EUR. An assumption, stated once. Override with `AI_USD_EUR_RATE`. */
export const USD_EUR = Number(process.env.AI_USD_EUR_RATE || '0.92');

/** Dollars per million tokens, per model id as `lib/ai/gateway.ts` names it. */
type TokenRate = { inputPerM: number; outputPerM: number };

const TOKEN_RATES: Record<string, TokenRate> = {
  // Google Gemini 2.5 Flash — $0.30 / $2.50 per million (text/audio in, text out).
  'google/gemini-2.5-flash': { inputPerM: 0.3, outputPerM: 2.5 },
  'google/gemini-2.5-flash-lite': { inputPerM: 0.1, outputPerM: 0.4 },
  'google/gemini-2.5-pro': { inputPerM: 1.25, outputPerM: 10 },
  'anthropic/claude-haiku-4.5': { inputPerM: 1, outputPerM: 5 },
  'anthropic/claude-sonnet-5': { inputPerM: 3, outputPerM: 15 },
};

/** ElevenLabs Scribe: $0.22 per hour of audio on the business tier. */
const SCRIBE_USD_PER_HOUR = 0.22;

/**
 * Estimate a model call in USD. Returns `null` for a model with no rate on file — which the caller
 * must store as 0 with `cost_estimated`, never as a made-up figure.
 */
export function estimateModelCostUsd(
  model: string,
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined
): number | null {
  const rate = TOKEN_RATES[model];
  if (!rate) return null;
  return (
    ((inputTokens ?? 0) / 1_000_000) * rate.inputPerM +
    ((outputTokens ?? 0) / 1_000_000) * rate.outputPerM
  );
}

/** Estimate one Scribe transcription in USD from the audio length. */
export function estimateTranscriptionCostUsd(seconds: number | null | undefined): number {
  return ((seconds ?? 0) / 3600) * SCRIBE_USD_PER_HOUR;
}

export function usdToEur(usd: number): number {
  return usd * USD_EUR;
}

/** `€ 1,23` — and never rounded to whole euros: a check costs cents, and cents are the story. */
export function formatEur(amount: number, digits = 2): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}
