/**
 * Dutch Horizon — the graphic language's numeric vocabulary.
 *
 * Everything drawn in `components/horizon/` comes out of these tables. They exist so the ramps are
 * **deterministic**: a skyline rendered on the server and rehydrated in the browser must be the
 * same street, so there is no `Math.random()` anywhere in this folder — a house's tint, height and
 * gable are all a function of its index.
 *
 * Source of truth for the rules: `docs/design/DESIGN_SYSTEM.md` §7.
 */

/** The three roof forms. Cycled by index, which is what guarantees "never three identical in a row". */
export type Gable = 'dome' | 'bell' | 'stepped' | 'punt';

export const GABLE_CYCLE: Gable[] = ['bell', 'dome', 'punt', 'stepped', 'dome', 'bell', 'stepped', 'dome'];

/** Height of each house as a fraction of the skyline box. The tallest sits off-centre (index 4 of 11). */
export const HEIGHT_RAMP = [0.58, 0.74, 0.52, 0.86, 1, 0.66, 0.46, 0.79, 0.6, 0.9, 0.5];

/** Opacity ramp for houses over a `primary` gradient — 5–18% `on_primary`, per §7.1. */
export const DARK_TINTS = [0.06, 0.09, 0.13, 0.08, 0.15, 0.07, 0.11, 0.1, 0.12, 0.06, 0.14];

/** One step of the neutral ramp per house, for skylines on light surfaces. */
export const LIGHT_TINTS = ['#e6e8ea', '#dfe2e6', '#c4c6d2', '#dfe2e6', '#e6e8ea', '#c4c6d2', '#dfe2e6', '#e6e8ea', '#c4c6d2', '#dfe2e6', '#e6e8ea'];

/** Solid tints for the silhouette handover (§7.2, "once per page maximum"). */
export const SILHOUETTE_TINTS = ['#002b6d', '#1d428a', '#002b6d', '#1d428a', '#0a3579', '#1d428a', '#002b6d', '#1d428a', '#002b6d', '#0a3579', '#1d428a'];

/** Palette literals. Duplicated from `@theme` in `app/globals.css` because these are drawn into
 *  inline `style` gradients, which cannot read a Tailwind colour utility. Keep the two in step. */
export const C = {
  primary: '#002b6d',
  primaryContainer: '#1d428a',
  onPrimary: '#ffffff',
  secondary: '#a24000',
  secondaryContainer: '#fe762c',
  onSecondaryContainer: '#5f2200',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434651',
  outlineVariant: '#c4c6d2',
  surfaceContainerHigh: '#e6e8ea',
} as const;

/** The sun disc is the one accent, and it is always this gradient. */
export const SUN_GRADIENT = `linear-gradient(180deg, ${C.secondaryContainer}, ${C.secondary})`;

/** The horizon band: `secondary → secondary_container`. */
export const HORIZON_GRADIENT = `linear-gradient(90deg, ${C.secondary}, ${C.secondaryContainer})`;

/** The hero gradient, 135°. Mirrors `--gradient-brand`. */
export const HERO_GRADIENT = `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`;

/** Dot field, per §7.1. `light` for dark surfaces, `dark` for light ones. */
export function dotField(on: 'light' | 'dark', size = 22): React.CSSProperties {
  const dot = on === 'light' ? 'rgba(255,255,255,0.07)' : 'rgba(0,43,109,0.07)';
  return {
    backgroundImage: `radial-gradient(circle, ${dot} 1.5px, transparent 1.6px)`,
    backgroundSize: `${size}px ${size}px`,
  };
}
