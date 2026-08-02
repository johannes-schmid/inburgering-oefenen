/**
 * Is the caller on the `admin_users` allowlist?
 *
 * The `(admin)` layout guards every admin *page*, but a route handler under `/api` has no layout
 * above it — it is reachable by anyone who knows the path. That matters most for the TTS and AI
 * routes, which spend money per call against our ElevenLabs and gateway keys.
 *
 * Reads the allowlist through the caller's own session client, not the service key: `admin_users`
 * has an RLS policy, and asking "is this user an admin" with a client that bypasses RLS is a
 * question that answers itself.
 */
import { createClient } from '@/lib/supabase/server';

export type AdminCheck =
  | { ok: true; email: string; userId: string }
  | { ok: false; status: 401 | 403; error: string };

export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, status: 401, error: 'Niet ingelogd.' };

  const { data } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle();

  if (!data) return { ok: false, status: 403, error: 'Geen beheerder.' };
  return { ok: true, email: user.email, userId: user.id };
}
