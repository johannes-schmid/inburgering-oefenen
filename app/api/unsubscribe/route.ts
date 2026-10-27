import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, jsonOk, jsonError } from '@/lib/api-constants';

/* Twee aanroepers: de pagina /uitschrijven (JSON-body) en de one-click-knop van een mailprogramma
 * (RFC 8058), die een form-body `List-Unsubscribe=One-Click` stuurt met het adres in de query. */
export async function POST(request: Request): Promise<Response> {
  const fromQuery = new URL(request.url).searchParams.get('email');
  const body: { email?: string } = fromQuery ? {} : await request.json().catch(() => ({}));
  const email = fromQuery ?? body.email;

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
