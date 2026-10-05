import { sendGAEvent } from '@next/third-parties/google';
import { getAbVariant } from '@/lib/ab-variant';
import { captureEvent } from '@/lib/posthog-client';

/** Eén aanroep, twee bestemmingen: GA4 (voor de koppeling met Search Console) en PostHog
 *  (voor de funnel per landingspagina en de sessie-opnames). */
export function track(event: string, props: Record<string, unknown> = {}) {
  const enriched = { ab_variant: getAbVariant(), ...props };
  try { sendGAEvent('event', event, enriched); } catch {}
  void captureEvent(event, enriched).catch(() => {});
}
