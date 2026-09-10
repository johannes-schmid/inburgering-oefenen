import { DEFAULT_LEVEL, KNM_SLUG, LEVELS, isKnm, isLevel, levelLabel, type Level } from '@/data/skills';

/**
 * The admin navigation, in one place, because there are two of them.
 *
 * The desktop sidebar and the mobile drawer had drifted already — the mobile one listed
 * Woordkaarten above the divider and ordered Examens after Vragen. A single definition means a
 * new section cannot be added to one and forgotten in the other.
 */
export type AdminNavItem = {
  /** Path after `/{locale}/admin`; `''` is the dashboard itself. */
  path: string;
  icon: string;
  label: string;
  /**
   * Does this surface hold separate content per CEFR level?
   *
   * Where it does, the level belongs in the navigation rather than in a dropdown on the page:
   * A2 and B1 are two separately authored catalogues, and "which level am I working on" is the
   * first decision the docent makes, not a filter she applies afterwards. Levelled items get a
   * sub-menu and their pages read `?niveau=`.
   *
   * **KNM appears in that sub-menu as a third tab**, even though it has no level. The menu's
   * real question is "which catalogue am I working on", and KNM is a third catalogue; leaving
   * it out would make its 419 questions and eleven exam slots unreachable from admin
   * altogether. Its param value is `knm` and it resolves to `level = null`.
   */
  levelled?: boolean;
  /**
   * Does the KNM tab apply to this section?
   *
   * Rubrics: no. KNM is `scoring: 'mcq'` — there is nothing to grade against a rubric, so a KNM
   * rubrics tab would open an authoring screen for a thing that cannot exist.
   */
  knm?: boolean;
  /**
   * Extra kinderen onder de niveautabs, met hun eigen pad.
   *
   * Dit is hoe **Woordkaarten** onder Woorden hangt (besluit eigenaar, 10-09). Het waren twee
   * ingangen in de zijbalk voor twee tabellen, en dat blijven ze in de database ook — maar de
   * vraag die de docent stelt is "welke woordenlijst", en KNM is daar een derde catalogus van,
   * net zoals bij Examens en Vragen. Een kind met een eigen `path` gaat dus níet via
   * `?niveau=`: `/admin/woordkaarten` heeft geen niveau-as en zou er ook niets mee doen.
   */
  extra?: { label: string; path: string }[];
};

/**
 * Eén kop met de rijen eronder.
 *
 * De zijbalk was één lijst van tien rijen met één streep erdoor, en die streep scheidde niets
 * inhoudelijks: Woordkaarten stond eronder los van Woorden, Rubrieken tussen de content en
 * Beoordelen. De koppen volgen nu dezelfde lagen als het studieportaal — wat je toetst, wat je
 * leert, wat je nakijkt, en het beheer — zodat een nieuwe surface een plek hééft.
 */
export type AdminNavSection = { title: string | null; items: AdminNavItem[] };

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  { title: null, items: [{ path: '', icon: 'dashboard', label: 'Dashboard' }] },
  {
    title: 'Toetsen',
    items: [
      { path: '/exams', icon: 'assignment', label: 'Examens', levelled: true, knm: true },
      { path: '/questions', icon: 'quiz', label: 'Vragen & opdrachten', levelled: true, knm: true },
    ],
  },
  {
    title: 'Leerlaag',
    items: [
      // Lessen is levelled maar heeft GEEN KNM-tab: KNM's leerlaag zit in `leren_content` en
      // heeft zijn eigen surface. Een KNM-tab hier zou een leeg scherm openen voor content die
      // elders staat — dezelfde reden waarom Rubrieken er ook geen heeft.
      { path: '/lessen', icon: 'school', label: 'Lessen', levelled: true },
      // Woorden is de leerlaag-woordenlijst (`lesson_words`); Woordkaarten zijn de 366 KNM-kaarten
      // (`word_cards`). Twee tabellen, en dat blijft zo — `lesson_words` is gekeyd op
      // (niveau, onderdeel, dutch) en `word_cards` op KNM's thema-as, dus één scherm zou twee
      // sleutels moeten laten doen alsof ze dezelfde zijn. Wat samenvalt is de ingáng: A2 · B1 ·
      // KNM-woordkaarten. Geen KNM-tab via `?niveau=`, want `lesson_words.level` is NOT NULL.
      {
        path: '/woorden',
        icon: 'translate',
        label: 'Woorden',
        levelled: true,
        extra: [{ label: 'KNM-woordkaarten', path: '/woordkaarten' }],
      },
    ],
  },
  {
    title: 'Nakijken',
    items: [
      { path: '/rubrics', icon: 'checklist', label: 'Rubrieken', levelled: true },
      // Beoordelen is deliberately NOT levelled: it is a queue of what is waiting, and splitting
      // the inbox by level would hide work rather than organise it. The level is a column there.
      { path: '/beoordeling', icon: 'rate_review', label: 'Beoordelen' },
    ],
  },
  { title: 'Beheer', items: [{ path: '/users', icon: 'group', label: 'Gebruikers' }] },
];

/** Alle rijen plat, voor wie alleen de paden nodig heeft. */
export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap(s => s.items);


/**
 * A catalogue tab: a CEFR level, or KNM, which has none.
 *
 * `null` is KNM throughout the admin — the same value `exams.level`, `sections.level` and
 * `lib/admin/content-rows.ts` already carry for it.
 */
export type AdminLevel = Level | null;

/** The URL value for a tab. KNM's is its slug; a level's is the level. */
export function levelParam(level: AdminLevel): string {
  return level === null ? KNM_SLUG : level;
}

export const NAV_LEVELS: { level: AdminLevel; label: string; param: string }[] = [
  ...LEVELS.map(level => ({ level: level as AdminLevel, label: levelLabel(level), param: level })),
  { level: null, label: 'KNM', param: KNM_SLUG },
];

/** The tabs one nav item shows — KNM only where `knm` is set. See `AdminNavItem.knm`. */
export function navLevelsFor(item: AdminNavItem) {
  return item.knm ? NAV_LEVELS : NAV_LEVELS.filter(l => l.level !== null);
}

/**
 * Read the level a levelled admin page is being viewed at.
 *
 * Falls back to A2 on anything unrecognised rather than throwing: a hand-typed `?niveau=b2` should
 * show a working screen, not a 500. It is a view filter, not an authorisation decision.
 */
export function levelFromSearch(raw: string | string[] | undefined): AdminLevel {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (isKnm(value)) return null;
  return isLevel(value) ? value : DEFAULT_LEVEL;
}

/** `'A2'` · `'B1'` · `'KNM'` — what a levelled admin screen puts in its heading. */
export function adminLevelLabel(level: AdminLevel): string {
  return level === null ? 'KNM' : levelLabel(level);
}

export function adminHref(locale: string, path: string, level?: AdminLevel): string {
  const base = `/${locale}/admin${path}`;
  return level === undefined ? base : `${base}?niveau=${levelParam(level)}`;
}
