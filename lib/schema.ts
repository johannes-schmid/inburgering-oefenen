/**
 * The JSON-LD shapes more than one page needs.
 *
 * Deliberately thin. Page-specific graphs (the homepage's `@graph`, a blog post's
 * `BlogPosting`) stay on their page — pulling them here would centralise things that have
 * exactly one caller. What lives here is what two pages would otherwise define differently.
 *
 * Origins and `@id` anchors come from `lib/site.ts`; this module never restates the URL.
 */
import { SITE_URL, ORG_ID } from '@/lib/site';
import type { Level, SkillSlug } from '@/data/skills';

/** Absolute URL for a locale-prefixed path. `absUrl('nl', 'oefenen')` → `…/nl/oefenen`. */
export function absUrl(locale: string, path = ''): string {
  return path ? `${SITE_URL}/${locale}/${path}` : `${SITE_URL}/${locale}`;
}

/**
 * The stable `@id` of an onderdeel's Course node.
 *
 * There must be exactly **one** Course per exam URL. The homepage and the
 * `/oefenexamen/[level]/[skill]` overview both describe these courses; the overview owns the
 * node and the homepage references this id, rather than both emitting a full Course for the
 * same `url` with different `description`s — which is a contradiction a validator will not
 * catch and a search engine resolves by picking one.
 */
export function courseId(locale: string, level: Level, skill: SkillSlug): string {
  return `${absUrl(locale, `oefenexamen/${level}/${skill}`)}#course`;
}

export type Crumb = {
  name: string;
  /** Locale-prefixed path without the leading slash. Omit for the current (last) page. */
  path?: string;
};

/**
 * `BreadcrumbList`, with the homepage always first.
 *
 * The last crumb deliberately carries no `item`: it is the page being viewed, and pointing a
 * breadcrumb at itself is what makes Google drop the whole trail. Names are passed in already
 * translated — a breadcrumb in the wrong language on an `/ar` page is worse than none.
 */
export function breadcrumbs(locale: string, home: string, trail: Crumb[], selfUrl?: string) {
  const all: Crumb[] = [{ name: home, path: '' }, ...trail];
  const last = trail[trail.length - 1];
  return {
    '@type': 'BreadcrumbList',
    // `selfUrl` exists for the pages whose slug is translated (`/premium` is
    // `/الباقة-المميزة` in Arabic), where the path cannot be derived by interpolating a locale.
    '@id': `${selfUrl ?? absUrl(locale, last?.path ?? '')}#breadcrumb`,
    itemListElement: all.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(i < all.length - 1 ? { item: absUrl(locale, crumb.path) } : {}),
    })),
  };
}

/** The provider/publisher reference every educational node on the site shares. */
export const PROVIDER_REF = { '@id': ORG_ID } as const;

/**
 * Drop keys whose value is `null` or `undefined`.
 *
 * B1's `itemCount` and `durationMinutes` are `null` — unverified, see `data/skills.ts`. In
 * JSON-LD an absent property means "not stated" while `0` is a claim, so an unverified count
 * must vanish rather than serialise. Same rule `lib/pricing.ts` applies to `itemCount`.
 */
export function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}
