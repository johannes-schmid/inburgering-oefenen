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

-- ── the 40 exam slots ───────────────────────────────────────────────────────
-- Exam 1 of every skill is free and published, so the overview pages and the paywall
-- boundary are both exercisable locally. Exams 2–10 exist but stay unpublished, which is
-- how they render as "Binnenkort" until the docent has authored and reviewed them.
INSERT INTO public.exams (skill, number, title, is_free, duration_seconds, published)
SELECT
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
ON CONFLICT (skill, number) DO NOTHING;
