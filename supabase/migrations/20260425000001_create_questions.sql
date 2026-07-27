create table questions (
  id          int primary key,
  category    text not null,
  question    text not null,
  option_a    text not null,
  option_b    text not null,
  option_c    text not null,
  correct     char(1) not null check (correct in ('A','B','C')),
  explanation text not null,
  image_url   text,
  exam        int,
  created_at  timestamptz default now()
);

alter table questions enable row level security;
create policy "Public read" on questions for select using (true);
