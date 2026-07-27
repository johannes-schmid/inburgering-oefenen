import { sendGAEvent } from '@next/third-parties/google';
import { getAbVariant } from '@/lib/ab-variant';

export function track(event: string, props: Record<string, unknown> = {}) {
  const enriched = { ab_variant: getAbVariant(), ...props };
  try { sendGAEvent('event', event, enriched); } catch {}
}
