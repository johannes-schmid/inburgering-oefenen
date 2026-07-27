create table public.user_word_card_progress (
  id             bigserial primary key,
  user_id        uuid references auth.users not null,
  word_card_id   int references public.word_cards(id) not null,
  status         text not null default 'unseen'
                 check (status in ('unseen', 'seen', 'known', 'learning')),
  seen_count     int not null default 0,
  last_seen_at   timestamptz,
  updated_at     timestamptz default now(),
  unique (user_id, word_card_id)
);

alter table public.user_word_card_progress enable row level security;

create policy "Users manage own word card progress"
  on public.user_word_card_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_uwcp_user on public.user_word_card_progress(user_id);
create index idx_uwcp_card on public.user_word_card_progress(word_card_id);
