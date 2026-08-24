/**
 * Translate the kennisgidsen into English and Arabic — one model call per (guide, locale).
 *
 * ## Why this exists
 * Twenty-four guides were published in Dutch between 2026-08-19 and 2026-08-23. Four of them carry
 * EN/AR bodies; the other twenty do not, and `hasTranslation()` therefore `noindex`es them in both
 * locales rather than serving a thin duplicate of the Dutch. That is the correct gate and it left
 * **forty pages unreachable** in the two languages a large part of the paying audience reads
 * (gezinsmigranten, often EN/AR-speaking). This script fills the gate rather than removing it.
 *
 * ```bash
 * node scripts/translate-guides.mjs plan                 # what would be written, no calls
 * node scripts/translate-guides.mjs all --check          # validate what is already on disk
 * node scripts/translate-guides.mjs wonen --locale en    # one unit
 * node scripts/translate-guides.mjs all                  # every missing unit
 * node scripts/translate-guides.mjs all --force          # re-translate, ignoring the cache
 * ```
 *
 * ## What a "unit" is, and why it is one call
 * One (guide, locale). A guide body is 6–14 k characters of Dutch with its markup helpers
 * interpolated into it; that fits one call with room for the answer, and it is the smallest thing
 * that can be *retried*. Splitting a body into sections would be cheaper per retry and would break
 * the one property the translation has to have: a consistent voice and a consistent choice of term
 * across the whole page. Splitting across guides is fine — hence one unit per guide, not per
 * section.
 *
 * Units are cached in `.translation-cache/` (gitignored) keyed by a hash of the **Dutch source**,
 * so an interrupted run resumes, and editing a Dutch guide invalidates only its own translations.
 *
 * ## The model gets the source file, not the rendered HTML
 * A guide body is a TypeScript template literal with `${row('3.1', 'Passende huisvesting regelen')}`
 * in it. The translation has to be the *same expression with translated arguments*, because that is
 * what keeps the markup shared: change `row()` and all three languages change with it. Handing the
 * model rendered HTML would get rendered HTML back and every block would then be frozen at the
 * shape it had on the day it was translated. So the whole `.ts` file goes in, and TypeScript source
 * for each field comes back.
 *
 * ## The three substitutions that are not translations
 * `fact()`, `factTwo()` and `docent()` hardcode Dutch chrome ("Bron:", "geraadpleegd",
 * "NT2-docent"). `kit.ts` already carries localised twins — `factIn(locale, …)`,
 * `factTwoIn(locale, …)`, `docentIn(locale, …)` — so the prompt asks for those and the validator
 * *requires* them: a translated body still saying "Bron:" is the one defect that looks completely
 * finished. The source label and URL inside a fact box are deliberately left in Dutch; they name a
 * Dutch government page.
 *
 * ## What the validator refuses, and why each one is a real failure
 * Every rule below has a failure mode that no compiler, test or screenshot would catch:
 *
 * - **`<h2 id>` ids must be identical, in order.** `lib/guides/sections.ts` reads those ids as the
 *   step list on `/inburgering` and reading progress is keyed on them. A translated id splits one
 *   section's progress into three and silently empties the step list on the EN and AR hubs.
 * - **The sequence of interpolated expressions must match.** This is the only check that notices a
 *   *dropped block*. A body missing one `${card(…)}` compiles, renders, reads perfectly and is
 *   quietly missing a third of a comparison.
 * - **Every URL in the Dutch body must survive.** A translation that paraphrases a link away
 *   removes the sourcing that `SEO/facts.md` requires of every number on the site.
 * - **`description` must be 140–160 characters.** `tests-unit/guides.test.ts` enforces this per
 *   locale, so a translation outside the band fails the suite rather than the page — the failure
 *   arrives far from its cause.
 * - **No raw backtick, balanced `${`.** Either one turns the generated file into a syntax error, or
 *   worse, into a valid file whose body ends early.
 * - **No `\\uXXXX` left in the JSON.** Same double-escape bug the B1 authoring run hit
 *   (`scripts/b1-content/author.mjs`): the model emits two characters of escape where it means one,
 *   the JSON stays valid, and the reader is shown `co\\u00f6rdinator` mid-sentence.
 *
 * A unit that fails is asked for again **with the broken rules listed** — three attempts, then the
 * run stops. An unqualified retry mostly reproduces the same mistake at the same price.
 *
 * ## What it writes
 * `data/guides/translations/<slug>.<locale>.ts` (one default-exported `GuideLocale`) plus the
 * generated block in `translations/index.ts`. Imports are **derived** from the identifiers the
 * body actually uses, resolved against `kit.ts`'s exports and the guide's own — which is why every
 * guide file exports its local helpers.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';

const ROOT = path.resolve(import.meta.dirname, '..');
const GUIDE_DIR = path.join(ROOT, 'data', 'guides');
const OUT_DIR = path.join(GUIDE_DIR, 'translations');
const CACHE_DIR = path.join(ROOT, 'scripts', '.translation-cache');

const MODEL = 'claude-opus-5';
const GATEWAY_URL = 'https://ai-gateway.vercel.sh';

/* ── env ─────────────────────────────────────────────────────────────────── */

