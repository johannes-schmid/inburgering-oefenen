'use client';

/**
 * PostHog in de browser, lui geladen.
 *
 * Niet via `instrumentation-client.ts` zoals in knm-website: dat bestand draait vóór de hydratie
 * en zet posthog-js (±60 KB) in het kritieke pad, terwijl `AnalyticsProviders` de drie andere
 * tags juist pas na idle of de eerste interactie monteert om de LCP te sparen. PostHog volgt
 * dezelfde regel: `initPostHog()` wordt daar aangeroepen, en `captureEvent()` start de init zelf
 * als er eerder al een event binnenkomt — zo gaat de eerste klik niet verloren.
 *
 * Eén project voor twee sites (besluit eigenaar 05-10): knmoefenen.nl en inburgeringoefenen.nl
 * schrijven naar hetzelfde PostHog-project en worden gesplitst op `$host`. Het gratis plan
 * staat maar één project toe.
 */

import type { PostHog } from 'posthog-js';

let client: Promise<PostHog | null> | null = null;

export function initPostHog(): Promise<PostHog | null> {
  if (client) return client;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || typeof window === 'undefined') {
    client = Promise.resolve(null);
    return client;
  }
  client = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(token, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      defaults: '2026-01-30',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === 'development',
    });
    return posthog;
  });
  return client;
}

export async function captureEvent(event: string, props: Record<string, unknown>) {
  const posthog = await initPostHog();
  posthog?.capture(event, props);
}

export async function identifyUser(id: string, props: Record<string, unknown>) {
  const posthog = await initPostHog();
  posthog?.identify(id, props);
}
