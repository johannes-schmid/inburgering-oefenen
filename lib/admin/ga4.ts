import { google } from 'googleapis';

/**
 * GA4 Data API voor `/admin/doelen`: bezoekers en wie begint te oefenen.
 *
 * Auth is het serviceaccount uit `docs/seo/google-api-toegang.md` (Viewer op de GA4-property), als
 * JSON-inhoud in `GA4_SA_JSON` — of `GSC_SA_JSON`, want het is hetzelfde account. Zonder sleutel of
 * bij een fout is het resultaat `null`: **onbekend, nooit nul** — een funnel die bij een verlopen
 * sleutel "0 bezoekers" zegt, wijst de verkeerde stap aan als bottleneck.
 */
const PROPERTY = `properties/${process.env.GA4_PROPERTY_ID ?? '547503294'}`;

/** De events die betekenen dat iemand echt begint te oefenen. */
const PRACTICE_EVENTS = ['free_practice_started', 'exam_started'];

export type Ga4Snapshot = {
  visitors30d: number;
  practicing30d: number;
  /** `YYYY-MM` → gebruikers, oudste eerst. */
  visitorsByMonth: { month: string; users: number }[];
} | { error: string };

function client() {
  const raw = process.env.GA4_SA_JSON ?? process.env.GSC_SA_JSON;
  if (!raw) return null;
  const creds = JSON.parse(raw);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth });
}

const num = (v: string | null | undefined) => Number(v ?? 0) || 0;

export async function fetchGa4(months = 6): Promise<Ga4Snapshot> {
  const ga = client();
  if (!ga) return { error: 'GA4_SA_JSON ontbreekt' };

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1)).toISOString().slice(0, 10);
  const last30 = [{ startDate: '29daysAgo', endDate: 'today' }];

  try {
    const [visitors, practicing, monthly] = await Promise.all([
      ga.properties.runReport({ property: PROPERTY, requestBody: { dateRanges: last30, metrics: [{ name: 'totalUsers' }] } }),
      ga.properties.runReport({
        property: PROPERTY,
        requestBody: {
          dateRanges: last30,
          metrics: [{ name: 'totalUsers' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: PRACTICE_EVENTS } } },
        },
      }),
      ga.properties.runReport({
        property: PROPERTY,
        requestBody: {
          dateRanges: [{ startDate: start, endDate: 'today' }],
          dimensions: [{ name: 'yearMonth' }],
          metrics: [{ name: 'totalUsers' }],
          orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
        },
      }),
    ]);

    return {
      visitors30d: num(visitors.data.rows?.[0]?.metricValues?.[0]?.value),
      practicing30d: num(practicing.data.rows?.[0]?.metricValues?.[0]?.value),
      visitorsByMonth: (monthly.data.rows ?? []).map(r => {
        const ym = r.dimensionValues?.[0]?.value ?? '';
        return { month: `${ym.slice(0, 4)}-${ym.slice(4, 6)}`, users: num(r.metricValues?.[0]?.value) };
      }),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'GA4-vraag mislukt' };
  }
}
