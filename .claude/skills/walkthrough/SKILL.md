---
name: walkthrough
description: Record a narrated video walkthrough of a flow and open it in QuickTime. Use at the end of a multi-step build the owner has not watched — a new page, a rebuilt screen, a funnel change, a feature spanning several files. Also use when the user asks for a video, a demo, a walkthrough, a screen recording, or "show me what you built".
---

# Walkthrough video

Turn something you just built into a two-minute video that walks the owner through it, in the order
a user meets it. Chapters, action highlights, converted to MP4, opened in QuickTime Player.

**Read `scripts/walkthrough/flows/README.md` before writing a flow.** It has the shape and the
conventions; this file is when and how to run it.

## When to do this

**Ask at the start, record at the end.** The recording costs about a minute and then takes over the
screen by launching QuickTime, so it is opt-in: when a task looks like it will end in a video, put
the question in the *first* message — one line, alongside the plan — and honour the answer. No
answer means no recording. Asking afterwards, or recording unasked, is the failure mode.

The work that earns the question is work that **changed something a person looks at** and took more
than one step: a new route, a rebuilt screen, a changed funnel, a feature across several files.

**Do not record** for: a one-line copy fix, a refactor with no visual result, a schema migration, a
doc change, or anything where you would be filming a page you did not touch. A video of nothing is
worse than no video, because it costs 90 seconds of somebody's attention to find that out.

If the change is visual but tiny, `check-ui.mjs` screenshots are the right tool and are already
required by CLAUDE.md §10. This is for **flows**, where the point is the order of the steps.

## How

1. **The dev server must be running on 3001** with the change in it, and for a portal or admin flow
   the local Supabase stack must be up. The recorder preflights the server and tells you what to
   start, but it cannot start it for you — never launch a second dev server.
2. **Write or update a flow** in `scripts/walkthrough/flows/<name>.mjs`. One flow per surface, named
   after the surface (`portaal-overzicht`, `gratis-oefenen`), not after the task or the date. If a
   flow for this surface exists, **extend it** rather than adding a near-duplicate.
3. **Record:**
   ```bash
   node scripts/walkthrough/record.mjs <name>              # records, converts, opens QuickTime
   node scripts/walkthrough/record.mjs <name> --no-open     # while iterating on the flow
   ```
4. **Watch it before handing it over** — you are responsible for what it shows. You cannot play
   video, so sample frames:
   ```bash
   ffmpeg -y -loglevel error -i <file>.mp4 -ss 12 -frames:v 1 /tmp/f.png   # then read the PNG
   ffmpeg -y -loglevel error -sseof -1 -i <file>.mp4 -frames:v 1 /tmp/end.png   # the last frame
   ```
   **`-ss` must come *after* `-i` here.** Before `-i` it seeks by keyframe, and a screen recording
   is variable-frame-rate with sparse keyframes — you get a stale frame from seconds earlier and
   conclude a step did nothing. That exact mistake made a working navigation look broken while the
   final frame proved it had happened.
   Check one frame per chapter: is the card over the right page, did the click land on the element
   the chapter names, is the page in its real state rather than empty or logged out?
5. **Report the chapter list** the script prints, with timestamps, in your summary. That is the
   written walkthrough; the video is the moving one.

## What makes a good flow

- **Chapters say why, not which selector.** "ONA is aangekondigd, niet gebouwd — gestippeld, geen
  link en geen prijs" is a walkthrough. "Click the fourth card" is a test read aloud.
- **Show the states, not just the happy path.** The states are usually the work: owned versus not in
  the package, published versus unpublished, the empty state. A flow that only shows a full account
  hides most of what was built.
- **A real session, never a fake one.** `auth` in the flow mints one against the local stack. Give
  the demo user the `modules` metadata the flow needs, or every card says "niet in je pakket".
- **Content-based selectors.** `getByRole('link', { name: /Vier taalonderdelen/ })`, not `.mod-card`
  — a class the design system may rename, on the very commit whose result you wanted to see.
- **Leave beats.** Playwright acts faster than anyone can read. `kit.reveal()` and `kit.beat()`.

## Traps

- **Playwright records WebM/VP8 and QuickTime cannot open it.** The ffmpeg pass to H.264 is part of
  the script and is not optional. Do not "simplify" it away.
- **A flow is not a test.** Never assert in one. A failing step records the failure, shows a card
  saying which step broke, and exits non-zero — that is the useful half of an assertion. Proof
  belongs in `tests/`.
- **Recordings are gitignored** (`temporary_walkthroughs/`) and are local review artefacts. Flows
  are code and **are** committed: they document the flow and are re-runnable next time it changes.
- **`--no-open` in any non-interactive run.** Opening QuickTime from a background session puts a
  window in front of whatever the owner is doing.
