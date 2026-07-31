/**
 * Reading and cancelling the candidate's Mollie subscriptions.
 *
 * **Mollie is the source of truth, not `user_metadata`.** Subscription ids are deliberately not
 * mirrored into the user record: a cached id that Mollie has since suspended, completed or cancelled
 * would show the candidate an "active" subscription that no longer exists, or — worse — hide one
 * that is still charging them. The customer id is the only thing we store, and everything else is
 * looked up live.
 *
 * Server-only: this uses the Mollie API key.
 */
import createMollieClient, { SubscriptionStatus } from '@mollie/api-client';

export type SubscriptionSummary = {
  id: string;
  /** `active` and `pending` both mean "will charge"; `pending` is waiting on a valid mandate. */
  status: string;
  amountCents: number;
  interval: string;
  /** `YYYY-MM-DD`, absent once the subscription will not charge again. */
  nextPaymentDate?: string;
  description: string;
};

/** A subscription in one of these states will still take money and is therefore cancellable. */
const LIVE_STATUSES: string[] = [SubscriptionStatus.active, SubscriptionStatus.pending, SubscriptionStatus.suspended];

function client() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return null;
  return createMollieClient({ apiKey });
}

function toCents(value: string): number {
  return Math.round(parseFloat(value) * 100);
}

/**
 * Every subscription that can still charge this customer.
 *
 * Returns `[]` rather than throwing when Mollie is unreachable or unconfigured — this is called
 * while rendering the account page, and a payment-provider outage should not take that page down.
 * The consequence is that the cancel button disappears during an outage, which is the safe way
 * round: it fails to *offer* an action rather than falsely reporting the subscription as gone.
 */
export async function listLiveSubscriptions(customerId: string): Promise<SubscriptionSummary[]> {
  const mollie = client();
  if (!mollie) return [];
  try {
    const page = await mollie.customerSubscriptions.page({ customerId, limit: 50 });
    return page
      .filter(s => LIVE_STATUSES.includes(s.status))
      .map(s => ({
        id: s.id,
        status: s.status,
        amountCents: toCents(s.amount.value),
        interval: s.interval,
        nextPaymentDate: s.nextPaymentDate,
        description: s.description,
      }));
  } catch (err) {
    console.error('[subscriptions] list failed', customerId, err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Cancel every live subscription for this customer, and report when their access should end.
 *
 * The candidate has already paid for the current period, so cancelling does **not** revoke access
 * immediately — `accessUntil` is the latest `nextPaymentDate` across the cancelled subscriptions,
 * i.e. the day the next charge would have fallen. Taking access away the moment someone cancels
 * would be keeping money for a month they cannot use.
 *
 * Cancelling is idempotent from the caller's side: a subscription Mollie has already cancelled is
 * simply not in the list.
 */
export async function cancelAllSubscriptions(
  customerId: string
): Promise<{ cancelled: string[]; failed: string[]; accessUntil: string | null }> {
  const mollie = client();
  if (!mollie) return { cancelled: [], failed: [], accessUntil: null };

  const live = await listLiveSubscriptions(customerId);
  const cancelled: string[] = [];
  const failed: string[] = [];
  let accessUntil: string | null = null;

  for (const sub of live) {
    if (sub.nextPaymentDate && (!accessUntil || sub.nextPaymentDate > accessUntil)) {
      accessUntil = sub.nextPaymentDate;
    }
    try {
      await mollie.customerSubscriptions.cancel(sub.id, { customerId });
      cancelled.push(sub.id);
    } catch (err) {
      // Reported to the caller rather than swallowed: a subscription we failed to cancel is one
      // that will charge the candidate again, and they must be told to contact support.
      console.error('[subscriptions] cancel failed', sub.id, err instanceof Error ? err.message : err);
      failed.push(sub.id);
    }
  }

  return { cancelled, failed, accessUntil };
}
