import type { ScoreFactor, Verdict } from './seo-score.mjs';

/**
 * De twee knoppen bij een pagina op `/admin/seo`: een prompt om in Claude Code te plakken, en
 * stappen om het zelf te doen. Puur en zonder serverafhankelijkheden, zodat de clientcomponent ze
 * pas bij een klik bouwt — 177 pagina's maal twee teksten hoeven niet in de payload.
 *
 * Engels, zoals de rest van de pagina (besluit eigenaar, 26-10). De vangrails komen uit CLAUDE.md:
 * niets publiceert zonder de docent, elk getal uit `SEO/facts.md`, nooit "geen AI".
 */

export type PromptPage = {
  path: string;
  section: string;
  sectionLabel: string;
  verdict: Verdict;
  reason: string;
  plan: { action: string; owner: string; week?: string; into?: string } | null;
  demand: number;
  now: { impressions: number; clicks: number; position: number | null } | null;
  queries: { query: string; impressions: number; position: number }[];
  score: number;
  factors: ScoreFactor[];
  recs: { task: string; steps: string[] }[];
  competitor: string | null;
  insights: string[];
};

const ORIGIN = 'https://inburgeringoefenen.nl';

/** Waar de inhoud van een pagina staat. Liever een eerlijke wegwijzer dan een geraden bestandsnaam. */
export function sourceHint(path: string): string {
  const [locale, first, slug] = path.split('/').filter(Boolean);
  if (locale !== 'nl') {
    if (path.includes('/blog/') || path.includes('/المدونة/')) return 'the `translations` field of the post in data/blog-posts.ts';
    return 'the matching file in data/guides/translations/ (guides), or messages/en.json / messages/ar.json for page chrome; the route is the Dutch one, mapped in i18n/routing.ts';
  }
  if (first === 'blog' && slug) return `data/blog-posts.ts (slug "${decodeURI(slug)}")`;
  if ((first === 'inburgering' || first === 'taalexamens' || first === 'knm') && slug && slug !== 'tools') return `data/guides/${slug}.ts`;
  if (first === 'oefenexamen') return 'app/[locale]/(main)/oefenexamen/ (the [level] and [level]/[skill] routes) and its strings in messages/nl.json';
  if (first === 'oefenen') return 'app/[locale]/(main)/oefenen/ and its strings in messages/nl.json';
  if (!first) return 'app/[locale]/(main)/page.tsx and its strings in messages/nl.json';
  return `app/[locale]/(main)/${first}/ and its strings in messages/nl.json`;
}

const nf = new Intl.NumberFormat('en-GB');

