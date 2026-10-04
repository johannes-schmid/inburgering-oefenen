import { createAdminClient } from '@/lib/supabase/admin';
import type { Level, OnderdeelSlug } from '@/data/skills';
import type { McpContext } from './context';
import type { Tier } from './types';

/**
 * Eén rij per gebeurtenis in `mcp_events`. Nooit wachten op de insert in het pad van de tool, en
 * nooit iets loggen dat een kandidaat heeft geschreven of een token dat hij heeft meegestuurd.
 */
export type McpEventName =
  | 'chatgpt_tool_called'
  | 'chatgpt_exercise_started'
  | 'chatgpt_answer_submitted'
  | 'chatgpt_exercise_completed'
  | 'chatgpt_account_connected'
  | 'chatgpt_premium_gate_shown'
  | 'chatgpt_tool_failed';

export function logEvent(
  event: McpEventName,
  ctx: McpContext,
  fields: {
    tool?: string;
    tier?: Tier;
    level?: Level | null;
    onderdeel?: OnderdeelSlug;
    props?: Record<string, string | number | boolean | null>;
  } = {},
): void {
  const row = {
    event,
    tool: fields.tool ?? null,
    tier: fields.tier ?? (ctx.kind === 'user' ? 'connected' : 'anonymous'),
    user_id: ctx.kind === 'user' ? ctx.userId : null,
    subject_hash: ctx.kind === 'anonymous' ? ctx.subjectHash : null,
    onderdeel: fields.onderdeel ?? null,
    level: fields.level ?? null,
    props: fields.props ?? {},
  };
  void createAdminClient()
    .from('mcp_events')
    .insert(row)
    .then(({ error }) => {
      if (error) console.warn('[mcp] event not logged:', error.message);
    });
}
