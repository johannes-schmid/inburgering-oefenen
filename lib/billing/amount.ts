import { applyDiscount, priceForSelection, type ModuleSelection } from '@/lib/pricing';
import { discountPctForCode } from '@/lib/discount-codes';

/**
 * Het maandbedrag van een abonnement: de prijs van wat verlengt, met de korting die op het
 * abonnement staat. Eén plek, gelezen door `syncSubscription()`, de offerte en de controle in
 * `scripts/billing/subscription-audit.mjs`.
 */
export function monthlyAmountCents(renewing: string[], discountCode: string | null | undefined): number {
  if (renewing.length === 0) return 0;
  return applyDiscount(priceForSelection(renewing as ModuleSelection), discountPctForCode(discountCode));
}