function stateLines(p: PromptPage): string[] {
  const lines: string[] = [];
  if (p.now) {
    lines.push(
      `Google, last 28 days: ${nf.format(p.now.impressions)} impressions, ${nf.format(p.now.clicks)} clicks${p.now.position !== null ? `, average position ${p.now.position.toFixed(1)}` : ''}.`,
    );
  } else {
    lines.push('Google, last 28 days: unknown (no live Search Console data).');
  }
  lines.push(`Aug–Sep (before the drop): ${nf.format(p.demand)} impressions.`);
  if (p.queries.length) lines.push(`Top queries: ${p.queries.map(q => `"${q.query}" (#${Math.round(q.position)})`).join(', ')}.`);
  return lines;
}

function task(p: PromptPage): string[] {
  const snippet = p.factors.find(f => f.key === 'snippet');
  const visibility = p.factors.some(f => f.key === 'visibility' || f.key === 'position');
  switch (p.verdict) {
    case 'remove':
      return [
        'Take this page out of Google’s index without deleting it: set `robots: { index: false }` in its metadata and drop it from app/sitemap.ts.',
        'Keep the page reachable and its content intact, so it can return once it is reviewed.',
      ];
    case 'consolidate':
      return [
        `Merge this page into ${p.plan?.into ? `${p.plan.into}` : 'the stronger page on the same topic'}: move anything unique into that page as a draft for the teacher, then add a permanent redirect in next.config.ts and drop this URL from app/sitemap.ts.`,
        'Never lose a fact that only this page has.',
      ];
    case 'improve':
      return [
        'Draft a rewrite for the teacher (Amber van der Zalm) to review. Don’t mark it reviewed or publish it yourself.',
        'Follow what competitors do better (below): show, don’t describe. Add a concrete demonstration or a practice task, not more explanation.',
        'Keep the page’s target query early in the title and H1.',
      ];
    case 'watch':
      return [
        'Decide whether this page earns its place: compare it with its sibling pages and write a short brief in seo-agent/briefs/ proposing either a merge, noindex or enrichment. Don’t change the page.',
      ];
    default:
      if (snippet) return [`Fix the snippet: ${snippet.label.toLowerCase()}. Titles max 60 characters, meta descriptions 140–160, unique, with the main query first.`];
      if (visibility) return ['Find out why Google shows this page less: compare it with the pages that outrank it for its top queries and write the findings in seo-agent/briefs/. Don’t edit copy yet.'];
      return ['Nothing is wrong. Look for one improvement that helps the reader more than any competitor does, and propose it in seo-agent/briefs/.'];
  }
}

export function aiPrompt(p: PromptPage): string {
  const out = [
    `Improve ${ORIGIN}${p.path} in this repo.`,
    '',
    `Where it lives: ${sourceHint(p.path)}.`,
    `Section: ${p.sectionLabel}. Health score ${p.score}/10.`,
    ...stateLines(p),
  ];
  if (p.factors.length) out.push('', 'What costs points:', ...p.factors.map(f => `- ${f.label} (${f.delta})`));
  out.push('', `Triage: ${p.verdict}. ${p.reason}`);
  if (p.plan) out.push(`Plan: ${p.plan.action}`);
  if (p.competitor) out.push('', `Competitor check on this page: ${p.competitor}`);
  if (p.insights.length) out.push('', 'What competitors do better in this section:', ...p.insights.map(i => `- ${i}`));
  out.push(
    '',
    'Do this:',
    ...task(p).map((t, i) => `${i + 1}. ${t}`),
    '',
    'Rules:',
    '- Read CLAUDE.md (§2 and §9), SEO/README.md and SEO/voice.md first.',
    '- Every number comes from SEO/facts.md. Never write "geen AI" or "niet door AI".',
    '- Dutch copy at A2 level: short sentences, "je", not "u".',
    '- Nothing goes live without the teacher’s review.',
    '- Run npx tsc --noEmit and the build, open a PR (don’t push to main), and add an entry to seo-agent/ledger.json so the Saturday run judges it after 35 days.',
  );
  return out.join('\n');
}

/** De stappen om het zelf te doen: eerst die uit de to-dolijst, anders per oordeel. */
export function manualSteps(p: PromptPage): string[] {
  const fromRecs = p.recs.flatMap(r => r.steps);
  if (fromRecs.length) return [...fromRecs, `The content lives in ${sourceHint(p.path)}.`];
  const where = `Open ${sourceHint(p.path)}.`;
  const snippet = p.factors.find(f => f.key === 'snippet');
  switch (p.verdict) {
    case 'remove':
      return [where, 'Add `robots: { index: false }` to the page metadata.', 'Remove the URL from app/sitemap.ts.', 'Push via a PR; after deploy, ask Google to recrawl it in Search Console (URL Inspection).'];
    case 'consolidate':
      return [where, `Copy anything unique into ${p.plan?.into ?? 'the stronger page on the same topic'} and send that to Amber for review.`, 'Add a permanent redirect in next.config.ts.', 'Remove the URL from app/sitemap.ts.'];
    case 'improve':
      return [
        where,
        'Ask Amber to add one thing only she can: a corrected student text, a model answer with the DUO scoring points, or the same sentence at A1, A2 and B1.',
        'Cut blocks that repeat on every guide (boilerplate quote boxes, generic FAQ).',
        `Keep the main query${p.queries[0] ? ` ("${p.queries[0].query}")` : ''} early in the title and H1.`,
        'Amber marks it reviewed; then it publishes.',
      ];
    case 'watch':
      return [where, 'Compare it with its sibling pages: does it answer something none of them does?', 'If not, merge or noindex it. If yes, give it one concrete example.'];
    default:
      if (snippet) return [where, `${snippet.label}. Shorten or lengthen it, unique per page, main query first.`];
      return ['Nothing to do. Check again after next Friday’s data pull.'];
  }
}
