/**
 * One colour per content category, stable everywhere it is shown.
 *
 * A "category" here is whatever axis an onderdeel is built along: a tekstsoort
 * (`sections.slug`) for Lezen/Luisteren, a `rubricCategory()` string for Schrijven/Spreken.
 * The admin shows those in several places — the Opbouw card, the exam cards' chip rows, the
 * content grid — and a docent reads "how is this exam built up?" far faster off colour than
 * off a column of words. That only holds if the colour is the *same* colour on every screen,
 * which is why this lives in one module rather than in the component that needed it first.
 *
 * Client-safe: no imports, pure functions.
 *
 * The palette is brand-derived (navy → orange, the two brand poles, plus enough hue distance
 * to stay separable). Deliberately not Tailwind's defaults — see the design rules in
 * CLAUDE.md. `tint` is the 10%-ish wash that a chip sits on and `ink` is readable on it.
 */

export type CategoryColor = {
  /** Solid fill — bars, slots, legend dots. */
  base: string;
  /** Background wash for a chip. */
  tint: string;
  /** Text colour readable on `tint`. */
  ink: string;
};

const PALETTE: CategoryColor[] = [
  { base: '#1d428a', tint: '#e6ecf7', ink: '#002b6d' }, // brand blue
  { base: '#fe762c', tint: '#fcecdd', ink: '#a24000' }, // brand orange
  { base: '#0f766e', tint: '#e0f0ee', ink: '#0b544e' }, // teal
  { base: '#7c3aed', tint: '#eee7fd', ink: '#5b21b6' }, // violet
  { base: '#b45309', tint: '#f8ecdc', ink: '#7c3a06' }, // amber-brown
  { base: '#be185d', tint: '#fae5ee', ink: '#8c1145' }, // raspberry
  { base: '#4d7c0f', tint: '#eaf1de', ink: '#38590b' }, // olive
  { base: '#0369a1', tint: '#e0eef6', ink: '#024a72' }, // steel
];

/** The colour of something that has no category yet — grey, never one of the eight. */
export const UNCATEGORISED: CategoryColor = { base: '#a3a6b0', tint: '#eceef0', ink: '#434651' };

function hash(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Assign a colour to every key in one axis.
 *
 * Hash-first so a tekstsoort keeps its colour when the set around it changes (adding a
 * ninth section must not repaint the other eight), then linear probing so two keys in the
 * *same* list can never collide — which is the one case where a duplicate colour actually
 * misleads. `null` is the uncategorised bucket and always gets grey.
 */
export function categoryColors(keys: (string | null)[]): Map<string | null, CategoryColor> {
  const out = new Map<string | null, CategoryColor>();
  const taken = new Set<number>();
  for (const key of keys) {
    if (key === null) { out.set(null, UNCATEGORISED); continue; }
    let i = hash(key) % PALETTE.length;
    for (let n = 0; n < PALETTE.length && taken.has(i); n++) i = (i + 1) % PALETTE.length;
    taken.add(i);
    out.set(key, PALETTE[i]);
  }
  return out;
}

/** One key on its own, for a surface that shows a single chip and has no list to key against. */
export function categoryColor(key: string | null): CategoryColor {
  return key === null ? UNCATEGORISED : PALETTE[hash(key) % PALETTE.length];
}
