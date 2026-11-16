/**
 * Bouwt de kop van de productpagina en het beeld voor de zoekresultaten (App Store, iOS 27).
 *
 *   node mobile/store/build-header.mjs        (vanuit de repo-root)
 *
 * Uitvoer in `header/`:
 *   - `kopfzeile-3840x1646.png`      21:9, de kop van de productpagina
 *   - `suchergebnisse-3840x2560.png` 3:2, het beeld in de zoekresultaten
 *
 * Maten uit Apple's "Creative assets specifications". Apple's sjabloon met het veilige gebied
 * is hier niet gebruikt: de tekst en de bovenkant van de telefoons staan daarom ruim binnen de
 * rand. Controleer het resultaat met de knop Voorbeeld in App Store Connect.
 *
 * Geen logo, geen prijs, geen URL — Apple's richtlijn voor deze beelden. Eén korte zin mag.
 */
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const fonts = path.join(here, '..', 'node_modules', '@expo-google-fonts', 'manrope');
const b64 = file => readFileSync(file).toString('base64');
const raw = name => `data:image/png;base64,${b64(path.join(here, 'raw', `${name}.png`))}`;

const TITLE = 'Oefen voor je inburgering.';
const MUTED = 'A2, B1 en KNM op één plek.';
const PHONES = ['overzicht', 'speler', 'woorden'];

/** Eén telefoon: het ruwe beeld in een rand, met het eiland erover getekend. */
function phone(name, { left, top, width }) {
  const bezel = Math.round(width * 0.02);
  const inner = width - 2 * bezel;
  const height = Math.round((inner * 2622) / 1206);
  const radius = Math.round(inner * 0.13);
  return `<div class="phone" style="left:${left}px;top:${top}px;width:${width}px;height:${height + 2 * bezel}px;padding:${bezel}px;border-radius:${radius + bezel}px">
    <img src="${raw(name)}" style="width:${inner}px;height:${height}px;border-radius:${radius}px" alt="">
    <div class="island" style="top:${bezel + Math.round((inner * 42) / 1206)}px;width:${Math.round((inner * 378) / 1206)}px;height:${Math.round((inner * 110) / 1206)}px;margin-left:-${Math.round((inner * 189) / 1206)}px"></div>
  </div>`;
}

const LAYOUTS = [
  {
    file: 'kopfzeile-3840x1646.png',
    width: 3840,
    height: 1646,
    copy: { left: 330, top: 470, width: 1250, title: 156, muted: 80 },
    sun: { size: 760, left: 3180, top: 70 },
    phones: [
      { left: 1700, top: 400, width: 580 },
      { left: 2350, top: 290, width: 580 },
      { left: 3000, top: 400, width: 580 },
    ],
  },
  {
    file: 'suchergebnisse-3840x2560.png',
    width: 3840,
    height: 2560,
    copy: { left: 330, top: 300, width: 3000, title: 196, muted: 98 },
    sun: { size: 1000, left: 2960, top: 620 },
    phones: [
      { left: 500, top: 1010, width: 860 },
      { left: 1490, top: 880, width: 860 },
      { left: 2480, top: 1010, width: 860 },
    ],
  },
];

function page(layout) {
  const { width, height, copy, sun } = layout;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Manrope; font-weight: 800; src: url(data:font/ttf;base64,${b64(path.join(fonts, '800ExtraBold', 'Manrope_800ExtraBold.ttf'))}); }
    @font-face { font-family: Manrope; font-weight: 500; src: url(data:font/ttf;base64,${b64(path.join(fonts, '500Medium', 'Manrope_500Medium.ttf'))}); }
    * { margin: 0; box-sizing: border-box; }
    body { width: ${width}px; height: ${height}px; overflow: hidden; position: relative; font-family: Manrope, sans-serif;
      background:
        radial-gradient(46% 70% at 88% 6%, #b9cbf3 0, rgba(185, 203, 243, 0) 70%),
        radial-gradient(40% 60% at 0% 100%, #c9d6f2 0, rgba(201, 214, 242, 0) 70%),
        #eaf0fa; }
    .copy { position: absolute; left: ${copy.left}px; top: ${copy.top}px; width: ${copy.width}px; }
    h1 { font-weight: 800; font-size: ${copy.title}px; line-height: 1.06; letter-spacing: -0.045em; color: #002b6d; text-wrap: balance; }
    p { margin-top: ${Math.round(copy.muted * 0.42)}px; font-weight: 500; font-size: ${copy.muted}px; line-height: 1.2; letter-spacing: -0.025em; color: #44546f; }
    .sun { position: absolute; width: ${sun.size}px; height: ${sun.size}px; left: ${sun.left}px; top: ${sun.top}px; border-radius: 50%; background: #fe762c; }
    .phone { position: absolute; background: #0b1730;
      box-shadow: 0 70px 140px rgba(0, 43, 109, 0.22), 0 14px 36px rgba(0, 43, 109, 0.14), inset 0 0 0 3px #2a3a5c; }
    .phone img { display: block; }
    .island { position: absolute; left: 50%; border-radius: 999px; background: #000; }
  </style></head><body>
    <div class="sun"></div>
    <div class="copy"><h1>${TITLE}</h1><p>${MUTED}</p></div>
    ${layout.phones.map((spot, i) => phone(PHONES[i], spot)).join('\n')}
  </body></html>`;
}

mkdirSync(path.join(here, 'header'), { recursive: true });
// De Chrome van het systeem: geen aparte browserdownload nodig.
const browser = await chromium.launch({ channel: 'chrome' });
for (const layout of LAYOUTS) {
  const context = await browser.newContext({ viewport: { width: layout.width, height: layout.height }, deviceScaleFactor: 1 });
  const tab = await context.newPage();
  await tab.setContent(page(layout), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const out = path.join(here, 'header', layout.file);
  await tab.screenshot({ path: out, type: 'png', omitBackground: false });
  await context.close();
  process.stdout.write(`${path.relative(process.cwd(), out)}\n`);
}
await browser.close();