function loadEnv() {
  const out = {};
  for (const file of ['.env.local', '.env.development.local']) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

/* ── the guides on disk ──────────────────────────────────────────────────── */

/** Guides that are not translated here, because their EN/AR bodies are still inline. */
const INLINE = new Set([
  'inburgering-stappenplan',
  'moet-ik-inburgeren',
  'welke-wet-en-welke-route',
  'wat-kost-inburgeren',
]);

const NOT_A_GUIDE = new Set(['index.ts', 'types.ts', 'helpers.ts', 'kit.ts', 'phases.ts']);

function guideFiles() {
  return fs
    .readdirSync(GUIDE_DIR)
    .filter(f => f.endsWith('.ts') && !NOT_A_GUIDE.has(f))
    .map(f => f.replace(/\.ts$/, ''))
    .filter(slug => !INLINE.has(slug))
    .sort();
}

/**
 * The body of a template-literal field, as source.
 *
 * Scans for the opening backtick after `<key>:` and walks forward tracking `${…}` nesting, so a
 * backtick *inside* an interpolation cannot end the literal early. Returns null when the field is
 * absent — `sidebarHtml` is optional on some guides.
 */
function templateField(source, key) {
  const open = source.indexOf('`', source.indexOf(`\n  ${key}:`));
  if (open === -1) return null;
  let depth = 0;
  for (let i = open + 1; i < source.length; i++) {
    const two = source.slice(i, i + 2);
    if (two === '${') { depth++; i++; continue; }
    if (source[i] === '}' && depth > 0) { depth--; continue; }
    if (source[i] === '`' && depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`unterminated template literal for ${key}`);
}

/** Names a module exports, read off the source. Enough for `export const x` / `export function x`. */
function exportedNames(file) {
  const src = fs.readFileSync(file, 'utf8');
  return new Set([...src.matchAll(/^export (?:const|function) (\w+)/gm)].map(m => m[1]));
}

/* ── structural fingerprints, shared by the prompt and the validator ─────── */

const headingIds = html => [...html.matchAll(/<h2 id="([^"]+)"/g)].map(m => m[1]);

/**
 * The ordered sequence of interpolated expressions, by their head identifier.
 *
 * `${row('3.1', …)}` → `row`, `${SRC_AFVAL}` → `SRC_AFVAL`. Comparing the *sequence* rather than
 * the set is deliberate: a body that keeps every kind of block but loses one of three `card()`s is
 * the failure this catches, and a set would not see it.
 */
const expressionSeq = html => [...html.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)/g)].map(m => m[1]);

/** The Dutch helpers that must become their localised twin. */
const LOCALISED = { fact: 'factIn', factTwo: 'factTwoIn', docent: 'docentIn' };

const localisedSeq = seq => seq.map(name => LOCALISED[name] ?? name);

