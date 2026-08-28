import { fetchExamContent, type ExamContent, type QuestionItem } from '@/lib/exam-content';
import type { FreePracticeItem, OptionKey } from '@/data/free-practice';
import type { Level, OnderdeelSlug, SkillSlug } from '@/data/skills';

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
 * ## Which exams it draws from
 *
 * See `SOURCE` below. A2 takes all ten questions from its free exam 1; B1 takes one question
 * from each of its ten exams, so no single sitting is meaningfully given away.
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
 *
 * ## KNM is here too, and it is the one without a level
 *
 * `exams.level IS NULL` for KNM, so every function here takes `Level | null` and the source key
 * spells the missing level `none` rather than leaving it out — two keys that differ only by an
 * absent segment collide. Its questions are **standalone**: `stimulus_id IS NULL`, no pane above
 * them. `itemsFromExam` reads `content.standalone` as well as `content.stimuli` for that reason,
 * and the engine drops the left pane for an item with neither passage nor audio.
 */

/** How many questions a taster hands out, at every level. */
export const TASTER_COUNT = 10;

type SourceKey = `${Level}:${SkillSlug}` | `none:${OnderdeelSlug}`;

/** KNM's key spells its absent level `none`; see the header. */
function sourceKey(level: Level | null, skill: OnderdeelSlug): SourceKey {
  return `${level ?? 'none'}:${skill}` as SourceKey;
}

/**
 * The (level, onderdeel) pairs with a taster, and the oefenexamens each draws from.
 *
 * A2 Luisteren is here as well as Lezen: an audio stimulus carries `audio_url`, which the
 * engine's player takes directly, so nothing about it needs the committed mp3s. B1 Luisteren is
 * absent because there is no B1 Luisteren content and its format is deliberately unverified
 * (`data/skills.ts`). Schrijven and Spreken are absent at both levels: they are rubric-graded,
 * so every answer costs a model call and has to be attributable to an account first — the
 * picker sends those two to oefenexamen 1, which is free.
 *
 * **The list is per level, and the two levels differ on purpose.**
 *
 *  - **A2 draws from exam 1 only.** A2 exam 1 of each onderdeel is `is_free`, so the ten
 *    questions this hands out are ten a visitor can sit in full after making an account.
 *    Exams 2–10 are paid; widening this list would give paid items away for nothing.
 *  - **B1 draws one question from each of its ten exams** (owner's decision, 2026-08-28).
 *    B1 Lezen holds 35 questions per exam, so ten from one exam is 29% of a single sitting
 *    while one from each is 3% of ten — and the visitor sees a spread of tekstsoorten rather
 *    than whatever happens to open exam 1.
 *
 * The mix is deterministic: the exams are read in the order listed and the first eligible
 * question of each is taken. These are server components with `generateStaticParams`, so a
 * random pick would render one set on the server and another in the browser.
 */
const SOURCE: Partial<Record<SourceKey, number[]>> = {
  'a2:lezen': [1],
  'a2:luisteren': [1],
  'b1:lezen': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  // KNM draws from exam 1 only, for A2's reason and not B1's: KNM exam 1 is `is_free`, so the
  // ten questions handed out are ten a visitor can sit in full after making an account. Its
  // forty items already span the seven thema's, so a mix would buy no extra spread either.
  'none:knm': [1],
};

export function hasDbFreePractice(level: Level | null, skill: OnderdeelSlug): boolean {
  return SOURCE[sourceKey(level, skill)] !== undefined;
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
 * Every question of one exam that the taster's engine can actually render, in exam order.
 *
 * The filters are the engine's own limits, not quality judgements: it draws a text or audio
 * pane, three or four text options and an explanation. An item missing any of those would
 * render as a broken question on the most-linked free page on the site.
 */
function itemsFromExam(
  content: ExamContent,
  level: Level | null,
  skill: OnderdeelSlug
): FreePracticeItem[] {
  const items: FreePracticeItem[] = [];
  const idOf = (questionId: number) => `${level ?? skill}-${skill}-${questionId}`;

  // Standalone questions — KNM's whole bank. They carry their own sub-topic on
  // `questions.section_id`; `stimuli.section_id` is the authority only where a stimulus exists,
  // and reading the wrong one is what once put every KNM answer under "Overig".
  for (const q of content.standalone) {
    const item = mcqItem(q, {
      id: idOf(q.id),
      subSkill:
        (q.section_id !== null ? content.sectionNames[q.section_id] : undefined) ?? 'Algemeen',
      stimulusIntro: '',
    });
    if (item) items.push(item);
  }

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
      const item = mcqItem(q, {
        id: idOf(q.id),
        subSkill,
        stimulusIntro: intro,
        ...(isText ? { stimulusHtml: passageHtml(stimulus.title, stimulus.body_html) } : {}),
        ...(isAudio ? { audioSrc: stimulus.audio_url ?? undefined } : {}),
      });
      if (item) items.push(item);
    }
  }

  return items;
}

