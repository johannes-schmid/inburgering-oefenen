/**
 * Fulfilment for module payments — grant the modules, then keep the one subscription in step.
 *
 * Called from **three** places on purpose: `/api/mollie-webhook` (Mollie's notification),
 * `/api/payment-status` (the candidate returning to `/betaling-gelukt`) and
 * `/api/reconcile-payments` (the hourly cron). Whichever arrives first does the work. Locally there
 * is no webhook at all — Mollie refuses localhost URLs — so without the second caller a module
 * purchase would grant access and never create a subscription.
 *
 * ## One subscription, and its amount follows the modules (co-terming, 08-11)
 * Every customer has **one** Mollie subscription with one renewal date. Its amount is always
 * `priceForSelection(renewingModules(meta))` with the customer's discount applied — never the amount
 * of the last payment. Copying the payment amount was the bug that let a customer who bought a
 * second module keep paying for one: the add-on payment was €9,95, the subscription already stood
 * at €9,95, so nothing changed.
 *
 * When the modules change, the subscription is **PATCHed**, not cancelled and re-created: Mollie
 * lets you change the amount of future payments, and the renewal date stays where it was — which is
 * the whole point of co-terming.
 *
 * Two payment kinds:
 *  - `modules` — the first payment through the checkout, and every renewal Mollie generates from
 *    the subscription (those carry the subscription's metadata, and `payment.subscriptionId`).
 *  - `modules_change` — the pro-rated charge for a mid-period change, from `lib/billing/change.ts`.
 *
 * Server-only: uses the Mollie API key and the Supabase service role.
 */
import type createMollieClient from '@mollie/api-client';
import type { Payment } from '@mollie/api-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseSelection } from '@/lib/pricing';
import { monthlyAmountCents } from '@/lib/billing/amount';
import { parseModuleId, renewingModules, type ModuleId } from '@/lib/entitlements';
import { listLiveSubscriptions } from '@/lib/subscriptions';
import { applyChange, grantPurchase, grantRenewal, revertGrant } from '@/lib/billing/metadata';
import { TABLE } from '@/lib/api-constants';
import { sendModuleChangeEmail } from '@/lib/email/send-module-change';
import { moduleLabel } from '@/lib/email/templates/cancellation';

/** The client object `createMollieClient()` returns — the package exports no name for it. */
type MollieClient = ReturnType<typeof createMollieClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, any, any>;

export type ModulePaymentMetadata = {
  userId?: string;
  modules?: unknown;
  locale?: string;
  kind?: string;
  /** De kortingscode van de eerste betaling; de incasso erna draagt hem mee. */
  discountCode?: string | null;
};

/** Metadata van de tussentijdse incasso voor een wijziging. */
export type ModuleChangeMetadata = {
  kind: 'modules_change';
  userId: string;
  add: string[];
  remove: string[];
  /** Wat met deze betaling openging en deze periode nog niet betaald was. */
  newlyGranted: string[];
  periodEnd: string;
  /**
   * `true` bij een incasso op het mandaat: de modules gingen al open toen de incasso werd
   * aangemaakt (besluit eigenaar) en gaan dicht als hij mislukt. `false` bij een betaling via de
   * checkout: dan gaat er pas iets open als Mollie `paid` meldt.
   */
  appliedAtCreate: boolean;
  discountCode: string | null;
  locale: string;
};

export function isModulePayment(meta: unknown): boolean {
  return !!meta && typeof meta === 'object' && (meta as ModulePaymentMetadata).kind === 'modules';
}

export function isModuleChangePayment(meta: unknown): meta is ModuleChangeMetadata {
  return !!meta && typeof meta === 'object' && (meta as ModuleChangeMetadata).kind === 'modules_change';
}

export type FulfilResult = {
  /** Which modules the account owns after this purchase. */
  modules: string[];
  /** The plan the activation email should describe. */
  plan: 'premium' | 'premium_plus';
  /** True when this call is what created the subscription. */
  subscriptionCreated: boolean;
};

/** De rubriek-onderdelen zijn de oude Compleet-tier; de activatiemail kiest daarop zijn tekst. */
function planFor(modules: string[]): 'premium' | 'premium_plus' {
  return modules.some(m => {
    const skill = parseModuleId(m)?.skill;
    return skill === 'schrijven' || skill === 'spreken';
  })
    ? 'premium_plus'
    : 'premium';
}

async function readMeta(supabase: AdminClient, userId: string): Promise<Record<string, unknown>> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
}

async function writeMeta(supabase: AdminClient, userId: string, meta: Record<string, unknown>) {
  await supabase.auth.admin.updateUserById(userId, { user_metadata: meta });
}

