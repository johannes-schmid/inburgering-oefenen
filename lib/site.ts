/**
 * Canonical origin for absolute URLs — canonicals, hreflang, Open Graph, JSON-LD @id.
 *
 * The literal is still hardcoded in ~25 other files that predate this module. New code should
 * import from here; converting the rest is a separate sweep, deliberately not bundled with a
 * content change.
 */
export const SITE_URL = 'https://inburgeringoefenen.nl';

/**
 * JSON-LD `@id` anchors defined in the homepage `@graph` — reference, never redefine.
 *
 * These three are the site-wide nodes. Any other page that needs the organisation, the docent
 * or the website points at these ids; restating the node with different values on a second page
 * is a contradiction no validator flags, and search engines resolve it by picking one.
 */
export const ORG_ID = `${SITE_URL}/#organization`;
export const TEACHER_ID = `${SITE_URL}/#teacher`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** BCP-47 tag for a locale, used by `inLanguage` and hreflang. */
export function langTag(locale: string): string {
  return locale === 'nl' ? 'nl-NL' : locale === 'ar' ? 'ar' : 'en';
}
