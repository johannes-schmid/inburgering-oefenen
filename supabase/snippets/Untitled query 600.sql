create table public.leren_content (
    id          serial primary key,
    theme_id    int not null check (theme_id between 1 and 7),
    anchor      text not null,
    icon        text not null default 'menu_book',
    heading     text not null,
    subtitle    text not null default '',
    body_html   text not null default '',
    sort_order  int not null default 0,
    updated_at  timestamptz default now()
  );
  
  alter table public.leren_content enable row level security;
  
  create policy "Public read leren_content"
    on public.leren_content for select
    using (true);
    
  alter table public.leren_content add constraint leren_content_theme_anchor unique (theme_id, anchor);
  create index leren_content_theme_id_sort on public.leren_content (theme_id, sort_order);