create table public.word_cards (
  id               int primary key,
  theme_id         int not null check (theme_id between 1 and 7),
  theme_name       text not null,
  dutch            text not null,
  article          varchar(3) check (article in ('de', 'het', '')),
  plural           text,
  dutch_description text,
  dutch_example    text,
  translation_en   text,
  description_en   text,
  translation_ar   text,
  description_ar   text,
  translation_tr   text,
  description_tr   text,
  sort_order       int not null default 0,
  created_at       timestamptz default now()
);

alter table public.word_cards enable row level security;

create policy "Public read word_cards"
  on public.word_cards for select using (true);

create index idx_word_cards_theme on public.word_cards(theme_id);
