/**
 * Fulfilment for a module purchase — grant the modules, then make the payment recur.
 *
 * Called from **two** places on purpose: `/api/mollie-webhook` (Mollie's notification) and
 * `/api/payment-status` (the candidate returning to `/betaling-gelukt`). Whichever arrives first
 * does the work. Locally there is no webhook at all — Mollie refuses localhost URLs — so without
 * the second caller a module purchase would grant access and never create a subscription, i.e.
 * silently behave as a one-off. That is exactly the bug this file exists to prevent.
 *
 * Every step is idempotent:
 *  - the metadata grant merges and re-writes the same set,
 *  - the subscription is created only when the customer has none that is still live, and never
 *    from a payment Mollie itself generated from a subscription (`payment.subscriptionId`), which
 *    would compound a new subscription every month.
 *
 * Server-only: uses the Mollie API key and the Supabase service role.
 */
import type createMollieClient from '@mollie/api-client';
import type { Payment } from '@mollie/api-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseSelection } from '@/lib/pricing';
import { modulesFromMetadata } from '@/lib/entitlements';
import { listLiveSubscriptions } from '@/lib/subscriptions';

/** The client object `createMollieClient()` returns — the package exports no name for it. */
type MollieClient = ReturnType<typeof createMollieClient>;

export type ModulePaymentMetadata = {
  userId?: string;
  modules?: unknown;
  locale?: string;
  kind?: string;
};

export function isModulePayment(meta: unknown): boolean {
  return !!meta && typeof meta === 'object' && (meta as ModulePaymentMetadata).kind === 'modules';
}

export type FulfilResult = {
  /** Which modules the account owns after this purchase. */
  modules: string[];
  /** The plan the activation email should describe. */
  plan: 'premium' | 'premium_plus';
  /** True when this call is what created the subscription. */
  subscriptionCreated: boolean;
};

export async function fulfilModulePayment(
  mollie: MollieClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  payment: Payment
): Promise<FulfilResult> {
  const meta = (payment.metadata ?? {}) as ModulePaymentMetadata;
  const userId = meta.userId as string;

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const existingMeta = userData?.user?.user_metadata ?? {};

  // Grant exactly what was bought, merged with what the account already had: buying Spreken must
  // not revoke a Lezen bought last month.
  const bought = parseSelection(meta.modules);
  const owned = [...new Set([...modulesFromMetadata(existingMeta), ...bought])];
  const plan: 'premium' | 'premium_plus' =
    owned.some(m => m === 'schrijven' || m === 'spreken') ? 'premium_plus' : 'premium';

  // `modules_until` and `subscription_canceled_at` are cleared: a fresh purchase means this account
  // is subscribed again, and a leftover expiry from a previous cancellation would lock the
  // candidate out of modules they have just paid for. Set to null rather than omitted — GoTrue
  // *merges* user_metadata, so a key left out of the update survives.
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMeta,
      modules: owned,
      modules_until: null,
      subscription_canceled_at: null,
    },
  });

  const subscriptionCreated = await ensureSubscription(mollie, payment, userId, owned);
  return { modules: owned, plan, subscriptionCreated };
}

/**
 * Create the monthly subscription against the mandate this payment established — unless one is
 * already running.
 *
 * Three guards, each protecting against a real double charge:
 *  - `payment.subscriptionId` is set on every renewal Mollie generates *from* a subscription, and
 *    those renewals carry the same `kind: 'modules'` metadata. Without this, month two would create
 *    a second subscription and month three a third.
 *  - a live subscription already on the customer means webhook and poll both got here, or the
 *    candidate bought a second module; either way one subscription per customer is the contract,
 *    and it is re-created at the new total below.
 *  - no customer id means no mandate, so there is nothing to charge next month.
 */
async function ensureSubscription(
  mollie: MollieClient,
  payment: Payment,
  userId: string,
  owned: string[]
): Promise<boolean> {
  if (!payment.customerId || payment.subscriptionId) return false;

  try {
    const live = await listLiveSubscriptions(payment.customerId);

    // Buying a second module changes the monthly amount. Mollie subscriptions are immutable in
    // amount for our purposes here, so the old one is cancelled and replaced rather than left
    // charging the old total alongside a new one.
    const alreadyAtThisAmount = live.some(s => s.amountCents === Math.round(parseFloat(payment.amount.value) * 100));
    if (alreadyAtThisAmount) return false;

    for (const sub of live) {
      try {
        await mollie.customerSubscriptions.cancel(sub.id, { customerId: payment.customerId });
      } catch (err) {
        // Leaving the old one running would double-charge, so this is loud — but we still create
        // the new one, because the alternative is a candidate who has paid and does not recur.
        console.error('[mollie-modules] replacing subscription: cancel failed', sub.id, err);
      }
    }

    await mollie.customerSubscriptions.create({
      customerId: payment.customerId,
      amount: payment.amount,
      interval: '1 month',
      description: `Inburgering Oefenen — ${owned.join(', ')} (${userId.slice(0, 8)})`,
      webhookUrl: payment.webhookUrl ?? undefined,
      metadata: { userId, modules: owned, kind: 'modules' },
    });
    return true;
  } catch (err) {
    // The candidate has paid and has access; a failed subscription only means it will not renew.
    // Loud in the log rather than a failed webhook, which Mollie would retry and which would
    // re-grant repeatedly.
    console.error('[mollie-modules] subscription create failed', userId, err instanceof Error ? err.message : err);
    return false;
  }
}
