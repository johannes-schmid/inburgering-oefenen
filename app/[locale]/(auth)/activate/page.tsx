import { redirect } from 'next/navigation';

/**
 * `/activate` is retired — it was the second checkout flow.
 *
 * It sold the old one-off tiers (Professioneel €9,95 / Compleet €19,95) through
 * `/api/mollie-checkout`, while `/dashboard/pakketten` sells the per-module monthly
 * subscription. Two flows meant two prices for the same product and, worse, only one of them
 * established a mandate — a candidate who happened to land here paid once and never recurred.
 *
 * Kept as a redirect rather than deleted because the route is linked from sent e-mails
 * (`lib/email/components.ts`, `lib/email/templates/abandon.ts`) and from the legacy dashboard
 * views. Those links must keep working; they now arrive at the one checkout.
 */
export default async function ActivatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/pakketten?vanaf=activate`);
}
