import { createClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { AUTH_REDIRECT, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export type Tokens = { accessToken: string; refreshToken: string };

/**
 * De app houdt zelf géén sessie vast: `persistSession` en `autoRefreshToken` staan uit.
 *
 * Na het inloggen gaan de tokens één keer naar `/api/app-session`, dat er de cookies van de
 * webview van maakt. Vanaf dat moment is de webview de enige houder. Zou de app het
 * refresh-token ook bewaren en verversen, dan trekt Supabase bij de tweede verversing de hele
 * sessie in (rotatie met hergebruikdetectie) en is de cursist op beide plekken uitgelogd.
 */
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

/** Leest `access_token` en `refresh_token` uit het fragment (of de query) van de terugkeer-URL. */
export function tokensFromUrl(url: string): Tokens | null {
  const raw = url.includes('#') ? url.slice(url.indexOf('#') + 1) : url.split('?')[1] ?? '';
  const params = new URLSearchParams(raw);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

/**
 * Google, in het systeemvenster (ASWebAuthenticationSession). Google weigert OAuth in een
 * ingebedde webview, dus dit kan niet in de webview van het portaal zelf.
 *
 * `null` betekent: de cursist heeft het venster gesloten. Dat is geen fout.
 */
export async function signInWithGoogle(): Promise<Tokens | null> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('no_url');

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT);
  if (result.type !== 'success') return null;

  const tokens = tokensFromUrl(result.url);
  if (!tokens) throw new Error('no_tokens');
  return tokens;
}

/** Apple, met de eigen knop van iOS. Het identiteitstoken wordt bij Supabase ingewisseld. */
export async function signInWithApple(): Promise<Tokens | null> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
  if (!credential.identityToken) throw new Error('no_identity_token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error || !data.session) throw error ?? new Error('no_session');

  // Apple geeft de naam alleen bij de allereerste keer inloggen mee; daarna nooit meer.
  const name = credential.fullName;
  const fullName = [name?.givenName, name?.middleName, name?.familyName].filter(Boolean).join(' ');
  if (fullName) {
    await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => {});
  }

  return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token };
}
