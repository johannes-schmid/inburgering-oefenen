/**
 * Auth helpers shared by the server pages and the client panel.
 *
 * These deliberately live outside `components/auth/AuthPanel.tsx`. That file is
 * `'use client'`, and a function exported from a client module cannot be *called* on the
 * server — only rendered as a component or passed as a prop. The login page calling
 * `authErrorMessage()` during its server render is exactly the error Next reports as
 * "attempted to call X from the server but X is on the client".
 */

/** Only same-site absolute paths survive; anything else falls back to the default. */
export function safeNext(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
}

/**
 * `?error=` is resolved on the server and handed to the panel as a prop. Reading it from
 * `window.location` in an effect rendered the card once without the message, which on a slow
 * paint read as a successful login.
 */
export function authErrorMessage(code: string | null | undefined): string {
  if (!code) return '';
  if (code === 'not_admin') return 'Dit Google-account heeft geen toegang tot het beheerpaneel.';
  return 'Er is iets misgegaan. Probeer het opnieuw.';
}