/**
 * Every identifier that appears **anywhere inside** an interpolation.
 *
 * Distinct from `expressionSeq`, which takes only the head of each `${…}` and is the structural
 * fingerprint. This one drives the import list, and it has to look inside the arguments: a fact box
 * is written `${factIn('en', claim, label, SRC_HUURWONING, CHECKED)}`, so the two constants that
 * actually need importing never appear at the head of anything. Deriving imports from the heads
 * alone produced a file that referenced four undefined names and failed to compile — which is the
 * good failure, but only because `tsc` runs; a missing import is not something the validator here
 * can see.
 */
function usedIdentifiers(text) {
  const found = new Set();
  for (let i = 0; i < text.length; i++) {
    if (text.slice(i, i + 2) !== '${') continue;
    let depth = 1;
    let j = i + 2;
    for (; j < text.length && depth > 0; j++) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') depth--;
    }
    const inner = text.slice(i + 2, j - 1);
    /* Skip anything inside a quoted string: translated prose contains words that collide with
       identifier names, and importing `Source` because a sentence used it is a compile error. */
    const bare = inner.replace(/'(?:[^'\\]|\\.)*'/g, ' ').replace(/"(?:[^"\\]|\\.)*"/g, ' ');
    for (const m of bare.matchAll(/[A-Za-z_$][\w$]*/g)) found.add(m[0]);
    i = j - 1;
  }
  return [...found];
}

