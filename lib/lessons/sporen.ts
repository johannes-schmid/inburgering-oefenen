/**
 * De leersporen — de vormen, en de pure functies erover.
 *
 * Een *spoor* is één stap van de leerroute op het onderdeelscherm; een *module* is een brok
 * lessen binnen dat spoor. Dat is de vorm die de woordkaarten al hadden (een raster thema's,
 * dan één deck) en sinds 02-09 hebben Grammatica en Examentraining hem ook: de lange
 * blokkenlijst met de tweede kolom ernaast is eraf (beslissing eigenaar). Elke module staat op
 * zichzelf, met één weg naar binnen en één weg terug.
 *
 * **Beide module-assen komen uit de database, geen van de twee is hier verzonnen.**
 * Grammatica splitst op `concept_groups` — Zinnen bouwen, Werkwoorden & tijd, … — want dat is
 * de as waarop de docent de concepten al heeft geordend. Examentraining splitst op
 * `lesson_blocks` C/D/E, want strategieconcepten hebben geen `group_id` en die blokken *zijn*
 * de indeling die de cursus daar heeft. Twee assen in één type is dus geen inconsistentie maar
 * het feit: `SpoorModule.slug` is de groepslug óf de blokletter, en welke van de twee weet
 * alleen `sporen-server.ts`.
 *
 * Client-veilig: geen import uit `lib/supabase/*`. Zelfde splitsing als `lessons.ts` /
 * `lessons-server.ts` en om dezelfde reden.
 */

import type { Level, OnderdeelSlug } from '@/data/skills';
import type { LessonSummary } from './lessons';

export type SpoorSlug = 'taalregels' | 'examentraining';

export const SPOREN: SpoorSlug[] = ['taalregels', 'examentraining'];

export function isSpoor(v: string): v is SpoorSlug {
  return (SPOREN as string[]).includes(v);
}

export type SpoorModule = {
  /** De conceptgroeplug (Taalregels) of de blokletter in kleine letters (Examentraining). */
  slug: string;
  name: string;
  intro: string | null;
  lessons: LessonSummary[];
  /**
   * Hoeveel regels in deze module je in dít onderdeel zélf goed moet doen — `null` voor een
   * module die geen regelmodule is (blok B van de cursus zelf, en het examenspoor).
   *
   * Dit is het enige wat `concept_onderdelen.weight` nog doet: deze telling zet de zwaarste
   * module bovenaan en zet het label op de kaart. Hij filtert niets meer weg; zie de kop van
   * `fetchRuleModules`.
   */
  kern?: number | null;
  done: number;
  total: number;
  pct: number;
};

export type Spoor = {
  slug: SpoorSlug;
  /**
   * De naam van dit spoor zoals de cursus hem zelf noemt, of `null` voor de vertaalde naam.
   *
   * Voor het regelspoor is dit **altijd `null`** sinds 10-09, en dat is bewust: de naam kwam
   * uit `lesson_blocks.name_nl` van blok B, en dat was waar zolang dat blok de hele stap wás.
   * Nu staat dat blok als één module tussen de regelmodules en heet de stap in elke cursus
   * Taalregels. Zie `sporenFromBlocks`. Het veld blijft bestaan voor het examenspoor.
   */
  name?: string | null;
  /** De inleiding uit `lesson_blocks.intro`, om dezelfde reden als `name`. */
  intro?: string | null;
  modules: SpoorModule[];
  done: number;
  total: number;
  pct: number;
};

// ---------------------------------------------------------------------------
// Paden
// ---------------------------------------------------------------------------

/**
 * Naast `leren` en niet eronder.
 *
 * `/leren/[lesSlug]` bestaat al, dus `/leren/[spoor]` zou op dezelfde dynamische positie
 * botsen — Next kan één segment niet twee keer dynamisch maken. `spoor` als eigen tak houdt
 * de les-URL's precies zoals ze zijn, en dat is wat het waard is: er staan lesslugs in
 * voortgang, in de zijbalk en in gedeelde links.
 */
export function spoorPath(level: Level, onderdeel: OnderdeelSlug, spoor: SpoorSlug): string {
  return `/dashboard/${level}/${onderdeel}/spoor/${spoor}`;
}

export function modulePath(
  level: Level,
  onderdeel: OnderdeelSlug,
  spoor: SpoorSlug,
  module: string,
): string {
  return `${spoorPath(level, onderdeel, spoor)}/${module}`;
}

// ---------------------------------------------------------------------------
// Afgeleid
// ---------------------------------------------------------------------------

/** De voortgang van één brok lessen: hoeveel er af zijn, en dat als percentage. */
export function tally(lessons: LessonSummary[]): { done: number; total: number; pct: number } {
  const done = lessons.filter(l => l.progress?.state === 'done').length;
  const total = lessons.length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/**
 * De les waar je in déze module verdergaat.
 *
 * Per module en niet per cursus: dat is het hele punt van deze indeling. `nextLesson()` in
 * `lessons.ts` loopt de hele cursus af en zou je uit de module gooien waar je net op geklikt
 * hebt.
 */
export function nextInModule(m: SpoorModule): LessonSummary | null {
  return m.lessons.find(l => l.progress?.state !== 'done') ?? m.lessons[0] ?? null;
}

/**
 * In welke module deze les zit — waar de terugknop van een les heen wijst.
 *
 * `null` als de les in geen enkel spoor zit: blok A (Woorden) valt daaronder, en dat is geen
 * fout maar een feit — die lessen horen bij de woordkaarten. De aanroeper valt dan terug op
 * het onderdeelscherm.
 */
export function findModule(
  sporen: Spoor[],
  lessonId: number,
): { spoor: Spoor; module: SpoorModule; index: number } | null {
  for (const spoor of sporen) {
    for (const [index, module] of spoor.modules.entries()) {
      if (module.lessons.some(l => l.id === lessonId)) return { spoor, module, index };
    }
  }
  return null;
}
