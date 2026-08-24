/**
 * `GET /robots.txt` — generated, and it replaced a hand-written `public/robots.txt` that had two
 * real bugs in it.
 *
 * ## The bug that mattered
 * A `robots.txt` group is **not** additive. A crawler obeys the single most specific group that
 * names it and ignores `User-agent: *` entirely. The old file listed
 *
 * ```
 * User-agent: *
 * Allow: /
 * Disallow: /*​/dashboard
 * …
 * User-agent: GPTBot
 * Allow: /
 * ```
 *
 * so GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai and Bingbot were each told
 * "everything is allowed" — the six user agents most likely to crawl us were the six exempt from
 * every `Disallow`. Nothing about the site breaks, and no tool reports it; those bots simply spend
 * their budget on `/login`, `/dashboard` and `/admin`, and may index a login page.
 *
 * The fix is not to delete the groups — naming them is how the intent is documented, and
 * `Google-Extended` / `Applebot-Extended` only *have* meaning as a named group. It is to build
 * every group from the same `DISALLOW` array, which is why this is a route handler and not a file.
 *
 * ## The other bug
 * `Googlebot-Extended` is not a token. Google's is **`Google-Extended`**, and a typo'd user agent
 * is not an error anywhere — it is a group that matches nothing, and reads as if a decision had
 * been taken.
 *
 * ## Why a route handler rather than `app/robots.ts`
 * The metadata convention would work and is one line shorter, but it cannot emit comments. This
 * file is read by people deciding whether an AI crawler is welcome here, and the answer plus its
 * reasoning belongs in the file they open. It also lets the `llms.txt` pointer sit next to the
 * `Sitemap:` line, where someone looking for it will actually see it.
 *
 * `proxy.ts`'s matcher skips any path containing a dot, so this is not locale-prefixed.
 */

const BASE = 'https://inburgeringoefenen.nl';

/**
 * Everything no crawler should spend budget on. **One list, applied to every group** — see above.
 *
 * All of these are either behind auth or a post-payment step, so this is about crawl budget and
 * about not indexing a login form, never about hiding content. Public content is never disallowed:
 * the guides, the hubs, the exam overviews and the free tasters are the point of the site.
 */
const DISALLOW = [
  '/*/login',
  '/*/register',
  '/*/activate',
  '/*/dashboard',
  '/*/admin',
  '/*/admin-login',
  '/*/betaling-gelukt',
  '/auth/callback',
  '/api/',
];

/**
 * Named agents, grouped by who they belong to, each welcome on the same terms as everyone else.
 *
 * The site's content is reference material whose whole purpose is to be found and quoted — every
 * figure in a kennisgids carries its source and its consulted-on date precisely so that a quotation
 * of it is verifiable (see `lib/llms.ts`). So the answer for AI crawlers is yes, and this list says
 * so explicitly rather than by omission.
 *
 * Tokens are the vendors' own, and a typo is silent — a group matching no agent looks exactly like
 * a group that is being obeyed. Verify against the vendor's documentation before adding one.
 */
const AGENT_GROUPS: [comment: string, agents: string[]][] = [
  ['OpenAI — training, search index, and user-triggered fetches', ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User']],
  ['Anthropic — crawler, search, and user-triggered fetches', ['ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai']],
  ['Google — Gemini and Vertex grounding. Googlebot itself is covered by the wildcard group', ['Google-Extended']],
  ['Microsoft — Bing and Copilot', ['bingbot', 'BingPreview']],
  ['Apple — Siri and Apple Intelligence', ['Applebot', 'Applebot-Extended']],
  ['Perplexity — index and user-triggered fetches', ['PerplexityBot', 'Perplexity-User']],
  ['Meta — Meta AI', ['meta-externalagent', 'meta-externalfetcher', 'FacebookBot']],
  ['Other assistants and indexes', ['Amazonbot', 'DuckAssistBot', 'MistralAI-User', 'YouBot', 'cohere-ai', 'AI2Bot', 'Diffbot', 'Timpibot', 'PetalBot']],
  ['Common Crawl — the corpus much open research is built on', ['CCBot']],
];

function group(agents: string[], comment?: string): string {
  const head = comment ? `# ${comment}\n` : '';
  return (
    head +
    agents.map(a => `User-agent: ${a}`).join('\n') +
    '\nAllow: /\n' +
    DISALLOW.map(p => `Disallow: ${p}`).join('\n')
  );
}

const BODY = `# ${BASE}
#
# Reference material for the Dutch inburgeringsexamen. Crawling and quoting are welcome: every
# figure in a kennisgids is published with the government source it came from and the date it was
# consulted, so a quotation of it can be checked.
#
# See /llms.txt for a curated map of the site and the rules for citing it, and /llms-full.txt for
# the complete text of every published guide in one file.
#
# NOTE FOR EDITORS: a robots.txt group is not additive. A crawler that matches a named group below
# ignores "User-agent: *" completely, which is why every group repeats the Disallow lines. They are
# generated from one list in app/robots.txt/route.ts — add a path there, not here.

${group(['*'])}

${AGENT_GROUPS.map(([comment, agents]) => group(agents, comment)).join('\n\n')}

Sitemap: ${BASE}/sitemap.xml
`;

export const dynamic = 'force-static';

export function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
