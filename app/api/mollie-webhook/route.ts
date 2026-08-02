import { createMollieClient } from '@mollie/api-client';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { fulfilModulePayment, isModulePayment } from '@/lib/mollie-modules';
import { TABLE, PAYMENT_STATUS, PRODUCTS } from '@/lib/api-constants';
import { activationEmail, activationSubject } from '@/lib/email/templates/activation';
import { upgradeEmail, upgradeSubject } from '@/lib/email/templates/upgrade';
import { feedbackEmail, feedbackSubject } from '@/lib/email/templates/feedback';
import { type EmailLocale } from '@/lib/email/i18n';

export async function POST(request: Request): Promise<Response> {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const paymentId = params.get('id');
  if (!paymentId) return Response.json({ error: 'Missing payment id' }, { status: 400 });

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) return Response.json({ error: 'Payment service not configured' }, { status: 500 });

  try {
    const mollie = createMollieClient({ apiKey: mollieApiKey });
    const payment = await mollie.payments.get(paymentId);
    const supabase = createAdminClient();

    await supabase
      .from(TABLE.PAYMENTS)
      .update({ status: payment.status, updated_at: new Date().toISOString() })
      .eq('mollie_payment_id', paymentId);

    if (payment.status === PAYMENT_STATUS.PAID) {
      const meta = payment.metadata as {
        userId?: string;
        product?: string;
        locale?: string;
        pricingVariant?: string;
        ab_variant?: string;
        /** Set by /api/checkout-modules — a per-module subscription rather than a one-off tier. */
        kind?: string;
        modules?: unknown;
      } | undefined;
      const userId = meta?.userId;
      const locale: EmailLocale = (['nl', 'en', 'ar'].includes(meta?.locale ?? '') ? meta!.locale as EmailLocale : 'nl');

      if (userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const existingMeta = userData?.user?.user_metadata ?? {};

        // The activation email distinguishes only "full access" from "exams only". A module purchase
        // is neither tier, and Schrijven or Spreken include rubric feedback — which is what
        // premium_plus meant — so a module buyer gets the fuller email.
        let finalPlan: 'premium' | 'premium_plus' = 'premium';

        if (isModulePayment(meta)) {
          // ── Per-module subscription ──────────────────────────────────────────────────────────
          // Grant + subscription both live in lib/mollie-modules.ts, because /api/payment-status
          // has to do exactly the same thing when the webhook does not fire.
          const result = await fulfilModulePayment(mollie, supabase, payment);
          finalPlan = result.plan;
        } else {
          const productDef = PRODUCTS[(meta?.product as keyof typeof PRODUCTS) ?? 'premium'] ?? PRODUCTS.premium;
          const grantedPlan = productDef.grantsPlan;
          finalPlan = existingMeta.plan === 'premium_plus' ? 'premium_plus' : grantedPlan;
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { ...existingMeta, premium: true, plan: finalPlan },
          });
        }

        const email = userData?.user?.email;
        if (email) {
          const normalizedEmail = email.toLowerCase().trim();
          const resend = new Resend(process.env.RESEND_API_KEY);

          // Cancel any scheduled Resend abandon email before deleting queue rows
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
              console.error('[mollie-webhook] resend.emails.cancel failed:', (err as Error)?.message);
            }
          }

          await supabase
            .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
            .delete()
            .eq('email', normalizedEmail)
            .eq('status', 'pending');

          const firstName = userData?.user?.user_metadata?.full_name?.split(' ')[0] || '';
          const baseUrl = process.env.BASE_URL || 'https://inburgeringoefenen.nl';
          const loginUrl = `${baseUrl}/login`;
          const segmentId = process.env.RESEND_PREMIUM_SEGMENT_ID;
          const FROM = 'Inburgering Oefenen <support@inburgeringoefenen.nl>';
          const isUpgrade = meta?.product === 'upgrade_to_plus';

          if (segmentId) {
            try {
              await resend.contacts.create({
                audienceId: segmentId,
                email,
                ...(firstName ? { firstName } : {}),
                unsubscribed: false,
              });
            } catch (err) {
              console.error('[mollie-webhook] resend.contacts.create failed:', paymentId, (err as Error)?.message);
            }
          }

          // Claim the send slot — only one path (webhook vs payment-status poll) will get rows back
          const { data: claimRows } = await supabase
            .from(TABLE.PAYMENTS)
            .update({ activation_email_sent: true })
            .eq('mollie_payment_id', paymentId)
            .eq('activation_email_sent', false)
            .select('id');
          const shouldSendEmail = (claimRows?.length ?? 0) > 0;

          if (shouldSendEmail && isUpgrade) {
            try {
              await resend.emails.send({
                from: FROM,
                to: email,
                subject: upgradeSubject(locale),
                html: upgradeEmail({ firstName, dashboardUrl: `${baseUrl}/dashboard` }, locale),
              });
            } catch (err) {
              console.error('[mollie-webhook] upgrade email failed:', paymentId, (err as Error)?.message);
            }
          } else if (shouldSendEmail) {
            try {
              await resend.emails.send({
                from: FROM,
                to: email,
                subject: activationSubject(finalPlan, locale),
                html: activationEmail({ firstName, loginUrl, plan: finalPlan }, locale),
              });
            } catch (err) {
              console.error('[mollie-webhook] activation email failed:', paymentId, (err as Error)?.message);
            }

            try {
              const sendAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
              await resend.emails.send({
                from: FROM,
                to: email,
                subject: feedbackSubject(locale),
                html: feedbackEmail({ firstName }, locale),
                scheduledAt: sendAt,
                headers: { 'X-Idempotency-Key': `feedback-${paymentId}` },
              });
            } catch (err) {
              console.error('[mollie-webhook] feedback email failed:', paymentId, (err as Error)?.message);
            }
          }
        }
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('[mollie-webhook] error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
