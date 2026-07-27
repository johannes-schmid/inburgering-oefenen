import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, PAYMENT_STATUS } from '@/lib/api-constants';
import { jsonOk, jsonError } from '@/lib/api-constants';
import { abandonEmail, abandonSubject } from '@/lib/email/templates/abandon';
import { type EmailLocale } from '@/lib/email/i18n';

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({})) as {
    email?: string; locale?: string; firstName?: string;
  };

  const { email, locale = 'nl', firstName = '' } = body;
  if (!email || !email.includes('@')) return jsonError('Invalid email', 400);

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createAdminClient();

  // Skip if they already paid
  const { data: paid } = await supabase
    .from(TABLE.PAYMENTS)
    .select('id')
    .eq('email', normalizedEmail)
    .eq('status', PAYMENT_STATUS.PAID)
    .maybeSingle();

  if (paid) return jsonOk({ skipped: true });

  // Skip if an abandon email was already scheduled for this email
  const { data: existing } = await supabase
    .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
    .select('id')
    .eq('email', normalizedEmail)
    .eq('campaign_type', 'abandon')
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return jsonOk({ skipped: true });

  const emailLocale = (['nl', 'en', 'ar'].includes(locale) ? locale as EmailLocale : 'nl');
  const unsubscribeUrl = `https://inburgeringoefenen.nl/uitschrijven?email=${encodeURIComponent(normalizedEmail)}`;
  const scheduledAt = new Date(Date.now() + 60 * 60 * 1000); // +1h

  // Insert row FIRST — the unique index on (email, campaign_type) is the dedup mutex.
  // If two concurrent requests race past the check above, only one insert wins (23505 = skip).
  const { error: insertError } = await supabase.from(TABLE.EMAIL_CAMPAIGN_QUEUE).insert({
    email: normalizedEmail,
    campaign_type: 'abandon',
    scheduled_for: scheduledAt.toISOString(),
    payload: { locale: emailLocale, firstName },
  });

  if (insertError) {
    if (insertError.code === '23505') return jsonOk({ skipped: true });
    console.error('[track-activate-visit] insert error:', insertError.message);
    return jsonOk({ queued: false });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = 'Inburgering Oefenen <support@inburgeringoefenen.nl>';

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: normalizedEmail,
      subject: abandonSubject(emailLocale),
      html: abandonEmail(firstName, emailLocale, unsubscribeUrl),
      scheduledAt: scheduledAt.toISOString(),
    });
    // Store the Resend ID so mollie-webhook can cancel on payment
    if (data?.id) {
      await supabase.from(TABLE.EMAIL_CAMPAIGN_QUEUE)
        .update({ payload: { locale: emailLocale, firstName, resend_email_id: data.id } })
        .eq('email', normalizedEmail)
        .eq('campaign_type', 'abandon');
    }
  } catch (err) {
    console.error('[track-activate-visit] resend.emails.send failed:', (err as Error)?.message);
    // Row is already inserted — don't retry send, but don't delete either (avoids re-queuing on next visit)
  }

  return jsonOk({ queued: true });
}
