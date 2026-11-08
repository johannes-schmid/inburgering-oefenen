/**
 * Een wijziging halverwege de periode: offerte en uitvoering.
 *
 * `/api/change-modules` is een dunne laag hieromheen. Dezelfde functie levert de preview ("nu
 * €X, daarna €Y per maand vanaf [datum]") en voert hem uit, zodat het bedrag dat de kandidaat
 * bevestigt het bedrag is dat Mollie vraagt.
 *
 * ## Drie uitvoeringen
 *  - **Niets te betalen** (alleen opzeggen, terugzetten, of onder `MIN_CHARGE_CENTS`) → de
 *    metadata en het abonnement worden meteen aangepast.
 *  - **Te betalen, met een geldig mandaat** → een `recurring`-incasso zonder checkout. Wat erbij
 *    komt gaat meteen open (besluit eigenaar); mislukt de incasso, dan sluit
 *    `handleModuleChangePayment()` het weer.
 *  - **Te betalen, zonder geldig mandaat** → een checkout (`sequenceType: first`). Er gaat pas iets
 *    open als Mollie `paid` meldt, en die betaling levert meteen een nieuw mandaat voor het
 *    abonnement.
 *
 * Zonder lopend abonnement is er niets om mee te co-termen: dan is het een gewone aankoop via
 * `/api/checkout-modules`, en meldt deze functie `no_subscription`.
 *
 * Server-only: Mollie-sleutel en Supabase service role.
 */
import createMollieClient, { SequenceType, type PaymentCreateParams } from '@mollie/api-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { euro, parseSelection } from '@/lib/pricing';
import { discountPctForCode } from '@/lib/discount-codes';
import { endingModules, ONA_MODULE_ID, renewingModules } from '@/lib/entitlements';
import { isOnaAvailable } from '@/lib/ona/access';
import { latestDiscountCode, listLiveSubscriptions, validMandateId } from '@/lib/subscriptions';
import { applyChange } from '@/lib/billing/metadata';
import { quoteChange, type ChangeQuote } from '@/lib/billing/coterm';
import { syncSubscription, type ModuleChangeMetadata } from '@/lib/mollie-modules';
import { sendModuleChangeEmail } from '@/lib/email/send-module-change';
import { TABLE } from '@/lib/api-constants';
import { captureServerEvent } from '@/lib/posthog-server';
import { moduleLabel } from '@/lib/email/templates/cancellation';

export type ChangeErrorCode =
  | 'not_configured'
  | 'no_subscription'
  | 'no_period'
  | 'nothing'
  | 'not_available'
  | 'charge_failed';

export type PublicQuote = Pick<
  ChangeQuote,
  | 'newlyGranted'
  | 'restored'
  | 'removed'
  | 'renewingAfter'
  | 'chargeNowCents'
  | 'waived'
  | 'monthlyAfterCents'
  | 'periodEnd'
  | 'cancelsSubscription'
> & {
  /** Wat het abonnement nu werkelijk incasseert — kan afwijken van de berekening bij oude abonnementen. */
  monthlyNowCents: number;
};

export type ChangeResult =
  | { ok: false; code: ChangeErrorCode; status: number }
  | { ok: true; mode: 'preview'; quote: PublicQuote }
  | { ok: true; mode: 'applied'; quote: PublicQuote }
  | { ok: true; mode: 'checkout'; quote: PublicQuote; checkoutUrl: string; paymentId: string };

/** De datum in Nederland — een wijziging om 00:30 hoort bij de dag die de kandidaat ziet. */
export function amsterdamToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(now);
}

export type BillingPeriod = {
  /** Einde van de lopende periode: de verlengdatum, of bij hervatten de laatste einddatum. */
  periodEnd: string;
  discountCode: string | null;
  /** Wat er nu per maand wordt geïncasseerd; 0 als alles is opgezegd. */
  monthlyNowCents: number;
  /**
   * Er loopt geen abonnement meer, maar er staan nog modules open en het mandaat is geldig. Een
   * module weer aanzetten hervat het abonnement: de eerste incasso valt op `periodEnd`, en voor de
   * dagen die al betaald zijn wordt niets gerekend.
   */
  resuming: boolean;
};

