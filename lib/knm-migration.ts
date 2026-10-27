/**
 * De overstap van de knmoefenen.nl-lijst: één code, één percentage, één landingspagina.
 *
 * Gedeeld door de e-mail (lib/email/templates/knmMigration.ts) en de pagina `/welkom-knm`, zodat
 * de mail nooit een korting belooft die de pagina anders noemt. De code zelf wordt bij het
 * afrekenen gevalideerd tegen de kortingscodes — dit bestand belooft alleen wat er in de mail staat.
 */
export const KNM_MIGRATION_CODE = 'KNM10';
export const KNM_MIGRATION_PCT = 10;

export type KnmMigrationSegment = 'paid' | 'free';

export function knmMigrationLandingUrl(locale: string, segment: KnmMigrationSegment): string {
  const q = new URLSearchParams({
    code: KNM_MIGRATION_CODE,
    utm_source: 'knmoefenen',
    utm_medium: 'email',
    utm_campaign: 'knm_migration',
    utm_content: segment,
  });
  return `https://inburgeringoefenen.nl/${locale}/welkom-knm?${q}`;
}

/**
 * De maandprijs met de code, voor de prijsblokken op `/welkom-knm`. Afgerond op hele centen
 * (€9,95 → €8,96); het afrekenen moet precies zo afronden, anders noemt de pagina een ander
 * bedrag dan Mollie vraagt.
 */
export function knmMigrationPriceCents(cents: number): number {
  return Math.round((cents * (100 - KNM_MIGRATION_PCT)) / 100);
}
