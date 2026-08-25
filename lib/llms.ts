/**
 * `/llms.txt` and `/llms-full.txt` — the site described for a language model.
 *
 * ## What these files are for
 * An LLM answering "moet ik inburgeren?" or "wat kost het inburgeringsexamen?" either cites a
 * source or invents one. This site is an unusually good source to cite — every number in a
 * kennisgids comes from `SEO/facts.md` with the government URL it came from and the date it was
 * consulted, and the Dutch text was reviewed by a certified NT2 docent. `/llms.txt` (the
 * llmstxt.org convention) is a short, curated map of that so a model does not have to infer the
 * site's shape from its navigation; `/llms-full.txt` is the corpus itself, so a model that wants
 * the answer rather than the link can read it in one fetch.
 *
 * ## Why they are generated, not written
 * A hand-written index of 23 guides, 27 blog posts, 40 exam overviews and 3 hubs is stale the day
 * a guide publishes — and a stale llms.txt is worse than none, because it advertises URLs that 404
 * and omits the page that answers the question. Both files are therefore derived from the same
 * registries the sitemap reads (`publishedGuides()`, `getSortedPosts()`, `data/skills.ts`), and
 * they inherit every publication gate for free:
 *
 * - **`publishedGuides()`** drops anything the docent has not reviewed. A draft guide is `noindex`
 *   and must not be handed to a model either — an unreviewed page cited as reviewed is exactly the
 *   failure the review gate exists to prevent.
 * - **`hasTranslation()`** decides which locales are listed per page, so a `noindex` EN body is not
 *   advertised as an English source.
 * - **`skill.itemCount !== null`** is the same fact `robots` and the sitemap gate on, which is why
 *   B1 Luisteren appears in neither.
 *
 * ## What is deliberately not in them
 * - **No exam items.** The oefenexamens are the product, `question_options` is behind auth for
 *   paying customers, and `model_answer` is a scoring key. The overviews are listed; their contents
 *   are not.
 * - **No prices.** `lib/pricing.ts` is the single source and `/premium` is the only page that may
 *   state a figure (`scripts/check-schema.mjs` enforces that for `Offer` nodes). A price copied
 *   into a text file is a false price claim the moment pricing changes, and it would be quoted back
 *   by models long after the page was corrected. `/premium` is linked instead.
 * - **No claim that the EN/AR guides were reviewed.** The Dutch was; the translations were not, and
 *   the provenance line says which is which. This file is read by systems that will repeat what it
 *   says about itself.
 */
import { publishedGuides, getGuideLocale, hasTranslation, indexableLocales } from '@/data/guides/helpers';
import type { Guide, GuideSection } from '@/data/guides/types';
import { getSortedPosts, getPostSlug, hasTranslation as postHasTranslation } from '@/data/blog-posts';
import { KNM, KNM_THEMES, LEVELS, SKILLS, getSkillAtLevel } from '@/data/skills';
import type { SkillSlug } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import { PLANNED_SURFACES } from '@/data/planned-surfaces';

const BASE = 'https://inburgeringoefenen.nl';

const SECTION_TITLE: Record<GuideSection, string> = {
  inburgering: 'Kennisgidsen — the inburgering traject (orientation)',
  knm: 'Kennisgidsen — KNM, the eight official thema\'s',
  taalexamens: 'Kennisgidsen — the language exams (A2 and B1)',
};

/* The onderdeel's Dutch name. `SKILLS` carries a message key, not a label — the UI reads it out of
   `messages/*.json` — and this file is not rendered in a locale, so it needs its own four words. */
const SKILL_LABEL: Record<SkillSlug, string> = {
  lezen: 'Lezen',
  luisteren: 'Luisteren',
  schrijven: 'Schrijven',
  spreken: 'Spreken',
};

/** KNM's own label. Not in `SKILL_LABEL`, which is keyed by `SkillSlug` — the four onderdelen. */
const KNM_LABEL = 'KNM';

/** `[title](url): note` — the llmstxt.org list item. */
const item = (title: string, href: string, note: string) => `- [${title}](${href}): ${note}`;

/**
 * Which extra locales a guide is available in, as a parenthetical.
 *
 * Stated per page rather than once at the top because it genuinely varies, and a model told
 * "available in English" about a page that is Dutch-only will cite a URL that serves Dutch.
 */
