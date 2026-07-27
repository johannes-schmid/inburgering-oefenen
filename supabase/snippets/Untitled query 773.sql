
  drop table if exists public.user_section_progress;

  create table public.user_leren_progress (
    id             bigserial primary key,
    user_id        uuid references auth.users not null,
    thema_id       int not null check (thema_id between 1 and 7),
    max_section    int not null default 0,
    completed      boolean not null default false,
    completed_at   timestamptz,
    updated_at     timestamptz default now(),
    unique (user_id, thema_id)
  );

  alter table public.user_leren_progress enable row level security;

  create policy "Users manage own leren progress"
    on public.user_leren_progress for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  create index idx_ulp_user on public.user_leren_progress(user_id);