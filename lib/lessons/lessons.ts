/**
 * De vormen van de leerlaag, en de pure functies erover.
 *
 * Client-veilig: geen enkele import uit `lib/supabase/*`. De queries staan in
 * `lessons-server.ts` en `concepts-server.ts`. Dezelfde splitsing als
 * `backlog.ts` / `backlog-server.ts`, en om dezelfde reden — de leseditor en de lesstroom zijn
 * clientcomponenten, en één module zou `lib/supabase/server` de browserbundle in sleuren en de
 * build laten falen.
 */

import type { Level, OnderdeelSlug } from '@/data/skills';
import { isExerciseKind, type LessonItem, type Tier } from './items';

// ---------------------------------------------------------------------------
// Publicatie
// ---------------------------------------------------------------------------

/**
 * `pending` is nog niet nagekeken, `validated` is door de docent goedgekeurd.
 *
 * Dezelfde twee waarden als `stimuli.review_status` en `open_tasks.review_status`. Het plan
 * noemde de eerste "draft"; een derde woord voor dezelfde toestand is een derde plek om het
 * verkeerd te lezen.
 */
export type ReviewStatus = 'pending' | 'validated';

/**
 * Alleen `validated` is publiek.
 *
 * Dit is de reviewgate en hij is echt, anders dan bij de A2-examendataset — die schreef
 * `validated` vóór de docent ernaar had gekeken, en dat veld is het enige in dit systeem dat
 * liegt. Lescontent is de plek waar die kortere weg het duurst is: de belofte van de laag is
 * dat er iemand voor staat.
 *
 * Let op wat dit NIET is: een `pending`-les is langs zijn URL leesbaar (RLS is publiek lezen,
 * net als bij `questions`). Precies dát maakt reviewen mogelijk. Wat de gate doet is hem uit
 * elk *blok*, elke *voortgang* en elk *menu* houden.
 */
export function isPublished(status: ReviewStatus): boolean {
  return status === 'validated';
}

// ---------------------------------------------------------------------------
// Concepten
// ---------------------------------------------------------------------------

export type ConceptKind = 'grammatica' | 'woordenschat' | 'strategie';

export type ConceptGroup = {
  id: number;
  slug: string;
  name_nl: string;
  sort_order: number;
};

export type Concept = {
  id: number;
  level: Level;
  slug: string;
  name_nl: string;
  kind: ConceptKind;
  one_liner: string;
  example_html: string | null;
  group: ConceptGroup | null;
  /**
   * De "KOMT IN LEZEN · SCHRIJVEN · LUISTEREN"-chips.
   *
   * Een `grammatica`-concept staat hier vaak vier keer, een `strategie`-concept altijd precies
   * één keer: examenvakmanschap hoort bij één onderdeel, en dat is het hele antwoord op "hoe
   * bereid je iemand voor die alleen Luisteren doet".
   */
  onderdelen: OnderdeelSlug[];
};

/** Eén concept met zijn uitleg erbij — alleen de detailpagina heeft dit nodig. */
export type ConceptDetail = Concept & {
  body_html: string | null;
  /**
   * De reviewgate, ook op de detailpagina.
   *
   * `fetchConcept` geeft een `pending` concept wél terug — precies dát maakt reviewen mogelijk
   * — dus de pagina moet zelf beslissen. Zonder dit veld zou een nog niet nagekeken concept
   * gewoon publiek staan, en dan was de gate alleen op de overzichtspagina echt.
   */
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_on: string | null;
};

/**
 * Waar dit concept in geoefend kan worden, en of deze kandidaat daar toegang tot heeft.
 *
 * Dit is de kern van "één concept, vier manieren van oefenen": de uitleg is gedeeld, de
 * oefening niet. Een spoor waar de kandidaat geen toegang tot heeft wordt getoond als
 * aanbod — niet weggelaten (dan lijkt het concept smaller dan het is) en niet als bezit
 * (dan zegt de pagina dat je iets hebt waar de speler je uit gooit).
 */
export type ConceptTrack = {
  onderdeel: OnderdeelSlug;
  level: Level | null;
  /** De les die dit concept in dit onderdeel uitlegt (`role = 'teaches'`), als die er is. */
  lesson: { id: number; slug: string; title: string; blockLetter: string } | null;
  owned: boolean;
  href: string;
};

