import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clientIp } from '@/lib/grading-limits';
import { gradeSubmission } from '@/lib/grading/grade-submission';

/**
 * Grade one open submission against the docent's rubric.
 *
 * Called per answer, right after the candidate presses "Nakijken". Since 04-10 this route is
 * only the HTTP shell: the logic — ownership, idempotency, caps, spend controls, rubric lookup,
 * transcription, grading, persistence — lives in `lib/grading/grade-submission.ts`, where the
 * ChatGPT-app (`lib/mcp/writing.ts`) calls the same function for the same submissions. The
 * reasoning behind each step is documented there.
 *
 * Status codes are unchanged: 401 not logged in, 403 not yours, 404 missing, 409 no rubric,
 * 429 cap or cooldown, 402 paywall, 502 the model failed.
 */
export async function POST(request: Request) {
  let body: { submissionId?: number; force?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const submissionId = Number(body.submissionId);
  if (!Number.isFinite(submissionId)) {
    return NextResponse.json({ error: 'submissionId ontbreekt.' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  const outcome = await gradeSubmission({
    db: supabase,
    submissionId,
    user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
    ip: clientIp(request),
    force: Boolean(body.force),
  });

  if (outcome.ok) return NextResponse.json(outcome.result);

  const { status, ok: _ok, ...rest } = outcome;
  return NextResponse.json(rest, { status });
}
