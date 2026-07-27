import { createMollieClient } from '@mollie/api-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, PAYMENT_STATUS, PRODUCTS, ProductSlug, jsonOk, jsonError } from '@/lib/api-constants';

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const { userId, email, product, locale, ab_variant } = body as { userId?: string; email?: string; product?: string; locale?: string; ab_variant?: string };

  if (!userId || !email) return jsonError('userId and email are required', 400);

  const productSlug: ProductSlug = (product as ProductSlug) || 'premium';
  const productDef = PRODUCTS[productSlug];
  if (!productDef) return jsonError('Unknown product', 400);

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) return jsonError('Payment service not configured', 500);

  const baseUrl = process.env.BASE_URL || 'https://inburgeringoefenen.nl';
  const rawWebhookUrl = (process.env.MOLLIE_WEBHOOK_URL || '').trim();
  // Ensure the URL points to the handler endpoint, not just the base domain
  let webhookBase = rawWebhookUrl;
  if (webhookBase && !webhookBase.includes('/api/mollie-webhook')) {
    webhookBase = webhookBase.replace(/\/$/, '') + '/api/mollie-webhook';
  }

  const supabase = createAdminClient();

  if (productSlug === 'upgrade_to_plus') {
    try {
      const { data: userRes } = await supabase.auth.admin.getUserById(userId);
      const meta = userRes?.user?.user_metadata ?? {};
      const currentPlan = meta.plan || (meta.premium ? 'premium' : 'free');
      if (currentPlan !== 'premium') {
        return jsonError('Upgrade only available for Professioneel users', 400);
      }
    } catch {
      return jsonError('Kon huidig pakket niet verifiëren', 500);
    }
  }

  try {
    const mollie = createMollieClient({ apiKey: mollieApiKey });

    const paymentParams: Parameters<typeof mollie.payments.create>[0] = {
      amount: { currency: 'EUR', value: productDef.priceLabel },
      description: productDef.description,
      redirectUrl: `${baseUrl}/betaling-gelukt`,
      metadata: { userId, email, product: productSlug, locale: locale || 'nl', ab_variant: ab_variant || 'control' },
    };

    if (webhookBase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (paymentParams as any).webhookUrl = webhookBase;
    }

    const payment = await mollie.payments.create(paymentParams);

    const { error: insertError } = await supabase.from(TABLE.PAYMENTS).insert({
      mollie_payment_id: payment.id,
      user_id: userId,
      email,
      amount_cents: productDef.priceCents,
      status: PAYMENT_STATUS.OPEN,
      product: productSlug,
      locale: locale || 'nl',
    });
    if (insertError) console.error('[mollie-checkout] payments insert failed:', insertError.message);

    const checkoutUrl = payment._links?.checkout?.href;

    return jsonOk({ checkoutUrl, paymentId: payment.id });
  } catch (err) {
    console.error('[mollie-checkout] error:', err);
    return jsonError('Betaling aanmaken mislukt. Probeer het opnieuw.', 500);
  }
}
