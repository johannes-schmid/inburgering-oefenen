/**
 * The guide registry.
 *
 * One import per guide, one entry in `GUIDES`. Nothing else in the codebase enumerates guides —
 * the hubs, the routes, the sitemap and `scripts/check-schema.mjs` all read this through
 * `helpers.ts`, and only `publishedGuides()` decides what a reader or a crawler sees.
 *
 * Order here is irrelevant: `publishedGuides()` sorts pillar-first, then newest.
 */
import type { Guide } from './types';
import inburgeringStappenplan from './inburgering-stappenplan';

export const GUIDES: Guide[] = [
  inburgeringStappenplan,
];

export type { Guide, GuideSection, GuideFaq, GuideLocale, ResolvedGuide } from './types';
export default GUIDES;
