import { fetchExamContent } from '@/lib/exam-content';
import type { FreePracticeItem, OptionKey } from '@/data/free-practice';
import type { SkillSlug } from '@/data/skills';

/**
 * The free B1 taster, derived from a real seeded oefenexamen rather than hand-authored.
 *
 * ## Why this is not `data/free-practice.ts`
 *
 * The twenty A2 items are static on purpose: the taster is the top of the funnel and must
 * render for an anonymous visitor with no database round-trip. That property is *kept* here —
 * this runs in a server component, so the browser still does no query — but the trade is real
 * and worth stating, because it is the opposite of the A2 decision (owner's decision,
 * 2026-08-23):
 *
 *  - The page now depends on B1 Lezen exam 1 being **published**. `fetchExamContent` returns
 *    null for an unpublished exam, so unpublishing it turns the taster off rather than
 *    breaking it — which is the failure mode to want, and is why the route 404s rather than
 *    rendering an empty quiz.
 *  - It gives away the first ten of that exam's thirty-five questions. Whether B1 exam 1 stays
 *    the free slot of its level is a pricing decision; nothing here assumes it.
 *
 * ## What it must never leak
 *
 * `ExamContent` also carries `open_tasks` — including `model_answer` — and this module returns
 * data that goes straight into a client component. It therefore reads **only** `stimuli`, and
 * only the fields the taster renders. Do not widen the mapping to spread a row.
 *
 * ## Why Lezen only
 *
 * Luisteren has no B1 content at all and its format is deliberately unverified
 * (`data/skills.ts`). Schrijven and Spreken are rubric-graded: every answer costs a model call,
 * so it has to be attributable to an account before it runs — the same reason they have no
 * anonymous A2 taster either.
 */

/** How many questions the taster hands out. Matches the A2 sets. */
export const B1_TASTER_COUNT = 10;

/** The onderdelen that have a B1 taster, and the exam each one is drawn from. */
const B1_TASTER_SOURCE: Partial<Record<SkillSlug, number>> = {
  lezen: 1,
};

export function hasB1FreePractice(skill: SkillSlug): boolean {
  return B1_TASTER_SOURCE[skill] !== undefined;
}

export function b1TasterSkills(): SkillSlug[] {
  return Object.keys(B1_TASTER_SOURCE) as SkillSlug[];
}

const LEES_EERST = 'Lees eerst de vraag.\nLees daarna de tekst.';

/** `<h4>` the stimulus title above its body, the way the static A2 passages are written. */
function passageHtml(title: string | null, bodyHtml: string | null): string {
  const heading = title?.trim() ? `<h4>${escapeHtml(title.trim())}</h4>` : '';
  return `${heading}${bodyHtml ?? ''}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Ten questions from the source exam, in the order the exam presents them, as taster items.
 *
 * Returns `null` when the exam is not published or holds no usable text item — the caller
 * 404s. It never returns a short set silently: a "10 gratis vragen" page that hands out four
 * is a copy bug that no type can catch, so a set below `B1_TASTER_COUNT` is treated as absent.
 */
export async function fetchB1FreePractice(skill: SkillSlug): Promise<FreePracticeItem[] | null> {
  const number = B1_TASTER_SOURCE[skill];
  if (number === undefined) return null;

  const content = await fetchExamContent('b1', skill, number);
  if (!content) return null;

  const items: FreePracticeItem[] = [];

  for (const stimulus of content.stimuli) {
    // Only a text stimulus can be rendered by the taster's pane. An audio or image stimulus
    // would show an empty passage beside a question about it.
    if (stimulus.kind !== 'text' || !stimulus.body_html) continue;

    const subSkill =
      (stimulus.section_id !== null ? content.sectionNames[stimulus.section_id] : undefined) ?? 'Tekst';

    for (const q of stimulus.questions) {
      if (items.length >= B1_TASTER_COUNT) break;

      // The taster renders answers as text. An item whose options are images belongs in the
      // player, which has a renderer for them.
      if (q.option_layout !== 'text') continue;

      const byLabel = new Map(q.options.map(o => [o.label, o] as const));
      const a = byLabel.get('A');
      const b = byLabel.get('B');
      const c = byLabel.get('C');
      const d = byLabel.get('D');

      // Three options are the minimum the engine renders, and a body is what it renders.
      if (!a?.body || !b?.body || !c?.body) continue;
      if (d && !d.body) continue;

      const correctLabel = q.options.find(o => o.is_correct)?.label;
      // `question_options_one_correct_idx` guarantees at most one correct row, not at least
      // one. An item with no answer key would mark every choice wrong.
      if (!correctLabel || (correctLabel === 'D' && !d)) continue;

      items.push({
        id: `b1-${skill}-${q.id}`,
        subSkill,
        stimulusIntro: `${stimulus.intro?.trim() ? `${stimulus.intro.trim()}\n` : ''}${LEES_EERST}`,
        stimulusHtml: passageHtml(stimulus.title, stimulus.body_html),
        question: q.prompt,
        optionA: a.body,
        optionB: b.body,
        optionC: c.body,
        ...(d?.body ? { optionD: d.body } : {}),
        correct: correctLabel as OptionKey,
        explanation: q.explanation,
      });
    }

    if (items.length >= B1_TASTER_COUNT) break;
  }

  return items.length >= B1_TASTER_COUNT ? items : null;
}
