import { createClient } from './supabase/server';
import { ownsKnm, ownsModule } from './entitlements';
import { emptyLevelledProgress, fetchPortalProgress, type AllPortalProgress } from './portal-progress';
import { fetchConceptLevels } from './lessons/concepts-server';
import {
  KNM, KNM_SLUG, LEVELS, SKILLS, getFormat, moduleGroupLabel,
  type Level, type OnderdeelSlug,
} from '@/data/skills';

/**
 * What the study portal's sidebar shows: the candidate's own cursus, group by group.
 *
 * The sidebar used to list all four taalonderdelen plus KNM unconditionally, which describes
 * the *catalogue* rather than what the person in front of it bought. This models the owner's
 * 2026-08-27 decision: **what you own sits at the top as expandable module groups, and
 * everything else is collapsed into one "nog niet in jouw cursus" group underneath.** Not
 * hidden — a module you have not bought is still the thing we are selling — but demoted, so
 * the primary reading of the sidebar is "where was I".
 *
 * It is built on the server and handed to the sidebar as plain data. The sidebar is a client
 * component (the disclosure state is interactive), so it can neither read the session nor
 * query; every field here must therefore be JSON-serialisable, and none of it may be
 * sensitive — this whole object ships in the page payload.
 */

/** One onderdeel row in the sidebar. */
export type PortalMenuItem = {
  slug: OnderdeelSlug;
  /** `null` for KNM, which is not examined per level. */
  level: Level | null;
  /** The `messages.skills.*` key — the label is translated in the component, not here. */
  messageKey: string;
  /**
   * Paid access to this specific onderdeel.
   *
   * Separate from the group's `owned`, which is true as soon as *one* of a level's four is
   * bought. Without the distinction a customer who owns A2 Lezen would see Spreken rendered
   * exactly like the module they paid for, with a progress rail it can never fill — the
   * sidebar telling them they own something the player will bounce them out of.
   */
  owned: boolean;
  /** `/dashboard/…` path, without the locale prefix. */
  href: string;
  /**
   * Distinct oefenexamens sat, and how many there are.
   *
   * One number, not two bars: the owner's decision (2026-08-27) is that the rail says how far
   * through the ten you are and nothing else. An average score in the chrome would be a mark
   * you cannot get away from, and for Schrijven and Spreken it is null until the docent has
   * reviewed — a bar that stays empty while you work reads as broken, not as pending.
   */
  examsDone: number;
  examCount: number;
};

/** A module group: one level's taalonderdelen, or KNM with its study surfaces. */
export type PortalMenuGroup = {
  /** `a2` | `b1` | `knm` — also the disclosure state's storage key. */
  id: string;
  level: Level | null;
  label: string;
  /** The badge in the group header: "A2", "B1", or null for KNM (which gets its mark). */
  badge: string | null;
  /** Where the group header itself links, without the locale prefix. */
  href: string;
  items: PortalMenuItem[];
  /** True when the account has paid access to at least one onderdeel in the group. */
  owned: boolean;
  /**
   * Heeft dit niveau een vrijgegeven conceptenbibliotheek?
   *
   * Een **feit over de content**, geen feature flag — zie `fetchConceptLevels()`. Altijd
   * `false` voor KNM: dat onderdeel heeft geen grammaticaconcepten, zijn 43 subonderwerpen
   * zitten al in `sections` en zijn remediatie loopt daarlangs.
   *
   * De lescursus zélf staat hier **niet** in, en dat is de beslissing van de eigenaar van
   * 27-08: het paneel draagt één as en zegt hoe ver je door de tien examens bent, niets
   * anders. Twee balken naast elkaar in 196px is onleesbaar, en de cursus draagt zijn eigen
   * voortgang op zijn eigen pagina.
   */
  hasConcepts: boolean;
};

