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
import { TRANSLATIONS } from './translations';
import inburgeringStappenplan from './inburgering-stappenplan';
import moetIkInburgeren from './moet-ik-inburgeren';
import welkeWetEnWelkeRoute from './welke-wet-en-welke-route';
import watKostInburgeren from './wat-kost-inburgeren';

/* KNM — the pillar plus the eight official thema's of the herziene eindtermen
   (Stcrt. 2024, 15802). The order here is the order of the eindtermen, which is not the order
   the hub renders (that is pillar-first, then newest) but is the order a reviewer reads them in. */
import knmExamen from './knm-examen';
import werkEnInkomen from './werk-en-inkomen';
import omgangsvormen from './omgangsvormen-waarden-en-normen';
import wonen from './wonen';
import gezondheid from './gezondheid-en-gezondheidszorg';
import geschiedenisEnGeografie from './geschiedenis-en-geografie';
import instanties from './instanties';
import staatsinrichting from './staatsinrichting-en-rechtsstaat';
import onderwijsEnOpvoeding from './onderwijs-en-opvoeding';

/* Taalexamens — the pillar plus one spoke per onderdeel. The Lezen and Luisteren spokes overlap
   the two per-onderdeel blog posts on purpose and are scoped against them; see the header of
   `lezen-examen.ts`. */
import taalexamensA2B1 from './taalexamens-a2-b1';
import lezenExamen from './lezen-examen';
import luisterenExamen from './luisteren-examen';
import schrijvenExamen from './schrijven-examen';
import sprekenExamen from './spreken-examen';
import b1Examen from './b1-examen';

/* The remaining Inburgering spokes. Each must also be added to a fase in `phases.ts`, in the same
   commit — `tests-unit/inburgering-route.test.ts` requires every published inburgering guide to
   sit in exactly one fase. */
import vrijstellingEnOntheffing from './vrijstelling-en-ontheffing';
import boeteEnTermijn from './boete-en-termijn';
import pvtMapEnOna from './pvt-map-en-ona';
import onaExamen from './ona-examen';

/**
 * The Dutch guides, before their translations are attached.
 *
 * Kept separate from `GUIDES` so the merge below is the only place a translation reaches a guide.
 * Four guides (the pillar and the three earliest Inburgering spokes) still carry their EN/AR
 * bodies inline in their own file; everything since 2026-08-24 lives in `translations/`. The merge
 * lets both shapes coexist, with the file-based one winning on a key it defines — there is no
 * guide where both exist, and `tests-unit/guides.test.ts` refuses one.
 */
const SOURCES: Guide[] = [
  inburgeringStappenplan,
  moetIkInburgeren,
  welkeWetEnWelkeRoute,
  watKostInburgeren,

  knmExamen,
  werkEnInkomen,
  omgangsvormen,
  wonen,
  gezondheid,
  geschiedenisEnGeografie,
  instanties,
  staatsinrichting,
  onderwijsEnOpvoeding,

  taalexamensA2B1,
  lezenExamen,
  luisterenExamen,
  schrijvenExamen,
  sprekenExamen,
  b1Examen,

  vrijstellingEnOntheffing,
  boeteEnTermijn,
  pvtMapEnOna,
  onaExamen,
];

export const GUIDES: Guide[] = SOURCES.map(guide => {
  const extra = TRANSLATIONS[guide.slug];
  if (!extra) return guide;
  return { ...guide, translations: { ...guide.translations, ...extra } };
});

export type { Guide, GuideSection, GuideFaq, GuideLocale, ResolvedGuide } from './types';
export default GUIDES;
