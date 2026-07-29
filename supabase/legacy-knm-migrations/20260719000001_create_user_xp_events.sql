-- Gamification: append-only XP event log + summed totals view.
-- XP measures effort (it only goes up) and is deliberately separate from the
-- slaagkans readiness estimate. One-time bonuses are enforced at the DB level
-- via a partial unique index so re-completing a thema / re-passing an exam
-- cannot double-award. Repeatable 'correct_answer' events are exempt.

create table public.user_xp_events (
  id          bigserial primary key,
  user_id     uuid references auth.users not null,
  source      text not null
              check (source in ('correct_answer', 'first_mastery', 'leren_complete', 'wordcard_known', 'exam_completed', 'exam_passed')),
  ref_id      int,
  points      int not null,
  created_at  timestamptz default now()
);

alter table public.user_xp_events enable row level security;

create policy "Users manage own xp events"
  on public.user_xp_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_uxe_user on public.user_xp_events(user_id);

-- Idempotent one-time awards: at most one row per (user, source, ref) for every
-- source except the repeatable 'correct_answer'.
create unique index uq_uxe_once
  on public.user_xp_events(user_id, source, ref_id)
  where source <> 'correct_answer';

-- O(1)-per-user totals for the XP pill / level display.
create view public.user_xp_totals
  with (security_invoker = true) as
  select user_id, sum(points)::int as total_xp, count(*)::int as events
  from public.user_xp_events
  group by user_id;

-- Growing append-only history: speeds up the per-user queue/progression reads
-- that order user_question_results by answered_at.
create index if not exists idx_uqr_user_answered
  on public.user_question_results(user_id, answered_at);
