create table sections (
  id          smallserial primary key,
  topic       text not null,
  slug        text not null unique,
  name_nl     text not null,
  rationale   text,
  sort_order  int not null default 0,
  created_at  timestamptz default now()
);

alter table sections enable row level security;
create policy "Public read" on sections for select using (true);
