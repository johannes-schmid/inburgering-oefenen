/**
 * Canonical origin for absolute URLs — canonicals, hreflang, Open Graph, JSON-LD @id.
 *
 * The literal is still hardcoded in ~25 other files that predate this module. New code should
 * import from here; converting the rest is a separate sweep, deliberately not bundled with a
 * content change.
 */
export const SITE_URL = 'https://inburgeringoefenen.nl';

/** JSON-LD @id anchors defined in the homepage @graph — reference, never redefine. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const TEACHER_ID = `${SITE_URL}/#teacher`;

/** BCP-47 tag for a locale, used by `inLanguage` and hreflang. */
export function langTag(locale: string): string {
  return locale === 'nl' ? 'nl-NL' : locale === 'ar' ? 'ar' : 'en';
}
