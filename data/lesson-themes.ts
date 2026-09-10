/**
 * De namen van de woordthema's van de leerlaag.
 *
 * De slug is de waarheid: die staat in `lesson_words.theme` en is waar de URL en de groepering op
 * draaien. Dit bestand is er alleen voor het *label*, en `themeLabel` valt terug op de slug met
 * een hoofdletter — dus een thema dat de docent morgen toevoegt rendert netjes zonder dat hier
 * iets bij hoeft. Dat is bewust: een `Record` waar de pagina blind in grijpt zou bij een nieuw
 * thema een leeg kopje geven, en dat is precies het soort stille fout dat niemand in een
 * screenshot ziet.
 *
 * Dezelfde zes staan in `scripts/lesson-content/plan.mjs`, dat de woorden heeft geschreven. Die
 * kopie is niet weg te halen — het script is `.mjs` en kan dit bestand niet importeren — maar hij
 * is ook niet dragend: als de twee uit elkaar lopen, verandert er hier een kopje en breekt er
 * niets.
 *
 * De namen zijn Nederlands en blijven dat in elke locale, zoals de examenitems: het thema is
 * inhoud, geen chrome.
 */

export const LESSON_THEME_NAMES: Record<string, string> = {
  wonen: 'Wonen en de buurt',
  gezondheid: 'Gezondheid en de dokter',
  werk: 'Werk en solliciteren',
  gemeente: 'Gemeente, post en geld',
  winkelen: 'Winkelen en bestellen',
  school: 'School en kinderen',
};

export function themeLabel(slug: string): string {
  return LESSON_THEME_NAMES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * De volgorde waarin de thema's horen te staan — en dus welk thema "Thema 1" is.
 *
 * Dit moet expliciet, want `lesson_words.sort_order` sorteert *woorden* binnen een thema en zegt
 * niets over de thema's onderling. Zonder deze lijst was de nummering de volgorde waarin de eerste
 * woorden uit de query kwamen: "Thema 1" was Gemeente, en na één nieuw woord had het iets anders
 * kunnen zijn. Een nummer dat per query kan verschuiven is erger dan geen nummer.
 *
 * Het is dezelfde volgorde als in `scripts/lesson-content/plan.mjs`, waar de woorden zijn
 * geschreven: eerst waar een nieuwkomer het eerst mee te maken krijgt.
 */
export const LESSON_THEME_ORDER: string[] = [
  'wonen', 'gezondheid', 'werk', 'gemeente', 'winkelen', 'school',
];

/** Een onbekend thema komt achteraan, alfabetisch — nooit tussen de zes in. */
export function themeRank(slug: string): number {
  const i = LESSON_THEME_ORDER.indexOf(slug);
  return i === -1 ? LESSON_THEME_ORDER.length : i;
}
