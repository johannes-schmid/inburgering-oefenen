/**
 * `localStorage`, so a returning visitor lands on their timeline instead of the wizard.
 *
 * What is stored is the **encoded state string and nothing else** — the same opaque, non-identifying
 * string the URL carries. No name, no e-mail, no date columns. If a shared phone is involved (which
 * this audience often means), the worst a second person learns is a route and a month.
 *
 * Every call is guarded: `localStorage` throws in Safari private mode and in embedded webviews with
 * storage disabled, and a planning tool must not white-screen because a browser said no.
 */
const KEY = 'tijdlijn:v1:last';

export function saveState(encoded: string): void {
  try {
    window.localStorage.setItem(KEY, encoded);
  } catch {
    /* Storage disabled or full. The URL still carries the state, so nothing is actually lost. */
  }
}

export function loadState(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* Nothing to do — and "start over" must never be the action that throws. */
  }
}
