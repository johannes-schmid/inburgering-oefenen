import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { draftContent, type AuthorAction } from '@/lib/ai/author';
import { isLevel } from '@/data/skills';

/**
 * Drafting assistance for the authoring screens. Returns text; writes nothing.
 *
 * That is the important property: this endpoint cannot change an item, cannot publish one, and
 * cannot move `review_status` to `validated`. It hands text back to a form field and the docent
 * decides. See the header of `lib/ai/author.ts` for why that line is where it is.
 *
 * Admin-only, because it spends model credits per call.
 */

const ACTIONS: AuthorAction[] = [
  'draft_question',
  'draft_explanation',
  'draft_options',
  'draft_script',
  'draft_task',
  'draft_model_answer',
  'longer',
  'shorter',
  'simpler',
];

/** Long enough for a listening script, short enough that a paste cannot run up a bill. */
const MAX_CHARS = 6000;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: { action?: unknown; text?: unknown; context?: unknown; skill?: unknown; level?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const action = ACTIONS.find(a => a === body.action);
  if (!action) return NextResponse.json({ error: 'Onbekende actie.' }, { status: 400 });

  const text = typeof body.text === 'string' ? body.text.slice(0, MAX_CHARS) : undefined;

  // Checked here as well as in draftContent, so "there is nothing to shorten" comes back as a 400
  // the drawer can show as a hint rather than a 502 that reads like the model fell over.
  if ((action === 'longer' || action === 'shorter' || action === 'simpler') && !text?.trim()) {
    return NextResponse.json({ error: 'Er is nog geen tekst om aan te passen.' }, { status: 400 });
  }

  const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CHARS) : undefined;
  const skill = typeof body.skill === 'string' ? body.skill.slice(0, 40) : undefined;
  // Validated rather than passed through: `draftContent` falls back to A2 on anything it does
  // not recognise, so a typo'd level would quietly author B1 content at A2 register.
  const level = isLevel(body.level) ? body.level : undefined;

  try {
    const result = await draftContent({ action, text, context, skill, level });
    if (!result) return NextResponse.json({ error: 'Het model gaf niets terug.' }, { status: 502 });
    return NextResponse.json({ text: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[draft-content]', action, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
