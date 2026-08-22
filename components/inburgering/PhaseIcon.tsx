/**
 * One line drawing per fase, for the cards on `/inburgering`.
 *
 * The cards used to be distinguished by a number and a tint only, which at a glance is three
 * identical rectangles. A drawing is what makes the row scannable before any of it is read — and
 * the row is the first thing an orienting reader meets, so "which of these three am I in" has to be
 * answerable in about a second.
 *
 * Three rules, all of them from `CLAUDE.md`'s design section rather than taste:
 *
 * - **Not emoji, and not lucide either.** The no-emoji rule is absolute; lucide is the rule for UI
 *   affordances (buttons, list markers, states) and is used everywhere else in these components.
 *   But a fase is a *concept*, and the three concepts are "the letter that decides", "the fork in
 *   the road" and "the finish". No single lucide glyph carries any of those, and three
 *   near-arbitrary glyphs would be decoration pretending to be meaning. So these are three purpose-
 *   drawn marks, on one 32×32 grid, at one stroke weight, so they read as a set.
 * - **`currentColor` for the structure, `--color-secondary-container` for the one accent.** The
 *   card decides the colour; the drawing inherits it. That is what lets the same file sit on a navy
 *   card in white and on a white card in navy without a second variant — and it is why the active
 *   card's drawing cannot go out of step with its text.
 * - **`aria-hidden`, always.** Each drawing restates the heading beside it. Announcing "envelope"
 *   before "Moet ik inburgeren?" adds a word and no information.
 */
import type { PhaseId } from '@/data/guides/phases';

type Props = { phase: PhaseId; className?: string };

/** One shared geometry: 32×32 box, 1.6 stroke, round caps. Changing these changes all three. */
const BOX = { viewBox: '0 0 32 32', fill: 'none' as const };
const S = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
/** The accent. One element per drawing — the thing the fase is actually about. */
const ACCENT = { ...S, stroke: 'var(--color-secondary-container)' };

export default function PhaseIcon({ phase, className }: Props) {
  const common = { ...BOX, className, width: 32, height: 32, 'aria-hidden': true as const };

  /* Fase 1 — de brief van DUO, onder de loep. The envelope is the artefact the whole phase turns
     on: DUO decides, and the letter is how you find out. The lens is the accent because the phase
     is the act of *checking*, not of receiving. */
  if (phase === 'orienteren') {
    return (
      <svg {...common}>
        <path {...S} d="M4 8.5h17v11H4z" />
        <path {...S} d="M4 8.5l8.5 6 8.5-6" />
        <circle {...ACCENT} cx="22" cy="21" r="5.5" />
        <path {...ACCENT} d="M26 25l3 3" />
      </svg>
    );
  }

  /* Fase 2 — de splitsing. Three arms, because the choice really is three leerroutes (B1, onderwijs,
     Z), and a two-armed fork would misdraw the decision. The chosen arm is the accent: the phase
     ends with one route picked, not with three still open. */
  if (phase === 'kiezen') {
    return (
      <svg {...common}>
        <path {...S} d="M16 28V17" />
        <path {...S} d="M16 17L7 9" />
        <path {...ACCENT} d="M16 17l9-8" />
        <path {...S} d="M16 17V6.5" />
        <circle {...ACCENT} cx="25" cy="9" r="2.4" />
        <circle {...S} cx="7" cy="9" r="2.4" />
        <circle {...S} cx="16" cy="6.5" r="2.4" />
      </svg>
    );
  }

  /* Fase 3 — het diploma. A sheet with two written lines and a seal; the seal is the accent because
     the phase ends in a document that is *awarded*, and the check inside it is the only tick in the
     set — it must not appear on a phase that is still in progress. */
  return (
    <svg {...common}>
      <path {...S} d="M7 4h13l5 5v13a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <path {...S} d="M20 4v5h5" />
      <path {...S} d="M11 14h7M11 18h5" />
      <circle {...ACCENT} cx="22.5" cy="22.5" r="5" />
      <path {...ACCENT} d="M20.4 22.6l1.6 1.6 2.7-3" />
    </svg>
  );
}
