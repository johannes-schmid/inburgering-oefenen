import { PostHog } from 'posthog-node';

/**
 * Server-side PostHog, voor de events die de browser niet ziet: `signup_completed` in de
 * OAuth-callback en `checkout_created` / `payment_completed` in de Mollie-routes.
 * `flushAt: 1` omdat een serverless functie na de response kan stoppen; zonder token is
 * elke aanroep een no-op, zodat lokaal zonder PostHog niets faalt.
 */
let posthogClient: PostHog | null | undefined;

export function getPostHogClient(): PostHog | null {
  if (posthogClient !== undefined) return posthogClient;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  posthogClient = token
    ? new PostHog(token, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        flushAt: 1,
        flushInterval: 0,
      })
    : null;
  return posthogClient;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const client = getPostHogClient();
  if (!client) return;
  try {
    client.capture({ distinctId, event, properties });
    await client.flush();
  } catch (err) {
    console.error('[posthog] capture failed:', event, (err as Error)?.message);
  }
}
