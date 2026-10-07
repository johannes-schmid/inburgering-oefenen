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

export type PeriodCounts = { day: number; week: number; month: number };

/** Bezoekers en oefenaars per periode: vandaag, 7 dagen en 30 dagen, tot en met vandaag. */
export type Ga4Snapshot = { visitors: PeriodCounts; practicing: PeriodCounts } | { error: string };

/** Dezelfde vensters als `PERIODS` in `goal-model.ts`; GA4 rekent in de tijdzone van de property. */
const RANGES = [
  { name: 'day', startDate: 'today', endDate: 'today' },
  { name: 'week', startDate: '6daysAgo', endDate: 'today' },
  { name: 'month', startDate: '29daysAgo', endDate: 'today' },
];

/**
 * De sleutel komt als JSON-tekst uit een env var. Wie hem uit `.env.local` naar Vercel kopieert,
 * neemt de enkele aanhalingstekens mee — Vercel bewaart die letterlijk — dus die gaan er hier af.
 * Een sleutel die dan nog geen JSON is, is een fout op de pagina, geen crash van de pagina.
 */
function parseCreds(raw: string): { client_email: string; private_key: string } {
  const trimmed = raw.trim().replace(/^'([\s\S]*)'$/, '$1');
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error('GA4_SA_JSON is geen geldige JSON — plak de inhoud van het sleutelbestand zonder aanhalingstekens eromheen');
  }
}

function client() {
  const raw = process.env.GA4_SA_JSON ?? process.env.GSC_SA_JSON;
  if (!raw) return null;
  const creds = parseCreds(raw);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth });
}

const num = (v: string | null | undefined) => Number(v ?? 0) || 0;

/** Een periode zonder rij had nul gebruikers — de vraag zelf slaagde. */
function byRange(rows: { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null }[] | undefined): PeriodCounts {
  const out: PeriodCounts = { day: 0, week: 0, month: 0 };
  for (const r of rows ?? []) {
    const key = r.dimensionValues?.[0]?.value as keyof PeriodCounts | undefined;
    if (key && key in out) out[key] = num(r.metricValues?.[0]?.value);
  }
  return out;
}

export async function fetchGa4(): Promise<Ga4Snapshot> {
  let ga: ReturnType<typeof client>;
  try {
    ga = client();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'GA4_SA_JSON onleesbaar' };
  }
  if (!ga) return { error: 'GA4_SA_JSON ontbreekt' };

  try {
    const [visitors, practicing] = await Promise.all([
      ga.properties.runReport({ property: PROPERTY, requestBody: { dateRanges: RANGES, metrics: [{ name: 'totalUsers' }] } }),
      ga.properties.runReport({
        property: PROPERTY,
        requestBody: {
          dateRanges: RANGES,
          metrics: [{ name: 'totalUsers' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: PRACTICE_EVENTS } } },
        },
      }),
    ]);
    return { visitors: byRange(visitors.data.rows), practicing: byRange(practicing.data.rows) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'GA4-vraag mislukt' };
  }
}
