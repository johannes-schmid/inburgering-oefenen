import { createMollieClient } from '@mollie/api-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, PAYMENT_STATUS, PRODUCTS } from '@/lib/api-constants';

// Reconcile non-final payments against Mollie and upgrade users if paid.
// Called hourly by Vercel Cron (see vercel.json). Guarded by CRON_SECRET.
export async function GET(request: Request): Promise<Response> {
  const auth = request.headers.get('authorization') ?? '';
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) return Response.json({ error: 'Payment service not configured' }, { status: 500 });

  const supabase = createAdminClient();
  const mollie = createMollieClient({ apiKey: mollieApiKey });

  // Only look at recent rows (last 7 days) to stay cheap
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error: fetchError } = await supabase
    .from(TABLE.PAYMENTS)
    .select('id, mollie_payment_id, user_id, status, product')
    .in('status', [PAYMENT_STATUS.OPEN, PAYMENT_STATUS.PENDING, PAYMENT_STATUS.AUTHORIZED])
    .gte('created_at', cutoff);

  if (fetchError) {
    console.error('[reconcile-payments] fetch error:', fetchError.message);
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  let upgraded = 0, synced = 0, errors = 0;

  for (const row of rows ?? []) {
    try {
      const payment = await mollie.payments.get(row.mollie_payment_id);
      const mollieStatus = payment.status;

      if (mollieStatus === row.status) continue;

      await supabase
        .from(TABLE.PAYMENTS)
        .update({ status: mollieStatus, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      synced++;

      if (mollieStatus === PAYMENT_STATUS.PAID) {
        const meta = payment.metadata as { userId?: string; product?: string } | undefined;
        const userId = meta?.userId || row.user_id;

        if (userId) {
          const productSlug = (meta?.product ?? row.product ?? 'premium') as keyof typeof PRODUCTS;
          const productDef = PRODUCTS[productSlug] ?? PRODUCTS.premium;
          const grantedPlan = productDef.grantsPlan;

          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          const existingMeta = userData?.user?.user_metadata ?? {};
          const finalPlan = existingMeta.plan === 'premium_plus' ? 'premium_plus' : grantedPlan;
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { ...existingMeta, premium: true, plan: finalPlan },
          });
          upgraded++;
          console.log(`[reconcile-payments] upgraded ${userId} → ${finalPlan} (${row.mollie_payment_id})`);
        }
      }
    } catch (err) {
      console.error(`[reconcile-payments] error on ${row.mollie_payment_id}:`, (err as Error)?.message);
      errors++;
    }
  }

  return Response.json({ checked: rows?.length ?? 0, upgraded, synced, errors });
}
