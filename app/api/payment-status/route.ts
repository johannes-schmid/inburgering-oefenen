import { createMollieClient } from '@mollie/api-client';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, PAYMENT_STATUS, PRODUCTS, jsonOk, jsonError } from '@/lib/api-constants';
import { activationEmail, activationSubject } from '@/lib/email/templates/activation';
import { upgradeEmail, upgradeSubject } from '@/lib/email/templates/upgrade';
import { type EmailLocale } from '@/lib/email/i18n';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('id');
  if (!paymentId) return jsonError('Missing payment id', 400);

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) return jsonError('Payment service not configured', 500);

  try {
    const mollie = createMollieClient({ apiKey: mollieApiKey });
    const payment = await mollie.payments.get(paymentId);
    const supabase = createAdminClient();

    if (payment.status === PAYMENT_STATUS.PAID) {
      const meta = payment.metadata as { userId?: string; product?: string; locale?: string; pricingVariant?: string } | undefined;
      const userId = meta?.userId;
      const locale: EmailLocale = (['nl', 'en', 'ar'].includes(meta?.locale ?? '') ? meta!.locale as EmailLocale : 'nl');
      let grantedPlan = 'premium';
      if (userId) {
        const productDef = PRODUCTS[(meta?.product as keyof typeof PRODUCTS) ?? 'premium'] ?? PRODUCTS.premium;
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const existingMeta = userData?.user?.user_metadata ?? {};
        grantedPlan = existingMeta.plan === 'premium_plus' ? 'premium_plus' : productDef.grantsPlan;
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { ...existingMeta, premium: true, plan: grantedPlan },
        });

        const email = userData?.user?.email;
        if (email) {
          const normalizedEmail = email.toLowerCase().trim();
          const resend = new Resend(process.env.RESEND_API_KEY);

          // Cancel any scheduled Resend abandon email. The webhook does this too, but
          // this runs on the guaranteed (polled) path in case the webhook never fires.
          const { data: abandonRow } = await supabase
            .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
            .select('payload')
            .eq('email', normalizedEmail)
            .eq('campaign_type', 'abandon')
            .eq('status', 'pending')
            .maybeSingle();

          const resendEmailId = (abandonRow?.payload as Record<string, string> | null)?.resend_email_id;
          if (resendEmailId) {
            try {
              await resend.emails.cancel(resendEmailId);
            } catch (err) {
              console.error('[payment-status] resend.emails.cancel failed:', (err as Error)?.message);
            }
          }

          await supabase
            .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
            .delete()
            .eq('email', normalizedEmail)
            .eq('status', 'pending');

          const firstName = userData?.user?.user_metadata?.full_name?.split(' ')[0] || '';
          const baseUrl = process.env.BASE_URL || 'https://inburgeringoefenen.nl';
          const FROM = 'Inburgering Oefenen <support@inburgeringoefenen.nl>';
          const isUpgrade = meta?.product === 'upgrade_to_plus';

          // Claim the send slot — only one path (webhook vs payment-status poll) will get rows back
          const { data: claimRows } = await supabase
            .from(TABLE.PAYMENTS)
            .update({ activation_email_sent: true })
            .eq('mollie_payment_id', paymentId)
            .eq('activation_email_sent', false)
            .select('id');
          const shouldSendEmail = (claimRows?.length ?? 0) > 0;

          if (shouldSendEmail) {
            try {
              if (isUpgrade) {
                await resend.emails.send({
                  from: FROM,
                  to: email,
                  subject: upgradeSubject(locale),
                  html: upgradeEmail({ firstName, dashboardUrl: `${baseUrl}/dashboard` }, locale),
                });
              } else {
                await resend.emails.send({
                  from: FROM,
                  to: email,
                  subject: activationSubject(grantedPlan, locale),
                  html: activationEmail({ firstName, loginUrl: `${baseUrl}/login`, plan: grantedPlan }, locale),
                });
              }
            } catch (err) {
              console.error('[payment-status] activation email failed:', paymentId, (err as Error)?.message);
            }
          }
        }
      }
      await supabase
        .from(TABLE.PAYMENTS)
        .update({ status: PAYMENT_STATUS.PAID, updated_at: new Date().toISOString() })
        .eq('mollie_payment_id', paymentId);

      return jsonOk({ status: PAYMENT_STATUS.PAID, plan: grantedPlan, amount: Number(payment.amount.value), variant: meta?.pricingVariant ?? 'control' });
    }

    if ([PAYMENT_STATUS.CANCELED, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.EXPIRED].includes(
      payment.status as typeof PAYMENT_STATUS.CANCELED
    )) {
      await supabase
        .from(TABLE.PAYMENTS)
        .update({ status: payment.status, updated_at: new Date().toISOString() })
        .eq('mollie_payment_id', paymentId);
      return jsonOk({ status: 'failed' });
    }

    return jsonOk({ status: 'pending' });
  } catch (err) {
    console.error('[payment-status] error:', err);
    return jsonError('Status ophalen mislukt', 500);
  }
}
