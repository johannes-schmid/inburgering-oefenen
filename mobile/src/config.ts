import { getLocales } from 'expo-localization';

/**
 * Waar de app naartoe praat. In een dev-build komt dit uit `.env.development` (de lokale stack
 * op 544xx en `next dev` op 3001), in een release-build uit `.env.production`.
 */
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL!.replace(/\/$/, '');
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const SCHEME = 'inburgeringoefenen';
export const AUTH_REDIRECT = `${SCHEME}://auth`;

export type Locale = 'nl' | 'en' | 'ar';
const SUPPORTED: Locale[] = ['nl', 'en', 'ar'];

/** De taal van het toestel als de site die heeft, anders Nederlands (de standaard van de site). */
export function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? 'nl';
  return (SUPPORTED as string[]).includes(code) ? (code as Locale) : 'nl';
}

export const dashboardPath = (locale: Locale) => `/${locale}/dashboard`;

/**
 * Paden waar je een pakket koopt of wijzigt. Apple staat in een app geen andere betaalweg dan
 * in-app-aankopen toe voor digitale abonnementen (richtlijn 3.1.1), dus de app opent ze niet.
 * `/premium` heet in het Arabisch anders; zie `i18n/routing.ts`.
 */
const PURCHASE_PATH = /\/dashboard\/pakketten(\/|$)|\/premium(\/|$)|\/betaling-gelukt(\/|$)|\/%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2%D8%A9|\/الباقة-المميزة/;
const PURCHASE_HOST = /(^|\.)mollie\.com$/;

export function isPurchaseUrl(raw: string): boolean {
  try {
    const url = new URL(raw, WEB_URL);
    return PURCHASE_HOST.test(url.hostname) || PURCHASE_PATH.test(url.pathname);
  } catch {
    return false;
  }
}

/** Het inlog- of registratiescherm van de site: in de app is dat het eigen inlogscherm. */
export const isAuthPath = (path: string) => /^\/(nl|en|ar)\/(login|register)(\/|$)/.test(path);

export function isSameSite(raw: string): boolean {
  try {
    return new URL(raw).origin === new URL(WEB_URL).origin;
  } catch {
    return false;
  }
}