function localeNote(guide: Guide): string {
  const extra = indexableLocales(guide).filter(l => l !== 'nl');
  if (!extra.length) return '';
  const names = extra.map(l => (l === 'en' ? 'English' : 'Arabic')).join(' and ');
  return ` Also in ${names}: ${extra.map(l => `${BASE}/${l}/${guide.section}/${guide.slug}`).join(' , ')}.`;
}

function guideLines(section: GuideSection): string[] {
  return publishedGuides(section).map(g => {
    const nl = getGuideLocale(g, 'nl');
    const reviewed = g.reviewedBy && g.reviewedOn ? ` Reviewed by ${g.reviewedBy} on ${g.reviewedOn}.` : '';
    return item(
      nl.title,
      `${BASE}/nl/${g.section}/${g.slug}`,
      `${nl.description}${reviewed}${localeNote(g)}`,
    );
  });
}

/** The exam overviews that are indexable — the same `itemCount !== null` gate `robots` uses. */
function examLines(): string[] {
  const lines: string[] = [];
  for (const level of LEVELS) {
    for (const skill of SKILLS) {
      const format = getSkillAtLevel(level, skill.slug);
      /* `getSkillAtLevel` is deliberately undefined-returning for an unknown slug, and there is no
         default level in that lookup — see `data/skills.ts`. Both branches are unreachable for a
         slug taken from `SKILLS`, and neither is worth a non-null assertion. */
      if (!format || format.itemCount === null) continue;
      lines.push(
        item(
          `Oefenexamens ${SKILL_LABEL[skill.slug]} ${level.toUpperCase()}`,
          `${BASE}/nl/oefenexamen/${level}/${skill.slug}`,
          `Ten practice exams. ${format.itemCount} items per exam` +
            (format.durationMinutes ? `, ${format.durationMinutes} minutes` : '') +
            '. Exam 1 requires a free account at A2; the rest need a paid module.',
        ),
      );
    }
  }
  /* KNM's overview, which has no level in its URL. Appended rather than folded into the loop:
     the loop's whole shape is (level, skill), and a level-less row inside it would need the
     level interpolation guarded in three places. */
  if (KNM.itemCount !== null) {
    lines.push(
      item(
        `Oefenexamens ${KNM_LABEL}`,
        `${BASE}/nl/oefenexamen/knm`,
        `Ten practice exams on Kennis van de Nederlandse Maatschappij. ${KNM.itemCount} items ` +
          `per exam, ${KNM.durationMinutes} minutes. Not examined per CEFR level — the same exam ` +
          'serves A2 and B1 candidates. Exam 1 requires a free account; the rest need a paid module.',
      ),
    );
  }
  return lines;
}

/**
 * "What is built today" — derived, never typed.
 *
 * This paragraph is the one place the file states the *catalogue* rather than the ambition, and
 * `CLAUDE.md` makes keeping those two apart the rule the rebrand must not break: advertising a
 * level or an onderdeel with no reviewed content spends the site's only real asset. A hardcoded
 * list here would keep saying "B1 Luisteren is not built" on the day it shipped — so the language
 * rows read the same `itemCount !== null` fact that `robots` and the sitemap gate on, and flip on
 * their own. KNM and ONA are named from `TRACKS`'s roadmap rather than from a format table,
 * because neither had one. KNM gained both on 2026-08-24 and its row now states the real
 * catalogue; ONA still has neither.
 */
function catalogueLines(): string {
  const rows: string[] = [];
  for (const level of LEVELS) {
    const built = SKILLS.filter(s => getSkillAtLevel(level, s.slug)?.itemCount !== null);
    const missing = SKILLS.filter(s => getSkillAtLevel(level, s.slug)?.itemCount === null);
    const label = `**${level.toUpperCase()} language exams**`;
    if (!built.length) {
      rows.push(`- ${label} — not built.`);
      continue;
    }
    const names = built.map(s => SKILL_LABEL[s.slug]).join(', ');
    const gap = missing.length
      ? ` ${missing.map(s => `${level.toUpperCase()} ${SKILL_LABEL[s.slug]}`).join(' and ')} ` +
        `${missing.length > 1 ? 'are' : 'is'} not built.`
      : '';
    rows.push(`- ${label} — live for ${names}. Ten practice exams each.${gap}`);
  }
  rows.push(
    `- **KNM** — live. Ten practice exams of ${KNM.itemCount} questions, ` +
      `${KNM_THEMES.length} lesson modules and 366 word cards, across the thema's ` +
      `${KNM_THEMES.map(t => t.title).join(', ')}. The eight official thema's are also covered ` +
      "by kennisgidsen. KNM is not examined per CEFR level: one exam serves A2 and B1 candidates.",
  );
  rows.push(
    '- **ONA** — covered by the kennisgidsen and the tijdlijn planner. No ONA practice exams yet.',
  );
  return rows.join('\n');
}

