import { client, PROPERTY } from '@/lib/admin/ga4';
import { buildFunnel, FUNNEL_EVENTS, type EventRow, type Funnel, type SessionRow } from '@/lib/admin/seo-funnel-model';

/**
 * De funnel van `/admin/seo` live uit GA4: de laatste 28 dagen, per landingspagina, alleen bezoeken
 * uit zoeken en AI-assistenten. Twee vragen: bezoeken, en de funnelgebeurtenissen met hun bedrag.
 * De som staat in `seo-funnel-model.ts`. Fout of geen sleutel → `{ error }`: onbekend, nooit nul.
 */

const RANGE = [{ startDate: '27daysAgo', endDate: 'today' }];
const DIMS = [{ name: 'landingPage' }, { name: 'sessionDefaultChannelGroup' }, { name: 'sessionSource' }];

type Row = { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null };
const dim = (r: Row, i: number) => r.dimensionValues?.[i]?.value ?? '';
const met = (r: Row, i: number) => Number(r.metricValues?.[i]?.value ?? 0) || 0;

export type LiveFunnel = Funnel & { fetchedAt: string };

export async function fetchSeoFunnel(): Promise<LiveFunnel | { error: string }> {
  let ga: ReturnType<typeof client>;
  try {
    ga = client();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'GA4_SA_JSON onleesbaar' };
  }
  if (!ga) return { error: 'GA4_SA_JSON ontbreekt' };

  try {
    const [s, e] = await Promise.all([
      ga.properties.runReport({
        property: PROPERTY,
        requestBody: { dateRanges: RANGE, dimensions: DIMS, metrics: [{ name: 'sessions' }], limit: '25000' },
      }),
      ga.properties.runReport({
        property: PROPERTY,
        requestBody: {
          dateRanges: RANGE,
          dimensions: [...DIMS, { name: 'eventName' }],
          metrics: [{ name: 'totalUsers' }, { name: 'eventValue' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: FUNNEL_EVENTS } } },
          limit: '25000',
        },
      }),
    ]);
    const sessions: SessionRow[] = (s.data.rows ?? []).map(r => ({ page: dim(r, 0), channel: dim(r, 1), source: dim(r, 2), sessions: met(r, 0) }));
    const events: EventRow[] = (e.data.rows ?? []).map(r => ({
      page: dim(r, 0), channel: dim(r, 1), source: dim(r, 2), event: dim(r, 3), users: met(r, 0), value: met(r, 1),
    }));
    return { ...buildFunnel(sessions, events), fetchedAt: new Date().toISOString() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'GA4-vraag mislukt' };
  }
}
