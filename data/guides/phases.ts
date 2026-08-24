/**
 * The three fasen of the Inburgering hub — the reader's route, not a taxonomy.
 *
 * `/inburgering` used to be a grid of four equal cards. A grid says "here are four articles";
 * a route says "you are here, this is next", which is the only thing an orienting reader wants
 * (`docs/MILESTONES.html` §3: ~80% of the search volume is informational). So the hub is three
 * phases in order, each opening the step list of the guides behind it, and the guides themselves
 * are unchanged — they are read whole, at their own URLs, exactly as the docent reviewed them.
 *
 * **A phase holds one or more guides, and the step list is the concatenation of their `<h2>`
 * sections** (`lib/guides/sections.ts`). That is why `guides` is an array rather than a slug:
 * "Wat kost inburgeren?" is orientation reading and belongs in fase 1 beside "Moet ik
 * inburgeren?", but the mockup's three cards are the architecture (owner's decision, 2026-08-22).
 * A fourth card for it would have made the row of cards the site's fourth competing navigation.
 *
 * Two constraints worth stating, because both are enforced by `tests-unit/guide-phases.test.ts`
 * rather than by convention:
 *
 * - **Every slug here must resolve to a published `inburgering` guide.** A phase pointing at a
 *   draft or a typo'd slug renders a card with an empty step list and a "0 van 0 gelezen" counter —
 *   a dead end at the top of the funnel, which is the one place the site cannot afford one.
 * - **Every published `inburgering` guide must appear in exactly one phase.** A guide in no phase
 *   is unreachable from its own hub (the grid that used to list it is gone); a guide in two phases
 *   double-counts its sections and makes the progress bars lie. So a new guide is a new entry
 *   here, in the same commit.
 *
 * The visual for each phase is `components/inburgering/PhaseIcon.tsx`, keyed by `id`. The copy —
 * label, title, body — is in `messages/*.json` under `inburgering_route.phase.<id>`, because it is
 * translated; nothing user-facing is hardcoded in this file.
 */

/** Phase ids. Also the localStorage key of the last phase opened, and the `?fase=` value. */
export type PhaseId = 'orienteren' | 'kiezen' | 'doen';

export type GuidePhase = {
  id: PhaseId;
  /** 1-based, and the number printed on the card. */
  number: number;
  /** Guide slugs, in reading order. Their sections concatenate into this phase's step list. */
  guides: string[];
};

export const PHASES: GuidePhase[] = [
  { id: 'orienteren', number: 1, guides: ['moet-ik-inburgeren', 'vrijstelling-en-ontheffing', 'wat-kost-inburgeren'] },
  { id: 'kiezen', number: 2, guides: ['welke-wet-en-welke-route'] },
  { id: 'doen', number: 3, guides: ['inburgering-stappenplan', 'pvt-map-en-ona', 'ona-examen', 'boete-en-termijn'] },
];

export const PHASE_IDS = PHASES.map(p => p.id);

/** The phase a guide belongs to, or `undefined` for a guide outside the route (KNM, taalexamens). */
export function phaseOfGuide(slug: string): GuidePhase | undefined {
  return PHASES.find(p => p.guides.includes(slug));
}

/** Parse a `?fase=` value. Anything unrecognised falls back to the first phase, never to nothing. */
export function phaseFromParam(value: string | undefined): PhaseId {
  return PHASE_IDS.includes(value as PhaseId) ? (value as PhaseId) : 'orienteren';
}
