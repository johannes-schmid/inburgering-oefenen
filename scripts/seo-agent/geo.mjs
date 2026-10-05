/**
 * AI-zichtbaarheid: dezelfde vaste prompts naar ChatGPT (Responses API + web_search), Perplexity
 * (Agent API) en Claude (web search tool), één antwoord per prompt per engine, en we tellen welke
 * domeinen geciteerd worden. Draait alleen in even ISO-weken.
 *
 * Kanttekening: een API-antwoord is niet hetzelfde als wat de consumentenapp laat zien. De trend
 * is bruikbaar, het absolute getal niet.
 */
import { fetchJson, hostOf, skipped } from './lib/io.mjs';

async function openai(prompt, country) {
  const json = await fetchJson('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GEO_OPENAI_MODEL ?? 'gpt-5-mini',
      tools: [{ type: 'web_search', search_context_size: 'low', user_location: { type: 'approximate', country } }],
      input: prompt,
    }),
  }, 'openai responses');
  const urls = [];
  let answer = '';
  for (const item of json.output ?? []) {
    for (const c of item.content ?? []) {
      if (c.text) answer += c.text;
      for (const a of c.annotations ?? []) if (a.type === 'url_citation' && a.url) urls.push(a.url);
    }
  }
  return { urls, answer };
}

async function perplexity(prompt) {
  const json = await fetchJson('https://api.perplexity.ai/v1/agent', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset: 'fast', input: prompt }),
  }, 'perplexity agent');
  const urls = [];
  let answer = '';
  for (const item of json.output ?? []) {
    if (item.type === 'search_results') for (const r of item.results ?? []) if (r.url) urls.push(r.url);
    if (item.type === 'message') for (const c of item.content ?? []) if (c.text) answer += c.text;
  }
  // Oudere vorm (Sonar): citations bovenaan.
  for (const r of json.search_results ?? []) if (r.url) urls.push(r.url);
  return { urls, answer: answer || json.choices?.[0]?.message?.content || '' };
}

async function anthropic(prompt, country) {
  const json = await fetchJson('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GEO_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3, user_location: { type: 'approximate', country } }],
    }),
  }, 'anthropic messages');
  const urls = [];
  let answer = '';
  for (const block of json.content ?? []) {
    if (block.type === 'text') {
      answer += block.text;
      for (const c of block.citations ?? []) if (c.url) urls.push(c.url);
    }
  }
  return { urls, answer };
}

const ENGINES = {
  openai: { key: 'OPENAI_API_KEY', run: (p, c) => openai(p, c) },
  perplexity: { key: 'PERPLEXITY_API_KEY', run: p => perplexity(p) },
  anthropic: { key: 'ANTHROPIC_API_KEY', run: (p, c) => anthropic(p, c) },
};

export async function collectGeo(config) {
  const ours = Object.values(config.sites).map(s => s.domain);
  const engines = config.geo.engines.filter(e => ENGINES[e] && process.env[ENGINES[e].key]);
  if (engines.length === 0) return skipped('geen van OPENAI_API_KEY / PERPLEXITY_API_KEY / ANTHROPIC_API_KEY gezet');
  const results = [];
  const domainCounts = {};
  for (const prompt of config.geo.prompts) {
    for (const engine of engines) {
      try {
        const { urls, answer } = await ENGINES[engine].run(prompt.text, config.geo.country);
        const domains = [...new Set(urls.map(hostOf).filter(Boolean))];
        for (const d of domains) domainCounts[d] = (domainCounts[d] ?? 0) + 1;
        results.push({
          prompt_id: prompt.id, lang: prompt.lang, engine,
          cited_domains: domains,
          cites_us: ours.filter(d => domains.includes(d)),
          mentions_us: ours.filter(d => answer.toLowerCase().includes(d.split('.')[0])),
          answer_excerpt: answer.slice(0, 400),
        });
      } catch (err) {
        results.push({ prompt_id: prompt.id, lang: prompt.lang, engine, error: err.message });
      }
    }
  }
  const scored = results.filter(r => !r.error);
  const citation_share = Object.fromEntries(ours.map(d => [d, scored.length ? scored.filter(r => r.cites_us.includes(d)).length / scored.length : null]));
  const top_cited = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([domain, n]) => ({ domain, n }));
  return { engines, prompt_count: config.geo.prompts.length, citation_share, top_cited, results };
}
