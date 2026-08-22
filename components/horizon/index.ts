/**
 * Dutch Horizon — the reusable graphic language of the site.
 *
 * Import every skyline, sun disc, band, dot field and lens ring from here. The rules that make the
 * imagery read as one street live inside these components, not in the pages that use them, so a
 * new surface gets them for free: see `docs/design/DESIGN_SYSTEM.md` §7 and the reference
 * implementation in `docs/design/horizon-element-library.html`.
 *
 * There are no illustrations, mascots or line-art icons in this language. If a concept cannot be
 * said with the four primitives plus a label, use words. (Functional UI icons stay lucide-react.)
 */
export { default as Skyline, type SkylineTone } from './Skyline';
export { default as HorizonHero, type HeroTone } from './HorizonHero';
export { default as HorizonBanner } from './HorizonBanner';
export { default as SkylineTopper, type TopperTint } from './SkylineTopper';
export { default as SectionTransition } from './SectionTransition';
export { DocentSeal, ValidationChip } from './Trust';
export { SunDisc, HorizonBand, DotField, LensRing, GlassChip } from './primitives';
export { C as HORIZON_COLORS, HERO_GRADIENT, HORIZON_GRADIENT, SUN_GRADIENT, dotField } from './tokens';
export { default as CategoryMark, type Category } from './CategoryMark';