/**
 * De periode waartegen een wijziging wordt gerekend — of `null`, en dan is het een gewone aankoop
 * via de checkout. Gedeeld met `/dashboard/pakketten`, zodat de kiezer en de route dezelfde
 * beslissing nemen.
 */
export async function currentPeriod(meta: Record<string, unknown>, customerId: string | null): Promise<BillingPeriod | null> {
  if (!customerId) return null;
  const live = await listLiveSubscriptions(customerId);
  const sub = live[0];
  if (sub) {
    return sub.nextPaymentDate
      ? { periodEnd: sub.nextPaymentDate, discountCode: sub.discountCode, monthlyNowCents: sub.amountCents, resuming: false }
      : null;
  }
  const open = endingModules(meta as never).map(m => m.until).sort();
  const last = open[open.length - 1];
  if (!last || last < amsterdamToday()) return null;
  if (!(await validMandateId(customerId))) return null;
  return { periodEnd: last, discountCode: await latestDiscountCode(customerId), monthlyNowCents: 0, resuming: true };
}

export async function changeModules(req: {
  userId: string;
  email: string | null;
  add: unknown;
  remove: unknown;
  locale: string;
  confirm: boolean;
}): Promise<ChangeResult> {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return { ok: false, code: 'not_configured', status: 503 };

  const add = parseSelection(req.add);
  const remove = parseSelection(req.remove);
  if (add.includes(ONA_MODULE_ID) && !isOnaAvailable()) return { ok: false, code: 'not_available', status: 400 };

  const admin = createAdminClient();
  const { data: userRow } = await admin.auth.admin.getUserById(req.userId);
  const meta = (userRow?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const customerId = typeof meta.mollie_customer_id === 'string' ? meta.mollie_customer_id : null;
  if (!customerId) return { ok: false, code: 'no_subscription', status: 409 };

  const period = await currentPeriod(meta, customerId);
  if (!period) return { ok: false, code: 'no_subscription', status: 409 };
  const { periodEnd, discountCode, resuming } = period;
  const quote = quoteChange({
    renewing: renewingModules(meta as never),
    paidThrough: endingModules(meta as never).filter(m => m.until >= periodEnd).map(m => m.id),
    add,
    remove,
    periodEnd,
    today: amsterdamToday(),
    discountPct: discountPctForCode(discountCode),
  });
  if (!quote.changed) return { ok: false, code: 'nothing', status: 400 };

  const publicQuote: PublicQuote = {
    newlyGranted: quote.newlyGranted,
    restored: quote.restored,
    removed: quote.removed,
    renewingAfter: quote.renewingAfter,
    chargeNowCents: quote.chargeNowCents,
    waived: quote.waived,
    monthlyAfterCents: quote.monthlyAfterCents,
    periodEnd,
    cancelsSubscription: quote.cancelsSubscription,
    monthlyNowCents: period.monthlyNowCents,
  };
  if (!req.confirm) return { ok: true, mode: 'preview', quote: publicQuote };

  const added = [...quote.newlyGranted, ...quote.restored];
  const mollie = createMollieClient({ apiKey });
  const baseUrl = process.env.BASE_URL || 'https://inburgeringoefenen.nl';
  const webhookBase = process.env.MOLLIE_WEBHOOK_URL;
  const webhookUrl = webhookBase && !webhookBase.includes('localhost') ? `${webhookBase}/api/mollie-webhook` : undefined;

  const changeMeta: ModuleChangeMetadata = {
    kind: 'modules_change',
    userId: req.userId,
    add: added,
    remove: quote.removed,
    newlyGranted: quote.newlyGranted,
    periodEnd,
    appliedAtCreate: false,
    discountCode,
    locale: req.locale,
  };

  const track = (mode: string) =>
    captureServerEvent(req.userId, 'modules_changed', {
      mode,
      added: added.join(','),
      removed: quote.removed.join(','),
      charge_now: quote.chargeNowCents / 100,
      monthly_after: quote.monthlyAfterCents / 100,
      currency: 'EUR',
    });

  if (quote.chargeNowCents > 0) {
    const mandateId = await validMandateId(customerId);
    const description = `Inburgering Oefenen — erbij tot ${periodEnd}: ${quote.newlyGranted.map(moduleLabel).join(', ')}`;
    const base: PaymentCreateParams = {
      amount: { currency: 'EUR', value: (quote.chargeNowCents / 100).toFixed(2) },
      description,
      customerId,
      ...(webhookUrl ? { webhookUrl } : {}),
    };

    const viaCheckout = async (): Promise<ChangeResult> => {
      const payment = await mollie.payments.create({
        ...base,
        sequenceType: SequenceType.first,
        redirectUrl: `${baseUrl}/${req.locale}/betaling-gelukt`,
        metadata: changeMeta,
      });
      await recordPayment(admin, payment.id, req, quote, added);
      await track('checkout');
      return { ok: true, mode: 'checkout', quote: publicQuote, checkoutUrl: payment.getCheckoutUrl() ?? '', paymentId: payment.id };
    };

    if (!mandateId) return viaCheckout();

    let payment;
    try {
      payment = await mollie.payments.create({
        ...base,
        sequenceType: SequenceType.recurring,
        mandateId,
        metadata: { ...changeMeta, appliedAtCreate: true },
      });
    } catch (err) {
      // Mollie weigert de incasso op het mandaat (bijvoorbeeld: SEPA-incasso staat niet aan op het
      // profiel, of het mandaat is ingetrokken). Dan betaalt de kandidaat met iDEAL; dat levert ook
      // meteen een nieuw mandaat op voor het abonnement.
      console.error('[change-modules] recurring payment refused, falling back to checkout', req.userId, err instanceof Error ? err.message : err);
      return viaCheckout();
    }
    if (['failed', 'canceled', 'expired'].includes(payment.status)) {
      return { ok: false, code: 'charge_failed', status: 402 };
    }
    await recordPayment(admin, payment.id, req, quote, added, payment.status);
  }

  const next = {
    ...meta,
    ...applyChange(meta, { add: added, remove: quote.removed, periodEnd }),
    ...(quote.cancelsSubscription
      ? { subscription_canceled_at: new Date().toISOString() }
      : resuming ? { subscription_canceled_at: null } : {}),
  };
  await admin.auth.admin.updateUserById(req.userId, { user_metadata: next });
  await syncSubscription(mollie, {
    customerId,
    userId: req.userId,
    renewing: renewingModules(next as never),
    discountCode,
    // Bij hervatten bestaat er geen abonnement meer: het nieuwe begint op de dag dat het oude
    // zou zijn verlengd, want tot dan is alles al betaald.
    startDate: periodEnd,
    webhookUrl,
  });
  await sendModuleChangeEmail(admin, req.userId, {
    outcome: 'applied',
    added,
    removed: quote.removed,
    periodEnd,
    chargedCents: quote.chargeNowCents,
    monthlyCents: quote.monthlyAfterCents,
    locale: req.locale,
  });
  await track(quote.chargeNowCents > 0 ? 'mandate' : 'free');

  return { ok: true, mode: 'applied', quote: publicQuote };
}

async function recordPayment(
  admin: ReturnType<typeof createAdminClient>,
  paymentId: string,
  req: { userId: string; email: string | null; locale: string },
  quote: ChangeQuote,
  added: string[],
  status = 'open',
) {
  const { error } = await admin.from(TABLE.PAYMENTS).insert({
    mollie_payment_id: paymentId,
    user_id: req.userId,
    email: req.email,
    amount_cents: quote.chargeNowCents,
    status,
    product: `change:+${added.join(',')}${quote.removed.length ? `;-${quote.removed.join(',')}` : ''}`,
    locale: req.locale,
  });
  if (error) console.error('[change-modules] payments insert failed:', error.message, euro(quote.chargeNowCents));
}