export async function fulfilModulePayment(
  mollie: MollieClient,
  supabase: AdminClient,
  payment: Payment
): Promise<FulfilResult> {
  const meta = (payment.metadata ?? {}) as ModulePaymentMetadata;
  const userId = meta.userId as string;
  const existing = await readMeta(supabase, userId);
  const bought = parseSelection(meta.modules);

  // A renewal Mollie generated from the subscription. It confirms access and never touches the
  // subscription: changing it from here would compound with every monthly payment.
  if (payment.subscriptionId) {
    const next = { ...existing, ...grantRenewal(existing, bought) };
    await writeMeta(supabase, userId, next);
    return { modules: next.modules, plan: planFor(next.modules), subscriptionCreated: false };
  }

  // Een eerste betaling wordt precies één keer toegekend. `/betaling-gelukt` blijft
  // `/api/payment-status` pollen zolang het tabblad openstaat, en de webhook en de cron komen er
  // ook langs; elke herhaling wiste de einddatums die een latere wijziging had gezet en trok het
  // abonnement terug op wat er bij de aankoop in zat. Daarna wordt alleen nog gecontroleerd dat er
  // een abonnement bestaat — voor het geval de eerste keer halverwege faalde.
  const done = Array.isArray(existing.fulfilled_payments) ? (existing.fulfilled_payments as string[]) : [];
  if (done.includes(payment.id)) {
    const live = payment.customerId ? await listLiveSubscriptions(payment.customerId) : [];
    const created = payment.customerId && live.length === 0
      ? await syncSubscription(mollie, {
          customerId: payment.customerId,
          userId,
          renewing: renewingModules(existing as never),
          discountCode: meta.discountCode ?? undefined,
          webhookUrl: payment.webhookUrl ?? undefined,
          idempotencyKey: `sub-${payment.id}`,
        })
      : false;
    const owned = (existing.modules as string[] | undefined) ?? [];
    return { modules: owned, plan: planFor(owned), subscriptionCreated: created };
  }

  const next = {
    ...existing,
    ...grantPurchase(existing, bought),
    fulfilled_payments: [...done, payment.id].slice(-20),
  };
  await writeMeta(supabase, userId, next);

  const subscriptionCreated = payment.customerId
    ? await syncSubscription(mollie, {
        customerId: payment.customerId,
        userId,
        renewing: renewingModules(next as never),
        discountCode: meta.discountCode ?? undefined,
        webhookUrl: payment.webhookUrl ?? undefined,
        idempotencyKey: `sub-${payment.id}`,
      })
    : false;

  return { modules: next.modules, plan: planFor(next.modules), subscriptionCreated };
}

/**
 * Today + one month as `YYYY-MM-DD`, clamped to the end of a shorter month (31 Jan -> 28 Feb) so a
 * subscription started on the 31st never rolls into the following month.
 */
function oneMonthFromToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const d = Math.min(now.getDate(), lastDay);
  const next = new Date(Date.UTC(y, m, d));
  return next.toISOString().slice(0, 10);
}

/** Staat op het bankafschrift bij elke incasso: leesbare namen, geen interne ids. */
function subscriptionDescription(renewing: string[]): string {
  return `Inburgering Oefenen — ${renewing.map(moduleLabel).join(', ')}`;
}

/**
 * Bring the customer's one subscription in line with what renews.
 *
 *  - nothing renews → every live subscription is cancelled;
 *  - a live subscription exists → PATCH amount, description and metadata (and the mandate, when a
 *    checkout just created a fresh one). The renewal date does not move;
 *  - none exists → create one, starting a month out. Without `startDate` Mollie collects today, on
 *    top of the payment that just paid for this month — every customer was once charged twice.
 *
 * More than one live subscription is the state the old cancel-and-recreate could leave behind when
 * a cancel failed. The first is kept and the rest are cancelled: each of them is charging.
 *
 * `discountCode: undefined` keeps the code that is already on the live subscription; `null` clears
 * it. Returns true when a subscription was created.
 */