const urls = text => [...text.matchAll(/https?:\/\/[^\s'"`)<]+/g)].map(m => m[0]);

const tagCounts = html => {
  const counts = {};
  for (const m of html.matchAll(/<(h2|h3|h4|li|table|tr|figure|details)\b/g)) {
    counts[m[1]] = (counts[m[1]] ?? 0) + 1;
  }
  return counts;
};

/* ── the prompt ──────────────────────────────────────────────────────────── */

const LANG = {
  en: {
    name: 'English',
    audience:
      'Adults who have recently moved to the Netherlands and read English better than Dutch. Many ' +
      'are family migrants. They are not native English speakers, so write plain international ' +
      'English: short sentences, common words, no idiom, no humour, no Latinate flourish.',
    conventions:
      '- Dates as "23 August 2026". Amounts stay in euros, written €50.\n' +
      '- British spelling ("organisation", "practise" as a verb), matching the rest of the site.\n' +
      '- Keep the Dutch name of anything the reader will meet as a Dutch word, with a short gloss ' +
      'the first time: "inburgering (civic integration)", "Mijn Inburgering", "DUO", "gemeente ' +
      '(municipality)", "huurcommissie". Never translate a proper noun, a form name, an act name ' +
      '(Wet inburgering 2021) or an exam part name (KNM). A reader who cannot recognise the Dutch ' +
      'word on the letter they received is worse off than one who read an English paragraph.',
  },
  ar: {
    name: 'Arabic',
    audience:
      'Adults who have recently moved to the Netherlands and read Modern Standard Arabic. Many are ' +
      'family migrants from Syria, Morocco, Egypt or Iraq. Write clear, neutral Modern Standard ' +
      'Arabic — not dialect, and not the ornate register of a newspaper editorial.',
    conventions:
      '- Modern Standard Arabic (فصحى معاصرة), addressing the reader directly and politely.\n' +
      '- Dates written out in Arabic: "23 أغسطس 2026". Amounts keep the euro sign: €50.\n' +
      '- Numerals: use Western Arabic digits (50, 2026), which is what Dutch letters and DUO ' +
      'websites show and what the reader has to match.\n' +
      '- **Keep every Dutch proper noun in Latin script**, inside the Arabic sentence: DUO, KNM, ' +
      'Mijn Inburgering, Wet inburgering 2021, gemeente, huurcommissie, and the name of any form ' +
      'or website. Add a short Arabic gloss the first time. A transliteration the reader cannot ' +
      'match against the letter in their hand is useless, and this is the single most important ' +
      'rule in this list.\n' +
      '- Do not add any RTL/LTR control characters. The page sets direction in CSS.',
  },
};

const SYSTEM = `
You translate published reference pages for Inburgering Oefenen, a Dutch platform that prepares
people for the Dutch inburgeringsexamen. The Dutch source has been fact-checked and reviewed by a
certified NT2 teacher. Your translation is read by people making decisions with legal and financial
consequences — a deadline, a fine, an exemption.

Because of that, three absolute rules:

1. **Translate. Never add, remove, soften or update a claim.** If the Dutch says "at the time of
   writing €50", say exactly that. If it hedges, keep the hedge. You have no newer information than
   the source and must not act as if you do. Do not add examples, caveats or advice of your own.
2. **The output is TypeScript source, not HTML.** You are given the guide's own source file. Return
   the same expressions with their arguments translated. Keep every \${...} interpolation, in the
   same order, calling the same helper.
3. **Structure is fixed.** Same number of sections, same \`<h2 id="...">\` ids (translate only the
   heading text, never the id), same tags, same blocks, same order.
`.trim();

function unitPrompt({ slug, source, locale, dutch }) {
  const L = LANG[locale];
  return `
Translate the guide in the file below into ${L.name}.

## Who reads it
${L.audience}

## Conventions for ${L.name}
${L.conventions}

## The file
Everything you need is here: the helper functions the body calls, the \`SRC_*\` constants, and the
Dutch text.

\`\`\`ts
${source}
\`\`\`

## What to return

A JSON object with one entry per field. \`articleHtml\` and \`sidebarHtml\` are **the text between
the backticks**, as TypeScript template-literal source — do not include the backticks themselves.

## Hard requirements

1. **Headings.** The body must contain exactly these \`<h2 id="...">\` ids, in this order, with the
   id spelled exactly as shown and only the heading text translated:
${dutch.ids.map((id, i) => `   ${i + 1}. id="${id}"`).join('\n')}

2. **Interpolations.** The body must contain exactly this sequence of \${...} expressions, in this
   order. Same helper, same number of arguments, arguments translated:
${dutch.seq.map((n, i) => `   ${i + 1}. \${${n}...}`).join('\n')}

   Three of them change name, because the Dutch versions hardcode Dutch chrome:
   - \`fact(claim, label, url, checked)\` becomes \`factIn('${locale}', claim, label, url, checked)\`
   - \`factTwo(claim, sources, checked)\` becomes \`factTwoIn('${locale}', claim, sources, checked)\`
   - \`docent(text)\` becomes \`docentIn('${locale}', text)\`
   Inside a fact box, **translate the claim and leave the source label and the URL in Dutch** — they
   name a Dutch government page that does not exist under a translated name. \`SRC_*\` constants and
   \`CHECKED\` are passed through unchanged, by name.

3. **Never a backtick** anywhere in your output. Use ' for strings inside interpolations, and
   escape nothing else.

4. **\`description\` must be between 140 and 160 characters** — this is enforced by a test, so count
   it. It is the meta description: one sentence that says what the page answers.

5. **\`title\` must be 60 characters or fewer.** It is the meta title.

6. Reply with JSON only.
`.trim();
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title', 'description', 'breadcrumb', 'dateLabel', 'eyebrow',
    'heroTitle', 'heroSubtitle', 'articleHtml', 'ctaTitle', 'ctaDesc', 'ctaLabel', 'faq',
  ],
  properties: {
    title: { type: 'string', description: 'Meta title, 60 characters or fewer.' },
    description: { type: 'string', description: 'Meta description, 140-160 characters.' },
    breadcrumb: { type: 'string', description: 'Short label for the last breadcrumb crumb.' },
    dateLabel: { type: 'string', description: "The publication date in this locale's convention." },
    eyebrow: { type: 'string', description: 'Small label above the H1.' },
    heroTitle: { type: 'string' },
    heroSubtitle: { type: 'string' },
    heroImageAlt: { type: 'string', description: 'Only if the source guide has a hero photo.' },
    articleHtml: { type: 'string', description: 'Template-literal source, without the backticks.' },
    sidebarHtml: { type: 'string', description: 'Only if the source guide has one.' },
    ctaTitle: { type: 'string' },
    ctaDesc: { type: 'string' },
    ctaLabel: { type: 'string' },
    faq: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['q', 'a'],
        properties: { q: { type: 'string' }, a: { type: 'string' } },
      },
    },
  },
};

/* ── validation ──────────────────────────────────────────────────────────── */

