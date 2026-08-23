/**
 * The article-cover glyph sheet.
 *
 * Twenty marks on one 96×96 grid, each built from **rectangles, discs and the one permitted
 * triangle** — the same blocks the gable houses and the `CategoryMark`s are made of. That is not a
 * stylistic preference: `docs/design/DESIGN_SYSTEM.md` §7.3 bans illustrations, mascots and
 * line-art imagery outright, so a cover cannot carry a drawing. Headspace's article art is exactly
 * such a drawing; this sheet is the translation of that idea into a vocabulary we are allowed to
 * use (see `GuideCover.tsx` for the composition it sits in).
 *
 * **This is not a third icon set.** The split stays what CLAUDE.md already fixed: `CategoryMark`
 * names *a thing the product sells* (an onderdeel, KNM, the gidsen) and lucide-react carries every
 * functional affordance. A cover glyph names *the subject of one article* — a job neither of those
 * two does — and it only ever appears inside a cover, never as a control and never beside a title.
 * Where an article's subject IS an onderdeel and a CategoryMark already exists for it, the mark
 * wins and the cover is not the place to redraw it.
 *
 * Two rules that are load-bearing rather than tidy:
 *
 *  - **One glyph, one article.** Two guides sharing a mark makes a grid of covers read as a
 *    rendering bug. This bit early: `staatsinrichting-en-rechtsstaat` and `knm-examen` were both
 *    drawn as the colonnade. The colonnade is KNM's own mark (CLAUDE.md, "KNM is the studio's
 *    'Instanties' colonnade"), so it stays with the pillar, Staatsinrichting took `scales`, and
 *    `loket` was drawn for Instanties. Three more were redrawn after the first screenshot of the
 *    KNM hub, where they misread at card size: `globe` was a window pane, `loket` a monitor and
 *    `books` a hamburger menu. **Look at a glyph at its real size, not at 96px.** `tests-unit/guide-covers.test.ts` pins the uniqueness.
 *  - **`cut` is the field showing through the ink**, exactly as in `CategoryMark`: the door in the
 *    house, the lines on the document, the hands on the clock. It must equal the cover's own
 *    field colour, which is why every glyph is a function of `(ink, cut)` rather than a constant —
 *    the light blog field needs the inverse of the navy one, and a glyph hardcoding `#002b6d`
 *    would show a navy notch on a grey card.
 */
import type { ReactNode } from 'react';

/** The glyph names. Adding one means adding it here, in `GLYPHS`, and in the test's expectation. */
export type CoverGlyph =
  | 'colonnade' | 'briefcase' | 'twopeople' | 'house' | 'cross' | 'globe' | 'scales' | 'books'
  | 'loket' | 'quad' | 'doc' | 'headphones' | 'pen' | 'mic' | 'steps' | 'fork' | 'route'
  | 'euro' | 'stamp' | 'clock' | 'sign';

/**
 * Every glyph, drawn into a 96×96 box.
 *
 * `ink` is the mark; `cut` is the hole punched through it and must be the field behind the cover.
 */