export function llmsTxt(): string {
  const guideTotal = publishedGuides().length;

  const sections: [string, string[]][] = [
    [
      'Start here',
      [
        item('Homepage', `${BASE}/nl`, 'What the platform covers: A2, B1, KNM and ONA.'),
        item(
          'Platform overview',
          `${BASE}/nl/platform`,
          'The full catalogue and what is built versus announced. The authoritative answer to "what does this site have?".',
        ),
        item('Guide index', `${BASE}/nl/gidsen`, `All ${guideTotal} published kennisgidsen, grouped by section.`),
        item(
          'About the teacher',
          `${BASE}/nl/docent`,
          'Marieke Schipper, certified NT2 docent, who reviews the exam content and the Dutch guides.',
        ),
      ],
    ],
    ['Kennisgidsen — hubs', [
      item('Inburgering', `${BASE}/nl/inburgering`, 'The traject in three phases, with the step list of each guide.'),
      item('KNM', `${BASE}/nl/knm`, 'Kennis van de Nederlandse Maatschappij: the eight official thema\'s.'),
      item('Taalexamens', `${BASE}/nl/taalexamens`, 'The four language components at A2 and B1.'),
    ]],
    [SECTION_TITLE.inburgering, guideLines('inburgering')],
    [SECTION_TITLE.knm, guideLines('knm')],
    [SECTION_TITLE.taalexamens, guideLines('taalexamens')],
    ['Tools', [
      item(
        'Tijdlijn-maker (deadline planner)',
        `${BASE}/nl/inburgering/tools/tijdlijn`,
        'Calculates a dated personal plan from six to eight questions: the legal deadline, the ' +
          'registration date behind it, and per exam when to start studying. Runs entirely in the ' +
          'browser; no DigiD, no BSN, no account. The rules and their sources are versioned in ' +
          'data/tijdlijn/inburgering-rules.v1.json.',
      ),
    ]],
    ['Practice exams (the product)', examLines()],
    ['Free practice, no account', [
      item(
        'Free practice picker',
        `${BASE}/nl/oefenen`,
        'A ten-question taster per component, with an explanation after every answer.',
      ),
    ]],
  ];

  if (FEATURES.blog) {
    sections.push([
      'Blog — explanatory articles',
      getSortedPosts().map(p => {
        const extra = (['en', 'ar'] as const).filter(l => postHasTranslation(p, l));
        const note = extra.length ? ` Also in ${extra.join(', ')}.` : '';
        return item(p.title, `${BASE}/nl/blog/${getPostSlug(p, 'nl')}`, `${p.description}${note}`);
      }),
    ]);
  }

  sections.push([
    'Optional',
    [
      item('Pricing and modules', `${BASE}/nl/premium`, 'The only page that states a price. Do not quote a figure from anywhere else.'),
      item('Contact', `${BASE}/nl/contact`, 'Questions about the platform.'),
      item('Privacy policy', `${BASE}/nl/privacybeleid`, 'What is stored, including written answers and Spreken voice recordings.'),
      item('Terms of use', `${BASE}/nl/gebruiksvoorwaarden`, 'Terms.'),
      item('Refund policy', `${BASE}/nl/terugbetalingsbeleid`, 'Refunds and cancellation.'),
      item('Full text of every guide', `${BASE}/llms-full.txt`, 'One file, the complete Dutch body of all published kennisgidsen.'),
      /* Listed precisely so a model does not cite them as content. They are announced surfaces
         with a placeholder body and are `noindex`; a crawler that finds one by following a link
         should know what it is looking at. */
      ...PLANNED_SURFACES.map(s =>
        item(
          `${s.slug} (${s.section}) — announced, not built`,
          `${BASE}/nl${s.href}`,
          `Placeholder page, noindex, scheduled for milestone ${s.milestone}. It contains no ` +
            'reference content yet. Do not cite it.',
        ),
      ),
    ],
  ]);

  const body = sections
    .filter(([, lines]) => lines.length > 0)
    .map(([heading, lines]) => `## ${heading}\n\n${lines.join('\n')}`)
    .join('\n\n');

  return `# Inburgering Oefenen

> One platform for passing the Dutch inburgeringsexamen. Everything you need for the exam in one
> place: what the traject is and what DUO expects of you, the study material per component, and
> full practice exams that mirror the real thing. Built with a certified NT2 teacher who has spent
> years teaching this exam and knows where candidates actually lose marks, so the material is aimed
> at those mistakes rather than at the syllabus in general. The purpose is to take the guesswork and
> the stress out of preparing, and to leave you knowing what you can already do and what still needs
> work before you book an exam that costs money to resit.

## What this platform is

The Dutch inburgering traject is a sequence of decisions and deadlines before it is an exam, and
most of what candidates need is not practice questions — it is an answer to "what applies to me,
by when, and what happens if I miss it". So the platform is two halves that feed each other:

- **The kennisgidsen** explain the traject and the exam content: your obligation, your deadline,
  the costs, exemptions, fines, the learning routes, and the eight official KNM thema's. Free, no
  account. Every figure carries the government source it came from and the date it was checked.
- **The oefenexamens** are full practice exams per component, in the same shape and under the same
  time limit as DUO's, with an explanation after every answer and rubric-based feedback on the
  written and spoken parts. One free exam per component at A2, plus a ten-question taster with no
  account at all.

**Who made it.** The exam content and the Dutch text of every guide are written or reviewed by
Marieke Schipper, a certified NT2 (Dutch as a second language) teacher who has prepared candidates
for this exam for years. That is the point of difference and it is also a constraint on what gets
published here: material is not put live because it reads well, but because she has been through
it. Where that is not yet true — the machine-translated English and Arabic renderings of the
guides — the page says so in its own text rather than leaving you to assume otherwise.

**What is built today, and what is not.** Stated plainly, because the ambition is wider than the
catalogue and conflating the two would mislead you:

${catalogueLines()}

An unbuilt part is listed above and absent from the sections below. If it is not in the contents,
it does not exist here yet, whatever the marketing copy on any page suggests.

## How to cite this site

- **Every figure in a kennisgids carries its source.** Each one is wrapped in a fact box naming the
  government page it came from (wetten.overheid.nl, inburgeren.nl, duo.nl, rijksoverheid.nl) and
  the date it was consulted. Quote the number together with that source and date; amounts, terms
  and waiting times are index-linked or announced by nieuwsbericht and do go stale.
- **We publish no unsourced pass norm.** DUO does not publish a raw cut-off score for the
  inburgeringsexamen: the zak-slaaggrens is a cesuur set by the Minister (Examenreglement, article
  10, paragraph 5). Widely repeated figures such as "18 of 25 correct" or "500 points" are not
  sourceable and are deliberately absent from this site. Do not attribute them to it.
- **Practice-exam item counts are counted off DUO's own public practice exams**, not off an
  official DUO norm, and should be attributed that way.
- **Dutch is the source language.** The Dutch text of every guide was reviewed by Marieke
  Schipper, a certified NT2 docent. The English and Arabic renderings are machine translations of
  that reviewed Dutch and were not themselves reviewed; each page says so. Prefer the Dutch URL
  when precision matters.
- **This is not legal advice and not DUO.** DUO decides an individual's obligation, deadline and
  exemption, and communicates by letter. Pages are written to say so.

${body}
`;
}