export type PortalMenu = {
  /** Groups the candidate has bought into, in level order with KNM last. */
  owned: PortalMenuGroup[];
  /** Everything else, rendered under one collapsed heading. */
  available: PortalMenuGroup[];
  /** True when nothing is owned — the sidebar then leads with the offer. */
  isEmpty: boolean;
};

function skillItem(
  meta: Meta,
  level: Level,
  skill: (typeof SKILLS)[number],
  progress: AllPortalProgress,
): PortalMenuItem {
  return {
    slug: skill.slug,
    level,
    messageKey: skill.key,
    owned: ownsModule(meta, level, skill.slug),
    href: `/dashboard/${level}/${skill.slug}`,
    examsDone: progress[level][skill.slug].examsDone,
    examCount: getFormat(level, skill.slug).examCount,
  };
}

function knmItem(meta: Meta, progress: AllPortalProgress): PortalMenuItem {
  return {
    slug: KNM_SLUG,
    level: null,
    messageKey: KNM.key,
    owned: ownsKnm(meta),
    // No level in the path: `/dashboard/knm` is a real route, a static sibling of `[level]`.
    href: '/dashboard/knm',
    examsDone: progress.knm.examsDone,
    examCount: KNM.examCount,
  };
}

/**
 * Build the sidebar's menu for the signed-in user.
 *
 * Returns the anonymous shape (nothing owned, everything on offer) rather than throwing when
 * there is no session or the attempts table is briefly unreachable — the portal chrome must
 * never be the reason a page fails to render.
 *
 * A level with no published content is still listed under "nog niet in jouw cursus" only if it
 * is sellable; that check lives in `/dashboard/pakketten`, which is where the money is taken.
 * Here an unowned group is a signpost, and B1 Luisteren having no exams is visible in its own
 * `examCount` rather than by omitting the row.
 */
export async function fetchPortalMenu(): Promise<PortalMenu> {
  const empty: PortalMenu = { owned: [], available: [], isEmpty: true };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return buildPortalMenu(null, emptyLevelledProgress(), await fetchConceptLevels());

    const [progress, conceptLevels] = await Promise.all([
      fetchPortalProgress(user.id),
      fetchConceptLevels(),
    ]);
    return buildPortalMenu(user.user_metadata ?? null, progress, conceptLevels);
  } catch {
    return empty;
  }
}

/** The shape `lib/entitlements.ts` reads. Kept loose here for the same reason it is there. */
type Meta = Record<string, unknown> | null;

/**
 * The pure half: metadata + progress in, menu out. Exported so the grouping rules can be
 * tested without a session — the fetch above is one `getUser()` and one query around it.
 */
export function buildPortalMenu(
  meta: Meta,
  progress: AllPortalProgress,
  conceptLevels: Set<Level> = new Set(),
): PortalMenu {
  const groups: PortalMenuGroup[] = LEVELS.map(level => {
    const items = SKILLS.map(s => skillItem(meta, level, s, progress));
    // A level is "yours" as soon as one of its four onderdelen is. Splitting a level across
    // both sections would list Lezen twice under two different headings for the same A2.
    const owned = SKILLS.some(s => ownsModule(meta, level, s.slug));
    return {
      id: level,
      level,
      label: moduleGroupLabel(level),
      badge: level.toUpperCase(),
      // A module lands on **its own overview**, never on its first onderdeel: the question a
      // module asks is "how am I doing across the four and what is next", and sending it to
      // Lezen makes Lezen mean "A2" in the one place that must not be ambiguous.
      href: `/dashboard/${level}`,
      items,
      owned,
      hasConcepts: conceptLevels.has(level),
    };
  });

  groups.push({
    id: KNM_SLUG,
    level: null,
    label: moduleGroupLabel(null),
    badge: null,
    href: '/dashboard/knm',
    items: [knmItem(meta, progress)],
    owned: ownsKnm(meta),
    hasConcepts: false,
  });

  const owned = groups.filter(g => g.owned);
  return {
    owned,
    available: groups.filter(g => !g.owned),
    isEmpty: owned.length === 0,
  };
}
