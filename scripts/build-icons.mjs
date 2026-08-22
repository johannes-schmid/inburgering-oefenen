/**
 * Renders every icon asset from ONE definition of the brand mark.
 *
 *   node scripts/build-icons.mjs
 *
 * Writes:
 *   public/favicon.svg          the vector, served first
 *   public/favicon-32x32.png    the PNG fallback
 *   public/icon-512.png         large / install icon
 *   public/apple-touch-icon.png 180×180, FULL SQUARE (see below)
 *   app/favicon.ico             16 + 32 + 48, PNG-encoded ICO
 *   public/images/logo-email.png 160×160, the DARK variant — the mail header is navy
 *
 * **The mark lives in `MARK` here and in `components/site/LogoMark.tsx`, and nowhere else.**
 * Those two are the only copies and they must be changed together — the reason this script exists
 * is that the mark previously existed in seven places (the component, the SVG, three PNGs, the ICO
 * and `BrandLoader`), so "update the logo" meant finding all seven and hand-editing rasters.
 *
 * Rasterising goes through the Puppeteer that `check-ui.mjs` already depends on: there is no
 * librsvg or ImageMagick on this machine, and adding a native image dependency to build five files
 * that change once a year is a worse trade than driving the browser that is already installed.
 *
 * **`apple-touch-icon.png` is deliberately a full square with no rounded corners.** iOS applies its
 * own mask and its own corner radius; a pre-rounded icon gets rounded twice and shows a ring of the
 * page behind it inside the squircle. Everything else keeps the 23/100 radius.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = process.cwd();

/**
 * The mark. Keep in step with `components/site/LogoMark.tsx`.
 *
 * `surface: 'dark'` inverts the tile for use *on* navy, exactly as the component does — it does not
 * go translucent, because an emailed PNG has no backdrop to be translucent against and a 12%-white
 * tile renders as a grey smudge in every client.
 */
const MARK = ({ radius = 23, surface = 'light' } = {}) => {
  const onNavy = surface === 'dark';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Inburgering Oefenen">
  <rect width="100" height="100" rx="${radius}" fill="${onNavy ? '#ffffff' : '#002b6d'}"/>
  <rect x="26" y="27" width="17" height="46" rx="8.5" fill="${onNavy ? '#002b6d' : '#ffffff'}"/>
  <circle cx="65" cy="50" r="17" fill="#fe762c"/>
</svg>`;
};

async function render(page, svg, size) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">
       <div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>
     </body></html>`,
    { waitUntil: 'load' },
  );
  return Buffer.from(await page.screenshot({ omitBackground: true, type: 'png' }));
}

/**
 * A PNG-encoded ICO: 6-byte header, one 16-byte directory entry per image, then the PNG bytes.
 * Every browser that matters has read PNG-in-ICO since IE11, and packing three BMPs by hand to
 * support older ones is work for a browser share that no longer exists.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const dir = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);   // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);                        // palette
    e.writeUInt8(0, 3);                        // reserved
    e.writeUInt16LE(1, 4);                     // colour planes
    e.writeUInt16LE(32, 6);                    // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...images.map(i => i.data)]);
}

const browser = await puppeteer.launch();
const page = await browser.newPage();

writeFileSync(join(ROOT, 'public/favicon.svg'), MARK() + '\n');
console.log('public/favicon.svg');

for (const [path, size] of [['public/favicon-32x32.png', 32], ['public/icon-512.png', 512]]) {
  writeFileSync(join(ROOT, path), await render(page, MARK(), size));
  console.log(path, `${size}×${size}`);
}

writeFileSync(join(ROOT, 'public/apple-touch-icon.png'), await render(page, MARK({ radius: 0 }), 180));
console.log('public/apple-touch-icon.png 180×180 (square — iOS masks it itself)');

const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) images.push({ size, data: await render(page, MARK(), size) });
writeFileSync(join(ROOT, 'app/favicon.ico'), ico(images));
console.log(`app/favicon.ico ${sizes.join(' + ')}`);

/* The mail header (`lib/email/layout.ts`) is navy, so this one is the inverted tile. Rendered at
   160 for a 34px slot: mail clients on a retina display scale it up, and there is no srcset in
   email. */
writeFileSync(join(ROOT, 'public/images/logo-email.png'), await render(page, MARK({ surface: 'dark' }), 160));
console.log('public/images/logo-email.png 160×160 (dark variant)');

await browser.close();
