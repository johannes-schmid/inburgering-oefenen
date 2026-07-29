# Legacy KNM migrations — reference only, NOT applied

These 26 files are the migration history of the KNM platform this project was forked from.
They are kept out of `supabase/migrations/` deliberately, so Supabase never runs them.
`supabase/migrations/20260729000000_a2_baseline.sql` replaces all of them.

## Why they were squashed rather than extended

The chain **cannot be replayed on an empty database**. `20260506000003_migrate_exam_results_to_submissions.sql`
migrates rows *out of* `public.exam_results` and then drops it — but no migration in this
repo ever creates that table. It was created by hand in the KNM production database. On a
fresh project `supabase db reset` therefore fails:

```
ERROR: relation "public.exam_results" does not exist (SQLSTATE 42P01)
```

So there was no working local database and no way to test a migration before shipping it.
Two guards were added to that file (`to_regclass` around the backfill, `DROP TABLE IF EXISTS`)
purely to prove the rest of the chain was sound and to dump a faithful schema to squash from —
that dump is the ancestor of the A2 baseline.

## What changed in the squash

- **`questions`** reshaped for A2: `skill`, `exam_id`, `sort_order`, and the stimulus columns
  (`stimulus_intro` / `stimulus_html` / `stimulus_script` / `stimulus_audio_url`) that the
  two-pane DUO layout needs. KNM questions had no stimulus — the question stood alone.
  `category` and `exam` are gone; `section_id` stays.
- **`sections`** repurposed as the A2 **sub-skills** (advertentie, gesprek, e-mail …), grouped
  by skill in `topic`. Column names kept because four dashboard surfaces select them.
- **`exams`** is new — the 10 practice exams per skill, replacing the `questions.exam` integer.
- **`open_tasks` / `rubrics` / `open_submissions` / `grading_examples`** are new: Schrijven and
  Spreken, and the docent's rubric-and-few-shot grading loop.
- **`exam_results` recreated.** The KNM chain dropped it while `dashboard/page.tsx`,
  `dashboard/analyse`, `InlineQuiz` and `ProefexamenEngine` all still read or upsert it — those
  reads have been failing on KNM production. It now holds logged-in attempts, with
  `exam_submissions` holding anonymous funnel captures; the split is documented, not accidental.
- **`user_xp_totals` created as a view.** `lib/xp.ts` reads `user_xp_totals.total_xp` and no
  migration ever created it, so that read had never once succeeded.
- **`exam_submissions`** lost `UNIQUE (email, exam_number)` and gained `skill`. With four skills
  the same person doing two tasters collided on that constraint and the second was dropped.
- **`word_cards` / `leren_content`** gained a `skill` column, since a module now bundles the
  lessons and word list for its own skill.
- KNM's seven-topic seed data, and the 366 word cards, are not carried over.