function seqEq(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function validate(unit, dutch, locale) {
  const problems = [];
  const body = unit.articleHtml ?? '';

  if (!body.trim()) problems.push('articleHtml is empty');

  if (body.includes('`')) problems.push('articleHtml contains a backtick, which is not allowed');

  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    if (body.slice(i, i + 2) === '${') { depth++; i++; } else if (body[i] === '}' && depth > 0) depth--;
  }
  if (depth !== 0) problems.push(`unbalanced \${...} in articleHtml (${depth} left open)`);

  const ids = headingIds(body);
  if (!seqEq(ids, dutch.ids)) {
    problems.push(
      `the <h2 id> sequence must be exactly [${dutch.ids.join(', ')}] but is [${ids.join(', ')}] — ` +
      'ids are keys and are never translated',
    );
  }

  const seq = expressionSeq(body);
  if (!seqEq(seq, dutch.seq)) {
    problems.push(
      `the \${...} sequence must be exactly [${dutch.seq.join(', ')}] but is [${seq.join(', ')}]`,
    );
  }

  for (const dutchOnly of Object.keys(LOCALISED)) {
    if (seq.includes(dutchOnly)) {
      problems.push(`use ${LOCALISED[dutchOnly]}('${locale}', ...) instead of ${dutchOnly}(...)`);
    }
  }

  const missingUrls = dutch.urls.filter(u => !body.includes(u) && !dutch.viaConst.has(u));
  if (missingUrls.length) {
    problems.push(`these URLs from the Dutch body are missing: ${missingUrls.join(', ')}`);
  }

  const dutchTags = dutch.tags;
  const ourTags = tagCounts(body);
  for (const [tag, n] of Object.entries(dutchTags)) {
    if ((ourTags[tag] ?? 0) !== n) {
      problems.push(`expected ${n} <${tag}> but found ${ourTags[tag] ?? 0}`);
    }
  }

  const ratio = body.length / dutch.length;
  if (ratio < 0.55 || ratio > 2.2) {
    problems.push(
      `articleHtml is ${Math.round(ratio * 100)}% the length of the Dutch — text is missing or padded`,
    );
  }

  const d = unit.description ?? '';
  if (d.length < 140 || d.length > 160) {
    problems.push(`description must be 140-160 characters, this one is ${d.length}`);
  }
  if ((unit.title ?? '').length > 60) {
    problems.push(`title must be 60 characters or fewer, this one is ${unit.title.length}`);
  }

  if ((unit.faq ?? []).length !== dutch.faqCount) {
    problems.push(`expected ${dutch.faqCount} FAQ entries, got ${(unit.faq ?? []).length}`);
  }

  if (dutch.hasSidebar && !unit.sidebarHtml?.trim()) problems.push('sidebarHtml is missing');
  if (dutch.hasHeroAlt && !unit.heroImageAlt?.trim()) problems.push('heroImageAlt is missing');

  if (JSON.stringify(unit).includes('\\\\u')) {
    problems.push('the response contains double-escaped \\uXXXX sequences; emit the character itself');
  }

  return problems;
}

/* ── writing the file ────────────────────────────────────────────────────── */

/** `${` is inert inside a template literal only if escaped; the bodies never contain a literal one. */
function tpl(text) {
  return `\`\n${text.replace(/^\n/, '')}\``;
}

