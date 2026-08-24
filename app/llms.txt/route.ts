/**
 * `GET /llms.txt` — the llmstxt.org index. See `lib/llms.ts` for what goes in it and why.
 *
 * A route handler rather than a file in `public/`, because the content is derived from the guide
 * and blog registries and a checked-in copy would be stale the day a guide publishes.
 *
 * `proxy.ts`'s matcher excludes any path containing a dot, so this is not locale-prefixed by the
 * i18n middleware and is served at the root — which is where the convention says to look for it.
 *
 * `text/plain` with an explicit UTF-8 charset: the file carries Arabic URLs and Dutch diacritics,
 * and a fetcher that guesses the encoding gets mojibake. `max-age` is a day with a week of
 * `stale-while-revalidate` — this is a map of the site, not a page, and serving a slightly old one
 * beats a slow one.
 */
import { llmsTxt } from '@/lib/llms';

export const dynamic = 'force-static';
export const revalidate = 86400;

export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Robots-Tag': 'all',
    },
  });
}