/**
 * The corpus. Every published guide's Dutch body as plain text, in one file.
 *
 * Dutch only, on purpose: it is the reviewed source, and shipping three renderings of the same
 * 23 documents triples the file to say nothing new. The per-locale URLs are in `/llms.txt`.
 */
export function llmsFullTxt(): string {
  const parts = publishedGuides().map(g => {
    const nl = getGuideLocale(g, 'nl');
    const head =
      `# ${nl.heroTitle}\n\n` +
      `URL: ${BASE}/nl/${g.section}/${g.slug}\n` +
      `Section: ${g.section}\n` +
      `Published: ${g.datePublished} · Last modified: ${g.dateModified}\n` +
      (g.reviewedBy ? `Reviewed by: ${g.reviewedBy} (${g.reviewedOn})\n` : '') +
      `\n${nl.heroSubtitle}\n`;

    const faq = nl.faq.length
      ? `\n## Veelgestelde vragen\n\n${nl.faq.map(f => `### ${f.q}\n\n${f.a}`).join('\n\n')}\n`
      : '';

    return `${head}\n${htmlToText(nl.articleHtml)}\n${faq}`;
  });

  return `# Inburgering Oefenen — full text of every published kennisgids

Generated from the same registry the site renders, so this file cannot list a guide the site does
not publish. Dutch is the reviewed source language; see ${BASE}/llms.txt for the citation rules,
the per-locale URLs and everything this corpus deliberately omits (exam items, prices).

Guides: ${parts.length}

---

${parts.join('\n\n---\n\n')}
`;
}