// ---------------------------------------------------------------------------
// Blokken en lessen
// ---------------------------------------------------------------------------

export type LessonSummary = {
  id: number;
  slug: string;
  title: string;
  minutes: number | null;
  is_free: boolean;
  sort_order: number;
  /** Van deze kandidaat. `null` als er nog niets is gedaan of niemand is ingelogd. */
  progress: { state: 'started' | 'done'; items_done: number; items_total: number } | null;
};

export type LessonBlock = {
  id: number;
  letter: string;
  name_nl: string;
  intro: string | null;
  sort_order: number;
  lessons: LessonSummary[];
  /** De "Wat kun je nu?"-lijst waarmee het blok afsluit. */
  outcomes: { text: string; lesson_ids: number[] }[];
};

/** Eén hele les, zoals de lesstroom hem rendert. */
export type LessonDetail = {
  id: number;
  slug: string;
  title: string;
  what_you_learn: string | null;
  minutes: number | null;
  is_free: boolean;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_on: string | null;
  block: { id: number; letter: string; name_nl: string; level: Level | null; onderdeel: OnderdeelSlug };
  items: LessonItem[];
  /** Wat deze les uitlegt, voor de conceptrail naast de stroom. */
  concepts: { id: number; slug: string; name_nl: string; role: 'teaches' | 'reviews' }[];
};

// ---------------------------------------------------------------------------
// Voortgang, afgeleid
// ---------------------------------------------------------------------------

/**
 * Hoeveel opgaven een les heeft.
 *
 * Alleen opgaven tellen: een les die voor de helft uit uitleg bestaat mag niet op "50% gedaan"
 * staan zodra je hem opent. Uitleg lees je, opgaven maak je, en de voortgang gaat over het
 * tweede.
 */
export function exerciseCount(items: { kind: string }[]): number {
  return items.filter(i => isExerciseKind(i.kind)).length;
}

/** De voortgang van één blok: hoeveel van zijn lessen afgerond zijn. */
export function blockProgress(block: LessonBlock): { done: number; total: number } {
  return {
    done: block.lessons.filter(l => l.progress?.state === 'done').length,
    total: block.lessons.length,
  };
}

/**
 * De cursusvoortgang van één onderdeel, als één percentage.
 *
 * Over de *lessen*, niet over de opgaven: een blok met vier korte lessen en een blok met vier
 * lange wegen dan even zwaar, wat klopt met hoe de kandidaat het leest ("30 van 62 lessen").
 * Een cursus zonder lessen is 0 en niet NaN — die deling is de reden dat dit een functie is.
 */
export function courseProgressPct(blocks: LessonBlock[]): number {
  const total = blocks.reduce((n, b) => n + b.lessons.length, 0);
  if (total === 0) return 0;
  const done = blocks.reduce((n, b) => n + blockProgress(b).done, 0);
  return Math.round((done / total) * 100);
}

/**
 * De les waar deze kandidaat verdergaat: de eerste die nog niet af is, in cursusvolgorde.
 *
 * `null` als alles af is — de aanroeper zegt dan iets anders dan "ga verder", want een
 * knop die naar de laatste les terugwijst leest als een fout.
 */
