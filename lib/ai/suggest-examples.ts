/**
 * The few-shot material for "magisch invullen": the docent's own existing items.
 *
 * Server-only — it reads through the caller's session client, so the `(admin)` RLS policies are
 * what decide it may see this content. Asking "what does our material look like" with the service
 * key would work and would also mean an endpoint that reads exam content on nobody's authority.
 *
 * Two deliberate choices:
 *
 * - **Validated rows first.** A `pending` row is a draft; imitating one teaches the model the
 *   docent's mistakes rather than her house style. Validated is preferred and `pending` is only
 *   used to top up, because on a nearly-empty (level, skill) the alternative is no examples at all.
 * - **Level-scoped, always.** `questions` has no `skill` column and `stimuli` has no `level`, so
 *   both are filtered through `exams`. Feeding an A2 fragment in while suggesting B1 is the same
 *   cross-level contamination `lib/ai/level-register.ts` exists to prevent, and it fails just as
 *   quietly: the suggestion comes back plausible and one level off.
 */
import { createClient } from '@/lib/supabase/server';
import type { Level } from '@/data/skills';

/** How many fragments to show. Enough to establish a register, few enough to stay cheap. */
const EXAMPLE_LIMIT = 4;

/** Prompts are one line each, so more of them fit — this is the anti-duplication list. */
const PROMPT_LIMIT = 30;

/** Keeps one runaway `body_html` from dominating the context window. */
const MAX_EXAMPLE_CHARS = 1200;

export type SuggestExamples = {
  /** Rendered fragments, ready to paste into a prompt. */
  items: string[];
  /** Existing vraagzinnen at this (level, skill), so a suggestion is a new one. */
  existingPrompts: string[];
};

type StimulusRow = {
  intro: string | null;
  title: string | null;
  body_html: string | null;
  script: string | null;
  kind: string;
  review_status: string;
};

function render(s: StimulusRow): string {
  const body = [
    s.intro ? `Inleiding: ${s.intro}` : '',
    s.title ? `Titel: ${s.title}` : '',
    s.script?.trim() ? `Script:\n${s.script.trim()}` : '',
    s.body_html?.trim() ? `Tekst:\n${s.body_html.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return body.slice(0, MAX_EXAMPLE_CHARS);
}

/**
 * Collect few-shot material for one (level, skill).
 *
 * Never throws: an empty result is a valid state — on a fresh (level, skill) there is nothing to
 * imitate yet, and `suggest.ts` prompts differently rather than failing. A suggestion is worth more
 * to the docent on exactly that empty screen than anywhere else.
 */
export async function fetchSuggestExamples(
  level: Level,
  skill: string,
  kind?: string
): Promise<SuggestExamples> {
  const supabase = await createClient();

  let query = supabase
    .from('stimuli')
    .select('intro, title, body_html, script, kind, review_status, exams!inner(level)')
    .eq('skill', skill)
    .eq('exams.level', level)
    // Newest first: the docent's style is whatever she is writing now, not what she wrote in
    // exam 1 six months ago.
    .order('id', { ascending: false })
    .limit(EXAMPLE_LIMIT * 3);

  if (kind) query = query.eq('kind', kind);

  const [stimuli, prompts] = await Promise.all([
    query,
    supabase
      .from('questions')
      .select('prompt, exams!inner(level, skill)')
      .eq('exams.skill', skill)
      .eq('exams.level', level)
      .order('id', { ascending: false })
      .limit(PROMPT_LIMIT),
  ]);

  const rows = (stimuli.data ?? []) as unknown as StimulusRow[];
  const validated = rows.filter(r => r.review_status === 'validated');
  const pending = rows.filter(r => r.review_status !== 'validated');

  return {
    items: [...validated, ...pending].slice(0, EXAMPLE_LIMIT).map(render).filter(Boolean),
    existingPrompts: ((prompts.data ?? []) as unknown as { prompt: string }[])
      .map(p => p.prompt)
      .filter(Boolean),
  };
}

/** The fragment a question is being written for, rendered the way the prompt wants it. */
export async function fetchStimulusText(stimulusId: number): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stimuli')
    .select('intro, title, body_html, script, kind, review_status')
    .eq('id', stimulusId)
    .maybeSingle();

  if (!data) return null;
  const text = render(data as unknown as StimulusRow);
  return text || null;
}