const q = s => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function renderFile({ slug, locale, unit, dutch, kitExports, guideExports }) {
  const used = usedIdentifiers(`${unit.articleHtml}\n${unit.sidebarHtml ?? ''}`);
  const fromKit = used.filter(n => kitExports.has(n)).sort();
  const fromGuide = used.filter(n => !kitExports.has(n) && guideExports.has(n)).sort();
  const unresolved = used.filter(n => !kitExports.has(n) && !guideExports.has(n));
  if (unresolved.length) throw new Error(`cannot resolve identifiers: ${unresolved.join(', ')}`);

  const imports = [`import type { GuideLocale } from '../types';`];
  if (fromKit.length) imports.push(`import { ${fromKit.join(', ')} } from '../kit';`);
  if (fromGuide.length) imports.push(`import { ${fromGuide.join(', ')} } from '../${slug}';`);

  const scalars = [
    ['title', unit.title],
    ['description', unit.description],
    ['breadcrumb', unit.breadcrumb],
    ['dateLabel', unit.dateLabel],
    ['eyebrow', unit.eyebrow],
    ['heroTitle', unit.heroTitle],
    ['heroSubtitle', unit.heroSubtitle],
    ...(dutch.hasHeroAlt ? [['heroImageAlt', unit.heroImageAlt]] : []),
    ['ctaTitle', unit.ctaTitle],
    ['ctaDesc', unit.ctaDesc],
    ['ctaLabel', unit.ctaLabel],
  ];

  const faq = unit.faq
    .map(f => `  {\n    q: ${q(f.q)},\n    a: ${q(f.a)},\n  },`)
    .join('\n');

  return `/**
 * ${slug} — ${LANG[locale].name}.
 *
 * A translation of the Dutch body in \`../${slug}.ts\`, which the NT2 docent reviewed. This
 * rendering is machine-produced and has not itself been reviewed; see the header of
 * \`./index.ts\` for what that means and where the page says so.
 *
 * Generated by \`scripts/translate-guides.mjs\`. To change the wording, edit here — the script
 * caches on a hash of the Dutch source, so it will not overwrite this unless the Dutch changes
 * or you pass \`--force\`. The \`<h2 id>\` values and the sequence of \${...} expressions are
 * load-bearing and identical to the Dutch on purpose; the script refuses a body where they are not.
 */
${imports.join('\n')}

const translation: GuideLocale = {
${scalars.map(([k, v]) => `  ${k}: ${q(v)},`).join('\n')}

  articleHtml: ${tpl(unit.articleHtml)},
${dutch.hasSidebar ? `\n  sidebarHtml: ${tpl(unit.sidebarHtml)},\n` : ''}
  faq: [
${faq}
  ],
};

export default translation;
`;
}

function writeRegistry() {
  const files = fs
    .readdirSync(OUT_DIR)
    .filter(f => /\.(en|ar)\.ts$/.test(f))
    .map(f => f.replace(/\.ts$/, ''))
    .sort();

  const bySlug = new Map();
  for (const name of files) {
    const [slug, locale] = [name.slice(0, name.lastIndexOf('.')), name.slice(name.lastIndexOf('.') + 1)];
    if (!bySlug.has(slug)) bySlug.set(slug, {});
    bySlug.get(slug)[locale] = `${slug.replace(/[-.](\w)/g, (_, c) => c.toUpperCase())}${locale === 'en' ? 'En' : 'Ar'}`;
  }

  const imports = files
    .map(name => {
      const slug = name.slice(0, name.lastIndexOf('.'));
      const locale = name.slice(name.lastIndexOf('.') + 1);
      const ident = bySlug.get(slug)[locale];
      return `import ${ident} from './${name}';`;
    })
    .join('\n');

  const record = [...bySlug.entries()]
    .map(([slug, locales]) => {
      const parts = ['en', 'ar'].filter(l => locales[l]).map(l => `${l}: ${locales[l]}`);
      return `  '${slug}': { ${parts.join(', ')} },`;
    })
    .join('\n');

  const block =
    `/* GENERATED:BEGIN */\n${imports}\n\n` +
    `/** Keyed by guide slug. A slug with no entry simply has no translations yet. */\n` +
    `export const TRANSLATIONS: Record<string, Partial<Record<'en' | 'ar', GuideLocale>>> = {\n` +
    `${record}\n};\n/* GENERATED:END */`;

  const p = path.join(OUT_DIR, 'index.ts');
  const src = fs.readFileSync(p, 'utf8');
  fs.writeFileSync(
    p,
    src.replace(/\/\* GENERATED:BEGIN \*\/[\s\S]*?\/\* GENERATED:END \*\//, block),
  );
  return files.length;
}

/* ── the client ──────────────────────────────────────────────────────────── */

function createClient({ apiKey, gatewayKey }) {
  const viaGateway = Boolean(gatewayKey);
  const client = viaGateway
    ? new Anthropic({ apiKey: gatewayKey, baseURL: GATEWAY_URL })
    : new Anthropic({ apiKey });
  const model = viaGateway ? `anthropic/${MODEL}` : MODEL;
  console.log(`Translating with ${model}${viaGateway ? ' via the Vercel AI Gateway' : ''}.\n`);

  const usage = { calls: 0, inTokens: 0, outTokens: 0 };

  async function ask(prompt) {
    const stream = client.messages.stream({
      model,
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });
    const message = await stream.finalMessage();
    usage.calls++;
    usage.inTokens += message.usage?.input_tokens ?? 0;
    usage.outTokens += message.usage?.output_tokens ?? 0;
    if (message.stop_reason === 'refusal') {
      throw new Error(`model declined: ${message.stop_details?.explanation ?? 'no explanation'}`);
    }
    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (!text.trim()) throw new Error('empty response');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`response was not JSON: ${text.slice(0, 200)}`);
    }
    return unescape(parsed);
  }

  return { ask, usage };
}

