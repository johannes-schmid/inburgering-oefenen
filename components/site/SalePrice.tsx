'use client';

import { BLACK_FRIDAY } from '@/lib/black-friday';
import { applyDiscount, euro } from '@/lib/pricing';
import { useSaleOffer } from '@/lib/use-sale-offer';

/**
 * Een prijs, met de Black Friday-korting erin voor wie hem krijgt: de oude prijs doorgestreept
 * ervoor, de nieuwe erachter. Zelfde som als de checkout (`applyDiscount`), zelfde regel voor wie
 * (`useSaleOffer`). Voor iedereen anders, en zolang dat nog niet vaststaat, gewoon de prijs.
 */
export default function SalePrice({ cents }: { cents: number }) {
  const sale = useSaleOffer() === true;
  if (!sale) return <>{euro(cents)}</>;
  return (
    <>
      <s className="g-was">{euro(cents)}</s>
      {euro(applyDiscount(cents, BLACK_FRIDAY.pct))}
    </>
  );
}
