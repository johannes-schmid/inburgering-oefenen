import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cancelAllSubscriptions, listLiveSubscriptions } from '@/lib/subscriptions';
import { modulesFromMetadata } from '@/lib/entitlements';
import { cancellationEmail, cancellationSubject } from '@/lib/email/templates/cancellation';
import { type EmailLocale } from '@/lib/email/i18n';

/**
 * Self-service cancellation.
 *
 * The pricing page promises "Je kunt maandelijks opzeggen". Under the Dutch implementation of the
 * consumer directive (Wet Van Der Meer) an online subscription has to be cancellable as easily as it
 * was taken out — so this is one authenticated POST from the account page, with no e-mail, no phone
 * call and no retention interstitial. Do not add one.
 *
 * ## What cancelling does and does not do
 * It cancels every live Mollie subscription for this customer, so no further money is taken. It does
 * **not** revoke access on the spot: the current period is paid for, and `modules_until` carries the
 * date the next charge would have fallen. `modulesFromMetadata()` reads that date, so access lapses
 * by arithmetic rather than by a scheduled job.
 *
 * ## Why the metadata write happens even on a partial failure
 * If Mollie cancelled three of four subscriptions we still record the cancellation and return the
 * failure to the caller, because the alternative — reporting total failure — would tell a candidate
 * that nothing was cancelled when three things were.
 */

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: userRow } = await admin.auth.admin.getUserById(user.id);
  const meta = userRow?.user?.user_metadata ?? {};
  const customerId = typeof meta.mollie_customer_id === 'string' ? meta.mollie_customer_id : null;

  if (!customerId) {
    return NextResponse.json(
      { error: 'Er staat geen abonnement open op dit account.', code: 'no_customer' },
      { status: 400 }
    );
  }

  const live = await listLiveSubscriptions(customerId);
  if (live.length === 0) {
    return NextResponse.json(
      { error: 'Er staat geen actief abonnement open.', code: 'no_subscription' },
      { status: 400 }
    );
  }

  const { cancelled, failed, accessUntil } = await cancelAllSubscriptions(customerId);

  if (cancelled.length > 0) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        subscription_canceled_at: new Date().toISOString(),
        // No next payment date (Mollie omits it once a subscription will not charge again) means we
        // cannot tell when the paid period ends. Keeping access is the only defensible default —
        // guessing a date could cut someone off inside a month they paid for.
        ...(accessUntil ? { modules_until: accessUntil } : {}),
      },
    });

    await sendCancellationEmail({
      email: user.email,
      firstName: typeof meta.full_name === 'string' ? meta.full_name.split(' ')[0] : '',
      locale: emailLocale(meta.locale),
      accessUntil,
      modules: modulesFromMetadata(meta),
    });
  }

  if (failed.length > 0) {
    return NextResponse.json(
      {
        error:
          'Niet alles kon worden opgezegd. Neem contact met ons op, dan regelen wij het — je betaalt niets extra.',
        cancelled: cancelled.length,
        failed: failed.length,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ cancelled: cancelled.length, accessUntil });
}

function emailLocale(raw: unknown): EmailLocale {
  return raw === 'en' || raw === 'ar' ? raw : 'nl';
}

/**
 * Confirmation of the cancellation.
 *
 * Never throws: the subscription is already cancelled and the metadata already written by the time
 * this runs, so a Resend outage must not turn a successful cancellation into an error the candidate
 * sees — they would click again and be told there is nothing to cancel. Logged loudly instead.
 */
async function sendCancellationEmail({
  email,
  firstName,
  locale,
  accessUntil,
  modules,
}: {
  email?: string;
  firstName: string;
  locale: EmailLocale;
  accessUntil: string | null;
  modules: string[];
}): Promise<void> {
  if (!email || !process.env.RESEND_API_KEY) return;
  try {
    const baseUrl = process.env.BASE_URL || 'https://inburgeringoefenen.nl';
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Inburgering Oefenen <support@inburgeringoefenen.nl>',
      to: email,
      subject: cancellationSubject(locale),
      html: cancellationEmail(
        { firstName, accessUntil, modules, accountUrl: `${baseUrl}/${locale}/dashboard/profiel` },
        locale
      ),
    });
  } catch (err) {
    console.error('[cancel-subscription] confirmation email failed:', email, (err as Error)?.message);
  }
}
