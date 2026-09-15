/**
 * De woordkaarten van de leerlaag — de pure kant.
 *
 * Dit is de A2/B1-tegenhanger van de 366 KNM-kaarten in `word_cards`, en het is bewust een
 * andere tabel: `lesson_words` kent `usage` (receptief of productief) en `frame` (de vaste
 * constructie: *zich melden bij*), en dat verschil is het leerdoel van een woordenles. Een
 * boolean "gekend" over een lijst zonder dat onderscheid is een lijst zonder leerdoel.
 *
 * Zie `supabase/migrations/20260902100000_lesson_word_cards.sql` voor waarom de voortgang niet in
 * `user_word_card_progress` kan.
 */

import type { Level, OnderdeelSlug } from '@/data/skills';

/** `unseen → seen → learning | known`. Dezelfde vier als de KNM-deck, zodat de knoppen kloppen. */
export type WordStatus = 'unseen' | 'seen' | 'learning' | 'known';

export const WORD_STATUSES: WordStatus[] = ['unseen', 'seen', 'learning', 'known'];

/**
 * De drie talen op de kaart, en ze staan los van de locale van de pagina.
 *
 * Turks hoort erbij om dezelfde reden als bij de KNM-deck: de kaart is de plek waar een kandidaat
 * zijn eigen taal vindt terwijl de interface Nederlands blijft. Het portaal heeft geen tr-locale
 * en dat verandert hier niets — `messages/tr.json` bestaat niet en hoeft niet te bestaan.
 */
export type WordCardLang = 'en' | 'ar' | 'tr';

export const WORD_CARD_LANGS: WordCardLang[] = ['en', 'ar', 'tr'];

/** Het eigen woord van elke taal, want een taalknop in het Nederlands helpt niemand. */
export const WORD_CARD_LANG_LABEL: Record<WordCardLang, string> = {
  en: 'English',
  ar: 'العربية',
  tr: 'Türkçe',
};

export type LessonWord = {
  id: number;
  theme: string;
  dutch: string;
  /** `de` of `het`, of null bij een werkwoord of bijvoeglijk naamwoord. */
  article: string | null;
  plural: string | null;
  /** De vaste constructie, als het woord die heeft. */
  frame: string | null;
  /** De betekenis in eenvoudig Nederlands — van de docent. */
  meaningNl: string;
  example: string | null;
  usage: 'receptief' | 'productief';
  /**
   * De foto, of null. Zelfde rol als op een KNM-kaart: de voorkant is dan het beeld plus het
   * woord in plaats van alleen het woord.
   *
   * Null is de normale toestand voor een net geschreven woord en geen fout — de kaart valt terug
   * op de tekstvoorkant die hij altijd had, en niet op een grijs vlak.
   */
  imageUrl: string | null;
  /** De uitspraak van het woord zelf. */
  audioUrl: string | null;
  /**
   * De uitspraak van de voorbeeldzin, los van het woord.
   *
   * Twee sporen en niet één bestand: klemtoon en `frame` (*zich melden bij*) zijn pas hoorbaar in
   * een zin, en wie het woord nog een keer wil horen hoort niet de hele zin af te wachten.
   */
  exampleAudioUrl: string | null;
  /**
   * Machinaal gemaakte vertalingen, per taal, of null als die er niet is.
   *
   * **Ze zijn niet door de docent nagekeken** tenzij `translationsReviewed`, en de kaart moet dat
   * zeggen — zelfde regel als `guides.translated_note`. De Nederlandse kant is wél van haar; dat
   * is de kant waar de claim van het product over gaat.
   */
  translations: Record<WordCardLang, string | null>;
  translationsReviewed: boolean;
  status: WordStatus;
};

export type WordTheme = {
  /** De slug uit `lesson_words.theme` — `wonen`, `gemeente`, … */
  slug: string;
  words: LessonWord[];
  known: number;
  /** Alles wat is aangeraakt: `seen`, `learning` of `known`. */
  touched: number;
  pct: number;
};

/** Hoeveel woorden er in dit onderdeel zitten en hoeveel ervan gekend zijn. */
export type WordTotals = { known: number; total: number; pct: number };

export function themeTotals(themes: WordTheme[]): WordTotals {
  const total = themes.reduce((n, t) => n + t.words.length, 0);
  const known = themes.reduce((n, t) => n + t.known, 0);
  return { known, total, pct: total > 0 ? Math.round((known / total) * 100) : 0 };
}

/** Het pad van het woordkaartenoverzicht. Zonder localeprefix, zoals de rest van `lessons.ts`. */
export function wordsPath(level: Level, onderdeel: OnderdeelSlug): string {
  return `/dashboard/${level}/${onderdeel}/woorden`;
}

export function wordThemePath(level: Level, onderdeel: OnderdeelSlug, theme: string): string {
  return `${wordsPath(level, onderdeel)}/${theme}`;
}

/**
 * Welke kaarten een oefenronde krijgt, en in welke volgorde.
 *
 * **Nog niet gekend eerst, en gekende kaarten helemaal niet** — zolang er nog iets te leren is.
 * Wie twintig van de vierentwintig woorden kent en op "verder" drukt hoort niet eerst door die
 * twintig te klikken; dat is de snelste manier om een deck te laten aanvoelen als straf.
 *
 * Is alles gekend, dan gaat het hele thema terug in de ronde: dan is "verder" een herhaling en
 * niet een lege lijst. `learning` staat vóór `unseen`, want dat is wat de kandidaat zelf heeft
 * aangewezen als "hier moet ik nog aan werken".
 */
export function practiceOrder(words: LessonWord[]): LessonWord[] {
  const rank: Record<WordStatus, number> = { learning: 0, unseen: 1, seen: 2, known: 3 };
  const open = words.filter(w => w.status !== 'known');
  const pool = open.length > 0 ? open : words;
  return [...pool].sort((a, b) => rank[a.status] - rank[b.status]);
}

/**
 * Het thema waar je verdergaat — het eerste dat nog niet helemaal gekend is.
 *
 * Dit is wat `wordsPath()` sinds 15-09 opent (eigenaar). Het themaraster is vervallen om
 * dezelfde reden als het spooroverzicht: alle thema's staan nu in de tweede kolom naast de
 * deck, en een scherm dat hetzelfde zegt is een tussenstop tussen twee klikken.
 *
 * Alles gekend → het eerste thema, zodat "verder" een herhaling opent en geen lege pagina.
 * Een leeg thema wordt overgeslagen: dat is geen voortgang maar een gat in de inhoud.
 */
export function nextTheme(themes: WordTheme[]): WordTheme | null {
  const filled = themes.filter(t => t.words.length > 0);
  return filled.find(t => t.known < t.words.length) ?? filled[0] ?? null;
}
