#!/usr/bin/env node
/**
 * Record a narrated video walkthrough of a flow, and open it in QuickTime.
 *
 * For the end of a multi-step build: instead of "I changed nine files, please click around", the
 * agent hands over a two-minute video that walks the owner through what was built, in the order a
 * user meets it.
 *
 *   node scripts/walkthrough/record.mjs <flow>            # record, convert, open QuickTime
 *   node scripts/walkthrough/record.mjs <flow> --no-open  # CI / headless review
 *   node scripts/walkthrough/record.mjs --list
 *
 * A flow is a module in `flows/`. See `flows/README.md` for the shape and the conventions.
 *
 * **It is built on Playwright's own overlay API, not on a homegrown caption layer.**
 * `page.screencast.showChapter()` draws a title card over a blurred backdrop and is documented as
 * being for exactly this; `showActions()` outlines and captions every element as it is interacted
 * with. Both are recorded into the video rather than composited afterwards, so there is no
 * subtitle track to drift out of sync and nothing to re-render when a step changes.
 *
 * **The ffmpeg pass is mandatory, not cosmetic.** Playwright writes WebM/VP8 and QuickTime cannot
 * open it — the window appears, then nothing plays. H.264 in MP4 with `+faststart` is what macOS
 * previews, scrubs and AirDrops. `h264_videotoolbox` is hardware and takes about a second;
 * `libx264` is the fallback on a machine without it.
 */
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const FLOWS = path.join(HERE, 'flows');
const OUT = path.join(ROOT, 'temporary_walkthroughs');
const BASE = process.env.WALKTHROUGH_BASE_URL || 'http://localhost:3001';

/** The recorded frame. 1280×800 is a laptop, which is what most candidates sit this exam at. */
const SIZE = { width: 1280, height: 800 };

const argv = process.argv.slice(2);
const flags = new Set(argv.filter(a => a.startsWith('--')));
const flowName = argv.find(a => !a.startsWith('--'));

const listFlows = () =>
  fs.existsSync(FLOWS)
    ? fs.readdirSync(FLOWS).filter(f => f.endsWith('.mjs')).map(f => f.replace(/\.mjs$/, ''))
    : [];

if (flags.has('--list') || !flowName) {
  console.log('Flows:\n' + listFlows().map(f => `  ${f}`).join('\n'));
  if (!flowName && !flags.has('--list')) console.log('\nUsage: node scripts/walkthrough/record.mjs <flow>');
  process.exit(flags.has('--list') ? 0 : 1);
}

/* ── Preflight ──────────────────────────────────────────────────────────────────────────────────
   Both checks exist because their failure is silent in the output rather than loud: a dead server
   records two minutes of an error page, and a missing browser binary throws a stack trace that
   reads like a bug in this script. */
async function preflight() {
  try {
    const res = await fetch(`${BASE}/nl`, { redirect: 'manual' });
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(
      `✗ No dev server at ${BASE} (${err.message}).\n` +
      `  Start it first — and leave it running:\n` +
      `    PATH="/opt/homebrew/bin:$PATH" npm run dev`,
    );
    process.exit(1);
  }
}

/**
 * The local Supabase keys, read from the CLI rather than from the environment.
 *
 * `tests/helpers/session.mjs` reads `SUPABASE_SERVICE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` at
 * import time, and requiring the caller to export them by hand is how a recording silently comes
 * out logged-out — every portal page renders its guest state and the video looks like a bug in the
 * product. Read once, injected before the helper is imported.
 */
function localSupabaseKeys() {
  const json = JSON.parse(execFileSync('supabase', ['status', '-o', 'json'], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }));
  return { service: json.SERVICE_ROLE_KEY, anon: json.ANON_KEY };
}

/** Mint a real session against the local stack and put it in the context, chunked as ssr does. */
async function signIn(context, auth) {
  const { service, anon } = localSupabaseKeys();
  process.env.SUPABASE_SERVICE_KEY = service;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anon;
  const session = await import(path.join(ROOT, 'tests/helpers/session.mjs'));
  const minted = await session.mintSession(auth.email, auth.metadata ?? {});
  await session.applySession(context, minted, BASE);
}

/* ── The kit a step is handed ───────────────────────────────────────────────────────────────────
   Deliberately small. A flow is code, so it has the whole Playwright API; these are the four
   things every flow wanted and would otherwise re-implement slightly differently. */
