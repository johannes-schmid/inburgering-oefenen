/**
 * Exam pictures: Pexels → WebP → our own `question-images` bucket.
 *
 * ## Why this exists rather than calling /api/admin/upload-image
 * That route does exactly the right thing and is the model for the `sharp` pipeline below, but it
 * is guarded by `requireAdmin()` and a script has no admin session. So the pipeline runs in-process
 * against the same bucket with the service key.
 *
 * ## Why the pictures are rehosted at all
 * An exam item whose picture is a third-party CDN URL breaks silently months later with nobody
 * having touched it: the CDN rotates a path, the photo comes down, and a Spreken "kies één plaatje"
 * renders two boxes and a hole. Every photo is copied into our bucket, so what was reviewed is what
 * the candidate sees.
 *
 * ## Why there is a lock file, and why it does not hold a URL of ours
 * `images.lock.json` maps a stable **slot key** (not a search term) to the *Pexels pick* — the
 * photo id, its source URL and the attribution. It deliberately does **not** hold the uploaded
 * URL, because the local stack and the hosted project are different buckets on different hosts: a
 * lock recording `127.0.0.1:54421/...` would make a production run write items pointing at a dead
 * host, and every picture in the exam would be a broken box. So the lock fixes *which photo*, and
 * each project keeps its own copy at a path derived from the slot.
 *
 * That gives all three properties at once:
 *   1. A re-run does not re-download and re-upload several hundred photos (a HEAD tells us the
 *      object is already there).
 *   2. A re-run does not silently swap the picture under an item the docent has already checked —
 *      Pexels' result order is not stable over time, so keying on the query alone would do exactly
 *      that.
 *   3. Local and production show the same picture.
 *
 * It is committed. Deleting an entry is how you deliberately re-pick one picture; you then also
 * have to delete the stored object, or the HEAD will find the old one.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, IMAGE_BUCKET } from './lib.mjs';

/**
 * The level parameterises three things and nothing else: which lock file is read, which prefix
 * the stored objects get, and which heading the credits are appended under. B1 reuses the whole
 * pipeline — `scripts/b1-content/` has its own `images.lock.json` and its pictures live under
 * `b1/`, so the two levels can never collide on a slot key or clobber each other's objects.
 *
 * Defaults are A2's, so every existing call site behaves byte-for-byte as before.
 */
function lockPathFor(level) {
  return path.join(ROOT, 'scripts', `${level}-content`, 'images.lock.json');
}
const CREDITS_PATH = path.join(ROOT, 'resources', 'images', 'CREDITS.md');

/**
 * 1200px / quality 72, deliberately tighter than the admin route's 1600/82.
 *
 * A `cover_all` task shows three of these side by side and a candidate may be on mobile data during
 * a timed exam. 1200px is still more than the grid can use, and it lands a typical photo around
 * 60–110 KB instead of ~400 KB. Aspect ratio is never forced — `choose` items depend on the two
 * pictures being comparable, and a crop can remove the very detail being asked about.
 */
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 72;

/** Below this the Pexels original is too small to survive the resize with any detail. */
const MIN_SOURCE_WIDTH = 1000;