export async function syncSubscription(
  mollie: MollieClient,
  opts: {
    customerId: string;
    userId: string;
    renewing: ModuleId[];
    discountCode?: string | null;
    webhookUrl?: string;
    mandateId?: string;
    idempotencyKey?: string;
    /** Alleen bij aanmaken: de eerste incassodatum. Standaard een maand na vandaag. */
    startDate?: string;
  }
): Promise<boolean> {
  const { customerId, userId, renewing } = opts;
  try {
    const live = await listLiveSubscriptions(customerId);

    if (renewing.length === 0) {
      for (const sub of live) await mollie.customerSubscriptions.cancel(sub.id, { customerId });
      return false;
    }

    const discountCode = opts.discountCode === undefined ? (live[0]?.discountCode ?? null) : opts.discountCode;
    const amountCents = monthlyAmountCents(renewing, discountCode);
    const amount = { currency: 'EUR', value: (amountCents / 100).toFixed(2) };
    const metadata = { userId, modules: renewing, kind: 'modules', discountCode };
    const description = subscriptionDescription(renewing);

    if (live.length > 0) {
      const [keep, ...extra] = live;
      const patch = { customerId, amount, description, metadata };
      try {
        await mollie.customerSubscriptions.update(keep.id, opts.mandateId ? { ...patch, mandateId: opts.mandateId } : patch);
      } catch (err) {
        // Mollie weigert soms het nieuwe mandaat (een kaartmandaat op een incasso-abonnement, of een
        // dat nog `pending` is) met een misleidende "No subscription exists". Het bedrag is wat telt;
        // het abonnement houdt dan zijn eigen mandaat.
        if (!opts.mandateId) throw err;
        console.error('[mollie-modules] mandate switch refused, keeping the old one', keep.id, err instanceof Error ? err.message : err);
        await mollie.customerSubscriptions.update(keep.id, patch);
      }
      for (const sub of extra) {
        try {
          await mollie.customerSubscriptions.cancel(sub.id, { customerId });
        } catch (err) {
          console.error('[mollie-modules] duplicate subscription: cancel failed', sub.id, err);
        }
      }
      return false;
    }

    await mollie.customerSubscriptions.create({
      customerId,
      amount,
      interval: '1 month',
      description,
      startDate: opts.startDate ?? oneMonthFromToday(),
      webhookUrl: opts.webhookUrl,
      metadata,
      ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
    });
    return true;
  } catch (err) {
    // The candidate has paid and has access; a failed sync only means the amount is stale. Loud in
    // the log rather than a failed webhook, which Mollie would retry and which would re-grant.
    console.error('[mollie-modules] subscription sync failed', userId, err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Exactly one caller may act on a change payment: webhook, return poll and cron can all arrive.
 * The claim is the `activation_email_sent` flag on its `payments` row — for a change payment that
 * flag means "fulfilled (and the confirmation sent)".
 */
async function claim(supabase: AdminClient, paymentId: string): Promise<boolean> {
  const { data } = await supabase
    .from(TABLE.PAYMENTS)
    .update({ activation_email_sent: true })
    .eq('mollie_payment_id', paymentId)
    .eq('activation_email_sent', false)
    .select('id');
  return (data?.length ?? 0) > 0;
}

const FAILED = ['failed', 'canceled', 'expired'];

/**
 * A pro-rated change payment changed status.
 *
 *  - **paid, via the checkout** → apply the change now and sync the subscription (with the new
 *    mandate this payment created), then send the confirmation.
 *  - **paid, on the mandate** → nothing: it was applied when the charge was created.
 *  - **failed, on the mandate** → close what it opened and lower the subscription again.
 *  - **failed, via the checkout** → nothing: nothing was opened.
 *
 * A chargeback on a mandate payment does not change its status and is not handled here.
 */
export async function handleModuleChangePayment(
  mollie: MollieClient,
  supabase: AdminClient,
  payment: Payment
): Promise<void> {
  const meta = payment.metadata as ModuleChangeMetadata;
  const { userId } = meta;
  if (!userId || !payment.customerId) return;

  if (payment.status === 'paid' && !meta.appliedAtCreate) {
    if (!(await claim(supabase, payment.id))) return;
    const existing = await readMeta(supabase, userId);
    const next = { ...existing, ...applyChange(existing, meta) };
    await writeMeta(supabase, userId, next);
    await syncSubscription(mollie, {
      customerId: payment.customerId,
      userId,
      renewing: renewingModules(next as never),
      discountCode: meta.discountCode,
      mandateId: payment.mandateId ?? undefined,
      startDate: meta.periodEnd,
      webhookUrl: payment.webhookUrl ?? undefined,
    });
    await sendModuleChangeEmail(supabase, userId, {
      outcome: 'applied',
      added: meta.add,
      removed: meta.remove,
      periodEnd: meta.periodEnd,
      chargedCents: Math.round(parseFloat(payment.amount.value) * 100),
      monthlyCents: monthlyAmountCents(renewingModules(next as never), meta.discountCode),
      locale: meta.locale,
    });
    return;
  }

  if (FAILED.includes(payment.status) && meta.appliedAtCreate) {
    if (!(await claim(supabase, payment.id))) return;
    const existing = await readMeta(supabase, userId);
    const next = { ...existing, ...revertGrant(existing, meta.newlyGranted) };
    await writeMeta(supabase, userId, next);
    await syncSubscription(mollie, {
      customerId: payment.customerId,
      userId,
      renewing: renewingModules(next as never),
      discountCode: meta.discountCode,
    });
    await sendModuleChangeEmail(supabase, userId, {
      outcome: 'payment_failed',
      added: meta.newlyGranted,
      removed: [],
      periodEnd: meta.periodEnd,
      chargedCents: 0,
      monthlyCents: monthlyAmountCents(renewingModules(next as never), meta.discountCode),
      locale: meta.locale,
    });
  }
}
