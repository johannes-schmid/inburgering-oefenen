-- Leren content table — one row per section per theme
-- Replaces the static data/leren/thema-*.ts files as content source.

create table public.leren_content (
  id          serial primary key,
  theme_id    int not null check (theme_id between 1 and 7),
  anchor      text not null,                -- matches LerenSection.id (e.g. 'kaart')
  icon        text not null default 'menu_book',
  heading     text not null,
  subtitle    text not null default '',
  body_html   text not null default '',
  sort_order  int not null default 0,
  updated_at  timestamptz default now()
);

alter table public.leren_content enable row level security;

-- Public read (same as questions / word_cards)
create policy "Public read leren_content"
  on public.leren_content for select
  using (true);

-- Unique constraint used by the import script's upsert
alter table public.leren_content add constraint leren_content_theme_anchor unique (theme_id, anchor);

-- Index for the most common query: fetch all sections for a theme
create index leren_content_theme_id_sort on public.leren_content (theme_id, sort_order);
