/**
 * Bouwt de App Store-afbeeldingen uit de ruwe schermafbeeldingen in `raw/`.
 *
 *   node mobile/store/build-screenshots.mjs        (vanuit de repo-root; Playwright uit de root)
 *
 * Uitvoer: `screenshots/<nn>-<naam>.png`, 1320 × 2868 px — de maat die App Store Connect vraagt
 * voor het 6,9-inch-scherm. Kleinere schermen schaalt Apple daar zelf uit af.
 *
 * De ruwe beelden komen uit de simulator (iPhone 17 Pro, 1206 × 2622) tegen de lokale stack,
 * met `inburgeringoefenen://dev-open?path=…&clean=1`. Het overzicht komt van de 17 Pro Max
 * (`&scroll=141`): alleen daar passen A2, B1 en KNM samen op het scherm. De bijschriften staan hier en nergens
 * anders: korte zinnen, `je`, en alleen wat op het scherm eronder ook echt te zien is.
 */
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const fonts = path.join(here, '..', 'node_modules', '@expo-google-fonts', 'manrope');
const b64 = file => readFileSync(file).toString('base64');

const W = 1320;
const H = 2868;

/** `glow` is waar de blauwe gloed van het veld zit; alleen het eerste beeld draagt de zon. */
const SHOTS = [
  { raw: 'overzicht', title: 'Oefen voor je inburgering.', muted: 'A2, B1 en KNM op één plek.', glow: '88% 4%', sun: true },
  { raw: 'speler', title: 'Oefenexamens zoals het examen.', muted: 'Dezelfde opbouw, met een klok.', glow: '8% 10%' },
  { raw: 'woorden', title: 'Leer de woorden die je nodig hebt.', muted: 'Met beeld en geluid.', glow: '92% 14%' },
  { raw: 'leren', title: 'Lessen van 8 tot 12 minuten.', muted: 'Eerst uitleg, dan meteen oefenen.', glow: '10% 2%' },
  { raw: 'spreken', title: 'Oefen spreken met je microfoon.', muted: 'Je krijgt feedback op je antwoord.', glow: '90% 8%' },
  { raw: 'knm', title: 'Ook voor KNM.', muted: 'Oefenexamens, lessen en woordkaarten.', glow: '6% 12%' },
  { raw: 'intro', title: 'Nagekeken door een NT2-docent.', muted: 'AI helpt, zij beslist.', glow: '86% 6%' },
];

const PHONE_W = 1010;
const PHONE_H = Math.round((PHONE_W * 2622) / 1206);
const BEZEL = 20;
const TOP = 690;

function page(shot) {
  const img = b64(path.join(here, 'raw', `${shot.raw}.png`));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Manrope; font-weight: 800; src: url(data:font/ttf;base64,${b64(path.join(fonts, '800ExtraBold', 'Manrope_800ExtraBold.ttf'))}); }
    @font-face { font-family: Manrope; font-weight: 500; src: url(data:font/ttf;base64,${b64(path.join(fonts, '500Medium', 'Manrope_500Medium.ttf'))}); }
    * { margin: 0; box-sizing: border-box; }
    body { width: ${W}px; height: ${H}px; overflow: hidden; position: relative; font-family: Manrope, sans-serif;
      background:
        radial-gradient(60% 34% at ${shot.glow}, #b9cbf3 0, rgba(185, 203, 243, 0) 70%),
        radial-gradient(70% 30% at 50% 108%, #c9d6f2 0, rgba(201, 214, 242, 0) 70%),
        #eaf0fa; }
    .copy { position: absolute; left: 96px; right: 96px; top: 150px; }
    h1 { font-weight: 800; font-size: 112px; line-height: 1.06; letter-spacing: -0.045em; color: #002b6d; text-wrap: balance; }
    p { margin-top: 26px; font-weight: 500; font-size: 60px; line-height: 1.2; letter-spacing: -0.025em; color: #44546f; text-wrap: balance; }
    .sun { position: absolute; width: 480px; height: 480px; border-radius: 50%; background: #fe762c;
      right: -110px; top: ${TOP - 150}px; }
    .phone { position: absolute; left: ${(W - PHONE_W - 2 * BEZEL) / 2}px; top: ${TOP}px;
      width: ${PHONE_W + 2 * BEZEL}px; height: ${PHONE_H + 2 * BEZEL}px; padding: ${BEZEL}px;
      border-radius: ${132 + BEZEL}px; background: #0b1730;
      box-shadow: 0 60px 120px rgba(0, 43, 109, 0.22), 0 12px 32px rgba(0, 43, 109, 0.14), inset 0 0 0 3px #2a3a5c; }
    .phone img { display: block; width: ${PHONE_W}px; height: ${PHONE_H}px; border-radius: 132px; }
    /* Het eiland zelf: de schermafbeelding van de simulator neemt het niet altijd mee. */
    .island { position: absolute; left: 50%; top: ${BEZEL + Math.round(PHONE_W * 42 / 1206)}px;
      width: ${Math.round(PHONE_W * 378 / 1206)}px; height: ${Math.round(PHONE_W * 110 / 1206)}px;
      margin-left: -${Math.round(PHONE_W * 189 / 1206)}px; border-radius: 999px; background: #000; }
  </style></head><body>
    ${shot.sun ? '<div class="sun"></div>' : ''}
    <div class="copy"><h1>${shot.title}</h1><p>${shot.muted}</p></div>
    <div class="phone"><img src="data:image/png;base64,${img}" alt=""><div class="island"></div></div>
  </body></html>`;
}

mkdirSync(path.join(here, 'screenshots'), { recursive: true });
// De Chrome van het systeem: geen aparte browserdownload nodig.
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const [i, shot] of SHOTS.entries()) {
  const tab = await context.newPage();
  await tab.setContent(page(shot), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const out = path.join(here, 'screenshots', `${String(i + 1).padStart(2, '0')}-${shot.raw}.png`);
  await tab.screenshot({ path: out, type: 'png' });
  await tab.close();
  console.log(path.relative(process.cwd(), out));
}
await browser.close();
