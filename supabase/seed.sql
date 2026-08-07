-- Local development seed. Runs automatically after `supabase db reset`.
--
-- Structural data only: the 40 exam slots that genuinely exist in the product, and the
-- admin allowlist so /admin is reachable locally. **No exam items.** Placeholder questions
-- would be indistinguishable from real content in the admin UI, and every item this
-- product ships is written by the NT2 docent (see CLAUDE.md). Exams therefore start empty
-- and show "0 vragen" until Phase 6 seeds exam 1 of each skill for real.
--
-- Durations mirror `data/skills.ts`, which is the source of truth:
--   Lezen 65 min · Luisteren 45 min · Schrijven 40 min · Spreken 35 min

-- ── admin allowlist ─────────────────────────────────────────────────────────
INSERT INTO public.admin_users (email) VALUES
  ('johannes@settly.nl')
ON CONFLICT (email) DO NOTHING;

-- ── the 40 A2 exam slots ────────────────────────────────────────────────────
-- Exam 1 of every skill is free and published, so the overview pages and the paywall
-- boundary are both exercisable locally. Exams 2–10 exist but stay unpublished, which is
-- how they render as "Binnenkort" until the docent has authored and reviewed them.
--
-- B1's 40 slots are NOT here — they are created by 20260802000000_b1_level.sql, so that
-- production gets them too. seed.sql only ever runs on a local `db reset`.
INSERT INTO public.exams (level, skill, number, title, is_free, duration_seconds, published)
SELECT
  'a2',
  s.skill,
  n.number,
  format('%s — oefenexamen %s', initcap(s.skill), n.number),
  n.number = 1,
  s.duration_seconds,
  n.number = 1
FROM (VALUES
  ('lezen',     65 * 60),
  ('luisteren', 45 * 60),
  ('schrijven', 40 * 60),
  ('spreken',   35 * 60)
) AS s(skill, duration_seconds)
CROSS JOIN generate_series(1, 10) AS n(number)
ON CONFLICT (level, skill, number) DO NOTHING;

-- ── The per-(level, skill) backlogs ───────────────────────────────────────────
-- Exam number 0 is a holding area for items that have not been assigned to an oefenexamen yet;
-- see 20260804000000_question_backlog.sql for why it is an exam row rather than a nullable exam_id.
--
-- Seeded here as well as in that migration because the two run in different situations: the
-- migration's INSERT reads existing exam rows, which is right for a database that already has them
-- (the hosted project) and a no-op on a fresh `supabase db reset`, where migrations run before this
-- file. Both are `ON CONFLICT DO NOTHING`, so whichever gets there first wins.
INSERT INTO public.exams (level, skill, number, title, duration_seconds, pass_threshold_pct, published, is_free)
SELECT e.level, e.skill, 0, 'Backlog', e.duration_seconds, e.pass_threshold_pct, false, false
FROM public.exams e
WHERE e.number = 1
ON CONFLICT (level, skill, number) DO NOTHING;
