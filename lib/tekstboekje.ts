/**
 * Het tekstboekje van een Lezen-examen: wie mag het lezen, en het bewijs voor de PDF-printer.
 *
 * Bij DUO staan de teksten van B1 Lezen op papier en de vragen op het scherm. Wij bieden de
 * teksten als PDF (om te printen of op een tweede scherm) en per tekst in een nieuw tabblad.
 * Het tekstboekje is een deel van het examen, dus dezelfde poort als de speler: ingelogd, en
 * `is_free` of `ownsModule`. De PDF-route opent de pagina in een headless Chromium zonder sessie;
 * die krijgt een bewijs van een uur mee (`pdfToken`, dezelfde HMAC als de gids-PDF).
 */
import { pdfToken, pdfTokenValid } from '@/lib/guides/pdf-token';
import { ownsModule } from '@/lib/entitlements';
import { createClient } from '@/lib/supabase/server';
import type { Level } from '@/data/skills';

const scope = (level: Level, number: number) => [`tekstboekje`, `${level}-lezen-${number}`, 'nl'] as const;

export function tekstboekjeToken(level: Level, number: number): string | null {
  return pdfToken(...scope(level, number));
}

/** 'ok', of waarom niet: geen sessie (naar inloggen) of geen toegang tot deze module. */
export async function tekstboekjeAccess(
  level: Level,
  number: number,
  isFree: boolean,
  token: string | null,
): Promise<'ok' | 'login' | 'denied'> {
  if (token && pdfTokenValid(token, ...scope(level, number))) return 'ok';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'login';
  if (isFree || ownsModule(user.user_metadata, level, 'lezen')) return 'ok';
  return 'denied';
}
