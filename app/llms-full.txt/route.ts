/**
 * `GET /llms-full.txt` — every published kennisgids as plain text, in one fetch.
 *
 * The companion to `/llms.txt`: that file is the map, this is the territory. It exists because the
 * alternative for a model that wants the answer rather than the link is 23 separate fetches of
 * HTML pages whose markup is mostly comparison cards and inline SVG.
 *
 * Dutch only, and gated on `publishedGuides()` — see `lib/llms.ts`.
 */
import { llmsFullTxt } from '@/lib/llms';

export const dynamic = 'force-static';
export const revalidate = 86400;

export function GET() {
  return new Response(llmsFullTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Robots-Tag': 'all',
    },
  });
}
