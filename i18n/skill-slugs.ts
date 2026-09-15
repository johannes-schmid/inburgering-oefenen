import { KNM_SLUG, SKILL_SLUGS, isSkillSlug, type OnderdeelSlug, type SkillSlug } from '@/data/skills';
import { routing, type Locale } from './routing';

/**
 * De onderdeelnaam zoals hij in de URL staat, per taal.
 *
 * Dit is de énige parameterwaarde die we vertalen, en dat is een bewuste uitzondering op de
 * regel in `routing.ts` dat parameterwaarden gelijk blijven. De reden is dat de waarde hier
 * geen door een docent geschreven slug is maar een gesloten lijst van vier die wij zelf
 * bepalen: next-intl kan hem niet omrekenen, maar wij wel, en zonder deze tabel wordt
 * `/en/practice-exam/a2/lezen` — een half vertaalde URL op precies het oppervlak dat moet
 * ranken.
 *
 * `SkillSlug` zelf verandert níét. Dat is de sleutel in `FORMATS`, `RULES`, `exams.skill` en de
 * hele database; dit is alleen de spelling aan de rand. Elke route rekent binnenkomend om met
 * `parseSkillParam` en bouwt uitgaand met `skillParam`.
 *
 * `knm`, `a2` en `b1` staan er bewust niet in: dat zijn de namen die DUO voert en die de
 * kandidaat op zijn uitslag ziet staan.
 */
const SKILL_PARAMS: Record<SkillSlug, Record<Locale, string>> = {
  lezen:     { nl: 'lezen',     en: 'reading',   ar: 'القراءة' },
  luisteren: { nl: 'luisteren', en: 'listening', ar: 'الاستماع' },
  schrijven: { nl: 'schrijven', en: 'writing',   ar: 'الكتابة' },
  spreken:   { nl: 'spreken',   en: 'speaking',  ar: 'التحدث' },
};

/** De onderdeelnaam voor in een URL van deze taal. */
export function skillParam(slug: SkillSlug, locale: string): string {
  return SKILL_PARAMS[slug]?.[locale as Locale] ?? slug;
}

/** Idem, maar voor oppervlakken die ook KNM kunnen bedoelen. */
export function onderdeelParam(slug: OnderdeelSlug, locale: string): string {
  return slug === KNM_SLUG ? KNM_SLUG : skillParam(slug, locale);
}

/**
 * Een URL-waarde terug naar de interne `SkillSlug`.
 *
 * Accepteert élke taal, niet alleen die van het huidige pad. Dat is expres: de Engelse en
 * Arabische URL's van vóór 15-09 dragen nog de Nederlandse naam, en die staan in verstuurde
 * mails, in de index en in links van buiten. Ze blijven dus werken; de pagina zet er een
 * canonical op naar de vertaalde variant, zodat het geen dubbele content wordt.
 */
export function parseSkillParam(value: string): SkillSlug | undefined {
  const decoded = safeDecode(value);
  if (isSkillSlug(decoded)) return decoded;
  return SKILL_SLUGS.find(slug =>
    routing.locales.some(locale => SKILL_PARAMS[slug][locale] === decoded),
  );
}

/** True als deze waarde de onderdeelnaam van een ánder pad is dan waar de lezer nu staat. */
export function isCanonicalSkillParam(value: string, slug: SkillSlug, locale: string): boolean {
  return safeDecode(value) === skillParam(slug, locale);
}

/**
 * Het volledige pad van een route in één taal, mét de vertaalde slug én de vertaalde
 * parameterwaarden. Dit is wat een canonical, een hreflang en de sitemap nodig hebben —
 * `routing.pathnames` kent de statische segmenten, niet de waarden erin.
 */
export function localizedPath(
  route: keyof typeof routing.pathnames,
  locale: string,
  params: Record<string, string> = {},
): string {
  const entry = routing.pathnames[route] as string | Record<string, string>;
  const template = typeof entry === 'string' ? entry : entry[locale as Locale] ?? entry.nl;

  const filled = Object.entries(params).reduce(
    (path, [name, value]) =>
      path.replace(`[${name}]`, name === 'skill' && isSkillSlug(value) ? skillParam(value, locale) : value),
    template,
  );

  return `/${locale}${filled}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