/** The double-escape repair from `scripts/b1-content/author.mjs`. Same bug, same fix. */
function unescape(value) {
  if (typeof value === 'string') {
    return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  if (Array.isArray(value)) return value.map(unescape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unescape(v)]));
  }
  return value;
}

/* ── main ────────────────────────────────────────────────────────────────── */

function readDutch(slug) {
  const file = path.join(GUIDE_DIR, `${slug}.ts`);
  const source = fs.readFileSync(file, 'utf8');
  const article = templateField(source, 'articleHtml');
  const sidebar = templateField(source, 'sidebarHtml');
  if (!article) throw new Error(`${slug}: no articleHtml found`);

  const seq = localisedSeq(expressionSeq(article));
  /* A URL reached through a `SRC_*` constant is not in the body's own text, so requiring it there
     would fail every guide. The constants are passed through by name and checked by the sequence. */
  const viaConst = new Set(urls(source).filter(u => !article.includes(u)));

  return {
    file,
    source,
    ids: headingIds(article),
    seq,
    urls: urls(article),
    viaConst,
    tags: tagCounts(article),
    length: article.length,
    faqCount: (source.match(/^\s+q: /gm) ?? []).length,
    hasSidebar: Boolean(sidebar?.trim()),
    hasHeroAlt: /heroImage:\s*\{/.test(source),
    hash: crypto.createHash('sha256').update(source).digest('hex').slice(0, 16),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter(a => a.startsWith('--')));
  const positional = argv.filter(a => !a.startsWith('--'));
  const localeArg = argv.includes('--locale') ? argv[argv.indexOf('--locale') + 1] : null;
  const locales = localeArg ? [localeArg] : ['en', 'ar'];
  const target = positional[0] ?? 'plan';

  const slugs = target === 'all' || target === 'plan' ? guideFiles() : [target];
  for (const slug of slugs) {
    if (!fs.existsSync(path.join(GUIDE_DIR, `${slug}.ts`))) {
      console.error(`No guide called "${slug}".`);
      process.exit(1);
    }
  }

  const units = [];
  for (const slug of slugs) {
    const dutch = readDutch(slug);
    for (const locale of locales) {
      const out = path.join(OUT_DIR, `${slug}.${locale}.ts`);
      units.push({ slug, locale, dutch, out, exists: fs.existsSync(out) });
    }
  }

  if (target === 'plan') {
    console.log(`${guideFiles().length} translatable guides · ${units.length} units\n`);
    for (const u of units) {
      console.log(
        `  ${u.exists ? '✓' : ' '} ${u.slug}.${u.locale}  ` +
        `${u.dutch.ids.length} sections · ${u.dutch.seq.length} blocks · ` +
        `${u.dutch.length} chars · ${u.dutch.faqCount} faq`,
      );
    }
    const todo = units.filter(u => !u.exists).length;
    console.log(`\n${todo} to write, ${units.length - todo} on disk.`);
    console.log(`Skipped (translations still inline): ${[...INLINE].join(', ')}`);
    return;
  }

  const kitExports = exportedNames(path.join(GUIDE_DIR, 'kit.ts'));
  const typeExports = exportedNames(path.join(GUIDE_DIR, 'types.ts'));
  for (const n of typeExports) kitExports.add(n) && 0;

  if (flags.has('--check')) {
    let bad = 0;
    for (const u of units) {
      if (!u.exists) continue;
      const src = fs.readFileSync(u.out, 'utf8');
      const body = templateField(src, 'articleHtml') ?? '';
      const ids = headingIds(body);
      const seq = expressionSeq(body);
      const problems = [];
      if (!seqEq(ids, u.dutch.ids)) problems.push('heading ids differ from the Dutch');
      if (!seqEq(seq, u.dutch.seq)) problems.push('interpolation sequence differs from the Dutch');
      if (problems.length) {
        bad++;
        console.log(`  ✗ ${u.slug}.${u.locale}: ${problems.join(' · ')}`);
      } else {
        console.log(`  ✓ ${u.slug}.${u.locale}`);
      }
    }
    console.log(bad ? `\n${bad} unit(s) drifted from the Dutch.` : '\nEvery translation matches its source.');
    if (bad) process.exit(1);
    return;
  }

  const env = loadEnv();
  const gatewayKey = flags.has('--direct') ? null : (env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_API_KEY);
  const apiKey = env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!gatewayKey && !apiKey) {
    console.error('Neither AI_GATEWAY_API_KEY nor ANTHROPIC_API_KEY is set.');
    process.exit(1);
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const { ask, usage } = createClient({ apiKey, gatewayKey });

  const todo = units.filter(u => flags.has('--force') || flags.has('--retranslate') || !u.exists);
  console.log(`${todo.length} unit(s) to translate.\n`);

  for (const [i, u] of todo.entries()) {
    const label = `[${i + 1}/${todo.length}] ${u.slug}.${u.locale}`;
    const cachePath = path.join(CACHE_DIR, `${u.slug}.${u.locale}.${u.dutch.hash}.json`);
    const guideExports = exportedNames(u.dutch.file);

    let unit = null;
    /* `--force` re-writes the file from the cached unit; `--retranslate` pays for a new call.
       They are separate because most re-runs are a change to how the file is *rendered* — the
       import derivation, the header — and re-paying for 38 translations to fix a comment is waste. */
    if (fs.existsSync(cachePath) && !flags.has('--retranslate')) {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (validate(cached, u.dutch, u.locale).length === 0) {
        unit = cached;
        console.log(`${label} — from cache`);
      }
    }

    if (!unit) {
      const prompt = unitPrompt({ slug: u.slug, source: u.dutch.source, locale: u.locale, dutch: u.dutch });
      let extra = '';
      for (let attempt = 1; attempt <= 3 && !unit; attempt++) {
        process.stdout.write(`${label} — attempt ${attempt}… `);
        const result = await ask(prompt + extra);
        const problems = validate(result, u.dutch, u.locale);
        if (problems.length === 0) {
          unit = result;
          console.log('ok');
          break;
        }
        console.log(`rejected: ${problems.slice(0, 2).join(' · ')}`);
        extra =
          `\n\n---\nYour previous attempt was rejected because it broke these rules. Fix exactly ` +
          `these points and keep everything else identical:\n` +
          problems.map(p => `- ${p}`).join('\n');
      }
      if (!unit) throw new Error(`${u.slug}.${u.locale}: still invalid after 3 attempts`);
      fs.writeFileSync(cachePath, `${JSON.stringify(unit, null, 2)}\n`);
    }

    fs.writeFileSync(
      u.out,
      renderFile({ slug: u.slug, locale: u.locale, unit, dutch: u.dutch, kitExports, guideExports }),
    );
  }

  const n = writeRegistry();
  const usd = (usage.inTokens / 1e6) * 5 + (usage.outTokens / 1e6) * 25;
  console.log(
    `\n${n} translation file(s) registered. ` +
    `${usage.calls} call(s), ${usage.inTokens} in / ${usage.outTokens} out ≈ $${usd.toFixed(2)}.`,
  );
  console.log('Now run: npx tsc --noEmit && npm run test:unit');
}

main().catch(err => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