export const GLYPHS: Record<CoverGlyph, (ink: string, cut: string) => ReactNode> = {
  /* ── KNM ─────────────────────────────────────────────────────────────────────────────────── */
  colonnade: (ink) => (
    <>
      <path d="M48 4 L92 18 H4 Z" fill={ink} opacity={0.85} />
      <rect x="6" y="20" width="84" height="9" fill={ink} />
      <rect x="14" y="33" width="11" height="47" fill={ink} />
      <rect x="34" y="33" width="11" height="47" fill={ink} />
      <rect x="54" y="33" width="11" height="47" fill={ink} />
      <rect x="74" y="33" width="11" height="47" fill={ink} />
      <rect x="4" y="84" width="88" height="8" fill={ink} />
    </>
  ),
  briefcase: (ink, cut) => (
    <>
      <rect x="34" y="14" width="28" height="12" rx="3" fill={ink} />
      <rect x="8" y="30" width="80" height="54" rx="4" fill={ink} opacity={0.9} />
      <rect x="8" y="50" width="80" height="7" fill={cut} opacity={0.55} />
      <circle cx="48" cy="53" r="7" fill={ink} />
    </>
  ),
  twopeople: (ink) => (
    <>
      <circle cx="33" cy="30" r="15" fill={ink} />
      <circle cx="66" cy="38" r="12" fill={ink} opacity={0.72} />
      <rect x="12" y="54" width="42" height="30" rx="6" fill={ink} />
      <rect x="50" y="62" width="34" height="22" rx="6" fill={ink} opacity={0.72} />
    </>
  ),
  house: (ink, cut) => (
    <>
      <path d="M14 44 L48 14 L82 44 Z" fill={ink} />
      <rect x="20" y="44" width="56" height="40" fill={ink} opacity={0.9} />
      <rect x="40" y="58" width="16" height="26" fill={cut} opacity={0.6} />
      <rect x="14" y="84" width="68" height="6" fill={ink} />
    </>
  ),
  cross: (ink) => (
    <>
      <circle cx="48" cy="48" r="40" fill={ink} opacity={0.22} />
      <rect x="38" y="20" width="20" height="56" rx="4" fill={ink} />
      <rect x="20" y="38" width="56" height="20" rx="4" fill={ink} />
    </>
  ),
  /**
   * Land standing on water — the one thing the geography half of this thema is actually about.
   * It was a disc crossed by two bars and a meridian, which at card size read as a window pane.
   */
  /**
   * The molen. Second attempt: a disc with a gable cut into it read as an up-arrow in a circle.
   * A windmill standing on the waterline is the one silhouette that says both halves of this
   * thema at a glance, and the hero already stands one in its street — so it is a shape the system
   * owns rather than a new invention.
   */
  globe: (ink) => (
    <>
      <rect x="44.5" y="4" width="7" height="56" rx="2" fill={ink} transform="rotate(45 48 32)" />
      <rect x="44.5" y="4" width="7" height="56" rx="2" fill={ink} transform="rotate(-45 48 32)" />
      <circle cx="48" cy="32" r="5" fill={ink} />
      <path d="M38 84 L43 40 H53 L58 84 Z" fill={ink} opacity={0.92} />
      <rect x="10" y="84" width="76" height="8" rx="4" fill={ink} />
    </>
  ),
  scales: (ink) => (
    <>
      <rect x="44" y="14" width="8" height="66" fill={ink} />
      <rect x="14" y="26" width="68" height="7" rx="3" fill={ink} />
      <circle cx="20" cy="52" r="13" fill={ink} opacity={0.85} />
      <circle cx="76" cy="52" r="13" fill={ink} opacity={0.85} />
      <rect x="26" y="80" width="44" height="8" rx="3" fill={ink} />
    </>
  ),
  /**
   * The mortarboard, drawn as an explicit polygon. It was three stacked bars and a dot, which read
   * as a hamburger menu; the rewrite tried `rotate(45) scale(1 .5)` on a square and came out as a
   * tilted slab. **No transforms here** — a diamond written as four points cannot be composed
   * wrong, and this glyph is the reason that rule is worth stating.
   */
  books: (ink) => (
    <>
      <rect x="30" y="38" width="36" height="28" rx="3" fill={ink} opacity={0.72} />
      <path d="M48 14 L90 33 L48 52 L6 33 Z" fill={ink} />
      <rect x="83" y="33" width="6" height="28" rx="3" fill={ink} />
      <circle cx="86" cy="66" r="6.5" fill={ink} />
    </>
  ),
  /**
   * The office block. Drawn for Instanties once the colonnade was returned to KNM (its own mark).
   * It began as a service window with a face in it and read as a computer monitor at card size;
   * a windowed block with a door says "an organisation you go to" and cannot be confused with
   * `house`, which has a pitched roof.
   */
  loket: (ink, cut) => (
    <>
      <rect x="18" y="10" width="60" height="74" fill={ink} opacity={0.92} />
      {[22, 38, 54].map(y => [27, 44, 61].map(x => (
        <rect key={`${x}-${y}`} x={x} y={y} width="9" height="10" fill={cut} opacity={0.55} />
      )))}
      <rect x="41" y="68" width="14" height="16" fill={cut} opacity={0.6} />
      <rect x="8" y="84" width="80" height="8" rx="3" fill={ink} />
    </>
  ),
  /* ── Taalexamens ─────────────────────────────────────────────────────────────────────────── */
  quad: (ink) => (
    <>
      <rect x="10" y="10" width="35" height="35" rx="4" fill={ink} />
      <rect x="51" y="10" width="35" height="35" rx="4" fill={ink} opacity={0.78} />
      <rect x="10" y="51" width="35" height="35" rx="4" fill={ink} opacity={0.62} />
      <rect x="51" y="51" width="35" height="35" rx="4" fill={ink} opacity={0.46} />
    </>
  ),
  doc: (ink, cut) => (
    <>
      <rect x="18" y="10" width="60" height="76" rx="4" fill={ink} opacity={0.92} />
      <rect x="28" y="26" width="40" height="6" fill={cut} opacity={0.55} />
      <rect x="28" y="40" width="40" height="6" fill={cut} opacity={0.45} />
      <rect x="28" y="54" width="26" height="6" fill={cut} opacity={0.35} />
    </>
  ),
  headphones: (ink) => (
    <>
      <path d="M12 60 V50 a36 36 0 0 1 72 0 V60 h-12 V50 a24 24 0 0 0 -48 0 V60 Z" fill={ink} />
      <rect x="8" y="58" width="18" height="30" rx="7" fill={ink} />
      <rect x="70" y="58" width="18" height="30" rx="7" fill={ink} />
    </>
  ),
  pen: (ink) => (
    <>
      <rect x="52" y="6" width="18" height="56" rx="3" transform="rotate(28 61 34)" fill={ink} />
      <path d="M30 74 L38 56 L48 62 Z" fill={ink} />
      <rect x="14" y="82" width="68" height="7" rx="3" fill={ink} opacity={0.72} />
    </>
  ),
  mic: (ink) => (
    <>
      <rect x="36" y="8" width="24" height="44" rx="12" fill={ink} />
      <path d="M22 44 V50 a26 26 0 0 0 52 0 V44" fill="none" stroke={ink} strokeWidth="8" />
      <rect x="43" y="72" width="10" height="14" fill={ink} />
      <rect x="28" y="84" width="40" height="8" rx="3" fill={ink} />
    </>
  ),
  /* ── Inburgering ─────────────────────────────────────────────────────────────────────────── */
  steps: (ink) => (
    <>
      <rect x="8" y="62" width="24" height="26" fill={ink} opacity={0.62} />
      <rect x="36" y="42" width="24" height="46" fill={ink} opacity={0.8} />
      <rect x="64" y="20" width="24" height="68" fill={ink} />
    </>
  ),
  fork: (ink) => (
    <>
      <rect x="42" y="52" width="10" height="36" fill={ink} />
      <path d="M47 50 L18 22 h14 l15 15 15 -15 h14 Z" fill={ink} />
      <circle cx="20" cy="16" r="9" fill={ink} opacity={0.7} />
      <circle cx="76" cy="16" r="9" fill={ink} opacity={0.7} />
    </>
  ),
  route: (ink) => (
    <>
      <rect x="10" y="22" width="76" height="9" rx="4" fill={ink} />
      <rect x="10" y="44" width="54" height="9" rx="4" fill={ink} opacity={0.72} />
      <rect x="10" y="66" width="34" height="9" rx="4" fill={ink} opacity={0.5} />
      <circle cx="78" cy="70" r="11" fill={ink} />
    </>
  ),
  euro: (ink) => (
    <>
      <circle cx="48" cy="48" r="38" fill={ink} opacity={0.18} />
      <path d="M70 26 a26 26 0 1 0 0 44" fill="none" stroke={ink} strokeWidth="10" strokeLinecap="round" />
      <rect x="18" y="40" width="38" height="8" rx="3" fill={ink} />
      <rect x="18" y="54" width="30" height="8" rx="3" fill={ink} />
    </>
  ),
  stamp: (ink, cut) => (
    <>
      <rect x="14" y="14" width="68" height="68" rx="6" fill={ink} opacity={0.9} />
      <path d="M28 50 l14 14 l26 -30" fill="none" stroke={cut} strokeWidth="10" strokeLinecap="square" />
    </>
  ),
  clock: (ink, cut) => (
    <>
      <circle cx="48" cy="48" r="38" fill={ink} opacity={0.9} />
      <rect x="44" y="20" width="8" height="30" rx="3" fill={cut} />
      <rect x="46" y="44" width="26" height="8" rx="3" fill={cut} />
    </>
  ),
  sign: (ink) => (
    <>
      <circle cx="70" cy="26" r="16" fill={ink} opacity={0.72} />
      <path d="M14 64 q14 -26 26 -6 q10 16 22 -14" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" />
      <rect x="10" y="70" width="76" height="8" rx="3" fill={ink} />
    </>
  ),
};
