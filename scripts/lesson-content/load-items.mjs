/**
 * Laad `lib/lessons/items.ts` in een `.mjs`-script.
 *
 * ── WAAROM DIT BESTAAT ───────────────────────────────────────────────────────
 * De generator en de seeder moeten valideren tegen **dezelfde** regels die `/admin` gebruikt
 * bij het opslaan door de docent. De alternatieven waren allebei slechter:
 *
 *   * De regels in `.mjs` herschrijven, zoals `scripts/b1-content/rules.mjs` doet voor de
 *     examenvorm. Dat werkt daar omdat het om een handvol getallen gaat. Hier zijn het
 *     veertien payloadvormen met hun onderlinge regels, en twee kopieën daarvan lopen
 *     gegarandeerd uit elkaar — met als gevolg content die de generator goedkeurt en de editor
 *     afkeurt, of erger: omgekeerd.
 *   * `tsx` of `ts-node` als dependency toevoegen. Een build-tool erbij voor twee scripts,
 *     terwijl `typescript` al in `node_modules` staat.
 *
 * `items.ts` importeert alleen `zod`, dus één bestand transpileren is genoeg — geen
 * modulegraaf, geen alias-resolutie. Zodra dat bestand iets anders importeert, faalt deze
 * loader luid (de import kan niet worden opgelost) in plaats van stil de helft te doen.
 *
 * Het resultaat komt in een gitignored map BINNEN het project, zodat Node `zod` gewoon vanuit
 * `node_modules` oplost. Buiten de projectboom zou de import van `zod` mislukken.
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ROOT } from '../a2-content/lib.mjs';

const SOURCE = path.join(ROOT, 'lib', 'lessons', 'items.ts');
const OUT_DIR = path.join(ROOT, 'scripts', 'lesson-content', '.generated');
const OUT = path.join(OUT_DIR, 'items.mjs');

/**
 * Transpileer en importeer. Elke aanroep hercompileert als de bron nieuwer is dan het
 * resultaat — anders valideert een run tegen de regels van gisteren, wat precies de drift is
 * die dit bestand moet voorkomen.
 */
export async function loadItemRules() {
  const src = fs.readFileSync(SOURCE, 'utf8');

  const imports = [...src.matchAll(/^\s*import\s.*?from\s+'([^']+)';/gm)].map(m => m[1]);
  const unexpected = imports.filter(i => i !== 'zod');
  if (unexpected.length) {
    throw new Error(
      `lib/lessons/items.ts importeert nu ook ${unexpected.join(', ')}. Deze loader ` +
      'transpileert één bestand en kan dat niet oplossen. Houd items.ts afhankelijk van ' +
      'alleen zod, of geef deze loader een echte modulegraaf.',
    );
  }

  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      // `satisfies` en `as const` moeten overleven; de rest van de types wordt gestript.
      verbatimModuleSyntax: false,
    },
    fileName: 'items.ts',
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const header =
    '// GEGENEREERD uit lib/lessons/items.ts door load-items.mjs. Niet bewerken, niet committen.\n';
  fs.writeFileSync(OUT, header + outputText);

  // Cache-buster: zonder query hergebruikt Node de eerste versie binnen één proces, en dan
  // valideert een watch-run tegen de vorige regels.
  return import(`${OUT}?v=${fs.statSync(SOURCE).mtimeMs}`);
}
