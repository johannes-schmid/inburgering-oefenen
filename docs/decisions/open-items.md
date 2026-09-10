# Phases as they were planned, and the issues carried over from the fork

Kept for the still-open items inside them; the roadmap itself is docs/MILESTONES.html.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


## Outstanding work (see `~/.claude/plans/` for the full plan)

**The current roadmap is the milestone plan in `docs/MILESTONES.html` (M0–M6, 2026-08-19)** —
**M0 and M1 are done (2026-08-19).** M2 is underway: the pillar
(`data/guides/inburgering-stappenplan.ts`) published 2026-08-19, and the menu now implements
MILESTONES §3 with the first tool and free-practice placeholders (2026-08-20) — see "M2 — the
pillar is live" and "M2b — the menu implements §3". **The tijdlijn-maker is built (2026-08-20) — see "M2c" above, and
the hub became a three-fase route with per-section reading progress on 2026-08-22 — see "M2d".**
Next: the six spokes (start each
from `SEO/facts.md` §10), the EN top-3, and the inline diagnostic quiz inside the tijdlijn nodes.
The phases below are the original build-out, kept for their still-open items.

- ~~**Phase 2 — data model.**~~ **DONE** — `supabase/migrations/20260729000000_a2_baseline.sql`
  squashes the KNM chain and adds `exams`, reshaped `questions` (skill, exam_id, stimulus_*),
  `open_tasks`, `rubrics`, `open_submissions`, `grading_examples`, plus `sections` repurposed
  as the sub-skills. Verified against the local stack. **Still to do:** run it on a new hosted
  Supabase project and point `.env.local` at it — only local is set up.
- ~~**Phase 3 — exam engine.**~~ **DONE** — `components/exam/` holds `ExamShell` plus the
  renderers: `StimulusPane` (memoised on `stimulus.id` so the pane and its `<audio>` survive
  advancing within one stimulus), `McqQuestion` (3 or 4 options, `text | image | image_grid`),
  `WritingTask` (the four Schrijven shapes) and `SpeakingTask` (MediaRecorder, capped at
  `max_record_seconds`). `AudioPlayer` is DUO's ⟲10 / play / 10⟳ with a seek bar and
  **no play limit**. `lib/exam-content.ts` loads the exam; `duration_seconds` and
  `pass_threshold_pct` come off the exam row and the two module constants are gone.
  **Answers are held in state until submit** — going back and changing one is how the real
  exam works, and writing a row per click left superseded results skewing the mastery series.
  `startExamAttempt` opens the sitting before the first answer so every
  `user_question_results` / `open_submissions` row carries its `attempt_id`;
  `completeExamAttempt` closes it. Spreken recordings go to the private
  `speaking-submissions` bucket and the **path**, not a URL, is stored.
- ~~**Phase 4 — admin.**~~ **MOSTLY DONE — the question editor saves again.** `QuestionForm`
  writes `questions` + `question_options` (stimulus picker, 3–4 repeatable options, per-option
  image sets via `OptionImagePicker`). `/admin/exams` is the 40 slots with real counts;
  `/admin/exams/[id]` is the builder — stimulus CRUD, questions per stimulus, and a publish
  button gated on `exam_publish_issues()` (blocked on `error` rows only, never on warnings).
  `ExamsGrid` and `QuestionsTable`'s own edit drawer are **deleted**: that drawer was a second
  save path writing `category`/`option_a..c`, and one editor means one place to break.
  **Still open in this phase:** `admin/opgaven` for `open_tasks` (the builder lists them
  read-only), and two-voice stimulus audio (`/v1/text-to-dialogue` reading `stimuli.voice_cast`)
  plus a bulk generator — today an audio stimulus takes a pasted URL.

  Two option-table rules the editor depends on, worth knowing before touching it:
  `question_options_one_correct_idx` is `UNIQUE (question_id) WHERE is_correct`, so every row
  is written `is_correct: false` first and one is then flipped; and options are reconciled
  **by label**, never deleted and re-inserted, because a delete cascades
  `user_question_results.chosen_option_id` to NULL and erases what past candidates picked.
- **Phase 5 — rubric grading.** `/api/grade-open` via AI Gateway, `/api/transcribe` for
  Spreken, `/admin/beoordeling` with the docent's correction → few-shot → eval loop.
- **Phase 6 — seed** exam 1 of each skill. **Phase 7 —** rewrite the test suite.

### Known carried-over issues
- ~~`user_metadata.tier` vs `plan`~~ **FIXED** — `lib/entitlements.ts` (`planFromMetadata`,
  `canOpenExam`, `canSeeExplanations`) reads `plan` with a `tier` fallback and is the single
  source of truth. `proefexamen/page.tsx` uses it. Other `tier`-reading sites
  (`dashboard/fouten`, `leren/[slug]`) should move to it too.
- `submit-results` never writes `exam_number` despite `UNIQUE(email, exam_number)`.
- `exam_results` and `exam_submissions` coexist unreconciled; a migration dropped the former
  but its header says it never reached prod, and the dashboard still reads it.
- `ProefexamenEngine` ships **all** questions to the browser instead of filtering by exam.
- ~~Two different `PASS_THRESHOLD_PCT` values~~ **FIXED for the new engine** — it reads
  `exams.pass_threshold_pct`. The legacy `ProefexamenEngine` still uses the constant.
- **`ProefexamenEngine.tsx` + `/proefexamen` are now dead weight.** The A2 player is
  `components/exam/ExamShell.tsx`; the old engine survives only for the KNM-shaped flat-question
  route and still says "KNM Proefexamen" on screen. Delete it once nothing links there.
- **Marketing/legal copy still says KNM** in `gebruiksvoorwaarden`, `privacybeleid`, `docent`
  (including the claim "108 KNM-oefenvragen ontwikkeld") and the `oefenvragen` pages. These are
  factual claims about the product and about a real person, so they need the owner's wording, not
  a search-and-replace.
- Legal pages (voorwaarden, privacy, terugbetaling) still describe the KNM product.
- Domain is a placeholder: `inburgeringoefenen.nl`. The Instagram link points at a handle
  that may not exist.
- **The KNM service key was exposed to browsers** via `next.config.ts` before the fork
  (`NEXT_PUBLIC_SUPABASE_ANON_KEY` was mapped from `SUPABASE_SERVICE_KEY`). Fixed here —
  but that key must be rotated.
