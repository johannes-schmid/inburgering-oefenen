/**
 * Surfaces that are announced in the navigation but not built yet.
 *
 * The menu implements `docs/MILESTONES.html` §3, and §3 promises tools and free practice material
 * alongside the guides. The owner chose (2026-08-20) to make those menu entries visible now and
 * ship the pages as placeholders, the same call as M1's "visible nav before the content".
 *
 * **A placeholder is not a "binnenkort" page.** Four hand-written coming-soon pages would drift in
 * tone and — worse — in robots handling. So there is one registry and one renderer
 * (`_components/PlannedSurface.tsx`), and three rules that hold for every entry:
 *
 * 1. **`noindex, follow`, and never in `app/sitemap.ts`.** A page with no content must not compete
 *    on the domain's behalf. Same gate as a draft guide and as the empty B1 exams, and the reason
 *    the renderer emits no JSON-LD at all: rich data on a noindex page contradicts its own meta tag.
 * 2. **It is never a dead end.** `related` is required and must point at something that exists
 *    today, so a reader who followed the menu still leaves with somewhere to go. That is the whole
 *    difference between this and a placeholder.
 * 3. **It says what it will be and what it will be built from**, because the honest version of
 *    "not yet" is specific. The timeline tool's rule is already sourced in `SEO/facts.md` §10; the
 *    KNM woordenlijst's content already sits in `data/woordkaarten.ts`.
 *
 * Adding an entry here also **reserves its slug** against the guide registry — see the invariant in
 * `tests-unit/guides.test.ts`, which derives the reserved set from this file. That matters because
 * `/knm/woordenlijst` shadows `/knm/[thema]`: without the test, a guide authored at that slug would
 * pass everything and serve this page instead.
 */
import type { GuideSection } from './guides/types';

/** A pathname declared in `i18n/routing.ts`. A literal union so a typo is a build error. */
export type PlannedHref =
  | '/knm/woordenlijst'
  | '/taalexamens/woordenlijst'
  | '/taalexamens/grammatica';

/** Where a "read this instead" link may point. Everything here must already be live. */
export type RelatedHref =
  | '/inburgering'
  | '/knm'
  | '/taalexamens'
  | '/oefenen'
  | '/blog'
  | '/premium'
  | { pathname: '/inburgering/[slug]'; params: { slug: string } };

export type PlannedSurface = {
  /** The route. Also the identity used for the reserved-slug invariant. */
  href: PlannedHref;
  /** Which hub it belongs under — drives the breadcrumb and the "back to" link. */
  section: GuideSection;
  /** The last path segment, which is what could collide with a guide slug. */
  slug: string;
  /** A tool computes something; free content is material to study. Only affects the label. */
  kind: 'tool' | 'free-content';
  /** Message key under `planned.<key>` — title, intro, `what_1..3`, `built_from`. */
  key: string;
  /** Which milestone builds it. Rendered, so the page is honest about the queue. */
  milestone: 'M2' | 'M3' | 'M4';
  /** Live pages to send the reader to instead. Required, and must be non-empty. */
  related: RelatedHref[];
};

export const PLANNED_SURFACES: PlannedSurface[] = [
  {
    href: '/knm/woordenlijst',
    section: 'knm',
    slug: 'woordenlijst',
    kind: 'free-content',
    key: 'knm_woorden',
    milestone: 'M3',
    related: ['/knm', '/oefenen'],
  },
  {
    href: '/taalexamens/woordenlijst',
    section: 'taalexamens',
    slug: 'woordenlijst',
    kind: 'free-content',
    key: 'taal_woorden',
    milestone: 'M4',
    related: ['/taalexamens', '/oefenen'],
  },
  {
    href: '/taalexamens/grammatica',
    section: 'taalexamens',
    slug: 'grammatica',
    kind: 'free-content',
    key: 'grammatica',
    milestone: 'M4',
    related: ['/taalexamens', '/oefenen'],
  },
];

export function getPlannedSurface(href: PlannedHref): PlannedSurface {
  const found = PLANNED_SURFACES.find(s => s.href === href);
  /* Throwing beats returning undefined: the caller is a route file that cannot render without it,
   * and a missing entry is an authoring mistake to surface at build time, not a runtime branch. */
  if (!found) throw new Error(`No planned surface registered for ${href}`);
  return found;
}

/**
 * Slugs a guide may not use, per section — because a static route already serves that path.
 * `tools` is included because `/inburgering/tools/…` makes `tools` an occupied segment too.
 */
export function reservedSlugs(section: GuideSection): string[] {
  const fromRegistry = PLANNED_SURFACES.filter(s => s.section === section).map(s => s.slug);
  /* `tools` stays reserved by hand now that the tijdlijn tool has shipped and left this registry:
   * `/inburgering/tools/…` is a real occupied segment, and a guide authored at the slug `tools`
   * would still be shadowed by it. The invariant outlives the placeholder that introduced it. */
  return section === 'inburgering' ? [...fromRegistry, 'tools'] : fromRegistry;
}
