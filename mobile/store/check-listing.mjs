/**
 * Telt de velden in `listing.md` na tegen de limieten van App Store Connect.
 *
 *   node mobile/store/check-listing.mjs
 *
 * Een veld is de kop `### Naam (max N)` plus het eerste codeblok eronder.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'listing.md');
const text = readFileSync(file, 'utf8');
const field = /^### (.+?) \(max (\d+)[^)]*\)\n+```\n([\s\S]*?)\n```/gm;

let failed = false;
for (const [, name, max, body] of text.matchAll(field)) {
  const length = [...body].length;
  const ok = length <= Number(max);
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'OVER'} ${String(length).padStart(4)} / ${String(max).padEnd(4)} ${name}`);
}
process.exit(failed ? 1 : 0);
