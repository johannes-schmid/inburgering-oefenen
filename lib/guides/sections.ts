/**
 * A guide's H2 sections, read out of its own `articleHtml`.
 *
 * The step lists on `/inburgering` and the jump-to nav in a guide's sidebar are **not** a second
 * copy of the article's outline — they are derived from it. That is the whole point: a docent who
 * adds, renames or reorders an `<h2>` changes the navigation in the same edit, and the two cannot
 * drift. A hand-written outline in `phases.ts` would be a second source of truth for the one thing
 * the reader uses to find their place.
 *
 * Two properties of the existing content make this safe, and both must be preserved:
 *
 * 1. **Every `<h2>` already carries an `id`**, and the ids are *identical across nl/en/ar* — only
 *    the visible text is translated. So a section id is a stable key: progress recorded while
 *    reading the Dutch page still reads back on the Arabic one, and no per-locale mapping exists
 *    to get out of step. An `<h2>` **without** an id is skipped rather than given a generated one:
 *    a slug derived from the heading text would differ per locale and silently split one section's
 *    progress into three.
 * 2. The bodies are authored as flat HTML strings, so "the text belonging to a section" is simply
 *    everything up to the next `<h2>` — which is what makes a per-section reading estimate
 *    possible without an AST.
 */

export type GuideSectionEntry = {
  /** The `<h2 id>`. Stable across locales — see rule 1 above. */
  id: string;
  /** The heading, in this locale, with any inline markup stripped. */
  title: string;
  /** Rounded-up reading estimate for this section alone. Never 0 — a "0 min" step reads as empty. */
  minutes: number;
};

/** Matches an opening `<h2>` and captures its attributes, so a missing `id` is detectable. */
const H2 = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;

/**
 * Words per minute for the estimate. Deliberately low: these guides are written for an A2 reader
 * (`SEO/voice.md`), often in a second language, and an estimate that runs short is the one that
 * costs trust — the label exists to make a step look approachable, not to be a stopwatch.
 */
const WPM = 130;

function stripTags(html: string): string {
  /* Tags collapse to a **space**, never to nothing. Stripping `a<br>b` to `ab` glues two words
     into one — the same trap the B1 authoring run hit (see CLAUDE.md, "Two authoring bugs"). */
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(html: string): number {
  const text = stripTags(html);
  return text ? text.split(' ').length : 0;
}

/**
 * The sections of one locale's body, in document order.
 *
 * Pure and synchronous: it runs in a server component on every render, so it must stay a string
 * scan. The bodies are ~10–25 kB, which is a fraction of a millisecond.
 */
export function guideSections(articleHtml: string): GuideSectionEntry[] {
  const heads: { id: string; title: string; start: number; end: number }[] = [];

  H2.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = H2.exec(articleHtml)) !== null) {
    const id = /\bid=["']([^"']+)["']/.exec(m[1])?.[1];
    if (!id) continue;
    heads.push({ id, title: stripTags(m[2]), start: m.index, end: m.index + m[0].length });
  }

  return heads.map((h, i) => {
    const bodyEnd = i + 1 < heads.length ? heads[i + 1].start : articleHtml.length;
    const words = countWords(articleHtml.slice(h.end, bodyEnd));
    return { id: h.id, title: h.title, minutes: Math.max(1, Math.ceil(words / WPM)) };
  });
}

/** How many sections a body has — the denominator of "N van M gelezen". */
export function sectionCount(articleHtml: string): number {
  return guideSections(articleHtml).length;
}