function makeKit(page) {
  return {
    /** Let the viewer read. A step with no beat reads as a glitch, not as a demonstration. */
    beat: (ms = 900) => page.waitForTimeout(ms),

    /** Go somewhere and wait for it to be still, not merely loaded. */
    async visit(pathname) {
      await page.goto(`${BASE}${pathname}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(400);
    },

    /**
     * Scroll something into the middle of the frame and hold.
     *
     * `scrollIntoViewIfNeeded()` puts an element flush against the top edge, which on a page with
     * a fixed header hides it behind the nav. Centre is what a person would do.
     */
    async reveal(selector, { hold = 1100 } = {}) {
      const el = page.locator(selector).first();
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await page.evaluate(sel => {
        document.querySelector(sel)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, selector).catch(() => {});
      await page.waitForTimeout(hold);
      return el;
    },

    /** Type like a person, so the field is legible while it fills. */
    fill: (selector, text) => page.locator(selector).first().pressSequentially(text, { delay: 55 }),
  };
}

/* ── Record ─────────────────────────────────────────────────────────────────────────────────────*/
async function main() {
  const flowPath = path.join(FLOWS, `${flowName}.mjs`);
  if (!fs.existsSync(flowPath)) {
    console.error(`✗ No flow "${flowName}". Available:\n` + listFlows().map(f => `  ${f}`).join('\n'));
    process.exit(1);
  }
  const flow = (await import(flowPath)).default;
  await preflight();

  fs.mkdirSync(OUT, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const webm = path.join(OUT, `${flowName}-${stamp}.webm`);
  const mp4 = path.join(OUT, `${flowName}-${stamp}.mp4`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: SIZE,
    locale: 'nl-NL',
    deviceScaleFactor: 1,
    ...(flow.context ?? {}),
  });
  if (flow.auth) await signIn(context, flow.auth);

  const page = await context.newPage();
  await page.screencast.start({ path: webm, size: SIZE });

  /* Every click gets an outline and a caption. 1200ms rather than the 500ms default: the default
     is tuned for a debugging trace you scrub through, not for a video somebody watches once. */
  await page.screencast.showActions({ duration: 1200, position: 'bottom-right', fontSize: 20 });

  const chapters = [];
  const t0 = Date.now();
  const kit = makeKit(page);

  /* The opening card sits on the page the flow is *about*, not on the homepage: the backdrop is
     blurred but still legible, and a portal walkthrough that opens over the marketing hero tells
     the viewer they are about to watch something else. */
  await page.goto(`${BASE}${flow.start ?? '/nl'}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screencast.showChapter(flow.title, {
    description: flow.description ?? 'Walkthrough',
    duration: 2600,
  });
  await page.waitForTimeout(2600);

  let failed = null;
  for (const [i, step] of flow.steps.entries()) {
    const at = Math.round((Date.now() - t0) / 1000);
    chapters.push({ at, title: step.chapter });
    console.log(`  ${String(i + 1).padStart(2)}. ${fmt(at)}  ${step.chapter}`);

    await page.screencast.showChapter(`${i + 1}. ${step.chapter}`, {
      description: step.description ?? '',
      duration: step.cardMs ?? 2200,
    });
    await page.waitForTimeout(step.cardMs ?? 2200);

    try {
      await step.run(page, kit);
    } catch (err) {
      /* Record the failure instead of throwing it away: a video that stops where the flow broke is
         the most useful bug report there is, and the exit code still fails the task. */
      failed = { step: step.chapter, err };
      await page.screencast.showChapter('Deze stap liep vast', {
        description: String(err.message).split('\n')[0].slice(0, 200),
        duration: 3000,
      });
      await page.waitForTimeout(3000);
      break;
    }
    await kit.beat(600);
  }

  await page.screencast.stop();
  await context.close();
  await browser.close();

  const seconds = Math.round((Date.now() - t0) / 1000);
  toMp4(webm, mp4);
  if (!flags.has('--keep-webm')) fs.rmSync(webm, { force: true });

  console.log(`\n${failed ? '⚠' : '✓'} ${path.relative(ROOT, mp4)}  ${fmt(seconds)}`);
  console.log('\nChapters:');
  for (const c of chapters) console.log(`  ${fmt(c.at)}  ${c.title}`);

  if (!flags.has('--no-open')) {
    spawn('open', ['-a', 'QuickTime Player', mp4], { detached: true, stdio: 'ignore' }).unref();
    console.log('\nOpening in QuickTime Player…');
  }

  if (failed) {
    console.error(`\n✗ Step "${failed.step}" failed: ${failed.err.message}`);
    process.exit(1);
  }
}

/** WebM/VP8 → H.264 MP4. QuickTime cannot open the former; see the header. */
function toMp4(from, to) {
  const encoders = ['h264_videotoolbox', 'libx264'];
  for (const enc of encoders) {
    try {
      execFileSync('ffmpeg', [
        '-y', '-loglevel', 'error', '-i', from,
        '-c:v', enc, // A screen recording is mostly static pixels; 2.5 Mbit keeps a two-minute video AirDrop-sized.
        ...(enc === 'libx264' ? ['-crf', '26', '-preset', 'veryfast'] : ['-b:v', '2500k']),
        // Chromium's WebM can carry an odd frame height; H.264 needs even dimensions.
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', to,
      ], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` } });
      return;
    } catch { /* try the next encoder */ }
  }
  throw new Error('ffmpeg could not produce an MP4 — is ffmpeg on PATH?');
}

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

main().catch(err => { console.error(err); process.exit(1); });
