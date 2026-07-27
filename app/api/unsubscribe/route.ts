import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, jsonOk, jsonError } from '@/lib/api-constants';

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({})) as { email?: string };
  const { email } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return jsonError('Ongeldig e-mailadres', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
    .update({ status: 'failed', error_message: 'Uitgeschreven door gebruiker' })
    .eq('email', normalizedEmail)
    .eq('status', 'pending');

  if (error) {
    console.error('Unsubscribe error:', error);
    return jsonError('Uitschrijven mislukt', 500);
  }

  return jsonOk({ success: true });
}
