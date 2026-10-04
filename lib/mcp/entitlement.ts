import { ownsKnm, ownsModule } from '@/lib/entitlements';
import { isKnm, type Level, type OnderdeelSlug } from '@/data/skills';
import type { Gate, GateReason, Tier } from './types';

/**
 * Wie mag wat in de ChatGPT-app. Puur, zonder database — daarom testbaar.
 *
 * Drie lagen, besluit eigenaar 04-10:
 *   anonymous  → alleen de tien proefvragen per onderdeel (altijd dezelfde, één keer)
 *   connected  → oefenexamen 1 van elk gepubliceerd onderdeel (`exams.is_free`), voortgang opgeslagen
 *   module     → examen 1–10 van dat onderdeel, adaptief oefenen, Schrijven nakijken op het betaalde plafond
 *
 * Het antwoord op "heeft deze kandidaat betaald" komt uitsluitend uit `ownsModule()`/`ownsKnm()`,
 * dezelfde functies als de speler op de site. Niets hier vertrouwt iets wat ChatGPT meestuurt.
 */
export const TASTER_LIMIT = 10;

export function tierFor(
  meta: Record<string, unknown> | null,
  level: Level | null,
  onderdeel: OnderdeelSlug,
): Tier {
  if (meta === null) return 'anonymous';
  if (isKnm(onderdeel)) return ownsKnm(meta) ? 'module' : 'connected';
  if (level === null) return 'connected';
  return ownsModule(meta, level, onderdeel) ? 'module' : 'connected';
}

/** Mag deze laag dít examen openen? Anoniem opent nooit een examen, alleen de taster. */
export function canOpenExam(tier: Tier, isFree: boolean): boolean {
  if (tier === 'module') return true;
  if (tier === 'connected') return isFree;
  return false;
}

export function siteUrl(): string {
  return (process.env.BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

const UTM = 'utm_source=chatgpt&utm_medium=app';

export function registerUrl(): string {
  return `${siteUrl()}/nl/register?${UTM}`;
}

export function premiumUrl(level: Level | null, onderdeel: OnderdeelSlug): string {
  const moduleId = isKnm(onderdeel) ? 'knm' : `${level ?? 'a2'}:${onderdeel}`;
  return `${siteUrl()}/nl/premium?vanaf=${encodeURIComponent(moduleId)}&${UTM}`;
}

export function onderdeelLabel(level: Level | null, onderdeel: OnderdeelSlug): string {
  if (isKnm(onderdeel)) return 'KNM';
  const name = onderdeel.charAt(0).toUpperCase() + onderdeel.slice(1);
  return level ? `${level.toUpperCase()} ${name}` : name;
}

export function gateFor(reason: GateReason, level: Level | null, onderdeel: OnderdeelSlug): Gate {
  const label = onderdeelLabel(level, onderdeel);
  switch (reason) {
    case 'login_required':
      return {
        reason,
        title_nl: 'Koppel je account',
        message_nl: `Koppel je account van Inburgering Oefenen om je voortgang op te slaan en oefenexamen 1 van ${label} te maken. Een account is gratis.`,
        message_en: `Connect your Inburgering Oefenen account to save your progress and take practice exam 1 of ${label}. An account is free.`,
        action: { label_nl: 'Gratis account maken', label_en: 'Create a free account', url: registerUrl() },
      };
    case 'taster_exhausted':
      return {
        reason,
        title_nl: 'Je proefvragen zijn op',
        message_nl: `Je hebt de tien gratis proefvragen van ${label} gemaakt. Met een gratis account maak je het hele eerste oefenexamen en bewaren we je voortgang.`,
        message_en: `You have done the ten free sample questions for ${label}. With a free account you can take the whole first practice exam and we keep your progress.`,
        action: { label_nl: 'Gratis account maken', label_en: 'Create a free account', url: registerUrl() },
      };
    case 'module_required':
      return {
        reason,
        title_nl: `${label} is onderdeel van een pakket`,
        message_nl: `Oefenexamen 1 van ${label} is gratis. De andere negen examens en het oefenen op je zwakke punten zitten in de module ${label}. Op Inburgering Oefenen lees je wat die kost.`,
        message_en: `Practice exam 1 of ${label} is free. The other nine exams and practice on your weak points are part of the ${label} module. Inburgering Oefenen explains what it costs.`,
        action: { label_nl: 'Bekijk de module', label_en: 'See the module', url: premiumUrl(level, onderdeel) },
      };
    case 'grading_limit':
      return {
        reason,
        title_nl: 'Nakijken is nu even niet mogelijk',
        message_nl: `Het gratis aantal nagekeken opdrachten voor ${label} is bereikt, of je hebt het te snel achter elkaar geprobeerd. In de module ${label} is nakijken vrijwel onbeperkt.`,
        message_en: `The free number of graded tasks for ${label} has been used, or you tried too often in a row. In the ${label} module grading is practically unlimited.`,
        action: { label_nl: 'Bekijk de module', label_en: 'See the module', url: premiumUrl(level, onderdeel) },
      };
    case 'unavailable':
      return {
        reason,
        title_nl: `${label} oefen je op de website`,
        message_nl: `${label} is in ChatGPT nog niet beschikbaar. Op Inburgering Oefenen kun je het wel oefenen.`,
        message_en: `${label} is not available in ChatGPT yet. You can practise it on Inburgering Oefenen.`,
        action: { label_nl: 'Naar Inburgering Oefenen', label_en: 'Go to Inburgering Oefenen', url: `${siteUrl()}/nl/platform?${UTM}` },
      };
  }
}