export function nextLesson(blocks: LessonBlock[]): { block: LessonBlock; lesson: LessonSummary } | null {
  for (const block of [...blocks].sort((a, b) => a.sort_order - b.sort_order)) {
    for (const lesson of [...block.lessons].sort((a, b) => a.sort_order - b.sort_order)) {
      if (lesson.progress?.state !== 'done') return { block, lesson };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Beheersing
// ---------------------------------------------------------------------------

export type Mastery = {
  concept_id: number;
  seen: number;
  correct: number;
  streak: number;
  seen_receptief: number;
  correct_receptief: number;
  seen_productief: number;
  correct_productief: number;
  mastery_pct: number;
};

/** Hoeveel goede antwoorden op rij een concept op "beheerst" zet. */
export const MASTERY_STREAK = 8;

/** Vanaf welk percentage we een concept beheerst noemen. */
export const MASTERY_THRESHOLD = 80;

/**
 * Het beheersingspercentage van een concept.
 *
 * **Dit is ONS getal en het heet ook zo.** Het is geen voorspelling van een DUO-uitslag:
 * `SEO/facts.md` §9 verbiedt het publiceren van een onnavolgbare slaagnorm, en een percentage
 * dat als slaagkans leest zou precies dat doen. De formule staat daarom hier, in één plek, en
 * niet verspreid over de schermen die hem tonen.
 *
 * Receptief en productief wegen even zwaar zodra er van beide iets is. Een kandidaat die tien
 * meerkeuzevragen goed heeft en nooit een zin heeft gebouwd staat dus niet op 100% — dat is
 * het hele punt van de trap, en een gemiddelde over alle opgaven zou het weggommen.
 */
export function masteryPct(m: Pick<Mastery,
  'seen' | 'correct' | 'seen_receptief' | 'correct_receptief' | 'seen_productief' | 'correct_productief'>
): number {
  const rec = m.seen_receptief > 0 ? m.correct_receptief / m.seen_receptief : null;
  const pro = m.seen_productief > 0 ? m.correct_productief / m.seen_productief : null;

  if (rec !== null && pro !== null) return Math.round(((rec + pro) / 2) * 100);
  if (rec !== null) {
    // Alleen receptief bewijs. Dat is echt bewijs, maar het bewijst de helft, en het
    // maximum hoort dat te zeggen — anders leest "100%" als "hier ben je klaar".
    return Math.round(rec * 50);
  }
  if (pro !== null) return Math.round(pro * 100);
  return m.seen > 0 ? Math.round((m.correct / m.seen) * 100) : 0;
}

export function isMastered(m: Mastery): boolean {
  return m.mastery_pct >= MASTERY_THRESHOLD && m.streak >= MASTERY_STREAK;
}

/** Wat de conceptkaart onder de ring zegt. */
export type MasteryState = 'niet-begonnen' | 'bezig' | 'bijna' | 'beheerst';

export function masteryState(m: Mastery | null | undefined): MasteryState {
  if (!m || m.seen === 0) return 'niet-begonnen';
  if (isMastered(m)) return 'beheerst';
  return m.mastery_pct >= 60 ? 'bijna' : 'bezig';
}

/**
 * Het zwakste punt eerst: waar deze kandidaat het meest aan heeft.
 *
 * Concepten waar iets van bekend is en die nog niet beheerst zijn, oplopend op beheersing.
 * Nooit-begonnen concepten staan er bewust *niet* bovenaan: "je hebt hier nog niets gedaan"
 * is geen zwak punt maar de hele cursus, en de rail moet één ding aanraden.
 */
export function weakestFirst(
  concepts: Concept[],
  mastery: Map<number, Mastery>,
  limit = 3,
): { concept: Concept; mastery: Mastery }[] {
  return concepts
    .map(c => ({ concept: c, mastery: mastery.get(c.id) }))
    .filter((x): x is { concept: Concept; mastery: Mastery } =>
      !!x.mastery && x.mastery.seen > 0 && !isMastered(x.mastery))
    .sort((a, b) => a.mastery.mastery_pct - b.mastery.mastery_pct)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Paden
// ---------------------------------------------------------------------------

/**
 * De URL's van de leerlaag, op één plek.
 *
 * Zonder locale-prefix, zoals `lib/portal-menu.ts` het ook doet: de aanroeper zet die ervoor.
 * Ze staan hier bij elkaar omdat vier losse ternaries over `level === null` precies de vorm
 * is die `guideHref()` in `data/guides/helpers.ts` heeft moeten repareren — daar routeerde
 * elke variant type-correct naar de verkeerde pagina.
 */
export function coursePath(level: Level, onderdeel: OnderdeelSlug): string {
  return `/dashboard/${level}/${onderdeel}/leren`;
}

export function lessonPath(level: Level, onderdeel: OnderdeelSlug, slug: string): string {
  return `${coursePath(level, onderdeel)}/${slug}`;
}

export function conceptsPath(level: Level): string {
  return `/dashboard/${level}/concepten`;
}

export function conceptPath(level: Level, slug: string): string {
  return `${conceptsPath(level)}/${slug}`;
}

/** De trap van een opgave, als leesbaar label voor de UI. */
export function tierChip(tier: Tier | null): string | null {
  if (tier === null) return null;
  return tier === 0 ? 'herkennen' : tier === 1 ? 'invullen' : 'zelf maken';
}
