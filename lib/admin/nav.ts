import { DEFAULT_LEVEL, LEVELS, isLevel, levelLabel, type Level } from '@/data/skills';

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
   */
  levelled?: boolean;
  /** Below the divider: supporting surfaces, not content authoring. */
  secondary?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { path: '', icon: 'dashboard', label: 'Dashboard' },
  { path: '/exams', icon: 'assignment', label: 'Examens', levelled: true },
  { path: '/questions', icon: 'quiz', label: 'Vragen & opdrachten', levelled: true },
  { path: '/rubrics', icon: 'checklist', label: 'Rubrieken', levelled: true },
  // Beoordelen is deliberately NOT levelled: it is a queue of what is waiting, and splitting the
  // inbox by level would hide work rather than organise it. The level is a column there.
  { path: '/beoordeling', icon: 'rate_review', label: 'Beoordelen' },
  { path: '/users', icon: 'group', label: 'Gebruikers', secondary: true },
  // Woordkaarten stays reachable although FEATURES.woordkaarten is off, so content can be
  // authored ahead of the flag. It has no level axis.
  { path: '/woordkaarten', icon: 'style', label: 'Woordkaarten', secondary: true },
];

export const NAV_LEVELS: { level: Level; label: string }[] = LEVELS.map(level => ({
  level,
  label: levelLabel(level),
}));

/**
 * Read the level a levelled admin page is being viewed at.
 *
 * Falls back to A2 on anything unrecognised rather than throwing: a hand-typed `?niveau=b2` should
 * show a working screen, not a 500. It is a view filter, not an authorisation decision.
 */
export function levelFromSearch(raw: string | string[] | undefined): Level {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return isLevel(value) ? value : DEFAULT_LEVEL;
}

export function adminHref(locale: string, path: string, level?: Level): string {
  const base = `/${locale}/admin${path}`;
  return level ? `${base}?niveau=${level}` : base;
}
