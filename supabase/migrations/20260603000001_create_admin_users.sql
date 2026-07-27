-- Admin users table — the security allowlist for the teacher CMS
-- RLS write policies on questions/word_cards/leren_content reference this table.

create table public.admin_users (
  email text primary key
);

alter table public.admin_users enable row level security;

-- Only admins can read the admin_users table
create policy "Admins read admin_users"
  on public.admin_users for select
  using (auth.jwt()->>'email' = email);

-- Seed the two allowlisted admins
insert into public.admin_users (email) values
  ('schmid.johannes90@gmail.com'),
  ('ambervdz11@gmail.com');
