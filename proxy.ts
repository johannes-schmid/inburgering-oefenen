import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { canonicalContentPath, canonicalSkillPath } from './i18n/paths';

// In Next.js 16 this file is called proxy.ts (renamed from middleware.ts).
// next-intl's createMiddleware handles:
//   - locale detection from URL path
//   - redirecting /  →  /nl/
//   - browser-language auto-detection for first-time visitors
//   - de vertaalde slug per taal, inclusief de 308 vanaf de Nederlandse variant
//   - Link response headers met hreflang — uitgezet via `alternateLinks` in `i18n/routing.ts`
const handleI18n = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  /* De onderdeelnaam in het pad is een parameterwaarde, en die vertaalt next-intl niet mee: het
   * kent alleen de statische segmenten. `/en/practice-exam/a2/lezen` is dus een werkende URL
   * naast `/en/practice-exam/a2/reading` — twee vindplaatsen voor één pagina.
   *
   * Dit moet hier gebeuren en niet op de pagina. De overzichtspagina wordt statisch gerenderd,
   * en een `permanentRedirect()` in een statische render levert een 200 met de omleiding ín de
   * pagina in plaats van een 308. Zie `canonicalSkillPath` in `i18n/paths.ts`. */
  /* Dezelfde redenering geldt voor de gids- en blogslug, die sinds 15-09 óók per taal
   * verschilt: `/en/civic-integration/wonen` is een werkende URL naast
   * `/en/civic-integration/housing`. Zie `canonicalContentPath`. */
  const canonical =
    canonicalSkillPath(request.nextUrl.pathname) ?? canonicalContentPath(request.nextUrl.pathname);
  if (canonical) {
    const url = new URL(request.nextUrl);
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }

  return handleI18n(request);
}

export const config = {
  // Run on all paths except API routes, Next.js internals and static assets
  matcher: ['/((?!api|_next|_vercel|auth/callback|.*\\..*).*)'],
};