export function readLock(level = 'a2') {
  const p = lockPathFor(level);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeLock(lock, level = 'a2') {
  const sorted = Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(lockPathFor(level), `${JSON.stringify(sorted, null, 2)}\n`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Search Pexels, backing off on a 429.
 *
 * The free tier allows 200 requests an hour, and a full run asks for around 370 pictures — so a
 * throttle is the expected case, not an error. Failing the run there would be needlessly
 * destructive: the lock file is written after every pick, so waiting and continuing costs nothing
 * and a killed run has to be restarted anyway. Five attempts with a growing wait covers the tail
 * of an hour window; beyond that it gives up and says so, and re-running resumes where it stopped.
 */
async function pexelsSearch(query, apiKey) {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
    `&per_page=15&orientation=landscape`;

  const waits = [60, 300, 600, 900, 900];
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (res.ok) return (await res.json()).photos ?? [];
    if (res.status !== 429 || attempt >= waits.length) {
      throw new Error(`Pexels ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const wait = waits[attempt];
    console.log(`    ! Pexels throttled; wachten ${wait}s en opnieuw proberen (${query})`);
    await sleep(wait * 1000);
  }
}

/**
 * Pick deterministically: the first result wide enough, offset by `variant`.
 *
 * `variant` lets two slots share a query without sharing a photo — a `cover_all` sequence often
 * wants three different "ontbijt" shots. Without it the same URL would be locked three times and
 * the candidate would see one picture repeated.
 */
function pick(photos, variant) {
  const usable = photos.filter(p => (p.width ?? 0) >= MIN_SOURCE_WIDTH);
  const pool = usable.length > 0 ? usable : photos;
  if (pool.length === 0) return null;
  return pool[variant % pool.length];
}

export function createImages({ storage, apiKey, dryRun = false, level = 'a2' }) {
  const lock = readLock(level);
  const credits = [];
  let fetched = 0;
  let reused = 0;

  /**
   * Resolve one picture slot to a URL on our own storage.
   *
   * `slot`    stable key, authored beside the item — e.g. `spreken-3-p2-t1-a`.
   * `query`   Pexels search terms.
   * `variant` which of the matching photos to take, so sibling slots differ.
   */
  async function resolve(slot, query, variant = 0) {
    // Path is derived from the slot, so local and production agree and a re-run is a HEAD, not a
    // download. Each slot owns its path and is referenced by exactly one item, so there is nothing
    // for a re-upload to clobber.
    const objectPath = `${level}/${slot}.webp`;

    const already = await storage.existing(IMAGE_BUCKET, objectPath);
    if (already && lock[slot]) {
      reused++;
      return already;
    }
    if (dryRun) return null;

    let entry = lock[slot];
    if (!entry) {
      if (!apiKey) throw new Error(`PEXELS_API_KEY missing — cannot pick image slot "${slot}"`);
      const photos = await pexelsSearch(query, apiKey);
      const photo = pick(photos, variant);
      if (!photo) throw new Error(`Pexels returned nothing for "${query}" (slot ${slot})`);
      entry = {
        query,
        pexels_id: photo.id,
        src: photo.src?.large2x || photo.src?.large || photo.src?.original,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
      };
      lock[slot] = entry;
      credits.push({ slot, ...entry });
      writeLock(lock, level);
    }

    const srcRes = await fetch(entry.src);
    if (!srcRes.ok) throw new Error(`fetch photo ${srcRes.status} for slot ${slot}`);

    const webp = await sharp(Buffer.from(await srcRes.arrayBuffer()))
      .rotate() // honour EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const url = await storage.upload(IMAGE_BUCKET, objectPath, webp, 'image/webp');
    fetched++;
    return url;
  }

  /**
   * Alt text for a slot.
   *
   * Deliberately the authored caption, never Pexels' own `alt` — that is English, and an English
   * description read out by a screen reader in the middle of a Dutch A2 exam is worse than a plain
   * label. The caption is what the candidate is told the picture shows.
   */
  function altFor(_slot, fallback) {
    return fallback;
  }

  function stats() {
    return { fetched, reused, total: Object.keys(lock).length };
  }

  /** Append attribution for everything newly fetched. Pexels does not require it; we do it anyway. */
  function writeCredits() {
    if (credits.length === 0) return;
    const lines = credits.map(
      c =>
        `- \`${c.slot}\` (${c.query}) — photo by [${c.photographer}](${c.photographer_url}) ` +
        `on Pexels (#${c.pexels_id})`
    );
    const heading = `## ${level.toUpperCase()} exam images (Pexels)`;
    const header = `\n${heading}\n\n`;
    const existing = fs.existsSync(CREDITS_PATH) ? fs.readFileSync(CREDITS_PATH, 'utf8') : '# Image credits\n';
    const body = existing.includes(heading)
      ? `${existing.trimEnd()}\n${lines.join('\n')}\n`
      : `${existing.trimEnd()}\n${header}${lines.join('\n')}\n`;
    fs.writeFileSync(CREDITS_PATH, body);
  }

  return { resolve, altFor, stats, writeCredits };
}
