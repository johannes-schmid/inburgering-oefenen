/**
 * De overstap van de knmoefenen.nl-lijst: één code, één percentage, één landingspagina.
 *
 * Gedeeld door de e-mail (lib/email/templates/knmMigration.ts) en de pagina `/welkom-knm`, zodat
 * de mail nooit een korting belooft die de pagina anders noemt. De code zelf wordt bij het
 * afrekenen gevalideerd tegen de kortingscodes — dit bestand belooft alleen wat er in de mail staat.
 */
import { applyDiscount } from './pricing';

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

/** De maandprijs met de code, voor `/welkom-knm` en de mail — dezelfde som als de checkout. */
export function knmMigrationPriceCents(cents: number): number {
  return applyDiscount(cents, KNM_MIGRATION_PCT);
}
