create table public.user_section_progress (
    id           bigserial primary key,
    user_id      uuid references auth.users not null,
    section_id   smallint references public.sections(id) not null,
    completed    boolean not null default false,
    completed_at timestamptz,
    updated_at   timestamptz default now(),
    unique (user_id, section_id)
  );

  alter table public.user_section_progress enable row level security;

  create policy "Users manage own section progress"
    on public.user_section_progress for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  create index idx_usp_user    on public.user_section_progress(user_id);
  create index idx_usp_section on public.user_section_progress(section_id);