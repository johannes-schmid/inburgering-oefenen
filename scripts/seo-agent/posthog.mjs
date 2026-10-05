/**
 * PostHog via HogQL: de funnel per host en per landingspagina, 28 dagen tegen de 28 ervoor.
 * Beide sites schrijven naar één project; `$host` splitst ze. Hooguit drie query's tegelijk,
 * en elk met een eigen timeout van tien seconden aan PostHogs kant (LEARNINGS knm 2026-09-24).
 */
import { fetchJson, mapLimit, skipped } from './lib/io.mjs';

async function hogql(config, name, query) {
  const host = config.posthog.host;
  const projectId = /^\d+$/.test(process.env.POSTHOG_PROJECT_ID ?? '') ? process.env.POSTHOG_PROJECT_ID : config.posthog.project_id;
  const json = await fetchJson(`${host}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, query: { kind: 'HogQLQuery', query } }),
  }, `posthog ${name}`);
  return { columns: json.columns, results: json.results };
}

export async function collectPosthog(config) {
  if (!process.env.POSTHOG_PERSONAL_API_KEY) return skipped('POSTHOG_PERSONAL_API_KEY ontbreekt');
  const events = config.posthog.funnel_events.map(e => `'${e}'`).join(', ');
  const queries = [
    ['events_by_host_28d', `
      SELECT properties.$host AS host, event, count() AS n, count(DISTINCT person_id) AS persons
      FROM events
      WHERE timestamp >= now() - INTERVAL 28 DAY AND event IN (${events})
      GROUP BY host, event ORDER BY host, event`],
    ['events_by_host_prev_28d', `
      SELECT properties.$host AS host, event, count() AS n, count(DISTINCT person_id) AS persons
      FROM events
      WHERE timestamp >= now() - INTERVAL 56 DAY AND timestamp < now() - INTERVAL 28 DAY AND event IN (${events})
      GROUP BY host, event ORDER BY host, event`],
    ['pageviews_by_host_28d', `
      SELECT properties.$host AS host, count() AS pageviews, count(DISTINCT $session_id) AS sessions, count(DISTINCT person_id) AS persons
      FROM events WHERE timestamp >= now() - INTERVAL 28 DAY AND event = '$pageview'
      GROUP BY host`],
    ['funnel_by_landing_page_28d', `
      SELECT properties.$host AS host, session.$entry_pathname AS landing,
             count(DISTINCT $session_id) AS sessions,
             countIf(event = 'free_practice_started') AS taster_started,
             countIf(event = 'email_captured') AS email_captured,
             countIf(event = 'signup_completed') AS signups,
             countIf(event = 'checkout_initiated') AS checkouts,
             countIf(event = 'payment_completed') AS paid
      FROM events
      WHERE timestamp >= now() - INTERVAL 28 DAY AND session.$entry_pathname IS NOT NULL
      GROUP BY host, landing
      HAVING sessions >= 5
      ORDER BY sessions DESC LIMIT 100`],
    ['organic_landing_pages_28d', `
      SELECT properties.$host AS host, session.$entry_pathname AS landing, session.$entry_referring_domain AS ref, count(DISTINCT $session_id) AS sessions
      FROM events
      WHERE timestamp >= now() - INTERVAL 28 DAY AND event = '$pageview'
        AND session.$entry_referring_domain IN ('www.google.com', 'google.com', 'www.bing.com', 'bing.com', 'duckduckgo.com', 'chatgpt.com', 'www.perplexity.ai', 'perplexity.ai')
      GROUP BY host, landing, ref ORDER BY sessions DESC LIMIT 100`],
    ['revenue_28d', `
      SELECT properties.$host AS host, count() AS payments, sum(toFloat(properties.value)) AS eur
      FROM events WHERE timestamp >= now() - INTERVAL 28 DAY AND event = 'payment_completed'
      GROUP BY host`],
  ];
  const results = await mapLimit(queries, 3, async ([name, q]) => {
    try { return [name, await hogql(config, name, q)]; }
    catch (err) { return [name, { error: err.message }]; }
  });
  return { queries: Object.fromEntries(results) };
}
