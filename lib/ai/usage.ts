import { createAdminClient } from '@/lib/supabase/admin';
import {
  estimateModelCostUsd,
  estimateTranscriptionCostUsd,
} from './costs';

/**
 * Recording what a paid AI call cost — server-only, service key, and never fatal.
 *
 * One row per provider call in `ai_usage`. A Spreken check is two rows (Scribe + the grading model)
 * sharing one `request_id`, which is what lets the panel say "gemiddeld per nakijkactie" rather than
 * "per API-call" — the two differ by a factor of two for exactly one onderdeel, so averaging calls
 * would make Spreken look cheaper than Schrijven while costing more.
 *
 * **A failure here is swallowed.** The candidate's feedback has already been produced and paid for;
 * losing a bookkeeping row is cheaper than losing the grade. It is logged so a systematic failure is
 * visible in the function logs.
 */

export type AiCallUsage = {
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  /** The billed cost in USD, when the provider reported one. */
  costUsd?: number | null;
};

export type RecordUsageInput = {
  kind: 'grade_text' | 'grade_audio' | 'transcribe';
  provider: string;
  model: string;
  requestId: string;
  skill?: string | null;
  level?: string | null;
  submissionId?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  audioSeconds?: number | null;
  /** The provider's own billed figure, if it gave one. Present ⇒ the row is not an estimate. */
  billedUsd?: number | null;
  /** The gateway's id for the call, so a row can be reconciled against Vercel. */
  generationId?: string | null;
  ok?: boolean;
  error?: string | null;
};

export async function recordAiUsage(input: RecordUsageInput): Promise<void> {
  const billed = typeof input.billedUsd === 'number' && input.billedUsd > 0 ? input.billedUsd : null;

  const estimated =
    input.kind === 'transcribe'
      ? estimateTranscriptionCostUsd(input.audioSeconds)
      : estimateModelCostUsd(input.model, input.inputTokens, input.outputTokens);

  const costUsd = billed ?? estimated ?? 0;

  try {
    const { error } = await createAdminClient()
      .from('ai_usage')
      .insert({
        kind: input.kind,
        provider: input.provider,
        model: input.model,
        request_id: input.requestId,
        skill: input.skill ?? null,
        level: input.level ?? null,
        submission_id: input.submissionId ?? null,
        generation_id: input.generationId ?? null,
        input_tokens: input.inputTokens ?? null,
        output_tokens: input.outputTokens ?? null,
        audio_seconds: input.audioSeconds ?? null,
        cost_usd: costUsd,
        cost_estimated: billed === null,
        ok: input.ok ?? true,
        error: input.error ?? null,
      });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.warn('[ai-usage] kon gebruik niet vastleggen:', err instanceof Error ? err.message : err);
  }
}

/** The provider half of a `'provider/model'` gateway id. */
export function providerOf(model: string): string {
  const [provider] = model.split('/');
  return provider || 'unknown';
}
