import { fetchExamContent } from '@/lib/exam-content';
import type { FreePracticeItem, OptionKey } from '@/data/free-practice';
import type { Level, SkillSlug } from '@/data/skills';

/**
 * The free taster, derived from a real published oefenexamen rather than hand-authored.
 *
 * This is the level-agnostic engine behind both tasters. It was B1-only
 * (`lib/free-practice-b1.ts`, now a thin wrapper); A2 was reading twenty static items out of
 * `data/free-practice.ts`. Both levels now read the database, so the docent's corrections in
 * `/admin` reach the top of the funnel — which was the whole point of authoring items there.
 *
 * ## What did NOT change: the browser still does no query
 *
 * Both taster pages are server components with `generateStaticParams`, so an anonymous visitor
 * still gets HTML with no round-trip. That was the reason A2's set was static and it is
 * preserved.
 *
 * ## A2 keeps its static set as a fallback; B1 does not
 *
 * Deliberately asymmetric, because the failure modes differ:
 *
 *  - The four **A2** taster URLs are indexed and ranking, and `data/free-practice.ts` holds a
 *    complete, docent-written set for Lezen and Luisteren. If the source exam is unpublished or
 *    ever yields fewer than ten renderable items, falling back to those twenty items is
 *    strictly better than 404ing the entry point of the funnel. `data/free-practice.ts` is
 *    therefore **still live code**, not dead weight — see `lib/free-practice.ts`.
 *  - **B1** has no static set at all, so absent means absent and the route 404s.
 *
 * ## Which exams it draws from, and why that is free to give away
 *
 * A2 exam 1 of each onderdeel is already `is_free` — the ten questions this hands out are ten
 * a visitor can sit in full after making an account. B1 exam 1 is **not** free (the open
 * pricing decision), so its taster gives away ten of thirty-five paid questions.
 *
 * ## What it must never leak
 *
 * `ExamContent` also carries `open_tasks` — including `model_answer` — and this module's return
 * value goes straight into a client component. It reads **only** `stimuli`, and only the fields
 * the taster renders. Do not widen the mapping to spread a row.
 *
 * ## Why Schrijven and Spreken have no taster at either level
 *
 * They are rubric-graded: every answer costs a model call, so it has to be attributable to an
 * account before it runs.
 */

/** How many questions a taster hands out, at every level. */
export const TASTER_COUNT = 10;

type SourceKey = `${Level}:${SkillSlug}`;

/**
 * The (level, onderdeel) pairs with a taster, and the oefenexamen each is drawn from.
 *
 * A2 Luisteren is here as well as Lezen: an audio stimulus carries `audio_url`, which the
 * engine's player takes directly, so nothing about it needs the committed mp3s. B1 Luisteren is
 * absent because there is no B1 Luisteren content and its format is deliberately unverified
 * (`data/skills.ts`).
 */
const SOURCE: Partial<Record<SourceKey, number>> = {
  'a2:lezen': 1,
  'a2:luisteren': 1,
  'b1:lezen': 1,
};

export function hasDbFreePractice(level: Level, skill: SkillSlug): boolean {
  return SOURCE[`${level}:${skill}`] !== undefined;
}

export function dbTasterSkills(level: Level): SkillSlug[] {
  return (Object.keys(SOURCE) as SourceKey[])
    .filter(k => k.startsWith(`${level}:`))
    .map(k => k.slice(level.length + 1) as SkillSlug);
}

const LEES_EERST = 'Lees eerst de vraag.\nLees daarna de tekst.';
const LUISTER_EERST = 'Lees eerst de vraag.\nLuister daarna naar het gesprek.';

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
 * Returns `null` when the exam is not published or holds too few usable items. It never returns
 * a short set silently: a "10 gratis vragen" page that hands out four is a copy bug no type can
 * catch, so a set below `TASTER_COUNT` is treated as absent and the caller decides — A2 falls
 * back to the static set, B1 404s.
 */
export async function fetchDbFreePractice(
  level: Level,
  skill: SkillSlug
): Promise<FreePracticeItem[] | null> {
  const number = SOURCE[`${level}:${skill}`];
  if (number === undefined) return null;

  const content = await fetchExamContent(level, skill, number);
  if (!content) return null;

  const items: FreePracticeItem[] = [];

  for (const stimulus of content.stimuli) {
    // Only text and audio can be rendered by the taster's pane. An image stimulus would show
    // an empty passage beside a question about a picture the visitor cannot see.
    const isText = stimulus.kind === 'text' && !!stimulus.body_html;
    const isAudio = stimulus.kind === 'audio' && !!stimulus.audio_url;
    if (!isText && !isAudio) continue;

    const subSkill =
      (stimulus.section_id !== null ? content.sectionNames[stimulus.section_id] : undefined) ??
      (isAudio ? 'Gesprek' : 'Tekst');

    const intro = `${stimulus.intro?.trim() ? `${stimulus.intro.trim()}\n` : ''}${
      isAudio ? LUISTER_EERST : LEES_EERST
    }`;

    for (const q of stimulus.questions) {
      if (items.length >= TASTER_COUNT) break;

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

      // An explanation per question is the taster's whole promise ("direct uitleg van een
      // gecertificeerde NT2-docent"), and it is the one field a half-authored item is missing.
      if (!q.explanation?.trim()) continue;

      items.push({
        id: `${level}-${skill}-${q.id}`,
        subSkill,
        stimulusIntro: intro,
        ...(isText ? { stimulusHtml: passageHtml(stimulus.title, stimulus.body_html) } : {}),
        ...(isAudio ? { audioSrc: stimulus.audio_url ?? undefined } : {}),
        question: q.prompt,
        optionA: a.body,
        optionB: b.body,
        optionC: c.body,
        ...(d?.body ? { optionD: d.body } : {}),
        correct: correctLabel as OptionKey,
        explanation: q.explanation,
      });
    }

    if (items.length >= TASTER_COUNT) break;
  }

  return items.length >= TASTER_COUNT ? items : null;
}
