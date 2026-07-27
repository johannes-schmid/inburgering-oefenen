-- Flag marking a question as part of the free /oefenen practice set.
-- Independent of `exam` — a question can be in both an exam and the practice set.
alter table public.questions
  add column if not exists oefenen boolean not null default false;

create index if not exists questions_oefenen_idx
  on public.questions (oefenen)
  where oefenen;
