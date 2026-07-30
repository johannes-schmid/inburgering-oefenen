'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const RECORDING_BUCKET = 'speaking-submissions';
const SIGNED_URL_TTL_SECS = 60 * 15;

/**
 * A playable URL for one Spreken recording.
 *
 * The `speaking-submissions` bucket is private and its only SELECT policy is
 * `owner = auth.uid()` — a candidate can hear their own recording and nobody else's. Rather than
 * widening that policy to every admin, the docent's inbox signs one URL at a time with the service
 * key, for the submission she has actually opened.
 *
 * A server action is a public endpoint, so the admin check is repeated here. The `(admin)` layout
 * guard protects the page, not this function.
 */
export async function signRecording(
  submissionId: number
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd.' };

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email ?? '')
    .maybeSingle();
  if (!adminRow) return { error: 'Geen beheerder.' };

  const { data: submission } = await supabase
    .from('open_submissions')
    .select('audio_url')
    .eq('id', submissionId)
    .maybeSingle();

  const path = (submission as { audio_url: string | null } | null)?.audio_url;
  if (!path) return { error: 'Deze inzending heeft geen opname.' };

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(RECORDING_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECS);

  if (error || !data) return { error: error?.message ?? 'Kon de opname niet openen.' };
  return { url: data.signedUrl };
}
