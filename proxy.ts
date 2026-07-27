import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// In Next.js 16 this file is called proxy.ts (renamed from middleware.ts).
// next-intl's createMiddleware handles:
//   - locale detection from URL path
//   - redirecting /  →  /nl/
//   - browser-language auto-detection for first-time visitors
//   - Link response headers with hreflang alternates
export default createMiddleware(routing);

export const config = {
  // Run on all paths except API routes, Next.js internals and static assets
  matcher: ['/((?!api|_next|_vercel|auth/callback|.*\\..*).*)'],
};
