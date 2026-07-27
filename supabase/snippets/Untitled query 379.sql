
  alter table questions
    add column if not exists updated_at    timestamptz not null default now(),
    add column if not exists review_status text not null default 'pending'
      check (review_status in ('pending', 'validated')),
    add column if not exists reviewed_at   timestamptz;

  create or replace function public.questions_track_changes()
  returns trigger language plpgsql as $$
  begin
    new.updated_at = now();
    if new.review_status is distinct from old.review_status then
      new.reviewed_at = now();
    end if;
    return new;
  end;
  $$;

  drop trigger if exists questions_track_changes on questions;
  create trigger questions_track_changes
    before update on questions
    for each row execute procedure public.questions_track_changes();