/**
 * One question as a taster item, or `null` when the engine cannot render it.
 *
 * Shared by the standalone and the stimulus-backed paths so the eligibility rules cannot drift
 * apart — a question the taster silently skips on one path and renders broken on the other is
 * exactly the sort of thing no type catches.
 */
function mcqItem(
  q: QuestionItem,
  shell: Pick<FreePracticeItem, 'id' | 'subSkill' | 'stimulusIntro'> &
    Partial<Pick<FreePracticeItem, 'stimulusHtml' | 'audioSrc'>>
): FreePracticeItem | null {
  // The taster renders answers as text. An item whose options are images belongs in the
  // player, which has a renderer for them.
  if (q.option_layout !== 'text') return null;

  const byLabel = new Map(q.options.map(o => [o.label, o] as const));
  const a = byLabel.get('A');
  const b = byLabel.get('B');
  const c = byLabel.get('C');
  const d = byLabel.get('D');

  // Three options are the minimum the engine renders, and a body is what it renders.
  if (!a?.body || !b?.body || !c?.body) return null;
  if (d && !d.body) return null;

  const correctLabel = q.options.find(o => o.is_correct)?.label;
  // `question_options_one_correct_idx` guarantees at most one correct row, not at least
  // one. An item with no answer key would mark every choice wrong.
  if (!correctLabel || (correctLabel === 'D' && !d)) return null;

  // An explanation per question is the taster's whole promise ("direct uitleg van een
  // gecertificeerde NT2-docent"), and it is the one field a half-authored item is missing.
  if (!q.explanation?.trim()) return null;

  return {
    ...shell,
    question: q.prompt,
    ...(q.image_url ? { questionImage: q.image_url } : {}),
    ...(q.prompt_audio_url ? { questionAudioSrc: q.prompt_audio_url } : {}),
    optionA: a.body,
    optionB: b.body,
    optionC: c.body,
    ...(d?.body ? { optionD: d.body } : {}),
    correct: correctLabel as OptionKey,
    explanation: q.explanation,
  };
}

/**
 * Ten taster questions, drawn from the source exams listed in `SOURCE`.
 *
 * With one source exam this is that exam's first ten renderable questions — A2's behaviour,
 * unchanged. With ten it is **round-robin**: the first question of each exam, then the second
 * of each, and so on. Round-robin rather than a slice per exam because a source exam can yield
 * fewer usable items than expected (an unpublished one yields none), and the shortfall then
 * spreads over the others instead of leaving a hole.
 *
 * Returns `null` when too few usable items exist across all of them. It never returns a short
 * set silently: a "10 gratis vragen" page that hands out four is a copy bug no type can catch,
 * so a set below `TASTER_COUNT` is treated as absent and the caller decides — A2 falls back to
 * the static set, B1 404s.
 */
export async function fetchDbFreePractice(
  level: Level | null,
  skill: OnderdeelSlug
): Promise<FreePracticeItem[] | null> {
  const numbers = SOURCE[sourceKey(level, skill)];
  if (numbers === undefined) return null;

  const contents = await Promise.all(numbers.map(n => fetchExamContent(level, skill, n)));
  const pools = contents.map(c => (c ? itemsFromExam(c, level, skill) : []));

  const items: FreePracticeItem[] = [];
  const deepest = Math.max(0, ...pools.map(p => p.length));
  for (let round = 0; round < deepest && items.length < TASTER_COUNT; round++) {
    for (const pool of pools) {
      if (items.length >= TASTER_COUNT) break;
      const item = pool[round];
      if (item) items.push(item);
    }
  }

  return items.length >= TASTER_COUNT ? items : null;
}
