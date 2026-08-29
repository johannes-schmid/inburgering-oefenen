-- AI usage and cost, one row per paid provider call.
--
-- Rubric grading spends money on two providers per Spreken answer (Scribe + the grading model) and
-- one per Schrijven answer, and until now nothing recorded that. "What did nakijken cost this
-- month" was unanswerable, so the only lever on cost — the model choice in `lib/ai/gateway.ts` —
-- could not be judged against anything.
--
-- The row is written by `lib/ai/usage.ts` on the service key, after the call, and its failure never
-- fails the grade: a bookkeeping miss must not cost a candidate their feedback.
--
-- `cost_usd` is the **billed** figure where the provider reports one (the AI Gateway returns it in
-- `providerMetadata.gateway.cost`) and our own arithmetic otherwise; `cost_estimated` says which,
-- because an estimate presented as a bill is the one number here nobody could correct later.
create table if not exists ai_usage (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  -- What was paid for. `grade_text` is Schrijven, `grade_audio` is Spreken's grading call, and
  -- `transcribe` is Scribe — kept apart because a Spreken check is the sum of the last two and the
  -- whole point of the panel is seeing which half is expensive.
  kind         text        not null check (kind in ('grade_text', 'grade_audio', 'transcribe')),
  provider     text        not null,
  model        text        not null,
  -- The onderdeel this call was for. Nullable: a future non-exam call has none.
  skill        text                 references skills (slug),
  level        text,
  submission_id bigint,
  -- One grade is one *check* as the owner counts them; a Spreken check is two rows sharing this.
  -- Grouping on it is what makes "gemiddelde kosten per nakijkactie" a real average rather than an
  -- average per API call.
  request_id   text        not null,
  input_tokens  integer,
  output_tokens integer,
  audio_seconds numeric(10, 2),
  cost_usd     numeric(12, 6) not null default 0,
  cost_estimated boolean   not null default true,
  ok           boolean     not null default true,
  error        text
);

create index if not exists ai_usage_created_at_idx on ai_usage (created_at desc);
create index if not exists ai_usage_kind_created_idx on ai_usage (kind, created_at desc);
create index if not exists ai_usage_request_idx on ai_usage (request_id);

alter table ai_usage enable row level security;

-- Admins read; nobody else, and no client writes at all. A candidate has no business knowing what
-- their answer cost, and a writable usage log is a way to forge the only cost record there is.
drop policy if exists "ai_usage admin read" on ai_usage;
create policy "ai_usage admin read" on ai_usage
  for select using (public.is_admin());
