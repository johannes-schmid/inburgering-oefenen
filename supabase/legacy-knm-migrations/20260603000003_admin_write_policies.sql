-- Write RLS policies for admin CMS
-- All writes are gated on the caller's JWT email being in admin_users.
-- RLS on each table is already enabled; this adds the write policies.

-- Helper: is the current JWT email an admin?
-- (Inline — avoids a separate function that could be bypassed.)

-- questions
create policy "Admins insert questions"
  on public.questions for insert
  with check (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

create policy "Admins update questions"
  on public.questions for update
  using (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

create policy "Admins delete questions"
  on public.questions for delete
  using (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

-- word_cards
create policy "Admins insert word_cards"
  on public.word_cards for insert
  with check (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

create policy "Admins update word_cards"
  on public.word_cards for update
  using (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

create policy "Admins delete word_cards"
  on public.word_cards for delete
  using (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

-- leren_content
create policy "Admins insert leren_content"
  on public.leren_content for insert
  with check (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

create policy "Admins update leren_content"
  on public.leren_content for update
  using (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

create policy "Admins delete leren_content"
  on public.leren_content for delete
  using (
    exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
  );

-- updated_at trigger for leren_content
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leren_content_updated_at
  before update on public.leren_content
  for each row execute procedure public.set_updated_at();
