import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * De HTML van het widget, als één string: de gebundelde component uit `widgets/dist/exercise.js`,
 * inline in een minimale pagina. Gelezen bij de eerste aanvraag en daarna gecachet; ontbreekt de
 * bundel (nog niet gebouwd), dan een kale fallback die zegt wat er aan de hand is — de tools
 * blijven werken, het model krijgt dezelfde `structuredContent`.
 */
let cached: string | null = null;

export function widgetHtml(): string {
  if (cached) return cached;
  const bundle = join(process.cwd(), 'widgets', 'dist', 'exercise.js');
  const script = existsSync(bundle)
    ? readFileSync(bundle, 'utf8')
    : `document.getElementById('root').textContent = 'Widget nog niet gebouwd (npm run build:widget).';`;
  cached = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Oefenvraag</title></head><body><div id="root"></div><script type="module">${script}</script></body></html>`;
  return cached;
}
