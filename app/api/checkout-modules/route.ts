import { NextResponse } from 'next/server';
import createMollieClient, { SequenceType, type PaymentCreateParams } from '@mollie/api-client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { euro, parseSelection, priceForSelection } from '@/lib/pricing';
import { TABLE, PAYMENT_STATUS } from '@/lib/api-constants';

/**
 * Start payment for a set of modules — **the only checkout in the product.**
 *
 * It replaced the `/activate` detour, which sold differently-priced one-off tiers through
 * `/api/mollie-checkout`. Both are gone: `/activate` now redirects here, so there is one price
 * list, one flow, and no path that takes money without establishing a mandate.
 *
 * ## The price is computed here, never accepted
 * The client posts only which modules it wants. `priceForSelection()` turns that into an amount on
 * the server. A posted total is a posted discount — and the bundle rule (all four at €29,95 rather
 * than 4 × €9,95) has to be applied somewhere the customer cannot reach.
 *
 * ## Recurring
 * The modules are sold per month, so this creates a Mollie **customer** and takes a first payment
 * with `sequenceType: 'first'`, which is what establishes the mandate. The subscription itself is
 * created after the payment is paid — a mandate does not exist before then — by
 * `fulfilModulePayment()` in `lib/mollie-modules.ts`, called from both `/api/mollie-webhook` and
 * `/api/payment-status`. A plain one-off payment would charge once and grant forever, which is not
 * what the page promises.
 *
 * Cancellation is `/api/cancel-subscription` + `lib/subscriptions.ts`, which keeps the
 * "maandelijks opzeggen" promise on the pricing page.
 */

const mollieKey = process.env.MOLLIE_API_KEY;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  if (!mollieKey) {
    return NextResponse.json(
      { error: 'Betalen is nu niet beschikbaar.', code: 'not_configured' },
      { status: 503 }
    );
  }

  let body: { modules?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const modules = parseSelection(body.modules);
  if (modules.length === 0) {
    return NextResponse.json({ error: 'Kies minstens één onderdeel.', code: 'empty' }, { status: 400 });
  }

  const amountCents = priceForSelection(modules);
  if (amountCents <= 0) {
    return NextResponse.json({ error: 'Ongeldige selectie.' }, { status: 400 });
  }

  const locale = typeof body.locale === 'string' && /^[a-z]{2}$/.test(body.locale) ? body.locale : 'nl';
  const baseUrl = process.env.BASE_URL || 'https://inburgeringoefenen.nl';
  const mollie = createMollieClient({ apiKey: mollieKey });

  try {
    // One Mollie customer per user, reused across purchases so a second module attaches to the
    // mandate the first one established rather than asking for authorisation again.
    const admin = createAdminClient();
    const { data: userRow } = await admin.auth.admin.getUserById(user.id);
    const meta = userRow?.user?.user_metadata ?? {};
    let customerId: string | undefined =
      typeof meta.mollie_customer_id === 'string' ? meta.mollie_customer_id : undefined;

    if (!customerId) {
      const customer = await mollie.customers.create({
        name: typeof meta.full_name === 'string' ? meta.full_name : (user.email ?? 'Kandidaat'),
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, mollie_customer_id: customerId },
      });
    }

    const description =
      modules.length === 4
        ? 'Inburgering Oefenen — alle vier de onderdelen'
        : `Inburgering Oefenen — ${modules.join(', ')}`;

    const params: PaymentCreateParams = {
      amount: { currency: 'EUR', value: (amountCents / 100).toFixed(2) },
      description,
      redirectUrl: `${baseUrl}/${locale}/betaling-gelukt`,
      customerId,
      // `first` is what makes Mollie store a mandate. Without it there is nothing to charge next
      // month and the subscription cannot be created.
      sequenceType: SequenceType.first,
      metadata: {
        userId: user.id,
        email: user.email,
        modules,
        amountCents,
        locale,
        kind: 'modules',
      },
    };

    const webhookBase = process.env.MOLLIE_WEBHOOK_URL;
    // Mollie rejects localhost webhooks, so a local run simply has none and the grant is applied by
    // /api/payment-status when the candidate returns.
    if (webhookBase && !webhookBase.includes('localhost')) {
      params.webhookUrl = `${webhookBase}/api/mollie-webhook`;
    }

    const payment = await mollie.payments.create(params);

    // Recorded before the candidate leaves for Mollie. `activation_email_sent` on this row is what
    // the webhook and /api/payment-status race over to claim the send slot — with no row, both
    // claims match zero rows and the activation email is never sent at all.
    const { error: insertError } = await admin.from(TABLE.PAYMENTS).insert({
      mollie_payment_id: payment.id,
      user_id: user.id,
      email: user.email,
      amount_cents: amountCents,
      status: PAYMENT_STATUS.OPEN,
      product: `modules:${modules.join(',')}`,
      locale,
    });
    if (insertError) console.error('[checkout-modules] payments insert failed:', insertError.message);

    return NextResponse.json({
      checkoutUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      amount: euro(amountCents),
      modules,
    });
  } catch (err) {
    console.error('[checkout-modules]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Betalen is nu niet gelukt.' }, { status: 502 });
  }
}
