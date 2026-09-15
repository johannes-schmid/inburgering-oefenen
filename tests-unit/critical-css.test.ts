/**
 * De kritieke CSS en `SectionTransition` moeten dezelfde hoogtes noemen.
 *
 * De hoogte van dat blok staat sinds 15-09 op twee plekken: als Tailwind-klasse op het element
 * (de bron van waarheid) en als kale CSS-regel in de `<head>`, zodat hij er al is vóór de 62 KB
 * grote `globals.css`. Lopen die twee uit elkaar, dan komt de CLS van 0,616 stil terug — op
 * élke pagina, en alleen zichtbaar onder throttling. Geen compiler en geen screenshot ziet dat.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const layout = readFileSync(join(root, 'app/[locale]/layout.tsx'), 'utf8');
const component = readFileSync(join(root, 'components/horizon/SectionTransition.tsx'), 'utf8');

describe('de kritieke CSS van SectionTransition', () => {
  it('draagt de klasse waar de kritieke regel op mikt', () => {
    expect(component).toMatch(/className={cn\('section-transition /);
  });

  it('noemt dezelfde mobiele hoogte als de Tailwind-klasse', () => {
    const tailwind = component.match(/h-\[(\d+)px\]/);
    const critical = layout.match(/\.section-transition\{height:(\d+)px\}/);
    expect(tailwind?.[1]).toBeDefined();
    expect(critical?.[1]).toBe(tailwind?.[1]);
  });

  it('noemt dezelfde hoogte vanaf de sm-breekpunt', () => {
    const tailwind = component.match(/sm:h-\[(\d+)px\]/);
    const critical = layout.match(/@media\(min-width:640px\)\{\.section-transition\{height:(\d+)px\}\}/);
    expect(tailwind?.[1]).toBeDefined();
    expect(critical?.[1]).toBe(tailwind?.[1]);
  });

  it('staat in de head, vóór de body', () => {
    expect(layout.indexOf('CRITICAL_CSS')).toBeLessThan(layout.indexOf('<body>'));
  });
});
