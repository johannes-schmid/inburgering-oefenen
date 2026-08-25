/**
 * Regenerate `data/leren/` from the KNM production export.
 *
 * `data/leren` is the *static fallback* the lesson page renders before it overlays audio
 * from `leren_content`. It is generated rather than hand-copied because production is the
 * source of truth for the body HTML (owner's instruction, 2026-08-24), and a hand-copied
 * snapshot silently rots the moment the docent edits a section in /admin.
 *
 * The per-thema metadata (slug, title, description) has no home in `leren_content` — it
 * belongs to the thema, not to a section — so it lives in `generated/themes.json`, lifted
 * once from knm-website's own thema files.
 *
 *   node scripts/knm-content/export-from-knm.mjs   # refresh the export first
 *   node scripts/knm-content/generate-leren-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const GEN = resolve(HERE, 'generated');
const DATA = resolve(HERE, '../../data/leren');

const themes = JSON.parse(readFileSync(resolve(GEN, 'themes.json'), 'utf8'));
const rows = JSON.parse(readFileSync(resolve(GEN, 'leren_content.json'), 'utf8'));

/** A backtick template literal is the only readable way to hold a page of HTML. */
const tpl = (s) => '`' + String(s ?? '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
const str = (s) => JSON.stringify(String(s ?? ''));

const HEADER = `/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * \`leren_content\` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
`;

let total = 0;
for (const t of themes) {
  const sections = rows
    .filter(r => r.theme_id === t.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  total += sections.length;

  const body = sections.map(s => `    {
      id: ${str(s.anchor)},
      icon: ${str(s.icon)},
      title: ${str(s.heading)},
      subtitle: ${str(s.subtitle)},
      contentHtml: ${tpl(s.body_html)},
    },`).join('\n');

  writeFileSync(resolve(DATA, `thema-${t.id}.ts`), `${HEADER}import type { LerenThema } from './types';

export const thema: LerenThema = {
  id: ${t.id},
  slug: ${str(t.slug)},
  title: ${str(t.title)},
  description: ${str(t.description)},
  quizCategory: ${str(t.quizCategory)},
  sections: [
${body}
  ],
};
`);
}

const imports = themes.map(t => `import { thema as thema${t.id} } from './thema-${t.id}';`).join('\n');
const exports_ = themes.map(t => `export { thema as thema${t.id} } from './thema-${t.id}';`).join('\n');

writeFileSync(resolve(DATA, 'index.ts'), `${HEADER}export type { LerenThema, LerenSection, QuizQuestion } from './types';
${exports_}

${imports}
import type { LerenThema } from './types';

/**
 * The seven official KNM thema's. These are KNM's lesson modules, not the taalonderdelen's —
 * Lezen and Luisteren teach through their oefenexamens and have no \`leren\` surface.
 */
export const THEMAS: LerenThema[] = [${themes.map(t => `thema${t.id}`).join(', ')}];

export function getThema(slug: string): LerenThema | undefined {
  return THEMAS.find(t => t.slug === slug);
}

/** The quiz behind a thema keys on the KNM question bank's \`category\` string. */
export function getThemaByQuizCategory(category: string): LerenThema | undefined {
  return THEMAS.find(t => t.quizCategory === category);
}
`);

console.log(`${themes.length} thema's, ${total} secties → data/leren/`);