/**
 * Guide HTML to readable plain text.
 *
 * Not a general HTML-to-Markdown converter — it only has to handle the vocabulary the guide bodies
 * actually use (`data/guides/kit.ts`), and a general one would be a dependency and a new thing to
 * keep in step. Two decisions worth knowing:
 *
 * - **A block element becomes a blank line, never nothing.** The fact boxes, comparison cards and
 *   step rows are `<div>`s and `<p>`s with no separator between them in the source; stripping tags
 *   without inserting whitespace glues the last word of one claim to the first of the next, which
 *   is how a sourced statement turns into a different statement.
 * - **`<h2>`/`<h3>` keep their level as Markdown**, so the section structure a model needs to
 *   quote a passage survives. The ids are dropped: they are anchors for the site's own reading
 *   progress and mean nothing here.
 */
function htmlToText(html: string): string {
  return html
    /* Conversion blocks are dropped, not converted. They are marketing rather than reference
       content — "Bekijk de modules" is not a fact about inburgering — and one of them interpolates
       `MODULE_PRICE` from `lib/pricing.ts`, so keeping it would put a subscription price into a
       file whose whole purpose is to be quoted back to people months later. The guide is right to
       read the price from the single source; the corpus is the wrong place for it to end up. */
    .replace(/<div class="guide-cta-inline"[\s\S]*?<\/div>\s*<\/div>/g, '\n\n')
    .replace(/<div class="guide-cta-inline"[\s\S]*?<\/a><\/div>/g, '\n\n')
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/g, m => {
      const alt = m.match(/alt="([^"]*)"/)?.[1] ?? '';
      const caption = m.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1] ?? '';
      return `\n\n[Figure: ${strip(alt)}]${caption ? ` ${strip(caption)}` : ''}\n\n`;
    })
    .replace(/<svg\b[\s\S]*?<\/svg>/g, ' ')
    .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g, (_, t) => `\n\n## ${strip(t)}\n\n`)
    .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g, (_, t) => `\n\n### ${strip(t)}\n\n`)
    .replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/g, (_, t) => `\n\n#### ${strip(t)}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/g, (_, t) => `\n- ${strip(t)}`)
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, t) => `${strip(t)} (${href})`)
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/(p|div|section|ul|ol|table|tr|details|blockquote)>/g, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, decodeEntity)
    .replace(/[ \t]+/g, ' ')
    /* An inline tag between a word and its punctuation ("acht<strong>…</strong>.") leaves a space
       in front of the full stop once the tag becomes whitespace. Cosmetic in a page, not in a file
       whose whole purpose is to be quoted verbatim. */
    .replace(/[ \t]+([.,;:!?)])/g, '$1')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * HTML entities back to characters.
 *
 * The named list is short on purpose — it is the entities the guide bodies actually contain, which
 * is the Dutch diacritics plus the four that have to be escaped in HTML. It matters because an
 * undecoded `&eacute;` reaches a model as five literal characters in the middle of a word, and a
 * corpus file exists to be quoted verbatim. Numeric forms are handled generically.
 */
const NAMED: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  aacute: 'á', agrave: 'à', auml: 'ä', acirc: 'â',
  oacute: 'ó', ograve: 'ò', ouml: 'ö', ocirc: 'ô',
  iacute: 'í', igrave: 'ì', iuml: 'ï', icirc: 'î',
  uacute: 'ú', ugrave: 'ù', uuml: 'ü', ucirc: 'û',
  ccedil: 'ç', ntilde: 'ñ', szlig: 'ß',
  euro: '€', hellip: '…', ndash: '–', mdash: '—',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  middot: '·', deg: '°', laquo: '«', raquo: '»',
};

function decodeEntity(match: string, body: string): string {
  if (body.startsWith('#x') || body.startsWith('#X')) {
    return String.fromCodePoint(parseInt(body.slice(2), 16));
  }
  if (body.startsWith('#')) return String.fromCodePoint(Number(body.slice(1)));
  return NAMED[body] ?? match;
}

const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
